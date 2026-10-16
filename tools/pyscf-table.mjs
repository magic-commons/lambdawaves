#!/usr/bin/env node
/* tools/pyscf-table.mjs — THE PYSCF TABLE (0.9.0 Z1 · research/release-0.9.0/BUILD-PLAN.md row Z1): rewrites ONE marked block of README.md
 * (`<!-- pyscf-table:begin -->` … `<!-- pyscf-table:end -->`) from the tree's own numbers, never typed: the LIBRARY's 38 records (lab/library.json rows and
 * each row's record lab/library/<hash>.json — E (app) its `ground.energy`, E (PySCF) its `oracle.energy`, Δ its `oracle.delta` = app − PySCF, printed
 * as JavaScript prints the double, unrounded) and the molecules MOLECULES solves LIVE (lab/molecules.js), whose app energy is computed on the device and
 * stored nowhere, so the row prints PySCF's from the fixture the live check reads: tests/fixtures/oracles/sto-3g-v1.json `library` (RHF), uhf-v1.json
 * (UHF), 6-31+g-star-v1.json, rks-v1.json (RKS LDA).  A method the card offers with no PySCF number on file says "no oracle"; one it does not offer, "—".
 *   node tools/pyscf-table.mjs           rewrite the block
 *   node tools/pyscf-table.mjs --check   write nothing; exit 1 unless the block is byte for byte what this writes */
import { readFileSync, writeFileSync } from 'node:fs';
import { MOLECULES, MOLECULE_BY_ID, basis631 } from '../lab/molecules.js';

const at = (p) => new URL('../' + p, import.meta.url), json = (p) => JSON.parse(readFileSync(at(p), 'utf8')), FX = 'tests/fixtures/oracles/';
const LIB = json('lab/library.json'), S3 = json(FX + 'sto-3g-v1.json'), UHF = json(FX + 'uhf-v1.json'), G6 = json(FX + '6-31+g-star-v1.json'), LDA = json(FX + 'rks-v1.json');
const g6 = new Map(G6.molecules.map((m) => [m.id, m])), plain = (s) => s.replace(/<\/?m>/g, ''), E = (o) => (o ? String(o.energy) + (o.converged === false ? ' (PySCF: not converged)' : '') : 'no oracle');
const BASES = { 'sto-3g': 'STO-3G', '6-31+g-star': '6-31+G\\*' }, method = (what) => (/\bUHF\b/.test(what) ? 'UHF' : 'RHF');

const rec = LIB.rows.map((r) => { const R = json('lab/library/' + r.hash + '.json'), m = MOLECULE_BY_ID.get(r.id);
  const d = r.status.energy === 'IMPORTED' ? '0 — the record\'s energy is PySCF\'s own' : String(r.oracle.delta);
  return `| ${plain(m.formula)} · ${m.name} | ${BASES[r.basis]} | ${r.nAO} | ${method(R.oracle.what)} | ${R.ground.energy} | ${R.oracle.energy} | ${d} | ${r.geometry} |`; });
const live = MOLECULES.map((m) => { const open = m.multiplicity > 1, b6 = basis631(m.id).ok, lda = !open && m.nAO <= 36 && !m.disabled;
  const s3 = open ? UHF.molecules[m.id] : S3.library[m.id];
  return `| ${plain(m.formula)} · ${m.name} | ${m.nAO} | ${open ? 'UHF' : 'RHF'}${m.disabled ? ' (disabled: ' + m.shortReason + ')' : ''} | ${E(s3)} | ${b6 ? E(g6.get(m.id)) : '—'} | ${lda ? E(LDA.molecules[m.id]) : '—'} |`; });

const P = (f) => `PySCF ${f.provenance.pyscf}`, block = [
  `${LIB.rows.length} library records — the app's solve beside PySCF's on the record's own atoms (${P(S3)}, \`cart=True\`, the vendored Basis Set Exchange decimals, bohr; Δ = app − PySCF in Eh, as stored):`,
  '', '| molecule | basis | AO | method | E (app), Eh | E (PySCF), Eh | Δ, Eh | geometry |', '|---|---|---|---|---|---|---|---|', ...rec, '',
  `${MOLECULES.length} molecules solved live — the app's energy is computed on your device and compared there (the STATUS line prints the agreement), so the table holds PySCF's (${P(S3)} RHF and ${P(UHF)} UHF in STO-3G, ${P(G6)} in 6-31+G\\*, ${P(LDA)} RKS \`lda,vwn\` on the app's grid; "no oracle": the card offers it and no PySCF number is on file; "—": not offered):`,
  '', '| molecule | AO (STO-3G) | method | STO-3G, Eh | 6-31+G\\*, Eh | RKS LDA (STO-3G), Eh |', '|---|---|---|---|---|---|', ...live].join('\n');

const README = at('README.md'), text = readFileSync(README, 'utf8'), B = '<!-- pyscf-table:begin -->', Z = '<!-- pyscf-table:end -->';
const i = text.indexOf(B), j = text.indexOf(Z);
if (i < 0 || j < i) { console.log(`pyscf-table: README.md has no ${B} … ${Z} block`); process.exit(1); }
const out = text.slice(0, i + B.length) + '\n\n' + block + '\n\n' + text.slice(j);   // blank lines: the comment lines never join the tables
if (process.argv.includes('--check')) {
  if (out !== text) { console.log('pyscf-table --check: README.md\'s block is OUT OF STEP — run `node tools/pyscf-table.mjs`'); process.exit(1); }
  console.log(`pyscf-table --check: ${Buffer.byteLength(block)} bytes, ${rec.length} records + ${live.length} live molecules, in step`);
} else { writeFileSync(README, out); console.log(`pyscf-table: wrote ${Buffer.byteLength(block)} bytes, ${rec.length} records + ${live.length} live molecules`); }
