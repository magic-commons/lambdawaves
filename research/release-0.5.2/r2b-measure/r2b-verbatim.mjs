/* every moved line, in order, against the base spans: identical, or which tokens differ */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const cwd = new URL('..', import.meta.url).pathname;
const base = execFileSync('git', ['show', '1d5b060:lab/rack.js'], { encoding: 'utf8', maxBuffer: 1 << 28, cwd }).split('\n');
const spans = { 'lab/windows/readouts.js': [[1044, 1134], [1359, 1385], [1636, 1658]], 'lab/windows/kepler.js': [[1936, 2229]] };
let same = 0, diff = 0, dropped = 0;
for (const [f, sp] of Object.entries(spans)) {
  const mod = readFileSync(cwd + f, 'utf8').split('\n');
  let j = 0;
  for (const [a, b] of sp) for (let k = a; k <= b; k++) {
    const want = base[k - 1];
    const at = mod.indexOf(want, j);
    if (at >= 0 && (at - j) < 20) { same++; j = at + 1; continue; }
    if (want === '') { dropped++; console.log(`  dropped blank base:${k}`); continue; }
    diff++; console.log(`  ${f}:${j + 1} base:${k}\n    - ${want.trim().slice(0, 150)}\n    + ${mod[j].trim().slice(0, 150)}`); j++;
  }
}
console.log(`identical ${same} · differing ${diff} · blank lines dropped ${dropped}`);
