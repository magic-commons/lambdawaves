/* MIR · shell/busy.js — THE LOADING MARK: the nine-square diamond turning through the app's palette (INTENT rule 6).
 *
 * Harvested from λWAVES: the mark is the wordmark's (shell/wordmark.js), its squares carry the palette wheel at 0°,
 * 40° … 320° as shell/accent.js `paintMarks` paints them, and it shows in three seats — a waiting card's overlay
 * (kit `device()` `.dev-loading`), beside the pointer while busy (`#busyMark`, +15 px, breathing .42 → 1 over 1.1 s),
 * and on the logo.  BASINS' copy is not taken: a 185 KB logo SVG cloned into seven hidden seats that never show, and
 * a busy loop that animates `fill`, which repaints on the main thread every frame.
 *
 * THE LAWS IT KEEPS
 *   · TRANSFORM AND OPACITY ONLY.  The eight outer squares TRAVEL ROUND THE RING (`translate`), so the palette turns
 *     through the mark; the hub and the whole mark breathe (`opacity`).  The compositor runs all of it; no colour, fill
 *     or layout property is ever animated, and no script runs per frame (CSS animations, not rAF).
 *   · STOPPED COSTS NOTHING.  stop() removes the one attribute the animations hang on: no animation, no writes.
 *   · REDUCED MOTION keeps the breath and drops the travel; OFF stills it (`<html data-motion>`, core/motion.js).
 *   · THE COLOURS ARE THE APP'S.  Read once at start() from the header mark (`#title .mark rect`, painted by
 *     accent.js), or passed as `colors`; λWAVES' first-paint colours otherwise.
 *   · THE POINTER SEAT follows the pointer through the one frame (core/frame.js coalesce), and listens only while busy.
 *
 * busyMark(host, { size, seat: 'inline' | 'card' | 'logo' | 'pointer', colors, label }) → { root, start(), stop(), paint(colors), running, destroy() }
 *   seat 'card' puts the mark in a transparent overlay over `host` (host must be positioned), with `label` under it.
 *   seat 'logo' is the mark busyLogo() swaps in for the logo's `.mark` while it runs.
 * busyCursor(on) — the pointer seat, counted: on/off pairs nest.
 * busyLogo(on, logo = '#title') — the logo seat, counted.
 * whileBusy(work, { cursor = true, logo = true }) → work's result; the mark shows until it settles. */
import { el, label as setLabel } from '../kit.js';
import { frame } from '../core/frame.js';

export const FIRST_PAINT = ['#5ee7d8', '#78e1f0', '#f5f7fa', '#d97ce8', '#2b3f7a', '#5ee7d8', '#ffbe5a', '#d97ce8', '#78e1f0'];

/** the palette as the header mark wears it now, in reading order, or null */
export function markColors(root = document) {
  const rects = root.querySelectorAll ? root.querySelectorAll('#title .mark rect') : [];
  if (rects.length < 9) return null;
  return [...rects].slice(0, 9).map((r) => r.getAttribute('fill') || '');
}

export function busyMark(host, { size, seat = 'inline', colors = null, label = 'CALCULATING' } = {}) {
  const root = el('span', 'mir-busy'); root.dataset.seat = seat; root.setAttribute('aria-hidden', 'true');
  if (size) root.style.setProperty('--busy-size', typeof size === 'number' ? size + 'px' : size);
  const g = el('span', 'mir-busy-g', root);
  const sq = []; for (let i = 0; i < 9; i++) sq.push(el('i', 'mir-busy-sq', g));
  let wrap = null, painted = null, running = false;
  if (seat === 'card') {
    wrap = el('div', 'mir-busy-overlay'); wrap.hidden = true; wrap.appendChild(root);
    if (label) setLabel(el('span', 'mir-busy-label', wrap), label);
    if (host) host.appendChild(wrap);
  } else if (seat === 'pointer' || seat === 'logo') {
    root.hidden = true;
    if (host) host.appendChild(root);
  } else if (host) host.appendChild(root);

  function paint(list) {
    const c = list || colors || markColors() || FIRST_PAINT;
    const key = c.join('|'); if (key === painted) return; painted = key;
    for (let i = 0; i < 9; i++) sq[i].style.setProperty('--busy-c', c[i % c.length]);
  }
  return {
    root, paint,
    get running() { return running; },
    start() {
      if (running) return; running = true;
      paint();
      if (wrap) wrap.hidden = false;
      root.hidden = false; root.setAttribute('data-on', '');
    },
    stop() {
      if (!running) return; running = false;
      root.removeAttribute('data-on');
      if (wrap) wrap.hidden = true;
      if (seat === 'pointer' || seat === 'logo') root.hidden = true;
    },
    destroy() { this.stop(); (wrap || root).remove(); }
  };
}

/* ── the pointer seat ──────────────────────────────────────────────────────────────────────────────────── */
let cursor = null, cursorN = 0, cursorLife = null, seen = false;
export function busyCursor(on) {
  if (on) {
    if (cursorN++ > 0) return;
    if (!cursor || !cursor.root.isConnected) cursor = busyMark(document.body, { seat: 'pointer' });
    cursorLife = new AbortController();
    window.addEventListener('pointermove', (e) => {
      const x = e.clientX, y = e.clientY;
      frame.coalesce('mir-busy-cursor', () => { cursor.root.style.setProperty('--busy-x', x + 'px'); cursor.root.style.setProperty('--busy-y', y + 'px'); if (!seen) { seen = true; cursor.start(); } });
    }, { passive: true, signal: cursorLife.signal });
    if (seen) cursor.start();                       // the place it was last seen is still in its style
  } else {
    if (cursorN === 0 || --cursorN > 0) return;
    if (cursorLife) { cursorLife.abort(); cursorLife = null; }
    if (cursor) cursor.stop();
  }
}

/* ── the logo seat ─────────────────────────────────────────────────────────────────────────────────────── */
const logos = new Map();
export function busyLogo(on, logo = '#title') {
  const node = typeof logo === 'string' ? document.querySelector(logo) : logo;
  if (!node) return;
  let rec = logos.get(node);
  if (!rec) {
    const m = node.querySelector('.mark'), r = m ? m.getBoundingClientRect() : null;
    const mark = busyMark(null, { seat: 'logo', size: r && r.width ? Math.round(r.width) : undefined });
    if (m) m.after(mark.root); else node.appendChild(mark.root);
    rec = { n: 0, mark: { start: () => { if (m) m.hidden = true; mark.start(); }, stop: () => { mark.stop(); if (m) m.hidden = false; } } };   // the mark swaps in at the same size: nothing moves
    logos.set(node, rec);
  }
  if (on) { if (rec.n++ === 0) rec.mark.start(); }
  else if (rec.n > 0 && --rec.n === 0) rec.mark.stop();
}

/** whileBusy(work) — the pointer and the logo show the mark until `work` (a promise, or a function) settles */
export async function whileBusy(work, { cursor: c = true, logo = true } = {}) {
  if (c) busyCursor(true); if (logo) busyLogo(true);
  try { return await (typeof work === 'function' ? work() : work); }
  finally { if (c) busyCursor(false); if (logo) busyLogo(false); }
}
