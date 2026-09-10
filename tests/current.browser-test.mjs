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
 const longNotebook=await g.ev(`const p=__LW.layout.projects,n=__LW.layout.notebook;
  const text=Array.from({length:30},(_,i)=>'## Section '+(i+1)+'\\n\\nParagraph '+(i+1)).join('\\n\\n');
  n.text=text;p.save('acceptance/long-notebook');n.text='temporary';p.open('acceptance/long-notebook');
  const view=document.querySelector('#notebook .nb-view');return {last:n.html.includes('Section 30'),more:!!view.querySelector('.nb-more'),scrolls:view.scrollHeight>view.clientHeight};`);
 assert.deepEqual(longNotebook,{last:true,more:false,scrolls:true});
 console.log('PASS project landing renders the complete Markdown notebook and scrolls instead of clipping it');
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
 const audioFace=await g.ev(`const M=__LW.mod.model,w=n=>new Promise(r=>setTimeout(r,n));M.deserialize(null);__LW.mod.addSource('audio');await w(250);
  const card=document.querySelector('.m2dev.audio'),rows=[...card.querySelectorAll('.aud-range-row')];
  const outside=rows.every(e=>{const v=e.querySelector('.aud-range-value').getBoundingClientRect(),t=e.querySelector('.aud-range-track').getBoundingClientRect();return v.bottom<=t.top+.5});
  const bands=['low','mid','high'].map(k=>card.querySelector('[data-band="'+k+'"]').getBoundingClientRect().x);
  const compact=[...document.querySelectorAll('.kwin-chiprail button')].find(e=>e.getAttribute('aria-label')==='COMPACT');compact.click();await w(180);
  const card2=document.querySelector('.m2dev.audio'),tops=[...card2.querySelectorAll('.m2knobs .m2k')].map(e=>Math.round(e.getBoundingClientRect().top));
  const result={outside,ordered:bands[0]<bands[1]&&bands[1]<bands[2],allBands:[...card2.querySelectorAll('.aud-range-row')].every(e=>getComputedStyle(e).display!=='none'),
    oneKnobRow:new Set(tops).size===1,setVisible:[...card2.querySelectorAll('.m2audsrc')].some(e=>e.textContent.trim()==='SET'&&getComputedStyle(e).display!=='none'),
    latency:card2.querySelector('.aud-latency').textContent,errors:__e.slice()};M.deserialize(null);return result;`);
 assert.deepEqual(audioFace,{outside:true,ordered:true,allBands:true,oneKnobRow:true,setVisible:true,latency:'LATENCY —',errors:[]});
 console.log('PASS Audio face: values clear the bars, LOW/MID/HIGH read left to right, and compact keeps all ranges, SET and four controls');
 /* THE DAW LAW (2026-09-10): everything a demo shows rides in the project — theme, stage colour, camera feel and
    auto-rotate, overlays, SPECTRUM's DIALS fold, the A/B transition, the notebook's size, the modulation window's
    placement, the arrangement, the routes with their ranges — and comes back from it. */
 const daw=await g.ev(`const M=__LW.mod.model,w=n=>new Promise(r=>setTimeout(r,n));const theme0=document.body.dataset.theme;
  __LW.loadPreset('1s+2pz');M.addSource('lfo');__LW.layout.modulation.expand();await w(400);M.addRoute(M.macroList()[0].id,'material.exposure',0.5,4);
  __LW.layout.reopen('settings','R');__LW.layout.reopen('state','R');await w(200);
  __LW.camera.setAutoRotate(true);__LW.camera.setFriction(0.31);__LW.kepler.setOn(true);__LW.vortex.setOn(true);__LW.spectrum.setDials(true);__LW.layout.notebookResize(520,380);
  const tr=[...document.querySelectorAll('.dev[data-id=state] .trig')],by=t=>tr.find(b=>b.textContent.trim()===t);by('STORE A').click();__LW.loadPreset('2p+');await w(150);by('STORE B').click();
  const sc=document.querySelectorAll('.stage-colour')[1];sc.value='#203040';sc.dispatchEvent(new Event('input',{bubbles:true}));
  const S=__LW.serialize();S.presentation.ui.theme=theme0==='light'?'dark':'light';
  __LW.camera.setAutoRotate(false);__LW.camera.setFriction(0.1);__LW.kepler.setOn(false);__LW.vortex.setOn(false);__LW.spectrum.setDials(false);__LW.layout.notebookResize(300,200);document.querySelector('.stage-follow').click();__LW.loadPreset('1s');M.deserialize(null);
  const ok=__LW.restore(S);await w(600);const q=__LW.serialize().presentation;const errs=__e.slice();
  return {ok,theme:document.body.dataset.theme,want:S.presentation.ui.theme,stage:q.ui.stage.b,auto:q.camera.autoRotate,friction:q.camera.friction,kepler:q.overlays.kepler,vortex:q.overlays.vortex.on,dials:q.overlays.dials,ab:!!(q.ab&&q.ab.a&&q.ab.b),nb:q.notebook,routes:(q.modulation.routes||[]).map(r=>[r.min,r.max]),modwin:!!q.modwin,cards:q.layout&&q.layout.cards.length,errs}`);
 assert.equal(daw.ok,true); assert.equal(daw.theme,daw.want); assert.deepEqual(daw.stage.map(v=>Math.round(v*255)),[32,48,64]); assert.equal(daw.auto,true); assert.equal(daw.friction,0.31);
 assert.equal(daw.kepler,true); assert.equal(daw.vortex,true); assert.equal(daw.dials,true); assert.equal(daw.ab,true); assert.deepEqual(daw.nb,{w:520,h:380}); assert.deepEqual(daw.routes,[[0.5,1]]); assert.equal(daw.modwin,true); assert.ok(daw.cards>20); assert.deepEqual(daw.errs,[]);
 console.log('PASS the DAW law: theme, stage colour, camera, overlays, dials, A/B, notebook size, modulation placement, arrangement and routes round-trip through the project');
 /* THE HAND ON A ROUTED KNOB (Josh, 2026-09-10): a click leaves the base and the range alone; a drag moves the BASE by
    the drag — never to where the modulator happened to be showing the needle. */
 const hand=await g.ev(`const M=__LW.mod.model,R=__LW.mod.registry,w=n=>new Promise(r=>setTimeout(r,n));M.deserialize(null);__LW.loadPreset('1s+2pz');
  M.addSource('lfo');__LW.layout.modulation.expand();await w(300);const m=M.macroList()[0];M.addRoute(m.id,'material.exposure',0.5,4);M.setMacro(m.id,{value:0.8});__LW.mod.clock.applyAll(true);await w(300);
  const k=[...document.querySelectorAll('.k')].find(e=>e.querySelector('.k-lbl')?.textContent==='EXPOSURE'),d=k.querySelector('.k-dial'),b=d.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
  const base=()=>+R.baseOf('material.exposure').toFixed(3);const shown0=+__LW.mat.exposure.toFixed(3),base0=base();
  d.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:cx,clientY:cy,pointerId:71,isPrimary:true}));d.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,clientX:cx,clientY:cy,pointerId:71,isPrimary:true}));await w(200);
  const click={base:base(),shown:+__LW.mat.exposure.toFixed(3)};
  d.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:cx,clientY:cy,pointerId:72,isPrimary:true}));for(let i=1;i<=3;i++)d.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:cx,clientY:cy+10*i,pointerId:72,isPrimary:true}));d.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,clientX:cx,clientY:cy+30,pointerId:72,isPrimary:true}));await w(300);
  return {shown0,base0,click,drag:{base:base(),shown:+__LW.mat.exposure.toFixed(3)},errs:__e.slice()}`);
 assert.ok(hand.shown0>hand.base0*2, 'the modulator shows well above the base: '+JSON.stringify(hand)); assert.equal(hand.click.base,hand.base0); assert.equal(hand.click.shown,hand.shown0);
 assert.ok(hand.drag.base<hand.base0&&hand.drag.base>hand.base0*0.4,'a 30 px drag moved the base by the drag, not to the shown value: '+JSON.stringify(hand.drag)); assert.deepEqual(hand.errs,[]);
 console.log('PASS the hand on a routed knob: a click leaves base and range; a drag moves the base by the drag, not to the modulated needle');
} catch(error) { failed=true;console.error(error); }
finally {
 // The Snap driver has previously hung during quit; a cleanup failure is reported
 // separately and remains nonzero, never silently converted to a green result.
 try { await Promise.race([g.close(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('driver cleanup exceeded 10 seconds')),10000))]); }
 catch(error) { failed=true;console.error('INFRASTRUCTURE:',error.message); }
 process.exit(failed?1:0);
}
