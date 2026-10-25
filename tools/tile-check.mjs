/* tools/tile-check.mjs — THE CHECK (iteration 011 Q3; re-aimed by Q3b), run from the repo root: the subshell each el- tile drew (the
   manifest's `orbital`, written by menu-thumbs from valenceOf at render time) against THE BLOCK'S ORBITAL of lab/valence.js
   (`blockSubshell`: an open f shell, else the occupied subshell last in Madelung order).  A second, independent column: the subshell the
   element's SEAT in the table names (s block ns, p block np, d block (n−1)d, the two f rows (n−2)f) — where the seat and the rule part,
   the configuration is why (La/Ac/Th hold no f, Lu/Lr close theirs).  Prints every row (Z · symbol · configuration · subshell) with
   `--all`, else the mismatches and the seat partings.
   THE 140 (iteration 015 M3): every hydrogen.js BASIS label has its picture beside the manifest, orb-<nl>_<m>.webp (Im ψ) and each variant the
   manifest's `variants.orbitals` names (density, phase) — the Picker's HYDROGEN deck reads them. */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { BASIS } from '../lab/hydrogen.js';
import { L_LETTERS } from '../lab/names.js';
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
const dir = file.replace(/[^/]*$/, ''), looks = ['', ...((man.variants || {}).orbitals || []).map((v) => '.' + v)];
const lost = BASIS.flatMap((b) => looks.map((v) => `orb-${b.n}${L_LETTERS[b.l]}_${b.m}${v}.webp`)).filter((f) => !existsSync(dir + f));
console.log(`\nTHE 140: ${BASIS.length * looks.length - lost.length} of ${BASIS.length * looks.length} pictures (${looks.map((v) => v || 'im').join(' · ')})` + (lost.length ? ' · missing ' + lost.slice(0, 12).join(' ') + (lost.length > 12 ? ' …' : '') : ''));
/* iteration 016 L3 · THE FILL: each of THE 140's pictures fills its square (Josh, call 15: "1s reads about as big as 7f") — the side of its alpha box
   (alpha > 25) over the picture's side, by PIL; a picture under 0.8 is named */
const files = BASIS.flatMap((b) => looks.map((v) => `orb-${b.n}${L_LETTERS[b.l]}_${b.m}${v}.webp`)).filter((f) => existsSync(dir + f));
const py = spawnSync('python3', ['-I', '-c', 'import sys,json\nfrom PIL import Image\nout={}\nfor f in sys.argv[2:]:\n a=Image.open(sys.argv[1]+f).getchannel("A"); b=a.point(lambda v:255 if v>25 else 0).getbbox()\n out[f]=round(max(b[2]-b[0],b[3]-b[1])/a.width,3) if b else 0\nprint(json.dumps(out))', dir, ...files], { encoding: 'utf8', maxBuffer: 1 << 24 });
let thin = [];
if (py.status === 0) { const fill = Object.entries(JSON.parse(py.stdout)), v = fill.map((x) => x[1]); thin = fill.filter((x) => x[1] < 0.8);
  console.log(`THE FILL: ${fill.length} pictures · side ${Math.min(...v).toFixed(3)} … ${Math.max(...v).toFixed(3)} of the square (mean ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(3)})` + (thin.length ? ' · under 0.8: ' + thin.map((x) => x[0]).slice(0, 12).join(' ') : ''));
} else console.log('THE FILL: not measured (python3 with PIL) · ' + String(py.stderr).slice(0, 200));
process.exit(miss.length || lost.length || thin.length ? 1 : 0);
