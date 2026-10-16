/* tests/squeeze.test.mjs — the node proof of the SQUEEZE and the CAT on the oscillator (0.8.0 G2).   node tests/squeeze.test.mjs
 * Oracles: S(r) = e^{r(a_z² − a_z†²)/2} is unitary on the full 1-D Fock basis; Var(z) of S|0⟩ is e^{−2r}/2; |α⟩ + |−α⟩ (α = ik/√2) is ∝ cos(kz)e^{−r²/2},
 * even, ⟨z⟩ = 0, ⟨z²⟩ = ½ − k²e^{−k²}/(1 + e^{−k²}).  The register (n_r + l ≤ 5) truncates: the lost norm and the variance error are measured, the cap 0.33 is
 * where the variance error reaches 2e-3 (the leading dropped term is the ⟨4|z²|6⟩ cross term, ∝ r⁵ — the tolerance's shape). */
import { BASIS } from '../lab/hydrogen.js';
import { setHamiltonian } from '../lab/hamiltonian.js';
import { squeeze1D, squeezeMatrix, applySqueeze, applyKickAlong, SQUEEZE_REFUSAL } from '../lab/kick.js';
import { varianceZ } from '../lab/calculus.js';
import { dipoleZ } from '../lab/dynamics.js';
let FAILED = 0, TOTAL = 0;
const judge = (name, ok, detail) => { TOTAL++; if (!ok) FAILED++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400))); };
const N = 91, ground = () => { const re = new Float64Array(N), im = new Float64Array(N); re[0] = 1; return [re, im]; }, norm2 = (re, im) => re.reduce((s, v, a) => s + v * v + im[a] * im[a], 0);
setHamiltonian('qho');
{ const zs = Float64Array.from({ length: 801 }, (_, k) => -16 + k * 0.04), S = squeeze1D(0.5, 80, zs), I = squeezeMatrix(0); let e = 0, e0 = 0;
  for (let n = 0; n <= 10; n++) for (let p = 0; p <= 10; p++) e = Math.max(e, Math.abs(S.reduce((s, row) => s + row[n] * row[p], 0) - (n === p)));
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) e0 = Math.max(e0, Math.abs(I[a * N + b] - (a === b)));
  judge('S unitary on the full product basis: S(0.5)ᵀS(0.5) = 1 on n_z ≤ 10 summed over n_z ≤ 80 (1e-12), and the register map at r = 0 is the identity (1e-12)', e < 1e-12 && e0 < 1e-12, { e, e0 }); }
{ const rows = [], tol = (r) => 2e-3 * (r / 0.33) ** 5;
  for (const r of [0.1, 0.2, 0.3, 0.33, 0.4, 0.5]) { const [re, im] = ground(); applySqueeze(re, im, r); const v = varianceZ(re, im), exact = Math.exp(-2 * r) / 2; rows.push({ r, v, exact, err: Math.abs(v / exact - 1), tol: tol(r), lost: 1 - norm2(re, im) }); }
  for (const x of rows) console.log(`      r ${x.r.toFixed(2)}  Var(z) ${x.v.toFixed(6)}  e^{−2r}/2 ${x.exact.toFixed(6)}  error ${x.err.toExponential(2)}  tol ${x.tol.toExponential(2)}  lost norm ${x.lost.toExponential(2)}`);
  const gated = rows.filter((x) => x.r <= 0.33), at = (r) => rows.find((x) => x.r === r);
  judge('Var(z) of S(r)|0⟩ against e^{−2r}/2 within tol(r) = 2e-3·(r/0.33)⁵ for r ≤ 0.33 (the knob\'s cap), and the cap is tight: at 0.4 the error is past 2e-3', gated.every((x) => x.err <= x.tol) && at(0.4).err > 2e-3, gated.map((x) => x.err));
  judge('the lost norm re-measured: 3.73e-5 at the cap, 5.43e-4 at r = 0.5 (the 0.6.0 plan\'s 2.4e-5 assumed every |0 0 n_z⟩, n_z ≤ 10, in the register; it holds n_r + l ≤ 5)', Math.abs(at(0.33).lost / 3.728e-5 - 1) < 1e-3 && Math.abs(at(0.5).lost / 5.433e-4 - 1) < 1e-3, [at(0.33).lost, at(0.5).lost]); }
{ const k = 1, [A, Ai] = ground(), [B, Bi] = ground(); applyKickAlong(A, Ai, k, [0, 0, 1]); applyKickAlong(B, Bi, k, [0, 0, -1]);   // the IMPULSE row's CAT: ±d at k > 0
  const re = A.map((v, a) => v + B[a]), im = Ai.map((v, a) => v + Bi[a]), n = Math.sqrt(norm2(re, im)); for (let a = 0; a < N; a++) { re[a] /= n; im[a] /= n; }
  const odd = BASIS.reduce((s, b, a) => s + (b.l % 2 ? re[a] ** 2 + im[a] ** 2 : 0), 0), z = dipoleZ(re, im).value, v = varianceZ(re, im), exact = 0.5 - k * k * Math.exp(-k * k) / (1 + Math.exp(-k * k));
  judge(`the CAT |α⟩ + |−α⟩ at k = 1: even (odd-l weight ${odd.toExponential(1)}), ⟨z⟩ = ${z.toExponential(1)}, Var(z) ${v.toFixed(6)} against ½ − k²e^{−k²}/(1 + e^{−k²}) = ${exact.toFixed(6)} (1e-4, the slap's own truncation)`, odd < 1e-24 && Math.abs(z) < 1e-14 && Math.abs(v - exact) < 1e-4); }
{ setHamiltonian('hydrogen'); const [re, im] = ground(); let said = ''; try { applySqueeze(re, im, 0.2); } catch (e) { said = e.message; }
  judge('REFUSED off the OSCILLATOR with the sentence, the state untouched', said === SQUEEZE_REFUSAL && re[0] === 1 && norm2(re, im) === 1, said); }
console.log(`\n${TOTAL - FAILED}/${TOTAL} squeeze laws hold`);
process.exit(FAILED ? 1 : 0);
