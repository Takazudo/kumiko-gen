import type { Triangle } from '../grid.js';
import { line } from './utils.js';

/**
 * Asanoha (hemp leaf) pattern.
 * Lines from each vertex to the centroid, creating a star motif
 * when adjacent triangles mirror.
 */
export function asanoha(triangle: Triangle, strokeWidth: number): string {
  const [a, b, c] = triangle.vertices;
  const cen = triangle.centroid;
  return [
    line(a, cen, strokeWidth),
    line(b, cen, strokeWidth),
    line(c, cen, strokeWidth),
  ].join('\n');
}
