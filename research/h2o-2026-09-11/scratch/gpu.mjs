/* gpu.mjs — the numbers behind Sol's 96³ field claim: AO values at the nuclei, the density dynamic range, and the
 * cull radius of every contracted AO at a 1e-6 display threshold. */
import { readFileSync } from 'node:fs';
import { molecule, shellsFromBSE, buildBasis, CART, primNorm } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n, bfs = mol.basis.bfs;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
const chi = (bf, r) => { const dx = r[0] - bf.c[0], dy = r[1] - bf.c[1], dz = r[2] - bf.c[2], r2 = dx*dx+dy*dy+dz*dz;
  let g = 0; for (let i = 0; i < bf.exps.length; i++) g += bf.d[i] * Math.exp(-bf.exps[i] * r2);
  return g * Math.pow(dx, bf.l[0]) * Math.pow(dy, bf.l[1]) * Math.pow(dz, bf.l[2]); };
const rho = (r) => { const v = bfs.map((b) => chi(b, r)); let d = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d += s.D[i * n + j] * v[i] * v[j]; return d; };
console.log('ρ at the O nucleus   =', rho(H2O[0].c).toFixed(4), 'a.u.');
console.log('ρ at an H nucleus    =', rho(H2O[1].c).toFixed(4));
console.log('ρ at the O–H midpoint=', rho(H2O[0].c.map((x, k) => 0.5 * (x + H2O[1].c[k]))).toFixed(6));
const far = H2O[0].c.map((x, k) => x + (k === 2 ? 12 : 0));
console.log('ρ 12 bohr out on z   =', rho(far).toExponential(3));
console.log('dynamic range O nucleus / 1e-6 display floor =', (rho(H2O[0].c) / 1e-6).toExponential(2));
console.log('f16: max 65504, min normal 6.1e-5, mantissa 11 bits → relative step 4.9e-4');
const lab = ['O1s','O2s','O2px','O2py','O2pz','H1s','H1s'];
bfs.forEach((b, k) => {
  const amin = Math.min(...b.exps), A = b.d.reduce((t, v) => t + Math.abs(v), 0);
  const L = b.l[0] + b.l[1] + b.l[2];
  let r = 1; for (let it = 0; it < 200; it++) r = Math.sqrt(Math.log(A * Math.pow(Math.max(r, 1e-3), L) / 1e-6) / amin);
  console.log(`  ${lab[k].padEnd(5)} α_min ${amin.toFixed(6).padStart(10)}  Σ|d| ${A.toFixed(4).padStart(8)}  cull radius (envelope < 1e-6) ${r.toFixed(3)} bohr`);
});
const V = 96 ** 3;
console.log(`96³ = ${V} voxels; 7-layer r32float = ${(V*7*4/1e6).toFixed(3)} MB = ${(V*7*4/2**20).toFixed(2)} MiB`);
console.log(`distinct primitive exponentials per voxel: O 1s 3 + O sp 3 (shared by 2s,2p_x,2p_y,2p_z) + H 3 + H 3 = 12`);
