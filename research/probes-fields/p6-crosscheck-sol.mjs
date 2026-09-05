/* P6 — Fable's cross-checks of Sol's Round 2 numbers by an independent route:
 *  (a) Q1: Φ_e on the +z axis for (1s + 2p_z)/√2 at r = 1, 3, 8 by the shell quadrature of P2 (L = 0, 1, 2), against
 *      Sol's closed form −0.568025637, −0.357019862, −0.145345133;
 *  (b) Q4: the fundamental density period of the 4d₊2 + 2p₋1 pair: 2π/ΔE = 67.0206 returns the density (3-fold symmetry
 *      makes a third of a turn invisible), and 201.06 is the third recurrence;
 *  (c) Q5: B_z at the origin for 2p₊1 (Sol: −0.521534 T) by the same extended-current integral as P5.
 */
import { BASIS, psiAt } from '../../lab/hydrogen.js';
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
/* (a): density on shells → Legendre components ρ_L(r') by θ-quadrature, then the two radial integrals */
{
  const a1 = idx(1, 0, 0), a2 = idx(2, 1, 0); const re = new Float64Array(91), im = new Float64Array(91); re[a1] = 1 / Math.SQRT2; re[a2] = 1 / Math.SQRT2;
  const NR = 6000, rmax = 60, h = rmax / NR, NT = 200;
  const P = (L, x) => (L === 0 ? 1 : L === 1 ? x : 0.5 * (3 * x * x - 1));
  const rhoL = []; for (let L = 0; L <= 2; L++) rhoL.push(new Float64Array(NR));
  for (let i = 0; i < NR; i++) { const rp = (i + 0.5) * h; for (let j = 0; j < NT; j++) { const th = (j + 0.5) * Math.PI / NT, ct = Math.cos(th); const p = psiAt(re, im, rp * Math.sin(th), 0, rp * ct, [a1, a2]); const d = p.re * p.re + p.im * p.im;
    for (let L = 0; L <= 2; L++) rhoL[L][i] += d * P(L, ct) * (2 * L + 1) / 2 * Math.sin(th) * (Math.PI / NT); } }   // ρ_L(r) = (2L+1)/2 ∫ρ P_L d(cosθ)
  const phi = (r) => { let out = 0; for (let L = 0; L <= 2; L++) { let inner = 0, outer = 0; for (let i = 0; i < NR; i++) { const rp = (i + 0.5) * h; if (rp < r) inner += rhoL[L][i] * rp ** (L + 2) * h; else outer += rhoL[L][i] * rp ** (1 - L) * h; } out += (4 * Math.PI / (2 * L + 1)) * (inner / r ** (L + 1) + outer * r ** L) * P(L, 1); } return -out; };
  for (const [r, sol] of [[1, -0.568025637], [3, -0.357019862], [8, -0.145345133]]) { const v = phi(r); console.log('Φ_e(' + r + ') on +z for (1s+2pz)/√2: shell quadrature', v.toFixed(8), ' Sol closed form', sol.toFixed(8), ' Δ =', (v - sol).toExponential(2)); }
}
/* (b) */
{
  const a = idx(4, 2, 2), b = idx(2, 1, -1), Ea = -0.5 / 16, Eb = -0.5 / 4, dE = Ea - Eb;
  const profile = (t) => { const re = new Float64Array(91), im = new Float64Array(91); re[a] = Math.cos(-Ea * t) / Math.SQRT2; im[a] = Math.sin(-Ea * t) / Math.SQRT2; re[b] = Math.cos(-Eb * t) / Math.SQRT2; im[b] = Math.sin(-Eb * t) / Math.SQRT2;
    const N = 720, out = new Float64Array(N); for (let i = 0; i < N; i++) { const phi = 2 * Math.PI * i / N, r = 3, th = Math.PI / 2.4; const p = psiAt(re, im, r * Math.sin(th) * Math.cos(phi), r * Math.sin(th) * Math.sin(phi), r * Math.cos(th), [a, b]); out[i] = p.re * p.re + p.im * p.im; } return out; };
  const p0 = profile(0); const rms = (t) => { const p = profile(t); let s = 0, n = 0; for (let i = 0; i < 720; i++) { s += (p[i] - p0[i]) ** 2; n += p0[i] * p0[i]; } return Math.sqrt(s / n); };
  const T1 = 2 * Math.PI / dE; console.log('pair 4d₊2 + 2p₋1: 2π/ΔE =', T1.toFixed(6), '→ relative RMS change of the ring density at T1:', rms(T1).toExponential(2), '; at 3·T1 =', (3 * T1).toFixed(4), ':', rms(3 * T1).toExponential(2), '; at T1/2 (a sixth of a turn — visible):', rms(T1 / 2).toExponential(2));
}
/* (c) */
{
  const a = idx(2, 1, 1); const re = new Float64Array(91), im = new Float64Array(91); re[a] = 1;
  const ALPHA = 1 / 137.035999, B_AU_T = 2.35051757e5;
  const rho2 = (x, y, z) => { const p = psiAt(re, im, x, y, z, [a]); return p.re * p.re + p.im * p.im; };
  let Bz = 0; const NR = 160, NZ = 320, NP = 48, rmax = 14, zmax = 14, dr = rmax / NR, dz = 2 * zmax / NZ, dp = 2 * Math.PI / NP;
  for (let i = 0; i < NR; i++) { const rr = (i + 0.5) * dr; for (let j = 0; j < NZ; j++) { const zz = -zmax + (j + 0.5) * dz; const jmag = rho2(rr, 0, zz) / rr;
    for (let k = 0; k < NP; k++) { const ph = (k + 0.5) * dp; const x = rr * Math.cos(ph), y = rr * Math.sin(ph); const jx = jmag * Math.sin(ph), jy = -jmag * Math.cos(ph); const Rx = -x, Ry = -y, Rz = -zz, R3 = Math.pow(Rx * Rx + Ry * Ry + Rz * Rz, 1.5); Bz += (jx * Ry - jy * Rx) / R3 * rr * dr * dz * dp; } } }
  console.log('B_z at the origin for 2p₊1 =', (Bz * ALPHA * ALPHA * B_AU_T).toFixed(4), 'T  (Sol −0.521534 T)');
}
