// S4 probe: is the layout after a HISTORY repaint proportional to its rows, or the rack around it?  One label's text changed vs all
// 61, with and without `contain: layout` on the list (a probe-only inline style, removed after).
const w = (n) => new Promise((r) => setTimeout(r, n));
const H = __LW.history, med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const card = document.querySelector('.dev[data-id="history"]');
card.classList.remove('closed'); if (card.classList.contains('folded')) card.querySelector('.dev-fold').click();
H.clear(); for (let i = 1; i <= 61; i++) { __LW.setStage(i / 100); H.flush(); }
await w(100);
const list = card.querySelector('.hist-list');
const run = async () => {
  const one = [], all = [], note = [];
  for (let k = 0; k < 15; k++) {
    void document.body.offsetHeight;
    list.children[5].lastChild.textContent = 'EXPOSURE · WAVE' + (k % 2 ? ' ' : '');
    let t = performance.now(); void list.getBoundingClientRect().top; one.push(performance.now() - t);
    await w(10); void document.body.offsetHeight;
    for (const b of list.children) b.lastChild.textContent = b.lastChild.textContent.trim() + (k % 2 ? ' ' : '');
    t = performance.now(); void list.getBoundingClientRect().top; all.push(performance.now() - t);
    await w(10); void document.body.offsetHeight;
    const n = card.querySelector('.note') || card; n.dataset.x = k; n.style.letterSpacing = (k % 2) ? '0.01px' : '';   /* a comparison: any small change in the card */
    t = performance.now(); void list.getBoundingClientRect().top; note.push(performance.now() - t);
    n.style.letterSpacing = ''; await w(10);
  }
  return { oneRowMs: +med(one).toFixed(3), allRowsMs: +med(all).toFixed(3), noteChangeMs: +med(note).toFixed(3) };
};
const plain = await run();
list.style.contain = 'layout'; const contained = await run(); list.style.contain = '';
H.render();
return { rows: list.children.length, plain, containLayout: contained };
