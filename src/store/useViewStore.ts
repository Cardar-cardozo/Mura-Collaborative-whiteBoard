import { create } from 'zustand';
import type { CameraTransform } from '../core/types';
import { MIN_SCALE, MAX_SCALE, ZOOM_WHEEL_SPEED } from '../core/constants';
import { clamp } from '../lib/math';

interface ViewState {
  transform: CameraTransform;

  // Atomic setters (prevents stale-closure issues in event handlers)
  pan: (dx: number, dy: number) => void;
  zoomBy: (delta: number) => void;
  zoomTo: (scale: number) => void;
  setTransform: (t: Partial<CameraTransform>) => void;

  // Wheel event handler: handles both pinch-zoom and scroll-pan
  handleWheel: (deltaX: number, deltaY: number, isZoom: boolean) => void;
}

export const useViewStore = create<ViewState>()(set => ({
  transform: { x: 0, y: 0, scale: 1 },

  pan: (dx, dy) =>
    set(s => ({ transform: { ...s.transform, x: s.transform.x + dx, y: s.transform.y + dy } })),

  zoomBy: delta =>
    set(s => ({
      transform: {
        ...s.transform,
        scale: clamp(s.transform.scale + delta, MIN_SCALE, MAX_SCALE),
      },
    })),

  zoomTo: scale =>
    set(s => ({
      transform: { ...s.transform, scale: clamp(scale, MIN_SCALE, MAX_SCALE) },
    })),

  setTransform: partial =>
    set(s => ({ transform: { ...s.transform, ...partial } })),

  handleWheel: (deltaX, deltaY, isZoom) => {
    if (isZoom) {
      set(s => ({
        transform: {
          ...s.transform,
          scale: clamp(s.transform.scale - deltaY * ZOOM_WHEEL_SPEED, MIN_SCALE, MAX_SCALE),
        },
      }));
    } else {
      set(s => ({
        transform: {
          ...s.transform,
          x: s.transform.x - deltaX,
          y: s.transform.y - deltaY,
        },
      }));
    }
  },
}));
