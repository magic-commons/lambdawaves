/* tests/equalizer.test.mjs — the node proof of THE BEAT EQUALIZER's table (0.6.0 B1).
 *   node tests/equalizer.test.mjs
 * The forms are written by hand here in f64 from the register's closed forms; the tables come from lab/equalizer.js.
 */
import { createEqualizer, EQ_SHELLS } from '../lab/equalizer.js';
import { BASIS, BASIS_INDEX, psiAt, energy } from '../lab/hydrogen.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const S = ['h:1:0:0', 'h:2:1:0', 'h:3:2:0'].map((id) => BASIS_INDEX.get(id));   // 1s + 2p_z + 3d_0, unit amplitudes
const P = Array.from({ length: 12 }, (_, i) => [Math.sin(1.3 * i) * 4, Math.cos(0.7 * i) * 3, (i - 5.5) * 0.9]);
const K = EQ_SHELLS;                                                               // iteration 009 N7: the table is 7 × 7 (the seventh band)
const at = (t, [x, y, z], SS = S) => {                                             // acc_n, inc and the plain ρ at one voxel
  const re = new Float64Array(BASIS.length), im = new Float64Array(BASIS.length), acc = Array.from({ length: K }, () => [0, 0]); let inc = 0;
  for (const a of SS) { re[a] = Math.cos(-energy(BASIS[a].n) * t); im[a] = Math.sin(-energy(BASIS[a].n) * t);
    const p = psiAt(re, im, x, y, z, [a]); acc[BASIS[a].n - 1][0] += p.re; acc[BASIS[a].n - 1][1] += p.im; inc += p.re * p.re + p.im * p.im; }
  const p = psiAt(re, im, x, y, z, SS); return { acc, inc, rho: p.re * p.re + p.im * p.im };
};
const form = (G, k, v) => { let r = k * v.inc;                                  // ρ′ = Σ Re Γ_ij acc_i acc̄_j + κ·inc
  for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) { const [ar, ai] = v.acc[i], [br, bi] = v.acc[j], gr = G[(i * K + j) * 2], gi = G[(i * K + j) * 2 + 1];
    r += gr * (ar * br + ai * bi) - gi * (ai * br - ar * bi); } return r; };
const ONES = new Float64Array(2 * K * K).map((_, i) => (i % 2 ? 0 : 1));
const tab = (id, s, SS = S) => { const eq = createEqualizer(); eq.setPreset(id); if (s) s.forEach((v, i) => eq.setGain(i, v)); return eq.table({ populated: SS }); };
const g = (t, i, j) => Math.hypot(t.gamma[(i * K + j) * 2], t.gamma[(i * K + j) * 2 + 1]);
const unitDiag = (t) => Array.from({ length: K }, (_, i) => i).every((i) => Math.abs(t.gamma[i * 2 * (K + 1)] - 1) < 1e-7 && Math.abs(t.gamma[i * 2 * (K + 1) + 1]) < 1e-7);
const psd = (t) => t.lambdaMin >= -1e-12 * Math.max(...t.lambda.map(Math.abs));
{
  let flat = 0, split = 0, max = 0;
  const W = tab('within'), B = tab('beats');
  for (const t of [0, 37.5]) for (const x of P) { const v = at(t, x); max = Math.max(max, v.rho);
    flat = Math.max(flat, Math.abs(form(ONES, 0, v) - v.rho)); split = Math.max(split, Math.abs(form(W.gamma, W.kappa, v) + form(B.gamma, B.kappa, v) + v.inc - v.rho)); }
  judge('FLAT: Γ = 11ᵀ, κ = 0 is |Σ c ψ e^{−iEt}|² on 12 voxels at two times (1e-12 of max)', flat < 1e-12 * max, { flat, max });
  judge('THE SPLIT: WITHIN-SHELL + BEATS ONLY + inc = ρ (1e-12 of max)', split < 1e-12 * max, { split, max });
}
const PHYS = ['gauss', 'cauchy', 'box', 'comb', 'pulse'];
{
  const T = PHYS.map((id) => tab(id));
  judge('every jitter, the comb and the pulse: PSD, unit diagonal, never repaired', T.every((t) => psd(t) && unitDiag(t) && !t.repaired && t.mode !== 2), T.map((t) => t.lambdaMin));
  judge('the three jitters: |g(1↔2)| = ½', T.slice(0, 3).every((t) => Math.abs(g(t, 0, 1) - 0.5) < 1e-6), T.slice(0, 3).map((t) => g(t, 0, 1)));
  judge('THE COMB: |g(1↔6)| = 1.000, |g(5↔6)| ≈ 0.009', Math.abs(g(T[3], 0, 5) - 1) < 5e-4 && Math.abs(g(T[3], 4, 5) - 0.009) < 0.002, [g(T[3], 0, 5), g(T[3], 4, 5)]);
  const L = T[4].lambda;
  judge('THE PULSE: rank one, λ = [0, 0, 0, 0, 0, 6], the complex store (mode 0)', T[4].mode === 0 && Math.abs(L[5] - 6) < 1e-12 && L.slice(0, 5).every((v) => Math.abs(v) < 1e-12), [...L]);
  const b = tab('beats');
  judge('BEATS ONLY: indefinite, the signed store (mode 2), never repaired', b.mode === 2 && b.lambdaMin < -0.5 && !b.repaired, b.lambdaMin);
  const G = PHYS.map((id) => tab(id, [1, 0.5, 1, 1, 1, 1]));
  judge('gains s = (1, ½, 1, 1, 1, 1): still PSD with unit diagonal', G.every((t) => psd(t) && unitDiag(t)), G.map((t) => t.lambdaMin));
  judge('at birth (FLAT, every gain 1) there is no table', createEqualizer().table({ populated: S }) === null);
}
{
  const eq = createEqualizer(); eq.setPreset('gauss'); const rates = new Float64Array(BASIS.length).fill(1); rates[BASIS_INDEX.get('h:2:1:1')] = 2;
  const t = eq.table({ populated: [...S, BASIS_INDEX.get('h:2:1:1')], rates });
  judge('THE LABELS GATE: two rates in one shell refuse the table, with the sentence', t.gamma === null && t.gate === 'one rate per shell for the equalizer', t);
  eq.setGain(2, 0.25); const o = eq.serialize(), e2 = createEqualizer(); e2.restore(JSON.parse(JSON.stringify(o)));
  judge('serialize / restore round-trips; birth serializes to null', JSON.stringify(e2.serialize()) === JSON.stringify(o) && o.preset === 'gauss' && createEqualizer().serialize() === null, o);
}
/* THE SEVENTH BAND (iteration 009 N7): a populated n = 7 no longer stands the table down — it is solved over seven shells (D = 7), keeps every
   law the six kept (FLAT is the plain sum, the split adds up, the jitters PSD with a unit diagonal, the pulse rank one), and the seventh gain
   rides the save only when it is off 1 (an n ≤ 6 project's bytes never move) */
{
  const S7 = ['h:1:0:0', 'h:3:2:0', 'h:7:1:0', 'h:7:6:-2'].map((id) => BASIS_INDEX.get(id));
  let flat = 0, split = 0, max = 0;
  const W7 = tab('within', null, S7), B7 = tab('beats', null, S7);
  for (const t of [0, 37.5]) for (const x of P.map((q) => q.map((v) => 6 * v))) { const v = at(t, x, S7); max = Math.max(max, v.rho);
    flat = Math.max(flat, Math.abs(form(ONES, 0, v) - v.rho)); split = Math.max(split, Math.abs(form(W7.gamma, W7.kappa, v) + form(B7.gamma, B7.kappa, v) + v.inc - v.rho)); }
  const T7 = PHYS.map((id) => tab(id, null, S7)), pulse = T7[4].lambda;
  judge('THE SEVENTH BAND: with 7p₀ and 7i₋₂ populated the table is solved over seven shells (no gate), FLAT is the plain sum and the split adds up (1e-12 of max, 12 voxels × 6 a₀, two times), every jitter, the comb and the pulse PSD with a unit diagonal, the pulse rank one at λ = 7',
    W7.shells === 7 && !W7.gate && flat < 1e-12 * max && split < 1e-12 * max && T7.every((t) => t.shells === 7 && psd(t) && unitDiag(t) && !t.repaired) && Math.abs(pulse[6] - 7) < 1e-12 && pulse.slice(0, 6).every((v) => Math.abs(v) < 1e-12),
    { flat, split, max, lambdaMin: T7.map((t) => t.lambdaMin), pulse: [...pulse] });
  const e6 = createEqualizer(); e6.setPreset('gauss'); e6.setGain(2, 0.5); const e7 = createEqualizer(); e7.setPreset('gauss'); e7.setGain(6, 0.25);
  const r7 = createEqualizer(); r7.restore(JSON.parse(JSON.stringify(e7.serialize())));
  judge('THE SEVENTH GAIN IN A SAVE: six gains while the seventh is 1, seven when it is not, and a seven-gain save round-trips', e6.serialize().gains.length === 6 && e7.serialize().gains.length === 7 && r7.gains[6] === 0.25 && tab('gauss').shells === 6, { six: e6.serialize(), seven: e7.serialize() });
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'equalizer.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
