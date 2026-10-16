// tests/lattice.test.mjs — LATTICE's model (0.7.2 L1) against its closed forms: run with `node tests/lattice.test.mjs`
import assert from 'node:assert/strict';
import { build, solveLattice, psi0, evolver, ipr, closed, DEFAULTS } from '../lab/lattice-model.js';
const P = (o) => ({ ...DEFAULTS, ...o }), solve = (p) => { const H = build(p); return { H, S: solveLattice(H) }; };
const maxDiff = (a, b) => a.reduce((m, x, i) => Math.max(m, Math.abs(x - b[i])), 0);
let n = 0; const ok = (name, f) => { f(); n++; console.log('ok', name); };

ok('chain levels −2J cos(πk/(N+1)) to 1e-12', () => { for (const N of [3, 40, 256]) { const p = P({ preset: 'chain', N }); assert.ok(maxDiff(solve(p).S.E, closed(p).levels) < 1e-12); } });
ok('ring and AB ring E(Φ) = −2J cos((2πk + Φ)/N) to 1e-12', () => {
  assert.ok(maxDiff(solve(P({ preset: 'ring', N: 30 })).S.E, closed(P({ preset: 'ring', N: 30 })).levels) < 1e-12);
  for (const Phi of [0.3, 1.7, Math.PI]) { const p = P({ preset: 'ab', N: 24, Phi }); assert.ok(maxDiff(solve(p).S.E, closed(p).levels) < 1e-10, 'Φ ' + Phi); } });
ok('square and Hückel benzene levels', () => {
  const p = P({ preset: 'square', L: 6 }); assert.ok(maxDiff(solve(p).S.E, closed(p).levels) < 1e-12);
  assert.deepEqual([...solve(P({ preset: 'benzene' })).S.E].map((e) => Math.round(e * 1e9) / 1e9), [-2, -1, -1, 1, 1, 2]); });
ok('SSH: the gap 2|J₁ − J₂| and two edge states at J₁ < J₂ (IPR > 0.4, N = 40)', () => {
  const { S } = solve(P({ preset: 'ssh', N: 40, J1: 0.2, J2: 1 })), mid = [19, 20];
  for (const m of mid) { assert.ok(Math.abs(S.E[m]) < 1e-8); assert.ok(ipr(psi0(P({ state: 'eigen', idx: m }), S, null)) > 0.4); }
  assert.ok(Math.abs(S.E[21] - S.E[18] - 2 * 0.8) < 0.05, 'the bulk gap ' + (S.E[21] - S.E[18]));
  const t = solve(P({ preset: 'ssh', N: 40, J1: 1, J2: 0.2 })).S; assert.ok(Math.abs(t.E[20] - t.E[19] - 1.6) < 0.05, 'trivial: no edge states'); });
ok('Aubry–André: the IPR jumps across λ = 2J (N = 144 = F₁₂, β = F₁₁/F₁₂)', () => {
  const mean = (lam) => { const { S } = solve(P({ preset: 'aa', N: 144, lam, beta: 89 / 144 })); let s = 0; for (let m = 0; m < 144; m++) s += ipr(psi0(P({ state: 'eigen', idx: m }), S, null)); return s / 144; };
  const lo = mean(1), hi = mean(3); console.log('   mean IPR λ = J', lo.toFixed(4), '· λ = 3J', hi.toFixed(4)); assert.ok(lo < 0.05 && hi > 0.3); });
ok('graphene flakes: 24/54/96 sites, levels symmetric about 0', () => {
  for (const [rings, count] of [[2, 24], [3, 54], [4, 96]]) { const { S } = solve(P({ preset: 'graphene', rings })); assert.equal(S.n, count);
    for (let k = 0; k < count; k++) assert.ok(Math.abs(S.E[k] + S.E[count - 1 - k]) < 1e-10); } });
ok('the evolution is unitary to 1e-12 at t = 100 (real and Hermitian)', () => {
  for (const p of [P({ preset: 'chain', N: 128 }), P({ preset: 'ab', N: 48, Phi: 1.1, x0: 0.5 })]) { const { H, S } = solve(p), ev = evolver(S, psi0(p, S, H.xy)), psi = ev.at(100);
    let z = 0; for (let i = 0; i < S.n; i++) z += psi.re[i] ** 2 + psi.im[i] ** 2; assert.ok(Math.abs(z - 1) < 1e-12, String(z - 1));
    const back = ev.at(0), p0 = psi0(p, S, H.xy); assert.ok(maxDiff(back.re, p0.re) < 1e-12 && maxDiff(back.im, p0.im) < 1e-12); } });
ok('the solve at 256 sites and the evolution a frame (ms)', () => {
  const p = P({ preset: 'chain', N: 256 }), H = build(p); let t = performance.now(); const S = solveLattice(H); const ms = performance.now() - t, ev = evolver(S, psi0(p, S, H.xy));
  t = performance.now(); for (let f = 0; f < 200; f++) ev.at(f * 0.1); console.log(`   solve ${ms.toFixed(1)} ms · evolution ${((performance.now() - t) / 200).toFixed(3)} ms a frame (N = 256, real)`); });
console.log(`lattice: ${n} laws green`);
