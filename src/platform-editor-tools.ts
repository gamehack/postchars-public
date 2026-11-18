import { SOCIAL_RULES, analyzePlatformText, splitXThread, unitCount, type PlatformKey } from './platform-rules';
import { convertIdentifier, analyzeExtraction, type IdentifierStyle } from './text-analysis-pack';
const el=<T extends HTMLElement>(id:string)=>{const node=document.getElementById(id);if(!node)throw new Error('Missing '+id);return node as T;};
const input=()=>el<HTMLTextAreaElement>('tool-input');
const output=()=>el<HTMLTextAreaElement>('tool-output');
const show=(id:string,v:string)=>{el<HTMLElement>(id).textContent=v;};
const tool=document.body.dataset.specialTool;
const copy=async(text:string)=>{try{await navigator.clipboard.writeText(text);show('copy-status','Copied.');}catch{show('copy-status','Clipboard unavailable. Select the result to copy it.');}};
const loadLocalFile=(callback:()=>void)=>{
 const fileInput=document.getElementById('text-file') as HTMLInputElement|null;
 fileInput?.addEventListener('change',async()=>{
  const file=fileInput.files?.[0];if(!file)return;
  if(file.size>2_000_000){show('copy-status','File exceeds 2 MB.');fileInput.value='';return;}
  const ext=file.name.split('.').pop()?.toLowerCase();
  if(!['txt','md','csv','json','log'].includes(ext||'')){show('copy-status','Only plain-text TXT, MD, CSV, JSON or LOG files are supported.');fileInput.value='';return;}
  try{input().value=await file.text();callback();show('copy-status','Local file loaded.');}
  catch{show('copy-status','Cannot read this file.');}
  fileInput.value='';
 });
};
const exportText=(getText:()=>string)=>{
 document.getElementById('export-button')?.addEventListener('click',()=>{
  const b=new Blob([getText()],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(b),a=document.createElement('a');
  a.href=url;a.download='postchars-result.txt';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
};

if(tool==='social'){
 const key=document.body.dataset.socialKey as PlatformKey;
 const rule=SOCIAL_RULES[key];if(!rule)throw new Error('Invalid platform key');
 const update=()=>{
  const r=analyzePlatformText(input().value,rule);
  show('social-count',String(r.count));
  show('social-remaining',r.remaining===null?'Not verified':String(r.remaining));
  show('social-visible',String(r.graphemes));
  show('social-utf16',String(r.utf16));
  show('social-codepoints',String(r.codepoints));
  if(document.getElementById('social-bytes'))show('social-bytes',String(r.utf8Bytes));
  show('social-status',rule.limit===null?'No universal field limit verified; use the publisher as the final authority.':
   (r.overBytes?'Over the 3,000-byte Bluesky limit even though the grapheme count may fit.':r.overLimit?'Over the documented or reference length.':'Within the applicable reference limits; the publisher is the final validator.'));
  const progress=document.getElementById('social-progress');
  if(progress)progress.style.width=rule.limit===null?'0%':Math.min(100,100*r.count/rule.limit)+'%';
 };
 input().addEventListener('input',update);
 document.getElementById('sample-button')?.addEventListener('click',()=>{input().value='A useful update: what changed, why it matters, and what comes next. ✨';update();});
 el<HTMLButtonElement>('copy-button').addEventListener('click',()=>void copy(input().value));
 loadLocalFile(update);exportText(()=>input().value);update();
}
if(tool==='thread'){
 const update=()=>{
  const target=el<HTMLElement>('thread-results');target.replaceChildren();
  const value=input().value;
  try{
    const chunks=splitXThread(value);
    show('thread-count',String(chunks.length));
    if(!chunks.length){show('thread-status','Paste a draft to split it into numbered posts.');return;}
    for(const [i,chunk] of chunks.entries()){
      const block=document.createElement('div');block.className='pro-result-block';
      const heading=document.createElement('strong');heading.textContent='Post '+(i+1)+' / '+chunks.length+' — '+unitCount(chunk,'x-weighted')+' weighted characters';
      const text=document.createElement('p');text.textContent=chunk;
      const btn=document.createElement('button');btn.type='button';btn.textContent='Copy post';btn.addEventListener('click',()=>void copy(chunk));
      block.append(heading,text,btn);target.appendChild(block);
    }
    show('thread-status','Each post includes its numbered suffix in the X weighted count. Check links and formatting in X before publishing.');
  }catch(e){show('thread-status',e instanceof Error?e.message:'Cannot split this draft.');show('thread-count','—');}
 };
 input().addEventListener('input',update);
 document.getElementById('sample-button')?.addEventListener('click',()=>{input().value=('Here is a clear and useful explanation of a product improvement and what users can do with it. ').repeat(8);update();});
 el<HTMLButtonElement>('copy-button').addEventListener('click',()=>void copy([...el<HTMLElement>('thread-results').querySelectorAll('p')].map(p=>p.textContent||'').join('\n\n')));
 loadLocalFile(update);exportText(()=>[...el<HTMLElement>('thread-results').querySelectorAll('p')].map(p=>p.textContent||'').join('\n\n'));update();
}
if(tool==='identifier'){
 const style=el<HTMLSelectElement>('format-style');
 const update=()=>{output().value=convertIdentifier(input().value,style.value as IdentifierStyle);};
 input().addEventListener('input',update);style.addEventListener('change',update);
 document.getElementById('sample-button')?.addEventListener('click',()=>{input().value='HTTP Response status_code';update();});
 el<HTMLButtonElement>('copy-button').addEventListener('click',()=>void copy(output().value));
 loadLocalFile(update);exportText(()=>output().value);update();
}
if(tool==='extract'){
 const update=()=>{
  const r=analyzeExtraction(input().value);
  show('metric-words',String(r.words));show('metric-syllables',String(r.syllables));
  show('metric-emails',String(r.emails.length));show('metric-urls',String(r.urls.length));
  show('metric-sentences',String(r.sentences));show('metric-repeated',String(r.repeatedWords.length));
  const style=el<HTMLSelectElement>('extract-mode').value;
  output().value=style==='emails'?r.emails.join('\n'):style==='urls'?r.urls.join('\n'):
    style==='repeated'?r.repeatedWords.map(row=>row.word+' — '+row.count).join('\n'):
    'Words: '+r.words+'\nSentences: '+r.sentences+'\nEstimated syllables: '+r.syllables;
 };
 input().addEventListener('input',update);
 el<HTMLSelectElement>('extract-mode').addEventListener('change',update);
 document.getElementById('sample-button')?.addEventListener('click',()=>{input().value='Visit https://postchars.com/tools to learn. Email hello@example.org or hello@example.org. Clear words can help people understand clear ideas.';update();});
 el<HTMLButtonElement>('copy-button').addEventListener('click',()=>void copy(output().value));
 loadLocalFile(update);exportText(()=>output().value);update();
}
