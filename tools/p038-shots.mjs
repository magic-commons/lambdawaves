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
  if (scene === 'p3' || scene === 'p6') {
    /* a full TONE table: its card (dark, light), its table read back from the compile — against the one-knob it grows from, and its shape */
    const P3 = scene === 'p3', type = P3 ? 'exposure2' : 'bc';
    out.table = await ev(`N.open(); await w(600); N.win.place({ x: 700, y: 60, w: 440, h: 520 }); await w(300);
      const tab = () => Array.from(N.compile().runs[0].tables.r), at = (t, y) => t[Math.round(y * 255)];
      const one = N.add('${P3 ? 'exposure' : 'contrast'}'); N.set(one, '${P3 ? 'stops' : 'contrast'}', ${P3 ? 0.7 : 1.8}); await w(100); const t1 = tab(); N.remove(one);
      const id = N.add('${type}'); await w(100); const o = { home: N.compile().runs.length };
      N.set(id, '${P3 ? 'stops' : 'contrast'}', ${P3 ? 0.7 : 40}); await w(100); const t2 = tab(); o.sameAsOneKnob = t1.every((x, i) => Math.abs(x - t2[i]) < 1e-6);
      ${P3 ? `N.set(id, 'stops', 0); N.set(id, 'shadows', 100); await w(100); const s = tab(); N.set(id, 'shadows', 0); N.set(id, 'highlights', -100); await w(100); const h = tab();
      N.set(id, 'shadows', -100); N.set(id, 'highlights', 100); await w(100); const x = tab(); const mono = (t) => t.every((y, i) => !i || y >= t[i - 1] - 1e-6);
      Object.assign(o, { shadowsAtThird: +(at(s, 1 / 3) - 1 / 3).toFixed(4), highlightsAtTwoThirds: +(at(h, 2 / 3) - 2 / 3).toFixed(4), ends: [s[0], s[255], h[0], h[255], x[0], x[255]],
        monotone: [mono(s), mono(h), mono(x)], leastSlope: +Math.min(...x.slice(1).map((y, i) => (y - x[i]) * 255)).toFixed(3) });
      N.set(id, 'shadows', 30); N.set(id, 'highlights', -20); N.set(id, 'stops', 0.5);`
      : `N.set(id, 'contrast', 0); N.set(id, 'brightness', 50); await w(100); const b = tab(); N.set(id, 'brightness', 0); N.set(id, 'contrast', -100); await w(100); const f = tab();
      N.set(id, 'contrast', 100); await w(100); const c = tab();
      Object.assign(o, { brightness50: [at(b, 0), at(b, 0.5)], flatAtMinus100: [at(f, 0), at(f, 1)], slopeAt100: +((at(c, 0.55) - at(c, 0.45)) / 0.1).toFixed(2) });
      N.set(id, 'brightness', 12); N.set(id, 'contrast', 25);`}
      await w(400); o.box = rect(card('${type}')); o.h = card('${type}').offsetHeight; o.labels = [...card('${type}').querySelectorAll('.nodes-body .k-lbl')].map((l) => l.textContent); o.mark = card('${type}').querySelector('.nodes-mark').textContent; return o;`);
    const b = out.table.box, crop = [b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10];
    for (const t of ['dark', 'light']) { await ev(`await theme('${t}'); return 1;`); await shot(`038-${scene.toUpperCase()}-${type}-${t}`, crop, 2); }
  }
  if (scene === 'p4') {
    /* HUE/SATURATION: its matrix against the one-knob HUE at the same turn, its three ends (S −100 grey, L +100 white, L −100 black), its arcs, its card */
    out.matrix = await ev(`N.open(); await w(600); N.win.place({ x: 700, y: 60, w: 440, h: 520 }); await w(300);
      const mx = () => N.compile().runs[0].matrix, apply = (m, c) => [0, 1, 2].map((r) => +(m[r * 5] * c[0] + m[r * 5 + 1] * c[1] + m[r * 5 + 2] * c[2] + m[r * 5 + 4]).toFixed(4));
      const one = N.add('hue'); N.set(one, 'hue', 120); await w(100); const m1 = mx(); N.remove(one);
      const id = N.add('color'); await w(100); const o = { home: N.compile().runs.length }; N.set(id, 'hue', 120); await w(100); const m2 = mx();
      o.sameAsHue = m1.every((x, i) => Math.abs(x - m2[i]) < 1e-9); N.set(id, 'hue', 0);
      N.set(id, 'saturation', -100); await w(100); o.grey = apply(mx(), [0.9, 0.3, 0.1]); N.set(id, 'saturation', 0);
      N.set(id, 'lightness', 100); await w(100); o.white = apply(mx(), [0.9, 0.3, 0.1]); N.set(id, 'lightness', -100); await w(100); o.black = apply(mx(), [0.9, 0.3, 0.1]);
      N.set(id, 'lightness', 50); await w(100); o.half = apply(mx(), [0.9, 0.3, 0.1]);
      N.set(id, 'hue', -35); N.set(id, 'saturation', 30); N.set(id, 'lightness', 10); await w(400);
      const c = card('color'); o.segs = [...c.querySelectorAll('.nodes-body .k-arc')].map((s) => s.querySelectorAll('.k-arc-seg').length);
      o.labels = [...c.querySelectorAll('.nodes-body .k-lbl')].map((l) => l.textContent); o.title = [c.querySelector('.nodes-name').textContent, c.querySelector('.nodes-name').scrollWidth <= c.querySelector('.nodes-name').clientWidth];
      o.mark = c.querySelector('.nodes-mark').textContent; o.box = rect(c); o.h = c.offsetHeight; return o;`);
    const b = out.matrix.box, crop = [b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10];
    for (const t of ['dark', 'light']) { await ev(`await theme('${t}'); return 1;`); await shot('038-P4-color-' + t, crop, 2); }
  }
  if (scene === 'p5') {
    /* BALANCE: its matrix against the one-knob TEMPERATURE and SATURATION, the vibrance run's shape (folded at 0, its own 7-primitive run else), and
       the vibrance itself through the kit's picture filter on a canvas of four patches (dull, vivid, grey, a dull blue): the dull ones gain the most */
    out.matrix = await ev(`N.open(); await w(600); N.win.place({ x: 700, y: 60, w: 440, h: 560 }); await w(300); const mx = () => N.compile().runs[0].matrix;
      const one = N.add('temperature'); N.set(one, 'warmth', 0.6); await w(100); const m1 = mx(); N.remove(one);
      const id = N.add('balance'); await w(100); const o = { home: N.compile().runs.length }; N.set(id, 'temperature', 60); await w(100); o.sameAsTemperature = m1.every((x, i) => Math.abs(x - mx()[i]) < 1e-9);
      N.set(id, 'temperature', 0); N.set(id, 'tint', 100); await w(100); o.tint = [0, 6, 12].map((i) => +mx()[i].toFixed(3)); N.set(id, 'tint', 0);
      N.set(id, 'vibrance', 60); await w(100); const r = N.compile().runs; o.vib = { runs: r.length, prims: r[0].prim && r[0].prim.map((p) => p[0]), mark: card('balance').querySelector('.nodes-mark').textContent }; return o;`);
    const pat = await ev(`const c = document.createElement('canvas'); c.id = 'p5test'; c.width = 400; c.height = 100; Object.assign(c.style, { position: 'fixed', left: '20px', top: '600px', width: '400px', height: '100px', zIndex: 99999 });
      document.body.appendChild(c); const g2 = c.getContext('2d'); [[153, 128, 115], [230, 51, 26], [128, 128, 128], [100, 115, 150]].forEach((p, i) => { g2.fillStyle = 'rgb(' + p + ')'; g2.fillRect(i * 100, 0, 100, 100); });
      const { pictureFilter } = await import('./mir/panels/picture-filter.js'); window.__p5f = pictureFilter(c); return 1;`);
    const read = async (tag) => { const png = `.tmp/p-p5-${tag}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
      return JSON.parse(execFileSync('python3', ['-I', '-c', `import sys, json
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); print(json.dumps([list(im.getpixel((70 + 100 * i, 650))) for i in range(4)]))`, png]).toString()); };
    out.before = await read('before');
    await ev(`window.__p5f.setChain(N.compile().runs).flush(); await w(400); return 1;`); out.v60 = await read('v60');
    await ev(`N.set(N.nodes()[0].id, 'vibrance', -60); await w(200); window.__p5f.setChain(N.compile().runs).flush(); await w(400); return 1;`); out.vm60 = await read('vm60');
    const chroma = (p) => Math.max(...p) - Math.min(...p);
    out.gain = out.before.map((p, i) => [chroma(p), chroma(out.v60[i]), chroma(out.vm60[i])]);
    await ev(`window.__p5f.setChain([]).flush(); document.getElementById('p5test').remove(); const id = N.nodes()[0].id; N.set(id, 'vibrance', 35); N.set(id, 'temperature', 25); N.set(id, 'tint', -15); N.set(id, 'saturation', 10); await w(400); return 1;`);
    out.card = await ev(`const c = card('balance'); return { rows: [...c.querySelectorAll('.nodes-face')].map((r) => [...r.children].map((k) => k.dataset.param.split('.').pop())), labels: [...c.querySelectorAll('.nodes-body .k-lbl')].map((l) => l.textContent),
      box: rect(c), h: c.offsetHeight, mark: c.querySelector('.nodes-mark').textContent };`);
    const b = out.card.box, crop = [b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10];
    for (const t of ['dark', 'light']) { await ev(`await theme('${t}'); return 1;`); await shot('038-P5-balance-' + t, crop, 2); }
  }
  if (scene === 'p7') {
    /* CHROMATIC ABERRATION's PERSPECTIVE: the run's primitives in each mode, the card's MODE seg, and the stage in each mode at AMOUNT 12 px (a crop
       at the centre and one at the edge: SHIFT moves the fringe the same everywhere, PERSPECTIVE leaves the centre still and grows outward) */
    out.runs = await ev(`N.open(); await w(600); N.win.place({ x: 980, y: 60, w: 420, h: 480 }); await w(300); const id = N.add('aberration'); N.set(id, 'shift', 12); await w(300);
      const kinds = () => N.compile().runs[0].prim.map((p) => p[0]); const o = { shift: kinds() }; N.set(id, 'mode', 'perspective'); await w(300); o.perspective = kinds();
      o.img = N.compile().runs[0].prim.find((p) => p[0] === 'feImage')[1].href.slice(0, 22); o.scales = N.compile().runs[0].prim.filter((p) => p[0] === 'feDisplacementMap').map((p) => p[1].scale);
      const c = card('aberration'); o.seg = [...c.querySelectorAll('.nodes-body .seg button')].map((b) => b.textContent); o.labels = [...c.querySelectorAll('.nodes-body .k-lbl')].map((l) => l.textContent);
      o.box = rect(c); o.film = N.compileAt ? 1 : 0; return o;`);
    await ev(`N.win.close(); await w(400); return 1;`);
    await shot('038-P7-perspective-stage', [200, 120, 1300, 820]);
    await ev(`N.set(N.nodes()[0].id, 'mode', 'shift'); await w(500); return 1;`);
    await shot('038-P7-shift-stage', [200, 120, 1300, 820]);
    await ev(`N.open(); await w(500); N.set(N.nodes()[0].id, 'mode', 'perspective'); await w(300); return 1;`);
    const b = out.runs.box, crop = [b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10];
    for (const t of ['dark', 'light']) { await ev(`await theme('${t}'); return 1;`); await shot('038-P7-aberration-' + t, crop, 2); }
  }
  if (scene === 'p8') {
    /* FILM GRAIN's row and TONE, and THE BLEND FIX: the stage's middle under each LAYER at AMOUNT 1, with the host as it was (z 8: an isolated group) and as
       it is (z auto, each layer z 8) — mean and spread of a 200 × 120 crop, and the vignette's centre and corner */
    const stat = async (tag) => { const png = `.tmp/p-p8-${tag}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
      return JSON.parse(execFileSync('python3', ['-I', '-c', `import sys, json
from PIL import Image, ImageStat
im = Image.open(sys.argv[1]).convert('L'); W, H = im.size; c = im.crop((W // 2 - 100, H // 2 - 60, W // 2 + 100, H // 2 + 60)); s = ImageStat.Stat(c)
print(json.dumps({ 'mean': round(s.mean[0], 1), 'sd': round(s.stddev[0], 1), 'centre': im.getpixel((W // 2, H // 2)), 'corner': im.getpixel((40, H - 40)) }))`, png]).toString()); };
    await ev(`N.close && N.close(); await w(300); return 1;`);
    out.none = await stat('none');
    const old = `const h = document.getElementById('nodeLayers'); h.style.zIndex = '8'; for (const d of h.children) d.style.zIndex = 'auto'; await w(300); return 1;`;
    const now = `const h = document.getElementById('nodeLayers'); h.style.zIndex = ''; for (const d of h.children) d.style.zIndex = ''; await w(300); return 1;`;
    for (const k of ['grain', 'vignette', 'scanlines']) {
      await ev(`for (const q of N.nodes()) N.remove(q.id); const id = N.add('${k}'); N.set(id, 'amount', 1); await w(500); return 1;`);
      await ev(old); out[k + 'Before'] = await stat(k + '-before'); if (k !== 'scanlines') await shot(`038-P8-${k}-before`, [450, 175, 1050, 775]);
      await ev(now); out[k + 'After'] = await stat(k + '-after'); if (k !== 'scanlines') await shot(`038-P8-${k}-after`, [450, 175, 1050, 775]);
    }
    out.host = await ev(`const h = document.getElementById('nodeLayers'); return { host: getComputedStyle(h).zIndex, layer: getComputedStyle(h.firstElementChild).zIndex, sk: getComputedStyle(document.getElementById('skeleton')).zIndex };`);
    await ev(`for (const q of N.nodes()) N.remove(q.id); const id = N.add('grain'); N.set(id, 'amount', 1); await w(400); return 1;`);
    for (const t of [-1, 1]) { await ev(`N.set(N.nodes()[0].id, 'tone', ${t}); await w(400); return 1;`); out['tone' + t] = await stat('tone' + t); }
    await ev(`const id = N.nodes()[0].id; N.set(id, 'tone', 0.4); N.set(id, 'amount', 0.35); N.open(); await w(600); N.win.place({ x: 700, y: 60, w: 440, h: 520 }); await w(400); return 1;`);
    out.card = await ev(`const c = card('grain'); return { rows: [...c.querySelectorAll('.nodes-face')].map((r) => [...r.children].map((k) => k.dataset.param ? k.dataset.param.split('.').pop() : k.className)),
      foot: !!c.querySelector('.nodes-foot'), box: rect(c), h: c.offsetHeight, bg: getComputedStyle(document.querySelector('.node-layer[data-type="grain"]')).backgroundImage.slice(0, 60) };`);
    const b = out.card.box, crop = [b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10];
    for (const t of ['dark', 'light']) { await ev(`await theme('${t}'); return 1;`); await shot('038-P8-grain-' + t, crop, 2); }
  }
  if (scene === 'p10') {
    /* THE FINISH: every new face in the window (all seven at once, the empty state first) and in the rack card, each kind's TARGET (on TABLE · MATRIX ·
       PRIM, never a LAYER), every control hinted and every word upper-case, nothing scrolling, the knobs at home and at their ends, the keys on a knob */
    const KINDS = ['levels2', 'exposure2', 'bc', 'color', 'balance', 'aberration', 'grain'];
    out.empty = await ev(`N.open(); await w(600); N.win.place({ x: 40, y: 40, w: 1400, h: 880 }); await w(400); return { cards: $$(WIN + '.nodes-card[data-type]').length, empty: !$(WIN + '.nodes-empty').hidden };`);
    out.win = await ev(`for (const t of ${JSON.stringify(KINDS)}) N.add(t); await w(500); const ids = N.nodes().map((q) => q.id);
      ids.forEach((id, i) => { const c = $(WIN + '.nodes-card[data-node="' + id + '"]'); c.style.left = (20 + (i % 4) * 300) + 'px'; c.style.top = (60 + Math.floor(i / 4) * 330) + 'px'; }); await w(400);
      const o = {};
      for (const t of ${JSON.stringify(KINDS)}) { const c = card(t), foot = c.querySelector('.nodes-foot'), ctl = [...c.querySelectorAll('.nodes-body [data-control]')];
        o[t] = { target: !!(foot && [...foot.querySelectorAll('button')].some((b) => b.textContent.trim() === 'OBJECT')), hinted: ctl.filter((k) => !(k.title || k.dataset.hint || k.getAttribute('aria-description') || (k.querySelector('[title]') || {}).title)).map((k) => k.dataset.control),
          words: [...c.querySelectorAll('.nodes-body .k-lbl, .nodes-body .seg button, .nodes-name')].map((l) => l.textContent.trim()).filter((s) => s !== s.toUpperCase()), h: c.offsetHeight, w: c.offsetWidth,
          scroll: [...c.querySelectorAll('*')].some((e) => e.scrollHeight > e.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) }; }
      const body = $(WIN + '.mir-win-body'); o.winScroll = body.scrollHeight > body.clientHeight + 1; return o;`);
    for (const t of ['dark', 'light']) { await ev(`await theme('${t}'); N.set(N.nodes()[3].id, 'hue', 180); N.set(N.nodes()[0].id, 'inwhite', 0); await w(500); return 1;`); await shot('038-P10-win-all-' + t, [40, 40, 1440, 920]); }
    out.keys = await ev(`const k = card('color').querySelector('[data-param$=".saturation"]'); k.focus(); return document.activeElement === k;`);
    for (const key of ['', '', '']) await g.press(key);   // ↑ ↑ Home
    out.keysAfter = await ev(`const q = N.nodes()[3]; return { saturation: q.values.saturation, focus: document.activeElement.dataset.param };`);
    out.card = await ev(`N.win.close(); await w(300); __LW.layout.reopen('nodes'); __LW.layout.raise('nodes'); await w(1200); const d = document.querySelector('.dev[data-id="nodes"]');
      const r = d.getBoundingClientRect(); return { side: d.parentElement.id, w: Math.round(r.width), cards: d.querySelectorAll('.nodes-card[data-type]').length, faces: d.querySelectorAll('.nodes-face').length,
        scroll: [...d.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).map((e) => e.className).slice(0, 4),
        box: [r.left, r.top, r.right, Math.min(r.bottom, innerHeight)].map(Math.round) };`);
    const b = out.card.box;
    for (const t of ['dark', 'light']) { await ev(`await theme('${t}'); return 1;`); await shot('038-P10-card-' + t, [b[0] - 4, b[1] - 4, b[2] + 4, b[3]]); }
  }
  out.errors = (await g.errors()).errs;
  console.log(JSON.stringify(out, null, 1));
} finally { await g.close(); }
