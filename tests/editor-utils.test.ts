import { describe, it, expect } from 'vitest';
import { compareTextLines, compareTextWords, findAndReplace, analyzeReadability, estimateEnglishSyllables } from '../src/editor-utils';

describe('local line-diff algorithm', () => {
  it('reports additions and removals across modified lines', () => {
    const result = compareTextLines('one\ntwo\nthree', 'one\nTWO\nthree\nfour');
    expect(result).toMatchObject({ added: 2, removed: 1, unchanged: 2 });
    expect(result.lines.some((line) => line.kind === 'added' && line.value === 'four')).toBe(true);
  });
  it('handles identical and empty inputs', () => {
    expect(compareTextLines('', '')).toMatchObject({ added: 0, removed: 0, unchanged: 0, lines: [] });
    expect(compareTextLines('same', 'same')).toMatchObject({ added: 0, removed: 0, unchanged: 1 });
  });
  it('handles insertions before and after a common block', () => {
    expect(compareTextLines('b\nc', 'a\nb\nc\nd')).toMatchObject({ added: 2, removed: 0, unchanged: 2 });
  });
  it('compares CRLF with LF consistently', () => {
    expect(compareTextLines('a\r\nb', 'a\nb')).toMatchObject({ added: 0, removed: 0, unchanged: 2 });
  });
  it('can ignore case or whitespace without changing source strings', () => {
    expect(compareTextLines('  Hello  world ', 'hello world', { ignoreCase: true, ignoreWhitespace: true })).toMatchObject({ added: 0, removed: 0, unchanged: 1 });
    expect(compareTextLines('Hello', 'hello')).toMatchObject({ added: 1, removed: 1 });
  });
  it('rejects huge comparisons before allocating an LCS table', () => {
    expect(() => compareTextLines('x\n'.repeat(1001), 'x')).toThrow(RangeError);
    expect(() => compareTextLines('x'.repeat(100001), 'x')).toThrow(RangeError);
  });
});

describe('word-level diff', () => {
 it('highlights a single changed word without replacing whole line', () => {
   const result=compareTextWords('Today is Monday','Today is Tuesday');
   expect(result).toMatchObject({added:1,removed:1,unchanged:2});
   expect(result.lines.some(item=>item.kind==='added'&&item.value==='Tuesday')).toBe(true);
 });
 it('can ignore case and rejects excess tokens', () => {
   expect(compareTextWords('HELLO world','hello world',{ignoreCase:true})).toMatchObject({added:0,removed:0,unchanged:2});
   expect(()=>compareTextWords('x '.repeat(501),'y')).toThrow(RangeError);
 });
});

describe('literal find and replace', () => {
  it('replaces first occurrence only when selected', () => {
    expect(findAndReplace('cat cat cat', 'cat', 'dog', 'first')).toEqual({ output: 'dog cat cat', matches: 3, replaced: 1 });
  });
  it('replaces all occurrences by default case insensitive', () => {
    expect(findAndReplace('Cat CAT cat', 'cat', 'dog', 'all')).toMatchObject({ output: 'dog dog dog', matches: 3, replaced: 3 });
  });
  it('preserves case sensitivity and word boundaries', () => {
    expect(findAndReplace('Cat cat concatenate cat_1 cat', 'cat', 'dog', 'all', { wholeWords: true, caseSensitive: true })).toMatchObject({ output: 'Cat dog concatenate cat_1 dog', matches: 2 });
  });
  it('handles literal regex syntax and replacement dollars safely', () => {
    expect(findAndReplace('a.b aXb a.b', 'a.b', '$&', 'all')).toEqual({ output: '$& aXb $&', matches: 2, replaced: 2 });
    expect(findAndReplace('a[b] a[b]', 'a[b]', '*', 'all')).toMatchObject({ output: '* *', matches: 2 });
  });
  it('supports deletion, no matches and empty find', () => {
    expect(findAndReplace('red blue red', 'red', '', 'all')).toMatchObject({ output: ' blue ', replaced: 2 });
    expect(findAndReplace('red', 'blue', 'x', 'all')).toMatchObject({ output: 'red', matches: 0 });
    expect(findAndReplace('red', '', 'x', 'all')).toMatchObject({ output: 'red', matches: 0 });
  });
  it('respects Unicode word boundaries', () => {
    expect(findAndReplace('中文 中 中文字', '中文', '替代', 'all', { wholeWords: true })).toMatchObject({ output: '替代 中 中文字', replaced: 1 });
  });
});

describe('English readability estimation', () => {
  it('reports an empty or non-English sample without fabricated scores', () => {
    expect(analyzeReadability('')).toMatchObject({ words: 0, sentences: 0, readingEase: null, gradeLevel: null });
    expect(analyzeReadability('中文测试。')).toMatchObject({ words: 0, readingEase: null });
  });
  it('uses the documented Flesch formulas', () => {
    const r = analyzeReadability('The cat sat. The dog ran.');
    expect(r).toMatchObject({ words: 6, sentences: 2, syllables: 6, averageWordsPerSentence: 3, isShortSample: true });
    expect(r.readingEase).toBeCloseTo(206.835 - 1.015 * 3 - 84.6, 4);
    expect(r.gradeLevel).toBeCloseTo(.39 * 3 + 11.8 - 15.59, 4);
  });
  it('counts syllable exceptions, long sentences and unstable samples', () => {
    expect(estimateEnglishSyllables('beautiful')).toBe(3);
    expect(estimateEnglishSyllables('people')).toBe(2);
    expect(analyzeReadability('word '.repeat(35)).longSentences).toBe(1);
    expect(analyzeReadability('word '.repeat(35)).isShortSample).toBe(false);
  });
});
