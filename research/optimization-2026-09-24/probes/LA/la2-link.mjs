/* la2-link.mjs — LA2's gate (probes/B/hitches.mjs §1 on the LA server): play 5 s with the shipped, unrouted modulation
 * rack and its window closed; count the modulation window's forced paints (the refused LINK retry used to repaint it
 * once a second), the same with the UI hidden, and check that the retry itself still runs (a route made mid-play joins).
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la2-link.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = {};
const H = `document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', key: 'h', bubbles: true }));`;
try {
  const play5 = (label) => `__LW.pause(); await __LW.settle(); const p0 = __LW.mod.view.performance(), r0 = __LW.mod.host.diagnostics ? __LW.mod.host.diagnostics() : null;
    __LW.play(); await new Promise((r) => setTimeout(r, 5000)); const p1 = __LW.mod.view.performance(); __LW.pause(); await __LW.settle();
    return { scene: '${label}', open: __LW.mod.expanded, modPlaying: __LW.mod.playing, sources: __LW.mod.model.sourceList().length,
      forcedPaints: p1.paints - p0.paints, paintCalls: p1.calls - p0.calls, paintMs: +(p1.ms - p0.ms).toFixed(2) };`;
  R.shown = await g.ev(play5('UI shown, window closed'));
  await g.ev(`${H} await __LW.settle(); return __LW.uiHidden;`);
  R.hidden = await g.ev(play5('UI hidden, window closed'));
  await g.ev(`${H} await __LW.settle(); return __LW.uiHidden;`);
  /* the retry law stays: route the LFO to EXPOSURE while playing — the modulation clock must join within ~1 s */
  R.retry = await g.ev(`__LW.pause(); await __LW.settle(); __LW.play(); await new Promise((r) => setTimeout(r, 1200));
    const before = __LW.mod.playing; const src = __LW.mod.model.sourceList()[0], mac = __LW.mod.model.macroList()[0];
    __LW.mod.bind(mac.id, src.id); __LW.mod.route(mac.id, 'material.exposure', 0.2, 0.8); const t0 = performance.now();
    let joinedMs = null; while (performance.now() - t0 < 3000) { if (__LW.mod.playing) { joinedMs = +(performance.now() - t0).toFixed(0); break; } await new Promise((r) => setTimeout(r, 50)); }
    __LW.pause(); await __LW.settle(); __LW.mod.reset(); return { playingBeforeRoute: before, joinedMs };`);
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
