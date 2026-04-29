// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  dashArray?: string;
  author?: string;
}

export interface Note {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  rotation: number;
  isLocked?: boolean;
  author?: string;
}

export interface Participant {
  id: string;
  name: string;
  x: number;
  y: number;
}

// ─── Board State Snapshot (for undo/redo) ────────────────────────────────────

export interface BoardSnapshot {
  notes: Note[];
  strokes: Stroke[];
}

// ─── View / Camera ────────────────────────────────────────────────────────────

export interface CameraTransform {
  x: number;
  y: number;
  scale: number;
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

export type AppMode = 'select' | 'pen' | 'eraser';

export interface BrushSettings {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface EraserSettings {
  size: number;
  shape: 'circle' | 'square';
}

export interface RulerTransform {
  x: number;
  y: number;
  rotate: number;
}
