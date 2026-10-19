/* tests/stark.test.mjs — 0.8.0 G3 INTER-SHELL STARK: H = diag(E) + F·z over the 140 labels (lab/stark.js) and the register's road to it.
 *   node tests/stark.test.mjs
 * Oracles: ⟨1s|z|2p₀⟩ = 128√2/243; the within-shell law ±3F for n = 2, m = 0 as the F → 0 limit (Richardson); the basis's own sum over states. */
import { hydrogenZ, starkPropagator, polarizability, saddle } from '../lab/stark.js';
import { Register } from '../lab/state.js';
import { createRegisterSturmian } from '../lab/sturmianreg.js';
import { BASIS } from '../lab/hydrogen.js';
let FAILED = 0;
const judge = (name, ok, detail) => { if (!ok) FAILED++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '  ' + JSON.stringify(detail))); };
const N = BASIS.length, idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m), z = hydrogenZ().R;
let asym = 0; for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) asym = Math.max(asym, Math.abs(z[a * N + b] - z[b * N + a]));
judge('z is symmetric', asym === 0, asym);
const z12 = z[idx(1, 0, 0) * N + idx(2, 1, 0)]; judge('⟨1s|z|2p₀⟩ = 128√2/243 to 1e-12', Math.abs(z12 - 128 * Math.SQRT2 / 243) < 1e-12, z12);
/* n = 2, m = 0: the extreme eigenvalues of the n = 2 cluster are E₂ ± 3F + O(F²); half their gap is 3F + O(F³), so Richardson on F, 2F recovers 3F */
const half = (F) => { const e = [...starkPropagator(F).E].filter((x) => Math.abs(x + 0.125) < 0.05); return (Math.max(...e) - Math.min(...e)) / 2; };
const F1 = 1e-4, rich = (4 * half(F1) - half(2 * F1) / 2) / 3;
judge('2s/2p₀ splitting 3F recovered to 1e-10 at F = 1e-4', Math.abs(rich - 3 * F1) < 1e-10, { raw: half(F1) - 3 * F1, richardson: rich - 3 * F1 });
const a6 = polarizability(), P3 = starkPropagator(1e-3), shift = P3.E[0] + 0.5;
judge('1s quadratic shift at F = 1e-3 = −½·α₆·F² to 1e-9', Math.abs(shift + 0.5 * a6 * 1e-6) < 1e-9, { shift, alpha6: a6, share: a6 / 4.5, ms: +P3.ms.toFixed(2) });
const c0 = { re: new Float64Array(N), im: new Float64Array(N) }; c0.re[idx(1, 0, 0)] = Math.SQRT1_2; c0.im[idx(2, 1, 0)] = Math.SQRT1_2;
const P = starkPropagator(0.002), c1 = P.evolve(c0, 100), back = P.evolve(c1, -100);
let dev = 0; for (let a = 0; a < N; a++) dev = Math.max(dev, Math.abs(back.re[a] - c0.re[a]), Math.abs(back.im[a] - c0.im[a]));
judge('evolve is unitary at t = 100 to 1e-12', Math.abs(P.norm(c1) - 1) < 1e-12 && dev < 1e-12, { norm: P.norm(c1) - 1, roundTrip: dev });
judge('saddle F_c = 1/(16 n⁴)', saddle(1) === 1 / 16 && saddle(4) === 1 / 4096 && Math.abs(saddle(4) - 2.44e-4) < 1e-6, [1, 2, 3, 4, 5, 6].map(saddle));
/* the register: INTER-SHELL engages at F > 0, keeps c(t) continuous across a re-anchor, is default-absent, and is refused under another propagator */
const R = new Register(); R.set(idx(1, 0, 0), Math.SQRT1_2, 0, 0); R.set(idx(2, 1, 0), 0, Math.SQRT1_2, 0);
judge('INTER-SHELL off: no propagator, no key in the record', !R.P && !('inter' in R.serialize(0).field));
const before = R.at(7); R.setField({ Fz: 0.002, inter: true }); R.anchorFrom(before.re, before.im, 7); const after = R.at(7), later = R.at(107);
let jump = 0; for (let a = 0; a < N; a++) jump = Math.max(jump, Math.abs(after.re[a] - before.re[a]), Math.abs(after.im[a] - before.im[a]));
judge('INTER-SHELL on: the propagator in force, c(t) continuous, the S-norm conserved', R.P && R.P.stark && jump < 1e-12 && Math.abs(R.norm2() - 1) < 1e-12 && R.serialize(0).field.inter === true, { jump, n: R.norm2() - 1 });
const R2 = new Register(); R2.restore(R.serialize(107)); const again = R2.at(107); let rd = 0; for (let a = 0; a < N; a++) rd = Math.max(rd, Math.abs(again.re[a] - later.re[a]));
judge('a restore re-engages it from the record', R2.P && R2.P.stark && rd < 1e-12, rd);
R.setField({ Fz: 0 }); judge('F = 0 stands it down', !R.P);
R.setField({ Fz: 0.002 }); R.setPropagator(createRegisterSturmian(1)); R.setField({ inter: true, Fz: 0.002 });
judge('refused under STURMIAN (the flag and F both)', !R.P.stark && !('inter' in R.field) && R.field.Fz === 0);
/* THE BLOCKS' SUPPORT (iteration 010 X1): under the Stark field the field draws the labels the evolution REACHES (state.js reach()).
   S = I here, so the drawn fraction is Σ_{a∈R}|c_a(t)|² / Σ|c_a(t)|².  The row: 1s + 2p₀ (1/√2 each, the LOCK's base state). */
{
  const { EPS_POP } = await import('../lab/state.js');
  const frac = (R, ids, t) => { const c = R.at(t); let n = 0, d = 0; const inR = new Set(ids); for (let a = 0; a < N; a++) { const p = c.re[a] ** 2 + c.im[a] ** 2; d += p; if (inR.has(a)) n += p; } return n / d; };
  const row = () => { const R = new Register(); R.set(idx(1, 0, 0), Math.SQRT1_2, 0, 0); R.set(idx(2, 1, 0), Math.SQRT1_2, 0, 0); return R; };
  const m0 = BASIS.filter((s) => s.m === 0).map((s) => s.index);
  for (const F of [0.002, 0.01]) {
    const R = row(); R.setField({ Fz: F, inter: true });
    const rs = R.renderSet(), got = [...rs.ids].sort((x, y) => x - y), anchor = R.populated();
    const fa = [3.7, 100, 1000].map((t) => frac(R, anchor, t)), fr = [3.7, 100, 1000].map((t) => frac(R, rs.ids, t));
    let out = 0; const inR = new Set(rs.ids); for (let i = 0; i < 300; i++) { const c = R.at(i * 7.31); for (let a = 0; a < N; a++) if (!inR.has(a)) out = Math.max(out, c.re[a] ** 2 + c.im[a] ** 2); }
    judge(`SUPPORT · INTER-SHELL F = ${F}: the field draws the reach — all 28 m = 0 labels (the anchor holds 2) — and the drawn norm is 100 % (1e-12) at t = 3.7, 100, 1000; no m ≠ 0 label rises above EPS_POP over 300 times (brute force)`,
      JSON.stringify(got) === JSON.stringify(m0) && rs.anchored === 2 && fr.every((f) => f > 1 - 1e-12) && out <= EPS_POP, { anchorFrac: fa.map((f) => +f.toFixed(6)), reachFrac: fr, outside: out });
  }
  /* the within-shell Stark (no propagator, F ≠ 0) spreads c(t) through each (n, m) block: 2p₀ ↔ 2s at the rate 3F */
  const Rw = row(); Rw.setField({ Fz: 0.002 });
  const rw = Rw.renderSet(), fw = frac(Rw, rw.ids, 100), fwA = frac(Rw, Rw.populated(), 100);
  judge('SUPPORT · WITHIN-SHELL F = 0.002: the reach is the touched (n, m) blocks — 1s, 2s, 2p₀ — and draws 100 % at t = 100 (1e-12) where the anchor\'s two draw 84 %',
    JSON.stringify([...rw.ids].sort((x, y) => x - y)) === JSON.stringify([idx(1, 0, 0), idx(2, 0, 0), idx(2, 1, 0)].sort((x, y) => x - y)) && fw > 1 - 1e-12 && fwA < 0.9, { ids: rw.ids.map((a) => BASIS[a].label), reachFrac: fw, anchorFrac: fwA });
  const R0 = row(); R0.setField({ Fz: 0.002, inter: true }); R0.setField({ Fz: 0 });
  judge('SUPPORT: F back to 0 is undriven again — the anchor\'s two labels, the old record (no `reach` key)', !R0.driven() && JSON.stringify(R0.renderSet().ids) === JSON.stringify([idx(1, 0, 0), idx(2, 1, 0)]) && !('reach' in R0.renderSet()));
}
console.log(FAILED ? `stark: ${FAILED} RED` : 'stark: all GREEN'); process.exit(FAILED ? 1 : 0);
