import { converter, formatHex, parse, type CuloriColor } from 'culori';

export const DEFAULT_PRIMARY_HEX = '#C55120';
export const PRESET_HUES = Array.from({ length: 12 }, (_, index) => index * 30);

export type OklchColor = {
  l: number;
  c: number;
  h: number;
};

export type HslColor = {
  h: number;
  s: number;
  l: number;
};

export type ColorPreset = {
  hue: number;
  hex: string;
  oklch: OklchColor;
};

const toOklch = converter('oklch');
const toHsl = converter('hsl');

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, places = 3) => {
  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
};

const fallbackOklch: OklchColor = {
  l: 57.8,
  c: 0.151,
  h: 49,
};

const toHex = (color: CuloriColor) => formatHex(color).toUpperCase();

export const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const color = parse(withHash);

  return color ? toHex(color) : null;
};

export const oklchToCulori = ({ l, c, h }: OklchColor): CuloriColor => ({
  mode: 'oklch',
  l: clamp(l, 0, 100) / 100,
  c: clamp(c, 0, 0.4),
  h: ((h % 360) + 360) % 360,
});

export const hexToOklch = (hex: string): OklchColor => {
  const parsed = parse(normalizeHexColor(hex) ?? DEFAULT_PRIMARY_HEX);
  const color = parsed ? toOklch(parsed) : null;

  if (!color || typeof color.l !== 'number') {
    return fallbackOklch;
  }

  return {
    l: round(color.l * 100, 1),
    c: round(typeof color.c === 'number' ? color.c : 0),
    h: round(typeof color.h === 'number' ? color.h : 0, 1),
  };
};

export const oklchToHex = (color: OklchColor) => toHex(oklchToCulori(color));

export const oklchToHsl = (color: OklchColor): HslColor => {
  const hsl = toHsl(oklchToCulori(color));

  return {
    h: round(typeof hsl?.h === 'number' ? hsl.h : 0, 1),
    s: round(clamp((typeof hsl?.s === 'number' ? hsl.s : 0) * 100, 0, 100), 1),
    l: round(clamp((typeof hsl?.l === 'number' ? hsl.l : 0) * 100, 0, 100), 1),
  };
};

export const hslToOklch = ({ h, s, l }: HslColor): OklchColor => {
  const color = toOklch({
    mode: 'hsl',
    h: ((h % 360) + 360) % 360,
    s: clamp(s, 0, 100) / 100,
    l: clamp(l, 0, 100) / 100,
  });

  if (!color || typeof color.l !== 'number') {
    return fallbackOklch;
  }

  return {
    l: round(color.l * 100, 1),
    c: round(typeof color.c === 'number' ? color.c : 0),
    h: round(typeof color.h === 'number' ? color.h : 0, 1),
  };
};

export const generateOklchPresets = (): ColorPreset[] =>
  PRESET_HUES.map((hue) => {
    const oklch = { l: 62, c: 0.18, h: hue };

    return {
      hue,
      oklch,
      hex: oklchToHex(oklch),
    };
  });
