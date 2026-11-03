/* lab/shell/keys.js — §20–§23 (0.5.2 R3b): THE KEY TABLE'S FEED (021 I1: the rows are lab/actions.js's registry) on MIR's ONE KEY TABLE (lab/key-table.js), the
 * KEYBOARD window and THE TIMELINE (the kit's; THE FOCUS LAW's scoped rows), toggleUI and THE TAB ORDER.  createKeys(app) runs at its seat; keyState
 * and kt are registered on app.sh (KEPLER, SPECTRUM, the menubar); the history's historyApi is read there at use. */
import { TIER } from '../tier.js'; import { setGlyph } from '../mir/glyph.js';
import { createKeyTable, keysOf } from '../key-table.js'; import { createKeyboardWindow } from '../mir/keyboard/keyboard.js'; import { installTimeline } from '../mir/timeline/bind.js';
import { paintedRect } from '../occlusion.js'; import { createMapping } from '../mapping.js'; import { mirGui } from '../mir-gui.js'; import { ASK_ENABLED } from '../ask.js'; import { readout, el, hint, label } from '../mir/kit.js'; import { formatSeconds } from '../mir/timeline/time-format.js';
export function createKeys(app) {
  const { dom, ui, clock, appPlay, mat, settingsStore } = app, { schedule } = app.loop, { floats, rack, rackL } = app.host;
  const { devById, layout, readSettings, rk, setModArm } = app.sh, { wState } = app.w, { occlusion } = app.ctl;
  /* ── KEYS · 021 I1: the rows are THE ACTION REGISTRY's (lab/actions.js); this module is the key table's feed — every row the registry may bind
     (not a verb's argument form) on MIR's ONE KEY TABLE (lab/key-table.js): the one listener, the save, the binding law.  A key runs the action
     with { fine } (Shift is the fine step); THE ONE WRAPPER (keyEdit) names the history row for every surface that runs it, a key or not. ── */
  const A = app.sh.ACTIONS, { keyState } = A;
  const stageHasFocus = () => document.activeElement === dom.canvas;
  /* S4 · A KEY'S EDIT IS A ROW OF ITS OWN, named for its action: an edit still pending under another name commits first; a held key repeats under one
     name and stays one row; a key that changed nothing drops its name like any gesture.  An undo is not an edit (`undo: 'travel'`), nor a NODES key. */
  const keyEdit = (a, run) => {
    if (!app.state.history || app.state.history.holding || a.undo === 'travel' || a.undo === 'none' || /^timeline\.(undo|redo)$/.test(a.id)) return run();
    const name = a.label + ' · ' + kt.keyText(a.id);
    if (app.state.history.pendingLabel !== name) app.state.history.flush();
    run(); app.state.history.note(name);
  };
  const feed = (r) => ({ ...r, run: (f) => A.run(r.id, { fine: f, shift: f !== 1 }), up: r.up && (() => r.up()) });
  A.sync();
  const kt = createKeyTable({ rows: A.list().filter((r) => r.bind !== false).map(feed), stageHasFocus, keep: ASK_ENABLED ? [] : ['ask'] });   // 0.5.0 C3: the one listener, the save, the binding law
  A.setEdit(keyEdit);
  A.onAdd((rows) => kt.table.add(rows.filter((r) => r.bind !== false).map((r) => { const x = feed(r); return { id: x.id, label: x.label, group: x.group, short: x.short, keys: keysOf(x),
    repeat: true, overControls: true, when: x.when, run: (e) => x.run(e && e.shiftKey ? 0.25 : 1), up: x.up }; })));   // a row the registry learns later (a window registered after boot)
  /* ── 0.5.0 C3 · THE KEYBOARD WINDOW is the kit's createKeyboardWindow (keymap.js left): the drawn board, the platform switch, RECORD /
     RESET, the search and the list, the steal on a second press, Escape's three steps, the drag — on the float layer (UI space for the
     scene guard), its move telling the occlusion (CLAUDE.md).  Its paint is λWAVES' charcoal-blue skin (lab.css §KEYBOARD, R5-S3).  Its
     place is remembered as it was ({ x, y } in lw.keyboard.position.v1, PREFERENCE); focus goes in on open and back out on close. */
  {
    const KB_AT = 'lw.keyboard.position.v1';
    let back = null;
    const mapping = A.mapping = createMapping(app, { kt });   // 021 I2: THE MAPPING (lab/mapping.js), the window's second face; its targets install once the facade exists (rack.js)
    const kb = createKeyboardWindow({ keys: kt.window, host: floats, panels: [{ name: 'MAPPING', body: mapping.root, icon: 'mapping' }],
      onMoved: (r) => { occlusion.dirty(); const f = document.activeElement; if (r === null && back && back.isConnected && (!f || f === document.body || kb.win.root.contains(f))) back.focus({ preventScroll: true }); },
      persist: { read() { try { return JSON.parse(localStorage.getItem(KB_AT)); } catch (_) { return null; } },
        write(st) { try { if (st.x !== null) localStorage.setItem(KB_AT, JSON.stringify({ x: st.x, y: st.y })); } catch (_) {} } } });
    for (const n of [kb.win.root, kb.win.rail && kb.win.rail.el]) occlusion.watch(n, { attributes: true, attributeFilter: ['hidden'] });   // its `hidden` lands when the exit ends: the paused mask lets go then
    let esc = null;   // 021 I1: the window is a layer of THE ESCAPE STACK while it is open (lab/actions.js)
    layout.keymap = {
      open(face) { if (!kb.isOpen()) { back = document.activeElement; kb.open(); if (esc) esc(); esc = A.escape.push(() => kb.close(), { alive: () => kb.isOpen() }); } if (face) kb.tab(face); mapping.paint(); const k = kb.root.querySelector('.km-key[tabindex="0"]'); (k && k.offsetParent ? k : kb.root.querySelector('.km-action-row') || kb.root).focus({ preventScroll: true }); return true; },
      close() { kb.close(); return false; },
      toggle() { return kb.isOpen() ? layout.keymap.close() : layout.keymap.open(); },
      get isOpen() { return kb.isOpen(); },
    };
    layout.keysheet = layout.keymap;   // the '?' LIST sheet of wave 53 is gone; the window is the one bindings surface
    /* Escape: inside the window the kit's three steps (a recording, the search, the window); from anywhere else THE ESCAPE STACK closes the topmost
       layer (the window among them, wave 106), and with none open the stage hands the keyboard back to the interface (wave 57) */
    window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && !e.defaultPrevented && stageHasFocus()) dom.canvas.blur(); });
    kt.table.hints(document); kt.table.onChange(() => kt.table.hints(document));   // every [data-key-action] says its live chord (aria-keyshortcuts)
  }
  /* ── 0.5.0 C7b · THE TIMELINE is the kit's installTimeline (TIMELINE.md) on λWAVES' ONE modulation host: its `mod` is this seam (bind.js
     reads host, registry, play, arm, armed, onPlay, setTimeline), so it builds no second host and no tick.  Its play is THE play (clock.js
     onePlay), its playhead paints from loop()'s present, the arrangement is the host clock's automation and rides in serialize()
     (presentation.timeline) with its own undo; λWAVES' pill stays the one transport (R9), the window a WORKSPACE record (`tlwin`) that
     ships closed (R1).  Its rows join the ONE KEY TABLE; its UNDO / REDO are the two rows added below it. */
  if (app.state.modHost && app.state.modView) {
    /* iteration 014 A5 · THE WORK BAR (Josh: "the timeline should now have the basic tempo, play/pause button and the likes for a 'work bar'"):
       the kit's own work-bar transport (timeline/window.js, BASINS' TIMELINE_TRANSPORT less the dock) — play is THE play, power the MOD
       bypass, the BPM pill the one tempo model, ⏮ the beat to 0, the door the modulation window — with λWAVES' t as its readout.  It is
       its own bar: λWAVES' stage strip stays where it is.  The readout paints with the playhead (rack.js loop: 5 Hz playing, every paused
       present; `set` writes only a changed string). */
    const tlRo = readout({ label: 't', value: '0.00', cls: 'time' }); let tlWall = 0;
    const compact = (v, at, d) => (Math.abs(v) < at ? v.toFixed(d) : v.toExponential(d).replace('e+', 'e'));   // the stage strip's clockText form (A9: with the lap)
    /* 032 T4 · THE PLAYLIST'S TIME (Josh: "a playlist time 0:00 beside t ="): the playhead's beat as m:ss.d at the tempo in force (the kit's
       formatSeconds), its own readout beside t in t's face, painted with it — t is ψ's time, TIME the arrangement's */
    const tlSec = readout({ label: 'TIME', value: '0:00.0', cls: 'time tl-clock' }), M = app.state.modHost.model;
    ui.tlTime = { root: tlRo.root, paint(now) { const on = clock.playing; if (on && now - tlWall < 200) return; tlWall = now; const t = clock.t, lap = Math.floor(t / clock.window);
      tlRo.set(compact(t, 1e5, 2) + (lap ? '  (' + compact(lap, 1e4, 1) + ')' : ''), on ? 'live' : '');
      const T = M.transport; tlSec.set(formatSeconds((T.beats || 0) * 60 / (T.bpm || 120), true), on ? 'live' : ''); } };
    /* 025 C2 · THE TIMELINE'S DOOR: a RENDER chip on the work bar (the rail takes no app chip — its chips are fixed when the window is made —
       so it rides the bar's own `app:` seat, as the t readout does): the RENDER card in front on SELECTION when one is marked, else ACTIVE */
    const tlRender = el('button', 'tbtn tl-render'); tlRender.type = 'button'; tlRender.dataset.keyAction = 'render.timeline';
    setGlyph(tlRender, 'film', { label: 'render this range' }); hint(tlRender, 'render this range'); tlRender.addEventListener('click', () => app.sh.ACTIONS.run('render.timeline'));
    app.state.tl = installTimeline({ mount: floats, present: () => schedule(TIER.PRESENT), say: (m) => wState.setStatus(m, 'warn'),
      mod: { host: app.state.modHost, registry: app.state.modHost.registry, get view() { return app.state.modView; },   // 032 T20: view.api.armFor → the clip menu's ROUTE NEW PARAMETER…
        armed: () => app.state.modArm, arm: (on) => setModArm(!!on), onPlay: appPlay.onChange, setTimeline: (x) => app.state.modView.setTimeline(x),
        isOpen: () => !!(app.state.modView && app.state.modView.isOpen), toggle: () => layout.modulation && layout.modulation.toggle(), persist: () => ui.saveNative && ui.saveNative(),   // A5: the work bar's door and tempo
        play: (on) => { if (on) appPlay.play(); else appPlay.pause(); schedule(TIER.EVOLVE); return { ok: true, playing: clock.playing }; } },
      dock: { span: rk.span() }, initial: { dock: 'bottom', open: false }, keys: kt.table, project: false, audio: false,
      transport: { layout: [{ group: 'native-play-row', items: ['play', 'power', 'tempo', 'app:readout', 'app:clock', 'rewind', 'app:render'] }, 'door'], nodes: { readout: tlRo.root, clock: tlSec.root, render: tlRender }, seats: 'thin',
        door: 'none',   // 021 V2: dressed below with the table's `modulation` (an SVG, no mask)
        onSwitch: () => { app.state.tl.close(); layout.modulation.expand(); } },   // 015 T5: the timeline's door SWAPS to the modulation window, as that window's switch swaps back   // A9: the modulation window's own icon, no MIR logo (Josh 10-22)
      store: { read: () => readSettings().tlwin || null, write: (s) => settingsStore.write({ ...readSettings(), tlwin: s }) },
      busy: () => app.state.capApi.busy, moved: (r) => app.state.dodge(r, 'tl'), onWindow: () => occlusion.dirty(),
      /* iteration 004 · MIR OPTIONS › SAMPLING › SCRUB is how a ruler drag seeks (BASINS shell.js: the kit's controller reads it at each
         scrub's start): LIVE every move, LIGHT one in three, RELEASE when the hand lets go */
      scrubLevel: () => { const g = mirGui(); return g ? g.sampling().scrub : 'live'; } });
    { const d = app.state.tl.root.querySelector('.tl-transport .mod-exp'); if (d) setGlyph(d, 'modulation'); }   // 021 V2: the work bar's door wears the modulation window's own icon (A9)
    /* 032 T8 · MOD ON THE TIMELINE'S POWER (Josh: "MOD word on the timeline's toggle; the power icon stays on the modulation window"): the work bar's
       power seat wears the kit's word face — modPower({ word }), as the CSB's — dressed here as the door is (the timeline's transport takes no powerWord) */
    { const p = app.state.tl.root.querySelector('.tl-transport .mir-mod-power'); if (p) { p.dataset.face = 'word'; label(p, 'MOD'); } }
    /* 032 T24 · A HEAVY SWITCH HOLDS THE PLAY (Josh: "heavy switches pause real-time playback"): while the timeline plays and the busy count is up (a
       solve, a basis — busyWrap brackets every worker call), the realtime pump is held through the scrub's own door (host.clock.suspendRealtime), so the
       arrangement waits for the picture instead of running ahead of it; released on the count's zero.  A film steps frame-exact and already owns the
       pump (suspendRealtime answers null then): untouched */
    { let release = null; const C = app.state.modHost.clock, now = () => performance.now() / 1000;
      const filming = () => !!(app.state.capApi && app.state.capApi.busy) || C.isRealtimeSuspended() || C.isStepping();   // a film (or a scrub) owns the clock: never held
      app.ctl.busy.onHold = (on) => { if (on && !release && C.isPlaying() && !filming()) release = C.suspendRealtime(now()); else if (!on && release) { release(now()); release = null; } }; }
    /* 021 R3 · TWO ⏮, EACH SAYS WHAT IT MOVES: the work bar's sends the modulation beat and the TIMELINE playhead to bar 1 and leaves ψ's t
       (the main bar's ⏮ moves t); one position spanning both is a kit door for 1.5.6 (docs/FOR-MIR.md) */
    { const h = app.state.tl.root.querySelector('.transport-home'); if (h) { h.title = 'beat → bar 1 · the TIMELINE playhead to the start'; h.setAttribute('aria-label', 'timeline back to bar 1'); } }
    /* the window draws no pane of its own: its ruler, lanes and work bar are each a .glass pane (a lane clipped by the scroller), its rail chips */
    occlusion.register('timeline', () => app.state.tl.isOpen() ? [...app.state.tl.root.querySelectorAll('.glass'), ...(app.state.tl.rail.el ? app.state.tl.rail.el.querySelectorAll('.mir-chip') : [])].map((s) => paintedRect(s, s.closest('.tl-viewport'))) : []);
    for (const n of [app.state.tl.root, app.state.tl.rail.el]) occlusion.watch(n, { attributes: true, attributeFilter: ['hidden'] });
    /* iteration 007 (the MIR check, B1) · THE TIMELINE'S OWN UNDO: without a `history` the kit offers its undo and redo as rows named
       'undo' / 'redo' (timeline/shortcuts.js) — λWAVES' own ids, already in the table, so the kit's were dropped unheard and Ctrl+Z over a
       focused timeline undid a λWAVES edit while the clip stayed.  These two carry the timeline's ids and its `when` (keysLive: the window
       open, the focus in its surface), and THE FOCUS LAW (lab/key-table.js) hands them the chord for exactly that focus; everywhere
       else Ctrl+Z is λWAVES' (T9: the two stacks stay apart). */
    { const tl = app.state.tl, live = () => !!(tl.editor && tl.editor.keysLive());
      kt.table.add([
        { id: 'timeline.undo', label: 'UNDO', group: 'TIMELINE', hint: 'Undo the last timeline edit (the timeline’s own undo)', keys: ['Mod+Z'], when: live, run: () => tl.editor.act.undo() },
        { id: 'timeline.redo', label: 'REDO', group: 'TIMELINE', hint: 'Redo the last undone timeline edit', keys: ['Mod+Shift+Z', 'Mod+Y'], when: live, run: () => tl.editor.act.redo() }]); }
    /* a ROUTED dial's hold and right-click stay its ring's (RANGE · REMOVE · RESET): the kit's TIMELINE CLIP (timeline/knobs.js, 500 ms,
       document capture) and the ring (600 ms) claim one gesture, so the window's capture hides that dial's id from the timeline for the
       one event and gives it back right after the timeline has looked (brief B13); an unrouted dial's hold is TIMELINE CLIP's */
    for (const type of ['pointerdown', 'contextmenu']) window.addEventListener(type, (e) => { const k = e.target.closest && e.target.closest('.k[data-param]');
      /* iteration 007 (the MIR check, B1): only the DIAL BODY and the left button — what the kit's hold itself reads (`.k-dial`, button 0:
         timeline/knobs.js) — so a press on the ring's badges (×, the RANGE dial) keeps the stamp that the window's focusAway reads to
         keep the ring's focus; hidden there, × did nothing and the RANGE dial vanished under the hand */
      const dial = e.target.closest && e.target.closest('.k-dial');   // the RANGE badge is a knob of its own inside the host: its dial is not the host's
      if (!k || !dial || dial.closest('.k') !== k || (type === 'pointerdown' && e.button !== 0)) return;
      if (!app.state.modHost.model.routesOfTarget(k.dataset.param).some((r) => !r.dormant)) return; const id = k.dataset.param; k.removeAttribute('data-param');
      document.addEventListener(type, () => { k.dataset.param = id; }, { capture: true, once: true }); }, true);
  }
  function toggleUI() {
    const on = document.body.classList.toggle('ui-hidden');
    app.state.uiHidden = on;
    /* 034 M4 · THE FLAG ALONE: the kit's layered `body.ui-hidden #title { display: none !important }` (mir/shell/shell.css) outranks every
       unlayered rule, so under H the title is kept in paint by its own style (an element's important style is read before the layers);
       lab.css hides its λ and WAVES, leaving the MIR flag (FOR-MIR: a door for this) */
    const title = document.getElementById('title'); if (title) title.style.setProperty('display', on ? 'flex' : '', on ? 'important' : '');
    if (on) { ui.frameWas = mat.frame; ui.axisWas = mat.axis; mat.frame = false; mat.axis = false; }
    else { if (ui.frameWas !== undefined) mat.frame = ui.frameWas; if (ui.axisWas !== undefined) mat.axis = ui.axisWas; app.state.metersWall = 0; app.state.govVersion = -1; }
    if (ui.frameSw) ui.frameSw.set(mat.frame !== false); if (ui.axisSw) ui.axisSw.set(mat.axis !== false);
    schedule(TIER.PRESENT);
  }
  let tabIdx = 0, tabOrder = null;                                 // the cycle runs over the windows' ORIGINAL order
  /* ── THE TAB ORDER, STATED (wave 55) ────────────────────────────────────────────────────────────
   * THE MIRROR RACK top to bottom, then THE RIGHT RACK top to bottom, then WHATEVER IS FLOATING,
   * back-most first — captured at the first TAB of the session and never rebuilt.  It is frozen because
   * the ACT moves a card to the top of its rack: a re-read order would bounce between two windows for
   * ever.  And because the array holds the ELEMENTS, A WINDOW KEEPS ITS SEAT when it pops out or docks
   * back — the cycle walks the same list on the stage as in the rack, which is the whole point.
   * "To the top" means the top of its rack for a docked window and the FRONT OF THE STACK for a floating
   * one; either way it is unfolded, and a rail is opened back to full, because TAB's promise is that the
   * window it names is the one you can now read. */
  function cycleWindow(dir) {
    if (!tabOrder) tabOrder = [...(rackL ? rackL.querySelectorAll('.dev') : []), ...rack.querySelectorAll('.dev'), ...(floats ? floats.querySelectorAll('.dev') : [])];
    const n = tabOrder.length; if (!n) return;
    const fl = rk.floating(), front = fl.length ? devById(fl[fl.length - 1]) : null;
    const isTop = (d) => (d.classList.contains('floating') ? d === front : d === (d.parentElement || rack).querySelector('.dev:not([hidden])'));
    let i = tabIdx, guard = 0;
    do { i = (i + dir + n) % n; guard++; } while ((tabOrder[i].hidden || tabOrder[i].classList.contains('closed') || isTop(tabOrder[i])) && guard < 2 * n);
    tabIdx = i;
    const dev = tabOrder[i];
    if (dev.classList.contains('floating')) { rk.float(dev.dataset.id); if (dev.classList.contains('compact')) layout.setCompact(dev.dataset.id, false); }
    else { (dev.parentElement || rack).prepend(dev); (dev.parentElement || rack).scrollTop = 0; }
    if (dev.classList.contains('folded')) { const f = dev.querySelector('.dev-fold'); if (f) f.click(); }
    dev.classList.add('tab-hot'); setTimeout(() => dev.classList.remove('tab-hot'), 600);
  }
  app.hooks.keys = {
    get actions() { return A.list(); },   // 021 I1: the registry's rows (chords: table.chords(id))
    bind: kt.bind, conflicts: kt.conflicts, reset: kt.reset,   // 0.5.0 C3: λWAVES' binding law over the kit's table (lab/key-table.js)
    /* optimization N4: capture(id) and the dispatcher's capture branch served only the SETTINGS KEYS chips that 5f6421e
       deleted; the keyboard editor records its chords itself.  `capturing` stays readable (the legacy gate reads it). */
    name: (a) => kt.keyText(a.id), get capturing() { return null; },
    /* WAVE 55: the frozen cycle, readable and re-freezable — the ONE road to a stated order rather than a
       gate re-deriving it from the DOM and calling its own guess the law. */
    get tabOrder() { return (tabOrder || []).map((d) => d.dataset.id); },
    resetTabs() { tabOrder = null; tabIdx = 0; return true; },
    toggleUI, cycleWindow, table: kt.table,
  };
  app.sh.keyState = keyState; app.sh.kt = kt; app.sh.stageHasFocus = stageHasFocus;
  return { stageHasFocus, keyState };
}
