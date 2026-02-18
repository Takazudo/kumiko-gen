import type { Triangle } from '../grid.js';
import { line, mid } from './utils.js';

/**
 * Goma (sesame) pattern.
 * Lines from each vertex to the midpoint of the opposite edge,
 * creating an inner diamond/triangle subdivision.
 */
export function goma(triangle: Triangle, strokeWidth: number): string {
  const [a, b, c] = triangle.vertices;
  const midBC = mid(b, c);
  const midCA = mid(c, a);
  const midAB = mid(a, b);
  return [
    line(a, midBC, strokeWidth),
    line(b, midCA, strokeWidth),
    line(c, midAB, strokeWidth),
  ].join('\n');
}
