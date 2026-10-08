import assert from 'node:assert/strict';
import { bindSliderKeys } from '../lab/mir/slider-keys.js';
import { setKnobLaw } from '../lab/mir/kit.js';
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
/* 0.5.0 A10 · the canary's red 6: Shift is the KIT's fine gear, read from the adopted kit, never a pinned .709.  MIR 1.5's
   bindSliderKeys steps .01·setKnobLaw().keyFine (an eighth); 1.4.3's steps a flat .001 and does not read the law.  So the
   step is measured: a finer and constant gear — where it follows the law (turn the law, step again) exactly .01·keyFine, and
   where it does not, 1.4's own flat .001.  On 1.4.3 the second branch runs; on 1.5 the first, with no second edit. */
const law = setKnobLaw();
const shiftStep = () => { const v = M.macroOf(macro.id).masterDepth; key(seat, 'ArrowDown', { shiftKey: true }); return v - M.macroOf(macro.id).masterDepth; };
const fine = shiftStep();
assert.ok(fine > 0 && fine < .01, 'Shift is a finer gear than the plain hundredth: ' + fine);
assert.ok(Math.abs(shiftStep() - fine) < 1e-12, 'and a constant one');
setKnobLaw({ keyFine: law.keyFine / 2 }); const turned = shiftStep(); setKnobLaw({ keyFine: law.keyFine });
const follows = Math.abs(turned - fine) > 1e-12;
if (follows) assert.ok(Math.abs(fine - .01 * law.keyFine) < 1e-12 && Math.abs(turned - .005 * law.keyFine) < 1e-12, 'Shift steps .01·keyFine of the law in force');
else assert.ok(Math.abs(fine - .001) < 1e-12, 'a kit whose slider does not read the law (1.4.x) keeps its own flat Shift step, .001');
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
console.log('PASS macro keyboard: depth is mode-invariant, fine steps (the kit\'s Shift gear ' + fine.toFixed(5) + (follows ? ' = .01·keyFine of the law' : ', a flat gear that does not read the law') + '), bounds, rebuild, driven macros and shortcut ownership');
