/* info/leader.js — THE LINE GRAMMAR of INFORMATIONAL's pointer lines.  Pure: no DOM, node-tested.
 *
 * THE LAW IT KEEPS: A LEADER IS ONLY EVER FLAT (0°), 45° AND VERTICAL (90°), AT EVERY POSITION THE LABEL CAN BE IN —
 * at rest, mid-flight on its spring, and under the hand while it is dragged.  So the grammar is a construction, not a
 * search: from a start S to a label's attach point L with offsets dx, dy,
 *     |dx| ≥ |dy|  →  a 45° run of |dy| and a flat run of |dx| − |dy|
 *     |dx| <  |dy| →  a 45° run of |dx| and a vertical run of |dy| − |dx|
 * and the STYLE only says which of the two runs touches the thing:
 *     'diagonal-first'   thing → 45° → flat/vertical → text   (the flat part goes on to underline the title)
 *     'flat-first'       thing → flat/vertical → 45° → text   (Josh's sentence, read word for word)
 * The line starts ON THE THING'S EDGE (anchor centre + r along the first run), where the layer draws a small dot.
 * The text side follows the line: a label whose line arrives from the left is left-aligned at L; from the right,
 * right-aligned to L.  `comb` is several labels on one thing: one shared 45° run, a vertical spine, one flat branch
 * per label.
 *
 *   route(S, L, style)                  → [S, J, L] with empty runs dropped: the bare grammar
 *   leader(A, L, { style, r, under })   → { points, segs, start, end, side }   (A = { x, y, r? })
 *   comb(A, Ls, { r, under, side })     → { segs, start, joint, side }          (under: one length per label)
 *   toPath(segs)                        → an SVG path `d`, consecutive segments joined into one polyline
 *   angleOf(seg)                        → degrees in [0, 180), for the proofs
 */

export const STYLES = Object.freeze(['diagonal-first', 'flat-first']);
const sgn = (v) => (v < 0 ? -1 : 1);
const same = (a, b) => Math.abs(a.x - b.x) < 1e-7 && Math.abs(a.y - b.y) < 1e-7;
const seg = (a, b) => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
const dedupe = (pts) => pts.filter((p, i) => i === 0 || !same(p, pts[i - 1]));

/** route(S, L, style) — the two runs from S to L, as points */
export function route(S, L, style = 'diagonal-first') {
  const dx = L.x - S.x, dy = L.y - S.y, m = Math.min(Math.abs(dx), Math.abs(dy));
  const d = { x: sgn(dx) * m, y: sgn(dy) * m };                     // the 45° run, as a vector
  const J = style === 'flat-first' ? { x: L.x - d.x, y: L.y - d.y } : { x: S.x + d.x, y: S.y + d.y };
  return dedupe([{ x: S.x, y: S.y }, J, { x: L.x, y: L.y }]);
}

const unit = (a, b) => { const l = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }; };
const toSegs = (pts) => pts.slice(1).map((p, i) => seg(pts[i], p));

/** leader(A, L, { style, r, under, side }) — the line from the edge of the thing at A to the label's attach point L.
 *  under > 0 continues it flat past L by that much, on the label's side (the underline of the title). */
export function leader(A, L, { style = 'diagonal-first', r = A.r || 0, under = 0, side } = {}) {
  const s = side || sgn(L.x - A.x);
  let start = { x: A.x, y: A.y };
  if (r > 0 && Math.hypot(L.x - A.x, L.y - A.y) > r) {
    const first = route(A, L, style);                               // the direction the line leaves the thing in
    const u = unit(first[0], first[1]);
    start = { x: A.x + u.x * r, y: A.y + u.y * r };
  }
  const pts = route(start, L, style);
  if (under > 0) {
    const tip = { x: L.x + s * under, y: L.y }, n = pts.length;
    /* a flat last run in the same direction is extended, so the polyline never doubles back on itself */
    if (n >= 2 && Math.abs(pts[n - 1].y - pts[n - 2].y) < 1e-9 && sgn(pts[n - 1].x - pts[n - 2].x) === s) pts[n - 1] = tip;
    else pts.push(tip);
  }
  return { points: pts, segs: toSegs(pts), start: pts[0], end: pts[pts.length - 1], side: s };
}

/** comb(A, Ls, { r, under, side }) — several labels on one thing: one 45° run out of the edge to a joint J, a
 *  vertical spine through J covering every label's height, and one flat branch from the spine to each L. */
export function comb(A, Ls, { r = A.r || 0, under = [], side } = {}) {
  if (!Ls.length) return { segs: [], start: { x: A.x, y: A.y }, joint: { x: A.x, y: A.y }, side: 1 };
  const mean = (f) => Ls.reduce((s, L) => s + f(L), 0) / Ls.length;
  const sx = side || sgn(mean((L) => L.x - A.x)), sy = sgn(mean((L) => L.y - A.y) || -1);
  const e = r / Math.SQRT2;                                         // the edge, along the diagonal, per axis
  const reach = Math.min(...Ls.map((L) => sx * (L.x - A.x))) - 14;  // leave every branch at least a stub
  const rise = Math.min(...Ls.map((L) => Math.abs(L.y - A.y)));
  const d = Math.max(e + 6, Math.min(reach, rise));
  const S = { x: A.x + sx * e, y: A.y + sy * e }, J = { x: A.x + sx * d, y: A.y + sy * d };
  const segs = [seg(S, J)];
  const ys = Ls.map((L) => L.y), lo = Math.min(J.y, ...ys), hi = Math.max(J.y, ...ys);
  if (lo < J.y) segs.push(seg(J, { x: J.x, y: lo }));
  if (hi > J.y) segs.push(seg(J, { x: J.x, y: hi }));
  Ls.forEach((L, i) => {
    const b = { x: J.x, y: L.y }, u = under[i] || 0, pts = [b, { x: L.x, y: L.y }];
    if (u > 0) {                                                    // the underline: merged when it runs on the same way
      const tip = { x: L.x + sx * u, y: L.y };
      if (same(b, L) || sgn(L.x - b.x) === sx) pts[1] = tip; else pts.push(tip);
    }
    segs.push(...toSegs(dedupe(pts)));
  });
  return { segs, start: S, joint: J, side: sx };
}

const f2 = (v) => Math.round(v * 100) / 100;
/** toPath(segs) — one SVG path; a segment that starts where the last one ended continues the polyline */
export function toPath(segs) {
  let d = '', at = null;
  for (const s of segs) {
    if (!at || Math.abs(at.x - s.x1) > 1e-6 || Math.abs(at.y - s.y1) > 1e-6) d += `M${f2(s.x1)} ${f2(s.y1)}`;
    d += `L${f2(s.x2)} ${f2(s.y2)}`; at = { x: s.x2, y: s.y2 };
  }
  return d;
}

/** angleOf(seg) — the segment's direction in degrees, folded into [0, 180) */
export function angleOf(s) {
  const a = (Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180) / Math.PI;
  return ((a % 180) + 180) % 180;
}
