/* mathworker.js — the maths that must never sit on the pointer, run off the frame thread (wave 45).
 *
 * STATUS: DETERMINISTIC — every op here is the same pure function the rack calls on the main thread, imported from
 * the same modules, so an answer from the worker is bit-identical to the synchronous road (kick.js, well.js,
 * period.js); the worker only moves WHEN the work happens. Each op is a request/reply keyed by id:
 *   config  { id, ham, Z, radius }                 → the Hamiltonian selector mirrored (hydrogen with its Z, the oscillator, the BOX with its radius)
 *   warm    {}                                     → the SLAP tables built here, once, so the first bow pays nothing anywhere
 *   kick    { re, im, k, d, ham, Z, radius }       → the bow's slap e^{ik·x} on a snapshot of c(t): the kicked vector, ⟨p⟩ along d before and after
 *   packet  { x0, k, sigma, radius }               → the BOX bow: the Gaussian projected on the well's 91 eigenstates (well.js wellPacket)
 *   period  { energies, horizon }                  → the density's period / near-recurrence scan (period.js densityPeriod) for the transport's readout
 *   helium  { basis }                              → the selected Hylleraas variational solve
 *   ladder  { params }                             → the revival packet, scan and asymptotic prediction
 *   h2curve { Rmin, Rmax, count }                  → the correlated H₂ energy curves
 * The tabulated Hamiltonians (ATOM, QUARKONIUM) are not mirrored: the rack keeps their slap on the main thread.
 *
 * ── PARKING (wave 54, board #42) ────────────────────────────────────────────────────────────────────────────────
 * A hidden tab stops getting animation frames and has its main-thread timers clamped to 1 Hz.  A DEDICATED WORKER
 * gets NEITHER: it owns its own event loop on its own OS thread and runs at full speed with the tab in the
 * background, which is CPU and battery spent on a picture nobody is looking at.  So the rack messages both workers
 * to PARK when the page goes hidden and to RESUME when it comes back, and the rule for what parks is not "all of
 * it" — it is WHO ASKED:
 *
 *      work the USER asked for FINISHES (kick, packet, period — each is bounded, each has an answer someone wants);
 *      SPECULATIVE work WAITS (warm — a table built early only pays off while there is a finger on the instrument).
 *
 * A parked worker therefore queues `warm` and answers it on resume, in order, exactly once.  `park`, `resume` and
 * `stat` are bookkeeping and are answered while parked; they are also EXCLUDED from `busyMs`, so that counter is
 * the honest measure the gate asserts on — a worker that did no maths while hidden has the same busyMs it went in
 * with, and the number is falsifiable in both directions (issue a warm while hidden and it does not move; resume
 * and it does).
 */
import { setHamiltonian, setZ, HAMILTONIANS } from './hamiltonian.js';
import { applyKickAlong, momentumZ, warmStep } from './kick.js';
import { applyRotor } from './frontier.js';
import { rotorsToZ } from './kick.js';
import { wellPacket } from './well.js';
import { densityPeriod } from './period.js';
import { hylleraas, BASES } from './helium.js';
import { solveLadder } from './ladder-model.js';
import { h2CurveTable } from './h2ci.js';

function configure(m) {
  if (m.radius) HAMILTONIANS.well.setRadius(m.radius);
  if (m.ham) setHamiltonian(m.ham);
  if (m.Z) setZ(m.Z);
}
/** ⟨p⟩ along a unit direction: the register carried to z by the two rotors, then Heisenberg's p_z (as rack.js pAlongDir) */
function pAlong(re, im, d) {
  const r = Float64Array.from(re), i = Float64Array.from(im);
  for (const s of rotorsToZ(d)) applyRotor(r, i, { which: 'both', axis: s.axis, angle: s.angle });
  return momentumZ(r, i);
}
/* PARKED, and the speculative queue behind it.  busyMs counts only the maths, never the bookkeeping. */
let parked = false, busyMs = 0, jobs = 0, parks = 0, resumes = 0, parkedAt = 0, parkedMs = 0;
const held = [];                                   // speculative jobs that arrived while parked, in order
const SPECULATIVE = new Set(['warm']);             // everything else was asked for by a hand and is allowed to finish
const stat = () => ({ parked, busyMs: +busyMs.toFixed(3), jobs, parks, resumes, held: held.length,
  parkedMs: +(parkedMs + (parked ? Date.now() - parkedAt : 0)).toFixed(0) });
function run(m) {
  const t0 = performance.now();
  const r = work(m);
  busyMs += performance.now() - t0; jobs++;
  return r;
}
self.onmessage = (e) => {
  const m = e.data;
  if (m.op === 'park') { if (!parked) { parked = true; parks++; parkedAt = Date.now(); } self.postMessage(Object.assign({ id: m.id, op: m.op, ok: true }, stat())); return; }
  if (m.op === 'stat') { self.postMessage(Object.assign({ id: m.id, op: m.op, ok: true }, stat())); return; }
  if (m.op === 'resume') {
    if (parked) { parked = false; resumes++; parkedMs += Date.now() - parkedAt; }
    while (held.length) { const h = held.shift(); const r = run(h); self.postMessage(Object.assign({ id: h.id, op: h.op }, r.out), r.transfer); }
    self.postMessage(Object.assign({ id: m.id, op: m.op, ok: true }, stat())); return;
  }
  if (parked && SPECULATIVE.has(m.op)) { held.push(m); return; }     // it waits; the answer comes on resume, once
  const r = run(m);
  self.postMessage(Object.assign({ id: m.id, op: m.op }, r.out), r.transfer);
};
function work(m) {
  let out = {}, transfer = [];
  try {
    if (m.op === 'config') { configure(m); out = { ok: true }; }
    else if (m.op === 'warm') { configure(m); while (!warmStep(1e9)) { /* to the end */ } const one = new Float64Array(91).fill(0.1), zero = new Float64Array(91); pAlong(one, zero, [0, 0, 1]); out = { ok: true }; }   // the tables AND the dipole quadratures momentumZ caches (the first bow's other 100 ms)
    else if (m.op === 'kick') {
      configure(m);
      const re = Float64Array.from(m.re), im = Float64Array.from(m.im);
      const p0 = pAlong(re, im, m.d);
      applyKickAlong(re, im, m.k, m.d);
      const p1 = pAlong(re, im, m.d);
      out = { re, im, p0, p1 }; transfer = [re.buffer, im.buffer];
    } else if (m.op === 'packet') {
      HAMILTONIANS.well.setRadius(m.radius);
      const P = wellPacket(m.x0, m.k, m.sigma);
      out = { re: P.re, im: P.im, captured: P.captured }; transfer = [P.re.buffer, P.im.buffer];
    } else if (m.op === 'period') { out = densityPeriod(m.energies, { horizon: m.horizon || 2e4 }); }
    else if (m.op === 'helium') { if (!BASES[m.basis]) throw new Error('unknown helium basis ' + m.basis); out = { sol: hylleraas(BASES[m.basis]) }; }
    else if (m.op === 'ladder') { out = { result: solveLadder(m.params || {}) }; }
    else if (m.op === 'h2curve') { out = { result: h2CurveTable(m.Rmin, m.Rmax, m.count) }; }
    else out = { error: 'unknown op ' + m.op };
  } catch (err) { out = { error: String(err && err.message || err) }; transfer = []; }
  return { out, transfer };
}
