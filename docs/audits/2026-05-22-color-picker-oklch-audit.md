# Light OKLCH Color Picker Audit

Date: 2026-05-22

## Request

Redesign the Primary Color popover as a light inspector-style color picker with
OKLCH as the internal adjustment model, Hex as the user-facing value, and 12
prebuilt OKLCH hue presets.

## Baseline Checks

- Current branch: `main`.
- Existing unrelated local changes were identified and must remain untouched:
  - `package-lock.json`
  - `src/styles/tokens.css`
  - `docs/audits/2026-05-22-gemini-rules-audit.md`
- The app already has a detached preview, span highlighting, and Primary Color
  control from the previous revisions.
- `culori` is available in `package.json` and is the required color conversion
  tool for this revision.

## Implementation Plan

Single phase, multiple commits:

1. Add this audit report.
2. Move color parsing, formatting, conversion, and preset generation into a
   shared utility built on `culori`.
3. Replace the current Primary Color popover with a light inspector surface:
   header, active color summary, `Copy hex`, segmented `Hex` / `HSL` / `OKLCH`
   tabs, and no footer.
4. Store color state canonically as OKLCH in the UI while deriving Hex for
   display, preview, local storage, copy, and SVG export.
5. Add 12 preset swatches generated from `oklch(62% 0.18 H)` for
   `H=0,30,...,330`.
6. Extend unit and smoke tests for the color utility and color picker behavior.

## Commit Plan

- `docs(audit): add oklch color picker audit`
- `refactor(preview): centralize culori color utilities`
- `feat(preview): redesign primary color picker`
- `feat(preview): add oklch preset swatches`
- `test(preview): cover oklch color picker behavior`

## Public Interface Notes

- Grid math behavior is unchanged.
- SVG filename format is unchanged.
- The exported SVG uses the derived Hex value from the canonical OKLCH state.
- Local storage keeps the existing Hex value format for compatibility.

## Verification

- Passed: `npm test`
  - 3 test files passed.
  - 16 tests passed.
- Passed: `npm run build`
  - Token build, TypeScript build, and Vite production build completed.
- Passed: `npm run test:smoke`
  - 4 Playwright smoke tests passed.
- Passed: desktop and mobile visual sanity checks with Playwright screenshots.
  - Fit preview did not overflow at 1440px or 390px widths.
  - Color popover stayed inside the viewport after the responsive adjustment.
  - Column and gutter ruler labels remained separated.

## Result

Implemented and verified. No SemVer tag was created.
