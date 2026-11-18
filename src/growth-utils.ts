/** Browser-only SMS and keyword calculations; no external API calls. */
const GSM_BASIC = new Set(Array.from("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"));
const GSM_EXTENDED = new Set(Array.from("\f^{}\\[~]|€"));

export interface SmsResult {
  encoding: 'GSM-7' | 'UCS-2';
  units: number;
  segments: number;
  remaining: number;
  singleLimit: number;
  multiLimit: number;
  nonGsm: string[];
}

export function analyzeSms(text: string): SmsResult {
  const characters = Array.from(text);
  const nonGsm = Array.from(new Set(characters.filter((char) => !GSM_BASIC.has(char) && !GSM_EXTENDED.has(char)))).slice(0, 8);
  const gsm = nonGsm.length === 0;
  const unitsPerChar = characters.map((char) => gsm
    ? (GSM_EXTENDED.has(char) ? 2 : 1)
    : char.length); // JS UTF-16 units: astral emoji use 2, like SMS Unicode payloads.
  const units = unitsPerChar.reduce((a, b) => a + b, 0);
  const singleLimit = gsm ? 160 : 70;
  const multiLimit = gsm ? 153 : 67;
  if (!units) return { encoding: gsm ? 'GSM-7' : 'UCS-2', units: 0, segments: 0, remaining: singleLimit, singleLimit, multiLimit, nonGsm };
  if (units <= singleLimit) return { encoding: gsm ? 'GSM-7' : 'UCS-2', units, segments: 1, remaining: singleLimit - units, singleLimit, multiLimit, nonGsm };
  let segments = 1;
  let inSegment = 0;
  for (const size of unitsPerChar) {
    if (inSegment + size > multiLimit) {
      segments++;
      inSegment = 0;
    }
    inSegment += size;
  }
  return { encoding: gsm ? 'GSM-7' : 'UCS-2', units, segments, remaining: multiLimit - inSegment, singleLimit, multiLimit, nonGsm };
}

export interface DensityRow {
  phrase: string;
  count: number;
  percent: number;
}
export interface DensityResult {
  words: number;
  uniqueWords: number;
  rows: DensityRow[];
}
const STOP_WORDS = new Set('a an and are as at be been but by can could did do does for from had has have he her hers him his how i if in into is it its may me my not of on or our out she should so than that the their them there these they this those to too us was we were what when where which who why will with would you your'.split(' '));
export function analyzeDensity(text: string, ngram: 1 | 2 | 3, omitCommon = true): DensityResult {
  const tokens = (text.toLocaleLowerCase('en').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []);
  const counts = new Map<string, number>();
  for (let i = 0; i <= tokens.length - ngram; i++) {
    const group = tokens.slice(i, i + ngram);
    if (omitCommon && group.every((word) => STOP_WORDS.has(word))) continue;
    const key = group.join(' ');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const rows = [...counts.entries()]
    .map(([phrase, count]) => ({ phrase, count, percent: tokens.length ? (count * 100 / tokens.length) : 0 }))
    .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase))
    .slice(0, 20);
  return { words: tokens.length, uniqueWords: new Set(tokens).size, rows };
}

/** Exact, consecutive phrase frequency in English-like space-delimited text. */
export function analyzeTargetPhrase(text: string, query: string): { phrase: string; count: number; words: number; density: number } {
  const tokenize = (value: string): string[] =>
    value.toLocaleLowerCase('en').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
  const source = tokenize(text);
  const target = tokenize(query);
  if (!target.length) return { phrase: '', count: 0, words: source.length, density: 0 };
  if (target.length > 12) throw new RangeError('Enter a target keyword or phrase of up to 12 words.');
  let count = 0;
  for (let index = 0; index <= source.length - target.length; index++) {
    if (target.every((word, offset) => word === source[index + offset])) count++;
  }
  return { phrase: target.join(' '), count, words: source.length, density: source.length ? count * 100 / source.length : 0 };
}

/** Safe CSV export for only the visible frequency rows; never uploads the draft. */
export function densityCsv(rows: DensityRow[]): string {
  const cell = (value: string): string => {
    // Neutralize spreadsheet formula injection, including leading Unicode whitespace.
    const escaped = /^[\s\uFEFF]*[=+\-@]/u.test(value) ? "'" + value : value;
    return '"' + escaped.replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';
  };
  const header = 'Term or phrase,Occurrences,Density estimate (%)';
  return [header, ...rows.map((row) =>
    [cell(row.phrase), String(row.count), row.percent.toFixed(2)].join(',')
  )].join('\r\n') + '\r\n';
}

export function metaTagMarkup(title: string, description: string): string {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '<title>' + escape(title) + '</title>\n<meta name="description" content="' + escape(description) + '">';
}
