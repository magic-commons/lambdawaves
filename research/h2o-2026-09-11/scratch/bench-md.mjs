/* bench-md.mjs — times integrals() on H₂O and benzene for whichever md module MD_MOD names.  MD_MOD=../../../lab/md.js */
import { readFileSync } from 'node:fs';
const MOD = process.env.MD_MOD || '../../../lab/md.js';
const { basisFrom, integrals, ANGSTROM } = await import(new URL(MOD, import.meta.url).href);
const rec = JSON.parse(readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));

const h2o = [[8, 0, 0, 0.1173], [1, 0, 0.7572, -0.4692], [1, 0, -0.7572, -0.4692]];
const benz = (() => { const o = []; for (let k = 0; k < 6; k++) { const t = k * Math.PI / 3;
  o.push([6, 1.39 * Math.cos(t), 1.39 * Math.sin(t), 0]); o.push([1, 2.48 * Math.cos(t), 2.48 * Math.sin(t), 0]); } return o; })();
const ang = (rows) => rows.map(([Z, x, y, z]) => ({ Z, x: x * ANGSTROM, y: y * ANGSTROM, z: z * ANGSTROM }));

const cases = [['H2O', ang(h2o), Number(process.env.REP_H2O ?? 3)], ['C6H6', ang(benz), Number(process.env.REP_BENZ ?? 1)]];
const out = {};
for (const [name, atoms, reps] of cases) {
  const b = basisFrom(atoms, rec, { cart: true });
  let best = Infinity, I = null;
  for (let r = 0; r < reps; r++) { const t0 = performance.now(); I = integrals(b, atoms); const dt = performance.now() - t0; best = Math.min(best, dt); }
  let sS = 0, sh = 0, se = 0;                                              // checksums, so a fast wrong answer is visible
  for (let k = 0; k < I.S.length; k++) { sS += I.S[k]; sh += I.h[k]; }
  for (let k = 0; k < I.eri.length; k++) se += I.eri[k];
  out[name] = { n: b.n, shells: b.shells.length, ms: best, sS, sh, se };
  console.log(`${name.padEnd(5)} n=${String(b.n).padStart(2)} shells=${String(b.shells.length).padStart(2)}  integrals() ${best.toFixed(1)} ms   ΣS ${sS.toFixed(12)}  Σh ${sh.toFixed(9)}  Σeri ${se.toFixed(9)}`);
}
if (globalThis.__MD_STATS) console.log('stats', JSON.stringify(globalThis.__MD_STATS));
console.log(JSON.stringify(out));
