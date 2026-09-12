/* mmut-par.mjs — ROUND 4 · OPUS, Q13: the parasitic amplitude of UNRESTARTED MMUT, measured by a multi-frequency
 * least-squares fit that includes all ten RPA lines (shifted by C_j Δt², from gen3.py) AND the parasitic root
 * ω_par = π/Δt − 1.393545, block by block.  A single-frequency fit cannot do this: spectral leakage from the
 * ω = 0.807 line into a 200 a.u. block at ω = 312.77 is 1.3e-7, which is the whole signal. */
import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf, solveLinear } from '../../../lab/scf.js';
import { createRTHF } from '../../../lab/density.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const CJ = JSON.parse(readFileSync(new URL('./gen3-Cj.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
const loew = (X, M) => { const A = new Float64Array(n * n), B = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const x = X[i * n + k]; if (!x) continue; for (let j = 0; j < n; j++) A[i * n + j] += x * M[k * n + j]; }
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const v = A[i * n + k]; if (!v) continue; for (let j = 0; j < n; j++) B[i * n + j] += v * X[k * n + j]; }
  return B; };
const PAROFF = 1.393545;
function fitAmps(tr, dt, freqs, i0, i1) {
  const m = 2 * freqs.length + 1, N = i1 - i0;
  const G = new Float64Array(m * m), b = new Float64Array(m), col = new Float64Array(m);
  for (let k = i0; k < i1; k++) { const t = k * dt;
    for (let f = 0; f < freqs.length; f++) { col[2 * f] = Math.cos(freqs[f] * t); col[2 * f + 1] = Math.sin(freqs[f] * t); }
    col[m - 1] = 1;
    const y = tr[k] - tr[0];
    for (let p = 0; p < m; p++) { b[p] += col[p] * y; for (let q = 0; q < m; q++) G[p * m + q] += col[p] * col[q]; } }
  for (let p = 0; p < m; p++) G[p * m + p] *= (1 + 1e-14);
  const x = solveLinear(G, b, m), out = [];
  for (let f = 0; f < freqs.length; f++) out.push(Math.hypot(x[2 * f], x[2 * f + 1]));
  return { amps: out, N };
}
for (const dt of [0.02, 0.01, 0.005]) {
  const T = 1000, N = Math.round(T / dt);
  const rt = createRTHF({ n, S: mol.S, h: mol.h, eri: mol.eri, Z: mol.M[1], Enuc: mol.Enuc,
    nuclearDipole: mol.nuclearDipole[1], nElectrons: 10, D0: s.D, dt, integrator: 'mmut', restartEvery: Infinity });
  const Mt = loew(rt.X, mol.M[1]);
  const mu = () => { const P = rt.P; let a = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) a += P.re[j * n + i] * Mt[i * n + j]; return -a; };
  rt.kick(1e-3);
  const tr = new Float64Array(N + 1); tr[0] = mu();
  const t0 = Date.now();
  for (let k = 1; k <= N; k++) { rt.step(dt); tr[k] = mu(); }
  const wpar = Math.PI / dt - PAROFF;
  const freqs = CJ.map((c) => c.w + c.pred * dt * dt).concat([wpar]);
  const blocks = 10, L = Math.floor(N / blocks), par = [], phys = [];
  for (let bl = 0; bl < blocks; bl++) { const r = fitAmps(tr, dt, freqs, bl * L, (bl + 1) * L); par.push(r.amps[10]); phys.push(r.amps[4]); }
  const o = rt.observables();
  console.log(`\nΔt=${dt}  T=${T}  ${N} steps  ${((Date.now() - t0) / 1000).toFixed(0)} s   ω_par = ${wpar.toFixed(6)}   block = ${L} steps`);
  console.log(`  Tr P = ${o.electrons.toFixed(12)}  idem ${o.idempotency.toExponential(2)}  Im Tr ${o.electronsIm.toExponential(2)}`);
  console.log(`  parasitic amplitude per block: ${par.map((x) => x.toExponential(3)).join(' ')}`);
  console.log(`  physical (ω≈0.807) amplitude : ${phys[0].toExponential(4)} → ${phys[9].toExponential(4)}`);
  console.log(`  parasitic/physical = ${(par[0] / phys[0]).toExponential(3)} → ${(par[9] / phys[9]).toExponential(3)}   growth ratio last/first = ${(par[9] / par[0]).toFixed(4)}`);
}
