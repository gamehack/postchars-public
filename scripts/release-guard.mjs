/**
 * PostChars public-release preflight.
 * Scans the current tree and every text blob reachable from HEAD.
 * No network, GitHub token or account credentials are required.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

function git(args, input) {
  return execFileSync('git', args, {
    encoding: input ? undefined : 'utf8',
    input,
    maxBuffer: 128 * 1024 * 1024
  });
}
const sha256 = value => createHash('sha256').update(value).digest('hex');

const required = [
  'README.md', 'LICENSE', 'CONTRIBUTING.md', 'SECURITY.md',
  'THIRD_PARTY_NOTICES.md', 'package.json', 'package-lock.json',
  '.github/workflows/ci.yml', 'scripts/license-gate.mjs',
  'public/favicon.svg', 'public/postchars-og.png'
];
const blocked = [
  /^marketing\//i, /^internal\//i, /^workflow-templates\//i,
  /^\.env(?:\.|$)/i, /\.(?:pem|key|p12|pfx|crt|cer)$/i,
  /^public\/(?:ads\.txt|indexnow-key\.txt|guide-ad-config\.js|guide-ad-frame\.html|native-ad-frame\.html)$/i,
  /^scripts\/(?:report-adsterra-publisher|adsterra-api-core(?:\.test)?|report-gsc-url-inspection)\.mjs$/i,
  /^\.github\/workflows\/(?:adsterra-publisher-report|gsc-url-inspection|bootstrap-lockfile)\.ya?ml$/i
];
const secretPatterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /(?:ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/],
  ['OpenAI secret', /sk-(?:proj-)?[A-Za-z0-9_-]{24,}/],
  ['Google API key', /AIza[A-Za-z0-9_-]{30,}/],
  ['Slack token', /xox[baprs]-[A-Za-z0-9-]{20,}/]
];

// SHA-256 fingerprints avoid copying production account identifiers into
// this scanner itself. Candidate values are extracted from text and hashed.
const protectedFingerprints = new Map([
  ['133ddbdecb4c4c25b4ecef35744255634b102a32d568002794ebc87be5fa5392', 'known production analytics ID'],
  ['3baf5a5f0c8fa10723d63543db25a0db73962eb1e6dcfb35a0cfb2d143415c9f', 'known secondary-site analytics ID'],
  ['16ea24384e3110c4620fe22816b319fe599d0ce7330c7df7b943b95bac786c06', 'known AdSense publisher ID'],
  ['972a017c8addedd229f82398c45febab512135b9a39c1254c6b17da5ad1aaa1b', 'known guide ad-unit ID'],
  ['d227154b03fe59d0f3c3bb351a55663cf1e97b4076c660b1f9c28a2b615c7093', 'known native ad-unit ID'],
  ['f1a6fe02ff5cc569a9393aa39b0f037a82bff55aacd8c323dd8ba1545c4786aa', 'known domain-verification key'],
  ['53a9f6aac982e6a8f78060337bfdeba9017b113101f270c6c54540521e6e6a56', 'known advertising-network host'],
  ['897a58a795e8a3c991783d6f7d78e74a0a27e4d2d4825f8507edb12c434c8cf7', 'known advertising-network host'],
  ['f27fa2babcb426f1282c4c567bf095fe2b6908d29c32ddf308ed635d4d21f549', 'known production Pages host'],
  ['19a5014959e11968a044455a078a2a1c46667c388bde818b02ecad9a65193dc2', 'known production Pages host'],
  ['8d9559743b8b4225c59bc41e0c161492e32670cfed771dd33c02711eb2940ce0', 'known advertising script host'],
  ['ce36f7e54b59b91a7e6d4ecf538eb014a7a7d833b57c04c505bdd83fe540aaee', 'known advertising script URL']
]);
const errors = [];
function scanText(content, label) {
  if (/postchars-ga4-id["']\s+content=["'][^"']+["']/i.test(content)) {
    errors.push('Hard-coded GA4 measurement meta tag in ' + label);
  }
  if (/<script\\b[^>]*src=[\"'][^\"']*guide-ad-config\\.js/i.test(content)) {
    errors.push('Removed publisher-specific guide ad script is loaded by ' + label);
  }
  for (const [kind, pattern] of secretPatterns) {
    if (pattern.test(content)) errors.push('Possible ' + kind + ' in ' + label);
  }
  const candidates = new Set();
  const candidatePatterns = [
    /\bG-[A-Z0-9]{10,}\b/g,
    /\bca-pub-\d{10,}\b/gi,
    /\b[a-f0-9]{32}\b/gi,
    /https?:\/\/[^\s"'<>]+/gi,
    /\b[a-z0-9.-]+\.(?:com|pages\.dev)\b/gi
  ];
  for (const pattern of candidatePatterns) {
    for (const match of content.matchAll(pattern)) {
      const value = match[0].replace(/[),.;]+$/g, '');
      candidates.add(value);
      if (/^https?:\/\//i.test(value)) {
        try { candidates.add(new URL(value).hostname.toLowerCase()); } catch {}
      }
    }
  }
  for (const candidate of candidates) {
    const fingerprint = sha256(candidate);
    const kind = protectedFingerprints.get(fingerprint);
    if (kind) errors.push('Possible ' + kind + ' in ' + label);
  }
}

for (const path of required) if (!existsSync(path)) errors.push('Missing required file: ' + path);

// Keep first-party analytics and advertising integrations inert in the public fork.
if (existsSync('public/analytics-config.js') &&
    !/var\s+measurementId\s*=\s*''\s*;/.test(readFileSync('public/analytics-config.js', 'utf8'))) {
  errors.push('Public analytics config must have an empty GA4 measurementId');
}
if (existsSync('src/ad-config.ts')) {
  const adConfig = readFileSync('src/ad-config.ts', 'utf8');
  if (!/enabled:\s*false/.test(adConfig) || !/frameUrl:\s*''/.test(adConfig) ||
      !/previewFrameUrl:\s*''/.test(adConfig)) {
    errors.push('Public advertising config must remain disabled with empty frame URLs');
  }
}
const assetNotices = existsSync('THIRD_PARTY_NOTICES.md') ? readFileSync('THIRD_PARTY_NOTICES.md', 'utf8') : '';
for (const asset of ['public/favicon.svg', 'public/postchars-og.png']) {
  if (!assetNotices.includes(asset)) errors.push('Original visual asset missing ownership notice: ' + asset);
}
const tracked = git(['ls-files', '-z']).split('\0').filter(Boolean);
for (const path of tracked) {
  if (blocked.some(pattern => pattern.test(path))) errors.push('Blocked tracked path: ' + path);
  const bytes = readFileSync(path);
  if (!bytes.includes(0)) scanText(bytes.toString('utf8'), path);
}

// Inspect every path ever committed to HEAD, including files deleted later.
for (const path of git(['log', '--format=', '--name-only', 'HEAD']).split('\n').filter(Boolean)) {
  if (blocked.some(pattern => pattern.test(path))) errors.push('Blocked historical path: ' + path);
}

// Inspect every reachable Git object and scan every historical text blob.
// This catches identifiers removed from the current tree but retained in commits.
try {
  const rows = git(['rev-list', '--objects', 'HEAD']).split('\n').filter(Boolean);
  const pathBySha = new Map();
  const objectIds = [];
  for (const row of rows) {
    const separator = row.indexOf(' ');
    const sha = separator < 0 ? row : row.slice(0, separator);
    const path = separator < 0 ? '' : row.slice(separator + 1);
    if (!pathBySha.has(sha)) pathBySha.set(sha, path);
    objectIds.push(sha);
  }
  const uniqueIds = [...new Set(objectIds)];
  const batch = git(['cat-file', '--batch'], Buffer.from(uniqueIds.join('\n') + '\n'));
  let offset = 0;
  while (offset < batch.length) {
    const headerEnd = batch.indexOf(10, offset);
    if (headerEnd < 0) break;
    const header = batch.toString('utf8', offset, headerEnd);
    const [sha, type, sizeText] = header.split(' ');
    const size = Number(sizeText);
    const contentStart = headerEnd + 1;
    const contentEnd = contentStart + size;
    if (type === 'blob') {
      const path = pathBySha.get(sha) || '';
      const blob = batch.subarray(contentStart, contentEnd);
      if (!blob.includes(0)) scanText(blob.toString('utf8'), 'historical ' + (path || sha));
    }
    offset = contentEnd + 1;
  }
} catch (err) {
  errors.push('Git history content inspection failed: ' + String(err));
}

const unique = [...new Set(errors)];
const summary = [
  '## Public release preflight',
  '- Tracked files checked: ' + tracked.length,
  '- Reachable Git objects checked: full HEAD history',
  '- Blocked path patterns: ' + blocked.length,
  '- Secret patterns: ' + secretPatterns.length,
  '- Protected production fingerprints: ' + protectedFingerprints.size,
  '- Result: ' + (unique.length ? 'FAIL' : 'PASS'),
  '',
  ...(unique.length ? unique.map(e => '- ' + e) : ['No blocked paths, recognized secrets or known production account markers were found.']),
  '',
  'This automated check is not a substitute for a professional security, licensing or copyright audit.'
].join('\n') + '\n';
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
process.stdout.write(summary);
if (unique.length) process.exitCode = 1;
