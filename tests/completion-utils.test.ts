import { describe,it,expect } from 'vitest';
import { unicodeStats,processList,cleanupText,detailedStats,PLATFORM_FIELDS } from '../src/completion-utils';
describe('Unicode measurements and platform references',()=>{
 it('distinguishes visible graphemes, codepoints and UTF-16 units',()=>{
  const r=unicodeStats('👩‍💻');
  expect(r).toMatchObject({graphemes:1,codepoints:3,utf16:5,bytes:11});
 });
 it('recognizes monitored zero-width and bidi controls',()=>{
  const r=unicodeStats('a\u200bb\u202ec');expect(r.invisibles).toHaveLength(2);
  expect(r.invisibles[0].codepoint).toBe('U+200B');
 });
 it('does not flag ordinary visible punctuation',()=>{
  expect(unicodeStats('Hello, world!').invisibles).toHaveLength(0);
 });
 it('tracks explicitly cited social platform field limits',()=>{
  expect(PLATFORM_FIELDS.youtubeDescription.limit).toBe(5000);
  expect(PLATFORM_FIELDS.instagramBio.limit).toBe(150);
  expect(PLATFORM_FIELDS.linkedinHeadline.note).toContain('not confirmed');
 });
});
const opts={order:'asc',unique:true,trim:true,caseSensitive:false,removeEmpty:true} as const;
describe('List organization',()=>{
 it('sorts with natural numbers and removes case-insensitive duplicates',()=>{
  const r=processList('item 10\n item 2 \nItem 2\n\nitem 1',opts);
  expect(r.output).toBe('item 1\nitem 2\nitem 10');
  expect(r.removed).toBe(2);
 });
 it('retains source order if requested',()=>{
  const r=processList('pear\napple\npear',{...opts,order:'keep'});
  expect(r.output).toBe('pear\napple');
 });
 it('can retain distinct capitalization',()=>{
  const r=processList('A\na',{...opts,order:'keep',caseSensitive:true});
  expect(r.output).toBe('A\na');
 });
 it('handles empty input without phantom lines',()=>{
  expect(processList('',opts)).toMatchObject({output:'',inputLines:0,outputLines:0});
 });
});
describe('Text cleanup',()=>{
 it('removes only genuinely blank lines',()=>{
  expect(cleanupText('first\n  \nsecond','remove-empty-lines')).toBe('first\nsecond');
 });
 it('collapses excess blank rows',()=>{
  expect(cleanupText('a\n\n\n\nb','collapse-blank-lines')).toBe('a\n\nb');
 });
 it('strips simple markup without executing it',()=>{
  expect(cleanupText('<p>Hello &amp; good</p><script>alert(1)</script>','strip-html')).toBe('Hello & good');
 });
 it('keeps content when reducing spaces',()=>{
  expect(cleanupText('a   b\n c  d','clean-spaces')).toBe('a b\n c d');
 });
});
describe('Detailed text statistics',()=>{
 it('counts unique words, lines, letters, digits, and speaking estimate',()=>{
  const r=detailedStats('Hello hello\n\n123!');
  expect(r).toMatchObject({words:3,uniqueWords:2,lines:3,blankLines:1,digits:3});
  expect(r.speakingMinutes).toBeCloseTo(3/130);
 });
 it('returns meaningful empty metrics',()=>{
  expect(detailedStats('')).toMatchObject({words:0,lines:0,uniqueWords:0,utf8Bytes:0});
 });
});
