/* tools/tile-check.mjs — THE CHECK (iteration 011 Q3; re-aimed by Q3b), run from the repo root: the subshell each el- tile drew (the
   manifest's `orbital`, written by menu-thumbs from valenceOf at render time) against THE BLOCK'S ORBITAL of lab/valence.js
   (`blockSubshell`: an open f shell, else the occupied subshell last in Madelung order).  A second, independent column: the subshell the
   element's SEAT in the table names (s block ns, p block np, d block (n−1)d, the two f rows (n−2)f) — where the seat and the rule part,
   the configuration is why (La/Ac/Th hold no f, Lu/Lr close theirs).  Prints every row (Z · symbol · configuration · subshell) with
   `--all`, else the mismatches and the seat partings. */
import { readFileSync } from 'node:fs';
import { ATOMS } from '../lab/atoms.js';
import { blockSubshell } from '../lab/valence.js';
const file = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'lab/img/menu/manifest.json', ALL = process.argv.includes('--all');
const man = JSON.parse(readFileSync(file, 'utf8'));
const L = 'spdf', sup = (k) => String(k).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
const PERIOD = [2, 10, 18, 36, 54, 86, 118], period = (Z) => PERIOD.findIndex((z) => Z <= z) + 1;
const seat = (Z) => {                                  // the block by the seat alone (the 18-column table, 57–71 and 89–103 in the f rows)
  const p = period(Z), g = Z - (PERIOD[p - 2] || 0);   // the place in the period, 1-based
  if ((Z >= 57 && Z <= 71) || (Z >= 89 && Z <= 103)) return (p - 2) + 'f';
  if (Z <= 2 || g <= 2) return p + 's';
  const tail = (PERIOD[p - 1] - (PERIOD[p - 2] || 0)) - g; // 0 for the noble gas
  return tail < 6 ? p + 'p' : (p - 1) + 'd';
};
const rows = [], miss = [], part = []; let ok = 0;
for (const a of ATOMS) {
  const e = man.elements.find((x) => x.sym === a.symbol), drawn = e ? e.orbital.split('_')[0] : '—', b = blockSubshell(a.Z), want = b.n + L[b.l], s = seat(a.Z);
  const row = `| ${a.Z} | ${a.symbol} | ${a.core} | **${want}${sup(b.occ)}** | ${drawn} | ${s === want ? s : s + ' ≠'} |`;
  rows.push(row); if (drawn === want) ok++; else miss.push(row); if (s !== want) part.push(row);
}
const head = '| Z | el | configuration | subshell (the rule) | tile drew | seat says |\n|---|---|---|---|---|---|\n';
console.log(`${ok} of ${ATOMS.length} match, ${miss.length} mismatch · the seat and the rule part at ${part.length}\n`);
if (miss.length) console.log('MISMATCHES\n' + head + miss.join('\n') + '\n');
console.log('THE SEAT PARTINGS (the configuration rules)\n' + head + part.join('\n'));
if (ALL) console.log('\nEVERY ELEMENT\n' + head + rows.join('\n'));
process.exit(miss.length ? 1 : 0);
