const storageAct=act;
async function storagePanel(){const info=await call('storage:info');showModal('资料存储位置',`<label>当前资料目录<input readonly value="${esc(info.path)}"></label>${info.error?`<p class="error">${esc(info.error)}</p>`:''}<p class="muted">资料库编号：${esc(info.identity?.libraryId||'首次迁移时建立')}<br>最近连接：${esc(info.identity?.lastUsedAt||'未记录')}<br>迁移来源：${esc(info.identity?.copiedFrom||'原始资料库')}</p><div class="row">${btn('重新检测连接','storage-recheck')}${S.project&&info.error?btn('查看救援说明','rescue-project'):''}</div><p>项目、图片、历史快照、导入资料、模型连接、个人偏好与反馈草稿保存在此目录。程序本身和运行缓存不随资料迁移。</p><div class="row wrap">${btn('打开当前目录','storage-open')}${btn('选择新位置并迁移','storage-select')}${btn('使用已有资料目录','storage-connect-select')}</div><p class="muted">迁移请选择空文件夹；中断后可再次选择同一未完成目录恢复。旧目录仅作历史副本，避免在两份资料中交替创作。复制并校验成功后切换，原目录保留作为备份；失败时继续使用原位置。模型密钥仍由本机系统加密，换电脑后可能需要重新填写。</p>`,null,true);}
act=async function(action,d={}){
 if(S.storageBusy)throw Error('资料迁移中，请稍候');
 if(action==='data-folder'){if(S.job)throw Error('请先停止生成任务再设置存储位置');await storagePanel();return;}
 if(action==='storage-recheck'){await storagePanel();return;}
 if(action==='storage-open'){await call('files:openData');return;}
 if(action==='storage-select'||action==='storage-connect-select'){
  if(S.job)throw Error('请先停止生成任务');const connect=action==='storage-connect-select';const choice=await call('storage:choose',connect?'connect':'migrate');if(!choice)return;
  showModal(connect?'切换到已有资料库':'迁移资料到新位置',`<p>目标位置：</p><pre class="source">${esc(choice.path)}</pre><p>${connect?'切换后显示所选资料库的项目，不合并两个目录。当前项目会先保存。':'将复制已有项目、图片、导入资料、历史快照和模型设置，逐文件校验后切换。原目录完整保留。'} </p>`,async()=>{
   const info=await call('storage:info');if(!info.error){if(choice.resumable){if(S.saveTimer)throw Error('请先等待自动保存完成，再恢复迁移');await S.saveChain;}else await persist();}else if(S.project)throw Error('当前资料目录不可用，请先恢复连接并保存，避免丢失未保存修改');
   S.storageBusy=true;document.querySelectorAll('#modal button').forEach(el=>el.disabled=true);$('modal-body').insertAdjacentHTML('beforeend','<p id="migration-progress" role="status">正在核对容量与文件，请保持程序开启……</p>');
   try{await call('storage:apply',{token:choice.token,mode:connect?'connect':'migrate'});S.project=null;S.projects=[];S.assetId=null;S.seqId=null;await boot();toast('资料位置已更新；原目录仍保留。');}finally{S.storageBusy=false;document.querySelectorAll('#modal button').forEach(el=>el.disabled=false);}
  },true,connect?'保存并切换':'保存并迁移');return;
 }
 return storageAct(action,d);
};


desk.onStorageProgress(p=>{const el=$('migration-progress');if(el)el.textContent=`已校验 ${p.files}/${p.filesTotal} 个文件 · ${(p.bytes/1048576).toFixed(1)}/${(p.totalBytes/1048576).toFixed(1)} MB`;});
