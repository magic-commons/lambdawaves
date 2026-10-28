/* h-shots.mjs — iteration 022 chain H's picture loop (a diagnostic, not a gate): THE WORDS before and after.
 *   LW_PORT=9683 GD_PORT=5683 node tools/h-shots.mjs tips <tag>     the hint tip over five controls (a real hover) → H-shots/tips-<tag>.jpg
 *   LW_PORT=9683 GD_PORT=5683 node tools/h-shots.mjs labels <tag>   SPECTRUM, WIGNER, FIELD (folds open), MOLECULES' top and the bar's favourites → H-shots/labels-<tag>.jpg */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const [MODE = 'tips', TAG = 'shot'] = process.argv.slice(2), DIR = 'research/iteration-022/H-shots';
const TIPS = [['observer', 'KNEE'], ['informational', 'STAGE FORMULA'], ['informational', 'LIST CAP'], ['camera', 'LOCK'], ['spectrum', 'VISUALS']];
const WINS = ['spectrum', 'wigner', 'staticfield', 'chem'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(DIR, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9683}/lab/?starter=home`, { width: 1600, height: 1000 });
let n = 0;
const hover = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'h' + (++n), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x) + 3, y: Math.round(y) }, { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
const show = (id) => g.ev(`__LW.run('window.${id}.open'); __LW.run('window.${id}.reset'); __LW.run('window.${id}.solo'); return 1;`);
const crops = [];
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1500);
  if (MODE === 'tips') for (const [win, text] of TIPS) {
    await show(win); await wait(2500);
    const find = () => g.ev(`const c = document.querySelector('.dev[data-id="${win}"]');
      const t = [...c.querySelectorAll('*')].find((x) => !x.children.length && x.textContent.trim().toUpperCase() === ${JSON.stringify(text)});
      const h = t && t.closest('[data-help]'); if (!h) return null; const b = h.getBoundingClientRect(); const x = b.left + Math.min(b.width / 2, 24), y = b.top + b.height / 2, top = document.elementFromPoint(x, y);
      return [x, y, h.dataset.helpEn.slice(0, 40), top && (top.closest('[data-help]') || top).dataset.helpEn?.slice(0, 40), top && top.className];`);
    await find(); await wait(400); const at = await find();
    if (!at) { console.log('no control', win, text); continue; }
    await hover(at[0], at[1]); await wait(1400);
    const box = await g.ev(`const t = document.getElementById('controlHelp'); if (!t || t.hidden) return null; const b = t.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom, Math.round(b.width), Math.round(b.height), t.textContent.slice(0, 30)];`);
    const p = `.tmp/h-${TAG}-${crops.length}.png`; writeFileSync(p, Buffer.from(await g.snap(), 'base64'));
    const [x, y] = at, c = box ? [Math.min(x - 150, box[0]) - 12, Math.min(y - 30, box[1]) - 12, Math.max(x + 150, box[2]) + 12, Math.max(y + 30, box[3]) + 12] : [x - 160, y - 40, x + 160, y + 40];
    crops.push([p, c.map(Math.round)]); console.log(JSON.stringify({ win, text, tip: box && box.slice(4), hint: at.slice(2) }));
    await hover(800, 500); await wait(300);
  } else {
    /* the favourites are read at boot: EXPOSURE (the one 8-letter knob a modulation target) seated, then a reload */
    await g.ev(`localStorage.setItem('lambdawaves.q0.csb', JSON.stringify({ v: 1, items: ['material.exposure', 'observer.zoom', 'transport.rate'] })); location.reload(); return 1;`);
    await wait(1500); await g.waitFor('window.__LW?.ready', 400, 100); await wait(1200);
    for (const w of WINS) { await show(w); await wait(900);
      if (w === 'chem') { await g.ev(`__LW.chem.setOn(true); return 1;`); await wait(4000); }
      if (w === 'spectrum') { await g.ev(`__LW.setHamiltonian('atom'); const d = [...document.querySelectorAll('.dev[data-id="spectrum"] .sw')].find((x) => /DIALS/.test(x.textContent)); if (d && d.getAttribute('aria-pressed') !== 'true') d.click(); return 1;`); await wait(1500); }
      await g.ev(`for (const b of document.querySelectorAll('.dev[data-id="${w}"] [data-fold][aria-expanded="false"]')) b.click(); return 1;`); await wait(600);
      const b = await g.ev(`const c = document.querySelector('.dev[data-id="${w}"] .sp-ham') || document.querySelector('.dev[data-id="${w}"]'); c.scrollIntoView({ block: 'start', behavior: 'instant' }); const b = c.getBoundingClientRect(); return [b.left, b.top, b.right, Math.min(innerHeight, b.bottom, b.top + ${w === 'chem' ? 260 : 900})];`);
      const p = `.tmp/h-${TAG}-${crops.length}.png`; writeFileSync(p, Buffer.from(await g.snap(), 'base64')); crops.push([p, b.map(Math.round)]); await g.ev(`__LW.run('window.${w}.close'); return 1;`); }
    await g.ev(`__LW.run('window.transport.open'); const ex = document.querySelector('#transport .tr-expand'); if (ex && ex.getAttribute('aria-expanded') !== 'true') ex.click(); return 1;`); await wait(1000);
    const b = await g.ev(`const f = document.querySelector('#transport .csb-favs') || document.querySelector('#transport'); const b = f.getBoundingClientRect(); return [b.left - 8, b.top - 8, b.right + 8, b.bottom + 8];`);
    const p = `.tmp/h-${TAG}-${crops.length}.png`; writeFileSync(p, Buffer.from(await g.snap(), 'base64')); crops.push([p, b.map(Math.round)]);
  }
  execFileSync('python3', ['-I', '-c', `import sys, json
from PIL import Image
cs = json.loads(sys.argv[1]); ims = [Image.open(p).convert('RGB').crop(tuple(max(0, v) for v in b)) for p, b in cs]
W = sum(i.width for i in ims) + 8 * (len(ims) - 1) if sys.argv[3] == 'labels' else max(i.width for i in ims); H = max(i.height for i in ims) if sys.argv[3] == 'labels' else sum(i.height for i in ims) + 8 * (len(ims) - 1)
s = Image.new('RGB', (W, H), (128, 128, 128)); o = 0
for i in ims:
    s.paste(i, (o, 0) if sys.argv[3] == 'labels' else (0, o)); o += (i.width if sys.argv[3] == 'labels' else i.height) + 8
s.save(sys.argv[2], quality=72)`, JSON.stringify(crops), `${DIR}/${MODE}-${TAG}.jpg`, MODE]);
  console.log('errors', JSON.stringify((await g.errors()).errs).slice(0, 300));
} finally { await g.close(); }
