/* tools/conduct-score.js — THE CONDUCTOR (026 A2), a PAGE module fetched on demand (device-report.js' road: the lab reaches it by import() and never
 * precaches it — lab/ had 14.9 KB left under the PWA's 8 MiB ceiling and this is 26 KB, and only a driver ever loads it): a SCORE (docs/conductor/SCORE.md — one JSON in bars, beats and the targets' own units) applied
 * through the app's live doors into a project, in the plan's order: base · system · molecule · look · camera · overlays · nodes · tempo ·
 * lanes · triggers · audio · active · save.  `__LW.conduct.apply(score)` (lab/shell/facade.js) → the report: what was applied, every refusal
 * by name (an unknown target, a molecule that would not solve, a lane on a target an audio band already covers) and every value clamped.
 * THE SCORE THINKS IN BARS: every time is a beat on the ruler (bars · meter); a value is in its target's unit and reaches the curve through
 * the registry's toNorm.  The arrangement is built here as the kit's timeline document (one model lane per score lane, a curve and its
 * clips; a `repeat` is N clips of one short curve; `step` is the source's own HOLD segment) and handed to the model's restore, which
 * validates it whole; the audio bands are then added on the film-obey road (audioClipFromFile → the editor's addClip; the app's timeline
 * installs no audio drop).  The NODES graph is set live and stays out of the saved project (lab/nodes.js: a device record).
 * DOM-free at its top: the pure half (readScore, laneCurve, pulses, timelineDoc, modeIndex) runs in node (tests/conduct.test.mjs). */
import { STYLE_NAMES, WAVE_VIEWS } from '../lab/field.js';
import { PRESETS as PALETTES } from '../lab/mir/palette.js';

export const SCORE_KEYS = ['conduct', 'name', 'title', 'notes', 'tempo', 'bars', 'base', 'system', 'molecule', 'look', 'camera', 'overlays', 'nodes', 'audio', 'lanes', 'triggers', 'render'];
export const METERS = [1, 2, 3, 4, 5, 6, 7, 8, 12];
export const BANDS = ['level', 'low', 'mid', 'high'];
export const PULSE = 1 / 8;   // a trigger's high, in beats
const STYLE_ALIAS = { shell: 'glass', 'shell±': 'glassSigned', shellsigned: 'glassSigned', add: 'additive', balls: 'glass', sticks: 'glass' };   // 032 O1: BALLS and STICKS are SIZE / RADIUS > 0 on glass
const clamp01 = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
const num = (v) => typeof v === 'number' && Number.isFinite(v);

/** 'h:n:l:m' → the register's index (BASIS order: n, then l, then m), or -1 */
export function modeIndex(id) {
  const m = /^h:(\d):(\d):(-?\d)$/.exec(String(id)); if (!m) return -1;
  const [n, l, mm] = [+m[1], +m[2], +m[3]]; if (n < 1 || n > 7 || l >= n || Math.abs(mm) > l) return -1;
  return (n - 1) * n * (2 * n - 1) / 6 + l * l + mm + l;
}
/** a mode as the score writes it ('h:2:1:1' · ['h:2:1:1', amp, phase] · { id, re, im }) → { id, re, im } or null */
export function modeOf(x) {
  if (typeof x === 'string') return modeIndex(x) >= 0 ? { id: x, re: 1, im: 0 } : null;
  if (Array.isArray(x)) { const [id, a = 1, ph = 0] = x; return modeIndex(id) >= 0 && num(a) && num(ph) ? { id, re: a * Math.cos(ph), im: a * Math.sin(ph) } : null; }
  if (x && typeof x === 'object') return modeIndex(x.id) >= 0 ? { id: x.id, re: num(x.re) ? x.re : 1, im: num(x.im) ? x.im : 0 } : null;
  return null;
}
/** a word for an integer target (a STYLE, a VIEW, a palette id) → its number; a number passes */
export function indexOf(target, v) {
  if (typeof v !== 'string') return v;
  const w = v.trim();
  if (target === 'material.style') { const i = STYLE_NAMES.indexOf(STYLE_ALIAS[w.toLowerCase()] || w); return i >= 0 ? i : NaN; }
  if (target === 'material.view') { const i = WAVE_VIEWS.indexOf(w.toLowerCase()); return i >= 0 ? i : NaN; }
  if (target === 'palette.index') { const i = PALETTES.findIndex((p) => p.id === w); return i >= 0 ? i : NaN; }
  return NaN;
}

/** readScore(score) → { score, total, refused }: the defaults filled, a fatal refusal leaves score null */
export function readScore(input) {
  const refused = [];
  let s = input;
  if (typeof s === 'string') { try { s = JSON.parse(s); } catch (e) { return { score: null, refused: [{ key: 'score', why: 'not JSON: ' + e.message }] }; } }
  if (!s || typeof s !== 'object' || Array.isArray(s)) return { score: null, refused: [{ key: 'score', why: 'a score is one JSON object' }] };
  if (s.conduct !== 1) return { score: null, refused: [{ key: 'conduct', why: 'this build reads SCORE v1 ("conduct": 1)' }] };
  for (const k of Object.keys(s)) if (!SCORE_KEYS.includes(k) && !k.startsWith('_')) refused.push({ key: k, why: 'not a SCORE key (ignored)' });
  const tempo = { bpm: 120, meter: 4, ...(s.tempo || {}) };
  if (!num(tempo.bpm) || tempo.bpm < 10 || tempo.bpm > 999) return { score: null, refused: [...refused, { key: 'tempo.bpm', why: 'a tempo is 10…999 BPM' }] };
  if (!METERS.includes(tempo.meter)) { refused.push({ key: 'tempo.meter', why: 'a meter is one of ' + METERS.join(' ') + ' (4 used)' }); tempo.meter = 4; }
  const bars = s.bars === undefined ? 4 : s.bars;
  if (!num(bars) || bars <= 0) return { score: null, refused: [...refused, { key: 'bars', why: 'bars is a positive number' }] };
  const name = String(s.name || 'UNTITLED').replace(/[\\/]+/g, ' ').trim().slice(0, 80) || 'UNTITLED', total = bars * tempo.meter;
  const render = { fps: 30, size: '1080p', format: 'mp4', nodes: 'on', chrome: 'labels', range: [0, total], ...(s.render || {}) };
  if (!Array.isArray(render.range) || !num(render.range[0]) || !num(render.range[1]) || render.range[1] <= render.range[0] || render.range[0] < 0) { refused.push({ key: 'render.range', why: 'a range is [startBeat, endBeat] (the whole score used)' }); render.range = [0, total]; }
  return { score: { ...s, name, tempo, bars, render, lanes: Array.isArray(s.lanes) ? s.lanes : [], triggers: Array.isArray(s.triggers) ? s.triggers : [] }, total, refused };
}

/* a wrapped target's values as TURNS (unbounded), split at every seam: a yaw from 4.37 to 10.65 is one turn, drawn 0.70 → 1 | 0 → 0.70.
   The seams are placed linearly (a bent segment that crosses a seam is bent piece by piece); a step holds each angle */
function seams(pts) {
  const out = [], fr = (x) => x - Math.floor(x), isInt = Number.isInteger;
  pts.forEach((q, i) => {
    if (!i || q.hold) { out.push({ ...q, v: fr(q.x) }); return; }
    const p = pts[i - 1], up = q.x > p.x;
    if (p.hold) { out.push({ ...q, v: fr(q.x) }); return; }
    const start = up || !isInt(p.x) ? fr(p.x) : 1;
    if (out.at(-1).v !== start) out.push({ ...p, v: start });
    const ks = []; for (let k = Math.floor(Math.min(p.x, q.x)) + 1; k < Math.max(p.x, q.x); k++) ks.push(k);
    if (!up) ks.reverse();
    for (const k of ks) { const t = p.t + (k - p.x) / (q.x - p.x) * (q.t - p.t); out.push({ t, v: up ? 1 : 0, tension: 0 }, { t, v: up ? 0 : 1, tension: p.tension }); }
    out.push({ ...q, v: up && isInt(q.x) ? 1 : fr(q.x) });
  });
  return out;
}

/** laneCurve(lane, { total, describe(id) → { map, min, max } | null, toNorm(id, v) }) → { targetId, name, length, points, clips: [[start, duration]], clamps }
 *  or { why }.  Points are [beat, value, tension?]: ABSOLUTE beats from 0, or RELATIVE to span[0] when the lane has a span; `repeat` N makes the
 *  curve N beats long, placed every N beats across the span */
export function laneCurve(lane, { total, describe, toNorm }) {
  const id = lane && lane.target, D = id ? describe(id) : null;
  if (!D) return { why: 'no such target "' + id + '"' };
  const shape = lane.shape || 'linear'; if (!['linear', 'smooth', 'step'].includes(shape)) return { why: 'shape is linear | smooth | step' };
  const span = lane.span === undefined ? [0, total] : lane.span;
  if (!Array.isArray(span) || !num(span[0]) || !num(span[1]) || span[0] < 0 || span[1] <= span[0]) return { why: 'span is [startBeat, endBeat]' };
  const [s, e] = span, rep = lane.repeat;
  if (rep !== undefined && !(num(rep) && rep > 0)) return { why: 'repeat is a positive number of beats' };
  if (!Array.isArray(lane.points) || !lane.points.length) return { why: 'a lane needs points [[beat, value], …]' };
  const clamps = [], raw = [];
  for (const P of lane.points) {
    if (!Array.isArray(P) || !num(P[0]) || P[0] < 0) return { why: 'a point is [beat ≥ 0, value, tension?]' };
    let v = indexOf(id, P[1]); if (!num(v)) return { why: 'the value ' + JSON.stringify(P[1]) + ' is not a number for ' + id };
    if (!lane.norm && D.map !== 'wrap' && !['trigger', 'toggle'].includes(D.map) && (v < D.min || v > D.max)) { const to = Math.max(D.min, Math.min(D.max, v)); clamps.push({ target: id, value: v, to }); v = to; }
    raw.push({ b: P[0], v, tension: num(P[2]) ? Math.max(-1, Math.min(1, P[2])) : null });
  }
  raw.sort((a, b) => a.b - b.b);
  let length = rep !== undefined ? rep : e - s; length = Math.max(length, raw.at(-1).b) || 1;
  /* x is the curve's coordinate: 0…1 (norm, or the registry's toNorm), or TURNS for a wrapped target (split at its seams below).  step holds each
     value to the next point; smooth puts an ease-in / ease-out pair (a midpoint in x) on every segment the score left unbent */
  const wrap = !lane.norm && D.map === 'wrap', xOf = (v) => (lane.norm ? clamp01(v) : wrap ? (v - D.min) / (D.max - D.min) : clamp01(toNorm(id, v)));
  let pts = raw.map((r) => ({ t: r.b / length, x: xOf(r.v), tension: shape === 'step' ? 0 : r.tension ?? 0, own: r.tension !== null, hold: shape === 'step' }));
  if (shape === 'smooth') {
    const sm = [];
    pts.forEach((p, i) => { const q = pts[i + 1], bend = q && !p.own && q.t > p.t && q.x !== p.x; sm.push({ ...p, tension: bend ? 0.5 : p.tension });
      if (bend) sm.push({ t: (p.t + q.t) / 2, x: (p.x + q.x) / 2, tension: -0.5 }); });
    pts = sm;
  }
  const out = wrap ? seams(pts) : pts.map((p) => ({ ...p, v: p.x }));
  if (out.length === 1) out.push({ ...out[0], t: 1 });
  if (out[0].t > 0) out.unshift({ ...out[0], t: 0 });
  if (out.at(-1).t < 1) out.push({ ...out.at(-1), t: 1, hold: false });
  if (out.length > 256) return { why: 'more than 256 points on one curve' };
  const points = out.map((p) => ({ t: p.t, v: p.v, tension: p.hold ? 0 : p.tension, ...(p.hold ? { segment: 'hold' } : {}) }));
  const clips = [];
  if (rep !== undefined) for (let b = s; b < e - 1e-9 && clips.length < 4096; b += rep) clips.push([b, Math.min(rep, e - b)]);
  else clips.push([s, e - s]);
  return { targetId: id, name: lane.name || D.label || id, length, points, clips, clamps, ...(D.map === 'integer' && D.steps ? { steps: D.steps } : {}) };   // 032: an EVENT lane remembers its bands
}

/** pulses(beats, total) → the 0 → 1 → 0 points of an action's trigger lane: high for PULSE beats at each beat listed */
export function pulses(at, total) {
  const pts = [{ t: 0, v: 0, tension: 0, segment: 'hold' }];
  for (const b of [...new Set(at)].filter((x) => num(x) && x >= 0 && x < total).sort((a, b) => a - b)) pts.push({ t: b / total, v: 1, tension: 0, segment: 'hold' }, { t: Math.min(1, (b + PULSE) / total), v: 0, tension: 0, segment: 'hold' });
  pts.push({ t: 1, v: 0, tension: 0 });
  return pts;
}

/** timelineDoc(score, total, { describe, toNorm, resolve(id) → id, bandTargets }) → { doc, report: { lanes, refused, clamps }, bandLanes }
 *  A BAND OWNS ITS TARGET: a lane on a target an audio band drives is refused.  THE HIGHEST LANE WINS (032, the kit's alpha.21): two lanes on one
 *  target may overlap — the earlier `lanes[]` entry is the higher lane in the timeline and plays where they meet; the overlap is said in notes, never refused.
 *  A lane's `mute: true` places its clips disabled (DISABLE CLIP: kept for the curve, never played). */
export function timelineDoc(score, total, { describe, toNorm, resolve = (x) => x, bandTargets = [] }) {
  let seq = 0; const nid = (k) => k + (++seq);
  const lanes = [], curves = [], clips = [], refused = [], clamps = [], cover = new Map(), applied = [], notes = [], laneCover = new Map();
  const covered = (t, a, b) => (cover.get(t) || []).some(([x, y]) => a < y - 1e-9 && b > x + 1e-9), hold = (t, a, b) => { if (!cover.has(t)) cover.set(t, []); cover.get(t).push([a, b]); };
  const [r0, r1] = score.render.range;
  for (const t of bandTargets) hold(t, r0, r1);
  const place = (c, label) => {
    if (lanes.length >= 32) { refused.push({ key: label, why: 'the timeline holds 32 lanes' }); return; }
    if (c.clips.some(([a, d]) => covered(c.targetId, a, a + d))) { refused.push({ key: label, why: c.targetId + ' is an audio band\'s there: a band owns its target over the render range' }); return; }
    const over = (laneCover.get(c.targetId) || []).filter(([x, y, who]) => c.clips.some(([a, d]) => a < y - 1e-9 && a + d > x + 1e-9)).map(([, , who]) => who);
    if (over.length) notes.push(label + ' overlaps ' + [...new Set(over)].join(', ') + ' on ' + c.targetId + ': the higher lane (the earlier entry) plays where they meet (032)');
    const lane = { id: nid('lane'), name: String(c.name).slice(0, 80) }, curve = { id: nid('curve'), targetId: c.targetId, name: String(c.name).slice(0, 80), color: '#a7adb8', length: c.length, min: 0, max: 1, points: c.points, ...(c.steps ? { steps: c.steps } : {}) };
    lanes.push(lane); curves.push(curve);
    for (const [a, d] of c.clips) { clips.push({ id: nid('clip'), curveId: curve.id, laneId: lane.id, start: a, duration: d, offset: 0, scale: 1, mute: c.mute === true, followSourceEnd: false }); if (!laneCover.has(c.targetId)) laneCover.set(c.targetId, []); laneCover.get(c.targetId).push([a, a + d, label]); }
    applied.push(label + (c.mute === true ? ' (disabled)' : ''));
  };
  score.lanes.forEach((L, i) => {
    const label = 'lanes[' + i + '] ' + ((L && L.target) || '?'), c = laneCurve({ ...L, target: L && resolve(L.target) }, { total, describe, toNorm });
    if (c.why) refused.push({ key: label, why: c.why }); else { clamps.push(...c.clamps); place({ ...c, mute: L.mute === true }, label); }
  });
  const byAction = new Map();
  for (const T of score.triggers) { const a = T && String(T.action || ''); const id = a.startsWith('action.') ? a : 'action.' + a;
    if (!describe(id)) { refused.push({ key: 'triggers ' + a, why: 'no such action target "' + id + '"' }); continue; }
    byAction.set(id, [...(byAction.get(id) || []), ...(Array.isArray(T.at) ? T.at : [T.at])]); }
  for (const [id, at] of byAction) place({ targetId: id, name: id, length: total, points: pulses(at, total), clips: [[0, total]] }, 'triggers ' + id);
  const bandLanes = bandTargets.map(() => { if (lanes.length >= 32) return null; const l = { id: nid('lane'), name: 'AUDIO' }; lanes.push(l); return l.id; });
  while (lanes.length < 4) lanes.push({ id: nid('lane'), name: 'LANE ' + (lanes.length + 1) });
  return { doc: { v: 1, seq, meter: score.tempo.meter, lanes, curves, clips, active: { start: r0, end: r1 } }, report: { applied, refused, clamps, notes }, bandLanes };
}

/* ── THE LIVE HALF (the page) ─────────────────────────────────────────────────────────────────────────────────────────────────────── */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** apply(LW, score) → the report.  LW is the page's __LW; every step is a live door a hand or a file takes */
export async function apply(LW, input) {
  const { score, total, refused } = readScore(input), rep = { ok: false, applied: [], refused, clamps: [], notes: [] };
  if (!score) return rep;
  const R = LW.mod.registry, P = LW.layout.projects, tl = LW.timeline, say = (key, why) => rep.refused.push({ key, why }), did = (k) => rep.applied.push(k);
  const step = async (key, fn) => { try { const r = await fn(); if (typeof r === 'string') say(key, r); else if (r !== false) did(key); } catch (e) { say(key, String((e && e.message) || e)); } };
  const verb = async (v, args) => { const r = await LW.verbs.run([{ verb: v, args }], { who: 'CONDUCT' }); return r.refused.length ? r.refused.map((x) => x.why).join('; ') : true; };
  const put = (id, v) => { if (!R.has(id)) return 'no such target "' + id + '"'; const D = R.describeOne(id); if (D.map !== 'wrap' && (v < D.min || v > D.max)) rep.clamps.push({ target: id, value: v, to: Math.max(D.min, Math.min(D.max, v)) }); R.setBase(id, v); return true; };
  const S = score, sys = S.system || {}, look = S.look || {}, cam = S.camera || {};
  if (LW.mod.host) LW.mod.host.clock.pause();

  /* base: NEW (the empty project), a stored project's path, a project file's text, or a URL to fetch one from */
  await step('base', async () => {
    const b = S.base;
    if (b === null || b === undefined || b === 'NEW' || b === 'new') return (await P.fresh()) ? true : 'NEW did not open';
    let text = typeof b === 'string' && b.trim().startsWith('{') ? b : null;
    if (!text && P.open(String(b))) return true;
    if (!text) { const r = await fetch(String(b)); if (!r.ok) return 'base ' + b + ': HTTP ' + r.status; text = await r.text(); }
    return P.open(P.importText(text)) ? true : 'the base project did not open';
  });
  await wait(300);
  LW.mod.host.targets.sync();
  /* system: a preset (the hand's road), then the register, the A/B and the slice through the project's own restore */
  if (sys.preset) await step('system.preset', () => verb('preset', { id: String(sys.preset) }));
  if (sys.modes || sys.ab || look.slice) await step('system.register', () => {
    const d = LW.serialize(), wide = (list) => { const re = new Array(91).fill(0), im = new Array(91).fill(0); for (const x of list || []) { const m = modeOf(x); if (!m) continue; const i = modeIndex(m.id); while (i >= re.length) { re.push(0); im.push(0); } re[i] = m.re; im[i] = m.im; } if (re.length > 91) { re.length = im.length = 140; for (let i = 0; i < 140; i++) { re[i] = re[i] || 0; im[i] = im[i] || 0; } } return { re, im }; };
    if (sys.modes) { const ms = sys.modes.map(modeOf); if (ms.includes(null)) return 'system.modes: a mode is "h:n:l:m", [id, amp, phase] or { id, re, im }'; d.experiment.modes = ms.map((m) => { const [n, l, mm] = m.id.slice(2).split(':').map(Number); return { id: m.id, n, l, m: mm, re: m.re, im: m.im, muted: false, solo: false }; }); d.experiment.preset = null; }
    if (sys.ab) d.presentation.ab = { a: wide(sys.ab.a), b: wide(sys.ab.b), omega: num(sys.ab.omega) ? sys.ab.omega : 0.05, on: sys.ab.on !== false };
    if (look.slice) { const sl = { ...(d.presentation.mat.slice || {}), ...look.slice }; if (look.slice.axis !== undefined) delete sl.normal; d.presentation.mat.slice = sl; }
    LW.restore(d); return true;
  });
  if (num(sys.rate)) await step('system.rate', () => put('transport.rate', sys.rate));

  /* molecule: the verb a hand's pick takes; it waits for the solution */
  if (S.molecule) await step('molecule', async () => {
    const M = S.molecule, args = { id: String(M.id) }; for (const k of ['basis', 'method', 'view', 'orbital']) if (M[k] !== undefined) args[k] = M[k];
    const r = await verb('molecule', args); if (r !== true) return r;
    for (let i = 0; i < 600 && !(LW.chem.on && LW.chem.solution()); i++) await wait(200);
    if (!LW.chem.solution()) return M.id + ' did not solve';
    if (M.vibrate) { const v = await verb('vibrate', typeof M.vibrate === 'object' ? { on: true, ...M.vibrate } : { on: true }); if (v !== true) say('molecule.vibrate', v); }
    LW.mod.host.targets.sync(); return true;
  });

  /* look: PALETTE by id or number, its switch, the STYLE and VIEW on their targets (a molecules-only STYLE stands down while MOLECULES is off), the knobs */
  if (look.palette !== undefined) await step('look.palette', () => { const i = indexOf('palette.index', look.palette); return num(i) && PALETTES[i] ? (LW.setPalette(PALETTES[i].id), true) : 'no palette "' + look.palette + '"'; });
  if (look.paletteOn !== undefined) await step('look.paletteOn', () => { LW.palette.setOn(!!look.paletteOn); return true; });
  if (look.style !== undefined) await step('look.style', () => { const w = num(look.style) ? STYLE_NAMES[look.style] : String(look.style).trim().toLowerCase();
    if (w === 'balls' || w === 'sticks') { LW.setStyle(w); rep.notes.push('look.style ' + w + ': ' + (w === 'balls' ? 'SIZE' : 'RADIUS') + ' > 0 on glass (032)'); return LW.mat.style === STYLE_NAMES.indexOf('glass') || 'glass stands down here'; }   // the facade's lift: SHELL with the knob raised
    const i = indexOf('material.style', look.style); if (!num(i)) return 'no style "' + look.style + '"'; put('material.style', i);
    return LW.mat.style === i || (STYLE_NAMES[i] === 'grain' && STYLE_NAMES[LW.mat.style] === 'dust') ? true : STYLE_NAMES[i] + ' stands down here (a MOLECULES style with MOLECULES off)'; });
  if (look.view !== undefined) await step('look.view', () => { const i = indexOf('material.view', look.view), chem = LW.chem && LW.chem.on;
    return num(i) && !chem ? put('material.view', i) : verb('view', { id: String(num(look.view) ? WAVE_VIEWS[look.view] : look.view) }); });   // a MOLECULES view (esp, orbital…) on the verb's road
  for (const [k, id] of [['exposure', 'material.exposure'], ['softness', 'material.softness'], ['iso', 'material.iso'], ['grain', 'material.grain'], ['knee', 'material.knee'], ['gamma', 'material.gamma'], ['stage', 'material.stage'], ['hue', 'material.hue']])
    if (look[k] !== undefined) await step('look.' + k, () => (num(look[k]) ? put(id, look[k]) : k + ' is a number'));
  if (look.invert !== undefined) await step('look.invert', () => { LW.setInvert(!!look.invert); return true; });
  if (Array.isArray(look.ground)) await step('look.ground', () => { LW.mat.stageCustom = look.ground.slice(0, 3).map((v) => Math.max(0, Math.min(1, +v || 0))); const f = document.querySelector('button.stage-follow'); if (f && f.classList.contains('on')) f.click(); put('material.stage', num(look.stage) ? look.stage : 1); return true; });   // 026 F3: the stage colour at STAGE 100 % (a film wants its own ground, not the theme's)
  if (look.frame !== undefined) await step('look.frame', () => { LW.setFrame(!!look.frame); return true; });     // 026 F2: the field's FRAME and AXIS (PREFERENCE; a film wants them off)
  if (look.axis !== undefined) await step('look.axis', () => { LW.setAxis(!!look.axis); return true; });
  if (S.render && S.render.caption === false) await step('render.caption', () => { if (LW.stageText && LW.stageText.setOn) LW.stageText.setOn(false); return true; });   // 026 F2: no caption on the frame (the STAGE FORMULA's text is the film's caption)
  if (look.slice) did('look.slice');

  /* camera: the six observer targets (a film refuses a moving camera: AUTO-ROTATE goes off unless the score says otherwise) */
  if (S.camera) {
    if (cam.mode) await step('camera.mode', () => { LW.setCamMode(cam.mode, true); return true; });
    await step('camera.autoRotate', () => verb('camera', { autoRotate: !!cam.autoRotate }));
    const pan = Array.isArray(cam.pan) ? cam.pan : [cam.panx, cam.pany];
    for (const [k, id, v] of [['yaw', 'observer.yaw', cam.yaw], ['pitch', 'observer.pitch', cam.pitch], ['dist', 'observer.dist', cam.dist ?? cam.zoom], ['fov', 'observer.fov', cam.fov], ['panx', 'observer.panx', pan[0]], ['pany', 'observer.pany', pan[1]]])
      if (v !== undefined) await step('camera.' + k, () => (num(v) ? put(id, v) : k + ' is a number'));
  }
  /* overlays: PARTICLES (COUNT, TRAIL, the switch the hand's way), VORTEX's LOCATE */
  const O = S.overlays || {};
  if (O.particles) await step('overlays.particles', async () => {
    const p = typeof O.particles === 'object' ? O.particles : { on: !!O.particles }, U = LW.particleUI;
    if (num(p.count)) U.n.set(p.count); if (num(p.trail)) { U.trail.set(p.trail); LW.particles.setTrail(Math.round(p.trail)); }
    return verb('switch', { id: 'particles', on: p.on !== false });
  });
  if (O.vortex !== undefined) await step('overlays.vortex', () => verb('switch', { id: 'locate', on: !!(typeof O.vortex === 'object' ? O.vortex.on : O.vortex) }));

  /* nodes: the graph replaced, in chain order; a node's id is the graph's, so `nodes.<type>.<knob>` (or `<type>#2`) is resolved below */
  const placed = new Map();
  if (Array.isArray(S.nodes)) await step('nodes', () => {
    const N = LW.nodes, old = N.nodes().map((q) => q.id); if (old.length) N.remove(old);
    for (const q of S.nodes) { const id = q && N.add(String(q.type), { values: q.knobs || {}, bypass: !!q.bypass }); if (!id) { say('nodes ' + (q && q.type), 'no such node type'); continue; } placed.set(q.type, [...(placed.get(q.type) || []), id]); }
    return true;
  });
  const resolve = (id) => { const m = /^nodes\.([^.]+)\.(.+)$/.exec(String(id || '')); if (!m || R.has(id)) return id; const [type, k] = m[1].split('#'), ids = placed.get(type) || [], n = ids[(+k || 1) - 1]; return n ? 'nodes.' + n + '.' + m[2] : id; };

  /* tempo, then THE ARRANGEMENT (the timeline document, restored whole), then the audio bands on their own lanes */
  await step('tempo', () => { LW.mod.clock.setBpm(S.tempo.bpm); return true; });
  const A = S.audio || null, bands = A && A.bands ? Object.entries(A.bands).filter(([b]) => { if (BANDS.includes(b)) return true; say('audio.bands.' + b, 'a band is level | low | mid | high'); return false; }) : [];
  const bandSpec = bands.map(([b, x]) => { const o = typeof x === 'string' ? { target: x } : { ...(x || {}) }; return { band: b, ...o, target: resolve(o.target) }; }).filter((o) => { if (R.has(o.target)) return true; say('audio.bands.' + o.band, 'no such target "' + o.target + '"'); return false; });
  const describe = (id) => (R.has(id) ? R.describeOne(id) : null), toNorm = (id, v) => R.toNorm(id, v);
  const built = timelineDoc(S, total, { describe, toNorm, resolve, bandTargets: bandSpec.map((o) => o.target) });
  rep.applied.push(...built.report.applied); rep.refused.push(...built.report.refused); rep.clamps.push(...built.report.clamps); rep.notes.push(...built.report.notes);
  if (!tl.model.restore(built.doc)) say('lanes', 'the timeline refused the arrangement');
  rep.keep = false;
  if (bandSpec.length) await step('audio', async () => {
    const r = await fetch(String(A.file)); if (!r.ok) return 'audio ' + A.file + ': HTTP ' + r.status;
    const blob = await r.blob(), file = new File([blob], String(A.file).split('/').pop(), { type: blob.type || 'audio/mpeg' });
    const { audioClipFromFile } = await import('../lab/mir/timeline/audio-analysis.js'), [r0, r1] = S.render.range, off = num(A.offset) ? Math.max(0, A.offset) * S.tempo.bpm / 60 : 0;
    tl.open(); await wait(400);
    try {
      for (const [i, o] of bandSpec.entries()) {
        const keep = i === 0 && A.keep !== false, laneId = built.bandLanes[i];
        if (!laneId) { say('audio.bands.' + o.band, 'no lane left'); continue; }
        let id;
        if (tl.audio && tl.audio.add) id = await tl.audio.add(file, { choice: { targetId: o.target, keep }, band: o.band, start: r0, laneId });
        else { const made = await audioClipFromFile(file, { bpm: S.tempo.bpm, keep, band: o.band }); id = tl.editor.addClip('audio', made.source, { start: r0, duration: made.duration, laneId, targetId: o.target, name: file.name, select: false }); }
        if (!id) { say('audio.bands.' + o.band, (tl.model.lastRefusal && tl.model.lastRefusal.why) || 'the clip was refused'); continue; }
        const clip = tl.model.state().clips.find((c) => c.id === id), left = clip.duration - off;
        if (left <= 0) { say('audio.offset', 'the file ends before ' + A.offset + ' s'); continue; }
        tl.model.updateClip(id, { offset: off, duration: Math.min(r1 - r0, left) });
        if (o.min !== undefined || o.max !== undefined) { const D = R.describeOne(o.target); tl.model.updateCurve(clip.curveId, { min: toNorm(o.target, num(o.min) ? o.min : D.min), max: toNorm(o.target, num(o.max) ? o.max : D.max) }); }
        if (keep) rep.keep = true;
        did('audio.bands.' + o.band + ' → ' + o.target);
      }
    } finally { tl.close(); await wait(300); }
    return false;
  });
  /* the modulation armed (the arrangement drives), the clock at the range's start, then SAVE as CONDUCT/<name> */
  if (!LW.mod.armed) LW.mod.arm(true);
  LW.mod.host.targets.sync();
  /* 026 B found: the armed arrangement writes its beat-0 values a moment after the arm (a view lane, a states lane) — a save before that
     write leaves a project that opens DIRTY.  So: settle, let the host's first pump land, settle again, then save what the arrangement made. */
  await LW.settle(); await new Promise((r) => setTimeout(r, 1500)); await LW.settle();
  rep.path = 'CONDUCT/' + score.name;
  await step('save', () => (P.save(rep.path) ? true : 'the project was not saved'));
  Object.assign(rep, { ok: true, name: score.name, bpm: S.tempo.bpm, meter: S.tempo.meter, bars: S.bars, beats: total, seconds: total * 60 / S.tempo.bpm, range: S.render.range, render: S.render,
    lanes: built.doc.lanes.length, clips: tl.model.state().clips.length });
  return rep;
}
