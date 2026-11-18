import { unicodeStats, inspectUnicodeNormalization, processList, cleanupText, detailedStats, PLATFORM_FIELDS, type ListOptions, type CleanupAction, type PlatformField } from './completion-utils';
const one = <T extends HTMLElement>(id:string):T => {
 const item=document.getElementById(id); if(!item) throw new Error('Missing control '+id);return item as T;
};
const value=(id:string)=>one<HTMLTextAreaElement|HTMLInputElement|HTMLSelectElement>(id).value;
const show=(id:string,s:string)=>{one<HTMLElement>(id).textContent=s;};
const copy=async (s:string)=>{try{await navigator.clipboard.writeText(s);show('copy-status','Copied to clipboard.');}catch{show('copy-status','Copy unavailable. Select the result and copy manually.');}};
const active=document.body.dataset.completionTool;
if(active==='list'){
 const update=()=>{
   const options:ListOptions={order:value('list-order') as ListOptions['order'],unique:one<HTMLInputElement>('list-unique').checked,trim:one<HTMLInputElement>('list-trim').checked,removeEmpty:one<HTMLInputElement>('list-empty').checked,caseSensitive:one<HTMLInputElement>('list-case').checked};
   const result=processList(value('tool-input'),options);
   one<HTMLTextAreaElement>('tool-output').value=result.output;
   show('list-input-count',String(result.inputLines));show('list-output-count',String(result.outputLines));show('list-removed',String(result.removed));
 };
 one<HTMLButtonElement>('run-tool').addEventListener('click',update);
 one<HTMLButtonElement>('sample-button').addEventListener('click',()=>{one<HTMLTextAreaElement>('tool-input').value='Pear\nApple\npear\nBanana\n\nApple';update();});
 one<HTMLButtonElement>('copy-button').addEventListener('click',()=>void copy(value('tool-output')));
 one<HTMLButtonElement>('use-output').addEventListener('click',()=>{one<HTMLTextAreaElement>('tool-input').value=value('tool-output');update();});
 for(const id of ['tool-input','list-order','list-unique','list-trim','list-empty','list-case'])one<HTMLElement>(id).addEventListener('input',update);
 update();
}
if(active==='cleaner'){
 let action:CleanupAction='remove-empty-lines';
 const update=()=>{
   const cleaned=cleanupText(value('tool-input'),action);
   one<HTMLTextAreaElement>('tool-output').value=cleaned;
   show('cleanup-chars',String(Array.from(cleaned).length));
   show('cleanup-status','Preview generated locally. Source is unchanged until you choose Use result as input.');
 };
 one<HTMLSelectElement>('clean-action').addEventListener('change',e=>{action=(e.target as HTMLSelectElement).value as CleanupAction;update();});
 one<HTMLTextAreaElement>('tool-input').addEventListener('input',update);
 one<HTMLButtonElement>('sample-button').addEventListener('click',()=>{one<HTMLTextAreaElement>('tool-input').value='First line\n\n\nSecond   line\n\nThird line';update();});
 one<HTMLButtonElement>('copy-button').addEventListener('click',()=>void copy(value('tool-output')));
 one<HTMLButtonElement>('use-output').addEventListener('click',()=>{one<HTMLTextAreaElement>('tool-input').value=value('tool-output');update();});
 update();
}
if(active==='unicode'){
 const update=()=>{
  const current=value('tool-input');
  const result=unicodeStats(current);
  const normalization=inspectUnicodeNormalization(current);
  show('graphemes',String(result.graphemes));show('codepoints',String(result.codepoints));show('utf16',String(result.utf16));show('bytes',String(result.bytes));
  show('hidden-count',String(result.invisibles.length));
  show('unicode-nfc',normalization.nfcEqual?'Already NFC':'Different from NFC');
  show('unicode-nfd',normalization.nfdEqual?'Already NFD':'Different from NFD');
  show('unicode-mixed',String(normalization.mixedScriptCount));
  show('unicode-normalization-status',!current?'Enter text to inspect Unicode normalization.':
    'NFC and NFD are canonical Unicode forms. Mixed-script alerts are limited to Latin/Greek/Cyrillic within the same word; they are review hints, not security verdicts.');
  const mixed=one<HTMLElement>('unicode-mixed-examples');
  mixed.replaceChildren();
  if(!normalization.mixedScriptCount)mixed.textContent='No mixed Latin, Greek or Cyrillic words detected.';
  else {
   for(const item of normalization.mixedScriptExamples){
    const row=document.createElement('p');row.textContent='Possible mixed-script word: '+item.token+' ('+item.scripts+')';mixed.appendChild(row);
   }
   if(normalization.mixedScriptCount>normalization.mixedScriptExamples.length){
    const row=document.createElement('p');row.textContent='More mixed-script words found; showing the first eight.';mixed.appendChild(row);
   }
  }
  const list=one<HTMLElement>('hidden-characters');
  list.replaceChildren();
  if(!result.invisibles.length){list.textContent='No monitored zero-width or invisible formatting characters found.';return;}
  result.invisibles.slice(0,50).forEach(item=>{const p=document.createElement('p');p.textContent='Code point '+item.codepoint+' at character index '+item.offset;list.appendChild(p);});
  if(result.invisibles.length>50){const p=document.createElement('p');p.textContent='Only the first 50 are shown.';list.appendChild(p);}
 };
 one<HTMLTextAreaElement>('tool-input').addEventListener('input',update);
 one<HTMLButtonElement>('sample-button').addEventListener('click',()=>{one<HTMLTextAreaElement>('tool-input').value='cafe\u0301 and p\u0430ypal \u200b👩‍💻';update();});
 one<HTMLButtonElement>('copy-button').addEventListener('click',()=>void copy(value('tool-input')));
 one<HTMLButtonElement>('copy-nfc').addEventListener('click',()=>void copy(inspectUnicodeNormalization(value('tool-input')).nfc));
 update();
}
if(active==='stats'){
 const update=()=>{
 const r=detailedStats(value('tool-input'));
 for(const [id,stat] of Object.entries({ 'stat-words':r.words,'stat-unique':r.uniqueWords,'stat-lines':r.lines,'stat-empty':r.blankLines,'stat-letters':r.letters,'stat-digits':r.digits,'stat-spaces':r.spaces,'stat-symbols':r.symbols,'stat-bytes':r.utf8Bytes,'stat-average':r.averageWordLength.toFixed(1),'stat-speaking':r.words?Math.max(1,Math.ceil(r.speakingMinutes))+' min':'0 min'})){show(id,String(stat));}
 };
 one<HTMLTextAreaElement>('tool-input').addEventListener('input',update);
 one<HTMLButtonElement>('sample-button').addEventListener('click',()=>{one<HTMLTextAreaElement>('tool-input').value='Write clear text.\n\nCount the words and the unique words. 2026!';update();});
 one<HTMLButtonElement>('copy-button').addEventListener('click',()=>void copy(value('tool-input')));
 update();
}
if(active==='platform'){
 const key=document.body.dataset.platformField as PlatformField;
 const config=PLATFORM_FIELDS[key];
 if(!config)throw new Error('Unknown social field');
 const update=()=>{
   const txt=value('tool-input'); const stats=unicodeStats(txt); const remaining=config.limit-stats.graphemes;
   show('platform-current',String(stats.graphemes));show('platform-remaining',String(remaining));show('platform-utf16',String(stats.utf16));
   show('platform-hint',remaining<0?'Over the reference limit. The publishing app is the final validator.':'Within the reference length. The publishing app is the final validator.');
   const track=one<HTMLElement>('platform-progress');track.style.width=Math.min(100,stats.graphemes/config.limit*100)+'%';
 };
 one<HTMLTextAreaElement>('tool-input').addEventListener('input',update);
 one<HTMLButtonElement>('sample-button').addEventListener('click',()=>{one<HTMLTextAreaElement>('tool-input').value=key==='instagramBio'?'Writer | Ideas, tools and clear explanations. New posts weekly.':key==='youtubeDescription'?'This tutorial shows how to count characters and check text lengths. Links and sources are below.':'Product engineer | Building useful tools for creators and independent makers';update();});
 one<HTMLButtonElement>('copy-button').addEventListener('click',()=>void copy(value('tool-input')));
 update();
}
