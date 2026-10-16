/* tests/stark.test.mjs — 0.8.0 G3 INTER-SHELL STARK: H = diag(E) + F·z over the 91 labels (lab/stark.js) and the register's road to it.
 *   node tests/stark.test.mjs
 * Oracles: ⟨1s|z|2p₀⟩ = 128√2/243; the within-shell law ±3F for n = 2, m = 0 as the F → 0 limit (Richardson); the basis's own sum over states. */
import { hydrogenZ, starkPropagator, polarizability, saddle } from '../lab/stark.js';
import { Register } from '../lab/state.js';
import { createRegisterSturmian } from '../lab/sturmianreg.js';
import { BASIS } from '../lab/hydrogen.js';
let FAILED = 0;
const judge = (name, ok, detail) => { if (!ok) FAILED++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '  ' + JSON.stringify(detail))); };
const N = 91, idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m), z = hydrogenZ().R;
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
console.log(FAILED ? `stark: ${FAILED} RED` : 'stark: all GREEN'); process.exit(FAILED ? 1 : 0);
