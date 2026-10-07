const path=require('node:path'),crypto=require('node:crypto');
module.exports=function({root,read,write}){
 const file=()=>path.join(root(),'diagnoses.json');
 const list=()=>read(file(),[]);
 async function add(source){const rows=await list();if(rows.length>=100)throw Error('本机诊断最多保留 100 条，请先整理旧记录');const now=new Date().toISOString(),record={id:'diag_'+crypto.randomUUID(),name:path.basename(source),source,createdAt:now,updatedAt:now,goal:'',audience:'',format:'',concerns:'',observation:'',summary:'',issues:'',plan:'',model:'',reviewed:false};rows.unshift(record);await write(file(),rows);return record;}
 async function save(input){const rows=await list(),record=rows.find(x=>x.id===input.id);if(!record)throw Error('诊断记录不存在');for(const key of ['goal','audience','format','concerns','observation','summary','issues','plan','model'])record[key]=String(input[key]||'').slice(0,50000);record.reviewed=!!input.reviewed;record.updatedAt=new Date().toISOString();await write(file(),rows);return record;}
 return {list,add,save};
};
