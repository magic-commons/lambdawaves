/* b-shots.mjs — iteration 018 chain B's pictures (a diagnostic, not a gate).
 *   LW_PORT=8779 GD_PORT=5779 node tools/b-shots.mjs <scene> [outdir]
 * Scenes: wave (WAVE floated under hydrogen, then under H₂O with ESP drawn) · camera (CAMERA floated, its fold open) ·
 * espbar (H₂O · ESP · PALETTE on, then HUE and INVERT moved, then PALETTE off) · sides (the bar RIGHT · LEFT · TOP · BOTTOM with the stage
 * formula on) · subtitle (H₂O's formula with NAME and SUBTITLE on) · read '<body>' (one look at the page).  Writes small JPEGs (python crops the driver's composite). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'wave', DIR = scene === 'read' ? '.tmp' : process.argv[3] || 'research/iteration-018/B-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8779}/lab/?starter=home`, { width: 1500, height: 950 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const float = (id, x, y, w) => g.ev(`__LW.layout.reopen(${JSON.stringify(id)}); __LW.layout.raise(${JSON.stringify(id)}); __LW.layout.popOut(${JSON.stringify(id)}, { x: ${x}, y: ${y}, w: ${w} });
  await new Promise((r) => setTimeout(r, 300)); const d = document.querySelector('.dev[data-id=${JSON.stringify(id)}]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); return 1;`);
const rectOf = (sel) => g.ev(`const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
const cardH = (id) => g.ev(`return Math.round(document.querySelector('.dev[data-id="${id}"]').getBoundingClientRect().height);`);
/** the composite, cropped to `box` ([l, t, r, b] css px, padded 8; null = whole) and written as a small JPEG */
async function shot(name, box) {
  const png = `.tmp/b-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1000: im = im.resize((1000, round(im.height * 1000 / im.width)))
im.save(sys.argv[2], quality=72)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.max(0, v + (i < 2 ? -8 : 8))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const mol = async () => { await g.ev(`__LW.chem.setOn(true); return 1;`); await g.waitFor('window.__LW?.chem?.on && !!__LW.chem.row()', 300, 100); await wait(2500); };
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await g.ev(`const t = document.getElementById('transport'); if (t) t.style.visibility = 'hidden'; return 1;`);
  if (scene === 'read') out.r = await g.ev(process.argv[3]);   // read '<body>': one look at the page, for a probe
  else if (scene === 'wave') {
    await float('observer', 560, 10, 340); await wait(800);
    out.h = [await shot('b1-wave-hydrogen', await rectOf('.dev[data-id="observer"]')), await cardH('observer')];
    await mol(); await g.ev(`__LW.setStyle('esp'); return 1;`); await wait(1500);
    out.m = [await shot('b1-wave-molecule', await rectOf('.dev[data-id="observer"]')), await cardH('observer')];
  } else if (scene === 'camera') {
    await float('camera', 560, 10, 340); await wait(800);
    await g.ev(`const f = document.querySelector('.dev[data-id="camera"] .lw-fold'); if (f && f.getAttribute('aria-expanded') !== 'true') f.click(); return 1;`); await wait(500);
    out.verbs = await g.ev(`return [...document.querySelectorAll('.dev[data-id="camera"] .cam-verbs > *')].map((n) => n.textContent.trim());`);
    out.flips = await g.ev(`return [...document.querySelectorAll('.dev[data-id="camera"] *')].filter((n) => !n.children.length && n.textContent.trim() === 'FLIP').length;`);
    out.spin = await g.ev(`return [...document.querySelectorAll('.dev[data-id="camera"] *')].filter((n) => !n.children.length && n.textContent.trim() === 'SPIN').length;`);
    out.shot = await shot('b3-camera', await rectOf('.dev[data-id="camera"]'));
  } else if (scene === 'espbar') {
    await mol(); await g.ev(`__LW.setStyle('esp'); __LW.palette.setOn(true, true); return 1;`); await wait(2000);
    out.a = await shot('b5-bar-palette', null);
    await g.ev(`__LW.mat.hueShift = 0.3; __LW.setInvert(true); return 1;`); await wait(1500);
    out.b = await shot('b5-bar-hue-invert', null);
    await g.ev(`__LW.palette.setOn(false, true); return 1;`); await wait(1500);
    out.c = await shot('b5-bar-off-hue-invert', null);
  } else if (scene === 'sides') {
    await mol(); await g.ev(`__LW.setStyle('esp'); return 1;`); await wait(1500);
    await g.ev(`__LW.layout.reopen('informational'); return 1;`); await wait(400);
    for (const side of ['right', 'left', 'top', 'bottom']) {   // INFORMATIONAL's own controls: SIDE cycles, POSITION follows the side for the overlap case
      out[side] = await g.ev(`const b = document.querySelector('.info-side'); for (let i = 0; i < 4 && b.textContent.trim() !== ${JSON.stringify(side.toUpperCase())}; i++) { b.click(); await new Promise((r) => setTimeout(r, 50)); }
        const pos = [...document.querySelectorAll('.info-seat .seg button')].find((x) => x.textContent.trim() === ${JSON.stringify(side === 'bottom' ? 'BOTTOM' : 'TOP')}); if (pos) pos.click();
        await new Promise((r) => setTimeout(r, 1200)); const r = document.querySelector('.lw-espbar').getBoundingClientRect(), f = document.querySelector('.mir-info.lw-stage .mir-info-block').getBoundingClientRect();
        return { side: b.textContent.trim(), bar: [r.left, r.top, r.right, r.bottom].map(Math.round), formula: [f.left, f.top, f.right, f.bottom].map(Math.round) };`);
      out[side].shot = await shot('b7-bar-' + side, null);
    }
  } else if (scene === 'info') {   // INFORMATIONAL floated: NAME · SUBTITLE · LIST CAP and ESP BAR · SIDE · PAD
    await float('informational', 560, 10, 340); await wait(800); out.shot = await shot('b7-informational', await rectOf('.dev[data-id="informational"]'));
  } else if (scene === 'subtitle') {
    await mol(); await g.ev(`__LW.layout.reopen('informational'); await new Promise((r) => setTimeout(r, 400)); for (const w of ['NAME', 'SUBTITLE']) { const s = [...document.querySelectorAll('.lw-info-card .sw')].find((x) => x.textContent.trim() === w); if (s && s.getAttribute('aria-checked') !== 'true') s.click(); } return 1;`); await wait(1500);
    out.md = await g.ev(`return document.querySelector('.mir-info.lw-stage .mir-info-block').textContent;`);
    out.shot = await shot('b9-subtitle', await rectOf('.mir-info.lw-stage .mir-info-block'));
  }
  console.log(JSON.stringify({ scene, out, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
