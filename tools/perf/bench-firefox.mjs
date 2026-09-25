/* bench-firefox.mjs — the GPU and main-thread baseline in the real headless Firefox the gate uses (RTX 3070 here).
 *   LW_PORT=8721 GD_PORT=5221 node tools/perf/bench-firefox.mjs [out.json]
 * Reads the app only through __LW.  Every number is measured inside the page; nothing is asserted. */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/baseline-firefox.json';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const t0 = Date.now();
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: W, height: H, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });   // µs-resolution performance.now(): the loop medians are sub-millisecond
const R = { at: new Date().toISOString(), viewport: [W, H], boot: null, gpu: [], loop: [], projects: null, notes: [] };
const ev = (s) => g.ev(s);
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.boot = await ev(`const nav=performance.getEntriesByType('navigation')[0]||{};const res=performance.getEntriesByType('resource');
    const js=res.filter(r=>/\\.js(\\?|$)/.test(r.name)),css=res.filter(r=>/\\.css(\\?|$)/.test(r.name)),fonts=res.filter(r=>/\\.woff2/.test(r.name));
    const sum=(a,k)=>a.reduce((s,r)=>s+(r[k]||0),0);
    return {readyMs:+performance.now().toFixed(0), domInteractive:+(nav.domInteractive||0).toFixed(0), domContentLoaded:+(nav.domContentLoadedEventEnd||0).toFixed(0), loadEvent:+(nav.loadEventEnd||0).toFixed(0),
      resources:res.length, js:js.length, jsBytes:sum(js,'encodedBodySize'), css:css.length, cssBytes:sum(css,'encodedBodySize'), fonts:fonts.length, fontBytes:sum(fonts,'encodedBodySize'), allBytes:sum(res,'encodedBodySize'),
      lastResourceEnd:+Math.max(0,...res.map(r=>r.responseEnd)).toFixed(0), adapter:__LW.field.adapterInfo, fieldOk:__LW.field.ok, errs:window.__e, frames:__LW.stats.frames, res:__LW.field.resolution, devs:document.querySelectorAll('.dev').length, open:document.querySelectorAll('.dev:not(.closed)').length};`);
  console.log('boot', JSON.stringify(R.boot));
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; return 1;`);   // the bench measures the user's settings, not the governor's
  const setGrid = (res) => ev(`__LW.quality.res=${res}; __LW.quality.steps={64:110,96:160,128:240}[${res}]; __LW.quality.scale={64:0.75,96:1,128:1}[${res}]; __LW.schedule(4); await __LW.settle(); return {res:__LW.field.resolution, steps:__LW.mat.steps, scale:__LW.quality.scale};`);
  const gpu = async (label, n = 400) => { const r = await ev(`const r=await __LW.gpuFrameMs(${n}); r.half=__LW.domain.half; r.style=__LW.mat.style; r.view=__LW.mat.view; return r;`); r.label = label; R.gpu.push(r); console.log('gpu', label, JSON.stringify(r)); return r; };
  /* ── the eigenmode kernel: presets × grids ── */
  for (const preset of ['1s+2pz', 'rydberg', 'sim-ladder']) {
    await ev(`__LW.loadPreset('${preset}'); __LW.pause(); await __LW.settle(); return 1;`);
    for (const res of [64, 96, 128]) { await setGrid(res); await gpu(`${preset} · ${res}³`); }
  }
  /* ── all 91 hydrogen labels populated (the widest eigenmode state) ── */
  await ev(`__LW.loadPreset('1s'); for(let a=0;a<91;a++) __LW.reg.set(a,1,0,0); __LW.reg.normalize(); __LW.schedule(4); await __LW.settle(); return __LW.reg.populated().length;`);
  for (const res of [64, 96, 128]) { await setGrid(res); await gpu(`91 modes · ${res}³`); }
  /* ── present-only cost by style and view at 96³ on the 91-mode state ── */
  await setGrid(96);
  for (const style of ['cloud', 'solid', 'grain', 'signed', 'dust', 'glass', 'additive', 'bands']) { await ev(`__LW.setStyle('${style}'); await __LW.settle(); return 1;`); await gpu(`91 modes · 96³ · style ${style}`, 200); }
  await ev(`__LW.setStyle('cloud'); return 1;`);
  for (const view of ['density', 'phase', 'real', 'diff']) { await ev(`__LW.setView('${view}'); await __LW.settle(); return 1;`); await gpu(`91 modes · 96³ · view ${view}`, 200); }
  await ev(`__LW.setView('phase'); return 1;`);
  /* ── the BOX: the 91-label packet, then the AXIAL GAS (256 modes, j_l by recurrence) ── */
  await ev(`__LW.loadPreset('1s'); __LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.enterBox(); __LW.pause(); await __LW.settle(); return __LW.reg.populated().length;`);
  for (const res of [64, 96, 128]) { await setGrid(res); await gpu(`BOX packet (91 labels) · ${res}³`, 150); }
  const gasN = await ev(`__LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); await __LW.settle(); return __LW.gas.fieldModes(__LW.clock.t).length;`);
  R.notes.push('axial gas modes rendered: ' + gasN);
  for (const res of [64, 96, 128]) { await setGrid(res); await gpu(`BOX axial gas (${gasN} modes) · ${res}³`, res === 128 ? 12 : 30); }
  /* ── the main-thread loop while playing: 3 s windows, UI shown / hidden ── */
  const loop = async (label, setup) => {
    const r = await ev(`${setup || ''}; __LW.perf.resetRing(); __LW.play(); const f0=__LW.stats.frames, r0=__LW.stats.reconstructs, t0=performance.now();
      await new Promise(r=>setTimeout(r,3000)); const dt=(performance.now()-t0)/1000; __LW.pause();
      return {fps:+((__LW.stats.frames-f0)/dt).toFixed(1), reconPerSec:+((__LW.stats.reconstructs-r0)/dt).toFixed(1), loopMedianMs:+__LW.perf.median.toFixed(3), profile:Object.fromEntries(Object.entries(__LW.perf.profile).map(([k,v])=>[k,+v.toFixed(3)])), encodeMs:+__LW.stats.lastEncodeMs.toFixed(3), res:__LW.field.resolution, uiHidden:__LW.uiHidden, parked:__LW.governor.parked};`);
    r.label = label; R.loop.push(r); console.log('loop', label, JSON.stringify(r)); return r;
  };
  await ev(`__LW.setHamiltonian('hydrogen'); __LW.setGasBasis('reg'); __LW.loadPreset('sim-ladder'); __LW.pause(); return 1;`); await setGrid(96);
  await loop('sim-ladder · 96³ · UI shown (default windows)');
  await loop('sim-ladder · 96³ · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await loop('sim-ladder · 96³ · UI shown again', `if(__LW.uiHidden) __LW.keys.toggleUI()`);
  await loop('sim-ladder · 96³ · METERS + DYNAMICS + VORTEX + ORBIT + SLICE open', `for(const id of ['meters','dynamics','vortex','orbit','slice']) __LW.layout.reopen(id,'R'); __LW.windowActivity.presentOffscreen(true)`);
  await loop('sim-ladder · 96³ · particles on (160) + vortex locate', `__LW.seedParticles(160); __LW.vortex.setOn(true); __LW.vortex.setOverlay(true)`);
  await ev(`__LW.particles.setOn(false); __LW.vortex.setOn(false); __LW.vortex.setOverlay(false); __LW.windowActivity.presentOffscreen(false); for(const id of ['meters','dynamics','vortex','orbit','slice']) document.querySelector('.dev[data-id="'+id+'"]').classList.add('closed'); return 1;`);
  await ev(`__LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); return 1;`); await setGrid(128);
  await loop('BOX axial gas · 128³ · UI shown');
  await loop('BOX axial gas · 128³ · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await ev(`if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.setHamiltonian('hydrogen'); __LW.setGasBasis('reg'); __LW.loadPreset('1s+2pz'); __LW.pause(); return 1;`); await setGrid(64);
  /* ── projects: serialize, save, open, the dirty check ── */
  R.projects = await ev(`const p=__LW.layout.projects; const T=(f,n=1)=>{const t=performance.now(); for(let i=0;i<n;i++) f(); return +((performance.now()-t)/n).toFixed(3)};
    const serializeMs=T(()=>__LW.serialize(),20), bytes=JSON.stringify(__LW.serialize()).length;
    const saveMs=T(()=>p.save('bench/one')), dirtyMs=T(()=>p.dirty,20), openMs=T(()=>p.open('bench/one')), restoreMs=T(()=>__LW.restore(__LW.serialize()));
    p.remove('bench/one'); return {serializeMs, bytes, saveMs, dirtyMs, openMs, restoreMs, lsBytes:JSON.stringify(localStorage).length};`);
  console.log('projects', JSON.stringify(R.projects));
  R.errs = await ev('return window.__e');
} catch (e) { console.error('BENCH ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
R.wallSec = +((Date.now() - t0) / 1000).toFixed(1);
fs.mkdirSync('research/optimization-2026-09-24', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT, 'in', R.wallSec, 's');
