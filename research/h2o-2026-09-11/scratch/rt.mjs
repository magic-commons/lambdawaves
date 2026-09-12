/* rt.mjs — Sol's question 4 with the EXISTING lab modules, nothing under lab/ touched.
 * md.mjs integrals → lab/scf.js rhf() → lab/density.js createRTHF() → lab/absorb.js spectrum/peaks.
 * δ-kick κ = 1e-3 along x, y, z separately; Magnus-2 at Δt = 0.02, 0.01, 0.005 and MMUT at 0.01, 0.005, 0.0025.
 * Usage: node rt.mjs --T=600 --out=rt-ladder.json [--runs=ladder|long] */
import { readFileSync, writeFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
import { createRTHF } from '../../../lab/density.js';
import { spectrum, peaks } from '../../../lab/absorb.js';
const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const T = Number(arg('T', 600)), OUT = arg('out', 'rt-ladder.json'), WHICH = arg('runs', 'ladder');
const KAPPA = 1e-3, DTOUT = 0.02, TAU = T / 12;                              // e^{−T/τ} = e^{−12} = 6.1e-6 ≤ 1e-5
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const oracle = JSON.parse(readFileSync(new URL('../oracle-h2o.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const scfres = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
const dE = scfres.energy - oracle.rhf.energy;
console.log(`RHF E = ${scfres.energy.toFixed(12)} vs PySCF ${oracle.rhf.energy.toFixed(12)} |Δ| = ${Math.abs(dE).toExponential(3)} (assert < 1e-9: ${Math.abs(dE) < 1e-9})`);
if (!(Math.abs(dE) < 1e-9)) throw new Error('rt: RHF does not match the oracle');
function loewdinOp(X, M) {                                                    // X M X, so μ_q = −Tr(P·M̃_q) with no per-sample transform
  const A = new Float64Array(n * n), B = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const x = X[i * n + k]; if (!x) continue; for (let j = 0; j < n; j++) A[i * n + j] += x * M[k * n + j]; }
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const v = A[i * n + k]; if (!v) continue; for (let j = 0; j < n; j++) B[i * n + j] += v * X[k * n + j]; }
  return B;
}
function run({ q, dt, integrator }) {
  const rt = createRTHF({ n, S: mol.S, h: mol.h, eri: mol.eri, Z: mol.M[q], Enuc: mol.Enuc,
    nuclearDipole: mol.nuclearDipole[q], nElectrons: 10, D0: scfres.D, dt, integrator });
  const Mt = loewdinOp(rt.X, mol.M[q]), every = Math.round(DTOUT / dt);
  if (Math.abs(every * dt - DTOUT) > 1e-14) throw new Error('rt: Δt must divide ' + DTOUT);
  const nout = Math.round(T / DTOUT) + 1, trace = new Float64Array(nout);
  const mu = () => { const P = rt.P; let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += P.re[j * n + i] * Mt[i * n + j]; return -s; };
  rt.kick(KAPPA);
  const o0 = rt.observables(); trace[0] = mu();
  const t0 = Date.now(); let mid = null;
  for (let k = 1; k < nout; k++) { for (let s = 0; s < every; s++) rt.step(dt); trace[k] = mu(); if (k === (nout >> 1)) mid = rt.observables(); }
  const o1 = rt.observables();
  return { trace, wall: (Date.now() - t0) / 1000, diag: {
    electrons0: o0.electrons, electronsMid: mid.electrons, electrons1: o1.electrons, imTr1: o1.electronsIm,
    idem0: o0.idempotency, idem1: o1.idempotency, E0: o0.fieldFreeTotal, Emid: mid.fieldFreeTotal, E1: o1.fieldFreeTotal } };
}
const WIN = [{ name: 'valence', wMin: 0.05, wMax: 2.0, dw: 2e-4 }, { name: 'core', wMin: 19.5, wMax: 20.8, dw: 2e-4 }];
const ladder = [['magnus2', 0.02], ['magnus2', 0.01], ['magnus2', 0.005], ['mmut', 0.01], ['mmut', 0.005], ['mmut', 0.0025]];
const runs = WHICH === 'long' ? [[arg('integrator','magnus2'), Number(arg('dt', 0.01))]] : ladder;
const out = { T, tau: TAU, kappa: KAPPA, dtOut: DTOUT, rhfEnergy: scfres.energy, rhfDeltaVsPyscf: dE, windows: WIN, runs: [] };
for (const [integrator, dt] of runs) for (const q of [0, 1, 2]) {
  const r = run({ q, dt, integrator }), rec = { integrator, dt, q, wall: r.wall, diag: r.diag, spec: [] };
  for (const w of WIN) {
    const sp = spectrum(r.trace, { dt: DTOUT, kappa: KAPPA, tau: TAU, wMin: w.wMin, wMax: w.wMax, dw: w.dw });
    const pk = peaks(sp, { fraction: 1e-4 }).map((p) => ({ omega: p.omega, imAlpha: p.imAlpha })).sort((a, b) => a.omega - b.omega);
    const sub = []; for (let i = 0; i < sp.omega.length; i += 5) sub.push(sp.ImAlpha[i]);
    rec.spec.push({ name: w.name, peaks: pk, w0: w.wMin, dwSub: w.dw * 5, ImAlphaSub: sub });
  }
  out.runs.push(rec);
  console.log(`${integrator} dt=${dt} ${'xyz'[q]} ${r.wall.toFixed(0)}s | val ${rec.spec[0].peaks.map((p) => p.omega.toFixed(6)).join(' ')} | core ${rec.spec[1].peaks.map((p) => p.omega.toFixed(6)).join(' ')} | Tr ${r.diag.electrons1.toFixed(12)} idem ${r.diag.idem1.toExponential(2)} dE ${(r.diag.E1 - r.diag.E0).toExponential(2)}`);
}
writeFileSync(new URL('./' + OUT, import.meta.url), JSON.stringify(out));
console.log('wrote', OUT);
