/* probe-f-extra.mjs — LANE F follow-ups in the gate's headless Firefox.
 *   LW_PORT=8721 GD_PORT=5236 node research/optimization-2026-09-24/probes/F/probe-f-extra.mjs
 * (a) restore(): how much of it is ladder.set → solveLadder (patched from outside: restore calls ladder.set by property)
 * (b) HELIUM: a BASIS change while HELIUM is ON — the frame's modesAt → helium.fieldModes → ensureSol (a sync solve)
 * (c) WIGNER open with the GOVERNOR ON (the shipped default): the reader law's park + 3 s re-probe, raw ms per call */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = {};
const ev = (s) => g.ev(s);
const step = async (name, body) => { try { R[name] = await ev(body); } catch (e) { R[name] = { probeError: String(e && e.message || e).slice(0, 400) }; } console.log(name, JSON.stringify(R[name]).slice(0, 900)); };
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  /* a stall meter: the longest gap between 2 ms MessageChannel heartbeats, plus rAF gaps, over a window */
  await ev(`window.__stall = async (ms, act) => { let last = performance.now(), worst = 0, on = true; const mc = new MessageChannel(); mc.port1.onmessage = () => { const n = performance.now(); worst = Math.max(worst, n - last); last = n; if (on) setTimeout(() => mc.port2.postMessage(0), 2); }; mc.port2.postMessage(0);
    const raf = []; let rl = 0; const f = (t) => { if (rl) raf.push(t - rl); rl = t; if (on) requestAnimationFrame(f); }; requestAnimationFrame(f);
    await new Promise((r) => setTimeout(r, 150)); const t0 = performance.now(); if (act) await act(); const actMs = performance.now() - t0;
    await new Promise((r) => setTimeout(r, ms)); on = false; raf.sort((a, b) => a - b);
    return { actMs: +actMs.toFixed(1), worstStallMs: +worst.toFixed(1), rafMax: raf.length ? +raf[raf.length - 1].toFixed(1) : null, rafMedian: raf.length ? +raf[raf.length >> 1].toFixed(1) : null }; }; return 1;`);
  await step('restoreBreakdown', `const L = __LW.ladder, s0 = L.set; let ladderMs = 0, calls = 0; L.set = function (p) { const t = performance.now(); const r = s0.call(this, p); ladderMs += performance.now() - t; calls++; return r; };
    const s = __LW.serialize(); const out = []; for (let i = 0; i < 3; i++) { ladderMs = 0; calls = 0; const t = performance.now(); __LW.restore(s); out.push({ restoreMs: +(performance.now() - t).toFixed(1), ladderSetMs: +ladderMs.toFixed(1), ladderCalls: calls }); }
    L.set = s0; return { runs: out, ladderParams: s.presentation.instruments && s.presentation.instruments.ladder };`);
  await step('projectOpenStall', `const p = __LW.layout.projects; p.save('laneF/one'); const r = await __stall(400, () => p.open('laneF/one')); p.remove('laneF/one'); return r;`);
  await step('heliumBasisWhileOn', `__LW.layout.reopen('helium', 'R'); await __LW.settle(); for (let i = 0; i < 200 && !__LW.helium.computed; i++) await new Promise((r) => setTimeout(r, 25));
    const sw = document.querySelector('.dev[data-id="helium"] .sw'); __LW.helium.setOn(true); await __LW.settle();
    const a = await __stall(600, () => { __LW.helium.setBasis('ten'); });
    const b = await __stall(600, () => { __LW.helium.setBasis('six'); });
    __LW.helium.setOn(false); return { toTen: a, toSix: b };`);
  await step('wignerGovernorOn', `for (const id of ['helium']) { const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d) d.classList.add('closed'); }
    __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.governor.on = true; __LW.layout.reopen('wigner', 'R'); __LW.windowActivity.presentOffscreen(true); await __LW.settle();
    const P = __LW.perf.profile; let v = P.wigner; const calls = []; Object.defineProperty(P, 'wigner', { configurable: true, enumerable: true, get() { return v; }, set(nv) { calls.push({ at: +performance.now().toFixed(0), ms: +((nv - 0.9 * v) / 0.1).toFixed(1) }); v = nv; } });
    __LW.play(); const t0 = performance.now(); const st = await __stall(10000); __LW.pause();
    return { calls: calls.map((c) => ({ t: c.at - Math.round(t0), ms: c.ms })).filter((c) => c.ms > 1), parked: __LW.governor.parked, probes: __LW.governor.probes, stall: st };`);
  R.errs = await ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync('research/optimization-2026-09-24/probes/F/probe-f-extra.json', JSON.stringify(R, null, 1));
console.log('wrote research/optimization-2026-09-24/probes/F/probe-f-extra.json');
