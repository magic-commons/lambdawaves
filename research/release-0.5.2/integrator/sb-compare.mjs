import fs from 'node:fs';
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
let full = 0, edit = 0;
for (const c of a.cases) {
  const d = b.cases.find((x) => x.name === c.name);
  if (!d) { console.log('MISSING', c.name); continue; }
  const f = c.sha === d.sha, e = c.editSha === d.editSha;
  full += f; edit += e;
  console.log(`${f ? 'ok ' : 'DIFF'} full · ${e ? 'ok ' : 'DIFF'} edit · ${c.name}${c.errs && c.errs.length ? ' errs=' + JSON.stringify(c.errs) : ''}`);
}
console.log(`full ${full}/${a.cases.length} · edit ${edit}/${a.cases.length}`);
