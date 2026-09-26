/* serialize-bytes.mjs — wave 130's copy of lane LA's `__LW.serialize()` bytes read, extended with the project roads the
 * wave-130 seams move (the notebook + projects, the persistence): the bundled demo opened through PROJECTS, a save and a
 * re-open, a restore(serialize()) round trip, a link mint + open, and a fresh project.
 *   LW_PORT=8746 GD_PORT=5256 node research/optimization-2026-09-24/probes/W130/serialize-bytes.mjs <tag> */
import { page, save, FNV } from './lib.mjs';
const g = await page();
const R = {};
try {
  R.states = await g.ev(`${FNV}
    const out = {}; const snap = (k) => { const o = __LW.serialize(); if (o.presentation && o.presentation.layout) o.presentation.layout.at = 0; if (o.presentation && o.presentation.quality) o.presentation.quality.autoScale = 1; /* the wall stamp and AUTO SCALE's timing-driven notch are the only fields two identical sessions disagree on (serialize-diff.mjs) */ const s = JSON.stringify(o); out[k] = { bytes: s.length, fnv: fnv(s) }; };
    __LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle(); snap('default');
    /* UI hidden and shown again (toggleUI round trip), a play/pause edge, a camera orbit */
    const H = () => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', key: 'h', bubbles: true }));
    __LW.play(); await new Promise((r) => setTimeout(r, 600)); __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('afterPlay');
    H(); await __LW.settle(); const hid = __LW.uiHidden; __LW.play(); await new Promise((r) => setTimeout(r, 700)); __LW.pause(); H(); __LW.scrub(0); await __LW.settle(); out.hideWorked = hid && !__LW.uiHidden; snap('afterHide');
    __LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.launchPacket([-3.3, 0.7, 0.2], [1.1, 0.1, 0], 1.3); __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('box');
    __LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('back');
    const rt = JSON.parse(JSON.stringify(__LW.serialize())); out.rtOk = __LW.restore(rt); __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('roundTrip');
    const enc = __LW.link.mint(); out.linkChars = enc.chars; out.linkOk = __LW.link.open(enc.href).ok; __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('link');
    const txt = await (await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' })).text(); const pth = __LW.projects.importText(txt);
    out.demoOpen = __LW.projects.open(pth); out.demoCurrent = __LW.projects.current; out.demoDirty = __LW.projects.dirty; out.nbTitle = __LW.notebook.title; out.nbFace = __LW.notebook.face; __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('demo');
    out.saved = __LW.projects.save('w130/probe'); out.reopen = __LW.projects.open('w130/probe'); out.reDirty = __LW.projects.dirty; __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('reopened');
    out.fresh = __LW.projects.fresh(); __LW.pause(); __LW.scrub(0); await __LW.settle(); snap('fresh'); out.freshTitle = __LW.notebook.title;
    return out;`);
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
