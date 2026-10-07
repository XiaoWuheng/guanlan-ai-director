const {_electron}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

(async()=>{
  const data=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-visual-audit-'));
  const out=path.resolve('audit-evidence/visual-audit');
  await fs.mkdir(out,{recursive:true});
  const env={...process.env,DIRECTOR_DATA_DIR:data,DIRECTOR_HEADLESS:'1'};
  delete env.ELECTRON_RUN_AS_NODE;
  const executable=process.argv[2]&&path.resolve(process.argv[2]);
  const app=await _electron.launch({executablePath:executable||require('electron'),args:executable?[]:[path.resolve('.')],env});
  let page;
  try{
    page=await app.firstWindow();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.waitForFunction(()=>typeof U80!=='undefined'&&PRODUCT.ready);
    await app.evaluate(({BrowserWindow})=>{const win=BrowserWindow.getAllWindows()[0];win.setSize(1600,1000);win.showInactive();});
    await page.evaluate(()=>createSample());
    await page.evaluate(()=>act('page',{page:'workbench'}));
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.ws-preview-body')).backgroundColor),'rgb(25, 29, 34)');
    assert.equal(await page.locator('#ws-stage-nav [data-action="nav-back"] svg').count(),1);
    assert.equal(await page.locator('header [data-action="ws-appearance"]').count(),0);
    assert.equal(await page.locator('header [data-action="personal-center"]').count(),1);
    assert.equal(await page.locator('.aside-bottom button').count(),1);
    await page.screenshot({path:path.join(out,'workbench-1600.png')});
    const metrics=await page.evaluate(()=>{
      const selectors=['aside','main>header','.ws-toolbar','.ws-panel-head','.ws-preview-body','.ws-sequence','.ws-inspector-body','.ws-clip','.aside-bottom button'];
      return Object.fromEntries(selectors.map(s=>{const e=document.querySelector(s),c=e&&getComputedStyle(e);return [s,e?{rect:e.getBoundingClientRect().toJSON(),background:c.backgroundColor,color:c.color,fontSize:c.fontSize,padding:c.padding,border:c.borderColor,radius:c.borderRadius}:null];}));
    });
    await page.locator('.sidebar-tools-trigger').click();
    for(const action of ['restore-project','settings','data-folder','product-feedback'])assert.equal(await page.locator('#modal [data-action="'+action+'"]').count(),1);
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(out,'workspace-menu.png')});
    const dialog=await page.evaluate(()=>{const el=document.querySelector('dialog'),c=getComputedStyle(el);return {background:c.backgroundColor,opacity:c.opacity,backdropFilter:c.backdropFilter,rootTheme:document.documentElement.dataset.theme,personalTheme:PRODUCT.personal.theme,personalOpacity:PRODUCT.personal.opacity};});
    await page.evaluate(()=>closeModal());
    await page.evaluate(async()=>{applyPersonal(await call('personal:save',{...PRODUCT.personal,theme:'dark'}));render();});
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(out,'workbench-dark-1600.png')});
    await page.locator('header [data-action="personal-center"]').click();
    await page.locator('[data-action="u80-settings-tab"][data-id="appearance"]').click();
    assert.ok(await page.locator('#person-theme').isVisible());
    await page.evaluate(()=>closeModal());
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1120,820));
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(out,'workbench-1120.png')});
    assert.equal(await page.locator('.aside-bottom button').count(),1);
    await page.evaluate(()=>act('page',{page:'assets'}));
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(out,'assets-dark-1120.png')});
    await page.locator('[data-action="ws-asset-mode"]').click();
    await page.screenshot({path:path.join(out,'assets-grid-dark-1120.png')});
    assert.ok(await page.locator('.ws-assets-grid').isVisible());
    assert.equal(await page.locator('.ws-assets-grid .ws-asset-kind').first().evaluate(el=>Math.round(el.getBoundingClientRect().height)),96);
    await page.evaluate(()=>act('page',{page:'film'}));
    await page.waitForFunction(()=>FILM.loaded);
    await page.screenshot({path:path.join(out,'film-empty-dark-1120.png')});
    for(const section of ['home','shots','review','delivery']){
      await page.evaluate(section=>act('page',{page:section}),section);
      await page.screenshot({path:path.join(out,section+'-dark-1120.png')});
      assert.equal(await page.evaluate(()=>document.body.scrollWidth<=innerWidth+1),true,section+' horizontal overflow');
    }
    await page.evaluate(async()=>{applyPersonal(await call('personal:save',{...PRODUCT.personal,theme:'light'}));render();});
    await page.evaluate(()=>act('page',{page:'workbench'}));
    await page.screenshot({path:path.join(out,'workbench-light-1120.png')});
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(out,'metrics.json'),JSON.stringify({metrics,dialog},null,2));
    console.log('PASS visual system, navigation, module layouts and appearance access');
  }finally{
    await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
    await app.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
