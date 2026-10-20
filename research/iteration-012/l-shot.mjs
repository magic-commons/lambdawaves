/* research/iteration-012/l-shot.mjs — one 1920×1080 photograph for an iteration 012 row (I1 · L1 · L2 · L3), through the gate's driver.
 *   LW_PORT=9501 GD_PORT=5301 node research/iteration-012/l-shot.mjs <name> '<query>' '<page js run before the photo>' [wait ms]
 * Writes research/iteration-012/l-shots/<name>.png. The page script is the body of an async function (await allowed). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { open } from '../../tools/gate/gatekit.mjs';

const [name, query = '', js = 'return 1;', wait = '600'] = process.argv.slice(2);
const SHOTS = new URL('./l-shots/', import.meta.url); mkdirSync(SHOTS, { recursive: true });
const url = `https://127.0.0.1:${process.env.LW_PORT || 9501}/lab/${query}`;
const g = await open(url, { width: 1920, height: 1080, script: 120000 });
try {
  await g.waitFor('window.__LW?.ready', 400, 100);
  const r = await g.ev(js);
  if (r && r.E) throw new Error('page threw: ' + r.E);
  await g.ev(`await new Promise((r) => setTimeout(r, ${Number(wait) || 0})); return 1;`);
  writeFileSync(new URL(`${name}.png`, SHOTS), Buffer.from(await g.snap(), 'base64'));
  console.log(JSON.stringify({ name, result: r }));
} finally { await g.close(); }
