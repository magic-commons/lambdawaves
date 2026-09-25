/* ladderfix.mjs — F-D2's proof: open() of a project saved by this build, shipped (lab-i) vs ladder-fixed (lab-l).
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/ladderfix.mjs
 * Same script in both copies: non-default LADDER params are saved, the params are then changed, the project is
 * opened, and we read (1) the open() wall time, (2) serialize() with the two wall-clock fields zeroed, (3) the field
 * digest, (4) ladder.params, and (5) ladder.last (an explicit demand, which computes if dirty) hashed. */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8721';
const H = `const h = (s) => { let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { x = (x ^ s.charCodeAt(i)) >>> 0; x = Math.imul(x, 16777619) >>> 0; } return x; };`;
const out = {};
for (const [tag, p] of [['shipped', 'research/optimization-2026-09-24/probes/D/lab-i/'], ['fixed', 'research/optimization-2026-09-24/probes/D/lab-l/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    out[tag] = await g.ev(`${H}
      await __LW.settle(); __LW.ladder.set({ nbar: 42, sigma: 3.5, d: 4, teeth: 6 }); await __LW.settle();
      __LW.layout.projects.save('bench/ladder'); __LW.ladder.set({ nbar: 20, sigma: 1, d: 0, teeth: 8 }); await __LW.settle();
      const walls = [];
      for (let i = 0; i < 3; i++) { const a = performance.now(); __LW.layout.projects.open('bench/ladder'); walls.push(+(performance.now() - a).toFixed(1)); await __LW.settle(); await __LW.settle(); }
      const s = __LW.serialize(); s.experiment.t = 0; const ser = JSON.stringify(s);
      const computedBefore = __LW.ladder.computed;
      const last = __LW.ladder.last; const lastHash = h(JSON.stringify(last, (k, v) => (v instanceof Float64Array || v instanceof Float32Array) ? Array.from(v) : v));
      return { ser, walls, serHash: h(ser), serLen: ser.length, digest: await __LW.fieldDigest(), params: { ...__LW.ladder.params }, computedBefore, lastHash, errs: window.__e };`);
    console.log(tag, JSON.stringify({ ...out[tag], ser: undefined }));
  } finally { await g.close(); }
}
const a = out.shipped, b = out.fixed;
/* where the two serialize() objects differ, leaf by leaf */
const flat = (o, p = '', acc = {}) => { if (o && typeof o === 'object') { for (const k of Object.keys(o)) flat(o[k], p ? p + '.' + k : k, acc); } else acc[p] = o; return acc; };
const fa = flat(JSON.parse(a.ser)), fb = flat(JSON.parse(b.ser));
console.log('serialize leaf diffs:', JSON.stringify([...new Set([...Object.keys(fa), ...Object.keys(fb)])].filter((k) => fa[k] !== fb[k]).map((k) => [k, fa[k], fb[k]])));
console.log('NEUTRAL serialize:', a.serHash === b.serHash, ' digest:', JSON.stringify(a.digest) === JSON.stringify(b.digest), ' params:', JSON.stringify(a.params) === JSON.stringify(b.params), ' ladder.last:', a.lastHash === b.lastHash);
