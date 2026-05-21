import { describe, expect, it } from 'vitest';
import {
  generateOklchPresets,
  hexToOklch,
  hslToOklch,
  normalizeHexColor,
  oklchToHex,
  oklchToHsl,
} from './color';

describe('color utilities', () => {
  it('normalizes display hex values', () => {
    expect(normalizeHexColor('305ddd')).toBe('#305DDD');
    expect(normalizeHexColor('#abc')).toBe('#AABBCC');
    expect(normalizeHexColor('not-a-color')).toBeNull();
  });

  it('round trips hex through OKLCH with culori conversion', () => {
    const oklch = hexToOklch('#305DDD');

    expect(oklch.l).toBeGreaterThan(50);
    expect(oklch.c).toBeGreaterThan(0.15);
    expect(oklch.h).toBeGreaterThan(250);
    expect(oklchToHex(oklch)).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('converts HSL edits into OKLCH values', () => {
    const oklch = hslToOklch({ h: 220, s: 72, l: 53 });
    const hsl = oklchToHsl(oklch);

    expect(oklch.c).toBeGreaterThan(0);
    expect(hsl.h).toBeGreaterThanOrEqual(0);
    expect(hsl.h).toBeLessThanOrEqual(360);
  });

  it('generates twelve OKLCH preset hues from red to blue', () => {
    const presets = generateOklchPresets();

    expect(presets).toHaveLength(12);
    expect(presets.map((preset) => preset.hue)).toEqual([
      0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
    ]);
    expect(presets.every((preset) => /^#[0-9A-F]{6}$/.test(preset.hex))).toBe(true);
  });
});
