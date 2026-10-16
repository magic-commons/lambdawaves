// tests/catalogue.test.mjs — THE CATALOGUE (0.7.4 C1): lab/catalogue.js names an existing oracle test and one of status.js' three words on every row,
// carries every molecule (live or from its record) once, the operators and the lattice presets, and is what tools/catalogue-table.mjs writes.
//   node tests/catalogue.test.mjs
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CATALOGUE } from '../lab/catalogue.js';
import { MOLECULES, RECORD_ONLY } from '../lab/molecules.js';
import { HAMILTONIANS } from '../lab/hamiltonian.js';
import { PRESETS as LATTICES } from '../lab/lattice-model.js';

const at = (rel) => fileURLToPath(new URL(rel, import.meta.url)), ids = CATALOGUE.map((r) => r.id);
assert.equal(new Set(ids).size, ids.length, 'every id is one row');
for (const r of CATALOGUE) {
  assert.ok(existsSync(at('./' + r.oracle.test)), `${r.id}: its oracle test ${r.oracle.test} exists in tests/`);
  assert.ok(['EXACT', 'NUMERICAL', 'UNCHECKED'].includes(r.word), `${r.id}: "${r.word}" is one of status.js' three words`);
  assert.ok(r.name && r.shelf && r.opens && r.oracle.what && /^\d+\.\d+\.\d+$/.test(r.since), `${r.id}: a whole row`);
}
for (const m of [...MOLECULES, ...RECORD_ONLY]) assert.equal(CATALOGUE.filter((r) => r.id === m.id && r.shelf === 'molecules').length, 1, `${m.id} appears once`);
for (const id of Object.keys(HAMILTONIANS)) assert.ok(CATALOGUE.some((r) => r.opens === 'ham:' + id && r.id === id), `the operator ${id} appears`);
for (const p of LATTICES) assert.ok(ids.includes('lattice:' + p.id), `the lattice preset ${p.id} appears`);
execFileSync(process.execPath, [at('../tools/catalogue-table.mjs'), '--check'], { stdio: 'pipe' });   // throws unless the file is in step
console.log(`PASS catalogue: ${CATALOGUE.length} rows, every oracle test on disk, every word one of three, ${MOLECULES.length + RECORD_ONLY.length} molecules once, --check in step`);
