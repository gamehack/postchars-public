/**
 * Offline dependency license gate for the committed npm lockfile.
 * A conservative SPDX allowlist; unknown, absent or restricted identifiers fail closed.
 */
import { readFileSync, appendFileSync } from 'node:fs';

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const allowed = new Set(['MIT', 'Apache-2.0', 'ISC', 'BSD-3-Clause', 'CC-BY-4.0']);
const exceptions = {
  // npm package metadata omits a license field; upstream repository includes Apache-2.0 LICENSE.
  'node_modules/twitter-text': { version: '3.1.0', license: 'Apache-2.0' }
};
const notices = readFileSync('THIRD_PARTY_NOTICES.md', 'utf8');
const errors = [];
const counts = {};
let total = 0;

for (const [path, entry] of Object.entries(lock.packages ?? {})) {
  if (!path) continue; // the first entry is the first-party application
  total++;
  let license = entry.license;
  if (!license && exceptions[path] && entry.version === exceptions[path].version) {
    license = exceptions[path].license;
  }
  if (!license || !allowed.has(license)) {
    errors.push(path + ' (' + (license || 'license unspecified') + ')');
    continue;
  }
  counts[license] = (counts[license] ?? 0) + 1;
}

if (!notices.includes('caniuse-lite') || !notices.includes('caniuse.com') ||
    !notices.includes('CC BY 4.0')) errors.push('Missing caniuse-lite attribution');
if (!notices.includes('twitter-text') || !notices.includes('Apache-2.0')) {
  errors.push('Missing twitter-text exception notice');
}

const lines = [
  '## Dependency license gate',
  '- npm lockfile dependency entries: ' + total,
  '- Allowed licenses: ' + [...allowed].join(', '),
  '- Result: ' + (errors.length ? 'FAIL' : 'PASS'),
  ...Object.entries(counts).sort().map(([license, count]) => '- ' + license + ': ' + count),
  ...errors.map(message => '- Review required: ' + message),
  '',
  'Static policy checking only; source media rights and legal review remain separate.'
];
const output = lines.join('\n') + '\n';
process.stdout.write(output);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, output);
if (errors.length) process.exitCode = 1;
