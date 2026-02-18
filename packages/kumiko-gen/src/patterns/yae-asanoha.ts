import type { Triangle } from '../grid.js';
import { line, mid } from './utils.js';

/**
 * Yae Asanoha (double hemp leaf) pattern.
 * All 6 radial lines: vertex-to-centroid AND midpoint-to-centroid,
 * creating a dense 6-spoke star within each triangle.
 */
export function yaeAsanoha(triangle: Triangle, strokeWidth: number): string {
  const [a, b, c] = triangle.vertices;
  const cen = triangle.centroid;
  const midAB = mid(a, b);
  const midBC = mid(b, c);
  const midCA = mid(c, a);
  return [
    line(a, cen, strokeWidth),
    line(b, cen, strokeWidth),
    line(c, cen, strokeWidth),
    line(midAB, cen, strokeWidth),
    line(midBC, cen, strokeWidth),
    line(midCA, cen, strokeWidth),
  ].join('\n');
}
