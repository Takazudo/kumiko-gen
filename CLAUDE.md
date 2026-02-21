# kumiko-gen

Public npm package repo for kumiko-gen — a CLI tool and library for generating deterministic Japanese kumiko geometric pattern SVGs from text seeds. Includes svg-to-png conversion as a subpath export. Published as `@takazudo/kumiko-gen` (ESM-only).

## Tech Stack

- **Language**: TypeScript (strict mode, ES2022 target)
- **Runtime**: Node.js >= 18
- **Package manager**: pnpm (workspace for viewer)
- **Build**: tsup (package), Vite (viewer), Docusaurus (docs)
- **Test framework**: vitest
- **Doc site**: Docusaurus (separate workspace in `doc/`)

## Project Structure

- `src/` - Main CLI tool + library source
- `src/svg-to-png/` - SVG to PNG converter (subpath export)
- `test/` - Tests
- `dist/` - Build output (gitignored)
- `packages/kumiko-gen-viewer/` - Interactive React SPA (extra, private)
- `doc/` - Docusaurus documentation site (standalone, not a workspace)
- `.env` - Netlify credentials (NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID) - gitignored

## Package Manager

- Root is the publishable `@takazudo/kumiko-gen` package
- pnpm workspace for `packages/kumiko-gen-viewer`
- `doc/` has its own `pnpm-lock.yaml` (not part of workspace)

## Commands

```bash
# Package
pnpm build              # Build kumiko-gen
pnpm test               # Test kumiko-gen

# Viewer
pnpm viewer:dev         # Viewer dev server (kumikogen.localhost:1982)
pnpm viewer:build       # Build viewer

# Doc site
pnpm doc:start          # Dev server (kumikogen.localhost:9147)
pnpm doc:build          # Build doc site
pnpm doc:serve          # Serve built doc locally
pnpm doc:generate       # Run doc title/category-nav generators
pnpm doc:typecheck      # TypeScript check

# Publish
pnpm publish --access public   # Publish to npm (runs prepublishOnly automatically)
```

## Deployment

- **Platform**: Netlify (build handled by GitHub Actions, not Netlify)
- **Domain**: https://kumiko-gen.netlify.app/
- **Viewer path**: `/pj/kumiko-gen/` (kumiko-gen-viewer SPA)
- **Doc path**: `/pj/kumiko-gen/doc/`
- **Docusaurus baseUrl**: `/pj/kumiko-gen/doc/`
- **Root redirect**: `/` -> `/pj/kumiko-gen/` (302)

### CI Workflows

- `.github/workflows/main-deploy.yml` - Production deploy on push to `main`
- `.github/workflows/pr-checks.yml` - PR preview deploy with comment

### GitHub Secrets Required

- `NETLIFY_AUTH_TOKEN` - Netlify personal access token
- `NETLIFY_SITE_ID` - Netlify site ID

## Conventions

- **Commits**: Start with a scope prefix, then a short description:
  - `[kumiko-gen] ` - kumiko-gen package (src/, test/)
  - `[viewer] ` - kumiko-gen-viewer (packages/kumiko-gen-viewer/)
  - `[doc] ` - documentation site (doc/)
  - `[claude] ` - Claude Code related tweaks (.claude/, CLAUDE.md)
  - `[misc] ` - other things (CI, dependencies, config, etc.)

## Package Publishing

- Scoped package: `@takazudo/kumiko-gen`
- `files` field limits published content to: `dist/`
- `prepublishOnly` runs `tsup && vitest run` automatically
- Publish from root: `pnpm publish --access public`
- Use `/version-increment` skill for releases

## Docusaurus Config

- Config: `doc/docusaurus.config.ts`
- Dev URL set to production domain; dev server uses `--host kumikogen.localhost --port 9147`
