/* lab/shell/keys.js — §20–§23 (0.5.2 R3b; moved verbatim out of lab/rack.js boot()): keyState, the ACTIONS rows on MIR's ONE KEY TABLE (lab/key-table.js), the
 * KEYBOARD window and THE TIMELINE (the kit's; THE FOCUS LAW's scoped rows), toggleUI and THE TAB ORDER.  createKeys(app) runs at its seat; keyState, ACTIONS
 * and kt are registered on app.sh (KEPLER, SPECTRUM, the menubar); the history's historyApi is read there at use. */
import { TIER } from '../rack.js'; import { VIEW, VIEW_NAMES, STYLE, STYLE_NAMES } from '../field.js'; import { CAM } from '../camera-law.js'; import { STAGE_BINDINGS } from '../stage-gestures.js';
import { createKeyTable } from '../key-table.js'; import { createKeyboardWindow } from '../mir/keyboard/keyboard.js'; import { installTimeline } from '../mir/timeline/bind.js';
import { infoActions } from '../mir/info/layer.js'; import { paintedRect } from '../occlusion.js'; import { mirGui } from '../mir-gui.js';
export function createKeys(app) {
  const { dom, ui, reg, clock, appPlay, obs, mat, settingsStore } = app, { schedule } = app.loop, { floats, panBy, queueKeyOrbit, rack, rackL, resetView, setDist, setFov } = app.host;
  const { barLock, devById, layout, readSettings, rk, setModArm, togglePlay, transport } = app.sh, { particles, shadowView, toggleFullscreen, wState } = app.w;
  const { domain, occlusion, touchState } = app.ctl;
  /**
   * KEYS.  Transport on the arrows and space; the camera on WASD/QE with shift for a fine step; the ROTATION AXIS
   * on X/Y/Z, so [ and ] turn the STATE about the chosen axis (and with shift, the Runge–Lenz rotation about it).
   * The axis keys never move the camera and the camera keys never touch ψ — the badge on each window says which.
   */
  const keyState = { axis: 'z', which: 'both' };
  function keyHelp() { return `axis ${keyState.axis.toUpperCase()} · rotor ${keyState.which}`; }
  /* ── KEYS: a rebindable action table.  `fine` is shift for the stepping actions; actions that declare `shift`
     require it (so TAB and Shift+TAB are two actions).  Overrides live in localStorage.
     0.5.0 A9 · THE ROWS THE KIT'S createKeys READS (mir/shell/keys.js): an id is the kit's where the kit has a twin and `was`
     names the old one (a binding saved under it still loads, lab/keys.js); `group` and `short` are the keyboard window's;
     `ctrl: true` is the kit's `Mod` (Ctrl, or ⌘ on a Mac) and `ctrl: 'Ctrl'` its `Ctrl`, the Control key alone (⌘⇧Q logs a
     Mac out); `inFields` runs from a text field; a control a row drives carries `data-key-action` (the kit's hints() target). ── */
  const stageHasFocus = () => document.activeElement === dom.canvas;
  const setAxis = (a) => { keyState.axis = a; wState.setStatus(keyHelp(), 'live'); };
  const setWhich = (w) => { keyState.which = w; wState.setStatus(keyHelp(), 'live'); };
  const dolly = (direction, fine) => setDist(direction < 0 ? obs.dist / (1 + 0.1 * fine) : obs.dist * (1 + 0.1 * fine));
  const pov = (direction, fine) => setFov(2 * Math.atan(Math.tan(obs.fov / 2) * (direction < 0 ? 1 / (1 + 0.1 * fine) : 1 + 0.1 * fine)));
  /* Preserve the apparent size at the origin: distance × tan(FOV/2) is invariant.
     When either camera limit is reached, stop the coupled move at that limit. */
  function dollyZoom(direction, fine) {
    const invariant = obs.dist * Math.tan(obs.fov / 2);
    let dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], direction < 0 ? obs.dist / (1 + 0.1 * fine) : obs.dist * (1 + 0.1 * fine)));
    let fov = 2 * Math.atan(invariant / dist);
    fov = Math.max(CAM.FOV[0], Math.min(CAM.FOV[1], fov));
    dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], invariant / Math.tan(fov / 2)));
    const actual = setDist(dist);
    if (Math.abs(actual - dist) < 1e-9) setFov(2 * Math.atan(invariant / actual));
  }
  const KG = { T: 'TRANSPORT', C: 'CAMERA', S: 'STATE', P: 'PROJECT' };   // the keyboard window's groups; a row without one is WINDOWS & DISPLAY
  const ACTIONS = [
    { id: 'transport.play', was: 'play', group: KG.T, short: 'play', label: 'play / pause', key: 'Space', run: () => togglePlay() },
    { id: 'fullscreen', short: 'fullscreen', label: 'full screen (the browser) / back', key: 'KeyF', run: () => toggleFullscreen() },
    { id: 'notebook', short: 'notebook', label: 'notebook (and its ABOUT face)', key: 'KeyJ', run: () => layout.notebook.toggle() },
    /* wave 106: the button's own title says "t → 0  (home)", so the key must BE the button — it was
       clearing neither the shadow trail nor the playhead, so the same advertised act did two different
       things depending on which surface you used. */
    { id: 'home', group: KG.T, short: 'zero', label: 'time to zero', key: 'Home', run: () => { clock.reset(); if (ui.scrub) ui.scrub.set(0); shadowView.clearTrail(); schedule(TIER.EVOLVE); } },
    { id: 'stepBack', group: KG.T, short: 'step back', label: 'step time back (shift: fine)', key: 'ArrowLeft', run: (f) => { clock.step(-transport.stepDt() * f); schedule(TIER.EVOLVE); } },
    { id: 'stepFwd', group: KG.T, short: 'step fwd', label: 'step time forward (shift: fine)', key: 'ArrowRight', run: (f) => { clock.step(transport.stepDt() * f); schedule(TIER.EVOLVE); } },
    { id: 'ask', group: KG.T, short: 'ask Gemma', label: 'ask Gemma — the transport strip becomes the type box', key: 'Slash', shift: false, inFields: false, run: () => transport.openAsk() },   // 0.6.6 G2
    { id: 'zoomIn', group: KG.C, short: 'zoom in', label: 'camera closer', key: 'ArrowUp', run: (f) => { setDist(obs.dist / (1 + 0.12 * f)); } },
    { id: 'zoomOut', group: KG.C, short: 'zoom out', label: 'camera farther', key: 'ArrowDown', run: (f) => { setDist(obs.dist * (1 + 0.12 * f)); } },
    { id: 'yawL', group: KG.C, short: 'yaw left', label: 'camera yaw left', key: 'KeyA', run: (f) => queueKeyOrbit(-0.12 * f, 0) },
    { id: 'yawR', group: KG.C, short: 'yaw right', label: 'camera yaw right', key: 'KeyD', run: (f) => queueKeyOrbit(0.12 * f, 0) },
    { id: 'pitchUp', group: KG.C, short: 'pitch up', label: 'camera pitch up', key: 'KeyW', run: (f) => queueKeyOrbit(0, 0.12 * f) },
    { id: 'pitchDn', group: KG.C, short: 'pitch down', label: 'camera pitch down', key: 'KeyS', run: (f) => queueKeyOrbit(0, -0.12 * f) },   // R-K1: S stays WASD's (the kit's S is FOLDERS)
    { id: 'dollyIn', group: KG.C, short: 'dolly in', label: 'dolly in', key: 'KeyQ', shift: false, run: (f) => dolly(-1, f) },
    { id: 'dollyOut', group: KG.C, short: 'dolly out', label: 'dolly out', key: 'KeyE', shift: false, run: (f) => dolly(1, f) },
    { id: 'povIn', group: KG.C, short: 'POV tighter', label: 'POV tighter (field of view)', key: 'KeyQ', shift: true, run: () => pov(-1, 1) },
    { id: 'povOut', group: KG.C, short: 'POV wider', label: 'POV wider (field of view)', key: 'KeyE', shift: true, run: () => pov(1, 1) },
    { id: 'dollyZoomIn', group: KG.C, short: 'dolly zoom in', label: 'dolly zoom in (size held)', key: 'KeyQ', ctrl: 'Ctrl', shift: true, run: () => dollyZoom(-1, 1) },
    { id: 'dollyZoomOut', group: KG.C, short: 'dolly zoom out', label: 'dolly zoom out (size held)', key: 'KeyE', ctrl: 'Ctrl', shift: true, run: () => dollyZoom(1, 1) },
    { id: 'camReset', group: KG.C, short: 'cam reset', label: 'reset the camera', key: 'KeyR', run: () => resetView() },
    { id: 'panLeft', group: KG.C, short: 'pan left', label: 'slide the picture left (the molecule stays the pivot)', key: 'ArrowLeft', alt: true, run: (f) => panBy(-STAGE_BINDINGS.nudge * f, 0) },   // 0.4.0 S2: the lens shift, the bindings' nudge (0.05) of the half-frame a press
    { id: 'panRight', group: KG.C, short: 'pan right', label: 'slide the picture right', key: 'ArrowRight', alt: true, run: (f) => panBy(STAGE_BINDINGS.nudge * f, 0) },
    { id: 'panUp', group: KG.C, short: 'pan up', label: 'slide the picture up', key: 'ArrowUp', alt: true, run: (f) => panBy(0, STAGE_BINDINGS.nudge * f) },
    { id: 'panDown', group: KG.C, short: 'pan down', label: 'slide the picture down', key: 'ArrowDown', alt: true, run: (f) => panBy(0, -STAGE_BINDINGS.nudge * f) },
    { id: 'axisX', group: KG.S, short: 'axis X', label: 'rotation axis x', key: 'KeyX', run: () => setAxis('x') },
    { id: 'axisY', group: KG.S, short: 'axis Y', label: 'rotation axis y', key: 'KeyY', run: () => setAxis('y') },
    { id: 'axisZ', group: KG.S, short: 'axis Z', label: 'rotation axis z', key: 'KeyZ', run: () => setAxis('z') },
    { id: 'rotorBoth', group: KG.S, short: 'rotor both', label: 'rotor: both (spatial rotation)', key: 'Digit1', run: () => setWhich('both') },
    { id: 'rotorPlus', group: KG.S, short: 'rotor +', label: 'rotor: plus alone', key: 'Digit2', run: () => setWhich('+') },
    { id: 'rotorMinus', group: KG.S, short: 'rotor −', label: 'rotor: minus alone', key: 'Digit3', run: () => setWhich('−') },
    { id: 'rotorK', group: KG.S, short: 'rotor K', label: 'rotor: Runge–Lenz K', key: 'Digit4', run: () => setWhich('K') },
    { id: 'turnNeg', group: KG.S, short: 'turn −', label: 'turn ψ about the axis, −', key: 'BracketLeft', run: (f) => { reg.rotor({ which: keyState.which, axis: keyState.axis, angle: -0.12 * f, t: clock.t }); touchState(); } },
    { id: 'turnPos', group: KG.S, short: 'turn +', label: 'turn ψ about the axis, +', key: 'BracketRight', run: (f) => { reg.rotor({ which: keyState.which, axis: keyState.axis, angle: 0.12 * f, t: clock.t }); touchState(); } },
    { id: 'slap', group: KG.S, short: 'impulse', label: 'impulse along the axis (k = 0.2)', key: 'KeyK', run: (f) => { if (app.hooks.slap) app.hooks.slap(0.2 * f, keyState.axis); } },
    { id: 'style', short: 'style', label: 'cycle the draw style', key: 'KeyC', run: () => { const order = ['cloud', 'solid', 'grain', 'signed', 'bands']; const nx = order[(order.indexOf(STYLE_NAMES[mat.style]) + 1) % 5]; mat.style = STYLE[nx]; ui.styleSeg.set(nx); schedule(TIER.PRESENT); } },
    { id: 'view', short: 'view', label: 'cycle the observable', key: 'KeyV', run: () => { const order = ['density', 'phase', 'real', 'imag', 'diff', 'reim']; const nx = order[(order.indexOf(VIEW_NAMES[mat.view]) + 1) % 6]; mat.view = VIEW[nx]; ui.viewSeg.set(nx); schedule(TIER.PRESENT); } },
    { id: 'palette', short: 'palette', label: 'toggle the phase palette', key: 'KeyP', run: () => { if (app.state.palette) app.state.palette.setOn(!app.state.palette.on); } },
    { id: 'hide', was: 'hideUI', short: 'hide UI', label: 'hide / show the interface (the frame and the axes with it)', key: 'KeyH', run: () => toggleUI() },
    { id: 'nextWindow', short: 'next win', label: 'next window to the top of the rack (from the stage)', key: 'Tab', shift: false, stage: true, run: () => cycleWindow(1) },
    { id: 'prevWindow', short: 'prev win', label: 'previous window to the top of the rack (from the stage)', key: 'Tab', shift: true, stage: true, run: () => cycleWindow(-1) },
    { id: 'reseed', group: KG.S, short: 'reseed', label: 'reset the particles', key: 'KeyR', ctrl: true, run: () => { particles.setOn(true); particles.seed(160, reg, clock.t, domain.half); schedule(TIER.PRESENT); } },
    { id: 'help', was: 'keysheet', short: 'keys', label: 'the keyboard — edit bindings', key: 'Slash', shift: true, run: () => layout.keymap.toggle() },
    (({ id, run, up }) => ({ id, short: 'hold text', label: 'hold the stage text still (while I is held)', key: 'KeyI', shift: false, run, up }))(infoActions(() => app.state.stageText && app.state.stageText.layer)[0]),   // 0.5.1 D1: the kit's hold-still row
    { id: 'notes', short: 'notes', label: 'show / hide window help', key: 'KeyN', run: () => { const on = document.body.classList.contains('window-info-off'); if (ui.setWindowInfo) ui.setWindowInfo(on); if (ui.windowInfoSw) ui.windowInfoSw.set(on); } },
    { id: 'rack', short: 'rack', label: 'hide / show the rack', key: 'KeyB', run: () => layout.toggleRack() },
    { id: 'dock', short: 'dock', label: 'dock / undock the transport', key: 'KeyT', run: () => layout.dockTransport() },
    /* WAVE 65 · the arm and the loop clock's lock.  Both are REBINDABLE and both appear in the keyboard
       editor, which is the visible seat neither could have inside the ported window: its timing bar is
       the artifact's and is not ours to grow (docs/ui/STYLE-LOCK.md, THE PORTED-WINDOW EXCEPTION). */
    /* R-K1 · the MOD arm is Ctrl+Space (the real Control: ⌘Space is Spotlight); A5+A6 seam: its run() follows the one clock's POWER. */
    { id: 'modArm', group: KG.T, short: 'mod arm', label: 'MOD — the modulation’s power: routes on or bypassed (time runs on; space plays the one clock)', key: 'Space', ctrl: 'Ctrl', run: () => setModArm(!app.state.modArm) },
    { id: 'modulation', was: 'modWin', label: 'the modulation window — open it, or close it again', key: 'KeyM', run: () => layout.modulation.toggle() },
    { id: 'modBar', group: KG.T, short: 'bar lock', label: 'lock the modulation loop clock: one bar = one recurrence of the density', key: 'KeyG', run: () => barLock() },
    { id: 'undo', group: KG.P, short: 'undo', label: 'undo the last edit', key: 'KeyZ', ctrl: true, shift: false, run: () => app.sh.historyApi.undo() },
    { id: 'redo', group: KG.P, short: 'redo', label: 'redo it (Ctrl+Y too)', key: 'KeyZ', ctrl: true, shift: true, run: () => app.sh.historyApi.redo() },
    { id: 'redoY', group: KG.P, short: 'redo', label: 'redo (Ctrl+Y)', key: 'KeyY', ctrl: true, shift: false, run: () => app.sh.historyApi.redo() },
    { id: 'historyUndo', group: KG.P, label: 'return from the last history jump', key: 'KeyZ', ctrl: true, alt: true, shift: false, run: () => app.sh.historyApi.historyUndo() },
    { id: 'settings', inFields: true, label: 'settings', key: 'Comma', ctrl: true, shift: false, run: () => layout.raise('settings') },
    { id: 'save', group: KG.P, short: 'save', inFields: true, label: 'save the open project (asks for a name when none is open)', key: 'KeyS', ctrl: true, shift: false,
      run: () => { if (layout.projects && layout.projects.current) layout.projects.save(); else layout.notebook.open('projects'); } },
    { id: 'saveAs', group: KG.P, short: 'save as', inFields: true, label: 'save the project under a new name', key: 'KeyS', ctrl: true, shift: true,
      run: () => layout.notebook.open('projects') },
    { id: 'folders', group: KG.P, short: 'folders', label: 'the projects — save, open, folders, recent (FOLDERS)', key: 'KeyO',
      run: () => layout.projects.folders.toggle() },
    /* the kit's windows λWAVES has are rows with NO chord (MIR ADOPTING-1.5 §11: their keys are Josh's to give; bind one in the keyboard) */
    { id: 'history', group: KG.P, short: 'history', label: 'the undo history window', key: null, run: () => layout.raise('history') },
    { id: 'keyboard', short: 'keyboard', label: 'the keyboard window (? opens it too, as help)', key: null, run: () => layout.keymap.toggle() },
    { id: 'menu', short: 'menu', label: 'the main menu — open it, or back to the lab', key: 'KeyL', run: () => { if (app.state.mainMenu) app.state.mainMenu.toggle(); } },   // iteration 003
    { id: 'timeline', short: 'timeline', label: 'the timeline window — open it, or close it again', key: null, run: () => { if (app.state.tl) app.state.tl.toggle(); } },   // 0.5.0 C7b
    { id: 'gui', short: 'mir options', label: 'MIR OPTIONS — the interface’s look (BASINS’ GUI menu)', key: null, run: () => { const g = mirGui(); if (g) g.toggle(); } },   // iteration 003: lab/mir-gui.js
    { id: 'guiAbout', short: 'mir about', label: 'MIR ABOUT — what MIR is', key: null, run: () => { const g = mirGui(); if (g) g.toggle('about'); } },
  ];
  /* THE DISPATCHER (the saved chords, the one keydown listener, whose key a press is): lab/keys.js (wave 130 seam 10) */
  /* S4 · A KEY'S EDIT IS A ROW OF ITS OWN, named for its action: C / V / P changed the edit scope and armed nothing, so the row came
     at the next commit under whatever name was standing (probes/S3-verify/edges*.mjs).  An edit still pending under another name
     commits first; a held key repeats under one name and stays one row; a key that changed nothing drops its name like any gesture. */
  const TRAVELS = new Set(['undo', 'redo', 'redoY', 'historyUndo']);
  const keyEdit = (a, run) => {
    if (!app.state.history || app.state.history.holding || TRAVELS.has(a.id)) return run();   // an undo is not an edit: noting its name lent it to the next unnamed edit
    const name = a.label + ' · ' + kt.keyText(a.id);
    if (app.state.history.pendingLabel !== name) app.state.history.flush();
    run(); app.state.history.note(name);
  };
  const kt = createKeyTable({ rows: ACTIONS, stageHasFocus, edit: keyEdit });   // 0.5.0 C3: the one listener, the save, the binding law (lab/key-table.js)
  /* ── 0.5.0 C3 · THE KEYBOARD WINDOW is the kit's createKeyboardWindow (keymap.js left): the drawn board, the platform switch, RECORD /
     RESET, the search and the list, the steal on a second press, Escape's three steps, the drag — on the float layer (UI space for the
     scene guard), its move telling the occlusion (CLAUDE.md).  Its paint is λWAVES' charcoal-blue skin (lab.css §KEYBOARD, R5-S3).  Its
     place is remembered as it was ({ x, y } in lw.keyboard.position.v1, PREFERENCE); focus goes in on open and back out on close. */
  {
    const KB_AT = 'lw.keyboard.position.v1';
    let back = null;
    const kb = createKeyboardWindow({ keys: kt.window, host: floats,
      onMoved: (r) => { occlusion.dirty(); const f = document.activeElement; if (r === null && back && back.isConnected && (!f || f === document.body || kb.win.root.contains(f))) back.focus({ preventScroll: true }); },
      persist: { read() { try { return JSON.parse(localStorage.getItem(KB_AT)); } catch (_) { return null; } },
        write(st) { try { if (st.x !== null) localStorage.setItem(KB_AT, JSON.stringify({ x: st.x, y: st.y })); } catch (_) {} } } });
    for (const n of [kb.win.root, kb.win.rail && kb.win.rail.el]) occlusion.watch(n, { attributes: true, attributeFilter: ['hidden'] });   // its `hidden` lands when the exit ends: the paused mask lets go then
    layout.keymap = {
      open() { if (!kb.isOpen()) { back = document.activeElement; kb.open(); } const k = kb.root.querySelector('.km-key[tabindex="0"]'); (k && k.offsetParent ? k : kb.root.querySelector('.km-action-row') || kb.root).focus({ preventScroll: true }); return true; },
      close() { kb.close(); return false; },
      toggle() { return kb.isOpen() ? layout.keymap.close() : layout.keymap.open(); },
      get isOpen() { return kb.isOpen(); },
    };
    layout.keysheet = layout.keymap;   // the '?' LIST sheet of wave 53 is gone; the window is the one bindings surface
    /* Escape: inside the window the kit's three steps (a recording, the search, the window); from anywhere else it still closes the window
       (wave 106), and from the stage it hands the keyboard back to the interface (wave 57).  The menubar and the + / ☆ lists are the kit's. */
    window.addEventListener('keydown', (e) => { if (e.code !== 'Escape' || e.defaultPrevented) return; if (kb.isOpen()) { e.preventDefault(); kb.close(); } else if (stageHasFocus()) dom.canvas.blur(); });
    kt.table.hints(document); kt.table.onChange(() => kt.table.hints(document));   // every [data-key-action] says its live chord (aria-keyshortcuts)
  }
  /* ── 0.5.0 C7b · THE TIMELINE is the kit's installTimeline (TIMELINE.md) on λWAVES' ONE modulation host: its `mod` is this seam (bind.js
     reads host, registry, play, arm, armed, onPlay, setTimeline), so it builds no second host and no tick.  Its play is THE play (clock.js
     onePlay), its playhead paints from loop()'s present, the arrangement is the host clock's automation and rides in serialize()
     (presentation.timeline) with its own undo; λWAVES' pill stays the one transport (R9), the window a WORKSPACE record (`tlwin`) that
     ships closed (R1).  Its rows join the ONE KEY TABLE (undo/redo are λWAVES' own ids: its own are reachable from its ⋯ menu). */
  if (app.state.modHost && app.state.modView) {
    app.state.tl = installTimeline({ mount: floats, present: () => schedule(TIER.PRESENT), say: (m) => wState.setStatus(m, 'warn'),
      mod: { host: app.state.modHost, registry: app.state.modHost.registry, armed: () => app.state.modArm, arm: (on) => setModArm(!!on), onPlay: appPlay.onChange, setTimeline: (x) => app.state.modView.setTimeline(x),
        play: (on) => { if (on) appPlay.play(); else appPlay.pause(); schedule(TIER.EVOLVE); return { ok: true, playing: clock.playing }; } },
      dock: { span: rk.span() }, initial: { dock: 'bottom', open: false }, keys: kt.table, project: false, transport: false, audio: false,
      store: { read: () => readSettings().tlwin || null, write: (s) => settingsStore.write({ ...readSettings(), tlwin: s }) },
      busy: () => app.state.capApi.busy, moved: (r) => app.state.dodge(r, 'tl'), onWindow: () => occlusion.dirty() });
    /* the window draws no pane of its own: its ruler, lanes and work bar are each a .glass pane (a lane clipped by the scroller), its rail chips */
    occlusion.register('timeline', () => app.state.tl.isOpen() ? [...app.state.tl.root.querySelectorAll('.glass'), ...(app.state.tl.rail.el ? app.state.tl.rail.el.querySelectorAll('.mir-chip') : [])].map((s) => paintedRect(s, s.closest('.tl-viewport'))) : []);
    for (const n of [app.state.tl.root, app.state.tl.rail.el]) occlusion.watch(n, { attributes: true, attributeFilter: ['hidden'] });
    /* a ROUTED dial's hold and right-click stay its ring's (RANGE · REMOVE · RESET): the kit's TIMELINE CLIP (timeline/knobs.js, 500 ms,
       document capture) and the ring (600 ms) claim one gesture, so the window's capture hides that dial's id from the timeline for the
       one event and gives it back right after the timeline has looked (brief B13); an unrouted dial's hold is TIMELINE CLIP's */
    for (const type of ['pointerdown', 'contextmenu']) window.addEventListener(type, (e) => { const k = e.target.closest && e.target.closest('.k[data-param]');
      if (!k || !app.state.modHost.model.routesOfTarget(k.dataset.param).some((r) => !r.dormant)) return; const id = k.dataset.param; k.removeAttribute('data-param');
      document.addEventListener(type, () => { k.dataset.param = id; }, { capture: true, once: true }); }, true);
  }
  function toggleUI() {
    const on = document.body.classList.toggle('ui-hidden');
    app.state.uiHidden = on;
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
    actions: ACTIONS,
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
  app.sh.keyState = keyState; app.sh.ACTIONS = ACTIONS; app.sh.kt = kt; app.sh.stageHasFocus = stageHasFocus;
  return { stageHasFocus, keyState };
}
