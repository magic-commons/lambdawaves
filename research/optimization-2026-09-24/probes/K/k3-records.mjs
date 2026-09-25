/* probes/K/k3-records.mjs — K3 gate: the persistent gas records pack to the SAME kernel bytes as the base's fresh records.
 *   node --expose-gc research/optimization-2026-09-24/probes/K/k3-records.mjs
 * Base = probes/K/gas-base.js (git show 91c90bc:lab/gas.js) + packModes cut out of probes/K/field-base.js (fresh [0,0,0]);
 * built = lab/gas.js + lab/field.js packModes.  Object.is on every packed float over launches × times × radii, then the
 * time and the heap growth per fieldModes call, both sides, min of interleaved rounds. */
import fs from 'node:fs';
import { createGas as baseGas } from './gas-base.js';
import { createGas } from '../../../../lab/gas.js';
import { packModes } from '../../../../lab/field.js';
const src = fs.readFileSync(new URL('./field-base.js', import.meta.url), 'utf8');
const a = src.indexOf('const PACK = new Float32Array'), b = src.indexOf('\nconst tableCache', a);
const basePack = new Function('MAX_MODES', 'MODE_BYTES', src.slice(a, b).replace('export function packModes', 'function packModes') + '\nreturn packModes;')(320, 112);
const cases = [];
let compared = 0, differ = 0, lenDiffer = 0;
for (const radius of [10, 6.5, 23]) {
  const G0 = baseGas(radius), G1 = createGas(radius);
  for (const [z0, k, s] of [[-5, 2, 0.8], [-3, 0.4, 1.8], [2, -1.1, 0.6], [0, 0, 3]]) {
    const z = Math.max(-0.8 * radius, Math.min(0.8 * radius, z0));
    const L0 = G0.launch(z, k, s, 0.25), L1 = G1.launch(z, k, s, 0.25);
    if (!Object.is(L0.captured, L1.captured)) differ++;
    for (const t of [0.25, 1, 3.7, 17.3, 420.5, -2]) {
      const m0 = G0.fieldModes(t), m1 = G1.fieldModes(t);
      if (m0.length !== m1.length) { lenDiffer++; continue; }
      const p0 = Float32Array.from(basePack(m0).buf.subarray(0, m0.length * 28)), p1 = packModes(m1).buf.subarray(0, m1.length * 28);
      for (let j = 0; j < p0.length; j++) { compared++; if (!Object.is(p0[j], p1[j])) differ++; }
      cases.push(m1.length);
    }
  }
  // setRadius mid-life: both rebuild; a fresh launch after it packs the same
  G0.setRadius(radius + 1.5); G1.setRadius(radius + 1.5); G0.launch(-2, 1, 1, 0); G1.launch(-2, 1, 1, 0);
  const m0 = G0.fieldModes(2), m1 = G1.fieldModes(2);
  const p0 = Float32Array.from(basePack(m0).buf.subarray(0, m0.length * 28)), p1 = packModes(m1).buf.subarray(0, m1.length * 28);
  if (m0.length !== m1.length) lenDiffer++; else for (let j = 0; j < p0.length; j++) { compared++; if (!Object.is(p0[j], p1[j])) differ++; }
}
/* cost: 256 modes populated (the narrow fast packet), interleaved rounds */
const G0 = baseGas(10), G1 = createGas(10); G0.launch(-5, 2.5, 0.8, 0); G1.launch(-5, 2.5, 0.8, 0);
const time = (f, n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) f(i); return (performance.now() - t0) / n; };
const R = { base: [], built: [] };
for (let rd = 0; rd < 5; rd++) { R.base.push(time((i) => basePack(G0.fieldModes(3.7 + i * 1e-3)), 2000)); R.built.push(time((i) => packModes(G1.fieldModes(3.7 + i * 1e-3)), 2000)); }
const heap = (f) => { globalThis.gc && globalThis.gc(); const keep = []; const h0 = process.memoryUsage().heapUsed; for (let i = 0; i < 200; i++) keep.push(f(i)); const d = (process.memoryUsage().heapUsed - h0) / 200; return Math.round(d); };
const out = { compared, differ, lenDiffer, modesPerCase: [Math.min(...cases), Math.max(...cases)],
  msPerReconstruct: { base: +Math.min(...R.base).toFixed(4), built: +Math.min(...R.built).toFixed(4) },
  heapBytesPerCall: { base: heap((i) => G0.fieldModes(3.7 + i * 1e-3)), built: heap((i) => G1.fieldModes(3.7 + i * 1e-3)) } };
console.log(JSON.stringify(out));
fs.writeFileSync(new URL('./k3-records.out.json', import.meta.url), JSON.stringify(out, null, 1));
process.exit(differ || lenDiffer ? 1 : 0);
