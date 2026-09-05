/* SOL Q1/Q4/Q5 — independent gates for the Coulomb multipoles, rotating
 * azimuthal harmonics, and the Biot–Savart field of hydrogen 2p_{+1}.
 * Run from the repository root: node research/probes-fields/sol-q1-q4-q5.mjs
 */
import { BASIS, energy, orbital, psiAt } from '../../lab/hydrogen.js';

const PI = Math.PI;
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const fact = (n) => { let f = 1; for (let k = 2; k <= n; k++) f *= k; return f; };
// Integer-order incomplete gamma functions.  Every hydrogen-register radial
// product has the integer orders used here.
const lowerGamma = (n, x) => fact(n - 1) * (1 - Math.exp(-x) * Array.from({ length: n }, (_, k) => x ** k / fact(k)).reduce((a, b) => a + b, 0));
const upperGamma = (n, x) => fact(n - 1) * Math.exp(-x) * Array.from({ length: n }, (_, k) => x ** k / fact(k)).reduce((a, b) => a + b, 0);

// The normalized t=0 register preset (1s + 2p_z)/sqrt(2), expanded as
// rho(r,theta)=sum_L A_L(r) P_L(cos theta).  Each record is C r^q exp(-beta r).
const rhoTerms = [
  [[0.5 / PI, 0, 2], [1 / (192 * PI), 2, 1]],
  [[1 / (4 * PI * Math.SQRT2), 1, 1.5]],
  [[1 / (96 * PI), 2, 1]],
];
function positivePotentialClosed(r) {
  let phi = 0;
  for (let L = 0; L <= 2; L++) for (const [C, q, beta] of rhoTerms[L]) {
    const inner = C * lowerGamma(q + L + 3, beta * r) / beta ** (q + L + 3);
    const outer = C * upperGamma(q + 2 - L, beta * r) / beta ** (q + 2 - L);
    phi += 4 * PI / (2 * L + 1) * (inner / r ** (L + 1) + outer * r ** L);
  }
  return phi;
}
function electronPotentialMidpoint(r, N = 48000, rmax = 60) {
  const h = rmax / N;
  let phi = 0;
  for (let L = 0; L <= 2; L++) {
    let inner = 0, outer = 0;
    for (let i = 0; i < N; i++) {
      const rp = (i + 0.5) * h;
      let A = 0;
      for (const [C, q, beta] of rhoTerms[L]) A += C * rp ** q * Math.exp(-beta * rp);
      if (rp < r) inner += A * rp ** (L + 2) * h;
      else outer += A * rp ** (1 - L) * h;
    }
    phi += 4 * PI / (2 * L + 1) * (inner / r ** (L + 1) + outer * r ** L);
  }
  return -phi;
}

console.log('Q1  normalized (1s+2p_z)/sqrt(2), t=0, positive z axis');
for (const r of [1, 3, 8]) {
  const closed = -positivePotentialClosed(r), midpoint = electronPotentialMidpoint(r);
  console.log(`r=${r}: closed=${closed.toFixed(9)}  P2-midpoint=${midpoint.toFixed(9)}  |delta|=${Math.abs(closed - midpoint).toExponential(3)}`);
}

// Q4.  For a mode d_i exp(i m_i phi), C_k=sum_{m_i-m_j=k}d_i d_j* is
// the exact complex Fourier coefficient of rho.  No angular FFT is required.
const states = [
  { a: idx(2, 1, -1), n: 2, l: 1, m: -1 },
  { a: idx(2, 1, +1), n: 2, l: 1, m: +1 },
  { a: idx(4, 1, -1), n: 4, l: 1, m: -1 },
  { a: idx(4, 2, +2), n: 4, l: 2, m: +2 },
];
function harmonicAmplitudes(t, r, theta) {
  const d = states.map((s) => {
    const a = orbital(s.n, s.l, s.m, r * Math.sin(theta), 0, r * Math.cos(theta)).re * 0.5;
    return { ...s, re: a * Math.cos(energy(s.n) * t), im: -a * Math.sin(energy(s.n) * t) };
  });
  const C = Array.from({ length: 4 }, () => [0, 0]);
  for (const x of d) for (const y of d) {
    const k = x.m - y.m;
    if (k < 0 || k > 3) continue;
    C[k][0] += x.re * y.re + x.im * y.im;
    C[k][1] += x.im * y.re - x.re * y.im;
  }
  return C.map(([re, im], k) => (k ? 2 : 1) * Math.hypot(re, im));
}
function densityRing(t, r, theta, N = 720) {
  const re = new Float64Array(BASIS.length), im = new Float64Array(BASIS.length);
  for (const s of states) { re[s.a] = 0.5 * Math.cos(energy(s.n) * t); im[s.a] = -0.5 * Math.sin(energy(s.n) * t); }
  return Array.from({ length: N }, (_, i) => {
    const phi = 2 * PI * i / N;
    const p = psiAt(re, im, r * Math.sin(theta) * Math.cos(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(theta), states.map((s) => s.a));
    return p.re * p.re + p.im * p.im;
  });
}
function relativeRms(a, b) {
  let d2 = 0, a2 = 0;
  for (let i = 0; i < a.length; i++) { d2 += (a[i] - b[i]) ** 2; a2 += a[i] ** 2; }
  return Math.sqrt(d2 / a2);
}
const deltaE = energy(4) - energy(2);                    // +3/32
const Tdensity = 2 * PI / deltaE;
const TfullOrientation = 3 * Tdensity;
console.log('\nQ4  equal populations |c|^2=1/4, theta=pi/2.4');
console.log(`DeltaE=${deltaE.toFixed(9)}, Omega_3=DeltaE/3=${(deltaE / 3).toFixed(9)}, density recurrence=${Tdensity.toFixed(9)}, full orientation turn=${TfullOrientation.toFixed(9)}`);
for (const r of [3, 6]) {
  const d0 = densityRing(0, r, PI / 2.4);
  const d1 = densityRing(Tdensity, r, PI / 2.4);
  const d3 = densityRing(TfullOrientation, r, PI / 2.4);
  let maxRatio = 0, tAtMax = 0;
  for (let i = 0; i <= 20000; i++) {
    const t = Tdensity * i / 20000, h = harmonicAmplitudes(t, r, PI / 2.4), ratio = h[3] / h[2];
    if (ratio > maxRatio) { maxRatio = ratio; tAtMax = t; }
  }
  const h0 = harmonicAmplitudes(0, r, PI / 2.4);
  console.log(`r=${r}: t=0 h2/rho0=${(h0[2] / h0[0]).toFixed(9)}, h3/rho0=${(h0[3] / h0[0]).toFixed(9)}; max_t h3/h2=${maxRatio.toFixed(9)} at t=${tAtMax.toFixed(9)}; relRMS(T)=${relativeRms(d0, d1).toExponential(3)}, relRMS(3T)=${relativeRms(d0, d3).toExponential(3)}`);
}

// Q5.  For psi_211=-rho*exp(-r/2)*exp(i phi)/(8 sqrt(pi)),
// j_prob=rho*exp(-r)/(64 pi) phi-hat.  On the positive axis z,
// b_z=-[gamma(5,z)/z^3+Gamma(2,z)]/24.  The minus sign is electron charge.
const MU0 = 1.25663706212e-6;
const E_CHARGE = 1.602176634e-19;
const HBAR = 1.054571817e-34;
const M_E = 9.1093837139e-31;
const A0 = 5.29177210544e-11;
const bConversionTesla = MU0 * E_CHARGE * HBAR / (4 * PI * M_E * A0 ** 3);
function bzDimensionless(z) { return -(lowerGamma(5, z) / z ** 3 + upperGamma(2, z)) / 24; }
const bz = bzDimensionless(1) * bConversionTesla;
console.log('\nQ5  2p_{+1} distributed charge current, observation point (0,0,1 a0)');
console.log(`dimensionless Biot-Savart integral=${bzDimensionless(1).toFixed(12)}, conversion=${bConversionTesla.toFixed(9)} T, Bz=${bz.toFixed(9)} T=${(bz * 1e4).toFixed(3)} G`);
console.log(`point-dipole axis asymptote at 1 a0 would be ${(-bConversionTesla).toFixed(6)} T; it is not valid inside the 2p cloud`);
