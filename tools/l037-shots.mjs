/* l037-shots.mjs — iteration 037 chain L's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9699 GD_PORT=5699 node tools/l037-shots.mjs <scene> [out-dir]
 * Scenes: l1 (LIGHTING: a real drag on the SUN pad writes mat.light's az/el, a dial its key, RESET empties the record) · l2 (the rig: SOLID and ESP
 * at home = the old picture, each light changes it) · l3 (the light.* targets: a route moves the record and the dial) · l4 (CAMERA's LIGHTING
 * opens the card directly below CAMERA) · l5 (the pictures: SOLID and ESP under four lights, the pad mid-drag, the window folded and open in
 * both themes).  JPEGs into <out-dir> (default .tmp/L-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'l1', DIR = process.argv[3] || '.tmp/L-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9699}/lab/?starter=home`, { width: W, height: H,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
let pid = 0;
const drag = (pts) => drv.actions(g.s, [{ type: 'pointer', id: 'd' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, { type: 'pointerDown', button: 0 },
  ...pts.slice(1).map(([x, y]) => ({ type: 'pointerMove', duration: 60, origin: 'viewport', x: Math.round(x), y: Math.round(y) })), { type: 'pointerUp', button: 0 }] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
async function shot(name, box, pad = 8) {
  const png = `.tmp/l-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=82)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.round(Math.max(0, v + (i < 2 ? -pad : pad)))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const float = (id, x, y, w) => g.ev(`__LW.layout.reopen(${JSON.stringify(id)}); __LW.layout.raise(${JSON.stringify(id)}); __LW.layout.popOut(${JSON.stringify(id)}, { x: ${x}, y: ${y}, w: ${w} });
  const d = document.querySelector('.dev[data-id="${id}"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`__LW.loadPreset('2p'); __LW.pause(); await __LW.settle(); return 1;`);
  if (scene === 'l1') {
    await float('light', 600, 60, 300);
    const pad = await rectOf('.dev[data-id="light"] .lw-sun .xy-pad'), cx = (pad[0] + pad[2]) / 2, cy = (pad[1] + pad[3]) / 2, R = (pad[2] - pad[0]) / 2;
    out.home = await g.ev(`return { light: __LW.mat.light || null };`);
    /* a real drag: from the sun to the pad's left edge at the horizon (half the radius left of centre) — a low sun from the left: az 180, el 0 */
    const sun = await rectOf('.dev[data-id="light"] .lw-sun .xy-dot');
    await drag([[(sun[0] + sun[2]) / 2, (sun[1] + sun[3]) / 2], [cx - R * 0.25, cy - 10], [cx - R * 0.5, cy]]);
    out.dragged = await g.ev(`return { light: { ...__LW.mat.light } };`);
    out.key = await g.ev(`const k = document.querySelector('.dev[data-id="light"] .lw-light-side .k'); k.focus(); for (let i = 0; i < 5; i++) k.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp', bubbles: true, cancelable: true }));
      await new Promise((r) => setTimeout(r, 100)); return { key: __LW.mat.light && __LW.mat.light.key };`);
    out.reset = await g.ev(`[...document.querySelectorAll('.dev[data-id="light"] .lw-light-reset')][0].click(); await new Promise((r) => setTimeout(r, 100));
      const s = document.querySelector('.dev[data-id="light"] .lw-sun .xy-dot').style; return { light: __LW.mat.light || null, sunAt: [s.getPropertyValue('--x'), s.getPropertyValue('--y')] };`);
    out.ok = !out.home.light && Math.abs(out.dragged.light.az - 180) < 6 && Math.abs(out.dragged.light.el) < 6 && out.key.key > 1 && !out.reset.light;
  }
  console.log(JSON.stringify(out, null, 1));
  const e = (await g.errors()).errs || []; if (e.length) console.log('page errors:', JSON.stringify(e).slice(0, 800));
} finally { await g.close(); }
