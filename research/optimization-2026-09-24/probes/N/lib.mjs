/* lib.mjs — lane N's copy of lane LA's probe harness: one page on the N gate server (8726), µs timers, the warning dismissed.
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/<probe>.mjs
 * Every probe writes <probe>.<tag>.json beside itself (tag = argv[2], default 'run'), so a before/after pair is two
 * runs of the same file on two trees. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import path from 'node:path';
export const PORT = process.env.LW_PORT || '8726';
export async function page(q = 'preset=1s%2B2pz&sw=0', opts = {}) {
  const g = await open(`https://127.0.0.1:${PORT}/lab/?${q}`, Object.assign({ width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } }, opts));
  const w = await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  if (!w || !w.ok) throw new Error('lab never became ready');
  await g.ev('try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {} return 1;');
  return g;
}
export function save(url, obj) {
  const me = path.basename(new URL(url).pathname, '.mjs'), tag = process.argv[2] || 'run';
  const f = path.join(path.dirname(new URL(url).pathname), `${me}.${tag}.json`);
  fs.writeFileSync(f, JSON.stringify(obj, null, 1));
  return f;
}
/** FNV-1a over a string, as hex — the serialize-bytes fingerprint */
export const FNV = `const fnv=(s)=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h=(h^s.charCodeAt(i))>>>0;h=Math.imul(h,16777619)>>>0;}return h.toString(16);};`;
