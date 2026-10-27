/* e-shots.mjs — iteration 018 chain E's pictures (a diagnostic, not a gate).
 *   LW_PORT=9773 GD_PORT=5773 node tools/e-shots.mjs <out-stem> [setup-js] [crop-selector]
 * Boots the lab (?starter=home), runs the setup body (async, `wait(ms)` in scope), snaps the page, and writes
 * <out-stem>.jpg cropped to the box of every node the selector matches (+ 24 px; the whole page without one). Prints what the setup returned. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const [stem, setup = 'return 1;', crop = ''] = process.argv.slice(2);
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9773}/lab/?starter=home`, { width: 1600, height: 1000 });
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await new Promise((r) => setTimeout(r, 1500));
  console.log(JSON.stringify(await g.ev(`const wait = (ms) => new Promise((r) => setTimeout(r, ms)); return (async () => { ${setup} })();`)));
  await new Promise((r) => setTimeout(r, 700));
  const box = crop ? await g.ev(`const rs = [...document.querySelectorAll(${JSON.stringify(crop)})].map((n) => n.getBoundingClientRect()).filter((r) => r.width); return rs.length ? [Math.min(...rs.map((r) => r.left)), Math.min(...rs.map((r) => r.top)), Math.max(...rs.map((r) => r.right)), Math.max(...rs.map((r) => r.bottom))].map(Math.round) : null;`) : null;
  mkdirSync('.tmp', { recursive: true }); writeFileSync('.tmp/e-shot.png', Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys, json; from PIL import Image
im = Image.open('.tmp/e-shot.png').convert('RGB'); b = json.loads(sys.argv[2])
if b: im = im.crop((max(0, b[0] - 24), max(0, b[1] - 24), min(im.width, b[2] + 24), min(im.height, b[3] + 24)))
im.save(sys.argv[1], quality=80)`, stem + '.jpg', JSON.stringify(box)]);
} finally { await g.close(); }
