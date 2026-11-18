# Cloudflare Pages deployment

PostChars is a static Vite application deployed to Cloudflare Pages.

## Build settings

| Setting | Value |
|---|---|
| Build command | `npm ci --no-audit --no-fund && npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js | 22 |

The build runs the unit tests, TypeScript checks, Vite build, prerendering, HTML enhancement, SEO acceptance checks, site audit and bundle-budget checks.

## Public-source defaults

The repository is intentionally safe to fork:
- GA4 is disabled until the site operator supplies their own measurement ID.
- Advertising integrations are disabled and no publisher identifiers or ad frames are shipped.
- Production verification keys and private reporting credentials are not part of this repository.

A deployment operator must keep any production-only configuration outside the public source tree. Do not commit publisher IDs, verification keys, private API credentials or account-specific ad configuration.

## Release checks

The public CI workflow runs the release guard, dependency-license gate, build and unit tests, desktop/mobile Playwright E2E tests, and the production dependency audit. Cloudflare Pages should deploy the `main` branch only after the corresponding CI run succeeds.
