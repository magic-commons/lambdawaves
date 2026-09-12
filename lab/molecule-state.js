/* molecule-state.js — the SAVED MOLECULE, contract B-H2O-5 of research/MATH-H2O-2026-09-11.md.  Atomic units, bohr.
 * STATUS: DERIVED-HERE record schema and validation; gated by tests/molecule-state.test.mjs on H₂O/STO-3G at
 * E = −74.963023162862.  The record is the STATE and nothing else: atoms, charge, the basis's identity and its
 * SHA-256 over the vendored decimal strings, the RHF solution in full doubles, the complex real-time density with
 * its MMUT history, and the presentation.  NO DERIVED CACHES — S, h, (ij|kl), X = S^{−1/2}, the Fock matrix, the
 * dipole trace and the field's voxels are all recomputable from these numbers and none of them belongs here.
 *
 * The four named rejections, and why each is a refusal rather than a repair:
 *   E_SHAPE          a dimension, a schema version or a symmetry that does not hold.  D must be real symmetric and P
 *                    Hermitian; a record that is neither is not a one-particle density and cannot be propagated.
 *   E_BASIS_HASH     the vendored record's hash over its DECIMAL STRINGS has moved (ROUND 2 §6: never over parsed
 *                    doubles).  A restored C and D mean nothing in a different basis, and silently reconverging
 *                    would hand back a different molecule under the saved name.
 *   E_MMUT_HISTORY   `integrator: 'mmut'` without P(t−Δt) and its step parity.  MMUT is a leapfrog on two
 *                    interleaved sublattices; SYNTHESIS decision 2 makes the unrestarted form the default, so the
 *                    history is part of the state and not an optional branch.  Restarting from a Magnus-2 step
 *                    instead is a DIFFERENT trajectory, so it is the caller's decision to take, not ours.
 *   E_TRACE          |Tr(DS) − N_e| over max(1e-12, 3nε·steps).  The bound is ROUND 4 §8's correction of Sol's flat
 *                    1e-12: at 120,000 steps the measured drift law (1.6e-15 electrons per step, a defect of
 *                    S^{±1/2} and never of the unitary integrator) puts the honest value at 10.00000000019.
 *
 * MUST NOT CLAIM: forward compatibility without a migration, physical reproducibility after a hash mismatch, or
 * that cached integrals belong in the record.
 */
import { basisFrom, COMPONENT_ORDER } from './md.js';
import { BASIS_FILES } from './rhf-molecule.js';

export const SCHEMA = 1;
export const BASIS_KIND = 'cartesian';
export const COMPONENT_ORDER_LINE = COMPONENT_ORDER.join('; ');            // 's; x,y,z; xx,xy,xz,yy,yz,zz'
export const CODES = ['E_SHAPE', 'E_BASIS_HASH', 'E_MMUT_HISTORY', 'E_TRACE'];
export const INTEGRATORS = ['magnus2', 'mmut'];
const AXES = ['x', 'y', 'z'];

/** every refusal carries its code, both on the error and at the head of the message */
export class MoleculeStateError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.name = 'MoleculeStateError'; this.code = code; }
}
const fail = (code, message) => { throw new MoleculeStateError(code, message); };
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const num = (v, what) => (isNum(v) ? v : fail('E_SHAPE', `${what} must be a finite number, got ${JSON.stringify(v)}`));
/** a plain double array out of anything array-like, checked for length and finiteness */
function vec(v, len, what) {
  if (!v || typeof v.length !== 'number') fail('E_SHAPE', `${what} must be an array of ${len} numbers`);
  if (v.length !== len) fail('E_SHAPE', `${what} has length ${v.length}, expected ${len}`);
  const out = new Array(len);
  for (let i = 0; i < len; i++) { const x = v[i]; if (!isNum(x)) fail('E_SHAPE', `${what}[${i}] is not a finite number`); out[i] = x; }
  return out;
}
const maxAbs = (a) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i])); return m; };
/** max |A_ij − s A_ji|, the symmetry defect (s = +1 symmetric, s = −1 antisymmetric) */
function symDefect(A, n, s) {
  let d = 0;
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) d = Math.max(d, Math.abs(A[i * n + j] - s * A[j * n + i]));
  return d;
}

/* ── the RT block ───────────────────────────────────────────────────────────────────────────────────────────────── */
/** { re, im } of one n × n complex matrix, as plain doubles, with the Hermitian check */
function cplx(P, n, what) {
  if (!P || typeof P !== 'object') fail('E_SHAPE', `${what} must be { re, im }`);
  const re = vec(P.re, n * n, `${what}.re`), im = vec(P.im, n * n, `${what}.im`);
  const scale = Math.max(1, maxAbs(re), maxAbs(im)), tol = 1e-9 * scale;
  const dr = symDefect(re, n, 1), di = symDefect(im, n, -1);
  if (dr > tol || di > tol) fail('E_SHAPE', `${what} is not Hermitian: Re defect ${dr.toExponential(3)}, Im defect ${di.toExponential(3)} over ${tol.toExponential(3)}`);
  return { re, im };
}
function rtBlock(rt, n) {
  if (rt === null || rt === undefined) return null;
  if (typeof rt !== 'object') fail('E_SHAPE', 'rt must be null or an object');
  const integrator = rt.integrator;
  if (!INTEGRATORS.includes(integrator)) fail('E_SHAPE', `rt.integrator must be one of ${INTEGRATORS.join(', ')}, got ${JSON.stringify(integrator)}`);
  const kick = rt.kick || {};
  if (!AXES.includes(kick.axis)) fail('E_SHAPE', `rt.kick.axis must be one of ${AXES.join(', ')}, got ${JSON.stringify(kick.axis)}`);
  const steps = rt.steps;
  if (!Number.isInteger(steps) || steps < 0) fail('E_SHAPE', `rt.steps must be a non-negative integer, got ${JSON.stringify(steps)}`);
  const dt = num(rt.dt, 'rt.dt');
  if (!(dt > 0)) fail('E_SHAPE', `rt.dt must be positive, got ${dt}`);
  const P = cplx(rt.P, n, 'rt.P');
  const Pprev = rt.Pprev === null || rt.Pprev === undefined ? null : cplx(rt.Pprev, n, 'rt.Pprev');
  /* THE MMUT HISTORY IS THE STATE (SYNTHESIS decision 2), and the parity says which of the leapfrog's two
     interleaved sublattices P sits on — it is steps mod 2 by construction, so a record that disagrees with its own
     step count has lost one of the two and would resume on the wrong lattice. */
  const parity = rt.parity;
  if (integrator === 'mmut') {
    if (!Pprev) fail('E_MMUT_HISTORY', 'an mmut record must carry P(t−Δt); without it the leapfrog can only be restarted, which is a different trajectory');
    if (parity !== 0 && parity !== 1) fail('E_MMUT_HISTORY', `an mmut record must carry parity 0 or 1, got ${JSON.stringify(parity)}`);
    if (parity !== steps % 2) fail('E_MMUT_HISTORY', `parity ${parity} contradicts steps ${steps} (steps mod 2 = ${steps % 2})`);
  } else if (parity !== null && parity !== undefined && parity !== 0 && parity !== 1) {
    fail('E_SHAPE', `rt.parity must be 0, 1 or null, got ${JSON.stringify(parity)}`);
  }
  return { t: num(rt.t, 'rt.t'), dt, integrator, kick: { axis: kick.axis, kappa: num(kick.kappa, 'rt.kick.kappa') },
    P, Pprev, parity: integrator === 'mmut' ? parity : (parity === 0 || parity === 1 ? parity : null), steps };
}

/* ── serialise ──────────────────────────────────────────────────────────────────────────────────────────────────── */
/**
 * serializeMolecule(s) → the canonical record.  `s` is the live state and is exactly the shape restoreMolecule
 * returns, so save → restore → save is byte-identical: every key is written in a FIXED ORDER, every number as a
 * double (JSON's shortest round-tripping form), and no derived cache is written at all.
 *   s = { atoms: [{ Z, x, y, z }] bohr, charge, multiplicity?, electrons?,
 *         basis: { name, version?, url?, hash }, rhf: { energy, eps, C, D }, rt, presentation }
 */
export function serializeMolecule(s) {
  if (!s || typeof s !== 'object') fail('E_SHAPE', 'serializeMolecule needs a state object');
  if (!Array.isArray(s.atoms) || !s.atoms.length) fail('E_SHAPE', 'atoms = [{ Z, x, y, z }] in bohr');
  const atoms = s.atoms.map((a, k) => {
    if (!a || !Number.isInteger(a.Z) || a.Z < 1) fail('E_SHAPE', `atoms[${k}].Z must be a positive integer`);
    return { Z: a.Z, x: num(a.x, `atoms[${k}].x`), y: num(a.y, `atoms[${k}].y`), z: num(a.z, `atoms[${k}].z`) };
  });
  const charge = Number.isInteger(s.charge) ? s.charge : fail('E_SHAPE', `charge must be an integer, got ${JSON.stringify(s.charge)}`);
  const multiplicity = s.multiplicity === undefined ? 1 : s.multiplicity;
  if (!Number.isInteger(multiplicity) || multiplicity < 1) fail('E_SHAPE', `multiplicity must be a positive integer, got ${JSON.stringify(s.multiplicity)}`);
  const nuclear = atoms.reduce((t, a) => t + a.Z, 0), electrons = s.electrons === undefined ? nuclear - charge : s.electrons;
  if (!Number.isInteger(electrons) || electrons < 1) fail('E_SHAPE', `electrons must be a positive integer, got ${JSON.stringify(s.electrons)}`);
  if (electrons !== nuclear - charge) fail('E_SHAPE', `electrons ${electrons} ≠ ΣZ − charge = ${nuclear - charge}`);
  const b = s.basis || {};
  if (!b.name || !BASIS_FILES[b.name]) fail('E_SHAPE', `basis.name must be one of ${Object.keys(BASIS_FILES).join(', ')}, got ${JSON.stringify(b.name)}`);
  if (typeof b.hash !== 'string' || !/^[0-9a-f]{64}$/.test(b.hash)) fail('E_SHAPE', 'basis.hash must be the 64-hex SHA-256 over the record\'s decimal strings');
  const rhf = s.rhf || {};
  const nC = Math.round(Math.sqrt((rhf.C && rhf.C.length) || 0));
  if (!(nC > 0) || nC * nC !== ((rhf.C && rhf.C.length) || 0)) fail('E_SHAPE', `rhf.C must be an n × n matrix, got length ${(rhf.C && rhf.C.length) || 0}`);
  const n = nC;
  const rec = {
    schema: SCHEMA,
    atoms,
    charge, multiplicity, electrons,
    basis: { name: b.name, version: b.version === undefined || b.version === null ? null : String(b.version),
      url: b.url === undefined ? `./vendor/bse/${BASIS_FILES[b.name]}` : String(b.url),
      hash: b.hash, kind: BASIS_KIND, order: COMPONENT_ORDER_LINE },
    rhf: { energy: num(rhf.energy, 'rhf.energy'), eps: vec(rhf.eps, n, 'rhf.eps'),
      C: vec(rhf.C, n * n, 'rhf.C'), D: vec(rhf.D, n * n, 'rhf.D') },
    rt: null,
    presentation: presentationOf(s.presentation),
  };
  const dD = symDefect(rec.rhf.D, n, 1), tolD = 1e-9 * Math.max(1, maxAbs(rec.rhf.D));
  if (dD > tolD) fail('E_SHAPE', `rhf.D is not symmetric: defect ${dD.toExponential(3)} over ${tolD.toExponential(3)}`);
  const rt = rtBlock(s.rt, n);
  if (rt) rec.rt = { t: rt.t, dt: rt.dt, integrator: rt.integrator, kick: { axis: rt.kick.axis, kappa: rt.kick.kappa },
    P: { re: rt.P.re, im: rt.P.im }, Pprev: rt.Pprev ? { re: rt.Pprev.re, im: rt.Pprev.im } : null,
    parity: rt.parity, steps: rt.steps };
  return rec;
}
/** the grid presentation — an OBSERVER choice, saved because it is what the window was showing, never as physics */
function presentationOf(p = {}) {
  const q = p || {};
  const view = q.view === undefined ? 'density' : q.view;
  if (typeof view !== 'string') fail('E_SHAPE', 'presentation.view must be a string');
  const orbital = q.orbital === undefined || q.orbital === null ? null : q.orbital;
  if (orbital !== null && (!Number.isInteger(orbital) || orbital < 0)) fail('E_SHAPE', `presentation.orbital must be null or a non-negative integer, got ${JSON.stringify(q.orbital)}`);
  const iso = q.iso === undefined ? 0.06 : num(q.iso, 'presentation.iso');
  return { view, orbital, iso, showCore: q.showCore === undefined ? false : !!q.showCore };
}

/* ── restore ────────────────────────────────────────────────────────────────────────────────────────────────────── */
/**
 * restoreMolecule(rec, { record, S }) → the live state, plus `.record` (the canonical record again) and `.checks`.
 * `record`: the vendored lab/vendor/bse JSON, so the basis hash is RECOMPUTED here over its decimal strings rather
 * than trusted — omit it and the hash is not checked, and `checks.basisHash` says so.
 * `S`: the AO overlap matrix, so Tr(DS) can be held to max(1e-12, 3nε·steps) — omit it and `checks.trace` says so.
 */
export function restoreMolecule(rec, { record = null, S = null } = {}) {
  if (!rec || typeof rec !== 'object') fail('E_SHAPE', 'restoreMolecule needs a record object');
  if (rec.schema !== SCHEMA) fail('E_SHAPE', `schema ${JSON.stringify(rec.schema)} is not ${SCHEMA}; this record needs a migration`);
  if (rec.basis && rec.basis.kind !== undefined && rec.basis.kind !== BASIS_KIND) fail('E_SHAPE', `basis.kind must be '${BASIS_KIND}', got ${JSON.stringify(rec.basis.kind)}`);
  if (rec.basis && rec.basis.order !== undefined && rec.basis.order !== COMPONENT_ORDER_LINE) fail('E_SHAPE', `basis.order must be '${COMPONENT_ORDER_LINE}', got ${JSON.stringify(rec.basis.order)}`);
  const canon = serializeMolecule(rec);                                     // every shape law above, once
  const n = canon.rhf.eps.length, checks = { n, basisHash: 'not checked (no vendored record supplied)', trace: 'not checked (no metric supplied)', mmut: canon.rt ? canon.rt.integrator : 'no rt block' };
  if (record) {
    const built = basisFrom(canon.atoms.map((a) => ({ Z: a.Z, x: a.x, y: a.y, z: a.z })), record, { cart: true });
    if (built.n !== n) fail('E_SHAPE', `the vendored basis gives ${built.n} AOs, the record's C and D are ${n} × ${n}`);
    if (built.hash !== canon.basis.hash) fail('E_BASIS_HASH', `the record names ${canon.basis.hash.slice(0, 12)}… and the vendored basis hashes to ${built.hash.slice(0, 12)}…; a restored C and D mean nothing in a different basis`);
    checks.basisHash = built.hash;
  }
  if (S) {
    if (S.length !== n * n) fail('E_SHAPE', `the metric S is ${S.length} long, expected ${n * n}`);
    let tr = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) tr += canon.rhf.D[i * n + j] * S[j * n + i];
    const steps = canon.rt ? canon.rt.steps : 0;
    const bound = Math.max(1e-12, 3 * n * Number.EPSILON * steps);
    if (Math.abs(tr - canon.electrons) > bound) fail('E_TRACE', `Tr(DS) = ${tr} against N_e = ${canon.electrons}: |Δ| = ${Math.abs(tr - canon.electrons).toExponential(3)} over max(1e-12, 3nε·steps) = ${bound.toExponential(3)}`);
    checks.trace = { TrDS: tr, electrons: canon.electrons, bound, steps };
  }
  const f64 = (a) => Float64Array.from(a);
  return {
    record: canon,
    atoms: canon.atoms.map((a) => ({ ...a })), charge: canon.charge, multiplicity: canon.multiplicity, electrons: canon.electrons, n,
    basis: { ...canon.basis },
    rhf: { energy: canon.rhf.energy, eps: f64(canon.rhf.eps), C: f64(canon.rhf.C), D: f64(canon.rhf.D) },
    rt: canon.rt ? { t: canon.rt.t, dt: canon.rt.dt, integrator: canon.rt.integrator,
      kick: { ...canon.rt.kick }, P: { re: f64(canon.rt.P.re), im: f64(canon.rt.P.im) },
      Pprev: canon.rt.Pprev ? { re: f64(canon.rt.Pprev.re), im: f64(canon.rt.Pprev.im) } : null,
      parity: canon.rt.parity, steps: canon.rt.steps } : null,
    presentation: { ...canon.presentation },
    checks,
  };
}
