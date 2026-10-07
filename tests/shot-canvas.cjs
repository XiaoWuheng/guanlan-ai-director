const {_electron}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');

(async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-canvas-'));
  const env={...process.env,DIRECTOR_DATA_DIR:root,DIRECTOR_HEADLESS:'1'};
  delete env.ELECTRON_RUN_AS_NODE;
  const app=await _electron.launch({args:[path.resolve('.')],env});
  try{
    const page=await app.firstWindow(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.waitForFunction(()=>typeof PRODUCT!=='undefined'&&PRODUCT.ready);
    await page.evaluate(()=>createSample());
    await page.evaluate(()=>act('page',{page:'canvas'}));
    await page.locator('#shot-canvas-stage').waitFor();
    assert.equal(await page.locator('.shot-canvas-node').count(),0);
    for(let i=0;i<2;i++){
      await page.locator('.canvas-immersive-add-trigger').click();await page.locator('.canvas-immersive-add-menu [data-action="flow-add-shot"]').click();
      await page.locator('#modal-submit').click();
      await page.waitForFunction(n=>S.project.canvasGraph.shotIds.length===n,i+1);
    }
    assert.equal(await page.locator('.shot-canvas-node').count(),2);
    const before=await page.locator('#shot-canvas-world').getAttribute('style');
    await page.locator('[data-action="canvas-zoom"][data-step="1"]').click();
    assert.notEqual(await page.locator('#shot-canvas-world').getAttribute('style'),before);
    const first=page.locator('.shot-canvas-node').first(),box=await first.boundingBox();
    await page.mouse.move(box.x+30,box.y+30);await page.mouse.down();
    await page.mouse.move(box.x+70,box.y+60,{steps:4});await page.mouse.up();
    await page.waitForFunction(()=>Object.keys(S.project.canvasPositions||{}).length>0);
    const position=await page.evaluate(()=>Object.values(S.project.canvasPositions)[0]);
    await page.evaluate(()=>persist());await page.reload();
    await page.waitForFunction(()=>PRODUCT.ready&&S.project);
    assert.deepEqual(await page.evaluate(()=>Object.values(S.project.canvasPositions)[0]),position);
    await page.evaluate(()=>act('page',{page:'canvas'}));
    await page.locator('[data-action="canvas-open-shot"]').first().click();
    await page.waitForFunction(()=>S.page==='workbench'&&WS.view==='studio'&&!!wsCurrent());
    assert.deepEqual(errors,[]);
    console.log('PASS 独立画布按需引用镜头、缩放、拖动保存、重载与回到原镜头');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
