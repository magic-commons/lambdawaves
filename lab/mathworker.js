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
import { moleculeRHF, registerRecord, BASIS_FILES } from './rhf-molecule.js';
import { rpa } from './rpa-inspector.js';
import { fieldShells } from './molecular-field.js';
import { createRTHF } from './density.js';
import { spectrum, peaks } from './absorb.js';

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
/* THE SAME MODULE ON BOTH ROADS.  Every op above and below is an exported function, so rack.js can run it on the
   frame thread when the worker fails; the message handler is installed ONLY inside a real worker, so importing
   this file on the main thread (or in node, where `self` does not exist) takes nothing over. */
const IN_WORKER = typeof WorkerGlobalScope === 'function' && typeof self !== 'undefined' && self instanceof WorkerGlobalScope;
const CHEM = new Set(['chem.solve', 'chem.ground', 'chem.spectrum', 'chem.rt.init', 'chem.rt.run', 'chem.rt.reset', 'chem.rt.spectrum']);
const CHEM_BASIS = new Set(['chem.solve', 'chem.ground', 'chem.spectrum', 'chem.rt.init']);
/** the vendored BSE record, fetched ONCE per basis inside the worker; the ops themselves stay synchronous */
async function chemReady(m) {
  const basis = m.basis || 'sto-3g';
  if (m.record) { chemRegister(basis, m.record); return; }
  if (chemRecords.has(basis)) return;
  if (!BASIS_FILES[basis]) throw new Error(`chem: unknown basis '${basis}'`);
  const r = await fetch(new URL('./vendor/bse/' + BASIS_FILES[basis], import.meta.url));
  if (!r.ok) throw new Error(`chem: cannot load ${BASIS_FILES[basis]} (${r.status})`);
  chemRegister(basis, await r.json());
}
if (IN_WORKER) self.onmessage = (e) => {
  const m = e.data;
  if (m.op === 'park') { if (!parked) { parked = true; parks++; parkedAt = Date.now(); } self.postMessage(Object.assign({ id: m.id, op: m.op, ok: true }, stat())); return; }
  if (m.op === 'stat') { self.postMessage(Object.assign({ id: m.id, op: m.op, ok: true }, stat())); return; }
  if (m.op === 'resume') {
    if (parked) { parked = false; resumes++; parkedMs += Date.now() - parkedAt; }
    while (held.length) { const h = held.shift(); const r = run(h); self.postMessage(Object.assign({ id: h.id, op: h.op }, r.out), r.transfer); }
    self.postMessage(Object.assign({ id: m.id, op: m.op, ok: true }, stat())); return;
  }
  /* CHEMISTRY is work a hand asked for: it finishes parked or not, and it waits for the basis record first. */
  if (CHEM.has(m.op)) {
    (CHEM_BASIS.has(m.op) ? chemReady(m) : Promise.resolve()).then(
      () => { const r = run(m); self.postMessage(Object.assign({ id: m.id, op: m.op }, r.out), r.transfer); },
      (err) => self.postMessage({ id: m.id, op: m.op, error: String(err && err.message || err) }));
    return;
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
    else if (m.op === 'chem.solve') { out = chemSolve(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.ground') { out = chemGround(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.spectrum') { out = chemSpectrum(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.rt.init') { out = chemRtInit(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.rt.run') { out = chemRtRun(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.rt.reset') { out = chemRtReset(); transfer = chemTransfer(out); }
    else if (m.op === 'chem.rt.spectrum') { out = chemRtSpectrum(m); transfer = chemTransfer(out); }
    else out = { error: 'unknown op ' + m.op };
  } catch (err) { out = { error: String(err && err.message || err) }; transfer = []; }
  return { out, transfer };
}

/* ── CHEMISTRY (wave: the CHEMISTRY window) ──────────────────────────────────────────────────────────────────────
 * The molecule ops keep STATE INSIDE THE WORKER: one cached ground state and one live real-time propagator with its
 * own dipole trace, so `chem.rt.run` is a bounded request ("take 200 steps") and no message ever carries a whole
 * trajectory.  Every op is ALSO an exported synchronous function, because rack.js's makeWorker hands the call back
 * to the main-thread road whenever the worker fails to load, errors or times out.
 *   chem.solve        { atoms (bohr), basis, charge, record? }           → the RHF ground state + the RPA roots + the field spec
 *   chem.ground       { atoms, basis, charge, record? }                  → STAGE ONE: the ground state alone, about a second earlier
 *   chem.spectrum     { atoms, basis, charge }                           → STAGE TWO: the RPA roots and the TDA ladder of that ground state
 *   chem.rt.init      { atoms, basis, charge, dt, integrator, kick: { axis, kappa }, restartEvery } → the kicked t = 0 state
 *   chem.rt.run       { steps }                                          → Re D, the dipole trace of those steps, invariants
 *   chem.rt.reset     {}                                                 → back to the kicked t = 0 state, trace cleared
 *   chem.rt.spectrum  { dt, kappa, tau, wMin, wMax }                     → absorb.js's transform of the ACCUMULATED trace
 * The accumulated trace is capped at 2e6 samples (16 MB of f64); past the cap the run keeps stepping and says so.
 */
const TRACE_CAP = 2e6;
const chemRecords = new Map();
let chemSol = null, chemKey = '', rtState = null;

/** hand a parsed lab/vendor/bse record to the chemistry ops once; every chem op is then synchronous */
export function chemRegister(basis, record) {
  if (!BASIS_FILES[basis]) throw new Error(`chem: unknown basis '${basis}' — only ${Object.keys(BASIS_FILES).join(' and ')} are vendored`);
  chemRecords.set(basis, record); registerRecord(basis, record); return record;
}
const recordOf = (basis) => {
  const r = chemRecords.get(basis);
  if (!r) throw new Error(`chem: basis '${basis}' is not registered — call chemRegister(name, record) or pass { record }`);
  return r;
};
const AXIS = { x: 0, y: 1, z: 2 };
const reD = (engine) => { const D = engine.D; return Float32Array.from(D.re); };   // Re D in the AO basis, for the field
/** the converged ground state, its integrals and the report — cached on (atoms, basis, charge) */
function ensureSolve(m = {}) {
  const basis = m.basis || 'sto-3g';
  if (m.record) chemRegister(basis, m.record);
  if (!Array.isArray(m.atoms) || !m.atoms.length) throw new Error('chem: atoms = [{ Z, x, y, z }] in bohr');
  const atoms = m.atoms.map((a) => ({ Z: +a.Z, x: +a.x, y: +a.y, z: +a.z }));
  const charge = m.charge || 0, key = JSON.stringify([basis, charge, atoms.map((a) => [a.Z, a.x, a.y, a.z])]);
  if (chemSol && chemKey === key) return chemSol;
  const rec = recordOf(basis);
  /* THERE IS ONE INTEGRAL PASS AND IT TIMES ITSELF.  The card used to send `split: true` and this function then ran
     a SECOND, discarded, integral pass purely to have a number for it — 0.56 s of benzene's wall, and a warm second
     pass is not a measurement of the cold first one anyway.  `moleculeRHF` now reports `timings.integrals` from
     inside its own pass, and `ground` is the whole ground-state wall WITH that pass inside it: a subtracted timing
     is not a measurement, which is how the old split announced itself (the difference came out negative for H₂O). */
  const t = performance.now();
  const sol = moleculeRHF({ atoms, basis, charge, record: rec });
  const tGround = +(performance.now() - t).toFixed(2);
  const I = sol.integrals, n = I.n;
  const extent = atoms.reduce((s, a) => Math.max(s, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)), 0);
  const ground = { energy: sol.energy, Enuc: I.Enuc, nocc: sol.nocc, nAO: n, order: sol.basis.order,
    hash: sol.hash, basis, charge, electrons: sol.electrons, converged: sol.converged,
    dipole: sol.dipole, half: extent + 6,
    timings: { integrals: sol.timings.integrals, scf: tGround, rpa: null },
    stability: wireStability(sol.stability), solutions: (sol.solutions || []).map(wireSolution) };
  chemSol = { key, sol, I, ground, spectrum: null, R: null, atoms, basis, charge }; chemKey = key;
  return chemSol;
}
/* THE STABILITY VERDICT ON THE WIRE.  stabilityHessian's `lowestApB`/`lowestAmB` are lazy getters and a structured
   clone would READ them, putting two eigensolves of a 315 × 315 back on every benzene reply; the verdict itself is
   two Cholesky factorisations.  So the lowest eigenvalues are sent only when the verdict FAILS, which is when they
   are the evidence, and `null` says "not computed" rather than "zero". */
const wireHessian = (h) => (h ? { nOv: h.nOv, minimum: h.minimum, positiveDefinite: h.positiveDefinite,
  lowestApB: h.minimum ? null : h.lowestApB, lowestAmB: h.minimum ? null : h.lowestAmB } : null);
const wireStability = (s) => (s ? { ...s, hessian: wireHessian(s.hessian) } : null);
const wireSolution = (s) => ({ ...s, hessian: wireHessian(s.hessian) });
/** the RPA/TDA spectrum of the cached ground state, computed once and kept — X, Y and the TDA vectors stay HERE */
function ensureSpectrum(m = {}) {
  const c = ensureSolve(m);
  if (c.spectrum) return c;
  const { sol, I } = c, t = performance.now();
  const R = rpa({ S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc });
  const tRpa = +(performance.now() - t).toFixed(2);
  c.R = R; c.ground.timings.rpa = tRpa;
  c.spectrum = {
    roots: R.roots.map((r) => ({ omega: r.omega, omegaTDA: r.omegaTDA, f: r.f, mu: r.mu,
      dominant: r.dominant.slice(0, 4).map((d) => ({ i: d.i, a: d.a, x: d.x, y: d.y })) })),
    /* THE TDA LADDER IS ITS OWN LIST, ascending in its own ω: roots[k].omegaTDA is the k-th TDA root and NOT the
       partner of RPA root k (benzene: RPA root 2 is bright, TDA root 2 is dark).  The card draws from this list. */
    tda: R.tda.map((r) => ({ omega: r.omega, f: r.f, mu: r.mu })) };
  return c;
}
/** chem.solve — THE ARRAYS ARE BUILT FRESH EVERY CALL, never cached: the reply TRANSFERS their buffers, so a
    cached report would come back detached (zero-length) the second time the same molecule was asked for. */
export function chemSolve(m = {}) {
  const c = ensureSpectrum(m);
  return { ...c.ground, ...c.spectrum, stage: 'full', timings: { ...c.ground.timings },
    eps: Float64Array.from(c.sol.orbitalEnergies),
    C: Float64Array.from(c.sol.C), D: Float64Array.from(c.sol.D), shells: fieldShells(c.sol.basis) };
}
/** chem.ground — STAGE ONE: the ground state alone, publishable about a second before the spectrum exists.
    `timings` is COPIED, not shared: the cached block gains its rpa entry later and a reply must not change. */
export function chemGround(m = {}) {
  const c = ensureSolve(m);
  return { ...c.ground, stage: 'ground', timings: { ...c.ground.timings },
    eps: Float64Array.from(c.sol.orbitalEnergies),
    C: Float64Array.from(c.sol.C), D: Float64Array.from(c.sol.D), shells: fieldShells(c.sol.basis) };
}
/** chem.spectrum — STAGE TWO: the roots for the cached ground state (it is re-solved if the cache moved on) */
export function chemSpectrum(m = {}) {
  const c = ensureSpectrum(m);
  return { ...c.spectrum, stage: 'spectrum', hash: c.ground.hash, timings: { ...c.ground.timings } };
}
/** the full X, Y and TDA vectors of one root — they stay in the worker; nothing ships them by default */
export function chemRootVectors(k) {
  if (!chemSol || !chemSol.R) throw new Error('chem: no spectrum in this worker yet');
  const r = chemSol.R.roots[k | 0];
  if (!r) throw new Error(`chem: no root ${k}`);
  return { omega: r.omega, X: r.X, Y: r.Y, XTDA: r.XTDA, pairs: chemSol.R.pairs, nocc: chemSol.R.nocc, nvir: chemSol.R.nvir };
}
/** chem.rt.init — runs (or reuses) the solve, builds the propagator, applies the δ-kick along the chosen axis */
export function chemRtInit(m = {}) {
  const { sol, I } = ensureSolve(m), n = I.n;
  const kick = m.kick || {}, axis = kick.axis || 'z', kappa = kick.kappa === undefined ? 1e-3 : +kick.kappa;
  if (AXIS[axis] === undefined) throw new Error(`chem: kick axis must be 'x', 'y' or 'z', got '${axis}'`);
  const dt = m.dt === undefined ? 0.01 : +m.dt, integrator = m.integrator || 'mmut';
  if (integrator !== 'mmut' && integrator !== 'magnus2') throw new Error(`chem: integrator must be 'mmut' or 'magnus2', got '${integrator}'`);
  if (!(dt > 0)) throw new Error('chem: dt must be positive');
  /* 0 or null on the wire is the UNRESTARTED leapfrog (lab/density.js normalises it, once).  The default here is
     still 50, because that is what an old caller that says nothing meant; the card asks for 0 and says so. */
  const restartEvery = m.restartEvery === undefined ? 50 : (m.restartEvery === null ? 0 : m.restartEvery | 0);
  const engine = createRTHF({ n, S: I.S, h: I.h, eri: I.eri, Z: I.Z, mu: [I.X, I.Y, I.Z], Enuc: I.Enuc,
    nuclearDipole: I.nuclearDipole[AXIS[axis]], nElectrons: sol.nElectrons, D0: sol.D, dt, integrator, restartEvery });
  engine.kickAlong(axis, kappa);
  const trace = new Float64Array(4096); trace[0] = engine.dipoleAlong(axis);
  const ob = engine.observables();
  rtState = { engine, axis, kappa, dt, integrator, restartEvery: engine.restartEvery, n, trace, nTrace: 1, steps: 0, capped: false,
    init: { atoms: m.atoms, basis: m.basis, charge: m.charge, dt, integrator, kick: { axis, kappa }, restartEvery },
    E0: ob.fieldFreeTotal };
  return { ok: true, t: 0, D_re: reD(engine), electrons: ob.electrons, idempotency: ob.idempotency,
    E0: ob.fieldFreeTotal, nAO: n, dt, integrator, kick: { axis, kappa },
    /* the policy IN FORCE, from the engine, not the request: the card prints this and never its own intention */
    restartEvery: engine.restartEvery, restartPolicy: engine.restartPolicy, sinceRestart: engine.sinceRestart };
}
/** the accumulated trace, grown by doubling to the cap */
function traceAppend(v) {
  if (rtState.nTrace >= TRACE_CAP) { rtState.capped = true; return; }
  if (rtState.nTrace >= rtState.trace.length) {
    const grown = new Float64Array(Math.min(TRACE_CAP, rtState.trace.length * 2));
    grown.set(rtState.trace.subarray(0, rtState.nTrace)); rtState.trace = grown;
  }
  rtState.trace[rtState.nTrace++] = v;
}
/** chem.rt.run */
export function chemRtRun(m = {}) {
  if (!rtState) throw new Error('chem: chem.rt.run before chem.rt.init');
  const steps = Math.max(1, Math.min(200000, (m.steps | 0) || 1)), t0 = performance.now();
  const out = new Float64Array(steps);
  for (let k = 0; k < steps; k++) {
    rtState.engine.step();
    out[k] = rtState.engine.dipoleAlong(rtState.axis);        // Tr(D M_q) only: observables() would rebuild the Fock matrix
    traceAppend(out[k]);
  }
  rtState.steps += steps;
  const ms = performance.now() - t0, ob = rtState.engine.observables();
  return { t: rtState.engine.t, D_re: reD(rtState.engine), trace: out, electrons: ob.electrons,
    idempotency: ob.idempotency, energy: ob.fieldFreeTotal, steps: rtState.steps, samples: rtState.nTrace,
    capped: rtState.capped, msPerStep: +(ms / steps).toFixed(4),
    restartEvery: rtState.restartEvery, restartPolicy: ob.restartPolicy, sinceRestart: ob.sinceRestart };
}
/** chem.rt.reset — the kicked t = 0 state again, trace cleared */
export function chemRtReset() {
  if (!rtState) throw new Error('chem: chem.rt.reset before chem.rt.init');
  return chemRtInit(rtState.init);
}
/** chem.rt.spectrum — absorb.js's damped sine transform of the ACCUMULATED trace, plus its peaks */
export function chemRtSpectrum(m = {}) {
  if (!rtState || rtState.nTrace < 8) throw new Error('chem: chem.rt.spectrum needs an accumulated trace — run some steps first');
  const dt = m.dt === undefined ? rtState.dt : +m.dt, kappa = m.kappa === undefined ? rtState.kappa : +m.kappa;
  const tau = m.tau === undefined ? 500 : m.tau;
  const sp = spectrum(rtState.trace.subarray(0, rtState.nTrace), { dt, kappa, tau, wMin: m.wMin, wMax: m.wMax, dw: m.dw });
  return { omega: Float64Array.from(sp.omega), S: Float64Array.from(sp.S), ImAlpha: Float64Array.from(sp.ImAlpha),
    peaks: peaks(sp, { fraction: m.fraction }), samples: rtState.nTrace, axis: rtState.axis, dt, kappa, tau };
}
/** every top-level typed array of a reply, so the structured clone moves the bytes instead of copying them */
const chemTransfer = (out) => Object.values(out).filter((v) => v && v.buffer instanceof ArrayBuffer).map((v) => v.buffer);
