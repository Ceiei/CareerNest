import { storage } from 'wxt/utils/storage';
import type { PersonProfile } from './types';
export const LOCAL_SERVICE_URL='http://127.0.0.1:43119';
const item=storage.defineItem<{enabled:boolean;token:string}>('local:career-connection',{fallback:{enabled:false,token:''}});
export const connectionStore={get:()=>item.getValue(),set:(value:{enabled:boolean;token:string})=>item.setValue(value)};

export async function localRequest<T>(path:string,body?:unknown,method=body===undefined?'GET':'POST',token?:string):Promise<T>{
  const config=await connectionStore.get();
  let response:Response;
  try{response=await fetch(`${LOCAL_SERVICE_URL}/api${path}`,{method,headers:{'X-Career-Token':token??config.token,...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});}
  catch{throw new Error('请先打开 Career OS 桌面应用。插件不会使用旧资料副本填写。');}
  if(!response.ok){const error=await response.json().catch(()=>({})) as {detail?:unknown};throw new Error(typeof error.detail==='string'?error.detail:`连接失败 (${response.status})`);}
  return response.json() as Promise<T>;
}
export async function readLocalProfile():Promise<PersonProfile>{
  if(!(await connectionStore.get()).enabled)throw new Error('请先在连接设置中与桌面应用配对');
  return (await localRequest<{profile:PersonProfile}>('/profile')).profile;
}
