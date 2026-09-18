// prep.mjs — dump RHF + singlet TDA/RPA data from the SNAPSHOT of lab/ (git HEAD, see snapshot/HEAD.txt) so the
// Python oracles and the gauge tests read one frozen file per molecule.  Nothing under lab/ is imported live.
// Run: node prep.mjs [ids...]      writes data/<id>.json
import fs from 'node:fs';
import { moleculeRHF, registerRecord } from './snapshot/lab/rhf-molecule.js';
import { moleculeAtoms, moleculeCharge } from './snapshot/lab/molecules.js';
import { rpa } from './snapshot/lab/rpa-inspector.js';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
registerRecord('sto-3g', JSON.parse(read('./snapshot/lab/vendor/bse/sto-3g-v1.json')));
fs.mkdirSync(new URL('./data/', import.meta.url), { recursive: true });

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['H2O', 'NH3', 'CH4', 'C6H6'];
for (const id of ids) {
  const atoms = moleculeAtoms(id), charge = moleculeCharge(id);
  const sol = moleculeRHF({ atoms, basis: 'sto-3g', charge, detect: false, stability: false, hessian: false });
  const I = sol.integrals, n = I.n, nocc = sol.nocc, nv = n - nocc, m = nocc * nv;
  const R = rpa({ S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc });
  // MO-basis position matrices r_pq = Σ_uv C_up M_uv C_vq (full n×n, all three axes)
  const rMO = [I.X, I.Y, I.Z].map((M) => {
    const T = new Float64Array(n * n);
    for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) {
      let s = 0; for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) s += sol.C[u * n + p] * M[u * n + w] * sol.C[w * n + q];
      T[p * n + q] = s;
    }
    return [...T];
  });
  const out = {
    id, source: 'research/molecular-waves-2026-09-18/proving/prep.mjs on snapshot/lab (git HEAD ' + read('./snapshot/HEAD.txt').trim() + ')',
    atoms: atoms.map((a) => ({ Z: a.Z, c: [a.x, a.y, a.z] })), charge, n, nocc, nvir: nv, pairSpace: m,
    energy: sol.energy, eps: [...sol.orbitalEnergies], C: [...sol.C], S: [...I.S],
    aoDipole: { x: [...I.X], y: [...I.Y], z: [...I.Z] }, nuclearDipole: [...I.nuclearDipole],
    moDipole: { x: rMO[0], y: rMO[1], z: rMO[2] },
    pairs: R.pairs.map((p) => [p.i, p.a]),
    omegaTDA: R.roots.map((r) => r.omegaTDA), XTDA: R.roots.map((r) => [...r.XTDA]),
    muTDA: R.roots.map((r) => r.muTDA), fTDA: R.roots.map((r) => r.fTDA),
    omegaRPA: R.roots.map((r) => r.omega), fRPA: R.roots.map((r) => r.f), muRPA: R.roots.map((r) => r.mu),
  };
  fs.writeFileSync(new URL(`./data/${id}.json`, import.meta.url), JSON.stringify(out));
  console.log(id, 'n', n, 'nocc', nocc, 'pairs', m, 'E', sol.energy.toFixed(10), 'ω1(TDA)', out.omegaTDA[0].toFixed(8));
}
