import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const sitemap = await readFile(join(process.cwd(), 'dist', 'sitemap.xml'), 'utf8');
const urls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
if (urls.length !== 49) throw new Error('Expected 49 canonical URLs; found ' + urls.length);

let checkedPrerenders = 0;
for (const url of urls) {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://postchars.com') {
    throw new Error('Sitemap contains an unexpected origin: ' + url);
  }

  const path = parsed.pathname === '/' ? 'index.html' : parsed.pathname.slice(1) + 'index.html';
  const html = await readFile(join(process.cwd(), 'dist', path), 'utf8');
  if (!html.includes('<link rel="canonical" href="' + url + '"')) {
    throw new Error('Canonical URL mismatch for ' + path);
  }
  if (!/<h1(?:\s|>)/i.test(html)) throw new Error('Missing H1 in ' + path);
  if (!html.includes('name="description"')) throw new Error('Missing meta description in ' + path);
  if (!html.includes('property="og:image" content="https://postchars.com/postchars-og.png"')) throw new Error('Missing social sharing cover for ' + path);
  if (!html.includes('name="twitter:card" content="summary_large_image"')) throw new Error('Missing large Twitter card for ' + path);
  const adPattern = new RegExp(
    '(?:ca-' + 'pub-\\d{10,})|googlesyndication\\.com/pagead/js/adsbygoogle\\.js|' +
    '(?:highrevenueformat|profitableratecpmnetwork)\\.com|(?:guide|native)-ad-frame\\.html',
    'i'
  );
  if (adPattern.test(html) || html.includes('class="guide-ad-slot"')) {
    throw new Error('Public build must not include publisher-specific advertising integrations: ' + path);
  }
  if (/<meta\b[^>]*name=["']postchars-ga4-id["'][^>]*content=["']G-/i.test(html)) {
    throw new Error('Public build must not include a preconfigured GA4 measurement ID: ' + path);
  }
  if (html.includes('data-page=')) {
    if (!html.includes('data-prerendered="true"')) throw new Error('Not pre-rendered: ' + path);
    if (!html.includes('Frequently asked questions')) throw new Error('Tool page is missing static FAQ: ' + path);
    checkedPrerenders += 1;
  }
}
if (checkedPrerenders !== 9) throw new Error('Expected nine pre-rendered tools');
const privacyPolicy = await readFile(join(process.cwd(), 'dist', 'privacy/index.html'), 'utf8');
if (!privacyPolicy.includes('Advertising integrations, publisher identifiers, ad-network scripts and ad frames are not included')) {
  throw new Error('Privacy policy must disclose that advertising is disabled in the default public release');
}
console.log('Public deployment configuration verified: no preconfigured analytics IDs or advertising publisher integrations');

const multi = await readFile(join(process.cwd(), 'dist', 'cross-platform-post-checker/index.html'), 'utf8');
if (!multi.includes('id="platform-grid"') || !multi.includes('src="/src/cross-platform-checker.ts"') && !multi.includes('crossPlatformPostChecker-')) throw new Error('Multi-platform checker missing executable entry or results grid');
if (!(await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8')).includes('href="/cross-platform-post-checker/')) throw new Error('Cross-platform checker missing from home directory');
console.log('SEO output verified: ' + urls.length + ' canonical URLs, ' + checkedPrerenders + ' pre-rendered tool pages');






const platformEditorPages = [
 ['tiktok-caption-counter','social','tiktok'],
 ['bluesky-character-counter','social','bluesky'],
 ['reddit-title-character-counter','social','reddit'],
 ['discord-message-counter','social','discord'],
 ['telegram-bot-message-counter','social','telegram'],
 ['facebook-post-character-counter','social','facebook'],
 ['pinterest-description-counter','social','pinterest'],
 ['x-thread-splitter','thread',''],
 ['identifier-case-converter','identifier',''],
 ['email-url-extractor','extract',''],
 ['syllable-counter','extract','']
];
const newToolHome = await readFile(join(process.cwd(),'dist','index.html'),'utf8');
for(const [slug,mode,key] of platformEditorPages) {
 const html=await readFile(join(process.cwd(),'dist',slug,'index.html'),'utf8');
 if(!html.includes('data-special-tool="'+mode+'"'))throw new Error('Tool mode is not initialized: '+slug);
 if(!html.includes('id="tool-input"'))throw new Error('Missing functional input: '+slug);
 if(!html.includes('/platform-editor-tools.css'))throw new Error('Missing responsive tool layout: '+slug);
 if(!html.includes('application/ld+json'))throw new Error('Missing WebApplication structured data: '+slug);
 if(!html.includes('href="https://postchars.com/'+slug+'/'))throw new Error('Missing canonical URL: '+slug);
 if(!html.includes('data-privacy-open'))throw new Error('Missing consent choices: '+slug);
 if(key && !html.includes('data-social-key="'+key+'"'))throw new Error('Wrong platform rule: '+slug);
 if(!newToolHome.includes('href="/'+slug+'/'))throw new Error('Missing homepage tool link: '+slug);
}
if(!newToolHome.includes('Save version') || !newToolHome.includes('Reading speed') || !newToolHome.includes('Undo'))
 throw new Error('Missing accessible writing history features from React workspace');
console.log('Platform and editing expansion verified: 11 tools linked, 33 directory entries, version controls');

// Completion acceptance: all new tools must ship static indexable HTML,
// functional inputs and a direct link from the prerendered tool directory.
const completionPages = [
 ['sort-lines-alphabetically','list','tool-input'],
 ['text-cleaner-online','cleaner','tool-input'],
 ['unicode-character-inspector','unicode','tool-input'],
 ['detailed-word-counter','stats','tool-input'],
 ['instagram-bio-character-counter','platform','tool-input'],
 ['youtube-description-counter','platform','tool-input'],
 ['linkedin-headline-counter','platform','tool-input']
];
const completionHome = await readFile(join(process.cwd(), 'dist','index.html'),'utf8');
for(const [slug,mode,input] of completionPages) {
 const html=await readFile(join(process.cwd(),'dist',slug,'index.html'),'utf8');
 if(!html.includes('data-completion-tool="'+mode+'"'))throw new Error('Missing working tool mode: '+slug);
 if(!html.includes('id="'+input+'"'))throw new Error('Missing input field: '+slug);
 if(!html.includes('application/ld+json'))throw new Error('Missing WebApplication schema: '+slug);
 if(!html.includes('href="https://postchars.com/'+slug+'/'))throw new Error('Missing canonical URL: '+slug);
 if(!html.includes('/completion-tools.css'))throw new Error('Missing responsive styles: '+slug);
 if(!html.includes('data-privacy-open'))throw new Error('Missing privacy controls: '+slug);
 if(!completionHome.includes('href="/'+slug+'/'))throw new Error('Missing homepage discovery: '+slug);
}
if(!completionHome.includes('id="tool-search"') || !completionHome.includes('id="tool-group"')) throw new Error('Missing searchable tool directory');
if(!completionHome.includes('postchars-draft-enabled-v1') && !(await readFile(join(process.cwd(),'src','main.tsx'),'utf8')).includes('postchars-draft-enabled-v1')) throw new Error('Missing opt-in draft feature');
console.log('Completion acceptance verified: 7 earlier tools, 32 searchable tool cards, opt-in local draft, and structured metadata');

for (const [slug, heading, textareaId, mode] of [
  ['text-diff-checker', 'Text Diff Checker', 'diff-original', 'diff'],
  ['find-and-replace-text', 'Find and Replace Text', 'replace-original', 'replace'],
  ['readability-checker', 'Readability Checker', 'readability-input', 'readability']
]) {
  const html = await readFile(join(process.cwd(), 'dist', slug, 'index.html'), 'utf8');
  if (!html.includes('<h1>'+heading)) throw new Error('Missing search-intent H1: '+slug);
  if (!html.includes('id="'+textareaId+'"')) throw new Error('Missing functional editor input: '+slug);
  if (!html.includes('data-editor-tool="'+mode+'"')) throw new Error('Missing editor initialization: '+slug);
  if (!html.includes('name="description"')) throw new Error('Missing meta description: '+slug);
  if (!html.includes('application/ld+json')) throw new Error('Missing WebApplication schema: '+slug);
  if (!html.includes('href="https://postchars.com/'+slug+'/')) throw new Error('Missing canonical URL: '+slug);
  if (!html.includes('/editor-tools.css') || !html.includes('/growth-tools.css')) throw new Error('Missing editor layout: '+slug);
  if (!html.includes('/guide-consent.js') || !html.includes('data-privacy-open')) throw new Error('Missing privacy controls: '+slug);
}
const editorHome = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8');
for (const slug of ['text-diff-checker','find-and-replace-text','readability-checker']) {
  if (!editorHome.includes('href="/'+slug+'/')) throw new Error('New tool is not discoverable from homepage: '+slug);
}
console.log('Editor tool discovery verified: 3 unique interactive pages, privacy controls and homepage links');

for (const [tool, keyword, inputId] of [
  ['sms-character-counter', 'SMS Character Counter', 'tool-text'],
  ['serp-snippet-preview', 'SERP Snippet Preview', 'seo-title'],
  ['keyword-density-checker', 'Keyword Density Checker', 'tool-text']
]) {
  const html = await readFile(join(process.cwd(), 'dist', tool, 'index.html'), 'utf8');
  if (!html.includes('<h1>'+keyword) && !html.includes('<h1>'+keyword+'&')) throw new Error('Missing keyword-oriented H1: '+tool);
  if (!html.includes('id="'+inputId+'"')) throw new Error('Missing usable text input: '+tool);
  if (!html.includes('application/ld+json')) throw new Error('Missing WebApplication structured data: '+tool);
  if (!html.includes('href="https://postchars.com/'+tool+'/')) throw new Error('Missing canonical URL: '+tool);
  if (!html.includes('/growth-tools.css') || !html.includes('data-growth-tool=')) throw new Error('Missing browser utility: '+tool);
  if (!html.includes('/guide-consent.js')) throw new Error('Missing privacy choices: '+tool);
}
const homeGrowth = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8');
for (const tool of ['sms-character-counter', 'serp-snippet-preview', 'keyword-density-checker']) {
  if (!homeGrowth.includes('href="/'+tool+'/')) throw new Error('Missing homepage tool link: '+tool);
}
console.log('Competitor-gap tools verified: 3 usable canonical pages linked from homepage');

// The new publishing guides must be prerender-free, discoverable HTML, with
// unique canonical URLs and a direct route back to their interactive tool.
for (const [guide,tool,expectedHeading] of [
  ['guides/linkedin-post-character-limit/index.html','/linkedin-character-counter/','LinkedIn Post Character Limit'],
  ['guides/instagram-caption-character-limit/index.html','/instagram-caption-counter/','Instagram Caption Character Limit'],
  ['guides/social-media-character-limits/index.html','/cross-platform-post-checker/','Social Media Character Limits: 12 Platforms Compared']
]) {
  const html = await readFile(join(process.cwd(), 'dist', guide), 'utf8');
  if (!html.includes('<h1>'+expectedHeading) && !html.includes('<h1>'+expectedHeading+':')) throw new Error('Guide is missing keyword-aligned primary heading: ' + guide);
  if (!html.includes('href="'+tool+'"')) throw new Error('Guide must link to functional counter: ' + guide);
  if (!html.includes('application/ld+json')) throw new Error('Guide is missing Article and Breadcrumb structured data: ' + guide);
  if (!html.includes('https://postchars.com/guides/')) throw new Error('Guide canonical host mismatch: ' + guide);
}
const appHtml = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8');
for (const path of ['linkedin-post-character-limit','instagram-caption-character-limit','social-media-character-limits']) {
  const link = '/guides/'+path+'/';
  if (!appHtml.includes('href="'+link+'"')) throw new Error('Home must link to ' + link);
}
for (const [file,guideSlug] of [
  ['linkedin-character-counter/index.html','linkedin-post-character-limit'],
  ['instagram-caption-counter/index.html','instagram-caption-character-limit'],
  ['cross-platform-post-checker/index.html','social-media-character-limits']
]) {
  const html = await readFile(join(process.cwd(), 'dist', file), 'utf8');
  if (!html.includes('href="/guides/'+guideSlug+'/')) throw new Error('Tool must link to its guide: ' + file);
}
console.log('Publishing guide discovery verified: LinkedIn, Instagram and 12-platform limits guide with contextual internal links');
for (const guide of ['guides/twitter-urls-emoji-counting/index.html','guides/linkedin-post-character-limit/index.html','guides/instagram-caption-character-limit/index.html']) {
  const html = await readFile(join(process.cwd(), 'dist', guide), 'utf8');
  if (!html.includes('href="/cross-platform-post-checker/')) throw new Error('Social guide must link to cross-platform checker: ' + guide);
}


for (const guide of ['guides/google-ads-character-limits/index.html', 'guides/twitter-urls-emoji-counting/index.html', 'guides/social-media-character-limits/index.html']) {
  const html = await readFile(join(process.cwd(), 'dist', guide), 'utf8');
  if (!html.includes('/analytics-config.js')) throw new Error('Missing centralized optional analytics config in ' + guide);
  if (!html.includes('/guide-consent.js')) throw new Error('Guide consent controller missing in ' + guide);
  if (html.includes('/guide-ad-config.js') || html.includes('guide-ad-slot')) {
    throw new Error('Editorial guides must not contain publisher-specific ad configuration or ad slots: ' + guide);
  }
  if (!html.includes('application/ld+json')) throw new Error('Missing Article structured data in ' + guide);
  if (!html.includes('data-privacy-open')) throw new Error('Missing privacy controls in ' + guide);
}
const guideConsent = await readFile(join(process.cwd(), 'dist', 'guide-consent.js'), 'utf8');
if (!guideConsent.includes('function loadAnalytics()')) throw new Error('Optional analytics consent controller missing');
if (/adsbygoogle|googlesyndication|highrevenueformat|profitableratecpmnetwork/i.test(guideConsent)) {
  throw new Error('Public guide consent must not contain account-specific provider URLs');
}
if (!guideConsent.includes('if(guideAd.enabled&&settings.advertising)loadAd();else unloadAd()')) {
  throw new Error('Optional guide ad consent gate missing');
}
if (!guideConsent.includes("guidePath.includes('social-media-character-limits')?'social_media_limits'")) throw new Error('Social limits guide analytics classification missing');
if (!guideConsent.includes('cross-platform-post-checker')) throw new Error('Cross-platform guide tool click tracking missing');
console.log('Editorial guides verified: Article schema, privacy controls and opt-in analytics; no advertising integrations');

// Search intent and contextual topic-cluster acceptance. This runs against
// built, prerendered HTML rather than React source or a head-only shell.
const intentPages = [
  ['/', 'Free Character Counter & Text Tools', ['/cross-platform-post-checker/', '/character-counter/', '/google-ads-character-counter/']],
  ['/character-counter/', 'Free Online Character Counter', ['/cross-platform-post-checker/', '/readability-checker/']],
  ['/word-counter/', 'Free Online Word Counter', ['/readability-checker/']],
  ['/instagram-caption-counter/', 'Instagram Caption Character Counter', ['/guides/instagram-caption-character-limit/']],
  ['/google-ads-character-counter/', 'Google Ads Character Counter', ['/guides/google-ads-character-limits/', '/serp-snippet-preview/']],
  ['/guides/google-ads-character-limits/', 'Google Ads Character Limits', ['/google-ads-character-counter/', '/serp-snippet-preview/']],
  ['/cross-platform-post-checker/', 'Cross-Platform Post Checker', ['/guides/social-media-character-limits/', '/twitter-character-counter/', '/instagram-caption-counter/']],
  ['/readability-checker/', 'Readability Checker', ['/word-counter/', '/keyword-density-checker/', '/serp-snippet-preview/']],
  ['/serp-snippet-preview/', 'SERP Snippet Preview', ['/readability-checker/', '/keyword-density-checker/']]
];
for (const [pathname, keyword, internalHrefs] of intentPages) {
  const file = join(process.cwd(), 'dist', pathname === '/' ? 'index.html' : pathname.slice(1) + 'index.html');
  const html = await readFile(file, 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replaceAll('&amp;', '&') ?? '';
  const headings = [...html.matchAll(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/gi)];
  if (headings.length !== 1) throw new Error('Expected one H1 on SEO priority page: ' + pathname);
  const h1 = headings[0][1].replace(/<[^>]+>/g, '').replaceAll('&amp;', '&');
  if (!title.toLowerCase().includes(keyword.toLowerCase().slice(0, keyword.length > 42 ? 32 : keyword.length))) {
    throw new Error('Priority title misses search intent: ' + pathname + ' → ' + keyword);
  }
  if (!h1.toLowerCase().includes(keyword.toLowerCase().slice(0, keyword.length > 42 ? 32 : keyword.length))) {
    throw new Error('Priority H1 misses search intent: ' + pathname + ' → ' + keyword);
  }
  for (const href of internalHrefs) {
    if (!html.includes('href="' + href + '"')) throw new Error('Missing topic-cluster link: ' + pathname + ' → ' + href);
  }
}
const snippet = await readFile(join(process.cwd(), 'dist', 'serp-snippet-preview/index.html'), 'utf8');
for (const id of ['preview-desktop', 'preview-mobile', 'serp-preview', 'sample-button']) {
  if (!snippet.includes('id="' + id + '"')) throw new Error('SERP preview control missing: ' + id);
}
const readability = await readFile(join(process.cwd(), 'dist', 'readability-checker/index.html'), 'utf8');
if (!readability.toLowerCase().includes('flesch-kincaid grade level') || !readability.includes('What does my Flesch Reading Ease score mean?')) {
  throw new Error('Readability search-intent explanations missing');
}
console.log('SEO intent audit passed: 9 priority pages, contextual clusters and SERP preview controls');
