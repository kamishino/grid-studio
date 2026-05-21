# Grid Studio

Grid Studio is a small offline-first grid calculator for web layout work. It
calculates integer column and gutter combinations from an overall width and a
column count, previews the selected grid as SVG, and downloads the SVG without a
backend.

## Stack

- React + Vite + TypeScript
- Static PWA through `vite-plugin-pwa`
- Vitest for grid calculation and SVG export tests
- Playwright for the main browser smoke path
- npm for dependency and script management

## Development

```sh
npm install
npm run dev
```

Useful checks:

```sh
npm test
npm run test:smoke
npm run build
```

The production build emits `dist/manifest.webmanifest`, `dist/sw.js`, and the
cached static assets needed for offline use after the app has been loaded once.

## Grid Rules

Grid Studio uses this formula for each candidate gutter width:

```text
columnWidth = (width - ((columns - 1) * gutterWidth)) / columns
```

A result is shown when `columnWidth` is a whole number and `columnWidth` remains
greater than or equal to the candidate gutter width during the search. Inputs
must be whole numbers, width must be `10000` pixels or less, columns must be at
least `2`, and columns cannot exceed width.

## Release Convention

The project starts at `0.1.0` and uses SemVer with `vX.Y.Z` git tags. Commits
follow Conventional Commits 1.0.0:

- `fix:` maps to PATCH.
- `feat:` maps to MINOR.
- `!` or `BREAKING CHANGE:` maps to MAJOR.
- `docs:`, `test:`, `chore:`, and similar types are allowed when they describe
  the change accurately.
