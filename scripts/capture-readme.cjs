const {_electron}=require('playwright-core');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

(async()=>{
  const data=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-readme-'));
  const env={...process.env,DIRECTOR_DATA_DIR:data,DIRECTOR_HEADLESS:'1'};
  delete env.ELECTRON_RUN_AS_NODE;
  const app=await _electron.launch({args:[path.resolve('.')],env});
  try{
    const page=await app.firstWindow();
    await page.waitForFunction(()=>typeof PRODUCT!=='undefined'&&PRODUCT.ready);
    await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0];window.setSize(1680,1000);window.showInactive();});
    await page.evaluate(()=>createSample());
    const output=path.resolve('docs/assets');
    await fs.mkdir(output,{recursive:true});
    const capture=async(name,section)=>{
      await page.evaluate(section=>act('page',{page:section}),section);
      await page.waitForFunction(section=>S.page===section,section);
      await page.waitForTimeout(300);
      await page.screenshot({path:path.join(output,name+'.png'),animations:'disabled',scale:'css'});
      console.log(name+'.png');
    };
    await capture('home','dashboard');
    await capture('workbench','workbench');
    await capture('library','library');
    await page.evaluate(()=>{
      const row=DW.rows(S.project)[0],graph=flowGraph();
      S.project.canvasPositions||={};
      S.project.canvasPositions[row.sh.id]={x:96,y:160};
      graph.shotIds=[row.sh.id];
      graph.nodes=[
        {id:'readme-prompt',type:'prompt',x:496,y:160,title:'表演与机位',text:'陈安先看向林舟，再低头确认手中的铜钥匙；机位保持在桌南侧。',media:'',assetId:'',shotId:''},
        {id:'readme-generate',type:'generate',x:896,y:160,title:'雨夜 · 归还钥匙',text:'保留两人的空间站位与钥匙归属，镜头结束时等待林舟的反应。',media:'',assetId:'',shotId:''}
      ];
      graph.edges=[{from:row.sh.id,to:'readme-prompt'},{from:'readme-prompt',to:'readme-generate'}];
      CANVAS_FLOW.selected=null;
      render();
    });
    await page.evaluate(()=>act('page',{page:'canvas'}));
    await page.locator('.canvas-desk-rail').waitFor();
    await page.evaluate(()=>canvasFit());
    await page.waitForTimeout(350);
    await page.screenshot({path:path.join(output,'canvas-desk.png'),animations:'disabled',scale:'css'});
    console.log('canvas-desk.png');
  }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
