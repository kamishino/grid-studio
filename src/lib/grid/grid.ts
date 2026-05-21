export type GridInput = {
  width: number;
  columns: number;
};

export type GridLayout = {
  columnWidth: number;
  gutterWidth: number;
};

export type GridSvgInput = GridInput &
  GridLayout & {
    height: number;
    colors?: GridSvgColors;
  };

export type GridSvgColors = {
  background: string;
  columnFill: string;
  guide: string;
};

const defaultSvgColors: GridSvgColors = {
  background: '#FDFCF7',
  columnFill: '#C55120',
  guide: '#C55120',
};

export type GridValidationErrorCode =
  | 'not-integer'
  | 'too-wide'
  | 'too-few-columns'
  | 'columns-exceed-width';

export type GridValidationResult =
  | { ok: true }
  | { ok: false; code: GridValidationErrorCode; message: string };

export function validateGridInput({
  width,
  columns,
}: GridInput): GridValidationResult {
  if (!Number.isInteger(width) || !Number.isInteger(columns)) {
    return {
      ok: false,
      code: 'not-integer',
      message: 'Use whole numbers for width and columns.',
    };
  }

  if (width > 10000) {
    return {
      ok: false,
      code: 'too-wide',
      message: 'Overall width must be 10,000 pixels or less.',
    };
  }

  if (columns < 2) {
    return {
      ok: false,
      code: 'too-few-columns',
      message: 'Use at least 2 columns.',
    };
  }

  if (columns > width) {
    return {
      ok: false,
      code: 'columns-exceed-width',
      message: 'Columns cannot exceed the overall width.',
    };
  }

  return { ok: true };
}

export function calculateGridLayouts(input: GridInput): GridLayout[] {
  const validation = validateGridInput(input);

  if (!validation.ok) {
    return [];
  }

  const { width, columns } = input;
  const layouts: GridLayout[] = [];
  let gutterWidth = 0;
  let columnWidth: number;

  do {
    columnWidth = (width - (columns - 1) * gutterWidth) / columns;

    if (Number.isInteger(columnWidth)) {
      layouts.push({ columnWidth, gutterWidth });
    }

    gutterWidth += 1;
  } while (columnWidth > gutterWidth);

  return layouts;
}

export function generateGridSvg({
  width,
  columns,
  columnWidth,
  gutterWidth,
  height,
  colors = defaultSvgColors,
}: GridSvgInput): string {
  const groups = Array.from({ length: columns }, (_, index) => {
    const x = index * (columnWidth + gutterWidth);
    const x2 = x + columnWidth;

    return [
      '<g>',
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${colors.guide}" stroke-opacity="0.55" stroke-width="1" />`,
      `<rect x="${x}" y="0" width="${columnWidth}" height="${height}" fill="${colors.columnFill}" fill-opacity="0.48" />`,
      `<line x1="${x2}" y1="0" x2="${x2}" y2="${height}" stroke="${colors.guide}" stroke-opacity="0.55" stroke-width="1" />`,
      '</g>',
    ].join('');
  }).join('');

  return [
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="${width}" height="${height}" fill="${colors.background}" />`,
    groups,
    '</svg>',
  ].join('');
}
