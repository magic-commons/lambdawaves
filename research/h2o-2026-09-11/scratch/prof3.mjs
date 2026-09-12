import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
import { createRTHF, sandwich, loewdin, cmat } from '../../../lab/density.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
const rt = createRTHF({ n, S: mol.S, h: mol.h, eri: mol.eri, Z: mol.M[2], Enuc: mol.Enuc, nuclearDipole: mol.nuclearDipole[2], nElectrons: 10, D0: s.D, dt: 0.01 });
rt.kick(1e-3); for (let k = 0; k < 200; k++) rt.step(0.01);
const { X } = loewdin(mol.S, n), D = sandwich(X, rt.P), h = mol.h, eri = mol.eri, Z = mol.M[2];
function fockReplica(D, E) {
  const F = cmat(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    let fr = h[i * n + j] + (Z ? E * Z[i * n + j] : 0), fi = 0;
    for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) {
      const J = eri[((i * n + j) * n + k) * n + l], K = 0.5 * eri[((i * n + l) * n + k) * n + j];
      fr += D.re[k * n + l] * J - D.re[l * n + k] * K; fi += D.im[k * n + l] * J - D.im[l * n + k] * K;
    }
    F.re[i * n + j] = fr; F.im[i * n + j] = fi;
  }
  return F;
}
const tm = (name, f, N=5000) => { for(let k=0;k<500;k++) f(); const t0=process.hrtime.bigint(); for(let k=0;k<N;k++) f(); console.log(name, (Number(process.hrtime.bigint()-t0)/N/1000).toFixed(1), 'µs'); };
tm('fockAO replica (identical body)', () => fockReplica(D, 0));
console.log('eri is Float64Array:', eri instanceof Float64Array, 'len', eri.length, ' h:', h instanceof Float64Array, ' D.re:', D.re instanceof Float64Array);
