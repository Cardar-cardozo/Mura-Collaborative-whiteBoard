// ─── Canvas / SVG ─────────────────────────────────────────────────────────────
export const CANVAS_SVG_SIZE = 100_000;
export const CANVAS_SVG_OFFSET = -CANVAS_SVG_SIZE / 2;

// ─── View / Camera ─────────────────────────────────────────────────────────────
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 3;
export const ZOOM_STEP = 0.1;
export const ZOOM_WHEEL_SPEED = 0.001;

// ─── Brush Defaults ────────────────────────────────────────────────────────────
export const DEFAULT_BRUSH_COLOR = '#333333';
export const DEFAULT_BRUSH_WIDTH = 3;
export const BRUSH_COLORS = ['#333333', '#C66B3D', '#7C8370', '#2563EB', '#DB2777'] as const;
export const BRUSH_WIDTHS = [1, 3, 6, 12, 24] as const;
export const BRUSH_STYLES = ['solid', 'dashed', 'dotted'] as const;

// ─── Eraser Defaults ───────────────────────────────────────────────────────────
export const DEFAULT_ERASER_SIZE = 40;
export const ERASER_SIZES = [10, 20, 40, 80, 160] as const;
export const ERASER_SHAPES = ['circle', 'square'] as const;

// ─── Note Colors ───────────────────────────────────────────────────────────────
export const NOTE_COLORS = ['sage', 'cream', 'peach', 'orange'] as const;
export const NOTE_COLOR_MAP: Record<string, string> = {
  sage:   'bg-[#D1D9CF] border-[#B8C2B6]',
  cream:  'bg-[#F3EAC2] border-[#E5DBA9]',
  peach:  'bg-[#F9E2D2] border-[#EBCDB9]',
  orange: 'bg-[#D97706] text-white border-[#C06905]',
};

// ─── History ───────────────────────────────────────────────────────────────────
export const MAX_HISTORY_SIZE = 20;

// ─── Audio / Spatial ───────────────────────────────────────────────────────────
export const SPATIAL_MAX_DISTANCE = 3000;

// ─── Ruler ─────────────────────────────────────────────────────────────────────
export const RULER_TICK_COUNT = 60;
