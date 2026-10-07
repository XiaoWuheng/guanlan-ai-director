const {_electron}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

(async()=>{
 const data=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-result-batch-'));
 const env={...process.env,DIRECTOR_DATA_DIR:data,DIRECTOR_HEADLESS:'1'};delete env.ELECTRON_RUN_AS_NODE;
 const exe=process.argv[2];
 const app=await _electron.launch({executablePath:exe?path.resolve(exe):require('electron'),args:exe?[]:[path.resolve('.')],env});
 try{
  const page=await app.firstWindow();
  await page.waitForFunction(()=>typeof PRODUCT!=='undefined'&&typeof U80!=='undefined'&&PRODUCT.ready);
  if(process.argv.includes('--public')){
   assert.equal((await page.evaluate(()=>call('app:info'))).feedbackEmailAvailable,false);
   await page.evaluate(()=>act('product-feedback'));
   assert.equal(await page.locator('[data-action="feedback-email"]').count(),0);
   await page.evaluate(()=>closeModal());
  }
  await page.evaluate(()=>createSample());
  await page.evaluate(async()=>{S.page='home';render();const row=DW.rows(S.project)[0],editor=document.querySelector('.script-card textarea'),at=S.project.script.indexOf(row.g.sourceText);if(at<0)throw Error('示例原文未定位');editor.setSelectionRange(at,at);await act('home-to-shot');});
  assert.equal(await page.evaluate(()=>S.page),'workbench');
  const files=[];
  for(let i=1;i<=2;i++){const file=path.join(data,`result-1-${i}.mp4`);await fs.writeFile(file,Buffer.from('test fixture'));files.push(file);}
  await app.evaluate(({dialog},paths)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:paths});},files);
  await page.evaluate(()=>{S.page='workbench';WS.view='studio';WS.tab='result';render();});
  await page.locator('[data-action="result-batch"]').click();
  const options=await page.locator('[data-result-map]').count();
  assert.equal(options,2);
  const ids=await page.evaluate(()=>DW.rows(S.project).slice(0,2).map(r=>r.sh.id));
  await page.locator('[data-result-map="0"]').selectOption(ids[0]);
  await page.locator('[data-result-map="1"]').selectOption(ids[0]);
  await page.locator('#modal-submit').click();
  await page.waitForFunction(()=>S.project.videoResults?.length===2);
  assert.deepEqual(await page.evaluate(()=>S.project.videoResults.map(r=>r.decision)),['pending','pending']);
  await page.evaluate(id=>{WS.selected[S.project.id]=id;WS.tab='result';render();},ids[0]);
  assert.equal(await page.locator('[data-action="u80-result-compare"]').count(),2);
  await page.locator('[data-action="u80-result-compare"]').first().click();
  await page.locator('[data-action="u80-result-compare"]').nth(1).click();
  assert.equal(await page.locator('.u80-result-compare section').count(),2);
  const exported=path.join(data,'逐镜提示词.txt');
  await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},exported);
  await page.locator('[data-action="result-export-prompts"]').click();
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('已导出'));
  const promptText=await fs.readFile(exported,'utf8');
  assert.ok(ids.every(id=>promptText.includes(id)));
  console.log('PASS 批量关联逐项确认、同镜两版对照与全项目逐镜提示词导出');
 }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}
})().catch(error=>{console.error(error);process.exitCode=1;});
