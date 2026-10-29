import { open } from '../../../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT}/lab/?sw=0`, { width: 1280, height: 800, script: 300000 });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const r = await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const w = (ms) => new Promise((r) => setTimeout(r, ms)), P = __LW.projects, out = {};
    await P.demo('wave-dancer'); await w(2500); out.waveDancerDirty = P.dirty;
    /* a plain molecule project, no timeline: MOLECULES on H2O, saved, re-opened */
    await P.fresh(); await w(800); await __LW.verbs.run([{ verb: 'molecule', args: { id: 'H2O' } }], { who: 'probe' }); await w(5000); await __LW.settle();
    out.savedPlain = P.save('TEST/PLAIN H2O'); await w(500); out.plainDirtyAfterSave = P.dirty;
    await P.fresh(); await w(800); out.openedPlain = P.open('TEST/PLAIN H2O'); await w(5000); await __LW.settle(); out.plainDirtyAfterOpen = P.dirty;
    return out;`);
  console.log(JSON.stringify(r));
} finally { await g.close(); }
