import { readFile, appendFile } from 'node:fs/promises';
import {
  SITE_ORIGIN, parseSitemap, assertMatchingSitemaps, assertIndexNowKey
} from './production-ops-core.mjs';

const host = new URL(SITE_ORIGIN).hostname;
const expected = parseSitemap(await readFile('public/sitemap.xml', 'utf8'));
const keyLocation = SITE_ORIGIN + '/indexnow-key.txt';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function get(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'PostCharsIndexNow/2.0' },
    signal: AbortSignal.timeout(20000),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(url + ' returned HTTP ' + response.status);
  return response.text();
}
let key = '';
let verified = false;
for (let attempt = 1; attempt <= 18; attempt++) {
  try {
    key = assertIndexNowKey(await get(keyLocation));
    const live = parseSitemap(await get(SITE_ORIGIN + '/sitemap.xml'));
    assertMatchingSitemaps(expected, live);
    verified = true;
    break;
  } catch (error) {
    console.log('Waiting for Cloudflare Pages deployment ' + attempt + '/18: ' + String(error).slice(0, 180));
    if (attempt < 18) await sleep(20000);
  }
}
if (!verified) throw new Error('IndexNow submission aborted: live key and sitemap did not match this commit');
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8', 'user-agent': 'PostCharsIndexNow/2.0' },
  body: JSON.stringify({ host, key, keyLocation, urlList: expected }),
  redirect: 'error',
  signal: AbortSignal.timeout(30000)
});
const reply = (await response.text()).slice(0, 400);
if (![200, 202].includes(response.status)) throw new Error('IndexNow returned HTTP ' + response.status + ': ' + reply);
const summary = '## PostChars IndexNow\n- Submission accepted: HTTP ' + response.status + '\n- URLs submitted: ' + expected.length + '\n- This confirms API acceptance, not crawling or indexing.\n';
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
