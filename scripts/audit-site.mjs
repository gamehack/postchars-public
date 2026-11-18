import {readFile,access} from 'node:fs/promises';
import {join,extname} from 'node:path';

const dist=join(process.cwd(),'dist');
const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const seenTitles=new Map();
let jsonLdCount=0, internalLinks=0, missing=[];

for(const url of urls){
 const path=new URL(url).pathname;
 const file=join(dist,path==='/'?'index.html':path.slice(1)+'index.html');
 const html=await readFile(file,'utf8');
 const title=html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
 if(!title)throw new Error('Missing title: '+url);
 if(seenTitles.has(title))throw new Error('Duplicate page title: '+title+' at '+url+' and '+seenTitles.get(title));
 seenTitles.set(title,url);
 if(!/<html[^>]*\blang=["']en["']/i.test(html))throw new Error('Missing English page language: '+url);
 if(/<meta[^>]*name=["']robots["'][^>]*noindex/i.test(html))throw new Error('Canonical page accidentally marked noindex: '+url);
 for(const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
   try{JSON.parse(script[1]);jsonLdCount++;}catch(e){throw new Error('Invalid JSON-LD at '+url+': '+String(e));}
 }
 for(const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)){
   const href=match[1].replaceAll('&amp;','&');
   if(!href.startsWith('/')||href.startsWith('//'))continue;
   const target=new URL(href,'https://postchars.com');
   if(target.origin!=='https://postchars.com')continue;
   const p=target.pathname;
   const relative=p==='/'?'index.html':p.slice(1)+(extname(p)?'':'index.html');
   try{await access(join(dist,relative));internalLinks++;}
   catch{missing.push(url+' -> '+href);}
 }
}
if(missing.length)throw new Error('Broken internal links:\n'+missing.slice(0,30).join('\n'));
console.log('Site audit passed: '+urls.length+' canonical pages; '+seenTitles.size+' unique titles; '+jsonLdCount+' valid JSON-LD blocks; '+internalLinks+' working internal links.');
