import { readFile, appendFile } from 'node:fs/promises';
import {
  SITE_ORIGIN, parseSitemap, assertMatchingSitemaps, assertIndexNowKey,
  parseOperatorConfig
} from './production-ops-core.mjs';

const timeout = 20000;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function get(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'PostCharsHealthCheck/2.0' },
    signal: AbortSignal.timeout(timeout),
    cache: 'no-store'
  });
  const body = await response.text();
  if (!response.ok) throw new Error(url + ' returned HTTP ' + response.status);
  return { response, body };
}
const localSitemap = parseSitemap(await readFile('public/sitemap.xml', 'utf8'));
let production;
for (let attempt = 1; attempt <= 18; attempt++) {
  try {
    const [sitemap, key, runtime] = await Promise.all([
      get(SITE_ORIGIN + '/sitemap.xml'),
      get(SITE_ORIGIN + '/indexnow-key.txt'),
      get(SITE_ORIGIN + '/operator-config.js')
    ]);
    assertIndexNowKey(key.body);
    const liveUrls = parseSitemap(sitemap.body);
    assertMatchingSitemaps(localSitemap, liveUrls);
    const frames = parseOperatorConfig(runtime.body);
    production = { urls: liveUrls, frames };
    console.log('Production deployment matches source sitemap and runtime configuration.');
    break;
  } catch (error) {
    console.log('Waiting for Pages deployment ' + attempt + '/18: ' + String(error).slice(0, 180));
    if (attempt < 18) await sleep(20000);
  }
}
if (!production) throw new Error('Production did not converge to the checked-out source within six minutes');

const checks = [];
async function check(url, validator) {
  const start = performance.now();
  const { response, body } = await get(url);
  if (validator) validator(response, body);
  checks.push({ url, status: response.status, ms: Math.round(performance.now() - start) });
}
await check(SITE_ORIGIN + '/robots.txt', (_response, body) => {
  if (!body.includes('Sitemap: ' + SITE_ORIGIN + '/sitemap.xml')) throw new Error('robots.txt sitemap declaration missing');
});
await check(SITE_ORIGIN + '/ads.txt', (_response, body) => {
  if (!/^google\.com,\s*pub-\d{10,20},\s*DIRECT,/m.test(body)) throw new Error('AdSense seller record missing or malformed');
});
for (const frameUrl of [production.frames.nativeFrameUrl, production.frames.guideFrameUrl]) {
  await check(frameUrl, (response, body) => {
    const robots = response.headers.get('x-robots-tag') || '';
    if (!/noindex/i.test(robots) && !/name=["']robots["'][^>]*noindex/i.test(body)) {
      throw new Error('Ad frame must be noindex: ' + frameUrl);
    }
  });
}
let cursor = 0;
const errors = [];
const workers = Array.from({ length: Math.min(6, production.urls.length) }, async () => {
  while (cursor < production.urls.length) {
    const url = production.urls[cursor++];
    try {
      await check(url, (response, body) => {
        if (!/text\/html/i.test(response.headers.get('content-type') || '')) throw new Error('Expected HTML');
        if (!body.includes('<link rel="canonical" href="' + url + '"')) throw new Error('Canonical mismatch');
        if (!/<h1(?:\s|>)/i.test(body)) throw new Error('Primary heading missing');
        if (/<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(body) ||
            /noindex/i.test(response.headers.get('x-robots-tag') || '')) throw new Error('Unexpected noindex');
      });
    } catch (error) { errors.push(url + ': ' + String(error)); }
  }
});
await Promise.all(workers);
if (errors.length) throw new Error('Production crawl failed:\n' + errors.join('\n'));
const lines = [
  '## PostChars production health',
  '- Canonical pages checked: ' + production.urls.length,
  '- Additional checks: robots.txt, ads.txt, IndexNow key, runtime ad config, two isolated ad frames',
  '- Page HTTP checks: ' + checks.filter(x => x.url.startsWith(SITE_ORIGIN)).length,
  '- Result: PASS',
  '',
  'Network timings are synthetic GitHub-runner observations, not Core Web Vitals field data.'
].join('\n') + '\n';
console.log(lines);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, lines, 'utf8');
