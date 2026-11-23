"use strict";
// Общий учебный сценарий для четырёх представлений.
// Типы нод сверены с каталогом olanalitic-art/ALTA (Node Read/Write/Add/GT/AND/NOT).
// Это визуальный прототип, не программа для контроллера.
const inputs={tRoom:28,tOffset:2,tSetpoint:29,bAuto:true,bFault:false};
const nodes=[
{id:'TEMP',kind:'READ',title:'Температура',detail:'tRoom · REAL',x:45,y:100},
{id:'OFFSET',kind:'READ',title:'Поправка датчика',detail:'tOffset · REAL',x:45,y:270},
{id:'ADD',kind:'ADD',title:'Сложение',detail:'tRoom + tOffset',x:300,y:165},
{id:'LIMIT',kind:'READ',title:'Уставка',detail:'tSetpoint · REAL',x:300,y:350},
{id:'GT',kind:'GT',title:'Выше уставки',detail:'tCorrected > tSetpoint',x:565,y:165},
{id:'AUTO',kind:'READ',title:'Авторежим',detail:'bAuto · BOOL',x:300,y:510},
{id:'FAULT',kind:'READ',title:'Авария',detail:'bFault · BOOL',x:45,y:650},
{id:'HEALTHY',kind:'NOT',title:'Нет аварии',detail:'NOT bFault',x:300,y:650},
{id:'PERMIT',kind:'AND',title:'Разрешение',detail:'bAuto AND bHealthy',x:565,y:550},
{id:'DEMAND',kind:'AND',title:'Запрос вентиляции',detail:'bHot AND bPermit',x:855,y:260},
{id:'FAN',kind:'WRITE',title:'Вентилятор',detail:'bFanCmd · BOOL',x:1165,y:135},
{id:'IDLENOT',kind:'NOT',title:'Нет запроса',detail:'NOT bDemand',x:1165,y:400},
{id:'IDLE',kind:'WRITE',title:'Ожидание',detail:'bIdle · BOOL',x:1460,y:400},
{id:'TEMPLOG',kind:'WRITE',title:'Экран HMI',detail:'tCorrected · REAL',x:855,y:55}
];
// Порт 0/1 определяет фактический вход операции. Все связи — передача данных.
const edges=[
['TEMP','ADD',0],['OFFSET','ADD',1],['ADD','GT',0],['LIMIT','GT',1],
['FAULT','HEALTHY',0],['AUTO','PERMIT',0],['HEALTHY','PERMIT',1],
['GT','DEMAND',0],['PERMIT','DEMAND',1],['DEMAND','FAN',0],
['DEMAND','IDLENOT',0],['IDLENOT','IDLE',0],['ADD','TEMPLOG',0]
];
const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
// Один допустимый порядок вычисления ациклической учебной схемы.
// Он фиксирован для сопоставимости вариантов, а не получен из ALTA runtime.
const execution=nodes.map(n=>n.id);
function evaluate(sample){
 const result={};
 result.TEMP=sample.tRoom;result.OFFSET=sample.tOffset;result.ADD=result.TEMP+result.OFFSET;
 result.LIMIT=sample.tSetpoint;result.GT=result.ADD>result.LIMIT;
 result.AUTO=sample.bAuto;result.FAULT=sample.bFault;result.HEALTHY=!result.FAULT;
 result.PERMIT=result.AUTO&&result.HEALTHY;result.DEMAND=result.GT&&result.PERMIT;
 result.FAN=result.DEMAND;result.IDLENOT=!result.DEMAND;result.IDLE=result.IDLENOT;result.TEMPLOG=result.ADD;
 return result;
}
const values=evaluate(inputs);
const resultNames={ADD:'tCorrected',GT:'bHot',HEALTHY:'bHealthy',PERMIT:'bPermit',DEMAND:'bDemand',IDLENOT:'bNoDemand'};

// Геометрия связей из Figma: ортогональная сетка, радиус поворота 4 px.
function roundedGridPath(points,radius=4){
 const clean=[];
 for(const p of points){
  if(clean.length&&p[0]===clean.at(-1)[0]&&p[1]===clean.at(-1)[1])continue;
  while(clean.length>1){const a=clean.at(-2),b=clean.at(-1);const ab=[b[0]-a[0],b[1]-a[1]],bc=[p[0]-b[0],p[1]-b[1]];
   if(ab[0]*bc[1]-ab[1]*bc[0]!==0||ab[0]*bc[0]+ab[1]*bc[1]<0)break;clean.pop();}
  clean.push(p);
 }
 if(clean.length<2)return '';
 let d=`M ${clean[0][0]} ${clean[0][1]}`;
 for(let i=1;i<clean.length-1;i++){
  const a=clean[i-1],b=clean[i],c=clean[i+1],before=Math.hypot(b[0]-a[0],b[1]-a[1]),after=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(radius,before/2,after/2);
  const start=[b[0]+(a[0]-b[0])*r/before,b[1]+(a[1]-b[1])*r/before],end=[b[0]+(c[0]-b[0])*r/after,b[1]+(c[1]-b[1])*r/after];
  d+=` L ${start[0]} ${start[1]} Q ${b[0]} ${b[1]} ${end[0]} ${end[1]}`;
 }
 const end=clean.at(-1);return d+` L ${end[0]} ${end[1]}`;
}
