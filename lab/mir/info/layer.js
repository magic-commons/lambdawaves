/* info/layer.js — INFORMATIONAL's presenter: floating words on the picture, with no window.
 *
 * THE LAW IT KEEPS: THE WORDS SERVE THE PICTURE AND NEVER TAKE IT.  The layer is one element over the stage with
 * `pointer-events: none` (except labels while EDIT is on), so the app keeps every click; it moves only by
 * transform, writes only through core/perf, and books the one frame only while a body is moving or an entrance
 * is being laid out — idle is zero work.  Text is ink plus a soft halo: never a pane, never a box.
 *
 * And the laws of keeping out of the way (plan §2.4):
 *   AGAINST THE CURSOR     a block rests on the far side of the subject from the pointer.  It changes side only once
 *                          the pointer has crossed the subject's centre line by 8 % of the stage width AND stayed there
 *                          350 ms.
 *   REACHING IS NOT FLEEING  a pointer moving toward a block, or on it, never moves it, and lifts it to full strength.
 *   HOLD STILL             I held (or a long press on touch) freezes every body at full strength.  Space is the app's
 *                          one play.  With an app key table (`keys`), the key is a row in it (infoActions) and the
 *                          layer listens to no key of its own, so the menus and the help view list it.
 *   THE PIN                the first time a block moves away, a small pin shows on it once: this is intended.
 *   FOLLOWING              labels trail their anchors on the spring (viewChanged()), so lines stretch and settle.
 *   EDIT                   a label can be dragged; its neighbours yield through the same force step; the line stays
 *                          legal all the way (info/leader.js).
 *   THE ENTRANCE           the dot, then the line drawing outward from it, then the text arriving from the line's end
 *                          line by line; labels stagger outward from the subject; ~0.7 s for a screenful.  The exit
 *                          is the reverse, faster.  Reduced motion: a fade.  Motion off: nothing animates.
 *
 * LINES ARE ONE SVG.  One <path> per anchor (two: a halo stroke under the ink), so a frame writes one attribute per
 * line however many joints it has; `pathLength="1"` makes "the line draws outward from the dot" a single dash
 * offset whatever the line's length is mid-flight; and a stroke is crisp at any angle, which thin rotated divs are
 * not at 45°.
 *
 * COORDINATES: subject() and features() answer in the stage's own CSS pixels (0,0 = the stage's top-left).
 *
 * GONE: an anchor that resolves to null, or a feature or place off the stage, hides its labels and line (they take no
 * part in the force while hidden) and brings them back on their seats when it returns.  SEATS: which side of its
 * anchor a label rests on is chosen by info/seats.js, under the force.  CONTROLS: `ui:name` anchors follow an element
 * anywhere in the document; their lines are drawn on THE OVERLAY (below).
 *
 * createInfoLayer({ stage, host, subject, features, style, follow, lines, parallax, drift, pane, controls, keys, avoid })
 *   avoid: () → viewport rects a block must never rest under (the racks, the transport bar; createApp passes them)
 *   → { addLabel({ anchor, title, md, line, control }), addBlock({ md, hold, pane }), setStyle(s), setFollow(on),
 *       setLines(on), setEdit(on), setPane(on), setParallax(on), setDrift(on), freeze(on), hold(on), viewChanged(), replay(),
 *       clear(kind?), debug(), destroy(), root, stage }
 *   anchor: a feature id (looked up in features() every view change), 'ui:name' (a control), { x, y, r }, or
 *   () => { x, y, r } | null.  Each add returns { el, remove(), id }.  Pages: info/page.js. */
import { frame } from '../core/frame.js';
import { motionPolicy, motionToken } from '../core/motion.js';
import { drag } from '../core/pointer.js';
import { setVar, setAttr, rect } from '../core/perf.js';
import { leader, comb, toPath } from './leader.js';
import { createBody, createRunner, resolveRests, PHYS } from './bodies.js';
import { chooseSeat } from './seats.js';
import { renderNotebook } from '../shell/notebook-render.js';
import { loadRenderer } from '../shell/notebook.js';

/* THE NUMBERS — tuned by eye on gallery/info.html.  Times in ms, lengths in CSS px. */
export const INFO = Object.freeze({
  cross: 0.08, dwell: 350, reach: 140, near: 110, longPress: 480, touchGrace: 600,
  gap: 36, out: 46, rise: 34, pad: 6, comb: 14, margin: 14,
  enter: { dot: 140, lineAt: 60, line: 260, textAt: 200, perLine: 30, maxLines: 6, stagger: 55, maxStagger: 5, block: 340, blockLine: 45 },
  exit: { text: 120, lineAt: 70, line: 120, dot: 90, stagger: 25 },
  fade: 120, travel: 96,
  reseat: 1400,
  clear: 10,                                                        // px more between a line that arrives vertically and the words it passes                                                     // ms a label's seat holds after it changed (the seat chooser)
  block: { k: 34, zeta: 0.72 },
  /* PARALLAX against the cursor (px of travel at the stage's edge, per kind; eased over tau seconds) and DRIFT, a
     slow bob that never stops while it is on (Josh, 10-01: "everything moving and floaty") */
  par: { block: 38, label: 22, step: 4, tau: 0.28 },                // depths differ by ≤ 16 px: less than gap − bump, so rests stay reachable
  drift: { block: 5, label: 3.5 },
});
const SVG = 'http://www.w3.org/2000/svg';
const sgn = (v) => (v < 0 ? -1 : 1);
const px = (v) => Math.round(v * 100) / 100;

/** springEasing(k, c) — a damped spring (mass 1) as a CSS linear() easing, and the time it takes to settle.
 *  Draft 1 §1.6: stiffness 300, damping 22 → ζ ≈ 0.64, about 7 % overshoot. */
export function springEasing(k = 300, c = 22, n = 36) {
  let x = 0, v = 0; const dt = 1 / 1000, xs = [0]; let t = 0, still = 0;
  while (t < 2) { v += (k * (1 - x) - c * v) * dt; x += v * dt; t += dt; xs.push(x); if (Math.abs(1 - x) < 0.002 && Math.abs(v) < 0.02) { if (++still > 30) break; } else still = 0; }
  const pts = []; for (let i = 0; i <= n; i++) pts.push(+xs[Math.round((i / n) * (xs.length - 1))].toFixed(4));
  pts[pts.length - 1] = 1;
  return { easing: `linear(${pts.join(', ')})`, ms: Math.round(t * 1000) };
}
let SPRING = null;
const spring = () => {
  if (SPRING) return SPRING;
  const s = springEasing();
  const ok = globalThis.CSS && CSS.supports && CSS.supports('animation-timing-function', 'linear(0, 1)');
  return (SPRING = ok ? s : { easing: motionToken('out'), ms: 300 });
};

/** the hold-still key: neither BASINS nor λWAVES has one, and Space is the app's one play, so I (for INFORMATIONAL) */
export const HOLD_KEY = 'KeyI';
/** infoActions(get) — the key table's row for hold-still (shell/keys.js; an action with `up`): put it in the app's
 *  table and pass the table as `keys`, so the layer has no listener of its own.  get() → the layer (or null). */
export function infoActions(get, { keys = ['I'] } = {}) {
  return [{ id: 'info-hold', label: 'HOLD THE WORDS STILL', group: 'VIEW', keys, hint: 'hold: the words on the picture stay where they are',
    run: () => { const l = get(); if (l) l.hold(true); }, up: () => { const l = get(); if (l) l.hold(false); } }];
}

export function createInfoLayer({ stage, host = stage.parentElement, subject = null, features = null, style = 'auto', follow = true, lines = true, parallax = true, drift = false, pane = false, controls = null, keys = null, avoid = null } = {}) {
  const doc = stage.ownerDocument, win = doc.defaultView;
  const root = doc.createElement('div'); root.className = 'mir-info';
  root.dataset.style = style; root.dataset.lines = lines ? 'on' : 'off';
  const svg = doc.createElementNS(SVG, 'svg'); svg.classList.add('mir-info-lines'); svg.setAttribute('aria-hidden', 'true');
  root.appendChild(svg); host.appendChild(root);

  const items = [], groups = new Map();
  let W = 0, H = 0, stageBox = null, edit = false, frozen = false, held = false, uid = 0, destroyed = false;
  const S = { has: false, left: 0, top: 0, right: 0, bottom: 0, cx: 0, cy: 0, w: 0, h: 0 };
  const ptr = { on: false, x: 0, y: 0, vx: 0, vy: 0, t: 0, heat: 0, touch: false, onSubject: false };
  const life = new AbortController(), on = { signal: life.signal, passive: true };
  const ready = loadRenderer().catch(() => false);

  /* ── the bodies ─────────────────────────────────────────────────────────────────────────────────────────── */
  const bodies = () => items.filter((i) => i.measured && !(i.group && i.group.gone)).map((i) => i.body);
  const par = { x: 0, y: 0 };                                       // the pointer's place, −1…1 from the stage's middle, eased
  let envT = 0;
  const env = () => {
    const now = performance.now(), dt = envT ? Math.min(0.1, (now - envT) / 1000) : 1 / 60; envT = now;
    ptr.heat = ptr.on ? Math.exp(-(now - ptr.t) / (PHYS.tau * 1000)) : 0;
    /* PARALLAX: everything leans away from the cursor, the blocks more than the labels, eased so it never jerks */
    const on = parallax && follow && ptr.on && !ptr.touch && W > 0 && H > 0;
    const tx = on ? Math.max(-1, Math.min(1, (ptr.x - W / 2) / (W / 2))) : 0, ty = on ? Math.max(-1, Math.min(1, (ptr.y - H / 2) / (H / 2))) : 0;
    const ease = 1 - Math.exp(-dt / INFO.par.tau);
    par.x += (tx - par.x) * ease; par.y += (ty - par.y) * ease;
    if (Math.abs(tx - par.x) < 1e-3) par.x = tx; if (Math.abs(ty - par.y) < 1e-3) par.y = ty;   // arrive, so the rest is exact
    const t = now / 1000;
    for (const it of items) {
      const b = it.body;
      if (!it.el.hasAttribute('data-reach')) { it.px = -par.x * it.depth; it.py = -par.y * it.depth * 0.7; }   // reaching is not fleeing: it holds its lean
      const dx = drift ? Math.sin(t * it.f1 + it.ph) * it.amp : 0, dy = drift ? Math.cos(t * it.f2 + it.ph * 1.7) * it.amp * 0.8 : 0;
      b.ox = (it.px || 0) + dx; b.oy = (it.py || 0) + dy;
      /* a lean never asks for a place beyond the soft walls, or the body could not reach it and would never rest */
      const m = PHYS.margin, hiX = W - m - b.w, hiY = H - m - b.h;
      if (hiX > m) b.ox = Math.max(Math.min(m, b.rx), Math.min(b.rx + b.ox, Math.max(hiX, b.rx))) - b.rx;
      if (hiY > m) b.oy = Math.max(Math.min(m, b.ry), Math.min(b.ry + b.oy, Math.max(hiY, b.ry))) - b.ry;
      if (it.kind !== 'block' || !S.has) { b.lift = 0; continue; }  // a block crossing over the subject lifts off it
      const over = b.x < S.right && b.x + b.w > S.left && b.y < S.bottom && b.y + b.h > S.top;
      b.lift = over && Math.abs(b.vx) > 40 ? -sgn(S.cy - (b.y + b.h / 2)) * 700 : 0;
    }
    return { pointer: frozen ? null : ptr, bounds: { left: 0, top: 0, right: W, bottom: H } };
  };
  const runner = createRunner({ frame, bodies, env, paint: () => paint(), policy: motionPolicy, alive: () => drift && !frozen && !destroyed && !doc.hidden,
    key: 'info:bodies:' + Math.random().toString(36).slice(2) });
  const kick = () => { if (!frozen && !destroyed) runner.kick(); };

  /* ── geometry ───────────────────────────────────────────────────────────────────────────────────────────── */
  function readStage() {
    const s = rect(stage), h = rect(host);
    stageBox = s; W = s.width; H = s.height;
    setVar(root, 'left', px(s.left - h.left - host.clientLeft + host.scrollLeft) + 'px');
    setVar(root, 'top', px(s.top - h.top - host.clientTop + host.scrollTop) + 'px');
    setVar(root, 'width', px(W) + 'px'); setVar(root, 'height', px(H) + 'px');
    if (overG) setAttr(overG, 'transform', `translate(${px(s.left)} ${px(s.top)})`);   // the overlay draws in stage px too
  }
  function readSubject() {
    const r = subject && subject();
    if (r) {
      const left = r.left ?? r.x, top = r.top ?? r.y, w = r.width ?? r.w, h = r.height ?? r.h;
      Object.assign(S, { has: true, left, top, right: left + w, bottom: top + h, w, h, cx: left + w / 2, cy: top + h / 2 });
      return;
    }
    const as = [...groups.values()].filter((g) => !g.gone && !g.isControl).map((g) => g.A).filter(Boolean);   // no subject: the anchors stand in for it
    if (!as.length) { S.has = false; return; }
    const left = Math.min(...as.map((a) => a.x - a.r)), right = Math.max(...as.map((a) => a.x + a.r));
    const top = Math.min(...as.map((a) => a.y - a.r)), bottom = Math.max(...as.map((a) => a.y + a.r));
    Object.assign(S, { has: true, left, top, right, bottom, w: right - left, h: bottom - top, cx: (left + right) / 2, cy: (top + bottom) / 2 });
  }
  function resolveAnchor(spec, g) {
    let a = null;
    if (typeof spec === 'string' && spec.startsWith('ui:')) return controlAnchor(spec.slice(3), g && g.control);
    if (typeof spec === 'string') a = features ? (features() || []).find((f) => f.id === spec) : null;
    else if (typeof spec === 'function') a = spec();
    else a = spec;
    return a ? { x: a.x, y: a.y, r: a.r || 0 } : null;
  }
  /* A CONTROL ANCHOR — `ui:name`: the element with data-info~="name" (or id="name") anywhere in the document, or what
     the label's own `control` (a function name → element, or a node to search) answers.  Read live, in stage px. */
  function controlAnchor(name, own) {
    const el = findControl(name, own || controls);
    if (!el || !el.isConnected) return null;
    const r = rect(el); if (r.width < 1 && r.height < 1) return null;   // hidden (display: none, a folded window)
    const sb = stageBox || rect(stage), x = r.left - sb.left, y = r.top - sb.top;
    return { x: x + r.width / 2, y: y + r.height / 2, r: Math.min(r.width, r.height) / 2, box: { x, y, w: r.width, h: r.height }, control: true };
  }
  function findControl(name, how) {
    if (typeof how === 'function') return how(name) || null;
    const scope = how && how.querySelector ? how : doc, q = globalThis.CSS && CSS.escape ? CSS.escape(name) : name;
    for (const el of scope.querySelectorAll(`[data-info~="${q}"]`)) if (!root.contains(el)) return el;
    const byId = doc.getElementById(name);
    return byId && !root.contains(byId) && (scope === doc || scope.contains(byId)) ? byId : null;
  }

  /* where each body belongs: blocks at their seat, labels off their anchors (on the seat the chooser picks), then the
     rest pass.  An anchor that is gone (null, or a feature or place off the stage) hides its labels and line. */
  function computeRests() {
    for (const g of groups.values()) {
      const A = resolveAnchor(g.spec, g);
      const off = !A || (!A.control && (A.x < -A.r || A.x > W + A.r || A.y < -A.r || A.y > H + A.r));
      if (g.gone && !off) g.back = true;                            // it returns: it lands on its seat, it does not fly in
      g.gone = off; if (A) g.A = A;
    }
    readSubject();
    placeBlocks();
    const obs = { boxes: items.filter((i) => i.kind === 'block' && i.measured).map((i) => box(i.body)), segs: [] };
    for (const g of groups.values()) if (g.A && !g.gone) obs.boxes.push({ ...anchorBox(g.A), solid: false });
    if (S.has) obs.boxes.push({ x: S.left, y: S.top, w: S.w, h: S.h, solid: false });   // words never rest on the subject
    /* who chooses first: a label the hand placed (it does not move), then by how deep the anchor lies inside the
       subject's box, in coarse steps of 40 px so the order does not shuffle while the view moves: an anchor near an
       edge has one short way out, the one in the middle can leave by any edge, so it chooses last */
    const depth = (A) => (S.has ? Math.max(0, Math.min(A.x - S.left, S.right - A.x, A.y - S.top, S.bottom - A.y)) : 0);
    const order = [...groups.values()].filter((g) => g.A && !g.gone).map((g, i) => ({ g, k: (g.labels.some((l) => l.offset || l.body.held) ? 0 : 1000 + 100 * Math.min(9, Math.floor(depth(g.A) / 40))) + i }));
    order.sort((a, b) => a.k - b.k);                                 // stable: the order never shuffles while the view moves
    for (const { g } of order) {
      const ls = g.labels.filter((l) => l.measured); if (!ls.length) continue;
      seatGroup(g, g.A, ls, obs);
    }
    const list = bodies();
    resolveRests(list, new Set(items.filter((i) => i.kind === 'block').map((i) => i.body.id)));
    for (const b of list) {                                          // and inside the stage
      if (b.held) continue;
      b.rx = Math.max(INFO.margin, Math.min(b.rx, W - INFO.margin - b.w));
      b.ry = Math.max(INFO.margin, Math.min(b.ry, H - INFO.margin - b.h));
    }
    for (const g of groups.values()) if (g.back && !g.gone) {
      g.back = false;
      for (const l of g.labels) { const b = l.body; b.x = b.rx + b.ox; b.y = b.ry + b.oy; b.vx = b.vy = 0; }
    }
  }
  const box = (b) => ({ x: b.rx, y: b.ry, w: b.w, h: b.h });
  const anchorBox = (A) => A.box || { x: A.x - A.r, y: A.y - A.r, w: 2 * A.r, h: 2 * A.r };
  /** the seats an anchor's labels may take, and the one the chooser keeps.  Each seat: mode 'h' (beside: the 45° run
   *  then flat) or 'v' (above or below: the 45° run then vertical), and the quadrant (sx, sy). */
  function seatGroup(g, A, ls, obs) {
    /* the natural side: away from the subject's middle, with a little hysteresis so a label on the centre line does
       not flip; a control's labels face the stage's middle */
    if (g.isControl) { g.sx = A.x > W / 2 ? -1 : 1; g.sy = A.y > H / 2 ? -1 : 1; }
    else {
      const hx = S.has ? 0.12 * S.w / 2 : 0, hy = S.has ? 0.12 * S.h / 2 : 0;
      if (!g.sx || (S.has && Math.abs(A.x - S.cx) > hx)) g.sx = !S.has ? 1 : A.x >= S.cx ? 1 : -1;
      if (!g.sy || (S.has && Math.abs(A.y - S.cy) > hy)) g.sy = !S.has ? -1 : A.y <= S.cy ? -1 : 1;
    }
    const inside = S.has && A.x > S.left && A.x < S.right && A.y > S.top && A.y < S.bottom;
    const quad = (m) => [[m, g.sx, g.sy], [m, g.sx, -g.sy], [m, -g.sx, g.sy], [m, -g.sx, -g.sy]];
    /* a control's seats are straight off it, above or below (toward the stage's middle first): a seat beside it would
       sit on the bar or window the control lives in, which the layer cannot see */
    const seats = g.isControl ? quad('v') : inside ? [...quad('h'), ...quad('v')] : quad('h');
    const free = ls.some((l) => !l.offset && !l.body.held);
    const now = performance.now(), cur = seats.findIndex((seat) => seat.join() === g.seat);
    let pick = 0;
    if (cur >= 0 && now - g.seatAt < INFO.reseat) pick = cur;      // a seat that just changed waits for its label to land
    else if (free && seats.length > 1) {
      const cands = seats.map((seat, i) => {
        const at = layoutSeat(g, A, ls, seat);
        return { boxes: ls.map((l, k) => ({ x: at[k].rx, y: at[k].ry, w: l.w, h: l.h })), segs: segsOf(g, A, ls, at), natural: i === 0, current: seat.join() === g.seat, shove: at.shove || 0,
          words: ls.flatMap((l, k) => wordsOf(l, at[k].rx, at[k].ry, at[k].rx + l.w / 2 >= A.x ? 1 : -1)) };
      });
      pick = chooseSeat(cands, obs, { bounds: { left: INFO.margin, top: INFO.margin, right: W - INFO.margin, bottom: H - INFO.margin }, subject: S.has ? { x: S.left, y: S.top, w: S.w, h: S.h } : null });
    }
    if (seats[pick].join() !== g.seat) { g.seat = seats[pick].join(); g.seatAt = now; }
    const at = layoutSeat(g, A, ls, seats[pick]);
    obs.boxes.push(...ls.map((l, k) => ({ x: at[k].rx, y: at[k].ry, w: l.w, h: l.h }))); obs.segs.push(...segsOf(g, A, ls, at));
    ls.forEach((l, k) => { if (!l.body.held) { l.body.rx = at[k].rx; l.body.ry = at[k].ry; } });
  }
  /** the rest boxes of a group's labels on one seat (a label the hand dropped keeps its place) */
  function layoutSeat(g, A, ls, [mode, sx, sy]) {
    const out = [];
    let Lx, Ly;
    if (mode === 'h') {
      const escape = S.has && !g.isControl ? Math.max(0, sx > 0 ? S.right - A.x : A.x - S.left) : 0;
      Lx = A.x + sx * (escape + INFO.out + A.r); Ly = A.y + sy * (INFO.rise + Math.min(40, 0.2 * escape));
    } else {                                                         // straight out of the nearest free edge, then up or down
      const edge = g.isControl || !S.has ? A.r : Math.max(A.r, sy < 0 ? A.y - S.top : S.bottom - A.y);
      Lx = A.x + sx * (INFO.out / 2 + A.r); Ly = A.y + sy * (edge + INFO.rise * (g.isControl ? 2 : 1));
      if (g.isControl && sy < 0) Ly -= ls[0].h - ls[0].titleH;      // the whole label clears the control, not only its title
    }
    let prev = null;
    for (const l of ls) {
      if (l.offset) { out.push(seatOf(l, A.x + l.offset.dx, A.y + l.offset.dy, sgn(l.offset.dx))); continue; }
      if (prev) Ly = sy < 0 ? Ly - prev.titleH - (l.h - l.titleH) - INFO.comb : Ly + (prev.h - prev.titleH) + l.titleH + INFO.comb;
      out.push(seatOf(l, Lx, Ly, sx)); prev = l;
    }
    /* inside the walls, as the rest will be: a seat is judged where its label will really sit (a label pushed back
       across its own anchor by a wall is a seat whose line runs through its own words) */
    for (const [k, l] of ls.entries()) {
      if (l.body.held) continue;
      const x = Math.max(INFO.margin, Math.min(out[k].rx, W - INFO.margin - l.w)), y = Math.max(INFO.margin, Math.min(out[k].ry, H - INFO.margin - l.h));
      out.shove = (out.shove || 0) + Math.abs(x - out[k].rx) + Math.abs(y - out[k].ry);
      out[k].rx = x; out[k].ry = y;
    }
    return out;
  }
  const seatOf = (l, Lx, Ly, side) => ({ rx: side > 0 ? Lx + INFO.pad : Lx - INFO.pad - l.w, ry: Ly - l.titleH });
  /** where a label's line ends: beside its title on the side facing the anchor (the text grows away from the line).
   *  A line that arrives vertically runs past the label's body, so it keeps INFO.clear more room, eased in so the
   *  line never jumps mid-flight. */
  function edgeOf(A, rx, ry, l, side) {
    const x0 = side > 0 ? rx : rx + l.w, y = ry + l.titleH;
    const t = Math.max(0, Math.min(1, (Math.abs(y - A.y) - Math.abs(x0 - A.x)) / 20));
    const gap = INFO.pad + INFO.clear * t;
    return { x: x0 - side * gap, y, side, gap };
  }
  /** the rects of a label's words, for the law "a line never crosses words": the title (to just above the shelf that
   *  underlines it) and the body below it */
  function wordsOf(l, rx, ry, side) {
    const out = [{ x: side > 0 ? rx : rx + l.w - l.titleW, y: ry, w: l.titleW, h: Math.max(0, l.titleH - 2) }];
    if (l.h - l.titleH > 4) out.push({ x: rx, y: ry + l.titleH + 2, w: l.w, h: l.h - l.titleH - 2 });
    return out;
  }
  /** the line a seat would draw (the same grammar paint() draws) */
  function segsOf(g, A, ls, at) {
    const pts = ls.map((l, k) => edgeOf(A, at[k].rx, at[k].ry, l, at[k].rx + l.w / 2 >= A.x ? 1 : -1));
    const styles = ls.map((l) => lineOf(l, g)), under = ls.map((l, i) => (styles[i] === 'flat-first' ? 0 : pts[i].gap + l.titleW));
    return ls.length === 1 ? leader(A, pts[0], { style: styles[0], under: under[0], side: pts[0].side }).segs : comb(A, pts, { under }).segs;
  }
  /* the blocks of a page (a `---` separates them) stand in one column per seat, in reading order */
  function placeBlocks() {
    const list = items.filter((i) => i.kind === 'block' && i.measured), cols = new Map(), G = INFO.gap / 2;
    for (const it of list) { placeBlock(it); const k = it.seat; if (!cols.has(k)) cols.set(k, []); cols.get(k).push(it); }
    for (const [k, col] of cols) {
      if (col.length < 2 || col.some((i) => i.body.held)) continue;
      const total = col.reduce((t, i) => t + i.h, 0) + G * (col.length - 1);
      const F = free();
      let y = k[0] === 'x' || k === 'o' ? S.cy - total / 2 : k === 'y-1' ? col[0].body.ry + col[0].h - total : col[0].body.ry;
      y = Math.max(F.T, Math.min(y, F.B - total));
      for (const it of col) { it.body.ry = y; y += it.h + G; }
    }
  }
  /* THE FREE STAGE (alpha.6): the stage minus what `avoid()` names (viewport rects: the racks, the transport bar), in
     stage px.  A rect at the window's left or right edge is a rack and narrows it; any other rect (a bar) takes the
     top or the bottom off it, whichever half it is in.  Blocks rest only in here. */
  function free() {
    const sb = stageBox || rect(stage), vw = win.innerWidth, m = INFO.margin;
    let L = m, T = m, R = W - m, B = H - m;
    for (const r of (avoid && avoid()) || []) {
      const x0 = r.left - sb.left, x1 = r.right - sb.left, y0 = r.top - sb.top, y1 = r.bottom - sb.top;
      if (x1 <= 0 || x0 >= W || y1 <= 0 || y0 >= H) continue;          // not over the stage
      if (r.left <= 24) L = Math.max(L, x1 + m); else if (r.right >= vw - 24) R = Math.min(R, x0 - m);
      else if ((y0 + y1) / 2 > H / 2) B = Math.min(B, y0 - m); else T = Math.max(T, y1 + m);
    }
    if (R - L < 120) { L = m; R = W - m; }                              // racks over everything: the whole width
    return { L, T, R, B };
  }
  function placeBlock(it) {
    const b = it.body, F = free();
    const inX = (x) => Math.max(F.L, Math.min(x, F.R - it.w)), inY = (y) => Math.max(F.T, Math.min(y, F.B - it.h));
    setAttr(it.el, 'data-over', null);
    if (!S.has) { b.rx = inX((F.L + F.R - it.w) / 2); b.ry = inY(F.T + (F.B - F.T) * 0.12); it.seat = 'y1'; return; }
    /* beside the subject when a side of the free stage has room for it, else above or below it (a phone, a tall
       picture), else OVER the subject, dimmed (data-over): never outside the stage, never under the bar */
    const room = (s) => (s > 0 ? F.R - S.right : S.left - F.L) - INFO.gap >= it.w;
    const fits = (s) => (s > 0 ? F.B - S.bottom : S.top - F.T) - INFO.gap >= it.h;
    it.axis = room(1) || room(-1) ? 'x' : 'y';
    if (it.axis === 'x') {
      const side = room(it.side) ? it.side : -it.side;
      b.rx = side > 0 ? S.right + INFO.gap : S.left - INFO.gap - it.w;
      b.ry = inY(S.cy - it.h / 2); it.seat = 'x' + side;
    } else if (fits(1) || fits(-1)) {
      const side = fits(it.side) ? it.side : -it.side;
      b.rx = inX(S.cx - it.w / 2);
      b.ry = side > 0 ? S.bottom + INFO.gap : S.top - INFO.gap - it.h; it.seat = 'y' + side;
    } else {
      b.rx = inX(S.cx - it.w / 2); b.ry = inY(S.cy - it.h / 2); it.seat = 'o';
      setAttr(it.el, 'data-over', '');
    }
  }
  /** a label's attach point and side from where its body is NOW (mid-flight too) */
  function attach(l, A) {
    const b = l.body, cx = b.x + l.w / 2;
    if (!l.side || Math.abs(cx - A.x) > 0.15 * l.w) l.side = cx >= A.x ? 1 : -1;
    return edgeOf(A, b.x, b.y, l, l.side);
  }

  /* ── painting: transforms, attributes, one path per anchor ─────────────────────────────────────────────── */
  function paint() {
    for (const it of items) {
      if (!it.measured) continue;
      const b = it.body;
      setVar(it.el, 'translate', `${px(b.x)}px ${px(b.y)}px`);
      if (it.kind === 'block') setAttr(it.el, 'data-travel', Math.hypot(b.x - b.rx - b.ox, b.y - b.ry - b.oy) > INFO.travel ? '' : null);
    }
    const show = root.dataset.lines === 'on';
    for (const g of groups.values()) {
      setAttr(g.g, 'data-gone', g.gone ? '' : null);
      for (const l of g.labels) setAttr(l.el, 'data-gone', g.gone ? '' : null);
      const ls = g.labels.filter((l) => l.measured);
      if (!g.A || !ls.length || g.gone) continue;
      const pts = ls.map((l) => attach(l, g.A));
      for (const [i, l] of ls.entries()) setAttr(l.el, 'data-side', pts[i].side > 0 ? 'right' : 'left');
      if (!show) continue;
      const styles = ls.map((l) => lineOf(l, g));
      for (const [i, l] of ls.entries()) setAttr(l.el, 'data-line', styles[i]);
      const under = ls.map((l, i) => (styles[i] === 'flat-first' ? 0 : pts[i].gap + l.titleW));
      let segs, start;
      if (ls.length === 1) ({ segs, start } = leader(g.A, pts[0], { style: styles[0], under: under[0], side: pts[0].side }));
      else ({ segs, start } = comb(g.A, pts, { under }));
      const d = toPath(segs);
      setAttr(g.halo, 'd', d); setAttr(g.ink, 'd', d);
      setAttr(g.dot, 'cx', px(start.x)); setAttr(g.dot, 'cy', px(start.y));
    }
  }
  /* THE TWO LINES ARE FOR TWO JOBS (Josh, 10-01: "could be for different purposes, be sure to use them both"):
       diagonal-first  NAMING a feature the app knows: thing → 45° → a flat shelf that underlines the name
       flat-first      a NOTE: at a place, on a control, or with no title: thing → flat → 45° → the text
     A label may say which it wants (`line`); the layer's style may force one for all; otherwise the job decides. */
  function lineOf(l, g) {
    if (l.line === 'diagonal-first' || l.line === 'flat-first') return l.line;
    const all = root.dataset.style;
    if (all === 'diagonal-first' || all === 'flat-first') return all;
    const named = typeof g.spec === 'string' && !g.spec.startsWith('ui:');
    return l.title && named ? 'diagonal-first' : 'flat-first';
  }
  const schedule = () => frame.write(() => { if (!destroyed) paint(); });

  /* ── content ────────────────────────────────────────────────────────────────────────────────────────────── */
  const render = (md) => (win.marked ? renderNotebook(md) : String(md).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])));
  const unwrapP = (html) => html.replace(/^\s*<p>([\s\S]*)<\/p>\s*$/, '$1');
  function make(kind, o) {
    const id = o.id || `${kind}-${++uid}`;
    const el = doc.createElement('div'); el.className = 'mir-info-' + kind; el.dataset.state = 'wait'; el.dataset.id = id;
    const text = doc.createElement('div'); text.className = 'mir-info-text'; el.appendChild(text);
    const pin = doc.createElement('i'); pin.className = 'mir-info-pin'; pin.setAttribute('aria-hidden', 'true'); el.appendChild(pin);
    root.appendChild(el);
    const it = { kind, id, el, text, pin, body: createBody({ id, x: 0, y: 0, w: 0, h: 0 }), measured: false, w: 0, h: 0, titleH: 0, titleW: 0,
      side: 0, offset: null, title: o.title || '', md: o.md || '', pinned: false, holdUntil: 0, anims: [] };
    if (kind === 'block') {
      it.body.k = INFO.block.k; it.body.zeta = INFO.block.zeta; it.side = 1; it.holdUntil = performance.now() + (o.hold || 0);
      it.pane = typeof o.pane === 'boolean' ? o.pane : null;          // null: the layer's default (setPane)
      if (it.pane ?? paneAll) el.setAttribute('data-pane', '');
    }
    /* how far it leans from the cursor, and its own slow bob: each item a little different, so they read as layers */
    const n = items.length;
    it.depth = kind === 'block' ? INFO.par.block : INFO.par.label + INFO.par.step * (n % 3);
    it.amp = kind === 'block' ? INFO.drift.block : INFO.drift.label;
    it.ph = n * 2.399963; it.f1 = 0.55 + 0.13 * (n % 3); it.f2 = 0.43 + 0.11 * (n % 4); it.px = 0; it.py = 0;
    items.push(it);
    ready.then(() => {
      if (destroyed || !it.el.isConnected) return;
      let html = '';
      if (it.title) html += `<div class="mir-info-title"><span>${unwrapP(render(it.title))}</span></div>`;
      if (it.md) html += render(it.md);
      text.innerHTML = html;
      queueMeasure(it, true);
    });
    return it;
  }

  /* measuring: one read batch for every item that changed, then rests, then one write + the entrance */
  const toMeasure = new Set(), toEnter = new Set(); let measuring = false;
  function queueMeasure(it, entering) {
    toMeasure.add(it); if (entering) toEnter.add(it);
    if (measuring) return; measuring = true;
    frame.read(() => {
      measuring = false; if (destroyed) return;
      readStage();
      for (const it of toMeasure) measure(it);
      toMeasure.clear();
      computeRests();
      const fresh = [...toEnter]; toEnter.clear();
      for (const it of fresh) { it.body.x = it.body.rx; it.body.y = it.body.ry; it.body.vx = it.body.vy = 0; }
      frame.write(() => {
        if (destroyed) return;
        paint();
        if (fresh.length) enter(fresh);
        kick();
      });
    });
  }
  function measure(it) {
    if (!it.el.isConnected) return;
    const box = rect(it.el);
    it.w = box.width; it.h = box.height; it.body.w = it.w; it.body.h = it.h;
    const t = it.text.querySelector('.mir-info-title > span');
    if (t) { const r = rect(t); it.titleH = r.bottom - box.top + 1; it.titleW = r.width; }
    else {
      const first = it.text.firstElementChild, range = doc.createRange();
      if (first) { range.selectNodeContents(first); const rs = [...range.getClientRects()]; const top = rs.length ? rs[0].top : box.top;
        const line = rs.filter((r) => r.top < top + 4); it.titleH = (line.length ? Math.max(...line.map((r) => r.bottom)) : box.top + 18) - box.top + 1;
        it.titleW = line.length ? Math.max(...line.map((r) => r.right)) - Math.min(...line.map((r) => r.left)) : it.w; }
    }
    it.titleW = Math.min(it.titleW, it.w);
    it.measured = true;
  }

  /* ── groups (one per anchor: the dot and the line) ──────────────────────────────────────────────────────── */
  const keyOf = (spec) => (typeof spec === 'string' ? 'f:' + spec : spec);
  function groupFor(spec, control) {
    const key = keyOf(spec);
    if (groups.has(key)) return groups.get(key);
    const isControl = typeof spec === 'string' && spec.startsWith('ui:');
    const g = doc.createElementNS(SVG, 'g'); g.classList.add('mir-info-leader');
    const mk = (tag, cls) => { const e = doc.createElementNS(SVG, tag); e.classList.add(cls); g.appendChild(e); return e; };
    const halo = mk('path', 'mir-info-halo'), ink = mk('path', 'mir-info-ink'), dot = mk('circle', 'mir-info-dot');
    halo.setAttribute('pathLength', '1'); ink.setAttribute('pathLength', '1'); dot.setAttribute('r', '3');
    (isControl ? overlay() : svg).appendChild(g);
    const grp = { key, spec, g, halo, ink, dot, labels: [], A: null, sx: 0, sy: 0, isControl, control: control || null, gone: false, seat: '', seatAt: 0 };
    grp.A = resolveAnchor(spec, grp);
    groups.set(key, grp);
    if (isControl) watchControls();
    return grp;
  }

  /* ── THE OVERLAY: a control's line ─────────────────────────────────────────────────────────────────────────────
     A control usually sits outside the stage, in a window or the rack, which paint over the stage.  So a control's
     line (and its dot) is drawn on a second, document-wide root: `position: fixed`, full window, above the chrome,
     `pointer-events: none`.  Its SVG is translated by the stage's offset, so every path stays in stage px and the
     grammar is the same one.  The label itself stays on the stage (it is a word on the picture), inside the walls.
     A control is read again on every viewChanged(), on any style or class change outside the layer (a window dragged,
     folded, the rack scrolled), at the end of a transition or an animation, and on scroll: no poller. */
  let over = null, overG = null, watching = null;
  function overlay() {
    if (overG) return overG;
    over = doc.createElement('div'); over.className = 'mir-info mir-info-over'; over.dataset.lines = root.dataset.lines;
    const s2 = doc.createElementNS(SVG, 'svg'); s2.classList.add('mir-info-lines'); s2.setAttribute('aria-hidden', 'true');
    overG = doc.createElementNS(SVG, 'g'); s2.appendChild(overG); over.appendChild(s2); doc.body.appendChild(over);
    stageBox = stageBox || rect(stage); overG.setAttribute('transform', `translate(${px(stageBox.left)} ${px(stageBox.top)})`);
    return overG;
  }
  const mine = (n) => root.contains(n) || (over && over.contains(n));
  function watchControls() {
    if (watching || !win.MutationObserver) return;
    watching = new AbortController();
    const again = () => { if ([...groups.values()].some((g) => g.isControl)) { stageBox = null; api.viewChanged(); } };
    const mo = new win.MutationObserver((recs) => { if (recs.some((r) => !mine(r.target))) again(); });
    mo.observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden', 'open'] });
    watching.signal.addEventListener('abort', () => mo.disconnect());
    const o = { signal: watching.signal, capture: true, passive: true };
    for (const t of ['transitionend', 'animationend']) doc.addEventListener(t, (e) => { if (!mine(e.target)) again(); }, o);
    win.addEventListener('scroll', again, o);
  }
  function unwatchControls() {
    if (!watching || [...groups.values()].some((g) => g.isControl)) return;
    watching.abort(); watching = null;
  }

  /* ── the entrance and the exit ──────────────────────────────────────────────────────────────────────────── */
  const anim = (el, kf, o, owner) => { const a = el.animate(kf, o); if (owner) owner.anims.push(a); return a; };
  const stopAnims = (it) => { for (const a of it.anims) a.cancel(); it.anims = []; };
  const rows = (it) => [...it.text.children].slice(0, INFO.enter.maxLines);
  function enter(list) {
    const policy = motionPolicy();
    for (const it of list) { setAttr(it.el, 'data-state', 'in'); if (it.group) setAttr(it.group.g, 'data-state', 'in'); }
    if (policy === 'off' || typeof root.animate !== 'function') return;
    if (policy === 'reduced') {
      for (const it of list) {
        stopAnims(it);
        anim(it.el, [{ opacity: 0 }, { opacity: 1 }], { duration: INFO.fade, easing: 'linear' }, it);
        if (it.group && it.group.labels[0] === it) anim(it.group.g, [{ opacity: 0 }, { opacity: 1 }], { duration: INFO.fade, easing: 'linear' }, it);
      }
      return;
    }
    const E = INFO.enter, sp = spring(), out = motionToken('out');
    const d0 = (it) => (it.group && it.group.A ? Math.hypot(it.group.A.x - S.cx, it.group.A.y - S.cy) : -1);
    const order = [...list].sort((a, b) => d0(a) - d0(b));          // blocks first, then labels outward from the subject
    let k = 0;
    for (const it of order) {
      stopAnims(it);
      if (it.kind === 'block') {
        rows(it).forEach((ln, i) => anim(ln, [{ opacity: 0, transform: 'translateY(10px) scale(.985)' }, { opacity: 1, transform: 'none' }],
          { duration: E.block, delay: i * E.blockLine, easing: sp.easing, fill: 'backwards' }, it));
        continue;
      }
      const t0 = Math.min(k++, E.maxStagger - 1) * E.stagger, g = it.group, lead = g.labels.find((l) => l.measured) === it;
      if (lead) {
        anim(g.dot, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: E.dot, delay: t0, easing: sp.easing, fill: 'backwards' }, it);
        for (const p of [g.halo, g.ink]) anim(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: E.line, delay: t0 + E.lineAt, easing: out, fill: 'backwards' }, it);
      }
      const from = `translateX(${-12 * (it.side || 1)}px) scale(.94)`;
      rows(it).forEach((ln, i) => anim(ln, [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }],
        { duration: sp.ms, delay: t0 + E.textAt + i * E.perLine, easing: sp.easing, fill: 'backwards' }, it));
    }
  }
  /** exit(list) → a promise that resolves when every exit has landed */
  function exit(list) {
    const policy = motionPolicy(), jobs = [];
    if (policy === 'off' || typeof root.animate !== 'function') return Promise.resolve();
    const X = INFO.exit, inn = motionToken('in'), going = new Set(list);
    [...list].reverse().forEach((it, n) => {
      stopAnims(it);
      const t0 = n * X.stagger, o = { fill: 'forwards' };
      if (policy === 'reduced') {
        jobs.push(anim(it.el, [{ opacity: 1 }, { opacity: 0 }], { duration: INFO.fade, ...o }, it).finished);
        if (it.group && it.group.labels.length === 1) jobs.push(anim(it.group.g, [{ opacity: 1 }, { opacity: 0 }], { duration: INFO.fade, ...o }, it).finished);
        return;
      }
      for (const ln of rows(it)) jobs.push(anim(ln, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-8 * (it.side || 1)}px) scale(.97)` }], { duration: X.text, delay: t0, easing: inn, ...o }, it).finished);
      const g = it.group;
      if (g && g.labels[0] === it && g.labels.every((l) => going.has(l) || l.leaving)) {   // the line goes with its last label
        for (const p of [g.halo, g.ink]) jobs.push(anim(p, [{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }], { duration: X.line, delay: t0 + X.lineAt, easing: inn, ...o }, it).finished);
        jobs.push(anim(g.dot, [{ transform: 'scale(1)' }, { transform: 'scale(0)' }], { duration: X.dot, delay: t0 + X.lineAt + X.line, easing: inn, ...o }, it).finished);
      }
    });
    return Promise.all(jobs.map((p) => p.catch(() => {})));
  }

  /* ── the pointer: against the cursor, reaching is not fleeing, hold still ──────────────────────────────── */
  let dwellTimer = 0, pressTimer = 0, touchTimer = 0, pressAt = null;
  const local = (e) => { if (!stageBox) stageBox = rect(stage); return { x: e.clientX - stageBox.left, y: e.clientY - stageBox.top }; };
  const inside = (p, b, m = 0) => p.x >= b.x - m && p.x <= b.x + b.w + m && p.y >= b.y - m && p.y <= b.y + b.h + m;
  /** is the pointer reaching for this body?  'on' it, 'near' it (a reader who stopped short), 'heading' at it
   *  (within 60°, the speed fading 140 ms after the last move), or not (null) */
  function reaching(it) {
    const b = it.body;
    if (inside(ptr, b, 16)) return 'on';
    if (inside(ptr, b, INFO.near)) return 'near';
    const fade = Math.exp(-(performance.now() - ptr.t) / INFO.reach);   // a pointer that stopped is no longer heading anywhere
    const vx = ptr.vx * fade, vy = ptr.vy * fade, sp = Math.hypot(vx, vy); if (sp < 40) return null;
    const cx = b.x + b.w / 2 - ptr.x, cy = b.y + b.h / 2 - ptr.y, l = Math.hypot(cx, cy) || 1;
    return (vx * cx + vy * cy) / (sp * l) > 0.5 ? 'heading' : null;
  }
  const later = (ms) => { if (!dwellTimer) dwellTimer = win.setTimeout(judge, Math.max(16, ms)); };
  function judge() {
    dwellTimer = 0;
    if (!follow || frozen || !S.has || !ptr.on) return;
    const now = performance.now();
    let moved = false;
    for (const it of items) {
      if (it.kind !== 'block' || !it.measured) continue;
      const r = reaching(it);
      setAttr(it.el, 'data-reach', r ? '' : null);
      const y = it.axis === 'y', at = y ? ptr.y : ptr.x, mid = y ? S.cy : S.cx;   // side +1 = right (or below), −1 = left (or above)
      const want = at < mid ? 1 : -1, far = Math.abs(at - mid) > INFO.cross * (y ? H : W);
      if (want === it.side || !far) { it.since = 0; continue; }
      if (r) {                                                         // reaching is not fleeing
        it.since = 0;
        if (r === 'heading') later(INFO.reach * Math.log(Math.max(1.01, Math.hypot(ptr.vx, ptr.vy) / 40)) + 10);   // look again once the reach has faded
        continue;
      }
      if (!it.since) it.since = now;
      if (now - it.since >= INFO.dwell && now >= it.holdUntil) {
        it.side = want; it.since = 0; moved = true;
        if (!it.pinned) { it.pinned = true; setAttr(it.pin, 'data-show', ''); }
      } else later(Math.max(INFO.dwell - (now - it.since) + 5, it.holdUntil - now));
    }
    if (moved) { computeRests(); kick(); }
  }
  function onMove(e) {
    if (destroyed) return;
    if (e.pointerType === 'touch' && !ptr.touch) return;             // a finger counts only while it is down
    const p = local(e), now = performance.now(), dt = Math.max(1, now - ptr.t);
    const a = Math.min(1, dt / 120);                                   // ~120 ms of velocity memory
    if (ptr.on) { ptr.vx += (((p.x - ptr.x) / dt) * 1000 - ptr.vx) * a; ptr.vy += (((p.y - ptr.y) / dt) * 1000 - ptr.vy) * a; }
    else { ptr.vx = 0; ptr.vy = 0; }
    ptr.x = p.x; ptr.y = p.y; ptr.t = now; ptr.on = true;
    if (pressAt && Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) > 8) { win.clearTimeout(pressTimer); pressAt = null; }
    const over = S.has && p.x > S.left && p.x < S.right && p.y > S.top && p.y < S.bottom;
    if (over !== ptr.onSubject) { ptr.onSubject = over; setAttr(root, 'data-pointer', over ? 'subject' : null); }
    judge();
    /* with parallax every move over the stage leans the layer; without it only a pointer near a body disturbs it */
    const overStage = p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H;
    if (!frozen && ((parallax && follow && overStage) || items.some((it) => it.measured && inside(p, it.body, PHYS.reach)))) kick();
  }
  function onLeave() { ptr.on = false; ptr.onSubject = false; setAttr(root, 'data-pointer', null); for (const it of items) { it.since = 0; setAttr(it.el, 'data-reach', null); } kick(); }
  function hold(on) { held = on; applyFreeze(); }
  win.addEventListener('pointermove', onMove, on);
  win.addEventListener('pointerout', (e) => { if (!e.relatedTarget) onLeave(); }, on);   // out of the window
  win.addEventListener('blur', () => { onLeave(); if (held) hold(false); }, on);
  win.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    ptr.touch = true; win.clearTimeout(touchTimer); onMove(e);
    pressAt = { x: e.clientX, y: e.clientY };
    pressTimer = win.setTimeout(() => { if (pressAt) hold(true); }, INFO.longPress);
  }, on);
  const lift = (e) => {
    if (e.pointerType !== 'touch') return;
    win.clearTimeout(pressTimer); pressAt = null; if (held) hold(false);
    touchTimer = win.setTimeout(() => { ptr.touch = false; onLeave(); kick(); }, INFO.touchGrace);   // then settle back
  };
  win.addEventListener('pointerup', lift, on); win.addEventListener('pointercancel', lift, on);
  const typing = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName));
  if (!keys) {                                                      // no key table: the layer's own listener, on HOLD_KEY
    win.addEventListener('keydown', (e) => { if (e.code === HOLD_KEY && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e.target)) { e.preventDefault(); if (!e.repeat && !held) hold(true); } }, { signal: life.signal });
    win.addEventListener('keyup', (e) => { if (e.code === HOLD_KEY && held) hold(false); }, { signal: life.signal });
  }
  win.addEventListener('resize', () => api.viewChanged(), on);
  win.addEventListener('scroll', () => { stageBox = null; }, { ...on, capture: true });
  /* a face that arrives late (KaTeX's, or the real serif one day) changes every size: measure again, then glide */
  if (doc.fonts) doc.fonts.addEventListener('loadingdone', () => { for (const it of items) if (it.measured) queueMeasure(it, false); }, { signal: life.signal });
  let userFrozen = false;
  function applyFreeze() {
    const f = userFrozen || held;
    if (f === frozen) return;
    frozen = f; setAttr(root, 'data-hold', f ? '' : null);
    if (f) { runner.stop(); win.clearTimeout(dwellTimer); dwellTimer = 0; }
    else { computeRests(); kick(); }
  }

  /* ── EDIT: drag a label; the neighbours yield ───────────────────────────────────────────────────────────── */
  function draggable(it) {
    let start = null;
    it.drag = drag(it.el, {
      onStart() { if (!edit) return; start = { x: it.body.x, y: it.body.y, offset: it.offset }; it.body.held = true; setAttr(it.el, 'data-carried', ''); },
      onMove(s) {
        if (!start) return;
        const b = it.body; b.x = b.rx = start.x + s.dx; b.y = b.ry = start.y + s.dy; b.vx = b.vy = 0;
        computeRests(); paint(); kick();
      },
      onEnd() { if (!start) return; settleDrag(); start = null; },
      onCancel() { if (!start) return; it.offset = start.offset; it.body.held = false; setAttr(it.el, 'data-carried', null); start = null; computeRests(); kick(); },
    });
    const settleDrag = () => {
      const A = it.group.A, L = attach(it, A);
      /* less the lean it will have once the parallax has caught up with the hand, so it ends where the hand left it */
      const on = parallax && follow && ptr.on && !ptr.touch && W > 0 && H > 0;
      const lx = on ? -Math.max(-1, Math.min(1, (ptr.x - W / 2) / (W / 2))) * it.depth : 0, ly = on ? -Math.max(-1, Math.min(1, (ptr.y - H / 2) / (H / 2))) * it.depth * 0.7 : 0;
      it.offset = { dx: L.x - A.x - lx - (it.body.ox - it.px), dy: L.y - A.y - ly - (it.body.oy - it.py) };
      it.body.held = false; setAttr(it.el, 'data-carried', null);
      computeRests(); kick();
    };
  }

  /* ── the API ────────────────────────────────────────────────────────────────────────────────────────────── */
  function handle(it) {
    return {
      id: it.id, el: it.el,
      remove() {
        if (it.leaving) return Promise.resolve(); it.leaving = true;
        return exit([it]).then(() => {
          const i = items.indexOf(it); if (i >= 0) items.splice(i, 1);
          if (it.drag) it.drag.destroy();
          it.el.remove();
          if (it.group) { it.group.labels = it.group.labels.filter((l) => l !== it); if (!it.group.labels.length) { it.group.g.remove(); groups.delete(it.group.key); unwatchControls(); } }
          computeRests(); kick(); schedule();
        });
      },
    };
  }
  const api = {
    root, stage,
    /** addLabel({ anchor, title, md, line, control }) — anchor: a feature id, 'ui:name' (a control), { x, y, r }, or
     *  () => ({ x, y, r }) | null.  control: how to find a 'ui:' anchor's element (name → element, or a node to search) */
    addLabel({ anchor, title = '', md = '', id, line = 'auto', control = null } = {}) {
      const it = make('label', { title, md, id }), g = groupFor(anchor, control);
      it.line = line;
      it.group = g; g.labels.push(it); draggable(it);
      return handle(it);
    },
    /** addBlock({ md, hold, pane }) — pane: true on a glass pane, false bare, omitted: the layer's default */
    addBlock({ md = '', hold = 0, id, pane } = {}) { return handle(make('block', { md, hold, id, pane })); },
    /** setPane(on) — the default for blocks that did not choose: bare (the soft darkness) or on a glass pane */
    setPane(v) {
      paneAll = !!v;
      for (const it of items) if (it.kind === 'block' && it.pane === null) { it.el.toggleAttribute('data-pane', paneAll); if (it.measured) queueMeasure(it, false); }
    },
    /** setStyle('auto' | 'diagonal-first' | 'flat-first') — 'auto' lets each label's job choose its line */
    setStyle(s) { root.dataset.style = s === 'flat-first' || s === 'diagonal-first' ? s : 'auto'; schedule(); },
    setFollow(v) { follow = !!v; if (!follow) { win.clearTimeout(dwellTimer); dwellTimer = 0; } kick(); },
    /** setParallax(on) — everything leans away from the cursor; setDrift(on) — a slow bob that keeps the frame on */
    setParallax(v) { parallax = !!v; kick(); },
    setDrift(v) { drift = !!v; kick(); },
    setLines(v) { root.dataset.lines = v ? 'on' : 'off'; if (over) over.dataset.lines = root.dataset.lines; schedule(); },
    setEdit(v) { edit = !!v; setAttr(root, 'data-edit', edit ? '' : null); },
    freeze(v) { userFrozen = !!v; applyFreeze(); },
    /** hold(on) — hold-still, as the key does while it is held (infoActions) */
    hold(v) { if (!!v !== held) hold(!!v); },
    /** viewChanged() — the picture moved: anchors and subject are read again and the labels follow on the spring */
    viewChanged() {
      if (destroyed) return;
      if (pendingView) return; pendingView = true;
      frame.read(() => {
        pendingView = false; if (destroyed) return;
        readStage(); computeRests();
        if (frozen || motionPolicy() !== 'full') { if (!frozen) for (const b of bodies()) { b.x = b.rx; b.y = b.ry; } frame.write(paint); }
        else { kick(); frame.write(paint); }
      });
    },
    /** replay() — every item leaves, then enters again */
    replay() {
      const list = items.filter((i) => i.measured && !i.leaving);
      return exit(list).then(() => { if (!destroyed) { for (const it of list) for (const a of it.anims) a.cancel(); enter(list); } });
    },
    clear(kind) { return Promise.all(items.filter((i) => !kind || i.kind === kind).map((i) => handle(i).remove())); },
    debug() {
      return {
        subject: { ...S }, running: runner.running, frozen, size: { W, H },
        items: items.map((i) => ({ id: i.id, kind: i.kind, x: i.body.x, y: i.body.y, rx: i.body.rx, ry: i.body.ry, ox: i.body.ox, oy: i.body.oy, w: i.w, h: i.h, side: i.side, titleH: i.titleH, measured: i.measured })),
        groups: [...groups.values()].map((g) => ({ key: String(g.key), A: g.A, seat: g.seat, gone: g.gone, d: g.ink.getAttribute('d') || '' })),
      };
    },
    destroy() {
      destroyed = true; runner.destroy(); life.abort();
      win.clearTimeout(dwellTimer); win.clearTimeout(pressTimer); win.clearTimeout(touchTimer);
      for (const it of items) { stopAnims(it); if (it.drag) it.drag.destroy(); }
      if (watching) watching.abort();
      root.remove(); if (over) over.remove();
    },
  };
  let pendingView = false, paneAll = !!pane;
  if (win.ResizeObserver) { const ro = new win.ResizeObserver(() => api.viewChanged()); ro.observe(stage); life.signal.addEventListener('abort', () => ro.disconnect()); }
  return api;
}
