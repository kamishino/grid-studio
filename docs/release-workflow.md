# Release Workflow

Grid Studio uses SemVer and Conventional Commits.

## Version Source

- The current package version is stored in `package.json`.
- Release tags use `vX.Y.Z`, for example `v0.1.0`.
- The first implementation version is `0.1.0`.

## Commit Shape

Use the Conventional Commits 1.0.0 format:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Recommended project commit types:

- `feat:` for user-visible functionality.
- `fix:` for defects.
- `test:` for automated coverage.
- `docs:` for documentation.
- `chore:` for tooling, scaffolding, or maintenance.

## SemVer Mapping

- `fix:` increments PATCH.
- `feat:` increments MINOR.
- A `!` marker or `BREAKING CHANGE:` footer increments MAJOR.

For mixed work, prefer multiple focused commits in one execution phase.
