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
    const col=p.querySelector('.km-col-left').getBoundingClientRect(),header=p.querySelector('.km-col-header').getBoundingClientRect(),rows=p.querySelectorAll('.km-kb-row');
    const first=rows[0].getBoundingClientRect(),last=rows[rows.length-1].getBoundingClientRect();
    const editor=p.querySelector('.km-col-right').getBoundingClientRect(),buttons=[...p.querySelectorAll('.km-editor-actions .km-btn')].map(e=>e.getBoundingClientRect());
    const borders=['.km-panel','.km-col','.km-platform-switch','.km-key-bound','.km-key-unbound','.km-search','.km-action-row','.km-chip','.km-btn','.km-close']
      .map(sel=>getComputedStyle(p.querySelector(sel)??p).borderWidth);
    return {width:b.width,height:b.height,x:b.x,y:b.y,hostPointer:getComputedStyle(host).pointerEvents,pointer:getComputedStyle(p).pointerEvents,
      topGap:first.top-header.bottom,bottomGap:col.bottom-last.bottom,borders,
      legendAndSwitch:p.querySelector('.km-legend').parentElement===p.querySelector('.km-platform-switch').parentElement,
      platformIcons:[p.querySelector('.km-os-mac').textContent,p.querySelectorAll('.km-os-windows > span').length],
      buttonCenter:Math.abs((buttons[0].left+buttons[1].right)/2-(editor.left+editor.right)/2),
      buttonSubtitles:p.querySelectorAll('.km-editor-actions .km-btn-sub').length,
      rows:p.querySelectorAll('.km-kb-row').length,groups:p.querySelectorAll('.km-action-group').length,
      q:p.querySelector('.km-key[data-code="KeyQ"] .km-badge').textContent,card:document.body.dataset.card,mask,
      tabLabel:p.querySelector('.km-action-row[data-id="povIn"] .km-chips').textContent,
      removed:p.querySelectorAll('.km-eyebrow,.km-header-hint,.km-col-title,.km-count,.km-footer,.km-hint').length,
      editor:p.querySelector('.km-editor-actions')?.parentElement.classList.contains('km-col-right'),
      controls:p.querySelectorAll('.km-editor-actions .km-btn').length,statusHidden:p.querySelector('.km-status').hidden,
      errors:__e.slice()};`);
  assert.ok(geometry.width < 1440 && geometry.width > 900 && geometry.height <= 416);
  assert.ok(geometry.topGap >= 0 && geometry.topGap < 20 && geometry.bottomGap >= 0 && geometry.bottomGap < 20);
  assert.deepEqual(geometry.borders, Array(10).fill('0px'));
  assert.equal(geometry.legendAndSwitch, true);
  assert.deepEqual(geometry.platformIcons, ['⌘', 4]);
  assert.ok(geometry.buttonCenter < 2); assert.equal(geometry.buttonSubtitles, 0);
  assert.ok(geometry.x >= 8 && geometry.y >= 8);
  assert.equal(geometry.hostPointer, 'none'); assert.equal(geometry.pointer, 'auto');
  assert.equal(geometry.rows, 5); assert.ok(geometry.groups >= 4);
  assert.equal(geometry.removed, 0); assert.equal(geometry.editor, true);
  assert.equal(geometry.controls, 2); assert.equal(geometry.statusHidden, true);
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
  const editor = await g.ev(`__LW.keymap.open();const p=document.querySelector('.km-panel');
    p.querySelector('.km-action-row[data-id="povIn"]').click();
    p.querySelector('.km-btn-record').click();
    const listening=!p.querySelector('.km-status').hidden;
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyL',ctrlKey:true,shiftKey:true,bubbles:true,cancelable:true}));
    const changed=__LW.keys.actions.find(a=>a.id==='povIn');
    const rebound=[changed.key,changed.ctrl,changed.shift];
    p.querySelector('.km-btn-reset').click();
    const restored=__LW.keys.actions.find(a=>a.id==='povIn');
    return {listening,rebound,restored:[restored.key,restored.ctrl,restored.shift],errors:__e.slice()};`);
  assert.equal(editor.listening, true);
  assert.deepEqual(editor.rebound, ['KeyL',true,true]);
  assert.deepEqual(editor.restored, ['KeyQ',false,true]);
  assert.deepEqual(editor.errors, []);
  const dark = await g.ev(`__LW.setTheme('dark');const p=document.querySelector('.km-panel');
    const bg=getComputedStyle(p).backgroundColor;
    return {theme:document.body.dataset.theme,alpha:Number(bg.match(/,\\s*([0-9.]+)\\)$/)?.[1]),errors:__e.slice()};`);
  assert.equal(dark.theme, 'dark'); assert.ok(dark.alpha >= .9);
  assert.deepEqual(dark.errors, []);
  console.log('PASS keyboard window: floating MIR geometry, drag, layered chords, POV/dolly zoom, eased WASD, collision-safe rebinding');
} finally { await g.close(); }
