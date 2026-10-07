(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorkstationCore=api;})(globalThis,()=>{
 const fields=['duration','purpose','camera','frame','action','performance','expression','motion','voice','sound','reactions','continuity'];
 const clone=v=>JSON.parse(JSON.stringify(v));
 function basis(C,DW,p,r){return C.hash(DW.stamp(p,r));}
 function draft(C,DW,p,r){return {base:basis(C,DW,p,r),values:Object.fromEntries(fields.map(k=>[k,k==='duration'?Number(r.sh[k]||0):String(r.sh[k]||'')])),at:new Date().toISOString()};}
 function validate(d){if(!d||!d.values)throw Error('没有待保存的参数草稿');if(!Number.isFinite(Number(d.values.duration))||Number(d.values.duration)<=0||Number(d.values.duration)>3600)throw Error('镜头时长必须大于0且不超过3600秒');for(const k of fields.filter(k=>k!=='duration'))if(typeof d.values[k]!=='string')throw Error('镜头文字字段无效');}
 function apply(C,DW,p,id,d){validate(d);const r=DW.find(p,id);if(basis(C,DW,p,r)!==d.base)throw Error('原文、资产或镜头已变化。草稿仍保留，请复制需要的内容后放弃旧草稿，再基于新版本修改。');const before=clone(r.sh);for(const k of fields){const v=k==='duration'?Number(d.values[k]):d.values[k];if(k==='voice'&&v!==r.sh.voice)delete r.sh.audio;if(k==='reactions'&&v!==r.sh.reactions)delete r.sh.actorReactions;r.sh[k]=v;}r.g.reviewed=false;r.g.stale=true;r.g.staleReason='镜头参数改变，请重新核对表演与首尾状态';C.invalidateAfter(r.s,r.s.segments.indexOf(r.g),'前序镜头参数改变');r.g.prompt=C.promptText(r.s,r.g,p);return before;}
 function timeline(rows){let at=0;return rows.map(r=>{const start=at;at+=Math.max(0,Number(r.sh.duration)||0);return {...r,start,end:at};});}
 return {fields,basis,draft,validate,apply,timeline};
});
