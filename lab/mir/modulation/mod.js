/* ═════════════════════════════════════════════════════════════════════════════
 * VENDORED FILE — lab/mir/mod.js
 *
 *   Source     $MB/app/mod.js  (MB = the local MANDELBROT checkout; see PORT-NOTES.md — wave 68
 *              took the absolute path out of a file that ships)
 *   Taken      2026-09-05, at 2978 lines
 *   sha256     d76cc74f886357a35794519e0a953f8f0328abea91443a47811e26dec5777b74
 *   Forced     8 edits.  Plus the reversible Final II matrix/audio extensions in docs/mir-matrix-patch.json.
 *              1/8  the PRESET_LS storage namespace                        (wave 52)
 *              2/8 … 6/8  the BIPOLAR route — flag, anchor, patch, save, load   (wave 61)
 *              7/8, 8/8  MOD_STATE_V and MOD_STATE_READS                   (wave 63)
 *              THE COUNT ON THIS LINE IS GATED.  It said "1 edit" for a whole wave after
 *              five more went in under it, and it could, because tests/mir.test.mjs §16
 *              strips exactly this header before it compares — the one sentence in the
 *              port that tells a maintainer how to read the file was the one sentence no
 *              proof could see.  §16 now reads the number out of this line and fails
 *              unless it equals the `forced edit n/N` markers in the body below.
 *
 * THE LAW OF THIS FILE: IT IS MAINTAINED BY DIFF AGAINST ITS SOURCE, NEVER
 * REWRITTEN.  An upstream fix must still be a three-line patch a year from now.
 * So: do not reformat it, do not re-order it, do not tidy it, do not "improve"
 * a comment, and do not let a linter near it.  Every forced change is ONE line,
 * carries a `λWAVES:` marker on the line above, and is listed in PORT-NOTES.md
 * with its reason.  If you need different behaviour, change lab/mir/host.js —
 * the host is ours, this file is theirs.
 *
 * To take an upstream fix:
 *   diff -u "<source>/mod.js" lab/mir/mod.js      # the header + the marked lines
 *   cp "<source>/mod.js" lab/mir/mod.js && re-apply this header and the markers
 * ═════════════════════════════════════════════════════════════════════════════ */
/* mod.js — the modulation model: macros, sources, routes and presets. Pure: no DOM, no renderer, no storage. */

import {
  addPoint, applyPreset, clonePoints, curveInfo, evaluate as curveEval,
  flip as curveFlip, movePoint, normalizePoints, presetPoints, removePoint, setTension
} from './curve.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const frac = (v) => v - Math.floor(v);
const TAU = 6.283185307179586;

/* Tempo range and default, BPM. */
export const BPM_MIN = 20, BPM_MAX = 300, BPM_DEFAULT = 60;
/* The LFO clock divisions and their labels, 1 down to 1/128. */
export const LFO_MULTS = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 16, 1 / 32, 1 / 64, 1 / 128];
export const LFO_MULT_LABEL = ['1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128'];
export const LFO_MULT_DEFAULT = 2;                 // 1/4 note = one beat
export const TRIPLET = 2 / 3, DOTTED = 3 / 2;
export const BEATS_PER_WHOLE = 4;
export const SMOOTH_TAU_MAX = 0.5;
export const ENV_MAX_S = 8;
/* Macro counts: how many exist at boot, and the maximum. */
export const MACRO_BOOT = 2;
export const MACRO_MAX = 8;
/* The modulation model version, and the versions this build can read. */
/* λWAVES: forced edit 7/8 — THE VERSION HAD TO MOVE, because edits 2/8 and 6/8 changed
   what a stored route MEANS.  A rack carrying `bi` and read by a build without them drops
   the flag, `routeInfluence` measures from r.min again, and the base walks from the centre
   of the swing to its floor — 30 % of scale at the macro's middle, silently, on the second
   open.  That is exactly what a version stamp is for, and leaving it at 4 made the change
   version-INDISTINGUISHABLE.  The λWAVES namespace starts at 100 (= 100 + the upstream
   version this model is derived from) so our 104 can never be mistaken for an upstream 5,
   and an upstream 5 we have never seen is refused here rather than half-read. */
export const MOD_STATE_V = 108;
/** Every model version whose racks and presets THIS build can read.  A version
    outside it is refused loudly and the stored blob is left untouched. */
/* λWAVES: forced edit 8/8 — and 3 and 4 are still read: a rack with no `bi` on any route
   is byte-identical on the wire to one written before the flag existed, so there is nothing
   to migrate in that direction and refusing it would throw away every patch made before
   wave 61.  The refusal only runs the other way. */
export const MOD_STATE_READS = Object.freeze([3, 4, 104, 105, 106, 107, 108]);
/** Is this stamped model version one this build understands?  An ABSENT stamp
    is NOT handled here — it is the callers' (library.js reads absent as
    "predates the stamp, fine"; the preset store has stamped every record since
    the day it shipped, so absent there is a malformed record). */
export function modStateReadable(v) {
  return Number.isFinite(v) && MOD_STATE_READS.indexOf(v | 0) >= 0;
}
/* Migrates a rack from an older model version to the current one. */
export function migrateRack(rack, fromV) {
  if (!rack || typeof rack !== 'object') return null;
  if (!modStateReadable(fromV)) return null;
  return rack;                      // 3 -> 4: nothing to do, and the gate says so
}

/* The macro kinds. */
export const MACRO_KINDS = ['knob', 'trigger'];
const macroKind = (k) => (k === 'trigger' ? 'trigger' : 'knob');

/* Quantiser step bounds; STEPS_OFF means no quantisation. */
export const STEPS_MIN = 2, STEPS_MAX = 1024;
export const STEPS_OFF = 0;

/** THE DETENT LADDER, index 0 = OFF.  One table, exported, so the pure-node
    gate and the browser knob cannot disagree about what a rung is.  (LFO_MULTS
    is the precedent: a UI ladder lives in the model because the model is the
    only file both a node process and a browser can read.) */
export const STEPS_LADDER = (() => {
  const a = [STEPS_OFF];
  for (let n = STEPS_MIN; n <= 24; n++) a.push(n);
  for (const n of [32, 48, 64, 96, 128, 192, 256,
                   384, 512, 768, 1024]) a.push(n);
  return a;
})();

/** Which detent is this rung count nearest to?  A value that is ON the ladder
    answers exactly; anything else (a harness-set 100, an old patch) answers the
    NEAREST rung, in log space above the contiguous run — because the tail is
    geometric and 100 is nearer 96 than 128 by ratio as well as by difference.
    Returns an index into STEPS_LADDER, never -1. */
export function stepsRungIndex(n) {
  const v = Number.isFinite(n) ? (n | 0) : 0;
  if (v < STEPS_MIN) return 0;
  let best = 1, bestD = Infinity;
  for (let i = 1; i < STEPS_LADDER.length; i++) {
    const d = Math.abs(Math.log(v) - Math.log(STEPS_LADDER[i]));
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/* Quantises v to the given number of steps, wrapping when circular. */
export function stepQuant(v, steps, circular) {
  if (!(steps >= STEPS_MIN)) return v;
  const N = (steps > STEPS_MAX ? STEPS_MAX : steps | 0);
  /* THE CIRCLE.  `k >= N ? 0` rather than `k % N` so the wrap is a stated case
     a reader can see, and so the answer at the seam is 0 rather than -0. */
  if (circular) { const k = Math.round(clamp01(v) * N); return (k >= N ? 0 : k) / N; }
  const n = N - 1;
  return Math.round(clamp01(v) * n) / n;
}

/* Clamps a step count to the allowed range. */
function clampSteps(v) {
  const i = v | 0;
  if (!Number.isFinite(v) || i < STEPS_MIN) return STEPS_OFF;
  return i > STEPS_MAX ? STEPS_MAX : i;
}

/* Clamps a phase offset to [0, 1). */
function clampPhaseOff(v) {
  if (!Number.isFinite(v)) return 0;
  return (v >= 0 && v <= 1) ? v : frac(v);
}

/* THE FREE-RUN RATE DIAL.  Identical law and identical ends to 2a's rate dial
   (0.01..3 Hz, log) — it IS that dial, because a migrated v2 routing must keep
   its rate to the bit.  Duplicated here rather than imported so this file stays
   free of anim.js; the gate asserts the two agree at both ends and at 0.39. */
export const RATE_MIN = 0.01, RATE_MAX = 3.0;
const RATE_K = Math.log(RATE_MAX / RATE_MIN);
const RATE_HOME = Math.sqrt(RATE_MIN * RATE_MAX);
const RATE_P0 = Math.log(RATE_HOME / RATE_MIN) / RATE_K;
export function freeHz(ratePos) {
  return RATE_HOME * Math.exp(RATE_K * (clamp01(ratePos) - RATE_P0));
}

/* The LFO wave shapes and their labels. */
export const WAVES = ['rotate', 'sine', 'tri', 'sawdown', 'square', 'sh', 'drift'];
export const WAVE_LABEL = {
  rotate: 'SAW↑', sine: 'SINE', tri: 'TRI', sawdown: 'SAW↓',
  square: 'SQR', sh: 'S&H', drift: 'DRIFT'
};

function waveHash01(seed, n) {
  let x = (seed ^ Math.imul(n | 0, 0x9E3779B1)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  return x / 4294967296;
}
/** FNV-1a of an id — the per-source seed.  Stable across sessions. */
export function waveSeedOf(id) {
  let h = 2166136261 >>> 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

export function waveAt(wave, phi, ctx) {
  const p = frac(phi);
  if (wave === 'rotate') return p;
  if (wave === 'tri') return 1 - Math.abs(2 * p - 1);
  if (wave === 'sawdown') return 1 - p;
  if (wave === 'square') return p < 0.5 ? 0 : 1;
  if (wave === 'sh' || wave === 'drift') {
    const c = ctx && Number.isFinite(ctx.cycles) ? ctx.cycles | 0 : 0;
    const seed = ctx && Number.isFinite(ctx.seed) ? ctx.seed >>> 0 : 0;
    const a = waveHash01(seed, c);
    if (wave === 'sh') return a;
    const b = waveHash01(seed, c + 1);
    const t = p * p * (3 - 2 * p);
    return a + (b - a) * t;
  }
  return 0.5 - 0.5 * Math.cos(TAU * p);
}

/* The audio outputs a macro may bind. */
export const AUDIO_OUTPUTS  = Object.freeze(['level', 'low', 'mid', 'high', 'hit', 'beat']);
/** The five a macro may bind in v1.  `beat` is RESERVED — present in the
    schema so a save written today needs no renaming the day tempo estimation
    lands, and absent from sourceIds() so nothing can bind it (Sol Q3h: onset-
    interval BPM is not beat and is certainly not downbeat). */
export const AUDIO_EXPOSED  = Object.freeze(['level', 'low', 'mid', 'high', 'hit']);
export const AUDIO_RESERVED = Object.freeze(['beat']);
/** The four that carry a continuous follower. */
export const AUDIO_FOLLOWED = Object.freeze(['level', 'low', 'mid', 'high']);
/** A LABEL the face fills and the engine never reads: which thing is making
    the sound.  Kept in the model so it round-trips through a save. */
export const AUDIO_SOURCES  = Object.freeze(['mic', 'file', 'device']);
export const AUDIO_MODES    = Object.freeze(['follow', 'trigger']);

export const AUDIO_DB_FLOOR = -60;      // normalises to 0, exactly
export const AUDIO_DB_TOP   = -6;       // normalises to 1, exactly
export const AUDIO_RANGE_MIN = -90;
export const AUDIO_RANGE_MAX = 0;
export const AUDIO_RANGE_GAP = 1;       // dB; endpoints never cross
export const AUDIO_TIME_MAX = 2000;
export const AUDIO_DB_SPAN  = AUDIO_DB_TOP - AUDIO_DB_FLOOR;      // 54
export const AUDIO_GAIN_MAX = 24;       // +/- dB
export const AUDIO_LEVEL_MIX_DEFAULTS = Object.freeze({ level: 1, low: 1, mid: 1, high: 1 });

/** attack/release TIME CONSTANTS in ms, per output.  See the essay above for
    why MID and LEVEL are the arithmetic midpoint and why 5 ms is a snap. */
export const AUDIO_FOLLOW_DEFAULTS = Object.freeze({
  level: Object.freeze({ attackMs: 10, releaseMs: 120, holdMs: 0 }),
  low:   Object.freeze({ attackMs: 15, releaseMs: 180, holdMs: 0 }),
  mid:   Object.freeze({ attackMs: 10, releaseMs: 120, holdMs: 0 }),
  high:  Object.freeze({ attackMs:  5, releaseMs:  60, holdMs: 0 }),
  hit:   Object.freeze({ attackMs:  0, releaseMs:   0, holdMs: 0 }),
  beat:  Object.freeze({ attackMs:  0, releaseMs:   0, holdMs: 0 })
});
/** The one mode each output has in v1.  DERIVED, never a knob — the schema
    carries it (so v2 can make it settable with no migration) and setSource
    REFUSES to write it, because "LOW in TRIGGER mode" would need a per-band
    onset detector this wave does not build and a control that does nothing is
    worse than no control. */
export const AUDIO_OUT_MODE = Object.freeze({
  level: 'follow', low: 'follow', mid: 'follow', high: 'follow',
  hit: 'trigger', beat: 'follow'
});
export const AUDIO_GATE_DEFAULTS = Object.freeze({
  thresholdDb: -55, hysteresisDb: 3, holdMs: 83
});
/** The onset detector's constants.  These are the DETECTOR, not the device:
    a per-device `histN` is generality nobody asked for, and the day one of
    these needs to move it moves for everybody at once. */
export const AUDIO_ONSET = Object.freeze({
  histN: 45,            // the flux history the threshold is estimated over
  madK: 4,              // T = max(floor, median + madK * MAD)
  floorDb: -55,         // the input must be above this to be an onset at all
  refractoryMs: 83      // 5 frames at 60 Hz
});
/** SENSITIVITY: the absolute floor under the adaptive threshold.  A DEVICE
    parameter (the face's vertical drag on the waveform), ours and tunable —
    see the essay.  Never 0: with a silent input the median and the MAD are
    both 0, and a zero floor would make every rounding wobble an onset. */
export const AUDIO_FLUX_FLOOR = 0.02;
/** No feed is assumed to arrive at this rate — it is what the face's readout
    shows before the first frame and what a dump prints for an unfed device. */
export const AUDIO_FEED_HZ_DEFAULT = 60;

const clampDb = (v, lo, hi) => (Number.isFinite(v) ? (v < lo ? lo : v > hi ? hi : v) : null);
/** A linear RMS AMPLITUDE in dBFS.  Silence answers -Infinity, which the
    normaliser turns into exact 0 — the whole point of doing it this way round
    rather than clamping the amplitude first. */
export function audioDbAmp(x) { return x > 0 ? 20 * Math.log10(x) : -Infinity; }
/** A linear band POWER in dBFS.  10*log10, not 20 — a power is already a
    square, and getting this wrong halves every band reading. */
export function audioDbPow(x) { return x > 0 ? 10 * Math.log10(x) : -Infinity; }

/**
 * THE FIXED-dB NORMALISER.  clamp((dBFS + gainDb + 60) / 54, 0, 1), with EXACT
 * 0 at and below the floor and EXACT 1 at and above the top — the two ends are
 * their own branches so no rounding can put 1e-17 into a resting picture.
 */
export function audioNorm(dbfs, gainDb) {
  const g = Number.isFinite(gainDb) ? gainDb : 0;
  if (!Number.isFinite(dbfs)) return dbfs === Infinity ? 1 : 0;   // -Infinity => silence
  const d = dbfs + g;
  if (d <= AUDIO_DB_FLOOR) return 0;
  if (d >= AUDIO_DB_TOP) return 1;
  return (d - AUDIO_DB_FLOOR) / AUDIO_DB_SPAN;
}

/** The follower coefficient for a time constant at THIS feed rate.  A tau of 0
    is a pass-through (alpha 0), which is what "instant" has to mean when the
    knob is at its bottom. */
export function audioAlpha(tauMs, feedHz) {
  const tau = Number.isFinite(tauMs) && tauMs > 0 ? tauMs / 1000 : 0;
  const f = Number.isFinite(feedHz) && feedHz > 0 ? feedHz : AUDIO_FEED_HZ_DEFAULT;
  if (!(tau > 0)) return 0;
  return Math.exp(-1 / (f * tau));
}
/** The time in ms for a step response to reach `frac` of its target, at this
    time constant: -tau*ln(1-frac).  What the face's readout prints beside the
    knob so "15 ms" and "34.5 ms to 90 %" are both on the device. */
export function audioRiseMs(tauMs, frac) {
  const f = Number.isFinite(frac) ? frac : 0.632;
  if (!(tauMs > 0) || !(f > 0) || f >= 1) return 0;
  return -tauMs * Math.log(1 - f);
}

/** Median of a plain array of finite doubles.  Sorted numerically into a
    caller-owned scratch array so the per-feed path allocates nothing. */
function medianInto(scratch, src, n) {
  if (n <= 0) return 0;
  for (let i = 0; i < n; i++) scratch[i] = src[i];
  const a = scratch.subarray ? scratch.subarray(0, n) : scratch.slice(0, n);
  a.sort();                                  // Float64Array.sort is numeric
  const h = n >> 1;
  return (n & 1) ? a[h] : 0.5 * (a[h - 1] + a[h]);
}

/* ═══════════════════════════ THE STATE ═════════════════════════════════════ */

const macros = [];
const macroById = new Map();
const sources = [];
const sourceById = new Map();
const routes = [];
const routeById = new Map();
/* Routes indexed by target id. */
const routeByTarget = new Map();

/* The transport sync modes and the shipped default. */
export const SYNC_MODES = ['free', 'wall', 'ext'];
export const SYNC_DEFAULT = 'wall';
/** A mode name, or NULL if it is not one.  The loader REFUSES rather than
    guessing (harness r12: no silent reinterpretation of an old blob). */
export function clampSyncMode(m) {
  const k = String(m === null || m === undefined ? '' : m).toLowerCase();
  return SYNC_MODES.indexOf(k) >= 0 ? k : null;
}

/** The transport: ONE accumulator pair for the whole engine.  `beats` is what
    an ANCHORed LFO reads; `time` is kept because a dump that cannot say how
    long the session has been playing cannot explain a phase. */
export const transport = {
  bpm: BPM_DEFAULT, beats: 0, time: 0, triggers: 0, plays: 0,
  sync: SYNC_DEFAULT,
  wall: 0, anchorAt: 0, anchorBeats: 0, anchorTime: 0, pending: true, reanchors: 0,
  /* THE EXT SEAM, AND ALL OF IT: a name so a dump can say WHO is driving, the
     beat position that source last wrote, and a counter.  No name or no
     position means no source, and no source means EXT behaves as WALL. */
  extName: null, extBeats: null, extWrites: 0,
  hold: false, holdNote: null, holdL: 0, holdP: 0, holdA: 0, holds: 0,
  playing: false
};

/* Tap tempo: the longest gap that still counts, and the early-tap count. */
export const TAP_GAP_MS = 2600;    // longer than a 23 BPM beat: past this it is a new count
export const TAP_EARLY  = 4;       // the first window: the average of the last 4
export const TAP_WIN    = 8;       // the continuing window
export const TAP_SETTLE = 8;       // taps in the run before the wide window opens
export const TAP_WILD   = 0.40;    // one interval this far off the run restarts it
export const TAP_STRAY  = 0.18;    // ...and two in a row this far off, the same way, do too

/** +1 if d is that much LONGER than mu, -1 if that much shorter, 0 if neither.
    The reciprocal form rather than a symmetric percentage, because intervals
    are a ratio scale: 1.18x and 1/1.18x are the same size of mistake. */
function tapStray(d, mu, tol) {
  if (!(mu > 0) || !(d > 0)) return 0;
  const r = d / mu;
  if (r > 1 + tol) return 1;
  if (r < 1 / (1 + tol)) return -1;
  return 0;
}
function tapMean(iv, from, to) {           // mean of iv[from .. to-1]
  let sum = 0;
  for (let i = from; i < to; i++) sum += iv[i];
  return (to > from) ? sum / (to - from) : 0;
}

/* Returns the tempo implied by a run of taps. */
export function tapTempo(taps, t) {
  let run = Array.isArray(taps) ? taps.slice() : [];
  let reset = 'none';
  if (!Number.isFinite(t)) return { taps: run, bpm: null, reset: 'none', k: 0, window: 0, mean: 0 };
  if (run.length && (t - run[run.length - 1]) > TAP_GAP_MS) { run.length = 0; reset = 'gap'; }
  run.push(t);
  while (run.length > TAP_WIN + 1) run.shift();

  const iv = [];
  for (let i = 1; i < run.length; i++) iv.push(run[i] - run[i - 1]);

  /* the two poison tests, against the run WITHOUT the newest interval */
  if (iv.length >= 3) {
    const n = iv.length;
    const mu = tapMean(iv, 0, n - 1);
    const s1 = tapStray(iv[n - 1], mu, TAP_WILD);
    if (s1 !== 0) {
      run = run.slice(-2);                 // one interval: this one
      reset = 'wild';
    } else if (n >= 4) {
      /* BOTH strays are judged against the run AS IT STOOD BEFORE EITHER OF
         THEM.  Measured, and it is why this is not `mu`: with the first stray
         already inside the mean, a +22 % change dilutes to +17.7 % by the time
         the second one is tested and the rule silently stops firing on exactly
         the moderate tempo changes it exists for. */
      const base = tapMean(iv, 0, n - 2);
      const a = tapStray(iv[n - 1], base, TAP_STRAY);
      const b = tapStray(iv[n - 2], base, TAP_STRAY);
      if (a !== 0 && a === b) {
        run = run.slice(-3);               // two intervals: the two that strayed
        reset = 'shift';
      }
    }
  }

  const k = run.length - 1;
  if (k < 1) return { taps: run, bpm: null, reset, k: 0, window: 0, mean: 0 };
  const w = (run.length >= TAP_SETTLE) ? Math.min(k, TAP_WIN) : Math.min(k, TAP_EARLY);
  const mean = (run[run.length - 1] - run[run.length - 1 - w]) / w;
  return { taps: run, bpm: mean > 0 ? 60000 / mean : null, reset, k, window: w, mean };
}

const seq = { macro: 0, source: 0, route: 0 };
export const modStat = { macroAdds: 0, macroRemoves: 0, macroMoves: 0, sourceAdds: 0, sourceRemoves: 0,
                         routeAdds: 0, routeRemoves: 0, routeReplaces: 0, triggers: 0,
                         sourceMoves: 0, macroRefusals: 0, bankPastes: 0,
                         presetSaves: 0, presetLoads: 0, presetDeletes: 0,
                         macroFires: 0, macroReleases: 0, triggerSubs: 0,
                         holdStarts: 0, holdEnds: 0, holdRefused: 0,
                         hitBuilds: 0,
                         syncSets: 0, syncRefused: 0,
                         audioFeeds: 0, audioRefused: 0, audioHits: 0,
                         audioTriggers: 0, audioSetRefused: 0,
                         migratedFrom: 0 };


/* ═══════════════════════════ construction ══════════════════════════════════ */

/* Returns the generated name for a new macro. */
function genericMacroName(index0, kind) {
  return (kind === 'trigger' ? 'TRIG ' : 'MACRO ') + (index0 + 1);
}
function renumberGenericMacros() {
  for (let i = 0; i < macros.length; i++) if (!macros[i].named) macros[i].name = genericMacroName(i, macros[i].kind);
}

function newMacro(name, opts) {
  const o = opts || {};
  const id = o.id || ('m' + (++seq.macro));
  const kind = macroKind(o.kind);
  const m = {
    id,
    kind,
    /** Has a HUMAN named it?  Only a typed name survives; everything else is
        the slot's generic label, recomputed from its position. */
    named: !!o.named,
    name: (o.named && name) ? String(name).slice(0, 24) : genericMacroName(macros.length, kind),
    /* a pad has no value; it is left at 0 for ever so a reader that forgets to
       ask the kind still gets a number that moves nothing */
    value: (kind === 'trigger') ? 0 : (Number.isFinite(o.value) ? clamp01(o.value) : 0),
    /* One unipolar gain over this Macro's outgoing route influence.  It does
       not alter the Macro reading or any route's own signed range. */
    masterDepth: Number.isFinite(o.masterDepth) ? clamp01(o.masterDepth) : 1,
    sourceId: (kind === 'trigger') ? null
            : ((o.sourceId && bindableSource(o.sourceId)) ? String(o.sourceId) : null)
  };
  macros.push(m);
  macroById.set(id, m);
  modStat.macroAdds++;
  return m;
}

/** A source's shape, in one object, so 'wave' and 'curve' can never half-apply. */
function newShape(o) {
  const wave = (o && WAVES.indexOf(o.wave) >= 0) ? o.wave : 'sine';
  const mode = (o && o.shapeMode === 'curve') ? 'curve' : 'wave';
  const points = (o && Array.isArray(o.points) && o.points.length)
    ? normalizePoints(o.points) : presetPoints('sine');
  return { mode, wave, points };
}

/* Migrates a gate record from an older shape. */
function migrateGate(raw, isLfo, dflt) {
  const o = raw || {};
  const pre = (o.trig === undefined);
  return {
    trig:   pre ? (isLfo && o.mode === 'trig') : !!o.trig,
    invert: (pre && isLfo) ? (o.mode === 'invert')
                           : (o.invert === undefined ? !!(dflt && dflt.invert) : !!o.invert)
  };
}
/** The legacy shadow: what `mode` reads as, derived, never stored as truth.
    Lossy by construction in the both-on case — which is exactly the state the
    old 3-way could not hold and is why it stopped being the model. */
function modeShadow(s) {
  return s.trig ? 'trig' : (s.invert ? 'invert' : 'off');
}

/* Returns the default follow settings for an audio output. */
function audioOutDefaults(key) {
  const d = AUDIO_FOLLOW_DEFAULTS[key] || AUDIO_FOLLOW_DEFAULTS.level;
  return { attackMs: d.attackMs, releaseMs: d.releaseMs, holdMs: d.holdMs, mode: AUDIO_OUT_MODE[key] };
}
/** One output's stored parameters, inspected.  `mode` is DERIVED from the key
    and never read off the payload — see AUDIO_OUT_MODE. */
export function audioRangeNorm(dbfs, gainDb, out) {
  if (!out || (out.floorDb === AUDIO_DB_FLOOR && out.ceilingDb === AUDIO_DB_TOP)) return audioNorm(dbfs, gainDb);
  if (!Number.isFinite(dbfs)) return dbfs === Infinity ? 1 : 0;
  return clamp01((dbfs + gainDb - out.floorDb) / (out.ceilingDb - out.floorDb));
}
function audioOutFrom(raw, key) {
  const d = audioOutDefaults(key);
  const o = raw && typeof raw === 'object' ? raw : null;
  const t = (v, dflt) => (Number.isFinite(v) && v >= 0 ? Math.min(AUDIO_TIME_MAX, v) : dflt);
  const floorDb = Number.isFinite(o && o.floorDb) ? Math.max(AUDIO_RANGE_MIN, Math.min(AUDIO_RANGE_MAX - AUDIO_RANGE_GAP, o.floorDb)) : AUDIO_DB_FLOOR;
  const ceilingDb = Number.isFinite(o && o.ceilingDb) ? o.ceilingDb : AUDIO_DB_TOP;
  return { floorDb, ceilingDb: Math.max(floorDb + AUDIO_RANGE_GAP, Math.min(AUDIO_RANGE_MAX, ceilingDb)),
           attackMs: t(o && o.attackMs, d.attackMs),
           releaseMs: t(o && o.releaseMs, d.releaseMs),
           holdMs: t(o && o.holdMs, d.holdMs),
           mode: d.mode };
}
/** The AUDIO device's whole patch, inspected, from a payload or from nothing.
    Refuse-don't-repair: a `source` this build does not know falls back to the
    default rather than being kept as a live string nothing can act on. */
function audioPatchFrom(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const outs = {};
  for (const k of AUDIO_OUTPUTS) outs[k] = audioOutFrom(o.outs && o.outs[k], k);
  const mixIn = o.levelMix && typeof o.levelMix === 'object' ? o.levelMix : {};
  const levelMix = {};
  for (const k of AUDIO_FOLLOWED) levelMix[k] = Number.isFinite(mixIn[k]) ? clamp01(mixIn[k]) : AUDIO_LEVEL_MIX_DEFAULTS[k];
  const g = AUDIO_GATE_DEFAULTS;
  return {
    gateEnabled: o.gateEnabled !== false,
    source: AUDIO_SOURCES.indexOf(o.source) >= 0 ? o.source : 'mic',
    gainDb: Number.isFinite(o.gainDb)
      ? Math.max(-AUDIO_GAIN_MAX, Math.min(AUDIO_GAIN_MAX, o.gainDb)) : 0,
    thresholdDb: clampDb(o.thresholdDb, -90, 0) === null ? g.thresholdDb : clampDb(o.thresholdDb, -90, 0),
    hysteresisDb: Number.isFinite(o.hysteresisDb)
      ? Math.max(0, Math.min(24, o.hysteresisDb)) : g.hysteresisDb,
    holdMs: Number.isFinite(o.holdMs) ? Math.max(0, Math.min(4000, o.holdMs)) : g.holdMs,
    fluxFloor: Number.isFinite(o.fluxFloor) && o.fluxFloor > 0
      ? Math.min(10, o.fluxFloor) : AUDIO_FLUX_FLOOR,
    levelMix, outs
  };
}
/** The patch, out of a live device — the exact shape audioPatchFrom reads. */
function audioPatchOf(s) {
  const outs = {};
  for (const k of AUDIO_OUTPUTS) {
    outs[k] = { floorDb: s.audio.outs[k].floorDb, ceilingDb: s.audio.outs[k].ceilingDb,
                attackMs: s.audio.outs[k].attackMs,
                releaseMs: s.audio.outs[k].releaseMs,
                holdMs: s.audio.outs[k].holdMs,
                mode: s.audio.outs[k].mode };
  }
  return { gateEnabled: s.audio.gateEnabled, source: s.audio.source, gainDb: s.audio.gainDb,
           thresholdDb: s.audio.thresholdDb, hysteresisDb: s.audio.hysteresisDb,
           holdMs: s.audio.holdMs, fluxFloor: s.audio.fluxFloor,
           levelMix: { ...s.audio.levelMix }, outs };
}
function audioPatchApply(s, q) {
  const p = audioPatchFrom(q);
  s.audio.source = p.source; s.audio.gainDb = p.gainDb; s.audio.gateEnabled = p.gateEnabled;
  s.audio.thresholdDb = p.thresholdDb; s.audio.hysteresisDb = p.hysteresisDb;
  s.audio.holdMs = p.holdMs; s.audio.fluxFloor = p.fluxFloor;
  for (const k of AUDIO_FOLLOWED) s.audio.levelMix[k] = p.levelMix[k];
  for (const k of AUDIO_OUTPUTS) {
    s.audio.outs[k].floorDb = p.outs[k].floorDb; s.audio.outs[k].ceilingDb = p.outs[k].ceilingDb;
    s.audio.outs[k].attackMs = p.outs[k].attackMs;
    s.audio.outs[k].releaseMs = p.outs[k].releaseMs;
    s.audio.outs[k].holdMs = p.outs[k].holdMs;
  }
}

/** The RUNTIME half — never serialized, never in a bank, never in a preset.
    A follower state per followed output, the gate, the flux history ring and
    the detector's one-frame memory.  `audioResetRuntime` is the only writer of
    its initial value, so "a reset is exactly a fresh device" is one call. */
function audioResetRuntime(s) {
  const r = s.audioRt;
  for (const k of AUDIO_FOLLOWED) { r.env[k] = 0; r.peakHold[k] = 0; }
  r.inputDb = Object.fromEntries(AUDIO_FOLLOWED.map(k => [k, -Infinity]));
  r.hist.fill(0); r.histN = 0; r.histI = 0;
  r.gateOpen = false; r.gateHold = 0;
  r.prevFlux = 0; r.prevPrevFlux = 0; r.prevT = 0; r.prevDb = -Infinity;
  r.prevAt = 0; r.havePrev = false; r.refractory = 0;
  r.lastDb = -Infinity; r.lastFlux = 0; r.threshold = 0;
  r.feedHz = AUDIO_FEED_HZ_DEFAULT; r.sampleRate = 0;
  r.hits = 0; r.frames = 0; r.fed = false;
  r.hitAgeSeconds = 0; r.capturedAt = 0;
  for (const k of AUDIO_EXPOSED) {
    const c = sourceById.get(s.id + ':' + k);
    if (c) { c.out = 0; c.cont = 0; }
  }
}

function newSource(kind, opts) {
  const o = opts || {};
  const id = o.id || ('s' + (++seq.source));
  const shape = newShape(o);
  const gate = migrateGate(o, kind !== 'env', null);
  const s = {
    id,
    kind: kind === 'env' ? 'env' : (kind === 'audio' ? 'audio' : 'lfo'),
    /** bank chooses one of two saved parameter snapshots on this source. */
    bank: o.bank === 'B' ? 'B' : 'A',
    on: o.on === undefined ? true : !!o.on,
    label: o.label ? String(o.label) : '',
    shapeMode: shape.mode, wave: shape.wave, points: shape.points,

    /* ── LFO ── */
    sync: !!o.sync,                                   // the BPM checkbox
    mult: clampMult(o.mult, LFO_MULT_DEFAULT),
    triplet: !!o.triplet, dotted: !!o.dotted,
    ratePos: Number.isFinite(o.ratePos) ? clamp01(o.ratePos) : 0.39,
    phaseOff: clampPhaseOff(o.phaseOff),
    smooth: Number.isFinite(o.smooth) ? clamp01(o.smooth) : 0,
    trig: gate.trig,
    mode: 'off',                                      // the shadow, set below
    anchor: !!o.anchor,
    steps: clampSteps(o.steps),
    phase: 0, cycles: 0,
    rseed: Number.isFinite(o.rseed) ? (o.rseed >>> 0) : waveSeedOf(o.seedFrom || id),

    /* ── ENV (seconds; `s` is a LEVEL) ── */
    a: envTime(o.a, 0.01), hold: envTime(o.hold, 0), d: envTime(o.d, 0.30),
    s: Number.isFinite(o.s) ? clamp01(o.s) : 0.5, r: envTime(o.r, 0.60),
    ta: envTension(o.ta), td: envTension(o.td), tr: envTension(o.tr),
    invert: gate.invert,
    /** The editor's time window in seconds — the sketch's "up-arrow / magnifier
        / down-arrow to rescale time" over a 1s/2s/3s/4s grid.  A VIEW quantity:
        the knobs are always in real seconds, so zooming the axis can never
        change what the envelope does. */
    timeScale: Number.isFinite(o.timeScale) ? Math.min(ENV_MAX_S, Math.max(0.25, o.timeScale)) : 4,
    minimized: !!o.minimized,
    triggerId: o.triggerId ? String(o.triggerId) : null,
    autoHit: !!o.autoHit,
    gateMode: o.gateMode === 'gate' ? 'gate' : 'oneshot',
    t: 0, gate: false, fired: false, releasedAt: null, releaseFrom: 0, fires: 0,

    out: 0, cont: 0, primed: false,
    shadowPhase: 0, shadowCycles: 0, shadowed: false
  };
  s.mode = modeShadow(s);
  if (s.kind === 'audio') {
    s.audio = audioPatchFrom(o.audio);
    /** ARMED is a PERMISSION fact, not a patch: the user pressed a button and
        a browser granted a microphone.  It cannot survive a reload (the grant
        does not, and a page that came back armed would be a page that reopened
        a microphone nobody asked it to), so it is transient and false at birth
        and the face re-arms. audio.js reads this as capture permission while
        audioDemand() reads it only as one term of application authority. */
    s.armed = false;
    s.audioRt = {
      env: { level: 0, low: 0, mid: 0, high: 0 },
      peakHold: { level: 0, low: 0, mid: 0, high: 0 },
      hist: new Float64Array(AUDIO_ONSET.histN),
      scratch: new Float64Array(AUDIO_ONSET.histN),
      scratch2: new Float64Array(AUDIO_ONSET.histN),
      histN: 0, histI: 0, gateOpen: false, gateHold: 0,
      prevFlux: 0, prevPrevFlux: 0, prevT: 0, prevDb: -Infinity, prevAt: 0,
      havePrev: false, refractory: 0, lastDb: -Infinity, lastFlux: 0, threshold: 0,
      feedHz: AUDIO_FEED_HZ_DEFAULT, sampleRate: 0, hits: 0, frames: 0, fed: false,
      hitAgeSeconds: 0, capturedAt: 0
    };
    for (const k of AUDIO_EXPOSED) {
      const cid = id + ':' + k;
      const child = { id: cid, kind: 'audioout', key: k, parentId: id,
                      out: 0, cont: 0,
                      /* the ladder is a DEVICE control on the other two kinds
                         and there is no such knob here; 0 keeps macroReading's
                         circular branch off, so a routed audio child reads
                         `m.value` exactly as an unstepped LFO always has */
                      steps: 0 };
      /* `on` MIRRORS THE DEVICE, as a getter rather than a copy: power is one
         fact and two copies of one fact drift.  Every reader in this file asks
         `s.on` and none of them writes it on a child. */
      Object.defineProperty(child, 'on', {
        get() { return !!s.on; }, enumerable: true, configurable: true
      });
      sourceById.set(cid, child);
    }
    audioResetRuntime(s);
  }
  const initial = sourceBankSnapshot(s);
  const rawBanks = o.banks && typeof o.banks === 'object' ? o.banks : null;
  s.banks = {
    A: sourceBankFrom(rawBanks && rawBanks.A, initial, s.kind !== 'env'),
    B: sourceBankFrom(rawBanks && rawBanks.B, initial, s.kind !== 'env')
  };
  sourceBankApply(s, s.banks[s.bank]);
  sources.push(s);
  sourceById.set(id, s);
  modStat.sourceAdds++;
  if (s.kind !== 'audio') evalSource(s, 0);
  return s;
}

/* Returns the source id when it can be bound, else null. */
function bindableSource(id) {
  const s = sourceById.get(String(id));
  return !!s && s.kind !== 'audio';
}

function clampIndex(v, n, dflt) {
  const i = v | 0;
  return (Number.isFinite(v) && i >= 0 && i < n) ? i : dflt;
}
/* Clamps a clock multiplier to the ladder. */
function clampMult(v, dflt) {
  const i = v | 0;
  if (!Number.isFinite(v) || i < 0) return dflt;
  return i < LFO_MULTS.length ? i : LFO_MULTS.length - 1;
}
function envTime(v, dflt) {
  return Number.isFinite(v) ? Math.min(ENV_MAX_S, Math.max(0, v)) : dflt;
}
function envTension(v) {
  return Number.isFinite(v) ? Math.min(1, Math.max(-1, v)) : 0;
}

/* PHASE 3 — A/B IS TWO SAVED PATCHES, NOT A DECORATIVE FLAG.  These are the
   editable musical/visual parameters.  Runtime accumulators (phase, cycles,
   envelope t/gate) and the source's global power are deliberately absent: a
   comparison changes the patch without restarting or bypassing the source. */
function sourceBankSnapshot(s) {
  return {
    shapeMode: s.shapeMode, wave: s.wave, points: clonePoints(s.points),
    sync: !!s.sync, mult: s.mult, triplet: !!s.triplet, dotted: !!s.dotted,
    ratePos: s.ratePos, phaseOff: s.phaseOff, smooth: s.smooth,
    steps: s.steps | 0,
    trig: !!s.trig, mode: modeShadow(s), anchor: !!s.anchor,
    a: s.a, hold: s.hold, d: s.d, s: s.s, r: s.r,
    ta: s.ta, td: s.td, tr: s.tr, invert: !!s.invert,
    timeScale: s.timeScale, gateMode: s.gateMode,
    ...(s.kind === 'audio' ? { audio: audioPatchOf(s) } : {})
  };
}

function sourceBankFrom(raw, fallback, isLfo) {
  const p = raw && typeof raw === 'object' ? { ...fallback, ...raw } : fallback;
  const shape = newShape(p);
  const triplet = !!p.triplet;
  const gate = migrateGate(p, isLfo === true, fallback);
  return {
    shapeMode: shape.mode, wave: shape.wave, points: shape.points,
    sync: !!p.sync, mult: clampMult(p.mult, fallback.mult),
    triplet, dotted: !triplet && !!p.dotted,
    ratePos: Number.isFinite(p.ratePos) ? clamp01(p.ratePos) : fallback.ratePos,
    phaseOff: Number.isFinite(p.phaseOff) ? clampPhaseOff(p.phaseOff) : fallback.phaseOff,
    smooth: Number.isFinite(p.smooth) ? clamp01(p.smooth) : fallback.smooth,
    steps: clampSteps(p.steps),
    trig: gate.trig, mode: gate.trig ? 'trig' : (gate.invert ? 'invert' : 'off'),
    anchor: !!p.anchor,
    a: envTime(p.a, fallback.a), hold: envTime(p.hold, fallback.hold),
    d: envTime(p.d, fallback.d), s: Number.isFinite(p.s) ? clamp01(p.s) : fallback.s,
    r: envTime(p.r, fallback.r),
    ta: envTension(p.ta), td: envTension(p.td), tr: envTension(p.tr),
    invert: gate.invert,
    timeScale: Number.isFinite(p.timeScale)
      ? Math.min(ENV_MAX_S, Math.max(0.25, p.timeScale)) : fallback.timeScale,
    gateMode: p.gateMode === 'gate' ? 'gate' : 'oneshot',
    ...(fallback && fallback.audio
      ? { audio: audioPatchFrom(p.audio || fallback.audio) } : {})
  };
}

function sourceBankApply(s, q) {
  s.shapeMode = q.shapeMode; s.wave = q.wave; s.points = clonePoints(q.points);
  s.sync = q.sync; s.mult = q.mult; s.triplet = q.triplet; s.dotted = q.dotted;
  s.ratePos = q.ratePos; s.phaseOff = q.phaseOff; s.smooth = q.smooth;
  s.steps = clampSteps(q.steps);
  s.trig = !!q.trig; s.anchor = q.anchor;
  s.a = q.a; s.hold = q.hold; s.d = q.d; s.s = q.s; s.r = q.r;
  s.ta = q.ta; s.td = q.td; s.tr = q.tr; s.invert = q.invert;
  s.timeScale = q.timeScale; s.gateMode = q.gateMode;
  s.mode = modeShadow(s);                              // derived, always
  if (s.kind === 'audio' && q.audio) audioPatchApply(s, q.audio);
}

function newRoute(macroId, targetId, min, max, opts) {
  const o = opts || {};
  const id = o.id || ('r' + (++seq.route));
  const r = {
    id, macroId: String(macroId), targetId: String(targetId),
    min: Number.isFinite(min) ? clamp01(min) : 0,
    max: Number.isFinite(max) ? clamp01(max) : 1,
    /* λWAVES: forced edit 2/8 — the BIPOLAR flag.  A unipolar route's offset is always 0
       when the macro is at 0, so "the base is the CENTRE of the swing" is not expressible
       in this model; the flag is read in routeInfluence() and nowhere else. */
    bi: !!o.bi, enabled: o.enabled !== false, curve: Number.isFinite(o.curve) ? Math.max(-1, Math.min(1, o.curve)) : 0,
    dormant: false
  };
  routes.push(r);
  routeById.set(id, r);
  const list = routeByTarget.get(r.targetId);
  if (list) list.push(r); else routeByTarget.set(r.targetId, [r]);
  modStat.routeAdds++;
  return r;
}

/* ═══════════════════════════ the public model API ══════════════════════════ */

export function modReset(opts) {
  macros.length = 0; macroById.clear();
  sources.length = 0; sourceById.clear();
  routes.length = 0; routeById.clear(); routeByTarget.clear();
  seq.macro = 0; seq.source = 0; seq.route = 0;
  transport.bpm = BPM_DEFAULT; transport.beats = 0; transport.time = 0;
  transport.triggers = 0; transport.plays = 0;
  transport.sync = SYNC_DEFAULT;
  transport.wall = 0; transport.anchorAt = 0; transport.anchorBeats = 0;
  transport.anchorTime = 0; transport.pending = true; transport.reanchors = 0;
  transport.extName = null; transport.extBeats = null; transport.extWrites = 0;
  transport.hold = false; transport.holdNote = null; transport.holdL = 0;
  transport.holdP = 0; transport.holdA = 0; transport.holds = 0;
  transport.playing = false;                       // a load is stopped
  modStat.migratedFrom = 0;
  if (!(opts && opts.bare)) bootMacros();
  return true;
}

/* Creates the macros a fresh rack starts with. */
function bootMacros() {
  while (macros.length < MACRO_BOOT) newMacro(null);   // genericMacroName names it
}

export function macroList() { return macros.slice(); }
export function sourceList() { return sources.slice(); }
/* Returns a source's index, or -1. */
export function sourceIndexOf(id) {
  const s = sourceById.get(String(id));
  return s ? sources.indexOf(s) : -1;
}
export function sourceCount() { return sources.length; }
export function routeList() { return routes.slice(); }
export function macroOf(id) { return macroById.get(String(id)) || null; }
export function sourceOf(id) { return sourceById.get(String(id)) || null; }
/* Returns the routes into a target. */
export function routeOfTarget(id) {
  const l = routeByTarget.get(String(id));
  return (l && l.length) ? l[0] : null;
}
/* Returns the route with this id. */
export function routeOfId(id) { return routeById.get(String(id)) || null; }
/* Returns how many routes reach a target. */
export function targetDepth(id) {
  const list = routeByTarget.get(String(id));
  if (!list) return 0;
  let sum = 0;
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const m = macroById.get(r.macroId);
    if (!m) continue;
    if (m.sourceId) { const s = sourceById.get(m.sourceId); if (!s || !s.on) continue; }
    sum += r.max - r.min;
  }
  return sum;
}
/** EVERY route on a target, in landing order.  A COPY: callers iterate while
    removing (that is exactly what the two CLEAR affordances do). */
export function routesOfTarget(id) {
  const l = routeByTarget.get(String(id));
  return l ? l.slice() : [];
}
/** How many macros hold this control?  Allocation-free — the ring layout asks
    this once per routed control on the paint path. */
export function routeCountOfTarget(id) {
  const l = routeByTarget.get(String(id));
  return l ? l.length : 0;
}
export function routesOfMacro(id) { return routes.filter((r) => r.macroId === String(id)); }
/* Returns how many routes a macro drives. */
export function routeCountOfMacro(id) {
  const key = String(id);
  let n = 0;
  for (const r of routes) if (r.macroId === key) n++;
  return n;
}

/* Adds a macro; returns null once MACRO_MAX is reached. */
export function addMacro(name, opts) {
  if (macros.length >= MACRO_MAX) return null;
  return newMacro(name, opts);
}


/* True when the macro is a trigger. */
export function isTriggerMacro(id) {
  const m = macroById.get(String(id));
  return !!m && m.kind === 'trigger';
}

/* True when the source output is a hit rather than a level. */
export function isHitOutput(id) {
  const c = sourceById.get(String(id));
  return !!c && c.kind === 'audioout' && c.key === 'hit';
}
/** Either of the two things that may appear in a source's `triggerId`. */
function isFireSource(id) { return isTriggerMacro(id) || isHitOutput(id); }

/** Every pad on the rail, in rail order, with its SLOT and its STABLE ID.
    This is the list a future MIDI map binds against — see the essay at
    MACRO_KINDS.  Allocating is fine: nothing on the frame path calls it. */
export function triggerMacros() {
  const out = [];
  for (let i = 0; i < macros.length; i++) {
    const m = macros[i];
    if (m.kind !== 'trigger') continue;
    out.push({ id: m.id, index: i + 1, name: m.name, subs: subCountOfTrigger(m.id) });
  }
  return out;
}

/** Who is on this bus, in RUN ORDER — the order `sources` is in, which is the
    order the rack is drawn in and the order a fire visits them. */
export function subsOfTrigger(id) {
  const key = String(id);
  const out = [];
  for (const s of sources) if (s.triggerId === key) out.push(s.id);
  return out;
}
/** How many devices this pad fires.  Allocation-free — the rail asks it on
    every repaint, exactly as routeCountOfMacro is asked. */
export function subCountOfTrigger(id) {
  const key = String(id);
  let n = 0;
  for (const s of sources) if (s.triggerId === key) n++;
  return n;
}

/* Binds a source to a trigger. */
export function setSourceTrigger(id, triggerId) {
  const s = sourceById.get(String(id));
  if (!s) return null;
  if (triggerId === null || triggerId === undefined || triggerId === '') {
    s.triggerId = null;
    return s;
  }
  const key = String(triggerId);
  if (!isFireSource(key)) return null;
  if (s.triggerId !== key) modStat.triggerSubs++;
  s.triggerId = key;
  return s;
}

/* Fires a trigger macro; returns how many sources it fired. */
export function fireMacro(id) {
  if (!isTriggerMacro(id)) return 0;
  const key = String(id);
  let n = 0;
  for (const s of sources) {
    if (!s.on || s.triggerId !== key) continue;
    triggerSource(s);
    n++;
  }
  if (n) { modStat.macroFires++; syncMacros(); }
  return n;
}

/** LET GO OF ONE PAD — the finger lifting.  Only a held GATE envelope has
    anything to let go of (a oneshot released itself on the way down), which is
    `release()`'s own rule and is deliberately not restated here. */
export function releaseMacro(id) {
  if (!isTriggerMacro(id)) return 0;
  const key = String(id);
  let n = 0;
  for (const s of sources) {
    if (s.triggerId !== key || s.kind !== 'env' || !s.gate) continue;
    const from = envAt(s, s.t);
    s.gate = false;
    s.releasedAt = s.t;
    s.releaseFrom = from;
    n++;
  }
  if (n) { modStat.macroReleases++; syncMacros(); }
  return n;
}

/** Fires every pad at once; reports both counts because sources and pads differ. */
export function fireTriggers() {
  let macrosFired = 0, sourcesFired = 0;
  for (const m of macros) {
    if (m.kind !== 'trigger') continue;
    const n = fireMacro(m.id);
    if (n) { macrosFired++; sourcesFired += n; }
  }
  return { macros: macrosFired, sources: sourcesFired };
}
/** …and the key coming back up. */
export function releaseTriggers() {
  let macrosRel = 0, sourcesRel = 0;
  for (const m of macros) {
    if (m.kind !== 'trigger') continue;
    const n = releaseMacro(m.id);
    if (n) { macrosRel++; sourcesRel += n; }
  }
  return { macros: macrosRel, sources: sourcesRel };
}

/** THE LOUDEST THING THIS PAD IS FIRING RIGHT NOW, 0..1 — what the rail's dot
    lights with, so a press is visible on the pad that made it.  Allocation-free
    on purpose: the face asks it once per pad on every repaint, which is the
    same reason routeCountOfMacro exists beside routesOfMacro. */
export function triggerLevel(id) {
  const key = String(id);
  let v = 0;
  for (const s of sources) {
    if (s.triggerId !== key || !s.on) continue;
    if (s.out > v) v = s.out;
  }
  return v;
}

/** Clears a pad: every device lets go of the trigger. Returns how many. */
export function clearTrigger(id) {
  if (!isFireSource(id)) return 0;      // a hit socket clears too
  const key = String(id);
  let n = 0;
  for (const s of sources) if (s.triggerId === key) { s.triggerId = null; n++; }
  return n;
}

/* Clears references to deleted triggers; returns how many it cleared. */
export function pruneTriggerRefs() {
  let n = 0;
  for (const s of sources) {
    if (!s.triggerId) continue;
    if (isFireSource(s.triggerId)) continue;
    s.triggerId = null;
    n++;
  }
  return n;
}

/* The default hit envelope, seconds. */
export const HIT_ENV = Object.freeze({
  a: 0.004, hold: 0, d: 0.30, s: 0, r: 0.05,
  ta: 0, td: -0.5, tr: 0,
  gateMode: 'oneshot', timeScale: 0.5, invert: false
});

/** THE PAD'S OWN HIT ENVELOPE, or null.  Run order, so the answer is the one
    the rack draws first and the one a fire visits first — and so a user who
    reorders the rack can choose which of two, should two ever exist. */
export function hitEnvOf(triggerId) {
  const key = String(triggerId);
  for (const s of sources) {
    if (s.autoHit && s.kind === 'env' && s.triggerId === key) return s;
  }
  return null;
}

/* Returns the macro and source a trigger's pad uses, creating them when needed. */
export function hitMacroFor(triggerId) {
  if (!isFireSource(triggerId)) return null;
  const key = String(triggerId);
  const pad = macroById.get(key) || null;

  let s = hitEnvOf(key);
  if (s) {
    const held = macros.find((m) => m.sourceId === s.id);
    if (held) return { macroId: held.id, sourceId: s.id, madeEnv: false, madeMacro: false };
  }

  /* a FREE knob slot, or a new one at the end of the rail — and a pad is never
     a candidate (setMacro would refuse it, and a refusal is not a plan) */
  let mac = macros.find((m) => m.kind !== 'trigger' && !m.sourceId) || null;
  let madeMacro = false;
  if (!mac) { mac = addMacro(null); madeMacro = !!mac; }
  if (!mac) return null;                      // the rail is full: nothing written

  let madeEnv = false;
  if (!s) {
    s = newSource('env', { ...HIT_ENV,
                           label: pad ? 'HIT ' + (macros.indexOf(pad) + 1)
                                      : 'HIT ' + String(key).replace(':hit', ''),
                           autoHit: true });
    setSourceTrigger(s.id, key);              // the ONE writer, macros already whole
    madeEnv = true;
  }
  if (!setMacro(mac.id, { sourceId: s.id })) {
    /* unreachable by construction (the slot was free a line ago) and handled
       anyway: an envelope with no output is worse than no envelope */
    if (madeEnv) removeSource(s.id);
    if (madeMacro) removeMacro(mac.id);
    return null;
  }
  modStat.hitBuilds += madeEnv ? 1 : 0;
  return { macroId: mac.id, sourceId: s.id, madeEnv, madeMacro };
}

export function removeMacro(id) {
  const key = String(id);
  const m = macroById.get(key);
  if (!m) return false;
  for (let i = routes.length - 1; i >= 0; i--) if (routes[i].macroId === key) removeRoute(routes[i].id);
  if (m.kind === 'trigger') for (const s of sources) if (s.triggerId === key) s.triggerId = null;
  macroById.delete(key);
  const i = macros.indexOf(m);
  if (i >= 0) macros.splice(i, 1);
  renumberGenericMacros();
  modStat.macroRemoves++;
  return true;
}

/** Moves a macro by stable identity. Routes and source assignments keep the
    macro id; only its display order and generated label change. */
export function moveMacro(id, index) {
  const m = macroById.get(String(id));
  if (!m) return -1;
  const from = macros.indexOf(m);
  if (from < 0) return -1;
  let to = Math.round(Number(index));
  if (!Number.isFinite(to)) return from;
  to = Math.max(0, Math.min(macros.length - 1, to));
  if (to === from) return from;
  macros.splice(from, 1);
  macros.splice(to, 0, m);
  renumberGenericMacros();
  modStat.macroMoves++;
  return to;
}

/** Sets the macro's knob, master depth, name and source assignment; sourceId null is unassigned. */
export function setMacro(id, patch) {
  const m = macroById.get(String(id));
  if (!m || !patch) return null;
  if (m.kind === 'trigger' &&
      (patch.sourceId !== undefined || Number.isFinite(patch.value))) {
    modStat.macroRefusals++;
    return null;
  }
  if (patch.sourceId !== undefined && patch.sourceId !== null) {
    const want = String(patch.sourceId);
    if (bindableSource(want) && m.sourceId && m.sourceId !== want &&
        sourceById.has(m.sourceId)) {
      modStat.macroRefusals++;
      return null;
    }
  }
  if (typeof patch.name === 'string') { m.name = patch.name.slice(0, 24); m.named = true; }
  if (Number.isFinite(patch.value)) m.value = clamp01(patch.value);
  if (Number.isFinite(patch.masterDepth)) m.masterDepth = clamp01(patch.masterDepth);
  if (patch.sourceId !== undefined) {
    const sid = patch.sourceId === null ? null : String(patch.sourceId);
    m.sourceId = (sid && bindableSource(sid)) ? sid : null;
    if (m.sourceId) m.value = clamp01(sourceById.get(m.sourceId).out);
  }
  return m;
}

export function addSource(kind, opts) { return newSource(kind, opts); }

/* Moves a source; returns its new index, or -1 when there is no such source. */
export function moveSource(id, index) {
  const s = sourceById.get(String(id));
  if (!s) return -1;
  const from = sources.indexOf(s);
  if (from < 0) return -1;
  const n = sources.length;
  let to = Math.round(Number(index));
  if (!Number.isFinite(to)) return from;
  if (to < 0) to = 0;
  if (to > n - 1) to = n - 1;
  if (to === from) return from;
  sources.splice(from, 1);
  sources.splice(to, 0, s);
  modStat.sourceMoves++;
  return to;
}

/* Copies a source's bank. */
export function copyBank(id) {
  const s = sourceById.get(String(id));
  if (!s) return null;
  return { kind: s.kind, bank: s.bank, patch: sourceBankSnapshot(s) };
}

/* Pastes a bank onto a source. */
export function pasteBank(id, blob, side) {
  const s = sourceById.get(String(id));
  if (!s || !blob || !blob.patch) return null;
  if (blob.kind && blob.kind !== s.kind) return null;
  const want = (side === 'A' || side === 'B') ? side : (s.bank === 'A' ? 'B' : 'A');
  s.banks[want] = sourceBankFrom(blob.patch, sourceBankSnapshot(s), s.kind !== 'env');
  if (want === s.bank) {
    sourceBankApply(s, s.banks[want]);
    if (s.kind !== 'audio') evalSource(s, 0);
    syncMacros();
  }
  modStat.bankPastes++;
  return want;
}

export function removeSource(id) {
  const key = String(id);
  const s = sourceById.get(key);
  if (!s) return false;
  for (const m of macros) if (m.sourceId === key) {
    if (s.autoHit) removeRoutesOfMacro(m.id);
    m.sourceId = null;
  }
  if (s.kind === 'audio') {
    const hitId = key + ':hit';
    for (const q of sources) if (q.triggerId === hitId) q.triggerId = null;
    for (const k of AUDIO_EXPOSED) {
      const cid = key + ':' + k;
      for (const m of macros) if (m.sourceId === cid) m.sourceId = null;
      sourceById.delete(cid);
    }
  }
  sourceById.delete(key);
  const i = sources.indexOf(s);
  if (i >= 0) sources.splice(i, 1);
  modStat.sourceRemoves++;
  return true;
}

/* Applies a patch to a source. */
export function setSource(id, patch) {
  const s = sourceById.get(String(id));
  if (!s || !patch) return null;
  if (patch.on !== undefined) s.on = !!patch.on;
  if (typeof patch.label === 'string') s.label = patch.label.slice(0, 32);
  if ((patch.bank === 'A' || patch.bank === 'B') && patch.bank !== s.bank) {
    if (!s.banks) {
      const initial = sourceBankSnapshot(s);
      s.banks = { A: sourceBankFrom(null, initial, s.kind !== 'env'),
                  B: sourceBankFrom(null, initial, s.kind !== 'env') };
    }
    s.banks[s.bank] = sourceBankSnapshot(s);       // save the side being left
    s.bank = patch.bank;
    sourceBankApply(s, s.banks[s.bank]);           // restore the side selected
  }
  if (patch.wave && WAVES.indexOf(patch.wave) >= 0) { s.wave = patch.wave; s.shapeMode = 'wave'; }
  if (patch.shapeMode === 'wave' || patch.shapeMode === 'curve') s.shapeMode = patch.shapeMode;
  if (Array.isArray(patch.points)) { s.points = normalizePoints(patch.points); s.shapeMode = 'curve'; }
  if (patch.preset) {
    const res = applyPreset(s.points, patch.preset);
    s.points = res.points; s.shapeMode = 'curve';
    s.lastPreset = { name: patch.preset, flipped: res.flipped, symmetric: res.symmetric };
  }
  if (patch.sync !== undefined) s.sync = !!patch.sync;
  if (patch.mult !== undefined) s.mult = clampMult(patch.mult, s.mult);
  /* triplet and dotted are EXCLUSIVE — both at once multiplies to 1.0, which is
     straight, so a UI that let you tick both would offer a third spelling of
     the same rate.  Setting one clears the other. */
  if (patch.triplet !== undefined) { s.triplet = !!patch.triplet; if (s.triplet) s.dotted = false; }
  if (patch.dotted !== undefined) { s.dotted = !!patch.dotted; if (s.dotted) s.triplet = false; }
  if (Number.isFinite(patch.ratePos)) s.ratePos = clamp01(patch.ratePos);
  if (Number.isFinite(patch.phaseOff)) s.phaseOff = clampPhaseOff(patch.phaseOff);
  if (Number.isFinite(patch.smooth)) s.smooth = clamp01(patch.smooth);
  if (patch.steps !== undefined) s.steps = clampSteps(patch.steps);
  if (patch.mode === 'trig' || patch.mode === 'invert' || patch.mode === 'off') {
    s.trig = patch.mode === 'trig';
    s.invert = patch.mode === 'invert';
  }
  if (patch.trig !== undefined) s.trig = !!patch.trig;
  if (patch.anchor !== undefined) s.anchor = !!patch.anchor;
  if (Number.isFinite(patch.a)) s.a = envTime(patch.a, s.a);
  if (Number.isFinite(patch.hold)) s.hold = envTime(patch.hold, s.hold);
  if (Number.isFinite(patch.d)) s.d = envTime(patch.d, s.d);
  if (Number.isFinite(patch.s)) s.s = clamp01(patch.s);
  if (Number.isFinite(patch.r)) s.r = envTime(patch.r, s.r);
  if (Number.isFinite(patch.ta)) s.ta = envTension(patch.ta);
  if (Number.isFinite(patch.td)) s.td = envTension(patch.td);
  if (Number.isFinite(patch.tr)) s.tr = envTension(patch.tr);
  if (patch.invert !== undefined) s.invert = !!patch.invert;
  if (Number.isFinite(patch.timeScale)) s.timeScale = Math.min(ENV_MAX_S, Math.max(0.25, patch.timeScale));
  if (patch.gateMode === 'gate' || patch.gateMode === 'oneshot') s.gateMode = patch.gateMode;
  if (patch.minimized !== undefined) s.minimized = !!patch.minimized;
  if (patch.triggerId !== undefined) setSourceTrigger(s.id, patch.triggerId);
  if (patch.autoHit !== undefined) s.autoHit = !!patch.autoHit;
  if (patch.audio && typeof patch.audio === 'object' && s.kind === 'audio') {
    const p = patch.audio;
    /* `mode` is DERIVED (AUDIO_OUT_MODE) and a write to it is REFUSED rather
       than swallowed: v1 implements FOLLOW on the four continuous outputs and
       TRIGGER on `:hit`, and accepting "LOW in trigger mode" would report a
       success this build cannot deliver. */
    let refused = false;
    if (p.outs && typeof p.outs === 'object') {
      for (const k of AUDIO_OUTPUTS) {
        const q = p.outs[k];
        if (q && typeof q === 'object' && q.mode !== undefined &&
            q.mode !== AUDIO_OUT_MODE[k]) refused = true;
      }
    }
    if (p.source !== undefined && AUDIO_SOURCES.indexOf(p.source) < 0) refused = true;
    if (refused) modStat.audioSetRefused++;
    else audioPatchApply(s, { ...audioPatchOf(s), ...p,
                              levelMix: { ...s.audio.levelMix, ...(p.levelMix && typeof p.levelMix === 'object' ? p.levelMix : {}) },
                              outs: audioMergeOuts(s, p.outs) });
  }
  /* ARM: a permission gesture, transient, and only an audio device has one. */
  if (patch.armed !== undefined && s.kind === 'audio') s.armed = !!patch.armed;
  s.mode = modeShadow(s);                              // derived, always
  /* the named exceptions */
  if (Number.isFinite(patch.phase)) s.phase = frac(patch.phase);
  if (Number.isFinite(patch.cycles)) s.cycles = patch.cycles | 0;
  if (patch.retrigger) triggerSource(s);
  if (s.banks) s.banks[s.bank] = sourceBankSnapshot(s);
  /* an AUDIO device has no shape to re-read; its outputs move on a FEED */
  if (s.kind !== 'audio') evalSource(s, 0);
  syncMacros();
  return s;
}

/** One output map merged over the live one, so a patch may name ONE knob of
    ONE output without restating the other eleven. */
function audioMergeOuts(s, raw) {
  const cur = audioPatchOf(s).outs;
  if (!raw || typeof raw !== 'object') return cur;
  const out = {};
  for (const k of AUDIO_OUTPUTS) {
    const q = raw[k] && typeof raw[k] === 'object' ? raw[k] : null;
    out[k] = { floorDb: q && Number.isFinite(q.floorDb) ? q.floorDb : cur[k].floorDb,
               ceilingDb: q && Number.isFinite(q.ceilingDb) ? q.ceilingDb : cur[k].ceilingDb,
               attackMs: q && Number.isFinite(q.attackMs) ? q.attackMs : cur[k].attackMs,
               releaseMs: q && Number.isFinite(q.releaseMs) ? q.releaseMs : cur[k].releaseMs,
               holdMs: q && Number.isFinite(q.holdMs) ? q.holdMs : cur[k].holdMs,
               mode: cur[k].mode };
  }
  return out;
}

/** The curve editor's four doors, routed through setSource so every edit ends
    in one place (the re-evaluation, the macro sync). */
export function curveEdit(id, op, args) {
  const s = sourceById.get(String(id));
  if (!s || s.kind === 'audio') return null;
  const a = args || {};
  let pts = s.points;
  if (op === 'add') pts = addPoint(pts, a.t, a.v, a.tension).points;
  else if (op === 'remove') pts = removePoint(pts, a.index).points;
  else if (op === 'move') {
    const i = a.index | 0;
    let t = a.t;
    if (Number.isFinite(t) && i > 0 && i < pts.length - 1) {
      if (pts[i - 1] && t < pts[i - 1].t) t = pts[i - 1].t;
      if (pts[i + 1] && t > pts[i + 1].t) t = pts[i + 1].t;
    }
    pts = movePoint(pts, i, t, a.v);
  }
  else if (op === 'tension') pts = setTension(pts, a.index, a.tension);
  else if (op === 'flip') pts = curveFlip(pts);
  else return null;
  return setSource(s.id, { points: pts });
}

/* Adds a route from a macro to a target. */
export function addRoute(macroId, targetId, min, max) {
  const m = macroById.get(String(macroId));
  if (!m) return null;
  if (m.kind === 'trigger') return null;
  const key = String(targetId);
  const list = routeByTarget.get(key);
  if (list) {
    const dup = list.find((q) => q.macroId === m.id);
    if (dup) return { route: dup, replaced: null, already: true, stacked: list.length };
  }
  const r = newRoute(m.id, key, min, max);
  return { route: r, replaced: null, already: false,
           stacked: routeByTarget.get(key).length };
}

export function removeRoute(id) {
  const r = routeById.get(String(id));
  if (!r) return false;
  routeById.delete(r.id);
  const list = routeByTarget.get(r.targetId);
  if (list) {
    const j = list.indexOf(r);
    if (j >= 0) list.splice(j, 1);
    /* THE KEY GOES WHEN THE LAST ROUTE DOES.  targetValue()'s resting-state
       fast path is "no entry in this Map", so an empty array left behind would
       put an unrouted target back on the arithmetic path — the exact shape of
       bug the bit-identical law exists to catch. */
    if (!list.length) routeByTarget.delete(r.targetId);
  }
  const i = routes.indexOf(r);
  if (i >= 0) routes.splice(i, 1);
  modStat.routeRemoves++;
  return true;
}

/* Removes every route into a target. */
export function removeRoutesOfTarget(id) {
  const list = routeByTarget.get(String(id));
  if (!list || !list.length) return 0;
  let n = 0;
  for (const r of list.slice()) if (removeRoute(r.id)) n++;
  return n;
}

/* Removes every route a macro drives. */
export function removeRoutesOfMacro(id) {
  const key = String(id);
  let n = 0;
  for (const r of routes.slice()) if (r.macroId === key && removeRoute(r.id)) n++;
  return n;
}

/** The mini min-max ring on a macro'd control. */
export function setRouteRange(id, patch) {
  const r = routeById.get(String(id));
  if (!r || !patch) return null;
  if (Number.isFinite(patch.min)) r.min = clamp01(patch.min);
  if (Number.isFinite(patch.max)) r.max = clamp01(patch.max);
  /* λWAVES: forced edit 4/8 — the bipolar flag is patchable, exactly like min and max. */
  if (patch.bi !== undefined) r.bi = !!patch.bi;
  if (patch.enabled !== undefined) r.enabled = !!patch.enabled;
  if (Number.isFinite(patch.curve)) r.curve = Math.max(-1, Math.min(1, patch.curve));
  if (patch.macroId !== undefined && macroById.has(String(patch.macroId))) r.macroId = String(patch.macroId);
  return r;
}

export function setTransport(patch) {
  if (!patch) return transport;
  if (Number.isFinite(patch.bpm)) {
    const b = Math.min(BPM_MAX, Math.max(BPM_MIN, patch.bpm));
    if (b !== transport.bpm) { reanchorTransport(); transport.bpm = b; }
  }
  if (Number.isFinite(patch.beats)) { transport.beats = patch.beats; reanchorTransport(); }
  if (Number.isFinite(patch.time)) transport.time = patch.time;
  if (patch.sync !== undefined) setSyncMode(patch.sync);
  if (patch.playing !== undefined) transport.playing = !!patch.playing;
  return transport;
}


/* Re-anchors the transport to the current beat. */
export function reanchorTransport(w) {
  transport.anchorBeats = transport.beats;
  transport.anchorTime = transport.time;
  const at = (w === undefined) ? transport.wall : w;
  if (Number.isFinite(at) && at > 0) { transport.anchorAt = at; transport.pending = false; }
  else { transport.anchorAt = 0; transport.pending = true; }
  transport.reanchors++;
  return transport;
}

export function syncMode() { return transport.sync; }

/** Set the mode.  Re-anchors, so switching modes never MOVES the beat — it
    only changes which law carries it forward from here.  An unknown name is
    REFUSED and counted; the mode is left exactly as it was. */
export function setSyncMode(m) {
  const k = clampSyncMode(m);
  if (k === null) { modStat.syncRefused++; return transport.sync; }
  if (k === transport.sync) return transport.sync;
  transport.sync = k;
  modStat.syncSets++;
  reanchorTransport();
  return transport.sync;
}

/* Sets the external clock's tempo and phase. */
export function setExternalClock(o) {
  if (!o) {
    transport.extName = null; transport.extBeats = null;
    reanchorTransport();          // WALL resumes from wherever EXT left the beat
    return transport;
  }
  if (typeof o.name === 'string' && o.name) transport.extName = o.name;
  if (Number.isFinite(o.beats)) { transport.extBeats = o.beats; transport.extWrites++; }
  return transport;
}
export function externalClockActive() {
  return !!(transport.extName && Number.isFinite(transport.extBeats));
}
/** What the transport is ACTUALLY doing, which is not always what is selected. */
export function effectiveSyncMode() {
  return (transport.sync === 'ext' && !externalClockActive()) ? 'wall' : transport.sync;
}
/* Returns the transport's lag behind its clock, seconds. */
export function transportLag() {
  if (transport.pending) return 0;
  const w = (transport.wall || 0) - transport.anchorAt;
  const t = transport.time - transport.anchorTime;
  return w > 0 ? Math.max(0, w - t) : 0;
}

/* ═══════════════════════════ THE RATE ══════════════════════════════════════ */

/** How many BEATS one cycle of this LFO lasts, under BPM sync. */
export function beatsPerCycle(s) {
  const note = LFO_MULTS[s.mult] || LFO_MULTS[LFO_MULT_DEFAULT];
  const modf = s.triplet ? TRIPLET : (s.dotted ? DOTTED : 1);
  return BEATS_PER_WHOLE * note * modf;
}

/** The LFO's rate in Hz — the ONE place the two rate modes meet. */
export function lfoHz(s) {
  if (!s.sync) return freeHz(s.ratePos);
  const bpc = beatsPerCycle(s);
  return bpc > 0 ? (transport.bpm / 60) / bpc : 0;
}

/* Note lengths in beats, for the hold grid. */
export const HOLD_NOTES = Object.freeze({ '1/4': 1, '1': BEATS_PER_WHOLE, 'bar': BEATS_PER_WHOLE });

/** The grid fold: a + mod(b - p, L), with a floor-mod so any b (a transport
    that jumped behind the press included) lands inside [a, a + L). */
function foldBeat(b) {
  const L = transport.holdL;
  const x = b - transport.holdP;
  return transport.holdA + (x - Math.floor(x / L) * L);
}

/** The EFFECTIVE beat: the fold while held, the real beat otherwise. */
export function heldBeat() {
  return transport.hold ? foldBeat(transport.beats) : transport.beats;
}

/** Place one synced source at effective beat `be` — the ANCHOR construction
    read at the fold instead of at `beats`. */
function placeOnBeat(s, be) {
  const bpc = beatsPerCycle(s);
  const cyc = bpc > 0 ? be / bpc : 0;
  s.cycles = Math.floor(cyc);
  s.phase = frac(cyc);
}

/* Starts a hold on the given note length. */
export function holdStart(note) {
  const key = String(note === null || note === undefined ? '' : note);
  const L = HOLD_NOTES[key];
  if (!(L > 0)) { modStat.holdRefused++; return false; }
  if (transport.hold) holdEnd();
  const p = transport.beats;
  transport.hold = true;
  transport.holdNote = key === 'bar' ? '1' : key;
  transport.holdL = L;
  transport.holdP = p;
  transport.holdA = Math.floor(p / L) * L;
  transport.holds++;
  modStat.holdStarts++;
  /* the press IS the downbeat: b - p = 0, so b_eff = a, and the sources are
     placed there now so the face's one forced paint shows the jump */
  const be = foldBeat(p);
  for (const s of sources) {
    if (s.kind !== 'lfo') continue;
    s.shadowPhase = s.phase; s.shadowCycles = s.cycles | 0; s.shadowed = true;
    if (!s.on || !s.sync) continue;
    placeOnBeat(s, be);
    evalSource(s, 0);
  }
  syncMacros();
  return true;
}

/**
 * RELEASE.  Hard rejoin: every synced source takes its shadow back in one
 * assignment and is re-read there.  Not held is a no-op that says so.
 */
export function holdEnd() {
  if (!transport.hold) return false;
  transport.hold = false; transport.holdNote = null;
  transport.holdL = 0; transport.holdP = 0; transport.holdA = 0;
  modStat.holdEnds++;
  for (const s of sources) {
    if (s.kind !== 'lfo' || !s.shadowed) continue;
    s.shadowed = false;
    if (!s.on || !s.sync) continue;
    s.phase = s.shadowPhase; s.cycles = s.shadowCycles;
    evalSource(s, 0);
  }
  syncMacros();
  return true;
}

/** A transport event that rewinds a phase rewinds its shadow too, so the
    un-held run the shadow stands for is the one that took the event. */
function rewindShadow(s, phase, cycles) {
  if (s.shadowed) { s.shadowPhase = phase; s.shadowCycles = cycles | 0; }
}

/* Returns an envelope source's value at time t. */
export function envAt(s, t) {
  if (!s.fired) return 0;
  const rel = s.releasedAt;
  if (rel !== null && t >= rel) {
    if (!(s.r > 0)) return 0;
    const rt = t - rel;
    if (rt >= s.r) return 0;
    return s.releaseFrom * (1 - curveBend(rt / s.r, s.tr));
  }
  let u = t;
  if (u < s.a) return s.a > 0 ? curveBend(u / s.a, s.ta) : 1;
  u -= s.a;
  if (u < s.hold) return 1;
  u -= s.hold;
  if (u < s.d) return 1 + (s.s - 1) * curveBend(u / s.d, s.td);
  return s.s;
}

/* the segment shape, imported by value so mod.js has exactly one dependency */
function curveBend(x, tension) {
  const u = x < 0 ? 0 : x > 1 ? 1 : x;
  if (!(tension > 0) && !(tension < 0)) return u;
  const p = Math.pow(2, 3 * (tension < 0 ? -tension : tension));
  return tension > 0 ? Math.pow(u, p) : 1 - Math.pow(1 - u, p);
}

export function envDuration(s) { return s.a + s.hold + s.d + (s.gateMode === 'oneshot' ? s.r : 0); }

/** The envelope AS A CURVE, for MOD2's editor: the same {t,v,tension} list the
    LFO draws, over the source's own time window.  Derived, never stored — the
    knobs are the model and the drawing follows them, so the two cannot drift. */
export function envPoints(s) {
  const w = s.timeScale > 0 ? s.timeScale : 1;
  const at = (sec) => clamp01(sec / w);
  const pts = [{ t: 0, v: 0, tension: s.ta }];
  let acc = s.a;
  pts.push({ t: at(acc), v: 1, tension: 0 });
  if (s.hold > 0) { acc += s.hold; pts.push({ t: at(acc), v: 1, tension: s.td }); }
  else pts[pts.length - 1].tension = s.td;
  acc += s.d;
  pts.push({ t: at(acc), v: s.s, tension: s.tr });
  acc += s.r;
  pts.push({ t: at(acc), v: 0, tension: 0 });
  if (acc < w) pts.push({ t: 1, v: 0, tension: 0 });
  return normalizePoints(pts);
}

/* ═══════════════════════════ TRIGGERS ══════════════════════════════════════ */

/* Fires a source at the given time. */
function triggerSource(s, atSeconds) {
  if (s.kind === 'audio') return;
  const t0 = Number.isFinite(atSeconds) && atSeconds > 0 ? atSeconds : 0;
  if (s.kind === 'env') {
    s.t = t0;
    s.fired = true;
    s.fires++;
    if (s.gateMode === 'gate') { s.gate = true; s.releasedAt = null; s.releaseFrom = s.s; }
    else { s.gate = false; s.releasedAt = s.a + s.hold + s.d; s.releaseFrom = s.s; }
  } else if (s.trig) {
    s.phase = 0;
    s.cycles = 0;
    rewindShadow(s, 0, 0);             // the un-held run rewound too
  }
  s.primed = false;                    // a trigger re-seeds the smoother
  evalSource(s, 0);
  modStat.triggers++;
  transport.triggers++;
}

/* Fires a trigger by id, or every trigger when none is named. */
export function trigger(id) {
  if (id !== undefined && id !== null) {
    const s = sourceById.get(String(id));
    if (!s) return 0;
    triggerSource(s);
    syncMacros();
    return 1;
  }
  let n = 0;
  for (const s of sources) {
    if (!s.on || s.kind === 'audio') continue;      // it fires, it is not fired
    if (s.kind === 'env' || s.trig) { triggerSource(s); n++; }
  }
  syncMacros();
  return n;
}

/** Let go of a GATE envelope (a oneshot has already released itself). */
export function release(id) {
  const list = (id === undefined || id === null)
    ? sources : [sourceById.get(String(id))].filter(Boolean);
  let n = 0;
  for (const s of list) {
    if (s.kind !== 'env' || !s.gate) continue;
    /* READ THE LEVEL BEFORE MOVING THE MARKER — envAt() branches on
       `releasedAt`, so setting it first would ask the envelope what it is
       doing after a release that has not happened yet. */
    const from = envAt(s, s.t);
    s.gate = false;
    s.releasedAt = s.t;
    s.releaseFrom = from;
    n++;
  }
  syncMacros();
  return n;
}


/** THE FIVE CHILD IDS OF ONE DEVICE, resolved.  Allocation-free lookups. */
function audioChild(s, key) { return sourceById.get(s.id + ':' + key) || null; }

/** Publish one child's value.  `cont` and `out` are both written because
    macroReading reads `cont` on a circular destination — and with `steps` 0 on
    every child the two are the same double, which is exactly the resting-state
    shape an unstepped LFO has always had. */
function audioPublish(s, key, v) {
  const c = audioChild(s, key);
  if (!c) return;
  c.cont = v; c.out = v;
}

/* Advances an audio device's gate by one feed step. */
function audioGateStep(s, db, dtFeed) {
  const a = s.audio, r = s.audioRt;
  const open = a.thresholdDb, stay = a.thresholdDb - a.hysteresisDb;
  if (db >= open) { r.gateOpen = true; r.gateHold = a.holdMs / 1000; }
  else if (r.gateOpen) {
    if (db >= stay) r.gateHold = a.holdMs / 1000;
    else {
      r.gateHold -= dtFeed;
      if (r.gateHold <= 0) { r.gateOpen = false; r.gateHold = 0; }
    }
  }
  return r.gateOpen;
}

/** ONE FOLLOWER STEP. Rising takes ATTACK. Once the smoothed value reaches a
    peak, HOLD keeps it there before RELEASE begins. All three times are feed
    rate independent. */
function audioFollow(s, key, target, feedHz) {
  const r = s.audioRt, o = s.audio.outs[key];
  const prev = r.env[key];
  const dtMs = 1000 / (Number.isFinite(feedHz) && feedHz > 0 ? feedHz : AUDIO_FEED_HZ_DEFAULT);
  if (target >= prev) r.peakHold[key] = o.holdMs;
  else if (r.peakHold[key] > 0) {
    r.peakHold[key] = Math.max(0, r.peakHold[key] - dtMs);
    target = prev;
  }
  const alpha = audioAlpha(target > prev ? o.attackMs : o.releaseMs, feedHz);
  const v = alpha > 0 ? alpha * prev + (1 - alpha) * target : target;
  r.env[key] = v;
  return v;
}

/* Returns an audio device's current threshold, dB. */
function audioThreshold(s) {
  const a = s.audio, r = s.audioRt;
  const n = r.histN;
  if (n <= 0) return a.fluxFloor;
  const med = medianInto(r.scratch, r.hist, n);
  for (let i = 0; i < n; i++) r.scratch2[i] = Math.abs(r.hist[i] - med);
  const mad = medianInto(r.scratch, r.scratch2, n);
  const t = med + AUDIO_ONSET.madK * mad;
  return t > a.fluxFloor ? t : a.fluxFloor;
}

/**
 * HIT → ENV.  Every ON source whose `triggerId` is this device's `:hit` socket
 * takes the same fire a pad would give it, with the age applied ONCE.  Returns
 * how many fired, which is the number A6 asserts is exactly one per onset.
 */
function audioFireHit(s, ageSeconds) {
  const key = s.id + ':hit';
  let n = 0;
  for (const q of sources) {
    if (!q.on || q.triggerId !== key) continue;
    triggerSource(q, ageSeconds);
    n++;
  }
  if (n) modStat.audioTriggers += n;
  return n;
}

/* Feeds an audio device; returns a readout, or null when there is no such device. */
export function modFeedAudio(deviceId, feed) {
  const s = sourceById.get(String(deviceId));
  if (!s || s.kind !== 'audio') return null;
  const r = s.audioRt, a = s.audio;
  const refuse = (why) => {
    modStat.audioRefused++;
    return { id: s.id, accepted: false, reason: why, hit: 0, hits: r.hits,
             hitAgeSeconds: 0, gateOpen: r.gateOpen, frames: r.frames };
  };
  /* Analysis is source-owned and remains truthful while the modulation device
     is bypassed. `targetValue()` already excludes an off source, so processing
     a feed here cannot apply it to a destination. */
  if (!feed || typeof feed !== 'object') return refuse('feed');
  const feedHz = feed.feedHz;
  if (!(Number.isFinite(feedHz) && feedHz > 0)) return refuse('feedHz');
  if (!Number.isFinite(feed.capturedAt)) return refuse('capturedAt');
  const bp = feed.bandPower;
  if (!Array.isArray(bp) || bp.length < 3) return refuse('bandPower');
  const rms = Number.isFinite(feed.rms) ? Math.max(0, feed.rms) : 0;
  const flux = Number.isFinite(feed.flux) ? Math.max(0, feed.flux) : 0;
  const dtFeed = 1 / feedHz;

  /* ── 1 · CALIBRATE.  The four small face dials shape LEVEL only: one master
     and three spectral contributions. At unity this is bit-for-bit the raw RMS. */
  const powers = [0, 1, 2].map((i) => Math.max(0, Number(bp[i]) || 0));
  const mix = a.levelMix;
  let levelRms = rms;
  if (mix.level !== 1 || mix.low !== 1 || mix.mid !== 1 || mix.high !== 1) {
    const total = powers[0] + powers[1] + powers[2];
    if (total > 0) levelRms *= Math.sqrt((powers[0] * mix.low ** 2 + powers[1] * mix.mid ** 2 + powers[2] * mix.high ** 2) / total);
    levelRms *= mix.level;
  }
  const db = audioDbAmp(levelRms) + a.gainDb;
  const level = audioRangeNorm(audioDbAmp(levelRms), a.gainDb, a.outs.level);

  /* ── 2 · GATE.  One decision for the whole device, from the LEVEL. ── */
  const open = a.gateEnabled ? audioGateStep(s, db, dtFeed) : true;
  if (!a.gateEnabled) { r.gateOpen = true; r.gateHold = 0; }

  /* ── 3 · FOLLOW.  Four outputs, each its own pair of time constants. ── */
  const bandNorm = [
    audioRangeNorm(audioDbPow(powers[0]), a.gainDb, a.outs.low),
    audioRangeNorm(audioDbPow(powers[1]), a.gainDb, a.outs.mid),
    audioRangeNorm(audioDbPow(powers[2]), a.gainDb, a.outs.high)
  ];
  r.inputDb = { level: db, low: audioDbPow(powers[0]) + a.gainDb,
    mid: audioDbPow(powers[1]) + a.gainDb, high: audioDbPow(powers[2]) + a.gainDb };
  let vLevel = 0, vLow = 0, vMid = 0, vHigh = 0;
  if (open) {
    vLevel = audioFollow(s, 'level', level, feedHz);
    vLow   = audioFollow(s, 'low',   bandNorm[0], feedHz);
    vMid   = audioFollow(s, 'mid',   bandNorm[1], feedHz);
    vHigh  = audioFollow(s, 'high',  bandNorm[2], feedHz);
  } else {
    /* EXACT ZERO, and the follower states with it — see audioGateStep. */
    for (const k of AUDIO_FOLLOWED) { r.env[k] = 0; r.peakHold[k] = 0; }
  }
  audioPublish(s, 'level', vLevel);
  audioPublish(s, 'low',   vLow);
  audioPublish(s, 'mid',   vMid);
  audioPublish(s, 'high',  vHigh);

  /* ── 4 · ONSET.  The decision is about the PREVIOUS frame, because a local
     maximum is not knowable until its successor is.  That one frame is the
     price of not firing on the rising edge of every swell, and it is IN the
     reported age rather than quietly dropped. ── */
  const t = audioThreshold(s);                        // threshold for THIS frame
  let hit = 0, age = 0;
  if (r.refractory > 0) r.refractory -= dtFeed;
  if (r.havePrev) {
    const peak = r.prevFlux;
    const isMax = peak > r.prevPrevFlux && peak >= flux;
    if (isMax && peak >= r.prevT && r.prevDb > AUDIO_ONSET.floorDb &&
        r.refractory <= 0) {
      const now = Number.isFinite(feed.now) ? feed.now : feed.capturedAt;
      age = now - r.prevAt;
      if (!(age > 0)) age = 0;
      hit = 1;
      r.hits++;
      r.refractory = AUDIO_ONSET.refractoryMs / 1000;
      modStat.audioHits++;
      audioFireHit(s, age);
    }
  }
  audioPublish(s, 'hit', hit ? 1 : 0);

  /* ── 5 · REMEMBER.  The ring, then the one-frame window. ── */
  r.hist[r.histI] = flux;
  r.histI = (r.histI + 1) % AUDIO_ONSET.histN;
  if (r.histN < AUDIO_ONSET.histN) r.histN++;
  r.prevPrevFlux = r.prevFlux;
  r.prevFlux = flux; r.prevT = t; r.prevDb = db; r.prevAt = feed.capturedAt;
  r.havePrev = true;
  r.lastDb = db; r.lastFlux = flux; r.threshold = t;
  r.feedHz = feedHz;
  r.sampleRate = Number.isFinite(feed.sampleRate) && feed.sampleRate > 0 ? feed.sampleRate : 0;
  r.capturedAt = feed.capturedAt;
  r.hitAgeSeconds = age;
  r.frames++; r.fed = true;
  modStat.audioFeeds++;
  syncMacros();
  return { id: s.id, accepted: true, feedHz, dbfs: db, flux, threshold: t,
           gateOpen: open, level: vLevel, low: vLow, mid: vMid, high: vHigh,
           hit, hitAgeSeconds: age, hits: r.hits, frames: r.frames };
}

/** Put one AUDIO device back to silence: followers 0, gate shut, history empty,
    outputs exact 0.  A transport rewind and modReset both mean this. */
export function audioReset(deviceId) {
  const s = sourceById.get(String(deviceId));
  if (!s || s.kind !== 'audio') return false;
  audioResetRuntime(s);
  syncMacros();
  return true;
}

/** ARM — the permission gesture, from the face.  Transient; see the field. */
export function audioArm(deviceId, on) {
  const s = sourceById.get(String(deviceId));
  if (!s || s.kind !== 'audio') return null;
  s.armed = !!on;
  return s;
}

/* Returns what currently consumes an audio device. */
export function audioConsumers(deviceId) {
  const s = sourceById.get(String(deviceId));
  if (!s || s.kind !== 'audio') return null;
  const ids = AUDIO_EXPOSED.map((k) => s.id + ':' + k);
  const macroIds = [], routeIds = [], envIds = [];
  for (const m of macros) {
    if (!m.sourceId || ids.indexOf(m.sourceId) < 0) continue;
    macroIds.push(m.id);
    for (const r of routes) if (r.macroId === m.id && !r.dormant) routeIds.push(r.id);
  }
  const hitId = s.id + ':hit';
  for (const q of sources) if (q.on && q.triggerId === hitId) envIds.push(q.id);
  return { macros: macroIds, routes: routeIds, envs: envIds,
           any: routeIds.length > 0 || envIds.length > 0 };
}

/* Returns whether an already-analysed AUDIO signal may currently be applied.
   Capture lifetime is deliberately absent: audio.js owns that independent
   authority. */
export function audioDemand(deviceId) {
  const s = sourceById.get(String(deviceId));
  if (!s || s.kind !== 'audio') return false;
  if (!s.armed || !s.on || !transport.playing) return false;
  const c = audioConsumers(deviceId);
  return !!(c && c.any);
}

export function audioApplicationDemand(deviceId) { return audioDemand(deviceId); }

/** EVERY BINDABLE SOURCE ID, in rack order — LFOs and ENVs by their own id,
    an AUDIO device by its five SOCKETS.  `:beat` is absent, and that absence is
    the v1 promise (Sol Q3h: onset-interval BPM is not beat).  The face's `--`
    selector walks exactly this list. */
export function sourceIds() {
  const out = [];
  for (const s of sources) {
    if (s.kind === 'audio') { for (const k of AUDIO_EXPOSED) out.push(s.id + ':' + k); }
    else out.push(s.id);
  }
  return out;
}

/** THE CHILD-ID RESOLVER, both ways.  `scalarOutputId(dev, key)` is the id a
    macro binds (null for `:beat` and for anything that is not an audio device
    — Sol Q6 names this function as a node-gated contract the face waits on). */
export function scalarOutputId(deviceId, outputKey) {
  const s = sourceById.get(String(deviceId));
  if (!s || s.kind !== 'audio') return null;
  const k = String(outputKey);
  return AUDIO_EXPOSED.indexOf(k) >= 0 ? s.id + ':' + k : null;
}
/** …and back: `a1:low` -> { deviceId, key, out, on }, or null. */
export function audioOutputOf(id) {
  const c = sourceById.get(String(id));
  if (!c || c.kind !== 'audioout') return null;
  return { id: c.id, deviceId: c.parentId, key: c.key, out: c.out, on: c.on };
}

/** THE DEVICE'S READOUT — what the face prints, and what a dump explains a
    still picture with.  `snapMs` is the honesty clause: at this feed rate, any
    attack under one frame is a snap and the face must not call it timing. */
export function audioReadout(deviceId) {
  const s = sourceById.get(String(deviceId));
  if (!s || s.kind !== 'audio') return null;
  const r = s.audioRt, a = s.audio;
  const hz = r.feedHz > 0 ? r.feedHz : AUDIO_FEED_HZ_DEFAULT;
  const outs = {};
  for (const k of AUDIO_OUTPUTS) {
    const o = a.outs[k];
    outs[k] = { floorDb: o.floorDb, ceilingDb: o.ceilingDb, inputDb: r.inputDb ? r.inputDb[k] : -Infinity,
                attackMs: o.attackMs, releaseMs: o.releaseMs, holdMs: o.holdMs, mode: o.mode,
                alphaA: audioAlpha(o.attackMs, hz), alphaR: audioAlpha(o.releaseMs, hz),
                rise90Ms: audioRiseMs(o.attackMs, 0.9),
                fall90Ms: audioRiseMs(o.releaseMs, 0.9),
                snap: o.attackMs > 0 && o.attackMs < 1000 / hz,
                exposed: AUDIO_EXPOSED.indexOf(k) >= 0,
                out: AUDIO_EXPOSED.indexOf(k) >= 0
                  ? (audioChild(s, k) ? audioChild(s, k).out : 0) : 0 };
  }
  return {
    id: s.id, on: !!s.on, armed: !!s.armed, source: a.source,
    fed: r.fed, frames: r.frames, feedHz: hz, sampleRate: r.sampleRate,
    feedMs: 1000 / hz, capturedAt: r.capturedAt,
    gainDb: a.gainDb, dbfs: r.lastDb, levelMix: { ...a.levelMix }, gateOpen: r.gateOpen,
    gateEnabled: a.gateEnabled, thresholdDb: a.thresholdDb, hysteresisDb: a.hysteresisDb, holdMs: a.holdMs,
    flux: r.lastFlux, fluxThreshold: r.threshold, fluxFloor: a.fluxFloor,
    hits: r.hits, hitAgeSeconds: r.hitAgeSeconds,
    refractoryMs: AUDIO_ONSET.refractoryMs, onsetFloorDb: AUDIO_ONSET.floorDb,
    demand: audioDemand(s.id), applicationDemand: audioDemand(s.id),
    transportPlaying: !!transport.playing, consumers: audioConsumers(s.id), outs
  };
}

/* ═══════════════════════════ EVALUATION ════════════════════════════════════ */

function readShape(s) {
  if (s.shapeMode === 'curve') return clamp01(curveEval(s.points, frac(s.phase + s.phaseOff)));
  const sum = s.phase + s.phaseOff;
  return waveAt(s.wave, sum, { cycles: (s.cycles | 0) + Math.floor(sum), seed: s.rseed });
}

/** tau in seconds for the SMOOTH knob.  EXACTLY zero at zero — bypass. */
export function smoothTau(smooth) {
  return smooth > 0 ? SMOOTH_TAU_MAX * smooth * smooth : 0;
}

/* Evaluates one source for this step. */
function evalSource(s, dt) {
  let raw;
  raw = (s.kind === 'env') ? envAt(s, s.t) : readShape(s);
  if (s.invert) raw = 1 - raw;
  const tau = (s.kind === 'lfo') ? smoothTau(s.smooth) : 0;
  if (!s.primed || !(tau > 0)) {
    s.cont = raw;
    s.primed = true;
  } else if (dt > 0) {
    s.cont = s.cont + (raw - s.cont) * (1 - Math.exp(-dt / tau));
  }
  /* dt === 0 is an EDIT, not time (audit MOD-RACK F2): keep the filter state
     and only republish `out` below — mid-glide, touching ANY control on this
     device (the SMOOTH knob itself included) must not snap to the raw value.
     A trigger/reset still re-seeds: those clear `primed` first. */
  s.out = (s.steps >= STEPS_MIN) ? stepQuant(s.cont, s.steps) : s.cont;
  return s.out;
}

/* Advances the whole rack by dt. */
export function advance(dt, wallNow) {
  const d = Number.isFinite(dt) && dt > 0 ? dt : 0;
  transport.time += d;
  const w = Number.isFinite(wallNow) ? wallNow : null;
  let bar = false;
  if (w === null) {
    transport.beats += (transport.bpm / 60) * d;
  } else {
    if (transport.pending) {
      transport.anchorAt = w; transport.anchorBeats = transport.beats;
      transport.anchorTime = transport.time; transport.pending = false;
      transport.reanchors++;
    }
    transport.wall = w;
    if (transport.sync === 'free') {
      transport.beats += (transport.bpm / 60) * d;
    } else if (transport.sync === 'ext' && externalClockActive()) {
      transport.beats = transport.extBeats;      // the tick stream owns the beat
      bar = true;
    } else {
      /* WALL, and EXT with no source.  Math.max guards a stamp that arrives
         behind the anchor; performance.now() is monotonic, so it never has. */
      transport.beats = transport.anchorBeats +
                        (transport.bpm / 60) * Math.max(0, w - transport.anchorAt);
      bar = true;
    }
  }
  const held = transport.hold;
  const be = held ? foldBeat(transport.beats) : transport.beats;
  for (const s of sources) {
    if (!s.on) continue;
    if (s.kind === 'audio') continue;
    if (s.kind === 'env') {
      if (s.fired) s.t += d;
    } else if ((bar || s.anchor || held) && s.sync) {
      const bpc = beatsPerCycle(s);
      if (held) {
        /* THE SHADOW keeps the un-held run: on the bar it is what the bar
           says; off it, the private accumulator, integrated exactly as the
           `else` below would have.  A source that became synced mid-hold has
           no shadow yet — it takes its own phase as one now. */
        if (!s.shadowed) { s.shadowPhase = s.phase; s.shadowCycles = s.cycles | 0; s.shadowed = true; }
        if (bar || s.anchor) {
          const c0 = bpc > 0 ? transport.beats / bpc : 0;
          s.shadowCycles = Math.floor(c0);
          s.shadowPhase = frac(c0);
        } else {
          const sum = s.shadowPhase + lfoHz(s) * d;
          s.shadowCycles = (s.shadowCycles | 0) + Math.floor(sum);
          s.shadowPhase = frac(sum);
        }
      }
      const cyc = bpc > 0 ? be / bpc : 0;
      s.cycles = Math.floor(cyc);
      s.phase = frac(cyc);
    } else {
      const sum = s.phase + lfoHz(s) * d;
      s.cycles = (s.cycles | 0) + Math.floor(sum);
      s.phase = frac(sum);
    }
    evalSource(s, d);
  }
  syncMacros();
  return true;
}

/** Every macro that has a source takes its value; a macro without one is a
    knob and is left exactly where the hand put it. */
function syncMacros() {
  for (const m of macros) {
    if (!m.sourceId) continue;
    const s = sourceById.get(m.sourceId);
    if (s) m.value = clamp01(s.out);
  }
}

/* Returns a macro's reading through its quantiser. */
function macroReading(m, s, wrap) {
  if (!wrap || !s || !s.on || !(s.steps >= STEPS_MIN)) return m.value;
  return clamp01(stepQuant(s.cont, s.steps, true));
}

/* The sole semantic scaling point.  The explicit 1 branch retains the exact
   pre-MOD-UI-003 subtraction and result when Master Depth is at its default. */
function routeReading(m, s, wrap, r) {
  const u = macroReading(m, s, wrap);
  return !r.curve ? u : Math.pow(clamp01(u), Math.pow(4, r.curve));
}
function routeInfluence(m, r, lerped) {
  /* λWAVES: forced edit 3/8 — the ANCHOR.  A unipolar route measures its influence from
     r.min, so the offset is 0 when the macro is at 0; a BIPOLAR route measures it from the
     MIDPOINT, so the base is the CENTRE of the swing and a macro at 0.5 moves nothing. */
  const influence = lerped - (r.bi ? (r.min + r.max) / 2 : r.min);
  return m.masterDepth === 1 ? influence : influence * m.masterDepth;
}

/* Returns a target's modulated slider position. */
export function targetPos(id, base, wrap) {
  const list = routeByTarget.get(String(id));
  if (!list || !list.length) return null;
  let sum = 0, live = false, n = 0;
  const parts = [];
  let first = null, firstLerp = 0;
  for (const r of list) {
    const m = macroById.get(r.macroId);
    if (!m) continue;
    const src = m.sourceId ? sourceById.get(m.sourceId) : null;
    const lerped = r.min + (r.max - r.min) * routeReading(m, src, wrap, r);
    const influence = routeInfluence(m, r, lerped);
    const on = r.enabled !== false && !(src && !src.on);
    if (first === null) {
      first = r;
      firstLerp = m.masterDepth === 1 ? lerped : r.min + influence;
    }
    if (on) { sum += influence; n++; if (src) live = true; }
    parts.push({ route: r, macro: m, source: src, on,
                 offset: on ? influence : 0, lerped,
                 routeOffset: lerped - r.min, masterDepth: m.masterDepth });
  }
  if (!n) return null;                        // every route bypassed: the knob
  /* Compatibility: a caller that omits base keeps the old absolute reading of the primary route; the engine always supplies its registered base. */
  const pos = Number.isFinite(base)
    ? (wrap ? frac(base + sum) : clamp01(base + sum)) : firstLerp;
  return { pos, offset: sum, live, count: n, parts,
           route: first, macro: first ? macroById.get(first.macroId) : null,
           source: first && macroById.get(first.macroId) && macroById.get(first.macroId).sourceId
             ? sourceById.get(macroById.get(first.macroId).sourceId) : null };
}

/* Returns a target's modulated value. */
export function targetValue(id, base, wrap) {
  const list = routeByTarget.get(String(id));
  if (!list) return NaN;
  /* THE PER-FRAME SUM.  No allocation, no closure, no Array method — this runs
     once per routed target per frame.  `n` counts CONTRIBUTING routes so that
     "every route on this target is bypassed" is NaN (the target keeps its knob,
     untouched) rather than "base + 0" (the same number by a different path,
     which is exactly the kind of drift the bit-identical law forbids). */
  let sum = 0, n = 0, firstLerp = 0;
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const m = macroById.get(r.macroId);
    if (!m) continue;
    const s = m.sourceId ? sourceById.get(m.sourceId) : null;
    const lerped = r.min + (r.max - r.min) * routeReading(m, s, wrap, r);
    const influence = routeInfluence(m, r, lerped);
    if (n === 0 && i === 0) {
      firstLerp = m.masterDepth === 1 ? lerped : r.min + influence;
    }
    if (r.enabled === false || (m.sourceId && (!s || !s.on))) continue;  // bypass: THIS route contributes 0
    sum += influence;
    n++;
  }
  if (!n) return NaN;
  if (!Number.isFinite(base)) return firstLerp;
  /* audit MOD-RACK F1: a circular target (PHASE, HUE) wraps — its setters take
     frac() of this anyway, so the clamp was a stall (pinned for `base` of every
     cycle) followed by a jump of exactly `base` at the seam. */
  return wrap ? frac(base + sum) : clamp01(base + sum);
}

/** Is a SOURCE driving this target right now (as opposed to a hand macro)?
    The synth rule needs the distinction: a paused LFO lets go of its control
    and a macro knob does not.  Under stacking: TRUE if ANY route on the target
    is source-driven — one running LFO in the stack means the control moves. */
export function targetDriven(id) {
  const list = routeByTarget.get(String(id));
  if (!list) return false;
  for (let i = 0; i < list.length; i++) {
    const m = macroById.get(list[i].macroId);
    if (!m || !m.sourceId) continue;
    const s = sourceById.get(m.sourceId);
    if (s && s.on) return true;
  }
  return false;
}

/** Is there anything that needs a CLOCK?  A hand-driven macro does not — it
    moves when a finger moves it — so this is what gates `running`. */
export function needsClock() {
  for (const r of routes) {
    if (r.dormant) continue;
    const m = macroById.get(r.macroId);
    if (!m || !m.sourceId) continue;
    const s = sourceById.get(m.sourceId);
    if (s && s.on) return true;
  }
  return false;
}

/** Is any target being moved at all (clock or hand)? */
export function anyLiveRoute() {
  for (const r of routes) {
    if (r.dormant) continue;
    const m = macroById.get(r.macroId);
    if (!m) continue;
    if (!m.sourceId) return true;
    const s = sourceById.get(m.sourceId);
    if (s && s.on) return true;
  }
  return false;
}

/* ═══════════════════ the deterministic-clock surface ═══════════════════════ */

/** Everything a rewind must save: the phases, the cycle counters, the envelope
    clocks and the smoother state.  (The transport rides along — a bounce
    starts at bar 1.) */
/* Returns a snapshot of an audio device's runtime state. */
function audioRtSnapshot(s) {
  const r = s.audioRt;
  const outs = {};
  for (const k of AUDIO_EXPOSED) { const c = audioChild(s, k); outs[k] = c ? c.out : 0; }
  return { env: { ...r.env }, peakHold: { ...r.peakHold }, hist: r.hist.slice(), histN: r.histN, histI: r.histI,
           gateOpen: r.gateOpen, gateHold: r.gateHold,
           prevFlux: r.prevFlux, prevPrevFlux: r.prevPrevFlux, prevT: r.prevT,
           prevDb: r.prevDb, prevAt: r.prevAt, havePrev: r.havePrev,
           refractory: r.refractory, lastDb: r.lastDb, lastFlux: r.lastFlux,
           threshold: r.threshold, feedHz: r.feedHz, sampleRate: r.sampleRate,
           hits: r.hits, frames: r.frames, fed: r.fed,
           hitAgeSeconds: r.hitAgeSeconds, capturedAt: r.capturedAt, outs };
}
function audioRtRestore(s, v) {
  const r = s.audioRt;
  for (const k of AUDIO_FOLLOWED) r.env[k] = Number.isFinite(v.env[k]) ? v.env[k] : 0;
  for (const k of AUDIO_FOLLOWED) r.peakHold[k] = Number.isFinite(v.peakHold && v.peakHold[k]) ? v.peakHold[k] : 0;
  r.hist.set(v.hist); r.histN = v.histN; r.histI = v.histI;
  r.gateOpen = v.gateOpen; r.gateHold = v.gateHold;
  r.prevFlux = v.prevFlux; r.prevPrevFlux = v.prevPrevFlux; r.prevT = v.prevT;
  r.prevDb = v.prevDb; r.prevAt = v.prevAt; r.havePrev = v.havePrev;
  r.refractory = v.refractory; r.lastDb = v.lastDb; r.lastFlux = v.lastFlux;
  r.threshold = v.threshold; r.feedHz = v.feedHz; r.sampleRate = v.sampleRate;
  r.hits = v.hits; r.frames = v.frames; r.fed = v.fed;
  r.hitAgeSeconds = v.hitAgeSeconds; r.capturedAt = v.capturedAt;
  for (const k of AUDIO_EXPOSED) audioPublish(s, k, v.outs[k]);
}

export function snapshotPhases() {
  const map = new Map();
  for (const s of sources) {
    map.set(s.id, { phase: s.phase, cycles: s.cycles | 0, t: s.t, gate: s.gate,
                    fired: s.fired, releasedAt: s.releasedAt, releaseFrom: s.releaseFrom,
                    out: s.out, cont: s.cont, primed: s.primed,
                    audio: s.kind === 'audio' ? audioRtSnapshot(s) : undefined });
  }
  return { sources: map, beats: transport.beats, time: transport.time };
}

export function restorePhases(snap) {
  if (!snap) return false;
  if (transport.hold) holdEnd();
  for (const [id, v] of snap.sources) {
    const s = sourceById.get(id);
    if (!s) continue;
    s.phase = v.phase; s.cycles = v.cycles; s.t = v.t; s.gate = v.gate;
    s.fired = v.fired; s.releasedAt = v.releasedAt; s.releaseFrom = v.releaseFrom;
    s.out = v.out; s.cont = Number.isFinite(v.cont) ? v.cont : v.out;
    s.primed = v.primed;
    if (s.kind === 'audio' && v.audio) audioRtRestore(s, v.audio);
  }
  transport.beats = snap.beats;
  transport.time = snap.time;
  reanchorTransport(null);
  syncMacros();
  return true;
}

/** Rewind everything to zero — the harness's repeatable start and the video
    clock's "a bounce starts at bar 1". */
export function resetPhases() {
  if (transport.hold) holdEnd();       // bar 1 is not a roll
  for (const s of sources) {
    s.phase = 0; s.cycles = 0; s.t = 0; s.primed = false;
    if (s.kind === 'env') { s.fired = false; s.gate = false; s.releasedAt = null; s.releaseFrom = 0; }
    if (s.kind === 'audio') { audioResetRuntime(s); continue; }
    evalSource(s, 0);
  }
  transport.beats = 0;
  transport.time = 0;
  reanchorTransport();          // bar 1 is the new wall origin
  syncMacros();
  return true;
}

/* Marks a transport play edge; returns how many sources it touched. */
export function modPlayEdge() {
  transport.plays++;
  reanchorTransport(null);
  let n = 0;
  for (const s of sources) {
    if (!s.on) continue;
    if (s.kind === 'audio') continue;
    if (s.kind === 'env' || s.trig) { triggerSource(s); n++; }
    else if (s.anchor && s.sync) { /* the bar wins — advance() places it */ }
    else { s.phase = 0; s.cycles = 0; rewindShadow(s, 0, 0); s.primed = false; evalSource(s, 0); n++; }
  }
  syncMacros();
  return n;
}

/* ═══════════════════════════ SERIALIZATION ═════════════════════════════════ */

/** Only what a session must remember — never the evaluation state (phase,
    cycles, envelope clocks, smoother), because a reload starts at bar 1 and
    always has (2a's law: `phase: 0` on load). */
export function serialize() {
  return {
    seq: { ...seq },
    transport: { bpm: transport.bpm,
                 sync: transport.sync === SYNC_DEFAULT ? undefined : transport.sync },
    macros: macros.map((m) => ({ id: m.id, name: m.name, named: m.named ? 1 : 0,
                                 value: m.value, masterDepth: m.masterDepth,
                                 sourceId: m.sourceId,
                                 kind: m.kind === 'trigger' ? 'trigger' : undefined })),
    sources: sources.map((s) => {
      const o = {
      id: s.id, kind: s.kind, bank: s.bank, on: s.on ? 1 : 0, label: s.label,
      shapeMode: s.shapeMode, wave: s.wave,
      points: s.shapeMode === 'curve' ? clonePoints(s.points) : undefined,
      sync: s.sync ? 1 : 0, mult: s.mult, triplet: s.triplet ? 1 : 0, dotted: s.dotted ? 1 : 0,
      ratePos: s.ratePos, phaseOff: s.phaseOff, smooth: s.smooth,
      steps: s.steps | 0,
      trig: s.trig ? 1 : 0, mode: modeShadow(s), anchor: s.anchor ? 1 : 0, rseed: s.rseed,
      a: s.a, hold: s.hold, d: s.d, s: s.s, r: s.r,
      ta: s.ta, td: s.td, tr: s.tr, invert: s.invert ? 1 : 0,
      timeScale: s.timeScale, gateMode: s.gateMode,
      minimized: s.minimized ? 1 : 0,
      triggerId: s.triggerId || undefined,
      autoHit: s.autoHit ? 1 : undefined,
      banks: { A: sourceBankFrom(s.banks.A, sourceBankSnapshot(s), s.kind !== 'env'),
               B: sourceBankFrom(s.banks.B, sourceBankSnapshot(s), s.kind !== 'env') }
      };
      if (s.kind === 'audio') o.audio = audioPatchOf(s);
      return o;
    }),
    /* λWAVES: forced edit 5/8 — `bi` travels with the route.  undefined is dropped by
       JSON.stringify, so a rack with no bipolar route serialises exactly as it always did. */
    routes: routes.map((r) => ({ id: r.id, macroId: r.macroId, targetId: r.targetId,
                                 min: r.min, max: r.max, bi: r.bi ? 1 : undefined, enabled: r.enabled === false ? false : undefined, curve: r.curve || undefined }))
  };
}

/* Restores the whole model from a serialised object. */
export function deserialize(o) {
  modReset({ bare: true });
  if (!o || typeof o !== 'object') { bootMacros(); return false; }
  if (o.transport && Number.isFinite(o.transport.bpm)) setTransport({ bpm: o.transport.bpm });
  if (o.transport && o.transport.sync !== undefined) setSyncMode(o.transport.sync);
  if (Array.isArray(o.sources)) {
    for (const s of o.sources) {
      if (!s || !s.id || sourceById.has(String(s.id))) continue;
      newSource(s.kind, { ...s, id: String(s.id), on: !!s.on, sync: !!s.sync,
                          triplet: !!s.triplet, dotted: !!s.dotted, anchor: !!s.anchor,
                          minimized: !!s.minimized,
                          triggerId: s.triggerId,
                          autoHit: !!s.autoHit,
                          trig: s.trig === undefined ? undefined : !!s.trig,
                          invert: s.invert === undefined ? undefined : !!s.invert,
                          audio: s.audio,
                          shapeMode: s.shapeMode, points: s.points });
    }
  }
  if (Array.isArray(o.macros)) {
    for (const m of o.macros) {
      if (!m || !m.id || macroById.has(String(m.id))) continue;
      newMacro(String(m.name || ''), { id: String(m.id), named: !!m.named,
                                       kind: m.kind,
                                       value: m.value, masterDepth: m.masterDepth,
                                       sourceId: m.sourceId });
    }
  }
  if (Array.isArray(o.routes)) {
    for (const r of o.routes) {
      if (!r || !r.id || !r.macroId || !r.targetId) continue;
      if (!macroById.has(String(r.macroId))) continue;
      const have = routeByTarget.get(String(r.targetId));
      if (have && have.some((q) => q.macroId === String(r.macroId))) continue;
      /* λWAVES: forced edit 6/8 — …and comes back.  A flag that does not survive a preset
         silently changes the sound of every patch that was ever saved with it. */
      newRoute(r.macroId, r.targetId, r.min, r.max, { id: String(r.id), bi: !!r.bi, enabled: r.enabled, curve: r.curve });
    }
  }
  /* the counters come last and are floored by what actually loaded, so a
     hand-edited payload can never hand out an id that already exists */
  const bump = (list, key, want) => {
    let hi = Number.isFinite(want) ? want | 0 : 0;
    for (const x of list) {
      const n = parseInt(String(x.id).slice(1), 10);
      if (Number.isFinite(n) && n > hi) hi = n;
    }
    seq[key] = hi;
  };
  bump(macros, 'macro', o.seq && o.seq.macro);
  bump(sources, 'source', o.seq && o.seq.source);
  bump(routes, 'route', o.seq && o.seq.route);
  bootMacros();                             // a payload short of two still has two
  pruneTriggerRefs();
  syncMacros();
  return true;
}


/** THE FREE-RUN DIAL, INVERTED — anim.js's `rateCurve.pos()` by another name,
    and here for the same reason `freeHz` is: a factory preset is model DATA and
    has to be able to say "0.05 Hz" without importing the UI's copy of the
    curve.  Same k, same home, same p0, so the two cannot disagree. */
export function freePos(hz) {
  return clamp01(RATE_P0 + Math.log(Math.max(hz, 1e-30) / RATE_HOME) / RATE_K);
}

/* Serialises the rack without the transport. */
export function serializeRack() {
  const o = serialize();
  delete o.transport;
  return o;
}

/* Restores the rack without touching the transport; the caller must run
   syncDormant() immediately after a rack load. */
export function deserializeRack(o) {
  const bpm = transport.bpm, beats = transport.beats, time = transport.time;
  const triggers = transport.triggers, plays = transport.plays;
  const sync = transport.sync, wall = transport.wall, anchorAt = transport.anchorAt;
  const anchorBeats = transport.anchorBeats, anchorTime = transport.anchorTime;
  const pending = transport.pending;
  const extName = transport.extName, extBeats = transport.extBeats;
  const ok = deserialize((o && typeof o === 'object') ? { ...o, transport: null } : o);
  transport.bpm = bpm; transport.beats = beats; transport.time = time;
  transport.triggers = triggers; transport.plays = plays;
  transport.sync = sync; transport.wall = wall; transport.anchorAt = anchorAt;
  transport.anchorBeats = anchorBeats; transport.anchorTime = anchorTime;
  transport.pending = pending;
  transport.extName = extName; transport.extBeats = extBeats;
  return ok;
}

/* Turns off sources whose targets are gone. */
export function syncDormant(hasTarget) {
  const ask = typeof hasTarget === 'function' ? hasTarget : null;
  let n = 0;
  for (const r of routes) {
    const dead = ask ? !ask(r.targetId) : false;
    r.dormant = dead;
    if (dead) n++;
  }
  return n;
}
/** Which routes are dead until their targets come back, for the UI and a dump. */
export function dormantRoutes() {
  const out = [];
  for (const r of routes) {
    if (!r.dormant) continue;
    const m = macroById.get(r.macroId);
    out.push({ id: r.id, macroId: r.macroId, macroName: m ? m.name : '?', targetId: r.targetId });
  }
  return out;
}
/** How many of this macro's sends are dead — the number the rail paints red. */
export function dormantCountOfMacro(id) {
  const k = String(id);
  let n = 0;
  for (const r of routes) if (r.dormant && r.macroId === k) n++;
  return n;
}
export function dormantCount() {
  let n = 0;
  for (const r of routes) if (r.dormant) n++;
  return n;
}

/* The factory presets. */
export const FACTORY_PRESETS = [
  {
    id: 'f.breathe', factory: 1, name: 'BREATHE',
    hint: 'a slow sine opening and closing the colour bands, with the whole palette ' +
          'turning underneath it — the resting state of the instrument',
    rack: {
      seq: { macro: 2, source: 2, route: 2 },
      sources: [
        /* 20 s in and out.  A little SMOOTH so the sine's turning points are
           not the only thing the eye can latch onto. */
        { id: 's1', kind: 'lfo', on: 1, label: '', shapeMode: 'wave', wave: 'sine',
          sync: 0, mult: LFO_MULT_DEFAULT, triplet: 0, dotted: 0,
          ratePos: freePos(0.05), phaseOff: 0, smooth: 0.22, steps: 0,
          trig: 0, anchor: 0, invert: 0, minimized: 0 },
        /* 83 s for a full turn.  SAW-up on a CIRCULAR target is seamless by
           construction — position 1 IS position 0 — so this never jumps. */
        { id: 's2', kind: 'lfo', on: 1, label: '', shapeMode: 'wave', wave: 'rotate',
          sync: 0, mult: LFO_MULT_DEFAULT, triplet: 0, dotted: 0,
          ratePos: freePos(0.012), phaseOff: 0, smooth: 0, steps: 0,
          trig: 0, anchor: 0, invert: 0, minimized: 0 }
      ],
      macros: [
        { id: 'm1', name: 'BREATH', named: 1, value: 0, sourceId: 's1' },
        { id: 'm2', name: 'TURN', named: 1, value: 0, sourceId: 's2' }
      ],
      routes: [
        { id: 'r1', macroId: 'm1', targetId: 'freq', min: 0, max: 0.17 },
        { id: 'r2', macroId: 'm2', targetId: 'phase', min: 0, max: 1 }
      ]
    }
  },
  {
    id: 'f.pulse', factory: 1, name: 'PULSE',
    hint: 'a tempo-locked staircase on the colour frequency and an envelope on ' +
          'brightness — press play, or hit space, and it lands on the beat',
    rack: {
      seq: { macro: 2, source: 2, route: 2 },
      sources: [
        /* BPM-synced, one half note per cycle, ANCHORed so it sits on the bar
           rather than wherever the last edit left it, and STEPPED to 8 rungs so
           it ratchets instead of sweeping. */
        { id: 's1', kind: 'lfo', on: 1, label: '', shapeMode: 'wave', wave: 'tri',
          sync: 1, mult: 1, triplet: 0, dotted: 0,
          ratePos: 0.39, phaseOff: 0, smooth: 0.06, steps: 8,
          trig: 0, anchor: 1, invert: 0, minimized: 0 },
        /* the hit: fast attack, short decay to nothing, a soft tail */
        { id: 's2', kind: 'env', on: 1, label: '', shapeMode: 'wave', wave: 'sine',
          a: 0.02, hold: 0, d: 0.42, s: 0, r: 0.55,
          ta: 0.55, td: -0.35, tr: -0.2, gateMode: 'oneshot', timeScale: 2,
          steps: 0, invert: 0, minimized: 0 }
      ],
      macros: [
        { id: 'm1', name: 'STEP', named: 1, value: 0, sourceId: 's1' },
        { id: 'm2', name: 'HIT', named: 1, value: 0, sourceId: 's2' }
      ],
      routes: [
        { id: 'r1', macroId: 'm1', targetId: 'freq', min: 0, max: 0.13 },
        { id: 'r2', macroId: 'm2', targetId: 'bright', min: 0, max: 0.30 }
      ]
    }
  },
  {
    id: 'f.drift', factory: 1, name: 'DRIFT',
    hint: 'two sample-and-hold wanderers on the first two colour phases — ' +
          'the palette reshuffles itself, slowly and never the same way twice',
    rack: {
      seq: { macro: 2, source: 2, route: 2 },
      sources: [
        /* S&H is a per-cycle hash of an integer-exact seed, so this is random
           to the eye and DETERMINISTIC to the bit: the same patch replays the
           same wander, which is what makes it filmable. */
        { id: 's1', kind: 'lfo', on: 1, label: '', shapeMode: 'wave', wave: 'sh',
          sync: 0, mult: LFO_MULT_DEFAULT, triplet: 0, dotted: 0,
          ratePos: freePos(0.13), phaseOff: 0, smooth: 0.42, steps: 0,
          trig: 0, anchor: 0, invert: 0, minimized: 0 },
        { id: 's2', kind: 'lfo', on: 1, label: '', shapeMode: 'wave', wave: 'sh',
          sync: 0, mult: LFO_MULT_DEFAULT, triplet: 0, dotted: 0,
          ratePos: freePos(0.09), phaseOff: 0.37, smooth: 0.55, steps: 0,
          trig: 0, anchor: 0, invert: 0, minimized: 0 }
      ],
      macros: [
        { id: 'm1', name: 'WANDER A', named: 1, value: 0, sourceId: 's1' },
        { id: 'm2', name: 'WANDER B', named: 1, value: 0, sourceId: 's2' }
      ],
      routes: [
        { id: 'r1', macroId: 'm1', targetId: 'pal.e1.phase', min: 0, max: 0.42 },
        { id: 'r2', macroId: 'm2', targetId: 'pal.e2.phase', min: 0, max: 0.42 }
      ]
    }
  }
];

/* Preset storage key and its format version. */
/* λWAVES: forced edit 1/8 — the storage namespace.  'mandel.modpresets' is
   BASINS identity, and the boundary law is that MIR never carries a Card's.
   Our house namespace is lambdawaves.q0.* (lab/rack.js LS_EXP / SETTINGS_KEY). */
export const PRESET_LS = 'lambdawaves.q0.modpresets';
export const PRESET_FORMAT_V = 1;
export const PRESET_NAME_MAX = 24;

/* The default and factory preset folder names. */
export const PRESET_FOLDER_DEFAULT = 'Josh\u2019s Collection';
export const PRESET_FOLDER_FACTORY = 'MANDELBROT';
export const PRESET_FOLDER_MAX = 24;

/** The folder a STORED preset is in.  Absence is the default, and so is any
    value that is not a usable string — a hand-edited blob cannot invent a
    folder nobody can see into. */
function presetFolderOf(p) {
  const f = p && typeof p.folder === 'string' ? p.folder.trim() : '';
  return f ? f.slice(0, PRESET_FOLDER_MAX) : PRESET_FOLDER_DEFAULT;
}
const presetSameFolder = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

function presetLsGet(k) {
  try { const s = globalThis.localStorage; return s ? s.getItem(k) : null; } catch (_) { return null; }
}
/* deliberately NOT guarded, exactly as library.js's is not: a quota throw has
   to reach presetSave so it can be SAID rather than swallowed */
function presetLsSet(k, v) {
  const s = globalThis.localStorage;
  if (!s) return false;
  s.setItem(k, v);
  return true;
}

let pstore = null;            // { seq, presets: [...] } — read lazily, held live
let pRefusedRaw = null;       // an unreadable blob, between the refusing read and the first write
let pRefusedKey = null;
let pError = null;

function validPreset(p) {
  return !!p && typeof p === 'object' &&
    typeof p.id === 'string' && p.id.length > 0 &&
    typeof p.name === 'string' &&
    Number.isFinite(p.at) && Number.isFinite(p.modV) &&
    !!p.rack && typeof p.rack === 'object' &&
    Array.isArray(p.rack.macros) && Array.isArray(p.rack.sources) && Array.isArray(p.rack.routes);
}

function presetStore() {
  if (pstore) return pstore;
  pError = null; pRefusedRaw = null;
  const raw = presetLsGet(PRESET_LS);
  let o = null;
  try { o = JSON.parse(raw || 'null'); } catch (_) { o = null; }
  if (o && typeof o === 'object' && o.formatVersion === PRESET_FORMAT_V &&
      Array.isArray(o.presets) && o.presets.every(validPreset)) {
    pstore = { seq: Number.isFinite(o.seq) ? Math.floor(o.seq) : o.presets.length,
               presets: o.presets };
    /* the counter is floored by what actually loaded, so a hand-edited file can
       never hand out an id that already exists (deserialize's own rule) */
    for (const p of pstore.presets) {
      const n = parseInt(String(p.id).slice(1), 10);
      if (Number.isFinite(n) && n > pstore.seq) pstore.seq = n;
    }
  } else {
    if (raw != null) {
      pRefusedRaw = raw;
      const fv = (o && typeof o === 'object') ? o.formatVersion : undefined;
      pError = Number.isFinite(fv) && fv !== PRESET_FORMAT_V
        ? ('the stored modulation presets are format ' + fv + ' and this build reads format ' +
           PRESET_FORMAT_V + ' — the file is left untouched and this session runs on the ' +
           'factory presets')
        : ('the stored modulation presets are unreadable — left in place; the first save will ' +
           'move them to "' + PRESET_LS + '.refused-<time>" and start a fresh set');
    }
    pstore = { seq: 0, presets: [] };
  }
  return pstore;
}

function presetSetAsideRefused() {
  const raw = pRefusedRaw;
  let key = null;
  try {
    const s = globalThis.localStorage;
    for (let i = 0; s && i < s.length; i++) {
      const k = s.key(i);
      if (k && k.indexOf(PRESET_LS + '.refused-') === 0 && presetLsGet(k) === raw) { key = k; break; }
    }
  } catch (_) {}
  if (!key) {
    key = PRESET_LS + '.refused-' + Date.now();
    presetLsSet(key, raw);          // a quota throw here reaches the caller: nothing was overwritten
    if (presetLsGet(key) !== raw) {
      throw new Error('could not set the unreadable presets aside — nothing was overwritten');
    }
  }
  pRefusedKey = key;
  pRefusedRaw = null;
  pError = 'the stored modulation presets were unreadable — set aside untouched at "' + key +
           '"; new saves go to a fresh set';
}

function presetPersist() {
  if (pRefusedRaw != null) presetSetAsideRefused();
  presetLsSet(PRESET_LS, JSON.stringify({ formatVersion: PRESET_FORMAT_V,
                                          modV: MOD_STATE_V,
                                          seq: pstore.seq, presets: pstore.presets }));
}

const presetSameName = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
function presetCleanName(n) {
  return String(n === undefined || n === null ? '' : n).trim().slice(0, PRESET_NAME_MAX).trim();
}
function presetNameTaken(n) {
  if (FACTORY_PRESETS.some((f) => presetSameName(f.name, n))) return true;
  return presetStore().presets.some((p) => presetSameName(p.name, n));
}
/** The copy name a factory-name SAVE is offered.  Said out loud and typed into
    the field rather than applied silently — a rename nobody asked for is how a
    preset ends up under a name its author cannot find. */
function presetFreeName(base) {
  const room = Math.max(1, PRESET_NAME_MAX - 5);
  const stem = presetCleanName(base).slice(0, room);
  let want = presetCleanName(stem + ' COPY');
  for (let i = 2; presetNameTaken(want) && i < 100; i++) {
    want = presetCleanName(stem.slice(0, Math.max(1, room - 3)) + ' COPY ' + i);
  }
  return want;
}

/* Returns the public view of a stored preset. */
function presetPublic(p, factory) {
  const v = factory ? MOD_STATE_V : p.modV;
  return { id: p.id, name: p.name, at: factory ? 0 : p.at, factory: factory ? 1 : 0,
           folder: factory ? PRESET_FOLDER_FACTORY : presetFolderOf(p),
           modV: v,
           stale: factory ? false : !modStateReadable(p.modV),
           /* null when it was written against THIS model; the older readable
              version otherwise, so "saved under model 3" is printable. */
           migratedFrom: (factory || v === MOD_STATE_V) ? null : v,
           hint: p.hint || null };
}

/* Returns every preset, factory presets first. */
export function presetList() {
  const st = presetStore();
  const users = st.presets.slice().sort((a, b) =>
    (a.at - b.at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return FACTORY_PRESETS.map((f) => presetPublic(f, true))
    .concat(users.map((p) => presetPublic(p, false)));
}

/* Returns the preset folders and their counts. */
export function presetFolders() {
  const out = [{ name: PRESET_FOLDER_FACTORY, factory: 1, count: FACTORY_PRESETS.length }];
  const seen = new Map();
  const users = presetStore().presets.slice().sort((a, b) =>
    (a.at - b.at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const p of users) {
    const f = presetFolderOf(p);
    const k = f.toLowerCase();
    if (seen.has(k)) { seen.get(k).count++; continue; }
    seen.set(k, { name: f, factory: 0, count: 1 });
  }
  const list = [...seen.values()];
  const di = list.findIndex((f) => presetSameFolder(f.name, PRESET_FOLDER_DEFAULT));
  if (di > 0) list.unshift(list.splice(di, 1)[0]);
  /* the user's own folder is ALWAYS offered, even empty: a place to save into
     that only appears once something is in it is a place nobody finds */
  if (di < 0) list.unshift({ name: PRESET_FOLDER_DEFAULT, factory: 0, count: 0 });
  return out.concat(list);
}

/* Moves a preset into a folder. */
export function setPresetFolder(id, folder) {
  const k = String(id);
  if (FACTORY_PRESETS.some((f) => f.id === k)) return { ok: false, error: 'factory', id: k };
  const st = presetStore();
  const rec = st.presets.find((p) => p.id === k);
  if (!rec) return { ok: false, error: 'missing', id: k };
  const want = String(folder === undefined || folder === null ? '' : folder)
    .trim().slice(0, PRESET_FOLDER_MAX).trim();
  if (want && presetSameFolder(want, PRESET_FOLDER_FACTORY)) {
    return { ok: false, error: 'reserved', id: k, folder: PRESET_FOLDER_FACTORY };
  }
  const before = Object.prototype.hasOwnProperty.call(rec, 'folder') ? rec.folder : undefined;
  const had = Object.prototype.hasOwnProperty.call(rec, 'folder');
  if (!want || presetSameFolder(want, PRESET_FOLDER_DEFAULT)) delete rec.folder;
  else rec.folder = want;
  try { presetPersist(); } catch (e) {
    if (had) rec.folder = before; else delete rec.folder;
    return { ok: false, error: 'storage', message: String((e && e.message) || e) };
  }
  return { ok: true, id: k, name: rec.name, folder: presetFolderOf(rec) };
}

export function presetGet(id) {
  const k = String(id);
  const f = FACTORY_PRESETS.find((x) => x.id === k);
  if (f) return { ...presetPublic(f, true), rack: f.rack };
  const p = presetStore().presets.find((x) => x.id === k);
  return p ? { ...presetPublic(p, false), rack: p.rack } : null;
}

/* Applies a preset's rack, leaving the transport untouched. */
export function presetApply(id) {
  const p = presetGet(id);
  if (!p) return { ok: false, error: 'missing', id: String(id) };
  if (p.stale) {
    return { ok: false, error: 'version', id: p.id, name: p.name,
             have: p.modV, want: MOD_STATE_V, reads: MOD_STATE_READS.slice() };
  }
  let rack = null;
  try { rack = JSON.parse(JSON.stringify(p.rack)); }
  catch (_) { return { ok: false, error: 'rack', id: p.id, name: p.name }; }
  const migrated = migrateRack(rack, p.factory ? MOD_STATE_V : p.modV);
  if (!migrated) {
    return { ok: false, error: 'version', id: p.id, name: p.name,
             have: p.modV, want: MOD_STATE_V, reads: MOD_STATE_READS.slice() };
  }
  deserializeRack(migrated);
  modStat.presetLoads++;
  return { ok: true, id: p.id, name: p.name, factory: !!p.factory,
           migratedFrom: p.migratedFrom,
           counts: { macros: macros.length, sources: sources.length, routes: routes.length } };
}

/* Saves a rack as a preset. */
export function presetSave(name, rack, opts) {
  const o = opts || {};
  const nm = presetCleanName(name);
  if (!nm) return { ok: false, error: 'name' };
  if (!rack || typeof rack !== 'object' || !Array.isArray(rack.sources) ||
      !Array.isArray(rack.macros) || !Array.isArray(rack.routes)) {
    return { ok: false, error: 'rack' };
  }
  if (FACTORY_PRESETS.some((f) => presetSameName(f.name, nm))) {
    return { ok: false, error: 'factory-name', name: nm, suggest: presetFreeName(nm) };
  }
  const st = presetStore();
  const hit = st.presets.find((p) => presetSameName(p.name, nm));
  if (hit && !o.replace) return { ok: false, error: 'exists', id: hit.id, name: hit.name };
  const fWant = o.folder === undefined || o.folder === null ? null
    : String(o.folder).trim().slice(0, PRESET_FOLDER_MAX).trim();
  if (fWant && presetSameFolder(fWant, PRESET_FOLDER_FACTORY)) {
    return { ok: false, error: 'reserved', name: nm, folder: PRESET_FOLDER_FACTORY };
  }
  let body = null;
  try { body = JSON.parse(JSON.stringify(rack)); }
  catch (_) { return { ok: false, error: 'rack' }; }
  delete body.transport;               // belt and braces: a patch never carries a tempo
  const before = hit ? { name: hit.name, modV: hit.modV, rack: hit.rack,
                         hadFolder: Object.prototype.hasOwnProperty.call(hit, 'folder'),
                         folder: hit.folder } : null;
  let rec = hit;
  if (hit) { hit.name = nm; hit.modV = MOD_STATE_V; hit.rack = body; }
  else {
    rec = { id: 'p' + (++st.seq), name: nm, at: Date.now(), modV: MOD_STATE_V, rack: body };
    st.presets.push(rec);
  }
  if (fWant !== null) {
    if (!fWant || presetSameFolder(fWant, PRESET_FOLDER_DEFAULT)) delete rec.folder;
    else rec.folder = fWant;
  }
  try { presetPersist(); } catch (e) {
    /* PUT IT BACK.  A refused write must leave the live list exactly as the
       disk still has it, or the UI would show a preset that does not exist. */
    if (hit && before) {
      hit.name = before.name; hit.modV = before.modV; hit.rack = before.rack;
      if (before.hadFolder) hit.folder = before.folder; else delete hit.folder;
    } else { const i = st.presets.indexOf(rec); if (i >= 0) st.presets.splice(i, 1); st.seq--; }
    return { ok: false, error: 'storage', message: String((e && e.message) || e) };
  }
  modStat.presetSaves++;
  return { ok: true, id: rec.id, name: rec.name, replaced: !!hit, folder: presetFolderOf(rec) };
}

/** DELETE.  A factory can never be deleted; it is not in the store to delete. */
export function presetDelete(id) {
  const k = String(id);
  if (FACTORY_PRESETS.some((f) => f.id === k)) return { ok: false, error: 'factory', id: k };
  const st = presetStore();
  const i = st.presets.findIndex((p) => p.id === k);
  if (i < 0) return { ok: false, error: 'missing', id: k };
  const gone = st.presets[i];
  st.presets.splice(i, 1);
  try { presetPersist(); } catch (e) {
    st.presets.splice(i, 0, gone);
    return { ok: false, error: 'storage', message: String((e && e.message) || e) };
  }
  modStat.presetDeletes++;
  return { ok: true, id: k, name: gone.name };
}

/** Re-read the store from storage — the harness's door, and what a settings
    import would call.  Also the only way to clear a refusal after the blob
    behind it has been dealt with. */
export function presetStoreReload() {
  pstore = null; pRefusedKey = null; pError = null;
  presetStore();
  return presetStoreState();
}

export function presetStoreState() {
  const st = presetStore();
  const raw = presetLsGet(PRESET_LS);
  return { key: PRESET_LS, formatVersion: PRESET_FORMAT_V, modV: MOD_STATE_V,
           reads: MOD_STATE_READS.slice(),
           factories: FACTORY_PRESETS.length, users: st.presets.length,
           folders: presetFolders(),
           folderDefault: PRESET_FOLDER_DEFAULT, folderFactory: PRESET_FOLDER_FACTORY,
           stale: st.presets.filter((p) => !modStateReadable(p.modV)).length,
           older: st.presets.filter((p) => modStateReadable(p.modV) &&
                                           p.modV !== MOD_STATE_V).length,
           error: pError, refusedKey: pRefusedKey,
           bytes: raw ? raw.length : 0 };
}


/** Materialize the triple for one target.  Returns {macro, source, route}. */
export function materialize(targetId, seed, label) {
  const id = String(targetId);
  const s0 = seed || {};
  const src = newSource('lfo', {
    wave: s0.wave, ratePos: s0.ratePos, phaseOff: s0.phaseOff,
    on: s0.on === undefined ? true : !!s0.on,
    label: label || id, seedFrom: id
  });
  /* THE SEED IS THE TARGET'S, NOT THE SOURCE'S.  2a hashed the target id, and
     the S&H/DRIFT sequences a user has already seen must not change under a
     migration — so the seed is carried explicitly rather than derived from the
     new source id.  (newSource's `seedFrom` above does exactly this.) */
  const m = assignMacro(src, label || id);
  const r = newRoute(m.id, id, s0.lo, s0.hi);
  syncMacros();
  return { macro: m, source: src, route: r };
}

/* Assigns a source to the first free macro. */
function assignMacro(src, label) {
  let m = macros.find((q) => !q.sourceId);
  if (!m) m = newMacro(null, { named: false });
  m.sourceId = src.id;
  if (label && !src.label) src.label = String(label).slice(0, 24);
  m.value = clamp01(src.out);
  return m;
}

/* Returns the v2-shaped view of one target's routing, or null. */
export function legacyOf(targetId) {
  const r = routeOfTarget(targetId);
  if (!r) return null;
  const m = macroById.get(r.macroId);
  const s = m && m.sourceId ? sourceById.get(m.sourceId) : null;
  if (!s) return null;
  const lerped = r.min + (r.max - r.min) * m.value;
  const live = m.masterDepth === 1 ? lerped : r.min + routeInfluence(m, r, lerped);
  return {
    on: !!s.on, wave: s.wave, ratePos: s.ratePos, phaseOff: s.phaseOff,
    lo: r.min, hi: r.max, phase: s.phase, cycles: s.cycles | 0,
    /* the TRUE rate, whatever mode the source is in — a BPM-synced source's
       `ratePos` is a stale free-run dial and the rack must not print it as Hz */
    hz: lfoHz(s),
    rseed: s.rseed, live,
    macroId: m.id, sourceId: s.id, routeId: r.id, curve: s.shapeMode === 'curve'
  };
}

/** The v2-shaped WRITE.  Range fields go to the route, everything else to the
    source; nothing here touches a phase. */
export function setLegacy(targetId, patch) {
  const r = routeOfTarget(targetId);          // the primary
  if (!r || !patch) return null;
  if (Number.isFinite(patch.lo)) r.min = clamp01(patch.lo);
  if (Number.isFinite(patch.hi)) r.max = clamp01(patch.hi);
  const m = macroById.get(r.macroId);
  const s = m && m.sourceId ? sourceById.get(m.sourceId) : null;
  if (s) {
    const p = {};
    if (patch.wave !== undefined) p.wave = patch.wave;
    if (patch.ratePos !== undefined) p.ratePos = patch.ratePos;
    if (patch.phaseOff !== undefined) p.phaseOff = patch.phaseOff;
    if (patch.on !== undefined) p.on = patch.on;
    setSource(s.id, p);
  }
  syncMacros();
  return legacyOf(targetId);
}

/** Takes a target's whole triple down; the macro stays and lets go of its source. */
export function demolish(targetId) {
  const list = routeByTarget.get(String(targetId));
  if (!list || !list.length) return false;
  for (const r of list.slice()) {
    const m = macroById.get(r.macroId);
    const sid = m ? m.sourceId : null;
    removeRoute(r.id);
    if (sid && !routes.some((q) => macroById.get(q.macroId) &&
                                   macroById.get(q.macroId).sourceId === sid)) {
      removeSource(sid);
      if (m) m.sourceId = null;
    }
  }
  syncMacros();
  return true;
}

/* Rebuilds the model from a legacy v2 rack. */
export function migrateFromLegacy(legacy, order, labels, fromVersion) {
  modReset();
  const seen = new Set();
  const take = (id) => {
    const rec = legacy[id];
    if (!rec || seen.has(id)) return;
    seen.add(id);
    materialize(id, rec, (labels && labels[id]) || id);
  };
  for (const id of (order || [])) if (legacy[id] && legacy[id].on) take(id);
  for (const id of Object.keys(legacy || {})) if (legacy[id].on) take(id);
  modStat.migratedFrom = fromVersion | 0;
  return { macros: macros.length, sources: sources.length, routes: routes.length };
}

/* ═══════════════════════════ the instrument ════════════════════════════════ */

export function modState() {
  return {
    v: MOD_STATE_V,
    transport: { bpm: transport.bpm, beats: transport.beats, time: transport.time,
                 triggers: transport.triggers, plays: transport.plays,
                 sync: transport.sync, effective: effectiveSyncMode(),
                 lag: transportLag(), wall: transport.wall,
                 anchorAt: transport.anchorAt, anchorBeats: transport.anchorBeats,
                 anchorTime: transport.anchorTime, pending: transport.pending,
                 reanchors: transport.reanchors,
                 ext: { name: transport.extName, beats: transport.extBeats,
                        writes: transport.extWrites, active: externalClockActive() },
                 hold: { on: transport.hold, note: transport.holdNote, L: transport.holdL,
                         p: transport.holdP, a: transport.holdA, beat: heldBeat(),
                         holds: transport.holds },
                 playing: transport.playing },
    macros: macros.map((m, i) => ({
      index: i + 1, id: m.id, name: m.name, named: m.named, value: m.value,
      masterDepth: m.masterDepth,
      sourceId: m.sourceId,
      kind: m.kind,
      fires: m.kind === 'trigger' ? subsOfTrigger(m.id) : [],
      targets: routes.filter((r) => r.macroId === m.id).map((r) => r.targetId)
    })),
    sources: sources.map((s) => ({
      id: s.id, kind: s.kind, bank: s.bank, on: s.on, label: s.label,
      audio: s.kind === 'audio' ? audioReadout(s.id) : null,
      shapeMode: s.shapeMode, wave: s.wave,
      curve: s.shapeMode === 'curve' ? curveInfo(s.points) : null,
      hz: s.kind === 'lfo' ? lfoHz(s) : null,
      sync: s.sync, mult: s.mult, multLabel: LFO_MULT_LABEL[s.mult],
      triplet: s.triplet, dotted: s.dotted, beats: s.kind === 'lfo' ? beatsPerCycle(s) : null,
      ratePos: s.ratePos, phaseOff: s.phaseOff, smooth: s.smooth,
      smoothTau: smoothTau(s.smooth),
      steps: s.steps | 0, stepSize: s.steps >= STEPS_MIN ? 1 / (s.steps - 1) : 0,
      stepSizeCirc: s.steps >= STEPS_MIN ? 1 / s.steps : 0,
      trig: !!s.trig, mode: modeShadow(s), anchor: s.anchor,
      /* `out` is what the engine publishes (quantized when the ladder is on);
         `cont` is what it would have been without the ladder.  Both, so a dump
         can show the staircase AND the shape under it. */
      phase: s.phase, cycles: s.cycles | 0, out: s.out, cont: s.cont,
      a: s.a, hold: s.hold, d: s.d, s: s.s, r: s.r, invert: s.invert,
      ta: s.ta, td: s.td, tr: s.tr, timeScale: s.timeScale, gateMode: s.gateMode,
      minimized: !!s.minimized,
      triggerId: s.triggerId || null,
      autoHit: !!s.autoHit,
      envT: s.t, fired: s.fired, gate: s.gate, fires: s.fires,
      duration: s.kind === 'env' ? envDuration(s) : null,
      banks: { A: sourceBankFrom(s.banks.A, sourceBankSnapshot(s), s.kind !== 'env'),
               B: sourceBankFrom(s.banks.B, sourceBankSnapshot(s), s.kind !== 'env') }
    })),
    routes: routes.map((r) => {
      const m = macroById.get(r.macroId);
      return { id: r.id, macroId: r.macroId, macroName: m ? m.name : '?',
               targetId: r.targetId, min: r.min, max: r.max,
               /* `pos` stays the route's legacy absolute reading for dump/gate
                  continuity; `offset` is what the shipping base law adds. */
               pos: m ? r.min + (r.max - r.min) * m.value : null,
               offset: m ? (r.max - r.min) * m.value : null,
               effectiveOffset: m
                 ? ((r.max - r.min) * m.value) * m.masterDepth : null,
               masterDepth: m ? m.masterDepth : null,
               depth: r.max - r.min,
               dormant: !!r.dormant };
    }),
    stacks: Array.from(routeByTarget.entries()).map(([tid, list]) => ({
      targetId: tid, count: list.length,
      routes: list.map((r) => r.id),
      macros: list.map((r) => r.macroId),
      offset: list.reduce((a, r) => {
        const m = macroById.get(r.macroId);
        if (!m) return a;
        if (m.sourceId) { const s = sourceById.get(m.sourceId); if (!s || !s.on) return a; }
        const raw = (r.max - r.min) * m.value;
        return a + (m.masterDepth === 1 ? raw : raw * m.masterDepth);
      }, 0)
    })),
    needsClock: needsClock(), anyLive: anyLiveRoute(),
    counts: { macros: macros.length, sources: sources.length, routes: routes.length,
              stacked: Array.from(routeByTarget.values()).filter((l) => l.length > 1).length,
              dormant: dormantCount(),
              triggers: macros.filter((m) => m.kind === 'trigger').length,
              subscribed: sources.filter((s) => !!s.triggerId).length,
              hits: sources.filter((s) => !!s.autoHit).length,
              audio: sources.filter((s) => s.kind === 'audio').length,
              audioArmed: sources.filter((s) => s.kind === 'audio' && s.armed).length,
              audioDemand: sources.filter((s) => s.kind === 'audio' && audioDemand(s.id)).length },
    sourceIds: sourceIds(),
    dormantRoutes: dormantRoutes(),
    presets: presetStoreState(),
    stat: { ...modStat },
    constants: { BPM_MIN, BPM_MAX, BPM_DEFAULT, LFO_MULTS: LFO_MULTS.slice(),
                 LFO_MULT_LABEL: LFO_MULT_LABEL.slice(), TRIPLET, DOTTED,
                 SMOOTH_TAU_MAX, ENV_MAX_S, MACRO_BOOT, MOD_STATE_V,
                 SYNC_MODES: SYNC_MODES.slice(), SYNC_DEFAULT,
                 MACRO_MAX, RATE_MIN, RATE_MAX, STEPS_MIN, STEPS_MAX,
                 STEPS_LADDER: STEPS_LADDER.slice(),
                 MOD_STATE_READS: MOD_STATE_READS.slice(),
                 AUDIO_OUTPUTS: AUDIO_OUTPUTS.slice(),
                 AUDIO_EXPOSED: AUDIO_EXPOSED.slice(),
                 AUDIO_RESERVED: AUDIO_RESERVED.slice(),
                 AUDIO_SOURCES: AUDIO_SOURCES.slice(),
                 AUDIO_MODES: AUDIO_MODES.slice(),
                 AUDIO_DB_FLOOR, AUDIO_DB_TOP, AUDIO_DB_SPAN, AUDIO_GAIN_MAX,
                 AUDIO_FLUX_FLOOR, AUDIO_FEED_HZ_DEFAULT,
                 AUDIO_ONSET: { ...AUDIO_ONSET },
                 AUDIO_GATE_DEFAULTS: { ...AUDIO_GATE_DEFAULTS },
                 AUDIO_FOLLOW_DEFAULTS: JSON.parse(JSON.stringify(AUDIO_FOLLOW_DEFAULTS)),
                 AUDIO_OUT_MODE: { ...AUDIO_OUT_MODE } }
  };
}

bootMacros();
