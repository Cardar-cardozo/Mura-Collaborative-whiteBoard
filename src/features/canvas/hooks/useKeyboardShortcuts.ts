/**
 * useKeyboardShortcuts
 *
 * Global keyboard listeners for undo/redo/paste, wired directly to Zustand
 * actions so no stale closures are involved.
 */
import { useEffect } from 'react';
import { useBoardStore } from '../../../store/useBoardStore';


export function useKeyboardShortcuts() {
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
        case 'v':
          pasteNote();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // ← empty deps: getState() reads are always fresh
}
