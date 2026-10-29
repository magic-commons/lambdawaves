import { open } from '../../../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT}/lab/?sw=0`, { width: 1280, height: 800, script: 300000 });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  for (const f of ['benzene-pi', 'water-esp', 'star-loop']) {
    const r = await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
      const ok = await __LW.projects.demo(${JSON.stringify(f)}); await new Promise((r) => setTimeout(r, 4000)); await __LW.settle();
      return { ok, dirty: __LW.projects.dirty, current: __LW.projects.current };`);
    console.log(f, JSON.stringify(r));
  }
} finally { if (g.quit) await g.quit(); else if (g.close) await g.close(); }
