import type { Triangle } from '../grid.js';
import { asanoha } from './asanoha.js';
import { mitsukude } from './mitsukude.js';
import { goma } from './goma.js';
import { shippo } from './shippo.js';
import { yaeAsanoha } from './yae-asanoha.js';
import { kikko } from './kikko.js';
import { sakura } from './sakura.js';
import { bishamon } from './bishamon.js';
import { izutsu } from './izutsu.js';

export type PatternFn = (triangle: Triangle, strokeWidth: number) => string;

interface PatternEntry {
  name: string;
  fn: PatternFn;
}

const patternRegistry: PatternEntry[] = [
  { name: 'asanoha', fn: asanoha },
  { name: 'mitsukude', fn: mitsukude },
  { name: 'goma', fn: goma },
  { name: 'shippo', fn: shippo },
  { name: 'yae-asanoha', fn: yaeAsanoha },
  { name: 'kikko', fn: kikko },
  { name: 'sakura', fn: sakura },
  { name: 'bishamon', fn: bishamon },
  { name: 'izutsu', fn: izutsu },
];

export { patternRegistry };

// Derived arrays for backward compatibility
export const patterns: PatternFn[] = patternRegistry.map((p) => p.fn);
export const patternNames = patternRegistry.map((p) => p.name);
