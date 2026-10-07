// Upgrade actions use the established views and preserve the 0.3.5 visual system.
function segmentPageStart(s){const max=Math.max(0,Math.ceil(s.segments.length/12)-1);return Math.min(Math.max(0,UI.segmentPage||0),max)*12;}
function nextCreationStep(p){
 if(!p.script.trim())return ['导入剧本','import-script'];
 if(!p.analysis||p.analysisDirty)return ['建立 / 更新故事记忆','analyze'];
 if(!p.assets.length)return ['提取人物、场景与道具','extract-assets'];
 if(p.assets.some(a=>a.status!=='confirmed'||a.sourceReview))return ['下一步：前往资产确认','page','assets'];
 if(p.facts.some(f=>f.status==='stale'||f.critical&&f.status!=='confirmed'))return ['下一步：前往事实核对','page','facts'];
 if(p.planDraft?.complete)return ['审阅规划草稿','plan-review'];
 if(!p.sequences.length)return ['规划连续事件','plan-sequences'];
 return ['下一步：前往分镜规划','page','shots'];
}
const upgradeAct=act;
act=async function(action,d={}){
 if(action==='rescue-project'||action==='rescue-and-close'){showRescueGuide(action==='rescue-and-close');return;}
 if(action==='about'){const info=await call('app:info');showModal('关于观澜',`<h3>观澜 ${esc(info.version)} · ${esc(info.edition)}</h3><p>资料目录：${esc(info.storage)}</p><p>本版提供可跳过的启动片头、原创深海工作台、仅统计观澜模型调用的 Token 看板，并补齐逐镜表演与空间锚点提示词。个人设置与救援工具保留在原有入口。</p><p>${esc(info.signed)}。文字提示词仍须在外部生成工具中核对实际画面。</p>${btn('资料存储位置','data-folder')}`,null,true);return;}
 if(S.storageBusy)throw Error('资料迁移中，请稍候');
 if(S.job)return upgradeAct(action,d);
 if(action==='issue-locate'){const text=d.issue||'',g=segmentBy(d.id),match=/镜(\d+)/.exec(text);if(/事实/.test(text)){S.page='facts';render();}else if(/资产/.test(text)){S.page='assets';render();}else if(/原文/.test(text)){await upgradeAct('source-bind',d);}else if(match&&/声音|人声|反应|旁白|独白|说话|进出/.test(text)){showPerformanceEditor(g,Number(match[1])-1);}else showStateEditor(g,match?String(Number(match[1])-1):'start');return;}
 if(action==='import-knowledge'||action==='import-folder'){await upgradeAct(action,d);const items=S.knowledge.filter(k=>!k.builtin);showModal('导入资料 · 启用前审阅','<p>新增资料默认不启用。先检查内容、版本及适用阶段；学习资料不会自行覆盖项目语言、叙事模式与已确认事实。</p>'+items.map(k=>'<section class="card"><b>'+esc(k.name)+'</b><p>版本 '+esc(k.version)+' · '+esc((k.stages||[]).join(' / '))+'</p>'+btn('审阅内容与适用范围','knowledge-detail',`data-id="${k.id}"`)+'</section>').join(''),null,true);return;}
 if(action==='performance-edit'){showPerformanceEditor(segmentBy(d.id),Number(d.index));return;}
 if(action==='audio-add'){const box=$('audio-rows');const next=Math.max(-1,...[...box.children].map(el=>Number(el.dataset.audioRow)))+1;box.insertAdjacentHTML('beforeend',audioRow(next,{}));return;}
 if(action==='audio-remove'){document.querySelector('[data-audio-row="'+d.index+'"]')?.remove();return;}
 if(action==='start-draft'){const s=selectedSequence(),g=segmentBy(d.id);if(s.segments.indexOf(g)>0)throw Error('后续片段必须继承前段，请在第一段设计开场');await runJob('设计开场状态草稿',async p=>{const ids=p.assets.filter(a=>s.assetIds.includes(a.id)&&a.kind==='character').map(a=>a.id);const ctx=C.context(p,s,g,S.knowledge);const data=await askJSON(DIRECTOR,ctx.text+'\n只建议本段开场，不改剧情。输出JSON {"states":'+JSON.stringify(stateExample)+'}。全部人物ID：'+ids.join(',')+'。presence只能为present/offscreen/absent。',v=>{const e=C.stateErrors(v.states,ids,'建议开场');if(e.length)throw Error(e.join('；'));});g.startStateDraft={states:data.states,source:C.hash(g.sourceText),at:new Date().toISOString()};});await act('start-draft-review',d);return;}
 if(action==='start-draft-review'){const s=selectedSequence(),g=segmentBy(d.id),draft=g.startStateDraft;if(!draft)throw Error('尚无开场草稿');showModal('审阅开场建议', '<pre class="source">'+esc(stateDescription(S.project,draft.states))+'</pre><p>采用后仍可在连续状态中逐人调整。</p>',async()=>{if(C.hash(g.sourceText)!==draft.source)throw Error('原文已变化，请重新生成');snapshotSegment(g);g.stageStart=C.clone(draft.states);g.startState=stateDescription(S.project,g.stageStart);if(g.shots[0])g.shots[0].stateIn=C.clone(g.stageStart);g.reviewed=false;C.invalidateAfter(s,s.segments.indexOf(g),'开场建议已采用');await persist();render();},true,'采用开场建议');return;}
 if(action==='segment-page'){UI.segmentPage=Number(d.index)||0;render();document.querySelector('main').scrollTop=0;return;}
 if(action==='select-sequence')UI.segmentPage=0;
 if(action==='plan-review'){

  const p=S.project,draft=p.planDraft;if(!draft?.complete)throw Error('暂无完整规划草稿');
  const rows=seqs=>seqs.map(s=>`<li>${esc(s.title)} · ${s.segments.length} 段 · ${s.segments.reduce((n,g)=>n+g.shots.length,0)} 个已写镜头<details><summary>查看原文范围与时长</summary>${s.segments.map(g=>`<p>${g.duration}秒 · 字符${g.sourceStart??'?'}–${g.sourceEnd??'?'}<br>${esc(g.sourceText.slice(0,180))}${g.sourceText.length>180?'…':''}</p>`).join('')}</details></li>`).join('');
  const stamp=C.hash(JSON.stringify(p.sequences));
  showModal('审阅全剧规划草稿',`<p>采用后替换当前段落结构；原方案与手动修改完整保存在规划历史中，不会混入新方案。</p><h3>当前方案</h3><ul>${rows(p.sequences)||'<li>尚无段落</li>'}</ul><h3>新规划</h3><ul>${rows(draft.sequences)}</ul><p>新规划不自动继承旧镜头，需重新设计、检查原文与连续性。</p>`,async()=>{
   if(p!==S.project||C.hash(JSON.stringify(p.sequences))!==stamp)throw Error('当前方案已变化，请重新审阅');
   const key=signature(p.script+C.narrativeGuide(p)+JSON.stringify(p.assets.map(a=>[a.id,a.name,a.aliases])));if(key!==draft.key)throw Error('剧本或资产已变化，请重新规划');
   p.planHistory||=[];p.planHistory.unshift({id:C.id('plan'),at:new Date().toISOString(),sequences:C.clone(p.sequences)});
   p.sequences=C.clone(draft.sequences);p.planDraft=null;S.seqId=p.sequences[0]?.id;await persist();render();
  },true,'保留旧方案并采用草稿');return;
 }
 if(action==='plan-history'){
  showModal('规划历史', (S.project.planHistory||[]).map((h,i)=>`<section class="card"><p>${esc(h.at)} · ${h.sequences.length} 组</p>${btn('恢复为待审核方案','plan-restore',`data-index="${i}"`)}</section>`).join('')||'<p>尚无历史方案。</p>',null,true);return;
 }
 if(action==='plan-restore'){
  const p=S.project,h=p.planHistory?.[Number(d.index)];if(!h)throw Error('历史方案不存在');
  confirmAction('恢复旧规划','当前方案也将保存到历史，恢复后必须重新审核。',async()=>{const restored=C.clone(h.sequences);p.planHistory.unshift({id:C.id('plan'),at:new Date().toISOString(),sequences:C.clone(p.sequences)});p.sequences=restored;C.touch(p,'恢复历史规划');S.seqId=restored[0]?.id;await persist();render();});return;
 }
 if(action==='project-settings'||action==='edit-shot'){
  await upgradeAct(action,d);
  // Change bindings only inside this drawer. Uncommitted values never enter the project.
  const fields=[...$('modal-body').querySelectorAll('[data-bind]')];for(const el of fields){el.dataset.draftOriginal=el.value;el.dataset.draftBind=el.dataset.bind;delete el.dataset.bind;}
  $('modal-body').querySelector('.muted').textContent='点击保存后生效；关闭会放弃本次未保存修改。';
  $('modal-submit').textContent='保存修改';
  S.modalSubmit=async()=>{const adapterKey=action==='project-settings'&&window.validateProjectSettings?.();for(const el of fields){if(el.value===el.dataset.draftOriginal)continue;el.dataset.bind=el.dataset.draftBind;el.dispatchEvent(new Event('input',{bubbles:true}));delete el.dataset.bind;}if(action==='project-settings'&&adapterKey){if(S.project.adapter!==adapterKey){S.project.adapter=adapterKey;S.project.adapterSettings={};}}await persist();render();};
  return;
 }
 return upgradeAct(action,d);
};
const upgradeShotsView=shotsView;
shotsView=function(){return upgradeShotsView()+`<div class="toolbar">${S.project.planDraft?.complete?btn('审阅新规划草稿','plan-review'):''}${btn('规划历史','plan-history')}</div>`;};
const performanceShotEditor=shotEditor;
shotEditor=function(g,j){return performanceShotEditor(g,j)+'<div class="toolbar">'+btn('声音与逐人反应','performance-edit',`data-id="${g.id}" data-index="${j}"`)+btn('关联成片结果','result-new',`data-id="${g.id}" data-index="${j}"`)+'</div>';};
const guideShotsView=shotsView;
shotsView=function(){let html=guideShotsView();const s=selectedSequence(),g=s?.segments[0];if(s&&s.segments.length>12){const page=segmentPageStart(s)/12,total=Math.ceil(s.segments.length/12);html+='<div class="toolbar">'+btn('上一页','segment-page',`data-index="${page-1}" ${page===0?'disabled':''}`)+'<span>片段第 '+(page+1)+' / '+total+' 页 · 每页 12 段</span>'+btn('下一页','segment-page',`data-index="${page+1}" ${page===total-1?'disabled':''}`)+'</div>';}if(g)html+='<div class="toolbar">'+btn('设计第一段开场草稿','start-draft',`data-id="${g.id}"`)+(g.startStateDraft?btn('审阅开场草稿','start-draft-review',`data-id="${g.id}"`):'')+'</div>';return html;};
// Startup runs after all interface modules have loaded (product-ui.js).
