// 0.7.0 V1 THE MODES: a normal-mode record validates and decodes; water's curvature is PySCF's to 0.1 cm⁻¹ (6 solves); the worker's LINEAR + one
// McWeeny frames reproduce the record's own check block against a live re-solve at Q₀ and 4Q₀ (ρ on NACRE R2's 40³ grid, and Tr(DS) − N); a
// miss is RECORDED (pass: false), never tuned away; benzene is read from its record (no solve).  The byte-exact half: tools/vibrate-library.mjs --check.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as W from '../lab/mathworker.js';
import { moleculeRHF } from '../lab/rhf-molecule.js';
import { validateRecord, decodeVibrate, recordPath } from '../lab/library.js';
import { moleculeAtoms } from '../lab/molecules.js';
import { evaluator } from '../lab/molecular-field.js';

const read = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8')), REC = read('../lab/vendor/bse/sto-3g-v1.json');
W.chemRegister('sto-3g', REC);
const CAT = read('../lab/library.json'), load = (id) => read('../lab/' + recordPath(CAT.vibrations.find((r) => r.id === id).hash)), ORA = read('./fixtures/oracles/vibrate-v1.json');
const water = load('H2O'), C = ORA.provenance.constants;
/* 1 · the record validates and decodes; a damaged one does not */
for (const r of CAT.vibrations) assert.deepEqual(validateRecord(load(r.id)), [], r.id);
const bad = load('H2O'); bad.vibrate.q0.pop(); assert.equal(validateRecord(bad).length, 1);
const V = decodeVibrate(water), N = V.atoms.length, n = V.nAO;
assert.ok(V.L.length === 3 * N * V.K && V.D1 instanceof Float32Array && V.D1.length === n * n * V.K && V.name[1] === 'ν₂' && V.irrep[1] === 'A₁');
/* 2 · the curvature: E(R₀ ± hL) through the app's solver, against PySCF's analytic Hessian */
const atoms = moleculeAtoms('H2O'), solve = (A) => moleculeRHF({ atoms: A, basis: 'sto-3g', record: REC, detect: false, stability: false, hessian: false });
const at = (Q, k) => atoms.map((a, i) => ({ Z: a.Z, x: a.x + Q * V.L[3 * N * k + 3 * i], y: a.y + Q * V.L[3 * N * k + 3 * i + 1], z: a.z + Q * V.L[3 * N * k + 3 * i + 2] }));
const s0 = solve(atoms);
for (let k = 0; k < V.K; k++) {
  const w2 = (solve(at(V.h, k)).energy + solve(at(-V.h, k)).energy - 2 * s0.energy) / (V.mu[k] * V.h * V.h), nu = Math.sqrt(w2) * C.hartree2wavenumber;
  assert.ok(Math.abs(nu - water.oracle.omega[k]) <= 0.1, `${V.name[k]}: ${nu} vs PySCF ${water.oracle.omega[k]}`);
  assert.ok(Math.abs(V.q0[k] - 1 / Math.sqrt(V.mu[k] * nu / C.hartree2wavenumber)) < 1e-6 * V.q0[k]);
}
/* 3 · chem.vib.frames: refused before the solve, then 32 samples, cos-even, phase 0 = Q = amp·Q₀; its D against a live re-solve, as the record says */
assert.throws(() => W.chemVibFrames({ vib: V, k: 1 }), /solve it first/);
W.chemGround({ atoms, basis: 'sto-3g', charge: 0 });
const F = W.chemVibFrames({ vib: V, k: 1, amp: 1 });
assert.ok(F.D.length === 32 * n * n && F.q[0] === V.q0[1] && F.q[5] === F.q[27] && F.dipole.length === 96 && F.shells === null);
const lo = [0, 1, 2].map((q) => Math.min(...atoms.map((a) => [a.x, a.y, a.z][q])) - 4), hi = [0, 1, 2].map((q) => Math.max(...atoms.map((a) => [a.x, a.y, a.z][q])) + 4);
for (let k = 0; k < V.K; k++) for (const j of [0, 2]) {            // amplitudes 1 and 4 Q₀
  const a = water.check.amplitudes[j], f = W.chemVibFrames({ vib: V, k, amp: a, K: 1 }), X = solve(at(a * V.q0[k], k)), E = evaluator(X.basis.shells), v = new Float64Array(n);
  let e2 = 0, x2 = 0, tr = 0;
  for (let i = 0; i < 40; i++) for (let jj = 0; jj < 40; jj++) for (let l = 0; l < 40; l++) {
    E.ao([lo[0] + (hi[0] - lo[0]) * i / 39, lo[1] + (hi[1] - lo[1]) * jj / 39, lo[2] + (hi[2] - lo[2]) * l / 39], v); let r = 0, rx = 0;
    for (let p = 0; p < n; p++) { if (!v[p]) continue; let u = 0, ux = 0; for (let q = 0; q < n; q++) { u += f.D[p * n + q] * v[q]; ux += X.D[p * n + q] * v[q]; } r += v[p] * u; rx += v[p] * ux; }
    e2 += (r - rx) ** 2; x2 += rx * rx;
  }
  for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) tr += f.D[p * n + q] * X.integrals.S[q * n + p];
  assert.equal(+Math.sqrt(e2 / x2).toPrecision(3), water.check.relL2[k][j], `${V.name[k]} relL2 at ${a} Q₀`);
  assert.equal(+Math.abs(tr - 10).toPrecision(3), water.check.trace[k][j], `${V.name[k]} trace at ${a} Q₀`);
}
/* 4 · every record's verdicts are its numbers against its gates (water misses 2.5·10⁻⁴ at Q₀, as NACRE R2 measured: the floor is McWeeny's) */
for (const r of CAT.vibrations) {
  const c = load(r.id).check, g = c.gates, w = (j) => Math.max(...c.relL2.map((x) => x[j]));
  assert.deepEqual(c.pass, { curvature: load(r.id).oracle.maxDeltaCm <= g.curvatureCm, relL2Q0: w(0) <= g.relL2Q0, relL2At4: w(2) <= g.relL2At4, trace: Math.max(...c.trace.map((x) => Math.max(x[0], x[1]))) <= g.traceTo2 }, r.id);
  assert.ok(c.pass.curvature, r.id + ': the curvature gate is the one that must hold');
}
const bz = load('C6H6').check;
assert.ok(bz.pass.relL2Q0 && bz.pass.trace && Math.max(...bz.relL2.map((x) => x[0])) <= 7e-4);
console.log(`PASS vibrate: ${CAT.vibrations.length} records validate; water ν̃ within 0.1 cm⁻¹ of PySCF; chem.vib.frames reproduces its check block (ρ relL2 @Q₀ ${Math.max(...water.check.relL2.map((x) => x[0]))}, @4Q₀ ${Math.max(...water.check.relL2.map((x) => x[2]))}); benzene @Q₀ ${Math.max(...bz.relL2.map((x) => x[0]))}`);
