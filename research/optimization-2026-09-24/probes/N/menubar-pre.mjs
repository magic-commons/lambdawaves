// The logo's FILE · EDIT · VIEW · WINDOW · ABOUT bar, row by row (OPTIMIZATION 2026-09-24 · N1, AUDIT-E FE1).
// Every row is clicked as a user clicks it — the bar opened, the menu's chip pressed, the item pressed — and each one
// is judged by the act it names, not by "nothing threw".  Three rows were wrong before N1: EDIT › RESEED reset the
// CAMERA (runKey('KeyR') found camReset), EDIT › RESET KEYS clicked a trigger deleted in 5f6421e, and EDIT › CLEAR
// pressed the first of five CLEARs in document order — the undo ring's own once HISTORY floated.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
/* menubar-pre.mjs — tests/menubar.browser-test.mjs run SOFT against probes/N/lab-pre-n1 (the pre-N1 rack.js): every failed
   assertion is printed and the run goes on, so each defect the gate is built to catch shows up on its own line.
   Rebuild the copy first: cp -rs "$PWD/lab" research/optimization-2026-09-24/probes/N/lab-pre-n1, remove its rack.js, and
   write the pre-N1 one there (git show 729f1a1:lab/rack.js).  Measured 2026-09-25: RESEED 0 particles + the camera moved,
   RESET KEYS left PLAY on KeyO, CLEAR left 2 labels and t 3.25 and emptied the undo ring 1 → 0, a throwing row left the
   bar open. */
const assert = { equal: (a, b, m) => { if (a !== b) console.log('FAIL equal', JSON.stringify(a), '!==', JSON.stringify(b), m || ''); },
  deepEqual: (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) console.log('FAIL deepEqual', JSON.stringify(a).slice(0, 400), '!==', JSON.stringify(b).slice(0, 200), m || ''); },
  ok: (v, m) => { if (!v) console.log('FAIL ok', m || ''); } };
import { open } from '../../../../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/research/optimization-2026-09-24/probes/N/lab-pre-n1/?preset=1s%2B2pz`, { width: 1500, height: 1000, script: 30000 });
let failed = false;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);
  /* THE DRIVER.  One press = open the bar, press the menu's chip (which fills its list from MENUS), press the row.  It
     answers what the row showed (its key hint, whether it was disabled) and what the bar did after it (closed, every
     list down, focus handed back to the logo unless the act moved it on purpose). */
  await g.ev(`window.__row = async (menu, label) => {
      __LW.layout.menu.open();
      const bar = document.getElementById('menubar');
      const btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.textContent === menu);
      if (!btn) return { found: false, why: 'no menu ' + menu };
      btn.click();
      const it = [...btn.parentElement.querySelectorAll('.mb-item')].find((i) => i.querySelector('.mb-lbl').textContent.startsWith(label));
      if (!it) { btn.click(); return { found: false, why: 'no row ' + label, rows: [...btn.parentElement.querySelectorAll('.mb-lbl')].map((l) => l.textContent) }; }
      const key = (it.querySelector('.mb-key') || {}).textContent || '', disabled = it.disabled;
      if (!disabled) it.click(); else btn.click();
      await __LW.settle();
      return { found: true, key, disabled, closed: bar.hidden, listsDown: [...bar.querySelectorAll('.mb-list')].every((l) => l.hidden),
        focus: document.activeElement === document.getElementById('title') ? 'title' : (document.activeElement || {}).tagName || '' };
    };
    window.__keyOf = (id) => __LW.keys.name(__LW.keys.actions.find((a) => a.id === id));
    return 1;`);

  /* ── 1 · every key hint is the LIVE binding, and a rebind renames the row ── */
  const hints = await g.ev(`const want = { EDIT: [['PLAY / PAUSE', 'play'], ['RESET the view', 'camReset'], ['RESEED the particles', 'reseed'], ['UNDO', 'undo'], ['REDO', 'redo'], ['HISTORY UNDO', 'historyUndo'], ['SETTINGS', 'settings']],
      VIEW: [['HIDE the interface', 'hideUI'], ['FULL SCREEN', 'fullscreen']], WINDOW: [['MODULATION', 'modWin'], ['NOTEBOOK', 'notebook'], ['HIDE / SHOW the rack', 'rack'], ['DOCK / UNDOCK', 'dock'], ['HIDE the interface', 'hideUI'], ['SHOW / HIDE help', 'notes']],
      ABOUT: [['KEYBOARD SHORTCUTS', 'keysheet'], ['SETTINGS', 'settings']], FILE: [['SAVE project AS', 'saveAs']] };
    const bad = [];
    const bar = document.getElementById('menubar');
    for (const [menu, rows] of Object.entries(want)) {
      __LW.layout.menu.open(); const btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.textContent === menu); btn.click();
      for (const [label, id] of rows) { const it = [...btn.parentElement.querySelectorAll('.mb-item')].find((i) => i.querySelector('.mb-lbl').textContent.startsWith(label));
        const k = it && it.querySelector('.mb-key') ? it.querySelector('.mb-key').textContent : null; if (k !== __keyOf(id)) bad.push([menu, label, k, __keyOf(id)]); }
      btn.click();
    }
    __LW.layout.menu.open(); { const btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.textContent === 'VIEW'); btn.click();
      const cyc = [...btn.parentElement.querySelectorAll('.mb-key')].map((k) => k.textContent).filter((t) => /cycles/.test(t));
      if (cyc.join('|') !== __keyOf('view') + ' cycles|' + __keyOf('style') + ' cycles') bad.push(['VIEW', 'cycles', cyc]); btn.click(); }
    const b = __LW.keys.bind('hideUI', { key: 'KeyU' });
    __LW.layout.menu.open(); const out = {};
    for (const menu of ['VIEW', 'WINDOW']) { const btn = [...bar.querySelectorAll('.mb-btn')].find((x) => x.textContent === menu); btn.click();
      out[menu] = [...btn.parentElement.querySelectorAll('.mb-item')].find((i) => i.querySelector('.mb-lbl').textContent.startsWith('HIDE the interface')).querySelector('.mb-key').textContent; btn.click(); }
    __LW.keys.reset(); __LW.layout.menu.close();
    return { bad, bound: b.ok, rebound: out };`);
  assert.deepEqual(hints.bad, []);
  assert.equal(hints.bound, true);
  assert.deepEqual(hints.rebound, { VIEW: 'U', WINDOW: 'U' });
  console.log('PASS every key hint in the bar is the live binding, and a rebind renames the row (VIEW and WINDOW both read U)');

  /* ── 2 · RESEED seeds the particles and leaves the camera where the hand put it ── */
  const reseed = await g.ev(`__LW.particles.setOn(false); __LW.orbit(0.9, 0.1); await __LW.settle();
    const cam0 = { yaw: __LW.obs.yaw, pitch: __LW.obs.pitch, dist: __LW.obs.dist, fov: __LW.obs.fov, quat: __LW.obs.quat.slice() };
    const r = await __row('EDIT', 'RESEED the particles');
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
  const keys = await g.ev(`const b = __LW.keys.bind('play', { key: 'KeyO' });
    const rebound = __LW.keys.actions.find((a) => a.id === 'play').key, stored = localStorage.getItem('lambdawaves.q0.keys');
    const r = await __row('EDIT', 'RESET the key bindings');
    return { ok: b.ok, rebound, stored: !!stored && /play/.test(stored), r, after: __LW.keys.actions.find((a) => a.id === 'play').key, storedAfter: localStorage.getItem('lambdawaves.q0.keys'), errors: __e.slice() };`);
  assert.equal(keys.ok, true); assert.equal(keys.rebound, 'KeyO'); assert.equal(keys.stored, true);
  assert.equal(keys.r.found, true); assert.equal(keys.r.closed, true);
  assert.equal(keys.after, 'Space'); assert.equal(keys.storedAfter, null); assert.deepEqual(keys.errors, []);
  console.log('PASS EDIT › RESET the key bindings puts PLAY back on Space and removes the stored override');

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
    const r = await __row('EDIT', 'CLEAR the register');
    sv.clearTrail = orig;
    __LW.history.flush(); await __LW.settle();
    const scrub = document.querySelector('#transport .fd'), scrubNow = scrub ? +scrub.getAttribute('aria-valuenow') : NaN;
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
    const rs = await __row('FILE', 'SAVE the experiment (quick)');
    const after = snapLS();
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => before[k] !== after[k]).sort();
    const S = __LW.serialize();
    const expSame = JSON.stringify(JSON.parse(after[LS_EXP])) === JSON.stringify(S.experiment);
    const presSame = JSON.stringify(mask(JSON.parse(after[LS_PRES]))) === JSON.stringify(mask(S.presentation));
    const digest = __LW.stateDigest();
    __LW.loadPreset('rydberg'); await __LW.settle();
    const moved = __LW.stateDigest() !== digest;
    const beforeLoad = snapLS();
    const rl = await __row('FILE', 'LOAD the last quick save');
    const loaded = __LW.stateDigest() === digest, quickKeysKept = localStorage.getItem(LS_EXP) === beforeLoad[LS_EXP] && localStorage.getItem(LS_PRES) === beforeLoad[LS_PRES];
    /* the clipboard, stubbed: a synthetic click is not a trusted gesture, and what is judged is WHAT the row copies */
    let clip = null; const cb = navigator.clipboard; const orig = cb.writeText; cb.writeText = async (t) => { clip = t; };
    const rj = await __row('FILE', 'COPY as JSON'); await new Promise((r) => setTimeout(r, 30));
    const json = clip; const jsonSame = !!json && JSON.stringify(mask(JSON.parse(json).presentation)) === JSON.stringify(mask(__LW.serialize().presentation)) && JSON.stringify(JSON.parse(json).experiment) === JSON.stringify(__LW.serialize().experiment);
    clip = null;
    const rk = await __row('FILE', 'COPY a LINK'); await new Promise((r) => setTimeout(r, 30));
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
    const st = () => document.querySelector('.dev[data-id="state"] .dev-stat').textContent;
    window.confirm = () => true;                                      // NEW project asks before discarding a dirty project
    /* EDIT */
    { __LW.pause(); const r = await __row('EDIT', 'PLAY / PAUSE'); R.play = ok(r) && __LW.clock.playing; __LW.pause(); }
    { __LW.loadPreset('1s+2pz'); const r = await __row('EDIT', 'NORMALIZE'); R.normalize = ok(r) && /‖c‖/.test(st()); }
    { __LW.orbit(0.7, 0.2); const r = await __row('EDIT', 'RESET the view'); R.view = ok(r) && Math.abs(__LW.obs.yaw - 0.65) < 1e-12 && Math.abs(__LW.obs.dist - 3.3) < 1e-12; }
    { const r = await __row('EDIT', 'UNDO HISTORY'); R.hist = ok(r) && !document.querySelector('.dev[data-id="history"]').classList.contains('closed'); }
    { const r = await __row('EDIT', 'SETTINGS'); R.settings = ok(r) && !document.querySelector('.dev[data-id="settings"]').classList.contains('closed'); }
    { __LW.api.setPopulation(0, 0.5); __LW.history.flush(); const u = await __row('EDIT', 'UNDO'); const d = __LW.history.redoDepth; const re = await __row('EDIT', 'REDO'); R.undoRedo = ok(u) && ok(re) && d >= 1 && __LW.history.redoDepth === d - 1; }
    /* VIEW */
    { const i0 = __LW.mat.invert; const r = await __row('VIEW', 'INVERT the cloud'); R.invert = ok(r) && __LW.mat.invert === !i0; __LW.setInvert(i0); }
    { const views = [['ρ = |ψ|²', 0], ['arg ψ', 1], ['Re ψ', 2], ['Im ψ', 3], ['Δρ', 4], ['Re + Im', 5]]; R.views = true;
      for (const [l, v] of views) { const r = await __row('VIEW', l); R.views = R.views && ok(r) && __LW.mat.view === v; } __LW.setView('phase'); }
    { const styles = ['CLOUD', 'SOLID', 'GRAIN', 'SIGNED', 'BANDS']; R.styles = true;
      for (const s of styles) { const r = await __row('VIEW', '— style: ' + s); R.styles = R.styles && ok(r) && __LW.mat.style === ({ CLOUD: 0, SOLID: 1, GRAIN: 2, SIGNED: 3, BANDS: 4 })[s]; } __LW.setStyle('cloud'); }
    { const c0 = document.body.classList.contains('no-captions'); const r = await __row('VIEW', 'STAGE CAPTIONS'); R.captions = ok(r) && document.body.classList.contains('no-captions') === !c0; await __row('VIEW', 'STAGE CAPTIONS'); }
    { const b0 = document.body.classList.contains('no-badges'); const r = await __row('VIEW', 'STATUS TAGS'); R.badges = ok(r) && document.body.classList.contains('no-badges') === !b0; await __row('VIEW', 'STATUS TAGS'); }
    { const h0 = document.body.classList.contains('control-hints-off'); const r = await __row('VIEW', 'CONTROL HINTS'); R.hints = ok(r) && document.body.classList.contains('control-hints-off') === !h0; await __row('VIEW', 'CONTROL HINTS'); }
    { const r = await __row('VIEW', 'HIDE the interface'); R.hideV = ok(r) && __LW.uiHidden === true; __LW.keys.toggleUI(); R.hideV = R.hideV && __LW.uiHidden === false; }
    /* WINDOW */
    { const m0 = __LW.mod.expanded; const r = await __row('WINDOW', 'MODULATION'); R.mod = ok(r) && __LW.mod.expanded === !m0; await __row('WINDOW', 'MODULATION'); R.mod = R.mod && __LW.mod.expanded === m0; }
    { const n0 = __LW.layout.notebook.isOpen; const r = await __row('WINDOW', 'NOTEBOOK'); R.nb = ok(r) && __LW.layout.notebook.isOpen === !n0 && document.activeElement === document.querySelector('.nb-text'); await __row('WINDOW', 'NOTEBOOK'); }
    { const k0 = document.body.classList.contains('rack-hidden'); const r = await __row('WINDOW', 'HIDE / SHOW the rack'); R.rack = ok(r) && document.body.classList.contains('rack-hidden') === !k0; await __row('WINDOW', 'HIDE / SHOW the rack'); }
    { const d0 = __LW.layout.docked; const r = await __row('WINDOW', 'DOCK / UNDOCK'); R.dock = ok(r) && __LW.layout.docked === !d0; await __row('WINDOW', 'DOCK / UNDOCK'); R.dock = R.dock && __LW.layout.docked === d0; }
    { const r = await __row('WINDOW', 'HIDE the interface'); R.hideW = ok(r) && __LW.uiHidden === true; __LW.keys.toggleUI(); }
    { const w0 = document.body.classList.contains('window-info-off'); const r = await __row('WINDOW', 'SHOW / HIDE help'); R.help = ok(r) && document.body.classList.contains('window-info-off') === !w0; await __row('WINDOW', 'SHOW / HIDE help'); }
    { const t0 = __LW.themeChoice; R.theme = true; for (const [l, t] of [['THEME · DARK', 'dark'], ['THEME · SYSTEM', 'system'], ['THEME · LIGHT', 'light']]) { const r = await __row('WINDOW', l); R.theme = R.theme && ok(r) && __LW.themeChoice === t; } __LW.setTheme(t0); }
    { document.querySelector('.dev[data-id="atoms"]').classList.add('closed'); const r = await __row('WINDOW', '⊕  ATOMS'); R.raise = ok(r) && !document.querySelector('.dev[data-id="atoms"]').classList.contains('closed'); document.querySelector('.dev[data-id="atoms"]').classList.add('closed'); }
    /* ABOUT */
    { const r = await __row('ABOUT', 'ABOUT λWAVES'); R.about = ok(r) && __LW.layout.notebook.isOpen && __LW.layout.notebook.face === 'about'; __LW.layout.notebook.close(); }
    { const r = await __row('ABOUT', 'KEYBOARD SHORTCUTS'); R.keymap = ok(r) && __LW.keymap.isOpen && document.getElementById('keymap').contains(document.activeElement); __LW.keymap.close(); }
    { document.querySelector('.dev[data-id="settings"]').classList.add('closed'); const r = await __row('ABOUT', 'SETTINGS'); R.settingsA = ok(r) && !document.querySelector('.dev[data-id="settings"]').classList.contains('closed'); }
    { let reloaded = 0; const rl = __LW.sw.reload; __LW.sw.reload = () => { reloaded++; }; const r = await __row('ABOUT', 'UPDATE APP'); for (let i = 0; i < 40 && !reloaded; i++) await new Promise((q) => setTimeout(q, 50)); __LW.sw.reload = rl; __LW.sw.state = 'idle'; R.update = ok(r) && reloaded === 1; }
    /* FILE (the project rows) */
    { const r = await __row('FILE', 'SAVE project AS'); R.saveAs = ok(r) && __LW.layout.notebook.face === 'projects'; __LW.layout.notebook.close(); }
    { const r = await __row('FILE', 'OPEN a project'); R.openP = ok(r) && __LW.layout.notebook.face === 'projects'; __LW.layout.notebook.close(); }
    { const r = await __row('FILE', 'SAVE project'); R.saveP = ok(r) && __LW.layout.notebook.face === 'projects'; __LW.layout.notebook.close(); }
    { const r = await __row('FILE', 'EXPORT project'); R.exportP = ok(r) && /nothing to export/.test(document.querySelector('.pj-status').textContent); }
    { const r = await __row('FILE', 'IMPORT project'); R.importP = ok(r); }
    { __LW.loadPreset('1s+2pz'); const r = await __row('FILE', 'NEW project'); R.fresh = ok(r) && __LW.reg.populated().length === 0 && __LW.layout.projects.current === null; __LW.layout.notebook.close(); }
    R.errors = __e.slice();
    return R;`);
  const want = Object.fromEntries(Object.keys(rest).filter((k) => k !== 'errors').map((k) => [k, true]));
  assert.deepEqual(Object.fromEntries(Object.entries(rest).filter(([k]) => k !== 'errors')), want);
  assert.deepEqual(rest.errors, []);
  console.log(`PASS the other ${Object.keys(want).length} row groups each do what they name and close the bar (FULL SCREEN is left out: it needs a real user activation)`);

  /* ── 7 · a row that throws still closes the bar and hands focus back ── */
  const thrower = await g.ev(`const saved = __LW.link.copy, lk = __LW.layout.modulation.toggle;
    __LW.layout.modulation.toggle = () => { throw new Error('probe: the act threw'); };
    window.addEventListener('error', (e) => { if (/probe: the act threw/.test(e.message)) e.preventDefault(); }, { once: true });
    let thrown = false;
    try { const r = await __row('WINDOW', 'MODULATION'); thrown = r; } catch (e) { thrown = String(e); }
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
