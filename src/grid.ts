export type GridInput = {
  width: number;
  columns: number;
};

export type GridLayout = {
  columnWidth: number;
  gutterWidth: number;
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
