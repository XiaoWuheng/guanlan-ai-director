const { _electron }=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-assistant-stage-'));
 const env={...process.env,DIRECTOR_DATA_DIR:root,DIRECTOR_HEADLESS:'1'};
 delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({args:[path.resolve('.')],env});
 try{
  const page=await app.firstWindow(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.waitForFunction(()=>typeof PRODUCT!=='undefined'&&PRODUCT.ready);
  await page.locator('#assistant-launcher').click();
  assert.match(await page.locator('#assistant-suggestions').innerText(),/新建项目/);
  await page.locator('#assistant-suggestions [data-prompt="创建项目《我的短片》"]').click();
  await page.waitForFunction(()=>S.project?.name==='我的短片'&&!ASSISTANT.busy);
  assert.match(await page.locator('#assistant-suggestions').innerText(),/写剧本草稿/);
  await page.locator('#assistant-suggestions [data-prompt="写剧本草稿"]').click();
  await page.waitForFunction(()=>!ASSISTANT.busy);
  assert.match(await page.locator('#modal').innerText(),/一句话故事/);
  assert.deepEqual(errors,[]);
  console.log('PASS 澜芯阶段建议从项目创建衔接到剧本草稿');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
