/* open-bytes.mjs — wave 127: what a project open leaves behind, as bytes, so a base and a candidate tree can be compared.
 * Fixed projects, opened through the project road (importText → open) in a fresh headless Firefox:
 *   1 · WAVE DANCER from the booted state (modulation window opens, the look flips, notebook sized)
 *   2 · a COMPOSED project (a state the page builds and saves: register, palette edited, a route, the modulation window
 *       open with a device folded, a card closed and one floated, the notebook resized, A/B stored + running) opened
 *       over a scrambled instrument
 *   3 · WAVE DANCER opened over the composed project (an open over an open)
 *   4 · the composed project with its modulation window CLOSED in the file
 * After each: fnv + length of __LW.serialize() (layout.at and AUTO SCALE's notch normalised, as serialize-bytes.mjs does),
 * of the settings key, of the modulation window's DOM (outerHTML of #m2 root) and of the rack's order/class list.
 *   LW_PORT=8740 GD_PORT=5253 node research/optimization-2026-09-24/probes/P127/open-bytes.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8740', TAG = process.argv[2] || 'run';
const FNV = `const fnv=(s)=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h=(h^s.charCodeAt(i))>>>0;h=Math.imul(h,16777619)>>>0;}return h.toString(16)+':'+s.length;};`;
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 1000, script: 600000 });
let out = null;
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  out = await g.ev(`${FNV}
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), LW = __LW, P = LW.projects, M = LW.mod.model, R = LW.mod.registry;
    try { if (LW.warning && LW.warning.dismiss) LW.warning.dismiss(); } catch (_) {}
    LW.pause(); await LW.settle(); await sleep(300);
    const ser = () => { const o = LW.serialize(); if (o.presentation.layout) o.presentation.layout.at = 0; if (o.presentation.quality) o.presentation.quality.autoScale = 1; return JSON.stringify(o); };
    const modDom = () => [...document.querySelectorAll('.m2root, .crail')].map((r) => r.outerHTML).join('');
    const rackList = () => [...document.querySelectorAll('#rackL .dev, #rack .dev, #floats .dev')].map((d) => d.dataset.id + ':' + d.className + ':' + (d.parentElement && d.parentElement.id)).join('|');
    const snap = (k) => { const s = ser(); out[k] = { ser: fnv(s), settings: fnv(localStorage.getItem('lambdawaves.q0.settings') || ''), modDom: fnv(modDom()), rack: fnv(rackList()), body: document.body.className + '|' + document.body.dataset.theme + '|' + document.body.dataset.card, nbStyle: document.getElementById('notebook').getAttribute('style'), modOpen: LW.mod.expanded, transition: !!LW.reg.transition, palette: LW.paletteId }; };
    const out = {};
    const dancer = await (await fetch('demos/wave-dancer.lambdawaves.json')).text();
    /* 1 */
    const pd = P.importText(dancer); P.open(pd); await LW.settle(); await sleep(700); snap('1_dancer');
    P.remove(pd); P.markClean();
    /* compose */
    LW.loadPreset('1s'); LW.ab.storeA(); LW.loadPreset('2p+'); LW.ab.storeB(); LW.loadPreset('rydberg'); LW.pause(); LW.scrub(0);
    const pal = LW.paletteGroups.flatMap((q) => q.items).find((id) => id !== LW.paletteId); LW.setPalette(pal); LW.palette.load([{ at: .08, rgb: [.1, .2, .3] }, { at: .47, rgb: [.7, .4, .2] }, { at: .82, rgb: [.2, .8, .5] }], 1); LW.palette.setOn(true);
    const macro = M.macroList()[0]; M.setMacro(macro.id, { value: .7, masterDepth: .6 }); M.addRoute(macro.id, 'material.exposure', .12, .42); LW.mod.clock.applyAll(true);
    LW.layout.modulation.expand(); LW.mod.addSource('lfo'); await sleep(250);
    LW.layout.notebookResize(540, 420); LW.setTheme('light'); LW.setCardStyle('tinted');
    const cards = [...document.querySelectorAll('#rack .dev')]; if (cards[2]) cards[2].classList.add('closed');
    LW.ab.set(true); LW.pause(); LW.scrub(0); await LW.settle(); await sleep(300);
    P.save('p127/composed'); const composed = JSON.parse(localStorage.getItem('lambdawaves.q0.projects')).items['p127/composed'];
    const closedFile = JSON.parse(JSON.stringify(composed)); closedFile.path = 'p127/composed-closed'; closedFile.data.presentation.modwin.open = false;
    /* scramble */
    LW.ab.set(false); LW.loadPreset('1s+2s'); LW.setTheme('dark'); LW.setCardStyle('refractive'); LW.layout.modulation.collapse(); LW.setPalette(LW.paletteGroups[0].items[0]); LW.layout.notebookResize(400, 300); await LW.settle();
    /* 2 */
    P.open('p127/composed'); await LW.settle(); await sleep(700); snap('2_composed');
    /* 3 */
    const pd3 = P.importText(dancer); P.open(pd3); await LW.settle(); await sleep(700); snap('3_dancerOverComposed');
    /* 4 */
    const pc = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, ...closedFile })); P.open(pc); await LW.settle(); await sleep(700); snap('4_composedClosed');
    out.errs = (window.__e || []).map(String).slice(0, 10);
    return out;`);
} catch (e) { out = { error: String(e && e.stack || e) }; }
finally { await g.close(); }
fs.writeFileSync(new URL(`./open-bytes.${TAG}.json`, import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
