// THE SLICE LAW: a clip cut at a world beat becomes two instances of its ONE source; the right half's offset continues
// the source, so a curve's value, a pattern's grid phase and an audio envelope run on through the cut. A curve source
// also gains two coincident points at the cut ("brand new points in the breaks"), valued at the curve there, each half's
// tension matched at its own midpoint (MIR's SINE_TENSION law), so the shape holds. A kind vetoes with slice() → null.
import { clipKind } from './kinds.js';
import { evaluateTimelineSource, TIMELINE_MAX_SOURCE_POINTS } from './source.js';
import { TENSION_OCT } from '../modulation/curve.js';

export const SLICE_MIN = 1 / 64; // a cut closer than this to either edge is refused
const EPS = 1e-9;

// The tension whose bend passes through fraction r at its midpoint, clamped to the kit's [-1, 1].
export function midpointTension(r) {
  if (!(r > EPS && r < 1 - EPS) || Math.abs(r - .5) < EPS) return 0;
  const tau = r < .5 ? Math.log2(Math.log(r) / Math.log(.5)) / TENSION_OCT : -Math.log2(Math.log(1 - r) / Math.log(.5)) / TENSION_OCT;
  return Math.max(-1, Math.min(1, tau));
}

// The plan for a curve source cut at source beat `cut`: the value there, points to add, the left segment's new tension.
export function curveCut(curve, cut) {
  const pts = curve.points, L = curve.length, value = evaluateTimelineSource(curve, cut);
  const at = pts.filter(p => Math.abs(p.t * L - cut) < EPS);
  if (at.length) return { value, add: Math.max(0, 2 - at.length), index: -1, left: null, right: at.at(-1).tension };
  const index = pts.findLastIndex(p => p.t * L < cut), a = pts[index], b = pts[index + 1];
  if (!a || !b || a.segment === 'hold' || Math.abs(b.v - a.v) < EPS) return { value, add: 2, index: -1, left: null, right: a && b ? a.tension : 0 };
  const fit = (lo, hi, from, to) => Math.abs(to - from) < EPS ? 0 : midpointTension((evaluateTimelineSource(curve, (lo + hi) / 2) - from) / (to - from));
  return { value, add: 2, index, left: fit(a.t * L, cut, a.v, value), right: fit(cut, b.t * L, value, b.v) };
}

// Slice clips at a world beat, every cut one undo. Returns [{ left, right }] for the clips that took the cut, or null.
export function sliceClips(model, ids, beat) {
  const done = [];
  model.begin();
  for (const id of ids) {
    const doc = model.state(), clip = doc.clips.find(c => c.id === id), curve = clip && doc.curves.find(c => c.id === clip.curveId);
    if (!curve || !(beat > clip.start + SLICE_MIN && beat < clip.start + clip.duration - SLICE_MIN)) continue;
    const kind = clipKind(curve), cut = clip.offset + (beat - clip.start) * clip.scale;
    if (kind?.slice && !kind.slice(curve, cut)) continue;
    if (!kind) {
      const plan = curveCut(curve, cut);
      if (curve.points.length + plan.add > TIMELINE_MAX_SOURCE_POINTS) continue;
      if (plan.left != null) model.setTension(curve.id, plan.index, plan.left);
      for (let k = 0; k < plan.add; k++) { const r = model.addPoint(curve.id, cut, plan.value, plan.right); if (!r || r.index < 0) { model.cancel(); return null; } }
    }
    const right = model.duplicate(clip.id);
    if (!right) { model.cancel(); return null; }
    model.updateClip(clip.id, { duration: beat - clip.start });
    model.updateClip(right, { start: beat, duration: clip.start + clip.duration - beat, offset: cut });
    done.push({ left: clip.id, right });
  }
  if (done.length) model.commit(); else model.cancel();
  return done.length ? done : null;
}
export const sliceClip = (model, id, beat) => sliceClips(model, [id], beat)?.[0] ?? null;
