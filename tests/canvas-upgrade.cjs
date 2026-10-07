const { _electron } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'guanlan-canvas-up-'));
  const env = { ...process.env, DIRECTOR_DATA_DIR: root, DIRECTOR_HEADLESS: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await _electron.launch({ args: [path.resolve('.')], env });
  try {
    const page = await app.firstWindow(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForFunction(() => typeof PRODUCT !== 'undefined' && PRODUCT.ready);
    await page.evaluate(() => createSample());
    await page.evaluate(async () => {const row=DW.rows(S.project)[0],asset=S.project.assets[0];row.sh.directorRefs=[{id:asset.id,revision:asset.revision}];await persist();});
    await page.evaluate(()=>act('page',{page:'canvas'}));
    for(let i=0;i<2;i++){await page.locator('.canvas-immersive-add-trigger').click();await page.locator('.canvas-immersive-add-menu [data-action="flow-add-shot"]').click();await page.locator('#modal-submit').click();await page.waitForFunction(n=>S.project.canvasGraph.shotIds.length===n,i+1);}
    assert.equal(await page.locator('#canvas-inspector').isVisible(),false,'未选中时不遮挡画布');
    assert.match(await page.locator('.shot-canvas-node').first().innerText(),/逐镜提示词引用/);
    assert.equal(await page.evaluate(()=>document.querySelector('.shot-canvas-node').textContent.includes(DW.rows(S.project)[0].sh.frame)),false,'引用卡不展开完整镜头内容');
    await page.locator('.shot-canvas-node').nth(1).click({ position: { x: 20, y: 20 } });
    await page.locator('#canvas-inspector').waitFor();
    assert.match(await page.locator('#canvas-inspector').innerText(), /镜头作用|画面/);
    const id = await page.locator('.shot-canvas-node').nth(1).getAttribute('data-shot');
    assert.equal(await page.evaluate(() => CANVAS_UP.selected), id);
    await page.locator('[data-action="canvas-desk-filter"]').click();await page.locator('#canvas-status').selectOption('result');
    assert.equal(await page.locator('.shot-canvas-node:visible').count(), 0);
    await page.locator('#canvas-status').selectOption('all');
    await page.locator('#canvas-search').fill('不存在的镜头');
    assert.equal(await page.locator('.shot-canvas-node:visible').count(), 0);
    await page.locator('#canvas-search').fill('');
    await page.locator('[data-action="canvas-focus"]').click();
    await page.locator('[data-action="canvas-fit"]').click();
    await page.locator('.shot-canvas-node').first().click({position:{x:20,y:20}});
    await page.locator('[data-action="canvas-open-asset"]').first().click();
    await page.waitForFunction(()=>S.page==='assets'&&S.assetId===S.project.assets[0].id);
    assert.deepEqual(errors, []);
    console.log('PASS 画布镜头详情、筛选与定位');
  } finally { await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
