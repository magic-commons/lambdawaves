// The logo's FILE · EDIT · VIEW · PLAY · WINDOW · HELP bar, row by row (OPTIMIZATION 2026-09-24 · N1, AUDIT-E FE1; 021 I3: the tree of
// REVIEW-B §4 — a row inside a submenu is named by its path, 'STATE › CLEAR', and pressed as a hand presses it, the submenu rows first).
// Every row is clicked as a user clicks it — the bar opened, the menu's chip pressed, the item pressed — and each one
// is judged by the act it names, not by "nothing threw".  Three rows were wrong before N1: EDIT › RESEED reset the
// CAMERA (runKey('KeyR') found camReset), EDIT › RESET KEYS clicked a trigger deleted in 5f6421e, and EDIT › CLEAR
// pressed the first of five CLEARs in document order — the undo ring's own once HISTORY floated.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz`, { width: 1500, height: 1000, script: 30000 });
let failed = false;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);
  /* THE DRIVER.  One press = open the bar, press the menu's chip (which fills its list from MENUS), press the row.  It
     answers what the row showed (its key hint, whether it was disabled) and what the bar did after it (closed, every
     list down, focus handed back to the logo unless the act moved it on purpose). */
  await g.ev(`window.__row = async (menu, label) => {
      __LW.layout.menu.open();
      const bar = document.getElementById('menubar');
      const btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.dataset.menu === menu);
      if (!btn) return { found: false, why: 'no menu ' + menu };
      btn.click();
      const it = await __find(btn, label);
      if (!it || !it.querySelector) { btn.click(); return { found: false, why: 'no row ' + label, at: it }; }
      const key = (it.querySelector('.mb-key') || {}).textContent || '', disabled = it.disabled;
      if (!disabled) it.click(); else btn.click();
      await __LW.settle();
      return { found: true, key, disabled, closed: bar.hidden, listsDown: [...bar.querySelectorAll('.mb-list')].every((l) => l.hidden),
        focus: document.activeElement === document.getElementById('title') ? 'title' : (document.activeElement || {}).tagName || '' };
    };
    window.__keyOf = (id) => __LW.keys.name(__LW.keys.actions.find((a) => a.id === id));
    /* 021 I3 · a path 'A › B › C' in an open group: each submenu row pressed (it opens beside its row), the last row returned */
    window.__find = async (btn, label) => { let list = btn.parentElement.querySelector('.mb-list'); const parts = label.split(' › ');
      for (let i = 0; i < parts.length; i++) { const it = [...list.querySelectorAll(':scope > .mb-item')].find((x) => x.querySelector('.mb-lbl').textContent.startsWith(parts[i]));
        if (!it || i === parts.length - 1) return it || 'no ' + parts[i]; if (it.getAttribute('aria-expanded') !== 'true') it.click(); await new Promise((q) => setTimeout(q, 30));
        list = [...document.querySelectorAll('#menubar .mb-sub-list')].find((l) => l.mbRow === it); if (!list) return 'no submenu ' + parts[i]; } };
    window.__keyAt = async (menu, label) => { __LW.layout.menu.open(); const bar = document.getElementById('menubar'), btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.dataset.menu === menu);
      if (btn.parentElement.querySelector('.mb-list').hidden) btn.click(); const it = await __find(btn, label); const k = it && it.querySelector ? (it.querySelector('.mb-key') || {}).textContent || '' : null; __LW.layout.menu.close(); return k; };
    return 1;`);

  /* ── 1 · every key hint is the LIVE binding, and a rebind renames the row ── */
  const hints = await g.ev(`const want = { PLAY: [['PLAY / PAUSE', 'transport.play']], EDIT: [['STATE › RESEED the particles', 'reseed'], ['UNDO', 'undo'], ['REDO', 'redo'], ['HISTORY UNDO', 'historyUndo'], ['SETTINGS', 'settings']],
      VIEW: [['CAMERA › HOME', 'camReset'], ['INTERFACE › HIDE the interface', 'hide'], ['INTERFACE › WINDOW HELP', 'notes'], ['FULL SCREEN', 'fullscreen']], WINDOW: [['TOOLS › MODULATION', 'modulation'], ['TOOLS › NOTEBOOK', 'notebook'], ['RACKS › SHOW THE RACK', 'rack'], ['RACKS › DOCK', 'dock']],
      HELP: [['KEYBOARD SHORTCUTS', 'help']], FILE: [['SAVE AS', 'saveAs'], ['NEW', 'new'], ['OPEN', 'open'], ['EXPORT › PICTURE', 'export.picture']] };
    const bad = [];
    for (const [menu, rows] of Object.entries(want)) for (const [label, id] of rows) { const k = await __keyAt(menu, label); if (k !== __keyOf(id)) bad.push([menu, label, k, __keyOf(id)]); }
    /* 021 I3: a choice is a radio, and the one in force carries the mark (VIEW › OBSERVABLE: the boot's PHASE) */
    { __LW.layout.menu.open(); const bar = document.getElementById('menubar'), btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.dataset.menu === 'VIEW'); btn.click();
      const it = await __find(btn, 'OBSERVABLE › arg ψ'); if (!it || it.getAttribute('aria-checked') !== 'true' || it.getAttribute('role') !== 'menuitemradio') bad.push(['VIEW', 'OBSERVABLE radio', it && it.outerHTML && it.outerHTML.slice(0, 120)]); __LW.layout.menu.close(); }
    const b = __LW.keys.bind('hide', { key: 'KeyU' });
    const out = { VIEW: await __keyAt('VIEW', 'INTERFACE › HIDE the interface') };
    __LW.keys.reset(); __LW.layout.menu.close();
    return { bad, bound: b.ok, rebound: out };`);
  assert.deepEqual(hints.bad, []);
  assert.equal(hints.bound, true);
  assert.deepEqual(hints.rebound, { VIEW: 'U' });
  console.log('PASS every key hint in the bar is the live binding (call 6: NEW Ctrl+Alt+N, OPEN Ctrl+O, PICTURE Ctrl+E), a choice is a radio with its mark, and a rebind renames the row (VIEW › INTERFACE › HIDE reads U; HIDE is listed once)');

  /* ── 2 · RESEED seeds the particles and leaves the camera where the hand put it ── */
  const reseed = await g.ev(`__LW.particles.setOn(false); __LW.orbit(0.9, 0.1); await __LW.settle();
    const cam0 = { yaw: __LW.obs.yaw, pitch: __LW.obs.pitch, dist: __LW.obs.dist, fov: __LW.obs.fov, quat: __LW.obs.quat.slice() };
    const r = await __row('EDIT', 'STATE › RESEED the particles');
    const cam1 = { yaw: __LW.obs.yaw, pitch: __LW.obs.pitch, dist: __LW.obs.dist, fov: __LW.obs.fov, quat: __LW.obs.quat.slice() };
    const same = Object.keys(cam0).every((k) => k === 'quat' ? cam0.quat.every((v, i) => Object.is(v, cam1.quat[i])) : Object.is(cam0[k], cam1[k]));
    const out = { r, on: __LW.particles.on, n: __LW.particles.points.length, same, errors: __e.slice() };
    __LW.particles.setOn(false); return out;`);
  assert.equal(reseed.r.found, true); assert.equal(reseed.r.closed, true); assert.equal(reseed.r.listsDown, true);
  assert.equal(reseed.on, true); assert.equal(reseed.n, 160);
  assert.equal(reseed.same, true, 'RESEED must not move the camera');
  assert.deepEqual(reseed.errors, []);
  console.log('PASS EDIT › RESEED seeds 160 particles and leaves the orbited camera bit for bit where it was');

  /* ── 3 · RESET KEYS restores a rebound key and forgets the override ── */
  /* Digit9, a free key: L is the main menu's since iteration 003 (and 5 the timeline's zoom-selection), and an overlap binds only on an explicit steal */
  const keys = await g.ev(`const b = __LW.keys.bind('transport.play', { key: 'Digit9' });
    const rebound = __LW.keys.table.chords('transport.play')[0], stored = localStorage.getItem('lambdawaves.q0.keys');
    const r = await (async () => { __LW.run('keys.reset'); return { found: true, closed: true }; })();   /* 021 I3: RESET lives in the KEYBOARD window (RESET TO DEFAULT) and the action keys.reset; the tree has no row for it */
    return { ok: b.ok, rebound, stored: !!stored && /transport\.play/.test(stored), r, after: __LW.keys.table.chords('transport.play')[0], storedAfter: localStorage.getItem('lambdawaves.q0.keys'), errors: __e.slice() };`);
  assert.equal(keys.ok, true); assert.equal(keys.rebound, 'Digit9'); assert.equal(keys.stored, true);
  assert.equal(keys.r.found, true); assert.equal(keys.r.closed, true);
  assert.equal(keys.after, 'Space'); assert.equal(keys.storedAfter, null); assert.deepEqual(keys.errors, []);
  console.log('PASS the keys.reset action puts PLAY back on Space and removes the stored override');

  /* ── 4 · CLEAR is STATE's CLEAR — t, playhead, trail, coefficients — and an EDIT on the undo ring, never its wipe,
         with HISTORY floated (whose own CLEAR trigger then precedes the racks in the document) ── */
  const clear = await g.ev(`__LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle();
    __LW.layout.popOut('history'); __LW.setKeepFrames(true);
    __LW.api.setPopulation(0, 0.3); __LW.history.flush(); await __LW.settle();
    __LW.scrub(3.25); await __LW.settle();
    const d0 = __LW.history.depth, pop0 = __LW.reg.populated().length, t0 = __LW.clock.t;
    const floated = __LW.layout.isFloating('history');
    const firstClear = [...document.querySelectorAll('.trig')].find((t) => t.textContent.trim() === 'CLEAR');
    const firstIsHistory = !!firstClear && !!firstClear.closest('.dev[data-id="history"]');
    const sv = __LW.shadowView, orig = sv.clearTrail; let trails = 0; sv.clearTrail = function () { trails++; return orig.call(this); };
    const r = await __row('EDIT', 'STATE › CLEAR the register');
    sv.clearTrail = orig;
    __LW.history.flush(); await __LW.settle();
    const tl = document.querySelector('#transport .tr-open'); tl.click(); await __LW.settle();   // 018 E2: t left the CSB; the playhead's reading is the TIMELINE's t (keys.js ui.tlTime)
    const tro = document.querySelector('#floats .ro.time .ro-val'), scrubNow = tro ? parseFloat(tro.textContent) : NaN; tl.click();
    const out = { r, floated, firstIsHistory, d0, pop0, t0, pop1: __LW.reg.populated().length, t1: __LW.clock.t, trails, scrubNow,
      d1: __LW.history.depth, canUndo: __LW.history.canUndo };
    __LW.history.undo(); await __LW.settle();
    out.undone = __LW.reg.populated().length === pop0; out.errors = __e.slice();
    __LW.layout.dockWindow('history'); __LW.setKeepFrames(false);
    return out;`);
  assert.equal(clear.floated, true); assert.equal(clear.firstIsHistory, true, 'the probe must stand where the old bug stood');
  assert.ok(clear.d0 >= 1 && clear.pop0 === 2 && clear.t0 > 3);
  assert.equal(clear.r.found, true); assert.equal(clear.r.closed, true);
  assert.equal(clear.pop1, 0); assert.equal(clear.t1, 0); assert.equal(clear.trails, 1); assert.equal(clear.scrubNow, 0);
  assert.ok(clear.d1 >= clear.d0, 'CLEAR must not wipe the undo ring');
  assert.equal(clear.canUndo, true); assert.equal(clear.undone, true);
  assert.deepEqual(clear.errors, []);
  console.log(`PASS EDIT › CLEAR with HISTORY floated clears the register (2 → 0 labels, t ${clear.t0} → 0, playhead 0, one trail clear) and the ring grows ${clear.d0} → ${clear.d1}; UNDO brings the state back`);

  /* ── 5 · FILE: the quick save writes exactly its two keys, LOAD reads them back, COPY JSON and COPY LINK copy ── */
  const file = await g.ev(`const LS_EXP = 'lambdawaves.q0.experiment', LS_PRES = 'lambdawaves.q0.presentation';
    const snapLS = () => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)]));
    const mask = (o) => { if (o && o.layout) o.layout.at = 0; if (o && o.quality) o.quality.autoScale = 1; return o; };
    __LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle();
    localStorage.removeItem(LS_EXP); localStorage.removeItem(LS_PRES);
    const before = snapLS();
    const rs = await __row('FILE', 'QUICK › SAVE the experiment');
    const after = snapLS();
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => before[k] !== after[k]).sort();
    const S = __LW.serialize();
    const expSame = JSON.stringify(JSON.parse(after[LS_EXP])) === JSON.stringify(S.experiment);
    const presSame = JSON.stringify(mask(JSON.parse(after[LS_PRES]))) === JSON.stringify(mask(S.presentation));
    const digest = __LW.stateDigest();
    __LW.loadPreset('rydberg'); await __LW.settle();
    const moved = __LW.stateDigest() !== digest;
    const beforeLoad = snapLS();
    const rl = await __row('FILE', 'QUICK › LOAD the last quick save');
    const loaded = __LW.stateDigest() === digest, quickKeysKept = localStorage.getItem(LS_EXP) === beforeLoad[LS_EXP] && localStorage.getItem(LS_PRES) === beforeLoad[LS_PRES];
    /* the clipboard, stubbed: a synthetic click is not a trusted gesture, and what is judged is WHAT the row copies */
    let clip = null; const cb = navigator.clipboard; const orig = cb.writeText; cb.writeText = async (t) => { clip = t; };
    const rj = await __row('EDIT', 'COPY › JSON'); await new Promise((r) => setTimeout(r, 30));
    const json = clip; const jsonSame = !!json && JSON.stringify(mask(JSON.parse(json).presentation)) === JSON.stringify(mask(__LW.serialize().presentation)) && JSON.stringify(JSON.parse(json).experiment) === JSON.stringify(__LW.serialize().experiment);
    clip = null;
    const rk = await __row('EDIT', 'COPY › LINK'); await new Promise((r) => setTimeout(r, 30));
    const linkSame = !!clip && !!__LW.link.last && clip === __LW.link.last.href && /#s=/.test(clip);
    cb.writeText = orig;
    return { rows: [rs, rl, rj, rk].map((r) => r.found && r.closed && r.listsDown), changed, expSame, presSame, moved, loaded, quickKeysKept, jsonSame, linkSame, errors: __e.slice() };`);
  assert.deepEqual(file.rows, [true, true, true, true]);
  assert.deepEqual(file.changed, ['lambdawaves.q0.experiment', 'lambdawaves.q0.presentation']);
  assert.equal(file.expSame, true); assert.equal(file.presSame, true);
  assert.equal(file.moved, true); assert.equal(file.loaded, true); assert.equal(file.quickKeysKept, true);
  assert.equal(file.jsonSame, true); assert.equal(file.linkSame, true);
  assert.deepEqual(file.errors, []);
  console.log('PASS FILE › the quick SAVE writes exactly its two keys (= serialize()), LOAD brings the saved state back, COPY JSON copies serialize(), COPY LINK copies the minted link');

  /* ── 6 · every other row does what it names, and the bar closes behind each one ── */
  const rest = await g.ev(`const R = {}, ok = (r) => r.found && r.closed && r.listsDown;
    const st = () => document.querySelector('.dev[data-id="spectrum"] .dev-stat').textContent;   // 018 C1: the lab's status line is SPECTRUM's
    window.confirm = () => true;                                      // NEW project asks before discarding a dirty project
    /* EDIT */
    { __LW.pause(); const r = await __row('PLAY', 'PLAY / PAUSE'); R.play = ok(r) && __LW.clock.playing; __LW.pause(); }
    { __LW.loadPreset('1s+2pz'); const r = await __row('EDIT', 'STATE › NORMALIZE'); R.normalize = ok(r) && /‖c‖/.test(st()); }
    { __LW.loadPreset('1s+2pz'); __LW.pause(); let clip = null; const cb = navigator.clipboard, orig = cb.writeText; cb.writeText = async (t) => { clip = t; };   /* 0.3.3 · wave 135 */
      const r = await __row('EDIT', 'COPY › LaTeX'); await new Promise((q) => setTimeout(q, 30)); cb.writeText = orig;
      const L = (clip || '').split(String.fromCharCode(10)); R.latex = ok(r) && L.length === 2 && L[0] === '$1s_{0}$ and $2p_{0}$' && L[1].startsWith('$' + String.fromCharCode(92) + 'psi = 0.71');
      R.latexFlash = document.querySelector('.dev[data-id="spectrum"]').classList.contains('copied'); }
    { __LW.orbit(0.7, 0.2); const r = await __row('VIEW', 'CAMERA › HOME'); R.view = ok(r) && Math.abs(__LW.obs.yaw - 0.65) < 1e-12 && Math.abs(__LW.obs.dist - 3.3) < 1e-12; }
    { const r = await __row('EDIT', 'UNDO HISTORY'); R.hist = ok(r) && !document.querySelector('.dev[data-id="history"]').classList.contains('closed'); }
    { const r = await __row('EDIT', 'SETTINGS'); R.settings = ok(r) && !document.querySelector('.dev[data-id="settings"]').classList.contains('closed'); }
    { __LW.api.setPopulation(0, 0.5); __LW.history.flush(); const u = await __row('EDIT', 'UNDO'); const d = __LW.history.redoDepth; const re = await __row('EDIT', 'REDO'); R.undoRedo = ok(u) && ok(re) && d >= 1 && __LW.history.redoDepth === d - 1; }
    /* VIEW */
    { const i0 = __LW.mat.invert; const r = await __row('VIEW', 'INVERT the cloud'); R.invert = ok(r) && __LW.mat.invert === !i0; __LW.setInvert(i0); }
    { const views = [['ρ = |ψ|²', 0], ['arg ψ', 1], ['Re ψ', 2], ['Im ψ', 3]]; R.views = true;   /* iteration 008 W: Δρ and Re + Im left WAVE */
      for (const [l, v] of views) { const r = await __row('VIEW', 'OBSERVABLE › ' + l); R.views = R.views && ok(r) && __LW.mat.view === v; } __LW.setView('phase'); }
    { const styles = ['CLOUD', 'SOLID', 'SIGNED', 'DUST', 'BANDS']; R.styles = true;   /* iteration 008 G: GRAIN joined DUST (its index 2 retired; DUST is 5) */
      for (const s of styles) { const r = await __row('VIEW', 'STYLE › ' + s); R.styles = R.styles && ok(r) && __LW.mat.style === ({ CLOUD: 0, SOLID: 1, SIGNED: 3, DUST: 5, BANDS: 4 })[s]; } __LW.setStyle('cloud'); }
    { const c0 = document.body.classList.contains('no-captions'); const r = await __row('VIEW', 'STAGE › CAPTIONS'); R.captions = ok(r) && document.body.classList.contains('no-captions') === !c0; await __row('VIEW', 'STAGE › CAPTIONS'); }
    { const b0 = document.body.classList.contains('no-badges'); const r = await __row('VIEW', 'INTERFACE › STATUS TAGS'); R.badges = ok(r) && document.body.classList.contains('no-badges') === !b0; await __row('VIEW', 'INTERFACE › STATUS TAGS'); }
    { const h0 = document.body.classList.contains('control-hints-off'); const r = await __row('VIEW', 'INTERFACE › CONTROL HINTS'); R.hints = ok(r) && document.body.classList.contains('control-hints-off') === !h0; await __row('VIEW', 'INTERFACE › CONTROL HINTS'); }
    { const r = await __row('VIEW', 'INTERFACE › HIDE the interface'); R.hideV = ok(r) && __LW.uiHidden === true; __LW.keys.toggleUI(); R.hideV = R.hideV && __LW.uiHidden === false; }
    /* WINDOW */
    { const m0 = __LW.mod.expanded; const r = await __row('WINDOW', 'TOOLS › MODULATION'); R.mod = ok(r) && __LW.mod.expanded === !m0; await __row('WINDOW', 'TOOLS › MODULATION'); R.mod = R.mod && __LW.mod.expanded === m0; }
    { const n0 = __LW.layout.notebook.isOpen; const r = await __row('WINDOW', 'TOOLS › NOTEBOOK'); R.nb = ok(r) && __LW.layout.notebook.isOpen === !n0 && document.activeElement === document.querySelector('.nb-text'); await __row('WINDOW', 'TOOLS › NOTEBOOK'); }
    { const k0 = document.body.classList.contains('rack-hidden'); const r = await __row('WINDOW', 'RACKS › SHOW THE RACK'); R.rack = ok(r) && document.body.classList.contains('rack-hidden') === !k0; await __row('WINDOW', 'RACKS › SHOW THE RACK'); }
    { const d0 = __LW.layout.docked; const r = await __row('WINDOW', 'RACKS › DOCK'); R.dock = ok(r) && __LW.layout.docked === !d0; await __row('WINDOW', 'RACKS › DOCK'); R.dock = R.dock && __LW.layout.docked === d0; }
    { const w0 = document.body.classList.contains('window-info-off'); const r = await __row('VIEW', 'INTERFACE › WINDOW HELP'); R.help = ok(r) && document.body.classList.contains('window-info-off') === !w0; await __row('VIEW', 'INTERFACE › WINDOW HELP'); }
    { const t0 = __LW.themeChoice; R.theme = true; for (const [l, t] of [['THEME › DARK', 'dark'], ['THEME › SYSTEM', 'system'], ['THEME › LIGHT', 'light']]) { const r = await __row('VIEW', l); R.theme = R.theme && ok(r) && __LW.themeChoice === t; } __LW.setTheme(t0); }
    { const d = document.querySelector('.dev[data-id="informational"]'), s = document.querySelector('.dev[data-id="settings"]'); d.classList.add('closed'); if (s.classList.contains('closed')) __LW.layout.raise('settings');   /* 0.5.3 M9: listed, and opened UNDER SETTINGS */
      const r = await __row('WINDOW', 'OTHER › INFORMATIONAL'); await new Promise((q) => setTimeout(q, 50)); R.info = ok(r) && !d.classList.contains('closed') && s.nextElementSibling === d; d.classList.add('closed'); }
    { document.querySelector('.dev[data-id="wigner"]').classList.add('closed'); const r = await __row('WINDOW', 'INFO › WIGNER'); R.raise = ok(r) && !document.querySelector('.dev[data-id="wigner"]').classList.contains('closed'); document.querySelector('.dev[data-id="wigner"]').classList.add('closed'); }   // ATOMS is a hidden LEGACY window since 2026-10
    /* HELP (021 I3: ABOUT renamed; SETTINGS is EDIT's alone) */
    { const r = await __row('HELP', 'ABOUT λWAVES'); R.about = ok(r) && __LW.layout.notebook.isOpen && __LW.layout.notebook.face === 'about'; __LW.layout.notebook.close(); }
    { const r = await __row('HELP', 'KEYBOARD SHORTCUTS'); R.keymap = ok(r) && __LW.keymap.isOpen && document.querySelector('[data-mir-window="keyboard"]').contains(document.activeElement); __LW.keymap.close(); }
    { let reloaded = 0; const rl = __LW.sw.reload; __LW.sw.reload = () => { reloaded++; }; const r = await __row('HELP', 'UPDATE APP'); for (let i = 0; i < 40 && !reloaded; i++) await new Promise((q) => setTimeout(q, 50)); __LW.sw.reload = rl; __LW.sw.state = 'idle'; R.update = ok(r) && reloaded === 1; }
    /* FILE (the project rows) */
    /* 0.5.0 C6: the project rows open FOLDERS (the PROJECTS face left the notebook); the line is the facade's status */
    { const r = await __row('FILE', 'SAVE AS'); R.saveAs = ok(r) && __LW.projects.folders.isOpen(); __LW.projects.folders.close(); }
    { const r = await __row('FILE', 'OPEN…'); R.openP = ok(r) && __LW.projects.folders.isOpen(); __LW.projects.folders.close(); }
    { const r = await __row('FILE', 'SAVE…'); R.saveP = ok(r) && __LW.projects.folders.isOpen(); __LW.projects.folders.close(); }
    { const r = await __row('FILE', 'EXPORT › PROJECT › .json'); R.exportP = ok(r) && /nothing to export/.test(__LW.projects.status); }
    { const r = await __row('FILE', 'IMPORT'); R.importP = ok(r); }
    { __LW.loadPreset('1s+2pz'); const r = await __row('FILE', 'NEW');   /* 0.3.1 · S2: NEW fetches the empty project before it opens it — wait for its status */
      /* iteration 004: NEW goes through FOLDERS, which asks its own "Save this first?" over unsaved work (no window.confirm) */
      for (let i = 0; i < 20 && !document.querySelector('#folders .sv-ask'); i++) await new Promise((q) => setTimeout(q, 50));
      const nw = [...document.querySelectorAll('#folders .sv-ask .trig')].find((b) => /NEW WITHOUT SAVING/.test(b.textContent)); if (nw) nw.click();
      for (let i = 0; i < 60 && __LW.projects.status !== 'new'; i++) await new Promise((q) => setTimeout(q, 50));
      __LW.projects.folders.close();
      R.fresh = ok(r) && __LW.reg.populated().length === 0 && __LW.layout.projects.current === null; __LW.layout.notebook.close(); }
    R.errors = __e.slice();
    return R;`);
  const want = Object.fromEntries(Object.keys(rest).filter((k) => k !== 'errors').map((k) => [k, true]));
  assert.deepEqual(Object.fromEntries(Object.entries(rest).filter(([k]) => k !== 'errors')), want);
  assert.deepEqual(rest.errors, []);
  console.log(`PASS the other ${Object.keys(want).length} row groups each do what they name and close the bar (FULL SCREEN is left out: it needs a real user activation)`);

  /* ── 7 · FILE: the five EXPORT SHAPE / GRID rows (wave 134) are driven by the same press, with the download
         road stubbed onto captureUI's own instance so each row is judged by what it actually exported, not by a
         real download. The format bytes themselves are tests/export3d.browser-test.mjs's job; this is the wiring. ── */
  const shapeExports = await g.ev(`__LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle();   /* section 6's NEW project left the register empty: no state, no surface to export */
    window.__saved = [];
    const cap = __LW.captureUI.capture, origSave = cap.save;
    cap.save = (r) => { window.__saved.push(r); return true; };
    const rows = ['EXPORT › SHAPE › GLB', 'EXPORT › SHAPE › OBJ', 'EXPORT › SHAPE › STL', 'EXPORT › GRID › NPZ', 'EXPORT › GRID › CUBE'];
    const out = [];
    for (const label of rows) {
      const n0 = window.__saved.length;
      const r = await __row('FILE', label);
      for (let i = 0; i < 300 && window.__saved.length === n0 && __LW.shapeExport.busy; i++) await new Promise((q) => setTimeout(q, 20));
      const last = window.__saved[window.__saved.length - 1];
      out.push({ label, found: r.found, closed: r.closed, listsDown: r.listsDown, disabled: r.disabled, got: window.__saved.length > n0, name: last && last.name });
    }
    cap.save = origSave;
    return { out, errors: __e.slice() };`);
  for (const row of shapeExports.out) {
    assert.equal(row.found, true, row.label + ' must exist'); assert.equal(row.closed, true); assert.equal(row.listsDown, true);
    assert.equal(row.disabled, false, row.label + ' must be enabled while the FIELD is up and no export is in flight');
    assert.equal(row.got, true, row.label + ' must actually export a file'); assert.ok(row.name, row.label + ' must name a file');
  }
  assert.deepEqual(shapeExports.errors, []);
  console.log('PASS FILE › the five EXPORT SHAPE / GRID rows (wave 134) each export a named file and close the bar: ' + shapeExports.out.map((r) => r.name).join(', '));

  /* ── 8 · a row that throws still closes the bar and hands focus back ── */
  const thrower = await g.ev(`const saved = __LW.link.copy, lk = __LW.layout.modulation.toggle;
    __LW.layout.modulation.toggle = () => { throw new Error('probe: the act threw'); };
    window.addEventListener('error', (e) => { if (/probe: the act threw/.test(e.message)) e.preventDefault(); }, { once: true });
    let thrown = false;
    try { const r = await __row('WINDOW', 'TOOLS › MODULATION'); thrown = r; } catch (e) { thrown = String(e); }
    __LW.layout.modulation.toggle = lk;
    const bar = document.getElementById('menubar');
    const out = { closed: bar.hidden, listsDown: [...bar.querySelectorAll('.mb-list')].every((l) => l.hidden), focus: document.activeElement === document.getElementById('title') };
    window.__e = window.__e.filter((m) => !/probe: the act threw/.test(m));
    return out;`);
  assert.deepEqual(thrower, { closed: true, listsDown: true, focus: true });
  console.log('PASS a row whose act throws still closes the bar and returns focus to the logo (the finally)');
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED menubar.browser-test' : 'GREEN menubar.browser-test');
process.exit(failed ? 1 : 0);
