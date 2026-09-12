import assert from 'node:assert/strict';
import { sBasis, sto3g1s, ZETA } from '../lab/gaussian.js';
import { rhf } from '../lab/scf.js';
import { sto3gH2, sto3gIntegrals, eriTensor } from '../lab/h2ci.js';
import { readFileSync } from 'node:fs';
const oracle = JSON.parse(readFileSync(new URL('../research/chronusq-2026-09-11/oracle-pyscf.json', import.meta.url)));

const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b} (tol ${tol})`);
const H = (z) => ({ z, Z: 1, ...sto3g1s(ZETA.H) }), He = (z) => ({ z, Z: 2, ...sto3g1s(ZETA.He) });

/* 1. Two independent integral codes agree: gaussian.js (general) vs h2ci.js (homonuclear closed loop). */
{
  const R = 1.4, g = sBasis([H(-R / 2), H(R / 2)]), i = sto3gIntegrals(R), t = eriTensor(i.eri);
  close(g.S[1], i.S, 1e-13, 'overlap'); for (let k = 0; k < 4; k++) close(g.h[k], i.h[k], 1e-12, 'core h[' + k + ']');
  for (let k = 0; k < 16; k++) close(g.eri[k], t[k], 1e-12, 'eri[' + k + ']');
  close(g.Z[0], -R / 2, 1e-13, 'dipole aa'); close(g.Z[3], R / 2, 1e-13, 'dipole bb'); close(g.Z[1], 0, 1e-13, 'dipole ab');
  console.log('PASS gaussian.js reproduces h2ci.js STO-3G integrals (S, h, all 16 (ij|kl), dipole).');
}

/* 2. H₂ STO-3G RHF at R = 1.4: Szabo–Ostlund −1.116714 (KNOWN) and h2ci's own SCF. */
{
  const R = 1.4, b = sBasis([H(-R / 2), H(R / 2)]), out = rhf(b, { nElectrons: 2 });
  assert.ok(out.converged, 'H2 SCF converged');
  close(out.energy, -1.116714, 2e-6, 'H2 RHF vs Szabo–Ostlund');
  close(out.energy, sto3gH2(R).rhf, 1e-10, 'H2 RHF vs h2ci'); close(out.energy, oracle.H2.E_rhf, 1e-9, 'H2 RHF vs PySCF');
  console.log(`PASS H2 STO-3G RHF = ${out.energy.toFixed(9)} in ${out.iterations} cycles (DIIS ${out.diisUsed}).`);
}

/* 3. HeH⁺ STO-3G at R = 1.4632 (Szabo–Ostlund §3.5.2): E_total = −2.8606 (KNOWN, 4 dp in the book). Invariants. */
{
  const R = 1.4632, b = sBasis([He(0), H(R)]), out = rhf(b, { nElectrons: 2 }), n = 2;
  assert.ok(out.converged, 'HeH+ SCF converged');
  close(out.energy, -2.8606, 6e-5, 'HeH+ RHF vs Szabo–Ostlund');
  close(out.energy, oracle['HeH+'].E_rhf, 1e-9, 'HeH+ RHF vs PySCF (same primitives)'); close(b.S[1], oracle['HeH+'].S_ab, 1e-10, 'HeH+ overlap vs PySCF');
  for (let k = 0; k < 2; k++) close(out.orbitalEnergies[k], oracle['HeH+'].mo_energy[k], 1e-8, 'HeH+ ε vs PySCF');
  let ez = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) ez += out.D[i * 2 + j] * b.Z[j * 2 + i]; close(-ez, oracle['HeH+'].dipole_z_electron, 1e-8, 'HeH+ electron dipole vs PySCF');
  close(out.error, 0, 1e-10, 'commutator [F, DS] at convergence');
  let trDS = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) trDS += out.D[i * n + j] * b.S[j * n + i];
  close(trDS, 2, 1e-12, 'Tr(DS) = N');
  const Q = out.D.map((v) => v / 2), Q2 = new Float64Array(4);                 // (D/2) S (D/2) = D/2 in a non-orthogonal basis
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) s += Q[i * n + k] * b.S[k * n + l] * Q[l * n + j]; Q2[i * n + j] = s; }
  for (let k = 0; k < 4; k++) close(Q2[k], Q[k], 1e-12, 'idempotency D S D = 2D');
  for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) { let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += out.C[i * n + p] * b.S[i * n + j] * out.C[j * n + q]; close(s, p === q ? 1 : 0, 1e-12, 'CᵀSC'); }
  const plain = rhf(b, { nElectrons: 2, diis: 0 }), damped = rhf(b, { nElectrons: 2, diis: 0, damping: 0.3 });
  close(plain.energy, out.energy, 1e-9, 'plain Roothaan reaches the same energy'); close(damped.energy, out.energy, 1e-9, 'damped Roothaan reaches the same energy');
  assert.ok(out.iterations <= plain.iterations, `DIIS (${out.iterations}) should not need more cycles than plain (${plain.iterations})`);
  const E = out.history.map((h) => h.energy);
  assert.ok(E[E.length - 1] <= E[1] + 1e-12, 'the converged energy is not above the first real iterate (variational)');
  console.log(`PASS HeH+ STO-3G RHF = ${out.energy.toFixed(6)} (SO −2.8606), ε = [${out.orbitalEnergies.map((v) => v.toFixed(5))}], DIIS ${out.iterations} cycles vs plain ${plain.iterations} vs damped ${damped.iterations}.`);
}
