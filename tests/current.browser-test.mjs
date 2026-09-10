// Focused acceptance for the current native app, independent of historical layouts.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { width:1500,height:1100,script:20000 });
let failed = false;
try {
 assert.equal((await g.waitFor('window.__LW&&__LW.ready',150,100)).ok,1);
 const boot = await g.ev(`const workers=__LW.maths.started,period=__LW.period;return {errors:__e,dirty:__LW.layout.projects.dirty,gpu:__LW.field.error||null,workers,period,workersAfterPeriod:__LW.maths.started,
  heliumComputed:__LW.helium.computed,ladderComputed:__LW.ladder.computed,moCurveDone:__LW.mo.state().curveDone}`);
 assert.deepEqual(boot.errors,[]); assert.equal(boot.dirty,false);
 assert.deepEqual(boot.workers,{bow:false,scan:false,cards:false});
 assert.equal(boot.period.exact,true); assert.deepEqual(boot.workersAfterPeriod,{bow:false,scan:false,cards:false});
 assert.equal(boot.heliumComputed,false);assert.equal(boot.ladderComputed,false);assert.equal(boot.moCurveDone,0);
 console.log('PASS current boot: no page errors, clean new project');
 console.log('GPU status:',boot.gpu || 'available');
 const lazy=await g.ev(`const ids=['helium','h2','ladder','molecule'];ids.forEach(id=>__LW.layout.reopen(id,'R'));
  const immediate={loading:Object.fromEntries(ids.map(id=>[id,document.querySelector('.dev[data-id="'+id+'"]').classList.contains('loading')])),busy:__LW.busy.count,
    centered:ids.every(id=>!!document.querySelector('.dev[data-id="'+id+'"] .dev-loading .mark'))};
  await Promise.all([__LW.helium.prepare(),__LW.h2.prepare(),__LW.ladder.prepare(),__LW.mo.whenReady()]);
  const done={helium:__LW.helium.computed,h2:__LW.h2.curveReady,ladder:__LW.ladder.computed,mo:__LW.mo.state().curveDone,
    loading:ids.some(id=>document.querySelector('.dev[data-id="'+id+'"]').classList.contains('loading')),errors:__e};
  ids.forEach(id=>document.querySelector('.dev[data-id="'+id+'"]').classList.add('closed'));return {immediate,done}`);
 assert.deepEqual(lazy.immediate.loading,{helium:true,h2:true,ladder:true,molecule:true});assert.ok(lazy.immediate.busy>0);assert.equal(lazy.immediate.centered,true);
 assert.deepEqual(lazy.done,{helium:true,h2:true,ladder:true,mo:40,loading:false,errors:[]});
 console.log('PASS multi-add queues every heavy card with local and cursor loading states');
 const persistence = await g.ev(`const p=__LW.layout.projects,n=__LW.layout.notebook;
  p.save('acceptance/new');const clean=!p.dirty;n.subtitle='edited subtitle';const dirty=p.dirty;
  p.save('acceptance/new');const original=Storage.prototype.setItem;let removed;
  Storage.prototype.setItem=function(){throw new Error('quota test')};
  try{removed=p.remove('acceptance/new')}finally{Storage.prototype.setItem=original}
  return {clean,dirty,removed,current:p.current,exists:p.list().some(x=>x.path==='acceptance/new')}`);
 assert.deepEqual(persistence,{clean:true,dirty:true,removed:false,current:'acceptance/new',exists:true});
 console.log('PASS new projects: subtitle dirty tracking and failed deletion preserves current project');
 const opened=await g.ev(`const p=__LW.layout.projects,n=__LW.layout.notebook;n.text='saved notebook';p.save('acceptance/new');n.text='temporary edit';const ok=p.open('acceptance/new');return {ok,text:n.text,subtitle:n.subtitle,dirty:p.dirty}`);
 assert.deepEqual(opened,{ok:true,text:'saved notebook',subtitle:'edited subtitle',dirty:false});
 console.log('PASS new project save/open round trip restores notes and subtitle');
 const malformed = await g.ev(`const key='lambdawaves.q0.projects',old=localStorage.getItem(key);try{
  localStorage.setItem(key,'{"items":null}');const list=__LW.layout.projects.list();
  const saved=__LW.layout.projects.save('must-not-overwrite');
  return {list,saved,stored:localStorage.getItem(key)};
 }finally{localStorage.setItem(key,old)}`);
 assert.deepEqual(malformed,{list:[],saved:false,stored:'{"items":null}'});
 const math = await g.ev(`const n=__LW.layout.notebook,k=window.katex;try{
  window.katex=undefined;const html=n.render('$<img src=x onerror="alert(1)">$');
  const t=document.createElement('template');t.innerHTML=html;
  return {images:t.content.querySelectorAll('img').length,text:t.content.textContent};
 }finally{window.katex=k}`);
 assert.equal(math.images,0); assert.match(math.text,/<img/);
 console.log('PASS malformed storage and unavailable math renderer fail safely');
 const notebook = await g.ev(String.raw`const {renderNotebook}=await import('./notebook-render.js');
  const inspect=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content};
  const attack='<a title="$x$" href="java&#9;script:alert(1)" onclick=bad()>link</a><img src=x onerror=bad()><svg onload=bad()></svg><script>bad()</script><input type=checkbox>';
  const safe=inspect(renderNotebook(attack));
  const formula=inspect(renderNotebook('Before $x^2$ and $$y^2$$ after'));
  const attr=inspect(renderNotebook('<span class="$x$">text</span>',{katex:{renderToString(){return '<b>math</b>'}}}));
  const fallback=inspect(renderNotebook('$<img src=x onerror=bad()>$',{katex:null}));
  const injected=inspect(renderNotebook("<span title='$\" onmouseover=\"bad()$'>text</span>",{katex:null}));
  const missing=inspect(renderNotebook('<script>bad()</script>',{marked:null}));
  return {unsafe:safe.querySelectorAll('script,svg,[onclick],[onerror],[onload],a[href]').length,
    title:safe.querySelector('a').title,disabled:safe.querySelector('input').disabled,
    inline:formula.querySelectorAll('.katex').length,display:formula.querySelectorAll('.katex-display').length,
    text:formula.textContent.includes('Before')&&formula.textContent.includes('after'),
    attribute:attr.querySelector('span').getAttribute('class'),attributeElements:attr.querySelectorAll('b').length,
    injectedHandlers:injected.querySelectorAll('[onmouseover]').length,
    fallbackImages:fallback.querySelectorAll('img').length,missingText:missing.textContent};`);
 assert.deepEqual(notebook,{unsafe:0,title:'$x$',disabled:true,inline:2,display:1,text:true,
  attribute:'$x$',attributeElements:0,injectedHandlers:0,fallbackImages:0,missingText:'<script>bad()</script>'});
 console.log('PASS notebook renderer: sanitized markup, inline/display math, literal attributes and safe parser fallback');
 await g.ev(`__LW.layout.modulation.expand();await new Promise(r=>setTimeout(r,150));document.querySelector('.m2numseat').focus();return true`);
 await g.press('\uE012');
 const depth=await g.ev(`return document.querySelector('.m2numseat').getAttribute('aria-valuenow')`);
 assert.equal(Number(depth),99);
 await g.ev(`document.querySelector('.m2railhead').click();document.querySelector('.m2numseat').focus();return true`);
 await g.press('\uE014');
 const macro=await g.ev(`const value=document.querySelector('.m2numseat').getAttribute('aria-valuenow');__LW.layout.modulation.collapse();__LW.layout.modulation.expand();return {value,reopened:document.querySelector('.m2numseat').getAttribute('aria-valuenow'),errors:__e}`);
 // Since a5c0863 folding the rail does not repurpose the seat: it still edits depth (99 → 100), and the
 // value survives a collapse/expand. The macro VALUE is the rail's own control, not this seat's.
 assert.equal(Number(macro.value),100); assert.equal(macro.reopened,macro.value);assert.deepEqual(macro.errors,[]);
 console.log('PASS macro keyboard: the seat edits depth folded or not, and close/reopen keeps it; no page errors');
} catch(error) { failed=true;console.error(error); }
finally {
 // The Snap driver has previously hung during quit; a cleanup failure is reported
 // separately and remains nonzero, never silently converted to a green result.
 try { await Promise.race([g.close(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('driver cleanup exceeded 10 seconds')),10000))]); }
 catch(error) { failed=true;console.error('INFRASTRUCTURE:',error.message); }
 process.exit(failed?1:0);
}
