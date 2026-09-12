/* rhf-molecules.test.mjs — B-H2O-2's gate.  The six pinned RHF/STO-3G energies, dipoles and orbital energies are
 * PySCF 2.14.0's on the vendored BSE decimals (lab/oracles/sto-3g-v1.json); the geometry placements are checked
 * against the numbers MATH-H2O ROUND 4 · OPUS §5 printed.  N₂ is the rung that separates the guesses: SAD reaches
 * −107.495887883412, the bare core guess converges instead on a second aufbau RHF solution 0.7298 hartree up.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { moleculeRHF, registerRecord, atomicDensity, atomicOccupations, sadDensity, BASIS_FILES } from '../lab/rhf-molecule.js';
import { basisFrom, integrals } from '../lab/md.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b} (tol ${tol})`);
const raw = readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url));
const record = JSON.parse(raw);
const oracle = read('../lab/oracles/sto-3g-v1.json');
registerRecord('sto-3g', record);

/* 0. Provenance: the oracle was written against the bytes this test loads. */
{
  assert.equal(createHash('sha256').update(raw).digest('hex'), oracle.provenance.bse_sha256, 'the oracle names this record');
  assert.equal(oracle.provenance.bse_version, '1'); assert.equal(oracle.provenance.cart, true);
  assert.equal(oracle.provenance.unit, 'bohr'); assert.equal(oracle.provenance.geometry_role, 'experimental-fixed');
  close(oracle.provenance.ang_to_bohr, 1 / 0.52917721092, 0, 'ang_to_bohr');
  assert.deepEqual(Object.keys(oracle.molecules), ['H2O', 'LiH', 'HF', 'NH3', 'CH4', 'N2'], 'six fixtures');
  assert.deepEqual(Object.keys(BASIS_FILES), ['sto-3g', '6-31+g-star'], 'the two shippable bases');
  console.log(`PASS oracle provenance: PySCF ${oracle.provenance.pyscf}, STO-3G v1 ${oracle.provenance.bse_sha256.slice(0, 8)}…, six fixtures in bohr, geometry role ${oracle.provenance.geometry_role}.`);
}

/* 1. The geometry placements are ROUND 4 · OPUS §5's, to the digits it printed. */
{
  const g = (k) => oracle.molecules[k].geometry, bohr = (k) => oracle.molecules[k].atoms_bohr;
  close(g('NH3').r_NH_angstrom, 1.012, 0, 'NH₃ r_NH'); close(g('NH3').angle_HNH_deg, 106.7, 0, 'NH₃ ∠HNH');
  close(g('NH3').beta_deg, 67.8823396, 5e-8, 'NH₃ β from cos²β = (2cos∠HNH + 1)/3');
  close(bohr('NH3')[1][1], +1.771674127905, 1e-11, 'NH₃ H₁ x in bohr');
  close(bohr('NH3')[1][2], 0, 1e-15, 'NH₃ H₁ y in bohr');
  close(bohr('NH3')[1][3], -0.720038470870, 1e-11, 'NH₃ H₁ z in bohr');
  close(g('CH4').r_CH_angstrom, 1.087, 0, 'CH₄ r_CH'); close(g('CH4').d_bohr, 1.185953834856, 1e-11, 'CH₄ d in bohr');
  for (const s of [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].entries()) {
    const [k, sg] = s, h = bohr('CH4')[k + 1];
    for (let q = 0; q < 3; q++) close(h[q + 1], sg[q] * g('CH4').d_bohr, 1e-12, 'CH₄ tetrahedral vertex');
  }
  close(g('LiH').r_angstrom, 1.595, 0, 'LiH r'); close(g('HF').r_angstrom, 0.9168, 0, 'HF r');
  close(g('N2').r_angstrom, 1.09768, 0, 'N₂ r');
  close(bohr('N2')[1][3], 1.09768 / 0.52917721092, 1e-13, 'N₂ bond in bohr');
  close(oracle.molecules.H2O.Enuc, 9.189533762935, 1e-12, 'H₂O E_nuc');
  console.log(`PASS pinned placements: NH₃ β = ${g('NH3').beta_deg.toFixed(7)}°, H₁ = (${bohr('NH3')[1][1].toFixed(12)}, 0, ${bohr('NH3')[1][3].toFixed(12)}) bohr; CH₄ d = ${g('CH4').d_bohr.toFixed(12)} bohr.`);
}

/* 2. The spherically averaged atomic densities that SAD is built from carry the right electron counts. */
{
  const rows = [];
  for (const Z of [1, 3, 6, 7, 8, 9]) {
    const a = atomicDensity(Z, record), occ = atomicOccupations(Z);
    const total = Object.values(occ).flat().reduce((s, v) => s + v, 0);
    assert.equal(total, Z, `Z = ${Z}: the spherically averaged configuration holds Z electrons`);
    close(a.electrons, Z, 1e-9, `Z = ${Z}: Tr(D_atom S_atom) = Z`);
    rows.push(`Z${Z} ${JSON.stringify(occ)} Tr(DS) ${a.electrons.toFixed(10)}`);
  }
  const n2 = oracle.molecules.N2.atoms_bohr.map(([Z, x, y, z]) => ({ Z, x, y, z }));
  const b = basisFrom(n2, record, { cart: true }), I = integrals(b, n2), D0 = sadDensity(b.atoms, record, b);
  let t = 0; for (let i = 0; i < I.n; i++) for (let j = 0; j < I.n; j++) t += D0[i * I.n + j] * I.S[j * I.n + i];
  close(t, 14, 1e-9, 'the N₂ SAD guess already carries 14 electrons');
  let asym = 0; for (let i = 0; i < I.n; i++) for (let j = 0; j < I.n; j++) asym = Math.max(asym, Math.abs(D0[i * I.n + j] - D0[j * I.n + i]));
  close(asym, 0, 1e-15, 'the SAD guess is symmetric');
  console.log(`PASS SAD atoms: ${rows.join(' | ')}; N₂ guess Tr(D₀S) = ${t.toFixed(10)}.`);
}

/* 3. The six energies, invariants and dipoles. */
const runs = {};
{
  for (const [name, m] of Object.entries(oracle.molecules)) {
    const atoms = m.atoms_bohr.map(([Z, x, y, z]) => ({ Z, x, y, z }));
    const r = moleculeRHF({ atoms, basis: 'sto-3g' });
    runs[name] = r;
    const n = r.integrals.n;
    assert.ok(r.converged, `${name}: SCF converged`);
    assert.equal(n, m.nao, `${name}: ${m.nao} Cartesian AOs`);
    assert.equal(r.nElectrons, m.nelec, `${name}: ${m.nelec} electrons`);
    close(r.energy, m.energy, 1e-9, `${name}: RHF vs PySCF`);
    close(r.energy, m.ledger_pin, 1e-9, `${name}: RHF vs the ROUND 4 pin`);
    close(r.integrals.Enuc, m.Enuc, 1e-11, `${name}: E_nuc`);
    /* Tr(DS) = N_e, and C is S-orthonormal */
    let trDS = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) trDS += r.D[i * n + j] * r.integrals.S[j * n + i];
    close(trDS, m.nelec, 1e-12, `${name}: Tr(DS) = N_e`);
    let cscMax = 0;
    for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) { let s = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += r.C[i * n + p] * r.integrals.S[i * n + j] * r.C[j * n + q];
      cscMax = Math.max(cscMax, Math.abs(s - (p === q ? 1 : 0))); }
    assert.ok(cscMax <= 1e-12, `${name}: CᵀSC − I = ${cscMax.toExponential(3)} exceeds 1e-12`);
    /* aufbau: the density occupies the lowest nocc eigenvectors of its own Fock matrix */
    assert.ok(r.aufbau.satisfied, `${name}: aufbau (gap ${r.aufbau.gap.toExponential(3)}, defect ${r.aufbau.densityDefect.toExponential(3)})`);
    assert.ok(r.aufbau.gap > 0, `${name}: HOMO below LUMO`);
    for (let k = 1; k < n; k++) assert.ok(r.orbitalEnergies[k] >= r.orbitalEnergies[k - 1] - 1e-12, `${name}: ε ascending`);
    let de = 0; for (let k = 0; k < n; k++) de = Math.max(de, Math.abs(r.orbitalEnergies[k] - m.orbital_energies[k]));
    assert.ok(de < 1e-7, `${name}: max|Δε| = ${de.toExponential(3)} vs PySCF`);
    /* stability: re-converge from a symmetrically perturbed density */
    assert.ok(r.stability.same, `${name}: re-converged from a perturbed density to ${r.stability.delta.toExponential(3)}, not 1e-10`);
    close(r.stability.energy, r.energy, 1e-10, `${name}: perturbed re-convergence`);
    /* the real RHF→RHF stability Hessian: A + B ≻ 0, against numpy's eigvalsh on PySCF's own MO integrals */
    const H = r.stability.hessian, hr = m.stability_hessian;
    assert.equal(H.nOv, hr.n_ov, `${name}: ${hr.n_ov} occupied–virtual rotations`);
    close(H.lowestApB, hr.lowest_A_plus_B, 1e-8, `${name}: lowest eigenvalue of A + B vs numpy`);
    close(H.lowestAmB, hr.lowest_A_minus_B, 1e-8, `${name}: lowest eigenvalue of A − B vs numpy`);
    assert.ok(hr.lowest_A_plus_B > 0 && hr.lowest_A_minus_B > 0, `${name}: the oracle calls this a minimum`);
    assert.ok(H.minimum, `${name}: a real RHF minimum, A + B = ${H.lowestApB.toExponential(3)}`);
    assert.ok(r.stability.minimum, `${name}: stability.minimum agrees`);
    /* the dipole against PySCF */
    let dmax = 0;
    for (let q = 0; q < 3; q++) { close(r.dipole[q], m.dipole_au[q], 1e-8, `${name}: μ_${'xyz'[q]} vs PySCF`); dmax = Math.max(dmax, Math.abs(m.dipole_au[q])); }
    const nz = dmax > 1e-6;
    assert.equal(nz, ['H2O', 'LiH', 'HF', 'NH3'].includes(name), `${name}: dipole ${nz ? 'nonzero' : 'zero'} by symmetry`);
    console.log(`PASS ${name.padEnd(3)} ${String(m.nao).padStart(2)} AOs  E = ${r.energy.toFixed(12)}  Δ = ${(r.energy - m.energy).toExponential(2)}  Tr(DS) = ${trDS.toFixed(12)}  CᵀSC−I ${cscMax.toExponential(2)}  gap ${r.aufbau.gap.toFixed(6)}  max|Δε| ${de.toExponential(2)}  stab Δ ${r.stability.delta.toExponential(2)}  A+B ${H.lowestApB.toFixed(9)}  A−B ${H.lowestAmB.toFixed(9)}  μ = ${nz ? r.dipole.map((v) => v.toFixed(9)).join(', ') : '0 by symmetry'}  guess ${r.guess}`);
  }
}

/* 4. N₂: the second aufbau RHF solution, reported by name and reachable on request. */
{
  const m = oracle.molecules.N2, atoms = m.atoms_bohr.map(([Z, x, y, z]) => ({ Z, x, y, z }));
  const ground = runs.N2;
  assert.equal(ground.solutionName, 'ground state', 'the default guess lands on the ground state');
  assert.equal(ground.guess, 'sad', 'the default guess is SAD, not the core');
  close(ground.energy, -107.495887883412, 1e-9, 'N₂ ground state');
  const second = ground.solutions.find((s) => s.name === 'second aufbau RHF solution');
  assert.ok(second, `a second solution is reported: ${ground.solutions.map((s) => s.name).join(', ')}`);
  assert.equal(second.guess, 'core', 'the second solution is the one the bare core guess reaches');
  close(second.energy, m.second_solution.energy, 1e-9, 'the second solution vs PySCF init_guess=hcore');
  close(second.energy, -106.766097415129, 1e-9, 'the second solution vs the ROUND 4 pin');
  assert.ok(second.aufbau.satisfied, 'the second solution obeys aufbau too — converged to 1e-13 and wrong by 0.73 hartree');
  /* and yet the Hessian flags it from the converged solution alone, at one 21 × 21 diagonalisation */
  const hr2 = m.second_solution.stability_hessian;
  close(second.hessian.lowestApB, hr2.lowest_A_plus_B, 1e-8, 'the second solution: lowest A + B vs numpy');
  close(second.hessian.lowestAmB, hr2.lowest_A_minus_B, 1e-8, 'the second solution: lowest A − B vs numpy');
  assert.ok(hr2.lowest_A_plus_B < 0, 'the oracle calls the second solution a saddle');
  assert.equal(second.hessian.minimum, false, 'the second solution is not a real RHF minimum');
  assert.ok(second.hessian.lowestApB < -0.3, `A + B goes to ${second.hessian.lowestApB.toFixed(9)} there`);
  close(second.energy - ground.energy, 0.729790468283, 1e-8, 'the gap between the two RHF solutions');
  const onRequest = moleculeRHF({ atoms, basis: 'sto-3g', guess: 'core' });
  assert.equal(onRequest.guess, 'core'); assert.equal(onRequest.solutionName, 'second aufbau RHF solution');
  assert.equal(onRequest.stability.minimum, false, 'guess: core is reported as a non-minimum, not hidden');
  /* the perturbation probe alone is NOT enough here: the saddle returns the same energy to 1e-10 and only fails to
     report `converged`, sitting on the marginally unstable fixed point for all 200 cycles (ROUND 4 · OPUS §5).
     The A ± B Hessian is what separates the two solutions, and it costs one 21 × 21 diagonalisation. */
  close(onRequest.stability.delta, 0, 1e-10, 'the perturbed run comes back to the same energy');
  assert.equal(onRequest.stability.converged, false, 'but it does not re-converge in 200 cycles, unlike every minimum above');
  assert.ok(runs.N2.stability.converged, 'the ground state does re-converge from the same perturbation');
  close(onRequest.energy, -106.766097415129, 1e-9, 'guess: core returns the second solution');
  const pairs = (e) => [...e].map((v, k) => [k, v]).filter(([k, v]) => k > 0 && Math.abs(v - e[k - 1]) < 1e-9);
  const gpi = pairs(ground.orbitalEnergies), spi = pairs(onRequest.orbitalEnergies);
  assert.equal(gpi.length, 2, `the ground state keeps the π_u and π_g pairs: ${gpi.map(([, v]) => v.toFixed(6))}`);
  close(gpi[0][1], -0.572999, 1e-6, 'the occupied π_u pair of the ground state');
  assert.equal(spi.length, 0, `the second solution has no degenerate pair left: ${[...onRequest.orbitalEnergies].map((v) => v.toFixed(6))}`);
  close(onRequest.orbitalEnergies[3], -0.642536, 1e-6, 'the split π_u, lower');
  close(onRequest.orbitalEnergies[4], -0.606615, 1e-6, 'the split π_u, upper');
  for (const s of ground.solutions) assert.ok(s.converged, `${s.name} is a converged solution`);
  console.log(`PASS N₂ two RHF solutions: ground state ${ground.energy.toFixed(12)} from SAD, "${second.name}" ${second.energy.toFixed(12)} from guess 'core' (PySCF hcore ${m.second_solution.energy.toFixed(12)}), ΔE = ${(second.energy - ground.energy).toFixed(12)} hartree, π_u split ${(onRequest.orbitalEnergies[4] - onRequest.orbitalEnergies[3]).toExponential(3)} where the ground state holds ${gpi.length} degenerate pairs; Hessian A+B ${second.hessian.lowestApB.toFixed(9)} and A−B ${second.hessian.lowestAmB.toFixed(9)} flag the saddle from the converged solution alone, against ${ground.stability.hessian.lowestApB.toFixed(9)} and ${ground.stability.hessian.lowestAmB.toFixed(9)} for the ground state.`);
}

/* 5. The module refuses what it cannot do. */
{
  const atoms = oracle.molecules.H2O.atoms_bohr.map(([Z, x, y, z]) => ({ Z, x, y, z }));
  assert.throws(() => moleculeRHF({ atoms, basis: 'sto-3g', charge: 1 }), /even electron count/, 'an odd electron count is refused, not spin-averaged');
  assert.throws(() => moleculeRHF({ atoms, basis: 'cc-pvdz' }), /unknown basis/, 'an unvendored basis is refused');
  assert.throws(() => moleculeRHF({ atoms: [] }), /atoms/, 'no atoms is refused');
  const cation = moleculeRHF({ atoms, basis: 'sto-3g', charge: 2 });
  assert.equal(cation.nElectrons, 8, 'charge 2 removes two electrons');
  assert.ok(cation.energy > oracle.molecules.H2O.energy, 'the dication is above the neutral');
  console.log(`PASS refusals: odd electron count, unvendored basis, empty atom list; H₂O²⁺ (8 electrons) = ${cation.energy.toFixed(9)}.`);
}

console.log('rhf-molecules.test.mjs OK');
