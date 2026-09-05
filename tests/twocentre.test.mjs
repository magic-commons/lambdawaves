/* tests/twocentre.test.mjs — the node proof of the two-centre integrals and of H₂⁺ on the Sturmians.
 *   node tests/twocentre.test.mjs
 * Oracles: the closed forms of lab/molecule.js (S, J, K, Eg, Eu); the one-centre closed forms of lab/sturmian.js for the
 * same-centre blocks; the own-atom eigen-equation (−½∇² − 1/r_A)χ_A = E_n χ_A on all 21 register functions; the mirror
 * law A ↔ B with its (−1)^{l+l'} signs; 24 × 24 quadrature as the converged reference; and the FIELDS AND MOLECULES
 * numbers (Sol Q3, Opus Q3/Q7, the numpy oracle of this wave): Eg(2) = −0.553771495318, fixed {1s,2p_z} E(2) =
 * −0.553815296857 with R_e = 2.508709526, the Sturmian −0.602624 (n ≤ 4, λ = 1.7611), the 42-function register R_e = 2.35227.
 */
import { gaussLegendre, gaussLaguerre, sto, hydrogenicFn, sturmianFn, sigmaBasis, selfOverlap, twoCentre, parityBlocks, h2plusEnergy, h2plusSturmian, equilibrium } from '../lab/twocentre.js';
import { overlapS, coulombJ, resonanceK, energies, EV } from '../lab/molecule.js';
import { sturmianOverlap, symmetricEigen, generalisedEigen } from '../lab/sturmian.js';
import { factorial, energy } from '../lab/hydrogen.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const T0 = performance.now();
const EXACT_H2P = -0.602634214;                                         // Bates–Ledsham–Stewart / Wind, σ_g at R = 2 (KNOWN)
const maxDiff = (A, B) => { let w = 0; for (let i = 0; i < A.length; i++) w = Math.max(w, Math.abs(A[i] - B[i])); return w; };

/* ── Q1 the Gauss rules ── */
{
  const GL = gaussLaguerre(9), GG = gaussLegendre(9); let wl = 0, wg = 0, sw = 0, sg = 0;
  for (let k = 0; k <= 17; k++) { let s = 0; for (let i = 0; i < 9; i++) s += GL.w[i] * Math.pow(GL.x[i], k); wl = Math.max(wl, Math.abs(s / factorial(k) - 1)); }
  for (let k = 0; k <= 17; k++) { let s = 0; for (let i = 0; i < 9; i++) s += GG.w[i] * Math.pow(GG.x[i], k); wg = Math.max(wg, Math.abs(s - (k % 2 ? 0 : 2 / (k + 1)))); }
  for (let i = 0; i < 9; i++) { sw += GL.w[i]; sg += GG.w[i]; }
  const fact = (k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
  const G24 = gaussLaguerre(24); let w24 = 0; for (let k = 0; k <= 47; k += 5) { let s = 0; for (let i = 0; i < 24; i++) s += G24.w[i] * Math.pow(G24.x[i], k); w24 = Math.max(w24, Math.abs(s / fact(k) - 1)); }
  judge('Q1 THE RULES: 9-point Gauss–Laguerre integrates x^k e^{−x} to k! for k ≤ 17 (rel 1e-13) and 9-point Gauss–Legendre integrates x^k over [−1, 1] exactly for k ≤ 17 (1e-14); weights sum to 1 and 2; the 24-point Laguerre rule holds k ≤ 47 (rel 1e-12)', wl < 1e-13 && wg < 1e-14 && Math.abs(sw - 1) < 1e-14 && Math.abs(sg - 2) < 1e-14 && w24 < 1e-12, { wl, wg, sw, sg, w24 });
}
/* ── Q2 the 1s closed forms of molecule.js ── */
{
  let dS = 0, dJ = 0, dK = 0, dT = 0, dV = 0;
  for (const R of [1, 2, 3, 4]) {
    const M = twoCentre([hydrogenicFn(1, 0, 0)], [hydrogenicFn(1, 0, 0)], R);
    dS = Math.max(dS, Math.abs(M.S[1] - overlapS(R))); dJ = Math.max(dJ, Math.abs(M.VB[0] - coulombJ(R))); dK = Math.max(dK, Math.abs(M.VA[1] - resonanceK(R)));
    dT = Math.max(dT, Math.abs(M.T[0] - 0.5)); dV = Math.max(dV, Math.abs(M.VA[0] + 1), Math.abs(M.S[0] - 1));
  }
  const M2 = twoCentre([hydrogenicFn(1, 0, 0)], [hydrogenicFn(1, 0, 0)], 2);
  judge('Q2 THE 1s INTEGRALS at R = 1, 2, 3, 4: S = ⟨a|b⟩, J = ⟨a|−1/r_B|a⟩, K = ⟨a|−1/r_A|b⟩ equal molecule.js\'s closed forms e^{−R}(1+R+R²/3), −1/R + e^{−2R}(1+1/R), −e^{−R}(1+R) to 1e-12; ⟨a|−½∇²|a⟩ = ½, ⟨a|−1/r_A|a⟩ = −1, ⟨a|a⟩ = 1 to 1e-12', dS < 1e-12 && dJ < 1e-12 && dK < 1e-12 && dT < 1e-12 && dV < 1e-12, { dS, dJ, dK, dT, dV, atR2: { S: M2.S[1], J: M2.VB[0], K: M2.VA[1] } });
  const Eg = h2plusEnergy([hydrogenicFn(1, 0, 0)], 2), full = h2plusEnergy([hydrogenicFn(1, 0, 0)], 2, { parity: false });
  const P = parityBlocks(M2), Eu = generalisedEigen(P.u.S, P.u.H).E[0] + 0.5, ex = energies(2);
  judge('Q2 Eg(2) = −0.553771 (1s LCAO, 1e-6) — and to 1e-11 against molecule.js −0.5537714953184829; the gerade block alone gives it (the full 2 × 2 agrees to 1e-12) and the ungerade block gives Eu(2) to 1e-11', Math.abs(Eg + 0.553771) < 1e-6 && Math.abs(Eg - ex.Eg) < 1e-11 && Math.abs(Eg - full) < 1e-12 && Math.abs(Eu - ex.Eu) < 1e-11, { Eg, molecule: ex.Eg, Eu, moleculeEu: ex.Eu });
}
/* ── Q3 the Laplacian on every register function, and the mirror law ── */
const REG = sigmaBasis(6, (n, l, m) => hydrogenicFn(n, l, m));
{
  const M = twoCentre(REG, REG, 2), N = M.n, nA = M.nA; let dEig = 0, dSAA = 0, mir = 0, mirJ = 0;
  for (let i = 0; i < nA; i++) for (let j = 0; j < nA; j++) {
    const own = M.T[i * N + j] + M.VA[i * N + j];                           // (−½∇² − 1/r_A) χ_A,j = E_j χ_A,j  ⇒  E_j δ_ij
    dEig = Math.max(dEig, Math.abs(own - (i === j ? energy(REG[j].n) : 0)));
    dSAA = Math.max(dSAA, Math.abs(M.S[i * N + j] - (i === j ? 1 : 0)));
    const p = ((M.basis[i].l + M.basis[j].l) % 2) ? -1 : 1;
    mir = Math.max(mir, Math.abs(M.VA[i * N + nA + j] - p * M.VB[j * N + nA + i]));      // ⟨A_i|1/r_A|B_j⟩ = (−1)^{l+l'} ⟨A_j|1/r_B|B_i⟩
    mirJ = Math.max(mirJ, Math.abs(M.VB[i * N + j] - p * M.VA[(nA + i) * N + nA + j]));  // ⟨A_i|1/r_B|A_j⟩ = (−1)^{l+l'} ⟨B_i|1/r_A|B_j⟩
  }
  judge('Q3 THE LAPLACIAN on all 21 register σ functions (l ≤ 5, radial degree ≤ 5): ⟨χ_A,i|−½∇² − 1/r_A|χ_A,j⟩ = −δ_ij/2n² to 1e-12 and the A–A overlap is the identity to 1e-12 — every singular 1/r piece cancelled against the volume element', dEig < 1e-12 && dSAA < 1e-12, { dEig, dSAA });
  judge('Q3 A ↔ B SYMMETRY of the nuclear attraction: across the 42-function register at R = 2, ⟨A_i|−1/r_A|B_j⟩ = (−1)^{l_i+l_j} ⟨A_j|−1/r_B|B_i⟩ and ⟨A_i|−1/r_B|A_j⟩ = (−1)^{l_i+l_j} ⟨B_i|−1/r_A|B_j⟩ to 1e-13 (for 1s: K by r_A equals K by r_B)', mir < 1e-13 && mirJ < 1e-13, { mir, mirJ });
}
/* ── Q4 the Sturmian one-centre blocks against sturmian.js, and the quadrature's converged digits ── */
{
  const lam = 1.7611, R = 2, B = sigmaBasis(6, (n, l, m) => sturmianFn(n, l, m, lam));
  const M = twoCentre(B, B, R), N = M.n, nA = M.nA; let dS = 0, dT = 0, dV = 0, dNorm = 0;
  for (let i = 0; i < nA; i++) for (let j = 0; j < nA; j++) {
    const same = B[i].l === B[j].l, s = same ? sturmianOverlap(B[i].n, B[j].n, B[i].l) : 0;
    dS = Math.max(dS, Math.abs(M.S[i * N + j] - s));
    dT = Math.max(dT, Math.abs(M.T[i * N + j] - ((i === j ? lam * lam : 0) - 0.5 * lam * lam * s)));
    dV = Math.max(dV, Math.abs(M.VA[i * N + j] - (i === j ? -lam / B[i].n : 0)));
  }
  for (const f of B) dNorm = Math.max(dNorm, Math.abs(selfOverlap(f) - 1));
  judge('Q4 THE TWO MODULES AGREE: the A–A block of the two-centre quadrature for 21 Sturmians (n ≤ 6, λ = 1.7611, R = 2) equals sturmian.js\'s closed forms — S tridiagonal, T = λ²I − (λ²/2)S, ⟨−1/r_A⟩ = −diag(λ/n) — to 1e-13 (same-centre pairs carry e^{−3.52η}: the adaptive η order earns these digits); the descriptors are unit-normalised by the Γ route to 1e-11 (its alternating-sum floor at n = 6; the quadrature says 1e-14)', dS < 1e-13 && dT < 1e-13 && dV < 1e-13 && dNorm < 1e-11, { dS, dT, dV, dNorm });
  const B4 = sigmaBasis(4, (n, l, m) => sturmianFn(n, l, m, lam));
  const ref = twoCentre(B4, B4, R, { nq: 24 }), ad = twoCentre(B4, B4, R), fx9 = twoCentre(B4, B4, R, { adaptEta: false }), fx8 = twoCentre(B4, B4, R, { nq: 8, adaptEta: false }), ad12 = twoCentre(B4, B4, R, { nq: 12 });
  const err = (X) => Math.max(maxDiff(X.S, ref.S), maxDiff(X.H, ref.H));
  const eAd = err(ad), e9 = err(fx9), e8 = err(fx8), e12 = err(ad12);
  let cross = 0; for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) cross = Math.max(cross, Math.abs(ad.S[i * 20 + 10 + j] - ref.S[i * 20 + 10 + j]), Math.abs(ad.H[i * 20 + 10 + j] - ref.H[i * 20 + 10 + j]));
  judge('Q4 CONVERGED DIGITS (20 Sturmians n ≤ 4, λ = 1.7611, R = 2, against 24 × 24): the default 9 Laguerre × (9 + ⌈2|β|⌉) Legendre rule holds every S and H element to 1e-13 and the cross-centre 9 × 9 elements (β = 0, polynomial degree ≤ 8, exact) to 1e-14; on THIS basis a fixed 9 × 9 is only ~1e-5 in the same-centre elements (a degree-8 polynomial under e^{−3.52η}) — which is why adaptEta is the default', eAd < 1e-13 && cross < 1e-14 && e9 < 3e-5 && e9 > 1e-7 && e8 < 1e-3, { adaptive9: eAd, adaptive12: e12, cross9x9: cross, fixed9x9: e9, fixed8x8: e8 });
  const E9 = h2plusSturmian(4, lam, R, { adaptEta: false }), E8 = h2plusSturmian(4, lam, R, { nq: 8, adaptEta: false });
  judge('Q4 THE PORT IS THE LEDGER\'S QUADRATURE TO THE DIGIT: with the fixed rules the Sturmian energy is −0.602624257457 (9 × 9) and −0.602624259476 (8 × 8), the numpy oracle\'s own 9 × 9 and 8 × 8 values, to 1e-12 (8e-11 and 2e-9 above the converged −0.602624257378)', Math.abs(E9 + 0.602624257457) < 1e-12 && Math.abs(E8 + 0.602624259476) < 1e-12, { E9, E8 });
  const sol = [hydrogenicFn(1, 0, 0), hydrogenicFn(2, 1, 0), hydrogenicFn(3, 2, 0)], table = [[6, 1.886e-5], [7, 5.707e-7], [8, 1.247e-8], [9, 2.062e-10], [10, 2.67e-12], [12, 1.16e-14]];
  const got = table.map(([nq]) => { let worst = 0; for (const RR of [1, 2, 3, 4]) { const rf = twoCentre(sol, sol, RR, { nq: 24 }), t = twoCentre(sol, sol, RR, { nq, adaptEta: false }); worst = Math.max(worst, maxDiff(rf.S, t.S), maxDiff(rf.H, t.H)); } return worst; });
  const tableOK = table.every(([nq, e], k) => nq >= 12 ? got[k] < 3e-14 : Math.abs(got[k] / e - 1) < 0.05);
  judge('Q4 SOL\'S TABLE re-judged on Sol\'s basis ({1s, 2p_z, 3d_z²} hydrogenic, R = 1…4, fixed n × n against 24 × 24): 6² 1.886e-5, 7² 5.707e-7, 8² 1.247e-8, 9² 2.062e-10, 10² 2.67e-12, 12² 1.16e-14 — each within 5 % (12² below 3e-14): 9 × 9 is his 1e-8-safe rule for that basis and bond interval', tableOK, { got: got.map((v) => +v.toExponential(3)) });
  /* m ≠ 0: a π basis — block-diagonal in m, and the same one-centre closed forms */
  const lamPi = 1, Bpi = []; for (let n = 2; n <= 4; n++) for (let l = 1; l < n; l++) for (const m of [-1, 1]) Bpi.push(sturmianFn(n, l, m, lamPi));
  const Mp = twoCentre(Bpi, Bpi, R), Np = Mp.n; let dPi = 0, offM = 0;
  for (let i = 0; i < Bpi.length; i++) for (let j = 0; j < Bpi.length; j++) {
    if (Bpi[i].m !== Bpi[j].m) { offM = Math.max(offM, Math.abs(Mp.S[i * Np + j]), Math.abs(Mp.H[i * Np + j]), Math.abs(Mp.S[i * Np + Bpi.length + j])); continue; }
    const same = Bpi[i].l === Bpi[j].l, s = same ? sturmianOverlap(Bpi[i].n, Bpi[j].n, Bpi[i].l) : 0;
    dPi = Math.max(dPi, Math.abs(Mp.S[i * Np + j] - s), Math.abs(Mp.T[i * Np + j] - ((i === j ? lamPi * lamPi : 0) - 0.5 * lamPi * lamPi * s)), Math.abs(Mp.VA[i * Np + j] - (i === j ? -lamPi / Bpi[i].n : 0)));
  }
  const Epi = generalisedEigen(parityBlocks(Mp).u.S, parityBlocks(Mp).u.H).E[0];
  judge('Q4 m ≠ 0: a π basis (m = ±1, n ≤ 4, λ = 1) is exactly block-diagonal in m (cross elements 0), its A–A block matches the closed forms to 1e-13, and its lowest π_u electronic level at R = 2 is a bound above the exact 2pπ_u E_el = −0.42877 (KNOWN, Bates–Ledsham–Stewart 1953 / Madsen–Peek 1971; total +0.0712) and within 1e-4 of it', offM === 0 && dPi < 1e-13 && Epi > -0.42878 && Epi < -0.4287, { offM, dPi, Epi_el: Epi, exact: -0.42877 });
}
/* ── Q5 H₂⁺ on the Sturmians ── */
{
  const t = performance.now(); const E4 = h2plusSturmian(4, 1.7611, 2); const ms = performance.now() - t;
  judge('Q5 THE OPUS NUMBER: h2plusSturmian(4, 1.7611, 2) = −0.602624 to 2e-6 (20 Sturmians, m = 0), equal to the numpy oracle −0.602624257378 to 1e-10, and ABOVE the exact −0.602634214 (a bound, 1e-5 short of the exact σ_g)', Math.abs(E4 + 0.602624) < 2e-6 && Math.abs(E4 + 0.602624257378) < 1e-10 && E4 > EXACT_H2P, { E4, oracle: -0.602624257378, exact: EXACT_H2P, ms: +ms.toFixed(1) });
  const ladder = [[1, 1.238698, -0.586505992015], [2, 1.579037, -0.602185020912], [3, 1.704769, -0.602579117734]];
  let worst = 0; const got = ladder.map(([n, l, e]) => { const v = h2plusSturmian(n, l, 2); worst = Math.max(worst, Math.abs(v - e)); return +v.toFixed(10); });
  judge('Q5 THE LADDER at each n_max\'s own λ*: n ≤ 1 (one STO, Finkelstein–Horowitz 1928: ζ = 1.238, −0.586504) −0.586505992, n ≤ 2 −0.602185021, n ≤ 3 −0.602579118 — the oracle to 1e-9, monotone toward the exact', worst < 1e-9 && got[0] > got[1] && got[1] > got[2] && got[2] > E4, { got, worst });
  const nearby = [1.70, 1.7611, 1.82].map((l) => h2plusSturmian(4, l, 2));
  judge('Q5 λ = 1.7611 is the minimum of E(λ) for n ≤ 4 at R = 2 (λ* = 1.761097 by the oracle): E(1.70) and E(1.82) sit above it', nearby[1] < nearby[0] && nearby[1] < nearby[2], { E: nearby });
}
/* ── Q6 the fixed register basis: Sol's corrected gate ── */
{
  const mk = [hydrogenicFn(1, 0, 0), hydrogenicFn(2, 1, 0)];
  const E2 = h2plusEnergy(mk, 2), eq = equilibrium((R) => h2plusEnergy(mk, R), 2.2, 2.8, 70);
  judge('Q6 FIXED REGISTER {1s, 2p_z} (ζ = 1, 1/2): E(2) = −0.553815296857 (Sol Q3, 1e-10); R_e = 2.508709526 (2e-6), E_min = −0.565017760006 (1e-9) — the 2p_z moves the bond OUTWARD, the dead E.3 sentence', Math.abs(E2 + 0.553815296857) < 1e-10 && Math.abs(eq.Re - 2.508709526) < 2e-6 && Math.abs(eq.E + 0.565017760006) < 1e-9, { E2, Re: eq.Re, Emin: eq.E, DeEV: (-0.5 - eq.E) * EV });
}
/* ── Q7 the 42 σ register functions: timing, conditioning, and Opus's floor ── */
{
  const times = []; let M = null;
  for (let k = 0; k < 5; k++) { const t = performance.now(); M = twoCentre(REG, REG, 2); times.push(performance.now() - t); }
  times.sort((a, b) => a - b);
  const Smin = symmetricEigen(M.S, 42).values[0];
  judge('Q7 WALL TIME: the 42 × 42 S and H of the register (n ≤ 6 σ on both centres, R = 2), median of 5 < 50 ms', times[2] < 50, { medianMs: +times[2].toFixed(1), minMs: +times[0].toFixed(1), Smin });
  const E42 = h2plusEnergy(REG, 2), t = performance.now(), eq = equilibrium((R) => h2plusEnergy(REG, R), 2.1, 2.7, 50), ms = performance.now() - t;
  judge('Q7 THE REGISTER\'S FLOOR (Opus Q3): all 42 σ register functions give E(2) = −0.5721587181 (oracle, 1e-9), R_e = 2.35227 (3e-5) and D_e = 2.125 eV (1e-3) — nowhere near the exact 1.997 / 2.793 eV: the fixed exponents, not the machinery, are the limit', Math.abs(E42 + 0.5721587181) < 1e-9 && Math.abs(eq.Re - 2.352269) < 3e-5 && Math.abs((-0.5 - eq.E) * EV - 2.1246) < 1e-3, { E42, Re: eq.Re, DeEV: (-0.5 - eq.E) * EV, ms: +ms.toFixed(0) });
}
/* ── Q8 heteronuclear bookkeeping ── */
{
  const A = [sto(1, 0, 0, 1)], B = [sto(1, 0, 0, 2)];
  const M = twoCentre(A, B, 30, { Z_A: 1, Z_B: 2 }), E = generalisedEigen(M.S, M.H).E;
  judge('Q8 HETERONUCLEAR BOOKKEEPING: HeH²⁺ at R = 30 (Z_A = 1 with a ζ = 1 1s, Z_B = 2 with a ζ = 2 1s) has the separated-atom electronic levels shifted by the other nucleus, He⁺ 1s −2 − Z_A/R = −2.033333 and H 1s −0.5 − Z_B/R = −0.566667, to 1e-6 — Z_A, Z_B, ζ and the centres are not confused', Math.abs(E[0] - (-2 - 1 / 30)) < 1e-6 && Math.abs(E[1] - (-0.5 - 2 / 30)) < 1e-6, { E: Array.from(E) });
}
/* ── Q9 the reviewer's finding (wave 42): NaN past R ≈ 450 ── */
{
  /* the prefactor e^{−α} underflowed past α = 745 while the η weight e^{−βη} overflowed past β = 709 (β = ζR for a
     same-centre pair): S and H were NaN at R ≥ 450 and the eigen-solver threw.  The weight is ONE exponential e^{−α−βη} now. */
  const st4 = sigmaBasis(4, (n, l, m) => sturmianFn(n, l, m, 1.7611)), nA = st4.length, one = [hydrogenicFn(1, 0, 0)];
  const t = performance.now(), M = twoCentre(st4, st4, 1000), ms = performance.now() - t, M2 = twoCentre(st4, st4, 2), M20 = twoCentre(st4, st4, 20);
  const block = (X, N) => { const out = new Float64Array(nA * nA); for (let i = 0; i < nA; i++) for (let j = 0; j < nA; j++) out[i * nA + j] = X[i * N + j]; return out; };
  const d = (Ma, Mb) => Math.max(maxDiff(block(Ma.S, Ma.n), block(Mb.S, Mb.n)), maxDiff(block(Ma.T, Ma.n), block(Mb.T, Mb.n)), maxDiff(block(Ma.VA, Ma.n), block(Mb.VA, Mb.n)));
  const d20 = d(M20, M2), d1000 = d(M, M2), M1 = twoCentre(one, one, 1000);
  /* the weight identity itself, over the whole finite regime of the old form: one exponential against the product */
  let wdev = 0; for (const alpha of [0.5, 3, 20, 100, 400, 700]) for (const beta of [0, 0.3 * alpha, -0.7 * alpha, alpha, -alpha]) for (const eta of [-0.999, -0.5, 0, 0.4, 0.999]) { const a = Math.exp(-alpha - beta * eta), b = Math.exp(-alpha) * Math.exp(-beta * eta); if (b > 0) wdev = Math.max(wdev, Math.abs(a - b) / b); }
  judge('Q9 FINITE AT R = 1000 (Sturmians n ≤ 4, λ = 1.7611, α = ζR = 1761): every S and H element finite (' + ms.toFixed(0) + ' ms); the weight e^{−α−βη} is the old e^{−α}e^{−βη} to 1e-13 relative wherever the old one was finite (150 (α, β, η) triples up to α = 700 — both forms carry |α|·ε of rounding in the exponent, 3e-14 measured); the A–A block — one-centre integrals, R-independent by construction — equals its R = 2 value in S, T and V_A to 1e-13 at R = 20 (two η rules, 79 and 17 points, on elements of size 1: 3e-14) and to 1e-12 at R = 1000, where r_A = a(ξ + η) with ξ − 1 and η + 1 both ~1/α = 6e-4 costs three digits to cancellation and nothing else; the 1s pair at R = 1000 gives S = I to 1e-13 and H_AA = −0.5 − 1/R to 1e-12',
    Array.from(M.S).every(isFinite) && Array.from(M.H).every(isFinite) && wdev < 1e-13 && d20 < 1e-13 && d1000 < 1e-12 && Math.abs(M1.S[0] - 1) < 1e-13 && Math.abs(M1.S[1]) < 1e-13 && Math.abs(M1.H[0] + 0.501) < 1e-12,
    { weightIdentity: wdev, d20, d1000, S1s: Array.from(M1.S), H1s_AA: M1.H[0], ms: +ms.toFixed(0) });
}
console.log('wall ' + ((performance.now() - T0) / 1000).toFixed(2) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'twocentre.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
