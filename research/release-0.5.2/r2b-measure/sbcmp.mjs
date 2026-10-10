/* node .tmp/sbcmp.mjs <a.json> <b.json> — every case's full and edit sha, side by side */
import { readFileSync } from 'node:fs';
const [A, B] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, 'utf8')));
const by = new Map(B.cases.map((c) => [c.name, c]));
let same = 0, differ = 0;
for (const a of A.cases) {
  const b = by.get(a.name);
  const ok = b && a.sha === b.sha && a.editSha === b.editSha;
  if (ok) same++; else differ++;
  console.log(`${ok ? 'same  ' : 'DIFFER'} ${a.name.padEnd(28)} ${a.sha.slice(0, 12)} ${b ? b.sha.slice(0, 12) : '—'} · edit ${a.editSha.slice(0, 12)} ${b ? b.editSha.slice(0, 12) : '—'} · errs ${(a.errs || []).length}/${b ? (b.errs || []).length : '—'}`);
}
console.log(`${A.cases.length} cases (${B.cases.length} in b): ${same} same · ${differ} differ`);
