/* p038-shots.mjs — iteration 038 chain P's one check per row and its pictures (a diagnostic, not a gate).
 *   LW_PORT=9707 GD_PORT=5707 node tools/p038-shots.mjs <scene> [out-dir]
 * Scenes: p1 (THE ARC WEARS A GRADIENT: the kit's gradient arcs in a node card, dark and light) · p2 … p8 (each new kind's card and its picture
 * check) · p10 (THE FINISH).  JPEGs into <out-dir> (default .tmp/P-shots); the numbers on stdout as JSON. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'p1', DIR = process.argv[3] || '.tmp/P-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const URL = `https://127.0.0.1:${process.env.LW_PORT || 9707}/lab/?starter=home&warn=0&sw=0`;
const g = await open(URL, { width: +(process.env.P_W || 1500), height: +(process.env.P_H || 950), headless: process.env.P_HEADED ? false : true,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
/** the page as the driver composites it, cropped to box [x0, y0, x1, y1] (or whole), as a JPEG */
async function shot(name, box, k = 1) {
  const png = `.tmp/p-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]; k = int(sys.argv[4])
if b != '-': x0, y0, x1, y1 = (int(v) for v in b.split(',')); im = im.crop((max(0, x0), max(0, y0), min(x1, im.width), min(y1, im.height)))
if k > 1: im = im.resize((im.width * k, im.height * k), Image.LANCZOS)
im.save(sys.argv[2], quality=82)`, png, `${DIR}/${name}.jpg`, box ? box.map(Math.round).join(',') : '-', String(k)]);
  return `${DIR}/${name}.jpg`;
}
let nA = 0;
/** real input through the driver: a pointer path [[x, y], …] (button 0 held from the first point to the last), modifier keys held around it */
async function drag(path, keys = []) {
  const down = keys.map((k) => ({ type: 'keyDown', value: k })), up = keys.map((k) => ({ type: 'keyUp', value: k }));
  const ptr = [{ type: 'pointerMove', x: path[0][0], y: path[0][1], origin: 'viewport' }, { type: 'pointerDown', button: 0 },
    ...path.slice(1).map(([x, y]) => ({ type: 'pointerMove', x, y, origin: 'viewport', duration: 30 })), { type: 'pointerUp', button: 0 }];
  const pad = (n) => Array.from({ length: n }, () => ({ type: 'pause', duration: 0 }));
  await drv.actions(g.s, [{ type: 'key', id: 'pk' + ++nA, actions: [...down, ...pad(ptr.length), ...up] }, { type: 'pointer', id: 'pp' + nA, parameters: { pointerType: 'mouse' }, actions: [...pad(down.length), ...ptr, ...pad(up.length)] }]);
  await drv.relActions(g.s);
}
const PRE = `const w = (n) => new Promise((r) => setTimeout(r, n)), N = __LW.nodes, WIN = '[data-mir-window="nodes"] ', $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
  const rect = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); };
  const theme = async (t, c = 'refractive') => { __LW.look.set({ theme: t }); __LW.setCardStyle(c); await w(500); };
  const card = (type) => $(WIN + '.nodes-card[data-type="' + type + '"]');`;
const ev = (body) => g.ev(PRE + body);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 600, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify(await g.errors()));
  await g.ev(`__LW.pause(); await __LW.settle(); return 1;`);
  if (scene === 'p1') {
    /* the door: three knobs from the kit's control({ stops }) in a node card — the rainbow (HUE), grey → the accent (SATURATION), black → white
       (LIGHTNESS) — at home, at an end and mid-way; the ring's segments, ends and thumb counted; dark and light */
    out.door = await ev(`N.open(); await w(600); N.win.place({ x: 700, y: 60, w: 440, h: 520 }); await w(300); N.add('hue'); await w(400);
      const { control } = await import('./mir/controls/factory.js'), host = card('hue').querySelector('.nodes-knobs');
      const mk = (label, min, max, value, stops) => { const c = control({ id: 'probe.' + label, label, min, max, value, home: (min + max) / 2, stops }); host.appendChild(c.root); return c; };
      const H = mk('HUE', -180, 180, 0, ['hsl(180 100% 50%)', 'hsl(240 100% 50%)', 'hsl(300 100% 50%)', 'hsl(0 100% 50%)', 'hsl(60 100% 50%)', 'hsl(120 100% 50%)', 'hsl(180 100% 50%)']);
      const S = mk('SATURATION', -100, 100, 100, ['hsl(0 0% 50%)', 'var(--acc)']), L = mk('LIGHTNESS', -100, 100, -40, ['#000', 'hsl(0 0% 50%)', '#fff']);
      await w(200);
      const ring = (c) => { const s = c.root.querySelector('.k-arc'); return { kind: c.kind, grad: s.classList.contains('k-arc-grad'), segs: s.querySelectorAll('.k-arc-seg').length, ends: s.querySelectorAll('.k-arc-end').length,
        value: !!s.querySelector('.k-arc-value'), thumb: s.querySelector('.k-arc-thumb').getAttribute('transform'), first: getComputedStyle(s.querySelector('.k-arc-seg')).stroke, disc: getComputedStyle(s.querySelector('.k-arc-disc')).fill }; };
      return { H: ring(H), S: ring(S), L: ring(L), box: rect(card('hue')) };`);
    const box = out.door.box, crop = [box[0] - 10, box[1] - 10, box[2] + 10, box[3] + 10];
    for (const t of ['dark', 'light']) { await ev(`await theme('${t}'); return 1;`); await shot('038-P1-door-' + t, crop, 2); }
  }
  if (scene === 'p2') {
    /* LEVELS: the bare face (two rows, no label, no number at rest or under a hover; the readout after a real drag and under the keys); its table is
       `levels`' with the same values; the + menu offers one LEVELS (TONE), the old one opens but is never offered */
    out.face = await ev(`N.open(); await w(600); N.win.place({ x: 700, y: 60, w: 440, h: 560 }); await w(300); const id = N.add('levels2'); await w(300);
      N.set(id, 'inblack', 0.1); N.set(id, 'gamma', 1.6); N.set(id, 'outwhite', 0.9); await w(400);
      const c = card('levels2'), rows = [...c.querySelectorAll('.nodes-face')].map((r) => [...r.children].map((k) => k.dataset.param.split('.').pop()));
      const vis = [...c.querySelectorAll('.nodes-knobs .k')].map((k) => [getComputedStyle(k.querySelector('.k-lbl') || k).display, getComputedStyle(k.querySelector('.k-val')).opacity]);
      const t2 = N.compile().runs[0].tables.r; N.remove(id); const id1 = N.add('levels'); N.set(id1, 'inblack', 0.1); N.set(id1, 'gamma', 1.6); N.set(id1, 'outwhite', 0.9); await w(200);
      const t1 = N.compile().runs[0].tables.r, same = t1.length === t2.length && t1.every((x, i) => x === t2[i]); N.remove(id1); const id2 = N.add('levels2'); N.set(id2, 'inblack', 0.1); N.set(id2, 'gamma', 1.6); N.set(id2, 'outwhite', 0.9); await w(400);
      const g = card('levels2').querySelector('[data-param$=".gamma"] .k-dial');
      return { rows, vis, same, n: t1.length, strip: rect(card('levels2').querySelector('.nodes-strip')), gamma: rect(g), box: rect(card('levels2')), h: card('levels2').offsetHeight };`);
    const [gx0, gy0, gx1, gy1] = out.face.gamma, gx = (gx0 + gx1) / 2, gy = (gy0 + gy1) / 2;
    await drv.actions(g.s, [{ type: 'pointer', id: 'hv', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', x: Math.round(gx), y: Math.round(gy), origin: 'viewport' }] }]); await drv.relActions(g.s);
    out.hover = await ev(`const k = card('levels2').querySelector('[data-param$=".gamma"]'); await w(300); return { hover: k.matches(':hover'), op: getComputedStyle(k.querySelector('.k-val')).opacity };`);
    await drag([[gx, gy], [gx, gy - 20], [gx, gy - 40]]);
    out.drag = await ev(`const k = card('levels2').querySelector('[data-param$=".gamma"]'); await w(250); const o = { active: k.classList.contains('active'), op: getComputedStyle(k.querySelector('.k-val')).opacity, txt: k.querySelector('.k-val').textContent, gamma: N.nodes()[0].values.gamma };
      await w(1200); o.after = getComputedStyle(k.querySelector('.k-val')).opacity; k.focus(); return o;`);
    await g.press('');
    out.keys = await ev(`const k = document.activeElement; await w(250); return { focusVisible: k.matches(':focus-visible'), op: getComputedStyle(k.querySelector('.k-val')).opacity, txt: k.querySelector('.k-val').textContent };`);
    const b = out.face.box, crop = [b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10];
    for (const t of ['dark', 'light']) { await ev(`await theme('${t}'); document.activeElement.blur(); await w(900); return 1;`); await shot('038-P2-levels-' + t, crop, 2); }
    out.menu = await ev(`$(WIN + '.nodes-add').click(); await w(300); const p = $('.mir-ctx .nodes-add-menu'), rows = (q) => [...q.querySelectorAll(':scope > .mb-item')].map((x) => x.querySelector('.mb-lbl').textContent);
      const o = { groups: rows(p) }, sub = async (gid) => { p.querySelector('[data-id="group:' + gid + '"]').click(); await w(250); const s = [...document.querySelectorAll('.mir-ctx .mb-sub-list')].pop(); return s ? rows(s) : null; };
      o.tone = await sub('tone'); o.one = await sub('one');
      const f = $('.mir-ctx .nodes-find'); f.value = 'lev'; f.dispatchEvent(new Event('input')); await w(250); o.find = rows($('.mir-ctx .nodes-add-menu')).filter(Boolean);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); $('.mir-ctx .nodes-find') && $('.mir-ctx .nodes-find').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return o;`);
  }
  out.errors = (await g.errors()).errs;
  console.log(JSON.stringify(out, null, 1));
} finally { await g.close(); }
