// opus1-b-rc-generic — the RC road's generic central Hamiltonian, prototyped two ways (Opus audit; read-only on the tree).
// (A) cornell.js numerov (the plan's road, F5) with mu = 1, rmax per row and a bound flag;
// (B) atoms.js' own log-mesh tridiagonal l-channel solver (solveL + sturm/eigenvalue/invIter, NOT exported today: copied here
//     verbatim in substance so the measurement runs; the real row would export it, +1 line) — every shell of one l from ONE matrix.
import { writeFileSync } from 'node:fs';
const T = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/';
const { numerov } = await import(T + 'lab/cornell.js');
// ---- (B) the atoms.js solver, condensed (sturm / eigenvalue / invIter / mesh / solveL) -------------------------------
function sturm(d, e, n, s) { let c = 0, p = d[0] - s; if (p < 0) c++; for (let i = 1; i < n; i++) { if (p === 0) p = 1e-300; p = d[i] - s - e[i - 1] * e[i - 1] / p; if (p < 0) c++; } return c; }
function eigenvalue(d, e, n, k, lo, hi) { for (let it = 0; it < 200; it++) { const m = 0.5 * (lo + hi); if (m <= lo || m >= hi) break; if (sturm(d, e, n, m) > k) hi = m; else lo = m; if (hi - lo < 1e-14 * (1 + Math.abs(hi))) break; } return 0.5 * (lo + hi); }
function mesh(M, r0, rmax) { const n = M + 2, dx = Math.log(rmax / r0) / (n - 1), r = new Float64Array(n); for (let j = 0; j < n; j++) r[j] = r0 * Math.exp(j * dx); return { n, M, dx, r }; }
function levelsL(g, V, l, k) {  // eigenvalues only (the vectors are atoms.js' invIter, unchanged; timed separately below by a dense count)
  const { M, dx, r } = g, d = new Float64Array(M), e = new Float64Array(M - 1), c = (l + 0.5) * (l + 0.5) / 2, id = 1 / (dx * dx);
  for (let i = 0; i < M; i++) { const j = i + 1, rr = r[j] * r[j]; d[i] = id / rr + c / rr + V(r[j]); }
  for (let i = 0; i < M - 1; i++) e[i] = -0.5 * id / (r[i + 1] * r[i + 2]);
  d[0] += Math.exp(-(l + 1.5) * dx) * (-0.5 * id / (r[0] * r[1]));
  let glo = Infinity, ghi = -Infinity; for (let i = 0; i < M; i++) { const a = (i > 0 ? Math.abs(e[i - 1]) : 0) + (i < M - 1 ? Math.abs(e[i]) : 0); glo = Math.min(glo, d[i] - a); ghi = Math.max(ghi, d[i] + a); }
  const out = []; for (let q = 0; q < k; q++) out.push(eigenvalue(d, e, M, q, glo, ghi));
  return { eps: out, nBelow0: sturm(d, e, M, 0) };       // nBelow0 = the BOUND FLAG for free: the Sturm count at E = V(∞) = 0
}
const B = (V, R, M = 4000, r0 = 1e-5) => { const g = mesh(M, r0, R), rows = []; let bound = 0;
  for (let l = 0; l < 6; l++) { const s = levelsL(g, V, l, 6 - l); s.eps.forEach((E, i) => rows.push({ n: l + 1 + i, l, E, bound: i < s.nBelow0 })); bound += Math.min(6 - l, s.nBelow0); } return { rows, bound }; };
// ---- (A) cornell numerov, the 36 rows the register uses (n_r, l <= 5 — only the 21 with n <= 6 are labels) -------------
const A = (V, R, N = 4000) => { const rows = []; let bound = 0;
  for (let l = 0; l < 6; l++) for (let nr = 0; nr < 6 - l; nr++) { const s = numerov(V, 1, l, nr + 1, { rmax: R, N, eMin: -60, eMax: 60 }); const b = s.E < 0; if (b) bound++; rows.push({ n: nr + l + 1, l, E: s.E, bound: b }); } return { rows, bound }; };
const ms = (f) => { const t = performance.now(); const r = f(); return [r, +(performance.now() - t).toFixed(1)]; };
const H = (r) => -1 / r, out = {};
// 1 · hydrogen in a big box: E = -1/2n^2 (n <= 6 needs R ~ 150)
{ const [ra, ta] = ms(() => A(H, 150)), [rb, tb] = ms(() => B(H, 150));
  const err = (rs) => Math.max(...rs.rows.map((x) => Math.abs(x.E + 0.5 / x.n ** 2)));
  out.hydrogen = { A_numerov: { ms: ta, maxErr: err(ra) }, B_logmesh: { ms: tb, maxErr: err(rb) } }; }
// 2 · the confined atom: R_c where E_1s = 0, closed form j_{1,1}^2/8 (B3)
{ const Rc = 1.8352463302, e1 = (R) => levelsL(mesh(4000, 1e-6, R), H, 0, 1).eps[0];
  let lo = 1.5, hi = 2.5; const [_, t] = ms(() => { for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (e1(m) < 0) hi = m; else lo = m; } });
  out.confined = { B_logmesh: { Rc: (lo + hi) / 2, err: Math.abs((lo + hi) / 2 - Rc), E_R1: e1(1), E_R1_textbook: 2.374, bisectMs: t } }; }
// 3 · Yukawa  V = -e^{-lambda r}/r : bound rows of the 21 labels (the flag), both roads
{ out.yukawa = {}; for (const lam of [0.02, 0.05, 0.1, 0.2, 0.5]) { const V = (r) => -Math.exp(-lam * r) / r;
  const [ra, ta] = ms(() => A(V, 200)), [rb, tb] = ms(() => B(V, 200));
  out.yukawa[lam] = { A_bound: ra.bound, A_ms: ta, B_bound: rb.bound, B_ms: tb, dE1s: Math.abs(ra.rows[0].E - rb.rows[0].E) }; } }
// 4 · finite spherical well V0 = 20, a = 1 (a step): l = 0 ground vs the closed form k cot ka = -kappa
{ const V0 = 20, V = (r) => (r < 1 ? -V0 : 0); let lo = -V0 + 1e-9, hi = -1e-9; const f = (E) => { const k = Math.sqrt(2 * (E + V0)), kap = Math.sqrt(-2 * E); return k * Math.cos(k) + kap * Math.sin(k); };
  for (let E = -V0 + 1e-6; E < 0; E += 1e-3) if (f(E) * f(E + 1e-3) <= 0) { lo = E; hi = E + 1e-3; break; } for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; } const Eex = (lo + hi) / 2;
  const eB = levelsL(mesh(4000, 1e-5, 30), V, 0, 1).eps[0], eA = numerov(V, 1, 0, 1, { rmax: 30, N: 4000, eMin: -30, eMax: 30 }).E;
  out.finiteWell = { exact: Eex, A_numerov_err: Math.abs(eA - Eex), B_logmesh_err: Math.abs(eB - Eex), note: 'a step: both O(h) unless a grid point sits on r = a' }; }
// 5 · the line count of a generic Hamiltonian built on (B): the object HAMILTONIANS.cornell has (14 fields), the solve (≈ B + the
//     vector + table writer that atoms.js `atomRadialTable.put` already is), the bound flag (free), the worker op (mathworker) — counted by hand below
out.lines = { exportSolveL: 1, exportTableWriter: 3, solveAll_on_B: 18, hamiltonianObject_like_cornell: 16, boundFlagAndLabel: 3, potentialsTable_5rows: 7, workerOp: 6,
  total: 54, note: 'vs DRAFT 1 +90 (F5: 60–100 on numerov). The log-mesh road reuses atoms.js (the space-6 table writer, Richardson, the virtual flag) instead of a second numerov table builder.' };
writeFileSync(new URL('./opus1-b-rc-generic.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
