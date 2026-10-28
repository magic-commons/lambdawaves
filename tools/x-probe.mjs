/* x-probe.mjs — iteration 020 chain X's probes and pictures (a diagnostic, not a gate).
 *   LW_PORT=9677 GD_PORT=5677 node tools/x-probe.mjs <scene> [--shot name]
 * Each scene runs in one Firefox page; it prints what it measured and, with --shot, writes the NODES window (cropped, JPEG) to
 * research/iteration-020/X-shots/<name>.jpg.  Scenes: x0 (the empty slate + the + menu) · x1 (a box selection at 1.5×) · x2 (a collapsed card,
 * its preview strip, a right-click menu) · x3 (VIEW HERE lit) · x4 (a masked node; CURVES alone is byte-identical — the describe() proof) */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'x0', si = process.argv.indexOf('--shot'), SHOT = si > 0 ? process.argv[si + 1] : null;
const URL = `https://127.0.0.1:${process.env.LW_PORT || 9677}/lab/?warn=0`;
const g = await open(URL, { width: 1600, height: 1000 });
const W = '[data-mir-window="nodes"] ';
const PRE = `const w = (n) => new Promise((r) => setTimeout(r, n)), N = __LW.nodes, $ = (s) => document.querySelector('${W}' + s), $$ = (s) => [...document.querySelectorAll('${W}' + s)];
  const key = (k, o = {}) => $('.nodes-ground').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }));`;
/** real input through the driver: a click (button 0 · 2) or a double click at viewport [x, y]; keys typed into what has focus */
let nA = 0;
const mouse = async ([x, y], how = 'click') => { const b = how === 'right' ? 2 : 0, one = [{ type: 'pointerDown', button: b }, { type: 'pointerUp', button: b }];
  await drv.actions(g.s, [{ type: 'pointer', id: 'xp' + ++nA, parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', x, y, origin: 'viewport' }, ...one, ...(how === 'dbl' ? one : [])] }]); await drv.relActions(g.s); };
const type = async (text) => { await drv.actions(g.s, [{ type: 'key', id: 'xk' + ++nA, actions: [...text].flatMap((c) => [{ type: 'keyDown', value: c }, { type: 'keyUp', value: c }]) }]); await drv.relActions(g.s); };
const SCENES = {
  x0: `__LW.layout.finder.open(); await w(300); document.querySelector('.mir-window-picker .wp-row[data-win="nodes"]').click(); await w(800);
    const finder = { win: N.win.isOpen(), card: !document.querySelector('.dev[data-id="nodes"]').classList.contains('closed') }; N.win.place({ x: 480, y: 70, w: 620, h: 720 }); await w(300); N.views[1].place(); await w(300); const empty = { list: N.nodes().length, line: $('.nodes-empty').textContent, shown: !$('.nodes-empty').hidden };
    $('.nodes-add').click(); await w(200); const menu = { items: $$('.nodes-item[data-type]').length, seps: $$('.nodes-sep').length, icons: $$('.nodes-item .nodes-ico').length, focus: document.activeElement.className };
    const f = $('.nodes-find'); f.value = 'blu'; f.dispatchEvent(new Event('input')); const found = $$('.nodes-item').filter((i) => !i.hidden).map((i) => i.dataset.type || i.dataset.graph);
    f.value = ''; f.dispatchEvent(new Event('input')); await w(200);
    return { finder, empty, menu, found };`,
  x1: `N.open(); await w(600); N.win.place({ x: 480, y: 70, w: 620, h: 720 }); await w(300); for (const t of ['levels', 'posterize', 'blur']) N.add(t); await w(500);
    const G = $('.nodes-ground'), r = G.getBoundingClientRect(), sc = () => +($('.nodes-plane').style.scale || 1), n = () => N.nodes().length, sel = () => $$('.nodes-card.sel').length;
    const ptr = (type, x, y, o = {}) => G.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 0, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: r.left + x, clientY: r.top + y, ...o }));
    G.focus(); key('Home'); const fit = sc();
    G.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true, deltaY: 400, clientX: r.left + 300, clientY: r.top + 300 })); const out = sc();
    key('a', { ctrlKey: true }); const all = sel(); key('d', { ctrlKey: true }); const dup = { n: n(), sel: sel() }; key('Delete'); const del = n();
    key('z', { ctrlKey: true }); const un = n(); key('z', { ctrlKey: true, shiftKey: true }); const re = n();
    key('a', { ctrlKey: true }); key('m'); const off = N.nodes().filter((q) => q.bypass).length; key('m'); key('Escape');
    let caught = null; window.addEventListener('keydown', (e) => { caught = e.key; }, { once: true }); key('x'); const leaked = caught;
    __LW.nodes.views[1].place(); localStorage.setItem('lambdawaves.q0.nodes', JSON.stringify({ ...JSON.parse(localStorage.getItem('lambdawaves.q0.nodes')), zoom: 1, pan: {} })); N.views[1].place(); await w(100);
    G.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -Math.log(1.5) / 0.002, clientX: r.left + 140, clientY: r.top + 60 })); const z15 = sc();
    ptr('pointerdown', 20, 120, { shiftKey: true }); ptr('pointermove', 560, 330, { shiftKey: true }); ptr('pointerup', 560, 330, { shiftKey: true }); const boxed = sel();
    key('Escape'); ptr('pointerdown', 20, 200, { shiftKey: true }); ptr('pointermove', 600, 520, { shiftKey: true }); await w(200);
    return { fit, out, all, dup, del, un, re, off, leaked, z15, boxed };`,
  x2: async (E) => {
    const at = await E(`N.open(); await w(600); N.win.place({ x: 480, y: 70, w: 620, h: 720 }); await w(300); for (const t of ['levels', 'hue', 'blur']) N.add(t); await w(500);
      N.set('n1', 'gamma', 2.2); N.set('n2', 'hue', 90); await w(300); const b = $('[data-node="n1"] .nodes-name').getBoundingClientRect(); return [Math.round(b.left + 12), Math.round(b.top + b.height / 2)];`);
    await mouse(at, 'dbl'); await type('my levels');
    const named = await E(`await w(300); return { bar: $('[data-node="n1"] .nodes-name').textContent, label: __LW.mod.targets().find((t) => t.id === 'nodes.n1.gamma').label, ids: N.nodes().map((q) => q.id) };`);
    const folds = await E(`$('[data-node="n1"] .nodes-chev').click(); await w(200); const c = $('[data-node="n1"]');
      const one = { fold: c.classList.contains('fold'), h: c.offsetHeight, strips: $$('.nodes-strip').length, px: [...$('[data-node="n1"] .nodes-strip').getContext('2d').getImageData(64, 2, 1, 1).data].slice(0, 3) };
      $('.nodes-folds').click(); await w(100); const all = $$('.nodes-card.fold').length; $('.nodes-folds').click(); await w(100); const none = $$('.nodes-card.fold').length;
      $('[data-node="n1"] .nodes-chev').click(); await w(200); N.views[1].place(); await w(200);
      const b = $('[data-node="n2"] .nodes-name').getBoundingClientRect(); return { one, all, none, at: [Math.round(b.left + 30), Math.round(b.top + 6)] };`);
    await mouse(folds.at, 'right');
    const rows = await E(`await w(300); return [...document.querySelectorAll('.mir-ctx .mb-item .mb-lbl')].map((b) => b.textContent);`);   // 022 P2: the kit's contextMenu
    return { named, folds, rows };
  },
  x3: `N.open(); await w(600); N.win.place({ x: 480, y: 70, w: 620, h: 720 }); await w(300); for (const t of ['levels', 'posterize', 'hue', 'blur']) N.add(t); N.set('n1', 'gamma', 1.6); N.set('n3', 'hue', 120); await w(500);
    const css = () => getComputedStyle(document.getElementById('field')).filter, kids = () => document.getElementById(N.filter.id).children.length, foot = () => $('.nodes-passes').textContent;
    const full = { kids: kids(), foot: foot() }; $('[data-node="n3"] .nodes-eye').click(); await w(200);
    const view = { kids: kids(), foot: foot(), lit: $$('.nodes-eye[aria-pressed="true"]').length, past: $$('.nodes-card.past').map((c) => c.dataset.node) };
    $('[data-node="n3"] .nodes-eye').click(); await w(200); const back = { kids: kids(), foot: foot() };
    $('.nodes-ground').focus(); key('a', { ctrlKey: true }); key('Escape'); N.views[1]; $('[data-node="n2"] .nodes-solo').click(); await w(200); const solo = { kids: kids(), foot: foot(), past: $$('.nodes-card.past').length };
    $('[data-node="n2"] .nodes-solo').click(); await w(100); $('.nodes-ground').focus(); key('\\\\'); await w(200); const off = { css: css(), foot: foot(), rec: JSON.parse(localStorage.getItem('lambdawaves.q0.nodes')).off, flagsInRec: 'view' in JSON.parse(localStorage.getItem('lambdawaves.q0.nodes')) };
    key('\\\\'); await w(100); $('[data-node="n3"] .nodes-eye').click(); await w(300); N.views[1].place(); await w(200);
    return { full, view, back, solo, off, after: { css: css().slice(0, 20), foot: foot() } };`,
  /* X4: CURVES alone (FADE 100, MASK NONE) through the compiler vs 018's fixed pair — describe() and the filter's markup, byte for byte;
     then a masked LEVELS (LIGHTS, then CENTRE), a faded POSTERIZE (a fold) and a faded BLUR (one composite); the targets */
  x4: `const f = N.filter, html = () => document.getElementById(f.id).outerHTML, kids = () => [...document.getElementById(f.id).children].map((e) => e.tagName);
    N.setHas(true); __LW.curves.preset('MASTER', 'S'); __LW.curves.preset('R', 'LIFT'); await w(300); f.flush();
    const chain = { ...f.describe(), html: html() };
    f.setChain([]); for (const ch of ['MASTER', 'R', 'G', 'B']) f.setTable(ch, ch === 'G' || ch === 'B' ? null : __LW.curves.table(ch)); f.flush();
    const pair = { ...f.describe(), html: html() };
    for (const ch of ['MASTER', 'R']) f.setTable(ch, null); f.setChain(N.compile().runs); f.flush();
    const proof = { describe: f.describe(), bytes: chain.html.length, identical: chain.html === pair.html && JSON.stringify({ ...chain, html: 0 }) === JSON.stringify({ ...pair, html: 0 }), back: html() === chain.html };
    N.remove('curves'); N.open(); await w(600); N.win.place({ x: 480, y: 70, w: 620, h: 720 }); await w(300);
    const id = N.add('levels'); N.set(id, 'gamma', 2.5); await w(200); const plain = { kids: kids(), passes: N.passes(), mark: $('[data-node="' + id + '"] .nodes-mark').textContent };
    N.set(id, 'mask', 'lights'); await w(200); const lights = { kids: kids(), passes: N.passes(), mark: $('[data-node="' + id + '"] .nodes-mark').textContent, foot: $('[data-node="' + id + '"] .nodes-foot-t').classList.contains('on') };
    N.set(id, 'mask', 'centre'); await w(200); const centre = { kids: kids(), img: (document.getElementById(f.id).querySelector('feImage').getAttribute('href') || '').slice(0, 22) };
    const p = N.add('posterize'); N.set(p, 'fade', 0.5); const b = N.add('blur'); await w(200); const k0 = kids().length; N.set(b, 'fade', 0.5); await w(200);
    const faded = { kidsBefore: k0, kidsAfter: kids().length, last: kids().slice(-2), blurMark: $('[data-node="' + b + '"] .nodes-mark').textContent, posterMark: $('[data-node="' + p + '"] .nodes-mark').textContent };
    const targets = __LW.mod.targets().filter((t) => t.id.startsWith('nodes.' + id + '.')).map((t) => t.id + ' ' + t.label);
    N.remove([p, b]); N.set(id, 'mask', 'lights'); await w(200); $('[data-node="' + id + '"] .nodes-foot-t').click(); N.views[1].place(); await w(400);
    return { proof, plain, lights, centre, faded, targets, errs: __e.slice() };`,
  card: async (E) => { const r = await E(`N.setHas(true); N.add('levels'); N.add('blur'); N.add('vignette'); __LW.layout.reopen('nodes'); __LW.layout.raise('nodes'); await w(1200);
      const d = document.querySelector('.dev[data-id="nodes"]'); d.scrollIntoView(); await w(400); const r = d.getBoundingClientRect(); return [r.left, r.top, r.width, Math.min(r.height, 900)].map(Math.round);`);
    writeFileSync('.tmp/x-card.png', Buffer.from(await g.snap(), 'base64'));
    execFileSync('python3', ['-I', '-c', `import sys; from PIL import Image; x,y,w,h=map(int,sys.argv[2:6]); Image.open(sys.argv[1]).convert('RGB').crop((x,max(0,y),x+w,y+h)).save('.tmp/x-card.jpg', quality=80)`, '.tmp/x-card.png', ...r.map(String)]); return r; },
  /* the older records: 018's one-node record opens with CURVES (bypassed), 019's list as saved (its values gain FADE · MASK · SOFT at home) */
  compat: async (E) => {
    const back = async (rec) => { await E(`localStorage.setItem('lambdawaves.q0.nodes', '${JSON.stringify(rec)}'); return 1;`); await g.nav(URL); await g.waitFor('window.__LW?.ready', 400, 100);
      return E(`await w(400); return N.nodes().map((q) => q.id + ':' + q.type + (q.bypass ? '×' : '') + ':' + q.values.fade + ':' + q.values.mask);`); };
    return { r018: await back({ v: 1, curves: false, at: { curves: [10, 90] } }), r019: await back({ v: 1, list: [{ id: 'curves', type: 'curves', values: {}, bypass: false, at: null }, { id: 'n2', type: 'posterize', values: { steps: 6 }, bypass: true, at: null }] }) };
  },
  /* a NODES edit is no project edit (the graph is PREFERENCE): FOLDERS' unsaved mark before and after CURVES and a LEVELS are added */
  dirty: `await w(400); const d = () => __LW.layout.projects.dirty, o = { d0: d() }; N.setHas(true); N.set(N.add('levels'), 'gamma', 2); await w(600); o.d1 = d(); return o;`,
  /* X4: what a mask does on the screen — the stage canvas's pixels (the driver's composite) bare, under LEVELS GAMMA 3, and under it masked */
  x4px: async (E) => {
    await E(`__LW.setInvert && __LW.setInvert(true); await w(600); return 1;`);
    const r = await E(`const r = document.getElementById('field').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round);`), out = {};
    for (const [name, js] of [['bare', ''], ['gamma', `N.set(N.add('levels'), 'gamma', 3);`], ['lights', `N.set('n1', 'mask', 'lights');`], ['darks', `N.set('n1', 'mask', 'darks');`], ['centre', `N.set('n1', 'mask', 'centre');`], ['fade50', `N.set('n1', 'mask', 'none'); N.set('n1', 'fade', 0.5);`]]) {
      await E(js + ` await w(500); return 1;`); writeFileSync(`.tmp/x4px-${name}.png`, Buffer.from(await g.snap(), 'base64'));
    }
    out.stats = execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
x,y,w,h=map(int,sys.argv[1:5]); L={n: Image.open('.tmp/x4px-'+n+'.png').convert('L').crop((x+w//4,y+h//4,x+3*w//4,y+3*h//4)) for n in ['bare','gamma','lights','darks','centre','fade50']}
b=list(L['bare'].getdata()); W=L['bare'].size[0]
for n,im in L.items():
  d=list(im.getdata()); dk=[d[i] for i in range(len(b)) if b[i]<90]; lt=[d[i] for i in range(len(b)) if b[i]>170]; c=[d[i] for i in range(len(b)) if abs((i%W)-W/2)<W/8 and abs((i//W)-len(b)/W/2)<len(b)/W/8]
  print(n, 'darks', round(sum(dk)/max(1,len(dk)),1), len(dk), 'lights', round(sum(lt)/max(1,len(lt)),1), len(lt), 'centre', round(sum(c)/max(1,len(c)),1))`, ...r.map(String)]).toString();
    return out;
  },
};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify(await g.errors()));
  await g.ev(`__LW.pause(); await __LW.settle(); return 1;`);
  const sc = SCENES[scene], info = typeof sc === 'string' ? await g.ev(PRE + sc) : await sc((b) => g.ev(PRE + b));
  if (SHOT) {
    const r = await g.ev(`const r = document.querySelector('${W.trim()}').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round);`);
    mkdirSync('research/iteration-020/X-shots', { recursive: true });
    const png = '.tmp/x-' + SHOT + '.png'; mkdirSync('.tmp', { recursive: true }); writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
    execFileSync('python3', ['-I', '-c', `import sys; from PIL import Image; x,y,w,h=map(int,sys.argv[3:7]); Image.open(sys.argv[1]).convert('RGB').crop((max(0,x-8),max(0,y-8),x+w+8,y+h+8)).save(sys.argv[2], quality=72)`,
      png, `research/iteration-020/X-shots/${SHOT}.jpg`, ...r.map(String)]);
  }
  console.log(JSON.stringify({ scene, info, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
