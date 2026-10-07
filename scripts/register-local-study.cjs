const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const parent=path.resolve(process.argv[2]||'');if(!process.argv[2])throw Error('请提供五期资料的上级目录');
 const entries=await fs.readdir(parent,{withFileTypes:true}),dirs=entries.filter(x=>x.isDirectory()&&/^第[一二三四五]期/.test(x.name)).map(x=>path.join(parent,x.name));
 if(dirs.length!==5)throw Error('应找到第一期至第五期共五个目录，实际找到 '+dirs.length);
 const base=path.join(process.env.APPDATA||path.join(process.env.USERPROFILE,'AppData','Roaming'),'ai-director-desk'),locations=require('../src/data-location')(base),info=await locations.info();
 if(info.error)throw Error('观澜资料库不可用：'+info.error);
 const root=()=>info.path,read=async(file,fallback)=>{try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}},write=async(file,data)=>{await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.register-tmp';await fs.writeFile(temp,JSON.stringify(data,null,2),'utf8');await fs.rename(temp,file);};
 const library=require('../src/study-library')({root,read,write,documentText:async()=>''}),result=await library.register(dirs);
 console.log(JSON.stringify({roots:result.roots.length,episodes:result.episodes.length,files:result.episodes.reduce((n,e)=>n+e.files.length,0),phaseCounts:Object.fromEntries([...new Set(result.episodes.map(e=>e.phase))].map(p=>[p,result.episodes.filter(e=>e.phase===p).length])),location:info.path},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
