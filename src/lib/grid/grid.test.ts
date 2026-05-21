import { describe, expect, it } from 'vitest';
import {
  calculateGridLayouts,
  calculateGridSpan,
  generateGridSvg,
  validateGridInput,
} from './grid';

describe('calculateGridLayouts', () => {
  it('includes a 106px column width with 16px gutters for 960px and 8 columns', () => {
    const layouts = calculateGridLayouts({ width: 960, columns: 8 });

    expect(layouts).toContainEqual({ columnWidth: 106, gutterWidth: 16 });
  });

  it('only returns integer column widths', () => {
    const layouts = calculateGridLayouts({ width: 960, columns: 8 });

    expect(layouts.every((layout) => Number.isInteger(layout.columnWidth))).toBe(true);
  });
});

describe('validateGridInput', () => {
  it.each([
    [{ width: 960.5, columns: 8 }, 'not-integer'],
    [{ width: 10001, columns: 8 }, 'too-wide'],
    [{ width: 960, columns: 1 }, 'too-few-columns'],
    [{ width: 8, columns: 9 }, 'columns-exceed-width'],
  ] as const)('rejects invalid input %o with %s', (input, code) => {
    expect(validateGridInput(input)).toMatchObject({ ok: false, code });
  });
});

describe('calculateGridSpan', () => {
  it('calculates a 3 column span and 9 column complement for a 1170px grid', () => {
    expect(
      calculateGridSpan({
        width: 1170,
        columns: 12,
        columnWidth: 70,
        gutterWidth: 30,
        spanColumns: 3,
      }),
    ).toEqual({
      spanColumns: 3,
      spanWidth: 270,
      remainingWidth: 900,
      complementColumns: 9,
      complementWidth: 870,
      separatorGutterWidth: 30,
    });
  });

  it('rejects spans that do not leave a complementary column range', () => {
    expect(
      calculateGridSpan({
        width: 1170,
        columns: 12,
        columnWidth: 70,
        gutterWidth: 30,
        spanColumns: 12,
      }),
    ).toBeNull();
  });
});

describe('generateGridSvg', () => {
  it('generates an SVG with the expected canvas, columns, and guide lines', () => {
    const svg = generateGridSvg({
      width: 960,
      columns: 8,
      columnWidth: 106,
      gutterWidth: 16,
      height: 200,
    });

    expect(svg).toContain('<svg width="960" height="200" viewBox="0 0 960 200"');
    expect(svg).toContain('<rect x="0" y="0" width="106" height="200"');
    expect(svg).toContain('<line x1="106" y1="0" x2="106" y2="200"');
  });
});
