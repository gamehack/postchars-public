import { describe, it, expect } from 'vitest';
import { analyzeTargetPhrase, densityCsv } from '../src/growth-utils';
import { compareTextCharacters } from '../src/editor-utils';
import { inspectUnicodeNormalization } from '../src/completion-utils';

describe('exact target phrase statistics', () => {
  it('matches case-insensitive adjacent words without partial matching', () => {
    const result = analyzeTargetPhrase('Landing page. A landing page is not a landing-page?', 'landing page');
    expect(result).toMatchObject({ phrase: 'landing page', count: 2 });
    expect(result.words).toBeGreaterThan(3);
    expect(result.density).toBeCloseTo(result.count * 100 / result.words);
  });
  it('does not count partial tokens, handles empty targets, and caps phrases', () => {
    expect(analyzeTargetPhrase('landings and landing', 'land').count).toBe(0);
    expect(analyzeTargetPhrase('one two three', '  ')).toMatchObject({ count: 0, words: 3, density: 0 });
    expect(() => analyzeTargetPhrase('hello', 'word '.repeat(13))).toThrow(RangeError);
  });
  it('safely exports only the selected rows as CSV', () => {
    const csv = densityCsv([{ phrase: '=HYPERLINK("evil")', count: 2, percent: 12.345 }]);
    expect(csv).toContain('"\'=HYPERLINK(""evil"")"');
    expect(csv).toContain('2,12.35');
    expect(csv).toMatch(/\r\n$/);
  });
});

describe('browser-only grapheme diff', () => {
  it('does not split combined emoji or surrogate pairs', () => {
    expect(compareTextCharacters('A👩‍💻B', 'A👩‍🚀B')).toMatchObject({ added: 1, removed: 1, unchanged: 2 });
  });
  it('recognizes changed punctuation and case-insensitive matching', () => {
    expect(compareTextCharacters('Hello!', 'Hello?')).toMatchObject({ added: 1, removed: 1, unchanged: 5 });
    expect(compareTextCharacters('ABC', 'abc', { ignoreCase: true })).toMatchObject({ added: 0, removed: 0, unchanged: 3 });
  });
  it('caps the dynamic-programming workload in a browser tab', () => {
    expect(() => compareTextCharacters('x'.repeat(1201), 'y')).toThrow(RangeError);
  });
});

describe('Unicode normalization and mixed-script review', () => {
  it('distinguishes canonical composed and decomposed text', () => {
    const decomposed = inspectUnicodeNormalization('cafe\u0301');
    expect(decomposed).toMatchObject({ nfcEqual: false, nfdEqual: true, nfc: 'café' });
    expect(inspectUnicodeNormalization('café')).toMatchObject({ nfcEqual: true, nfdEqual: false });
  });
  it('flags a single mixed Latin-Cyrillic word, not ordinary multilingual writing', () => {
    const spoof = inspectUnicodeNormalization('p\u0430ypal');
    expect(spoof.mixedScriptCount).toBe(1);
    expect(spoof.mixedScriptExamples[0].scripts).toContain('Cyrillic');
    expect(inspectUnicodeNormalization('Hello Привет')).toMatchObject({ mixedScriptCount: 0 });
  });
});
