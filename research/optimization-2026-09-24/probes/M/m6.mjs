/* m6.mjs — lane M · M6(b,c) gate: BASE (lab-base-pre) vs built (lab-pre) — the slow-read-logging copies of mk-pre.py —
 * fresh headless Firefox each, twice for the base (the second base run is the noise floor for the canvas digests).
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/m6.mjs
 * Reads: (1) LW.bootOrder / bootClosed / the rack's card order; (2) every forced layout read > 1 ms before ready + 1 s,
 * with its stack; (3) a hash of every 2D canvas (by card id + index) after boot, and again after the SLICE card is
 * opened (the closed SLICE's plane model is not painted until it is laid out — compare it OPEN); (4) the legacy H₂⁺
 * reveal road (molecular-names' block): after restore() reveals the hidden card, is its plot painted, and is it the
 * same picture as base. */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const M = 'research/optimization-2026-09-24/probes/M/';
const out = {};
for (const [tag, p] of [['base', M + 'lab-base-pre/'], ['base2', M + 'lab-base-pre/'], ['built', M + 'lab-pre/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false, 'privacy.fingerprintingProtection': false, 'privacy.fingerprintingProtection.pbmode': false, 'privacy.resistFingerprinting': false, 'privacy.baselineFingerprintingProtection': false } });
  try {
    const readyAt = await g.ev(`for (let k = 0; k < 4000; k++) { if (window.__LW && __LW.ready) return +performance.now().toFixed(1); await new Promise(r => setTimeout(r, 5)); } return -1;`);
    out[tag] = await g.ev(`
      const H = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h; };
      const frames = (n) => new Promise((r) => { const f = () => (--n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
      await new Promise((r) => setTimeout(r, 1000));
      const slow = (window.__P && __P.slow || []).filter((s) => s[1] < ${readyAt} + 1000).map((s) => s.slice(1).join(' | '));
      const canv = () => { const o = {}; for (const c of document.querySelectorAll('canvas')) { if (c.id === 'field') continue; const dev = c.closest('.dev'); const k = (dev ? dev.dataset.id : c.id || c.className) + '#' + [...(dev || document).querySelectorAll('canvas')].indexOf(c) + ':' + c.className;
          let d = ''; try { d = c.width && c.height ? c.toDataURL() : 'empty'; } catch (e) { d = 'ERR'; } o[k] = c.width + 'x' + c.height + ':' + H(d); } return o; };
      __LW.schedule(4); await __LW.settle();
      const boot = canv();
      const order = { bootOrder: JSON.stringify(__LW.bootOrder), bootClosed: JSON.stringify(__LW.bootClosed), rackR: [...document.querySelectorAll('#rack > .dev')].map((d) => d.dataset.id).join(','), rackL: [...document.querySelectorAll('#rackL > .dev')].map((d) => d.dataset.id).join(',') };
      __LW.layout.reopen('slice', 'R'); await frames(3); await new Promise((r) => setTimeout(r, 300)); __LW.schedule(4); await __LW.settle();
      const sliceOpen = canv();
      /* the legacy H₂⁺ reveal road */
      __LW.molecule.setOn(true); const saved = __LW.serialize(); saved.presentation.layout.cards.find((c) => c.id === 'molecule').closed = true; __LW.molecule.setOn(false);
      const ok = __LW.restore(saved); await frames(3); await new Promise((r) => setTimeout(r, 300));
      const mc = document.querySelector('.dev[data-id="molecule"] canvas.mol-c');
      const legacy = { ok, on: __LW.molecule.on, visible: !mc.closest('.dev').hidden, size: mc.width + 'x' + mc.height, painted: (() => { const d = mc.getContext('2d').getImageData(0, 0, mc.width, mc.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; })(), hash: H(mc.toDataURL()) };
      return { slow, order, boot, sliceOpen, legacy, errs: window.__e };`);
    out[tag].readyAt = readyAt;
    console.log(tag, 'ready', readyAt, 'slow reads before ready+1s:', out[tag].slow.length);
    for (const s of out[tag].slow) console.log('   ', s.slice(0, 230));
  } finally { await g.close(); }
}
const A = out.base, N = out.base2, B = out.built;
const orderSame = JSON.stringify(A.order) === JSON.stringify(B.order);
const diffCanv = (k) => Object.keys({ ...A[k], ...B[k] }).filter((c) => A[k][c] !== B[k][c] && A[k][c] === N[k][c]);
const noisy = (k) => Object.keys(A[k]).filter((c) => A[k][c] !== N[k][c]);
const bootDiff = diffCanv('boot'), openDiff = diffCanv('sliceOpen');
console.log('order identical:', orderSame, JSON.stringify(B.order).slice(0, 200));
console.log('canvases after boot differing (beyond base-vs-base noise):', JSON.stringify(bootDiff), ' noisy:', JSON.stringify(noisy('boot')));
for (const c of bootDiff) console.log('   ', c, A.boot[c], '→', B.boot[c]);
console.log('canvases with SLICE open differing:', JSON.stringify(openDiff), ' noisy:', JSON.stringify(noisy('sliceOpen')));
console.log('legacy reveal base', JSON.stringify(A.legacy), '\n              built', JSON.stringify(B.legacy));
/* the revealed legacy plot is the SAME picture as base's — which today is a never-painted 300×150 canvas (REFUTE-F's
   pre-existing blank-after-reveal, measured here in both builds), so the gate is equality, not `painted` */
const legacyOk = B.legacy.ok && B.legacy.visible && B.legacy.hash === A.legacy.hash && B.legacy.size === A.legacy.size;
const pass = orderSame && openDiff.length === 0 && legacyOk && B.errs.length === 0;
console.log((pass ? 'GREEN' : 'RED') + ' M6(b,c): order, every 2D canvas with SLICE open, the legacy reveal plot; boot-closed SLICE canvas may differ (documented)');
process.exit(pass ? 0 : 1);
