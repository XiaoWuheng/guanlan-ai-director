(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DirectorWorkspace=api;})(globalThis,()=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 function rows(p){const out=[];for(const s of p.sequences||[])for(const g of s.segments||[])g.shots.forEach((sh,j)=>{sh.id ||= 'shot_'+g.id+'_'+j+'_'+Math.random().toString(36).slice(2,8);out.push({s,g,sh,j});});return out;}
 function find(p,id){const row=rows(p).find(r=>r.sh.id===id);if(!row)throw Error('镜头已被删除或替换，请重新选择');return row;}
 function stamp(p,r){return JSON.stringify([p.scriptRevision,p.script,p.style,p.notes,p.languagePolicy,p.narrativeMode,p.rules,p.knowledgeOverrides,r.s.assetIds,r.s.spatialSceneId,p.assets,r.g.sourceText,r.sh]);}
 function refs(p,sh){return (sh.directorRefs||[]).map(ref=>{const asset=p.assets.find(a=>a.id===ref.id);return {...ref,asset,stale:!asset||asset.revision!==ref.revision||asset.status!=='confirmed'||Boolean(asset.sourceReview)};});}
 function patch(p,id,base,proposal){const r=find(p,id);if(stamp(p,r)!==base)throw Error('原文、资产或镜头已变化，请重新生成修改建议');const allowed=['purpose','frame','action','performance','expression','camera','motion','sound','continuity'];const keys=Object.keys(proposal||{});if(!keys.length||keys.some(k=>!allowed.includes(k)||typeof proposal[k]!=='string'||!proposal[k].trim()))throw Error('修改仅允许镜头作用、画面、动作、表演、可见表情、机位、运镜、环境音和连续性文字');const before=copy(r.sh);Object.assign(r.sh,proposal);r.g.reviewed=false;r.g.stale=true;r.g.staleReason='局部导演修改后需复核结构化状态及表演';for(const g of r.s.segments.slice(r.s.segments.indexOf(r.g)+1)){g.reviewed=false;g.stale=true;g.staleReason='前段导演设计改变，请核对承接';}return before;}
 function seam(previous,next){const a=previous||[],b=next||[],ids=[...new Set([...a,...b].map(x=>x.assetId||x.id))];return ids.map(id=>{const left=a.find(x=>(x.assetId||x.id)===id),right=b.find(x=>(x.assetId||x.id)===id);return {id,left,right,changed:JSON.stringify(left)!==JSON.stringify(right)};});}
 function install(C){if(C.workspaceInstalled)return;C.workspaceInstalled=true;const context=C.context,audit=C.audit,compile=C.compile,prompt=C.promptText;
 const issues=(p,g)=>g.shots.flatMap((sh,i)=>refs(p,sh).filter(x=>x.stale).map(x=>'镜'+(i+1)+'引用资产缺失、未确认或版本过期：'+(x.asset?.name||x.id)));
 C.audit=(p,s,g)=>[...audit(p,s,g),...issues(p,g)];
 C.context=(p,s,g,k)=>{const errors=issues(p,g);if(errors.length)throw Error(errors.join('；'));const ctx=context(p,s,g,k),items=g.shots.flatMap(sh=>refs(p,sh)),unique=[...new Map(items.map(x=>[x.id,x])).values()];const text=unique.length?'\n逐镜明确引用（仅作为创作资料）：\n'+JSON.stringify(unique.map(x=>({id:x.id,name:x.asset.name,revision:x.revision,design:x.asset.design,continuity:x.asset.continuity}))):'';if(ctx.text.length+text.length>ctx.budget)throw Error('明确引用超过上下文预算，请减少引用或增加预算');ctx.text+=text;ctx.characters=ctx.text.length;ctx.sources.push(...unique.map(x=>({label:x.asset.name+' v'+x.revision,ref:x.id})));return ctx;};
 C.compile=(p,s,g)=>{const errors=issues(p,g);if(errors.length)throw Error(errors.join('；'));const result=compile(p,s,g);result.tasks.forEach((t,i)=>t.directorReferences=copy(g.shots[i]?.directorRefs||[]));return result;};
 C.promptText=(s,g,p)=>prompt(s,g,p)+'\n\n逐镜明确引用：\n'+g.shots.map((sh,i)=>'镜'+(i+1)+'：'+refs(p,sh).map(x=>(x.asset?.name||x.id)+' ['+x.id+' v'+x.revision+']'+(x.stale?'（待复核）':'')).join('、')).join('\n');
 }
 return {rows,find,stamp,refs,patch,seam,install};
});

