/* lab/widget-text.js — TEXT, straight words on the stage (037 W6; Josh, BRIEF.md WIDGETS: "notebook as floating informational text (no background,
 * no fancy window CSS, just straight up text on the stage)"): the notebook's text, live (opts.source 'notebook', the default), or the widget's own
 * words (WRITE, through the kit's dialog), rendered by the notebook's own road (the kit's renderNotebook: marked, KaTeX, the sanitiser) in the
 * words' serif and ink — no plate, no shadow; SIZE S · M · L is the notebook's body, heading and title (14 · 22 · 34 px), INFORMATIONAL's scale. */
import { el, seg, trig } from './mir/kit.js'; import { openDialog } from './mir/shell/dialog.js'; import { renderNotebook } from './mir/shell/notebook-render.js'; import { motionPolicy } from './mir/core/motion.js';
import { registerKind } from './widgets.js';
const PX = { s: 14, m: 22, l: 34 };
registerKind({ kind: 'text', label: 'TEXT', glyph: 'words', hint: 'Words on the stage: the notebook’s or your own', size: { w: 0.3, h: 0.16 }, opts: { source: 'notebook', size: 'm' },
  mount(host, api) {
    const view = el('div', 'lw-w-text', host), nbEl = document.getElementById('notebook'); let shown = null;
    const words = () => { const o = api.opts(), nb = api.app.sh.layout && api.app.sh.layout.notebook; return o.source === 'own' ? String(o.text || '') : nb ? nb.text : ''; };
    /* 038 S4: a block that ARRIVES fades in from a soft blur (220 ms) — a new paragraph as it is typed, every block of new words (WRITE, NOTEBOOK); never the
       first paint, never a block typed in place, a size or a theme; nothing under reduced motion.  The words are rendered only when they changed (a size is the
       box's font size alone), so a forced tick never rebuilds a block mid-fade */
    const paint = (arrive) => { view.style.fontSize = (PX[api.opts().size] || PX.m) + 'px'; const md = words(); if (md === shown) return;
      const was = shown === null ? null : [...view.children].map((n) => n.outerHTML); shown = md; view.innerHTML = md.trim() ? renderNotebook(md) : '';
      for (const h of view.querySelectorAll('h1, h2')) h.classList.toggle('lw-uiface', /[^\x20-\x7E]/.test(h.textContent));   // 039 X12 · A HEADING WEARS ONE FACE: LW Title is ASCII alone
      if (was && motionPolicy() === 'full') [...view.children].forEach((n, i) => { if ((arrive || i >= was.length) && !was.includes(n.outerHTML)) n.animate([{ opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'none' }], { duration: 220, easing: 'ease-out' }); }); };
    const heard = () => paint(false);   // the notebook's typing draws no frame of the rack's: the widget hears it (capture: a scripted input does not bubble)
    if (nbEl) nbEl.addEventListener('input', heard, true);
    return { tick: () => paint(false), set: () => paint(true), destroy: () => { if (nbEl) nbEl.removeEventListener('input', heard, true); } };
  },
  controls(bar, api) {
    const size = seg({ aria: 'Text size', value: api.opts().size || 'm', onChange: (v) => api.set({ size: v }, 'WIDGET TEXT SIZE'),
      options: [{ id: 's', label: 'S', title: 'The notebook’s body size' }, { id: 'm', label: 'M', title: 'Its heading size' }, { id: 'l', label: 'L', title: 'Its title size' }] });
    const write = trig({ label: 'WRITE', title: 'Write this widget’s own words', onFire: () => {
      const ta = el('textarea', 'lw-w-ask'); ta.value = api.opts().source === 'own' ? String(api.opts().text || '') : ''; ta.rows = 6;
      const d = openDialog({ title: 'TEXT', body: ta, actions: [{ label: 'CANCEL', value: null }, { label: 'SET', kind: 'primary', run: () => ta.value }] });
      setTimeout(() => ta.focus(), 60);
      d.result.then((v) => { if (typeof v === 'string') api.set({ source: 'own', text: v }, 'WIDGET TEXT'); });
    } });
    const book = trig({ label: 'NOTEBOOK', title: 'Show the notebook’s text, as it is typed', onFire: () => api.set({ source: 'notebook' }, 'WIDGET TEXT') });
    bar.append(size.root, write.root, book.root);
  } });
