import { GridCalculator } from '../features/grid-calculator/GridCalculator';
import './App.css';

export function App() {
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

        <GridCalculator />
      </section>
    </main>
  );
}
