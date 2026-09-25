/* refute-b.mjs — LANE B cross-refutation measurements (headless Firefox, µs timers).
 *   LW_PORT=8721 GD_PORT=5232 node research/optimization-2026-09-24/probes/B/refute-b.mjs
 * 1 FA7: field.frame JS per call with FRAME box / dots / lattice while the FREE camera auto-rotates (UI shown and hidden)
 * 2 FC Q3: CALCULUS — the whole update (stats + full table rebuild) vs stats alone
 * 3 FE11b: the modulation window's grip — place() per pointermove, forced layouts inside
 * 4 FB3 vs FC4: closed-window modView paints per second while playing (UI hidden) */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const g = await open('https://127.0.0.1:8721/lab/?preset=1s%2B2pz&sw=0', { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const ev = (s) => g.ev(s); const R = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.pause(); await __LW.settle(); return 1;`);
  /* 1 · FA7 */
  R.lines = await ev(`const L=__LW, f=L.field, o=f.frame; let calls=0, ms=0, cw0=0; f.frame=function(...a){ const t0=performance.now(); try { return o.apply(this,a); } finally { calls++; ms+=performance.now()-t0; } };
    const run=async(mode, hidden)=>{ if (hidden !== L.uiHidden) L.keys.toggleUI(); L.mat.frameMode=mode; if (!hidden) L.setFrame(true); L.camera.setAutoRotate(true); await L.settle(); await new Promise(r=>setTimeout(r,300));
      calls=0; ms=0; const c0=f.stats.chromeWrites; await new Promise(r=>setTimeout(r,2000)); const out={ mode, hidden, frames:calls, frameMsPerCall:+(ms/Math.max(1,calls)).toFixed(3), chromeWritesPerFrame:+((f.stats.chromeWrites-c0)/Math.max(1,calls)).toFixed(2) }; L.camera.setAutoRotate(false); await L.settle(); return out; };
    const out=[]; for (const m of ['box','dots','lattice']) out.push(await run(m,false)); out.push(await run('lattice',true)); if (L.uiHidden) L.keys.toggleUI(); L.mat.frameMode='box'; L.setFrame(true); f.frame=o; L.camera.stop(); await L.settle(); return out;`);
  console.log('lines', JSON.stringify(R.lines));
  /* 2 · CALCULUS */
  R.calculus = await ev(`const L=__LW; L.loadPreset('sim-ladder'); L.layout.reopen('calculus','R'); L.windowActivity.presentOffscreen(true); L.pause(); await L.settle();
    const { stats } = await import('/lab/calculus.js'); const T=(f,n)=>{ for(let i=0;i<3;i++) f(i); const t0=performance.now(); for(let i=0;i<n;i++) f(i); return +((performance.now()-t0)/n).toFixed(4); };
    const out={ updateMs: T((i)=>L.calculus.update(L.reg, 10+i*0.01), 100), statsOnlyMs: T((i)=>stats(L.reg, 20+i*0.01), 100), rows: document.querySelectorAll('.calc-row').length };
    let recs=0; const mo=new MutationObserver((l)=>{ recs+=l.length; }); mo.observe(document.querySelector('.calc-table'), { childList:true, subtree:true, characterData:true });
    L.calculus.update(L.reg, 33.3); await new Promise(r=>setTimeout(r,0)); out.mutationRecordsPerUpdate = recs; mo.disconnect();
    document.querySelector('.dev[data-id="calculus"]').classList.add('closed'); L.windowActivity.presentOffscreen(false); return out;`);
  console.log('calculus', JSON.stringify(R.calculus));
  /* 3 · FE11b: the grip */
  R.grip = await ev(`const L=__LW; L.mod.expand(); await L.settle(); await new Promise(r=>setTimeout(r,300));
    const grip=document.querySelector('#modwin .crail-grip') || document.querySelector('.crail-grip'); if (!grip) return { error:'no grip' };
    const b=grip.getBoundingClientRect(); let x=b.left+b.width/2, y=b.top+b.height/2;
    let gb=0; const og=Element.prototype.getBoundingClientRect; Element.prototype.getBoundingClientRect=function(...a){ gb++; return og.apply(this,a); };
    grip.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:x,clientY:y,pointerId:7,pointerType:'mouse',buttons:1}));
    const t0=performance.now(); const N=60; for(let i=0;i<N;i++){ x+=(i%2?3:-3); y+=1; grip.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x,clientY:y,pointerId:7,pointerType:'mouse',buttons:1})); document.body.offsetWidth; }
    const per=(performance.now()-t0)/N; grip.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:x,clientY:y,pointerId:7,pointerType:'mouse'}));
    Element.prototype.getBoundingClientRect=og; L.mod.collapse(); await L.settle();
    return { msPerMove:+per.toFixed(3), gbcrPerMove:+(gb/N).toFixed(1), note:'each move = place() + one forced body.offsetWidth read standing in for the frame\\'s layout' };`);
  console.log('grip', JSON.stringify(R.grip));
  /* 4 · FB3 vs FC4: closed-window paints while playing with the UI hidden */
  R.hiddenSync = await ev(`const L=__LW; L.loadPreset('1s+2pz'); if(!L.uiHidden) L.keys.toggleUI(); L.pause(); await L.settle(); const p0=L.mod.view.performance();
    L.play(); await new Promise(r=>setTimeout(r,6000)); const p1=L.mod.view.performance(); L.pause(); if (L.uiHidden) L.keys.toggleUI(); await L.settle();
    return { secs:6, closedWindowForcedPaints:p1.paints-p0.paints, playEdges:1 };`);
  console.log('hiddenSync', JSON.stringify(R.hiddenSync));
  R.errors = await g.errors();
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { fs.writeFileSync('research/optimization-2026-09-24/probes/B/refute-b.json', JSON.stringify(R, null, 1)); await g.close(); }
