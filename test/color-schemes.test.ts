import { describe, it, expect } from 'vitest';
import {
  COLOR_SCHEMES,
  colorSchemesByKey,
  getColorSchemeNames,
  normalizeSchemeKey,
} from '../src/color-schemes.js';

describe('COLOR_SCHEMES', () => {
  it('has at least 30 schemes', () => {
    expect(COLOR_SCHEMES.length).toBeGreaterThanOrEqual(30);
  });

  it('all schemes have exactly 8 palette entries', () => {
    for (const scheme of COLOR_SCHEMES) {
      expect(scheme.palette).toHaveLength(8);
    }
  });

  it('all palette entries are valid hex colors', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const scheme of COLOR_SCHEMES) {
      for (const color of scheme.palette) {
        expect(color).toMatch(hexRegex);
      }
    }
  });

  it('no duplicate scheme names', () => {
    const names = COLOR_SCHEMES.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('first scheme is "Default"', () => {
    expect(COLOR_SCHEMES[0].name).toBe('Default');
  });

  it('Default scheme palette[0] matches generator COLOR_SCHEME.bg', () => {
    expect(COLOR_SCHEMES[0].palette[0]).toBe('#2d2d2d');
  });

  it('Default scheme palette[1-7] overlap with generator COLOR_SCHEME.fg', () => {
    const defaultFg = COLOR_SCHEMES[0].palette.slice(1);
    // The Default scheme's line colors should be the same as the generator's built-in fg colors
    // (generator has 8 fg colors, Default has 7 line colors — they share the same base values)
    const generatorFg = [
      '#b5524a', '#5ea85e', '#c8a64e', '#737d8e', '#a87a96', '#5a8a8e', '#d5d5d5',
    ];
    expect(defaultFg).toEqual(generatorFg);
  });
});

describe('colorSchemesByKey', () => {
  it('contains all schemes', () => {
    expect(colorSchemesByKey.size).toBe(COLOR_SCHEMES.length);
  });

  it('keys are normalized lowercase-hyphenated', () => {
    for (const key of colorSchemesByKey.keys()) {
      expect(key).toBe(key.toLowerCase());
      expect(key).not.toMatch(/\s/);
    }
  });

  it('lookup by normalized name works', () => {
    expect(colorSchemesByKey.get('dracula')?.name).toBe('Dracula');
    expect(colorSchemesByKey.get('catppuccin-mocha')?.name).toBe('Catppuccin Mocha');
    expect(colorSchemesByKey.get('tokyonight-storm')?.name).toBe('TokyoNight Storm');
  });
});

describe('getColorSchemeNames', () => {
  it('returns array of display names', () => {
    const names = getColorSchemeNames();
    expect(names.length).toBe(COLOR_SCHEMES.length);
    expect(names[0]).toBe('Default');
    expect(names).toContain('Dracula');
    expect(names).toContain('Nord');
  });
});

describe('normalizeSchemeKey', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(normalizeSchemeKey('Catppuccin Mocha')).toBe('catppuccin-mocha');
  });

  it('replaces underscores with hyphens', () => {
    expect(normalizeSchemeKey('Tokyo_Night')).toBe('tokyo-night');
  });

  it('handles already-normalized input', () => {
    expect(normalizeSchemeKey('dracula')).toBe('dracula');
  });

  it('handles mixed spaces and underscores', () => {
    expect(normalizeSchemeKey('Rose Pine_Moon')).toBe('rose-pine-moon');
  });
});
