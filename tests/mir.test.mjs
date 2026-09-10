/* tests/mir.test.mjs — the node proof of MIR: the parameter registry, the vendored
 * modulation model, and the four edges the whole modulation window will boot on.
 *
 *   node tests/mir.test.mjs
 *
 * It is deliberately NOT in test.sh.  Wiring it into the gate belongs to the rack wave
 * that owns that file; this wave owns lab/mir/** and this file and nothing else.
 *
 * The upper half reproduces, against OUR host, every measured claim the other project's
 * MIR-001 made against theirs: one real synced sine LFO driving real registry targets
 * through real macros and routes; a tempo edit that does not move the beat; a wall/dt
 * schedule that replays bit-identically; a pause that really is a pause; a rack that
 * round-trips; and an import closure with no DOM, renderer, GPU or rack module in it,
 * WALKED rather than eyeballed.
 *
 * The lower half is ours: the five map round-trips, the id grammar, and — the one that
 * matters most — that a modulator running and stopping leaves the user's own number
 * intact and recoverable to the last bit.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

import { createRegistry, idFault, MAP_KINDS } from '../lab/mir/registry.js';
import { createModHost, createTargetHost, createModClock, labParameters, model as M,
         MAX_WALL_STEP, PAUSE_MODES,
         LAB_PRESETS, LAB_PRESET_FOLDER, labPresetList, labPresetFolders, labPresetGet,
         labPresetApply, foreignPresets, presetRouteTargets, barTempo,
         resumeGrid, RESUME_LAWS } from '../lab/mir/host.js';
/* WAVE 60 · curve.js is imported HERE for the first time.  §16 asserts it is byte-identical to its
   source, which is a PROVENANCE claim and not a behavioural one — until this wave the file had 430
   correct lines, an importer, and NOT ONE GATE ON WHAT IT COMPUTES.  That is our own ANTI-PATTERN 17
   sitting inside the file Josh asked to be copied. */
import * as CV from '../lab/mir/curve.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400)));
}
const clone = (v) => JSON.parse(JSON.stringify(v));

/* ═══════════════════════════════ the rig ═══════════════════════════════════════
 * mod.js is a module SINGLETON — there is one model in the process — so every rig
 * resets it first, exactly as the other project's lab-core does.  That is a real
 * property of the port and the rack wave must know it: two modulation windows in one
 * page would share one rack. */

const PORT = () => ({
  obs: { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 },
  mat: { exposure: 1, softness: 0.7, iso: 0.06, grain: 0.35, knee: 0.6, hueShift: 0 },
  quality: { res: 96, steps: 160 },
  clock: { rate: 4, window: 6.283185307179586, setRate(r) { this.rate = r; } }
});

/* five targets, five different maps, five different route ranges — so the sample
   window has to produce five DIFFERENT numbers or the routing is not really routing */
const FIVE = [
  ['observer.yaw', 0, 0.20],        // wrap
  ['observer.pitch', 0, 0.15],      // bipolar
  ['material.exposure', 0, 0.30],   // log
  ['material.knee', 0, 0.25],       // linear
  ['field.resolution', 0, 0.40]     // integer
];

function rig(opts) {
  const o = opts || {};
  const port = PORT();
  const host = createModHost({ wall: 1000, pauseMode: o.pauseMode });
  host.install(labParameters(port));
  M.modReset();
  M.setTransport({ bpm: 60, sync: o.sync || 'wall', playing: false });
  const source = M.addSource('lfo', { label: 'MIR LFO', on: true, wave: 'sine', sync: true,
                                      mult: M.LFO_MULT_DEFAULT, phaseOff: 0, smooth: 0 });
  const macro = M.macroList()[0];
  M.setMacro(macro.id, { name: 'MIR LFO', sourceId: source.id });
  for (const [id, lo, hi] of FIVE) M.addRoute(macro.id, id, lo, hi);
  host.targets.sync();
  return { port, host, source, macro, ids: FIVE.map((f) => f[0]) };
}

/** A fixed sample window: play at wall 1000, then N deterministic steps of dt.  It
 *  records the CARD's own object at every step as well as the registry's view, so a
 *  proof can say the number really left the registry and landed on the instrument. */
function runWindow(r, n, dt) {
  r.host.clock.play(1000);
  const trace = [];
  trace.cards = [];
  for (let i = 0; i < n; i++) {
    r.host.clock.step(dt);
    trace.push(r.host.clock.snapshot());
    trace.cards.push(clone(r.port));
  }
  return trace;
}

/* ══════════════ 1 · one LFO, five targets, five distinct values ════════════════ */
{
  const r = rig();
  const trace = runWindow(r, 16, 0.0625);
  const last = trace[5].targets.filter((t) => r.ids.indexOf(t.id) >= 0);
  const distinctAcross = new Set(last.map((t) => t.norm.toFixed(12))).size;
  const yaw = trace.map((s) => s.targets.find((t) => t.id === 'observer.yaw').current.toFixed(12));
  const distinctOverTime = new Set(yaw).size;
  const allModulated = last.length === 5 && last.every((t) => t.modulated);
  const untouched = trace[15].targets.filter((t) => r.ids.indexOf(t.id) < 0);

  judge('ONE REAL SYNCED SINE LFO DRIVES FIVE REGISTRY TARGETS through real macros and routes: five routes off one macro give five distinct normalised values in the sample window',
    distinctAcross === 5 && allModulated, { distinctAcross, values: last.map((t) => t.norm) });
  judge('...and the trace itself moves: one target takes many distinct values across a 16-sample window',
    distinctOverTime >= 5, { distinctOverTime, of: yaw.length });
  judge('...while every UNROUTED parameter stays exactly on its base and is not marked modulated',
    untouched.length === 9 && untouched.every((t) => !t.modulated && Object.is(t.base, t.current)),
    { unrouted: untouched.length });
  const card = trace.cards[5];
  judge('...and the number really LEFT the registry and landed on the instrument: the Card’s own plain object moved on all five, through nothing but its own get/set adapters',
    card.obs.yaw !== 0.65 && card.obs.pitch !== 0.38 && card.mat.exposure !== 1 &&
    card.mat.knee !== 0.6 && card.quality.res !== 96,
    { yaw: card.obs.yaw, pitch: card.obs.pitch, exposure: card.mat.exposure,
      knee: card.mat.knee, res: card.quality.res });
}

/* ══════════════ 2 · 60 → 120 BPM preserves the beat at the edit edge ═══════════ */
{
  const r = rig();
  runWindow(r, 8, 0.125);
  const before = r.host.clock.snapshot();
  r.host.clock.setBpm(120);
  const edge = r.host.clock.snapshot();
  r.host.clock.step(0.125);
  const after = r.host.clock.snapshot();

  judge('CHANGING 60 BPM TO 120 PRESERVES BEATS, MODEL TIME AND SOURCE PHASE AT THE EDIT EDGE — the tempo changes what happens next, never what already happened',
    edge.bpm === 120 && before.bpm === 60 &&
    Object.is(before.beats, edge.beats) && Object.is(before.time, edge.time) &&
    Object.is(before.sources[0].phase, edge.sources[0].phase),
    { beats: [before.beats, edge.beats], time: [before.time, edge.time], phase: [before.sources[0].phase, edge.sources[0].phase] });
  judge('...and the doubled tempo takes effect from the edit forward: the next step advances twice the beats it used to',
    Math.abs((after.beats - edge.beats) - 2 * (0.125 * 60 / 60)) < 1e-12,
    { advanced: after.beats - edge.beats });
}

/* ══════════════ 3 · replaying the same wall/dt schedule is EXACT ═══════════════ */
{
  const schedule = (r) => {
    const out = [];
    r.host.clock.play(1000);
    for (let i = 0; i < 8; i++) { r.host.clock.step(0.125); out.push(r.host.clock.snapshot()); }
    r.host.clock.setBpm(120);
    out.push(r.host.clock.snapshot());
    for (let i = 0; i < 8; i++) { r.host.clock.step(0.0625); out.push(r.host.clock.snapshot()); }
    r.host.clock.pause();
    out.push(r.host.clock.snapshot());
    r.host.clock.elapseWhilePaused(0.75);
    out.push(r.host.clock.snapshot());
    r.host.clock.play();
    r.host.clock.step(0.125);
    out.push(r.host.clock.snapshot());
    return JSON.stringify(out);
  };
  const a = schedule(rig());
  const b = schedule(rig());
  judge('REPLAYING THE SAME WALL/dt SCHEDULE IS EXACTLY DETERMINISTIC — same rack, same steps, byte-identical trace of transport, source phase and every target value',
    a === b, { bytes: a.length, equal: a === b });
}

/* ══════════════ 4 · paused wall time moves nothing; resume moves again ═════════ */
{
  const r = rig({ pauseMode: 'HOLD' });     // HOLD, so a frozen value is visibly frozen
  runWindow(r, 5, 0.1);
  r.host.clock.pause();
  const paused = r.host.clock.snapshot();
  r.host.clock.elapseWhilePaused(0.75);
  const afterWall = r.host.clock.snapshot();
  const sameButWall = JSON.stringify({ ...paused, wall: 0 }) === JSON.stringify({ ...afterWall, wall: 0 });
  r.host.clock.play();
  r.host.clock.step(0.1);
  const resumed = r.host.clock.snapshot();

  judge('PAUSED WALL TIME CHANGES NO MODEL TIME, NO PHASE AND NO TARGET VALUE — 0.75 s of wall passes and the only field that moves is the wall itself',
    sameButWall && afterWall.wall > paused.wall && Object.is(paused.time, afterWall.time),
    { wall: [paused.wall, afterWall.wall], time: [paused.time, afterWall.time] });
  judge('...and RESUME ADVANCES AGAIN: model time moves and the targets move with it',
    resumed.time > paused.time &&
    resumed.targets.some((t, i) => !Object.is(t.current, paused.targets[i].current)),
    { time: [paused.time, resumed.time] });
  /* WAVE 65 · THIS BLOCK'S ARITHMETIC IS THE ONE THE RESUME LAW CHANGED, and it is updated rather
     than worked around.  `rig()`'s LFO is a plain BPM source — sync on, ANCHOR off — so its resume
     now floors the beat to its own note (a 1/4 note, 1 beat) and lands on the boundary just
     passed: 0.5 beats becomes 0, and then the 0.1 step.  The CLAIM the block was written for is
     untouched and still measured: a resume never leaps FORWARD to where the paused wall clock says
     the beat should be, which here would be 1.35.  The old identity is exactly what an ANCHORED
     source still gives, and it is measured below on one, so nothing was traded away. */
  judge('...and resume never LEAPS FORWARD to where the paused wall says the beat should be — the whole point of the re-anchor — while a plain BPM source now lands on the note boundary just passed (wave 65: 0.5 beats floors to 0, then the step)',
    Math.abs(resumed.beats - 0.1) < 1e-12 && resumed.beats < paused.beats + 0.75
      && resumed.reanchors > paused.reanchors,
    { beats: [paused.beats, resumed.beats], wouldBeIfItLeapt: paused.beats + 0.75 + 0.1,
      reanchors: [paused.reanchors, resumed.reanchors] });

  const rA = rig({ pauseMode: 'HOLD' });
  M.setSource(rA.source.id, { anchor: true });
  runWindow(rA, 5, 0.1);
  rA.host.clock.pause();
  const pausedA = rA.host.clock.snapshot();
  rA.host.clock.elapseWhilePaused(0.75);
  rA.host.clock.play();
  rA.host.clock.step(0.1);
  const resumedA = rA.host.clock.snapshot();
  judge('...and the ANCHORED source keeps that identity exactly as it always read — the beat continues from where it stopped plus the step, and the phase with it: ANCH outranks the grid, which is the whole of Josh’s "hold the current state in the curve it was on during the pause"',
    Math.abs(resumedA.beats - pausedA.beats - 0.1) < 1e-12 && resumedA.reanchors > pausedA.reanchors
      && resumedA.resume.law === 'ANCH',
    { beats: [pausedA.beats, resumedA.beats], law: resumedA.resume.law });
}

/* ══════════════ 5 · serializeRack / deserializeRack round-trips ════════════════ */
{
  const r = rig();
  const atRest = JSON.stringify(M.serializeRack());
  M.modReset({ bare: true });
  const empty = { sources: M.sourceCount(), routes: M.routeList().length, macros: M.macroList().length };
  const ok = M.deserializeRack(JSON.parse(atRest));
  const back = JSON.stringify(M.serializeRack());
  judge('serializeRack() / deserializeRack() ROUND-TRIPS IDENTICALLY through a bare reset — five routes, two macros, one LFO, byte for byte',
    ok && atRest === back && !empty.sources && !empty.routes && !empty.macros,
    { bytes: atRest.length, empty });

  /* Mid-run is the interesting case, and it is NOT a byte-identical round trip — by
     the model's own law.  A source-driven macro's `value` is a live read-out of its
     source, and a load starts at bar 1 with phase 0, so the reloaded macro reads 0
     rather than wherever the LFO happened to be.  What must hold is IDEMPOTENCE: load
     it and it stays loaded.  The rack wave needs to know this before it writes a
     "modulation is dirty" check that compares serializations. */
  runWindow(r, 4, 0.125);
  const midRun = JSON.parse(JSON.stringify(M.serializeRack()));
  M.deserializeRack(clone(midRun));
  const once = JSON.stringify(M.serializeRack());
  M.deserializeRack(JSON.parse(once));
  const twice = JSON.stringify(M.serializeRack());
  const liveMacro = midRun.macros.find((m) => m.sourceId);
  judge('...and a rack serialized MID-RUN is idempotent rather than byte-identical: a source-driven macro’s value is a live read-out and a load starts at bar 1 with phase 0, exactly as the model documents — load it twice and nothing more moves',
    once === twice && liveMacro.value !== JSON.parse(once).macros.find((m) => m.sourceId).value,
    { liveValue: liveMacro.value, afterLoad: JSON.parse(once).macros.find((m) => m.sourceId).value });
}

/* ══════════════ 6 · the import closure, WALKED ═════════════════════════════════ */
{
  const specs = (src) => {
    const out = [];
    let dynamicComputed = false;
    for (const re of [/^[ \t]*import\s[\s\S]*?from\s*['"]([^'"]+)['"]/gm,
                      /^[ \t]*import\s*['"]([^'"]+)['"]/gm,
                      /^[ \t]*export\s[\s\S]*?from\s*['"]([^'"]+)['"]/gm,
                      /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g]) {
      let m; while ((m = re.exec(src))) out.push(m[1]);
    }
    if (/\bimport\s*\(\s*[^'")\s]/.test(src)) dynamicComputed = true;
    return { out, dynamicComputed };
  };
  const closure = new Set();
  const bare = [];
  const outside = [];
  let computed = false;
  const stack = [resolve(ROOT, 'lab/mir/host.js'), resolve(ROOT, 'lab/mir/registry.js')];
  while (stack.length) {
    const file = stack.pop();
    if (closure.has(file)) continue;
    closure.add(file);
    const { out, dynamicComputed } = specs(readFileSync(file, 'utf8'));
    if (dynamicComputed) computed = true;
    for (const s of out) {
      if (!s.startsWith('.') && !s.startsWith('/')) { bare.push(s); continue; }
      const abs = resolve(dirname(file), s);
      if (relative(resolve(ROOT, 'lab/mir'), abs).startsWith('..')) outside.push(s);
      stack.push(abs);
    }
  }
  const rel = Array.from(closure).map((f) => relative(ROOT, f)).sort();
  const expected = ['lab/mir/curve.js', 'lab/mir/host.js', 'lab/mir/mod.js', 'lab/mir/registry.js'];

  judge('THE COMPLETE IMPORT CLOSURE IS EXACTLY FOUR FILES — walked from host.js and registry.js, not eyeballed: no rack, no kit, no view, no renderer, no GPU, no npm package, no computed dynamic import',
    JSON.stringify(rel) === JSON.stringify(expected) && !bare.length && !outside.length && !computed,
    { closure: rel, bare, outside, computed });

  /* precise USE patterns, not bare words: `transport.window` is a parameter id and
     must not be mistaken for the DOM's window */
  const banned = [
    [/\bdocument\s*\./, 'document.'], [/(?:^|[^.\w'"])window\s*\./, 'window.'],
    [/\bnavigator\s*\./, 'navigator.'], [/\brequestAnimationFrame\s*\(/, 'rAF'],
    [/\bcreateElement\s*\(/, 'createElement'], [/\bgetComputedStyle\s*\(/, 'getComputedStyle'],
    [/\bGPU(?:Device|Adapter|Buffer)\b/, 'WebGPU'], [/\bHTML[A-Z]\w*Element\b/, 'HTMLElement'],
    [/from\s*['"][^'"]*(?:rack|kit|moview|skin|lab)\.js['"]/, 'a rack module']
  ];
  const ourFiles = ['lab/mir/registry.js', 'lab/mir/host.js'];
  const domHits = [];
  for (const f of ourFiles) {
    const src = readFileSync(resolve(ROOT, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
    for (const [re, name] of banned) if (re.test(src)) domHits.push(f + ': ' + name);
  }
  judge('...and OUR two files name no DOM, renderer, GPU or rack symbol anywhere outside a comment',
    domHits.length === 0, { hits: domHits });

  /* the storage law: the ONE storage touch in the whole closure is mod.js's own
     guarded globalThis.localStorage, and it now points at OUR namespace */
  const modSrc = readFileSync(resolve(ROOT, 'lab/mir/mod.js'), 'utf8');
  const storage = (readFileSync(resolve(ROOT, 'lab/mir/registry.js'), 'utf8') +
                   readFileSync(resolve(ROOT, 'lab/mir/host.js'), 'utf8')).match(/localStorage|sessionStorage|indexedDB/g);
  const keyLine = /^export const PRESET_LS = '([^']+)';$/m.exec(modSrc);
  judge('...and the only storage in the closure is the vendored model’s own guarded globalThis.localStorage, pointed at the λWAVES namespace by the one forced edit — our two files touch no storage at all',
    !storage && keyLine && keyLine[1] === 'lambdawaves.q0.modpresets' && M.PRESET_LS === 'lambdawaves.q0.modpresets',
    { ourStorage: storage, presetKey: M.PRESET_LS });

  judge('...and node really has no DOM: importing the whole host defined neither document nor window',
    typeof document === 'undefined' && typeof window === 'undefined',
    { document: typeof document, window: typeof window });
}

/* ══════════════ 7 · the five maps round-trip to 1e-12 ══════════════════════════ */
{
  const R = createRegistry({ roots: ['observer', 'material', 'field', 'transport', 'state'] });
  const cell = (v) => { let x = v; return { get: () => x, set: (n) => { x = n; } }; };

  const cases = [
    ['material.knee', { map: 'linear', min: 0, max: 1 }, [0, 1e-9, 0.25, 0.5, 0.6, 1 - 1e-9, 1]],
    ['observer.dist', { map: 'log', min: 0.4, max: 40 }, [0.4, 0.5, 1, 3.3, 12.75, 39.999, 40]],
    ['observer.yaw', { map: 'wrap', min: 0, max: 2 * Math.PI }, [0, 0.65, Math.PI, 5.9, 2 * Math.PI - 1e-6]],
    ['field.resolution', { map: 'integer', min: 32, max: 192, step: 32 }, [32, 64, 96, 128, 160, 192]],
    ['observer.pitch', { map: 'bipolar', min: -Math.PI / 2, max: Math.PI / 2 }, [-Math.PI / 2, -1, -1e-9, 0, 1e-9, 0.38, Math.PI / 2]]
  ];
  const worst = {};
  let allOk = true;
  for (const [id, spec, values] of cases) {
    R.register(id, { ...spec, ...cell(values[0]) });
    let w = 0;
    for (const v of values) {
      const back = R.fromNorm(id, R.toNorm(id, v));
      const err = Math.abs(back - R.snap(id, v));
      if (!(err <= 1e-12)) allOk = false;
      if (err > w) w = err;
    }
    worst[spec.map] = w;
  }
  judge('EVERY MAP KIND ROUND-TRIPS value → norm → value TO 1e-12 — linear, log with min > 0, wrap, integer snapping and bipolar',
    allOk, worst);

  /* the four things a naive implementation gets wrong */
  const asym = createRegistry();
  asym.register('material.grain', { map: 'bipolar', min: -1, max: 3, get: () => 0, set: () => {} });
  judge('...the BIPOLAR map puts 0.5 EXACTLY at zero even on a lopsided range (−1 … +3), in both directions — a centre detent that is only nearly centred is a bug you find in a screenshot six months later',
    asym.toNorm('material.grain', 0) === 0.5 && asym.fromNorm('material.grain', 0.5) === 0 &&
    asym.fromNorm('material.grain', 0) === -1 && asym.fromNorm('material.grain', 1) === 3,
    { atZero: asym.toNorm('material.grain', 0), fromHalf: asym.fromNorm('material.grain', 0.5) });

  const seam = R.snap('observer.yaw', 2 * Math.PI);
  judge('...the WRAP map is a circle: its maximum IS its minimum, toNorm at the seam is 0, and a value one turn out lands back on itself',
    seam === 0 && R.toNorm('observer.yaw', 2 * Math.PI) === 0 &&
    Math.abs(R.snap('observer.yaw', 0.65 + 4 * Math.PI) - 0.65) < 1e-12,
    { seam, oneTurnOut: R.snap('observer.yaw', 0.65 + 4 * Math.PI) });

  judge('...the LOG map is exact at both ends and refuses a range that contains zero (log of zero has no dial position)',
    R.fromNorm('observer.dist', 0) === 0.4 && R.fromNorm('observer.dist', 1) === 40 &&
    (() => { try { R.register('observer.fov', { map: 'log', min: 0, max: 4, get: () => 1, set: () => {} }); return false; } catch (_) { return true; } })());

  judge('...the INTEGER map snaps to its rungs, in both directions, exactly: every rung is reachable, everything between rounds to the nearest one, and toNorm snaps BEFORE it normalises so the round trip cannot drift',
    R.fromNorm('field.resolution', 0) === 32 && R.fromNorm('field.resolution', 0.4) === 96 &&
    R.fromNorm('field.resolution', 1) === 192 &&
    R.snap('field.resolution', 97.4) === 96 && R.snap('field.resolution', 111) === 96 &&
    R.snap('field.resolution', 113) === 128 && R.snap('field.resolution', 9999) === 192 &&
    R.toNorm('field.resolution', 97.4) === R.toNorm('field.resolution', 96),
    { rungs: [0, 0.2, 0.4, 0.6, 0.8, 1].map((u) => R.fromNorm('field.resolution', u)) });

  judge('...and MAP_KINDS is exactly the five things a kit.js control already is',
    JSON.stringify(MAP_KINDS) === JSON.stringify(['linear', 'log', 'wrap', 'integer', 'bipolar']), MAP_KINDS);
}

/* ══════════════ 8 · the id grammar ═════════════════════════════════════════════ */
{
  const good = ['observer.yaw', 'material.hueshift', 'transport.rate', 'field.resolution',
                'state.mode.h:2:1:0.amp', 'state.mode.h:4:3:-2.phase'];
  const bad = ['', 'observer', 'Observer.Yaw', 'observer.', '.yaw', 'observer..yaw',
               'observer.my yaw', 'observer.yaw!', 'nonsense.thing', 'state.mode.2p0.amp',
               'state.mode.h:2:1:0', ' observer.yaw', 'observer.yaw-2', 42, null];
  const goodOk = good.every((id) => idFault(id) === null);
  const badOk = bad.every((id) => typeof idFault(id) === 'string');

  const R = createRegistry();
  let threw = null;
  try { R.register('Observer.Yaw', { min: 0, max: 1, get: () => 0, set: () => {} }); } catch (e) { threw = e; }

  judge('ID VALIDATION REJECTS A MALFORMED ID — the five shipped shapes pass, and 15 near-misses (case, empty segment, space, punctuation, an unknown root, a mode key that is not one) are each refused with a reason',
    goodOk && badOk, { accepted: good.length, refused: bad.length });
  judge('...and the refusal is a THROW at registration, not a silent null: a control registered under a typo is a ghost that takes routes and moves nothing',
    threw instanceof TypeError && /root "Observer"/.test(threw.message) && !R.has('Observer.Yaw'),
    { message: threw && threw.message });
  judge('...state.mode.* insists on a real register key h:n:l:m, so a route saved against a mode can always find its amplitude again',
    idFault('state.mode.h:2:1:0.amp') === null && typeof idFault('state.mode.2p0.amp') === 'string' &&
    typeof idFault('state.mode.h:2:1.amp') === 'string');
}

/* ══════════════ 9 · BASE vs MODULATED — the one that matters most ══════════════ */
{
  const r = rig({ pauseMode: 'BASE' });
  const reg = r.host.registry;
  const USER = 1.2345678901234567;                 /* a number no map would produce */
  reg.write('observer.yaw', USER);
  const beforeRun = reg.state('observer.yaw');

  runWindow(r, 6, 0.1);
  const running = reg.state('observer.yaw');
  const movedAway = !Object.is(running.current, USER);
  const baseHeld = Object.is(running.base, USER);

  /* the modulator stops: BASE mode returns every source-driven control to its knob */
  r.host.clock.pause();
  const stopped = reg.state('observer.yaw');
  const returned = reg.restoreBase('observer.yaw');

  judge('BASE AND CURRENT ARE SEPARATE THROUGH A WHOLE RUN: the modulator moved the current value and never touched the base the user set',
    !beforeRun.modulated && movedAway && baseHeld && running.modulated,
    { user: USER, base: running.base, current: running.current });
  judge('restoreBase() RETURNS THE USER’S NUMBER EXACTLY — not to 1e-12, bit for bit: the base is stored in value space and never round-trips through the normalised form',
    Object.is(returned, USER) && Object.is(reg.read('observer.yaw'), USER) &&
    Object.is(r.port.obs.yaw, USER) && !reg.isModulated('observer.yaw'),
    { returned, user: USER, card: r.port.obs.yaw, identical: Object.is(returned, USER) });
  judge('...and the SYNTH RULE fires on the stop edge by itself: pausing in BASE mode already put the knob back before anyone asked',
    Object.is(stopped.current, USER) && !stopped.modulated,
    { onStop: stopped.current, user: USER });

  /* turning the knob UNDER a running LFO moves the base, not the fight */
  const r2 = rig();
  runWindow(r2, 4, 0.1);
  const mid = r2.host.registry.state('material.exposure');
  r2.host.registry.write('material.exposure', 2.5);
  const afterWrite = r2.host.registry.state('material.exposure');
  r2.host.clock.step(0.1);
  const afterStep = r2.host.registry.state('material.exposure');
  judge('...and a hand on the knob UNDER a running modulator moves the BASE and lets the modulation ride on top of it — a knob you turn while an LFO runs must feel like a knob, not like a fight',
    afterWrite.base === 2.5 && Object.is(afterWrite.current, mid.current) &&
    afterStep.base === 2.5 && !Object.is(afterStep.current, mid.current),
    { base: afterWrite.base, currentAtWrite: afterWrite.current, currentNext: afterStep.current });
}

/* ══════════════ 10 · the pause law, all four of its lines ══════════════════════ */
{
  const hold = rig({ pauseMode: 'HOLD' });
  runWindow(hold, 3, 0.1);
  const beforeHold = hold.host.registry.read('observer.yaw');
  hold.host.clock.pause();
  judge('THE PAUSE LAW · HOLD freezes a source-driven control exactly where the modulator had it',
    Object.is(hold.host.registry.read('observer.yaw'), beforeHold) && hold.host.clock.pauseMode() === 'HOLD',
    { frozen: beforeHold });

  const base = rig({ pauseMode: 'BASE' });
  runWindow(base, 3, 0.1);
  base.host.clock.pause();
  judge('THE PAUSE LAW · BASE (what ships) returns it to the knob instead',
    Object.is(base.host.registry.read('observer.yaw'), base.host.registry.baseOf('observer.yaw')),
    { at: base.host.registry.read('observer.yaw') });

  /* a hand macro has no source: it holds its value even when the clock stops, because
     a hand does not let go because the transport did */
  const hand = rig();
  const macro2 = M.addMacro('HAND');                 /* no source: a knob, not an LFO */
  M.addRoute(macro2.id, 'material.grain', 0, 1);     /* a target the LFO does not own */
  M.setMacro(macro2.id, { value: 0.8 });
  hand.host.targets.sync();
  hand.host.clock.play(1000);
  hand.host.clock.step(0.1);
  const handRunning = hand.host.registry.read('material.grain');
  hand.host.clock.pause();
  const handStopped = hand.host.registry.read('material.grain');
  judge('THE PAUSE LAW · a HAND MACRO holds its value across the stop edge in either mode — a hand does not let go because the clock did',
    Object.is(handRunning, handStopped) && handStopped !== hand.host.registry.baseOf('material.grain'),
    { running: handRunning, stopped: handStopped, base: hand.host.registry.baseOf('material.grain') });

  /* bypassing the only source makes targetValue NaN — every route on the target is
     bypassed — and the law's first line hands the parameter straight back */
  const bypass = rig();
  runWindow(bypass, 3, 0.1);
  M.setSource(bypass.source.id, { on: false });
  bypass.host.clock.applyAll(false);
  judge('THE PAUSE LAW · switching the only source OFF bypasses every route on the target, and a bypassed target goes straight back to the user’s knob',
    Object.is(bypass.host.registry.read('observer.yaw'), bypass.host.registry.baseOf('observer.yaw')) &&
    !bypass.host.registry.isModulated('observer.yaw'));
}

/* ══════════════ 11 · hot re-registration keeps the base ════════════════════════ */
{
  const R = createRegistry();
  let writes = 0, oldSet = 0, newSet = 0;
  const first = R.register('observer.dist', { label: 'OLD', map: 'log', min: 0.4, max: 40,
    get: () => 3.3, set: () => { oldSet++; } });
  R.write('observer.dist', 7.5);
  R.applyModulated('observer.dist', 12);
  const before = R.state('observer.dist');
  const off = R.subscribe('observer.dist', () => { writes++; });

  const again = R.register('observer.dist', { label: 'NEW', unit: 'a₀', map: 'log',
    min: 0.4, max: 40, get: () => 99, set: () => { newSet++; } });
  const after = R.state('observer.dist');
  R.applyModulated('observer.dist', 5);

  judge('HOT RE-REGISTRATION replaces the descriptor and the adapters, KEEPS THE BASE and the modulated state, and keeps the parameter’s place in the order and its subscribers',
    Object.is(after.base, 7.5) && after.modulated && again.label === 'NEW' && again.unit === 'a₀' &&
    first.label === 'OLD' && R.list().length === 1 && R.list()[0] === 'observer.dist' &&
    newSet === 1 && oldSet === 2 && writes > 0,
    { base: [before.base, after.base], oldSet, newSet, subscriberStillWired: writes });

  /* a re-registration that MOVES the range must not leave the base outside it */
  R.register('observer.dist', { map: 'log', min: 0.4, max: 4, get: () => 1, set: () => {} });
  judge('...and a re-registration that MOVES the range re-snaps the base into it, rather than leaving a base that can never be restored',
    R.baseOf('observer.dist') === 4, { base: R.baseOf('observer.dist') });
  off();
}

/* ══════════════ 12 · a subscriber that throws does not break the write ═════════ */
{
  const R = createRegistry();
  const errors = [];
  const R2 = createRegistry({ onError: (e, id, why) => errors.push([id, why, String(e.message)]) });
  let landed = null, second = 0;
  R2.register('material.knee', { min: 0, max: 1, get: () => 0.5, set: (v) => { landed = v; } });
  R2.subscribe('material.knee', () => { throw new Error('a spectator fell over'); });
  R2.subscribe('material.knee', () => { second++; });
  const returned = R2.write('material.knee', 0.9);

  judge('A SUBSCRIBER THAT THROWS DOES NOT BREAK THE WRITE — the value reached the instrument, the other subscriber still ran, the writer got its return, and the throw was counted and reported instead of re-raised',
    returned === 0.9 && landed === 0.9 && second === 1 &&
    R2.stats().callbackErrors === 1 && errors.length === 1 && errors[0][0] === 'material.knee',
    { returned, landed, second, errors });

  /* the deliberate asymmetry: a SETTER that throws is the Card's own bug and is NOT
     swallowed — swallowing it would leave the registry lying about where the value is */
  R.register('material.grain', { min: 0, max: 1, get: () => 0, set: () => { throw new Error('the Card fell over'); } });
  let setThrew = false;
  try { R.write('material.grain', 0.5); } catch (_) { setThrew = true; }
  judge('...and the asymmetry is deliberate: a SETTER that throws is not swallowed, because a registry that quietly reports a value the instrument never took is worse than a crash',
    setThrew);

  const before = second;
  const unsub = R2.subscribe('*', () => { second += 10; });
  R2.write('material.knee', 0.2);
  const withStar = second - before;                  /* the id subscriber + the '*' one */
  unsub();
  R2.write('material.knee', 0.3);
  const afterUnsub = second - before - withStar;     /* the id subscriber alone */
  judge('...and subscribe(‘*’) sees every parameter while it is wired, and unsubscribing really unsubscribes without disturbing the per-id subscribers',
    withStar === 11 && afterUnsub === 1, { withStar, afterUnsub });
}

/* ══════════════ 13 · the catalogue a modulation window is built from ═══════════ */
{
  const r = rig();
  const cat = r.host.registry.describe();
  const round = JSON.parse(JSON.stringify(cat));
  const kinds = new Set(cat.map((c) => c.map));
  judge('describe() IS A JSON-SERIALISABLE CATALOGUE — id, label, unit, range, map, group — which is the entire thing a modulation window’s target list is built from, and it survives a JSON round trip with no functions in it',
    JSON.stringify(cat) === JSON.stringify(round) && cat.length === 14 &&
    cat.every((c) => c.id && c.map && Number.isFinite(c.min) && Number.isFinite(c.max)),
    { count: cat.length, maps: Array.from(kinds).sort() });
  /* the register's own address space — the fifth shipped id shape */
  const amps = new Map([['h:2:1:0', 0.4], ['h:3:2:-1', 0.1]]);
  const phases = new Map([['h:2:1:0', 1.1], ['h:3:2:-1', 0]]);
  const modeReg = createRegistry();
  createTargetHost({ registry: modeReg }).install(labParameters({
    modes: ['h:2:1:0', 'h:3:2:-1'],
    amp: (k) => amps.get(k), setAmp: (k, v) => amps.set(k, v),
    phase: (k) => phases.get(k), setPhase: (k, v) => phases.set(k, v)
  }));
  modeReg.applyModulated('state.mode.h:2:1:0.phase', 2 * Math.PI + 0.25);
  judge('...and state.mode.h:n:l:m.* really registers: two register modes give four parameters, the amplitudes are linear, the phases wrap, and a modulator pushed one a full turn past its seam and landed back inside the circle',
    modeReg.list().length === 4 && modeReg.describeOne('state.mode.h:2:1:0.amp').map === 'linear' &&
    modeReg.describeOne('state.mode.h:3:2:-1.phase').map === 'wrap' &&
    modeReg.baseOf('state.mode.h:2:1:0.amp') === 0.4 &&
    Math.abs(phases.get('h:2:1:0') - 0.25) < 1e-12,
    { ids: modeReg.list(), phaseAfterFullTurn: phases.get('h:2:1:0') });

  judge('...and the shipped λWAVES vocabulary really uses all five maps, on real controls: YAW and HUE wrap, DIST and EXPOSURE and RATE are log, PITCH is bipolar, RESOLUTION is an integer',
    kinds.size === 5 &&
    cat.find((c) => c.id === 'observer.yaw').map === 'wrap' &&
    cat.find((c) => c.id === 'observer.pitch').map === 'bipolar' &&
    cat.find((c) => c.id === 'observer.dist').map === 'log' &&
    cat.find((c) => c.id === 'field.resolution').map === 'integer' &&
    cat.find((c) => c.id === 'material.knee').map === 'linear',
    { maps: Array.from(kinds).sort() });
}

/* ══════════════ 14 · the four edges, one at a time ═════════════════════════════ */
{
  /* EDGE 4 — presentation and geometry default to NO-OPS.  That is the whole reason
     this file runs at all: nothing below asks for a paint that must happen. */
  const silent = createModHost({ wall: 1000 });
  silent.install(labParameters(PORT()));
  M.modReset();
  const s = M.addSource('lfo', { on: true, wave: 'sine', sync: true, mult: M.LFO_MULT_DEFAULT });
  M.setMacro(M.macroList()[0].id, { sourceId: s.id });
  M.addRoute(M.macroList()[0].id, 'observer.yaw', 0, 1);
  silent.targets.sync();
  silent.clock.play(1000);
  for (let i = 0; i < 4; i++) silent.clock.step(0.1);
  const p = silent.presentation();
  judge('EDGE 4 · PRESENTATION IS A CALLBACK THAT DEFAULTS TO A NO-OP, and the model asked for a paint on every edge and every output frame without any painting machinery existing',
    p.requests >= 5 && p.reasons.includes('transport-start') && p.reasons.includes('modulation-output'),
    { requests: p.requests, reasons: Array.from(new Set(p.reasons)) });

  let painted = 0, geom = 0;
  const wired = createModHost({ wall: 1000, present: () => { painted++; }, invalidateGeometry: () => { geom++; } });
  wired.install([{ id: 'material.knee', map: 'linear', min: 0, max: 1, get: () => 0.5, set: () => {} }]);
  wired.registry.write('material.knee', 0.9);
  wired.invalidateGeometry('window-moved');
  judge('...and an injected presentation callback is what the rack will pass — schedule(TIER.PRESENT) goes here, and the glass-geometry invalidator goes beside it',
    painted === 0 && geom === 1 && wired.geometry().lastReason === 'window-moved',
    { painted, geom });

  /* EDGE 2 — availability, install, dormancy, uninstall */
  let live = false;
  const gated = createModHost({ wall: 1000, available: () => live });
  gated.install([{ id: 'material.knee', map: 'linear', min: 0, max: 1, get: () => 0.5, set: () => {} }]);
  M.modReset();
  const s2 = M.addSource('lfo', { on: true, wave: 'sine', sync: true, mult: M.LFO_MULT_DEFAULT });
  M.setMacro(M.macroList()[0].id, { sourceId: s2.id });
  M.addRoute(M.macroList()[0].id, 'material.knee', 0, 1);
  gated.targets.sync();
  const refusedRun = gated.clock.play(1000).running;
  live = true;
  gated.clock.recomputeRunning();
  judge('EDGE 2 · THE AVAILABILITY GATE holds the clock stopped while the instrument is not live, and starts it the moment it is — this is where the rack wires whatever λWAVES’s answer to flowActive turns out to be',
    refusedRun === false && gated.clock.isRunning() === true && gated.clock.isPlaying() === true,
    { whileUnavailable: refusedRun, whenAvailable: gated.clock.isRunning() });

  /* dormancy: a rack whose targets are not installed keeps its routes and wakes up */
  const dorm = createModHost({ wall: 1000 });
  M.modReset();
  const s3 = M.addSource('lfo', { on: true, wave: 'sine', sync: true, mult: M.LFO_MULT_DEFAULT });
  M.setMacro(M.macroList()[0].id, { sourceId: s3.id });
  M.addRoute(M.macroList()[0].id, 'material.iso', 0, 1);
  const dormantBefore = dorm.targets.sync();
  dorm.install([{ id: 'material.iso', map: 'log', min: 1e-4, max: 1, get: () => 0.06, set: () => {} }]);
  const dormantAfter = M.dormantCount();
  judge('EDGE 2 · A ROUTE WHOSE TARGET IS NOT INSTALLED GOES DORMANT AND KEEPS ITS SETTINGS, and wakes the instant the target appears — which is how a preset written against a closed window, or against another project’s target ids entirely, is safe to load',
    dormantBefore === 1 && dormantAfter === 0 && M.routeList().length === 1,
    { dormantBefore, dormantAfter });

  /* uninstall must not abandon a modulated value */
  const un = createModHost({ wall: 1000 });
  let card = 0.5;
  un.install([{ id: 'material.knee', map: 'linear', min: 0, max: 1, get: () => card, set: (v) => { card = v; } }]);
  un.registry.applyModulated('material.knee', 0.87);
  const abandoned = card;
  un.targets.uninstall();
  judge('EDGE 2 · UNINSTALL MAKES EVERY TARGET LET GO FIRST — abandoning a parameter with a modulator’s number still in it leaves the instrument holding a value nobody set and nobody can explain',
    abandoned === 0.87 && card === 0.5 && !un.registry.has('material.knee'),
    { whileModulated: abandoned, afterUninstall: card });

  /* EDGE 3 — the clock's constants and its independence from the physics clock */
  judge('EDGE 3 · THE CLOCK CARRIES THE SOURCE’S OWN CONSTANTS: the 0.25 s wall-step clamp (a frame longer than that is a tab that was away, not a frame) and the two pause modes',
    MAX_WALL_STEP === 0.25 && JSON.stringify(PAUSE_MODES) === JSON.stringify(['BASE', 'HOLD']),
    { MAX_WALL_STEP, PAUSE_MODES });
}

/* ══════════════ 15 · the clock is NOT the physics clock ════════════════════════ */
{
  /* The single most important architectural fact in this wave: lab/clock.js owns
     PHYSICS time in atomic units at `rate` a.u. per wall second, and this clock owns
     MODULATION time in beats and seconds.  They are two logical times over one wall
     clock.  If they were the same one, then (a) pausing the physics would stop an LFO
     that is animating the camera, and (b) transport.rate — which is a modulation
     TARGET, see the catalogue — would be modulating the thing that decides how fast
     the modulator runs.  Here is (b), demonstrated. */
  const r = rig();
  M.addRoute(M.macroList()[0].id, 'transport.rate', 0, 1);
  r.host.targets.sync();
  r.host.clock.play(1000);
  const rates = [];
  const beats = [];
  for (let i = 0; i < 8; i++) { r.host.clock.step(0.125); rates.push(r.port.clock.rate); beats.push(M.transport.beats); }
  const rateMoved = new Set(rates.map((v) => v.toFixed(9))).size > 1;
  let even = true;
  for (let i = 1; i < beats.length; i++) if (Math.abs((beats[i] - beats[i - 1]) - 0.125) > 1e-12) even = false;

  judge('THE MODULATION CLOCK IS NOT THE PHYSICS CLOCK: an LFO modulating transport.rate swings the physics rate all over its range while the modulation transport keeps advancing exactly 0.125 beats per 0.125 s step — the modulator cannot accelerate itself',
    rateMoved && even, { rates: rates.map((v) => +v.toFixed(4)), beatStep: beats[1] - beats[0] });

  /* visibility: hidden stops the clock without touching `playing`, and releases holds */
  const v = rig();
  runWindow(v, 3, 0.1);
  v.host.clock.hold('1');
  const held = M.transport.hold;
  v.host.clock.setHidden(true);
  const hiddenState = { playing: v.host.clock.isPlaying(), running: v.host.clock.isRunning(), hold: M.transport.hold };
  const timeWhenHidden = M.transport.time;
  v.host.clock.advanceTo(1010);
  const timeAfterHidden = M.transport.time;
  v.host.clock.setHidden(false);
  const backState = { playing: v.host.clock.isPlaying(), running: v.host.clock.isRunning() };

  judge('VISIBILITY · hidden stops the clock WITHOUT touching `playing`, releases the stutter hold (a hold is a gesture and the gesture is over), advances no model time however much wall time passes, and comes back running',
    held && hiddenState.playing && !hiddenState.running && !hiddenState.hold &&
    Object.is(timeWhenHidden, timeAfterHidden) && backState.playing && backState.running,
    { hiddenState, time: [timeWhenHidden, timeAfterHidden], backState });

  /* the panel/window law: closing the view may not stop the machine */
  const w = rig();
  runWindow(w, 3, 0.1);
  w.host.invalidateGeometry('window-closed');
  judge('A WINDOW CLOSE CANNOT RESET RUNTIME STATE — the geometry callback is a view event and reaches nothing that owns time',
    w.host.clock.isRunning() && w.host.geometry().requests === 1 && M.transport.playing,
    { running: w.host.clock.isRunning() });
}

/* ══════════════ 16 · the vendored files are still the vendored files ═══════════ */
{
  const SRC = '/home/joshua-hosain/Documents/MANDELBROT APP/project/app';
  const noHeader = (s) => s.replace(/^\/\*[\s\S]*?\*\/\n/, '');
  const ours = (f) => {
    let source = readFileSync(resolve(ROOT, 'lab/mir/' + f), 'utf8');
    if (f === 'mod.js') for (const patch of JSON.parse(readFileSync(resolve(ROOT,'docs/mir-matrix-patch.json'),'utf8'))) {
      if (!source.includes(patch.after)) throw new Error('Final II provenance patch no longer matches');
      source=source.replace(patch.after,patch.before);
    }
    return noHeader(source);
  };
  let comparable = true, theirMod = '', theirCurve = '';
  try {
    theirMod = readFileSync(SRC + '/mod.js', 'utf8');
    theirCurve = readFileSync(SRC + '/curve.js', 'utf8');
  } catch (_) { comparable = false; }

  if (comparable) {
    const ourMod = ours('mod.js'), ourCurve = ours('curve.js');
    /* UNDO the one documented edit — its marker comment and its one line — and the
       file must be byte-identical to its source.  That is a far stronger claim than
       counting changed lines, and it is the claim the diff law actually needs. */
    /* WAVE 61 · SIX MARKED EDITS, NOT ONE — and the claim is unchanged in strength.  Each one
       is undone here by its EXACT text, so the gate still proves the file is the vendored file
       plus a diff somebody can read, rather than counting lines.  Edits 2-6 are the bipolar
       route (PORT-NOTES.md): the model's offset is 0 whenever the macro is at 0, so "the base
       is the CENTRE of the swing" — Josh's "center of dial" — is NOT expressible without them,
       and the only alternatives move the user's base value, which is what registry.js exists to
       prevent.  Half of what was asked for is not worth protecting a two-hunk diff. */
    const EDITS = [
      [`/* λWAVES: forced edit 1/8 — the storage namespace.  'mandel.modpresets' is
   BASINS identity, and the boundary law is that MIR never carries a Card's.
   Our house namespace is lambdawaves.q0.* (lab/rack.js LS_EXP / SETTINGS_KEY). */
export const PRESET_LS = 'lambdawaves.q0.modpresets';
`, `export const PRESET_LS = 'mandel.modpresets';
`],
      [`    /* λWAVES: forced edit 2/8 — the BIPOLAR flag.  A unipolar route's offset is always 0
       when the macro is at 0, so "the base is the CENTRE of the swing" is not expressible
       in this model; the flag is read in routeInfluence() and nowhere else. */
    bi: !!o.bi,
`, ''],
      [`  /* λWAVES: forced edit 3/8 — the ANCHOR.  A unipolar route measures its influence from
     r.min, so the offset is 0 when the macro is at 0; a BIPOLAR route measures it from the
     MIDPOINT, so the base is the CENTRE of the swing and a macro at 0.5 moves nothing. */
  const influence = lerped - (r.bi ? (r.min + r.max) / 2 : r.min);
`, `  const influence = lerped - r.min;
`],
      [`  /* λWAVES: forced edit 4/8 — the bipolar flag is patchable, exactly like min and max. */
  if (patch.bi !== undefined) r.bi = !!patch.bi;
`, ''],
      [`    /* λWAVES: forced edit 5/8 — \`bi\` travels with the route.  undefined is dropped by
       JSON.stringify, so a rack with no bipolar route serialises exactly as it always did. */
    routes: routes.map((r) => ({ id: r.id, macroId: r.macroId, targetId: r.targetId,
                                 min: r.min, max: r.max, bi: r.bi ? 1 : undefined }))
`, `    routes: routes.map((r) => ({ id: r.id, macroId: r.macroId, targetId: r.targetId,
                                 min: r.min, max: r.max }))
`],
      [`      /* λWAVES: forced edit 6/8 — …and comes back.  A flag that does not survive a preset
         silently changes the sound of every patch that was ever saved with it. */
      newRoute(r.macroId, r.targetId, r.min, r.max, { id: String(r.id), bi: !!r.bi });
`, `      newRoute(r.macroId, r.targetId, r.min, r.max, { id: String(r.id) });
`],
      /* WAVE 63 · TWO MORE, AND THEY ARE THE ONES THE OTHER SIX MADE NECESSARY.  Edits 2/8 and 6/8
         changed what a stored route MEANS: a rack carrying `bi`, read by a build that lost those two
         markers to an upstream re-take, drops the flag and routeInfluence measures from r.min again —
         the base walks from the centre of the swing to its floor, 30 % of scale at the macro's middle,
         in silence, on the second open.  A version stamp is the only thing such a build already reads,
         and leaving MOD_STATE_V at 4 made the change version-INDISTINGUISHABLE. */
      [`/* λWAVES: forced edit 7/8 — THE VERSION HAD TO MOVE, because edits 2/8 and 6/8 changed
   what a stored route MEANS.  A rack carrying \`bi\` and read by a build without them drops
   the flag, \`routeInfluence\` measures from r.min again, and the base walks from the centre
   of the swing to its floor — 30 % of scale at the macro's middle, silently, on the second
   open.  That is exactly what a version stamp is for, and leaving it at 4 made the change
   version-INDISTINGUISHABLE.  The λWAVES namespace starts at 100 (= 100 + the upstream
   version this model is derived from) so our 104 can never be mistaken for an upstream 5,
   and an upstream 5 we have never seen is refused here rather than half-read. */
export const MOD_STATE_V = 104;
`, `export const MOD_STATE_V = 4;
`],
      [`/* λWAVES: forced edit 8/8 — and 3 and 4 are still read: a rack with no \`bi\` on any route
   is byte-identical on the wire to one written before the flag existed, so there is nothing
   to migrate in that direction and refusing it would throw away every patch made before
   wave 61.  The refusal only runs the other way. */
export const MOD_STATE_READS = Object.freeze([3, 4, 104]);
`, `export const MOD_STATE_READS = Object.freeze([3, 4]);
`]];
    let undone = ourMod, missed = [];
    for (let i = 0; i < EDITS.length; i++) {
      const [ours2, theirs] = EDITS[i];
      if (ourMod.indexOf(ours2) < 0) missed.push(i + 1);
      undone = undone.split(ours2).join(theirs);
    }
    const markers = (ourMod.match(/λWAVES:/g) || []).length;
    judge('THE VENDORED FILES ARE STILL THE VENDORED FILES: reverse the documented Final II matrix patch, strip the provenance headers, undo the EIGHT marked edits by their exact text, and both files are byte-identical to their sources — the whole port is one storage key, one bipolar flag and the model version that flag made necessary, and an upstream fix is still a patch rather than archaeology',
      ourCurve === theirCurve && undone === theirMod && markers === EDITS.length && missed.length === 0,
      { curveIdentical: ourCurve === theirCurve, modIdenticalOnceUndone: undone === theirMod,
        markedEdits: markers, wantEdits: EDITS.length, editsNotFound: missed, modBytes: ourMod.length });
    /* WAVE 63 · AND THE HEADER'S OWN COUNT, which is the one sentence in the port that NOTHING could
       see.  The judge above strips `/^\/\*[\s\S]*?\*\/\n/` — exactly the provenance block — before it
       compares, and so it read straight past "Forced 1 edit … Every other byte below this header is
       the source, unmodified" for a whole wave after five more edits went in under it.  A maintainer
       taking an upstream fix reads that header FIRST, because it is the file that tells them how.
       So the number is read out of the header and made to equal the markers in the body. */
    const head = readFileSync(resolve(ROOT, 'lab/mir/mod.js'), 'utf8').slice(0, 2400);
    const said = head.match(/Forced\s+(\d+)\s+edits?/);
    judge('THE VENDORED HEADER COUNTS ITS OWN EDITS, and the count is gated: §16 strips the provenance block before it diffs, so the sentence that tells a maintainer how to read the file is the one sentence the byte-identity proof structurally cannot see — it said "Forced 1 edit" for a whole wave with six in the file. The number in the header must now equal the marked edits in the body and the entries in the table above, all three',
      !!said && Number(said[1]) === markers && Number(said[1]) === EDITS.length,
      { headerSays: said ? Number(said[1]) : null, markersInBody: markers, tableEntries: EDITS.length });
  } else {
    judge('THE VENDORED FILES ARE STILL THE VENDORED FILES (the source tree is not readable from here — skipped, not failed)', true, { skipped: true });
  }
}

/* ══════════════ 17 · the edges come apart ══════════════════════════════════════
 * createModHost() is a convenience, not the architecture.  The rack wave may want the
 * registry alone (to name its controls before there is any modulation at all), or a
 * target host over a registry it already owns, or a clock over both.  Each edge has to
 * be constructible on its own or the injection was never real. */
{
  const registry = createRegistry();
  let card = 0.5, painted = [];
  const targets = createTargetHost({ registry, available: () => true });
  targets.install([{ id: 'material.knee', map: 'linear', min: 0, max: 1,
                     get: () => card, set: (v) => { card = v; } }]);
  const clock = createModClock({ registry, targets, present: (why) => painted.push(why), wall: 1000 });

  M.modReset();
  const src = M.addSource('lfo', { on: true, wave: 'sine', sync: true, mult: M.LFO_MULT_DEFAULT });
  M.setMacro(M.macroList()[0].id, { sourceId: src.id });
  M.addRoute(M.macroList()[0].id, 'material.knee', 0, 1);
  targets.sync();
  clock.play(1000);
  clock.step(0.25);
  const moved = card;
  clock.pause();

  judge('THE FOUR EDGES COME APART: a registry alone, a target host over it, and a clock over both — each built by hand with no createModHost() in sight, and the LFO still drives the Card',
    moved !== 0.5 && card === 0.5 && painted.includes('transport-start') && painted.includes('transport-stop'),
    { whileRunning: moved, afterStop: card, reasons: Array.from(new Set(painted)) });

  /* restoreAll and resync: the two bulk operations a preset load and an undo need */
  registry.applyModulated('material.knee', 0.77);
  const letGo = registry.restoreAll();
  card = 0.31;                                        /* the instrument moved behind our back */
  const resynced = registry.resync();
  judge('...and restoreAll() lets every modulated parameter go at once, while resync() re-reads an UNMODULATED parameter after a preset load or an undo moved its control without going through the registry',
    letGo === 1 && resynced === 1 && registry.baseOf('material.knee') === 0.31 &&
    registry.read('material.knee') === 0.31 && !registry.isModulated('material.knee'),
    { letGo, resynced, base: registry.baseOf('material.knee'), current: registry.read('material.knee') });

  targets.uninstall();
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 18 \u00b7 resync() UNDER A RUNNING MODULATOR \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
 * The section above proves resync() on an unmodulated parameter, and that is the ONLY case
 * it proved for a long time: its fixture called restoreAll() one line before resync(), so the
 * modulated branch was never entered and the green line's wording ("re-reads the instrument")
 * was blessing a function that, on a modulated parameter, re-read the MODULATOR into the base.
 * A found defect: two of the six drag/modulate/resync orderings destroyed the user's number,
 * silently, with no event, and the base is the only copy of it in the program.  These are the
 * assertions the suite should have been making, written from the outside in VALUE space. */
{
  const card = (v) => { const c = { v, sets: 0 }; c.get = () => c.v; c.set = (x) => { c.v = x; c.sets++; }; return c; };
  const rig = () => {
    const R = createRegistry(); const c = card(0.5);
    R.register('material.exposure', { min: 0, max: 2, get: c.get, set: c.set });
    return { R, c };
  };

  /* the measured counter-example, exactly as it was driven: hand \u2192 LFO \u2192 preset load */
  {
    const { R, c } = rig();
    const seen = [];
    R.subscribe('*', (e) => seen.push(e.reason));
    R.write('material.exposure', 0.734);            // the user's hand
    R.applyModulated('material.exposure', 1.9);     // an LFO takes the control
    seen.length = 0;
    const n = R.resync();                           // a preset load, or an undo, asks for a re-read
    const quiet = seen.slice();                     // …what it announced, BEFORE the modulator lets go
    const back = R.restoreBase('material.exposure');
    judge('THE USER\'S NUMBER SURVIVES A resync() UNDER A RUNNING MODULATOR: the Card is showing the LFO\'s 1.9, so resync() reads NOTHING out of it \u2014 it counts nothing, announces nothing, and restoreBase() still hands back the 0.734 the hand set, bit for bit',
      Object.is(back, 0.734) && n === 0 && quiet.length === 0 && c.v === 0.734,
      { restored: back, resynced: n, eventsFromTheResync: quiet, card: c.v });
  }

  /* all six orderings of the three actors \u2014 two of them used to lose the base */
  {
    const orders = [['drag', 'mod', 'resync'], ['drag', 'resync', 'mod'], ['mod', 'drag', 'resync'],
                    ['mod', 'resync', 'drag'], ['resync', 'drag', 'mod'], ['resync', 'mod', 'drag']];
    const lost = [];
    for (const o of orders) {
      const { R } = rig();
      for (const act of o) {
        if (act === 'drag') R.write('material.exposure', 0.734);
        else if (act === 'mod') R.applyModulated('material.exposure', 1.9);
        else R.resync();
      }
      if (!Object.is(R.restoreBase('material.exposure'), 0.734)) lost.push(o.join('\u2192'));
    }
    judge('...and it survives in ALL SIX ORDERINGS of hand, modulator and resync \u2014 the base is the user\'s in every one of them, not in four of them',
      lost.length === 0, { orderingsThatLoseTheBase: lost });
  }

  /* the other half of resync\'s job, which the modulated branch still does */
  {
    const { R, c } = rig();
    const seen = [];
    R.write('material.exposure', 0.734);
    R.applyModulated('material.exposure', 1.9);
    R.subscribe('*', (e) => seen.push({ reason: e.reason, value: e.value, base: e.base }));
    const setsBefore = c.sets;
    c.v = 0.25;                                     // something outside the registry moved the control
    const n = R.resync();
    judge('...and resync() still does the OTHER half of its job for a modulated parameter: a control moved from outside is no longer the value the registry last pushed, so the CURRENT value is re-read and announced \u2014 while the base stays the user\'s and nothing is written back at the Card',
      n === 1 && R.read('material.exposure') === 0.25 && Object.is(R.baseOf('material.exposure'), 0.734) &&
      R.isModulated('material.exposure') && c.sets === setsBefore &&
      seen.length === 1 && seen[0].reason === 'resync' && seen[0].value === 0.25 && seen[0].base === 0.734,
      { resynced: n, current: R.read('material.exposure'), base: R.baseOf('material.exposure'),
        cardWritesDuringResync: c.sets - setsBefore, events: seen });
  }

  /* and the unmodulated branch is untouched by the guard: it still reconciles BOTH numbers */
  {
    const { R, c } = rig();
    R.write('material.exposure', 0.734);
    c.v = 1.25;                                     // a preset load moved the control directly
    const n = R.resync();
    judge('...while an UNMODULATED parameter is still re-read whole \u2014 base and current both become the number the instrument holds, which is the case resync() exists for',
      n === 1 && Object.is(R.baseOf('material.exposure'), 1.25) && Object.is(R.read('material.exposure'), 1.25) &&
      Object.is(R.restoreBase('material.exposure'), 1.25),
      { resynced: n, base: R.baseOf('material.exposure'), current: R.read('material.exposure') });
  }
}

/* ══════════════ 19 · THE BREAKPOINT CURVE'S FIVE LAWS ══════════════════════════
 * `lab/mir/curve.js` is the mathematics BOTH device pictures are drawn from, and until
 * wave 60 the only thing this suite said about it was that its bytes match its source.
 * Its own header states five laws "each one a gate rather than a preference"; these are
 * those gates, plus the exactness table the wave-60 curve display leans on, plus the four
 * editor doors the pointer handler calls.  Measured, never remembered. */
{
  const P = CV.PRESETS;

  /* law 1 — EXACT AT EVERY POINT.  Not "close": the same double, by early return.  A
     duplicate `t` is a legal discontinuity and the LATER point wins there, which is the
     rule SQUARE is written with, so the expected value is the last point at that t. */
  {
    const hand = [
      [{ t: 0, v: 0.13, tension: 0.7 }, { t: 0.4, v: 0.91, tension: -0.35 }, { t: 1, v: 0.22, tension: 0 }],
      [{ t: 0, v: 1, tension: -1 }, { t: 0.25, v: 0, tension: 1 }, { t: 0.75, v: 0.5, tension: 0.42 }, { t: 1, v: 1, tension: 0 }]
    ].map(CV.normalizePoints);
    let bad = 0, n = 0;
    for (const pts of [...P.map(CV.presetPoints), ...hand]) {
      for (let i = 0; i < pts.length; i++) {
        let want = pts[i].v;
        for (let k = i + 1; k < pts.length; k++) if (pts[k].t === pts[i].t) want = pts[k].v;
        n++; if (!Object.is(CV.evaluate(pts, pts[i].t), want)) bad++;
      }
    }
    judge('CURVE LAW 1 — EXACT AT EVERY POINT: evaluate(pts, pts[i].t) returns pts[i].v as the SAME DOUBLE, for all seven presets and for hand-drawn curves with tension at both signs — and at a duplicate `t` (which is how SQUARE writes a jump) the LATER point wins, which is the rule the analytic square wave already used',
      bad === 0 && n === 40, { points: n, wrong: bad, squareAtTheJump: CV.evaluate(CV.presetPoints('square'), 0.5) });
  }

  /* law 2 — tension 0 IS LINEAR, and linear is `x` itself */
  {
    let bad = 0;
    for (let i = 0; i <= 1000; i++) { const x = i / 1000; if (!Object.is(CV.bend(x, 0), x)) bad++; }
    if (!Object.is(CV.bend(0.37, -0), 0.37) || !Object.is(CV.bend(0.37, NaN), 0.37)) bad += 1000;   // -0 and NaN both land on the linear branch
    const tri = CV.presetPoints('tri');
    let lin = 0;
    for (let i = 0; i <= 500; i++) {
      const u = i / 500, want = u <= 0.5 ? 2 * u : 2 - 2 * u;
      if (Math.abs(CV.evaluate(tri, u) - want) > 0) lin++;
    }
    judge('CURVE LAW 2 — tension 0 IS BITWISE LINEAR: bend(x, 0) is `x` itself at 1001 samples (and -0 and NaN land on the same branch, which is refuse-don\'t-repair applied to arithmetic), so a curve carrying no tension is EXACTLY the piecewise-linear interpolation — TRI agrees with 2u / 2−2u to the double at 501 samples',
      bad === 0 && lin === 0, { bendMismatches: bad, triMismatches: lin });
  }

  /* law 3 — MONOTONE WITHIN A SEGMENT, no overshoot.  A modulation curve that overshot
     would drive a control past a range handle the user set, and that window is the one
     promise the engine makes about amplitude. */
  {
    let ends = 0, mono = 0, out = 0, n = 0;
    for (let i = 0; i <= 200; i++) {
      const tau = -1 + i / 100;
      if (!Object.is(CV.bend(0, tau), 0) || !Object.is(CV.bend(1, tau), 1)) ends++;
      let prev = -1;
      for (let j = 0; j <= 400; j++) { const y = CV.bend(j / 400, tau); n++; if (y < prev) mono++; if (y < 0 || y > 1) out++; prev = y; }
    }
    /* and the same claim one level up, in VALUE space: no reading leaves its segment */
    const pts = CV.normalizePoints([{ t: 0, v: 0.2, tension: 0.95 }, { t: 0.5, v: 0.9, tension: -0.95 }, { t: 1, v: 0.05, tension: 0 }]);
    let esc = 0;
    for (let j = 0; j <= 2000; j++) {
      const u = j / 2000, y = CV.evaluate(pts, u);
      const lo = u <= 0.5 ? 0.2 : 0.05, hi = u <= 0.5 ? 0.9 : 0.9;
      if (y < Math.min(lo, hi) - 1e-15 || y > Math.max(lo, hi) + 1e-15) esc++;
    }
    judge('CURVE LAW 3 — MONOTONE, AND NO OVERSHOOT ANYWHERE: over 201 tensions x 401 samples (80 601 readings) bend() is non-decreasing, its image is inside [0,1], and bend(0) and bend(1) are EXACTLY 0 and 1 at every tension; in value space a hard-bent curve never leaves the interval between a segment\'s own endpoints, which is what stops a modulator driving a control past the range handle the user set',
      ends === 0 && mono === 0 && out === 0 && esc === 0 && n === 80601,
      { readings: n, endpointFailures: ends, monotoneFailures: mono, outOfRange: out, segmentEscapes: esc });
  }

  /* law 4 — C0 BY CONSTRUCTION, and the discontinuity is DELIBERATE */
  {
    const sq = CV.presetPoints('square');
    const before = CV.evaluate(sq, 0.5 - 1e-12), after = CV.evaluate(sq, 0.5);
    const tri = CV.presetPoints('tri');
    const c0 = Math.abs(CV.evaluate(tri, 0.5 - 1e-9) - CV.evaluate(tri, 0.5 + 1e-9));
    judge('CURVE LAW 4 — C0 BY CONSTRUCTION, AND THE ONE JUMP IS DELIBERATE: segments share their endpoints, so TRI is continuous across its own breakpoint to 4e-9 with no spline that could ring; SQUARE\'s duplicate `t` reads 0 an instant before 0.5 and 1 at 0.5, which is a legal discontinuity and not a defect — four points, two of them at 0.5',
      before === 0 && after === 1 && c0 < 5e-9 && sq.length === 4 && sq[1].t === 0.5 && sq[2].t === 0.5,
      { justBefore: before, at: after, triJumpAcrossItsBreakpoint: c0 });
  }

  /* law 5 — THE MIRROR IS CLOSED IN THE FAMILY, and that is what chose the formula */
  {
    let anti = 0;
    for (let i = 0; i <= 200; i++) { const tau = -1 + i / 100;
      for (let j = 0; j <= 400; j++) { const x = j / 400; anti = Math.max(anti, Math.abs(CV.bend(x, -tau) - (1 - CV.bend(1 - x, tau)))); } }
    const ff = P.map((n) => CV.curveHash(CV.flip(CV.flip(CV.presetPoints(n)))) === CV.curveHash(CV.presetPoints(n)));
    const sym = P.filter(CV.presetIsSymmetric);
    const symQuiet = sym.every((n) => CV.curveHash(CV.flip(CV.presetPoints(n))) === CV.curveHash(CV.presetPoints(n)));
    const asymLoud = P.filter((n) => !CV.presetIsSymmetric(n)).every((n) => CV.curveHash(CV.flip(CV.presetPoints(n))) !== CV.curveHash(CV.presetPoints(n)));
    judge('CURVE LAW 5 — THE MIRROR IS CLOSED IN THE FAMILY: bend(x, −τ) = 1 − bend(1 − x, τ) to 1.2e-16 over 80 601 samples, which is the ANTISYMMETRY that makes mirror() a sign flip and nothing else — the single-branch power law fails exactly there. flip∘flip is BIT-IDENTICAL on all seven presets (every t is a dyadic rational, so 1−(1−t) is exact), and the −0 normalisation makes "symmetric shapes are invariant" true TO THE BIT: TRI · SINE · MULTI-TRI flip to the same HASH, and the four that are not symmetric all change theirs',
      anti < 2e-16 && ff.every(Boolean) && sym.join() === 'tri,sine,mtri' && symQuiet && asymLoud,
      { antisymmetryWorst: anti, flipFlipExact: ff, symmetric: sym });
  }

  /* the exactness table the CURVE DISPLAY leans on: four presets ARE the analytic waves */
  {
    const rows = [];
    for (const [pn, wn] of [['tri', 'tri'], ['sawup', 'rotate'], ['sawdown', 'sawdown'], ['square', 'square'], ['sine', 'sine']]) {
      const pts = CV.presetPoints(pn);
      let e = 0;
      for (let j = 0; j < 2000; j++) { const u = j / 2000; e = Math.max(e, Math.abs(CV.evaluate(pts, u) - M.waveAt(wn, u, {}))); }
      rows.push({ preset: pn, wave: wn, maxErr: e });
    }
    const by = Object.fromEntries(rows.map((r) => [r.preset, r.maxErr]));
    judge('A CURVE-MODE SOURCE AND A WAVE-MODE SOURCE CAN BE COMPARED, because four of the presets ARE the analytic waves: SAW↑ = rotate and SAW↓ = sawdown and SQR = square are BIT EXACT over [0,1), TRI agrees with its wave to 5.6e-17, and SINE is the one APPROXIMATION — 0.008759 at worst, which curve.js states rather than hides (a tensioned segment is monotone with one curvature and cannot be an S). The exact sine is still available AS A WAVE, so nothing needing it is forced through the approximation',
      by.sawup === 0 && by.sawdown === 0 && by.square === 0 && by.tri < 1e-16 &&
      Math.abs(by.sine - 0.00875850942854084) < 1e-12, rows);
  }

  /* THE PRESET TAP — six buttons for seven presets, and the toggle is exact */
  {
    const t1 = CV.applyPreset([], 'sawup'), t2 = CV.applyPreset(t1.points, 'sawup'), t3 = CV.applyPreset(t2.points, 'sawup');
    const a1 = CV.applyPreset([], 'tri'), a2 = CV.applyPreset(a1.points, 'tri');
    judge('THE TAP-AGAIN-TO-FLIP LAW IS THE MODEL\'S, NOT THE FACE\'S — which is why the window has SIX shape buttons for SEVEN presets: tapping SAW↑ once draws it, twice gives exactly presetPoints(\'sawdown\'), three times is back, and both forms are recomputed from the canonical table so the toggle is exact however many times it is tapped. Tapping TRI twice reports `symmetric` and leaves the hash untouched, so a face can honestly say NOTHING HAPPENED instead of pretending',
      CV.pointsEqual(t1.points, CV.presetPoints('sawup')) && CV.pointsEqual(t2.points, CV.presetPoints('sawdown')) &&
      t2.flipped === true && CV.pointsEqual(t3.points, CV.presetPoints('sawup')) &&
      a2.symmetric === true && CV.curveHash(a2.points) === CV.curveHash(a1.points),
      { tap2IsSawDown: CV.pointsEqual(t2.points, CV.presetPoints('sawdown')), triSymmetric: a2.symmetric });
  }

  /* THE FOUR EDITOR DOORS, and the one thing mod.js adds on top of them */
  {
    const full = CV.normalizePoints(Array.from({ length: CV.CURVE_MAX_POINTS }, (_, i) => ({ t: i / 31, v: 0.5 })));
    const atCeiling = CV.addPoint(full, 0.501, 0.9);
    const two = CV.removePoint(CV.presetPoints('sawup'), 0);
    const three = CV.removePoint(CV.presetPoints('tri'), 1);
    const moved = CV.movePoint(CV.presetPoints('tri'), 0, 0.4, 0.8);
    const bentLast = CV.setTension(CV.presetPoints('tri'), 2, 0.9);
    judge('THE FOUR EDITOR DOORS REFUSE IN THE ENGINE, NEVER IN THE UI: addPoint at the 32-point ceiling returns `full` and changes nothing; removePoint on a two-point curve refuses (a curve with fewer than two points has no segment and no reading) while a three-point one gives one up; movePoint keeps the FIRST and LAST points\' `t` (a cycle\'s ends are its ends) and moves their value only; and setTension on the last point is a no-op because the last point bends nothing. All four return a NEW canonical list and none mutates its argument',
      atCeiling.full === true && atCeiling.points.length === 32 && two.removed === false && two.points.length === 2 &&
      three.removed === true && three.points.length === 2 && moved[0].t === 0 && moved[0].v === 0.8 &&
      CV.curveHash(bentLast) === CV.curveHash(CV.presetPoints('tri')),
      { ceiling: atCeiling.full, twoPointRefusal: two.removed, endKeptItsT: moved[0].t, lastTensionIsANoOp: CV.curveHash(bentLast) === CV.curveHash(CV.presetPoints('tri')) });
  }
  {
    /* USE curveEdit, NEVER THE BARE FUNCTIONS — this is the difference, measured */
    M.modReset();
    const s = M.addSource('lfo', { shapeMode: 'curve', points: CV.presetPoints('mtri') });
    M.curveEdit(s.id, 'move', { index: 3, t: 0.9, v: 0.5 });
    const ts = s.points.map((p) => p.t);
    const bare = CV.movePoint(CV.presetPoints('mtri'), 3, 0.9, 0.5);
    judge('...and `curveEdit` ADDS THE ONE THING A DRAG NEEDS: it clamps a move\'s `t` between its two neighbours, so point 3 of MULTI-TRI dragged to 0.9 lands on 0.5 and the index it was grabbed by is still the index it is — where the bare movePoint lets it sail past four neighbours and REORDER the list under the finger. The window calls curveEdit and nothing else',
      ts[3] === 0.5 && ts.every((t, i, a) => i === 0 || t >= a[i - 1]) && bare[3].t === 0.5 && bare[7].t === 0.9,
      { throughCurveEdit: ts, bareMovePoint: bare.map((p) => p.t) });
  }

  /* curveInfo names a shape by the BUTTON THAT DRAWS IT */
  {
    const down = CV.curveInfo(CV.presetPoints('sawdown'));
    const mirTri = CV.curveInfo(CV.presetMirror('msaw'));
    judge('curveInfo NAMES A SHAPE BY THE BUTTON THAT DRAWS IT: exact matches are swept before mirrors, because presetMirror(\'sawup\') IS presetPoints(\'sawdown\') and one interleaved pass would report the down-saw as "saw up, mirrored". SAW↓ is `sawdown`, not mirrored; a mirrored MULTI-SAW says so',
      down.preset === 'sawdown' && down.mirrored === false && mirTri.preset === 'msaw' && mirTri.mirrored === true,
      { sawdown: down, mirroredMsaw: { preset: mirTri.preset, mirrored: mirTri.mirrored } });
  }
}

/* ══════════════ 20 · THE TWO ARITHMETIC DEFECTS THE WINDOW'S OWN READOUTS HAD ═══
 * Both were found by reading `modview.js` against the model in wave 60, both are one
 * expression, and both are the same shape: a face that printed its OWN idea of a law
 * instead of asking the model for it. */
{
  const rows = [0.25, 0.5, 0.75, 1].map((v) => ({ knob: v, printedByWave52: v * M.SMOOTH_TAU_MAX * 1000, trueTau: M.smoothTau(v) * 1000 }));
  const worst = Math.max(...rows.map((r) => r.printedByWave52 / (r.trueTau || 1)));
  judge('DEFECT (a) — THE SMOOTH READOUT WAS WRONG BY UP TO 4x, and only ever right at the two ends: the card printed `v · SMOOTH_TAU_MAX · 1000` where the model\'s law is tau = 0.5 · v² seconds, so at knob 0.25 it said 125 ms and the truth is 31.25 ms. A number on a card that is wrong by 4x is worse than no number; the fix is to call the model\'s own smoothTau(), which modState() has been publishing correctly all along',
    Math.abs(M.smoothTau(0.25) * 1000 - 31.25) < 1e-9 && Math.abs(M.smoothTau(0.5) * 1000 - 125) < 1e-9 &&
    Math.abs(M.smoothTau(1) * 1000 - 500) < 1e-9 && M.smoothTau(0) === 0 && Math.abs(worst - 4) < 1e-9, { rows, worstRatio: worst });

  /* (b) the ENV time knobs.  kit.js's knob travels its whole range in 220 px of drag. */
  const PX = 220, lin = (px) => (px / PX) * M.ENV_MAX_S, sq = (px) => Math.pow(px / PX, 2) * M.ENV_MAX_S;
  const linStep = lin(1) * 1000, sqBottom = sq(1) * 1000, sqTop = (M.ENV_MAX_S - sq(PX - 1)) * 1000;
  M.modReset();
  const e = M.addSource('env');
  judge('DEFECT (b) — THE ENV TIME KNOBS COULD NOT REACH THEIR OWN DEFAULTS: a LINEAR knob over 0 … ENV_MAX_S = 8 s on kit.js\'s 220-px travel is 36.4 ms per pixel, and the DEFAULT ATTACK IS 10 ms — the smallest adjustment the control could make was nearly four times the value it started on, and the attack stage was unreachable by hand. BASINS\' square law (get √(v/8), set p²·8) makes one pixel 0.165 ms at the bottom and 72.6 ms at the top, which is what a time knob is supposed to feel like',
    Math.abs(linStep - 36.3636363636) < 1e-6 && linStep > 3 * e.a * 1000 && sqBottom < 0.2 && sqTop > 70 && e.a === 0.01,
    { defaultAttackMs: e.a * 1000, linearMsPerPixel: linStep, squareMsPerPixelAtTheBottom: sqBottom, squareMsPerPixelAtTheTop: sqTop });

  /* (c) FIT is not polish.  Measured, on the drawing the window actually renders. */
  const W = 265, px = (s2) => M.envPoints(s2).map((p) => Math.round(p.t * W));
  M.modReset();
  const e2 = M.addSource('env');
  const at4 = px(e2), dur = M.envDuration(e2);
  M.setSource(e2.id, { timeScale: Math.min(M.ENV_MAX_S, Math.max(0.25, dur * 1.15)) });
  const fitted = px(e2);
  judge('FIT IS NOT POLISH, IT IS LEGIBILITY: a DEFAULT envelope (a 10 ms · d 300 ms · s 0.5 · r 600 ms, duration 0.910 s) drawn over its default 4 s window puts its breakpoints on pixels 0 · 1 · 21 · 60 of a 265-px picture — the whole envelope lives in the left quarter and THE ATTACK IS ONE PIXEL WIDE. After FIT (timeScale = clamp(0.25, 8, duration × 1.15) = 1.046 s) they are 0 · 3 · 78 · 230. Without it the ENV display is not merely ugly, it is unreadable',
    at4.join() === '0,1,21,60,265' && fitted.join() === '0,3,78,230,265' &&
    Math.abs(dur - 0.91) < 1e-9 && Math.abs(e2.timeScale - dur * 1.15) < 1e-9,
    { durationS: dur, pixelsAtTimeScale4: at4, timeScaleAfterFit: e2.timeScale, pixelsAfterFit: fitted });

  /* and the ENVELOPE IS A CURVE — the load-bearing detail the one renderer stands on */
  M.modReset();
  const e3 = M.addSource('env', { a: 0.2, hold: 0.1, d: 0.4, s: 0.6, r: 0.5, ta: 0.3, td: -0.4, tr: 0.2, timeScale: 2 });
  M.trigger(e3.id);                                  /* a ONE-SHOT releases itself at a + hold + d, which is the shape envPoints draws */
  const ep = M.envPoints(e3);
  let agree = 0, envWorst = 0;
  for (let j = 0; j <= 400; j++) { const u = j / 400;
    const d2 = Math.abs(CV.evaluate(ep, u) - M.envAt(e3, u * e3.timeScale));
    if (d2 > envWorst) envWorst = d2;
    if (d2 > 1e-12) agree++; }
  judge('THE ENVELOPE IS A CURVE TOO, which is why ONE renderer serves both cards: envPoints() hands back the SAME {t, v, tension} list the LFO draws — six points here, with the HOLD stage present — and evaluating that list agrees with envAt() to 1e-12 at 401 samples across the window. It is DERIVED every call and never stored, so the knobs are the model and the drawing follows them; the two cannot drift',
    ep.length === 6 && agree === 0 && ep[2].tension === -0.4 && ep[0].tension === 0.3,
    { points: ep.length, disagreements: agree, worst: envWorst, tensions: ep.map((p) => p.tension) });
}

/* ══════════════ 21 · THE BIPOLAR ROUTE — the vendored edit, gated ══════════════
 * Josh: *"clicking can choose 'center of dial' or 'highest dial'."*  UP and DOWN were
 * already expressible (min = 0, max = 1 − b · and · min = b, max = 0); CENTRE was not,
 * because the model's offset is ALWAYS 0 when the macro reads 0.  Three candidates were
 * tried and all three fail honestly: inverting the source still yields 0…1, two opposed
 * routes both start at offset 0, and shifting the base down by a half-span would produce
 * the right picture by DESTROYING the user's number — which is the one failure
 * lab/mir/registry.js exists to prevent.  So four touches in the vendored file, and this
 * is the gate on all four.  The last one matters most: a flag that does not survive a
 * preset silently changes the sound of every patch ever saved with it. */
{
  M.modReset();
  const host = createModHost({ wall: 1000 });
  const reg = host.registry;
  let v = 0.5;
  host.install([{ id: 'material.knee', label: 'KNEE', map: 'linear', min: 0, max: 1, get: () => v, set: (x) => { v = x; } }]);
  const mac = M.macroList()[0].id;
  /* a HAND macro, so `macro` here is literally the number the fader would be on */
  M.setMacro(mac, { sourceId: null, masterDepth: 1 });
  const r = M.addRoute(mac, 'material.knee', 0, 0.6).route;
  M.setRouteRange(r.id, { bi: true });
  const base = reg.baseOf('material.knee'), h = 0.3;
  const at = (x) => { M.setMacro(mac, { value: x }); host.clock.applyAll(true); return reg.read('material.knee'); };
  const mid = at(0.5), lo = at(0), hi = at(1);
  judge('21 · A BIPOLAR ROUTE PUTS THE BASE IN THE MIDDLE OF THE SWING, and a macro at 0.5 moves the target BY EXACTLY NOTHING (Object.is on the base, not a tolerance) — at 0 it is base − h and at 1 it is base + h, with h the half-span. That is Josh\'s "center of dial", and routeInfluence measuring from the MIDPOINT rather than from r.min is the whole of it',
    Object.is(mid, base) && Math.abs(lo - (base - h)) < 1e-12 && Math.abs(hi - (base + h)) < 1e-12,
    { base, atZero: lo, atHalf: mid, atOne: hi, halfSpan: h, exactAtHalf: Object.is(mid, base) });

  /* the UNIPOLAR routes are untouched: the flag is read in exactly one expression */
  M.setRouteRange(r.id, { bi: false, min: 0, max: 0.4 });   /* 0.5 + 0.6 would clamp at the top, which is a different law (§D7) */
  const u0 = at(0), u1 = at(1);
  judge('21 · …and a UNIPOLAR route is bit-for-bit what it always was: clear the flag and the same route runs base … base + span again, so the one changed expression in routeInfluence() is inert for every route that does not ask for it',
    Object.is(u0, base) && Math.abs(u1 - (base + 0.4)) < 1e-12,
    { atZero: u0, atOne: u1, base });

  /* THE DEFAULT ON DROP: every drop fills the room the knob has left, in the direction it
     has room — so nothing clips on the first frame.  This is the arithmetic of it. */
  const room = (b) => (Math.abs(b - 0.5) <= 0.02 ? { min: 0, max: 2 * Math.min(b, 1 - b), bi: true }
                       : b <= 0.5 ? { min: 0, max: 1 - b, bi: false } : { min: b, max: 0, bi: false });
  const reach = (b, q) => { const s = (q.max - q.min);
    return q.bi ? [b - Math.abs(s) / 2, b + Math.abs(s) / 2] : s < 0 ? [b + s, b] : [b, b + s]; };
  const rows = [0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0].map((b) => ({ b, q: room(b), reach: reach(b, room(b)) }));
  const clipped = rows.filter((q) => q.reach[0] < -1e-12 || q.reach[1] > 1 + 1e-12);
  const fills = rows.filter((q) => Math.abs(q.reach[0]) < 1e-12 || Math.abs(q.reach[1] - 1) < 1e-12);
  judge('21 · THE DROP DEPTH FILLS THE ROOM THE KNOB HAS LEFT, WHICH IS WHERE WE BEAT SERUM: Serum infers POLARITY from where the control is standing and then assigns a FULL-SCALE depth, which is why its own author tells people on his forum to park base controls at 0 or 50 % first. We know baseNorm at the instant of the drop, so the range is the room — nothing clips on the first frame at ANY base, and at every base the arc lands exactly on an end',
    clipped.length === 0 && fills.length === rows.length,
    { rows: rows.map((q) => [q.b, +q.reach[0].toFixed(6), +q.reach[1].toFixed(6), q.q.bi ? 'CENTRE' : q.q.max < q.q.min ? 'DOWN' : 'UP']), clipped: clipped.length });

  /* and it survives a preset */
  M.setRouteRange(r.id, { bi: true, min: 0, max: 0.6 });
  const blob = JSON.parse(JSON.stringify(M.serialize()));
  const onWire = blob.routes[0].bi;
  M.modReset();
  M.deserialize(blob);
  const back = M.routeList()[0];
  M.modReset();
  const plainBlob = JSON.parse(JSON.stringify(M.serialize()));
  judge('21 · AND `bi` SURVIVES serialize → deserialize, which is the touch that mattered most: a flag that does not round-trip does not change a control, it changes the SOUND OF EVERY SAVED PATCH, silently and only on the second open. It rides as 1 when set and is ABSENT when clear (undefined is dropped by JSON.stringify), so a rack with no bipolar route is byte-identical on the wire to one written before this edit existed',
    onWire === 1 && back.bi === true && JSON.stringify(plainBlob).indexOf('"bi"') < 0,
    { onWire, restored: back.bi, min: back.min, max: back.max, unipolarWireHasBi: JSON.stringify(plainBlob).indexOf('"bi"') >= 0 });
}

/* ══════════════ 22 · THE PRESET FOLDER — the foreign three, and our own ════════
 *
 * THE MEASUREMENT THAT STARTED THIS, reproduced below rather than believed: mod.js ships
 * three FACTORY_PRESETS and every route in all three goes to a target λWAVES does not
 * register, so all three load 100 % DORMANT.  A preset menu whose whole contents do
 * nothing is worse than an empty one, so host.js filters that folder out of what this lab
 * OFFERS (without touching the vendored file, which §16 holds to byte-identity) and puts
 * three of our own in its place.
 *
 * The gate below is the one that would have caught them: EVERY ROUTE MUST RESOLVE TO A
 * TARGET THIS LAB REGISTERS.  It is run over ours and over theirs, and it has to pass on
 * ours and fail on all six of theirs or it is not a check, it is a decoration. */
{
  /* ── THE ELEVEN, as rack.js actually installs them ─────────────────────────────
   * Ranges and shipped bases copied from lab/rack.js (the modulation defs list and the
   * `mat` / `obs` / Clock initialisers), because the rack is a browser module this
   * process cannot import.  host.js's own labParameters() is deliberately NOT used here:
   * it is the SHAPE of a catalogue with illustrative ranges, and the presets have to be
   * gated against the ranges that ship — a preset whose depth is honest at FOV [0.2, 1.6]
   * and clips at the real [0.25, 1.2] is a preset gated against the wrong instrument. */
  const LAB_PORT = () => ({
    obs: { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 },
    mat: { exposure: 1, softness: 0.7, hueShift: 0, iso: 0.06, grain: 0.35, knee: 0.6 },
    clock: { rate: 4 }
  });
  const CAM_PITCH = 1.52;
  const labDefs = (p) => {
    const f = (o, k) => ({ get: () => o[k], set: (v) => { o[k] = v; } });
    return [
      { id: 'observer.yaw', label: 'YAW', map: 'wrap', min: 0, max: 2 * Math.PI, ...f(p.obs, 'yaw') },
      { id: 'observer.pitch', label: 'PITCH', map: 'bipolar', min: -CAM_PITCH, max: CAM_PITCH, def: 0, ...f(p.obs, 'pitch') },
      { id: 'observer.dist', label: 'ZOOM', map: 'log', min: 1.2, max: 8, ...f(p.obs, 'dist') },
      { id: 'observer.fov', label: 'FOV', map: 'linear', min: 0.25, max: 1.2, ...f(p.obs, 'fov') },
      { id: 'material.exposure', label: 'EXPOSURE', map: 'log', min: 0.08, max: 12, ...f(p.mat, 'exposure') },
      { id: 'material.softness', label: 'SOFT', map: 'linear', min: 0.3, max: 2.2, ...f(p.mat, 'softness') },
      { id: 'material.hue', label: 'HUE', map: 'wrap', min: 0, max: 1, ...f(p.mat, 'hueShift') },
      { id: 'material.iso', label: 'ISO', map: 'log', min: 0.002, max: 0.9, ...f(p.mat, 'iso') },
      { id: 'material.grain', label: 'GRAIN', map: 'log', min: 0.02, max: 1, ...f(p.mat, 'grain') },
      { id: 'material.knee', label: 'KNEE', map: 'log', min: 0.02, max: 8, ...f(p.mat, 'knee') },
      { id: 'transport.rate', label: 'RATE', map: 'log', min: 0.1, max: 3000, ...f(p.clock, 'rate') }
    ];
  };
  const REGISTERED = labDefs(LAB_PORT()).map((d) => d.id);

  function labRig() {
    M.modReset();
    const port = LAB_PORT();
    const host = createModHost({ wall: 1000 });
    host.install(labDefs(port));
    M.setTransport({ bpm: 60, sync: 'wall', playing: false });
    return { port, host, reg: host.registry };
  }

  /* ── 22a · THE FILTER ───────────────────────────────────────────────────────── */
  {
    const theirs = M.presetList().filter((p) => p.factory);
    const offered = labPresetList();
    const folders = labPresetFolders();
    const foreign = foreignPresets();
    const mine = offered.filter((p) => p.lab);
    judge('22a · THE FOREIGN FACTORY FOLDER IS FILTERED OUT OF WHAT THIS LAB OFFERS, and the filter is the marker the vendored model already stamps: presetPublic() writes `factory: 1` on its three and on nothing else, so `M.presetList().filter((p) => !p.factory)` names exactly that folder and cannot ever catch a user’s own patch. The vendored file is not touched — §16’s byte-identity claim is worth more than a deletion that belongs at the SEAM anyway, which is what this file is',
      theirs.length === 3 && mine.length === 3 && offered.length === 3 &&
      offered.every((p) => p.folder !== M.PRESET_FOLDER_FACTORY) &&
      folders.every((f) => f.name !== M.PRESET_FOLDER_FACTORY) &&
      folders[0].name === LAB_PRESET_FOLDER && folders[0].count === 3,
      { vendoredStillThere: theirs.map((p) => p.name), offered: offered.map((p) => p.name),
        folders: folders.map((f) => f.name + '×' + f.count) });

    const rShut = labRig();
    const refused = labPresetApply('f.breathe', { host: rShut.host });
    const rOpen = labRig();
    const forced = labPresetApply('f.breathe', { host: rOpen.host, allowForeign: true });
    const forcedDormant = M.dormantCount(), forcedRoutes = M.routeList().length;
    const clash = LAB_PRESETS.filter((p) => M.FACTORY_PRESETS.some((f) =>
      f.name.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
      p.name.length > M.PRESET_NAME_MAX);
    judge('22a · …and FILTERED IS NOT SEALED: all three stay readable by name, foreignPresets() lists them WITH the targets each one wanted, and labPresetApply DOES load one for a caller that passes `allowForeign` — where it lands 2 routes of 2 dormant, which is the measurement this whole section exists for. Without the flag it is refused by name with the dead targets in the refusal, so the message a face prints can be true rather than vague. Our three names collide with none of theirs and all fit PRESET_NAME_MAX, so mod.js’s own save-time guard is never surprised by us',
      foreign.length === 3 && foreign.every((f) => f.foreign === 1 && f.targets.length === 2) &&
      labPresetGet('f.breathe').foreign === 1 && labPresetGet('lw.peel').lab === 1 &&
      refused.ok === false && refused.error === 'foreign' && refused.targets.length === 2 &&
      forced.ok === true && forcedRoutes === 2 && forcedDormant === 2 && clash.length === 0,
      { refusal: refused.error, refusedTargets: refused.targets,
        forcedLoad: { ok: forced.ok, routes: forcedRoutes, dormant: forcedDormant },
        foreign: foreign.map((f) => f.name + ' → ' + f.targets.join(',')) });
  }

  /* ── 22b · THE CHECK THAT WOULD HAVE CAUGHT THEM ────────────────────────────── */
  {
    const dead = (p) => presetRouteTargets(p).filter((id) => REGISTERED.indexOf(id) < 0);
    const ourRows = LAB_PRESETS.map((p) => ({ name: p.name, targets: presetRouteTargets(p), dead: dead(p) }));
    const theirRows = M.FACTORY_PRESETS.map((p) => ({ name: p.name, targets: presetRouteTargets(p), dead: dead(p) }));
    const theirRoutes = M.FACTORY_PRESETS.reduce((n, p) => n + p.rack.routes.length, 0);
    const theirDead = theirRows.reduce((n, r) => n + r.dead.length, 0);
    judge('22b · EVERY ROUTE IN EVERY PRESET WE OFFER RESOLVES TO A TARGET THIS LAB REGISTERS — and the same predicate, run over the vendored three, condemns ALL SIX of their routes (freq · phase · bright · pal.e1.phase · pal.e2.phase, five ids, four of which are not even legal under registry.js’s id grammar). A check that passes on what we ship and fails on nothing is not a check',
      ourRows.every((r) => r.dead.length === 0) && ourRows.every((r) => r.targets.length >= 1) &&
      theirRows.every((r) => r.dead.length === r.targets.length) && theirDead === 6 && theirRoutes === 6 &&
      new Set(theirRows.flatMap((r) => r.dead)).size === 5,
      { ours: ourRows.map((r) => r.name + ' → ' + r.targets.join(' · ')),
        theirs: theirRows.map((r) => r.name + ' → ' + r.targets.join(' · ') + '  (all dead)') });
  }

  /* ── 22c · EVERY PRESET LOADS, AND NOTHING IN IT IS DORMANT ─────────────────── */
  {
    const rows = [];
    let allOk = true;
    for (const p of LAB_PRESETS) {
      const r = labRig();
      const res = labPresetApply(p.id, { host: r.host });
      const routes = M.routeList(), srcs = M.sourceList(), macs = M.macroList();
      const badRange = routes.filter((q) => !(q.min >= 0 && q.min <= 1 && q.max >= 0 && q.max <= 1) || q.min === q.max);
      const unbound = routes.filter((q) => { const m = M.macroOf(q.macroId);
        return !m || !m.sourceId || !M.sourceOf(m.sourceId) || !M.sourceOf(m.sourceId).on; });
      const badWave = srcs.filter((s) => M.WAVES.indexOf(s.wave) < 0);
      const badSteps = srcs.filter((s) => s.steps !== 0 && M.STEPS_LADDER.indexOf(s.steps) < 0);
      const depth = routes.map((q) => Math.abs(q.max - q.min));
      const ok = res.ok && M.dormantCount() === 0 && badRange.length === 0 &&
                 unbound.length === 0 && badWave.length === 0 && badSteps.length === 0 &&
                 routes.length === p.rack.routes.length && macs.length >= 2;
      if (!ok) allOk = false;
      rows.push({ name: p.name, ok, dormant: M.dormantCount(), routes: routes.length,
                  sources: srcs.length, depths: depth, badRange: badRange.length,
                  unbound: unbound.length });
    }
    judge('22c · EVERY PRESET LOADS AND NOT ONE ROUTE IN ANY OF THEM IS DORMANT: each is applied into a host carrying the eleven targets rack.js really installs, and after the dormancy law has run, dormantCount() is 0 — which is the exact number the vendored three cannot reach. Every depth is inside [0, 1] with a non-zero span (a zero-span route is a dormant route wearing a different hat), every route’s macro is bound to a source that is ON, every wave is in WAVES and every step count is on STEPS_LADDER',
      allOk, { rows });
  }

  /* ── 22d · THE DEPTHS SAY WHAT THE DESCRIPTIONS SAY ─────────────────────────── */
  {
    const r = labRig();
    const reg = r.reg;
    const off = (id, d) => reg.fromNorm(id, reg.toNorm(id, reg.baseOf(id)) + d);
    const yawHalf = off('observer.yaw', 0.5), yawFull = off('observer.yaw', 1);
    const pitchLo = off('observer.pitch', -0.2), pitchHi = off('observer.pitch', 0.2);
    const isoTop = off('material.iso', 0.35), softTop = off('material.softness', 0.5);
    const deg = (x) => x * 180 / Math.PI;
    judge('22d · THE NUMBERS IN THE DESCRIPTIONS ARE THE NUMBERS THE MAPS PRODUCE, gated rather than asserted, because a hint that lies is a hint that costs more than none. ONE TURN’s yaw route is the WHOLE circle — offset ½ is exactly half a turn away and offset 1 is back where it started, to 1e-12, which is the seamlessness a SAW↑ on a wrap map has by construction. Its bipolar pitch swing is −13° … +57° about the shipped 0.38 rad, which crosses the equator. PEEL’s ISO route is a factor of 8.5 on a log dial (0.060 → 0.509) and its SOFTNESS route is γ 0.70 → 1.65',
      Math.abs(yawHalf - (0.65 + Math.PI)) < 1e-12 && Math.abs(yawFull - 0.65) < 1e-12 &&
      Math.abs(deg(pitchLo) + 13.07) < 0.05 && Math.abs(deg(pitchHi) - 56.6) < 0.1 &&
      Math.abs(isoTop / 0.06 - 8.48) < 0.02 && Math.abs(softTop - 1.65) < 0.01,
      { yawHalfTurn: yawHalf, yawFullTurn: yawFull, pitchDeg: [deg(pitchLo), deg(pitchHi)],
        isoTop, isoRatio: isoTop / 0.06, softTop });
  }

  /* ── 22e · THE SEAM: the preset written to be RECORDED closes ───────────────── */
  {
    /* render-exact.js pins the modulation with `drive`, which steps THIS clock by exactly
       1/fps per frame, so an N-frame take advances modulation time by exactly N/fps.  The
       claim is that a take whose wall length is a whole number of BARS returns every
       modulated control to where it started.  It is checked two ways, because the two
       doors into the clock are not the same arithmetic: advanceTo() takes an ABSOLUTE
       stamp and a wall-synced beat is DERIVED from it, so the return is bit-exact; step()
       accumulates `wall += dt`, so the return carries the accumulator's own rounding. */
    const FPS = 30, BAR = 4;                       /* 4 beats at BPM 60 = 4.000 s */
    const watch = ['observer.yaw', 'observer.pitch'];
    /* a wrap target's residue is a distance ON THE CIRCLE: 1e-12 short of a whole turn
       reads as 0.999999999999 on the line and as 1e-12 where the eye is */
    const apart = (reg, id, x, y) => {
      const d = reg.describeOne(id);
      if (!d.wrap) return Math.abs(x - y);
      const L = d.max - d.min;
      return Math.abs(((x - y) % L + L + L / 2) % L - L / 2);
    };
    const run = (id, ids, frames, mode) => {
      const r = labRig();
      labPresetApply(id, { host: r.host });
      M.setTransport({ bpm: 60 });
      r.host.clock.play(1000);
      r.host.clock.advanceTo(1000);
      const a = ids.map((t) => r.reg.read(t));
      const half = [];
      for (let k = 1; k <= frames; k++) {
        if (mode === 'absolute') r.host.clock.advanceTo(1000 + k / FPS);
        else r.host.clock.step(1 / FPS);
        if (k === frames / 2) for (const t of ids) half.push(r.reg.read(t));
      }
      const b = ids.map((t) => r.reg.read(t));
      return { a, b, half, exact: a.every((v, i) => Object.is(v, b[i])),
               worst: Math.max(...a.map((v, i) => apart(r.reg, ids[i], v, b[i]))),
               moved: Math.max(...a.map((v, i) => apart(r.reg, ids[i], v, half[i]))) };
    };
    const abs1 = run('lw.oneturn', watch, FPS * BAR, 'absolute');
    const stp1 = run('lw.oneturn', watch, FPS * BAR, 'step');
    const abs3 = run('lw.globalphase', ['material.hue'], FPS * BAR, 'absolute');
    const stp3 = run('lw.globalphase', ['material.hue'], FPS * BAR, 'step');
    judge('22e · ONE TURN CLOSES: 120 frames at 30 fps is exactly one bar at BPM 60, and every control it holds comes back BIT-IDENTICAL to frame 0 through advanceTo() — because a WALL-synced beat is DERIVED from the absolute stamp (`anchorBeats + (bpm/60)(w − anchorAt)`) rather than accumulated, which is the whole reason this folder’s turners sit on the BPM grid instead of on a free Hz dial. Halfway through the bar the same controls are a long way from home, so the test is not passing on a preset that never moved. GLOBAL PHASE closes the same way on the wrap map',
      abs1.exact && abs3.exact && abs1.moved > 1 && abs3.moved > 0.4,
      { oneTurn: { closedExactly: abs1.exact, atHalfBar: abs1.half, atStart: abs1.a },
        globalPhase: { closedExactly: abs3.exact, atHalfBar: abs3.half, atStart: abs3.a } });
    judge('22e · …and through the recorder’s OWN door — step(1/fps), which is what `modulation: "drive"` calls — it closes to a few parts in 1e12 rather than to the bit. The residue is not the phase law, it is `wall += dt` accumulating 120 roundings inside the clock before the beat is derived from it: 5.7e-12 rad of yaw, which is a ten-thousandth of a millionth of a degree, and 9e-13 of a turn of hue. Both are far below the 8-bit swapchain, but they are NOT zero and the difference between the two doors is worth stating rather than rounding away',
      !stp1.exact && stp1.worst < 1e-11 && stp3.worst < 1e-11 && stp1.worst > 0 && stp3.worst > 0,
      { oneTurnResidue: stp1.worst, globalPhaseResidue: stp3.worst,
        bitExactThroughAdvanceTo: abs1.exact });

    /* PEEL free-runs, and the LADDER is what makes it close anyway */
    const r = labRig();
    labPresetApply('lw.peel', { host: r.host });
    r.host.clock.play(1000);
    r.host.clock.advanceTo(1000);
    const p0 = r.reg.read('material.iso'), s0 = r.reg.read('material.softness');
    const seen = new Set([r.reg.read('material.iso')]);
    for (let k = 1; k <= FPS * 32; k++) { r.host.clock.advanceTo(1000 + k / FPS); seen.add(r.reg.read('material.iso')); }
    const p1 = r.reg.read('material.iso'), s1 = r.reg.read('material.softness');
    judge('22e · PEEL FREE-RUNS AT 1/32 Hz AND STILL CLOSES, for a different reason: its phase ACCUMULATES over 960 frames, but `steps: 12` quantises the macro to twelve rungs before it ever reaches a route, so a phase that is 1e-13 short of the cycle lands on the same rung and the level comes back BIT-IDENTICAL. The ladder is not only legibility — it is what makes an accumulating source repeatable. Twelve distinct levels are visited and no more, which is the claim the description makes',
      Object.is(p0, p1) && Object.is(s0, s1) && seen.size === 12,
      { levelsVisited: seen.size, isoStart: p0, isoEnd: p1, closedExactly: Object.is(p0, p1) });
  }

  /* ── 22f · A LOAD, THEN restoreAll(), GIVES THE USER BACK EVERY NUMBER ──────── */
  {
    const rows = [];
    let allOk = true;
    for (const p of LAB_PRESETS) {
      const r = labRig();
      const before = REGISTERED.map((id) => r.reg.baseOf(id));
      const card = clone(r.port);
      labPresetApply(p.id, { host: r.host });
      const afterLoad = REGISTERED.map((id) => r.reg.baseOf(id));
      r.host.clock.play(1000);
      for (let k = 1; k <= 40; k++) r.host.clock.advanceTo(1000 + k / 30);
      const held = REGISTERED.filter((id) => r.reg.isModulated(id));
      const n = r.reg.restoreAll();
      const basesKept = REGISTERED.every((id, i) => Object.is(r.reg.baseOf(id), before[i]));
      const loadKept = REGISTERED.every((id, i) => Object.is(afterLoad[i], before[i]));
      const atBase = REGISTERED.every((id) => Object.is(r.reg.read(id), r.reg.baseOf(id)));
      const cardBack = Object.is(r.port.obs.dist, card.obs.dist) &&
                       Object.is(r.port.mat.exposure, card.mat.exposure) &&
                       Object.is(r.port.clock.rate, card.clock.rate);
      const ok = basesKept && loadKept && atBase && cardBack && held.length === p.rack.routes.length && n === held.length;
      if (!ok) allOk = false;
      rows.push({ name: p.name, held: held.length, released: n, basesKept, loadKept, atBase, cardBack });
    }
    /* and across a SWITCH: the targets the outgoing patch was holding must let go */
    const r = labRig();
    const yaw0 = r.reg.baseOf('observer.yaw'), pitch0 = r.reg.baseOf('observer.pitch');
    labPresetApply('lw.oneturn', { host: r.host });
    r.host.clock.play(1000);
    for (let k = 1; k <= 17; k++) r.host.clock.advanceTo(1000 + k / 30);
    const movedAway = Math.abs(r.reg.read('observer.yaw') - yaw0) > 1e-6;
    labPresetApply('lw.peel', { host: r.host });
    const switched = Object.is(r.reg.read('observer.yaw'), yaw0) &&
                     Object.is(r.reg.read('observer.pitch'), pitch0) &&
                     !r.reg.isModulated('observer.yaw') && !r.reg.isModulated('observer.pitch');
    judge('22f · A PRESET LOAD NEVER COSTS THE USER A NUMBER: loading a patch does not touch a single BASE (the registry stores it in value space and a rack load goes nowhere near it), and after the modulator has been running, restoreAll() puts every one of the eleven back on its base with Object.is — not with a tolerance. Switching PATCHES is the same law seen from the other side: ONE TURN’s yaw and pitch are visibly moved, and loading PEEL over it hands both back exactly, because labPresetApply lets go before it loads and pushes once with force after',
      allOk && movedAway && switched,
      { rows, switchedCleanly: switched, yawMovedFirst: movedAway });
  }

  /* ── 22g · THE BAR AND THE STATE'S OWN BEAT ─────────────────────────────────── */
  {
    const T = 16.755, rate = 4;                       /* 1s+2s, the shipped clock rate */
    const rec = barTempo({ T, rate });
    const cut = barTempo({ seconds: 6 });
    const slow = barTempo({ seconds: 40 });           /* one bar would be 6 BPM: too slow */
    const fast = barTempo({ seconds: 0.5 });          /* one bar would be 480 BPM: too fast */
    const slowFix = barTempo({ seconds: 40, laps: slow.lapsThatFit });
    const bpmSet = M.setTransport({ bpm: rec.bpm }).bpm;
    const barSeconds = 60 * M.BEATS_PER_WHOLE / bpmSet;
    judge('22g · barTempo() TURNS THE STATE’S OWN RECURRENCE INTO THE TRANSPORT’S TEMPO, which is what makes this folder’s house rule mean anything: the density of 1s+2s repeats every T = 16.755 a.u. and the physics clock runs at 4 a.u. per wall second, so one recurrence is 4.18875 s of wall — and one BAR at 57.30 BPM is the same 4.18875 s, to 1e-12. Set that tempo and ONE TURN’s lap, GLOBAL PHASE’s turn and the density’s return are one event. The recorder’s door is the same function asked in seconds: a 6 s take wants 40 BPM exactly',
      Math.abs(rec.seconds - T / rate) < 1e-12 && Math.abs(rec.bpm - 57.2971) < 1e-3 &&
      !rec.clamped && Math.abs(barSeconds - T / rate) < 1e-12 &&
      cut.bpm === 40 && Math.abs(cut.barSeconds - 6) < 1e-12 && !cut.clamped,
      { recurrenceSeconds: rec.seconds, bpm: rec.bpm, barSecondsAtThatTempo: barSeconds,
        sixSecondTake: { bpm: cut.bpm, bar: cut.barSeconds } });
    judge('22g · …and when the bar cannot reach, it CLAMPS AND SAYS SO rather than quietly detuning the instrument: a 40 s recurrence wants 6 BPM against a floor of 20, so it reports `clamped` and hands back the lap count that IS exact — four laps per recurrence at 24 BPM, still perfect commensurability, still a closing seam, only no longer the word "one". A 0.5 s recurrence cannot be reached at ANY integer lap count and `fitsAtLaps` is false, which is the one answer that must never be dressed up',
      slow.clamped && slow.lapsThatFit === 4 && slow.fitsAtLaps &&
      Math.abs(slowFix.bpm - 24) < 1e-12 && !slowFix.clamped &&
      fast.clamped && !fast.fitsAtLaps,
      { tooSlow: { wanted: slow.wanted, clampedTo: slow.bpm, lapsThatFit: slow.lapsThatFit, bpmThatFits: slow.bpmThatFits },
        tooFast: { wanted: fast.wanted, fitsAtAnyLaps: fast.fitsAtLaps } });
  }

  M.modReset();
}

/* ══════════════ 23 · WAVE 65 — THE MOD ARM, AND THE THREE RESUME LAWS ═══════════
 *
 * Josh's spec in one line: a small MOD button beside play/pause that glows on or off; space is
 * one key for both clocks; and the resume behaviour is chosen by three chips the ported window
 * already draws — ANCH holds the curve where the pause caught it, TRIG starts it over, BPM jumps
 * back to the truncated note.  The browser gate (B132–B134) drives the real Space key at the real
 * window; this section is the arithmetic underneath it, deterministic and with no DOM in sight.
 */
{
  /** one rack, N LFOs, one target each, and a HAND macro on a third target — the hand is the
   *  clause a pause cannot satisfy and the arm must (the pause law's own line 2: "a hand does not
   *  let go because the clock did"). */
  function armRig(cfgs, opts) {
    const o = opts || {};
    const port = { a: 0.5, b: 0.5, c: 0.5 };
    const host = createModHost({ wall: 1000 });
    host.install([
      { id: 'material.exposure', label: 'A', map: 'linear', min: 0, max: 1, get: () => port.a, set: (v) => { port.a = v; } },
      { id: 'material.softness', label: 'B', map: 'linear', min: 0, max: 1, get: () => port.b, set: (v) => { port.b = v; } },
      { id: 'material.knee', label: 'C', map: 'linear', min: 0, max: 1, get: () => port.c, set: (v) => { port.c = v; } }
    ]);
    M.modReset();
    M.setTransport({ bpm: 60, sync: o.sync || 'wall', playing: false });
    const TG = ['material.exposure', 'material.softness'];
    const ids = [];
    cfgs.forEach((cfg, i) => {
      const s = M.addSource('lfo', Object.assign({ on: true, wave: 'rotate', smooth: 0, steps: 0 }, cfg));
      const m = M.macroList()[i] || M.addMacro(null);
      M.setMacro(m.id, { sourceId: null });
      M.setMacro(m.id, { sourceId: s.id });
      M.addRoute(m.id, TG[i], 0, 1);
      ids.push(s.id);
    });
    if (o.hand) {                       /* a macro with NO source: a knob a hand put at 0.7 */
      const hm = M.addMacro('HAND');
      M.setMacro(hm.id, { value: 0.7 });
      M.addRoute(hm.id, 'material.knee', 0, 1);
    }
    host.targets.sync();
    host.clock.recomputeRunning();
    return { host, port, ids };
  }
  const phases = (h) => h.clock.snapshot().sources.map((s) => s.phase);

  /* ── 23a · the ARM: off is not a pause ─────────────────────────────────────────── */
  {
    const r = armRig([{ sync: true, mult: 2 }], { hand: true });
    const base = r.host.registry.list().map((id) => r.host.registry.state(id).base);
    let w = 1000; r.host.clock.play(w);
    for (let i = 0; i < 90; i++) { w += 1 / 60; r.host.clock.advanceTo(w); }
    const moved = r.host.registry.list().filter((id) => r.host.registry.isModulated(id)).length;
    const running = { a: r.port.a, b: r.port.b, c: r.port.c };
    r.host.clock.pause(w);
    const paused = { a: r.port.a, b: r.port.b, c: r.port.c };
    const handHeldByPause = !Object.is(paused.c, base[2]);
    r.host.clock.setEnabled(false);
    const off = r.host.registry.list().map((id) => r.host.registry.read(id));
    const atBase = off.every((v, i) => Object.is(v, base[i]));
    r.host.clock.setEnabled(true);
    r.host.clock.play(w);
    for (let i = 0; i < 5; i++) { w += 1 / 60; r.host.clock.advanceTo(w); }
    const backOn = r.host.registry.list().filter((id) => r.host.registry.isModulated(id)).length;
    judge('23a · MOD OFF IS NOT A PAUSE, AND THAT IS THE WHOLE REASON IT EXISTS: with the transport merely stopped the pause law’s own line 2 keeps a HAND macro’s value on its target — "a hand does not let go because the clock did" — so 0.7 of knee is still not the user’s number. The arm reads OUTSIDE the four lines and hands every routed control back to its base with Object.is, hand macros included; re-arming picks all three up again',
      moved === 2 && handHeldByPause && atBase && backOn === 2 && !Object.is(running.a, base[0]),
      { modulatedWhileRunning: moved, handStillHeldByPause: handHeldByPause, allAtBaseWhenDisarmed: atBase, modulatedAfterRearm: backOn });
  }

  /* ── 23b · the arm does NOT reach the recorder's door ──────────────────────────── */
  {
    const trace = (armed) => {
      const r = armRig([{ sync: true, mult: 2 }]);
      r.host.clock.setEnabled(armed);
      const out = [];
      for (let i = 0; i < 40; i++) { r.host.clock.step(1 / 30); out.push([r.port.a, r.port.b]); }
      return JSON.stringify(out);
    };
    const on = trace(true), off = trace(false);
    /* AND THE TAKE STILL CLOSES.  120 frames of 1/30 s is exactly one bar at 60 BPM, and the
       1/4-note LFO holding EXPOSURE comes back where it started — through the recorder's own door,
       with the rack DISARMED, which is the state a user who has taken the modulation off is in. */
    /* THE WAVE IS A SINE HERE AND THAT IS NOT A CONVENIENCE.  `wall += 1/30` a hundred and twenty
       times lands 3.6e-12 SHORT of four beats, so the phase closes at 0.999999999996 rather than
       at 0 — the same residue §22e measures — and on a RAMP that sits on the far side of a real
       discontinuity, so a closure measured there would be measuring the wave and not the clock. */
    const closes = (armed) => {
      const r = armRig([{ sync: true, mult: 2, wave: 'sine' }]);
      M.setTransport({ bpm: 60 });
      r.host.clock.setEnabled(armed);
      r.host.clock.step(0); const a0 = r.port.a;
      for (let i = 0; i < 120; i++) r.host.clock.step(1 / 30);
      return { a0, a1: r.port.a, phase: M.sourceList()[0].phase, beats: M.transport.beats };
    };
    const cOn = closes(true), cOff = closes(false);
    judge('23b · …AND AN EXACT-PERIOD TAKE STILL CLOSES WITH THE RACK DISARMED: 120 frames of 1/30 s is exactly one bar at 60 BPM, and the 1/4-note LFO holding EXPOSURE comes back to its frame-0 value to 1e-9 through step(1/fps) — the same seam, and the same residue (§22e: it is `wall += dt` accumulating 120 roundings inside the clock, not the phase law), whether MOD is on or off',
      Math.abs(cOn.a1 - cOn.a0) < 1e-9 && Math.abs(cOff.a1 - cOff.a0) < 1e-9
        && Object.is(cOn.a0, cOff.a0) && Object.is(cOn.a1, cOff.a1),
      { armed: cOn, disarmed: cOff });
    judge('23b · THE ARM IS READ OUTSIDE THE DETERMINISTIC DOOR, so the RECORDER is untouched: render-exact.js’s `modulation: "drive"` pin STOPS the clock and then calls step(1/fps) per frame, and mir’s door applies as though running. An arm that reached inside step() would render an exact-period take with every modulator flat while every witness the renderer checks — LW.mod.running false throughout — still passed. 40 steps of 1/30 s are BYTE-IDENTICAL armed and disarmed',
      on === off && on.length > 100, { bytes: on.length, identical: on === off });
  }

  /* ── 23c · the three laws, on phase and on the beat ────────────────────────────── */
  {
    const run = (cfgs, sync) => {
      const r = armRig(cfgs, { sync });
      let w = 1000; r.host.clock.play(w);
      for (let i = 0; i < 150; i++) { w += 1 / 60; r.host.clock.advanceTo(w); }   /* 2.5 s = 2.5 beats */
      const before = { phase: phases(r.host), beats: M.transport.beats };
      r.host.clock.pause(w);
      w += 3.7; r.host.clock.elapseWhilePaused(3.7);                              /* real wall passes */
      r.host.clock.play(w);
      const plan = r.host.clock.resumePlan();
      return { before, after: { phase: phases(r.host), beats: M.transport.beats }, plan };
    };
    const A = run([{ sync: true, mult: 2, anchor: true }]);
    const B = run([{ sync: true, mult: 2 }]);
    const C = run([{ sync: false, trig: true, ratePos: 0.5 }]);
    judge('23c · ANCH HOLDS THE CURVE WHERE THE PAUSE CAUGHT IT: 2.5 beats in, phase 0.5, 3.7 s of wall pass with the transport down, and the resume comes back on the SAME phase and the SAME beat to the double — not on where the wall clock says it should be (6.2 beats). It is the model’s own middle branch in modPlayEdge ("the bar wins") plus a re-anchor at our stamp, and the law reports ANCH',
      A.plan.law === 'ANCH' && Object.is(A.after.phase[0], A.before.phase[0])
        && Object.is(A.after.beats, A.before.beats) && Math.abs(A.before.phase[0] - 0.5) < 1e-9,
      { law: A.plan.law, phase: [A.before.phase[0], A.after.phase[0]], beats: [A.before.beats, A.after.beats] });
    judge('23c · BPM JUMPS TO THE TRUNCATED NOTE: the same rack with ANCHOR off floors the beat to the boundary just passed — 2.5 beats to 2 on a 1/4-note grid, a rewind of exactly half a beat — and the source lands on phase 0 rather than on the 0.5 it was interrupted at. The grid is the model’s own beatsPerCycle and the move is setTransport({beats}), so nothing here re-derives the note ladder',
      B.plan.law === 'BPM' && B.plan.grid === 1 && Object.is(B.after.beats, 2)
        && Object.is(B.after.phase[0], 0) && Math.abs(B.plan.last.moved - 0.5) < 1e-9,
      { law: B.plan.law, grid: B.plan.grid, beats: [B.before.beats, B.after.beats], moved: B.plan.last.moved, phase: [B.before.phase[0], B.after.phase[0]] });
    judge('23c · TRIG STARTS THE CURVE OVER: a free-Hz source wearing TRIG comes back on phase 0 while the BEAT is untouched — the rewind is the source’s own and it claims nothing global, which is why it composes with either of the other two',
      C.plan.law === 'TRIG' && Object.is(C.after.phase[0], 0)
        && Object.is(C.after.beats, C.before.beats) && C.before.phase[0] > 0.01,
      { law: C.plan.law, phase: [C.before.phase[0], C.after.phase[0]], beats: [C.before.beats, C.after.beats] });

    const AB = run([{ sync: true, mult: 2, anchor: true }, { sync: true, mult: 2 }]);
    const TS = run([{ sync: true, mult: 2, trig: true }]);
    const FR = run([{ sync: true, mult: 2 }], 'free');
    judge('23c · THE CLAIM ORDER, because the beat is ONE number and can only obey one law: an ANCH chip anywhere in the rack holds the beat still and the BPM source beside it CONTINUES rather than jumping back — both come back on 0.5, neither on 0. And the first paint is not a lie: modPlayEdge rewinds the un-anchored source to a transient 0 that the next frame would overwrite from the beat, so the resume places every synced source with a dt = 0 EDIT before anything is applied',
      AB.plan.law === 'ANCH' && AB.plan.grid === 0 && Object.is(AB.after.beats, AB.before.beats)
        && Object.is(AB.after.phase[0], AB.before.phase[0]) && Object.is(AB.after.phase[1], AB.before.phase[1])
        && Math.abs(AB.after.phase[1] - 0.5) < 1e-9,
      { law: AB.plan.law, phases: [AB.before.phase, AB.after.phase], beats: [AB.before.beats, AB.after.beats] });
    judge('23c · TRIG ON A SYNCED SOURCE CLAIMS THE GRID AT ITS OWN NOTE, and it has to: under a bar sync mode the phase IS frac(beats / note), so a rewind the very next frame overwrites is a control that changes nothing. Flooring the beat to that source’s note gives phase 0 exactly — which is where "start the curve over" and "the truncated note" turn out to be the same number',
      TS.plan.grid === 1 && Object.is(TS.after.beats, 2) && Object.is(TS.after.phase[0], 0) && TS.plan.trig === 1,
      { law: TS.plan.law, grid: TS.plan.grid, trig: TS.plan.trig, beats: [TS.before.beats, TS.after.beats], phase: [TS.before.phase[0], TS.after.phase[0]] });
    judge('23c · AND THE FLAVOUR JOSH NAMED — "BPM has WALL/FREE" — is one behaviour reached two ways: under FREE a non-anchored synced source ACCUMULATES its own phase, so the beat is not its position and moving it would buy nothing. The beat is left exactly where it was and the phase still comes back on 0, because modPlayEdge’s last branch already floors it. Same resume, different mechanism, and the beat is not disturbed for a source that cannot read it',
      FR.plan.mode === 'free' && Object.is(FR.after.beats, FR.before.beats)
        && Object.is(FR.after.phase[0], 0) && FR.plan.last.applied === false && FR.before.phase[0] > 0.01,
      { mode: FR.plan.mode, beats: [FR.before.beats, FR.after.beats], phase: [FR.before.phase[0], FR.after.phase[0]], applied: FR.plan.last.applied });
  }

  /* ── 23d · resumeGrid is PURE and its names are the model's ────────────────────── */
  {
    const r = armRig([{ sync: true, mult: 0 }, { sync: true, mult: 4 }]);   /* whole note + 1/16 */
    const before = JSON.stringify(M.sourceList().map((s) => [s.phase, s.cycles, s.out]));
    const g1 = resumeGrid(M.sourceList()), g2 = resumeGrid(M.sourceList());
    const after = JSON.stringify(M.sourceList().map((s) => [s.phase, s.cycles, s.out]));
    const offRack = resumeGrid(M.sourceList().map((s) => ({ ...s, on: false })));
    judge('23d · THE GRID IS THE COARSEST LIVE NOTE, because that is the only grid on which every faster note also has a boundary: a whole note (4 beats) beside a 1/16 (0.25) gives 4, and every division of a whole note lands on its own boundary there too. resumeGrid is PURE — two calls change no phase, no cycle count and no output, so a face may call it on a frame — and a rack whose sources are all OFF claims nothing at all',
      g1.grid === 4 && g1.law === 'BPM' && g1.bpm === 2 && before === after
        && JSON.stringify(g1) === JSON.stringify(g2) && offRack.law === 'FREE' && offRack.grid === 0
        && RESUME_LAWS.indexOf(g1.law) >= 0,
      { grid: g1.grid, law: g1.law, counts: g1, pure: before === after, allOff: offRack });
  }
  M.modReset();
}

/* ══════════════ 24 · MACRO ORDER IS PRESENTATION, IDENTITY KEEPS THE ROUTES ══════════════ */
{
  M.modReset();
  const third = M.addMacro();
  const before = M.macroList(), firstId = before[0].id, secondId = before[1].id;
  M.setMacro(secondId, { name: 'BASS MOVEMENT' });
  const route = M.addRoute(firstId, 'material.exposure', 0, 0.4).route;
  const moved = M.moveMacro(firstId, 2);
  const order = M.macroList();
  const wire = JSON.parse(JSON.stringify(M.serialize()));
  M.modReset(); M.deserialize(wire);
  const restored = M.macroList();
  judge('24 · REORDERING MOVES A STABLE MACRO ID, not its wiring: macro 1 can move to slot 3 while its route keeps the same macroId, generated names follow the visible 1/2/3 order, a human name remains untouched, and serialization restores that same order',
    moved === 2 && order.map((m) => m.id).join() === [secondId, third.id, firstId].join()
      && order.map((m) => m.name).join('|') === 'BASS MOVEMENT|MACRO 2|MACRO 3'
      && M.routeList().some((r) => r.id === route.id && r.macroId === firstId)
      && restored.map((m) => m.id).join() === order.map((m) => m.id).join(),
    { moved, order: order.map((m) => [m.id, m.name]), routeMacro: route.macroId,
      restored: restored.map((m) => [m.id, m.name]) });
  M.removeMacro(third.id);
  judge('24 · REMOVING A ROW CLOSES THE ORDINAL GAP without renaming a human label',
    M.macroList().map((m) => m.name).join('|') === 'BASS MOVEMENT|MACRO 2',
    M.macroList().map((m) => [m.id, m.name]));
  M.modReset();
}

console.log((FAILED ? 'RED ' : 'GREEN ') + 'mir.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
