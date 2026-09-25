/* ff-headed-ab.mjs — Lane C A/B experiments in HEADED Firefox (Gecko WebRender on the RTX 3070): each candidate CSS rule is
 * injected as a <style id="labC"> in the page (lab/ is not edited) and the delivered rAF fps is read while the transport
 * plays at 96³, interleaved A/B/A/B to average out the ±5 fps drift the baseline shows between identical states.
 * Neutral candidates also get a paused-frame screenshot hash (A vs B) — the field is static when paused.
 *   DISPLAY=:0 LW_PORT=8721 GD_PORT=5233 node research/optimization-2026-09-24/probes/C/ff-headed-ab.mjs [out.json] [only-exp-substring] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/probes/C/ff-headed-ab.json';
const ONLY = process.argv[3] || '';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const SECS = +(process.env.SECS || 3);
const REPS = +(process.env.REPS || 2);
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0`, { width: W, height: H, script: 600000, headless: false, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = { at: new Date().toISOString(), viewport: [W, H], host: 'firefox-headed', secs: SECS, exps: [] };
const ev = (s) => g.ev(s);
const setCss = (css) => ev(`let s=document.getElementById('labC'); if(!s){s=document.createElement('style'); s.id='labC'; document.head.appendChild(s);} s.textContent=${JSON.stringify(css || '')}; await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); return 1;`);
const fps = () => ev(`await __LW.settle(); await new Promise(r=>setTimeout(r,350)); __LW.play();
  let n=0; const t0=performance.now(); await new Promise(r=>{const f=()=>{n++; if(performance.now()-t0<${SECS * 1000}) requestAnimationFrame(f); else r();}; requestAnimationFrame(f);});
  const dt=(performance.now()-t0)/1000; __LW.pause(); return +(n/dt).toFixed(1);`);
const shot = async () => { await ev(`__LW.pause(); __LW.schedule(4); await __LW.settle(); await new Promise(r=>setTimeout(r,300)); return 1;`); const b = await g.snap(); return crypto.createHash('sha1').update(b).digest('hex').slice(0, 12); };
async function exp(name, setup, cssB, { neutral = false, reps = REPS, cssA = '' } = {}) {
  if (ONLY && !name.includes(ONLY)) return;
  await setCss(''); await ev(`${setup || ''}; await __LW.settle(); return 1;`);
  const A = [], B = [];
  for (let i = 0; i < reps; i++) { await setCss(cssA); A.push(await fps()); await setCss(cssB); B.push(await fps()); }
  let hashA = null, hashB = null;
  if (neutral) { await setCss(cssA); hashA = await shot(); await setCss(cssB); hashB = await shot(); }
  await setCss('');
  const mean = (a) => +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(1);
  const r = { name, A, B, meanA: mean(A), meanB: mean(B), delta: +(mean(B) - mean(A)).toFixed(1), neutral, hashA, hashB, same: neutral ? hashA === hashB : null };
  R.exps.push(r); console.log('exp', JSON.stringify(r));
}
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.boot = await ev(`return {dpr:devicePixelRatio, w:innerWidth, h:innerHeight, card:document.body.dataset.card, frost:__LW.frost, disc:__LW.disconnected, theme:__LW.theme};`);
  console.log('boot', JSON.stringify(R.boot));
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.quality.res=96; __LW.quality.steps=160; __LW.quality.scale=1; __LW.schedule(4); await __LW.settle(); return 1;`);
  const NOBF = '{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}';
  /* 1 · two whole cards sit entirely below the rack's clip (camera, clip): does an OFF-SCREEN backdrop layer cost? */
  await exp('offscreen cards culled (camera+clip hidden) · default', '', '.dev[data-id="camera"],.dev[data-id="clip"],.dev[data-id="camera"]>*,.dev[data-id="clip"]>*{visibility:hidden!important}', { neutral: true });
  /* 2 · the three 30-px round chrome buttons: the per-LAYER overhead of a tiny blur */
  await exp('3 round rack buttons: no backdrop (diagnostic)', '', '#rackToggle,#rackAdd,#rackFav' + NOBF);
  /* 3 · the transport pill's blur (640×46) */
  await exp('transport: no backdrop (diagnostic)', '', '#transport' + NOBF);
  /* 4 · frost OFF under DISCONNECTED still has 8 head layers (brightness·saturate): what do they cost? */
  await exp('frost OFF · disconnected: heads without the color-matrix backdrop (look change)', `__LW.setFrost('off')`, 'body.disconnected .dev>.dev-head' + NOBF);
  /* 5 · the tall spectrum body: 1512 px of glass, 583 visible — does the clipped part cost? (cap the box, same visible pixels) */
  await exp('frost ALWAYS · disconnected: spectrum body clipped to its visible part via clip-path (neutral?)', `__LW.setFrost('always')`, '#devb-spectrum{clip-path:inset(0 0 calc(100% - 640px) 0 round 0 0 12px 12px)}', { neutral: true });
  /* 6 · layer promotion of the two racks and the pill: does WebRender get cheaper with its own slices? */
  await exp('will-change:transform on #rack,#rackL,#transport (neutral?)', '', '#rack,#rackL{will-change:transform}#transport.mini{will-change:transform}', { neutral: true });
  /* 7 · paint containment on each card body (cards' content isolated) */
  await exp('contain:paint on disconnected card bodies (neutral?)', '', 'body.disconnected .dev>.dev-body,body.disconnected .dev>.dev-head{contain:paint}', { neutral: true });
  /* 8 · every rack window open: content-visibility:auto on rack cards (skips the ones outside the rack clip) */
  await exp('every window open: content-visibility:auto on rack cards', `for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.windowActivity.presentOffscreen(true)`, '#rack>.dev,#rackL>.dev{content-visibility:auto;contain-intrinsic-size:auto 400px}', { neutral: true });
  await exp('every window open: offscreen cards visibility:hidden (the cull, measured directly)', '', '#rack>.dev:nth-child(n+7),#rack>.dev:nth-child(n+7)>*{visibility:hidden!important}', { neutral: false });
  /* 10 · the five overlay canvases are released to 1×1 when idle but keep a full-screen box (Chromium composites them as a
     1920×1043 'Overlap' layer; WebRender draws each as a full-screen image) — hiding the empty ones paints nothing different */
  await exp('overlay canvases display:none while empty · default', `if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.windowActivity.presentOffscreen(false); for(const d of document.querySelectorAll('.dev')) if(!['spectrum','shadow','settings','state','palette','observer','camera','clip'].includes(d.dataset.id)) d.classList.add('closed')`, '#fieldlines,#vortex,#particles,#flow,#kepler{display:none!important}', { neutral: true });
  await exp('overlay canvases display:none · UI hidden · GPU-bound (glass style, 128³)', `if(!__LW.uiHidden) __LW.keys.toggleUI(); __LW.setStyle('glass'); __LW.quality.res=128; __LW.quality.steps=240; __LW.schedule(4)`, '#fieldlines,#vortex,#particles,#flow,#kepler{display:none!important}', { neutral: true });
  await exp('GPU-bound (glass 128³) · UI shown, frost vs no backdrop anywhere (diagnostic)', `if(__LW.uiHidden) __LW.keys.toggleUI()`, '*,*::before' + NOBF, {});
  await ev(`if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.setStyle('cloud'); __LW.quality.res=96; __LW.quality.steps=160; __LW.schedule(4); await __LW.settle(); return 1;`);
  /* 11 · the STILL policy's play/pause crossing: the longest rAF gap in the first 12 frames after play and after pause */
  if (!ONLY || ONLY === 'hitch') {
    const gap = (mode) => ev(`__LW.setFrost('${mode}'); await __LW.settle(); await new Promise(r=>setTimeout(r,400));
      const gaps=[]; let last=0; let run=true; const f=(t)=>{ if(last) gaps.push(t-last); last=t; if(run) requestAnimationFrame(f); }; requestAnimationFrame(f);
      await new Promise(r=>setTimeout(r,150)); const g0=gaps.length; __LW.play(); await new Promise(r=>setTimeout(r,600)); const g1=gaps.length; __LW.pause(); await new Promise(r=>setTimeout(r,600)); run=false;
      const mx=(a)=>+Math.max(0,...a).toFixed(1); const s=gaps.slice().sort((a,b)=>a-b); return { mode:'${mode}', playMaxGap: mx(gaps.slice(g0, g0+12)), pauseMaxGap: mx(gaps.slice(g1, g1+12)), medianGap: +s[s.length>>1].toFixed(2) };`);
    const hitch = [];
    for (let i = 0; i < 3; i++) { hitch.push(await gap('still')); hitch.push(await gap('always')); }
    await ev(`__LW.setFrost('always'); return 1;`);
    R.hitch = hitch; console.log('hitch', JSON.stringify(hitch));
  }
  R.errs = await ev('return window.__e');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT);
