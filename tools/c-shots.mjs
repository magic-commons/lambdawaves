/* c-shots.mjs — iteration 018 chain C's pictures (a diagnostic, not a gate).
 *   LW_PORT=8783 GD_PORT=5783 node tools/c-shots.mjs <scene> [tag]
 * Scenes: spectrum (SPECTRUM floated with 1s+2pz, the 140 table open; the card and its ladder) · state (the STATE card, while it exists) ·
 * states (MOLECULES floated, H₂O under MIX, STATES shown) · rack (the first-run racks) · read '<body>' (one look at the page).
 * Small JPEGs into research/iteration-018/C-shots/. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'spectrum', tag = process.argv[3] || '', DIR = 'research/iteration-018/C-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8783}/lab/?starter=home`, { width: 1500, height: 950 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const float = (id, x, y, w) => g.ev(`__LW.layout.reopen(${JSON.stringify(id)}); __LW.layout.raise(${JSON.stringify(id)}); __LW.layout.popOut(${JSON.stringify(id)}, { x: ${x}, y: ${y}, w: ${w} });
  await new Promise((r) => setTimeout(r, 300)); const d = document.querySelector('.dev[data-id=${JSON.stringify(id)}]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); return 1;`);
const rectOf = (sel) => g.ev(`const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
async function shot(name, box) {
  const png = `.tmp/c-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1000: im = im.resize((1000, round(im.height * 1000 / im.width)))
im.save(sys.argv[2], quality=72)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.max(0, v + (i < 2 ? -8 : 8))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify(await g.ev('return (window.__e || []).slice(0, 5);')) + JSON.stringify((await g.errors()).errs));
  if (scene === 'read') out.r = await g.ev(process.argv[3]);
  else if (scene === 'spectrum') {
    await g.ev(`const t = document.getElementById('transport'); if (t) t.style.visibility = 'hidden'; __LW.loadPreset('1s+2pz'); __LW.pause(); return 1;`);
    await float('spectrum', 560, 10, 340); await wait(800);
    await g.ev(`const p = document.querySelector('.dev[data-id="spectrum"] .picker'); if (p && p.hidden) [...document.querySelectorAll('.dev[data-id="spectrum"] .sp-head .trig')].find((b) => /MODE/.test(b.textContent)).click();
      for (const n of document.querySelectorAll('.dev[data-id="spectrum"] .picker .pk-n')) if (+n.dataset.n >= 3 && !n.classList.contains('folded')) n.querySelector('.pk-nl').click(); return 1;`); await wait(600);
    out.card = await shot('c1-spectrum' + tag, await rectOf('.dev[data-id="spectrum"]'));
    out.ladder = await shot('c2-ladder' + tag, await rectOf('.dev[data-id="spectrum"] .ladder'));
  } else if (scene === 'state') {
    await float('state', 560, 10, 340); await wait(800); out.card = await shot('c1-state' + tag, await rectOf('.dev[data-id="state"]'));
  } else if (scene === 'states') {
    await g.ev(`const t = document.getElementById('transport'); if (t) t.style.visibility = 'hidden'; return 1;`);
    await g.ev(`__LW.chem.setOn(true); return 1;`); await g.waitFor('window.__LW?.chem?.on && !!__LW.chem.row()', 300, 100);
    await float('chem', 560, 10, 360); await wait(3000);
    out.before = await g.ev(process.argv[4] || 'return 1;');
    await wait(2500);
    out.card = await shot('c3-states' + tag, await rectOf('.dev[data-id="chem"]'));
    out.after = await g.ev(process.argv[5] || 'return 1;');
  } else if (scene === 'rack') {
    await wait(1500); out.L = await g.ev(`return [...document.querySelectorAll('#rackL .dev:not(.closed)')].map((d) => d.dataset.id);`);
    out.R = await g.ev(`return [...document.querySelectorAll('#rack .dev:not(.closed)')].map((d) => d.dataset.id);`);
    out.shot = await shot('c4-racks' + tag, null);
  }
  console.log(JSON.stringify({ scene, out, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
