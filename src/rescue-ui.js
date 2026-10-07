// Emergency export remains independent of normal saving and the source disk.
function rescueInstructions(){return `<p><strong>仅用于应急保全当前已打开项目。</strong>正常创作请使用自动保存与项目备份，不需要执行救援。</p><h3>什么时候使用</h3><ul><li>软件提示保存失败，且当前项目还有需要保留的修改。</li><li>资料盘断开、原目录无法访问，暂时无法正常保存。</li></ul><h3>怎么操作</h3><ol><li>保持软件开启，确认当前项目名称正确。不要先重启或切换资料库。</li><li>点击下方按钮，选择一个可写且空间充足的位置；原盘异常时，保存到另一块正常磁盘。</li><li>等待“救援文件已保存”的结果，记下文件位置和缺失素材数量。</li><li>资料恢复正常后，通过“导入项目备份”选择救援 JSON 文件，恢复为新项目副本，再核对剧本、镜头与参考素材。</li></ol><h3>不要这样做</h3><ul><li>不要把救援当作自动修复、完整资料库备份或硬盘数据恢复；它只保存当前内存中的这一个项目。</li><li>不要在救援成功前强行退出、拔盘或覆盖原项目文件。建议使用新的救援文件名保留旧副本。</li><li>不要看到导出成功就删除原资料：断开目录中的图片可能缺失，关联视频也不会打包。</li><li>不要直接分发救援文件；其中可能包含私人剧本、提示词和可读取的参考图。</li></ul><p class="muted">未完成的模型输出不能保证被包含；救援不会自动停止生成。文件选择窗口点取消，不会创建救援文件，也不会关闭程序。</p>`;}
function showRescueGuide(andClose=false){
 if(!S.project)throw Error('没有打开的项目，无法救援导出');
 if(andClose&&S.job)throw Error('请先停止生成任务，再执行救援导出并关闭');
 const project=S.project;
 showModal('应急救援 · 使用说明',`<p class="note">当前项目：<strong>${esc(project.name)}</strong>${S.job?' · 正在生成，仅保全目前已有内容':''}</p>`+rescueInstructions(),async()=>{
  if(S.project!==project)throw Error('当前项目已变化，请重新确认需要救援的项目');
  const result=await call('projects:rescue',C.clone(project));
  if(!result){toast('已取消救援导出，程序保持开启');return;}
  setTimeout(()=>showModal('救援文件已保存',`<p>已将当前项目另存到：</p><pre class="source">${esc(result.path)}</pre><p class="${result.missing?'note warning':'note'}">${result.missing?'有 '+result.missing+' 项图片无法读取。缺失清单已写入救援文件，恢复后需要补齐并重新审核。':'未报告无法读取的引用图片。仍请核对内容，关联视频需要另行保留。'}</p><p>原项目和原资料目录未被删除或替换。以后使用“导入项目备份”选择此文件，将创建恢复副本。</p>${andClose?'<p>确认已记下文件位置后，可点击下方按钮关闭软件。</p>':''}`,andClose?()=>call('app:close'):null,true,'完成并关闭软件'),0);
 },true,'选择救援文件保存位置');
}
const rescueRecoveryView=recoveryView;
recoveryView=function(){return rescueRecoveryView()+`<details class="card rescue-entry"><summary>应急工具 · 保存失败时使用</summary><p>正常保存可用时，无需救援。此工具保全当前打开的项目，不修复资料库。</p>${S.project?btn('查看说明并救援当前项目','rescue-project'):'<p class="muted">当前没有打开项目，无法导出内存内容；请先检查资料连接或已有备份。</p>'}</details>`;};
