/* midboot.mjs — lane M · M1 risk probe: navigate a headless Firefox tab AGAIN while the lab is still booting (right at
 * WebDriver's return from the first navigation = the `load` event, before boot() has its device), then ask whether
 * requestAnimationFrame still fires in the next page (a stalled refresh driver = a frozen instrument).
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/midboot.mjs <served path> [sessions]
 * Per session: open (boot 1), navigate at once (boot 2 — boot 1 was mid-request), wait ready, test rAF (2 s). */
import { open } from '../../../../tools/gate/gatekit.mjs';
import * as driver from '../../../../tools/gate/drv.mjs';
const PORT = process.env.LW_PORT || '8723';
const P = process.argv[2] || 'lab/';
const N = +(process.argv[3] || 3);
const url = `https://127.0.0.1:${PORT}/${P}?preset=1s%2B2pz&sw=0`;
let stalled = 0; const rows = [];
for (let n = 0; n < N; n++) {
  const g = await open(url, { width: 1200, height: 850, script: 30000 });
  try {
    await driver.setTO(g.s, { script: 30000, pageLoad: 30000 });
    const t0 = await g.ev('return +performance.now().toFixed(1)');
    await driver.go(g.s, url);
    await g.waitFor('window.__LW&&__LW.ready', 200, 100);
    const s = await g.ev(`const raf = await Promise.race([new Promise(r => requestAnimationFrame(() => r('raf'))), new Promise(r => setTimeout(() => r('timeout'), 2000))]);
      return { raf, frames: __LW.stats.frames, ok: __LW.field.ok, err: __LW.field.error, errs: __e.length };`);
    s.navAt = t0; rows.push(s); if (s.raf !== 'raf') stalled++;
    console.log(P, n, JSON.stringify(s));
  } catch (e) { stalled++; console.log(P, n, 'ERROR', e && e.message); }
  finally { await g.close(); }
}
console.log((stalled ? 'RED' : 'GREEN') + ' midboot ' + P + ': ' + stalled + ' of ' + N + ' sessions stalled');
process.exit(stalled ? 1 : 0);
