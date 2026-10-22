/* lab/csb-search.js — iteration 014 A2 · THE MINIATURE PICKER: the CONTROL SURFACE's search field.  Josh: "when typing into the search, it does an
 * auto-predict thing where if I type 'Nic...' and then it shows a row of, max, 6 floating thumbnails just above the CSB, which will use whatever the
 * current hue, view setting of the thumbnail it is."  The matches are the Picker's (picker.js suggest: the catalogue and every installed volume, read on
 * the first keystroke, never at boot), each tile the Picker's own tile and its press the Picker's road (MOLECULES on, the molecule or the volume's
 * record).  ↑ ↓ choose, Enter opens, Escape clears.  On a VERTICAL bar the field is its glyph, and a press unfolds it as a pill toward the screen's
 * centre (left half → right, right half → left). */
import { el, chip } from './mir/kit.js';

export function createCsbSearch(app, { bar }) {
  const root = el('span', 'csb-search');
  const glyph = el('button', 'csb-search-b', root); glyph.type = 'button'; chip(glyph, 'search', 'search the molecules'); glyph.title = 'Search the molecules';
  const input = el('input', 'csb-search-in', root); input.type = 'search'; input.placeholder = 'search'; input.spellcheck = false; input.autocomplete = 'off';
  input.setAttribute('aria-label', 'search the molecules'); input.setAttribute('aria-autocomplete', 'list');
  const pane = el('div', 'lw-menu glass csb-suggest', document.body); pane.hidden = true; pane.setAttribute('role', 'listbox'); pane.setAttribute('aria-label', 'molecules');
  let rows = [], tiles = [], at = -1, seq = 0;

  const close = () => { pane.hidden = true; pane.textContent = ''; rows = []; tiles = []; at = -1; };
  const clear = () => { input.value = ''; close(); if (bar().dataset.orient === 'vertical') root.classList.remove('open'); };
  function mark(i) { at = i; tiles.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-selected', String(k === i)); }); }
  /** the pane sits just above the bar (below it when the bar is near the top), centred on the field and kept on the screen */
  function place() {
    const f = input.getBoundingClientRect(), b = bar().getBoundingClientRect(), w = pane.offsetWidth, h = pane.offsetHeight;
    const up = b.top - h - 8 >= 8;
    pane.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, f.left + f.width / 2 - w / 2))) + 'px';
    pane.style.top = Math.round(up ? b.top - h - 8 : Math.min(innerHeight - h - 8, b.bottom + 8)) + 'px';
  }
  async function find() {
    const q = input.value, mine = ++seq, P = app.state.picker;
    if (!q.trim() || !P) { close(); return; }
    const got = await P.suggest(q, 6);
    if (mine !== seq) return;                                         // a later keystroke owns the pane
    pane.textContent = ''; rows = got; tiles = got.map((r) => { const t = P.suggestTile(pane, r); t.setAttribute('role', 'option'); t.addEventListener('click', clear); return t; });
    if (!tiles.length) { el('div', 'csb-none', pane, 'no molecule matches'); }
    pane.hidden = false; mark(tiles.length ? 0 : -1); place();
  }
  input.addEventListener('input', () => { requestAnimationFrame(find); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); clear(); input.blur(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (!tiles.length) return; e.preventDefault(); mark((at + (e.key === 'ArrowDown' ? 1 : -1) + tiles.length) % tiles.length); return; }
    if (e.key === 'Enter') { e.preventDefault(); const t = tiles[at >= 0 ? at : 0]; if (t) t.click(); }
  });
  /* a VERTICAL bar shows the glyph; its press unfolds the field toward the screen's centre */
  glyph.addEventListener('click', () => {
    const r = root.getBoundingClientRect(); root.dataset.dir = r.left + r.width / 2 < innerWidth / 2 ? 'right' : 'left';
    root.classList.add('open'); input.focus();
  });
  input.addEventListener('blur', () => { if (!input.value && bar().dataset.orient === 'vertical') root.classList.remove('open'); });
  document.addEventListener('pointerdown', (e) => { if (!pane.hidden && !pane.contains(e.target) && !root.contains(e.target)) close(); }, true);
  addEventListener('resize', () => { if (!pane.hidden) place(); }, { passive: true });
  return { root, input, pane, clear, get shown() { return !pane.hidden; } };
}
