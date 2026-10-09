// Grid sampling shared by mouse/touch Step strokes. Filling crossed grid
// lines avoids holes when pointer events are coalesced by a busy renderer.
import { TIMELINE_MAX_SOURCE_POINTS } from './source.js';
export function timelineStepSamples(from, to, { step, origin = 0, min = 0, max = Infinity }) {
  if (!(step > 0) || !Number.isFinite(step) || ![from.beat, from.value, to.beat, to.value, origin, min].every(Number.isFinite) ||
      !(Number.isFinite(max) || max === Infinity) || max < min)
    return null;
  const clamp = beat => Math.max(min, Math.min(max, beat));
  const a = Math.round((from.beat - origin) / step), b = Math.round((to.beat - origin) / step);
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || Math.abs(b - a) + 1 > TIMELINE_MAX_SOURCE_POINTS) return null;
  const direction = b >= a ? 1 : -1, samples = [];
  for (let i = a; direction > 0 ? i <= b : i >= b; i += direction) {
    const beat = clamp(origin + i * step), fraction = a === b ? 1 : (i - a) / (b - a);
    samples.push({ beat, value: from.value + (to.value - from.value) * fraction });
  }
  return samples;
}
