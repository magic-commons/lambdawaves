/* rks.test.mjs — 0.7.3 K1 THE LDA ENGINE against PySCF RKS 'lda,vwn' on the same grid (tests/fixtures/oracles/rks-v1.json, tools/library/rks-oracle.py),
 * the grid's weight law, and THE LOCK: water's RHF D through the untouched closed-shell loop is the base's to the last bit.
 *   node tests/rks.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { moleculeRHF, registerRecord } from '../lab/rhf-molecule.js';
import { moleculeAtoms } from '../lab/molecules.js';
import { molecularGrid } from '../lab/dft-grid.js';
import { chemRegister, chemGround, chemSpectrum, chemRtInit, chemDriveInit } from '../lab/mathworker.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8')), rec = read('../lab/vendor/bse/sto-3g-v1.json');
registerRecord('sto-3g', rec); chemRegister('sto-3g', rec);
const fx = read('./fixtures/oracles/rks-v1.json'), sha = (a) => createHash('sha256').update(Buffer.from(Float64Array.from(a).buffer)).digest('hex');
assert.equal(fx.provenance.bse_sha256, createHash('sha256').update(readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url))).digest('hex'), 'the oracle ran on these decimals');

/* 1. the grid's weight law: ∫ e^{−|r−c|²} d³r = π^{3/2} on water's grid, about the origin and about the oxygen */
const water = moleculeAtoms('H2O'), g = molecularGrid(water);
for (const c of [{ x: 0, y: 0, z: 0 }, water[0]]) {
  let s = 0; for (let i = 0; i < g.w.length; i++) s += g.w[i] * Math.exp(-((g.x[i] - c.x) ** 2 + (g.y[i] - c.y) ** 2 + (g.z[i] - c.z) ** 2));
  assert.ok(Math.abs(s - Math.PI ** 1.5) <= 1e-6, `∫e^{−r²} = ${s} vs π^{3/2}`);
}
console.log(`PASS the grid: ${g.w.length} points for water (3 × 75 × 302), ∫e^{−r²} = π^{3/2} to 1e-6 about the origin and the oxygen`);

/* 2. every oracle molecule: E ≤ 1e-6 Eh (the gate on water and benzene; held on all eight), ∫ρ = N to 1e-4, E_xc and the point count PySCF's */
const rows = [];
for (const [id, o] of Object.entries(fx.molecules)) {
  const atoms = moleculeAtoms(id), t = performance.now(), s = moleculeRHF({ atoms, model: 'lda' }), ms = performance.now() - t;
  assert.deepEqual(atoms, o.atoms, `${id}: the oracle ran on the app's atoms`);
  assert.equal(s.model, 'RKS LDA'); assert.equal(s.stability, null); assert.equal(s.hessian, null); assert.ok(s.converged && o.converged, `${id}: converged`); assert.equal(s.gridPoints, atoms.length * 75 * 302);
  assert.ok(o.pyscfPoints - s.gridPoints < 8, `${id}: PySCF's grid is ours plus its padding to 8`);
  const dE = Math.abs(s.energy - o.energy), dX = Math.abs(s.exc - o.exc), dN = Math.abs(s.intRho - o.nElectrons);
  assert.ok(dE <= 1e-6 && dX <= 1e-6 && dN <= 1e-4, `${id}: |ΔE| ${dE.toExponential(1)} · |ΔE_xc| ${dX.toExponential(1)} · |∫ρ − N| ${dN.toExponential(1)}`);
  rows.push(`${id} E ${s.energy.toFixed(9)} (Δ ${dE.toExponential(0)}) E_xc ${s.exc.toFixed(6)} ∫ρ ${s.intRho.toFixed(6)} · ${s.gridPoints} pts ${s.gridMs.toFixed(0)} ms · ${s.iterations} it ${ms.toFixed(0)} ms`);
}
console.log(`PASS ${rows.length} molecules agree with PySCF RKS lda,vwn (≤ 1e-6 Eh, E_xc ≤ 1e-6, ∫ρ = N ≤ 1e-4):\n  ${rows.join('\n  ')}`);

/* 3. THE LOCK: model absent is RHF through the untouched loop — water's D is the base's (tests/uhf.test.mjs' sha) */
const r = moleculeRHF({ atoms: water });
assert.equal(r.model, undefined); assert.equal(sha(r.D), '7795fc4cd7548d38a0387ef5524418e7362f226230baa8ba125a248574d56d26'); assert.equal(r.energy, -74.96302316286258);
console.log('PASS THE LOCK: water RHF D and E are the base\'s bit for bit; an LDA solve builds its grid only under model \'lda\'');

/* 4. the worker: chem.ground { model: 'lda' } is keyed apart from RHF, and RT, TDA, the drive and the register stand down with their sentence */
const rhf = chemGround({ atoms: water }), lda = chemGround({ atoms: water, model: 'lda' }), again = chemGround({ atoms: water });
assert.equal(lda.model, 'RKS LDA'); assert.equal(rhf.model, undefined); assert.equal(again.energy, rhf.energy); assert.ok(Math.abs(lda.energy - fx.molecules.H2O.energy) <= 1e-6);
assert.ok(lda.exc < 0 && Math.abs(lda.intRho - 10) <= 1e-4 && lda.gridPoints === g.w.length && lda.gridMs >= 0);
for (const f of [() => chemSpectrum({ atoms: water, model: 'lda' }), () => chemRtInit({ atoms: water, model: 'lda' }), () => chemDriveInit({})]) assert.throws(f, /stands? down under RKS LDA: (its|their) operators/);
assert.throws(() => chemGround({ atoms: moleculeAtoms('OH'), multiplicity: 2, model: 'lda' }), /LDA is closed-shell/);
console.log('PASS the worker: RHF and LDA solves of one key are kept apart; TDA, RT and the drive refuse an LDA solve with their sentence; an open shell is refused');
