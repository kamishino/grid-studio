# Preview Fit And Span Calculator Audit Report

Date: 2026-05-21

## Request

- Add a Preview mode that fits the selected grid to the parent container width.
- Keep an Actual mode for true pixel inspection.
- Add a custom column span calculator for quick layout split math.
- Use no-emoji Conventional Commit subjects.
- Leave the unrelated `package-lock.json` worktree change untouched.

## Baseline

- Workspace: `C:\Users\toanh\Desktop\Projects\grid-studio`
- Branch: `main`
- Pre-existing unrelated change: `package-lock.json`
- Current convention: plain Conventional Commits without emoji prefixes.

## Audit Findings

- The Preview used the selected grid width as an inline pixel width, so wide
  grids exceeded the panel and produced horizontal scrolling.
- The generated SVG already has the correct intrinsic dimensions, so fitting the
  on-screen Preview can be handled in CSS without changing SVG export output.
- The span math can be derived from the selected layout result because column
  width, gutter width, total columns, and overall width are already known.

## Implementation Plan

Single phase, split into multiple commits:

- Add this audit report under `docs/audits`.
- Add Fit and Actual display modes to the detached Preview.
- Add reusable span math to the grid library.
- Add a custom `Span columns` calculator tied to the selected grid layout.
- Add unit and smoke coverage for preview modes and span calculations.

## Commit Plan

- `docs(audit): add preview fit and span calculator audit`
- `feat(preview): add fit and actual display modes`
- `feat(grid): add span width calculations`
- `feat(preview): add custom span calculator`
- `test(preview): cover preview modes and span calculations`

## Verification

- `npm test`: passed
- `npm run build`: passed
- `npm run test:smoke`: passed
- Browser geometry QA passed for a `1170px / 12 columns / 70px column / 30px gutter`
  layout:
  - Fit mode rendered without horizontal overflow.
  - Actual mode rendered a 1170px SVG and allowed horizontal scrolling.
  - Span calculator displayed `270px`, `900px`, `9 columns, 870px`, and `30px`.
  - No browser console errors were reported.

## Release Notes

- No SemVer version bump or tag was created because release tagging was not
  requested for this revision.
