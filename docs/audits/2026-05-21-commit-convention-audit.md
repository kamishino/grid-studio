# Commit Convention Audit Report

Date: 2026-05-21

## Request

- Adopt plain Conventional Commits with no emoji prefix.
- Rewrite the four unpushed local commits on `main` to remove emoji prefixes.
- Keep the existing unrelated `package-lock.json` worktree change untouched.

## Baseline

- Workspace: `C:\Users\toanh\Desktop\Projects\grid-studio`
- Branch: `main`
- Remote baseline: `origin/main`
- Local branch state before rewrite: 4 commits ahead of `origin/main`
- Pre-existing unrelated change: `package-lock.json`

## Audit Findings

- The four local commits ahead of `origin/main` used emoji-prefixed Conventional
  Commit subjects.
- The commits were local and unpushed, so a message-only history rewrite was
  acceptable for aligning the branch with the updated convention.
- The unrelated `package-lock.json` change was not required for this adjustment.

## Implementation Plan

Single phase:

- Rewrite only the four commits ahead of `origin/main`.
- Preserve each commit tree and parent order while replacing only the commit
  subject lines.
- Add this audit report using the new no-emoji commit convention.
- Run the full project verification commands after the rewrite.

## Commit Message Rewrite

- `📝 docs(audit): add preview detachment audit report`
  became `docs(audit): add preview detachment audit report`
- `✨ feat(preview): detach grid preview into full-width workspace`
  became `feat(preview): detach grid preview into full-width workspace`
- `✨ feat(preview): add grid dimension legends and rulers`
  became `feat(preview): add grid dimension legends and rulers`
- `✅ test(preview): cover detached preview metrics in smoke tests`
  became `test(preview): cover detached preview metrics in smoke tests`

## Verification

- `git log --oneline -4`: passed, rewritten subjects contain no emoji prefixes.
- `git status --short --branch`: passed, only the pre-existing
  `package-lock.json` change remains unstaged.
- `npm test`: passed
- `npm run build`: passed
- `npm run test:smoke`: passed

## Release Notes

- No SemVer version bump or tag was created because this was a convention-only
  adjustment.
