/* shell/rack-scrollbar.js — the rack's scrollbar, seated at the card column (BASINS app/rack-scrollbars.js, harvested).
 *
 * Josh (BASINS, ≤ 10-01): "scrollers seems to be way too far out from the rack."  A rack keeps its native scrolling and
 * its 48-px shadow gutter (paint room for the cards' shadows, never a hit-test column), so the native scrollbar sits at
 * the far edge of that gutter, away from the cards.  This puts a transparent bar BESIDE THE CARDS instead: a 12-px
 * track at the gutter's inner edge with a 2-px accent thumb (1.5.0 wave 19, Josh: "a simple 2PX scroll bar is visible
 * only"; the track paints nothing and is the touch target), which a hand drags, a wheel turns and the keys step.
 * The native bar is switched off while it runs (`body.rack-scrollbars`, rack.css), so there is one bar.
 * createRack({ scrollbar: true }).
 *
 * THE LAWS IT KEEPS
 *   1. BASINS' SEAT, BASINS' NUMBERS.  Left rack: the track's left edge is the rack's right − gutter − 8; right rack: the
 *      rack's left + gutter − 4.  Top 8 px into the rack, bottom 8 px above it (and above the viewport).  The thumb is the
 *      visible share of the track, never shorter than 32 px.  ↑ ↓ step 40 px; PageUp / PageDown 90 % of the rack;
 *      Home / End the ends; a wheel line is 16 px, a wheel page the rack's height.  A press on the track (not the thumb)
 *      jumps the thumb's middle to the pointer, and the same press drags on.
 *   2. GONE WHEN THERE IS NOTHING TO SCROLL OR NOTHING TO SEE: no gutter (a narrow screen, the phone), no overflow, no
 *      height, H (`body.ui-hidden`), a hidden rack (once its slide has ended: `visibility: hidden`), or a seat off screen.
 *   3. NO POLLER, ONE FRAME.  It paints only when something says so — the rack scrolls or resizes, a card comes or goes
 *      or folds, the body's classes change, the window resizes, or the page's one dock span (rack.span(), which follows
 *      a rack's slide frame by frame) moves — and every paint goes through core/frame.js, coalesced to one per frame.
 *      Idle is zero work.
 *   4. ONE GESTURE, ONE WRITER: the drag is core/pointer.js `drag` (the pointer that pressed owns it; pointercancel, a
 *      lost capture, a blur and Escape end it; the scroll stays where the hand left it, as BASINS').
 *   5. The class names are BASINS' (`.rack-scrollbar`, `.rack-scrollbar-thumb`, `.drag`, `body.rack-scrollbars`), so
 *      BASINS' own sheet keeps matching while it adopts.
 *
 * createRackScrollbars({ host, racks, span, view }) → { paint(), tracks, destroy() }.  The pure seat is exported.
 *
 * THE SCROLL PILL (1.5.0-alpha.25, from λWAVES 014 A6; Josh: "When scrolling on the rack window, let a little colored pill appear
 * directly adjacent to the window title bar … the name of the window in a strong, bold, sans serif font … No shadow just solid pill
 * … When the scroll bar disappears, the pills disappear too … material animated … incredibly cheap … autodetect white or black text").
 * createRackPills({ host, racks, view }) → { destroy() }, made by createRack for every rack, whichever scrollbar it runs:
 *   · a scroll adds `scrolling` to the rack (and to its seated track, which lifts the thumb) and arms ONE timeout, re-armed by each
 *     scroll; 900 ms after the last scroll the class goes.  No poller, no frame job.
 *   · the first scroll of a burst seats the pills — one `.rack-pill` per docked window, its text the head's own (already labelled)
 *     name, at the title bar's outer edge (left rack: right of the card; right rack: left), measured ONCE; while the burst lasts a
 *     scroll writes one transform on the layer, never a layout.  The reveal is a clip-path mask (rack.css), 180 ms each way.
 *   · the ink is read once a burst from the pill's own fill (light ink on a dark accent, dark on a light one: `data-pill-ink`).
 *   · THE SEAT (015 H1, replacing 014 A11's eyebrow; Josh 10-23: "Do not let the bubble touch or overlap the rack window"): the pill
 *     floats OUTSIDE the window, over the stage, at the title bar's height — `PILL.gap` px clear of the card's inner edge (left rack:
 *     right of the card; right rack: left of it), or of the rack's seated scrollbar thumb where that lies further out — the name
 *     whole (the stage has the room).  Its mask opens from the window's side.  Only a pill: no tail (1.5.0-alpha.28, rack.css).
 *   MIR OPTIONS › WINDOWS › SCROLL PILL (LOOK_SCHEMA `rackPill`: OFF · A · B, default A, the scrollbar's own accent) is `body[data-rack-pill]`. */
import { el, ariaLabel } from '../kit.js';
import { drag } from '../core/pointer.js';
import { frame } from '../core/frame.js';
import { setVar, setAttr } from '../core/perf.js';

/** the numbers (BASINS rack-scrollbars.js) */
export const SCROLLBAR = Object.freeze({ inset: 8, leftIn: 8, rightIn: 4, minThumb: 32, line: 40, page: 0.9, wheelLine: 16, offscreen: 12 });

/** scrollbarSeat({ side, rect, gutter, view, overflow, uiHidden, hidden }) — where the track goes, in viewport px, or
 *  null when it is gone (law 2).  rect is the rack's client rect; view { width, height }; overflow its scrollable px. */
export function scrollbarSeat({ side, rect, gutter, view, overflow, uiHidden = false, hidden = false }) {
  const S = SCROLLBAR;
  const left = side === 'left' ? rect.right - gutter - S.leftIn : rect.left + gutter - S.rightIn;
  const top = Math.max(S.inset, rect.top + S.inset), height = Math.max(0, Math.min(view.height - S.inset, rect.bottom - S.inset) - top);
  if (!gutter || !overflow || !height || uiHidden || hidden || left < 0 || left > view.width - S.offscreen) return null;
  return { left, top, height };
}
/** thumbOf({ height, client, scrollHeight, scrollTop }) — the thumb's size and offset inside a track `height` tall */
export function thumbOf({ height, client, scrollHeight, scrollTop }) {
  const max = Math.max(0, scrollHeight - client);
  const size = Math.min(height, Math.max(SCROLLBAR.minThumb, height * client / (scrollHeight || 1)));
  return { size, top: max ? (height - size) * scrollTop / max : 0, max };
}

/** the pill's numbers: how long the pills stay after the last scroll, and the gap it keeps from the window (and its scrollbar) */
export const PILL = Object.freeze({ linger: 900, gap: 8 });
/** inkOn(rgb, theme) — the theme's ink first: a LIGHT theme prefers 'light' (white) text, a DARK theme 'dark' (black) text; it flips only when
 *  the fill would leave it under 3:1 (WCAG relative luminance L: white needs L ≤ 0.3, black needs L ≥ 0.1) — λWAVES 018 A5, Josh */
export function inkOn(rgb, theme = 'light') {
  const m = String(rgb).match(/[\d.]+/g); if (!m || m.length < 3) return 'light';
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(+m[0]) + 0.7152 * lin(+m[1]) + 0.0722 * lin(+m[2]);
  return theme === 'dark' ? (L >= 0.1 ? 'dark' : 'light') : (L <= 0.3 ? 'light' : 'dark');
}
export function createRackPills({ host, racks, view = globalThis.window }) {
  const doc = view.document, life = new AbortController();
  const entries = racks.filter(Boolean).map((rack) => {
    const side = rack.dataset.side === 'left' ? 'left' : 'right';
    const layer = el('div', 'rack-pills', host), inner = el('div', 'rack-pills-in', layer);
    layer.dataset.side = side; layer.setAttribute('aria-hidden', 'true');
    const e = { rack, side, layer, inner, timer: 0, top: 0 };
    rack.addEventListener('scroll', () => scrolled(e), { passive: true, signal: life.signal });
    return e;
  });
  function seat(e) {
    const { rack, side, layer, inner } = e, hr = host.getBoundingClientRect(), rr = rack.getBoundingClientRect();
    layer.style.top = (rr.top - hr.top) + 'px'; layer.style.height = rr.height + 'px';
    inner.textContent = ''; e.top = rack.scrollTop;
    const lr = layer.getBoundingClientRect(), left = side === 'left';
    /* the seated scrollbar's thumb, where it shows: the pill keeps clear of it too */
    const track = host.querySelector('.rack-scrollbar[aria-controls="' + rack.id + '"]');
    const th = track && !track.hidden && track.firstElementChild ? track.firstElementChild.getBoundingClientRect() : null;
    /* no seated track but an overflow: the native bar lies on the rack's inner edge (the app's own thin bar) — clear of that edge */
    const native = !(th && th.width) && rack.scrollHeight > rack.clientHeight;
    for (const dev of rack.querySelectorAll(':scope > .dev')) {
      const head = dev.querySelector('.dev-head'), name = dev.querySelector('.dev-eyebrow');
      const text = name && name.textContent.trim(); if (!head || !text || dev.hidden) continue;
      const h = head.getBoundingClientRect(), d = dev.getBoundingClientRect(); if (!h.height || !d.width) continue;
      /* the window's inner edge (the stage side), pushed past the thumb when the thumb lies further out */
      let edge = left ? d.right : d.left;
      if (th && th.width) edge = left ? Math.max(edge, th.right) : Math.min(edge, th.left);
      else if (native) edge = left ? Math.max(edge, rr.right) : Math.min(edge, rr.left);
      const pill = el('span', 'rack-pill', inner, text);
      pill.style.top = (h.top + h.height / 2 - rr.top) + 'px';
      if (left) pill.style.left = (edge + PILL.gap - lr.left) + 'px';
      else pill.style.right = (lr.right - edge + PILL.gap) + 'px';
    }
    const first = inner.firstChild; if (first) layer.dataset.pillInk = inkOn(view.getComputedStyle(first).backgroundColor, doc.body.dataset.theme);
    inner.style.transform = '';
  }
  function scrolled(e) {
    const { rack, layer, inner } = e, track = host.querySelector('.rack-scrollbar[aria-controls="' + rack.id + '"]');
    if (!rack.classList.contains('scrolling')) { seat(e); rack.classList.add('scrolling'); if (track) track.classList.add('scrolling'); layer.classList.add('on'); }
    else inner.style.transform = 'translateY(' + (e.top - rack.scrollTop) + 'px)';
    clearTimeout(e.timer);
    e.timer = setTimeout(() => { rack.classList.remove('scrolling'); if (track) track.classList.remove('scrolling'); layer.classList.remove('on'); }, PILL.linger);
  }
  return {
    destroy() { life.abort(); for (const e of entries) { clearTimeout(e.timer); e.layer.remove(); e.rack.classList.remove('scrolling'); } },
  };
}

export function createRackScrollbars({ host, racks, span = null, view = globalThis.window }) {
  const doc = view.document, body = doc.body, life = new AbortController(), on = { signal: life.signal };
  const entries = [], gestures = [];
  const KEY = 'mir-rack-scrollbar:' + Math.random().toString(36).slice(2);
  const schedule = () => { if (!life.signal.aborted) frame.coalesce(KEY, paint); };
  const sizes = new view.ResizeObserver(schedule), mutations = new view.MutationObserver(schedule);

  function paint() {
    const hr = host.getBoundingClientRect(), vw = view.innerWidth, vh = view.innerHeight;
    for (const { rack, side, track, thumb } of entries) {
      const css = view.getComputedStyle(rack), overflow = Math.max(0, rack.scrollHeight - rack.clientHeight);
      const seat = scrollbarSeat({ side, rect: rack.getBoundingClientRect(), gutter: parseFloat(css.getPropertyValue('--rack-shadow-gutter')) || 0,
        view: { width: vw, height: vh }, overflow, uiHidden: body.classList.contains('ui-hidden'), hidden: css.visibility === 'hidden' || css.display === 'none' });
      if (track.hidden !== !seat) track.hidden = !seat;
      if (!seat) continue;
      /* the host is the positioning box (BASINS: #lab at the viewport's corner) */
      setVar(track, 'left', (seat.left - hr.left) + 'px'); setVar(track, 'top', (seat.top - hr.top) + 'px'); setVar(track, 'height', seat.height + 'px');
      const th = thumbOf({ height: seat.height, client: rack.clientHeight, scrollHeight: rack.scrollHeight, scrollTop: rack.scrollTop });
      setVar(thumb, 'height', th.size + 'px'); setVar(thumb, 'top', th.top + 'px');
      setAttr(track, 'aria-valuemax', String(Math.round(th.max))); setAttr(track, 'aria-valuenow', String(Math.round(rack.scrollTop)));
    }
  }

  for (const rack of racks.filter(Boolean)) {
    const side = rack.dataset.side === 'left' ? 'left' : 'right';
    const track = el('div', 'rack-scrollbar', host), thumb = el('i', 'rack-scrollbar-thumb', track);
    track.dataset.side = side; track.hidden = true; track.tabIndex = 0;
    track.setAttribute('role', 'scrollbar'); track.setAttribute('aria-orientation', 'vertical'); track.setAttribute('aria-controls', rack.id);
    ariaLabel(track, side === 'left' ? 'left rack scroll' : 'right rack scroll');   // tr: the scrollbar beside the cards of the left / right RACK (the column of docked windows)
    track.setAttribute('aria-valuemin', '0');
    thumb.setAttribute('aria-hidden', 'true');
    entries.push({ rack, side, track, thumb });
    /* the press: on the track (not the thumb) the thumb's middle jumps to the pointer; the drag then carries on from there */
    let start = null;
    track.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      const r = track.getBoundingClientRect(), t = thumb.getBoundingClientRect();
      const max = rack.scrollHeight - rack.clientHeight, travel = r.height - t.height;
      if (travel <= 0 || max <= 0) { start = null; return; }
      if (e.target !== thumb) rack.scrollTop = (e.clientY - r.top - t.height / 2) / travel * max;
      start = { scroll: rack.scrollTop, ratio: max / travel };
      track.classList.add('drag'); schedule();
    }, on);
    const stop = () => { start = null; track.classList.remove('drag'); };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) track.addEventListener(type, stop, on);
    gestures.push(drag(track, { slop: 0,
      onMove(s) { if (start) { rack.scrollTop = start.scroll + s.dy * start.ratio; schedule(); } },
      onEnd: stop, onCancel: stop }));
    track.addEventListener('wheel', (e) => { e.preventDefault(); rack.scrollTop += e.deltaY * (e.deltaMode === 1 ? SCROLLBAR.wheelLine : e.deltaMode === 2 ? rack.clientHeight : 1); }, { passive: false, signal: life.signal });
    track.addEventListener('keydown', (e) => {
      const k = e.key; if (!['ArrowUp', 'PageUp', 'ArrowDown', 'PageDown', 'Home', 'End'].includes(k)) return;
      e.preventDefault();
      const step = k === 'ArrowUp' || k === 'ArrowDown' ? SCROLLBAR.line : rack.clientHeight * SCROLLBAR.page;
      rack.scrollTop = k === 'Home' ? 0 : k === 'End' ? rack.scrollHeight : rack.scrollTop + (k === 'ArrowUp' || k === 'PageUp' ? -step : step);
    }, on);
    rack.addEventListener('scroll', schedule, { passive: true, signal: life.signal });
    sizes.observe(rack);
    mutations.observe(rack, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  }
  mutations.observe(body, { attributes: true, attributeFilter: ['class'] });
  view.addEventListener('resize', schedule, { passive: true, signal: life.signal });
  const unspan = span ? span.subscribe(schedule) : null;
  body.classList.add('rack-scrollbars');
  schedule();
  return {
    /** paint() — seat the tracks now (a test, or after the app moved a rack itself) */
    paint,
    tracks: entries.map((e) => e.track),
    destroy() {
      life.abort(); frame.cancel(KEY); sizes.disconnect(); mutations.disconnect(); if (unspan) unspan();
      for (const g of gestures) g.destroy();
      for (const e of entries) e.track.remove();
      body.classList.remove('rack-scrollbars');
    },
  };
}
