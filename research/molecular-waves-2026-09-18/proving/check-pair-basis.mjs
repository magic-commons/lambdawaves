// check-pair-basis.mjs — gates the assembly the window will actually type (JUDGMENT.md section 3, last paragraph;
// REGISTER-WINDOW-SPEC.md section 10):  D_ov = √2 conj(b0) Z,  D_vo = D_ov†,  D_vv = Z†Z,  D_oo = 2·1 − Z Z†,
// with Z(t) = Σ_K b_K e^{−iω_K t} X^K, against the full Σ_AB conj(b_A) b_B e^{i(E_A−E_B)t} γ^{AB} assembly from the
// closed forms.  Also: hermiticity, trace N, and occupations in [0, 2] at full amplitude.
// Run: node check-pair-basis.mjs [ids...]
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { hermitianEigen } from './snapshot/lab/density.js';

const load = (id) => JSON.parse(fs.readFileSync(new URL(`./data/${id}.json`, import.meta.url), 'utf8'));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['H2O', 'NH3', 'CH4', 'C6H6'];
const out = {};

for (const id of ids) {
  const d = load(id), n = d.n, nocc = d.nocc, nv = d.nvir, m = d.pairSpace;
  const nStates = Math.min(6, d.omegaTDA.length);
  const ks = [...Array(nStates).keys()];
  const Xs = ks.map((k) => Float64Array.from(d.XTDA[k])), E = [0, ...ks.map((k) => d.omegaTDA[k])];
  const nS = nStates + 1;
  /* γ^{AB} from the closed forms, real, n×n */
  const gamma = (A, B) => {
    const g = new Float64Array(n * n);
    if (A === 0 && B === 0) { for (let i = 0; i < nocc; i++) g[i * n + i] = 2; return g; }
    if (A === 0) { const X = Xs[B - 1]; for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) g[i * n + nocc + a] = Math.SQRT2 * X[i * nv + a]; return g; }
    if (B === 0) { const X = Xs[A - 1]; for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) g[(nocc + a) * n + i] = Math.SQRT2 * X[i * nv + a]; return g; }
    const XK = Xs[A - 1], XL = Xs[B - 1];
    let ov = 0; for (let p = 0; p < m; p++) ov += XK[p] * XL[p];
    for (let i = 0; i < nocc; i++) for (let j = 0; j < nocc; j++) {
      let s = 0; for (let a = 0; a < nv; a++) s += XK[j * nv + a] * XL[i * nv + a];
      g[i * n + j] = (i === j ? 2 * ov : 0) - s;
    }
    for (let a = 0; a < nv; a++) for (let b = 0; b < nv; b++) {
      let s = 0; for (let i = 0; i < nocc; i++) s += XK[i * nv + a] * XL[i * nv + b];
      g[(nocc + a) * n + nocc + b] = s;
    }
    return g;
  };
  const G = ks.concat([0]).map(() => null); const GG = [];
  for (let a = 0; a < nS; a++) { GG.push([]); for (let b = 0; b < nS; b++) GG[a].push(gamma(a, b)); }
  const full = (b, t) => {
    const re = new Float64Array(n * n), im = new Float64Array(n * n);
    for (let a = 0; a < nS; a++) for (let c = 0; c < nS; c++) {
      const ph = (E[a] - E[c]) * t, cr = Math.cos(ph), ci = Math.sin(ph);
      const wr0 = b[a].re * b[c].re + b[a].im * b[c].im, wi0 = b[a].re * b[c].im - b[a].im * b[c].re;
      const wr = wr0 * cr - wi0 * ci, wi = wr0 * ci + wi0 * cr, g = GG[a][c];
      for (let k = 0; k < n * n; k++) { re[k] += wr * g[k]; im[k] += wi * g[k]; }
    }
    return { re, im };
  };
  const pair = (b, t) => {                                   // the window's recipe
    const zr = new Float64Array(m), zi = new Float64Array(m);
    for (let k = 0; k < nStates; k++) {
      const ph = -E[k + 1] * t, cr = Math.cos(ph), ci = Math.sin(ph);
      const ar = b[k + 1].re * cr - b[k + 1].im * ci, ai = b[k + 1].re * ci + b[k + 1].im * cr, X = Xs[k];
      for (let p = 0; p < m; p++) { zr[p] += ar * X[p]; zi[p] += ai * X[p]; }
    }
    const re = new Float64Array(n * n), im = new Float64Array(n * n), s2 = Math.SQRT2;
    for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) {         // D_ov = √2 conj(b0) Z, D_vo = D_ov†
      const zr0 = zr[i * nv + a], zi0 = zi[i * nv + a];
      const vr = s2 * (b[0].re * zr0 + b[0].im * zi0), vi = s2 * (b[0].re * zi0 - b[0].im * zr0);
      re[i * n + nocc + a] = vr; im[i * n + nocc + a] = vi;
      re[(nocc + a) * n + i] = vr; im[(nocc + a) * n + i] = -vi;
    }
    for (let a = 0; a < nv; a++) for (let b2 = 0; b2 < nv; b2++) {        // D_vv = Z† Z
      let sr = 0, si = 0;
      for (let i = 0; i < nocc; i++) {
        const ar = zr[i * nv + a], ai = zi[i * nv + a], br = zr[i * nv + b2], bi = zi[i * nv + b2];
        sr += ar * br + ai * bi; si += ar * bi - ai * br;
      }
      re[(nocc + a) * n + nocc + b2] = sr; im[(nocc + a) * n + nocc + b2] = si;
    }
    for (let i = 0; i < nocc; i++) for (let j = 0; j < nocc; j++) {       // D_oo = 2·1 − Z Z†
      let sr = 0, si = 0;
      for (let a = 0; a < nv; a++) {
        const ar = zr[i * nv + a], ai = zi[i * nv + a], br = zr[j * nv + a], bi = zi[j * nv + a];
        sr += ar * br + ai * bi; si += ai * br - ar * bi;
      }
      re[i * n + j] = (i === j ? 2 : 0) - sr; im[i * n + j] = -si;
    }
    return { re, im };
  };
  let seed = 987654321;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32 - 0.5;
  let dPair = 0, herm = 0, trErr = 0, occMin = Infinity, occMax = -Infinity;
  for (let trial = 0; trial < 30; trial++) {
    const b = Array.from({ length: nS }, () => ({ re: rnd(), im: rnd() }));
    const nb = Math.sqrt(b.reduce((s, z) => s + z.re ** 2 + z.im ** 2, 0));
    b.forEach((z) => { z.re /= nb; z.im /= nb; });
    const t = 3.7 * trial;
    const A = full(b, t), B = pair(b, t);
    for (let k = 0; k < n * n; k++) dPair = Math.max(dPair, Math.abs(A.re[k] - B.re[k]), Math.abs(A.im[k] - B.im[k]));
    for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) {
      herm = Math.max(herm, Math.abs(A.re[p * n + q] - A.re[q * n + p]), Math.abs(A.im[p * n + q] + A.im[q * n + p]));
    }
    let tr = 0; for (let p = 0; p < n; p++) tr += A.re[p * n + p];
    trErr = Math.max(trErr, Math.abs(tr - 2 * nocc));
    const ev = hermitianEigen({ n, re: A.re, im: A.im }).w;
    occMin = Math.min(occMin, ev[0]); occMax = Math.max(occMax, ev[n - 1]);
  }
  out[id] = { states: nS, trials: 30, pairBasisVsFullGamma: dPair, hermiticity: herm, traceError: trErr,
              occupationMin: occMin, occupationMax: occMax };
  console.log(id, JSON.stringify(out[id]));
  assert.ok(dPair < 1e-12, `${id}: pair-basis assembly disagrees with the γ assembly by ${dPair}`);
  assert.ok(occMin > -1e-12 && occMax < 2 + 1e-12, `${id}: occupations left [0, 2]`);
}
fs.writeFileSync(new URL('./out-pair-basis.json', import.meta.url), JSON.stringify(out, null, 2));
