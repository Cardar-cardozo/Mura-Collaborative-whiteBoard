import { create } from 'zustand';
import type { Note, Stroke, BoardSnapshot, BoardImage } from '../core/types';
import { MAX_HISTORY_SIZE, NOTE_COLORS } from '../core/constants';
import { randomId } from '../lib/math';
import { socketService } from '../api/socket';


interface BoardState {
  boardId: string | null;
  boardName: string;

  notes: Note[];
  strokes: Stroke[];
  images: BoardImage[];
  currentStroke: Stroke | null;

  participants: import('../core/types').Participant[];

  history: BoardSnapshot[];
  redoStack: BoardSnapshot[];

  copiedNote: Note | null;
  authorName: string | null;
  leaderName: string | null;

  initBoard: (boardId: string, authorName: string) => Promise<void>;
  disconnect: () => void;
  setAuthorName: (name: string) => void;
  
  saveToHistory: () => void;

  addNote: (transform: { x: number; y: number; scale: number }) => Note;
  updateNote: (id: string, updates: Partial<Note>) => Note | undefined;
  deleteNote: (id: string) => void;
  copyNote: (note: Note) => void;
  pasteNote: () => Note | undefined;

  beginStroke: (stroke: Stroke) => void;
  appendStrokePoint: (x: number, y: number) => void;
  commitStroke: () => Stroke | undefined;
  eraseStrokes: (ids: string[]) => void;

  addImage: (image: BoardImage) => BoardImage;
  updateImage: (id: string, updates: Partial<BoardImage>) => BoardImage | undefined;
  deleteImage: (id: string) => void;
  remoteAddImage: (image: BoardImage) => void;

  remoteAddNote: (note: Note) => void;
  remoteUpdateNote: (id: string, updates: Partial<Note>) => void;
  remoteDeleteNote: (id: string) => void;
  remoteAddStroke: (stroke: Stroke) => void;
  remoteClearBoard: () => void;
  remoteEraseStrokes: (ids: string[]) => void;
  remoteSetElements: (notes: Note[], strokes: Stroke[], images?: BoardImage[]) => void;
  updateParticipant: (id: string, updates: Partial<import('../core/types').Participant>) => void;
  removeParticipant: (id: string) => void;
  setBoardInfo: (name: string, leader: string) => void;

  undo: () => void;
  redo: () => void;

  clearAll: () => void;
}

export const useBoardStore = create<BoardState>()((set, get) => ({
  boardId: null,
  boardName: 'Workspace',
  notes: [],
  strokes: [],
  images: [],
  currentStroke: null,
  participants: [],
  history: [],
  redoStack: [],
  copiedNote: null,
  authorName: null,
  leaderName: null,

  initBoard: async (boardId, authorName) => {
    set({ boardId, authorName });

    const socket = socketService.connect();
    socketService.joinBoard(boardId, authorName);

    socket.off('stroke-drawn');
    socket.off('board-cleared');
    socket.off('board-reverted');
    socket.off('element-updated');
    socket.off('user-joined');
    socket.off('user-left');
    socket.off('cursor-moved');
    socket.off('note-added');
    socket.off('note-updated');
    socket.off('note-deleted');
    socket.off('strokes-erased');

    socket.on('stroke-drawn', (stroke: Stroke) => {
      get().remoteAddStroke(stroke);
    });

    socket.on('strokes-erased', ({ strokeIds }: { strokeIds: string[] }) => {
      get().remoteEraseStrokes(strokeIds);
    });

    socket.on('board-cleared', () => {
      get().remoteClearBoard();
    });

    socket.on('board-reverted', async () => {
      // Revert event received. TanStack Query should refetch.
      // We don't fetch elements here anymore.
    });

    socket.on('user-joined', ({ id, username }: { id: string, username: string }) => {

      get().updateParticipant(id, { id, name: username, x: 0, y: 0 });

      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {

      }
    });

    socket.on('user-left', ({ id }: { id: string }) => {
      get().removeParticipant(id);
    });

    socket.on('cursor-moved', ({ id, x, y, username }: { id: string, x: number, y: number, username?: string }) => {
      get().updateParticipant(id, { id, x, y, ...(username && { name: username }) });
    });

    socket.on('note-added', (note: Note) => {
      get().remoteAddNote(note);
    });

    socket.on('note-updated', ({ noteId, updates }: { noteId: string; updates: Partial<Note> }) => {
      get().remoteUpdateNote(noteId, updates);
    });

    socket.on('note-deleted', ({ noteId }: { noteId: string }) => {
      get().remoteDeleteNote(noteId);
    });

    socket.on('image-added', (image: BoardImage) => {
      get().remoteAddImage(image);
    });

    socket.on('image-updated', ({ imageId, updates }: { imageId: string; updates: Partial<BoardImage> }) => {

      set(s => ({ images: s.images.map(img => img.id === imageId ? { ...img, ...updates } : img) }));
    });

    socket.on('image-deleted', ({ imageId }: { imageId: string }) => {

      set(s => ({ images: s.images.filter(img => img.id !== imageId) }));
    });

    // Initial elements are now fetched by TanStack Query and passed via remoteSetElements
  },

  disconnect: () => {
    socketService.disconnect();
    set({ boardId: null, notes: [], strokes: [], history: [], redoStack: [] });
  },

  setAuthorName: (name) => set({ authorName: name }),

  saveToHistory() {
    const { notes, strokes, images, history } = get();
    set({
      history: [...history.slice(-(MAX_HISTORY_SIZE - 1)), { notes, strokes, images }],
      redoStack: [],
    });
  },

  addNote(transform) {
    get().saveToHistory();
    const newNote: Note = {
      id: randomId(),
      x: -transform.x / transform.scale + (window.innerWidth  / 2 - 100) / transform.scale,
      y: -transform.y / transform.scale + (window.innerHeight / 2 - 100) / transform.scale,
      content: '',
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      rotation: Math.random() * 6 - 3,
      isLocked: false,
      author: get().authorName || undefined,
    };
    set(s => ({ notes: [...s.notes, newNote] }));
    
    const boardId = get().boardId;
    if (boardId) {
      socketService.emitNoteAdd(boardId, newNote);
    }
    return newNote;
  },

  updateNote(id, updates) {
    const { notes } = get();
    const significantChange = 'isLocked' in updates || 'color' in updates || 'content' in updates || 'x' in updates || 'y' in updates;
    if ('isLocked' in updates || 'color' in updates) get().saveToHistory();
    
    const updatedNotes = notes.map(n => (n.id === id ? { ...n, ...updates } : n));
    set({ notes: updatedNotes });

    const boardId = get().boardId;
    const note = updatedNotes.find(n => n.id === id);
    if (boardId) {
      socketService.emitNoteUpdate(boardId, id, updates);
    }
    return note;
  },

  deleteNote(id) {
    get().saveToHistory();
    set(s => ({ notes: s.notes.filter(n => n.id !== id) }));
    const boardId = get().boardId;
    if (boardId) {
      socketService.emitNoteDelete(boardId, id);
    }
  },

  copyNote(note) {
    set({ copiedNote: note });
  },

  pasteNote() {
    const { copiedNote } = get();
    if (!copiedNote) return undefined;
    get().saveToHistory();
    const newNote: Note = {
      ...copiedNote,
      id: randomId(),
      x: copiedNote.x + 20,
      y: copiedNote.y + 20,
      rotation: Math.random() * 6 - 3,
      isLocked: false,
    };
    set(s => ({ notes: [...s.notes, newNote] }));
    
    const boardId = get().boardId;
    if (boardId) {
      socketService.emitNoteAdd(boardId, newNote);
    }
    return newNote;
  },

  addImage(image) {
    get().saveToHistory();
    set(s => ({ images: [...s.images, image] }));

    const boardId = get().boardId;
    if (boardId) {
      socketService.emitImageAdd(boardId, image);
    }
    return image;
  },

  updateImage(id, updates) {
    let updatedImage: BoardImage | undefined;
    set(s => {
      const nextImages = s.images.map(img => {
        if (img.id === id) {
          updatedImage = { ...img, ...updates };
          return updatedImage;
        }
        return img;
      });
      return { images: nextImages };
    });

    const boardId = get().boardId;
    if (boardId && updatedImage) {
      socketService.emitImageUpdate(boardId, id, updates);
    }
    return updatedImage;
  },

  deleteImage(id) {
    get().saveToHistory();
    set(s => ({ images: s.images.filter(img => img.id !== id) }));

    const boardId = get().boardId;
    if (boardId) {
      socketService.emitImageDelete(boardId, id);
    }
  },

  remoteAddImage(image) {
    set(s => ({ images: [...s.images.filter(i => i.id !== image.id), image] }));
  },

  beginStroke(stroke) {
    set({ currentStroke: stroke });
  },

  appendStrokePoint(x, y) {
    set(s => ({
      currentStroke: s.currentStroke
        ? { ...s.currentStroke, points: [...s.currentStroke.points, { x, y }] }
        : null,
    }));
  },

  commitStroke() {
    const { currentStroke, boardId, authorName } = get();
    if (!currentStroke) return undefined;
    get().saveToHistory();
    
    const finalStroke = { ...currentStroke, author: authorName || undefined };
    set(s => ({
      strokes: [...s.strokes, finalStroke],
      currentStroke: null,
    }));

    if (boardId) {
      socketService.emitStrokeDraw(boardId, finalStroke);
    }
    return finalStroke;
  },

  eraseStrokes(ids) {
    if (ids.length === 0) return;
    get().saveToHistory();
    set(s => ({ strokes: s.strokes.filter(st => !ids.includes(st.id)) }));
    
    const boardId = get().boardId;
    if (boardId) {
      socketService.emitStrokeErase(boardId, ids);
    }
  },

  remoteAddNote(note) {
    set(s => ({ notes: [...s.notes.filter(n => n.id !== note.id), note] }));
  },
  remoteUpdateNote(id, updates) {
    set(s => ({ notes: s.notes.map(n => (n.id === id ? { ...n, ...updates } : n)) }));
  },
  remoteDeleteNote(id) {
    set(s => ({ notes: s.notes.filter(n => n.id !== id) }));
  },
  remoteAddStroke(stroke) {
    set(s => ({ strokes: [...s.strokes.filter(st => st.id !== stroke.id), stroke] }));
  },
  remoteClearBoard() {
    set({ notes: [], strokes: [], images: [] });
  },
  remoteEraseStrokes(ids) {
    set(s => ({ strokes: s.strokes.filter(st => !ids.includes(st.id)) }));
  },
  remoteSetElements(notes, strokes, images = []) {
    set({ notes, strokes, images });
  },

  setBoardInfo(name, leader) {
    set({ boardName: name, leaderName: leader });
  },

  updateParticipant(id, updates) {
    set(s => {
      const exists = s.participants.some(p => p.id === id);
      if (exists) {
        return { participants: s.participants.map(p => p.id === id ? { ...p, ...updates } : p) };
      } else {

        if (updates.name !== undefined) {
           return { participants: [...s.participants, { id, name: updates.name, x: updates.x || 0, y: updates.y || 0 }] };
        }
        return s;
      }
    });
  },

  removeParticipant(id) {
    set(s => ({ participants: s.participants.filter(p => p.id !== id) }));
  },

  undo() {
    const { history, notes, strokes, images, redoStack } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      notes: prev.notes,
      strokes: prev.strokes,
      images: prev.images ?? [],
      history: history.slice(0, -1),
      redoStack: [...redoStack, { notes, strokes, images }],
    });
  },

  redo() {
    const { redoStack, notes, strokes, images, history } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      notes: next.notes,
      strokes: next.strokes,
      images: next.images ?? [],
      redoStack: redoStack.slice(0, -1),
      history: [...history, { notes, strokes, images }],
    });
  },

  clearAll() {
    get().saveToHistory();
    set({ notes: [], strokes: [], images: [] });
    
    const boardId = get().boardId;
    if (boardId) {
      socketService.emitClearBoard(boardId);

    }
  },
}));
