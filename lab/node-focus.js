/* lab/node-focus.js — THE FOCAL POINT ON THE STAGE (040 N1; Josh: "Perspective chromatic abberation … is supposed to come with a movable focal point;
 * show focal point when editing the node").  A kind that names a point on the stage (`focus: { x, y, when(values) }` — CHROMATIC ABERRATION's
 * FOCUS X · FOCUS Y under PERSPECTIVE) shows it as a round handle over the picture WHILE THE NODE IS EDITED: its card selected in the window, hovered
 * or holding the focus (nodes-view.js tells the model; nodes.js `editing`), or the hand on the handle itself.  A drag moves the point (stage fractions,
 * through the node's hand — a routed knob moves its BASE), two presses within 300 ms bring it home; a modulator's write moves the handle too (sync).
 * The host sits in #stage at z 19 beside the widgets (nodes.css), under INFORMATIONAL and every window, never in the occlusion mask (it is the
 * picture's own editing, not a window); H and the menu take it out with the rest.  Nothing is drawn while no node is edited, so THE LOCK never sees it.
 *   createFocusHandles(stage, { list, types, hand, edited }) → { sync() }   edited(id) → the node is being edited (the model's say) */
import { el, hint } from './mir/kit.js';

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export function createFocusHandles(stage, { list, types, hand, edited }) {
  const H = new Map(); let host = null;
  function make(q, F) {
    const h = el('div', 'nodes-focus', host); h.dataset.node = q.id; hint(h, 'FOCAL POINT — drag it · two presses bring it home');
    let t0 = -1e9;
    h.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); h.setPointerCapture(e.pointerId);
      if (e.timeStamp - t0 < 300) { t0 = -1e9; hand(q, F.x, 0.5); hand(q, F.y, 0.5); return; } t0 = e.timeStamp; h.classList.add('drag');   // 040 F3: the home press wears no drag look
      const at = (ev) => { const r = stage.getBoundingClientRect(); hand(q, F.x, +clamp01((ev.clientX - r.left) / r.width).toFixed(4)); hand(q, F.y, +clamp01((ev.clientY - r.top) / r.height).toFixed(4)); };
      const end = () => { for (const [t, f] of on) h.removeEventListener(t, f); h.classList.remove('drag'); };
      const on = [['pointermove', at], ['pointerup', end], ['pointercancel', end]]; for (const [t, f] of on) h.addEventListener(t, f);
    });
    return h;
  }
  return {
    /** the handles follow the graph: one per edited node whose kind names a point and whose values show it; the rest go */
    sync() {
      const live = new Set();
      for (const q of list()) {
        const T = types[q.type], F = T && T.focus; if (!F || q.bypass || q.plug === false || !F.when(q.values) || !(edited(q.id) || (H.has(q.id) && H.get(q.id).classList.contains('drag')))) continue;
        if (!host) { host = el('div', 'nodes-focus-host', stage); host.setAttribute('aria-hidden', 'true'); }   // the knobs carry the keyboard and the words; the handle is the hand's
        let h = H.get(q.id); if (!h) H.set(q.id, (h = make(q, F)));
        h.style.left = (clamp01(+q.values[F.x] || 0) * 100).toFixed(2) + '%'; h.style.top = (clamp01(+q.values[F.y] || 0) * 100).toFixed(2) + '%';
        live.add(q.id);
      }
      for (const [id, h] of H) if (!live.has(id)) { h.remove(); H.delete(id); }
      if (host && !H.size) { host.remove(); host = null; }
    },
  };
}
