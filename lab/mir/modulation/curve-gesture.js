/* MIR 1.4.2 — the curve editor's pointer law.
 *
 * This is FL Studio's envelope-editor workflow, not a look-alike inferred from
 * the drawing:
 *   right-drag empty space  add a point and place it
 *   Shift + right-click     add at the curve's current value
 *   left-drag a point       move it (Shift locks value, Ctrl locks time)
 *   left-drag a handle      change tension (Ctrl is fine adjustment)
 *   right-click a handle    reset tension
 *   Alt-left-click a point  delete it
 *
 * Source: Image-Line's Automation Clips and Fruity Envelope Controller manuals.
 * A host owns its model writes and painting, but it must ask this module what a
 * pointer means.  That keeps copied host controllers from inventing a second
 * gesture language. */

export const CURVE_GESTURES = Object.freeze({
  add: 'right-drag empty space',
  addAtLevel: 'Shift + right-click empty space',
  move: 'left-drag point',
  tension: 'left-drag tension handle',
  fineTension: 'Ctrl + left-drag tension handle',
  resetTension: 'right-click tension handle',
  deletePoint: 'Alt + left-click point'
});

const num = (v, fallback) => Number.isFinite(v) ? v : fallback;

/** Pointer position in the SVG's user coordinate system.  A CSS-sized or
 * transformed editor must not compare client pixels with viewBox coordinates:
 * that was the 1.4.1 regression that made a visible tension handle miss and
 * let the host treat the press as empty curve. */
export function svgPoint(svg, event) {
  const r = svg.getBoundingClientRect();
  let x = 0, y = 0, width = r.width, height = r.height;
  const b = svg.viewBox && svg.viewBox.baseVal;
  if (b && Number.isFinite(b.width) && b.width > 0 && Number.isFinite(b.height) && b.height > 0) {
    x = num(b.x, 0); y = num(b.y, 0); width = b.width; height = b.height;
  } else {
    const raw = String(svg.getAttribute && svg.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
    if (raw.length === 4 && raw.every(Number.isFinite) && raw[2] > 0 && raw[3] > 0) {
      [x, y, width, height] = raw;
    }
  }
  return {
    x: x + (num(event.clientX, r.left) - r.left) * width / Math.max(1, r.width),
    y: y + (num(event.clientY, r.top) - r.top) * height / Math.max(1, r.height)
  };
}

/** Nearest curve target.  Points win an actual tie; a handle that is plainly
 * closer wins.  Entries are `{x, y, i}` in SVG coordinates. */
export function curveHit(point, points, handles, radius = 20) {
  let best = null, distance = Math.max(0, radius);
  for (const p of points || []) {
    const d = Math.hypot(point.x - p.x, point.y - p.y);
    if (d < distance) { distance = d; best = { kind: 'point', i: p.i, d }; }
  }
  for (const h of handles || []) {
    const d = Math.hypot(point.x - h.x, point.y - h.y);
    if (d < distance) { distance = d; best = { kind: 'handle', i: h.i, d }; }
  }
  return best || { kind: null, i: -1, d: Infinity };
}

/** Translate one pointerdown into the one allowed editor action. */
export function curveAction(event, hit) {
  const h = hit || { kind: null };
  if (event.button === 2) {
    if (h.kind === 'handle') return 'reset-tension';
    if (h.kind === 'point') return 'point-menu';
    return 'add-point';
  }
  if (event.button !== 0) return null;
  if (h.kind === 'point') return event.altKey ? 'remove-point' : 'move-point';
  if (h.kind === 'handle') return 'move-tension';
  return null;                         // a plain left click on empty curve is inert
}

/** FL's point-axis locks: Shift locks the vertical value; Ctrl locks time. */
export function pointDrag(start, current, event) {
  return {
    x: event.ctrlKey ? start.x : current.x,
    y: event.shiftKey ? start.y : current.y
  };
}

/** FL's Shift-right-click variant keeps the curve's value at that time instead
 * of taking the pointer's vertical position. */
export function pointAddValue(event, pointerValue, curveValue) {
  return event.shiftKey && Number.isFinite(curveValue) ? curveValue : pointerValue;
}

/** Ctrl is the handle's fine modifier.  Eight-to-one is MIR's established
 * fine gear, now reached by FL's key rather than the generic knob's Shift. */
export function tensionDelta(startY, currentY, event) {
  return (currentY - startY) / (event.ctrlKey ? 8 : 1);
}

/** Deterministic analytic LFOs can become editable without asking the user to
 * choose a preset first.  S&H and DRIFT have no single-cycle breakpoint form. */
export function editablePresetForWave(wave) {
  return ({ rotate: 'sawup', sine: 'sine', tri: 'tri', sawdown: 'sawdown', square: 'square' })[wave] || null;
}
