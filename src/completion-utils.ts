/** Pure offline text utility functions for the PostChars toolkit. */
export const PLATFORM_FIELDS = {
  instagramBio: { label: 'Instagram Bio', limit: 150, source: 'https://ai.meta.com/learn/ai-career/how-to-create-an-instagram-bio-with-ai/', note: '150-character public profile bio reference. Final validation happens in Instagram.' },
  youtubeDescription: { label: 'YouTube Description', limit: 5000, source: 'https://support.google.com/youtube/answer/57407', note: 'YouTube Help documents a 5,000-character video description limit.' },
  linkedinHeadline: { label: 'LinkedIn Headline', limit: 220, source: 'https://www.linkedin.com/help/linkedin/answer/a542926', note: '220 is a commonly used reference, not confirmed by the cited LinkedIn Help page; validate your actual profile editor.' }
} as const;
export type PlatformField = keyof typeof PLATFORM_FIELDS;
export function unicodeStats(input: string) {
  const chars = Array.from(input);
  const graphemes = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(input)].length : chars.length;
  const invisible = chars.flatMap((char, index) => {
    const code = char.codePointAt(0)!;
    if ([0x200b,0x200c,0x200d,0x2060,0xfeff,0x00ad,0x200e,0x200f].includes(code) || (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069)) {
      return [{ offset: index, codepoint: 'U+' + code.toString(16).toUpperCase().padStart(4, '0'), character: char }];
    }
    return [];
  });
  return { codepoints: chars.length, graphemes, utf16: input.length, bytes: new TextEncoder().encode(input).length, invisibles: invisible };
}
/** Native Unicode normalization and scoped Latin/Greek/Cyrillic mixed-script checks. */
export function inspectUnicodeNormalization(input: string) {
  const nfc = input.normalize('NFC');
  const nfd = input.normalize('NFD');
  const scriptOf = (character: string): 'Latin' | 'Greek' | 'Cyrillic' | null =>
    /\p{Script=Latin}/u.test(character) ? 'Latin' :
    /\p{Script=Greek}/u.test(character) ? 'Greek' :
    /\p{Script=Cyrillic}/u.test(character) ? 'Cyrillic' : null;
  // Only flag a single word mixing Latin, Greek and/or Cyrillic; mixed languages
  // elsewhere in the text are common and do not constitute a security finding.
  const suspicious: { token: string; scripts: string }[] = [];
  for (const match of input.matchAll(/[\p{L}\p{M}]+/gu)) {
    const scripts = new Set(Array.from(match[0]).map(scriptOf).filter((s): s is 'Latin' | 'Greek' | 'Cyrillic' => s !== null));
    if (scripts.size >= 2) suspicious.push({ token: match[0], scripts: [...scripts].sort().join(' + ') });
  }
  return {
    nfcEqual: nfc === input,
    nfdEqual: nfd === input,
    nfc,
    nfd,
    mixedScriptCount: suspicious.length,
    mixedScriptExamples: suspicious.slice(0, 8)
  };
}

export interface ListOptions { order: 'asc' | 'desc' | 'shuffle' | 'keep'; unique: boolean; trim: boolean; caseSensitive: boolean; removeEmpty: boolean; }
export function processList(text: string, options: ListOptions): { output: string; inputLines: number; outputLines: number; removed: number } {
  const source = text ? text.split(/\r\n|\n|\r/) : [];
  let lines = options.trim ? source.map(line => line.trim()) : [...source];
  if (options.removeEmpty) lines = lines.filter(line => !!line.trim());
  if (options.unique) {
    const seen = new Set<string>();
    lines = lines.filter(line => {
      const key = options.caseSensitive ? line : line.toLocaleLowerCase('en');
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  if (options.order === 'asc' || options.order === 'desc') {
    const factor = options.order === 'asc' ? 1 : -1;
    lines = lines.map((v,i) => ({v,i})).sort((a,b) => factor * a.v.localeCompare(b.v, 'en', { sensitivity: options.caseSensitive ? 'variant' : 'base', numeric: true }) || a.i - b.i).map(item => item.v);
  }
  if (options.order === 'shuffle') {
    lines = [...lines];
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
  }
  return { output: lines.join('\n'), inputLines: source.length, outputLines: lines.length, removed: source.length - lines.length };
}
export type CleanupAction = 'remove-empty-lines' | 'collapse-blank-lines' | 'tabs-to-spaces' | 'strip-html' | 'clean-spaces';
export function cleanupText(input: string, action: CleanupAction): string {
  switch (action) {
    case 'remove-empty-lines': return input.split(/\r\n|\n|\r/).filter(s => s.trim()).join('\n');
    case 'collapse-blank-lines': return input.replace(/\r\n?|\n/g, '\n').replace(/(?:\n[ \t]*){3,}/g, '\n\n');
    case 'tabs-to-spaces': return input.replace(/\t/g, '    ');
    case 'clean-spaces': return input.replace(/[ \t]{2,}/g,' ').replace(/[ \t]+\n/g,'\n');
    case 'strip-html': return input
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
      .replace(/<\/?(?:p|div|br|li|h[1-6]|tr)\b[^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);/g, entity => ({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"}[entity]||entity))
      .replace(/\n{3,}/g,'\n\n').trim();
  }
}
export function detailedStats(input: string) {
 const words = input.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)||[];
 const lines = input ? input.split(/\r\n|\n|\r/) : [];
 const letters = (input.match(/\p{L}/gu)||[]).length;
 const digits = (input.match(/\p{N}/gu)||[]).length;
 const characters = Array.from(input).length;
 const spaces = (input.match(/[ \t]/g)||[]).length;
 return {
  words: words.length, uniqueWords: new Set(words.map(w=>w.toLocaleLowerCase('en'))).size,
  lines: lines.length, blankLines: lines.filter(l=>!l.trim()).length,
  letters, digits, spaces, symbols: Math.max(0,characters-letters-digits-spaces-(input.match(/[\r\n]/g)||[]).length),
  averageWordLength: words.length ? words.reduce((s,w)=>s+Array.from(w).length,0)/words.length : 0,
  speakingMinutes: words.length/130, utf8Bytes: new TextEncoder().encode(input).length
 };
}
