/* lab/actions.js — ONE ACTION REGISTRY (021 I1; the DREAM's contract 2, research/iteration-021/REVIEW-B-INPUT.md).  Every act a hand, a key, a menu,
 * a bar seat, a verb (a notebook `lw:` link, the conductor), MIDI or a modulation route can fire is ONE row here, found by id, never by label or a press:
 *   { id, label (the CAPS word a menu, KEYBOARD, MAPPING, the search and a history row show; `A › B` reads B in a menu), hint (its sentence, ≤ 60), group, kind: 'fire' | 'toggle' | 'hold' | 'set', args?, get?(), run(args), keys?: [chords], exact?, surface?, gesture?, undo, was?, … }
 *   · keys: the kit's chords (lab/mir/shell/keys.js); a chord with no Shift answers Shift too as the fine step ({ fine: 0.25 }) unless the row is `exact`
 *     (key-table.js expands it); `was` names the id (or ids) a saved binding was kept under; `stage` / `when` say when a key may run it (THE FOCUS LAW).
 *   · kind: fire acts once; toggle has get() (a menu draws ✓, the bar lights, MIDI's toggle mode and an `action.<id>` route read it); hold has up();
 *     set takes args (a VERB's argument form, lab/verbs.js: the verb and the key are ONE action — `view` cycles bare and sets with { id }).
 *   · surface: the MAPPING tab lists it (lab/mapping.js: KEY · MIDI · MOD); gesture: the browser wants a real press (full screen, a clipboard, a file
 *     picker), so only a KEY may fire it.  undo: 'row' (one history row named `label · key`, whatever surface fired it), 'travel', 'none'.
 * createActions(app) → { list(), get(id), run(id, args), add(rows), sync(), notify(id), onState(fn), onAdd(fn), escape: { push(close) }, keyState }
 * Seated in rack.js before the transport (the bar's seats read it); every row reads `app` at run time, so a module made later is found then. */
import { TIER } from './tier.js'; import { VIEW, VIEW_NAMES, WAVE_VIEWS, STYLE, drawStyle } from './field.js'; import { CAM } from './camera-law.js'; import { STAGE_BINDINGS } from './stage-gestures.js';
import { infoActions } from './mir/info/layer.js'; import { mirGui } from './mir-gui.js'; import { INFO_ROWS, infoPrefs } from './shell/stage-words.js';
import { EXPORTS } from './export3d.js'; import { isField } from './mir/core/pointer.js';
import { knobAct } from './mir/shell/menubar.js'; import { copyText } from './mir/shell/clipboard.js'; import { notice } from './mir/shell/notice.js'; import { quickSaved } from './shell/persist.js';

const F = (a) => (a && a.fine) || 1;   // the fine step a key's Shift asks for (1 bare, 0.25 with Shift)

export function createActions(app) {
  const { ui, reg, clock, obs, mat, appPlay } = app, sch = (t) => app.loop.schedule(t), H = () => app.host, W = () => app.w, S = () => app.sh, L = () => app.sh.layout;
  const keyState = { axis: 'z', which: 'both' }, keyHelp = () => `axis ${keyState.axis.toUpperCase()} · rotor ${keyState.which}`;
  const setAxis = (a) => { keyState.axis = a; W().wState.setStatus(keyHelp(), 'live'); }, setWhich = (w) => { keyState.which = w; W().wState.setStatus(keyHelp(), 'live'); };
  const dolly = (dir, f) => H().setDist(dir < 0 ? obs.dist / (1 + 0.1 * f) : obs.dist * (1 + 0.1 * f));
  const pov = (dir, f) => H().setFov(2 * Math.atan(Math.tan(obs.fov / 2) * (dir < 0 ? 1 / (1 + 0.1 * f) : 1 + 0.1 * f)));
  /* the dolly zoom keeps the apparent size at the origin (distance × tan(FOV/2) invariant) and stops the coupled move at either camera limit */
  function dollyZoom(dir, f) {
    const inv = obs.dist * Math.tan(obs.fov / 2), C = (v, r) => Math.max(r[0], Math.min(r[1], v));
    let dist = C(dir < 0 ? obs.dist / (1 + 0.1 * f) : obs.dist * (1 + 0.1 * f), CAM.DIST); const fov = C(2 * Math.atan(inv / dist), CAM.FOV);
    dist = C(inv / Math.tan(fov / 2), CAM.DIST); const got = H().setDist(dist); if (Math.abs(got - dist) < 1e-9) H().setFov(2 * Math.atan(inv / got));
  }
  /* a switch the hand's way: its own press (its act is the card's onChange), and a control a row drives is found by its data-key-action, never its label */
  const tap = (s, on) => { if (s && (on === undefined || s.get() !== on)) s.root.click(); };
  const press = (id) => { const b = document.querySelector('[data-key-action="' + id + '"]'); if (b && !b.disabled) { b.click(); return true; } return false; };
  const chem = () => app.state.chem, P = () => H().cameraPort, proj = () => L() && L().projects, hist = () => S().historyApi, look = () => app.ctl.look;
  const nodes = () => S().LW && S().LW.nodes, nodesAt = () => { const N = nodes(), f = document.activeElement; return N && N.keysAt ? N.keysAt(f) : null; };
  const verb = (id) => (S().verbs && S().verbs.byId(id)) || null, ran = (id) => (a) => verb(id).run(app, a || {});
  /* THE FULL SCREEN, read both ways: the API's element, or the browser's own (F11) through the display mode; F11's is left to F11 */
  const fsOn = () => !!(document.fullscreenElement || (typeof matchMedia === 'function' && matchMedia('(display-mode: fullscreen)').matches));
  const fullscreen = () => { if (!document.fullscreenElement && fsOn()) { W().wState.setStatus('the browser’s full screen (F11) is the browser’s: F11 leaves it', 'warn'); return; } W().toggleFullscreen(); };
  const IP = infoPrefs(), infoKeys = INFO_ROWS.filter((r) => r.type === 'bool').map((r) => r.key); let infoKept = null;
  /* 022 P2 · the rows a CONTEXT MENU runs (lab/context-menus.js hands the pressed element as `{ el }`; a key acts on the focus) */
  const at = (a) => (a && a.el) || document.activeElement || document.body, eventAt = (a) => { const t = at(a); return t.closest ? t.closest('[data-event]') : null; }, knobAt = (a) => at(a).closest && at(a).closest('.k'), tileAt = (a) => at(a).closest && at(a).closest('.mm-tile');
  /* 039 W6 EVERY ROW ANSWERS: a row's result is said where it is seen — the toast — and kept on SPECTRUM's status line */
  const tell = (line, ok = true) => { W().wState.setStatus(line, ok ? 'live' : 'warn'); notice(line, { kind: ok ? 'ok' : 'warn', ms: ok ? 3200 : 5000 }); };
  const said = (ok, what) => tell(ok ? what + ' copied' : 'the clipboard refused the copy', ok);
  const copyOut = (text, what) => { if (!text) return false; copyText(String(text)).then((ok) => said(ok, what)); return true; };
  const wordOf = (k, a) => { const t = tileAt(a); if (t) return k === 'name' ? (t.getAttribute('aria-label') || '').split(' — ')[0] : (t.querySelector('.mm-lbl, .mm-sym') || {}).textContent;
    const q = (s) => (document.querySelector(s) || {}).textContent; return k === 'name' ? q('.mol-pick .mir-step-name') : q('.lw-stage .mir-info-text'); };
  const winOf = (id) => (S().rk ? S().rk.windows().find((x) => x.id === id) : null) || {};
  const foldable = () => (S().rk ? S().rk.windows().filter((w) => w.open && w.built && !w.hidden && !w.card) : []);   // 021 V3: a mode-hidden or LEGACY card is not FOLDS' (kit windows() `hidden`)
  /** reveal(id) — a window by the FINDER's road (kit rk.reveal: an open one scrolled to, a closed one opened at the top); NODES as its FREE window */
  const filmOpen = (a) => { const F = app.state.filmCard; if (!F) return false; reveal('render'); if (winOf('render').floating) L().raiseFloat('render'); else L().popOut('render'); return F.preset(a); };
  const reveal = (id) => { const N = nodes(), d = document.querySelector('.dev[data-id="' + id + '"]'); if (id === 'nodes' && N && (!d || d.classList.contains('closed'))) N.open(); else { S().rk.reveal(id); if (L().docked) L().seatTransport(); } S().saveSettings(); };   // 038 M7: a card opened at a rack's top stays under the docked CSB (018 C4: the bar's card is the left rack's top)
  const theme = (a) => { const T = app.hooks.setTheme; if (!T) return; if (a && a.id) T(a.id); else T(document.body.dataset.theme === 'light' ? 'dark' : 'light'); };
  const T = 'PLAY', C = 'CAMERA', ST = 'STATE', WD = 'WINDOW', CS = 'CONTROL SURFACE', PJ = 'FILE', V = 'VIEW', SE = 'SETTINGS', CA = 'CARDS', N = 'NODES';
  const ROWS = [
    { id: 'transport.play', icon: 'play', was: 'play', group: T, short: 'play', label: 'PLAY', hint: 'Play or pause', keys: ['Space'], kind: 'toggle', get: () => !!clock.playing, run: () => S().togglePlay(), surface: true },
    { id: 'fullscreen', icon: 'fullscreen', short: 'fullscreen', label: 'FULL SCREEN', hint: 'Full screen (the browser), or back', keys: ['KeyF'], kind: 'toggle', get: fsOn, run: fullscreen, gesture: true },
    { id: 'notebook', icon: 'notebook', short: 'notebook', label: 'NOTEBOOK', hint: 'The NOTEBOOK — notes over the stage', keys: ['KeyJ'], kind: 'toggle', get: () => !!L().notebook.isOpen, run: (a) => (a && a.md !== undefined ? ran('notebook')(a) : L().notebook.toggle()), surface: true },
    /* wave 106: the key IS the bar's ⏮ (t → 0 through THE ONE SEEK, 021 R3) */
    { id: 'home', icon: 'reload', group: T, short: 'zero', label: 't → 0', hint: 't → 0 · the beat stays', keys: ['Home'], run: () => appPlay.seek(0), surface: true },   // 032 T14: ↺ (⏮ is bar 1)
    /* 032 T14 · ⏮ IS BAR 1: the TIMELINE's playhead (the modulation beat) to the start, the window open or not; ψ's t stays (↺ moves it) */
    { id: 'timeline.beginning', icon: 'rewind', group: T, short: 'bar 1', label: 'TO BAR 1', hint: 'To bar 1 · ψ’s t stays', run: () => { if (app.state.tl) app.state.tl.controller.beginning(); sch(TIER.PRESENT); }, surface: true },
    { id: 'stepBack', icon: 'dirPrev', group: T, short: 'step back', label: 'STEP BACK', hint: 'Step time back (Shift: fine)', keys: ['ArrowLeft'], run: (a) => { clock.step(-S().transport.stepDt() * F(a)); sch(TIER.EVOLVE); }, surface: true },
    { id: 'stepFwd', icon: 'dirNext', group: T, short: 'step fwd', label: 'STEP FORWARD', hint: 'Step time forward (Shift: fine)', keys: ['ArrowRight'], run: (a) => { clock.step(S().transport.stepDt() * F(a)); sch(TIER.EVOLVE); }, surface: true },
    { id: 'zoomIn', group: C, short: 'zoom in', label: 'CAMERA CLOSER', hint: 'The camera closer', keys: ['ArrowUp'], run: (a) => H().setDist(obs.dist / (1 + 0.12 * F(a))), surface: true },
    { id: 'zoomOut', group: C, short: 'zoom out', label: 'CAMERA FARTHER', hint: 'The camera farther', keys: ['ArrowDown'], run: (a) => H().setDist(obs.dist * (1 + 0.12 * F(a))), surface: true },
    ...[['yawL', 'yaw left', 'KeyA', -1, 0], ['yawR', 'yaw right', 'KeyD', 1, 0], ['pitchUp', 'pitch up', 'KeyW', 0, 1], ['pitchDn', 'pitch down', 'KeyS', 0, -1]].map(([id, w, k, y, p]) =>   // R-K1: S stays WASD's
      ({ id, group: C, short: w, label: w.toUpperCase(), hint: 'Camera ' + w, keys: [k], kind: 'hold', surface: true, run: (a) => H().queueKeyOrbit(0.12 * F(a) * y, 0.12 * F(a) * p, id), up: () => H().queueKeyOrbit(0, 0, id) })),
    { id: 'dollyIn', group: C, short: 'dolly in', label: 'DOLLY IN', hint: 'Dolly in', keys: ['KeyQ'], exact: true, run: (a) => dolly(-1, F(a)), surface: true },
    { id: 'dollyOut', group: C, short: 'dolly out', label: 'DOLLY OUT', hint: 'Dolly out', keys: ['KeyE'], exact: true, run: (a) => dolly(1, F(a)), surface: true },
    { id: 'povIn', group: C, short: 'POV tighter', label: 'POV TIGHTER', hint: 'POV tighter (field of view)', keys: ['Shift+KeyQ'], run: () => pov(-1, 1), surface: true },
    { id: 'povOut', group: C, short: 'POV wider', label: 'POV WIDER', hint: 'POV wider (field of view)', keys: ['Shift+KeyE'], run: () => pov(1, 1), surface: true },
    { id: 'dollyZoomIn', group: C, short: 'dolly zoom in', label: 'DOLLY ZOOM IN', hint: 'Dolly zoom in (size held)', keys: ['Ctrl+Shift+KeyQ'], run: () => dollyZoom(-1, 1), surface: true },   // the Control key alone: ⌘⇧Q logs a Mac out
    { id: 'dollyZoomOut', group: C, short: 'dolly zoom out', label: 'DOLLY ZOOM OUT', hint: 'Dolly zoom out (size held)', keys: ['Ctrl+Shift+KeyE'], run: () => dollyZoom(1, 1), surface: true },
    { id: 'camReset', icon: 'home', group: C, short: 'cam reset', label: 'CAMERA HOME', hint: 'Reset the camera', keys: ['KeyR'], run: () => H().resetView(), surface: true },
    ...[['panLeft', 'left', 'ArrowLeft', -1, 0], ['panRight', 'right', 'ArrowRight', 1, 0], ['panUp', 'up', 'ArrowUp', 0, 1], ['panDown', 'down', 'ArrowDown', 0, -1]].map(([id, w, k, x, y]) =>   // 0.4.0 S2: the lens shift, the nudge a press
      ({ id, group: C, short: 'pan ' + w, label: 'PAN ' + w.toUpperCase(), hint: 'Slide the picture ' + w, keys: ['Alt+' + k], run: (a) => H().panBy(STAGE_BINDINGS.nudge * F(a) * x, STAGE_BINDINGS.nudge * F(a) * y), surface: true })),
    { id: 'camera.panHome', icon: 'move', group: C, short: 'pan home', label: 'PAN HOME', hint: 'The pivot back to the middle of the frame', run: () => P().setShift(0, 0), surface: true },
    ...[['lock', 'LOCK', 'The classic camera: pan and zoom at the centre'], ['flip', 'FLIP', 'Mirror the view, left ↔ right'], ['autoRotate', 'AUTO-ROTATE', 'A fling never stops (no friction)']].map(([k, label, hint]) =>   // 038 K4: FRICTION read as 0, no ambient spin (CALLS 11-05 §3)
      ({ id: 'camera.' + k, icon: { lock: 'lock', flip: 'swap', autoRotate: 'loop' }[k], group: C, short: k === 'autoRotate' ? 'auto-rotate' : k, label, hint, kind: 'toggle', get: () => !!P().get(k), run: () => { P().set(k, !P().get(k)); if (k === 'lock') S().saveSettings(); }, surface: true })),
    ...['X', 'Y', 'Z'].map((x) => ({ id: 'axis' + x, group: ST, short: 'axis ' + x, label: 'AXIS ' + x, hint: 'Rotation axis ' + x.toLowerCase(), keys: ['Key' + x], run: () => setAxis(x.toLowerCase()), surface: true })),
    ...[['rotorBoth', 'both', 'rotor both', 'Rotor: both (spatial rotation)'], ['rotorPlus', '+', 'rotor +', 'Rotor: plus alone'], ['rotorMinus', '−', 'rotor −', 'Rotor: minus alone'], ['rotorK', 'K', 'rotor K', 'Rotor: Runge–Lenz K']]
      .map(([id, w, short, hint], i) => ({ id, group: ST, short, label: short.toUpperCase(), hint, keys: ['Digit' + (i + 1)], run: () => setWhich(w), surface: true })),
    ...[['turnNeg', '−', 'BracketLeft', -1], ['turnPos', '+', 'BracketRight', 1]].map(([id, w, k, s]) => ({ id, group: ST, short: 'turn ' + w, label: 'TURN ' + w, hint: 'Turn ψ about the axis, ' + w, keys: [k],
      run: (a) => { reg.rotor({ which: keyState.which, axis: keyState.axis, angle: s * 0.12 * F(a), t: clock.t }); app.ctl.touchState(); }, surface: true })),
    { id: 'slap', group: ST, short: 'impulse', label: 'IMPULSE', hint: 'Impulse e^{ik·x} along the K axis', keys: ['KeyK'], run: (a) => { const O = app.state.chem && app.state.chem.on && app.state.orbitals; if (O && O.strike) { O.strike(F(a)); return; } if (app.hooks.slap) app.hooks.slap(0.2 * F(a), keyState.axis); }, surface: true },   // 034 I: MOLECULES on → the ORBITAL register's strike
    { id: 'reseed', group: ST, short: 'reseed', label: 'RESEED THE PARTICLES', hint: 'Reset the particles', keys: ['Alt+KeyR'], run: () => { W().particles.setOn(true); W().particles.seed(160, reg, clock.t, app.ctl.domain.half); sch(TIER.PRESENT); }, surface: true },   // 021 call 6: Mod+R is the browser's reload
    { id: 'state.normalize', group: ST, short: 'normalize', label: 'NORMALIZE', hint: 'Normalize the state', run: () => W().normalizeNow(), surface: true },
    { id: 'state.clear', icon: 'trash', group: ST, short: 'clear', label: 'CLEAR THE REGISTER', hint: 'Empty the register', run: () => W().clearRegister(), surface: true },
    { id: 'preset.next', group: ST, short: 'system ›', label: 'NEXT SYSTEM', hint: 'The next SYSTEM', run: () => ui.hamSeg && ui.hamSeg.step(1), surface: true },
    { id: 'preset.prev', group: ST, short: '‹ system', label: 'PREVIOUS SYSTEM', hint: 'The previous SYSTEM', run: () => ui.hamSeg && ui.hamSeg.step(-1), surface: true },
    { id: 'style', short: 'style', label: 'STYLE', hint: 'Cycle the draw style', keys: ['KeyC'], kind: 'set', args: { id: '?enum cloud|solid|signed|dust|bands' }, surface: true,
      run: (a) => { const o = ['cloud', 'solid', 'signed', 'dust', 'bands'], nx = a && a.id ? a.id : o[(o.indexOf(drawStyle(mat.style)) + 1) % 5], from = mat.style | 0; S().LW ? S().LW.setStyle(nx) : (mat.style = STYLE[nx]); if (ui.styleRecall) ui.styleRecall(from, mat.style | 0); } },   // iteration 008 G: GRAIN joined DUST · 038 K1: C and the stage's STYLE › are a hand's switch (LW.setStyle alone never recalls)
    { id: 'view', short: 'view', label: 'OBSERVABLE', hint: 'Cycle the observable', keys: ['KeyV'], kind: 'set', surface: true,
      run: (a) => { if (a && a.id) return ran('view')(a); const o = WAVE_VIEWS, nx = o[(o.indexOf(VIEW_NAMES[mat.view]) + 1) % o.length]; mat.view = VIEW[nx]; ui.viewSeg.set(nx); sch(TIER.PRESENT); } },
    { id: 'palette', short: 'palette', label: 'PALETTE', hint: 'The phase palette, on or off', keys: ['KeyP'], kind: 'toggle', get: () => !!(app.state.palette && app.state.palette.on), run: () => { if (app.state.palette) app.state.palette.setOn(!app.state.palette.on); }, surface: true },
    /* iteration 012 M1: the mode and BALL AND STICK are rows of their own, with no chord (Josh's to give) */
    { id: 'mode', icon: 'atom', short: 'mode', label: 'MODE', hint: 'Switch the mode: HYDROGEN | MOLECULES', kind: 'toggle', get: () => !!(chem() && chem().on), surface: true,
      run: (a) => { const c = chem(), on = a && a.id ? a.id === 'molecules' : !(c && c.on); if (c && on !== c.on) c.setOn(on); } },
    { id: 'ballStick', icon: 'sticks', group: V, short: 'ball and stick', label: 'BALL AND STICK', hint: 'Nuclei and bonds on the stage', kind: 'toggle', get: () => !!(ui.skeletonSw && ui.skeletonSw.get()), run: () => tap(ui.skeletonSw), surface: true },
    { id: 'hide', icon: 'eyeShut', was: 'hideUI', short: 'hide UI', label: 'INTERFACE', hint: 'Hide or show MIR — the whole interface', keys: ['KeyH'], kind: 'toggle', get: () => !!app.state.uiHidden, menuOn: () => !app.state.uiHidden, run: () => app.hooks.keys.toggleUI(), surface: true },   // 044 AV2: a menu ticks INTERFACE while it is shown
    { id: 'nextWindow', short: 'next win', label: 'NEXT WINDOW', hint: 'Next window to the rack’s top', keys: ['Tab'], exact: true, stage: true, run: () => app.hooks.keys.cycleWindow(1) },
    { id: 'prevWindow', short: 'prev win', label: 'PREVIOUS WINDOW', hint: 'Previous window to the rack’s top', keys: ['Shift+Tab'], stage: true, run: () => app.hooks.keys.cycleWindow(-1) },
    { id: 'help', icon: 'keyboard', was: ['keysheet', 'keyboard'], short: 'keys', label: 'KEYBOARD…', hint: 'The KEYBOARD — the keys and the MAPPING', keys: ['Shift+Slash'], kind: 'toggle', get: () => !!(L().keymap && L().keymap.isOpen), run: () => L().keymap.toggle(), surface: true },   // 021 I1: help and keyboard are one row
    (({ id, run, up }) => ({ id, short: 'hold text', label: 'HOLD THE STAGE TEXT', hint: 'Hold the stage text still (while I is held)', keys: ['KeyI'], exact: true, kind: 'hold', run, up }))(infoActions(() => app.state.stageText && app.state.stageText.layer)[0]),   // 0.5.1 D1: the kit's hold-still row
    { id: 'notes', icon: 'info', short: 'notes', label: 'WINDOW HELP', hint: 'Show or hide window help', keys: ['KeyN'], kind: 'toggle', get: () => !document.body.classList.contains('window-info-off'), surface: true,
      run: () => { const on = document.body.classList.contains('window-info-off'); if (ui.setWindowInfo) ui.setWindowInfo(on); if (ui.windowInfoSw) ui.windowInfoSw.set(on); } },
    { id: 'rack', icon: () => (S().rk && S().rk.hidden ? 'rackHidden' : 'rackToggle'), short: 'rack', label: 'RACK', hint: 'Hide or show the rack', keys: ['KeyB'], kind: 'toggle', get: () => !(S().rk && S().rk.hidden), run: () => L().toggleRack(), surface: true },   // 040 I6: the ghost before its window, behind it under B
    { id: 'dock', icon: 'rackIn', short: 'dock', label: 'DOCK THE CONTROL SURFACE', hint: 'Dock or float the CONTROL SURFACE', keys: ['KeyT'], kind: 'toggle', get: () => !!L().docked, run: () => L().dockTransport(), surface: true },
    { id: 'modulation', icon: 'modulation', was: 'modWin', label: 'MODULATION', hint: 'The MODULATION window', keys: ['KeyM'], kind: 'toggle', get: () => !!L().modulation.open, run: () => L().modulation.toggle(), surface: true },
    { id: 'settings', icon: 'settings', inFields: true, label: 'SETTINGS…', hint: 'The SETTINGS window', keys: ['Mod+Comma'], exact: true, run: () => L().raise('settings'), surface: true },
    { id: 'history', icon: 'history', group: PJ, short: 'history', label: 'HISTORY…', hint: 'The undo history window', run: () => L().raise('history'), surface: true },
    { id: 'render', icon: 'film', short: 'render', label: 'RENDER', hint: 'The RENDER window — film the stage', run: () => L().raise('render'), surface: true },
    /* 025 C1 · FILE › RENDER… and EXPORT FRAMES…: the RENDER card off the rack and in front, its RANGE preset from what you have (film-card.js preset) */
    { id: 'render.open', icon: 'film', group: PJ, short: 'render…', label: 'RENDER…', hint: 'RENDER in front, its range from what you have', run: () => filmOpen(), surface: true },   // no chord (call 7): Mod+Alt+R is Firefox's READER VIEW, Mod+Alt+E an AltGr €
    { id: 'render.timeline', icon: 'film', group: PJ, short: 'render range', label: 'RENDER THIS RANGE', hint: 'RENDER on the TIMELINE’s selection or range', run: () => filmOpen({ range: 'timeline' }), surface: true },   // 025 C2
    { id: 'render.frames', group: PJ, short: 'export frames', label: 'EXPORT FRAMES…', hint: 'RENDER with PNG frames', run: () => filmOpen({ format: 'png' }), surface: true },
    { id: 'nodes', was: 'curves', short: 'nodes', label: 'NODES', hint: 'NODES — effects: grain, vignette, curves, colour', kind: 'toggle', icon: 'nodes', get: () => !!(nodes() && nodes().win.isOpen()), surface: true,   // 018 D3: the saved key id `curves` is read (was); 020 X0: the FREE window; 039 X7 the words name its effects
      run: () => { const N = nodes(); if (!N) return L().raise('nodes'); if (N.win.isOpen()) N.close(); else N.open(); } },
    { id: 'windowPicker', short: 'finder', label: 'FINDER…', hint: 'FINDER — search every window', icon: 'mirMark', run: () => { if (L().finder) L().finder.toggle(); }, surface: true },
    { id: 'menu', icon: 'picker', short: 'main menu', label: 'MAIN MENU', hint: 'The MAIN MENU — open it, or back to the lab', keys: ['KeyL'], kind: 'toggle', get: () => !!(app.state.picker && app.state.picker.shown), run: () => { if (app.state.picker) app.state.picker.toggle(); }, surface: true },   // the id stays 'menu': saved bindings
    { id: 'timeline', icon: 'timeline', short: 'timeline', label: 'TIMELINE', hint: 'The TIMELINE window', kind: 'toggle', get: () => !!(app.state.tl && app.state.tl.isOpen()), run: () => { if (app.state.tl) app.state.tl.toggle(); }, surface: true },
    { id: 'pattern', icon: 'pattern', short: 'pattern', label: 'PATTERN', hint: 'The PATTERN window — the ENVs’ step rows', kind: 'toggle', get: () => !!(L().pattern && L().pattern.open), run: () => { if (L().pattern) L().pattern.toggle(); }, surface: true },   // 036 P6: THE ENVELOPE TRIGGER (shell/modulation.js installEnvelopeTrigger)
    { id: 'gui', short: 'mir options', label: 'MIR OPTIONS…', hint: 'MIR OPTIONS — the look of MIR', icon: 'mirOptions', run: () => { const g = mirGui(); if (g) g.toggle(); }, surface: true },
    { id: 'guiAbout', icon: 'about', short: 'about mir', label: 'ABOUT MIR…', hint: 'ABOUT MIR — what MIR is', run: () => L().about.open('mir'), surface: true },   // 034 N1: the ABOUT window's MIR face
    { id: 'mapping', icon: 'mapping', short: 'mapping', label: 'MAPPING…', hint: 'The MAPPING — keys, MIDI, routes', run: () => L().keymap.open('MAPPING') },
    { id: 'about', icon: 'about', short: 'about', label: 'ABOUT λWAVES…', hint: 'ABOUT λWAVES', run: () => L().about.open('lw'), surface: true },   // 034 N1
    { id: 'photosensitivity', icon: 'warn', label: 'PHOTOSENSITIVITY WARNING…', hint: 'Show the photosensitivity notice', run: () => { if (app.hooks.warning) { app.hooks.warning.reset(); app.hooks.warning.show(); } } },
    ...(globalThis.lwavesDesktop ? [] : [{ id: 'update', icon: 'download', label: 'UPDATE APP', hint: 'Check for a new build and reload', run: () => H().swClient.refresh() }]),   // 042 S: the desktop is updated by its store
    { id: 'diagnostics', icon: 'duplicate', label: 'COPY DIAGNOSTICS', hint: 'The build, the worker, the stores, the last errors', run: () => H().swClient.copyDiagnostics() },   // 033 THE UPDATER
    { id: 'keys.reset', label: 'RESET THE KEYS', hint: 'Every key binding back to its default', run: () => app.hooks.keys.reset() },
    { id: 'csb.search', group: CS, short: 'search', label: 'SEARCH', hint: 'Search λWAVES', keys: ['Mod+KeyK'], run: () => { const s = S().transport && S().transport.search; if (s) s.open(); }, surface: true },   // iteration 014 A8; 042 Q: the whole app
    /* WAVE 65 · R-K1: the MOD arm is Ctrl+Space (the real Control: ⌘Space is Spotlight); its run() follows the one clock's POWER */
    { id: 'modArm', group: CS, short: 'mod arm', label: 'MOD', hint: 'MOD — routes on or bypassed', keys: ['Ctrl+Space'], kind: 'toggle', get: () => !!app.state.modArm, run: () => S().setModArm(!app.state.modArm), surface: true },
    { id: 'modBar', group: CS, short: 'bar lock', label: 'BAR LOCK', hint: 'Lock the tempo to the state; again: the tempo back', keys: ['KeyG'], get: () => !!(S().barLock && S().barLock.on && S().barLock.on()), run: () => S().barLock(), surface: true },
    { id: 'csb.expand', group: CS, short: 'expand', label: 'EXPAND', hint: 'The CONTROL SURFACE’s expander', kind: 'toggle', get: () => { const p = S().transport && S().transport.bar.parts.panel; return !!(p && p.isOpen()); }, run: () => { const p = S().transport.bar.parts.panel; if (p) p.toggle(); }, surface: true },
    ...[['rate.up', 'RATE ×1.25', 1.25], ['rate.down', 'RATE ÷1.25', 0.8]].map(([id, label, k]) => ({ id: 'csb.' + id, group: CS, short: label, label, hint: label + ' (the flash law may refuse it)', run: () => { const r = ran('rate')({ value: clock.rate * k }); if (typeof r === 'string') tell(r, false); else tell('RATE ' + (+app.ui.rateKnob.get()).toFixed(2)); }, surface: true })),   // 039 F1 (WALK-C #16)
    ...[['tempo.up', 'TEMPO +1 BPM', 1], ['tempo.down', 'TEMPO −1 BPM', -1]].map(([id, label, d]) => ({ id: 'csb.' + id, group: CS, short: label, label, run: () => { const h = app.state.modHost; if (h) { h.clock.setBpm(h.model.transport.bpm + d); S().saveSettings(); } }, surface: true })),
    { id: 'folds', group: CS, short: 'folds', label: 'FOLD ALL', hint: 'FOLD ALL / UNFOLD ALL', kind: 'toggle', icon: () => (foldable().some((w) => w.folded) ? 'unfoldAll' : 'foldAll'), lit: false, get: () => foldable().some((w) => w.folded), surface: true,   // 020 T2; 021 V2: the glyph at the word's read
      word: () => (foldable().some((w) => w.folded) ? 'UNFOLD ALL — open every folded window' : 'FOLD ALL — fold every open window'),
      run: () => { const ws = foldable(), fold = !ws.some((w) => w.folded), rk = S().rk; for (const w of ws) rk.fold(w.id, fold); if (!fold && rk.showPills) rk.showPills(); } },   // 023 B1: EXPAND ALL shows every window's name pill a moment (MIR 1.5.6-alpha.10)
    { id: 'theme', group: CS, short: 'theme', label: 'THEME', hint: 'LIGHT | DARK — the theme', kind: 'set', icon: '', args: { id: '?enum light|dark|system' }, get: () => look().get('theme'), run: theme, surface: true },
    { id: 'info.all', group: CS, short: 'informational', label: 'STAGE WORDS', hint: 'Every stage word off, or the remembered set back', kind: 'toggle', icon: 'informational', get: () => infoKeys.some((k) => IP.get(k)), surface: true,
      run: () => { const lit = infoKeys.filter((k) => IP.get(k)); if (lit.length) { infoKept = lit; IP.set(Object.fromEntries(infoKeys.map((k) => [k, false]))); }
        else IP.set(Object.fromEntries(infoKeys.map((k) => [k, infoKept ? infoKept.includes(k) : !!INFO_ROWS.find((r) => r.key === k).default]))); } },
    { id: 'undo', icon: 'undo', group: PJ, short: 'undo', label: 'UNDO', hint: 'Undo the last edit', keys: ['Mod+KeyZ'], exact: true, undo: 'travel', run: () => hist().undo() },
    { id: 'redo', icon: 'redo', was: 'redoY', group: PJ, short: 'redo', label: 'REDO', hint: 'Redo it', keys: ['Mod+Shift+KeyZ', 'Mod+KeyY'], exact: true, undo: 'travel', run: () => hist().redo() },   // 021 I1: redo and redoY are one row
    { id: 'historyUndo', group: PJ, label: 'BACK FROM THE JUMP', hint: 'Back to the timeline before the last history jump', keys: ['Mod+Alt+KeyZ'], exact: true, undo: 'travel', run: () => hist().historyUndo() },
    { id: 'save', group: PJ, short: 'save', inFields: true, label: 'SAVE', hint: 'Save the open project', keys: ['Mod+KeyS'], exact: true, run: () => { if (proj().current) proj().save(); else proj().show({ name: true }); }, surface: true },
    { id: 'saveAs', group: PJ, short: 'save as', inFields: true, label: 'SAVE AS…', hint: 'Save the project under a new name', keys: ['Mod+Shift+KeyS'], run: () => proj().show({ name: true }), surface: true },
    { id: 'folders', group: PJ, short: 'folders', label: 'FOLDERS…', hint: 'FOLDERS — the projects, the demos, the saves', keys: ['KeyO'], kind: 'toggle', icon: 'folders', get: () => !!(proj() && proj().folders.isOpen()), run: () => proj().toggle(), surface: true },
    { id: 'open', group: PJ, short: 'open', label: 'OPEN…', hint: 'Open a project (FOLDERS)', keys: ['Mod+KeyO'], exact: true, run: () => proj().show(), surface: true },   // 021 call 6
    /* 021 I1 · ONE ROAD TO NEW: FOLDERS asks its own "Save this first?" (SAVE & NEW · NEW WITHOUT SAVING); the key, the menu and the verb take it */
    { id: 'new', group: PJ, short: 'new', label: 'NEW', hint: 'NEW — the empty project', keys: ['Mod+Alt+KeyN'], exact: true, surface: true,
      async run() { proj().show(); const r = await proj().folders.fresh(); return r && r.ok ? undefined : r && r.asked ? 'NEW asks first: FOLDERS holds the question' : 'NEW did not open: the empty project could not be fetched'; } },
    { id: 'quick.save', group: PJ, short: 'quick save', label: 'QUICK SAVE', hint: 'Keep the experiment as the one quick save', run: () => { const ok = S().save(); tell(ok ? 'Quick save kept — QUICK › LOAD brings it back' : 'quick save failed', ok); }, surface: true },
    { id: 'quick.load', group: PJ, short: 'quick load', label: 'QUICK LOAD', hint: 'Load the last quick save', when: quickSaved,
      run: () => { if (proj().openWith(() => S().restore() === true, 'quick load failed')) tell('Quick save loaded'); }, surface: true },
    { id: 'export.json', group: PJ, label: 'EXPORT .json', hint: 'The project as a .json file', run: () => proj().download(), gesture: true, surface: true },
    { id: 'export.mir', group: PJ, label: 'EXPORT .mir', hint: 'The project as a .mir file', run: () => proj().folders.exportProject('mir'), gesture: true, surface: true },
    { id: 'export.png', group: PJ, label: 'EXPORT .png', hint: 'The project as a picture that carries it', run: () => proj().folders.exportProject('png'), gesture: true, surface: true },
    { id: 'export.picture', icon: 'gallery', group: PJ, short: 'picture', label: 'EXPORT PICTURE', hint: 'A picture of the stage (×2)', keys: ['Mod+KeyE'], exact: true, gesture: true, surface: true,   // 021 call 6
      async run() { const C = app.state.capApi && app.state.capApi.capture; if (!C) return; const r = await C.picture({ scale: 2 }); if (r && r.blob) C.save(r); } },
    ...EXPORTS.map((s) => ({ id: 'export.' + s.fmt, group: PJ, label: 'EXPORT ' + s.fmt.toUpperCase(), hint: s.tip, gesture: true, surface: true, when: () => !!(app.state.exporter3d && !app.state.exporter3d.busy && app.ctl.field.ok), run: () => app.state.exporter3d.run(s.fmt) })),
    { id: 'import', group: PJ, label: 'IMPORT…', hint: 'Import a project (.json · .mir · picture)', run: () => proj().pick(), gesture: true, surface: true },
    { id: 'copy.latex', group: PJ, label: 'COPY LaTeX', hint: 'The populated states as LaTeX', run: () => W().copyLatex(), gesture: true, surface: true },
    { id: 'copy.json', group: PJ, label: 'COPY JSON', hint: 'The experiment and its presentation as JSON', run: () => S().copyJSON(), gesture: true, surface: true },
    { id: 'copy.link', icon: 'link', group: PJ, label: 'COPY LINK', hint: 'A URL that reopens this exact state', run: () => S().copyLink().then((e) => { if (e) tell(e.copied ? 'Link copied — ' + e.chars + ' characters' : 'the clipboard refused the link — SPECTRUM shows it to copy', e.copied); return e; }), gesture: true, surface: true },
    { id: 'copy.picture', group: PJ, short: 'copy picture', label: 'COPY PICTURE', hint: 'Copy the stage picture (PNG)', gesture: true, surface: true, undo: 'none',
      run: () => { const C = app.state.capApi && app.state.capApi.capture; if (!C || !globalThis.ClipboardItem) return false;
        navigator.clipboard.write([new ClipboardItem({ 'image/png': C.picture({ scale: 1 }).then((r) => r.blob) })]).then(() => said(true, 'the picture'), () => said(false)); } },
    ...[['name', 'COPY NAME'], ['formula', 'COPY FORMULA']].map(([k, label]) => ({ id: 'copy.' + k, group: PJ, short: 'copy ' + k, label, hint: 'Copy the ' + k, surface: true, undo: 'none', run: (a) => copyOut(wordOf(k, a), 'the ' + k) })),
    ...['reset', 'copy', 'paste', 'fine'].map((v) => ({ id: 'knob.' + v, group: CA, short: 'knob ' + v, label: 'KNOB › ' + (v === 'copy' ? 'COPY VALUE' : v.toUpperCase()), ...(v === 'fine' ? { hint: 'Half the drag gain' } : {}), surface: true, undo: v === 'copy' || v === 'fine' ? 'none' : 'row',
      ...(v === 'fine' ? { kind: 'toggle', get: () => { const k = knobAt(); return !!(k && k.mirKnob && k.mirKnob.fine()); } } : {}), run: (a) => knobAct(knobAt(a), v) })),
    { id: 'knob.copyId', group: CA, short: 'copy id', label: 'COPY ID', hint: 'Copy the control’s id', surface: true, undo: 'none', run: (a) => { const c = at(a).closest && at(a).closest('[data-param], [data-key-action], [data-fav], [data-event]');
      return c ? copyOut(c.dataset.param || c.dataset.keyAction || c.dataset.fav || c.dataset.event, 'the id') : false; } },   // 032 W3: an event target's id too
    { id: 'knob.route', group: CA, short: 'route', label: 'ROUTE THE MACRO', hint: 'Route a macro onto the knob', surface: true, run: (a) => { const k = knobAt(a), id = k && k.dataset.param, M = S().LW && S().LW.mod;
      if (!id || !M) return false; const v = app.state.modView, m = (v && v.api.selected && v.api.selected()) || M.addMacro(); return !!M.route(m, id); } },
    { id: 'control.reset', group: CA, short: 'reset', label: 'RESET', hint: 'The control back to its default', surface: true, run: (a) => { const c = at(a).closest && at(a).closest('[data-param]'), R = app.state.modHost && app.state.modHost.registry, id = c && c.dataset.param;
      const d = id && R && R.has(id) ? R.describeOne(id) : null; if (!d || d.def === null || d.def === undefined) return false; R.setBase(id, d.def); return true; } },
    /* 032 W3 · THE EVENTS (T23): a segmented row, a switch or the 140 grid that names a target (`data-event`, lab/shell/modulation.js) makes an EVENT
       clip on it — the kit's step clip at the band in force, its bands remembered (MIR 1.5.6-alpha.24, `createClip`) — and COPY VALUE puts the pressed
       option's band centre where a point's PASTE VALUE reads it (the timeline editor's `copiedValue`) */
    { id: 'event.create', icon: 'lanes', group: CA, short: 'create event', label: 'CREATE EVENT', hint: 'A step clip of the control on the TIMELINE', surface: true, run: (a) => {
      const e = eventAt(a), tl = app.state.tl, R = app.state.modHost && app.state.modHost.registry; if (!e || !tl || !R || !R.has(e.dataset.event)) return false; return !!tl.editor.createClip(e.dataset.event); } },
    { id: 'event.copy', group: CA, short: 'copy value', label: 'COPY VALUE', hint: 'Copy the option for a point’s PASTE VALUE', surface: true, undo: 'none', run: (a) => {
      const e = eventAt(a), tl = app.state.tl, R = app.state.modHost && app.state.modHost.registry, id = e && e.dataset.event; if (!id || !tl || !R || !R.has(id)) return false;
      const d = R.describe(id), b = at(a).closest('[data-v], .pk-c'), sw = at(a).closest('.sw');
      const u = b ? R.toNorm(id, +(b.dataset.v ?? b.dataset.a)) : d.map === 'toggle' ? (sw && sw.getAttribute('aria-pressed') === 'true' ? 0.75 : 0.25) : R.readNorm(id);   // a toggle's two bands' centres (an action's base is 0, never its state)
      if (!Number.isFinite(u)) return false; tl.editor.copiedValue = u; W().wState.setStatus('value copied · ' + d.label, 'live'); return true; } },
    { id: 'control.learn', group: CA, short: 'learn', label: 'LEARN…', hint: 'Learn a key, MIDI or a route (the MAPPING)', surface: true, undo: 'none', run: (a) => { const c = at(a).closest && at(a).closest('[data-key-action]');
      if (!c || !api.mapping) return false; L().keymap.open('MAPPING'); api.mapping.learn(c.dataset.keyAction); return true; } },
    ...[['open', 'OPEN', (t) => t.click()], ['isomers', 'ISOMERS', (t) => t.querySelector('.mm-iso') && t.click()],
      ['keep', 'KEEP ON THIS DEVICE', (t) => { const i = t.querySelector('img[data-vol]'); return i && chem() ? chem().keepMolecule(i.dataset.vol + ':' + i.dataset.mol) : false; }]]
      .map(([k, label, f]) => ({ id: 'picker.' + k, group: V, short: 'picker ' + k, label: 'MAIN MENU › ' + label, surface: true, undo: 'none', run: (a) => { const t = tileAt(a); return t ? f(t) : false; } })),
    { id: 'picker.look', group: V, short: 'picker look', label: 'MAIN MENU › LOOK', hint: 'The look of the pictures', kind: 'set', args: { id: '?enum density|phase|im|re|cloud|solid|labels' }, undo: 'none', surface: true,
      get: () => (document.querySelector('#lwMenu .mm-lk.on') || { dataset: {} }).dataset.look, run: (a) => { const b = a && a.id && document.querySelector('#lwMenu .mm-lk[data-look="' + a.id + '"]'); if (b) b.click(); return !!b; } },
    { id: 'esp.side', group: V, short: 'esp side', label: 'ESP BAR SIDE', hint: 'The ESP bar’s side', kind: 'set', args: { id: '?enum right|left|top|bottom' }, get: () => IP.get('espBarSide'), surface: true,
      run: (a) => { const s = ['right', 'left', 'top', 'bottom']; IP.set({ espBarSide: a && s.includes(a.id) ? a.id : s[(s.indexOf(IP.get('espBarSide')) + 1) % 4] }); } },
    { id: 'notebook.copy', group: PJ, short: 'copy notebook', label: 'COPY TEXT', hint: 'Copy the NOTEBOOK’s text', surface: true, undo: 'none', run: () => copyOut((document.querySelector('#notebook .nb-text') || {}).value, 'the notebook') },
    { id: 'spectrum.solo', group: WD, short: 'solo spectrum', label: 'SOLO SPECTRUM', hint: 'Fold every other window', surface: true, run: () => api.run('window.spectrum.solo') },
    ...[['film.picture', 'RENDER › CAPTURE IMAGE', '.sr-capture'], ['film.record', 'RENDER › RENDER', '.sv-primary']].map(([id, label, cls]) => ({ id, group: PJ, short: label.split(' › ')[1].toLowerCase(), label, surface: true,
      run: () => { const b = document.querySelector('.dev[data-id="render"] ' + cls); if (b && !b.disabled) b.click(); } })),   // the kit's RENDER card's own buttons (by their class)
    { id: 'invert', icon: 'invertColors', group: V, short: 'invert', label: 'INVERT', hint: 'Invert the cloud — ink, not light', kind: 'toggle', get: () => !!mat.invert, run: () => S().LW.setInvert(!mat.invert), surface: true },
    ...[['captions', 'CAPTIONS', 'capSw'], ['formula', 'FORMULA', 'molFormulaSw'], ['labels', 'ATOM LABELS', 'atomLabelsSw']].map(([k, label, h]) =>
      ({ id: 'view.' + k, icon: { captions: 'captions', formula: 'formula', labels: 'labels' }[k], group: V, short: label.toLowerCase(), label, hint: 'The stage’s ' + label + ', on or off', kind: 'toggle', get: () => !!(ui[h] && ui[h].get()), run: () => tap(ui[h]), surface: true })),
    /* 032 W3: SETTINGS › DISPLAY's FRAME and AXIS as rows (a toggle each: `action.view.frame` · `action.view.axis` are their EVENT targets); the switch's own
       press still cycles the frame's look (BOX · LATTICE · DOTS) — these turn it on or off */
    { id: 'view.frame', group: V, short: 'frame', label: 'FRAME', hint: 'The field boundary, on or off', kind: 'toggle', get: () => mat.frame !== false, run: () => S().LW.setFrame(mat.frame === false), surface: true },
    { id: 'view.axis', group: V, short: 'axis', label: 'AXES', hint: 'The x, y and z axes, on or off', kind: 'toggle', get: () => mat.axis !== false, run: () => S().LW.setAxis(mat.axis === false), surface: true },
    ...[['badges', 'STATUS TAGS'], ['hints', 'CONTROL HINTS']].map(([k, label]) => ({ id: 'view.' + k, group: V, short: label.toLowerCase(), label, hint: label + ', on or off', kind: 'toggle', get: () => !!look().get(k), run: () => look().set({ [k]: !look().get(k) }), surface: true })),
    { id: 'settings.playLock', group: SE, short: 'playback lock', label: 'PLAYBACK LOCK', hint: 'CLOCK LOCKED — one cadence step a frame', kind: 'toggle', get: () => !!app.ctl.fieldRate.lock, surface: true,
      run: () => { const R = app.ctl.fieldRate; R.lock = !R.lock; if (ui.showPlayback) ui.showPlayback(); S().saveSettings(); } },
    ...[['autoScale', 'AUTO SCALE', 'autoSw'], ['governor', 'GOVERNOR', 'govSw'], ['frame', 'FRAME', 'frameSw'], ['axis', 'AXES', 'axisSw'], ['audio', 'AUDIO', 'audioSw'], ['keepFrames', 'KEEP FRAMES', 'keepSw'], ['domainAuto', 'DOMAIN AUTO', 'domainAuto']]
      .map(([k, label, h]) => ({ id: 'settings.' + k, group: SE, short: label.toLowerCase(), label: 'SETTINGS › ' + label, kind: 'toggle', get: () => !!(ui[h] && ui[h].get()), run: () => tap(ui[h]), surface: true })),
    { id: 'chem.on', group: CA, short: 'molecules on', label: 'MOLECULES', hint: 'MOLECULES, on or off', kind: 'toggle', get: () => !!(chem() && chem().on), run: () => { const c = chem(); if (c) c.setOn(!c.on); }, surface: true },
    { id: 'chem.vibrate', group: CA, short: 'vibrate', label: 'VIBRATE', hint: 'MOLECULES › VIBRATE', kind: 'toggle', get: () => !!(chem() && chem().vibLine && chem().vibLine()), run: () => { const c = chem(); if (c && c.on) return c.vibrate({ on: !c.vibLine() }); }, surface: true },
    { id: 'chem.breathe', group: CA, short: 'breathe', label: 'BREATHE', hint: 'MOLECULES › BREATHE', run: () => { const c = chem(); if (c && c.on) return c.vibrate({ on: true, breathe: true }); }, surface: true },
    ...[['chem.kick', 'MOLECULES › KICK'], ['ab.storeA', 'TRANSITION › STORE A'], ['ab.storeB', 'TRANSITION › STORE B'], ['eq.sound', 'EQUALIZER › SOUND'], ['gas.launch', 'BOX › LAUNCH'], ['gas.bounce', 'BOX › BOUNCE'], ['vortex.jump', 'VORTEX › JUMP TO EVENT']]
      .map(([id, label]) => ({ id, group: CA, short: label.split(' › ')[1].toLowerCase(), label, run: () => press(id), surface: true })),   // the act lives in its card: the row presses the card's tagged control
    ...[['particles', 'VORTEX › PARTICLES', 'pOn'], ['ab.on', 'TRANSITION › TRANSITION', 'abSw'], ['vortex.locate', 'VORTEX › LOCATE', 'vorOn']].map(([id, label, h]) =>
      ({ id, group: CA, short: label.split(' › ')[1].toLowerCase(), label, kind: 'toggle', get: () => (h === 'vorOn' ? !!(W().vortex && W().vortex.on) : !!(ui[h] && ui[h].get && ui[h].get())), run: () => (h === 'vorOn' ? ui.vorOn && ui.vorOn.click() : tap(ui[h])), surface: true })),
    /* NODES' keys (018 D3's ground map, 021 I1): rows of the one table, live while a graph's ground has the focus (THE FOCUS LAW, the timeline's precedent);
       chords by place (AZERTY and Dvorak keep them); Tab is the kit's again — the add menu is Shift+A */
    ...[['nodes.left', 'nudge left', 'ArrowLeft', (k, a) => k.nudge(-1, 0, a)], ['nodes.right', 'nudge right', 'ArrowRight', (k, a) => k.nudge(1, 0, a)], ['nodes.up', 'nudge up', 'ArrowUp', (k, a) => k.nudge(0, -1, a)],
      ['nodes.down', 'nudge down', 'ArrowDown', (k, a) => k.nudge(0, 1, a)], ['nodes.delete', 'delete', ['Delete', 'Backspace'], (k) => k.remove()], ['nodes.duplicate', 'duplicate', 'Mod+KeyD', (k) => k.duplicate()],
      ['nodes.all', 'select all', 'Mod+KeyA', (k) => k.all()], ['nodes.undo', 'undo (the graph’s own)', 'Mod+KeyZ', (k) => k.undo()], ['nodes.redo', 'redo (the graph’s own)', ['Mod+Shift+KeyZ', 'Mod+KeyY'], (k) => k.redo()],
      ['nodes.bypass', 'bypass the selection', 'KeyM', (k) => k.bypass()], ['nodes.solo', 'solo the first selected', 'KeyS', (k) => k.solo()], ['nodes.off', 'BYPASS ALL', 'Backslash', (k) => k.off()],
      ['nodes.fold', 'fold the selection', 'KeyH', (k) => k.fold()], ['nodes.add', 'ADD NODE — the + menu', 'Shift+KeyA', (k) => k.add()], ['nodes.fit', 'FIT — every card in view', 'Home', (k) => k.fit()],
      ['nodes.escape', 'menu away, else the selection', 'Escape', (k) => k.escape()]]
      .map(([id, label, k, f]) => ({ id, group: N, short: label.split(' — ')[0], label: 'NODES › ' + label.split(' — ')[0].toUpperCase(), hint: label[0].toUpperCase() + label.slice(1), keys: [].concat(k), exact: !/^Arrow/.test(k), undo: 'none', when: () => !!nodesAt(), run: (a) => { const K = nodesAt(); if (K) f(K, a); } })),
  ];
  /* 044 AV2 · A PICTURE ON EVERY MENU ROW (Josh's tick 4): the glyph of a row that names none itself, by its id — one drawing per idea (COPY wears
     `duplicate`, a RESET `reload`, the project as a file `projectFile`); a menu, the search and a bar seat read `icon` as they always did */
  const PIC = { zoomIn: 'zoom', zoomOut: 'zoom', 'state.normalize': 'unit', reseed: 'particles', 'preset.next': 'chevronRight', 'preset.prev': 'chevronLeft', style: 'paint', view: 'psi', palette: 'palette',
    historyUndo: 'back', save: 'saveInto', saveAs: 'saveNew', open: 'folder', new: 'plus', 'quick.save': 'saveInto', 'quick.load': 'folder', 'import': 'upload', 'render.frames': 'frames',
    'export.json': 'projectFile', 'export.mir': 'projectFile', 'export.png': 'projectFile', 'export.glb': 'shape', 'export.obj': 'shape', 'export.stl': 'shape', 'export.npz': 'grid', 'export.cube': 'grid',
    'copy.latex': 'words', 'copy.json': 'projectFile', 'copy.picture': 'duplicate', 'copy.name': 'duplicate', 'copy.formula': 'duplicate', 'notebook.copy': 'duplicate', 'knob.copy': 'duplicate', 'knob.copyId': 'duplicate', 'event.copy': 'duplicate',
    'knob.reset': 'reload', 'control.reset': 'reload', 'keys.reset': 'reload', 'knob.route': 'modulation', 'control.learn': 'mapping', 'picker.open': 'molecule', 'picker.isomers': 'bonds', 'picker.keep': 'download', 'picker.look': 'eye',
    'esp.side': 'sideRight', 'spectrum.solo': 'solo', 'film.picture': 'gallery', 'film.record': 'record', 'view.badges': 'badge', 'view.hints': 'tip', 'settings.playLock': 'clock', modArm: 'power', modBar: 'lock',
    'csb.search': 'search', 'csb.expand': 'expand', 'csb.rate.up': 'chevronUp', 'csb.rate.down': 'chevronDown', 'csb.tempo.up': 'chevronUp', 'csb.tempo.down': 'chevronDown',
    'chem.on': 'molecule', 'chem.vibrate': 'molecule', 'chem.breathe': 'molecule', 'chem.kick': 'molecule' };
  const rows = [], byId = new Map(), subs = new Set(), added = new Set();
  const add = (list) => { const out = []; for (const r of [].concat(list)) if (r && r.id && !byId.has(r.id)) { const row = { group: WD, kind: 'fire', undo: 'row', ...(PIC[r.id] ? { icon: PIC[r.id] } : {}), ...r }; rows.push(row); byId.set(row.id, row); out.push(row); } if (out.length) for (const f of added) f(out); return out; };
  add(ROWS);
  /* THE VERBS (lab/verbs.js): each verb is the action of its id with arguments — a verb with a key row of its own (view, notebook, new) runs that row */
  const verbRows = () => add((S().verbs ? S().verbs.table : []).map((v) => ({ id: v.id, label: v.doc, group: 'VERBS', kind: 'set', args: v.args, bind: false, undo: 'none', run: (a) => v.run(app, a || {}) })));
  /* every window of the rack: open · close · fold (generated, so a window registered later joins at the next sync) */
  const sync = () => { verbRows(); const rk = S().rk; if (!rk) return; for (const w of rk.windows()) { const t = (w.title || w.id).toUpperCase(), id = w.id;
    add([{ id: `window.${id}.open`, icon: 'plus', group: WD, short: t + ' open', label: t + ' › OPEN', run: () => reveal(id), surface: true },
      { id: `window.${id}.close`, icon: 'close', group: WD, short: t + ' close', label: t + ' › CLOSE', run: () => { if (id === 'nodes' && nodes()) nodes().close(); rk.close(id); S().saveSettings(); }, surface: true },
      { id: `window.${id}.fold`, icon: 'chevronDown', group: WD, short: t + ' fold', label: t + ' › FOLD', kind: 'toggle', get: () => !!(rk.windows().find((x) => x.id === id) || {}).folded, run: () => rk.fold(id, !(rk.windows().find((x) => x.id === id) || {}).folded), surface: true },
      /* 022 P2 · the title bar's menu: FLOAT (toggle), SIDE (the other rack), RESET (home: docked on its own side, unfolded), SOLO (every other window folded) */
      { id: `window.${id}.float`, icon: 'rackOut', group: WD, short: t + ' float', label: t + ' › FLOAT', kind: 'toggle', get: () => !!winOf(id).floating, run: () => rk.toggleFloat(id), surface: true },
      { id: `window.${id}.side`, icon: () => (winOf(id).side === 'right' ? 'sideLeft' : 'sideRight'), group: WD, short: t + ' side', label: t + ' › TO THE OTHER RACK', word: () => 'TO THE ' + (winOf(id).side === 'right' ? 'LEFT' : 'RIGHT') + ' RACK', run: () => { if (winOf(id).floating) rk.dock(id); rk.move(id, { side: winOf(id).side === 'right' ? 'left' : 'right' }); }, surface: true },
      { id: `window.${id}.reset`, icon: 'reload', group: WD, short: t + ' reset', label: t + ' › RESET PLACE', hint: 'Back home, unfolded', run: () => { if (winOf(id).floating) rk.dock(id); rk.move(id, { side: (rk.spec(id) || {}).side }); rk.fold(id, false); }, surface: true },
      { id: `window.${id}.solo`, icon: 'solo', group: WD, short: t + ' solo', label: t + ' › SOLO', hint: 'Fold every other window', run: () => { for (const x of foldable()) rk.fold(x.id, x.id !== id); }, surface: true }]); } };
  let edit = (a, run) => run();   // keys.js hands in THE ONE WRAPPER that names a history row (keyEdit), once the key table that spells the name exists
  /* THE ESCAPE STACK: the topmost layer closes first; a layer that has gone (`alive` false) is passed over; nothing open → the stage gives the keyboard back */
  const layers = [];
  const escape = { push(close, { fields = false, alive = null } = {}) { const L0 = { close, fields, alive }; layers.push(L0); return () => { const i = layers.indexOf(L0); if (i >= 0) layers.splice(i, 1); }; } };
  addEventListener('keydown', (e) => { if (e.code !== 'Escape' || e.defaultPrevented || e.isComposing) return; const inField = isField(e.target, true);
    for (let i = layers.length - 1; i >= 0; i--) { const L0 = layers[i]; if (L0.alive && !L0.alive()) { layers.splice(i, 1); continue; } if (inField && !L0.fields) return; layers.splice(i, 1); e.preventDefault(); L0.close(); return; } });
  const api = {
    keyState, reveal, escape,
    list: () => { sync(); return rows.slice(); }, get: (id) => byId.get(id) || null, add, sync,
    /** run(id, args) — the row's act under THE ONE WRAPPER (a history row named for the action, whatever fired it); refused (false) when its `when` says no */
    run(id, args) { const a = byId.get(id); if (!a) return false; if (a.when) { try { if (!a.when()) return false; } catch (_) { return false; } }
      let out; edit(a, () => { out = a.run(args); }); return out; },
    up(id) { const a = byId.get(id); if (a && a.up) a.up(); },
    /** fire(id, on) — a toggle's level from MIDI or a route: runs only when the state differs (a fire row runs on every rising edge) */
    fire(id, on) { const a = byId.get(id); if (!a) return false; if (a.get && on !== undefined && !!a.get() === !!on) return false; return api.run(id) !== false; },
    setEdit(fn) { edit = fn; }, notify(id) { for (const f of subs) f(id); }, onState(fn) { subs.add(fn); return () => subs.delete(fn); }, onAdd(fn) { added.add(fn); return () => added.delete(fn); },
  };
  app.sh.ACTIONS = api;
  return api;
}
