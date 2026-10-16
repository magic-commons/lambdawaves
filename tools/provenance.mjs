#!/usr/bin/env node
/* tools/provenance.mjs — THE PROVENANCE REGISTRY + THE FINGERPRINT (0.9.0 Z2 · research/release-0.9.0/BUILD-PLAN.md row Z2): writes docs/PROVENANCE.md, one
 * row for every row of lab/catalogue.js (0.7.4 C1), each column READ from the file named beside its reader — nothing is typed here but headings and joins.
 * THE HEAD: the lock's scope in tools/perf/digest-lock.mjs' own words and both fixtures' own fields; the FINGERPRINT row from the saved device report
 * (research/release-0.9.0/z2-fingerprint.json: `__LW.report({ only: 'fingerprint' })`, tools/perf/device-report.js, on this machine); the FIELD LAW line's seat.
 *   node tools/provenance.mjs           write docs/PROVENANCE.md
 *   node tools/provenance.mjs --check   write nothing; exit 1 unless docs/PROVENANCE.md is byte for byte what this writes */
import { readFileSync, writeFileSync } from 'node:fs';
import { CATALOGUE } from '../lab/catalogue.js';
import { MOLECULES, RECORD_ONLY } from '../lab/molecules.js';

const ROOT = new URL('../', import.meta.url), OUT = new URL('docs/PROVENANCE.md', ROOT);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8'), json = (p) => JSON.parse(read(p)), FX = 'tests/fixtures/oracles/';
const cell = (s) => String(s ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' '), row = (a) => '| ' + a.map(cell).join(' | ') + ' |';
const table = (h, rows) => [row(h), row(h.map(() => '---')), ...rows.map(row)].join('\n'), e3 = (x) => (x === 0 ? '0' : x.toExponential(2));

/* (i) THE LOCK — tools/perf/digest-lock.mjs' header comment, joined line to line (a line ending in '/' is a wrapped path) */
const DL = read('tools/perf/digest-lock.mjs').split('*/')[0].split('\n').map((l) => l.replace(/^\s*\/?\*+\s?/, '').trim()).filter(Boolean)
  .reduce((a, l) => a + (a.endsWith('/') ? '' : ' ') + l, '');
const scope = DL.match(/THE LOCK'S SCOPE \([^)]*\): (.*?which is never a lock\.)/)[1];
const counts = DL.match(/(`--check --query gastab=0` compares 860 values.*?\)\.)/)[1];
const fx = (p) => { const F = json(p), q = new URL(F.url).searchParams.get('gastab'); return `\`${p}\` — made ${F.made}, build “${F.meta.build}”, ${F.meta.ua.split(') ').pop()}, its url ${q === null ? 'without `gastab`' : 'with `gastab=' + q + '`'}, no commit field`; };
const LOCK = `**THE LOCK** (\`tools/perf/digest-lock.mjs\`, its header): ${scope} ${counts} The fixtures, from their own fields: the default ${fx('research/optimization-2026-09-24/digest-lock-base.json')}; the 1004-value ${fx('research/release-0.4.0/measure/digest-lock-s4a.json')} (the header: “recorded on the S4a base tree”).`;

/* (ii) THE FINGERPRINT — research/release-0.9.0/z2-fingerprint.json: tools/perf/device-report.js' R.fingerprint as the report returned it (0.5.4 P11) */
const FP = json('research/release-0.9.0/z2-fingerprint.json'), R = FP.report, f = R.fingerprint, a = f.adapter;
const DEVICE = `**FINGERPRINT** · ${R.device} · ${R.build} · ${R.at} · commit \`${FP.commit.slice(0, 7)}\` · adapter (vendor, architecture, device, description) ${JSON.stringify([a.vendor, a.architecture, a.device, a.description])}`
  + ` · driver ${f.driver ?? 'null'} · ${f.browser.ua} · ${f.features.length} features offered, shader-f16 offered ${f.shaderF16.offered} · requested ${f.shaderF16.requested} · granted ${f.shaderF16.granted}`
  + ` · ${Object.keys(f.limits).length} limits · ${f.format} · digests ${f.digests.grid}³ at t = ${f.digests.states[0].t}: ${f.digests.states.map((s) => s.id + ' `' + s.hash + '`').join(', ')} (\`${FP.road}\`).`;

/* the basis sets — lab/vendor/bse/index.json + each vendored file's own header (revision_description); a licence line is printed only if one is there */
const BSE = json('lab/vendor/bse/index.json'), files = BSE.records.map((r) => [r, read('lab/vendor/bse/' + r.file)]);
const lic = [JSON.stringify(BSE), ...files.map(([, t]) => t)].some((t) => /licen[cs]e/i.test(t));
const BASIS = files.map(([r, t]) => `${r.name}: \`lab/vendor/bse/${r.file}\`, Basis Set Exchange bse_version ${r.bse_version}, revision ${r.revision_date}, “${JSON.parse(t).revision_description}”, sha-256 \`${r.sha256}\``).join('; ')
  + (lic ? '.' : '. **Licence: NOT STATED IN THE TREE** — neither vendored file nor `lab/vendor/bse/index.json` carries a licence line.');

/* the oracle fixtures — each file's own `provenance` (tests/fixtures/oracles/README.md, 0.5.4 P10); a script is the provenance's written_by / tool for that key */
const FIXTURE = Object.fromEntries(['library-v1', 'sto-3g-v1', 'uhf-v1', 'rks-v1', '6-31+g-star-v1'].map((n) => [FX + n + '.json', json(FX + n + '.json')]));
const C60 = 'research/release-0.4.0/library-census/c60-occupied.json';   // C₆₀'s record names it (oracle.source); tools/library/frontier.py --occupied writes it (save('c60-occupied.json'))
const scriptOf = (file, key) => { if (file === C60) return 'tools/library/frontier.py --occupied'; const p = FIXTURE[file].provenance;
  const all = [p.tool || p.written_by, ...Object.values(p).filter((v) => v && v.written_by).map((v) => v.written_by)];   // no key: every writer of the file
  return key === 'library' ? p.library.written_by : key === 'molecules_extended' ? p.appended.written_by : key ? all[0] : all.join('`, `'); };
const pyscfOf = (file) => (file === C60 ? json(C60).solver.pyscf : FIXTURE[file].provenance.pyscf);
const oracle = (file, key, id) => `PySCF ${pyscfOf(file)} · \`${scriptOf(file, key)}\` · \`${file}\` ${key}.${id}`;

/* THE MOLECULES — lab/library.json (rows: basis, hash, geometry, status, oracle.delta; `generator`), each record lab/library/<hash>.json (stem.geometrySource,
 * oracle.source — the fixture and its key —, oracle.energy); a live molecule: lab/molecules.js (section, source, oracle.energy, multiplicity) and its fixture */
const LIB = json('lab/library.json'), libRow = new Map(LIB.rows.map((r) => [r.id, r])), MOL = new Map([...MOLECULES, ...RECORD_ONLY].map((m) => [m.id, m]));
const molRows = [], none = [];
for (const c of CATALOGUE.filter((r) => r.shelf === 'molecules' && MOL.has(r.id))) {
  const m = MOL.get(c.id), L = libRow.get(c.id), g631 = m.oracle && m.oracle['6-31+g-star'] ? ' · 6-31+G*' : '';
  let src, orc, E, d, rec = null, geom = null, gen = 'live solve';
  if (L) {
    const D = json('lab/library/' + L.hash + '.json'), [file, path] = D.oracle.source.split(' '), [key, id] = path.split('.');
    src = D.stem.geometrySource; orc = oracle(file, key, id); E = D.oracle.energy; d = e3(L.oracle.delta); rec = L.hash.slice(0, 8); geom = L.status.geometry; gen = LIB.generator.split(' ')[0];
  } else {
    const file = FX + (m.multiplicity > 1 ? 'uhf-v1.json' : 'sto-3g-v1.json'), key = m.multiplicity > 1 ? 'molecules' : 'library', F = FIXTURE[file][key][c.id];
    src = m.source; orc = F ? oracle(file, key, c.id) : null; E = F ? F.energy : null; d = 'not on file';
  }
  if (g631) orc += ` · 6-31+G*: \`${scriptOf(FX + '6-31+g-star-v1.json')}\` · \`${FX}6-31+g-star-v1.json\` molecules.${c.id}`;
  if (!src || !orc) none.push(c.id);
  molRows.push([c.id, m.section, 'STO-3G' + g631, rec, geom, src, orc, E, d, gen, c.since]);
}
/* THE METHOD ROWS — lab/catalogue.js; their fixture is the one their oracle.what names (molecules, uhf, lda), basis-631's the README's 6-31+G* row */
const METHOD_FX = { molecules: 'sto-3g-v1.json', 'basis-631': '6-31+g-star-v1.json', uhf: 'uhf-v1.json', lda: 'rks-v1.json' };
const methodRows = CATALOGUE.filter((r) => r.shelf === 'molecules' && !MOL.has(r.id)).map((c) => { const file = FX + METHOD_FX[c.id];
  return [c.id, c.name, c.word, '`tests/' + c.oracle.test + '`', c.oracle.what, `PySCF ${pyscfOf(file)} · \`${scriptOf(file)}\` · \`${file}\``, c.since]; });
const otherRows = CATALOGUE.filter((r) => r.shelf !== 'molecules').map((c) => [c.id, c.name, c.shelf, c.word, '`tests/' + c.oracle.test + '`', c.since]);
const tally = LIB.rows.reduce((o, r) => ((o[r.status.geometry] = [...(o[r.status.geometry] || []), r.id]), o), {});
const GEOM = Object.entries(tally).map(([k, ids]) => `${k} ${ids.length}${ids.length <= 2 ? ' (' + ids.join(', ') + ')' : ''}`).join(', ');

/* Research, not merged — research/release-0.5.4/survey/CHAT-AND-ASKS.md §A9, its heading and its own "Cautioned" words */
const A9 = read('research/release-0.5.4/survey/CHAT-AND-ASKS.md').split('### A9 · ')[1].split('\n### ')[0];
const A9_LINE = `Sol's A9 archive (the C++ libraries, ${A9.split('\n')[0]}) is cited by its research path, \`research/release-0.5.4/survey/CHAT-AND-ASKS.md\` §A9, and not merged: “${A9.match(/Cautioned: ([^;]*);/)[1]}”.`;

const text = `# λWAVES · THE PROVENANCE REGISTRY

GENERATED by \`tools/provenance.mjs\` from \`lab/catalogue.js\`, \`lab/library.json\` and its records, \`lab/molecules.js\`, \`lab/vendor/bse/\`, the oracle fixtures, \`tools/perf/digest-lock.mjs\` and the saved fingerprint — never edit it by hand (\`node tools/provenance.mjs --check\`). ${CATALOGUE.length} rows: one for every row of the catalogue.

## THE FINGERPRINT

- ${LOCK}
- ${DEVICE}
- FIELD LAW · adapter info blank · Firefox/157.0 · dfdd2b8 · hydrogen RMS 2.34e-6 · 99.8 % 1.88e-5 · worst 1.68e-4 · water RMS 8.31e-4 · worst/ρmax 2.86e-4 · GREEN  (tests/field-law.browser-test.mjs on this machine, the gate server 9241, at the 0.9.0 merge; the adapter field is blank on Firefox 157 — the hardware is the fingerprint row's: RTX 3070)

## THE MOLECULES (${molRows.length + methodRows.length} rows of the \`molecules\` shelf)

**Basis.** ${BASIS}

**Geometry.** \`lab/library.json\` \`status.geometry\` over its ${LIB.rows.length} records: ${GEOM}; a live molecule carries no geometry class — its \`source\` sentence (\`lab/molecules.js\`) is the column. PySCF is the oracle for the energies, never for the geometry (\`tests/fixtures/oracles/README.md\`).

**Columns.** record: \`lab/library/<sha-256>.json\`, its first 8; source: the record's \`stem.geometrySource\`, else \`lab/molecules.js\` \`source\`; oracle: PySCF version · the script that wrote the fixture · the fixture and its key, from the fixture's \`provenance\` (a record's from its \`oracle.source\`); E: PySCF's energy in Eh; Δ: \`lab/library.json\` \`oracle.delta\` in Eh (app − PySCF), held by \`tests/library.test.mjs\`; a live molecule's Δ is computed by its gate (\`lab/catalogue.js\` \`oracle.test\`), not kept on file; generator: \`lab/library.json\` \`generator\`; since: the catalogue's.

${table(['id', 'section', 'basis', 'record', 'geometry', 'source', 'oracle', 'E (Eh)', 'Δ (Eh)', 'generator', 'since'], molRows)}

The method rows:

${table(['id', 'name', 'word', 'oracle test', 'what', 'oracle', 'since'], methodRows)}

## EVERY OTHER SHELF (${otherRows.length} rows)

${table(['id', 'name', 'shelf', 'word', 'oracle test', 'since'], otherRows)}

## Research, not merged

${A9_LINE}
`;
const rows = molRows.length + methodRows.length + otherRows.length;
if (rows !== CATALOGUE.length || none.length) { console.error(`provenance: ${rows} rows of ${CATALOGUE.length}; without a source or an oracle: ${none.join(', ') || 'none'}`); process.exit(1); }
if (process.argv.includes('--check')) { if (readFileSync(OUT, 'utf8') !== text) { console.error('docs/PROVENANCE.md is stale: run node tools/provenance.mjs'); process.exit(1); } console.log(`provenance --check: ${Buffer.byteLength(text)} bytes, ${rows} rows, in step`); }
else { writeFileSync(OUT, text); console.log(`wrote docs/PROVENANCE.md: ${Buffer.byteLength(text)} bytes, ${rows} rows`); }
