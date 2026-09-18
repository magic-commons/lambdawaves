/* hydrogen.js — the bound states of hydrogen in closed form, n ≤ 6, atomic units.
 *
 * STATUS: EXACT ANALYTIC.  Everything here is a closed-form expression of the
 * non-relativistic Coulomb problem (infinite nuclear mass, ħ = m_e = e = a₀ = 1).
 *
 * CONVENTIONS (frozen; the tests hold them):
 *   R_nl(r)  = sqrt((2/n)^3 (n-l-1)! / (2n (n+l)!)) · e^{-ρ/2} · ρ^l · L^{2l+1}_{n-l-1}(ρ),  ρ = 2r/n,
 *              with the generalized Laguerre  L^α_k(x) = Σ_j (-1)^j C(k+α, k-j) x^j / j!.
 *   Y_l^m    = sqrt((2l+1)/(4π) · (l-m)!/(l+m)!) · P_l^m(cos θ) · e^{imφ}       (m ≥ 0),
 *              P_l^m(x) = (-1)^m (1-x²)^{m/2} d^m P_l / dx^m   — Condon–Shortley phase INCLUDED,
 *   Y_l^{-m} = (-1)^m · conj(Y_l^m).
 *   This is the complex "physics" convention (Jackson, Sakurai, Mathematica's SphericalHarmonicY).
 *   Complex Y_lm are used because the PHASE view needs arg ψ; real orbitals (p_x, p_y, d_xy …)
 *   are combinations of these and are prepared as coefficient presets, never as a second basis.
 *   E_n = −1/(2n²) hartree.  1 hartree = 27.211386 eV; 1 a.u. of time = 24.188843 as.
 *
 * Two independent evaluators live here on purpose:
 *   radial()/ylm()      — three-term recurrences (the CPU oracle);
 *   modeTable()         — explicit polynomial coefficient tables (what the GPU evaluates).
 * tests/hydrogen.test.mjs compares them against each other AND against hand-typed anchors.
 */

export const NMAX = 6;
export const HARTREE_EV = 27.211386245988;
export const AU_TIME_AS = 24.188843265857;

export function energy(n) { return -0.5 / (n * n); }

const FACT = [1];
for (let i = 1; i <= 24; i++) FACT[i] = FACT[i - 1] * i;
export function factorial(k) { return FACT[k]; }
function binom(a, b) { if (b < 0 || b > a) return 0; return FACT[a] / (FACT[b] * FACT[a - b]); }

/* ── the register: 91 states, stable ids "h:n:l:m", ordered by (n, l, m) ─────── */
export const BASIS = [];
for (let n = 1; n <= NMAX; n++)
  for (let l = 0; l < n; l++)
    for (let m = -l; m <= l; m++)
      BASIS.push(Object.freeze({
        id: `h:${n}:${l}:${m}`, index: BASIS.length, n, l, m, E: energy(n),
        label: `${n}${'spdfgh'[l]}${subscript(m)}`
      }));
Object.freeze(BASIS);
export const BASIS_INDEX = new Map(BASIS.map((s) => [s.id, s.index]));
export function stateOf(n, l, m) { return BASIS[BASIS_INDEX.get(`h:${n}:${l}:${m}`)]; }
export function idOf(n, l, m) { return `h:${n}:${l}:${m}`; }

function subscript(m) {
  const map = { '-': '₋', 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅' };
  return String(m).split('').map((ch) => map[ch] || ch).join('');
}

/* ── radial part: recurrence evaluator (oracle) ──────────────────────────────── */
export function radialNorm(n, l) {
  return Math.sqrt(Math.pow(2 / n, 3) * FACT[n - l - 1] / (2 * n * FACT[n + l]));
}
/** generalized Laguerre L^α_k(x) by the three-term recurrence */
export function laguerre(k, alpha, x) {
  if (k === 0) return 1;
  let l0 = 1, l1 = 1 + alpha - x;
  for (let i = 1; i < k; i++) {
    const l2 = ((2 * i + 1 + alpha - x) * l1 - (i + alpha) * l0) / (i + 1);
    l0 = l1; l1 = l2;
  }
  return l1;
}
export function radial(n, l, r) {
  const rho = 2 * r / n;
  return radialNorm(n, l) * Math.exp(-rho / 2) * Math.pow(rho, l) * laguerre(n - l - 1, 2 * l + 1, rho);
}

/* ── angular part: recurrence evaluator (oracle) ─────────────────────────────── */
/** associated Legendre P_l^m(x), m ≥ 0, Condon–Shortley phase included */
export function legendreP(l, m, x) {
  let pmm = 1;
  if (m > 0) {
    const somx2 = Math.sqrt(Math.max(0, (1 - x) * (1 + x)));
    let fact = 1;
    for (let i = 1; i <= m; i++) { pmm *= -fact * somx2; fact += 2; }
  }
  if (l === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll++) {
    pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1; pmmp1 = pll;
  }
  return pll;
}
export function ylmNorm(l, m) {
  const am = Math.abs(m);
  return Math.sqrt((2 * l + 1) / (4 * Math.PI) * FACT[l - am] / FACT[l + am]);
}
/** complex Y_l^m(θ, φ) → { re, im } */
export function ylm(l, m, theta, phi) {
  const am = Math.abs(m);
  const mag = ylmNorm(l, am) * legendreP(l, am, Math.cos(theta));
  if (m >= 0) return { re: mag * Math.cos(m * phi), im: mag * Math.sin(m * phi) };
  // Y_l^{-m} = (-1)^m conj(Y_l^m)
  const s = (am % 2 === 0) ? 1 : -1;
  return { re: s * mag * Math.cos(am * phi), im: -s * mag * Math.sin(am * phi) };
}

/** ψ_{nlm}(x, y, z) → { re, im } at a Cartesian point (a.u.) */
export function orbital(n, l, m, x, y, z) {
  const r = Math.hypot(x, y, z);
  const theta = r < 1e-300 ? 0 : Math.acos(Math.max(-1, Math.min(1, z / r)));
  const phi = Math.atan2(y, x);
  const R = radial(n, l, r);
  const Y = ylm(l, m, theta, phi);
  return { re: R * Y.re, im: R * Y.im };
}

/* ── explicit polynomial tables: what the GPU evaluates ──────────────────────── */
/** coefficients a_j of L^α_k(x) = Σ a_j x^j */
export function laguerreCoeffs(k, alpha) {
  const a = new Array(k + 1);
  for (let j = 0; j <= k; j++) a[j] = ((j % 2) ? -1 : 1) * binom(k + alpha, k - j) / FACT[j];
  return a;
}
/** coefficients of the Legendre polynomial P_l(x) */
export function legendreCoeffs(l) {
  const c = new Array(l + 1).fill(0);
  for (let k = 0; k <= Math.floor(l / 2); k++)
    c[l - 2 * k] = ((k % 2) ? -1 : 1) * FACT[2 * l - 2 * k] / (Math.pow(2, l) * FACT[k] * FACT[l - k] * FACT[l - 2 * k]);
  return c;
}
/** coefficients of d^m P_l / dx^m */
export function legendreDerivCoeffs(l, m) {
  let c = legendreCoeffs(l);
  for (let d = 0; d < m; d++) {
    const nc = new Array(Math.max(0, c.length - 1)).fill(0);
    for (let j = 1; j < c.length; j++) nc[j - 1] = j * c[j];
    c = nc;
  }
  return c;
}
/**
 * The compact evaluation record for one basis state:
 *   ψ = norm · e^{-ρ/2} · ρ^l · Σ lag_j ρ^j · sin^{|m|}θ · Σ leg_j cos^jθ · e^{imφ},   ρ = 2r/n.
 * `norm` folds the radial norm, the angular norm and the sign convention:
 *   sign = (-1)^m for m ≥ 0 (Condon–Shortley); +1 for m < 0 (the two (-1)^|m| cancel).
 */
export function modeTable(n, l, m) {
  const am = Math.abs(m);
  const lag = laguerreCoeffs(n - l - 1, 2 * l + 1);
  const leg = legendreDerivCoeffs(l, am);
  const sign = (m >= 0 && (am % 2 === 1)) ? -1 : 1;
  const norm = sign * radialNorm(n, l) * ylmNorm(l, am);
  const pad = (a) => { const out = new Float64Array(6); for (let i = 0; i < a.length && i < 6; i++) out[i] = a[i]; return out; };
  return { n, l, m, am, norm, lag: pad(lag), leg: pad(leg) };
}
/** evaluate ψ_{nlm} from its table — the CPU twin of the WGSL kernel */
export function orbitalFromTable(T, x, y, z) {
  const r = Math.hypot(x, y, z);
  const ct = r < 1e-300 ? 1 : z / r;
  const st = Math.sqrt(Math.max(0, 1 - ct * ct));
  const phi = Math.atan2(y, x);
  const rho = 2 * r / T.n;
  let L = 0, rp = 1;
  for (let j = 0; j < 6; j++) { L += T.lag[j] * rp; rp *= rho; }
  let D = 0, xp = 1;
  for (let j = 0; j < 6; j++) { D += T.leg[j] * xp; xp *= ct; }
  let stm = 1; for (let i = 0; i < T.am; i++) stm *= st;
  let rl = 1; for (let i = 0; i < T.l; i++) rl *= rho;
  const f = T.norm * Math.exp(-rho / 2) * rl * L * stm * D;
  return { re: f * Math.cos(T.m * phi), im: f * Math.sin(T.m * phi) };
}

/** ψ(x,y,z) = Σ_a c_a φ_a — `re`/`im` are Float64Array(91) coefficient arrays. */
export function psiAt(re, im, x, y, z, indices) {
  let pr = 0, pi = 0;
  const idx = indices || BASIS.map((s) => s.index);
  for (const a of idx) {
    const cr = re[a], ci = im[a];
    if (cr === 0 && ci === 0) continue;
    const s = BASIS[a];
    const o = orbital(s.n, s.l, s.m, x, y, z);
    pr += cr * o.re - ci * o.im;
    pi += cr * o.im + ci * o.re;
  }
  return { re: pr, im: pi };
}

/** the classical outer turning point 2n² plus margin: the field domain half-width for a set of n's */
export function domainFor(nmax) { return 2 * nmax * nmax + 3 * nmax + 2; }
