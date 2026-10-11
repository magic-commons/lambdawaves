// sonnet2-c: build tests/catalogue.json's would-be 30 rows from census/SYSTEMS.md §1 (S01..S30) and check, per row, that a named oracle test file exists in tests/ (the node test DRAFT 2 asserts in 0.6.0).
import fs from 'node:fs';
const ROOT = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0';
const md = fs.readFileSync(ROOT + '/research/release-0.6.0/census/SYSTEMS.md', 'utf8').split('\n');
const tests = new Set(fs.readdirSync(ROOT + '/tests'));
const rows = [];
for (const ln of md) {
  const m = ln.match(/^\| (S\d\d) \| (.*)$/); if (!m) continue;
  const cells = ln.split(/(?<!\\)\|/).map((c) => c.trim()).slice(1, -1);
  // # | System | Opens | Model | Physics | SHAPE | ORACLE.STATUS | LOCK | SITUATIONS | TESTS | LINES
  const id = cells[0], name = cells[1].replace(/\*\*/g, ''), lock = cells[cells.length - 4], tcell = cells[cells.length - 2];
  const toks = (tcell || '').replace(/[()]/g, '').split(/[,+\/]| and /).map((t) => t.trim().toLowerCase()).filter((t) => t && t !== '—' && t !== '-');
  const found = [], missing = [];
  for (const t of toks) {
    const cands = [`${t}.test.mjs`, `${t}-test.mjs`, `${t.replace(/\.browser$/, '')}.browser-test.mjs`, `${t}.browser-test.mjs`];
    const hit = cands.find((c) => tests.has(c));
    (hit ? found : missing).push(hit || t);
  }
  rows.push({ id, name: name.slice(0, 60), lock, testsCell: tcell, found, missing, status: toks.length === 0 ? 'NO-TEST-NAMED' : (found.length ? (missing.length ? 'PARTIAL' : 'ALL-FOUND') : 'NONE-FOUND') });
}
// does the oracle cell cite a file instead? (e.g. S13 'no node oracle')
const sum = {}; for (const r of rows) sum[r.status] = (sum[r.status] || 0) + 1;
const out = { tag: 'MEASURED (node: fs.readdirSync tests/)', rowsParsed: rows.length, testsDirFiles: tests.size, summary: sum, rows };
fs.writeFileSync(new URL('./sonnet2-c-catalogue.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(rows.length, JSON.stringify(sum)); for (const r of rows.filter((r) => r.status !== 'ALL-FOUND')) console.log(r.id, r.name, '|', r.testsCell, '=>', r.status, 'missing:', r.missing.join(','));
