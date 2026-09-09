import assert from 'node:assert/strict';
import { bindSliderKeys } from '../lab/slider-keys.js';
import * as M from '../lab/mir/mod.js';
const key = (element, name, modifiers = {}) => {
  const e = new Event('keydown', { cancelable: true });
  Object.assign(e, { key: name, ...modifiers });
  element.dispatchEvent(e); return e;
};
M.modReset();
const macro = M.addMacro(null);
M.setMacro(macro.id, { value: .4, masterDepth: .7 });
let compact = false, driven = false;
const build = () => {
  const element = new EventTarget();
  bindSliderKeys(element, {
    get: () => M.macroOf(macro.id)[compact ? 'value' : 'masterDepth'],
    set: value => M.setMacro(macro.id, { [compact ? 'value' : 'masterDepth']: value }),
    editable: () => !compact || !driven,
  });
  return element;
};
let seat = build();
assert.equal(seat.tabIndex, 0);
assert.equal(key(seat, 'ArrowUp').defaultPrevented, true);
assert.ok(Math.abs(M.macroOf(macro.id).masterDepth - .71) < 1e-10);
assert.equal(M.macroOf(macro.id).value, .4);
compact = true;
key(seat, 'ArrowDown', { shiftKey: true });
assert.ok(Math.abs(M.macroOf(macro.id).value - .399) < 1e-10);
seat = build(); // Reopening binds to current model values, not stale captured values.
key(seat, 'End'); key(seat, 'ArrowUp');
assert.equal(M.macroOf(macro.id).value, 1);
key(seat, 'Home'); key(seat, 'ArrowLeft');
assert.equal(M.macroOf(macro.id).value, 0);
driven = true;
assert.equal(key(seat, 'End').defaultPrevented, false);
assert.equal(M.macroOf(macro.id).value, 0);
compact = false;
key(seat, 'Home');
assert.equal(M.macroOf(macro.id).masterDepth, 0);
for (const [name, modifiers] of [[' ', {}], ['Enter', {}], ['ArrowUp', {ctrlKey:true}], ['End', {metaKey:true}], ['Home', {altKey:true}]]) {
  assert.equal(key(seat, name, modifiers).defaultPrevented, false);
}
assert.equal(M.macroOf(macro.id).masterDepth, 0);
console.log('PASS macro keyboard: depth/value separation, fine steps, bounds, rebuild, source lock and shortcut ownership');
