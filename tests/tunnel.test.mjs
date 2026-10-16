// tests/tunnel.test.mjs — LATTICE's TUNNEL and AB PATCH (0.7.2 L2) against their closed forms: run with `node tests/tunnel.test.mjs`
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build, solveLattice, psi0, evolver, split, tunnelT, DEFAULTS } from '../lab/lattice-model.js';
const AB = JSON.parse(readFileSync(new URL('../lab/ab-patch.json', import.meta.url)));
let n = 0; const ok = (name, f) => { f(); n++; console.log('ok', name); };
/* the transmission by the transfer matrix (ψ = e^{ikn} past the barrier, walked back through ψ_{n−1} = (V_n − E)ψ_n − ψ_{n+1}): independent of the closed form */
const transfer = (k, V, nb) => { const E = -2 * Math.cos(k), at = (m) => [Math.cos(k * m), Math.sin(k * m)]; let a = at(nb + 1), b = at(nb);
  for (let m = nb; m >= 0; m--) { const v = m < nb ? V : 0, c = [(v - E) * b[0] - a[0], (v - E) * b[1] - a[1]]; a = b; b = c; }   // b = ψ_{−1}, a = ψ_0
  const zr = Math.cos(k) * a[0] - Math.sin(k) * a[1] - b[0], zi = Math.sin(k) * a[0] + Math.cos(k) * a[1] - b[1];   // e^{ik}ψ_0 − ψ_{−1} = 2i sin k · A, A the incoming amplitude
  return 4 * Math.sin(k) ** 2 / (zr * zr + zi * zi); };
const avg = (k0, V, nb, sk) => { let a = 0, w = 0; for (let k = 5e-5; k < Math.PI; k += 1e-4) { const g = Math.exp(-(((k - k0) / sk) ** 2) / 2); a += g * tunnelT(k, V, nb); w += g; } return a / w; };
const run = (k0, V, nb) => { const p = { ...DEFAULTS, preset: 'tunnel', N: 256, state: 'packet', x0: 0.25, sig: 4, k0, V, nb }, H = build(p), S = solveLattice(H), ev = evolver(S, psi0(p, S, H.xy));
  let hit = -1; for (let t = 0; t < 2000; t += 0.25) { const s = split(ev.at(t), p); if (s.B > 1e-4) hit = t; else if (hit >= 0 && t - hit >= 2) return { ...s, t }; } throw new Error('never passed'); };   // the window's rule: under 1e-4 for 2/J

ok('T(k) closed form = the transfer matrix to 1e-12 (one and two sites, V = 0.5, 1, 3, nine k)', () => {
  for (const nb of [1, 2]) for (const V of [0.5, 1, 3]) for (let j = 1; j <= 9; j++) { const k = j * Math.PI / 10; assert.ok(Math.abs(tunnelT(k, V, nb) - transfer(k, V, nb)) < 1e-12, `${nb} ${V} ${k}`); } });
ok('the packet (σ 4, N 256, V = J, one site) at nine k₀: T measured vs T(k₀), the floor its momentum spread; T + R = 1 to 1e-12', () => {
  const sk = 1 / (4 * Math.SQRT2); console.log('   k₀      T measured  T(k₀)    ⟨T⟩ packet  floor |⟨T⟩ − T(k₀)|  |meas − ⟨T⟩|');
  for (let j = 0; j < 9; j++) { const k0 = 0.6 + j * (Math.PI - 1.2) / 8, r = run(k0, 1, 1), T0 = tunnelT(k0, 1, 1), Ta = avg(k0, 1, 1, sk), floor = Math.abs(Ta - T0);
    console.log(`   ${k0.toFixed(4)}  ${r.T.toFixed(6)}    ${T0.toFixed(6)} ${Ta.toFixed(6)}    ${floor.toExponential(2)}             ${Math.abs(r.T - Ta).toExponential(2)}`);
    assert.ok(Math.abs(r.T + r.R - 1) < 1e-12); assert.ok(Math.abs(r.T - Ta) < 2e-3); assert.ok(Math.abs(r.T - T0) < floor + 2e-3); } });
ok('the two-site barrier: T = 1 at its resonance cos k = −V/2J (closed form and transfer matrix), and the packet launched on it', () => {
  for (const V of [0.5, 1, 1.5]) { const kr = Math.acos(-V / 2); assert.ok(Math.abs(tunnelT(kr, V, 2) - 1) < 1e-12 && Math.abs(transfer(kr, V, 2) - 1) < 1e-12); }
  const kr = Math.acos(-0.5), r = run(kr, 1, 2), Ta = avg(kr, 1, 2, 1 / (4 * Math.SQRT2)); console.log(`   V = J: k = ${kr.toFixed(4)}, T measured ${r.T.toFixed(6)} · ⟨T⟩ ${Ta.toFixed(6)} · one site there ${tunnelT(kr, 1, 1).toFixed(4)}`);
  assert.ok(r.T > 0.96 && Math.abs(r.T - Ta) < 2e-3 && Math.abs(r.T + r.R - 1) < 1e-12); });
ok('the AB patch: ≤ 256 vertices, every bond length 1, 8-fold, the first Bragg orbit at π(1 + √2)', () => {
  const H = build({ ...DEFAULTS, preset: 'patch' }), key = ([x, y]) => Math.round(x * 1e6) + ',' + Math.round(y * 1e6), at = new Set(AB.xy.map(key)), c = Math.SQRT1_2;
  assert.ok(H.n === AB.n && AB.n <= 256 && H.hop.length === AB.edges); for (const [i, j] of H.hop) assert.ok(Math.abs(Math.hypot(H.xy[i][0] - H.xy[j][0], H.xy[i][1] - H.xy[j][1]) - 1) < 1e-12);
  for (const [x, y] of AB.xy) assert.ok(at.has(key([c * (x - y), c * (x + y)])), 'not 8-fold at ' + x + ',' + y);
  const Sq = ([qx, qy]) => { let re = 0, im = 0; for (const [x, y] of AB.xy) { re += Math.cos(qx * x + qy * y); im += Math.sin(qx * x + qy * y); } return (re * re + im * im) / AB.n ** 2; };
  const p = AB.peaks[0]; assert.ok(Math.abs(p.q - Math.PI * (1 + Math.SQRT2)) < 1e-12); let [qx, qy] = p.at;
  for (let r = 0; r < 8; r++) { assert.ok(Math.abs(Sq([qx, qy]) - p.S) < 1e-12); [qx, qy] = [c * (qx - qy), c * (qx + qy)]; }
  console.log(`   ${AB.n} vertices, ${AB.edges} bonds · first orbit |q| ${p.q.toFixed(6)} = π(1 + √2), S ${p.S.toFixed(6)} on all eight`); });
console.log(`PASS tunnel: ${n} laws`);
