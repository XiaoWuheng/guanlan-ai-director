// First-use guidance stays outside the project data model. A manual draft never calls a model.
function firstUseHasShots(p){return p.sequences.some(s=>s.segments.some(g=>g.shots.length));}
function firstUseModelReady(){const active=PRODUCT.hub?.profiles?.find(x=>x.id===PRODUCT.hub.activeChat);if(active)return Boolean(active.model&&(active.provider==='local'||active.hasKey));return Boolean(S.settings.model&&(S.settings.provider==='local'||S.settings.hasKey));}
const firstUseNextStep=nextCreationStep;
nextCreationStep=function(p){if(p.script.trim()&&!firstUseModelReady())return ['连接文字模型','settings'];return firstUseNextStep(p);};
workflow=function(p){const segments=p.sequences.flatMap(s=>s.segments),steps=[['剧本',Boolean(p.script.trim())],['资产',p.assets.length>0&&p.assets.every(a=>a.status==='confirmed'&&!a.sourceReview)],['规划',p.sequences.length>0],['镜头',segments.some(g=>g.shots.length)],['审核',segments.length>0&&segments.every(g=>g.reviewed&&!g.stale)],['交付',p.deliveries.length>0]];return `<div class="workflow" aria-label="制作进度">${steps.map(([label,done],i)=>`<span class="workflow-step ${done?'done':''}" aria-label="${label}，${done?'已完成':'待完成'}"><span class="step-number">${done?'✓':i+1}</span>${label}</span>`).join('')}</div>`;};
const firstUseHome=homeView;
homeView=function(){const p=S.project;let html=firstUseHome();if(!p.script.trim())html=html.replace(btn('导入 TXT / Word / PDF','import-script','','small'),'');if(p.script.trim()&&!firstUseHasShots(p)){const guidance=`<section class="card first-use-path"><div><h2>先做出第一镜</h2><p>文字模型可以自动分析与规划；未连接模型，也能从当前剧本建立一镜草稿。填好画面、动作和首尾状态后再审核。</p></div><div class="toolbar">${btn('手动建立第一镜草稿','first-shot','','primary')}${!firstUseModelReady()?btn('连接文字模型','settings'):''}</div></section>`;html=html.replace('<div class="context-strip">',guidance+'<div class="context-strip">');}return html.replace('<h2>故事记忆</h2>','<h2 title="从剧本提取的人物、事件与因果摘要；需要人工核对原文">故事记忆</h2>');};
const firstUseAssets=assetsView;
assetsView=function(){let html=firstUseAssets();if(!S.project.assets.length)html=html.replace(btn('手动新增','new-asset'),'');return html;};
const firstUseShots=shotsView;
shotsView=function(){let html=firstUseShots();if(!S.project.sequences.length)html=html.replace(btn('新建段落组','new-sequence'),'');return html;};
const firstUseReview=reviewView;
reviewView=function(){const p=S.project;if(!firstUseHasShots(p)&&!p.comments.length&&!p.feedback.length&&!p.experiments.length)return pageHead('审稿与验证','有分镜后，再核对画面、动作和连续性')+emptyState('这里还没有待审镜头','先在规划页建立分镜；审核通过后才能冻结交付。',btn('建立第一镜草稿','first-shot','','primary'));return firstUseReview();};
const firstUseAct=act;
act=async function(action,d={}){
 if(action==='first-shot'){
  const p=requireProject();if(!p.script.trim()){S.page='home';render();toast('先粘贴或导入一段剧本，再建立第一镜');return;}
  if(firstUseHasShots(p)){S.page='shots';render();toast('已有镜头，请在规划页继续编辑');return;}
  if($('modal').open)closeModal();let s=p.sequences[0];if(!s){s={id:C.id('s'),title:'第一场 · 手动规划',episode:'',scene:'',event:'',template:'director',assetIds:[],segments:[]};p.sequences.push(s);}
  let g=s.segments[0];if(!g){g={id:C.id('g'),duration:5,sourceText:p.script.trim().slice(0,800),startState:'',endState:'',stageStart:[],stageEnd:[],factIds:[],shots:[],history:[],prompt:'',reviewed:false,stale:false,stateSchema:1};s.segments.push(g);}
  g.shots.push({id:C.id('sh'),duration:Number(g.duration)||5,...Object.fromEntries(Object.keys(C.shotFields).map(k=>[k,'']))});g.reviewed=false;S.seqId=s.id;UI.selectedShot=g.id+'-0';S.page='shots';await persist();render();toast('第一镜草稿已建立。请填写原文、画面、动作和首尾状态，再人工审核。');return;
 }
 if(['analyze','extract-assets','extract-facts','plan-sequences','generate-segment','qa','asset-sheet'].includes(action)){
  if(!PRODUCT.hub)try{PRODUCT.hub=await call('connections:list');}catch{}
  if(!firstUseModelReady()){showModal('先连接文字模型',`<p>这项操作会调用文字模型。当前没有可用连接，因此尚未开始任务，也不会消耗额度。</p><p>你可以先连接模型，或手动建立第一镜草稿继续熟悉流程。</p><div class="toolbar">${btn('打开模型中心','settings','','primary')}${S.project?.script?.trim()?btn('手动建立第一镜草稿','first-shot'):''}</div>`);return;}
 }
 return firstUseAct(action,d);
};
const firstUseError=showError;
showError=function(error){firstUseError(error);if($('modal').open)return;clearTimeout(S.errorDismissTimer);const panel=$('persistent-error');if(!panel)return;const saving=$('save-status')?.textContent.includes('失败');panel.dataset.persistent=saving?'true':'false';if(!saving)S.errorDismissTimer=setTimeout(()=>{if(panel.isConnected&&panel.dataset.persistent!=='true')panel.remove();},7000);};
const firstUsePersist=persist;
persist=function(){return firstUsePersist().then(value=>{if($('save-status')?.textContent.includes('已保存')){const panel=$('persistent-error');if(panel?.dataset.persistent==='true')panel.remove();}return value;});};
const firstUseModalError=presentModalError;
presentModalError=function(error){firstUseModalError(error);clearTimeout(S.modalErrorDismissTimer);const panel=$('modal-error');S.modalErrorDismissTimer=setTimeout(()=>{if(panel)panel.classList.add('hidden');},7000);};
const firstUseRender=render;
render=function(){firstUseRender();if(!S.project&&S.page==='home'){document.querySelector('#content .empty .muted')?.insertAdjacentText('beforeend',' 观澜负责导演方案、提示词与成片检查；可连接 Seedance 2.5 / 2.0 系列 生成单镜候选，剪辑在外部工具完成。');}if(S.page==='review'&&document.querySelector('#content .page-head')&&document.querySelector('#content .empty'))document.querySelector('#content .page-head').after(document.querySelector('#content .empty'));if(S.page==='workbench'&&S.project&&!firstUseHasShots(S.project)){const studio=document.querySelector('#content .ws-studio');if(studio)studio.outerHTML=`<section class="card first-use-empty"><h2>从第一镜开始</h2><p>这里用于检查镜头方案、参考图和外部成片。建立第一镜后，镜头列表与参数面板才会出现。</p><div class="toolbar">${btn('手动建立第一镜草稿','first-shot','','primary')}${btn('查看规划与生成','page','data-page="shots"')}</div></section>`;document.querySelector('#content .ws-toolbar')?.remove();document.body.classList.remove('ws-working');}};

