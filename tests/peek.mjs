/* tests/peek.mjs — open the lab headless, run an optional script, screenshot. A look, not a proof.
 *   LW_PORT=8701 GD_PORT=5201 node tests/peek.mjs [query] [js-after-boot] [out.png]
 */
import { open } from '../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8701';
const query = process.argv[2] || 'preset=1s%2B2pz';
const after = process.argv[3] || '';
const out = process.argv[4] || '/home/joshua-hosain/Documents/LAMBDAWAVES/.tmp/lab.png';
const g = await open(`https://127.0.0.1:${PORT}/lab/?${query}`, { width: +(process.env.W || 1400), height: +(process.env.H || 900) });
try {
  const r = await g.waitFor('window.__LW && __LW.ready', 300, 100);
  console.log('ready', JSON.stringify(r));
  if (after) console.log('after →', JSON.stringify(await g.ev(after)).slice(0, 1500));
  await g.ev('await __LW.settle(); await new Promise(r=>setTimeout(r,250)); return 1;');
  const m = await g.ev('return { errs: window.__e, meters: __LW.meters(), stats: __LW.stats, gpuErr: __LW.field.lastGpuError || null, shader: __LW.field.shaderMessages };');
  console.log(JSON.stringify(m, null, 1).slice(0, 3000));
  fs.mkdirSync('/home/joshua-hosain/Documents/LAMBDAWAVES/.tmp', { recursive: true });
  fs.writeFileSync(out, Buffer.from(await g.snap(), 'base64'));
  console.log('wrote', out);
} finally { await g.close(); }
