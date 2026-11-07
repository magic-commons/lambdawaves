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
const ev = (body) => g.ev(PRE + body), WIN = '[data-mir-window="nodes"] ';
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
  if (scene === 'n4') {
    /* the wire's knob: three handles (LEVELS · HUE · GRAIN), none on the wire into STAGE OUT; a turn, the wheel, home; Delete unplugs (the filter
       loses HUE, the wire dashed to the handle), undo / redo; a port carried onto a wire moves its node there and plugs it; an in-port let go off unplugs */
    const H = (id) => `$(WIN + '.nodes-hand[data-wire="${id}"]')`, ctr = (sel) => `(() => { const r = ${sel}.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; })()`;
    out.start = await ev(`N.open(); await w(600); N.win.place({ x: 560, y: 40, w: 560, h: 800 }); await w(300); for (const t of ['levels', 'hue', 'grain']) N.add(t); N.set('n2', 'hue', 90); await w(500); N.views[1].place(); await w(300);
      const hs = $$(WIN + '.nodes-hand').map((h) => h.dataset.wire), mid = (() => { const h = ${H('n2')}, p = $$(WIN + '.nodes-wires path')[1].getAttribute('d').match(/-?[\\d.]+/g).map(Number); return { left: parseFloat(h.style.left), top: parseFloat(h.style.top), ends: [(p[0] + p[6]) / 2, (p[1] + p[7]) / 2] }; })();
      return { hs, mid, at: ${ctr(H('n2'))}, lv: ${ctr(H('n1'))}, kids: document.getElementById(N.filter.id).children.length };`);
    let [hx, hy] = out.start.at;
    await drag([[hx, hy], [hx, hy + 40], [hx, hy + 80], [hx, hy + 110]]);
    out.turn = await ev(`const q = () => N.nodes().find((n) => n.id === 'n2'); return { fade: +q().values.fade.toFixed(3), val: ${H('n2')}.dataset.val, sel: ${H('n2')}.classList.contains('sel'), focus: document.activeElement.className, arc: ${H('n2')}.querySelector('.v').getAttribute('stroke-dasharray') };`);
    out.wheel = await ev(`const h = ${H('n1')}; h.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 })); await w(100); const a = N.nodes()[0].values.fade;
      h.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100, ctrlKey: true })); await w(100); return { fade: a, after: N.nodes()[0].values.fade, z: $(WIN + '.nodes-plane').style.scale };`);
    [hx, hy] = await ev(`return ${ctr(H('n2'))};`);   // the ctrl + wheel above zoomed the view
    await drv.actions(g.s, [{ type: 'pointer', id: 'nd' + ++nA, parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', x: hx, y: hy, origin: 'viewport' }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }, { type: 'pause', duration: 60 }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }] }]); await drv.relActions(g.s);
    out.home = await ev(`return N.nodes().find((n) => n.id === 'n2').values.fade;`);
    out.pre = await ev(`return { sel: ($(WIN + '.nodes-hand.sel') || {}).dataset, focus: document.activeElement.className, keys: !!N.keysAt(document.activeElement) };`);
    out.unplug = await ev(`const G = $(WIN + '.nodes-ground'); G.focus(); key(G, 'Delete', { code: 'Delete' }); await w(400); const p = $$(WIN + '.nodes-wires path')[1], h = ${H('n2')};
      const d = p.getAttribute('d').match(/-?[\\d.]+/g).map(Number);
      const o = { plug: JSON.parse(localStorage.getItem('lambdawaves.q0.nodes')).list.map((q) => q.id + ':' + (q.plug === false ? 'off' : 'on')), dimmed: $(WIN + '.nodes-card[data-node="n2"]').classList.contains('unplug'), cut: p.classList.contains('cut'), end: d.slice(-2), handle: [parseFloat(h.style.left), parseFloat(h.style.top)], kids: document.getElementById(N.filter.id).children.length, nodes: N.nodes().length };
      key(G, 'z', { code: 'KeyZ', ctrlKey: true }); await w(300); o.undo = $(WIN + '.nodes-card[data-node="n2"]').classList.contains('unplug'); key(G, 'z', { code: 'KeyZ', ctrlKey: true, shiftKey: true }); await w(300); o.redo = $(WIN + '.nodes-card[data-node="n2"]').classList.contains('unplug');
      return o;`);
    await shot('038-N4-wires-unplugged', [560, 40, 1120, 840]);
    /* HUE's in-port onto the last wire (GRAIN → STAGE OUT): HUE moves after GRAIN, plugged */
    const p1 = await ev(`const a = $(WIN + '[data-node="n2"] .nodes-port.in').getBoundingClientRect(), w3 = $$(WIN + '.nodes-wires path')[3].getBoundingClientRect(); return [[a.left + 5, a.top + 5], [w3.left + w3.width / 2, w3.top + w3.height / 2]].map((v) => v.map(Math.round));`);
    await drag([p1[0], [p1[0][0] + 30, p1[0][1] + 20], [p1[1][0], p1[1][1] - 10], p1[1]]);
    out.replug = await ev(`await w(300); const ids = N.nodes().map((q) => q.id), top = (id) => parseFloat($(WIN + '[data-node="' + id + '"]').style.top);
      return { order: ids, plug: JSON.parse(localStorage.getItem('lambdawaves.q0.nodes')).list.map((q) => q.id + (q.plug === false ? ':off' : '')), tops: [...ids, 'out'].map(top), dimmed: $(WIN + '.nodes-card[data-node="n2"]').classList.contains('unplug') };`);
    /* LEVELS' out-port onto the wire GRAIN → HUE: LEVELS goes between them */
    const p2 = await ev(`const a = $(WIN + '[data-node="n1"] .nodes-port.out').getBoundingClientRect(), h = ${H('n2')}.getBoundingClientRect(); return [[a.left + 5, a.top + 5], [h.left + h.width / 2, h.bottom + 6]].map((v) => v.map(Math.round));`);
    await drag([p2[0], [p2[0][0] + 30, p2[0][1] + 30], p2[1]]);
    out.splice = await ev(`await w(300); const ids = N.nodes().map((q) => q.id), top = (id) => parseFloat($(WIN + '[data-node="' + id + '"]').style.top); return { order: ids, tops: [...ids, 'out'].map(top) };`);
    /* GRAIN's in-port let go on the empty ground: GRAIN unplugged */
    const p3 = await ev(`const a = $(WIN + '[data-node="n3"] .nodes-port.in').getBoundingClientRect(); return [a.left + 5, a.top + 5].map(Math.round);`);
    await drag([p3, [p3[0] - 60, p3[1] - 10], [p3[0] - 140, p3[1] - 20]]);
    out.pullOff = await ev(`await w(300); return { plug: N.graph().list.map((q) => q.id + (q.plug === false ? ':off' : '')), menu: (() => { const h = $(WIN + '.nodes-hand[data-wire="n3"]'); h.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 10, clientY: 10 })); return 1; })() };`);
    out.menu = await ev(`await w(300); return [...document.querySelectorAll('.mir-ctx .mb-item .mb-lbl')].map((b) => b.textContent);`);
    await shot('038-N4-wires-spliced', [560, 40, 1120, 840]);
  }
  if (scene === 'n5') {
    /* the minimap: hidden at FIT; zoomed in, shown — a rect a card and the view's; a drag centres the view on the map's point; the wheel zooms about the view's centre */
    out.fit = await ev(`N.open(); await w(600); N.win.place({ x: 600, y: 60, w: 520, h: 640 }); await w(300); for (const t of ['levels', 'hue']) N.add(t); await w(500);
      $(WIN + '.nodes-ground').focus(); key($(WIN + '.nodes-ground'), 'Home', { code: 'Home' }); await w(300); const m = $(WIN + '.nodes-map'), o = { hidden: m.hidden, z: $(WIN + '.nodes-plane').style.scale };
      for (const t of ['blur', 'grain', 'vignette', 'posterize']) N.add(t); await w(500); return o;`);
    out.zoom = await ev(`const G = $(WIN + '.nodes-ground'), r = G.getBoundingClientRect(); G.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -400, clientX: r.left + 150, clientY: r.top + 120 })); await w(300);
      const m = $(WIN + '.nodes-map'), s = m.firstChild, R = [...s.children]; return { hidden: m.hidden, rects: R.length, cards: $$(WIN + '.nodes-card').length, view: R[R.length - 1].getAttribute('class'), box: rect(m), title: m.title, vb: s.getAttribute('viewBox') };`);
    await shot('038-N5-minimap', [600, 60, 1120, 700]);
    const mb = out.zoom.box, c = [Math.round((mb[0] + mb[2]) / 2), Math.round((mb[1] + mb[3]) / 2)];
    const centre = `(() => { const G = $(WIN + '.nodes-ground'), pl = $(WIN + '.nodes-plane'), [tx, ty = 0] = pl.style.translate.split(' ').map(parseFloat), z = +pl.style.scale; return [(G.clientWidth / 2 - tx) / z, (G.clientHeight / 2 - ty) / z].map((v) => Math.round(v)); })()`;
    out.want = await ev(`const s = $(WIN + '.nodes-map').firstChild, q = new DOMPoint(${c[0]}, ${c[1]}).matrixTransform(s.getScreenCTM().inverse()); return [Math.round(q.x), Math.round(q.y)];`);
    await drag([[c[0] + 20, c[1]], [c[0] + 10, c[1]], c]);
    out.drag = await ev(`return { centre: ${centre}, rec: JSON.parse(localStorage.getItem('lambdawaves.q0.nodes')).pan };`);
    out.wheel = await ev(`const before = ${centre}, z0 = +$(WIN + '.nodes-plane').style.scale; $(WIN + '.nodes-map').dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 200 })); await w(200);
      return { z0, z: +$(WIN + '.nodes-plane').style.scale, before, after: ${centre} };`);
  }
  if (scene === 'n6') {
    /* a node's TARGET: benzene's balls and sticks over its cloud; INVERT at AMOUNT 1 aimed at OBJECT, then STAGE, then BOTH — the page's pixels against the
       plain picture (changed inside the stage canvas), the field's mask in force, the filter's markup; the node removed puts the mask away */
    await ev(`__LW.verbs.run([{ verb: 'molecule', args: { id: 'C6H6' } }], { who: 'SHOTS' }); return 1;`);
    await g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 900, 200);
    const fb = await ev(`__LW.mat.atomSize = 0.35; __LW.mat.stickR = 0.3; __LW.schedule(4); await __LW.settle(); await __LW.settle(); await w(600); return rect(document.getElementById('field'));`);
    const box = [fb[0] + Math.round((fb[2] - fb[0]) * 0.2), fb[1] + Math.round((fb[3] - fb[1]) * 0.2), fb[0] + Math.round((fb[2] - fb[0]) * 0.8), fb[1] + Math.round((fb[3] - fb[1]) * 0.8)];
    const png = async (name) => { const f = `.tmp/n6-${name}.png`; writeFileSync(f, Buffer.from(await g.snap(), 'base64')); return f; };
    const diff = (a, b) => JSON.parse(execFileSync('python3', ['-I', '-c', `import sys, json
from PIL import Image
x0, y0, x1, y1 = map(int, sys.argv[3:7]); A = Image.open(sys.argv[1]).convert('RGB').crop((x0, y0, x1, y1)); B = Image.open(sys.argv[2]).convert('RGB').crop((x0, y0, x1, y1))
n = sum(1 for p, q in zip(A.getdata(), B.getdata()) if max(abs(p[i] - q[i]) for i in range(3)) > 24); print(json.dumps({ 'changed': n, 'of': A.size[0] * A.size[1] }))`, a, b, ...box.map(String)]).toString());
    const base = await png('base');
    out.object = await ev(`const id = N.add('invert'); N.set(id, 'target', 'object'); await w(400); __LW.schedule(4); await __LW.settle(); await w(400); window.__id = id;
      const f = document.getElementById(N.filter.id); return { mask: __LW.field.objectMask, passes: N.passes(), alpha: !!f.querySelector('feComponentTransfer[in="SourceAlpha"]'), close: f.lastElementChild.outerHTML.slice(0, 120), mark: $(WIN.replace('window', 'window') + '.nodes-mark') ? 1 : 0 };`);
    out.object.px = diff(base, await png('object'));
    if (process.env.N6_LATE) { await ev(`await w(1500); return 1;`); out.object.late = diff(base, await png('object-late')); await ev(`__LW.schedule(4); await __LW.settle(); await w(600); return 1;`); out.object.later = diff(base, await png('object-later'));
      execFileSync('python3', ['-I', '-c', `import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).convert('RGB').crop(tuple(map(int, sys.argv[3:7]))).save(sys.argv[2], quality=80)`, '.tmp/n6-object-later.png', '.tmp/n6-object-later.jpg', ...box.map(String)]); }
    out.stage = await ev(`N.set(__id, 'target', 'stage'); await w(400); __LW.schedule(4); await __LW.settle(); await w(400); return { mask: __LW.field.objectMask };`);
    out.stage.px = diff(base, await png('stage'));
    out.both = await ev(`N.set(__id, 'target', 'both'); await w(400); __LW.schedule(4); await __LW.settle(); await w(400); return { mask: __LW.field.objectMask, kids: document.getElementById(N.filter.id).children.length };`);
    out.both.px = diff(base, await png('both'));
    out.gone = await ev(`N.set(__id, 'target', 'object'); await w(300); N.remove(__id); await w(400); return { mask: __LW.field.objectMask, filter: getComputedStyle(document.getElementById('field')).filter };`);
    out.card = await ev(`const id = N.add('levels'); N.open(); await w(600); N.win.place({ x: 700, y: 60, w: 440, h: 600 }); await w(300); const c = $(WIN + '.nodes-card[data-node="' + id + '"]'); c.querySelector('.nodes-foot-t').click(); await w(200);
      N.set(id, 'target', 'stage'); await w(300); return { foot: c.querySelector('.nodes-foot-t').textContent, lit: c.querySelector('.nodes-foot-t').classList.contains('on'), seg: [...c.querySelectorAll('.nodes-foot .seg-b, .nodes-foot button[data-v]')].map((b) => b.textContent).filter(Boolean), mark: c.querySelector('.nodes-mark').textContent, box: rect(c) };`);
    await shot('038-N6-target-card', [out.card.box[0] - 10, out.card.box[1] - 10, out.card.box[2] + 10, out.card.box[3] + 10]);
    for (const n of ['object', 'stage']) execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
Image.open(sys.argv[1]).convert('RGB').crop(tuple(map(int, sys.argv[3:7]))).save(sys.argv[2], quality=80)`, `.tmp/n6-${n}.png`, `${DIR}/038-N6-invert-${n}.jpg`, ...box.map(String)]);
  }
  if (scene === 'n6b') {
    /* the experiment: an arithmetic copy of the source first (does it clamp the colour to the alpha?) */
    await ev(`__LW.verbs.run([{ verb: 'molecule', args: { id: 'C6H6' } }], { who: 'SHOTS' }); return 1;`);
    await g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 900, 200);
    const fb = await ev(`__LW.mat.atomSize = 0.35; __LW.mat.stickR = 0.3; __LW.schedule(4); await __LW.settle(); await w(400); const id = N.add('invert'); N.set(id, 'target', 'object'); await w(500); __LW.schedule(4); await __LW.settle(); await w(400); return rect(document.getElementById('field'));`);
    const crop = (n) => execFileSync('python3', ['-I', '-c', `import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).convert('RGB').crop(tuple(map(int, sys.argv[3:7]))).save(sys.argv[2], quality=80)`, `.tmp/n6b-${n}.png`, `.tmp/n6b-${n}.jpg`, ...fb.map(String)]);
    writeFileSync('.tmp/n6b-plain.png', Buffer.from(await g.snap(), 'base64')); crop('plain');
    out.mode = await ev(`const runs = N.compile().runs; N.filter.setChain([{ prim: [['feComposite', { in: 'SourceGraphic', in2: 'SourceGraphic', operator: 'arithmetic', k1: 0, k2: 1, k3: 0, k4: 0 }]] }, ...runs]).flush(); await w(400); return document.getElementById(N.filter.id).children.length;`);
    writeFileSync('.tmp/n6b-arith.png', Buffer.from(await g.snap(), 'base64')); crop('arith');
  }
  if (scene === 'n6a') {
    await ev(`__LW.verbs.run([{ verb: 'molecule', args: { id: 'C6H6' } }], { who: 'SHOTS' }); return 1;`);
    await g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 900, 200);
    out.alpha = await ev(`__LW.mat.atomSize = 0.35; __LW.mat.stickR = 0.3; await __LW.settle(); const F = __LW.field; F.setObjectMask(true); const r = await F.readPixels(__LW.obs, __LW.mat, 300, 200, true);
      const bands = []; for (let b = 0; b < 4; b++) { const n = {}; for (let y = b * 50; y < b * 50 + 50; y++) for (let x = 0; x < 300; x++) { const i = y * r.bpr + x * 4, v = r.px[i + 3]; n[v] = (n[v] || 0) + 1; } bands.push(Object.entries(n).sort((p, q) => q[1] - p[1]).slice(0, 6)); }
      const i = 10 * r.bpr + 150 * 4; F.setObjectMask(false); return { bands, top: [...r.px.slice(i, i + 4)], style: __LW.mat.style, view: __LW.mat.view };`);
  }
  out.errors = (await g.errors()).errs;
  console.log(JSON.stringify(out, null, 1));
} finally { await g.close(); }
