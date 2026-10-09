// 0.5.0 C3 · THE KEYBOARD WINDOW IS THE KIT'S (mir/keyboard/keyboard.js createKeyboardWindow over MIR's ONE KEY TABLE, lab/key-table.js),
// its paint λWAVES' (lab.css §KEYBOARD, R5-S3).  Rewritten wholesale from the 0.4.0 editor's suite: the rows and their chords (A9, R-K1,
// the kit's spelling), the window opened by its ACTION with a real key, CLAUDE.md's geometry (five rows in 416 px, legend + switch on one
// row, centred subtitle-free RECORD / RESET above the search, status only when needed, no hard borders), a real drag that the occlusion
// follows and the place remembered, a recording with real keys, a taken chord asked then stolen on the second press, Escape's three steps,
// the platform switch, RESET, a 0.4.0-shaped saved binding across a reload, the camera chords (⌘⇧Q never the dolly zoom) and keys.bind's law.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { actions, relActions, go } from '../tools/gate/drv.mjs';

const url = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const g = await open(url, { width: 1920, height: 1080, script: 30000 });
const SHIFT = '', CTRL = '', ESC = '';
let n = 0;
const press = async (value, mods = []) => { const a = [...mods.map((m) => ({ type: 'keyDown', value: m })), { type: 'keyDown', value }, { type: 'pause', duration: 30 }, { type: 'keyUp', value }, ...mods.map((m) => ({ type: 'keyUp', value: m }))];
  await actions(g.s, [{ type: 'key', id: 'k' + (++n), actions: a }]); await relActions(g.s); };
const ev = async (body) => { const r = await g.ev(body); assert.ok(r && !r.E, 'page threw: ' + JSON.stringify(r)); return r; };
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 200, 100)).ok, 1);

  /* ── 1 · THE ROWS AND THE TABLE: A9's ids, R-K1, Ctrl vs Mod in the kit's spelling, the kit's windows with no chord, hooks that exist ── */
  const binding = await ev(`const a = __LW.keys.actions, T = __LW.keys.table, row = (id) => { const x = a.find((y) => y.id === id); return x && [x.key, x.ctrl || false, !!x.shift]; };
    const kit = await import('./mir/shell/keys.js');
    /* 0.5.0 C7b: the TIMELINE's rows (timeline.*) share chords with λWAVES' by design — live only while its surface has the focus, they
       win there (key-table.js THE FOCUS LAW); any other shared chord is a conflict */
    return { conflicts: T.conflicts().filter((c) => c.ids.filter((id) => id.startsWith('timeline.')).length !== 1 || c.ids.length !== 2), platform: T.platform,
      timeline: T.list().filter((x) => x.id.startsWith('timeline.') && T.get(x.id).when).length,
      camera: Object.fromEntries(['dollyIn', 'povIn', 'dollyZoomIn', 'dollyOut', 'povOut', 'dollyZoomOut'].map((id) => [id, row(id)])),
      chord: Object.fromEntries(['transport.play', 'folders', 'pitchDn', 'modArm', 'help', 'hide', 'modulation', 'save', 'notebook', 'rack', 'dock', 'fullscreen'].map((id) => [id, row(id)])),
      spelled: Object.fromEntries(['transport.play', 'dollyZoomIn', 'modArm', 'save', 'help', 'nextWindow', 'history', 'keyboard'].map((id) => [id, T.chords(id)])),
      gone: ['play', 'hideUI', 'keysheet', 'modWin'].filter((id) => a.some((x) => x.id === id) || T.get(id)),
      hooks: [...document.querySelectorAll('[data-key-action]')].map((e) => e.dataset.keyAction).filter((id) => !T.get(id)),
      hooked: ['rack', 'folders', 'notebook', 'camReset', 'undo', 'redo', 'view', 'style', 'palette', 'dock', 'modulation'].filter((id) => !document.querySelector('[data-key-action="' + id + '"]')),
      hint: document.getElementById('rackToggle').getAttribute('aria-keyshortcuts'),
      kit: Object.fromEntries(Object.entries(kit.KIT_KEYS).map(([k, v]) => [k, kit.normalize(v)])), errors: __e.slice() };`);
  assert.deepEqual(binding.conflicts, [], 'two rows hold one chord'); assert.ok(binding.timeline >= 30, 'the TIMELINE\'s rows are on the table, each with its focus `when`: ' + binding.timeline);
  assert.equal(binding.platform, 'other', 'the gate runs on Linux: Mod is Ctrl');
  assert.deepEqual(binding.camera, { dollyIn: ['KeyQ', false, false], povIn: ['KeyQ', false, true], dollyZoomIn: ['KeyQ', 'Ctrl', true],
    dollyOut: ['KeyE', false, false], povOut: ['KeyE', false, true], dollyZoomOut: ['KeyE', 'Ctrl', true] });
  assert.deepEqual(binding.chord, { 'transport.play': ['Space', false, false], folders: ['KeyO', false, false], pitchDn: ['KeyS', false, false],
    modArm: ['Space', 'Ctrl', false], help: ['Slash', false, true], hide: ['KeyH', false, false], modulation: ['KeyM', false, false], save: ['KeyS', true, false],
    notebook: ['KeyJ', false, false], rack: ['KeyB', false, false], dock: ['KeyT', false, false], fullscreen: ['KeyF', false, false] });
  /* the fine step is the chord and its Shift; `ctrl: 'Ctrl'` is the kit's Ctrl, which off a Mac IS Mod (the NEW Ctrl-vs-Mod case's other half is node) */
  assert.deepEqual(binding.spelled, { 'transport.play': ['Space', 'Shift+Space'], dollyZoomIn: ['Mod+Shift+KeyQ'], modArm: ['Mod+Space', 'Mod+Shift+Space'],
    save: ['Mod+KeyS'], help: ['Shift+Slash'], nextWindow: ['Tab'], history: [], keyboard: [] });
  assert.deepEqual(binding.gone, []); assert.deepEqual(binding.hooks, [], 'a data-key-action names a row'); assert.deepEqual(binding.hooked, []);
  assert.equal(binding.hint, 'B Shift+B', 'the table writes aria-keyshortcuts on a tagged control');
  for (const id of Object.keys(binding.kit).filter((id) => id !== 'folders')) assert.equal(binding.spelled[id] ? binding.spelled[id][0] : (await ev(`return __LW.keys.table.chords(${JSON.stringify(id)});`))[0], binding.kit[id], 'the kit row ' + id);
  assert.equal(binding.kit.folders, 'KeyS'); assert.deepEqual(binding.chord.folders, ['KeyO', false, false], 'R-K1: FOLDERS is O, S is pitch-down');
  assert.deepEqual(binding.errors, []);
  console.log('PASS the rows on the kit\'s table: no shared chord (the ' + binding.timeline + ' TIMELINE rows share theirs only under its focus), A9 ids, R-K1, Ctrl+Shift+Q spelled Mod+Shift+KeyQ off a Mac, the fine step as a chord and its Shift, the kit\'s windows with no chord, every tag a row, hints written');

  /* ── 2 · OPENED BY ITS ACTION (a real ?), and CLAUDE.md's pane ── */
  await ev(`const f = __LW.field, set = f.setOcclusion; window.__masks = []; f.setOcclusion = function (r) { window.__masks = r.map((x) => x.slice()); return set.call(f, r); };
    __LW.pause(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); return 1;`);
  await press('/', [SHIFT]);
  const geo = await ev(`await __LW.settle(); await new Promise((r) => setTimeout(r, 400)); await __LW.settle();
    const w = document.querySelector('[data-mir-window="keyboard"]'), b = w.getBoundingClientRect(), c = document.querySelector('#field').getBoundingClientRect();
    const covers = (r) => __masks.some((m) => m[0] <= r.left - c.left + 20 && m[1] <= r.top - c.top + 20 && m[2] >= r.right - c.left - 20 && m[3] >= r.bottom - c.top - 20);
    const col = w.querySelector('.km-col-left').getBoundingClientRect(), head = w.querySelector('.km-col-header').getBoundingClientRect(), rows = [...w.querySelectorAll('.km-kb-row')];
    const right = w.querySelector('.km-col-right').getBoundingClientRect(), btns = [...w.querySelectorAll('.km-editor-actions .km-btn')], bb = btns.map((e) => e.getBoundingClientRect());
    return { open: __LW.keymap.isOpen, focusIn: w.contains(document.activeElement), layer: w.parentElement.id, w: b.width, h: b.height, x: b.x, y: b.y, pointer: getComputedStyle(w).pointerEvents,
      rows: rows.length, inWell: rows[0].getBoundingClientRect().top >= head.bottom && rows.at(-1).getBoundingClientRect().bottom <= col.bottom,
      groups: [...w.querySelectorAll('.km-action-group')].map((x) => x.textContent),
      oneRow: w.querySelector('.km-legend').parentElement === w.querySelector('.km-platform').parentElement,
      icons: [w.querySelector('.km-os-mac').textContent, w.querySelectorAll('.km-os-windows > span').length],
      centred: Math.abs((bb[0].left + bb[1].right) / 2 - (right.left + right.right) / 2), above: bb.every((r) => r.bottom <= w.querySelector('.km-search').getBoundingClientRect().top),
      bare: btns.map((e) => e.textContent.trim()), statusShown: getComputedStyle(w.querySelector('.km-status')).display !== 'none',
      borders: ['.km-col', '.km-platform .seg', '.km-key-bound', '.km-key-unbound', '.km-search', '.km-action-row', '.km-chip', '.km-btn'].map((s) => getComputedStyle(w.querySelector(s)).borderTopWidth).concat(getComputedStyle(w).borderTopWidth),
      q: w.querySelector('.km-key[data-code="KeyQ"] .km-badge').textContent, more: w.querySelectorAll('.km-action-row:not([data-id^="timeline."]) .km-chip-more').length,   /* C7b: a timeline row's second chord is a real one (Delete · Backspace) */
      play: w.querySelector('.km-action-row[data-id="transport.play"] .km-chips').textContent, card: document.body.dataset.card, mask: covers(b), errors: __e.slice() };`);
  assert.equal(geo.open, true, 'the ? key did not open the window'); assert.equal(geo.focusIn, true, 'the focus did not go into the window');
  assert.equal(geo.layer, 'floats'); assert.equal(geo.pointer, 'auto');
  assert.ok(geo.w > 900 && geo.w < 1440 && geo.h <= 416, 'the pane is ' + geo.w + ' × ' + geo.h);
  assert.ok(geo.x >= 8 && geo.y >= 8);
  assert.equal(geo.rows, 5); assert.equal(geo.inWell, true, 'the five rows do not fit the board\'s well');
  assert.deepEqual(geo.groups, ['TRANSPORT', 'CAMERA', 'STATE', 'WINDOWS & DISPLAY', 'PROJECT', 'TIMELINE']);   // 0.5.0 C7b: the TIMELINE's rows, after λWAVES' own
  assert.equal(geo.oneRow, true); assert.deepEqual(geo.icons, ['⌘', 4]);
  assert.ok(geo.centred < 2); assert.equal(geo.above, true); assert.deepEqual(geo.bare, ['RECORD INPUT', 'RESET TO DEFAULT'], 'RECORD / RESET carry no subtitle');
  assert.equal(geo.statusShown, false, 'an empty status is shown'); assert.deepEqual(geo.borders, Array(9).fill('0px'));
  assert.match(geo.q, /⇧/); assert.equal(geo.more, 0, 'the fine step\'s Shift twin is drawn as a second chord'); assert.equal(geo.play, 'Space');
  assert.equal(geo.card, 'refractive'); assert.equal(geo.mask, true, 'the pane is not in the occlusion mask'); assert.deepEqual(geo.errors, []);
  console.log(`PASS opened by a real ?: the kit's window on the float layer, ${geo.w} × ${geo.h}, five rows in the board's well, the five groups in order, legend and switch on one row, RECORD / RESET centred above the search with no subtitle, no status, no border, the pane masked`);

  /* ── 3 · A REAL DRAG by the rail's grip: the window moves, the mask follows, the place is remembered ── */
  const grip = await ev(`const d = document.querySelector('[data-mir-rail="keyboard"] .mir-grip-dots').closest('.mir-chip').getBoundingClientRect(), p = document.querySelector('[data-mir-window="keyboard"]').getBoundingClientRect();
    return { x: d.left + d.width / 2, y: d.top + d.height / 2, left: p.left, top: p.top };`);
  await actions(g.s, [{ type: 'pointer', id: 'drag' + (++n), parameters: { pointerType: 'mouse' }, actions: [
    { type: 'pointerMove', origin: 'viewport', x: Math.round(grip.x), y: Math.round(grip.y) }, { type: 'pointerDown', button: 0 },
    { type: 'pointerMove', origin: 'viewport', x: Math.round(grip.x + 70), y: Math.round(grip.y + 50), duration: 250 }, { type: 'pointerUp', button: 0 }] }]);
  await relActions(g.s);
  const dragged = await ev(`await new Promise((r) => setTimeout(r, 450)); await __LW.settle();
    const b = document.querySelector('[data-mir-window="keyboard"]').getBoundingClientRect(), c = document.querySelector('#field').getBoundingClientRect();
    return { left: b.left, top: b.top, saved: JSON.parse(localStorage.getItem('lw.keyboard.position.v1')),
      mask: __masks.some((m) => m[0] <= b.left - c.left + 20 && m[1] <= b.top - c.top + 20 && m[2] >= b.right - c.left - 20 && m[3] >= b.bottom - c.top - 20) };`);
  assert.ok(dragged.left >= grip.left + 60 && dragged.top >= grip.top + 40, 'the drag did not move the window: ' + JSON.stringify([grip, dragged]));
  assert.ok(dragged.saved && Math.abs(dragged.saved.x - dragged.left) <= 1 && Math.abs(dragged.saved.y - dragged.top) <= 1, 'the place was not remembered: ' + JSON.stringify(dragged.saved));
  assert.equal(dragged.mask, true, 'the mask did not follow the drag');
  console.log('PASS a real drag by the grip moves the window, the occlusion mask follows it and lw.keyboard.position.v1 remembers { x, y }');

  /* ── 4 · RECORDING, with real keys: a free chord binds; a taken chord asks, the second press steals and names the loser ── */
  const pick = (id) => ev(`const w = document.querySelector('[data-mir-window="keyboard"]'); w.querySelector('.km-action-row[data-id="${id}"]').click(); w.querySelector('.km-btn-record').click();
    return { listening: w.querySelector('.km-btn-record').classList.contains('on'), status: w.querySelector('.km-status').textContent };`);
  const rec1 = await pick('povIn');
  await press('l', [CTRL, SHIFT]);
  const free = await ev(`const T = __LW.keys.table, x = __LW.keys.actions.find((a) => a.id === 'povIn');
    return { chords: T.chords('povIn'), row: [x.key, x.ctrl, x.shift], saved: JSON.parse(localStorage.getItem('lambdawaves.q0.keys')), status: document.querySelector('[data-mir-window="keyboard"] .km-status').textContent };`);
  assert.equal(rec1.listening, true); assert.match(rec1.status, /Listening/);
  assert.deepEqual(free.chords, ['Mod+Shift+KeyL']); assert.deepEqual(free.row, ['KeyL', true, true]); assert.deepEqual(free.saved, { povIn: ['Mod+Shift+KeyL'] });
  assert.match(free.status, /now bound to/);
  await pick('camReset');
  await press('q');
  const asked = await ev(`const w = document.querySelector('[data-mir-window="keyboard"]'); return { status: w.querySelector('.km-status').textContent, tone: w.querySelector('.km-status').dataset.tone, cam: __LW.keys.table.chords('camReset') };`);
  await press('q');
  const stolen = await ev(`const T = __LW.keys.table; return { cam: T.chords('camReset'), dolly: T.chords('dollyIn'), row: __LW.keys.actions.find((a) => a.id === 'dollyIn').key, status: document.querySelector('[data-mir-window="keyboard"] .km-status').textContent, errors: __e.slice() };`);
  assert.match(asked.status, /already bound to “dolly in”/); assert.equal(asked.tone, 'conflict'); assert.deepEqual(asked.cam, ['KeyR', 'Shift+KeyR'], 'the first press of a taken chord bound it');
  assert.deepEqual(stolen.cam, ['KeyQ']); assert.deepEqual(stolen.dolly, []); assert.equal(stolen.row, null); assert.match(stolen.status, /taken from “dolly in”/);
  assert.deepEqual(stolen.errors, []);
  console.log('PASS recording with real keys: Ctrl+Shift+L binds POV tighter (table, row and lambdawaves.q0.keys say so); Q for cam reset asks, the second Q steals it and names "dolly in"');

  /* ── 5 · ESCAPE'S THREE STEPS (a recording, the search, the window), the platform switch, RESET ── */
  await pick('zoomIn');
  await press(ESC);
  const step1 = await ev(`const w = document.querySelector('[data-mir-window="keyboard"]'), s = w.querySelector('.km-search'); const out = { open: __LW.keymap.isOpen, recording: w.querySelector('.km-btn-record').classList.contains('on'), status: w.querySelector('.km-status').textContent, zoom: __LW.keys.table.chords('zoomIn') };
    s.focus(); s.value = 'zoom'; s.dispatchEvent(new Event('input')); out.rows = w.querySelectorAll('.km-action-row').length; return out;`);
  await press(ESC);
  const step2 = await ev(`const w = document.querySelector('[data-mir-window="keyboard"]'); return { open: __LW.keymap.isOpen, search: w.querySelector('.km-search').value, rows: w.querySelectorAll('.km-action-row').length };`);
  const plat = await ev(`const w = document.querySelector('[data-mir-window="keyboard"]'), sw = [...w.querySelectorAll('.km-platform .seg-b')], cap = (c) => w.querySelector('.km-key[data-code="' + c + '"] .km-key-cap').textContent;
    window.__kbRect = w.getBoundingClientRect();
    sw[0].click(); const mac = [cap('MetaLeft'), cap('AltLeft')]; sw[1].click(); const other = [cap('MetaLeft'), cap('AltLeft')];
    w.querySelector('.km-btn-reset').click(); const T = __LW.keys.table;
    return { mac, other, reset: [T.chords('camReset'), T.chords('dollyIn'), T.chords('povIn')], stored: localStorage.getItem('lambdawaves.q0.keys'), status: w.querySelector('.km-status').textContent };`);
  await ev(`document.querySelector('[data-mir-window="keyboard"] .km-search').focus(); return 1;`);
  await press(ESC);
  const step3 = await ev(`await new Promise((r) => setTimeout(r, 400)); const c = document.querySelector('#field').getBoundingClientRect(), b = window.__kbRect;
    return { open: __LW.keymap.isOpen, masked: __masks.some((m) => Math.abs(m[0] - (b.left - c.left)) < 1 && Math.abs(m[1] - (b.top - c.top)) < 1), errors: __e.slice() };`);
  assert.deepEqual([step1.open, step1.recording], [true, false], 'Escape did not cancel the recording first'); assert.match(step1.status, /Cancelled/); assert.deepEqual(step1.zoom, ['ArrowUp', 'Shift+ArrowUp']);
  assert.ok(step1.rows > 0 && step1.rows < 10, 'the search did not filter');
  assert.equal(step2.open, true); assert.equal(step2.search, ''); assert.ok(step2.rows > step1.rows, 'Escape did not clear the search');
  assert.deepEqual(plat.mac, ['⌘', '⌥']); assert.deepEqual(plat.other, ['WIN', 'ALT']);
  assert.deepEqual(plat.reset, [['KeyR', 'Shift+KeyR'], ['KeyQ'], ['Shift+KeyQ']]); assert.equal(plat.stored, null); assert.match(plat.status, /default/);
  assert.equal(step3.open, false, 'the third Escape did not close the window'); assert.equal(step3.masked, false, 'a closed window still masks'); assert.deepEqual(step3.errors, []);
  console.log('PASS Escape cancels the recording, then clears the search, then closes the window (and its mask goes); the switch relabels the bottom row ⌘ ⌥ ↔ WIN ALT; RESET TO DEFAULT restores every chord and removes lambdawaves.q0.keys');

  /* ── 6 · THE CAMERA CHORDS: Shift+Q is POV, ⌘⇧Q is nothing, Ctrl+Shift+Q the dolly zoom (size held), WASD eased ── */
  const camera = await ev(`const L = __LW, K = (code, mods = {}) => window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...mods }));
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    L.camera.reset(); const d0 = L.obs.dist, f0 = L.obs.fov;
    K('KeyQ', { shiftKey: true }); const pov = { dist: L.obs.dist, fov: L.obs.fov };
    K('KeyE', { shiftKey: true }); const m0 = [L.obs.dist, L.obs.fov]; K('KeyQ', { metaKey: true, shiftKey: true }); const cmdInert = L.obs.dist === m0[0] && L.obs.fov === m0[1];
    K('KeyQ', { ctrlKey: true, shiftKey: true }); const zoom = { dist: L.obs.dist, fov: L.obs.fov, product: L.obs.dist * Math.tan(L.obs.fov / 2) };
    L.camera.reset(); const yaw0 = L.obs.yaw; K('KeyA'); const instant = L.obs.yaw; await new Promise((r) => setTimeout(r, 450)); const eased = L.obs.yaw; L.camera.reset();
    return { d0, f0, pov, zoom, cmdInert, product0: d0 * Math.tan(f0 / 2), yaw0, instant, eased, errors: __e.slice() };`);
  assert.equal(camera.cmdInert, true, '⌘⇧Q ran the dolly zoom'); assert.equal(camera.pov.dist, camera.d0); assert.ok(camera.pov.fov < camera.f0);
  assert.ok(camera.zoom.dist < camera.d0 && camera.zoom.fov > camera.f0); assert.ok(Math.abs(camera.zoom.product - camera.product0) < 1e-9);
  assert.equal(camera.instant, camera.yaw0); assert.ok(camera.eased < camera.yaw0 - 0.1); assert.deepEqual(camera.errors, []);
  console.log('PASS the camera chords: Shift+Q tightens the POV, ⌘⇧Q runs nothing, Ctrl+Shift+Q dollies with the size held, A is eased');

  /* ── 7 · keys.bind's law (CLAUDE.md): an overlap is refused without an explicit steal, Tab and Escape never bind, a free chord saves ── */
  const law = await ev(`const k = __LW.keys, before = k.table.chords('camReset');
    const taken = k.bind('camReset', { key: 'KeyQ', shift: true }), tab = k.bind('camReset', { key: 'Tab' }), esc = k.bind('camReset', { key: 'Escape' }), stage = k.bind('nextWindow', { key: 'KeyL' });
    const free = k.bind('camReset', { key: 'KeyL', shift: false }), saved = JSON.parse(localStorage.getItem('lambdawaves.q0.keys'));
    const steal = k.bind('camReset', { key: 'KeyQ', shift: true }, { steal: true }), pov = k.table.chords('povIn');
    k.reset(); return { taken, tab: tab.ok, esc: esc.ok, stage: stage.ok, free, saved, steal, pov, restored: k.table.chords('camReset'), before, errors: __e.slice() };`);
  assert.deepEqual(law.taken.conflicts, ['povIn']); assert.equal(law.taken.ok, false);
  assert.equal(law.tab, false); assert.equal(law.esc, false); assert.equal(law.stage, false, 'window cycling bound off Tab');
  assert.equal(law.free.ok, true); assert.deepEqual(law.saved, { camReset: ['KeyL'] });
  assert.deepEqual(law.steal, { ok: true, conflicts: ['povIn'] }); assert.deepEqual(law.pov, []);
  assert.deepEqual(law.restored, law.before); assert.deepEqual(law.errors, []);
  console.log('PASS keys.bind keeps the binding law: Shift+Q for cam reset is refused naming povIn, Tab / Escape / window cycling off Tab refused, KeyL saved in the kit\'s shape, an explicit steal unbinds the loser, reset restores');

  /* ── 8 · A 0.4.0 SAVE LOADS: { play: { key, ctrl, alt, shift } } under the old id, read across a reload onto transport.play ── */
  await ev(`localStorage.setItem('lambdawaves.q0.keys', JSON.stringify({ play: { key: 'KeyL', ctrl: false, alt: false, shift: false }, dollyZoomIn: { key: 'KeyX', ctrl: 'Ctrl', alt: false, shift: true } })); return 1;`);
  await go(g.s, url);
  assert.equal((await g.waitFor('window.__LW?.ready', 200, 100)).ok, 1);
  const lifted = await ev(`const T = __LW.keys.table; __LW.pause(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); return { play: T.chords('transport.play'), dz: T.chords('dollyZoomIn'), row: __LW.keys.actions.find((a) => a.id === 'transport.play').key };`);
  await press('l');
  const played = await ev(`const out = { playing: __LW.clock.playing }; __LW.pause(); __LW.keys.reset(); out.stored = localStorage.getItem('lambdawaves.q0.keys'); out.errors = __e.slice(); return out;`);
  assert.deepEqual(lifted.play, ['KeyL'], 'the 0.4.0 binding saved under "play" did not load onto transport.play');
  assert.deepEqual(lifted.dz, ['Mod+Shift+KeyX']); assert.equal(lifted.row, 'KeyL');
  assert.equal(played.playing, true, 'L does not play after the lift'); assert.equal(played.stored, null); assert.deepEqual(played.errors, []);
  console.log('PASS a 0.4.0 save loads: { play: KeyL } under the old id plays on L after a reload, { dollyZoomIn: Ctrl+Shift+X } reads as Mod+Shift+KeyX');
  console.log('GREEN keyboard-window.browser-test');
} finally { await g.close(); }
