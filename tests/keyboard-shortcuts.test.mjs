import assert from 'node:assert/strict';
import { bindAction, bindingConflicts, bindingOverlap, normalizeBinding } from '../lab/shortcuts.js';

const actions = [
  { id: 'dolly', key: 'KeyQ', ctrl: false, alt: false, shift: false },
  { id: 'pov', key: 'KeyQ', ctrl: false, alt: false, shift: true },
  { id: 'zoom', key: 'KeyQ', ctrl: true, alt: false, shift: true },
  { id: 'fine', key: 'KeyW', ctrl: false, alt: false, shift: undefined },
  { id: 'free', key: 'KeyL', ctrl: false, alt: false, shift: false },
];
for (let i = 0; i < actions.length; i++) for (let j = i + 1; j < actions.length; j++)
  assert.equal(bindingOverlap(actions[i], actions[j]), false, `default ${actions[i].id} / ${actions[j].id}`);
assert.deepEqual(bindingConflicts(actions, 'free', { key: 'KeyQ', shift: true }), [actions[1]]);
assert.deepEqual(bindingConflicts(actions, 'free', { key: 'KeyW', shift: true }), [actions[3]]);
assert.equal(bindAction(actions, 'free', { key: 'KeyQ', shift: true }).ok, false);
assert.equal(actions[4].key, 'KeyL', 'a rejected edit is atomic');
assert.deepEqual(bindAction(actions, 'free', { key: 'KeyQ', shift: true }, { steal: true }), { ok: true, conflicts: ['pov'] });
assert.equal(actions[1].key, null, 'explicit steal visibly unbinds the former owner');
assert.equal(bindAction(actions, 'free', { key: 'Tab' }).ok, false);
assert.equal(bindAction(actions, 'free', { key: 'Escape' }).ok, false);
assert.equal(bindAction(actions, 'free', { key: 'ControlLeft' }).ok, false);
console.log('PASS keyboard chords: layered modifiers, wildcard Shift conflicts, atomic steals and reserved keys');

/* 0.4.0 S2 · THE ALT+ARROW QUARTET slides the picture (the lens shift).  The shipped camera and transport chords it sits beside
   (rack.js ACTIONS): no overlap with the bare arrows, Q/E, Shift+Q/E, Ctrl+Shift+Q/E or WASD.  Alt in the reserved set means
   "not bindable ALONE" (AltLeft as the key), never "not a modifier". */
const shipped = [
  { id: 'stepBack', key: 'ArrowLeft' }, { id: 'stepFwd', key: 'ArrowRight' }, { id: 'zoomIn', key: 'ArrowUp' }, { id: 'zoomOut', key: 'ArrowDown' },
  { id: 'yawL', key: 'KeyA' }, { id: 'yawR', key: 'KeyD' }, { id: 'pitchUp', key: 'KeyW' }, { id: 'pitchDn', key: 'KeyS' },
  { id: 'dollyIn', key: 'KeyQ', shift: false }, { id: 'dollyOut', key: 'KeyE', shift: false }, { id: 'povIn', key: 'KeyQ', shift: true }, { id: 'povOut', key: 'KeyE', shift: true },
  { id: 'dollyZoomIn', key: 'KeyQ', ctrl: true, shift: true }, { id: 'dollyZoomOut', key: 'KeyE', ctrl: true, shift: true },
  { id: 'historyUndo', key: 'KeyZ', ctrl: true, alt: true, shift: false },
  { id: 'panLeft', key: 'ArrowLeft', alt: true }, { id: 'panRight', key: 'ArrowRight', alt: true }, { id: 'panUp', key: 'ArrowUp', alt: true }, { id: 'panDown', key: 'ArrowDown', alt: true },
];
for (let i = 0; i < shipped.length; i++) for (let j = i + 1; j < shipped.length; j++)
  assert.equal(bindingOverlap(shipped[i], shipped[j]), false, `shipped ${shipped[i].id} / ${shipped[j].id}`);
assert.deepEqual(bindingConflicts(shipped, 'x', { key: 'ArrowLeft', alt: true, shift: true }).map((a) => a.id), ['panLeft'], 'Shift+Alt+← is the fine pan (wildcard Shift), not a new chord');
assert.deepEqual(bindingConflicts(shipped, 'x', { key: 'ArrowLeft' }).map((a) => a.id), ['stepBack'], 'the bare arrow is still time');
assert.equal(bindAction(shipped, 'panLeft', { key: 'AltLeft' }).ok, false, 'Alt alone is not a binding');
assert.equal(bindAction(shipped, 'panLeft', { key: 'KeyJ', alt: true }).ok, true, 'Alt is a modifier like any other');
console.log('PASS the Alt+Arrow pan quartet: no overlap with the arrows, WASD, Q/E, Shift+Q/E, Ctrl+Shift+Q/E or Ctrl+Alt+Z; Shift+Alt+Arrow is its fine step; Alt binds as a modifier and never alone');

/* 0.5.0 A9 · THE KIT'S SPELLING, THE LIFT AND THE FIELD PASSAGE, through the real dispatcher (lab/keys.js) on a stub window.
   `ctrl: 'Ctrl'` is the kit's `Ctrl` (the Control key alone, never ⌘: ⌘⇧Q logs a Mac out); `ctrl: true` its `Mod`. The binding law
   keeps the two as ONE chord when it looks for an overlap (off a Mac they are the same keys), and keeps the spelling it was given. */
assert.equal(normalizeBinding({ key: 'KeyQ', ctrl: 'Ctrl', shift: true }, {}).ctrl, 'Ctrl', 'the explicit Ctrl survives the law');
assert.equal(normalizeBinding({ key: 'KeyQ', ctrl: 'Ctrl', shift: true }, { ctrl: true }).ctrl, true, 'a rebind to Mod is Mod');
assert.equal(bindingOverlap({ key: 'KeyQ', ctrl: 'Ctrl', shift: true }, { key: 'KeyQ', ctrl: true, shift: true }), true, 'Ctrl and Mod on one key overlap');
const store = new Map([['lambdawaves.q0.keys', JSON.stringify({ play: { key: 'KeyL', ctrl: false, alt: false, shift: false } })]]);
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.window = new EventTarget();
const { installKeys, keyName } = await import('../lab/keys.js');
const ran = [];
const table = [
  { id: 'transport.play', was: 'play', key: 'Space', run: () => ran.push('play') },
  { id: 'dollyZoomIn', key: 'KeyQ', ctrl: 'Ctrl', shift: true, run: () => ran.push('dolly') },
  { id: 'save', key: 'KeyS', ctrl: true, shift: false, inFields: true, run: () => ran.push('save') },
  { id: 'pitchDn', key: 'KeyS', run: () => ran.push('pitch') },
  { id: 'folders', key: 'KeyO', run: () => ran.push('folders') },
];
const keys = installKeys({ ACTIONS: table, layout: {}, canvas: null, stageHasFocus: () => false, refresh: () => {} });
const press = (code, mods = {}, target) => { const e = new Event('keydown', { cancelable: true });
  Object.assign(e, { code, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...mods });
  if (target) Object.defineProperty(e, 'target', { value: target });
  window.dispatchEvent(e); const out = ran.slice(); ran.length = 0; return out; };
assert.equal(table[0].key, 'KeyL', 'a binding saved under the old id (play) loads onto its kit id (transport.play)');
assert.deepEqual(press('KeyL'), ['play']);
assert.deepEqual(press('KeyQ', { metaKey: true, shiftKey: true }), [], '⌘⇧Q is never the coupled dolly');
assert.deepEqual(press('KeyQ', { ctrlKey: true, shiftKey: true }), ['dolly']);
assert.equal(keyName(table[1]), 'Ctrl+Shift+Q');
assert.deepEqual(press('KeyS'), ['pitch'], 'R-K1: S stays WASD\'s pitch-down');
assert.deepEqual(press('KeyO'), ['folders'], 'FOLDERS is O');
const field = { tagName: 'INPUT' };
assert.deepEqual(press('KeyS', {}, field), [], 'typing s in a field is typing');
assert.deepEqual(press('KeyS', { ctrlKey: true }, field), ['save'], 'an inFields row runs from a text field');
assert.deepEqual(press('KeyO', { ctrlKey: true }, field), [], 'and nothing else does');
assert.equal(keys.bind('transport.play', { key: 'KeyU' }).ok, true);
const saved = JSON.parse(store.get('lambdawaves.q0.keys'));
assert.deepEqual(Object.keys(saved), ['transport.play'], 'the next save writes the kit id and drops the old one');
assert.equal(keys.bind('dollyZoomIn', { key: 'KeyQ', ctrl: 'Ctrl', shift: true }).ok, true);
keys.reset(); assert.equal(table[1].ctrl, 'Ctrl', 'reset restores the explicit Ctrl'); assert.equal(store.has('lambdawaves.q0.keys'), false);
console.log('PASS the kit spelling through the dispatcher: Ctrl+Shift+Q is the Control key alone (⌘⇧Q runs nothing), a binding saved under an old id loads onto the kit id and is re-saved under it, S stays pitch-down and FOLDERS is O, and only inFields rows run from a text field');
