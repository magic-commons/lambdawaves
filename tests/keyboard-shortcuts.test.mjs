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
