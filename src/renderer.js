const api = window.directorDesk;
let projects = [];
let current = null;
let settings = { provider:'qwen', baseUrl:'https://dashscope.aliyuncs.com/compatible-mode/v1', model:'qwen3.7-plus', localUrl:'http://localhost:11434/v1', apiKey:'' };
let saveTimer;
let assetFilter='all';
const kindNames={character:'人物',scene:'场景',prop:'道具'};
const kindMarks={character:'人',scene:'景',prop:'物'};
const $ = (id) => document.getElementById(id);
const toast = (message) => { const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(el._timer); el._timer=setTimeout(()=>el.classList.remove('show'),2300); };
const escapeHtml = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function init(){
  settings = {...settings, ...(await api.getSettings())};
  projects = await api.listProjects(); renderProjects();
  if(projects.length) selectProject(projects[0].id); else showEmpty();
  updateModelBadge();
  $('script-text').addEventListener('input',()=>{ if(!current)return; current.script=$('script-text').value; if(current.analysis)current.analysisDirty=true; $('script-count').textContent=`${current.script.length.toLocaleString()} 字`; $('story-progress').style.width=current.script.trim()?(current.analysis&&!current.analysisDirty?'100%':'26%'):'0';renderMemory();scheduleSave(); });
  $('new-project').onclick=createProject; $('create-first').onclick=createProject;
  $('import-script').onclick=importScript; $('analyze-script').onclick=analyzeScript;
  $('open-settings').onclick=showSettings; $('top-settings').onclick=showSettings;
  $('save-now').onclick=()=>saveProject(true);
  $('profile-button').onclick=()=>$('profile-dialog').showModal();
  $('stage-back').onclick=showProjectDashboard;
  $('generate-assets').onclick=generateAssets;
  $('add-asset').onclick=addManualAsset;
  $('add-sequence').onclick=()=>{$('sequence-form').classList.remove('hidden');$('sequence-title').focus();};
  $('cancel-sequence').onclick=()=>{$('sequence-form').classList.add('hidden');};
  $('save-sequence').onclick=createSequence;
  $('prompts-to-shots').onclick=()=>goStage('shots');
  $('provider').onchange=providerChanged; $('save-settings').onclick=saveSettings;
  document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  document.querySelectorAll('.profile-list button').forEach(b=>b.onclick=()=>{if(current){current.selectedProfile=b.dataset.profile;saveProject();renderProfile();}$('profile-dialog').close();});
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>goStage(b.dataset.stage));
  document.querySelectorAll('.nav[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  $('add-knowledge').onclick=()=>toast('知识资料导入会在下一阶段接入来源标注与规则校验。');
  $('knowledge-coming').onclick=()=>toast('可扩展知识模块正在规划中。');
  document.querySelectorAll('[data-asset-filter]').forEach(b=>b.onclick=()=>{assetFilter=b.dataset.assetFilter;document.querySelectorAll('[data-asset-filter]').forEach(x=>x.classList.toggle('active',x===b));renderAssets();});
  $('asset-list').addEventListener('input',onAssetInput);$('asset-list').addEventListener('click',onAssetClick);
  $('sequence-list').addEventListener('input',onSequenceInput);$('sequence-list').addEventListener('click',onSequenceClick);
}
function showEmpty(){ $('no-project').classList.remove('hidden'); $('project-workspace').classList.add('hidden'); $('crumb-project').textContent='创作工作台'; current=null; }
function renderProjects(){
  $('project-list').innerHTML=projects.map(p=>`<button class="project-item ${current?.id===p.id?'active':''}" data-id="${p.id}"><i class="project-dot"></i>${escapeHtml(p.name)}</button>`).join('');
  document.querySelectorAll('.project-item').forEach(b=>b.onclick=()=>selectProject(b.dataset.id));
}
async function createProject(){
  const name=prompt('给这部作品起个名字：','新短片'); if(name===null)return;
  const project=await api.createProject(name.trim()||'新项目'); projects.unshift(project); renderProjects(); selectProject(project.id); toast('项目已创建，剧本和导演记忆会保存在本机。');
}
function selectProject(id){
  current=projects.find(p=>p.id===id); if(!current)return;
  current.assets ||= [];current.sequences ||= [];
  $('no-project').classList.add('hidden'); $('project-workspace').classList.remove('hidden');
  showProjectDashboard();
  $('project-title').textContent=current.name; $('crumb-project').textContent=current.name;
  $('script-text').value=current.script||''; $('script-count').textContent=`${(current.script||'').length.toLocaleString()} 字`;
  $('story-progress').style.width=current.script?.trim()?(current.analysis?'100%':'26%'):'0';
  renderMemory();renderProfile();renderAssets();renderSequences();renderPromptPanel();renderProjects();
}
function scheduleSave(){ $('save-hint').textContent='正在保存…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveProject(),650); }
async function saveProject(showToast=false){
  if(!current)return;
  current.script=$('script-text').value;
  try{current=await api.saveProject(current);projects=projects.map(p=>p.id===current.id?current:p);renderProjects();$('save-hint').textContent='已自动保存到本机';$('project-updated').textContent='本机项目记忆 · 刚刚保存';$('save-now').textContent='✓ 已保存';if(showToast)toast('项目已保存');}
  catch(e){$('save-hint').textContent='保存失败';toast(e.message);}
}
async function importScript(){
  try{const file=await api.readScript();if(!file)return;if(!current){await createProject();if(!current)return;}current.script=file.text;$('script-text').value=file.text;$('script-count').textContent=`${file.text.length.toLocaleString()} 字`;scheduleSave();toast(`已导入 ${file.name}`);}
  catch(e){toast(e.message);}
}
const profiles={general:'通用影视',manju:'AI漫剧',shortfilm:'短片创作',commercial:'广告视频',custom:'自定义配置'};
function renderProfile(){if(!current)return;$('profile-label').textContent=profiles[current.selectedProfile]||profiles.general;}
function renderMemory(){
  const out=$('memory-result');
  if(!current?.analysis){$('memory-empty').classList.remove('hidden');out.classList.add('hidden');return;}
  $('memory-empty').classList.add('hidden');out.classList.remove('hidden');out.innerHTML=`${current.analysisDirty?'<div class="memory-warning">剧本内容有改动。请重新分析全剧后，再生成资产和分镜。</div>':''}<div>${markdownToHtml(current.analysis)}</div>`;
}
function markdownToHtml(text){
  return escapeHtml(text).split('\n').map(line=>{
    if(line.startsWith('### '))return `<h3>${line.slice(4)}</h3>`;
    if(line.startsWith('## '))return `<h2>${line.slice(3)}</h2>`;
    if(line.startsWith('# '))return `<h2>${line.slice(2)}</h2>`;
    if(line.startsWith('- ')||line.startsWith('• '))return `<div>• ${line.slice(2)}</div>`;
    return line?`<div>${line}</div>`:'<div style="height:5px"></div>';
  }).join('');
}
function profileGuidance(){
  const common={general:'采用均衡的影视叙事、表演与视听设计。',manju:'强化情绪可视化、眼神和微动作、人物反应网络与有效切镜；避免人物失活。',shortfilm:'关注主题、人物弧光、视听母题、节奏和结尾余韵。',commercial:'关注受众、核心卖点、产品出场逻辑、品牌安全和视觉记忆点。',custom:'遵循当前项目已启用的规则模块。'};
  return common[current?.selectedProfile]||common.general;
}
async function analyzeScript(){
  if(!current)return; const script=$('script-text').value.trim(); if(script.length<80){toast('请先导入或粘贴更完整的剧本，再做全篇分析。');return;}
  if(!settings.model){showSettings();toast('先配置一个云端或本机模型名称。');return;}
  const button=$('analyze-script');button.disabled=true;
  const common=`你是一名资深影视导演与剧本分析师，为“AI导演台”建立可持续检索的项目故事记忆。当前配置：${profiles[current.selectedProfile]||profiles.general}。${profileGuidance()} 严格区分剧本事实与导演解读；不得补写、改写或提前揭示事实。不确定处标记待确认，不展示内部思维过程，不写分镜提示词。`;
  const chunkTexts=splitScript(script,12500,650);const hash=await hashText(script);
  try{
    let summaries=current.analysisSourceHash===hash&&Array.isArray(current.analysisChunks)?current.analysisChunks:[];
    for(let i=0;i<chunkTexts.length;i++){
      if(summaries[i]?.index===i)continue;
      button.textContent=`分析剧本 ${i+1}/${chunkTexts.length}`;
      const result=await api.generate({settings,system:`${common}\n这是完整剧本的一部分。仅提取本段可证实信息，不假设已知后文。保留人物原名、事件因果、时间/场景、人物认知、信息揭示、情绪变化、道具状态变化和未解问题。标出衔接线索。控制在900字以内。`,user:`剧本分块 ${i+1}/${chunkTexts.length}，全文约 ${Math.round(i/chunkTexts.length*100)}% 位置：\n\n${chunkTexts[i]}`});
      summaries[i]={index:i,range:`${i+1}/${chunkTexts.length}`,content:result};current.analysisChunks=summaries;current.analysisSourceHash=hash;
      current.memory=[{kind:'script-chunk-index',sourceHash:hash,updatedAt:new Date().toISOString(),chunks:summaries}];await saveProject();
    }
    let level=summaries.map(x=>x.content),round=0;
    const mergePrompt=`${common}\n把按剧本顺序排列的分块记忆整合为故事事实索引。去重但保留首次出现位置及后续变化；区分真实时间和叙事呈现顺序；标明人物在揭晓之前不知道的信息。矛盾列为待确认。控制在1500字以内。`;
    while(level.join('\n').length>13000){const groups=groupText(level,10500),next=[];for(let i=0;i<groups.length;i++){button.textContent=`整理故事记忆 ${++round} · ${i+1}/${groups.length}`;next.push(await api.generate({settings,system:mergePrompt,user:`归并这组顺序记忆，供最终全篇汇总使用：\n\n${groups[i]}`}));}level=next;}
    button.textContent='生成全剧故事圣经…';
    const bible=await api.generate({settings,system:`${common}\n输出有层次、可检索的全剧故事圣经。包含：故事概览；主线事件（真实时间和叙事顺序）；人物关系、动机、情绪弧及认知边界；冲突与情绪转折；信息揭晓、伏笔回收；场景清单；关键道具状态；连续性硬约束；待确认项。不要臆测外形或美术细节。`,user:`以下为全剧分块记忆，依原文顺序整理。请综合汇总，不要把后文信息提前归给早期人物认知。\n\n${level.join('\n\n---\n\n')}`});
    const result=`## 全剧故事圣经\n${bible}\n\n## 记忆覆盖\n原剧本分为 ${chunkTexts.length} 个重叠片段分析；每个分块记忆和汇总记忆均保存在本机项目资料中。`;
    current.analysis=result;current.analysisSourceHash=hash;current.analysisDirty=false;current.analysisChunks=summaries;current.memory=[{kind:'story-bible',sourceHash:hash,updatedAt:new Date().toISOString(),content:result,chunks:summaries}];
    await saveProject();renderMemory();$('story-progress').style.width='100%';toast(`全剧记忆已建立，共 ${chunkTexts.length} 个分块。`);
  }catch(e){toast(`${e.message}。已完成的分块记忆已保存在项目中，可重试续做。`);}
  finally{button.disabled=false;button.textContent='✦ 分析全剧';}
}
function splitScript(text,maxChars,overlap){
  const pieces=text.split(/(?<=\n\s*\n)/);const chunks=[];let buf='';
  for(const part of pieces){if(part.length>maxChars){if(buf){chunks.push(buf);buf='';}for(let i=0;i<part.length;i+=maxChars-overlap)chunks.push(part.slice(i,i+maxChars));continue;}
    if(buf&&buf.length+part.length>maxChars){chunks.push(buf);buf=buf.slice(-overlap)+part;}else buf+=part;}
  if(buf.trim())chunks.push(buf);return chunks.length?chunks:[text];
}
function groupText(items,maxChars){const groups=[];let buf='';for(const item of items){const next=(buf?'\n\n':'')+item;if(buf&&buf.length+next.length>maxChars){groups.push(buf);buf=item;}else buf+=next;}if(buf)groups.push(buf);return groups;}
async function hashText(text){const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(data)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function showSettings(){
  $('provider').value=settings.provider||'qwen';$('base-url').value=settings.baseUrl||'https://dashscope.aliyuncs.com/compatible-mode/v1';$('api-key').value=settings.apiKey||'';$('model-name').value=settings.model||'qwen3.7-plus';$('local-url').value=settings.localUrl||'http://localhost:11434/v1';toggleProviderFields();$('settings-status').textContent='';$('settings-dialog').showModal();
}
function providerChanged(){
  const provider=$('provider').value;
  if(provider==='qwen'){$('base-url').value='https://dashscope.aliyuncs.com/compatible-mode/v1';$('model-name').value='qwen3.7-plus';}
  if(provider==='cloud'&&!$('base-url').value.includes('openai.com')){$('base-url').value='https://api.openai.com/v1';$('model-name').value='';}
  if(provider==='local'){$('model-name').value='qwen2.5:14b';}
  toggleProviderFields();
}
function toggleProviderFields(){const local=$('provider').value==='local';$('local-wrap').classList.toggle('hidden',!local);$('key-wrap').classList.toggle('hidden',local);$('base-wrap').classList.toggle('hidden',local);}
async function saveSettings(){
  settings={provider:$('provider').value,baseUrl:$('base-url').value.trim(),apiKey:$('api-key').value.trim(),model:$('model-name').value.trim(),localUrl:$('local-url').value.trim()};
  try{await api.saveSettings(settings);$('settings-status').textContent='设置已安全保存';updateModelBadge();setTimeout(()=>$('settings-dialog').close(),450);}
  catch(e){$('settings-status').textContent=e.message;}
}
function updateModelBadge(){
  const ready=Boolean(settings.model);$('model-mini-name').textContent=ready?settings.model:'云端模型未配置';
  $('model-mini-detail').textContent=ready?(settings.provider==='local'?'本机模型已连接':'云端模型已配置'):'点击配置 AI';
  document.querySelector('.model-mini .status-dot').style.background=ready?'#67ad83':'#d69c5d';
}
function switchView(view){document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===view));$('view-studio').classList.toggle('hidden',view!=='studio');$('view-knowledge').classList.toggle('hidden',view!=='knowledge');if(view==='studio')showProjectDashboard();$('crumb-project').textContent=view==='knowledge'?'导演知识库':(current?.name||'创作工作台');}
function goStage(stage){
  if(stage==='story'){showProjectDashboard();document.querySelector('.editor-card').scrollIntoView({behavior:'smooth',block:'center'});$('script-text').focus();return;}
  if(!current)return;
  const info={assets:['PROJECT ASSET BIBLE','人物 · 场景 · 道具','assets-panel'],shots:['CONTINUITY STORYBOARD','分镜与段落衔接','shots-panel'],prompts:['VIDEO PROMPT OUTPUT','视频提示词','prompts-panel']}[stage];
  if(!info)return;
  $('workflow-grid').classList.add('hidden');$('workspace-grid').classList.add('hidden');document.querySelector('.continuity-strip').classList.add('hidden');$('stage-detail').classList.remove('hidden');
  $('stage-eyebrow').textContent=info[0];$('stage-title').textContent=info[1];
  document.querySelectorAll('.stage-panel').forEach(p=>p.classList.toggle('hidden',p.id!==info[2]));
  $('crumb-project').textContent=`${current.name} / ${info[1]}`;
  renderAssets();renderSequences();renderPromptPanel();
}
function showProjectDashboard(){
  if(!$('project-workspace'))return;
  $('workflow-grid').classList.remove('hidden');$('workspace-grid').classList.remove('hidden');document.querySelector('.continuity-strip').classList.remove('hidden');$('stage-detail').classList.add('hidden');
  document.querySelectorAll('.stage-panel').forEach(p=>p.classList.add('hidden'));
  if(current)$('crumb-project').textContent=current.name;
}
function renderAssets(){
  if(!current)return;const assets=current.assets||[];
  for(const kind of ['all','character','scene','prop'])$(kind==='all'?'asset-count-all':`asset-count-${kind}`).textContent=kind==='all'?assets.length:assets.filter(a=>a.kind===kind).length;
  const items=assets.filter(a=>assetFilter==='all'||a.kind===assetFilter);
  $('asset-empty').classList.toggle('hidden',items.length>0);
  $('asset-empty').querySelector('b').textContent=assets.length?'当前分类还没有资产':'还没有项目资产';
  $('asset-empty').querySelector('p').textContent=assets.length?'切换分类查看其他资产，或从全剧记忆生成此类设计草案。':'先完成全剧分析，再提取人物、场景和道具并生成可编辑的导演设计草案。';
  $('asset-list').classList.toggle('hidden',items.length===0);
  $('asset-list').innerHTML=items.map(a=>`<article class="asset-card card" data-asset-id="${escapeHtml(a.id)}"><div class="asset-card-head"><span class="asset-kind ${a.kind}">${kindMarks[a.kind]||'资'}</span><input class="asset-name-input" data-asset-field="name" value="${escapeHtml(a.name||'未命名资产')}" ${a.status==='confirmed'?'readonly':''} aria-label="资产名称"><span class="asset-status ${a.status==='confirmed'?'confirmed':''}">${a.status==='confirmed'?'已确认':'设计草案'}</span><button class="asset-delete" data-asset-action="delete" title="删除">×</button></div><label class="asset-field">剧本依据<textarea data-asset-field="basis" ${a.status==='confirmed'?'readonly':''} placeholder="对应的原文事实、事件或信息">${escapeHtml(a.basis||'')}</textarea></label><label class="asset-field">导演设计<textarea data-asset-field="design" ${a.status==='confirmed'?'readonly':''} placeholder="外观、空间关系或可视化设计；与剧本事实区分">${escapeHtml(a.design||'')}</textarea></label><label class="asset-field">连续性要点<textarea data-asset-field="continuity" ${a.status==='confirmed'?'readonly':''} placeholder="后续镜头需要保持一致的特征和状态">${escapeHtml(a.continuity||'')}</textarea></label><div class="asset-card-actions"><span>${a.source==='ai'?'AI 草案 · 可编辑':'项目资产'}</span><button class="asset-confirm ${a.status==='confirmed'?'confirmed':''}" data-asset-action="toggle">${a.status==='confirmed'?'✓ 已确认':'确认资产'}</button></div></article>`).join('');
  $('assets-progress').style.width=assets.some(a=>a.status==='confirmed')?'100%':assets.length?'45%':'0';
}
function addManualAsset(){
  if(!current)return;const name=prompt('资产名称：');if(!name?.trim())return;
  const kindInput=(prompt('类型填写：人物 / 场景 / 道具','人物')||'人物').trim();const kind=kindInput.includes('场')?'scene':kindInput.includes('道')?'prop':'character';
  current.assets.push({id:`a_${Date.now()}`,kind,name:name.trim(),basis:'',design:'',continuity:'',status:'draft',source:'manual'});saveProject();renderAssets();
}
async function generateAssets(){
  if(!current)return;if(!settings.model){showSettings();toast('请先配置模型。');return;}
  const chunks=(current.analysisChunks||[]).map(x=>x.content).filter(Boolean);
  if(!chunks.length||current.analysisDirty){toast('先完成当前版本剧本的全剧分析，资产设计会据分块记忆展开。');return;}
  const button=$('generate-assets');button.disabled=true;const kindMap='kind 必须取 character、scene、prop 之一。';
  try{
    const groups=groupText(chunks,7000);let added=0;
    for(let i=0;i<groups.length;i++){
      button.textContent=`读取故事资产 ${i+1}/${groups.length}`;
      const content=await api.generate({settings,system:`你是资深影视美术指导与导演，负责从剧本事实中建立项目资产初稿。当前创作配置：${profiles[current.selectedProfile]||profiles.general}。${profileGuidance()} 严格区分剧本明示与创作提案。不可擅改人物身份、关系、剧情事实。设计中未知的外观、布景或道具细节要标“提案”，不能假装来自原文。人物须体现可信真人感和可表演特征，不设计蜡像式静态造型；场景须交代空间拓扑、出入口和关键站位；道具须记录剧情功能及状态。只输出严格 JSON 数组，不要 Markdown，不要```代码块。每项字段：kind,name,basis（剧本依据）,design（导演设计提案）,continuity（需跨镜保持的稳定点）。${kindMap} 每批不超过18项；同名不同阶段/时期角色作为不同资产并在名称中标明时期。`,user:`这是全剧记忆第 ${i+1}/${groups.length} 组。提取本组真正出现或明确关联的主要人物、重要场景和剧情道具，不要凭空补充。\n\n${groups[i]}`});
      const rows=parseJsonArray(content);
      for(const row of rows){const kind=['character','scene','prop'].includes(row.kind)?row.kind:(String(row.kind||'').includes('场')?'scene':String(row.kind||'').includes('道')?'prop':'character');const name=String(row.name||'').trim();if(!name)continue;
        const existing=current.assets.find(a=>a.kind===kind&&a.name.trim().toLocaleLowerCase()===name.toLocaleLowerCase());
        if(existing){if(existing.status!=='confirmed'){existing.basis=joinUnique(existing.basis,row.basis);existing.design=joinUnique(existing.design,row.design);existing.continuity=joinUnique(existing.continuity,row.continuity);}}
        else{current.assets.push({id:`a_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,kind,name,basis:String(row.basis||''),design:String(row.design||''),continuity:String(row.continuity||''),status:'draft',source:'ai'});added++;}
      }
      await saveProject();renderAssets();
    }
    toast(`资产草案已生成，新增 ${added} 项。确认前都可以编辑。`);
  }catch(e){toast(`资产生成没有完成：${e.message}`);}
  finally{button.disabled=false;button.textContent='✦ 从全剧提取并设计';}
}
function parseJsonArray(text){
  let s=String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
  const start=s.indexOf('['),end=s.lastIndexOf(']');if(start<0||end<start)throw new Error('模型没有返回可解析的资产列表，请重试。');
  const parsed=JSON.parse(s.slice(start,end+1));if(!Array.isArray(parsed))throw new Error('资产结果格式不是列表。');return parsed;
}
function joinUnique(a,b){const x=String(a||'').trim(),y=String(b||'').trim();if(!y)return x;if(!x)return y;return x.includes(y)?x:`${x}\n${y}`;}
function onAssetInput(e){
  const card=e.target.closest('[data-asset-id]');if(!card||!e.target.dataset.assetField)return;const asset=current.assets.find(a=>a.id===card.dataset.assetId);if(!asset)return;
  asset[e.target.dataset.assetField]=e.target.value;scheduleSave();
}
function onAssetClick(e){
  const btn=e.target.closest('[data-asset-action]');if(!btn)return;const card=btn.closest('[data-asset-id]');const asset=current.assets.find(a=>a.id===card.dataset.assetId);if(!asset)return;
  if(btn.dataset.assetAction==='delete'){if(!confirm(`删除资产“${asset.name}”？`))return;current.assets=current.assets.filter(a=>a.id!==asset.id);}
  else asset.status=asset.status==='confirmed'?'draft':'confirmed';saveProject();renderAssets();
}
function createSequence(){
  if(!current)return;const title=$('sequence-title').value.trim(),scene=$('sequence-scene').value.trim(),eventText=$('sequence-event').value.trim();
  if(!title||!eventText){toast('请填写段落组名称和同一事件的剧情范围。');return;}
  current.sequences.push({id:`s_${Date.now()}`,title,scene,event:eventText,segments:[],createdAt:new Date().toISOString()});
  $('sequence-title').value='';$('sequence-scene').value='';$('sequence-event').value='';$('sequence-form').classList.add('hidden');saveProject();renderSequences();$('sequence-empty').classList.add('hidden');toast('连续段落组已创建。');
}
function addSegment(sequence){
  const segments=sequence.segments||[];const previous=segments[segments.length-1];
  const segment={id:`seg_${Date.now()}`,duration:30,sourceText:'',startState:previous?.endState||'',endState:'',prompt:'',continuityQA:''};
  segments.push(segment);sequence.segments=segments;saveProject();renderSequences();
}
function renderSequences(){
  if(!current)return;const sequences=current.sequences||[];$('sequence-empty').classList.toggle('hidden',sequences.length>0);$('sequence-list').innerHTML=sequences.map(seq=>{
    const segments=seq.segments||[];
    return `<article class="sequence-card card" data-sequence-id="${escapeHtml(seq.id)}"><div class="sequence-head"><div class="sequence-mark">⟲</div><div class="sequence-head-main"><input data-sequence-field="title" value="${escapeHtml(seq.title)}"><p>${escapeHtml(seq.scene||'未设场景')} · ${segments.length} 个生成段落 · 同一事件连续</p></div><div class="sequence-tools"><button data-sequence-action="add">＋ 下一段</button><button data-sequence-action="delete">删除组</button></div></div><div class="sequence-event"><b>事件范围：</b>${escapeHtml(seq.event)}</div><div class="segment-list">${segments.length?segments.map((seg,i)=>segmentHtml(seq,seg,i)).join(''):'<div class="empty-inline">段落组已建立。先添加第一段并设定人物起始站位与动作状态。</div>'}</div>${segments.length?`<div class="sequence-handoff"><b>当前交接状态 · 第 ${segments.length} 段结束</b><p>${escapeHtml(segments[segments.length-1].endState||'尚未填写。补完当前段结束状态后，下一段会自动继承。')}</p></div>`:''}</article>`;
  }).join('');
  $('shots-progress').style.width=sequences.some(s=>s.segments?.length)?'100%':'0';renderPromptPanel();
}
function segmentHtml(seq,seg,i){
  const previous=seq.segments[i-1];if(i>0)seg.startState=previous?.endState||'';
  return `<div class="segment-card" data-segment-id="${escapeHtml(seg.id)}" data-segment-index="${i}"><div class="segment-head"><span class="segment-badge">${String(i+1).padStart(2,'0')}</span><b>生成段落 ${i+1}</b><input type="number" min="1" max="120" data-segment-field="duration" value="${Number(seg.duration)||30}" title="时长秒数"><span class="char-count">秒</span></div><label>本段剧本原文 / 事件推进<textarea data-segment-field="sourceText" placeholder="粘贴本段原文、对白或关键动作，不要用摘要替代要保留的人声。">${escapeHtml(seg.sourceText||'')}</textarea></label><label>起始状态 ${i>0?'· 自动继承上一段结束状态':'· 首段由导演设定'}</label><textarea data-segment-field="startState" ${i>0?'readonly':''} placeholder="人物空间位置与朝向、姿势和动作阶段、持物手、道具状态、环境状态、人物当前认知">${escapeHtml(seg.startState||'')}</textarea>${i>0?'<div class="handoff-note">⟲ 已从上一段末尾自动接入。若上一段末态调整，本段起始状态同步更新。</div>':''}<label>结束状态 / 下一段交接</label><textarea data-segment-field="endState" placeholder="人物最终站位、朝向、姿势、动作进度、手中物、道具位置、环境变化和认知状态">${escapeHtml(seg.endState||'')}</textarea><div class="segment-actions"><button class="generate-segment" data-sequence-action="generate" data-seg-id="${escapeHtml(seg.id)}">✦ 生成导演提示词</button><button data-sequence-action="remove-segment" data-seg-id="${escapeHtml(seg.id)}">删除本段</button></div><details class="segment-prompt" ${seg.prompt?'open':''}><summary>分镜与视频提示词草案</summary><textarea data-segment-field="prompt" placeholder="生成后可编辑；此稿仍需导演确认。">${escapeHtml(seg.prompt||'')}</textarea><div class="segment-qa">${escapeHtml(seg.continuityQA||'生成后显示连续性核对要点。')}</div></details></div>`;
}
function findSegment(sequenceId,segmentId){const seq=current.sequences.find(s=>s.id===sequenceId);const segment=seq?.segments?.find(x=>x.id===segmentId);return {seq,segment};}
function onSequenceInput(e){
  const seqCard=e.target.closest('[data-sequence-id]');if(!seqCard)return;const seq=current.sequences.find(s=>s.id===seqCard.dataset.sequenceId);if(!seq)return;
  if(e.target.dataset.sequenceField==='title'){seq.title=e.target.value;scheduleSave();return;}
  const segCard=e.target.closest('[data-segment-id]');if(!segCard||!e.target.dataset.segmentField)return;const {segment}=findSegment(seq.id,segCard.dataset.segmentId);if(!segment)return;
  const field=e.target.dataset.segmentField;segment[field]=field==='duration'?Number(e.target.value)||30:e.target.value;
  if(field==='endState'){
    let nextState=segment.endState;for(let i=Number(segCard.dataset.segmentIndex)+1;i<seq.segments.length;i++){seq.segments[i].startState=nextState;const nextCard=seqCard.querySelector(`[data-segment-id="${seq.segments[i].id}"] [data-segment-field="startState"]`);if(nextCard)nextCard.value=nextState;nextState=seq.segments[i].endState;}
  }
  scheduleSave();
}
async function onSequenceClick(e){
  const btn=e.target.closest('[data-sequence-action]');if(!btn)return;const card=btn.closest('[data-sequence-id]');const seq=current.sequences.find(s=>s.id===card.dataset.sequenceId);if(!seq)return;
  const action=btn.dataset.sequenceAction;
  if(action==='add'){const last=seq.segments?.[seq.segments.length-1];if(last&&!last.endState?.trim()){toast('先填写上一段的结束状态，下一段才能准确接续。');const textarea=card.querySelector(`[data-segment-id="${last.id}"] [data-segment-field="endState"]`);textarea?.focus();return;}addSegment(seq);return;}
  if(action==='delete'){if(!confirm(`删除段落组“${seq.title}”及其所有片段？`))return;current.sequences=current.sequences.filter(s=>s.id!==seq.id);saveProject();renderSequences();return;}
  const segId=btn.dataset.segId;const {segment}=findSegment(seq.id,segId);if(!segment)return;
  if(action==='remove-segment'){if(!confirm('删除这一段？后续段落起始状态会跟随前一段更新。'))return;seq.segments=seq.segments.filter(s=>s.id!==segId);for(let i=1;i<seq.segments.length;i++)seq.segments[i].startState=seq.segments[i-1].endState||'';saveProject();renderSequences();return;}
  if(action==='generate')await generateSegmentPrompt(seq,segment,btn);
}
function relevantMemory(query){
  const chunks=current.analysisChunks||[];if(!chunks.length)return (current.analysis||'').slice(0,9000);
  const words=String(query).match(/[\u4e00-\u9fff]{2,}|[A-Za-z0-9_]{3,}/g)||[];const unique=[...new Set(words)].slice(0,80);
  const ranked=chunks.map((item,index)=>({index,content:item.content,score:unique.reduce((n,w)=>n+(item.content.includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,4).sort((a,b)=>a.index-b.index);
  return `全剧故事圣经：\n${(current.analysis||'').slice(0,6000)}\n\n与当前场景最相关的剧本记忆：\n${ranked.map(x=>x.content).join('\n\n---\n\n')}`;
}
async function generateSegmentPrompt(seq,segment,button){
  if(!settings.model){showSettings();toast('先配置模型。');return;}
  if(!segment.sourceText.trim()){toast('先粘贴本段对应的剧本原文或事件内容。');return;}
  if(!current.analysis||current.analysisDirty){toast('先完成当前版本剧本的全剧分析，避免遗漏人物认知和信息揭晓边界。');return;}
  const index=seq.segments.indexOf(segment);if(index===0&&!segment.startState.trim()){toast('请先设定第一段人物初始站位、动作和道具状态。');return;}
  if(index>0){const prev=seq.segments[index-1];if(!prev.endState.trim()){toast('上一段还没有结束状态，暂时无法可靠衔接。');return;}segment.startState=prev.endState;}
  button.disabled=true;button.textContent='导演正在设计…';
  const confirmed=(current.assets||[]).filter(a=>a.status==='confirmed').map(a=>`${kindNames[a.kind]}「${a.name}」：${a.design}\n连续性：${a.continuity}`).join('\n\n').slice(0,7000);
  const query=`${seq.title} ${seq.scene} ${seq.event} ${segment.sourceText}`;const memory=relevantMemory(query);
  const system=`你是一位资深影视导演，为 AI 视频生成设计可执行的片段提示词。创作配置：${profiles[current.selectedProfile]||profiles.general}。${profileGuidance()}
必须遵守：不篡改原文人物、因果、对白和信息揭晓顺序；清楚区分镜头设计与剧本事实；镜头依据情绪、信息、动作和关系变化切换。每个入画人物都保持可信生命感：主要人物有符合刺激的眼神、微表情、呼吸、重心和连续动作；倾听者、背影人物和背景人物也维持克制自然的注意力及轻微姿势变化，不僵站成蜡像或背景板，不无目的乱动。动作与机位分开描述。场景空间和轴线明确。只输出一个 JSON 对象，不要 Markdown 代码围栏，字段为 directorIntent、videoPrompt、endingState、continuityQA。videoPrompt 必须能单独交给视频模型生成。endingState 需记录所有可见人物站位/朝向/姿态/动作阶段/持物手、关键道具位置与状态、环境状态、人物认知边界，供下一段原样接续。未知项写“待导演确认”，不能编造。`;
  const user=`段落组：${seq.title}\n场景资产名：${seq.scene||'待确认'}\n同一事件范围：${seq.event}\n当前片段：第 ${index+1} 段，时长约 ${segment.duration} 秒\n\n全剧记忆与本段相关事实：\n${memory}\n\n已确认资产：\n${confirmed||'暂无已确认资产；引用时用临时名称并标记待确认。'}\n\n本段剧本原文：\n${segment.sourceText}\n\n本段开始状态（必须精确从这里开始，不得重置姿势或站位）：\n${segment.startState}\n\n请设计本段的导演意图、视频提示词、结束状态和连续性核对点。剧情动作未完成时，结束状态保留真实进度，不要为了卡时长跳动作。`;
  try{
    const response=await api.generate({settings,system,user});let data;
    try{data=parseJsonObject(response);}catch{data={directorIntent:'',videoPrompt:response,endingState:'',continuityQA:'模型结果未按结构化格式返回。请检查提示词，并手动填写明确结束状态后再添加下一段。'};}
    segment.prompt=[data.directorIntent?`导演意图：${data.directorIntent}`:'',data.videoPrompt||response].filter(Boolean).join('\n\n');
    segment.endState=String(data.endingState||segment.endState||'');segment.continuityQA=Array.isArray(data.continuityQA)?data.continuityQA.join('；'):String(data.continuityQA||'');
    const nextIndex=seq.segments.indexOf(segment)+1;if(seq.segments[nextIndex])seq.segments[nextIndex].startState=segment.endState;
    await saveProject();renderSequences();renderPromptPanel();toast('本段提示词和结束状态已保存；下一段将从该状态接续。');
  }catch(e){toast(`分镜生成失败：${e.message}`);}
  finally{button.disabled=false;button.textContent='✦ 生成导演提示词';}
}
function parseJsonObject(text){let s=String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const start=s.indexOf('{'),end=s.lastIndexOf('}');if(start<0||end<start)throw new Error('模型没有返回 JSON');return JSON.parse(s.slice(start,end+1));}
function renderPromptPanel(){
  if(!$('prompt-summary')||!current)return;const rows=[];for(const seq of current.sequences||[])for(let i=0;i<(seq.segments||[]).length;i++){const seg=seq.segments[i];if(seg.prompt)rows.push({seq,seg,i});}
  $('prompts-progress').style.width=rows.length?'100%':'0';
  $('prompt-summary').classList.toggle('hidden',rows.length>0);
  let list=$('prompt-list');if(!list){list=document.createElement('div');list.id='prompt-list';list.className='prompt-list';$('prompts-panel').appendChild(list);}
  list.innerHTML=rows.map(({seq,seg,i})=>`<article class="card prompt-export"><div class="sequence-head"><span class="segment-badge">${i+1}</span><div class="sequence-head-main"><b>${escapeHtml(seq.title)} · ${i+1}段</b><p>${escapeHtml(seq.scene||'未设场景')} · ${Number(seg.duration)||30} 秒</p></div><button class="secondary-button small" data-copy-prompt="${escapeHtml(seq.id)}:${escapeHtml(seg.id)}">复制提示词</button></div><textarea readonly>${escapeHtml(seg.prompt)}</textarea><div class="segment-qa">${escapeHtml(seg.continuityQA||'')}</div></article>`).join('');
  list.querySelectorAll('[data-copy-prompt]').forEach(button=>button.onclick=async()=>{const [sid,gid]=button.dataset.copyPrompt.split(':');const {segment}=findSegment(sid,gid);if(!segment)return;try{await navigator.clipboard.writeText(segment.prompt);toast('提示词已复制。');}catch{toast('系统剪贴板暂不可用，请在分镜卡中手动复制。');}});
}
init().catch(e=>toast(e.message));
