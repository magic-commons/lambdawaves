import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMO } from '../lab/mo.js';
import { createMODrive, sin2Pulse } from '../lab/modrive.js';

const ref = JSON.parse(readFileSync(new URL('../research/astra-2026-09-05/reference-drive.json', import.meta.url)));
const close = (a, b, tol = 1e-11) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}, tolerance ${tol}`);
const mo = createMO({ kind: 'lcao1s' }), R = ref.R, M = mo.basisAt(R).M;
// Closed integrals, independent of the new quadrature: two normalised spherical densities centred at ±R/2.
for (const [k, v] of [[0, -R / 2], [1, 0], [2, 0], [3, R / 2]]) close(M.positionZ[k], v);
for (const field of [0, 0.03, -0.03]) {
  const d = createMODrive(mo, { R, field: () => field }), initialE = d.observables().instantaneousTotal;
  const delta = (ref.electronicEnergies[1] - ref.electronicEnergies[0]) / 2, coupling = field * ref.dipoleGU;
  const Omega = Math.hypot(delta, coupling), t = 19.7;
  d.step(t);
  const o = d.observables(), expected = coupling ** 2 / Omega ** 2 * Math.sin(Omega * t) ** 2;
  close(o.populations[1], expected); close(o.norm, 1); close(o.instantaneousTotal, initialE);
  d.step(-t);
  const returned = d.c, original = mo.vector(mo.solve(R));
  for (let k = 0; k < 2; k++) { close(returned.re[k], original[k]); close(returned.im[k], 0); }
}
const plus = createMODrive(mo, { R, field: () => 0.03 }).step(0.1).observables();
const minus = createMODrive(mo, { R, field: () => -0.03 }).step(0.1).observables();
assert.ok(plus.z < 0); close(plus.z, -minus.z);
console.log('PASS analytic dipole integrals, full static-field two-level solution, energy, time reversal and electron-force sign.');

// Compare actual AO amplitudes, not just norm or populations, with an independently integrated pulse.
const errors = [], normErrors = [];
for (const dt of [0.2, 0.1, 0.05]) {
  const drive = createMODrive(mo, { R, field: sin2Pulse(ref.pulse) });
  let worst = 0, normError = 0;
  for (const sample of ref.samples) {
    const count = Math.round((sample.t - drive.t) / dt);
    for (let i = 0; i < count; i++) drive.step(dt);
    const c = drive.c;
    for (let k = 0; k < 2; k++) worst = Math.max(worst, Math.abs(c.re[k] - sample.re[k]), Math.abs(c.im[k] - sample.im[k]));
    normError = Math.max(normError, Math.abs(drive.observables().norm - 1));
  }
  errors.push(worst); normErrors.push(normError);
  assert.ok(normError < 1e-10);
  const frozen = drive.snapshot(), rho = frozen.density(0.2, 0.1, 0.7);
  drive.step(1); close(frozen.density(0.2, 0.1, 0.7), rho);
}
assert.ok(errors[2] < 2e-5);
for (let i = 0; i < 2; i++) assert.ok(errors[i] / errors[i + 1] > 3.8 && errors[i] / errors[i + 1] < 4.2);
console.log('PASS pulse vs independent DOP853 reference; second-order global convergence:', JSON.stringify({ errors, normErrors }));

// The expanded molecular basis must remain S-unitary with a pulse that couples g and u blocks.
const larger = createMO({ kind: 'sturmian', nMax: 3 });
const d = createMODrive(larger, { R: 2, field: sin2Pulse(ref.pulse) });
for (let k = 0; k < 160; k++) d.step(0.2);
close(d.observables().norm, 1, 2e-10);
assert.ok(d.observables().populations.slice(1).some(v => v > 1e-6));
assert.ok(Number.isFinite(d.snapshot().deltaDensity(0.3, 0.2, 0.7)));
assert.throws(() => createMODrive(mo, { R: 0 }));
assert.throws(() => createMODrive(mo, { R, c0: [0, 0] }));
assert.throws(() => createMODrive(mo, { R, field: () => NaN }).step(0.1));
assert.throws(() => d.step(NaN));
assert.throws(() => sin2Pulse({ amplitude: 1, omega: 1, duration: 0 }));
console.log('PASS 12-function Sturmian driven state, immutable density snapshot, invalid inputs.');
