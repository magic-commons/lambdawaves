/* h037-shots.mjs — iteration 037 chain H's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9699 GD_PORT=5699 node tools/h037-shots.mjs <scene> [out-dir]
 * Scenes: h2 (CAMERA extended at FOV 5° and 90°, ZOOM at both ends; the ZOOM dial's arrow-up comes near) · h3 (a fresh profile's LOCK and
 * AUTO-ROTATE) · h4 (CLIP in both frames: the plane rides with the eye under CAMERA, stays with the object under OBJECT) · h6 (PAINT/ADD's
 * two faces) · h7 (the law line resting and revealed).  JPEGs into <out-dir> (default .tmp/H-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'h2', DIR = process.argv[3] || '.tmp/H-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9699}/lab/?starter=home`, { width: W, height: H,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
let pid = 0;
const hover = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'h' + (++pid), parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
async function shot(name, box, pad = 8) {
  const png = `.tmp/h-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=80)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.round(Math.max(0, v + (i < 2 ? -pad : pad)))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const float = (id, x, y, w) => g.ev(`__LW.layout.reopen(${JSON.stringify(id)}); __LW.layout.raise(${JSON.stringify(id)}); __LW.layout.popOut(${JSON.stringify(id)}, { x: ${x}, y: ${y}, w: ${w} });
  const d = document.querySelector('.dev[data-id="${id}"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`__LW.loadPreset('2p'); __LW.pause(); await __LW.settle(); return 1;`);
  if (scene === 'h2') {
    await float('camera', 1100, 70, 300);
    await g.ev(`const f = document.querySelector('.dev[data-id="camera"] .cam-mode .lw-fold'); if (f && f.getAttribute('aria-expanded') !== 'true') f.click(); await new Promise((r) => setTimeout(r, 400)); return 1;`);
    const cam = await rectOf('.dev[data-id="camera"]');
    const read = (id) => g.ev(`const k = document.querySelector('[data-param="${id}"]'); return { val: k.querySelector('.k-val').textContent, turn: getComputedStyle(k.querySelector('.k-needle')).getPropertyValue('--turn').trim() };`);
    for (const [deg, tag] of [[5, 'fov5'], [90, 'fov90']]) {
      await g.ev(`__LW.camera.setFov(${deg} * Math.PI / 180); await __LW.settle(); await new Promise((r) => setTimeout(r, 300)); return 1;`);
      out[tag] = await read('observer.fov'); out['shot ' + tag] = await shot(`037-H2-camera-${tag}`, [380, 40, W - 20, Math.min(H - 20, cam[3])]);
    }
    await g.ev(`__LW.camera.setFov(0.6); return 1;`);
    for (const [d, tag] of [[1, 'zoom-near'], [12, 'zoom-far']]) {
      await g.ev(`__LW.camera.setDist(${d}); await __LW.settle(); await new Promise((r) => setTimeout(r, 300)); return 1;`);
      out[tag] = await read('observer.dist'); out['shot ' + tag] = await shot(`037-H2-camera-${tag}`, [380, 40, W - 20, Math.min(H - 20, cam[3])]);
    }
    /* the check: on the reversed dial an arrow up (a clockwise turn) comes NEAR — obs.dist falls */
    out.arrowUp = await g.ev(`__LW.camera.setDist(3.3); await new Promise((r) => setTimeout(r, 100)); const k = document.querySelector('[data-param="observer.dist"]'), d0 = __LW.obs.dist;
      k.focus(); k.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp', bubbles: true, cancelable: true })); await new Promise((r) => setTimeout(r, 100));
      return { d0, d1: __LW.obs.dist, nearer: __LW.obs.dist < d0, range: [__LW.mod.registry.describe().find((x) => x.id === 'observer.dist')].map((x) => [x.min, x.max, x.map])[0] };`);
  }
  if (scene === 'h3') {
    out.fresh = await g.ev(`const pad = document.querySelector('.dev[data-id="camera"] .mir-camera .mir-xy');
      return { lock: __LW.camera.lock, autoRotate: __LW.camera.autoRotate, padOff: !!pad && pad.classList.contains('disabled'), mu: __LW.camera.mu };`);
  }
  const errs = await g.errors(); out.errs = errs.errs;
} finally { await g.close(); }
console.log(JSON.stringify(out, null, 1));
