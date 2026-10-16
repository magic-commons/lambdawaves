/* tests/h2curve.test.mjs — 0.7.1 U2 THE H₂ CURVE: lab/h2curve.js's RHF · UHF · FCI · S along R on STO-3G, against PySCF 2.14 and the physics it must show.
 * The PySCF numbers: UHF from a broken-symmetry seed followed through stability() until stable, cart=True, the vendored STO-3G H decimals, conv_tol 1e-13
 * (research/release-0.7.1/U2-BUILD.md has the script); U1's tests/fixtures/oracles/uhf-v1.json carries the same rows and supersedes these at the merge. */
import assert from 'node:assert/strict';
import { h2Point, h2Curve, instability } from '../lab/h2curve.js';
import { moleculeAtoms } from '../lab/molecules.js';
import { ANGSTROM } from '../lab/md.js';

const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b} (tol ${tol})`);
const T = h2Curve(Array.from({ length: 53 }, (_, i) => +(0.8 + 0.1 * i).toFixed(1))), lim = T.limit, at = (R) => h2Point(R);

/* 1. the Coulson–Fischer point: the RHF → UHF instability's zero, inside PySCF's own bracket (stable at 2.17, broken at 2.19), and the SCF agrees on both sides */
assert.ok(T.cf > 2.17 && T.cf < 2.19, 'Coulson–Fischer point ' + T.cf);
assert.ok(instability(T.cf - 1e-6) > 0 && instability(T.cf + 1e-6) < 0, 'the instability changes sign at the CF point');
{ const below = at(T.cf - 0.03), above = at(T.cf + 0.03);
  close(below.uhf, below.rhf, 1e-9, 'UHF = RHF just below CF'); assert.ok(above.uhf < above.rhf - 1e-5 && above.s2 > 0.01, 'UHF breaks just above CF'); }
console.log(`PASS the Coulson–Fischer point ${T.cf.toFixed(6)} bohr (${(T.cf / ANGSTROM).toFixed(4)} Å), UHF = RHF below it and below RHF above it.`);

/* 2. the curve's ends: UHF = RHF at the bond, UHF and FCI onto 2E(H) at the break; the entanglement number 0 → ln 2 */
{ const a = at(1.4), b = at(6.0);
  close(a.uhf, a.rhf, 1e-10, 'UHF = RHF at 1.4'); close(a.s2, 0, 1e-10, '⟨S²⟩ at 1.4');
  assert.ok(b.uhf - b.fci <= 0.02 && b.uhf >= b.fci, 'UHF − FCI at 6.0'); close(b.uhf, lim, 0.01, 'UHF → 2E(H)'); close(b.fci, lim, 0.01, 'FCI → 2E(H)');
  assert.ok(a.S < 0.1 && b.S > 0.65 && b.S < Math.LN2, `S(1.4) ${a.S}, S(6.0) ${b.S}`); }
for (let i = 0; i < T.R.length; i++) assert.ok(T.fci[i] <= T.uhf[i] + 1e-9 && T.uhf[i] <= T.rhf[i] + 1e-9 && T.S[i] >= 0 && T.S[i] < Math.LN2, 'FCI ≤ UHF ≤ RHF, 0 ≤ S < ln 2 at ' + T.R[i]);
console.log('PASS UHF = RHF at 1.4, UHF and FCI within 0.01 of 2E(H) at 6.0, FCI ≤ UHF ≤ RHF and 0 ≤ S < ln 2 at all 53 points.');

/* 3. PySCF: RHF, UHF, ⟨S²⟩ and FCI at 0.74 Å, 3.0 bohr and 3.00 Å — 1e-8 Eh, ⟨S²⟩ 1e-6 */
for (const [R, rhf, uhf, s2, fci] of [[0.74 * ANGSTROM, -1.116759307396, -1.116759307396, 0, -1.137283834489], [3.0, -0.885275000111, -0.951017948053, 0.7742404236, -0.985156824368],
  [3.00 * ANGSTROM, -0.656048251146, -0.933284658334, 0.9985907243, -0.933631844558]]) {
  const p = at(R); close(p.rhf, rhf, 1e-8, 'RHF ' + R); close(p.uhf, uhf, 1e-8, 'UHF ' + R); close(p.s2, s2, 1e-6, '⟨S²⟩ ' + R); close(p.fci, fci, 1e-8, 'FCI ' + R);
}
console.log('PASS RHF, UHF, ⟨S²⟩ and FCI agree with PySCF at 0.74 Å, 3.0 bohr and 3.00 Å.');

/* 4. the STRETCH's pose: no R is the row's own atoms (THE LOCK), an R is ±R/2 on z */
assert.deepEqual(moleculeAtoms('H2'), [{ Z: 1, x: 0, y: 0, z: 0 }, { Z: 1, x: 0, y: 0, z: 0.741 * ANGSTROM }]);
assert.deepEqual(moleculeAtoms('H2', 5), [{ Z: 1, x: 0, y: 0, z: -2.5 }, { Z: 1, x: 0, y: 0, z: 2.5 }]); assert.deepEqual(moleculeAtoms('HF', 5), moleculeAtoms('HF'));
console.log('PASS moleculeAtoms: H₂ unchanged without an R, at ±R/2 on z with one, every other id untouched.');
