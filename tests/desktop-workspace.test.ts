import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const html=readFileSync(resolve('local_service/static/index.html'),'utf8');
const script=readFileSync(resolve('local_service/static/workspace.js'),'utf8');
const schema=JSON.parse(readFileSync(resolve('local_service/static/schema.json'),'utf8'));
let profile:any,version:number,fetcher:ReturnType<typeof vi.fn>;
beforeEach(()=>{
  delete (window as any).careerNative;
  document.documentElement.innerHTML=html;localStorage.clear();version=1;
  profile={schemaVersion:1,personal:{fullName:'示例用户'},education:[{id:'edu-1',school:'示例大学',degree:'本科',academicDegree:'学士学位'}],experience:[],projects:[],research:[],publications:[],awards:[],skills:[],custom:{customNote:'保留旧自定义资料'},preferences:{}};
  Object.assign(window,{careerDesktop:{token:'test-desktop-token',dataDirectory:'/tmp/synthetic-career-data'},webkit:{messageHandlers:{careerDesktop:{postMessage:vi.fn()}}}});
  vi.stubGlobal('CSS',{escape:(s:string)=>s});vi.stubGlobal('confirm',()=>true);
  fetcher=vi.fn(async(path:string,options?:RequestInit)=>{
    let result:any;
    if(path==='/schema.json')result=schema;
    else if(path==='/api/profile'){
      if(options?.method==='PUT'){const update=JSON.parse(options.body as string);expect(update.expected_version).toBe(version);profile=update.profile;version++;}
      result={profile,version};
    }else if(path==='/api/facts')result={version,facts:[]};
    else if(path==='/api/jobs'||path==='/api/artifacts')result=[];
    else throw new Error('Unexpected test request '+path);
    return new Response(JSON.stringify(result));
  });
});
afterEach(()=>vi.unstubAllGlobals());
async function mount(){await new Function('fetch',`return (async()=>{${script}\n})();`)(fetcher);}
it('automatically connects in desktop and has one maintenance entry',async()=>{
  await mount();expect(document.querySelector('#connect-form')).toBeNull();expect(document.querySelector('[data-view="facts"]')).toBeNull();expect(document.querySelector('#profile #facts')).not.toBeNull();
  expect((document.querySelector('[data-personal="fullName"]') as HTMLInputElement).value).toBe('示例用户');
  expect((document.querySelector('[data-field="academicDegree"]') as HTMLSelectElement).value).toBe('学士');
  expect((document.querySelector('[data-basic="customNote"]') as HTMLInputElement).value).toBe('保留旧自定义资料');
  expect((window as any).webkit.messageHandlers.careerDesktop.postMessage).toHaveBeenCalledWith({action:'ready'});
});
it('uses the Electron bridge for native actions without calling the Swift bridge',async()=>{
  const postMessage=vi.fn(async()=>undefined);
  (window as any).careerNative={postMessage};
  await mount();
  (document.querySelector('#open-data') as HTMLButtonElement).click();
  await vi.waitFor(()=>expect(postMessage).toHaveBeenCalledWith({action:'folder'}));
  expect(postMessage).toHaveBeenCalledWith({action:'ready'});
  expect((window as any).webkit.messageHandlers.careerDesktop.postMessage).not.toHaveBeenCalled();
});
it('saves edits to the desktop service with version protection',async()=>{
  await mount();const input=document.querySelector('[data-personal="fullName"]') as HTMLInputElement;input.value='修改后的示例';input.dispatchEvent(new Event('input',{bubbles:true}));expect((window as any).careerHasUnsavedChanges()).toBe(true);
  document.querySelector('#profile-form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  await vi.waitFor(()=>expect(version).toBe(2));expect(profile.personal.fullName).toBe('修改后的示例');expect(profile.custom.customNote).toBe('保留旧自定义资料');
  await vi.waitFor(()=>expect((window as any).careerHasUnsavedChanges()).toBe(false));
});
it('removing the last experience persists as an empty collection',async()=>{
  await mount();(document.querySelector('[data-collection="education"] button') as HTMLButtonElement).click();
  document.querySelector('#profile-form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await vi.waitFor(()=>expect(version).toBe(2));expect(profile.education).toEqual([]);
});
it('the extension exposes only connection settings, not another editor',()=>{
  const options=readFileSync(resolve('entrypoints/options/index.html'),'utf8');const popup=readFileSync(resolve('entrypoints/popup/index.html'),'utf8');
  expect(options).not.toMatch(/personal-fields|record-editors|保存资料|导入 JSON|resume-file/);
  expect(popup).not.toMatch(/open-options|career-open|extract-jd|save-jd|AI 草稿/);
  expect(options).toContain('pair-form');expect(popup).toContain('确认填写');
});
