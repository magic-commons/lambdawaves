/* pager.js — THE RACK PAGER (iteration 017 R2; Josh: "avoid scrolling in rack windows (only main scroll should work, individual windows
 * should not be able to scroll"). A rack window that holds more than fits shows it in PAGES under this row instead of an inner scroller:
 * the kit's page turner (`stepper({ pager })`, BASINS' rack-card pager, ‹ ›) round the Picker's page dots (`.mm-dot`, skin.css; past sixteen
 * pages a count, the Picker's own rule). The window owns its list and its page; the pager only says where it is and asks for another.
 *   rackPager({ aria, cls, onPage(k) }) → { root, paint(at, n) }   — hidden while there is one page */
import { el, stepper } from './mir/kit.js';

export function rackPager({ aria = 'Page', cls = '', onPage }) {
  let at = 0, n = 0;
  const st = stepper({ pager: true, wrap: false, aria, items: [], cls: 'lw-pager' + (cls ? ' ' + cls : ''), onChange: (id) => onPage(+id) });
  const dots = el('span', 'mm-dots'); st.name.replaceChildren(dots); st.root.hidden = true;
  function paint(k, count) {
    st.root.hidden = count < 2; if (count < 2) { at = 0; n = count; return; }
    if (count !== n) st.setItems(Array.from({ length: count }, (_, i) => ({ id: String(i), label: (i + 1) + ' / ' + count })), String(k)); else st.set(String(k));
    at = k; n = count; st.name.replaceChildren(dots);
    if (n > 16) { dots.dataset.mode = 'count'; dots.textContent = (at + 1) + ' / ' + n; return; }
    if (dots.dataset.mode !== 'dots' || dots.childElementCount !== n) {
      dots.dataset.mode = 'dots'; dots.textContent = '';
      for (let i = 0; i < n; i++) { const d = el('button', 'mm-dot', dots); d.type = 'button'; d.setAttribute('aria-label', 'page ' + (i + 1)); d.addEventListener('click', () => onPage(i)); }
    }
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === at));
  }
  return { root: st.root, paint };
}
