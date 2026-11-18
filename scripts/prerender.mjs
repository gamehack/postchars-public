import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const pages = [
  ['index.html', 'home'],
  ['character-counter/index.html', 'characterCounter'],
  ['word-counter/index.html', 'wordCounter'],
  ['twitter-character-counter/index.html', 'twitterCharacterCounter'],
  ['google-ads-character-counter/index.html', 'googleAdsCounter'],
  ['instagram-caption-counter/index.html', 'instagramCaptionCounter'],
  ['linkedin-character-counter/index.html', 'linkedinCharacterCounter'],
  ['text-case-converter/index.html', 'textCaseConverter'],
  ['remove-line-breaks/index.html', 'removeLineBreaks']
];

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error'
});

try {
  const { App } = await vite.ssrLoadModule('/src/main.tsx');
  if (typeof App !== 'function') throw new Error('App component missing from src/main.tsx');
  for (const [path, page] of pages) {
    const filename = join(process.cwd(), 'dist', path);
    const html = await readFile(filename, 'utf8');
    const rootMatch = /<div id="root">[\s\S]*?<\/div>/;
    if (!rootMatch.test(html)) throw new Error('Expected #root in ' + path);

    const rendered = renderToString(createElement(App, { page }));
    if (!/<h1[\s>]/.test(rendered) || !rendered.includes('Frequently asked questions')) {
      throw new Error('Incomplete server markup for ' + path);
    }
    const result = html.replace(rootMatch, '<div id="root" data-prerendered="true">' + rendered + '</div>');
    await writeFile(filename, result);
    console.log('Prerendered ' + path + ' (' + rendered.length + ' HTML characters)');
  }
} finally {
  await vite.close();
}
