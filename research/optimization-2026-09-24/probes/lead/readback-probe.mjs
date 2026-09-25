// Lead probe: does readPixels() work on the served tree? Boots the lab in headless Firefox, reports field.ok /
// field.error / __e, then calls readPixels twice and fieldDigest once. LW_PORT and GD_PORT from the environment.
import { open } from '../../../../tools/gate/gatekit.mjs';
const LW_PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${LW_PORT}/lab/?preset=1s%2B2pz&sw=0`, { headless: true, width: 1300, height: 850,
  prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  const r = await g.waitFor('window.__LW && __LW.ready', 15000, 50);
  console.log('ready', JSON.stringify(r));
  const info = await g.ev(`return { ok: __LW.field.ok, error: __LW.field.error || null, e: (window.__e || []).slice(0, 5),
    res: __LW.field.resolution, presents: __LW.stats.presents, adapter: (__LW.field.adapterInfo && (__LW.field.adapterInfo.vendor + '/' + __LW.field.adapterInfo.architecture)) || null,
    limits: __LW.field.limitsRequested || null };`);
  console.log('field', JSON.stringify(info));
  await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {} __LW.governor.on = false; __LW.quality.auto = false; __LW.quality.autoScale = 1; __LW.pause(); await __LW.settle(); await __LW.settle(); return true;`);
  for (let i = 0; i < 2; i++) {
    const p = await g.ev(`try { const t0 = performance.now(); const o = await __LW.readPixels(); return { hash: o && o.hash, w: o && o.w, h: o && o.h, ms: performance.now() - t0 }; } catch (e) { return { E: String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 300) }; }`);
    console.log('readPixels', i, JSON.stringify(p));
  }
  const d = await g.ev(`try { const o = await __LW.fieldDigest(); return { hash: o.hash, integral: o.integral }; } catch (e) { return { E: String(e && e.message || e) }; }`);
  console.log('fieldDigest', JSON.stringify(d));
  const e2 = await g.ev(`return { ok: __LW.field.ok, error: __LW.field.error || null, e: (window.__e || []).slice(0, 8) };`);
  console.log('after', JSON.stringify(e2));
} finally { await g.close(); }
