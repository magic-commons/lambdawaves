/* lab/csb-search.js — iteration 014 A2 · A8 · THE MINIATURE PICKER: the CONTROL SURFACE's SEARCH.  Josh: "when typing into the search, it does an
 * auto-predict thing where if I type 'Nic...' and then it shows a row of, max, 6 floating thumbnails just above the CSB, which will use whatever the
 * current hue, view setting of the thumbnail it is" — and (A8) "Hitting search should actually show a typable pill that appears above the CSB as we
 * need the space".  The bar holds a SEARCH button; it (or Mod+K, the key row `csb.search`) opens a typable pill above the bar (below it when the bar
 * sits near the top; beside the card when the bar is docked or in its FREE window), the ≤ 6 tiles above the pill.  The matches are the Picker's
 * (picker.js suggest: the catalogue and every installed volume, read on the first keystroke, never at boot), each tile the Picker's own tile and its
 * press the Picker's road.  ↑ ↓ choose, Enter opens; Escape or a press elsewhere closes the pill and the tiles. */
import { el, chip } from './mir/kit.js';

export function createCsbSearch(app, { bar }) {
  const root = el('button', 'csb-search-b'); root.type = 'button'; chip(root, 'search', 'search the molecules'); root.title = 'Search the molecules';
  root.dataset.keyAction = 'csb.search';
  const pill = el('div', 'lw-menu glass csb-pill', document.body); pill.hidden = true;
  const input = el('input', 'csb-search-in', pill); input.type = 'search'; input.placeholder = 'search the molecules'; input.spellcheck = false; input.autocomplete = 'off';
  input.setAttribute('aria-label', 'search the molecules'); input.setAttribute('aria-autocomplete', 'list');
  const pane = el('div', 'lw-menu glass csb-suggest', document.body); pane.hidden = true; pane.setAttribute('role', 'listbox'); pane.setAttribute('aria-label', 'molecules');
  let tiles = [], at = -1, seq = 0;

  const closeTiles = () => { pane.hidden = true; pane.textContent = ''; tiles = []; at = -1; };
  function close() { seq++; closeTiles(); input.value = ''; pill.hidden = true; root.setAttribute('aria-expanded', 'false'); }
  function mark(i) { at = i; tiles.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-selected', String(k === i)); }); }
  /** the pill above the bar (below it near the top); beside the card when the bar is docked or FREE; the tiles stacked on the pill's far side */
  function place() {
    const b = bar(), r = b.getBoundingClientRect(), card = b.classList.contains('docked') || b.dataset.place === 'free';
    const pw = pill.offsetWidth, ph = pill.offsetHeight, gap = 8;
    let x, y, up;
    if (card) {
      x = r.right + gap + pw <= innerWidth - 8 ? r.right + gap : r.left - gap - pw;
      const s = root.getBoundingClientRect(); y = s.top + s.height / 2 - ph / 2; up = y - 200 > 8;
    } else { up = r.top - ph - gap - 100 >= 8; x = r.left + r.width / 2 - pw / 2; y = up ? r.top - ph - gap : r.bottom + gap; }
    x = Math.max(8, Math.min(innerWidth - pw - 8, x)); y = Math.max(8, Math.min(innerHeight - ph - 8, y));
    pill.style.left = Math.round(x) + 'px'; pill.style.top = Math.round(y) + 'px';
    if (pane.hidden) return;
    const w = pane.offsetWidth, h = pane.offsetHeight;
    pane.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, x + pw / 2 - w / 2))) + 'px';
    pane.style.top = Math.round(up ? Math.max(8, y - h - gap) : Math.min(innerHeight - h - 8, y + ph + gap)) + 'px';
  }
  function open() { pill.hidden = false; root.setAttribute('aria-expanded', 'true'); place(); input.focus(); }
  async function find() {
    const q = input.value, mine = ++seq, P = app.state.picker;
    if (!q.trim() || !P) { closeTiles(); return; }
    const got = await P.suggest(q, 6);
    if (mine !== seq || pill.hidden) return;                          // a later keystroke owns the pane, or the pill closed
    pane.textContent = ''; tiles = got.map((r) => { const t = P.suggestTile(pane, r); t.setAttribute('role', 'option'); t.addEventListener('click', close); return t; });
    if (!tiles.length) el('div', 'csb-none', pane, 'no molecule matches');
    pane.hidden = false; mark(tiles.length ? 0 : -1); place();
  }
  root.addEventListener('click', () => (pill.hidden ? open() : close()));
  root.setAttribute('aria-expanded', 'false');
  input.addEventListener('input', () => { requestAnimationFrame(find); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); root.focus({ preventScroll: true }); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (!tiles.length) return; e.preventDefault(); mark((at + (e.key === 'ArrowDown' ? 1 : -1) + tiles.length) % tiles.length); return; }
    if (e.key === 'Enter') { e.preventDefault(); const t = tiles[at >= 0 ? at : 0]; if (t) t.click(); }
  });
  document.addEventListener('pointerdown', (e) => { if (!pill.hidden && !pill.contains(e.target) && !pane.contains(e.target) && !root.contains(e.target)) close(); }, true);
  addEventListener('resize', () => { if (!pill.hidden) place(); }, { passive: true });
  return { root, input, pill, pane, open, close, get shown() { return !pill.hidden; } };
}
