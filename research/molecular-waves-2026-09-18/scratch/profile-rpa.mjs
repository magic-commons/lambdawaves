// Scratch — where benzene's RPA second goes, piece by piece.
import fs from 'node:fs';
import { moleculeRHF, registerRecord } from '../../../lab/rhf-molecule.js';
import { moleculeAtoms } from '../../../lab/molecules.js';
import { hessianBlocks, rpa } from '../../../lab/rpa-inspector.js';
import { eigSym } from '../../../lab/h2ci.js';
import { cholesky } from '../../../lab/linalg.js';
registerRecord('sto-3g', JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const clock = (fn) => { const t = performance.now(), v = fn(); return { v, ms: +(performance.now() - t).toFixed(1) }; };
const sol = moleculeRHF({ atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0, detect: false, stability: false, hessian: false });
const I = sol.integrals, n = I.n, nocc = sol.nocc, m = nocc * (n - nocc);
const args = { S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc };
rpa(args);                                                              // warm
const blocks = clock(() => hessianBlocks({ eri: I.eri, C: sol.C, eps: sol.orbitalEnergies, nocc, n }));
const { A, B } = blocks.v;
const AmB = new Float64Array(m * m), ApB = new Float64Array(m * m);
for (let k = 0; k < m * m; k++) { AmB[k] = A[k] - B[k]; ApB[k] = A[k] + B[k]; }
const chol = clock(() => cholesky(AmB, m));
const eig = clock(() => eigSym(ApB, m));
const whole = clock(() => rpa(args));
const noResid = clock(() => rpa({ ...args, S: null, h: null }));
const withTda = clock(() => { const R = rpa(args); return R.tda.length; });
console.log(JSON.stringify({ m, blocksMs: blocks.ms, choleskyMs: chol.ms, oneEigMs: eig.ms, wholeRpaMs: whole.ms,
  rpaWithoutResidualMs: noResid.ms, rpaPlusTdaMs: withTda.ms }));
