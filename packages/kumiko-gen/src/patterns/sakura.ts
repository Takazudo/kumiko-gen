import type { Triangle } from '../grid.js';
import { line, mid, lerp, quad } from './utils.js';

/**
 * Sakura (cherry blossom) pattern.
 * Quadratic bezier curves create petal shapes at each vertex,
 * with structural lines from centroid to edge midpoints.
 */
export function sakura(triangle: Triangle, strokeWidth: number): string {
  const [a, b, c] = triangle.vertices;
  const cen = triangle.centroid;
  const midAB = mid(a, b);
  const midBC = mid(b, c);
  const midCA = mid(c, a);

  // Control points: 25% from vertex toward centroid
  const ctrlA = lerp(a, cen, 0.25);
  const ctrlB = lerp(b, cen, 0.25);
  const ctrlC = lerp(c, cen, 0.25);

  return [
    // Petal curves at each vertex
    quad(midCA, ctrlA, midAB, strokeWidth),
    quad(midAB, ctrlB, midBC, strokeWidth),
    quad(midBC, ctrlC, midCA, strokeWidth),
    // Structural spokes from centroid to midpoints
    line(cen, midAB, strokeWidth),
    line(cen, midBC, strokeWidth),
    line(cen, midCA, strokeWidth),
  ].join('\n');
}
