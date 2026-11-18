import { checkAllPosts, type CrossPlatformId } from './cross-platform-rules';

type Check = {
 id: CrossPlatformId; label:string; field:string; count:number; limit:number|null;
 remaining:number|null; exceeded:boolean; unit:string; scope:string;
 source:string; note:string; advisory:boolean; utf8Bytes:number|null; maxUtf8Bytes:number|undefined;
};
const units:Record<string,string>={graphemes:'visible graphemes',utf16:'UTF-16 units',codepoints:'code points','x-weighted':'X weighted characters'};
export function checksForDraft(text:string):Check[]{
 return checkAllPosts(text).map(r=>({
  id:r.rule.id,label:r.rule.name,field:r.rule.field,count:r.count,limit:r.rule.limit,
  remaining:r.remaining,exceeded:r.overLimit,unit:units[r.rule.unit]||r.rule.unit,
  scope:r.rule.scope,source:r.rule.source,note:(r.overBytes?'UTF-8 byte limit exceeded. ':'')+r.rule.note,
  advisory:r.rule.confidence!=='official',utf8Bytes:r.utf8Bytes,maxUtf8Bytes:r.rule.maxUtf8Bytes
 }));
}
function mount(){
 const input=document.getElementById('tool-input') as HTMLTextAreaElement|null;
 const grid=document.getElementById('platform-grid');
 const summary=document.getElementById('summary');
 const status=document.getElementById('copy-status');
 if(!input||!grid||!summary||!status)return;
 function render(){
  const checks=checksForDraft(input!.value);
  grid!.replaceChildren();
  for(const item of checks){
   const card=document.createElement('section');card.className='platform-card';card.dataset.checkId=item.id;card.dataset.status=item.limit===null?'unknown':item.exceeded?'over':'within';
   const heading=document.createElement('h3');heading.textContent=item.label;card.append(heading);
   const field=document.createElement('p');field.textContent=item.field+' · '+item.scope;card.append(field);
   const value=document.createElement('p');value.className='count';value.textContent=item.count.toLocaleString()+' / '+(item.limit?.toLocaleString()??'Unspecified');card.append(value);
   const info=document.createElement('p');info.className=item.limit===null?'reference':item.exceeded?'over':'within';info.textContent=item.limit===null?'No verified universal limit':item.exceeded?'Over limit by '+Math.abs(item.remaining??0):'Remaining: '+(item.remaining??'N/A');card.append(info);
   const bar=document.createElement('progress');bar.max=item.limit??1;bar.value=Math.min(item.count,item.limit??1);bar.hidden=item.limit===null;bar.setAttribute('aria-label',item.label+' usage');card.append(bar);
   const unit=document.createElement('p');unit.className='reference';unit.textContent=item.unit+(item.advisory?' · reference estimate':' · documented scope');card.append(unit);
   if(item.maxUtf8Bytes!==undefined){const p=document.createElement('p');p.className='reference';p.textContent='UTF-8: '+item.utf8Bytes?.toLocaleString('en-US')+' / '+item.maxUtf8Bytes.toLocaleString('en-US')+' bytes';card.append(p);}
   const note=document.createElement('p');note.textContent=item.note;card.append(note);
   if(item.source){const a=document.createElement('a');a.href=item.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Rule source';card.append(a);}
   grid!.append(card);
  }
  const exceeded=checks.filter(c=>c.exceeded).length;
  summary!.textContent=input!.value?checks.length+' checked · '+exceeded+' over a reference limit. Final validation happens in each platform.':'Start typing to compare '+checks.length+' platform fields.';
  const snippet=input!.value.slice(0,240)+(input!.value.length>240?'…':'');
  for(const id of ['preview-x','preview-instagram','preview-linkedin']){const node=document.getElementById(id);if(node)node.textContent=snippet||'Your text preview will appear here.';}
 }
 input.addEventListener('input',render);
 document.getElementById('sample-button')?.addEventListener('click',()=>{input.value='A launch update with emoji ✨ and a link https://example.com';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();});
 document.getElementById('clear-button')?.addEventListener('click',()=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();});
 document.getElementById('copy-button')?.addEventListener('click',async()=>{if(!input.value)return;try{await navigator.clipboard.writeText(input.value);status.textContent='Copied';}catch{status.textContent='Copy unavailable. Select the text to copy manually.';}});
 render();
}
if(typeof document!=='undefined')mount();
