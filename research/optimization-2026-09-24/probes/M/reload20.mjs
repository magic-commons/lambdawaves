/* reload20.mjs — lane M · M1 gate: 20 navigations of ONE headless Firefox session through the GPU teardown.
 * The handoff records a whole-browser Firefox crash on reload during GPU teardown, and with gpu-boot the new page's
 * requestAdapter runs ~100 ms after navigation, near the previous page's pagehide dispose() (device.destroy()).
 * Cycles (in this order, because a navigation that lands right after a page's FIRST presents can leave the next page's
 * refresh driver stalled in headless Firefox — base and built alike, see navphase.mjs — and a stalled tab stays so):
 *   8 × "settled": navigate from a settled page; the new page must settle, be lit, sane digest, field.ok, no errors;
 *   8 × "ready":   navigate the moment the previous page is ready; the new page must reach ready with field.ok and
 *                  no errors (rAF liveness recorded, not judged);
 *   4 × "midboot": navigate twice in a row (the second lands at the first page's `load`, mid-request); same judgement.
 * A browser crash or a driver failure is a RED cycle.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/reload20.mjs [served path, default lab/] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import * as driver from '../../../../tools/gate/drv.mjs';
const PORT = process.env.LW_PORT || '8723';
const P = process.argv[2] || 'lab/';
const url = `https://127.0.0.1:${PORT}/${P}?preset=1s%2B2pz&sw=0`;
const g = await open(url, { width: 1200, height: 850, script: 30000 });
const plan = [...Array(8).fill('settled'), ...Array(8).fill('ready'), ...Array(4).fill('midboot')];
let bad = 0; const rows = [];
const RAF = `await Promise.race([new Promise(r => requestAnimationFrame(() => r(true))), new Promise(r => setTimeout(() => r(false), 1500))])`;
try {
  await driver.setTO(g.s, { script: 30000, pageLoad: 30000 });
  await g.waitFor('window.__LW&&__LW.ready', 200, 100);
  await g.ev('__LW.schedule(4); await __LW.settle(); await __LW.settle(); return 1');     // the first page settles before any navigation
  for (let c = 0; c < plan.length; c++) {
    const kind = plan[c];
    if (kind === 'midboot') await driver.go(g.s, url);
    await driver.go(g.s, url);
    const w = await g.waitFor('window.__LW&&__LW.ready', 200, 100);
    if (!w.ok) { bad++; rows.push({ c, kind, ready: false }); console.log('RED', c, kind, 'not ready'); continue; }
    if (kind !== 'settled') {
      const s = await g.ev(`return { ok: __LW.field.ok, error: __LW.field.error, errs: __e, raf: ${RAF} }`);
      rows.push({ c, kind, ...s }); const good = s.ok && !s.error && !s.errs.length; if (!good) bad++;
      console.log(good ? 'ok' : 'RED', c, kind, JSON.stringify({ ok: s.ok, error: s.error, raf: s.raf, errs: s.errs.length })); continue;
    }
    const s = await g.ev(`__LW.schedule(4); await __LW.settle(); const px = await __LW.readPixels(); const d = await __LW.fieldDigest();
      return { ok: __LW.field.ok, error: __LW.field.error, uncaptured: __LW.field.lastGpuError || null, errs: __e, lit: px.nonBlack, total: px.total, nan: d.nan, integral: d.integral, hash: d.hash };`);
    rows.push({ c, kind, ...s });
    const good = s.ok && !s.error && !s.uncaptured && !s.errs.length && s.lit > 100 && s.nan === 0 && s.integral > 0.9 && s.integral < 1.1;
    if (!good) bad++;
    console.log(good ? 'ok' : 'RED', c, kind, JSON.stringify(good ? { lit: s.lit, hash: s.hash, integral: s.integral } : s).slice(0, 300));
  }
} catch (e) { bad++; console.error('PROBE/BROWSER ERROR', e && e.message || e); }
finally { try { await Promise.race([g.close(), new Promise((_, r) => setTimeout(() => r(new Error('driver cleanup timed out')), 10000))]); } catch (e) { bad++; console.error('INFRASTRUCTURE:', e.message); } }
const stalled = rows.filter((r) => r.raf === false).length;
console.log((bad ? 'RED' : 'GREEN') + ' reload20 ' + P + ': ' + rows.length + ' navigations, ' + bad + ' bad; rAF stalled after ' + stalled + ' of ' + rows.filter((r) => 'raf' in r).length + ' ready/midboot navigations (recorded, not judged)');
process.exit(bad ? 1 : 0);
