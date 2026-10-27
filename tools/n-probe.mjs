/* n-probe.mjs — iteration 019 chain N's probes and pictures (a diagnostic, not a gate).
 *   LW_PORT=8819 GD_PORT=5819 node tools/n-probe.mjs <scene> [out.png]
 * Scenes: identity (N1: CURVES alone through the compiler vs 018's fixed pair — describe() and the filter's markup, byte for byte) ·
 * Prints what the scene measured; a picture scene writes a PNG (the driver's composite). */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'identity', OUT = process.argv[3] || `.tmp/n-${scene}.png`;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8819}/lab/?warn=0`, { width: 1600, height: 1000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  let info = null, shot = false;
  if (scene === 'identity') {
    info = await g.ev(`const N = __LW.nodes, f = N.filter, html = () => document.getElementById(f.id).outerHTML, w = (n) => new Promise((r) => setTimeout(r, n));
      const neutral = { ...f.describe(), html: html() };
      __LW.curves.preset('MASTER', 'S'); __LW.curves.preset('R', 'LIFT'); await w(300); f.flush();
      const chain = { ...f.describe(), html: html() };
      f.setChain([]); for (const ch of ['MASTER', 'R', 'G', 'B']) f.setTable(ch, ch === 'G' || ch === 'B' ? null : __LW.curves.table(ch)); f.flush();
      const pair = { ...f.describe(), html: html() };
      for (const ch of ['MASTER', 'R']) f.setTable(ch, null); f.setChain(N.compile().runs); f.flush();
      const back = { ...f.describe(), html: html() };
      __LW.curves.preset('MASTER', 'LINEAR'); __LW.curves.preset('R', 'LINEAR'); await w(300);
      const strip = (d) => ({ ...d, html: d.html.length + ' B' });
      return { neutral: strip(neutral), chain: strip(chain), pair: strip(pair), identical: chain.html === pair.html && JSON.stringify({ ...chain, html: 0 }) === JSON.stringify({ ...pair, html: 0 }),
        back: back.html === chain.html, after: f.describe().css, passes: N.passes() };`);
  }
  if (shot) writeFileSync(OUT, Buffer.from(await g.snap(), 'base64'));
  console.log(JSON.stringify({ scene, info, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
