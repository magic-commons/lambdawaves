// S4 probe: split a 61-row HISTORY repaint into the DOM build and the style + layout the browser owes for it.
const w = (n) => new Promise((r) => setTimeout(r, n));
const H = __LW.history, med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const card = document.querySelector('.dev[data-id="history"]');
card.classList.remove('closed'); if (card.classList.contains('folded')) card.querySelector('.dev-fold').click();
H.clear(); for (let i = 1; i <= 61; i++) { __LW.setStage(i / 100); H.flush(); }
await w(100);
const list = card.querySelector('.hist-list'), rows = H.entries();
const build = () => { list.innerHTML = ''; for (let j = rows.length - 1; j >= 0; j--) { const r = rows[j], b = document.createElement('button'); b.className = 'hist-row hist-' + r.state; b.type = 'button';
  const a = document.createElement('span'); a.className = 'hist-i'; a.textContent = String(r.i); b.appendChild(a); const l = document.createElement('span'); l.className = 'hist-lbl'; l.textContent = r.label; b.appendChild(l);
  b.title = 'land on this moment'; b.addEventListener('click', () => {}); list.appendChild(b); } };
/* reuse: the same 61 buttons, every text and class rewritten (a new row on top shifts every row down one place) */
const reuse = (shift) => { const bs = list.children; for (let p = 0; p < bs.length; p++) { const r = rows[(rows.length - 1 - p + shift) % rows.length], b = bs[p];
  const c = 'hist-row hist-' + r.state; if (b.className !== c) b.className = c; b.firstChild.textContent = String(r.i); b.lastChild.textContent = r.label + (shift ? ' ' : ''); } };
const buildMs = [], styleLayoutMs = [], reuseMs = [], reuseLayoutMs = [];
for (let k = 0; k < 15; k++) {
  void document.body.offsetHeight;
  let t = performance.now(); build(); buildMs.push(performance.now() - t);
  t = performance.now(); void list.getBoundingClientRect().top; void list.lastChild.getBoundingClientRect().top; styleLayoutMs.push(performance.now() - t);
  await w(20);
  void document.body.offsetHeight;
  t = performance.now(); reuse(k % 2 + 1); reuseMs.push(performance.now() - t);
  t = performance.now(); void list.lastChild.getBoundingClientRect().top; reuseLayoutMs.push(performance.now() - t);
  await w(20);
}
H.render();
return { rows: rows.length, buildMs: +med(buildMs).toFixed(3), styleLayoutAfterBuildMs: +med(styleLayoutMs).toFixed(3), reuseMs: +med(reuseMs).toFixed(3), layoutAfterReuseMs: +med(reuseLayoutMs).toFixed(3) };
