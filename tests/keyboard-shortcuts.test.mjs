// 0.5.0 C3 · the keys on MIR's ONE KEY TABLE (lab/mir/shell/keys.js) through λWAVES' rows (lab/key-table.js), on a stub EventTarget: the
// kit's chord spelling, THE NEW Ctrl-vs-Mod CASE on both platforms (Ctrl+Shift+Q is the Control key alone: on a Mac ⌘⇧Q never runs the dolly
// zoom; off a Mac Ctrl IS Mod), the binding law (an overlap is refused unless the steal is explicit; reserved keys; a stage row binds on Tab
// alone; a saved chord another row holds by default is dropped on read), the fine step (a row with no `shift` answers Shift too, as 0.25),
// the 0.4.0 save lifted through `was`, the field passage (only `inFields` rows), R-K1 (S is pitch-down, FOLDERS is O) and the Alt+Arrow quartet.
import assert from 'node:assert/strict';
import { parseChord, normalize, chordFromEvent } from '../lab/mir/shell/keys.js';
import { createKeyTable, chordsOf, liftSaved } from '../lab/key-table.js';

/* ── the spelling: Ctrl vs Mod, pure ── */
assert.equal(normalize('Ctrl+Shift+KeyQ', 'mac'), 'Ctrl+Shift+KeyQ', 'on a Mac the Control key stays Ctrl');
assert.equal(normalize('Ctrl+Shift+KeyQ', 'other'), 'Mod+Shift+KeyQ', 'off a Mac Ctrl is Mod');
assert.equal(chordFromEvent({ code: 'KeyQ', metaKey: true, shiftKey: true }, 'mac'), 'Mod+Shift+KeyQ', '⌘⇧Q on a Mac is Mod, never Ctrl');
assert.equal(chordFromEvent({ code: 'KeyQ', ctrlKey: true, shiftKey: true }, 'mac'), 'Ctrl+Shift+KeyQ');
assert.equal(chordFromEvent({ code: 'KeyQ', metaKey: true, shiftKey: true }, 'other'), 'Shift+Meta+KeyQ');
assert.deepEqual(chordsOf({ key: 'KeyQ', ctrl: 'Ctrl', shift: true }), ['Ctrl+Shift+KeyQ']);
assert.deepEqual(chordsOf({ key: 'KeyS', ctrl: true, shift: false }), ['Mod+KeyS']);
assert.deepEqual(chordsOf({ key: 'KeyW' }), ['KeyW', 'Shift+KeyW'], 'no `shift`: the chord and its Shift (the fine step)');
assert.deepEqual(chordsOf({ key: null }), []);
assert.deepEqual(parseChord('Alt+Shift+ArrowLeft'), { mods: ['Alt', 'Shift'], code: 'ArrowLeft' });
console.log('PASS the spelling: Ctrl+Shift+Q stays Ctrl on a Mac and is Mod elsewhere, ⌘⇧Q is Mod, a row with no shift is two chords');

/* ── the table on a stub window, on each platform ── */
function make(platform, saved = null) {
  const target = new EventTarget(), ran = [], store = { v: saved, get() { return this.v; }, set(o) { this.v = o && Object.keys(o).length ? o : null; } };
  const rows = [
    { id: 'transport.play', was: 'play', group: 'TRANSPORT', label: 'play / pause', key: 'Space', run: () => ran.push('play') },
    { id: 'dollyIn', group: 'CAMERA', label: 'dolly in', key: 'KeyQ', shift: false, run: (f) => ran.push('dolly ' + f) },
    { id: 'povIn', group: 'CAMERA', label: 'POV tighter', key: 'KeyQ', shift: true, run: () => ran.push('pov') },
    { id: 'dollyZoomIn', group: 'CAMERA', label: 'dolly zoom in', key: 'KeyQ', ctrl: 'Ctrl', shift: true, run: () => ran.push('dollyzoom') },
    { id: 'pitchUp', group: 'CAMERA', label: 'pitch up', key: 'KeyW', run: (f) => ran.push('pitch ' + f) },
    { id: 'pitchDn', group: 'CAMERA', label: 'pitch down', key: 'KeyS', run: () => ran.push('pitchDn') },
    { id: 'panLeft', group: 'CAMERA', label: 'pan left', key: 'ArrowLeft', alt: true, run: (f) => ran.push('pan ' + f) },
    { id: 'stepBack', group: 'TRANSPORT', label: 'step back', key: 'ArrowLeft', run: () => ran.push('step') },
    { id: 'nextWindow', label: 'next window', key: 'Tab', shift: false, stage: true, run: () => ran.push('tab') },
    { id: 'save', group: 'PROJECT', label: 'save', inFields: true, key: 'KeyS', ctrl: true, shift: false, run: () => ran.push('save') },
    { id: 'folders', group: 'PROJECT', label: 'folders', key: 'KeyO', run: () => ran.push('folders') },
    { id: 'camReset', group: 'CAMERA', label: 'reset the camera', key: 'KeyR', run: () => ran.push('reset') },
    { id: 'history', group: 'PROJECT', label: 'history', key: null, run: () => ran.push('history') },
  ];
  const named = [];
  const kt = createKeyTable({ rows, platform, target, storage: store, stageHasFocus: () => false, edit: (a, run) => { named.push(a.id); run(); } });
  const press = (code, mods = {}, at, handled = false) => { const e = new Event('keydown', { cancelable: true }); Object.assign(e, { code, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...mods });
    if (at) Object.defineProperty(e, 'target', { value: at }); if (handled) e.preventDefault(); target.dispatchEvent(e); const out = ran.splice(0); return out; };
  return { kt, rows, store, press, named };
}

/* THE NEW Ctrl-vs-Mod CASE */
{
  const mac = make('mac');
  assert.deepEqual(mac.kt.table.chords('dollyZoomIn'), ['Ctrl+Shift+KeyQ']);
  assert.deepEqual(mac.press('KeyQ', { metaKey: true, shiftKey: true }), [], 'on a Mac ⌘⇧Q (the log-out) never runs the dolly zoom');
  assert.deepEqual(mac.press('KeyQ', { ctrlKey: true, shiftKey: true }), ['dollyzoom'], 'on a Mac the Control key runs it');
  assert.deepEqual(mac.press('KeyS', { metaKey: true }), ['save'], 'Mod is ⌘ on a Mac');
  const pc = make('other');
  assert.deepEqual(pc.kt.table.chords('dollyZoomIn'), ['Mod+Shift+KeyQ']);
  assert.deepEqual(pc.press('KeyQ', { ctrlKey: true, shiftKey: true }), ['dollyzoom']);
  assert.deepEqual(pc.press('KeyQ', { metaKey: true, shiftKey: true }), [], 'the Windows key is not Ctrl');
  assert.deepEqual(pc.press('KeyS', { ctrlKey: true }), ['save']);
  const row = pc.rows.find((a) => a.id === 'dollyZoomIn');
  assert.equal(row.ctrl, 'Ctrl', 'a row at its defaults keeps its declared spelling');
  console.log('PASS THE Ctrl-vs-Mod CASE: Ctrl+Shift+Q is the Control key on a Mac (⌘⇧Q runs nothing) and Ctrl elsewhere (the Windows key runs nothing); Mod+S is ⌘S on a Mac, Ctrl+S elsewhere');
}

/* the dispatch: the fine step, the stage rule, the field passage, R-K1, the history's naming road */
{
  const { press, named, kt } = make('other');
  assert.deepEqual(press('KeyW'), ['pitch 1']); assert.deepEqual(press('KeyW', { shiftKey: true }), ['pitch 0.25'], 'Shift is the fine step');
  assert.deepEqual(press('KeyQ'), ['dolly 1']); assert.deepEqual(press('KeyQ', { shiftKey: true }), ['pov'], 'Shift+Q is its own row, not the fine dolly');
  assert.deepEqual(press('ArrowLeft', { altKey: true, shiftKey: true }), ['pan 0.25'], 'Shift+Alt+← is the fine pan');
  assert.deepEqual(press('ArrowLeft'), ['step'], 'the bare arrow is still time');
  assert.deepEqual(press('Tab'), [], 'Tab off the stage is the browser\'s');
  assert.deepEqual(press('KeyS'), ['pitchDn'], 'R-K1: S is pitch-down'); assert.deepEqual(press('KeyO'), ['folders'], 'FOLDERS is O');
  const field = { tagName: 'INPUT', type: 'text', nodeType: 1, getAttribute: () => null };
  assert.deepEqual(press('KeyS', {}, field), [], 'typing s in a field is typing');
  assert.deepEqual(press('KeyS', { ctrlKey: true }, field), ['save'], 'an inFields row runs from a text field');
  assert.deepEqual(press('KeyO', { ctrlKey: true }, field), [], 'and nothing else does');
  const role = (r, tag = 'DIV') => ({ tagName: tag, nodeType: 1, getAttribute: (k) => (k === 'role' ? r : null) });
  assert.deepEqual(press('ArrowLeft', {}, role('slider')), ['step'], 'wave 68: a slider that did not act on its arrow (disabled) yields it to the app');
  assert.deepEqual(press('Space', {}, role(null, 'BUTTON')), ['play'], 'wave 88: Space is the transport\'s over a focused button');
  assert.deepEqual(press('Space', {}, { tagName: 'SELECT', nodeType: 1, getAttribute: () => null }), ['play'], 'wave 88: and over a focused <select>');
  assert.deepEqual(press('ArrowLeft', {}, role('slider'), true), [], 'wave 68: a control that acted on its key (prevented it) keeps it');
  assert.ok(named.includes('pitchUp') && named.includes('save'), 'every key runs through the host\'s edit (the history names it)');
  assert.equal(kt.keyText('save'), 'Ctrl+S'); assert.equal(kt.keyText('history'), '—'); assert.equal(kt.keyText('pitchUp'), 'W');
  console.log('PASS the dispatch: Shift is the fine step (W 1 → 0.25, Shift+Alt+← the fine pan), Shift+Q its own row, Tab off the stage free, S pitch-down, O FOLDERS, only inFields rows from a field, every run through the host\'s edit');
}

/* the binding law, through keys.bind's road */
{
  const { kt, store, rows } = make('other');
  assert.deepEqual(kt.table.conflicts(), [], 'the shipped rows share no chord');
  const taken = kt.bind('camReset', { key: 'KeyQ', shift: true });
  assert.deepEqual(taken, { ok: false, conflicts: ['povIn'], reason: 'Shortcut already assigned.' });
  assert.deepEqual(kt.table.chords('camReset'), ['KeyR', 'Shift+KeyR'], 'a refused edit is atomic');
  assert.equal(kt.bind('camReset', { key: 'KeyW' }).ok, false, 'a fine row\'s Shift twin overlaps too');
  for (const key of ['Tab', 'Escape', 'ControlLeft', 'AltLeft']) assert.equal(kt.bind('camReset', { key }).ok, false, key + ' is not a binding');
  assert.equal(kt.bind('nextWindow', { key: 'KeyL' }).ok, false, 'window cycling binds on Tab alone');
  assert.equal(kt.bind('panLeft', { key: 'KeyJ', alt: true }).ok, true, 'Alt is a modifier like any other');
  assert.deepEqual(kt.bind('camReset', { key: 'KeyQ', shift: true }, { steal: true }), { ok: true, conflicts: ['povIn'] });
  assert.deepEqual(kt.table.chords('povIn'), []); assert.equal(rows.find((a) => a.id === 'povIn').key, null, 'an explicit steal visibly unbinds the loser');
  assert.deepEqual(store.v, { panLeft: ['Alt+KeyJ', 'Alt+Shift+KeyJ'], camReset: ['Shift+KeyQ'], povIn: [] }, 'only the difference is saved, in the kit\'s shape');
  kt.reset(); assert.equal(store.v, null, 'reset removes the record'); assert.equal(rows.find((a) => a.id === 'povIn').key, 'KeyQ');
  console.log('PASS the binding law: an overlap is refused (naming the holder) unless the steal is explicit, Tab / Escape / a modifier alone never bind, window cycling stays on Tab, the save is the difference and reset removes it');
}

/* the save: 0.4.0's shape under an old id is lifted; a corrupt one cannot shadow a default */
{
  assert.deepEqual(liftSaved({ play: { key: 'KeyL', ctrl: false, alt: false, shift: false } }, [{ id: 'transport.play', was: 'play', key: 'Space' }]), { 'transport.play': ['KeyL'] });
  const { kt, press, store, rows } = make('other', { play: { key: 'KeyL', ctrl: false, alt: false, shift: false }, folders: { key: 'KeyS', ctrl: false, alt: false, shift: false } });
  assert.deepEqual(kt.table.chords('transport.play'), ['KeyL'], 'a binding saved under the old id (play) loads onto transport.play');
  assert.deepEqual(press('KeyL'), ['play']); assert.equal(rows.find((a) => a.id === 'transport.play').key, 'KeyL');
  assert.deepEqual(kt.table.chords('folders'), ['KeyO', 'Shift+KeyO'], 'a saved chord another row holds by default (S, pitch-down) is dropped on read');
  assert.deepEqual(press('KeyS'), ['pitchDn']);
  assert.equal(kt.bind('transport.play', { key: 'KeyU' }).ok, true);
  assert.deepEqual(Object.keys(store.v), ['transport.play'], 'the next save writes the kit id and drops the old one');
  console.log('PASS the save: 0.4.0\'s { play: { key: KeyL } } loads onto transport.play and plays on L; a saved S for FOLDERS cannot shadow pitch-down; the next save is under the kit id');
}

/* 0.4.0 S2 · the Alt+Arrow quartet beside the shipped camera and transport chords */
{
  const target = new EventTarget(), rows = [['stepBack', 'ArrowLeft'], ['stepFwd', 'ArrowRight'], ['zoomIn', 'ArrowUp'], ['zoomOut', 'ArrowDown'], ['yawL', 'KeyA'], ['yawR', 'KeyD'], ['pitchUp', 'KeyW'], ['pitchDn', 'KeyS']]
    .map(([id, key]) => ({ id, key, label: id, run() {} }))
    .concat([{ id: 'dollyIn', key: 'KeyQ', shift: false }, { id: 'dollyOut', key: 'KeyE', shift: false }, { id: 'povIn', key: 'KeyQ', shift: true }, { id: 'povOut', key: 'KeyE', shift: true },
      { id: 'dollyZoomIn', key: 'KeyQ', ctrl: 'Ctrl', shift: true }, { id: 'dollyZoomOut', key: 'KeyE', ctrl: 'Ctrl', shift: true }, { id: 'historyUndo', key: 'KeyZ', ctrl: true, alt: true, shift: false },
      { id: 'panLeft', key: 'ArrowLeft', alt: true }, { id: 'panRight', key: 'ArrowRight', alt: true }, { id: 'panUp', key: 'ArrowUp', alt: true }, { id: 'panDown', key: 'ArrowDown', alt: true }].map((r) => ({ label: r.id, run() {}, ...r })));
  const kt = createKeyTable({ rows, platform: 'other', target, storage: { get: () => null, set() {} } });
  assert.deepEqual(kt.table.conflicts(), [], 'the quartet overlaps nothing shipped');
  assert.deepEqual(kt.table.holders('Alt+Shift+ArrowLeft'), ['panLeft'], 'Shift+Alt+← is the fine pan, not a new chord');
  assert.deepEqual(kt.table.holders('ArrowLeft'), ['stepBack']);
  console.log('PASS the Alt+Arrow pan quartet: no overlap with the arrows, WASD, Q/E, Shift+Q/E, Ctrl+Shift+Q/E or Ctrl+Alt+Z; Shift+Alt+Arrow is its fine step');
}
