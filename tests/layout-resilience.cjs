const {_electron}=require('playwright-core');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');

(async()=>{
  const data=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-layout-'));
  const out=path.resolve('audit-evidence/layout-resilience');
  await fs.mkdir(out,{recursive:true});
  const env={...process.env,DIRECTOR_DATA_DIR:data,DIRECTOR_HEADLESS:'1'};
  delete env.ELECTRON_RUN_AS_NODE;
  const exe=process.argv[2]&&path.resolve(process.argv[2]);
  const app=await _electron.launch({executablePath:exe||require('electron'),args:exe?[]:[path.resolve('.')],env});
  const results=[];
  try{
    const page=await app.firstWindow();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.waitForFunction(()=>typeof U80!=='undefined'&&PRODUCT.ready);
    await page.evaluate(()=>createSample());
    await page.evaluate(()=>act('page',{page:'workbench'}));
    const snapshot=async(label)=>{
      await page.waitForTimeout(250);
      const result=await page.evaluate(()=>{
        const rect=s=>document.querySelector(s)?.getBoundingClientRect().toJSON();
        const visible=[...document.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b),scroll=b.closest('nav');if(scroll){const c=scroll.getBoundingClientRect();if(r.bottom<=c.top||r.top>=c.bottom)return false;}return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';});
        const clipped=visible.filter(b=>{const r=b.getBoundingClientRect();return r.right>innerWidth+1||r.left<-1||r.bottom>innerHeight+1||r.top<-1;}).slice(0,20).map(b=>({action:b.dataset.action,text:b.textContent.trim(),rect:b.getBoundingClientRect().toJSON()}));
        const rail=[...document.querySelectorAll('aside button')].filter(b=>{const r=b.getBoundingClientRect();return r.width&&r.height;}).map(b=>({action:b.dataset.action,rect:b.getBoundingClientRect().toJSON()}));
        return {viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,zoom:window.visualViewport?.scale},shell:rect('.shell'),aside:rect('aside'),main:rect('main'),header:rect('main>header'),content:rect('#content'),status:rect('#ws-statusbar'),scroll:{body:document.body.scrollWidth,main:document.querySelector('main').scrollWidth},clipped,rail};
      });
      results.push({label,...result});
      await page.screenshot({path:path.join(out,label+'.png')});
    };
    await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.setSize(1460,980);w.showInactive();});
    await snapshot('standard');
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].maximize());
    await snapshot('maximized');
    await page.evaluate(()=>act('nav-collapse'));
    if(await page.evaluate(()=>$('modal').open)){
      await snapshot('maximized-navigation');
      await page.evaluate(()=>closeModal());
    }else await snapshot('maximized-collapsed');
    await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.unmaximize();w.setSize(1050,720);});
    await snapshot('minimum');
    await page.locator('.ws-toolbar .more-menu summary').click();
    await snapshot('minimum-menu');
    const menus=[];
    for(const section of ['home','assets','shots','workbench','review','delivery']){
      await page.evaluate(section=>act('page',{page:section}),section);
      const count=await page.locator('.more-menu summary').count();
      for(let index=0;index<Math.min(count,12);index++){
        const summary=page.locator('.more-menu summary').nth(index);
        if(!await summary.isVisible())continue;
        await summary.scrollIntoViewIfNeeded();
        await summary.click();
        await page.waitForTimeout(80);
        const result=await summary.evaluate(el=>{
          const menu=el.closest('.more-menu'),popup=menu.querySelector('.more-actions');
          if(!menu.open)return {open:false};
          const r=popup.getBoundingClientRect(),x=Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),y=Math.max(0,Math.min(innerHeight-1,r.top+Math.min(20,r.height/2))),hit=document.elementFromPoint(x,y);
          return {open:true,rect:r.toJSON(),viewport:{width:innerWidth,height:innerHeight},visibleHit:popup.contains(hit),hit:hit?.outerHTML?.slice(0,120)};
        });
        menus.push({section,index,...result});
        await summary.click();
      }
    }
    const pages=[];
    for(const scale of [100,125]){
      await page.evaluate(async scale=>applyPersonal(await call('personal:save',{scale,home:'workbench'})),scale);
      for(const section of ['home','assets','shots','workbench','review','delivery','prompts','film','guide']){
        await page.evaluate(section=>act(section==='guide'?'help':'page',{page:section}),section);
        await page.waitForTimeout(80);
        pages.push(await page.evaluate(()=>{
          const main=document.querySelector('main'),aside=document.querySelector('aside'),header=document.querySelector('main>header');
          return {page:S.page,scale:Math.round(100*window.visualViewport.scale),viewport:innerWidth,body:document.body.scrollWidth,mainScroll:main.scrollWidth,mainClient:main.clientWidth,asideRight:aside.getBoundingClientRect().right,headerRight:header.getBoundingClientRect().right};
        }));
      }
    }
    await page.evaluate(()=>act('sidebar-tools'));
    const dialog=await page.evaluate(()=>{
      const modal=document.querySelector('#modal'),r=modal.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+Math.min(80,r.height/2);
      return {open:modal.open,rect:r.toJSON(),viewport:{width:innerWidth,height:innerHeight},visibleHit:modal.contains(document.elementFromPoint(x,y))};
    });
    await page.locator('[data-action="close-modal"]').first().click();
    await fs.writeFile(path.join(out,'metrics.json'),JSON.stringify(results,null,2));
    await fs.writeFile(path.join(out,'menus.json'),JSON.stringify(menus,null,2));
    await fs.writeFile(path.join(out,'pages.json'),JSON.stringify(pages,null,2));
    await fs.writeFile(path.join(out,'dialog.json'),JSON.stringify(dialog,null,2));
    for(const item of results){
      assert.ok(Math.abs(item.content.right-item.main.right)<1,'工作区右侧留白：'+item.label);
      assert.equal(item.clipped.length,0,'可见按钮越界：'+item.label);
      assert.ok(item.scroll.body<=item.viewport.width+1,'页面水平溢出：'+item.label);
      for(const control of item.rail)assert.ok(control.rect.left>=item.aside.left-1&&control.rect.right<=item.aside.right+1,'侧栏按钮被裁切：'+item.label+'/'+control.action);
    }
    for(const item of menus)if(item.open){
      assert.ok(item.visibleHit,'操作菜单被遮挡：'+item.section+'/'+item.index);
      assert.ok(item.rect.left>=-1&&item.rect.top>=-1&&item.rect.right<=item.viewport.width+1&&item.rect.bottom<=item.viewport.height+1,'操作菜单超出窗口：'+item.section+'/'+item.index);
    }
    for(const item of pages)assert.ok(item.body<=item.viewport+1&&item.mainScroll<=item.mainClient+1,'页面横向溢出：'+item.page);
    assert.ok(dialog.open&&dialog.visibleHit&&dialog.rect.left>=0&&dialog.rect.top>=0&&dialog.rect.right<=dialog.viewport.width+1&&dialog.rect.bottom<=dialog.viewport.height+1,'管理弹窗被遮挡或越界');
    if(errors.length)throw Error('页面脚本异常：'+errors.join(' | '));
    console.log(JSON.stringify(results.map(({label,viewport,shell,main,content,scroll,clipped})=>({label,viewport,shellRight:shell.right,mainRight:main.right,contentRight:content.right,scroll,clipped:clipped.length})),null,2));
    console.log('MENUS '+JSON.stringify(menus.filter(m=>m.open&&(!m.visibleHit||m.rect.bottom>m.viewport.height||m.rect.right>m.viewport.width)).map(({section,index,visibleHit,rect,viewport})=>({section,index,visibleHit,rect,viewport}))));
    console.log('PAGES '+JSON.stringify(pages.filter(p=>p.body>p.viewport+1||p.mainScroll>p.mainClient+1)));
    console.log('PASS 多窗口尺寸、折叠导航、'+menus.length+' 个菜单、'+pages.length+' 个页面/缩放组合');
  }finally{
    await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
    await app.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
