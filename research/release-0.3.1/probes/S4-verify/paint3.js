// S4 VERIFY item 2 (context): the frame after a DOM change in this headless Firefox — a status text, the list at 11 rows (the old
// card's size, built the same way), the list at 61 rows (render()) — so the list's own share of the frame is visible
const w = (n) => new Promise((r) => setTimeout(r, n)), raf = () => new Promise((r) => requestAnimationFrame(() => r()));
const H = __LW.history, med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const dev = document.querySelector('.dev[data-id="history"]'); dev.classList.remove('closed'); dev.hidden = false; if (dev.classList.contains('folded')) dev.querySelector('.dev-fold').click();
dev.scrollIntoView({ block: 'center', behavior: 'instant' });
__LW.pause(); H.flush(); await w(450); H.flush(); H.clear();
for (let i = 1; i <= 62; i++) { __LW.setStage(0.1 + i / 200); H.flush(); }
await w(800); await raf(); await raf();
const list = dev.querySelector('.hist-list'), stat = dev.querySelector('.dev-stat');
const full = list.innerHTML, eleven = [...list.children].slice(0, 11).map((b) => b.outerHTML).join('');
const measure = async (fn) => { const f = [], s = []; for (let i = 0; i < 25; i++) { await raf(); await w(5); await raf(); let t = performance.now(); fn(i); s.push(performance.now() - t); const t0 = performance.now(); await raf(); f.push(performance.now() - t0); await w(20); } return { sync: +med(s).toFixed(3), frame: +med(f).toFixed(2) }; };
const out = { rows: H.entries().length };
out.nothing = await measure(() => {});
out.status = await measure((i) => { stat.textContent = '61 kept  ·  on ' + (i % 2 ? 61 : 60); });
out.html11 = await measure(() => { list.innerHTML = eleven; });
out.html61 = await measure(() => { list.innerHTML = full; });
out.render61 = await measure(() => H.render());
H.render();
return out;
