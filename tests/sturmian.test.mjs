/* tests/sturmian.test.mjs — the node proof of THE SCALE λ: the Coulomb Sturmians on the register and the eigen-selector.
 *   node tests/sturmian.test.mjs
 * Oracles, each a different route from the module: the register's own modeTable/orbital at λ = 1/n; Γ-function
 * integrals of the explicit radial polynomials (S, ⟨1/r⟩, and the kinetic energy by ½∫(R'R' + l(l+1)RR/r²)r²dr) against
 * the closed forms; Gauss–Laguerre quadrature of the recurrence evaluator; a Taylor-stepped propagator of i dc/dt = S⁻¹H c
 * against C e^{−iEt} CᵀS; the Hylleraas–Undheim–MacDonald bound; and the FIELDS AND MOLECULES oracle numbers (numpy).
 */
import { sturmianNorm, sturmianRadial, sturmianRecord, sturmianOverlap, sturmianMatrices, generalisedEigen, symmetricEigen, createSturmian } from '../lab/sturmian.js';
import { BASIS, modeTable, orbitalFromTable, orbital, radialNorm, ylm, laguerreCoeffs, factorial, energy } from '../lab/hydrogen.js';
import { gaussLaguerre } from '../lab/twocentre.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const T0 = performance.now();
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const maxAbs = (a) => { let w = 0; for (const v of a) w = Math.max(w, Math.abs(v)); return w; };
/* the radial polynomial of S_nl(λ): S = Σ_k p_k r^k e^{−λr}, k = l … n−1 */
function radialPoly(n, l, lambda) { const p = new Float64Array(n), lag = laguerreCoeffs(n - l - 1, 2 * l + 1), N = sturmianNorm(n, l, lambda); for (let j = 0; j < lag.length; j++) p[l + j] = N * lag[j] * Math.pow(2 * lambda, l + j); return p; }
const gammaInt = (k, lambda) => factorial(k) / Math.pow(2 * lambda, k + 1);          // ∫ r^k e^{−2λr} dr
function gammaS(pi, pj, lambda) { let s = 0; for (let a = 0; a < pi.length; a++) for (let b = 0; b < pj.length; b++) if (pi[a] && pj[b]) s += pi[a] * pj[b] * gammaInt(a + b + 2, lambda); return s; }
function gammaV(pi, pj, lambda) { let s = 0; for (let a = 0; a < pi.length; a++) for (let b = 0; b < pj.length; b++) if (pi[a] && pj[b]) s += pi[a] * pj[b] * gammaInt(a + b + 1, lambda); return s; }
function gammaT(pi, pj, l, lambda) {                                                 // ½∫(R_i'R_j' + l(l+1)R_iR_j/r²) r² dr
  const d = (p) => { const q = new Float64Array(p.length); for (let k = 0; k < p.length; k++) { q[k] -= lambda * p[k]; if (k + 1 < p.length) q[k] += (k + 1) * p[k + 1]; } return q; };
  const di = d(pi), dj = d(pj); let s = gammaS(di, dj, lambda);
  if (l) for (let a = 0; a < pi.length; a++) for (let b = 0; b < pj.length; b++) if (pi[a] && pj[b]) s += l * (l + 1) * pi[a] * pj[b] * gammaInt(a + b, lambda);
  return 0.5 * s;
}
const block = (l, m) => { const out = []; for (let n = l + 1; n <= 6; n++) out.push(BASIS[idx(n, l, m)]); return out; };

/* ── Q1 the records: at λ = 1/n the Sturmian IS the register's label; at any λ the record renders with n_rec = 1/λ ── */
{
  let worstField = 0, worstGrid = 0, worstRec = 0, which = '';
  for (const s of BASIS) {
    const R = sturmianRecord(s.n, s.l, s.m, 1 / s.n), T = modeTable(s.n, s.l, s.m);
    worstField = Math.max(worstField, Math.abs(R.n - T.n), Math.abs(R.norm - T.norm) / Math.abs(T.norm), maxAbs(R.lag.map((v, i) => v - T.lag[i])), maxAbs(R.leg.map((v, i) => v - T.leg[i])));
    for (let k = 0; k < 24; k++) {
      const r = (0.08 + 0.25 * k) * s.n * s.n * 0.5, th = 0.13 + 2.9 * ((k * 7) % 24) / 24, ph = 0.31 + 6.1 * ((k * 5) % 24) / 24;
      const x = r * Math.sin(th) * Math.cos(ph), y = r * Math.sin(th) * Math.sin(ph), z = r * Math.cos(th);
      const a = orbitalFromTable(R, x, y, z), b = orbital(s.n, s.l, s.m, x, y, z), c = orbitalFromTable(T, x, y, z);
      const dg = Math.max(Math.abs(a.re - b.re), Math.abs(a.im - b.im)), dr = Math.max(Math.abs(a.re - c.re), Math.abs(a.im - c.im));
      if (dg > worstGrid) { worstGrid = dg; which = s.label; } worstRec = Math.max(worstRec, dr);
    }
  }
  judge('Q1 λ = 1/n IS the register: for all 91 labels sturmianRecord(n,l,m,1/n) has n_rec = n, the same norm, Laguerre and Legendre tables as modeTable, and evaluates to ψ_nlm on a 24-point grid per label to 1e-12 (against the recurrence evaluator and against the hydrogen record)', worstField < 1e-14 && worstGrid < 1e-12 && worstRec < 1e-14, { worstField, worstGrid, worstRec, which });
  const lam = 1.7611; let worst = 0, worstNorm = 0;
  for (const s of BASIS) {
    const R = sturmianRecord(s.n, s.l, s.m, lam);
    for (let k = 0; k < 16; k++) {
      const r = (0.05 + 0.3 * k) * s.n / lam, th = 0.2 + 2.7 * ((k * 5) % 16) / 16, ph = 0.4 + 5.9 * ((k * 3) % 16) / 16;
      const a = orbitalFromTable(R, r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th));
      const rad = sturmianRadial(s.n, s.l, lam, r), Y = ylm(s.l, s.m, th, ph);
      worst = Math.max(worst, Math.abs(a.re - rad * Y.re), Math.abs(a.im - rad * Y.im));
    }
  }
  for (const lm of [lam, 0.37, 2]) for (let l = 0; l < 6; l++) for (let n = l + 1; n <= 6; n++) { const p = radialPoly(n, l, lm); worstNorm = Math.max(worstNorm, Math.abs(gammaS(p, p, lm) - 1)); }
  judge('Q1 RENDERABLE UNCHANGED: at λ = 1.7611 the record (n_rec = 1/λ = 0.5678, the label\'s own tables, norm × (nλ)^{3/2}) evaluated by the kernel\'s CPU twin orbitalFromTable equals S_nl(λ; r) Y_lm by the recurrence to 1e-12 for all 91; ⟨S|S⟩ = 1 by Γ-integrals for all 21 (n, l) at λ = 1.7611, 0.37, 2 to 1e-11 (the Γ route\'s alternating sums lose two digits at n = 6; the record itself is at 1e-15)', worst < 1e-12 && worstNorm < 1e-11, { worst, worstNorm, n_rec: 1 / lam, norm1s: sturmianRecord(1, 0, 0, lam).norm, hydrogen1s: modeTable(1, 0, 0).norm });
}
/* ── Q2 the closed-form matrices against Γ-function integrals and quadrature ── */
{
  const lam = 0.8, Z = 1.3; let dS = 0, dV = 0, dT = 0, dH = 0, tri = 0, offV = 0, dQ = 0, dQV = 0;
  const GL = gaussLaguerre(40);
  for (let l = 0; l < 6; l++) {
    const B = block(l, 0), M = sturmianMatrices(B, lam, { Z }), N = B.length;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const pi = radialPoly(B[i].n, l, lam), pj = radialPoly(B[j].n, l, lam);
      const s = gammaS(pi, pj, lam), v = gammaV(pi, pj, lam), t = gammaT(pi, pj, l, lam);
      dS = Math.max(dS, Math.abs(M.S[i * N + j] - s)); dV = Math.max(dV, Math.abs(M.V[i * N + j] - v)); dT = Math.max(dT, Math.abs(M.T[i * N + j] - t)); dH = Math.max(dH, Math.abs(M.H[i * N + j] - (t - Z * v)));
      if (Math.abs(B[i].n - B[j].n) >= 2) tri = Math.max(tri, Math.abs(s));
      if (i !== j) offV = Math.max(offV, Math.abs(v));
      let q = 0, qv = 0; for (let k = 0; k < 40; k++) { const r = GL.x[k] / (2 * lam), f = GL.w[k] * Math.exp(GL.x[k]) * sturmianRadial(B[i].n, l, lam, r) * sturmianRadial(B[j].n, l, lam, r) / (2 * lam); q += f * r * r; qv += f * r; }   // the product's e^{−2λr} is the Laguerre weight e^{−x}: scale it back out of the evaluator
      dQ = Math.max(dQ, Math.abs(q - M.S[i * N + j])); dQV = Math.max(dQV, Math.abs(qv - M.V[i * N + j]));
    }
  }
  judge('Q2 CLOSED FORMS: at λ = 0.8, Z = 1.3, every (l ≤ 5) block n ≤ 6 — S, ⟨1/r⟩, T and H of sturmianMatrices equal the Γ-function integrals of the explicit polynomials to 1e-11 (the Γ route\'s cancellation floor); S and ⟨1/r⟩ are also reproduced by 40-point Gauss–Laguerre quadrature of the recurrence evaluator, a route without that cancellation, to 1e-13', dS < 1e-11 && dV < 1e-11 && dT < 1e-11 && dH < 1e-11 && dQ < 1e-13 && dQV < 1e-13, { dS, dV, dT, dH, dQ, dQV });
  judge('Q2 TRIDIAGONAL and POTENTIAL-WEIGHTED ORTHOGONALITY: |⟨S_n|S_n\'⟩| < 1e-11 for |n − n\'| ≥ 2 and ⟨S_n|1/r|S_n\'⟩ = 0 for n ≠ n\' (Γ route, its cancellation floor; the quadrature route above holds both at 1e-13); the closed form ⟨S_n|S_{n+1}⟩ = −½√((n−l)(n+l+1)/(n(n+1))) gives −½ for l = 0 and −√(2/3)/2 = −0.408248 for (n, l) = (2, 1)', tri < 1e-11 && offV < 1e-11 && sturmianOverlap(1, 2, 0) === -0.5 && Math.abs(sturmianOverlap(2, 3, 1) + Math.sqrt(2 / 3) / 2) < 1e-15, { tri, offV, s12: sturmianOverlap(1, 2, 0), s23p: sturmianOverlap(2, 3, 1), s56h: sturmianOverlap(5, 6, 4) });
}
/* ── Q3 He⁺ with one 1s Sturmian at λ = 2 ── */
{
  const one = createSturmian([BASIS[0]], 2, { Z: 2 });
  judge('Q3 HELIUM ION: the single 1s Sturmian at λ = 2, Z = 2 has H = λ²/2 − Zλ = −2 and E = −2.000000 to 1e-12 (the register\'s own 1s, λ = 1, gives −1.5 and its 91 labels cannot pass −1.5585)', Math.abs(one.E[0] + 2) < 1e-12 && Math.abs(one.H[0] + 2) < 1e-15, { E: one.E[0], H: one.H[0], register1s: createSturmian([BASIS[0]], 1, { Z: 2 }).E[0] });
  const full = createSturmian(undefined, 1.7611, { Z: 2 });
  judge('Q3 the 91 labels at a common λ = 1.7611 in Z = 2 sit above −2 (variational) and within 3e-4 of it — the Opus dilation closure', full.E[0] >= -2 - 1e-12 && full.E[0] < -1.9997, { E0: full.E[0] });
}
/* ── Q4 the hydrogen limit label by label ── */
{
  let worstE = 0, worstC = 0, worstZ = 0, which = '';
  for (const s of BASIS) {
    const B = block(s.l, s.m), St = createSturmian(B, 1 / s.n), pos = B.findIndex((b) => b.n === s.n);
    let k = 0; for (let q = 1; q < St.E.length; q++) if (Math.abs(St.E[q] - energy(s.n)) < Math.abs(St.E[k] - energy(s.n))) k = q;
    const dE = Math.abs(St.E[k] - energy(s.n)); if (dE > worstE) { worstE = dE; which = s.label; }
    const sg = St.C[pos * St.rank + k] < 0 ? -1 : 1;
    for (let i = 0; i < B.length; i++) worstC = Math.max(worstC, Math.abs(sg * St.C[i * St.rank + k] - (i === pos ? 1 : 0)));
    const Z2 = createSturmian(B, 2 / s.n, { Z: 2 }); let kk = 0; for (let q = 1; q < Z2.E.length; q++) if (Math.abs(Z2.E[q] - 4 * energy(s.n)) < Math.abs(Z2.E[kk] - 4 * energy(s.n))) kk = q;
    worstZ = Math.max(worstZ, Math.abs(Z2.E[kk] - 4 * energy(s.n)));
  }
  judge('Q4 THE HYDROGEN LIMIT: for every one of the 91 labels, the block {n\' ≤ 6, l, m} at λ = 1/n has the exact eigenvalue −1/2n² (1e-10) and its S-orthonormal eigenvector is the label itself (components δ to 1e-8); at λ = 2/n with Z = 2 the eigenvalue is −2/n²', worstE < 1e-10 && worstC < 1e-8 && worstZ < 1e-10, { worstE, worstC, worstZ, which });
}
/* ── Q5 a COMMON λ = 1 on all 91 labels: the variational ladder ── */
{
  const St = createSturmian(undefined, 1);
  const exact = BASIS.map((s) => s.E).sort((a, b) => a - b);
  let minGap = Infinity, blockOK = true, worstOracle = 0;
  for (let k = 0; k < 91; k++) minGap = Math.min(minGap, St.E[k] - exact[k]);
  for (let l = 0; l < 6; l++) for (let m = -l; m <= l; m++) { const b = createSturmian(block(l, m), 1); for (let k = 0; k < b.E.length; k++) if (b.E[k] < energy(l + 1 + k) - 1e-12) blockOK = false; }
  const s0 = createSturmian(block(0, 0), 1).E, p0 = createSturmian(block(1, 0), 1).E;
  const oracleS = [-0.5, -0.12433820477169, -0.00759793379559, 0.25711900050075, 1.10789877789163, 6.2669183601749], oracleP = [-0.12467435661309, -0.02147511814231, 0.18343111458401, 0.75589158482898, 3.2068267753424];
  oracleS.forEach((v, k) => { worstOracle = Math.max(worstOracle, Math.abs(s0[k] - v)); }); oracleP.forEach((v, k) => { worstOracle = Math.max(worstOracle, Math.abs(p0[k] - v)); });
  judge('Q5 COMMON λ = 1, 91 labels: the sorted S⁻¹H eigenvalues are upper bounds on the sorted exact −1/2n² (each ≥ by ≥ 0, to 1e-12), block by (l, m) as Hylleraas–Undheim–MacDonald demands; the ground state is −0.5 to 1e-12 (1s is exact at λ = 1); the l = 0 and l = 1 ladders match the numpy oracle to 1e-10', minGap > -1e-12 && blockOK && Math.abs(St.E[0] + 0.5) < 1e-12 && worstOracle < 1e-10, { E0: St.E[0], minGap, worstOracle, s_ladder: Array.from(s0).map((v) => +v.toFixed(9)), p_ladder: Array.from(p0).map((v) => +v.toFixed(9)) });
  const g = St.eigenstate(0); let off = 0; for (let i = 1; i < 91; i++) off = Math.max(off, Math.abs(g.re[i]));
  judge('Q5 the eigen-selector at λ = 1 returns the 1s label as its ground eigenvector (no other component above 1e-12) and energyOf it is −0.5', off < 1e-12 && Math.abs(Math.abs(g.re[0]) - 1) < 1e-12 && Math.abs(St.energyOf(g) + 0.5) < 1e-12, { off, c1s: g.re[0], E: St.energyOf(g) });
}
/* ── Q6 the eigen-solver itself ── */
{
  const St = createSturmian(undefined, 1), N = 91;
  let res = 0, orth = 0;
  for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) { let hc = 0, sc = 0; for (let j = 0; j < N; j++) { hc += St.H[i * N + j] * St.C[j * N + k]; sc += St.S[i * N + j] * St.C[j * N + k]; } res = Math.max(res, Math.abs(hc - St.E[k] * sc)); }
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { let s = 0; for (let i = 0; i < N; i++) s += St.C[i * N + a] * St.CtS[b * N + i]; orth = Math.max(orth, Math.abs(s - (a === b ? 1 : 0))); }
  const can = generalisedEigen(St.S, St.H, { thresh: 1e-12 }); let dCan = 0; for (let k = 0; k < N; k++) dCan = Math.max(dCan, Math.abs(can.E[k] - St.E[k]));
  judge('Q6 GENERALISED EIGEN (Cholesky + tred2/tql2, no deps) on the 91 × 91 at λ = 1: residual ‖HC − SCE‖∞ < 1e-12, CᵀSC = I to 1e-12, and canonical orthogonalisation (thresh 1e-12) gives the same 91 eigenvalues to 1e-11', res < 1e-12 && orth < 1e-12 && can.rank === 91 && dCan < 1e-11, { res, orth, dCan, rank: can.rank });
  let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5; };
  const n = 40, A = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const v = rnd() * (i === j ? 4 : 1); A[i * n + j] = v; A[j * n + i] = v; }
  const { values, vectors } = symmetricEigen(A, n); let r2 = 0, o2 = 0, sorted = true;
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { let av = 0; for (let j = 0; j < n; j++) av += A[i * n + j] * vectors[j * n + k]; r2 = Math.max(r2, Math.abs(av - values[k] * vectors[i * n + k])); }
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { let s = 0; for (let i = 0; i < n; i++) s += vectors[i * n + a] * vectors[i * n + b]; o2 = Math.max(o2, Math.abs(s - (a === b ? 1 : 0))); }
  for (let k = 1; k < n; k++) if (values[k] < values[k - 1]) sorted = false;
  let tr = 0, sum = 0; for (let i = 0; i < n; i++) { tr += A[i * n + i]; sum += values[i]; }
  judge('Q6 SYMMETRIC EIGEN on a seeded random 40 × 40: AV = VΛ to 1e-12, VᵀV = I to 1e-12, ascending, trace preserved to 1e-12', r2 < 1e-12 && o2 < 1e-12 && sorted && Math.abs(tr - sum) < 1e-12, { r2, o2, trace: [tr, sum] });
}
/* ── Q7 the evolution ── */
{
  const cplx = (N) => ({ re: new Float64Array(N), im: new Float64Array(N) });
  const St2 = createSturmian(undefined, 0.5); const c0 = cplx(91);
  for (const [n, l, m] of [[2, 0, 0], [2, 1, 0], [2, 1, 1]]) c0.re[idx(n, l, m)] = 1 / Math.sqrt(3);
  const ct = St2.evolve(c0, 10), ph = -energy(2) * 10; let worst = 0;
  for (let i = 0; i < 91; i++) worst = Math.max(worst, Math.abs(ct.re[i] - c0.re[i] * Math.cos(ph)), Math.abs(ct.im[i] - c0.re[i] * Math.sin(ph)));
  const St3 = createSturmian(undefined, 1 / 3); const d0 = cplx(91); d0.re[idx(3, 2, 2)] = 0.6; d0.im[idx(3, 0, 0)] = 0.8;
  const dt = St3.evolve(d0, 10), ph3 = -energy(3) * 10; let worst3 = 0;
  for (let i = 0; i < 91; i++) { const er = d0.re[i] * Math.cos(ph3) - d0.im[i] * Math.sin(ph3), ei = d0.re[i] * Math.sin(ph3) + d0.im[i] * Math.cos(ph3); worst3 = Math.max(worst3, Math.abs(dt.re[i] - er), Math.abs(dt.im[i] - ei)); }
  judge('Q7 HYDROGEN-LIMIT EVOLUTION: at λ = 1/2 on all 91 labels the state (2s + 2p₀ + 2p₊₁)/√3 evolves to t = 10 with the register\'s exact phase e^{−iE₂t} (1e-9); at λ = 1/3, 0.6·3d₊₂ + 0.8i·3s with e^{−iE₃t}', worst < 1e-9 && worst3 < 1e-9, { worst, worst3 });
  /* an independent propagator: A = S⁻¹H by Gauss–Jordan, then 100 Taylor steps of Δt = 0.025 (16 terms each) */
  const St = createSturmian(undefined, 1), N = 91;
  const aug = new Float64Array(N * 2 * N); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { aug[i * 2 * N + j] = St.S[i * N + j]; aug[i * 2 * N + N + j] = St.H[i * N + j]; }
  for (let c = 0; c < N; c++) { let p = c; for (let r = c + 1; r < N; r++) if (Math.abs(aug[r * 2 * N + c]) > Math.abs(aug[p * 2 * N + c])) p = r; if (p !== c) for (let j = 0; j < 2 * N; j++) { const t = aug[c * 2 * N + j]; aug[c * 2 * N + j] = aug[p * 2 * N + j]; aug[p * 2 * N + j] = t; } const d = aug[c * 2 * N + c]; for (let j = 0; j < 2 * N; j++) aug[c * 2 * N + j] /= d; for (let r = 0; r < N; r++) if (r !== c) { const f = aug[r * 2 * N + c]; if (f) for (let j = 0; j < 2 * N; j++) aug[r * 2 * N + j] -= f * aug[c * 2 * N + j]; } }
  const A = new Float64Array(N * N); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) A[i * N + j] = aug[i * 2 * N + N + j];
  let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5; };
  const x0 = cplx(N); for (let i = 0; i < N; i++) { x0.re[i] = rnd(); x0.im[i] = rnd(); }
  const norm0 = St.norm(x0), E0 = St.energyOf(x0);
  let cur = { re: Float64Array.from(x0.re), im: Float64Array.from(x0.im) }; const Dt = 0.025, steps = 100;
  for (let s = 0; s < steps; s++) {
    const acc = { re: Float64Array.from(cur.re), im: Float64Array.from(cur.im) }; let v = { re: Float64Array.from(cur.re), im: Float64Array.from(cur.im) };
    for (let k = 1; k <= 16; k++) { const nv = cplx(N); for (let i = 0; i < N; i++) { let ar = 0, ai = 0; for (let j = 0; j < N; j++) { ar += A[i * N + j] * v.re[j]; ai += A[i * N + j] * v.im[j]; } nv.re[i] = ai * Dt / k; nv.im[i] = -ar * Dt / k; } v = nv; for (let i = 0; i < N; i++) { acc.re[i] += v.re[i]; acc.im[i] += v.im[i]; } }
    cur = acc;
  }
  const ev = St.evolve(x0, Dt * steps); let dTaylor = 0; for (let i = 0; i < N; i++) dTaylor = Math.max(dTaylor, Math.abs(ev.re[i] - cur.re[i]), Math.abs(ev.im[i] - cur.im[i]));
  judge('Q7 THE EXACT LAW exp(−iS⁻¹Ht): at λ = 1 a random complex 91-vector evolved to t = 2.5 by C e^{−iEt} CᵀS agrees with an independent Taylor-stepped propagator of i dc/dt = S⁻¹H c (S⁻¹H by Gauss–Jordan) to 1e-10', dTaylor < 1e-10, { dTaylor });
  let dNorm = 0, dE = 0; for (const t of [10, 100, 1000, 12345.6]) { const c = St.evolve(x0, t); dNorm = Math.max(dNorm, Math.abs(St.norm(c) - norm0)); dE = Math.max(dE, Math.abs(St.energyOf(c) - E0)); }
  judge('Q7 NORM ⟨c|S|c⟩ and ENERGY ⟨c|H|c⟩/⟨c|S|c⟩ are conserved under evolve at t = 10, 100, 1000, 12345.6 to 1e-12 (relative)', dNorm / norm0 < 1e-12 && dE < 1e-12, { norm0, dNorm, E0, dE });
  const pop = St.populations(x0); let sum = 0; for (const p of pop) sum += p;
  const e5 = St.eigenstate(5), p5 = St.populations(e5); let dp = 0; for (let k = 0; k < N; k++) dp = Math.max(dp, Math.abs(p5[k] - (k === 5 ? 1 : 0)));
  const pt = St.populations(St.evolve(x0, 300)); let dpt = 0; for (let k = 0; k < N; k++) dpt = Math.max(dpt, Math.abs(pt[k] - pop[k]));
  judge('Q7 POPULATIONS: the S-metric projections sum to 1 (1e-13), an eigenstate has population δ_k and energyOf = E_k (1e-12), and the populations are constants of the motion (1e-12)', Math.abs(sum - 1) < 1e-13 && dp < 1e-12 && Math.abs(St.energyOf(e5) - St.E[5]) < 1e-12 && dpt < 1e-12, { sum, dp, E5: [St.energyOf(e5), St.E[5]], dpt });
}
/* ── Q8 wall time ── */
{
  const cold = performance.now(); createSturmian(undefined, 1.2); const coldMs = performance.now() - cold;
  const times = []; for (let k = 0; k < 7; k++) { const t = performance.now(); createSturmian(undefined, 1 + 0.1 * k); times.push(performance.now() - t); }
  times.sort((a, b) => a - b); const median = times[3];
  judge('Q8 WALL TIME: the 91 × 91 build (closed form) + Cholesky + tred2/tql2 eigen-solve + projector, median of 7 warm runs < 100 ms (cold run reported)', median < 100, { medianMs: +median.toFixed(2), coldMs: +coldMs.toFixed(2), minMs: +times[0].toFixed(2) });
}
console.log('wall ' + ((performance.now() - T0) / 1000).toFixed(2) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'sturmian.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
