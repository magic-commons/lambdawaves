/* mmut-long.mjs — ROUND 4 · OPUS, Q13: UNRESTARTED MMUT on H₂O.  createRTHF accepts restartEvery, so
 * restartEvery: Infinity never inserts a Magnus-2 step after the first.  y-polarised kick, Δt = 0.01, long run.
 * The parasitic branch of the exact 40×40 companion sits at ω_par = π/Δt − 1.3935 = 312.7656 (gen3.py); its
 * amplitude is fitted directly, block by block, by least squares on the every-step dipole trace. */
import { readFileSync, writeFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
import { createRTHF } from '../../../lab/density.js';
import { spectrum, peaks } from '../../../lab/absorb.js';
const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const DT = Number(arg('dt', 0.01)), T = Number(arg('T', 2000)), Q = Number(arg('q', 1)), KAPPA = Number(arg('kappa', 1e-3));
const WPAR = Number(arg('wpar', 312.765608));
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
function loew(X, M) { const A = new Float64Array(n * n), B = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const x = X[i * n + k]; if (!x) continue; for (let j = 0; j < n; j++) A[i * n + j] += x * M[k * n + j]; }
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const v = A[i * n + k]; if (!v) continue; for (let j = 0; j < n; j++) B[i * n + j] += v * X[k * n + j]; }
  return B; }
function run(restartEvery, label) {
  const rt = createRTHF({ n, S: mol.S, h: mol.h, eri: mol.eri, Z: mol.M[Q], Enuc: mol.Enuc,
    nuclearDipole: mol.nuclearDipole[Q], nElectrons: 10, D0: s.D, dt: DT, integrator: 'mmut', restartEvery });
  const Mt = loew(rt.X, mol.M[Q]);
  const mu = () => { const P = rt.P; let acc = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) acc += P.re[j * n + i] * Mt[i * n + j]; return -acc; };
  rt.kick(KAPPA);
  const N = Math.round(T / DT), tr = new Float64Array(N + 1); tr[0] = mu();
  const o0 = rt.observables(), t0 = Date.now();
  for (let k = 1; k <= N; k++) { rt.step(DT); tr[k] = mu(); }
  const o1 = rt.observables();
  /* block-by-block least-squares amplitude of a known frequency */
  const amp = (w, blocks) => { const L = Math.floor(N / blocks), out = [];
    for (let b = 0; b < blocks; b++) { let cc = 0, ss = 0, cs = 0, yc = 0, ys = 0;
      for (let k = b * L; k < (b + 1) * L; k++) { const t = k * DT, c = Math.cos(w * t), sn = Math.sin(w * t), y = tr[k] - tr[0];
        cc += c * c; ss += sn * sn; cs += c * sn; yc += y * c; ys += y * sn; }
      const det = cc * ss - cs * cs, a = (yc * ss - ys * cs) / det, bq = (ys * cc - yc * cs) / det;
      out.push(Math.hypot(a, bq)); }
    return out; };
  const sub = new Float64Array(Math.floor(N * DT / 0.02) + 1);              // resample at 0.02 for the round-2 windows
  const every = Math.round(0.02 / DT);
  for (let k = 0; k < sub.length; k++) sub[k] = tr[k * every];
  const win = (wMin, wMax, dw, tau) => { const sp = spectrum(sub, { dt: 0.02, kappa: KAPPA, tau, wMin, wMax, dw });
    return peaks(sp, { fraction: 1e-4 }).map((p) => p.omega).sort((a, b) => a - b); };
  return { label, restartEvery, wall: (Date.now() - t0) / 1000, steps: N,
    electrons0: o0.electrons, electrons1: o1.electrons, idem0: o0.idempotency, idem1: o1.idempotency,
    imTr: o1.electronsIm, E0: o0.fieldFreeTotal, E1: o1.fieldFreeTotal,
    valence: win(0.05, 2.0, 2e-4, 50), core: win(19.5, 20.8, 2e-4, 50),
    parBlocks: amp(WPAR, 10), physBlocks: amp(0.807034854, 10), tr0: tr[0],
    trMinMax: [Math.min(...tr.slice(0, 1000)), Math.max(...tr.slice(0, 1000))] };
}
const out = [];
for (const [re, lab] of [[Infinity, 'UNRESTARTED (restartEvery = Infinity)'], [50, 'restartEvery = 50 (lab default)']]) {
  const r = run(re, lab); out.push(r);
  console.log(`\n${lab}   Δt=${DT} T=${T} (${r.steps} steps, ${r.wall.toFixed(0)} s)`);
  console.log(`  Tr P: ${r.electrons0.toFixed(12)} → ${r.electrons1.toFixed(12)}   Im Tr ${r.imTr.toExponential(2)}   idempotency ${r.idem0.toExponential(2)} → ${r.idem1.toExponential(2)}   ΔE ${(r.E1 - r.E0).toExponential(2)}`);
  console.log(`  valence peaks: ${r.valence.map((x) => x.toFixed(6)).join(' ')}`);
  console.log(`  core peaks:    ${r.core.map((x) => x.toFixed(6)).join(' ')}`);
  console.log(`  parasitic amplitude at ω=${WPAR} per tenth of the run:`);
  console.log(`    ${r.parBlocks.map((x) => x.toExponential(2)).join(' ')}`);
  console.log(`    ratio last/first = ${(r.parBlocks[9] / r.parBlocks[0]).toFixed(4)};  physical (ω=0.807) amplitude ${r.physBlocks[0].toExponential(3)} → ${r.physBlocks[9].toExponential(3)}`);
  console.log(`    parasitic/physical = ${(r.parBlocks[0] / r.physBlocks[0]).toExponential(3)} → ${(r.parBlocks[9] / r.physBlocks[9]).toExponential(3)}`);
}
const a = out[0], b = out[1];
console.log('\nunrestarted vs restarted, same Δt:');
a.valence.forEach((w, i) => console.log(`  valence ${w.toFixed(9)} vs ${b.valence[i].toFixed(9)}   Δ = ${(w - b.valence[i]).toExponential(2)}`));
a.core.forEach((w, i) => console.log(`  core    ${w.toFixed(9)} vs ${b.core[i].toFixed(9)}   Δ = ${(w - b.core[i]).toExponential(2)}`));
writeFileSync(new URL('./mmut-long.json', import.meta.url), JSON.stringify(out));
