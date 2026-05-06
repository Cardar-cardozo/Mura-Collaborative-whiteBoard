import { io, Socket } from 'socket.io-client';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  joinBoard(boardId: string, username: string) {
    if (this.socket) {
      this.socket.emit('join-board', { boardId, username });
    }
  }

  emitCursorMove(boardId: string, x: number, y: number, username: string) {
    if (this.socket) {
      this.socket.emit('cursor-move', { boardId, x, y, username });
    }
  }

  emitStrokeDraw(boardId: string, stroke: any) {
    if (this.socket) {
      this.socket.emit('stroke-draw', { boardId, stroke });
    }
  }

  emitClearBoard(boardId: string) {
    if (this.socket) {
      this.socket.emit('clear-board', { boardId });
    }
  }

  emitRevertBoard(boardId: string, snapshotId: string) {
    if (this.socket) {
      this.socket.emit('revert-board', { boardId, snapshotId });
    }
  }

  emitNoteAdd(boardId: string, note: any) {
    if (this.socket) {
      this.socket.emit('note-add', { boardId, note });
    }
  }

  emitNoteUpdate(boardId: string, noteId: string, updates: any) {
    if (this.socket) {
      this.socket.emit('note-update', { boardId, noteId, updates });
    }
  }

  emitNoteDelete(boardId: string, noteId: string) {
    if (this.socket) {
      this.socket.emit('note-delete', { boardId, noteId });
    }
  }

  emitImageAdd(boardId: string, image: any) {
    if (this.socket) {
      this.socket.emit('image-add', { boardId, image });
    }
  }

  emitImageUpdate(boardId: string, imageId: string, updates: any) {
    if (this.socket) {
      this.socket.emit('image-update', { boardId, imageId, updates });
    }
  }

  emitImageDelete(boardId: string, imageId: string) {
    if (this.socket) {
      this.socket.emit('image-delete', { boardId, imageId });
    }
  }

  emitStrokeErase(boardId: string, strokeIds: string[]) {
    if (this.socket) {
      this.socket.emit('stroke-erase', { boardId, strokeIds });
    }
  }

  emitCallSignal(boardId: string, signal: any, to?: string) {
    if (this.socket) {
      this.socket.emit('call-signal', { boardId, signal, to });
    }
  }
}

export const socketService = new SocketService();
