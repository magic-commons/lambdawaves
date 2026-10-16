// tests/bell.test.mjs — BLOCH's PAIR mode (0.8.1 T2): the Bell pair's reduced states, entanglement entropy and CHSH value: run with `node tests/bell.test.mjs`
import assert from 'node:assert/strict';
import { BELL, pair, bell, corr } from '../lab/bloch-model.js';
const BELLS = ['phip', 'phim', 'psip', 'psim'], TURNS = [[0, 0], [0.7, 0], [1.1, 0.4], [2.5, 4], [Math.PI, 1.3]];
let n = 0; const ok = (name, f) => { f(); n++; console.log('ok', name); };

ok('S_A = ln 2 for Φ± and Ψ± to 1e-12; ρ_A = ρ_B = 1/2, so both Bloch vectors have length 0', () => {
  for (const id of BELLS) { const q = bell(pair(id, 0, 0), id); assert.ok(Math.abs(q.S - Math.LN2) < 1e-12, id); assert.ok(Math.hypot(...q.rA) < 1e-15 && Math.hypot(...q.rB) < 1e-15, id); } });
ok('PRODUCT |↑↑⟩: S_A = 0 to 1e-12, both vectors of length 1 (on ẑ)', () => {
  const q = bell(pair('prod', 0, 0), 'prod'); assert.ok(q.S < 1e-12); assert.deepEqual(q.rA, [0, 0, 1]); assert.deepEqual(q.rB, [0, 0, 1]); });
ok('a local rotation on A (θ, φ) is unitary and leaves S_A, |r_A| and ρ_B where they were, to 1e-12', () => {
  for (const id of Object.keys(BELL)) { const q0 = bell(pair(id, 0, 0), id);
    for (const [th, ph] of TURNS) { const s = pair(id, th, ph), q = bell(s, id);
      assert.ok(Math.abs(s.reduce((a, x) => a + x * x, 0) - 1) < 1e-12); assert.ok(Math.abs(q.S - q0.S) < 1e-12 && Math.abs(q.r - q0.r) < 1e-12, `${id} ${th} ${ph}`);
      assert.ok(Math.hypot(...q.rB.map((x, i) => x - q0.rB[i])) < 1e-12, `${id}: ρ_B moved`); } } });
ok('a rotated PRODUCT carries A’s arrow to (θ, φ) and B’s stays on ẑ', () => {
  for (const [th, ph] of TURNS) { const q = bell(pair('prod', th, ph), 'prod'), e = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
    assert.ok(Math.hypot(...q.rA.map((x, i) => x - e[i])) < 1e-12 && Math.hypot(q.rB[0], q.rB[1], q.rB[2] - 1) < 1e-12); } });
ok('CHSH on the drawn axes = 2√2 for every Bell state to 1e-10 (Tsirelson); PRODUCT stays within the classical 2', () => {
  for (const id of BELLS) { const q = bell(pair(id, 0, 0), id); assert.ok(Math.abs(q.chsh - 2 * Math.SQRT2) < 1e-10, id + ' ' + q.chsh); }
  for (const [th, ph] of TURNS) assert.ok(Math.abs(bell(pair('prod', th, ph), 'prod').chsh) <= 2 + 1e-12); });
ok('the best axes give 2√(2 − |r|²): brute force over the x–z plane for in-plane turns (amplitudes real), to 1e-5', () => {
  for (const id of Object.keys(BELL)) for (const th of [0, 0.7, 1.9]) { const s = pair(id, th, 0), q = bell(s, id), u = (t) => [Math.sin(t), Math.cos(t)];
    const C = [[corr(s, [1, 0], [1, 0]), corr(s, [1, 0], [0, 1])], [corr(s, [0, 1], [1, 0]), corr(s, [0, 1], [0, 1])]], T = ([x, z]) => [x * C[0][0] + z * C[1][0], x * C[0][1] + z * C[1][1]], len = (v) => Math.hypot(...v); let best = 0;
    for (let i = 0; i < 720; i++) for (let j = 0; j < 720; j++) { const a = T(u(i * Math.PI / 360)), b = T(u(j * Math.PI / 360)); best = Math.max(best, len(a.map((x, k) => x + b[k])) + len(a.map((x, k) => x - b[k]))); }
    assert.ok(Math.abs(best - q.max) < 1e-5, `${id} θ ${th}: ${best} vs ${q.max}`); } });
console.log(`bell: ${n} laws green`);
