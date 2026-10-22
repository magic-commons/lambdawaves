/* lab/shell/rack-wiring.js — §19a THE RACK IS THE KIT'S (0.5.2 R3b; moved verbatim out of lab/rack.js boot()): createRack, the layout verbs (aliases over the
 * kit's rack; captureLayout's v3 the WORKSPACE record), the TRANSPORT card, the phone and tablet crossings, the stage gestures.  Two seats, as the code stood:
 * createRackWiring(app) at §19a's, wireStage() after the notebook's.  rk, layout, phone, tablet, winHint and devById are registered on app.sh at creation. */
import { TIER } from '../rack.js'; import { chip } from '../mir/kit.js'; import { transportDock } from '../mir/shell/transport.js'; import { createRack, readLayout, layoutLabel as rackLayoutLabel } from '../mir/shell/rack.js';
import { uiSpace } from '../mir/shell/scene-guard.js'; import { bindStageGestures } from '../stage-gestures.js'; import { CAM } from '../camera-law.js'; import { paintedRect } from '../occlusion.js';
const SHELLS_FOLDED = [7];   // iteration 008 A7: SPECTRUM's shells folded by default (spectrum.js FOLD_DEFAULT)
export function createRackWiring(app) {
  const { dom, ui, device, DEVICES, clock, obs, settingsStore, isPhone, isTablet } = app, { schedule, windowActivity } = app.loop;
  const { camera, camTravel, floats, LAYOUT_SLOTS, orbitBy, panBy, rack, rackL, resetView, zoomAt } = app.host, { DIGESTS, quality, readSettings, RETIRED_WINDOWS, saveSettings, setFrost } = app.sh;
  const { bowCancel, bowMove, bowRelease, bowStart, kepler, keplerDragTo } = app.w;
  const { field, look, occlusion, setGovernor, setKeepFrames } = app.ctl;
  const devById = (id) => document.querySelector('.dev[data-id="' + id + '"]');
  /** a rack card's width, from the RACK's own content box — the scrollbar is already out of clientWidth */
  const rackCardWidth = () => { const cs = getComputedStyle(rack); return Math.max(180, Math.round(rack.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0))); };
  /** the TRANSPORT's pop chip wears the act its next press performs (its floating mode is the pill); every other card's is the kit's */
  function popFace(d) {
    const b = d && d.querySelector('.dev-pop'); if (!b) return;
    chip(b, layout.docked ? 'north' : 'reopen', layout.docked ? 'undock the control surface' : 'dock the control surface');
    b.title = 'Dock or undock the control surface';
  }
  /* ── 0.5.0 C3 · THE RACK IS THE KIT'S (lab/mir/shell/rack.js createRack; research/release-0.5.0/C3-DESIGN.md §2–3) ──────────
   * #rack, #rackL, #floats and the ◧ + ☆ chrome are adopted BY ID (their classes, sheets and listeners kept) and every .dev is
   * registered IN PLACE: the float layer, the ONE gesture (THE TITLE BAR DECIDES), BASINS' motion, ONE raise stack, the clamp,
   * hide and peek, the + and ☆ lists and the phone's crossing of cards and floats are the kit's.  What stays here is the
   * WORKSPACE record's shape — captureLayout's v3, so every ☆ slot and project part is a record 0.4.0 reads — and what the
   * kit's record does not carry: the transport's dock and the MORE / CORE folds (layoutExtras), the transport card itself
   * (`card: true`), and `hidden` (a legacy card, a card a molecule stood down) kept out of the + list.  A reload keeps only
   * `closed`, as before (saveSettings), so the store hands the kit its ☆ slots and no layout. */
  const sideKey = (s) => (s === 'L' || s === 'left' ? 'left' : s === 'R' || s === 'right' ? 'right' : undefined), sideLR = (s) => (s === 'left' ? 'L' : 'R');
  let parkedIds = [];   // the floats the crossing parks (the kit's memory is private: BRIEF R2), read by this listener, registered AHEAD of the kit's
  window.addEventListener('resize', () => { if (!rk.phone && isPhone()) parkedIds = rk.floating(); }, { passive: true });
  const rk = createRack({ host: document.getElementById('lab'), favourites: LAYOUT_SLOTS, handle: 'never', tabletClamp: false, phone: isPhone, retired: RETIRED_WINDOWS,
    notebook: () => (layout.notebookSize ? { size: layout.notebookSize, resize: layout.notebookResize } : null),
    store: {
      get: () => ({ favs: readSettings().layouts || {} }),
      /* a slot the kit has just captured (its v1) is written as captureLayout's v3 of the same instant; nothing else is the kit's to write */
      set(v) {
        const S = readSettings(), was = S.layouts || {}, m = { ...((v && v.favs) || {}) };
        for (const k of Object.keys(m)) if (m[k] && m[k].v === 1 && (!was[k] || was[k].at !== m[k].at)) m[k] = layout.captureLayout();
        if (JSON.stringify(m) !== JSON.stringify(was)) settingsStore.write({ ...S, layouts: m });
      },
    },
    onChange: () => occlusion.dirty() });   // a kit-side act moved a window: the mask follows (what is remembered is saveSettings', on its own edges)
  const devTitle = (d) => ((d.querySelector('.dev-eyebrow') || {}).textContent || d.dataset.id).trim();
  for (const d of document.querySelectorAll('#rackL > .dev, #rack > .dev')) rk.register({ id: d.dataset.id, el: DEVICES.get(d.dataset.id) || d, title: devTitle(d), hint: ((d.querySelector('.dev-title') || {}).textContent || '').trim() });
  /* ── iteration 006 R · A RACK'S SCROLLBAR ANSWERS ITS CONTENT, NEVER ITS MOTION ─────────────────────────────────────────────
   * Both racks are content-sized scrollers (lab.css: bottom auto, max-height 100%, overflow-y auto).  The kit's motion (mir/shell/
   * rack.js createRackMotion) FLIPs every card that moves UP when one above it hides, folds or leaves: for 320 ms it is drawn by a
   * transform where it WAS, below the column's new bottom.  That is scrollable overflow, so the thin bar came up, the column
   * narrowed 6 px, every card's width changed, the motion's own ResizeObserver re-ran its refresh inside the delivery (cancel: the
   * bar goes; restart: it comes back) and the dock's observer on the rack (mir/window/dock.js observeSpan) was left holding a size
   * it could not be told — Firefox's "ResizeObserver loop completed with undelivered notifications".  MOLECULES ON stands STATE
   * down above four folded cards (history: NEW → MOLECULES ON → Ctrl+Z; field-law F4, V2); red since every first-run window
   * arrived folded (503997b).  So a rack whose IN-FLOW content fits wears .rack-fits (overflow-y: hidden — the same picture at
   * rest, where there was no bar to lose, and a transform can no longer raise one); content past its height takes the class off
   * and the bar back.  Read, then written only on a change, in an animation frame — never inside a delivery; booked by a
   * ResizeObserver on the racks and on their cards' heads and bodies (the very boxes the dock and the motion already observe, so it
   * adds no new way to leave a notification undelivered) and by the racks' membership. */
  { const cols = [rack, rackL].filter(Boolean), seen = new WeakSet(); let booked = 0;
    /** the column's content bottom AS LAID OUT: offsetTop/offsetHeight ignore the motion's transforms; a hidden card has no offsetParent */
    const contentBottom = (r) => { let b = 0; for (const c of r.children) if (c.offsetParent === r) b = Math.max(b, c.offsetTop + c.offsetHeight); return b + (parseFloat(getComputedStyle(r).paddingBottom) || 0); };
    const fit = () => { booked = 0; const fits = cols.map((r) => contentBottom(r) <= r.clientHeight + 1);
      cols.forEach((r, i) => { if (r.classList.contains('rack-fits') !== fits[i]) r.classList.toggle('rack-fits', fits[i]); }); };
    const book = () => { if (!booked) booked = requestAnimationFrame(fit); };
    const fitRO = new ResizeObserver(book), see = (n) => { if (!seen.has(n)) { seen.add(n); fitRO.observe(n); } };
    const watch = () => { for (const r of cols) { see(r); for (const c of r.children) if (c.classList.contains('dev')) for (const n of c.children) if (n.matches('.dev-head, .dev-body')) see(n); } book(); };
    const members = new MutationObserver(watch); for (const r of cols) members.observe(r, { childList: true });
    watch(); }
  /* the kit's + list knows nothing of `hidden` (a legacy card, or one a molecule stood down): those rows go (BRIEF R5) */
  if (rk.el.add) rk.el.add.addEventListener('click', () => { for (const it of rk.el.addList.querySelectorAll('.mb-item[data-win]')) { const d = devById(it.dataset.win); if (d && d.hidden) it.remove(); } });
  if (rk.el.toggle) rk.el.toggle.addEventListener('click', () => saveSettings());   // wave 59 (B111): the kit's ◧ hides by setHidden alone; on a phone the press IS the browser saying which it wants, stored as the B key stores it
  /* the ☆ list's LOAD is the kit's apply; the extras follow from the same slot once its click is done (BRIEF R4) */
  if (rk.el.favList) rk.el.favList.addEventListener('click', (e) => {
    const it = e.target.closest('.mb-item'); if (!it || e.target.closest('.fav-x')) return;
    const L = rk.layouts()[[...rk.el.favList.querySelectorAll('.mb-item')].indexOf(it) - 1], R = L && (readSettings().layouts || {})[L.slot];
    if (R) queueMicrotask(() => { if (typeof R.docked === 'boolean' && R.docked !== layout.docked) layout.dockTransport(); layoutExtras(R); saveSettings(); });
  }, { capture: true });
  /** what the kit's readLayout does not carry: the TRANSPORT card's seat and state (`card: true`) and the folds a card keeps in the record */
  function layoutExtras(L) {
    for (const c of L.cards) {
      const d = devById(c.id); if (!d) continue;
      if (d === wTr.root) {
        layout.dockSide = sideKey(c.side) === 'left' ? 'L' : 'R'; layout.dockIndex = [...d.parentElement.querySelectorAll('.dev')].indexOf(d);   // project order owns the docked transport seat too
        d.classList.toggle('closed', !layout.docked);                // iteration 014 A0: the card is open exactly while the kit's bar is docked in it
        if (d.classList.contains('folded') !== !!c.folded) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
      }
      const mt = typeof c.more === 'boolean' ? d.querySelector('.mol-more-toggle') : null;   // an older record has no `more`: the fold stays as it is
      if (mt && (mt.getAttribute('aria-expanded') === 'true') !== c.more) mt.click();
      const ct = typeof c.core === 'boolean' ? d.querySelector('.orb-core-toggle') : null;   // likewise MO-REGISTRY's CORE fold
      if (ct && (ct.getAttribute('aria-expanded') === 'true') !== c.core) ct.click();
      /* iteration 011 Q2 · the folds INSIDE the card (lab/fold.js' presses, `data-fold`): `folds` names the open ones and is written only when one is, so a
         record without it (an older one, or the default) closes them all — the first run's minimized card (first-run.js `inner`) */
      for (const b of d.querySelectorAll('.lw-fold[data-fold]')) { const want = Array.isArray(c.folds) && c.folds.includes(b.dataset.fold); if ((b.getAttribute('aria-expanded') === 'true') !== want) b.click(); }
      /* iteration 008 A7 · SPECTRUM's folded shells (spectrum.js): `shells` is written only when it is not the default, so a record without it
         (an older one, or the default) folds n = 7 alone */
      if (c.id === 'spectrum') { const want = Array.isArray(c.shells) ? c.shells : SHELLS_FOLDED;
        for (const g of d.querySelectorAll('.picker .pk-n')) if (g.classList.contains('folded') !== want.includes(+g.dataset.n)) g.querySelector('.pk-nl').click(); }
    }
  }
  const layout = {
    toggleRack() { rk.setHidden(!rk.hidden); saveSettings(); },   // wave 59: on a phone the press IS the browser saying which it wants (see enterPhone)
    /** move a card to the other rack (or to a named side) — the MIRROR: same windows, either side */
    moveToRack(id, side) {
      const card = document.querySelector('.dev[data-id="' + id + '"]'); if (!card || !rackL) return false;
      const target = side === 'L' ? rackL : side === 'R' ? rack : (card.parentElement === rack ? rackL : rack);
      target.appendChild(card); return true;
    },
    /* WAVE 55: which rack a window BELONGS TO.  A floating card's parent is the float layer, so reading
       the parent would answer 'R' for a window whose home is the mirror rack — and `captureLayout`,
       `dockWindow` and the ⇄ all mean the HOME.  Ask the float record first. */
    side(id) { const st = rk.floatOf(id); if (st) return sideLR(st.home.side); const card = document.querySelector('.dev[data-id="' + id + '"]'); return card && card.parentElement === rackL ? 'L' : 'R'; },
    moveCard(id, index) { const list = [...rack.querySelectorAll('.dev')]; const card = list.find((d) => d.dataset.id === id); if (!card) return false; const rest = list.filter((d) => d !== card); const ref = rest[Math.max(0, Math.min(index, rest.length))] || null; rack.insertBefore(card, ref); return true; },
    order() { return [...rack.querySelectorAll('.dev')].map((d) => d.dataset.id); },
    orderAll() { return [...document.querySelectorAll('#rackL .dev, #rack .dev')].map((d) => d.dataset.id); },
    /** the kit's bar is docked (iteration 014 A0: lab/shell/transport.js createBar; the card below is its seat) */
    get docked() { const b = app.sh.transport && app.sh.transport.bar; return !!(b && b.docked); },
    dockSide: 'L',
    dockIndex: 0,                                                    // the transport's remembered slot in the left rack (0 = the very top)
    /** where a docked transport lives: the mirror rack on a desktop, the ONE rack on a phone (wave 51) */
    dockHost() { return document.body.classList.contains('phone') ? rack : (layout.dockSide==='R'?rack:(rackL || rack)); },
    /** T: dock the control surface into its card, or put it back on the stage (from the FREE window too) — the kit's setPlace (iteration 014 A4) */
    dockTransport() {
      const b = app.sh.transport && app.sh.transport.bar;
      if (b) b.setPlace(layout.docked ? 'stage' : 'rack'); else if (layout.docked) rk.close('transport'); else rk.open('transport', { index: layout.dockIndex });
      schedule(TIER.PRESENT);
      popFace(wTr.root);                                             // the pop chip and the bar's own dock chip say the same thing
    },
    /* ── the kit's float verbs under their 0.4.0 names (C3-DESIGN §2): a home side is 'L'/'R' here, 'left'/'right' in the kit ── */
    floating: () => rk.floating(),
    isFloating: (id) => rk.floating().includes(id),
    floatOf(id) { const st = rk.floatOf(id); return st ? { x: st.x, y: st.y, w: st.w, compact: !!st.compact, z: rk.floating().indexOf(id), home: { side: sideLR(st.home.side), index: st.home.index } } : null; },
    /** TAKE IT OFF THE RACK.  `at` overrides the landing spot and the home slot (a saved layout supplies both); the TRANSPORT's floating mode is the pill */
    popOut(id, at) {
      if (id === 'transport') { if (layout.docked) layout.dockTransport(); return true; }
      const a = { ...(at || {}), w: (at && at.w) || rackCardWidth() };
      if (at && at.home) a.home = { side: sideKey(at.home.side) || 'right', index: Math.max(0, at.home.index | 0) };
      return rk.float(id, a);
    },
    dockWindow(id) { if (id === 'transport') { if (!layout.docked) layout.dockTransport(); return true; } return rk.dock(id); },
    toggleFloat(id) { if (id === 'transport') { layout.dockTransport(); return true; } return rk.toggleFloat(id); },
    setCompact: (id, on) => rk.setCompact(id, on),
    /** the kit has no move for a float (BRIEF R1): dock and float it again at (x, y), clamped, in the same seat of the layer */
    moveFloat(id, x, y) { const st = rk.floatOf(id), d = devById(id), next = d && d.nextElementSibling; if (!st) return false; rk.dock(id); const ok = rk.float(id, { x, y, w: st.w, compact: st.compact, home: st.home }); if (next && next.parentElement === floats) floats.insertBefore(d, next); return ok; },
    raiseFloat: (id) => rk.floating().includes(id) && rk.float(id),
    /** every floating window home again — RESET LAYOUT, and any layout that predates floating */
    dockAll(remember) { const kept = {}; for (const id of rk.floating()) { if (remember) kept[id] = layout.floatOf(id); rk.dock(id); } return kept; },
    /** to the top of its rack, unfolded, the rack shown — or, floating, to the FRONT; a hidden legacy card comes back by id */
    raise(id) { const dev = devById(id); if (!dev) return false; dev.hidden = false; rk.raise(id); saveSettings(); return true; },
    /** the ids of windows that no longer exist, and the window that absorbed each of them (wave 56) */
    retired: RETIRED_WINDOWS,
    /** reopen a closed window into a rack (default: the one it was in) */
    reopen(id, side) { const dev = devById(id); if (!dev) return false; dev.hidden = false; rk.open(id, { side: sideKey(side) }); saveSettings(); return true; },
    closed() { return [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id); },
    /* ── FAVOURITE LAYOUTS (wave 54): capture, restore, and the four slots in this browser's settings key ──── */
    /** THE ARRANGEMENT, and nothing else.  Order is the ARRAY's order — restoring appends in it, which reproduces
     *  the order exactly — and the three per-card states are read off the classes that carry them. */
    captureLayout() {
      const nb = document.getElementById('notebook');
      /* WAVE 55: `v: 2` adds ONE optional key per card — `float` — and nothing else moved, so a v1 layout
         saved before this wave still loads: it simply has no card with a `float`, which is exactly what
         "nothing was floating" means.  A floating card keeps its HOME side and index in the record, not
         the layer it is sitting in, so docking it back after a load puts it where it came from. */
      return { v: 3, at: Date.now(),
        cards: [...document.querySelectorAll('#rackL .dev, #rack .dev, #floats .dev')].map((d) => {
          /* WAVE 59 · ON A PHONE `#rackL` IS EMPTY, so `d.parentElement === rackL` was false for EVERY card and
             every one was saved `side: 'R'`.  `enterPhone()` leaves `data-phone-from` on exactly the cards that
             came from the mirror rack — wave 51 created that breadcrumb for this — and `applyLayout` already
             read it; only the capture did not, and the asymmetry was the bug.  With the shipped arrangement
             (SPECTRUM lives on the LEFT rack out of the box) that meant: rotate a tablet past the breakpoint,
             press ☆, rotate back, load — and the mirror rack is empty for ever. */
          const st = rk.floatOf(d.dataset.id), mt = d.querySelector('.mol-more-toggle');   // 0.4.0 S0: MOLECULES' MORE fold is the card's own WORKSPACE key
          const ct = d.querySelector('.orb-core-toggle');                                      // 0.4.0 S1: MO-REGISTRY's CORE fold, the same kind of key
          const fs = [...d.querySelectorAll('.lw-fold[data-fold][aria-expanded="true"]')].map((b) => b.dataset.fold);   // iteration 011 Q2: the card's open inner folds
          const sh = d.dataset.id === 'spectrum' ? [...d.querySelectorAll('.picker .pk-n.folded')].map((g) => +g.dataset.n) : null;   // iteration 008 A7: the folded shells
          return { id: d.dataset.id, side: st ? sideLR(st.home.side) : (d.dataset.phoneFrom === 'left' || d.parentElement === rackL ? 'L' : 'R'),
            folded: d.classList.contains('folded'), closed: d !== wTr.root && d.classList.contains('closed'), off: d.classList.contains('off'),
            float: st ? { x: st.x, y: st.y, w: st.w, compact: !!st.compact, z: rk.floating().indexOf(d.dataset.id), index: st.home.index } : null,
            ...(mt ? { more: mt.getAttribute('aria-expanded') === 'true' } : {}), ...(ct ? { core: ct.getAttribute('aria-expanded') === 'true' } : {}),
            ...(sh && sh.join() !== SHELLS_FOLDED.join() ? { shells: sh } : {}), ...(fs.length ? { folds: fs } : {}) };
        }),
        docked: !!layout.docked, rackHidden: document.body.classList.contains('rack-hidden'),
        /* 0.3.1 · S1: the `look` and `cam` blocks this record carried are gone — applyLayout never read either, and between
           them they wrote the accents, the field chrome and the camera's feel (PREFERENCE) into every project and link. */
        nb: nb && nb.style.width ? [parseInt(nb.style.width, 10) || 0, parseInt(nb.style.height, 10) || 0] : null };
    },
    /** put it back: the kit's apply (a retired id opens its heir, a phone parks the floats, `nb` sizes the notebook), then the extras */
    applyLayout(L) {
      if (!L || !Array.isArray(L.cards)) return false;
      if (typeof L.docked === 'boolean' && L.docked !== layout.docked) layout.dockTransport();
      rk.apply(L); layoutExtras(L);
      if (document.body.classList.contains('phone')) parkedIds = L.cards.filter((c) => c.float && !c.closed && c.open !== false).map((c) => (RETIRED_WINDOWS[c.id] && !L.cards.some((q) => q.id === RETIRED_WINDOWS[c.id]) ? RETIRED_WINDOWS[c.id] : c.id));
      saveSettings(); schedule(TIER.PRESENT);
      return true;
    },
    layoutLabel: (L, slot) => rackLayoutLabel(readLayout(L, null, RETIRED_WINDOWS), slot),
    layouts: () => rk.layouts(),
    saveLayout: (slot) => rk.saveLayout(slot),
    loadLayout(slot) { const m = readSettings().layouts || {}; return m[slot] ? layout.applyLayout(m[slot]) : false; },
    forgetLayout: (slot) => rk.forgetLayout(slot),
    /** RESET LAYOUT: the kit's (every float home, every window opened, powered and unfolded, on its home rack, the rack shown); the transport's dock is λWAVES' */
    resetLayout() {
      rk.resetLayout();
      const ph = document.body.classList.contains('phone');
      if (ph) parkedIds = [];
      if (layout.docked !== ph) layout.dockTransport();                       // wave 51: on a phone the transport is DOCKED, not floating — reset does not undock it
      if (ph) rack.insertBefore(wTr.root, rack.firstElementChild);            // … and it goes back to the TOP of the one rack
      saveSettings();
    },
    /** an INFO panel's digest: every readout, the status, and the module's own table — as text for the notebook */
    digest(id) {
      const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (!dev) return '';
      const own = DIGESTS[id] ? DIGESTS[id]() : ''; if (own && own.md !== undefined) return own.md;   // a window whose copy is markdown (CALCULUS' prose figure) copies that alone
      const lines = ['λWAVES · ' + dev.querySelector('.dev-title').textContent + ' · t = ' + clock.t.toFixed(4) + ' · ' + new Date().toISOString()];
      const st = dev.querySelector('.dev-stat'); if (st && st.textContent.trim()) lines.push('status\t' + st.textContent.trim());
      for (const ro of dev.querySelectorAll('.ro')) { const l = ro.querySelector('.ro-lbl'), v = ro.querySelector('.ro-val'), s = ro.querySelector('.ro-sub'); lines.push([l ? l.textContent.trim() : '', v ? v.textContent.trim() : '', s ? s.textContent.trim() : ''].join('\t')); }
      if (own) lines.push('', own);
      return lines.join('\n');
    },
    /** THE ONE CLIPBOARD ROAD for a window's copy: write the text, flash `copied` on the window (· COPIED on its status line) */
    async copyText(id, t) { try { await navigator.clipboard.writeText(t); } catch (e) {} const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (dev) { dev.classList.add('copied'); setTimeout(() => dev.classList.remove('copied'), 900); } return t; },
    copyDigest(id) { return layout.copyText(id, layout.digest(id)); },
  };
  /** a window's hover hint in the + list and the WINDOW menu: its long title, and its status when it says something (wave 44) */
  const winHint = (d) => { const t = (d.querySelector('.dev-title') || {}).textContent || '', st = ((d.querySelector('.dev-stat') || {}).textContent || '').trim(); return st ? t + '  ·  ' + st : t; };
  const wTr = device({ id: 'transport', eyebrow: 'CONTROL SURFACE', status: '' });   // iteration 014 A1: the card's word (its id stays `transport`)
  wTr.root.classList.add('closed'); (rackL || rack).appendChild(wTr.root);
  windowActivity.track(wTr);
  /* iteration 014 A0 · the kit's bar docks HERE: the card is λWAVES' (its slot, its fold, `card: true`), the move is the kit's (transportDock's hooks) */
  const barDock = () => transportDock(rk);
  rk.register({ id: 'transport', el: wTr, title: 'CONTROL SURFACE', card: true, onFold: () => saveSettings(),   // C3: an app card (its own buttons; in neither + nor WINDOW)
    onOpen: () => {
      const host = layout.dockHost(), cards = [...host.querySelectorAll('.dev')].filter((d) => d !== wTr.root);
      host.insertBefore(wTr.root, cards[Math.min(layout.dockIndex, cards.length)] || null);
      wTr.root.classList.remove('folded'); wTr.body.hidden = false;
      const d = barDock(); if (d.open) d.open({ body: wTr.body });
    },
    onClose: () => {
      layout.dockSide = wTr.root.parentElement === rackL ? 'L' : 'R'; layout.dockIndex = Math.max(0, [...wTr.root.parentElement.querySelectorAll('.dev')].indexOf(wTr.root));
      const d = barDock(); if (d.close) d.close();
    } });
  popFace(wTr.root);
  { const p = wTr.root.querySelector('.dev-pop'); if (p) p.addEventListener('click', (e) => { e.stopPropagation(); layout.dockTransport(); }); }
  const phone = { on: false, applied: false, DPR: 1.5, wasDocked: false, wasRes: 0, wasSteps: 0, wasScale: 0, wasFrost: 'off' };
  function enterPhone() {
    /* WAVE 55 · THE PHONE HAS NO FLOATING, and ONE RACK: the kit's crossing (createRack `phone`) has already docked every float
       (remembered, so the crossing is reversible — wave 51's law) and folded the mirror rack into the one rack, each card
       marked `data-phone-from="left"`; this half is the transport, the phone's rack default and the low-power path. */
    /* THE TRANSPORT DOCKS AT THE TOP OF THE RACK, and it is HIDEABLE, NEVER CLOSABLE: the × stands down in
       CSS at this breakpoint, ▾ is the hide, and which way it was left is this browser's to remember. */
    phone.wasDocked = layout.docked;
    if (!layout.docked) layout.dockTransport();
    rack.insertBefore(wTr.root, rack.firstElementChild);
    wTr.root.classList.remove('closed');
    const s = readSettings();
    wTr.fold(s.phoneTr === true);
    document.body.classList.toggle('rack-hidden', readSettings().phoneRack !== true);
    /* THE LOW-POWER PATH, once per page.  Every one of these is a DEFAULT, not an override: a value this
       browser has SAID in SETTINGS still wins, exactly as CARD STYLE's default does. */
    if (!phone.applied) {
      phone.applied = true;
      if (field.setDprCap) field.setDprCap(phone.DPR);              // 3 physical pixels per CSS pixel of a ray-marched volume buys nothing at arm's length
      /* ⚠ WAVE 106 · THE PHONE STOPPED GETTING ITS LOW-POWER PATH WHEN 64³ BECAME THE DEFAULT.
         This was ONE branch doing TWO jobs, and wave 101 silently switched it off.  The grid, the
         march steps and the render scale were all set inside `gridSeg.get() !== '64'` — which was
         true for every phone while the shipped grid was 96³.  Wave 101 made 64³ the default (the
         `quality` seed above), so on a fresh profile the segment ALREADY reads '64', the whole
         branch is skipped, and the two values that have nothing to do with the grid are skipped
         with it: steps stays 160 where the phone wants 110, and scale stays 1 where it wants 0.75.
         That is ~1.78x the pixels and ~1.45x the ray-march steps, on the device least able to pay
         for them — and it is invisible, because the grid it was bundled with happens to land right.
           The exit path's own ladder (below) already states the pairing: 64 -> 110 steps, 0.75
         scale.  So the GRID move stays conditional — only a phone that arrives on 96³ or 128³ has
         a grid to remember and give back — and the two POWER values are applied unconditionally and
         remembered separately, which is what they always should have been. */
      if (ui.gridSeg) {
        /* …AND THE GUARD READS THE GRID, NOT THE WIDGET.  `ui.gridSeg.get()` is what the SEGMENT is
           showing; `quality.res` is what the field is actually marching.  They can disagree — any
           road that sets the resolution without moving the segment leaves the seg saying '64' over a
           96³ volume — and this branch's job is to make the GRID 64, so it must ask the grid.  Asking
           the widget is how the whole path came to be skipped in the first place. */
        if (quality.res !== 64) { phone.wasRes = quality.res; ui.gridSeg.set('64'); quality.res = 64; }
        phone.wasSteps = quality.steps; phone.wasScale = quality.scale;
        quality.steps = 110; quality.scale = 0.75;
      }
      if (s.governor === undefined) setGovernor(true);
      /* WAVE 67 · FROST GOES OFF ON A PHONE, and now UNCONDITIONALLY — it used to be `if nothing stored`,
         which stopped protecting anything the moment the policy started persisting a value.  A phone paints
         every frame on a low-power GPU and skin.css already strips every other backdrop-filter at this
         breakpoint; a backdrop over the field is the one thing this device cannot afford.  Remembered and
         given back on the way out, which is wave 51's law: the crossing is reversible in both directions.
         (The DISCONNECTED window fuses here too, in CSS, on BASINS' own FR_COMPACT_W law — a constellation
         needs air and a 390-px screen has none — so there is nothing to remember for it.) */
      phone.wasFrost = look.get('frost'); setFrost('off');
      if (s.keepFrames === undefined) setKeepFrames(false);
      schedule(TIER.REBUILD);
    }
  }
  function leavePhone() {
    /* the crossing is REVERSIBLE in both directions: the cards go back to the rack they came from, the transport
       to the dock state it had, and the grid to the one the phone stepped down from — unless the hand changed it
       in the meantime, in which case the hand wins. */
    if (phone.wasFrost !== 'off' && look.get('frost') === 'off') setFrost(phone.wasFrost);   // wave 67: the policy the desktop crossed with
    if (layout.docked !== phone.wasDocked) layout.dockTransport();
    if (phone.wasRes && ui.gridSeg && ui.gridSeg.get() === '64') { ui.gridSeg.set(String(phone.wasRes)); quality.res = phone.wasRes; quality.steps = { 64: 110, 96: 160, 128: 240 }[phone.wasRes]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[phone.wasRes]; }
    /* wave 106: …and the crossing is reversible in the case where the GRID never moved, which is now
       the common one.  Without this the desktop keeps the phone's 110 steps and 0.75 scale for the
       life of the page — the same bug in the other direction, and the one the split above creates
       if only its first half is written. */
    else if (phone.wasSteps) { quality.steps = phone.wasSteps; quality.scale = phone.wasScale; }
    phone.wasSteps = 0; phone.wasScale = 0;
    parkedIds = [];                                                    // the kit has put the parked floats back on the stage
    phone.applied = false;
    if (field.setDprCap) field.setDprCap(2);
    schedule(TIER.REBUILD);
  }
  const tablet = { on: false, DPR: 1.5, steps: 110 };   // isTablet() itself sits beside isPhone() at the top (W125: the first-run material asks it before any window exists)
  app.sh.rk = rk; app.sh.layout = layout; app.sh.phone = phone; app.sh.tablet = tablet; app.sh.winHint = winHint; app.sh.devById = devById;
  if (app.sh.transport && app.sh.transport.bar) app.sh.transport.bar.start();   // the bar's dock is wired now that its rack and card exist
  function syncPhone() {
    app.state.cornerLayoutDirty=true;
    const on = isPhone();
    if (on !== phone.on) {
      phone.on = on; document.body.classList.toggle('phone', on);
      if (on) enterPhone(); else leavePhone();
    }
    tablet.on = isTablet();
    /* OPTIMIZATION 2026-09-24 · M3 (L6): a field that never came up (no WebGPU, no adapter, a device lost before
       createField finished) is createField's method-less failure object, and this line threw "boot failed —
       field.setDprCap is not a function" instead of leaving rack.js:762's banner up.  The METHOD is tested, not
       `field.ok`: a device lost after boot keeps its methods and keeps today's behaviour byte for byte. */
    if (field.setDprCap) field.setDprCap(phone.on ? phone.DPR : tablet.on ? tablet.DPR : 2);   // N5: the two DPR fields are READ (both 1.5; tablet.DPR was written and never read)
    schedule(TIER.PRESENT);
    return on;
  }
  function wireStage() {   // §19a's second seat: boot() calls it after createNotebook(app), where these statements stood
  window.addEventListener('resize', syncPhone, { passive: true });
  window.addEventListener('orientationchange', syncPhone, { passive: true });
  layout.phone = { get on() { return phone.on; }, get dprCap() { return field.dprCap; }, get transportFolded() { return wTr.root.classList.contains('folded'); }, get parkedFloats() { return phone.on ? parkedIds.slice() : []; }, sync: syncPhone };
  layout.tablet = { get on() { return tablet.on; }, get dprCap() { return field.dprCap; }, get stepCap() { return field.stepCap; }, sync: syncPhone };
  /* Stage gestures own pointer lifetimes; these callbacks own the instrument.  0.5.0 C9 · `ui` is UI SPACE for the stage's scene guard:
     every window on the float layer by its WHOLE rect (the modulation window with its rail and work bars, a floated card: the gaps
     between their parts are UI, not picture) and the app's own panes.  A press there never reaches the stage.  0.5.0 C3: the kit's rack
     hands in its columns (less their shadow gutter) and its float layer (C9's open item). */
  bindStageGestures(dom.canvas, {
    ui: uiSpace({ rack: rk, extra:() => ['transport', 'notebook', 'sheet', 'offer', 'rackAddList', 'rackFavList'].map((id) => document.getElementById(id))   // 0.5.3 M4: a faded, hidden or
      .map((el) => { const s = el && getComputedStyle(el); return s && +s.opacity > 0 && s.visibility !== 'hidden' && s.pointerEvents !== 'none' ? paintedRect(el) : null; }) }),   // click-through pane is no UI space
    camera, travel: camTravel, law: CAM,
    getDistance: () => obs.dist, zoomAt, pan: panBy, orbitBy, resetView,
    setDragging: value => { app.state.dragging = value; },
    present: () => schedule(TIER.PRESENT),
    startSpecial(e) {
      if (e.ctrlKey) {
        bowStart(e);
        return { move: bowMove, end: bowRelease, cancel: bowCancel };
      }
      const r = dom.canvas.getBoundingClientRect();
      if (!e.shiftKey && kepler.on) {
        const hit = kepler.hit(e.clientX - r.left, e.clientY - r.top);
        if (hit) {
          app.state.kdrag = { n: hit.n, id: e.pointerId }; dom.canvas.classList.add('kdrag');
          const end = () => { app.state.kdrag = null; dom.canvas.classList.remove('kdrag'); };
          return {
            move(event) {
              const rect = dom.canvas.getBoundingClientRect();
              keplerDragTo(hit.n, event.clientX - rect.left, event.clientY - rect.top);
              schedule(TIER.RECONSTRUCT);
            },
            end, cancel: end,
          };
        }
      }
      return null;
    },
    hover(e) {
      if (app.state.bow || !kepler.on) return;
      const r = dom.canvas.getBoundingClientRect(), hit = kepler.hit(e.clientX - r.left, e.clientY - r.top);
      kepler.setHover(hit); dom.canvas.classList.toggle('khover', !!hit);
    },
  });
  new ResizeObserver(() => schedule(TIER.PRESENT)).observe(dom.canvas);
  }
  return { rk, layout, wTr, tablet, syncPhone, wireStage };
}
