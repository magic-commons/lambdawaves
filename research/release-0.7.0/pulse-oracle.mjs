// research/release-0.7.0/pulse-oracle.mjs — V1 (g) PULSES' oracle: water (STO-3G RHF, the card's MMUT unrestarted, Δt 0.02) under a weak shaped pulse
// through the worker's OWN chem.rt.init { pulse } / chem.rt.run, against LINEAR RESPONSE built from the same engine's δ-kick trace (absorb.js' meaning:
// κ_k δμ_k(t) = κ_k χ(t), so a field E(t) answers δμ(t) = ∫ χ(t − t′) E(t′) dt′, and at a carrier ω the damped transforms obey R̃(ω) = χ̃(ω) Ẽ(ω), Im χ̃ = Im α).
//   node research/release-0.7.0/pulse-oracle.mjs
import { readFileSync } from 'node:fs';
import * as W from '../../lab/mathworker.js';
import { fieldOf } from '../../lab/density.js';
import { moleculeAtoms } from '../../lab/molecules.js';

W.chemRegister('sto-3g', JSON.parse(readFileSync(new URL('../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const atoms = moleculeAtoms('H2O'), dt = 0.02, T = 400, steps = Math.round(T / dt), base = { atoms, basis: 'sto-3g', charge: 0, dt, integrator: 'mmut', restartEvery: 0 };
const S = W.chemSpectrum(base), bright = S.roots.find((r) => r.f > 1e-3), q = [0, 1, 2].reduce((b, k) => (Math.abs(bright.mu[k]) > Math.abs(bright.mu[b]) ? k : b), 0), axis = 'xyz'[q];
const run = (kappa, pulse) => { W.chemRtInit({ ...base, kick: { axis, kappa }, pulse }); const r = W.chemRtRun({ steps }); return r.trace; };   // trace[n] = μ_e(t = (n + 1)·Δt)
const mu0 = run(0, { shape: 'step' })[0], dmu = (tr) => Float64Array.from(tr, (v) => v - mu0);
const kk = 1e-4, chi = dmu(run(kk, null)).map((v) => v / kk);                                  // χ(t) on the grid, t = (n + 1)Δt
const t0 = performance.now();
for (const [shape, extra] of [['gaussian', {}], ['wave', { omega: bright.omega }], ['step', {}]]) {
  const kp = 1e-4, P = { shape, ...extra }, got = dmu(run(kp, P)), E = fieldOf({ shape, kappa: kp, omega: P.omega || 0, tOn: 0, tOff: 40, alpha: 0.05 });
  const pred = new Float64Array(steps);                                                      // ∫₀ᵗ χ(t − t′) E(t′) dt′, midpoint in t′
  for (let n = 0; n < steps; n++) { let s = 0; for (let m = 0; m <= n; m++) s += (m === n ? 0 : chi[n - m - 1]) * E((m + 0.5) * dt) * dt; pred[n] = s; }
  let e2 = 0, x2 = 0; for (let n = 0; n < steps; n++) { e2 += (got[n] - pred[n]) ** 2; x2 += got[n] ** 2; }
  const ft = (f, w, tau = 100) => { let re = 0, im = 0; for (let n = 0; n < steps; n++) { const t = (n + 1) * dt, d = Math.exp(-t / tau) * dt; re += f(n, t) * Math.cos(w * t) * d; im += f(n, t) * Math.sin(w * t) * d; } return [re, im]; };
  const w = bright.omega, R = ft((n) => got[n], w), X = ft((n) => chi[n], w), Ef = ft((n, t) => E(t), w);
  const ratio = [(R[0] * Ef[0] + R[1] * Ef[1]) / (Ef[0] ** 2 + Ef[1] ** 2), (R[1] * Ef[0] - R[0] * Ef[1]) / (Ef[0] ** 2 + Ef[1] ** 2)];
  console.log(`${shape.padEnd(8)} κ ${kp} along ${axis} · relL2(δμ, linear response) ${Math.sqrt(e2 / x2).toExponential(2)} · max|δμ| ${Math.max(...got.map(Math.abs)).toExponential(2)}`
    + ` · at the carrier ω ${w.toFixed(4)} Eh: R̃/Ẽ = ${ratio[0].toExponential(3)} + ${ratio[1].toExponential(3)}i, χ̃ (kick) = ${X[0].toExponential(3)} + ${X[1].toExponential(3)}i`);
}
console.log(`water's first bright RPA root ω ${bright.omega.toFixed(6)} Eh, f ${bright.f.toFixed(4)}, along ${axis}; T ${T} a.u., Δt ${dt}, ${steps} steps a run; ${((performance.now() - t0) / 1000).toFixed(1)} s`);
