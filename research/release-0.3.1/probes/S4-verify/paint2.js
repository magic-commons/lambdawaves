// S4 VERIFY item 2: the HISTORY list's own frame cost at a full ring, isolated from the field's render — a repaint asked with no
// state change (H.render() via the ring's rAF road is not reachable without an edit, so time render() itself and the frame after it)
const w = (n) => new Promise((r) => setTimeout(r, n)), raf = () => new Promise((r) => requestAnimationFrame(() => r()));
const H = __LW.history, med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const dev = document.querySelector('.dev[data-id="history"]'); dev.classList.remove('closed'); dev.hidden = false; if (dev.classList.contains('folded')) dev.querySelector('.dev-fold').click();
dev.scrollIntoView({ block: 'center', behavior: 'instant' });
__LW.pause(); H.flush(); await w(450); H.flush(); H.clear();
for (let i = 1; i <= 62; i++) { __LW.setStage(0.1 + i / 200); H.flush(); }
await w(800); await raf(); await raf();
const base = [], rend = [], rendSync = [];
for (let i = 0; i < 25; i++) { await raf(); const t0 = performance.now(); await raf(); base.push(performance.now() - t0); await w(20); }
for (let i = 0; i < 25; i++) { await raf(); let t = performance.now(); H.render(); rendSync.push(performance.now() - t); const t0 = performance.now(); await raf(); rend.push(performance.now() - t0); await w(20); }
/* closed card: the build alone */
dev.classList.add('closed'); const closed = []; for (let i = 0; i < 25; i++) { const t = performance.now(); H.render(); closed.push(performance.now() - t); await w(10); } dev.classList.remove('closed');
return { rows: H.entries().length, renderSyncMed: +med(rendSync).toFixed(3), renderSyncMax: +Math.max(...rendSync).toFixed(3), frameAfterRenderMed: +med(rend).toFixed(2), frameBaselineMed: +med(base).toFixed(2), closedRenderMed: +med(closed).toFixed(3) };
