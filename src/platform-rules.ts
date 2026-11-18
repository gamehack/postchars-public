import twitterText from 'twitter-text';

export type CountUnit = 'graphemes' | 'utf16' | 'codepoints' | 'x-weighted';
export type PlatformKey = 'tiktok' | 'bluesky' | 'reddit' | 'discord' | 'telegram' | 'facebook' | 'pinterest';
export interface PlatformRule {
  key: PlatformKey; label: string; field: string; limit: number | null; unit: CountUnit;
  source: string; scope: string; confidence: 'official' | 'reference'; note: string;
  maxUtf8Bytes?: number;
}
export const SOCIAL_RULES: Record<PlatformKey, PlatformRule> = {
  tiktok: {
    key:'tiktok', label:'TikTok',field:'Video caption',limit:2200,unit:'utf16',
    confidence:'official',source:'https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post?enter_method=left_navigation',
    scope:'Content Posting API video caption',note:'TikTok documents a 2,200 UTF-16-unit caption maximum for its Direct Post API. In-app validation may differ.'
  },
  bluesky: {
    key:'bluesky',label:'Bluesky',field:'Post text',limit:300,unit:'graphemes',
    confidence:'official',source:'https://github.com/bluesky-social/atproto/blob/main/lexicons/app/bsky/feed/post.json',
    scope:'app.bsky.feed.post lexicon',maxUtf8Bytes:3000,note:'Bluesky lexicon restricts text to 300 graphemes and 3,000 UTF-8 bytes. Both limits apply; validate facets in the client.'
  },
  reddit: {
    key:'reddit',label:'Reddit',field:'Post title',limit:300,unit:'codepoints',
    confidence:'reference',source:'https://www.reddit.com/dev/api/',
    scope:'Typical title length reference',note:'300 is an editorial reference, not a verified universal Reddit limit. Subreddits may impose stricter posting requirements.'
  },
  discord: {
    key:'discord',label:'Discord',field:'Standard message',limit:2000,unit:'utf16',
    confidence:'official',source:'https://support.discord.com/hc/en-us/articles/360034632292-Sending-Messages',
    scope:'Ordinary free Discord message',note:'Discord says ordinary messages allow 2,000 characters; Nitro can support 4,000. UTF-16 is a planning approximation for emoji.'
  },
  telegram: {
    key:'telegram',label:'Telegram',field:'Bot API message',limit:4096,unit:'codepoints',
    confidence:'official',source:'https://core.telegram.org/bots/api#sendmessage',
    scope:'Bot API sendMessage text after entities parsing',note:'The 4,096 limit is for Telegram Bot API sendMessage, not a guarantee for every consumer app or formatting mode.'
  },
  facebook: {
    key:'facebook',label:'Facebook',field:'Page post draft',limit:null,unit:'graphemes',
    confidence:'reference',source:'https://www.facebook.com/help/',
    scope:'Unverified current web composer rule',note:'No reliable universal live post limit verified. This is a counting workspace only; check Facebook’s own composer.'
  },
  pinterest: {
    key:'pinterest',label:'Pinterest',field:'Pin description',limit:500,unit:'codepoints',
    confidence:'official',source:'https://developers.pinterest.com/docs/web-features/buttons/',
    scope:'Pinterest Save-button data-pin-description',note:'Pinterest documents 500 characters for its Save-button prefilled description. This does not establish every Pin composer/API limit.'
  }
};
export function visibleCount(text: string): number {
  if(typeof Intl !== 'undefined' && 'Segmenter' in Intl) return [...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(text)].length;
  return Array.from(text).length;
}
export function unitCount(text: string, unit: CountUnit): number {
 switch(unit){
 case 'graphemes':return visibleCount(text);
 case 'utf16':return text.length;
 case 'codepoints':return Array.from(text).length;
 case 'x-weighted':return twitterText.parseTweet(text).weightedLength;
 }
}
export function analyzePlatformText(text: string,rule: PlatformRule) {
 const count=unitCount(text,rule.unit);
 const utf8Bytes=new TextEncoder().encode(text).length;
 const overCount=rule.limit!==null&&count>rule.limit;
 const overBytes=rule.maxUtf8Bytes!==undefined&&utf8Bytes>rule.maxUtf8Bytes;
 return {count,limit:rule.limit,remaining:rule.limit===null?null:rule.limit-count,overLimit:overCount||overBytes,overCount,overBytes,graphemes:visibleCount(text),codepoints:Array.from(text).length,utf16:text.length,utf8Bytes,maxUtf8Bytes:rule.maxUtf8Bytes??null};
}
function splitToken(token: string, budget: number): string[] {
 const clusters = typeof Intl !== 'undefined' && 'Segmenter' in Intl
   ? [...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(token)].map(x=>x.segment)
   : Array.from(token);
 const parts:string[]=[];let current='';
 for(const grapheme of clusters){
   if(current && unitCount(current+grapheme,'x-weighted')>budget){parts.push(current);current='';}
   current+=grapheme;
 }
 if(current)parts.push(current);
 return parts;
}
function splitWithBudget(text:string,budget:number):string[] {
 // Preserve words when possible and split long non-URL tokens on grapheme boundaries.
 const tokens=text.trim().match(/\S+|\s+/gu)||[];
 const result:string[]=[];let current='';
 function push(){if(current.trim()){result.push(current.trim());current='';}}
 for(const token of tokens){
   if(!token.trim()){
     if(current) current+=token;
     continue;
   }
   if(unitCount(current+token,'x-weighted')<=budget){current+=token;continue;}
   push();
   if(unitCount(token,'x-weighted')<=budget){current=token;continue;}
   // URL alone is 23 weighted units on X, and must stay intact.
   if(/^https?:\/\//i.test(token))throw new RangeError('A URL does not fit the thread budget; edit the link or text around it.');
   for(const part of splitToken(token,budget)){if(unitCount(part,'x-weighted')>budget)throw new RangeError('An individual character exceeds thread budget.');result.push(part);}
 }
 push();
 return result;
}
/** Standalone X threads, with stable n/N numbering included in the 280-weighted limit. */
export function splitXThread(text:string,limit=280):string[] {
 if(!text.trim())return [];
 if(text.length>20_000)throw new RangeError('For responsive editing, a thread draft must be 20,000 UTF-16 units or fewer.');
 if(limit<12)throw new RangeError('Thread limit must accommodate numbering.');
 if(unitCount(text,'x-weighted')<=limit)return [text.trim()];
 let estimated=2;
 for(let attempt=0;attempt<10;attempt++){
   const suffix = ' ('+String(estimated)+'/'+String(estimated)+')';
   const budget=limit-unitCount(suffix,'x-weighted');
   const chunks=splitWithBudget(text,budget);
   if(chunks.length===estimated) return chunks.map((chunk,i)=>chunk+' ('+(i+1)+'/'+chunks.length+')');
   estimated=chunks.length;
 }
 throw new RangeError('Unable to stabilize thread numbering.');
}
