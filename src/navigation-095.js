/* Learning is an adjacent workspace, outside the production sequence. */
const NAV95={returnPage:'home'};
registerAction('home-to-shot',async()=>{
 const p=requireProject(),editor=document.querySelector('.script-card textarea');if(!editor)throw Error('请先打开剧本页');
 const start=editor.selectionStart,end=editor.selectionEnd;
 const hit=DW.rows(p).find(r=>{const range=C.locate(p,r.g);return range&&(end>start?range.start<end&&range.end>start:range.start<=start&&range.end>=start);});
 if(!hit){S.page='shots';render();toast('这段原文还没有关联镜头，请先在分镜规划中建立');return;}
 S.seqId=hit.s.id;WS.selected[p.id]=hit.sh.id;WS.view='studio';S.page='workbench';render();toast('已定位到对应镜头');
});
icons.film='M3 5h18v14H3z M3 9h18 M7 5l3 4 M14 5l3 4 M8 13l5 3-5 3z';
const nav95RenderBase=render;
render=function(){
 nav95RenderBase();
 document.querySelector('.top-stages [data-page="film"]')?.remove();
 if(S.page==='home'&&S.project){const head=document.querySelector('#content .page-head');if(head&&!document.querySelector('.production-boundary'))document.querySelector('#content').insertAdjacentHTML('beforeend','<details class="production-boundary"><summary><strong>制作路径</strong><span>剧本与依据 → 资产 → 分镜方案 → 单镜生成或导入 → 审核交付</span></summary><p>观澜可提交 Seedance 单镜候选并核对结果，也可导入外部成片；剪辑在外部工具完成。</p></details>');}
 const rail=$('nav'),tools=rail?.querySelector('.u80-nav-tools');
 if(tools){
  const section=document.createElement('section');section.className='learning-nav';
  section.innerHTML=`<span class="learning-label">学习与参考</span>${btn(`${icon('film')}<span>拉片学习</span>`,'page','data-page="film" title="拉片学习 · 独立参考工具" aria-label="拉片学习"',S.page==='film'?'active':'')}`;
  tools.before(section);
 }
 if(S.page==='film'){
  const crumb=document.querySelector('.u80-context-bar>span');if(crumb)crumb.textContent='学习与参考 / 拉片学习';
  const head=document.querySelector('#content .page-head');
  if(head){const guide=document.createElement('div');guide.className='learning-guide';guide.innerHTML=`<div><strong>看短片，拆方法，再决定是否借鉴</strong><p>导入片段 → 逐镜观察并核对 → 存入导演参考库 → 按需用于当前项目。拉片记录独立保存，不会自动改动剧本或分镜。</p></div>${btn('返回制作','film-return','','small')}`;head.after(guide);}
 }
};
const nav95ActBase=act;
act=async function(action,d={}){
 if(action==='home-source'){const editor=document.querySelector('.script-card textarea');editor?.scrollIntoView({behavior:'smooth',block:'center'});editor?.focus();return;}
 if(action==='film-return')return nav95ActBase('page',{page:NAV95.returnPage||'home'});
 if(action==='page'&&d.page==='film'&&S.page!=='film')NAV95.returnPage=S.page;
 const result=await nav95ActBase(action,d);
 if(action==='u80-side-menu'){const menu=document.querySelector('#modal-body .ws-tool-menu');menu?.insertAdjacentHTML('beforeend',btn('拉片学习','page','data-page="film"')+btn('Token 用量','usage-dashboard'));}
 return result;
};
