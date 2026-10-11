/* tests/flow-numbers.test.mjs — FLOW'S TWO NUMBERS, TRACKED (0.5.4 P10 · PLAN §E; the 0.5.4 P9 merged here).  No lab/ change.
 *
 * WHAT THIS PINS, and what it does not.  molecular-flow.test.mjs MEASURES benzene's RING continuity defect and the current/dipole
 * magnitude ratio and prints them, asserting only that they are finite and that the current points the way the charge moves
 * (cos > 0.999).  This suite takes the same measurements on the two molecules of tests/fixtures/oracles/sto-3g-v1.json that FLOW is
 * driven on — benzene (the RING of degenerate HOMO-side excitations, `molecules_extended.C6H6`) and water (the TDHF kick of
 * `molecules.H2O`) — and holds each reading inside a TOLERANCE BAND AROUND TODAY'S READING.  That is a TRACKING pin, NOT A TARGET:
 *   · the continuity residual ‖∂ρ/∂t + ∇·j‖ / ‖∂ρ/∂t‖ is ≈ 1.19 (on this sample) in STO-3G, which is to say the finite-basis current does not
 *     satisfy continuity at all on these points (the defect is of the size of the signal); nobody should read 1.19 as "good";
 *   · the ratio of the velocity-gauge current to what the density's own motion implies is 0.149 for the benzene ring and 0.807 for
 *     the water kick — FLOW shows direction and sense exactly and magnitude qualitatively (the molecular-flow header says so).
 * A band exists so that a change in lab/ that moves these (a floor taper, a different gauge, a new basis path) is SEEN and has to
 * say so, in the commit that moves it — the floor taper itself waits for the pilot's margin (PLAN §G) and is NOT here.
 * THE BAND is ±1 % of the reading for the two ratios and ±1 % for the residual: the readings reproduce to ≥ 10 digits on this machine
 * (a seeded point set, closed-form AO gradients), so 1 % is ~8 orders wider than the noise and ~100× narrower than any change worth
 * a ruling.  THE SAMPLE IS PART OF THE READING: the residual is a statistic over 400 points, and another seeded 400 gave 1.2251 (+2.6 %) when
 * this was first drafted — so the 1 % band is around THIS point set (molecular-flow.test.mjs' own, which prints 1.1938), not a claim about benzene's
 * residual as such.  The numbers are printed on every run; to move a pin is to edit PIN below with the new reading beside the old. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chemRegister, chemGround, chemStates, chemStateVectors } from '../lab/mathworker.js';
import { moleculeAtoms } from '../lab/molecules.js';
import { createFlow } from '../lab/molecular-flow.js';
import { GROUND, createStatesModel, presetLanes } from '../lab/molecular-register.js';
import { moleculeRHF } from '../lab/rhf-molecule.js';
import { createRTHF } from '../lab/density.js';
import { fieldShells } from '../lab/molecular-field.js';

/** today's readings (this tree, 0.5.4 P10) — the centre of each band; BAND is the relative half-width */
const PIN = Object.freeze({
  benzeneContinuity: 1.19379,      // ‖∂ρ/∂t + ∇·j‖ / ‖∂ρ/∂t‖, 400 seeded points, the +90° RING state
  benzeneRatio: 0.14863,            // |∫ j dV| / |d(δμ)/dt| at t = 3.0, the same state
  waterTdhfRatio: 0.80663,          // (−∫ j_y dV) / d(dipole_y)/dt after a y kick, 60 steps of Magnus-2 at dt = 0.01
});
const BAND = 0.01;
const within = (name, got, centre) => assert(Math.abs(got - centre) <= BAND * centre,
  `${name}: read ${got} — outside ${centre} ± ${(BAND * 100).toFixed(0)} % [${(centre * (1 - BAND)).toFixed(6)}, ${(centre * (1 + BAND)).toFixed(6)}].  This is a TRACKING pin, not a target: if lab/ moved this on purpose, edit PIN with the old and new readings in the commit message.`);

const oracle = JSON.parse(fs.readFileSync(new URL('./fixtures/oracles/sto-3g-v1.json', import.meta.url), 'utf8'));
assert(oracle.molecules_extended.C6H6 && oracle.molecules.H2O, 'the two fixture molecules this suite runs on are in sto-3g-v1.json');
chemRegister('sto-3g', JSON.parse(fs.readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32 - 0.5;
for (let k = 0; k < 120; k++) rnd();            // molecular-flow.test.mjs §1 draws 40 × 3 numbers before its §4 points: burn them, so these ARE the same 400 points and the readings are comparable

/* ── benzene · the RING (molecular-flow.test.mjs §3–§4's own state and points, unchanged) ───────────────────────────────── */
const msg = { atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0 }, g = chemGround(msg), st = chemStates(msg), n = st.n, nocc = st.nocc;
assert.equal(n, 36, 'benzene STO-3G has 36 AOs'); assert.equal(n, oracle.molecules_extended.C6H6.nao, 'the fixture says the same AO count');
assert(Math.abs(g.energy - oracle.molecules_extended.C6H6.energy) < 1e-9, `benzene is at its PySCF energy: ${g.energy} vs ${oracle.molecules_extended.C6H6.energy}`);
const flow = createFlow(g.shells);
const P = presetLanes('RING', st), ks = P.lanes.filter((l) => l.key !== GROUND).map((l) => l.key), vec = chemStateVectors({ ks });
const model = createStatesModel({ n, nocc, C: g.C, D0: g.D, rMO: st.rMO });
ks.forEach((k, r) => model.addState(k, st.omega[k], vec.X.subarray(r * vec.count, (r + 1) * vec.count)));
const lanesAt = (quarter) => [{ key: GROUND, re: 0.8, im: 0 }, { key: ks[0], re: 0.42, im: 0 }, { key: ks[1], re: 0.42 * Math.cos(quarter), im: 0.42 * Math.sin(quarter) }];
const A = lanesAt(Math.PI / 2), re = new Float64Array(n * n), im = new Float64Array(n * n);
let benz;
{
  const dt = 1e-3, hh = 2e-3, pts = []; for (let k = 0; k < 400; k++) pts.push([7 * rnd(), 7 * rnd(), 3 * rnd()]);
  const mats = (t) => { model.evaluate(A, t, 'ground'); const r = new Float64Array(n * n), i2 = new Float64Array(n * n); model.flowMatrices(r, i2); return [r, i2]; };
  const [rP, iP] = mats(dt), [rM, iM] = mats(-dt), [r0, i0] = mats(0);
  let num = 0, den = 0;
  for (const p of pts) {
    flow.set(rP, iP); const a = flow.at(p[0], p[1], p[2]).rho; flow.set(rM, iM); const b = flow.at(p[0], p[1], p[2]).rho, dRho = (a - b) / (2 * dt);
    flow.set(r0, i0); let div = 0;
    for (let q = 0; q < 3; q++) { const u = p.slice(), d = p.slice(); u[q] += hh; d[q] -= hh; div += (flow.at(u[0], u[1], u[2]).j[q] - flow.at(d[0], d[1], d[2]).j[q]) / (2 * hh); }
    num += (dRho + div) ** 2; den += dRho ** 2;
  }
  const tq = 3.0, dP = model.evaluate(A, tq + dt, 'ground').dipole.slice(), dM = model.evaluate(A, tq - dt, 'ground').dipole.slice(), dmu = dP.map((v, q) => (v - dM[q]) / (2 * dt));
  model.evaluate(A, tq, 'ground'); model.flowMatrices(re, im); flow.set(re, im);
  const NN = 30, H8 = 8, hq = 2 * H8 / NN, J = [0, 0, 0];
  for (let ix = 0; ix < NN; ix++) for (let iy = 0; iy < NN; iy++) for (let iz = 0; iz < NN; iz++) { const s = flow.at(-H8 + (ix + 0.5) * hq, -H8 + (iy + 0.5) * hq, -H8 + (iz + 0.5) * hq); for (let q = 0; q < 3; q++) J[q] -= s.j[q] * hq ** 3; }
  benz = { continuity: Math.sqrt(num / den), ratio: Math.hypot(J[0], J[1]) / Math.hypot(dmu[0], dmu[1]),
    cos: (dmu[0] * J[0] + dmu[1] * J[1]) / (Math.hypot(dmu[0], dmu[1]) * Math.hypot(J[0], J[1])) };
}
assert(Number.isFinite(benz.continuity) && benz.cos > 0.999, `benzene: continuity ${benz.continuity}, cos ${benz.cos}`);
within('benzene RING continuity residual ‖∂ρ/∂t + ∇·j‖/‖∂ρ/∂t‖', benz.continuity, PIN.benzeneContinuity);
within('benzene RING current/dipole magnitude ratio', benz.ratio, PIN.benzeneRatio);
console.log(`PASS FLOW pinned on benzene (sto-3g-v1.json molecules_extended.C6H6), RING +90°, 400 seeded points: continuity residual ${benz.continuity.toPrecision(8)} (band ${PIN.benzeneContinuity} ± 1 %), current/dipole ratio ${benz.ratio.toPrecision(8)} (band ${PIN.benzeneRatio} ± 1 %), cos(d(δμ)/dt, −∫j) ${benz.cos.toPrecision(8)} (> 0.999). TRACKING, not a target.`);

/* ── water · the TDHF kick (molecular-flow.test.mjs §5's own run, unchanged) ───────────────────────────────────────────── */
{
  const sol = moleculeRHF({ atoms: moleculeAtoms('H2O'), basis: 'sto-3g', detect: false, stability: false, hessian: false }), I = sol.integrals;
  assert(Math.abs(sol.energy - oracle.molecules.H2O.energy) < 1e-9, 'the water this suite runs on is at its PySCF energy');
  const eng = createRTHF({ n: I.n, S: I.S, h: I.h, eri: I.eri, Z: I.Z, mu: [I.X, I.Y, I.Z], Enuc: I.Enuc, nuclearDipole: I.nuclearDipole[1], nElectrons: sol.nElectrons, D0: sol.D, dt: 0.01, integrator: 'magnus2', restartEvery: 0 });
  eng.kickAlong('y', 0.02);
  for (let k = 0; k < 60; k++) eng.step();
  const dA = eng.dipoleAlong('y'); eng.step(); const D = eng.D; eng.step(); const dB = eng.dipoleAlong('y'), rate = (dB - dA) / 0.02;
  const fw = createFlow(fieldShells(sol.basis)); fw.set(Float64Array.from(D.re), Float64Array.from(D.im, (x) => -x));
  const N = 36, H6 = 7, hq = 2 * H6 / N; let Jy = 0, Jx = 0, Jz = 0;
  for (let ix = 0; ix < N; ix++) for (let iy = 0; iy < N; iy++) for (let iz = 0; iz < N; iz++) { const q = fw.at(-H6 + (ix + 0.5) * hq, -H6 + (iy + 0.5) * hq, -H6 + (iz + 0.5) * hq); Jx -= q.j[0] * hq ** 3; Jy -= q.j[1] * hq ** 3; Jz -= q.j[2] * hq ** 3; }
  const ratio = Jy / rate;
  assert(Math.sign(Jy) === Math.sign(rate) && Math.abs(Jy) > 10 * Math.hypot(Jx, Jz), `water TDHF: rate ${rate}, −∫ j_y ${Jy}, off-axis ${Math.hypot(Jx, Jz)}`);
  within('water TDHF −∫ j_y dV / d(dipole_y)/dt', ratio, PIN.waterTdhfRatio);
  console.log(`PASS FLOW pinned on water (sto-3g-v1.json molecules.H2O, ${oracle.molecules.H2O.energy.toFixed(9)} Eh), y kick, 60 Magnus-2 steps: current/dipole ratio ${ratio.toPrecision(8)} (band ${PIN.waterTdhfRatio} ± 1 %), off-axis current ${Math.hypot(Jx, Jz).toExponential(2)}. TRACKING, not a target.`);
}
