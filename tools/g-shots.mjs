/* g-shots.mjs — iteration 036 chain G's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9707 GD_PORT=5707 node tools/g-shots.mjs <scene> [out-dir]
 * Scenes: face (the doors' art, both themes) · decks (the edges' fade and blur) · ways (the big arrow, Escape steps back) · about (the logos
 * open ABOUT over the menu) · sheet (the focus blur, the rows) · strip (the real marks, open) · loader (?loader=1&sw=1 at ~40 % and 100 %).
 * JPEGs into <out-dir> (default .tmp/G-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'face', DIR = process.argv[3] || '.tmp/G-shots', PORT = process.env.LW_PORT || 9707;
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = +(process.env.G_W || 1600), H = +(process.env.G_H || 1000);
const query = scene === 'loader' ? '?loader=1&sw=1&menu=1' : '?menu=1';
const g = await open(`https://127.0.0.1:${PORT}/lab/${query}`, { width: W, height: H, prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (k) => drv.actions(g.s, [{ type: 'key', id: 'k', actions: [{ type: 'keyDown', value: k }, { type: 'keyUp', value: k }] }]);
const move = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'p', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
const click = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'p', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
const mid = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
const theme = async (t) => { await g.ev(`__LW.setTheme(${JSON.stringify(t)}); return 1;`); await wait(900); };
async function shot(name, box, pad = 8, width = 1000) {
  const png = `.tmp/g-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]; w = int(sys.argv[4])
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > w: im = im.resize((w, round(im.height * w / im.width)))
im.save(sys.argv[2], quality=80)`, png, `${DIR}/036-${name}.jpg`, box ? box.map((v, i) => Math.max(0, v + (i < 2 ? -pad : pad))).join(',') : '-', String(width)]);
  return `${DIR}/036-${name}.jpg`;
}
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  if (scene !== 'loader') await g.waitFor(`!!document.querySelector('#lwMenu .mm-face:not([hidden])')`, 100, 100);
  if (scene === 'face') {
    for (const t of ['dark', 'light']) {
      await theme(t); await wait(1500);
      out[t] = await g.ev(`return [...document.querySelectorAll('.mm-door')].map((d) => ({ door: d.dataset.door, icon: !!d.querySelector('.mm-ico'), art: [...d.querySelectorAll('.mm-door-art')].filter((i) => i.getClientRects().length).map((i) => ({ src: i.getAttribute('src'), on: i.classList.contains('on'), w: i.naturalWidth })) }));`);
      const a = await rectOf('.mm-doors'); out[t + 'Shot'] = await shot(`G1-doors-${t}`, a, 24);
      out[t + 'Face'] = await shot(`G1-face-${t}`, null, 0, 1000);
    }
  }
  console.log(JSON.stringify(out, null, 1));
  const errs = await g.errors(); if (errs.errs && errs.errs.length) console.log('page errors', JSON.stringify(errs.errs));
} finally { await g.close(); }
