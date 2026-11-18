/** Deterministic, browser-only editing helpers; never transmit entered text. */
export type DiffKind = 'equal' | 'removed' | 'added';
export interface DiffLine { kind: DiffKind; value: string; }
export interface DiffOptions { ignoreCase?: boolean; ignoreWhitespace?: boolean; }
export interface DiffResult { lines: DiffLine[]; added: number; removed: number; unchanged: number; }

export function compareTextLines(original: string, revised: string, options: DiffOptions = {}): DiffResult {
  if (original.length > 100_000 || revised.length > 100_000) {
    throw new RangeError('Each input is limited to 100,000 characters for safe browser-side comparison.');
  }
  const left = original ? original.replace(/\r\n?/g, '\n').split('\n') : [];
  const right = revised ? revised.replace(/\r\n?/g, '\n').split('\n') : [];
  if (left.length > 1000 || right.length > 1000) {
    throw new RangeError('This comparison supports up to 1,000 lines on each side.');
  }
  const normalize = (line: string) => {
    let result = options.ignoreWhitespace ? line.replace(/\s+/g, ' ').trim() : line;
    if (options.ignoreCase) result = result.toLocaleLowerCase('en');
    return result;
  };
  const a = left.map(normalize), b = right.map(normalize);
  const dp: Uint16Array[] = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const lines: DiffLine[] = [];
  let added = 0, removed = 0, unchanged = 0, i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ kind: 'equal', value: right[j] }); i++; j++; unchanged++;
    } else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) {
      lines.push({ kind: 'added', value: right[j++] }); added++;
    } else {
      lines.push({ kind: 'removed', value: left[i++] }); removed++;
    }
  }
  return { lines, added, removed, unchanged };
}

/** A bounded word-level comparison for short drafts and revisions. */
export function compareTextWords(original: string, revised: string, options: DiffOptions = {}): DiffResult {
  const left = original.trim() ? original.match(/\S+/gu) || [] : [];
  const right = revised.trim() ? revised.match(/\S+/gu) || [] : [];
  if (left.length > 500 || right.length > 500) {
    throw new RangeError('Word-level comparison supports up to 500 words per side. Switch to line mode for larger drafts.');
  }
  const normalize = (word: string) => options.ignoreCase ? word.toLocaleLowerCase('en') : word;
  const a = left.map(normalize), b = right.map(normalize);
  const dp: Uint16Array[] = Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
    dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const lines:DiffLine[]=[];
  let added=0,removed=0,unchanged=0,i=0,j=0;
  while(i<a.length||j<b.length){
    if(i<a.length&&j<b.length&&a[i]===b[j]){lines.push({kind:'equal',value:right[j]});i++;j++;unchanged++;}
    else if(j<b.length&&(i===a.length||dp[i][j+1]>=dp[i+1][j])){lines.push({kind:'added',value:right[j++]});added++;}
    else{lines.push({kind:'removed',value:left[i++]});removed++;}
  }
  // Word mode intentionally normalizes inter-word spacing for readability.
  // Use line mode to inspect whitespace-only changes.
  return {lines,added,removed,unchanged};
}

/** Grapheme-level diff for short snippets; never split a combined emoji. */
export function compareTextCharacters(original: string, revised: string, options: DiffOptions = {}): DiffResult {
  const segment = (text: string): string[] => {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      return Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text), part => part.segment);
    }
    return Array.from(text);
  };
  const left = segment(original), right = segment(revised);
  const max = 1200;
  if (left.length > max || right.length > max) {
    throw new RangeError('Character-level comparison supports 1,200 visible characters per side. Switch to line or word mode for longer drafts.');
  }
  const normalize = (value: string) => options.ignoreCase ? value.toLocaleLowerCase('en') : value;
  const a = left.map(normalize), b = right.map(normalize);
  const dp: Uint16Array[] = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const lines: DiffLine[] = [];
  let added = 0, removed = 0, unchanged = 0, i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ kind: 'equal', value: right[j] }); i++; j++; unchanged++;
    } else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) {
      lines.push({ kind: 'added', value: right[j++] }); added++;
    } else {
      lines.push({ kind: 'removed', value: left[i++] }); removed++;
    }
  }
  return { lines, added, removed, unchanged };
}

export interface ReplaceOptions { caseSensitive?: boolean; wholeWords?: boolean; }
export interface ReplaceResult { output: string; matches: number; replaced: number; }
export function findAndReplace(text: string, query: string, replacement: string, mode: 'first' | 'all', options: ReplaceOptions = {}): ReplaceResult {
  if (!query) return { output: text, matches: 0, replaced: 0 };
  const literal = query.replace(/[.*+?^\x24{}()|[\]\\]/g, '\\$&');
  const pattern = options.wholeWords
    ? '(?<![\\p{L}\\p{N}_])' + literal + '(?![\\p{L}\\p{N}_])'
    : literal;
  const flags = options.caseSensitive ? 'gu' : 'giu';
  const regex = new RegExp(pattern, flags);
  let matches = 0;
  for (const _match of text.matchAll(regex)) matches++;
  if (!matches) return { output: text, matches: 0, replaced: 0 };
  const replaceRegex = mode === 'all' ? regex : new RegExp(pattern, flags.replace('g', ''));
  return { output: text.replace(replaceRegex, () => replacement), matches, replaced: mode === 'all' ? matches : 1 };
}

export interface ReadabilityResult {
  words: number; sentences: number; syllables: number;
  readingEase: number | null; gradeLevel: number | null;
  averageWordsPerSentence: number; longSentences: number;
  readingMinutes: number; isShortSample: boolean;
}
const SYLLABLE_EXCEPTIONS: Record<string, number> = {
  the: 1, are: 1, every: 2, hour: 1, hours: 1, queue: 1,
  people: 2, beautiful: 3, business: 2, science: 2, fire: 1,
  different: 3, interesting: 4, idea: 3, create: 2
};
export function estimateEnglishSyllables(input: string): number {
  const word = input.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (SYLLABLE_EXCEPTIONS[word]) return SYLLABLE_EXCEPTIONS[word];
  if (word.length <= 3) return 1;
  let count = (word.match(/[aeiouy]+/g) || []).length;
  if (/[aeiouy][^aeiouy]*e$/.test(word) && !/[^aeiouy]le$/.test(word)) count--;
  return Math.max(1, count);
}
export function analyzeReadability(text: string): ReadabilityResult {
  const words = text.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) || [];
  if (!words.length) return {
    words: 0, sentences: 0, syllables: 0, readingEase: null,
    gradeLevel: null, averageWordsPerSentence: 0, longSentences: 0,
    readingMinutes: 0, isShortSample: true
  };
  // Sentence boundaries are approximate: abbreviations and dotted URLs are ambiguous.
  const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const sentenceWordCounts = chunks.map((chunk) =>
    (chunk.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) || []).length
  ).filter((count) => count > 0);
  const sentences = Math.max(1, sentenceWordCounts.length);
  const syllables = words.reduce((sum, word) => sum + estimateEnglishSyllables(word), 0);
  const averageWordsPerSentence = words.length / sentences;
  const averageSyllablesPerWord = syllables / words.length;
  return {
    words: words.length, sentences, syllables,
    readingEase: 206.835 - 1.015 * averageWordsPerSentence - 84.6 * averageSyllablesPerWord,
    gradeLevel: 0.39 * averageWordsPerSentence + 11.8 * averageSyllablesPerWord - 15.59,
    averageWordsPerSentence, longSentences: sentenceWordCounts.filter((count) => count > 25).length,
    readingMinutes: words.length / 225, isShortSample: words.length < 30
  };
}
