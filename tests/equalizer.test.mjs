/* tests/equalizer.test.mjs — the node proof of THE BEAT EQUALIZER's table (0.6.0 B1).
 *   node tests/equalizer.test.mjs
 * The forms are written by hand here in f64 from the register's closed forms; the tables come from lab/equalizer.js.
 */
import { createEqualizer } from '../lab/equalizer.js';
import { BASIS, BASIS_INDEX, psiAt, energy } from '../lab/hydrogen.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const S = ['h:1:0:0', 'h:2:1:0', 'h:3:2:0'].map((id) => BASIS_INDEX.get(id));   // 1s + 2p_z + 3d_0, unit amplitudes
const P = Array.from({ length: 12 }, (_, i) => [Math.sin(1.3 * i) * 4, Math.cos(0.7 * i) * 3, (i - 5.5) * 0.9]);
const at = (t, [x, y, z]) => {                                                     // acc_n, inc and the plain ρ at one voxel
  const re = new Float64Array(91), im = new Float64Array(91), acc = Array.from({ length: 6 }, () => [0, 0]); let inc = 0;
  for (const a of S) { re[a] = Math.cos(-energy(BASIS[a].n) * t); im[a] = Math.sin(-energy(BASIS[a].n) * t);
    const p = psiAt(re, im, x, y, z, [a]); acc[BASIS[a].n - 1][0] += p.re; acc[BASIS[a].n - 1][1] += p.im; inc += p.re * p.re + p.im * p.im; }
  const p = psiAt(re, im, x, y, z, S); return { acc, inc, rho: p.re * p.re + p.im * p.im };
};
const form = (G, k, v) => { let r = k * v.inc;                                  // ρ′ = Σ Re Γ_ij acc_i acc̄_j + κ·inc
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const [ar, ai] = v.acc[i], [br, bi] = v.acc[j], gr = G[(i * 6 + j) * 2], gi = G[(i * 6 + j) * 2 + 1];
    r += gr * (ar * br + ai * bi) - gi * (ai * br - ar * bi); } return r; };
const ONES = new Float64Array(72).map((_, i) => (i % 2 ? 0 : 1));
const tab = (id, s) => { const eq = createEqualizer(); eq.setPreset(id); if (s) s.forEach((v, i) => eq.setGain(i, v)); return eq.table({ populated: S }); };
const g = (t, i, j) => Math.hypot(t.gamma[(i * 6 + j) * 2], t.gamma[(i * 6 + j) * 2 + 1]);
const unitDiag = (t) => [0, 1, 2, 3, 4, 5].every((i) => Math.abs(t.gamma[i * 14] - 1) < 1e-7 && Math.abs(t.gamma[i * 14 + 1]) < 1e-7);
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
  const eq = createEqualizer(); eq.setPreset('gauss'); const rates = new Float64Array(91).fill(1); rates[BASIS_INDEX.get('h:2:1:1')] = 2;
  const t = eq.table({ populated: [...S, BASIS_INDEX.get('h:2:1:1')], rates });
  judge('THE LABELS GATE: two rates in one shell refuse the table, with the sentence', t.gamma === null && t.gate === 'one rate per shell for the equalizer', t);
  eq.setGain(2, 0.25); const o = eq.serialize(), e2 = createEqualizer(); e2.restore(JSON.parse(JSON.stringify(o)));
  judge('serialize / restore round-trips; birth serializes to null', JSON.stringify(e2.serialize()) === JSON.stringify(o) && o.preset === 'gauss' && createEqualizer().serialize() === null, o);
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'equalizer.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
