"use strict";
// A–D используют один сценарий, компоненты и геометрию. Различается только представление выбора.
const layout={
 TEMP:[60,160],OFFSET:[60,290],ADD:[385,180],LIMIT:[340,375],GT:[655,180],
 AUTO:[340,515],FAULT:[60,680],HEALTHY:[385,680],PERMIT:[655,535],
 DEMAND:[1000,305],FAN:[1290,210],IDLENOT:[1160,470],IDLE:[1330,470],TEMPLOG:[875,95]
};
const variableNames={TEMP:'tRoom',OFFSET:'tOffset',LIMIT:'tSetpoint',AUTO:'bAuto',FAULT:'bFault',FAN:'bFanCmd',IDLE:'bIdle',TEMPLOG:'tCorrected'};
const labels={ADD:'Поправка температуры',GT:'Проверка уставки',HEALTHY:'Нет аварии',PERMIT:'Разрешение работы',DEMAND:'Запрос вентиляции',IDLENOT:'Инверсия запроса'};
const hierarchyNumbers=branchNumbers(execution,edges);
const host=document.querySelector('#ui-nodes');
const variant=document.body.dataset.variant||'a';
let selectedNode=null;
for(const n of nodes){
 const outer=document.createElement('div');outer.className='static-node';outer.dataset.id=n.id;outer.dataset.kind=n.kind;layout[n.id]=[Math.round((60+(layout[n.id][0]-60)*1.2)/10)*10,Math.round(layout[n.id][1]/10)*10];outer.style.left=layout[n.id][0]+'px';outer.style.top=layout[n.id][1]+'px';
 outer.innerHTML=componentTemplates[n.kind];
 outer.setAttribute('role','button');outer.tabIndex=0;outer.setAttribute('aria-pressed','false');outer.setAttribute('aria-label',`${execution.indexOf(n.id)+1}. ${n.title}, ${n.kind}`);
 outer.addEventListener('click',()=>selectNode(n.id));outer.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectNode(n.id);}});
 outer.firstElementChild.setAttribute('data-static','');outer.firstElementChild.setAttribute('aria-label',n.kind+': '+n.title);
 outer.querySelectorAll('[tabindex]').forEach(el=>el.removeAttribute('tabindex'));
 // Заполняем штатную строку выбора переменной экземпляра компонента.
 if(variableNames[n.id]){const caption=outer.querySelector('[data-source-text="Var_StepFull"],[data-source-text="bGridSupport"],[data-source-text="Выберите переменную..."]');if(!caption)throw Error('Variable slot missing: '+n.id);caption.textContent=variableNames[n.id];}
 const desc=document.createElement('div');desc.className='node-description';desc.textContent=labels[n.id]||n.title;outer.append(desc);
 const result=document.createElement('div');result.className='node-result';const value=typeof values[n.id]==='boolean'?(values[n.id]?'TRUE':'FALSE'):values[n.id].toFixed(1)+' °C';
 result.textContent=(resultNames[n.id]?resultNames[n.id]+' = ':'')+value;outer.append(result);host.append(outer);
}
function canvasScale(){return Number(document.querySelector('#static-canvas').dataset.scale)||1;}
function point(el){const r=el.getBoundingClientRect(),base=document.querySelector('#static-canvas').getBoundingClientRect(),scale=canvasScale();return{x:(r.left+r.width/2-base.left)/scale,y:(r.top+r.height/2-base.top)/scale};}
function ports(id){const root=document.querySelector(`.static-node[data-id="${id}"]`),r=root.firstElementChild.getBoundingClientRect();const all=[...root.querySelectorAll('[data-cfc="AltaCFC_Ports"]')].map(el=>({el,...point(el)}));const center=layout[id][0]+r.width/(2*canvasScale());return{inputs:all.filter(p=>p.x<center).sort((a,b)=>a.y-b.y),outputs:all.filter(p=>p.x>=center).sort((a,b)=>a.y-b.y)};}
function drawWires(){
 const portMap=Object.fromEntries(nodes.map(n=>[n.id,ports(n.id)]));
 const paths=edges.map(([from,to,index])=>{const a=portMap[from].outputs[0],b=portMap[to].inputs[index];if(!a||!b)throw Error('Port missing: '+from+' / '+to+' / '+index);
 const type=typeof values[from]==='boolean'?'bool':'real';a.el.style.setProperty('--signal',`var(--cfc-ports-${type==='bool'?'bool':'float'}-border)`);a.el.style.setProperty('--signal-bg',`var(--cfc-ports-${type==='bool'?'bool':'float'}-bg)`);b.el.style.setProperty('--signal',`var(--cfc-ports-${type==='bool'?'bool':'float'}-border)`);b.el.style.setProperty('--signal-bg',`var(--cfc-ports-${type==='bool'?'bool':'float'}-bg)`);
 const sx=a.x+5,sy=a.y,tx=b.x-5,ty=b.y;
 // Углы трассы на сетке 10 px, локальное скругление 4 px — как в Figma.
 let d;if(from==='ADD'&&to==='TEMPLOG'){d=roundedGridPath([[sx,sy],[710,sy],[710,50],[1000,50],[1000,ty],[tx,ty]]);}
 else{const mid=from==='PERMIT'?1070:from==='LIMIT'?710:Math.round((sx+tx)/20)*10;d=roundedGridPath([[sx,sy],[mid,sy],[mid,ty],[tx,ty]]);}
 return `<path class="ui-wire ${type}" data-from="${from}" data-to="${to}" d="${d}"/>`;
 }).join('');document.querySelector('#ui-connections').innerHTML=paths;
 renderSelection();
}
function fitCanvas(){const canvas=document.querySelector('#static-canvas'),available=canvas.parentElement.clientWidth;const scale=available>=900?Math.min(1,available/1840):1;canvas.dataset.scale=scale;canvas.style.zoom=scale;}
fitCanvas();
document.fonts.ready.then(()=>{fitCanvas();drawWires();});
window.addEventListener('resize',()=>{fitCanvas();drawWires();});

function selectNode(id){selectedNode=selectedNode===id?null:id;renderSelection();}
function reachable(id,reverse){const found=new Set(),stack=[id];while(stack.length){const current=stack.pop();for(const [a,b] of edges){const source=reverse?b:a,target=reverse?a:b;if(source===current&&target!==id&&!found.has(target)){found.add(target);stack.push(target);}}}return found;}
function renderSelection(){
 const up=selectedNode?reachable(selectedNode,true):new Set(),down=selectedNode&&(variant==='a'||variant==='d')?reachable(selectedNode,false):new Set();
 const chain=new Set([...up,...down,selectedNode]);
 const numbered=selectedNode?(variant==='a'?execution:variant==='b'?execution.filter(id=>chain.has(id)):[]):[];
 document.querySelectorAll('.static-node').forEach(el=>{
  const id=el.dataset.id,chosen=id===selectedNode,related=!!selectedNode&&variant!=='a'&&chain.has(id),muted=!!selectedNode&&(variant==='c'||variant==='d')&&!chain.has(id);
  el.classList.toggle('is-selected',chosen);el.classList.toggle('is-related',related);el.classList.toggle('is-muted',muted);el.setAttribute('aria-pressed',String(chosen));
  const number=numbered.indexOf(id)+1;
  el.querySelector('.execution-order')?.remove();
  const displayNumber=number?(variant==='a'?hierarchyNumbers[id]:String(number)):'';
  if(displayNumber){const badge=document.createElement('span');badge.className='execution-order';badge.textContent=displayNumber;badge.setAttribute('aria-hidden','true');el.append(badge);}
  el.setAttribute('aria-label',`${displayNumber?displayNumber+'. ':''}${byId[id].title}, ${byId[id].kind}`);
 });
 document.querySelectorAll('.is-active-port').forEach(el=>el.classList.remove('is-active-port'));
 let count=0;
 document.querySelectorAll('.ui-wire').forEach(path=>{
  const a=path.dataset.from,b=path.dataset.to;
  const active=!!selectedNode&&((up.has(a)&&(up.has(b)||b===selectedNode))||(down.has(b)&&(down.has(a)||a===selectedNode)));
  path.classList.toggle('is-active',active);path.classList.toggle('is-muted',!!selectedNode&&(variant==='c'||variant==='d')&&!active);
  if(active){count++;const from=ports(a),to=ports(b),edge=edges.find(e=>e[0]===a&&e[1]===b);from.outputs[0].el.classList.add('is-active-port');to.inputs[edge[2]].el.classList.add('is-active-port');}
 });
 // Активные трассы поверх совпадающих участков соседних ветвей.
 document.querySelectorAll('.ui-wire.is-active').forEach(path=>path.parentNode.append(path));
 document.querySelector('#selection-status').textContent=selectedNode?`Выбрано: ${byId[selectedNode].title} · Связей: ${count}`:'Выберите ноду, чтобы увидеть '+(variant==='a'?'общий порядок исполнения':variant==='b'?'порядок её цепочки':variant==='c'?'её зависимости':'её зависимости и дальнейшее влияние');
}
document.querySelector('#static-canvas').addEventListener('click',event=>{if(!event.target.closest('.static-node')){selectedNode=null;renderSelection();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){selectedNode=null;renderSelection();}});

// Для развилки N: N.1.1, N.1.2… / N.2.1, N.2.2… .
// Вложенная развилка продолжает полный номер родителя. Одна нода имеет один номер.
function branchNumbers(order,graph){
 const labels={},scopes={};let rootNumber=0;
 const targets=id=>[...new Set(graph.filter(edge=>edge[0]===id).map(edge=>edge[1]))];
 for(const id of order){
  const candidates=graph.filter(edge=>edge[1]===id).map(([from])=>{
   const branches=targets(from);
   if(branches.length>1)return{prefix:labels[from]+'.'+(branches.indexOf(id)+1),step:1};
   if(scopes[from])return{prefix:scopes[from].prefix,step:scopes[from].step+1};
   return null;
  }).filter(Boolean).sort((a,b)=>b.prefix.split('.').length-a.prefix.split('.').length);
  if(candidates.length){scopes[id]=candidates[0];labels[id]=scopes[id].prefix+'.'+scopes[id].step;}
  else labels[id]=String(++rootNumber);
 }
 return labels;
}
