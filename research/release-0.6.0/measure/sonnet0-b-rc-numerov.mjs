// (b) the RC road: cornell.js' numerov() on a finite spherical well and a Yukawa potential (a.u., mu = 1), against closed forms / a fine finite-difference oracle.
import { numerov } from '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/cornell.js';
import fs from 'node:fs';
const res = { tests: [] };
// --- finite spherical well, a = 1, V0 = 20: l=0 closed form  k cot(ka) = -kappa,  k = sqrt(2(E+V0)), kappa = sqrt(-2E)
function wellExactS(V0, a) { // bound s-levels by bisection on  f(E) = k cot(ka) + kappa  between branches
  const out = []; const f = (E) => { const k = Math.sqrt(2 * (E + V0)), kap = Math.sqrt(-2 * E); return k / Math.tan(k * a) + kap; };
  const kmax = Math.sqrt(2 * V0); const nb = Math.floor((kmax * a + Math.PI / 2) / Math.PI);
  for (let n = 1; n <= nb; n++) { // k in ((n-1/2)pi/a, n pi/a)
    let lo = ((n - 0.5) * Math.PI / a) + 1e-12, hi = Math.min(n * Math.PI / a, kmax) - 1e-12;
    const g = (k) => k / Math.tan(k * a) + Math.sqrt(kmax * kmax - k * k);
    let glo = g(lo), ghi = g(hi); for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2, gm = g(mid); if ((gm > 0) === (glo > 0)) { lo = mid; glo = gm; } else { hi = mid; ghi = gm; } }
    const k = (lo + hi) / 2; out.push(k * k / 2 - V0);
  } return out;
}
for (const [V0, a] of [[20, 1], [5, 2]]) {
  const Vw = (r) => (r < a ? -V0 : 0);
  const exact = wellExactS(V0, a); const t = { name: `finite spherical well V0=${V0} a=${a} l=0`, exact, numerov: [], N: [] };
  for (const N of [4000, 16000]) {
    const row = []; for (let lev = 1; lev <= exact.length + 1; lev++) { const s = numerov(Vw, 1, 0, lev, { rmax: 12, N, eMin: -V0 - 1, eMax: 2 }); row.push({ lev, E: s.E }); }
    t.numerov.push({ N, levels: row });
  }
  t.maxAbsErrN4000 = Math.max(...exact.map((e, i) => Math.abs(t.numerov[0].levels[i].E - e)));
  t.maxAbsErrN16000 = Math.max(...exact.map((e, i) => Math.abs(t.numerov[1].levels[i].E - e)));
  t.pastBoundLevelReturnsE = t.numerov[0].levels[exact.length].E; // a level that does not exist: does numerov say so?
  res.tests.push(t);
}
// --- Yukawa V = -exp(-lam r)/r, mu=1, l=0 ground state. Oracle: critical screening lam_c = 1.19061 (known); E(lam) from a fine FD solve in python (see sonnet0-b-yukawa-oracle.json)
const lams = [0.1, 0.5, 1.0, 1.15, 1.19, 1.2];
const yuk = []; for (const lam of lams) { const V = (r) => -Math.exp(-lam * r) / r; const s = numerov(V, 1, 0, 1, { rmax: 60, N: 12000, eMin: -1, eMax: 0.2 }); yuk.push({ lam, E1s: s.E, nodes: s.nodes }); }
res.yukawa = yuk;
// bisect lam where E(1s) -> 0^-: use numerov with eMax=0 and check whether the node count at E=0 is >= 1 (bound state exists iff nodes(0^-) >= 1 within the shooter: use E1s < -1e-6)
let lo = 0.5, hi = 2.0; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; const V = (r) => -Math.exp(-mid * r) / r; const s = numerov(V, 1, 0, 1, { rmax: 200, N: 40000, eMin: -1, eMax: -1e-9 }); if (s.E < -1e-7) lo = mid; else hi = mid; }
res.yukawaCriticalLambdaFromNumerov = (lo + hi) / 2; res.yukawaCriticalLambdaKnown = 1.19061;
// timing of a full 36-row solve (n_r 0..5 x l 0..5) for one potential, N=4000
let t0 = performance.now(); const Vy = (r) => -Math.exp(-0.5 * r) / r; let nbound = 0, rows = 0;
for (let l = 0; l <= 5; l++) for (let nr = 0; nr <= 5; nr++) { const s = numerov(Vy, 1, l, nr + 1, { rmax: 80, N: 4000, eMin: -1, eMax: 0.5 }); rows++; if (s.E < -1e-6) nbound++; }
res.timing36rowsMs = performance.now() - t0; res.yukawa05_rowsWithE_below0 = nbound; res.rows = rows;
// how many of the 36 rows have a genuine bound state for lam=0.5: compare against ' 1/n^2 hydrogenic count ' by FD in python
fs.writeFileSync(new URL('./sonnet0-b-rc-numerov.json', import.meta.url), JSON.stringify(res, null, 1));
console.log(JSON.stringify({ well: res.tests.map(t => ({ name: t.name, exact: t.exact, num: t.numerov[0].levels.map(x => +x.E.toFixed(6)), errN4000: t.maxAbsErrN4000, errN16000: t.maxAbsErrN16000, pastBound: t.pastBoundLevelReturnsE })), yukawa: res.yukawa, lamc: res.yukawaCriticalLambdaFromNumerov, ms36: res.timing36rowsMs, nbound: nbound }, null, 1));
