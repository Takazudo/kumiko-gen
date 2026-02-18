#!/usr/bin/env node

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';
import { convertSvgFileToPng } from './converter.js';

interface ParsedArgs {
  inputPath: string;
  outPath: string;
  width?: number;
  height?: number;
}

function printUsage(): never {
  console.error('Usage: svg-to-png <input.svg> [--out output.png] [--width 1200] [--height 630]');
  process.exit(1);
}

function parseArgs(args: string[]): ParsedArgs {
  let inputPath: string | undefined;
  let outPath: string | undefined;
  let width: number | undefined;
  let height: number | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--out':
        outPath = args[++i];
        break;
      case '--width':
        width = Number(args[++i]);
        if (Number.isNaN(width) || width <= 0) {
          console.error('Error: --width must be a positive number');
          process.exit(1);
        }
        break;
      case '--height':
        height = Number(args[++i]);
        if (Number.isNaN(height) || height <= 0) {
          console.error('Error: --height must be a positive number');
          process.exit(1);
        }
        break;
      default:
        if (!args[i]!.startsWith('--')) {
          inputPath = args[i];
        }
        break;
    }
  }

  if (!inputPath) {
    printUsage();
  }

  // Resolve input path relative to cwd
  const resolvedInput = resolve(inputPath);

  // Default output: same directory and basename, but with .png extension
  const resolvedOut = outPath
    ? resolve(outPath)
    : resolve(
        dirname(resolvedInput),
        basename(resolvedInput, extname(resolvedInput)) + '.png',
      );

  return { inputPath: resolvedInput, outPath: resolvedOut, width, height };
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  const pngBuffer = await convertSvgFileToPng(parsed.inputPath, {
    width: parsed.width,
    height: parsed.height,
  });

  mkdirSync(dirname(parsed.outPath), { recursive: true });
  writeFileSync(parsed.outPath, pngBuffer);

  console.log(`Generated: ${parsed.outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
