import { useState, useCallback, useRef, useEffect } from 'react';
import { generateKumikoDetailed } from 'kumiko-gen/generator';
import type { LayerInfo, LayerOverride } from 'kumiko-gen/generator';
import { finalizeSvg } from 'kumiko-gen/finalize';
import { COLOR_SCHEMES } from './color-schemes';
import './App.css';

const DIVISIONS_OPTIONS = [6, 8, 10] as const;

// The generator's built-in palette (matches COLOR_SCHEMES[0] "default")
// palette[0] = bg color, palette[1-7] = line/stroke colors
const DEFAULT_PALETTE = COLOR_SCHEMES[0].palette;

interface GlobalParams {
  slug: string;
  divisions: number;
  zoom: number;
  bg: string;
}

function randomSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 12; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function svgToDataUrl(svg: string): string {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

function mapLayerColor(currentColor: string, newPalette: string[], layerIndex: number): string {
  const lineColors = newPalette.slice(1);
  const colorIdx = DEFAULT_PALETTE.indexOf(currentColor);
  return colorIdx >= 1 ? newPalette[colorIdx] : lineColors[layerIndex % lineColors.length];
}

// Preview size for the output SVG dimensions
const PREVIEW_SIZE = 1200;
// Overflow generates patterns over a larger canvas to ensure full coverage
// after rotation/translation, even on extreme aspect ratios (16:9, 9:16)
const PREVIEW_OVERFLOW = 1.8;

function generate(params: GlobalParams, overrides: LayerOverride[]) {
  return generateKumikoDetailed(params.slug, {
    size: PREVIEW_SIZE,
    overflow: PREVIEW_OVERFLOW,
    divisions: params.divisions,
    zoom: params.zoom,
    bg: params.bg,
    layers: overrides,
  });
}

export function App() {
  const [params, setParams] = useState<GlobalParams>({
    slug: 'hello-world',
    divisions: 8,
    zoom: 1,
    bg: '#2d2d2d',
  });
  const [layerOverrides, setLayerOverrides] = useState<LayerOverride[]>([]);
  const [layerInfos, setLayerInfos] = useState<LayerInfo[]>([]);
  const [colorSchemeIndex, setColorSchemeIndex] = useState(0);

  // Derive current palette from selected color scheme
  const currentPalette = COLOR_SCHEMES[colorSchemeIndex].palette;

  // Two image refs for crossfade
  const imgARef = useRef<HTMLImageElement>(null);
  const imgBRef = useRef<HTMLImageElement>(null);
  const activeRef = useRef<'a' | 'b'>('a');

  const crossfade = useCallback((svg: string) => {
    const url = svgToDataUrl(svg);
    const incoming = activeRef.current === 'a' ? imgBRef.current : imgARef.current;
    const outgoing = activeRef.current === 'a' ? imgARef.current : imgBRef.current;
    if (incoming && outgoing) {
      const oldUrl = incoming.src;
      incoming.src = url;
      if (oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
      outgoing.classList.add('fading-out');
      outgoing.classList.remove('fading-in');
      incoming.classList.add('fading-in');
      incoming.classList.remove('fading-out');
      activeRef.current = activeRef.current === 'a' ? 'b' : 'a';
    }
  }, []);

  // Initial render
  useEffect(() => {
    const result = generate(params, layerOverrides);
    setLayerInfos(result.layers);
    const url = svgToDataUrl(result.svg);
    if (imgARef.current) {
      imgARef.current.src = url;
      imgARef.current.classList.add('fading-in');
    }
    if (imgBRef.current) {
      imgBRef.current.classList.add('fading-out');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-generate with current state
  const apply = useCallback(
    (p: GlobalParams, ov: LayerOverride[]) => {
      const result = generate(p, ov);
      setLayerInfos(result.layers);
      crossfade(result.svg);
    },
    [crossfade],
  );

  const updateGlobal = useCallback(
    (patch: Partial<GlobalParams>) => {
      const next = { ...params, ...patch };
      setParams(next);
      // If slug changes, layer structure changes -- reset overrides
      if ('slug' in patch && patch.slug !== params.slug) {
        setLayerOverrides([]);
        apply(next, []);
      } else {
        apply(next, layerOverrides);
      }
    },
    [params, layerOverrides, apply],
  );

  const updateLayerOverride = useCallback(
    (index: number, patch: Partial<LayerOverride>) => {
      const next = [...layerOverrides];
      // Ensure array is large enough
      while (next.length <= index) next.push({});
      next[index] = { ...next[index], ...patch };
      setLayerOverrides(next);
      apply(params, next);
    },
    [params, layerOverrides, apply],
  );

  const handleColorSchemeChange = useCallback(
    (index: number) => {
      setColorSchemeIndex(index);
      const newPalette = COLOR_SCHEMES[index].palette;
      const newOverrides = layerInfos.map((layer, i) => {
        const existing = layerOverrides[i] ?? {};
        const currentColor = existing.fg ?? layer.fg;
        return { ...existing, fg: mapLayerColor(currentColor, newPalette, i) };
      });
      setLayerOverrides(newOverrides);
      const nextParams = { ...params, bg: newPalette[0] };
      setParams(nextParams);
      apply(nextParams, newOverrides);
    },
    [params, layerOverrides, layerInfos, apply],
  );

  const randomize = useCallback(() => {
    const randomSchemeIndex = Math.floor(Math.random() * COLOR_SCHEMES.length);
    const newPalette = COLOR_SCHEMES[randomSchemeIndex].palette;
    const lineColors = newPalette.slice(1);
    const p: GlobalParams = {
      slug: randomSlug(),
      divisions: DIVISIONS_OPTIONS[Math.floor(Math.random() * DIVISIONS_OPTIONS.length)],
      zoom: Math.round((1 + Math.random() * 9) * 10) / 10,
      bg: newPalette[0],
    };
    // Pre-assign palette colors for up to 4 layers (max layer count).
    // The generator ignores extra overrides beyond the actual layer count.
    const newOverrides = lineColors.map((color) => ({ fg: color }));
    setColorSchemeIndex(randomSchemeIndex);
    setParams(p);
    // Single generation with color overrides already applied
    const result = generate(p, newOverrides);
    setLayerOverrides(newOverrides.slice(0, result.layers.length));
    setLayerInfos(result.layers);
    crossfade(result.svg);
  }, [crossfade]);

  const download = useCallback(() => {
    const result = generate(params, layerOverrides);
    const optimized = finalizeSvg(result.svg);
    const blob = new Blob([optimized], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kumiko-${params.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [params, layerOverrides]);

  return (
    <div className="app">
      {/* SVG background with two layers for crossfade */}
      <div className="svg-layer">
        <img ref={imgARef} alt="" />
        <img ref={imgBRef} alt="" className="svg-layer-back" />
      </div>

      {/* Logo link */}
      <a
        className="site-link"
        href="https://takazudomodular.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={`${import.meta.env.BASE_URL}takazudo.svg`} alt="Takazudo Modular" className="site-logo" />
        <span>Takazudo Modular</span>
      </a>

      {/* Controls */}
      <div className="controls">
        <h1>kumiko-gen</h1>

        <div className="control-group">
          <label htmlFor="slug-input">Slug / Seed</label>
          <div className="slug-row">
            <input
              id="slug-input"
              type="text"
              value={params.slug}
              onChange={(e) => updateGlobal({ slug: e.target.value })}
            />
            <button className="btn btn-random" onClick={randomize}>
              Random
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Divisions</label>
          <div className="radio-group">
            {DIVISIONS_OPTIONS.map((d) => (
              <button
                key={d}
                className={params.divisions === d ? 'active' : ''}
                aria-pressed={params.divisions === d}
                onClick={() => updateGlobal({ divisions: d })}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="zoom-input">Zoom</label>
          <div className="range-row">
            <input
              id="zoom-input"
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={params.zoom}
              onChange={(e) => updateGlobal({ zoom: parseFloat(e.target.value) })}
            />
            <span className="range-value">{params.zoom.toFixed(1)}</span>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="bg-color-input">Background</label>
          <div className="color-input-row">
            <input
              id="bg-color-input"
              type="color"
              value={params.bg}
              onChange={(e) => updateGlobal({ bg: e.target.value })}
            />
            <span>{params.bg}</span>
          </div>
        </div>

        {/* Color scheme selector */}
        <div className="control-group">
          <label htmlFor="scheme-select">Color Scheme</label>
          <select
            id="scheme-select"
            className="scheme-select"
            value={colorSchemeIndex}
            onChange={(e) => handleColorSchemeChange(Number(e.target.value))}
          >
            {COLOR_SCHEMES.map((scheme, i) => (
              <option key={scheme.name} value={i}>
                {scheme.name}
              </option>
            ))}
          </select>
          <div className="scheme-preview" aria-hidden="true">
            {currentPalette.map((color, i) => (
              <span
                key={i}
                className="scheme-dot"
                style={{ background: color }}
              />
            ))}
          </div>
        </div>

        {/* Per-layer controls */}
        <div className="layers-section">
          <label className="section-label">Layers ({layerInfos.length})</label>
          {layerInfos.map((layer, i) => {
            const override = layerOverrides[i] ?? {};
            const currentFg = override.fg ?? layer.fg;
            const currentSw = override.strokeWidth ?? layer.strokeWidth;
            return (
              <div key={i} className="layer-card">
                <div className="layer-header">
                  <span
                    className="layer-color-dot"
                    style={{ background: currentFg }}
                  />
                  <span className="layer-name">{layer.patternName}</span>
                  <span className="layer-meta">
                    x{layer.overlaps}
                  </span>
                </div>
                <div className="layer-controls">
                  <div className="layer-color-row">
                    <div className="color-palette compact">
                      {currentPalette.slice(1).map((color) => (
                        <button
                          key={color}
                          className={`color-swatch small ${currentFg === color ? 'active' : ''}`}
                          style={{ background: color }}
                          onClick={() => updateLayerOverride(i, { fg: color })}
                          aria-label={`Set layer color to ${color}`}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={currentFg}
                      onChange={(e) =>
                        updateLayerOverride(i, { fg: e.target.value })
                      }
                    />
                  </div>
                  <div className="range-row">
                    <input
                      type="range"
                      min="0.3"
                      max="5"
                      step="0.1"
                      value={currentSw}
                      onChange={(e) =>
                        updateLayerOverride(i, {
                          strokeWidth: parseFloat(e.target.value),
                        })
                      }
                    />
                    <span className="range-value">{currentSw.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="button-row">
          <button className="btn btn-download" onClick={download}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
