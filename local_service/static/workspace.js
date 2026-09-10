const $ = id => document.getElementById(id);
const desktop=window.careerDesktop;
window.addEventListener('error',e=>native('error',{name:e.message||'JavaScript error'}));
window.addEventListener('unhandledrejection',e=>native('error',{name:String(e.reason?.message||'Unhandled rejection')}));
const schema = await fetch('/schema.json').then(response => {if(!response.ok)throw new Error('字段配置加载失败，请重启本地服务后刷新');return response.json();}).catch(error=>{$('notice').textContent=error.message;throw error;});
const state = { token: desktop?.token||'', mode: localStorage.getItem('career-mode') || 'job', version: 0, profile: null, facts: [], jobs: [], artifacts: [], editingFact: null, profileDirty: false };
const titles = { overview: ['让每一段经历都有据可循。', '维护真实的自己，为下一次机会选择合适的表达。'], profile: ['真实的你，只维护一次。', '个人信息与经历共用，场景决定表达。'], facts: ['经历背后，还有事实。', '记录动作、结果和证据，让每一句表达有源可溯。'], jobs: ['从这一次机会出发。', '保存要求、找到相关经历，再决定展示什么。'], artifacts: ['表达可以不同，事实始终一致。', '审阅内容、核对来源，再交付给下一次机会。'], connection: ['你的资料，留在本机。', '连接本地事实库，管理迁移与备份。'] };
const collections = { education: '教育经历', experience: '实习／工作', projects: '项目', research: '科研', publications: '论文', awards: '获奖' };
const fields = { education: { school:'学校', degree:'学历层次', academicDegree:'学位', major:'专业', department:'院系', startDate:'开始日期', endDate:'结束日期', gpa:'GPA', ranking:'排名' }, experience:{company:'公司',position:'职位',department:'部门',startDate:'开始日期',endDate:'结束日期',responsibilities:'职责',achievements:'成果'}, projects:{projectName:'项目',role:'角色',startDate:'开始日期',endDate:'结束日期',description:'内容',achievements:'成果'},research:{researchTopic:'研究课题',advisor:'导师',role:'角色',description:'研究内容',achievements:'成果'},publications:{title:'标题',venue:'期刊／会议',date:'发表日期',role:'作者贡献',description:'说明'},awards:{awardName:'奖项',level:'级别',date:'获奖日期',description:'说明'} };
const personalLabels = {fullName:'姓名',englishName:'英文名',gender:'性别',birthDate:'出生日期',phone:'手机号',email:'邮箱',idNumber:'证件号码',nationality:'国籍',nativePlace:'籍贯',politicalStatus:'政治面貌',address:'联系地址',studentId:'学号',ethnicGroup:'民族',householdRegistration:'户籍所在地',emergencyContact:'紧急联系人',emergencyPhone:'紧急联系电话'};
let noticeTimer;
let factDirty=false,materialDirty=false;
window.careerHasUnsavedChanges=()=>state.profileDirty||factDirty||materialDirty;
function notify(message) { $('notice').textContent=message; clearTimeout(noticeTimer); noticeTimer=setTimeout(()=>$('notice').textContent='',8000); }
function el(tag, text, className) { const e=document.createElement(tag); if(text!==undefined)e.textContent=text; if(className)e.className=className; return e; }
function sourceText(fact){return [fact.text,...['context','actions','results'].filter(k=>fact[k]).map(k=>`${{context:'背景',actions:'动作',results:'结果'}[k]}：${fact[k]}`),...(fact.technologies?.length&&fact.origin==='confirmed'?['技术：'+fact.technologies.join('、')]:[])].join('\n');}
function act(label, fn, className='') { const b=el('button',label,className); b.type='button'; b.addEventListener('click',()=>run(fn,b)); return b; }
async function run(fn, button) { if(button)button.disabled=true; try { await fn(); } catch(error) {notify(error.message || String(error));} finally{if(button)button.disabled=false;} }
async function api(path, body, method=body?'POST':'GET', blob=false) {
  if(!state.token)throw new Error('请重新打开 Career OS 桌面应用');
  const res=await fetch('/api'+path,{method,headers:{'X-Career-Token':state.token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(/\/(compile|adapt)$/.test(path)?90000:15000)});
  if(!res.ok){let message;try{const data=await res.json();message=typeof data.detail==='string'?data.detail:JSON.stringify(data.detail);}catch{message='请求失败';}throw new Error(message);}
  return blob?res.blob():res.json();
}
function show(view){document.querySelectorAll('.view').forEach(e=>e.classList.toggle('active',e.id===view));document.querySelectorAll('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view===view));$('page-title').textContent=titles[view][0];$('page-intro').textContent=titles[view][1];$('breadcrumb').textContent='WORKSPACE / '+view.toUpperCase();}
document.querySelectorAll('[data-view],[data-go]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view||b.dataset.go)));
function renderMode(){document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));});document.querySelectorAll('[data-modes]').forEach(e=>e.hidden=!e.dataset.modes.split(',').includes(state.mode));document.querySelectorAll('#basic-extra section').forEach(e=>e.hidden=![...e.querySelectorAll('label')].some(label=>!label.hidden));$('mode-badge').textContent=state.mode==='job'?'校招与实习':'夏令营与学校申请';$('job-form-title').textContent=state.mode==='job'?'保存岗位要求':'保存学校申请要求';renderJobs();renderArtifacts();}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;localStorage.setItem('career-mode',state.mode);$('match-panel').hidden=true;renderMode();}));
function empty(container,text){container.replaceChildren(el('div',text,'empty'));}
async function refresh(){
  if(state.profileDirty && !confirm('重新读取会丢弃尚未保存的资料编辑。继续吗？'))return;
  const [profile,facts,jobs,artifacts]=await Promise.all([api('/profile'),api('/facts'),api('/jobs'),api('/artifacts')]);
  if(profile.version!==facts.version)throw new Error('读取期间事实库有更新，请重试');
  Object.assign(state,{version:profile.version,profile:profile.profile,facts:facts.facts,jobs,artifacts,profileDirty:false});
  $('connection-status').textContent=`本地已连接 · 事实版本 ${state.version}`;$('profile-version').textContent='版本 '+state.version;
  $('count-records').textContent=Object.keys(collections).reduce((sum,key)=>sum+(state.profile[key]||[]).length,0);
  $('count-facts').textContent=state.facts.length;$('count-jobs').textContent=state.jobs.length;$('count-artifacts').textContent=state.artifacts.length;
  renderProfile();renderFacts();renderJobs();renderArtifacts();
}
$('refresh').addEventListener('click',()=>run(refresh,$('refresh')));
$('profile').append($('facts'));
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();show('overview');});
function native(action,values={}){return window.careerNative?.postMessage({action,...values})??window.webkit?.messageHandlers?.careerDesktop?.postMessage({action,...values});}
$('data-directory').textContent=desktop?.dataDirectory||'';
$('open-data').textContent='打开数据目录';
$('open-data').addEventListener('click',()=>run(()=>native('folder')));
$('generate-pair').addEventListener('click',()=>run(async()=>{const result=await api('/desktop/pair-code',{});$('pair-output').textContent=result.code;$('copy-pair').hidden=false;},$('generate-pair')));
$('copy-pair').addEventListener('click',()=>run(async()=>{await native('copy',{text:$('pair-output').textContent});notify('配对码已复制');}));
$('check-legacy').addEventListener('click',()=>run(async()=>{const candidate=await api('/migration/browser');const panel=$('legacy-preview');panel.replaceChildren();if(!candidate.profile){panel.append(el('p','暂无待迁移资料。请先在旧插件更新后的连接设置中完成配对。'));return;}panel.append(el('p','以下为旧插件资料。确认后只会导入空资料库，原浏览器备份保留。'),el('pre',JSON.stringify(candidate.profile,null,2)));panel.append(act('确认导入旧资料',async()=>{await api('/profile',{profile:candidate.profile,expected_version:0},'PUT');await refresh();panel.replaceChildren(el('p','已导入。之后仅在本应用维护。'));}));},$('check-legacy')));
function inputField(labelText,value,attributes={},path='',type='text'){
  const label=el('label',labelText);const key=schema.paths[path.replace(/\.\d+\./g,'.*.')];
  const input=el(key?'select':type==='textarea'||String(value).length>120?'textarea':'input');
  if(key){
    input.add(new Option('请选择',''));const norm=text=>String(text).toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
    const options=schema.choices[key];const canonical=options.find(([v,l,aliases])=>[v,l,...aliases].some(item=>norm(item)===norm(value)));
    for(const[v,l]of options)input.add(new Option(l,v));
    if(value&&!canonical)input.add(new Option(`${value}（已有值）`,String(value)));
    input.value=canonical?canonical[0]:String(value??'');
    label.title='标准值用于自动匹配，同义词由插件统一处理；已有非标准值会保留。';
  }else {input.value=String(value??'');if(type==='date'&&/^\d{4}-\d{2}-\d{2}$/.test(String(value)))input.type='date';else if(['email','tel','url'].includes(type))input.type=type;}
  for(const[k,val]of Object.entries(attributes))input.dataset[k]=val;label.append(input);return label;
}
function renderProfile(){
  const grid=$('profile-fields');grid.replaceChildren();
  for(const [key,label]of Object.entries(personalLabels))grid.append(inputField(label,state.profile.personal?.[key]??'',{personal:key},'personal.'+key));
  grid.append(inputField('技能（逗号分隔）',(state.profile.skills||[]).join('、'),{skills:'true'}));
  const extras=$('basic-extra');extras.replaceChildren();
  for(const group of schema.groups){const section=el('section');section.append(el('h3',group.title));const row=el('div',undefined,'form-grid');for(const field of group.fields){const label=inputField(field.label,state.profile[group.root]?.[field.key]??'',{root:group.root,basic:field.key},`${group.root}.${field.key}`,field.type);if(field.modes)label.dataset.modes=field.modes.join(',');if(field.hint)label.append(el('small',field.hint));row.append(label);}section.append(row);extras.append(section);}
  for(const root of ['custom','preferences']){const known=new Set(schema.groups.filter(g=>g.root===root).flatMap(g=>g.fields.map(f=>f.key)));const unknown=Object.entries(state.profile[root]||{}).filter(([key])=>!known.has(key));if(unknown.length){const section=el('section');section.append(el('h3',root==='custom'?'其他自定义资料':'其他申请偏好'));const row=el('div',undefined,'form-grid');for(const[key,value]of unknown)row.append(inputField(key,value,{root,basic:key}));section.append(row);extras.append(section);}}
  const list=$('record-fields');list.replaceChildren();
  for(const [key,title]of Object.entries(collections)){
    const section=el('section');const head=el('div',undefined,'section-head');head.append(el('h3',title),act('新增记录',()=>{collectProfile();state.profile[key].push({id:crypto.randomUUID()});state.profileDirty=true;renderProfile();}));section.append(head);
    (state.profile[key]||[]).forEach((record,index)=>{const card=el('div',undefined,'record');card.dataset.collection=key;card.dataset.index=index;const row=el('div',undefined,'form-grid');const defs=schema.collections[key].fields.map(f=>({...f}));for(const attr of Object.keys(record))if(attr!=='id'&&!defs.some(f=>f.key===attr))defs.push({key:attr,label:attr});for(const field of defs)row.append(inputField(field.label,record[field.key]??'',{field:field.key},`${key}.${index}.${field.key}`,field.type));card.append(el('h3',`${title} ${index+1}`),row,act('移除此记录',()=>{if(!confirm('从当前编辑中移除此记录？保存后生效，历史版本仍保留。'))return;collectProfile();state.profile[key].splice(index,1);state.profileDirty=true;renderProfile();}));section.append(card);});
    list.append(section);
  }
  renderMode();
  document.querySelectorAll('[data-collection]').forEach(card=>{
    const record=state.profile[card.dataset.collection][Number(card.dataset.index)];
    const linked=el('div');linked.dataset.linkedRecord=record.id;
    card.append(linked,act('补充这段经历的细节与证据',()=>{
      if(state.profileDirty)throw new Error('请先保存当前资料，再补充经历细节');
      $('fact-form').reset();state.editingFact=null;$('fact-record').value=record.id;$('fact-composer').open=true;notify('已选中这段经历，在下方补充细节即可');
    }));
  });
}
function collectProfile(){if(!state.profile)throw new Error('请先连接事实库');document.querySelectorAll('[data-personal]').forEach(input=>state.profile.personal[input.dataset.personal]=input.value.trim());document.querySelectorAll('[data-basic]').forEach(input=>{const root=state.profile[input.dataset.root];const old=root[input.dataset.basic];root[input.dataset.basic]=String(old)===input.value.trim()?old:input.value.trim();});state.profile.skills=document.querySelector('[data-skills]').value.split(/[,，、\n]/).map(x=>x.trim()).filter(Boolean);document.querySelectorAll('[data-collection]').forEach(card=>{const record=state.profile[card.dataset.collection][Number(card.dataset.index)];card.querySelectorAll('[data-field]').forEach(input=>{const old=record[input.dataset.field];const value=input.value.trim();record[input.dataset.field]=String(old)===value?old:value;});});}
$('profile-form').addEventListener('input',()=>state.profileDirty=true);
$('fact-form').addEventListener('input',()=>factDirty=true);
$('fact-form').addEventListener('reset',()=>factDirty=false);
$('artifact-editor').addEventListener('input',event=>{if(event.target.matches('[data-bullet]'))materialDirty=true;});
$('profile-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{collectProfile();await api('/profile',{profile:state.profile,expected_version:state.version},'PUT');state.profileDirty=false;await refresh();notify('真实资料已保存到本地数据库');},e.submitter);});
window.addEventListener('beforeunload',event=>{if(state.profileDirty){event.preventDefault();event.returnValue='';}});
function renderFacts(){
  const list=$('fact-list');list.replaceChildren();document.querySelectorAll('[data-linked-record]').forEach(e=>e.replaceChildren());
  const selector=$('fact-record');const old=selector.value;selector.replaceChildren(new Option('独立事实',''));for(const f of state.facts.filter(f=>f.record_id&&f.origin==='profile'))selector.add(new Option(f.title,f.record_id));selector.value=old;
  for(const fact of state.facts.filter(f=>f.origin==='confirmed')){
    const item=el('article',undefined,'item');const head=el('div',undefined,'section-head');head.append(el('h3',fact.title),el('span',fact.comfort,'tag'));item.append(head,el('pre',sourceText(fact)));
    for(const href of fact.evidence||[]){const link=el('a','打开证据');link.href=href;link.target='_blank';link.rel='noreferrer';item.append(link,el('br'));}
    item.append(act('编辑补充内容',()=>{if(state.profileDirty)throw new Error('请先保存当前资料');state.editingFact=fact.id;const form=$('fact-form');for(const key of ['title','text','record_id','context','actions','results','comfort'])form.elements[key].value=fact[key]||'';form.elements.technologies.value=(fact.technologies||[]).join('、');form.elements.evidence.value=(fact.evidence||[]).join('\n');$('cancel-fact').hidden=false;$('fact-composer').open=true;notify('补充内容已载入下方编辑器');}));
    const target=fact.record_id?document.querySelector(`[data-linked-record="${CSS.escape(fact.record_id)}"]`):null;(target||list).append(item);
  }
}
$('cancel-fact').addEventListener('click',()=>{state.editingFact=null;$('fact-form').reset();$('cancel-fact').hidden=true;});
$('fact-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{if(state.profileDirty)throw new Error('请先保存当前资料，再保存补充内容');const payload=Object.fromEntries(new FormData(e.target));payload.technologies=payload.technologies.split(/[,，、\n]/).map(x=>x.trim()).filter(Boolean);payload.evidence=payload.evidence.split('\n').map(x=>x.trim()).filter(Boolean);payload.expected_version=state.version;await api('/facts'+(state.editingFact?'/'+encodeURIComponent(state.editingFact):''),payload,state.editingFact?'PUT':'POST');state.editingFact=null;e.target.reset();$('cancel-fact').hidden=true;await refresh();notify('已保存确认事实');},e.submitter);});
$('job-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{const payload={...Object.fromEntries(new FormData(e.target)),mode:state.mode};const job=await api('/jobs/parse',payload);e.target.reset();await refresh();await matchJob(job.id);},e.submitter);});
function renderJobs(){
  const list=$('job-list');list.replaceChildren();const jobs=state.jobs.filter(job=>job.mode===state.mode);if(!jobs.length)empty(list,'当前场景还没有申请机会。保存岗位或学校要求后开始准备。');
  for(const job of jobs){const item=el('article',undefined,'item');item.append(el('h2',job.title),el('p',job.organization||'未填写组织'));const status=el('select');status.setAttribute('aria-label',`${job.title}申请状态`);for(const label of ['准备中','已投递','面试中','录取','未通过','已结束'])status.add(new Option(label,label));status.value=job.status;status.addEventListener('change',()=>run(async()=>{await api(`/jobs/${job.id}/status`,{status:status.value},'PUT');job.status=status.value;notify('已更新本地申请状态');}));const details=el('details');details.append(el('summary','查看提取的要求'),el('pre',job.parsed.requirements.join('\n')));item.append(details);const actions=el('div',undefined,'actions');actions.append(act('选择相关事实',()=>matchJob(job.id)),status);item.append(actions);list.append(item);}
}
async function matchJob(id){
  const match=await api(`/jobs/${id}/match`,{},'POST');const panel=$('match-panel');panel.replaceChildren();panel.hidden=false;panel.append(el('h2',match.job.title+' · 内容选择'),el('p','按本地关键词相关度排序。勾选需要的事实，用上下移动调整输出顺序；未命中不代表不适合。'));
  for(const fact of match.facts){const row=el('div',undefined,'fact-choice');const label=el('label',undefined,'check-row');const check=el('input');check.type='checkbox';check.value=fact.id;check.dataset.factChoice='true';check.checked=fact.score>0;const content=el('div');content.append(el('strong',fact.title),el('p',fact.reason+' · '+fact.comfort),el('pre',fact.text,'source'));label.append(check,content);row.append(label,act('上移',()=>{const prev=row.previousElementSibling;if(prev?.classList.contains('fact-choice'))panel.insertBefore(row,prev);}),act('下移',()=>{const next=row.nextElementSibling;if(next?.classList.contains('fact-choice'))panel.insertBefore(next,row);}));panel.append(row);}
  const generate=act('根据所选事实生成简历草稿',async()=>{const fact_ids=[...panel.querySelectorAll('[data-fact-choice]:checked')].map(e=>e.value);if(!fact_ids.length)throw new Error('请至少选择一条事实');const artifact=await api('/resume/plan',{job_id:id,fact_ids,expected_version:match.version,kind:'resume'});await refresh();show('artifacts');openArtifact(artifact);},'primary');panel.append(generate);
}
function renderArtifacts(){
  const list=$('artifact-list');list.replaceChildren();const artifacts=state.artifacts.filter(a=>a.mode===state.mode);if(!artifacts.length)empty(list,'尚未生成材料。先在“申请机会”选择事实。');
  for(const artifact of artifacts){const item=el('article',undefined,'item');const head=el('div',undefined,'section-head');head.append(el('h2',artifact.job_title),el('span',artifact.status==='approved'?'已审阅':'草稿','tag'));item.append(head,el('p',`事实版本 ${artifact.source_profile_version} · 材料修订 ${artifact.revision} · ${artifact.bullets.length} 条来源内容`));if(artifact.stale)item.append(el('p','事实库已有新版本，请重新选择事实生成。','error'));item.append(act('打开材料与来源',()=>openArtifact(artifact)));list.append(item);}
}
let pdfUrl;
function openArtifact(artifact){
  materialDirty=false;
  const panel=$('artifact-editor');panel.replaceChildren();panel.hidden=false;if(pdfUrl){URL.revokeObjectURL(pdfUrl);pdfUrl=null;}
  panel.append(el('h2',artifact.job_title+' · 材料审阅'),el('p','每条内容都保留生成时的来源快照。你可以改写；保存时检查数字和来源，其他语义仍需逐条核对。'));
  for(const [index,bullet]of artifact.bullets.entries()){const box=el('div',undefined,'artifact-bullet');const text=el('textarea');text.rows=5;text.value=bullet.text;text.dataset.bullet=index;text.setAttribute('aria-label',`第 ${index+1} 条材料`);const details=el('details');details.append(el('summary','查看来源与表达上限'));for(const id of bullet.source_facts){const source=artifact.sources[id];details.append(el('h3',source.title+' · '+source.comfort),el('pre',sourceText(source),'source'));for(const href of source.evidence||[]){const link=el('a','打开证据');link.href=href;link.target='_blank';link.rel='noreferrer';details.append(link,el('br'));}}box.append(el('strong',`内容 ${index+1}`),text,details);panel.append(box);}
  const notice=el('p',artifact.validation.review.join('；')||'原文摘录：来源检查通过。','hint');panel.append(notice);
  const history=el('details');history.append(el('summary','查看材料修订历史'));history.append(act('读取历史',async()=>{const revisions=await api(`/artifacts/${artifact.id}/history`);history.replaceChildren(el('summary','材料修订历史'));for(const revision of revisions){const item=el('details');item.append(el('summary',`修订 ${revision.revision} · ${revision.status==='approved'?'已审阅':'草稿'}`),el('pre',revision.bullets.map(b=>b.text).join('\n\n')));history.append(item);}}));panel.append(history);
  const review=el('label',undefined,'check-row');const checked=el('input');checked.type='checkbox';review.append(checked,el('span','我已逐条核对数字、实体、技术、结果、因果关系和表达强度。'));
  const actions=el('div',undefined,'actions');
  const save=act('保存改写并校验',async()=>{const bullets=artifact.bullets.map((bullet,index)=>({...bullet,text:panel.querySelector(`[data-bullet="${index}"]`).value.trim()}));artifact=await api(`/artifacts/${artifact.id}`,{bullets,expected_revision:artifact.revision},'PUT');await refresh();openArtifact(artifact);notify('改写已保存；材料需要重新审阅确认');});
  const approve=act('确认材料',async()=>{if([...panel.querySelectorAll('[data-bullet]')].some((input,index)=>input.value!==artifact.bullets[index].text))throw new Error('请先保存改写再确认');if(!checked.checked)throw new Error('请先逐条核对并勾选确认');artifact=await api(`/artifacts/${artifact.id}/approve`,{expected_revision:artifact.revision,reviewed:true});await refresh();openArtifact(artifact);notify('材料已审阅，可以编译 PDF');});
  const compile=act('编译并预览 PDF',async()=>{if([...panel.querySelectorAll('[data-bullet]')].some((input,index)=>input.value!==artifact.bullets[index].text))throw new Error('有未保存改写，请先保存');await api(`/artifacts/${artifact.id}/compile`,{});const blob=await api(`/artifacts/${artifact.id}/pdf`,null,'GET',true);if(pdfUrl)URL.revokeObjectURL(pdfUrl);pdfUrl=URL.createObjectURL(blob);let frame=panel.querySelector('iframe');if(!frame){frame=el('iframe');frame.title='简历 PDF 预览';panel.append(frame);}frame.src=pdfUrl;actions.append(act('保存当前 PDF',()=>download(blob,`career-${artifact.id}.pdf`)));notify('PDF 已准备好；请预览后在申请页面选择文件上传');},'primary');compile.disabled=artifact.status!=='approved';actions.append(save,approve,compile,act('下载 LaTeX 源文件',async()=>download(await api(`/artifacts/${artifact.id}/tex`,null,'GET',true),`career-${artifact.id}.tex`)));panel.append(review,actions);
  const ai=el('details');ai.append(el('summary','可选：用模型生成另一种表达'));
  ai.append(el('p','仅在你点击授权按钮后，将本材料来源事实和岗位要求发送到下方模型服务。来源可能包含你填写的履历；密钥仅用于本次请求，不保存。AI 草稿另存，不修改事实库。'));
  const aiForm=el('div',undefined,'form-grid');
  const address=inputField('HTTPS 模型 API 地址','');const model=inputField('模型名称','');const key=inputField('API Key','');key.querySelector('input').type='password';
  const style=el('select');style.setAttribute('aria-label','表达类型');for(const name of ['简历要点','自我介绍','STAR 面试叙述'])style.add(new Option(name,name));
  aiForm.append(address,model,key,style,act('同意发送所列来源并生成草稿',async()=>{
    const base_url=address.querySelector('input').value.trim();if(!base_url.startsWith('https://'))throw new Error('请输入 HTTPS 模型地址');
    const next=await api(`/artifacts/${artifact.id}/adapt`,{expected_revision:artifact.revision,base_url,model:model.querySelector('input').value.trim(),api_key:key.querySelector('input').value,style:style.value,consent:true});
    key.querySelector('input').value='';await refresh();openArtifact(next);notify('AI 草稿已另存，需逐条核对后确认');
  }));ai.append(aiForm);panel.append(ai);
}
async function download(blob,name){if(desktop){const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('无法准备保存文件'));reader.readAsDataURL(blob);});await native('save',{name,data});return;}throw new Error('请在桌面应用中导出文件');}
$('backup').addEventListener('click',()=>run(async()=>download(new Blob([JSON.stringify(await api('/backup'),null,2)],{type:'application/json'}),'career-os-backup.json')));
$('import-profile').addEventListener('change',()=>run(async()=>{if(!state.token)throw new Error('请先连接');const remote=await api('/profile');if(remote.version!==0)throw new Error('事实库已有资料，首次导入不会覆盖它；请使用资料编辑器修改');const file=$('import-profile').files[0];if(!file)return;const profile=JSON.parse(await file.text());await api('/profile',{profile,expected_version:0},'PUT');await refresh();notify('旧资料已导入，原文件保留');}));
renderMode();
if(desktop){await run(refresh);if(state.profile)native('ready');else native('error',{name:'Initial profile load failed'});}
