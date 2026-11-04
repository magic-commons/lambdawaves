/* p-shots.mjs — iteration 036 chain P's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9699 GD_PORT=5699 node tools/p-shots.mjs <scene> [out-dir]
 * Scenes: p1 (SPECTRUM's head BUTTONS · PAINT: real clicks toggle, a drag sweeps nothing, PAINT sweeps; a hand's preset keeps the view, rate
 * and window) · p2 (the dial labels) · p3 (NODES' bar) · p4 (ABOUT fitted on MIR, sized on λWAVES) · p5 (a demo's coloured clips) ·
 * p6 (ENV + PATTERN: the knob pulses four times a bar).  JPEGs into <out-dir> (default .tmp/P-shots). */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'p1', DIR = process.argv[3] || '.tmp/P-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9699}/lab/?starter=home`, { width: 1500, height: 950 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pid = 0;
/** real pointer input: a list of [x, y] stops pressed with `button` (0 left, 2 right) */
const stroke = (pts, button = 0) => { if (!pts.every((q) => q && q.every(Number.isFinite))) throw new Error('no point: ' + JSON.stringify(pts)); return drv.actions(g.s, [{ type: 'pointer', id: 'p' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, { type: 'pointerDown', button },
  ...pts.slice(1).map(([x, y]) => ({ type: 'pointerMove', duration: 60, origin: 'viewport', x: Math.round(x), y: Math.round(y) })), { type: 'pointerUp', button }] }]); };
const click = (x, y, button = 0) => stroke([[x, y]], button);
const float = (id, x, y, w) => g.ev(`__LW.layout.reopen(${JSON.stringify(id)}); __LW.layout.raise(${JSON.stringify(id)}); __LW.layout.popOut(${JSON.stringify(id)}, { x: ${x}, y: ${y}, w: ${w} });
  await new Promise((r) => setTimeout(r, 300)); const d = document.querySelector('.dev[data-id=${JSON.stringify(id)}]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); return 1;`);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
async function shot(name, box, pad = 8) {
  const png = `.tmp/p-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1000: im = im.resize((1000, round(im.height * 1000 / im.width)))
im.save(sys.argv[2], quality=78)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.max(0, v + (i < 2 ? -pad : pad))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`const t = document.getElementById('transport'); if (t) t.style.visibility = 'hidden'; __LW.loadPreset('1s'); __LW.pause(); return 1;`);
  if (scene === 'p1') {
    await float('spectrum', 560, 10, 340); await wait(700);
    const chip = (lbl) => g.ev(`const b = [...document.querySelectorAll('.dev[data-id="spectrum"] .pk-c')].find((x) => x.textContent === ${JSON.stringify(lbl)}); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, +b.dataset.a];`);
    const pop = () => g.ev(`return __LW.reg.populated().length;`);
    out.mode0 = await g.ev(`return document.querySelector('.dev[data-id="spectrum"] .sp-stroke .seg-b.on').getAttribute('aria-label');`);
    /* the reader's view, rate and window, then a hand's preset (the stepper's ›, a real click; the picker still closed so it is on screen) */
    await g.ev(`__LW.clock.setRate(7.5); __LW.clock.window = 33; const d = document.querySelector('.dev[data-id="spectrum"]'), p = d.querySelector('.picker'); if (!p.hidden) [...d.querySelectorAll('.sp-head .trig')].find((b) => /MODE/.test(b.textContent)).click(); return 1;`); await wait(300);
    const before = await g.ev(`return { rate: __LW.clock.rate, window: __LW.clock.window, view: __LW.mat.view };`);
    const nx = await rectOf('.dev[data-id="spectrum"] .sp-preset [aria-label="next"]'); await click((nx[0] + nx[2]) / 2, (nx[1] + nx[3]) / 2); await wait(500);
    out.preset = { at: nx, before, after: await g.ev(`return { rate: __LW.clock.rate, window: __LW.clock.window, view: __LW.mat.view, labels: __LW.reg.populated().length };`) };
    await g.ev(`__LW.loadPreset('1s'); const d = document.querySelector('.dev[data-id="spectrum"]'), p = d.querySelector('.picker'); if (p.hidden) [...d.querySelectorAll('.sp-head .trig')].find((b) => /MODE/.test(b.textContent)).click(); return 1;`); await wait(500);
    const a = await chip('2s₀'), b = await chip('3s₀'), c = await chip('4s₀');
    const p0 = await pop(); await click(a[0], a[1]); await wait(250); const p1 = await pop(); await click(a[0], a[1]); await wait(250); const p2 = await pop();
    await stroke([[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]]); await wait(250); const p3 = await pop();
    await shot('036-P1-1-head-buttons', await rectOf('.dev[data-id="spectrum"] .sp-head'), 30);
    await click(b[0], b[1], 2); await wait(300); const menu = await g.ev(`const m = document.querySelector('.mir-ctx'); return !!m && m.textContent.slice(0, 60);`);
    await click(1300, 600); await wait(300);   // a press elsewhere closes the menu
    out.buttons = { p0, tapOn: p1, tapOff: p2, dragSweeps: p3 - p2, rightMenu: menu };
    const pb = await g.ev(`const b = document.querySelector('.dev[data-id="spectrum"] .sp-stroke .seg-b[aria-label="PAINT"]'); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];`);
    await click(pb[0], pb[1]); await wait(250);
    const q0 = await pop(); await stroke([[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]]); await wait(250); const q1 = await pop();
    await stroke([[a[0], a[1]], [c[0], c[1]]], 2); await wait(250); const q2 = await pop();
    out.paint = { stored: await g.ev(`return localStorage.getItem('lambdawaves.q0.stroke');`), sweepAdds: q1 - q0, rightSweepRemoves: q1 - q2 };
    await shot('036-P1-2-head-paint', await rectOf('.dev[data-id="spectrum"] .sp-head'), 30);
    await g.ev(`localStorage.removeItem('lambdawaves.q0.stroke'); return 1;`);
  } else if (scene === 'p2') {
    /* the dials beside the chips: 2p_x (2p₋₁ + 2p₁), 3d₊₂ and 7i₋₆ (₆: the digit Roboto lacks) */
    await float('spectrum', 560, 10, 360); await wait(700);
    out.names = await g.ev(`__LW.loadPreset('2px'); const d = document.querySelector('.dev[data-id="spectrum"]');
      for (const t of ['3d₂', '7i₋₆']) { const n = d.querySelector('.pk-n[data-n="7"]'); if (t[0] === '7' && n.classList.contains('folded')) n.querySelector('.pk-nl').click(); const b = [...d.querySelectorAll('.pk-c')].find((x) => x.textContent === t); __LW.api.toggleMode(+b.dataset.a); }
      __LW.api.settle(); const h = [...d.querySelectorAll('.sp-head .trig')].find((b) => /DIALS/.test(b.textContent)); if (h.getAttribute('aria-expanded') !== 'true') h.click();
      await new Promise((r) => setTimeout(r, 900));
      return [...d.querySelectorAll('.sp-row .sp-nl')].map((n) => [n.textContent, getComputedStyle(n).fontFamily.split(',')[0], getComputedStyle(n).fontSize]);`);
    await g.ev(`document.querySelector('.dev[data-id="spectrum"] .sp-rows').scrollIntoView({ block: 'start' }); return 1;`); await wait(300);
    const r = await rectOf('.dev[data-id="spectrum"] .sp-rows'), p = await rectOf('.dev[data-id="spectrum"] .picker');
    await shot('036-P2-labels', [r[0], r[1], r[2], Math.min(p ? p[1] + 160 : r[3], 860)]);
  } else if (scene === 'read') out.r = await g.ev(readFileSync(process.argv[4], 'utf8'));   // a probe's body from a file
  out.errors = (await g.errors()).errs;
} finally { await g.close(); }
console.log(JSON.stringify(out, null, 1));
