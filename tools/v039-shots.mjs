/* v039-shots.mjs — iteration 039 chain V's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9631 GD_PORT=5631 node tools/v039-shots.mjs <scene> [out-dir]
 * Scenes: bar (every bar control's centre hit-tests to itself: racks folded, one unfolded, EXPAND ALL; at 1300 × 850 and 1000 × 700) ·
 * JPEGs into <out-dir> (default .tmp/V-shots).  V_W / V_H set one size; the scene walks both when unset; V_TL=1 opens the TIMELINE first. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'bar', DIR = process.argv[3] || '.tmp/V-shots', TAG = process.env.V_TAG || 'after';
const SIZES = process.env.V_W ? [[+process.env.V_W, +(process.env.V_H || 850)]] : [[1300, 850], [1000, 700]];
const URL0 = `https://127.0.0.1:${process.env.LW_PORT || 9631}/lab/${process.env.V_Q || ''}`;
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PREFS = { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 };
let g = null, pid = 0;
async function shot(name, box) {
  const png = `.tmp/v-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1300: im = im.resize((1300, round(im.height * 1300 / im.width)))
im.save(sys.argv[2], quality=78)`, png, `${DIR}/${name}.jpg`, box ? box.map(Math.round).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const drag = async (x0, y0, x1, y1) => { await drv.actions(g.s, [{ type: 'pointer', id: 'd' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: x0, y: y0 }, { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 80 },
  { type: 'pointerMove', duration: 200, origin: 'viewport', x: Math.round((x0 + x1) / 2), y: Math.round((y0 + y1) / 2) },
  { type: 'pointerMove', duration: 300, origin: 'viewport', x: x1, y: y1 }, { type: 'pause', duration: 120 }, { type: 'pointerUp', button: 0 }] }]); await drv.relActions(g.s); };
const boot = async (w, h, q) => {
  if (g) await g.close();
  g = await open(URL0 + (q || ''), { width: w, height: h, script: 180000, prefs: PREFS });
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await wait(1500);
  if (process.env.V_SCALE) { await g.ev(`__LW.look.set({ scale: ${+process.env.V_SCALE} }); return 1;`); await wait(1500); }   // V4: UI SCALE
};
/* every bar control the hand can see: its centre must hit-test to itself (or inside it).  → { n, covered: [[name, by]] } */
const BAR = `const t = document.getElementById('transport'); const cs = [...t.querySelectorAll('button, .k, [role="button"], .mir-sel-b, .tempo-pill')].filter((e) => {
    const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width >= 6 && r.height >= 6 && c.visibility !== 'hidden' && c.display !== 'none' && !e.closest('[hidden]') && !e.closest('.csb-float') && !e.closest('.tempo-panel') && !e.parentElement.closest('button'); });
  const name = (e) => e.dataset.keyAction || e.dataset.part || e.getAttribute('aria-label') || e.className.toString().split(' ')[0];
  const by = (h) => { if (!h) return 'nothing'; const d = h.closest('.dev[data-id], [data-mir-window], .mir-win, #floats > *'); return (d && (d.dataset.id || d.dataset.mirWindow || d.id || d.className.toString().split(' ')[0])) || h.id || h.className.toString().split(' ')[0] || h.tagName; };
  const covered = [], off = [];
  for (const e of cs) { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) { off.push(name(e)); continue; }
    const h = document.elementFromPoint(x, y); if (!h || !(h === e || e.contains(h))) covered.push([name(e), by(h)]); }
  const b = t.getBoundingClientRect();
  return { n: cs.length, covered: covered.map(([a, c]) => a + ' < ' + c).join(' | '), off: off.join(' | '), bar: [b.left, b.top, b.width, b.height].map(Math.round), under: document.body.classList.contains('transport-under'), top: t.classList.contains('at-top'), clear: t.style.getPropertyValue('--csb-clear') };`;
/* a window's cover census: its rect, the bar's covered controls, the logo, the open TIMELINE's covered controls, its overlap with the shown rack cards */
const COVER = (sel) => `const w = document.querySelector(${JSON.stringify(sel)}); if (!w || w.hidden || !w.offsetWidth) return { sel: ${JSON.stringify(sel)}, shown: false };
  const r = w.getBoundingClientRect(), hitsOf = (q) => { const out = []; for (const e of document.querySelectorAll(q)) { const b = e.getBoundingClientRect(); if (b.width < 6 || b.height < 6 || e.closest('[hidden]') || getComputedStyle(e).visibility === 'hidden') continue;
    const x = b.left + b.width / 2, y = b.top + b.height / 2; if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue; const h = document.elementFromPoint(x, y); if (!h || !(h === e || e.contains(h))) out.push(e.dataset.keyAction || e.getAttribute('aria-label') || e.className.toString().split(' ')[0]); } return out; };
  const bar = hitsOf('#transport button, #transport .k, #transport .mir-sel-b'), logo = hitsOf('#title > *:first-child'), tl = document.querySelector('[data-mir-window="timeline"]');
  const work = tl && !tl.hidden ? hitsOf('[data-mir-window="timeline"] button') : [];
  let rackArea = 0; for (const d of document.querySelectorAll('#rack > .dev:not(.closed), #rackL > .dev:not(.closed)')) { const b = d.getBoundingClientRect(); const ix = Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left)), iy = Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top)); rackArea += ix * iy; }
  return { sel: ${JSON.stringify(sel)}, rect: [r.left, r.top, r.width, r.height].map(Math.round), page: [innerWidth, innerHeight], bar: bar.length + ' ' + bar.join(','), logo: logo.length, work: work.length + ' ' + work.slice(0, 8).join(','), rackPx: Math.round(rackArea), under: document.body.classList.contains('transport-under') };`;
const WINS = [['nodes', '[data-mir-window="nodes"]'], ['render.open', '.dev[data-id="render"]'], ['folders', '[data-mir-window="folders"]'], ['help', '[data-mir-window="keyboard"]'],
  ['notebook', '#notebook'], ['about', '[data-mir-window="about"]'], ['gui', '[data-mir-window="gui"]']];
const out = { scene, log: [] };
try {
  if (scene === 'bar') {
    for (const [w, h] of SIZES) {
      await boot(w, h);
      const tag = `${w}x${h}${process.env.V_TL ? "-tl" : ""}${process.env.V_SCALE ? "-s" + process.env.V_SCALE : ""}`;
      if (process.env.V_TL) { await g.ev(`__LW.run('timeline'); return 1;`); await wait(1400); }   // the top seat under a docked TIMELINE
      out.log.push({ tag, folded: await g.ev(BAR) });
      /* one unfolded window per rack column: SPECTRUM (left, the tallest) and PALETTE (right) */
      for (const id of ['spectrum', 'palette', 'settings']) {
        await g.ev(`const d = document.querySelector('.dev[data-id="${id}"]'); if (d && d.classList.contains('folded')) d.querySelector('.dev-fold')?.click(); return 1;`);
        await wait(900);
        out.log.push({ tag, unfolded: id, r: await g.ev(BAR) });
        await shot(`v1-${tag}-${id}-${TAG}`);
        await g.ev(`const d = document.querySelector('.dev[data-id="${id}"]'); if (d && !d.classList.contains('folded')) d.querySelector('.dev-fold')?.click(); return 1;`);
        await wait(700);
      }
      await g.ev(`__LW.run('folds'); return 1;`); await wait(1200);
      out.log.push({ tag, expandAll: await g.ev(BAR) });
      await shot(`v1-${tag}-expand-all-${TAG}`);
    }
  }
  if (scene === 'summons') {
    const sizes = process.env.V_W ? SIZES : [[1600, 900], [1000, 700]];
    for (const [w, h] of sizes) for (const withTl of [false, true]) {
      await boot(w, h);
      const tag = `${w}x${h}${withTl ? '-tl' : ''}`;
      if (withTl) { await g.ev(`__LW.run('timeline'); return 1;`); await wait(1400); }
      for (const [act, sel] of WINS) {
        if (withTl && !['nodes', 'render.open', 'folders'].includes(act)) continue;
        await g.ev(`__LW.run(${JSON.stringify(act)}); return 1;`); await wait(1300);
        out.log.push({ tag, act, r: await g.ev(COVER(sel)) });
        await shot(`v2-${tag}-${act}-${TAG}`);
        await g.ev(`const L = __LW.layout; if (${JSON.stringify(act)} === 'render.open') { L.dockWindow('render'); document.querySelector('.dev[data-id="render"]')?.classList.contains('closed') || document.querySelector('.dev[data-id="render"] .dev-x, .dev[data-id="render"] [aria-label="close"], .dev[data-id="render"] .dev-util > button:last-child')?.click(); }
          else if (${JSON.stringify(act)} === 'about') L.about.close(); else __LW.run(${JSON.stringify(act)}); return 1;`); await wait(800);
      }
    }
  }
  if (scene === 'render') {   // V3: RENDER floating (FILE › RENDER…) and in the rack — the card's box, the RENDER button's, and what its centre hits
    const RB = `const d = document.querySelector('.dev[data-id="render"]'); if (!d) return null; const c = d.getBoundingClientRect(), b = d.querySelector('.sv-primary'), r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const h = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight ? document.elementFromPoint(x, y) : null, rk = d.parentElement && d.parentElement.closest('#rack, #rackL');
      return { form: d.classList.contains('floating') ? 'floating' : 'rack', card: [c.left, c.top, c.width, c.height].map(Math.round), page: [innerWidth, innerHeight], render: [r.left, r.top].map(Math.round), hit: !!h && (h === b || b.contains(h)), by: h && !(h === b || b.contains(h)) ? (h.closest('[data-id], [data-mir-window]') || h).className.toString().split(' ')[0] : '',
        rack: rk ? Math.round(rk.getBoundingClientRect().height) : 0, folds: [...d.querySelectorAll('.lw-fold[data-fold]')].map((f) => f.dataset.fold + (f.getAttribute('aria-expanded') === 'true' ? '+' : '-')).join(' '), seat: d.dataset.seat || '' };`;
    for (const [w, h] of SIZES) {
      await boot(w, h); const tag = `${w}x${h}`;
      await g.ev(`__LW.run('render.open'); return 1;`); await wait(1500);
      out.log.push({ tag, r: await g.ev(RB) }); await shot(`039-V3-${tag}-floating-${TAG}`);
      await g.ev(`__LW.layout.dockWindow('render'); return 1;`); await wait(900); await g.ev(`__LW.run('render'); return 1;`); await wait(900);
      await g.ev(`document.querySelector('.dev[data-id="render"] .sv-primary')?.scrollIntoView({ block: 'nearest' }); return 1;`); await wait(500);
      out.log.push({ tag, r: await g.ev(RB) }); await shot(`039-V3-${tag}-rack-${TAG}`);
    }
  }
  out.errors = (await g.errors()).errs;
} catch (e) { out.threw = String(e && e.stack || e); }
finally { if (g) await g.close(); }
console.log(JSON.stringify(out, null, 1));
