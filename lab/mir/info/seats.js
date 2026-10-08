/* info/seats.js — THE SEAT CHOOSER under the force: which side of its anchor a label (or a comb of them) rests on.
 *
 * THE LAW IT KEEPS: A LINE NEVER CROSSES WORDS — its own label's, another label's, a block's (each grown by SEAT.pad)
 * — NOR ANOTHER LINE, WHEN A FREE SEAT EXISTS.  It crosses the subject only when no seat avoids it, and then by the
 * shortest way out (SEAT.inside per px, far below a crossing).  Plan §2.6: "this is
 * tried alone first … if labels end up overlapping in practice, a simple chooser of resting places is added
 * underneath.  One system before two."  They did (a label dropped or pushed between a comb's members crossed its
 * spine), so this is that chooser — and nothing more.  The layer offers a few seats per anchor (the four quadrants,
 * and for an anchor inside the subject or on a control four more straight above or below it); this scores each.
 * STICKY: a group keeps the seat it has while that seat is out of trouble (no crossing, and less than SEAT.trouble of
 * overlap, wall and line across the subject together), because a seat that changes sends a label flying across the picture while someone reads it; only
 * a seat in trouble is chosen again, and then the best one wins (the one it had still gets SEAT.keep off).  The force (info/bodies.js) still MOVES the bodies, and its
 * rest pass still keeps boxes apart; the chooser only decides where "home" is.  Pure: no DOM, node-tested.
 *
 *   THE SCORE (lower is better; px and px²)
 *     a crossing — one of its segments through another anchor's line, any label's words (its own too: cand.words)
 *     or a block, or another line through its label —
 *                                      SEAT.cross each   (the law: effectively never, when there is a choice)
 *     its labels over a block, another label, or the anchor itself (boxes grown by SEAT.gap)  SEAT.over × the area
 *     outside the stage's walls                                                                 SEAT.wall × the area
 *     pushed back inside the walls (cand.shove, px: the seat does not really exist)             SEAT.shove × the px
 *     its line inside the subject     SEAT.inside × the length (so an anchor inside the subject leaves by the nearest
 *                                     free side)
 *     not the natural seat            + SEAT.alt          the seat it has now   − SEAT.keep  (hysteresis: no flicker)
 *
 *   scoreSeat(cand, obs, opts) → number      cand { boxes, segs }, obs { boxes, segs }, opts { bounds, subject }
 *   troubleOf(cand, obs, opts) → number      the score without the preferences (natural, current)
 *   chooseSeat(cands, obs, opts) → index     each cand may carry `natural` and `current`
 *   segCrossesSeg, segHitsBox, clipLength, overlapArea — the geometry, exported for the proofs */

export const SEAT = Object.freeze({ cross: 1e5, gap: 6, pad: 3, over: 3, shove: 1000, wall: 6, inside: 90, alt: 800, keep: 2500, trouble: 6000 });

const EPS = 1e-6;
/** do two segments cross (touching at an end does not count) */
export function segCrossesSeg(a, b) {
  const d = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const A = { x: a.x1, y: a.y1 }, B = { x: a.x2, y: a.y2 }, C = { x: b.x1, y: b.y1 }, D = { x: b.x2, y: b.y2 };
  const d1 = d(C, D, A), d2 = d(C, D, B), d3 = d(A, B, C), d4 = d(A, B, D);
  return ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS));
}
/** the length of a segment inside a box (Liang–Barsky) */
export function clipLength(s, b) {
  let t0 = 0, t1 = 1; const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const edges = [[-dx, s.x1 - b.x], [dx, b.x + b.w - s.x1], [-dy, s.y1 - b.y], [dy, b.y + b.h - s.y1]];
  for (const [p, q] of edges) {
    if (Math.abs(p) < EPS) { if (q < 0) return 0; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return 0; if (t > t0) t0 = t; } else { if (t < t0) return 0; if (t < t1) t1 = t; }
  }
  return Math.max(0, t1 - t0) * Math.hypot(dx, dy);
}
/** does a segment pass through a box (more than a pixel of it) */
export const segHitsBox = (s, b) => clipLength(s, b) > 1;
const grow = (b, d) => ({ x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d });
/** the area two boxes share once both are grown by `gap` */
export function overlapArea(a, b, gap = 0) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + gap, h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + gap;
  return w > 0 && h > 0 ? w * h : 0;
}
const outside = (b, B) => {
  if (!B) return 0;
  const ix = Math.max(0, Math.min(b.x + b.w, B.right) - Math.max(b.x, B.left)), iy = Math.max(0, Math.min(b.y + b.h, B.bottom) - Math.max(b.y, B.top));
  return b.w * b.h - ix * iy;
};

/** troubleOf(cand, obs, { bounds, subject }) — what is WRONG with a seat: crossings, overlap, walls, a line across the
 *  subject */
export function troubleOf(cand, obs, { bounds = null, subject = null } = {}, P = SEAT) {
  let s = 0;
  for (const g of cand.segs) {
    if (subject) s += P.inside * clipLength(g, subject);
    for (const o of obs.segs) if (segCrossesSeg(g, o)) s += P.cross;
    for (const b of obs.boxes) if (b.solid !== false && segHitsBox(g, grow(b, P.pad))) s += P.cross;
    for (const w of cand.words || []) if (segHitsBox(g, w)) s += P.cross;      // through its own words
  }
  s += P.shove * (cand.shove || 0);                                  // a seat the walls had to push its label back into
  for (const b of cand.boxes) {
    for (const o of obs.segs) if (segHitsBox(o, grow(b, P.pad))) s += P.cross;
    for (const o of obs.boxes) s += P.over * overlapArea(b, o, P.gap);
    s += P.wall * outside(b, bounds);
  }
  return s;
}
/** scoreSeat(cand, obs, { bounds, subject }) — see THE SCORE above */
export function scoreSeat(cand, obs, opts = {}, P = SEAT) {
  let s = troubleOf(cand, obs, opts, P);
  if (!cand.natural) s += P.alt;
  if (cand.current) s -= P.keep;
  return s;
}

/** chooseSeat(cands, obs, opts) → the index of the seat to take: the current one while it is out of trouble, else the
 *  best (the first on a tie, so the natural seat goes first) */
export function chooseSeat(cands, obs, opts = {}, P = SEAT) {
  const cur = cands.findIndex((c) => c.current);
  if (cur >= 0 && troubleOf(cands[cur], obs, opts, P) < P.trouble) return cur;
  let best = 0, bs = Infinity;
  cands.forEach((c, i) => { const s = scoreSeat(c, obs, opts, P); if (s < bs - 1e-9) { bs = s; best = i; } });
  return best;
}
