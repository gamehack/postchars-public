import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Public source builds are independent of the original operator's analytics,
// advertising accounts and domain verification. This script only enhances
// social previews and feedback navigation; it never injects third-party tags.
const root = join(process.cwd(), 'dist');
const xml = await readFile(join(root, 'sitemap.xml'), 'utf8');
const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);
const urlImage = 'https://postchars.com/postchars-og.png';

for (const url of urls) {
  const pathname = new URL(url).pathname;
  const file = join(root, pathname === '/' ? 'index.html' : pathname.slice(1) + 'index.html');
  let html = await readFile(file, 'utf8');
  if (!/<\/head>/i.test(html)) throw new Error('Missing head: ' + file);

  // Do not allow stale operator-specific configuration to leak into build output.
  html = html
    .replace(/<meta\b(?=[^>]*\bname=["']postchars-ga4-id["'])[^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*src=["'][^"']*(?:guide-ad-config|adsbygoogle)[^"']*["'][^>]*>\s*<\/script>\s*/gi, '')
    .replace(/\s*<aside\b[^>]*class=["'][^"']*\bguide-ad-slot\b[^"']*["'][^>]*>[\s\S]*?<\/aside>/gi, '');

  if (/(?:ca-)?pub-\d{10,}/i.test(html) ||
      /googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(html) ||
      /(?:highrevenueformat|profitableratecpmnetwork)\.com/i.test(html)) {
    throw new Error('Public build contains a publisher-specific advertising integration: ' + file);
  }

  if (!html.includes('property="og:image"')) {
    const meta = '<meta property="og:image" content="' + urlImage + '">' +
      '<meta property="og:image:width" content="1200">' +
      '<meta property="og:image:height" content="630">' +
      '<meta property="og:image:type" content="image/png">' +
      '<meta name="twitter:image" content="' + urlImage + '">';
    html = html.replace(/<\/head>/i, meta + '</head>');
  }

  // Give every static content page a direct, accessible feedback route.
  // React tool pages render their own hydrated footer link.
  if (!html.includes('data-page=') && !html.includes('subject=PostChars%20bug%20report')) {
    html = html.replace(/<\/footer>/i, '<a href="mailto:hello@postchars.com?subject=PostChars%20bug%20report">Report an issue</a></footer>');
  }

  if (/name="twitter:card"/i.test(html)) {
    html = html.replace(/name="twitter:card" content="[^"]*"/gi, 'name="twitter:card" content="summary_large_image"');
  } else {
    html = html.replace(/<\/head>/i, '<meta name="twitter:card" content="summary_large_image"></head>');
  }
  await writeFile(file, html);
}

const image = await readFile(join(root, 'postchars-og.png'));
if (image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Missing valid PNG social cover');
if (image.readUInt32BE(16) !== 1200 || image.readUInt32BE(20) !== 630) throw new Error('Unexpected social cover dimensions');
console.log('Social previews verified: ' + urls.length + ' pages with 1200x630 PNG sharing asset; no operator advertising tags injected');
