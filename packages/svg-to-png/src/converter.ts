import sharp from 'sharp';
import { readFileSync, existsSync } from 'node:fs';

export interface ConvertOptions {
  // Output width in pixels (default: 1200)
  width?: number;
  // Output height in pixels (default: 630)
  height?: number;
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 630;

/**
 * Convert an SVG buffer to a center-cropped PNG buffer.
 *
 * The SVG is assumed to be square. It is rendered at the target width
 * (e.g. 1200x1200), then the center horizontal strip is extracted
 * to produce the final landscape image (1200x630).
 */
export async function convertSvgToPng(
  svgBuffer: Buffer,
  options: ConvertOptions = {},
): Promise<Buffer> {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;

  // Center-crop: remove equal amounts from top and bottom
  const cropTop = Math.round((width - height) / 2);

  // Single pipeline: render square, then extract center strip
  return sharp(svgBuffer, { density: 150 })
    .resize(width, width, { fit: 'fill' })
    .extract({ left: 0, top: cropTop, width, height })
    .png()
    .toBuffer();
}

/**
 * Convert an SVG file to a PNG file.
 * Returns the PNG buffer.
 */
export async function convertSvgFileToPng(
  inputPath: string,
  options: ConvertOptions = {},
): Promise<Buffer> {
  if (!existsSync(inputPath)) {
    throw new Error(`SVG file not found: ${inputPath}`);
  }
  const svgBuffer = readFileSync(inputPath);
  return convertSvgToPng(svgBuffer, options);
}
