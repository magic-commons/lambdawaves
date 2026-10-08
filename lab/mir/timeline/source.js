/* timeline/source.js — a curve source in musical beats (harvested whole from BASINS app/timeline-source.js, 2026-10-02).
 * Timeline sources use musical beats; the v1 project format stores normalized points plus a source length. Keep that
 * wire format without inheriting an LFO cycle's endpoint locks or its 32-point editing limit.  PURE: node runs it. */
import { bend } from '../modulation/curve.js';

export const TIMELINE_MAX_SOURCE_POINTS = 256;
// v1 previously accepted 1024 sources × 32 points. Keep that entire legacy
// arrangement capacity while allowing longer individual Timeline sources.
export const TIMELINE_MAX_TOTAL_POINTS = 32768;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Refuse an invalid/oversized whole source. Never truncate hidden automation.
export function normalizeTimelinePoints(points) {
  if (!Array.isArray(points) || points.length < 2 || points.length > TIMELINE_MAX_SOURCE_POINTS ||
      points.some(p => !p || ![p.t, p.v, p.tension].every(Number.isFinite) ||
        p.segment != null && !['single', 'hold'].includes(p.segment))) return null;
  // Omit the default shape so old v1 projects retain their exact signatures.
  // Like MIR tension, segment describes the interval STARTING at this point.
  const next = points.map(p => ({ t: clamp(p.t, 0, 1), v: clamp(p.v, 0, 1), tension: clamp(p.tension, -1, 1),
    ...(p.segment === 'hold' ? { segment: 'hold' } : {}) }));
  next.sort((a, b) => a.t - b.t); // Stable ties preserve the legacy MIR reading.
  next.at(-1).tension = 0;
  delete next.at(-1).segment;
  return next;
}

export function evaluateTimelineSource(source, sourceBeat) {
  // Preserve MIR's exact single-curve law and duplicate-time boundary reads.
  const t = clamp(Number.isFinite(sourceBeat) ? sourceBeat / source.length : 0, 0, 1), points = source.points;
  if (!points.length) return 0;
  if (points.length === 1) return points[0].v;
  if (t <= points[0].t) return points[0].v;
  if (t >= points.at(-1).t) return points.at(-1).v;
  let i = 0;
  while (i + 1 < points.length && points[i + 1].t <= t) i++;
  const a = points[i], b = points[i + 1];
  if (a.segment === 'hold') return a.v;
  // One segment lookup per playback/paint sample. Reuse MIR's bend directly,
  // with the same exact-point returns, rather than scanning the source twice.
  const f = bend((t - a.t) / (b.t - a.t), a.tension);
  if (f <= 0) return a.v;
  if (f >= 1) return b.v;
  return a.v + (b.v - a.v) * f;
}

function unchanged(source, extra = {}) {
  return { source, points: source.points, length: source.length, index: -1, ...extra };
}

function placePoint(source, index, sourceBeat, value, tension, inserting) {
  if (!Number.isFinite(sourceBeat) || !Number.isFinite(value) || !Number.isFinite(tension)) return unchanged(source, { invalid: true });
  if (inserting && source.points.length >= TIMELINE_MAX_SOURCE_POINTS) return unchanged(source, { full: true });
  if (!inserting && (!Number.isInteger(index) || index < 0 || index >= source.points.length)) return unchanged(source, { invalid: true });
  const beat = Math.max(0, sourceBeat), length = Math.max(source.length, beat);
  // Capture musical times before changing normalization. Extending the source
  // therefore never moves an existing point to a different musical beat.
  const next = source.points.map((p, ordinal) => ({ ...p, t: p.t * source.length / length, ordinal }));
  const ordinal = inserting ? next.length : index;
  const point = { t: beat / length, v: clamp(value, 0, 1), tension: clamp(tension, -1, 1), ordinal,
    ...(!inserting && source.points[index].segment === 'hold' ? { segment: 'hold' } : {}) };
  // Inserting inside a Hold keeps both resulting intervals held. Ordinary
  // Shift-right insertion continues to use the original MIR tension behavior.
  if (inserting) {
    const preceding = source.points.findLast(p => p.t * source.length <= beat);
    if (preceding?.segment === 'hold') point.segment = 'hold';
  }
  if (inserting) next.push(point); else next[index] = point;
  next.sort((a, b) => a.t - b.t || a.ordinal - b.ordinal);
  const placed = next.findIndex(p => p.ordinal === ordinal);
  const points = normalizeTimelinePoints(next);
  const edited = { ...source, length, points };
  return { source: edited, points, length, index: placed, full: false };
}

export function addTimelinePoint(source, sourceBeat, value, tension = 0) {
  return placePoint(source, -1, sourceBeat, value, tension, true);
}

export function moveTimelinePoint(source, index, sourceBeat, value) {
  return placePoint(source, index, sourceBeat, value, source.points[index]?.tension ?? 0, false);
}

export function removeTimelinePoint(source, index) {
  if (source.points.length <= 2 || !Number.isInteger(index) || index < 0 || index >= source.points.length) return unchanged(source, { removed: false });
  const points = normalizeTimelinePoints(source.points.filter((_, i) => i !== index));
  const edited = { ...source, points };
  return { source: edited, points, length: source.length, index: -1, removed: true };
}

export function setTimelineTension(source, index, tension) {
  if (!Number.isFinite(tension) || !Number.isInteger(index) || index < 0 || index >= source.points.length - 1) return unchanged(source, { invalid: true });
  const points = normalizeTimelinePoints(source.points.map((p, i) => i === index ? { ...p, tension: clamp(tension, -1, 1) } : p));
  const edited = { ...source, points };
  return { source: edited, points, length: source.length, index };
}

export function setTimelineSegment(source, index, segment) {
  if (!['single', 'hold'].includes(segment) || !Number.isInteger(index) || index < 0 || index >= source.points.length - 1)
    return unchanged(source, { invalid: true });
  const points = normalizeTimelinePoints(source.points.map((p, i) => i === index ? { ...p, segment } : p));
  return { source: { ...source, points }, points, length: source.length, index };
}

// Slide moves musical times at and after the grabbed point by ONE delta.
// Downstream values/tensions stay authored; the preceding point bounds a
// leftward move. Source growth renormalizes without stretching earlier beats.
export function slideTimelinePoint(source, index, sourceBeat, value) {
  if (!Number.isInteger(index) || index < 0 || index >= source.points.length ||
      !Number.isFinite(sourceBeat) || !Number.isFinite(value)) return unchanged(source, { invalid: true });
  const beats = source.points.map(p => p.t * source.length);
  const delta = Math.max(index ? beats[index - 1] : 0, sourceBeat) - beats[index];
  const length = Math.max(source.length, beats.at(-1) + delta);
  if (!Number.isFinite(length)) return unchanged(source, { invalid: true });
  const points = normalizeTimelinePoints(source.points.map((p, i) => ({ ...p,
    t: (beats[i] + (i >= index ? delta : 0)) / length, v: i === index ? clamp(value, 0, 1) : p.v })));
  return { source: { ...source, length, points }, points, length, index };
}

// A selected group uses one common delta from its pointer-down snapshot. Time
// clamps preserve ordering and spacing; Slide shifts the union of all tails
// once, not once per selected point. Segment metadata follows its left point.
export function moveTimelinePoints(source, indices, beatDelta, valueDelta, { slide = false } = {}) {
  const chosen = new Set(indices);
  if (!chosen.size || [...chosen].some(i => !Number.isInteger(i) || i < 0 || i >= source.points.length) ||
      !Number.isFinite(beatDelta) || !Number.isFinite(valueDelta)) return unchanged(source, { invalid: true });
  const beats = source.points.map(p => p.t * source.length), first = Math.min(...chosen);
  const shifted = new Set(slide ? beats.map((_,i)=>i).filter(i=>i>=first) : chosen);
  let lo = -Infinity, hi = Infinity, vlo = -Infinity, vhi = Infinity;
  for (const i of shifted) {
    lo = Math.max(lo, (i && !shifted.has(i-1) ? beats[i-1] : 0) - beats[i]);
    if (i+1 < beats.length && !shifted.has(i+1)) hi = Math.min(hi, beats[i+1] - beats[i]);
  }
  for (const i of chosen) { vlo = Math.max(vlo,-source.points[i].v); vhi = Math.min(vhi,1-source.points[i].v); }
  const dt = clamp(beatDelta,lo,hi), dv = clamp(valueDelta,vlo,vhi);
  const length = Math.max(source.length, beats.at(-1) + (shifted.has(beats.length-1) ? dt : 0));
  if (!Number.isFinite(length)) return unchanged(source, { invalid: true });
  const points = normalizeTimelinePoints(source.points.map((p,i)=>({...p,
    t:(beats[i]+(shifted.has(i)?dt:0))/length, v:p.v+(chosen.has(i)?dv:0)})));
  return { source:{...source,length,points}, points, length, indices:[...chosen], delta:{beat:dt,value:dv} };
}

export function removeTimelinePoints(source, indices) {
  const chosen = new Set(indices);
  if (!chosen.size || [...chosen].some(i=>!Number.isInteger(i)||i<0||i>=source.points.length) || source.points.length-chosen.size<2)
    return unchanged(source, { removed:false });
  const points=normalizeTimelinePoints(source.points.filter((_,i)=>!chosen.has(i)));
  return {source:{...source,points},points,length:source.length,index:-1,removed:true};
}

// A freehand stroke arrives as musical grid samples. Replace only the swept
// interval (including off-grid points inside it), keep both untouched tails,
// and refuse the entire batch when it would exceed the source point budget.
export function drawTimelinePoints(source, samples, { hold = false, tension = 0 } = {}) {
  if (!Array.isArray(samples) || !samples.length || !Number.isFinite(tension) ||
      samples.some(p => !p || !Number.isFinite(p.beat) || p.beat < 0 || !Number.isFinite(p.value)))
    return unchanged(source, { invalid: true });
  const unique = new Map(samples.map(p => [p.beat, p.value]));
  const beats = [...unique.keys()].sort((a, b) => a - b), lo = beats[0], hi = beats.at(-1);
  const length = Math.max(source.length, hi);
  const next = source.points.filter(p => p.t * source.length < lo - 1e-9 || p.t * source.length > hi + 1e-9)
    .map(p => ({ ...p, t: p.t * source.length / length }));
  for (const beat of beats) next.push({ t: beat / length, v: clamp(unique.get(beat), 0, 1), tension: clamp(tension, -1, 1),
    ...(hold ? { segment: 'hold' } : {}) });
  if (next.length > TIMELINE_MAX_SOURCE_POINTS) return unchanged(source, { full: true });
  // A one-sample edit of coincident legacy endpoints still needs two points.
  if (next.length < 2) return unchanged(source, { invalid: true });
  const points = normalizeTimelinePoints(next);
  return { source: { ...source, length, points }, points, length, index: points.findIndex(p => Math.abs(p.t * length - hi) < 1e-9) };
}
