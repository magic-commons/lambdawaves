/* window-chrome.js — TWO PASSES OVER EVERY WINDOW, run once at boot after the racks are built: LEAN (2026-09-18: the Aa
 * button that drops a window's notes and readouts, remembered per window in this browser) and the KIND taxonomy (wave 26:
 * data-kind on every card, ⧉ COPY on the INFO panels, CONTROL and OTHER folded).  A seam out of rack.js boot()
 * (optimization 2026-09-24 · N7 seam 9, AUDIT-E §6); three closure edges, handed in: `KIND` (the table stays with
 * the windows it names), `layout` (copyDigest) and `present` (a lean toggle repaints the stage: schedule(PRESENT)).
 * installWindowChrome() runs where the two passes stood. */
import { el } from './mir/kit.js';

export function installWindowChrome({ KIND, layout, present }) {
  /* LEAN (2026-09-18, the commissioner: "hide all of those visible texts and info").  Any window that carries model
     notes or readouts gets one header button, Aa: pressed, the window keeps its controls, ladders and plots and drops
     its paragraphs and readout tiles; the header's status line stays, so the window still says what it is doing.
     Remembered per window in this browser.  A presentation choice only — nothing is computed differently. */
  const LEAN_KEY = 'lw.lean.v1';
  let leanSet = new Set(), firstLean = true; try { const saved = localStorage.getItem(LEAN_KEY); firstLean = saved === null; leanSet = new Set(JSON.parse(saved || '[]')); } catch (e) { leanSet = new Set(); }
  const setLean = (d, on) => { d.classList.toggle('lean', on); const b = d.querySelector('.dev-lean'); if (b) { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); }
    if (on) leanSet.add(d.dataset.id); else leanSet.delete(d.dataset.id); try { localStorage.setItem(LEAN_KEY, JSON.stringify([...leanSet])); } catch (e) { /* private mode: the choice lasts the session */ }
    present(); };
  for (const d of document.querySelectorAll('.dev')) {
    if (!d.querySelector('.dev-body .note, .dev-body .ro')) continue;
    const util = d.querySelector('.dev-util'); if (!util) continue;
    const b = el('button', 'dev-lean', null, 'Aa'); b.type = 'button'; b.title = 'Hide or show this window’s notes and readouts — the controls, ladders and plots stay';
    b.setAttribute('aria-label', 'hide or show notes and readouts'); b.setAttribute('aria-pressed', 'false'); util.insertBefore(b, util.firstChild);
    b.addEventListener('click', (e) => { e.stopPropagation(); setLean(d, !d.classList.contains('lean')); });
    if (firstLean || leanSet.has(d.dataset.id)) setLean(d, true);
  }
  /* the taxonomy on every card: INFO panels get ⧉ COPY; CONTROL and OTHER start folded */
  for (const d of document.querySelectorAll('.dev')) {
    const kind = KIND[d.dataset.id] || 'other'; d.dataset.kind = kind;
    if (kind === 'info' || d.dataset.id === 'field') { const util = d.querySelector('.dev-util'); const b = el('button', 'dev-copy', util, '⧉'); b.type = 'button'; b.title = 'Copy this panel as text'; b.setAttribute('aria-label', 'copy this panel as text'); util.insertBefore(b, util.querySelector('.dev-fold')); b.addEventListener('click', (e) => { e.stopPropagation(); layout.copyDigest(d.dataset.id); }); }
    if ((kind === 'control' || kind === 'other') && !d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
  }
}
