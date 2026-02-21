import type { Triangle } from '../grid.js';
import { line, lerp } from './utils.js';

/**
 * Kikko (tortoise shell) pattern.
 * An inner triangle scaled toward the centroid, with lines connecting
 * each outer vertex to its corresponding inner vertex. Creates a
 * hexagonal motif when adjacent triangles combine.
 */
export function kikko(triangle: Triangle, strokeWidth: number): string {
  const [a, b, c] = triangle.vertices;
  const cen = triangle.centroid;
  const ia = lerp(cen, a, 0.4);
  const ib = lerp(cen, b, 0.4);
  const ic = lerp(cen, c, 0.4);
  return [
    // Inner triangle edges
    line(ia, ib, strokeWidth),
    line(ib, ic, strokeWidth),
    line(ic, ia, strokeWidth),
    // Outer vertex to corresponding inner vertex
    line(a, ia, strokeWidth),
    line(b, ib, strokeWidth),
    line(c, ic, strokeWidth),
  ].join('\n');
}
