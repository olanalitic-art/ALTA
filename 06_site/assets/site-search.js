/* Поиск по витрине. Индекс: assets/search-index.js (scripts/build_search_index.py).
   Ищет по названию, коду, имени и узлу Figma, синонимам, описанию, токенам, цветам и иконкам. */
(function(){
  var root=document.getElementById('site-search');var data=window.ALTA_SEARCH_INDEX;if(!root||!data)return;
  var input=root.querySelector('#ss-q'),list=root.querySelector('#ss-results'),count=root.querySelector('#ss-count'),hint=root.querySelector('#ss-hint')||{};
  var lib='all',active=-1,base=root.getAttribute('data-base')||'';
  var norm=function(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[‐-–—]/g,'-')};
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var hl=function(s,q){s=String(s);var i=norm(s).indexOf(q);if(!q||i<0)return esc(s);return esc(s.slice(0,i))+'<b class="ss-hit">'+esc(s.slice(i,i+q.length))+'</b>'+esc(s.slice(i+q.length))};
  var plural=function(n,a,b,c){var m=n%10,h=n%100;return n+' '+(m===1&&h!==11?a:m>=2&&m<=4&&(h<12||h>14)?b:c)};
  var parseNode=function(q){var m=q.match(/node-id=(\d+)[-:](\d+)/)||q.match(/^(\d+)[-:](\d+)$/);return m?m[1]+':'+m[2]:''};
  var hex=function(q){var m=q.match(/^#?([0-9a-f]{6})$/);return m?'#'+m[1]:''};
  var tokenLabel={title:'название',code:'код',figma:'Figma',node:'узел Figma',synonyms:'синоним',intro:'описание',tokens:'токен',colors:'цвет',icons:'иконка'};

  function scoreComponent(c,q){
    var node=parseNode(q),color=hex(q),best=null;
    var take=function(score,field,value){if(!best||score>best.score)best={score:score,field:field,value:value}};
    if(node&&c.node===node)take(120,'node',c.node);
    if(color&&c.colors.indexOf(color)>=0)take(90,'colors',color);
    if(node||color)return best;
    var t=norm(c.title);
    if(t===q)take(110,'title');else if(t.indexOf(q)===0)take(100,'title');else if(t.indexOf(q)>=0)take(85,'title');
    var code=norm(c.code);if(code&&code.indexOf(q.replace(/\s+/g,''))>=0)take(80,'code',c.code);
    c.figma.forEach(function(f){if(norm(f).indexOf(q)>=0)take(78,'figma',f)});
    var stem=q.length>=5?q.slice(0,-1):'';c.synonyms.forEach(function(s){var n=norm(s);if(n===q)take(95,'synonyms',s);else if(n.indexOf(q)>=0)take(70,'synonyms',s);else if(stem&&n.indexOf(stem)>=0)take(55,'synonyms',s)});
    if(norm(c.intro).indexOf(q)>=0)take(45,'intro');
    if(q.length>=3){c.tokens.forEach(function(s){if(norm(s).indexOf(q)>=0)take(norm(s)===q?75:40,'tokens',s)});
      c.icons.forEach(function(s){if(norm(s).indexOf(q)>=0)take(norm(s)===q?65:35,'icons',s)})}
    return best;
  }
  function render(){
    var q=norm(input.value).trim();active=-1;
    root.querySelectorAll('[data-lib]').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-lib')===lib))});
    if(!q){list.innerHTML='';list.hidden=true;count.textContent='';hint.hidden=false;return}
    hint.hidden=true;
    var comps=[];
    data.components.forEach(function(c){if(lib!=='all'&&lib!=='icons'&&c.lib!==lib)return;if(lib==='icons')return;
      var m=q?scoreComponent(c,q):{score:1,field:''};if(m)comps.push({c:c,m:m})});
    comps.sort(function(a,b){return b.m.score-a.m.score||a.c.title.localeCompare(b.c.title)});
    var icons=[];
    if((lib==='all'||lib==='icons')&&q.length>=2&&!hex(q)&&!parseNode(q)){
      data.icons.forEach(function(i){var n=norm(i.name),p=norm(i.path);if(n.indexOf(q)>=0||p.indexOf(q)>=0)icons.push(i)})}
    if(lib==='icons'&&!q)icons=data.icons.slice();
    var html='',bySlug={};data.components.forEach(function(c){bySlug[c.slug]=c});
    comps.slice(0,60).forEach(function(r){var c=r.c,m=r.m,why='';
      if(m.field&&m.field!=='title'&&m.field!=='intro'){var v=m.value||'';why='<span class="ss-why">'+tokenLabel[m.field]+': '+(m.field==='colors'?'<i class="ss-swatch" style="background:'+esc(v)+'"></i>':'')+hl(v,m.field==='code'?q.replace(/\s+/g,''):q)+'</span>'}
      html+='<li role="option" id="ss-o'+c.slug+'"><a href="'+base+c.url+'"><span class="ss-title">'+hl(c.title,q)+'</span><span class="ss-lib">'+esc(c.lib)+'</span><span class="ss-intro">'+(m.field==='intro'?hl(c.intro,q):esc(c.intro))+'</span>'+why+'</a></li>'});
    icons.slice(0,40).forEach(function(i){var used=i.used.map(function(s){return bySlug[s]?bySlug[s].title:s});
      html+='<li role="option" class="ss-icon"><a href="'+base+'foundations/icons/index.html?q='+encodeURIComponent(i.name)+'"><span class="ss-title">'+hl(i.name,q)+'</span><span class="ss-lib">Иконка</span><span class="ss-intro">'+esc(i.path)+'</span>'+(used.length?'<span class="ss-why">используется в: '+esc(used.slice(0,6).join(', '))+(used.length>6?' и ещё '+(used.length-6):'')+'</span>':'')+'</a></li>'});
    list.innerHTML=html;list.hidden=!html;
    var n=comps.length,k=icons.length;
    count.textContent=html?(n?plural(n,'компонент','компонента','компонентов'):'')+(n&&k?', ':'')+(k?plural(k,'иконка','иконки','иконок'):'')+(n>60||k>40?'. Показаны первые, уточните запрос':''):'Ничего не найдено. Попробуйте другое слово, название токена или цвет, например #3d414b.';
  }
  function move(d){var items=list.querySelectorAll('li a');if(!items.length)return;active=(active+d+items.length)%items.length;items[active].focus()}
  input.addEventListener('input',render);
  input.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();move(1)}else if(e.key==='Escape'){input.value='';render()}else if(e.key==='Enter'){var a=list.querySelector('li a');if(a){e.preventDefault();location.href=a.href}}});
  list.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();move(1)}else if(e.key==='ArrowUp'){e.preventDefault();if(active<=0){active=-1;input.focus()}else move(-1)}else if(e.key==='Escape'){input.focus()}});
  root.querySelectorAll('[data-lib]').forEach(function(b){b.addEventListener('click',function(){lib=b.getAttribute('data-lib');render();input.focus()})});
  root.querySelectorAll('[data-example]').forEach(function(b){b.addEventListener('click',function(){input.value=b.getAttribute('data-example');render();input.focus()})});
  render();
})();
