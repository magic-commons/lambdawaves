// Focused acceptance for the current native app, independent of historical layouts.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { width:1500,height:1100,script:20000 });
let failed = false;
try {
 assert.equal((await g.waitFor('window.__LW&&__LW.ready',150,100)).ok,1);
 const boot = await g.ev(`return {errors:__e,dirty:__LW.layout.projects.dirty,gpu:__LW.field.error||null}`);
 assert.deepEqual(boot.errors,[]); assert.equal(boot.dirty,false);
 console.log('PASS current boot: no page errors, clean new project');
 console.log('GPU status:',boot.gpu || 'available');
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
 await g.ev(`__LW.layout.modulation.expand();await new Promise(r=>setTimeout(r,150));document.querySelector('.m2numseat').focus();return true`);
 await g.press('\uE012');
 const depth=await g.ev(`return document.querySelector('.m2numseat').getAttribute('aria-valuenow')`);
 assert.equal(Number(depth),99);
 await g.ev(`document.querySelector('.m2railhead').click();document.querySelector('.m2numseat').focus();return true`);
 await g.press('\uE014');
 const macro=await g.ev(`const value=document.querySelector('.m2numseat').getAttribute('aria-valuenow');__LW.layout.modulation.collapse();__LW.layout.modulation.expand();return {value,reopened:document.querySelector('.m2numseat').getAttribute('aria-valuenow'),errors:__e}`);
 assert.equal(Number(macro.value),1); assert.equal(macro.reopened,macro.value);assert.deepEqual(macro.errors,[]);
 console.log('PASS macro keyboard depth/value and close/reopen; no page errors');
} catch(error) { failed=true;console.error(error); }
finally {
 // The Snap driver has previously hung during quit; a cleanup failure is reported
 // separately and remains nonzero, never silently converted to a green result.
 try { await Promise.race([g.close(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('driver cleanup exceeded 10 seconds')),10000))]); }
 catch(error) { failed=true;console.error('INFRASTRUCTURE:',error.message); }
 process.exit(failed?1:0);
}
