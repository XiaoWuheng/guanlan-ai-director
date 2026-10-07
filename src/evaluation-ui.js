registerAction('result-batch',async()=>{
  const p=requireProject(),files=await call('files:results');if(!files?.length)return;
  const rows=DW.rows(p),labels=Object.fromEntries(rows.map(r=>[r.sh.id,`${r.s.title} · 片段 ${r.s.segments.indexOf(r.g)+1} / 镜 ${r.j+1}`]));
  if(!rows.length)throw Error('项目尚无镜头，请先完成分镜规划');
  const guess=file=>{const m=file.name.match(/(?:^|\D)(\d{1,3})[-_](\d{1,3})(?:\D|$)/);if(!m)return '';const hits=rows.filter(r=>r.s.segments.indexOf(r.g)+1===Number(m[1])&&r.j+1===Number(m[2]));return hits.length===1?hits[0].sh.id:'';};
  showModal('批量关联外部成片',`<p>选择每个文件所属镜头；文件名中的“片段-镜号”仅用于预选，请逐项确认。视频仍保存在原位置。</p><div class="result-batch-list">${files.map((file,i)=>`<label>${esc(file.name)}<select data-result-map="${i}">${opts({'':'请选择镜头',...labels},guess(file))}</select></label>`).join('')}</div><p class="muted">导入后状态为“待检查”；实际画面与提示词仍须人工核对。</p>`,async()=>{
   const selected=files.map((file,i)=>({file,shotId:document.querySelector(`[data-result-map="${i}"]`)?.value}));
   if(selected.some(x=>!x.shotId))throw Error('请为每个文件选择所属镜头');
   const records=selected.map(({file,shotId})=>{const r=rows.find(x=>x.sh.id===shotId),shot=C.clone(r.sh);return {id:C.id('result'),at:new Date().toISOString(),sequenceId:r.s.id,segmentId:r.g.id,shotIndex:r.j,basisFingerprint:C.dependencyStamp(p,r.s,r.g),shot,prompt:C.promptText(r.s,{...r.g,shots:[shot]},p),file,decision:'pending',reason:'待人工检查',model:''};});
   const before=p.videoResults||[];p.videoResults=[...before,...records];try{await persist();}catch(e){p.videoResults=before;throw e;}render();toast(`已关联 ${records.length} 个文件，请逐镜检查`);
  },true,'确认关联');return;
});
registerAction('result-export-prompts',async()=>{
 const p=requireProject(),rows=DW.rows(p);if(!rows.length)throw Error('项目尚无镜头');
 const text=rows.map((r,i)=>{
  const label=`${r.s.title} / 片段 ${r.s.segments.indexOf(r.g)+1} / 镜 ${r.j+1}`;
  return [`# ${String(i+1).padStart(3,'0')} ${label}`,`镜头 ID：${r.sh.id}`,`审核状态：${r.g.reviewed&&!r.g.stale?'已审核':'待审核／待复核'}`,`计划时长：${r.sh.duration||'未设'} 秒`,'',C.promptText(r.s,{...r.g,shots:[r.sh]},p)].join('\n');
 }).join('\n\n'+ '='.repeat(48)+'\n\n');
 const saved=await call('files:export',{name:p.name+'-逐镜提示词',format:'txt',text});
 if(saved)toast(`已导出 ${rows.length} 镜提示词；待审核镜头需复核后再用于生成`);
});
const evaluationAct=act;
act=async function(action,d={}){
 if(S.job||S.storageBusy)return evaluationAct(action,d);
 if(action==='result-new'){
  const p=S.project,s=selectedSequence(),g=segmentBy(d.id),sh=g.shots[Number(d.index)];const file=await call('files:result');if(!file)return;
  const stamp=C.dependencyStamp(p,s,g),shot=C.clone(sh);
  showModal('关联成片与本次提示词',`<p>${esc(file.name)} · ${(file.bytes/1048576).toFixed(1)} MB</p><p>只保存文件位置及提示词快照，不复制视频；移动视频后需重新关联。</p>${modalSelect('result-decision','人工判断',{pass:'可用',revise:'需返工',fail:'不可用'},'revise')}${area('result-reason','实际表现与返工原因','')}${inputHtml('result-model','实际使用的视频模型','')}`,async()=>{if(!$('result-reason').value.trim())throw Error('请填写观察结果');p.videoResults||=[];p.videoResults.push({id:C.id('result'),at:new Date().toISOString(),sequenceId:s.id,segmentId:g.id,shotIndex:Number(d.index),basisFingerprint:stamp,shot,prompt:C.promptText(s,{...g,shots:[shot]},p),file,decision:$('result-decision').value,reason:$('result-reason').value.trim(),model:$('result-model').value.trim()});await persist();render();},true,'保存结果记录');return;
 }
 if(action==='evaluation-new'){
  showModal('记录同题创作评估',`<p>同一剧本、同一质量标准，分别记录原流程与本版本实际耗时；不填估计值。评分为人工评价，不代表自动通过。</p>${inputHtml('eval-name','案例名称','')}${modalSelect('eval-kind','场景',{dialogue:'多语对白',narration:'旁白推文',silent:'无声短片',continuity:'跨段连续动作',long:'跨章节事实'},'continuity')}${inputHtml('eval-old','原流程用时（分钟）','','number')}${inputHtml('eval-new','本版本用时（分钟）','','number')}${inputHtml('eval-score','人工可用性评分（1–5）','','number')}${inputHtml('eval-reworks','返工镜头数','','number')}${area('eval-evidence','评审标准与证据记录','')}`,async()=>{const before=Number($('eval-old').value),after=Number($('eval-new').value),score=Number($('eval-score').value),reworks=Number($('eval-reworks').value);if(![before,after,score,reworks].every(Number.isFinite)||before<=0||after<=0||score<1||score>5||!Number.isInteger(reworks)||reworks<0||!$('eval-reworks').value||!$('eval-name').value.trim()||!$('eval-evidence').value.trim())throw Error('请填写完整的实际时间、1–5分、非负整数返工数与证据');S.project.experiments.push({id:C.id('eval'),type:'paired-manual',name:$('eval-name').value.trim(),scenario:$('eval-kind').value,beforeMinutes:before,afterMinutes:after,score,reworkShots:reworks,evidence:$('eval-evidence').value.trim(),at:new Date().toISOString(),model:S.settings.model,appVersion:(await call('app:info')).version});await persist();render();},true,'记录实际评估');return;
 }
 if(action==='evaluation-export'){const p=S.project;await call('files:export',{name:p.name+'-评估与成片记录',format:'json',text:JSON.stringify({format:'director-evidence',version:1,project:p.name,experiments:p.experiments,results:p.videoResults||[]},null,2)});return;}
 return evaluationAct(action,d);
};
const evaluationReview=reviewView;
reviewView=function(){const p=S.project,rows=p.experiments.filter(e=>e.type==='paired-manual'),saving=rows.length?rows.reduce((n,e)=>n+e.beforeMinutes-e.afterMinutes,0):0;return evaluationReview()+`<section class="card"><h2>同题评估与成片反馈</h2><p>${rows.length?`${rows.length} 个实际录入样本，累计时间差 ${saving.toFixed(1)} 分钟（正数为节省）。样本未经独立核实，不外推总体效果。`:'尚无同题实测数据。建议覆盖多语对白、旁白、无声、跨段动作和跨章节事实。'}</p><div class="toolbar">${btn('记录同题评估','evaluation-new')}${btn('导出评估证据','evaluation-export')}</div>${(p.videoResults||[]).map(r=>`<details><summary>${esc(r.file.name)} · ${esc(r.decision)} · 镜${r.shotIndex+1}</summary><p>${esc(r.reason)}</p><p>${esc(r.file.path)}</p><pre class="source">${esc(r.prompt)}</pre></details>`).join('')}</section>`;};
