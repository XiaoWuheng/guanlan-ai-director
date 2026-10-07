/* The canvas is a focused creative surface. Existing project and graph actions stay authoritative. */
const CANVAS_IMMERSIVE={menu:'',point:null};
function canvasImmersiveRevealNode(id){
 const stage=$('shot-canvas-stage'),node=document.querySelector(`[data-flow-node="${id}"],.shot-canvas-node[data-shot="${id}"]`);
 if(!stage||!node)return;
 const view=canvasViewport(),x=parseFloat(node.style.left)*view.z+view.x,y=parseFloat(node.style.top)*view.z+view.y,w=node.offsetWidth*view.z,h=node.offsetHeight*view.z;
 let changed=false;
 if(x<90){view.x+=90-x;changed=true;}else if(x+w>stage.clientWidth-56){view.x-=x+w-(stage.clientWidth-56);changed=true;}
 if(y<78){view.y+=78-y;changed=true;}else if(y+h>stage.clientHeight-92){view.y-=y+h-(stage.clientHeight-92);changed=true;}
 if(changed){canvasApply();canvasRemember();}
}
function canvasImmersiveMenu(open,x,y){const shell=document.querySelector('.canvas-shell'),menu=shell?.querySelector('.canvas-immersive-add-menu');if(!menu)return;CANVAS_IMMERSIVE.menu=open?'add':'';menu.hidden=!open;if(open){menu.style.left=(x??70)+'px';menu.style.top=(y??118)+'px';}shell.classList.toggle('canvas-add-open',open);shell.querySelector('[data-action="canvas-immersive-add"]')?.setAttribute('aria-expanded',String(open));}
function canvasImmersiveMount(){
 const shell=document.querySelector('.canvas-shell');if(!shell)return;
 const toolbar=shell.querySelector(':scope>.ws-toolbar'),rail=shell.querySelector('.canvas-desk-rail'),add=rail?.querySelector('.canvas-flow-add');if(!toolbar||!rail||!add)return;
 const title=toolbar.querySelector(':scope>strong');if(title)title.textContent='观澜';
 const identity=toolbar.querySelector('.canvas-desk-identity');if(identity)identity.textContent=S.project.name+' / 无限画布';
 const menuButton=document.createElement('button');menuButton.type='button';menuButton.className='canvas-immersive-brand';menuButton.dataset.action='canvas-immersive-nav';menuButton.setAttribute('aria-label','打开画布导航');menuButton.setAttribute('aria-expanded','false');menuButton.innerHTML='<span class="canvas-immersive-brand-mark" aria-hidden="true"></span><span class="canvas-immersive-brand-arrow">⌄</span>';toolbar.prepend(menuButton);
 const nav=document.createElement('section');nav.className='canvas-immersive-nav';nav.hidden=true;nav.setAttribute('aria-label','画布导航');nav.innerHTML='<strong>观澜 · 创作空间</strong>'+btn('返回首页','page','data-page="dashboard"')+btn('逐镜工作区','page','data-page="workbench"')+btn('统一资产库','page','data-page="library"')+btn('AI 实验室','page','data-page="tools"');shell.append(nav);
 rail.querySelector(':scope>small')?.remove();
 const addButton=document.createElement('button');addButton.type='button';addButton.className='canvas-immersive-add-trigger';addButton.dataset.action='canvas-immersive-add';addButton.setAttribute('aria-label','添加节点');addButton.setAttribute('title','添加节点');addButton.setAttribute('aria-expanded','false');addButton.textContent='＋';rail.prepend(addButton);
 const addMenu=document.createElement('section');addMenu.className='canvas-immersive-add-menu';addMenu.hidden=true;addMenu.setAttribute('aria-label','添加画布节点');addMenu.innerHTML='<small>节点</small>';
 addMenu.append(add);
 shell.append(addMenu);
 const existingImports=[...rail.querySelectorAll(':scope>button:not(.canvas-immersive-add-trigger)')];for(const button of existingImports){button.title=button.textContent.trim();button.textContent=button.dataset.action==='canvas-desk-import-project'?'▤':'▣';button.setAttribute('aria-label',button.title);}
 const bottom=shell.querySelector('.canvas-desk-bottom');if(bottom)for(const button of bottom.querySelectorAll('button')){const icons={'canvas-desk-map':'▥','canvas-fit':'⛶','canvas-layout':'▦','canvas-focus':'◎','canvas-desk-snap':'⌁','canvas-desk-links':'⌘','canvas-desk-shortcuts':'⌨','canvas-zoom':button.dataset.step==='-1'?'−':'＋','canvas-desk-undo':'↶','canvas-desk-redo':'↷'};const label=button.textContent.trim();button.title=label;button.setAttribute('aria-label',label);button.dataset.immersiveIcon=icons[button.dataset.action]||label;}
 for(const button of addMenu.querySelectorAll('.canvas-flow-add button')){button.dataset.immersiveIcon=button.dataset.icon||'＋';button.title=button.textContent.trim();}
 for(const node of shell.querySelectorAll('.shot-canvas-node')){node.classList.add('canvas-immersive-reference');if(!node.querySelector('.canvas-immersive-ref-art'))node.querySelector('.row')?.after(Object.assign(document.createElement('div'),{className:'canvas-immersive-ref-art',innerHTML:'<span>↗</span><small>逐镜提示词</small>'}));}
 const stage=$('shot-canvas-stage');stage?.addEventListener('contextmenu',event=>{if(event.target.closest('.shot-canvas-node,.canvas-graph-node'))return;event.preventDefault();const rect=stage.getBoundingClientRect(),v=canvasViewport();CANVAS_IMMERSIVE.point={x:(event.clientX-rect.left-v.x)/v.z,y:(event.clientY-rect.top-v.y)/v.z};const frame=shell.getBoundingClientRect();canvasImmersiveMenu(true,Math.max(8,Math.min(event.clientX-frame.left+8,frame.width-206)),Math.max(56,Math.min(event.clientY-frame.top+8,frame.height-340)));});
}
registerAction('canvas-immersive-add',()=>{const shell=document.querySelector('.canvas-shell'),open=CANVAS_IMMERSIVE.menu!=='add';CANVAS_IMMERSIVE.point=null;canvasImmersiveMenu(open,70,Math.min(110,shell?.clientHeight-340||110));});
registerAction('canvas-immersive-nav',()=>{const nav=document.querySelector('.canvas-immersive-nav');if(!nav)return;nav.hidden=!nav.hidden;document.querySelector('[data-action="canvas-immersive-nav"]')?.setAttribute('aria-expanded',String(!nav.hidden));});
document.addEventListener('click',event=>{if(S.page!=='canvas')return;const shell=document.querySelector('.canvas-shell');if(!shell)return;if(event.target.closest('.canvas-immersive-add-menu .canvas-flow-add button,.canvas-immersive-add-menu>[data-action]'))canvasImmersiveMenu(false);else if(CANVAS_IMMERSIVE.menu==='add'&&!event.target.closest('.canvas-immersive-add-menu,.canvas-immersive-add-trigger,.canvas-empty [data-action="canvas-immersive-add"]'))canvasImmersiveMenu(false);if(!event.target.closest('.canvas-immersive-nav,.canvas-immersive-brand')){const nav=shell.querySelector('.canvas-immersive-nav');if(nav){nav.hidden=true;shell.querySelector('[data-action="canvas-immersive-nav"]')?.setAttribute('aria-expanded','false');}}});
document.addEventListener('keydown',event=>{if(S.page==='canvas'&&event.key==='Escape')canvasImmersiveMenu(false);});
