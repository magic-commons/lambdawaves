/* P5 — Fable's own checks for Round 3, independent of the second lab:
 *  (a) Q5: the Biot–Savart field of the 2p₊1 probability current at 1 a₀ on the axis, in tesla, from the EXTENDED
 *      current (not a point dipole): B = α² ∫ j × (x − x')/|x − x'|³ d³x'  (a.u.; 1 a.u. of B = 2.3505 × 10⁵ T),
 *      j = (m/ρ)|ψ|² φ̂ with the electron's charge −1 (so B is antiparallel to L for m > 0).
 *  (b) Q4: the rotation law of the three-lobed pattern — 4d₊2 + 2p₋1 at t = 0, 100.53, 201.06 a.u.
 *  (c) B.2: the Larmor power of the equal 1s + 2p₀ superposition, |d|² ω⁴ / 3c³, against the digest's ħωA/4.
 */
import { BASIS, psiAt } from '../../lab/hydrogen.js';
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const C = 137.035999, ALPHA = 1 / C, B_AU_T = 2.35051757e5;
/* (a) */
{
  const a = idx(2, 1, 1); const re = new Float64Array(91), im = new Float64Array(91); re[a] = 1;
  const rho2 = (x, y, z) => { const p = psiAt(re, im, x, y, z, [a]); return p.re * p.re + p.im * p.im; };
  const P = [0, 0, 1];                                                  // the field point: 1 a₀ up the axis
  let Bz = 0, mu = 0;
  const NR = 160, NZ = 320, NP = 48, rmax = 14, zmax = 14, dr = rmax / NR, dz = 2 * zmax / NZ, dp = 2 * Math.PI / NP;
  for (let i = 0; i < NR; i++) { const rr = (i + 0.5) * dr; for (let j = 0; j < NZ; j++) { const zz = -zmax + (j + 0.5) * dz; const dens = rho2(rr, 0, zz);   // axisymmetric density
    const jmag = dens / rr;                                              // |j| = (m/ρ)|ψ|², m = 1
    mu += -0.5 * rr * jmag * 2 * Math.PI * rr * dr * dz;                 // magnetic moment μ_z = ½ ∫ (x × j)_z d³x with charge −1 → −½ ∫ ρ' j_φ
    for (let k = 0; k < NP; k++) { const ph = (k + 0.5) * dp; const x = rr * Math.cos(ph), y = rr * Math.sin(ph);
      const jx = -jmag * Math.sin(ph) * (-1), jy = jmag * Math.cos(ph) * (-1);            // charge current = −j (electron)
      const Rx = P[0] - x, Ry = P[1] - y, Rz = P[2] - zz, R3 = Math.pow(Rx * Rx + Ry * Ry + Rz * Rz, 1.5);
      Bz += (jx * Ry - jy * Rx) / R3 * rr * dr * dz * dp; } } }
  Bz *= ALPHA * ALPHA;
  console.log('2p₊1: magnetic moment μ_z =', mu.toFixed(4), 'μ_B (exact −m/2 = −0.5 → one Bohr magneton, antiparallel to L for the electron)');
  console.log('B_z at (0,0,1) from the extended current =', Bz.toExponential(4), 'a.u. =', (Bz * B_AU_T).toFixed(3), 'T ;  point-dipole value 2|μ|/r³ · α² =', (2 * 0.5 * ALPHA * ALPHA).toExponential(4), 'a.u. =', (ALPHA * ALPHA * B_AU_T).toFixed(3), 'T (the digest\'s 6.26 T)');
  const Bfar = ((B) => B)(0); let Bz30 = 0;
  { const P2 = [0, 0, 30]; for (let i = 0; i < NR; i++) { const rr = (i + 0.5) * dr; for (let j = 0; j < NZ; j++) { const zz = -zmax + (j + 0.5) * dz; const dens = rho2(rr, 0, zz), jmag = dens / rr; for (let k = 0; k < NP; k++) { const ph = (k + 0.5) * dp; const x = rr * Math.cos(ph), y = rr * Math.sin(ph); const jx = jmag * Math.sin(ph), jy = -jmag * Math.cos(ph); const Rx = P2[0] - x, Ry = P2[1] - y, Rz = P2[2] - zz, R3 = Math.pow(Rx * Rx + Ry * Ry + Rz * Rz, 1.5); Bz30 += (jx * Ry - jy * Rx) / R3 * rr * dr * dz * dp; } } } Bz30 *= ALPHA * ALPHA; }
  console.log('B_z at (0,0,30) =', (Bz30 * B_AU_T * 1e3).toFixed(4), 'mT (dipole law 2μα²/r³ →', (ALPHA * ALPHA / 27000 * B_AU_T * 1e3).toFixed(4), 'mT)');
}
/* (b) */
{
  const a = idx(4, 2, 2), b = idx(2, 1, -1), Ea = -0.5 / 16, Eb = -0.5 / 4;
  const profile = (t) => { const re = new Float64Array(91), im = new Float64Array(91); re[a] = Math.cos(-Ea * t) / Math.SQRT2; im[a] = Math.sin(-Ea * t) / Math.SQRT2; re[b] = Math.cos(-Eb * t) / Math.SQRT2; im[b] = Math.sin(-Eb * t) / Math.SQRT2;
    const N = 360, out = new Float64Array(N); for (let i = 0; i < N; i++) { const phi = 2 * Math.PI * i / N, r = 4, th = Math.PI / 2.4; const p = psiAt(re, im, r * Math.sin(th) * Math.cos(phi), r * Math.sin(th) * Math.sin(phi), r * Math.cos(th), [a, b]); out[i] = p.re * p.re + p.im * p.im; } return out; };
  const argmax = (d) => { let k = 0; for (let i = 1; i < d.length; i++) if (d[i] > d[k]) k = i; return k; };
  const T = 2 * Math.PI / ((Ea - Eb) / 3);
  const p0 = profile(0), pH = profile(T / 2), pT = profile(T);
  let diffT = 0; for (let i = 0; i < 360; i++) diffT = Math.max(diffT, Math.abs(p0[i] - pT[i]));
  console.log('three-lobe rotation: ΔE =', (Ea - Eb).toFixed(5), '→ period T = 2π·3/ΔE =', T.toFixed(2), 'a.u.;  max |ρ(0) − ρ(T)| =', diffT.toExponential(2), '(returns to itself);  first maximum at t = 0:', argmax(p0) + '°', ', at T/2:', argmax(pH) + '°', '(a half turn of a 3-fold pattern is 60° mod 120°)');
}
/* (c) */
{
  const d = 128 * Math.SQRT2 / 243, w = 3 / 8, A = (4 / 3) * ALPHA ** 3 * w ** 3 * d * d;
  const Pcl = d * d * w ** 4 / (3 * C ** 3);                            // ⟨d(t)⟩ = d cos ωt for the equal superposition (2|c1 c2| = 1 → amplitude d)
  console.log('Larmor power of the equal 1s + 2p₀ superposition: |d|² ω⁴ / 3c³ =', Pcl.toExponential(4), 'a.u.;  ħωA/4 =', (w * A / 4).toExponential(4), 'a.u. → the classical field radiates |c1|²|c2|² ħωA, i.e. a quarter of the QED rate at equal weights');
}
