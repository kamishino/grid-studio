import { Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { calculateGridLayouts, validateGridInput } from './grid';

const parseIntegerInput = (value: string) => {
  if (!/^\d+$/.test(value)) {
    return Number.NaN;
  }

  return Number(value);
};

const clampInputValue = (value: string, delta: number) => {
  const parsed = parseIntegerInput(value);
  const current = Number.isFinite(parsed) ? parsed : 0;
  return String(Math.max(0, current + delta));
};

export function App() {
  const [widthInput, setWidthInput] = useState('960');
  const [columnsInput, setColumnsInput] = useState('8');

  const width = parseIntegerInput(widthInput);
  const columns = parseIntegerInput(columnsInput);
  const validation = validateGridInput({ width, columns });
  const layouts = useMemo(
    () => calculateGridLayouts({ width, columns }),
    [columns, width],
  );

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="app-title">
        <header className="title-group">
          <p className="eyebrow">Grid Studio</p>
          <h1 id="app-title">Column systems for daily layout work.</h1>
          <p className="summary">
            Calculate integer column and gutter combinations, preview the grid,
            and export SVG without a network connection.
          </p>
        </header>

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
                  </tr>
                </thead>
                <tbody>
                  {layouts.map((layout) => (
                    <tr key={`${layout.columnWidth}-${layout.gutterWidth}`}>
                      <td>{layout.columnWidth}px</td>
                      <td>{layout.gutterWidth}px</td>
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
        </div>
      </section>
    </main>
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
