/* boys-sweep.mjs — F_0..F_8 from every candidate plan on the sweep grid → boys-sweep.txt for the mpmath referee. */
import { writeFileSync } from 'node:fs';
import { boysTable } from './md.mjs';
const MM = 8, grid = [];
for (let i = 0; i <= 6000; i++) grid.push(i * 0.01);                          // linear, step 0.01 on [0, 60]
const lo = Math.log(60), hi = Math.log(1e4);
for (let i = 1; i <= 600; i++) grid.push(Math.exp(lo + (hi - lo) * i / 600)); // logarithmic on (60, 1e4]
for (const t of [0.5, 44, 0.49999999, 0.50000001, 43.99999999, 44.00000001, 1e-12, 1e-8]) grid.push(t);
grid.sort((a, b) => a - b);
const variants = [
  ['opus', (t) => boysTable(MM, t, 'opus')],
  ['sol', (t) => boysTable(MM, t, 'sol')],
  ['kummer', (t) => boysTable(MM, t, 'kummer')],
  ['stop2m70', (t) => boysTable(MM, t, 'opus', Math.pow(2, -70))],
  ['sw26', (t) => boysTable(MM, t, 'sol', Math.pow(2, -55), 26)],            // Sol's per-m asymptotic, switch 26
  ['sw120', (t) => boysTable(MM, t, 'sol', Math.pow(2, -55), 120)],          // … and switch 120
];
const lines = ['# t ' + variants.map(([n]) => n).join(' ') + '  (each: F_0..F_' + MM + ')'];
for (const t of grid) {
  const row = [t.toPrecision(17)];
  for (const [, f] of variants) row.push([...f(t)].map((x) => x.toExponential(17)).join(','));
  lines.push(row.join(' '));
}
writeFileSync(new URL('./boys-sweep.txt', import.meta.url), lines.join('\n'));
console.log('grid points', grid.length, 'variants', variants.length, 'mmax', MM);
