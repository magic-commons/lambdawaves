/* bench-md-both.mjs — before/after integrals() on H₂O and benzene: cold first call and best of N */
import { readFileSync } from 'node:fs';
const rec = JSON.parse(readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
const h2o = [[8, 0, 0, 0.1173], [1, 0, 0.7572, -0.4692], [1, 0, -0.7572, -0.4692]];
const benz = (() => { const o = []; for (let k = 0; k < 6; k++) { const t = k * Math.PI / 3;
  o.push([6, 1.39 * Math.cos(t), 1.39 * Math.sin(t), 0]); o.push([1, 2.48 * Math.cos(t), 2.48 * Math.sin(t), 0]); } return o; })();
for (const [tag, path] of [['before (HEAD)', './md-baseline.mjs'], ['after  (lab/md.js)', '../../../lab/md.js']]) {
  const M = await import(new URL(path, import.meta.url).href);
  for (const [name, rows, reps] of [['H2O  ', h2o, 8], ['C6H6 ', benz, 3]]) {
    const atoms = rows.map(([Z, x, y, z]) => ({ Z, x: x * M.ANGSTROM, y: y * M.ANGSTROM, z: z * M.ANGSTROM }));
    const b = M.basisFrom(atoms, rec, { cart: true });
    let cold = 0, best = Infinity, se = 0;
    for (let r = 0; r < reps; r++) { const t0 = performance.now(); const I = M.integrals(b, atoms); const dt = performance.now() - t0;
      if (r === 0) { cold = dt; se = 0; for (let k = 0; k < I.eri.length; k++) se += I.eri[k]; } best = Math.min(best, dt); }
    console.log(`${tag.padEnd(19)} ${name} n=${String(b.n).padStart(2)}  cold ${cold.toFixed(1).padStart(8)} ms   best-of-${reps} ${best.toFixed(1).padStart(8)} ms   Σeri ${se.toFixed(9)}`);
  }
}
