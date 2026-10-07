const {_electron}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

(async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-canvas-controls-'));
  const env={...process.env,DIRECTOR_DATA_DIR:root,DIRECTOR_HEADLESS:'1'};
  delete env.ELECTRON_RUN_AS_NODE;
  const app=await _electron.launch({args:[path.resolve('.')],env});
  try{
    const page=await app.firstWindow(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.waitForFunction(()=>typeof PRODUCT!=='undefined'&&PRODUCT.ready);
    await page.evaluate(()=>createSample());
    await page.evaluate(()=>act('page',{page:'canvas'}));
    assert.equal(await page.locator('#canvas-inspector').isVisible(),false);
    await page.locator('.canvas-immersive-add-trigger').click();await page.locator('.canvas-immersive-add-menu [data-action="flow-add"][data-type="prompt"]').click();
    await page.locator('#flow-text').fill('画布撤回测试');
    await page.locator('#modal-submit').click();
    await page.waitForFunction(()=>S.project.canvasGraph.nodes.length===1);
    await page.locator('[data-action="canvas-desk-undo"]').click();
    await page.waitForFunction(()=>S.project.canvasGraph.nodes[0]?.text==='');
    await page.locator('[data-action="canvas-desk-undo"]').click();
    await page.waitForFunction(()=>S.project.canvasGraph.nodes.length===0);
    await page.locator('[data-action="canvas-desk-redo"]').click();
    await page.waitForFunction(()=>S.project.canvasGraph.nodes.length===1);
    await page.locator('[data-action="canvas-desk-redo"]').click();
    await page.waitForFunction(()=>S.project.canvasGraph.nodes[0]?.text==='画布撤回测试');
    await page.locator('[data-action="canvas-desk-snap"]').click();
    assert.equal(await page.locator('[data-action="canvas-desk-snap"]').getAttribute('aria-pressed'),'true');
    await page.locator('[data-action="canvas-desk-map"]').click();
    assert.match(await page.locator('.canvas-desk-panel').innerText(),/导演提示词/);
    await page.locator('.canvas-desk-map-node').first().click();
    assert.equal(await page.locator('.canvas-desk-panel').isVisible(),false);
    await page.locator('[data-action="canvas-desk-filter"]').click();
    assert.equal(await page.locator('.canvas-filters').isVisible(),true);
    await page.locator('[data-action="canvas-desk-filter"]').click();
    assert.equal(await page.locator('.canvas-filters').isVisible(),false);
    await page.evaluate(async()=>{await call('library:save',{kind:'scene',name:'测试山谷',design:'清晨薄雾',continuity:'山峰保持一致',references:[]});await globalLibraryLoad();});
    await page.locator('[data-action="canvas-desk-import-library"]').click();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(()=>S.project.canvasGraph.nodes.some(n=>n.type==='asset'));
    assert.equal(await page.evaluate(()=>S.project.assets.find(a=>a.name==='测试山谷')?.status),'draft');
    assert.deepEqual(errors,[]);
    console.log('PASS 画布撤回重做、网格吸附、小地图、筛选和统一资产导入');
  }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
