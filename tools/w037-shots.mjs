/* w037-shots.mjs — iteration 037 chain W's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9697 GD_PORT=5697 node tools/w037-shots.mjs <scene> [out-dir]
 * Scenes: w1 (the record rides a reload and a project; NEW empties it) · w2 (EDIT: a real drag snaps to the stage's centre line, the guide shows,
 * one named history row) · w3 (the manager) · w7 (four widgets over SOLID, dark and light).  JPEGs into <out-dir> (default .tmp/W-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'w1', DIR = process.argv[3] || '.tmp/W-shots', URL0 = `https://127.0.0.1:${process.env.LW_PORT || 9697}/lab/?starter=home&menu=0`;
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const g = await open(URL0, { width: 1500, height: 950, prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pid = 0;
const stroke = (pts) => drv.actions(g.s, [{ type: 'pointer', id: 'p' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, { type: 'pointerDown', button: 0 },
  ...pts.slice(1).map(([x, y]) => ({ type: 'pointerMove', duration: 80, origin: 'viewport', x: Math.round(x), y: Math.round(y) })), { type: 'pointerUp', button: 0 }] }]);
async function shot(name, box) {
  const png = `.tmp/w-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=80)`, png, `${DIR}/${name}.jpg`, box ? box.map(Math.round).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const boot = async () => { if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`__LW.pause(); return 1;`); };
const out = {};
try {
  await boot();
  if (scene === 'w1') {   /* the record road alone (no kind is needed: an item of a kind not registered is kept, not drawn) */
    out.put = await g.ev(`const L = __LW.widgets; L.restore({ items: [{ id: 'w1', kind: 'probe', x: 0.1, y: 0.1, w: 0.2, h: 0.1, opts: { a: 1 } }, { id: 'w2', kind: 'probe', x: 2, y: -1, w: 0.01, h: 9 }] });
      return { list: L.list().map((q) => [q.id, q.x, q.y, q.w, q.h].join(' ')), rec: JSON.parse(localStorage.getItem('lambdawaves.q0.widgets')).items.length,
        proj: (__LW.serialize().presentation.widgets || { items: [] }).items.length, edit: (__LW.serialize({ scope: 'edit' }).presentation.widgets || { items: [] }).items.length,
        z: getComputedStyle(L.root).zIndex, pe: getComputedStyle(L.root).pointerEvents, parent: L.root.parentElement.id };`);
    await g.nav(URL0); await boot();
    out.reload = await g.ev(`return __LW.widgets.list().map((q) => q.id + ':' + q.kind);`);
    out.fresh = await g.ev(`const c0 = window.confirm; window.confirm = () => true; await __LW.layout.projects.requestFresh(); window.confirm = c0; await __LW.settle(); await new Promise((r) => setTimeout(r, 300));
      return { n: __LW.widgets.list().length, rec: JSON.parse(localStorage.getItem('lambdawaves.q0.widgets') || '{"items":[]}').items.length, proj: !!__LW.serialize().presentation.widgets };`);
    out.ok = out.put.rec === 2 && out.put.proj === 2 && out.put.edit === 2 && out.reload.length === 2 && out.fresh.n === 0 && out.fresh.rec === 0 && !out.fresh.proj;
  }
  if (scene === 'w2') {   /* a real drag in EDIT: the moving widget's centre lands 4 px off the stage's centre line, snaps onto it, the guide shows, one WIDGET MOVE row */
    await g.ev(`const s = document.createElement('script'); s.type = 'module'; s.src = '/tools/w037-probe-kind.js'; document.head.append(s); return 1;`);   // a probe kind, in the page's own module map
    if (!(await g.waitFor('window.__probeKind', 100, 100)).ok) throw new Error('the probe kind did not load');
    const A = await g.ev(`const L = __LW.widgets; L.restore({ items: [{ id: 'w1', kind: 'probe', x: 0.15, y: 0.3, w: 0.1, h: 0.1 }, { id: 'w2', kind: 'probe', x: 0.62, y: 0.55, w: 0.1, h: 0.1 }] }); L.edit(true);
      await new Promise((r) => setTimeout(r, 200)); const b = document.querySelector('#widgets .lw-widget[data-id="w2"]').getBoundingClientRect(), S = L.root.getBoundingClientRect();
      return { b: [b.left, b.top, b.width, b.height], S: [S.left, S.top, S.width, S.height], rows: __LW.history.entries().length };`);
    const [bx, by, bw, bh] = A.b, [sx, , sw] = A.S, from = [bx + bw / 2, by + bh / 2], dx = (sx + sw / 2 + 4) - from[0];
    await drv.actions(g.s, [{ type: 'pointer', id: 'p' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
      { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(from[0]), y: Math.round(from[1]) }, { type: 'pointerDown', button: 0 },
      { type: 'pointerMove', duration: 150, origin: 'viewport', x: Math.round(from[0] + dx / 2), y: Math.round(from[1] - 20) },
      { type: 'pointerMove', duration: 150, origin: 'viewport', x: Math.round(from[0] + dx), y: Math.round(from[1] - 40) }] }]);
    out.mid = await g.ev(`const gx = document.querySelector('#widgets .lw-guide:not(.lw-guide-y)'); return { guide: !gx.hidden, at: gx.style.left };`);
    await shot('037-W2-edit-snap-guide');
    await drv.actions(g.s, [{ type: 'pointer', id: 'p' + (++pid), parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerUp', button: 0 }] }]); await drv.relActions(g.s);
    out.after = await g.ev(`await new Promise((r) => setTimeout(r, 700)); const q = __LW.widgets.list().find((i) => i.id === 'w2');
      return { centre: +(q.x + q.w / 2).toFixed(4), y: q.y, guideGone: document.querySelector('#widgets .lw-guide').hidden, rows: __LW.history.entries().length, last: __LW.history.entries().slice(-1)[0].label };`);
    await g.press('');   // ArrowLeft on the focused widget: a 1 % nudge
    out.nudge = await g.ev(`await new Promise((r) => setTimeout(r, 600)); const q = __LW.widgets.list().find((i) => i.id === 'w2'); return { centre: +(q.x + q.w / 2).toFixed(4), focus: document.activeElement.dataset.id };`);
    await g.press('');   // Escape
    out.esc = await g.ev(`return { edit: __LW.widgets.edit(), pe: getComputedStyle(document.querySelector('#widgets .lw-widget')).pointerEvents };`);
    out.ok = out.mid.guide && out.mid.at === '50%' && out.after.centre === 0.5 && out.after.guideGone && out.after.last === 'WIDGET MOVE' && out.after.rows > A.rows && out.nudge.centre === 0.49 && !out.esc.edit && out.esc.pe === 'none';
  }
  if (scene === 'w3') {   /* the manager: opened by its act, a gallery tile pressed for real adds one at the centre and lists it, EDIT's switch drives the layer, × removes */
    await g.ev(`const s = document.createElement('script'); s.type = 'module'; s.src = '/tools/w037-probe-kind.js'; document.head.append(s); return 1;`);
    await g.waitFor('window.__probeKind', 100, 100);
    out.open = await g.ev(`__LW.widgets.restore(null); const A = __LW.actions; const ids = A.list().map((r) => r.id).filter((i) => i.startsWith('window.widgets.'));
      A.run('window.widgets.open'); await new Promise((r) => setTimeout(r, 600)); const d = document.querySelector('.dev[data-id="widgets"]');
      return { acts: ids.length, open: !d.classList.contains('closed'), kind: d.dataset.kind, tiles: [...d.querySelectorAll('.wg-kind .trig-l')].map((t) => t.textContent) };`);
    out.add = await g.tap('.dev[data-id="widgets"] .wg-kind');
    out.added = await g.ev(`await new Promise((r) => setTimeout(r, 400)); const L = __LW.widgets.list(), d = document.querySelector('.dev[data-id="widgets"]');
      return { n: L.length, centre: L[0] && [+(L[0].x + L[0].w / 2).toFixed(3), +(L[0].y + L[0].h / 2).toFixed(3)], rows: d.querySelectorAll('.wg-row').length, last: __LW.history.entries().slice(-1)[0].label };`);
    await g.tap('.dev[data-id="widgets"] .wg-acts .sw');
    out.edit = await g.ev(`return __LW.widgets.edit();`);
    await shot('037-W3-manager', await g.ev(`const r = document.querySelector('.dev[data-id="widgets"]').getBoundingClientRect(); return [r.left - 8, r.top - 8, r.right + 8, r.bottom + 8];`));
    await g.tap('.dev[data-id="widgets"] .wg-x');
    out.removed = await g.ev(`await new Promise((r) => setTimeout(r, 400)); return { n: __LW.widgets.list().length, rows: document.querySelectorAll('.dev[data-id="widgets"] .wg-row').length, h: Math.round(document.querySelector('.dev[data-id="widgets"]').getBoundingClientRect().height) };`);
    out.ok = out.open.acts >= 3 && out.open.open && out.open.tiles.includes('PROBE') && out.added.n === 1 && out.added.centre[0] === 0.5 && out.added.rows === 1 && out.edit === true && out.removed.n === 0;
  }
  if (scene === 'w4') {   /* the mini-viewer: benzene drawn, a camera turn repaints it, a real press on the EDIT seg changes the style (one WIDGET STYLE row), all four styles side by side */
    const sig = `const sig = (id) => { const c = document.querySelector('#widgets .lw-widget[data-id="' + id + '"] canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, h = 2166136261;
      for (let i = 3; i < d.length; i += 4) if (d[i]) { n++; h = Math.imul(h ^ (d[i - 3] + 7 * d[i - 2] + 13 * d[i - 1] + i), 16777619) >>> 0; } return { n, h }; };`;
    out.one = await g.ev(`${sig} await __LW.chem.solve('C6H6'); __LW.chem.setOn(true); await __LW.settle(); __LW.widgets.restore(null); const id = __LW.widgets.add('mol');
      await new Promise((r) => setTimeout(r, 500)); const a = sig(id); __LW.orbitBy(0.6, 0.25); await new Promise((r) => setTimeout(r, 600)); const b = sig(id); return { id, a, b };`);
    out.style = await g.ev(`__LW.widgets.edit(true); await new Promise((r) => setTimeout(r, 200)); return [...document.querySelectorAll('#widgets .lw-widget-bar .seg-b')].map((b) => b.textContent);`);
    await g.tap('#widgets .lw-widget-bar .seg-b:first-child');
    out.balls = await g.ev(`await new Promise((r) => setTimeout(r, 600)); return { opts: __LW.widgets.list()[0].opts, last: __LW.history.entries().slice(-1)[0].label };`);
    await g.ev(`__LW.widgets.edit(false); __LW.widgets.restore({ items: ['balls', 'ballstick', 'sticks', 'diagram'].map((s, i) => ({ id: 'w' + (i + 1), kind: 'mol', x: 0.2 + i * 0.15, y: 0.3, w: 0.14, h: 0.22, opts: { style: s } })) });
      await new Promise((r) => setTimeout(r, 900)); return 1;`);
    await g.ev(`__LW.look.set({ theme: 'dark' }); await new Promise((r) => setTimeout(r, 900)); return 1;`);
    await shot('037-W4-mol-styles-dark', [270, 260, 1230, 500]);
    await g.ev(`__LW.look.set({ theme: 'light' }); await new Promise((r) => setTimeout(r, 900)); return 1;`);
    await shot('037-W4-mol-styles-light', [270, 260, 1230, 500]);
    out.diagram = await g.ev(`const p = document.querySelector('#widgets .lw-widget[data-id="w4"] img'); return { shown: !p.hidden, cls: p.className, src: p.getAttribute('src') };`);
    out.ok = out.one.a.n > 500 && out.one.a.h !== out.one.b.h && out.style.length === 4 && out.balls.opts.style === 'balls' && out.balls.last === 'WIDGET STYLE' && out.diagram.shown && /pic-ink/.test(out.diagram.cls);
  }
  if (scene === 'w5') {   /* CLOCK and PLAYHEAD: two seconds of play move both, the clock's value is written at most ~5 times a second */
    out.run = await g.ev(`__LW.widgets.restore(null); const a = __LW.widgets.add('clock'), b = __LW.widgets.add('playhead'); await new Promise((r) => setTimeout(r, 400));
      const v = (id) => document.querySelector('#widgets .lw-widget[data-id="' + id + '"] .ro-val').textContent, before = [v(a), v(b)];
      let writes = 0; const mo = new MutationObserver((m) => { writes += m.length; }); mo.observe(document.querySelector('#widgets .lw-widget[data-id="' + a + '"] .ro-val'), { childList: true, characterData: true, subtree: true });
      __LW.play(); await new Promise((r) => setTimeout(r, 2000)); __LW.pause(); await new Promise((r) => setTimeout(r, 300)); mo.disconnect();
      return { before, after: [v(a), v(b)], writes };`);
    await g.ev(`__LW.widgets.restore({ items: [{ id: 'w1', kind: 'clock', x: 0.3, y: 0.25, w: 0.24, h: 0.08 }, { id: 'w2', kind: 'playhead', x: 0.58, y: 0.25, w: 0.12, h: 0.08 }] }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
    await shot('037-W5-clock-playhead', [400, 180, 1100, 330]);
    out.ok = out.run.after[0] !== out.run.before[0] && /^t = .* a\.u\. · lap \d+$/.test(out.run.after[0]) && /^\d+:\d\d\.\d$/.test(out.run.after[1]) && out.run.writes > 0 && out.run.writes <= 14;
  }
  out.errs = (await g.errors()).errs;
} finally { console.log(JSON.stringify(out, null, 1)); await g.close(); }
