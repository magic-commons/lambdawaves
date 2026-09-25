/* probes/K/k4-lazy.mjs — K4 gate (node): the lazily-built gas gives the SAME numbers as the base's eager one, a WELL RADIUS
 * pointermove costs < 1 ms, and the idle warm builds in short slices.
 *   node research/optimization-2026-09-24/probes/K/k4-lazy.mjs
 * Base = probes/K/gas-base.js (git show 91c90bc:lab/gas.js).  Every compared number goes through Object.is. */
import fs from 'node:fs';
import { createGas as baseGas } from './gas-base.js';
const same = (a, b) => { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false; return true; };
let compared = 0, differ = 0;
const chk = (a, b) => { compared++; if (!(Array.isArray(a) || ArrayBuffer.isView(a) ? same(a, b) : Object.is(a, b))) differ++; };
const { createGas } = await import('../../../../lab/gas.js');
/* 1) the numbers: a script of radius changes, launches and reads, run on both */
function script(G) {
  const out = [];
  out.push(G.modes.length, G.modes[37].k, G.modes[255].rnorm, G.overlap(3, 5), G.overlap(40, 40));
  G.setRadius(7.25); G.setRadius(13); G.setRadius(13);                   // two moves of the knob, then a no-op
  const L = G.launch(-4, 1.7, 0.9, 0.5); out.push(L.captured, L.modes);
  const c = G.at(2.2); out.push(c.re, c.im);
  const s = G.stats(2.2, 2); out.push(s.norm, s.z, s.sz, s.r);
  out.push(G.norm2(2.2));
  const fm = G.fieldModes(3.1); out.push(fm.length, ...fm.map((m) => m.re), ...fm.map((m) => m.im), ...fm.map((m) => m.table.lag[0]), ...fm.map((m) => m.table.lag[1]), ...fm.map((m) => m.table.norm));
  G.setRadius(10); out.push(G.on, G.at(1).re, G.norm2(1));                // radius back: off, zero state until a launch
  return out;
}
const a = script(baseGas(10)), b = script(createGas(10, { warm: false }));
for (let i = 0; i < a.length; i++) chk(a[i], b[i]);
/* 2) a WELL RADIUS drag: 60 pointermoves, base (rebuilds every move) vs lazy (marks stale) — then the first launch */
const time = (f) => { const t0 = performance.now(); f(); return performance.now() - t0; };
const drag = (G) => { const ms = []; for (let i = 0; i < 60; i++) ms.push(time(() => G.setRadius(10 + 0.05 * (i + 1)))); return ms.sort((x, y) => x - y); };
const G0 = baseGas(10), G1 = createGas(10, { warm: false });
G1.modes;                                                                  // both start built
const d0 = drag(G0), d1 = drag(G1);
const l0 = time(() => G0.launch(-5, 2, 0.8, 0)), l1 = time(() => G1.launch(-5, 2, 0.8, 0));
chk(G0.captured, G1.captured);
/* 3) boot: construction cost, base (eager) vs lazy */
const boot0 = time(() => baseGas(10)), boot1 = time(() => createGas(10, { warm: false }));
/* 4) the idle warm, driven by a fake requestIdleCallback with a 5 ms budget: slices, and the result equals the base */
const slices = []; let pendingIdle = null;
globalThis.requestIdleCallback = (fn) => { pendingIdle = fn; return 1; };
const G2 = createGas(10, { warmDelay: 0 });
await new Promise((r) => setTimeout(r, 5));
let guard = 0;
while (pendingIdle && guard++ < 1000) { const fn = pendingIdle; pendingIdle = null; const t0 = performance.now(); fn({ timeRemaining: () => Math.max(0, 5 - (performance.now() - t0)), didTimeout: false }); slices.push(performance.now() - t0); }
delete globalThis.requestIdleCallback;
const G3 = baseGas(10);
chk(G2.modes.length, G3.modes.length); for (let m = 0; m < 256; m += 17) { chk(G2.modes[m].k, G3.modes[m].k); chk(G2.overlap(m, m), G3.overlap(m, m)); }
const L2 = G2.launch(-3, 0.4, 1.8, 0), L3 = G3.launch(-3, 0.4, 1.8, 0); chk(L2.captured, L3.captured);
const s2 = G2.stats(4), s3 = G3.stats(4); chk(s2.z, s3.z); chk(s2.sz, s3.sz);
const med = (x) => x[x.length >> 1];
const out = { compared, differ,
  setRadiusMs: { base: { median: +med(d0).toFixed(3), max: +d0[d0.length - 1].toFixed(3) }, lazy: { median: +med(d1).toFixed(4), max: +d1[d1.length - 1].toFixed(4) } },
  firstLaunchAfterDragMs: { base: +l0.toFixed(2), lazy: +l1.toFixed(2) },
  constructMs: { base: +boot0.toFixed(2), lazy: +boot1.toFixed(3) },
  idleWarm: { slices: slices.length, maxSliceMs: +Math.max(...slices).toFixed(2), totalMs: +slices.reduce((x, y) => x + y, 0).toFixed(2) } };
console.log(JSON.stringify(out));
fs.writeFileSync(new URL('./k4-lazy.out.json', import.meta.url), JSON.stringify(out, null, 1));
process.exit(differ ? 1 : 0);
