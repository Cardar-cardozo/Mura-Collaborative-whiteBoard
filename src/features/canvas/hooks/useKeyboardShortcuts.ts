import { useEffect } from 'react';
import { useBoardStore } from '../../../store/useBoardStore';
import { useCreateElement } from '../../../hooks/queries/useBoardQueries';

export function useKeyboardShortcuts() {
  const { mutate: createElement } = useCreateElement();
  const boardId = useBoardStore(s => s.boardId);
  const authorName = useBoardStore(s => s.authorName);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (!cmdOrCtrl) return;

      const { undo, redo, pasteNote } = useBoardStore.getState();

      switch (e.key) {
        case 'z':
        case 'Z':
          e.shiftKey ? redo() : undo();
          e.preventDefault();
          break;
        case 'y':
          redo();
          e.preventDefault();
          break;
        case 'v': {
          const pastedNote = pasteNote();
          if (pastedNote && boardId) {
            createElement({ boardId, elementType: 'note', data: pastedNote, author: authorName || 'Guest' });
          }
          e.preventDefault();
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [createElement, boardId, authorName]); // ← depend on mutation and state values
}
