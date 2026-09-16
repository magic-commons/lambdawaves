// Stage input and notebook geometry in the real app. Synthetic pointer events
// exercise cancellation and multiple owners that WebDriver cannot cancel on cue.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { actions, relActions } from '../tools/gate/drv.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { width: 1280, height: 900, script: 20000 });
let failed = false;
async function check(name, script, verify) {
  const value = await g.ev(script);
  try { verify(value); console.log('PASS ' + name); }
  catch (error) { failed = true; console.error('FAIL ' + name, value, error.message); }
}
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 150, 100)).ok, 1);
  await g.ev(`window.pointer=(type,id,x,y,extra={})=>document.getElementById('field').dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y,...extra}));return true`);
  await check('an impulse belongs to the pointer that started it', `
    pointer('pointerdown',1,120,120,{ctrlKey:true});
    pointer('pointermove',2,180,120);const foreignMoved=__LW.bow.k;
    pointer('pointerup',2,180,120);const stillActive=__LW.bow.active;
    __LW.bow.cancel();await __LW.bow.landed;pointer('pointercancel',1,120,120);
    return {foreignMoved,stillActive};`, value => assert.deepEqual(value, { foreignMoved: 0, stillActive: true }));
  await check('canceling an impulse never applies it to the state', `
    const before=__LW.reg.version;
    pointer('pointerdown',3,120,120,{ctrlKey:true});pointer('pointermove',3,180,120);
    pointer('pointercancel',3,180,120);const inFlight=__LW.bow.inFlight;
    await __LW.bow.landed;
    return {inFlight,changed:__LW.reg.version!==before,active:__LW.bow.active};`, value => assert.deepEqual(value, { inFlight: false, changed: false, active: false }));
  await check('losing pointer capture releases the camera gesture', `
    const cv=document.getElementById('field');pointer('pointerdown',4,120,120);pointer('lostpointercapture',4,120,120);
    const held=cv.classList.contains('drag');pointer('pointercancel',4,120,120);return {held};`, value => assert.deepEqual(value, { held: false }));
  await check('secondary mouse buttons do not rotate the stage', `
    __LW.camera.stop();const yaw=__LW.obs.yaw;
    pointer('pointerdown',5,120,120,{pointerType:'mouse',button:2});pointer('pointermove',5,180,120,{pointerType:'mouse',button:2});
    const moved=__LW.obs.yaw!==yaw;pointer('pointercancel',5,180,120);__LW.camera.stop();return {moved};`, value => assert.deepEqual(value, { moved: false }));
  await check('losing capture closes the undo gesture without waiting for another click', `
    __LW.setDamping(0);__LW.history.clear();pointer('pointerdown',7,120,120);
    __LW.setDamping(0.01);pointer('lostpointercapture',7,120,120);
    await new Promise(r=>setTimeout(r,500));const cursor=__LW.history.cursor;
    pointer('pointercancel',7,120,120);return {cursor};`, value => assert.deepEqual(value, { cursor: 1 }));
  await check('unrelated releases cannot close another finger\'s undo gesture', `
    __LW.history.clear();pointer('pointerdown',11,120,120);pointer('pointerdown',12,220,120);
    __LW.setDamping(0.02);pointer('pointerup',99,10,10);pointer('pointerup',11,120,120);pointer('lostpointercapture',11,120,120);
    await new Promise(r=>setTimeout(r,500));const heldCursor=__LW.history.cursor;
    pointer('pointerup',12,220,120);await new Promise(r=>setTimeout(r,50));
    return {heldCursor,releasedCursor:__LW.history.cursor};`, value => assert.deepEqual(value, { heldCursor: 0, releasedCursor: 1 }));
  await check('wheel zoom converts line and page units to pixels', `
    const cv=document.getElementById('field'),zoom=(deltaY,deltaMode)=>{__LW.camera.setDist(3);cv.dispatchEvent(new WheelEvent('wheel',{deltaY,deltaMode,cancelable:true}));return __LW.obs.dist};
    return {pixel:zoom(48,0),line:zoom(3,1),page:zoom(1,2),pagePixels:zoom(cv.clientHeight,0)};`, value => {
    assert.ok(Math.abs(value.pixel - value.line) < 1e-12);
    assert.ok(Math.abs(value.page - value.pagePixels) < 1e-12);
  });
  await check('notebook resize commits its final frame before saving', `
    __LW.layout.notebook.open();__LW.layout.notebookResize(500,350);
    const nb=document.getElementById('notebook'),grip=nb.querySelector('.nb-grip');
    const send=(type,x,y)=>grip.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:6,pointerType:'touch',button:0,clientX:x,clientY:y}));
    send('pointerdown',500,350);send('pointermove',580,410);send('pointerup',580,410);
    await new Promise(r=>requestAnimationFrame(r));
    const saved=__LW.settings;return {width:nb.offsetWidth,height:nb.offsetHeight,savedWidth:saved.nbW,savedHeight:saved.nbH};`, value => {
    assert.equal(value.width, 580); assert.equal(value.height, 410);
    assert.equal(value.savedWidth, value.width); assert.equal(value.savedHeight, value.height);
  });
  // Real browser input also exercises implicit capture and its release events.
  for (const pointerType of ['mouse', 'touch']) {
    const before = await g.ev(`__LW.layout.notebook.close();__LW.layout.modulation.collapse();__LW.camera.setFling(0);__LW.camera.stop();
      return {yaw:__LW.obs.yaw,target:document.elementFromPoint(400,300)?.id};`);
    assert.equal(before.target, 'field');
    await actions(g.s, [{ type: 'pointer', id: 'stage-' + pointerType, parameters: { pointerType }, actions: [
      { type: 'pointerMove', origin: 'viewport', x: 400, y: 300, duration: 0 },
      { type: 'pointerDown', button: 0 },
      { type: 'pointerMove', origin: 'viewport', x: 440, y: 300, duration: 120 },
      { type: 'pointerUp', button: 0 },
    ] }]);
    await relActions(g.s);
    const after = await g.ev(`return {yaw:__LW.obs.yaw,held:document.getElementById('field').classList.contains('drag')}`);
    assert.ok(Math.abs(after.yaw - before.yaw) > .1); assert.equal(after.held, false);
    console.log('PASS real ' + pointerType + ' drag rotates and releases the stage');
  }
  // Headless Firefox floors the window width at 500 CSS px. Exercise the phone
  // breakpoint in portrait and landscape, then verify the return to desktop.
  for (const [width, height, phone] of [[500, 930, true], [844, 476, true], [1280, 900, false]]) {
    const response = await fetch(`http://127.0.0.1:${process.env.GD_PORT || 4444}/session/${g.s}/window/rect`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ width, height }),
    });
    assert.equal(response.ok, true);
    assert.equal((await g.waitFor(`__LW.layout.phone.on===${phone}`, 40, 50)).ok, 1);
    const layout = await g.ev(`__LW.layout.notebook.open();
      const nb=document.getElementById('notebook').getBoundingClientRect();
      return {phone:__LW.layout.phone.on,viewport:[innerWidth,innerHeight],notebook:[nb.width,nb.height],overflow:document.documentElement.scrollWidth>innerWidth};`);
    assert.equal(layout.overflow, false);
    if (phone) assert.deepEqual(layout.notebook, layout.viewport);
    await g.ev('__LW.layout.notebook.close();return true');
    console.log('PASS responsive input layout ' + layout.viewport.join('×') + (phone ? ' phone' : ' desktop'));
  }
  assert.deepEqual(await g.ev('return __e'), []);
} finally { await g.close(); }
process.exitCode = failed ? 1 : 0;
