/* timeline/cursor.js — THE CURSOR (harvested whole from BASINS app/timeline-cursor.js, 2026-10-02): one tuple
 * (beat · seconds · bar.beat · lane · clip · value · curve value · gesture), resolved from the pointer (resolve) or from
 * the edit in flight (gesture), for the readout layer.  Reads geometry the editor already owns; never duplicates its law,
 * never writes to the model.  Numbers only: nothing here is a word to translate. */
import { createClipCoordinates } from './geometry.js';
import { evaluateTimelineSource } from './source.js';
import { formatSeconds, formatBar, formatPercent } from './time-format.js';
import { isKindCurve } from './kinds.js';

const HELD_KINDS = new Set(['point', 'points', 'tension']);

export function createTimelineCursor({ editor, mod }) {
  const { view, px, model } = editor;
  const bpm = () => mod.host.model.transport.bpm;
  const meter = () => model.state().meter;
  const beatToSeconds = beat => beat * 60 / bpm();
  const fine = () => px() * bpm() / 60 >= 40;
  const inkOf = svg => { const block = svg.parentElement; return block ? getComputedStyle(block).getPropertyValue('--tl-curve-ink').trim() : ''; };

  function readers(clip, curve, svg, lx, ly) {
    const vb = svg.viewBox.baseVal, geometry = createClipCoordinates(clip, curve.length, px(), vb.height);
    const beat = Math.max(0, geometry.worldBeatAtX(lx));
    const value = ly == null ? null : geometry.valueAtY(ly);
    const curveValue = evaluateTimelineSource(curve, geometry.sourceBeatAtWorldBeat(beat));
    return { beat, value, curveValue };
  }
  function frame(beat, clipRect, clientX, clientY, held, clipText) {
    const seconds = beatToSeconds(beat), f = fine(), ink = clipRect ? clipText.ink : null;
    const rulerRect = view.ruler.getBoundingClientRect(), contentRect = view.content.getBoundingClientRect();
    const track = { x: clientX, y: rulerRect.bottom, text: formatSeconds(seconds, f), sub: formatBar(beat, meter()) };
    const vLine = { x: clientX, top: rulerRect.bottom, bottom: contentRect.bottom, ink };
    const hLine = clipRect && clientY != null ? { y: clientY, left: clipRect.left, right: clipRect.right, ink } : null;
    const clip = clipRect ? { rect: clipRect, ink, timeText: formatSeconds(seconds, f), valueText: clipText.valueText } : null;
    return { state: held ? 'held' : 'hover', track, vLine, hLine, clip };
  }

  // Pointer hover: reads whatever the pointermove target and the live DOM say. A released pointer
  // capture retargets its last event to the capturing element; elementFromPoint escapes that, here only.
  function resolve(ev) {
    if (!ev || !Number.isFinite(ev.clientX)) return null;
    let target = ev.target;
    if (!target || typeof target.closest !== 'function' || !view.shell.contains(target)) {
      target = typeof document !== 'undefined' && document.elementFromPoint ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
      if (!target || !view.shell.contains(target)) return null;
    }
    const world = view.world(ev), rawBeat = Math.max(0, world.x / px());
    const plotSvg = target.closest('svg[data-clip]');
    const titleEl = !plotSvg && target.closest('.tl-clip-title[data-clip]');
    const clipId = (plotSvg || titleEl)?.dataset.clip || null;
    if (!clipId) return frame(rawBeat, null, ev.clientX, ev.clientY, false, {});
    const clip = view.getClip(clipId), curve = view.getCurve(clip?.curveId), svg = view.plot(clipId);
    if (!clip || !curve || !svg) return frame(rawBeat, null, ev.clientX, ev.clientY, false, {});
    const rect = svg.getBoundingClientRect();
    if (!plotSvg) return frame(rawBeat, null, ev.clientX, ev.clientY, false, {}); // the title tab: no plot y under the pointer
    const vb = svg.viewBox.baseVal;
    const lx = (ev.clientX - rect.left) / rect.width * vb.width, ly = (ev.clientY - rect.top) / rect.height * vb.height;
    const r = readers(clip, curve, svg, lx, ly);
    return frame(r.beat, rect, ev.clientX, ev.clientY, false, { ink: inkOf(svg), valueText: isKindCurve(curve) ? '' : formatPercent(r.curveValue, false) }); // a kind clip has no curve value
  }

  // The edit in flight: the HELD POINT'S committed position, not the hand.
  function gesture() {
    const g = editor.gesture();
    if (!g || !HELD_KINDS.has(g.kind) || !Number.isInteger(g.index)) return null;
    const clip = view.getClip(g.clip), curve = view.getCurve(g.curve), svg = view.plot(g.clip);
    if (!clip || !curve || !svg) return null;
    const selector = g.kind === 'tension' ? `circle.tl-tension[data-handle="${g.index}"]` : `circle.tl-point[data-point="${g.index}"]`;
    const node = svg.querySelector(selector);
    if (!node) return null;
    const vb = svg.viewBox.baseVal, rect = svg.getBoundingClientRect();
    const lx = +node.getAttribute('cx'), ly = +node.getAttribute('cy');
    const r = readers(clip, curve, svg, lx, ly);
    const clientX = rect.left + lx / vb.width * rect.width, clientY = rect.top + ly / vb.height * rect.height;
    return frame(r.beat, rect, clientX, clientY, true, { ink: inkOf(svg), valueText: formatPercent(r.value, true) });
  }

  return { resolve, gesture };
}
