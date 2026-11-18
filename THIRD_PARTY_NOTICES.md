# Third-party licenses and attribution

The [MIT license](LICENSE) covers PostChars original code, not the copyright or licensing of third-party dependencies, logos or assets.

## twitter-text (3.1.0)
- Project: https://github.com/twitter/twitter-text
- License: Apache-2.0, as provided in its upstream repository's `LICENSE` file.
- Note: npm metadata for 3.1.0 does not publish a `license` field, so the offline license gate has a version-pinned exception. Do not extend this exception to a new version without reviewing its upstream license.

## caniuse-lite (1.0.30001820)
- Project: https://github.com/browserslist/caniuse-lite
- Data source: [caniuse.com](https://caniuse.com)
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Attribution: Browser compatibility data from caniuse.com. Changes/packaging may be performed by its maintainers; this notice does not imply endorsement.

## Other npm dependencies
The committed `package-lock.json` currently contains MIT, Apache-2.0, ISC and BSD-3-Clause dependencies. Each dependency's own license governs its use, redistribution and notices.

Run `node scripts/license-gate.mjs` to verify dependency license metadata when `package-lock.json` changes. This is an automated metadata check, not legal advice or a complete copyright audit.


## Original visual assets

The project owner confirms original authorship and permission to redistribute these project-created assets with this repository:
- `public/favicon.svg`
- `public/postchars-og.png`

These are not third-party stock assets. Any future third-party images, fonts, icons or other media must be reviewed and attributed separately.
