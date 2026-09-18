// Scratch — inside the OLD tree's first Magnus-2 step on benzene: which matrix loses unitarity?
import fs from 'node:fs';
import { moleculeRHF, registerRecord } from '../../../lab/rhf-molecule.js';
import { moleculeAtoms } from '../../../lab/molecules.js';
import { createRTHF as oldRT, hermitianEigen as oldEig, unitaryOf as oldU, magnus2 as oldMagnus, cmat, cmul, cadj, creal, sandwich, loewdin, idempotencyDefect } from './old/lab/density.js';
registerRecord('sto-3g', JSON.parse(fs.readFileSync(new URL('../../../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const sol = moleculeRHF({ atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0, detect: false, stability: false, hessian: false });
const I = sol.integrals, n = I.n, { X } = loewdin(I.S, n), dt = 0.01;
const e = oldRT({ n, S: I.S, h: I.h, eri: I.eri, Z: I.Z, mu: [I.X, I.Y, I.Z], Enuc: I.Enuc, nuclearDipole: I.nuclearDipole[2],
  nElectrons: sol.nElectrons, D0: sol.D, dt, integrator: 'mmut', restartEvery: Infinity });
e.kickAlong('z', 1e-3);
const P = e.P;
const fockAO = (D) => { const F = cmat(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let fr = I.h[i * n + j], fi = 0;
    for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) { const J = I.eri[((i * n + j) * n + k) * n + l], K = 0.5 * I.eri[((i * n + l) * n + k) * n + j];
      fr += D.re[k * n + l] * J - D.re[l * n + k] * K; fi += D.im[k * n + l] * J - D.im[l * n + k] * K; }
    F.re[i * n + j] = fr; F.im[i * n + j] = fi; } return F; };
const fockL = (Pm) => sandwich(X, fockAO(sandwich(X, Pm)));
const uDef = (U) => { const G = cmul(U, cadj(U)); let d = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d = Math.max(d, Math.abs(G.re[i * n + j] - (i === j ? 1 : 0)), Math.abs(G.im[i * n + j])); return d; };
const degOf = (A) => { const w = oldEig(A).w; let d = 0; for (let k = 1; k < n; k++) if (Math.abs(w[k] - w[k - 1]) < 1e-9) d++; return d; };
const F0 = fockL(P), U0 = oldU(F0, dt);
const Pstar = cmul(cmul(U0, P), cadj(U0));
const F1 = fockL(Pstar), Fbar = cmat(n);
for (let k = 0; k < n * n; k++) { Fbar.re[k] = 0.5 * (F0.re[k] + F1.re[k]); Fbar.im[k] = 0.5 * (F0.im[k] + F1.im[k]); }
const Ub = oldU(Fbar, dt);
console.log('P kicked idem', idempotencyDefect(P, 2).toExponential(2));
console.log('F0 deg', degOf(F0), 'UU†−I', uDef(U0).toExponential(2), '→ Pstar idem', idempotencyDefect(Pstar, 2).toExponential(2));
console.log('Fbar deg', degOf(Fbar), 'UU†−I', uDef(Ub).toExponential(2));
const r = oldMagnus({ P, t: 0, dt, fock: (Pm) => fockL(Pm) });
console.log('magnus2 → idem', idempotencyDefect(r.P, 2).toExponential(2));
/* the step the ENGINE takes, with its own fock (field(t) term included) */
e.step();
console.log('engine step → idem', idempotencyDefect(e.P, 2).toExponential(2));
