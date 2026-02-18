---
description: Bump package version, generate changelog doc, tag, and publish to npm
user-invocable: true
disable-model-invocation: true
argument-description: 'Optional: major, minor, or patch to skip the proposal step'
---

# /version-increment

Bump the version of `@takazudo/kumiko-gen`, generate a changelog doc page, commit, tag, and publish to npm.

## Preconditions

Before doing anything else, verify ALL of the following. If any check fails, stop and tell the user.

1. Current branch is `main`
2. Working tree is clean (`git status --porcelain` returns empty)
3. At least one `v*` tag exists (`git tag -l 'v*'`). If no tag exists, tell the user to create the initial tag first (e.g. `git tag v0.1.0 && git push --tags`).

Find the latest version tag:

```bash
git tag -l 'v*' --sort=-v:refname | head -1
```

## Analyze changes since last tag

Run:

```bash
git log <last-tag>..HEAD --oneline
```

and

```bash
git diff <last-tag>..HEAD --stat
```

Categorize each commit by its conventional-commit prefix:

- **Breaking Changes**: commits with an exclamation mark suffix (e.g. `feat!:`) or BREAKING CHANGE in body
- **Features**: `feat:` prefix
- **Bug Fixes**: `fix:` prefix
- **Other Changes**: everything else (`docs:`, `chore:`, `refactor:`, `ci:`, `test:`, `style:`, `perf:`, etc.)

## Propose version bump

Based on the changes:

- If there are breaking changes -> propose **major** bump
- If there are features (no breaking) -> propose **minor** bump
- Otherwise -> propose **patch** bump

If the user passed an argument (`major`, `minor`, or `patch`), use that directly instead of proposing.

Present the proposal to the user and **wait for confirmation before proceeding.**

## Create changelog doc

Create `doc/docs/changelog/v{VERSION}.mdx` with this format:

```mdx
---
sidebar_position: { computed }
---

# v{VERSION}

Released: {YYYY-MM-DD}

## Breaking Changes

- Description (commit-hash)

## Features

- Description (commit-hash)

## Bug Fixes

- Description (commit-hash)

## Other Changes

- Description (commit-hash)
```

Rules:

- Only include sections that have entries
- `sidebar_position` = `10000 - (MAJOR * 1000 + MINOR * 100 + PATCH)` -- newer versions get lower numbers and appear first
- Use today's date for the release date

## Regenerate category nav

```bash
cd doc && node scripts/generate-category-nav.js
```

## Commit changelog

```bash
git add doc/docs/changelog/v{VERSION}.mdx doc/src/data/category-nav.json
git commit -m "docs: Add changelog for v{VERSION}"
```

## Bump version in package.json

Update the `version` field in `packages/kumiko-gen/package.json` to the new version.

```bash
git add packages/kumiko-gen/package.json
git commit -m "chore: Bump version to v{VERSION}"
```

## Build and test

```bash
pnpm --filter @takazudo/kumiko-gen build && pnpm --filter @takazudo/kumiko-gen test
```

## Push and wait for CI

```bash
git push
```

Check CI status. **Do not tag or publish until CI is green.**

## Tag and push tag

**Ask the user for confirmation before tagging.**

```bash
git tag v{VERSION}
git push --tags
```

## Publish to npm

**Ask the user for confirmation before publishing.**

Tell the user to run `npm publish` manually (requires 2FA).
