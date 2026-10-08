/* controls/xy.js — THE XY PAD: one square for the hand, and the two knobs that stay the modulation targets.
 *
 * THE LAW IT KEEPS: A COUPLED PAIR (pan x/y, Re c / Im c, az/el, a point in a plane) IS ONE PAD AND TWO KNOBS (AUTOMATA's MORPH contract,
 * `lab/main.js:691`).  The PAD is for the hand: drag, the arrow keys (Shift: the kit's fine gear), Home, Delete or a double-tap to centre.  The two KNOBS are the kit's own
 * `knob()`s, so each is a modulation target, a keyboard slider and a screen-reader value; a macro routes onto one of them, never onto
 * the pad.  The pad PAINTS FROM THE KNOBS' VALUES (the base, or the modulated value a route shows), so a modulated pair moves the dot and
 * the hand's base stays a ring: it cannot disagree with them.  The hand is the one knob law (kit.js): a press brings the dot to the
 * pointer; ⅛ fine on any modifier or a second finger, on a virtual point (nothing jumps when the gear engages); a double-tap centres.
 *   xyPad({ label, aria, x, y, home, tags, onInput, onChange, cls })
 *     x, y    each the options of the kit's knob() for that axis: { label, min, max, value, log, step, fmt, unit, title, … }
 *     home    [x, y] where Home and a double-tap go (default: the middle of each range)
 *     tags    { bl, br, tl, tr } words in the pad's corners (AUTOMATA's A B C D); words go through label()
 *     onInput(x, y) while the hand or a key moves it; onChange(x, y) when it lands
 *   → { root, pad, x, y, get() → [x, y], set(x, y), setDisabled(on), paint(), lattice(reset?), destroy() }   x and y are the knob widgets: register them as the targets
 *
 * THE LATTICE (wave 20, Josh 2026-10-06: "a fancy dot matrix/lattice that grows in size the closer the XY is … and cursor hover"; it
 * REPLACES the glow that tinted the dot): a square grid of dots on a transparent canvas under the dot and the ring.  Each dot's radius
 * is a base plus a swell that falls off from the pad's point (the value the dot shows: the modulated one when routed) as a smooth bell,
 * and its ink rises from the pad's ink, faint, to the accent (accent B when routed) toward the point.  On a hover device with the full
 * motion policy (the kit's pointer-effect rule, fx/pointer-light.js fxAllowed) a gentler swell sits under the cursor and eases in and
 * out by the micro token; never on touch, never under reduced or no motion (then the lattice moves only with the value), never while
 * the hand drags.  The swell follows the point exactly, no easing.  PAINT LAW: repainted only when the point, the cursor, the size
 * or the theme changed (or paint() is called: the app's refresh), each repaint one frame.write; at rest nothing is booked.  The
 * dots are bucketed by tint, one path and one fill per bucket.  `lattice(reset)` is the test's probe: { n, nx, ny, radii, paints,
 * hover, ms, max, sum } (the paint's own cost in ms; reset zeroes the counters after reading).
 * Styled by controls.css (`.mir-xy`, `.xy-pad`, `.xy-lattice`, `.xy-dot`, `.xy-base`; the `--xy-lattice-*` tokens). */
import { el, label, ariaLabel, knob, watchTouches, gearOf, tapWatcher, setKnobLaw, onThemeChange } from '../kit.js';
import { setVar } from '../core/perf.js';
import { frame } from '../core/frame.js';
import { motionToken } from '../core/motion.js';
import { fxAllowed, fxEnv } from '../fx/pointer-light.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* a token colour as [r, g, b]: the canvas parses whatever CSS the skin wrote (hsl, oklch, color-mix …); cached by its text */
const rgbs = new Map(); let probe = null;
function rgbOf(css) {
  let v = rgbs.get(css); if (v) return v;
  if (!probe) { const c = document.createElement('canvas'); c.width = c.height = 1; probe = c.getContext('2d', { willReadFrequently: true }); }
  probe.clearRect(0, 0, 1, 1); probe.fillStyle = '#808080'; probe.fillStyle = css || '#808080'; probe.fillRect(0, 0, 1, 1);
  const p = probe.getImageData(0, 0, 1, 1).data; v = p[3] ? [p[0], p[1], p[2], p[3] / 255] : [128, 128, 128, 1];   // r, g, b and the colour's own alpha
  if (rgbs.size > 64) rgbs.clear(); rgbs.set(css, v); return v;
}
const BUCKETS = 8;                                                // tint levels: one path and one fill each

/** the pad's lattice: → { point(x, y, mod), hold(on), want(), probe(reset), destroy() }; x, y normalised (y up) */
function createLattice(pad) {
  const cv = el('canvas', 'xy-lattice'); cv.setAttribute('aria-hidden', 'true'); pad.prepend(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0, booked = false, px = 0.5, py = 0.5, mod = false, key = '';
  let radii = new Float32Array(0), tint = new Uint8Array(0), n = 0, nx = 0, ny = 0;
  let live = false, held = false, cx = 0, cy = 0, box = null, bl = 0, bt = 0;   // the cursor, in the pad's padding box
  let h = 0, h0 = 0, hTo = 0, hT0 = 0, hDur = 0;                                  // the cursor swell and its ease
  const stat = { paints: 0, ms: 0, max: 0, sum: 0 };
  const want = () => { if (booked) return; booked = true; frame.write(paint); };
  function ease(to) {
    if (hTo === to) return;
    h0 = h; hTo = to; hT0 = performance.now(); hDur = motionToken('micro'); want();
  }
  const aim = () => ease(live && !held ? 1 : 0);
  function paint(now) {
    booked = false;
    if (W < 2 || H < 2) return;
    const t0 = performance.now();
    if (hDur > 0 && t0 - hT0 < hDur) { const u = (t0 - hT0) / hDur; h = h0 + (hTo - h0) * u * u * (3 - 2 * u); want(); } else { h = hTo; hDur = 0; }
    const d = Math.max(1, Math.min(3, globalThis.devicePixelRatio || 1)), bw = Math.round(W * d), bh = Math.round(H * d);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    const cs = getComputedStyle(pad), tok = (k) => cs.getPropertyValue(k).trim(), num = (k, f) => { const v = parseFloat(tok(k)); return Number.isFinite(v) ? v : f; };
    const side = Math.min(W, H), nTok = parseFloat(tok('--xy-lattice-n'));
    n = Number.isFinite(nTok) && nTok >= 2 ? Math.round(nTok) : Math.max(8, Math.min(40, Math.round(side / num('--xy-lattice-pitch', 10))));
    const pitch = side / n; nx = Math.max(2, Math.round(W / pitch)); ny = Math.max(2, Math.round(H / pitch));
    const sx = W / nx, sy = H / ny, r0 = num('--xy-lattice-dot', 0.9), sw = num('--xy-lattice-swell', 3.1), rMax = 0.48 * Math.min(sx, sy);
    const R = Math.max(1, num('--xy-lattice-reach', 0.35) * side), R2 = R * R, Rc2 = R2 * 0.49, hv = h * num('--xy-lattice-hover', 0.5);
    const far = num('--xy-lattice-far', 0.22), near = num('--xy-lattice-near', 0.9);
    const ink = rgbOf(tok('--xy-lattice-ink') || tok('--fg')), acc = rgbOf(tok(mod ? '--acc2' : '--acc'));   // the far ink is the well's tint (its alpha included)
    const ppx = px * W, ppy = (1 - py) * H, count = nx * ny;
    if (radii.length !== count) { radii = new Float32Array(count); tint = new Uint8Array(count); }
    for (let j = 0, i = 0; j < ny; j++) {
      const y = (j + 0.5) * sy, dy2 = (y - ppy) * (y - ppy), cy2 = (y - cy) * (y - cy);
      for (let k = 0; k < nx; k++, i++) {
        const x = (k + 0.5) * sx, q = ((x - ppx) * (x - ppx) + dy2) / R2, wp = q < 1 ? (1 - q) * (1 - q) : 0;
        let wc = 0; if (hv > 0) { const c = ((x - cx) * (x - cx) + cy2) / Rc2; wc = c < 1 ? hv * (1 - c) * (1 - c) : 0; }
        radii[i] = Math.min(rMax, r0 + sw * (wp + wc));
        tint[i] = Math.round(Math.min(1, wp + 0.5 * wc) * (BUCKETS - 1));
      }
    }
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
    for (let b = 0; b < BUCKETS; b++) {
      const t = b / (BUCKETS - 1); let any = false;
      g.beginPath();
      for (let j = 0, i = 0; j < ny; j++) for (let k = 0; k < nx; k++, i++) {
        if (tint[i] !== b) continue;
        const x = (k + 0.5) * sx, y = (j + 0.5) * sy, r = radii[i]; g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.283185307179586); any = true;
      }
      if (!any) continue;
      g.fillStyle = `rgba(${Math.round(ink[0] + (acc[0] - ink[0]) * t)},${Math.round(ink[1] + (acc[1] - ink[1]) * t)},${Math.round(ink[2] + (acc[2] - ink[2]) * t)},${(ink[3] * far + (near - ink[3] * far) * t).toFixed(3)})`;
      g.fill();
    }
    const ms = performance.now() - t0; stat.paints++; stat.ms = ms; stat.sum += ms; if (ms > stat.max) stat.max = ms;
  }
  /* the size: one observer on the pad (its padding box is the canvas) */
  const ro = new ResizeObserver(() => { W = pad.clientWidth; H = pad.clientHeight; box = null; want(); });
  ro.observe(pad);
  const offTheme = onThemeChange(want);
  /* the cursor: a pointer in precision use (core/kbm.js: a trackpad on an iPad counts) under the full motion policy only
     (the kit's pointer-effect rule, fxEnv); the box is read on entering */
  const at = (e) => { if (!box) { box = pad.getBoundingClientRect(); bl = pad.clientLeft; bt = pad.clientTop; } cx = e.clientX - box.left - bl; cy = e.clientY - box.top - bt; };
  pad.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch' || !fxAllowed(fxEnv(pad.ownerDocument))) return;
    live = true; box = null; at(e); aim(); want();
  });
  pad.addEventListener('pointermove', (e) => { if (!live || e.pointerType === 'touch') return; at(e); if (h > 0 || hTo > 0) want(); });
  pad.addEventListener('pointerleave', () => { if (!live) return; live = false; aim(); });
  return {
    point(x, y, m) { px = x; py = y; mod = m; const k = x.toFixed(5) + ' ' + y.toFixed(5) + (m ? ' m' : ''); if (k !== key) { key = k; want(); } },
    hold(on) { held = !!on; if (on) box = null; aim(); },
    want,
    probe(reset) {
      const o = { n, nx, ny, radii: Array.from(radii), paints: stat.paints, hover: h, ms: stat.ms, max: stat.max, sum: stat.sum };
      if (reset) { stat.paints = 0; stat.max = 0; stat.sum = 0; }
      return o;
    },
    destroy() { ro.disconnect(); offTheme(); },
  };
}

export function xyPad(o = {}) {
  const root = el('div', 'mir-xy' + (o.cls ? ' ' + o.cls : ''));
  if (o.label) label(el('div', 'k-lbl', root), o.label);
  const body = el('div', 'mir-xy-body', root);
  const pad = el('div', 'xy-pad', body); pad.tabIndex = 0; pad.setAttribute('role', 'application');
  ariaLabel(pad, o.aria || o.label || 'XY pad');
  pad.setAttribute('aria-roledescription', 'XY pad');
  const lat = createLattice(pad);                                  // first child: under the tags, the ring and the dot
  if (o.tags) for (const k of ['bl', 'br', 'tl', 'tr']) if (o.tags[k]) label(el('span', 'xy-tag xy-tag-' + k, pad), o.tags[k]);
  const ring = el('i', 'xy-base', pad); ring.hidden = true;
  const dot = el('i', 'xy-dot', pad);
  const side = el('div', 'mir-xy-side', body);
  const A = { x: o.x || {}, y: o.y || {} };
  const norm = (ax, v) => { const a = A[ax]; return a.log ? clamp01(Math.log(v / a.min) / Math.log(a.max / a.min)) : clamp01((v - a.min) / (a.max - a.min)); };
  const denorm = (ax, u) => { const a = A[ax]; return a.log ? a.min * Math.pow(a.max / a.min, clamp01(u)) : a.min + clamp01(u) * (a.max - a.min); };
  const snap = (ax, v) => { const a = A[ax]; return a.step ? Math.min(a.max, Math.max(a.min, Math.round((v - a.min) / a.step) * a.step + a.min)) : Math.min(a.max, Math.max(a.min, v)); };
  const home = o.home || [(A.x.min + A.x.max) / 2, (A.y.min + A.y.max) / 2];
  let disabled = false;
  const emit = () => { if (o.onInput) o.onInput(kx.get(), ky.get()); };
  const land = () => { if (o.onChange) o.onChange(kx.get(), ky.get()); };
  const mk = (ax) => knob({ ...A[ax], size: A[ax].size, onInput: (v) => { paintPad(); emit(); }, onChange: () => { paintPad(); land(); } });
  const kx = mk('x'), ky = mk('y');
  side.append(kx.root, ky.root);
  /* the pad paints from the knobs: wrap set and show (a route's show, the app's set) so every road repaints it */
  for (const k of [kx, ky]) {
    const set0 = k.set, show0 = k.show;
    k.set = function (v, silent) { set0.call(k, v, silent); paintPad(); };
    k.show = function (v) { show0.call(k, v); paintPad(); };
  }
  function paintPad() {
    const sx = kx.shown ?? kx.get(), sy = ky.shown ?? ky.get();
    const mod = kx.shown !== null && kx.shown !== undefined || ky.shown !== null && ky.shown !== undefined;
    const ux = +norm('x', sx).toFixed(5), uy = +norm('y', sy).toFixed(5);
    setVar(dot, '--x', ux); setVar(dot, '--y', uy); lat.point(ux, uy, mod);       // the lattice swells where the dot is, never elsewhere
    pad.classList.toggle('mod', mod); ring.hidden = !mod;
    if (mod) { setVar(ring, '--x', +norm('x', kx.get()).toFixed(5)); setVar(ring, '--y', +norm('y', ky.get()).toFixed(5)); }
  }
  /** the hand writes both bases */
  function put(x, y, fromHand = true) {
    x = snap('x', x); y = snap('y', y);
    if (x === kx.get() && y === ky.get()) return false;
    kx.set(x); ky.set(y); if (fromHand) emit(); return true;
  }

  /* ── the hand ── */
  watchTouches();
  let g = null;
  let homed = false;
  const tap = tapWatcher(() => { homed = true; if (put(home[0], home[1])) land(); });
  pad.addEventListener('pointerdown', (e) => {
    if (disabled || g || e.button) return;
    e.preventDefault();
    pad.focus({ preventScroll: true });
    homed = false; tap(e);
    if (homed) return;                                           // the second tap centres, and starts no drag
    try { pad.setPointerCapture(e.pointerId); } catch (_) {}
    const r = pad.getBoundingClientRect();
    g = { id: e.pointerId, lx: e.clientX, ly: e.clientY, w: r.width || 1, h: r.height || 1, ux: norm('x', kx.get()), uy: norm('y', ky.get()) };
    pad.classList.add('drag'); lat.hold(true);                   // the hand is the point: the cursor's swell steps aside while it drags
    if (gearOf(e, e.pointerId) === 1) {                          // a press brings the dot to the pointer; with the gear engaged nothing jumps
      g.ux = clamp01((e.clientX - r.left) / g.w); g.uy = clamp01(1 - (e.clientY - r.top) / g.h);
      put(denorm('x', g.ux), denorm('y', g.uy));
    }
  });
  pad.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    const k = gearOf(e, g.id);                                   // the virtual point: gear · Δ / size on each axis
    g.ux = clamp01(g.ux + k * (e.clientX - g.lx) / g.w); g.uy = clamp01(g.uy - k * (e.clientY - g.ly) / g.h);
    g.lx = e.clientX; g.ly = e.clientY;
    put(denorm('x', g.ux), denorm('y', g.uy));
  });
  const end = (e) => { if (!g || (e && e.pointerId !== g.id)) return; g = null; pad.classList.remove('drag'); lat.hold(false); paintPad(); land(); };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end); pad.addEventListener('lostpointercapture', end);
  pad.addEventListener('dblclick', (e) => { e.preventDefault(); });   // the double-tap is taken on the press (300 ms within 14 px); a click would answer it a second time
  pad.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  pad.addEventListener('keydown', (e) => {
    if (disabled || e.ctrlKey || e.metaKey || e.altKey) return;
    const d = 0.01 * (e.code.startsWith('Page') ? 10 : 1) * (e.shiftKey ? setKnobLaw().keyFine : 1);   // the kit's one fine gear
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1], PageUp: [0, 1], PageDown: [0, -1] }[e.code];
    if (!dir && e.code !== 'Home' && e.code !== 'Delete' && e.code !== 'Backspace') return;   // Home and Delete: home, as on a knob
    e.preventDefault(); e.stopPropagation();
    if (dir) put(denorm('x', norm('x', kx.get()) + dir[0] * d), denorm('y', norm('y', ky.get()) + dir[1] * d)); else put(home[0], home[1]);
    land();
  });
  paintPad();
  return { root, pad, x: kx, y: ky, get: () => [kx.get(), ky.get()], set(x, y) { kx.set(x); ky.set(y); },
    setDisabled(on) { disabled = !!on; root.classList.toggle('disabled', disabled); pad.tabIndex = on ? -1 : 0; pad.setAttribute('aria-disabled', String(!!on)); kx.setDisabled(on); ky.setDisabled(on); },
    paint() { paintPad(); lat.want(); },                                  // the app's refresh: a skin or accent change repaints the lattice too
    lattice: (reset) => lat.probe(reset),
    destroy() { lat.destroy(); root.remove(); } };
}
