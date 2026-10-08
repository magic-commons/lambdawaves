import assert from 'node:assert/strict';
import { bindAction, bindingConflicts, bindingOverlap } from '../lab/shortcuts.js';

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
