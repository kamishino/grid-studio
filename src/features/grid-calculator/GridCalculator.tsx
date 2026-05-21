import { Download, Eye, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  calculateGridLayouts,
  calculateGridSpan,
  generateGridSvg,
  type GridSpanCalculation,
  type GridLayout,
  type GridSvgColors,
  validateGridInput,
} from '../../lib/grid/grid';
import './GridCalculator.css';

const SVG_HEIGHT = 200;
const DEFAULT_PREVIEW_MODE = 'fit';
const DEFAULT_PRIMARY_COLOR = '#C55120';
const PRIMARY_COLOR_STORAGE_KEY = 'grid-studio-primary-color';

type PreviewMode = 'fit' | 'actual';
type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type HslColor = {
  h: number;
  s: number;
  l: number;
};

type OklchColor = {
  l: number;
  c: number;
  h: number;
};

const parseIntegerInput = (value: string) => {
  if (!/^\d+$/.test(value)) {
    return Number.NaN;
  }

  return Number(value);
};

const clampInputValue = (
  value: string,
  delta: number,
  min = 0,
  max = Number.POSITIVE_INFINITY,
) => {
  const parsed = parseIntegerInput(value);
  const current = Number.isFinite(parsed) ? parsed : min;
  return String(Math.min(max, Math.max(min, current + delta)));
};

const getDefaultSpanColumns = (columns: number) =>
  Math.max(1, Math.min(3, columns - 1));

const getCssToken = (name: string, fallback: string) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  return (
    window.getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toUpperCase();
  }

  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return null;
};

const hexToRgb = (hex: string): RgbColor => {
  const normalized = normalizeHexColor(hex) ?? DEFAULT_PRIMARY_COLOR;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
};

const rgbToHex = ({ r, g, b }: RgbColor) =>
  `#${[r, g, b]
    .map((channel) =>
      Math.round(clampNumber(channel, 0, 255)).toString(16).padStart(2, '0'),
    )
    .join('')}`.toUpperCase();

const hexToHsl = (hex: string): HslColor => {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) };
  }

  const saturation =
    delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (max === red) {
    hue = 60 * (((green - blue) / delta) % 6);
  } else if (max === green) {
    hue = 60 * ((blue - red) / delta + 2);
  } else {
    hue = 60 * ((red - green) / delta + 4);
  }

  return {
    h: Math.round((hue + 360) % 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
};

const hslToHex = ({ h, s, l }: HslColor) => {
  const saturation = clampNumber(s, 0, 100) / 100;
  const lightness = clampNumber(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  const hue = ((h % 360) + 360) % 360;
  let rgb: RgbColor;

  if (hue < 60) {
    rgb = { r: chroma, g: x, b: 0 };
  } else if (hue < 120) {
    rgb = { r: x, g: chroma, b: 0 };
  } else if (hue < 180) {
    rgb = { r: 0, g: chroma, b: x };
  } else if (hue < 240) {
    rgb = { r: 0, g: x, b: chroma };
  } else if (hue < 300) {
    rgb = { r: x, g: 0, b: chroma };
  } else {
    rgb = { r: chroma, g: 0, b: x };
  }

  return rgbToHex({
    r: (rgb.r + m) * 255,
    g: (rgb.g + m) * 255,
    b: (rgb.b + m) * 255,
  });
};

const srgbToLinear = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const linearToSrgb = (channel: number) => {
  const normalized =
    channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
  return clampNumber(normalized * 255, 0, 255);
};

const hexToOklch = (hex: string): OklchColor => {
  const { r, g, b } = hexToRgb(hex);
  const red = srgbToLinear(r);
  const green = srgbToLinear(g);
  const blue = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const oklabL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: Math.round(oklabL * 1000) / 10,
    c: Math.round(Math.sqrt(a * a + bAxis * bAxis) * 1000) / 1000,
    h: Math.round(((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360),
  };
};

const oklchToHex = ({ l, c, h }: OklchColor) => {
  const lightness = clampNumber(l, 0, 100) / 100;
  const chroma = clampNumber(c, 0, 0.4);
  const hueRadians = (h * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const lCubed = lPrime ** 3;
  const mCubed = mPrime ** 3;
  const sCubed = sPrime ** 3;

  return rgbToHex({
    r: linearToSrgb(4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed),
    g: linearToSrgb(-1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed),
    b: linearToSrgb(-0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed),
  });
};

const getStoredPrimaryColor = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_PRIMARY_COLOR;
  }

  return (
    normalizeHexColor(window.localStorage.getItem(PRIMARY_COLOR_STORAGE_KEY) ?? '') ??
    DEFAULT_PRIMARY_COLOR
  );
};

const getPreviewColors = (primaryColor = DEFAULT_PRIMARY_COLOR): GridSvgColors => ({
  background: getCssToken('--component-preview-background', '#FDFCF7'),
  columnFill: primaryColor,
  guide: primaryColor,
  inactiveColumnFill: primaryColor,
  inactiveGuide: primaryColor,
});

export function GridCalculator() {
  const [widthInput, setWidthInput] = useState('960');
  const [columnsInput, setColumnsInput] = useState('8');
  const [spanColumnsInput, setSpanColumnsInput] = useState('3');
  const [previewMode, setPreviewMode] = useState<PreviewMode>(DEFAULT_PREVIEW_MODE);
  const [primaryColor, setPrimaryColor] = useState(getStoredPrimaryColor);
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);

  const width = parseIntegerInput(widthInput);
  const columns = parseIntegerInput(columnsInput);
  const validation = validateGridInput({ width, columns });
  const layouts = useMemo(
    () => calculateGridLayouts({ width, columns }),
    [columns, width],
  );
  const [selectedLayout, setSelectedLayout] = useState<GridLayout | null>(null);
  const activeLayout = selectedLayout ?? layouts[0] ?? null;
  const maxSpanColumns = validation.ok ? Math.max(1, columns - 1) : 1;
  const parsedSpanColumns = parseIntegerInput(spanColumnsInput);
  const spanColumns = Number.isFinite(parsedSpanColumns)
    ? Math.min(maxSpanColumns, Math.max(1, parsedSpanColumns))
    : getDefaultSpanColumns(Number.isInteger(columns) ? columns : 2);
  const spanCalculation =
    validation.ok && activeLayout
      ? calculateGridSpan({
          width,
          columns,
          ...activeLayout,
          spanColumns,
        })
      : null;
  const activeSvg =
    validation.ok && activeLayout
      ? generateGridSvg({
          width,
          columns,
          ...activeLayout,
          height: SVG_HEIGHT,
          colors: getPreviewColors(primaryColor),
          selectedSpanColumns: spanColumns,
        })
      : null;

  useEffect(() => {
    setSelectedLayout(null);
  }, [columns, width]);

  useEffect(() => {
    if (Number.isInteger(columns) && columns >= 2) {
      setSpanColumnsInput(String(getDefaultSpanColumns(columns)));
    }
  }, [columns]);

  useEffect(() => {
    window.localStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, primaryColor);
  }, [primaryColor]);

  const downloadSvg = (layout: GridLayout) => {
    const svg = generateGridSvg({
      width,
      columns,
      ...layout,
      height: SVG_HEIGHT,
      colors: getPreviewColors(primaryColor),
      selectedSpanColumns: spanColumns,
    });
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grid-${width}px-${columns}col-${layout.columnWidth}px-${layout.gutterWidth}px.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activatePreview = (layout: GridLayout) => {
    setSelectedLayout(layout);
  };

  const handleRowKeyDown = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    layout: GridLayout,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activatePreview(layout);
    }
  };

  const handleSpanColumnsChange = (value: string) => {
    if (value === '') {
      setSpanColumnsInput(value);
      return;
    }

    const parsed = parseIntegerInput(value);

    if (Number.isFinite(parsed)) {
      setSpanColumnsInput(String(Math.min(maxSpanColumns, Math.max(1, parsed))));
    }
  };

  return (
    <div className="tool-layout">
      <section className="control-panel" aria-label="Grid inputs">
        <GridNumberField
          id="width"
          label="Overall width"
          suffix="px"
          value={widthInput}
          onChange={setWidthInput}
          onStep={(delta) => setWidthInput((current) => clampInputValue(current, delta))}
        />
        <GridNumberField
          id="columns"
          label="Columns"
          value={columnsInput}
          onChange={setColumnsInput}
          onStep={(delta) =>
            setColumnsInput((current) => clampInputValue(current, delta))
          }
        />
        {!validation.ok ? (
          <p className="input-alert" role="alert">
            {validation.message}
          </p>
        ) : (
          <p className="input-note">
            {layouts.length} valid layout{layouts.length === 1 ? '' : 's'} found.
          </p>
        )}
      </section>

      <section className="results-panel" aria-labelledby="results-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Results</p>
            <h2 id="results-title">Available grids</h2>
          </div>
          <p>{validation.ok ? `${width}px / ${columns} columns` : 'Waiting for valid input'}</p>
        </div>

        {validation.ok && layouts.length > 0 ? (
          <table className="results-table">
            <thead>
              <tr>
                <th scope="col">Column width</th>
                <th scope="col">Gutter width</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {layouts.map((layout) => (
                <tr
                  key={`${layout.columnWidth}-${layout.gutterWidth}`}
                  tabIndex={0}
                  aria-label={`Preview ${layout.columnWidth}px columns and ${layout.gutterWidth}px gutters`}
                  className={activeLayout === layout ? 'is-selected' : undefined}
                  onClick={() => activatePreview(layout)}
                  onKeyDown={(event) => handleRowKeyDown(event, layout)}
                >
                  <td>{layout.columnWidth}px</td>
                  <td>{layout.gutterWidth}px</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          activatePreview(layout);
                        }}
                        aria-label={`Preview ${layout.columnWidth}px columns and ${layout.gutterWidth}px gutters`}
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          downloadSvg(layout);
                        }}
                        aria-label={`Download SVG for ${layout.columnWidth}px columns and ${layout.gutterWidth}px gutters`}
                      >
                        <Download size={16} />
                        SVG
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            {validation.ok
              ? 'No integer column and gutter combinations were found.'
              : 'Enter a valid width and column count to calculate layouts.'}
          </div>
        )}
      </section>

      {activeSvg && activeLayout ? (
        <section className="preview-panel" aria-label="Selected grid preview">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>
                {activeLayout.columnWidth}px columns, {activeLayout.gutterWidth}px
                gutters
              </h2>
            </div>
            <div className="preview-toolbar">
              <PrimaryColorControl
                color={primaryColor}
                isOpen={isColorPopoverOpen}
                onChange={setPrimaryColor}
                onToggle={() => setIsColorPopoverOpen((isOpen) => !isOpen)}
              />
              <PreviewModeControl mode={previewMode} onChange={setPreviewMode} />
              <button
                className="download-button"
                type="button"
                onClick={() => downloadSvg(activeLayout)}
              >
                <Download size={16} />
                Download SVG
              </button>
            </div>
          </div>

          <PreviewMetrics width={width} columns={columns} layout={activeLayout} />

          {spanCalculation ? (
            <SpanCalculator
              maxSpanColumns={maxSpanColumns}
              spanCalculation={spanCalculation}
              spanColumnsInput={spanColumnsInput}
              onSpanColumnsChange={handleSpanColumnsChange}
              onSpanColumnsStep={(delta) =>
                setSpanColumnsInput((current) =>
                  clampInputValue(current, delta, 1, maxSpanColumns),
                )
              }
            />
          ) : null}

          <div
            className={`svg-preview is-${previewMode}`}
            aria-label={`${width}px grid preview canvas`}
          >
            <div
              className="preview-measurement"
              style={
                {
                  '--preview-width': `${width}px`,
                  '--preview-primary': primaryColor,
                } as React.CSSProperties
              }
            >
              <DimensionRuler label="Overall Width" value={`${width}px`} />
              <div
                className="svg-preview-canvas"
                dangerouslySetInnerHTML={{ __html: activeSvg }}
              />
              <div
                className="segment-rulers"
                style={{
                  width: `${Math.min(
                    100,
                    ((columns > 2
                      ? activeLayout.columnWidth * 2 + activeLayout.gutterWidth * 2
                      : activeLayout.columnWidth + activeLayout.gutterWidth) /
                      width) *
                      100,
                  )}%`,
                  gridTemplateColumns:
                    columns > 2
                      ? `${activeLayout.columnWidth}fr ${Math.max(
                          activeLayout.gutterWidth,
                          1,
                        )}fr ${activeLayout.columnWidth}fr ${Math.max(
                          activeLayout.gutterWidth,
                          1,
                        )}fr`
                      : `${activeLayout.columnWidth}fr ${Math.max(
                          activeLayout.gutterWidth,
                          1,
                        )}fr`,
                }}
              >
                <DimensionRuler
                  label="Column Width"
                  value={`${activeLayout.columnWidth}px`}
                />
                {columns > 2 ? (
                  <>
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                  </>
                ) : null}
                <DimensionRuler
                  label="Gutter Width"
                  value={`${activeLayout.gutterWidth}px`}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

type PreviewModeControlProps = {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
};

function PreviewModeControl({ mode, onChange }: PreviewModeControlProps) {
  const modes = [
    ['fit', 'Fit'],
    ['actual', 'Actual'],
  ] as const;

  return (
    <div className="preview-mode-control" aria-label="Preview display mode">
      {modes.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

type PrimaryColorControlProps = {
  color: string;
  isOpen: boolean;
  onChange: (color: string) => void;
  onToggle: () => void;
};

function PrimaryColorControl({
  color,
  isOpen,
  onChange,
  onToggle,
}: PrimaryColorControlProps) {
  const hsl = hexToHsl(color);
  const oklch = hexToOklch(color);

  const updateHex = (value: string) => {
    const normalized = normalizeHexColor(value);

    if (normalized) {
      onChange(normalized);
    }
  };

  const updateHsl = (patch: Partial<HslColor>) => {
    onChange(hslToHex({ ...hsl, ...patch }));
  };

  const updateOklch = (patch: Partial<OklchColor>) => {
    onChange(oklchToHex({ ...oklch, ...patch }));
  };

  return (
    <div className="primary-color-control">
      <button
        className="color-popover-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls="primary-color-popover"
        onClick={onToggle}
      >
        <span
          className="color-swatch"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        Primary color
      </button>

      {isOpen ? (
        <div
          id="primary-color-popover"
          className="color-popover"
          aria-label="Primary color controls"
        >
          <label className="color-field">
            <span>Hex Code</span>
            <input
              aria-label="Hex Code"
              value={color}
              onChange={(event) => updateHex(event.target.value)}
            />
          </label>

          <div className="color-slider-group" aria-label="HSL Slider">
            <p>HSL Slider</p>
            <ColorSlider
              label="HSL Hue"
              min={0}
              max={360}
              value={hsl.h}
              onChange={(value) => updateHsl({ h: value })}
            />
            <ColorSlider
              label="HSL Saturation"
              min={0}
              max={100}
              value={hsl.s}
              onChange={(value) => updateHsl({ s: value })}
              suffix="%"
            />
            <ColorSlider
              label="HSL Lightness"
              min={0}
              max={100}
              value={hsl.l}
              onChange={(value) => updateHsl({ l: value })}
              suffix="%"
            />
          </div>

          <div className="color-slider-group" aria-label="OKLCH Slider">
            <p>OKLCH Slider</p>
            <ColorSlider
              label="OKLCH Lightness"
              min={0}
              max={100}
              value={oklch.l}
              onChange={(value) => updateOklch({ l: value })}
              suffix="%"
            />
            <ColorSlider
              label="OKLCH Chroma"
              min={0}
              max={0.4}
              step={0.001}
              value={oklch.c}
              onChange={(value) => updateOklch({ c: value })}
            />
            <ColorSlider
              label="OKLCH Hue"
              min={0}
              max={360}
              value={oklch.h}
              onChange={(value) => updateOklch({ h: value })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

type ColorSliderProps = {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
};

function ColorSlider({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  suffix,
}: ColorSliderProps) {
  return (
    <label className="color-slider">
      <span>{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>
        {Number.isInteger(value) ? value : value.toFixed(3)}
        {suffix}
      </output>
    </label>
  );
}

type PreviewMetricsProps = {
  width: number;
  columns: number;
  layout: GridLayout;
};

function PreviewMetrics({ width, columns, layout }: PreviewMetricsProps) {
  const metrics = [
    ['Column Width', `${layout.columnWidth}px`],
    ['Gutter Width', `${layout.gutterWidth}px`],
    ['Number of Columns', String(columns)],
    ['Overall Width', `${width}px`],
  ] as const;

  return (
    <dl className="preview-metrics" aria-label="Selected grid dimensions">
      {metrics.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type SpanCalculatorProps = {
  maxSpanColumns: number;
  spanCalculation: GridSpanCalculation;
  spanColumnsInput: string;
  onSpanColumnsChange: (value: string) => void;
  onSpanColumnsStep: (delta: number) => void;
};

function SpanCalculator({
  maxSpanColumns,
  spanCalculation,
  spanColumnsInput,
  onSpanColumnsChange,
  onSpanColumnsStep,
}: SpanCalculatorProps) {
  return (
    <section className="span-calculator" aria-labelledby="span-calculator-title">
      <div className="span-calculator-input">
        <div>
          <h3 id="span-calculator-title">Span calculator</h3>
          <p>Measure a contiguous column span against the selected grid.</p>
        </div>
        <GridNumberField
          id="span-columns"
          label="Span columns"
          value={spanColumnsInput}
          onChange={onSpanColumnsChange}
          onStep={onSpanColumnsStep}
        />
      </div>

      <dl className="span-results" aria-label="Selected span dimensions">
        <div>
          <dt>Span width</dt>
          <dd>{spanCalculation.spanWidth}px</dd>
        </div>
        <div>
          <dt>Remaining width</dt>
          <dd>{spanCalculation.remainingWidth}px</dd>
        </div>
        <div>
          <dt>Complement</dt>
          <dd>
            {spanCalculation.complementColumns} columns,{' '}
            {spanCalculation.complementWidth}px
          </dd>
        </div>
        <div>
          <dt>Separator gutter</dt>
          <dd>{spanCalculation.separatorGutterWidth}px</dd>
        </div>
      </dl>

      <p className="span-limit">Span range: 1-{maxSpanColumns} columns</p>
    </section>
  );
}

type DimensionRulerProps = {
  label: string;
  value: string;
};

function DimensionRuler({ label, value }: DimensionRulerProps) {
  return (
    <div className="dimension-ruler" aria-label={`${label} ${value}`}>
      <span className="ruler-line" aria-hidden="true" />
      <span className="ruler-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

type GridNumberFieldProps = {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  onChange: (value: string) => void;
  onStep: (delta: number) => void;
};

function GridNumberField({
  id,
  label,
  value,
  suffix,
  onChange,
  onStep,
}: GridNumberFieldProps) {
  return (
    <div className="number-field">
      <label htmlFor={id}>{label}</label>
      <div className="number-control">
        <input
          id={id}
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <span aria-hidden="true">{suffix}</span> : null}
        <div className="stepper" aria-label={`${label} controls`}>
          <button type="button" onClick={() => onStep(1)} aria-label={`Increase ${label}`}>
            <Plus size={16} strokeWidth={2.3} />
          </button>
          <button type="button" onClick={() => onStep(-1)} aria-label={`Decrease ${label}`}>
            <Minus size={16} strokeWidth={2.3} />
          </button>
        </div>
      </div>
    </div>
  );
}
