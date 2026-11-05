/* k-shots.mjs — iteration 036 chain K's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9697 GD_PORT=5697 node tools/k-shots.mjs <scene> [out-dir]
 * Scenes: k1 (STROKE 0 and 1 over MIR OPTIONS, INFORMATIONAL, the FINDER and the CSB, dark · light · FROST) · k2 (UI SCALE 75 % and
 * 150 %: a knob's travel, a window's move and clamp, the menubar's list, a hint, the CSB, the tempo editor, the stage's backing store,
 * a route drag) · k3 (the CSB's tempo editor) · k4 (FOLLOW PLAYHEAD, AUTO-COLOR) · k5 (FOLDERS' placeholders).
 * JPEGs into <out-dir> (default .tmp/K-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'k1', DIR = process.argv[3] || '.tmp/K-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9697}/lab/?starter=home`, { width: W, height: H });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pid = 0;
/** real pointer input: [x, y] stops pressed with `button` (0 left, 2 right); `hold` ms between down and the first move */
const stroke = (pts, button = 0, step = 60) => drv.actions(g.s, [{ type: 'pointer', id: 'k' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, { type: 'pointerDown', button }, { type: 'pause', duration: 30 },
  ...pts.slice(1).map(([x, y]) => ({ type: 'pointerMove', duration: step, origin: 'viewport', x: Math.round(x), y: Math.round(y) })), { type: 'pointerUp', button }] }]);
const click = (x, y, button = 0) => stroke([[x, y]], button);
const hover = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'k' + (++pid), parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
async function shot(name, box, pad = 8) {
  const png = `.tmp/k-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=80)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.max(0, v + (i < 2 ? -pad : pad))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const look = (o) => g.ev(`__LW.look.set(${JSON.stringify(o)}); await new Promise((r) => setTimeout(r, 250)); return 1;`);
const skin = (id, theme) => g.ev(`const th = __LW.look.presetList.find((p) => p.id === ${JSON.stringify(id)}); __LW.look.set({ ...th.values, ...th.tones[0].values }); __LW.look.set({ theme: ${JSON.stringify(theme)} }); await new Promise((r) => setTimeout(r, 300)); return 1;`);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`__LW.loadPreset('2p'); __LW.pause(); return 1;`);
  if (scene === 'k1') {
    /* MIR OPTIONS (knobs, segs, switches, the STROKE knob) beside INFORMATIONAL (Josh's shot 5) */
    await g.ev(`__LW.run('gui'); __LW.layout.reopen('informational'); __LW.layout.raise('informational'); __LW.layout.popOut('informational', { x: 1040, y: 60, w: 300 }); await new Promise((r) => setTimeout(r, 600)); return 1;`);
    const gui = await rectOf('.gui-options'); out.gui = gui;
    const ring = () => g.ev(`const pick = (s) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); return { b: c.borderTopColor, sh: c.boxShadow.slice(0, 90) }; };
      return { stroke: getComputedStyle(document.documentElement).getPropertyValue('--ctl-stroke').trim(), sw: pick('.dev[data-id="informational"] .sw'), seg: pick('.gui-options .seg'), on: pick('.dev[data-id="informational"] .sw.on') };`);
    for (const [sk, th] of [['lambdawaves', 'dark'], ['lambdawaves', 'light'], ['frost', 'dark'], ['frost', 'light']]) {
      await skin(sk, th);
      for (const st of [0, 1]) {
        await look({ stroke: st }); out[`${sk}-${th}-${st}`] = await ring();
        out['shot ' + sk + th + st] = await shot(`036-K1-${sk}-${th}-stroke${st}`, [Math.max(0, (gui?.[0] ?? 300) - 10), 40, W - 20, Math.min(H - 40, 760)]);
      }
    }
  }
} catch (e) { out.error = String(e && e.stack || e); }
console.log(JSON.stringify(out, null, 1));
await g.close();
