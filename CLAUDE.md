# kumiko-gen

## Project Structure

- `doc/` - Docusaurus documentation site (standalone, not a workspace)
- `.env` - Netlify credentials (NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID) - gitignored

## Package Manager

- pnpm (no workspace; `doc/` has its own `pnpm-lock.yaml`)

## Common Commands

```bash
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
- **Deploy path**: `/pj/kumiko-gen/doc/`
- **Docusaurus baseUrl**: `/pj/kumiko-gen/doc/`
- **Root redirect**: `/` -> `/pj/kumiko-gen/doc/` (302)

### CI Workflows

- `.github/workflows/main-deploy.yml` - Production deploy on push to `main`
- `.github/workflows/pr-checks.yml` - PR preview deploy with comment

### GitHub Secrets Required

- `NETLIFY_AUTH_TOKEN` - Netlify personal access token
- `NETLIFY_SITE_ID` - Netlify site ID

## Docusaurus Config

- Config: `doc/docusaurus.config.ts`
- Dev URL set to production domain; dev server uses `--host kumikogen.localhost --port 9147`
