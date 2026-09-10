import { storage } from 'wxt/utils/storage';
import { EMPTY_PROFILE, mergeProfile } from './profile';
import type { PersonProfile, WorkspaceMode } from './types';
import { readLocalProfile, localRequest } from './local-api';
const legacyItem=storage.defineItem<PersonProfile>('local:profile',{fallback:EMPTY_PROFILE});
const staged=storage.defineItem<boolean>('local:legacy-staged',{fallback:false});
const modeItem=storage.defineItem<WorkspaceMode>('local:workspace-mode',{fallback:'job'});

// No setter: the extension is a read-only consumer of the desktop SSOT.
export const profileStore={get:async()=>mergeProfile(structuredClone(EMPTY_PROFILE),await readLocalProfile())};
export const modeStore={get:()=>modeItem.getValue(),set:(mode:WorkspaceMode)=>modeItem.setValue(mode)};

export async function stageLegacyImport():Promise<boolean>{
  if(await staged.getValue())return false;
  const legacy=await legacyItem.getValue();
  const hasData=Object.values(legacy.personal??{}).some(Boolean)||['education','experience','projects','research','publications','awards','skills'].some(k=>(legacy[k as keyof PersonProfile] as unknown[])?.length)||Object.values(legacy.custom??{}).some(Boolean)||Object.values(legacy.preferences??{}).some(Boolean);
  if(!hasData)return false;
  const result=await localRequest<{staged:boolean}>('/migration/browser',{profile:legacy,expected_version:0});
  await staged.setValue(true);
  return result.staged;
}
