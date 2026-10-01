#!/usr/bin/env node
/* names-probe.mjs — FEASIBILITY PROBE (read-only on lab/): can the proper symmetry names of the molecular orbitals be
 * derived from the app's own live RHF/STO-3G output?  node 22, no dependencies.  Run:  node names-probe.mjs
 *
 * METHOD (DECLARE-AND-VERIFY, no point-group detector).  Per molecule: (1) the live solve, moleculeRHF with the arguments
 * lab/mathworker.js ensureSolve passes; (2) a symmetry frame built from the geometry, the point group and its operations
 * DECLARED as 3x3 matrices in that frame, every operation VERIFIED as an atom permutation of the nuclear framework;
 * (3) the AO representation M(R): atoms permute, s maps 1:1, p rotates by R (Cartesian d would need a 6x6 block, see
 * PROBE.md); (4) the MOs clustered by energy with canon-gauge's own clusterRanges at the app's own 1e-8 Eh, the cluster
 * character chi(R) = sum_k C_k^T S M(R) C_k, and its decomposition n_G = (1/h) sum_R chi(R) chi_G(R); linear molecules
 * get lambda from chi(C_phi) at two generic angles, +/- from a sigma_v, g/u from the inversion; (5) the counted labels,
 * the frontier names, the residuals and the configuration string; (6) the textbook comparison.  Output: names-probe.json
 * and a markdown digest on stdout.  Nothing here is imported by, or edits, any lab/ file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { moleculeRHF, registerRecord } from '../../lab/rhf-molecule.js';
import { MOLECULE_BY_ID, moleculeAtoms, moleculeCharge, RING_RESIDUALS } from '../../lab/molecules.js';
import { clusterRanges } from '../../lab/canon-gauge.js';

const HERE = new URL('.', import.meta.url);
const record = JSON.parse(readFileSync(new URL('../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
registerRecord('sto-3g', record);

/* ── small linear algebra: 3-vectors, row-major 3x3 ───────────────────────────────────────────────────────── */
const P = (a) => [a.x, a.y, a.z];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const unit = (a) => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));
const mv = (R, v) => [0, 1, 2].map((i) => R[i * 3] * v[0] + R[i * 3 + 1] * v[1] + R[i * 3 + 2] * v[2]);
const mm = (A, B) => { const o = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j]; return o; };
const tp = (A) => [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]];
const trace3 = (A) => A[0] + A[4] + A[8];
const det3 = (A) => A[0] * (A[4] * A[8] - A[5] * A[7]) - A[1] * (A[3] * A[8] - A[5] * A[6]) + A[2] * (A[3] * A[7] - A[4] * A[6]);
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const neg = (A) => A.map((v) => -v);
const diag3 = (a, b, c) => [a, 0, 0, 0, b, 0, 0, 0, c];
const Rz = (t) => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1];
/** reflection in the plane that contains z and the in-plane direction at angle phi */
const sigmaV = (phi) => [Math.cos(2 * phi), Math.sin(2 * phi), 0, Math.sin(2 * phi), -Math.cos(2 * phi), 0, 0, 0, 1];
/** C2 about the in-plane axis at angle phi */
const c2In = (phi) => [Math.cos(2 * phi), Math.sin(2 * phi), 0, Math.sin(2 * phi), -Math.cos(2 * phi), 0, 0, 0, -1];

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUBD = '₀₁₂₃₄₅₆₇₈₉';
const sup = (n) => String(n).split('').map((d) => SUP[+d]).join('');
const uni = (label) => label.replace(/([abet])(\d)/g, (_, l, d) => l + SUBD[+d]);

/* ── the character tables, as data.  Class order = the column order; every irrep is real. ─────────────────── */
const TABLES = {
  C2v: { classes: ['E', 'C2', 'sv(xz)', 'sv(yz)'], irreps: { A1: [1, 1, 1, 1], A2: [1, 1, -1, -1], B1: [1, -1, 1, -1], B2: [1, -1, -1, 1] } },
  C3v: { classes: ['E', '2C3', '3sv'], irreps: { A1: [1, 1, 1], A2: [1, 1, -1], E: [2, -1, 0] } },
  Td: { classes: ['E', '8C3', '3C2', '6S4', '6sd'], irreps: { A1: [1, 1, 1, 1, 1], A2: [1, 1, 1, -1, -1], E: [2, -1, 2, 0, 0], T1: [3, 0, -1, 1, -1], T2: [3, 0, -1, -1, 1] } },
  D2h: { classes: ['E', 'C2(z)', 'C2(y)', 'C2(x)', 'i', 's(xy)', 's(xz)', 's(yz)'], irreps: {
    Ag: [1, 1, 1, 1, 1, 1, 1, 1], B1g: [1, 1, -1, -1, 1, 1, -1, -1], B2g: [1, -1, 1, -1, 1, -1, 1, -1], B3g: [1, -1, -1, 1, 1, -1, -1, 1],
    Au: [1, 1, 1, 1, -1, -1, -1, -1], B1u: [1, 1, -1, -1, -1, -1, 1, 1], B2u: [1, -1, 1, -1, -1, 1, -1, 1], B3u: [1, -1, -1, 1, -1, 1, 1, -1] } },
  D6h: { classes: ['E', '2C6', '2C3', 'C2', '3C2p', '3C2pp', 'i', '2S3', '2S6', 'sh', '3sd', '3sv'], irreps: {
    A1g: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], A2g: [1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, -1],
    B1g: [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1], B2g: [1, -1, 1, -1, -1, 1, 1, -1, 1, -1, -1, 1],
    E1g: [2, 1, -1, -2, 0, 0, 2, 1, -1, -2, 0, 0], E2g: [2, -1, -1, 2, 0, 0, 2, -1, -1, 2, 0, 0],
    A1u: [1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1], A2u: [1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, 1],
    B1u: [1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1], B2u: [1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1],
    E1u: [2, 1, -1, -2, 0, 0, -2, -1, 1, 2, 0, 0], E2u: [2, -1, -1, 2, 0, 0, -2, 1, 1, -2, 0, 0] } },
};
/** the class sizes (derived from the operation lists, then compared with these) */
const CLASS_SIZES = {
  C2v: [1, 1, 1, 1], C3v: [1, 2, 3], Td: [1, 8, 3, 6, 6], D2h: [1, 1, 1, 1, 1, 1, 1, 1],
  D6h: [1, 2, 2, 1, 3, 3, 1, 2, 2, 1, 3, 3],
};
/** SELF-TEST: row orthonormality  sum_c size_c chi_i chi_j = h delta_ij, column orthogonality, #irreps = #classes, sum dim^2 = h */
function selfTestTables() {
  const rep = {};
  for (const [g, T] of Object.entries(TABLES)) {
    const size = CLASS_SIZES[g], h = size.reduce((a, b) => a + b, 0), names = Object.keys(T.irreps);
    let worst = 0;
    for (const a of names) for (const b of names) {
      let s = 0; T.classes.forEach((_, c) => { s += size[c] * T.irreps[a][c] * T.irreps[b][c]; });
      worst = Math.max(worst, Math.abs(s - (a === b ? h : 0)));
    }
    T.classes.forEach((_, c) => T.classes.forEach((__, d) => {            // column orthogonality
      let s = 0; for (const a of names) s += T.irreps[a][c] * T.irreps[a][d];
      worst = Math.max(worst, Math.abs(s - (c === d ? h / size[c] : 0)));
    }));
    const dim2 = names.reduce((s, a) => s + T.irreps[a][0] ** 2, 0);
    const ok = worst === 0 && names.length === T.classes.length && dim2 === h;
    rep[g] = { order: h, irreps: names.length, classes: T.classes.length, sumDimSquared: dim2, worstOrthogonalityDefect: worst, ok };
    if (!ok) throw new Error(`character table ${g} fails its self-test: ${JSON.stringify(rep[g])}`);
  }
  return rep;
}

/* ── declared operation lists, in the SYMMETRY frame ───────────────────────────────────────────────────────── */
const OPS = {
  C2v: () => [['E', 'E', I3], ['C2', 'C2', diag3(-1, -1, 1)], ['sv(xz)', 'sv(xz)', diag3(1, -1, 1)], ['sv(yz)', 'sv(yz)', diag3(-1, 1, 1)]],
  C3v: () => [['E', 'E', I3], ['C3', '2C3', Rz(2 * Math.PI / 3)], ['C3^2', '2C3', Rz(4 * Math.PI / 3)],
    ...[0, 1, 2].map((k) => [`sv${k + 1}`, '3sv', sigmaV(k * 2 * Math.PI / 3)])],
  Td: () => {
    const out = [], CL = { '3,1': 'E', '0,1': '8C3', '-1,1': '3C2', '-1,-1': '6S4', '1,-1': '6sd' };
    for (const pm of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]])
      for (const s0 of [1, -1]) for (const s1 of [1, -1]) for (const s2 of [1, -1]) {
        if (s0 * s1 * s2 !== 1) continue;                                   // even number of sign flips: these 24 preserve the tetrahedron
        const R = new Array(9).fill(0), s = [s0, s1, s2]; for (let i = 0; i < 3; i++) R[i * 3 + pm[i]] = s[i];
        const key = `${Math.round(trace3(R))},${Math.round(det3(R))}`;
        out.push([`P${pm.join('')}s${s.map((v) => (v > 0 ? '+' : '-')).join('')}`, CL[key], R]);
      }
    return out;
  },
  D2h: () => [['E', 'E', I3], ['C2(z)', 'C2(z)', diag3(-1, -1, 1)], ['C2(y)', 'C2(y)', diag3(-1, 1, -1)], ['C2(x)', 'C2(x)', diag3(1, -1, -1)],
    ['i', 'i', neg(I3)], ['s(xy)', 's(xy)', diag3(1, 1, -1)], ['s(xz)', 's(xz)', diag3(1, -1, 1)], ['s(yz)', 's(yz)', diag3(-1, 1, 1)]],
  D6h: () => {
    const th = Math.PI / 3, out = [['E', 'E', I3]];
    const C6 = (k) => Rz(k * th), sh = diag3(1, 1, -1);
    for (const k of [1, 5]) out.push([`C6^${k}`, '2C6', C6(k)]);
    for (const k of [2, 4]) out.push([`C3^${k / 2}`, '2C3', C6(k)]);
    out.push(['C2', 'C2', C6(3)]);
    for (const j of [0, 1, 2]) out.push([`C2'(${j * 60}deg)`, '3C2p', c2In(j * th)]);          // through atoms (x axis = atom 0)
    for (const j of [0, 1, 2]) out.push([`C2''(${30 + j * 60}deg)`, '3C2pp', c2In(Math.PI / 6 + j * th)]);   // through bond midpoints
    out.push(['i', 'i', neg(I3)]);
    for (const k of [2, 4]) out.push([`S3^${k}`, '2S3', mm(sh, C6(k))]);
    for (const k of [1, 5]) out.push([`S6^${k}`, '2S6', mm(sh, C6(k))]);
    out.push(['sh', 'sh', sh]);
    for (const j of [0, 1, 2]) out.push([`sd(${30 + j * 60}deg)`, '3sd', sigmaV(Math.PI / 6 + j * th)]);   // contain the C2'' axes
    for (const j of [0, 1, 2]) out.push([`sv(${j * 60}deg)`, '3sv', sigmaV(j * th)]);                    // contain the C2' axes = atoms
    return out;
  },
};

/* ── the molecules: group, convention, frame built from the atoms themselves ──────────────────────────────── */
const frameXYZ = (z, x) => { const zz = unit(z), xx = unit(sub(x, scale(zz, dot(x, zz)))); return { x: xx, y: cross(zz, xx), z: zz }; };
const SPEC = {
  H2O: { group: 'C2v', kind: 'finite', convention: 'Mulliken 1955 (planar C2v): z = C2 axis, x PERPENDICULAR to the molecular plane (molecule in yz); b1 is odd under sigma(yz)',
    frame: (A, c) => { const [O, H1, H2] = A.map(P); const z = unit(sub(add(H1, H2), scale(O, 2))), n = unit(cross(sub(H1, O), sub(H2, O))); return { x: n, y: cross(z, n), z }; } },
  NH3: { group: 'C3v', kind: 'finite', convention: 'z = C3 axis; sigma_v(xz) contains N and H1 (x = the perpendicular component of N->H1)',
    frame: (A, c) => { const [N, H1, H2, H3] = A.map(P); const z = unit(cross(sub(H2, H1), sub(H3, H1))); return frameXYZ(z, sub(H1, N)); } },
  CH4: { group: 'Td', kind: 'finite', convention: 'x, y, z = the three S4 (C2) axes through the cube-face centres: x ∝ H1+H2, y ∝ H1+H3, z ∝ H1+H4 (from C)',
    frame: (A, c) => { const [C, H1, H2, H3, H4] = A.map(P); const g = (H) => unit(sub(add(H1, H), scale(C, 2))); return { x: g(H2), y: g(H3), z: g(H4) }; } },
  N2: { group: 'Dinfh', kind: 'linear', centro: true, convention: 'z = the bond axis; x, y an arbitrary perpendicular pair (lambda, +/- and g/u are axis-independent)',
    frame: (A) => frameXYZ(sub(P(A[1]), P(A[0])), [1, 0.37, 0.11]) },
  CO: { group: 'Cinfv', kind: 'linear', centro: false, convention: 'z = C->O; x, y arbitrary perpendicular pair',
    frame: (A) => frameXYZ(sub(P(A[1]), P(A[0])), [1, 0.37, 0.11]) },
  HF: { group: 'Cinfv', kind: 'linear', centro: false, convention: 'z = F->H; x, y arbitrary perpendicular pair',
    frame: (A) => frameXYZ(sub(P(A[1]), P(A[0])), [1, 0.37, 0.11]) },
  CO2: { group: 'Dinfh', kind: 'linear', centro: true, convention: 'z = O->O; x, y arbitrary perpendicular pair',
    frame: (A) => frameXYZ(sub(P(A[1]), P(A[2])), [1, 0.37, 0.11]) },
  C2H4: { group: 'D2h', kind: 'finite', convention: 'Mulliken 1955 (planar D2h): z along C=C, x PERPENDICULAR to the molecular plane (molecule in yz); pi = b3u, pi* = b2g',
    frame: (A) => { const [C1, C2, H1, H2] = A.map(P); const z = unit(sub(C1, C2)), n = unit(cross(sub(H1, C1), sub(H2, C1))); return { x: n, y: cross(z, n), z }; } },
  H2CO: { group: 'C2v', kind: 'finite', convention: 'Mulliken 1955 (planar C2v): z = C2 axis (C=O), x PERPENDICULAR to the molecular plane (molecule in yz); in-plane O lone pair = b2, pi = b1',
    frame: (A) => { const [C, O, H1, H2] = A.map(P); const z = unit(sub(O, C)), n = unit(cross(sub(H1, C), sub(H2, C))); return { x: n, y: cross(z, n), z }; } },
  C6H6: { group: 'D6h', kind: 'finite', convention: "z = C6 axis (ring normal), x through carbon 0; C2' through atoms (and sigma_v containing atoms), C2'' through bond midpoints (and sigma_d containing them) — with it the pi set is a2u + b2g + e1g + e2u",
    frame: (A) => { const C0 = P(A[0]), C1 = P(A[2]), C2 = P(A[4]); const z = unit(cross(sub(C1, C0), sub(C2, C0))); return frameXYZ(z, C0); } },
};

/* ── axis-convention aliases ─────────────────────────────────────────────────────────────────────────────── */
const ALIASES = {
  C2v: [{ convention: 'x and y exchanged: molecule in the xz plane, y perpendicular (the other common C2v choice)', map: (g) => ({ B1: 'B2', B2: 'B1' }[g] || g) }],
  D2h: [{ convention: 'x along the C=C bond, y in plane, z perpendicular to the plane (xy-plane molecule): pi = b1u, pi* = b2g', axes: { x: 'z', y: 'y', z: 'x' } },
    { convention: 'y along the C=C bond, x in plane, z perpendicular to the plane (xy-plane molecule): pi = b1u, pi* = b3g', axes: { x: 'y', y: 'z', z: 'x' } }],
  D6h: [{ convention: "C2' through bond midpoints, C2'' through atoms (b1 <-> b2 exchanged)", map: (g) => g.replace(/^B1/, 'Bx').replace(/^B2/, 'B1').replace(/^Bx/, 'B2') }],
};
/** the new name of a D2h irrep when the axes are relabelled: new axis q is the OLD axis axes[q] */
function d2hRelabel(g, axes) {
  const T = TABLES.D2h, col = (name) => T.classes.indexOf(name), chi = T.irreps[g];
  const want = [chi[col('C2(x)')], chi[col('C2(y)')], chi[col('C2(z)')], chi[col('i')]];
  const old = (q) => chi[col(`C2(${axes[q]})`)];
  const v = [old('x'), old('y'), old('z'), want[3]];
  for (const [name, c] of Object.entries(T.irreps)) if (c[col('C2(x)')] === v[0] && c[col('C2(y)')] === v[1] && c[col('C2(z)')] === v[2] && c[col('i')] === v[3]) return name;
  throw new Error('d2hRelabel: no irrep for ' + g);
}
const aliasName = (group, alias, g) => (alias.axes ? d2hRelabel(g, alias.axes) : alias.map(g));
const lower = (g) => g.toLowerCase();

/* ── geometry: centre of nuclear charge, operation verification ───────────────────────────────────────────── */
function chargeCentre(A) { let s = [0, 0, 0], Zt = 0; for (const a of A) { s = add(s, scale(P(a), a.Z)); Zt += a.Z; } return scale(s, 1 / Zt); }
function checkOp(A, c, Rlab) {
  const perm = [], used = new Set(); let worst = 0;
  A.forEach((a) => {
    const r2 = add(c, mv(Rlab, sub(P(a), c)));
    let best = -1, bd = Infinity;
    A.forEach((b, ib) => { if (b.Z !== a.Z) return; const d = Math.hypot(...sub(P(b), r2)); if (d < bd) { bd = d; best = ib; } });
    perm.push(best); used.add(best); worst = Math.max(worst, bd);
  });
  return { perm, worst, bijective: used.size === A.length };
}

/* ── the AO representation: coefficient vectors transform c -> M c, with M[(B,j),(A,i)] = R_ji for p, 1 for s ── */
function aoRep(basis, perm, R) {
  const n = basis.n, M = new Float64Array(n * n), shellsOf = [];
  for (const sh of basis.shells) (shellsOf[sh.atom] ??= []).push(sh);
  for (const A of shellsOf.keys()) {
    shellsOf[A].forEach((sh, p) => {
      const img = shellsOf[perm[A]][p];
      if (img.l !== sh.l) throw new Error('aoRep: the image atom has a different shell list');
      if (sh.l === 0) M[img.bfs[0].idx * n + sh.bfs[0].idx] = 1;
      else if (sh.l === 1) {
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
          if (sh.bfs[i].l[i] !== 1 || img.bfs[j].l[j] !== 1) throw new Error('aoRep: p components are not in x,y,z order');
          M[img.bfs[j].idx * n + sh.bfs[i].idx] = R[j * 3 + i];
        }
      } else throw new Error(`aoRep: a Cartesian l = ${sh.l} shell needs its own 6x6 block (not implemented in this probe)`);
    });
  }
  return M;
}
const matmul = (A, B, n) => { const o = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const a = A[i * n + k]; if (a === 0) continue; for (let j = 0; j < n; j++) o[i * n + j] += a * B[k * n + j]; } return o; };
const transpose = (A, n) => { const o = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) o[j * n + i] = A[i * n + j]; return o; };
const maxDiff = (A, B) => { let m = 0; for (let i = 0; i < A.length; i++) m = Math.max(m, Math.abs(A[i] - B[i])); return m; };

/* ── analyse one solved molecule ──────────────────────────────────────────────────────────────────────────── */
function analyse(id, spec, sol, atoms, { tol = 1e-8, frame = null, classCheck = true, fixedExpect = null } = {}) {
  const t0 = performance.now();
  const n = sol.integrals.n, S = sol.integrals.S, C = sol.C, eps = Array.from(sol.orbitalEnergies), nocc = sol.nocc, Fock = sol.F;
  const c = chargeCentre(atoms), ax = frame ? frame(spec.frame(atoms, c)) : spec.frame(atoms, c);
  const Fm = [ax.x[0], ax.y[0], ax.z[0], ax.x[1], ax.y[1], ax.z[1], ax.x[2], ax.y[2], ax.z[2]];   // columns = frame axes in lab coordinates
  const frameDet = det3(Fm), toLab = (R) => mm(Fm, mm(R, tp(Fm)));
  const frameOrtho = Math.max(...mm(tp(Fm), Fm).map((v, i) => Math.abs(v - I3[i])));
  const out = { id, group: spec.group, convention: spec.convention, charge: sol.charge, frameHandedness: Math.sign(frameDet), frameOrthonormalityDefect: frameOrtho,
    centreOfNuclearChargeBohr: c, converged: sol.converged, nAO: n, nocc, nElectrons: sol.nElectrons };

  /* the operations */
  let ops;
  if (spec.kind === 'finite') {
    ops = OPS[spec.group]().map(([name, cls, R]) => ({ name, cls, Rsym: R }));
    const T = TABLES[spec.group], want = CLASS_SIZES[spec.group];
    const got = T.classes.map((cl) => ops.filter((o) => o.cls === cl).length);
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${id}: class sizes ${got} != ${want}`);
  } else {
    const phis = [0.7, 1.9, 2.9];
    ops = [...phis.map((p, k) => ({ name: `C(${p})`, cls: `Cphi${k + 1}`, Rsym: Rz(p), phi: p })), { name: 'sv(xz)', cls: 'sv', Rsym: sigmaV(0) }];
    if (spec.centro) ops.push({ name: 'i', cls: 'i', Rsym: neg(I3) }, ...phis.map((p, k) => ({ name: `iC(${p})`, cls: `iCphi${k + 1}`, Rsym: neg(Rz(p)), phi: p })));
  }
  let worstFramework = 0, worstOverlap = 0, worstFock = 0; const fixedByClass = {};
  for (const o of ops) {
    o.Rlab = toLab(o.Rsym);
    const ck = checkOp(atoms, c, o.Rlab);
    if (!ck.bijective || ck.worst > 1e-8) throw new Error(`${id}: operation ${o.name} (${o.cls}) is NOT a symmetry of the framework (worst ${ck.worst}, bijective ${ck.bijective})`);
    worstFramework = Math.max(worstFramework, ck.worst);
    fixedByClass[o.cls] = ck.perm.filter((b, a) => b === a).length;
    o.M = aoRep(sol.basis, ck.perm, o.Rlab);
    const Mt = transpose(o.M, n);
    worstOverlap = Math.max(worstOverlap, maxDiff(matmul(matmul(Mt, S, n), o.M, n), S));        // M^T S M = S : the AO representation is S-orthogonal
    if (Fock) worstFock = Math.max(worstFock, maxDiff(matmul(matmul(Mt, Fock, n), o.M, n), Fock)); // M^T F M = F : the converged Fock operator commutes with R
    o.SM = matmul(S, o.M, n);
  }
  out.verification = { operations: ops.length, worstFrameworkResidualBohr: worstFramework, worstOverlapInvariance: worstOverlap, worstFockInvariance: worstFock,
    fixedAtomsByClass: fixedByClass };
  if (id === 'C6H6' && classCheck) {   // class-labelling check: the primed class must pass through the atoms it is declared to pass through
    const e = fixedExpect || { '3C2p': 4, '3C2pp': 0, '3sv': 4, '3sd': 0, sh: 12, i: 0, C2: 0, '2C6': 0, '2C3': 0 };
    for (const [k, v] of Object.entries(e)) if (fixedByClass[k] !== v) throw new Error(`C6H6 class ${k}: ${fixedByClass[k]} fixed atoms, expected ${v}`);
    out.verification.classLabelCheck = 'fixed-atom counts match the declared class names (C2p and sv pass through atoms, C2pp and sd through bond midpoints, in the primary convention)';
  }

  /* the clusters and their characters */
  const ranges = clusterRanges(eps, tol), clusters = [];
  const chiOf = (o, s0, e0) => { let t = 0; for (let k = s0; k < e0; k++) for (let i = 0; i < n; i++) { let r = 0; for (let j = 0; j < n; j++) r += o.SM[i * n + j] * C[j * n + k]; t += r * C[i * n + k]; } return t; };
  const near = (x) => Math.abs(x - Math.round(x));
  const T = spec.kind === 'finite' ? TABLES[spec.group] : null, h = ops.length;
  ranges.forEach(([s0, e0], id0) => {
    const size = e0 - s0, chi = {}; for (const o of ops) chi[o.name] = chiOf(o, s0, e0);
    const cl = { id: id0, start: s0 + 1, end: e0, size, eps: eps[s0], spread: eps[e0 - 1] - eps[s0], chi };
    if (spec.kind === 'finite') {
      const mult = {}; let resid = 0;
      for (const [g, row] of Object.entries(T.irreps)) {
        let s = 0; for (const o of ops) s += chi[o.name] * row[T.classes.indexOf(o.cls)];
        mult[g] = s / h; resid = Math.max(resid, near(s / h));
      }
      const rounded = Object.fromEntries(Object.entries(mult).map(([g, v]) => [g, Math.round(v)]));
      const present = Object.entries(rounded).filter(([, v]) => v !== 0), dimSum = present.reduce((s, [g, v]) => s + v * T.irreps[g][0], 0);
      const single = present.length === 1 && present[0][1] === 1 && T.irreps[present[0][0]][0] === size && dimSum === size && resid < 1e-6;
      Object.assign(cl, { multiplicities: mult, residual: resid, dimensionCheck: dimSum === size, single, irrep: single ? present[0][0] : null,
        decomposition: present.map(([g, v]) => (v === 1 ? '' : v) + g).join(' + ') });
    } else {
      const byName = Object.fromEntries(ops.map((o) => [o.name, o])), ph = ops.filter((o) => o.cls.startsWith('Cphi')).map((o) => o.phi);
      const x = ph.map((p) => chi[`C(${p})`]);
      const nPi = (x[0] - x[1]) / (2 * (Math.cos(ph[0]) - Math.cos(ph[1]))), nSig = x[0] - 2 * nPi * Math.cos(ph[0]);
      const check3 = Math.abs(x[2] - (nSig + 2 * nPi * Math.cos(ph[2])));
      const svc = chi['sv(xz)'], nSigMinus = (nSig - svc) / 2;
      let resid = Math.max(near(nSig), near(nPi), check3, near(svc), Math.abs(near(nSigMinus)));
      let dSig = 0, dPi = 0, parityResid = 0, parityOK = true;
      if (spec.centro) {
        const y = ph.map((p) => chi[`iC(${p})`]);
        dPi = (y[0] - y[1]) / (2 * (Math.cos(ph[0]) - Math.cos(ph[1]))); dSig = y[0] - 2 * dPi * Math.cos(ph[0]);
        parityResid = Math.max(near(dSig), near(dPi), Math.abs(y[2] - (dSig + 2 * dPi * Math.cos(ph[2]))), Math.abs(chi.i - (dSig + 2 * dPi)));
        resid = Math.max(resid, parityResid);
      }
      const rs = Math.round(nSig), rp = Math.round(nPi), sizeOK = rs + 2 * rp === size;
      let irrep = null, single = false;
      if (sizeOK && resid < 1e-6 && ((rs === 1 && rp === 0) || (rs === 0 && rp === 1))) {
        const minus = rs === 1 && Math.round(svc) === -1;
        const ptype = rs === 1 ? (minus ? 'σ⁻' : 'σ') : 'π';
        const par = !spec.centro ? '' : (rs === 1 ? Math.round(dSig) : Math.round(dPi)) === 1 ? 'g' : 'u';
        irrep = ptype + par; single = true;
      }
      Object.assign(cl, { lambdaFit: { nSigma: nSig, nPi, thirdAngleCheck: check3, chiSigmaV: svc, nSigmaMinus: nSigMinus, dSigma: dSig, dPi, chiInversion: spec.centro ? chi.i : null },
        multiplicities: { sigma: nSig, pi: nPi }, residual: resid, dimensionCheck: sizeOK, single, irrep,
        decomposition: (() => {
          const t = [], r = (v) => Math.round(v), put = (k, v) => { if (v) t.push((v === 1 ? '' : v) + k); };
          if (spec.centro) { put('σg', r((nSig + dSig) / 2)); put('σu', r((nSig - dSig) / 2)); put('πg', r((nPi + dPi) / 2)); put('πu', r((nPi - dPi) / 2)); }
          else { put('σ', r((nSig + svc) / 2)); put('σ⁻', r(nSigMinus)); put('π', r(nPi)); }
          return t.join(' + '); })() });
    }
    clusters.push(cl);
  });

  /* counted labels, the configuration string, the frontier names */
  const counts = {}, labelOf = [];
  for (const cl of clusters) {
    if (cl.irrep === null) { cl.label = null; continue; }
    const key = cl.irrep, k = (counts[key] = (counts[key] || 0) + 1);
    cl.count = k;
    cl.label = spec.kind === 'finite' ? `${k}${lower(cl.irrep)}` : `${k}${cl.irrep}`;
    cl.labelUnicode = spec.kind === 'finite' ? uni(cl.label) : cl.label;
  }
  const homoCluster = clusters.findIndex((cl) => cl.start - 1 <= nocc - 1 && nocc - 1 < cl.end), lumoCluster = clusters.findIndex((cl) => cl.start - 1 <= nocc && nocc < cl.end);
  const straddle = homoCluster === lumoCluster;
  const frontierLevel = (ci) => { const d = ci - homoCluster; return d === 0 ? 'HOMO' : d === 1 ? 'LUMO' : d < 0 ? `HOMO-${-d}` : `LUMO+${d - 1}`; };
  /* the app's own label(k) of lab/orbitalsview.js / chemview.js orbFmt: one name PER ORBITAL INDEX, degeneracy-blind */
  const frontierApp = (k) => { const d = k - (nocc - 1); return d === 0 ? 'HOMO' : d === 1 ? 'LUMO' : d < 0 ? 'HOMO-' + (-d) : 'LUMO+' + (d - 1); };
  const aliases = (ALIASES[spec.group] || []).map((al) => ({ convention: al.convention, perCluster: clusters.map((cl) => (cl.irrep ? `${cl.count}${lower(aliasName(spec.group, al, cl.irrep))}` : null)) }));
  const mos = [];
  for (const cl of clusters) for (let k = cl.start - 1; k < cl.end; k++) {
    const rec = { k: k + 1, eps: eps[k], occ: k < nocc ? 2 : 0, cluster: cl.id, clusterSize: cl.size, irrep: cl.irrep, label: cl.label, labelUnicode: cl.labelUnicode ?? null,
      frontier: frontierLevel(cl.id), frontierApp: frontierApp(k), residual: cl.residual, exactlyOneIrrep: cl.single };
    if (aliases.length) rec.aliases = aliases.map((al, ai) => ({ convention: al.convention, label: al.perCluster[cl.id] }));
    mos.push(rec);
  }
  /* the configuration: occupied levels in ascending energy */
  let config = '', unlabelled = 0, partial = false;
  for (const cl of clusters) {
    const occ = Math.max(0, Math.min(cl.end, nocc) - (cl.start - 1)) * 2;
    if (occ === 0) continue;
    if (occ !== 2 * cl.size) partial = true;
    if (cl.label) config += `(${cl.label})${sup(occ)}`; else { config += `(?k${cl.start}-${cl.end})${sup(occ)}`; unlabelled++; }
  }
  const lab = (ci) => (ci >= 0 && clusters[ci] ? clusters[ci].label : null);
  const allSingle = clusters.every((cl) => cl.single);
  const worstRes = Math.max(...clusters.map((cl) => cl.residual));
  const spreads = clusters.map((cl) => cl.spread), gaps = []; for (let i = 1; i < clusters.length; i++) gaps.push(clusters[i].eps - clusters[i - 1].eps - clusters[i - 1].spread);
  Object.assign(out, { clusters: clusters.map(({ chi, ...rest }) => rest), clusterCharacters: Object.fromEntries(clusters.map((cl) => [cl.id, cl.chi])),
    mos, configuration: config, homoLabel: lab(homoCluster), lumoLabel: lab(lumoCluster), homoCluster, lumoCluster, degenerateHomo: clusters[homoCluster].size > 1,
    degenerateLumo: lumoCluster >= 0 ? clusters[lumoCluster].size > 1 : false, levelStraddlesAufbau: straddle || partial,
    allClustersSingleIrrep: allSingle, labelsReliable: allSingle, unlabelledLevels: unlabelled, worstMultiplicityResidual: worstRes,
    worstIntraClusterSpreadEh: Math.max(...spreads), smallestInterClusterGapEh: gaps.length ? Math.min(...gaps) : null, clusterToleranceEh: tol, aliases: aliases.map((a) => a.convention) });
  out.labellingMs = +(performance.now() - t0).toFixed(2);
  /* the names record a wire format would carry: the labels only, plus what makes them reproducible */
  const record = { pg: spec.group, axes: spec.convention, labels: mos.map((m) => m.label), config };
  out.namesRecordBytes = Buffer.byteLength(JSON.stringify(record), 'utf8');
  out.namesRecordFullBytes = Buffer.byteLength(JSON.stringify({ ...record, mos }), 'utf8');
  return out;
}

/* ── textbook comparison ──────────────────────────────────────────────────────────────────────────────────── */
const parseConfig = (s) => [...s.matchAll(/\(([^)]+)\)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)].map((m) => [m[1], +m[2].split('').map((d) => SUP.indexOf(d)).join('')]);
const TEXTBOOK = {
  H2O: { config: '(1a1)²(2a1)²(1b2)²(3a1)²(1b1)²', lumo: '4a1' },
  NH3: { config: '(1a1)²(2a1)²(1e)⁴(3a1)²' },
  CH4: { config: '(1a1)²(2a1)²(1t2)⁶' },
  N2: { config: '(1σg)²(1σu)²(2σg)²(2σu)²(1πu)⁴(3σg)²' },
  CO: { homo: '5σ', lumo: '2π', belowHomo: '1π' },
  HF: { config: '(1σ)²(2σ)²(3σ)²(1π)⁴' },
  CO2: { homo: '1πg' },
  C2H4: { nocc: 8, homo: '1b3u', lumo: '1b2g' },
  H2CO: { homo: '2b2', lumo: '2b1' },
  C6H6: { homo: '1e1g', lumo: '1e2u', lowestPi: '1a2u' },
};
function compare(id, r) {
  const tb = TEXTBOOK[id], rows = [], say = (item, expected, got, ok, how = '') => rows.push({ item, expected, got, verdict: ok ? 'MATCH' : 'DIFFERS', how });
  const lvlEps = (ci) => r.clusters[ci].eps;
  if (tb.config) {
    const ok = r.configuration === tb.config; let how = '';
    if (!ok) {
      const a = parseConfig(r.configuration), b = parseConfig(tb.config), sa = a.map((x) => x.join('^')).sort().join(), sb = b.map((x) => x.join('^')).sort().join();
      if (sa === sb) { const sw = []; a.forEach((x, i) => { if (x[0] !== b[i][0]) sw.push(`position ${i + 1}: computed ${x[0]} vs textbook ${b[i][0]}`); }); how = `same occupied levels, DIFFERENT ENERGY ORDER (${sw.join('; ')})`; }
      else how = 'different occupied set';
    }
    say('configuration', tb.config, r.configuration, ok, how);
  }
  if (tb.nocc !== undefined) say('occupied orbitals', String(tb.nocc), String(r.nocc), tb.nocc === r.nocc);
  if (tb.homo) say('HOMO', tb.homo, r.homoLabel ?? '?', r.homoLabel === tb.homo, r.homoLabel === tb.homo ? '' : `computed HOMO ${r.homoLabel}`);
  if (tb.lumo) say('LUMO', tb.lumo, r.lumoLabel ?? '?', r.lumoLabel === tb.lumo, r.lumoLabel === tb.lumo ? '' : `computed LUMO ${r.lumoLabel}`);
  if (tb.belowHomo) {
    const one = r.clusters.find((cl) => cl.label === '1π');
    say('1π lies below the HOMO', 'yes', one ? (one.id < r.homoCluster ? 'yes' : 'no') : 'no 1π level', !!one && one.id < r.homoCluster, one ? `1π at ${one.eps.toFixed(4)} Eh, HOMO ${r.homoLabel} at ${lvlEps(r.homoCluster).toFixed(4)} Eh` : '');
  }
  if (tb.lowestPi) {
    const piSet = new Set(['a2u', 'b2g', 'e1g', 'e2u']), pis = r.clusters.filter((cl) => cl.irrep && piSet.has(lower(cl.irrep)));
    const low = pis[0]; say('lowest pi orbital', tb.lowestPi, low ? low.label : '?', !!low && low.label === tb.lowestPi, low ? `pi levels ascending: ${pis.map((p) => `${p.label} ${p.eps.toFixed(4)}`).join(', ')}` : '');
  }
  if (id === 'N2') {
    const pi = r.clusters.find((cl) => cl.label === '1πu'), sg = r.clusters.find((cl) => cl.label === '3σg');
    rows.push({ item: 'N2: order of 1πu vs 3σg', expected: '1πu below 3σg (3σg = HOMO, experiment)', got: `1πu ${pi.eps.toFixed(6)} Eh, 3σg ${sg.eps.toFixed(6)} Eh -> ${pi.eps < sg.eps ? '1πu below 3σg' : '3σg BELOW 1πu (HOMO is 1πu)'}`,
      verdict: pi.eps < sg.eps ? 'MATCH' : 'DIFFERS', how: pi.eps < sg.eps ? '' : 'RHF/STO-3G Koopmans order inverts the experimental one' });
  }
  return rows;
}

/* ── run ──────────────────────────────────────────────────────────────────────────────────────────────────── */
const ORDER = ['H2O', 'NH3', 'CH4', 'N2', 'CO', 'HF', 'CO2', 'C2H4', 'H2CO', 'C6H6'];
const tableTests = selfTestTables();
console.log('character tables self-test:', Object.entries(tableTests).map(([g, v]) => `${g} h=${v.order} ${v.irreps} irreps ok=${v.ok}`).join(' | '));
const results = {}, failures = [], kept = {};
for (const id of ORDER) {
  const m = MOLECULE_BY_ID.get(id), atoms = moleculeAtoms(id), spec = SPEC[id];
  const t = performance.now();
  const sol = moleculeRHF({ atoms, basis: 'sto-3g', charge: moleculeCharge(id), record });   // exactly lab/mathworker.js ensureSolve's call
  const solveMs = +(performance.now() - t).toFixed(1);
  let r; kept[id] = { sol, atoms };
  try { r = analyse(id, spec, sol, atoms); } catch (e) { failures.push({ id, error: String(e.stack || e) }); console.log(`FAIL ${id}: ${e.message}`); continue; }
  r.energy = sol.energy; r.solveMs = solveMs; r.integralMs = sol.timings.integrals; r.formula = m.formula.replace(/<\/?m>/g, ''); r.geometrySource = m.source;
  r.comparison = compare(id, r);
  results[id] = r;
  console.log(`\n${id} (${spec.group}) solve ${solveMs} ms, labelling ${r.labellingMs} ms, E ${sol.energy.toFixed(9)}, ${r.nAO} AO, nocc ${r.nocc}, converged ${r.converged}`);
  console.log(`  verification: framework ${r.verification.worstFrameworkResidualBohr.toExponential(2)} bohr, MtSM-S ${r.verification.worstOverlapInvariance.toExponential(2)}, MtFM-F ${r.verification.worstFockInvariance.toExponential(2)}`);
  console.log(`  config ${r.configuration}   HOMO ${r.homoLabel}  LUMO ${r.lumoLabel}   residual ${r.worstMultiplicityResidual.toExponential(2)}  single-irrep ${r.allClustersSingleIrrep}`);
  console.log('  levels: ' + r.clusters.map((cl) => `${cl.label ?? '?'}[${cl.size}]${cl.eps.toFixed(4)}`).join('  '));
  for (const row of r.comparison) console.log(`  ${row.verdict.padEnd(7)} ${row.item}: expected ${row.expected} | got ${row.got}${row.how ? ' | ' + row.how : ''}`);
}


/* ── CONTROLS: does the machinery respond when it should?  (a) the aliases against a real recomputation under the relabelled
 * frame; (b) a distorted molecule must be REFUSED by the framework check; (c) clusters merged by a too-large tolerance must be
 * reported as MIXED, not labelled; (d) a second aufbau solution of N2 (the core guess's) labelled the same way. ─────────── */
const controls = {};
{
  const swap = (a, b, c) => (f) => ({ x: f[a], y: f[b], z: f[c] });
  const rot30 = (f) => { const co = Math.cos(Math.PI / 6), si = Math.sin(Math.PI / 6);
    return { x: add(scale(f.x, co), scale(f.y, si)), y: add(scale(f.x, -si), scale(f.y, co)), z: f.z }; };
  const jobs = [['H2O', 0, swap('y', 'x', 'z')], ['H2CO', 0, swap('y', 'x', 'z')], ['C2H4', 0, swap('z', 'y', 'x')], ['C2H4', 1, swap('y', 'z', 'x')], ['C6H6', 0, rot30]];
  controls.aliasRecomputation = [];
  for (const [id, ai, frame] of jobs) {
    const { sol, atoms } = kept[id], base = results[id];
    const re = analyse(id, SPEC[id], sol, atoms, { frame, fixedExpect: id === 'C6H6' ? { '3C2p': 0, '3C2pp': 4, '3sv': 0, '3sd': 4, sh: 12, i: 0, C2: 0, '2C6': 0, '2C3': 0 } : null });
    const alias = base.mos.filter((m, k, arr) => k === 0 || m.cluster !== arr[k - 1].cluster).map((m) => m.aliases[ai].label);
    const redone = re.clusters.map((cl) => cl.label);
    const same = alias.length === redone.length && alias.every((l, k) => l === redone[k]);
    controls.aliasRecomputation.push({ molecule: id, alias: base.aliases[ai], aliasEqualsRecomputedUnderRelabelledFrame: same, homo: [base.homoLabel, re.homoLabel], lumo: [base.lumoLabel, re.lumoLabel], configuration: re.configuration });
    if (!same) failures.push({ id, error: `alias ${ai} differs from the recomputation: ${alias.join(' ')} vs ${redone.join(' ')}` });
  }
  { // (b) one hydrogen of water moved 0.02 Å: the declared C2v is no longer a symmetry and the verifier must say so
    const atoms = moleculeAtoms('H2O').map((a) => ({ ...a })); atoms[1].y += 0.02 * 1.8897259886;
    const sol = moleculeRHF({ atoms, basis: 'sto-3g', record });
    let msg = null; try { analyse('H2O', SPEC.H2O, sol, atoms); } catch (e) { msg = e.message; }
    controls.distortedWater = { shiftAngstrom: 0.02, refused: msg !== null, message: msg };
  }
  { // (c) tolerance too large: C2H4's 1ag/1b1u core pair (gap 8e-4 Eh) and N2's 1σg/1σu (2e-3 Eh) merge
    const out = [];
    for (const [id, tol] of [['C2H4', 5e-3], ['N2', 5e-2]]) {
      const { sol, atoms } = kept[id], r = analyse(id, SPEC[id], sol, atoms, { tol });
      const bad = r.clusters.filter((cl) => !cl.single);
      out.push({ molecule: id, toleranceEh: tol, mixedClusters: bad.map((cl) => ({ moRange: [cl.start, cl.end], decomposition: cl.decomposition, label: cl.label })), allSingle: r.allClustersSingleIrrep, configuration: r.configuration });
    }
    controls.toleranceTooLarge = out;
  }
  { // (d) N2's second aufbau solution (core guess, 0.7298 Eh above the ground state)
    const { atoms } = kept.N2, sol2 = moleculeRHF({ atoms, basis: 'sto-3g', record, guess: 'core', detect: false, hessian: false, stability: false });
    const r = analyse('N2', SPEC.N2, sol2, atoms);
    controls.n2SecondSolution = { energy: sol2.energy, deltaEFromGround: sol2.energy - kept.N2.sol.energy, configuration: r.configuration, homo: r.homoLabel, lumo: r.lumoLabel, allSingle: r.allClustersSingleIrrep, worstResidual: r.worstMultiplicityResidual,
      refusedLevels: r.clusters.filter((cl) => !cl.single).map((cl) => ({ mo: cl.start, eps: cl.eps, nSigma: cl.lambdaFit.nSigma, nPi: cl.lambdaFit.nPi, chiSigmaV: cl.lambdaFit.chiSigmaV, residual: cl.residual })) };
  }
  { // (e) N2 in the app's OTHER basis (6-31+G*, 38 AO): the energy order of the last occupied levels, by degeneracy (a pi level is 2-fold)
    const rec2 = JSON.parse(readFileSync(new URL('../../lab/vendor/bse/6-31+g-star-v1.json', import.meta.url), 'utf8')); registerRecord('6-31+g-star', rec2);
    const t = performance.now(), sol2 = moleculeRHF({ atoms: kept.N2.atoms, basis: '6-31+g-star', record: rec2, detect: false, hessian: false, stability: false }), ms = +(performance.now() - t).toFixed(0);
    const e2 = Array.from(sol2.orbitalEnergies), rg = clusterRanges(e2, 1e-8), top = rg.filter(([a]) => a < sol2.nocc).slice(-3).map(([a, b]) => ({ size: b - a, eps: e2[a] }));
    controls.n2In631 = { nAO: sol2.integrals.n, nocc: sol2.nocc, solveMs: ms, lastOccupiedLevels: top, order: top.map((l) => (l.size === 2 ? 'pi' : 'sigma')).join(' < '),
      homoIs: top[top.length - 1].size === 2 ? '1πu (2-fold)' : '3σg (1-fold)', note: '2-fold level = 1πu, 1-fold valence level above 2σu = 3σg; names not derived here (6-31+G* has Cartesian d: aoRep refuses)' };
  }
  { // (g) gauge independence: rotate every degenerate cluster of C by a random orthogonal matrix (what a different eigensolver would hand back)
    let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff - 0.5; };
    controls.gaugeInvariance = [];
    for (const id of ['CH4', 'CO2', 'C6H6']) {
      const { sol, atoms } = kept[id], n = sol.integrals.n, C2 = Float64Array.from(sol.C), eps = Array.from(sol.orbitalEnergies);
      for (const [a, b] of clusterRanges(eps, 1e-8)) {
        const g = b - a; if (g < 2) continue;
        const Q = Array.from({ length: g }, () => Array.from({ length: g }, rnd));                  // Gram-Schmidt of a random matrix
        for (let i = 0; i < g; i++) { for (let j = 0; j < i; j++) { let d = 0; for (let k = 0; k < g; k++) d += Q[i][k] * Q[j][k]; for (let k = 0; k < g; k++) Q[i][k] -= d * Q[j][k]; }
          const nr = Math.hypot(...Q[i]); for (let k = 0; k < g; k++) Q[i][k] /= nr; }
        for (let u = 0; u < n; u++) for (let j = 0; j < g; j++) { let t = 0; for (let k = 0; k < g; k++) t += Q[j][k] * sol.C[u * n + a + k]; C2[u * n + a + j] = t; }
      }
      const re = analyse(id, SPEC[id], { ...sol, C: C2 }, atoms), base = results[id];
      controls.gaugeInvariance.push({ molecule: id, sameLabels: JSON.stringify(re.clusters.map((c) => c.label)) === JSON.stringify(base.clusters.map((c) => c.label)), sameConfiguration: re.configuration === base.configuration, worstResidual: re.worstMultiplicityResidual });
    }
  }
  { // (f) how exact are the ring molecules' symmetries that the library builds by walking a polygon?  C2 about the axis centre-of-charge -> atom 0
    const rows = {};
    for (const id of ['C4H4O', 'C5H5N']) {
      const atoms = moleculeAtoms(id), c = chargeCentre(atoms), u = unit(sub(P(atoms[0]), c));
      const Rm = [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => 2 * u[i] * u[j] - (i === j ? 1 : 0)));
      rows[id] = { c2ResidualBohr: checkOp(atoms, c, Rm).worst, ringClosureResidualAngstrom: RING_RESIDUALS[id] };
    }
    controls.ringGeometryExactness = rows;
  }
}
console.log('\nCONTROLS');
for (const c of controls.aliasRecomputation) console.log(`  alias ${c.molecule} [${c.alias.slice(0, 60)}...] == recomputed under relabelled frame: ${c.aliasEqualsRecomputedUnderRelabelledFrame}  HOMO ${c.homo[0]} -> ${c.homo[1]}, LUMO ${c.lumo[0]} -> ${c.lumo[1]}`);
console.log(`  distorted H2O (H1 moved 0.02 A) refused: ${controls.distortedWater.refused} — ${controls.distortedWater.message}`);
for (const c of controls.toleranceTooLarge) console.log(`  ${c.molecule} at tol ${c.toleranceEh} Eh: allSingle ${c.allSingle}; mixed: ${c.mixedClusters.map((m) => `MO ${m.moRange.join('-')} = ${m.decomposition}`).join('; ')}`);
for (const c of controls.gaugeInvariance) console.log(`  gauge: ${c.molecule} labels unchanged after a random rotation inside every degenerate cluster: ${c.sameLabels && c.sameConfiguration} (residual ${c.worstResidual.toExponential(2)})`);
console.log(`  N2 in 6-31+G* (${controls.n2In631.nAO} AO, ${controls.n2In631.solveMs} ms): last occupied levels ascending ${controls.n2In631.order}: ${controls.n2In631.lastOccupiedLevels.map((l) => l.eps.toFixed(4)).join(', ')} -> HOMO ${controls.n2In631.homoIs}`);
console.log(`  ring symmetry: ${Object.entries(controls.ringGeometryExactness).map(([k, v]) => `${k} C2 residual ${v.c2ResidualBohr.toExponential(2)} bohr, closure ${v.ringClosureResidualAngstrom.toExponential(2)} A`).join('; ')}`);
console.log(`  N2 second aufbau solution: E ${controls.n2SecondSolution.energy.toFixed(6)} (+${controls.n2SecondSolution.deltaEFromGround.toFixed(4)}), ${controls.n2SecondSolution.configuration}, allSingle ${controls.n2SecondSolution.allSingle}, residual ${controls.n2SecondSolution.worstResidual.toExponential(2)}`);

/* ── THE LIBRARY GAP SCAN: every SOLVABLE molecule, solved (primary SAD run only — the same ground state), clustered at the
 * app's 1e-8 Eh; the question is whether any true degeneracy is split (spread >= tol) or any accidental one merged (gap < tol).
 * No symmetry is used here: it measures only the energy structure that a names module would cluster on. ─────────────────── */
import { SOLVABLE } from '../../lab/molecules.js';
const scan = { tolEh: 1e-8, molecules: {} }, tScan = performance.now();
for (const m of SOLVABLE) {
  const sol = moleculeRHF({ atoms: moleculeAtoms(m.id), basis: 'sto-3g', charge: moleculeCharge(m.id), record, detect: false, hessian: false, stability: false });
  const eps = Array.from(sol.orbitalEnergies), rg = clusterRanges(eps, 1e-8);
  let spread = 0; const gaps = [];
  rg.forEach(([a, b], i) => { spread = Math.max(spread, eps[b - 1] - eps[a]); if (i) gaps.push(eps[a] - eps[rg[i - 1][1] - 1]); });
  const sizes = {}; rg.forEach(([a, b]) => { sizes[b - a] = (sizes[b - a] || 0) + 1; });
  scan.molecules[m.id] = { nAO: sol.integrals.n, converged: sol.converged, levels: rg.length, levelSizes: sizes, maxIntraSpreadEh: spread, minInterGapEh: gaps.length ? Math.min(...gaps) : null,
    gapsBelow1e4: gaps.filter((g) => g < 1e-4).map((g) => +g.toExponential(3)) };
}
scan.ms = +(performance.now() - tScan).toFixed(0);
{
  const rows = Object.entries(scan.molecules);
  const worstSpread = rows.reduce((a, [k, v]) => (v.maxIntraSpreadEh > a[1] ? [k, v.maxIntraSpreadEh] : a), ['', 0]);
  const smallGap = rows.reduce((a, [k, v]) => (v.minInterGapEh !== null && v.minInterGapEh < a[1] ? [k, v.minInterGapEh] : a), ['', Infinity]);
  scan.summary = { solved: rows.length, worstIntraSpread: { molecule: worstSpread[0], eh: worstSpread[1] }, smallestInterGap: { molecule: smallGap[0], eh: smallGap[1] },
    moleculesWithGapBelow1e4: rows.filter(([, v]) => v.gapsBelow1e4.length).map(([k, v]) => `${k}: ${v.gapsBelow1e4.join(', ')}`) };
  console.log(`\nLIBRARY GAP SCAN (${rows.length} solvable molecules, ${scan.ms} ms): worst intra-cluster spread ${worstSpread[1].toExponential(2)} Eh (${worstSpread[0]}), smallest inter-cluster gap ${smallGap[1].toExponential(2)} Eh (${smallGap[0]})`);
  console.log('  gaps < 1e-4 Eh between separate levels: ' + (scan.summary.moleculesWithGapBelow1e4.join(' | ') || 'none'));
}

const meta = { probe: 'names-probe.mjs', date: '2026-10-01', node: process.version, basis: 'sto-3g (lab/vendor/bse/sto-3g-v1.json)', solver: 'moleculeRHF defaults (SAD + core guesses, Hessian, stability probe) — the call lab/mathworker.js ensureSolve makes',
  clusterToleranceEh: 1e-8, clusterNote: 'canon-gauge clusterRanges(eps, 1e-8), the tolerance lab/rhf-molecule.js canonicalOrbitals uses', characterTableSelfTest: tableTests,
  linearAngles: 'phi = 0.7, 1.9 (solve) and 2.9 (check) rad about the axis' };
writeFileSync(new URL('names-probe.json', HERE), JSON.stringify({ meta, molecules: results, controls, libraryGapScan: scan, failures }, null, 1) + '\n');
console.log(`\nwrote names-probe.json (${Object.keys(results).length} molecules, ${failures.length} failures)`);
