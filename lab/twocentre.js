/* twocentre.js — the two-centre integrals of Slater/Sturmian functions, exactly, in prolate-spheroidal coordinates.
 * Atomic units.  The machinery W-MO reuses; here it serves H₂⁺ on any one-centre basis placed on both nuclei.
 *
 * Nuclei A at −(R/2)ẑ and B at +(R/2)ẑ, a = R/2.  A basis function is  χ = Σ_j c_j r_c^{l+j} e^{−ζ r_c} Y_lm(θ_c, φ)  about
 * its own centre c (an STO r^{n−1}e^{−ζr}Y_lm, the register's hydrogenic R_nl Y_lm with ζ = Z/n, or the Sturmian of
 * sturmian.js with one common ζ = λ — the coefficient vector c makes them all the same object).  The complex Y_lm and its
 * Condon–Shortley phase are hydrogen.js's.  In prolate coordinates ξ = (r_A + r_B)/R ∈ [1, ∞), η = (r_A − r_B)/R ∈ [−1, 1]:
 *     r_A = a(ξ + η),  r_B = a(ξ − η),  z − z_A = a(ξη + 1),  z − z_B = a(ξη − 1),  ρ² = a²(ξ² − 1)(1 − η²),
 *     dV = a³(ξ² − η²) dξ dη dφ,   dV/r_A = a²(ξ − η) dξ dη dφ,   dV/r_B = a²(ξ + η) dξ dη dφ.
 * The angular-radial part of every function is a POLYNOMIAL in (ξ, η): r^l Y_lm = N_lm ρ^{|m|} · [r^{l−|m|} d^{|m|}P_l(z/r)]
 * · e^{imφ} and the bracket has the parity of l − |m|, so it is a polynomial in z and r² (the point Round 1's E.3
 * missed: 1/r_A and P_l(cos θ_A) are not polynomial, but r^l P_l and dV/r_A are).  The φ integral is 2π δ_{m m'}.
 * The exponent is  ζ_i r_i + ζ_j r_j = α ξ + β η  with α = a(ζ_i + ζ_j), β = a(s_i ζ_i + s_j ζ_j), s = +1 on A, −1 on B:
 * substituting x = α(ξ − 1) makes the ξ-exponential EXACTLY the Gauss–Laguerre weight, and Gauss–Legendre carries the
 * η polynomial times e^{−βη}.  The kinetic energy is the analytic Laplacian of the ket,
 *     ∇²(r^k e^{−ζr} Y_lm) = [ (k(k+1) − l(l+1)) r^{k−2} − 2(k+1)ζ r^{k−1} + ζ² r^k ] e^{−ζr} Y_lm,   k = l + j,
 * whose only singular piece is a single 1/r_c (from j = 0, 1), integrated with the polynomial measure dV/r_c; the
 * bra–ket average makes T exactly symmetric.  Nuclear attraction −Z_c/r_c uses the same measure: every integrand is
 * polynomial × e^{−αξ−βη}, and the quadrature is exact or exponentially convergent.
 *
 * THE QUADRATURE (Sol Q3 / Opus Q3 of the FIELDS AND MOLECULES round).  nq Gauss–Laguerre points in ξ are exact for
 * ξ-degree ≤ 2nq − 1 (n ≤ 6 functions reach degree 12, so nq = 9 is exact).  In η the pairs across the two centres with
 * equal ζ have β = 0 and nq Gauss–Legendre points are exact too; pairs with β ≠ 0 (both functions on ONE centre, or
 * unequal ζ) carry e^{−βη}, and nq + ⌈2|β|⌉ points hold them to ~1e-14 (adaptEta, default on; adaptEta = false is Sol's
 * fixed 9 × 9, 2e-10 over {1s, 2p_z, 3d_z²} and R = 1…4).  Parity: for a basis mirrored on both centres the gerade /
 * ungerade combinations (χ_A ± (−1)^l χ_B)/√2 split S and H into two blocks (inversion parity, valid for every m).
 *
 * STATUS: EXACT integrals (quadrature errors judged in tests/twocentre.test.mjs: the 1s closed forms of molecule.js to
 * 1e-12, the one-centre Sturmian closed forms of sturmian.js to 1e-13; finite at EVERY R — the weights are one exponential
 * e^{−α−βη} with |β| ≤ α, wave 42), VARIATIONAL energies (upper bounds; the exact
 * H₂⁺ σ_g at R = 2 is −0.602634214, Bates–Ledsham–Stewart 1953, KNOWN), NUMERICAL eigen-solver (sturmian.js).
 * KNOWN benchmarks re-judged: Eg(2) = −0.553771495318 (1s LCAO); fixed {1s, 2p_z} E(2) = −0.553815296857 (Sol);
 * 20 Sturmians n ≤ 4 at λ = 1.7611: −0.602624 (Opus); the 42 σ register functions: R_e = 2.35227, D_e = 2.125 eV (Opus).
 */
import { factorial, laguerreCoeffs, legendreDerivCoeffs, ylmNorm, radialNorm } from './hydrogen.js';
import { generalisedEigen, sturmianNorm } from './sturmian.js';

/* ── Gauss rules (Newton on the orthogonal polynomial; Numerical Recipes gauleg / gaulag) ── */
const RULES = new Map();
/** n-point Gauss–Legendre on [−1, 1]: { x, w } */
export function gaussLegendre(n) {
  const key = 'L' + n; if (RULES.has(key)) return RULES.get(key);
  const x = new Float64Array(n), w = new Float64Array(n), m = (n + 1) >> 1;
  for (let i = 0; i < m; i++) {
    let z = Math.cos(Math.PI * (i + 0.75) / (n + 0.5)), pp = 0;
    for (let it = 0; it < 100; it++) {
      let p1 = 1, p2 = 0;
      for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; }
      pp = n * (z * p1 - p2) / (z * z - 1);
      const z1 = z; z = z1 - p1 / pp;
      if (Math.abs(z - z1) < 1e-15) { if (it > 2) break; }
    }
    x[i] = -z; x[n - 1 - i] = z; w[i] = w[n - 1 - i] = 2 / ((1 - z * z) * pp * pp);
  }
  const out = { x, w }; RULES.set(key, out); return out;
}
/** n-point Gauss–Laguerre on [0, ∞) with weight e^{−x}: { x, w } */
export function gaussLaguerre(n) {
  const key = 'G' + n; if (RULES.has(key)) return RULES.get(key);
  const x = new Float64Array(n), w = new Float64Array(n);
  let z = 0;
  for (let i = 0; i < n; i++) {
    if (i === 0) z = 3 / (1 + 2.4 * n);
    else if (i === 1) z += 15 / (1 + 2.5 * n);
    else { const ai = i - 1; z += ((1 + 2.6 * ai) / (1.9 * ai)) * (z - x[i - 2]); }
    let pp = 0, p2 = 0;
    for (let it = 0; it < 100; it++) {
      let p1 = 1; p2 = 0;
      for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1 - z) * p2 - (j - 1) * p3) / j; }
      pp = n * (p1 - p2) / z;
      const z1 = z; z = z1 - p1 / pp;
      if (Math.abs(z - z1) <= 1e-15 * z) { if (it > 2) break; }
    }
    x[i] = z; w[i] = -1 / (pp * n * p2);
  }
  const out = { x, w }; RULES.set(key, out); return out;
}

/* ── basis-function descriptors: χ = Σ_j c_j r^{l+j} e^{−ζr} Y_lm ─────────────── */
/** ⟨χ|χ⟩ in closed form: Σ_jk c_j c_k (2l+j+k+2)! / (2ζ)^{2l+j+k+3} */
export function selfOverlap(fn) {
  const { l, zeta, c } = fn; let s = 0;
  for (let j = 0; j < c.length; j++) for (let k = 0; k < c.length; k++) { const P = 2 * l + j + k + 2; s += c[j] * c[k] * factorial(P) / Math.pow(2 * zeta, P + 1); }
  return s;
}
/** rescale c so ⟨χ|χ⟩ = 1 */
export function normalise(fn) { const f = 1 / Math.sqrt(selfOverlap(fn)); fn.c = Float64Array.from(fn.c, (v) => v * f); return fn; }
/** the Slater-type orbital r^{n−1} e^{−ζr} Y_lm, normalised (n ≥ l + 1) */
export function sto(n, l, m, zeta) {
  if (n < l + 1) throw new Error('sto: n must be ≥ l + 1');
  const c = new Float64Array(n - l); c[n - l - 1] = 1;
  return normalise({ l, m, zeta, c, tag: `STO${n}${'spdfgh'[l]}${m}ζ${zeta}` });
}
/** the register's hydrogenic R_nl Y_lm for charge Z (ζ = Z/n): R = Z^{3/2} radialNorm · (2Zr/n)^l e^{−Zr/n} L^{2l+1}_{n−l−1}(2Zr/n) */
export function hydrogenicFn(n, l, m, Z = 1) {
  const lag = laguerreCoeffs(n - l - 1, 2 * l + 1), s = 2 * Z / n, N = Math.pow(Z, 1.5) * radialNorm(n, l);
  const c = Float64Array.from(lag, (a, j) => N * a * Math.pow(s, l + j));
  return { l, m, zeta: Z / n, c, tag: `${n}${'spdfgh'[l]}${m}(Z=${Z})`, n };
}
/** the L²-normalised Coulomb Sturmian of sturmian.js: S_nlm(λ) with ζ = λ */
export function sturmianFn(n, l, m, lambda) {
  const lag = laguerreCoeffs(n - l - 1, 2 * l + 1), s = 2 * lambda, N = sturmianNorm(n, l, lambda);
  const c = Float64Array.from(lag, (a, j) => N * a * Math.pow(s, l + j));
  return { l, m, zeta: lambda, c, tag: `S${n}${'spdfgh'[l]}${m}(λ=${lambda})`, n };
}
/** the σ (m = 0) functions n ≤ nMax, l < n, built by make(n, l, m) — nMax(nMax+1)/2 of them */
export function sigmaBasis(nMax, make) { const out = []; for (let n = 1; n <= nMax; n++) for (let l = 0; l < n; l++) out.push(make(n, l, 0)); return out; }
/** accept a descriptor, or a register label {n, l, m} (→ hydrogenicFn at Z = 1) */
function asFn(x) { return (x.c && x.zeta !== undefined) ? x : hydrogenicFn(x.n, x.l, x.m, 1); }

/* ── the integrals ───────────────────────────────────────────────────────────── */
/** per-function precomputation: the angular polynomial, and the Laplacian's regular and singular parts (mo.js imports it) */
export function prepare(fn, s) {
  const { l, m, zeta, c } = fn, am = Math.abs(m);
  const leg = legendreDerivCoeffs(l, am);                                 // r^{l−am} d^{am}P_l(z/r) = Σ_q leg_q z^q r^{l−am−q}
  const ang = ((m >= 0 && am % 2 === 1) ? -1 : 1) * ylmNorm(l, am);
  const J = c.length, reg = new Float64Array(J); let sing = 0;            // −½∇²χ = e^{−ζr} Y_lm [ r^l Σ reg_j r^j + sing · r^{l−1} ]
  for (let j = 0; j < J; j++) {
    const cj = c[j]; if (cj === 0) continue;
    const k = l + j, A = k * (k + 1) - l * (l + 1);
    if (j >= 2) reg[j - 2] += cj * A; else if (j === 1) sing += cj * A;    // A r^{k−2}; A = 0 when j = 0
    if (j >= 1) reg[j - 1] -= cj * 2 * (k + 1) * zeta; else sing -= cj * 2 * (k + 1) * zeta;
    reg[j] += cj * zeta * zeta;
  }
  for (let j = 0; j < J; j++) reg[j] *= -0.5; sing *= -0.5;
  return { l, m, am, zeta, c, leg, ang, reg, sing, s };
}
/**
 * twoCentre(basisA, basisB, R, { Z_A, Z_B, nq, adaptEta }) → { S, H, T, VA, VB, positionZ, basis, n, nq }
 * S = overlap, T = ⟨−½∇²⟩, VA = ⟨−1/r_A⟩, VB = ⟨−1/r_B⟩, H = T + Z_A·VA + Z_B·VB — real symmetric, row-major, ordered
 * [basisA…, basisB…]. positionZ = ⟨χ_i|z|χ_j⟩, origin at the midpoint. Elements between different m vanish.
 * An electron in a uniform electric field E_z has interaction +E_z positionZ (length gauge, electron charge −1).
 */
export function twoCentre(basisA, basisB, R, { Z_A = 1, Z_B = 1, nq = 9, adaptEta = true } = {}) {
  const fns = [...basisA.map((f) => prepare(asFn(f), +1)), ...basisB.map((f) => prepare(asFn(f), -1))];
  const N = fns.length, a = R / 2, NA = basisA.length;
  const S = new Float64Array(N * N), T = new Float64Array(N * N), VA = new Float64Array(N * N), VB = new Float64Array(N * N), H = new Float64Array(N * N);
  const positionZ = new Float64Array(N * N);
  const GL = gaussLaguerre(nq);
  const val = (f, r, z, rho) => {                                          // B = ang ρ^{am} W(z, r) Q(r), and B̃ = the same without Q
    let W = 0, zp = 1; for (let q = 0; q < f.leg.length; q++) { W += f.leg[q] * zp * Math.pow(r, f.l - f.am - q); zp *= z; }
    let Q = 0, rp = 1; for (let j = 0; j < f.c.length; j++) { Q += f.c[j] * rp; rp *= r; }
    let G = 0; rp = 1; for (let j = 0; j < f.reg.length; j++) { G += f.reg[j] * rp; rp *= r; }
    const Bt = f.ang * Math.pow(rho, f.am) * W;
    return [Bt * Q, Bt * G, Bt * f.sing];
  };
  for (let i = 0; i < N; i++) {
    const fi = fns[i];
    for (let j = i; j < N; j++) {
      const fj = fns[j];
      if (fi.m !== fj.m) continue;
      const alpha = a * (fi.zeta + fj.zeta), beta = a * (fi.s * fi.zeta + fj.s * fj.zeta);
      const GG = gaussLegendre(adaptEta ? nq + Math.ceil(2 * Math.abs(beta)) : nq);
      /* the ξ weight e^{−αξ} = e^{−α}e^{−x} is Gauss–Laguerre's; its e^{−α} is folded INTO the η weight as ONE exponential
         e^{−α−βη}: |β| ≤ α, so the exponent is never positive and nothing overflows.  Written as e^{−α} × e^{−βη} the
         prefactor underflowed to 0 past α = 745 while the same-centre weight overflowed past β = 709, and S, H were NaN
         from R ≈ 450 on (the reviewer's finding, wave 42); the product is the same number wherever both were finite. */
      const pref = 2 * Math.PI * a * a * a / alpha;
      let s = 0, vA = 0, vB = 0, tij = 0, tji = 0, zij = 0;
      for (let p = 0; p < nq; p++) {
        const xi = 1 + GL.x[p] / alpha, wx = GL.w[p];
        for (let q = 0; q < GG.x.length; q++) {
          const eta = GG.x[q], w = wx * GG.w[q] * Math.exp(-alpha - beta * eta);
          const rA = a * (xi + eta), rB = a * (xi - eta), zA = a * (xi * eta + 1), zB = a * (xi * eta - 1);
          const rho = a * Math.sqrt(Math.max(0, (xi * xi - 1) * (1 - eta * eta)));
          const Bi = fi.s > 0 ? val(fi, rA, zA, rho) : val(fi, rB, zB, rho);
          const Bj = fj.s > 0 ? val(fj, rA, zA, rho) : val(fj, rB, zB, rho);
          const vol = xi * xi - eta * eta, mA = (xi - eta) / a, mB = (xi + eta) / a;   // (ξ²−η²), (ξ²−η²)/r_A, (ξ²−η²)/r_B
          s += w * Bi[0] * Bj[0] * vol;
          zij += w * Bi[0] * Bj[0] * vol * a * xi * eta;
          vA += w * Bi[0] * Bj[0] * mA; vB += w * Bi[0] * Bj[0] * mB;
          tij += w * Bi[0] * (Bj[1] * vol + Bj[2] * (fj.s > 0 ? mA : mB));          // ⟨i|−½∇²|j⟩
          tji += w * Bj[0] * (Bi[1] * vol + Bi[2] * (fi.s > 0 ? mA : mB));          // ⟨j|−½∇²|i⟩
        }
      }
      const Sij = pref * s, VAij = -pref * vA, VBij = -pref * vB, Tij = 0.5 * pref * (tij + tji);
      S[i * N + j] = S[j * N + i] = Sij; VA[i * N + j] = VA[j * N + i] = VAij; VB[i * N + j] = VB[j * N + i] = VBij; T[i * N + j] = T[j * N + i] = Tij;
      H[i * N + j] = H[j * N + i] = Tij + Z_A * VAij + Z_B * VBij;
      positionZ[i * N + j] = positionZ[j * N + i] = pref * zij;
    }
  }
  return { S, H, T, VA, VB, positionZ, basis: fns, n: N, nA: NA, nq, R, Z_A, Z_B };
}
/**
 * parityBlocks(M) — for a basis mirrored on both centres (basisB = basisA in the same order) the inversion-adapted
 * combinations g_i = (χ_A,i + p_i χ_B,i)/√2, u_i = (χ_A,i − p_i χ_B,i)/√2, p_i = (−1)^{l_i}, give { g: {S, H}, u: {S, H} }
 * (each nA × nA).  Exact for a homonuclear pair (Z_A = Z_B); the g–u cross block is then zero.
 */
export function parityBlocks(M) {
  const N = M.n, nA = M.nA; if (2 * nA !== N) throw new Error('parityBlocks: basis must be mirrored');
  const pick = (X, i, j) => X[i * N + j];
  const block = (X, sgn) => { const out = new Float64Array(nA * nA); for (let i = 0; i < nA; i++) { const pi = (M.basis[i].l % 2) ? -1 : 1; for (let j = 0; j < nA; j++) { const pj = (M.basis[j].l % 2) ? -1 : 1; out[i * nA + j] = 0.5 * (pick(X, i, j) + sgn * pj * pick(X, i, nA + j) + sgn * pi * pick(X, nA + i, j) + pi * pj * pick(X, nA + i, nA + j)); } } return out; };
  return { g: { S: block(M.S, +1), H: block(M.H, +1) }, u: { S: block(M.S, -1), H: block(M.H, -1) }, nA };
}
/**
 * h2plusEnergy(basis, R, opts) — the lowest total energy (electronic + 1/R) of H₂⁺ with the given one-centre basis placed
 * on both protons; opts.parity (default true) solves the gerade block only; opts.detail returns { E, C, M, blocks }.
 */
export function h2plusEnergy(basis, R, { nq = 9, adaptEta = true, parity = true, thresh = 0, detail = false } = {}) {
  const M = twoCentre(basis, basis, R, { nq, adaptEta });
  const P = parity ? parityBlocks(M) : null;
  const eig = generalisedEigen(P ? P.g.S : M.S, P ? P.g.H : M.H, { thresh });
  const E = eig.E[0] + 1 / R;
  return detail ? { E, eig, M, blocks: P } : E;
}
/** H₂⁺ on the Coulomb Sturmians n ≤ nMax (m = 0) at the common scale λ on each centre — the total energy at R */
export function h2plusSturmian(nMax, lambda, R, opts = {}) {
  return h2plusEnergy(sigmaBasis(nMax, (n, l, m) => sturmianFn(n, l, m, lambda)), R, opts);
}
/** minimise E(R) by golden section on [lo, hi] */
export function equilibrium(energyOfR, lo = 1.5, hi = 4, iters = 60) {
  let a = lo, b = hi; const gr = (Math.sqrt(5) - 1) / 2;
  let c = b - gr * (b - a), d = a + gr * (b - a), fc = energyOfR(c), fd = energyOfR(d);
  for (let i = 0; i < iters; i++) { if (fc < fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = energyOfR(c); } else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = energyOfR(d); } }
  const Re = (a + b) / 2; return { Re, E: energyOfR(Re) };
}
