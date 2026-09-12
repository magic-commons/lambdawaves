/* lin.mjs — ROUND 4 · OPUS, questions 13 and 14.  Dumps (a) the converged H₂O quantities the RPA superoperators
 * are built from, and (b) the LINEARISED one-step maps of the ACTUAL lab/density.js integrators, extracted by
 * central finite differences about the stationary density in an orthonormal Hermitian basis of the Löwdin frame.
 * The two-electron response is scaled by s (F_s[P] = h + g[D0 + s(D − D0)]), which is exactly B ↦ sB with F0 fixed.
 * Nothing under lab/ is touched: magnus2 and mmut are imported. */
import { readFileSync, writeFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
import { magnus2, mmut, loewdin, sandwich, cmat, creal } from '../../../lab/density.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n, N2 = n * n;
const scfres = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
const { X, W } = loewdin(mol.S, n);
const P0 = sandwich(W, creal(scfres.D, n));                                   // stationary Löwdin density

/* Hermitian orthonormal basis: E_aa, then (E_ab+E_ba)/√2 and i(E_ab−E_ba)/√2 for a<b — 49 real dimensions */
const HB = [];
for (let a = 0; a < n; a++) { const H = cmat(n); H.re[a * n + a] = 1; HB.push(H); }
for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
  const R = cmat(n), I = cmat(n), r = Math.SQRT1_2;
  R.re[a * n + b] = r; R.re[b * n + a] = r; HB.push(R);
  I.im[a * n + b] = r; I.im[b * n + a] = -r; HB.push(I);
}
if (HB.length !== N2) throw new Error('basis count');
const proj = (M) => HB.map((H) => { let s = 0; for (let k = 0; k < N2; k++) s += H.re[k] * M.re[k] + H.im[k] * M.im[k]; return s; });

/* the Löwdin-frame Fock with the two-electron response scaled by s */
const g2e = (D) => { const F = cmat(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let fr = 0, fi = 0;
    for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) { const J = mol.eri[((i * n + j) * n + k) * n + l], K = 0.5 * mol.eri[((i * n + l) * n + k) * n + j];
      fr += D.re[k * n + l] * J - D.re[l * n + k] * K; fi += D.im[k * n + l] * J - D.im[l * n + k] * K; }
    F.re[i * n + j] = fr; F.im[i * n + j] = fi; }
  return F; };
const D0AO = sandwich(X, P0), g0 = g2e(D0AO);
const fockS = (s) => (Pm) => {                                                // Löwdin-frame Fock, response × s
  const D = sandwich(X, Pm), F = cmat(n);
  const gg = s === 1 ? g2e(D) : null, gs = s === 1 ? null : g2e({ re: Float64Array.from(D.re, (v, k) => D0AO.re[k] + s * (v - D0AO.re[k])), im: Float64Array.from(D.im, (v, k) => D0AO.im[k] + s * (v - D0AO.im[k])), n });
  const G = gg || gs;
  for (let k = 0; k < N2; k++) { F.re[k] = mol.h[k] + G.re[k]; F.im[k] = G.im[k]; }
  return sandwich(X, F);
};
const add = (A, B, c) => ({ re: Float64Array.from(A.re, (v, k) => v + c * B.re[k]), im: Float64Array.from(A.im, (v, k) => v + c * B.im[k]), n });
const sub = (A, B) => ({ re: Float64Array.from(A.re, (v, k) => v - B.re[k]), im: Float64Array.from(A.im, (v, k) => v - B.im[k]), n });
const EPSF = 1e-6;
function mapMagnus(dt, s) {                                                   // 49×49 real matrix of the actual magnus2 step
  const fock = fockS(s), M = [];
  for (let q = 0; q < N2; q++) {
    const Pp = magnus2({ P: add(P0, HB[q], EPSF), t: 0, dt, fock }).P;
    const Pm = magnus2({ P: add(P0, HB[q], -EPSF), t: 0, dt, fock }).P;
    M.push(proj(sub(Pp, Pm)).map((v) => v / (2 * EPSF)));
  }
  return M;                                                                    // M[q][p] = ∂(component p)/∂(component q)
}
function mapMMUT(dt, s) {                                                      // two blocks: ∂P_{n+1}/∂P_n and ∂P_{n+1}/∂P_{n−1}
  const fock = fockS(s), Ma = [], Mb = [];
  for (let q = 0; q < N2; q++) {
    const ap = mmut({ Pprev: P0, Fnow: fock(add(P0, HB[q], EPSF)), dt });
    const am = mmut({ Pprev: P0, Fnow: fock(add(P0, HB[q], -EPSF)), dt });
    Ma.push(proj(sub(ap, am)).map((v) => v / (2 * EPSF)));
    const F0 = fock(P0);
    const bp = mmut({ Pprev: add(P0, HB[q], EPSF), Fnow: F0, dt });
    const bm = mmut({ Pprev: add(P0, HB[q], -EPSF), Fnow: F0, dt });
    Mb.push(proj(sub(bp, bm)).map((v) => v / (2 * EPSF)));
  }
  return { Ma, Mb };
}
const DTS = [0.02, 0.01, 0.005, 0.0025], SS = [0, 0.25, 0.5, 1];
const out = { n, nocc: 5, Enuc: mol.Enuc, E: scfres.energy, eps: [...scfres.orbitalEnergies], C: [...scfres.C], D0: [...scfres.D],
  S: [...mol.S], h: [...mol.h], eri: [...mol.eri], X: [...X], W: [...W], M: mol.M.map((m) => [...m]), nuclearDipole: mol.nuclearDipole,
  fdEps: EPSF, maps: [] };
for (const s of SS) for (const dt of DTS) {
  const t0 = Date.now();
  const m2 = mapMagnus(dt, s), mm = mapMMUT(dt, s);
  out.maps.push({ s, dt, magnus2: m2, mmutA: mm.Ma, mmutB: mm.Mb });
  console.log(`s=${s} dt=${dt}  maps built in ${Date.now() - t0} ms`);
}
writeFileSync(new URL('./lin-h2o.json', import.meta.url), JSON.stringify(out));
console.log('RHF E =', scfres.energy.toFixed(12), ' eps =', [...scfres.orbitalEnergies].map((x) => x.toFixed(6)).join(' '));
console.log('wrote lin-h2o.json');
