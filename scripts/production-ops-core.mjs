export const SITE_ORIGIN = 'https://postchars.com';

export function parseSitemap(xml, siteOrigin = SITE_ORIGIN) {
  const urls = [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => match[1].replaceAll('&amp;', '&'));
  if (!urls.length) throw new Error('Sitemap contains no canonical URLs');
  const seen = new Set();
  for (const raw of urls) {
    let url;
    try { url = new URL(raw); } catch { throw new Error('Invalid sitemap URL'); }
    if (url.protocol !== 'https:' || url.origin !== siteOrigin || url.search || url.hash) {
      throw new Error('Unexpected sitemap URL: ' + raw);
    }
    if (seen.has(url.href)) throw new Error('Duplicate sitemap URL: ' + raw);
    seen.add(url.href);
  }
  return urls;
}

export function assertMatchingSitemaps(expected, actual) {
  if (expected.length !== actual.length || expected.some(url => !actual.includes(url))) {
    throw new Error('Live sitemap does not match the deployed source sitemap yet');
  }
  return true;
}

export function assertIndexNowKey(value) {
  const key = String(value || '').trim();
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('IndexNow verification key is missing or malformed');
  return key;
}

export function assertIsolatedFrameUrl(raw, siteOrigin = SITE_ORIGIN) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('Ad frame URL is invalid'); }
  if (url.protocol !== 'https:' || url.username || url.password ||
      url.origin === siteOrigin || !url.pathname.endsWith('.html')) {
    throw new Error('Ad frame must be HTTPS and isolated on a different origin');
  }
  return url.href;
}

export function parseOperatorConfig(source, siteOrigin = SITE_ORIGIN) {
  const prefix = 'window.POSTCHARS_OPERATOR_CONFIG=';
  const start = String(source).indexOf(prefix);
  if (start < 0) throw new Error('Production operator config bootstrap missing');
  let serialized = String(source).slice(start + prefix.length).trim();
  if (serialized.endsWith(';')) serialized = serialized.slice(0, -1).trim();
  let config;
  try { config = JSON.parse(serialized); } catch { throw new Error('Production operator config is malformed'); }
  if (config?.native?.enabled !== true || config?.guide?.enabled !== true) {
    throw new Error('Expected production native and guide ad integrations to be enabled');
  }
  return {
    nativeFrameUrl: assertIsolatedFrameUrl(config.native.frameUrl, siteOrigin),
    guideFrameUrl: assertIsolatedFrameUrl(config.guide.frameUrl, siteOrigin)
  };
}
