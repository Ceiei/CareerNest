import './style.css';
import { browser } from 'wxt/browser';
import { flattenProfile } from '../../utils/profile';
import { matchFields } from '../../utils/engine/matcher';
import { maskValue } from '../../utils/engine/text';
import { modeStore, profileStore } from '../../utils/storage';
import type { FieldDescriptor, FieldMatch, FillInstruction, ProfileCandidate, WorkspaceMode } from '../../utils/types';
const byId=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
let fields:FieldDescriptor[]=[],candidates:ProfileCandidate[]=[],matches:FieldMatch[]=[];
let activeTabId:number|undefined,mode:WorkspaceMode='job';
const results=new Map<string,{ok:boolean;reason?:string}>();
const status=(message:string)=>{byId('status').textContent=message;};
function guard(fn:()=>Promise<void>){return()=>{void fn().catch(error=>status(String(error)));};}
async function send(message:unknown):Promise<any>{
  if(!activeTabId)throw new Error('找不到当前标签页');
  try{return await browser.tabs.sendMessage(activeTabId,message);}catch{
    try{await browser.scripting.executeScript({target:{tabId:activeTabId},files:['/content-scripts/content.js']});return await browser.tabs.sendMessage(activeTabId,message);}
    catch{throw new Error('无法访问此页面，请在可填写的普通网页中使用插件');}
  }
}
function renderMode(){byId('mode-label').textContent=`${mode==='job'?'求职':'学术'}填写 · 桌面资料只读`;document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));}
function updateButton(){byId<HTMLButtonElement>('fill').disabled=![...document.querySelectorAll<HTMLInputElement>('.field-row input:checked')].some(c=>document.querySelector<HTMLSelectElement>(`select[data-field-id="${CSS.escape(c.dataset.fieldId!)}"]`)?.value);}
function render(){
  const rows=byId('rows');rows.replaceChildren();
  for(const field of fields){
    const match=matches.find(m=>m.fieldId===field.id),result=results.get(field.id);
    const row=document.createElement('div');row.className=`field-row ${match?.status??''}`;
    const check=document.createElement('input');check.type='checkbox';check.dataset.fieldId=field.id;check.checked=match?.status==='matched';check.disabled=match?.status==='existing';
    const label=document.createElement('div');label.className='field-label';const title=document.createElement('strong');title.textContent=field.label;title.title=field.label;
    const note=document.createElement('small');note.textContent=result?(result.ok?'已填写':`填写失败：${result.reason??'请检查'}`):match?.status==='existing'?'已有内容，不覆盖':match?.reason??'请选择对应资料';label.append(title,note);
    const select=document.createElement('select');select.dataset.fieldId=field.id;select.setAttribute('aria-label',`${field.label}对应资料`);select.add(new Option('— 不填写 —',''));
    for(const c of candidates)select.add(new Option(`${c.label} · ${c.sensitive?maskValue(String(c.value)):String(c.value)}`,c.key));
    select.value=match?.candidateKey??'';select.disabled=match?.status==='existing';select.addEventListener('change',()=>{check.checked=Boolean(select.value);updateButton();});check.addEventListener('change',updateButton);
    const focus=document.createElement('button');focus.className='icon-button';focus.textContent='定位';focus.addEventListener('click',guard(async()=>{await send({type:'FOCUS_FIELD',fieldId:field.id});}));row.append(check,label,select,focus);rows.append(row);
  }
  byId('summary').textContent=`可靠 ${matches.filter(m=>m.status==='matched').length} · 待确认 ${matches.filter(m=>m.status==='ambiguous').length} · 未匹配 ${matches.filter(m=>m.status==='unmatched').length}`;updateButton();
}
async function scan(){
  byId<HTMLButtonElement>('fill').disabled=true;status('正在读取桌面资料并扫描…');
  const [tab]=await browser.tabs.query({active:true,currentWindow:true});activeTabId=tab?.id;
  candidates=flattenProfile(await profileStore.get(),mode);
  if(!candidates.length)throw new Error('资料库为空，请在 Career OS 桌面应用中维护资料');
  const response=await send({type:'SCAN_FORM'});if(!response?.ok)throw new Error(response?.error??'扫描失败');
  fields=response.fields;matches=matchFields(fields,candidates);results.clear();byId('welcome').hidden=true;byId('preview').hidden=false;render();status(fields.length?'请检查匹配结果，再确认填写。':'没有找到可填写字段。');
}
async function fill(){
  // Refuse a stale preview if the desktop profile changed after scanning.
  const latest=flattenProfile(await profileStore.get(),mode);
  if(JSON.stringify(latest)!==JSON.stringify(candidates)){byId<HTMLButtonElement>('fill').disabled=true;throw new Error('桌面资料已更新，请重新扫描后确认填写');}
  const instructions:FillInstruction[]=[];
  document.querySelectorAll<HTMLInputElement>('.field-row input:checked').forEach(c=>{const id=c.dataset.fieldId!;const select=document.querySelector<HTMLSelectElement>(`select[data-field-id="${CSS.escape(id)}"]`);const candidate=candidates.find(x=>x.key===select?.value);if(candidate)instructions.push({fieldId:id,candidateKey:candidate.key,value:candidate.value});});
  if(!instructions.length)throw new Error('请先选择需要填写的项目');
  const response=await send({type:'FILL_FORM',instructions});if(!response?.ok)throw new Error(response?.error??'填写失败');
  results.clear();for(const r of response.results??[])results.set(r.fieldId,r);render();status(`已填写 ${[...results.values()].filter(r=>r.ok).length} 项，请在网页检查。`);
}
byId('scan').addEventListener('click',guard(scan));byId('rescan').addEventListener('click',guard(scan));byId('fill').addEventListener('click',guard(fill));
byId('connection').addEventListener('click',()=>{void browser.runtime.openOptionsPage();});
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.addEventListener('click',guard(async()=>{mode=b.dataset.mode as WorkspaceMode;await modeStore.set(mode);renderMode();byId<HTMLButtonElement>('fill').disabled=true;if(fields.length)await scan();})));
void modeStore.get().then(value=>{mode=value;renderMode();});
