// Research only — no application module is modified.  Reproduce: node research/molecular-waves-2026-09-18/probe-fable.mjs
// Three questions the judgment of MOLECULAR-WAVES-PLAN rests on:
//   1. where benzene's preparation time actually goes (how many 315×315 Jacobi diagonalisations, and what one costs);
//   2. what a Householder–QL eigensolver + a Cholesky-reduced RPA + a Cholesky stability test would cost instead;
//   3. whether a CIS (TDA) many-electron register gives an N-representable density at ANY amplitude, and whether the
//      degenerate bright pair of benzene taken as Ψx + iΨy carries a rotating dipole (a ring current).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { moleculeRHF, registerRecord, stabilityHessian } from '../../lab/rhf-molecule.js';
import { moleculeAtoms, moleculeCharge } from '../../lab/molecules.js';
import { rpa } from '../../lab/rpa-inspector.js';
import { eigSym } from '../../lab/h2ci.js';
import { hermitianEigen } from '../../lab/density.js';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
registerRecord('sto-3g', JSON.parse(read('../../lab/vendor/bse/sto-3g-v1.json')));
const clock = (fn) => { const t = performance.now(), value = fn(); return { value, ms: performance.now() - t }; };

/* ── Householder tridiagonalisation + implicit QL (the EISPACK tred2/tql2 pair, as in JAMA), row-major ───────── */
export function eigQL(A, n) {
  const V = Float64Array.from(A), d = new Float64Array(n), e = new Float64Array(n);
  for (let j = 0; j < n; j++) d[j] = V[(n - 1) * n + j];
  for (let i = n - 1; i > 0; i--) {
    let scale = 0, h = 0;
    for (let k = 0; k < i; k++) scale += Math.abs(d[k]);
    if (scale === 0) {
      e[i] = d[i - 1];
      for (let j = 0; j < i; j++) { d[j] = V[(i - 1) * n + j]; V[i * n + j] = 0; V[j * n + i] = 0; }
    } else {
      for (let k = 0; k < i; k++) { d[k] /= scale; h += d[k] * d[k]; }
      let f = d[i - 1], g = Math.sqrt(h); if (f > 0) g = -g;
      e[i] = scale * g; h -= f * g; d[i - 1] = f - g;
      for (let j = 0; j < i; j++) e[j] = 0;
      for (let j = 0; j < i; j++) {
        f = d[j]; V[j * n + i] = f; g = e[j] + V[j * n + j] * f;
        for (let k = j + 1; k <= i - 1; k++) { g += V[k * n + j] * d[k]; e[k] += V[k * n + j] * f; }
        e[j] = g;
      }
      f = 0;
      for (let j = 0; j < i; j++) { e[j] /= h; f += e[j] * d[j]; }
      const hh = f / (h + h);
      for (let j = 0; j < i; j++) e[j] -= hh * d[j];
      for (let j = 0; j < i; j++) {
        f = d[j]; g = e[j];
        for (let k = j; k <= i - 1; k++) V[k * n + j] -= f * e[k] + g * d[k];
        d[j] = V[(i - 1) * n + j]; V[i * n + j] = 0;
      }
    }
    d[i] = h;
  }
  for (let i = 0; i < n - 1; i++) {
    V[(n - 1) * n + i] = V[i * n + i]; V[i * n + i] = 1;
    const h = d[i + 1];
    if (h !== 0) {
      for (let k = 0; k <= i; k++) d[k] = V[k * n + i + 1] / h;
      for (let j = 0; j <= i; j++) {
        let g = 0;
        for (let k = 0; k <= i; k++) g += V[k * n + i + 1] * V[k * n + j];
        for (let k = 0; k <= i; k++) V[k * n + j] -= g * d[k];
      }
    }
    for (let k = 0; k <= i; k++) V[k * n + i + 1] = 0;
  }
  for (let j = 0; j < n; j++) { d[j] = V[(n - 1) * n + j]; V[(n - 1) * n + j] = 0; }
  V[(n - 1) * n + n - 1] = 1; e[0] = 0;
  /* tql2 */
  for (let i = 1; i < n; i++) e[i - 1] = e[i];
  e[n - 1] = 0;
  let f = 0, tst1 = 0; const eps = 2 ** -52;
  for (let l = 0; l < n; l++) {
    tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
    let m = l; while (m < n) { if (Math.abs(e[m]) <= eps * tst1) break; m++; }
    if (m > l) {
      let iter = 0;
      do {
        if (++iter > 60) throw new Error('eigQL: no convergence');
        let g = d[l], p = (d[l + 1] - g) / (2 * e[l]), r = Math.hypot(p, 1); if (p < 0) r = -r;
        d[l] = e[l] / (p + r); d[l + 1] = e[l] * (p + r);
        const dl1 = d[l + 1]; let h = g - d[l];
        for (let i = l + 2; i < n; i++) d[i] -= h;
        f += h;
        p = d[m]; let c = 1, c2 = 1, c3 = 1, s = 0, s2 = 0; const el1 = e[l + 1];
        for (let i = m - 1; i >= l; i--) {
          c3 = c2; c2 = c; s2 = s;
          g = c * e[i]; h = c * p; r = Math.hypot(p, e[i]); e[i + 1] = s * r; s = e[i] / r; c = p / r;
          p = c * d[i] - s * g; d[i + 1] = h + s * (c * g + s * d[i]);
          for (let k = 0; k < n; k++) { const kk = k * n + i; h = V[kk + 1]; V[kk + 1] = s * V[kk] + c * h; V[kk] = c * V[kk] - s * h; }
        }
        p = -s * s2 * c3 * el1 * e[l] / dl1; e[l] = s * p; d[l] = c * p;
      } while (Math.abs(e[l]) > eps * tst1);
    }
    d[l] += f; e[l] = 0;
  }
  const idx = [...Array(n).keys()].sort((i, j) => d[i] - d[j]);
  const values = idx.map((k) => d[k]), vectors = new Float64Array(n * n);
  idx.forEach((k, col) => { for (let i = 0; i < n; i++) vectors[i * n + col] = V[i * n + k]; });
  return { values, vectors };
}
/** Cholesky A = L Lᵀ (lower, row-major); null when A is not positive definite — which IS the stability verdict */
export function cholesky(A, n) {
  const L = new Float64Array(n * n);
  for (let j = 0; j < n; j++) {
    let s = A[j * n + j]; for (let k = 0; k < j; k++) s -= L[j * n + k] ** 2;
    if (!(s > 0)) return null;
    const d = Math.sqrt(s); L[j * n + j] = d;
    for (let i = j + 1; i < n; i++) { let t = A[i * n + j]; for (let k = 0; k < j; k++) t -= L[i * n + k] * L[j * n + k]; L[i * n + j] = t / d; }
  }
  return L;
}
const matmul = (A, B, m) => { const C = new Float64Array(m * m); for (let i = 0; i < m; i++) for (let k = 0; k < m; k++) { const a = A[i * m + k]; if (a === 0) continue; for (let j = 0; j < m; j++) C[i * m + j] += a * B[k * m + j]; } return C; };
const transpose = (A, m) => { const T = new Float64Array(m * m); for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) T[j * m + i] = A[i * m + j]; return T; };
/** RPA by ONE symmetric eigenproblem: A − B = L Lᵀ, W = Lᵀ(A + B)L, W u = ω² u, X + Y = L u / √ω, X − Y = (A + B)(X + Y)/ω */
export function rpaCholesky(A, B, m) {
  const AmB = new Float64Array(m * m), ApB = new Float64Array(m * m);
  for (let k = 0; k < m * m; k++) { AmB[k] = A[k] - B[k]; ApB[k] = A[k] + B[k]; }
  const L = cholesky(AmB, m); if (!L) throw new Error('A − B is not positive definite');
  const W = matmul(matmul(transpose(L, m), ApB, m), L, m);
  for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) { const v = 0.5 * (W[i * m + j] + W[j * m + i]); W[i * m + j] = W[j * m + i] = v; }
  const e = eigQL(W, m), omega = e.values.map(Math.sqrt), XpY = matmul(L, e.vectors, m);
  for (let k = 0; k < m; k++) { const s = 1 / Math.sqrt(omega[k]); for (let p = 0; p < m; p++) XpY[p * m + k] *= s; }
  return { omega, XpY, stableAmB: true, stableApB: !!cholesky(ApB, m) };
}

const out = { date: new Date().toISOString(), node: process.version, molecules: {} };
for (const id of ['H2O', 'C2H4', 'C6H6']) {
  const atoms = moleculeAtoms(id), charge = moleculeCharge(id);
  /* 1 ── the profile of what ships today */
  const bare = clock(() => moleculeRHF({ atoms, basis: 'sto-3g', charge, detect: false, stability: false, hessian: false }));
  const full = clock(() => moleculeRHF({ atoms, basis: 'sto-3g', charge }));
  const sol = full.value, I = sol.integrals, n = I.n, nocc = sol.nocc, m = nocc * (n - nocc);
  const hess = clock(() => stabilityHessian(I, { C: sol.C, orbitalEnergies: sol.orbitalEnergies }, nocc));
  const R = clock(() => rpa({ S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc }));
  const { A, B, roots, pairs } = R.value;
  /* 2 ── the replacements, on the same matrices */
  const jac = clock(() => eigSym(A, m)), ql = clock(() => eigQL(A, m));
  const dEig = Math.max(...jac.value.values.map((v, k) => Math.abs(v - ql.value.values[k])));
  const chol = clock(() => rpaCholesky(A, B, m));
  const dOmega = Math.max(...roots.map((r, k) => Math.abs(r.omega - chol.value.omega[k])));
  /* oscillator strengths from the Cholesky route, against the shipped ones */
  const Cm = sol.C, dipMO = [I.X, I.Y, I.Z].map((M) => pairs.map(({ i, a }) => { let s = 0; for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) s += Cm[u * n + i] * M[u * n + w] * Cm[w * n + a]; return s; }));
  let dF = 0;
  for (let k = 0; k < m; k++) {
    let f = 0; for (const v of dipMO) { let s = 0; for (let p = 0; p < m; p++) s += Math.SQRT2 * chol.value.XpY[p * m + k] * v[p]; f += s * s; }
    dF = Math.max(dF, Math.abs((2 / 3) * chol.value.omega[k] * f - roots[k].f));
  }
  /* 3 ── the CIS register: Ψ(t) = b₀Φ₀ + Σ_K b_K e^{−iω_K t} Ψ_K, its one-particle density matrix in the MO basis */
  const nv = n - nocc, act = [...roots.keys()].sort((p, q) => roots[q].fTDA - roots[p].fTDA).slice(0, Math.min(4, m)).sort((p, q) => p - q);
  const Xs = act.map((k) => roots[k].XTDA), Es = [0, ...act.map((k) => roots[k].omegaTDA)], nS = Es.length;
  const gamma = (Aa, Bb) => {                               // γ_pq = ⟨A| E_pq |B⟩, real, n×n (MO basis); 0 = the determinant
    const g = new Float64Array(n * n);
    if (Aa === 0 && Bb === 0) { for (let i = 0; i < nocc; i++) g[i * n + i] = 2; return g; }
    if (Aa === 0) { const X = Xs[Bb - 1]; for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) g[i * n + nocc + a] = Math.SQRT2 * X[i * nv + a]; return g; }
    if (Bb === 0) { const X = Xs[Aa - 1]; for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) g[(nocc + a) * n + i] = Math.SQRT2 * X[i * nv + a]; return g; }
    const XK = Xs[Aa - 1], XL = Xs[Bb - 1];
    let ov = 0; for (let p = 0; p < m; p++) ov += XK[p] * XL[p];
    for (let i = 0; i < nocc; i++) for (let j = 0; j < nocc; j++) { let s = 0; for (let a = 0; a < nv; a++) s += XK[j * nv + a] * XL[i * nv + a]; g[i * n + j] = (i === j ? 2 * ov : 0) - s; }
    for (let a = 0; a < nv; a++) for (let b = 0; b < nv; b++) { let s = 0; for (let i = 0; i < nocc; i++) s += XK[i * nv + a] * XL[i * nv + b]; g[(nocc + a) * n + nocc + b] = s; }
    return g;
  };
  const G = []; for (let a = 0; a < nS; a++) { G.push([]); for (let b = 0; b < nS; b++) G[a].push(gamma(a, b)); }
  const densityAt = (b, t) => {                             // D(t) = Σ_AB conj(b_A) b_B e^{i(E_A − E_B)t} γ^{AB}, Hermitian
    const re = new Float64Array(n * n), im = new Float64Array(n * n);
    for (let a = 0; a < nS; a++) for (let c = 0; c < nS; c++) {
      const ph = (Es[a] - Es[c]) * t, cr = Math.cos(ph), ci = Math.sin(ph);
      const wr0 = b[a].re * b[c].re + b[a].im * b[c].im, wi0 = b[a].re * b[c].im - b[a].im * b[c].re;   // conj(b_A) b_B
      const wr = wr0 * cr - wi0 * ci, wi = wr0 * ci + wi0 * cr, g = G[a][c];
      for (let k = 0; k < n * n; k++) { re[k] += wr * g[k]; im[k] += wi * g[k]; }
    }
    return { re, im };
  };
  /* N-representability at LARGE amplitude: random normalised b, many times — occupations must stay in [0, 2], trace = N */
  let occMin = Infinity, occMax = -Infinity, trErr = 0, hermErr = 0, seed = 12345;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32 - 0.5;
  for (let trial = 0; trial < 40; trial++) {
    const b = Es.map(() => ({ re: rnd(), im: rnd() })), nb = Math.sqrt(b.reduce((s, z) => s + z.re ** 2 + z.im ** 2, 0));
    b.forEach((z) => { z.re /= nb; z.im /= nb; });
    const D = densityAt(b, 7.3 * trial);
    for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) hermErr = Math.max(hermErr, Math.abs(D.re[p * n + q] - D.re[q * n + p]), Math.abs(D.im[p * n + q] + D.im[q * n + p]));
    let tr = 0; for (let p = 0; p < n; p++) tr += D.re[p * n + p]; trErr = Math.max(trErr, Math.abs(tr - 2 * nocc));
    const ev = hermitianEigen({ n, re: D.re, im: D.im }).w; occMin = Math.min(occMin, ev[0]); occMax = Math.max(occMax, ev[n - 1]);
  }
  /* the linear-response counterfactual: ρ₀ + g·ρ^tr at a "performance" gain is NOT N-representable */
  const lin = new Float64Array(n * n); { const g0 = G[0][0], g1 = G[0][1], g2 = G[1][0]; for (let k = 0; k < n * n; k++) lin[k] = g0[k] + 0.6 * (g1[k] + g2[k]); }
  const linOcc = eigSym(lin, n).values;
  const rec = { nAO: n, nocc, pairSpace: m,
    shippedMs: { groundBare: +bare.ms.toFixed(1), groundFull: +full.ms.toFixed(1), stabilityHessianOnce: +hess.ms.toFixed(1), rpa: +R.ms.toFixed(1) },
    eigensolverMs: { jacobi: +jac.ms.toFixed(1), householderQL: +ql.ms.toFixed(1), ratio: +(jac.ms / ql.ms).toFixed(1), maxEigenvalueDiff: dEig },
    rpaCholeskyMs: +chol.ms.toFixed(1), rpaCholeskyVsShipped: { maxOmegaDiff: dOmega, maxOscillatorDiff: dF, stableApB: chol.value.stableApB },
    cisRegister: { activeStates: act, omegaTDA: Es.slice(1), trials: 40, occupationMin: occMin, occupationMax: occMax, traceError: trErr, hermiticityError: hermErr,
      linearCounterfactualOccupations: [linOcc[0], linOcc[n - 1]] } };
  /* the ring current: benzene's degenerate bright pair as (Ψ₁ + iΨ₂)/√2 on top of the ground state */
  if (id === 'C6H6') {
    const rMO = [I.X, I.Y, I.Z].map((M) => { const T = new Float64Array(n * n); for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) { let s = 0; for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) s += Cm[u * n + p] * M[u * n + w] * Cm[w * n + q]; T[p * n + q] = s; } return T; });
    const bright = [...act].sort((p, q) => roots[q].fTDA - roots[p].fTDA).slice(0, 2).sort((p, q) => p - q);
    assert(Math.abs(roots[bright[0]].omegaTDA - roots[bright[1]].omegaTDA) < 1e-8, 'the two brightest TDA roots of benzene are one degenerate pair');
    const s1 = act.indexOf(bright[0]) + 1, s2 = act.indexOf(bright[1]) + 1, w = roots[bright[0]].omegaTDA;
    const b = Es.map(() => ({ re: 0, im: 0 })); b[0].re = Math.sqrt(0.5); b[s1].re = 0.5; b[s2].im = 0.5;
    const dip = (t) => { const D = densityAt(b, t); return rMO.map((r) => { let s = 0; for (let k = 0; k < n * n; k++) s -= D.re[k] * r[k]; return s; }); };
    const d0 = dip(0), samples = [...Array(16).keys()].map((k) => dip((2 * Math.PI / w) * k / 16));
    const mags = samples.map((d) => Math.hypot(d[0] - 0, d[1] - 0)), planar = Math.max(...samples.map((d) => Math.abs(d[2])));
    const angles = samples.map((d) => Math.atan2(d[1], d[0]));
    let turn = 0; for (let k = 1; k < 16; k++) { let da = angles[k] - angles[k - 1]; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; turn += da; }
    rec.ringCurrent = { omegaTDA: w, degeneracySplit: Math.abs(roots[bright[0]].omegaTDA - roots[bright[1]].omegaTDA), dipoleMagnitudeMin: Math.min(...mags), dipoleMagnitudeMax: Math.max(...mags),
      outOfPlaneMax: planar, turnOver15of16PeriodInUnitsOf2Pi: turn / (2 * Math.PI), d0 };
  }
  out.molecules[id] = rec;
  console.log(id, JSON.stringify(rec));
}
fs.writeFileSync(new URL('./measurements-fable.json', import.meta.url), JSON.stringify(out, null, 2));
