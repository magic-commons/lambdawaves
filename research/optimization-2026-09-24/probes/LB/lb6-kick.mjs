/* lb6-kick.mjs — LANE LB · LB6 gate: kick.js's speed-up is bit-identical.  Node.
 *   node research/optimization-2026-09-24/probes/LB/lb6-kick.mjs [time]
 * ORACLE: kick-base.mjs (lab/kick.js at 91c90bc).  Under hydrogen Z = 2, the oscillator, hydrogen Z = 1, the BOX, the
 * quarkonium and the atom: kickMatrixZ(k) element by element, and the LANDED REGISTER — a seeded state kicked along x, y,
 * z (applyKick, the K key's road) and along two oblique directions (applyKickAlong, the bow's road), each pressed TWICE
 * (the second press is the new matrix cache's hit) — every double compared with Object.is, at k ∈ {1e-4, 1e-3, 0.05,
 * 0.3, 1.2, 2.5, 0, −0.7}.  The new module builds its tables through warmStep(0) (every resumption point), the oracle
 * one-shot.  `time`: fresh module instances, cold table build and warm kick timings, old vs new. */
import { setHamiltonian, setZ, HAMILTONIANS } from '../../../../lab/hamiltonian.js';
const OLD = await import('./kick-base.mjs');
const NEW = await import('../../../../lab/kick.js');
const N = 91;
let checks = 0, bad = 0; const fails = [];
const same = (a, b, what) => { checks++; if (a.length !== b.length) { bad++; fails.push(what + ' length'); return; } for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) { bad++; fails.push(what + ' [' + i + '] ' + a[i] + ' vs ' + b[i]); return; } };
const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 - 0.5; };
const KS = [1e-4, 1e-3, 0.05, 0.3, 1.2, 2.5, 0, -0.7];
const configs = [
  ['hydrogen Z=2', () => { setHamiltonian('hydrogen'); setZ(2); }],
  ['oscillator', () => { setHamiltonian('qho'); }],
  ['hydrogen Z=1', () => { setZ(1); setHamiltonian('hydrogen'); }],
  ['box', () => { setHamiltonian('well'); }],
  ['quarkonium', () => { setHamiltonian('cornell'); }],
  ['atom', () => { setHamiltonian('atom'); }],
];
for (const [name, set] of configs) {
  set();
  while (!NEW.warmStep(0)) { /* every resumption point */ }
  for (const k of KS) {
    const Mo = OLD.kickMatrixZ(k), Mn = NEW.kickMatrixZ(k);
    same(Mo.re, Mn.re, name + ' M.re k=' + k); same(Mo.im, Mn.im, name + ' M.im k=' + k);
    Mn.re[0] = 12345;                                            // a caller scribbling on its copy must not reach the cache
    const Mn2 = NEW.kickMatrixZ(k); same(Mo.re, Mn2.re, name + ' M.re (after a caller wrote its copy) k=' + k);
    for (const axis of ['z', 'x', 'y', 'd1', 'd2']) {
      const rnd = seeded(7 + Math.round(k * 1000) + axis.length), re = new Float64Array(N), im = new Float64Array(N);
      for (let a = 0; a < N; a++) { re[a] = rnd(); im[a] = rnd(); }
      const r1 = Float64Array.from(re), i1 = Float64Array.from(im), r2 = Float64Array.from(re), i2 = Float64Array.from(im);
      const d = axis === 'd1' ? [0.3, -0.5, 0.8] : [-0.9, 0.2, 0.1];
      for (let press = 0; press < 2; press++) {
        if (axis.length === 1) { OLD.applyKick(r1, i1, k, axis); NEW.applyKick(r2, i2, k, axis); }
        else { OLD.applyKickAlong(r1, i1, k, d); NEW.applyKickAlong(r2, i2, k, d); }
        same(r1, r2, name + ' register.re ' + axis + ' press ' + press + ' k=' + k); same(i1, i2, name + ' register.im ' + axis + ' press ' + press + ' k=' + k);
      }
    }
  }
}
console.log(JSON.stringify({ checks, differing: bad, fails: fails.slice(0, 10) }));
if (process.argv[2] === 'time') {
  setZ(1); setHamiltonian('hydrogen');
  const t = (f) => { const t0 = performance.now(); f(); return +(performance.now() - t0).toFixed(1); };
  const out = {};
  for (const [label, url] of [['old', './kick-base.mjs?cold'], ['new', '../../../../lab/kick.js?cold']]) {
    const K = await import(url);
    const cold = t(() => { while (!K.warmStep(1e9)) { /* */ } });
    const warmFresh = []; for (let i = 0; i < 7; i++) warmFresh.push(t(() => K.kickMatrixZ(0.37 + i * 0.011)));
    const re = new Float64Array(N).fill(0.1), im = new Float64Array(N);
    K.applyKick(re, im, 0.5, 'z');
    const repeat = []; for (let i = 0; i < 7; i++) repeat.push(t(() => K.applyKick(re, im, 0.5, i % 3 ? 'x' : 'z')));
    const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
    out[label] = { coldTablesMs: cold, kickMatrixFreshKMs: med(warmFresh), applyKickRepeatMs: med(repeat) };
  }
  console.log(JSON.stringify(out));
}
process.exit(bad ? 1 : 0);
