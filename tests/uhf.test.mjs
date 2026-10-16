/* uhf.test.mjs — 0.7.1 U1 THE OPEN SHELLS against PySCF UHF (tests/fixtures/oracles/uhf-v1.json, tools/library/uhf-oracle.py), and THE LOCK's
 * first witness: a closed shell never enters uhf, and water's D, C and E are the base's (5022adf) to the last bit.
 *   node tests/uhf.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { moleculeRHF, registerRecord } from '../lab/rhf-molecule.js';
import { MOLECULES, moleculeAtoms } from '../lab/molecules.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
registerRecord('sto-3g', read('../lab/vendor/bse/sto-3g-v1.json'));
const fx = read('./fixtures/oracles/uhf-v1.json'), sha = (a) => createHash('sha256').update(Buffer.from(Float64Array.from(a).buffer)).digest('hex');
const trDS = (s) => { const n = s.integrals.n; let t = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) t += s.D[i * n + j] * s.integrals.S[j * n + i]; return t; };

/* 1. THE LOCK: the closed shells through the refactored module, bit for bit against the base's own run (sha-256 of the f64 bytes) */
const LOCK = { H2O: ['7795fc4cd7548d38a0387ef5524418e7362f226230baa8ba125a248574d56d26', '61bf7fa61a9a393e247aae8bb87927a9af9ff83ca2947cb4f86eebe2342f0657', -74.96302316286258],
  N2: ['8a080dabb57690b28f2c23917a4651cc4a181677422d86340b4276fe746aec6e', '2520f6649a32a1d92e648aa81e36c48582cb6d2447df279b16fea1360a1105d1', -107.49588788341288] };
for (const [id, [d, c, e]] of Object.entries(LOCK)) {
  const s = moleculeRHF({ atoms: moleculeAtoms(id) });
  assert.equal(s.model, undefined, `${id}: multiplicity 1 never enters uhf`);
  assert.equal(sha(s.D), d, `${id}: D is the base's to the last bit`); assert.equal(sha(s.C), c, `${id}: C too`); assert.equal(s.energy, e, `${id}: and E`);
}
console.log('PASS THE LOCK: H₂O and N₂ solve to the base\'s D, C and E bit for bit (sha-256 of the f64 bytes); multiplicity 1 is RHF');

/* 2. every open shell of the catalogue against PySCF UHF: E ≤ 1e-8 Eh, ⟨S²⟩ ≤ 1e-6, Tr(DS) = N ≤ 1e-10, on the oracle's own atoms */
const open = MOLECULES.filter((m) => m.multiplicity > 1), rows = [];
assert.deepEqual(open.map((m) => m.id).sort(), Object.keys(fx.molecules).sort(), 'the oracle covers every open shell, and nothing else');
for (const m of open) {
  const o = fx.molecules[m.id], atoms = moleculeAtoms(m.id), t = performance.now(), s = moleculeRHF({ atoms, multiplicity: m.multiplicity }), ms = performance.now() - t;
  assert.deepEqual(atoms, o.atoms, `${m.id}: the oracle ran on the app's atoms`);
  assert.ok(o.converged && o.stable, `${m.id}: PySCF's answer is a converged, stable minimum`);
  assert.equal(s.model, 'UHF'); assert.ok(s.converged, `${m.id}: converged`); assert.equal(s.nocc, o.nAlpha); assert.equal(s.nBeta, o.nBeta);
  const dE = Math.abs(s.energy - o.energy), dS = Math.abs(s.s2 - o.s2), dN = Math.abs(trDS(s) - m.nElectrons);
  assert.ok(dE <= 1e-8 && dS <= 1e-6 && dN <= 1e-10, `${m.id}: |ΔE| ${dE.toExponential(1)} · |Δ⟨S²⟩| ${dS.toExponential(1)} · |Tr DS − N| ${dN.toExponential(1)}`);
  rows.push(`${m.id} ${m.term} E ${s.energy.toFixed(9)} (Δ ${dE.toExponential(0)}) ⟨S²⟩ ${s.s2.toFixed(6)} (Δ ${dS.toExponential(0)}) ${s.iterations} it ${ms.toFixed(0)} ms`);
}
console.log(`PASS ${open.length} open shells agree with PySCF UHF (≤ 1e-8 Eh, ⟨S²⟩ ≤ 1e-6, Tr DS = N ≤ 1e-10):\n  ${rows.join('\n  ')}`);

/* 3. H₂'s singlet by model 'uhf' (THE H₂ CURVE's ask): the RHF point before Coulson–Fischer, the spin-broken minimum past it */
const h = Object.entries(fx.h2).map(([k, o]) => {
  const s = moleculeRHF({ atoms: o.atoms, model: 'uhf' });
  assert.ok(Math.abs(s.energy - o.energy) <= 1e-8 && Math.abs(s.s2 - o.s2) <= 1e-6, `H₂ ${k}: E ${s.energy} vs ${o.energy}, ⟨S²⟩ ${s.s2} vs ${o.s2}`);
  return `${k} ${s.energy.toFixed(9)} ⟨S²⟩ ${s.s2.toFixed(4)}`;
});
assert.throws(() => moleculeRHF({ atoms: moleculeAtoms('OH') }), /odd electrons need multiplicity 2, 4/);
console.log(`PASS H₂ singlet UHF vs PySCF at ${h.join(' · ')}; an odd count at multiplicity 1 is refused`);
