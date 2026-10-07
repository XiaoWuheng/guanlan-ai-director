const {_electron}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

(async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-visual-'));
  const out=path.resolve('audit-evidence/after');
  await fs.mkdir(out,{recursive:true});
  const env={...process.env,DIRECTOR_DATA_DIR:root,DIRECTOR_HEADLESS:'1'};
  delete env.ELECTRON_RUN_AS_NODE;
  const app=await _electron.launch({args:[path.resolve('.')],env});
  const errors=[];
  try{
    const p=await app.firstWindow();
    p.on('pageerror',e=>errors.push(e.message));
    await p.waitForFunction(()=>typeof PRODUCT!=='undefined'&&PRODUCT.ready);
    const launcher=await p.locator('#assistant-launcher').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.querySelector('span').getBoundingClientRect();return {x:Math.abs((a.left+a.right-b.left-b.right)/2),y:Math.abs((a.top+a.bottom-b.top-b.bottom)/2)};});
    assert.ok(launcher.x<5&&launcher.y<5,'assistant launcher label centered: '+JSON.stringify(launcher));
    assert.ok(await p.locator('.hub-primary-nav .icon').count()>=6,'global navigation uses consistent icons');
    await p.screenshot({animations:'disabled',path:path.join(out,'empty.png')});
    await p.evaluate(()=>createSample());
    await p.waitForFunction(()=>S.project?.sequences.length>0);
    await p.screenshot({animations:'disabled',path:path.join(out,'shots.png')});
    const detailed=await p.locator('#content').evaluate(e=>e.scrollHeight);
    await p.locator('[data-action="compact"]').click();
    await p.waitForFunction(()=>S.project.compact);
    assert.equal(await p.locator('.shot').count(),0);
    assert.equal(await p.locator('.shot-table tbody tr').count(),2);
    assert.ok(await p.locator('#content').evaluate(e=>e.scrollHeight)<detailed);
    await p.screenshot({animations:'disabled',path:path.join(out,'shots-compact.png')});
    await p.locator('[data-action="edit-shot"]').first().click();
    await p.locator('[data-draft-bind$=".frame"]').fill('视觉回归：交接手部近景');
    await p.locator('#modal-submit').click();
    await p.waitForFunction(()=>!$('modal').open);
    assert.match(await p.locator('.shot-table tbody tr').first().innerText(),/视觉回归/);
    await p.evaluate(()=>act('page',{page:'home'}));
    await p.locator('[data-action="project-settings"]').click();
    await p.locator('[data-draft-bind="project.name"]').fill('视觉回归项目');
    await p.locator('#modal-submit').click();
    await p.waitForFunction(()=>$('breadcrumb').textContent.includes('视觉回归项目'));
    for(const key of ['home','assets','shots','workbench','review','delivery']){
      await p.evaluate(name=>act('page',{page:name}),key);
      await p.waitForFunction(x=>S.page===x,key);
      assert.ok(await p.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth+2),key+' horizontal overflow');
      await p.screenshot({animations:'disabled',path:path.join(out,key+'.png')});
    }
    await p.evaluate(()=>act('page',{page:'canvas'}));
    assert.ok(await p.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'canvas horizontal overflow');
    await p.locator('.canvas-empty [data-action="canvas-immersive-add"]').click();
    assert.ok(await p.locator('.canvas-immersive-add-menu').isVisible(),'empty canvas opens the node menu directly');
    await p.keyboard.press('Escape');
    const inspectorOverflow=await p.locator('#canvas-inspector').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth,wide:[...e.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>e.getBoundingClientRect().right+2).slice(0,5).map(x=>({tag:x.tagName,class:x.className,text:x.textContent?.slice(0,40),right:x.getBoundingClientRect().right}))}));
    assert.ok(inspectorOverflow.scroll<=inspectorOverflow.client+2,'canvas inspector horizontal overflow: '+JSON.stringify(inspectorOverflow));
    await p.screenshot({animations:'disabled',path:path.join(out,'canvas.png')});
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1050,720));
    for(const key of ['home','assets','workbench','delivery']){
      await p.evaluate(name=>act('page',{page:name}),key);
      assert.ok(await p.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth+2),key+' small-screen overflow');
    }
    await p.evaluate(()=>act('page',{page:'canvas'}));
    assert.ok(await p.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'canvas small-screen overflow');
    await p.evaluate(()=>modelCenter('chat'));
    const footer=await p.locator('.dialog-actions').boundingBox();
    assert.ok(footer.y+footer.height<=await p.evaluate(()=>innerHeight),'dialog actions visible');
    await p.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await p.locator('#modal').evaluate(e=>getComputedStyle(e).animationName),'none');
    assert.deepEqual(errors,[]);
    console.log('PASS responsive visual navigation, editing, modal and reduced motion');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
