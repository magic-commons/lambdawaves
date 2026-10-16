// tests/bloch.test.mjs — BLOCH's qubit (0.8.1 T1) against its closed forms: run with `node tests/bloch.test.mjs`
import assert from 'node:assert/strict';
import { PRESETS, DEFAULTS, DT, run, vec, closed, lzP, halve, pulse, step, init } from '../lab/bloch-model.js';
const P = (o) => ({ ...DEFAULTS, preset: 'rabi', ...o }), pDown = (s) => s[2] ** 2 + s[3] ** 2, wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x));
let n = 0; const ok = (name, f) => { f(); n++; console.log('ok', name); };

ok('Larmor (Ω = 0): the azimuth advances by ω₀t to 1e-12, P↓ held, at any δ', () => {
  for (const [w0, d, ph] of [[1, 0, 0], [2.3, 0.7, 1.1], [0.4, -3, 4]]) { const p = P({ O: 0, w0, d, th: 1.2, ph });
    for (const t of [0.1, 3, 17.5, 250]) { const v = vec(p, run(p, t).s, t); assert.ok(Math.abs(wrap(Math.atan2(v[1], v[0]) - ph - w0 * t)) < 1e-12, `w0 ${w0} t ${t}`); assert.ok(Math.abs(v[2] - Math.cos(1.2)) < 1e-12); } } });
ok('Rabi on resonance from ↑: P↓ = sin²(Ωt/2) to 1e-10 at ten t (the lab frame, no RWA)', () => {
  for (const O of [0.2, 1.3]) { const p = P({ O, w0: 1.7 }); for (let k = 1; k <= 10; k++) { const t = 3.7 * k; assert.ok(Math.abs(pDown(run(p, t).s) - Math.sin(O * t / 2) ** 2) < 1e-10, `Ω ${O} t ${t}`); } } });
ok('off resonance: the generalised Rabi formula Ω²/(Ω²+δ²)·sin²(√(Ω²+δ²)t/2), and the whole vector by Rodrigues', () => {
  for (const [O, d] of [[0.3, 0.4], [0.5, -1.2]]) { const p = P({ O, d }), W = Math.hypot(O, d); for (let k = 1; k <= 10; k++) { const t = 2.9 * k;
    assert.ok(Math.abs(pDown(run(p, t).s) - O * O / (W * W) * Math.sin(W * t / 2) ** 2) < 1e-10); } }
  const p = P({ O: 0.7, d: 0.2, th: 2.1, ph: 0.9, w0: 1.4 }); for (const t of [0.5, 9, 61]) { const v = vec(p, run(p, t).s, t), c = closed(p, t); assert.ok(Math.hypot(v[0] - c[0], v[1] - c[1], v[2] - c[2]) < 1e-12); } });
ok('FLOP: the π-pulse lands P↓ = 1 and holds it', () => { const p = P({ preset: 'flop' }), tp = pulse(p); assert.ok(Math.abs(tp - Math.PI / p.O) < 1e-15);
  for (const t of [tp, tp + 4, tp + 40]) assert.ok(Math.abs(pDown(run(p, t).s) - 1) < 1e-12); assert.ok(Math.abs(pDown(run(p, tp / 2).s) - 0.5) < 1e-12); });
ok('Landau–Zener at β = 0.05, Ω = 0.3: the flip against 1 − e^{−πΩ²/(2β)}', () => {
  for (const D of [10, 40]) { const p = P({ preset: 'lz', O: 0.3, b: 0.05, d: -D }), T = 2 * D / p.b, s = run(p, T).s, ref = run(p, T, DT / 10).s, h = halve(p), e = Math.hypot(...s.map((x, i) => x - ref[i]));
    const dev = pDown(s) - lzP(p); console.log(`   sweep ±${D}: P↓ ${pDown(s).toFixed(6)} measured · ${lzP(p).toFixed(6)} asymptote · ${dev.toExponential(2)} (finite sweep, order Ω/D = ${(0.3 / D).toExponential(1)}) · step distance ${h.d.toExponential(2)} (dt/10: ${e.toExponential(2)})`);
    assert.ok(Math.abs(dev) < 0.3 / D && h.d < 1e-6 && e < 2 * h.d); } });
ok('unitarity to 1e-12 over 10⁵ steps of a chirp, and every preset’s halved step within 1e-6', () => {
  const p = P({ O: 0.9, d: -3, b: 0.2, th: 0.8, ph: 2 }); let s = init(p); for (let k = 0; k < 1e5; k++) s = step(s, p, k * DT, DT);
  assert.ok(Math.abs(s.reduce((a, x) => a + x * x, 0) - 1) < 1e-12);
  for (const q in PRESETS) { const h = halve(P({ preset: q, ...PRESETS[q] })); assert.ok(h.d < 1e-6, q + ' ' + h.d); } });
ok('the step’s cost (ms)', () => { const p = P({ preset: 'lz', O: 0.3, d: -4.5, b: 0.05 }); let s = init(p), t = performance.now(); for (let k = 0; k < 1e5; k++) s = step(s, p, k * DT, DT);
  const per = (performance.now() - t) / 1e5; t = performance.now(); halve(p); console.log(`   one 2 × 2 step ${(per * 1e3).toFixed(3)} µs · the LZ preset's re-solve ${(performance.now() - t).toFixed(2)} ms`); assert.ok(per < 0.01); });
console.log(`bloch: ${n} laws green`);
