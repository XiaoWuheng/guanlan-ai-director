(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PromptGuide=api;})(globalThis,()=>{
 const value=(v,f='待创作者补充')=>String(v||'').trim()||f;
 function shot(sh,i){const d=Number(sh.duration)||0;return [
  `【镜头 ${i+1}｜${d} 秒｜叙事任务】${value(sh.purpose,'未填写：请说明本镜传递的信息或因果变化')}`,
  `【起始可见状态】${value(sh.continuity,'请明确人物位置、视线、手与道具的起始状态')}`,
  `【场景与画面】${value(sh.scene)}；机位：${value(sh.camera)}；构图：${value(sh.frame)}`,
  `【主体动作：起势→过程→落点】${value(sh.action)}`,
  `【逐人表演】${value(sh.performance||sh.reactions,'未填写：分别描述入画人物的视线、呼吸、肩颈、手指及回应时机')}`,
  `【表情微变化：前→中→后】${value(sh.expression,'未填写：用眉、眼睑、眼球、嘴角、下颌的可见变化与持续时间描述；勿用抽象情绪词代替')}`,
  `【摄影与声音】运镜：${value(sh.motion)}；对白：${value(sh.voice,'无对白')}；环境与动作音：${value(sh.sound,'无特别声音')}`,
  `【连续性落点】${value(sh.transition||sh.continuity,'请写清下一镜必须接住的动作阶段、视线与道具状态')}`,
  '【可测量约束】仅当参考图、场景比例尺或角色设定提供可校准尺度时，才使用毫米／厘米；否则使用相对画幅、面部比例和秒数描述，不虚构精度。'
 ].join('\n');}
 function install(C){if(C.promptGuideInstalled)return;C.promptGuideInstalled=true;const oldCompile=C.compile,oldText=C.promptText;
  C.compile=(p,s,g)=>{const result=oldCompile(p,s,g);for(const task of result.tasks){const sh=g.shots[task.shot-1];task.prompt=shot(sh,task.shot-1)+'\n\n'+task.prompt;task.purpose=sh.purpose||'';task.performance=sh.performance||sh.reactions||'';task.expression=sh.expression||'';}return result;};
  C.promptText=(s,g,p)=>oldText(s,g,p)+'\n\n逐镜外部生成执行稿：\n'+g.shots.map(shot).join('\n\n');
 }
 return {shot,install};
});
