/* A project launcher, separate from the screenplay editor and the canvas. */
WS_PAGES.dashboard='首页';
icons.dashboard='M3 11 12 3l9 8v10H3z M8 21v-8h8v8';
function dashboardStats(p){const sequences=p?.sequences||[],shots=sequences.flatMap(s=>(s.segments||[]).flatMap(g=>g.shots||[]));return {scenes:sequences.length,shots:shots.length,assets:p?.assets?.length||0,results:p?.videoResults?.length||0};}
function dashboardProjectCard(p){const count=dashboardStats(p),current=S.project?.id===p.id;return `<article class="dashboard-project ${current?'current':''}"><div class="dashboard-project-art" aria-hidden="true"><span>观澜 / DIRECTOR</span><b>${esc((p.name||'作品').slice(0,2))}</b></div><div class="dashboard-project-info"><span class="dashboard-kicker">${esc(profiles[p.selectedProfile]||'创作项目')} · ${count.shots} 镜 · ${count.assets} 项资产</span><h3 title="${esc(p.name)}">${esc(p.name)}</h3><p>${p.script?.trim()?'剧本已就绪':'等待导入剧本'} · ${count.results} 版成片</p><div class="dashboard-project-actions">${btn('继续逐镜制作','dashboard-open',`data-id="${esc(p.id)}" data-target="workbench"`,'primary')}${btn('打开画布','dashboard-open',`data-id="${esc(p.id)}" data-target="canvas"`)}${btn('剧本','dashboard-open',`data-id="${esc(p.id)}" data-target="home"`)}</div></div></article>`;}
function dashboardView(){const p=S.project,stats=dashboardStats(p),recent=[...S.projects].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).slice(0,6);return `<div class="dashboard-home"><section class="dashboard-hero"><div class="dashboard-hero-copy"><span class="dashboard-kicker">GUANLAN · AI DIRECTOR STUDIO</span><h1>从构想到镜头，<br><em>让创作继续。</em></h1><p>选择逐镜制作，延续导演方案与成片检查；或打开自由画布，从素材和想法开始探索。两条路径互不打乱。</p><div class="dashboard-hero-actions">${p?btn('继续逐镜制作','page','data-page="workbench"','primary'):btn('新建作品','new-project','','primary')}${p?btn('打开无限画布','page','data-page="canvas"'):btn('体验原创示例','sample')}</div></div><div class="dashboard-hero-visual" aria-hidden="true"><div class="dashboard-orbit orbit-one"></div><div class="dashboard-orbit orbit-two"></div><div class="dashboard-viewfinder"><span>GL / 01</span><strong>观景 · 取势 · 成片</strong><small>故事由你掌镜</small></div></div></section><section class="dashboard-launch"><div class="dashboard-section-head"><div><span class="dashboard-kicker">CREATE / 创作入口</span><h2>今天从哪里开始</h2></div>${p?`<span class="dashboard-project-caption">当前项目 · ${esc(p.name)}</span>`:''}</div><div class="dashboard-launch-grid"><button class="dashboard-launch-card" data-action="${p?'page':'new-project'}" ${p?'data-page="home"':''}><span class="dashboard-launch-index">01 · STORY</span><strong>写剧本与搭建故事</strong><p>导入原文、整理记忆与人物依据，再进入分镜规划。</p><span class="dashboard-launch-arrow">进入剧本 →</span></button><button class="dashboard-launch-card" data-action="${p?'page':'new-project'}" ${p?'data-page="workbench"':''}><span class="dashboard-launch-index">02 · SHOT BY SHOT</span><strong>逐镜导演制作</strong><p>按场景顺序设计镜头、生成候选、回看与交付。</p><span class="dashboard-launch-arrow">进入镜头工作区 →</span></button><button class="dashboard-launch-card" data-action="${p?'page':'new-project'}" ${p?'data-page="canvas"':''}><span class="dashboard-launch-index">03 · FREE CANVAS</span><strong>无限画布探索</strong><p>自由放置资产、提示词与生成节点；逐镜提示词可按需引用。</p><span class="dashboard-launch-arrow">打开画布 →</span></button></div></section><section class="dashboard-bottom"><div class="dashboard-recents"><div class="dashboard-section-head"><div><span class="dashboard-kicker">LIBRARY / 我的创作</span><h2>最近项目</h2></div>${btn('新建项目','new-project')}</div>${recent.length?`<div class="dashboard-project-grid">${recent.map(dashboardProjectCard).join('')}</div>`:`<div class="dashboard-first"><strong>还没有作品</strong><p>创建一个项目后，剧本、资产、逐镜方案和画布都保存在本机。</p>${btn('创建第一个项目','new-project','','primary')}</div>`}</div><aside class="dashboard-side"><span class="dashboard-kicker">WORKSPACE / 当前工作</span><h2>${p?esc(p.name):'准备创作'}</h2><div class="dashboard-stats"><div><strong>${stats.scenes}</strong><span>场景</span></div><div><strong>${stats.shots}</strong><span>镜头</span></div><div><strong>${stats.assets}</strong><span>资产</span></div><div><strong>${stats.results}</strong><span>成片</span></div></div><div class="dashboard-side-links">${btn('统一资产库','page','data-page="library"')}${btn('拉片学习','page','data-page="film"')}${btn('AI 实验室','page','data-page="tools"')}</div></aside></section></div>`;}
registerAction('dashboard-open',async d=>{if(!S.projects.some(p=>p.id===d.id))throw Error('项目已移除');if(S.project?.id!==d.id)await selectProject(d.id);const page=['home','workbench','canvas'].includes(d.target)?d.target:'dashboard';if(page==='workbench')WS.view='studio';S.page=page;render();});
function dashboardShotStage(r){
 const references=DW.refs(S.project,r.sh).filter(x=>!x.stale&&x.asset?.references?.[0]?.data),reference=references[0];
 const results=(S.project.videoResults||[]).filter(x=>x.shot?.id===r.sh.id),heading=`${r.s.title} · 镜 ${r.j+1}`;
 const media=reference?`<img src="${esc(reference.asset.references[0].data)}" alt="${esc(reference.asset.name)}参考图，非生成画面">`:`<div class="production-stage-placeholder"><span class="production-stage-reticle"></span><strong>SHOT ${String(r.j+1).padStart(2,'0')}</strong></div>`;
 return `<section class="production-stage" aria-label="当前镜头创作监看"><div class="production-stage-screen">${media}<span class="production-stage-corner top-left"></span><span class="production-stage-corner top-right"></span><span class="production-stage-corner bottom-left"></span><span class="production-stage-corner bottom-right"></span><div class="production-stage-overlay"><small>${reference?'资产参考 · 非本镜成片':'导演方案 · 待生成画面'}</small><strong>${esc(heading)}</strong><span>${esc((r.sh.frame||'画面待补充').slice(0,90))}</span></div></div><div class="production-stage-controls"><div><span class="dashboard-kicker">SHOT PRODUCTION</span><p>${esc(r.sh.camera||'机位待设定')} · ${esc(r.sh.motion||'运镜待设定')} · ${wsTime(r.sh.duration)}</p></div><div class="toolbar">${btn('生成本镜候选','dashboard-generate-shot','','primary')}${btn(`查看成片 ${results.length?'('+results.length+')':''}`,'dashboard-results')}${btn('资产参考','dashboard-reference')}</div></div></section>`;
}
const dashboardBasePreview=wsPreview;
wsPreview=function(r){const html=dashboardBasePreview(r);return S.page==='workbench'&&WS.view==='studio'&&WS.tab==='plan'&&r?dashboardShotStage(r)+html:html;};
registerAction('dashboard-generate-shot',async()=>{if(!wsCurrent())throw Error('请先选择镜头');WS.tab='result';render();await videoOpen();});
registerAction('dashboard-results',()=>{WS.tab='result';render();});
registerAction('dashboard-reference',()=>{WS.tab='reference';render();});
function canvasStudioLayout(){
 const p=requireProject(),graph=flowGraph();
 confirmAction('整理画布','按连接方向重新排列节点与逐镜引用卡。只改变卡片位置，不修改内容或连线。',async()=>{
  const rank=new Map(graph.shotIds.map(id=>[id,0])),byId=new Map(graph.nodes.map(n=>[n.id,n]));
  function level(id,visiting=new Set()){
   if(rank.has(id))return rank.get(id);
   if(visiting.has(id))return 0;
   visiting.add(id);
   const node=byId.get(id),base={asset:0,image:0,audio:0,video:0,prompt:1,director:1,generate:2}[node?.type]??0;
   const parents=graph.edges.filter(e=>e.to===id).map(e=>level(e.from,new Set(visiting))+1);
   const value=Math.min(6,Math.max(base,...parents));rank.set(id,value);return value;
  }
  for(const node of graph.nodes)level(node.id);
  const lanes=new Map();for(const id of [...graph.shotIds,...graph.nodes.map(n=>n.id)]){
   const column=rank.get(id)||0,position=lanes.get(column)||0;
   const x=120+column*360,y=120+position*320;lanes.set(column,position+1);
   if(byId.has(id)){byId.get(id).x=x;byId.get(id).y=y;}else{p.canvasPositions||={};p.canvasPositions[id]={x,y};}
  }
  await persist();render();canvasFit();
 });
}
const dashboardBaseRender=render;
const CANVAS_STUDIO={rendering:false,inspectorOpen:false,videoUrls:new Map()};
function canvasStudioVideos(){
 if(S.page!=='canvas'||VIDEO.projectId!==S.project?.id)return;
 for(const card of document.querySelectorAll('.canvas-graph-generate')){
  const node=flowNode(card.dataset.flowNode),job=VIDEO.jobs.find(x=>x.projectId===S.project.id&&x.status==='succeeded'&&x.file?.path&&(node?.shotId?x.shotId===node.shotId:x.canvasNodeId===node?.id));
  if(!job||card.querySelector('.canvas-video-surface'))continue;
  const surface=document.createElement('div');surface.className='canvas-video-surface';surface.addEventListener('pointerdown',event=>event.stopPropagation());
  surface.innerHTML=`<video controls preload="metadata" aria-label="${esc(flowLabel(node))}生成结果"></video>`;
  card.querySelector('.canvas-graph-actions')?.before(surface);
  const video=surface.querySelector('video'),known=CANVAS_STUDIO.videoUrls.get(job.id);
  if(known)video.src=known;else call('video:preview',job.id).then(url=>{CANVAS_STUDIO.videoUrls.set(job.id,url);if(surface.isConnected)video.src=url;}).catch(()=>{if(surface.isConnected)surface.remove();});
 }
}
function canvasStudioCloseButton(){const inspector=$('canvas-inspector');if(inspector&&!inspector.querySelector('[data-action="canvas-inspector-close"]'))inspector.insertAdjacentHTML('afterbegin',btn('×','canvas-inspector-close','aria-label="关闭节点详情" title="关闭节点详情"','canvas-inspector-close'));}
const dashboardCanvasShotSelect=canvasUpSelect;
canvasUpSelect=function(id){dashboardCanvasShotSelect(id);if(!CANVAS_STUDIO.rendering){CANVAS_STUDIO.inspectorOpen=true;document.querySelector('.canvas-shell')?.classList.add('has-selection');canvasStudioCloseButton();}};
const dashboardCanvasNodeSelect=flowSelect;
flowSelect=function(id){dashboardCanvasNodeSelect(id);if(!CANVAS_STUDIO.rendering){CANVAS_STUDIO.inspectorOpen=true;document.querySelector('.canvas-shell')?.classList.add('has-selection');canvasStudioCloseButton();}};
registerAction('canvas-inspector-close',()=>{CANVAS_STUDIO.inspectorOpen=false;CANVAS_UP.selected=null;CANVAS_FLOW.selected=null;document.querySelector('.canvas-shell')?.classList.remove('has-selection');document.querySelectorAll('.shot-canvas-node,.canvas-graph-node').forEach(n=>n.classList.remove('selected'));});
render=function(){if(S.page!=='canvas')CANVAS_STUDIO.inspectorOpen=false;CANVAS_STUDIO.rendering=true;try{dashboardBaseRender();}finally{CANVAS_STUDIO.rendering=false;}const nav=$('nav');if(nav&&!nav.querySelector('[data-page="dashboard"]'))nav.insertAdjacentHTML('afterbegin',`<div class="dashboard-nav-entry">${navItem('dashboard','首页')}</div>`);document.body.classList.toggle('dashboard-page',S.page==='dashboard');const shell=document.querySelector('.canvas-shell');if(shell&&$('canvas-inspector')){shell.classList.toggle('has-selection',CANVAS_STUDIO.inspectorOpen);canvasStudioCloseButton();canvasStudioVideos();}};
