# @takazudo/kumiko-gen

Generate deterministic Japanese kumiko geometric pattern SVGs from text seeds. Same input always produces the same pattern.

## Features

- **Deterministic** - Same slug always produces identical SVG output
- **9 traditional patterns** - asanoha, mitsukude, goma, shippo, yae-asanoha, kikko, sakura, bishamon, izutsu
- **Multi-layer composition** - 2-4 patterns overlaid with randomized rotation and translation
- **Customizable** - Size, zoom, colors, stroke width, grid divisions
- **SVG optimization** - Remove off-canvas elements for smaller file sizes
- **CLI and API** - Use as command-line tool or import as library

## Installation

```bash
npm install @takazudo/kumiko-gen
```

Or use directly with npx:

```bash
npx @takazudo/kumiko-gen hello-world --out hello.svg
```

## Usage

### CLI

```bash
# Generate SVG from a slug
kumiko-gen hello-world

# Customize output
kumiko-gen my-pattern --size 1200 --fg "#ffffff" --bg "#1a1a2e" --out pattern.svg

# Optimize SVG (remove off-canvas elements)
kumiko-gen my-pattern --zoom 3 --finalize --out zoomed.svg
```

### API

```javascript
import { generateKumiko } from '@takazudo/kumiko-gen';

// Basic usage - returns SVG string
const svg = generateKumiko('hello-world');

// With options
const svg = generateKumiko('hello-world', {
  size: 1200,
  fg: '#1c1917',
  bg: '#d6d3d1',
  finalize: true,
});
```

```javascript
import { generateKumikoDetailed } from '@takazudo/kumiko-gen';

// Get SVG with layer metadata
const { svg, layers } = generateKumikoDetailed('hello-world');
console.log(layers); // [{ index: 0, name: 'asanoha', ... }, ...]
```

## SVG to PNG Conversion

The package includes an SVG-to-PNG converter as a subpath export. It uses [sharp](https://sharp.pixelplumbing.com/) (optional dependency) to convert square SVG patterns into center-cropped landscape PNGs, ideal for OG images.

### CLI

```bash
# Convert SVG to PNG (default: 1200x630)
kumiko-gen-svg-to-png input.svg --out output.png

# Custom dimensions
kumiko-gen-svg-to-png input.svg --width 600 --height 315
```

### API

```javascript
import { convertSvgToPng, convertSvgFileToPng } from '@takazudo/kumiko-gen/svg-to-png';

// From a Buffer
const pngBuffer = await convertSvgToPng(svgBuffer, { width: 1200, height: 630 });

// From a file path
const pngBuffer = await convertSvgFileToPng('pattern.svg');
```

> **Note:** The `sharp` package is an optional dependency. Install it separately if you need SVG-to-PNG conversion: `npm install sharp`

## Documentation

For full documentation including pattern gallery, options reference, and API details, visit the [documentation site](https://takazudomodular.com/pj/kumiko-gen/doc/).

Try patterns interactively in the [viewer](https://takazudomodular.com/pj/kumiko-gen/).

## License

MIT
