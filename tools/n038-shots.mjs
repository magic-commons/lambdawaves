/* n038-shots.mjs — iteration 038 chain N's one check per row and its pictures (a diagnostic, not a gate).
 *   LW_PORT=9705 GD_PORT=5705 node tools/n038-shots.mjs <scene> [out-dir]
 * Scenes: n1 (THE DROPDOWN'S PLATE: the + menu as the kit's pane, in the window and the rack card) · n2 (CTRL+DRAG ZOOM) · n3 (THE BAR) ·
 * n4 (THE WIRE HAS A KNOB) · n5 (THE MINIMAP) · n6 (A NODE HAS A TARGET) · n7 (THE FINISH).  JPEGs into <out-dir> (default .tmp/N-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'n1', DIR = process.argv[3] || '.tmp/N-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const URL = `https://127.0.0.1:${process.env.LW_PORT || 9705}/lab/?starter=home&warn=0&sw=0`;
const g = await open(URL, { width: +(process.env.N_W || 1500), height: +(process.env.N_H || 950), headless: process.env.N_HEADED ? false : true,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
/** the page as the driver composites it, cropped to box [x0, y0, x1, y1] (or whole), as a JPEG */
async function shot(name, box) {
  const png = `.tmp/n-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': x0, y0, x1, y1 = (int(v) for v in b.split(',')); im = im.crop((max(0, x0), max(0, y0), min(x1, im.width), min(y1, im.height)))
im.save(sys.argv[2], quality=80)`, png, `${DIR}/${name}.jpg`, box ? box.map(Math.round).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
let nA = 0;
/** real input through the driver: a pointer path [[x, y], …] (button 0 held from the first point to the last), modifier keys held around it */
async function drag(path, keys = []) {
  const down = keys.map((k) => ({ type: 'keyDown', value: k })), up = keys.map((k) => ({ type: 'keyUp', value: k }));
  const ptr = [{ type: 'pointerMove', x: path[0][0], y: path[0][1], origin: 'viewport' }, { type: 'pointerDown', button: 0 },
    ...path.slice(1).map(([x, y]) => ({ type: 'pointerMove', x, y, origin: 'viewport', duration: 30 })), { type: 'pointerUp', button: 0 }];
  const pad = (n) => Array.from({ length: n }, () => ({ type: 'pause', duration: 0 }));
  await drv.actions(g.s, [{ type: 'key', id: 'nk' + ++nA, actions: [...down, ...pad(ptr.length), ...up] }, { type: 'pointer', id: 'np' + nA, parameters: { pointerType: 'mouse' }, actions: [...pad(down.length), ...ptr, ...pad(up.length)] }]);
  await drv.relActions(g.s);
}
const PRE = `const w = (n) => new Promise((r) => setTimeout(r, n)), N = __LW.nodes, WIN = '[data-mir-window="nodes"] ', $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
  const key = (t, k, o = {}) => t.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: o.code || k, bubbles: true, cancelable: true, ...o }));
  const rect = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); };
  const pane = () => $('.mir-ctx .nodes-add-menu'), rows = (p) => [...p.querySelectorAll(':scope > .mb-item')].map((b) => b.querySelector('.mb-lbl').textContent + (b.querySelector('.mb-key') ? ' ' + b.querySelector('.mb-key').textContent : ''));`;
const ev = (body) => g.ev(PRE + body);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 600, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify(await g.errors()));
  await g.ev(`__LW.pause(); await __LW.settle(); return 1;`);
  if (scene === 'n1') {
    /* the window: the + opens the kit's pane under the button, outside the window; the groups; a group's submenu; the search; Escape; SAVE */
    out.win = await ev(`N.open(); await w(600); N.win.place({ x: 700, y: 60, w: 440, h: 520 }); await w(300); N.add('levels'); N.add('hue'); await w(400);
      const add = $(WIN + '.nodes-add'); add.click(); await w(300); const p = pane();
      const o = { pane: !!p, inWindow: !!(p && p.closest('[data-mir-window]')), host: p && p.parentElement.className, under: p && [rect(add), rect(p)], rows: p && rows(p),
        focus: document.activeElement.className, bg: p && getComputedStyle(p).backgroundColor, filter: p && getComputedStyle(p).backdropFilter, card: document.body.dataset.card, frost: document.body.classList.contains('frost'), theme: document.documentElement.dataset.theme || document.body.dataset.theme };
      const tone = p.querySelector('[data-id="group:table"]'); tone.focus(); key(tone, 'ArrowRight', { code: 'ArrowRight' }); await w(200);
      const sub = $('.mir-ctx .mb-sub-list'); o.sub = sub && rows(sub); o.subFocus = document.activeElement.dataset.id;
      return o;`);
    await shot('038-N1-win-menu-sub', [640, 40, 1180, 620]);
    out.search = await ev(`const f = $('.mir-ctx .nodes-find'); f.focus(); f.value = 'lev'; f.dispatchEvent(new Event('input')); await w(200);
      const o = { rows: rows(pane()), value: $('.mir-ctx .nodes-find').value, focus: document.activeElement.className, caret: document.activeElement.selectionStart };
      key(document.activeElement, 'Enter'); await w(400); o.added = N.nodes().map((q) => q.type); o.closed = !pane(); o.focusAfter = document.activeElement.className;
      $(WIN + '.nodes-add').click(); await w(200); const f2 = $('.mir-ctx .nodes-find'); f2.value = 'zzz'; f2.dispatchEvent(new Event('input')); await w(100); o.none = rows(pane());
      key(document.activeElement, 'Escape', { code: 'Escape' }); await w(200); o.esc = { closed: !pane(), win: N.win.isOpen(), focus: document.activeElement.className };
      return o;`);
    out.save = await ev(`$(WIN + '.nodes-add').click(); await w(200); pane().querySelector('[data-id="graphs"]').click(); await w(200);
      const sub = $('.mir-ctx .mb-sub-list'), o = { graphs: rows(sub) }; sub.querySelector('[data-id="save"]').click(); await w(400);
      const d = $('.mir-dialog'), f = d && d.querySelector('input'); o.dialog = !!d; o.dfocus = document.activeElement === f; f.value = 'Mine'; key(f, 'Enter'); await w(500);
      o.saved = __LW.nodes.views ? null : null; o.list = JSON.parse(localStorage.getItem('lambdawaves.q0.nodePresets') || 'null');
      $(WIN + '.nodes-add').click(); await w(200); pane().querySelector('[data-id="graphs"]').click(); await w(200); o.graphs2 = rows($('.mir-ctx .mb-sub-list'));
      $('.mir-ctx .mb-sub-list [data-id="remove"]').click(); await w(200); const subs = $$('.mir-ctx .mb-sub-list'); o.remove = rows(subs[subs.length - 1]);
      subs[subs.length - 1].querySelector('.mb-item').click(); await w(300); o.after = JSON.parse(localStorage.getItem('lambdawaves.q0.nodePresets') || 'null'); o.open = !!pane();
      return o;`);
    /* the rack card: the same pane under the card's +, never clipped by the card */
    out.card = await ev(`N.win.close(); __LW.layout.reopen('nodes'); __LW.layout.raise('nodes'); await w(900); const d = $('.dev[data-id="nodes"]'); d.scrollIntoView(); await w(300);
      const add = d.querySelector('.nodes-add'); add.click(); await w(300); const p = pane();
      return { pane: !!p, inCard: !!(p && p.closest('.dev')), under: p && [rect(add), rect(p)], card: rect(d), rows: p && rows(p), scroll: p && p.scrollHeight > p.clientHeight };`);
    const r = out.card.under; if (r) await shot('038-N1-card-menu', [r[1][0] - 300, r[0][1] - 60, r[1][2] + 40, r[1][3] + 40]);
  }
  if (scene === 'n2') {
    /* ctrl + drag on the empty ground: up 60 px zooms in ×e^0.36 about the press (the plane point under it stays), down zooms out, the clamp, the record */
    const at = await ev(`N.open(); await w(600); N.win.place({ x: 600, y: 60, w: 520, h: 640 }); await w(300); N.add('levels'); N.add('blur'); await w(400);
      const G = $(WIN + '.nodes-ground'), r = G.getBoundingClientRect(); let p = null;
      for (let y = r.top + r.height * 0.4; y < r.bottom - 60 && !p; y += 20) for (let x = r.left + 20; x < r.right - 20; x += 20) { const e = document.elementFromPoint(x, y); if (e === G || e.matches('.nodes-plane, .nodes-wires')) { p = [x, y]; break; } }
      window.__z = () => +($(WIN + '.nodes-plane').style.scale || 1); window.__pan = () => $(WIN + '.nodes-plane').style.translate;
      window.__plane = (x, y) => { const pl = $(WIN + '.nodes-plane'), [tx, ty = 0] = pl.style.translate.split(' ').map(parseFloat), z = __z(), u = G.getBoundingClientRect(); return [(x - u.left - tx) / z, (y - u.top - ty) / z].map((v) => +v.toFixed(2)); };
      return { p, z0: __z(), plane0: __plane(...p) };`);
    out.start = at;
    const [x, y] = at.p;
    await drag([[x, y], [x, y - 20], [x, y - 40], [x, y - 60]], ['']);
    out.up = await ev(`return { z: +__z().toFixed(3), want: +(${at.z0} * Math.exp(0.36)).toFixed(3), plane: __plane(${x}, ${y}), menu: !!$('.mir-ctx'), rec: JSON.parse(localStorage.getItem('lambdawaves.q0.nodes')).zoom };`);
    await drag([[x, y], [x, y + 200], [x, y + 400]], ['']);
    out.down = await ev(`return { z: __z(), menu: !!$('.mir-ctx') };`);
    await drag([[x, y], [x + 40, y + 30]]);
    out.pan = await ev(`return { z: __z(), pan: __pan() };`);
    out.cursor = await ev(`const G = $(WIN + '.nodes-ground'); G.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, ctrlKey: true, clientX: ${x}, clientY: ${y} })); const a = getComputedStyle(G).cursor;
      G.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: ${x}, clientY: ${y} })); return [a, getComputedStyle(G).cursor];`);
  }
  if (scene === 'n3') {
    /* the doors in the bars: the window's dock beside × (a .mir-win-btn, its glyph 16 px), the card's pop-out before × (× 's look), none in the ground */
    const size = (sel) => `(() => { const e = $(${JSON.stringify(sel)}); if (!e) return null; const s = e.querySelector('svg'), b = e.getBoundingClientRect(), v = s.getBoundingClientRect(); return { w: Math.round(b.width), svg: Math.round(v.width), next: e.nextElementSibling && e.nextElementSibling.className, hint: e.getAttribute('aria-label'), ink: getComputedStyle(e).color }; })()`;
    out.win = await ev(`N.open(); await w(600); N.win.place({ x: 700, y: 60, w: 440, h: 520 }); await w(300); N.add('levels'); await w(300);
      return { door: ${size(WIN + '.mir-win-tools .nodes-door')}, x: ${size(WIN + '.mir-win-x')}, glyph: Math.round($(WIN + '.mir-win-glyph').getBoundingClientRect().width), inGround: !!$(WIN + '.nodes-ground .nodes-door'), head: rect($(WIN + '.mir-win-head')) };`);
    if (out.win.head) await shot('038-N3-win-bar', [out.win.head[0] - 6, out.win.head[1] - 6, out.win.head[2] + 6, out.win.head[3] + 70]);
    out.dock = await ev(`$(WIN + '.mir-win-tools .nodes-door').click(); await w(900); const d = $('.dev[data-id="nodes"]');
      return { win: N.win.isOpen(), card: !d.classList.contains('closed'), door: ${size('.dev[data-id="nodes"] .dev-util .nodes-door')}, x: ${size('.dev[data-id="nodes"] .dev-close')}, inGround: !!$('.dev[data-id="nodes"] .nodes-ground .nodes-door'), head: rect(d.querySelector('.dev-head')) };`);
    if (out.dock.head) await shot('038-N3-card-bar', [out.dock.head[0] - 6, out.dock.head[1] - 6, out.dock.head[2] + 6, out.dock.head[3] + 60]);
    out.pop = await ev(`$('.dev[data-id="nodes"] .dev-util .nodes-door').click(); await w(900); return { win: N.win.isOpen(), card: !$('.dev[data-id="nodes"]').classList.contains('closed') };`);
  }
  out.errors = (await g.errors()).errs;
  console.log(JSON.stringify(out, null, 1));
} finally { await g.close(); }
