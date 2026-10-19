// 0.5.1 D10-19 · THE FLASH GUARD's limiter on the four luminance routes (lab/mod-port.js guardRoutes): held at 3 flashes a second while a
// modulator drives it, untouched below that, never on any other route, never on HUE; the trip said once and cleared on release; the
// constants held to tools/flash-calibrate.mjs (U8).  A fake clock for the pure cases; the real port + host for the wiring case.
import assert from 'node:assert/strict';
import { guardRoutes, FLASH_STEP, createModPort } from '../lab/mod-port.js';
import { steps } from '../tools/flash-calibrate.mjs';

/* 0 · the constants ARE the calibration */
for (const [id, s] of Object.entries(steps())) assert.ok(Math.abs(FLASH_STEP[id] - s) < 6e-5, `${id}: ${FLASH_STEP[id]} vs derived ${s}`);
assert.deepEqual(Object.keys(FLASH_STEP).sort(), ['material.exposure', 'material.gamma', 'material.knee', 'material.stage']);

const CAT = { 'material.exposure': ['EXPOSURE', 'log'], 'material.gamma': ['GAMMA', 'linear'], 'material.stage': ['STAGE', 'linear'], 'material.knee': ['KNEE', 'log'],
  'material.hue': ['HUE', 'wrap'], 'observer.yaw': ['YAW', 'wrap'], 'observer.dist': ['ZOOM', 'log'], 'reg.morph': ['MORPH', 'linear'], 'chem.kick': ['KICK', 'log'] };
/** a rig: the catalogue wrapped over a fake clock; `put(id, v)` is a modulator's write (the registry's `cur[id]` becomes v, then its set runs),
 *  `tick()` the clock's onAdvance after each frame, `got[id]` the [t, v] the def's own set received */
function rig(driven = () => true) {
  let t = 0; const said = [], got = {}, cur = {}, ticks = [];
  const defs = Object.entries(CAT).map(([id, [label, map]]) => ({ id, label, map, get: () => 0, set: (v) => (got[id] ||= []).push([t, v]) }));
  const wrapped = guardRoutes(defs, { driven: (id) => driven(id), now: () => t, say: (s) => said.push(s), read: (id) => cur[id], onAdvance: (fn) => ticks.push(fn) });
  const by = Object.fromEntries(wrapped.map((d) => [d.id, d]));
  return { got, said, cur, at: (s) => { t = s; }, put: (id, v) => { cur[id] = v; return by[id].set(v); }, tick: () => ticks.forEach((fn) => fn('tick')), by };
}
/** run a stream of (time, value) writes on a route, a clock tick after each; the sets that reached the def */
function run(R, id, seconds, value) { for (let k = 0; k * 0.05 <= seconds + 1e-9; k++) { R.at(k * 0.05); R.put(id, value(k, k * 0.05)); R.tick(); } return R.got[id]; }
/** direction reversals of the OUTPUT stream (equal repeats are a hold, not a move), and the most in any one second */
function reversals(out) {
  const r = []; let prev = null, dir = 0;
  for (const [t, v] of out) { if (prev === null || v === prev) { prev = v; continue; } const d = Math.sign(v - prev); if (dir && d !== dir) r.push(t); dir = d; prev = v; }
  return { n: r.length, perSecond: Math.max(0, ...r.map((t) => r.filter((u) => u <= t && u > t - 0.999).length)) };
}
const stop = (s) => Math.pow(2, s);
const square = (a) => (k) => (k % 2 ? stop(-a) : stop(a));     // a set every 50 ms: a 10 Hz square, ±a stops about 1

/* 1 · a 10 Hz square of ±0.3 stop on EXPOSURE is held to three flashes a second — and still moves (three a second), it is not frozen */
{
  const R = rig(), out = run(R, 'material.exposure', 3, square(0.3)), v = reversals(out);
  assert.ok(v.perSecond <= 6, `held to ≤ 6 direction changes in any second, got ${v.perSecond}`);
  assert.ok(v.n >= 8, `not frozen: swings still pass at the safe rate, got ${v.n} reversals in 3 s`);
  assert.equal(R.said.length, 1, 'the trip is said ONCE: ' + JSON.stringify(R.said));
  const m = /^FLASH GUARD · EXPOSURE (\d+\.\d) Hz held to 3\/s$/.exec(R.said[0]);
  assert.ok(m && Math.abs(+m[1] - 10) < 1, 'the sentence names the route and the rate it tried: ' + R.said[0]);
  /* a quiet second lets go: the line is cleared once, on release */
  for (let k = 0; k < 40; k++) { R.at(3.05 + k * 0.05); R.put('material.exposure', 1 + k * 1e-3); R.tick(); }
  assert.deepEqual(R.said.slice(1), [''], 'cleared once, on release: ' + JSON.stringify(R.said));
}
/* 2 · the same square at ±0.05 stop (a swing of 0.069 in ln, under the 0.0953 step) passes bit for bit, silent */
{
  const R = rig(), out = run(R, 'material.exposure', 3, square(0.05));
  assert.equal(out.length, 61); assert.ok(out.every(([, v], k) => v === square(0.05)(k)), 'every write arrived as it was given');
  assert.deepEqual(R.said, []);
}
/* 3 · a 0.1 Hz ramp (10 s from 0.5 to 2) passes untouched, silent */
{
  const R = rig(), out = run(R, 'material.exposure', 10, (k, t) => 0.5 + 1.5 * t / 10);
  assert.ok(out.every(([t, v]) => v === 0.5 + 1.5 * t / 10)); assert.deepEqual(R.said, []);
}
/* 4 · NOTHING ELSE is wrapped: the same 10 Hz square on YAW, ZOOM (a log route), MORPH and KICK passes untouched; HUE crossing its seam never trips */
for (const id of ['observer.yaw', 'observer.dist', 'reg.morph', 'chem.kick']) {
  const R = rig(), out = run(R, id, 3, square(0.3));
  assert.ok(out.every(([, v], k) => v === square(0.3)(k)), id + ' reaches its def as written'); assert.deepEqual(R.said, [], id);
}
{
  const R = rig(), seam = (k) => (k % 2 ? 0.99 : 0.01), out = run(R, 'material.hue', 3, seam);
  assert.ok(out.every(([, v], k) => v === seam(k)), 'HUE across the 1 → 0 seam is untouched'); assert.deepEqual(R.said, []);
}
/* 5 · the other three whitelisted routes are guarded in their own space: a 10 Hz square one step wide trips; a half-step wide does not (008 Q: KNEE's pair sits at its new default 3, its step ln-wide 0.4902) */
for (const [id, wide, narrow] of [['material.gamma', [1.2, 0.9], [1.03, 0.97]], ['material.stage', [0.4, 0.2], [0.34, 0.3]], ['material.knee', [4.2, 2.1], [3.1, 2.9]]]) {
  const hot = rig(), cool = rig();
  assert.ok(reversals(run(hot, id, 3, (k) => wide[k % 2])).perSecond <= 6 && hot.said.length === 1 && hot.said[0].includes(CAT[id][0]), id + ' trips: ' + JSON.stringify(hot.said));
  const out = run(cool, id, 3, (k) => narrow[k % 2]); assert.ok(out.every(([, v], k) => v === narrow[k % 2]) && !cool.said.length, id + ' below the step passes');
}
/* 6 · a write that is NOT a modulator's (a hand through the registry, the restore to the base on a stop) is never held, and lets go of a held route */
{
  let on = true; const R = rig(() => on);
  run(R, 'material.exposure', 1, square(0.3)); assert.equal(R.said.length, 1, 'tripped');
  on = false; R.at(1.1); R.put('material.exposure', 1.5);        // the stop: restoreBase publishes the base
  assert.equal(R.got['material.exposure'].at(-1)[1], 1.5, 'the restore to the base arrives exactly, in the middle of a hold'); assert.deepEqual(R.said.slice(1), ['']);
  const n = R.got['material.exposure'].length; R.at(5); R.tick(); assert.equal(R.got['material.exposure'].length, n, 'a let-go route is not swept again'); assert.deepEqual(R.said.slice(1), ['']);
}
/* 6b · D-V S1, THE QUIET SECOND: a held route whose modulator goes constant gets no more writes (the registry skips an unchanged value), so only
       the clock's ticks arrive; inside the second the hold stays, after it the route is handed the registry's number bit for bit and the line is cleared */
{
  const R = rig(), id = 'material.exposure'; let k = 0, input;
  for (; k < 200; k++) { R.at(k * 0.05); input = square(0.3)(k); R.put(id, input); R.tick(); if (R.said.length && R.got[id].at(-1)[1] !== input) break; }   // until a refused write: the last the modulator makes
  assert.ok(k < 200 && R.said.length === 1, 'a held write was reached'); const held = R.got[id].at(-1)[1], t0 = k * 0.05;
  assert.notEqual(held, input, 'the held value is not the modulator’s');
  for (let j = 1; j <= 19; j++) { R.at(t0 + j * 0.05); R.tick(); }                     // 0.95 s of silence
  assert.equal(R.got[id].at(-1)[1], held, 'inside the quiet second the hold stays'); assert.equal(R.said.length, 1);
  R.at(t0 + 1.05); R.tick();                                                          // release + one step
  assert.equal(R.got[id].at(-1)[1], input, 'after it the route is the registry’s number, exactly'); assert.deepEqual(R.said.slice(1), ['']);
  const n = R.got[id].length; for (let j = 0; j < 5; j++) { R.at(t0 + 1.1 + j * 0.05); R.tick(); }
  assert.equal(R.got[id].length, n, 'one release, not a stream'); assert.deepEqual(R.said.slice(1), ['']);
  R.at(t0 + 2); R.put(id, 1.0); R.at(t0 + 2.05); R.put(id, 1.4); assert.equal(R.got[id].at(-1)[1], 1.4, 'the guard starts fresh: a slow move after the release passes untouched');
}


/* 7 · the wiring: createModPort.install over the real host and model — a real square LFO at 10 Hz routed to EXPOSURE (0.6 stop wide) and to ZOOM
      is stepped on the modulation's own seconds (clock.step, the film's door): EXPOSURE is held, ZOOM is not wrapped, the restore is the base.
      7b is D-V S1 on the same wiring: the source is removed (its route kept) at a held moment and the clock goes on stepping */
globalThis.requestAnimationFrame ||= () => 0;
function wired() {
  let C; const said = [], seen = [], P = createModPort({ available: () => true, present: () => {}, view: () => null, onCapture: () => {}, save: () => {}, say: (s) => said.push(s) });
  const defs = Object.entries(CAT).map(([id, [label, map]]) => ({ id, label, map, min: map === 'log' ? 0.01 : 0, max: map === 'log' ? 100 : 5, group: 'x', get: () => 1, set: (v) => seen.push([C.stats().seconds, v, id]) }));
  const host = P.install(defs, ['observer', 'material', 'state', 'transport', 'field', 'chem', 'reg']); C = host.clock;
  const M = host.model, src = (M.modReset(), M.setTransport({ bpm: 150, sync: 'wall', playing: false }), M.addSource('lfo', { on: true, wave: 'square', sync: true, mult: 4 })), mac = M.macroList()[0];   // 1/16 note at 150 bpm = 10 Hz
  M.setMacro(mac.id, { sourceId: src.id });
  for (const id of ['material.exposure', 'observer.dist']) M.addRoute(mac.id, id, 0, 0.083);
  host.targets.sync(); C.recomputeRunning(); assert.ok(C.play(1000).ok, "the clock plays");
  for (let k = 0; k < 150; k++) C.step(0.02);
  return { C, M, host, src, said, seen, of: (id) => seen.filter((s) => s[2] === id) };
}
{
  const { C, M, host, said, of } = wired(), ex = of('material.exposure'), zoom = of('observer.dist');
  assert.ok(reversals(zoom).n >= 40, 'ZOOM is not wrapped: the LFO swings it freely, ' + JSON.stringify(reversals(zoom)));
  assert.ok(reversals(ex).perSecond <= 6 && reversals(ex).n >= 8, 'EXPOSURE held on the modulation clock: ' + JSON.stringify(reversals(ex)));
  assert.equal(said.length, 1); assert.match(said[0], /^FLASH GUARD · EXPOSURE (9|10|11)\.\d Hz held to 3\/s$/);
  M.modReset(); host.targets.sync(); C.step(0.02);        // the routes go: the clock restores every target to its base
  assert.equal(of('material.exposure').at(-1)[1], 1, 'the restore is the base, exactly'); assert.deepEqual(said.slice(1), [''], 'a stop clears the line');
}
{   /* 7b · D-V S1: the LFO source removed (its route kept) while EXPOSURE is held off the registry's value — the registry then skips every unchanged write */
  const { C, M, host, src, said, of } = wired(), R = host.registry, id = 'material.exposure', now = () => of(id).at(-1)[1];
  for (let k = 0; k < 100 && now() === R.read(id); k++) C.step(0.02);                  // until the picture is held off the registry's number
  assert.notEqual(now(), R.read(id), 'a held moment was reached'); M.removeSource(src.id); C.step(0.02);
  const writes = of(id).length; for (let k = 0; k < 20; k++) C.step(0.02);              // 0.4 s: the registry is quiet and the hold stays
  assert.equal(of(id).length, writes, 'the registry wrote nothing: the modulator is constant'); assert.notEqual(now(), R.read(id), 'still held inside the quiet second'); assert.equal(said.length, 1);
  for (let k = 0; k < 40; k++) C.step(0.02);                                            // release + a step
  assert.equal(now(), R.read(id), 'the route is the registry’s number, exactly'); assert.ok(R.isModulated(id), 'still modulated: the route was kept'); assert.deepEqual(said.slice(1), [''], 'the line is cleared');
  M.modReset(); host.targets.sync(); C.step(0.02); assert.equal(now(), 1, 'a stop still restores the base exactly'); assert.deepEqual(said.slice(1), ['']);
}
console.log('PASS flash routes: 4 constants = the derivation · 10 Hz ±0.3 stop held to ≤ 3 flashes/s, said once, cleared on release · ±0.05 stop, 0.1 Hz ramp, YAW/ZOOM/MORPH/KICK untouched · HUE seam silent · gamma/stage/knee guarded in their own space · hand + restore never held · a held route whose modulator goes constant is let go after the quiet second (unit and wired) · the real port and model, on the modulation clock');
