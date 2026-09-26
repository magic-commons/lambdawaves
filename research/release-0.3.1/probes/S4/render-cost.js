// S4 probe: what does a HISTORY repaint cost with a full ring (61 rows)?  The flush budget (< 2 ms, S3) includes it, because
// onChange repaints the card synchronously.  Split: the flush itself, the repaint alone, and a forced layout alone after the
// same edit (the keep-in-view reads the list's box).
const w = (n) => new Promise((r) => setTimeout(r, n));
const H = __LW.history, med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const card = document.querySelector('.dev[data-id="history"]');
card.classList.remove('closed'); if (card.classList.contains('folded')) card.querySelector('.dev-fold').click();
H.clear(); for (let i = 1; i <= 61; i++) { __LW.setStage(i / 100); H.flush(); }
await w(100);
const flush = [], render = [], layout = [], renderClean = [];
for (let i = 0; i < 15; i++) {
  __LW.setStage(0.2 + i / 100); let t = performance.now(); H.flush(); flush.push(performance.now() - t);
  await w(20);
  __LW.setStage(0.5 + i / 100); t = performance.now(); void document.body.offsetHeight; layout.push(performance.now() - t);
  t = performance.now(); H.render(); renderClean.push(performance.now() - t);           // layout already clean: the DOM build + its own reflow
  __LW.setStage(0.7 + i / 100); t = performance.now(); H.render(); render.push(performance.now() - t);   // after an edit dirtied the style
  H.flush(); await w(20);
}
return { rows: H.entries().length, flushMs: +med(flush).toFixed(3), renderAfterEditMs: +med(render).toFixed(3), renderCleanMs: +med(renderClean).toFixed(3), forcedLayoutAfterEditMs: +med(layout).toFixed(3) };
