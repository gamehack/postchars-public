import { describe, expect, it } from 'vitest';
import { googleAdsLength, getGoogleAdsFieldStatus, createGoogleAdsExport, validateResponsiveSearchAd } from '../src/google-ads-utils';
import { getXBreakdown } from '../src/x-utils';

describe('Google Ads Responsive Search Ad counter', () => {
  it('counts ASCII spaces and punctuation', () => {
    expect(googleAdsLength('Hello world!')).toBe(12);
  });
  it('counts CJK double width characters as two', () => {
    expect(googleAdsLength('中文')).toBe(4);
    expect(googleAdsLength('A中文B')).toBe(6);
  });
  it('counts Japanese kana and Korean Hangul as double width', () => {
    expect(googleAdsLength('かな')).toBe(4);
    expect(googleAdsLength('한국')).toBe(4);
  });
  it('flags 30 headline character boundary', () => {
    expect(getGoogleAdsFieldStatus('a'.repeat(30), 30)).toBe('ok');
    expect(getGoogleAdsFieldStatus('a'.repeat(31), 30)).toBe('over');
  });
  it('flags 90 description and 15 path character boundaries', () => {
    expect(getGoogleAdsFieldStatus('a'.repeat(90), 90)).toBe('ok');
    expect(getGoogleAdsFieldStatus('a'.repeat(91), 90)).toBe('over');
    expect(getGoogleAdsFieldStatus('a'.repeat(16), 15)).toBe('over');
  });
  it('formats copy export while preserving original user text', () => {
    const result = createGoogleAdsExport(['One', '', 'Two'], ['Description'], ['path']);
    expect(result).toContain('1. One');
    expect(result).toContain('2. Two');
    expect(result).toContain('Description');
    expect(result).toContain('path');
  });
});

describe('X draft analysis', () => {
  it('recognizes a URL and uses 23 weight', () => {
    const result = getXBreakdown('https://example.com');
    expect(result.links).toBe(1);
    expect(result.weighted).toBe(23);
    expect(result.remaining).toBe(257);
  });
  it('recognizes a typical emoji cluster', () => {
    const result = getXBreakdown('😀');
    expect(result.visibleCharacters).toBe(1);
    expect(result.emoji).toBe(1);
    expect(result.weighted).toBe(2);
  });
  it('reports 280 and 281 weighted boundaries', () => {
    expect(getXBreakdown('a'.repeat(280)).remaining).toBe(0);
    expect(getXBreakdown('a'.repeat(281)).remaining).toBe(-1);
  });
});

describe('Responsive search ad readiness',()=>{
 it('does not call an incomplete ad ready',()=>{
  expect(validateResponsiveSearchAd(['Headline'],['Description'],[''])).toMatchObject({ready:false,missingHeadlines:2,missingDescriptions:1});
 });
 it('flags ready only with 3 valid headlines and 2 descriptions',()=>{
  expect(validateResponsiveSearchAd(['a','b','c'],['hello','world'],[''])).toMatchObject({ready:true,overLimit:0});
 });
});
