import { analyzeSms, analyzeDensity, analyzeTargetPhrase, densityCsv, metaTagMarkup } from './growth-utils';

const get = <T extends HTMLElement>(id: string): T => {
  const item = document.getElementById(id);
  if (!item) throw new Error('Missing tool control: ' + id);
  return item as T;
};
const show = (id: string, value: string) => { get<HTMLElement>(id).textContent = value; };
const copy = async (value: string) => {
  try { await navigator.clipboard.writeText(value); show('copy-status', 'Copied to clipboard.'); }
  catch { show('copy-status', 'Copy unavailable. Select the text to copy it manually.'); }
};
const tool = document.body.dataset.growthTool;

if (tool === 'sms') {
  const input = get<HTMLTextAreaElement>('tool-text');
  const update = () => {
    const result = analyzeSms(input.value);
    show('sms-encoding', result.encoding);
    show('sms-units', String(result.units));
    show('sms-segments', String(result.segments));
    show('sms-remaining', String(result.remaining));
    show('sms-details', result.encoding === 'GSM-7'
      ? 'Standard GSM-7: 160 septets for one segment, 153 septets per segment when concatenated. Extended characters use two septets.'
      : 'Unicode mode: 70 UTF-16 units for one segment, 67 units per segment when concatenated. Emoji may occupy two units.');
    show('sms-warning', result.nonGsm.length
      ? 'Characters requiring Unicode mode: ' + result.nonGsm.join(' ') + '. Curly quotes, emoji or CJK can increase the segment count.'
      : 'All entered characters are compatible with GSM-7, including the extension table where applicable.');
  };
  input.addEventListener('input', update);
  get<HTMLButtonElement>('sample-button').addEventListener('click', () => { input.value = 'Hello! Your package is ready for pickup. Reply YES to confirm.'; update(); });
  get<HTMLButtonElement>('copy-button').addEventListener('click', () => void copy(input.value));
  input.addEventListener('change', update);
  update();
}
if (tool === 'seo') {
  const title = get<HTMLInputElement>('seo-title');
  const description = get<HTMLTextAreaElement>('seo-description');
  const url = get<HTMLInputElement>('seo-url');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const preview = get<HTMLElement>('serp-preview');
  const desktop = get<HTMLButtonElement>('preview-desktop');
  const mobile = get<HTMLButtonElement>('preview-mobile');
  const setPreview = (mode: 'desktop' | 'mobile') => {
    const mobileMode = mode === 'mobile';
    preview.classList.toggle('growth-serp-mobile', mobileMode);
    preview.setAttribute('aria-label', 'Approximate ' + mode + ' search snippet preview');
    desktop.setAttribute('aria-pressed', String(!mobileMode));
    mobile.setAttribute('aria-pressed', String(mobileMode));
  };
  desktop.addEventListener('click', () => setPreview('desktop'));
  mobile.addEventListener('click', () => setPreview('mobile'));
  const update = () => {
    const t = title.value.trim();
    const d = description.value.trim();
    const raw = url.value.trim() || 'https://example.com/';
    let displayUrl = 'https://example.com/';
    try { const parsed = new URL(raw); if (parsed.protocol === 'http:' || parsed.protocol === 'https:') displayUrl = parsed.host + parsed.pathname; }
    catch { /* Use the default safe preview URL. */ }
    show('title-count', String(Array.from(t).length));
    show('description-count', String(Array.from(d).length));
    show('preview-title', t || 'Your page title appears here');
    show('preview-description', d || 'Describe the page clearly in a way that helps searchers decide whether to visit.');
    show('preview-url', displayUrl);
    if (ctx) ctx.font = '20px Arial, sans-serif';
    const approximatePixels = ctx ? Math.round(ctx.measureText(t).width) : 0;
    show('title-width', String(approximatePixels) + ' estimated px');
    show('title-hint', !t ? 'Enter a distinctive title.'
      : approximatePixels > 580 ? 'Long title: may be truncated on some devices. Google may also rewrite it.'
      : 'Length looks workable in this approximate desktop preview, not a ranking guarantee.');
    show('description-hint', !d ? 'Add a unique description of this page.'
      : 'Google has no fixed meta description character limit. It may generate a different snippet from the page text.');
    get<HTMLTextAreaElement>('seo-html').value = metaTagMarkup(t, d);
  };
  [title, description, url].forEach((element) => element.addEventListener('input', update));
  get<HTMLButtonElement>('copy-button').addEventListener('click', () => void copy(get<HTMLTextAreaElement>('seo-html').value));
  get<HTMLButtonElement>('sample-button').addEventListener('click', () => {
    title.value = 'Free Character Counter – Count Text Online';
    description.value = 'Count characters with and without spaces, words and sentences as you type. Free and private, with no account required.';
    url.value = 'https://postchars.com/character-counter/';
    update();
  });
  update();
}
if (tool === 'density') {
  const input = get<HTMLTextAreaElement>('tool-text');
  const size = get<HTMLSelectElement>('density-size');
  const common = get<HTMLInputElement>('density-common');
  const body = get<HTMLTableSectionElement>('density-body');
  const target = get<HTMLInputElement>('target-keyword');
  const revised = get<HTMLTextAreaElement>('compare-draft');
  let visibleRows: ReturnType<typeof analyzeDensity>['rows'] = [];
  const update = () => {
    const ngram = Number(size.value) as 1 | 2 | 3;
    const result = analyzeDensity(input.value, ngram, common.checked);
    show('density-words', String(result.words));
    show('density-unique', String(result.uniqueWords));
    show('density-phrases', String(result.rows.length));
    visibleRows = result.rows;
    try {
      const phrase = analyzeTargetPhrase(input.value, target.value);
      if (!phrase.phrase) {
        show('target-count', '—'); show('target-density', '—'); show('target-compare', '—');
        show('target-status', 'Enter a target keyword or phrase to compare its exact frequency.');
      } else {
        show('target-count', String(phrase.count));
        show('target-density', phrase.density.toFixed(2) + '%');
        if (revised.value.trim()) {
          const second = analyzeTargetPhrase(revised.value, target.value);
          show('target-compare', String(second.count) + ' occurrences / ' + second.density.toFixed(2) + '%');
          show('target-status', 'Original: ' + phrase.count + ' / ' + phrase.words + ' words; revised: ' + second.count + ' / ' + second.words + ' words. Density changes describe frequency only.');
        } else {
          show('target-compare', 'Add revised draft');
          show('target-status', 'Exact consecutive phrase matches only; case-insensitive, using word tokenization. No ranking target is implied.');
        }
      }
    } catch (error) {
      show('target-count', '—'); show('target-density', '—'); show('target-compare', '—');
      show('target-status', error instanceof Error ? error.message : 'Unable to analyze target phrase.');
    }
    body.replaceChildren();
    for (const row of result.rows) {
      const tr = document.createElement('tr');
      for (const value of [row.phrase, String(row.count), row.percent.toFixed(2) + '%']) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    if (!result.rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.colSpan = 3;
      td.textContent = 'Paste text to see the most repeated terms and phrases.';
      tr.appendChild(td); body.appendChild(tr);
    }
  };
  [input, size, common, target, revised].forEach((element) => element.addEventListener('input', update));
  get<HTMLButtonElement>('sample-button').addEventListener('click', () => {
    input.value = 'A good landing page answers a search question. This landing page uses clear wording. A landing page should help readers, not repeat a keyword endlessly.';
    update();
  });
  get<HTMLButtonElement>('copy-button').addEventListener('click', () => void copy(input.value));
  get<HTMLButtonElement>('export-csv').addEventListener('click', () => {
    if (!visibleRows.length) { show('copy-status', 'No frequency rows to export.'); return; }
    const blob = new Blob(['\uFEFF', densityCsv(visibleRows)], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href; anchor.download = 'postchars-word-density.csv'; anchor.hidden = true;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    URL.revokeObjectURL(href);
    show('copy-status', 'Exported the visible frequency rows. No text was uploaded.');
  });
  update();
}
