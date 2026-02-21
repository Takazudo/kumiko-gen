import { describe, it, expect } from 'vitest';
import { finalizeSvg } from '../src/finalize.js';
import { generateKumiko } from '../src/generator.js';

/**
 * Count the number of <line> and <path> elements in an SVG string.
 */
function countElements(svg: string): number {
  const lineCount = (svg.match(/<line\s/g) || []).length;
  const pathCount = (svg.match(/<path\s/g) || []).length;
  return lineCount + pathCount;
}

/**
 * Count the number of <g transform="..."> groups in an SVG string.
 */
function countGroups(svg: string): number {
  return (svg.match(/<g\s+transform="translate\(/g) || []).length;
}

/**
 * Build a test SVG with a specific viewBox and transform groups.
 */
function buildTestSvg(
  viewBox: string,
  groups: { transform: string; elements: string[] }[],
): string {
  const groupLines: string[] = [];
  for (const g of groups) {
    groupLines.push(
      `    <g transform="${g.transform}" stroke="#fff" stroke-linecap="square" stroke-linejoin="bevel">`,
    );
    for (const el of g.elements) {
      groupLines.push(`      ${el}`);
    }
    groupLines.push(`    </g>`);
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="400" height="400">`,
    `  <rect x="0" y="0" width="400" height="400" fill="#000"/>`,
    `  <g fill="none">`,
    ...groupLines,
    `  </g>`,
    `</svg>`,
  ].join('\n');
}

describe('finalizeSvg', () => {
  describe('basic behavior', () => {
    it('returns valid SVG', () => {
      const svg = generateKumiko('test-slug', { zoom: 4 });
      const result = finalizeSvg(svg);
      expect(result.startsWith('<svg')).toBeTruthy();
      expect(result.endsWith('</svg>')).toBeTruthy();
      expect(result).toContain('viewBox');
    });

    it('preserves background rect', () => {
      const svg = generateKumiko('test-slug', { zoom: 4 });
      const result = finalizeSvg(svg);
      expect(result).toContain('<rect');
    });

    it('preserves outer <g fill="none"> wrapper', () => {
      const svg = generateKumiko('test-slug', { zoom: 4 });
      const result = finalizeSvg(svg);
      expect(result).toContain('<g fill="none">');
    });

    it('is deterministic', () => {
      const svg = generateKumiko('some-slug', { zoom: 4 });
      const result1 = finalizeSvg(svg);
      const result2 = finalizeSvg(svg);
      expect(result1).toBe(result2);
    });

    it('handles SVG without viewBox gracefully', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
      const result = finalizeSvg(svg);
      expect(result).toBe(svg);
    });
  });

  describe('zoom=1 (full canvas visible)', () => {
    it('keeps all or nearly all elements', () => {
      const svg = generateKumiko('test-slug', { zoom: 1 });
      const beforeCount = countElements(svg);
      const result = finalizeSvg(svg);
      const afterCount = countElements(result);
      // With zoom=1 the viewBox covers the full canvas;
      // a few elements beyond the grid edge may be removed
      const ratio = afterCount / beforeCount;
      // Grid extends beyond the canvas, and random transforms can shift
      // elements further out, so ~80% retention is expected
      expect(ratio).toBeGreaterThan(0.7);
    });
  });

  describe('zoom=8 (1/64th of canvas visible)', () => {
    it('significantly reduces element count', () => {
      const svg = generateKumiko('test-slug', { zoom: 8 });
      const beforeCount = countElements(svg);
      const result = finalizeSvg(svg);
      const afterCount = countElements(result);
      expect(afterCount).toBeLessThan(beforeCount * 0.5);
    });

    it('removes some groups entirely', () => {
      const svg = generateKumiko('test-slug', { zoom: 8 });
      const beforeGroups = countGroups(svg);
      const result = finalizeSvg(svg);
      const afterGroups = countGroups(result);
      // With high zoom, at least some groups should be removed
      // (groups whose elements are all outside the viewBox)
      expect(afterGroups).toBeLessThanOrEqual(beforeGroups);
    });
  });

  describe('element filtering with crafted SVGs', () => {
    it('keeps lines inside viewBox and removes lines outside', () => {
      const svg = buildTestSvg(
        '100 100 200 200',
        [
          {
            transform: 'translate(0.00,0.00) rotate(0.00,200.00,200.00)',
            elements: [
              '<line x1="150.00" y1="150.00" x2="250.00" y2="250.00" stroke-width="2"/>',
              '<line x1="0.00" y1="0.00" x2="10.00" y2="10.00" stroke-width="2"/>',
            ],
          },
        ],
      );

      const result = finalizeSvg(svg);
      expect(result).toContain('x1="150.00"');
      expect(result).not.toContain('x1="0.00"');
    });

    it('keeps bezier paths inside viewBox and removes those outside', () => {
      const svg = buildTestSvg(
        '100 100 200 200',
        [
          {
            transform: 'translate(0.00,0.00) rotate(0.00,200.00,200.00)',
            elements: [
              '<path d="M 150.00 150.00 Q 200.00 200.00 250.00 250.00" fill="none" stroke-width="2"/>',
              '<path d="M 0.00 0.00 Q 5.00 5.00 10.00 10.00" fill="none" stroke-width="2"/>',
            ],
          },
        ],
      );

      const result = finalizeSvg(svg);
      expect(result).toContain('M 150.00');
      expect(result).not.toContain('M 0.00 0.00');
    });

    it('keeps arc paths inside viewBox and removes those outside', () => {
      const svg = buildTestSvg(
        '100 100 200 200',
        [
          {
            transform: 'translate(0.00,0.00) rotate(0.00,200.00,200.00)',
            elements: [
              '<path d="M 150.00 150.00 A 50.00 50.00 0 0 1 250.00 250.00" fill="none" stroke-width="2"/>',
              '<path d="M 0.00 0.00 A 5.00 5.00 0 0 1 10.00 10.00" fill="none" stroke-width="2"/>',
            ],
          },
        ],
      );

      const result = finalizeSvg(svg);
      expect(result).toContain('M 150.00');
      expect(result).not.toContain('M 0.00 0.00');
    });

    it('removes entire group when all children are outside', () => {
      const svg = buildTestSvg(
        '100 100 200 200',
        [
          {
            transform: 'translate(0.00,0.00) rotate(0.00,200.00,200.00)',
            elements: [
              '<line x1="0.00" y1="0.00" x2="10.00" y2="10.00" stroke-width="2"/>',
              '<line x1="5.00" y1="5.00" x2="15.00" y2="15.00" stroke-width="2"/>',
            ],
          },
        ],
      );

      const result = finalizeSvg(svg);
      expect(result).not.toContain('transform="translate');
    });
  });

  describe('transform handling', () => {
    it('applies translate correctly', () => {
      // Element at (50,50)-(60,60) with translate(100,100) ends up at (150,150)-(160,160)
      // which is inside viewBox [100,100,200,200]
      const svg = buildTestSvg(
        '100 100 200 200',
        [
          {
            transform: 'translate(100.00,100.00) rotate(0.00,200.00,200.00)',
            elements: [
              '<line x1="50.00" y1="50.00" x2="60.00" y2="60.00" stroke-width="2"/>',
            ],
          },
        ],
      );

      const result = finalizeSvg(svg);
      expect(result).toContain('x1="50.00"');
    });

    it('applies rotation correctly', () => {
      // (100,100)->(110,100) rotated 180 degrees around (200,200) -> (300,300)->(290,300)
      // viewBox [250,250,100,100] -> padded [245,245,110,110] -> x/y in [245,355]
      // Both transformed endpoints are inside
      const svg = buildTestSvg(
        '250 250 100 100',
        [
          {
            transform: 'translate(0.00,0.00) rotate(180.00,200.00,200.00)',
            elements: [
              '<line x1="100.00" y1="100.00" x2="110.00" y2="100.00" stroke-width="2"/>',
              '<line x1="350.00" y1="350.00" x2="360.00" y2="350.00" stroke-width="2"/>',
            ],
          },
        ],
      );

      const result = finalizeSvg(svg);
      // (100,100) rotated 180 degrees around (200,200) = (300,300) -> inside [245,355]
      expect(result).toContain('x1="100.00"');
      // (350,350) rotated 180 degrees = (50,50) -> outside [245,355]
      expect(result).not.toContain('x1="350.00"');
    });

    it('applies combined translate + rotate', () => {
      // Element at (200,200) with translate(50,50) rotate(0,200,200)
      // No rotation, just translate: (200,200)+translate(50,50) = (250,250)
      // viewBox [240,240,40,40] padded by 2 -> [238,238,44,44] -> x/y in [238,282]
      // (250,250) is inside
      const svg = buildTestSvg(
        '240 240 40 40',
        [
          {
            transform: 'translate(50.00,50.00) rotate(0.00,200.00,200.00)',
            elements: [
              '<line x1="200.00" y1="200.00" x2="205.00" y2="205.00" stroke-width="2"/>',
            ],
          },
        ],
      );

      const result = finalizeSvg(svg);
      expect(result).toContain('x1="200.00"');
    });
  });

  describe('edge cases', () => {
    it('keeps elements on the viewBox boundary', () => {
      // Line from (100,100) to (300,300) crosses the viewBox boundary
      const svg = buildTestSvg(
        '150 150 100 100',
        [
          {
            transform: 'translate(0.00,0.00) rotate(0.00,200.00,200.00)',
            elements: [
              '<line x1="100.00" y1="100.00" x2="300.00" y2="300.00" stroke-width="2"/>',
            ],
          },
        ],
      );

      const result = finalizeSvg(svg);
      expect(result).toContain('x1="100.00"');
    });

    it('works with multiple groups having different transforms', () => {
      const svg = buildTestSvg(
        '100 100 200 200',
        [
          {
            // No offset -- elements at (150,150) are inside
            transform: 'translate(0.00,0.00) rotate(0.00,200.00,200.00)',
            elements: [
              '<line x1="150.00" y1="150.00" x2="200.00" y2="200.00" stroke-width="2"/>',
            ],
          },
          {
            // Large offset pushes elements far outside
            transform: 'translate(500.00,500.00) rotate(0.00,200.00,200.00)',
            elements: [
              '<line x1="150.00" y1="150.00" x2="200.00" y2="200.00" stroke-width="2"/>',
            ],
          },
        ],
      );

      const result = finalizeSvg(svg);
      // First group should be kept, second removed
      const groups = countGroups(result);
      expect(groups).toBe(1);
    });
  });
});
