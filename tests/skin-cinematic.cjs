const {_electron}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

(async()=>{
 const data=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-cinematic-'));
 const env={...process.env,DIRECTOR_DATA_DIR:data,DIRECTOR_HEADLESS:'1'};delete env.ELECTRON_RUN_AS_NODE;
 const executablePath=process.argv[2]?path.resolve(process.argv[2]):require('electron');
 const app=await _electron.launch({executablePath,args:process.argv[2]?[]:[path.resolve('.')],env});
 const output=path.resolve('audit-evidence/skin-cinematic');await fs.mkdir(output,{recursive:true});
 try{
  const page=await app.firstWindow();await page.waitForFunction(()=>typeof PRODUCT!=='undefined'&&PRODUCT.ready&&typeof GL_SKINS!=='undefined');
  await app.evaluate(({BrowserWindow})=>{const win=BrowserWindow.getAllWindows()[0];win.setSize(1440,900);win.showInactive();});
  for(const [skin,style] of [['deepsea','tide'],['ink','ink'],['stellar','stellar']]){
   await page.evaluate(async({skin,style})=>{const p=await call('personal:save',{...PRODUCT.personal,skin,bootStyle:style,theme:'dark'});applyPersonal(p);render();},{skin,style});
   assert.equal(await page.locator('#gl-ambient').getAttribute('data-skin'),skin);
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()),await page.evaluate(s=>GL_SKINS[s].accent,skin));
   await page.screenshot({path:path.join(output,`workbench-${skin}.png`)});
   if(skin==='deepsea')await page.evaluate(()=>createSample());
   await page.evaluate(()=>act('page',{page:'home'}));
   assert.ok(await page.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+2),skin+' script layout overflow');
   await page.screenshot({path:path.join(output,`script-${skin}.png`)});
   await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1050,720));
   assert.ok(await page.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+2),skin+' compact layout overflow');
   await page.screenshot({path:path.join(output,`script-compact-${skin}.png`)});
   await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1440,900));
   await page.evaluate(()=>act('page',{page:'dashboard'}));
   await page.evaluate(style=>bootShow({...PRODUCT.personal,bootStyle:style}),style);
   assert.equal(await page.locator('#guanlan-boot .boot-art').count(),1);
   assert.equal(await page.locator('#guanlan-boot .boot-wordmark[aria-label="观澜"]').count(),1);
   assert.match(await page.locator('#guanlan-boot .boot-wordmark').evaluate(el=>getComputedStyle(el).maskImage),/guanlan-boot-wordmark\.svg/);
   await page.waitForTimeout(2050);
   await page.screenshot({path:path.join(output,`boot-${style}.png`)});
   await page.evaluate(()=>bootHide());
   assert.equal(await page.locator('#guanlan-boot').count(),0);
  }
  await page.evaluate(()=>bootShow({...PRODUCT.personal,bootStyle:'stellar'}));
  await page.locator('.boot-skip').click();
  assert.equal(await page.locator('#guanlan-boot').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  const staticArtwork=await page.evaluate(()=>{bootShow({...PRODUCT.personal,bootStyle:'stellar'});return getComputedStyle(document.querySelector('.boot-painting')).opacity;});
  assert.equal(staticArtwork,'1');
  await page.waitForFunction(()=>!document.getElementById('guanlan-boot'));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(async()=>{const p=await call('personal:save',{...PRODUCT.personal,skin:'default',theme:'light'});applyPersonal(p);render();});
  assert.equal(await page.locator('#gl-ambient').count(),0);
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  console.log('PASS 3套主题装饰与完整片头、跳过和浅色切换');
 }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}
})().catch(error=>{console.error(error);process.exitCode=1;});
