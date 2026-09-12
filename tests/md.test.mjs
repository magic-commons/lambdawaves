/* md.test.mjs — B-H2O-1's gate.  Every number is asserted against an oracle outside lab/: mpmath at 70 digits for
 * the Boys function, PySCF 2.14.0 cart=True on the vendored BSE decimals for every integral class and both
 * energies, and node:crypto for the record hashes.  Baselines recorded by MATH-H2O ROUND 4 · OPUS: max|ΔV| 5.2e-14,
 * max|Δeri| 9.3e-15, Boys worst relative 7.19e-16 — gates are 1e-12 and 1e-14, the baselines are regression marks.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { boys, boysTable, basisFrom, integrals, rdOf, sha256Hex, ANGSTROM, RD2, COMPONENT_ORDER } from '../lab/md.js';
import { rhf } from '../lab/scf.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const bytes = (p) => readFileSync(new URL(p, import.meta.url));
const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b} (tol ${tol})`);
const ws = (s) => s.replace(/\s+/g, ' ').trim();
const maxAbs = (a, f) => { let w = 0; for (let k = 0; k < a.length; k++) w = Math.max(w, Math.abs(a[k] - f(k))); return w; };

/* 0. The vendored records are the BSE bytes, and md.js's SHA-256 is node:crypto's. */
{
  const index = read('../lab/vendor/bse/index.json');
  assert.equal(index.records.length, 2, 'two vendored records');
  for (const r of index.records) {
    const raw = bytes('../lab/vendor/bse/' + r.file);
    const ref = createHash('sha256').update(raw).digest('hex');
    assert.equal(ref, r.sha256, `${r.file}: index.json sha256 is not the file's`);
    assert.equal(sha256Hex(raw), ref, `${r.file}: md.js sha256Hex disagrees with node:crypto`);
    const rec = read('../lab/vendor/bse/' + r.file);
    assert.equal(rec.name, r.name); assert.equal(rec.version, r.bse_version);
    assert.ok(/^https:\/\/www\.basissetexchange\.org\/api\/basis\//.test(r.source_url), 'a BSE source URL');
  }
  assert.equal(index.records[0].sha256, 'db98a404682de686543ffe09b56f555d6fc11add3b289b35e74c11f9df91c609', 'STO-3G v1 hash of the ledger');
  assert.equal(index.records[1].sha256, 'fee4f992bf8fe6a319350ff03a253d77004110eed0d34013b2af1fade4a71ac4', '6-31+G* v1 hash of the ledger');
  assert.equal(ANGSTROM, 1 / 0.52917721092, 'ANGSTROM = 1/0.52917721092');
  close(ANGSTROM, 1.8897261245650618, 1e-16, 'ANGSTROM vs the oracle ang_to_bohr');
  console.log(`PASS vendored BSE records verbatim: STO-3G v1 ${index.records[0].sha256.slice(0, 8)}…, 6-31+G* v1 ${index.records[1].sha256.slice(0, 8)}… (node:crypto = md.js sha256Hex).`);
}

/* 1. Boys F_0..F_8 against mpmath at 70 digits, including t = 0.5, 44 and their ±1e-8 neighbours. */
{
  const fx = read('./fixtures/boys-ref.json');
  const ts = fx.rows.map((r) => Number(r.t));
  for (const t of [0.5, 44]) {
    assert.ok(ts.includes(t), `grid contains the switch t = ${t}`);
    assert.ok(ts.some((v) => v < t && v > t - 1e-6), `grid contains a neighbour below t = ${t}`);
    assert.ok(ts.some((v) => v > t && v < t + 1e-6), `grid contains a neighbour above t = ${t}`);
  }
  let worstOne = 0, worstTable = 0, whereOne = '', whereTable = '', tested = 0;
  for (const r of fx.rows) {
    const t = Number(r.t), F = boysTable(8, t);
    for (let m = 0; m <= 8; m++) {
      const ref = Number(r.F[m]);
      if (ref < 1e-280) continue;
      tested++;
      const r1 = Math.abs(boys(m, t) - ref) / ref, r2 = Math.abs(F[m] - ref) / ref;
      if (r1 > worstOne) { worstOne = r1; whereOne = `m=${m}, t=${t}`; }
      if (r2 > worstTable) { worstTable = r2; whereTable = `m=${m}, t=${t}`; }
    }
  }
  assert.ok(tested >= 300, `at least 300 (m, t) pairs tested, got ${tested}`);
  assert.ok(worstOne <= 1e-14, `boys(m, t) worst relative ${worstOne.toExponential(3)} at ${whereOne}`);
  assert.ok(worstTable <= 1e-14, `boysTable(8, t) worst relative ${worstTable.toExponential(3)} at ${whereTable}`);
  close(boys(0, 0), 1, 1e-16, 'F_0(0) = 1'); close(boys(4, 0), 1 / 9, 1e-16, 'F_4(0) = 1/9');
  console.log(`PASS Boys F_0..F_8 on ${tested} (m, t) pairs vs mpmath/70: worst relative ${worstOne.toExponential(3)} single (${whereOne}), ${worstTable.toExponential(3)} as a table (${whereTable}); gate 1e-14.`);
}

/* 2. H₂O STO-3G: every integral class against PySCF on the pinned decimals (the R_d congruence is the identity here). */
let sto = null;
{
  const fx = read('./fixtures/h2o-sto3g-integrals.json'), rec = read('../lab/vendor/bse/sto-3g-v1.json');
  const atoms = fx.atoms_bohr.map(([Z, x, y, z]) => ({ Z, x, y, z }));
  const b = basisFrom(atoms, rec, { cart: true }), I = integrals(b, atoms), n = I.n, R = rdOf(b);
  sto = { b, I, fx, atoms };
  assert.equal(n, 7, 'H₂O STO-3G has 7 Cartesian AOs');
  assert.equal(n, fx.n, 'AO count agrees with PySCF');
  assert.deepEqual(b.order.map(ws), fx.ao_labels.map(ws), 'AO order agrees with PySCF ao_labels');
  assert.equal(b.kind, 'cartesian'); assert.deepEqual(b.componentOrder, COMPONENT_ORDER);
  for (let i = 0; i < n; i++) assert.equal(R[i], 1, 'R_d = 1 with no d shell');
  const classes = [['S', I.S, fx.S], ['T', I.T, fx.T], ['V', I.V, fx.V],
    ['dipole x', I.X, fx.Mx], ['dipole y', I.Y, fx.My], ['dipole z', I.Z, fx.Mz]];
  const got = [];
  for (const [name, mine, ref] of classes) {
    const w = maxAbs(mine, (k) => ref[k] / (R[(k / n) | 0] * R[k % n]));
    got.push(`${name} ${w.toExponential(2)}`);
    assert.ok(w <= 1e-12, `max|Δ${name}| = ${w.toExponential(3)} exceeds 1e-12`);
  }
  const wEri = maxAbs(I.eri, (q) => { const l = q % n, k = ((q / n) | 0) % n, j = ((q / (n * n)) | 0) % n, i = (q / (n * n * n)) | 0;
    return fx.eri[q] / (R[i] * R[j] * R[k] * R[l]); });
  assert.ok(wEri <= 1e-12, `max|Δeri| = ${wEri.toExponential(3)} exceeds 1e-12`);
  close(I.Enuc, fx.Enuc, 1e-12, 'E_nuc');
  close(I.Enuc, 9.189533762935, 1e-12, 'E_nuc against the ledger');
  const h = maxAbs(I.h, (k) => fx.T[k] + fx.V[k]);
  assert.ok(h <= 1e-12, `h = T + V, max|Δ| ${h.toExponential(3)}`);
  assert.deepEqual([...I.nuclearDipole].map((v) => +v.toFixed(9)), [0, 0, +fx.atoms_bohr.reduce((s, a) => s + a[0] * a[3], 0).toFixed(9)], 'nuclear dipole');
  console.log(`PASS H₂O STO-3G integrals vs PySCF cart=True (7 AOs, ${n ** 4} ERI): ${got.join(', ')}, eri ${wEri.toExponential(2)}; gate 1e-12 per class (ROUND 4 baselines V 5.2e-14, eri 9.3e-15).`);
}

/* 3. The eight permutation symmetries of the chemist's tensor, each quartet having been computed independently. */
{
  const { I } = sto, n = I.n, g = I.eri, at = (i, j, k, l) => g[((i * n + j) * n + k) * n + l];
  const perms = [[1, 0, 2, 3], [0, 1, 3, 2], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 0, 1], [2, 3, 1, 0], [3, 2, 1, 0]];
  let worst = 0, which = null;
  for (const p of perms) { let w = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) {
      const q = [i, j, k, l];
      w = Math.max(w, Math.abs(at(i, j, k, l) - at(q[p[0]], q[p[1]], q[p[2]], q[p[3]])));
    }
    if (w > worst) { worst = w; which = p; }
    assert.ok(w <= 1e-14, `ERI permutation ${p} breaks by ${w.toExponential(3)}`);
  }
  console.log(`PASS all eight ERI permutation symmetries on independently computed quartets: worst |Δ| ${worst.toExponential(2)} (perm ${which}); gate 1e-14.`);
}

/* 4. H₂O STO-3G RHF through lab/scf.js against PySCF. */
{
  const { I, fx } = sto;
  const out = rhf({ n: I.n, S: I.S, h: I.h, eri: I.eri, Enuc: I.Enuc }, { nElectrons: 10, tol: 1e-12 });
  assert.ok(out.converged, 'H₂O SCF converged');
  close(out.energy, -74.963023162862, 1e-9, 'H₂O/STO-3G RHF vs the ledger pin');
  close(out.energy, fx.rhf.energy, 1e-9, 'H₂O/STO-3G RHF vs PySCF');
  let de = 0; for (let k = 0; k < I.n; k++) de = Math.max(de, Math.abs(out.orbitalEnergies[k] - fx.rhf.orbital_energies[k]));
  assert.ok(de < 1e-8, `max|Δε| = ${de.toExponential(3)}`);
  const n = I.n, dip = [0, 1, 2].map((q) => { const M = [I.X, I.Y, I.Z][q]; let t = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) t += out.D[j * n + i] * M[i * n + j]; return I.nuclearDipole[q] - t; });
  for (let q = 0; q < 3; q++) close(dip[q], fx.dipole_au[q], 1e-8, `dipole component ${'xyz'[q]} vs PySCF`);
  console.log(`PASS H₂O/STO-3G RHF = ${out.energy.toFixed(12)} (Δ ${(out.energy - fx.rhf.energy).toExponential(2)} vs PySCF), max|Δε| ${de.toExponential(2)}, μ_z = ${dip[2].toFixed(9)} a.u.`);
}

/* 5. The l = 2 rung: H₂O/6-31+G* cart=True, 23 AOs, the two d self-overlaps, and the d-containing ERI. */
{
  const fx = read('./fixtures/h2o-631pgs-cart.json'), rec = read('../lab/vendor/bse/6-31+g-star-v1.json');
  const atoms = fx.atoms_bohr.map(([Z, x, y, z]) => ({ Z, x, y, z }));
  const b = basisFrom(atoms, rec, { cart: true }), I = integrals(b, atoms), n = I.n, R = rdOf(b);
  assert.equal(n, 23, '6-31+G* H₂O has 23 Cartesian AOs');
  assert.equal(n, fx.n, 'AO count agrees with PySCF');
  assert.deepEqual(b.order.map(ws), fx.ao_labels.map(ws), 'AO order agrees with PySCF (the diffuse shell follows the d shell in the record)');
  /* PySCF cart=True is the oracle for the two d self-overlaps; md.js normalises every component to 1. */
  const dIdx = fx.ao_labels.map((s, i) => [ws(s), i]).filter(([s]) => /3d/.test(s)).map(([, i]) => i);
  assert.equal(dIdx.length, 6, 'six Cartesian d components');
  const axial = [], mixed = [];
  for (const i of dIdx) (/d(xx|yy|zz)/.test(ws(fx.ao_labels[i])) ? axial : mixed).push(fx.self_overlap_diag[i]);
  assert.equal(axial.length, 3); assert.equal(mixed.length, 3);
  for (const v of axial) { close(v, 4 * Math.PI / 5, 1e-9, 'PySCF d self-overlap xx/yy/zz = 4π/5'); close(v, RD2.axial, 1e-12, 'md.js RD2.axial'); }
  for (const v of mixed) { close(v, 4 * Math.PI / 15, 1e-9, 'PySCF d self-overlap xy/xz/yz = 4π/15'); close(v, RD2.mixed, 1e-12, 'md.js RD2.mixed'); }
  close(axial[0], fx.four_pi_over_5, 1e-12, '4π/5 as PySCF wrote it'); close(mixed[0], fx.four_pi_over_15, 1e-12, '4π/15 as PySCF wrote it');
  let du = 0; for (let i = 0; i < n; i++) du = Math.max(du, Math.abs(I.S[i * n + i] - 1));
  assert.ok(du < 1e-14, `every component has unit self-overlap in md.js, worst |S_ii − 1| = ${du.toExponential(3)}`);
  const got = [];
  for (const [name, mine, ref] of [['S', I.S, fx.S], ['T', I.T, fx.T], ['V', I.V, fx.V]]) {
    const w = maxAbs(mine, (k) => ref[k] / (R[(k / n) | 0] * R[k % n]));
    got.push(`${name} ${w.toExponential(2)}`);
    assert.ok(w <= 1e-12, `max|Δ${name}| = ${w.toExponential(3)} exceeds 1e-12 at l = 2`);
  }
  const sel = fx.eri_selected_indices; let c = 0, we = 0;
  for (const i of sel) for (const j of sel) for (const k of sel) for (const l of sel) {
    const ref = fx.eri_selected[c++] / (R[i] * R[j] * R[k] * R[l]);
    we = Math.max(we, Math.abs(I.eri[((i * n + j) * n + k) * n + l] - ref));
  }
  assert.equal(c, sel.length ** 4, 'every selected quartet compared');
  assert.ok(we <= 1e-12, `max|Δeri| on ${c} d-containing quartets = ${we.toExponential(3)}`);
  const out = rhf({ n, S: I.S, h: I.h, eri: I.eri, Enuc: I.Enuc }, { nElectrons: 10, tol: 1e-12 });
  assert.ok(out.converged, '6-31+G* SCF converged');
  close(out.energy, -76.017441376748, 1e-9, 'H₂O/6-31+G* cart=True RHF vs the ledger pin');
  close(out.energy, fx.rhf.energy, 1e-9, 'H₂O/6-31+G* cart=True RHF vs PySCF');
  let de = 0; for (let k = 0; k < n; k++) de = Math.max(de, Math.abs(out.orbitalEnergies[k] - fx.rhf.orbital_energies[k]));
  assert.ok(de < 1e-6, `max|Δε| = ${de.toExponential(3)} (quadratic in the density error: ΔE ≈ Δε², cond S = 306)`);
  console.log(`PASS H₂O/6-31+G* cart=True, 23 AOs: ${got.join(', ')}, eri ${we.toExponential(2)} on ${c} d quartets, d self-overlaps 4π/5 = ${axial[0].toFixed(9)} and 4π/15 = ${mixed[0].toFixed(9)}, E = ${out.energy.toFixed(12)} (Δ ${(out.energy - fx.rhf.energy).toExponential(2)}), max|Δε| ${de.toExponential(2)}.`);
}

/* 6. The basis hash is over the record's decimal strings: stable under geometry, sensitive to a mutated decimal. */
{
  const rec = read('../lab/vendor/bse/sto-3g-v1.json'), A = ANGSTROM;
  const a1 = [{ Z: 8, x: 0, y: 0, z: 0.1173 * A }, { Z: 1, x: 0, y: 0.7572 * A, z: -0.4692 * A }, { Z: 1, x: 0, y: -0.7572 * A, z: -0.4692 * A }];
  const a2 = a1.map((a) => ({ ...a, z: a.z + 0.3 }));
  assert.equal(basisFrom(a1, rec, { cart: true }).hash, basisFrom(a2, rec, { cart: true }).hash, 'the basis hash does not move with the nuclei');
  const mutated = JSON.parse(JSON.stringify(rec));
  assert.equal(mutated.elements['8'].electron_shells[0].exponents[0], '0.1307093214E+03', 'the O 1s exponent as BSE wrote it');
  mutated.elements['8'].electron_shells[0].exponents[0] = '0.1307093213E+03';   // last digit 4 → 3
  assert.notEqual(basisFrom(a1, rec, { cart: true }).hash, basisFrom(a1, mutated, { cart: true }).hash, 'a mutated decimal changes the hash');
  assert.equal(basisFrom(a1, rec, { cart: true }).hash.length, 64, 'the hash is a SHA-256 hex digest');
  assert.throws(() => basisFrom(a1, rec, { cart: false }), /Cartesian only/, 'spherical is refused, not silently approximated');
  assert.throws(() => basisFrom([{ Z: 2, x: 0, y: 0, z: 0 }], rec, { cart: true }), /no element Z=2/, 'a missing element is refused');
  console.log('PASS basis hash over the decimal strings: geometry-invariant, mutation-sensitive, 64 hex digits; spherical and missing elements refused.');
}

console.log('md.test.mjs OK');
