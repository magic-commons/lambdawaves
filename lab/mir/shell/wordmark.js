/* MIR · shell/wordmark.js — the app's name in the corner, and the MARK beside it.
 *
 * The DOM is λWAVES' (index.html #title), which BASINS copied byte for byte:
 *   <div id="title"><span class="lam">λ</span><span class="word">WAVES</span><svg class="mark">…nine squares…</svg><span class="ms">…</span></div>
 * `.lam` is the optional lead glyph (λWAVES' λ; BASINS has none), `.word` the name set in LW Title (printable ASCII),
 * `.mark` the nine squares rotated 45° — the square Josh calls the MIR logo — and `.ms` a subtitle the shell keeps
 * hidden.  The squares' fills are painted by shell/accent.js from the palette wheel; the ones written here are
 * λWAVES' own first-paint colours, so the mark is never blank before an accent runs.
 *
 * The wordmark is also the MENU OPENER: shell/menubar.js takes it as `opener`.
 *
 * wordmark(parent, { lead, word, sub, id }) → the #title element */
const SVG = 'http://www.w3.org/2000/svg';
const FIRST_PAINT = ['#5ee7d8', '#78e1f0', '#f5f7fa', '#d97ce8', '#2b3f7a', '#5ee7d8', '#ffbe5a', '#d97ce8', '#78e1f0'];

/** the nine-square mark, as λWAVES and BASINS draw it (viewBox 0 0 10 10, squares 2.25 on a 2.25 pitch, rotated 45°) */
export function markSvg() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'mark'); svg.setAttribute('viewBox', '0 0 10 10'); svg.setAttribute('aria-hidden', 'true');
  const g = document.createElementNS(SVG, 'g'); g.setAttribute('transform', 'rotate(45 5 5)'); svg.appendChild(g);
  const at = [1.7, 3.95, 6.2];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const r = document.createElementNS(SVG, 'rect');
    r.setAttribute('x', String(at[col])); r.setAttribute('y', String(at[row]));
    r.setAttribute('width', '2.25'); r.setAttribute('height', '2.25'); r.setAttribute('fill', FIRST_PAINT[row * 3 + col]);
    g.appendChild(r);
  }
  return svg;
}

export function wordmark(parent, { lead = '', word = 'MIR', sub = '', id = 'title' } = {}) {
  const t = document.createElement('div'); t.id = id;
  if (lead) { const s = document.createElement('span'); s.className = 'lam'; s.textContent = lead; t.appendChild(s); }
  const w = document.createElement('span'); w.className = 'word'; w.textContent = word; t.appendChild(w);
  t.appendChild(markSvg());
  const ms = document.createElement('span'); ms.className = 'ms'; ms.textContent = sub; t.appendChild(ms);
  if (parent) parent.appendChild(t);
  return t;
}
