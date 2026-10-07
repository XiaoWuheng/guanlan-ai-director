const CREATIVE_MODES=[
 ['A','故事板预览','把分镜放在连续画面中检查。','board'],
 ['B','表格分镜','在紧凑表格里编辑镜号、时长和动作。','table'],
 ['C','完整制作包','审核后冻结分镜与参考图并交付。','package']
];
const creativeToolsActBase=act;
act=async function(action,d={}){
 if(action==='creative-tools'){
  showModal('两项创作技能',`<div class="creative-mode-list"><div><strong>01 · AI 脚本编导</strong><p>从想法生成独立剧本草稿，人工审阅后再采用到现有剧本流程；后续可用故事板、表格分镜或完整制作包查看和交付。</p>${btn('从想法写剧本草稿','creative-script')}${CREATIVE_MODES.map(([id,name,desc,mode])=>`<div><strong>${id} · ${name}</strong><p>${desc}</p>${btn('前往'+name,'creative-mode',`data-id="${mode}"`)}</div>`).join('')}</div><div><strong>02 · AI 短片诊断</strong><p>针对自己的成片记录问题、证据与修改步骤。无模型也能手工诊断；AI 草稿需要对照原片复核。</p>${btn('打开短片诊断','page','data-page="diagnosis"')}</div></div><p class="muted">原片拉片属于独立的学习区，不插入制作流程；可在「拉片学习」中查看五期资料并导出自己的带图 Excel。</p>${btn('打开拉片学习','creative-study')}`,null);return;
 }
 if(action==='creative-script'){closeModal();if(!S.project)return act('new-project');S.page='home';render();return act('script-plan');}
 if(action==='creative-study'){closeModal();STUDY.mode='library';S.page='film';render();return;}
 if(action==='creative-mode'){closeModal();requireProject();if(d.id==='board'){WS.view='board';DWUI.view='board';S.page='workbench';render();return;}if(d.id==='table'){S.project.compact=true;S.page='shots';await persist();render();return;}if(d.id==='package'){S.page='delivery';render();return;}}
 return creativeToolsActBase(action,d);
};
