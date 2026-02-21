import type { Triangle } from '../grid.js';
import { line, lerp } from './utils.js';

/**
 * Izutsu (well frame) pattern.
 * Two concentric triangles at different scales, with radial lines
 * connecting all three levels (outer → mid → inner).
 * 12 line elements per triangle.
 */
export function izutsu(triangle: Triangle, strokeWidth: number): string {
  const [a, b, c] = triangle.vertices;
  const cen = triangle.centroid;
  // Mid triangle (65% from centroid toward vertex)
  const ma = lerp(cen, a, 0.65);
  const mb = lerp(cen, b, 0.65);
  const mc = lerp(cen, c, 0.65);
  // Inner triangle (30% from centroid toward vertex)
  const ia = lerp(cen, a, 0.3);
  const ib = lerp(cen, b, 0.3);
  const ic = lerp(cen, c, 0.3);

  return [
    // Mid triangle
    line(ma, mb, strokeWidth),
    line(mb, mc, strokeWidth),
    line(mc, ma, strokeWidth),
    // Inner triangle
    line(ia, ib, strokeWidth),
    line(ib, ic, strokeWidth),
    line(ic, ia, strokeWidth),
    // Outer to mid connections
    line(a, ma, strokeWidth),
    line(b, mb, strokeWidth),
    line(c, mc, strokeWidth),
    // Mid to inner connections
    line(ma, ia, strokeWidth),
    line(mb, ib, strokeWidth),
    line(mc, ic, strokeWidth),
  ].join('\n');
}
