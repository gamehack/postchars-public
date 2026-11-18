/**
 * Guard against shipping substantially heavier bundles to every PostChars
 * visitor. These are reproducible CI gzip estimates, NOT measured network
 * transfer, Lighthouse, LCP, INP, CLS or real-user performance.
 *
 * The limits give headroom over the 2026-11-01 successful production build:
 * React main ~88.6 KiB gzip, shared platform rules ~37.4 KiB, main CSS ~6.9 KiB.
 * Chunk names are checked intentionally so unexpected build partitioning requires review.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root=join(process.cwd(),'dist','assets');
const files=await readdir(root);
const byteBudget=[
  {prefix:'main-',suffix:'.js',max:110*1024,name:'Main React application'},
  {prefix:'platform-rules-',suffix:'.js',max:46*1024,name:'Shared counting rules and text parser'},
  {prefix:'main-',suffix:'.css',max:12*1024,name:'Main stylesheet'}
];
const sizes=new Map();
for(const file of files.filter(name=>/\.(?:js|css)$/.test(name))){
 const data=await readFile(join(root,file));
 sizes.set(file,gzipSync(data,{level:9}).byteLength);
}
const errors=[];
for(const rule of byteBudget){
 const found=[...sizes].filter(([name])=>name.startsWith(rule.prefix)&&name.endsWith(rule.suffix));
 if(found.length!==1){
  errors.push(rule.name+': expected one bundled asset; found '+found.length);
  continue;
 }
 const [[file,compressed]]=found;
 const kib=(compressed/1024).toFixed(1);
 const budget=(rule.max/1024).toFixed(0);
 console.log(rule.name+': '+file+' '+kib+' KiB gzip (budget '+budget+' KiB)');
 if(compressed>rule.max)errors.push(rule.name+': '+kib+' KiB exceeds budget '+budget+' KiB');
}
const totalJs=[...sizes.entries()].filter(([name])=>name.endsWith('.js')).reduce((sum,[,n])=>sum+n,0);
console.log('Total generated JS assets: '+(totalJs/1024).toFixed(1)+' KiB gzip');
if(totalJs>190*1024)errors.push('Total generated JS exceeds 190 KiB gzip budget');
if(errors.length)throw new Error('Client bundle budget exceeded:\n'+errors.join('\n'));
console.log('Client gzip size budgets passed. These are not field Core Web Vitals.');
