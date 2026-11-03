/* lab/shell/notebook.js — §19b (0.5.2 R3b; moved verbatim out of lab/rack.js boot()): the skip links, layout.modulation,
 * FILE › EXPORT SHAPE, MENUS and the kit's menubar, LEAN / KIND, THE NOTEBOOK and PROJECTS (projectSnapshot / projectKey whole).  createNotebook(app) runs at its
 * seat; the names persist, the links, the history, the keys and the facade make later are read through app.sh at use. */
import { TIER } from '../tier.js'; import { BUILD_LINE } from '../build-line.js'; import { el } from '../mir/kit.js'; import { createMenubar, contextMenu } from '../mir/shell/menubar.js'; import { createShelf } from '../mir/notes/shelf.js'; import { createWindowPicker } from '../mir/shell/window-picker.js'; import { toLUT } from '../mir/palette.js';
import { renderNotebook } from '../mir/shell/notebook-render.js'; import { cameraEye, VIEW_NAMES, drawStyle } from '../field.js'; import { getZ } from '../hamiltonian.js';
import { paintedRect } from '../occlusion.js'; import { WINDOW_GLYPH } from '../icons.js';
import { coalesce } from '../frame-coalescer.js'; import { createProjects } from '../projects.js'; import { createExporter, EXPORTS as SHAPE_EXPORTS } from '../export3d.js';
import { installWindowChrome } from '../window-chrome.js';
import { createWindow } from '../mir/window/window.js'; import { glyphEl, glyphSvg } from '../mir/glyph.js'; import { mirGui } from '../mir-gui.js';   // 034 N1: ABOUT's own window
import { MODE } from './settings.js';   // 021 R5: ONE MODE (the FINDER's greys)
import { NOTEBOOK_KEYS } from '../settings-store.js';   // 021 R4: the notebook's 0.4 keys, read once and retired
export function createNotebook(app) {
  const { dom, ui, reg, clock, obs, mat, settingsStore, isPhone } = app, { schedule } = app.loop, { floats } = app.host;
  const { KIND, layout, readSettings, rk, saveSettings, winHint } = app.sh;
  const { busy, busySync, cards, field, modSyncBases, occlusion, paintMarks } = app.ctl;
  {
    /* WAVE 62 · THE SKIP LINKS MOVE FOCUS THEMSELVES.  The anchors are real anchors — without script
       the browser's own fragment jump still lands on a `tabindex="-1"` rack — but in THIS app the
       FRAGMENT IS THE STATE ADDRESS (wave 56 mints `#s=…` and listens on `hashchange`), so writing
       `#rack` into it would push a junk address into the URL and the history for a focus move.
       `readLink()` returns null for a fragment with no `s=` key, so nothing would have broken; the
       address bar is the reason, and one preventDefault is the whole cost. */
    for (const a of document.querySelectorAll('a.skip')) {
      a.addEventListener('click', (e) => { const t = document.querySelector(a.getAttribute('href')); if (!t) return; e.preventDefault(); t.focus(); });
    }
    /* iteration 014 A0: the transport's dock chip and its modulation door are the kit's bar's (lab/shell/transport.js) */
    /** THE EXPANSION.  Not layout.raise(): on a phone the transport is docked at the TOP of the one
     *  rack and must stay there, so the window opens directly BENEATH it rather than above it. */
    layout.modulation = {
      get open() { return !!(app.state.modView && app.state.modView.isOpen); },
      expand() {
        if (!app.state.modView) return false;
        /* 2026-09-24 · open() ALONE (optimization LB1, AUDIT-E FE3).  open() already runs rebuild(); place();
           paint(true), and nothing between it and the old wake() touched the model or the registry, so wake()'s
           second rebuild + paint re-read the same model into the same DOM for 15–28 ms per open. */
        app.state.modView.open();
        document.body.classList.remove('rack-hidden');
        saveSettings(); schedule(TIER.PRESENT); return true;
      },
      /** Collapse releases preview-only work. Any route still drives its parameter. */
      collapse() { if (!app.state.modView) return false; app.state.modView.close(); saveSettings(); schedule(TIER.PRESENT); return true; },
      toggle() { return layout.modulation.open ? layout.modulation.collapse() : layout.modulation.expand(); },
    };
    /* FILE › EXPORT SHAPE (GLB · OBJ · STL) and EXPORT GRID (NPZ · CUBE), wave 134.  THE LAW: what is on screen, by
       the road it came — the grid is field.readGrid()'s own texels, the ISO is mat.iso, the colour is the phase
       view's own LUT (toLUT(palette.stops), the same CPU function the SLICE plane reads), the camera is
       cameraBasis(obs) at THIS press.  Marching cubes and every writer run in the `cards` worker queue (parked like
       a card prep, never the frame thread); the download is capture()'s own save() (no copy of its ZIP writer). */
    const exportLabel = () => { try { if (reg.preset) return reg.preset; const pop = reg.populated ? reg.populated() : []; return pop.length ? pop.length + 'modes' : 'state'; } catch (_) { return 'state'; } };
    app.state.exporter3d = createExporter({
      field: () => field,
      scene: () => {
        const E = cameraEye(obs, 1), B = E.basis, w = dom.canvas.clientWidth || 1, h = dom.canvas.clientHeight || 1;
        const q = app.state.chem && app.state.chem.on && app.state.chem.query ? app.state.chem.query() : null;
        return {
          label: exportLabel(), build: BUILD_LINE, t: clock.t, space: app.state.space, isoFrac: mat.iso,
          colour: { on: !!(app.state.palette && app.state.palette.on), hue: mat.hueShift || 0, invert: !!mat.invert, lut: (app.state.palette && app.state.palette.on) ? toLUT(app.state.palette.stops) : null },
          camera: { eye: E.eye, dir: B.dir, right: B.right, up: B.up, yfov: obs.fov || 0.6, aspect: w / h, shift: E.shift },   // the eye in half-units: the worker scales it by its grid's half; S2: the lens shift rides as extras
          atoms: q ? q.atoms : [{ Z: getZ(), x: 0, y: 0, z: 0 }],
        };
      },
      post: (msg, transfer) => cards.call(msg, transfer),
      save: (r) => app.state.capApi.capture.save(r),   /* capApi (depth-1, like exporter3d) wraps the CAPTURE group's own capture()/cap, built lazily there */
      status: (text, cls) => { if (ui.set) ui.set.setStatus(text, cls); },
      names: () => (app.state.chem && app.state.chem.on && app.state.chem.exportNames ? app.state.chem.exportNames() : null),   // 0.4.0 S1: the orbital's name rides in the file's metadata
    });
    /* the logo opens FILE · EDIT · WINDOW */
    const title = document.getElementById('title');
    if (title) {
      /* 021 I3 · THE TREE (REVIEW-B §4): FILE · EDIT · VIEW · PLAY · WINDOW · HELP, every row an ACTION (lab/actions.js) built by the kit's
         table.menuItem(id) — its key the live binding, its run the table's, so a menu's RESEED names its history row as the key's does (THE ONE
         WRAPPER) — a toggle a ✓ from its get(), a choice a radio •, a group a submenu (kit 1.5.6-alpha.2: hover or → opens, ← closes, an
         accordion on a phone).  One road to NEW (FOLDERS asks); HIDE lives in VIEW › INTERFACE and SETTINGS in EDIT, once each.  (N1's law
         stands: nothing is reached by label or by key code.) */
      const A = app.sh.ACTIONS, keyFor = (id) => app.sh.kt.keyText(id);
      /** item(id, text, opts) — a row for an action: its key after the TAB, a toggle checked from get(), `args` run with arguments */
      const item = (id, text, o = {}) => { const a = A.get(id); if (!a) return null; const m = !o.args && app.sh.kt.table.menuItem(id, text), k = o.args ? '' : keyFor(id), on = o.on !== undefined ? o.on() : a.kind === 'toggle' && a.get ? !!a.get() : undefined;
        return [(text || a.label) + (k && k !== '—' ? '\t' + k : ''), m ? m[1] : () => A.run(id, o.args), o.dis || (m ? m[2] : null), o.hint || a.hint || a.label, { ...(on !== undefined ? { checked: on } : {}), ...(o.radio ? { radio: o.radio } : {}), ...(o.icon || (a.icon && !o.radio) ? { icon: o.icon || (typeof a.icon === 'function' ? a.icon() : a.icon) } : {}) }]; };   // 022 E2: a row wears its action's glyph (the registry's `icon`)
      const sub = (text, entries, icon) => [text, entries, null, '', { sub: true, ...(icon ? { icon } : {}) }];
      const radio = (id, group, choices, cur) => choices.map(([v, w]) => item(id, w, { args: { id: v }, radio: group, on: () => cur() === v }));
      const reveal = A.reveal, H = () => app.sh.historyApi, wins = () => [...document.querySelectorAll('.dev:not([hidden]):not([data-id="projects"])')];
      const tool = (id, w, win, icon) => item(id, w, { on: () => !!A.get(id).get && !!A.get(id).get(), icon });
      const MENUS = {
        /* iteration 004 · FILE GOES THROUGH FOLDERS (BASINS shell.js FILE): NEW, OPEN and a recent project open FOLDERS first and let it ask
           "Save this first?" (SAVE & OPEN · OPEN WITHOUT SAVING, SAVE & NEW · NEW WITHOUT SAVING) — no window.confirm on these rows */
        FILE: () => [item('new', 'NEW', { icon: 'plus' }), item('open', 'OPEN…', { icon: 'folder' }),
          sub('OPEN RECENT', () => { const r = layout.projects.recent().slice(0, 8); return r.length ? r.map((p) => [p, () => { const P = layout.projects, e = P.entryOf(p); P.show(e ? { folder: e.folder } : {}); if (e) P.folders.openEntry(e.id); }, null, '', { raw: true }]) : [['nothing yet', null, true]]; }),
          item('save', 'SAVE' + (layout.projects.current ? '  ' + layout.projects.current : '…'), { icon: 'save' }), item('saveAs', 'SAVE AS…'), null,
          item('import', 'IMPORT…', { icon: 'upload' }),
          sub('EXPORT', () => [sub('PROJECT', () => [item('export.json', '.json'), item('export.mir', '.mir'), item('export.png', '.png — the picture carrying the project')]),
            item('export.picture', 'PICTURE'),
            sub('SHAPE', () => SHAPE_EXPORTS.filter((s) => s.kind === 'shape').map((s) => item('export.' + s.fmt, s.fmt.toUpperCase(), { hint: s.tip }))),
            sub('GRID', () => SHAPE_EXPORTS.filter((s) => s.kind === 'grid').map((s) => item('export.' + s.fmt, s.fmt.toUpperCase(), { hint: s.tip })))], 'download'),
          item('render.open', 'RENDER…', { icon: 'film' }), item('render.frames', 'EXPORT FRAMES…'),   // 025 C1: the film's rows after EXPORT (the card's FILM… row moved here)
          null, sub('QUICK', () => [item('quick.save', 'SAVE the experiment'), item('quick.load', 'LOAD the last quick save')])],
        EDIT: () => [item('undo', 'UNDO', { dis: () => !H().canUndo, icon: 'undo' }), item('redo', 'REDO', { dis: () => !H().canRedo, icon: 'redo' }),
          item('historyUndo', 'HISTORY UNDO', { dis: () => !H().canHistoryUndo, hint: 'back to the timeline before the last jump' }), item('history', 'UNDO HISTORY…'), null,
          sub('COPY', () => [item('copy.latex', 'LaTeX', { hint: 'the populated states in chemistry order, as LaTeX' }), item('copy.json', 'JSON', { hint: 'the experiment and its presentation as JSON' }),
            item('copy.link', 'LINK', { hint: 'a URL that reopens this exact state' })], 'duplicate'),
          sub('STATE', () => [item('state.normalize', 'NORMALIZE'), item('state.clear', 'CLEAR the register'), item('reseed', 'RESEED the particles')]), null,
          item('mapping', 'KEYBOARD & MAPPING…'), item('settings', 'SETTINGS…', { icon: 'settings' })],
        VIEW: () => [sub('MODE', () => radio('mode', 'mode', [['hydrogen', 'HYDROGEN'], ['molecules', 'MOLECULES']], () => (A.get('mode').get() ? 'molecules' : 'hydrogen')), 'atom'),
          sub('OBSERVABLE', () => radio('view', 'view', [['density', 'ρ = |ψ|²  density'], ['phase', 'arg ψ  phase'], ['real', 'Re ψ'], ['imag', 'Im ψ']], () => VIEW_NAMES[mat.view])),
          sub('STYLE', () => radio('style', 'style', ui.styleList(), () => drawStyle(mat.style))),   // 032 O1: WAVE's visible styles, its words
          item('invert', 'INVERT the cloud — ink, not light'),
          sub('STAGE', () => [item('view.captions', 'CAPTIONS'), item('view.formula', 'FORMULA'), item('view.labels', 'ATOM LABELS'), item('ballStick', 'BALL AND STICK')]),
          sub('INTERFACE', () => [item('view.badges', 'STATUS TAGS'), item('view.hints', 'CONTROL HINTS'), item('notes', 'WINDOW HELP'), null, item('hide', 'HIDE the interface')]),
          sub('CAMERA', () => [item('camReset', 'HOME', { icon: 'home' }), item('camera.panHome', 'PAN HOME'), null, item('camera.lock', 'LOCK', { icon: 'lock' }), item('camera.flip', 'FLIP'), item('camera.autoRotate', 'AUTO-ROTATE')], 'lens'),
          sub('THEME', () => radio('theme', 'theme', [['light', 'LIGHT'], ['dark', 'DARK'], ['system', 'SYSTEM']], () => A.get('theme').get()), 'moon'),
          item('fullscreen', 'FULL SCREEN', { icon: 'expand' })],
        PLAY: () => [item('transport.play', 'PLAY / PAUSE', { icon: 'play' }), item('home', 't → 0', { icon: 'rewind' }), item('stepBack', 'STEP ◂'), item('stepFwd', 'STEP ▸'), null,
          item('modArm', 'MOD ARM'), item('modBar', 'BAR LOCK'), item('settings.playLock', 'PLAYBACK LOCK'), null,
          sub('RATE', () => [item('csb.rate.up', 'RATE ×1.25'), item('csb.rate.down', 'RATE ÷1.25')]), sub('TEMPO', () => [item('csb.tempo.up', 'TEMPO +1 BPM'), item('csb.tempo.down', 'TEMPO −1 BPM')])],
        WINDOW: () => [item('windowPicker', 'FINDER…', { hint: 'search every window; Shift-click queues several', icon: 'search' }), null,
          sub('RACKS', () => [item('rack', 'SHOW THE RACK'), item('folds', A.get('folds').word ? A.get('folds').word().split(' — ')[0] : 'MINIMIZE ALL', { on: () => undefined }), item('dock', 'DOCK THE CONTROL SURFACE')]),
          sub('TOOLS', () => [tool('menu', 'PICKER', null, 'picker'), tool('modulation', 'MODULATION', null, 'modulation'), tool('timeline', 'TIMELINE', null, 'timeline'), tool('nodes', 'NODES', null, 'nodes'), tool('notebook', 'NOTEBOOK', null, 'notebook'), tool('folders', 'FOLDERS', null, 'folders'), item('history', 'HISTORY', { icon: 'history' }), tool('help', 'KEYBOARD', null, 'keyboard')]), null,
          /* 018 E6 · one submenu per KIND (window-chrome.js data-kind), each window ✓ while open: a press opens a closed one by the FINDER's road
             (kit rk.reveal) and closes an open one */
          ...['core', 'info', 'control', 'other'].map((k) => sub(k.toUpperCase(), () => { const ds = wins().filter((d) => (d.dataset.kind || 'other') === k);
            return ds.length ? ds.map((d) => [d.querySelector('.dev-eyebrow').textContent, () => A.run('window.' + d.dataset.id + (d.classList.contains('closed') ? '.open' : '.close')), null, winHint(d), { checked: !d.classList.contains('closed'), icon: WINDOW_GLYPH[d.dataset.id] }]) : [['none', null, true]]; }))],   // 021 V2: each window its one glyph
        HELP: () => [item('about', 'ABOUT λWAVES'), item('guiAbout', 'ABOUT MIR'), item('help', 'KEYBOARD SHORTCUTS…'),
          item('photosensitivity', 'PHOTOSENSITIVITY WARNING…', { hint: 'show the photosensitivity notice now and next load' }), null, item('update', 'UPDATE APP', { hint: 'check for a new build, rebuild the offline cache, and reload' }), item('diagnostics', 'COPY DIAGNOSTICS', { hint: 'the build, the worker, the stores and the last errors' })],
      };
      /* 0.5.0 C3 · THE BAR IS THE KIT'S createMenubar (its port of this app's bar: the disclosure, 400 ms hover hide, the placement,
         Escape → the wordmark, the phone crossing, a row that throws still closes it).  N1's hand-back stays app glue: the kit closes the
         bar BEFORE the act and returns focus only on Escape, so a row that leaves focus on the vanished item (or nowhere) gives it back
         to the wordmark, an act that moved it on purpose (the keyboard window, the notebook) keeps it (BRIEF candidate M1). */
      const back = (run) => () => { try { run(); } finally { const f = document.activeElement; if (!f || f === document.body || mb.bar.contains(f)) title.focus({ preventScroll: true }); } };
      /* 021 I3: a submenu's entries are wrapped as they open (its run is its list, not an act) */
      const wrap = (rows) => rows.map((r) => (!r ? r : r[4] && r[4].sub ? [r[0], () => wrap(r[1]()), ...r.slice(2)] : [r[0], r[1] && back(r[1]), ...r.slice(2)]));
      const mb = createMenubar({ opener: title, host: document.getElementById('lab'), phone: isPhone,
        menus: Object.fromEntries(Object.entries(MENUS).map(([g, rows]) => [g, () => wrap(rows())])) });
      layout.menu = { open: mb.open, close: mb.close, get isOpen() { return mb.isOpen; }, scale: 1.04, get enlarged() { return title.classList.contains('menu-open'); } };
      /* iteration 014 A7 · 018 E5 · THE FINDER (the kit's createWindowPicker; WINDOW's first row, the CSB's window-plus and the key row `windowPicker`):
         every window by name with its one glyph (021 V2: its register's, lab/icons.js WINDOW_GLYPH), a window the mode hides greyed with the mode that shows it;
         a pick of an open window scrolls the rack to it (kit rk.reveal: no reorder), a closed one opens at the top and the rack scrolls up */
      layout.finder = createWindowPicker({ rack: rk, cls: 'lw-menu',
        open: reveal,
        can: (id) => { const d = document.querySelector('.dev[data-id="' + id + '"]'); return !d || !d.hidden ? true : MODE[id] === 'molecules' ? 'MOLECULES ONLY' : 'HYDROGEN ONLY'; } });   // 021 R5: the MODE table's word
    }
    /* LEAN (the Aa button) and the KIND taxonomy (data-kind, ⧉ COPY, the boot folds): lab/window-chrome.js (N7 seam 9) */
    installWindowChrome({ KIND, layout, present: () => schedule(TIER.PRESENT) });
    for (const t of ['devclose', 'devopen']) document.addEventListener(t, () => saveSettings());   // C3: the kit's + opens a window itself
    layout.favMenu = rk.favMenu;   // 0.5.0 C3: the ☆ list is the kit's (createRack chrome); 018 E5: the + list left for the FINDER
    /* ── THE NOTEBOOK: a free glass over the stage (034 N1: ABOUT is its own window, below) ── */
    const nb = document.getElementById('notebook');
    if (nb) {
      const [NB_KEY, NB_TITLE, NB_SUBTITLE] = NOTEBOOK_KEYS;   // 021 R4: RETIRED — read once below, then the session part is the notebook's one record
      const ta = nb.querySelector('.nb-text'), view = nb.querySelector('.nb-view'), titleIn = nb.querySelector('.nb-title'), subIn = nb.querySelector('.nb-subtitle'), faces = { notes: nb.querySelector('.nb-notes'), about: document.getElementById('aboutFace') };
      /* the ABOUT face's version line is BUILD_LINE, never hand-written markup: the copy dump reads this same text back out of the face */
      const abV = faces.about.querySelector('.ab-version');
      if (abV) { const i = BUILD_LINE.indexOf(' · '); abV.textContent = ''; el('span', 'ab-tag', abV, i < 0 ? BUILD_LINE : BUILD_LINE.slice(0, i)); if (i >= 0) abV.appendChild(document.createTextNode(BUILD_LINE.slice(i))); }
      /* 021 R4 · THE NOTEBOOK IS STORED ONCE, in the project part (the session, FOLDERS, a file).  A browser that still holds 0.4's three keys
         boots onto them (a resume then puts the session's back), they leave storage, and the session's next save keeps the text */
      let nbLegacy = false;
      try {
        const v = localStorage.getItem(NB_KEY), t = localStorage.getItem(NB_TITLE), s = localStorage.getItem(NB_SUBTITLE);
        nbLegacy = v !== null || t !== null || s !== null;
        ta.value = v || ''; if (t) titleIn.value = t;
        if (subIn && s) { subIn.value = s; subIn.hidden = false; }
        for (const k of NOTEBOOK_KEYS) localStorage.removeItem(k);
      } catch (e) {}
      /* 2026-09-11: a synchronous localStorage write per keystroke became one write 300 ms after the last key; pagehide flushes */
      /* 2026-09-11: the notebook's move and resize write style once per FRAME, not once per pointer event */
      const nbPaint = coalesce(paint => paint());
      /* the title, subtitle and text are the part's: each input tells the session (projects.changed, the part's subscribe) */
      const nbStore = () => { if (layout.projects) layout.projects.changed(); };
      titleIn.addEventListener('input', nbStore);
      titleIn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (subIn) { subIn.hidden = false; subIn.focus(); subIn.select(); }
          else titleIn.blur();
        }
        if (e.key === 'ArrowDown' && subIn && !subIn.hidden) { e.preventDefault(); subIn.focus(); }
        if (!((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma'))) e.stopPropagation();
      });
      if (subIn) {
        subIn.addEventListener('input', nbStore);
        subIn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); subIn.blur(); }
          else if (e.key === 'Backspace' && !subIn.value) { e.preventDefault(); subIn.hidden = true; nbStore(); titleIn.focus(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); titleIn.focus(); }
          if (!((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma'))) e.stopPropagation();
        });
      }
      const renderMarkdown = renderNotebook;
      /* A project opens onto its notebook. The pane already scrolls, so a fixed line/word preview
         limit only hid valid Markdown while leaving usable space empty. Render the complete note
         here and let the pane's own geometry decide how much is visible at once. */
      function render() { const src = ta.value || '*empty — press ◐ to write*'; view.innerHTML = renderMarkdown(src.length > 200000 ? src.slice(0, 200000) + '\n\n*… preview truncated at 200 000 characters; the notes are kept whole*' : src); }   // 2026-09-11: a pasted book previews its first 200 k instead of one huge synchronous innerHTML
      const setMode = (m) => { nb.dataset.mode = m; if (m === 'view') render(); else ta.focus(); };
      nb.dataset.mode = 'edit';
      nb.querySelector('.nb-mode').addEventListener('click', () => setMode(nb.dataset.mode === 'view' ? 'edit' : 'view'));
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setMode('view'); }
        if (!((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma'))) e.stopPropagation(); });
      /* 0.5.1 D8 · `lw:` LINKS in the VIEW (R6-K): `[water](lw:molecule=h2o)` runs a WHITELIST of hand verbs — preset (STATE's), molecule
         (the MOLECULE dropdown's pick, MOLECULES on), view (the V key's), orbital (the ORBITAL dial by name or number, VIEW orbital), volume
         (iteration 004 V2: `volume=vol-1&id=aspirin[&basis=6-31g]`, a volume's molecule on its record — chemview openVolume) — one
         ring row and one fade a press (a molecule's fade is its head, D2), the ring never cleared; any other key (a whole state `lw:s=…`,
         E9) is ignored and said on the foot.  Capture phase: the sanitiser sends every link to a new tab (notebook-render.js). */
      function lwLink(q, name) {                                       // 0.6.6 G1: the four keys are rows of THE VERB TABLE (lab/verbs.js), run as one list
        const kv = new Map(), bad = [], list = [];
        for (const p of q.split('&')) { const [k, v = ''] = p.split('='); try { kv.set(k, decodeURIComponent(v)); } catch (_) { bad.push(k); } }
        for (const [k, v] of kv) if (k === 'preset' || k === 'view') list.push({ verb: k, args: { id: v } });
          else if (k === 'molecule') list.push({ verb: k, args: kv.has('orbital') ? { id: v, orbital: kv.get('orbital') } : { id: v } });
          else if (k === 'orbital') { if (!kv.has('molecule')) list.push({ verb: 'view', args: { id: 'orbital', orbital: v } }); }
          else if (k === 'volume') list.push({ verb: k, args: { volume: v, id: kv.get('id') || '', ...(kv.has('basis') ? { basis: kv.get('basis') } : {}) } });   // iteration 004 V2: lw:volume=vol-1&id=aspirin[&basis=6-31g]
          else if (!((k === 'id' || k === 'basis') && kv.has('volume'))) bad.push(k);
        return app.sh.verbs.run(list, { name }).then((r) => [...bad, ...r.refused.map((x) => (x.verb === 'view' && !kv.has('view') ? 'orbital' : x.verb))]);
      }
      view.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest('a[href^="lw:"]'); if (!a) return;
        e.preventDefault(); e.stopPropagation();
        const name = 'LINK · ' + (a.textContent.trim().slice(0, 32) || a.getAttribute('href'));
        lwLink(a.getAttribute('href').slice(3), name).then((bad) => { const c = nb.querySelector('.nb-count'); if (c && bad.length) { c.textContent = 'ignored: ' + bad.join(', '); setTimeout(count, 2400); } });
      }, true);
      /* ── PROJECTS (0.5.0 C6): MIR's FOLDERS over ONE project part — this one, below; the notebook is its page 0 ── */
      /* The saved project is wider than undo: notebook, camera, palette, and modulation all
         belong here. Compare on a destructive act, never on a frame. Playback time and the
         quality governor are runtime; routed numbers compare their hand-owned bases so an
         LFO does not manufacture unsaved edits while the user listens. */
      function modulationBases() {
        if (!app.state.modHost) return null;
        modSyncBases(); // catch paused hand edits; routed targets keep their protected base by contract
        /* 020 X4: NODES' knobs (`nodes.*`) are the reader's graph (PREFERENCE), not the project's: their bases stay out (a CURVES added is no edit) */
        return Object.fromEntries(app.state.modHost.registry.list().filter((id) => !id.startsWith('nodes.')).map((id) => [id, app.state.modHost.registry.baseOf(id)]));
      }
      /* A project stores the HAND values behind every routed control. The live Card values may be
         anywhere in an LFO cycle when Save is pressed; those animated values are presentation for
         this frame, not the parameter settings the artist made. Keep both the generic base table and
         base-correct mirrors so this project also opens correctly in builds predating the table. */
      function projectSnapshot() {
        const data = app.sh.serialize(), pr = data.presentation, bases = modulationBases();
        data.experiment.t = 0;
        pr.quality.autoScale = 1; // the governor's current drop is runtime, not part of the composition
        if (!bases) return data;
        pr.modulationBases = bases;
        for (const [id, seat] of Object.entries(app.sh.modSeats(data))) if (seat[0] && !seat[2] && Number.isFinite(bases[id])) seat[0][seat[1]] = bases[id];   // S3: the history's table
        return data;
      }
      function projectKey() {
        const data = projectSnapshot(), pr = data.presentation;
        /* THE KEYS THAT DO NOT DIRTY A PROJECT (docs/STATE-SCOPES.md): the WORKSPACE — moving a window, the modulation window's
           placement, the notebook's size — and the auto-rotate switch are saved WITH the project, but a demo-maker dragging a
           window is not "unsaved work"; nor is QUALITY, advice the device clamps (D5), nor mat.steps, its shadow (applyRebuild
           writes it from quality.steps: WAVE DANCER's 240 became this device's 160 a frame after its open and read as an edit).
           0.3.1 · S2: the stage is the work (S1 left only the stage in `ui`) and counts, as the overlays and the A/B transition do. */
        delete pr.quality; delete pr.mat.steps;
        delete pr.layout; delete pr.modwin; delete pr.camera; delete pr.notebook;
        if (pr.domain.auto) delete pr.domain.half; // computed during rebuild, not a project edit
        for (const m of (pr.modulation && pr.modulation.macros) || []) if (m.sourceId) delete m.value;   // S2: a bound macro reads its source (deserialize overwrites the value) — NEW's LFO playing is not an edit
        return JSON.stringify([data, titleIn.value, subIn ? subIn.value : '', ta.value]);
      }
      /* 0.5.0 C6 · THE ONE PROJECT PART (R5-A3): λWAVES' project is serialize()/restore() — projectSnapshot() above — with the
         notebook as its page 0, { title, subtitle, text }, in the form 0.4 reads.  FOLDERS, the facade's verbs and the .mir / PNG
         exports carry this part (R-I3: the pages travel with the project); projectKey() is its signature, the unsaved mark.
         restore() THROWS when the file did not take, so the kit counts the part failed; when it took, the notebook is put back. */
      let curPath = null;   // 034 N3: the shelf note the live sheet came from (null: the project's own sheet)
      const part = {
        capture: (name) => ({ data: projectSnapshot(), notebook: { title: name && titleIn.value === 'NOTEBOOK' ? name : titleIn.value, subtitle: subIn ? subIn.value : '', text: ta.value } }),
        restore(v, ctx) {
          if (!v || typeof v !== 'object' || !v.data || app.sh.restore(v.data, { project: true }) !== true) throw new Error('the project did not take');
          const n = v.notebook && typeof v.notebook === 'object' ? v.notebook : {};
          ta.value = n.text || ''; titleIn.value = n.title || (ctx && ctx.name) || 'NOTEBOOK'; curPath = null;
          if (subIn) { subIn.value = n.subtitle || ''; subIn.hidden = !subIn.value; }
          return true;
        },
        signature: () => projectKey(),
      };
      /* RENDER's SUBJECT says THIS VIEW's system: an open card is painted again when a project lands or ⓘ points (iteration 004) */
      const renderPaint = () => { const fc = app.state.filmCard; if (fc && !fc.card.root.classList.contains('closed')) fc.view.paint(); };
      const projects = createProjects({ host: floats || document.body, part,
        snapshot: () => JSON.parse(JSON.stringify(app.sh.serialize())), rollback: (S) => app.sh.restore(S) === true,   // M5b: the instrument as it stood, through the same road
        busy: (d) => { busy.n = Math.max(0, busy.n + d); busySync(); },   // wave 48: a project load rebuilds the register, the operator and the field — BUSY work
        notice: () => app.state.restoreNotice, thumbnail: () => app.sh.LW.thumbnail(), confirm: (text) => window.confirm(text), onMoved: () => occlusion.dirty(),
        /* iteration 004 · the front page sits above every window (THE PICKER, z 100000): FOLDERS puts it away when it comes on screen */
        cover: () => app.state.picker,
        /* 022 P2 · a project's own menu (the kit's rows) adds OPEN, and EXPORT .mir / .png for the project that is open */
        itemRows: (e) => { const P = layout.projects, cur = P && P.current && P.entryOf ? P.entryOf(P.current) : null, A = app.sh.ACTIONS;
          return [['OPEN', () => P.folders.openEntry(e.id)], ...(cur && cur.id === e.id ? [['EXPORT .mir', () => A.run('export.mir')], ['EXPORT .png', () => A.run('export.png')]] : [])]; },
        /* Josh 10-01 · a project save writes its modulation as a preset named the project in CAPS (the kit's presetUpsertCaps, BASINS'
           presetOnSave) — only a rack that routes something, so a plain save adds no empty preset */
        saved(name) { const H = app.state.modHost; if (!H) return; const rack = H.model.serializeRack(); if (!rack || !Array.isArray(rack.routes) || !rack.routes.length) return;
          const r = H.model.presetUpsertCaps(name, rack); if (r && r.ok && app.state.modView) app.state.modView.rebuild(); },
        /* ⓘ on a tile: the RENDER card describes that project (its SUBJECT); a plain selection repaints it only when it is open */
        inspect(e, how) { if (how.show && app.state.filmCard) layout.raise('render'); renderPaint(); },
        rack: { keepClear: () => ['rack', 'rackL', 'transport'].map((id) => paintedRect(document.getElementById(id))).filter(Boolean) },
        /* 0.3.1 · S2 THE NOTEBOOK LAW (PLAN §3.4): a project opens onto its notebook only when the notebook has text — the complete
           notebook, in its scrollable pane.  A blank one (NEW's included) opens nothing and closes nothing.  "Edited" is read off the
           text: no flag.  S3: the ring's bottom row is named for the file. */
        opened(label) { count(); if (app.state.history) app.state.history.clear(label); if (ta.value.trim()) { show('notes'); nb.dataset.mode = 'view'; } render(); renderPaint(); },
        titleAfterSave(name) { if (titleIn.value !== 'NOTEBOOK') return false; titleIn.value = name; return true; } });
      addEventListener('beforeunload', (e) => {
        if (!projects.dirty) return;
        /* 034 F8 (Josh: "'Repair - Installed - Reloading' seems to be stuck … the firefox warning"): REPAIR asked already (its own dialog,
           sw-client.js refresh) — its reloads never meet the browser's leave-page prompt */
        let repair = null; try { repair = sessionStorage.getItem('lw.repair'); } catch (_) {}
        if (repair) return;
        e.preventDefault(); e.returnValue = '';
      });
      /* FOLDERS lives in #floats: its pane and its rail's chips are painted glass (CLAUDE.md's mask law); a move dirties the block
         (onMoved above), and so do its open and close */
      { const { root, rail } = projects.folders.win;
        occlusion.register('folders', () => projects.folders.isOpen() ? [paintedRect(root), ...(rail.el ? [...rail.el.querySelectorAll('.mir-chip')].map((c) => paintedRect(c)) : [])] : []);
        for (const el of [root, rail.el]) occlusion.watch(el, { attributes: true, attributeFilter: ['hidden'] }); }
      nb.querySelector('.nb-projects-btn').addEventListener('click', () => projects.toggle());
      /* ── 034 N3 · NEW NOTE · OPEN NOTE (Josh: "Have new controls like 'new note', 'open note'"): the kit's notes shelf (mir/notes/shelf.js, key
         `mir.notes`, apart from every project) holds the notes; the notebook shows one live sheet, the project's page 0 as before.  NEW keeps the
         sheet on the shelf (when it has text) and clears into a new one; OPEN lists the shelf, newest first, and opens a note into the sheet
         (the sheet kept first).  A project open puts its own text in the sheet, as always. ── */
      const shelf = createShelf({ key: 'mir.notes' }), nbTools = nb.querySelector('.nb-tools');
      const tool = (cls, glyph, tip) => { const b = el('button', cls); b.type = 'button'; b.innerHTML = glyphSvg(glyph, 'gly', 14); b.title = tip; b.setAttribute('aria-label', tip.split(' — ')[0]); return b; };
      const newB = tool('nb-new', 'plus', 'NEW NOTE — keeps this one on the shelf'), openB = tool('nb-open', 'folder', 'OPEN NOTE — a note from the shelf');
      nbTools.prepend(newB, openB);
      const sayNb = (t) => { const c = nb.querySelector('.nb-count'); if (c) { c.textContent = t; setTimeout(count, 2400); } };
      const keepSheet = () => {
        if (!ta.value.trim()) return null;
        const page = { title: titleIn.value, md: ta.value }, path = curPath && shelf.has(curPath) ? curPath : shelf.freePath(titleIn.value.trim() || 'NOTEBOOK');
        const was = shelf.get(path); if (was && was.title === page.title && was.md === page.md) return path;
        return shelf.save(path, page) ? (curPath = path) : null;
      };
      const fillSheet = (title, md, path) => { ta.value = md; titleIn.value = title || 'NOTEBOOK'; if (subIn) { subIn.value = ''; subIn.hidden = true; } curPath = path; nbStore(); count(); };
      newB.addEventListener('click', () => { const kept = keepSheet(); fillSheet('NOTEBOOK', '', null); setMode('edit'); sayNb(kept ? 'kept on the shelf as ' + kept : 'a new sheet'); });
      openB.addEventListener('click', () => {
        const notes = shelf.list();
        contextMenu({ anchor: openB, label: 'open note', entries: notes.length ? notes.slice(0, 8).map((n) => [n.title || n.name, () => {
          if (n.path !== curPath) keepSheet(); const p = shelf.open(n.path); if (!p) return;
          fillSheet(p.title, p.md, n.path); setMode(p.md.trim() ? 'view' : 'edit'); sayNb('opened ' + n.path); }, false, n.path, { raw: true }]) : [['no note on the shelf yet', null, true, '', { raw: true }]] });
      });
      layout.projects = projects;
      if (nbLegacy) projects.changed();   // 021 R4: the migrated notebook joins the session at its next save
      const count = () => { const c = nb.querySelector('.nb-count'); if (c) c.textContent = ta.value.trim() ? ta.value.trim().split(/\s+/).length + ' words · kept in this browser' : 'empty · kept in this browser'; };
      ta.addEventListener('input', () => { nbStore(); count(); });
      const ABOUT_DEF_W = 470, ABOUT_DEF_H = 670;
      const NOTES_DEF_W = 640, NOTES_DEF_H = 460;
      /* ── 034 N1 · ABOUT IS ITS OWN WINDOW (Josh: "Notebook should be it's own window apart from the About page. About page's controls can just
         simply be the 'x' icon to close and the 'i' icon to toggle between the app's about page and the general MIR about page"): the kit's
         createWindow in #floats with a title bar — ⓘ and × — whose body is the λWAVES face (index.html #aboutFace) or, on ⓘ, MIR ABOUT's own
         page lent in place (the kit's gui.aboutPage; MIR OPTIONS' ⓘ takes it back to the kit's window).  Its size is the WORKSPACE abW / abH. ── */
      const mirFace = el('div', 'nb-face lw-about-mir'); mirFace.hidden = true;
      const abWin = createWindow({ id: 'about', title: 'ABOUT', host: floats || document.body, chrome: 'close', glyph: 'about', resizable: true, emptyDrag: true,
        size: { w: ABOUT_DEF_W, h: ABOUT_DEF_H }, min: { w: 320, h: 240 }, body: (b) => { faces.about.hidden = false; b.append(faces.about, mirFace); },
        persist: { read: () => { const S = readSettings(); return { w: S.abW, h: S.abH }; },
          write: (sh) => { const S = readSettings(); if (sh && (S.abW !== sh.w || S.abH !== sh.h)) settingsStore.write({ ...S, abW: sh.w, abH: sh.h }); } } });
      abWin.root.classList.add('lw-about');
      const abI = el('button', 'mir-win-btn lw-about-i'); abI.type = 'button'; abI.dataset.glyph = 'info'; { const g = glyphEl('info', 'gly gly-info'); if (g) abI.append(g); }
      abWin.tools.prepend(abI);
      let abFace = 'lw';
      const abShow = (f) => {
        abFace = f === 'mir' ? 'mir' : 'lw'; faces.about.hidden = abFace !== 'lw'; mirFace.hidden = abFace !== 'mir';
        abI.title = abFace === 'lw' ? 'MIR ABOUT — the kit this app is built on' : 'ABOUT λWAVES — back to the app'; abI.setAttribute('aria-pressed', String(abFace === 'mir'));
        if (abFace === 'mir') { const g = mirGui(); if (g && g.aboutPage) g.aboutPage(mirFace); }   // lent again each time: the kit's own window may have taken it back
        const logo = faces.about.querySelector('.nb-logo');
        /* iteration 016 P5 (Josh: "the new λWAVES logo, much larger; the MIR logo shrunk"): the wordmark lab/img/lambdawaves-logo.svg, large — its word in the
           ink, its λ and its dot their own colours (the Picker's own road); the title's clone stays the fallback */
        if (abFace === 'lw' && logo && !logo.children.length) {
          logo.classList.add('nb-wordmark');
          fetch('./img/lambdawaves-logo.svg').then((r) => (r.ok ? r.text() : Promise.reject())).then((t) => { logo.innerHTML = t.replace(/fill="#f0f4f7"/g, 'fill="currentColor"'); const g = logo.querySelector('svg'); if (g) { g.removeAttribute('width'); g.removeAttribute('height'); g.setAttribute('aria-hidden', 'true'); } })
            .catch(() => { logo.classList.remove('nb-wordmark'); for (const c of document.getElementById('title').children) if (!c.classList.contains('ms')) logo.appendChild(c.cloneNode(true)); paintMarks(); });
        }
        abWin.body.scrollTop = 0;
      };
      abI.addEventListener('click', () => abShow(abFace === 'lw' ? 'mir' : 'lw'));
      occlusion.register('about', () => (abWin.isOpen() ? [paintedRect(abWin.root)] : [])); occlusion.watch(abWin.root, { attributes: true, attributeFilter: ['hidden'] });
      layout.about = { open(f = 'lw') { abShow(f); abWin.open(); abWin.raise(); return true; }, close() { abWin.close(); }, toggle(f) { if (abWin.isOpen() && (!f || f === abFace)) abWin.close(); else layout.about.open(f || abFace); },
        get isOpen() { return abWin.isOpen(); }, get face() { return abFace; }, win: abWin };
      const show = (face) => {
        if (face === 'projects') { projects.show(); return; }   // 0.5.0 C6: the PROJECTS face left the notebook; its open is FOLDERS' (iteration 004: the front page put away first)
        if (face === 'about') { layout.about.open('lw'); return; }   // 034 N1: ABOUT left the notebook for its own window
        nb.hidden = false; nb.dataset.face = 'notes';
        const S = readSettings();
        const w = typeof S.nbW === 'number' ? S.nbW : NOTES_DEF_W;
        const h = typeof S.nbH === 'number' ? S.nbH : NOTES_DEF_H;
        nbResize(w, h);
        if (!nbMoved) {
          nb.style.left = 'calc(50% - ' + Math.round(w / 2) + 'px)';
          nb.style.top = '12%';
        }
        ta.focus();
      };
      nb.querySelector('.nb-close').addEventListener('click', () => { nb.hidden = true; });
      nb.querySelector('.nb-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(ta.value); } catch (e) {} });
      const dump = nb.querySelector('.nb-dump');
      const dumpText = () => {
        const info = [...faces.about.children].filter((node) => !node.classList.contains('ab-actions')).map((node) => node.innerText).join('\n');
        return info.replace(/\n{3,}/g, '\n\n') + '\n\nsettings ' + JSON.stringify(readSettings()) + '\nfield ' + JSON.stringify({ resolution: field.resolution, half: field.half, adapter: field.adapterInfo || null }) + '\n' + navigator.userAgent;
      };
      if (dump) dump.addEventListener('click', async () => { try { await navigator.clipboard.writeText(dumpText()); } catch (e) {} });
      const NB_MIN_W = 320, NB_MIN_H = 240;
      const nbClamp = (w, h) => [Math.max(NB_MIN_W, Math.min(w, window.innerWidth - 16)), Math.max(NB_MIN_H, Math.min(h, window.innerHeight - 16))];
      function nbResize(w, h) { const [cw, ch] = nbClamp(w, h); nb.style.width = cw + 'px'; nb.style.height = ch + 'px'; return [cw, ch]; }
      function nbSaveSize() {
        const w = Math.round(parseFloat(nb.style.width)), h = Math.round(parseFloat(nb.style.height)); if (!(w > 0 && h > 0)) return;   // W129 · the size it was GIVEN (nbResize, the grip, the CSS resize all write the inline style; captureLayout reads it too), never its layout box: a closed notebook's box is 0 × 0, a phone's is its screen
        const S = readSettings();
        if (S.nbW === w && S.nbH === h) return;
        settingsStore.write({ ...S, nbW: w, nbH: h });
      }
      { const grip = nb.querySelector('.nb-grip');
        if (grip) { let gd = null;
          grip.addEventListener('pointerdown', (e) => { if (e.button !== 0 || gd) return; e.preventDefault(); e.stopPropagation(); const r = nb.getBoundingClientRect(); gd = { id: e.pointerId, x: e.clientX, y: e.clientY, w: r.width, h: r.height };
            try { grip.setPointerCapture(e.pointerId); } catch (_) {} });   // a capture that cannot be taken (a synthesised pointer, a stale id) must not throw into the page — the drag works without it
          grip.addEventListener('pointermove', (e) => { if (!gd || e.pointerId !== gd.id) return; e.preventDefault(); const w = gd.w + (e.clientX - gd.x), h = gd.h + (e.clientY - gd.y); nbPaint.post(() => nbResize(w, h)); });
          const gend = (e) => { if (!gd || e.pointerId !== gd.id) return; nbPaint.flush(); gd = null; if (e && e.pointerId !== undefined && grip.hasPointerCapture && grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId); nbSaveSize(); };
          for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) grip.addEventListener(type, gend);
        }
        /* the desktop's own CSS resize ends in a pointerup over the notebook — the same two numbers, the same key */
        nb.addEventListener('pointerup', () => nbSaveSize());
        const S0 = readSettings(); if (typeof S0.nbW === 'number' && typeof S0.nbH === 'number') nbResize(S0.nbW, S0.nbH);
        layout.notebookResize = (w, h) => { const r = nbResize(w, h); nbSaveSize(); return r; };
        layout.notebookSize = () => { const w = Math.round(parseFloat(nb.style.width) || NOTES_DEF_W), h = Math.round(parseFloat(nb.style.height) || NOTES_DEF_H); return { w, h, custom: w !== NOTES_DEF_W || h !== NOTES_DEF_H }; };
      }
      let nd = null, nbMoved = false; const nhead = nb.querySelector('.nb-head');
      nhead.addEventListener('pointerdown', (e) => { if (e.button !== 0 || nd || e.target.closest('button, input')) return; const r = nb.getBoundingClientRect(); nd = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top }; try { nhead.setPointerCapture(e.pointerId); } catch (_) {} });
      nhead.addEventListener('pointermove', (e) => { if (!nd || e.pointerId !== nd.id) return; nbMoved = true; const L = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - nd.dx)) + 'px', T = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - nd.dy)) + 'px'; nbPaint.post(() => { nb.style.left = L; nb.style.top = T; }); });
      const nend = (e) => { if (!nd || e.pointerId !== nd.id) return; nbPaint.flush(); nd = null; };
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) nhead.addEventListener(type, nend);
      count();
      layout.notebook = { open: (face = 'notes') => show(face), close: () => { nb.hidden = true; }, toggle: () => { if (nb.hidden) show('notes'); else nb.hidden = true; }, get isOpen() { return !nb.hidden; }, get face() { return nb.dataset.face; }, moveTo(x, y) { nbMoved = true; nb.style.left = x + 'px'; nb.style.top = y + 'px'; }, dump: dumpText, get text() { return ta.value; }, set text(v) { ta.value = v; ta.dispatchEvent(new Event('input')); }, get title() { return titleIn.value; }, set title(v) { titleIn.value = v; titleIn.dispatchEvent(new Event('input')); }, get subtitle() { return subIn ? subIn.value : ''; }, set subtitle(v) { if (subIn) { subIn.value = v; subIn.hidden = !v; subIn.dispatchEvent(new Event('input')); } }, get mode() { return nb.dataset.mode; }, setMode, render: renderMarkdown, get html() { return view.innerHTML; } };
    }
    /* the hidden rack's peeks: the kit's pointer law (createRack); the bar's own is rack-wiring.js' (015 H3; 020 S1 retired wave 108's second copy here,
       which peeked the bar again under the very pointer that had just hidden it) */
  }
}
