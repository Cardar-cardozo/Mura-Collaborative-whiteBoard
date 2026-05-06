import type { Point, CameraTransform } from '../core/types';

export function screenToCanvas(
  screenX: number,
  screenY: number,
  rect: DOMRect,
  transform: CameraTransform
): Point {
  return {
    x: (screenX - rect.left - transform.x) / transform.scale,
    y: (screenY - rect.top  - transform.y) / transform.scale,
  };
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isPointInCircle(p: Point, center: Point, radius: number): boolean {
  return distance(p, center) < radius;
}

export function isPointInSquare(p: Point, center: Point, halfSide: number): boolean {
  return Math.abs(p.x - center.x) < halfSide && Math.abs(p.y - center.y) < halfSide;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomId(length = 9): string {
  return Math.random().toString(36).substr(2, length);
}

export function angleToDeg(cx: number, cy: number, px: number, py: number): number {
  return Math.atan2(py - cy, px - cx) * (180 / Math.PI);
}
