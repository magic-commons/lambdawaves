/* mir/app.js — THE STANDARD WIRING, as one call.  createApp() is the checklist every MIR app wrote by hand at the top of
 * its app.js (the starter's first hundred lines), in the order the kit needs, and nothing else.
 *
 *   const app = await createApp({ name: 'TETRIS', key: 'tetris', version: '0.1.0', stage, state: S, present: kick });
 *   const speed = app.param('speed', 'SPEED', 0, 2);        // a kit knob, a modulation target, a saved value
 *
 * THE LAWS IT KEEPS
 *   1. THIN.  Every piece is the kit's own constructor, called with the options an app would pass, in this order:
 *      the banner · a first run? · the rack (and its float layer) · the look (accent, GUI) · the language · the key table ·
 *      modulation · the one clock and the transport bar · the parameters · the pages · the notebook · FOLDERS ·
 *      INFORMATIONAL and its greeting · the keys' help view and the KEYBOARD window · the menus · the hints and the pressed look · describe ·
 *      the scene guard · the wake lock · the skip link · the live project (off by default).  It adds no behaviour of its
 *      own; read the function below as the checklist.
 *   2. EVERY PIECE IS OPTIONAL AND STILL YOURS.  Pass `false` to leave one out (`folders: false`), an object to add
 *      options to its constructor (`rack: { favourites: 4 }`), and build any piece by hand instead: each is returned.
 *   3. ONE CLOCK.  The transport's ▶ (and Space) is the app's ONE play; modulation's power only bypasses the routes
 *      (docs/MODULATION.md, "One clock").  The clock is modulation's own unless the app passes its own (`clock`).
 *   4. THE BAR IS THE OPENER.  On a first run (nothing saved) every window stays closed and the bar is all there is:
 *      register rack windows with `open: !app.first` (docs/TRANSPORT.md, the opener law).
 *   5. THE KIT'S WINDOWS TAKE THE POINTER IN THE KIT'S OWN FLOAT LAYER (the rack's `#floats`): an app writes no
 *      window layer and no pointer-events rule for one.
 *
 * makeParam(o) is the one function that makes a number a kit control, a modulation target and a saved value; app.param()
 * is it with the app's state and modulation filled in. */
import { el, knob, onThemeChange, label } from './kit.js';
import { installPress } from './core/pointer.js';
import { registerProjectPart } from './core/project.js';
import { createDescribe, dumpLines } from './core/describe.js';
import { frame } from './core/frame.js';
import { installWakeLock } from './core/wakelock.js';
import { installKbm, kbm } from './core/kbm.js';
import { createSession } from './core/session.js';
import { installControlHelp } from './control-help.js';
import { wordmark } from './shell/wordmark.js';
import { createMenubar, comingRow, purgeRow, copyDumpRow } from './shell/menubar.js';
import { installBanner } from './shell/banner.js';
import { createSceneGuard, uiSpace } from './shell/scene-guard.js';
import { recentRows } from './folders/files.js';
import * as modBind from './modulation/bind.js';
import { handWrite } from './modulation/registry.js';
import { installPattern } from './pattern/window.js';
import { createWorkspaces } from './window/workspaces.js';
import { createAccent } from './shell/accent.js';
import { createNotebook } from './shell/notebook.js';
import { gplLicence, kitType } from './shell/about.js';
import { createPages } from './shell/pages.js';
import { createRack } from './shell/rack.js';
import { createGui } from './shell/gui.js';
import { createKeys, localKeyStorage, KIT_KEYS, toggleFullscreen } from './shell/keys.js';
import { createTransport, firstRun, rackOpeners, transportActions } from './shell/transport.js';
import { createKeysHelp, createKeyboardWindow } from './keyboard/keyboard.js';
import { languageMenu, startLanguage } from './shell/language.js';
import { notice } from './shell/notice.js';
import { createFolders } from './folders/folders.js';
import { createInfoLayer, infoActions } from './info/layer.js';
import { greet } from './info/page.js';

/** the controls installPress gives the pressed look (core/pointer.js) */
export const PRESSABLE = '.sw, .seg-b, .trig, .tbtn, .mir-rack-btn';
const FONTS = new URL('../fonts/', import.meta.url).href, LICENSE = new URL('../LICENSE', import.meta.url).href;
const opt = (v) => (v && typeof v === 'object' ? v : {});

/**
 * makeParam({ state, key, label, min, max, map, mod, onChange, id, make, …widget }) → the parameter
 *   One number, `state[key]`, becomes a kit control (`make`, default knob; fader works too), a modulation target (when
 *   `mod` is given; id 'app.<key>' unless `id`) and a saved value.  `map` is the target's map (linear · log · wrap ·
 *   integer · bipolar) and sets the widget's own option for it (log, wrap; integer rounds the shown value).
 *   THE HAND LAW: a hand on a routed control moves the route's base; otherwise it writes the number.
 *   → { id, key, label, min, max, map, widget, root, get(), value(), set(v), home, remove() }
 *     get()    the number now (the modulated reading while a route drives it)
 *     value()  THE BASE: what the hand set, never the modulated reading — what a project saves
 *     set(v)   as a hand would: the base while routed, else the number
 *     remove() the control stops being a target, and its routes go
 */
export function makeParam({ state, key, label = String(key).toUpperCase(), min = 0, max = 1, map = 'linear', mod = null, onChange = null,
  id = null, make = knob, unit = '', hint = '', ...more }) {
  if (!id && !/^[a-z][a-z0-9]*$/.test(String(key))) throw new TypeError(`app.param: the key "${key}" must be lowercase letters and digits, starting with a letter (it becomes the id app.${String(key).toLowerCase().replace(/[^a-z0-9]/g, '')}): write '${String(key).toLowerCase().replace(/[^a-z0-9]/g, '')}'`);
  id = id || 'app.' + key;
  const get = () => state[key];
  const put = (v) => { state[key] = v; if (onChange) onChange(key, v); };
  const shaped = { ...(map === 'log' ? { log: true } : {}), ...(map === 'wrap' ? { wrap: true } : {}), ...(map === 'integer' ? { fmt: (v) => String(Math.round(v)) } : {}) };
  const widget = make({ label, min, max, value: get(), unit, ...shaped, ...more,
    onInput: (v) => { if (!handWrite(mod, id, v)) put(v); if (more.onInput) more.onInput(v); } });
  widget.root.dataset.info = key;                                   // a page's `ui:<key>` label points here
  const home = get();
  const off = mod ? mod.add({ id, label, unit, hint, min, max, map, get, set: put, widget }) : null;
  const routed = () => !!(mod && mod.isModulated(id));
  return {
    id, key, label, unit, min, max, map, widget, root: widget.root, home, get,
    value: () => (routed() ? mod.baseOf(id) : get()),
    set(v) { widget.set(v); if (!handWrite(mod, id, v)) put(v); },
    remove: () => { if (off) off(); },
  };
}

/**
 * createApp(options) → Promise<app>
 *   name, key      the app's name (the wordmark, ABOUT) and the prefix of every store it keeps (default: name, lower case)
 *   version, what  for ABOUT and describe()
 *   stage          the element the picture is in (the notebook and the words sit on it); host: where the chrome goes
 *                  (default the stage's parent)
 *   state, present the numbers app.param() reads and writes, and "draw again" (called when one changes)
 *   clock          the ONE play's clock { play, pause, isPlaying, onChange } (default: modulation's own)
 *   keys           the app's own key rows (createKeys actions), ahead of the kit's
 *   menus          { FILE, EDIT, VIEW, WINDOW, … } rows that replace or add to the kit's menus (functions or arrays)
 *   pages          rows to add to the pages ({ title, md, shared }); page 0 is the greeting
 *   thumbnail      () → the canvas FOLDERS takes a project's picture from
 *   about          extra ABOUT options (tagline, copyright …); sub: the line under the wordmark
 *   and one entry per piece — gui, transport, rack, mod, pattern, notebook, folders, info, greet, help, keyboard, menubar, describe,
 *   banner, sceneGuard, wakeLock — each `false` to leave it out, or an object of extra options for its constructor.
 *   pattern        the PATTERN window (mir/pattern/window.js) with the modulation: PATT on every ENV face, WINDOW › PATTERN
 *   factory        the app's bundled starter presets, handed to installModulation (`{ presets, folder, apply }` or a list)
 *   modRoots       more modulation id roots beside 'app' (1.5.0-alpha.14): a kit panel's targets sit under its own root
 *                  (`camera`, `grade`, `curves`, `lanes`, `xy` by default), so `modRoots: ['grade', 'curves']` lets
 *                  `createGradePanel({ mod: app.mod })` route with no other line; `mod: { roots }` still wins
 *   timeline       off by default; true or installTimeline's options: the TIMELINE (mir/timeline/bind.js) on the
 *                  modulation's clock, and with it the lego stack (window/workspaces.js): MODULATION seats over TIMELINE
 *                  when both are open, and the MIR switch in the modulation preset bar swaps the two
 *   canvas         the picture's element the scene guard watches (default: the first <canvas> in the stage)
 *   coming         [[NAME, hint], …] windows to come: disabled '○  NAME  (coming)' rows at the foot of WINDOW
 *   session        off by default.  true (or { key, …createSession options, auto }) keeps the live project — every
 *                  registered project part — in one storage key (default '<key>.session'): autosaved 300 ms after a
 *                  change and on leaving, given back on the next load.  With no opener (wave 13), `auto` (default true)
 *                  resumes the saved work, or arms autosave, one task after createApp resolves, so the app's own parts
 *                  registered right after `await createApp()` are in it.  → app.session (core/session.js)
 *   THE KEYS are BASINS' (shell/keys.js KIT_KEYS): Space play · S FOLDERS · M modulation · J notebook · B the rack ·
 *   T dock the transport · H hide the interface · F full screen · Ctrl/⌘+S save · ? the keys.
 *   history        off by default.  The app's one stack (history/history.js createHistory): a HISTORY window behind WINDOW › HISTORY (history/window.js),
 *                  which brings the keys, the gesture naming and the modulation rack as a domain; `historyWindow` adds that window's options
 *   render         off by default.  { frame(i, ctx) → the picture, motions?, subject?, picture?, motionUi?, sections?, prefix?, card?: false, …createRecorder
 *                  options }: RENDER (render/recorder.js): the recorder on the modulation host and the timeline's editor, `busy` to the timeline, RENDER as a
 *                  FOLDERS tab and as a rack window (`card: false` leaves the window out) → app.recorder.  Needs `mod`; docs/RENDER.md
 *   subject        () → { left, top, width, height } in stage px: the thing the words on the picture talk about (the
 *                  board, the ring); the greeting rests beside it, never under the bar or a rack (default: none)
 *   → { first, param, params, playing(), play(), pause(), safeRect(), hideInterface(), dump(), rack, keys, gui, accent,
 *       transport, mod, pattern, timeline, workspaces, pages, notebook, folders, info, greeting, help, menubar, describe, floats, banner, sceneGuard,
 *       wakeLock, session, history, recorder, keyboard, kbm }   (kbm: core/kbm.js, the live pointer; also window.__MIR.app, the live shell object for a rig or the console: BASINS' __BASINS)
 *   The app's `present()` is also called when the theme or the look changes and when a window opens or closes.
 */
export async function createApp(o = {}) {
  const name = o.name || 'APP', key = o.key || String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const stage = o.stage, host = o.host || stage.parentElement, state = o.state || {};
  const present = () => { if (o.present) o.present(); };
  const want = (piece) => o[piece] !== false;
  let tr = null, rack = null, mod = null, notebook = null, folders = null, info = null, help = null, kb = null, pattern = null, timeline = null, ws = null, recorder = null, hist = null;

  /* 0. THE BANNER first, so a problem anywhere below is on the screen (BASINS: "the only debugger on an iPad") */
  const banner = want('banner') ? installBanner({ host: stage, ...opt(o.banner) }) : null;

  /* 0. THE LIVE POINTER (core/kbm.js): touch or precision by the pointer in use, not the device class — before any
        piece asks it, so a trackpad on an iPad hovers like the desktop from the first move */
  installKbm();

  /* 0. A FIRST RUN?  Asked before anything is saved: nothing stored → every window stays closed (the opener law) */
  const first = firstRun(key + '.transport', key + '.rack', key + '.modulation');

  /* 1. THE RACK and the bar's element (the rack seats the bar and gives the kit's windows their float layer, #floats).
        The rack builds nothing before the first frame, so the look below is still applied before anything draws.  With
        the bar, the rack shows no + and ☆ of its own: the bar's latches open the windows (as gallery/transport.html) */
  const bar = want('transport') ? el('div', '', host) : null;
  if (bar) bar.id = 'transport';
  if (want('rack')) rack = createRack({ host, key: key + '.rack', transport: bar, favourites: 0, scrollbar: true, notebook: () => notebook, ...(bar ? { chrome: false, handle: 'always' } : {}), ...opt(o.rack) });
  const floats = rack ? rack.el.floats : el('div', 'mir-rack-floats', host);
  const moved = (r) => (tr ? tr.moved(r) : rack ? rack.dodge(r) : null);

  /* 2. THE LOOK: the GUI window applies the stored theme, accent and glass */
  const accent = createAccent({ onAccent: (a, b) => { if (mod && mod.view && typeof mod.view.setAccent === 'function') mod.view.setAccent(a, b); } });   // the modulation window's tints follow the accent
  const gui = want('gui') ? createGui({ host: floats, app: { name, rack }, accent, about: { fonts: FONTS }, ...opt(o.gui) }) : null;

  /* 3. THE LANGUAGE the user chose, before the first label is drawn */
  await startLanguage();

  /* 4. THE KEYS, once, as data: the app's rows first (a chord held twice runs the first), then the kit's — BASINS'
        table (KIT_KEYS): S FOLDERS · M modulation · J notebook · B the rack · T dock · H hide · F full screen · Space play */
  const K = (id) => [KIT_KEYS[id]];
  /** hideInterface() — H: the whole interface out of paint and back (BASINS hideUi: the focus leaves what is hidden) */
  function hideInterface() {
    const hidden = !document.body.classList.contains('ui-hidden');
    if (rack) rack.setInterface(!hidden); else document.body.classList.toggle('ui-hidden', hidden);
    if (hidden && document.activeElement && document.activeElement.blur) document.activeElement.blur();
    present();
    return hidden;
  }
  const keys = createKeys({ storage: localKeyStorage(key + '.keys'), actions: [...(o.keys || []),
    ...(bar ? transportActions(() => tr) : []),
    { id: 'save', label: 'SAVE', group: 'FILE', keys: K('save'), inFields: true, run: () => folders && folders.save() },
    { id: 'folders', label: 'FOLDERS', group: 'WINDOW', keys: K('folders'), run: () => folders && folders.toggle() },
    { id: 'modulation', label: 'MODULATION', group: 'WINDOW', keys: K('modulation'), run: () => mod && mod.toggle() },
    { id: 'pattern', label: 'PATTERN', group: 'WINDOW', keys: [], run: () => pattern && pattern.toggle() },
    { id: 'timeline', label: 'TIMELINE', group: 'WINDOW', keys: [], run: () => timeline && timeline.toggle() },
    { id: 'notebook', label: 'NOTEBOOK', group: 'WINDOW', keys: K('notebook'), run: () => notebook && notebook.toggle() },
    { id: 'help', label: 'KEYS', group: 'WINDOW', keys: K('help'), run: () => help && help.toggle() },
    ...(want('keyboard') ? [{ id: 'keyboard', label: 'KEYBOARD', group: 'WINDOW', keys: [], run: () => kb && kb.toggle() }] : []),
    ...(want('rack') ? [{ id: 'rack', label: 'HIDE / SHOW the rack', group: 'WINDOW', keys: K('rack'), run: () => rack && rack.toggleHidden() }] : []),
    ...(want('rack') && bar ? [{ id: 'dock', label: 'DOCK / UNDOCK the transport', group: 'WINDOW', keys: K('dock'), run: () => tr && tr.dock(!tr.docked) }] : []),
    /* EVERY KIT WINDOW IS A ROW, keys or none (wave 19), so the KEYBOARD window can bind it and a menu shows what it holds;
       their keys are Josh's to give, so none is invented here */
    ...(o.history && want('history') && want('mod') ? [{ id: 'history', label: 'HISTORY', group: 'WINDOW', keys: [], run: () => hist && hist.toggle() }] : []),
    ...(o.render && want('mod') && want('rack') && opt(o.render).card !== false ? [{ id: 'render', label: 'RENDER', group: 'WINDOW', keys: [], run: () => rack && rack.toggle('render') }] : []),
    ...(gui ? [{ id: 'gui', label: 'MIR OPTIONS', group: 'WINDOW', keys: [], run: () => gui.toggle() },
      { id: 'gui-about', label: 'MIR ABOUT', group: 'WINDOW', keys: [], run: () => gui.toggle('about') }] : []),
    { id: 'hide', label: 'HIDE the interface', group: 'VIEW', keys: K('hide'), run: hideInterface },
    { id: 'fullscreen', label: 'FULL SCREEN', group: 'VIEW', keys: K('fullscreen'), run: () => toggleFullscreen(document) },
    ...(want('info') ? infoActions(() => info) : []),
  ] });

  /* 5. MODULATION: the window and its seam.  Targets arrive through app.param(), a lazily built window's when it is built */
  /* with a timeline, the two windows stack like legos (window/workspaces.js): each reports its moves and its open/close
     to the stack as well as to the bar's dodge; the MIR switch after the preset arrows swaps them */
  const modMoved = (r) => { moved(r); if (ws) ws.moved('upper', r); };
  if (want('mod')) mod = modBind.installModulation({ mount: floats, params: [], present, storageKey: key + '.modulation', presetKey: key + '.modpresets', moved: modMoved,
    ...(gui && typeof gui.sampling === 'function' ? { automationGrid: gui.sampling().grid } : {}),   // GUI › SAMPLING · AUTOMATION, saved
    ...(o.factory ? { factory: o.factory } : {}),
    ...(Array.isArray(o.modRoots) && o.modRoots.length ? { roots: [...new Set(['app', ...o.modRoots.map(String)])] } : {}),
    ...(o.timeline ? { switchWorkspace: () => ws && ws.show('lower'), onWindow: () => { if (ws) ws.sync(); present(); } } : {}),
    ...opt(o.mod) });
  /* 5b. THE PATTERN (the ENVs' step sequencer) with the modulation; 5c. THE TIMELINE when the app asks for one */
  if (mod && want('pattern')) pattern = installPattern({ mount: floats, mod, storageKey: key + '.pattern', dock: rack && rack.span ? { span: rack.span() } : undefined,
    say: (text) => notice(text, { kind: 'warn' }), moved, ...(o.history ? { history: o.history } : {}), ...opt(o.pattern) });
  if (mod && o.timeline) {
    const { installTimeline } = await import('./timeline/bind.js');
    timeline = installTimeline({ mount: floats, mod, present, keys, storageKey: key + '.timeline', say: (text) => notice(text), busy: () => !!(recorder && recorder.running()),
      moved: (r) => { moved(r); if (ws) ws.moved('lower', r); }, onWindow: () => { if (ws) ws.sync(); present(); }, ...(o.history ? { history: o.history } : {}), ...opt(o.timeline) });
    ws = createWorkspaces({ upper: mod.view, lower: timeline.win });
    ws.sync();
  }
  /* 5d. RENDER: the recorder on the modulation host and the timeline's editor; the screen is held awake through the wake lock built below */
  const { subject: rSubject, picture: rPicture, motionUi: rMotionUi, sections: rSections, prefix: rPrefix, card: rCard, ...rOpts } = opt(o.render);
  let renderUi = null;
  if (mod && o.render) {
    const [{ createRecorder }, ui] = await Promise.all([import('./render/recorder.js'), import('./render/panel.js')]);   // loaded only when the app asks
    renderUi = ui;
    recorder = createRecorder({ host: mod.host, editor: timeline ? timeline.editor : undefined, app: key,
      wake: (reason) => (wakeLock ? wakeLock.hold(reason) : () => {}), ...rOpts });
  }
  const renderOpts = () => ({ recorder, subject: rSubject, picture: rPicture, motionUi: rMotionUi, sections: rSections, prefix: rPrefix,
    say: rOpts.say || ((text, warn) => notice(text, { kind: warn ? 'warn' : 'ok' })), save: rOpts.save });

  /* 5e. THE HISTORY WINDOW: the app's one stack, the keys, the gesture naming and the rack as a domain (a render running stops them) */
  if (o.history && want('history') && mod) hist = (await import('./history/window.js')).createHistoryWindow({ history: o.history, host: floats, mod, present: o.present, stage: o.canvas || stage.querySelector('canvas'),
    keys, canAct: () => !(recorder && recorder.running()), ...opt(o.historyWindow) });   // undo / redo: rows of the one table ('undo', 'redo')

  /* 6. THE ONE CLOCK and THE TRANSPORT BAR, the main opener: ▶ (and Space) plays; the power ring is modulation's */
  const clock = o.clock || (mod ? { play: () => mod.play(true), pause: () => mod.play(false), isPlaying: () => mod.playing(), onChange: (fn) => mod.onPlay(fn) } : null);
  const openers = () => [...(rack ? rackOpeners(rack)() : []),
    ...(folders ? [{ id: 'folders', label: 'FOLDERS', glyph: 'folder', action: 'folders', open: () => folders.open(), close: () => folders.close(), isOpen: () => folders.isOpen() }] : [])];
  if (bar) tr = createTransport({ root: bar, host, clock, mod, keys, rack: () => rack, key: key + '.transport', opener: true, openers, ...opt(o.transport) });

  /* 7. THE PARAMETERS: app.param() makes each; one project part saves their bases */
  const params = [];
  function param(k, label, min, max, more = {}) {
    const p = makeParam({ state, key: k, label, min, max, mod, onChange: present, ...more });
    const i = params.findIndex((q) => q.id === p.id); if (i >= 0) params[i] = p; else params.push(p);
    known.add(p.key);
    const remove = p.remove;
    p.remove = () => { remove(); const j = params.indexOf(p); if (j >= 0) params.splice(j, 1); };
    return p;
  }
  /* one project part: each parameter's base.  A key a lazy window has not made yet is kept as the number in `state`,
     which the control reads when it is made.  NEW (restore(null)) puts each back home. */
  const known = new Set();
  registerProjectPart('params', {
    capture: () => ({ ...Object.fromEntries([...known].map((k) => [k, state[k]])), ...Object.fromEntries(params.map((p) => [p.key, p.value()])) }),
    restore: (v) => {
      for (const [k, x] of Object.entries(v || {})) if (Number.isFinite(x) && !params.some((p) => p.key === k)) { known.add(k); state[k] = x; }
      for (const p of params) p.set(v && Number.isFinite(v[p.key]) ? v[p.key] : p.home);
      present();
    },
  });

  /* 8. THE PAGES: page 0 is the greeting; they ride in the project */
  const pages = createPages();
  for (const row of o.pages || []) pages.add(row);
  registerProjectPart('pages', pages.part());

  /* 9. THE NOTEBOOK (J): the pages, ABOUT, the dump */
  let describe = null;
  if (want('notebook')) notebook = createNotebook({ host: stage, name, storageKey: key + '.notebook', pages, keys,   // its fields let the table's inFields rows through
    about: { version: o.version || '', licence: gplLicence(name, { license: LICENSE, notice: null }), type: kitType([], FONTS), ...opt(o.about) },
    onLogo: () => accent.paintMarks(), dump: () => (describe ? describe.dump() : ''), ...opt(o.notebook) });
  /* its × runs the table's 'notebook': the key it shows is the table's (keys.hints → data-key-hint), never a typed 'J' */
  const nbClose = notebook && notebook.root && notebook.root.querySelector('.nb-close');
  if (nbClose) nbClose.dataset.keyAction = 'notebook';

  /* 10. FOLDERS: every registered project part, for free; its toolbar is BASINS' (PROJECT · CAPTURE · DOWNLOAD · DUPLICATE · NEW),
        and FILE › SAVE / Ctrl+S (the key table's 'save' row) save over the open project */
  if (want('folders')) folders = createFolders({ host: floats, app: key, store: key + '.folders', rack,
    adapter: o.thumbnail ? { thumbnail: o.thumbnail } : {}, onMoved: moved,
    say: (text, warn) => notice(text, { kind: warn ? 'warn' : 'ok' }),
    /* A PROJECT SAVE IS ALSO A PRESET (Josh 10-01): with modulation installed, every save writes the rack as a preset
       named the project in CAPS (modulation/bind.js upsertProjectPreset) */
    onSaved: (e) => { if (mod && e && e.name && typeof modBind.upsertProjectPreset === 'function') modBind.upsertProjectPreset(e.name); },
    ...opt(o.folders),
    ...(recorder ? { panels: [...(Array.isArray(opt(o.folders).panels) ? opt(o.folders).panels : []), renderUi.renderPanel(renderOpts())] } : {}) });
  /* RENDER as a rack window too (BASINS' rackRender): the same rows, built when it first opens */
  if (recorder && rack && rCard !== false) {
    let view = null;
    rack.register({ id: 'render', title: 'RENDER', side: 'right', action: 'render', build: (body) => { view = renderUi.createRenderView(body, { ...renderOpts(), seat: 'card', files: folders ? folders.zip : null }); }, onOpen: () => view && view.paint() });
  }
  /* a notebook with no pages keeps its text in the project (the landing law, notebook.project) */
  if (notebook && notebook.project) registerProjectPart('notebook', notebook.project.part());

  /* 11. INFORMATIONAL: words on the picture, never under the bar or a rack; the greeting is page 0's first part */
  const keepClear = () => (rack ? rack.keepClear() : bar && bar.isConnected && bar.offsetWidth ? [bar.getBoundingClientRect()] : []);
  if (want('info')) info = createInfoLayer({ stage, subject: o.subject || null, keys, avoid: keepClear, ...opt(o.info) });
  const greeting = info && want('greet') ? greet(info, pages, { first: true, ...opt(o.greet) }) : null;

  /* 12. THE KEYS' HELP VIEW (?) and THE MENUS: data; WINDOW from the rack, LANGUAGE from the kit, keys from the table */
  if (want('help')) help = createKeysHelp({ keys, host: floats });
  /* THE KEYBOARD WINDOW beside it: any row of the table re-recorded from the UI (mir/keyboard/keyboard.js), behind WINDOW › KEYBOARD */
  if (want('keyboard')) kb = createKeyboardWindow({ keys, host: floats, onMoved: moved, ...opt(o.keyboard) });
  /* the menus are BASINS' (app/shell.js): FILE ends with the five recent projects (↺), EDIT has UNDO / REDO (with a history
     or a timeline), PLAY / PAUSE and Purge Cache/RAM, VIEW hide, full screen and hold-still, WINDOW the kit's windows with their keys then the rack's, and the windows to
     come; ABOUT · SETTINGS · COPY DUMP.  A row whose piece is left out is not shown. */
  const k = (id) => (keys.get(id) ? keys.menuItem(id) : undefined);
  const rows = (...list) => list.filter((x) => x !== undefined);
  const dump = () => (describe ? describe.dump() : dumpLines().join('\n'));
  const M = o.menus || {};
  const menus = {
    FILE: M.FILE || (() => rows(folders ? k('save') : undefined, folders ? ['NEW', () => folders.fresh()] : undefined, folders ? k('folders') : undefined,
      ...(folders ? recentRows(folders.files, 5, (id) => { folders.open(); folders.openEntry(id); }) : []))),
    EDIT: M.EDIT || (() => rows(k('undo'), k('redo'), keys.get('undo') ? null : undefined, bar ? k('transport.play') : undefined, bar ? null : undefined, purgeRow({ name }))),
    VIEW: M.VIEW || (() => rows(k('hide'), k('fullscreen'), info ? k('info-hold') : undefined)),   // hold-still: a held key, so its row latches
    WINDOW: M.WINDOW || (() => rows(mod ? k('modulation') : undefined, timeline ? k('timeline') : undefined, pattern ? k('pattern') : undefined, folders ? k('folders') : undefined, notebook ? k('notebook') : undefined,
      hist ? k('history') : undefined, help ? k('help') : undefined, kb ? k('keyboard') : undefined, k('rack'), k('dock'), ...(rack ? [null, ...rack.windowMenu({ keyOf: (action) => keys.menuKey(action) })] : []),   // a card's `action` shows the table's chord
      ...((o.coming || []).length ? [null, ...o.coming.map(([n, h]) => comingRow(n, h))] : []))),
    ...Object.fromEntries(Object.entries(M).filter(([g]) => !['FILE', 'EDIT', 'VIEW', 'WINDOW', 'ABOUT', 'LANGUAGE', 'GUI'].includes(g))),
    GUI: M.GUI || (() => rows(k('gui'), k('gui-about'))),
    LANGUAGE: M.LANGUAGE || languageMenu(),
    ABOUT: M.ABOUT || (() => rows(['ABOUT ' + name, () => notebook && notebook.open('about')],
      gui ? ['SETTINGS…', () => gui.open('options')] : undefined, null, copyDumpRow(dump))),
  };
  const menubar = want('menubar') ? createMenubar({ opener: wordmark(stage, { word: name, sub: (o.about && o.about.sub) || 'AN MIR APP' }), host, menus, ...opt(o.menubar) }) : null;

  /* 13. THE HINTS (every [data-key-action] shows its key, a lazily built window's too), the control help, the pressed
         look, the accent on the marks; the picture is drawn again when the look changes or a window opens or closes
         (the theme, and the free stage, safeRect()) */
  const hints = () => frame.coalesce(key + ':hints', () => keys.hints(document));
  hints(); keys.onChange(hints); document.addEventListener('devopen', hints);
  const relaid = () => { present(); if (info) info.viewChanged(); };
  for (const e of ['devopen', 'devclose']) document.addEventListener(e, relaid);
  if (gui) gui.prefs.subscribe(present);
  onThemeChange(present);
  document.title = name + ' · an MIR app';
  installControlHelp(document);
  installPress({ selector: PRESSABLE });
  accent.apply();

  /* 14. DESCRIBE: what a visiting model can read */
  if (want('describe')) describe = createDescribe({ app: { name, version: o.version || '', what: o.what || '' }, rack, params: () => params, pages, keys,
    prefs: gui ? gui.prefs : null, mod, transport: tr, ...opt(o.describe) });

  /* 15. THE SCENE GUARD: the UI's space (a rack column, a floating window's whole rect, its gaps and corners) never lets a
         wheel or a press fall through to the picture (shell/scene-guard.js; Josh 10-01) */
  const canvas = o.canvas || stage.querySelector('canvas');
  const sceneGuard = want('sceneGuard') && canvas ? createSceneGuard({ canvas, rects: uiSpace({ rack, layer: floats }), ...opt(o.sceneGuard) }) : null;

  /* 16. THE WAKE LOCK: the screen stays on while the one clock plays (core/wakelock.js); app.wakeLock.hold(reason) for a recorder */
  const wakeLock = want('wakeLock') && clock ? installWakeLock({ clock, ...opt(o.wakeLock) }) : null;

  /* 17. THE SKIP LINK (BASINS index.html a.skip): the first Tab stop moves the focus to the rack */
  const rackEl = rack && rack.el.racks && (rack.el.racks.right || rack.el.racks.left);
  if (rackEl && rackEl.id && !host.querySelector(':scope > a.skip')) {
    const skip = label(el('a', 'skip'), 'skip to the device rack'); skip.href = '#' + rackEl.id;
    host.insertBefore(skip, host.firstChild);
    skip.addEventListener('click', (e) => { const t = document.getElementById(rackEl.id); if (!t) return; e.preventDefault(); t.focus(); });
  }

  /* 18. THE LIVE PROJECT (off by default): one session over every registered project part (core/session.js) */
  let session = null;
  if (o.session) {
    const so = opt(o.session);
    session = createSession({ key: key + '.session', ...so });
    if (so.auto !== false) setTimeout(() => { try { if (session.hasResume()) session.resume(); else session.arm(); } catch (err) { console.warn('session', err); } }, 0);
  }

  /** safeRect() — where the picture may draw: the stage minus the racks showing a window and the transport bar, in the
   *  stage's own px { left, top, width, height } (the same free stage the words on the picture keep to) */
  function safeRect() {
    const sb = stage.getBoundingClientRect(), vw = innerWidth, W = sb.width, H = sb.height;
    let L = 0, T = 0, R = W, B = H;
    for (const r of keepClear()) {
      const x0 = r.left - sb.left, x1 = r.right - sb.left, y0 = r.top - sb.top, y1 = r.bottom - sb.top;
      if (x1 <= 0 || x0 >= W || y1 <= 0 || y0 >= H) continue;
      if (r.left <= 24) L = Math.max(L, x1); else if (r.right >= vw - 24) R = Math.min(R, x0);
      else if ((y0 + y1) / 2 > H / 2) B = Math.min(B, y0); else T = Math.max(T, y1);
    }
    if (R - L < 120) { L = 0; R = W; }
    return { left: L, top: T, width: R - L, height: B - T };
  }

  const app = { name, key, first, param, params, clock, safeRect, hideInterface, dump,
    /** the one clock: playing(), and play() / pause() as the bar's ▶ would (a game over pauses it itself) */
    playing: () => !!(clock && clock.isPlaying()),
    play: () => (tr ? tr.play() : clock && !clock.isPlaying() ? clock.play() : null),
    pause: () => (tr ? tr.pause() : clock && clock.isPlaying() ? clock.pause() : null),
    accent, gui, keys, transport: tr, rack, mod, pattern, timeline, workspaces: ws, pages, notebook, folders, info, greeting, help, menubar, describe, floats,
    banner, sceneGuard, wakeLock, session, history: hist, recorder, keyboard: kb, kbm };
  (globalThis.__MIR = globalThis.__MIR || {}).app = app;     // the live shell object for a rig or the console (BASINS' window.__BASINS)
  return app;
}
