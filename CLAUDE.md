# kumiko-gen

Monorepo for kumiko-gen Japanese geometric pattern tools. Published as a scoped npm package (ESM-only).

## Tech Stack

- **Language**: TypeScript (strict mode, ES2022 target)
- **Runtime**: Node.js >= 18
- **Package manager**: pnpm (workspace monorepo)
- **Build**: tsup (packages), Vite (viewer), Docusaurus (docs)
- **Test framework**: vitest
- **Doc site**: Docusaurus (separate workspace in `doc/`)

## Project Structure

- `packages/kumiko-gen/` - Main CLI tool + library (@takazudo/kumiko-gen), includes svg-to-png subpath export
- `packages/kumiko-gen-viewer/` - Interactive React SPA
- `doc/` - Docusaurus documentation site (standalone, not a workspace)
- `.env` - Netlify credentials (NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID) - gitignored

## Package Manager

- pnpm workspace (`packages/*`)
- `doc/` has its own `pnpm-lock.yaml` (not part of workspace)

## Commands

```bash
# Packages
pnpm --filter @takazudo/kumiko-gen build     # Build kumiko-gen
pnpm --filter @takazudo/kumiko-gen test      # Test kumiko-gen
pnpm --filter kumiko-gen-viewer dev          # Viewer dev server (kumikogen.localhost:1982)
pnpm --filter kumiko-gen-viewer build        # Build viewer

# Doc site
pnpm doc:start        # Dev server (kumikogen.localhost:9147)
pnpm doc:build        # Build doc site
pnpm doc:serve        # Serve built doc locally
pnpm doc:generate     # Run doc title/category-nav generators
pnpm doc:typecheck    # TypeScript check
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
  - `[kumiko-gen] ` - kumiko-gen package (packages/kumiko-gen/)
  - `[viewer] ` - kumiko-gen-viewer (packages/kumiko-gen-viewer/)
  - `[doc] ` - documentation site (doc/)
  - `[claude] ` - Claude Code related tweaks (.claude/, CLAUDE.md)
  - `[misc] ` - other things (CI, dependencies, config, etc.)

## Package Publishing

- Scoped package: `@takazudo/kumiko-gen`
- `files` field limits published content to: `dist/`
- `prepublishOnly` runs `tsup && vitest run` automatically
- Use `/version-increment` skill for releases

## Docusaurus Config

- Config: `doc/docusaurus.config.ts`
- Dev URL set to production domain; dev server uses `--host kumikogen.localhost --port 9147`
