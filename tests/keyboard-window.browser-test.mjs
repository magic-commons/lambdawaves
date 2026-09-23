import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { actions, relActions } from '../tools/gate/drv.mjs';

const url = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const g = await open(url, { width: 1440, height: 900, script: 30000 });
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 200, 100)).ok, 1);
  const binding = await g.ev(`const a=__LW.keys.actions;
    const overlap=(x,y)=>x.key&&x.key===y.key&&!!x.ctrl===!!y.ctrl&&!!x.alt===!!y.alt&&(x.shift===undefined||y.shift===undefined||!!x.shift===!!y.shift);
    return {n:a.length,collisions:a.flatMap((x,i)=>a.slice(i+1).filter(y=>overlap(x,y)).map(y=>[x.id,y.id])),
      camera:Object.fromEntries(['dollyIn','povIn','dollyZoomIn','dollyOut','povOut','dollyZoomOut'].map(id=>{const x=a.find(a=>a.id===id);return [id,[x.key,!!x.ctrl,!!x.shift]]})),errors:__e.slice()};`);
  assert.deepEqual(binding.collisions, []);
  assert.deepEqual(binding.camera, { dollyIn:['KeyQ',false,false],povIn:['KeyQ',false,true],dollyZoomIn:['KeyQ',true,true],
    dollyOut:['KeyE',false,false],povOut:['KeyE',false,true],dollyZoomOut:['KeyE',true,true] });
  assert.deepEqual(binding.errors, []);

  const geometry = await g.ev(`const field=__LW.field,original=field.setOcclusion;window.__frameMasks=[];
    field.setOcclusion=function(rects){window.__frameMasks=rects.map(r=>r.slice());return original.call(field,rects)};
    __LW.keymap.open();await __LW.settle();const host=document.querySelector('#keymap'),p=host.querySelector('.km-panel'),b=p.getBoundingClientRect();
    const canvas=document.querySelector('#field').getBoundingClientRect(), mask=__frameMasks.some(r=>r[0]<=b.left-canvas.left+20&&r[1]<=b.top-canvas.top+20&&r[2]>=b.right-canvas.left-20&&r[3]>=b.bottom-canvas.top-20);
    return {width:b.width,height:b.height,x:b.x,y:b.y,hostPointer:getComputedStyle(host).pointerEvents,pointer:getComputedStyle(p).pointerEvents,
      rows:p.querySelectorAll('.km-kb-row').length,groups:p.querySelectorAll('.km-action-group').length,
      q:p.querySelector('.km-key[data-code="KeyQ"] .km-badge').textContent,card:document.body.dataset.card,mask,
      tabLabel:p.querySelector('.km-action-row[data-id="povIn"] .km-chips').textContent,errors:__e.slice()};`);
  assert.ok(geometry.width < 1440 && geometry.width > 900 && geometry.height < 900);
  assert.ok(geometry.x >= 8 && geometry.y >= 8);
  assert.equal(geometry.hostPointer, 'none'); assert.equal(geometry.pointer, 'auto');
  assert.equal(geometry.rows, 5); assert.ok(geometry.groups >= 4);
  assert.equal(geometry.mask, true);
  assert.match(geometry.q, /⇧/); assert.match(geometry.tabLabel, /⇧/);
  assert.equal(geometry.card, 'refractive'); assert.deepEqual(geometry.errors, []);

  const before = await g.ev(`const b=document.querySelector('.km-header').getBoundingClientRect();return {x:b.x+90,y:b.y+b.height/2,left:document.querySelector('.km-panel').getBoundingClientRect().left};`);
  await actions(g.s, [{ type:'pointer', id:'dragKeyboard', parameters:{pointerType:'mouse'}, actions:[
    {type:'pointerMove',origin:'viewport',x:Math.round(before.x),y:Math.round(before.y)},
    {type:'pointerDown',button:0},{type:'pointerMove',origin:'viewport',x:Math.round(before.x+70),y:Math.round(before.y+50),duration:250},
    {type:'pointerUp',button:0}]}]);
  await relActions(g.s);
  const dragged = await g.ev(`await __LW.settle();const p=document.querySelector('.km-panel'),b=p.getBoundingClientRect(),c=document.querySelector('#field').getBoundingClientRect();
    const mask=__frameMasks.some(r=>r[0]<=b.left-c.left+20&&r[1]<=b.top-c.top+20&&r[2]>=b.right-c.left-20&&r[3]>=b.bottom-c.top-20);
    return {x:b.left,y:b.top,saved:JSON.parse(localStorage.getItem('lw.keyboard.position.v1')),mask};`);
  assert.ok(dragged.x >= before.left + 60 && dragged.saved.x === dragged.x);
  assert.equal(dragged.mask, true);

  const camera = await g.ev(`const L=__LW,K=(code,mods={})=>window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true,cancelable:true,...mods}));
    const panel=document.querySelector('.km-panel').getBoundingClientRect(),canvas=document.querySelector('#field').getBoundingClientRect();
    L.keymap.close();await L.settle();const keyboardMask=__frameMasks.some(r=>Math.abs(r[0]-(panel.left-canvas.left))<1&&Math.abs(r[1]-(panel.top-canvas.top))<1);
    L.camera.reset();let d0=L.obs.dist,f0=L.obs.fov;
    K('KeyQ',{shiftKey:true});const pov={dist:L.obs.dist,fov:L.obs.fov};
    K('KeyE',{shiftKey:true});
    K('KeyQ',{ctrlKey:true,shiftKey:true});const zoom={dist:L.obs.dist,fov:L.obs.fov,product:L.obs.dist*Math.tan(L.obs.fov/2)};
    L.camera.reset();const yaw0=L.obs.yaw;K('KeyA');const instant=L.obs.yaw;
    await new Promise(r=>setTimeout(r,450));const eased=L.obs.yaw;L.camera.reset();
    return {d0,f0,pov,zoom,product0:d0*Math.tan(f0/2),yaw0,instant,eased,keyboardMask,errors:__e.slice()};`);
  assert.equal(camera.keyboardMask, false);
  assert.equal(camera.pov.dist, camera.d0); assert.ok(camera.pov.fov < camera.f0);
  assert.ok(camera.zoom.dist < camera.d0 && camera.zoom.fov > camera.f0);
  assert.ok(Math.abs(camera.zoom.product - camera.product0) < 1e-9);
  assert.equal(camera.instant, camera.yaw0); assert.ok(camera.eased < camera.yaw0 - .1);
  assert.deepEqual(camera.errors, []);

  const collisions = await g.ev(`const k=__LW.keys,before=k.actions.find(a=>a.id==='camReset').key;
    const taken=k.bind('camReset',{key:'KeyQ',shift:true}),tab=k.bind('camReset',{key:'Tab'}),esc=k.bind('camReset',{key:'Escape'});
    const free=k.bind('camReset',{key:'KeyL',shift:false});const saved=JSON.parse(localStorage.getItem('lambdawaves.q0.keys'));
    k.reset();return {taken,tab,esc,free,saved:saved.camReset,before,restored:k.actions.find(a=>a.id==='camReset').key};`);
  assert.deepEqual(collisions.taken.conflicts, ['povIn']);
  assert.equal(collisions.tab.ok, false); assert.equal(collisions.esc.ok, false);
  assert.equal(collisions.free.ok, true); assert.equal(collisions.saved.key, 'KeyL');
  assert.equal(collisions.restored, collisions.before);
  console.log('PASS keyboard window: floating MIR geometry, drag, layered chords, POV/dolly zoom, eased WASD, collision-safe rebinding');
} finally { await g.close(); }
