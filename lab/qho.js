/* qho.js — the three-dimensional isotropic quantum harmonic oscillator, exactly.  ħ = m = ω = 1.
 *
 * STATUS: EXACT ANALYTIC.  The eigenfunctions are
 *     ψ_{n_r l m}(x) = N_{n_r l} · r^l · e^{−r²/2} · L^{(l+½)}_{n_r}(r²) · Y_lm(x̂),     E = 2n_r + l + 3/2 = N + 3/2,
 * a polynomial in t = r² times a Gaussian envelope times the SAME spherical harmonics hydrogen uses — the record
 * shape the GPU kernel already evaluates, with a third envelope (e^{−t/2}) beside e^{−ρ/2} and (1+t)^{−(n+1)}.
 *
 * THE BASIS.  The register's 91 labels (n, l, m), n ≤ 6, are reused through n_r = n − l − 1: the same states, now
 * with energy N + 3/2, N = 2n_r + l = 2n − l − 2.  It is a truncation of the oscillator (n_r + l ≤ 5), complete in m
 * for every (n_r, l), which is what every SO(3)-covariant statement needs.
 *
 * MOMENTUM SPACE is the same picture: the oscillator's eigenfunctions are eigenfunctions of the Fourier transform,
 * φ_{n_r l m}(p) = (−i)^N ψ_{n_r l m}(p) — one phase per mode, no new table.
 *
 * THE BOUNDARY.  A slap on the ground state is EXACTLY a coherent state, e^{ikz}|0⟩ = |α = ik/√2⟩, and a coherent
 * state moves like a classical particle without dispersing: ⟨z⟩(t) = k sin t with the Gaussian width fixed at 1/√2.
 * Ehrenfest is exact for a quadratic Hamiltonian — the packet centre IS the classical trajectory.  Against the
 * hydrogen slap, which disperses and revives, this is the sharpest quantum/classical contrast the instrument holds.
 */
import { BASIS, ylmNorm, legendreDerivCoeffs, legendreP, factorial } from './hydrogen.js';

/** coefficients of the generalised Laguerre L^{(α)}_k(x) for ANY real α, by the three-term recurrence on arrays */
export function laguerreCoeffsReal(k, alpha) {
  let L0 = [1]; if (k === 0) return L0;
  let L1 = [1 + alpha, -1];
  for (let j = 1; j < k; j++) {
    const L2 = new Array(j + 2).fill(0);
    for (let i = 0; i < L1.length; i++) { L2[i] += (2 * j + 1 + alpha) * L1[i] / (j + 1); L2[i + 1] -= L1[i] / (j + 1); }
    for (let i = 0; i < L0.length; i++) L2[i] -= (j + alpha) * L0[i] / (j + 1);
    L0 = L1; L1 = L2;
  }
  return L1;
}
/** Γ(m + ½) = (2m)!√π / (4^m m!) for integer m ≥ 0 */
export function gammaHalf(m) { return factorial(2 * m) * Math.sqrt(Math.PI) / (Math.pow(4, m) * factorial(m)); }
/** N_{n_r l} = √(2 n_r! / Γ(n_r + l + 3/2)) */
export function qhoNorm(nr, l) { return Math.sqrt(2 * factorial(nr) / gammaHalf(nr + l + 1)); }
export const qhoN = (n, l) => 2 * (n - l - 1) + l;                 // the oscillator's principal number for the register label (n, l)
export const qhoEnergyOf = (n, l) => qhoN(n, l) + 1.5;
export function qhoEnergy(a) { const s = BASIS[a]; return qhoEnergyOf(s.n, s.l); }
/** R_{n_r l}(r), normalised as ∫ R² r² dr = 1 */
export function qhoRadial(n, l, r) {
  const nr = n - l - 1, t = r * r, c = laguerreCoeffsReal(nr, l + 0.5);
  let s = 0, tp = 1; for (let j = 0; j < c.length; j++) { s += c[j] * tp; tp *= t; }
  return qhoNorm(nr, l) * Math.pow(r, l) * Math.exp(-t / 2) * s;
}
/** the kernel record: lag = L^{(l+½)}_{n_r} in t = r²; envelope e^{−t/2}; power r^l; phase (−i)^N for momentum space */
export function qhoTable(n, l, m) {
  const am = Math.abs(m), nr = n - l - 1, N = qhoN(n, l);
  const leg = legendreDerivCoeffs(l, am);
  const sign = (m >= 0 && (am % 2 === 1)) ? -1 : 1;
  const norm = sign * qhoNorm(nr, l) * ylmNorm(l, am);
  const pad = (a) => { const out = new Float64Array(6); for (let i = 0; i < a.length && i < 6; i++) out[i] = a[i]; return out; };
  const ph = [[1, 0], [0, -1], [-1, 0], [0, 1]][N % 4];
  return { n, l, m, am, nr, N, norm, lag: pad(laguerreCoeffsReal(nr, l + 0.5)), leg: pad(leg), space: 'qho', momentumPhase: { re: ph[0], im: ph[1] } };
}
/** ψ_{nlm}(x) from its table — the CPU twin of the kernel's oscillator branch */
export function qhoFromTable(T, x, y, z) {
  const r = Math.hypot(x, y, z);
  const ct = r < 1e-300 ? 1 : z / r, st = Math.sqrt(Math.max(0, 1 - ct * ct)), phi = Math.atan2(y, x), t = r * r;
  let L = 0, tp = 1; for (let j = 0; j < 6; j++) { L += T.lag[j] * tp; tp *= t; }
  let D = 0, xp = 1; for (let j = 0; j < 6; j++) { D += T.leg[j] * xp; xp *= ct; }
  let stm = 1; for (let i = 0; i < T.am; i++) stm *= st;
  const f = T.norm * Math.pow(r, T.l) * Math.exp(-t / 2) * L * stm * D;
  return { re: f * Math.cos(T.m * phi), im: f * Math.sin(T.m * phi) };
}
const cache = new Map();
export function qhoTableFor(s) { let T = cache.get(s.id); if (!T) { T = qhoTable(s.n, s.l, s.m); cache.set(s.id, T); } return T; }
/** the momentum-space table: the same record with the (−i)^N phase set as `phase`, which packModes folds in */
const pcache = new Map();
export function qhoMomentumTableFor(s) { let T = pcache.get(s.id); if (!T) { const B = qhoTableFor(s); T = { ...B, phase: B.momentumPhase }; pcache.set(s.id, T); } return T; }
/** ψ(x) = Σ c_a ψ_a(x) over the given indices */
export function qhoPsiAt(re, im, x, y, z, indices) {
  let R = 0, I = 0;
  for (const a of indices) {
    const c = re[a], d = im[a]; if (c === 0 && d === 0) continue;
    const v = qhoFromTable(qhoTableFor(BASIS[a]), x, y, z);
    R += c * v.re - d * v.im; I += c * v.im + d * v.re;
  }
  return { re: R, im: I };
}
/** the box: the classical turning radius of the highest level, √(2E), plus three widths */
export function qhoDomainFor(nmax) { let N = 0; for (const s of BASIS) if (s.n <= nmax) N = Math.max(N, qhoN(s.n, s.l)); return Math.sqrt(2 * (N + 1.5)) + 3; }
/**
 * the coherent state of momentum k along z, e^{ikz}|0⟩: its coefficients on the register, by projecting the closed
 * form ψ(x) = π^{−3/4} e^{−r²/2} e^{ikz} onto the basis on a grid (the truncation beyond n_r + l ≤ 5 is the
 * Poisson tail of |α|² = k²/2 — negligible for k ≲ 1).  Returns { re, im, captured } with captured = Σ|c|².
 */
export function coherentAlongZ(k, { half = 7, G = 64 } = {}) {
  const re = new Float64Array(91), im = new Float64Array(91), h = 2 * half / G, w = h * h * h, A = Math.pow(Math.PI, -0.75);
  const tabs = BASIS.map((s) => qhoTableFor(s));
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) for (let l = 0; l < G; l++) {
    const x = -half + (i + 0.5) * h, y = -half + (j + 0.5) * h, z = -half + (l + 0.5) * h;
    const g = A * Math.exp(-(x * x + y * y + z * z) / 2), pr = g * Math.cos(k * z), pi = g * Math.sin(k * z);
    for (let a = 0; a < 91; a++) {
      if (BASIS[a].m !== 0) continue;                               // e^{ikz} keeps m = 0
      const v = qhoFromTable(tabs[a], x, y, z);                     // real for m = 0
      re[a] += w * v.re * pr; im[a] += w * v.re * pi;
    }
  }
  let captured = 0; for (let a = 0; a < 91; a++) captured += re[a] * re[a] + im[a] * im[a];
  return { re, im, captured };
}
