(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./creative'));else factory(root.DirectorCore);})(globalThis,C=>{
const previous={audit:C.audit,compile:C.compile,promptText:C.promptText};
function performanceIssues(p,s,g){const issues=[],ids=s.assetIds.filter(id=>p.assets.some(a=>a.id===id&&a.kind==='character'));
 for(const [i,sh]of g.shots.entries()){
  const label=`镜${i+1}`,states=[...(sh.stateIn||[]),...(sh.stateOut||[])];
  if(g.performanceSchema===2&&states.some(a=>!a.presence))issues.push(label+'请明确每位人物的画内/画外/离场状态');
  for(const actor of sh.stateOut||[]){const before=sh.stateIn?.find(a=>a.assetId===actor.assetId);if(before&&(before.presence||'present')!==(actor.presence||'present')&&!(sh.presenceEvents||[]).some(e=>e.assetId===actor.assetId&&e.from===(before.presence||'present')&&e.to===(actor.presence||'present')&&String(e.reason||'').trim()))issues.push(label+'人物进出画缺少事件依据：'+actor.assetId);}
  if(g.performanceSchema===2||sh.actorReactions){const visible=[...new Set(states.filter(a=>!a.presence||a.presence==='present').map(a=>a.assetId))];for(const id of visible)if(!(sh.actorReactions||[]).some(r=>r.assetId===id&&String(r.text||'').trim()))issues.push(label+'缺少逐人反应：'+id);for(const r of sh.actorReactions||[])if(!ids.includes(r.assetId))issues.push(label+'反应人物不属于本组');}
  if(g.performanceSchema===2&&!Array.isArray(sh.audio))issues.push(label+'请填写结构化声音（无人声用空列表）');
  if(Array.isArray(sh.audio)&&sh.voice!==audioText(sh.audio))issues.push(label+'人声文本与结构化声音不一致，请在声音编辑器同步');
  for(const clip of sh.audio||[]){
   if(!['dialogue','narration','inner'].includes(clip.type))issues.push(label+'声音类型无效');
   if(!String(clip.text||'').trim()||!String(clip.language||'').trim())issues.push(label+'声音缺少台词或语言');
   if(!Number.isFinite(clip.start)||!Number.isFinite(clip.end)||clip.start<0||clip.end<=clip.start||clip.end>Number(sh.duration))issues.push(label+'声音时间应在镜头范围内');
   if(clip.type!=='narration'&&!ids.includes(clip.speaker))issues.push(label+'说话者必须使用本组人物ID');
   if(clip.type==='dialogue'&&!states.some(a=>a.assetId===clip.speaker&&a.presence!=='absent'))issues.push(label+'离场人物不能直接对白，需补充画外状态');
   if(clip.type==='narration'&&['drama','silent'].includes(C.narrativeMode(p)))issues.push(label+'当前模式禁止旁白');
   if(clip.type==='inner'&&!p.allowInnerVoice)issues.push(label+'当前模式未允许内心独白');
   if(C.narrativeMode(p)==='silent')issues.push(label+'无语言模式不允许人声');
   if(clip.type!=='dialogue'&&clip.lipSync===true)issues.push(label+'旁白或独白不能对口型');
  }
  const clips=sh.audio||[];for(let a=0;a<clips.length;a++)for(let b=a+1;b<clips.length;b++)if(clips[a].start<clips[b].end&&clips[b].start<clips[a].end&&!(clips[a].overlapReason&&clips[b].overlapReason))issues.push(label+'声音重叠需要说明叙事理由');
 }
 return [...new Set(issues)];
}
function audioText(clips){return clips.length?clips.map(c=>`${c.start}–${c.end}秒 ${c.type==='narration'?'旁白':c.type==='inner'?'内心独白':'角色对白'} [${c.speaker||'叙述者'} / ${c.language}]：“${c.text}”；${c.lipSync?'说话者对口型':'无口型同步'}`).join('\n'):'无人声';}
function planCounts(sequences){return {groups:sequences.length,segments:sequences.reduce((n,s)=>n+s.segments.length,0),shots:sequences.reduce((n,s)=>n+s.segments.reduce((m,g)=>m+g.shots.length,0),0)};}
C.audit=(p,s,g)=>[...previous.audit(p,s,g),...performanceIssues(p,s,g)];
C.compile=function(p,s,g){const errors=performanceIssues(p,s,g);if(errors.length)throw Error(errors.join('；'));const result=previous.compile(p,s,g);for(const t of result.tasks){const sh=g.shots[t.shot-1];t.audio=C.clone(sh.audio||[]);t.actorReactions=C.clone(sh.actorReactions||[]);t.presenceEvents=C.clone(sh.presenceEvents||[]);if(sh.audio)t.audioText=audioText(sh.audio);t.prompt+='\n结构化声音与在场表演：'+JSON.stringify({audio:sh.audio,reactions:sh.actorReactions,events:sh.presenceEvents});}if(g.performanceSchema!==2)result.warnings.push('旧版镜头尚未完成逐人反应与结构化声音审核');return result;};
C.promptText=(s,g,p)=>previous.promptText(s,g,p)+'\n\n声音与人物事件明细：\n'+JSON.stringify(g.shots.map((sh,i)=>({shot:i+1,audio:sh.audio,actorReactions:sh.actorReactions,presenceEvents:sh.presenceEvents})),null,2);
Object.assign(C,{performanceIssues,audioText,planCounts});return C;
});
