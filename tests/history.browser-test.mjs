// 0.3.1 · S3 THE TRUE HISTORY, in the real page (research/release-0.3.1/PLAN.md §4, BRIEF-S3.md, docs/STATE-SCOPES.md).
// The ring reads, keys and writes ONE record — serialize({ scope: 'edit' }) — and puts it back with restore(S, { history: true }).
// One scene per edit family, each: do the edit the way a hand does it (pointer events on the control, or the form field's own
// input/change) → exactly one new row carrying the control's name → undo() → serialize({ scope: 'edit' }) byte-identical to the
// reading before the edit → redo() → byte-identical to the reading after it.  Then what must make NO row, the bottom row's origin,
// the depth, the chrome (a PREFERENCE) left alone by an undo, and the cost budget.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { actions, relActions } from '../tools/gate/drv.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const PREFS = { 'privacy.reduceTimerPrecision': false };   // the budget is in milliseconds; Firefox's default clamp is 1 ms
let g = await open(LAB, { width: 1500, height: 1000, script: 120000, prefs: PREFS }), g2 = null;
let failed = false;
const pass = (m) => console.log('PASS ' + m);
const ev = async (body) => { const r = await g.ev(body); assert.ok(r !== undefined && r !== null && !r.E, 'page threw: ' + JSON.stringify(r)); return r; };
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 200, 100)).ok, 1);

  /* ── the page's helpers: pointer events as a hand makes them, the controls by their captions, and THE SCENE ── */
  await g.ev(`window.__w = (n) => new Promise((r) => setTimeout(r, n));
    window.__ser = () => JSON.stringify(__LW.serialize({ scope: 'edit' }));
    let pid = 700;
    const PE = (el, type, x, y, pointerId) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, isPrimary: true, clientX: x, clientY: y }));
    window.__c = (el) => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
    /** a press: down, up and the click a browser sends after them */
    window.__press = async (el) => { const id = ++pid, [x, y] = __c(el); PE(el, 'pointerdown', x, y, id); PE(el, 'pointerup', x, y, id); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })); await __w(30); };
    /** a drag held on one element (as pointer capture delivers it): n moves, gap ms apart */
    window.__drag = async (el, dx, dy, n = 6, gap = 15) => { const id = ++pid, [x, y] = __c(el); PE(el, 'pointerdown', x, y, id);
      for (let i = 1; i <= n; i++) { PE(el, 'pointermove', x + dx * i / n, y + dy * i / n, id); await __w(gap); } PE(el, 'pointerup', x + dx, y + dy, id); await __w(30); };
    /** a form field the way a picker changes it: press it, then its value lands with input + change */
    window.__field = async (el, v) => { await __press(el); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    const cap = (e, sel) => ((e.querySelector(sel) || {}).textContent || '').replace(/\\s+/g, ' ').trim();
    window.__knob = (t) => [...document.querySelectorAll('.k')].find((e) => cap(e, '.k-lbl') === t);
    window.__sw = (t) => [...document.querySelectorAll('.sw')].find((e) => cap(e, '.sw-lbl') === t);
    window.__trig = (t) => [...document.querySelectorAll('.trig')].find((e) => (cap(e, '.trig-l') || e.textContent.trim()) === t);
    /** bring a control's card onto the rack, unfolded and scrolled to, so its control has a box to press */
    window.__show = (el) => { const d = el.closest('.dev'); if (d) { d.classList.remove('closed'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); } el.scrollIntoView({ block: 'center', behavior: 'instant' }); return el; };
    window.__rows = () => __LW.history.entries().map((r) => r.label);
    /** THE SCENE: nothing pending → the edit → one row, named → undo byte-identical → redo byte-identical → no row after */
    window.__scene = async (edit) => {
      const H = __LW.history; H.flush(); await __w(450); H.flush();
      const n0 = H.entries().length, pre = __ser();
      await edit(); await __w(520); H.flush();
      const rows = H.entries(), post = __ser();
      const run = document.querySelector('#modwin .m2run'), ndev = run ? run.querySelectorAll('.m2dev').length : 0; let removed = 0;
      const mo = run ? new MutationObserver((rs) => { for (const r of rs) for (const x of r.removedNodes) if (x.classList && x.classList.contains('m2dev')) removed++; }) : null;
      if (mo) mo.observe(run, { childList: true, subtree: true });
      const t0 = performance.now(), undid = H.undo(), undoMs = performance.now() - t0, u0 = __ser();
      await __w(0); if (mo) mo.disconnect();
      await __w(300); const u = __ser();
      const redid = H.redo(), r0 = __ser(); await __w(300); const r = __ser();
      await __w(450); H.flush();
      return { added: rows.length - n0, name: rows[rows.length - 1].label, changed: pre !== post, undid, redid,
        undoSame: u0 === pre && u === pre, redoSame: r0 === post && r === post, stable: H.entries().length === rows.length,
        undoMs: +undoMs.toFixed(2), rebuilds: run ? removed / Math.max(1, ndev) : null, errs: __e.slice() };
    };
    return 1;`);
  const scene = async (label, body, name, extra) => {
    const r = await g.ev(`return await __scene(async () => { ${body} });`);
    assert.ok(r && !r.E, label + ': ' + JSON.stringify(r));
    assert.equal(r.changed, true, label + ': the edit changed nothing in the edit scope');
    assert.equal(r.added, 1, label + ': ' + r.added + ' rows, not one');
    assert.equal(r.name, name, label + ': the row is named ' + JSON.stringify(r.name));
    assert.equal(r.undid, true); assert.equal(r.undoSame, true, label + ': undo did not put the edit scope back byte for byte');
    assert.equal(r.redid, true); assert.equal(r.redoSame, true, label + ': redo did not return byte for byte');
    assert.equal(r.stable, true, label + ': a row appeared after the redo'); assert.deepEqual(r.errs, []);
    if (extra) extra(r);
    pass(`${label}: one row "${r.name}", undo and redo byte-identical (undo ${r.undoMs} ms${r.rebuilds === null ? '' : ', modulation window rebuilt ' + r.rebuilds + '×'})`);
    return r;
  };

  /* ── 1 · THE BOOT IS THE BOTTOM, and it says so ── */
  const boot = await ev(`return { rows: __rows(), depth: __LW.history.depth, cursor: __LW.history.cursor, errs: __e.slice() };`);
  assert.deepEqual(boot, { rows: ['boot'], depth: 0, cursor: 0, errs: [] });
  pass('the boot is the bottom of the stack: one row, named boot, depth 0');

  /* ── 2 · ONE SCENE PER EDIT FAMILY ── */
  const undoMs = {};
  undoMs.look = (await scene('a LOOK knob drag (twelve moves over 600 ms, longer than the quiet window)',
    `const k = __show(__knob('EXPOSURE')); await __w(80); await __drag(k.querySelector('.k-dial'), 0, -48, 12, 50);`, 'EXPOSURE · WAVE')).undoMs;
  await scene('the stage colour (its colour well)', `await __field(__show(document.querySelector('.stage-colour')), '#305070');`, 'STAGE COLOUR · SETTINGS');
  await scene('an overlay switch (KEPLER ORBIT)', `const s = __show(__sw('KEPLER ORBIT')); await __w(50); await __press(s.querySelector('button') || s);`, 'KEPLER ORBIT · ORBIT');
  undoMs.preset = (await scene('a preset (its select → loadPreset)', `await __field(__show(document.querySelector('select[aria-label="preset superposition"]')), '2p+');`, 'PRESET SUPERPOSITION · STATE')).undoMs;
  undoMs.element = (await scene('an element change (ELEMENT Z dragged)', `const k = __show(__knob('ELEMENT Z')); await __w(80); await __drag(k.querySelector('.k-dial'), 0, -30);`, 'ELEMENT Z · SPECTRUM')).undoMs;
  await scene('A/B · STORE A', `await __press(__show(__trig('STORE A')));`, 'STORE A · STATE');
  await g.ev(`await __field(document.querySelector('select[aria-label="preset superposition"]'), '1s+2pz'); await __w(500); __LW.history.flush(); return 1;`);
  await scene('A/B · STORE B', `await __press(__show(__trig('STORE B')));`, 'STORE B · STATE');
  await scene('A/B · the transition on', `const s = __show(__sw('TRANSITION')); await __press(s.querySelector('button') || s);`, 'TRANSITION · STATE');
  await g.ev(`const s = __sw('TRANSITION'); await __press(s.querySelector('button') || s); await __w(500); __LW.history.flush(); return 1;`);   /* stood down again: the scenes below need a still register */
  await scene('a palette choice (its select)', `const s = __show(document.querySelector('select[aria-label="palette"]')); await __field(s, [...s.options].map((o) => o.value).find((v) => v !== s.value));`, 'PALETTE');
  undoMs.palette = (await scene('a custom palette stop (its colour well)', `await __field(__show(document.querySelector('.dev[data-id="palette"] input.pal-color')), '#a04020');`, 'COLOUR · PALETTE')).undoMs;

  /* THE CHEM / MOLECULE OWNER SWITCH IS NOT A SCENE (BRIEF-S3 allows stating why): MOLECULES ON lands its solution asynchronously and
     the instrument then fills derived defaults (chem.orbital null → 5, the MO-REGISTRY default selection, the STATES ground lane,
     research/release-0.3.1/probes/S3/), so the press commits one row at its release and the fill arrives ~150 ms later with no note:
     it rides into the next row.  One row per switch needs a settle signal from the molecular session — recorded for a later stage. */

  /* the modulation window: a source added through its own menu, a dial moved, a route dragged from a macro's grip onto a knob */
  await g.ev(`__LW.layout.modulation.expand(); await __w(400); return 1;`);
  const modAdd = await scene('modulation · ADD DEVICE → ADD LFO (the window\'s own menu)', `await __press(document.querySelector('#modwin .m2devadd')); await __w(150);
      await __press([...document.querySelectorAll('#modwin button')].find((b) => b.textContent.trim() === 'ADD LFO'));`, 'ADD LFO · MODULATION',
    (r) => assert.equal(r.rebuilds, 1, 'undoing a modulation edit rebuilt the window ' + r.rebuilds + '×'));
  undoMs.modulation = (await scene('modulation · an LFO dial dragged (RATE)', `await __drag(document.querySelector('#modwin .m2dev.lfo .m2kd'), 0, -30);`, 'LFO RATE · MODULATION')).undoMs;
  /* the drop is hit-tested (elementFromPoint), so the target is the first routable dial whose centre is not under the window */
  await g.ev(`window.__drop = () => { for (const k of [__knob('EXPOSURE'), ...document.querySelectorAll('.dev .k[data-param]')]) { if (!k || !k.dataset.param) continue; __show(k);
      for (const block of ['center', 'start', 'end']) { k.scrollIntoView({ block, behavior: 'instant' }); const [x, y] = __c(k.querySelector('.k-dial')), h = document.elementFromPoint(x, y); if (h && k.contains(h)) return k; } } return null; }; return 1;`);
  await scene('modulation · a route dragged from MACRO 1\'s grip onto a dial', `const grip = document.querySelector('#modwin .m2slot .m2grip'), k = __drop(); window.__target = k && k.dataset.param;
      const [gx, gy] = __c(grip), [kx, ky] = __c(k.querySelector('.k-dial')); await __drag(grip, kx - gx, ky - gy, 8);`, 'ROUTE MACRO 1 · MODULATION',
    (r) => assert.equal(r.rebuilds, 1));
  const routed = await ev(`return { routes: __LW.mod.model.routeList().map((r) => r.targetId), target: window.__target };`);
  assert.deepEqual(routed.routes, [routed.target]);
  const nonMod = await scene('an edit outside the modulation undone with the window open (the rack is not reloaded)', `await __field(document.querySelector('.stage-colour'), '#506070');`, 'STAGE COLOUR · SETTINGS',
    (r) => assert.equal(r.rebuilds, 0, 'an unchanged modulation rack was rebuilt by the undo'));
  const viaApi = await ev(`return await __scene(async () => { __LW.mod.addSource('env'); });`);
  assert.equal(viaApi.added, 1); assert.equal(viaApi.undoSame, true); assert.equal(viaApi.redoSame, true);
  pass('modulation · LW.mod.addSource (the debug road) is a row too, and undoes byte for byte');

  /* ── 3 · THE MODULATION PLAYS THROUGH AN UNDO: an unchanged rack is not reloaded, so the transport keeps running and the LFO keeps its phase ── */
  const plays = await ev(`const H = __LW.history, M = __LW.mod.model, lfo = M.sourceList().find((s) => s.kind === 'lfo');
    __LW.mod.bind(M.macroList()[0].id, lfo.id); H.flush(); __LW.play(); await __w(800);
    const before = { playing: __LW.mod.playing, v: M.macroList()[0].value };
    __LW.setStyle(__LW.mat.style === 1 ? 'cloud' : 'solid'); H.note(); H.flush(); H.undo(); const after = { playing: __LW.mod.playing, v: M.macroList()[0].value };
    await __w(600); const later = { playing: __LW.mod.playing, v: M.macroList()[0].value };
    /* …and an undo that DOES reload the rack (a modulation edit) is re-followed by LINKED time on the next frame */
    __LW.mod.addSource('lfo'); H.flush(); H.undo(); await __w(300); const relinked = { playing: __LW.mod.playing, field: __LW.clock.playing };
    __LW.pause(); await __w(300); H.flush(); return { before, after, later, relinked, errs: __e.slice() };`);
  assert.equal(plays.before.playing, true); assert.equal(plays.after.playing, true, 'the undo stopped the modulation transport');
  assert.ok(Math.abs(plays.after.v - plays.before.v) < 0.2, 'the undo reset the LFO: ' + JSON.stringify(plays));
  assert.equal(plays.later.playing, true); assert.notEqual(plays.later.v, plays.after.v, 'the LFO stopped moving after the undo');
  assert.deepEqual(plays.relinked, { playing: true, field: true }, 'an undo that reloaded the rack left the modulation stopped under a playing field');
  assert.deepEqual(plays.errs, []);
  pass('the modulation plays through an undo: an unchanged rack is not reloaded (transport running, LFO continuous); an undo that reloads it is re-followed by LINKED time');

  /* ── 3b · A ROUTE UNDONE WHILE IT PLAYS (the S2 follow-up's question for this road): the STAGE routed to the playing LFO, then the
         route undone — the stage is its hand value again, exactly, not the modulator's last output; redo routes it again on the same
         base; the hand on the routed STAGE knob moves the base, and its undo puts that base back.  No stand-down is needed: an undo's
         bases come from its own record (restore → histBases), so restoreAll can only write the record's base back. ── */
  const held = await ev(`const H = __LW.history, M = __LW.mod.model, R = __LW.mod.registry, live = () => __LW.serialize().presentation.ui.stage.mix;
    __LW.setStage(0.3); H.flush(); __LW.play(); await __w(300);
    __LW.mod.route(M.macroList()[0].id, 'material.stage', 0, 1); H.flush(); await __w(500);
    const routed = { live: live(), base: R.baseOf('material.stage'), modulated: R.isModulated('material.stage') };
    H.undo(); await __w(250); const undone = { live: live(), base: R.baseOf('material.stage'), modulated: R.isModulated('material.stage'), playing: __LW.mod.playing };
    H.redo(); await __w(400); const redone = { live: live(), base: R.baseOf('material.stage'), modulated: R.isModulated('material.stage'), playing: __LW.mod.playing };
    const k = __show(__knob('STAGE')); await __w(80);
    const hand = await __scene(async () => { await __drag(k.querySelector('.k-dial'), 0, -40); });
    const baseAfter = R.baseOf('material.stage');
    __LW.pause(); await __w(200); return { routed, undone, redone, hand, baseAfter, errs: __e.slice() };`);
  assert.equal(held.routed.modulated, true); assert.equal(held.routed.base, 0.3); assert.notEqual(held.routed.live, 0.3, 'the route did not move the stage');
  assert.deepEqual(held.undone, { live: 0.3, base: 0.3, modulated: false, playing: true }, 'the undone route left the stage off its hand value');
  assert.equal(held.redone.modulated, true); assert.equal(held.redone.base, 0.3); assert.equal(held.redone.playing, true);
  assert.equal(held.hand.added, 1); assert.equal(held.hand.name, 'STAGE · SETTINGS'); assert.equal(held.hand.undoSame, true); assert.equal(held.hand.redoSame, true);
  assert.equal(held.hand.rebuilds, 0); assert.notEqual(held.baseAfter, 0.3, 'the hand did not move the routed base'); assert.deepEqual(held.errs, []);
  pass(`a route undone while it plays: the stage returns to its hand value 0.3 exactly (it read ${held.routed.live.toFixed(3)} under the LFO), redo routes it again on base 0.3, and the hand on the routed STAGE knob (base → ${held.baseAfter.toFixed(3)}) undoes to its base with no rebuild`);

  /* ── 4 · WHAT MAKES NO ROW: a view, the arrangement, the notebook, the device's quality, the window's visibility, play ── */
  /* real pointers (WebDriver input, real pointer ids) for the three drags whose handlers capture the pointer */
  let realN = 0;
  const realDrag = async ([x, y], dx, dy, n = 8) => {
    const a = [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }, { type: 'pointerDown', button: 0 }];
    for (let i = 1; i <= n; i++) a.push({ type: 'pointerMove', duration: 30, origin: 'viewport', x: Math.round(x + dx * i / n), y: Math.round(y + dy * i / n) });
    a.push({ type: 'pointerUp', button: 0 });
    await actions(g.s, [{ type: 'pointer', id: 'hp' + (++realN), parameters: { pointerType: 'mouse' }, actions: a }]); await relActions(g.s);
  };
  /** the centre of el if it is the topmost thing there, else the first point of the canvas nothing covers */
  const at = (sel) => ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return { E: 'no ' + ${JSON.stringify(sel)} };
    if (e.id === 'field') { for (let y = 120; y < innerHeight - 60; y += 40) for (let x = 200; x < innerWidth - 200; x += 40) if (document.elementFromPoint(x, y) === e) return [x, y]; return { E: 'the canvas is covered' }; }
    e.scrollIntoView({ block: 'center', behavior: 'instant' }); const b = e.getBoundingClientRect();
    for (const [u, v] of [[0.5, 0.5], [0.3, 0.3], [0.25, 0.5], [0.5, 0.25], [0.7, 0.7]]) { const x = b.left + b.width * u, y = b.top + b.height * v, h = document.elementFromPoint(x, y); if (h && e.contains(h)) return [x, y]; }
    return { E: ${JSON.stringify(sel)} + ' is covered' };`);
  const rows = () => ev(`const H = __LW.history; await __w(520); H.flush(); return H.entries().length;`);
  const none = {};
  let n = await ev(`const H = __LW.history; H.flush(); await __w(450); H.flush(); __LW.layout.modulation.collapse(); __LW.camera.setAutoRotate(false); window.__yaw0 = __LW.obs.yaw; return H.entries().length;`);
  await realDrag(await at('#field'), 150, 30);
  none.orbit = { rows: (await rows()) - n, moved: await ev(`__LW.camera.stop(); return __LW.obs.yaw !== window.__yaw0;`) }; n += none.orbit.rows;
  await realDrag(await at('.dev[data-id="state"] .dev-eyebrow'), -80, 60, 6);
  none.windowDrag = { rows: (await rows()) - n }; n += none.windowDrag.rows;
  await ev(`__LW.layout.notebook.open('notes'); await __w(150); const ta = document.querySelector('.nb-text'); ta.focus();
    for (const ch of 'a note') { ta.value += ch; ta.dispatchEvent(new Event('input', { bubbles: true })); await __w(20); } return 1;`);
  none.notebook = { rows: (await rows()) - n, text: await ev(`return __LW.notebook.text;`) }; n += none.notebook.rows;
  await realDrag(await at('#notebook .nb-grip'), 40, 30, 4);
  none.nbResize = { rows: (await rows()) - n }; n += none.nbResize.rows;
  Object.assign(none, await ev(`const H = __LW.history, r = {}, count = () => H.entries().length; __LW.layout.notebook.close(); let n = count();
    const grid = __show(document.querySelector('.dev[data-id="settings"]')); const b = [...grid.querySelectorAll('.seg-b')].find((x) => x.textContent.trim() === '96³' && x.closest('.segw')?.querySelector('.k-lbl')?.textContent.trim() === 'GRID');
    await __press(b); await __w(520); H.flush(); r.grid = { rows: count() - n, res: __LW.quality.res }; n = count();
    __LW.layout.modulation.toggle(); await __w(300); __LW.layout.modulation.toggle(); await __w(300); await __press(document.querySelector('.mod-logo')); await __w(300); await __press(document.querySelector('.mod-logo')); await __w(520); H.flush();
    r.modToggle = { rows: count() - n }; n = count();
    __LW.play(); await __w(5000); __LW.pause(); await __w(520); H.flush();
    r.play = { rows: count() - n }; n = count();
    r.errs = __e.slice(); return r;`));
  assert.equal(none.orbit.moved, true, 'the orbit drag did not move the camera'); assert.equal(none.orbit.rows, 0, 'a camera orbit made a row');
  assert.equal(none.windowDrag.rows, 0, 'a window drag made a row');
  assert.equal(none.notebook.rows, 0, 'typing in the notebook made a row'); assert.match(none.notebook.text, /a note$/);
  assert.equal(none.nbResize.rows, 0, 'a notebook resize made a row');
  assert.equal(none.grid.rows, 0, 'a GRID change made a row'); assert.equal(none.grid.res, 96);
  assert.equal(none.modToggle.rows, 0, 'toggling the modulation window made a row');
  assert.equal(none.play.rows, 0, '5 s of play made a row'); assert.deepEqual(none.errs, []);
  pass('no row from a camera orbit, a window drag, typing in the notebook, a notebook resize, a GRID change, toggling the modulation window, or 5 s of play');

  /* ── 5 · THE CHROME LEAVES THE RING: frame / axis / their modes / corner / invert / axis colour are the reader's (S1, D1) ── */
  const chrome = await ev(`const H = __LW.history, M = __LW.mat, K = ['frame', 'axis', 'frameMode', 'axisMode', 'cornerSide', 'invert', 'axisInk'];
    const read = () => JSON.stringify(K.map((k) => M[k]));
    H.flush(); __LW.setStage(0.12); H.flush();
    Object.assign(M, { frame: !M.frame, axis: !M.axis, frameMode: 'corner', axisMode: 'corner', cornerSide: 'left', invert: !M.invert, axisInk: 'accent' });
    const set = read(); const ok = H.undo(); const after = read(); H.redo(); const afterRedo = read();
    return { ok, same: set === after && set === afterRedo, set, after, errs: __e.slice() };`);
  assert.equal(chrome.ok, true); assert.equal(chrome.same, true, 'an undo moved the field chrome: ' + chrome.set + ' → ' + chrome.after); assert.deepEqual(chrome.errs, []);
  pass('the chrome leaves the ring: after an undo and a redo, frame / axis / frameMode / axisMode / cornerSide / invert / axisInk are exactly what they were');

  /* ── 6 · THE DEPTH: 61 distinct edits → 60 undos, the oldest fell off; HISTORY UNDO after a jump ── */
  const depth = await ev(`const H = __LW.history; H.clear(); const first = __ser();
    for (let i = 1; i <= 61; i++) { __LW.setStage(i / 100); H.flush(); }
    const top = { depth: H.depth, rows: H.entries().length, limit: H.limit, bottom: H.entries()[0].label };
    let undos = 0; while (H.undo()) undos++;
    const bottomMix = __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix, fellOff = __ser() !== first;
    while (H.redo()); const back = __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix;
    const jumped = H.goto(10); const atTen = __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix; __LW.setStage(0.99); H.flush();
    const rowsAfterEdit = H.entries().length, can = H.canHistoryUndo, ret = H.historyUndo(), mixRet = __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix;
    return { top, undos, bottomMix, fellOff, back, jumped, atTen, rowsAfterEdit, can, ret, mixRet, rowsRet: H.entries().length, errs: __e.slice() };`);
  assert.deepEqual(depth.top, { depth: 60, rows: 61, limit: 60, bottom: 'edit' }, JSON.stringify(depth.top));
  assert.equal(depth.undos, 60); assert.equal(depth.bottomMix, 0.01, 'the oldest reachable state is the first edit, the start fell off'); assert.equal(depth.fellOff, true);
  assert.equal(depth.back, 0.61);
  assert.equal(depth.jumped, true); assert.equal(depth.atTen, 0.11); assert.equal(depth.rowsAfterEdit, 12); assert.equal(depth.can, true);
  assert.equal(depth.ret, true); assert.equal(depth.mixRet, 0.61); assert.equal(depth.rowsRet, 61); assert.deepEqual(depth.errs, []);
  pass('the depth: 61 distinct edits leave 60 undos and the start fell off the bottom; goto(10) then an edit truncates, and HISTORY UNDO restores the whole 61-row timeline at its head');

  /* ── 7 · THE COST: flush after an edit, canUndo, zero rows and zero edit-scope reads while playing, snapshot bytes ── */
  const cost = await ev(`const H = __LW.history, med = (a) => a.sort((x, y) => x - y)[a.length >> 1];
    const flush = [], can = [];
    for (let i = 0; i < 15; i++) { __LW.setStage(0.2 + i / 100); const t0 = performance.now(); H.flush(); flush.push(performance.now() - t0); }
    for (let i = 0; i < 15; i++) { H.clear(); __LW.setStage(0.5 + i / 100); const t1 = performance.now(); void H.canUndo; can.push(performance.now() - t1); }   /* at the bottom with an edit pending: canUndo hashes the edit scope */
    H.clear();
    /* the edit scope is read through the instruments' save(): count its calls while the field plays */
    H.flush(); await __w(450); const n0 = H.entries().length;
    let reads = 0; const s0 = __LW.chem.save; __LW.chem.save = function () { reads++; return s0.apply(this, arguments); };
    __LW.play(); await __w(5000); __LW.pause(); __LW.chem.save = s0; await __w(100);
    return { flushMs: +med(flush).toFixed(3), flushMax: +Math.max(...flush).toFixed(3), canMs: +med(can).toFixed(3), playReads: reads, playRows: H.entries().length - n0,
      bytes: __ser().length, errs: __e.slice() };`);
  assert.ok(cost.flushMs < 2, 'one flush after an edit took ' + cost.flushMs + ' ms (median of 15)');
  assert.equal(cost.playRows, 0); assert.equal(cost.playReads, 0, 'the edit scope was read ' + cost.playReads + '× during 5 s of play: liveKey ran per frame');
  assert.deepEqual(cost.errs, []);
  pass(`the cost: a flush after an edit ${cost.flushMs} ms median (max ${cost.flushMax}), canUndo with an edit pending (one liveKey) ${cost.canMs} ms; 5 s of play read the edit scope 0× and made 0 rows; ${cost.bytes} bytes per row here`);

  /* ── 8 · THE ORIGIN IS THE BOTTOM ROW'S NAME: a link, a project open, NEW ── */
  const origins = await ev(`const P = __LW.layout.projects, c0 = window.confirm; window.confirm = () => true;
    const href = __LW.link.mint().href; __LW.setStage(0.3); __LW.history.flush();
    const link = __LW.link.open(href); const afterLink = { rows: __rows(), depth: __LW.history.depth };
    const r = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); const path = P.importText(await r.text());
    __LW.setStage(0.4); __LW.history.flush(); const t0 = performance.now(); P.open(path); const openMs = performance.now() - t0;
    const afterOpen = { rows: __rows(), depth: __LW.history.depth }; await __w(1500); const openLater = { rows: __rows(), depth: __LW.history.depth };
    const demoBytes = __ser().length;
    /* the demo's undo latency, the modulation window open */
    __LW.layout.modulation.expand(); await __w(300);
    const u = await __scene(async () => { __LW.setStyle(__LW.mat.style === 1 ? 'cloud' : 'solid'); __LW.history.note(); });
    __LW.setStage(0.5); __LW.history.flush(); const fresh = await P.fresh(); const afterNew = { rows: __rows(), depth: __LW.history.depth }; await __w(1500); const newLater = { rows: __rows(), depth: __LW.history.depth };
    window.confirm = c0;
    return { link: link.opened && link.ok, afterLink, openMs, afterOpen, openLater, demoBytes, demoUndo: u, fresh, afterNew, newLater, errs: __e.slice() };`);
  assert.equal(origins.link, true); assert.deepEqual(origins.afterLink, { rows: ['link'], depth: 0 });
  assert.deepEqual(origins.afterOpen, { rows: ['open · WAVE DANCER'], depth: 0 }); assert.deepEqual(origins.openLater, { rows: ['open · WAVE DANCER'], depth: 0 }, 'a row appeared after the demo opened');
  assert.equal(origins.demoUndo.added, 1); assert.equal(origins.demoUndo.undoSame, true); assert.equal(origins.demoUndo.redoSame, true); assert.equal(origins.demoUndo.rebuilds, 0);
  assert.equal(origins.fresh, true); assert.deepEqual(origins.afterNew, { rows: ['new project'], depth: 0 }); assert.deepEqual(origins.newLater, { rows: ['new project'], depth: 0 }, 'a row appeared after NEW');
  assert.deepEqual(origins.errs, []);
  undoMs.demo = origins.demoUndo.undoMs;
  pass(`the origin names the bottom row: a link → [link], WAVE DANCER → [open · WAVE DANCER], NEW → [new project], each depth 0 and still depth 0 1.5 s later; the demo undoes byte for byte in ${origins.demoUndo.undoMs} ms with no rebuild; ${origins.demoBytes} bytes per demo row`);

  const worst = Math.max(...Object.values(undoMs));
  assert.ok(worst < 150, 'an undo took ' + worst + ' ms: ' + JSON.stringify(undoMs));
  pass('undo latency (ms, one restore each): ' + JSON.stringify(undoMs));
  await g.close(); g = null;

  /* ── 9 · A LINK AT BOOT names the bottom row too ── */
  g2 = await open(LAB, { width: 1300, height: 900, script: 60000, prefs: PREFS });
  assert.equal((await g2.waitFor('window.__LW&&__LW.ready', 200, 100)).ok, 1);
  const href = await g2.ev(`__LW.mat.exposure = 2.5; return __LW.link.mint().href;`);
  await g2.close(); g2 = null;
  g2 = await open(href, { width: 1300, height: 900, script: 60000, prefs: PREFS });
  assert.equal((await g2.waitFor('window.__LW&&__LW.ready', 200, 100)).ok, 1);
  const bootLink = await g2.ev(`return { rows: __LW.history.entries().map((r) => r.label), depth: __LW.history.depth, carried: Math.abs(__LW.mat.exposure - 2.5) < 1e-3, errs: __e.slice() };`);
  assert.deepEqual(bootLink, { rows: ['link'], depth: 0, carried: true, errs: [] });
  pass('a link opened at boot names the bottom row link (not boot)');
} catch (e) {
  failed = true; console.error(e);
} finally {
  try { await Promise.race([Promise.all([g && g.close(), g2 && g2.close()]), new Promise((_, reject) => setTimeout(() => reject(new Error('driver cleanup exceeded 10 seconds')), 10000))]); }
  catch (error) { failed = true; console.error('INFRASTRUCTURE:', error.message); }
  process.exit(failed ? 1 : 0);
}
