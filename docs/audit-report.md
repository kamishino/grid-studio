# Grid Studio v1 Audit Report

Date: 2026-05-21

## Repository Baseline

- Workspace: `D:\Tools\grid-studio`
- Branch before implementation: `main`
- Implementation branch: `codex/grid-studio-v1`
- Remote: `https://github.com/kamishino/grid-studio.git`
- Existing tracked files: none
- Existing commits: none
- Existing tags: none
- Existing package manager or tooling: none

## Gridulator Behavior Reviewed

Gridulator's core workflow is a small deterministic calculator:

- Input overall width as an integer.
- Input number of columns as an integer.
- Reject non-integer values.
- Reject width values above `10000`.
- Reject column counts below `2`.
- Reject column counts greater than width.
- Calculate all layouts where column width is a whole number.
- Increment gutter width from `0` while the calculated column width remains greater than the gutter width.
- Show each valid pair as column width and gutter width.
- Preview selected layouts visually.
- Export SVG for selected grid values.

The calculation formula is:

```text
columnWidth = (width - ((columns - 1) * gutterWidth)) / columns
```

A layout is valid when `columnWidth` is an integer and `columnWidth > gutterWidth`.

## Implementation Risk Notes

- The new app must not copy Gridulator's proprietary visual assets, wordmark, exact copy, or CSS.
- SVG export can be generated fully in the browser because the output is deterministic from width, columns, column width, gutter width, and height.
- A backend is not required for v1.
- React should remain a UI layer; grid calculation and SVG generation should stay framework-independent for simple tests and future reuse.

## Release And Commit Convention

- Versioning uses SemVer.
- Initial v1 implementation version defaults to `0.1.0` because no existing version or tag was found.
- Git release tags should use `vX.Y.Z`, for example `v0.1.0`.
- Commit messages follow Conventional Commits 1.0.0:
  - `fix:` maps to PATCH.
  - `feat:` maps to MINOR.
  - `!` or `BREAKING CHANGE:` maps to MAJOR.
  - Other types such as `chore:`, `docs:`, `test:`, and `ci:` are allowed when appropriate.

## v1 Behavior To Implement

- React + Vite + TypeScript static PWA.
- Offline-capable installable app shell.
- Inputs for overall width and columns.
- Increment and decrement controls for both inputs.
- Keyboard-friendly input flow.
- Results table with column width and gutter width.
- SVG-based grid preview.
- Offline SVG download generated in-browser.
- Unit coverage for calculation, validation, and SVG export.
- Browser smoke coverage for the main UI path.
