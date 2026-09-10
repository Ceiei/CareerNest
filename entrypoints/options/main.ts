import './style.css';
import { connectionStore, localRequest, readLocalProfile } from '../../utils/local-api';
import { stageLegacyImport } from '../../utils/storage';
const status=document.getElementById('status')!;
const code=document.getElementById('pair-code') as HTMLInputElement;
const pair=document.getElementById('pair') as HTMLButtonElement;
document.getElementById('pair-form')!.addEventListener('submit',event=>{
  event.preventDefault();pair.disabled=true;
  void(async()=>{const result=await localRequest<{token:string}>('/pair',{code:code.value.trim()});await connectionStore.set({enabled:true,token:result.token});code.value='';await readLocalProfile();status.textContent='已连接。插件只读桌面应用中的最新资料。';try{if(await stageLegacyImport())status.textContent+='旧资料已送至桌面应用等待确认。';}catch{status.textContent+='旧资料迁移暂未完成，请稍后重新配对重试；原备份仍保留。';}})().catch(error=>status.textContent=String(error)).finally(()=>pair.disabled=false);
});
document.getElementById('disconnect')!.addEventListener('click',()=>{void connectionStore.set({enabled:false,token:''}).then(()=>status.textContent='已断开。桌面应用中的资料不受影响。');});
void readLocalProfile().then(()=>status.textContent='已连接，资料由桌面应用提供。').catch(error=>status.textContent=String(error));
