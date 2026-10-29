import { open } from '../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const f = process.argv[2], write = process.argv.includes('--write');
const g = await open(`https://127.0.0.1:${process.env.LW_PORT}/lab/?sw=0`, { width: 1280, height: 800, script: 300000 });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const r = await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const ok = await __LW.projects.demo(${JSON.stringify(f)}); await new Promise((r) => setTimeout(r, 4000)); await __LW.settle();
    return { ok, dirty: __LW.projects.dirty, live: JSON.stringify(__LW.serialize()) };`);
  console.log(f, 'open', r.ok, 'dirty before', r.dirty);
  if (write) { const p = `lab/demos/${f}.lambdawaves.json`, d = JSON.parse(fs.readFileSync(p, 'utf8')), live = JSON.parse(r.live);
    delete live.presentation.quality; delete live.presentation.camera; d.data = live; fs.writeFileSync(p, JSON.stringify(d, null, 1) + '\n'); console.log('wrote', p); }
} finally { await g.close(); }
