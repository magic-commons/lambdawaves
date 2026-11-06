/* s038-shots.mjs — iteration 038 chain S's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9699 GD_PORT=5699 node tools/s038-shots.mjs <scene> [out-dir]
 * Scenes: s1 (the detached CONTROL SURFACE card: its corner chip puts the bar on the stage) · s2 (the cycle rack → detached → × → stage → rack
 * leaves no slot, and back) · s3 (the mini-viewer by the bar) · s4 (the widgets' faces) · s5 (the finish sheet).  JPEGs into <out-dir> (default .tmp/S-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 's2', DIR = process.argv[3] || '.tmp/S-shots', W = +(process.env.S_W || 1500), H = +(process.env.S_H || 950);
const URL0 = `https://127.0.0.1:${process.env.LW_PORT || 9699}/lab/?preset=1s%2B2pz&menu=0&warn=0`;
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const g = await open(URL0, { width: W, height: H, script: 180000, prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pid = 0;
const drag = async (x0, y0, x1, y1) => { await drv.actions(g.s, [{ type: 'pointer', id: 'd' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: x0, y: y0 }, { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 80 },
  { type: 'pointerMove', duration: 200, origin: 'viewport', x: Math.round((x0 + x1) / 2), y: Math.round((y0 + y1) / 2) },
  { type: 'pointerMove', duration: 300, origin: 'viewport', x: x1, y: y1 }, { type: 'pause', duration: 120 }, { type: 'pointerUp', button: 0 }] }]); await drv.relActions(g.s); };
async function shot(name, box) {
  const png = `.tmp/s-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=80)`, png, `${DIR}/${name}.jpg`, box ? box.map(Math.round).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
/* the transport's state: where the bar is, the card's parent, class and box, the corner chips that show, the float record */
const state = (tag) => g.ev(`const t = document.getElementById('transport'), c = document.querySelector('.dev[data-id="transport"]'), r = c.getBoundingClientRect(), tb = t.getBoundingClientRect();
  const chips = [...c.querySelectorAll('.dev-util > button')].filter((x) => getComputedStyle(x).display !== 'none').map((x) => x.className.split(' ')[0] + ':' + (x.dataset.helpEn || x.title || ''));
  const L = document.getElementById('rackL'), first = [...L.querySelectorAll(':scope > .dev')].find((d) => !d.classList.contains('closed') && !d.hidden), fr = first && first.getBoundingClientRect();
  return { tag: ${JSON.stringify(tag)}, place: t.dataset.place, docked: t.classList.contains('docked'), barInCard: c.contains(t), bar: [tb.left, tb.top, tb.width, tb.height].map(Math.round),
    card: { cls: c.className, parent: c.parentElement.id || c.parentElement.className, box: [r.left, r.top, r.width, r.height].map(Math.round), style: c.getAttribute('style') },
    chips, floatOf: __LW.layout.floatOf('transport'), rackLFirst: first ? [first.dataset.id, Math.round(fr.top)] : null };`);
/* the mini-viewer by the bar: its box against the bar's, PLAY's for the mirror, its ink, its style cell */
const mini = (tag) => g.ev(`const t = document.getElementById('transport'), m = t.querySelector(':scope > .csb-mini'), b = t.getBoundingClientRect(), r = m.getBoundingClientRect(), p = t.querySelector('.csb-play').getBoundingClientRect();
      const cv = m.querySelector('canvas'), cb = document.querySelector('#transport .csb-mini-b');
      let ink = 0; try { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) ink++; } catch (_) {}
      return { tag: ${JSON.stringify(tag)}, shown: getComputedStyle(m).display !== 'none' && r.width > 0, box: [r.left - b.right, r.top - b.top, r.width, r.height].map(Math.round), bar: [b.left, b.top, b.width, b.height].map(Math.round),
        play: [b.left - p.right, p.top - b.top, p.width].map(Math.round), atTop: t.classList.contains('at-top'), place: t.dataset.place, ink, pic: !m.querySelector('img').hidden,
        chip: cb ? { shown: getComputedStyle(cb).display !== 'none' && cb.getBoundingClientRect().width > 0, gly: cb.dataset.gly, help: cb.dataset.helpEn || cb.title } : null,
        rec: JSON.parse(localStorage.getItem('lambdawaves.q0.csb') || 'null') };`);
const boot = async () => { if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs)); await wait(1200); };
const out = { scene, log: [] };
try {
  await boot();
  if (scene === 's1' || scene === 's2') {
    out.log.push({ dock: await g.tap('#transport .dock-btn') }); await wait(900); out.log.push(await state('docked'));
    const head = await g.ev(`const r = document.querySelector('.dev[data-id="transport"] .dev-head').getBoundingClientRect(); return [Math.round(r.left + 110), Math.round(r.top + r.height / 2)];`);
    await drag(head[0], head[1], 700, 560); await wait(900); out.log.push(await state('detached'));
    if (scene === 's1') {
      await shot('038-S1-detached-corner');
      const c = await g.ev(`const c = document.querySelector('.dev[data-id="transport"]').getBoundingClientRect(); return [c.right - 90, c.top - 10, c.right + 10, c.top + 40];`);
      await shot('038-S1-corner-chips', c);
      out.log.push({ pop: await g.tap('.dev[data-id="transport"] .dev-pop') }); await wait(1000); out.log.push(await state('after the corner chip'));
      await shot('038-S1-bar-on-stage');
      out.log.push({ dock: await g.tap('#transport .dock-btn') }); await wait(1200); out.log.push(await state('docked after the corner chip'));
      out.ok = out.log[6].card.parent === 'rackL' && out.log[6].card.box[1] < 20 && !out.log[6].card.cls.includes('floating') &&out.log[2].chips[0] === 'dev-pop:Put the bar on the stage' && out.log[2].chips.length === 2 && out.log[4].place === 'stage' && !out.log[4].floatOf && out.log[4].card.cls.includes('closed');
    } else {
      out.log.push({ close: await g.tap('.dev[data-id="transport"] .dev-close') }); await wait(900); out.log.push(await state('detached, closed with ×'));
      await shot('038-S2-closed-bar-on-stage');
      out.log.push({ dock: await g.tap('#transport .dock-btn') }); await wait(1200); out.log.push(await state('docked again'));
      await shot('038-S2-docked-again');
      out.log.push({ undock: await g.tap('#transport .dock-btn') }); await wait(900); out.log.push(await state('back on the stage'));
      out.log.push({ dock: await g.tap('#transport .dock-btn') }); await wait(900); out.log.push(await state('docked, third'));
      const s = out.log[4], d = out.log[6];
      out.ok = !s.floatOf && d.docked && d.card.parent === 'rackL' && !d.card.cls.includes('floating') && d.card.box[1] < 20 && out.log[10].card.box[1] < 20;
    }
  }
  if (scene === 's3') {   /* the mini-viewer by the bar: cubane in MOLECULAR, the bar on the stage; its box beside the bar; the chip in the expander cycles the style; docked, hydrogen, H, BY THE BAR off hide it */
    await g.ev(`__LW.look.set({ theme: 'dark' }); __LW.chem.setOn(true); await __LW.settle(); await __LW.chem.pick('cubane'); await __LW.settle(); return 1;`); await wait(1500);
    out.log.push(await mini('cubane, the bar on the stage'));
    const B = out.log[0].bar; await shot('038-S3-by-the-bar-dark', [B[0] - 110, B[1] - 40, B[0] + B[2] + 130, B[1] + B[3] + 30]);
    await g.ev(`__LW.look.set({ theme: 'light' }); return 1;`); await wait(900); out.log.push(await mini('light'));
    await shot('038-S3-by-the-bar-light', [B[0] - 110, B[1] - 40, B[0] + B[2] + 130, B[1] + B[3] + 30]);
    out.log.push({ expand: await g.tap('#transport .tr-expand') }); await wait(900); out.log.push(await mini('expanded'));
    const B2 = out.log[out.log.length - 1].bar; await shot('038-S3-expanded-chip', [B2[0] - 110, B2[1] - 20, B2[0] + B2[2] + 130, B2[1] + B2[3] + 20]);
    for (let k = 0; k < 4; k++) { out.log.push({ chip: await g.tap('#transport .csb-mini-b') }); await wait(500); out.log.push(await mini('chip press ' + (k + 1))); if (k === 0) await shot('038-S3-sticks', [B2[0] + B2[2], B2[1] + B2[3] - 120, B2[0] + B2[2] + 130, B2[1] + B2[3] + 10]); if (k === 1) await shot('038-S3-diagram', [B2[0] + B2[2], B2[1] + B2[3] - 120, B2[0] + B2[2] + 130, B2[1] + B2[3] + 10]); }
    await g.tap('#transport .tr-expand'); await wait(600);
    await g.ev(`__LW.look.set({ theme: 'dark' }); return 1;`);
    out.log.push({ dock: await g.tap('#transport .dock-btn') }); await wait(900); out.log.push(await mini('docked'));
    await g.tap('#transport .dock-btn'); await wait(900); out.log.push(await mini('on the stage again'));
    await g.ev(`document.querySelector('#lwMode [data-id="hydrogen"]').click(); return 1;`); await wait(1200); out.log.push(await mini('hydrogen'));
    await g.ev(`document.querySelector('#lwMode [data-id="molecules"]').click(); await __LW.settle(); return 1;`); await wait(1500); out.log.push(await mini('molecular again'));
    out.log.push({ acts: await g.ev(`__LW.layout.reopen('widgets', 'R'); await new Promise((r) => setTimeout(r, 700)); return [...document.querySelectorAll('.dev[data-id="widgets"] .wg-acts > *')].map((x) => { const r = x.getBoundingClientRect(); return x.textContent.trim() + ' ' + [r.left, r.width, r.height].map(Math.round).join('/') + (x.scrollWidth > x.clientWidth + 1 ? ' OVERFLOW' : ''); });`) });
    out.log.push({ byTheBar: await g.tap('.dev[data-id="widgets"] .wg-bar') }); await wait(500); out.log.push(await mini('BY THE BAR off'));
    const M = await g.ev(`const r = document.querySelector('.dev[data-id="widgets"]').getBoundingClientRect(); return [r.left - 10, r.top - 10, r.right + 10, r.bottom + 10];`);
    await shot('038-S3-manager-by-the-bar', M);
    out.log.push({ back: await g.tap('.dev[data-id="widgets"] .wg-bar') }); await wait(400); out.log.push(await mini('BY THE BAR on'));
  }
  if (scene === 's3w') {   /* the mini-viewer at this width (S_W), then the bar sent to the top by TIMELINE + MODULATION docked below */
    await g.ev(`__LW.look.set({ theme: 'dark' }); __LW.chem.setOn(true); await __LW.settle(); await __LW.chem.pick('cubane'); await __LW.settle(); return 1;`); await wait(1500);
    out.log.push(await mini('width ' + W)); await shot('038-S3-width-' + W, null);
    await g.ev(`document.getElementById('transport').classList.add('at-top'); return 1;`); await wait(300);   // the dodge's class alone: the seat rule is what is looked at
    out.log.push(await mini('.at-top'));
  }
} catch (e) { out.error = String(e && e.stack || e); }
finally { console.log(JSON.stringify(out, null, 1)); await g.close(); }
