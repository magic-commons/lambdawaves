#!/usr/bin/env node
/* tools/volumes/catalogue/app-own.mjs — SOURCE 1, THE APP'S OWN: every molecule lab/molecules.js carries (MOLECULES and the
 * library's record-only rows), at its PINNED geometry, read from the module itself — never re-fetched.  Writes
 * <catalogue>/cache/app-own.json for build.py: id, name, charge, multiplicity, disabled + reason, the atoms in ångström
 * exactly as the table pins them, the geometry's source sentence, and tools/library/pubchem-ids.json's checked CID. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
const root = new URL('../../../', import.meta.url);
const M = await import(new URL('lab/molecules.js', root));
const ids = JSON.parse(readFileSync(new URL('tools/library/pubchem-ids.json', root), 'utf8')).molecules;
const out = [...M.MOLECULE_BY_ID.values()].map((m) => ({
  id: m.id, name: m.name, charge: m.charge || 0, multiplicity: m.multiplicity || 1, group: m.group, section: m.section,
  recordOnly: !!m.recordOnly, library: !!m.library, disabled: !!m.disabled, reason: m.reason || null,
  ang: m.ang.map(([Z, x, y, z]) => [Z, x, y, z]), source: m.source || null,
  pubchem: ids[m.id] ? { cid: ids[m.id].cid ?? null, inchiKey: ids[m.id].inchiKey ?? null, none: ids[m.id].none ?? null, status: ids[m.id].status ?? null } : null,
}));
const dir = (process.env.LW_CATALOGUE || homedir() + '/Documents/LAMBDAWAVES-VOLUMES/catalogue') + '/cache';
mkdirSync(dir, { recursive: true });
writeFileSync(dir + '/app-own.json', JSON.stringify({ from: 'lab/molecules.js MOLECULE_BY_ID (MOLECULES + RECORD_ONLY)', count: out.length, molecules: out }, null, 1));
console.log(`app-own: ${out.length} molecules (${out.filter((m) => m.multiplicity > 1).length} open shells, ${out.filter((m) => m.disabled).length} disabled) → ${dir}/app-own.json`);
