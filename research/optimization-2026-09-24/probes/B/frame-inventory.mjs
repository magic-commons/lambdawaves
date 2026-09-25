/* frame-inventory.mjs — LANE B: what the frame loop does per frame, measured in headless Firefox (RTX 3070, µs timers).
 *   LW_PORT=8721 GD_PORT=5232 node research/optimization-2026-09-24/probes/B/frame-inventory.mjs [out.json]
 * Installs, AFTER boot, a counting/timing shim: requestAnimationFrame is wrapped so every callback named `loop` is one
 * bracketed frame; layout/style reads (getBoundingClientRect, getComputedStyle, clientWidth/offsetWidth getters) and DOM
 * writes (textContent, className, setAttribute, classList, style.setProperty, hidden) are counted per frame; the
 * frame-path methods reachable through __LW are wrapped for calls and ms.  Nothing in lab/ is edited. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import * as drv from '../../../../tools/gate/drv.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/probes/B/frame-inventory.json';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = { at: new Date().toISOString(), scenes: {}, idle: {}, micro: {}, notes: [] };
const ev = (s) => g.ev(s);
const SHIM = String.raw`
if (window.__B) return 'already';
const B = window.__B = { log: [], rafReq: 0, rafRun: 0, timers: 0, intervals: 0, idleCb: 0, wrapFail: [], on: true };
const blank = () => ({ ms: 0, gbcr: 0, gbcrMs: 0, gcs: 0, gpv: 0, gpvMs: 0, geom: 0, geomMs: 0, text: 0, cls: 0, attr: 0, tok: 0, sprop: 0, hid: 0, calls: {}, t: {} });
let cur = blank(), depth = 0;
B.cur = () => cur;
const oRAF = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = function (cb) { B.rafReq++; return oRAF((ts) => { B.rafRun++;
  if (!B.on || cb.name !== 'loop') { cb(ts); return; }
  const prev = cur; cur = blank(); depth++; const t0 = performance.now();
  try { cb(ts); } catch (e) { B.err = String(e && e.stack || e).slice(0, 600); throw e; } finally { cur.ms = performance.now() - t0; depth--; cur.wall = t0; cur.frames = __LW.stats.frames; cur.tier = __LW.stats.lastTier; B.log.push(cur); cur = prev; } }); };
const oST = window.setTimeout; window.setTimeout = function (...a) { B.timers++; return oST.apply(window, a); };
const oSI = window.setInterval; window.setInterval = function (...a) { B.intervals++; return oSI.apply(window, a); };
if (window.requestIdleCallback) { const oRIC = window.requestIdleCallback.bind(window); window.requestIdleCallback = (f, o) => { B.idleCb++; return oRIC(f, o); }; }
const timeIt = (k, kms) => (f) => function (...a) { const t0 = performance.now(); try { return f.apply(this, a); } finally { cur[k]++; if (kms) cur[kms] += performance.now() - t0; } };
Element.prototype.getBoundingClientRect = timeIt('gbcr', 'gbcrMs')(Element.prototype.getBoundingClientRect);
const oGCS = window.getComputedStyle; window.getComputedStyle = function (...a) { cur.gcs++; return oGCS.apply(window, a); };
CSSStyleDeclaration.prototype.getPropertyValue = timeIt('gpv', 'gpvMs')(CSSStyleDeclaration.prototype.getPropertyValue);
CSSStyleDeclaration.prototype.setProperty = timeIt('sprop')(CSSStyleDeclaration.prototype.setProperty);
for (const [proto, names] of [[Element.prototype, ['clientWidth', 'clientHeight']], [HTMLElement.prototype, ['offsetWidth', 'offsetHeight']]]) for (const n of names) {
  const d = Object.getOwnPropertyDescriptor(proto, n); if (!d || !d.get) continue; const get = d.get;
  Object.defineProperty(proto, n, { ...d, get() { const t0 = performance.now(); try { return get.call(this); } finally { cur.geom++; cur.geomMs += performance.now() - t0; } } }); }
const setter = (proto, n, k) => { const d = Object.getOwnPropertyDescriptor(proto, n); if (!d || !d.set) return; const set = d.set; Object.defineProperty(proto, n, { ...d, set(v) { cur[k]++; return set.call(this, v); } }); };
setter(Node.prototype, 'textContent', 'text'); setter(Element.prototype, 'className', 'cls'); setter(HTMLElement.prototype, 'hidden', 'hid');
for (const n of ['setAttribute', 'removeAttribute']) Element.prototype[n] = timeIt('attr')(Element.prototype[n]);
for (const n of ['add', 'remove', 'toggle']) DOMTokenList.prototype[n] = timeIt('tok')(DOMTokenList.prototype[n]);
const wrap = (obj, name, label) => { try { const f = obj && obj[name]; if (typeof f !== 'function') { B.wrapFail.push(label + ':absent'); return; }
  obj[name] = function (...a) { const t0 = performance.now(); try { return f.apply(this, a); } finally { const d = performance.now() - t0; cur.calls[label] = (cur.calls[label] || 0) + 1; cur.t[label] = (cur.t[label] || 0) + d; } };
  if (obj[name] === f) B.wrapFail.push(label + ':frozen'); } catch (e) { B.wrapFail.push(label + ':' + e.message); } };
const L = __LW;
for (const [o, ns, p] of [[L.spectrum, ['update', 'rebuild'], 'spectrum.'], [L.shadowView, ['update'], 'shadow.'], [L.orbitView, ['update'], 'orbit.'],
  [L.vortex, ['update', 'suspend'], 'vortex.'], [L.particles, ['advance', 'draw', 'suspend'], 'particles.'], [L.kepler, ['update', 'suspend', 'clear', 'bowFrame'], 'kepler.'],
  [L.fieldlines, ['update'], 'fieldlines.'], [L.slice, ['update', 'setActive'], 'slice.'], [L.dynamics, ['update'], 'dynamics.'], [L.qcd, ['update'], 'qcd.'],
  [L.atoms, ['update'], 'atoms.'], [L.calculus, ['update'], 'calculus.'], [L.ladder, ['setActive'], 'ladder.'], [L.gas, ['stats', 'fieldModes', 'at'], 'gas.'],
  [L.field, ['frame', 'resize', 'setOcclusion', 'setStepCap'], 'field.'], [L.reg, ['at', 'populated', 'renderSet', 'energy', 'autocorrelation', 'norm', 'norm2', 'nmax', 'digest'], 'reg.'],
  [L.molecule, ['update'], 'molecule.'], [L.helium, ['setActive'], 'helium.'], [L.h2, ['setActive', 'update'], 'h2.'], [L.chem, ['update', 'setActive'], 'chem.'],
  [L.windowActivity, ['canPresent'], 'wa.']]) for (const n of ns) wrap(o, n, p + n);
B.reset = () => { B.log = []; B.rafReq = 0; B.rafRun = 0; B.timers = 0; B.intervals = 0; B.idleCb = 0; };
B.summary = () => {
  const F = B.log, n = F.length; if (!n) return { frames: 0, rafReq: B.rafReq, rafRun: B.rafRun, on: B.on, lf: __LW.stats.frames, same: window.requestAnimationFrame === requestAnimationFrame };
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; }, p = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
  const ms = F.map((f) => f.ms), keys = ['gbcr', 'gcs', 'gpv', 'geom', 'text', 'cls', 'attr', 'tok', 'sprop', 'hid'];
  const per = Object.fromEntries(keys.map((k) => [k, +(F.reduce((s, f) => s + f[k], 0) / n).toFixed(2)]));
  const calls = {}, t = {}, tmax = {};
  for (const f of F) for (const k in f.calls) { calls[k] = (calls[k] || 0) + f.calls[k]; t[k] = (t[k] || 0) + f.t[k]; tmax[k] = Math.max(tmax[k] || 0, f.t[k]); }
  const fn = Object.fromEntries(Object.keys(calls).sort((a, b) => t[b] - t[a]).map((k) => [k, { perFrame: +(calls[k] / n).toFixed(3), msPerFrame: +(t[k] / n).toFixed(4), msPerCall: +(t[k] / calls[k]).toFixed(4), maxInFrame: +tmax[k].toFixed(3) }]));
  const occ = F.filter((f) => f.gbcr > 0), noOcc = F.filter((f) => f.gbcr === 0);
  return { frames: n, loopMs: { median: +med(ms).toFixed(4), p90: +p(ms, 0.9).toFixed(4), max: +Math.max(...ms).toFixed(3), mean: +(ms.reduce((a, b) => a + b, 0) / n).toFixed(4) },
    perFrame: per, layoutReadMs: { gbcrPerFrame: +(F.reduce((s, f) => s + f.gbcrMs, 0) / n).toFixed(4), gpvPerFrame: +(F.reduce((s, f) => s + f.gpvMs, 0) / n).toFixed(4), geomPerFrame: +(F.reduce((s, f) => s + f.geomMs, 0) / n).toFixed(4) },
    occlusionFrames: { count: occ.length, share: +(occ.length / n).toFixed(3), loopMsMedian: occ.length ? +med(occ.map((f) => f.ms)).toFixed(4) : 0, gbcrPerOccFrame: occ.length ? +(occ.reduce((s, f) => s + f.gbcr, 0) / occ.length).toFixed(1) : 0, gcsPerOccFrame: occ.length ? +(occ.reduce((s, f) => s + f.gcs, 0) / occ.length).toFixed(1) : 0, gbcrMsPerOccFrame: occ.length ? +(occ.reduce((s, f) => s + f.gbcrMs, 0) / occ.length).toFixed(4) : 0, otherFramesMedian: noOcc.length ? +med(noOcc.map((f) => f.ms)).toFixed(4) : 0 },
    fn, lwPerfMedian: +__LW.perf.median.toFixed(4), profile: Object.fromEntries(Object.entries(__LW.perf.profile).filter(([, v]) => v > 0.0005).map(([k, v]) => [k, +v.toFixed(4)])),
    tiers: F.reduce((o, f) => { o[f.tier] = (o[f.tier] || 0) + 1; return o; }, {}), rafReq: B.rafReq, rafRun: B.rafRun, timers: B.timers, intervals: B.intervals, idleCb: B.idleCb,
    worst: F.slice().sort((a, b) => b.ms - a.ms).slice(0, 3).map((f) => ({ ms: +f.ms.toFixed(3), gbcr: f.gbcr, gcs: f.gcs, geom: f.geom, text: f.text, top: Object.entries(f.t).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + ' ' + v.toFixed(3)) })) };
};
return { wrapFail: B.wrapFail };`;
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.shim = await ev(SHIM);
  console.log('shim', JSON.stringify(R.shim));
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.quality.autoScale=1; __LW.pause(); await __LW.settle(); return 1;`);
  const scene = async (label, setup, secs = 3) => {
    const r = await ev(`${setup || ''}; await __LW.settle(); await new Promise(r=>setTimeout(r,400)); __LW.perf.resetRing(); __B.reset(); __LW.play();
      await new Promise(r=>setTimeout(r,${secs * 1000})); const s = __B.summary(); __LW.pause(); await __LW.settle();
      s.open = document.querySelectorAll('.dev:not(.closed)').length; s.uiHidden = __LW.uiHidden; s.res = __LW.field.resolution; s.perfMode = __LW.perf.mode; s.modRunning = __LW.mod.running; return s;`);
    R.scenes[label] = r; console.log('scene', label, JSON.stringify({ frames: r.frames, loopMs: r.loopMs, lw: r.lwPerfMedian, occ: r.occlusionFrames, perFrame: r.perFrame }));
    return r;
  };
  await scene('A default windows · 1s+2pz · 96³ · UI shown');
  if (process.env.ONLY === 'A') { R.debug = await ev(`__LW.play(); await new Promise(r=>setTimeout(r,500)); const o={errs:window.__e, frames:__LW.stats.frames, scheduled:__LW.stats.scheduled, hidden:__LW.background.hidden, vis:document.visibilityState, rafReq:__B.rafReq}; __LW.pause(); return o;`); throw new Error('ONLY=A: stopping after scene A'); }
  await scene('B default windows · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('C default windows · UI shown again', `if(__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('D default · perf FULL', `__LW.perf.setMode('full')`);
  await ev(`__LW.perf.setMode('120'); return 1;`);
  await scene('E every window open (presentOffscreen)', `for (const d of document.querySelectorAll('.dev.closed')) __LW.layout.reopen(d.dataset.id,'R'); __LW.windowActivity.presentOffscreen(true)`);
  await scene('F every window open · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await ev(`if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.windowActivity.presentOffscreen(false); return 1;`);
  await scene('G modulation window open', `__LW.mod.expand()`);
  await ev(`__LW.mod.collapse(); return 1;`);
  /* the lead's Chromium scene, step for step (bench-chromium.mjs line 70) */
  const gasSetup = `if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.windowActivity.presentOffscreen(false); for(const d of document.querySelectorAll('.dev')) if(!['spectrum','shadow','settings','state','palette','observer','camera','clip'].includes(d.dataset.id)) d.classList.add('closed'); __LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); __LW.quality.res=128; __LW.quality.steps=240; __LW.schedule(4)`;
  await scene('H 128³ axial gas · UI shown (bench-chromium scene)', gasSetup, 4);
  await scene('I 128³ axial gas · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`, 4);
  await scene('J 128³ axial gas · UI shown · frost off', `if(__LW.uiHidden) __LW.keys.toggleUI(); __LW.setFrost('off')`, 4);
  await ev(`__LW.setFrost('always'); return 1;`);
  await scene('K 64³ axial gas · UI shown · perf FULL', `__LW.quality.res=64; __LW.quality.steps=110; __LW.perf.setMode('full'); __LW.schedule(4)`, 3);
  await ev(`__LW.perf.setMode('120'); __LW.setHamiltonian('hydrogen'); __LW.setGasBasis('reg'); __LW.loadPreset('1s+2pz'); __LW.quality.res=96; __LW.quality.steps=160; __LW.schedule(4); __LW.pause(); await __LW.settle(); return 1;`);
  /* ── IDLE IS ZERO WORK: a paused instrument over 5 s ── */
  const idle = async (label, setup) => {
    const r = await ev(`${setup || ''}; __LW.pause(); await __LW.settle(); await new Promise(r=>setTimeout(r,800)); __B.reset(); const f0=__LW.stats.frames, t0=performance.now();
      await new Promise(r=>setTimeout(r,5000)); return { loopFrames: __LW.stats.frames - f0, rafReq: __B.rafReq, rafRun: __B.rafRun, timers: __B.timers, intervals: __B.intervals, idleCb: __B.idleCb, secs: +((performance.now()-t0)/1000).toFixed(2), scheduled: __LW.stats.scheduled, modRunning: __LW.mod.running, modPaints: __LW.mod.view ? __LW.mod.view.performance() : null };`);
    R.idle[label] = r; console.log('idle', label, JSON.stringify(r)); return r;
  };
  await idle('paused · default windows · mod window closed');
  await idle('paused · mod window open', `__LW.mod.expand()`);
  await ev(`__LW.mod.collapse(); return 1;`);
  /* a knob under a resting pointer: the driver moves the real pointer onto EXPOSURE and leaves it there */
  const kp = await ev(`const k=document.querySelector('.dev[data-id="observer"] .k .k-dial'); if(!k) return null; k.scrollIntoView({block:'center'}); const b=k.getBoundingClientRect(); return {x:Math.round(b.left+b.width/2), y:Math.round(b.top+b.height/2)};`);
  if (kp) { await drv.actions(g.s, [{ type: 'pointer', id: 'hov', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: kp.x, y: kp.y }] }]); }
  await idle('paused · pointer resting on a knob');
  await idle('paused · synthetic pointermove on a knob every 50 ms (in-page dispatch)', `const kd=document.querySelector('.dev[data-id="observer"] .k .k-dial'); const b=kd.getBoundingClientRect(); let i=0; window.__wig=setInterval(()=>{ i++; kd.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:b.left+10+(i%5),clientY:b.top+10,pointerType:'mouse'})); },50)`);
  await ev(`clearInterval(window.__wig); return 1;`);
  /* ── MICRO: the hitch suspects, timed in the page ── */
  R.micro = await ev(`const T=(f,n)=>{ for(let i=0;i<3;i++) f(); const t0=performance.now(); for(let i=0;i<n;i++) f(); return +((performance.now()-t0)/n).toFixed(4); };
    const out={};
    out.saveSettingsMs = T(()=>__LW.saveSettings(), 50);
    out.settingsBytes = (localStorage.getItem('lambdawaves.q0.settings')||'').length;
    out.meterSnapshotMs = T(()=>__LW.meters(), 500);
    out.serializeMs = T(()=>__LW.serialize(), 20);
    const L=__LW; L.loadPreset('1s'); for(let a=0;a<91;a++) L.reg.set(a,1,0,0); L.reg.normalize();
    out.renderSet91Ms = T(()=>L.reg.renderSet(91), 2000); out.populated91Ms = T(()=>L.reg.populated(), 5000); out.at91Ms = T(()=>L.reg.at(1.234), 5000);
    out.digest91Ms = T(()=>L.reg.digest(), 2000);
    out.normalAmplitudes91Ms = T(()=>{ L.reg._ow.version=-1; return L.reg.energy(); }, 2000);
    out.modesAt91Ms = T(()=>L.modesAt(1.234), 5000);
    out.historyNoteMs = L.history && L.history.note ? T(()=>L.history.note(), 200) : null;
    L.loadPreset('1s+2pz'); await L.settle();
    return out;`);
  console.log('micro', JSON.stringify(R.micro));
  R.errors = await g.errors();
} catch (e) { R.notes.push('probe error: ' + (e && e.stack || e)); console.error(e); }
finally { fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); await g.close(); console.log('wrote', OUT); }
