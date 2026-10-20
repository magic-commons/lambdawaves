/* research/iteration-013/shot.mjs — one photograph for an iteration 013 row, through the gate's driver (012's l-shot, JPEG out).
 *   LW_PORT=9611 GD_PORT=5611 node research/iteration-013/shot.mjs <dir>/<name> '<query>' '<page js run before the photo>' [wait ms] [WxH]
 * Writes research/iteration-013/<dir>/<name>.jpg (PIL converts). The page script is the body of an async function (await allowed). */
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from '../../tools/gate/gatekit.mjs';

const [name, query = '', js = 'return 1;', wait = '600', size = '1920x1080'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const png = new URL(`./${name}.png`, import.meta.url); mkdirSync(new URL('.', png), { recursive: true });
const url = `https://127.0.0.1:${process.env.LW_PORT || 9611}/lab/${query}`;
const g = await open(url, { width: W, height: H, script: 120000 });
try {
  await g.waitFor(process.env.SHOT_READY || 'window.__LW?.ready', 400, 100);
  const r = await g.ev(js);
  if (r && r.E) throw new Error('page threw: ' + r.E);
  await g.ev(`await new Promise((r) => setTimeout(r, ${Number(wait) || 0})); return 1;`);
  writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  const p = png.pathname, j = p.replace(/\.png$/, '.jpg');
  execFileSync('python3', ['-I', '-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], quality=72)', p, j]); unlinkSync(p);
  console.log(JSON.stringify({ name, result: r }));
} finally { await g.close(); }
