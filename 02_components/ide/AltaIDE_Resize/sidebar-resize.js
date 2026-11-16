/* Ресайз сайдбаров ALTA IDE.
   Требования: 07_docs/sidebar-resize.md
   - сайдбар 248–420 px, по умолчанию 248 px;
   - центральная область не уже 512 px;
   - разделитель 10 px;
   - минимальная ширина приложения 1380 px.
   Подключение:
     AltaSidebarResize.attach({panel, splitter, side:'left', app, others:[{panel, splitter}]});
   panel    — элемент сайдбара;
   splitter — разделитель AltaIDE_Resize рядом с ним;
   side     — 'left' или 'right' (с какой стороны окна сайдбар);
   app      — контейнер приложения, по его ширине считается доступное место;
   others   — другие открытые сайдбары с их разделителями (для правого и левого одновременно). */
(function(){
  const LIMITS={min:248,max:420,defaultWidth:248,centerMin:512,splitter:10,appMin:1380};
  const width=el=>el?el.getBoundingClientRect().width:0;
  function attach(o){
    const {panel,splitter}=o,side=o.side||'left',app=o.app||document.documentElement,others=o.others||[];
    if(!panel||!splitter)return null;
    const prop=o.property||('--sidebar-'+side+'-width');
    const max=()=>{const taken=others.reduce((s,x)=>s+width(x.panel)+(x.splitter?LIMITS.splitter:0),0);
      return Math.max(LIMITS.min,Math.min(LIMITS.max,width(app)-taken-LIMITS.centerMin-LIMITS.splitter));};
    const set=v=>{v=Math.round(Math.max(LIMITS.min,Math.min(max(),v)));
      panel.style.setProperty('width',v+'px','important');(o.root||document.documentElement).style.setProperty(prop,v+'px');
      splitter.setAttribute('aria-valuenow',v);splitter.setAttribute('aria-valuemax',Math.round(max()));return v;};
    splitter.tabIndex=0;splitter.setAttribute('role','separator');splitter.setAttribute('aria-orientation','vertical');
    splitter.setAttribute('aria-valuemin',LIMITS.min);splitter.style.cursor='col-resize';splitter.style.touchAction='none';
    let start=null;
    splitter.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();splitter.setPointerCapture(e.pointerId);start={x:e.clientX,w:width(panel)};document.body.style.cursor='col-resize';document.body.style.userSelect='none';});
    splitter.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x;set(start.w+(side==='left'?dx:-dx));});
    const end=()=>{start=null;document.body.style.cursor='';document.body.style.userSelect='';};
    splitter.addEventListener('pointerup',end);splitter.addEventListener('pointercancel',end);
    splitter.addEventListener('keydown',e=>{const step=e.shiftKey?50:10,grow=side==='left'?'ArrowRight':'ArrowLeft',shrink=side==='left'?'ArrowLeft':'ArrowRight';
      const v={[grow]:width(panel)+step,[shrink]:width(panel)-step,Home:LIMITS.min,End:Infinity}[e.key];
      if(v!==undefined){e.preventDefault();set(v);}});
    splitter.addEventListener('dblclick',()=>set(LIMITS.defaultWidth));
    addEventListener('resize',()=>set(width(panel)));
    set(o.initial||LIMITS.defaultWidth);
    return {set,max,limits:LIMITS};
  }
  window.AltaSidebarResize={attach,LIMITS};
})();
