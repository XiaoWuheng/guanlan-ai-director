const {_electron:electron}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-navigation-062-')),env={...process.env,DIRECTOR_DATA_DIR:path.join(root,'data'),DIRECTOR_HEADLESS:'1'};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({executablePath:process.argv[2]?path.resolve(process.argv[2]):require('electron'),args:process.argv[2]?[]:[path.resolve('.')],env});
 try{
  const p=await app.firstWindow(),errors=[];p.on('pageerror',e=>errors.push(e.message));await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].showInactive());
  await p.waitForFunction(()=>typeof wsNavGroup==='function'&&document.querySelector('#ws-statusbar'));await p.evaluate(()=>createSample());
  assert.equal(await p.locator('#ws-stage-nav [data-action="page"]').count(),7);
  for(const key of ['home','assets','workbench','shots','review','delivery','prompts']){
   await p.locator(`#nav [data-page="${key}"]`).click();await p.waitForFunction(key=>S.page===key,key);
   assert.equal(await p.locator('#nav [aria-current="page"]').count(),1);
   assert.equal(await p.locator('#nav [aria-current="page"]').getAttribute('data-page'),key);
   assert.ok(await p.locator('.shell>aside').isVisible());assert.equal(await p.locator('.ws-current-page').textContent(),await p.evaluate(key=>WS_PAGES[key],key));
  }
  await p.locator('#nav [data-page="workbench"]').click();
  assert.ok(await p.locator('[data-action="ws-param"][data-param="sound"]').count());
  await p.locator('[data-action="ws-param"][data-param="sound"]').click();const shot=await p.evaluate(()=>wsCurrent().sh.id);
  await p.locator('[data-ws-field="sound"]').fill('导航切换保存的声音草稿');
  await p.locator('[data-action="ws-param"][data-param="ai"]').click();await p.locator('[data-action="ws-param"][data-param="edit"]').click();
  assert.equal(await p.evaluate(()=>WS.param),'sound');assert.equal(await p.locator('[data-ws-field="sound"]').inputValue(),'导航切换保存的声音草稿');
  await p.locator('[data-action="ws-param"][data-param="continuity"]').click();await p.locator('[data-action="ws-tab"][data-tab="seam"]').last().click();
  assert.deepEqual(await p.evaluate(()=>({page:S.page,param:WS.param,tab:WS.tab,shot:wsCurrent().sh.id})),{page:'workbench',param:'continuity',tab:'seam',shot});
  await p.locator('[data-action="ws-view"][data-view="board"]').click();await p.locator('[data-action="dw-view"][data-view="flow"]').click();assert.deepEqual(await p.evaluate(()=>[WS.view,DWUI.view]),['flow','flow']);
  await p.locator('#nav [data-page="workbench"]').click();assert.equal(await p.evaluate(()=>WS.view),'studio');
  const group=p.locator('#nav [data-ws-group="reference"]');await group.locator('summary').click();await p.locator('[data-action="ws-tab"][data-tab="plan"]').click();assert.equal(await group.evaluate(e=>e.open),true);
  await group.locator('summary').click();await p.locator('[data-action="ws-param"][data-param="picture"]').click();assert.equal(await group.evaluate(e=>e.open),false);
  for(const width of [1366,1024]){
   await app.evaluate(({BrowserWindow},w)=>BrowserWindow.getAllWindows()[0].setSize(w,768),width);await p.waitForTimeout(200);
   assert.ok(await p.locator('.shell>aside').isVisible());assert.ok(await p.locator('.ws-preview').isVisible());
   assert.equal(await p.locator('.ws-inspector').isVisible(),false);await p.locator('[data-action="ws-toggle"][data-side="right"]').first().click();assert.ok(await p.locator('.ws-inspector').isVisible());
   const overlap=await p.evaluate(()=>{const a=document.querySelector('.shell>aside').getBoundingClientRect(),b=document.querySelector('.ws-inspector').getBoundingClientRect(),m=document.querySelector('.ws-main').getBoundingClientRect();return b.left>=a.right&&b.top>=m.top-1&&b.bottom<=m.bottom+1;});assert.equal(overlap,true);
   await p.locator('.ws-inspector [data-action="ws-toggle"]').click();
  }
  assert.deepEqual(errors,[]);await fs.mkdir('audit-evidence/upgrade-062',{recursive:true});await p.screenshot({path:'audit-evidence/upgrade-062/navigation.png'});await fs.writeFile('audit-evidence/upgrade-062/navigation-check.json',JSON.stringify({passed:true,checks:['单一全局导航与当前位置','稳定侧栏','编辑分组恢复与草稿保留','中央接缝与参数区解耦','视图状态同步','导航折叠保留','1366/1024 窄窗参数面板'],errors},null,2));console.log('PASS navigation 0.6.2');
 }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1;});
