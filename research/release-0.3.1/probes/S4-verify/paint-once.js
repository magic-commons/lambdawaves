// S4 VERIFY item 2: sixty flushes in one task repaint the HISTORY list ONCE (the ring's onChange asks for one frame)
const w = (n) => new Promise((r) => setTimeout(r, n)), raf = () => new Promise((r) => requestAnimationFrame(() => r()));
const H = __LW.history, list = document.querySelector('.dev[data-id="history"] .hist-list');
H.flush(); await w(450); H.flush(); H.clear(); await raf(); await raf();
let batches = 0, replaced = 0; const mo = new MutationObserver((recs) => { batches++; replaced += recs.filter((r) => r.type === 'childList').length; });
mo.observe(list, { childList: true });
for (let i = 1; i <= 60; i++) { __LW.setStage(0.2 + i / 200); H.flush(); }
const sameTask = list.children.length;
await raf(); await raf(); await w(50);
mo.disconnect();
return { rowsInRing: H.entries().length, listChildrenInSameTask: sameTask, listChildrenAfterFrame: list.children.length, mutationBatches: batches, childListRecords: replaced };
