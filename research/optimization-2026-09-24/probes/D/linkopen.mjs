/* linkopen.mjs — does a LINK open pay the LADDER solve (F1 says "every project open and link open")?
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/linkopen.mjs
 * On the instrumented copy: mint a link of the current state, open it 3×, read the wall time and whether restore()'s
 * `ri:ladder` mark (the instruments block) was reached; then the quick-save LOAD road (STATE's LOAD = restore()). */
import { open } from '../../../../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || '8721'}/research/optimization-2026-09-24/probes/D/lab-i/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  console.log(JSON.stringify(await g.ev(`await __LW.settle();
    const href = __LW.link.mint().href; const link = [];
    for (let i = 0; i < 3; i++) { performance.clearMarks(); const a = performance.now(); const r = __LW.link.open(href); link.push({ ms: +(performance.now() - a).toFixed(1), ok: r.ok, opened: r.opened, reachedInstruments: performance.getEntriesByName('ri:ladder').length > 0 }); await __LW.settle(); }
    const quick = []; [...document.querySelectorAll('.trig')].find((t) => t.textContent.trim() === 'SAVE').click();
    for (let i = 0; i < 2; i++) { performance.clearMarks(); const a = performance.now(); [...document.querySelectorAll('.trig')].find((t) => t.textContent.trim() === 'LOAD').click(); quick.push({ ms: +(performance.now() - a).toFixed(1), reachedInstruments: performance.getEntriesByName('ri:ladder').length > 0 }); await __LW.settle(); }
    return { hrefChars: href.length, link, quickLoad: quick };`)));
} finally { await g.close(); }
