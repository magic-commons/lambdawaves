/* pattern/window.js — THE PATTERN WINDOW: FL's channel rack for the modulation window's ENVs (harvested from BASINS
 * app/pattern-window.js and pattern.css, branch basins-ui-fixes-2026-10-01, 2026-10-02).
 *
 * WHAT IT IS.  One window shared by every ENV on the rack: one row per ENV — a cap in the device's colour, then 16 steps
 * in four groups of four (32 or 64 scroll).  A step is a 16th note; its LED bar is its velocity.  PATT on an ENV face
 * turns that ENV's row live and opens the window; the sequencer (sequencer.js) fires the ENV on every lit step the
 * transport crosses.  The rows are the project's (a project part), the undo is the app's one history (a domain).
 *
 *   installPattern({ mount, mod, model?, history?, project?, dock?, store?, storageKey?, say?, moved?, onWindow? }) → pat
 *     mount      the element the window and its rail go in (the app's float layer)
 *     mod        installModulation's result (mir/modulation/bind.js): its model, clock, window and timeline
 *     model      a pattern/model.js createPatternModel() (default: a new one)
 *     history    mir/history createHistory(): the rows become its 'pattern' domain, a paint-drag one row
 *     project    false keeps the rows out of the project (default: core/project.js registerProjectPart('pattern', …))
 *     dock       { span, guide } — the app's dock span (window/dock.js observeSpan) and its DOCK GUIDE switch; absent,
 *                the viewport.  The window always also docks on its ENV device (an anchor).
 *     store      { read, write } for the window's own shape (default localStorage 'mir.pattern')
 *     say(msg)   where a refusal is said (default: the modulation window's status line)
 *   pat = { win, root, rail, model, sequencer, open, close, toggle, isOpen, show(envId), rows(), seat(), docked(), height(),
 *           menu(), sync(), paintMarkers(force), closeMenu(), destroy() }
 *
 * THE LAWS IT KEEPS (Josh, 2026-10-01; BASINS' laws, unchanged)
 *   1. THE SEAT IS ITS ENV DEVICE.  Docked (`dock: 'anchor'`, the default), the window takes the left and the width of one
 *      ENV device — the first ENV whose PATT is on, else the first ENV — 8 px over the modulation window's content (below
 *      it when the screen's top leaves no room for it and a rail).  It follows the device (the run's sideways scroll
 *      included), is cut where the run cuts the device, and hides when the device scrolls wholly away.  A grip drag, or
 *      a drag on its empty glass, sets it free; a drop near the seat docks it again.
 *   2. NO ENV, NO WINDOW.  With no ENV on the rack the window and its rail are not drawn (the open state is kept for the
 *      first ENV); PATT and show() with no ENV say so.
 *   3. IT GOES WITH ITS WINDOW.  Closing the modulation window closes a docked pattern window, and opening it brings
 *      that window back.  A free window is free.  show() with the modulation window shut opens the modulation window.
 *   4. HEIGHT = ROWS.  One --pt-row (40 px; 52 under a finger) per ENV plus the window's own edges, docked or free.
 *   5. FL'S STEP GESTURES.  A left drag paints a run, a right drag clears one, a vertical drag on a lit step sets its
 *      velocity (64 px for the full 1–127), a tap on a lit step clears it on touch; a finger on a 32/64-step row pans
 *      it and a step lights on lift.
 *   6. ONE CLOCK.  The sequencer rides the modulation clock's advance notice (host.js onAdvance): every tick, every
 *      recorder step, every seek — no loop of its own; the playing step's bar is painted from the existing tick.
 *   7. THE STEPS ARE THE KIT'S `.trig`, so the LOOK's CONTROL FACES and FLAT paint them as they paint every button. */
import { el, trig, label, ariaLabel } from '../kit.js';
import { t, tn } from '../core/i18n.js';
import { createWindow } from '../window/window.js';
import { registerProjectPart } from '../core/project.js';
import { frame } from '../core/frame.js';
import { localStore } from '../modulation/bind.js';
import { createPatternModel, patternProjectPart, PATTERN_LENGTHS, VEL_MAX } from './model.js';
import { createPatternSequencer } from './sequencer.js';

const GAP = 2, GROUP_GAP = 6, VISIBLE = 16;          // px between steps, between groups of four (pattern.css says the same)
const VEL_PX = 64;                                   // a full 0→127 velocity sweep, in px of vertical drag
const FOLLOW_MS = 450;                               // a moving seat is measured per frame this long after its last notice
const EDGE = 8, RAIL_H = 62;                         // BASINS SNAP.edge and kwin RAIL_W: the gap over the content, the rail's thickness
const SIZE = Object.freeze({ w: 470, h: 60 }), MIN = Object.freeze({ w: 300, h: 40 });
const FOLLOW_KEY = 'mir:pattern:follow';
let ids = 0;

export function installPattern(o) {
  const { mount, mod } = o;
  const M = mod.M || mod.host.model, clock = mod.host.clock, view = mod.view;
  const model = o.model || createPatternModel();
  const say = o.say || ((msg) => { if (view && view.say) view.say(msg, 'warn'); });
  const store = o.store || localStore(o.storageKey || 'mir.pattern');
  const history = o.history || null;
  const uid = ++ids;
  const doc = mount.ownerDocument, win0 = doc.defaultView;

  /* ── THE SEQUENCER, on the clock's one advance notice ── */
  const sequencer = createPatternSequencer({ M, clock, pattern: model, timeline: () => { const tl = mod.timeline ? mod.timeline() : null; return tl ? tl.model || null : null; } });
  const offAdvance = clock.onAdvance((kind) => { if (kind === 'seek') { sequencer.reset(); paintMarkers(true); } else sequencer.tick(); });

  let built = new Map(), menu = null, H = SIZE.h, withMod = false, until = 0, seatKey = '', stripW = -1, runEl = null;
  const anchorFns = new Set();
  const notifySeat = () => { for (const fn of anchorFns) fn(); };

  const envs = () => M.sourceList().filter((s) => s.kind === 'env');
  /* THE SEAT IS ITS ENV DEVICE (Josh, 2026-10-01: "the width of the pattern should follow the only window of the ENV"):
     the first ENV whose PATT is on, else the first ENV */
  const seatEnv = () => { const l = envs(); return l.find((s) => model.isLive(s.id)) || l[0] || null; };
  const devOf = (id) => (view && view.root ? view.root.querySelector('.m2dev[data-id="' + CSS.escape(String(id)) + '"]') : null);
  const onRunScroll = () => notifySeat();               // scroll events come once per frame, before paint
  function seat(h) {
    const g = view && view.seatBox ? view.seatBox() : null, s = g && seatEnv();
    const dev = s && devOf(s.id), run = dev && dev.closest('.m2run');
    if (!run) return null;
    if (run !== runEl) { if (runEl) runEl.removeEventListener('scroll', onRunScroll); runEl = run; run.addEventListener('scroll', onRunScroll, { passive: true }); }
    const d = dev.getBoundingClientRect(); if (!(d.width > 0)) return null;
    const railH = (win && win.rail.sizes ? win.rail.sizes().horizontal.h : 0) || RAIL_H;
    const above = g.content.top - EDGE - h, flip = above - railH < EDGE;
    /* outer: the edge facing away from the modulation window; avoid: its glass — the rail seats in a clear lane only
       (window/rail.js seatClear, BASINS snap-window.js seat) */
    return { left: Math.round(d.left), width: Math.round(d.width), top: Math.round(flip ? g.content.bottom + EDGE : above), height: h,
      outer: flip ? 'bottom' : 'top', avoid: g.content };
  }
  /* docked, the window is cut where the device run cuts the device (the window set clips the pane; the rail is cut here) */
  const runClip = () => { if (!runEl) return null; const r = runEl.getBoundingClientRect(); return { left: r.left, right: r.right, top: -1e5, bottom: 1e5 }; };

  /* ── THE WINDOW ── */
  const saved = (() => { let r = null; try { r = store.read(); } catch (_) { /* storage refused */ } return r && typeof r === 'object' ? r : {}; })();
  /* BASINS' shape: docked on the anchor, the rail's side 'auto' (its seat law picks a clear lane; a Shift-drag choice wins).
     A shape written before 1.5.0-alpha.15 (no v) carried the kit's old default side 'top' as if chosen: it reads 'auto'
     (BASINS pattern-window.js did the same for prefs without v: 2) */
  const shape = saved.win && typeof saved.win === 'object' ? { ...saved.win, ...(saved.v === 2 ? {} : { chipSide: 'auto' }) } : { dock: 'anchor', chipSide: 'auto', open: false };
  withMod = !!saved.withMod;
  const modOpen = () => !!(view && view.isOpen);
  if (shape.dock === 'anchor' && !modOpen() && shape.open) { withMod = true; shape.open = false; }     // its window is shut: it waits for it
  else if (shape.dock === 'anchor' && modOpen() && withMod) { withMod = false; shape.open = true; }
  const writeShape = (s) => { try { store.write({ v: 2, win: s, withMod }); } catch (_) { /* storage refused */ } };
  const span = o.dock && o.dock.span ? o.dock.span : { read: () => ({ left: EDGE, right: win0.innerWidth - EDGE, top: EDGE, bottom: win0.innerHeight - EDGE }) };

  let win = null;
  win = createWindow({
    id: 'pattern', title: 'PATTERN', host: mount, size: { w: SIZE.w, h: H }, min: MIN, resizable: true, emptyDrag: '.pt-track',
    material: 'modulation', persist: { read: () => shape, write: writeShape },
    dock: { span, guide: o.dock && o.dock.guide, guideClass: o.dock && o.dock.guideClass,
      anchor: { rect: () => seat(H), clip: runClip, subscribe(fn) { anchorFns.add(fn); return () => anchorFns.delete(fn); } } },
    chips: [{ name: 'addEnv', kind: 'action', glyph: 'plus', label: 'Add an envelope to the rack',
      press: () => { M.addSource('env'); if (view) view.rebuild(); clock.recomputeRunning(); sync(); } }],
    onMoved: (r) => { clipRail(r); overflow(); if (o.moved) o.moved(r); },
    onOpen: () => { if (o.dock && o.dock.span && o.dock.span.setActive) o.dock.span.setActive(true); sync(); paintMarkers(true); if (o.onWindow) o.onWindow(true); },
    onClose: () => { closeMenu(); if (o.onWindow) o.onWindow(false); },
  });
  const root = win.root, railEl = win.rail.el;
  root.classList.add('mir-pattern');
  const docked = () => win.state().dock === 'anchor';
  /* the rail is cut with the pane, and hidden with it (the window set hides both when the seat is gone) */
  function clipRail(r) {
    const box = r && docked() && runEl ? runEl.getBoundingClientRect() : null;
    if (!box) { railEl.style.clipPath = ''; return; }
    const q = railEl.getBoundingClientRect(), l = Math.max(0, Math.round(box.left - q.left)), rt = Math.max(0, Math.round(q.right - box.right));
    railEl.style.clipPath = l || rt ? `inset(-40px ${rt}px -40px ${l}px)` : '';
  }

  const surface = el('div', 'pt-surface', win.body);
  const list = el('div', 'pt-rows', surface);
  const empty = label(el('div', 'pt-empty', surface), 'No envelopes on the rack — add one with +');
  root.tabIndex = -1;

  const nameOf = (s, n) => s.label || t('ENV {n}', { n });
  function colourOf(id) {
    const dev = devOf(id), path = dev && dev.querySelector('.m2path');
    const c = path ? getComputedStyle(path).stroke : '';
    return c && c !== 'none' ? c : getComputedStyle(root).getPropertyValue('--acc').trim();
  }
  const gesture = (name, fn) => { if (history) history.hold(t(name, null, 'history')); try { fn(); } finally { if (history) history.release(); } };

  /* ── one row: the cap, the strip of kit-faced blocks (each with its LED bar), the playing bar ── */
  function buildRow(s, n) {
    const row = el('div', 'pt-row'); row.dataset.env = s.id;
    const cap = trig({ label: '', cls: 'pt-cap', title: 'Right-click or tap: FILL · CLEAR · LENGTH · PATTERN ON/OFF' });
    row.appendChild(cap.root);
    const strip = el('div', 'pt-strip', row), track = el('div', 'pt-track', strip);
    const play = el('i', 'pt-play', track); el('i', 'pt-play-bar', play);
    const rec = { id: s.id, row, cap, strip, track, play, steps: [], length: 0, sig: '', step: -2, playing: null };
    setCapName(rec, s, n);
    cap.root.addEventListener('click', (e) => openMenu(rec, e));
    cap.root.addEventListener('contextmenu', (e) => { e.preventDefault(); openMenu(rec, e); });
    /* a vertical wheel pages a 32/64-step row (its scrollbar is hidden so the row keeps its height) */
    strip.addEventListener('wheel', (e) => {
      if (rec.row.dataset.long !== 'true' || e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      e.preventDefault(); strip.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    }, { passive: false });
    wireStrip(rec);
    return rec;
  }
  function setCapName(rec, s, n) {
    const l = rec.cap.root.querySelector('.trig-l');
    if (s.label) { delete l.dataset.t; l.textContent = s.label; rec.cap.root.dataset.user = 'true'; }   // the user's own name: data, shown as typed (CSS sets the caps)
    else { label(l, 'ENV {n}', { n }); delete rec.cap.root.dataset.user; }
  }
  function layoutSteps(rec, length) {
    if (rec.length === length) return;
    for (const b of rec.steps) b.remove();
    rec.steps = [];
    for (let i = 0; i < length; i++) {
      const b = el('button', 'trig pt-step'); b.type = 'button'; b.tabIndex = -1;
      b.dataset.i = String(i); b.dataset.g = String(Math.floor(i / 4) % 2);
      b.style.setProperty('--i', String(i)); b.style.setProperty('--q', String(Math.floor(i / 4)));
      ariaLabel(b, 'step {n}', { n: i + 1 });
      const bar = el('i', 'pt-bar', b); el('i', 'pt-lamp', bar);
      rec.track.insertBefore(b, rec.play); rec.steps.push(b);
    }
    rec.track.style.setProperty('--len', String(length));
    rec.row.dataset.long = length > VISIBLE ? 'true' : 'false';
    rec.length = length; rec.sig = ''; rec.step = -2; stripW = -1;
  }
  function paintRow(rec) {
    const r = model.rowOf(rec.id), live = r.live;
    layoutSteps(rec, r.length);
    rec.row.dataset.live = live ? 'true' : 'false';
    rec.row.style.setProperty('--dev', colourOf(rec.id));
    rec.cap.on = live;
    const sig = r.length + '|' + live + '|' + r.steps.subarray(0, r.length).join(',');
    if (sig === rec.sig) return;
    rec.sig = sig;
    for (let i = 0; i < r.length; i++) {
      const v = r.steps[i], b = rec.steps[i];
      b.classList.toggle('on', v > 0);                 // the kit's own state: the face is every button's .on
      b.setAttribute('aria-pressed', v > 0 ? 'true' : 'false');
      b.style.setProperty('--v', (v / VEL_MAX).toFixed(4));
      b.dataset.v = String(v);
    }
  }
  /* a row its strip cannot show whole scrolls (and pans under a finger): 32/64 steps, or 16 on a run too narrow for them */
  function overflow() {
    const w = root.offsetWidth; if (w === stripW) return; stripW = w;
    for (const rec of built.values()) rec.row.dataset.long = rec.length > VISIBLE || rec.track.offsetWidth > rec.strip.clientWidth + 1 ? 'true' : 'false';
  }
  /* rows follow the rack: one per ENV, in rack order; a removed ENV's row goes (its steps stay in the model) */
  function sync() {
    const all = envs(), keep = new Map();
    all.forEach((s, k) => {
      let rec = built.get(s.id);
      if (!rec) rec = buildRow(s, k + 1); else setCapName(rec, s, k + 1);
      keep.set(s.id, rec); if (list.children[k] !== rec.row) list.insertBefore(rec.row, list.children[k] || null);   // never re-insert a row under a captured pointer
      paintRow(rec);
    });
    for (const [id, rec] of built) if (!keep.has(id)) rec.row.remove();
    built = keep;
    empty.hidden = all.length > 0;
    /* no ENV, no window on screen (its open state is kept: the first ENV added brings it back) */
    for (const n of [root, railEl]) n.classList.toggle('pt-noenv', !all.length);
    if (menu && !built.has(menu.env)) closeMenu();
    fit(); if (win.isOpen()) { overflow(); notifySeat(); }   // the seat's ENV may have moved, come or gone
  }
  /* THE HEIGHT IS THE ROWS': one --pt-row per ENV plus the window's own borders and padding */
  function fit() {
    const a = getComputedStyle(root), b = getComputedStyle(surface), px = (c, k) => parseFloat(c[k]) || 0;
    const chrome = px(a, 'borderTopWidth') + px(a, 'borderBottomWidth') + px(b, 'borderTopWidth') + px(b, 'borderBottomWidth') + px(b, 'paddingTop') + px(b, 'paddingBottom');
    const want = Math.round(chrome + Math.max(1, envs().length) * (parseFloat(a.getPropertyValue('--pt-row')) || 40));
    if (want === H) return;
    H = want;
    win.resize({ h: H });                                // the window set's door: the dock (and the anchor) is kept, the rail seats for it
  }
  /* ── the playing bar, from the existing tick: placed by the steps' own left formula (--i, --q) — WebKit resolves a
     percentage translate against a snapped width (measured 4.7 px off at step 15), so no translate, and nothing measured ── */
  function paintMarkers(force) {
    if (!win.isOpen()) return;
    const running = clock.isRunning() && clock.isPlaying();
    for (const rec of built.values()) {
      const pos = sequencer.position(rec.id), step = pos.step < rec.length ? pos.step : -1;
      if (!force && step === rec.step && running === rec.playing) continue;
      rec.step = step; rec.playing = running;
      rec.play.style.opacity = step >= 0 && running ? '1' : '0';
      if (step >= 0) { rec.play.style.setProperty('--i', String(step)); rec.play.style.setProperty('--q', String(Math.floor(step / 4))); }
      rec.row.dataset.clip = pos.clip ? 'true' : 'false';
    }
  }

  /* ── FL's step gestures on one strip ── */
  function stepAt(rec, clientX) {
    const r = rec.track.getBoundingClientRect(), n = rec.length, x = clientX - r.left;
    const sw = (r.width - (n - 1) * GAP - (n / 4 - 1) * (GROUP_GAP - GAP)) / n, pitch = 4 * sw + 3 * GAP + GROUP_GAP;
    const g = Math.floor(x / pitch), j = Math.min(3, Math.max(0, Math.floor((x - g * pitch) / (sw + GAP))));
    return Math.max(0, Math.min(n - 1, g * 4 + j));
  }
  function wireStrip(rec) {
    let d = null;
    rec.track.addEventListener('contextmenu', (e) => e.preventDefault());
    rec.track.addEventListener('pointerdown', (e) => {
      if (d || (e.button !== 0 && e.button !== 2)) return;
      e.preventDefault(); e.stopPropagation();
      try { rec.track.setPointerCapture(e.pointerId); } catch (_) { /* a synthetic pointer */ }
      root.focus({ preventScroll: true });
      const i = stepAt(rec, e.clientX), v0 = model.rowOf(rec.id).steps[i], touch = e.pointerType !== 'mouse';
      /* a finger on a scrolling row (32/64 steps) pans it sideways: an unlit step waits for the lift before it lights */
      const panning = touch && rec.row.dataset.long === 'true';
      if (history) history.hold(t('PATTERN', null, 'history'));
      d = { pid: e.pointerId, i0: i, last: i, x0: e.clientX, y0: e.clientY, v0, touch,
        mode: e.button === 2 ? 'clear' : v0 ? 'pending' : panning ? 'pending-on' : 'paint', vel: v0 || VEL_MAX };
      if (d.mode === 'clear') model.setStep(rec.id, i, 0);
      if (d.mode === 'paint') model.setStep(rec.id, i, d.vel);
    });
    rec.track.addEventListener('pointermove', (e) => {
      if (!d || e.pointerId !== d.pid) return;
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0, j = stepAt(rec, e.clientX);
      if (d.mode === 'pending-on') return;
      if (d.mode === 'pending') {
        if (Math.abs(dy) > 4 && Math.abs(dy) > Math.abs(dx)) d.mode = 'vel';
        else if (j !== d.i0) d.mode = 'paint';
        else return;
      }
      if (d.mode === 'vel') { model.setStep(rec.id, d.i0, Math.max(1, Math.min(VEL_MAX, Math.round(d.v0 - dy * VEL_MAX / VEL_PX)))); return; }
      if (j === d.last) return;
      model.setSteps(rec.id, Math.min(d.last, j), Math.max(d.last, j), d.mode === 'clear' ? 0 : d.vel);
      d.last = j;
    });
    const end = (e, lifted) => {
      if (!d || e.pointerId !== d.pid) return;
      if (lifted && d.mode === 'pending' && d.touch) model.setStep(rec.id, d.i0, 0);      // no right button on glass: a tap toggles
      if (lifted && d.mode === 'pending-on') model.setStep(rec.id, d.i0, d.vel);
      d = null;
      if (history) history.release();
    };
    rec.track.addEventListener('pointerup', (e) => end(e, true));
    rec.track.addEventListener('pointercancel', (e) => end(e, false));
    rec.track.addEventListener('lostpointercapture', (e) => end(e, false));
  }

  /* ── the cap's menu: FL's "Fill each 2/4/8 steps", CLEAR, the length, the switch, → TIMELINE ── */
  function closeMenu() { if (menu) { menu.el.remove(); menu = null; } }
  function openMenu(rec, e) {
    closeMenu();
    const r = model.rowOf(rec.id), m = el('div', 'pt-menu glass'); m.setAttribute('role', 'menu');
    const item = (words, fn, on) => { const b = el('button', 'pt-mi' + (on ? ' on' : ''), m); b.type = 'button'; b.setAttribute('role', 'menuitem');
      if (Array.isArray(words)) b.textContent = words[0]; else label(b, words);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); closeMenu(); gesture('PATTERN', fn); }); return b; };
    const rule = () => el('i', 'pt-rule', m);
    item(r.live ? 'PATTERN OFF' : 'PATTERN ON', () => model.setLive(rec.id, !r.live), r.live);
    rule();
    for (const n of [2, 4, 8]) item([t('FILL EACH {n} STEPS', { n })], () => model.fill(rec.id, n));
    item('CLEAR', () => model.clear(rec.id));
    rule();
    for (const n of PATTERN_LENGTHS) item([tn(n / 16, 'LENGTH {len} · {n} BAR', 'LENGTH {len} · {n} BARS', { len: n })], () => model.setLength(rec.id, n), r.length === n);
    if (mod.timeline && mod.timeline()) {
      rule();
      item('SEND TO TIMELINE', () => { const said = view && view.api && view.api.sendToTimeline ? view.api.sendToTimeline(rec.id) : null; if (said) say(said); });
    }
    doc.body.appendChild(m);                   // above every window and rail, as the timeline's menus are
    const cap = rec.cap.root.getBoundingClientRect();
    const x = e && e.clientX ? e.clientX : cap.left, y = e && e.clientY ? e.clientY : cap.bottom;
    m.style.left = Math.max(4, Math.min(win0.innerWidth - m.offsetWidth - 4, x)) + 'px';
    m.style.top = Math.max(4, Math.min(win0.innerHeight - m.offsetHeight - 4, y)) + 'px';
    menu = { el: m, env: rec.id };
  }
  const away = (e) => { if (menu && !menu.el.contains(e.target)) closeMenu(); };
  doc.addEventListener('pointerdown', away, true);
  const keys = (e) => { if (e.key === 'Escape' && menu) { closeMenu(); e.preventDefault(); } };
  win0.addEventListener('keydown', keys);

  /* ── THE PROJECT AND THE ONE HISTORY ── */
  const offProject = o.project === false ? null : registerProjectPart('pattern', patternProjectPart(model));
  const offHistory = history ? (history.register('pattern', { read: () => model.capture(), write: (snap) => model.restore(snap) }), () => {}) : null;

  /* ── THE FOLLOW: the modulation window says when it placed, landed, opened or closed; a short measuring run rides
     the motion that follows (one read a frame through the one frame, for 450 ms after the last notice) ── */
  function follow() { until = performance.now() + FOLLOW_MS; frame.coalesce(FOLLOW_KEY + uid, step); }
  function step() {
    if (!win.isOpen() || !docked()) return;
    const s = seat(H), key = s ? s.left + ':' + s.top + ':' + s.width : '';
    if (key !== seatKey) { seatKey = key; notifySeat(); }
    if (performance.now() < until) frame.coalesce(FOLLOW_KEY + uid, step);
  }
  const offGeometry = view && view.onGeometry ? view.onGeometry((open) => {
    if (!open) { if (win.isOpen() && docked()) { withMod = true; win.close(); } return; }   // it goes with its window …
    if (withMod) { withMod = false; if (!win.isOpen()) win.open(); return; }                // … and comes back with it
    if (win.isOpen() && docked()) { notifySeat(); follow(); }
  }) : null;
  const offModel = model.subscribe(() => { if (win.isOpen()) { sync(); paintMarkers(true); } });
  const offTick = mod.onTick ? mod.onTick(() => paintMarkers(false)) : null;
  const offSpan = o.dock && o.dock.span && o.dock.span.subscribe ? o.dock.span.subscribe(() => { if (win.isOpen() && docked()) notifySeat(); }) : null;

  /* PATT's door, attached to the modulation window: open (raised) and bring that ENV's row into view */
  function show(envId) {
    if (!envs().length) { say(t('add an envelope (ENV) to the rack first — the pattern rows are its')); return false; }
    if (docked() && !modOpen() && mod.open) mod.open();         // its seat is in the modulation window: open that first
    win.open(); win.raise();
    const rec = envId && built.get(String(envId));
    if (rec) { rec.row.scrollIntoView({ block: 'nearest' }); rec.row.classList.remove('pt-flash'); void rec.row.offsetWidth; rec.row.classList.add('pt-flash'); }
    return true;
  }
  if (view && view.setPattern) view.setPattern({ model, show });

  sync();
  const pat = {
    win, root, rail: railEl, model, sequencer,
    open: () => show(), close: () => win.close(), toggle: () => (win.isOpen() ? win.close() : show()), isOpen: () => win.isOpen(),
    show, sync, paintMarkers, closeMenu,
    rows: () => [...built.values()].map((rec) => ({ env: rec.id, name: rec.cap.root.textContent, live: model.isLive(rec.id), length: rec.length, steps: model.steps(rec.id), step: rec.step })),
    seat: () => seat(H), docked, height: () => H,
    menu: () => (menu ? [...menu.el.querySelectorAll('.pt-mi')].map((b) => b.textContent) : null),
    destroy() {
      frame.cancel(FOLLOW_KEY + uid); if (runEl) runEl.removeEventListener('scroll', onRunScroll);
      if (offGeometry) offGeometry(); offModel(); if (offTick) offTick(); if (offSpan) offSpan(); offAdvance();
      if (offProject) offProject(); if (offHistory) offHistory();
      if (view && view.setPattern) view.setPattern(null);
      doc.removeEventListener('pointerdown', away, true); win0.removeEventListener('keydown', keys); closeMenu(); anchorFns.clear(); win.destroy();
    },
  };
  return pat;
}
