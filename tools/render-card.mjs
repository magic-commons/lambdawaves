/* render-card.mjs — iteration 025 C3's probe (a diagnostic, not a gate): the RENDER card's height and its clipped words.
 *   LW_PORT=9693 GD_PORT=5693 node tools/render-card.mjs <out.jpg> [setup-js]
 * On the 300-px racks of a 1600 × 1600 page, opens the RENDER card alone and prints its height, the DETERMINISTIC RENDER section's height,
 * its rows (controls per row, lines) and every label whose words are cut; a JPEG of the card goes to <out.jpg>. */
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const [OUT = '.tmp/render-card.jpg', SETUP = ''] = process.argv.slice(2), wait = (ms) => new Promise((r) => setTimeout(r, ms));
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9693}/lab/?starter=home`, { width: 1600, height: 1600 });
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1500);
  await g.ev(`__LW.run('window.render.open'); __LW.run('window.render.reset'); __LW.run('window.render.solo'); ${SETUP}; return 1;`); await wait(2000);
  const r = await g.ev(`const d = document.querySelector('.dev[data-id="render"]'), f = d.querySelector('.sr-film'); d.scrollIntoView({ block: 'start', behavior: 'instant' });
    const cut = [...d.querySelectorAll('.sr-label, .k-lbl, .sw-lbl, .trig-l, .seg-b, .mir-sel-t')].filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim());
    const rows = [...f.children].filter((c) => c.offsetParent).map((c) => (c.className || c.tagName).toString().split(' ').slice(0, 2).join('.') + ' h ' + Math.round(c.getBoundingClientRect().height));
    const b = d.getBoundingClientRect(); return { height: d.offsetHeight, film: f.offsetHeight, width: Math.round(f.clientWidth), cut, rows, box: [b.left, b.top, b.right, Math.min(b.bottom, 1600)].map(Math.round) };`);
  console.log(`card ${r.height} · film section ${r.film} · width ${r.width}${r.cut.length ? ' · labels cut: ' + r.cut.join(' | ') : ' · no label cut'}`);
  for (const x of r.rows) console.log('   ', x);
  writeFileSync('.tmp/render-card.png', Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys, json
from PIL import Image
b = json.loads(sys.argv[1]); im = Image.open('.tmp/render-card.png').convert('RGB')
im.crop((max(0, b[0] - 8), max(0, b[1] - 8), min(im.width, b[2] + 8), min(im.height, b[3] + 8))).save(sys.argv[2], quality=70)`, JSON.stringify(r.box), OUT]);
  console.log('errors', JSON.stringify((await g.errors()).errs).slice(0, 300));
} finally { await g.close(); }
