const {_electron}=require('playwright-core');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-ui-benchmark-'));
 const env={...process.env,DIRECTOR_DATA_DIR:root,DIRECTOR_HEADLESS:'1'};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[path.resolve('.')],env});
 try{
  const page=await app.firstWindow();await page.waitForFunction(()=>typeof PRODUCT!=='undefined'&&PRODUCT.ready);
  await page.evaluate(()=>createSample());
  const rows=[];
  for(const count of [100,300,1000])rows.push(await page.evaluate(count=>{
   const g=S.project.sequences[0].segments[0],template=C.clone(g.shots[0]);
   g.shots=Array.from({length:count},(_,i)=>({...C.clone(template),id:'bench_shot_'+i}));
   S.page='workbench';WS.view='studio';
   const at=performance.now();render();
   return {shots:count,renderMs:Math.round(performance.now()-at),buttons:document.querySelectorAll('button').length,domNodes:document.querySelectorAll('*').length};
  },count));
  console.log(JSON.stringify(rows,null,2));
 }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1;});
