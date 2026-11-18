import { describe, expect, it } from 'vitest';
import { analyzeSms, analyzeDensity, metaTagMarkup } from '../src/growth-utils';

describe('SMS encoding and multipart segmentation', () => {
  it('keeps 160 GSM-7 septets in one segment', () => {
    expect(analyzeSms('A'.repeat(160))).toMatchObject({ encoding: 'GSM-7', units: 160, segments: 1, remaining: 0 });
  });
  it('splits a 161-septet GSM message into two segments', () => {
    expect(analyzeSms('A'.repeat(161))).toMatchObject({ encoding: 'GSM-7', units: 161, segments: 2, remaining: 145 });
  });
  it('splits GSM-7 messages at 153 septets when concatenated', () => {
    expect(analyzeSms('A'.repeat(306))).toMatchObject({ segments: 2, remaining: 0 });
    expect(analyzeSms('A'.repeat(307))).toMatchObject({ segments: 3, remaining: 152 });
  });
  it('counts GSM extension characters as two septets without forcing Unicode', () => {
    expect(analyzeSms('^'.repeat(80))).toMatchObject({ encoding: 'GSM-7', units: 160, segments: 1 });
    expect(analyzeSms('€'.repeat(81))).toMatchObject({ encoding: 'GSM-7', units: 162, segments: 2 });
  });
  it('uses 70/67 Unicode units and counts surrogate pairs correctly', () => {
    expect(analyzeSms('中'.repeat(70))).toMatchObject({ encoding: 'UCS-2', units: 70, segments: 1, remaining: 0 });
    expect(analyzeSms('中'.repeat(71))).toMatchObject({ encoding: 'UCS-2', units: 71, segments: 2, remaining: 63 });
    expect(analyzeSms('😀'.repeat(35))).toMatchObject({ encoding: 'UCS-2', units: 70, segments: 1 });
    expect(analyzeSms('😀'.repeat(36))).toMatchObject({ encoding: 'UCS-2', units: 72, segments: 2 });
  });
  it('detects smart quotation marks as non-GSM', () => {
    expect(analyzeSms('Hello “world”')).toMatchObject({ encoding: 'UCS-2', segments: 1 });
  });
  it('handles empty text without a billed segment', () => {
    expect(analyzeSms('')).toMatchObject({ encoding: 'GSM-7', units: 0, segments: 0, remaining: 160 });
  });
  it('never splits a 2-septet extension character in the middle', () => {
    const r = analyzeSms('A'.repeat(153) + '^'.repeat(4));
    expect(r).toMatchObject({ encoding: 'GSM-7', units: 161, segments: 2, remaining: 145 });
  });
});

describe('Keyword frequency tools', () => {
  it('counts repetitions with a word denominator', () => {
    expect(analyzeDensity('hello hello world', 1).rows[0]).toEqual({ phrase: 'hello', count: 2, percent: 200 / 3 });
  });
  it('finds repeated two-word phrases', () => {
    expect(analyzeDensity('landing page and landing page', 2).rows[0]).toMatchObject({ phrase: 'landing page', count: 2 });
  });
  it('filters all-common-word phrases but not the denominator', () => {
    const r = analyzeDensity('the and the brand and', 1);
    expect(r.words).toBe(5);
    expect(r.rows.map((v) => v.phrase)).toEqual(['brand']);
  });
  it('handles Unicode words and empty input', () => {
    expect(analyzeDensity('中文 测试 中文', 1).rows[0]).toMatchObject({ phrase: '中文', count: 2 });
    expect(analyzeDensity('', 3)).toMatchObject({ words: 0, uniqueWords: 0, rows: [] });
  });
});

describe('Safe meta tag markup', () => {
  it('escapes user-provided text in generated markup', () => {
    expect(metaTagMarkup('<test> & "ok"', '"desc" & extra')).toContain('&lt;test&gt; &amp; &quot;ok&quot;');
    expect(metaTagMarkup('<test>', '"desc"')).toContain('content="&quot;desc&quot;"');
  });
});
