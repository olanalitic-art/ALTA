
const root=document.documentElement, theme=document.querySelector('#theme');
function applyTheme(value){root.dataset.theme=value;document.querySelectorAll('iframe.alta-thumb').forEach(f=>{try{f.contentWindow.postMessage({altaTheme:value},'*')}catch(e){}});const dark=value==='dark';theme.querySelector('span').textContent=dark?'Светлая тема':'Тёмная тема';theme.setAttribute('aria-label',dark?'Переключить на светлую тему':'Переключить на тёмную тему')}
try{applyTheme(localStorage.getItem('alta-review-theme')||'light')}catch(e){applyTheme('light')}
theme.onclick=()=>{const value=root.dataset.theme==='dark'?'light':'dark';applyTheme(value);try{localStorage.setItem('alta-review-theme',value)}catch(e){}};
/* Активный пункт меню страницы: «Обзор компонента» — пока виден верх страницы, дальше — раздел, до которого дочитали */
const tree=document.querySelector('.component-tree.current');
if(tree){
  const overview=tree.querySelector('.nav-links a.component-overview');
  const links=[...tree.querySelectorAll('.nav-links a[data-section]')];
  const sections=links.map(link=>document.getElementById(link.dataset.section)).filter(Boolean);
  const all=overview?[overview,...links]:links;
  const setActive=current=>all.forEach(link=>{const on=link===current;link.classList.toggle('active',on);if(on)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
  let queued=false;
  const update=()=>{queued=false;const line=innerHeight*0.3;let current=overview||links[0];
    for(const section of sections){if(section.getBoundingClientRect().top<=line)current=links[sections.indexOf(section)]}
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-2&&links.length)current=links[links.length-1];
    setActive(current)};
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});
  addEventListener('resize',update);
  update();
}

/* Дерево компонентов: стрелка только раскрывает ветку; имя открывает страницу компонента с «Обзором компонента» */
document.querySelectorAll('.component-tree .component-name').forEach(name=>{
  name.addEventListener('click',event=>{
    const tree=name.closest('.component-tree');
    if(tree.classList.contains('current')){event.preventDefault();tree.open=true;scrollTo({top:0,behavior:'smooth'})}
  });
});

/* Превью ALTA во фреймах получают текущую тему при загрузке */
document.querySelectorAll('iframe.alta-thumb').forEach(frame=>frame.addEventListener('load',()=>{try{frame.contentWindow.postMessage({altaTheme:root.dataset.theme},'*')}catch(e){}}));

/* Главная: в меню подсвечен раздел, который сейчас на экране — «Основы», «Компоненты IDE» или «Компоненты CFC» */
(()=>{
  const pairs=[['foundations','.sidebar .foundation-link'],['components','.sidebar .components-link'],['cfc','.sidebar .cfc-link']]
    .map(([id,sel])=>[document.getElementById(id),document.querySelector(sel)]).filter(([sec,link])=>sec&&link);
  if(pairs.length<2)return;
  const set=el=>pairs.forEach(([,a])=>{if(a===el)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  let queued=false;
  const update=()=>{queued=false;let cur=pairs[0][1];
    for(const [sec,link] of pairs){if(sec.getBoundingClientRect().top<=innerHeight*0.3)cur=link}
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-2)cur=pairs[pairs.length-1][1];
    set(cur)};
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});
  addEventListener('resize',update);update();
})();

/* Меню: при переходе между страницами сохраняем прокрутку меню, чтобы оно не прыгало в начало */
(()=>{
  const sb=document.querySelector('.sidebar');if(!sb)return;
  const KEY='alta-sidebar-scroll';
  let saved=null;try{saved=sessionStorage.getItem(KEY)}catch(e){}
  if(saved!==null)sb.scrollTop=Number(saved)||0;
  else{const cur=sb.querySelector('.component-tree.current');if(cur){const r=cur.getBoundingClientRect(),s=sb.getBoundingClientRect();if(r.top>s.bottom-80)sb.scrollTop+=r.top-s.top-120}}
  const save=()=>{try{sessionStorage.setItem(KEY,String(sb.scrollTop))}catch(e){}};
  sb.addEventListener('click',save,true);sb.addEventListener('scroll',()=>{clearTimeout(sb._t);sb._t=setTimeout(save,150)},{passive:true});
  addEventListener('pagehide',save);
})();

/* Complete each preview grid with individual empty cells; never merge cells. */
(() => {
  const grids=[...document.querySelectorAll('.states')];
  const fill=grid=>{
    const columns=getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
    if(!columns)return;
    const cells=[...grid.children].filter(el=>el.classList.contains('state')&&!el.classList.contains('state--empty'));
    const empty=[...grid.children].filter(el=>el.classList.contains('state--empty'));
    const needed=(columns-cells.length%columns)%columns;
    if(empty.length===needed)return;
    empty.forEach(el=>el.remove());
    for(let i=0;i<needed;i++){const el=document.createElement('div');el.className='state state--empty';el.setAttribute('aria-hidden','true');grid.append(el);}
  };
  grids.forEach(fill);
  if(window.ResizeObserver){const observer=new ResizeObserver(entries=>entries.forEach(entry=>fill(entry.target)));grids.forEach(grid=>observer.observe(grid));}
  else addEventListener('resize',()=>grids.forEach(fill));
})();

/* Real interface texts instead of Figma placeholders in the live demo (re-applied after each re-render) */
(function(){var M=window.__ALTA_TEXTS;if(!M)return;
function rep(root){var c={},w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;while((n=w.nextNode())){var k=n.nodeValue.trim();var v=M[k];if(!v)continue;n.nodeValue=n.nodeValue.replace(k,v[(c[k]||0)%v.length]);c[k]=(c[k]||0)+1;}}
function hook(){document.querySelectorAll('.demo-stage,.state>.stage,.usage-example').forEach(function(s){rep(s);new MutationObserver(function(){rep(s)}).observe(s,{childList:true,subtree:true});});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();})();

/* Real texts are longer than Figma placeholders: let label texts hug their content (fields keep their width) */
(function(){function boxed(e){var cs=getComputedStyle(e);return cs.borderStyle!=='none'&&parseFloat(cs.borderWidth)>0||/inset/.test(cs.boxShadow)||(cs.backgroundColor&&cs.backgroundColor!=='rgba(0, 0, 0, 0)');}
function fit(root){root.querySelectorAll('[data-rt]').forEach(function(t){t.style.whiteSpace='nowrap';t.style.width='max-content';t.style.maxWidth='none';t.style.flex='none';t.style.position=getComputedStyle(t).position==='absolute'?'relative':'';
 var p=t.parentElement;while(p&&p!==root&&!p.matches('.stage,.demo-stage,.usage-example')){if(!boxed(p)&&p.scrollWidth>p.clientWidth+1){p.style.width='auto';p.style.maxWidth='none';}p=p.parentElement;}});}
function hook(){document.querySelectorAll('.demo-stage,.state>.stage,.usage-example').forEach(function(s){fit(s);new MutationObserver(function(){fit(s)}).observe(s,{childList:true,subtree:true});});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();})();
/* fill the last grid row of .states with blank cells so no grey gap shows */
(function(){function fill(g){g.querySelectorAll(':scope>.state--filler').forEach(function(e){e.remove()});var n=g.querySelectorAll(':scope>.state:not(.state--empty)').length;var cols=getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length||1;var k=(cols-n%cols)%cols;for(var i=0;i<k;i++){var e=document.createElement('div');e.className='state state--filler';e.setAttribute('aria-hidden','true');g.appendChild(e);}}
function all(){document.querySelectorAll('.states').forEach(fill)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',all);else all();window.addEventListener('resize',function(){clearTimeout(all.t);all.t=setTimeout(all,80)});})();
/* label-left composites: vertically centre the label against the field (Figma aligns them to the top) */
(function(){function fix(){document.querySelectorAll('.alta-component[data-component$="Label"] .alta-view>.fn').forEach(function(row){if(getComputedStyle(row).flexDirection!=='row')return;var lab=row.firstElementChild,fld=lab&&lab.nextElementSibling;if(!lab||!fld||!lab.classList.contains('fn-text'))return;var box=fld.firstElementChild&&fld.firstElementChild.classList.contains('fn')&&fld.children.length>1?fld.firstElementChild:fld;var h=box.getBoundingClientRect().height,lh=lab.getBoundingClientRect().height;if(h>lh)lab.style.marginTop=((h-lh)/2)+'px';});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();})();
/* texts wider than their Figma box (e.g. "Создать" in a 28px slot): let the box grow to the text */
(function(){function run(){document.querySelectorAll('.demo-stage .fn-text,.state .fn-text,.usage-example .fn-text').forEach(function(t){if(t.tagName!=='SPAN'||!t.offsetParent)return;var cs=getComputedStyle(t);if(cs.textOverflow==='ellipsis'||cs.overflow==='hidden')return;if(t.scrollWidth>t.clientWidth+1&&t.clientHeight<=parseFloat(cs.lineHeight)*1.5){t.style.width='max-content';t.style.minWidth=t.style.width;t.style.flex='none';t.style.whiteSpace='nowrap';}});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(run,0)});else setTimeout(run,0);})();
(function(){
  function fit(){document.querySelectorAll('.demo-stage,.state>.stage').forEach(function(s){s.classList.remove('stage-overflow');if(s.scrollWidth>s.clientWidth+1)s.classList.add('stage-overflow');});}
  if(document.readyState!=='loading')setTimeout(fit,50);else document.addEventListener('DOMContentLoaded',function(){setTimeout(fit,50)});
  addEventListener('load',fit);addEventListener('resize',fit);
  document.addEventListener('change',function(){setTimeout(fit,30)});
})();

(function(){
  function swap(){document.querySelectorAll('img[src*="glyphs/segoe-fluent-"]').forEach(function(img){
    var m=img.getAttribute('src').match(/segoe-fluent-([0-9a-f]+)\.svg/);if(!m)return;
    var s=document.createElement('span');s.className='seg-glyph '+(img.className||'');s.dataset.g=m[1];
    s.style.width=(img.getAttribute('width')||16)+'px';s.style.height=(img.getAttribute('height')||16)+'px';
    s.setAttribute('aria-hidden','true');img.replaceWith(s);});}
  if(document.readyState!=='loading')swap();else document.addEventListener('DOMContentLoaded',swap);
  new MutationObserver(function(){if(document.querySelector('img[src*="glyphs/segoe-fluent-"]'))swap();}).observe(document.documentElement,{childList:true,subtree:true});
})();
