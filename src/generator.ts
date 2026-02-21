import { hashString } from './hash.js';
import { createRandom } from './seeded-random.js';
import { generateGrid } from './grid.js';
import { patternRegistry } from './patterns/index.js';
import { finalizeSvg } from './finalize.js';
import { r } from './patterns/utils.js';

// Per-layer override for foreground color and stroke width
export interface LayerOverride {
  fg?: string;
  strokeWidth?: number;
}

// Metadata about a single layer in the generated kumiko pattern
export interface LayerInfo {
  patternIndex: number;
  patternName: string;
  fg: string;
  strokeWidth: number;
  overlaps: number;
}

// Result returned by generateKumikoDetailed, including both SVG and layer metadata
export interface KumikoResult {
  svg: string;
  layers: LayerInfo[];
}

export interface KumikoOptions {
  size?: number;
  divisions?: number;
  zoom?: number;
  fg?: string;
  bg?: string;
  strokeWidth?: number;
  finalize?: boolean;
  layers?: LayerOverride[]; // Per-layer overrides, matched by index
  overflow?: number; // Canvas overflow factor (default 1). Use >1 to generate patterns beyond viewBox edges, ensuring full coverage after rotation/translation.
}

const DEFAULTS = {
  size: 800,
  strokeWidth: 2,
};

// Color scheme: 1 background + 8 foreground colors
const COLOR_SCHEME = {
  bg: '#2d2d2d',
  fg: [
    '#4a4a4a', // 0: dark gray
    '#b5524a', // 1: brick red
    '#5ea85e', // 2: green
    '#c8a64e', // 3: gold
    '#737d8e', // 4: slate blue
    '#a87a96', // 5: mauve
    '#5a8a8e', // 6: teal
    '#d5d5d5', // 7: light gray
  ],
};

/**
 * Generate kumiko pattern with full layer metadata.
 * Accepts per-layer overrides for fg and strokeWidth via options.layers.
 */
export function generateKumikoDetailed(slug: string, options?: KumikoOptions): KumikoResult {
  const size = options?.size ?? DEFAULTS.size;
  const zoom = options?.zoom ?? 1;
  const bg = options?.bg ?? COLOR_SCHEME.bg;
  const overflow = options?.overflow ?? 1;

  // When overflow > 1, generate patterns over a larger canvas so they extend
  // beyond the viewBox edges. This ensures full coverage after rotation/translation.
  const canvasSize = Math.round(size * overflow);

  const seed = hashString(slug);
  const rand = createRandom(seed);

  // Pick pattern layers (2, 3, or 4 patterns overlaid)
  // 40% two layers, 40% three layers, 20% four layers
  const layerRoll = rand();
  const layerCount = layerRoll < 0.4 ? 2 : layerRoll < 0.8 ? 3 : 4;

  // Pick distinct patterns for each layer (Fisher-Yates shuffle for uniform distribution)
  const shuffled = [...patternRegistry];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const layerEntries = shuffled.slice(0, layerCount);

  // Pick a random foreground color for each layer, respecting per-layer overrides
  // Always consume the random call to keep the PRNG sequence stable
  const layerColors: string[] = layerEntries.map((_, li) => {
    const randomColor = COLOR_SCHEME.fg[Math.floor(rand() * COLOR_SCHEME.fg.length)];
    // Per-layer override takes highest priority
    if (options?.layers?.[li]?.fg) return options.layers[li].fg!;
    // Global fg option takes second priority
    if (options?.fg) return options.fg;
    // Otherwise use the random color
    return randomColor;
  });

  // For each layer, decide overlap count (1, 2, or 3 copies with slight transforms)
  // 50% single, 30% double, 20% triple
  const layerOverlaps: number[] = layerEntries.map(() => {
    const roll = rand();
    return roll < 0.5 ? 1 : roll < 0.8 ? 2 : 3;
  });

  // Total visual density = sum of all overlaps across layers
  const totalDensity = layerOverlaps.reduce((sum, n) => sum + n, 0);

  // Stroke width options scaled by density to avoid filling the canvas solid.
  const strokeWidthByDensity: Record<number, number[]> = {
    1: [1, 1.5, 2, 3, 4],
    2: [0.5, 1, 1.5, 2, 3],
    3: [0.5, 1, 1.5, 2],
    4: [0.5, 0.75, 1, 1.5],
    5: [0.5, 0.75, 1],
  };
  const strokeWidthOptions = strokeWidthByDensity[Math.min(totalDensity, 5)];

  // Decide divisions from seed: 6, 8, or 10
  const divisionsOptions = [6, 8, 10];
  const divisions = options?.divisions ?? divisionsOptions[Math.floor(rand() * divisionsOptions.length)];

  // Generate grid over the full canvas (may be larger than viewBox when overflow > 1)
  const triangles = generateGrid(canvasSize, divisions);

  // Render patterns — for each layer, render overlapping copies with slight transforms
  const patternElements: string[] = [];
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;

  // Collect layer metadata as we render
  const layersInfo: LayerInfo[] = [];

  for (let li = 0; li < layerEntries.length; li++) {
    const entry = layerEntries[li];
    const overlapCount = layerOverlaps[li];
    const color = layerColors[li];

    // Check for per-layer strokeWidth override
    const layerStrokeOverride = options?.layers?.[li]?.strokeWidth;

    // Track the stroke width of the first overlap copy for LayerInfo
    let firstOverlapStrokeWidth = 0;

    // Each layer gets a random rotation and position offset
    // Use size (not canvasSize) for translation magnitude to keep PRNG-derived offsets consistent
    const layerAngle = rand() * 360;
    const layerDx = (rand() - 0.5) * size * 0.4;
    const layerDy = (rand() - 0.5) * size * 0.4;

    for (let oi = 0; oi < overlapCount; oi++) {
      // Determine stroke width: per-layer override > global option > random
      let sw: number;
      if (layerStrokeOverride != null) {
        // Per-layer override: use for ALL overlaps, but still consume the random
        // to keep the PRNG sequence identical for downstream values
        rand();
        sw = layerStrokeOverride;
      } else {
        sw = options?.strokeWidth ?? strokeWidthOptions[Math.floor(rand() * strokeWidthOptions.length)];
      }

      // Record the stroke width of the first overlap for metadata
      if (oi === 0) {
        firstOverlapStrokeWidth = sw;
      }

      const elements = triangles.map((tri) => entry.fn(tri, sw));

      // Overlap copies add slight extra offset + rotation on top of the layer transform
      const overlapDx = oi === 0 ? 0 : (rand() - 0.5) * canvasSize * 0.03;
      const overlapDy = oi === 0 ? 0 : (rand() - 0.5) * canvasSize * 0.03;
      const overlapAngle = oi === 0 ? 0 : (rand() - 0.5) * 8;
      const dx = layerDx + overlapDx;
      const dy = layerDy + overlapDy;
      const totalAngle = layerAngle + overlapAngle;

      patternElements.push(
        `<g transform="translate(${r(dx)},${r(dy)}) rotate(${r(totalAngle)},${r(cx)},${r(cy)})" stroke="${color}" stroke-linecap="square" stroke-linejoin="bevel">`,
      );
      patternElements.push(...elements.map((el) => `  ${el}`));
      patternElements.push(`</g>`);
    }

    // Record layer metadata
    const registryIndex = patternRegistry.indexOf(entry);
    layersInfo.push({
      patternIndex: registryIndex,
      patternName: entry.name,
      fg: color,
      strokeWidth: firstOverlapStrokeWidth,
      overlaps: overlapCount,
    });
  }

  // Assemble SVG
  // ViewBox is centered on the canvas, showing only the requested size (divided by zoom)
  const viewSize = size / zoom;
  const viewOffset = (canvasSize - viewSize) / 2;

  const svgString = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(viewOffset)} ${r(viewOffset)} ${r(viewSize)} ${r(viewSize)}" width="${size}" height="${size}">`,
    `  <rect x="0" y="0" width="${canvasSize}" height="${canvasSize}" fill="${bg}"/>`,
    `  <g fill="none">`,
    ...patternElements.map((el) => `    ${el}`),
    `  </g>`,
    `</svg>`,
  ].join('\n');

  const svg = options?.finalize ? finalizeSvg(svgString) : svgString;

  return { svg, layers: layersInfo };
}

/**
 * Generate kumiko pattern SVG string.
 * Thin wrapper around generateKumikoDetailed that returns only the SVG string.
 * Fully backward compatible with the original API.
 */
export function generateKumiko(slug: string, options?: KumikoOptions): string {
  return generateKumikoDetailed(slug, options).svg;
}
