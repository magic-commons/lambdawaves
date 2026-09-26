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
    window.__frame = () => new Promise((r) => requestAnimationFrame(() => r()));   /* S4: the HISTORY card repaints on the next frame */
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
    /** THE SCENE: nothing pending → the edit → one row, named → undo byte-identical → redo byte-identical → no row after.
     *  S4: split in two (__open / __close) so a REAL gesture from the driver can sit between the halves */
    window.__scene = async (edit) => { await __open(); await edit(); return __close(); };
    window.__open = async () => { const H = __LW.history; H.flush(); await __w(450); H.flush(); __room(); window.__s0 = { n0: H.entries().length, pre: __ser() }; };
    /** S4: rows are COUNTED, and a full ring (61 rows) drops its oldest as it gains one, which would read as no row at all — so a
     *  count starts with room in the ring (a clear moves no state) */
    window.__room = () => { if (__LW.history.entries().length > 40) __LW.history.clear(); };
    window.__close = async () => {
      const H = __LW.history, { n0, pre } = window.__s0;
      await __w(520); H.flush();
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
  const scene = async (label, body, name, extra) => judgeScene(label, await g.ev(`return await __scene(async () => { ${body} });`), name, extra);
  const judgeScene = (label, r, name, extra) => {
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

  /** S4 · a REAL right-button drag (WebDriver input, button 2): n moves, a 700 ms rest (longer than the quiet window: the S3
   *  verifier's two-row case), one more move, up */
  let rN = 0;
  const realRDrag = async ([x, y], dx, dy, n = 8) => {
    const a = [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }, { type: 'pointerDown', button: 2 }];
    for (let i = 1; i <= n; i++) a.push({ type: 'pointerMove', duration: 40, origin: 'viewport', x: Math.round(x + dx * i / n), y: Math.round(y + dy * i / n) });
    a.push({ type: 'pause', duration: 700 }, { type: 'pointerMove', duration: 40, origin: 'viewport', x: Math.round(x + dx * 1.25), y: Math.round(y + dy * 1.25) }, { type: 'pointerUp', button: 2 });
    await actions(g.s, [{ type: 'pointer', id: 'rd' + (++rN), parameters: { pointerType: 'mouse' }, actions: a }]); await relActions(g.s);
  };
  /** a REAL Shift-right-click: Shift held across the press (a key source ticking beside the pointer) */
  const realShiftRClick = async ([x, y]) => {
    const p = [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }, { type: 'pointerDown', button: 2 }, { type: 'pointerUp', button: 2 }, { type: 'pause', duration: 0 }];
    const k = [{ type: 'keyDown', value: '\uE008' }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'keyUp', value: '\uE008' }];
    await actions(g.s, [{ type: 'key', id: 'sk' + (++rN), actions: k }, { type: 'pointer', id: 'rc' + rN, parameters: { pointerType: 'mouse' }, actions: p }]); await relActions(g.s);
  };
  /** a REAL key press (the dispatcher ignores synthetic keys), with the focus off any control first */
  const realKey = async (value, mods = [], gg = g) => {
    await gg.ev(`if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); return 1;`);
    const a = [...mods.map((m) => ({ type: 'keyDown', value: m })), { type: 'keyDown', value }, { type: 'pause', duration: 30 }, { type: 'keyUp', value }, ...mods.map((m) => ({ type: 'keyUp', value: m }))];
    await actions(gg.s, [{ type: 'key', id: 'k' + (++rN), actions: a }]); await relActions(gg.s);
  };
  const CTRL = '\uE009', SHIFT = '\uE008';
  /** a REAL left click at a point, on any session */
  const realClick = async ([x, y], gg = g) => {
    await actions(gg.s, [{ type: 'pointer', id: 'c' + (++rN), parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }] }]); await relActions(gg.s);
  };

  /* ── 1 · THE BOOT IS THE BOTTOM, and it says so ── */
  const boot = await ev(`return { rows: __rows(), depth: __LW.history.depth, cursor: __LW.history.cursor, errs: __e.slice() };`);
  assert.deepEqual(boot, { rows: ['boot'], depth: 0, cursor: 0, errs: [] });
  pass('the boot is the bottom of the stack: one row, named boot, depth 0');

  /* ── 1b · S4 THE HISTORY CARD LISTS EVERY ROW: 25 distinct edits → 25 rows + the bottom (boot), newest at the top, one row
         aria-current and in view, a click on row k lands on the reading taken when row k was made, the list scrolls inside the
         card, and the card stops growing (its height with 13 rows = with 26) ── */
  const card = await ev(`const H = __LW.history, list = __show(document.querySelector('.dev[data-id="history"] .hist-list')), dev = list.closest('.dev');
    await __w(100); const readings = [__ser()]; let h12 = 0;
    for (let i = 1; i <= 25; i++) { __LW.setStage(0.2 + i / 100); H.flush(); readings.push(__ser()); if (i === 12) { await __frame(); h12 = dev.getBoundingClientRect().height; } }
    await __frame();
    const rowEls = () => [...list.querySelectorAll('.hist-row')], idx = (b) => +b.querySelector('.hist-i').textContent;
    const cur = () => rowEls().filter((b) => b.getAttribute('aria-current') === 'true');
    const inView = (b) => { const L = list.getBoundingClientRect(), R = b.getBoundingClientRect(); return R.top >= L.top - 0.5 && R.bottom <= L.bottom + 0.5; };
    const rows = rowEls();
    const top = { n: rows.length, order: rows.map(idx).join(','), bottom: rows.at(-1).querySelector('.hist-lbl').textContent,
      current: cur().map(idx), currentShown: inView(cur()[0]), scrolls: list.scrollHeight > list.clientHeight, h12, h25: dev.getBoundingClientRect().height, listH: list.clientHeight };
    /* a hand's click: scroll the list to the row, press it */
    const click = async (k) => { const b = rowEls().find((x) => idx(x) === k); list.scrollTop += b.getBoundingClientRect().top - list.getBoundingClientRect().top; await __press(b); await __frame();
      return { k, lands: __ser() === readings[k], cursor: H.cursor, current: cur().map(idx), shown: inView(cur()[0]) }; };
    const clicks = [await click(3), await click(17), await click(0)];
    /* the current row is KEPT in view: the list scrolled away from it, then a jump by the API */
    const kept = []; for (const [k, st] of [[1, 0], [25, 1e6], [2, 0]]) { list.scrollTop = st; H.goto(k); await __frame(); kept.push({ k, lands: __ser() === readings[k], current: cur().map(idx), shown: inView(cur()[0]) }); }
    /* every row's tooltip is its WHOLE name (the lab's CONTROL HINTS move a title into data-help and show it on hover) */
    const titled = rowEls().every((b) => (b.dataset.help || b.title).startsWith(b.querySelector('.hist-lbl').textContent + ' — '));
    /* a jump made while the card is CLOSED is in view when the card opens again (window-activity's flip) */
    list.scrollTop = 0; dev.classList.add('closed'); await __frame(); H.goto(1); await __frame(); await __w(50);
    __LW.layout.reopen('history'); await __frame(); await __frame(); await __w(150);
    const reopened = { current: cur().map(idx), shown: inView(cur()[0]), closed: dev.classList.contains('closed') };
    H.goto(25); await __w(450); H.flush();
    return { top, clicks, kept, titled, reopened, rows: rowEls().length, back: __ser() === readings[25], errs: __e.slice() };`);
  assert.equal(card.top.n, 26, '25 edits + the bottom, not ' + card.top.n + ' rows');
  assert.equal(card.top.order, Array.from({ length: 26 }, (_, i) => 25 - i).join(','), 'not newest at the top: ' + card.top.order);
  assert.equal(card.top.bottom, 'boot'); assert.deepEqual(card.top.current, [25]); assert.equal(card.top.currentShown, true);
  assert.equal(card.top.scrolls, true, 'the list does not scroll'); assert.equal(card.top.h25, card.top.h12, 'the card grew from ' + card.top.h12 + ' to ' + card.top.h25 + ' px');
  assert.ok(card.top.listH <= 250.5, 'the list is ' + card.top.listH + ' px tall');
  for (const c of [...card.clicks, ...card.kept]) { assert.equal(c.lands, true, 'row ' + c.k + ' did not land on its reading'); assert.deepEqual(c.current, [c.k]); assert.equal(c.shown, true, 'row ' + c.k + ' is current but out of view'); }
  assert.equal(card.titled, true, 'a row without its whole name as its tooltip');
  assert.deepEqual(card.reopened, { current: [1], shown: true, closed: false }, 'a jump made while the card was closed: ' + JSON.stringify(card.reopened));
  assert.equal(card.rows, 26); assert.equal(card.back, true); assert.deepEqual(card.errs, []);
  pass(`the HISTORY card lists every row: 25 edits → 26 rows newest first with boot at the bottom, one aria-current row in view; clicks on rows 3, 17 and boot land on their readings; jumps by the API keep the current row in view, and one made while the card was closed is in view when it reopens; every row's tooltip is its whole name; the list scrolls (${card.top.listH} px) and the card holds ${card.top.h25} px from 13 rows to 26`);

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
  /* S4 · a REAL right-drag on LFO 1's curve (MIR: right-drag on empty space adds a point and places it).  The capture holds button 2
     like button 0, so the drag is ONE row even with a rest longer than the quiet window in it, named for the curve and its window */
  /* EMPTY curve space (a right press there adds a point; on a point or a tension handle it does something else): the uncovered spot
     of LFO 1's editor farthest from every drawn point and handle */
  await g.ev(`window.__empty = () => { const svg = document.querySelector('#modwin .m2dev.lfo .m2svg'), b = svg.getBoundingClientRect();
      const marks = [...svg.querySelectorAll('.m2pt, .m2tn, .m2playdot')].map((e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      let best = null, far = 0;
      for (let u = 0.12; u <= 0.88; u += 0.04) for (let v = 0.15; v <= 0.85; v += 0.05) { const x = b.left + b.width * u, y = b.top + b.height * v, h = document.elementFromPoint(x, y);
        if (!h || !svg.contains(h)) continue; const d = Math.min(...marks.map(([mx, my]) => Math.hypot(mx - x, my - y))); if (d > far) { far = d; best = [x, y]; } }
      return far >= 24 ? best : { E: 'no empty curve space (' + far.toFixed(1) + ' px)' }; }; return 1;`);
  const curveAt = await ev(`return __empty();`);
  await ev(`const pts0 = (__LW.mod.model.sourceList().find((s) => s.kind === 'lfo').points || []).length; await __open(); window.__pts0 = pts0; return 1;`);
  await realRDrag(curveAt, 30, 20);
  const curve = judgeScene('modulation · a right-drag on LFO 1\'s curve (real input, button 2, a 700 ms rest mid-drag)', await g.ev(`const r = await __close(); r.pts = [window.__pts0, (__LW.mod.model.sourceList().find((s) => s.kind === 'lfo').points || []).length]; return r;`), 'CURVE · LFO 1 · MODULATION');
  assert.equal(curve.pts[1], curve.pts[0] + 1, 'the right-drag did not add a point: ' + JSON.stringify(curve.pts));
  /* …and a Shift-right-click (adds at the curve's own value): one row, named — it was one unnamed row */
  const shiftAt = await ev(`return __empty();`);
  await ev(`window.__pts0 = (__LW.mod.model.sourceList().find((s) => s.kind === 'lfo').points || []).length; await __open(); return 1;`);
  await realShiftRClick(shiftAt);
  const shiftClick = judgeScene('modulation · a Shift-right-click on LFO 1\'s curve (real input)', await g.ev(`const r = await __close(); r.pts = [window.__pts0, (__LW.mod.model.sourceList().find((s) => s.kind === 'lfo').points || []).length]; return r;`), 'CURVE · LFO 1 · MODULATION');
  assert.equal(shiftClick.pts[1], shiftClick.pts[0] + 1, 'the Shift-right-click did not add a point: ' + JSON.stringify(shiftClick.pts));
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

  /* ── 3c · S4 A GESTURE THAT CHANGED NOTHING TAKES ITS NAME WITH IT: a press on THEME (a PREFERENCE, no row), then a preset
         through the API (as a keyboard road would load one) — that row is 'edit', not the theme's name ── */
  const stale = await ev(`const H = __LW.history; H.flush(); await __w(450); H.flush(); const n0 = H.entries().length, was = __LW.themeChoice;
    const seg = (word) => [...document.querySelectorAll('.seg-b')].find((x) => x.textContent.trim() === word && x.closest('.segw')?.querySelector('.k-lbl')?.textContent.trim() === 'THEME');
    const pre = __ser(); await __press(__show(seg(was === 'dark' ? 'LIGHT' : 'DARK'))); await __w(520); H.flush();
    const theme = { rows: H.entries().length - n0, moved: __LW.themeChoice !== was, scope: __ser() === pre };
    __LW.loadPreset('2p+'); await __w(520); H.flush();
    const preset = { rows: H.entries().length - n0, name: H.entries().at(-1).label };
    await __press(seg(was.toUpperCase())); await __w(520); H.flush();   /* the reader's theme back */
    return { theme, preset, back: __LW.themeChoice === was, rowsAfter: H.entries().length - n0, errs: __e.slice() };`);
  assert.deepEqual(stale.theme, { rows: 0, moved: true, scope: true }, 'the THEME press: ' + JSON.stringify(stale.theme));
  assert.equal(stale.preset.rows, 1); assert.equal(stale.preset.name, 'edit', 'the preset row took a stale name: ' + stale.preset.name);
  assert.equal(stale.back, true); assert.equal(stale.rowsAfter, 1); assert.deepEqual(stale.errs, []);
  pass('a gesture that changed nothing takes its name with it: THEME pressed (no row, the edit scope unmoved), then a preset through the API is one row named "edit"');

  /* ── 3d · the S3 verifier's edges (research/release-0.3.1/probes/S3-verify/) ── */
  /* the mislabelled rows: a PREFERENCE pressed, then an edit by another road, is never named for the press */
  const pressThen = async (press, edit, wait = 520) => {
    await ev(`const H = __LW.history; H.flush(); await __w(450); H.flush(); __room(); window.__n0 = H.entries().length; ${press}; await __w(${wait}); return 1;`);
    if (typeof edit === 'function') await edit(); else await ev(edit + '; return 1;');
    return ev(`const H = __LW.history; await __w(520); H.flush(); return { rows: H.entries().slice(window.__n0).map((e) => e.label), errs: __e.slice() };`);
  };
  const segb = (group, label) => `[...document.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === ${JSON.stringify(label)} && ((b.closest('.segw') || b).querySelector('.k-lbl') || {}).textContent?.trim() === ${JSON.stringify(group)})`;
  const themeOther = `(__LW.themeChoice === 'light' ? 'DARK' : 'LIGHT')`;
  const table = {
    gridThenKey: await pressThen(`await __press(__show(${segb('GRID', '96³')}))`, () => realKey(']')),
    themeThenModApi: await pressThen(`await __press(__show([...document.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === ${themeOther} && b.closest('.segw')?.querySelector('.k-lbl')?.textContent.trim() === 'THEME')))`, `__LW.mod.addSource('lfo')`),
    frameThenStage: await pressThen(`window.__frameWas = [...document.querySelectorAll('.seg-b.on')].find((b) => b.closest('.segw')?.querySelector('.k-lbl')?.textContent.trim() === 'FRAME');
      await __press(__show(${segb('FRAME', 'OFF')}))`, `__LW.setStage(0.61); __LW.history.note()`),
    themeThenKeyC: await pressThen(`await __press(__show([...document.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === ${themeOther} && b.closest('.segw')?.querySelector('.k-lbl')?.textContent.trim() === 'THEME')))`, () => realKey('c'), 60),
  };
  assert.deepEqual(table.gridThenKey.rows, ['turn ψ about the axis, + · ]'], 'GRID then ]: ' + JSON.stringify(table.gridThenKey));
  assert.deepEqual(table.themeThenModApi.rows, ['edit'], 'THEME then LW.mod.addSource: ' + JSON.stringify(table.themeThenModApi));
  assert.deepEqual(table.frameThenStage.rows, ['edit'], 'FRAME then a stage edit: ' + JSON.stringify(table.frameThenStage));
  assert.deepEqual(table.themeThenKeyC.rows, ['cycle the draw style · C'], 'THEME then C 60 ms later: ' + JSON.stringify(table.themeThenKeyC));
  for (const v of Object.values(table)) assert.deepEqual(v.errs, []);
  await ev(`if (window.__frameWas) await __press(window.__frameWas); await __w(100); return 1;`);   /* the reader's frame back */
  pass('the verifier\'s mislabelled rows: GRID 96³ then ] → "turn ψ about the axis, + · ]"; THEME then LW.mod.addSource → "edit"; FRAME OFF then a stage edit → "edit"; THEME then C 60 ms later → "cycle the draw style · C"');

  /* a key's edit is a row of its own, named for its action (C, V, P armed nothing before) */
  for (const [key, name] of [['c', 'cycle the draw style · C'], ['v', 'cycle the observable · V'], ['p', 'toggle the phase palette · P']]) {
    await ev(`await __open(); return 1;`); await realKey(key);
    judgeScene(`the ${key.toUpperCase()} key (real input)`, await g.ev(`return await __close();`), name);
  }
  /* the TRAVEL keys lend no name: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, then an unnamed edit 100 ms later, is a row called "edit" */
  const travels = {};
  for (const [label, key, mods, setup] of [['Ctrl+Z', 'z', [CTRL], ''], ['Ctrl+Shift+Z', 'z', [CTRL, SHIFT], 'H.undo();'], ['Ctrl+Y', 'y', [CTRL], 'H.undo();']]) {
    await ev(`const H = __LW.history; H.flush(); await __w(450); H.flush(); __room(); __LW.setStage(0.41 + Math.random() * 0.1); H.flush(); ${setup} window.__c0 = H.cursor; return 1;`);
    await realKey(key, mods);
    travels[label] = await ev(`const H = __LW.history, moved = H.cursor !== window.__c0; await __w(100); __LW.setStage(0.2 + Math.random() * 0.1); H.note(); await __w(520); H.flush();
      return { moved, name: H.entries().at(-1).label, errs: __e.slice() };`);
  }
  for (const [label, r] of Object.entries(travels)) { assert.equal(r.moved, true, label + ' did not travel'); assert.equal(r.name, 'edit', label + ' then an API edit: ' + JSON.stringify(r)); assert.deepEqual(r.errs, []); }
  pass('the travel keys lend no name: Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y each travel, and an unnamed edit 100 ms later is a row called "edit"');

  /* a segment names its group: STYLE, not the bare option */
  const styleOpt = await ev(`const b = [...document.querySelectorAll('.seg-b')].find((b) => b.closest('.segw')?.querySelector('.k-lbl')?.textContent.trim() === 'STYLE' && !b.classList.contains('on')); window.__styleB = b;
    return b ? [b.textContent.trim(), b.closest('.dev').querySelector('.dev-eyebrow').textContent.trim()] : { E: 'no STYLE option' };`);
  await scene('a STYLE segment press', `const b = __show(window.__styleB); await __w(50); await __press(b);`, 'STYLE ' + styleOpt[0] + ' · ' + styleOpt[1]);

  /* SEPARATE (a PREFERENCE): the modulation transport plays alone; undoing a route must leave it playing with the target back at its
     base, and redo route it and hold it — restoreModulation pauses, and under SEPARATE nothing re-follows */
  const separate = await ev(`const H = __LW.history, M = __LW.mod.model, R = __LW.mod.registry, live = () => __LW.serialize().presentation.ui.stage.mix;
    const link0 = __LW.mod.clockLink; __LW.mod.clockLink = false; __LW.pause(); await __w(100);
    const lfo = M.sourceList().find((s) => s.kind === 'lfo'); __LW.mod.bind(M.macroList()[0].id, lfo.id);
    for (const r of M.routeList()) __LW.mod.unroute(r.id);
    __LW.setStage(0.3); H.flush(); __LW.mod.play(); await __w(400);
    __LW.mod.route(M.macroList()[0].id, 'material.stage', 0, 1); H.flush(); await __w(500);
    const routed = { playing: __LW.mod.playing, modulated: R.isModulated('material.stage'), live: live() };
    H.undo(); await __w(400);
    const undone = { playing: __LW.mod.playing, modulated: R.isModulated('material.stage'), base: R.baseOf('material.stage'), live: live() };
    H.redo(); await __w(500);
    const redone = { playing: __LW.mod.playing, modulated: R.isModulated('material.stage'), base: R.baseOf('material.stage'), live: live() };
    __LW.mod.stop(); __LW.mod.clockLink = link0; for (const r of M.routeList()) __LW.mod.unroute(r.id); await __w(200); H.flush();   /* the stage unrouted for the scenes after */
    return { routed, undone, redone, errs: __e.slice() };`);
  assert.equal(separate.routed.playing, true); assert.equal(separate.routed.modulated, true);
  assert.deepEqual(separate.undone, { playing: true, modulated: false, base: 0.3, live: 0.3 }, 'SEPARATE, undo of a route: ' + JSON.stringify(separate.undone));
  assert.equal(separate.redone.playing, true, 'SEPARATE, redo: the transport stopped'); assert.equal(separate.redone.modulated, true, 'SEPARATE, redo: the route is not held');
  assert.equal(separate.redone.base, 0.3); assert.notEqual(separate.redone.live, 0.3, 'SEPARATE, redo: the modulator does not move the stage'); assert.deepEqual(separate.errs, []);
  pass(`SEPARATE: a route undone under a playing modulation transport leaves it playing with the stage on its base 0.3; redo routes and holds it again (${separate.redone.live.toFixed(3)} under the LFO)`);

  /* THE DRIVE: a rotation rate that turns nothing (ROTATE z on an m = 0 state) does not freeze the ring; one that turns the register
     is one gesture however long it runs, paused or playing (the drive integrates on the wall clock) */
  const drive = await ev(`const H = __LW.history, count = () => H.entries().length;
    __LW.loadPreset('1s+2pz'); __LW.pause(); __LW.setRotRate('z', 0.3); H.note(); await __w(600); H.flush();
    const k = __show(__knob('STAGE')); await __w(80);
    const still = await __scene(async () => { await __drag(k.querySelector('.k-dial'), 0, -30); });
    __LW.setRotRate('z', 0); H.note(); await __w(600); H.flush();
    __LW.loadPreset('2px'); H.note(); await __w(600); H.flush(); __room(); let n = count();
    __LW.setRotRate('z', 0.3); __LW.play(); await __w(3000); H.flush();
    const turning = { rows: count() - n, canRedo: H.canRedo }; n = count();
    __LW.pause(); __LW.setRotRate('z', 0); await __w(600); H.flush();
    const stopped = { rows: count() - n, name: H.entries().at(-1).label };
    return { still, turning, stopped, errs: __e.slice() };`);
  assert.equal(drive.still.added, 1, 'ROTATE z on 1s+2pz, paused: a STAGE drag made ' + drive.still.added + ' rows ' + JSON.stringify(drive.still)); assert.equal(drive.still.name, 'STAGE · SETTINGS');
  assert.equal(drive.still.undoSame, true); assert.equal(drive.still.redoSame, true);
  assert.equal(drive.turning.rows, 0, 'ROTATE z on 2p_x, playing 3 s: ' + drive.turning.rows + ' phantom rows');
  assert.deepEqual(drive.stopped, { rows: 1, name: 'rotation drive' }); assert.deepEqual(drive.errs, []);
  pass('the drive: ROTATE z on an m = 0 state (it turns nothing) leaves a STAGE drag its own named row; on 2p_x it is one gesture — 3 s of play made no row, and its stop made one "rotation drive" row');

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
  let n = await ev(`const H = __LW.history; H.flush(); await __w(450); H.flush(); __room(); __LW.layout.modulation.collapse(); __LW.camera.setAutoRotate(false); window.__yaw0 = __LW.obs.yaw; return H.entries().length;`);
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

  /* ── 7b · S4 MOLECULES ON IS ONE ROW: the solve lands ~300 ms after the press and fills its defaults (chem.orbital, the register's
         selection, the STATES ground lane) into the press's row (absorb), so the first undo turns it off and redo brings the fill ── */
  /* the undo is byte-identical: a record's null orbital and empty STATES lane list land as null and empty (S4 follow-up) */
  const mol = await ev(`const H = __LW.history, I = () => __LW.serialize({ scope: 'edit' }).presentation.instruments;
    const s = __sw('MOLECULES ON'); __show(s); await __w(100); await __open(); const { n0, pre } = window.__s0;
    await __press(s.querySelector('button') || s); await __w(1000); await __w(520); H.flush();
    const rows = H.entries().slice(n0).map((e) => e.label), post = __ser(), filled = I().chem.orbital;
    const diff = (a, b, p = '', o = []) => { if (a && b && typeof a === 'object' && typeof b === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], p + '.' + k, o); } else if (JSON.stringify(a) !== JSON.stringify(b)) o.push(p); return o; };
    const undid = H.undo(); await __w(400); const off = !__LW.chem.on, undoLeft = diff(JSON.parse(pre), JSON.parse(__ser()));
    const redid = H.redo(); await __w(400); const on = __LW.chem.on, redoSame = __ser() === post, orbital = I().chem.orbital;
    await __w(1000); H.flush(); const later = H.entries().length - n0;
    __LW.chem.setOn(false); H.note(); await __w(600); H.flush();
    return { rows, filled, undid, off, undoLeft, redid, on, redoSame, orbital, later, errs: __e.slice() };`);
  assert.deepEqual(mol.rows, ['MOLECULES ON · MOLECULES'], 'MOLECULES ON: ' + JSON.stringify(mol));
  assert.ok(Number.isFinite(mol.filled), 'the solve never filled the orbital'); assert.equal(mol.undid, true); assert.equal(mol.off, true, 'the first undo did not turn MOLECULES off');
  assert.equal(mol.redid, true); assert.equal(mol.on, true); assert.equal(mol.redoSame, true, 'redo is not the filled row'); assert.equal(mol.orbital, mol.filled);
  assert.equal(mol.later, 1, 'a row appeared after the redo'); assert.deepEqual(mol.undoLeft, [], 'the undo left ' + JSON.stringify(mol.undoLeft)); assert.deepEqual(mol.errs, []);
  pass(`MOLECULES ON is one row: the solve's fill joined it (orbital ${mol.filled}), the first undo turned it off byte for byte, redo brought it back byte for byte with its fill, no row after`);

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
    const cardNew = [...document.querySelectorAll('.dev[data-id="history"] .hist-row')].map((b) => b.querySelector('.hist-lbl').textContent + (b.getAttribute('aria-current') === 'true' ? ' ·current' : ''));
    window.confirm = c0;
    return { link: link.opened && link.ok, afterLink, openMs, afterOpen, openLater, demoBytes, demoUndo: u, fresh, afterNew, newLater, cardNew, errs: __e.slice() };`);
  assert.equal(origins.link, true); assert.deepEqual(origins.afterLink, { rows: ['link'], depth: 0 });
  assert.deepEqual(origins.afterOpen, { rows: ['open · WAVE DANCER'], depth: 0 }); assert.deepEqual(origins.openLater, { rows: ['open · WAVE DANCER'], depth: 0 }, 'a row appeared after the demo opened');
  assert.equal(origins.demoUndo.added, 1); assert.equal(origins.demoUndo.undoSame, true); assert.equal(origins.demoUndo.redoSame, true); assert.equal(origins.demoUndo.rebuilds, 0);
  assert.equal(origins.fresh, true); assert.deepEqual(origins.afterNew, { rows: ['new project'], depth: 0 }); assert.deepEqual(origins.newLater, { rows: ['new project'], depth: 0 }, 'a row appeared after NEW');
  assert.deepEqual(origins.cardNew, ['new project ·current'], 'the HISTORY card after NEW: ' + JSON.stringify(origins.cardNew));
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
  await g2.close(); g2 = null;

  /* ── 9b · S4 THE MOLECULES UNDO LEAVES NOTHING (a fresh page, so this ON is the first solve and fills its defaults):
         NEW → MOLECULES ON by a real click → Ctrl+Z is byte-identical to the pre-ON reading and the project is clean 1 s later;
         MOLECULES back on (Ctrl+Shift+Z, filled) → NEW is the empty file for the orbital and the STATES lanes ── */
  g2 = await open(LAB, { width: 1500, height: 1000, script: 60000, prefs: PREFS });
  assert.equal((await g2.waitFor('window.__LW&&__LW.ready', 200, 100)).ok, 1);
  const molAt = await g2.ev(`window.__w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
    await __LW.layout.projects.fresh(); await __w(800); window.__pre = JSON.stringify(__LW.serialize({ scope: 'edit' }));
    const s = [...document.querySelectorAll('.sw')].find((e) => (e.querySelector('.sw-lbl')?.textContent || '').trim() === 'MOLECULES ON'), d = s.closest('.dev');
    d.hidden = false; d.classList.remove('closed'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click();
    const b = s.querySelector('button') || s; b.scrollIntoView({ block: 'center', behavior: 'instant' }); await __w(100);
    const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, h = document.elementFromPoint(x, y);
    return h && b.contains(h) ? [x, y] : { E: 'MOLECULES ON is covered' };`);
  assert.ok(Array.isArray(molAt), JSON.stringify(molAt));
  await realClick(molAt, g2);
  const molOn = await g2.ev(`await __w(1000); const I = __LW.serialize({ scope: 'edit' }).presentation.instruments; return { on: __LW.chem.on, orbital: I.chem.orbital, lanes: I.states.lanes.length, rows: __LW.history.entries().map((e) => e.label) };`);
  await realKey('z', [CTRL], g2);
  const molUndo = await g2.ev(`await __w(1000); const P = __LW.layout.projects; return { on: __LW.chem.on, same: JSON.stringify(__LW.serialize({ scope: 'edit' })) === window.__pre, dirty: P.dirty, errs: __e.slice() };`);
  await realKey('z', [CTRL, SHIFT], g2);
  const molNew = await g2.ev(`await __w(800); const I0 = __LW.serialize({ scope: 'edit' }).presentation.instruments, before = { on: __LW.chem.on, orbital: I0.chem.orbital, lanes: I0.states.lanes.length };
    const F = await (await fetch('./new-project.lambdawaves.json', { cache: 'no-cache' })).json(), FI = (F.data || F).presentation.instruments;
    await __LW.layout.projects.fresh(); await __w(900); const I = __LW.serialize({ scope: 'edit' }).presentation.instruments;
    return { before, orbital: I.chem.orbital, lanes: JSON.stringify(I.states.lanes), fileOrbital: FI.chem.orbital, fileLanes: JSON.stringify(FI.states.lanes), errs: __e.slice() };`);
  assert.deepEqual({ on: molOn.on, filled: Number.isFinite(molOn.orbital), lanes: molOn.lanes, rows: molOn.rows }, { on: true, filled: true, lanes: 1, rows: ['new project', 'MOLECULES ON · MOLECULES'] }, 'NEW → MOLECULES ON: ' + JSON.stringify(molOn));
  assert.deepEqual(molUndo, { on: false, same: true, dirty: false, errs: [] }, 'NEW → MOLECULES ON → Ctrl+Z: ' + JSON.stringify(molUndo));
  assert.deepEqual(molNew.before, { on: true, orbital: molOn.orbital, lanes: 1 }, 'Ctrl+Shift+Z did not bring MOLECULES back filled: ' + JSON.stringify(molNew.before));
  assert.equal(molNew.orbital, molNew.fileOrbital); assert.equal(molNew.lanes, molNew.fileLanes, 'NEW after MOLECULES is not the file: ' + JSON.stringify(molNew)); assert.deepEqual(molNew.errs, []);
  pass(`the MOLECULES undo leaves nothing: NEW → a real click on MOLECULES ON (orbital ${molOn.orbital}, one STATES lane) → Ctrl+Z is byte-identical to the pre-ON reading and clean 1 s later; back on by Ctrl+Shift+Z, then NEW is the file (orbital ${molNew.orbital}, lanes ${molNew.lanes})`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  try { await Promise.race([Promise.all([g && g.close(), g2 && g2.close()]), new Promise((_, reject) => setTimeout(() => reject(new Error('driver cleanup exceeded 10 seconds')), 10000))]); }
  catch (error) { failed = true; console.error('INFRASTRUCTURE:', error.message); }
  process.exit(failed ? 1 : 0);
}
