/* fixgen-check.mjs — cross-check tests/fixtures/h2o-response.json (PySCF) against the certified scratch engine. */
import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const fx = JSON.parse(readFileSync(new URL('../../../tests/fixtures/h2o-response.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const worst = (a, b) => { let w = 0; for (let k = 0; k < a.length; k++) w = Math.max(w, Math.abs(a[k] - b[k])); return w; };
console.log('n', n, fx.n);
for (const k of ['S', 'T', 'V', 'h']) console.log(`  max|md - PySCF| ${k} = ${worst(mol[k], fx[k]).toExponential(2)}`);
console.log(`  max|md - PySCF| eri = ${worst(mol.eri, fx.eri).toExponential(2)}`);
for (const [i, q] of ['x', 'y', 'z'].entries()) console.log(`  max|md - PySCF| dipole ${q} = ${worst(mol.M[i], fx.dipole[q]).toExponential(2)}`);
console.log(`  Enuc ${Math.abs(mol.Enuc - fx.geometry.Enuc).toExponential(2)}`);
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
console.log(`  E: lab/scf.js ${s.energy.toFixed(12)} vs fixture ${fx.E.toFixed(12)}  Δ = ${Math.abs(s.energy - fx.E).toExponential(2)}`);
console.log(`  eps max|Δ| = ${worst(s.orbitalEnergies, fx.eps).toExponential(2)}   D max|Δ| = ${worst(s.D, fx.D).toExponential(2)}`);
