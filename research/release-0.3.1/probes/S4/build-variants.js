// S4 probe: the DOM build of 61 HISTORY rows, three ways (layout excluded; each followed by its own forced layout, timed apart).
const w = (n) => new Promise((r) => setTimeout(r, n));
const H = __LW.history, med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const card = document.querySelector('.dev[data-id="history"]');
card.classList.remove('closed'); if (card.classList.contains('folded')) card.querySelector('.dev-fold').click();
H.clear(); for (let i = 1; i <= 61; i++) { __LW.setStage(i / 100); H.flush(); }
await w(100);
const list = card.querySelector('.hist-list'), rows = H.entries();
const mk = (r) => { const b = document.createElement('button'); b.className = 'hist-row hist-' + r.state; b.type = 'button'; b.dataset.i = r.i;
  const a = document.createElement('span'); a.className = 'hist-i'; a.textContent = String(r.i); b.appendChild(a);
  const l = document.createElement('span'); l.className = 'hist-lbl'; l.textContent = r.label; b.appendChild(l); b.title = 'land on this moment'; return b; };
const V = {
  attachedEach: () => { list.innerHTML = ''; for (let j = rows.length - 1; j >= 0; j--) { const b = mk(rows[j]); b.addEventListener('click', () => {}); list.appendChild(b); } },
  fragment: () => { const f = document.createDocumentFragment(); for (let j = rows.length - 1; j >= 0; j--) f.appendChild(mk(rows[j])); list.replaceChildren(f); },
  html: () => { const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); let h = '';
    for (let j = rows.length - 1; j >= 0; j--) { const r = rows[j]; h += '<button type="button" class="hist-row hist-' + r.state + '" data-i="' + r.i + '" title="land on this moment"><span class="hist-i">' + r.i + '</span><span class="hist-lbl">' + esc(r.label) + '</span></button>'; }
    list.innerHTML = h; },
};
const out = {};
for (const [name, f] of Object.entries(V)) {
  const b = [], l = [];
  for (let k = 0; k < 15; k++) { void document.body.offsetHeight; let t = performance.now(); f(); b.push(performance.now() - t); t = performance.now(); void list.lastChild.getBoundingClientRect().top; l.push(performance.now() - t); await w(15); }
  out[name] = { buildMs: +med(b).toFixed(3), layoutMs: +med(l).toFixed(3) };
}
/* and closed (display: none): the build alone */
card.classList.add('closed');
for (const [name, f] of Object.entries(V)) { const b = []; for (let k = 0; k < 15; k++) { let t = performance.now(); f(); b.push(performance.now() - t); await w(5); } out[name].closedBuildMs = +med(b).toFixed(3); }
card.classList.remove('closed'); H.render();
return { rows: rows.length, out };
