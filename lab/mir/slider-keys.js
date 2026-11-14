/* Keyboard input for normalized host sliders. Space remains the transport key.
 * One hundredth of the range per arrow; Shift is the kit's one fine gear (kit.js setKnobLaw().keyFine: an eighth, 1.5.0-alpha.13;
 * it was a tenth); Page Up / Page Down ten hundredths (1.6.0-alpha.21, as every kit knob, fader, number, range and pad; Shift is not
 * read on a Page).  Home and End are the ends; Delete (and Backspace: an iPad has no forward Delete) is the slider's own
 * reset, the one its double-tap runs, when it has one — as on every kit knob and fader (wave 19). */
import { setKnobLaw } from './kit.js';

/** sliderKey(event, value) → the 0…1 value this key moves `value` to, or null when the key is not a slider's (pure: the map bindSliderKeys binds) */
export function sliderKey(event, value) {
  const step = event.shiftKey ? .01 * setKnobLaw().keyFine : .01;
  switch (event.key) {
    case 'ArrowRight': case 'ArrowUp': value += step; break;
    case 'ArrowLeft': case 'ArrowDown': value -= step; break;
    case 'PageUp': value += .1; break;
    case 'PageDown': value -= .1; break;
    case 'Home': value = 0; break;
    case 'End': value = 1; break;
    default: return null;
  }
  return Math.max(0, Math.min(1, value));
}

export function bindSliderKeys(element, { get, set, editable = () => true, reset = null }) {
  element.tabIndex = 0;
  element.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !editable()) return;
    let value;
    switch (event.key) {
      case 'Delete': case 'Backspace':
        if (typeof reset !== 'function') return;                 // no default (a macro's value: its double-click is rename)
        event.preventDefault(); event.stopPropagation(); reset(); return;
      default: value = sliderKey(event, get()); if (value === null) return;
    }
    event.preventDefault();
    event.stopPropagation();
    set(value);
  });
}
