/* serbytes.mjs — lane M neutrality read: `__LW.serialize()` bytes on fixed projects, BASE (probes/M/lab-base = 91c90bc)
 * vs the built lab/, each in a fresh headless Firefox.  `presentation.layout.at` is a Date.now() stamp (rack.js
 * captureLayout) that differs between any two sessions, so it is zeroed before hashing; nothing else is touched.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/serbytes.mjs
 * Projects: (1) the shipped boot, (2) the bundled WAVE DANCER demo, imported and opened, (3) a current-format project
 * saved in the session with LADDER nbar 42 and a palette/accent change, then re-opened (the restore road with
 * `instruments`), (4) the same after a quick SAVE + quick LOAD.  Also reads fieldDigest() after each. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8723';
const A = process.argv[2] || 'research/optimization-2026-09-24/probes/M/lab-base/';
const B = process.argv[3] || 'lab/';
const res = {};
for (const [tag, p] of [['base', A], ['built', B]]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900 });
  try {
    await g.ev(`for (let i = 0; i < 400; i++) { if (window.__LW && __LW.ready) break; await new Promise(r => setTimeout(r, 50)); } return 1;`);
    res[tag] = await g.ev(`
      const H = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h; };
      const ser = () => { const o = __LW.serialize(); if (o.presentation && o.presentation.layout) o.presentation.layout.at = 0; const s = JSON.stringify(o); return { len: s.length, hash: H(s) }; };
      const dig = async () => { await __LW.settle(); await __LW.settle(); const d = await __LW.fieldDigest(); return d && d.hash; };
      const P = __LW.layout.projects, out = {};
      out.boot = { ...ser(), digest: await dig() };
      const r = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' });
      const path = P.importText(await r.text()); out.demoOpen = P.open(path);
      out.demo = { ...ser(), digest: await dig() };
      __LW.ladder.set({ nbar: 42, sigma: 3, d: 4, teeth: 6 });
      if (__LW.setStage) __LW.setStage(0.3);
      out.saveOk = P.save('lanem/fixed');
      out.freshOk = P.fresh();
      out.reopenOk = P.open('lanem/fixed');
      out.reopen = { ...ser(), digest: await dig(), ladder: JSON.stringify(__LW.ladder.params), lastHash: H(JSON.stringify(__LW.ladder.last)) };
      out.errs = (window.__e || []).slice(0, 5);
      return out;`);
    console.log(tag, JSON.stringify(res[tag]));
  } finally { await g.close(); }
}
const keys = ['boot', 'demo', 'reopen'];
let same = true;
for (const k of keys) { const a = res.base[k], b = res.built[k]; const eq = a.len === b.len && a.hash === b.hash && a.digest === b.digest && (k !== 'reopen' || (a.ladder === b.ladder && a.lastHash === b.lastHash)); same = same && eq; console.log((eq ? 'SAME ' : 'DIFF ') + k, JSON.stringify(a), JSON.stringify(b)); }
fs.writeFileSync('/tmp/lwM-serbytes.json', JSON.stringify(res, null, 1));
console.log((same ? 'GREEN' : 'RED') + ' serialize bytes + digest base vs built');
process.exit(same ? 0 : 1);
