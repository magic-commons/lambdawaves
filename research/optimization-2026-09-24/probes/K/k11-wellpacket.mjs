/* probes/K/k11-wellpacket.mjs — K11 gate (node): the factor-cached wellPacket against the base one (probes/K/well-base.js),
 * Object.is on all 91 re, 91 im and `captured`, over packets × radii (incl. a packet on the wall and one at the centre),
 * then the median ms of 5 interleaved calls each.   node research/optimization-2026-09-24/probes/K/k11-wellpacket.mjs */
import fs from 'node:fs';
import * as B from './well-base.js';
import * as N from '../../../../lab/well.js';
const cases = [[[-4, 0, 0], [2, 0, 0], 1.2], [[0, 0, 3], [0, 0, -1.5], 0.9], [[1, -2, 0.5], [0.7, 0.3, -0.4], 1.6], [[0, 0, 0], [0, 0, 0], 2.5], [[0, 0, -9.9], [0, 0, 0.8], 0.6], [[-5, 0, 0], [0.8, 0, 0], 1.8]];
const out = { radii: {}, bitIdentical: true, compared: 0 };
for (const radius of [10, 4.5, 27]) {
  B.setWellRadius(radius); N.setWellRadius(radius);
  const rows = [];
  for (const [x0, k, sg] of cases) {
    const X0 = x0.map((v) => v * radius / 10);
    const tA = [], tB = []; let P, Q;
    for (let rep = 0; rep < (radius === 10 ? 5 : 1); rep++) { let t0 = performance.now(); P = B.wellPacket(X0, k, sg); tA.push(performance.now() - t0); t0 = performance.now(); Q = N.wellPacket(X0, k, sg); tB.push(performance.now() - t0); }
    let same = Object.is(P.captured, Q.captured); out.compared++;
    for (let q = 0; q < 91; q++) { out.compared += 2; if (!Object.is(P.re[q], Q.re[q]) || !Object.is(P.im[q], Q.im[q])) same = false; }
    if (!same) out.bitIdentical = false;
    tA.sort((a, b) => a - b); tB.sort((a, b) => a - b);
    rows.push({ x0: X0, k, sigma: sg, same, baseMs: +tA[tA.length >> 1].toFixed(1), builtMs: +tB[tB.length >> 1].toFixed(1), captured: Q.captured });
  }
  out.radii[radius] = rows;
}
B.setWellRadius(10); N.setWellRadius(10);
console.log(JSON.stringify(out));
fs.writeFileSync(new URL('./k11-wellpacket.out.json', import.meta.url), JSON.stringify(out, null, 1));
process.exit(out.bitIdentical ? 0 : 1);
