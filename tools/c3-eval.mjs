/* c3-eval.mjs — 0.5.0 C3's one-shot page probe (a diagnostic, not a gate): opens the lab and prints what one expression returns.
 *   LW_PORT=8883 GD_PORT=5353 node tools/c3-eval.mjs '<async body returning JSON>' [width height] */
import { open } from './gate/gatekit.mjs';
const [body, w = '1920', h = '1080'] = process.argv.slice(2);
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8883}/lab/?warn=0`, { width: +w, height: +h });
try {
  if (!(await g.waitFor('window.__LW?.ready', 300, 100)).ok) throw new Error('the lab never came up');
  console.log(JSON.stringify(await g.ev(body), null, 1));
} finally { await g.close(); }
