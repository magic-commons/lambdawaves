#!/usr/bin/env node
/* tools/symmetry/unique-quartets.mjs — THE NUMBER for the SOL THREAD (λWAVES 0.4.0 · S1″): how much of the molecular
 * engine's work is redundant under the molecule's point group, MEASURED on lab/md.js's own ERI tensor.  node 22, no
 * dependencies; imports lab/ READ-ONLY by relative path (as research/molecular-orbitals-2026-10-01/names-probe.mjs does)
 * and edits nothing under lab/.
 *
 *   node tools/symmetry/unique-quartets.mjs [--out research/release-0.4.0/measure/quartets.json]
 *                                           [--oracle research/release-0.4.0/measure/pyscf-symm-oracle.json] [--grid 96] [--thr 1e-10]
 *
 * Per molecule (benzene C₆H₆ STO-3G, 36 Cartesian AO; water H₂O, 7 AO — the library's own geometries):
 *   1. the live solve — moleculeRHF at its defaults, the call lab/mathworker.js ensureSolve makes — gives S, F, C, ε and
 *      the chemist's tensor g[((i·n+j)·n+k)·n+l] = (ij|kl) exactly as md.js twoElectron fills it;
 *   2. the point group DECLARED as 3×3 matrices in the names probe's frame (benzene: z = ring normal, x through carbon 0,
 *      C₂′ and σ_v through atoms; water: Mulliken 1955, x ⊥ plane), every operation VERIFIED as an atom permutation of the
 *      framework, the AO representation M(R) (s ↦ 1, p ↦ R; c ↦ M c) checked by MᵀSM = S and MᵀFM = F on the converged Fock;
 *   3. symmetry-adapted AOs: in the Löwdin frame (X = S^{-1/2}, M′ = S^{1/2} M S^{-1/2} orthogonal) the projectors
 *      P_Γ = (d_Γ/h) Σ_R χ_Γ(R) M′(R) are symmetric orthogonal projectors; their unit eigenvectors, mapped back by X, are an
 *      S-orthonormal basis of each block ("Löwdin within the block").  Three flavours: real 1-D irreps (D₂h, C₂v, C₂);
 *      complex cyclic grades (C₆ by ζ₆^k; C₆h by ζ₆^k × the σ_h parity — the largest Abelian subgroup of D₆h, order 12);
 *      and D₆h partner blocks by the joint D₆h × D₂h projectors (D₂h ⊂ D₆h splits each 2-D irrep into two distinct 1-D ones,
 *      so the partners of E₁g, E₂g, E₁u, E₂u are fixed by their D₂h label);
 *   4. the tensor transformed to each basis (four quarter transforms, complex where the characters are) and COUNTED:
 *      non-zero entries (|v| > thr) over the full n⁴ tensor and over the canonical unique quartets (i ≤ j, k ≤ l, (ij) ≤ (kl)),
 *      beside the selection-rule prediction from the labels, the EXACT number of independent integrals
 *      dim Inv_G(Sym²Sym²V) = (1/h) Σ_R χ_{Sym²Sym²V}(R) (the character count), the 1/|G| limit, and the max |forbidden| /
 *      min |allowed non-zero| that show the gap is clean;
 *   5. the petite list on md.js's OWN loop units — orbits of the group on shell quartets (what twoElectron iterates, shell
 *      pair ≤ shell pair) — and, for the sign-flip groups whose M(R) are signed permutations, on canonical AO quartets with
 *      the sign stabiliser (the AO integrals symmetry forces to zero, verified against the tensor);
 *   6. the Fock blocks Σ n_Γ²/n² and Σ n_Γ³/n³; the occupied count per block (tr P_occ P_Γ, an integer); the RPA pair-space
 *      blocks m_Λ = Σ_Γ nocc_Γ · nvir_{Γ⊗Λ} with Σ m_Λ²/m², Σ m_Λ³/m³ (D₆h by characters of V_occ ⊗ V_vir); the MO clusters
 *      labelled by block weight (a cross-check of the probe's names) and the worst off-block leakage of the solver's C;
 *   7. the π ring as the cyclotomic reading made concrete: the six carbon p_z form a circulant F and S in ring order, and
 *      the DFT ε_k = F̃(k)/S̃(k) is compared with the solver's own π orbital energies;
 *   8. timings of the pieces a symmetry-adapted SCF would shrink: the integral pass, one fockReal, one eigSym, one hessianBlocks;
 *   9. the field grid (lab/field.js: cell-centred, pos = (gid + ½)/n·2·half − half, n = 96): orbits and fixed voxels under
 *      the molecule's sign-flip operations, and for every other D₆h operation how many voxel centres land on the lattice at
 *      all; the odd, node-centred grid (n = 97) beside it as the contrast whose boundary a reconstruction must treat twice.
 * Output: the JSON (--out) and a markdown digest on stdout.  The frame, operation lists, character tables, checkOp and aoRep
 * are the names probe's, copied here so this tool imports lab/ only (the probe is a script that solves on import).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moleculeRHF, registerRecord } from '../../lab/rhf-molecule.js';
import { MOLECULE_BY_ID, moleculeAtoms, moleculeCharge } from '../../lab/molecules.js';
import { fockReal } from '../../lab/scf.js';
import { eigSym } from '../../lab/h2ci.js';
import { loewdin } from '../../lab/density.js';
import { hessianBlocks } from '../../lab/rpa-inspector.js';
import { clusterRanges } from '../../lab/canon-gauge.js';

const ROOT = new URL('../../', import.meta.url);
const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(name); return i >= 0 && i + 1 < args.length ? args[i + 1] : dflt; };
const OUT = flag('--out', fileURLToPath(new URL('research/release-0.4.0/measure/quartets.json', ROOT)));
const ORACLE = flag('--oracle', fileURLToPath(new URL('research/release-0.4.0/measure/pyscf-symm-oracle.json', ROOT)));
const GRID = +flag('--grid', 96);
const THR = +flag('--thr', 1e-10);
const record = JSON.parse(readFileSync(new URL('lab/vendor/bse/sto-3g-v1.json', ROOT), 'utf8'));
registerRecord('sto-3g', record);

/* ── 3-vectors and row-major 3×3 (the probe's) ──────────────────────────────────────────────────────────────── */
const P3 = (a) => [a.x, a.y, a.z];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const unit = (a) => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));
const mv = (R, v) => [0, 1, 2].map((i) => R[i * 3] * v[0] + R[i * 3 + 1] * v[1] + R[i * 3 + 2] * v[2]);
const mm3 = (A, B) => { const o = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j]; return o; };
const tp3 = (A) => [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]];
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const neg = (A) => A.map((v) => -v);
const diag3 = (a, b, c) => [a, 0, 0, 0, b, 0, 0, 0, c];
const Rz = (t) => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1];
const sigmaV = (phi) => [Math.cos(2 * phi), Math.sin(2 * phi), 0, Math.sin(2 * phi), -Math.cos(2 * phi), 0, 0, 0, 1];
const c2In = (phi) => [Math.cos(2 * phi), Math.sin(2 * phi), 0, Math.sin(2 * phi), -Math.cos(2 * phi), 0, 0, 0, -1];
const frameXYZ = (z, x) => { const zz = unit(z), xx = unit(sub(x, scale(zz, dot(x, zz)))); return { x: xx, y: cross(zz, xx), z: zz }; };

/* ── character tables as data (the probe's; class order = column order; every irrep real) ─────────────────── */
const TABLES = {
  C2v: { classes: ['E', 'C2', 'sv(xz)', 'sv(yz)'], sizes: [1, 1, 1, 1], irreps: { A1: [1, 1, 1, 1], A2: [1, 1, -1, -1], B1: [1, -1, 1, -1], B2: [1, -1, -1, 1] } },
  C2: { classes: ['E', 'C2'], sizes: [1, 1], irreps: { A: [1, 1], B: [1, -1] } },
  D2h: { classes: ['E', 'C2(z)', 'C2(y)', 'C2(x)', 'i', 's(xy)', 's(xz)', 's(yz)'], sizes: [1, 1, 1, 1, 1, 1, 1, 1], irreps: {
    Ag: [1, 1, 1, 1, 1, 1, 1, 1], B1g: [1, 1, -1, -1, 1, 1, -1, -1], B2g: [1, -1, 1, -1, 1, -1, 1, -1], B3g: [1, -1, -1, 1, 1, -1, -1, 1],
    Au: [1, 1, 1, 1, -1, -1, -1, -1], B1u: [1, 1, -1, -1, -1, -1, 1, 1], B2u: [1, -1, 1, -1, -1, 1, -1, 1], B3u: [1, -1, -1, 1, -1, 1, 1, -1] } },
  D6h: { classes: ['E', '2C6', '2C3', 'C2', '3C2p', '3C2pp', 'i', '2S3', '2S6', 'sh', '3sd', '3sv'], sizes: [1, 2, 2, 1, 3, 3, 1, 2, 2, 1, 3, 3], irreps: {
    A1g: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], A2g: [1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, -1],
    B1g: [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1], B2g: [1, -1, 1, -1, -1, 1, 1, -1, 1, -1, -1, 1],
    E1g: [2, 1, -1, -2, 0, 0, 2, 1, -1, -2, 0, 0], E2g: [2, -1, -1, 2, 0, 0, 2, -1, -1, 2, 0, 0],
    A1u: [1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1], A2u: [1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, 1],
    B1u: [1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1], B2u: [1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1],
    E1u: [2, 1, -1, -2, 0, 0, -2, -1, 1, 2, 0, 0], E2u: [2, -1, -1, 2, 0, 0, -2, 1, 1, -2, 0, 0] } },
};
function selfTestTables() {
  for (const [g, T] of Object.entries(TABLES)) {
    const h = T.sizes.reduce((a, b) => a + b, 0), names = Object.keys(T.irreps); let worst = 0;
    for (const a of names) for (const b of names) { let s = 0; T.classes.forEach((_, c) => { s += T.sizes[c] * T.irreps[a][c] * T.irreps[b][c]; }); worst = Math.max(worst, Math.abs(s - (a === b ? h : 0))); }
    const dim2 = names.reduce((s, a) => s + T.irreps[a][0] ** 2, 0);
    if (worst !== 0 || dim2 !== h || names.length !== T.classes.length) throw new Error(`character table ${g} fails its self-test`);
  }
}

/* ── the declared operations: [name, class, R in the symmetry frame] (the probe's lists; C2 and C6/C6h added) ── */
const OPS = {
  C2v: () => [['E', 'E', I3], ['C2', 'C2', diag3(-1, -1, 1)], ['sv(xz)', 'sv(xz)', diag3(1, -1, 1)], ['sv(yz)', 'sv(yz)', diag3(-1, 1, 1)]],
  C2: () => [['E', 'E', I3], ['C2', 'C2', diag3(-1, -1, 1)]],
  D2h: () => [['E', 'E', I3], ['C2(z)', 'C2(z)', diag3(-1, -1, 1)], ['C2(y)', 'C2(y)', diag3(-1, 1, -1)], ['C2(x)', 'C2(x)', diag3(1, -1, -1)],
    ['i', 'i', neg(I3)], ['s(xy)', 's(xy)', diag3(1, 1, -1)], ['s(xz)', 's(xz)', diag3(1, -1, 1)], ['s(yz)', 's(yz)', diag3(-1, 1, 1)]],
  D6h: () => {
    const th = Math.PI / 3, out = [['E', 'E', I3]], C6 = (k) => Rz(k * th), sh = diag3(1, 1, -1);
    for (const k of [1, 5]) out.push([`C6^${k}`, '2C6', C6(k)]);
    for (const k of [2, 4]) out.push([`C3^${k / 2}`, '2C3', C6(k)]);
    out.push(['C2', 'C2', C6(3)]);
    for (const j of [0, 1, 2]) out.push([`C2'(${j * 60}deg)`, '3C2p', c2In(j * th)]);
    for (const j of [0, 1, 2]) out.push([`C2''(${30 + j * 60}deg)`, '3C2pp', c2In(Math.PI / 6 + j * th)]);
    out.push(['i', 'i', neg(I3)]);
    for (const k of [2, 4]) out.push([`S3^${k}`, '2S3', mm3(sh, C6(k))]);
    for (const k of [1, 5]) out.push([`S6^${k}`, '2S6', mm3(sh, C6(k))]);
    out.push(['sh', 'sh', sh]);
    for (const j of [0, 1, 2]) out.push([`sd(${30 + j * 60}deg)`, '3sd', sigmaV(Math.PI / 6 + j * th)]);
    for (const j of [0, 1, 2]) out.push([`sv(${j * 60}deg)`, '3sv', sigmaV(j * th)]);
    return out;
  },
  /* the cyclic ring: C6^m, m = 0..5, in that order (m is the grade's exponent) */
  C6: () => [0, 1, 2, 3, 4, 5].map((m) => [`C6^${m}`, `m${m}`, Rz(m * Math.PI / 3)]),
  /* C6h = C6 × {E, σh}: the largest Abelian subgroup of D6h (order 12); class = (m, parity) */
  C6h: () => { const sh = diag3(1, 1, -1); const out = [];
    for (const par of [1, -1]) for (const m of [0, 1, 2, 3, 4, 5]) out.push([`${par > 0 ? '' : 'sh·'}C6^${m}`, `m${m}${par > 0 ? '+' : '-'}`, par > 0 ? Rz(m * Math.PI / 3) : mm3(sh, Rz(m * Math.PI / 3))]);
    return out; },
};
/* the molecules' frames, built from their own atoms (the probe's) */
const FRAMES = {
  H2O: { convention: 'Mulliken 1955 (planar C2v): z = the C2 axis (O toward the H midpoint), x PERPENDICULAR to the molecular plane (molecule in yz)',
    frame: (A) => { const [O, H1, H2] = A.map(P3); const z = unit(sub(add(H1, H2), scale(O, 2))), nrm = unit(cross(sub(H1, O), sub(H2, O))); return { x: nrm, y: cross(z, nrm), z }; } },
  C6H6: { convention: "z = C6 axis (ring normal), x through carbon 0; C2' and sigma_v through atoms, C2'' and sigma_d through bond midpoints (pi = a2u + b2g + e1g + e2u)",
    frame: (A) => { const C0 = P3(A[0]), C1 = P3(A[2]), C2 = P3(A[4]); const z = unit(cross(sub(C1, C0), sub(C2, C0))); return frameXYZ(z, C0); } },
};
/* which groups each molecule is measured under; `sign` = the sign-flip subgroup that acts on the Cartesian grid */
const STUDY = {
  C6H6: { full: 'D6h', groups: ['D2h', 'C6', 'C6h', 'D6h'], sign: 'D2h' },
  H2O: { full: 'C2v', groups: ['C2v', 'C2'], sign: 'C2v' },
};

/* ── geometry: centre of nuclear charge, operation verification, the AO representation (the probe's) ───────── */
function chargeCentre(A) { let s = [0, 0, 0], Zt = 0; for (const a of A) { s = add(s, scale(P3(a), a.Z)); Zt += a.Z; } return scale(s, 1 / Zt); }
function checkOp(A, c, Rlab) {
  const perm = [], used = new Set(); let worst = 0;
  A.forEach((a) => {
    const r2 = add(c, mv(Rlab, sub(P3(a), c))); let best = -1, bd = Infinity;
    A.forEach((b, ib) => { if (b.Z !== a.Z) return; const d = Math.hypot(...sub(P3(b), r2)); if (d < bd) { bd = d; best = ib; } });
    perm.push(best); used.add(best); worst = Math.max(worst, bd);
  });
  return { perm, worst, bijective: used.size === A.length };
}
/** c ↦ M c with M[(B,j),(A,i)] = R_ji for p, 1 for s: the AO coefficient representation (s and p only, as STO-3G H–F is) */
function aoRep(basis, perm, R) {
  const n = basis.n, M = new Float64Array(n * n), shellsOf = [];
  for (const sh of basis.shells) (shellsOf[sh.atom] ??= []).push(sh);
  for (const A of shellsOf.keys()) shellsOf[A].forEach((sh, p) => {
    const img = shellsOf[perm[A]][p];
    if (img.l !== sh.l) throw new Error('aoRep: the image atom has a different shell list');
    if (sh.l === 0) M[img.bfs[0].idx * n + sh.bfs[0].idx] = 1;
    else if (sh.l === 1) { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      if (sh.bfs[i].l[i] !== 1 || img.bfs[j].l[j] !== 1) throw new Error('aoRep: p components are not in x,y,z order');
      M[img.bfs[j].idx * n + sh.bfs[i].idx] = R[j * 3 + i]; } }
    else throw new Error(`aoRep: a Cartesian l = ${sh.l} shell needs its own 6x6 block (not implemented)`);
  });
  return M;
}

/* ── dense n×n linear algebra ───────────────────────────────────────────────────────────────────────────────── */
const matmul = (A, B, n) => { const o = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i * n + k]; if (a === 0) continue; for (let j = 0; j < n; j++) o[i * n + j] += a * B[k * n + j]; } return o; };
const transpose = (A, n) => { const o = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) o[j * n + i] = A[i * n + j]; return o; };
const maxDiff = (A, B) => { let m = 0; for (let i = 0; i < A.length; i++) m = Math.max(m, Math.abs(A[i] - B[i])); return m; };
const trace = (A, n) => { let t = 0; for (let i = 0; i < n; i++) t += A[i * n + i]; return t; };
const identity = (n) => { const I = new Float64Array(n * n); for (let i = 0; i < n; i++) I[i * n + i] = 1; return I; };
const symmetrise = (A, n) => { for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const v = 0.5 * (A[i * n + j] + A[j * n + i]); A[i * n + j] = A[j * n + i] = v; } return A; };
const matvec = (A, v, n) => { const o = new Float64Array(n); for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < n; j++) s += A[i * n + j] * v[j]; o[i] = s; } return o; };
const vdot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
/** the unit eigenvectors of a symmetric projector with eigenvalue 1, as an array of Float64Array(n); eigenvalues must be 0/1 */
function projectorRange(Pp, n, tag) {
  symmetrise(Pp, n);
  const e = eigSym(Pp, n), cols = []; let worst = 0;
  for (let k = 0; k < n; k++) { const v = e.values[k]; worst = Math.max(worst, Math.min(Math.abs(v), Math.abs(v - 1))); if (v > 0.5) { const u = new Float64Array(n); for (let i = 0; i < n; i++) u[i] = e.vectors[i * n + k]; cols.push(u); } }
  if (worst > 1e-8) throw new Error(`${tag}: projector eigenvalues are not 0/1 (worst defect ${worst})`);
  return { cols, defect: worst };
}

/* ── the four-index transform: four quarter transforms on the leading index, rotating the layout between them ── */
function quarterReal(g, A, n) {                       // T[p, t] = Σ_i A[i·n+p] g[i, t]
  const n3 = n * n * n, T = new Float64Array(n * n3);
  for (let i = 0; i < n; i++) { const src = i * n3; for (let p = 0; p < n; p++) { const a = A[i * n + p]; if (a === 0) continue; const dst = p * n3; for (let t = 0; t < n3; t++) T[dst + t] += a * g[src + t]; } }
  return T;
}
function quarterComplex(gre, gim, Ar, Ai, conj, n) {  // A_eff = Ar + i·s·Ai, s = −1 when conjugated
  const s = conj ? -1 : 1, n3 = n * n * n, Tre = new Float64Array(n * n3), Tim = new Float64Array(n * n3);
  for (let i = 0; i < n; i++) { const src = i * n3; for (let p = 0; p < n; p++) {
    const ar = Ar[i * n + p], ai = s * Ai[i * n + p]; if (ar === 0 && ai === 0) continue; const dst = p * n3;
    for (let t = 0; t < n3; t++) { const xr = gre[src + t], xi = gim[src + t]; Tre[dst + t] += ar * xr - ai * xi; Tim[dst + t] += ar * xi + ai * xr; } } }
  return [Tre, Tim];
}
function rotate(T, n) {                               // (p, j, k, l) → (j, k, l, p)
  const n3 = n * n * n, R = new Float64Array(n * n3);
  for (let p = 0; p < n; p++) { const src = p * n3; for (let t = 0; t < n3; t++) R[t * n + p] = T[src + t]; }
  return R;
}
/** (pq|rs) = Σ conj(U_ip) U_jq conj(U_kr) U_ls g_ijkl; Ui = null for a real basis */
function transform4(g, n, Ur, Ui) {
  let re = g, im = Ui ? new Float64Array(g.length) : null;
  for (let step = 0; step < 4; step++) {
    if (Ui) [re, im] = quarterComplex(re, im, Ur, Ui, step === 0 || step === 2, n); else re = quarterReal(re, Ur, n);
    re = rotate(re, n); if (im) im = rotate(im, n);
  }
  return { re, im };
}

/* ── counting the transformed tensor against a label predicate ──────────────────────────────────────────────── */
function countTensor(re, im, n, thr, allowed) {
  const c = { entries: n ** 4, nonzero: 0, allowed: 0, nonzeroAllowed: 0, violations: 0, maxForbidden: 0, minAllowedNonzero: Infinity,
    canonical: { quartets: 0, nonzero: 0, allowed: 0 } };
  for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) for (let r = 0; r < n; r++) for (let s = 0; s < n; s++) {
    const idx = ((p * n + q) * n + r) * n + s, vr = re[idx], vi = im ? im[idx] : 0, mag = Math.hypot(vr, vi);
    const nz = mag > thr, ok = allowed(p, q, r, s), canon = p <= q && r <= s && p * n + q <= r * n + s;
    if (nz) c.nonzero++; if (ok) c.allowed++; if (nz && ok) c.nonzeroAllowed++;
    if (nz && !ok) c.violations++;
    if (!ok) c.maxForbidden = Math.max(c.maxForbidden, mag); else if (nz) c.minAllowedNonzero = Math.min(c.minAllowedNonzero, mag);
    if (canon) { c.canonical.quartets++; if (nz) c.canonical.nonzero++; if (ok) c.canonical.allowed++; }
  }
  c.fraction = c.nonzero / c.entries; c.allowedFraction = c.allowed / c.entries;
  c.canonical.fraction = c.canonical.nonzero / c.canonical.quartets; c.canonical.allowedFraction = c.canonical.allowed / c.canonical.quartets;
  if (c.minAllowedNonzero === Infinity) c.minAllowedNonzero = null;
  return c;
}
/** dim Inv_G(Sym² Sym² V) = (1/h) Σ_R χ_{S²S²V}(R), with χ_{S²W}(R) = (χ_W(R)² + χ_W(R²))/2 — the exact count of independent
    ERIs under the group (and of independent V⊗4 and Sym²V tensors beside it) */
function invariantCounts(ops, n) {
  let s22 = 0, s4 = 0, s2 = 0;
  for (const o of ops) {
    const M2 = matmul(o.M, o.M, n), M4 = matmul(M2, M2, n), x1 = trace(o.M, n), x2 = trace(M2, n), x4 = trace(M4, n);
    const sym2R = (x1 * x1 + x2) / 2, sym2R2 = (x2 * x2 + x4) / 2;
    s22 += (sym2R * sym2R + sym2R2) / 2; s4 += x1 ** 4; s2 += sym2R;
  }
  const h = ops.length, r = (v) => { const q = v / h; if (Math.abs(q - Math.round(q)) > 1e-6) throw new Error(`invariant count ${q} is not an integer`); return Math.round(q); };
  return { sym2sym2: r(s22), tensor4: r(s4), sym2: r(s2) };
}

/* ── the petite lists: orbits of the group on md.js's loop units ────────────────────────────────────────────── */
/** shells permute with their atoms; canonical shell quartet = (pair a ≤ b) ≤ (pair c ≤ d) — twoElectron's own unit */
function shellOrbits(basis, ops) {
  const sh = basis.shells, ns = sh.length, shellsOf = [];
  sh.forEach((s, idx) => (shellsOf[s.atom] ??= []).push(idx));
  const perms = ops.map((o) => { const sp = new Int32Array(ns); shellsOf.forEach((list, A) => list.forEach((sIdx, p) => { sp[sIdx] = shellsOf[o.perm[A]][p]; })); return sp; });
  const key = (a, b, c, d) => { if (a > b) [a, b] = [b, a]; if (c > d) [c, d] = [d, c]; if (a * ns + b > c * ns + d) [a, b, c, d] = [c, d, a, b]; return ((a * ns + b) * ns + c) * ns + d; };
  const visited = new Uint8Array(ns ** 4); let total = 0, orbits = 0; const hist = {};
  for (let a = 0; a < ns; a++) for (let b = a; b < ns; b++) for (let c = 0; c < ns; c++) for (let d = c; d < ns; d++) {
    if (a * ns + b > c * ns + d) continue; total++;
    const k0 = key(a, b, c, d); if (visited[k0]) continue;
    const seen = new Set();
    for (const sp of perms) { const k = key(sp[a], sp[b], sp[c], sp[d]); seen.add(k); visited[k] = 1; }
    orbits++; hist[seen.size] = (hist[seen.size] || 0) + 1;
  }
  return { shells: ns, shellPairs: ns * (ns + 1) / 2, shellQuartets: total, orbits, fraction: orbits / total, orbitSizes: hist };
}
/** for groups whose M(R) are signed permutations: orbits of canonical AO quartets with the sign stabiliser (forced zeros) */
function aoOrbits(ops, n, g, thr) {
  const sp = ops.map((o) => { const perm = new Int32Array(n), sign = new Int8Array(n);
    for (let i = 0; i < n; i++) { let hits = 0; for (let j = 0; j < n; j++) { const v = o.M[j * n + i]; if (Math.abs(v) > 1e-12) { hits++; if (Math.abs(Math.abs(v) - 1) > 1e-12) return null; perm[i] = j; sign[i] = v > 0 ? 1 : -1; } } if (hits !== 1) return null; }
    return { perm, sign }; });
  if (sp.some((x) => x === null)) return { signedPermutation: false };
  const key = (a, b, c, d) => { if (a > b) [a, b] = [b, a]; if (c > d) [c, d] = [d, c]; if (a * n + b > c * n + d) [a, b, c, d] = [c, d, a, b]; return ((a * n + b) * n + c) * n + d; };
  const visited = new Uint8Array(n ** 4); let total = 0, orbits = 0, forcedZeroOrbits = 0, forcedZeroQuartets = 0, accidentalZeroOrbits = 0, maxForced = 0, minLive = Infinity;
  const hist = {};
  for (let a = 0; a < n; a++) for (let b = a; b < n; b++) for (let c = 0; c < n; c++) for (let d = c; d < n; d++) {
    if (a * n + b > c * n + d) continue; total++;
    const k0 = key(a, b, c, d); if (visited[k0]) continue;
    const seen = new Set(); let forced = false;
    for (const { perm, sign } of sp) { const k = key(perm[a], perm[b], perm[c], perm[d]); const s = sign[a] * sign[b] * sign[c] * sign[d]; if (k === k0 && s < 0) forced = true; seen.add(k); visited[k] = 1; }
    orbits++; hist[seen.size] = (hist[seen.size] || 0) + 1;
    const mag = Math.abs(g[((a * n + b) * n + c) * n + d]);
    if (forced) { forcedZeroOrbits++; forcedZeroQuartets += seen.size; maxForced = Math.max(maxForced, mag); }
    else { if (mag <= thr) accidentalZeroOrbits++; else minLive = Math.min(minLive, mag); }
  }
  return { signedPermutation: true, canonicalQuartets: total, orbits, fraction: orbits / total, forcedZeroOrbits, forcedZeroQuartets, forcedZeroFraction: forcedZeroQuartets / total,
    liveOrbits: orbits - forcedZeroOrbits, liveFraction: (orbits - forcedZeroOrbits) / total, accidentalZeroOrbits, maxAbsForcedZero: maxForced, minAbsLive: minLive, orbitSizes: hist };
}

/* ── the grid: lab/field.js samples voxel centres (gid + ½)/n · 2·half − half, symmetric about the origin ──── */
function gridStudy(N, signOps, otherOps) {
  const N3 = N * N * N, off = (N - 1) / 2, visited = new Uint8Array(N3), hist = {};
  const signs = signOps.map((o) => { const R = o.Rlab, d = [Math.round(R[0]), Math.round(R[4]), Math.round(R[8])];
    for (let t = 0; t < 9; t++) if (Math.abs(R[t] - (t % 4 === 0 ? d[t / 4] : 0)) > 1e-9) throw new Error(`grid: ${o.name} is not a sign flip in the lab frame`); return d; });
  let orbits = 0, boundaryVoxels = 0;
  for (let idx = 0; idx < N3; idx++) {
    if (visited[idx]) continue;
    const i = Math.floor(idx / (N * N)), j = Math.floor(idx / N) % N, k = idx % N, c = [i - off, j - off, k - off];
    const seen = new Set(); let fixed = false;
    signs.forEach((s, r) => { const ii = s[0] * c[0] + off, jj = s[1] * c[1] + off, kk = s[2] * c[2] + off; const key = (ii * N + jj) * N + kk; if (key === idx && r > 0) fixed = true; seen.add(key); visited[key] = 1; });
    orbits++; hist[seen.size] = (hist[seen.size] || 0) + 1; if (fixed) boundaryVoxels += seen.size;
  }
  const latticeCompatible = otherOps.map((o) => { let count = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
      const c = mv(o.Rlab, [i - off, j - off, k - off]); let ok = true;
      for (let q = 0; q < 3; q++) { const u = c[q] + off; if (Math.abs(u - Math.round(u)) > 1e-9 || u < -0.5 || u > N - 0.5) { ok = false; break; } }
      if (ok) count++; }
    return { op: o.name, voxelsMappedOntoLattice: count }; });
  return { n: N, voxels: N3, centred: N % 2 === 0 ? 'cell-centred (half-integer centres, no centre on any coordinate plane)' : 'node-centred (a centre on every coordinate plane)',
    signOps: signOps.map((o) => o.name), orbits, asymmetricUnitFraction: orbits / N3, boundaryVoxels, boundaryFraction: boundaryVoxels / N3, orbitSizes: hist, latticeCompatible };
}

/* ── one molecule ───────────────────────────────────────────────────────────────────────────────────────────── */
function study(id) {
  selfTestTables();
  const atoms = moleculeAtoms(id), m = MOLECULE_BY_ID.get(id), out = { id, formula: m.formula.replace(/<\/?m>/g, ''), geometrySource: m.source };
  const t0 = performance.now();
  const sol = moleculeRHF({ atoms, basis: 'sto-3g', charge: moleculeCharge(id), record });   // lab/mathworker.js ensureSolve's call
  out.solveMs = +(performance.now() - t0).toFixed(1);
  const n = sol.integrals.n, S = sol.integrals.S, F = sol.F, C = sol.C, eps = Array.from(sol.orbitalEnergies), nocc = sol.nocc, g = sol.integrals.eri;
  Object.assign(out, { nAO: n, nocc, nElectrons: sol.nElectrons, energy: sol.energy, converged: sol.converged, integralMs: sol.timings.integrals,
    eriWorkTrips: m.eriWork, predictedMs: m.predictedMs, basisHash: sol.hash });
  /* the instrument's pieces, timed once each */
  let t = performance.now(); fockReal({ h: sol.integrals.h, eri: g, n }, sol.D); const fockMs = performance.now() - t;
  const { X, W } = loewdin(S, n);
  const Fp = matmul(matmul(X, F, n), X, n); t = performance.now(); eigSym(symmetrise(Fp, n), n); const eigMs = performance.now() - t;
  t = performance.now(); const hb = hessianBlocks({ eri: g, C, eps: sol.orbitalEnergies, nocc, n }); const hessMs = performance.now() - t;
  out.timingsMs = { integrals: sol.timings.integrals, fockReal: +fockMs.toFixed(2), eigSymFock: +eigMs.toFixed(2), hessianBlocks: +hessMs.toFixed(1), pairSpace: hb.nOv };
  /* the frame and the full group's operations */
  const c = chargeCentre(atoms), ax = FRAMES[id].frame(atoms), Fm = [ax.x[0], ax.y[0], ax.z[0], ax.x[1], ax.y[1], ax.z[1], ax.x[2], ax.y[2], ax.z[2]];
  const toLab = (R) => mm3(Fm, mm3(R, tp3(Fm)));
  out.frame = { convention: FRAMES[id].convention, axesInLab: { x: ax.x, y: ax.y, z: ax.z }, centreOfNuclearChargeBohr: c };
  const makeOps = (gname) => OPS[gname]().map(([name, cls, R]) => {
    const Rlab = toLab(R), ck = checkOp(atoms, c, Rlab);
    if (!ck.bijective || ck.worst > 1e-8) throw new Error(`${id} ${gname}: ${name} is not a symmetry of the framework (worst ${ck.worst})`);
    const M = aoRep(sol.basis, ck.perm, Rlab), Mt = transpose(M, n);
    const dS = maxDiff(matmul(matmul(Mt, S, n), M, n), S), dF = maxDiff(matmul(matmul(Mt, F, n), M, n), F);
    const Mp = matmul(matmul(W, M, n), X, n);
    return { name, cls, R, Rlab, perm: ck.perm, worst: ck.worst, fixedAtoms: ck.perm.filter((b, a) => b === a).length, M, Mp, dS, dF, trace: trace(M, n), matches: null };
  });
  const groups = {}; for (const gname of STUDY[id].groups) groups[gname] = makeOps(gname);
  const fullOps = groups[STUDY[id].full];
  for (const [gname, ops] of Object.entries(groups)) for (const o of ops) { const hit = fullOps.find((f) => maxDiff(f.R, o.R) < 1e-12); o.matches = hit ? hit.name : null; if (!hit) throw new Error(`${gname} ${o.name} is not in ${STUDY[id].full}`); }
  out.operations = Object.fromEntries(Object.entries(groups).map(([gname, ops]) => [gname, { order: ops.length, worstFrameworkResidualBohr: Math.max(...ops.map((o) => o.worst)),
    worstOverlapInvariance: Math.max(...ops.map((o) => o.dS)), worstFockInvariance: Math.max(...ops.map((o) => o.dF)),
    ops: ops.map((o) => ({ name: o.name, class: o.cls, inFullGroup: o.matches, fixedAtoms: o.fixedAtoms, aoCharacter: +o.trace.toFixed(10) })) }]));
  /* helpers over the solver's orbitals */
  const SC = matmul(S, C, n);                                                           // (S C)[i,k]
  const weightOf = (ur, ui, k) => { let a = 0, b = 0; for (let i = 0; i < n; i++) { a += ur[i] * SC[i * n + k]; if (ui) b += ui[i] * SC[i * n + k]; } return a * a + b * b; };
  const clusters = clusterRanges(eps, 1e-8);
  const chiOcc = (o) => { const SM = matmul(S, o.M, n); let tsum = 0; for (let k = 0; k < nocc; k++) for (let i = 0; i < n; i++) { let r = 0; for (let j = 0; j < n; j++) r += SM[i * n + j] * C[j * n + k]; tsum += r * C[i * n + k]; } return tsum; };
  const limitFraction = (h) => 1 / h;
  /** finish a group's record from its ordered SAO columns (AO frame) and label data */
  const finish = (gname, ops, blocks, cols, allowed, extra = {}) => {
    const h = ops.length, Ur = new Float64Array(n * n), Ui = cols.some((cc) => cc.ui) ? new Float64Array(n * n) : null;
    cols.forEach((cc, p) => { for (let i = 0; i < n; i++) { Ur[i * n + p] = cc.ur[i]; if (Ui && cc.ui) Ui[i * n + p] = cc.ui[i]; } });
    /* S-orthonormality of the whole basis: Uᴴ S U = I */
    let worstOrtho = 0; { const SUr = matmul(S, Ur, n), SUi = Ui ? matmul(S, Ui, n) : null;
      for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) { let re = 0, im = 0; for (let i = 0; i < n; i++) { const ar = Ur[i * n + p], ai = Ui ? Ui[i * n + p] : 0, br = SUr[i * n + q], bi = SUi ? SUi[i * n + q] : 0; re += ar * br + ai * bi; im += ar * bi - ai * br; } worstOrtho = Math.max(worstOrtho, Math.hypot(re - (p === q ? 1 : 0), im)); } }
    const tt = performance.now(); const { re, im } = transform4(g, n, Ur, Ui); const transformMs = performance.now() - tt;
    const count = countTensor(re, im, n, THR, allowed);
    const inv = invariantCounts(ops, n);
    const sizes = blocks.map((b) => b.size), n2 = sizes.reduce((s, v) => s + v * v, 0), n3 = sizes.reduce((s, v) => s + v ** 3, 0);
    /* occupied per block (tr P_occ P_Γ), the virtuals, and the clusters' decompositions */
    const occ = blocks.map((b) => { let w = 0; for (const cc of b.cols) for (let k = 0; k < nocc; k++) w += weightOf(cc.ur, cc.ui, k); return w; });
    const occInt = occ.map((w) => Math.round(w)), occResid = Math.max(...occ.map((w, i) => Math.abs(w - occInt[i])));
    let worstLeak = 0; const mos = [];
    for (let k = 0; k < n; k++) { const w = blocks.map((b) => b.cols.reduce((s, cc) => s + weightOf(cc.ur, cc.ui, k), 0)); const best = w.indexOf(Math.max(...w)); worstLeak = Math.max(worstLeak, 1 - w[best]); mos.push({ k: k + 1, eps: eps[k], block: blocks[best].label, weight: w[best] }); }
    const clusterRows = clusters.map(([a, b]) => { const w = blocks.map((bl) => { let s = 0; for (const cc of bl.cols) for (let k = a; k < b; k++) s += weightOf(cc.ur, cc.ui, k); return s; });
      return { mo: a + 1 === b ? `${a + 1}` : `${a + 1}-${b}`, eps: +eps[a].toFixed(6), occ: a < nocc ? 2 * (b - a) : 0, decomposition: w.map((v, i) => [v, blocks[i].label]).filter(([v]) => v > 1e-6).map(([v, l]) => (Math.abs(v - 1) < 1e-6 ? l : `${v.toFixed(3)}·${l}`)).join(' + ') }; });
    const rec = { group: gname, order: h, blocks: blocks.map((b, i) => ({ label: b.label, size: b.size, occupied: occInt[i], virtual: b.size - occInt[i], ...(b.meta || {}) })),
      saoOrthonormalityDefect: worstOrtho, occupiedCountResidual: occResid, worstMoOffBlockLeakage: worstLeak,
      fock: { sumN2overN2: n2 / (n * n), sumN3overN3: n3 / n ** 3, equalBlocksN2: limitFraction(blocks.length), equalBlocksN3: 1 / blocks.length ** 2 },
      eri: { threshold: THR, fullTensor: { entries: count.entries, nonzero: count.nonzero, fraction: count.fraction, allowedByLabels: count.allowed, allowedFraction: count.allowedFraction,
          violations: count.violations, maxAbsForbidden: count.maxForbidden, minAbsAllowedNonzero: count.minAllowedNonzero },
        canonicalUnique: { quartets: count.canonical.quartets, nonzero: count.canonical.nonzero, fraction: count.canonical.fraction, allowedByLabels: count.canonical.allowed, allowedFraction: count.canonical.allowedFraction },
        independentIntegrals: { symSymInvariants: inv.sym2sym2, fractionOfCanonical: inv.sym2sym2 / count.canonical.quartets, tensor4Invariants: inv.tensor4, fractionOfN4: inv.tensor4 / n ** 4, sym2Invariants: inv.sym2 },
        limitOneOverOrder: limitFraction(h), transformMs: +transformMs.toFixed(0) },
      petiteList: { shellQuartets: shellOrbits(sol.basis, ops), aoQuartets: aoOrbits(ops, n, g, THR) },
      clusters: clusterRows, mos: mos.filter((r) => r.k <= nocc + 4), ...extra };
    return rec;
  };
  /* products of Abelian labels, for the RPA pair blocks */
  const pairBlocksAbelian = (blocks, mul) => { const mLam = blocks.map((lam) => blocks.reduce((s, G) => { const tgt = mul(G, lam); return s + G.occupied * blocks[tgt].virtual; }, 0));
    const mtot = mLam.reduce((s, v) => s + v, 0), m2 = mLam.reduce((s, v) => s + v * v, 0), m3 = mLam.reduce((s, v) => s + v ** 3, 0);
    return { pairSpace: mtot, blocks: blocks.map((b, i) => ({ excitation: b.label, size: mLam[i] })), sumM2overM2: m2 / mtot ** 2, sumM3overM3: m3 / mtot ** 3, equalBlocksM2: 1 / blocks.length }; };
  out.groups = {};
  /* ── real 1-D Abelian groups (D2h, C2v, C2) ── */
  for (const gname of STUDY[id].groups.filter((x) => ['D2h', 'C2v', 'C2'].includes(x))) {
    const ops = groups[gname], T = TABLES[gname], h = ops.length, classOf = ops.map((o) => T.classes.indexOf(o.cls));
    const blocks = [], cols = [];
    for (const [label, row] of Object.entries(T.irreps)) {
      const Pp = new Float64Array(n * n); ops.forEach((o, r) => { const w = row[classOf[r]] / h; for (let t = 0; t < n * n; t++) Pp[t] += w * o.Mp[t]; });
      const { cols: vs } = projectorRange(Pp, n, `${id} ${gname} ${label}`);
      const chi = ops.map((o, r) => row[classOf[r]]), mask = chi.reduce((m, v, r) => m | ((v < 0 ? 1 : 0) << r), 0);
      const bc = vs.map((v) => ({ ur: matvec(X, v, n), ui: null, mask, block: blocks.length }));
      blocks.push({ label, size: vs.length, cols: bc, chi, mask }); cols.push(...bc);
    }
    const colMask = cols.map((cc) => cc.mask);
    const allowed = (p, q, r, s) => (colMask[p] ^ colMask[q] ^ colMask[r] ^ colMask[s]) === 0;
    const rec = finish(gname, ops, blocks, cols, allowed);
    rec.rpaBlocks = pairBlocksAbelian(rec.blocks.map((b, i) => ({ ...b, mask: blocks[i].mask })), (G, lam) => blocks.findIndex((b) => b.mask === (G.mask ^ lam.mask)));
    /* the selection-rule count from the block sizes alone: Σ_Λ (Σ_Γ n_Γ n_{ΓΛ})² over the full tensor */
    rec.eri.fullTensor.allowedFromBlockSizes = blocks.reduce((s, lam) => { const a = blocks.reduce((t, G) => t + G.size * blocks.find((b) => b.mask === (G.mask ^ lam.mask)).size, 0); return s + a * a; }, 0);
    out.groups[gname] = rec;
  }
  /* ── cyclic groups with complex characters (C6; C6h = C6 × σh) ── */
  for (const gname of STUDY[id].groups.filter((x) => ['C6', 'C6h'].includes(x))) {
    const ops = groups[gname], order = 6, gen = ops.find((o) => o.cls === 'm1' || o.cls === 'm1+'), Mg = gen.Mp;
    const pow = [identity(n)]; for (let k = 1; k < order; k++) pow.push(matmul(pow[k - 1], Mg, n));
    const parities = gname === 'C6h' ? (() => { const Ms = ops.find((o) => o.cls === 'm0-').Mp, Pp = new Float64Array(n * n), Pm = new Float64Array(n * n);
      for (let t = 0; t < n * n; t++) { const d = t % (n + 1) === 0 ? 1 : 0; Pp[t] = (d + Ms[t]) / 2; Pm[t] = (d - Ms[t]) / 2; } return [['g', 1, Pp], ['u', -1, Pm]]; })() : [['', 1, null]];
    const blocks = [], cols = []; let worstEigen = 0;
    for (const [plab, par, Ppar] of parities) for (let k = 0; k <= order / 2; k++) {
      const real = k === 0 || 2 * k === order, d = real ? 1 : 2, th = 2 * Math.PI * k / order;
      let Pk = new Float64Array(n * n); for (let mIdx = 0; mIdx < order; mIdx++) { const w = d * Math.cos(th * mIdx) / order; for (let t = 0; t < n * n; t++) Pk[t] += w * pow[mIdx][t]; }
      if (Ppar) Pk = matmul(Ppar, Pk, n);
      const { cols: vs } = projectorRange(Pk, n, `${id} ${gname} k=${k}${plab}`);
      const mk = (grade, ur, ui) => ({ ur: matvec(X, ur, n), ui: ui ? matvec(X, ui, n) : null, grade, par, block: null });
      if (real) { const bc = vs.map((v) => mk(k, v, null)); bc.forEach((cc) => { cc.block = blocks.length; }); blocks.push({ label: `k=${k}${plab}`, size: vs.length, cols: bc, grade: k, par, meta: { grade: k, parity: plab || null, character: `ζ₆^${k}` } }); cols.push(...bc); continue; }
      /* complex grades ±k: J = (M′ − cos θ)/sin θ is a complex structure on the real E_k component; (u ∓ i J u)/√2 has eigenvalue e^{±iθ} */
      const cs = Math.cos(th), sn = Math.sin(th), J = (u) => { const Mu = matvec(Mg, u, n); const o = new Float64Array(n); for (let i = 0; i < n; i++) o[i] = (Mu[i] - cs * u[i]) / sn; return o; };
      const pairs = [];
      for (const b of vs) { const w = Float64Array.from(b); for (const [u, v] of pairs) { const cu = vdot(u, w), cv = vdot(v, w); for (let i = 0; i < n; i++) w[i] -= cu * u[i] + cv * v[i]; }
        const nw = Math.sqrt(vdot(w, w)); if (nw < 1e-6) continue; for (let i = 0; i < n; i++) w[i] /= nw; const v = J(w);
        worstEigen = Math.max(worstEigen, Math.abs(Math.sqrt(vdot(v, v)) - 1), Math.abs(vdot(w, v)));
        const Mw = matvec(Mg, w, n); for (let i = 0; i < n; i++) worstEigen = Math.max(worstEigen, Math.abs(Mw[i] - cs * w[i] - sn * v[i]));
        pairs.push([w, v]); if (2 * pairs.length === vs.length) break; }
      if (2 * pairs.length !== vs.length) throw new Error(`${gname} k=${k}: symplectic basis has ${pairs.length} pairs for dimension ${vs.length}`);
      const r2 = Math.SQRT1_2;
      const plus = pairs.map(([u, v]) => mk(k, u.map((x) => x * r2), v.map((x) => -x * r2))), minus = pairs.map(([u, v]) => mk(order - k, u.map((x) => x * r2), v.map((x) => x * r2)));
      plus.forEach((cc) => { cc.block = blocks.length; }); blocks.push({ label: `k=${k}${plab}`, size: plus.length, cols: plus, grade: k, par, meta: { grade: k, parity: plab || null, character: `ζ₆^${k}` } }); cols.push(...plus);
      minus.forEach((cc) => { cc.block = blocks.length; }); blocks.push({ label: `k=${order - k}${plab}`, size: minus.length, cols: minus, grade: order - k, par, meta: { grade: order - k, parity: plab || null, character: `ζ₆^${order - k}` } }); cols.push(...minus);
    }
    blocks.sort((a, b) => (a.par !== b.par ? b.par - a.par : a.grade - b.grade)); const sorted = []; blocks.forEach((b, i) => { b.cols.forEach((cc) => { cc.block = i; }); sorted.push(...b.cols); });
    const grade = sorted.map((cc) => cc.grade), par = sorted.map((cc) => cc.par);
    const allowed = (p, q, r, s) => ((-grade[p] + grade[q] - grade[r] + grade[s]) % order + order) % order === 0 && par[p] * par[q] * par[r] * par[s] === 1;
    const rec = finish(gname, ops, blocks, sorted, allowed, { complexBasis: true, worstEigenvectorResidual: worstEigen, gradingRule: '−k_p + k_q − k_r + k_s ≡ 0 (mod 6)' + (gname === 'C6h' ? ' and the σh parities multiply to +1' : '') });
    rec.rpaBlocks = pairBlocksAbelian(rec.blocks.map((b, i) => ({ ...b, grade: blocks[i].grade, par: blocks[i].par })), (G, lam) => blocks.findIndex((b) => b.grade === (G.grade + lam.grade) % order && b.par === G.par * lam.par));
    rec.eri.fullTensor.allowedFromBlockSizes = blocks.reduce((s, lam) => { const a = blocks.reduce((t, G) => t + G.size * blocks.find((b) => b.grade === (G.grade + lam.grade) % order && b.par === G.par * lam.par).size, 0); return s + a * a; }, 0);
    out.groups[gname] = rec;
  }
  /* ── D6h by partner blocks (joint D6h × D2h projectors) ── */
  if (STUDY[id].groups.includes('D6h')) {
    const ops = groups.D6h, T = TABLES.D6h, h = 24, classOf = ops.map((o) => T.classes.indexOf(o.cls)), d2 = out.groups.D2h, ops2 = groups.D2h;
    /* the D2h projectors in the Löwdin frame from the D2h ops themselves */
    const P2 = Object.entries(TABLES.D2h.irreps).map(([label, row]) => { const Pp = new Float64Array(n * n); ops2.forEach((o, r) => { const w = row[TABLES.D2h.classes.indexOf(o.cls)] / 8; for (let t = 0; t < n * n; t++) Pp[t] += w * o.Mp[t]; }); return { label, Pp }; });
    const blocks = [], cols = [], irrepIdx = {}, names = Object.keys(T.irreps); names.forEach((nm, i) => { irrepIdx[nm] = i; });
    const multiplicity = {};
    for (const [label, row] of Object.entries(T.irreps)) {
      const dG = row[0], P6 = new Float64Array(n * n); ops.forEach((o, r) => { const w = dG * row[classOf[r]] / h; for (let t = 0; t < n * n; t++) P6[t] += w * o.Mp[t]; });
      let total = 0;
      for (const { label: l2, Pp } of P2) { const Q = matmul(P6, Pp, n); const { cols: vs } = projectorRange(Q, n, `${id} D6h ${label}·${l2}`); if (!vs.length) continue; total += vs.length;
        const bc = vs.map((v) => ({ ur: matvec(X, v, n), ui: null, g6: irrepIdx[label], block: blocks.length }));
        blocks.push({ label: `${label}·${l2}`, size: vs.length, cols: bc, g6: irrepIdx[label], meta: { d6hIrrep: label, d2hPartner: l2, dimension: dG } }); cols.push(...bc); }
      multiplicity[label] = total / dG; if (Math.abs(multiplicity[label] - Math.round(multiplicity[label])) > 1e-9) throw new Error(`D6h ${label}: ${total} partner vectors for dimension ${dG}`);
    }
    /* allowed at the label level: A1g ∈ Γi ⊗ Γj ⊗ Γk ⊗ Γl */
    const nI = names.length, table = new Uint8Array(nI ** 4);
    for (let a = 0; a < nI; a++) for (let b = 0; b < nI; b++) for (let c2 = 0; c2 < nI; c2++) for (let d = 0; d < nI; d++) { let s = 0;
      T.classes.forEach((_, cl) => { s += T.sizes[cl] * T.irreps[names[a]][cl] * T.irreps[names[b]][cl] * T.irreps[names[c2]][cl] * T.irreps[names[d]][cl]; });
      table[((a * nI + b) * nI + c2) * nI + d] = Math.round(s / h) >= 1 ? 1 : 0; }
    const g6 = cols.map((cc) => cc.g6);
    const allowed = (p, q, r, s) => table[((g6[p] * nI + g6[q]) * nI + g6[r]) * nI + g6[s]] === 1;
    const rec = finish('D6h', ops, blocks, cols, allowed, { partnerLabelling: 'each D6h isotypic component split by the D2h label of its partner (E1g → B2g + B3g, E2g → Ag + B1g, E1u → B2u + B3u, E2u → Au + B1u)',
      irrepMultiplicities: multiplicity });
    /* the RPA pair space V_occ ⊗ V_vir decomposed by characters */
    const chiO = ops.map((o) => chiOcc(o)), chiV = ops.map((o, r) => o.trace - chiO[r]), chiPair = chiO.map((x, r) => x * chiV[r]);
    const mLam = names.map((nm) => { let s = 0; ops.forEach((o, r) => { s += chiPair[r] * T.irreps[nm][classOf[r]]; }); return s / h; });
    const mInt = mLam.map((v) => Math.round(v)), resid = Math.max(...mLam.map((v, i) => Math.abs(v - mInt[i])));
    const pairTotal = mInt.reduce((s, v, i) => s + v * T.irreps[names[i]][0], 0);
    rec.rpaBlocks = { pairSpace: pairTotal, residual: resid, blocks: names.map((nm, i) => ({ excitation: nm, dimension: T.irreps[nm][0], multiplicity: mInt[i] })),
      distinctEigenvalues: mInt.reduce((s, v) => s + v, 0), sumM3overM3OnePartnerEach: mInt.reduce((s, v) => s + v ** 3, 0) / pairTotal ** 3,
      sumM2overM2AllPartners: mInt.reduce((s, v, i) => s + T.irreps[names[i]][0] * v * v, 0) / pairTotal ** 2,
      occupiedCharacter: Object.fromEntries(ops.map((o, r) => [o.name, +chiO[r].toFixed(8)])) };
    out.groups.D6h = rec;
  }
  /* ── the π ring: the six carbon p_z, circulant in ring order, diagonalised by the DFT ── */
  if (id === 'C6H6') {
    const pz = sol.basis.bfs.filter((b) => b.Z === 6 && b.l[2] === 1 && b.l[0] === 0 && b.l[1] === 0).map((b) => b.idx);
    if (pz.length !== 6) throw new Error('benzene: expected six carbon p_z');
    const sub6 = (A) => pz.map((i) => pz.map((j) => A[i * n + j])), Fpi = sub6(F), Spi = sub6(S);
    const circ = (A) => { let w = 0; for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) w = Math.max(w, Math.abs(A[a][b] - A[0][(b - a + 6) % 6])); return w; };
    const dft = (A, k) => { let re = 0, im = 0; for (let mIdx = 0; mIdx < 6; mIdx++) { const th = 2 * Math.PI * k * mIdx / 6; re += A[0][mIdx] * Math.cos(th); im += A[0][mIdx] * Math.sin(th); } return [re, im]; };
    const rows = [0, 1, 2, 3, 4, 5].map((k) => { const [fr, fi] = dft(Fpi, k), [sr, si] = dft(Spi, k); return { k, Ftilde: fr, Stilde: sr, imag: Math.max(Math.abs(fi), Math.abs(si)), eps: fr / sr }; });
    /* the solver's π orbitals: the MOs whose weight on the p_z AOs is 1 */
    const piMos = []; for (let k = 0; k < n; k++) { let w = 0; for (const i of pz) w += C[i * n + k] * SC[i * n + k]; if (Math.abs(w - 1) < 1e-8) piMos.push({ k: k + 1, eps: eps[k] }); }
    const sorted = piMos.map((x) => x.eps).sort((a, b) => a - b), dftSorted = rows.map((r) => r.eps).sort((a, b) => a - b);
    out.piRing = { pzAO: pz, circulantDefect: { F: circ(Fpi), S: circ(Spi) }, dft: rows.map((r) => ({ k: r.k, FtildeOverStilde: r.eps, Ftilde: r.Ftilde, Stilde: r.Stilde, imaginaryPart: r.imag })),
      solverPiOrbitals: piMos, worstDifference: piMos.length === 6 ? Math.max(...sorted.map((e, i) => Math.abs(e - dftSorted[i]))) : null,
      reading: 'ε_k = F̃(k)/S̃(k): the Hückel/Bloch diagonalisation of the live π Fock block by the C6 characters, no eigensolver; k = 0 ↔ a2u, ±1 ↔ e1g, ±2 ↔ e2u, 3 ↔ b2g' };
  }
  /* ── the grid ── */
  const signOps = groups[STUDY[id].sign], others = fullOps.filter((o) => !signOps.some((s) => maxDiff(s.R, o.R) < 1e-12));
  out.grid = { live: gridStudy(GRID, signOps, others), nodeCentredContrast: gridStudy(GRID + 1, signOps, []) };
  return out;
}

/* ── run ────────────────────────────────────────────────────────────────────────────────────────────────────── */
const results = {}; const tAll = performance.now();
for (const id of ['H2O', 'C6H6']) { results[id] = study(id); console.error(`${id}: done in ${((performance.now() - tAll) / 1000).toFixed(1)} s`); }
let oracle = null;
if (ORACLE && existsSync(ORACLE)) {
  oracle = JSON.parse(readFileSync(ORACLE, 'utf8'));
  for (const id of Object.keys(results)) {
    const o = oracle[id]; if (!o) continue;
    const mine = results[id].groups[o.groupname]; if (!mine) continue;
    /* PySCF lists only the irreps that occur, so its lists are zero-padded to the group's irrep count before comparing */
    const pad = (list) => list.concat(Array(Math.max(0, mine.blocks.length - list.length)).fill(0)).sort((a, b) => a - b);
    const sortedMine = mine.blocks.map((b) => b.size).sort((a, b) => a - b), sortedO = pad(Object.values(o.blockSizes));
    const occMine = mine.blocks.map((b) => b.occupied).sort((a, b) => a - b), occO = pad(Object.values(o.occupiedPerIrrep));
    results[id].oracle = { file: ORACLE, pyscf: o.pyscf, topgroup: o.topgroup, groupname: o.groupname, energy: o.energy, energyDifference: o.energy - results[id].energy,
      blockSizesPySCF: o.blockSizes, blockSizesHere: Object.fromEntries(mine.blocks.map((b) => [b.label, b.size])),
      blockSizeMultisetsAgree: JSON.stringify(sortedMine) === JSON.stringify(sortedO), occupiedPerIrrepPySCF: o.occupiedPerIrrep,
      occupiedMultisetsAgree: JSON.stringify(occMine) === JSON.stringify(occO),
      note: 'PySCF re-orients the molecule into its own frame, so B1/B2/B3 names may permute; the multisets are the comparison' };
  }
}
const meta = { tool: 'tools/symmetry/unique-quartets.mjs', date: new Date().toISOString().slice(0, 10), node: process.version, basis: 'sto-3g (lab/vendor/bse/sto-3g-v1.json)',
  solver: 'moleculeRHF defaults (SAD + core guesses, Hessian, stability probe) — lab/mathworker.js ensureSolve\'s call', threshold: THR, grid: GRID,
  conventions: 'chemist\'s (ij|kl) = ∫∫ φ_i*(1) φ_j(1) r12⁻¹ φ_k*(2) φ_l(2); canonical unique = i ≤ j, k ≤ l, (ij) ≤ (kl); SAO = unit eigenvectors of the Löwdin-frame projectors mapped back by S^{-1/2}',
  totalMs: Math.round(performance.now() - tAll) };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ meta, molecules: results }, null, 1) + '\n');

/* ── digest ─────────────────────────────────────────────────────────────────────────────────────────────────── */
const f4 = (x) => (x === null || x === undefined ? '—' : typeof x === 'number' ? (Math.abs(x) < 1e-3 && x !== 0 ? x.toExponential(2) : x.toFixed(4)) : String(x));
for (const [id, r] of Object.entries(results)) {
  console.log(`\n## ${r.formula} · ${r.nAO} AO · ${r.nElectrons} e⁻ · E = ${r.energy.toFixed(9)} Eh · solve ${r.solveMs} ms (integrals ${r.integralMs} ms) · fockReal ${r.timingsMs.fockReal} ms · eigSym ${r.timingsMs.eigSymFock} ms · hessianBlocks ${r.timingsMs.hessianBlocks} ms (pair space ${r.timingsMs.pairSpace})`);
  console.log(`| group | h | blocks n_Γ (occ) | Σn²/n² | Σn³/n³ | ERI non-zero (full) | allowed by labels | canonical non-zero / ${Object.values(r.groups)[0].eri.canonicalUnique.quartets} | independent (Sym²Sym² inv.) | 1/h | shell petite list | AO petite list (live) | forced-zero AO quartets | RPA Σm²/m² | Σm³/m³ |`);
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const gr of Object.values(r.groups)) {
    const e = gr.eri, pl = gr.petiteList, ao = pl.aoQuartets, rb = gr.rpaBlocks;
    console.log(`| ${gr.group} | ${gr.order} | ${gr.blocks.map((b) => `${b.label} ${b.size}(${b.occupied})`).join(', ')} | ${f4(gr.fock.sumN2overN2)} | ${f4(gr.fock.sumN3overN3)} | ${e.fullTensor.nonzero} = ${f4(e.fullTensor.fraction)} | ${f4(e.fullTensor.allowedFraction)}${e.fullTensor.violations ? ` (${e.fullTensor.violations} VIOLATIONS)` : ''} | ${e.canonicalUnique.nonzero} = ${f4(e.canonicalUnique.fraction)} | ${e.independentIntegrals.symSymInvariants} = ${f4(e.independentIntegrals.fractionOfCanonical)} | ${f4(e.limitOneOverOrder)} | ${pl.shellQuartets.orbits}/${pl.shellQuartets.shellQuartets} = ${f4(pl.shellQuartets.fraction)} | ${ao.signedPermutation ? `${ao.liveOrbits}/${ao.canonicalQuartets} = ${f4(ao.liveFraction)}` : 'not a signed permutation'} | ${ao.signedPermutation ? `${ao.forcedZeroQuartets} = ${f4(ao.forcedZeroFraction)} (max |g| ${ao.maxAbsForcedZero.toExponential(1)})` : '—'} | ${rb ? f4(rb.sumM2overM2 ?? rb.sumM2overM2AllPartners) : '—'} | ${rb ? f4(rb.sumM3overM3 ?? rb.sumM3overM3OnePartnerEach) : '—'} |`);
  }
  for (const gr of Object.values(r.groups)) console.log(`- ${gr.group}: clusters → ${gr.clusters.filter((c) => c.occ).map((c) => `${c.decomposition}${c.occ > 2 ? `⁽${c.occ}⁾` : ''}`).join(' ')} ‖ LUMO ${gr.clusters.find((c) => !c.occ)?.decomposition} · leakage ${gr.worstMoOffBlockLeakage.toExponential(2)} · forbidden max ${gr.eri.fullTensor.maxAbsForbidden.toExponential(2)} · allowed min ${gr.eri.fullTensor.minAbsAllowedNonzero?.toExponential(2)} · SAO ortho ${gr.saoOrthonormalityDefect.toExponential(2)}`);
  if (r.piRing) console.log(`- π ring: circulant defect F ${r.piRing.circulantDefect.F.toExponential(2)}, S ${r.piRing.circulantDefect.S.toExponential(2)}; DFT ε_k = ${r.piRing.dft.map((d) => `${d.k}:${d.FtildeOverStilde.toFixed(6)}`).join(' ')}; solver π ε = ${r.piRing.solverPiOrbitals.map((p) => p.eps.toFixed(6)).join(' ')}; worst |Δ| ${r.piRing.worstDifference?.toExponential(2)}`);
  const gl = r.grid.live, gc = r.grid.nodeCentredContrast;
  console.log(`- grid ${gl.n}³ ${gl.centred}: ${gl.orbits} orbits = ${f4(gl.asymmetricUnitFraction)} of ${gl.voxels} voxels under {${gl.signOps.join(', ')}}, boundary voxels ${gl.boundaryVoxels}; other operations mapping any voxel centre onto the lattice: ${gl.latticeCompatible.map((x) => `${x.op}:${x.voxelsMappedOntoLattice}`).join(' ')}`);
  console.log(`- grid ${gc.n}³ ${gc.centred}: ${gc.orbits} orbits = ${f4(gc.asymmetricUnitFraction)}, boundary voxels ${gc.boundaryVoxels} = ${f4(gc.boundaryFraction)}`);
  if (r.oracle) console.log(`- PySCF ${r.oracle.pyscf}: ${r.oracle.topgroup} → ${r.oracle.groupname}; E diff ${r.oracle.energyDifference.toExponential(2)}; block multisets agree ${r.oracle.blockSizeMultisetsAgree}; occupied multisets agree ${r.oracle.occupiedMultisetsAgree}`);
}
console.log(`\nwrote ${OUT} (${meta.totalMs} ms)`);
