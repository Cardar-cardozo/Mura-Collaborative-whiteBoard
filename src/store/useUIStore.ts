import { create } from 'zustand';
import type { AppMode, BrushSettings, EraserSettings } from '../core/types';
import {
  DEFAULT_BRUSH_COLOR,
  DEFAULT_BRUSH_WIDTH,
  DEFAULT_ERASER_SIZE,
} from '../core/constants';

interface UIState {

  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  brushSettings: BrushSettings;
  setBrushSettings: (updates: Partial<BrushSettings>) => void;

  eraserSettings: EraserSettings;
  setEraserSettings: (updates: Partial<EraserSettings>) => void;

  showRuler: boolean;
  toggleRuler: () => void;
}

export const useUIStore = create<UIState>()(set => ({

  appMode: 'select',
  setAppMode: mode => set({ appMode: mode }),

  brushSettings: {
    color: DEFAULT_BRUSH_COLOR,
    width: DEFAULT_BRUSH_WIDTH,
    style: 'solid',
  },
  setBrushSettings: updates =>
    set(s => ({ brushSettings: { ...s.brushSettings, ...updates } })),

  eraserSettings: {
    size: DEFAULT_ERASER_SIZE,
    shape: 'circle',
  },
  setEraserSettings: updates =>
    set(s => ({ eraserSettings: { ...s.eraserSettings, ...updates } })),

  showRuler: false,
  toggleRuler: () => set(s => ({ showRuler: !s.showRuler })),
}));
