import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// Public builds are operator-neutral. Optional deployment-specific configuration
// is injected only into dist/ by the hosting provider's build environment.
const dist = join(process.cwd(), 'dist');
const env = name => (process.env[name] || '').trim();
const fail = message => { throw new Error('Operator configuration: ' + message); };
const requireValue = (value, name) => { if (!value) fail(name + ' is required'); return value; };
const safeJs = value => JSON.stringify(value).replace(/</g, '\\u003c');
const escapeAttr = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function secureUrl(value, name, originOnly = false) {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { fail(name + ' must be an absolute URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || (originOnly && url.origin !== value)) {
    fail(name + ' must use HTTPS without credentials' + (originOnly ? ' and contain only the origin' : ''));
  }
  return value;
}
const GA4 = env('POSTCHARS_GA4_ID');
const ADSENSE_CLIENT = env('POSTCHARS_ADSENSE_CLIENT');
const ADSENSE_SCRIPT = env('POSTCHARS_ADSENSE_SCRIPT_URL');
const ADS_TXT = env('POSTCHARS_ADS_TXT');
const NATIVE_SCRIPT = env('POSTCHARS_NATIVE_SCRIPT_URL');
const NATIVE_CONTAINER = env('POSTCHARS_NATIVE_CONTAINER_ID');
const GUIDE_SCRIPT = env('POSTCHARS_GUIDE_SCRIPT_URL');
const GUIDE_KEY = env('POSTCHARS_GUIDE_KEY');
const FRAME_ORIGIN = env('POSTCHARS_AD_FRAME_ORIGIN');
const INDEXNOW_KEY = env('POSTCHARS_INDEXNOW_KEY');
const values = [GA4, ADSENSE_CLIENT, ADSENSE_SCRIPT, ADS_TXT, NATIVE_SCRIPT, NATIVE_CONTAINER, GUIDE_SCRIPT, GUIDE_KEY, FRAME_ORIGIN, INDEXNOW_KEY];
const strict = env('POSTCHARS_REQUIRE_OPERATOR_CONFIG') === '1';
if (strict) {
  for (const [name, value] of Object.entries({ POSTCHARS_GA4_ID:GA4, POSTCHARS_ADSENSE_CLIENT:ADSENSE_CLIENT, POSTCHARS_ADSENSE_SCRIPT_URL:ADSENSE_SCRIPT, POSTCHARS_ADS_TXT:ADS_TXT, POSTCHARS_NATIVE_SCRIPT_URL:NATIVE_SCRIPT, POSTCHARS_NATIVE_CONTAINER_ID:NATIVE_CONTAINER, POSTCHARS_GUIDE_SCRIPT_URL:GUIDE_SCRIPT, POSTCHARS_GUIDE_KEY:GUIDE_KEY, POSTCHARS_AD_FRAME_ORIGIN:FRAME_ORIGIN, POSTCHARS_INDEXNOW_KEY:INDEXNOW_KEY })) {
    requireValue(value, name);
  }
}
if (!values.some(Boolean)) {
  console.log('Operator overlay: public defaults retained (no publisher IDs, ad frames or verification keys).');
} else {
  if (GA4 && !/^G-[A-Z0-9]{6,}$/.test(GA4)) fail('invalid GA4 measurement ID');
  const adsenseEnabled = Boolean(ADSENSE_CLIENT || ADSENSE_SCRIPT || ADS_TXT);
  if (adsenseEnabled) {
    if (!/^ca-pub-[0-9]{10,20}$/.test(requireValue(ADSENSE_CLIENT, 'POSTCHARS_ADSENSE_CLIENT'))) fail('invalid AdSense client');
    secureUrl(requireValue(ADSENSE_SCRIPT, 'POSTCHARS_ADSENSE_SCRIPT_URL'), 'POSTCHARS_ADSENSE_SCRIPT_URL');
    if (!ADSENSE_SCRIPT.includes('/adsbygoogle.js')) fail('unexpected AdSense script path');
    if (!requireValue(ADS_TXT, 'POSTCHARS_ADS_TXT').includes(ADSENSE_CLIENT.slice(3))) fail('ads.txt must match AdSense publisher');
    if (/[\r\n]/.test(ADS_TXT)) fail('ads.txt must contain one seller record');
  }
  const nativeEnabled = Boolean(NATIVE_SCRIPT || NATIVE_CONTAINER);
  const guideEnabled = Boolean(GUIDE_SCRIPT || GUIDE_KEY);
  if (nativeEnabled) {
    secureUrl(requireValue(NATIVE_SCRIPT, 'POSTCHARS_NATIVE_SCRIPT_URL'), 'POSTCHARS_NATIVE_SCRIPT_URL');
    if (!/^container-[a-z0-9-]{6,}$/.test(requireValue(NATIVE_CONTAINER, 'POSTCHARS_NATIVE_CONTAINER_ID'))) fail('invalid native ad container');
  }
  if (guideEnabled) {
    secureUrl(requireValue(GUIDE_SCRIPT, 'POSTCHARS_GUIDE_SCRIPT_URL'), 'POSTCHARS_GUIDE_SCRIPT_URL');
    if (!/^[a-f0-9]{32}$/.test(requireValue(GUIDE_KEY, 'POSTCHARS_GUIDE_KEY'))) fail('invalid guide ad key');
  }
  if (nativeEnabled || guideEnabled) {
    secureUrl(requireValue(FRAME_ORIGIN, 'POSTCHARS_AD_FRAME_ORIGIN'), 'POSTCHARS_AD_FRAME_ORIGIN', true);
    if (['https://postchars.com', 'https://www.postchars.com'].includes(FRAME_ORIGIN)) {
      fail('ad frames must not share the first-party content origin');
    }
  } else if (FRAME_ORIGIN) fail('frame origin configured without ad frames');
  if (INDEXNOW_KEY && !/^[a-zA-Z0-9_-]{8,128}$/.test(INDEXNOW_KEY)) fail('invalid IndexNow verification key');

  const runtime = {
    native: {
      enabled: nativeEnabled,
      scriptUrl: nativeEnabled ? NATIVE_SCRIPT : '',
      containerId: nativeEnabled ? NATIVE_CONTAINER : '',
      frameUrl: nativeEnabled ? FRAME_ORIGIN + '/native-ad-frame.html' : '',
      previewFrameUrl: nativeEnabled ? FRAME_ORIGIN + '/native-ad-frame.html' : ''
    },
    guide: {
      enabled: guideEnabled,
      key: guideEnabled ? GUIDE_KEY : '',
      scriptUrl: guideEnabled ? GUIDE_SCRIPT : '',
      frameUrl: guideEnabled ? FRAME_ORIGIN + '/guide-ad-frame.html' : ''
    }
  };
  await writeFile(join(dist, 'operator-config.js'), 'window.POSTCHARS_OPERATOR_CONFIG=' + safeJs(runtime) + ';\n');
  if (GA4) {
    const gaPath = join(dist, 'analytics-config.js');
    const source = await readFile(gaPath, 'utf8');
    if (!source.includes("var measurementId = '';")) fail('public analytics config template changed');
    await writeFile(gaPath, source.replace("var measurementId = '';", 'var measurementId = ' + safeJs(GA4) + ';'));
  }
  if (adsenseEnabled) await writeFile(join(dist, 'ads.txt'), ADS_TXT + '\n');
  if (INDEXNOW_KEY) await writeFile(join(dist, 'indexnow-key.txt'), INDEXNOW_KEY + '\n');

  const xml = await readFile(join(dist, 'sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  if (!urls.length) fail('no canonical HTML pages found');
  const bootstrap = '<script id="postchars-google-consent-default">window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window.gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",wait_for_update:500});window.__postcharsConsentInitialized=true;</script>';
  const publisherTag = adsenseEnabled
    ? '<script async src="' + escapeAttr(ADSENSE_SCRIPT) + '?client=' + encodeURIComponent(ADSENSE_CLIENT) + '" crossorigin="anonymous"></script>'
    : '';
  const adGuides = new Set([
    '/guides/google-ads-character-limits/',
    '/guides/twitter-urls-emoji-counting/',
    '/guides/social-media-character-limits/'
  ]);
  for (const raw of urls) {
    const pathname = new URL(raw).pathname;
    const path = join(dist, pathname === '/' ? 'index.html' : pathname.slice(1) + 'index.html');
    let html = await readFile(path, 'utf8');
    if (!html.includes('<head>')) fail('missing head in ' + pathname);
    html = html.replace('<head>', '<head><script src="/operator-config.js"></script>');
    if (adsenseEnabled && !new Set(['/about/', '/privacy/', '/contact/']).has(pathname)) {
      html = html.replace('<head>', '<head>' + bootstrap + publisherTag);
    }
    if (guideEnabled && adGuides.has(pathname)) {
      const aside = '<aside class="guide-ad-slot" aria-label="Advertisement" hidden><div class="guide-ad-label">ADVERTISEMENT</div></aside>';
      if (html.includes('</table>')) html = html.replace('</table>', '</table>' + aside);
      else html = html.replace('</article>', aside + '</article>');
    }
    await writeFile(path, html);
  }

  if (nativeEnabled || guideEnabled) {
    // Frames must be served from a separate origin. Script execution is isolated
    // from the PostChars editor and starts only following local advertising consent.
    const securityHeaders = [
      '',
      '/native-ad-frame.html',
      '  X-Robots-Tag: noindex, nofollow',
      '  Content-Security-Policy: frame-ancestors https://postchars.com https://www.postchars.com',
      '/guide-ad-frame.html',
      '  X-Robots-Tag: noindex, nofollow',
      '  Content-Security-Policy: frame-ancestors https://postchars.com https://www.postchars.com',
      ''
    ].join('\n');
    await writeFile(join(dist, '_headers'), (await readFile(join(dist, '_headers'), 'utf8')).trimEnd() + '\n' + securityHeaders);
  }
  if (nativeEnabled) {
    const frame = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><title>Advertisement</title><style>html,body{margin:0;padding:0;min-height:370px;overflow:hidden;background:transparent}</style></head><body>' +
      '<div id="' + escapeAttr(NATIVE_CONTAINER) + '"></div>' +
      '<script data-cfasync="false" async src="' + escapeAttr(NATIVE_SCRIPT) + '"></script></body></html>\n';
    await writeFile(join(dist, 'native-ad-frame.html'), frame);
  }
  if (guideEnabled) {
    const frame = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><title>Advertisement</title><style>html,body{width:300px;min-height:250px;margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>' +
      '<script>var atOptions={key:' + safeJs(GUIDE_KEY) + ',format:"iframe",height:250,width:300,params:{}};</script>' +
      '<script src="' + escapeAttr(GUIDE_SCRIPT) + '"></script></body></html>\n';
    await writeFile(join(dist, 'guide-ad-frame.html'), frame);
    const cssPath = join(dist, 'legal.css');
    await writeFile(cssPath, (await readFile(cssPath, 'utf8')) +
      '\n.guide-ad-slot{max-width:740px;margin:30px auto 38px;padding:17px 0;border-top:1px solid #e4e7f1;border-bottom:1px solid #e4e7f1;text-align:center}' +
      '\n.guide-ad-slot[hidden]{display:none!important}' +
      '\n.guide-ad-slot iframe{display:block;width:300px;height:250px;margin:0 auto;border:0}' +
      '\n.guide-ad-label{margin-bottom:10px;color:#98a1b1;font-size:9px;font-weight:700;letter-spacing:1.5px}\n');
  }
  console.log('Operator overlay generated for ' + urls.length + ' canonical pages: GA4=' + Boolean(GA4) + ', AdSense=' + adsenseEnabled + ', native ads=' + nativeEnabled + ', guide ads=' + guideEnabled + ', IndexNow=' + Boolean(INDEXNOW_KEY));
}
