import type { Triangle } from '../grid.js';
import { line, mid } from './utils.js';

/**
 * Mitsukude (three-pronged) pattern.
 * Lines from each edge midpoint to the centroid, forming a Y-shape.
 */
export function mitsukude(triangle: Triangle, strokeWidth: number): string {
  const [a, b, c] = triangle.vertices;
  const cen = triangle.centroid;
  const midAB = mid(a, b);
  const midBC = mid(b, c);
  const midCA = mid(c, a);
  return [
    line(midAB, cen, strokeWidth),
    line(midBC, cen, strokeWidth),
    line(midCA, cen, strokeWidth),
  ].join('\n');
}
