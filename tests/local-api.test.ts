import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const values=vi.hoisted(()=>new Map<string,unknown>());
vi.mock('wxt/utils/storage',()=>({storage:{defineItem:(key:string,options:{fallback:unknown})=>({getValue:async()=>structuredClone(values.has(key)?values.get(key):options.fallback),setValue:async(value:unknown)=>{values.set(key,structuredClone(value));}})}}));
beforeEach(()=>{values.clear();vi.resetModules();});afterEach(()=>vi.unstubAllGlobals());
it('only reads desktop profile and exposes no profile writer',async()=>{
  const {EMPTY_PROFILE}=await import('../utils/profile');const remote=structuredClone(EMPTY_PROFILE);remote.personal.fullName='桌面资料';
  values.set('local:career-connection',{enabled:true,token:'read-only'});
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({profile:remote,version:3})));vi.stubGlobal('fetch',fetcher);
  const {profileStore}=await import('../utils/storage');expect((await profileStore.get()).personal.fullName).toBe('桌面资料');expect(profileStore).not.toHaveProperty('set');expect(fetcher.mock.calls[0]![1].method).toBe('GET');
});
it('does not use browser backups when unpaired or offline',async()=>{
  const {EMPTY_PROFILE}=await import('../utils/profile');const old=structuredClone(EMPTY_PROFILE);old.personal.fullName='旧副本';values.set('local:profile',old);
  const {profileStore}=await import('../utils/storage');await expect(profileStore.get()).rejects.toThrow('配对');
  values.set('local:career-connection',{enabled:true,token:'reader'});vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('offline')));await expect(profileStore.get()).rejects.toThrow('不会使用旧资料副本');
});
it('stages a legacy candidate once without updating the SSOT or deleting the backup',async()=>{
  const {EMPTY_PROFILE}=await import('../utils/profile');const old=structuredClone(EMPTY_PROFILE);old.personal.fullName='待迁移资料';values.set('local:profile',old);
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({staged:true})));vi.stubGlobal('fetch',fetcher);
  const {stageLegacyImport}=await import('../utils/storage');expect(await stageLegacyImport()).toBe(true);expect(await stageLegacyImport()).toBe(false);expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0]![0]).toContain('/migration/browser');expect(values.get('local:profile')).toEqual(old);
});
