/* hitches.mjs — LANE B: the periodic and event hitch sources, measured in headless Firefox (µs timers).
 *   LW_PORT=8721 GD_PORT=5232 node research/optimization-2026-09-24/probes/B/hitches.mjs
 * 1 the transport↔modulation LINK retry (default rack: an LFO + an ENV, no route) while playing
 * 2 the reader law's re-probe of a parked reader (WIGNER open, governor ON)
 * 3 the 250 ms "thread was blocked" flash at a GPU-bound cadence (128³ axial gas)
 * 4 the modulation pump's own cost: applyAll / the registry walk, with and without a route
 * 5 a driven rotation (SPIN z): every frame is a new reg.version */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const g = await open('https://127.0.0.1:8721/lab/?preset=1s%2B2pz&sw=0', { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const ev = (s) => g.ev(s); const R = {};
const FRAMES = `window.__rows=[]; if(!window.__hooked){ window.__hooked=1; const o=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=function(cb){ return o((ts)=>{ if(cb.name!=='loop'){cb(ts);return;} const t0=performance.now(); cb(ts); window.__rows.push({t:+t0.toFixed(1), ms:+(performance.now()-t0).toFixed(2), busy:__LW.busy.visible}); }); };
  const oST=window.setTimeout; window.__timers=0; window.setTimeout=function(...a){ window.__timers++; return oST.apply(window,a); }; } return 1;`;
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await ev(FRAMES);
  /* 1 · the link retry: play 5 s with the modulation window closed and count forced window paints */
  R.link = await ev(`__LW.pause(); await __LW.settle(); const p0=__LW.mod.view.performance(); window.__rows=[]; __LW.play(); await new Promise(r=>setTimeout(r,5000));
    const p1=__LW.mod.view.performance(); const rows=window.__rows; __LW.pause(); await __LW.settle();
    return { secs:5, modPlaying:__LW.mod.playing, modRunning:__LW.mod.running, sources:__LW.mod.model.sourceList().length, routes:(__LW.mod.model.routeList?__LW.mod.model.routeList().length:null),
      forcedPaints:p1.paints-p0.paints, paintCalls:p1.calls-p0.calls, paintMsTotal:+(p1.ms-p0.ms).toFixed(2), msPerPaint:+((p1.ms-p0.ms)/Math.max(1,p1.paints-p0.paints)).toFixed(3), frames:rows.length };`);
  console.log('link', JSON.stringify(R.link));
  /* 2 · the re-probe: WIGNER open and visible, governor ON, play 10 s, list the long frames */
  R.probe = await ev(`__LW.governor.on=true; __LW.loadPreset('sim-ladder'); __LW.layout.reopen('wigner','R'); __LW.windowActivity.presentOffscreen(true); __LW.pause(); await __LW.settle();
    window.__rows=[]; __LW.play(); await new Promise(r=>setTimeout(r,10000)); const rows=window.__rows; __LW.pause(); await __LW.settle();
    const long=rows.filter(r=>r.ms>15); const t0=rows.length?rows[0].t:0;
    return { frames:rows.length, parked:__LW.governor.parked, probes:__LW.governor.probes, work:__LW.governor.work.wigner, long:long.map(r=>({at:+((r.t-t0)/1000).toFixed(2), ms:r.ms})) };`);
  console.log('probe', JSON.stringify(R.probe));
  await ev(`document.querySelector('.dev[data-id="wigner"]').classList.add('closed'); __LW.windowActivity.presentOffscreen(false); __LW.governor.on=false; return 1;`);
  /* 3 · the frame-gap flash at a GPU-bound cadence */
  R.flash = await ev(`__LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); __LW.quality.auto=false; __LW.quality.res=128; __LW.quality.steps=240; __LW.schedule(4); await __LW.settle();
    await new Promise(r=>setTimeout(r,400)); window.__rows=[]; window.__timers=0; __LW.play(); await new Promise(r=>setTimeout(r,4000)); const rows=window.__rows, timers=window.__timers; __LW.pause(); await __LW.settle();
    const gaps=rows.slice(1).map((r,i)=>+(r.t-rows[i].t).toFixed(1));
    return { frames:rows.length, gapsOver250:gaps.filter(x=>x>250).length, gapMedian:gaps.slice().sort((a,b)=>a-b)[gaps.length>>1], framesWithBusyMark:rows.filter(r=>r.busy).length, timers };`);
  console.log('flash', JSON.stringify(R.flash));
  await ev(`__LW.setHamiltonian('hydrogen'); __LW.setGasBasis('reg'); __LW.loadPreset('1s+2pz'); __LW.quality.res=96; __LW.quality.steps=160; __LW.schedule(4); __LW.pause(); await __LW.settle(); return 1;`);
  /* 4 · the modulation pump: the registry walk and applyAll, timed directly on the host's own objects */
  R.pump = await ev(`const M=__LW.mod, Rg=M.registry, C=M.clock; const ids=Rg.list();
    const T=(f,n)=>{ for(let i=0;i<5;i++) f(); const t0=performance.now(); for(let i=0;i<n;i++) f(); return +((performance.now()-t0)/n*1000).toFixed(2); };
    const walk=()=>{ let n=0; for (const id of Rg.list()) { if (Rg.isModulated(id)) continue; const v=Number(Rg.read(id)); if (!Number.isFinite(v) || Object.is(Rg.snap(id,v), Rg.baseOf(id))) continue; n++; } return n; };
    const out={ ids:ids.length, syncBasesWalkUs:T(walk,2000), applyAllNoRouteUs:T(()=>C.applyAll(false),2000) };
    const src=M.model.sourceList()[0]; const mac=M.model.macroList()[0]; if (src && mac) { M.bind(mac.id, src.id); M.route(mac.id,'material.exposure',0.2,0.8); }
    out.applyAllOneRouteUs=T(()=>C.applyAll(false),2000); out.stateObjUs=T(()=>Rg.state('material.exposure'),5000);
    M.reset(); return out;`);
  console.log('pump', JSON.stringify(R.pump));
  /* 5 · a driven rotation: SPIN z = 1 rad/s, default windows, 3 s */
  R.spin = await ev(`__LW.pause(); await __LW.settle(); const v0=__LW.reg.version; let rebuilds=0; const sr=__LW.spectrum.rebuild; __LW.spectrum.rebuild=function(...a){ rebuilds++; return sr.apply(this,a); };
    window.__rows=[]; __LW.setRotRate('z',1); __LW.play(); await new Promise(r=>setTimeout(r,3000)); const rows=window.__rows; __LW.pause(); __LW.setRotRate('z',0); await __LW.settle(); __LW.spectrum.rebuild=sr;
    const ms=rows.map(r=>r.ms).sort((a,b)=>a-b);
    return { frames:rows.length, versions:__LW.reg.version-v0, spectrumRebuilds:rebuilds, loopMsMedian:ms[ms.length>>1], p90:ms[Math.floor(ms.length*0.9)] };`);
  console.log('spin', JSON.stringify(R.spin));
  R.spinBase = await ev(`window.__rows=[]; __LW.play(); await new Promise(r=>setTimeout(r,3000)); const rows=window.__rows; __LW.pause(); await __LW.settle(); const ms=rows.map(r=>r.ms).sort((a,b)=>a-b); return { frames:rows.length, loopMsMedian:ms[ms.length>>1], p90:ms[Math.floor(ms.length*0.9)] };`);
  console.log('spinBase', JSON.stringify(R.spinBase));
  R.errors = await g.errors();
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { fs.writeFileSync('research/optimization-2026-09-24/probes/B/hitches.json', JSON.stringify(R, null, 1)); await g.close(); }
