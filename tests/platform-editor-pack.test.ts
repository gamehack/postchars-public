import { describe,it,expect } from 'vitest';
import { SOCIAL_RULES,unitCount,analyzePlatformText,splitXThread } from '../src/platform-rules';
import { tokenizeIdentifier,convertIdentifier,analyzeExtraction } from '../src/text-analysis-pack';

describe('Source-scoped platform rules',()=>{
 it('uses UTF-16 units for TikTok Direct Post captions',()=>{
  expect(analyzePlatformText('😀'.repeat(1101),SOCIAL_RULES.tiktok)).toMatchObject({count:2202,remaining:-2,overLimit:true,graphemes:1101});
  expect(unitCount('👩‍💻','utf16')).toBe(5);
 });
 it('uses graphemes for Bluesky posts',()=>{
  expect(analyzePlatformText('😀'.repeat(300),SOCIAL_RULES.bluesky)).toMatchObject({count:300,remaining:0,overLimit:false});
  expect(analyzePlatformText('😀'.repeat(301),SOCIAL_RULES.bluesky).overLimit).toBe(true);
  expect(analyzePlatformText('👩‍💻'.repeat(300),SOCIAL_RULES.bluesky)).toMatchObject({count:300,overBytes:true,overLimit:true});
  expect(analyzePlatformText('a'+'\u0301'.repeat(1600),SOCIAL_RULES.bluesky)).toMatchObject({count:1,overBytes:true,overLimit:true,maxUtf8Bytes:3000});
 });
 it('separates Telegram Bot API scope from generic app messages',()=>{
  expect(SOCIAL_RULES.telegram.scope).toContain('sendMessage');
  expect(analyzePlatformText('a'.repeat(4097),SOCIAL_RULES.telegram).overLimit).toBe(true);
 });
 it('does not invent an unverified Facebook hard limit',()=>{
  expect(analyzePlatformText('hello',SOCIAL_RULES.facebook)).toMatchObject({limit:null,remaining:null,overLimit:false});
 });
 it('labels Reddit reference and Pinterest Save-button scope',()=>{
  expect(SOCIAL_RULES.reddit.confidence).toBe('reference');
  expect(SOCIAL_RULES.pinterest.scope).toContain('Save-button');
 });
 it('counts X URL weighting and emoji',()=>{
  expect(unitCount('https://example.com','x-weighted')).toBe(23);
  expect(unitCount('中文','x-weighted')).toBe(4);
 });
});
describe('X thread splitting',()=>{
 it('returns a single untouched post for a short draft',()=>{
  expect(splitXThread('Hello')).toEqual(['Hello']);
 });
 it('splits a long draft with numbered suffixes within limits',()=>{
  const chunks=splitXThread('A useful update for everyone. '.repeat(45));
  expect(chunks.length).toBeGreaterThan(1);
  chunks.forEach((s,i)=>{
   expect(s).toContain('('+(i+1)+'/'+chunks.length+')');
   expect(unitCount(s,'x-weighted')).toBeLessThanOrEqual(280);
  });
 });
 it('handles Unicode graphemes without exceeding the budget',()=>{
  const chunks=splitXThread('👩‍💻'.repeat(200));
  expect(chunks.length).toBeGreaterThan(1);
  chunks.forEach(chunk=>expect(unitCount(chunk,'x-weighted')).toBeLessThanOrEqual(280));
 });
 it('rejects excessively long drafts without blocking the browser',()=>{
  expect(()=>splitXThread('a'.repeat(20001))).toThrow(RangeError);
 });
 it('rejects budgets too small for numbering',()=>{expect(()=>splitXThread('long text',8)).toThrow(RangeError);});
});
describe('Identifier and text analytics',()=>{
 it('converts compound variable names correctly',()=>{
  expect(tokenizeIdentifier('HTTPResponse-status_code')).toEqual(['http','response','status','code']);
  expect(convertIdentifier('HTTPResponse-status_code','camel')).toBe('httpResponseStatusCode');
  expect(convertIdentifier('hello world','snake')).toBe('hello_world');
  expect(convertIdentifier('hello world','pascal')).toBe('HelloWorld');
  expect(convertIdentifier('hello world','constant')).toBe('HELLO_WORLD');
  expect(convertIdentifier('hello world','kebab')).toBe('hello-world');
 });
 it('extracts unique email and HTTP URLs without making network requests',()=>{
  const r=analyzeExtraction('Mail Hello@Example.com and hello@example.com. Visit https://example.com/a, or https://example.com/a.');
  expect(r.emails).toEqual(['hello@example.com']);
  expect(r.urls).toEqual(['https://example.com/a']);
 });
 it('counts repeated words and returns no invented values for empty input',()=>{
  expect(analyzeExtraction('Clear words help. Clear sentences help.').repeatedWords[0]).toMatchObject({word:'clear',count:2});
  expect(analyzeExtraction('')).toMatchObject({words:0,syllables:0,emails:[],urls:[]});
 });
});
