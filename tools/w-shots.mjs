/* w-shots.mjs — iteration 036 chain W's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9699 GD_PORT=5699 node tools/w-shots.mjs [out-dir]
 * W1 THE FLOATING FAVOURITES: four favourites (EXPOSURE, RATE, SCALE, INVERT); a real hover on the collapsed CSB lifts them (glyphs, the bar's box
 * unchanged), dark and light; a MACRO grip's real drag over the bar onto the floating EXPOSURE lands a route (the ring on the rack's knob); EXPAND
 * and Escape put the strip home.  W2: the TIMELINE's TIME reader, hovered, opens the hint box with t and the lap.  JPEGs into <out-dir>. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const DIR = process.argv[2] || '.tmp/W-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950, URL0 = `https://127.0.0.1:${process.env.LW_PORT || 9699}/lab/?starter=home`;
const g = await open(URL0, { width: W, height: H, prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });   // headless Firefox reports no fine pointer (032's road): the layer's media query is the app's gate
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pid = 0;
/** one real mouse: steps of [x, y] or { pause } — `down` presses at the first point and lifts at the last */
const path = (pts, down = false, step = 80) => drv.actions(g.s, [{ type: 'pointer', id: 'w' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, ...(down ? [{ type: 'pointerDown', button: 0 }, { type: 'pause', duration: 30 }] : []),
  ...pts.slice(1).map((p) => (p.pause ? { type: 'pause', duration: p.pause } : { type: 'pointerMove', duration: step, origin: 'viewport', x: Math.round(p[0]), y: Math.round(p[1]) })),
  ...(down ? [{ type: 'pointerUp', button: 0 }] : [])] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
const mid = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
async function shot(name, box, pad = 8) {
  const png = `.tmp/w-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=80)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.round(Math.max(0, Math.min(i % 2 ? H : W, v + (i < 2 ? -pad : pad))))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const layer = () => g.ev(`const L = document.querySelector('.csb-float'); if (!L) return null; const r = L.getBoundingClientRect(), T = document.getElementById('transport').getBoundingClientRect();
  return { shown: !L.hidden, below: L.classList.contains('below'), rect: [r.left, r.top, r.right, r.bottom].map(Math.round), bar: [T.left, T.top, T.right, T.bottom].map(Math.round),
    faces: [...L.querySelectorAll('.mir-bank-slot.filled')].map((s) => { const gl = s.querySelector('.csb-fav-gly'), lb = s.querySelector('.k-lbl'); return { id: (s.querySelector('[data-param]') || {}).dataset?.param || (s.querySelector('[data-fav]') || {}).dataset?.fav, glyph: gl && getComputedStyle(gl).display !== 'none' && gl.getBoundingClientRect().width, glyphLeftOfLabel: !!(gl && lb && gl.getBoundingClientRect().right <= lb.getBoundingClientRect().left + 1), label: lb && lb.textContent }; }),
    inPanel: !!document.querySelector('#transport .csb-favs') };`);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await g.ev(`localStorage.setItem('lambdawaves.q0.csb', JSON.stringify({ v: 1, items: ['material.exposure', 'transport.rate', 'spectrum.scale', 'palette.invert'], page: 0 })); setTimeout(() => location.reload(), 50); return 1;`).catch(() => 0);
  await wait(2500);
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came back');
  await g.ev(`__LW.loadPreset('2p'); __LW.pause(); __LW.look.set({ theme: 'dark' }); await new Promise((r) => setTimeout(r, 600)); return 1;`);   // the starter opens light: dark first
  /* W1 · the hover */
  const bar0 = await rectOf('#transport');
  await path([[W / 2, 300], [mid(bar0)[0] + 120, mid(bar0)[1]], { pause: 120 }]); out.at120 = (await layer()).shown;
  await wait(400); const L1 = await layer(); out.hover = L1; out.barUnmoved = JSON.stringify(L1.bar) === JSON.stringify(bar0);
  out.shotDark = await shot('036-W1-float-dark', [L1.rect[0] - 160, L1.rect[1] - 120, L1.rect[2] + 160, bar0[3] + 10]);
  await g.ev(`__LW.look.set({ theme: 'light' }); await new Promise((r) => setTimeout(r, 400)); return 1;`);
  out.shotLight = await shot('036-W1-float-light', [L1.rect[0] - 160, L1.rect[1] - 120, L1.rect[2] + 160, bar0[3] + 10]);
  await g.ev(`__LW.look.set({ theme: 'dark' }); await new Promise((r) => setTimeout(r, 300)); return 1;`);
  await path([[mid(bar0)[0] + 120, mid(bar0)[1]], [W / 2, 250], { pause: 600 }]); out.leftHidden = !(await layer()).shown && (await layer()).inPanel;
  /* W1 · the route: MACRO 1's grip dragged over the bar (held there, the pointer captured), then onto the floating EXPOSURE */
  await g.ev(`__LW.layout.modulation.expand(); await new Promise((r) => setTimeout(r, 900)); return 1;`);
  const bar1 = await rectOf('#transport');
  await path([[W / 2, 250], mid(bar1), { pause: 450 }]); const L2 = await layer(); out.withMod = { shown: L2.shown, below: L2.below };
  const dial = await g.ev(`const k = document.querySelector('.csb-float .k[data-param="material.exposure"] .k-dial'); if (!k) return null; const r = k.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
  await path([mid(bar1), [W / 2, 120], { pause: 600 }]);
  const grip = await rectOf('[data-mir-window="modulation"] .m2slot .m2grip'), before = await g.ev(`return __LW.mod.model.routeList().length;`);
  if (grip && dial) {
    await path([mid(grip), [mid(grip)[0] + 10, mid(grip)[1] - 10], mid(bar1), { pause: 450 }, mid(dial), { pause: 200 }, mid(dial)], true, 150); await wait(400);
    out.route = await g.ev(`const l = __LW.mod.model.routeList(); return { before: ${before}, after: l.length, onExposure: l.some((r) => r.targetId === 'material.exposure') };`);
    out.ring = await g.ev(`const d = document.querySelector('.dev [data-param="material.exposure"]'); return d ? { rackKnob: d.closest('.dev').dataset.id, overlays: [...d.querySelectorAll('.k-dial > *')].map((n) => n.getAttribute('class')).filter(Boolean).slice(0, 6) } : null;`);
    const fl = await layer(); out.shotRoute = await shot('036-W1-route-landing', null); out.afterDrop = { shown: fl.shown };
  } else out.route = { grip: !!grip, dial: !!dial };
  /* W1 · EXPAND and Escape put it home */
  await path([[W / 2, 120], mid(bar1), { pause: 450 }]); out.beforeExpand = (await layer()).shown;
  await g.ev(`document.querySelector('#transport .tr-expand').click(); await new Promise((r) => setTimeout(r, 300)); return 1;`); const L3 = await layer(); out.expanded = { shown: L3.shown, inPanel: L3.inPanel };
  await g.ev(`document.querySelector('#transport .tr-expand').click(); await new Promise((r) => setTimeout(r, 300)); return 1;`);
  await path([[W / 2, 120], mid(bar1), { pause: 450 }]); out.reshown = (await layer()).shown;
  await drv.actions(g.s, [{ type: 'key', id: 'wk' + (++pid), actions: [{ type: 'keyDown', value: '' }, { type: 'keyUp', value: '' }] }]); await wait(150); out.escaped = !(await layer()).shown;
  await g.ev(`__LW.layout.modulation.collapse(); for (const r of __LW.mod.model.routeList()) __LW.mod.model.removeRoute(r.id); return 1;`).catch(() => 0);
  /* W2 · the TIME reader's hint */
  await g.ev(`__LW.scrub(3.25); return 1;`);
  await path([mid(await rectOf('#transport .tr-open'))], true); await wait(900);   // a real press on TIMELINE (a press closes any hint left open; a synthetic click would not)
  const tm = await rectOf('.mir-timeline .tl-transport .ro.time.tl-clock');
  out.tReadout = await g.ev(`return document.querySelectorAll('.mir-timeline .tl-transport .ro.time').length;`);
  if (tm) {
    await path([[W / 2, 300], mid(tm), { pause: 1100 }]);
    out.hint = await g.ev(`const h = document.getElementById('controlHelp'), c = document.querySelector('.tl-clock'), at = document.elementFromPoint(${mid(tm).join(',')});
      return { help: c.dataset.help, tTitle: c.dataset.tTitle, under: at && (at.closest('.tl-clock') ? 'TIME' : at.className || at.tagName), box: h && !h.hidden ? h.textContent.trim().slice(0, 80) : null };`);
    out.shotHint = await shot('036-W2-time-hint', [tm[0] - 260, tm[1] - 90, tm[2] + 260, tm[3] + 60]);
  }
  out.errors = (await g.errors()).errs;
} finally { console.log(JSON.stringify(out, null, 1)); await g.close(); }
