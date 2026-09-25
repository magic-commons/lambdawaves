/* bench-firefox-headed.mjs — the same loop scenes as bench-firefox, in a HEADED Firefox on the session display: Gecko's real
 * compositor (WebRender on the GPU, backdrop-filter rendered).  A Firefox window opens on the desktop for ~1 min.
 *   DISPLAY=:0 LW_PORT=8721 GD_PORT=5222 node tools/perf/bench-firefox-headed.mjs [out.json] */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/baseline-firefox-headed.json';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const t0 = Date.now();
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: W, height: H, script: 600000, headless: false, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = { at: new Date().toISOString(), viewport: [W, H], host: 'firefox-headed', boot: null, scenes: [], gpu: [] };
const ev = (s) => g.ev(s);
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.boot = await ev(`return {readyMs:+performance.now().toFixed(0), adapter:__LW.field.adapterInfo, ok:__LW.field.ok, errs:window.__e, dpr:devicePixelRatio, w:innerWidth, h:innerHeight, card:document.body.dataset.card, frost:__LW.frost, theme:__LW.theme};`);
  console.log('boot', JSON.stringify(R.boot));
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.quality.res=96; __LW.quality.steps=160; __LW.quality.scale=1; __LW.schedule(4); await __LW.settle(); return 1;`);
  const scene = async (label, setup) => {
    const r = await ev(`${setup || ''}; await __LW.settle(); await new Promise(r=>setTimeout(r,400)); __LW.perf.resetRing(); __LW.play();
      let n=0; const f0=__LW.stats.frames, t0=performance.now(); await new Promise(r=>{const f=()=>{n++; if(performance.now()-t0<3000) requestAnimationFrame(f); else r();}; requestAnimationFrame(f);});
      const dt=(performance.now()-t0)/1000; __LW.pause();
      return {rafFps:+(n/dt).toFixed(1), appFps:+((__LW.stats.frames-f0)/dt).toFixed(1), loopMedianMs:+__LW.perf.median.toFixed(3), fieldMs:+__LW.perf.profile.field.toFixed(3),
        card:document.body.dataset.card, frost:__LW.frostLive, blur:getComputedStyle(document.documentElement).getPropertyValue('--glass-blur').trim(), disc:__LW.disconnected, uiHidden:__LW.uiHidden, frame:__LW.mat.frameMode, frameOn:__LW.mat.frame, open:document.querySelectorAll('.dev:not(.closed)').length, res:__LW.field.resolution};`);
    r.label = label; R.scenes.push(r); console.log('scene', label, JSON.stringify(r)); return r;
  };
  await scene('default · refractive · frost ALWAYS · blur 22 · light · 96³', '');
  await scene('UI hidden (H)', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('UI shown again', `if(__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('frost OFF · refractive', `__LW.setFrost('off')`);
  await scene('frost ALWAYS · tinted', `__LW.setFrost('always'); __LW.setCardStyle('tinted')`);
  await scene('frost OFF · tinted', `__LW.setFrost('off')`);
  await scene('refractive · frost ALWAYS · disconnected', `__LW.setCardStyle('refractive'); __LW.setFrost('always'); __LW.setDisconnected(true)`);
  await scene('connected · dark theme', `__LW.setDisconnected(false); __LW.setTheme('dark')`);
  await scene('light · FRAME lattice', `__LW.setTheme('light'); __LW.mat.frameMode='lattice'; __LW.setFrame(true)`);
  await scene('FRAME off', `__LW.setFrame(false)`);
  await scene('FRAME box · modulation window open', `__LW.mat.frameMode='box'; __LW.setFrame(true); __LW.mod.expand()`);
  await scene('modulation closed · all windows open', `__LW.mod.collapse(); for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.windowActivity.presentOffscreen(true)`);
  await scene('all windows open · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('128³ · sim-ladder · default windows · UI shown', `if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.windowActivity.presentOffscreen(false); for(const d of document.querySelectorAll('.dev')) if(!['spectrum','shadow','settings','state','palette','observer','camera','clip'].includes(d.dataset.id)) d.classList.add('closed'); __LW.quality.res=128; __LW.quality.steps=240; __LW.schedule(4)`);
  await scene('128³ · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('128³ · axial gas · UI shown', `if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause()`);
  for (const [label, n] of [['gpu 128³ axial gas', 12]]) { const r = await ev(`const r=await __LW.gpuFrameMs(${n}); return r;`); r.label = label; R.gpu.push(r); console.log('gpu', label, JSON.stringify(r)); }
  R.errs = await ev('return window.__e');
} catch (e) { console.error('BENCH ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
R.wallSec = +((Date.now() - t0) / 1000).toFixed(1);
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT, 'in', R.wallSec, 's');
