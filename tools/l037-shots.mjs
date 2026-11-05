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
  if (scene === 'l2') {
    /* the check: with no record, an empty one, or one at every home the gate is shut and the picture is the old one to the byte; one value a hair off
       its home opens the rig, which draws within a few levels of it (the rig's arithmetic at the homes is the old light's); a real light moves it */
    const LIGHTS = { none: null, empty: {}, atHome: { key: 1, ambient: 0.32, frame: 'camera' }, hair: { ambient: 0.321 }, lowLeft: { az: 180, el: 10 },
      rim: { rim: 0.8, hue: 0.55, tint: 0.8, key: 0.5 }, spot: { cone: 40 }, world: { frame: 'world' } };
    const run = (style) => g.ev(`const L = __LW, F = L.field; if (!F.ok) return { skip: F.error || 'no WebGPU' };
      const px = async (light) => { const m = { ...L.mat, style: ${style}, frame: false, axis: false, dither: 0 }; if (light) m.light = light; else delete m.light; F.stats.presents = 13; return (await F.readPixels(L.obs, m, 320, 240, true)).px; };
      const diff = (a, b) => { let d = 0, n = 0; for (let i = 0; i < a.length; i++) { const x = Math.abs(a[i] - b[i]); if (x > d) d = x; if (x > 2) n++; } return [d, n]; };
      const A = await px(null), o = {}; for (const [k, v] of Object.entries(${JSON.stringify(LIGHTS)})) o[k] = diff(A, await px(v)); return o;`);
    out.solid = await run(1); out.signed = await run(3); out.shell = await run(6);
    await g.ev(`__LW.verbs.run([{ verb: 'molecule', args: { id: 'H2O' } }], { who: 'SHOTS' }); return 1;`);
    await g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 600, 200);
    await g.ev(`const b = document.querySelector('.dev[data-id="observer"] [data-key-action="style"] .seg-b:last-child'); b.click(); await new Promise((r) => setTimeout(r, 2500)); await __LW.settle(); return 1;`);
    out.esp = await run(11);
    const gate = (o) => o.empty[0] === 0 && o.atHome[0] === 0 && o.hair[0] <= 6 && o.lowLeft[0] > 40 && o.rim[0] > 40;
    out.ok = [out.solid, out.signed, out.shell, out.esp].every((o) => o.skip || gate(o));
  }
  if (scene === 'l3') {
    /* the check: the twelve light.* targets are registered with their dials' ranges; an LFO on a macro routed to light.rim moves the record and the RIM
       dial's shown value, the hand's base stays home; a project round trip keeps a hand's light and NEW (an empty file) puts the old light back */
    out.targets = await g.ev(`return __LW.mod.targets().filter((t) => t.id.startsWith('light.')).map((t) => [t.id, t.min, t.max, t.map].join(' '));`);
    await float('light', 600, 60, 300);
    out.route = await g.ev(`const M = __LW.mod, s = M.addSource('lfo'), m = M.addMacro(); M.bind(m, s); M.route(m, 'light.rim', 0, 1); M.arm(true); M.play();
      const seen = []; for (let i = 0; i < 6; i++) { M.step(0.13); await new Promise((r) => setTimeout(r, 30)); seen.push(+((__LW.mat.light && __LW.mat.light.rim) || 0).toFixed(3)); }
      const k = document.querySelector('.dev[data-id="light"] .k[data-param="light.rim"]'); M.stop();
      return { seen, base: M.registry.baseOf('light.rim'), stamped: !!k, dial: k && k.querySelector('.k-val').textContent };`);
    out.trip = await g.ev(`const L = __LW; L.mod.model.clear ? 0 : 0; for (const r of [...L.mod.model.routes()]) L.mod.model.removeRoute(r.id);
      L.mod.registry.restoreAll(); L.mat.light = { az: -90, el: 20, key: 1.6, rim: 0.4 }; const S = L.serialize(); delete L.mat.light; L.restore(S, { project: true }); await L.settle();
      const back = { ...L.mat.light }, dial = document.querySelector('.dev[data-id="light"] .k[data-param="light.key"] .k-val').textContent;
      L.restore({ experiment: S.experiment, presentation: { ...S.presentation, mat: { ...S.presentation.mat, light: undefined } } }, { project: true }); await L.settle();
      return { back, dial, afterEmpty: L.mat.light || null };`);
    out.ok = out.targets.length === 12 && out.route.seen.some((v) => v > 0.05) && out.route.base === 0 && out.route.stamped && out.trip.back.key === 1.6 && !out.trip.afterEmpty;
  }
  console.log(JSON.stringify(out, null, 1));
  const e = (await g.errors()).errs || []; if (e.length) console.log('page errors:', JSON.stringify(e).slice(0, 800));
} finally { await g.close(); }
