/* Local screen behavior. Component implementations and styles come from ../02_components/ and ../01_foundations/. */
(() => {
  const rows=[...document.querySelectorAll('[data-shell="AltaIDE_TreeLevels"]')];
  const state=row=>AltaShell.definitions.get(row.dataset.shell).variants[Number(row.dataset.variant)].props;
  const original=new Map(rows.map(row=>[row,row.firstElementChild.style.background]));
  const select=row=>rows.forEach(other=>{const selected=other===row;other.setAttribute('aria-selected',String(selected));other.firstElementChild.style.background=selected?'var(--shell-treelevels-background-active)':'var(--shell-treelevels-background-default)';});
  /* Глубина строки: у строк без стрелки в Figma Level на 1 больше при том же отступе */const depth=r=>Number(state(r).Level)-(state(r).Type==='With Arrow'?0:1);const fold=(row,closed)=>{if(!row.hasAttribute('aria-expanded'))return;const at=rows.indexOf(row),level=depth(row);row.setAttribute('aria-expanded',String(!closed));let skip=Infinity;for(let i=at+1;i<rows.length&&depth(rows[i])>level;i++){const l=depth(rows[i]);if(l<=skip)skip=Infinity;rows[i].hidden=closed||l>skip;if(!closed&&l<skip&&rows[i].getAttribute('aria-expanded')==='false')skip=l;}};
  rows.forEach((row,i)=>{row.tabIndex=i===0?0:-1;row.setAttribute('role','treeitem');row.setAttribute('aria-label',row.querySelector('[data-source-text]')?.textContent||'');row.setAttribute('aria-level',state(row).Level);row.setAttribute('aria-selected',String(state(row).State==='Active'));if(state(row).Type==='With Arrow')row.setAttribute('aria-expanded','true');row.addEventListener('click',e=>{select(row);if(e.target.closest('[data-shell="AltaIDE_IconArrowStroke"],[data-name="AltaIDE/Icons/Arrow/Stroke"]'))fold(row,row.getAttribute('aria-expanded')!=='false');});row.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Enter',' '].includes(e.key))return;e.preventDefault();if(['Enter',' '].includes(e.key))select(row);else if(['ArrowLeft','ArrowRight'].includes(e.key))fold(row,e.key==='ArrowLeft');else{const visible=rows.filter(x=>!x.hidden);visible[Math.max(0,Math.min(visible.length-1,visible.indexOf(row)+(e.key==='ArrowDown'?1:-1)))].focus();}});});
  document.querySelectorAll('[data-shell="AltaIDE_MenuLink"],[data-shell="AltaIDE_IconToolbarsTBTop"]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',el.textContent.trim()||AltaShell.definitions.get(el.dataset.shell).variants[Number(el.dataset.variant)].props.Type);el.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();el.click();}});});
  const sidebar=document.querySelector('[data-name="AltaIDE/Sidebar"]'),separator=document.querySelector('[data-node-id="21247:489928"]');
  if(sidebar&&separator){separator.tabIndex=0;separator.setAttribute('role','separator');separator.setAttribute('aria-orientation','vertical');separator.setAttribute('aria-label','Ширина дерева проекта');const resize=value=>{value=Math.max(180,Math.min(innerWidth-280,value));document.documentElement.style.setProperty('--sidebar-width',value+'px');separator.setAttribute('aria-valuenow',value);};separator.addEventListener('pointerdown',e=>{separator.setPointerCapture(e.pointerId);separator.dataset.drag='true';});separator.addEventListener('pointermove',e=>{if(separator.dataset.drag)resize(e.clientX);});separator.addEventListener('pointerup',()=>delete separator.dataset.drag);separator.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();resize(sidebar.getBoundingClientRect().width+(e.key==='ArrowRight'?10:-10));}});}
})();

/* Контекстное меню дерева проекта: правый клик, Shift+F10 или клавиша меню на строке. #context-menu открывает меню на PRG_1 в положении из макета. */
(() => {
  const menu=document.querySelector('[data-name="AltaIDE/ContextMenu"]');
  if(!menu)return;
  const rows=[...document.querySelectorAll('[data-shell="AltaIDE_TreeLevels"]')];
  const items=[...menu.querySelectorAll('[data-shell="AltaIDE_ContextMenuItem"]')];
  let owner=null;
  /* При смене состояния (Hover) пункт перерисовывается из варианта компонента, и вложенный Shortcut получает текст по умолчанию — возвращаем текст экземпляра. */
  items.forEach(item=>{const key=item.querySelector('[data-text-prop="Code Text#185707:0"]')?.textContent;if(!key)return;const keep=()=>{const slot=item.querySelector('[data-text-prop="Code Text#185707:0"]');if(slot&&slot.textContent!==key){const control=slot.closest('.alta-control');if(window.AltaControls?.setProperties)AltaControls.setProperties(control,{'Code Text#185707:0':key});if(slot.isConnected&&slot.textContent!==key)slot.textContent=key;}};new MutationObserver(keep).observe(item,{childList:true,subtree:true,characterData:true});});
  const close=(restore=true)=>{if(menu.hidden)return;menu.hidden=true;owner?.removeAttribute('data-context-open');if(restore)owner?.focus();owner=null;};
  const open=(row,x,y)=>{close(false);owner=row;row.setAttribute('data-context-open','');menu.hidden=false;const w=menu.offsetWidth,h=menu.offsetHeight;menu.style.left=Math.max(0,Math.min(x,innerWidth-w))+'px';menu.style.top=Math.max(0,Math.min(y,innerHeight-h))+'px';};
  const focusItem=i=>{const n=items.length;items[((i%n)+n)%n].focus();};
  rows.forEach(row=>{
    row.addEventListener('contextmenu',e=>{e.preventDefault();open(row,e.clientX+24,row.getBoundingClientRect().top-4);});
    row.addEventListener('keydown',e=>{if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();const r=row.getBoundingClientRect();open(row,r.left+r.width/2,r.bottom);focusItem(0);}});
  });
  items.forEach((item,i)=>{
    item.addEventListener('click',()=>close());
    item.addEventListener('keydown',e=>{const k=e.key;if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();focusItem(i+(k==='ArrowDown'?1:-1));}else if(k==='Home'||k==='End'){e.preventDefault();focusItem(k==='Home'?0:items.length-1);}else if(k==='Enter'||k===' '){e.preventDefault();close();}else if(k==='Escape'||k==='Tab'){e.preventDefault();close();}});
  });
  document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))close(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  addEventListener('resize',()=>close(false));
  if(location.hash==='#context-menu'){const row=rows.find(r=>r.querySelector('[data-source-text]')?.textContent==='PRG_1');if(row)open(row,219,212);}
})();

/* Подсказки TooltipHelp (Type=Command) у команд тулбара и кнопок над деревом */
(()=>{
  const commands=[
    ['[data-shell="AltaIDE_IconToolbarsTBTop"][data-variant="69"]','Создать проект','Ctrl+N'],
    ['[data-shell="AltaIDE_IconToolbarsTBTop"][data-variant="61"]','Открыть проект','Ctrl+O'],
    ['.l-30a3a2f347db','Сохранить проект','Ctrl+S'],
    ['[data-shell="AltaIDE_IconToolbarsTBTop"][data-variant="70"]','Добавить устройство',''],
    ['[data-shell="AltaIDE_IconToolbarsTBTop"][data-variant="57"]','Скомпилировать проект','F11'],
    ['[data-shell="AltaIDE_IconToolbarsTBTop"][data-variant="51"]','Подключиться к устройству','Alt+F8'],
    ['[data-shell="AltaIDE_IconToolbarsTBTop"][data-variant="45"]','Загрузить проект в устройство','Ctrl+F8'],
    ['[data-shell="AltaIDE_IconToolbarsTBTop"][data-variant="43"]','Запустить','F5'],
    ['[data-shell="AltaIDE_IconToolbarsTBTop"][data-variant="33"]','Начать отладку','F6'],
    ['[data-shell="AltaIDE_IconToolbarsTBSidebar"][data-variant="3"]','Настройки проекта',''],
    ['[data-shell="AltaIDE_IconToolbarsTBSidebar"][data-variant="1"]','Развернуть все',''],
    ['[data-shell="AltaIDE_IconToolbarsTBSidebar"][data-variant="2"]','Свернуть все',''],
    ['[data-shell="AltaIDE_IconToolbarsTBSidebar"][data-variant="4"]','Поиск по проекту','Ctrl+F']
  ];
  const tip=document.createElement('div');
  tip.className='alta-control l-tooltip';tip.setAttribute('role','tooltip');tip.id='l-tooltip';tip.hidden=true;
  tip.innerHTML='<div class="fn n-63ee5e33c19c"><span class="fn n-8cd68033152e fn-text"></span><div class="fn n-0b932a7b9889"><span class="alta-control" data-visual-only><div class="fn n-98c244b82ceb"><span class="fn n-6a9b9b342745 fn-text"></span></div></span></div></div>';
  document.body.appendChild(tip);
  const name=tip.querySelector('.n-8cd68033152e'),keys=tip.querySelector('.n-6a9b9b342745'),keysBox=tip.querySelector('.n-0b932a7b9889');
  let timer=0,current=null;
  const show=el=>{current=el;name.textContent=el.dataset.tipName;keys.textContent=el.dataset.tipKeys;keysBox.hidden=!el.dataset.tipKeys;tip.hidden=false;
    const r=el.getBoundingClientRect(),w=tip.offsetWidth;tip.style.left=Math.max(4,Math.min(r.left,innerWidth-w-4))+'px';tip.style.top=(r.bottom+4)+'px';el.setAttribute('aria-describedby','l-tooltip');};
  const hide=()=>{clearTimeout(timer);tip.hidden=true;if(current)current.removeAttribute('aria-describedby');current=null;};
  commands.forEach(([sel,label,shortcut])=>{const el=document.querySelector(sel);if(!el)return;
    el.dataset.tipName=label;el.dataset.tipKeys=shortcut;el.classList.add('l-command');el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',label);
    el.addEventListener('pointerenter',()=>{clearTimeout(timer);timer=setTimeout(()=>show(el),current?0:500);});
    el.addEventListener('pointerleave',hide);el.addEventListener('pointerdown',hide);
    el.addEventListener('focus',()=>show(el));el.addEventListener('blur',hide);});
  addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
  addEventListener('scroll',hide,true);
})();

/* Вкладки открытых документов: переключение, закрытие, связь с деревом */
(()=>{
  const list=document.querySelector('[role="tablist"]');if(!list)return;
  const tabs=()=>[...list.querySelectorAll('[role="tab"]')];
  const treeRow=name=>[...document.querySelectorAll('[data-shell="AltaIDE_TreeLevels"]')].find(r=>(r.querySelector('[data-source-text]')?.textContent||'').trim()===name);
  const activate=(tab,{focus=false,syncTree=true}={})=>{
    tabs().forEach(t=>{const on=t===tab;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;});
    if(focus)tab.focus();
    const slot=document.querySelector('.master-slot');if(slot)slot.setAttribute('aria-label','Содержимое: '+tab.dataset.doc);
    if(syncTree){const row=treeRow(tab.dataset.doc);if(row){row.dataset.fromTab='1';row.click();delete row.dataset.fromTab;}}
  };
  const close=tab=>{const all=tabs(),i=all.indexOf(tab),wasActive=tab.getAttribute('aria-selected')==='true';tab.remove();
    const rest=tabs();if(wasActive&&rest.length)activate(rest[Math.min(i,rest.length-1)],{focus:true});};
  list.addEventListener('click',e=>{const tab=e.target.closest('[role="tab"]');if(!tab)return;
    if(e.target.closest('[data-tab-close]'))close(tab);else activate(tab);});
  list.addEventListener('auxclick',e=>{const tab=e.target.closest('[role="tab"]');if(tab&&e.button===1){e.preventDefault();close(tab);}});
  list.addEventListener('keydown',e=>{const all=tabs(),i=all.indexOf(document.activeElement);if(i<0)return;
    const go={ArrowRight:i+1,ArrowLeft:i-1,Home:0,End:all.length-1}[e.key];
    if(go!==undefined){e.preventDefault();activate(all[(go+all.length)%all.length],{focus:true});}
    else if(e.key==='Delete'){e.preventDefault();close(all[i]);}});
  /* Клик по строке дерева переключает на её вкладку, если документ открыт */
  document.querySelectorAll('[data-shell="AltaIDE_TreeLevels"]').forEach(row=>row.addEventListener('click',()=>{if(row.dataset.fromTab)return;
    const name=(row.querySelector('[data-source-text]')?.textContent||'').trim(),tab=tabs().find(t=>t.dataset.doc===name);if(tab)activate(tab,{syncTree:false});}));
})();
