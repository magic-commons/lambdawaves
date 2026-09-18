// Scratch — the isolation experiment for CuH/ZnH2: SHIPPED code (old/), SHIPPED + only the QL dispatch (old-ql/).
//   node research/molecular-waves-2026-09-18/scratch/probe-old-two.mjs
// old-ql/lab/h2ci.js differs from old/lab/h2ci.js by two lines: an import of lab/linalg.js and
// `if (n >= 8) return eigSymQL(A, n);` at the head of eigSym.  Nothing else in either tree is touched.
import fs from 'node:fs';
import { moleculeRHF as oldRHF, registerRecord as oldRegister } from './old/lab/rhf-molecule.js';
import { moleculeRHF as qlRHF, registerRecord as qlRegister } from './old-ql/lab/rhf-molecule.js';
import { moleculeAtoms, moleculeCharge } from '../../../lab/molecules.js';
const rec = JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
oldRegister('sto-3g', rec); qlRegister('sto-3g', rec);
for (const [tag, f] of [['shipped (Jacobi)', oldRHF], ['shipped + QL dispatch', qlRHF]]) {
  for (const id of ['CuH', 'ZnH2']) {
    const s = f({ atoms: moleculeAtoms(id), basis: 'sto-3g', charge: moleculeCharge(id), detect: false, stability: false, hessian: false });
    console.log(`${tag.padEnd(22)} ${id.padEnd(5)} E ${s.energy.toFixed(9)}  converged ${s.converged}  iterations ${s.iterations}  gap ${s.aufbau.gap.toFixed(6)}`);
  }
}
