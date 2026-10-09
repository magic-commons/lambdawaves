/* Keyboard input for normalized host sliders. Space remains the transport key.
 * One hundredth of the range per arrow; Shift is the kit's one fine gear (kit.js setKnobLaw().keyFine: an eighth, 1.5.0-alpha.13;
 * it was a tenth).  Home and End are the ends; Delete (and Backspace: an iPad has no forward Delete) is the slider's own
 * reset, the one its double-tap runs, when it has one — as on every kit knob and fader (wave 19). */
import { setKnobLaw } from './kit.js';

export function bindSliderKeys(element, { get, set, editable = () => true, reset = null }) {
  element.tabIndex = 0;
  element.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !editable()) return;
    const step = event.shiftKey ? .01 * setKnobLaw().keyFine : .01;
    let value;
    switch (event.key) {
      case 'ArrowRight': case 'ArrowUp': value = get() + step; break;
      case 'ArrowLeft': case 'ArrowDown': value = get() - step; break;
      case 'Home': value = 0; break;
      case 'End': value = 1; break;
      case 'Delete': case 'Backspace':
        if (typeof reset !== 'function') return;                 // no default (a macro's value: its double-click is rename)
        event.preventDefault(); event.stopPropagation(); reset(); return;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    set(Math.max(0, Math.min(1, value)));
  });
}
