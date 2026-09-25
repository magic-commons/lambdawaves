/* ff-headed-gpu.mjs — Lane C, the SENSITIVE form of the A/B: a GPU-BOUND scene (style GLASS, 128³, 240 steps, 1920×995) in
 * HEADED Firefox, where the frame is limited by GPU time rather than the 120 Hz cap, so every millisecond the compositor
 * spends on a backdrop layer shows up as fps.  Interleaved A/B/A/B; ms/frame = 1000/fps, so ΔGPU ≈ 1000/fpsA − 1000/fpsB.
 * Each diagnostic REMOVES something (a look change) only to price it; the neutral candidates carry a screenshot pair
 * (A/A is taken first to show the noise floor of the screenshot itself).
 *   DISPLAY=:0 LW_PORT=8721 GD_PORT=5233 node research/optimization-2026-09-24/probes/C/ff-headed-gpu.mjs [out.json] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/probes/C/ff-headed-gpu.json';
const SECS = +(process.env.SECS || 3), REPS = +(process.env.REPS || 3);
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0`, { width: 1920, height: 1080, script: 900000, headless: false, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = { at: new Date().toISOString(), host: 'firefox-headed', secs: SECS, reps: REPS, exps: [] };
const ev = (s) => g.ev(s);
const setCss = (css) => ev(`let s=document.getElementById('labC'); if(!s){s=document.createElement('style'); s.id='labC'; document.head.appendChild(s);} s.textContent=${JSON.stringify(css || '')}; await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); return 1;`);
const fps = () => ev(`await __LW.settle(); await new Promise(r=>setTimeout(r,300)); __LW.play();
  let n=0; const t0=performance.now(); await new Promise(r=>{const f=()=>{n++; if(performance.now()-t0<${SECS * 1000}) requestAnimationFrame(f); else r();}; requestAnimationFrame(f);});
  const dt=(performance.now()-t0)/1000; __LW.pause(); return +(n/dt).toFixed(2);`);
const shot = async () => { await ev(`__LW.pause(); __LW.schedule(4); await __LW.settle(); await new Promise(r=>setTimeout(r,1600)); return 1;`); return crypto.createHash('sha1').update(await g.snap()).digest('hex').slice(0, 12); };
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
async function exp(name, { setupA = '', setupB = '', cssA = '', cssB = '', neutral = false } = {}) {
  const A = [], B = [];
  for (let i = 0; i < REPS; i++) {
    await setCss(cssA); await ev(`${setupA}; await __LW.settle(); return 1;`); A.push(await fps());
    await setCss(cssB); await ev(`${setupB}; await __LW.settle(); return 1;`); B.push(await fps());
  }
  let hashes = null;
  if (neutral) { await setCss(cssA); await ev(`${setupA}; return 1;`); const a1 = await shot(), a2 = await shot(); await setCss(cssB); await ev(`${setupB}; return 1;`); const b1 = await shot(); hashes = { a1, a2, b1, floorSame: a1 === a2, neutral: a1 === b1 }; }
  await setCss(''); await ev(`${setupA}; return 1;`);
  const mA = mean(A), mB = mean(B);
  const r = { name, A, B, fpsA: +mA.toFixed(1), fpsB: +mB.toFixed(1), msA: +(1000 / mA).toFixed(2), msB: +(1000 / mB).toFixed(2), gpuMsSaved: +(1000 / mA - 1000 / mB).toFixed(2), hashes };
  R.exps.push(r); console.log('exp', JSON.stringify(r));
}
const NOBF = '{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}';
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.boot = await ev(`return {dpr:devicePixelRatio, w:innerWidth, h:innerHeight, card:document.body.dataset.card, frost:__LW.frost, disc:__LW.disconnected, theme:__LW.theme};`);
  console.log('boot', JSON.stringify(R.boot));
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.setStyle('glass'); __LW.quality.res=128; __LW.quality.steps=240; __LW.quality.scale=1; __LW.schedule(4); await __LW.settle(); return 1;`);
  await exp('A/A calibration (nothing changes)');
  await exp('every backdrop-filter removed (diagnostic: the whole frost bill)', { cssB: '*,*::before,*::after' + NOBF });
  await exp('transport pill blur removed (diagnostic)', { cssB: '#transport' + NOBF });
  await exp('3 round rack buttons blur removed (diagnostic: per-layer overhead)', { cssB: '#rackToggle,#rackAdd,#rackFav' + NOBF });
  await exp('disconnected: head blur removed, body blur kept (diagnostic)', { cssB: 'body.disconnected .dev>.dev-head' + NOBF });
  await exp('disconnected: body blur removed, head blur kept (diagnostic)', { cssB: 'body.disconnected .dev>.dev-body' + NOBF });
  await exp('disconnected → connected (same frost; 18 → 12 layers)', { setupA: `__LW.setDisconnected(true)`, setupB: `__LW.setDisconnected(false)` });
  await exp('blur radius 22 → 8 (diagnostic: does the radius cost?)', { cssB: 'html:root{--glass-blur:8px!important}' });
  await exp('frost OFF · disconnected: the 8 head color-matrix layers removed (the OFF policy made backdrop-free)', { setupA: `__LW.setFrost('off')`, setupB: `__LW.setFrost('off')`, cssB: 'body.disconnected .dev>.dev-head' + NOBF });
  await ev(`__LW.setFrost('always'); await __LW.settle(); return 1;`);
  await exp('overlay canvases display:none while empty (neutral candidate)', { cssB: '#fieldlines,#vortex,#particles,#flow,#kepler{display:none!important}', neutral: true });
  await exp('modulation window open vs closed (its 9 extra layers)', { setupA: `__LW.mod.collapse()`, setupB: `__LW.mod.expand()` });
  await exp('UI shown vs UI hidden (everything the interface costs in a GPU-bound frame)', { setupA: `if(__LW.uiHidden) __LW.keys.toggleUI()`, setupB: `if(!__LW.uiHidden) __LW.keys.toggleUI()` });
  await ev(`if(__LW.uiHidden) __LW.keys.toggleUI(); return 1;`);
  R.errs = await ev('return window.__e');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT);
