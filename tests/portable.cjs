const { chromium } = require('playwright-core');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const assert = require('node:assert/strict');

(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'director-portable-'));
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  const env = { ...process.env, DIRECTOR_DATA_DIR: root, DIRECTOR_HEADLESS: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(path.resolve(process.argv[2]), [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'], { env, windowsHide: true, stdio: 'ignore' });
  let exited = false;
  child.on('exit', () => { exited = true; });
  let browser;
  try {
    for (let i = 0; i < 90; i++) {
      if (exited) throw Error('Portable launcher exited before renderer was ready');
      try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 700 }); break; }
      catch { await new Promise(resolve => setTimeout(resolve, 700)); }
    }
    assert.ok(browser, 'Portable launcher did not become ready');
    const page = browser.contexts()[0].pages()[0];
    await page.waitForFunction(() => typeof PRODUCT !== 'undefined' && PRODUCT.ready && !!S.settings && document.getElementById('content').textContent.length > 10);
    const modules = await page.evaluate(() => S.knowledge.length);
    assert.equal(modules, process.argv.includes('--public') ? 0 : 16);
    await page.evaluate(() => createSample());
    assert.deepEqual(await page.evaluate(() => C.audit(S.project, selectedSequence(), selectedSequence().segments[0])), []);
    await page.evaluate(() => persist());
    const projects = await fs.readdir(path.join(root, 'projects'));
    assert.ok(projects.some(name => name.startsWith('p_')));
    console.log(`PORTABLE EXE PASS: single-file extraction, desktop load, builtin=${modules}, sample and database save`);
    await page.evaluate(() => call('app:close')).catch(() => {});
  } finally {
    if (browser) await browser.close().catch(() => {});
    for (let i = 0; i < 20 && !exited; i++) await new Promise(resolve => setTimeout(resolve, 250));
    if (!exited) child.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

