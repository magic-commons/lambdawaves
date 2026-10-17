/* lab/shell/notebook.js — §19b (0.5.2 R3b; moved verbatim out of lab/rack.js boot()): the skip links, the transport's dock chip and MOD logo, layout.modulation,
 * FILE › EXPORT SHAPE, MENUS and the kit's menubar, LEAN / KIND, THE NOTEBOOK and PROJECTS (projectSnapshot / projectKey whole).  createNotebook(app) runs at its
 * seat; the names persist, the links, the history, the keys and the facade make later are read through app.sh at use. */
import { TIER, BUILD_LINE } from '../rack.js'; import { el, chip } from '../mir/kit.js'; import { createMenubar } from '../mir/shell/menubar.js'; import { toLUT } from '../mir/palette.js';
import { renderNotebook } from '../mir/shell/notebook-render.js'; import { cameraEye } from '../field.js'; import { getZ } from '../hamiltonian.js';
import { paintedRect } from '../occlusion.js';
import { coalesce } from '../frame-coalescer.js'; import { createProjects } from '../projects.js'; import { createExporter, EXPORTS as SHAPE_EXPORTS } from '../export3d.js';
import { installWindowChrome } from '../window-chrome.js';
export function createNotebook(app) {
  const { dom, ui, reg, clock, obs, mat, settingsStore, isPhone } = app, { schedule } = app.loop, { floats, resetView, swClient } = app.host;
  const { KIND, layout, readSettings, rk, saveSettings, winHint } = app.sh, { clearRegister, copyLatex, normalizeNow, toggleFullscreen } = app.w;
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
    /* a dock button on the transport itself */
    const tr = document.getElementById('transport');
    /* WAVE 55: the same drawing every floating window's DOCK chip wears — one mark, one meaning, and never
       a text character (glyph.js: iOS answers several of ours with a colour emoji). */
    if (tr) { const b = el('button', 'dock-btn', tr); b.type = 'button'; b.dataset.keyAction = 'dock';
      chip(b, 'north', 'dock the transport into the rack'); b.title = 'move the transport between the stage and the rack (T)'; b.addEventListener('click', () => layout.dockTransport()); }
    if (tr) {
      const e = el('button', 'mod-exp mod-logo', tr); e.type = 'button'; e.dataset.keyAction = 'modulation';
      /* WAVE 55: the mark is now the POP-OUT's, because that is literally what the press does — the pill's
         EXPAND opens modulation as a FLOATING window over the stage, not as a card in the rack. */
      const lg = document.querySelector('#title .mark');
      if (lg) { const c = lg.cloneNode(true); c.removeAttribute('aria-hidden'); e.appendChild(c); }
      e.setAttribute('aria-label', 'open the modulation window');
      e.title = 'Open the modulation window';
      e.addEventListener('click', () => layout.modulation.toggle());
      const spinLogo = (reverse) => { const mark = e.querySelector('.mark'); if (!mark) return; if (e._spin) e._spin.cancel(); e._spin = mark.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${reverse ? -360 : 360}deg)` }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 550, easing: 'ease-in-out' }); };
      e.addEventListener('pointerenter', () => spinLogo(false));
      e.addEventListener('pointerleave', () => spinLogo(true));
      ui.modExp = e;
    }
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
      /* OPTIMIZATION 2026-09-24 · N1 · THE ROWS CALL FUNCTIONS (AUDIT-E FE1, REFUTE-D/F).  They used to reach controls
         by LABEL (`clickTrig`: the first `.trig` in document order with that text) and by KEY CODE (`runKey`: the first
         ctrl-less action bound to a code), and three rows were wrong on a first visit: RESEED ran `camReset` (the
         camera snapped home, no particles), RESET KEYS clicked a trigger deleted in 5f6421e, and CLEAR pressed one of
         five CLEARs — the undo ring's once HISTORY floated.  Every row now names its act: an ACTION by id (run with
         fine = 1, as a bare key press runs it) or a named function, and its key hint is read from the live binding
         (keyFor), so a rebind renames the row (ANTI-PATTERN 6). */
      const runAction = (id) => { const a = app.sh.ACTIONS.find((x) => x.id === id); if (a) a.run(1); };
      const keyFor = (id) => app.sh.kt.keyText(id);
      const MENUS = {
        FILE: () => [['NEW project', () => layout.projects.requestFresh()], ['SAVE project' + (layout.projects.current ? '  ' + layout.projects.current : '…') + '\t' + keyFor('save'), () => { if (layout.projects.current) layout.projects.save(); else { layout.notebook.open('projects'); } }], ['SAVE project AS…\t' + keyFor('saveAs'), () => layout.notebook.open('projects')], ['OPEN a project…', () => layout.notebook.open('projects')],
          ...layout.projects.recent().slice(0, 5).map((p) => ['↺  ' + p, () => layout.projects.requestOpen(p), null, '', { raw: true }]),
          null,
          ['EXPORT project (.json)', () => layout.projects.download()], ['IMPORT project (.json)…', () => layout.projects.pick()],
          null,
          ['SAVE the experiment (quick)', () => app.sh.save()], ['LOAD the last quick save', () => app.sh.restore()], ['COPY as JSON', () => app.sh.copyJSON()],
          ['COPY a LINK to this state', () => app.sh.copyLink(), null, 'a URL that reopens this exact state — the STATE card says how long it is and what format v1 could not carry (the MOLECULE panel and the MODULATION rack)'],
          null,
          ...SHAPE_EXPORTS.map((spec) => [spec.row, () => app.state.exporter3d.run(spec.fmt), () => app.state.exporter3d.busy || !field.ok, spec.tip])],
        EDIT: () => [['UNDO\t' + keyFor('undo'), () => app.sh.historyApi.undo(), () => !app.sh.historyApi.canUndo], ['REDO\t' + keyFor('redo'), () => app.sh.historyApi.redo(), () => !app.sh.historyApi.canRedo], ['HISTORY UNDO\t' + keyFor('historyUndo'), () => app.sh.historyApi.historyUndo(), () => !app.sh.historyApi.canHistoryUndo, 'return once to the timeline that existed before the last history-row jump'], ['UNDO HISTORY…', () => layout.raise('history')], null,
          ['PLAY / PAUSE\t' + keyFor('transport.play'), () => runAction('transport.play')], ['NORMALIZE', () => normalizeNow()], ['COPY the state as LaTeX', () => copyLatex(), null, 'the populated states in chemistry order, in the notebook\'s LaTeX — two lines: the list, then ψ with amplitudes and phases; under a molecule, the molecule\'s page: formula, RHF/basis, E and the ε ladder'], ['CLEAR the register', () => clearRegister()], ['RESET the view\t' + keyFor('camReset'), () => resetView()], ['RESEED the particles\t' + keyFor('reseed'), () => runAction('reseed')], null, ['RESET the key bindings', () => app.hooks.keys.reset()], ['SETTINGS…\t' + keyFor('settings'), () => layout.raise('settings')]],
        VIEW: () => [['INVERT the cloud \u2014 ink, not light', () => app.sh.LW.setInvert(!mat.invert), null, 'draw the cloud as ink rather than light; the transfer is inverted and ψ is not touched'], ['ρ = |ψ|²  density', () => app.sh.LW.setView('density')], ['arg ψ  phase\t' + keyFor('view') + ' cycles', () => app.sh.LW.setView('phase')], ['Re ψ', () => app.sh.LW.setView('real')], ['Im ψ', () => app.sh.LW.setView('imag')], ['Δρ  difference', () => app.sh.LW.setView('diff')], ['Re + Im  superposed (heuristic)', () => app.sh.LW.setView('reim')],
          ['— style: CLOUD\t' + keyFor('style') + ' cycles', () => app.sh.LW.setStyle('cloud')], ['— style: SOLID', () => app.sh.LW.setStyle('solid')], ['— style: GRAIN', () => app.sh.LW.setStyle('grain')], ['— style: SIGNED', () => app.sh.LW.setStyle('signed')], ['— style: BANDS', () => app.sh.LW.setStyle('bands')],
          ['STAGE CAPTIONS  on / off', () => ui.capSw && ui.capSw.root.click()], ['STAGE FORMULA  on / off', () => ui.molFormulaSw && ui.molFormulaSw.root.click()], ['ATOM LABELS  on / off', () => ui.atomLabelsSw && ui.atomLabelsSw.root.click()], ['STATUS TAGS  on / off', () => ui.badgesSw && ui.badgesSw.root.click()], ['CONTROL HINTS  on / off', () => ui.controlHintsSw && ui.controlHintsSw.root.click()], ['HIDE the interface\t' + keyFor('hide'), () => runAction('hide')], ['FULL SCREEN / back\t' + keyFor('fullscreen'), () => toggleFullscreen()]],
        WINDOW: () => [['MAIN MENU\t' + keyFor('menu'), () => runAction('menu')], ['MODULATION\t' + keyFor('modulation'), () => layout.modulation.toggle()], ['TIMELINE', () => runAction('timeline')], ['NOTEBOOK\t' + keyFor('notebook'), () => layout.notebook.toggle()], ['HIDE / SHOW the rack\t' + keyFor('rack'), () => layout.toggleRack()], ['DOCK / UNDOCK the transport\t' + keyFor('dock'), () => layout.dockTransport()], ['HIDE the interface\t' + keyFor('hide'), () => runAction('hide')], ['SHOW / HIDE help\t' + keyFor('notes'), () => runAction('notes')], null, ['THEME · LIGHT', () => app.hooks.setTheme && app.hooks.setTheme('light')], ['THEME · DARK', () => app.hooks.setTheme && app.hooks.setTheme('dark')], ['THEME · SYSTEM', () => app.hooks.setTheme && app.hooks.setTheme('system')], null,
          ...[...document.querySelectorAll('.dev:not([hidden])')].map((d) => [(d.classList.contains('closed') ? '⊕  ' : '↑  ') + d.querySelector('.dev-eyebrow').textContent, () => layout.raise(d.dataset.id), null, winHint(d)])],
        ABOUT: () => [['ABOUT λWAVES', () => layout.notebook.open('about')], ['KEYBOARD SHORTCUTS…\t' + keyFor('help'), () => layout.keymap.toggle()], ['SETTINGS…\t' + keyFor('settings'), () => layout.raise('settings')], null, ['UPDATE APP', () => swClient.refresh(), null, 'check for a new build, rebuild the offline cache, and reload']],
      };
      /* 0.5.0 C3 · THE BAR IS THE KIT'S createMenubar (its port of this app's bar: the disclosure, 400 ms hover hide, the placement,
         Escape → the wordmark, the phone crossing, a row that throws still closes it).  N1's hand-back stays app glue: the kit closes the
         bar BEFORE the act and returns focus only on Escape, so a row that leaves focus on the vanished item (or nowhere) gives it back
         to the wordmark, an act that moved it on purpose (the keyboard window, the notebook) keeps it (BRIEF candidate M1). */
      const back = (run) => () => { try { run(); } finally { const f = document.activeElement; if (!f || f === document.body || mb.bar.contains(f)) title.focus({ preventScroll: true }); } };
      const mb = createMenubar({ opener: title, host: document.getElementById('lab'), phone: isPhone,
        menus: Object.fromEntries(Object.entries(MENUS).map(([g, rows]) => [g, () => rows().map((r) => r && [r[0], back(r[1]), ...r.slice(2)])])) });
      layout.menu = { open: mb.open, close: mb.close, get isOpen() { return mb.isOpen; }, scale: 1.04, get enlarged() { return title.classList.contains('menu-open'); } };
    }
    /* LEAN (the Aa button) and the KIND taxonomy (data-kind, ⧉ COPY, the boot folds): lab/window-chrome.js (N7 seam 9) */
    installWindowChrome({ KIND, layout, present: () => schedule(TIER.PRESENT) });
    for (const t of ['devclose', 'devopen']) document.addEventListener(t, () => saveSettings());   // C3: the kit's + opens a window itself
    layout.addMenu = rk.addMenu; layout.favMenu = rk.favMenu;   // 0.5.0 C3: the + and ☆ lists are the kit's (createRack chrome)
    /* ── THE NOTEBOOK: a free glass over the stage; its ⓘ flips it into the ABOUT face ── */
    const nb = document.getElementById('notebook');
    if (nb) {
      const NB_KEY = 'lambdawaves.q0.notebook', NB_TITLE = 'lambdawaves.q0.notebook.title', NB_SUBTITLE = 'lambdawaves.q0.notebook.subtitle';
      const ta = nb.querySelector('.nb-text'), view = nb.querySelector('.nb-view'), titleIn = nb.querySelector('.nb-title'), subIn = nb.querySelector('.nb-subtitle'), faces = { notes: nb.querySelector('.nb-notes'), about: nb.querySelector('.nb-aboutface') };
      /* the ABOUT face's version line is BUILD_LINE, never hand-written markup: the copy dump reads this same text back out of the face */
      const abV = nb.querySelector('.ab-version');
      if (abV) { const i = BUILD_LINE.indexOf(' · '); abV.textContent = ''; el('span', 'ab-tag', abV, i < 0 ? BUILD_LINE : BUILD_LINE.slice(0, i)); if (i >= 0) abV.appendChild(document.createTextNode(BUILD_LINE.slice(i))); }
      try {
        ta.value = localStorage.getItem(NB_KEY) || '';
        const t = localStorage.getItem(NB_TITLE); if (t) titleIn.value = t;
        if (subIn) { const s = localStorage.getItem(NB_SUBTITLE); if (s) { subIn.value = s; subIn.hidden = false; } }
      } catch (e) {}
      /* 2026-09-11: a synchronous localStorage write per keystroke became one write 300 ms after the last key; pagehide flushes */
      /* 2026-09-11: the notebook's move and resize write style once per FRAME, not once per pointer event */
      const nbPaint = coalesce(paint => paint());
      const nbPending = new Map(); let nbTimer = 0;
      const nbFlush = () => { nbTimer = 0; for (const [k, v] of nbPending) { try { localStorage.setItem(k, v); } catch (e) {} } nbPending.clear(); };
      const nbStore = (k, v) => { nbPending.set(k, v); if (!nbTimer) nbTimer = setTimeout(nbFlush, 300); };
      window.addEventListener('pagehide', nbFlush);
      titleIn.addEventListener('input', () => nbStore(NB_TITLE, titleIn.value));
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
        subIn.addEventListener('input', () => nbStore(NB_SUBTITLE, subIn.value));
        subIn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); subIn.blur(); }
          else if (e.key === 'Backspace' && !subIn.value) { e.preventDefault(); subIn.hidden = true; try { localStorage.removeItem(NB_SUBTITLE); } catch (_) {} titleIn.focus(); }
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
         (the MOLECULE dropdown's pick, MOLECULES on), view (the V key's), orbital (the ORBITAL dial by name or number, VIEW orbital) — one
         ring row and one fade a press (a molecule's fade is its head, D2), the ring never cleared; any other key (a whole state `lw:s=…`,
         E9) is ignored and said on the foot.  Capture phase: the sanitiser sends every link to a new tab (notebook-render.js). */
      function lwLink(q, name) {                                       // 0.6.6 G1: the four keys are rows of THE VERB TABLE (lab/verbs.js), run as one list
        const kv = new Map(), bad = [], list = [];
        for (const p of q.split('&')) { const [k, v = ''] = p.split('='); try { kv.set(k, decodeURIComponent(v)); } catch (_) { bad.push(k); } }
        for (const [k, v] of kv) if (k === 'preset' || k === 'view') list.push({ verb: k, args: { id: v } });
          else if (k === 'molecule') list.push({ verb: k, args: kv.has('orbital') ? { id: v, orbital: kv.get('orbital') } : { id: v } });
          else if (k === 'orbital') { if (!kv.has('molecule')) list.push({ verb: 'view', args: { id: 'orbital', orbital: v } }); } else bad.push(k);
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
        return Object.fromEntries(app.state.modHost.registry.list().map((id) => [id, app.state.modHost.registry.baseOf(id)]));
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
      const part = {
        capture: (name) => ({ data: projectSnapshot(), notebook: { title: name && titleIn.value === 'NOTEBOOK' ? name : titleIn.value, subtitle: subIn ? subIn.value : '', text: ta.value } }),
        restore(v, ctx) {
          if (!v || typeof v !== 'object' || !v.data || app.sh.restore(v.data, { project: true }) !== true) throw new Error('the project did not take');
          const n = v.notebook && typeof v.notebook === 'object' ? v.notebook : {};
          if (nbTimer) { clearTimeout(nbTimer); nbTimer = 0; } nbPending.clear();   // S2: the last project's keystrokes still in the 300 ms debounce must not land over this one's notebook
          ta.value = n.text || ''; titleIn.value = n.title || (ctx && ctx.name) || 'NOTEBOOK';
          if (subIn) { subIn.value = n.subtitle || ''; subIn.hidden = !subIn.value; }
          try { localStorage.setItem(NB_KEY, ta.value); localStorage.setItem(NB_TITLE, titleIn.value); if (subIn) localStorage.setItem(NB_SUBTITLE, subIn.value); } catch (e) {}
          return true;
        },
        signature: () => projectKey(),
      };
      const projects = createProjects({ host: floats || document.body, part,
        snapshot: () => JSON.parse(JSON.stringify(app.sh.serialize())), rollback: (S) => app.sh.restore(S) === true,   // M5b: the instrument as it stood, through the same road
        busy: (d) => { busy.n = Math.max(0, busy.n + d); busySync(); },   // wave 48: a project load rebuilds the register, the operator and the field — BUSY work
        notice: () => app.state.restoreNotice, thumbnail: () => app.sh.LW.thumbnail(), confirm: (text) => window.confirm(text), onMoved: () => occlusion.dirty(),
        rack: { keepClear: () => ['rack', 'rackL', 'transport'].map((id) => paintedRect(document.getElementById(id))).filter(Boolean) },
        /* 0.3.1 · S2 THE NOTEBOOK LAW (PLAN §3.4): a project opens onto its notebook only when the notebook has text — the complete
           notebook, in its scrollable pane.  A blank one (NEW's included) opens nothing and closes nothing.  "Edited" is read off the
           text: no flag.  S3: the ring's bottom row is named for the file. */
        opened(label) { count(); if (app.state.history) app.state.history.clear(label); if (ta.value.trim()) { show('notes'); nb.dataset.mode = 'view'; } render(); },
        titleAfterSave(name) { if (titleIn.value !== 'NOTEBOOK') return false; titleIn.value = name; return true; } });
      addEventListener('beforeunload', (e) => {
        if (!projects.dirty) return;
        e.preventDefault(); e.returnValue = '';
      });
      /* FOLDERS lives in #floats: its pane and its rail's chips are painted glass (CLAUDE.md's mask law); a move dirties the block
         (onMoved above), and so do its open and close */
      { const { root, rail } = projects.folders.win;
        occlusion.register('folders', () => projects.folders.isOpen() ? [paintedRect(root), ...(rail.el ? [...rail.el.querySelectorAll('.mir-chip')].map((c) => paintedRect(c)) : [])] : []);
        for (const el of [root, rail.el]) occlusion.watch(el, { attributes: true, attributeFilter: ['hidden'] }); }
      nb.querySelector('.nb-projects-btn').addEventListener('click', () => projects.folders.toggle());
      layout.projects = projects;
      const count = () => { const c = nb.querySelector('.nb-count'); if (c) c.textContent = ta.value.trim() ? ta.value.trim().split(/\s+/).length + ' words · kept in this browser' : 'empty · kept in this browser'; };
      ta.addEventListener('input', () => { nbStore(NB_KEY, ta.value); count(); });
      const ABOUT_DEF_W = 470, ABOUT_DEF_H = 670;
      const NOTES_DEF_W = 640, NOTES_DEF_H = 460;
      const show = (face) => {
        if (face === 'projects') { projects.folders.open(); return; }   // 0.5.0 C6: the PROJECTS face left the notebook; its open is FOLDERS'
        nb.hidden = false; faces.notes.hidden = face !== 'notes'; faces.about.hidden = face !== 'about'; nb.dataset.face = face;
        const S = readSettings();
        if (face === 'about') {
          const w = typeof S.abW === 'number' ? S.abW : ABOUT_DEF_W;
          const h = typeof S.abH === 'number' ? S.abH : ABOUT_DEF_H;
          nbResize(w, h);
          if (!nbMoved) {
            nb.style.left = 'calc(50% - ' + Math.round(w / 2) + 'px)';
            nb.style.top = 'max(20px, calc(50% - ' + Math.round(h / 2) + 'px))';
          }
          const logo = nb.querySelector('.nb-logo');
          if (logo && !logo.children.length) { for (const c of document.getElementById('title').children) if (!c.classList.contains('ms')) logo.appendChild(c.cloneNode(true)); paintMarks(); }
        } else {
          const w = typeof S.nbW === 'number' ? S.nbW : NOTES_DEF_W;
          const h = typeof S.nbH === 'number' ? S.nbH : NOTES_DEF_H;
          nbResize(w, h);
          if (!nbMoved) {
            nb.style.left = 'calc(50% - ' + Math.round(w / 2) + 'px)';
            nb.style.top = '12%';
          }
        }
        if (face === 'notes') ta.focus();
      };
      nb.querySelector('.nb-about').addEventListener('click', () => show(nb.dataset.face === 'about' ? 'notes' : 'about'));
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
        if (nb.dataset.face === 'about') {
          if (S.abW === w && S.abH === h) return;
          settingsStore.write({ ...S, abW: w, abH: h });
        } else {
          if (S.nbW === w && S.nbH === h) return;
          settingsStore.write({ ...S, nbW: w, nbH: h });
        }
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
    /* a hidden rack peeks by the kit's pointer law (createRack); the playhead does the same around whichever seat modDodge gives it */
    const peekLast = { x: -1, y: -1, bar: false };
    const peekTransport = document.getElementById('transport');
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || app.state.uiHidden || !document.body.classList.contains('rack-hidden')) return;
      if (Math.abs(e.clientX - peekLast.x) < 2 && Math.abs(e.clientY - peekLast.y) < 2) return;   // a synthesised move after a layout change is not the pointer leaving
      peekLast.x = e.clientX; peekLast.y = e.clientY;
      const W = window.innerWidth, H = window.innerHeight;
      /* WAVE 108 · THE REVEAL TARGET FOLLOWS THE PLAYHEAD.  modDodge can tunnel the native
         transport from its bottom seat to its top seat, but the hidden-rack hit area used to stay
         hard-coded at the bottom of the viewport.  The pill's `at-top` class is the current seat
         written by that move, so derive the same candidate rect from it here.  The 80/120 px margins preserve the old
         720-px-wide target and its forgiving exit band without reading layout on every pointermove. */
      const barTop = peekTransport && peekTransport.classList.contains('at-top') ? 52 : H - 60 - 46;
      const bar = { left: (W - 560) / 2, right: (W + 560) / 2, top: barTop, bottom: barTop + 46 };
      const nearBar = e.clientX >= bar.left - 80 && e.clientX <= bar.right + 80
        && e.clientY >= bar.top - 60 && e.clientY <= bar.bottom + 60;
      const insideBar = e.clientX >= bar.left - 120 && e.clientX <= bar.right + 120
        && e.clientY >= bar.top - 120 && e.clientY <= bar.bottom + 120;
      if (nearBar) { document.body.classList.add('transport-peek'); peekLast.bar = true; }
      else if (!insideBar && peekLast.bar) { document.body.classList.remove('transport-peek'); peekLast.bar = false; }
    });
  }
}
