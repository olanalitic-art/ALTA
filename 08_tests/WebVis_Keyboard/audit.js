/* Run await auditKeyboard() in the keyboard iframe's console.
 * Checks CSS geometry and semantic DS values for the currently visible state.
 * Tokens are resolved from the repository stylesheets, not copied HEX values.
 */
window.auditKeyboard = async function auditKeyboard() {
  await document.fonts.ready;
  const issues=[];
  const add=(element,property,expected,actual)=>issues.push({element,property,expected,actual});
  const visible=e=>e.getClientRects().length && getComputedStyle(e).display!=='none';
  const name=e=>e.id||e.getAttribute('aria-label')||e.className||e.tagName;
  const elements=[...document.querySelectorAll('main,dialog,.editor,footer,.row,button,input')].filter(visible);
  for(const e of elements){
    const r=e.getBoundingClientRect();
    for(const p of ['x','y','width','height']) if(Math.abs(r[p]-Math.round(r[p]))>0.001)add(name(e),p,'integer CSS px',r[p]);
    if(e.matches('button,input'))for(const p of ['width','height'])if(Math.round(r[p])%2)add(name(e),p,'even CSS px',r[p]);
    if(e.matches('dialog .key,dialog input,dialog footer button')){
      const panel=document.querySelector('dialog').getBoundingClientRect();
      if(r.left<panel.left || r.right>panel.right || r.top<panel.top || r.bottom>panel.bottom)add(name(e),'bounds','inside panel',r.toJSON());
    }
  }
  const chars=[...document.querySelectorAll('.key[data-character]')].filter(e=>e.id!=='zero');
  const widths=[...new Set(chars.map(e=>e.getBoundingClientRect().width))];
  if(widths.length!==1)add('character keys','width','all equal',widths);
  const token=(el,p,t)=>{
    const probe=document.createElement('span');probe.style.setProperty(p,getComputedStyle(el).getPropertyValue(t));document.body.append(probe);
    const v=getComputedStyle(probe).getPropertyValue(p);probe.remove();return v;
  };
  const checks=[];
  const check=(el,p,t)=>{
    if(!el || !visible(el))return;
    const expected=token(el,p,t),actual=getComputedStyle(el).getPropertyValue(p);
    checks.push({element:name(el),property:p,token:t,expected,actual});
    if(expected!==actual)add(name(el),p,t+' = '+expected,actual);
  };
  const state=e=>e.disabled?'disabled':e.matches(':active')?'pressed':e.matches(':hover')?'hover':'default';
  for(const e of document.querySelectorAll('.key,.cancel,.apply')){
    if(!visible(e))continue;
    const primary=e.matches('.apply'),prefix=primary?'primary':'secondary';
    let st=state(e);if(e.matches('.on'))st='pressed';
    check(e,'background-color','--buttons-'+prefix+'-background-'+st);
    const content=st==='hover'&&!primary?'hovered':st;
    check(e,'color','--buttons-'+prefix+'-content-'+content);
    check(e,'border-radius','--buttons-radius');
    check(e,'font-size','--body-regular-font-size');
    check(e,'line-height','--body-regular-line-height');
    if(!primary)check(e,'border-top-color','--buttons-secondary-border-'+(st==='hover'?'hovered':st));
  }
  const input=document.querySelector('#draft');
  const ist=input.matches(':focus')?'focused':input.matches(':hover')?'hover-filled':'default-filled';
  check(input,'background-color','--input-background-'+ist);
  check(input,'color','--input-content-'+ist);
  check(input,'border-top-color','--input-border-'+ist);
  check(input,'border-radius','--input-radius');
  check(input,'padding-left','--input-hpadding');
  check(document.querySelector('.editor'),'padding-left','--source-12');
  check(document.querySelector('.editor label'),'margin-bottom','--labels-vbetween');
  check(document.querySelector('footer'),'column-gap','--source-8');
  if(document.documentElement.scrollWidth>innerWidth)add('document','overflow','no horizontal overflow',document.documentElement.scrollWidth);
  const report={pass:issues.length===0,theme:document.documentElement.dataset.theme,viewport:[innerWidth,innerHeight],panel:document.querySelector('dialog').getBoundingClientRect().toJSON(),characterWidths:widths,checkedElements:elements.length,semanticChecks:checks.length,issues};
  console.table(issues.length?issues:[{result:'PASS',checks:checks.length,elements:elements.length}]);
  return report;
};

