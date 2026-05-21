# Preview Color And Span Audit Report

Date: 2026-05-22

## Request

- Move the `Gutter Width` ruler label away from the `Column Width` label.
- Highlight active and inactive span columns in the Preview.
- Add a Primary Color popover with Hex, HSL, and OKLCH controls.
- Persist the selected primary color in `localStorage`.
- Apply the selected primary color to the Preview and downloaded SVG.

## Baseline

- Workspace: `C:\Users\toanh\Desktop\Projects\grid-studio`
- Branch: `main`
- Pre-existing unrelated changes:
  - `package-lock.json`
  - `src/styles/tokens.css` line-ending noise
  - `docs/audits/2026-05-22-gemini-rules-audit.md`

## Audit Findings

- `Column Width` and `Gutter Width` labels were rendered in adjacent ruler
  cells, causing overlap for narrow gutter values in Fit mode.
- The Preview SVG rendered all columns with one visual style, so the span
  calculator did not visually distinguish active columns from the complement.
- Preview color came from CSS tokens only, so users could not tune the primary
  color or carry that color into exported SVGs.

## Implementation Plan

Single phase, split into multiple commits:

- Add this audit report.
- Move the gutter ruler to the second available gutter, with a first-gutter
  fallback for small grids.
- Extend SVG generation with optional selected span and primary color rendering.
- Add active and inactive column styling for Preview and SVG export.
- Add a Primary Color popover with Hex, HSL, and OKLCH controls.
- Persist the chosen color in `localStorage`.
- Add unit and smoke coverage for label separation, span styling, color controls,
  persistence, and SVG export color.

## Commit Plan

- `docs(audit): add preview color and span audit`
- `feat(preview): separate column and gutter ruler labels`
- `feat(preview): highlight active and inactive span columns`
- `feat(preview): add primary color popover controls`
- `test(preview): cover color controls and span highlights`

## Verification

- `npm test`: passed
- `npm run build`: passed
- `npm run test:smoke`: passed

## Release Notes

- No SemVer version bump or tag was created because release tagging was not
  requested for this revision.
