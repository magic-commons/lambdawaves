/* tools/tile-check.mjs — THE CHECK (iteration 011 Q3), run from the repo root: the subshell each el- tile drew (the manifest's `orbital`, written by menu-thumbs from valenceOf at render time) against the
   highest occupied subshell of groundConfig: highest n, then the highest l within it.  Prints a markdown table of every mismatch. */
import { readFileSync } from 'node:fs';
import { groundConfig, ATOMS } from '../lab/atoms.js';
const man = JSON.parse(readFileSync(process.argv[2] || 'lab/img/menu/manifest.json', 'utf8'));
const L = 'spdf', sup = (k) => String(k).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
const highest = (Z) => groundConfig(Z).slice().sort((a, b) => b.n - a.n || b.l - a.l)[0];
const rows = []; let ok = 0;
for (const a of ATOMS) {
  const e = man.elements.find((x) => x.sym === a.symbol), drawn = e ? e.orbital.split('_')[0] : '—', h = highest(a.Z), want = h.n + L[h.l];
  if (drawn === want) { ok++; continue; }
  rows.push(`| ${a.Z} | ${a.symbol} | ${a.core} | ${drawn} | **${want}${sup(h.occ)}** |${a.exception ? ' exception |' : ' |'}`);
}
console.log(`${ok} match, ${rows.length} mismatch\n\n| Z | el | configuration | tile drew | highest (fix) | |\n|---|---|---|---|---|---|\n` + rows.join('\n'));
