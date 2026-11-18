# Contributing to PostChars

## Development setup
1. Install Node.js 22 (supported range: >=22 <25).
2. Run `npm ci`.
3. Run `npm run dev` to start the local development server.

## Before opening a pull request
- Run `npm run build`.
- Run `npm run test:e2e` for changes affecting user-visible behavior.
- Keep text processing local to the browser.
- Do not add telemetry containing entered text, clipboard contents, filenames, or other user-generated content.
- Preserve consent behavior and cross-origin isolation for advertising documents.
- Add or update tests for behavioral changes.
- Do not commit secrets, credentials, production reports, or private operational documents.

## Pull requests
Describe the user-visible change, implementation approach, and test results. Keep pull requests focused and include screenshots for substantial UI changes.
