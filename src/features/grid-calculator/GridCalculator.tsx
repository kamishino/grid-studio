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

type PreviewMode = 'fit' | 'actual';

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

const getPreviewColors = (): GridSvgColors => ({
  background: getCssToken('--component-preview-background', '#FDFCF7'),
  columnFill: getCssToken('--component-preview-column-fill', '#C55120'),
  guide: getCssToken('--component-preview-guide', '#C55120'),
});

export function GridCalculator() {
  const [widthInput, setWidthInput] = useState('960');
  const [columnsInput, setColumnsInput] = useState('8');
  const [spanColumnsInput, setSpanColumnsInput] = useState('3');
  const [previewMode, setPreviewMode] = useState<PreviewMode>(DEFAULT_PREVIEW_MODE);

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
          colors: getPreviewColors(),
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

  const downloadSvg = (layout: GridLayout) => {
    const svg = generateGridSvg({
      width,
      columns,
      ...layout,
      height: SVG_HEIGHT,
      colors: getPreviewColors(),
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
              style={{ '--preview-width': `${width}px` } as React.CSSProperties}
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
