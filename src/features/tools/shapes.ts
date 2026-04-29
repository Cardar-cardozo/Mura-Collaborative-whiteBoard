/**
 * Eraser Tool Strategy
 *
 * Tests each completed stroke's points against the eraser cursor position and
 * removes matching strokes via useBoardStore. Pure logic — no React.
 */
import type React from 'react';
import type { CameraTransform, Stroke, EraserSettings } from '../../core/types';
import { useBoardStore } from '../../store/useBoardStore';
import { screenToCanvas, isPointInCircle, isPointInSquare } from '../../lib/math';

function getErasedIds(
  strokes: Stroke[],
  cx: number,
  cy: number,
  eraser: EraserSettings,
  transform: CameraTransform
): string[] {
  const threshold = eraser.size / 2 / transform.scale;
  const center = { x: cx, y: cy };
  const check =
    eraser.shape === 'circle'
      ? (p: { x: number; y: number }) => isPointInCircle(p, center, threshold)
      : (p: { x: number; y: number }) => isPointInSquare(p, center, threshold);

  return strokes.filter(s => s.points.some(check)).map(s => s.id);
}

export function eraserOnPointerDown(
  e: React.MouseEvent,
  rect: DOMRect,
  transform: CameraTransform,
  eraser: EraserSettings
): void {
  if (e.button !== 0) return;
  const { x, y } = screenToCanvas(e.clientX, e.clientY, rect, transform);
  const { strokes } = useBoardStore.getState();
  const ids = getErasedIds(strokes, x, y, eraser, transform);
  useBoardStore.getState().eraseStrokes(ids);
}

export function eraserOnPointerMove(
  e: React.MouseEvent,
  rect: DOMRect,
  transform: CameraTransform,
  eraser: EraserSettings
): void {
  if (!(e.buttons & 1)) return;
  const { x, y } = screenToCanvas(e.clientX, e.clientY, rect, transform);
  const { strokes } = useBoardStore.getState();
  const ids = getErasedIds(strokes, x, y, eraser, transform);
  useBoardStore.getState().eraseStrokes(ids);
}

// Eraser has no pointer-up action; included for API symmetry.
export function eraserOnPointerUp(): void {}
