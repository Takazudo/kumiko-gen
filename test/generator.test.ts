import { describe, it, expect } from 'vitest';
import { generateKumiko, generateKumikoDetailed } from '../src/generator.js';
import type { KumikoResult } from '../src/generator.js';
import { hashString } from '../src/hash.js';
import { createRandom } from '../src/seeded-random.js';
import { patternNames } from '../src/patterns/index.js';
import { COLOR_SCHEMES, colorSchemesByKey } from '../src/color-schemes.js';

describe('hashString', () => {
  it('returns a number', () => {
    const result = hashString('hello');
    expect(typeof result).toBe('number');
  });

  it('is deterministic', () => {
    expect(hashString('test')).toBe(hashString('test'));
  });

  it('different strings produce different hashes', () => {
    expect(hashString('hello')).not.toBe(hashString('world'));
  });
});

describe('createRandom', () => {
  it('returns values between 0 and 1', () => {
    const rand = createRandom(12345);
    for (let i = 0; i < 100; i++) {
      const val = rand();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('is deterministic', () => {
    const rand1 = createRandom(42);
    const rand2 = createRandom(42);
    for (let i = 0; i < 10; i++) {
      expect(rand1()).toBe(rand2());
    }
  });
});

describe('generateKumiko', () => {
  it('returns valid SVG string', () => {
    const svg = generateKumiko('test-slug');
    expect(svg.startsWith('<svg')).toBeTruthy();
    expect(svg.endsWith('</svg>')).toBeTruthy();
    expect(svg).toContain('viewBox');
  });

  it('is deterministic', () => {
    const svg1 = generateKumiko('my-article');
    const svg2 = generateKumiko('my-article');
    expect(svg1).toBe(svg2);
  });

  it('different slugs produce different SVGs', () => {
    const svg1 = generateKumiko('article-one');
    const svg2 = generateKumiko('article-two');
    expect(svg1).not.toBe(svg2);
  });

  it('respects custom options', () => {
    const svg = generateKumiko('test', { size: 400, fg: '#ff0000', bg: '#00ff00' });
    expect(svg).toContain('viewBox="0.00 0.00 400.00 400.00"');
    expect(svg).toContain('fill="#00ff00"');
    expect(svg).toContain('stroke="#ff0000"');
  });

  it('respects zoom option', () => {
    const svg = generateKumiko('test', { size: 800, zoom: 8 });
    // zoom 8 on 800: viewSize=100, offset=350
    expect(svg).toContain('viewBox="350.00 350.00 100.00 100.00"');
    expect(svg).toContain('width="800"');
  });
});

describe('generateKumiko with finalize', () => {
  it('produces valid SVG with finalize enabled', () => {
    const svg = generateKumiko('test-slug', { finalize: true });
    expect(svg.startsWith('<svg')).toBeTruthy();
    expect(svg.endsWith('</svg>')).toBeTruthy();
  });

  it('finalize with zoom=1 keeps most elements', () => {
    const without = generateKumiko('test-slug', { zoom: 1 });
    const with_ = generateKumiko('test-slug', { zoom: 1, finalize: true });
    expect(with_.startsWith('<svg')).toBeTruthy();
    // With zoom=1, finalize should retain most content
    expect(with_.length).toBeGreaterThan(without.length * 0.5);
  });

  it('finalize with high zoom produces smaller output', () => {
    const without = generateKumiko('test-slug', { size: 800, zoom: 8 });
    const with_ = generateKumiko('test-slug', { size: 800, zoom: 8, finalize: true });
    expect(with_.length).toBeLessThanOrEqual(without.length);
  });
});

describe('generateKumikoDetailed', () => {
  it('returns an object with svg and layers', () => {
    const result = generateKumikoDetailed('test-slug');
    expect(typeof result.svg).toBe('string');
    expect(Array.isArray(result.layers)).toBeTruthy();
    expect(result.svg.startsWith('<svg')).toBeTruthy();
    expect(result.svg.endsWith('</svg>')).toBeTruthy();
  });

  it('returns 2-4 layers', () => {
    // Test multiple slugs to cover different layer counts
    const slugs = ['slug-a', 'slug-b', 'slug-c', 'slug-d', 'slug-e', 'slug-f'];
    for (const slug of slugs) {
      const result = generateKumikoDetailed(slug);
      expect(result.layers.length).toBeGreaterThanOrEqual(2);
      expect(result.layers.length).toBeLessThanOrEqual(4);
    }
  });

  it('is deterministic', () => {
    const result1 = generateKumikoDetailed('my-article');
    const result2 = generateKumikoDetailed('my-article');
    expect(result1.svg).toBe(result2.svg);
    expect(result1.layers).toEqual(result2.layers);
  });

  it('svg matches generateKumiko output (backward compatibility)', () => {
    const slug = 'backward-compat-test';
    const svgOnly = generateKumiko(slug);
    const detailed = generateKumikoDetailed(slug);
    expect(svgOnly).toBe(detailed.svg);
  });

  it('svg matches generateKumiko output with options (backward compatibility)', () => {
    const slug = 'compat-with-options';
    const opts = { size: 400, fg: '#ff0000', bg: '#00ff00', strokeWidth: 1.5 };
    const svgOnly = generateKumiko(slug, opts);
    const detailed = generateKumikoDetailed(slug, opts);
    expect(svgOnly).toBe(detailed.svg);
  });

  it('layers have valid patternIndex and patternName', () => {
    const result = generateKumikoDetailed('pattern-info-test');
    for (const layer of result.layers) {
      expect(layer.patternIndex).toBeGreaterThanOrEqual(0);
      expect(layer.patternIndex).toBeLessThan(patternNames.length);
      expect(layer.patternName).toBe(patternNames[layer.patternIndex]);
    }
  });

  it('layers have valid fg color strings', () => {
    const result = generateKumikoDetailed('color-test');
    for (const layer of result.layers) {
      expect(typeof layer.fg).toBe('string');
      expect(layer.fg.startsWith('#')).toBeTruthy();
    }
  });

  it('layers have positive strokeWidth and overlaps', () => {
    const result = generateKumikoDetailed('stroke-test');
    for (const layer of result.layers) {
      expect(layer.strokeWidth).toBeGreaterThan(0);
      expect(layer.overlaps).toBeGreaterThanOrEqual(1);
      expect(layer.overlaps).toBeLessThanOrEqual(3);
    }
  });

  it('layer fg values appear in the SVG as stroke attributes', () => {
    const result = generateKumikoDetailed('stroke-color-test');
    for (const layer of result.layers) {
      expect(result.svg).toContain(`stroke="${layer.fg}"`);
    }
  });
});

describe('generateKumikoDetailed with per-layer overrides', () => {
  it('per-layer fg override changes only the specified layer', () => {
    const slug = 'per-layer-fg-test';
    const customColor = '#abcdef';

    // First get the result without overrides to know how many layers there are
    const baseline = generateKumikoDetailed(slug);
    const layerCount = baseline.layers.length;

    // Override only the first layer's color
    const result = generateKumikoDetailed(slug, {
      layers: [{ fg: customColor }],
    });

    // First layer should have the custom color
    expect(result.layers[0].fg).toBe(customColor);
    expect(result.svg).toContain(`stroke="${customColor}"`);
  });

  it('per-layer strokeWidth override applies to all overlaps of that layer', () => {
    const slug = 'per-layer-sw-test';
    const customStrokeWidth = 5.5;

    const result = generateKumikoDetailed(slug, {
      layers: [{ strokeWidth: customStrokeWidth }],
    });

    // First layer should report the overridden stroke width
    expect(result.layers[0].strokeWidth).toBe(customStrokeWidth);
  });

  it('per-layer override does not affect pattern selection of other layers', () => {
    const slug = 'layer-isolation-test';
    const baseline = generateKumikoDetailed(slug);

    // Override only layer 0
    const result = generateKumikoDetailed(slug, {
      layers: [{ fg: '#111111', strokeWidth: 9.9 }],
    });

    // Layer 0 should be overridden
    expect(result.layers[0].fg).toBe('#111111');
    expect(result.layers[0].strokeWidth).toBe(9.9);

    // Same number of layers should be generated (layer count is determined before overrides)
    expect(result.layers.length).toBe(baseline.layers.length);

    // Pattern selection (shuffle) happens before color/overlap determination,
    // so patternIndex and patternName should be identical across all layers
    for (let i = 0; i < baseline.layers.length; i++) {
      expect(result.layers[i].patternIndex).toBe(baseline.layers[i].patternIndex);
      expect(result.layers[i].patternName).toBe(baseline.layers[i].patternName);
    }
  });

  it('per-layer fg takes priority over global fg', () => {
    const slug = 'priority-test';
    const globalColor = '#aaaaaa';
    const layerColor = '#bbbbbb';

    const result = generateKumikoDetailed(slug, {
      fg: globalColor,
      layers: [{ fg: layerColor }],
    });

    // Layer 0 should use per-layer color
    expect(result.layers[0].fg).toBe(layerColor);
    // Other layers should use the global color
    for (let i = 1; i < result.layers.length; i++) {
      expect(result.layers[i].fg).toBe(globalColor);
    }
  });

  it('empty layers array preserves original behavior', () => {
    const slug = 'empty-layers-test';
    const baseline = generateKumikoDetailed(slug);
    const result = generateKumikoDetailed(slug, { layers: [] });
    expect(baseline.svg).toBe(result.svg);
    expect(baseline.layers).toEqual(result.layers);
  });

  it('sparse layers array only overrides specified indices', () => {
    const slug = 'sparse-layers-test';
    const baseline = generateKumikoDetailed(slug);

    // Create a sparse array: only override index 1 (skip index 0)
    const layers = [undefined, { fg: '#ff00ff' }] as any[];
    const result = generateKumikoDetailed(slug, { layers });

    // Layer 1 should have the override color
    if (baseline.layers.length > 1) {
      expect(result.layers[1].fg).toBe('#ff00ff');
    }
  });
});

describe('generateKumikoDetailed with colorScheme', () => {
  it('named scheme changes layer colors', () => {
    const slug = 'scheme-named-test';
    const baseline = generateKumikoDetailed(slug);
    const result = generateKumikoDetailed(slug, { colorScheme: 'dracula' });

    // Colors should differ from default scheme
    const baselineColors = baseline.layers.map((l) => l.fg);
    const schemeColors = result.layers.map((l) => l.fg);
    expect(schemeColors).not.toEqual(baselineColors);

    // Pattern structure should remain the same
    expect(result.layers.length).toBe(baseline.layers.length);
    for (let i = 0; i < baseline.layers.length; i++) {
      expect(result.layers[i].patternIndex).toBe(baseline.layers[i].patternIndex);
      expect(result.layers[i].patternName).toBe(baseline.layers[i].patternName);
    }
  });

  it('named scheme uses colors from the scheme palette', () => {
    const slug = 'scheme-colors-test';
    const dracula = colorSchemesByKey.get('dracula')!;
    const result = generateKumikoDetailed(slug, { colorScheme: 'dracula' });

    const fgColors = dracula.palette.slice(1);
    for (const layer of result.layers) {
      expect(fgColors).toContain(layer.fg);
    }
  });

  it('named scheme sets background from palette', () => {
    const slug = 'scheme-bg-test';
    const dracula = colorSchemesByKey.get('dracula')!;
    const result = generateKumikoDetailed(slug, { colorScheme: 'dracula' });

    expect(result.svg).toContain(`fill="${dracula.palette[0]}"`);
  });

  it('named scheme returns colorSchemeName', () => {
    const result = generateKumikoDetailed('name-test', { colorScheme: 'nord' });
    expect(result.colorSchemeName).toBe('Nord');
  });

  it('no colorScheme produces identical output (backward compat)', () => {
    const slug = 'backward-compat-scheme';
    const before = generateKumikoDetailed(slug);
    const after = generateKumikoDetailed(slug, {});
    expect(before.svg).toBe(after.svg);
    expect(before.layers).toEqual(after.layers);
    expect(after.colorSchemeName).toBeUndefined();
  });

  it('"random" is deterministic per slug', () => {
    const slug = 'random-deterministic';
    const result1 = generateKumikoDetailed(slug, { colorScheme: 'random' });
    const result2 = generateKumikoDetailed(slug, { colorScheme: 'random' });
    expect(result1.svg).toBe(result2.svg);
    expect(result1.colorSchemeName).toBe(result2.colorSchemeName);
  });

  it('"random" varies across different slugs', () => {
    // Try multiple slug pairs to find at least one that produces different schemes
    const slugPairs = [
      ['random-slug-a', 'random-slug-b'],
      ['random-slug-c', 'random-slug-d'],
      ['random-slug-e', 'random-slug-f'],
    ];
    let foundDifference = false;
    for (const [slugA, slugB] of slugPairs) {
      const resultA = generateKumikoDetailed(slugA, { colorScheme: 'random' });
      const resultB = generateKumikoDetailed(slugB, { colorScheme: 'random' });
      if (resultA.colorSchemeName !== resultB.colorSchemeName) {
        foundDifference = true;
        break;
      }
    }
    expect(foundDifference).toBe(true);
  });

  it('unknown scheme name throws', () => {
    expect(() => {
      generateKumikoDetailed('error-test', { colorScheme: 'nonexistent-scheme' });
    }).toThrow('Unknown color scheme: "nonexistent-scheme"');
  });

  it('case-insensitive lookup works', () => {
    const slug = 'case-test';
    const lower = generateKumikoDetailed(slug, { colorScheme: 'dracula' });
    const upper = generateKumikoDetailed(slug, { colorScheme: 'DRACULA' });
    const mixed = generateKumikoDetailed(slug, { colorScheme: 'Dracula' });
    expect(lower.svg).toBe(upper.svg);
    expect(lower.svg).toBe(mixed.svg);
  });

  it('options.fg overrides scheme palette', () => {
    const slug = 'fg-override-scheme';
    const customColor = '#123456';
    const result = generateKumikoDetailed(slug, {
      colorScheme: 'dracula',
      fg: customColor,
    });
    for (const layer of result.layers) {
      expect(layer.fg).toBe(customColor);
    }
  });

  it('options.layers[i].fg overrides scheme palette', () => {
    const slug = 'layer-fg-override-scheme';
    const customColor = '#654321';
    const result = generateKumikoDetailed(slug, {
      colorScheme: 'dracula',
      layers: [{ fg: customColor }],
    });
    // First layer should use per-layer override
    expect(result.layers[0].fg).toBe(customColor);
    // Other layers should use Dracula palette colors
    const dracula = colorSchemesByKey.get('dracula')!;
    const fgColors = dracula.palette.slice(1);
    for (let i = 1; i < result.layers.length; i++) {
      expect(fgColors).toContain(result.layers[i].fg);
    }
  });

  it('options.bg overrides scheme background', () => {
    const slug = 'bg-override-scheme';
    const customBg = '#abcdef';
    const result = generateKumikoDetailed(slug, {
      colorScheme: 'dracula',
      bg: customBg,
    });
    expect(result.svg).toContain(`fill="${customBg}"`);
  });
});
