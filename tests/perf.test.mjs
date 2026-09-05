/* tests/perf.test.mjs — the node proof of wave 45's performance work: the same numbers, none of the garbage.
 *   node tests/perf.test.mjs
 * What is judged: the SLAP tables built a slice at a time (kick.js warmStep) give the SAME matrix as the one-shot
 * build (the 1s→2p dipole limit and the identity at k = 0, as kick.test.mjs judges them); packModes packs into ONE
 * persistent buffer with the right count and values; the register's energy() and autocorrelation() are the same
 * numbers through the scratch arrays (against the direct sums); the particles' ring trails hold at most trailLen
 * points, oldest first, and release their canvas when off; Register.setAnchorAt is _op's road at t = 0 and t ≠ 0.
 */
import { BASIS, energy } from '../lab/hydrogen.js';
import { warmStep, tablesReady, kickMatrixZ, applyKickAlong } from '../lab/kick.js';
import { packModes, tableFor, MAX_MODES } from '../lab/field.js';
import { Register, PRESET_BY_ID } from '../lab/state.js';
import { createParticles } from '../lab/particles.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const T0 = performance.now();

/* ── the SLAP tables, a slice at a time ─────────────────────────────────────── */
{
  let steps = 0, t0 = performance.now();
  while (!warmStep(2)) steps++;
  const wall = performance.now() - t0;
  const M0 = kickMatrixZ(0); let offDiag = 0, diag = 0;
  for (let a = 0; a < 91; a++) for (let b = 0; b < 91; b++) { if (a === b) diag = Math.max(diag, Math.abs(M0.re[a * 91 + b] - 1) + Math.abs(M0.im[a * 91 + b])); else offDiag = Math.max(offDiag, Math.abs(M0.re[a * 91 + b]) + Math.abs(M0.im[a * 91 + b])); }
  const k = 1e-3, M = kickMatrixZ(k), a = idx(1, 0, 0), b = idx(2, 1, 0);
  const dip = M.im[a * 91 + b] / k, exact = 128 * Math.SQRT2 / 243;
  judge(`P the SLAP tables built in ${steps} slices of ≤ 2 ms (${wall.toFixed(0)} ms in all) are ready, give the identity at k = 0 (1e-12) and the 1s→2p dipole 128√2/243 = ${exact.toFixed(6)} from M(k)/ik at k = 1e-3 (1e-5): the incremental build is the one-shot build`,
    tablesReady() && steps > 3 && diag < 1e-12 && offDiag < 1e-12 && Math.abs(dip - exact) < 1e-5, { steps, wall: +wall.toFixed(1), diag, offDiag, dip, exact });
}
/* ── packModes: one persistent buffer, the right count ──────────────────────── */
{
  const reg = new Register(); reg.load(PRESET_BY_ID.get('1s+2pz'));
  const modes = reg.populated().map((a) => ({ table: tableFor(BASIS[a]), re: reg.re0[a], im: reg.im0[a] }));
  const p1 = packModes(modes), buf1 = p1.buf;
  const p2 = packModes(modes.slice(0, 1));
  const sameBuf = p2.buf === buf1;
  const T = tableFor(BASIS[0]);
  const rec = { n: buf1[0], l: buf1[1], am: buf1[2], m: buf1[3], re: buf1[4], im: buf1[5], norm: buf1[6], expo: buf1[7], lag0: buf1[8], leg0: buf1[16] };
  const ok = p1.count === 2 && p2.count === 1 && sameBuf && rec.n === T.n && rec.norm === Math.fround(T.norm) && rec.expo === T.n + 1 && rec.lag0 === Math.fround(T.lag[0]) && rec.leg0 === Math.fround(T.leg[0]) && buf1.length === MAX_MODES * 28;
  judge('P packModes packs the 1s+2pz preset (count 2) and then one mode (count 1) into the SAME persistent Float32Array of 320 records, the first record carrying the 1s table (n, norm, exponent n+1, the Laguerre and Legendre leads) — no 36 KB buffer per reconstruct', ok, { c1: p1.count, c2: p2.count, sameBuf, rec: { n: rec.n, expo: rec.expo, norm: rec.norm }, len: buf1.length });
}
/* ── the register's observables through the scratch arrays ────────────────── */
{
  const reg = new Register(); reg.load(PRESET_BY_ID.get('1s+2pz'));
  const direct = () => { let e = 0, n = 0; for (const a of reg.populated()) { const p = reg.population(a); e += p * reg.Ediag(a); n += p; } return e / n; };
  const e1 = reg.energy(), e2 = reg.energy(), eD = direct();
  const t = 3.7; let r = 0, i = 0, n = 0; for (const a of reg.populated()) { const p = reg.population(a); n += p; r += p * Math.cos(-reg.Ediag(a) * t); i += p * Math.sin(-reg.Ediag(a) * t); }
  const A = reg.autocorrelation(t), AD = Math.hypot(r / n, i / n);
  reg.setField({ Bz: 0.01, Fz: 0.002 }); const eS = reg.energy(), AS = reg.autocorrelation(1.5).abs;   // the Stark road: the blocks' eigenvalues
  const na = reg.normalAmplitudes(0), naS = reg.normalAmplitudes(0, true);
  const sameNA = na.E.length === naS.E.length && na.E.every((v, k) => v === naS.E[k]) && na.re.every((v, k) => v === naS.re[k]);
  judge('P energy() and autocorrelation() read c(t) through the register\'s scratch arrays and give the direct sums to 1e-14 (1s+2pz: ⟨E⟩ = −0.3125, |A(3.7)|), are repeatable, and under Zeeman + Stark the scratch normalAmplitudes equals the allocating one element for element',
    Math.abs(e1 - eD) < 1e-14 && e1 === e2 && Math.abs(e1 + 0.3125) < 1e-12 && Math.abs(A.abs - AD) < 1e-14 && Number.isFinite(eS) && AS > 0 && AS <= 1 + 1e-12 && sameNA, { e1, eD, A: A.abs, AD, eS, AS, sameNA });
}
/* ── setAnchorAt is _op's road ──────────────────────────────────────────────── */
{
  const A = new Register(); A.load(PRESET_BY_ID.get('1s+2pz')); const B = new Register(); B.load(PRESET_BY_ID.get('1s+2pz'));
  const d = [0.6, 0, 0.8];
  A.kickAlong(0.4, d, 0);
  const c0 = B.at(0); applyKickAlong(c0.re, c0.im, 0.4, d); B.setAnchorAt(c0.re, c0.im, 0);
  let w0 = 0; for (let a = 0; a < 91; a++) w0 = Math.max(w0, Math.abs(A.re0[a] - B.re0[a]), Math.abs(A.im0[a] - B.im0[a]));
  const A2 = new Register(); A2.load(PRESET_BY_ID.get('1s+2pz')); const B2 = new Register(); B2.load(PRESET_BY_ID.get('1s+2pz'));
  const t = 2.3; A2.kickAlong(0.4, d, t);
  const ct = B2.at(t); applyKickAlong(ct.re, ct.im, 0.4, d); B2.setAnchorAt(ct.re, ct.im, t);
  let wt = 0; for (let a = 0; a < 91; a++) wt = Math.max(wt, Math.abs(A2.re0[a] - B2.re0[a]), Math.abs(A2.im0[a] - B2.im0[a]));
  judge('P Register.setAnchorAt(kicked c(t), t) — the bow\'s landing — reproduces reg.kickAlong(k, d, t) on the anchor to 1e-13 at t = 0 (the anchor itself) and at t = 2.3 (carried back), with the version bumped', w0 < 1e-13 && wt < 1e-13 && B.version > 1 && B2.version > 1, { w0, wt });
}
/* ── the particles' ring trails and their canvas ────────────────────────────── */
{
  const calls = { size: [] };
  const ctx = { setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {}, fill() {}, fillText() {} };
  const canvas = { width: 300, height: 150, clientWidth: 400, clientHeight: 300, getContext: () => ctx };
  globalThis.window = globalThis.window || { devicePixelRatio: 1 };
  const P = createParticles(canvas, {});
  const reg = new Register(); reg.load(PRESET_BY_ID.get('2p+'));
  P.setOn(true); P.setTrail(6);
  const n = P.seed(24, reg, 0, 7);
  for (let s = 1; s <= 10; s++) P.advance(reg, 0.2 * s, 7);
  const tr = P.trailOf(0), allFinite = tr.every((p) => p.every(Number.isFinite));
  const last = P.points[0], lastIsHead = tr.length ? Math.abs(tr[tr.length - 1][0] - last[0]) < 1e-6 && Math.abs(tr[tr.length - 1][2] - last[2]) < 1e-6 : false;
  P.draw({ yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 }, 7); const sizedOn = canvas.width === 400 && canvas.height === 300, alive = P.state.alive;
  P.setOn(false); const released = canvas.width === 1 && canvas.height === 1;
  judge(`P particles: ${n} seeded from |2p₊|², ten advances of 0.2 a.u. leave a ring trail of at most 6 points (${tr.length}), finite, oldest first with the head the particle's position; drawn ON the canvas is sized to the stage, switched OFF it is released to 1 × 1`,
    n >= 16 && alive >= 10 && tr.length === 6 && allFinite && lastIsHead && sizedOn && released, { n, alive, trail: tr.length, sizedOn, released });
}
console.log(`perf.test wall ${((performance.now() - T0) / 1000).toFixed(1)} s`);
console.log((FAILED ? 'RED' : 'GREEN') + ' perf.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
