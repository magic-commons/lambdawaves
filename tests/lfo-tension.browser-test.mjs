// A fresh LFO is an editable SINE; real mouse double-click resets the visible
// tension handle on both source kinds without adding or moving points.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { actions, relActions } from '../tools/gate/drv.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, {
  width: 1280, height: 900, script: 20000,
});
const clickTwice = async ({ x, y }) => {
  await actions(g.s, [{ type: 'pointer', id: 'curve-double', parameters: { pointerType: 'mouse' }, actions: [
    { type: 'pointerMove', origin: 'viewport', x: Math.round(x), y: Math.round(y), duration: 0 },
    { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 },
    { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 },
  ] }]);
  await relActions(g.s);
};
const handle = id => g.ev(`const V=__LW.mod.view,c=V.curve(${JSON.stringify(id)}),i=c.hseg[0];
  const a=c.points[i],b=c.points[i+1],t=(a.t+b.t)/2;
  const at=V.at(${JSON.stringify(id)},t,V.evalAt(c.points,t));
  const svg=document.querySelector('.m2dev[data-id=${JSON.stringify(id)}] .m2svg');
  window.__dbls=window.__dbls||{};
  svg.addEventListener('dblclick',()=>{__dbls[${JSON.stringify(id)}]=(__dbls[${JSON.stringify(id)}]||0)+1},{once:true});
  return {x:at.x,y:at.y,index:i,count:c.points.length,hash:c.hash};`);

try {
  assert.equal((await g.waitFor('window.__LW?.ready', 150, 100)).ok, 1);
  const initial = await g.ev(`
    __LW.pause();__LW.mod.stop();__LW.mod.reset();
    if(!__LW.mod.expanded)__LW.mod.expand();
    const M=__LW.mod.model,V=__LW.mod.view;
    const lfo=__LW.mod.addSource('lfo'),env=__LW.mod.addSource('env');
    V.sync();
    const {pointsEqual,presetPoints}=await import('./mir/modulation/curve.js');
    const s=M.sourceOf(lfo);
    const exactSine=pointsEqual(s.points,presetPoints('sine'));
    const sineSelected=V.shapes(lfo).find(q=>q.name==='sine').on;
    const label=document.querySelector('.m2dev[data-id="'+lfo+'"] .m2lfowave').textContent;
    M.curveEdit(lfo,'tension',{index:0,tension:.7});
    M.setSource(env,{ta:.6,td:-.3});V.sync();
    return {lfo,env,mode:s.shapeMode,wave:s.wave,exactSine,sineSelected,label,
      errors:__e.slice()};`);
  assert.equal(initial.mode, 'curve'); assert.equal(initial.wave, 'sine');
  assert.equal(initial.exactSine, true); assert.equal(initial.sineSelected, true);
  assert.equal(initial.label, 'SINE'); assert.deepEqual(initial.errors, []);
  console.log('PASS a new LFO opens on the editable SINE preset with SINE selected and labelled');

  const lfoHandle = await handle(initial.lfo);
  await clickTwice(lfoHandle);
  const lfo = await g.ev(`const M=__LW.mod.model,V=__LW.mod.view,s=M.sourceOf(${JSON.stringify(initial.lfo)});
    return {tension:s.points[${lfoHandle.index}].tension,count:s.points.length,
      hash:V.curve(${JSON.stringify(initial.lfo)}).hash,doubles:__dbls[${JSON.stringify(initial.lfo)}]||0};`);
  assert.equal(lfo.doubles, 1); assert.equal(lfo.tension, 0);
  assert.equal(lfo.count, lfoHandle.count); assert.notEqual(lfo.hash, lfoHandle.hash);
  console.log('PASS real double-click resets an LFO tension handle while paused');

  const envHandle = await handle(initial.env);
  await clickTwice(envHandle);
  const env = await g.ev(`const M=__LW.mod.model,V=__LW.mod.view,s=M.sourceOf(${JSON.stringify(initial.env)});
    return {ta:s.ta,td:s.td,count:V.curve(${JSON.stringify(initial.env)}).points.length,
      hash:V.curve(${JSON.stringify(initial.env)}).hash,doubles:__dbls[${JSON.stringify(initial.env)}]||0};`);
  assert.equal(env.doubles, 1); assert.equal(env.ta, 0); assert.equal(env.td, -.3);
  assert.equal(env.count, envHandle.count); assert.notEqual(env.hash, envHandle.hash);
  console.log('PASS real double-click resets only the ENV segment under its handle');
} finally { await g.close(); }
