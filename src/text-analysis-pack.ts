import { estimateEnglishSyllables } from './editor-utils';

export type IdentifierStyle = 'camel'|'pascal'|'snake'|'kebab'|'constant'|'title';
export function tokenizeIdentifier(text:string):string[] {
  const separated=text.normalize('NFKC')
    .replace(/([a-z0-9])([A-Z])/g,'$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g,'$1 $2')
    .replace(/[_\-\s]+/g,' ');
  return (separated.match(/[\p{L}\p{N}]+/gu)||[]).map(s=>s.toLocaleLowerCase('en'));
}
export function convertIdentifier(text:string,style:IdentifierStyle):string {
 const words=tokenizeIdentifier(text);
 if(!words.length)return '';
 const capitalize=(w:string)=>w.slice(0,1).toLocaleUpperCase('en')+w.slice(1);
 switch(style){
 case 'camel':return words[0]+words.slice(1).map(capitalize).join('');
 case 'pascal':return words.map(capitalize).join('');
 case 'snake':return words.join('_');
 case 'kebab':return words.join('-');
 case 'constant':return words.join('_').toLocaleUpperCase('en');
 case 'title':return words.map(capitalize).join(' ');
 }
}
export interface ExtractedItems { emails:string[]; urls:string[]; words:number; sentences:number; syllables:number; repeatedWords:Array<{word:string;count:number}>; }
export function analyzeExtraction(text:string): ExtractedItems {
 const emailMatches=text.match(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu)||[];
 const urlsRaw=text.match(/https?:\/\/[^\s<>"']+/gu)||[];
 const emails=[...new Set(emailMatches.map(x=>x.toLocaleLowerCase('en')))];
 const urls=[...new Set(urlsRaw.map(x=>x.replace(/[),.;!?]+$/g,'')))];
 const words=text.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)||[];
 const counts=new Map<string,number>();
 for(const w of words){const lower=w.toLocaleLowerCase('en');counts.set(lower,(counts.get(lower)||0)+1);}
 const repeatedWords=[...counts.entries()].filter(([,count])=>count>1)
   .map(([word,count])=>({word,count})).sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word)).slice(0,30);
 const sentences=(text.match(/[^.!?。！？]+[.!?。！？]*/gu)||[]).filter(s=>s.trim()).length;
 const syllables=words.reduce((sum,w)=>sum+estimateEnglishSyllables(w),0);
 return {emails,urls,words:words.length,sentences,syllables,repeatedWords};
}
