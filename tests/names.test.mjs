// lab/names.js — THE NAMES (0.4.0 S1): the ten probed anchors reproduce names-probe.json, the controls refuse, the
// tables self-test, the Cartesian d block is a symmetry of S, and forms() writes every surface's spelling.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moleculeRHF, registerRecord } from '../lab/rhf-molecule.js';
import { MOLECULE_BY_ID, moleculeAtoms, moleculeCharge } from '../lab/molecules.js';
import { nameOrbitals, selfTest, forms, atomForms, coreCount, frontierName, GROUP_IDS, orbitalName } from '../lab/names.js';
import { clusterRanges } from '../lab/canon-gauge.js';

const record = JSON.parse(readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
registerRecord('sto-3g', record);
const probe = JSON.parse(readFileSync(new URL('../tests/fixtures/names-probe.json', import.meta.url), 'utf8'));
const solve = (id, atoms = moleculeAtoms(id), extra = {}) => moleculeRHF({ atoms, basis: 'sto-3g', charge: moleculeCharge(id), record, ...extra });
const input = (sol, atoms) => ({ atoms, S: sol.integrals.S, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc, basis: sol.basis, converged: sol.converged });
const sym = (id) => MOLECULE_BY_ID.get(id).symmetry;

/* 1 · every table */
for (const g of GROUP_IDS.filter((g) => !/inf/.test(g))) assert.ok(selfTest(g).ok, `${g} self-test`);
assert.deepEqual(selfTest('Ih').vector, { T1u: 1 }); assert.deepEqual(selfTest('Oh').vector, { T1u: 1 }); assert.deepEqual(selfTest('Td').vector, { T2: 1 });
console.log('PASS the 15 finite tables self-test (orthogonality, Σdim² = h, the vector rep: Td T2, Oh T1u, Ih T1u)');

/* 2 · the ten anchors, exactly the probe's configuration and by-level frontier names */
const kept = {};
for (const id of ['H2O', 'NH3', 'CH4', 'N2', 'CO', 'HF', 'CO2', 'C2H4', 'H2CO', 'C6H6']) {
  const atoms = moleculeAtoms(id), sol = solve(id), r = nameOrbitals(input(sol, atoms), sym(id)), p = probe.molecules[id];
  kept[id] = { sol, atoms, r };
  assert.ok(r.reliable, `${id}: ${r.reason}`);
  assert.equal(r.config, p.configuration, `${id} configuration`);
  assert.equal(r.mos[sol.nocc - 1].label, p.homoLabel); assert.equal(r.mos[sol.nocc].label, p.lumoLabel);
  assert.deepEqual(r.mos.map((m) => m.frontier.replace('−', '-')), p.mos.map((m) => m.frontier), `${id} frontier by level`);
  assert.deepEqual(r.mos.map((m) => m.label), p.mos.map((m) => m.label), `${id} every label`);
}
assert.deepEqual(kept.CH4.r.mos.slice(2, 5).map((m) => m.frontier), ['HOMO', 'HOMO', 'HOMO'], 'CH₄: a degenerate HOMO is one HOMO');
assert.deepEqual(kept.C6H6.r.mos.slice(19, 21).map((m) => forms(m).plain), ['1e1g (a)', '1e1g (b)']);
assert.ok(kept.C6H6.r.ms < 50, `benzene named in ${kept.C6H6.r.ms} ms`);
console.log(`PASS the ten anchors reproduce names-probe.json label for label; a degenerate HOMO is one HOMO; benzene ${kept.C6H6.r.ms} ms`);

/* 3 · the controls */
{ const atoms = moleculeAtoms('H2O').map((a) => ({ ...a })); atoms[1].y += 0.02 * 1.8897259886;
  const r = nameOrbitals(input(solve('H2O', atoms), atoms), sym('H2O'));
  assert.ok(!r.reliable && /not a symmetry of this framework/.test(r.reason), 'distorted water refused');
  assert.ok(r.mos.every((m) => m.label === null) && r.mos[4].frontier === 'HOMO', 'refused: indices throughout, the frontier stays'); }
{ const { sol, atoms } = kept.C2H4, r = nameOrbitals(input(sol, atoms), sym('C2H4'), { energyTol: 5e-3 });
  assert.ok(!r.reliable && /Ag \+ B1u/.test(r.reason), 'a too-wide tolerance reports the mixed level, not a label: ' + r.reason);
  assert.ok(r.mos.every((m) => m.label === null), 'all or nothing'); }
{ let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff - 0.5; };
  for (const id of ['CH4', 'CO2', 'C6H6']) {
    const { sol, atoms, r } = kept[id], n = sol.integrals.n, C2 = Float64Array.from(sol.C);
    for (const [a, b] of clusterRanges(Array.from(sol.orbitalEnergies), 2e-10)) {
      const g = b - a; if (g < 2) continue;
      const Q = Array.from({ length: g }, () => Array.from({ length: g }, rnd));
      for (let i = 0; i < g; i++) { for (let j = 0; j < i; j++) { let d = 0; for (let k = 0; k < g; k++) d += Q[i][k] * Q[j][k]; for (let k = 0; k < g; k++) Q[i][k] -= d * Q[j][k]; }
        const nr = Math.hypot(...Q[i]); for (let k = 0; k < g; k++) Q[i][k] /= nr; }
      for (let u = 0; u < n; u++) for (let j = 0; j < g; j++) { let t = 0; for (let k = 0; k < g; k++) t += Q[j][k] * sol.C[u * n + a + k]; C2[u * n + a + j] = t; }
    }
    const re = nameOrbitals({ ...input(sol, atoms), C: C2 }, sym(id));
    assert.deepEqual(re.mos.map((m) => m.label), r.mos.map((m) => m.label), `${id}: a rotation inside every degenerate level changes no label`);
  } }
{ const { atoms, sol } = kept.N2, sol2 = solve('N2', atoms, { guess: 'core', detect: false, hessian: false, stability: false });
  assert.ok(sol2.energy > sol.energy + 0.5, 'the core guess lands on the second aufbau solution');
  const r = nameOrbitals(input(sol2, atoms), sym('N2'));
  assert.ok(!r.reliable, 'N₂\'s symmetry-broken solution is refused: ' + r.reason); }
console.log('PASS the controls: distorted water refused, a wide tolerance says "Ag + B1u", gauge rotations change nothing, N₂\'s broken solution refused');

/* 4 · the Cartesian d block: DᵀSD = S on GeH4, and the d-shell molecules named */
{ const atoms = moleculeAtoms('GeH4'), sol = solve('GeH4'), r = nameOrbitals(input(sol, atoms), sym('GeH4'));
  assert.ok(sol.basis.shells.some((s) => s.l === 2), 'GeH4 has a d shell');
  assert.ok(r.verification.overlap < 1e-12, `GeH4 DᵀSD = S to ${r.verification.overlap}`);
  assert.ok(r.reliable && r.mos[sol.nocc - 1].label === '4t2', r.config); }
{ /* the teaching moment (the N₂ demo): 6-31+G* puts a Cartesian d shell on N, and its names swap the HOMO to 1πu */
  const rec = JSON.parse(readFileSync(new URL('../lab/vendor/bse/6-31+g-star-v1.json', import.meta.url), 'utf8')); registerRecord('6-31+g-star', rec);
  const atoms = moleculeAtoms('N2'), sol = moleculeRHF({ atoms, basis: '6-31+g-star', charge: 0, record: rec }), r = nameOrbitals(input(sol, atoms), sym('N2'));
  assert.ok(r.reliable, r.reason); assert.equal(r.config, '(1σg)²(1σu)²(2σg)²(2σu)²(3σg)²(1πu)⁴'); assert.equal(r.mos[sol.nocc - 1].label, '1πu'); }
console.log('PASS the Cartesian d block: GeH₄ DᵀSD = S to 1e-12 and named (HOMO 4t2); N₂ in 6-31+G* names its HOMO 1πu (3σg below it)');

/* 5 · the forms, the atoms, the core */
assert.deepEqual(Object.fromEntries(Object.entries(forms('3σg')).filter(([k]) => k !== 'parts')),
  { plain: '3σg', typeset: '3σ_g', latex: '$3\\sigma_{g}$', ascii: '3sg', speech: 'three sigma g' });
assert.deepEqual(Object.fromEntries(Object.entries(forms('1e1g', 'a')).filter(([k]) => k !== 'parts')),
  { plain: '1e1g (a)', typeset: '1e₁g (a)', latex: '$1e_{1g}^{(a)}$', ascii: '1e1g_a', speech: 'one e one g, component a' });
assert.equal(forms('1b1').typeset, '1b₁'); assert.equal(forms('1b1').latex, '$1b_{1}$'); assert.equal(forms('1b1').speech, 'one b one');
assert.equal(forms('1t2').typeset, '1t₂'); assert.equal(forms('1t2').ascii, '1t2');
assert.equal(forms("1a1′").latex, "$1a_{1}^{\\prime}$");
assert.equal(orbitalName(kept.H2O.r, 4, 5, 'typeset'), '1b₁ · HOMO'); assert.equal(orbitalName(kept.H2O.r, 3, 5), '3a1');
assert.equal(orbitalName(null, 2, 5), 'HOMO−2', 'no record: the frontier by index');
assert.deepEqual(atomForms({ n: 2, l: 1, m: -1 }), { plain: '2p₋1', typeset: '2p₋₁', latex: '2p_{-1}', ascii: '2p-1', speech: 'two p minus one' });
assert.equal(frontierName(-2), 'HOMO−2'); assert.equal(frontierName(3), 'LUMO+2');
assert.equal(coreCount(moleculeAtoms('C6H6')), 6); assert.equal(coreCount(moleculeAtoms('Br2')), 28); assert.equal(coreCount(moleculeAtoms('H2O')), 1);
console.log('PASS forms(): 3σg / 1e1g (a) / 1b1 / 1t2 in plain, typeset, latex, ascii and speech; atomForms; coreCount (Br₂ 28: Ar + 3d¹⁰)');
