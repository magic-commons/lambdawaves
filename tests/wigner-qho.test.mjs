/* tests/wigner-qho.test.mjs — 0.8.2 P1: the WIGNER slice on the OSCILLATOR's register, against the 1-D Fock closed forms.
 *   node tests/wigner-qho.test.mjs
 * The register's 1s is |0 0 0⟩ and 2p₀ is |0 0 1⟩ (ψ ∝ z e^{−r²/2}); W of a product state is the product of the 1-D W's, so the
 * slice x = p_x = y = p_y = 0 is W_0(0,0)² · W_n(z, p) = W_n(z, p)/π² — the transverse ground states give their value at 0, 1/π each.
 * THE COHERENT GATE is the register's own truncation (N ≤ 5 whole, N = 6 lacks l = 6): the slap keeps 1 − 1.2e-6 of the norm at k = 1. */
import { wignerSlice, wignerAxial } from '../lab/wigner.js';
import { BASIS } from '../lab/hydrogen.js';
import { wignerFock } from '../lab/qho.js';
import { setHamiltonian } from '../lab/hamiltonian.js';
import { applyKickZ } from '../lab/kick.js';
let FAILED = 0;
const judge = (name, ok, d) => { if (!ok) FAILED++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (d === undefined ? '' : '\n      ' + JSON.stringify(d))); };
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m), PI2 = Math.PI * Math.PI;
const negativity = (S) => { let a = 0, w = 0; for (const v of S.W) { a += Math.abs(v); w += v; } return a / w - 1; };
for (const [name, a, n] of [['|0⟩ = 1s', idx(1, 0, 0), 0], ['|1⟩ along z = 2p₀', idx(2, 1, 0), 1]]) {
  const T = [{ a, re: 1, im: 0 }]; let worst = 0;
  for (let z = -4; z <= 4; z += 0.5) for (let p = -3; p <= 3; p += 0.5) worst = Math.max(worst, Math.abs(wignerAxial(T, z, p, { qho: true }) - wignerFock(n, z, p) / PI2));
  const w00 = wignerAxial(T, 0, 0, { qho: true });
  judge(`W ${name} = W_${n}(z, p)/π² on 17 × 13 points to 1e-10; W(0,0) = ${w00} against ${(n ? -1 : 1) / (Math.PI * PI2)} = ${n ? '−' : ''}1/π · 1/π²`, worst < 1e-10 && Math.abs(w00 - (n ? -1 : 1) / (Math.PI * PI2)) < 1e-12, { worst });
  const ng = negativity(wignerSlice(T, { z: [-5.6, 5.6, 64], p: [-4, 4, 64], qho: true })), want = n ? 4 / Math.sqrt(Math.E) - 2 : 0;
  judge(`NEGATIVITY ${name} on the window's 64 × 64 grid: ${ng.toFixed(5)} against the whole slice ${want.toFixed(5)} (3 decimals)`, Math.abs(ng - want) < 5e-4);
}
setHamiltonian('qho');
const re = new Float64Array(BASIS.length), im = new Float64Array(BASIS.length); re[idx(1, 0, 0)] = 1; applyKickZ(re, im, 1);
let n2 = 0; for (let a = 0; a < BASIS.length; a++) n2 += re[a] * re[a] + im[a] * im[a];
const T = []; for (let a = 0; a < BASIS.length; a++) if (re[a] || im[a]) T.push({ a, re: re[a] / Math.sqrt(n2), im: im[a] / Math.sqrt(n2) });
const S = wignerSlice(T, { z: [-5.6, 5.6, 64], p: [-4, 4, 64], qho: true }), ng = negativity(S);
judge(`a slap k = 1 on |0⟩ (${T.length} labels, ‖c‖² = ${n2.toFixed(9)}): min ${S.min.toExponential(2)} > −1e-8 (peak 1/π³), negativity ${ng.toExponential(2)} < 1e-7 — reads 0.000`, S.min > -1e-8 && ng < 1e-7 && T.length <= 28);   // the m = 0 labels: 21 on n ≤ 6, 28 on n ≤ 7
console.log(FAILED ? `\n${FAILED} RED` : '\nALL GREEN'); if (FAILED) process.exit(1);
