const C=DirectorCore,$=id=>document.getElementById(id),call=(name,...args)=>desk.call(name,...args);
const S={projects:[],project:null,knowledge:[],settings:{},page:'dashboard',assetId:null,seqId:null,filter:'all',job:null,saveTimer:null,saveChain:Promise.resolve(),modalSubmit:null};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={character:'人物',scene:'场景',prop:'道具'},profiles={general:'通用影视',manju:'AI漫剧',shortfilm:'叙事短片',commercial:'广告',mv:'音乐视频',documentary:'纪录片',animation:'动画',custom:'自定义'};
const btn=(text,action,data='',cls='')=>`<button type="button" class="${cls}" data-action="${action}" ${data}>${text}</button>`;
const opts=(items,value)=>Object.entries(items).map(([k,v])=>`<option value="${esc(k)}" ${String(k)===String(value)?'selected':''}>${esc(v)}</option>`).join('');
const ta=(label,value,bind,extra='')=>`<label>${label}<textarea data-bind="${bind}" ${extra}>${esc(value)}</textarea></label>`;
const field=(label,value,bind,extra='')=>`<label>${label}<input data-bind="${bind}" value="${esc(value)}" ${extra}></label>`;
function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(S.toastTimer);S.toastTimer=setTimeout(()=>$('toast').style.display='none',6500);}
function showModal(title,body,submit=null,wide=false,label='保存'){$('modal-title').textContent=title;$('modal-body').innerHTML=body;$('modal').classList.toggle('wide',wide);$('modal-submit').classList.toggle('hidden',!submit);$('modal-submit').textContent=label;$('modal-error').classList.add('hidden');S.modalSubmit=submit;if(!$('modal').open)$('modal').showModal();setTimeout(()=>$('modal-body').querySelector('input,textarea')?.focus(),30);}
function closeModal(){$('modal').close();S.modalSubmit=null;}
function confirmAction(title,description,action){showModal(title,`<p>${esc(description)}</p>`,action,false,'确认');}
function saveSoon(){if(!S.project)return;$('save-status').textContent='待保存';clearTimeout(S.saveTimer);S.saveTimer=setTimeout(()=>persist().catch(showError),500);}
function persist(){clearTimeout(S.saveTimer);S.saveTimer=null;if(!S.project)return S.saveChain;const p=C.clone(S.project);S.saveChain=S.saveChain.catch(()=>{}).then(()=>call('projects:save',p)).then(result=>{const live=S.projects.find(x=>x.id===p.id);if(live)live.updatedAt=result.updatedAt;$('save-status').textContent='已保存到本机';}).catch(e=>{$('save-status').textContent='保存失败 · 请备份';throw e;});return S.saveChain;}
function showError(e){toast(String(e.message||e).replace(/^Error invoking remote method '[^']+': Error: /,''));}
async function selectProject(id){if(S.job)throw Error('任务进行中，请等待完成或停止后再切换项目');await persist();S.project=S.projects.find(p=>p.id===id);S.assetId=null;S.seqId=null;S.page='dashboard';render();}
function requireProject(){if(!S.project)throw Error('请先创建或选择一个项目');return S.project;}
function selectedAsset(){return S.project?.assets.find(a=>a.id===S.assetId);}
function selectedSequence(){return S.project?.sequences.find(s=>s.id===S.seqId);}
function segmentBy(id){return selectedSequence()?.segments.find(g=>g.id===id);}
function markScriptChanged(p){p.analysisDirty=Boolean(p.analysis);p.scriptRevision++;C.scriptChanged(p);for(const seq of p.sequences)for(const g of seq.segments){g.stale=true;g.reviewed=false;g.staleReason='剧本版本已更改';}}
function snapshotAsset(a){a.versions.push({at:new Date().toISOString(),name:a.name,basis:a.basis,design:a.design,continuity:a.continuity,references:C.clone(a.references),aliases:C.clone(a.aliases||[]),variants:a.variants||'',sourceRevision:a.sourceRevision,sourceReview:a.sourceReview,revision:a.revision});if(a.versions.length>20)a.versions.shift();}
function snapshotSegment(g){if(!g.prompt&&!g.shots.length)return;const snap=C.clone(g);delete snap.history;g.history.push({at:new Date().toISOString(),value:snap});if(g.history.length>20)g.history.shift();}
function render(){
 const nav={home:'▦ 创作工作台',assets:'◇ 资产圣经',shots:'▤ 连续分镜',prompts:'✦ 提示词输出',memory:'◌ 项目记忆',knowledge:'▥ 导演知识库',facts:'◎ 事实台账',rules:'◈ 导演规则',review:'☷ 审稿与验证',delivery:'⇧ 冻结交付',recovery:'↺ 资料恢复',history:'↺ 任务记录'};
 $('nav').innerHTML=Object.entries(nav).map(([key,name])=>btn(name,'page',`data-page="${key}"`,S.page===key?'active':'')).join('');
 $('projects').innerHTML=S.projects.map(p=>btn(esc(p.name),'select-project',`data-id="${p.id}"`,S.project?.id===p.id?'active':'')).join('');
 $('breadcrumb').textContent=`${S.project?.name||'本机工作区'} / ${nav[S.page]?.slice(2)||''}`;
 $('model-status').textContent=S.settings.model?`${S.settings.model} · ${S.settings.provider==='local'?'本机接口':'云端接口'}（未保证在线）`:'请配置模型';
 if(!S.project&&!['dashboard','projects','library','knowledge','history','recovery','guide','film','usage','diagnosis','tools'].includes(S.page)){$('content').innerHTML=`<div class="empty card"><i>✦</i><h1>从一个故事开始</h1><p class="muted">导入完整剧本，建立故事记忆与视觉资产，再设计连续镜头和提示词。</p>${btn('创建导演项目','new-project','','primary')}</div>`;return;}
 const pages={dashboard:dashboardView,projects:projectLibraryView,library:globalLibraryView,tools:()=>toolsView(),film:filmView,guide:guideView,usage:()=>typeof usageView==='function'?usageView():'',diagnosis:()=>typeof diagnosisView==='function'?diagnosisView():'',workbench:workbenchView,canvas:canvasView,methods:methodsView,home:homeView,assets:assetsView,shots:shotsView,prompts:promptsView,memory:memoryView,knowledge:knowledgeView,history:historyView,facts:factsView,rules:rulesView,review:reviewView,delivery:deliveryView,recovery:recoveryView};$('content').innerHTML=pages[S.page]();
 if(S.job)$('content').querySelectorAll('input,textarea,select').forEach(el=>el.disabled=true);
}
function pageHead(title,subtitle,actions=''){return `<div class="page-head"><div><div class="eyebrow">DIRECTOR WORKSPACE</div><h1>${title}</h1><div class="muted">${subtitle}</div></div><div class="row wrap">${actions}</div></div>`;}
async function runJob(name,fn){
 if(S.job)throw Error('已有任务运行中');const p=requireProject();const job={id:C.id('job'),name,startedAt:new Date().toISOString(),status:'running',outputs:[],steps:[],sourceRevision:p.scriptRevision};p.jobs.unshift(job);p.jobs=p.jobs.slice(0,50);S.job={record:job,cancelled:false,requestId:null,project:p};$('jobbar').style.display='flex';$('job-message').textContent=name;$('job-progress').removeAttribute('value');render();
 try{await fn(p);if(S.job.cancelled)throw Error('任务已停止');job.status='completed';toast(name+'已完成');}catch(e){job.status=S.job.cancelled?'cancelled':'failed';job.error=e.message;showError(e);}finally{job.finishedAt=new Date().toISOString();S.job=null;$('jobbar').style.display='none';await persist().catch(showError);render();}
}
function jobStep(message){if(S.job?.cancelled)throw Error('任务已停止');$('job-message').textContent=message;S.job?.record.steps.push({at:new Date().toISOString(),message});}
async function ask(system,user,images=[]){if(!S.job)throw Error('任务未启动');if(S.job.cancelled)throw Error('任务已停止');const requestId=C.id('req');S.job.requestId=requestId;const output=await call('model:generate',{requestId,system,user,images,projectId:S.project?.id,projectName:S.project?.name});if(S.job.cancelled)throw Error('任务已停止');S.job.record.outputs.push({at:new Date().toISOString(),text:output});return output;}
desk.onProgress(data=>{if(S.job?.requestId===data.requestId){if(data.usage){S.job.record.usage||=[];S.job.record.usage.push(data.usage);}if(data.message){toast(data.message);}const last=S.job.record.steps.at(-1)?.message||S.job.record.name;$('job-message').textContent=`${last} · 已接收 ${data.characters} 字`;}});
async function boot(){const outcomes=await Promise.allSettled([call('projects:list'),call('knowledge:list'),call('settings:get')]);S.projects=outcomes[0].status==='fulfilled'?outcomes[0].value.map(C.normalize):[];S.knowledge=outcomes[1].status==='fulfilled'?outcomes[1].value:[];S.settings=outcomes[2].status==='fulfilled'?outcomes[2].value:{};S.project=S.projects[0]||null;render();const failures=outcomes.filter(x=>x.status==='rejected').map(x=>x.reason.message);if(failures.length)toast('部分资料未能读取，其余功能可继续使用：'+failures.join('；'));}
