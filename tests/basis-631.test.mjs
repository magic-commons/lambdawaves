/* tests/basis-631.test.mjs — THE LARGER BASIS: 6-31+G* (H, C, N, O, F), Cartesian d shells, against PySCF on the same
 * vendored decimals (lab/oracles/6-31+g-star-v1.json, written by research/molecular-waves-2026-09-18/basis/oracle-631.py).
 * The gate runs the cheap half of the oracle (≤ 27 AOs, a few hundred ms each); the whole table — nineteen molecules
 * to 3e-12 — is the research record engine-631.json.  Also: the rule that decides where the card offers the basis. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { moleculeRHF, registerRecord } from '../lab/rhf-molecule.js';
import { moleculeAtoms, moleculeCharge, basis631, MOLECULES } from '../lab/molecules.js';

const raw = fs.readFileSync(new URL('../lab/vendor/bse/6-31+g-star-v1.json', import.meta.url));
const oracle = JSON.parse(fs.readFileSync(new URL('../lab/oracles/6-31+g-star-v1.json', import.meta.url), 'utf8'));
assert.equal(createHash('sha256').update(raw).digest('hex'), oracle.provenance.bse_sha256, 'the oracle names the vendored record');
registerRecord('6-31+g-star', JSON.parse(raw));
let worst = 0, ran = 0;
for (const o of oracle.molecules) {
  const rule = basis631(o.id); assert.equal(rule.nAO, o.nAO, `${o.id}: the rule's AO count is PySCF's`);
  if (o.nAO > 27) continue;
  const sol = moleculeRHF({ atoms: moleculeAtoms(o.id), basis: '6-31+g-star', charge: moleculeCharge(o.id), detect: false, stability: false, hessian: false });
  assert(sol.converged, `${o.id} converges`); worst = Math.max(worst, Math.abs(sol.energy - o.energy)); ran++;
  assert(Math.abs(sol.energy - o.energy) < 1e-9, `${o.id}: ${sol.energy} vs PySCF ${o.energy}`);
}
const offered = MOLECULES.filter((m) => basis631(m.id).ok).map((m) => m.id);
assert(offered.includes('H2O') && offered.includes('C2H4') && !offered.includes('C6H6') && !offered.includes('C2H6') && !offered.includes('H2S'), `offered: ${offered}`);
assert.match(basis631('C6H6').why, /over the 46-AO cap/); assert.match(basis631('H2S').why, /H, C, N, O and F only/);
console.log(`PASS 6-31+G*: ${ran} molecules (≤ 27 AOs) agree with PySCF cart=True on the vendored decimals to ${worst.toExponential(1)}; the card offers the basis for ${offered.length} molecules (${offered.join(', ')}) and says why not for the rest.`);
