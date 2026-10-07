const HELP={chapter:'start',query:''};
const HELP_PAGES={film:'film-study',home:'script',assets:'assets',shots:'planning',workbench:'directing',methods:'knowledge',memory:'knowledge',facts:'knowledge',knowledge:'knowledge',rules:'knowledge',review:'export',prompts:'export',delivery:'export',recovery:'storage',history:'trouble',usage:'usage'};
function guideView(){
 const chapter=DirectorHelp.chapters.find(c=>c.id===HELP.chapter)||DirectorHelp.chapters[0];
 const query=HELP.query.toLowerCase();
 const matches=DirectorHelp.chapters.filter(c=>JSON.stringify([c.title,c.intro,c.steps]).toLowerCase().includes(query));
 let group='';
 const navigation=matches.map(c=>{const heading=c.group!==group?`<span class="guide-group">${esc(c.group||'其他')}</span>`:'';group=c.group;return heading+`<button class="${c.id===chapter.id?'active':''}" data-action="guide-chapter" data-chapter="${c.id}" ${c.id===chapter.id?'aria-current="page"':''}>${esc(c.title)}</button>`;}).join('');
 return `<div class="page-head"><div><h1>使用指南</h1><p class="muted">观澜 ${DirectorHelp.version} · 按任务找步骤 · 阅读不调用模型</p></div></div><div class="guide-layout"><section class="guide-menu card"><label for="guide-search">我想做什么？</label><div class="row"><input id="guide-search" value="${esc(HELP.query)}" placeholder="搜索：分镜、保存、429"><button data-action="guide-search">搜索</button></div>${query?'<button class="small" data-action="guide-clear">清除搜索</button>':''}<nav aria-label="指南章节">${navigation}</nav>${!matches.length?'<p>没有找到相关步骤。试试“模型”“审核”“保存”，或清除搜索。</p>':''}</section><article class="guide-article card"><span class="eyebrow">${esc(chapter.group||'操作指南')}</span><h2>${esc(chapter.title)}</h2><p class="guide-intro">${esc(chapter.intro)}</p><ol class="guide-steps">${chapter.steps.map(([title,action,expected])=>`<li><h3>${esc(title)}</h3><p><b>操作：</b>${esc(action)}</p><p class="guide-expected"><b>完成后：</b>${esc(expected||'核对页面提示。')}</p></li>`).join('')}</ol><div class="guide-result"><strong>本章目标</strong><p>${esc(chapter.result)}</p></div><div class="row wrap">${(chapter.actions||[]).map(([label,action,page])=>btn(label,'guide-go',`data-go="${action}" data-page="${page||''}"`)).join('')}</div><div class="guide-pager">${DirectorHelp.chapters.indexOf(chapter)>0?btn('← 上一章','guide-chapter',`data-chapter="${DirectorHelp.chapters[DirectorHelp.chapters.indexOf(chapter)-1].id}"`):'<span></span>'}${DirectorHelp.chapters.indexOf(chapter)<DirectorHelp.chapters.length-1?btn('下一章 →','guide-chapter',`data-chapter="${DirectorHelp.chapters[DirectorHelp.chapters.indexOf(chapter)+1].id}"`):''}</div></article></div>`;
}
const helpPreviousRender=render;
render=function(){helpPreviousRender();$('nav').insertAdjacentHTML('beforeend',navItem('guide','使用指南'));
 if(S.page==='guide'){$('breadcrumb').textContent='使用指南';return;}
 const chapter=HELP_PAGES[S.page]||'start';
 $('content').insertAdjacentHTML('afterbegin',`<div class="guide-context"><span>${S.project?'不确定这一步怎么做？':'第一次使用？先跟着原创示例走一遍，不需要模型。'}</span>${btn(S.project?'这个页面怎么用':'打开入门指南','guide-chapter',`data-chapter="${S.project?chapter:'start'}"`)}${S.project?.name==='原创示例 · 雨夜归还'?btn('示例练习步骤','guide-chapter','data-chapter="sample"'):''}</div>`);
};
const helpPreviousAct=act;
act=async function(action,d={}){
 if(action==='help'||action==='guide-chapter'){HELP.chapter=d.chapter||'start';HELP.query='';S.page='guide';render();$('content').scrollTop=0;window.scrollTo(0,0);return;}
 if(action==='guide-search'){HELP.query=$('guide-search').value.trim();const found=DirectorHelp.chapters.find(c=>JSON.stringify([c.title,c.intro,c.steps]).toLowerCase().includes(HELP.query.toLowerCase()));if(found)HELP.chapter=found.id;render();$('guide-search').focus();return;}
 if(action==='guide-clear'){HELP.query='';render();return;}
 if(action==='guide-go'){if(d.go==='page'&&!S.project){toast('请先创建项目，或在“先看这里”创建原创练习项目。');return;}return helpPreviousAct(d.go,{page:d.page});}
 return helpPreviousAct(action,d);
};
document.addEventListener('keydown',event=>{if(event.target.id==='guide-search'&&event.key==='Enter'){event.preventDefault();act('guide-search').catch(showError);}});
