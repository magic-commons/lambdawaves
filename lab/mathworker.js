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
 *   ladder  { params }                             → the revival packet, scan and asymptotic prediction
 *   lattice.solve { n, re, im }                    → LATTICE's eigenpairs { E, re, im } (lattice-model.js: real → eigSymQL, Hermitian → hermitianEigen)
 *   central.solve { preset, params }               → CENTRAL's solve (central.js solveCentral): { E, rTab, r99, table, rows, bound, oracle, ms }
 *   gas.stats { radius, t, re0, im0, t0 }          → the AXIAL GAS's norm, ⟨z⟩, σ_z, ⟨r⟩ at t (gas.js stats) — SPECTRUM's readout (K5w)
 *   flow.balance { shells, N, half, Re, Im, dRe, solve } → BALANCED FLOW's sampled defect and its repair ∇φ (flow-balance.js)
 *   chem.esp     { shells, N, half, D, atoms }   → THE POTENTIAL's N³ volume Φ(r) (0.6.5 X1, chemEsp below), on the cards queue
 *   export  { fmt, texels, N, half, rhoMax, … }    → FILE › EXPORT SHAPE / GRID (wave 134): the field's grid decoded, marched and written as
 *                                                  one file (export3d.js buildFile) — the bytes come back, transferred; asked for, so it finishes parked
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
import { setHamiltonian, setZ, setMu, HAMILTONIANS } from './hamiltonian.js';
import { applyKickAlong, momentumZ, warmStep } from './kick.js';
import { applyRotor } from './frontier.js';
import { rotorsToZ } from './kick.js';
import { wellPacket } from './well.js';
import { densityPeriod } from './period.js';
import { solveLadder } from './ladder-model.js'; import { solveLattice } from './lattice-model.js'; import { solveCentral } from './central.js';
import { moleculeRHF, registerRecord, BASIS_FILES } from './rhf-molecule.js';
import { rpa } from './rpa-inspector.js';
import { canonicaliseSpectrum, dipoleFamily, coordinateFamily } from './canon-gauge.js';
import { sin2Pulse } from './modrive.js';
import { eigSym } from './h2ci.js';
import { fieldShells } from './molecular-field.js';
import { createRTHF, fieldOf } from './density.js';
import { spectrum, peaks } from './absorb.js';
import { fitPoles } from './response-fit.js';
import { createGas } from './gas.js';
import { buildFile } from './export3d.js';
import { namesOf } from './names.js';
import { basisFrom, rinvMatrix, ELEMENT, oneElectron } from './md.js';
import { flowBalance } from './flow-balance.js'; import { createFlow } from './molecular-flow.js';
import { validateRecord, decodeRecord } from './library.js';
import { BASIS, radial } from './hydrogen.js';

function configure(m) {
  if (m.radius) HAMILTONIANS.well.setRadius(m.radius);
  if (m.ham) setHamiltonian(m.ham);
  if (m.Z) setZ(m.Z); if (m.mu) setMu(m.mu);
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
  parkedMs: +(parkedMs + (parked ? Date.now() - parkedAt : 0)).toFixed(0), solverCalls });
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
const CHEM = new Set(['chem.solve', 'chem.ground', 'chem.open', 'chem.spectrum', 'chem.states', 'chem.state.vectors', 'chem.drive.init', 'chem.drive.run', 'chem.drive.set', 'chem.drive.coupling', 'h.drive.init', 'h.drive.run', 'h.drive.set', 'chem.rt.init', 'chem.rt.run', 'chem.rt.reset', 'chem.rt.spectrum', 'chem.rt.fit', 'chem.vib.frames']);
const CHEM_BASIS = new Set(['chem.solve', 'chem.ground', 'chem.open', 'chem.spectrum', 'chem.states', 'chem.rt.init', 'chem.vib.frames']);
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
    else if (m.op === 'ladder') { out = { result: solveLadder(m.params || {}) }; }
    else if (m.op === 'lattice.solve') { out = { result: solveLattice(m) }; }
    else if (m.op === 'central.solve') { out = { result: solveCentral(m.preset, m.params) }; }   // 0.8.0 G1: CENTRAL's 21 rows, table, bound count and oracle
    else if (m.op === 'gas.stats') { out = gasStats(m); }
    else if (m.op === 'export') { out = buildFile(m); transfer = out.bytes && out.bytes.buffer ? [out.bytes.buffer] : []; }   // an NPZ is a Blob (the kit's StoredZip): cloned, not transferred
    else if (m.op === 'chem.solve') { out = chemSolve(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.ground') { out = chemGround(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.open') { out = chemOpen(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.spectrum') { out = chemSpectrum(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.states') { out = chemStates(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.state.vectors') { out = chemStateVectors(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.drive.init') { out = chemDriveInit(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.drive.run') { out = chemDriveRun(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.drive.set') { out = chemDriveSet(m); }
    else if (m.op === 'chem.drive.coupling') { out = chemDriveCoupling(m); }
    else if (m.op.startsWith('h.drive.')) { out = SONG[m.op.slice(8)](m); transfer = chemTransfer(out); }   // 0.6.4 S1 THE SONG: init · run · set
    else if (m.op === 'chem.rt.init') { out = chemRtInit(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.rt.run') { out = chemRtRun(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.rt.reset') { out = chemRtReset(); transfer = chemTransfer(out); }
    else if (m.op === 'chem.rt.spectrum') { out = chemRtSpectrum(m); transfer = chemTransfer(out); }
    else if (m.op === 'chem.rt.fit') { out = chemRtFit(m); }
    else if (m.op === 'chem.vib.frames') { out = chemVibFrames(m); transfer = chemTransfer(out); }   // 0.7.0 V1 THE MODES: K phase samples of one normal mode
    else if (m.op === 'chem.esp') { out = chemEsp(m); transfer = [out.phi.buffer]; }   // THE POTENTIAL's volume (0.6.5 X1), on the cards queue
    else if (m.op === 'flow.balance') { out = flowBalance(m); transfer = out.gx ? [out.gx.buffer, out.gy.buffer, out.gz.buffer] : []; }   // BALANCED FLOW's repair (flow-balance.js), on the cards queue
    else out = { error: 'unknown op ' + m.op };
  } catch (err) { out = err instanceof Refused ? { refused: err.message } : { error: String(err && err.message || err) }; transfer = []; }
  return { out, transfer };
}

/* ── THE AXIAL GAS'S READOUT (optimization 2026-09-24, K5w · AUDIT-B FB1, AUDIT-F F11, SOL-REVIEW K5) ──────────────
 * SPECTRUM's `⟨z⟩ · σ_z` line is gas.js stats(t): ψ on a 100 × 80 grid over all 256 modes, 8–17 ms, and it ran on the
 * frame thread every 6th CPU tick while the gas played.  Here it is the SAME stats(), unchanged, on this worker's own
 * gas: built lazily at the posted radius and marked stale when the radius changes (K4's setRadius), so its tables come
 * from the same expressions over the same radius — the same f64 — and the page's register (c(t₀), t₀), copied by the
 * message, is evolved to t by the same at().  The answer is the page's object, bit for bit, one round trip later.  The
 * factorisation by l (26×) was REJECTED for this: it flips a printed `-0.00`/`0.00` at symmetric instants (PLAN §9). */
let gasW = null;
export function gasStats(m = {}) {
  if (!gasW) gasW = createGas(m.radius, { warm: false });
  else gasW.setRadius(m.radius);
  gasW.load(m);
  return { stats: gasW.stats(m.t, m.stride) };
}

/* ── CHEMISTRY (wave: the CHEMISTRY window) ──────────────────────────────────────────────────────────────────────
 * The molecule ops keep STATE INSIDE THE WORKER: one cached ground state and one live real-time propagator with its
 * own dipole trace, so `chem.rt.run` is a bounded request ("take 200 steps") and no message ever carries a whole
 * trajectory.  Every op is ALSO an exported synchronous function, because rack.js's makeWorker hands the call back
 * to the main-thread road whenever the worker fails to load, errors or times out.
 *   chem.solve        { atoms (bohr), basis, charge, record? }           → the RHF ground state + the RPA roots + the field spec
 *   chem.ground       { atoms, basis, charge, record? }                  → STAGE ONE: the ground state alone, about a second earlier
 *   chem.open         { lib, hash, basis }                               → THE RECORD ROAD (0.4.0 S4a): chem.ground's reply from a library record, no solver call
 *   chem.spectrum     { atoms, basis, charge }                           → STAGE TWO: the RPA roots and the TDA ladder of that ground state
 *   chem.states       { atoms, basis, charge }                           → the STATE REGISTER's ladder: the TDA states in the CANONICAL GAUGE (ω, f, μ, cluster, pivot) + the MO position matrices
 *   chem.state.vectors { ks: [K…] }                                     → the canonical X^K amplitude vectors of those states, nocc·nvir numbers each
 *   chem.drive.init   { pol, omega, e0, envelope, duration, phase, dt, t0, lanes } → the TD-CIS drive on the FULL singles space, at t0
 *   chem.drive.run    { to, maxSteps }                                  → steps the driven state to clock time `to` (either direction): c₀, Z, populations, norm
 *   chem.drive.set    { e0, omega, phase }                              → the live knobs of a running drive — a modulation target must not cost a re-init
 *   chem.rt.init      { atoms, basis, charge, dt, integrator, kick: { axis, kappa }, restartEvery } → the kicked t = 0 state
 *   chem.rt.run       { steps }                                          → Re D, the dipole trace of those steps, invariants
 *   chem.rt.reset     {}                                                 → back to the kicked t = 0 state, trace cleared
 *   chem.rt.spectrum  { dt, kappa, tau, wMin, wMax }                     → absorb.js's transform of the ACCUMULATED trace
 *   chem.rt.fit       { trace, dt, kappa, tau, init, wMin, wMax, cert }  → response-fit.js's poles + certificate of the CARD's fit window
 * The accumulated trace is capped at 2e6 samples (16 MB of f64); past the cap the run keeps stepping and says so.
 */
const TRACE_CAP = 2e6;
const chemRecords = new Map();
let chemSol = null, chemKey = '', rtState = null, solverCalls = 0;   // every moleculeRHF and rpa this worker ran (stat): a record's open adds none
const recordOnlyIds = new Map();   // S4a-VERIFY B1: key → record id for every record opened here whose caps forbid a live solve (past the cap); a cache miss on one is a REFUSAL, never a solve
/** a REFUSAL is an answer, `{ refused: sentence }`, never `error` (which would send rack.js to the frame thread's road) */
class Refused extends Error {}
const OPEN = 'open shell: RT, TDA, the drive and the register are closed-shell roads in this cut (0.7.1 UHF)';
/** 0.7.3 K1: an open shell says OPEN; an RKS LDA solve says the road's own sentence (`lda`) — RT, TDA, the drive, the register and VIBRATE are RHF's operators */
const standDown = (g, lda) => { if (g.model) throw new Refused(g.model === 'UHF' ? OPEN : lda); };
export const chemSolverCalls = () => solverCalls;
const keyOf = (basis, charge, atoms) => JSON.stringify([basis, charge, atoms.map((a) => [a.Z, a.x, a.y, a.z])]);

/** hand a parsed lab/vendor/bse record to the chemistry ops once; every chem op is then synchronous */
export function chemRegister(basis, record) {
  if (!BASIS_FILES[basis]) throw new Error(`chem: unknown basis '${basis}' — only ${Object.keys(BASIS_FILES).join(', ')} are vendored`);
  chemRecords.set(basis, record); registerRecord(basis, record); return record;
}
const recordOf = (basis) => {
  const r = chemRecords.get(basis);
  if (!r) throw new Error(`chem: basis '${basis}' is not registered — call chemRegister(name, record) or pass { record }`);
  return r;
};
const AXIS = { x: 0, y: 1, z: 2 };
const reD = (engine) => { const D = engine.D; return Float32Array.from(D.re); };   // Re D in the AO basis, for the field
/* Re D for the field AND Im D for FLOW, from ONE build of D = X P X†.  NOTE THE CONVENTION: density.js's D is the
   quantum chemist's D_μν = Σ c_μ c̄_ν, the TRANSPOSE-CONJUGATE of the ⟨a†_μ a_ν⟩ the flow evaluator is written in, so the
   card negates this imaginary part before handing it over (tests/molecular-flow.test.mjs holds the sign). */
const bothD = (engine) => { const D = engine.D; return { D_re: Float32Array.from(D.re), D_im: Float32Array.from(D.im) }; };
/** the converged ground state, its integrals and the report — cached on (atoms, basis, charge).  `live`: the caller needs the
    integrals (TDHF), which a library record never carries — where its caps say a live solve is offered that is THIS solve, now
    (the record's spectrum and states are kept: cached = fresh), and past the cap it is a sentence. */
function ensureSolve(m = {}, live = false) {
  const basis = m.basis || 'sto-3g';
  if (m.record) chemRegister(basis, m.record);
  if (!Array.isArray(m.atoms) || !m.atoms.length) throw new Error('chem: atoms = [{ Z, x, y, z }] in bohr');
  const atoms = m.atoms.map((a) => ({ Z: +a.Z, x: +a.x, y: +a.y, z: +a.z }));
  const charge = m.charge || 0, mult = m.multiplicity || 1, uhf = mult > 1 || m.model === 'uhf', lda = m.model === 'lda', base = keyOf(basis, charge, atoms);
  const key = base + (uhf ? `|UHF ${mult}` : lda ? '|LDA' : '');   // 0.7.1: an open shell is another key; 0.7.3: so is an RKS LDA solve, so RHF and LDA never share the cache
  if (lda && uhf) throw new Refused('LDA is closed-shell in this cut: an open shell is UHF (no UKS until a later cut)');
  if (chemSol && chemKey === key && (chemSol.I || !live)) return chemSol;
  const from = chemSol && chemKey === key ? chemSol : null;
  if (from && !from.record.caps.tdhf) throw new Refused(`${from.record.id} is past the live cap: it opens only from its record, which stores no electron-repulsion integrals, so TDHF (KICK, RUN) cannot run on it`);
  if (!from && (m.recordOnly || recordOnlyIds.has(base))) throw new Refused(`${recordOnlyIds.get(base) || 'this molecule'} is past the live cap and opens only from its record, which is no longer the worker's current molecule (another open replaced it) — open it again; nothing is solved live`);
  const rec = recordOf(basis);
  solverCalls++;
  /* THERE IS ONE INTEGRAL PASS AND IT TIMES ITSELF.  The card used to send `split: true` and this function then ran
     a SECOND, discarded, integral pass purely to have a number for it — 0.56 s of benzene's wall, and a warm second
     pass is not a measurement of the cold first one anyway.  `moleculeRHF` now reports `timings.integrals` from
     inside its own pass, and `ground` is the whole ground-state wall WITH that pass inside it: a subtracted timing
     is not a measurement, which is how the old split announced itself (the difference came out negative for H₂O). */
  const t = performance.now();
  const sol = moleculeRHF({ atoms, basis, charge, record: rec, ...(uhf ? { multiplicity: mult, model: 'uhf' } : lda ? { model: 'lda' } : {}) });
  const tGround = +(performance.now() - t).toFixed(2);
  const I = sol.integrals, n = I.n;
  const extent = atoms.reduce((s, a) => Math.max(s, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)), 0);
  const ground = { energy: sol.energy, Enuc: I.Enuc, nocc: sol.nocc, nAO: n, order: sol.basis.order,
    hash: sol.hash, basis, charge, electrons: sol.electrons, converged: sol.converged,
    dipole: sol.dipole, half: extent + 6,
    timings: { integrals: sol.timings.integrals, scf: tGround, rpa: null },
    stability: wireStability(sol.stability), solutions: (sol.solutions || []).map(wireSolution), ...(uhf ? { model: 'UHF', multiplicity: mult, s2: sol.s2, nBeta: sol.nBeta } : {}),
    ...(lda ? { model: 'RKS LDA', exc: sol.exc, intRho: sol.intRho, gridPoints: sol.gridPoints, gridMs: sol.gridMs, iterations: sol.iterations } : {}) };
  /* THE NAMES (0.4.0 S1) ride with the ground: computed HERE, from the solve's own S, C and ε (S never leaves the
     worker), against the library's declared group (`m.symmetry`); ≤ 10 ms for benzene, timed in the reply. */
  ground.names = namesOf(sol, atoms, m.symmetry); ground.timings.names = ground.names.ms;
  chemSol = { key, sol, I, ground, spectrum: from ? from.spectrum : null, R: null, states: from ? from.states : null, atoms, basis, charge, record: from ? from.record : null }; chemKey = key;
  driveState = null;                                                          // a drive belongs to the molecule it was built on
  return chemSol;
}
/** chem.open — THE RECORD ROAD (0.4.0 S4a · PLAN B2): a library record (lab/library.js) fills the one solve cache and the reply is
    chem.ground's own, so no window downstream changes.  No solver runs — `solverCalls` (stat) does not move.  Its `caps` say what
    it answers: the RPA sticks always, STATES when it stores the CIS ladder, TDHF only where a live solve is offered (above). */
export function chemOpen(m = {}) {
  const t = performance.now(), r = m.lib, bad = validateRecord(r);              // `lib`: `record` is the BSE basis record on every chem op
  if (bad.length) throw new Refused(`the record ${(r && r.id) || '?'} failed validation (${bad.join('; ')}) and was not opened`);
  const R = decodeRecord(r), atoms = R.atoms.map((a) => ({ Z: +a.Z, x: +a.x, y: +a.y, z: +a.z })), b = basisFrom(atoms, recordOf(R.basis), { cart: true });
  if (b.hash !== R.ground.hash) throw new Refused(`the record ${r.id} was made against another ${R.basis} basis file and was not opened`);
  chemSol = { key: keyOf(R.basis, R.charge, atoms), sol: { C: R.C, D: R.D, orbitalEnergies: R.eps, nocc: R.ground.nocc, basis: b }, I: null,
    ground: { ...R.ground, timings: { integrals: null, scf: null, rpa: null, names: null, open: +(performance.now() - t).toFixed(2) } },
    spectrum: R.spectrum, R: null, states: R.states, atoms, basis: R.basis, charge: R.charge, record: { id: r.id, hash: m.hash || null, caps: r.caps } };
  chemKey = chemSol.key; driveState = null;
  if (!(r.caps && r.caps.tdhf)) recordOnlyIds.set(chemSol.key, r.id);     // S4a-VERIFY B1
  return { ...chemGround({ atoms, basis: R.basis, charge: R.charge }), record: chemSol.record, ...(r.caps.rpa ? {} : { roots: [], tda: [] }) };   // S4c: a frontier record answers whole — it has no spectrum to wait for
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
  standDown(c.ground, "TDA and the register stand down under RKS LDA: their operators are RHF's");
  if (c.spectrum) return c;
  if (!c.I) throw new Refused(`${c.record.id}'s record carries its frontier orbitals only: it stores no spectrum, and past the cap none is solved`);
  const { sol, I } = c, t = performance.now(); solverCalls++;
  const R = rpa({ S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc });
  const tRpa = +(performance.now() - t).toFixed(2);
  c.R = R; c.ground.timings.rpa = tRpa;
  c.states = canonicalStates(sol, I, R);
  c.spectrum = {
    roots: R.roots.map((r) => ({ omega: r.omega, omegaTDA: r.omegaTDA, f: r.f, mu: r.mu,
      dominant: r.dominant.slice(0, 4).map((d) => ({ i: d.i, a: d.a, x: d.x, y: d.y })) })),
    /* THE TDA LADDER IS ITS OWN LIST, ascending in its own ω: roots[k].omegaTDA is the k-th TDA root and NOT the
       partner of RPA root k (benzene: RPA root 2 is bright, TDA root 2 is dark).  The card draws from this list. */
    tda: R.tda.map((r, k) => ({ omega: r.omega, f: c.states.f[k], mu: [c.states.mu[3 * k], c.states.mu[3 * k + 1], c.states.mu[3 * k + 2]] })) };
  return c;
}
/* THE STATE REGISTER'S LADDER, IN THE CANONICAL GAUGE (REGISTER-WINDOW-SPEC §7, proving/LEDGER.md Definition 8).
 * An eigensolver hands back an ARBITRARY orthonormal basis inside a degenerate level, so "TDA root 4" is not an
 * identity: benzene's bright E₁u pair comes back rotated by whatever the round-off decided, and a saved register
 * would mean something else after the next solve.  canon-gauge.js fixes every cluster by ordered functionals (the
 * lab dipole axes x, y, z, then the amplitude coordinates) with a positive pivot — a function of the cluster's SPAN
 * only — so the pair lands on (μ, 0, 0) and (0, μ, 0), lane "x" and lane "y", on every solve and with every solver.
 * The shipped `tda` list draws its f and μ from HERE, so the card's sticks and the register's lanes agree; ω and
 * the f-sum of a cluster are gauge-independent, which is why no existing number moves. */
function canonicalStates(sol, I, R) {
  const n = I.n, nocc = sol.nocc, nvir = n - nocc, d = nocc * nvir, C = sol.C, tda = R.tda;
  const rMO = [I.X, I.Y, I.Z].map((M) => {
    const half = new Float64Array(n * n), T = new Float64Array(n * n);
    for (let u = 0; u < n; u++) for (let q = 0; q < n; q++) { let s = 0; for (let w = 0; w < n; w++) s += M[u * n + w] * C[w * n + q]; half[u * n + q] = s; }
    for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) { let s = 0; for (let u = 0; u < n; u++) s += C[u * n + p] * half[u * n + q]; T[p * n + q] = s; }
    return T;
  });
  const X0 = new Float64Array(d * d), omega = new Float64Array(d);
  tda.forEach((r, k) => { X0.set(r.X, k * d); omega[k] = r.omega; });
  const dip = dipoleFamily(rMO, n, nocc, nvir);
  const canon = canonicaliseSpectrum({ X: X0, omega, d, families: [dip, coordinateFamily(d)] });
  const X = canon.X, mu = new Float64Array(3 * d), f = new Float64Array(d), cluster = new Int32Array(d), size = new Int32Array(d), pivot = new Float64Array(d);
  for (let k = 0; k < d; k++) {
    let m2 = 0;
    for (let q = 0; q < 3; q++) { let s = 0; for (let p = 0; p < d; p++) s += dip.rows[q * d + p] * X[k * d + p]; mu[3 * k + q] = s; m2 += s * s; }
    f[k] = (2 / 3) * omega[k] * m2;
  }
  canon.clusters.forEach(([s0, e0], ci) => {
    let least = Infinity; for (const pv of canon.pivots[ci].pivots) least = Math.min(least, pv.norm);
    for (let k = s0; k < e0; k++) { cluster[k] = ci; size[k] = e0 - s0; pivot[k] = least; }
  });
  return { n, nocc, nvir, d, omega, f, mu, cluster, size, pivot, X, rMO };
}
/** chem.states — the register's ladder.  Fresh arrays every call (the reply transfers them); X stays in the worker. */
export function chemStates(m = {}) {
  const c = ensureSpectrum(m), st = c.states;
  if (!st) throw new Refused(`${c.record.id}'s record stores no CIS states (its caps), so the STATES ladder is not offered for it`);
  const n = st.n, rMO = new Float64Array(3 * n * n);
  for (let q = 0; q < 3; q++) rMO.set(st.rMO[q], q * n * n);
  return { hash: c.ground.hash, n, nocc: st.nocc, nvir: st.nvir, count: st.d, omega: Float64Array.from(st.omega), f: Float64Array.from(st.f),
    mu: Float64Array.from(st.mu), cluster: Int32Array.from(st.cluster), size: Int32Array.from(st.size), pivot: Float64Array.from(st.pivot), rMO };
}
/** chem.state.vectors — the canonical X^K of the states asked for, row-major [ks.length × nocc·nvir] */
export function chemStateVectors(m = {}) {
  if (!chemSol || !chemSol.states) throw new Error('chem: no states in this worker yet — chem.states first');
  const st = chemSol.states, ks = (Array.isArray(m.ks) ? m.ks : []).map((k) => k | 0).filter((k) => k >= 0 && k < st.d);
  const X = new Float64Array(ks.length * st.d);
  ks.forEach((k, r) => X.set(st.X.subarray(k * st.d, (k + 1) * st.d), r * st.d));
  return { hash: chemSol.ground.hash, ks, count: st.d, X };
}
/* ── THE DRIVE (MOLECULAR WAVES stage 5; JUDGMENT.md §3, proving/LEDGER.md Proposition 5) ───────────────────────
 * TD-CIS in the length gauge the project already uses, on the WHOLE singles space (1 + n_o n_v states):
 *
 *     i ḃ = [ diag(0, ω_K) + E(t) · R ] b ,      R_AB = Σ_pq γ^{AB}_pq ⟨p| r |q⟩
 *     R_0K = μ_K ,   R_KL = Σ X^K_ia X^L_jb (δ_ij r_ab − δ_ab r_ji) ,   ⟨0|R|0⟩ dropped everywhere (a global phase)
 *
 * It is hydrogen's register equation with a different table, so it resonates WHERE THE STICKS STAND and with their
 * strengths — which the frozen-orbital drives of the rival plan could not (they resonate at orbital gaps).
 * THE STEP IS STRANG AND EXACTLY UNITARY: e^{−iH₀Δt/2} · U e^{−iE r Δt} Uᵀ · e^{−iH₀Δt/2} with R = U r Uᵀ diagonalised
 * ONCE per axis, E taken at the midpoint.  Two matrix–vector products a step (four for a circular field, where R_a
 * and R_b do not commute and the split is symmetric in them); the norm is conserved to round-off, the error is
 * second order, and a NEGATIVE Δt is the exact inverse, so a scrub backwards is a real un-propagation. */
let driveState = null;
function driveOperators(c, q) {
  const st = c.states; st.Reig = st.Reig || [null, null, null];
  if (st.Reig[q]) return st.Reig[q];
  const { n, nocc, nvir, d, X, rMO } = st, r = rMO[q], N = d + 1, R = new Float64Array(N * N), M = new Float64Array(d);
  for (let K = 0; K < d; K++) {
    const XK = X.subarray(K * d, (K + 1) * d);
    for (let j = 0; j < nocc; j++) for (let b = 0; b < nvir; b++) {              // M_jb = Σ_a X_ja r_ab − Σ_i X_ib r_ji
      let sacc = 0;
      for (let a = 0; a < nvir; a++) sacc += XK[j * nvir + a] * r[(nocc + a) * n + nocc + b];
      for (let i = 0; i < nocc; i++) sacc -= XK[i * nvir + b] * r[j * n + i];
      M[j * nvir + b] = sacc;
    }
    for (let L = K; L < d; L++) { let v = 0; const XL = X.subarray(L * d, (L + 1) * d); for (let p = 0; p < d; p++) v += M[p] * XL[p]; R[(K + 1) * N + L + 1] = R[(L + 1) * N + K + 1] = v; }
    R[K + 1] = R[(K + 1) * N] = st.mu[3 * K + q];                                // R_0K = μ_Kq
  }
  const e = eigSym(R, N);
  st.Reig[q] = { N, values: Float64Array.from(e.values), U: e.vectors, R };
  return st.Reig[q];
}
const POLS = { x: [0], y: [1], z: [2], 'xy+': [0, 1, +1], 'xy-': [0, 1, -1], 'yz+': [1, 2, +1], 'yz-': [1, 2, -1], 'zx+': [2, 0, +1], 'zx-': [2, 0, -1] };
function driveField(D) {
  const { e0, omega, phase, envelope, duration, t0 } = D;
  if (envelope === 'pulse') {
    const a = sin2Pulse({ amplitude: e0, omega, duration, start: t0, phase }), b = sin2Pulse({ amplitude: e0 * (D.sense || 0), omega, duration, start: t0, phase: phase - Math.PI / 2 });
    return [a, b];
  }
  return [(t) => e0 * Math.cos(omega * (t - t0) + phase), (t) => (D.sense || 0) * e0 * Math.sin(omega * (t - t0) + phase)];
}
export function chemDriveInit(m = {}) {
  if (chemSol) standDown(chemSol.ground, "the drive stands down under RKS LDA: its operators are RHF's");
  if (!chemSol || !chemSol.states) throw new Error('chem: no states in this worker yet — chem.states first');
  const pol = POLS[m.pol || 'x']; if (!pol) throw new Error(`chem: drive polarisation must be one of ${Object.keys(POLS).join(', ')}`);
  const st = chemSol.states, N = st.d + 1, dt = m.dt === undefined ? 0.05 : +m.dt;
  if (!(dt > 0)) throw new Error('chem: drive dt must be positive');
  const D = { pol: m.pol || 'x', axes: pol.slice(0, pol.length === 3 ? 2 : 1), sense: pol.length === 3 ? pol[2] : 0, ops: null,
    e0: +m.e0 || 0, omega: Math.max(0, +m.omega || 0), phase: +m.phase || 0, envelope: m.envelope === 'pulse' ? 'pulse' : 'cw',
    duration: Math.max(1e-6, +m.duration || 200), dt, t0: +m.t0 || 0, t: +m.t0 || 0, N, steps: 0,
    br: new Float64Array(N), bi: new Float64Array(N), cr: new Float64Array(N), ci: new Float64Array(N), hash: chemSol.ground.hash, w: new Float64Array(N) };
  D.ops = D.axes.map((q) => driveOperators(chemSol, q)); D.w.set(st.omega, 1);   // the free phases: 0 for S₀, ω_K above it
  let n2 = 0;
  for (const l of (Array.isArray(m.lanes) ? m.lanes : [])) { const k = (l.key | 0) + 1; if (k < 0 || k >= N) continue; D.br[k] += +l.re || 0; D.bi[k] += +l.im || 0; }
  for (let k = 0; k < N; k++) n2 += D.br[k] ** 2 + D.bi[k] ** 2;
  if (!(n2 > 0)) { D.br[0] = 1; n2 = 1; }
  const inv = 1 / Math.sqrt(n2); for (let k = 0; k < N; k++) { D.br[k] *= inv; D.bi[k] *= inv; }
  D.field = driveField(D);
  driveState = D;
  return driveReply(D, 0);
}
function driveStep(D, h) {
  const { N, br, bi, cr, ci } = D, tm = D.t + h / 2;
  const free = (tau) => { for (let k = 0; k < N; k++) { if (!D.w[k]) continue; const ph = -D.w[k] * tau, c = Math.cos(ph), sn = Math.sin(ph), x = br[k], y = bi[k]; br[k] = x * c - y * sn; bi[k] = x * sn + y * c; } };
  const kick = (op, theta) => {
    if (theta === 0) return;
    const U = op.U, r = op.values;
    for (let k = 0; k < N; k++) { let xr = 0, xi = 0; for (let i = 0; i < N; i++) { const u = U[i * N + k]; xr += u * br[i]; xi += u * bi[i]; } const ph = -theta * r[k], c = Math.cos(ph), sn = Math.sin(ph); cr[k] = xr * c - xi * sn; ci[k] = xr * sn + xi * c; }
    for (let i = 0; i < N; i++) { let xr = 0, xi = 0; const row = i * N; for (let k = 0; k < N; k++) { const u = U[row + k]; xr += u * cr[k]; xi += u * ci[k]; } br[i] = xr; bi[i] = xi; }
  };
  free(h / 2);
  if (D.ops.length === 1) kick(D.ops[0], D.field[0](tm) * h);
  else { const ea = D.field[0](tm) * h, eb = D.field[1](tm) * h; kick(D.ops[0], ea / 2); kick(D.ops[1], eb); kick(D.ops[0], ea / 2); }
  free(h / 2);
  D.t += h; D.steps++;
}
function driveReply(D, taken) {
  const st = chemSol.states, d = st.d, N = D.N, Zr = new Float64Array(d), Zi = new Float64Array(d), pops = new Float32Array(d);
  let n2 = D.br[0] ** 2 + D.bi[0] ** 2;
  for (let K = 0; K < d; K++) {
    const xr = D.br[K + 1], xi = D.bi[K + 1], p = xr * xr + xi * xi; pops[K] = p; n2 += p;
    if (p < 1e-30) continue;
    const X = st.X.subarray(K * d, (K + 1) * d);
    for (let q = 0; q < d; q++) { Zr[q] += xr * X[q]; Zi[q] += xi * X[q]; }
  }
  return { hash: D.hash, t: D.t, steps: D.steps, taken, norm: n2, c0: [D.br[0], D.bi[0]], p0: D.br[0] ** 2 + D.bi[0] ** 2, Zr, Zi, pops,
    field: [D.field[0](D.t), D.field[1](D.t)], N };
}
/** chem.drive.run — step to clock time `to`, forwards or backwards, at most maxSteps a request (the rest is `lag`) */
export function chemDriveRun(m = {}) {
  const D = driveState; if (!D || !chemSol || D.hash !== chemSol.ground.hash) throw new Error('chem: no drive in this worker — chem.drive.init first');
  const to = Number.isFinite(m.to) ? +m.to : D.t, cap = Math.max(1, (m.maxSteps | 0) || 2000);
  let taken = 0;
  while (taken < cap && Math.abs(to - D.t) > 1e-12) { const gap = to - D.t, h = Math.sign(gap) * Math.min(D.dt, Math.abs(gap)); driveStep(D, h); taken++; }
  const out = driveReply(D, taken); out.lag = to - D.t;
  /* the amplitudes of the lanes the window names, so DRIVE OFF can freeze the driven state back into them */
  if (Array.isArray(m.keys)) { out.laneRe = new Float64Array(m.keys.length); out.laneIm = new Float64Array(m.keys.length); m.keys.forEach((key, i) => { const k = (key | 0) + 1; if (k >= 0 && k < D.N) { out.laneRe[i] = D.br[k]; out.laneIm[i] = D.bi[k]; } }); }
  return out;
}
/* ── THE SONG (0.6.4 S1): hydrogen DRIVEN by a track, i ċ = (diag E_n + E_z(t)·z) c over the 91 labels by driveStep (D.w, the free phases, and D.ops are each drive's own).  z = δ_mm' ∫R_nl R_n'l' r³ dr
 * (trapezoid, 20 000 points to r = 400) × √(((l+1)² − m²)/((2l+1)(2l+3))), eigensolved once.  The track (t_atom = RATE × t_audio) is low-passed at the stepper's Nyquist and
 * decimated ONCE by a polyphase (64-phase) Blackman-windowed sinc to the steps' MIDPOINTS t0 + (j + ½)dt, peak-normalised; whole steps only (the rest is `lag`), 0 past the end. */
let song = null, songTrack = null;
import { hydrogenZ } from './stark.js'; export { hydrogenZ };   // 0.8.0 G3: z moved to lab/stark.js — ONE build for this worker and the frame thread's INTER-SHELL STARK
export function songResample(x, sr, rate) {   // → { dt, track, hash (FNV-1a of the decoded samples), omega (the zero-crossing rate, Eh) }
  const dt = rate / sr > 0.5 ? 0.25 : 0.5, q = dt * sr / rate, fc = 0.5 / Math.max(1, q), K = Math.ceil(4 / fc), P = 64, g = new Float64Array(2 * K * P + 1), n = x.length, T = new Float32Array(Math.max(1, Math.floor((n - 1) / q - 0.5) + 1));
  for (let k = 0; k < g.length; k++) { const d = k / P - K, u = Math.PI * d / K; g[k] = (d ? Math.sin(2 * Math.PI * fc * d) / (Math.PI * d) : 2 * fc) * (0.42 + 0.5 * Math.cos(u) + 0.08 * Math.cos(2 * u)); }
  let peak = 0, zc = 0, h = 0x811c9dc5;
  for (let j = 0; j < T.length; j++) { const c = (j + 0.5) * q; let a = 0, w = 0; for (let i = Math.max(0, Math.ceil(c - K)), i1 = Math.min(n - 1, Math.floor(c + K)); i <= i1; i++) { const v = g[Math.round((i - c + K) * P)]; a += v * x[i]; w += v; } T[j] = w ? a / w : 0; peak = Math.max(peak, Math.abs(T[j])); if (j && (T[j] < 0) !== (T[j - 1] < 0)) zc++; }
  const u = new Uint32Array(x.buffer, x.byteOffset, n); for (let i = 0; i < n; i++) h = Math.imul(h ^ u[i], 16777619) >>> 0; if (peak > 0) for (let j = 0; j < T.length; j++) T[j] /= peak;
  return { dt, track: T, hash: h.toString(16).padStart(8, '0') + ':' + n, omega: Math.PI * zc / (T.length * dt) };
}
const songReply = (D, taken) => { let n2 = 0; for (let k = 0; k < D.N; k++) n2 += D.br[k] ** 2 + D.bi[k] ** 2; return { t: D.t, re: Float64Array.from(D.br), im: Float64Array.from(D.bi), norm: n2, taken, steps: D.steps }; };
export const SONG = {   // h.drive.init { e0, t0, re, im, samples?, sampleRate, rate } · h.drive.run { to, maxSteps } · h.drive.set { e0 }
  init(m) {
    if (m.samples) songTrack = songResample(m.samples, m.sampleRate, m.rate); if (!songTrack) throw new Error('song: no track in this worker — drop it again');
    const N = BASIS.length, T = songTrack.track, D = song = { N, ops: [hydrogenZ()], w: Float64Array.from(BASIS, (s) => s.E), e0: +m.e0 || 0, dt: songTrack.dt, t0: +m.t0 || 0, t: +m.t0 || 0, steps: 0, br: Float64Array.from(m.re), bi: Float64Array.from(m.im), cr: new Float64Array(N), ci: new Float64Array(N) };
    D.field = [(t) => D.e0 * (T[Math.round((t - D.t0) / D.dt - 0.5)] || 0)];
    return Object.assign(songReply(D, 0), { hash: songTrack.hash, omega: songTrack.omega, dt: D.dt, length: T.length * D.dt });
  },
  run(m) { const D = song; if (!D) throw new Error('song: no drive in this worker — h.drive.init first'); const to = Number.isFinite(m.to) ? D.t0 + D.dt * Math.floor((m.to - D.t0) / D.dt + 1e-9) : D.t, cap = Math.max(1, (m.maxSteps | 0) || 4000); let taken = 0; while (taken < cap && Math.abs(to - D.t) > 1e-9) { driveStep(D, Math.sign(to - D.t) * D.dt); taken++; } const out = songReply(D, taken); out.lag = (Number.isFinite(m.to) ? m.to : to) - D.t; return out; },
  set(m) { if (song && Number.isFinite(m.e0)) song.e0 = +m.e0; return { ok: !!song }; },
};
/** chem.drive.set — the live knobs: E₀, ω and the carrier phase of a running drive (the envelope's clock is kept) */
export function chemDriveSet(m = {}) {
  const D = driveState; if (!D) return { ok: false };
  if (Number.isFinite(m.e0)) D.e0 = +m.e0; if (Number.isFinite(m.omega)) D.omega = Math.max(0, +m.omega); if (Number.isFinite(m.phase)) D.phase = +m.phase;
  D.field = driveField(D);
  return { ok: true, e0: D.e0, omega: D.omega, phase: D.phase };
}
/** chem.drive.coupling — ⟨A| r |B⟩ between two register keys (−1 = S₀), all three axes: what a drive tuned to the GAP
    between two lanes needs to know — its Rabi rate is E₀ times this, and a zero says the transition is dipole-forbidden.
    S₀ → S_K is the stick's own μ_K; S_K → S_L is EXCITED-STATE ABSORPTION, which the sticks do not show. */
export function chemDriveCoupling(m = {}) {
  if (!chemSol || !chemSol.states) throw new Error('chem: no states in this worker yet — chem.states first');
  const a = (m.a | 0) + 1, b = (m.b | 0) + 1, N = chemSol.states.d + 1;
  if (a < 0 || b < 0 || a >= N || b >= N) throw new Error('chem: drive coupling keys out of range');
  const r = [0, 1, 2].map((q) => driveOperators(chemSol, q).R[a * N + b]);
  return { hash: chemSol.ground.hash, a: m.a | 0, b: m.b | 0, r, gap: Math.abs((a ? chemSol.states.omega[a - 1] : 0) - (b ? chemSol.states.omega[b - 1] : 0)) };
}
/** the position operator of one axis in the [S₀, S₁ …] basis (⟨0|R|0⟩ removed), for the gate */
export function chemDriveOperator(q) { if (!chemSol || !chemSol.states) throw new Error('chem: no states yet'); const op = driveOperators(chemSol, q | 0); return { N: op.N, R: Float64Array.from(op.R) }; }
/** the drive's state vector, for the gate: Schrödinger amplitudes over [S₀, S₁ …] */
export function chemDriveAmplitudes() { const D = driveState; return D ? { re: Float64Array.from(D.br), im: Float64Array.from(D.bi), t: D.t, N: D.N } : null; }
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
    C: Float64Array.from(c.sol.C), D: c.sol.D && Float64Array.from(c.sol.D), shells: fieldShells(c.sol.basis),   // D null: a frontier record (S4c)
    ...(c.sol.Ds ? { Ds: Float64Array.from(c.sol.Ds) } : {}),                     // 0.7.1: the spin density Dα − Dβ of a UHF solve
    probe: c.probe || (c.probe = probeOf(c)) };
}
/** THE PROBE (0.6.5 X1): Φ_el(R_A) = −Σ_pq D_pq ⟨p|1/|r−R_A||q⟩ at every nucleus, exact (md.js rinvMatrix); null without D or past 46 AOs
    (C₆₀'s 300 would be 18 s: one rinvMatrix a nucleus), and chemview offers chem.esp only where it exists */
const probeOf = (c) => c.sol.D && c.sol.basis.n <= 46 ? c.atoms.map((a) => { const C = [a.x, a.y, a.z], R = rinvMatrix(c.sol.basis, C); let s = 0;
  for (let k = 0; k < R.length; k++) s -= c.sol.D[k] * R[k]; return { Z: a.Z, sym: ELEMENT[a.Z], c: C, phiEl: s }; }) : null;
/* THE POTENTIAL's volume (0.6.5 X1): ρ at the N³ cell centres over [−half, half]³ from the f64 AOs by molecular-flow.js' sampler, each a CELL MEAN (within 3h of a nucleus its 5³
   sub-cells', else the point + h²/24 ∇²ρ by the discrete Laplacian: water at 64³ holds 9.60 e point-sampled, the O 1s aliased), Φ_el = −G ⊛ ρh³ by
   a free-space FFT Poisson (zero-padded to (2N)³, Hockney–Eastwood: no periodic image), G = 1/r at cell offsets with the self cell the cube's mean
   ⟨1/r⟩ = (3 ln(2+√3) − π/2)/h = 2.3800774/h; the nuclei analytic, Σ Z_A / max(|r−R_A|, h/2).  `atoms` = the ground's probe, returned as atNuclei. */
function fft(re, im, sign) {                                                     // radix-2, in place, unscaled; sign −1 forward
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) { const hl = len >> 1, wr = Math.cos(sign * Math.PI / hl), wi = Math.sin(sign * Math.PI / hl);
    for (let i = 0; i < n; i += len) for (let k = 0, cr = 1, ci = 0, t; k < hl; k++, t = cr * wr - ci * wi, ci = cr * wi + ci * wr, cr = t) {
      const a = i + k, b = a + hl, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
      re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; } }
}
function fft3(re, im, M, sign) {                                                 // an M³ volume, x fastest, line by line along each axis
  const lr = new Float64Array(M), li = new Float64Array(M);
  for (const s of [1, M, M * M]) for (let c = 0; c < M * M * M; c++) { if (((c / s) | 0) % M) continue;
    for (let k = 0; k < M; k++) { lr[k] = re[c + k * s]; li[k] = im[c + k * s]; } fft(lr, li, sign);
    for (let k = 0; k < M; k++) { re[c + k * s] = lr[k]; im[c + k * s] = li[k]; } }
}
let espG = null;                                                                 // Ĝ (real: G is even), kept per (N, h)
export function chemEsp({ N = 64, half, shells, D, atoms }) {
  const t0 = performance.now(), M = 2 * N, M3 = M * M * M, h = 2 * half / N, F = createFlow(shells), x = (u) => -half + (u + 0.5) * h;
  F.set(D, new Float64Array(D.length));
  const re = new Float64Array(M3), im = new Float64Array(M3), phi = new Float32Array(N * N * N); let charge = 0, min = Infinity, max = -Infinity;
  const P = new Float64Array(N * N * N), dip = atoms.map(() => [0, 0, 0]), near = (X, Y, Z) => atoms.findIndex((a) => a.Z > 2 && Math.hypot(X - a.c[0], Y - a.c[1], Z - a.c[2]) < 3 * h);
  for (let c = 0, k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++, c++) P[c] = F.at(x(i), x(j), x(k)).rho;
  for (let c = 0, k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++, c++) { let v = 0; const A = near(x(i), x(j), x(k));
    if (A >= 0) for (let q = 0; q < 125; q++) { const o = [q % 5 - 2, ((q / 5) | 0) % 5 - 2, ((q / 25) | 0) - 2].map((u) => u * h / 5), r = F.at(x(i) + o[0], x(j) + o[1], x(k) + o[2]).rho / 125;
      v += r; for (let a = 0; a < 3; a++) dip[A][a] += r * o[a] * h * h * h; }   // the dipole a cell centre cannot hold, kept per nucleus
    else v = P[c] + ((i ? P[c - 1] : 0) + (i < N - 1 ? P[c + 1] : 0) + (j ? P[c - N] : 0) + (j < N - 1 ? P[c + N] : 0) + (k ? P[c - N * N] : 0) + (k < N - 1 ? P[c + N * N] : 0) - 6 * P[c]) / 24;
    charge += re[(k * M + j) * M + i] = v * h * h * h; }
  if (!espG || espG.M !== M || espG.h !== h) {
    const g = new Float64Array(M3), d = (u) => (u < N ? u : u - M) * h;
    for (let k = 0; k < M; k++) for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) { const r = Math.hypot(d(i), d(j), d(k)); g[(k * M + j) * M + i] = r ? 1 / r : (3 * Math.log(2 + Math.sqrt(3)) - Math.PI / 2) / h; }
    fft3(g, new Float64Array(M3), M, -1); espG = { M, h, g };
  }
  fft3(re, im, M, -1); for (let c = 0; c < M3; c++) { re[c] *= espG.g[c]; im[c] *= espG.g[c]; } fft3(re, im, M, 1);
  for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let v = -re[(k * M + j) * M + i] / M3;
    atoms.forEach((a, A) => { const d = [x(i) - a.c[0], x(j) - a.c[1], x(k) - a.c[2]], r = Math.max(Math.hypot(...d), 0.5 * h); v += a.Z / r - (dip[A][0] * d[0] + dip[A][1] * d[1] + dip[A][2] * d[2]) / Math.max(r, 3 * h) ** 3; });
    phi[(k * N + j) * N + i] = v; if (v < min) min = v; if (v > max) max = v;
  }
  return { N, half, phi, min, max, charge, atNuclei: atoms, ms: performance.now() - t0 };
}
/** chem.vib.frames (0.7.0 V1 THE MODES) { vib, k, amp, K = 32 } — K phase samples of one normal mode of the solve this worker holds (vib: library.js
    decodeVibrate): Q_j = amp·q0ₖ·cos 2πj/K, the nuclei at R₀ + Q·Lₖ, D(Q) = ONE McWEENY STEP on D₀ + Q·D₁ₖ against the exact S(Q) — D is the RHF density
    with Tr(DS) = N, so D/2 is the idempotent one and the step is 3/2·DSD − 1/2·DSDSD — and μ(Q) = Σ Z R − Tr(D M(Q)).  D₁ₖ is dD/dQ in the MOVING AO
    basis, so `shells` stays null: the frame thread moves its own shells' centres.  An unsolved key is a refusal. */
export function chemVibFrames({ vib, k = 0, amp = 1, K = 32 }) {
  const c = chemSol, at0 = vib.atoms, N = at0.length, n = c ? c.ground.nAO : 0, nn = n * n;
  if (c && c.ground.model === 'RKS LDA') throw new Refused("VIBRATE stands down under RKS LDA: its modes and dD/dQ are RHF's");
  if (!c || !c.sol.D || c.key !== keyOf(vib.basis, vib.charge, at0)) throw new Refused('VIBRATE plays the molecule this worker has solved: solve it first');
  const L = vib.L.subarray(3 * N * k, 3 * N * (k + 1)), D1 = vib.D1.subarray(nn * k, nn * (k + 1)), D0 = c.sol.D, P = new Float64Array(nn);
  const D = new Float32Array(K * nn), dipole = new Float64Array(3 * K), q = new Float64Array(K);
  const mul = (A, B) => { const C = new Float64Array(nn); for (let i = 0; i < n; i++) for (let l = 0; l < n; l++) { const a = A[i * n + l]; if (a) for (let j = 0; j < n; j++) C[i * n + j] += a * B[l * n + j]; } return C; };
  for (let j = 0; j < K; j++) {
    if (j > K / 2) { q[j] = q[K - j]; D.copyWithin(j * nn, (K - j) * nn, (K - j + 1) * nn); dipole.copyWithin(3 * j, 3 * (K - j), 3 * (K - j + 1)); continue; }   // cos is even: the second half is the first
    const Q = q[j] = amp * vib.q0[k] * Math.cos(2 * Math.PI * j / K), b = basisFrom(at0.map((a, i) => ({ Z: a.Z, x: a.x + Q * L[3 * i], y: a.y + Q * L[3 * i + 1], z: a.z + Q * L[3 * i + 2] })), recordOf(vib.basis));
    const { S, M } = oneElectron(b, b.atoms);
    for (let i = 0; i < nn; i++) P[i] = D0[i] + Q * D1[i];
    const T = mul(P, S), U = mul(T, P), V = mul(T, U);
    for (let a = 0; a < 3; a++) dipole[3 * j + a] = b.atoms.reduce((s, A) => s + A.Z * A.c[a], 0);
    for (let i = 0; i < nn; i++) { const d = D[j * nn + i] = 1.5 * U[i] - 0.5 * V[i]; for (let a = 0; a < 3; a++) dipole[3 * j + a] -= d * M[a][i]; }
  }
  return { shells: null, D, dipole, q };
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
  const { sol, I, ground } = ensureSolve(m, true), n = I.n;
  standDown(ground, "RT stands down under RKS LDA: its operators (the TDHF Fock build) are RHF's");
  const kick = m.kick || {}, axis = kick.axis || 'z', kappa = kick.kappa === undefined ? 1e-3 : +kick.kappa;
  if (AXIS[axis] === undefined) throw new Error(`chem: kick axis must be 'x', 'y' or 'z', got '${axis}'`);
  const dt = m.dt === undefined ? 0.01 : +m.dt, integrator = m.integrator || 'mmut';
  if (integrator !== 'mmut' && integrator !== 'magnus2') throw new Error(`chem: integrator must be 'mmut' or 'magnus2', got '${integrator}'`);
  if (!(dt > 0)) throw new Error('chem: dt must be positive');
  /* 0 or null on the wire is the UNRESTARTED leapfrog (lab/density.js normalises it, once).  The default here is
     still 50, because that is what an old caller that says nothing meant; the card asks for 0 and says so. */
  const restartEvery = m.restartEvery === undefined ? 50 : (m.restartEvery === null ? 0 : m.restartEvery | 0);
  /* 0.7.0 V1 · PULSES: { shape, omega, tOff = 40, alpha = 0.05 } drives κ·f(t) along the kick axis from t = 0 (density.js fieldOf) INSTEAD of the δ-kick */
  const P = m.pulse || null, field = P ? fieldOf({ shape: P.shape, kappa, omega: +P.omega || 0, tOn: 0, tOff: P.tOff ?? 40, alpha: P.alpha ?? 0.05 }) : undefined;
  const engine = createRTHF({ n, S: I.S, h: I.h, eri: I.eri, Z: P ? [I.X, I.Y, I.Z][AXIS[axis]] : I.Z, mu: [I.X, I.Y, I.Z], Enuc: I.Enuc,
    nuclearDipole: I.nuclearDipole[AXIS[axis]], nElectrons: sol.nElectrons, D0: sol.D, dt, integrator, restartEvery, field });
  if (!P) engine.kickAlong(axis, kappa);
  const trace = new Float64Array(4096); trace[0] = engine.dipoleAlong(axis);
  const ob = engine.observables();
  rtState = { engine, axis, kappa, dt, integrator, restartEvery: engine.restartEvery, n, trace, nTrace: 1, steps: 0, capped: false,
    init: { atoms: m.atoms, basis: m.basis, charge: m.charge, dt, integrator, kick: { axis, kappa }, restartEvery, pulse: P },
    E0: ob.fieldFreeTotal };
  return { ok: true, t: 0, ...bothD(engine), electrons: ob.electrons, idempotency: ob.idempotency,
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
  return { t: rtState.engine.t, ...bothD(rtState.engine), trace: out, electrons: ob.electrons,
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
/** chem.rt.fit — response-fit.js's fitPoles over the fit window THE CARD SENDS: a copy of its own first ≤ FIT_CAP samples,
    the very array it fitted on the frame thread until 2026-09-24 (optimization LB5, AUDIT-F F4: 125–153 ms there every 2 s
    on a long run), with the same options, so the poles and the certificate are the same doubles.  Nothing here reads or
    detaches the worker's own trace.  A fit that REFUSES answers `fitError` — the card prints it, as it printed the throw —
    and never `error`, which would send rack.js to run the whole fit again on the frame thread. */
export function chemRtFit(m = {}) {
  const trace = m.trace instanceof Float64Array ? m.trace : Float64Array.from(m.trace || []);
  try {
    const F = fitPoles(trace, { dt: m.dt, kappa: m.kappa, tau: m.tau, init: m.init, wMin: m.wMin, wMax: m.wMax });
    return { poles: F.poles, certified: !!F.certified(m.cert), bound: F.bound, epsilon: F.epsilon, sigma: F.sigma,
      refusal: F.refusal ? F.refusal(m.cert) : null, raw: F.raw };
  } catch (e) { return { fitError: String(e && e.message || e) }; }
}
/** every top-level typed array of a reply, so the structured clone moves the bytes instead of copying them */
const chemTransfer = (out) => Object.values(out).filter((v) => v && v.buffer instanceof ArrayBuffer).map((v) => v.buffer);
