/**
 * Post-processes a kumiko-gen SVG string to remove elements
 * outside the visible viewBox area. This reduces file size
 * significantly when zoom > 1, since most of the canvas
 * elements become invisible.
 */

import type { Point } from './grid.js';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Transform {
  dx: number;
  dy: number;
  angle: number;
  cx: number;
  cy: number;
}

/**
 * Optimizes a kumiko SVG by removing elements outside the viewBox.
 * Elements are tested against a padded viewBox (5% margin) to avoid
 * edge artifacts. Elements that intersect or are inside the padded
 * area are kept; those entirely outside are removed.
 * Empty groups (where all children were removed) are also dropped.
 */
export function finalizeSvg(svgString: string): string {
  const viewBox = parseViewBox(svgString);
  if (!viewBox) return svgString;

  // 5% padding based on the larger dimension to avoid edge artifacts
  const padding = Math.max(viewBox.width, viewBox.height) * 0.05;
  const paddedRect: Rect = {
    x: viewBox.x - padding,
    y: viewBox.y - padding,
    width: viewBox.width + 2 * padding,
    height: viewBox.height + 2 * padding,
  };

  const lines = svgString.split('\n');
  const result: string[] = [];
  let currentTransform: Transform | null = null;
  let groupHeader = '';
  let groupElements: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect inner <g> with translate+rotate transform (pattern groups)
    const transformMatch = trimmed.match(
      /^<g\s+transform="translate\(([^,]+),([^)]+)\)\s+rotate\(([^,]+),([^,]+),([^)]+)\)"/,
    );
    if (transformMatch) {
      currentTransform = {
        dx: parseFloat(transformMatch[1]),
        dy: parseFloat(transformMatch[2]),
        angle: parseFloat(transformMatch[3]),
        cx: parseFloat(transformMatch[4]),
        cy: parseFloat(transformMatch[5]),
      };
      groupHeader = line;
      groupElements = [];
      continue;
    }

    // Close a transform group
    if (currentTransform && trimmed === '</g>') {
      // Only emit the group if it still has visible children
      if (groupElements.length > 0) {
        result.push(groupHeader);
        result.push(...groupElements);
        result.push(line);
      }
      currentTransform = null;
      groupHeader = '';
      groupElements = [];
      continue;
    }

    // Inside a transform group — test each element for visibility
    if (currentTransform) {
      if (isElementVisible(trimmed, currentTransform, paddedRect)) {
        groupElements.push(line);
      }
      continue;
    }

    // Outside transform groups — keep everything (svg root, rect, outer g, closing tags)
    result.push(line);
  }

  return result.join('\n');
}

/**
 * Extracts viewBox dimensions from the SVG root element.
 */
function parseViewBox(svgString: string): Rect | null {
  const match = svgString.match(/viewBox="([^"]+)"/);
  if (!match) return null;
  const parts = match[1].split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

/**
 * Determines whether a single SVG element (line or path) is visible
 * within the padded viewBox after applying its parent group's transform.
 */
function isElementVisible(
  trimmedLine: string,
  transform: Transform,
  paddedRect: Rect,
): boolean {
  if (!trimmedLine) return false;

  // <line x1="..." y1="..." x2="..." y2="..." stroke-width="..."/>
  const lineMatch = trimmedLine.match(
    /^<line\s+x1="([^"]+)"\s+y1="([^"]+)"\s+x2="([^"]+)"\s+y2="([^"]+)"/,
  );
  if (lineMatch) {
    const p1 = applyTransform(
      { x: parseFloat(lineMatch[1]), y: parseFloat(lineMatch[2]) },
      transform,
    );
    const p2 = applyTransform(
      { x: parseFloat(lineMatch[3]), y: parseFloat(lineMatch[4]) },
      transform,
    );
    return lineIntersectsRect(p1.x, p1.y, p2.x, p2.y, paddedRect);
  }

  // <path d="M x y Q cx cy ex ey" .../>  (quadratic bezier)
  const quadMatch = trimmedLine.match(
    /^<path\s+d="M\s+([^\s]+)\s+([^\s]+)\s+Q\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)"/,
  );
  if (quadMatch) {
    const start = applyTransform(
      { x: parseFloat(quadMatch[1]), y: parseFloat(quadMatch[2]) },
      transform,
    );
    const ctrl = applyTransform(
      { x: parseFloat(quadMatch[3]), y: parseFloat(quadMatch[4]) },
      transform,
    );
    const end = applyTransform(
      { x: parseFloat(quadMatch[5]), y: parseFloat(quadMatch[6]) },
      transform,
    );
    // Bezier is enclosed by the convex hull of its control points,
    // so bounding box of all three points is a conservative test
    return bboxIntersectsRect([start, ctrl, end], paddedRect);
  }

  // <path d="M x y A rx ry 0 0 1 ex ey" .../>  (arc)
  const arcMatch = trimmedLine.match(
    /^<path\s+d="M\s+([^\s]+)\s+([^\s]+)\s+A\s+([^\s]+)\s+([^\s]+)\s+\d+\s+\d+\s+\d+\s+([^\s]+)\s+([^\s"]+)"/,
  );
  if (arcMatch) {
    const start = applyTransform(
      { x: parseFloat(arcMatch[1]), y: parseFloat(arcMatch[2]) },
      transform,
    );
    const radius = parseFloat(arcMatch[3]);
    const end = applyTransform(
      { x: parseFloat(arcMatch[5]), y: parseFloat(arcMatch[6]) },
      transform,
    );
    // Arc can extend up to `radius` from the chord between endpoints,
    // so expand the endpoint bounding box by radius for a conservative test
    return bboxIntersectsRect([start, end], paddedRect, radius);
  }

  // Unknown element type — keep it to be safe
  return true;
}

/**
 * Applies a translate+rotate transform to a point.
 * SVG transform="translate(dx,dy) rotate(angle,cx,cy)" means:
 *   1. Rotate the point around (cx, cy) by angle degrees
 *   2. Translate the result by (dx, dy)
 */
function applyTransform(point: Point, transform: Transform): Point {
  const { dx, dy, angle, cx, cy } = transform;
  const rad = (angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  // Rotate around (cx, cy)
  const rx = (point.x - cx) * cosA - (point.y - cy) * sinA + cx;
  const ry = (point.x - cx) * sinA + (point.y - cy) * cosA + cy;

  // Then translate
  return { x: rx + dx, y: ry + dy };
}

/**
 * Tests if a line segment intersects an axis-aligned rectangle.
 * Uses separating axis theorem with three axes:
 *   1. X-axis (horizontal separation)
 *   2. Y-axis (vertical separation)
 *   3. Line normal (all rect corners on same side of the line)
 */
function lineIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: Rect,
): boolean {
  const rxMin = rect.x;
  const ryMin = rect.y;
  const rxMax = rect.x + rect.width;
  const ryMax = rect.y + rect.height;

  // Axis 1 & 2: bounding box overlap check
  if (Math.max(x1, x2) < rxMin || Math.min(x1, x2) > rxMax) return false;
  if (Math.max(y1, y2) < ryMin || Math.min(y1, y2) > ryMax) return false;

  // Axis 3: line normal — check if all 4 corners of the rect
  // are on the same side of the infinite line through the segment
  const ldx = x2 - x1;
  const ldy = y2 - y1;
  const c1 = ldy * (rxMin - x1) - ldx * (ryMin - y1);
  const c2 = ldy * (rxMax - x1) - ldx * (ryMin - y1);
  const c3 = ldy * (rxMin - x1) - ldx * (ryMax - y1);
  const c4 = ldy * (rxMax - x1) - ldx * (ryMax - y1);

  if (c1 > 0 && c2 > 0 && c3 > 0 && c4 > 0) return false;
  if (c1 < 0 && c2 < 0 && c3 < 0 && c4 < 0) return false;

  return true;
}

/**
 * Tests if the bounding box of a set of points (optionally expanded
 * by a radius in all directions) intersects an axis-aligned rectangle.
 * Used as a conservative visibility test for bezier curves and arcs.
 */
function bboxIntersectsRect(
  points: Point[],
  rect: Rect,
  expandBy: number = 0,
): boolean {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  // Expand bounds to account for curvature (arcs extend beyond endpoints)
  minX -= expandBy;
  minY -= expandBy;
  maxX += expandBy;
  maxY += expandBy;

  const rxMin = rect.x;
  const ryMin = rect.y;
  const rxMax = rect.x + rect.width;
  const ryMax = rect.y + rect.height;

  return maxX >= rxMin && minX <= rxMax && maxY >= ryMin && minY <= ryMax;
}
