import { describe, expect, it } from 'vitest';
import { countGraphemes, getTextStats, getXWeightedCharacters, transformText } from '../src/text-utils';

describe('X weighted character counting (twitter-text v3.1.0)', () => {
  it('counts empty text as zero', () => {
    expect(getXWeightedCharacters('')).toBe(0);
  });
  it('counts basic Latin text and spaces as one unit each', () => {
    expect(getXWeightedCharacters('Hello world')).toBe(11);
  });
  it('counts common Chinese characters as two units', () => {
    expect(getXWeightedCharacters('中文')).toBe(4);
  });
  it('counts a typical emoji as two units', () => {
    expect(getXWeightedCharacters('😀')).toBe(2);
  });
  it('counts recognized URLs as 23 units, regardless of URL length', () => {
    expect(getXWeightedCharacters('https://example.com')).toBe(23);
    expect(getXWeightedCharacters('https://example.com/a/longer/path/to/a/page')).toBe(23);
  });
  it('applies URL weighting together with normal text', () => {
    expect(getXWeightedCharacters('A https://example.com')).toBe(25);
  });
  it('correctly identifies the standard 280-character boundary', () => {
    expect(getXWeightedCharacters('a'.repeat(280))).toBe(280);
    expect(getXWeightedCharacters('a'.repeat(281))).toBe(281);
  });
});

describe('generic text utilities', () => {
  it('counts visible Unicode graphemes (not UTF-16 code units)', () => {
    expect(countGraphemes('e\u0301')).toBe(1);
    expect(countGraphemes('👩‍💻')).toBe(1);
  });
  it('separates character and character-without-whitespace counts', () => {
    const stats = getTextStats('A B\nC');
    expect(stats.characters).toBe(5);
    expect(stats.charactersNoSpaces).toBe(3);
    expect(stats.words).toBe(3);
  });
  it('counts paragraphs split by blank lines', () => {
    expect(getTextStats('One paragraph.\n\nAnother paragraph.').paragraphs).toBe(2);
  });
  it('converts case and removes line breaks in-browser', () => {
    expect(transformText('Hello WORLD', 'lowercase')).toBe('hello world');
    expect(transformText('Hello WORLD', 'uppercase')).toBe('HELLO WORLD');
    expect(transformText('Hello\nworld', 'remove-line-breaks')).toBe('Hello world');
  });
});
