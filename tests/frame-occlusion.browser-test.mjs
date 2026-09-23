// Frame/axis ink must be hidden by painted cards, never by their transparent layout boxes.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { actions, relActions } from '../tools/gate/drv.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?warn=0`,
  { width: 1920, height: 1080 });
const inspect = () => g.ev(`
  const b = e => { const r=e.getBoundingClientRect(); return [r.left,r.top,r.right,r.bottom]; };
  const hit = p => window.__frameMasks.some(r => r[0] <= p[0] && p[0] < r[2] && r[1] <= p[1] && p[1] < r[3]);
  const mid = r => [(r[0]+r[2])/2,(r[1]+r[3])/2];
  const root=b(document.querySelector('#modwin'));
  const rail=b(document.querySelector('#modwin .m2rail'));
  const lfo=b(document.querySelector('#modwin .m2dev.lfo'));
  const env=b(document.querySelector('#modwin .m2dev.env'));
  const bars=[...document.querySelectorAll('#modwin .m2workbar')].map(b);
  const chips=[...document.querySelectorAll('.kwin-chiprail .crail-chip')]
    .filter(e=>e.getBoundingClientRect().width>0).map(b);
  return {root, count:__frameMasks.length,
    fullRoot:__frameMasks.some(r=>r.every((n,i)=>Math.abs(n-root[i])<1)),
    rail:hit(mid(rail)),lfo:hit(mid(lfo)),env:hit(mid(env)),bars:bars.map(r=>hit(mid(r))),
    chips:chips.map(r=>hit(mid(r))),
    gap:hit([(lfo[2]+env[0])/2,lfo[1]+30]),
    below:hit([(root[0]+root[2])/2,root[3]-16]),
    chipGap:hit([mid(chips[0])[0],(chips[0][3]+chips[1][1])/2]),
    errors:__e.slice()};`);
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 300, 100)).ok, 1);
  await g.ev(`
    const field=__LW.field, original=field.setOcclusion;
    window.__frameMasks=[];
    field.setOcclusion=function(rects){ window.__frameMasks=rects.map(r=>r.slice()); return original.call(field,rects); };
    __LW.mat.frame=true;__LW.mat.frameMode='lattice';__LW.setStyle('cloud');
    __LW.layout.modulation.expand();await __LW.settle();
    await new Promise(r=>setTimeout(r,300));return true;`);
  let s = await inspect();
  assert.ok(s.count > 0);
  assert.equal(s.fullRoot, false);
  assert.equal(s.rail, true); assert.equal(s.lfo, true); assert.equal(s.env, true);
  assert.deepEqual(s.bars, [true, true]); assert.ok(s.chips.length >= 3 && s.chips.every(Boolean));
  assert.equal(s.gap, false); assert.equal(s.below, false); assert.equal(s.chipGap, false);
  assert.ok(s.count <= 32); assert.deepEqual(s.errors, []);
  console.log('PASS lattice clears only modulation cards, work bars and chips, not their empty gaps');
  for (const mode of ['box', 'dots']) {
    await g.ev(`__LW.mat.frameMode=${JSON.stringify(mode)};__LW.setStyle('cloud');
      await new Promise(r=>setTimeout(r,100));return true;`);
    s = await inspect();
    assert.equal(s.gap, false); assert.equal(s.below, false);
    assert.equal(s.lfo, true); assert.equal(s.env, true);
  }
  console.log('PASS box and dots use the same surface-accurate mask');

  const grip = await g.ev(`const r=document.querySelector('.kwin-chiprail .crail-grip').getBoundingClientRect();
    return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};`);
  await actions(g.s, [{ type:'pointer', id:'mod-drag', parameters:{pointerType:'mouse'}, actions:[
    {type:'pointerMove',origin:'viewport',x:grip.x,y:grip.y,duration:0},
    {type:'pointerDown',button:0},
    {type:'pointerMove',origin:'viewport',x:grip.x+110,y:grip.y+80,duration:150},
    {type:'pointerUp',button:0}
  ] }]);
  await relActions(g.s);
  await g.ev('await __LW.settle();return true;');
  const moved = await inspect();
  assert.ok(moved.root[0] > s.root[0] + 80 && moved.root[1] > s.root[1] + 50);
  assert.equal(moved.fullRoot, false); assert.equal(moved.gap, false); assert.equal(moved.below, false);
  assert.equal(moved.rail, true); assert.equal(moved.lfo, true); assert.equal(moved.env, true);
  console.log('PASS real drag moves the masks with the visible surfaces, even while paused');

  const scrolled = await g.ev(`
    for(let i=0;i<4;i++) __LW.mod.addSource('lfo');
    await new Promise(r=>setTimeout(r,300));
    const run=document.querySelector('#modwin .m2run'),before=JSON.stringify(__frameMasks);
    const overflow=run.scrollWidth-run.clientWidth;
    run.scrollLeft=overflow;
    await new Promise(r=>setTimeout(r,250));
    const b=run.getBoundingClientRect();
    const overshoot=__frameMasks.filter(r=>Math.abs(r[1]-b.top)<1&&r[3]<=b.bottom+1&&r[0]>=b.left-1&&r[0]<b.right)
      .map(r=>r[2]-b.right).filter(n=>n>1);
    return {overflow,scrolled:run.scrollLeft,updated:before!==JSON.stringify(__frameMasks),overshoot};`);
  assert.ok(scrolled.overflow > 0 && scrolled.scrolled > 0);
  assert.equal(scrolled.updated, true); assert.deepEqual(scrolled.overshoot, []);
  console.log('PASS scrolled-away modulation cards do not cut the stage outside their viewport');

  await g.ev(`__LW.layout.modulation.collapse();__LW.layout.popOut('shadow',{x:700,y:160,w:280});
    await __LW.settle();return true;`);
  const detached = await g.ev(`
    const card=document.querySelector('.dev[data-id="shadow"]'),h=card.querySelector('.dev-head'),v=card.querySelector('.dev-body');
    const r=e=>{const b=e.getBoundingClientRect();return [b.left,b.top,b.right,b.bottom]};
    const root=r(card),head=r(h),body=r(v),hit=p=>__frameMasks.some(q=>q[0]<=p[0]&&p[0]<q[2]&&q[1]<=p[1]&&p[1]<q[3]);
    return {disconnected:__LW.disconnected,root,head,body,
      fullRoot:__frameMasks.some(q=>q.every((n,i)=>Math.abs(n-root[i])<1)),
      headMasked:hit([(head[0]+head[2])/2,(head[1]+head[3])/2]),
      bodyMasked:hit([(body[0]+body[2])/2,(body[1]+body[3])/2]),
      gapMasked:hit([(root[0]+root[2])/2,(head[3]+body[1])/2])};`);
  assert.equal(detached.disconnected, true);
  assert.equal(detached.fullRoot, false);
  assert.equal(detached.headMasked, true); assert.equal(detached.bodyMasked, true);
  assert.equal(detached.gapMasked, false);
  console.log('PASS detached rack window keeps frame ink in the gap between its head and body');

  const headGrip = await g.ev(`const b=document.querySelector('.dev[data-id="shadow"] .dev-head').getBoundingClientRect();
    return {x:Math.round(b.left+35),y:Math.round(b.top+b.height/2),frames:__LW.stats.frames};`);
  await actions(g.s, [{ type:'pointer', id:'rack-drag', parameters:{pointerType:'mouse'}, actions:[
    {type:'pointerMove',origin:'viewport',x:headGrip.x,y:headGrip.y,duration:0},
    {type:'pointerDown',button:0},
    {type:'pointerMove',origin:'viewport',x:headGrip.x+90,y:headGrip.y+40,duration:150},
    {type:'pointerUp',button:0}
  ] }]);
  await relActions(g.s);
  const draggedRack = await g.ev(`await new Promise(r=>setTimeout(r,150));
    const e=document.querySelector('.dev[data-id="shadow"]'),h=e.querySelector('.dev-head').getBoundingClientRect();
    const m=[(h.left+h.right)/2,(h.top+h.bottom)/2];
    return {x:e.getBoundingClientRect().left,y:e.getBoundingClientRect().top,frames:__LW.stats.frames,
      headMasked:__frameMasks.some(q=>q[0]<=m[0]&&m[0]<q[2]&&q[1]<=m[1]&&m[1]<q[3])};`);
  assert.ok(draggedRack.x > detached.root[0]+70 && draggedRack.y > detached.root[1]+25);
  assert.ok(draggedRack.frames > headGrip.frames); assert.equal(draggedRack.headMasked, true);
  console.log('PASS detached rack drag refreshes frame ink while paused');

  await g.ev(`__LW.setDisconnected(false);await __LW.settle();
    await new Promise(r=>setTimeout(r,100));return true;`);
  const joined = await g.ev(`const e=document.querySelector('.dev[data-id="shadow"]'),b=e.getBoundingClientRect();
    const r=[b.left,b.top,b.right,b.bottom];return {joined:!__LW.disconnected,
      whole:__frameMasks.some(q=>q.every((n,i)=>Math.abs(n-r[i])<1))};`);
  assert.equal(joined.joined, true); assert.equal(joined.whole, true);
  console.log('PASS joined rack window still masks its single pane');
} finally { await g.close(); }
