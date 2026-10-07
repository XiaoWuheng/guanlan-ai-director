const { _electron } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'guanlan-video-ui-'));
  const env = { ...process.env, DIRECTOR_DATA_DIR: root, DIRECTOR_HEADLESS: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await _electron.launch({ args: [path.resolve('.')], env });
  try {
    const page = await app.firstWindow();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForFunction(() => typeof PRODUCT !== 'undefined' && PRODUCT.ready);
    await page.evaluate(() => createSample());
    await page.evaluate(() => act('page', { page: 'workbench' }));
    await page.locator('[data-action="ws-tab"][data-tab="result"]').click();
    await page.locator('.video-generation-panel').waitFor();
    assert.match(await page.locator('.video-generation-panel').innerText(), /用本镜生成视频/);
    await page.locator('[data-action="video-open"]').click();
    await page.locator('#video-model-id').waitFor();
    assert.equal(await page.locator('#video-model-id').inputValue(), 'doubao-seedance-2-5-260628');
    await page.locator('#video-model-preset').selectOption('doubao-seedance-2-0-fast-260128');
    assert.equal(await page.locator('#video-model-id').inputValue(), 'doubao-seedance-2-0-fast-260128');
    await page.locator('#video-api-key').fill('local-test-key');
    await page.locator('#modal-submit').click();
    await page.waitForFunction(() => !$('modal').open);
    assert.equal((await page.evaluate(() => desk.call('video:config'))).hasKey, true);
    await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},path.resolve('src/assets/brand/guanlan-new.png'));
    await page.evaluate(async()=>{const ref=(await call('files:image'))[0];S.project.assets[0].references=[ref];wsCurrent().sh.directorRefs=[{id:S.project.assets[0].id,revision:S.project.assets[0].revision}];await persist();});
    await page.locator('[data-action="video-open"]').click();
    await page.locator('#video-prompt').waitFor();
    assert.equal(await page.locator('#video-reference option').first().innerText(), '仅文字生成，不上传图片');
    assert.ok(await page.locator('#video-reference option').count()>1,'已保存的本机资产参考图应可选为首帧');
    assert.ok((await page.locator('#video-prompt').inputValue()).length > 100);
    assert.equal(await page.locator('#video-ratio').inputValue(), '16:9');
    assert.equal(await page.locator('#video-resolution').inputValue(), '720p');
    assert.equal(await page.locator('#video-duration option').count(), 12);
    assert.equal(await page.locator('#video-resolution option').count(), 2);
    await page.locator('[data-action="close-modal"]').first().click();
    assert.deepEqual(errors, []);
    console.log('PASS 生视频入口、密钥配置与本镜提示词预览');
  } finally { await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
