const filmLinkBaseView=filmView;
filmView=function(){let html=filmLinkBaseView();html=html.replace(btn('导入视频','film-import','','primary'),btn('导入本机视频','film-import','','primary')+btn('粘贴视频链接','film-link'));const source=filmCurrent()?.sourceUrl;if(source){let host='在线视频';try{host=new URL(source).hostname;}catch{}html=html.replace('<div class="u80-film-heading">',`<div class="film-link-source">来源：${esc(host)} · 本机拉片副本 ${btn('复制原链接','film-copy-link','','small')}</div><div class="u80-film-heading">`);}return html;};
const filmLinkBaseAct=act;
act=async function(action,d={}){
 if(action==='film-copy-link'){const source=filmCurrent()?.sourceUrl;if(!source)throw Error('此拉片没有保存来源链接');await call('clipboard:copy',source);toast('来源链接已复制');return;}
 if(action==='film-link'){
  if(S.job||S.storageBusy)throw Error('请先完成当前任务');
  showModal('从链接导入拉片',`<p>粘贴公开视频直链，或包含 HTTPS 链接的分享文字。便携版已内置分享页解析组件；仅导入能够公开获取、可播放的单个视频，不读取账号登录状态。</p><label>视频链接或分享文字<textarea id="film-link-input" rows="3" placeholder="https://…"></textarea></label><p id="film-link-helper" class="muted" role="status">正在检查内置解析组件…</p><p id="film-link-status" class="muted" role="status">最多 512MB。导入后先核对播放器、时长与片源，再选择一键 AI 拉片。</p>`,async()=>{const text=$('film-link-input').value.trim();if(!text)throw Error('请粘贴视频链接');await filmSave();$('film-link-status').textContent='正在解析并导入视频，请保持窗口打开…';$('modal-submit').textContent='导入中…';try{const record=await call('film:importLink',text);FILM.records.unshift(record);FILM.selected=record.id;FILM.shot=null;FILM.loaded=true;STUDY.mode='work';S.page='film';render();toast('链接视频已导入，请先核对画面与时长');}finally{$('modal-submit').textContent='导入并打开';}},true,'导入并打开');call('film:linkSupport').then(version=>{if($('film-link-helper'))$('film-link-helper').textContent=version?'分享页解析组件就绪 · '+version:'解析组件缺失：仍可导入 MP4/WebM 直链，请检查安装包。';}).catch(()=>{});return;
 }
 return filmLinkBaseAct(action,d);
};
