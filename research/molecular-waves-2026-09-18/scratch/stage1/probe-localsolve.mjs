// Scratch — what the no-Worker fallback road now costs and answers, against what the worker road answers.
//   node research/molecular-waves-2026-09-18/scratch/stage1/probe-localsolve.mjs
import fs from 'node:fs';
import { moleculeRHF, registerRecord, stabilityHessian } from '../../../../lab/rhf-molecule.js';
import { moleculeAtoms, moleculeCharge } from '../../../../lab/molecules.js';
registerRecord('sto-3g', JSON.parse(fs.readFileSync(new URL('../../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));

for (const id of ['H2O', 'C6H6']) {
  const atoms = moleculeAtoms(id), charge = moleculeCharge(id);
  const t0 = performance.now();
  const off = moleculeRHF({ atoms, basis: 'sto-3g', charge, detect: false, stability: false, hessian: false });   // the OLD fallback
  const tOff = performance.now() - t0;
  const t1 = performance.now();
  const on = moleculeRHF({ atoms, basis: 'sto-3g', charge, detect: false });                                     // the NEW fallback
  const tOn = performance.now() - t1;
  const t2 = performance.now();
  const H = stabilityHessian(on.integrals, on, on.nocc);                                                          // the verdict alone
  const tH = performance.now() - t2;
  console.log(`${id.padEnd(5)} E ${on.energy.toFixed(9)} (same as before: ${off.energy === on.energy})`
    + `  stability before ${JSON.stringify(off.stability)}  after minimum=${on.stability.minimum}`
    + ` ApB=${on.stability.hessian.positiveDefinite.ApB} AmB=${on.stability.hessian.positiveDefinite.AmB} nOv=${on.stability.hessian.nOv}`
    + `  probe same=${on.stability.same} iters=${on.stability.iterations}`
    + `  |  solve without verdict ${tOff.toFixed(0)} ms, with ${tOn.toFixed(0)} ms, the Cholesky verdict alone ${tH.toFixed(1)} ms`);
}
