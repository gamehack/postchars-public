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

## Production-only build overlay

The public source is always operator-neutral. The final build step reads
Cloudflare Pages production build variables and creates only \`dist/\` output.
Do not commit any of these values to the repository.

| Variable | Purpose |
|---|---|
| \`POSTCHARS_GA4_ID\` | Existing GA4 measurement ID |
| \`POSTCHARS_ADSENSE_CLIENT\` | AdSense client identifier |
| \`POSTCHARS_ADSENSE_SCRIPT_URL\` | Approved AdSense publisher script URL without the client query |
| \`POSTCHARS_ADS_TXT\` | Authorized one-line AdSense seller record |
| \`POSTCHARS_NATIVE_SCRIPT_URL\` | Native banner ad tag URL |
| \`POSTCHARS_NATIVE_CONTAINER_ID\` | Native ad container ID |
| \`POSTCHARS_GUIDE_SCRIPT_URL\` | Guide-page banner tag URL |
| \`POSTCHARS_GUIDE_KEY\` | Guide-page banner key |
| \`POSTCHARS_AD_FRAME_ORIGIN\` | Dedicated HTTPS ad iframe origin, distinct from the website |
| \`POSTCHARS_INDEXNOW_KEY\` | IndexNow ownership key |

If no values are supplied, the overlay is a no-op. Partial ad configurations
fail closed. All publisher identifiers in rendered production assets are public
by design; never use API credentials, access tokens or private keys in these variables.

The native and guide frames are generated only for configured providers and
must be served on the dedicated \`pages.dev\` origin rather than the editor origin.
The Google publisher tag uses a denied consent default for verification only.
A certified CMP is still required where AdSense advertising regulations require one.

CI tests the empty public build first, then injects synthetic account identifiers
into the build output and validates all generated integration points. Production
uses the same pipeline with Cloudflare Pages build variables; no separate private
source fork is needed.

For the production Pages project, set `POSTCHARS_REQUIRE_OPERATOR_CONFIG=1`.
This fail-closed gate requires all legacy analytics, advertising and verification
settings, preventing a successful build that silently omits those integrations.
