# Structure And Token Audit

Date: 2026-05-21

## Repository State

- Branch: `codex/grid-studio-v1`
- Latest release-style tag present locally: `v0.1.0`
- Version in `package.json`: `0.1.0`
- Release gate note: future SemVer tags should be created only from verified `main`.
- Pre-audit repair: `package.json` had duplicate `@playwright/test` entries. The manifest now keeps the resolved `^1.60.0` range once.

## Current Structure

The app is currently compact and functional, but most UI concerns are centralized:

- `src/App.tsx` contains the app shell, calculator inputs, results table, preview panel, and download behavior.
- `src/grid.ts` contains calculation, validation, and SVG generation.
- `src/styles.css` contains global base styles, layout styles, component styles, and hand-authored CSS variables.
- `src/grid.test.ts` tests the grid engine and SVG generator.

This is acceptable for v1, but it will become harder to scale once more grid tools, presets, exports, or theme controls are added.

## Hardcoded Styling Values

Current CSS includes hardcoded or root-scoped values for:

- Colors: background, surface, text, muted text, borders, accent, stronger accent, field surface, and selected row.
- Layout: page padding, max-width, grid columns, control widths, gaps, and table padding.
- Shape: panel, field, button, and icon button radii.
- Typography: app heading size, body text size, label text size, result text size, and weights.
- SVG export: guide line and column fill colors are embedded in `src/grid.ts`.

These should move behind generated CSS custom properties so the implementation has one source of truth.

## 3-Tier Token Mapping

Grid Studio will use Primitive -> Semantic -> Component tokens.

Primitive tokens are raw design ingredients:

- Color palette and neutral colors.
- Spacing scale.
- Radius scale.
- Font families, sizes, weights, and line heights.

Semantic tokens assign product meaning:

- App background, surface, field surface, text, muted text, border, accent, accent strong, and selected state.
- Semantic tokens should reference primitive values.

Component tokens assign UI-specific meaning:

- App shell padding and workspace width.
- Panel background, border, and radius.
- Input background, border, radius, and value typography.
- Result row padding, selected background, and action button colors.
- Preview background, grid background, SVG fill, and SVG guide colors.

## Token Build Approach

- `tokens/primitive`, `tokens/semantic`, and `tokens/component` will store source token files.
- `scripts/build-tokens.mjs` will use culori to normalize color seeds and Style Dictionary to emit CSS variables.
- Generated output will live at `src/styles/tokens.css`.
- App styles will import generated token variables before component styles.

## Row Activation Audit

Current behavior:

- The Preview button activates the selected preview.
- The SVG button downloads the selected grid.
- Clicking the table row outside buttons does nothing.

Target behavior:

- Clicking a result row activates preview for that row.
- Focusing a row and pressing Enter or Space activates preview.
- Preview and SVG buttons must stop propagation so their own actions remain explicit.
- Selected row styling and preview panel behavior should remain intact.
