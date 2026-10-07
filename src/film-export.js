const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const Report=require('./film-report'),Zip=require('adm-zip');
module.exports=async({study,format='html',dialog,win,BrowserWindow,media})=>{
 if(!['html','pdf','csv','xlsx','md','json','zip'].includes(format))throw Error('不支持的报告格式');
 const title=String(study.name||'拉片报告').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,100);
 const selected=await dialog.showSaveDialog(win,{defaultPath:title+'-拉片报告.'+format,filters:[{name:format.toUpperCase(),extensions:[format]}]});if(selected.canceled)return null;
 const value=await media(study,true);delete value.sourceVideo;delete value.sourcePath;
 const html=Report.html(value),target=selected.filePath,temp=target+'.'+crypto.randomUUID()+'.tmp';
 try{
 if(format==='pdf'){
  const scratch=path.join(os.tmpdir(),'guanlan-report-'+crypto.randomUUID()+'.html');let viewer;
  try{await fs.writeFile(scratch,html);viewer=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,javascript:false}});viewer.webContents.setWindowOpenHandler(()=>({action:'deny'}));await viewer.loadFile(scratch);await fs.writeFile(temp,await viewer.webContents.printToPDF({printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:8px;text-align:center;width:100%;color:#666">观澜 · 拉片分析　<span class="pageNumber"></span> / <span class="totalPages"></span></div>',margins:{top:.55,bottom:.55,left:.47,right:.47}}));}finally{viewer?.destroy();await fs.unlink(scratch).catch(()=>{});}
 }else if(format==='xlsx')await fs.writeFile(temp,require('./film-xlsx')(value));
 else if(format==='zip'){
  const zip=new Zip();zip.addFile('阅读报告.html',Buffer.from(html));zip.addFile('逐镜分析表.csv',Buffer.from(Report.csv(value)));zip.addFile('逐镜拉片工作簿.xlsx',require('./film-xlsx')(value));zip.addFile('导演方法与笔记.md',Buffer.from(Report.markdown(value)));zip.addFile('结构化资料.json',Buffer.from(JSON.stringify({format:'guanlan-film-study',version:2,study:value},null,2)));
  const manifest=[];for(const [i,s] of (value.shots||[]).entries())for(const [j,data] of (s.frames||[]).entries()){const m=/^data:image\/(png|jpeg|webp);base64,([a-z0-9+/=\s]+)$/i.exec(data);if(m){const name='关键帧/'+String(i+1).padStart(3,'0')+'-'+(j+1)+'.'+m[1];zip.addFile(name,Buffer.from(m[2],'base64'));manifest.push({shot:i+1,sample:j+1,time:s.frameTimes?.[j]??null,file:name});}}
  zip.addFile('关键帧索引.json',Buffer.from(JSON.stringify(manifest,null,2)));zip.addFile('先读我.txt',Buffer.from('先打开“阅读报告.html”，离线查看图文报告；CSV可用表格软件编辑；关键帧按镜号编号。JSON可在观澜导入分析资料。原视频不随报告打包，重新导入分析资料后可重新关联视频。草稿不等于已复核结论。分享前请核对原片与关键帧使用权限。'));
  await fs.writeFile(temp,zip.toBuffer());
 }else await fs.writeFile(temp,format==='html'?html:format==='csv'?Report.csv(value):format==='md'?Report.markdown(value):JSON.stringify({format:'guanlan-film-study',version:2,study:value},null,2),'utf8');
 await fs.rename(temp,target);return target;
 }catch(e){await fs.unlink(temp).catch(()=>{});throw e;}
};
