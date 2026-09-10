/* Keyboard input for normalized host sliders. Space remains the transport key. */
export function bindSliderKeys(element, { get, set, editable = () => true }) {
  element.tabIndex = 0;
  element.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !editable()) return;
    const step = event.shiftKey ? .001 : .01;
    let value;
    switch (event.key) {
      case 'ArrowRight': case 'ArrowUp': value = get() + step; break;
      case 'ArrowLeft': case 'ArrowDown': value = get() - step; break;
      case 'Home': value = 0; break;
      case 'End': value = 1; break;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    set(Math.max(0, Math.min(1, value)));
  });
}
