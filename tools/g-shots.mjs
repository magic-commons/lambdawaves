/* g-shots.mjs — iteration 036 chain G's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9707 GD_PORT=5707 node tools/g-shots.mjs <scene> [out-dir]
 * Scenes: face (the doors' art, both themes) · decks (the edges' fade and blur) · ways (the big arrow, Escape steps back) · about (the logos
 * open ABOUT over the menu) · sheet (the focus blur, the rows) · strip (the real marks, open) · loader (?loader=1&sw=1 at ~40 % and 100 %).
 * JPEGs into <out-dir> (default .tmp/G-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'face', DIR = process.argv[3] || '.tmp/G-shots', PORT = process.env.LW_PORT || 9707;
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = +(process.env.G_W || 1600), H = +(process.env.G_H || 1000);
const query = scene === 'loader' ? '?loader=1&sw=1&menu=1' : '?menu=1';
const g = await open(`https://127.0.0.1:${PORT}/lab/${query}`, { width: W, height: H, prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (k) => drv.actions(g.s, [{ type: 'key', id: 'k', actions: [{ type: 'keyDown', value: k }, { type: 'keyUp', value: k }] }]);
const move = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'p', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
const click = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'p', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
const mid = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
const theme = async (t) => { await g.ev(`__LW.setTheme(${JSON.stringify(t)}); return 1;`); await wait(900); };
async function shot(name, box, pad = 8, width = 1000) {
  const png = `.tmp/g-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]; w = int(sys.argv[4])
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > w: im = im.resize((w, round(im.height * w / im.width)))
im.save(sys.argv[2], quality=80)`, png, `${DIR}/036-${name}.jpg`, box ? box.map((v, i) => Math.max(0, v + (i < 2 ? -pad : pad))).join(',') : '-', String(width)]);
  return `${DIR}/036-${name}.jpg`;
}
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  if (scene !== 'loader') await g.waitFor(`!!document.querySelector('#lwMenu .mm-face:not([hidden])')`, 100, 100);
  if (scene === 'face') {
    for (const t of ['dark', 'light']) {
      await theme(t); await wait(1500);
      out[t] = await g.ev(`return [...document.querySelectorAll('.mm-door')].map((d) => ({ door: d.dataset.door, icon: !!d.querySelector('.mm-ico'), art: [...d.querySelectorAll('.mm-door-art')].filter((i) => i.getClientRects().length).map((i) => ({ src: i.getAttribute('src'), on: i.classList.contains('on'), w: i.naturalWidth })) }));`);
      const a = await rectOf('.mm-doors'); out[t + 'Shot'] = await shot(`G1-doors-${t}`, a, 24);
      out[t + 'Face'] = await shot(`G1-face-${t}`, null, 0, 1000);
    }
  }
  if (scene === 'decks') {
    const at = () => g.ev(`const m = document.getElementById('lwMenu'); return { face: m.classList.contains('at-face'), sec: m.dataset.sec || null, frost: document.body.classList.contains('frost'), edges: [...m.querySelectorAll('.mm-edge')].map((e) => getComputedStyle(e).display + '/' + getComputedStyle(e).visibility), mask: getComputedStyle(m.querySelector('.mm-scroll')).maskImage.slice(0, 40) };`);
    out.face = await at();
    for (const t of ['dark', 'light']) {
      await theme(t);
      await g.tap('.mm-face:not([hidden]) .mm-door[data-door="library"]'); await wait(1400); out[t] = await at();
      out[t + 'Rest'] = await shot(`G2-decks-rest-${t}`, null, 0, 1000);
      /* mid-passage between MOLECULAR and EXPANSIONS: the snap held off for the picture */
      await g.ev(`const sc = document.querySelector('#lwMenu .mm-scroll'), sec = document.querySelector('#lwMenu .mm-sec.mm-molecular'); sc.style.scrollSnapType = 'none'; sc.scrollTop = sec.offsetTop - sc.clientHeight * .45; return sc.scrollTop;`); await wait(600);
      await g.ev(`document.getElementById('lwMenu').classList.add('mm-moving'); return 1;`); await wait(600);   // held as a scroll holds it
      out[t + 'Mid'] = await shot(`G2-decks-passage-${t}`, null, 0, 1000);
      await g.ev(`const sc = document.querySelector('#lwMenu .mm-scroll'); sc.style.scrollSnapType = ''; document.getElementById('lwMenu').classList.remove('mm-moving'); document.querySelectorAll('.mm-tab')[1].click(); return 1;`); await wait(700);
      await g.tap('.mm-backb'); await wait(900);
    }
  }
  if (scene === 'ways') {
    const st = () => g.ev(`const m = document.getElementById('lwMenu'); return m.hidden ? 'closed' : m.classList.contains('at-face') ? 'face' : (m.dataset.sec === 'tutorial' ? 'tutorial' : 'decks');`);
    const seq = []; await wait(1500);   // the face's entrance (a door mid-rise is not pressable)
    out.tap = await g.tap('.mm-face:not([hidden]) .mm-door[data-door="library"]'); await wait(1000); seq.push(await st());
    const b = await rectOf('.mm-backb'); out.arrow = b; await move(...mid(b)); await wait(400);
    out.arrowShot = await shot('G3-arrow-hover', [0, 0, 420, 180], 0, 420);
    out.arrowCss = await g.ev(`const b = document.querySelector('.mm-backb'), cs = getComputedStyle(b), i = b.querySelector('.mm-ico').getBoundingClientRect(); return { opacity: cs.opacity, color: cs.color, ico: Math.round(i.width), hit: Math.round(b.getBoundingClientRect().width) };`);
    await move(800, 600); await g.press('\uE00C'); await wait(700); seq.push(await st());
    await wait(1200); out.tap2 = await g.tap('.mm-face:not([hidden]) .mm-door[data-door="tutorial"]'); await wait(1000); seq.push(await st());
    out.tutShot = await shot('G3-tutorial-arrow', [0, 0, 800, 300], 0, 800);
    await g.press('\uE00C'); await wait(700); seq.push(await st());
    await g.press('\uE00C'); await wait(700); seq.push(await st());
    out.seq = seq.join(' → ');
  }
  if (scene === 'about') {
    const st = () => g.ev(`const A = __LW.layout.about, w = document.querySelector('#floats > .lw-about'), m = document.getElementById('lwMenu'); let top = null;
      if (A.isOpen && w) { const r = w.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); top = !!(e && e.closest('.lw-about')); }
      return { open: A.isOpen, face: A.face, over: document.body.classList.contains('about-over'), labZ: getComputedStyle(document.getElementById('lab')).zIndex, onTop: top, menu: m.hidden ? 'closed' : m.classList.contains('at-face') ? 'face' : 'other',
        rect: w && A.isOpen ? (() => { const r = w.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); })() : null };`);
    await wait(1500);
    out.tapLogo = await g.tap('.mm-face-logo'); await wait(900); out.lw = await st();
    out.lwShot = await shot('G4-about-over-menu', null, 0, 1000);
    await g.press('\uE00C'); await wait(600); out.afterEsc = await st();
    out.tapMir = await g.tap('.mm-mirb'); await wait(900); out.mir = await st();
    out.mirShot = await shot('G4-mir-about-over-menu', null, 0, 1000);
    /* the drag bounds over the menu: the title bar pulled far up and left */
    const hd = await rectOf('#floats > .lw-about .mir-win-title');
    if (hd) { await drv.actions(g.s, [{ type: 'pointer', id: 'pd', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: hd[0] + 40, y: Math.round((hd[1] + hd[3]) / 2) },
      { type: 'pointerDown', button: 0 }, { type: 'pointerMove', duration: 300, origin: 'viewport', x: 5, y: 2 }, { type: 'pointerUp', button: 0 }] }]); await wait(500); out.dragged = await st(); }
    out.tapX = await g.tap('#floats > .lw-about .mir-win-x'); await wait(700); out.afterX = await st();
  }
  if (scene === 'sheet') {
    const rows = () => g.ev(`const b = document.querySelector('#lwMenu .mm-sheet-body'), lbl = (r) => [...r.querySelectorAll('.seg-lbl, .sw-lbl, .k-lbl, .ro-lbl')].map((x) => x.textContent.trim()).join(' + ');
      const more = b.querySelector('.mm-sh-more .lw-fold'), ctl = [...b.querySelectorAll('.sw, .seg, .seg-b, .k-dial')].filter((c) => c.getClientRects().length);
      return { top: b.scrollTop, rows: [...b.querySelectorAll('.mm-sh-group:not([hidden]) > .mm-sh-row')].map(lbl), more: more && more.getAttribute('aria-expanded'),
        strokes: ctl.filter((c) => { const cs = getComputedStyle(c); return cs.boxShadow !== 'none' || (parseFloat(cs.borderTopWidth) && cs.borderTopColor !== 'rgba(0, 0, 0, 0)'); }).length, controls: ctl.length,
        fx: [...document.querySelectorAll('#lwMenu .mm-sheet-fx > *')].map((x) => getComputedStyle(x).backdropFilter), plate: getComputedStyle(document.querySelector('#lwMenu .mm-sheet')).backgroundColor };`);
    await wait(1500);
    for (const t of ['dark', 'light']) {
      await theme(t); await wait(600);
      out[t + 'Tap'] = await g.tap('.mm-gear'); await wait(700); out[t] = await rows();
      out[t + 'Shot'] = await shot(`G5-sheet-${t}`, null, 0, 1000);
      if (t === 'dark') {
        await g.tap('.mm-sh-more .lw-fold'); await wait(400); out.moreOpen = await rows();
        await g.ev(`document.querySelector('#lwMenu .mm-sheet-body').scrollTop = 400; return 1;`); out.moreShot = await shot('G5-sheet-more-dark', await rectOf('#lwMenu .mm-sheet'), 0, 500);
        await g.press('\uE00C'); await wait(500);
        await g.tap('.mm-gear'); await wait(700); out.reopen = (await rows()).top;   // scrollTop 0 on every open
      }
      await g.press('\uE00C'); await wait(500);
    }
  }
  if (scene === 'strip') {
    await wait(1500);
    for (const t of ['dark', 'light']) {
      await theme(t);
      await g.ev(`document.querySelector('#lwMenu .mm-credits').classList.add('open'); return 1;`); await wait(900);   // the tap's state (a hover opens the same)
      out[t] = await g.ev(`await document.fonts.ready; const c = document.querySelector('#lwMenu .mm-credits');
        return { names: [...c.querySelectorAll('.mm-cr')].map((x) => x.dataset.ai + ':' + ([...x.querySelectorAll('.mm-cr-name b, .mm-cr-word')].filter((e) => e.getClientRects().length).map((e) => e.tagName === 'IMG' ? e.getAttribute('src') : e.textContent + ' ' + getComputedStyle(e).fontFamily.split(',')[0]).join('|'))),
          small: c.querySelectorAll('small').length, fonts: ['600 15px "OpenAI Sans"', '600 15px "Google Sans Flex"'].map((f) => document.fonts.check(f)), mark: c.querySelector('[data-ai="claude"] .mm-cr-mark').getAttribute('src') };`);
      const r = await rectOf('#lwMenu .mm-credits'); out[t + 'Shot'] = await shot(`G6-strip-open-${t}`, [r[0], r[1], r[0] + 420, r[3]], 12, 600);
      await g.ev(`document.querySelector('#lwMenu .mm-credits').classList.remove('open'); return 1;`);
    }
  }
  console.log(JSON.stringify(out, null, 1));
  const errs = await g.errors(); if (errs.errs && errs.errs.length) console.log('page errors', JSON.stringify(errs.errs));
} finally { await g.close(); }
