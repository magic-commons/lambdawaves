/* ladderfix.mjs — lane M · M2 gate (after probes/D/ladderfix.mjs + linkopen.mjs): the BASE copy (lab-base, 91c90bc) vs
 * the built lab/, same script, each in a fresh headless Firefox.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/ladderfix.mjs
 * Reads: ladder.computed at boot; open() wall time ×3 of a project saved with LADDER n̄ 42 (card CLOSED); serialize()
 * (layout.at zeroed) + fieldDigest + ladder.params + ladder.last hash (an explicit demand) after the opens; the quick
 * SAVE → LOAD wall time ×2; then with the LADDER card OPEN: open() the project, wait for the worker, ladder.computed and
 * the ladder.last hash again. */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const H = `const h = (s) => { let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { x = (x ^ s.charCodeAt(i)) >>> 0; x = Math.imul(x, 16777619) >>> 0; } return x; };
  const lh = () => h(JSON.stringify(__LW.ladder.last, (k, v) => (v instanceof Float64Array || v instanceof Float32Array) ? Array.from(v) : v));`;
const out = {};
for (const [tag, p] of [['base', 'research/optimization-2026-09-24/probes/M/lab-base/'], ['built', 'lab/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    out[tag] = await g.ev(`${H}
      const w = (n) => new Promise((r) => setTimeout(r, n));
      const bootComputed = __LW.ladder.computed;
      __LW.schedule(4); await __LW.settle(); __LW.ladder.set({ nbar: 42, sigma: 3.5, d: 4, teeth: 6 }); await __LW.settle();
      __LW.layout.projects.save('bench/ladder'); __LW.ladder.set({ nbar: 20, sigma: 1, d: 0, teeth: 8 }); await __LW.settle();
      const walls = [];
      for (let i = 0; i < 3; i++) { const a = performance.now(); __LW.layout.projects.open('bench/ladder'); walls.push(+(performance.now() - a).toFixed(1)); await __LW.settle(); await __LW.settle(); }
      const s = __LW.serialize(); s.experiment.t = 0; if (s.presentation.layout) s.presentation.layout.at = 0; const ser = JSON.stringify(s);
      const computedAfterOpen = __LW.ladder.computed;
      const lastHash = lh();
      const trig = (label) => [...document.querySelectorAll('.trig')].find((t) => t.textContent.trim() === label);
      trig('SAVE').click(); __LW.ladder.set({ nbar: 20, sigma: 1, d: 0, teeth: 8 }); await __LW.settle();
      const quick = []; for (let i = 0; i < 2; i++) { const a = performance.now(); trig('LOAD').click(); quick.push(+(performance.now() - a).toFixed(1)); await __LW.settle(); }
      const quickParams = { ...__LW.ladder.params };
      /* the card OPEN: re-solve on the worker after the open */
      __LW.layout.reopen('ladder', 'R'); await w(50); await __LW.ladder.prepare(); __LW.ladder.set({ nbar: 20, sigma: 1, d: 0, teeth: 8 }); await __LW.settle();
      const a2 = performance.now(); __LW.layout.projects.open('bench/ladder'); const openWallOpenCard = +(performance.now() - a2).toFixed(1);
      let k = 0; for (; k < 100 && !__LW.ladder.computed; k++) await w(50);
      const openCard = { wall: openWallOpenCard, computedAfterWait: __LW.ladder.computed, waitedMs: k * 50, lastHash: lh(), params: { ...__LW.ladder.params } };
      return { bootComputed, walls, serHash: h(ser), serLen: ser.length, digest: (await __LW.fieldDigest()).hash, params: { ...__LW.ladder.params }, computedAfterOpen, lastHash, quick, quickParams, openCard, errs: window.__e };`);
    console.log(tag, JSON.stringify(out[tag]));
  } finally { await g.close(); }
}
const a = out.base, b = out.built;
const neutral = a.serHash === b.serHash && a.digest === b.digest && JSON.stringify(a.params) === JSON.stringify(b.params) && a.lastHash === b.lastHash
  && JSON.stringify(a.quickParams) === JSON.stringify(b.quickParams) && a.openCard.lastHash === b.openCard.lastHash && b.openCard.computedAfterWait === true && b.bootComputed === false && (b.errs || []).length === 0;
console.log('open() ms base', a.walls, '→ built', b.walls, '· quick LOAD ms base', a.quick, '→ built', b.quick, '· open with the card open base', a.openCard.wall, '→ built', b.openCard.wall);
console.log((neutral ? 'GREEN' : 'RED') + ' M2 neutral: serialize, digest, params, ladder.last (closed and open card), quick-LOAD params; built boot computed=false, 0 errors');
process.exit(neutral ? 0 : 1);
