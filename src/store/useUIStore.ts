import { create } from 'zustand';
import type { AppMode, BrushSettings, EraserSettings, RulerTransform } from '../core/types';
import {
  DEFAULT_BRUSH_COLOR,
  DEFAULT_BRUSH_WIDTH,
  DEFAULT_ERASER_SIZE,
} from '../core/constants';

interface UIState {
  // ─── Tool ─────────────────────────────────────────────────────────────────
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  // ─── Brush ────────────────────────────────────────────────────────────────
  brushSettings: BrushSettings;
  setBrushSettings: (updates: Partial<BrushSettings>) => void;

  // ─── Eraser ───────────────────────────────────────────────────────────────
  eraserSettings: EraserSettings;
  setEraserSettings: (updates: Partial<EraserSettings>) => void;

  // ─── Ruler ────────────────────────────────────────────────────────────────
  showRuler: boolean;
  toggleRuler: () => void;
  rulerTransform: RulerTransform;
  setRulerTransform: (updates: Partial<RulerTransform>) => void;
}

export const useUIStore = create<UIState>()(set => ({
  // Tool
  appMode: 'select',
  setAppMode: mode => set({ appMode: mode }),

  // Brush
  brushSettings: {
    color: DEFAULT_BRUSH_COLOR,
    width: DEFAULT_BRUSH_WIDTH,
    style: 'solid',
  },
  setBrushSettings: updates =>
    set(s => ({ brushSettings: { ...s.brushSettings, ...updates } })),

  // Eraser
  eraserSettings: {
    size: DEFAULT_ERASER_SIZE,
    shape: 'circle',
  },
  setEraserSettings: updates =>
    set(s => ({ eraserSettings: { ...s.eraserSettings, ...updates } })),

  // Ruler
  showRuler: false,
  toggleRuler: () => set(s => ({ showRuler: !s.showRuler })),
  rulerTransform: { x: 100, y: 100, rotate: 0 },
  setRulerTransform: updates =>
    set(s => ({ rulerTransform: { ...s.rulerTransform, ...updates } })),
}));
