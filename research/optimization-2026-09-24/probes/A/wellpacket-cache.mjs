/* wellpacket-cache.mjs — lane F's F7 / open question 2 to lane A: an exactness-preserving speed-up of well.js wellPacket.
 * The shipped projection calls wellFromTable(tabs[q], x, y, z) for all 91 labels at every grid point: 91 hypot/atan2/sqrt,
 * 91 spherical Bessels (only 21 distinct (n, l) — the m's share k), 91 Legendre polynomials (21 distinct (l, |m|)),
 * 91 {re, im} objects.  The cached version evaluates each distinct factor ONCE per point with the SAME expression on the
 * SAME inputs, and multiplies them in the SAME order (norm · j · st^|m| · D, then · cos/sin(mφ)), so every product is the
 * same double.  Run: node research/optimization-2026-09-24/probes/A/wellpacket-cache.mjs */
import { wellPacket, wellTableFor, wellRadius } from '../../../../lab/well.js';
import { BASIS } from '../../../../lab/hydrogen.js';
import { sphericalBessel } from '../../../../lab/bessel.js';
import fs from 'node:fs';

function wellPacketCached(x0, k, sigma, { G = 36 } = {}) {
  const a = wellRadius(), h = 2 * a / G, w = h * h * h;
  const re = new Float64Array(91), im = new Float64Array(91);
  const A = Math.pow(2 * Math.PI * sigma * sigma, -0.75);
  const tabs = BASIS.map((s) => wellTableFor(s));
  /* the distinct factors: radial per (n, l), angular polynomial per (l, |m|) */
  const radKey = new Map(), angKey = new Map(), radOf = new Int32Array(91), angOf = new Int32Array(91);
  const radT = [], angT = [];
  for (let q = 0; q < 91; q++) { const T = tabs[q];
    const rk = T.l + ':' + T.lag[0] + ':' + T.lag[1]; if (!radKey.has(rk)) { radKey.set(rk, radT.length); radT.push(T); } radOf[q] = radKey.get(rk);
    const ak = T.am + ':' + Array.from(T.leg).join(','); if (!angKey.has(ak)) { angKey.set(ak, angT.length); angT.push(T); } angOf[q] = angKey.get(ak); }
  const J = new Float64Array(radT.length), Dv = new Float64Array(angT.length), SM = new Float64Array(angT.length);
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) for (let l = 0; l < G; l++) {
    const x = -a + (i + 0.5) * h, y = -a + (j + 0.5) * h, z = -a + (l + 0.5) * h;
    if (x * x + y * y + z * z >= a * a) continue;
    const dx = x - x0[0], dy = y - x0[1], dz = z - x0[2];
    const g = A * Math.exp(-(dx * dx + dy * dy + dz * dz) / (4 * sigma * sigma)), ph = k[0] * x + k[1] * y + k[2] * z;
    const pr = g * Math.cos(ph), pi = g * Math.sin(ph);
    /* wellFromTable's geometry, once */
    const r = Math.hypot(x, y, z);
    const ct = r < 1e-300 ? 1 : z / r, st = Math.sqrt(Math.max(0, 1 - ct * ct)), phi = Math.atan2(y, x);
    for (let u = 0; u < radT.length; u++) { const T = radT[u]; J[u] = r >= T.lag[1] ? NaN : sphericalBessel(T.l, T.lag[0] * r); }
    for (let u = 0; u < angT.length; u++) { const T = angT[u]; let D = 0, xp = 1; for (let jj = 0; jj < 6; jj++) { D += T.leg[jj] * xp; xp *= ct; } Dv[u] = D; let stm = 1; for (let s = 0; s < T.am; s++) stm *= st; SM[u] = stm; }
    for (let q = 0; q < 91; q++) {
      const T = tabs[q];
      if (r >= T.lag[1]) continue;                                     // wellFromTable returns {0, 0} → the shipped `continue`
      const f = T.norm * J[radOf[q]] * SM[angOf[q]] * Dv[angOf[q]];
      const vre = f * Math.cos(T.m * phi), vim = f * Math.sin(T.m * phi);
      if (vre === 0 && vim === 0) continue;
      re[q] += w * (vre * pr + vim * pi); im[q] += w * (vre * pi - vim * pr);
    }
  }
  let captured = 0; for (let q = 0; q < 91; q++) captured += re[q] * re[q] + im[q] * im[q];
  const s = captured > 0 ? 1 / Math.sqrt(captured) : 0;
  for (let q = 0; q < 91; q++) { re[q] *= s; im[q] *= s; }
  return { re, im, captured };
}
const cases = [[[-4, 0, 0], [2, 0, 0], 1.2], [[0, 0, 3], [0, 0, -1.5], 0.9], [[1, -2, 0.5], [0.7, 0.3, -0.4], 1.6]];
const out = { distinct: null, cases: [] };
for (const [x0, k, sg] of cases) {
  wellPacket(x0, k, sg); wellPacketCached(x0, k, sg);                  // warm both
  const tA = [], tB = []; let A, B;
  for (let rep = 0; rep < 5; rep++) { let t0 = performance.now(); A = wellPacket(x0, k, sg); tA.push(performance.now() - t0); t0 = performance.now(); B = wellPacketCached(x0, k, sg); tB.push(performance.now() - t0); }
  let same = true; for (let q = 0; q < 91; q++) if (!Object.is(A.re[q], B.re[q]) || !Object.is(A.im[q], B.im[q])) same = false;
  tA.sort((a, b) => a - b); tB.sort((a, b) => a - b);
  out.cases.push({ x0, k, sigma: sg, shippedMs: +tA[2].toFixed(1), cachedMs: +tB[2].toFixed(1), speedup: +(tA[2] / tB[2]).toFixed(2), bitIdentical: same && Object.is(A.captured, B.captured), captured: A.captured });
}
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(new URL('./wellpacket-cache.out.json', import.meta.url), JSON.stringify(out, null, 1));
