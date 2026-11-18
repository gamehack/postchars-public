# PostChars

Free, browser-first text tools for writers, creators, and social media teams.

**Website:** https://postchars.com

PostChars provides character counters, text utilities, social-platform post checkers, and writing helpers. Text processing runs locally in your browser; the application does not upload the text you enter to a PostChars backend.

## Features
- Character, word, line, and text analysis tools
- Platform-aware counters and post validation
- Text cleanup, conversion, comparison, and formatting utilities
- Responsive interface for desktop and mobile
- Privacy-conscious, browser-local processing

## Technology
- React 19
- TypeScript
- Vite
- Vitest
- Playwright
- Cloudflare Pages-compatible static output

## Requirements
- Node.js 22 (supported range: >=22 <25)
- npm

## Local development
```bash
npm ci
npm run dev
```

## Build and test
```bash
npm run test
npm run build
npm run test:e2e
```

The production build is generated in `dist/`. The build runs unit tests, TypeScript checks, static prerendering, SEO/internal-link validation, and bundle-size checks.

## Privacy
- Text transformations are performed in the browser.
- Do not add analytics events that include entered text, filenames, clipboard contents, or other user-generated content.
- Optional analytics and advertising must respect consent controls.
- See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License
MIT. See [LICENSE](LICENSE).

The MIT license applies to this repository's original code. See [third-party notices](THIRD_PARTY_NOTICES.md) for dependency attribution. Third-party packages and assets remain subject to their respective licenses and terms.


## Deployment configuration

This repository is an independent, forkable source release. Production account integrations are deliberately disabled by default:
- Google Analytics 4: no measurement ID is configured. To use your own GA4 property, set `measurementId` in `public/analytics-config.js` to your own `G-...` ID. The consent UI gates analytics loading.
- Advertising: disabled. No publisher IDs, ad-network tags, or ad frames are included in the default build. Configure your own advertising integration separately if you choose to add one.
- Domain ownership files such as `ads.txt` and IndexNow verification keys are not included.

Before deploying a fork, update the canonical URLs, sitemap, robots.txt, contact address, privacy policy, and any brand-specific links for your own domain and operator. Do not reuse another publisher's account IDs or verification keys.
