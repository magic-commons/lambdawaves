import assert from 'node:assert/strict';
import { bindSliderKeys } from '../lab/mir/slider-keys.js';
import * as M from '../lab/mir/modulation/mod.js';
const key = (element, name, modifiers = {}) => {
  const e = new Event('keydown', { cancelable: true });
  Object.assign(e, { key: name, ...modifiers });
  element.dispatchEvent(e); return e;
};
M.modReset();
const macro = M.addMacro(null);
M.setMacro(macro.id, { value: .4, masterDepth: .7 });
const build = () => {
  const element = new EventTarget();
  bindSliderKeys(element, {
    get: () => M.macroOf(macro.id).masterDepth,
    set: value => M.setMacro(macro.id, { masterDepth: value }),
    editable: () => true,
  });
  return element;
};
let seat = build();
assert.equal(seat.tabIndex, 0);
assert.equal(key(seat, 'ArrowUp').defaultPrevented, true);
assert.ok(Math.abs(M.macroOf(macro.id).masterDepth - .71) < 1e-10);
assert.equal(M.macroOf(macro.id).value, .4);
// Folding the rail does not rebuild or repurpose the depth seat.
key(seat, 'ArrowDown', { shiftKey: true });
assert.ok(Math.abs(M.macroOf(macro.id).masterDepth - .709) < 1e-10);
assert.equal(M.macroOf(macro.id).value, .4);
seat = build(); // Reopening binds to current model values, not stale captured values.
key(seat, 'End'); key(seat, 'ArrowUp');
assert.equal(M.macroOf(macro.id).masterDepth, 1);
key(seat, 'Home'); key(seat, 'ArrowLeft');
assert.equal(M.macroOf(macro.id).masterDepth, 0);
const source = M.addSource('lfo', { on: true });
M.setMacro(macro.id, { sourceId: source.id });
const drivenValue = M.macroOf(macro.id).value;
assert.equal(key(seat, 'End').defaultPrevented, true);
assert.equal(M.macroOf(macro.id).masterDepth, 1);
assert.equal(M.macroOf(macro.id).value, drivenValue);
key(seat, 'Home');
assert.equal(M.macroOf(macro.id).masterDepth, 0);
for (const [name, modifiers] of [[' ', {}], ['Enter', {}], ['ArrowUp', {ctrlKey:true}], ['End', {metaKey:true}], ['Home', {altKey:true}]]) {
  assert.equal(key(seat, name, modifiers).defaultPrevented, false);
}
assert.equal(M.macroOf(macro.id).masterDepth, 0);
console.log('PASS macro keyboard: depth is mode-invariant, fine steps, bounds, rebuild, driven macros and shortcut ownership');
