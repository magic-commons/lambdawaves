/* rt-y.mjs — ROUND 4 · OPUS, Q15: the y-polarised RT-RHF dipole trace, saved in full, for the exact-kernel fit. */
import { readFileSync, writeFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
import { createRTHF } from '../../../lab/density.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
const loew = (X, M) => { const A = new Float64Array(n * n), B = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const x = X[i * n + k]; if (!x) continue; for (let j = 0; j < n; j++) A[i * n + j] += x * M[k * n + j]; }
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const v = A[i * n + k]; if (!v) continue; for (let j = 0; j < n; j++) B[i * n + j] += v * X[k * n + j]; }
  return B; };
const DTOUT = 0.02, T = 600, out = { T, dtOut: DTOUT, runs: [] };
for (const [dt, kappa, integ] of [[0.005, 1e-3, 'magnus2'], [0.0025, 1e-3, 'magnus2'], [0.0025, 1e-5, 'magnus2']]) {
  const rt = createRTHF({ n, S: mol.S, h: mol.h, eri: mol.eri, Z: mol.M[1], Enuc: mol.Enuc,
    nuclearDipole: mol.nuclearDipole[1], nElectrons: 10, D0: s.D, dt, integrator: integ });
  const Mt = loew(rt.X, mol.M[1]);
  const mu = () => { const P = rt.P; let a = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) a += P.re[j * n + i] * Mt[i * n + j]; return -a; };
  rt.kick(kappa);
  const every = Math.round(DTOUT / dt), nout = Math.round(T / DTOUT) + 1, tr = new Float64Array(nout);
  tr[0] = mu(); const t0 = Date.now();
  for (let k = 1; k < nout; k++) { for (let q = 0; q < every; q++) rt.step(dt); tr[k] = mu(); }
  const o = rt.observables();
  console.log(`${integ} dt=${dt} kappa=${kappa}: ${((Date.now() - t0) / 1000).toFixed(0)} s  Tr ${o.electrons.toFixed(12)} idem ${o.idempotency.toExponential(2)}`);
  out.runs.push({ dt, kappa, integrator: integ, trace: [...tr] });
}
writeFileSync(new URL('./rt-y.json', import.meta.url), JSON.stringify(out));
console.log('wrote rt-y.json');
