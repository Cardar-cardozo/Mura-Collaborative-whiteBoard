import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { useViewStore } from '../../../store/useViewStore';
import { useUIStore } from '../../../store/useUIStore';
import { penOnPointerDown, penOnPointerMove, penOnPointerUp } from '../../tools/pen';
import { eraserOnPointerDown, eraserOnPointerMove, eraserOnPointerUp } from '../../tools/shapes';
import { selectOnPointerDown, selectOnPointerMove, selectOnPointerUp } from '../../tools/select';
import type { SelectPointerState } from '../../tools/select';
import { useBoardStore } from '../../../store/useBoardStore';
import { useCreateElement, useDeleteElements } from '../../../hooks/queries/useBoardQueries';

export function useCanvasEvents(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { mutate: createElement } = useCreateElement();
  const { mutate: deleteElements } = useDeleteElements();
  const boardId = useBoardStore(s => s.boardId);
  const authorName = useBoardStore(s => s.authorName);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const selectState = useRef<SelectPointerState>({ isPanning: false });

  const getRect = () => containerRef.current?.getBoundingClientRect();

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    useViewStore.getState().handleWheel(e.deltaX, e.deltaY, e.ctrlKey || e.metaKey);
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent) => {
    const rect = getRect();
    const transform = useViewStore.getState().transform;
    const { appMode, brushSettings, eraserSettings } = useUIStore.getState();

    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (appMode === 'pen' && rect) {
      penOnPointerDown(e, rect, transform, brushSettings);
    } else if (appMode === 'eraser' && rect) {
      const ids = eraserOnPointerDown(e, rect, transform, eraserSettings);
      if (ids.length > 0 && boardId) deleteElements({ boardId, ids });
    } else {
      selectState.current = selectOnPointerDown(e, transform);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.MouseEvent) => {
    const rect = getRect();
    const transform = useViewStore.getState().transform;
    const { appMode, eraserSettings } = useUIStore.getState();

    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (appMode === 'pen' && rect) {
      penOnPointerMove(e, rect, transform);
    } else if (appMode === 'eraser' && rect) {
      const ids = eraserOnPointerMove(e, rect, transform, eraserSettings);
      if (ids.length > 0 && boardId) deleteElements({ boardId, ids });
    } else {
      selectState.current = selectOnPointerMove(e, selectState.current);
    }
  }, []);

  const handlePointerUp = useCallback((e: React.MouseEvent) => {
    const { appMode } = useUIStore.getState();

    if (appMode === 'pen') {
      const finalStroke = penOnPointerUp();
      if (finalStroke && boardId) {
        createElement({ boardId, elementType: 'stroke', data: finalStroke, author: authorName || 'Guest' });
      }
    } else if (appMode === 'eraser') {
      eraserOnPointerUp();
    } else {
      selectOnPointerUp(e, selectState.current);
      selectState.current = { isPanning: false };
    }
  }, []);

  return { mousePos, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp };
}
