/* probe-f-firefox.mjs — LANE F (stutters, glitches, breaks) in the gate's headless Firefox on the RTX 3070.
 *   LW_PORT=8721 GD_PORT=5236 node research/optimization-2026-09-24/probes/F/probe-f-firefox.mjs [out.json]
 * Reads the app only through __LW and the DOM; edits nothing under lab/.  Every number is measured in the page. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/probes/F/probe-f-firefox.json';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = { at: new Date().toISOString() };
const ev = (s) => g.ev(s);
const step = async (name, body) => { try { R[name] = await ev(body); } catch (e) { R[name] = { probeError: String(e && e.message || e).slice(0, 400) }; } console.log(name, JSON.stringify(R[name]).slice(0, 600)); };
/* the per-frame recorder: accessor properties on __LW.perf.profile turn every EMA write back into the RAW ms of that
   frame (raw = (new − 0.9·old)/0.1).  `total` is written once per loop at its tail = the perf.ring value. */
const RECORDER = `
  if (!window.__F) {
    const P = __LW.perf.profile, F = window.__F = { on: false, rows: [], cur: null, raf: [], lastRaf: 0 };
    for (const k of Object.keys(P)) { let v = P[k]; Object.defineProperty(P, k, { configurable: true, enumerable: true, get() { return v; },
      set(nv) { const raw = (nv - 0.9 * v) / 0.1; v = nv; if (!F.on) return; if (!F.cur) F.cur = {}; F.cur[k] = (F.cur[k] || 0) + raw; if (k === 'total') { F.rows.push(F.cur); F.cur = null; } } }); }
    const tickRaf = (t) => { if (F.on) { if (F.lastRaf) F.raf.push(t - F.lastRaf); F.lastRaf = t; } requestAnimationFrame(tickRaf); }; requestAnimationFrame(tickRaf);
  }
  window.__Fsum = (arr) => { const a = arr.filter(Number.isFinite).slice().sort((x, y) => x - y); if (!a.length) return null; const q = (p) => +a[Math.min(a.length - 1, Math.floor(p * a.length))].toFixed(3); return { n: a.length, min: +a[0].toFixed(3), p10: q(0.1), median: q(0.5), p90: q(0.9), p99: q(0.99), max: +a[a.length - 1].toFixed(3) }; };
  window.__Fscene = async (ms) => { const F = window.__F; F.rows = []; F.raf = []; F.lastRaf = 0; F.cur = null; __LW.perf.resetRing(); F.on = true; __LW.play();
    await new Promise((r) => setTimeout(r, ms)); F.on = false; __LW.pause();
    const tot = F.rows.map((r) => r.total), keys = new Set(); for (const r of F.rows) for (const k of Object.keys(r)) keys.add(k);
    const per = {}; for (const k of keys) if (k !== 'total') { const v = F.rows.map((r) => r[k] || 0); const s = v.reduce((a, b) => a + b, 0); if (s > 0.01) per[k] = { sum: +s.toFixed(2), max: +Math.max(...v).toFixed(3), calls: v.filter((x) => x > 0).length }; }
    const spikes = F.rows.map((r, i) => ({ i, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, +v.toFixed(2)])) })).filter((r) => r.total > 8).slice(0, 12);
    return { frames: F.rows.length, total: __Fsum(tot), raf: __Fsum(F.raf), rafOver50: F.raf.filter((x) => x > 50).length, rafOver250: F.raf.filter((x) => x > 250).length, perReader: per, spikes, appMedian: +__LW.perf.median.toFixed(3), fps: +__LW.stats.fps.toFixed(1), res: __LW.field.resolution }; };
  return 1;`;
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.boot = await ev(`return { readyMs: +performance.now().toFixed(0), ok: __LW.field.ok, errs: window.__e, perfMode: __LW.perf.mode, kickWarmStarted: __LW.maths.started };`);
  console.log('boot', JSON.stringify(R.boot));
  await ev(RECORDER);
  /* ── (1) SYNCHRONOUS WORK ON A HAND ─────────────────────────────────────────────────────────────── */
  await step('kickKeyCold', `const t = performance.now(); __LW.kick(0.2, 'z'); return +(performance.now() - t).toFixed(2);`);   // K before the idle warm (it starts 3 s after boot)
  await step('kickKeyWarm', `const a = []; for (let i = 0; i < 6; i++) { const t = performance.now(); __LW.kick(0.2, ['x','y','z'][i % 3]); a.push(performance.now() - t); } return __Fsum(a);`);
  await step('kickAlongWarm', `const a = []; for (let i = 0; i < 4; i++) { const t = performance.now(); __LW.kickAlong(0.3, [0.3, 0.5, 0.81]); a.push(performance.now() - t); } return __Fsum(a);`);
  await step('bowWorkerWarm', `__LW.loadPreset('1s+2pz'); __LW.pause(); const a = []; for (let i = 0; i < 3; i++) { __LW.bow.start(900, 500); __LW.bow.move(1000, 420); const t = performance.now(); __LW.bow.release(); const sync = performance.now() - t; const t1 = performance.now(); await __LW.bow.landed; a.push({ syncMs: +sync.toFixed(2), landMs: +(performance.now() - t1).toFixed(1) }); } return a;`);
  await step('boxLaunchSync', `__LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.pause(); const a = []; for (let i = 0; i < 3; i++) { const t = performance.now(); __LW.launchPacket([-4 + i, 0.5, 0], [0.9, 0.2, 0], 1.4); a.push(+(performance.now() - t).toFixed(1)); } return { ms: a, labels: __LW.reg.populated().length };`);
  await step('boxPeriodForced', `__LW.launchPacket([-3.3, 0.7, 0.2], [1.1, 0.1, 0], 1.3); const n = __LW.reg.populated().length; const t = performance.now(); const P = __LW.period; const first = performance.now() - t; const t2 = performance.now(); __LW.period; const second = performance.now() - t2; return { labels: n, firstMs: +first.toFixed(1), cachedMs: +second.toFixed(3), exact: P && P.exact, T: P && P.T };`);
  await step('captureHoverPlan', `const out = {}; for (const view of ['density', 'phase']) { __LW.setView(view); __LW.launchPacket([-2.9 - (view === 'phase' ? 0.4 : 0), 0.3, 0.1], [1.0, 0.2, 0.1], 1.35); const t = performance.now(); const p = __LW.captureUI.plan(false); out[view] = { ms: +(performance.now() - t).toFixed(1), label: p && p.label, labels: __LW.reg.populated().length }; } __LW.setView('phase'); return out;`);
  await step('axialEnterBox', `__LW.setGasBasis('axial'); const a = []; for (let i = 0; i < 3; i++) { const t = performance.now(); __LW.enterBox(); a.push(+(performance.now() - t).toFixed(1)); __LW.pause(); } return { ms: a, modes: __LW.gas.fieldModes(__LW.clock.t).length };`);
  await step('sturmianLambdaDrag', `__LW.setHamiltonian('hydrogen'); __LW.setGasBasis('reg'); __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.sturmian.set(true); const a = []; for (let i = 0; i < 8; i++) { const t = performance.now(); __LW.sturmian.setLambda(0.9 + i * 0.037); a.push(performance.now() - t); } const r = __Fsum(a); __LW.sturmian.set(false); return r;`);
  await step('elementKnob', `const a = []; for (const Z of [11, 19, 26, 36]) { const t = performance.now(); __LW.setElement(Z); a.push({ Z, ms: +(performance.now() - t).toFixed(1) }); } __LW.setElement(10); return a;`);
  /* ── (2) SETTINGS / PROJECT / HISTORY READS ON EVENTS ───────────────────────────────────────────── */
  await step('saveSettings', `const a = []; for (let i = 0; i < 20; i++) { const t = performance.now(); __LW.saveSettings(); a.push(performance.now() - t); } return { ...__Fsum(a), bytes: (localStorage.getItem('lambdawaves.q0.settings') || '').length };`);
  await step('historyReads', `const H = __LW.history; const a = []; for (let i = 0; i < 20; i++) { const t = performance.now(); H.canUndo; H.canRedo; H.depth; a.push(performance.now() - t); } return __Fsum(a);`);
  await step('projectDirty', `const p = __LW.layout.projects; const a = []; for (let i = 0; i < 10; i++) { const t = performance.now(); p.dirty; a.push(performance.now() - t); } return __Fsum(a);`);
  /* ── (3) THEME, PALETTE, WINDOWS — the sync JS plus the forced style/layout the next frame would pay ── */
  await step('themeFlip', `const a = []; for (const th of ['dark', 'light', 'dark', 'light']) { const t = performance.now(); __LW.setTheme(th); const js = performance.now() - t; document.body.offsetHeight; a.push({ th, jsMs: +js.toFixed(2), withStyleMs: +(performance.now() - t).toFixed(2) }); } return a;`);
  await step('paletteChange', `const ids = __LW.paletteGroups.flatMap((g) => g.items).slice(0, 4); const a = []; for (const id of ids) { const t = performance.now(); __LW.setPalette(id); const js = performance.now() - t; document.body.offsetHeight; a.push({ id, jsMs: +js.toFixed(2), withStyleMs: +(performance.now() - t).toFixed(2) }); } return a;`);
  await step('modWindowOpen', `const a = []; for (let i = 0; i < 4; i++) { const t = performance.now(); __LW.layout.modulation.toggle(); const js = performance.now() - t; document.body.offsetHeight; a.push({ open: __LW.layout.modulation.open, jsMs: +js.toFixed(2), withStyleMs: +(performance.now() - t).toFixed(2) }); await new Promise((r) => setTimeout(r, 100)); } return a;`);
  await step('heavyCardsFirstOpen', `const out = {}; for (const id of ['helium', 'ladder', 'wigner', 'slice', 'chem', 'orbitals']) { const t = performance.now(); try { __LW.layout.reopen(id, 'R'); } catch (e) { out[id] = String(e); continue; } const js = performance.now() - t; document.body.offsetHeight; out[id] = { jsMs: +js.toFixed(2), withStyleMs: +(performance.now() - t).toFixed(2) }; await __LW.settle(); } return out;`);
  await step('heliumOn', `const t = performance.now(); __LW.helium.setOn(true); const sync = performance.now() - t; const t1 = performance.now(); for (let i = 0; i < 400 && !(__LW.helium.ready || (__LW.helium.state && __LW.helium.state().solved)); i++) await new Promise((r) => setTimeout(r, 25)); const land = performance.now() - t1; __LW.helium.setOn(false); return { syncMs: +sync.toFixed(2), landMs: +land.toFixed(0), workers: __LW.maths.started };`);
  await step('restore', `const s = __LW.serialize(); const a = []; for (let i = 0; i < 3; i++) { const t = performance.now(); const ok = __LW.restore(s); a.push({ ok, ms: +(performance.now() - t).toFixed(1) }); } const t = performance.now(); __LW.layout.applyLayout(s.presentation.layout); const al = performance.now() - t; return { restores: a, applyLayoutMs: +al.toFixed(1), bytes: JSON.stringify(s).length };`);
  /* ── (4) FRAME SHAPES while playing (raw per-frame ms from the loop's own EMA writes) ──────────── */
  const grid = async (res) => ev(`__LW.governor.on = false; __LW.quality.auto = false; __LW.quality.autoScale = 1; __LW.quality.res = ${res}; __LW.quality.steps = {64:110,96:160,128:240}[${res}]; __LW.quality.scale = {64:0.75,96:1,128:1}[${res}]; __LW.schedule(4); await __LW.settle(); return __LW.field.resolution;`);
  await ev(`for (const id of ['helium','ladder','wigner','slice','chem','orbitals']) { const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d) d.classList.add('closed'); } if (__LW.layout.modulation.open) __LW.layout.modulation.toggle(); await __LW.settle(); return 1;`);
  await ev(`__LW.setHamiltonian('hydrogen'); __LW.setGasBasis('reg'); __LW.loadPreset('sim-ladder'); __LW.pause(); return 1;`); await grid(96);
  await step('scene_simLadder96_ui', `return await __Fscene(4000);`);
  await ev(`__LW.setHamiltonian('well'); __LW.setGasBasis('axial'); __LW.enterBox(); __LW.pause(); return 1;`); await grid(128);
  await step('scene_axialGas128_ui', `const G = __LW.gas, f0 = G.fieldModes, s0 = G.stats; const fm = [], st = []; G.fieldModes = (t) => { const a = performance.now(); const r = f0(t); fm.push(performance.now() - a); return r; }; G.stats = (t, s) => { const a = performance.now(); const r = s0(t, s); st.push(performance.now() - a); return r; }; const r = await __Fscene(5000); G.fieldModes = f0; G.stats = s0; r.gasFieldModes = __Fsum(fm); r.gasStats = __Fsum(st); return r;`);
  await ev(`if (!__LW.uiHidden) __LW.keys.toggleUI(); return 1;`);
  await step('scene_axialGas128_hidden', `return await __Fscene(5000);`);
  await ev(`if (__LW.uiHidden) __LW.keys.toggleUI(); return 1;`);
  await grid(64);
  await step('scene_axialGas64_ui', `const G = __LW.gas, s0 = G.stats; const st = []; G.stats = (t, s) => { const a = performance.now(); const r = s0(t, s); st.push(performance.now() - a); return r; }; const r = await __Fscene(4000); G.stats = s0; r.gasStats = __Fsum(st); return r;`);
  /* ── (5) IDLE IS ZERO: a body class toggle (MutationObserver → dirty → PRESENT) must cost a bounded number of frames ── */
  await step('bodyClassToggleFrames', `__LW.pause(); await __LW.settle(); await new Promise((r) => setTimeout(r, 400)); const f0 = __LW.stats.frames; document.body.classList.toggle('lane-f-probe'); await new Promise((r) => setTimeout(r, 1500)); const f1 = __LW.stats.frames; document.body.classList.toggle('lane-f-probe'); await new Promise((r) => setTimeout(r, 1500)); return { framesAfterToggle: f1 - f0, framesAfterUntoggle: __LW.stats.frames - f1, scheduled: __LW.stats.scheduled };`);
  await step('busyFlashAfterIdle', `const m = document.querySelector('#title .mark'); const before = m && m.classList.contains('busy'); __LW.play(); await new Promise((r) => setTimeout(r, 300)); const during = m && m.classList.contains('busy'); __LW.pause(); return { before, during };`);
  /* ── (6) THE LOST DEVICE: destroy it, then drive the instrument and collect every throw ───────────── */
  await step('deviceLost', `window.__e = window.__e || []; const e0 = window.__e.length; const thrown = []; const T = (name, f) => { try { const r = f(); if (r && r.then) return r.catch((e) => thrown.push(name + ': ' + String(e && e.message || e))); } catch (e) { thrown.push(name + ': ' + String(e && e.message || e)); } };
    __LW.field.device.destroy(); for (let i = 0; i < 100 && __LW.field.ok; i++) await new Promise((r) => setTimeout(r, 20));
    const banner = document.getElementById('banner'); const okAfter = __LW.field.ok;
    T('play', () => __LW.play()); await new Promise((r) => setTimeout(r, 800)); T('pause', () => __LW.pause());
    T('grid', () => { __LW.quality.res = 96; __LW.schedule(4); }); await new Promise((r) => setTimeout(r, 200));
    T('setPalette', () => __LW.setPalette(__LW.paletteGroups[0].items[0])); T('setTheme', () => __LW.setTheme('dark'));
    T('resize', () => window.dispatchEvent(new Event('resize'))); T('phoneSync', () => __LW.layout.phone.sync());
    await T('fieldDigest', () => __LW.fieldDigest()); await T('readPixels', () => __LW.readPixels());
    await T('capturePicture', () => __LW.capture && __LW.capture.picture({ scale: 1 }));
    T('toggleUI', () => { __LW.keys.toggleUI(); __LW.keys.toggleUI(); }); await new Promise((r) => setTimeout(r, 300));
    return { okAfter, error: __LW.field.error, bannerShown: banner ? !banner.hidden : null, bannerTitle: banner ? banner.querySelector('h3').textContent : null, thrown, newErrs: window.__e.slice(e0).map(String).slice(0, 12), scheduled: __LW.stats.scheduled };`);
  R.errs = await ev('return (window.__e || []).map(String).slice(0, 20)');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT);
