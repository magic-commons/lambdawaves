/* w125-serialize.mjs — probes/LA/serialize-bytes.mjs (the saved-bytes neutrality read), plus the RAW bytes (autoScale not
 * masked) and projectSnapshot's own bytes through the save road's `serialize` + autoScale = 1 rule, for W125.
 *   LW_PORT=8729 GD_PORT=5247 node research/optimization-2026-09-24/probes/W125/w125-serialize.mjs <tag> */
import { page, save, FNV } from '../LA/lib.mjs';
const g = await page();
const R = {};
try {
  R.states = await g.ev(`${FNV}
    const out = {}; const snap = (k) => { const o = __LW.serialize(); if (o.presentation && o.presentation.layout) o.presentation.layout.at = 0; if (o.presentation && o.presentation.quality) o.presentation.quality.autoScale = 1; /* the wall stamp and AUTO SCALE's timing-driven notch are the only fields two identical sessions disagree on (serialize-diff.mjs) */ const s = JSON.stringify(o), raw = JSON.stringify(__LW.serialize()); out[k] = { bytes: s.length, fnv: fnv(s), rawAutoScale: __LW.quality.autoScale }; };
    __LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle(); snap('default');
    /* UI hidden and shown again (toggleUI round trip), a play/pause edge, a camera orbit */
    const H = () => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', key: 'h', bubbles: true }));
    __LW.play(); await new Promise((r) => setTimeout(r, 600)); __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('afterPlay');
    H(); await __LW.settle(); const hid = __LW.uiHidden; __LW.play(); await new Promise((r) => setTimeout(r, 700)); __LW.pause(); H(); __LW.scrub(0); await __LW.settle(); out.hideWorked = hid && !__LW.uiHidden; snap('afterHide');
    __LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.launchPacket([-3.3, 0.7, 0.2], [1.1, 0.1, 0], 1.3); __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('box');
    __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('back');
    return out;`);
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
