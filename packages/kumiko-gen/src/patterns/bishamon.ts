import type { Triangle } from '../grid.js';
import { line, mid, lerp } from './utils.js';

/**
 * Bishamon Kikko pattern.
 * Dense web: inner triangle + vertex-to-centroid radials +
 * cross-connections from inner vertices to opposite outer midpoints.
 * 9 line elements per triangle.
 */
export function bishamon(triangle: Triangle, strokeWidth: number): string {
  const [a, b, c] = triangle.vertices;
  const cen = triangle.centroid;
  const ia = lerp(cen, a, 0.35);
  const ib = lerp(cen, b, 0.35);
  const ic = lerp(cen, c, 0.35);
  const midAB = mid(a, b);
  const midBC = mid(b, c);
  const midCA = mid(c, a);

  return [
    // Inner triangle
    line(ia, ib, strokeWidth),
    line(ib, ic, strokeWidth),
    line(ic, ia, strokeWidth),
    // Vertex to centroid
    line(a, cen, strokeWidth),
    line(b, cen, strokeWidth),
    line(c, cen, strokeWidth),
    // Inner vertex to opposite outer midpoint
    line(ia, midBC, strokeWidth),
    line(ib, midCA, strokeWidth),
    line(ic, midAB, strokeWidth),
  ].join('\n');
}
