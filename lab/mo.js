

import { gaussLegendre, hydrogenicFn, sturmianFn, sto, sigmaBasis, twoCentre, parityBlocks, prepare, equilibrium as goldenSection } from './twocentre.js';
import { generalisedEigen } from './sturmian.js';
import { legendreDerivCoeffs, ylmNorm, HARTREE_EV } from './hydrogen.js';
import { MU_H2 } from './h2.js';

export { MU_H2, HARTREE_EV };
const TWO_PI = 2 * Math.PI;
const horner = (p, r) => { let s = 0; for (let j = p.length - 1; j >= 0; j--) s = s * r + p[j]; return s; };
/** a_lm of z Y_lm = a_{l+1,m} Y_{l+1,m} + a_lm Y_{l−1,m} */
export const aLower = (l, m) => (l > Math.abs(m)) ? Math.sqrt((l * l - m * m) / ((2 * l - 1) * (2 * l + 1))) : 0;
export const aUpper = (l, m) => Math.sqrt(((l + 1) * (l + 1) - m * m) / ((2 * l + 1) * (2 * l + 3)));

/** the one-centre sets by kind */
export function basisFor(kind, { nMax = 4, lambda = 1.7611 } = {}) {
  if (kind === 'lcao1s') return [hydrogenicFn(1, 0, 0)];
  if (kind === 'hydrogenic') return sigmaBasis(nMax, (n, l, m) => hydrogenicFn(n, l, m));
  if (kind === 'sturmian') return sigmaBasis(nMax, (n, l, m) => sturmianFn(n, l, m, lambda));
  if (Array.isArray(kind)) return kind;
  throw new Error('mo: unknown kind ' + kind);
}

/* ── the pointwise pieces of χ, Hχ and ∂_zχ on one centre ────────────────────────────────────────────────────────── */
/**
 * the ∂_z expansion of ONE descriptor, the header's translation closure written once:
 *   ∂_zχ = e^{−ζr}[ S_{l+1,m} Σ_j E⁺_j r^j + S_{l−1,m} Σ_j E⁻_j r^j + E¹ S_{l+1,m}/r ]
 * (prepareCentre builds the pointwise evaluator from it; oneCentreP integrates it.)
 */
export function dzCoeffs(fn) {
  const { l, m, zeta, c } = fn, J = c.length, ap = aUpper(l, m), al = aLower(l, m);
  const E0p = new Float64Array(Math.max(J - 1, 0));
  for (let j = 0; j < J - 1; j++) E0p[j] = ap * ((j + 2 < J ? (j + 2) * c[j + 2] : 0) - zeta * c[j + 1]);
  const E1p = ap * ((J > 1 ? c[1] : 0) - zeta * c[0]);
  const E0m = new Float64Array(J + 1);
  if (al > 0) for (let j = 0; j < J; j++) { E0m[j] += al * (2 * l + 1 + j) * c[j]; E0m[j + 1] -= al * zeta * c[j]; }
  return { ap, al, E0p, E1p, E0m };
}
/** ∫₀^∞ r^k e^{−βr} dr = k!/β^{k+1}, built up term by term so no factorial is ever formed */
const rMoment = (k, beta) => { let v = 1 / beta; for (let i = 1; i <= k; i++) v *= i / beta; return v; };
/**
 * W-CONNECTION (ledger MATH-MOLECULAR-PULSES §2.1 A6, §2.3, §2.6 C2) — THE CONNECTION IS ONE-CENTRE, AND EXACT.
 *
 * With the functions riding rigidly on their nuclei, D_μν = ⟨χ_μ|∂_Rχ_ν⟩ splits as D = D_H + D_A.  From
 * ∂_RS = D + D† the Hermitian half is D_H = S′/2 exactly.  For the antisymmetric half, the CROSS blocks cancel:
 * D^{AB}_μν = −½⟨χ^A_μ|∂_zχ^B_ν⟩ while D^{BA}_νμ = +½⟨χ^B_ν|∂_zχ^A_μ⟩ = −½⟨χ^A_μ|∂_zχ^B_ν⟩ (real functions,
 * integration by parts) — EQUAL, hence purely Hermitian — so D_A lives entirely on the diagonal blocks,
 *     D_A = ½ diag(P, −P),     P_μν = ⟨χ_μ|∂_z|χ_ν⟩  on ONE centre, real antisymmetric,
 * and needs no two-centre integral at all.  This is the electron-translation-factor coupling of slow atomic
 * collisions (KNOWN: Bates & McCarroll 1958; Delos, Rev. Mod. Phys. 53, 287 (1981)); the assembly here is
 * DERIVED-HERE.  For a σ set (m = 0) only l_μ = l_ν ± 1 survives the angular integral, and with the descriptor
 * χ = e^{−ζr} Σ_j c_j r^{l+j} Y_lm every radial integral is a moment of e^{−(ζ_μ+ζ_ν)r}:
 *     l_μ = l_ν+1:  P = Σ_i c^μ_i [ Σ_j E⁺_j ∫r^{2l_ν+4+i+j}e^{−βr} + E¹ ∫r^{2l_ν+3+i}e^{−βr} ]
 *     l_μ = l_ν−1:  P = Σ_i c^μ_i   Σ_j E⁻_j ∫r^{2l_ν+i+j}e^{−βr}
 * EXACT (a finite sum of Γ functions), judged in tests/mo.test.mjs W49-1 against the closed hydrogen value
 * |⟨1s|∂_z|2p₀⟩| = (3/8)(128√2/243) = 0.279351 and the reviewer's Sturmian quadrature ⟨S1s|∂_z|S2p₀⟩ = 0.880550.
 * On 'lcao1s' P is 1 × 1 and therefore EXACTLY ZERO — the whole connection there is the metric term, which is
 * what the old renormalisation was silently performing (see THE DYNAMICS below).
 */
export function oneCentreP(basis) {
  const N = basis.length, P = new Float64Array(N * N);
  for (let u = 0; u < N; u++) for (let v = 0; v < N; v++) {
    const A = basis[u], B = basis[v];
    if (A.m !== B.m) continue;
    const beta = A.zeta + B.zeta, { E0p, E1p, E0m } = dzCoeffs(B);
    let acc = 0;
    if (A.l === B.l + 1) {
      for (let i = 0; i < A.c.length; i++) {
        const ci = A.c[i]; if (!ci) continue;
        for (let j = 0; j < E0p.length; j++) if (E0p[j]) acc += ci * E0p[j] * rMoment(2 * B.l + 4 + i + j, beta);
        if (E1p) acc += ci * E1p * rMoment(2 * B.l + 3 + i, beta);
      }
    } else if (A.l === B.l - 1) {
      for (let i = 0; i < A.c.length; i++) {
        const ci = A.c[i]; if (!ci) continue;
        for (let j = 0; j < E0m.length; j++) if (E0m[j]) acc += ci * E0m[j] * rMoment(2 * B.l + i + j, beta);
      }
    }
    P[u * N + v] = acc;
  }
  return P;
}
/**
 * Jacobi eigen-decomposition of a real symmetric n × n (row-major): { values, vectors } with vectors[i*n+k] = (v_k)_i.
 * The cyclic sweep touches only the UPPER triangle and carries the eigenvectors TRANSPOSED (one row per vector) so
 * every rotation runs down contiguous memory — the Ehrenfest step exponentiates a 2n × 2n matrix once per step, and
 * the column-strided form of this loop was most of its cost.  Rutishauser's threshold skip on the first sweeps and
 * the small-rotation test are Numerical Recipes' `jacobi`; the transposition at the end is n² and free.
 */
export function symmetricEigen(A, n) {
  const a = Float64Array.from(A), vt = new Float64Array(n * n), d = new Float64Array(n), z = new Float64Array(n), b = new Float64Array(n);
  for (let i = 0; i < n; i++) { vt[i * n + i] = 1; d[i] = b[i] = a[i * n + i]; }
  for (let sweep = 0; sweep < 60; sweep++) {
    let sm = 0; for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) sm += Math.abs(a[p * n + q]);
    if (sm === 0) break;
    const tresh = sweep < 4 ? 0.2 * sm / (n * n) : 0;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q], g = 100 * Math.abs(apq);
      if (sweep > 4 && Math.abs(d[p]) + g === Math.abs(d[p]) && Math.abs(d[q]) + g === Math.abs(d[q])) { a[p * n + q] = 0; continue; }
      if (Math.abs(apq) <= tresh) continue;
      let h = d[q] - d[p], t;
      if (Math.abs(h) + g === Math.abs(h)) t = apq / h;
      else { const theta = 0.5 * h / apq; t = 1 / (Math.abs(theta) + Math.sqrt(1 + theta * theta)); if (theta < 0) t = -t; }
      const cs = 1 / Math.sqrt(1 + t * t), sn = t * cs, tau = sn / (1 + cs);
      h = t * apq; z[p] -= h; z[q] += h; d[p] -= h; d[q] += h; a[p * n + q] = 0;
      for (let j = 0; j < p; j++) { const x = a[j * n + p], y = a[j * n + q]; a[j * n + p] = x - sn * (y + x * tau); a[j * n + q] = y + sn * (x - y * tau); }
      for (let j = p + 1; j < q; j++) { const x = a[p * n + j], y = a[j * n + q]; a[p * n + j] = x - sn * (y + x * tau); a[j * n + q] = y + sn * (x - y * tau); }
      for (let j = q + 1; j < n; j++) { const x = a[p * n + j], y = a[q * n + j]; a[p * n + j] = x - sn * (y + x * tau); a[q * n + j] = y + sn * (x - y * tau); }
      const rp = p * n, rq = q * n;
      for (let j = 0; j < n; j++) { const x = vt[rp + j], y = vt[rq + j]; vt[rp + j] = x - sn * (y + x * tau); vt[rq + j] = y + sn * (x - y * tau); }
    }
    for (let i = 0; i < n; i++) { b[i] += z[i]; d[i] = b[i]; z[i] = 0; }
  }
  const v = new Float64Array(n * n);
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) v[i * n + k] = vt[k * n + i];
  return { values: d, vectors: v };
}
/** A x = b for several right-hand sides, Gaussian elimination with partial pivoting; A and each b are overwritten */
export function solveInPlace(A, rhs, n) {
  for (let k = 0; k < n; k++) {
    let piv = k, mx = Math.abs(A[k * n + k]);
    for (let i = k + 1; i < n; i++) { const v = Math.abs(A[i * n + k]); if (v > mx) { mx = v; piv = i; } }
    if (piv !== k) { for (let j = 0; j < n; j++) { const t = A[k * n + j]; A[k * n + j] = A[piv * n + j]; A[piv * n + j] = t; } for (const b of rhs) { const t = b[k]; b[k] = b[piv]; b[piv] = t; } }
    const d = A[k * n + k] || 1e-300;
    for (let i = k + 1; i < n; i++) {
      const f = A[i * n + k] / d; if (f === 0) continue;
      for (let j = k; j < n; j++) A[i * n + j] -= f * A[k * n + j];
      for (const b of rhs) b[i] -= f * b[k];
    }
  }
  for (const b of rhs) for (let i = n - 1; i >= 0; i--) { let acc = b[i]; for (let j = i + 1; j < n; j++) acc -= A[i * n + j] * b[j]; b[i] = acc / (A[i * n + i] || 1e-300); }
  return rhs;
}
function prepareCentre(basis, s, Zown) {
  const zetas = [], slots = [], slotKey = new Map();
  const slot = (l, am) => { const k = l * 16 + am; if (!slotKey.has(k)) { slotKey.set(k, slots.length); slots.push({ l, am, leg: Float64Array.from(legendreDerivCoeffs(l, am)) }); } return slotKey.get(k); };
  const fns = basis.map((fn) => {
    const { l, m, zeta, c } = fn, am = Math.abs(m), J = c.length, sign = (m >= 0 && am % 2 === 1) ? -1 : 1;
    let zi = zetas.indexOf(zeta); if (zi < 0) { zi = zetas.length; zetas.push(zeta); }
    /* −½∇²χ = e^{−ζr} S_lm [Σ reg_j r^j + sing/r] — twocentre.js's own split, imported, not re-derived (wave 41) */
    const { reg, sing } = prepare(fn, s);
    const D1 = Float64Array.from(c, (v) => -Zown * v); D1[0] += sing;                 // (Hχ)'s own-centre 1/r piece
    /* ∂_zχ = e^{−ζr}[S_{l+1} Σ E⁺_j r^j + S_{l−1} Σ E⁻_j r^j + E¹ S_{l+1}/r] */
    const { ap, al, E0p, E1p, E0m } = dzCoeffs(fn);
    void ap;
    return { l, m, am, zeta, zi, s, c: Float64Array.from(c), D0: reg, D1, E0p, E1p, E0m, hasM: al > 0,
      sl: slot(l, am), sp: slot(l + 1, am), sm: al > 0 ? slot(l - 1, am) : 0,
      angl: sign * ylmNorm(l, am), angp: sign * ylmNorm(l + 1, am), angm: al > 0 ? sign * ylmNorm(l - 1, am) : 0, tag: fn.tag };
  });
  return { fns, zetas: Float64Array.from(zetas), slots, s, Zown, maxL: Math.max(...fns.map((f) => f.l)) + 1, maxM: Math.max(...fns.map((f) => f.am)) };
}
/**
 * the evaluator: at a point given by (r_A, z − z_A, r_B, z − z_B, ρ) and the coefficient vector (cRe, cIm over
 * [A…, B…]) it fills out[0..9] for each centre: ψ_c, Σ_c c D⁰ (G0 part), Σ_c c D¹ (H1), (s/2)Σ_c c E⁰ (K0 part), (s/2)Σ_c c E¹ (K1)
 * — five complex numbers.  cm/sm hold cos(mφ), sin(mφ) at index m + maxM when the basis has m ≠ 0.
 */
function makeEvaluator(A, B) {
  const maxL = Math.max(A.maxL, B.maxL) + 1, maxM = Math.max(A.maxM, B.maxM);
  const rp = new Float64Array(maxL + 2), zp = new Float64Array(maxL + 2), rhoP = new Float64Array(maxM + 1);
  const exA = new Float64Array(A.zetas.length), exB = new Float64Array(B.zetas.length), tabA = new Float64Array(A.slots.length), tabB = new Float64Array(B.slots.length);
  const cm = new Float64Array(2 * maxM + 1), sm = new Float64Array(2 * maxM + 1);
  const centre = (C, ex, tab, r, zc, off, cRe, cIm, out) => {
    rp[0] = 1; zp[0] = 1; for (let k = 1; k < rp.length; k++) { rp[k] = rp[k - 1] * r; zp[k] = zp[k - 1] * zc; }
    for (let k = 0; k < ex.length; k++) ex[k] = Math.exp(-C.zetas[k] * r);
    for (let q = 0; q < tab.length; q++) { const sl = C.slots[q], leg = sl.leg, d = sl.l - sl.am; let W = 0; for (let k = 0; k <= d; k++) W += leg[k] * zp[k] * rp[d - k]; tab[q] = rhoP[sl.am] * W; }
    let pr = 0, pi = 0, g0r = 0, g0i = 0, h1r = 0, h1i = 0, k0r = 0, k0i = 0, k1r = 0, k1i = 0;
    const half = 0.5 * C.s, F = C.fns;
    for (let n = 0; n < F.length; n++) {
      const f = F[n], idx = off + n;
      let fr = cRe[idx], fi = cIm[idx];
      if (f.m !== 0) { const c0 = cm[f.m + maxM], s0 = sm[f.m + maxM], t = fr * c0 - fi * s0; fi = fr * s0 + fi * c0; fr = t; }
      if (fr === 0 && fi === 0) continue;
      const e = ex[f.zi], Sl = f.angl * tab[f.sl], Sp = f.angp * tab[f.sp];
      const chi = e * horner(f.c, r) * Sl, d0 = e * horner(f.D0, r) * Sl, d1 = e * horner(f.D1, r) * Sl;
      const e0 = e * (horner(f.E0p, r) * Sp + (f.hasM ? horner(f.E0m, r) * f.angm * tab[f.sm] : 0)), e1 = e * f.E1p * Sp;
      pr += fr * chi; pi += fi * chi; g0r += fr * d0; g0i += fi * d0; h1r += fr * d1; h1i += fi * d1;
      k0r += half * fr * e0; k0i += half * fi * e0; k1r += half * fr * e1; k1i += half * fi * e1;
    }
    out[0] = pr; out[1] = pi; out[2] = g0r; out[3] = g0i; out[4] = h1r; out[5] = h1i; out[6] = k0r; out[7] = k0i; out[8] = k1r; out[9] = k1i;
  };
  const nA = A.fns.length;
  return {
    maxM, NP: maxM ? 2 * maxM + 2 : 1,
    setPhi(phi) { for (let m = -maxM; m <= maxM; m++) { cm[m + maxM] = Math.cos(m * phi); sm[m + maxM] = Math.sin(m * phi); } },
    at(rA, zA, rB, zB, rho, cRe, cIm, outA, outB) {
      rhoP[0] = 1; for (let k = 1; k <= maxM; k++) rhoP[k] = rhoP[k - 1] * rho;
      centre(A, exA, tabA, rA, zA, 0, cRe, cIm, outA); centre(B, exB, tabB, rB, zB, nA, cRe, cIm, outB);
    },
  };
}

/* ── the grids ───────────────────────────────────────────────────────────────────────────────────────────────────── */
export const DEFAULT_QUAD = { nXi: 12, nEta: 20, nRad: 10, nAng: 20, nAngNear: 32 };
const XI_PANELS = [0, 0.5, 1.5, 3, 5, 8, 12, 17, 24, 33, 44, 56, 70];              // in decay units of the slowest pair
/** the prolate grid: points with r_A, r_B, z − z_A, z − z_B, ρ, weight, and the measures d³x, d³x/r_A, d³x/r_B (d³x/(r_A r_B) = a).
 *  The η rule carries ⌈2ζ_max R⌉ points beyond q.nEta — twocentre.js's own nq + ⌈2|β|⌉ law: a same-centre pair's
 *  e^{−ζ_i r_i − ζ_j r_j} is e^{−(ζ_i+ζ_j)a(ξ+η)}, a spike of width 1/(ζR) at η = ∓1, and 20 fixed points held it only to
 *  R ≈ 35/ζ — the reviewer's R = 40 finding (wave 42). */
export function prolateGrid(R, zetaMin, q = DEFAULT_QUAD, zetaMax = zetaMin) {
  const a = R / 2, alphaMin = 2 * zetaMin * a, GX = gaussLegendre(q.nXi), nEta = q.nEta + Math.ceil(2 * zetaMax * R), GE = gaussLegendre(nEta);
  const n = (XI_PANELS.length - 1) * q.nXi * nEta;
  const rA = new Float64Array(n), rB = new Float64Array(n), zA = new Float64Array(n), zB = new Float64Array(n), rho = new Float64Array(n), w = new Float64Array(n), m00 = new Float64Array(n), m10 = new Float64Array(n), m01 = new Float64Array(n);
  let p = 0;
  for (let t = 0; t + 1 < XI_PANELS.length; t++) {
    const lo = 1 + XI_PANELS[t] / alphaMin, hi = 1 + XI_PANELS[t + 1] / alphaMin, h = (hi - lo) / 2, c = (lo + hi) / 2;
    for (let i = 0; i < q.nXi; i++) {
      const xi = c + h * GX.x[i], wx = h * GX.w[i];
      for (let j = 0; j < nEta; j++) {
        const eta = GE.x[j];
        rA[p] = a * (xi + eta); rB[p] = a * (xi - eta); zA[p] = a * (xi * eta + 1); zB[p] = a * (xi * eta - 1);
        rho[p] = a * Math.sqrt(Math.max(0, (xi * xi - 1) * (1 - eta * eta)));
        w[p] = wx * GE.w[j]; m00[p] = a * a * a * (xi * xi - eta * eta); m10[p] = a * a * (xi - eta); m01[p] = a * a * (xi + eta); p++;
      }
    }
  }
  return { n, rA, rB, zA, zB, rho, w, m00, m10, m01, m11: a };
}
/** the radial panel edges about one nucleus: a geometric ladder on the basis scale about the origin, a second ladder about
 *  r = R — the OTHER nucleus's cusp and cloud, R ± {½, 1, 2, 4, …}/ζ_max out to R/2 and 2R (at R = 2, ζ_max = 1 these are
 *  exactly the old edges 1, 1.5, 2, 2.5, 3, 4; at R = 40 the old fractions of R were 10 a₀ apart against a Sturmian cloud
 *  of width 0.57, and the Pulay integrals lost five digits there) — and r_max = max(35/ζ_min, 2.5R): the sphere about A
 *  must reach past B's cloud at r_A ≈ R, and a fixed 35/ζ_min stopped short of it beyond R ≈ 35/ζ_min, where the force on
 *  B went to zero (the reviewer's R = 40 finding, wave 42) */
export function radialEdges(R, zetaMin, zetaMax) {
  const rMax = Math.max(35 / zetaMin, 2.5 * R), anchors = [0.5 * R, R, 2 * R];
  for (let g = 0.5 / zetaMax; g < 0.5 * R; g *= 2) anchors.push(R - g, R + g);
  const ladder = []; for (let g = 0.25 / zetaMax; g < rMax; g *= 1.8) ladder.push(g);
  const keep = anchors.filter((v) => v < rMax);
  return [...new Set([0, ...ladder.filter((e) => keep.every((v) => Math.abs(e - v) > 0.12 * v)), ...keep, rMax])].sort((x, y) => x - y);
}
/**
 * the spherical grid about the nucleus with sign s (+1 = A, −1 = B): measure dr dΩ (the 1/r² absorbed), with the other
 * nucleus at cos θ = s; near panels (r ∈ [R/2, 2R]) use cos θ = s(1 − 2v⁴), the far ones Gauss–Legendre in cos θ
 */
export function sphereGrid(R, s, zetaMin, zetaMax, q = DEFAULT_QUAD) {
  const a = R / 2, E = radialEdges(R, zetaMin, zetaMax), GR = gaussLegendre(q.nRad), GU = gaussLegendre(q.nAng), GV = gaussLegendre(q.nAngNear);
  const near = (lo, hi) => lo >= 0.5 * R - 1e-12 && hi <= 2 * R + 1e-12;
  let n = 0; for (let t = 0; t + 1 < E.length; t++) n += q.nRad * (near(E[t], E[t + 1]) ? q.nAngNear : q.nAng);
  const r = new Float64Array(n), u = new Float64Array(n), rO = new Float64Array(n), zOwn = new Float64Array(n), zO = new Float64Array(n), rho = new Float64Array(n), w = new Float64Array(n);
  let p = 0;
  for (let t = 0; t + 1 < E.length; t++) {
    const lo = E[t], hi = E[t + 1], h = (hi - lo) / 2, c = (lo + hi) / 2, isNear = near(lo, hi);
    for (let i = 0; i < q.nRad; i++) {
      const rr = c + h * GR.x[i], wr = h * GR.w[i];
      if (isNear) {
        for (let k = 0; k < q.nAngNear; k++) {
          const v = 0.5 + 0.5 * GV.x[k], v4 = v * v * v * v, wu = 0.5 * GV.w[k] * 8 * v * v * v, uu = s * (1 - 2 * v4);
          r[p] = rr; u[p] = uu; rO[p] = Math.sqrt((rr - 2 * a) * (rr - 2 * a) + 8 * a * rr * v4); zOwn[p] = rr * uu; zO[p] = rr * uu - s * 2 * a;
          rho[p] = rr * Math.sqrt(Math.max(0, 2 * v4 * (2 - 2 * v4))); w[p] = wr * wu; p++;
        }
      } else {
        for (let k = 0; k < q.nAng; k++) {
          const uu = GU.x[k];
          r[p] = rr; u[p] = uu; rO[p] = Math.sqrt((rr - 2 * a) * (rr - 2 * a) + 4 * a * rr * (1 - s * uu)); zOwn[p] = rr * uu; zO[p] = rr * uu - s * 2 * a;
          rho[p] = rr * Math.sqrt(Math.max(0, (1 - uu) * (1 + uu))); w[p] = wr * GU.w[k]; p++;
        }
      }
    }
  }
  return { n, s, r, u, rO, zOwn, zO, rho, w, edges: E };
}

/* ── the molecule ────────────────────────────────────────────────────────────────────────────────────────────────── */
const asComplex = (c, n) => (c.re ? { re: Float64Array.from(c.re), im: Float64Array.from(c.im || new Float64Array(n)) } : { re: Float64Array.from(c), im: new Float64Array(n) });
/**
 * createMO({ kind, nMax, lambda, Z_A, Z_B, mass, quad, nq, adaptEta }) →
 *   { kind, basis, n, nA, Z_A, Z_B, mass, homonuclear, basisAt(R), solve(R), groundEnergy(R), equilibrium(opts),
 *     force(R, c, opts), state(R, c), energyOf(R, c), propagate(R, c, dt), vector(sol, k), dissociation }
 */
export function createMO({ kind = 'sturmian', nMax = 4, lambda = 1.7611, Z_A = 1, Z_B = 1, mass = MU_H2, quad = {}, nq = 9, adaptEta = true } = {}) {
  const basis = basisFor(kind, { nMax, lambda }), nA = basis.length, n = 2 * nA, homonuclear = Z_A === Z_B;
  const P1 = oneCentreP(basis);                                                          // W-CONNECTION: the one-centre ⟨χ|∂_z|χ⟩ block, computed once (exact)
  const q = { ...DEFAULT_QUAD, ...quad };
  const A = prepareCentre(basis, +1, Z_A), B = prepareCentre(basis, -1, Z_B), ev = makeEvaluator(A, B);
  const zetaMin = Math.min(...basis.map((f) => f.zeta)), zetaMax = Math.max(...basis.map((f) => f.zeta));
  const dissociation = -(Math.max(Z_A, Z_B) ** 2) / 2;                                   // the exact separated-atom limit
  const cache = new Map(), CACHE_MAX = 24;
  /** the two-centre matrices at R (cached; the grids are attached lazily by force()) */
  function basisAt(R) {
    if (cache.has(R)) return cache.get(R);
    const M = twoCentre(basis, basis, R, { Z_A, Z_B, nq, adaptEta });
    const rec = { R, M, S: M.S, H: M.H, sol: null, grids: null };
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(R, rec); return rec;
  }
  /** H C = S C E: E ascending, C S-orthonormal (column k = eigenvector k, row-major n × n), parity per level, E0 = E[0] + Z_AZ_B/R */
  function solve(R) {
    const rec = basisAt(R); if (rec.sol) return rec.sol;
    const { S, H } = rec; let E, C, parity;
    if (homonuclear) {
      const P = parityBlocks(rec.M), g = generalisedEigen(P.g.S, P.g.H), u = generalisedEigen(P.u.S, P.u.H);
      const levels = [];
      for (let k = 0; k < nA; k++) levels.push({ E: g.E[k], p: 'g', k, eig: g }, { E: u.E[k], p: 'u', k, eig: u });
      levels.sort((x, y) => x.E - y.E);
      E = Float64Array.from(levels, (L) => L.E); C = new Float64Array(n * n); parity = levels.map((L) => L.p);
      levels.forEach((L, col) => { const sgn = L.p === 'g' ? 1 : -1; for (let i = 0; i < nA; i++) { const v = L.eig.C[i * nA + L.k] / Math.SQRT2, pi = (basis[i].l % 2) ? -1 : 1; C[i * n + col] = v; C[(nA + i) * n + col] = sgn * pi * v; } });
    } else {
      const eig = generalisedEigen(S, H); E = eig.E; C = eig.C; parity = Array.from(E, () => '-');
    }
    const CtS = new Float64Array(n * n);                                                // the S-metric projector rows
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < n; j++) s += C[j * n + k] * S[j * n + i]; CtS[k * n + i] = s; }
    const Enuc = Z_A * Z_B / R;
    rec.sol = { R, n, nA, S, H, E, C, CtS, parity, Enuc, E0: E[0] + Enuc, Eel: E[0] };
    return rec.sol;
  }
  const vector = (sol, k = 0) => { const v = new Float64Array(n); for (let i = 0; i < n; i++) v[i] = sol.C[i * n + k]; return v; };
  const groundEnergy = (R) => solve(R).E0;
  /** ⟨c|X|c⟩ for a real symmetric X and a complex c */
  const quadForm = (X, c) => { let s = 0; for (let i = 0; i < n; i++) { let ar = 0, ai = 0; for (let j = 0; j < n; j++) { const w = X[i * n + j]; ar += w * c.re[j]; ai += w * c.im[j]; } s += c.re[i] * ar + c.im[i] * ai; } return s; };
  /** the electronic energy ⟨H⟩/⟨S⟩ of any c at R, and the norm */
  function energyOf(R, c) { const rec = basisAt(R), cc = asComplex(c, n), norm = quadForm(rec.S, cc); return { E: quadForm(rec.H, cc) / norm, norm, E0: quadForm(rec.H, cc) / norm + Z_A * Z_B / R }; }
  /** c(t + dt) = C e^{−iE dt} CᵀS c(t) in the basis at R (exact within the basis) */
  function propagate(R, c, dt) {
    const sol = solve(R), cc = asComplex(c, n), dre = new Float64Array(n), dim = new Float64Array(n);
    for (let k = 0; k < n; k++) { let sr = 0, si = 0; for (let i = 0; i < n; i++) { const w = sol.CtS[k * n + i]; sr += w * cc.re[i]; si += w * cc.im[i]; } const ph = -sol.E[k] * dt, cs = Math.cos(ph), sn = Math.sin(ph); dre[k] = sr * cs - si * sn; dim[k] = sr * sn + si * cs; }
    const re = new Float64Array(n), im = new Float64Array(n);
    for (let i = 0; i < n; i++) { let sr = 0, si = 0; for (let k = 0; k < n; k++) { const w = sol.C[i * n + k]; sr += w * dre[k]; si += w * dim[k]; } re[i] = sr; im[i] = si; }
    return { re, im };
  }
  /* ── W-CONNECTION: the moving-basis transport over one nuclear step ───────────────────────────────────────────── */
  const sqrtCache = new Map();                                                           // R → { W, Wi } for S(R)^{±1/2}
  /** S(R)^{1/2} and its inverse, by the symmetric (Löwdin) square root of the eigen-decomposition */
  function metricRoots(R) {
    if (sqrtCache.has(R)) return sqrtCache.get(R);
    const S = basisAt(R).S, { values, vectors: U } = symmetricEigen(S, n);
    const W = new Float64Array(n * n), Wi = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let a = 0, b = 0;
      for (let k = 0; k < n; k++) { const q = Math.sqrt(Math.max(values[k], 1e-300)), u = U[i * n + k] * U[j * n + k]; a += u * q; b += u / q; }
      W[i * n + j] = W[j * n + i] = a; Wi[i * n + j] = Wi[j * n + i] = b;
    }
    const rec = { W, Wi };
    if (sqrtCache.size >= 8) sqrtCache.delete(sqrtCache.keys().next().value);
    sqrtCache.set(R, rec); return rec;
  }
  /** D(R) = S′/2 + ½diag(P, −P), the full derivative coupling ⟨χ_μ|∂_Rχ_ν⟩ (S′ by central differences at step h) */
  function connection(R, h = 1e-4) {
    const Sp = basisAt(R + h).S, Sm = basisAt(R - h).S, D = new Float64Array(n * n);
    for (let i = 0; i < n * n; i++) D[i] = (Sp[i] - Sm[i]) / (4 * h);                     // = S′/2
    for (let i = 0; i < nA; i++) for (let j = 0; j < nA; j++) { const v = 0.5 * P1[i * nA + j]; D[i * n + j] += v; D[(nA + i) * n + (nA + j)] -= v; }
    return D;
  }
  /**
   * transport(R0, R1, c) — the connection alone, and the reason the Ehrenfest branch no longer renormalises.  The exact equation in a basis that rides on the nuclei is iSċ = (H − iṘD)c, and it
   * conserves c†S(R)c EXACTLY, because Ṡ = Ṙ(D + D†) cancels the two transport terms.  In the S-orthonormal frame
   * y = S^{1/2}c (|y|² = c†Sc) the transport-only flow dc/dR = −S⁻¹Dc becomes dy/dR = Ω y with
   *     Ω = ẆW⁻¹ − W⁻¹DW⁻¹,   W = S^{1/2},   and   Ω + Ωᵀ = 0
   * (the symmetric part of ẆW⁻¹ is ½W⁻¹S′W⁻¹, which is exactly the symmetric part of W⁻¹DW⁻¹ = W⁻¹D_HW⁻¹).  So the
   * generator is ANTISYMMETRIC and its Cayley transform is exactly orthogonal: with X = ΔR·Ω antisymmetrised,
   *     y₁ = (I − X/2)⁻¹(I + X/2) y₀,     c₁ = W(R₁)⁻¹ y₁,     y₀ = W(R₀) c₀
   * conserves c†S(R)c to machine precision NO MATTER how approximate X is — the accuracy of the transport and the
   * conservation of the norm are separated, which is the whole point of doing it in this frame.  X is built from the
   * midpoint metric S_mid = (S₀+S₁)/2 and ΔS = S₁ − S₀ (never from S′ divided by ΔR), so it is O(ΔR), second-order
   * accurate, and exactly the identity at ΔR = 0:
   *     X = W_Δ W⁻¹ − W⁻¹(ΔS/2 + ΔR·½diag(P, −P))W⁻¹,   W_Δ solving W_ΔW + WW_Δ = ΔS   (Sylvester, diagonal in U).
   * DERIVED-HERE; the split D = S′/2 + ½diag(P, −P) is the ledger's (§2.1 A6, §2.3).  Second order in ΔR, judged in
   * tests/mo.test.mjs W49.
   */
  function transportExponent(R0, R1) {
    const dR = R1 - R0;
    const S0 = basisAt(R0).S, S1 = basisAt(R1).S;                 // dR = 0 is legal: ΔS = 0 and X comes out zero
    const Smid = new Float64Array(n * n), dS = new Float64Array(n * n);
    for (let i = 0; i < n * n; i++) { Smid[i] = 0.5 * (S0[i] + S1[i]); dS[i] = S1[i] - S0[i]; }
    const { values, vectors: U } = symmetricEigen(Smid, n), sq = new Float64Array(n), isq = new Float64Array(n);
    for (let k = 0; k < n; k++) { sq[k] = Math.sqrt(Math.max(values[k], 1e-300)); isq[k] = 1 / sq[k]; }
    /* Wd = U [ (Uᵀ ΔS U)_{kl} / (√λ_k + √λ_l) ] Uᵀ  and  Wi = U diag(1/√λ) Uᵀ */
    const T = new Float64Array(n * n);                                                    // Uᵀ ΔS U
    { const M = new Float64Array(n * n);
      for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { let a = 0; for (let j = 0; j < n; j++) a += dS[i * n + j] * U[j * n + k]; M[i * n + k] = a; }
      for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) { let a = 0; for (let i = 0; i < n; i++) a += U[i * n + k] * M[i * n + l]; T[k * n + l] = a / (sq[k] + sq[l]); } }
    const Wd = new Float64Array(n * n), Wi = new Float64Array(n * n);
    { const M = new Float64Array(n * n);
      for (let i = 0; i < n; i++) for (let l = 0; l < n; l++) { let a = 0; for (let k = 0; k < n; k++) a += U[i * n + k] * T[k * n + l]; M[i * n + l] = a; }
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let a = 0; for (let l = 0; l < n; l++) a += M[i * n + l] * U[j * n + l]; Wd[i * n + j] = a; }
      for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) { let a = 0; for (let k = 0; k < n; k++) a += U[i * n + k] * isq[k] * U[j * n + k]; Wi[i * n + j] = Wi[j * n + i] = a; } }
    /* Y = ΔS/2 + ΔR·D_A (the whole ΔR·D), then X = Wd·Wi − Wi·Y·Wi, antisymmetrised */
    const Y = new Float64Array(n * n);
    for (let i = 0; i < n * n; i++) Y[i] = 0.5 * dS[i];
    for (let i = 0; i < nA; i++) for (let j = 0; j < nA; j++) { const v = 0.5 * dR * P1[i * nA + j]; Y[i * n + j] += v; Y[(nA + i) * n + (nA + j)] -= v; }
    const X = new Float64Array(n * n), M1 = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let a = 0; for (let k = 0; k < n; k++) a += Y[i * n + k] * Wi[k * n + j]; M1[i * n + j] = a; }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      let a = 0, b = 0;
      for (let k = 0; k < n; k++) { a += Wd[i * n + k] * Wi[k * n + j]; b += Wi[i * n + k] * M1[k * n + j]; }
      X[i * n + j] = a - b;
    }
    for (let i = 0; i < n; i++) { X[i * n + i] = 0; for (let j = 0; j < i; j++) { const v = 0.5 * (X[i * n + j] - X[j * n + i]); X[i * n + j] = v; X[j * n + i] = -v; } }
    return { X, Wi: Wi, U, sq, isq };
  }
  /** y = W(R)c and back: the S-orthonormal frame in which |y|² = c†S(R)c */
  const toY = (R, cc) => { const W = metricRoots(R).W, yr = new Float64Array(n), yi = new Float64Array(n);
    for (let i = 0; i < n; i++) { let a = 0, b = 0; for (let j = 0; j < n; j++) { const w = W[i * n + j]; a += w * cc.re[j]; b += w * cc.im[j]; } yr[i] = a; yi[i] = b; } return { yr, yi }; };
  const fromY = (R, yr, yi) => { const Wi = metricRoots(R).Wi, re = new Float64Array(n), im = new Float64Array(n);
    for (let i = 0; i < n; i++) { let a = 0, b = 0; for (let j = 0; j < n; j++) { const w = Wi[i * n + j]; a += w * yr[j]; b += w * yi[j]; } re[i] = a; im[i] = b; } return { re, im }; };
  /** the connection ALONE over one step: c₁ = W(R₁)⁻¹ Cayley(X) W(R₀) c₀ — exactly S-norm-conserving (X antisymmetric) */
  function transport(R0, R1, c) {
    const cc = asComplex(c, n);
    if (R1 === R0) return { re: Float64Array.from(cc.re), im: Float64Array.from(cc.im) };
    const { X } = transportExponent(R0, R1), { yr, yi } = toY(R0, cc);
    const rhsR = new Float64Array(n), rhsI = new Float64Array(n);
    for (let i = 0; i < n; i++) { let a = yr[i], b = yi[i]; for (let j = 0; j < n; j++) { const h = 0.5 * X[i * n + j]; a += h * yr[j]; b += h * yi[j]; } rhsR[i] = a; rhsI[i] = b; }
    const Aug = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Aug[i * n + j] = (i === j ? 1 : 0) - 0.5 * X[i * n + j];
    solveInPlace(Aug, [rhsR, rhsI], n);
    return fromY(R1, rhsR, rhsI);
  }
  /**
   * evolve(R0, R1, c, dt) — ONE Ehrenfest step of the FULL equation iSċ = (H − iṘD)c, with no operator splitting.
   *
   * THE SPLIT WAS THE PROBLEM.  A Strang split [e^{−iH dt/2}][transport][e^{−iH dt/2}] carries a commutator error
   * ∝ dt·ΔR·[H, D]; the H phases at the lab's dt = 5 are of order radians, so on the Sturmian n ≤ 2 run that error
   * put 2.4e-4 of the norm into excited states — twenty times the physics it was added to describe.  So do not split.
   * In the S-orthonormal frame y = W c (W = S^{1/2}, |y|² = c†S(R)c) the WHOLE generator over one step is
   *     y₁ = exp(Z) y₀,     Z = X − i·dt·H̃,     H̃ = W⁻¹HW⁻¹ (real symmetric),   X the transport exponent above,
   * and Z is anti-Hermitian, so exp(Z) is unitary and the S-norm is conserved exactly.  Realified on [Re y; Im y],
   * Ẑ = [[X, A], [−A, X]] with A = dt·H̃ — and Ẑ = J M with J = [[0, I], [−I, 0]] and M = [[A, −X], [X, A]] REAL
   * SYMMETRIC, which commute.  Since (JM)² = −M²,
   *     exp(Ẑ) = cos M + J sin M,
   * one real symmetric eigen-decomposition of a 2n × 2n matrix per step: EXACT in dt for a frozen generator (it
   * reduces to e^{−idtH̃} when X = 0), exactly orthogonal in exact arithmetic and to 1e-15 in floating point, and
   * second-order in ΔR through the midpoint S, H and D.  DERIVED-HERE.
   */
  function evolve(R0, R1, c, dt) {
    const cc = asComplex(c, n);
    const { X, Wi: WiM } = transportExponent(R0, R1);            // X and W_mid⁻¹ come from the SAME midpoint metric
    const rec0 = basisAt(R0), rec1 = basisAt(R1);
    const N2 = 2 * n, M = new Float64Array(N2 * N2);
    const Hm = new Float64Array(n * n);
    for (let i = 0; i < n * n; i++) Hm[i] = 0.5 * (rec0.H[i] + rec1.H[i]);
    const T1 = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let a = 0; for (let k = 0; k < n; k++) a += Hm[i * n + k] * WiM[k * n + j]; T1[i * n + j] = a; }
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) { let a = 0; for (let k = 0; k < n; k++) a += WiM[i * n + k] * T1[k * n + j]; const v = dt * a; M[i * N2 + j] = v; M[j * N2 + i] = v; M[(n + i) * N2 + (n + j)] = v; M[(n + j) * N2 + (n + i)] = v; }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { M[i * N2 + (n + j)] = -X[i * n + j]; M[(n + i) * N2 + j] = X[i * n + j]; }
    const { values, vectors: U } = symmetricEigen(M, N2);
    const { yr, yi } = toY(R0, cc), w = new Float64Array(N2);
    for (let i = 0; i < n; i++) { w[i] = yr[i]; w[n + i] = yi[i]; }
    const p = new Float64Array(N2);
    for (let k = 0; k < N2; k++) { let a = 0; for (let i = 0; i < N2; i++) a += U[i * N2 + k] * w[i]; p[k] = a; }
    const cw = new Float64Array(N2), sw = new Float64Array(N2);
    for (let i = 0; i < N2; i++) { let a = 0, b = 0; for (let k = 0; k < N2; k++) { const u = U[i * N2 + k] * p[k]; a += u * Math.cos(values[k]); b += u * Math.sin(values[k]); } cw[i] = a; sw[i] = b; }
    /* J[u; v] = [v; −u] */
    const outR = new Float64Array(n), outI = new Float64Array(n);
    for (let i = 0; i < n; i++) { outR[i] = cw[i] + sw[n + i]; outI[i] = cw[n + i] - sw[i]; }
    return fromY(R1, outR, outI);
  }
  /** R_e by golden section, then ω from the 5-point curvature at R_e; D_e against the exact separated-atom limit */
  function equilibrium({ lo = 1.5, hi = 4, iters = 60, h = 0.02 } = {}) {
    const eq = goldenSection(groundEnergy, lo, hi, iters), Re = eq.Re, E = eq.E;
    const k = (-groundEnergy(Re + 2 * h) + 16 * groundEnergy(Re + h) - 30 * E + 16 * groundEnergy(Re - h) - groundEnergy(Re - 2 * h)) / (12 * h * h);
    const omega = Math.sqrt(Math.max(0, k) / mass);
    return { Re, E, De: dissociation - E, De_eV: (dissociation - E) * HARTREE_EV, k, omega, period: omega ? TWO_PI / omega : Infinity, Eel: E - Z_A * Z_B / Re };
  }
  /**
   * force(R, c, { differences, dR }) — the electrostatic force on B for ANY coefficient vector c (real array or {re, im})
   * in the basis at R, with the Pulay term and the Pulay bound; see the header for every symbol.  Returns
   *   { R, E, E0, norm, F_elec, F_elecA, F_nuc, F_HF, F_rel, pulay, bound, residual, dpsiNorm, dpsiRaw, overlapDpsi,
   *     F_exact (−dE_0/dR), F_fixed (−dE_c/dR at fixed c), checks: { norm, energy } (pointwise vs matrix, absolute), points }
   */
  function force(R, c, { differences = true, dR = 1e-4 } = {}) {
    const rec = basisAt(R), cc = asComplex(c, n), a = R / 2;
    if (!rec.grids) rec.grids = { P: prolateGrid(R, zetaMin, q, zetaMax), GA: sphereGrid(R, +1, zetaMin, zetaMax, q), GB: sphereGrid(R, -1, zetaMin, zetaMax, q) };
    const { P, GA, GB } = rec.grids, cRe = cc.re, cIm = cc.im;
    const norm = quadForm(rec.S, cc), E = quadForm(rec.H, cc) / norm;
    const oA = new Float64Array(10), oB = new Float64Array(10), NP = ev.NP, wphi = TWO_PI / NP;
    let pul = 0, res = 0, dps = 0, pdr = 0, pdi = 0, nrm = 0, en = 0;
    for (let k = 0; k < NP; k++) {
      if (NP > 1) ev.setPhi(TWO_PI * (k + 0.5) / NP);
      for (let p = 0; p < P.n; p++) {
        ev.at(P.rA[p], P.zA[p], P.rB[p], P.zB[p], P.rho[p], cRe, cIm, oA, oB);
        const w = P.w[p] * wphi, M00 = P.m00[p], M10 = P.m10[p], M01 = P.m01[p], M11 = P.m11;
        const psr = oA[0] + oB[0], psi = oA[1] + oB[1];
        const g0r = oA[2] + oB[2] - E * psr, g0i = oA[3] + oB[3] - E * psi;              // (H − E)ψ's regular part
        const gAr = oA[4] - Z_A * oB[0], gAi = oA[5] - Z_A * oB[1], gBr = oB[4] - Z_B * oA[0], gBi = oB[5] - Z_B * oA[1];
        const k0r = oA[6] + oB[6], k0i = oA[7] + oB[7], kAr = oA[8], kAi = oA[9], kBr = oB[8], kBi = oB[9];
        pul += w * ((k0r * g0r + k0i * g0i) * M00 + (k0r * gAr + k0i * gAi + kAr * g0r + kAi * g0i) * M10 + (k0r * gBr + k0i * gBi + kBr * g0r + kBi * g0i) * M01 + (kAr * gBr + kAi * gBi + kBr * gAr + kBi * gAi) * M11);
        res += w * ((g0r * g0r + g0i * g0i) * M00 + 2 * (g0r * gAr + g0i * gAi) * M10 + 2 * (g0r * gBr + g0i * gBi) * M01 + 2 * (gAr * gBr + gAi * gBi) * M11);
        dps += w * ((k0r * k0r + k0i * k0i) * M00 + 2 * (k0r * kAr + k0i * kAi) * M10 + 2 * (k0r * kBr + k0i * kBi) * M01 + 2 * (kAr * kBr + kAi * kBi) * M11);
        pdr += w * ((psr * k0r + psi * k0i) * M00 + (psr * kAr + psi * kAi) * M10 + (psr * kBr + psi * kBi) * M01);      // ⟨ψ|∂ψ⟩
        pdi += w * ((psr * k0i - psi * k0r) * M00 + (psr * kAi - psi * kAr) * M10 + (psr * kBi - psi * kBr) * M01);
        nrm += w * (psr * psr + psi * psi) * M00;
        en += w * ((psr * (oA[2] + oB[2]) + psi * (oA[3] + oB[3])) * M00 + (psr * gAr + psi * gAi) * M10 + (psr * gBr + psi * gBi) * M01);
      }
    }
    const sphere = (G, own) => {                                                        // the 1/r_own² pieces and the force on `own`
      let pl = 0, rs = 0, dp = 0, F = 0; const Zown = own > 0 ? Z_A : Z_B, Zoth = own > 0 ? Z_B : Z_A;
      for (let k = 0; k < NP; k++) {
        if (NP > 1) ev.setPhi(TWO_PI * (k + 0.5) / NP);
        for (let p = 0; p < G.n; p++) {
          if (own > 0) ev.at(G.r[p], G.zOwn[p], G.rO[p], G.zO[p], G.rho[p], cRe, cIm, oA, oB); else ev.at(G.rO[p], G.zO[p], G.r[p], G.zOwn[p], G.rho[p], cRe, cIm, oA, oB);
          const o = own > 0 ? oA : oB, x = own > 0 ? oB : oA, w = G.w[p] * wphi;
          const gr = o[4] - Zown * x[0], gi = o[5] - Zown * x[1], kr = o[8], ki = o[9], psr = oA[0] + oB[0], psi = oA[1] + oB[1];
          pl += w * (kr * gr + ki * gi); rs += w * (gr * gr + gi * gi); dp += w * (kr * kr + ki * ki); F += w * (psr * psr + psi * psi) * G.u[p];
        }
      }
      void Zoth;
      return { pl, rs, dp, F: Zown * F };
    };
    const SA = sphere(GA, +1), SB = sphere(GB, -1);
    const F_elecA = SA.F / norm, F_elec = SB.F / norm, F_nuc = Z_A * Z_B / (R * R);
    const pulay = 2 * (pul + SA.pl + SB.pl) / norm;
    const residual = Math.sqrt(Math.max(0, (res + SA.rs + SB.rs) / norm));
    const dpsiRaw2 = (dps + SA.dp + SB.dp) / norm, ov2 = (pdr * pdr + pdi * pdi) / (norm * norm);
    const dpsiNorm = Math.sqrt(Math.max(0, dpsiRaw2 - ov2));
    const out = { R, E, E0: E + Z_A * Z_B / R, norm, F_elec, F_elecA, F_nuc, F_HF: F_elec + F_nuc, F_rel: 0.5 * (F_elec - F_elecA) + F_nuc,
      pulay, bound: 2 * dpsiNorm * residual, residual, dpsiNorm, dpsiRaw: Math.sqrt(dpsiRaw2), overlapDpsi: Math.sqrt(ov2),
      checks: { norm: nrm - norm, energy: en / nrm - E }, points: P.n + GA.n + GB.n, F_exact: null, F_fixed: null };
    if (differences) {
      out.F_exact = -(groundEnergy(R + dR) - groundEnergy(R - dR)) / (2 * dR);
      out.F_fixed = -(energyOf(R + dR, cc).E0 - energyOf(R - dR, cc).E0) / (2 * dR);
    }
    return out;
  }
  /** the state helpers: norm, energies, S-metric populations over the eigenvectors, the gerade weight, ψ(x, y, z) */
  function state(R, c) {
    const sol = solve(R), cc = asComplex(c, n), norm = quadForm(sol.S, cc), pop = new Float64Array(n);
    let gWeight = 0;
    for (let k = 0; k < n; k++) { let sr = 0, si = 0; for (let i = 0; i < n; i++) { const w = sol.CtS[k * n + i]; sr += w * cc.re[i]; si += w * cc.im[i]; } pop[k] = (sr * sr + si * si) / norm; if (sol.parity[k] === 'g') gWeight += pop[k]; }
    const a = R / 2, oA = new Float64Array(10), oB = new Float64Array(10);
    const psiAt = (x, y, z) => {
      const rho = Math.hypot(x, y), rA = Math.hypot(rho, z + a), rB = Math.hypot(rho, z - a);
      if (ev.NP > 1) ev.setPhi(Math.atan2(y, x));
      ev.at(rA, z + a, rB, z - a, rho, cc.re, cc.im, oA, oB);
      const f = 1 / Math.sqrt(norm); return { re: (oA[0] + oB[0]) * f, im: (oA[1] + oB[1]) * f };
    };
    return { R, norm, E: quadForm(sol.H, cc) / norm, E0: quadForm(sol.H, cc) / norm + sol.Enuc, populations: pop, gWeight, parity: homonuclear ? (gWeight > 1 - 1e-9 ? 'g' : gWeight < 1e-9 ? 'u' : 'mixed') : '-', psiAt };
  }
  return { kind, basis, n, nA, Z_A, Z_B, mass, homonuclear, zetaMin, zetaMax, quad: q, dissociation, basisAt, solve, vector, groundEnergy, energyOf, propagate, equilibrium, force, state, P: P1, connection, metricRoots, transport, evolve };
}

/* ── the dynamics ────────────────────────────────────────────────────────────────────────────────────────────────── */
/**
 * createDynamics(mo, { R0, v0, dt, electron: 'bo'|'ehrenfest', nuclearForce: 'hf'|'exact', c0, Rmin, Rmax, connection }) → the stepper
 *   { step(n), t, R, v, c, force, energy: { electronic, kinetic, nuclear, total }, drift, integratedBound, pulayNow,
 *     boundNow, normDrift, sNorm, adiabaticGap (electronic − E_0), fps, steps, track: [[t, R, v, total, drift, integratedBound], …],
 *     clamped, clamps, Rmin, Rmax, connection }
 * `connection` (default true, Ehrenfest only) carries the moving-basis transport exp(−ΔR S⁻¹D) and does NOT
 * renormalise; false is the wave-42 scheme (re-read and rescale).  `sNorm` is c†S(R)c as it stands.
 * THE CLAMPS.  R is held in [Rmin, Rmax] (0.2 and 60 by default).  Below 0.2 the two-centre S is numerically singular;
 * above 60 the molecule has dissociated on every basis this file offers (E(60) − E(∞) < 1/60 is the bare nuclear term), and
 * the cost of the two-centre quadrature grows as ζR.  A step that lands outside is clamped, the velocity is kept (the
 * kinetic energy of the escape stays in the bookkeeping), and the stepper SAYS so: `clamped` is true when the last step
 * was clamped and `clamps` counts them — at dt = 500 the first step already runs to R ≈ 6600, where the old stepper threw
 * from the eigen-solver (the reviewer's finding, wave 42).
 */
export function createDynamics(mo, { R0, v0 = 0, dt = 5, electron = 'bo', nuclearForce = 'hf', c0 = null, track = true, Rmin = 0.2, Rmax = 60, connection = true } = {}) {
  const mass = mo.mass, n = mo.n;
  const transporting = electron === 'ehrenfest' && connection && !!mo.transport;
  let t = 0, R = Math.min(Rmax, Math.max(Rmin, R0)), v = v0, steps = 0, wall = 0, integratedBound = 0, normDrift = 0, clamped = false, clamps = 0;
  const sNorm = (c, S) => { let s = 0; for (let i = 0; i < n; i++) { let ar = 0, ai = 0; for (let j = 0; j < n; j++) { const w = S[i * n + j]; ar += w * c.re[j]; ai += w * c.im[j]; } s += c.re[i] * ar + c.im[i] * ai; } return s; };
  const normalise = (c, S) => { const s = sNorm(c, S), f = 1 / Math.sqrt(s); for (let i = 0; i < n; i++) { c.re[i] *= f; c.im[i] *= f; } return s; };
  let sol = mo.solve(R), c;
  if (electron === 'bo' || !c0) { c = { re: mo.vector(sol, 0), im: new Float64Array(n) }; } else { c = asComplex(c0, n); normalise(c, sol.S); }
  const drive = (f) => nuclearForce === 'exact' ? f.F_rel - f.pulay : f.F_rel;
  let f = mo.force(R, c, { differences: false }), acc = drive(f) / mass;
  const energy = () => ({ electronic: f.E, kinetic: 0.5 * mass * v * v, nuclear: mo.Z_A * mo.Z_B / R, total: f.E + 0.5 * mass * v * v + mo.Z_A * mo.Z_B / R });
  const E_total0 = energy().total, hist = [];
  const record = () => { const e = energy(); if (track) hist.push([t, R, v, e.total, e.total - E_total0, integratedBound]); };
  record();
  function step(count = 1) {
    const t0 = performance.now();
    for (let s = 0; s < count; s++) {
      const boundOld = f.bound, vOld = v;
      if (electron === 'ehrenfest' && !transporting) c = mo.propagate(R, c, dt / 2);
      const Rprev = R;
      R += v * dt + 0.5 * acc * dt * dt;
      clamped = R < Rmin || R > Rmax;
      if (clamped) { R = R < Rmin ? Rmin : Rmax; clamps++; }
      sol = mo.solve(R);
      if (electron === 'bo') { c = { re: mo.vector(sol, 0), im: new Float64Array(n) }; }
      else if (transporting) {
        /* ONE exponential of the whole generator H − iṘD (mo.evolve): no split, no renormalisation — the exact
           equation conserves c†S(R)c and the scheme conserves it to 1e-15, so the norm is REPORTED, never repaired */
        c = mo.evolve(Rprev, R, c, dt);
        normDrift += Math.abs(sNorm(c, sol.S) - 1);
      } else {
        c = mo.propagate(R, c, dt / 2);
        const nrm = normalise(c, sol.S); normDrift += Math.abs(nrm - 1);   // the wave-42 scheme: re-read and rescale
      }
      f = mo.force(R, c, { differences: false });
      const accNew = drive(f) / mass;
      v += 0.5 * (acc + accNew) * dt; acc = accNew; t += dt; steps++;
      integratedBound += 0.5 * (boundOld * Math.abs(vOld) + f.bound * Math.abs(v)) * dt;
      record();
    }
    wall += performance.now() - t0;
    return self;
  }
  const self = {
    step,
    get t() { return t; }, get R() { return R; }, get v() { return v; }, get c() { return c; }, get force() { return f; }, get sol() { return sol; },
    get energy() { return energy(); }, get drift() { return energy().total - E_total0; }, get integratedBound() { return integratedBound; },
    get pulayNow() { return f.pulay; }, get boundNow() { return f.bound; }, get normDrift() { return normDrift; },
    get adiabaticGap() { return f.E - sol.E[0]; }, get steps() { return steps; }, get wallMs() { return wall; }, get fps() { return steps ? 1000 * steps / wall : 0; },
    get track() { return hist; }, get clamped() { return clamped; }, get clamps() { return clamps; }, get sNorm() { return sNorm(c, sol.S); },
    electron, nuclearForce, dt, mass, Rmin, Rmax, connection: transporting,
  };
  return self;
}
