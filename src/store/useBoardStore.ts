import { create } from 'zustand';
import type { Note, Stroke, BoardSnapshot } from '../core/types';
import { MAX_HISTORY_SIZE, NOTE_COLORS } from '../core/constants';
import { randomId } from '../lib/math';
import { socketService } from '../api/socket';
import { elementService } from '../api/element.service';

interface BoardState {
  boardId: string | null;
  boardName: string;
  // ─── Elements ─────────────────────────────────────────────────────────────
  notes: Note[];
  strokes: Stroke[];
  currentStroke: Stroke | null;

  // ─── Participants ─────────────────────────────────────────────────────────
  participants: import('../core/types').Participant[];

  // ─── History ──────────────────────────────────────────────────────────────
  history: BoardSnapshot[];
  redoStack: BoardSnapshot[];

  copiedNote: Note | null;
  authorName: string | null;
  leaderName: string | null;

  // ─── Actions ──────────────────────────────────────────────────────────────
  initBoard: (boardId: string, authorName: string) => Promise<void>;
  disconnect: () => void;
  setAuthorName: (name: string) => void;
  /** Snapshot current state before a destructive action */
  saveToHistory: () => void;

  // Notes
  addNote: (transform: { x: number; y: number; scale: number }) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  copyNote: (note: Note) => void;
  pasteNote: () => void;

  // Strokes
  beginStroke: (stroke: Stroke) => void;
  appendStrokePoint: (x: number, y: number) => void;
  commitStroke: () => void;
  eraseStrokes: (ids: string[]) => void;

  // Remote Actions (don't emit back to socket)
  remoteAddNote: (note: Note) => void;
  remoteUpdateNote: (id: string, updates: Partial<Note>) => void;
  remoteDeleteNote: (id: string) => void;
  remoteAddStroke: (stroke: Stroke) => void;
  remoteClearBoard: () => void;
  remoteEraseStrokes: (ids: string[]) => void;
  remoteSetElements: (notes: Note[], strokes: Stroke[]) => void;
  updateParticipant: (id: string, updates: Partial<import('../core/types').Participant>) => void;
  removeParticipant: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Bulk reset
  clearAll: () => void;
}

export const useBoardStore = create<BoardState>()((set, get) => ({
  boardId: null,
  boardName: 'Workspace',
  notes: [],
  strokes: [],
  currentStroke: null,
  participants: [],
  history: [],
  redoStack: [],
  copiedNote: null,
  authorName: null,
  leaderName: null,

  initBoard: async (boardId, authorName) => {
    set({ boardId, authorName });
    
    try {
      const { boardService } = await import('../api/board.service');
      const board = await boardService.getBoardById(boardId);
      if (board) set({ boardName: board.name, leaderName: board.leaderName });
    } catch (e) {
      console.error('Failed to fetch board details', e);
    }

    // Connect to WebSocket
    const socket = socketService.connect();
    socketService.joinBoard(boardId, authorName);

    // Setup Socket Listeners
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
      // Re-fetch elements
      const elements = await elementService.getElementsByBoardId(boardId);
      const notes = elements.filter(e => e.elementType === 'note').map(e => e.data);
      const strokes = elements.filter(e => e.elementType === 'stroke').map(e => e.data);
      get().remoteSetElements(notes, strokes);
    });

    socket.on('user-joined', ({ id, username }: { id: string, username: string }) => {
      // Add participant
      get().updateParticipant(id, { id, name: username, x: 0, y: 0 });
      
      // Play a soft join "pop" via Web Audio API
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
        // AudioContext not available — no-op
      }
    });

    socket.on('user-left', ({ id }: { id: string }) => {
      get().removeParticipant(id);
    });

    socket.on('cursor-moved', ({ id, x, y, username }: { id: string, x: number, y: number, username?: string }) => {
      get().updateParticipant(id, { id, x, y, ...(username && { name: username }) });
    });

    // Note real-time sync
    socket.on('note-added', (note: Note) => {
      get().remoteAddNote(note);
    });

    socket.on('note-updated', ({ noteId, updates }: { noteId: string; updates: Partial<Note> }) => {
      get().remoteUpdateNote(noteId, updates);
    });

    socket.on('note-deleted', ({ noteId }: { noteId: string }) => {
      get().remoteDeleteNote(noteId);
    });

    // Fetch initial elements
    try {
      const elements = await elementService.getElementsByBoardId(boardId);
      const notes = elements.filter(e => e.elementType === 'note').map(e => e.data);
      const strokes = elements.filter(e => e.elementType === 'stroke').map(e => e.data);
      get().remoteSetElements(notes, strokes);
    } catch (e) {
      console.error('Failed to fetch elements', e);
    }
  },

  disconnect: () => {
    socketService.disconnect();
    set({ boardId: null, notes: [], strokes: [], history: [], redoStack: [] });
  },

  setAuthorName: (name) => set({ authorName: name }),

  // ── Helpers ──────────────────────────────────────────────────────────
  saveToHistory() {
    const { notes, strokes, history } = get();
    set({
      history: [...history.slice(-(MAX_HISTORY_SIZE - 1)), { notes, strokes }],
      redoStack: [],
    });
  },

  // ── Note actions ─────────────────────────────────────────────────────
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
      // Real-time broadcast
      socketService.emitNoteAdd(boardId, newNote);
      // Persist to DB
      elementService.bulkCreateElements([{ boardId, elementType: 'note', data: newNote, author: get().authorName || 'Guest' }]);
    }
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
      // Always broadcast all changes in real-time (text, position, color, lock)
      socketService.emitNoteUpdate(boardId, id, updates);
      // Persist content and lock changes to DB (avoid DB writes on every drag frame)
      if (note && significantChange && !('x' in updates) && !('y' in updates)) {
        elementService.bulkCreateElements([{ boardId, elementType: 'note', data: note, author: get().authorName || 'Guest' }]);
      }
    }
  },

  deleteNote(id) {
    get().saveToHistory();
    set(s => ({ notes: s.notes.filter(n => n.id !== id) }));
    const boardId = get().boardId;
    if (boardId) {
      socketService.emitNoteDelete(boardId, id);
      elementService.deleteElements(boardId, [id]);
    }
  },

  copyNote(note) {
    set({ copiedNote: note });
  },

  pasteNote() {
    const { copiedNote } = get();
    if (!copiedNote) return;
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
      // Real-time broadcast
      socketService.emitNoteAdd(boardId, newNote);
      // Persist to DB
      elementService.bulkCreateElements([{ boardId, elementType: 'note', data: newNote, author: get().authorName || 'Guest' }]);
    }
  },

  // ── Stroke actions ───────────────────────────────────────────────────
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
    if (!currentStroke) return;
    get().saveToHistory();
    
    const finalStroke = { ...currentStroke, author: authorName || undefined };
    set(s => ({
      strokes: [...s.strokes, finalStroke],
      currentStroke: null,
    }));

    if (boardId) {
      // Real-time emit
      socketService.emitStrokeDraw(boardId, finalStroke);
      // Persist to DB
      elementService.bulkCreateElements([{ boardId, elementType: 'stroke', data: finalStroke, author: authorName || 'Guest' }]);
    }
  },

  eraseStrokes(ids) {
    if (ids.length === 0) return;
    get().saveToHistory();
    set(s => ({ strokes: s.strokes.filter(st => !ids.includes(st.id)) }));
    
    const boardId = get().boardId;
    if (boardId) {
      socketService.emitStrokeErase(boardId, ids);
      elementService.deleteElements(boardId, ids);
    }
  },

  // ── Remote Actions ───────────────────────────────────────────────────
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
    set({ notes: [], strokes: [] });
  },
  remoteEraseStrokes(ids) {
    set(s => ({ strokes: s.strokes.filter(st => !ids.includes(st.id)) }));
  },
  remoteSetElements(notes, strokes) {
    set({ notes, strokes });
  },

  // ── Participants ─────────────────────────────────────────────────────
  updateParticipant(id, updates) {
    set(s => {
      const exists = s.participants.some(p => p.id === id);
      if (exists) {
        return { participants: s.participants.map(p => p.id === id ? { ...p, ...updates } : p) };
      } else {
        // If it doesn't exist and we have the necessary info, add it
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

  // ── History ──────────────────────────────────────────────────────────
  undo() {
    const { history, notes, strokes, redoStack } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      notes: prev.notes,
      strokes: prev.strokes,
      history: history.slice(0, -1),
      redoStack: [...redoStack, { notes, strokes }],
    });
  },

  redo() {
    const { redoStack, notes, strokes, history } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      notes: next.notes,
      strokes: next.strokes,
      redoStack: redoStack.slice(0, -1),
      history: [...history, { notes, strokes }],
    });
  },

  // ── Clear ─────────────────────────────────────────────────────────────
  clearAll() {
    get().saveToHistory();
    set({ notes: [], strokes: [] });
    
    const boardId = get().boardId;
    if (boardId) {
      socketService.emitClearBoard(boardId);
      // Backend clear board endpoint if available, else this relies on creating a snapshot or is transient
    }
  },
}));
