const fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const entries=['clips','global-library.json','global-library.json.bak','film-studies.json','film-studies.json.bak','study-library.json','study-library.json.bak','diagnoses.json','diagnoses.json.bak','assistant-history.json','assistant-history.json.bak','assistant-conversations.json','assistant-conversations.json.bak','assistant-skills.json','assistant-skills.json.bak','assistant-files.json','assistant-files.json.bak','projects','media','archive','knowledge.json','knowledge.json.bak','settings.json','settings.json.bak','model-connections.json','model-connections.json.bak','video-connection.json','video-connection.json.bak','video-jobs.json','video-jobs.json.bak','generated-videos','personal.json','personal.json.bak','feedback-draft.json','feedback-draft.json.bak','model-usage.jsonl'];
const marker='.director-storage.json',pendingName='.director-migration.json';
async function hash(file){const h=crypto.createHash('sha256');for await(const chunk of sync.createReadStream(file))h.update(chunk);return h.digest('hex');}
function inside(parent,child){const rel=path.relative(parent,child);return !rel||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));}
module.exports=function(base){
 base=path.resolve(base);const config=path.join(base,'storage-location.json');let current=base,error='',configError='',busy=false,progress=null,identity=null;
 try{const saved=JSON.parse(sync.readFileSync(config,'utf8'));if(!path.isAbsolute(saved.path))throw Error();current=path.resolve(saved.path);}catch(e){if(e.code!=='ENOENT')configError='资料位置配置读取失败，请重新选择已有资料目录。';}
 async function ready(){try{if(configError)throw Error(configError);if(current!==base){await fs.access(current).catch(()=>{throw Error('自定义资料目录无法访问，请恢复磁盘连接后重试。');});const tag=await fs.readFile(path.join(current,marker),'utf8').then(JSON.parse).catch(()=>null);if(tag?.format!=='ai-director-storage')throw Error('资料库标识缺失，请重新选择已有资料目录');identity=tag;}else if(!identity){await fs.mkdir(base,{recursive:true});identity=await tagAt(base);}error='';}catch(e){error=e.message;throw e;}}
 async function tagAt(dir){let tag=await fs.readFile(path.join(dir,marker),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(tag&&tag.format!=='ai-director-storage')throw Error('资料库标识无效');tag={...tag,format:'ai-director-storage',version:2,libraryId:tag?.libraryId||crypto.randomUUID(),lastUsedAt:new Date().toISOString()};await fs.writeFile(path.join(dir,marker),JSON.stringify(tag,null,2));return tag;}
 async function commit(target){await fs.mkdir(base,{recursive:true});const nextIdentity=await tagAt(target);const temp=config+'.'+crypto.randomUUID()+'.tmp';await fs.writeFile(temp,JSON.stringify({version:2,path:target},null,2),{flag:'wx'});try{await fs.rename(temp,config);}catch(e){await fs.unlink(temp).catch(()=>{});throw e;}current=target;error='';configError='';identity=nextIdentity;}
 async function inspect(target){if(!path.isAbsolute(target))throw Error('请选择绝对路径');const stat=await fs.lstat(target);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('请选择普通文件夹，不使用目录链接');return fs.realpath(target);}
 async function inventory(dir,relative=''){const out=[];for(const item of await fs.readdir(path.join(dir,relative),{withFileTypes:true})){const rel=path.join(relative,item.name),file=path.join(dir,rel),st=await fs.lstat(file);if(st.isSymbolicLink())throw Error('资料中含目录链接：'+rel);if(st.isDirectory()){out.push({relative:rel,directory:true});out.push(...await inventory(dir,rel));}else if(st.isFile())out.push({relative:rel,size:st.size,hash:await hash(file)});else throw Error('不支持的资料文件：'+rel);}return out;}
 async function migrate(target,onProgress=()=>{}){if(busy)throw Error('正在迁移资料');busy=true;try{
  await ready();await fs.mkdir(current,{recursive:true});const source=await fs.realpath(current);target=await inspect(target);if(inside(source,target)||inside(target,source))throw Error('新位置不能与当前资料目录相同，或互相包含');
  const pending=path.join(target,pendingName),names=await fs.readdir(target);let resume=null;
  if(names.length){resume=await fs.readFile(pending,'utf8').then(JSON.parse).catch(()=>null);if(!resume||resume.from!==source||resume.version!==2)throw Error('迁移目标必须是空文件夹，或本资料库未完成的迁移目录');}
  identity=await tagAt(source);const records=[];
  for(const name of entries){const st=await fs.lstat(path.join(source,name)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(!st)continue;if(st.isSymbolicLink())throw Error('资料入口包含目录链接：'+name);if(st.isDirectory()){records.push({relative:name,directory:true});records.push(...await inventory(source,name));}else if(st.isFile())records.push({relative:name,size:st.size,hash:await hash(path.join(source,name))});}
  records.sort((a,b)=>a.relative.localeCompare(b.relative));
  const digest=crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex');if(resume&&(resume.digest!==digest||resume.libraryId!==identity.libraryId))throw Error('源资料在中断后已变化，请使用新的空文件夹迁移；未完成目录原样保留');
  const totalBytes=records.reduce((n,r)=>n+(r.size||0),0),filesTotal=records.filter(r=>!r.directory).length;
  if(resume){const allowed=new Set([...records.flatMap(r=>[r.relative,r.relative+'.migration-tmp']),pendingName,marker]);for(const r of await inventory(target))if(!allowed.has(r.relative))throw Error('未完成目录含额外文件，停止恢复：'+r.relative);}
  const disk=await fs.statfs(target);if(Number(disk.bavail)*Number(disk.bsize)<totalBytes+16*1024*1024)throw Error('目标磁盘空间不足，请至少保留资料大小加16MB余量');
  if(!resume)await fs.writeFile(pending,JSON.stringify({version:2,from:source,libraryId:identity.libraryId,digest,startedAt:new Date().toISOString()}),{flag:'wx'});
  let bytes=0,files=0;for(const item of records){const dest=path.join(target,item.relative);if(item.directory){await fs.mkdir(dest,{recursive:true});continue;}await fs.mkdir(path.dirname(dest),{recursive:true});const st=await fs.lstat(dest).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(st?.isSymbolicLink())throw Error('目标包含链接：'+item.relative);
   if(!st||await hash(dest)!==item.hash){const temp=dest+'.migration-tmp';const tempStat=await fs.lstat(temp).catch(()=>null);if(tempStat?.isSymbolicLink())throw Error('目标临时文件包含链接');await fs.copyFile(path.join(source,item.relative),temp);if(await hash(temp)!==item.hash)throw Error('源资料变化或复制校验失败：'+item.relative);await fs.rename(temp,dest);}
   bytes+=item.size;files++;progress={files,filesTotal,bytes,totalBytes,file:item.relative};onProgress(progress);
  }
  await fs.writeFile(path.join(target,marker),JSON.stringify({...identity,copiedFrom:source,at:new Date().toISOString(),files,bytes}));
  await fs.unlink(pending);try{await commit(target);}catch(e){await fs.writeFile(pending,JSON.stringify({version:2,from:source,libraryId:identity.libraryId,digest}));throw e;}return {path:current,previous:source,files,bytes};
 }finally{busy=false;}}
 async function connect(target){if(busy)throw Error('正在迁移资料');busy=true;try{target=await inspect(target);try{await fs.access(path.join(target,pendingName));throw Error('该目录迁移未完成，请通过迁移功能恢复');}catch(e){if(e.code!=='ENOENT')throw e;}
  if(target!==await fs.realpath(base).catch(()=>base)){const tag=await fs.readFile(path.join(target,marker),'utf8').then(JSON.parse).catch(()=>null);if(tag?.format!=='ai-director-storage')throw Error('所选目录不是本程序资料库');}
  const probe=path.join(target,'.write-check-'+crypto.randomUUID());await fs.writeFile(probe,'',{flag:'wx'});await fs.unlink(probe);await commit(target);return {path:current};
 }finally{busy=false;}}
 return {root:()=>current,ready,info:async()=>{await ready().catch(()=>{});return {path:current,defaultPath:base,error,busy,progress,identity};},migrate,connect};
};

