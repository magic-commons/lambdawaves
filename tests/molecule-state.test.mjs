/* molecule-state.test.mjs — B-H2O-5's gate.  The saved molecule is H₂O/STO-3G at the pinned
 * E = −74.963023162862 with a REAL MMUT record: P(t) and P(t−Δt) come out of lab/density.js after a δ-kick and one
 * step, not out of a fixture, so the Hermiticity and the parity being checked are the propagator's own.
 * Save → restore → save must be byte-identical, and each of the four named refusals must fire on its own defect.
 * The E_TRACE bound is ROUND 4 · OPUS §8's correction of Sol's flat 1e-12: max(1e-12, 3nε·steps).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moleculeRHF, registerRecord } from '../lab/rhf-molecule.js';
import { createRTHF } from '../lab/density.js';
import { serializeMolecule, restoreMolecule, MoleculeStateError, SCHEMA, COMPONENT_ORDER_LINE } from '../lab/molecule-state.js';

const record = JSON.parse(readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
registerRecord('sto-3g', record);
const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b} (tol ${tol})`);
/** the code a call refuses with, or null if it did not refuse */
function codeOf(fn) {
  try { fn(); return null; } catch (e) {
    assert.ok(e instanceof MoleculeStateError, `expected a MoleculeStateError, got ${e && e.name}: ${e && e.message}`);
    assert.ok(e.message.startsWith(e.code + ':'), `the message must lead with the code: ${e.message}`);
    return e.code;
  }
}
const clone = (v) => JSON.parse(JSON.stringify(v));

/* 0. The molecule: the pinned ground state, and one kicked MMUT step taken with the real propagator. */
const atoms = [[8, 0, 0, 0.22166487441148175], [1, 0, 1.4309006215206648, -0.886659497645927],
  [1, 0, -1.4309006215206648, -0.886659497645927]].map(([Z, x, y, z]) => ({ Z, x, y, z }));
const sol = moleculeRHF({ atoms, basis: 'sto-3g' });
const I = sol.integrals, n = I.n, dt = 0.01, kappa = 1e-3;
close(sol.energy, -74.963023162862, 1e-9, 'the pinned H₂O/STO-3G RHF energy');
const engine = createRTHF({ n, S: I.S, h: I.h, eri: I.eri, Z: I.Z, mu: [I.X, I.Y, I.Z], Enuc: I.Enuc,
  nuclearDipole: I.nuclearDipole[2], nElectrons: sol.nElectrons, D0: sol.D, dt, integrator: 'mmut' });
engine.kickAlong('z', kappa);
const P0 = engine.P;                                                        // the kicked t = 0 density, P(t−Δt)
engine.step();
const P1 = engine.P;                                                        // P(t), one Magnus-2 startup step on
const state = {
  atoms, charge: 0, multiplicity: 1, electrons: 10,
  basis: { name: 'sto-3g', version: record.version ?? null, url: './vendor/bse/sto-3g-v1.json', hash: sol.hash },
  rhf: { energy: sol.energy, eps: sol.orbitalEnergies, C: sol.C, D: sol.D },
  rt: { t: dt, dt, integrator: 'mmut', kick: { axis: 'z', kappa }, P: P1, Pprev: P0, parity: 1, steps: 1 },
  presentation: { view: 'density', orbital: 4, iso: 0.06, showCore: false },
};

/* 1. Save → restore → save, byte-identically, and the record carries the declared conventions and no caches. */
const rec1 = serializeMolecule(state);
{
  const back = restoreMolecule(rec1, { record, S: I.S });
  const rec2 = serializeMolecule(back);
  const j1 = JSON.stringify(rec1), j2 = JSON.stringify(rec2);
  assert.equal(j1, j2, 'save → restore → save is not byte-identical');
  const rec3 = serializeMolecule(restoreMolecule(clone(rec2), { record, S: I.S }));
  assert.equal(JSON.stringify(rec3), j1, 'a third round through JSON.parse moved a byte');
  assert.equal(rec1.schema, SCHEMA);
  assert.equal(rec1.basis.kind, 'cartesian');
  assert.equal(rec1.basis.order, COMPONENT_ORDER_LINE);
  assert.equal(rec1.basis.order, 's; x,y,z; xx,xy,xz,yy,yz,zz', 'the Cartesian component order, as SYNTHESIS decision 1 declares it');
  assert.deepEqual(Object.keys(rec1), ['schema', 'atoms', 'charge', 'multiplicity', 'electrons', 'basis', 'rhf', 'rt', 'presentation'],
    'the record is exactly these nine keys, in this order');
  for (const forbidden of ['S', 'h', 'eri', 'X', 'W', 'F', 'integrals', 'trace', 'voxels', 'field'])
    assert.ok(!(forbidden in rec1) && !(forbidden in rec1.rhf) && !(forbidden in rec1.rt), `the record must not carry the derived cache '${forbidden}'`);
  close(rec1.rhf.energy, -74.963023162862, 1e-9, 'the restored energy');
  assert.equal(back.rhf.C.length, n * n); assert.equal(back.rhf.eps.length, n);
  assert.equal(back.rt.Pprev.re.length, n * n);
  close(back.checks.trace.TrDS, 10, 1e-12, 'Tr(DS) on restore');
  console.log(`PASS save → restore → save byte-identical: ${j1.length} bytes, E = ${rec1.rhf.energy.toFixed(12)}, Tr(DS) = ${back.checks.trace.TrDS.toFixed(13)},`
    + ` basis ${back.checks.basisHash.slice(0, 12)}…, mmut record with P(t−Δt) and parity ${rec1.rt.parity}, no derived cache.`);
}

/* 2. E_BASIS_HASH: the hash is RECOMPUTED over the vendored decimal strings, never trusted. */
{
  const tampered = clone(rec1);
  tampered.basis.hash = rec1.basis.hash.slice(0, 63);                     // one hex digit short of a SHA-256
  assert.equal(codeOf(() => restoreMolecule(tampered, { record })), 'E_SHAPE', 'a 63-hex hash is a shape defect');
  const flipped = clone(rec1);
  flipped.basis.hash = rec1.basis.hash.slice(0, 63) + (rec1.basis.hash[63] === 'a' ? 'b' : 'a');
  assert.equal(codeOf(() => restoreMolecule(flipped, { record })), 'E_BASIS_HASH', 'a mutated hash must be rejected');
  assert.equal(codeOf(() => restoreMolecule(flipped)), null, 'with no vendored record there is nothing to check the hash against, and the record says so');
  assert.match(restoreMolecule(flipped).checks.basisHash, /not checked/);
  const mutated = clone(record);                                            // move ONE decimal string of the O 1s shell
  mutated.elements['8'].electron_shells[0].exponents[0] = '130.7093215';
  assert.equal(codeOf(() => restoreMolecule(clone(rec1), { record: mutated })), 'E_BASIS_HASH', 'a mutated BSE decimal must be rejected');
  console.log(`PASS E_BASIS_HASH: a flipped hex digit and a mutated BSE decimal (130.7093214 → 130.7093215) are both refused; an absent record is reported, not assumed.`);
}

/* 3. E_MMUT_HISTORY: SYNTHESIS decision 2 makes the unrestarted leapfrog the default, so P(t−Δt) and its parity
      are part of the state.  A magnus2 record needs neither. */
{
  const noHistory = clone(rec1); noHistory.rt.Pprev = null;
  assert.equal(codeOf(() => restoreMolecule(noHistory, { record, S: I.S })), 'E_MMUT_HISTORY', 'mmut without P(t−Δt)');
  const noParity = clone(rec1); noParity.rt.parity = null;
  assert.equal(codeOf(() => restoreMolecule(noParity, { record, S: I.S })), 'E_MMUT_HISTORY', 'mmut without a parity flag');
  const wrongParity = clone(rec1); wrongParity.rt.parity = 0;               // steps = 1, so the parity is 1
  assert.equal(codeOf(() => restoreMolecule(wrongParity, { record, S: I.S })), 'E_MMUT_HISTORY', 'a parity that contradicts the step count');
  const m2 = clone(rec1); m2.rt.integrator = 'magnus2'; m2.rt.Pprev = null; m2.rt.parity = null;
  assert.equal(codeOf(() => restoreMolecule(m2, { record, S: I.S })), null, 'a magnus2 record needs no history');
  const noRt = clone(rec1); noRt.rt = null;
  assert.equal(codeOf(() => restoreMolecule(noRt, { record, S: I.S })), null, 'a ground-state-only record is valid');
  console.log('PASS E_MMUT_HISTORY: missing P(t−Δt), missing parity and parity ≠ steps mod 2 are each refused; magnus2 and a ground-state-only record pass.');
}

/* 4. E_TRACE, on ROUND 4 §8's bound and not on Sol's flat 1e-12. */
{
  const bound = (steps) => Math.max(1e-12, 3 * n * Number.EPSILON * steps);
  const scaled = (delta, steps) => { const r = clone(rec1);
    for (let k = 0; k < n * n; k++) r.rhf.D[k] *= (10 + delta) / 10;
    r.rt.steps = steps; r.rt.parity = steps % 2; return r; };
  const drift = 1.9e-10;                                                    // the ledger's 10.00000000019 at 120,000 steps
  assert.ok(drift < bound(120000) && drift > bound(0), `the ledger's drift sits between the two bounds: ${bound(0).toExponential(2)} < ${drift} < ${bound(120000).toExponential(2)}`);
  assert.equal(codeOf(() => restoreMolecule(scaled(drift, 120000), { record, S: I.S })), null,
    '10.00000000019 after 120,000 steps is inside max(1e-12, 3nε·steps)');
  assert.equal(codeOf(() => restoreMolecule(scaled(drift, 0), { record, S: I.S })), 'E_TRACE',
    'the same electron count with no steps taken has no drift budget and must be refused');
  assert.equal(codeOf(() => restoreMolecule(scaled(1e-6, 120000), { record, S: I.S })), 'E_TRACE', 'a 1e-6 electron defect is refused at any step count');
  assert.equal(codeOf(() => restoreMolecule(clone(rec1), { record })), null, 'with no metric the trace is not checked');
  assert.match(restoreMolecule(clone(rec1), { record }).checks.trace, /not checked/);
  console.log(`PASS E_TRACE: 3nε·steps = ${bound(120000).toExponential(3)} at 120,000 steps accepts the measured 1.9e-10 drift and ${bound(0).toExponential(1)} at zero steps refuses it; 1e-6 is refused either way.`);
}

/* 5. E_SHAPE: the dimensions, the schema, the symmetries and the conventions. */
{
  const bad = (f) => { const r = clone(rec1); f(r); return codeOf(() => restoreMolecule(r, { record, S: I.S })); };
  assert.equal(bad((r) => { r.schema = 2; }), 'E_SHAPE', 'a future schema needs a migration, not a guess');
  assert.equal(bad((r) => { r.rhf.C = r.rhf.C.slice(0, 48); }), 'E_SHAPE', 'C must be n × n');
  assert.equal(bad((r) => { r.rhf.eps = r.rhf.eps.slice(0, 6); }), 'E_SHAPE', 'eps must be length n');
  assert.equal(bad((r) => { r.rhf.D = r.rhf.D.slice(0, 48); }), 'E_SHAPE', 'D must be n × n');
  assert.equal(bad((r) => { r.rhf.D[1] += 0.5; }), 'E_SHAPE', 'D must be symmetric');
  assert.equal(bad((r) => { r.rt.P.im[1] += 0.5; }), 'E_SHAPE', 'P must be Hermitian (Im antisymmetric)');
  assert.equal(bad((r) => { r.rt.P.re[1] += 0.5; }), 'E_SHAPE', 'P must be Hermitian (Re symmetric)');
  assert.equal(bad((r) => { r.basis.kind = 'spherical'; }), 'E_SHAPE', 'spherical 6-31+G* is a different model (SYNTHESIS decision 1)');
  assert.equal(bad((r) => { r.basis.order = 's; x,y,z; xx,yy,zz,xy,xz,yz'; }), 'E_SHAPE', 'a reordered d shell is a different AO order');
  assert.equal(bad((r) => { r.basis.name = 'cc-pvdz'; }), 'E_SHAPE', 'only the vendored bases can be named');
  assert.equal(bad((r) => { r.electrons = 8; }), 'E_SHAPE', 'electrons must equal ΣZ − charge');
  assert.equal(bad((r) => { r.rt.dt = 0; }), 'E_SHAPE', 'dt must be positive');
  assert.equal(bad((r) => { r.rt.kick.axis = 'w'; }), 'E_SHAPE', 'the kick axis is x, y or z');
  assert.equal(bad((r) => { r.rt.steps = -1; }), 'E_SHAPE', 'steps must be a non-negative integer');
  assert.equal(bad((r) => { r.rhf.energy = null; }), 'E_SHAPE', 'the energy must be a finite number');
  assert.equal(bad((r) => { r.atoms[0].Z = 0; }), 'E_SHAPE', 'an atom needs a positive Z');
  assert.equal(bad((r) => { r.presentation.orbital = 1.5; }), 'E_SHAPE', 'the shown orbital is an index or null');
  const wideBasis = bad((r) => { r.rhf.C = new Array(64).fill(0); r.rhf.D = new Array(64).fill(0); r.rhf.eps = new Array(8).fill(0); r.rt = null; });
  assert.equal(wideBasis, 'E_SHAPE', 'an 8 × 8 C against a 7-AO vendored basis is refused');
  console.log('PASS E_SHAPE: 18 defects refused — schema, C/eps/D dimensions, D symmetry, P Hermiticity (both parts), basis kind/order/name, electron count, dt, kick axis, steps, energy, Z, the shown orbital, and an AO count the vendored basis cannot give.');
}
