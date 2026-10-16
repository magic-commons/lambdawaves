// tests/mass.test.mjs — SPECTRUM's μ/mₑ (0.8.1 T2): −∇²/2μ − 1/r is μ × hydrogen at lengths /μ, on setZ's road: run with `node tests/mass.test.mjs`
import assert from 'node:assert/strict';
import { HAMILTONIANS, setMu, setZ, getMu, MASSES } from '../lab/hamiltonian.js'; import { BASIS, energy } from '../lab/hydrogen.js'; import { densityPeriodExact } from '../lab/period.js'; import { einsteinA, einsteinAtomic, dipoleMatrix, MU_H } from '../lab/radiation.js';
const H = HAMILTONIANS.hydrogen, KEYS = ['energy', 'radial', 'tableFor', 'momentumTableFor', 'psiAt', 'phiAt', 'domainFor', 'domainForP', 'label', 'spectrum', 'stark', 'hydrogenTheorems'];
const at = (id) => BASIS.find((s) => s.label === id).index, rel = (a, b) => Math.abs(a / b - 1), s1 = at('1s₀'), p2 = at('2p₀'), MUS = [0.5, MASSES['muonic hydrogen'], 3.7]; const was = Object.fromEntries(KEYS.map((k) => [k, H[k]])), A1 = einsteinAtomic(p2, s1), d1 = dipoleMatrix(p2, s1).abs2, T1 = densityPeriodExact([H.energy(s1), H.energy(p2)]).T, half = H.domainFor(6), R1 = H.radial(3, 1, 2.2);
let n = 0; const ok = (name, f) => { f(); n++; console.log('ok', name); }; ok('THE LOCK: μ = 1 applies no scale — setMu(1) is a no-op, and back from μ ≠ 1 the hydrogen operator is its own functions (the kernel’s half and tables identical)', () => {
  setMu(1); for (const k of KEYS) assert.equal(H[k], was[k], k); setMu(0.5); assert.notEqual(H.tableFor, was.tableFor); setMu(1); for (const k of KEYS) assert.equal(H[k], was[k], k);
  assert.equal(H.domainFor(6), half); assert.equal(JSON.stringify(H.tableFor(BASIS[p2])), JSON.stringify(was.tableFor(BASIS[p2]))); });
ok('muonic hydrogen’s reduced mass m_μm_p/(m_μ + m_p) with m_μ = 206.7683 mₑ, m_p = 1836.15 mₑ prints 185.84; positronium is mₑ/2', () => { assert.equal(MASSES['muonic hydrogen'].toFixed(2), '185.84'); assert.equal(MASSES.positronium, 0.5); });
ok('E_n(μ) = μE_n for all 91 labels (μ¹), and the label and STATUS words say "μ = 0.5 mₑ (positronium)"', () => {
  for (const mu of MUS) { setMu(mu); for (const s of BASIS) assert.ok(rel(H.energy(s.index), mu * energy(s.n)) < 1e-15); } setMu(0.5); assert.equal(H.mass, 'μ = 0.5 mₑ (positronium)'); assert.ok(H.label.includes('(μ = 0.5 mₑ (positronium))')); });
ok('r → r/μ: R_μ(r) = μ^{3/2} R_1(μr), the kernel’s half and the tables’ n by 1/μ (μ¹ on lengths)', () => {
  for (const mu of MUS) { setMu(mu); assert.ok(rel(H.radial(3, 1, 2.2 / mu), mu ** 1.5 * R1) < 1e-14); assert.ok(rel(H.domainFor(6), half / mu) < 1e-15); assert.ok(rel(H.tableFor(BASIS[p2]).n, 2 / mu) < 1e-15); } });
ok('the 1s–2p beat period scales as 1/μ (μ⁻¹), exactly as the period law reads it', () => { for (const mu of MUS) { setMu(mu); assert.ok(rel(densityPeriodExact([H.energy(s1), H.energy(p2)]).T, T1 / mu) < 1e-12); } });
ok('RADIATION: A ∝ ω³|d|² — ω³ ∝ μ³, |d|² ∝ μ⁻², so A ∝ μ¹; the ¹H factor MU_H is applied only at μ = 1', () => {
  for (const mu of MUS) { setMu(mu); assert.ok(rel(dipoleMatrix(p2, s1).abs2, d1 / mu ** 2) < 1e-12); assert.ok(rel(einsteinAtomic(p2, s1), mu * A1) < 1e-12);
    assert.ok(rel(einsteinA(p2, s1) * MU_H, mu * (setMu(1), einsteinA(p2, s1))) < 1e-12); } console.log(`   A(2p₀ → 1s): ¹H ${(setMu(1), einsteinA(p2, s1)).toExponential(4)} s⁻¹ · positronium ${(setMu(0.5), einsteinA(p2, s1)).toExponential(4)} s⁻¹ · muonic H ${(setMu(MASSES['muonic hydrogen']), einsteinA(p2, s1)).toExponential(4)} s⁻¹`); });
ok('Z and μ compose: lengths /(Zμ), energies ×Z²μ; Z = 2 at μ = 1 is the ion road unchanged', () => { setMu(1); setZ(2); assert.equal(H.energy(s1), 4 * energy(1)); assert.ok(!H.label.includes('μ'));
  setMu(0.5); assert.ok(rel(H.energy(s1), 2 * energy(1)) < 1e-15 && rel(H.domainFor(6), half) < 1e-15); setMu(1); setZ(1); for (const k of KEYS) assert.equal(H[k], was[k], k); assert.equal(getMu(), 1); });
console.log(`mass: ${n} laws green`);
