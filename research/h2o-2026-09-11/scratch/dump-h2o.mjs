/* dump-h2o.mjs — H₂O STO-3G matrices from md.mjs → md-h2o.json (coordinates included, so PySCF gets the same bits) */
import { readFileSync, writeFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const t0 = Date.now(), m = molecule(bse, H2O), ms = Date.now() - t0;
writeFileSync(new URL('./md-h2o.json', import.meta.url), JSON.stringify({
  n: m.n, atoms: H2O, S: [...m.S], T: [...m.T], V: [...m.V], Mx: [...m.M[0]], My: [...m.M[1]], Mz: [...m.M[2]],
  eri: [...m.eri], Enuc: m.Enuc, nuclearDipole: m.nuclearDipole, ms,
}));
console.log('n =', m.n, 'Enuc =', m.Enuc.toFixed(12), 'build', ms, 'ms');
