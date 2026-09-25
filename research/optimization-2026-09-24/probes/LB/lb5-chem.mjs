/* lb5-chem.mjs — LANE LB · LB5 gate: CHEMISTRY RT's spectrum waits for itself, and the pole fit runs in the chem worker
 * with the same doubles.  A = .tmp/base-lab/ (frozen base), B = lab/.  Headless Firefox, µs timers.
 *   LW_PORT=8725 GD_PORT=5244 node research/optimization-2026-09-24/probes/LB/lb5-chem.mjs
 * 1 (B only) Object.is: a fresh module worker runs H₂O's δ-kick (y, κ 1e-3, Δt 0.01, unrestarted MMUT) for 3 000 and
 *   12 000 steps; chem.rt.fit over those windows vs response-fit.js's fitPoles on the SAME arrays in the page — every
 *   number and string of the answer compared with Object.is; and a refusing fit (κ = 0) → the same message.
 * 2 the CARD's own fit after a scripted run(3000): JSON of __LW.chem.fit() — A and B must print the same string.
 * 3 probe-f-chem's arms: steps/s and the worst main-thread stall (4 ms heartbeat) early, and at ~125 k samples. */
import fs from 'node:fs';
import { open as open0 } from '../../../../tools/gate/gatekit.mjs';
const open = async (url, o) => { for (let i = 0; ; i++) { try { return await open0(url, o); } catch (e) { if (i > 20 || !/EADDRINUSE/.test(String(e && e.message || e))) throw e; await new Promise((r) => setTimeout(r, 1000)); } } };
const PORT = process.env.LW_PORT || '8725';
const TREES = { A: '/.tmp/base-lab/', B: '/lab/' };
const WINDOW = `async (ms) => { const c = __LW.chem; const s0 = c.state().steps, t0 = performance.now(); const raf = []; let last = 0, on = true;
  const f = (t) => { if (last) raf.push(t - last); last = t; if (on) requestAnimationFrame(f); }; requestAnimationFrame(f);
  let beatLast = performance.now(), worst = 0; const mc = new MessageChannel(); mc.port1.onmessage = () => { const n = performance.now(); worst = Math.max(worst, n - beatLast); beatLast = n; if (on) setTimeout(() => mc.port2.postMessage(0), 4); }; mc.port2.postMessage(0);
  await new Promise((r) => setTimeout(r, ms)); on = false;
  raf.sort((a, b) => a - b); const st = c.state();
  return { stepsPerSec: +((st.steps - s0) / ((performance.now() - t0) / 1000)).toFixed(0), traceSamples: st.trace, fitWindow: st.fitWindow, fitted: !!st.fitted,
    rafMedian: +raf[raf.length >> 1].toFixed(1), rafMax: +raf[raf.length - 1].toFixed(1), rafOver100: raf.filter((x) => x > 100).length, worstStallMs: +worst.toFixed(1) }; }`;
async function tree(label) {
  const g = await open(`https://127.0.0.1:${PORT}${TREES[label]}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 1000, script: 900000, prefs: { 'privacy.reduceTimerPrecision': false } });
  const R = {};
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    if (label === 'B') R.objectIs = await g.ev(`const { chemAtoms, chemCharge } = await import('./chemview.js'); const { fitPoles } = await import('./response-fit.js');
      const w = new Worker(new URL('./mathworker.js', location.href), { type: 'module' }); let id = 0; const wait = new Map();
      w.onmessage = (e) => { const f = wait.get(e.data.id); if (f) { wait.delete(e.data.id); f(e.data); } };
      const call = (m) => new Promise((res) => { const k = ++id; wait.set(k, res); w.postMessage(Object.assign({ id: k }, m)); });
      const atoms = chemAtoms('H2O'), charge = chemCharge('H2O');
      const sp = await call({ op: 'chem.spectrum', atoms, basis: 'sto-3g', charge });
      const init = sp.roots.filter((k) => k.omega > 0.05 && k.omega < 1.6).slice(0, 6).map((k) => k.omega).sort((a, b) => a - b);
      await call({ op: 'chem.rt.init', atoms, basis: 'sto-3g', charge, dt: 0.01, integrator: 'mmut', kick: { axis: 'y', kappa: 1e-3 }, restartEvery: 0 });
      const trace = []; const grow = async (n) => { while (trace.length < n) { const r = await call({ op: 'chem.rt.run', steps: Math.min(1000, n - trace.length) }); for (const v of r.trace) trace.push(v); } };
      const fitWire = (F) => ({ poles: F.poles, certified: !!F.certified(1e-4), bound: F.bound, epsilon: F.epsilon, sigma: F.sigma, refusal: F.refusal ? F.refusal(1e-4) : null, raw: F.raw });
      const same = (a, b, path, bad) => { if (typeof a === 'number' || typeof b === 'number' || typeof a === 'string' || typeof a === 'boolean' || a === null || b === null) { if (!Object.is(a, b)) bad.push(path + ': ' + a + ' vs ' + b); return; }
        const ka = Object.keys(a), kb = Object.keys(b); if (ka.join() !== kb.join()) { bad.push(path + ' keys ' + ka + ' vs ' + kb); return; } for (const k of ka) same(a[k], b[k], path + '.' + k, bad); };
      const out = {};
      for (const n of [3000, 12000]) {
        await grow(n); const win = Float64Array.from(trace.slice(0, n)), tau = Math.max(10, (n + 1) * 0.01 / 12);
        const opts = { dt: 0.01, kappa: 1e-3, tau, init, wMin: 0.05, wMax: 1.6 };
        const t0 = performance.now(); const wr = await call({ op: 'chem.rt.fit', trace: win, cert: 1e-4, ...opts }); const workerMs = performance.now() - t0;
        const t1 = performance.now(); const lr = fitWire(fitPoles(Float64Array.from(win), opts)); const localMs = performance.now() - t1;
        delete wr.id; delete wr.op; const bad = []; same(wr, lr, 'fit', bad);
        out['n' + n] = { identical: bad.length === 0, bad: bad.slice(0, 5), poles: wr.poles.length, certified: wr.certified, bound: wr.bound, workerMs: +workerMs.toFixed(1), localMainThreadMs: +localMs.toFixed(1) };
      }
      const rf = await call({ op: 'chem.rt.fit', trace: Float64Array.from(trace.slice(0, 600)), cert: 1e-4, dt: 0.01, kappa: 0, tau: 20, init, wMin: 0.05, wMax: 1.6 });
      let localErr = null; try { fitPoles(Float64Array.from(trace.slice(0, 600)), { dt: 0.01, kappa: 0, tau: 20, init, wMin: 0.05, wMax: 1.6 }); } catch (e) { localErr = String(e && e.message || e); }
      out.refusal = { worker: rf.fitError, local: localErr, same: rf.fitError === localErr, noErrorKey: rf.error === undefined };
      w.terminate(); return out;`);
    await g.ev(`__LW.layout.reopen('chem', 'R'); await __LW.settle(); await __LW.chem.solve('H2O'); __LW.chem.setOn(true); await __LW.settle(); return 1;`);
    R.cardFit = await g.ev(`/* refit() refuses for 2 s after navigation (lastFit starts at 0): start past it */ while (performance.now() < 5000) await new Promise((r) => setTimeout(r, 100));
      const c = __LW.chem; c.setSpeed(10); await c.kick(); await c.run(3000);
      for (let i = 0; i < 400 && !c.fit(); i++) await new Promise((r) => setTimeout(r, 50));
      const f = c.fit(); return { fit: f ? JSON.stringify(f) : null, window: c.state().fitWindow, steps: c.state().steps };`);
    await g.ev(`window.__Fwin = ${WINDOW}; __LW.chem.reset(); await __LW.settle(); return 1;`);
    R.early = await g.ev(`__LW.chem.setSpeed(20); await __LW.chem.kick(); __LW.chem.setRun(true); return await __Fwin(8000);`);
    R.later = await g.ev(`__LW.chem.setRun(false); const t = performance.now(); await __LW.chem.run(120000); const grow = performance.now() - t; __LW.chem.setRun(true); const r = await __Fwin(8000); r.growMs = +grow.toFixed(0); __LW.chem.setRun(false); return r;`);
    R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
  } finally { await g.close(); }
  return R;
}
const A = await tree('A'), B = await tree('B');
const out = { objectIs: B.objectIs, cardFitSame: A.cardFit.fit === B.cardFit.fit && !!A.cardFit.fit, cardFitWindow: [A.cardFit.window, B.cardFit.window],
  early: { A: A.early, B: B.early }, later: { A: A.later, B: B.later }, errs: [A.errs, B.errs] };
fs.writeFileSync('research/optimization-2026-09-24/probes/LB/lb5-chem.json', JSON.stringify({ out, A, B }, null, 1));
console.log(JSON.stringify(out, null, 1));
