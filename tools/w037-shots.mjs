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
  out.errs = (await g.errors()).errs;
} finally { console.log(JSON.stringify(out, null, 1)); await g.close(); }
