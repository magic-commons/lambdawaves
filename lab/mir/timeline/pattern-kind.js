// THE PATTERN KIND: an ENV's step row as a clip source, painted as FL paints a pattern clip — the step grid repeated
// across the clip, lit steps in the device's colour, each repeat boundary marked. It fires, it never drives: value is
// null (the hits are the sequencer's, through activeClips(beat,'pattern')), and it slices as two instances of one row.
import { registerClipKind } from './kinds.js';
import { svgNode } from '../kit.js';

export const PATTERN_LENGTHS = [16, 32, 64];
export const PATTERN_STEP_BEATS = .25; // one step = a sixteenth note: 16 steps = one 4/4 bar

// Steps are Uint8 values (0 off, 1–127 velocity) as a plain array or base64; a typed array is refused (JSON would mangle it).
export function patternSteps(steps) {
  let bytes = null;
  if (typeof steps === 'string') { try { bytes = Array.from(atob(steps), ch => ch.charCodeAt(0)); } catch (_) { return null; } }
  else if (Array.isArray(steps)) bytes = steps;
  return bytes && PATTERN_LENGTHS.includes(bytes.length) && bytes.every(v => Number.isInteger(v) && v >= 0 && v <= 127) ? bytes : null;
}
export const patternRepeatBeats = curve => (patternSteps(curve?.steps)?.length ?? 16) * PATTERN_STEP_BEATS;

// One way to build a source from a row (lane P's → TL, a dragged row name): steps normalised to a plain array, length = steps.
export function patternSource({ envId, steps, name, color } = {}) {
  const s = patternSteps(ArrayBuffer.isView(steps) ? Array.from(steps) : steps);
  return s && envId != null ? { kind: 'pattern', envId: String(envId), steps: [...s], length: s.length, ...(name ? { name } : {}), ...(color ? { color } : {}) } : null;
}


// The grid in source beats, so a slice's right half (offset = the cut) continues the phase and a resize extends the repeats.
export function paintPattern(svg, curve, clip, { geometry, height, tint }) {
  const steps = patternSteps(curve.steps); if (!steps) return;
  const n = steps.length, from = clip.offset, to = clip.offset + clip.duration * clip.scale;
  const cell = geometry.xAtSourceBeat(PATTERN_STEP_BEATS) - geometry.xAtSourceBeat(0), fine = cell >= 3, gap = cell >= 6 ? 1 : 0, pad = 3, room = Math.max(1, height - 2 * pad);
  const first = Math.floor(from / PATTERN_STEP_BEATS + 1e-9), last = Math.ceil(to / PATTERN_STEP_BEATS - 1e-9);
  for (let k = first; k < last; k++) {
    const i = k % n, x = geometry.xAtSourceBeat(k * PATTERN_STEP_BEATS), v = steps[i];
    // FL's alternating light/dark groups of four steps, only while a step is wide enough to read.
    if (fine && (i % 4 === 0 || k === first)) svgNode('rect', { class: 'tl-pattern-group' + (Math.floor(i / 4) % 2 ? ' alt' : ''), x: geometry.xAtSourceBeat((k - i % 4) * PATTERN_STEP_BEATS), y: 0, width: cell * 4, height }, svg);
    if (v > 0) { const h = room * (.4 + .6 * v / 127); svgNode('rect', { class: 'tl-pattern-step lit', x: x + gap, y: pad + room - h, width: Math.max(1, cell - 2 * gap), height: h, rx: Math.min(2, cell / 4), fill: tint, 'data-step': i, 'data-velocity': v }, svg); }
    else if (fine) svgNode('rect', { class: 'tl-pattern-step', x: x + gap, y: pad + room * .6, width: Math.max(1, cell - 2 * gap), height: room * .4, rx: Math.min(2, cell / 4), 'data-step': i }, svg);
    // The repeat boundary: where the row starts over inside the clip.
    if (i === 0 && x > .5 && x < geometry.width - .5) svgNode('line', { class: 'tl-pattern-repeat', x1: x, x2: x, y1: 0, y2: height, 'vector-effect': 'non-scaling-stroke', 'data-repeat': Math.floor(k / n) }, svg);
  }
}

registerClipKind('pattern', {
  drives: false,
  validate: c => typeof c?.envId === 'string' && c.envId.length > 0 && (Array.isArray(c.steps) || typeof c.steps === 'string') && !!patternSteps(c.steps),
  value: () => null,
  paint: paintPattern,
  slice: curve => ({ before: curve, after: curve }), // two instances of the one row; the right offset carries the phase
  duration: curve => patternRepeatBeats(curve)
});
