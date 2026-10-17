/* tests/basis-ladder.test.mjs — THE BASIS LADDER (iteration 004 V1): the four new vendored records (STO-6G, 3-21G, 6-31G, 6-31G*)
 * and the widened 6-31+G* (H–Ar) solve in the app's own RHF to PySCF's energy on the same decimals, cart=True, every AO kept
 * (tests/fixtures/oracles/basis-ladder-v1.json, written by tools/volumes/oracle-ladder.py), ≤ 1e-8 Eh.  The rows span the
 * coverage: H, N, O; Cl; Br (STO-6G's spd shell, 6-31G*'s 4th-row d); Zn (the 3d block's d shell in 3-21G and 6-31G). */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { moleculeRHF, registerRecord, BASIS_FILES } from '../lab/rhf-molecule.js';
import { moleculeAtoms, moleculeCharge } from '../lab/molecules.js';
import { basisFrom } from '../lab/md.js';

const at = (rel) => new URL(rel, import.meta.url);
const oracle = JSON.parse(readFileSync(at('./fixtures/oracles/basis-ladder-v1.json'), 'utf8'));
for (const [b, p] of Object.entries(oracle.provenance.bases)) {
  const raw = readFileSync(at('../lab/vendor/bse/' + BASIS_FILES[b]));
  assert.equal(createHash('sha256').update(raw).digest('hex'), p.sha256, `${b}: the oracle ran on the vendored bytes`);
  registerRecord(b, JSON.parse(raw));
}
const t0 = performance.now(); let worst = 0;
for (const o of oracle.molecules) {
  const atoms = moleculeAtoms(o.id);
  assert.deepEqual(atoms.map((a) => [a.Z, a.x, a.y, a.z]), o.atoms, `${o.id}: the oracle's atoms are the app's`);
  const sol = moleculeRHF({ atoms, basis: o.basis, charge: moleculeCharge(o.id), detect: false, stability: false, hessian: false });
  assert.equal(sol.basis.n, o.nAO, `${o.id}/${o.basis}: the AO count is PySCF's`);
  assert(sol.converged, `${o.id}/${o.basis} converges`);
  const d = Math.abs(sol.energy - o.energy); worst = Math.max(worst, d);
  assert(d <= 1e-8, `${o.id}/${o.basis}: ${sol.energy} vs PySCF ${o.energy} (Δ ${d.toExponential(2)})`);
}
/* 6-31G* gives Sc–Zn one f shell: the app is l ≤ 2 and says so by name (tools/volumes/solve.py skips that rung for them) */
assert.throws(() => basisFrom(moleculeAtoms('ZnH2'), JSON.parse(readFileSync(at('../lab/vendor/bse/' + BASIS_FILES['6-31g-star']), 'utf8'))), /l = 3 is beyond/);
console.log(`PASS the basis ladder: ${oracle.molecules.length} rungs (${[...new Set(oracle.molecules.map((o) => o.id))].join(', ')} over ${Object.keys(oracle.provenance.bases).join(', ')}) agree with PySCF cart=True on the vendored decimals to ${worst.toExponential(1)} Eh in ${((performance.now() - t0) / 1000).toFixed(1)} s; 6-31G*'s f shell on Sc–Zn is refused by name.`);
