/* h2ci.js — W-H2CI: H₂ with the CORRELATION PUT BACK, in the lab's own JS and with no dependencies.
 *
 * Two electrons on two protons, done twice, so that the same 2 × 2 machine is fed by two different integral sets and
 * the answers can be compared with each other and with the tables.  Atomic units throughout; R is the proton
 * separation in bohr; every energy is TOTAL (electronic + Z_AZ_B/R), so H + H is −1.
 *
 * (A) THE WEINBAUM FUNCTION (Weinbaum 1933, KNOWN; the assembly DERIVED-HERE).  One 1s Slater orbital of exponent ζ
 *     on each proton.  Heitler–London keeps only the COVALENT spin-paired function; Weinbaum adds the IONIC one,
 *         Ψ = N[ (a(1)b(2) + b(1)a(2)) + λ(a(1)a(2) + b(1)b(2)) ],
 *     and optimises λ and ζ.  That is exactly the full CI in the minimal {a, b} basis restricted to ¹Σg⁺ — the two
 *     ¹Σg⁺ configurations are σg² and σu², and the covalent/ionic pair is the same 2-space in another frame
 *     (covalent ∝ ((1+S)/2, −(1−S)/2), ionic ∝ ((1+S)/2, +(1−S)/2) on (σg², σu²)) — so this file never writes
 *     Weinbaum's 2 × 2 down: it runs the general minimal FCI below and reports λ afterwards.
 *     THE INTEGRALS.  With w = ζR and every quantity scaling as ζ × f(w) (lengths go as 1/ζ):
 *         S  = e^{−w}(1 + w + w²/3)                                             (overlap)
 *         h_aa = ζ²/2 − ζ − (ζ/w)[1 − (1+w)e^{−2w}]                             (kinetic + both nuclei)
 *         h_ab = −(ζ²/2)S + (2 − ζ)K₁,   K₁ = ⟨a|−1/r_A|b⟩ = −ζ(1+w)e^{−w}
 *           (using (−½∇² − ζ/r_B)b = −(ζ²/2)b, so ⟨a|−½∇²|b⟩ = −(ζ²/2)S − ζK₁)
 *         (aa|bb) = ζ·J′(w),  (ab|ab) = ζ·K′(w)                                 h2.js's coulombJ2 / exchangeK2
 *         (aa|aa) = 5ζ/8                                                        (Coulomb self-repulsion of a 1s)
 *         (aa|ab) = ζ[ e^{−w}(w + 1/8 + 5/(16w)) − e^{−3w}(1/8 + 5/(16w)) ]     THE HYBRID INTEGRAL
 *     The hybrid is Slater's closed form (KNOWN: Slater, *Quantum Theory of Molecules and Solids* I; Coulson 1937);
 *     it is re-derived here only in the sense that it is CHECKED: tests/h2ci.test.mjs integrates it by prolate
 *     quadrature to 1e-10 at six separations and confirms its R → 0 limit is exactly (aa|aa) = 5/8, which fixes the
 *     constants.  STATUS: EXACT integrals, VARIATIONAL energy (an upper bound).  E(1.40, ζ = 1.193) = −1.14772,
 *     D_e = 4.02 eV against the exact 4.75 — the ionic term is worth 1.2 eV over Heitler–London's 3.16.
 *
 * (B) STO-3G RHF AND FCI (the Gaussian side).  The same two electrons in the standard STO-3G contraction of a
 *     hydrogen 1s (three primitives, ζ = 1.24 scaled: α = 3.42525091, 0.62391373, 0.16885540 with d = 0.15432897,
 *     0.53532814, 0.44463454 — KNOWN, Hehre–Stewart–Pople 1969).  All the integrals are s-type Gaussians, so each
 *     is one closed form in the Boys function F₀(t) = ∫₀¹e^{−tu²}du:
 *         S = (π/γ)^{3/2}e^{−μR²_AB},  T = μ(3 − 2μR²_AB)S,  V_C = −(2π/γ)e^{−μR²_AB}F₀(γR²_PC),
 *         (ab|cd) = 2π^{5/2}/(γ₁γ₂√(γ₁+γ₂)) · e^{−μ₁R²_AB−μ₂R²_CD} · F₀(γ₁γ₂/(γ₁+γ₂) R²_PQ)
 *     with γ = α+β, μ = αβ/γ, P the Gaussian product centre (Boys 1950; the product theorem).  F₀ is summed as
 *     e^{−t}Σ_i(2t)^i/(2i+1)!! — ALL TERMS POSITIVE, so there is no cancellation anywhere — and switched to the
 *     ½√(π/t) tail past t = 30, where the neglected erfc is below 1e-14.  RHF is a real Roothaan SCF (it converges
 *     in two iterations because symmetry fixes the occupied orbital to σg in a homonuclear minimal basis, and the
 *     test judges that it lands there); FCI is the same 4-determinant Ms = 0 diagonalisation as (A).
 *     STATUS: EXACT integrals (judged against PySCF 2.14.0's own numbers at 0.74 Å and 3.00 Å to 1e-8), NUMERICAL
 *     SCF, VARIATIONAL energies.  KNOWN benchmarks re-judged: RHF −1.116714, FCI −1.137276 at R = 1.4 (Szabo &
 *     Ostlund, Table 4.4/Ch. 4); at R = 8 the RHF energy sits 0.32 hartree ABOVE FCI while FCI → 2E(H, STO-3G) =
 *     −0.933164 — the restricted determinant cannot dissociate, and the correlated one does.  That failure is the
 *     whole reason this file exists.
 *
 * (C) THE 4-DETERMINANT FCI.  Two spatial orbitals, two electrons, M_s = 0: |1α1β⟩, |1α2β⟩, |2α1β⟩, |2α2β⟩ (the
 *     other two of the six determinants are M_s = ±1 and cannot be the singlet ground state).  With i the α orbital
 *     and j the β orbital, ⟨ij|H|kl⟩ = δ_jl h_ik + δ_ik h_jl + (ik|jl) — no exchange between opposite spins — and
 *     the lowest eigenvalue is the exact energy IN THAT BASIS.  The M_s = 0 triplet is one of the four eigenvalues,
 *     which the test uses as an exact cross-check against h2.js's own Heitler–London triplet at ζ = 1.
 */
import { coulombJ2, exchangeK2, EV } from './h2.js';
import { overlapS } from './molecule.js';
import { eigSymQL } from './linalg.js';

export const HARTREE_EV = EV;
/** the STO-3G hydrogen 1s: three primitives, the ζ = 1.24 scaled exponents (KNOWN, Hehre–Stewart–Pople 1969) */
export const STO3G_H = { alpha: [3.42525091, 0.62391373, 0.16885540], coef: [0.15432897, 0.53532814, 0.44463454] };

/* ── the Boys function ─────────────────────────────────────────────────────────────────────────────────────────── */
/**
 * F₀(t) = ∫₀¹ e^{−tu²} du = √(π/4t)·erf(√t).  Summed as e^{−t} Σ_i (2t)^i/(2i+1)!!, every term positive, so the
 * sum is exact to the last bit at any t it is used for; past t = 30 the closed tail ½√(π/t) is right to 1e-14.
 */
export function boys0(t) {
  if (t < 1e-12) return 1 - t / 3;
  if (t > 30) return 0.5 * Math.sqrt(Math.PI / t);
  let term = 1, sum = 1;
  for (let i = 1; i < 200; i++) { term *= 2 * t / (2 * i + 1); sum += term; if (term < 1e-18 * sum) break; }
  return Math.exp(-t) * sum;
}

/* ── the exact 1s-STO integral set at exponent ζ and separation R ──────────────────────────────────────────────── */
/** the hybrid two-electron integral (aa|ab) over normalised 1s STOs — Slater's closed form, ζ-scaled */
export function hybridAAAB(zeta, R) {
  const w = zeta * R;
  return zeta * (Math.exp(-w) * (w + 1 / 8 + 5 / (16 * w)) - Math.exp(-3 * w) * (1 / 8 + 5 / (16 * w)));
}
/** the one-centre Coulomb repulsion (aa|aa) = 5ζ/8 */
export const coulombAAAA = (zeta) => 5 * zeta / 8;
/**
 * stoIntegrals(zeta, R) → { S, h, eri, Enuc } — everything a two-electron minimal-basis calculation needs, exactly.
 * h is the 2 × 2 core Hamiltonian in the {a, b} atomic basis; eri carries the four distinct two-electron integrals.
 */
export function stoIntegrals(zeta, R) {
  const w = zeta * R, S = overlapS(w);
  const K1 = -zeta * Math.exp(-w) * (1 + w);                                  // ⟨a|−1/r_A|b⟩ = ⟨a|−1/r_B|b⟩
  const hAA = zeta * zeta / 2 - zeta - (zeta / w) * (1 - (1 + w) * Math.exp(-2 * w));
  const hAB = -(zeta * zeta / 2) * S + (2 - zeta) * K1;
  return { S, h: [hAA, hAB, hAB, hAA],
    eri: { aaaa: coulombAAAA(zeta), aabb: zeta * coulombJ2(w), abab: zeta * exchangeK2(w), aaab: hybridAAAB(zeta, R) },
    Enuc: 1 / R };
}

/* ── the STO-3G Gaussian integral set ──────────────────────────────────────────────────────────────────────────── */
/** the same four quantities from the contracted s Gaussians, for two hydrogens on the z axis at ∓R/2 */
export function sto3gIntegrals(R, { Z = 1 } = {}) {
  const { alpha: al, coef: co } = STO3G_H, NP = al.length;
  const d = co.map((c, i) => c * Math.pow(2 * al[i] / Math.PI, 0.75));        // the normalised contraction
  const z = [-R / 2, R / 2];                                                   // the two centres, on z
  const S = [0, 0, 0, 0], h = [0, 0, 0, 0];
  for (let A = 0; A < 2; A++) for (let B = 0; B < 2; B++) {
    const RAB2 = (z[A] - z[B]) ** 2; let s = 0, t = 0, v = 0;
    for (let p = 0; p < NP; p++) for (let q = 0; q < NP; q++) {
      const a = al[p], b = al[q], g = a + b, mu = a * b / g, c = d[p] * d[q];
      const K = Math.pow(Math.PI / g, 1.5) * Math.exp(-mu * RAB2);
      s += c * K; t += c * K * mu * (3 - 2 * mu * RAB2);
      const P = (a * z[A] + b * z[B]) / g;
      for (const zc of z) v += -Z * c * (2 * Math.PI / g) * Math.exp(-mu * RAB2) * boys0(g * (P - zc) ** 2);
    }
    S[A * 2 + B] = s; h[A * 2 + B] = t + v;
  }
  const eriOf = (A, B, C, D) => {
    const RAB2 = (z[A] - z[B]) ** 2, RCD2 = (z[C] - z[D]) ** 2; let tot = 0;
    for (let p = 0; p < NP; p++) for (let q = 0; q < NP; q++) for (let r = 0; r < NP; r++) for (let s2 = 0; s2 < NP; s2++) {
      const a = al[p], b = al[q], cc = al[r], dd = al[s2], g1 = a + b, g2 = cc + dd;
      const P = (a * z[A] + b * z[B]) / g1, Q = (cc * z[C] + dd * z[D]) / g2;
      const pref = 2 * Math.pow(Math.PI, 2.5) / (g1 * g2 * Math.sqrt(g1 + g2))
        * Math.exp(-(a * b / g1) * RAB2 - (cc * dd / g2) * RCD2);
      tot += d[p] * d[q] * d[r] * d[s2] * pref * boys0((g1 * g2 / (g1 + g2)) * (P - Q) ** 2);
    }
    return tot;
  };
  /* the contraction is normalised to 1e-8, not to the last bit (the published coefficients are 8 figures), so the
     overlap is divided out — S_aa = 0.99999999 otherwise, and every energy would carry that as a systematic shift */
  const n0 = S[0];
  return { S: S[1] / n0, h: h.map((v) => v / n0), Snorm: n0,
    eri: { aaaa: eriOf(0, 0, 0, 0) / (n0 * n0), aabb: eriOf(0, 0, 1, 1) / (n0 * n0), abab: eriOf(0, 1, 0, 1) / (n0 * n0), aaab: eriOf(0, 0, 0, 1) / (n0 * n0) },
    Enuc: Z * Z / R };
}

/* ── the two-orbital, two-electron machine ─────────────────────────────────────────────────────────────────────── */
/* THE LAB'S ONE REAL-SYMMETRIC EIGENSOLVER, and it is now two of them behind one contract (2026-09-18).  Jacobi
   sweeps, and the sweep count is what makes it lose at size: MEASURED warm on this machine (the bench is
   research/molecular-waves-2026-09-18/scratch/bench-eig.mjs, numbers in µs at the small sizes),
       Fock-like n = 4 · 7 · 8 · 16 · 72 · 315   jacobi/QL  1.03 · 1.00 · 1.04 · 1.35 · 2.53 · 3.09
       dense     n = 4 · 7 · 8 · 16 · 72 · 315   jacobi/QL  1.15 · 1.58 · 1.76 · 2.46 · 4.97 · 7.62
   so below n = 8 there is nothing to buy — the two are within 15 % on the diagonally dominant matrices the SCF
   actually diagonalises — and above it the gap only opens.  QL_MIN = 8 therefore leaves every H₂ (2 × 2, 4 × 4)
   and every H₂O AO block (7 × 7) on the Jacobi road with its measured sweep behaviour, and hands benzene's 36 × 36
   Fock, its 72 × 72 realified Hermitian step and the 315 × 315 pair space to Householder–QL.
   THE EIGENVECTORS INSIDE A DEGENERATE CLUSTER ARE NOT THE SAME between the two: each returns an orthonormal basis
   of the eigenspace, and which one is arbitrary.  Everything that reads a single vector of a degenerate pair (the
   ORBITALS register's saved indices, lab/density.js's cluster Gram–Schmidt, one root of a degenerate RPA pair)
   must be invariant under that rotation or say which basis it means. */
const QL_MIN = 8;
/** eigenvalues + vectors of a real symmetric matrix (row-major); values ascending, eigenvector k in column k */
export function eigSym(A, n) {
  return n >= QL_MIN ? eigSymQL(A, n) : eigSymJacobi(A, n);
}
/** the cyclic Jacobi road, kept for small n and as the reference the 2026-09-18 sweep test compares against */
export function eigSymJacobi(A, n) {
  const a = Array.from(A), v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;
  /* The stop is scale-free: an absolute 1e-34 is never reached by a matrix of norm ~30 (rounding leaves off ~ ε²‖A‖²),
     so H₂O's Fock spent 96 sweeps per step instead of 12 — an 11× tax measured in MATH-H2O ROUND 2 · OPUS; a first
     constant of 1e-34·max(1, ‖A‖²) was still under the floor (ROUND 4: 93 sweeps, 185/200 caps). 1e-30‖A‖_F² gives a
     mean of 11.6 sweeps, no caps, and eigenvalues unchanged to 3.3e-13. */
  let frob2 = 0; for (let k = 0; k < n * n; k++) frob2 += a[k] * a[k];
  const stop = 1e-30 * Math.max(1e-300, frob2);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] ** 2;
    if (off < stop) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q]; if (Math.abs(apq) < 1e-300) continue;
      const th = (a[q * n + q] - a[p * n + p]) / (2 * apq);
      const t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const x = a[k * n + p], y = a[k * n + q]; a[k * n + p] = c * x - s * y; a[k * n + q] = s * x + c * y; }
      for (let k = 0; k < n; k++) { const x = a[p * n + k], y = a[q * n + k]; a[p * n + k] = c * x - s * y; a[q * n + k] = s * x + c * y; }
      for (let k = 0; k < n; k++) { const x = v[k * n + p], y = v[k * n + q]; v[k * n + p] = c * x - s * y; v[k * n + q] = s * x + c * y; }
    }
  }
  const idx = [...Array(n).keys()].sort((i, j) => a[i * n + i] - a[j * n + j]);
  const values = idx.map((k) => a[k * n + k]), vectors = new Float64Array(n * n);
  idx.forEach((k, col) => { for (let i = 0; i < n; i++) vectors[i * n + col] = v[i * n + k]; });
  return { values, vectors };
}
/** the full AO two-electron tensor from the four distinct integrals of a homonuclear two-function basis */
export function eriTensor({ aaaa, aabb, abab, aaab }) {
  const g = new Float64Array(16), put = (i, j, k, l, val) => {
    for (const [p, q, r, s] of [[i, j, k, l], [j, i, k, l], [i, j, l, k], [j, i, l, k], [k, l, i, j], [l, k, i, j], [k, l, j, i], [l, k, j, i]]) g[((p * 2 + q) * 2 + r) * 2 + s] = val;
  };
  put(0, 0, 0, 0, aaaa); put(1, 1, 1, 1, aaaa); put(0, 0, 1, 1, aabb); put(0, 1, 0, 1, abab);
  put(0, 0, 0, 1, aaab); put(1, 1, 0, 1, aaab);
  return g;
}
/**
 * minimalH2({ S, h, eri, Enuc }) → { rhf, fci, triplet, levels, lambda, ciVector, C, gMO }
 * The symmetric orbitals σg = (a+b)/√(2(1+S)), σu = (a−b)/√(2(1−S)) are the RHF orbitals of a homonuclear minimal
 * basis by symmetry alone; the SCF below is run anyway and `scfIterations` says how many cycles it took to land
 * there, because "RHF" that never iterates is not RHF.  λ is Weinbaum's ionic mixing, read off the CI vector.
 */
export function minimalH2({ S, h, eri, Enuc }) {
  const g = eriTensor(eri), G = (i, j, k, l) => g[((i * 2 + j) * 2 + k) * 2 + l];
  const ng = 1 / Math.sqrt(2 * (1 + S)), nu = 1 / Math.sqrt(2 * (1 - S));
  const C = [ng, nu, ng, -nu];                                                 // C[ao*2 + mo]
  /* ── the Roothaan SCF in the symmetrically orthogonalised basis X = S^{−1/2} (2 × 2, closed form) ── */
  const lam = [1 + S, 1 - S], u = [Math.SQRT1_2, Math.SQRT1_2, Math.SQRT1_2, -Math.SQRT1_2];   // S = U diag(1±S) Uᵀ
  const X = [0, 0, 0, 0];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { let s = 0; for (let k = 0; k < 2; k++) s += u[i * 2 + k] * u[j * 2 + k] / Math.sqrt(lam[k]); X[i * 2 + j] = s; }
  /* TWO THINGS THE PLAIN ITERATION GETS WRONG HERE, BOTH ABOUT SYMMETRY, AND BOTH MEASURED.
     (i) THE GUESS.  Starting from a density localised on one nucleus (C = (1, 0)) makes the very first Fock matrix
     asymmetric and the SCF then lands on an ionic solution 0.32 hartree ABOVE σg at R = 5.7.  The CORE GUESS
     (P = 0, so F = h) is symmetric, and every iterate after it is.
     (ii) THE FIXED POINT IS UNSTABLE AT LARGE R.  Even from the core guess, the a↔b asymmetry of F grows by a
     measured factor 2.13 PER CYCLE at R = 5.67 — starting from the 1e-14 of the eigen-solver's round-off it is
     O(1) after forty cycles and the run walks off σg onto the ionic solution.  Undamped SCF is not a descent
     method and simple damping cannot fix a real multiplier above 1.  So F is PROJECTED onto the a↔b symmetric
     subspace each cycle.  That is not a constraint that changes the answer: this file's integral set is
     homonuclear BY CONSTRUCTION ((aa|aa) = (bb|bb), one (aa|ab) for both centres), so the exact F is symmetric and
     the projection removes round-off and nothing else — the test judges the converged energy against the closed
     form 2h_gg + (gg|gg) + Z_AZ_B/R at four separations, including the two where the unprojected loop diverges. */
  const fockFrom = (P) => { const F = [0, 0, 0, 0];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { let f = h[i * 2 + j];
      for (let k = 0; k < 2; k++) for (let l = 0; l < 2; l++) f += P[k * 2 + l] * (G(i, j, k, l) - 0.5 * G(i, l, k, j));
      F[i * 2 + j] = f; } return F; };
  const energyOf = (P, F) => { let E = Enuc; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) E += 0.5 * P[i * 2 + j] * (h[i * 2 + j] + F[i * 2 + j]); return E; };
  let P = [0, 0, 0, 0], Cocc = [0, 0], scfIterations = 0, converged = false;
  for (let it = 0; it < 80; it++) {
    const F = fockFrom(P), Fp = [0, 0, 0, 0];
    { const dg = 0.5 * (F[0] + F[3]), od = 0.5 * (F[1] + F[2]); F[0] = F[3] = dg; F[1] = F[2] = od; }   // the a↔b projection
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { let s = 0; for (let k = 0; k < 2; k++) for (let l = 0; l < 2; l++) s += X[k * 2 + i] * F[k * 2 + l] * X[l * 2 + j]; Fp[i * 2 + j] = s; }
    const e = eigSym(Fp, 2), cp = [e.vectors[0], e.vectors[2]];
    let cNew = [X[0] * cp[0] + X[1] * cp[1], X[2] * cp[0] + X[3] * cp[1]];
    if (cNew[0] + cNew[1] < 0) cNew = [-cNew[0], -cNew[1]];                     // a fixed phase, so the Δ test means something
    const Pnew = [2 * cNew[0] * cNew[0], 2 * cNew[0] * cNew[1], 2 * cNew[1] * cNew[0], 2 * cNew[1] * cNew[1]];
    const moved = Math.max(...Pnew.map((v, i) => Math.abs(v - P[i])));
    P = Pnew; Cocc = cNew; scfIterations = it + 1;
    if (it > 0 && moved < 1e-13) { converged = true; break; }
  }
  const Erhf = energyOf(P, fockFrom(P));
  /* ── the MO integrals and the 4-determinant M_s = 0 FCI ── */
  const hM = [0, 0, 0, 0];
  for (let p = 0; p < 2; p++) for (let q = 0; q < 2; q++) { let s = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s += C[i * 2 + p] * h[i * 2 + j] * C[j * 2 + q]; hM[p * 2 + q] = s; }
  const gM = new Float64Array(16);
  for (let p = 0; p < 2; p++) for (let q = 0; q < 2; q++) for (let r = 0; r < 2; r++) for (let s2 = 0; s2 < 2; s2++) {
    let acc = 0;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) for (let l = 0; l < 2; l++)
      acc += C[i * 2 + p] * C[j * 2 + q] * C[k * 2 + r] * C[l * 2 + s2] * G(i, j, k, l);
    gM[((p * 2 + q) * 2 + r) * 2 + s2] = acc;
  }
  const GM = (i, j, k, l) => gM[((i * 2 + j) * 2 + k) * 2 + l];
  const det = [[0, 0], [0, 1], [1, 0], [1, 1]], Hci = new Float64Array(16);
  for (let m = 0; m < 4; m++) for (let n = 0; n < 4; n++) {
    const [i, j] = det[m], [k, l] = det[n];
    let v = GM(i, k, j, l);
    if (j === l) v += hM[i * 2 + k];
    if (i === k) v += hM[j * 2 + l];
    Hci[m * 4 + n] = v;
  }
  const ci = eigSym(Hci, 4), levels = ci.values.map((v) => v + Enuc);
  const v0 = [ci.vectors[0], ci.vectors[4], ci.vectors[8], ci.vectors[12]];     // the ground CI vector on (gg, gu, ug, uu)
  /* Weinbaum's λ: the ground state on (σg², σu²) is (c₀, c₃); covalent ∝ ((1+S)/2, −(1−S)/2), ionic ∝ ((1+S)/2, +(1−S)/2) */
  const cg = v0[0], cu = v0[3], p = (1 + S) / 2, q = (1 - S) / 2;
  const cov = (cg / p + (-cu) / q) / 2, ion = (cg / p - (-cu) / q) / 2;
  /* THE M_s = 0 TRIPLET IS KNOWN A PRIORI, so it is not searched for among the eigenvalues (at large R it becomes
     degenerate with the ¹Σu state and no pattern match survives that).  (|1α2β⟩ − |2α1β⟩)/√2 is an exact eigenvector
     of Hci by spin symmetry alone, so its Rayleigh quotient IS the triplet energy; `tripletResidual` reports
     ‖(H − E)t‖, which the test judges to be zero — that is the check that the CI matrix has the spin symmetry it
     should, and at ζ = 1 the number agrees with h2.js's own Heitler–London triplet to 1e-15. */
  const tv = [0, Math.SQRT1_2, -Math.SQRT1_2, 0];
  let triplet = 0, tripletResidual = 0;
  for (let m = 0; m < 4; m++) for (let n = 0; n < 4; n++) triplet += tv[m] * Hci[m * 4 + n] * tv[n];
  for (let m = 0; m < 4; m++) { let r = 0; for (let n = 0; n < 4; n++) r += Hci[m * 4 + n] * tv[n]; tripletResidual = Math.max(tripletResidual, Math.abs(r - triplet * tv[m])); }
  triplet += Enuc;
  return { rhf: Erhf, fci: levels[0], levels, triplet, tripletResidual, lambda: cov === 0 ? Infinity : ion / cov,
    scfIterations, scfConverged: converged, Cocc, S, hMO: hM, gMO: gM, ciVector: v0 };
}

/* ── the two curves ────────────────────────────────────────────────────────────────────────────────────────────── */
/** the Weinbaum energy at a fixed ζ (total, hartree) */
export const weinbaum = (R, zeta) => minimalH2(stoIntegrals(zeta, R));
/** ζ optimised by golden section on [lo, hi]; returns the whole minimalH2 record with `zeta` attached */
export function weinbaumOptimal(R, { lo = 0.9, hi = 1.6, iters = 46 } = {}) {
  const zeta = golden((zt) => weinbaum(R, zt).fci, lo, hi, iters);
  return { ...weinbaum(R, zeta), zeta };
}
/** golden section that keeps its two function values — one evaluation per iteration, 0.618^n of the bracket */
function golden(f, lo, hi, iters) {
  const gr = (Math.sqrt(5) - 1) / 2;
  let a = lo, b = hi, c = b - gr * (b - a), d = a + gr * (b - a), fc = f(c), fd = f(d);
  for (let i = 0; i < iters; i++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = f(c); }
    else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = f(d); }
  }
  return (a + b) / 2;
}
/** STO-3G RHF and FCI at R */
export const sto3gH2 = (R) => minimalH2(sto3gIntegrals(R));

/** The serialisable correlated-curve table used by the H₂ card and its background worker. */
export function h2CurveTable(Rmin = 0.6, Rmax = 10, count = 221) {
  const n = Math.max(2, count | 0), rhf = new Float64Array(n), fci = new Float64Array(n), R = new Float64Array(n);
  for (let i = 0; i < n; i++) { const r = Rmin + (Rmax - Rmin) * i / (n - 1), s = sto3gH2(r); R[i] = r; rhf[i] = s.rhf; fci[i] = s.fci; }
  return { Rmin, Rmax, R, rhf, fci, limit: 2 * sto3gHydrogen().E };
}
/** E(H, STO-3G): the one-electron atom in the same contraction — the dissociation limit FCI must reach */
export function sto3gHydrogen() {
  const { alpha: al, coef: co } = STO3G_H, d = co.map((c, i) => c * Math.pow(2 * al[i] / Math.PI, 0.75));
  let S = 0, T = 0, V = 0;
  for (let p = 0; p < al.length; p++) for (let q = 0; q < al.length; q++) {
    const a = al[p], b = al[q], g = a + b, c = d[p] * d[q], K = Math.pow(Math.PI / g, 1.5);
    S += c * K; T += c * K * (a * b / g) * 3; V += -c * (2 * Math.PI / g);
  }
  return { E: (T + V) / S, S };
}
/**
 * h2Curves(kind, R) → the total energy in hartree at separation R (a number, or a Float64Array if R is an array).
 *   'weinbaum'  correlated 1s-STO CI with ζ re-optimised at every R   (the correlated minimal-STO curve)
 *   'weinbaum-fixed'  the same at ζ = 1.193, Weinbaum's own value at R_e
 *   'hl'        Heitler–London singlet, ζ = 1 (h2.js — the covalent-only bound, for the comparison)
 *   'rhf'       STO-3G restricted Hartree–Fock       'fci'  STO-3G full CI       'triplet'  STO-3G M_s = 0 triplet
 */
export function h2Curves(kind, R) {
  if (Array.isArray(R) || ArrayBuffer.isView(R)) return Float64Array.from(R, (r) => h2Curves(kind, r));
  switch (kind) {
    case 'weinbaum': return weinbaumOptimal(R).fci;
    case 'weinbaum-fixed': return weinbaum(R, 1.193).fci;
    case 'hl': return minimalH2(stoIntegrals(1, R)).fci;
    case 'rhf': return sto3gH2(R).rhf;
    case 'fci': return sto3gH2(R).fci;
    case 'triplet': return sto3gH2(R).triplet;
    default: throw new Error('h2ci: unknown curve ' + kind);
  }
}
/** the dissociation energy of a curve against H + H = 2E(H) on the same footing */
export function dissociation(kind, { lo = 0.9, hi = 3.0, iters = 46 } = {}) {
  const Re = golden((r) => h2Curves(kind, r), lo, hi, iters), Emin = h2Curves(kind, Re);
  const limit = (kind === 'rhf' || kind === 'fci' || kind === 'triplet') ? 2 * sto3gHydrogen().E : -1;
  return { Re, E: Emin, De: limit - Emin, De_eV: (limit - Emin) * EV, limit };
}
