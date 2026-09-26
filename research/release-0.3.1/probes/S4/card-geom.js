// S4 probe: the HISTORY card's geometry — row pitch, list max height, card width, label widths, a relative time's width.
const w = (n) => new Promise((r) => setTimeout(r, n));
const H = __LW.history, card = document.querySelector('.dev[data-id="history"]');
card.classList.remove('closed'); if (card.classList.contains('folded')) card.querySelector('.dev-fold').click();
card.scrollIntoView({ block: 'center', behavior: 'instant' }); await w(100);
const list = card.querySelector('.hist-list');
const g0 = { card: card.getBoundingClientRect().height, list: list.clientHeight, rows: list.children.length };
const heights = {};
for (let i = 1; i <= 25; i++) { __LW.setStage(i / 100); H.flush(); if (i === 12 || i === 25) heights[i] = { card: card.getBoundingClientRect().height, list: list.clientHeight, rows: list.children.length }; }
await w(50);
const rs = [...list.children].map((b) => b.getBoundingClientRect());
const cs = getComputedStyle(list);
const lbl = list.querySelector('.hist-lbl'), row = list.querySelector('.hist-row');
const g1 = { card: card.getBoundingClientRect().height, cardW: card.getBoundingClientRect().width, list: list.clientHeight, scrollH: list.scrollHeight, rows: list.children.length,
  pitch: rs.length > 1 ? rs[1].top - rs[0].top : null, rowH: rs[0] && rs[0].height, maxH: cs.maxHeight, overflowY: cs.overflowY,
  rowW: row && row.getBoundingClientRect().width, lblW: lbl && lbl.getBoundingClientRect().width, iW: row && row.querySelector('.hist-i').getBoundingClientRect().width, heights };
/* the names rows carry, at the label's font, unconstrained */
const names = ['boot', 'new project', 'open · WAVE DANCER', 'EXPOSURE · WAVE', 'STAGE COLOUR · SETTINGS', 'KEPLER ORBIT · ORBIT', 'PRESET SUPERPOSITION · STATE', 'ELEMENT Z · SPECTRUM', 'LFO RATE · MODULATION', 'ADD LFO · MODULATION', 'ROUTE MACRO 1 · MODULATION', 'CURVE · LFO 1 · MODULATION', 'COLOUR · PALETTE', 'TRANSITION · STATE', 'STORE A · STATE'];
const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + getComputedStyle(lbl).font; document.body.appendChild(probe);
const widths = {}; for (const n of names) { probe.textContent = n; widths[n] = +probe.getBoundingClientRect().width.toFixed(1); }
probe.textContent = '59 m'; const timeW = +probe.getBoundingClientRect().width.toFixed(1); probe.remove();
return { g0, g1, widths, timeW, rack: [...document.querySelectorAll('.dev')].filter((d) => d.getBoundingClientRect().height > 0).slice(0, 40).map((d) => [d.dataset.id, Math.round(d.getBoundingClientRect().height), Math.round(d.getBoundingClientRect().width)]) };
