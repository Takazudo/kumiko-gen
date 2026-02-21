#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { generateKumiko } from './generator.js';
import type { KumikoOptions } from './generator.js';

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

function requireInt(flag: string, value: string | undefined): number {
  if (value == null) fail(`${flag} requires a value`);
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) fail(`${flag} must be a number, got "${value}"`);
  return n;
}

function requireFloat(flag: string, value: string | undefined): number {
  if (value == null) fail(`${flag} requires a value`);
  const n = parseFloat(value);
  if (Number.isNaN(n)) fail(`${flag} must be a number, got "${value}"`);
  return n;
}

function parseArgs(args: string[]): { slug: string; options: KumikoOptions; outPath?: string; outDir?: string } {
  const slug = args.find((a) => !a.startsWith('--'));
  if (!slug) {
    fail('Usage: kumiko-gen <slug> [--size 800] [--zoom 1] [--fg "#1c1917"] [--bg "#d6d3d1"] [--finalize] [--out path] [--out-dir dir]');
  }

  const options: KumikoOptions = {};
  let outPath: string | undefined;
  let outDir: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--size':
        options.size = requireInt('--size', args[++i]);
        if (options.size <= 0 || options.size > 10000) fail('--size must be between 1 and 10000');
        break;
      case '--fg':
        options.fg = args[++i];
        if (!options.fg) fail('--fg requires a color value');
        break;
      case '--bg':
        options.bg = args[++i];
        if (!options.bg) fail('--bg requires a color value');
        break;
      case '--zoom':
        options.zoom = requireFloat('--zoom', args[++i]);
        if (options.zoom <= 0) fail('--zoom must be positive');
        break;
      case '--stroke-width':
        options.strokeWidth = requireFloat('--stroke-width', args[++i]);
        if (options.strokeWidth <= 0) fail('--stroke-width must be positive');
        break;
      case '--divisions':
        options.divisions = requireInt('--divisions', args[++i]);
        if (options.divisions <= 0) fail('--divisions must be positive');
        break;
      case '--finalize':
        options.finalize = true;
        break;
      case '--out':
        outPath = args[++i];
        if (!outPath) fail('--out requires a path');
        break;
      case '--out-dir':
        outDir = args[++i];
        if (!outDir) fail('--out-dir requires a directory path');
        break;
    }
  }

  return { slug, options, outPath, outDir };
}

function main() {
  const args = process.argv.slice(2);
  const { slug, options, outPath, outDir } = parseArgs(args);

  const svg = generateKumiko(slug, options);

  const outputPath = outPath ?? resolve(outDir ?? process.cwd(), `${slug}.svg`);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, svg, 'utf-8');

  console.log(`Generated: ${outputPath}`);
}

main();
