/* ff-dom.mjs — Lane C: the DOM/style side in headless Firefox (no backdrop-filter rendering here; computed styles and
 * mutations are engine-independent enough to count).  For each body state: the backdrop-filter inventory (layers,
 * on-screen and rack-visible area), running animations, and the per-frame DOM mutations while the transport plays.
 *   LW_PORT=8721 GD_PORT=5233 node research/optimization-2026-09-24/probes/C/ff-dom.mjs [out.json] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import { INVENTORY, MUTATIONS } from './inv.mjs';
const PORT = process.env.LW_PORT || '8721';
const OUT = process.argv[2] || 'research/optimization-2026-09-24/probes/C/ff-dom.json';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0`, { width: W, height: H, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = { at: new Date().toISOString(), viewport: [W, H], scenes: [] };
const ev = (s) => g.ev(s);
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await ev(`__LW.governor.on=false; __LW.quality.auto=false; __LW.loadPreset('sim-ladder'); __LW.pause(); __LW.quality.res=96; __LW.quality.steps=160; __LW.schedule(4); await __LW.settle(); return 1;`);
  const scene = async (label, setup, { mut = true } = {}) => {
    await ev(`${setup || ''}; await __LW.settle(); await new Promise(r=>setTimeout(r,500)); return 1;`);
    const idle = await ev(INVENTORY);
    /* the playing inventory: the frost-hold / tablet-motion classes only exist while the transport runs */
    const playing = await ev(`__LW.play(); await new Promise(r=>setTimeout(r,400)); const r = (async()=>{ ${INVENTORY} })(); const out = await r; __LW.pause(); await new Promise(r=>setTimeout(r,200)); return out;`);
    const m = mut ? await ev(MUTATIONS(3000)) : null;
    const r = { label, idle: { state: idle.state, backdrop: { layers: idle.backdrop.layers, onScreenPx: idle.backdrop.onScreenPx, visiblePx: idle.backdrop.visiblePx, screens: idle.backdrop.screens, visibleScreens: idle.backdrop.visibleScreens }, counts: idle.counts, anims: idle.anims },
      playing: { state: playing.state, backdrop: { layers: playing.backdrop.layers, onScreenPx: playing.backdrop.onScreenPx, visiblePx: playing.backdrop.visiblePx, screens: playing.backdrop.screens, visibleScreens: playing.backdrop.visibleScreens }, anims: playing.anims },
      list: idle.backdrop.list, mutations: m };
    R.scenes.push(r);
    console.log('scene', label, JSON.stringify({ idle: r.idle.backdrop, playing: r.playing.backdrop, counts: r.idle.counts, anims: r.idle.anims, playingAnims: r.playing.anims, mutPerFrame: m && m.perFrame, frames: m && m.frames }));
    if (m) console.log('   top mutations/frame', JSON.stringify(m.top.slice(0, 25)));
    return r;
  };
  await scene('default (disconnected · refractive · frost ALWAYS · light · 8 windows)', '');
  await scene('connected', `__LW.setDisconnected(false)`, { mut: false });
  await scene('connected · frost OFF', `__LW.setFrost('off')`, { mut: false });
  await scene('disconnected · frost OFF', `__LW.setDisconnected(true)`, { mut: false });
  await scene('disconnected · frost STILL', `__LW.setFrost('still')`, { mut: false });
  await scene('disconnected · tinted · frost ALWAYS', `__LW.setFrost('always'); __LW.setCardStyle('tinted')`, { mut: false });
  await scene('modulation window open (refractive · frost · disc)', `__LW.setCardStyle('refractive'); __LW.mod.expand()`);
  await scene('notebook open', `__LW.mod.collapse(); __LW.notebook.open('notes')`, { mut: false });
  await scene('every rack window open', `__LW.notebook.close(); for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.windowActivity.presentOffscreen(true)`);
  await scene('every window open · UI hidden', `if(!__LW.uiHidden) __LW.keys.toggleUI()`);
  await scene('default windows · UI hidden', `__LW.windowActivity.presentOffscreen(false); for(const d of document.querySelectorAll('.dev')) if(!['spectrum','shadow','settings','state','palette','observer','camera','clip'].includes(d.dataset.id)) d.classList.add('closed')`);
  R.errs = await ev('return window.__e');
} catch (e) { console.error('PROBE ERROR', e); R.error = String(e && e.stack || e); }
finally { await g.close(); }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT);
