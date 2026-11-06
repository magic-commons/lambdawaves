/* k038-shots.mjs — iteration 038 chain K's one check per row and its pictures (a diagnostic, not a gate).
 *   LW_PORT=9703 GD_PORT=5703 node tools/k038-shots.mjs <scene> [out-dir]
 * Scenes: k1 (A STYLE REMEMBERS ITS KNOBS: real presses on STYLE and real drags on the knobs; a routed and a clipped knob stay; one undo row a switch) ·
 * k2 (LIGHTING's one row and the two reload glyphs: the verbs row at 262 and 300 px, both themes) · k3 (THE PAD WRAPS: a drag past the sun pad's top edge,
 * the light going round; the PAN pad past its right edge; the arrows) · k4 (AUTO-ROTATE in the stage's menu) · k5 (THE FINISH's pictures).
 * JPEGs into <out-dir> (default .tmp/K-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'k1', DIR = process.argv[3] || '.tmp/K-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9703}/lab/?starter=home&warn=0&sw=0`, { width: W, height: H,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
let pid = 0;
const drag = (pts, ms = 40) => drv.actions(g.s, [{ type: 'pointer', id: 'd' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, { type: 'pointerDown', button: 0 },
  ...pts.slice(1).map(([x, y]) => ({ type: 'pointerMove', duration: ms, origin: 'viewport', x: Math.round(x), y: Math.round(y) })), { type: 'pointerUp', button: 0 }] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
const mid = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
const nap = (ms) => g.ev(`await new Promise((r) => setTimeout(r, ${ms})); return 1;`);
async function shot(name, box, pad = 8) {
  const png = `.tmp/k-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': x0, y0, x1, y1 = (int(v) for v in b.split(',')); im = im.crop((x0, y0, min(x1, im.width), min(y1, im.height)))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=84)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.round(Math.max(0, v + (i < 2 ? -pad : pad)))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const float = (id, x, y, w) => g.ev(`__LW.layout.reopen(${JSON.stringify(id)}); __LW.layout.raise(${JSON.stringify(id)}); __LW.layout.popOut(${JSON.stringify(id)}, { x: ${x}, y: ${y}, w: ${w} });
  const d = document.querySelector('.dev[data-id="${id}"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
const theme = (t) => g.ev(`__LW.look.set({ theme: ${JSON.stringify(t)} }); await new Promise((r) => setTimeout(r, 400)); return 1;`);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`__LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle(); return 1;`);
  if (scene === 'k1') {
    /* the check: a real press on SHELL ±, two real drags (EXPOSURE down, KNEE up), SIGNED (no memory: the knobs stay), EXPOSURE up there, then back:
       SHELL ± wears its own numbers again and SIGNED its own; a macro on EXPOSURE and a timeline clip on KNEE stand still through a switch while ISO is
       recalled; each switch is one undo row and the undo brings the style and its knobs back together */
    await float('observer', 560, 40, 420);
    const S = (v) => `[data-event="material.style"] .seg-b[data-v="${v}"]`, K = (id) => `.dev[data-id="observer"] .k[data-param="${id}"]`;
    const read = () => g.ev(`const m = __LW.mat; return { style: m.style, exposure: +m.exposure.toFixed(4), knee: +m.knee.toFixed(4), iso: +m.iso.toFixed(4), mem: m.styleMem ? JSON.parse(JSON.stringify(m.styleMem)) : null, rows: __LW.history.entries().length };`);
    const turn = async (id, dy) => { const c = mid(await rectOf(K(id))); await drag([c, [c[0], c[1] - dy / 2], [c[0], c[1] - dy]]); await nap(500); };
    const press = async (v) => { await g.tap(S(v)); await nap(700); };
    out.home = await read();
    await press(8); out.shellPM0 = await read();
    await turn('material.exposure', -50); await turn('material.knee', 50); await turn('material.iso', 30); out.shellPM = await read();
    await press(3); out.signed0 = await read();
    await turn('material.exposure', 70); await turn('material.iso', -40); await turn('material.knee', -40); out.signed = await read();
    await press(8); out.shellPM1 = await read();
    await press(3); out.signed1 = await read();
    out.undo = await g.ev(`const before = __LW.mat.style; __LW.history.undo(); await new Promise((r) => setTimeout(r, 300)); const m = __LW.mat; return { before, style: m.style, exposure: +m.exposure.toFixed(4), knee: +m.knee.toFixed(4) };`);
    out.redo = await g.ev(`__LW.history.redo(); await new Promise((r) => setTimeout(r, 300)); const m = __LW.mat; return { style: m.style, exposure: +m.exposure.toFixed(4) };`);
    /* the tethers: a macro route on EXPOSURE (its base the hand's), a timeline clip on KNEE; then C's road (the action) to SHELL ± */
    out.tether = await g.ev(`const L = __LW, mc = L.mod.addMacro(), rid = L.mod.route(mc, 'material.exposure', 0, 0.3); const clip = L.timeline.editor.createClip('material.knee');
      await new Promise((r) => setTimeout(r, 400)); return { rid, clip: !!clip };`);
    const pre = await read();
    await g.ev(`__LW.run('style', { id: 'glassSigned' }); await new Promise((r) => setTimeout(r, 400)); return 1;`); out.tethered = { pre, post: await read() };
    out.ok = out.shellPM0.exposure === out.home.exposure && out.signed0.exposure === out.shellPM.exposure && out.signed0.knee === out.shellPM.knee
      && out.shellPM1.exposure === out.shellPM.exposure && out.shellPM1.knee === out.shellPM.knee && out.shellPM1.iso === out.shellPM.iso
      && out.signed1.exposure === out.signed.exposure && out.signed1.iso === out.signed.iso && out.signed1.rows === out.shellPM1.rows + 1
      && out.undo.style === 8 && out.undo.exposure === out.shellPM.exposure && out.redo.style === 3 && out.redo.exposure === out.signed.exposure
      && out.tethered.post.style === 8 && out.tethered.post.knee === out.tethered.pre.knee && out.tethered.post.iso === out.shellPM.iso
      && out.tethered.post.exposure === out.tethered.pre.exposure && +out.tethered.post.mem.signed.exposure.toFixed(4) === out.signed.exposure && out.signed.knee !== out.shellPM.knee;
    await shot('038-K1-wave-styles', await rectOf('.dev[data-id="observer"]'));
  }
} catch (e) { out.error = String(e && e.stack || e); }
finally { out.errors = (await g.errors()).errs; await g.close(); }
console.log(JSON.stringify(out, null, 1));
