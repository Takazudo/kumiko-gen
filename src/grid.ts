export interface Point {
  x: number;
  y: number;
}

export interface Triangle {
  vertices: [Point, Point, Point];
  centroid: Point;
  index: number;
  isUpward: boolean;
}

function computeCentroid(a: Point, b: Point, c: Point): Point {
  return {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
  };
}

/**
 * Generate an equilateral triangle grid that tiles a square canvas.
 *
 * `divisions` = number of triangle columns per row of upward triangles.
 * The grid extends slightly beyond the canvas to fill edges.
 */
export function generateGrid(size: number, divisions: number): Triangle[] {
  const triangles: Triangle[] = [];
  const colWidth = size / divisions;
  const rowHeight = colWidth * (Math.sqrt(3) / 2);
  const rows = Math.ceil(size / rowHeight) + 1;
  let index = 0;

  for (let row = 0; row < rows; row++) {
    const y = row * rowHeight;
    // Each row has upward and downward triangles
    for (let col = 0; col < divisions; col++) {
      const x = col * colWidth;

      // Upward-pointing triangle
      const upA: Point = { x, y: y + rowHeight };
      const upB: Point = { x: x + colWidth, y: y + rowHeight };
      const upC: Point = { x: x + colWidth / 2, y };
      triangles.push({
        vertices: [upA, upB, upC],
        centroid: computeCentroid(upA, upB, upC),
        index: index++,
        isUpward: true,
      });

      // Downward-pointing triangle
      if (col < divisions - 1) {
        const downA: Point = { x: x + colWidth / 2, y };
        const downB: Point = { x: x + colWidth, y: y + rowHeight };
        const downC: Point = { x: x + colWidth * 1.5, y };
        triangles.push({
          vertices: [downA, downB, downC],
          centroid: computeCentroid(downA, downB, downC),
          index: index++,
          isUpward: false,
        });
      }
    }
  }

  return triangles;
}
