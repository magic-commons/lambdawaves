import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
import { createRTHF } from '../../../lab/density.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
for (const integrator of ['magnus2', 'mmut']) {
  const rt = createRTHF({ n, S: mol.S, h: mol.h, eri: mol.eri, Z: mol.M[2], Enuc: mol.Enuc, nuclearDipole: mol.nuclearDipole[2], nElectrons: 10, D0: s.D, dt: 0.01, integrator, restartEvery: 50 });
  rt.kick(1e-3);
  for (let k = 0; k < 3000; k++) rt.step(0.01);                    // warm the JIT
  const t0 = process.hrtime.bigint(); for (let k = 0; k < 20000; k++) rt.step(0.01);
  console.log(integrator, (Number(process.hrtime.bigint() - t0) / 20000 / 1000).toFixed(1), 'µs/step (warm)');
}
