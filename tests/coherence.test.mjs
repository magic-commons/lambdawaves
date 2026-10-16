/* tests/coherence.test.mjs — THE COHERENCE MAP (0.8.2 P2): ρ_ab over the register, the equalizer's damping read from lab/equalizer.js.
 *   node tests/coherence.test.mjs */
import { coherence, createEqualizer, EQ_PRESETS } from '../lab/equalizer.js';
import { BASIS, BASIS_INDEX } from '../lab/hydrogen.js';
let FAILED = 0; const judge = (name, ok, d) => { if (!ok) FAILED++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (d === undefined ? '' : '  ' + JSON.stringify(d))); };
const lab = (id, w = 1) => { const a = BASIS_INDEX.get(id); return { re: Math.sqrt(w), im: 0, label: id, E: BASIS[a].E, n: BASIS[a].n }; };
const c = [lab('h:1:0:0'), lab('h:2:1:0')], P = c.map((x) => BASIS_INDEX.get(x.label)), pops = new Float64Array(91); for (const a of P) pops[a] = 1;
const plain = coherence(c), d = plain.M[0][0] + plain.M[1][1];
judge('1s + 2p₀: one off-diagonal pair of 0.5, the populations sum to 1', Math.abs(plain.M[0][1] - 0.5) < 1e-12 && plain.M[1][0] === plain.M[0][1] && Math.abs(d - 1) < 1e-12, plain.M);
const eq = createEqualizer(); eq.setPreset('flat');
judge('FLAT (the plain sum) is no table and leaves the map', eq.table({ populated: P, pops }) === null && coherence(c, null).M[0][1] === plain.M[0][1]);
for (const id of ['gauss', 'cauchy', 'box', 'comb']) {
  eq.setPreset(id); const T = eq.table({ populated: P, pops }), G = T.gamma, f = Math.hypot(G[2], G[3]), m = coherence(c, T);   // Γ_{1,2}: the model's number
  judge(`${id}: the off-diagonal shrinks by exactly |Γ₁₂| = ${f.toFixed(6)}, the diagonal stays`, f < 1 && Math.abs(m.M[0][1] - 0.5 * f) < 1e-12 && m.M[0][0] === plain.M[0][0] && m.F[0][1] === f);
}
judge('the presets the test reads are the model\'s', ['gauss', 'cauchy', 'box', 'comb'].every((id) => EQ_PRESETS.some((p) => p.id === id)));
const many = Array.from({ length: 13 }, (_, i) => ({ ...lab(BASIS[i].id), re: 1 + i })), cap = coherence(many);
judge('13 labels: twelve drawn, the smallest |c| is not, one said cut', cap.L.length === 12 && !cap.L.includes(many[0]) && cap.cut === 1);
console.log(FAILED ? `${FAILED} RED` : 'ALL GREEN'); process.exit(FAILED ? 1 : 0);
