import type React from 'react';

import type { CameraTransform } from '../../core/types';
import { useViewStore } from '../../store/useViewStore';

export interface SelectPointerState {
  isPanning: boolean;
}

export function selectOnPointerDown(
  e: React.MouseEvent,
  _transform: CameraTransform
): SelectPointerState {
  const isMiddleMouse = e.button === 1;
  const isShiftDrag = e.button === 0 && e.shiftKey;

  return { isPanning: isMiddleMouse || isShiftDrag };
}

export function selectOnPointerMove(
  e: React.MouseEvent,
  state: SelectPointerState
): SelectPointerState {
  if (state.isPanning) {
    useViewStore.getState().pan(e.movementX, e.movementY);
  }
  return state;
}

export function selectOnPointerUp(_e: React.MouseEvent, _state: SelectPointerState): void {
  // Panning state is reset by the caller; nothing extra needed here.
}
