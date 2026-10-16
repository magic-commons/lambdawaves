/* h2curve.js — THE H₂ CURVE (0.7.1 U2): STO-3G H₂ along R on h2ci.js's 2-AO integrals — RHF and FCI from minimalH2, UHF from a broken-symmetry seed (the
 * picture that explains why UHF exists: UHF = RHF below the Coulson–Fischer point, then down onto the FCI limit 2E(H)), ⟨S²⟩ of that UHF, and THE ENTANGLEMENT
 * NUMBER S = −Σᵢ (nᵢ/2) ln(nᵢ/2) over the FCI 1-RDM's natural occupations n₁ = 2a², n₂ = 2b² (a, b on σg², σu²): 0 at the RHF limit, ln 2 at the break. */
import { sto3gIntegrals, minimalH2, eriTensor, sto3gHydrogen, eigSym } from './h2ci.js';
import { themeInk, accentRGB } from './mir/kit.js';
/** U2 local: swap for scf.js uhf at the merge — Fσ = h + J(Dα + Dβ) − K(Dσ) in the Löwdin frame, the α HOMO mixed with its LUMO by `mix` so a singlet can break symmetry */
export function uhf({ n, S, h, eri, Enuc = 0 }, { nAlpha, nBeta, mix = 0.1, maxIter = 2000, tol = 1e-10 } = {}) {
  const sq = (f) => { const M = new Float64Array(n * n); for (let q = 0; q < n * n; q++) M[q] = f(q / n | 0, q % n); return M; }, mul = (A, B) => sq((i, j) => { let s = 0; for (let k = 0; k < n; k++) s += A[i * n + k] * B[k * n + j]; return s; });
  const e = eigSym(S, n), X = sq((i, j) => { let s = 0; for (let k = 0; k < n; k++) s += e.vectors[i * n + k] * e.vectors[j * n + k] / Math.sqrt(e.values[k]); return s; });
  const orbs = (F) => mul(X, eigSym(mul(mul(X, F), X), n).vectors), dens = (C, m) => sq((i, j) => { let s = 0; for (let o = 0; o < m; o++) s += C[i * n + o] * C[j * n + o]; return s; });
  const fock = (Dt, Ds) => sq((i, j) => { let f = h[i * n + j]; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) f += Dt[k * n + l] * eri[((i * n + j) * n + k) * n + l] - Ds[k * n + l] * eri[((i * n + l) * n + k) * n + j]; return f; });
  let Ca = orbs(h), Cb = Ca.slice(), Da, Db, energy = NaN, iterations = 0, converged = false; const c = 1 / Math.hypot(1, mix);
  if (nAlpha < n) for (let i = 0; i < n; i++) { const p = Ca[i * n + nAlpha - 1], q = Ca[i * n + nAlpha]; Ca[i * n + nAlpha - 1] = c * (p + mix * q); Ca[i * n + nAlpha] = c * (q - mix * p); } Da = dens(Ca, nAlpha); Db = dens(Cb, nBeta);
  for (; iterations < maxIter && !converged; iterations++) {
    const Dt = Da.map((v, q) => v + Db[q]), Fa = fock(Dt, Da), Fb = fock(Dt, Db); let E = Enuc;
    for (let q = 0; q < n * n; q++) E += 0.5 * (Dt[q] * h[q] + Da[q] * Fa[q] + Db[q] * Fb[q]);
    Ca = orbs(Fa); Cb = orbs(Fb); const Na = dens(Ca, nAlpha), Nb = dens(Cb, nBeta);
    converged = Math.abs(E - energy) < tol && Na.every((v, q) => Math.abs(v - Da[q]) < tol && Math.abs(Nb[q] - Db[q]) < tol); Da = Na; Db = Nb; energy = E; }
  const O = mul(mul(sq((i, j) => Ca[j * n + i]), S), Cb), Ms = (nAlpha - nBeta) / 2; let s2 = Ms * (Ms + 1) + nBeta; for (let i = 0; i < nAlpha; i++) for (let j = 0; j < nBeta; j++) s2 -= O[i * n + j] ** 2;
  return { energy, Calpha: Ca, Cbeta: Cb, Dalpha: Da, Dbeta: Db, D: Da.map((v, q) => v + Db[q]), Ds: Da.map((v, q) => v - Db[q]), s2, iterations, converged }; }
/** one R (bohr): RHF, UHF, FCI (total, hartree), the entanglement number S and the UHF's ⟨S²⟩ */
export function h2Point(R) {
  const I = sto3gIntegrals(R), m = minimalH2(I), u = uhf({ n: 2, S: [1, I.S, I.S, 1], h: I.h, eri: eriTensor(I.eri), Enuc: I.Enuc }, { nAlpha: 1, nBeta: 1 });
  const S = [m.ciVector[0] ** 2, m.ciVector[3] ** 2].reduce((s, x) => s - (x > 0 ? x * Math.log(x) : 0), 0);   // nᵢ/2 = a², b²
  return { R, rhf: m.rhf, uhf: u.energy, fci: m.fci, S, s2: u.s2, uhfIterations: u.iterations }; }
/** the RHF → UHF (triplet) instability (ε_u − ε_g) − (J_gu + K_gu) = h_uu − h_gg − J_gg + J_gu − 2K_gu: positive while RHF is the UHF minimum, zero AT the Coulson–Fischer point */
export const instability = (R) => { const { hMO: hm, gMO: gm } = minimalH2(sto3gIntegrals(R)); return hm[3] - hm[0] - gm[0] + gm[3] - 2 * gm[5]; };
/** h2Curve(R[]) → { R, rhf, uhf, fci, S, s2, limit = 2E(H, STO-3G), cf = the Coulson–Fischer point, bisected on the instability to 1e-12 bohr } */
export function h2Curve(Rs) {
  const pts = Array.from(Rs, h2Point), col = (k) => Float64Array.from(pts, (p) => p[k]); let lo = 1.5, hi = 4;
  while (hi - lo > 1e-12) { const mid = (lo + hi) / 2; if (instability(mid) > 0) lo = mid; else hi = mid; }
  return { R: col('R'), rhf: col('rhf'), uhf: col('uhf'), fci: col('fci'), S: col('S'), s2: col('s2'), limit: 2 * sto3gHydrogen().E, cf: (lo + hi) / 2 }; }
/** the three curves relative to 2E(H) on a small 2-D canvas in the kit's ink (RHF dashed, FCI) and accent (UHF), the CF tick and a cursor at R */
export function drawCurve(cv, T, R) {
  const g = cv.getContext('2d'), W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1); if (W < 32 || H < 24) return;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.font = '8px ui-monospace, monospace';
  const ink = themeInk(g), acc = `rgb(${accentRGB(g).join(',')})`, n = T.R.length, lo = Math.min(...T.fci) - T.limit, hi = Math.max(...T.rhf) - T.limit;
  const x = (r) => 6 + (W - 34) * (r - T.R[0]) / (T.R[n - 1] - T.R[0]), y = (E) => 6 + (H - 18) * (hi - E + T.limit) / (hi - lo), path = (pts) => { g.beginPath(); pts.forEach(([a, b], i) => g[i ? 'lineTo' : 'moveTo'](a, b)); g.stroke(); };
  g.lineWidth = 1; g.setLineDash([1, 3]); g.strokeStyle = ink.ink(0.6); path([[x(T.R[0]), y(T.limit)], [x(T.R[n - 1]), y(T.limit)]]); path([[x(T.cf), 4], [x(T.cf), H - 12]]);
  for (const [k, col, dash, w] of [['rhf', ink.ink(0.9), [4, 3], 1.2], ['fci', ink.fg(0.9), [], 1.2], ['uhf', acc, [], 2]]) { g.setLineDash(dash); g.lineWidth = w; g.strokeStyle = g.fillStyle = col; path(Array.from(T.R, (r, i) => [x(r), y(T[k][i])])); if (k !== 'fci') g.fillText(k === 'rhf' ? 'RHF' : 'UHF·FCI', x(T.R[n - 1]) - 26, y(T[k][n - 1]) + (k === 'rhf' ? 10 : -4)); }
  g.setLineDash([]); g.fillStyle = ink.ink(0.9); g.fillText('2E(H)', W - 26, y(T.limit) + 3); g.fillText(`CF ${T.cf.toFixed(2)}`, x(T.cf) + 3, H - 3); g.fillText(`R ${T.R[0]}–${T.R[n - 1]} bohr`, 6, H - 3);
  g.strokeStyle = acc; g.lineWidth = 1.5; path([[x(R), 2], [x(R), H - 12]]); }
