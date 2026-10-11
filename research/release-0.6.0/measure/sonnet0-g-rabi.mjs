// (g) price the Rabi row's oracle with the tree's own dipole matrix: <1s|z|2p0> = 128*sqrt(2)/243, then a numerical 91-label (m=0 block, 21 states) drive vs the two-level RWA formula P(t)=sin^2(Omega t/2).
import { dipoleMatrix } from '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/radiation.js';
import { BASIS } from '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/hydrogen.js';
import fs from 'node:fs';
const idx = BASIS.map((s, i) => ({ ...s, i })).filter((s) => s.m === 0);
const find = (n, l) => idx.findIndex((s) => s.n === n && s.l === l);
const i1s = find(1, 0), i2p = find(2, 1);
const mu = dipoleMatrix(BASIS.findIndex((s) => s.n === 1 && s.l === 0 && s.m === 0), BASIS.findIndex((s) => s.n === 2 && s.l === 1 && s.m === 0)).z.re;
const muExact = 128 * Math.SQRT2 / 243;
const N = idx.length;
const Z = Array.from({ length: N }, (_, a) => Float64Array.from({ length: N }, (_, b) => dipoleMatrix(idx[a].i, idx[b].i).z.re));
const E = idx.map((s) => -0.5 / (s.n * s.n));
const w0 = E[i2p] - E[i1s];
function run(E0, omega, Tmax, dt) {
  // state in interaction-free Schroedinger picture, RK4 on dc/dt = -i (E + E0 cos(wt) Z) c
  let re = new Float64Array(N), im = new Float64Array(N); re[i1s] = 1;
  const rhs = (t, r, m) => { const f = E0 * Math.cos(omega * t); const dr = new Float64Array(N), di = new Float64Array(N);
    for (let a = 0; a < N; a++) { let sr = E[a] * r[a], si = E[a] * m[a]; for (let b = 0; b < N; b++) { const z = Z[a][b]; if (z !== 0) { sr += f * z * r[b]; si += f * z * m[b]; } } dr[a] = si; di[a] = -sr; } return [dr, di]; };
  let maxDev = 0, maxDevAbs = 0, t = 0; const samples = []; const Om = E0 * mu;
  const steps = Math.round(Tmax / dt);
  for (let s = 0; s < steps; s++) {
    const [k1r, k1i] = rhs(t, re, im);
    const [k2r, k2i] = rhs(t + dt / 2, re.map((v, i) => v + dt / 2 * k1r[i]), im.map((v, i) => v + dt / 2 * k1i[i]));
    const [k3r, k3i] = rhs(t + dt / 2, re.map((v, i) => v + dt / 2 * k2r[i]), im.map((v, i) => v + dt / 2 * k2i[i]));
    const [k4r, k4i] = rhs(t + dt, re.map((v, i) => v + dt * k3r[i]), im.map((v, i) => v + dt * k3i[i]));
    for (let i = 0; i < N; i++) { re[i] += dt / 6 * (k1r[i] + 2 * k2r[i] + 2 * k3r[i] + k4r[i]); im[i] += dt / 6 * (k1i[i] + 2 * k2i[i] + 2 * k3i[i] + k4i[i]); }
    t += dt;
    if (s % 200 === 0) { const P = re[i2p] ** 2 + im[i2p] ** 2; const Prwa = Math.sin(Om * t / 2) ** 2; const dev = Math.abs(P - Prwa); if (dev > maxDevAbs) maxDevAbs = dev; samples.push([t, P, Prwa]); }
  }
  let norm = 0; for (let i = 0; i < N; i++) norm += re[i] ** 2 + im[i] ** 2;
  // find the first full flop time from samples: first t where P is max
  let best = samples.reduce((m, s) => (s[1] > m[1] ? s : m), samples[0]);
  return { E0, Omega: Om, T_Rabi_half: Math.PI / Om, maxAbsDevFromRWA: maxDevAbs, peakP2p: best[1], tPeak: best[0], tPeakRWA: Math.PI / Om, norm };
}
const out = { mu_tree: mu, mu_closed: muExact, mu_abs_diff: Math.abs(mu - muExact), w0_ideal: w0, runs: [] };
for (const E0 of [1e-4, 5e-4, 1e-3, 3e-3]) {
  const Om = E0 * mu; const Tmax = Math.PI / Om * 1.02; const dt = 0.1;
  const t0 = performance.now(); const r = run(E0, w0, Tmax, dt); r.ms = performance.now() - t0; r.peakTimeRelErr = Math.abs(r.tPeak - r.tPeakRWA) / r.tPeakRWA; out.runs.push(r);
}
fs.writeFileSync(new URL('./sonnet0-g-rabi.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
