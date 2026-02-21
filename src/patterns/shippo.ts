import type { Triangle } from '../grid.js';
import { arc, dist } from './utils.js';

/**
 * Shippo (seven treasures) pattern.
 * An arc from each vertex, curving through the centroid area.
 * Creates overlapping circle illusion across adjacent triangles.
 */
export function shippo(triangle: Triangle, strokeWidth: number): string {
  const [a, b, c] = triangle.vertices;
  const radius = dist(a, b) * 0.5;
  return [
    arc(a, b, radius, strokeWidth),
    arc(b, c, radius, strokeWidth),
    arc(c, a, radius, strokeWidth),
  ].join('\n');
}
