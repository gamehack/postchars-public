import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_ORIGIN, parseSitemap, assertMatchingSitemaps, assertIndexNowKey,
  assertIsolatedFrameUrl, parseOperatorConfig
} from './production-ops-core.mjs';

test('parses only unique HTTPS canonical URLs on the production origin', () => {
  const xml = '<urlset><url><loc>https://postchars.com/</loc></url><url><loc>https://postchars.com/tool/</loc></url></urlset>';
  assert.deepEqual(parseSitemap(xml), ['https://postchars.com/', 'https://postchars.com/tool/']);
  assert.throws(() => parseSitemap('<loc>http://postchars.com/</loc>'), /Unexpected sitemap URL/);
  assert.throws(() => parseSitemap('<loc>https://evil.example/</loc>'), /Unexpected sitemap URL/);
  assert.throws(() => parseSitemap('<loc>https://postchars.com/</loc><loc>https://postchars.com/</loc>'), /Duplicate sitemap URL/);
});

test('requires live sitemap to match the checked-out deployment', () => {
  const expected = ['https://postchars.com/', 'https://postchars.com/tool/'];
  assert.equal(assertMatchingSitemaps(expected, [...expected]), true);
  assert.throws(() => assertMatchingSitemaps(expected, ['https://postchars.com/']), /does not match/);
});

test('validates IndexNow key format without embedding a key in source', () => {
  assert.equal(assertIndexNowKey('a'.repeat(32)), 'a'.repeat(32));
  assert.throws(() => assertIndexNowKey('short'), /malformed/);
});

test('requires isolated HTTPS ad frames', () => {
  assert.equal(assertIsolatedFrameUrl('https://ads.example/native.html'), 'https://ads.example/native.html');
  assert.throws(() => assertIsolatedFrameUrl('https://postchars.com/native.html'), /isolated/);
  assert.throws(() => assertIsolatedFrameUrl('http://ads.example/native.html'), /HTTPS/);
});

test('parses the runtime config and validates both independent frame origins', () => {
  const runtime = 'window.POSTCHARS_OPERATOR_CONFIG=' + JSON.stringify({
    native: { enabled: true, frameUrl: 'https://ads.example/native.html' },
    guide: { enabled: true, frameUrl: 'https://ads.example/guide.html' }
  }) + ';';
  assert.deepEqual(parseOperatorConfig(runtime), {
    nativeFrameUrl: 'https://ads.example/native.html',
    guideFrameUrl: 'https://ads.example/guide.html'
  });
  assert.throws(() => parseOperatorConfig('window.POSTCHARS_OPERATOR_CONFIG={};'), /enabled/);
  assert.equal(SITE_ORIGIN, 'https://postchars.com');
});
