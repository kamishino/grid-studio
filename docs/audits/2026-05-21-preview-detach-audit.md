# Preview Detachment Audit Report

Date: 2026-05-21

## Request

- Detach the grid preview from the Results panel so the preview can show the
  selected grid at its true width and height.
- Add preview legends for column width, gutter width, number of columns, and
  overall width.
- Keep the implementation to one phase with multiple Conventional Commit
  commits.

## Baseline

- Workspace: `C:\Users\toanh\Desktop\Projects\grid-studio`
- Branch: `main`
- Pre-existing unrelated change: `package-lock.json`
- Baseline checks from the planning pass passed:
  - `npm test`
  - `npm run build`
  - `npm run test:smoke`

## Audit Findings

- The preview was nested inside `results-panel`, coupling it to the Results
  panel width.
- The preview SVG was forced to `width: 100%` and `height: 160px`, so the visual
  preview could not represent the generated SVG dimensions truthfully.
- The generated SVG already contains the correct intrinsic `width`, `height`,
  and `viewBox`, so the fix should stay in the React/CSS preview layer.
- Exported SVG output should remain unannotated because ruler labels are UI
  measurement aids, not part of the downloadable grid asset.

## Implementation Plan

Single phase, split into multiple commits:

- Add this audit report under `docs/audits`.
- Move Preview out of the Results panel and render it as a full-width sibling
  section in the calculator workspace.
- Render the generated SVG at its intrinsic dimensions and place it in a
  horizontally scrollable preview surface.
- Add a compact metrics strip and ruler annotations for overall width, column
  width, and gutter width.
- Update Playwright smoke coverage for the detached preview and metric labels.

## Commit Plan

- `📝 docs(audit): add preview detachment audit report`
- `✨ feat(preview): detach grid preview into full-width workspace`
- `✨ feat(preview): add grid dimension legends and rulers`
- `✅ test(preview): cover detached preview metrics in smoke tests`

## Verification

- `npm test`: passed
- `npm run build`: passed
- `npm run test:smoke`: passed
- Browser visual QA passed at 1280x900 and 390x844:
  - Preview renders below the Results panel.
  - The selected 960px grid renders at 960px by 200px.
  - Mobile preview scrolls horizontally instead of shrinking the SVG.
  - Dimension labels are present and no browser console errors were reported.

## Release Notes

- No SemVer version bump or tag was created because release tagging was not
  requested for this revision.
