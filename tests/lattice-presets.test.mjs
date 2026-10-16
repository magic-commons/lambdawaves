// tests/lattice-presets.test.mjs — LATTICE's HOFSTADTER · QUANTUM WALK · SPIN CHAIN (0.8.1 T3) against oracles the app never uses: run with `node tests/lattice-presets.test.mjs`
import assert from 'node:assert/strict';
import { build, solveLattice, psi0, evolver, closed, walker, spinView, DEFAULTS } from '../lab/lattice-model.js';
const P = (o) => ({ ...DEFAULTS, ...o }), maxDiff = (a, b) => a.reduce((m, x, i) => Math.max(m, Math.abs(x - b[i])), 0);
let n = 0; const ok = (name, f) => { f(); n++; console.log('ok', name); };

ok('Hofstadter Φ = 1/2 on the 12 × 12 torus = ±2J√(cos²k_x + cos²k_y) to 1e-10; Φ = 1/3: Harper’s two gaps 3 − √3', () => {
  const L = 12, want = []; for (let j = 0; j < L / 2; j++) for (let m = 0; m < L; m++) { const e = 2 * Math.hypot(Math.cos(2 * Math.PI * j / L), Math.cos(2 * Math.PI * m / L)); want.push(e, -e); }   // the magnetic zone: k_x over half the ring
  const p = P({ preset: 'hofstadter', L, fp: 1, fq: 2 }), H = build(p), E = solveLattice(H).E, d = maxDiff(E, want.sort((a, b) => a - b));
  assert.ok(H.n === 144 && H.hop.length === 288 && d < 1e-10, 'Φ = 1/2: ' + d);
  const q = P({ preset: 'hofstadter', L, fp: 1, fq: 3 }), c = closed(q, solveLattice(build(q)).E), gaps = [...c.sub.matchAll(/gaps? (\d\.\d+)|· (\d\.\d+)/g)].map((m) => +(m[1] || m[2]));
  console.log(`   Φ = 1/2: ${d.toExponential(1)} · Φ = 1/3: ${c.line} · ${c.sub}`); assert.ok(gaps.length === 2 && gaps.every((g) => Math.abs(g - (3 - Math.sqrt(3))) < 1e-3)); });
ok('the Hadamard walk: Σ P = 1 to 1e-12 and σ²(50) within 2 % of (1 − 1/√2)t² (Konno 2002), mean 0 for the symmetric coin', () => {
  const v = walker(128).at(50); let m0 = 0, m1 = 0, m2 = 0; for (let i = 0; i < 128; i++) { const q = v.re[i] ** 2 + v.im[i] ** 2, x = i - 64; m0 += q; m1 += q * x; m2 += q * x * x; }
  const c = (m2 - m1 * m1) / 2500, k = 1 - Math.SQRT1_2; console.log(`   σ²/t² at t = 50: ${c.toFixed(5)} measured · ${k.toFixed(5)} known · ${((c / k - 1) * 100).toFixed(3)} % · Σ P − 1 = ${(m0 - 1).toExponential(1)}`);
  assert.ok(v.steps === 50 && Math.abs(m0 - 1) < 1e-12 && Math.abs(m1) < 1e-12 && Math.abs(c / k - 1) < 0.02); });
ok('the XX chain at N = 6: the 64 levels = Jordan–Wigner Σ_occupied 2J cos(πk/7) to 1e-12', () => {
  const e = [1, 2, 3, 4, 5, 6].map((k) => 2 * Math.cos(Math.PI * k / 7)), jw = Array.from({ length: 64 }, (_, s) => e.reduce((a, x, k) => a + ((s >> k) & 1 ? x : 0), 0)).sort((a, b) => a - b);
  const d = maxDiff(solveLattice(build(P({ preset: 'spin', ns: 6 }))).E, jw); console.log(`   ${d.toExponential(1)}`); assert.ok(d < 1e-12); });
ok('the quench from |↑↓↑↓…⟩: S(0) = 0, S(t) ≤ ⌊N/2⌋ ln 2, unitary to 1e-12; its peak against Page’s mean', () => {
  for (const N of [6, 8]) { const p = P({ preset: 'spin', ns: N, state: 'site', idx: 0x55 & ((1 << N) - 1) }), H = build(p), S = solveLattice(H), ev = evolver(S, psi0(p, S, H.xy)), A = N >> 1;
    assert.ok(Math.abs(spinView(ev.at(0), N).S) < 1e-12 && spinView(ev.at(0), N).z.every((z, i) => Math.abs(z - (i % 2 ? -1 : 1)) < 1e-12));
    let peak = 0, at = 0; for (let t = 0.5; t <= 200; t += 0.5) { const psi = ev.at(t), v = spinView(psi, N); let z = 0; for (let i = 0; i < S.n; i++) z += psi.re[i] ** 2 + psi.im[i] ** 2;
      assert.ok(Math.abs(z - 1) < 1e-12 && v.S <= A * Math.LN2 + 1e-12); if (v.S > peak) { peak = v.S; at = t; } }
    console.log(`   N = ${N}: peak S ${peak.toFixed(4)} at t = ${at}/J · Page’s mean ${(A * Math.LN2 - 0.5).toFixed(4)} · ln 2^${A} = ${(A * Math.LN2).toFixed(4)}`); } });
console.log(`PASS lattice-presets: ${n} laws`);
