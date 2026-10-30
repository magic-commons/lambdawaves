// tests/provenance.test.mjs — THE PROVENANCE REGISTRY (0.9.0 Z2): docs/PROVENANCE.md is what tools/provenance.mjs writes, holds one row for every row of
// lab/catalogue.js, gives every molecule a source and an oracle, and every fixture and script it names is on disk.
//   node tests/provenance.test.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CATALOGUE } from '../lab/catalogue.js';

const at = (rel) => fileURLToPath(new URL(rel, import.meta.url)), doc = readFileSync(at('../docs/PROVENANCE.md'), 'utf8');
execFileSync(process.execPath, [at('../tools/provenance.mjs'), '--check'], { stdio: 'pipe' });   // throws unless the file is in step
execFileSync(process.execPath, [at('../tools/pyscf-table.mjs'), '--check'], { stdio: 'pipe' });   // 028 R-26: README's PySCF table is the fixtures'
const cells = (l) => l.slice(2, -2).split(/(?<!\\) \| /), ids = new Set(CATALOGUE.map((r) => r.id));
const rows = doc.split('\n').filter((l) => l.startsWith('| ') && ids.has(cells(l)[0])).map(cells);
assert.equal(rows.length, CATALOGUE.length, 'one row for every catalogue row');
assert.deepEqual(new Set(rows.map((r) => r[0])), ids, 'every catalogue id has its row');
const mols = doc.split('## THE MOLECULES')[1].split('The method rows:')[0].split('\n').filter((l) => l.startsWith('| ') && ids.has(cells(l)[0])).map(cells);
for (const r of mols) assert.ok(r[5] !== '—' && /^PySCF \d/.test(r[6]), `${r[0]}: a source and an oracle`);
const named = [...new Set([...doc.matchAll(/`((?:tests|tools|research)\/[^`\s]+\.(?:json|py|mjs))/g)].map((m) => m[1]))];
for (const p of named) assert.ok(existsSync(at('../' + p)), `${p} exists`);
assert.ok(named.filter((p) => p.endsWith('.py')).length >= 7 && named.filter((p) => /fixtures\/oracles\//.test(p)).length >= 5, 'the scripts and fixtures are named');
console.log(`PASS provenance: ${rows.length} rows (= the catalogue), ${mols.length} molecules each with a source and an oracle, ${named.length} named files on disk, --check in step`);
