/**
 * Pen Tool Strategy
 *
 * Translates raw pointer events (screen coords) → canvas coords → Stroke data
 * and delegates to useBoardStore. Zero React state involved here.
 */
import type React from 'react';
import type { CameraTransform, BrushSettings } from '../../core/types';
import { useBoardStore } from '../../store/useBoardStore';
import { screenToCanvas } from '../../lib/math';
import { randomId } from '../../lib/math';

export function penOnPointerDown(
  e: React.MouseEvent,
  rect: DOMRect,
  transform: CameraTransform,
  brush: BrushSettings
): void {
  if (e.button !== 0) return;
  const { x, y } = screenToCanvas(e.clientX, e.clientY, rect, transform);
  const dash =
    brush.style === 'dashed'
      ? `${8 / transform.scale},${8 / transform.scale}`
      : brush.style === 'dotted'
      ? `${1 / transform.scale},${8 / transform.scale}`
      : undefined;

  useBoardStore.getState().beginStroke({
    id: randomId(),
    points: [{ x, y }],
    color: brush.color,
    width: brush.width / transform.scale,
    dashArray: dash,
  });
}

export function penOnPointerMove(
  e: React.MouseEvent,
  rect: DOMRect,
  transform: CameraTransform
): void {
  if (!(e.buttons & 1)) return; // left button must be held
  const { x, y } = screenToCanvas(e.clientX, e.clientY, rect, transform);
  useBoardStore.getState().appendStrokePoint(x, y);
}

export function penOnPointerUp(): void {
  useBoardStore.getState().commitStroke();
}
