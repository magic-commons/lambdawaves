/* rhf-molecule.js — a molecule, a vendored basis and an RHF ground state, with the second solution named.
 * B-H2O-2 of research/MATH-H2O-2026-09-11.md.  Atomic units, atoms in bohr.  lab/md.js builds the integrals.
 * The initial guess is SAD — a superposition of spherically averaged atomic densities from atomic RHF with
 * fractional occupations in the same basis — because the bare core guess converges N₂/STO-3G onto a SECOND
 * aufbau RHF solution at −106.766097415129, 0.7298 hartree above the ground state (ROUND 4 · OPUS §5).  Every
 * returned solution carries an aufbau report, the singlet orbital-rotation Hessian blocks A ± B, and a
 * re-convergence from a symmetrically perturbed density.
 */
import { basisFrom, integrals } from './md.js';
import { rhf, fockReal } from './scf.js';
import { loewdin } from './density.js';
import { eigSym } from './h2ci.js';

export const BASIS_FILES = { 'sto-3g': 'sto-3g-v1.json', '6-31+g-star': '6-31+g-star-v1.json' };
const REGISTRY = new Map();
/** hand a parsed lab/vendor/bse record to the module once; moleculeRHF is then synchronous */
export function registerRecord(name, record) {
  if (!BASIS_FILES[name]) throw new Error(`rhf-molecule: unknown basis '${name}'`);
  REGISTRY.set(name, record); return record;
}
/** browser-side convenience: fetch and register one vendored record */
export async function loadRecord(name, base = './vendor/bse/') {
  if (REGISTRY.has(name)) return REGISTRY.get(name);
  if (!BASIS_FILES[name]) throw new Error(`rhf-molecule: unknown basis '${name}'`);
  const r = await fetch(base + BASIS_FILES[name]);
  if (!r.ok) throw new Error(`rhf-molecule: cannot load ${BASIS_FILES[name]} (${r.status})`);
  return registerRecord(name, await r.json());
}
const recordFor = (name, given) => {
  if (!BASIS_FILES[name]) throw new Error(`rhf-molecule: unknown basis '${name}' — only ${Object.keys(BASIS_FILES).join(' and ')} are vendored`);
  if (given) return given;
  const r = REGISTRY.get(name);
  if (!r) throw new Error(`rhf-molecule: basis '${name}' not registered — call registerRecord or loadRecord first`);
  return r;
};

/* ── spherically averaged atomic occupations ───────────────────────────────────────────────────────────────────── */
/* [l, capacity] in MADELUNG order, through 4p: enough for every element the vendored STO-3G record carries (Z ≤ 36).
   This is the SAD GUESS's spherically averaged configuration, not a spectroscopic term: Cu comes out 4s² 3d⁹ and not
   4s¹ 3d¹⁰, which changes the starting density and nothing that is converged. */
const AUFBAU = [[0, 2], [0, 2], [1, 6], [0, 2], [1, 6], [0, 2], [2, 10], [1, 6]];
/** per-l lists of shell electron counts in energy order, e.g. O → { 0: [2, 2], 1: [4] } */
export function atomicOccupations(Z) {
  let left = Z; const per = {};
  for (const [l, cap] of AUFBAU) {
    if (left <= 0) break;
    const take = Math.min(left, cap); left -= take;
    (per[l] ??= []).push(take);
  }
  if (left > 0) throw new Error(`rhf-molecule: no spherically averaged configuration for Z=${Z}`);
  return per;
}
/** the l character of each MO — exact for a free atom, whose S and X are block diagonal in l */
function moCharacter(basis, Ct, n) {
  const l = basis.bfs.map((b) => b.shell), out = new Int8Array(n);
  for (let mo = 0; mo < n; mo++) {
    const w = [0, 0, 0];
    for (let i = 0; i < n; i++) w[l[i]] += Ct[i * n + mo] ** 2;
    out[mo] = w.indexOf(Math.max(...w));
  }
  return out;
}
/**
 * the spherically averaged atomic RHF density of one element in this basis, with fractional occupations:
 * a p shell holding n_p electrons puts n_p/3 into each of its three degenerate components, so D stays spherical.
 */
export function atomicDensity(Z, record, { maxIter = 200, tol = 1e-10, mix = 0.4 } = {}) {
  const basis = basisFrom([{ Z, x: 0, y: 0, z: 0 }], record, { cart: true }), n = basis.n;
  const I = integrals(basis, [{ Z, x: 0, y: 0, z: 0 }]), { X } = loewdin(I.S, n);
  const occ = atomicOccupations(Z), WIDTH = [1, 3, 6];                       // Cartesian components per shell
  let D = new Float64Array(n * n), iterations = 0, moved = Infinity;
  for (let it = 0; it < maxIter; it++) {
    const F = fockReal({ h: I.h, eri: I.eri, n }, D);
    const Ft = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0;
      for (let k = 0; k < n; k++) for (let m = 0; m < n; m++) s += X[i * n + k] * F[k * n + m] * X[m * n + j]; Ft[i * n + j] = s; }
    const e = eigSym(Ft, n), Ct = e.vectors, ch = moCharacter(basis, Ct, n);
    const C = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let mo = 0; mo < n; mo++) { let s = 0;
      for (let k = 0; k < n; k++) s += X[i * n + k] * Ct[k * n + mo]; C[i * n + mo] = s; }
    const nOcc = new Float64Array(n);
    for (const l of [0, 1, 2]) {
      const mos = [...Array(n).keys()].filter((mo) => ch[mo] === l);       // already ascending in ε
      (occ[l] ?? []).forEach((ne, shell) => {
        const w = WIDTH[l];
        for (let k = 0; k < w; k++) { const mo = mos[shell * w + k]; if (mo !== undefined) nOcc[mo] = ne / w; }
      });
    }
    const Dn = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0;
      for (let mo = 0; mo < n; mo++) if (nOcc[mo]) s += nOcc[mo] * C[i * n + mo] * C[j * n + mo]; Dn[i * n + j] = s; }
    moved = 0; for (let k = 0; k < n * n; k++) moved = Math.max(moved, Math.abs(Dn[k] - D[k]));
    for (let k = 0; k < n * n; k++) D[k] = it === 0 ? Dn[k] : (1 - mix) * D[k] + mix * Dn[k];
    iterations = it + 1;
    if (moved < tol) break;
  }
  return { Z, n, D, basis, iterations, moved, electrons: (() => { let t = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) t += D[i * n + j] * I.S[j * n + i]; return t; })() };
}
/** SAD: the atomic densities dropped into their own AO blocks, nothing between atoms */
export function sadDensity(atoms, record, basis) {
  const n = basis.n, D = new Float64Array(n * n), cache = new Map(), start = [];
  let seen = -1;
  basis.bfs.forEach((b, i) => { if (b.atom !== seen) { seen = b.atom; start[b.atom] = i; } });
  atoms.forEach((a, ia) => {
    if (!cache.has(a.Z)) cache.set(a.Z, atomicDensity(a.Z, record));
    const at = cache.get(a.Z), o = start[ia];
    for (let i = 0; i < at.n; i++) for (let j = 0; j < at.n; j++) D[(o + i) * n + (o + j)] = at.D[i * at.n + j];
  });
  return D;
}

/* ── aufbau, stability, and the naming of a second solution ────────────────────────────────────────────────────── */
const mulberry32 = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/** does the converged density occupy the lowest nocc eigenvectors of its own Fock matrix? */
export function aufbauReport(I, out, nocc) {
  const n = I.n, F = fockReal({ h: I.h, eri: I.eri, n }, out.D), { X } = loewdin(I.S, n);
  const Ft = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0;
    for (let k = 0; k < n; k++) for (let m = 0; m < n; m++) s += X[i * n + k] * F[k * n + m] * X[m * n + j]; Ft[i * n + j] = s; }
  const e = eigSym(Ft, n), C = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let mo = 0; mo < n; mo++) { let s = 0;
    for (let k = 0; k < n; k++) s += X[i * n + k] * e.vectors[k * n + mo]; C[i * n + mo] = s; }
  let defect = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0;
    for (let o = 0; o < nocc; o++) s += C[i * n + o] * C[j * n + o];
    defect = Math.max(defect, Math.abs(2 * s - out.D[i * n + j])); }
  const gap = e.values[nocc] - e.values[nocc - 1];
  return { gap, homo: e.values[nocc - 1], lumo: e.values[nocc], densityDefect: defect, satisfied: gap > 0 && defect < 1e-8 };
}
/**
 * the singlet orbital-rotation Hessian blocks, from a converged solution alone and one nov × nov diagonalisation:
 *   A_ia,jb = δ_ij δ_ab (ε_a − ε_i) + 2(ia|jb) − (ij|ab),   B_ia,jb = 2(ia|jb) − (ib|ja)
 * A + B ≻ 0 is real RHF→RHF stability; both blocks go negative on N₂'s second solution (ROUND 4 question 21).
 */
export function stabilityHessian(I, out, nocc) {
  const n = I.n, nv = n - nocc, nov = nocc * nv, C = out.C, eps = out.orbitalEnergies, g = I.eri;
  if (nv < 1) return { nOv: 0, lowestApB: Infinity, lowestAmB: Infinity, minimum: true };
  const A1 = new Float64Array(nocc * n * n * n);                             // (i ν λ σ)
  for (let i = 0; i < nocc; i++) for (let nu = 0; nu < n; nu++) for (let la = 0; la < n; la++) for (let si = 0; si < n; si++) {
    let s = 0; for (let mu = 0; mu < n; mu++) s += C[mu * n + i] * g[((mu * n + nu) * n + la) * n + si];
    A1[((i * n + nu) * n + la) * n + si] = s; }
  const half = (second, third, fourth, d2, d3, d4) => {                      // three contractions on ν, λ, σ
    const B2 = new Float64Array(nocc * d2 * n * n);
    for (let i = 0; i < nocc; i++) for (let p = 0; p < d2; p++) for (let la = 0; la < n; la++) for (let si = 0; si < n; si++) {
      let s = 0; for (let nu = 0; nu < n; nu++) s += C[nu * n + second(p)] * A1[((i * n + nu) * n + la) * n + si];
      B2[((i * d2 + p) * n + la) * n + si] = s; }
    const B3 = new Float64Array(nocc * d2 * d3 * n);
    for (let i = 0; i < nocc; i++) for (let p = 0; p < d2; p++) for (let q = 0; q < d3; q++) for (let si = 0; si < n; si++) {
      let s = 0; for (let la = 0; la < n; la++) s += C[la * n + third(q)] * B2[((i * d2 + p) * n + la) * n + si];
      B3[((i * d2 + p) * d3 + q) * n + si] = s; }
    const B4 = new Float64Array(nocc * d2 * d3 * d4);
    for (let i = 0; i < nocc; i++) for (let p = 0; p < d2; p++) for (let q = 0; q < d3; q++) for (let r = 0; r < d4; r++) {
      let s = 0; for (let si = 0; si < n; si++) s += C[si * n + fourth(r)] * B3[((i * d2 + p) * d3 + q) * n + si];
      B4[((i * d2 + p) * d3 + q) * d4 + r] = s; }
    return B4;
  };
  const v = (a) => nocc + a, o = (i) => i;
  const G = half(v, o, v, nv, nocc, nv), Q = half(o, v, v, nocc, nv, nv);    // (ia|jb) and (ij|ab)
  const gAt = (i, a, j, b) => G[((i * nv + a) * nocc + j) * nv + b];
  const qAt = (i, j, a, b) => Q[((i * nocc + j) * nv + a) * nv + b];
  const ApB = new Float64Array(nov * nov), AmB = new Float64Array(nov * nov);
  for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) for (let j = 0; j < nocc; j++) for (let b = 0; b < nv; b++) {
    const row = i * nv + a, col = j * nv + b, d = row === col ? eps[v(a)] - eps[i] : 0;
    const coul = gAt(i, a, j, b), x1 = qAt(i, j, a, b), x2 = gAt(i, b, j, a);
    ApB[row * nov + col] = d + 4 * coul - x1 - x2;
    AmB[row * nov + col] = d - x1 + x2;
  }
  const sym = (M) => { const T = new Float64Array(nov * nov);
    for (let p = 0; p < nov; p++) for (let q = 0; q < nov; q++) T[p * nov + q] = 0.5 * (M[p * nov + q] + M[q * nov + p]);
    return T; };
  const lo = (M) => eigSym(sym(M), nov).values[0];
  const lowestApB = lo(ApB), lowestAmB = lo(AmB);
  return { nOv: nov, lowestApB, lowestAmB, minimum: lowestApB > 0 && lowestAmB > 0 };
}
/** re-converge from a symmetrically perturbed density; the energy must come back */
function stabilityProbe(basisArgs, opts, out, { seed = 20260912, amplitude = 0.05 } = {}) {
  const n = out.D.length ** 0.5 | 0, rnd = mulberry32(seed), P = Float64Array.from(out.D);
  let scale = 0; for (const v of out.D) scale = Math.max(scale, Math.abs(v));
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
    const d = amplitude * scale * (2 * rnd() - 1);
    P[i * n + j] += d; if (i !== j) P[j * n + i] += d;
  }
  const re = rhf(basisArgs, { ...opts, guess: P });
  return { seed, amplitude, energy: re.energy, delta: re.energy - out.energy, converged: re.converged,
    iterations: re.iterations, same: re.converged && Math.abs(re.energy - out.energy) < 1e-10 };
}

/**
 * moleculeRHF({ atoms, basis, charge = 0, guess = 'sad', record, detect = true, diis, damping, tol, maxIter })
 *   → { energy, orbitalEnergies, C, D, basis, integrals, hash, guess, stability, solutions, ... }
 * atoms = [{ Z, x, y, z }] in bohr; basis = 'sto-3g' | '6-31+g-star'; guess = 'sad' | 'core' | an n × n density.
 * `solutions` names every converged aufbau solution found: the lowest is the ground state, any other is a second
 * (third, …) aufbau RHF solution, with the guess that reached it.
 */
export function moleculeRHF({ atoms, basis = 'sto-3g', charge = 0, guess = 'sad', record = null, detect = true,
  diis = 8, damping = 0, tol = 1e-12, maxIter = 200, stability = true, hessian = true } = {}) {
  if (!Array.isArray(atoms) || !atoms.length) throw new Error('rhf-molecule: atoms = [{ Z, x, y, z }] in bohr');
  const rec = recordFor(basis, record);
  const b = basisFrom(atoms, rec, { cart: true }), I = integrals(b, atoms);
  const nElectrons = atoms.reduce((s, a) => s + a.Z, 0) - charge;
  if (nElectrons % 2 || nElectrons < 2) throw new Error(`rhf-molecule: RHF needs an even electron count ≥ 2, got ${nElectrons}`);
  const nocc = nElectrons / 2, args = { n: I.n, S: I.S, h: I.h, eri: I.eri, Enuc: I.Enuc };
  const opts = { nElectrons, diis, damping, tol, maxIter };
  const sad = () => sadDensity(b.atoms, rec, b);
  const runs = new Map();
  const run = (name) => {
    if (runs.has(name)) return runs.get(name);
    const g = name === 'sad' ? sad() : name === 'core' ? 'core' : name;
    const out = rhf(args, { ...opts, guess: g });
    const r = { guess: typeof name === 'string' ? name : 'given', out, aufbau: aufbauReport(I, out, nocc),
      hessian: hessian && out.converged ? stabilityHessian(I, out, nocc) : null };
    runs.set(name, r); return r;
  };
  const primary = run(guess);
  if (detect) { for (const k of ['sad', 'core']) if (typeof k === 'string' && !runs.has(k)) run(k); }
  const found = [...runs.values()].filter((r) => r.out.converged).sort((a, b2) => a.out.energy - b2.out.energy);
  const distinct = [];
  for (const r of found) if (!distinct.some((d) => Math.abs(d.out.energy - r.out.energy) < 1e-7)) distinct.push(r);
  const ORD = ['ground state', 'second aufbau RHF solution', 'third aufbau RHF solution', 'fourth aufbau RHF solution'];
  const solutions = distinct.map((r, i) => ({ name: ORD[i] ?? `aufbau RHF solution ${i + 1}`, guess: r.guess,
    energy: r.out.energy, converged: r.out.converged, iterations: r.out.iterations,
    aufbau: r.aufbau, hessian: r.hessian, orbitalEnergies: [...r.out.orbitalEnergies] }));
  const mine = solutions.find((s) => Math.abs(s.energy - primary.out.energy) < 1e-7);
  const out = primary.out;
  return { energy: out.energy, electronic: out.electronic, orbitalEnergies: out.orbitalEnergies, C: out.C, D: out.D,
    F: out.F, converged: out.converged, iterations: out.iterations, nElectrons, nocc, charge,
    basis: b, integrals: I, hash: b.hash, guess: primary.guess, solutionName: mine?.name ?? null,
    aufbau: primary.aufbau, solutions,
    stability: stability ? { ...stabilityProbe(args, opts, out), hessian: primary.hessian,
      minimum: primary.hessian ? primary.hessian.minimum : null } : null,
    dipole: [0, 1, 2].map((q) => { const M = [I.X, I.Y, I.Z][q], n = I.n; let t = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) t += out.D[j * n + i] * M[i * n + j];
      return I.nuclearDipole[q] - t; }),
    electrons: (() => { const n = I.n; let t = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) t += out.D[i * n + j] * I.S[j * n + i]; return t; })() };
}
