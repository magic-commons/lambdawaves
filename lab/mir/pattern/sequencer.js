/* pattern/sequencer.js — THE SEQUENCER: a beat-crossing watcher on the modulation clock (harvested from BASINS
 * app/pattern-sequencer.js, branch basins-ui-fixes-2026-10-01, 2026-10-02).
 *
 * It reads the transport's beats (never the wall clock), so a recorder's stepped frames fire exactly the crossings live
 * play fires.  A pattern CLIP under the playhead rules its ENV; otherwise the window's live row loops.  A hit is the
 * model's own trigger(id); a gate lets go at the step's end with release(id).
 *
 *   stepCrossings(p, b, step?) → [k]      the step boundaries k·step in [p, b), each owned by exactly one tick
 *   createPatternSequencer({ M, clock, pattern, timeline?, step? }) → { tick, reset, position, scale, stats }
 *     M         the modulation model (modulation/mod.js)
 *     clock     the modulation clock (host.js): isPlaying, isRunning, applyAll
 *     pattern   pattern/model.js createPatternModel()
 *     timeline  the timeline model (timeline/model.js; activeClips(beat, 'pattern')), or a function returning it, or null
 *
 * THE LAWS IT KEEPS (BASINS', unchanged)
 *   1. ONE HIT PER LIT STEP (Josh, 2026-10-01).  The model's play edge (modPlayEdge) fires every ENV on the beat play
 *      begins: a lit step on that beat ADOPTS that fire as its hit (its velocity, its gate) and never fires twice.
 *   2. NOTHING FIRES WHILE STOPPED; the memory follows the beat.  A seek or a jump the elapsed time cannot explain
 *      (> 1 beat) resets the memory: never a burst.
 *   3. VELOCITY is the ENV's macros carrying out × velocity/127, written after the clock advanced and applied once; it
 *      stops the moment anything else fires the ENV.  It is applied the same in a hidden tab: inside the recorder's
 *      deterministic step (clock.isStepping) as while the clock runs.
 *   4. THE CLIP UNDER THE PLAYHEAD WINS over the row for its ENV; a muted clip gives the ENV back to its row. */
import { STEP_BEATS, VEL_MAX } from './model.js';

const EPS = 1e-9, JUMP = 1;   // beats: a move this far from what the elapsed time explains is a jump, not play
/** The step boundaries k·step in [p, b): each boundary belongs to exactly one tick, so nothing fires twice. */
export function stepCrossings(p, b, step = STEP_BEATS) {
  const out = [];
  if (!(b > p)) return out;
  for (let k = Math.ceil(p / step - EPS) || 0, end = Math.ceil(b / step - EPS); k < end; k++) out.push(k);
  return out;
}
/* a clip's steps: a plain array, a typed array, or base64 (the pattern kind accepts both forms) */
const decoded = new Map();
function stepsOf(curve) {
  const v = curve && curve.steps;
  if (Array.isArray(v) || ArrayBuffer.isView(v)) return v;
  if (typeof v !== 'string') return null;
  if (!decoded.has(v)) { let out = null; try { out = Uint8Array.from(globalThis.atob(v), (c) => c.charCodeAt(0)); } catch (_) { /* not base64 */ } if (decoded.size > 256) decoded.clear(); decoded.set(v, out); }
  return decoded.get(v);
}

export function createPatternSequencer({ M, clock, pattern, timeline = null, step = STEP_BEATS }) {
  let prev = M.transport.beats, prevTime = M.transport.time;   // the play edge from here fires the step it lands on
  let plays = M.transport.plays, edgeAt = null;   // the model's play-edge count, and the beat its edge fired every ENV on
  if (pattern.bindRack) pattern.bindRack((id) => { const s = M.sourceOf(id); return !!s && s.kind === 'env'; });
  const vel = new Map();          // envId → { v, fires }: the velocity of the hit that ENV is sounding
  const gates = new Map();        // envId → the beat its held gate lets go
  const stats = { fires: 0, adopted: 0, releases: 0, resets: 0, ticks: 0 };
  const tl = () => (typeof timeline === 'function' ? timeline() : timeline);
  const clipsAt = (beat) => { const t = tl(); return t && t.activeClips ? t.activeClips(beat, 'pattern') : []; };
  function release(envId) { gates.delete(envId); M.release(envId); stats.releases++; }
  /* `adopt` — the play edge already fired this ENV on this step's beat; that IS the hit */
  function fire(envId, v, beat, adopt = false) {
    const s = M.sourceOf(envId);
    if (!s || s.kind !== 'env' || !s.on) return false;
    if (gates.has(envId)) gates.delete(envId);                     // a new hit takes the gate over
    if (adopt) stats.adopted++; else M.trigger(envId);
    vel.set(envId, { v: Math.max(1, Math.min(VEL_MAX, v)) / VEL_MAX, fires: s.fires });
    if (s.gateMode === 'gate') gates.set(envId, beat + step);
    stats.fires++; return true;
  }
  /* every pattern clip live in [p, b), grouped by ENV, each with its own boundaries in clip-local source beats */
  function clipHits(p, b) {
    const seen = new Map();
    for (const at of [p, b]) for (const { clip, curve } of clipsAt(at)) if (!seen.has(clip.id)) seen.set(clip.id, { clip, curve });
    const byEnv = new Map();
    for (const { clip, curve } of seen.values()) {
      const steps = stepsOf(curve), envId = curve.envId; if (!steps || !steps.length || typeof envId !== 'string') continue;
      const end = clip.start + clip.duration, lo = Math.max(p, clip.start), hi = Math.min(b, end);
      if (!byEnv.has(envId)) byEnv.set(envId, []);
      byEnv.get(envId).push({ clip, ranges: [clip.start, end] });
      if (!(hi > lo)) continue;
      const src = (x) => (x - clip.start) * clip.scale + clip.offset;
      for (const k of stepCrossings(src(lo), src(hi), step)) {
        const v = steps[((k % steps.length) + steps.length) % steps.length] | 0;
        if (v) byEnv.get(envId).push({ beat: clip.start + (k * step - clip.offset) / clip.scale, v });
      }
    }
    return byEnv;
  }
  const inClip = (list, beat) => list.some((e) => e.ranges && beat >= e.ranges[0] - EPS && beat < e.ranges[1] - EPS);
  /** one tick: the boundaries crossed since the previous beat fire their ENVs, in beat order → the hits fired */
  function tick() {
    const T = M.transport, b = T.beats, t = T.time;
    stats.ticks++;
    if (T.plays !== plays) { plays = T.plays; edgeAt = prev; }       // play began on `prev`: every ENV was fired there
    if (!clock.isPlaying()) { prev = b; prevTime = t; edgeAt = null; return 0; }    // stopped: nothing fires, the memory follows the beat
    if (prev === null || b < prev - EPS || Math.abs((b - prev) - (t - prevTime) * T.bpm / 60) > JUMP) { reset(b); prevTime = t; return 0; }
    const p = prev; prev = b; prevTime = t;
    if (!(b > p)) { scale(); return 0; }
    const hits = [], clips = clipHits(p, b);
    for (const [envId, list] of clips) for (const e of list) if (e.beat !== undefined) hits.push({ envId, beat: e.beat, v: e.v });
    for (const [envId, r] of pattern.rowsLive()) {
      const list = clips.get(envId);
      for (const k of stepCrossings(p, b, step)) {
        const beat = k * step; if (list && inClip(list, beat)) continue;   // the clip under the playhead wins
        const v = r.steps[k % r.length]; if (v) hits.push({ envId, beat, v });
      }
    }
    for (const [envId, until] of gates) hits.push({ envId, beat: until, release: true });
    hits.sort((x, y) => x.beat - y.beat || (x.release ? -1 : 0) - (y.release ? -1 : 0));
    let n = 0;
    for (const h of hits) {
      if (h.release) { if (h.beat < b && gates.get(h.envId) === h.beat) release(h.envId); continue; }
      if (fire(h.envId, h.v, h.beat, edgeAt !== null && Math.abs(h.beat - edgeAt) < EPS)) n++;
    }
    if (edgeAt !== null && b > edgeAt + EPS) edgeAt = null;
    scale();
    return n;
  }
  /** VELOCITY: the ENV's macros carry its output × the hit's velocity; the clock re-applies once (no second writer) */
  function scale() {
    let touched = false;
    for (const [envId, h] of vel) {
      const s = M.sourceOf(envId);
      if (!s || s.fires !== h.fires) { vel.delete(envId); continue; }   // another hand fired it: full strength again
      if (h.v >= 1) continue;
      for (const m of M.macroList()) if (m.sourceId === envId) { M.setMacro(m.id, { value: s.out * h.v }); touched = true; }
    }
    /* applied while the clock runs, AND inside the recorder's deterministic step: a hidden tab stops the realtime clock,
       and a recording made there used to keep the full-strength values the step had applied (BASINS' open item, 10-01) */
    if (touched && (clock.isRunning() || (clock.isStepping && clock.isStepping()))) clock.applyAll(false);
    return touched;
  }
  /** a seek or a loop jump: forget the previous beat (no burst), let held gates go */
  function reset(beat = M.transport.beats) {
    for (const envId of [...gates.keys()]) release(envId);
    prev = beat; prevTime = M.transport.time; edgeAt = null; stats.resets++;
  }
  /** the step a row's marker sits on: the clip's when one rules the ENV, else the row's own loop; -1 when silent */
  function position(envId, beat = M.transport.beats) {
    for (const { clip, curve } of clipsAt(beat)) {
      const steps = stepsOf(curve); if (curve.envId !== envId || !steps || !steps.length) continue;
      const k = Math.floor(((beat - clip.start) * clip.scale + clip.offset) / step + EPS);
      return { step: ((k % steps.length) + steps.length) % steps.length, clip: clip.id };
    }
    const r = pattern.row(envId); if (!r || !r.live) return { step: -1, clip: null };
    return { step: Math.floor(beat / step + EPS) % r.length, clip: null };
  }
  return { tick, reset, position, scale, stats: () => ({ ...stats, gates: gates.size, prev }) };
}
