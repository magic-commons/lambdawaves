/* ═════════════════════════════════════════════════════════════════════════════
 * VENDORED FILE — lab/mir/curve.js
 *
 *   Source     $MB/app/curve.js  (MB = the local MANDELBROT checkout; see PORT-NOTES.md — wave 68
 *              took the absolute path out of a file that ships)
 *   Taken      2026-09-05, at 416 lines
 *   sha256     9991eb71da046385d43cd51c8b63ab81bb2aac82fdd122a08d1dbaa7d089b485
 *   Forced     0 edits.  Every byte below this header is the source, unmodified.
 *
 * THE LAW OF THIS FILE: IT IS MAINTAINED BY DIFF AGAINST ITS SOURCE, NEVER
 * REWRITTEN.  An upstream fix must still be a three-line patch a year from now.
 * Do not reformat it, do not re-order it, do not tidy it, do not let a linter
 * near it.  It is leaf mathematics with no identity of its own — there is
 * nothing here that needs to become ours.  See PORT-NOTES.md.
 * ═════════════════════════════════════════════════════════════════════════════ */
/* ============================================================================
   MANDELBROT — curve.js   (⟡ WAVE-MOD1 — THE BREAKPOINT CURVE)

   Josh's sketch, for both the LFO and the ENV device: "MAIN AREA = an editable
   curve: filled dots are POINTS, open circles on the segments between them are
   TENSION handles (drag to bend the segment)."  That is the FL Studio
   automation-clip idiom, and this file is the whole of its mathematics.

   A CURVE IS A LIST OF POINTS AND NOTHING ELSE:

       [{ t, v, tension }, ...]      t, v in [0,1];  tension in [-1,1]

   `t` is position along the cycle (an LFO's phase, an ENV's normalized time),
   `v` is the value there, and `tension` bends the segment that STARTS at this
   point and ends at the next one.  The last point's tension is unused and is
   normalized to 0 so that two curves can be compared with plain equality.

   THE FIVE LAWS, each one a gate rather than a preference:

     1. EXACT AT EVERY POINT.  evaluate(pts, pts[i].t) returns pts[i].v as the
        same double, for every i and every tension — by early return, not by
        arithmetic that happens to round well.
     2. tension = 0 IS LINEAR, and linear is `x` itself: bend() returns its
        argument untouched, so a curve of zero tensions is exactly the piecewise
        linear interpolation and a preset that carries no tension is exact.
     3. MONOTONE WITHIN A SEGMENT.  bend() is non-decreasing on [0,1] with
        bend(0)=0 and bend(1)=1 for every tension, so a segment's value never
        leaves the interval between its two endpoints.  A modulation curve that
        overshoots would drive a control past a range handle the user set, and
        the range window is the one promise this engine makes about amplitude.
     4. C0 BY CONSTRUCTION.  Segments share their endpoints; there is no spline
        that could ring, and no continuity to check.  (A duplicate `t` is an
        allowed, deliberate DISCONTINUITY — that is how SQUARE is written.)
     5. THE MIRROR IS CLOSED IN THE FAMILY.  Reversing a curve in time is again
        a curve in this family, with every tension negated — see mirror().  That
        is what makes Josh's "tapping a preset again flips the saw's direction"
        an exact toggle rather than an approximation, and it is the property
        that CHOSE the tension formula below.

   ── THE TENSION FORMULA, AND WHY THIS ONE ──────────────────────────────────

   FL Studio's internal constant is not published, and no primary source was in
   reach for this wave (the honest statement: the shape below reproduces FL's
   OBSERVABLE behaviour — linear at zero, a single-curvature bend that hardens
   toward the ends, mirror-symmetric in the sign — but the exponent span is OUR
   constant, named and tunable, not a decoded one).  What is decided here is the
   FAMILY, and it was decided by law 5.

       p(tau) = 2 ^ (TENSION_OCT * |tau|)                    in [1, 8]

       bend(x, tau) =  x                        tau = 0      (exact)
                    =  x ^ p                    tau > 0      (slow start)
                    =  1 - (1 - x) ^ p          tau < 0      (fast start)

   Its properties, all four asserted by the gate:

     * bend(0,tau) = 0 and bend(1,tau) = 1 EXACTLY for every tau (0^p = 0 and
       1^p = 1 in IEEE754 for p > 0);
     * bend(x,0) = x bitwise;
     * monotone non-decreasing, image contained in [0,1] — no overshoot;
     * ANTISYMMETRIC:  bend(x, -tau) = 1 - bend(1 - x, tau).

   The antisymmetry is not decoration.  Reverse a segment in time and the
   algebra asks for a tension tau' with bend(x,tau') = 1 - bend(1-x,tau); the
   antisymmetry says tau' = -tau, so mirror() is a sign flip and nothing else.
   The obvious alternative — the single-branch power law x^(2^-k*tau), whose
   negative half is the INVERSE function rather than the rotation — fails
   exactly there: 1 - (1-x)^p is not a power of x for any exponent, so a
   mirrored tensioned curve would fall out of the family and Josh's second tap
   could not be exact.  That is the whole argument.

   TENSION_OCT = 3 is a feel constant: at |tau| = 1 the segment is an eightfold
   power, which is about as hard a bend as an automation clip is ever drawn
   with.  It is exported so it can be retuned by hand without touching algebra.
   ========================================================================== */

export const TENSION_OCT = 3;
/** A curve may not grow without bound — a UI that can add points needs a rail,
    and 32 is far past any shape a finger will draw on a 178 px device panel. */
export const CURVE_MAX_POINTS = 32;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clampT = (v) => (v < -1 ? -1 : v > 1 ? 1 : v);

/**
 * THE SEGMENT SHAPE.  x is the fraction along one segment; the return is the
 * fraction of the way from the segment's start value to its end value.
 *
 * The zero test is written as "neither positive nor negative" so that -0 and
 * NaN both land on the exact linear branch: a corrupt payload bends nothing
 * rather than producing NaN, which is the refuse-don't-repair discipline
 * applied to arithmetic.
 */
export function bend(x, tension) {
  const u = x < 0 ? 0 : x > 1 ? 1 : x;
  const tau = tension;
  if (!(tau > 0) && !(tau < 0)) return u;
  const p = Math.pow(2, TENSION_OCT * (tau < 0 ? -tau : tau));
  return tau > 0 ? Math.pow(u, p) : 1 - Math.pow(1 - u, p);
}

/**
 * Put a point list into the canonical form every other function here assumes:
 * numbers finite and clamped, sorted by `t` with ties keeping their written
 * order (that is what makes a duplicate-`t` jump mean "the later point wins"),
 * at least two points, and the last point's tension zeroed because it bends
 * nothing.  Returns a NEW array of NEW objects — a curve is never aliased into
 * two owners.
 */
export function normalizePoints(pts) {
  const src = Array.isArray(pts) ? pts : [];
  const out = [];
  for (let i = 0; i < src.length && out.length < CURVE_MAX_POINTS; i++) {
    const p = src[i];
    if (!p) continue;
    const t = Number(p.t), v = Number(p.v);
    if (!Number.isFinite(t) || !Number.isFinite(v)) continue;
    const tn = Number(p.tension);
    out.push({ t: clamp01(t), v: clamp01(v),
               tension: Number.isFinite(tn) ? clampT(tn) : 0, _i: out.length });
  }
  if (out.length === 0) { out.push({ t: 0, v: 0, tension: 0, _i: 0 }); }
  if (out.length === 1) { out.push({ t: 1, v: out[0].v, tension: 0, _i: 1 }); }
  out.sort((a, b) => (a.t - b.t) || (a._i - b._i));
  const clean = out.map((p) => ({ t: p.t, v: p.v, tension: p.tension }));
  clean[clean.length - 1].tension = 0;
  return clean;
}

/** A deep copy, canonical.  (clonePoints(normalizePoints(x)) is redundant.) */
export function clonePoints(pts) {
  return pts.map((p) => ({ t: p.t, v: p.v, tension: p.tension }));
}

/**
 * THE READING.  `u` is a normalized position along the curve; the return is in
 * [0,1] and is EXACTLY a point's value whenever u is that point's t.
 *
 * Duplicate `t` is legal and is how a jump is written (SQUARE is four points
 * with two of them at 0.5).  The rule is stated once, here: at a tie the LATER
 * point wins, so the value at the jump is the value after it — which is the
 * convention the analytic square wave already used (phase 0.5 reads 1).
 */
export function evaluate(pts, u) {
  const n = pts.length;
  if (n === 0) return 0;
  if (n === 1) return pts[0].v;
  const x = u < 0 ? 0 : u > 1 ? 1 : u;
  if (x <= pts[0].t) return pts[0].v;              // law 1, at the left end
  if (x >= pts[n - 1].t) return pts[n - 1].v;      // law 1, at the right end
  let i = 0;
  for (let k = 1; k < n; k++) { if (pts[k].t <= x) i = k; else break; }
  if (i >= n - 1) return pts[n - 1].v;
  const a = pts[i], b = pts[i + 1];
  const w = b.t - a.t;
  if (!(w > 0)) return b.v;                        // a zero-width segment
  const f = bend((x - a.t) / w, a.tension);
  if (f <= 0) return a.v;                          // law 1, at every interior
  if (f >= 1) return b.v;                          // point, from both sides
  return a.v + (b.v - a.v) * f;
}

/**
 * THE MIRROR — the curve reversed in time.  Law 5: a sign flip on every
 * tension, and nothing else.
 *
 * Derivation, in one line, so nobody has to trust it: on the segment that ran
 * from a to b the reading was v_a + D*bend(x,tau); after reversal the same
 * geometry must read v_b - D*bend(x',tau') with x' = 1-x, so bend(x',tau') =
 * 1 - bend(1-x',tau), which the antisymmetry above solves at tau' = -tau.
 *
 * EXACTNESS CAVEAT, named: 1 - (1 - t) is t only when t is a dyadic rational
 * (1-0.1 = 0.9, but 1-0.9 = 0.09999999999999998).  Every PRESET here uses
 * eighths, so mirror(mirror(preset)) is bit-identical to the preset and the
 * preset toggle is exact; a hand-drawn curve mirrored twice may move by one
 * ulp, which is why applyPreset() below recomputes both forms from the
 * canonical table rather than mirroring whatever is on screen.
 */
export function mirror(pts) {
  const n = pts.length;
  const out = [];
  for (let k = n - 1; k >= 0; k--) {
    out.push({ t: 1 - pts[k].t, v: pts[k].v,
               tension: k > 0 ? -pts[k - 1].tension : 0 });
  }
  return out;
}

/**
 * ⟡ WAVE-MODUX — THE FLIP.  Josh: "time-reverse the active curve: c(t) ->
 * c(1-t); symmetric shapes invariant".
 *
 * It is mirror(), normalized, with ONE correction — and that correction is the
 * whole reason this exists rather than the button calling mirror() directly.
 *
 * mirror() NEGATES EVERY TENSION, and negating a tension of zero produces -0.
 * Three of this file's own readers cannot see the difference and one can:
 * bend() tests "neither positive nor negative" so -0 evaluates exactly as +0;
 * pointsEqual() uses ===, and -0 === 0; but curveHash() reads the RAW EIGHT
 * BYTES of every double, and -0 has the sign bit set.  So mirror() on a
 * SYMMETRIC shape returns a curve that IS the same curve and HASHES
 * DIFFERENTLY — measured: mirror(tri) hashes 383634933 against tri's
 * 2049297909.  The device's paint signature is that hash (anim.js's paintMod2),
 * so a flip of a triangle would repaint the editor and report that something
 * happened when Josh's own spec says nothing may.  Normalising -0 to +0 makes
 * "symmetric shapes are invariant" true TO THE BIT rather than to the eye.
 *
 * Everything else is mirror()'s derivation, which is already argued above, and
 * its exactness caveat travels with it: 1 - (1 - t) is t only for dyadic t, so
 * flip(flip(x)) is bit-exact for every preset (all eighths) and may move a
 * hand-drawn point by one ulp.  The gate measures that residual rather than
 * assuming it away.
 */
export function flip(pts) {
  const out = normalizePoints(mirror(pts));
  for (let i = 0; i < out.length; i++) if (Object.is(out[i].tension, -0)) out[i].tension = 0;
  return out;
}

/** Two curves, compared as the user sees them (the last tension bends nothing
    and is normalized to 0, so plain equality is the right test). */
export function pointsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].t !== b[i].t || a[i].v !== b[i].v || a[i].tension !== b[i].tension) return false;
  }
  return true;
}

/* ═══════════════════════════ THE PRESET SHAPES ═════════════════════════════
 *
 * Josh's sketch, LFO device, LEFT column: "PRESET shapes (triangle/saw, sine,
 * square, fast multi-saw, fast multi-triangle)" — and "tapping a preset again
 * flips the saw's direction".
 *
 * Every t below is a dyadic rational (halves, quarters, eighths) so that the
 * mirror is exact to the bit.  Four of the seven are EXACT against the
 * analytic waves anim.js has shipped since 2a — SAWUP is `rotate`, SAWDOWN is
 * `sawdown`, TRI is `tri`, SQUARE is `square`, all to the double — which is
 * what lets a curve-mode source and a wave-mode source be compared in a gate.
 *
 * SINE IS THE ONE APPROXIMATION, and it is stated rather than hidden.  A
 * tensioned segment is monotone with a single curvature, so it cannot be an
 * S — a true half-sine has an inflection at its midpoint.  The preset
 * therefore splits the cycle at every quarter and gives each quarter the
 * tension that matches the sine AT ITS OWN MIDPOINT:
 *
 *     bend(1/2, tau) = 1 - cos(pi/4)   =>   tau = log2( ln(1-cos(pi/4)) /
 *                                                       ln(1/2) ) / TENSION_OCT
 *
 * DERIVED, never typed — the file's own house rule for constants.  The residual
 * against 0.5 - 0.5 cos(2*pi*t) is measured by the gate and reported; the
 * exact sine is still available as a WAVE (anim.js's analytic `sine`), so
 * nothing that needs the exact shape is forced through an approximation.
 */
export const SINE_TENSION =
  Math.log2(Math.log(1 - Math.cos(Math.PI / 4)) / Math.log(0.5)) / TENSION_OCT;

const P = (t, v, tension) => ({ t, v, tension: tension || 0 });

/** name -> the canonical point table.  Order is the sketch's column order. */
const PRESET_TABLE = {
  tri:     () => [P(0, 0), P(0.5, 1), P(1, 0)],
  sawup:   () => [P(0, 0), P(1, 1)],
  sawdown: () => [P(0, 1), P(1, 0)],
  sine:    () => [P(0, 0, SINE_TENSION), P(0.25, 0.5, -SINE_TENSION),
                  P(0.5, 1, SINE_TENSION), P(0.75, 0.5, -SINE_TENSION), P(1, 0)],
  square:  () => [P(0, 0), P(0.5, 0), P(0.5, 1), P(1, 1)],
  msaw:    () => [P(0, 0), P(0.25, 1), P(0.25, 0), P(0.5, 1),
                  P(0.5, 0), P(0.75, 1), P(0.75, 0), P(1, 1)],
  mtri:    () => [P(0, 0), P(0.125, 1), P(0.25, 0), P(0.375, 1), P(0.5, 0),
                  P(0.625, 1), P(0.75, 0), P(0.875, 1), P(1, 0)]
};

export const PRESETS = ['tri', 'sawup', 'sawdown', 'sine', 'square', 'msaw', 'mtri'];
export const PRESET_LABEL = {
  tri: 'TRI', sawup: 'SAW↑', sawdown: 'SAW↓', sine: 'SINE',
  square: 'SQR', msaw: 'MULTI-SAW', mtri: 'MULTI-TRI'
};

export function isPreset(name) { return Object.hasOwn(PRESET_TABLE, String(name)); }

/** A fresh canonical copy of a preset's points.  Unknown name -> saw up. */
export function presetPoints(name) {
  const f = PRESET_TABLE[String(name)] || PRESET_TABLE.sawup;
  return normalizePoints(f());
}

/** The mirrored form of a preset — computed from the TABLE, so it is exact. */
export function presetMirror(name) { return normalizePoints(mirror(presetPoints(name))); }

/** A preset whose mirror is itself: tapping it twice is honestly a no-op, and
    a UI is entitled to say so rather than pretend something happened. */
export function presetIsSymmetric(name) {
  return pointsEqual(presetPoints(name), presetMirror(name));
}

/**
 * THE PRESET TAP — Josh's "tapping a preset again flips the saw's direction".
 *
 * Both forms are recomputed from the canonical table, so the toggle is exact
 * in both directions however many times it is tapped, and a curve the user has
 * since edited simply lands on the preset (the first tap replaces, the second
 * flips — which is the behaviour a shape button has everywhere).
 */
export function applyPreset(current, name) {
  const base = presetPoints(name);
  const mir = presetMirror(name);
  if (pointsEqual(current || [], base) && !pointsEqual(base, mir)) {
    return { points: mir, flipped: true, symmetric: false };
  }
  if (pointsEqual(current || [], mir) && !pointsEqual(base, mir)) {
    return { points: base, flipped: false, symmetric: false };
  }
  return { points: base, flipped: false, symmetric: pointsEqual(base, mir) };
}

/* ═════════════════════ the editor's engine doors ═══════════════════════════
 * WAVE-MOD2 builds the point-and-tension editor; these are the operations it
 * needs so that "add a point / drag it / bend the segment / delete it" is a
 * call into a tested engine rather than array surgery in a pointer handler.
 * All four return a NEW canonical list and never mutate their argument.
 */

/** Insert a point.  Returns { points, index } — index is where it landed. */
export function addPoint(pts, t, v, tension) {
  if (pts.length >= CURVE_MAX_POINTS) return { points: clonePoints(pts), index: -1, full: true };
  const next = clonePoints(pts);
  next.push({ t: clamp01(t), v: clamp01(v), tension: Number.isFinite(tension) ? clampT(tension) : 0 });
  const out = normalizePoints(next);
  let index = -1;
  for (let i = 0; i < out.length; i++) {
    if (out[i].t === clamp01(t) && out[i].v === clamp01(v)) { index = i; break; }
  }
  return { points: out, index, full: false };
}

/** Delete a point.  THE TWO ENDS ARE NOT DELETABLE — a curve with fewer than
    two points has no segment and no reading; the guard is here rather than in
    the UI so no caller can produce one. */
export function removePoint(pts, index) {
  if (pts.length <= 2) return { points: clonePoints(pts), removed: false };
  const i = index | 0;
  if (i < 0 || i >= pts.length) return { points: clonePoints(pts), removed: false };
  const next = clonePoints(pts);
  next.splice(i, 1);
  return { points: normalizePoints(next), removed: true };
}

/** Move a point.  The FIRST and LAST points keep their `t` (a cycle's ends are
    its ends); everything else is free, ordering included — normalizePoints
    re-sorts, so dragging a point past its neighbour reorders rather than
    tangles. */
export function movePoint(pts, index, t, v) {
  const i = index | 0;
  if (i < 0 || i >= pts.length) return clonePoints(pts);
  const next = clonePoints(pts);
  const locked = (i === 0 || i === pts.length - 1);
  if (!locked && Number.isFinite(t)) next[i].t = clamp01(t);
  if (Number.isFinite(v)) next[i].v = clamp01(v);
  return normalizePoints(next);
}

/** Bend the segment that starts at `index`.  The last point bends nothing. */
export function setTension(pts, index, tension) {
  const i = index | 0;
  const next = clonePoints(pts);
  if (i >= 0 && i < next.length - 1 && Number.isFinite(tension)) next[i].tension = clampT(tension);
  return normalizePoints(next);
}

/* ═════════════════════════ instruments (dump + gates) ══════════════════════ */

const hashF64 = new Float64Array(1);
const hashU32 = new Uint32Array(hashF64.buffer);
function fnvMix(h, u32) {
  h = (h ^ (u32 & 0xffff)) >>> 0; h = Math.imul(h, 16777619) >>> 0;
  h = (h ^ (u32 >>> 16)) >>> 0; return Math.imul(h, 16777619) >>> 0;
}

/** An FNV-1a over the exact bits of every t/v/tension — the dump's shape id,
    and how a gate says "this curve is the same curve" in one word. */
export function curveHash(pts) {
  let h = 2166136261 >>> 0;
  for (const p of pts) {
    for (const x of [p.t, p.v, p.tension]) {
      hashF64[0] = x;
      h = fnvMix(h, hashU32[0]);
      h = fnvMix(h, hashU32[1]);
    }
  }
  return h >>> 0;
}

/** What a curve IS, for the dump: how many points, how many bent, its extremes
    and whether it happens to be one of the presets (or a mirrored one). */
export function curveInfo(pts) {
  let bent = 0, lo = 1, hi = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i < pts.length - 1 && pts[i].tension !== 0) bent++;
    if (pts[i].v < lo) lo = pts[i].v;
    if (pts[i].v > hi) hi = pts[i].v;
  }
  /* EXACT MATCHES FIRST, MIRRORS SECOND — and that ordering is load-bearing:
     presetMirror('sawup') IS presetPoints('sawdown'), so a single interleaved
     pass would report the down-saw as "saw up, mirrored".  Two passes name a
     shape by the button that draws it. */
  let preset = null, mirrored = false;
  for (const name of PRESETS) if (pointsEqual(pts, presetPoints(name))) { preset = name; break; }
  if (!preset) {
    for (const name of PRESETS) {
      if (pointsEqual(pts, presetMirror(name))) { preset = name; mirrored = true; break; }
    }
  }
  return { points: pts.length, bent, lo, hi, preset, mirrored, hash: curveHash(pts) };
}
