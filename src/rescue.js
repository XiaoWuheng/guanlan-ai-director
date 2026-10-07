const fs=require('node:fs/promises'),path=require('node:path');
// Does not require the original database or settings to be readable.
module.exports=async function(project,root){
 const missing=[];
 async function visit(value,trail='project'){
  if(typeof value==='string'&&value.startsWith('director-media:')){
   const match=/^director-media:\/\/image\/([a-f0-9]{64}\.(png|jpeg|webp))$/.exec(value);
   try{if(!match)throw Error('无效媒体路径');const bytes=await fs.readFile(path.join(root,'media',match[1]));return `data:image/${match[2]};base64,${bytes.toString('base64')}`;}
   catch(e){missing.push({field:trail,reference:value,reason:e.code||e.message});return '';}
  }
  if(Array.isArray(value))return Promise.all(value.map((v,i)=>visit(v,trail+'['+i+']')));
  if(value&&typeof value==='object'){const out={};for(const [k,v]of Object.entries(value)){if(/^(apiKey|encryptedKey|authorization)$/i.test(k))continue;out[k]=await visit(v,trail+'.'+k);}return out;}
  return value;
 }
 return {format:'director-project',version:2,rescue:true,at:new Date().toISOString(),project:await visit(project),missingMedia:missing};
};
