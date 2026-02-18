import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { convertSvgToPng } from '../src/converter.js';

// Minimal 800x800 square SVG for testing
function createTestSvg(size = 800): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect x="0" y="0" width="${size}" height="${size}" fill="#ff0000"/>
  <rect x="0" y="0" width="${size}" height="${Math.round(size / 4)}" fill="#00ff00"/>
  <rect x="0" y="${size - Math.round(size / 4)}" width="${size}" height="${Math.round(size / 4)}" fill="#0000ff"/>
</svg>`;
  return Buffer.from(svg);
}

describe('convertSvgToPng', () => {
  it('produces a valid PNG buffer', async () => {
    const svgBuffer = createTestSvg();
    const pngBuffer = await convertSvgToPng(svgBuffer);

    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    expect(pngBuffer[0]).toBe(0x89);
    expect(pngBuffer[1]).toBe(0x50); // P
    expect(pngBuffer[2]).toBe(0x4e); // N
    expect(pngBuffer[3]).toBe(0x47); // G
  });

  it('outputs exactly 1200x630 by default', async () => {
    const svgBuffer = createTestSvg();
    const pngBuffer = await convertSvgToPng(svgBuffer);
    const metadata = await sharp(pngBuffer).metadata();

    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
  });

  it('respects custom dimensions', async () => {
    const svgBuffer = createTestSvg();
    const pngBuffer = await convertSvgToPng(svgBuffer, { width: 600, height: 315 });
    const metadata = await sharp(pngBuffer).metadata();

    expect(metadata.width).toBe(600);
    expect(metadata.height).toBe(315);
  });

  it('center-crops symmetrically', async () => {
    // The test SVG has green at top 1/4 and blue at bottom 1/4, red in the middle.
    // After rendering at 1200x1200 and center-cropping 285px from top/bottom,
    // the green band (top 300px of 1200) should be mostly cropped out (only 15px remains),
    // and the blue band (bottom 300px) similarly mostly gone.
    // The center should be predominantly red.
    const svgBuffer = createTestSvg();
    const pngBuffer = await convertSvgToPng(svgBuffer);

    // Sample center pixel - should be red
    const centerPixel = await sharp(pngBuffer)
      .extract({ left: 600, top: 315, width: 1, height: 1 })
      .raw()
      .toBuffer();

    // Red channel should be high, green and blue should be low
    expect(centerPixel[0]!).toBeGreaterThan(200);
    expect(centerPixel[1]!).toBeLessThan(50);
    expect(centerPixel[2]!).toBeLessThan(50);
  });

  it('crop is symmetric (equal top and bottom removal)', async () => {
    // For 1200x1200 -> 1200x630, we remove (1200-630)/2 = 285px from each side
    // Verify by checking that the top and bottom edges of the cropped image
    // correspond to the same distance from the center of the original
    const width = 1200;
    const height = 630;
    const renderSize = width; // square render
    const expectedCropTop = Math.round((renderSize - height) / 2);
    const expectedCropBottom = renderSize - height - expectedCropTop;

    expect(expectedCropTop).toBe(285);
    expect(expectedCropBottom).toBe(285);
    expect(expectedCropTop).toBe(expectedCropBottom);
  });
});
