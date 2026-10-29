/* tests/conduct.test.mjs — 026 A5: THE CONDUCTOR's pure half (tools/conduct-score.js) against the kit's own timeline model and registry:
 * points in a target's unit → a normalised curve, a step that HOLDS, a repeat that is N clips of one curve, a wrapped yaw across its seam,
 * trigger pulses, one clip per target at a beat (an audio band refuses a lane on its target), the schema's refusals, the mode index. */
import assert from 'node:assert/strict';
import { readScore, laneCurve, pulses, timelineDoc, modeIndex, modeOf, indexOf, PULSE } from '../tools/conduct-score.js';
import { createTimelineModel } from '../lab/mir/timeline/model.js';
import { createRegistry } from '../lab/mir/modulation/registry.js';
import { BASIS_INDEX } from '../lab/hydrogen.js';

const R = createRegistry({ roots: ['observer', 'material', 'palette', 'action'] }), noop = () => {};
for (const d of [{ id: 'observer.yaw', map: 'wrap', min: 0, max: 2 * Math.PI }, { id: 'material.exposure', map: 'log', min: 0.08, max: 12 },
  { id: 'material.style', map: 'integer', min: 0, max: 11, step: 1 }, { id: 'material.gamma', map: 'linear', min: 0.5, max: 2.4 },
  { id: 'action.preset.next', map: 'trigger', min: 0, max: 1 }]) R.register(d.id, { label: d.id, ...d, get: () => d.min, set: noop });
const describe = (id) => (R.has(id) ? R.describeOne(id) : null), toNorm = (id, v) => R.toNorm(id, v);
const near = (a, b, e = 1e-9, m = '') => assert.ok(Math.abs(a - b) < e, `${m} ${a} ≠ ${b}`);
const play = (score, opts = {}) => { const { score: S, total } = readScore(score), out = timelineDoc(S, total, { describe, toNorm, ...opts }), M = createTimelineModel();
  assert.equal(M.restore(out.doc), true, 'the model takes the document'); return { M, out, at: (id, b) => R.fromNorm(id, M.value(id, b)) }; };

/* the schema */
assert.equal(readScore({ conduct: 2 }).score, null);
assert.equal(readScore('{nope').score, null);
assert.equal(readScore({ conduct: 1, tempo: { bpm: 5 } }).score, null);
{ const r = readScore({ conduct: 1, bars: 2, wat: 1, tempo: { bpm: 140, meter: 9 } }); assert.equal(r.total, 8); assert.deepEqual(r.refused.map((x) => x.key), ['wat', 'tempo.meter']);
  assert.deepEqual(r.score.render.range, [0, 8]); assert.equal(r.score.name, 'UNTITLED'); }

/* the register's index is BASIS's, for all 140 */
for (const [id, i] of BASIS_INDEX) assert.equal(modeIndex(id), i, id);
assert.equal(modeIndex('h:2:2:0'), -1); assert.deepEqual(modeOf(['h:2:1:1', 2, Math.PI / 2]).re.toFixed(9), (0).toFixed(9)); assert.equal(modeOf('h:9:0:0'), null);
assert.equal(indexOf('material.style', 'shell'), 6); assert.equal(indexOf('material.view', 'imag'), 3); assert.ok(Number.isNaN(indexOf('palette.index', 'nope')));

/* linear in the unit, a log map normalised by the registry; a value off range is clamped and said */
{ const c = laneCurve({ target: 'material.gamma', points: [[0, 0.5], [8, 2.4], [8, 9]] }, { total: 8, describe, toNorm });
  assert.equal(c.clamps.length, 1); assert.equal(c.clamps[0].to, 2.4); assert.equal(c.length, 8); assert.deepEqual(c.clips, [[0, 8]]); }
{ const { at } = play({ conduct: 1, bars: 2, lanes: [{ target: 'material.exposure', points: [[0, 0.1], [8, 10]] }] });
  near(at('material.exposure', 0), 0.1, 1e-9, 'start'); near(at('material.exposure', 4), Math.sqrt(0.1 * 10), 1e-9, 'a log lane is linear in its knob');   // halfway in norm = the geometric mean
  assert.equal(laneCurve({ target: 'nope', points: [[0, 1]] }, { total: 8, describe, toNorm }).why, 'no such target "nope"'); }

/* step HOLDS until the next point (a 2-bar test: CLOUD, then SHELL at bar 2) */
{ const { at } = play({ conduct: 1, bars: 2, lanes: [{ target: 'material.style', shape: 'step', points: [[0, 'cloud'], [4, 'glass'], [6, 'sticks']] }] });
  for (const [b, w] of [[0, 0], [3.99, 0], [4, 6], [5.5, 6], [5.999, 6], [6, 10], [7.9, 10]]) assert.equal(at('material.style', b), w, 'step at beat ' + b); }

/* repeat: N clips of one short curve across the span; points relative to the span's start */
{ const { M, at } = play({ conduct: 1, bars: 4, lanes: [{ target: 'material.gamma', span: [4, 12], repeat: 2, points: [[0, 0.5], [1, 2.4], [2, 0.5]] }] });
  const D = M.state(); assert.equal(D.curves.length, 1); assert.equal(D.clips.length, 4); assert.deepEqual(D.clips.map((c) => c.start), [4, 6, 8, 10]);
  near(at('material.gamma', 5), 2.4); near(at('material.gamma', 9), 2.4); near(at('material.gamma', 8), 0.5); assert.equal(M.value('material.gamma', 2), null, 'nothing before the span'); }

/* smooth: an ease-in / ease-out pair; the middle passes the midpoint, the quarter lags a straight line */
{ const { at } = play({ conduct: 1, bars: 1, lanes: [{ target: 'material.gamma', shape: 'smooth', points: [[0, 0.5], [4, 2.4]] }] });
  near(at('material.gamma', 2), 1.45, 1e-9, 'mid'); assert.ok(at('material.gamma', 1) < 0.5 + 0.25 * 1.9, 'eases in'); assert.ok(at('material.gamma', 3) > 0.5 + 0.75 * 1.9, 'eases out'); }

/* a wrapped yaw over 1.5 turns: the angle mod 2π at every beat, across both seams */
{ const T = 2 * Math.PI, y0 = 1, y1 = 1 + 1.5 * T, { at } = play({ conduct: 1, bars: 2, lanes: [{ target: 'observer.yaw', points: [[0, y0], [8, y1]] }] });
  for (let b = 0; b < 8; b += 0.37) { const want = ((y0 + (y1 - y0) * b / 8) % T + T) % T, got = at('observer.yaw', b), d = Math.abs(((got - want) % T + T + T / 2) % T - T / 2); assert.ok(d < 1e-6, `yaw at ${b}: ${got} vs ${want}`); } }

/* triggers: ⅛-beat pulses through 0.5 */
{ const p = pulses([2, 6], 8); assert.equal(p.length, 6); const { M } = play({ conduct: 1, bars: 2, triggers: [{ action: 'preset.next', at: [2, 6] }] });
  assert.equal(M.value('action.preset.next', 1.9), 0); assert.equal(M.value('action.preset.next', 2), 1); assert.equal(M.value('action.preset.next', 2 + PULSE / 2), 1); assert.equal(M.value('action.preset.next', 2 + PULSE), 0); }

/* ONE CLIP COVERS A TARGET AT A BEAT: a band's target refuses a lane; two lanes over one span refuse the second */
{ const { out } = play({ conduct: 1, bars: 2, lanes: [{ target: 'material.exposure', points: [[0, 1]] }, { target: 'material.gamma', points: [[0, 1]] }, { target: 'material.gamma', span: [2, 4], points: [[0, 2]] }] },
    { bandTargets: ['material.exposure'] });
  assert.deepEqual(out.report.refused.map((r) => r.key), ['lanes[0] material.exposure', 'lanes[2] material.gamma']); assert.equal(out.bandLanes.length, 1); assert.equal(out.doc.active.end, 8); }
console.log('GREEN conduct: schema, mode index, linear/log/clamp, step holds, repeat = clips, smooth, wrapped yaw across seams, trigger pulses, one clip per target');
