/* kit.js — the control kit and the device chassis, in the house rack grammar.
 *
 * Primitive types are preserved (§23): boolean → switch, scalar → knob or fader,
 * enumeration → segmented select, event → trigger.  Every control is a real 44 px seat,
 * takes pointer events (mouse, pen and touch alike, `touch-action: none`), and the rack
 * wheel never changes a hovered control (§24).  Knobs reset on double-tap.
 */
export function el(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** double-tap detector shared by knobs and faders */
function tapWatcher(fn) {
  let last = 0;
  return () => { const now = performance.now(); if (now - last < 320) { last = 0; fn(); } else last = now; };
}

/**
 * knob({ label, min, max, value, log, wrap, step, fmt, unit, onInput, onChange, onDelta, size })
 *   wrap: free-spinning (phase); onDelta(dRad) reports drag deltas instead of absolute values.
 */
export function knob(o) {
  const root = el('div', 'k' + (o.size === 'lg' ? ' k-lg' : '') + (o.cls ? ' ' + o.cls : ''));
  if (o.label) el('div', 'k-lbl', root, o.label);
  const dial = el('div', 'k-dial', root);
  const needle = el('i', 'k-needle', dial);
  const val = el('div', 'k-val', root);
  let v = o.value, def = o.value, dragging = false, disabled = false;
  const lo = o.min, hi = o.max, log = !!o.log;
  const norm = (x) => log ? (Math.log(x) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (x - lo) / (hi - lo);
  const denorm = (p) => log ? Math.exp(Math.log(lo) + p * (Math.log(hi) - Math.log(lo))) : lo + p * (hi - lo);
  const fmt = o.fmt || ((x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2)) + (o.unit || ''));
  function paint() {
    const p = o.wrap ? (norm(v) % 1 + 1) % 1 : clamp01(norm(v));
    needle.style.setProperty('--turn', (o.wrap ? p * 360 : -135 + p * 270) + 'deg');
    val.textContent = fmt(v);
  }
  let p0 = 0, x0 = 0, y0 = 0, acc = 0;
  dial.addEventListener('pointerdown', (e) => {
    if (disabled) return;
    e.preventDefault(); try { dial.setPointerCapture(e.pointerId); } catch (_) {}   // a pointer already gone (or a synthetic one) must not abort the drag
    dragging = true; root.classList.add('drag'); root.classList.add('active'); p0 = norm(v); x0 = e.clientX; y0 = e.clientY; acc = 0;
    tap();
  });
  dial.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dp = ((y0 - e.clientY) + (e.clientX - x0)) / (e.shiftKey ? 900 : 220);
    if (o.onDelta) { const d = dp - acc; acc = dp; o.onDelta(d * 2 * Math.PI); return; }
    let p = o.wrap ? p0 + dp : clamp01(p0 + dp);
    let nv = denorm(p);
    if (o.step) nv = Math.round(nv / o.step) * o.step;
    if (nv !== v) { v = nv; paint(); if (o.onInput) o.onInput(v); }
  });
  const end = () => { if (!dragging) return; dragging = false; root.classList.remove('drag'); setTimeout(() => root.classList.remove('active'), 700); if (o.onChange && !o.onDelta) o.onChange(v); };
  dial.addEventListener('pointerup', end); dial.addEventListener('pointercancel', end);
  const reset = () => { if (o.onDelta) { if (o.onReset) o.onReset(); return; } v = def; paint(); if (o.onInput) o.onInput(v); if (o.onChange) o.onChange(v); };
  const tap = tapWatcher(reset);                       // two taps within 320 ms reset the control to its default …
  dial.addEventListener('dblclick', (e) => { e.preventDefault(); reset(); });   // … and so does a double-click
  dial.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  paint();
  return { root, get: () => v, set(x, silent = true) { v = x; paint(); if (!silent && o.onChange) o.onChange(v); }, setDefault(x) { def = x; },
    setDisabled(on) { disabled = on; root.classList.toggle('disabled', on); }, paint };
}

/** sw({ label, value, onChange }) — a boolean */
export function sw(o) {
  const b = el('button', 'sw' + (o.cls ? ' ' + o.cls : ''));
  b.type = 'button';
  el('i', 'sw-led', b); el('span', 'sw-lbl', b, o.label);
  let v = !!o.value;
  const paint = () => { b.classList.toggle('on', v); b.setAttribute('aria-pressed', String(v)); };
  b.addEventListener('click', () => { v = !v; paint(); if (o.onChange) o.onChange(v); });
  paint();
  return { root: b, get: () => v, set(x) { v = !!x; paint(); } };
}

/** seg({ label, options: [{id, label, title}], value, onChange }) — an enumeration */
export function seg(o) {
  const root = el('div', 'segw' + (o.cls ? ' ' + o.cls : ''));
  if (o.label) el('div', 'k-lbl', root, o.label);
  const row = el('div', 'seg', root);
  let v = o.value; const btns = new Map();
  for (const opt of o.options) {
    const b = el('button', 'seg-b', row, opt.label); b.type = 'button'; if (opt.title) b.title = opt.title;
    b.addEventListener('click', () => { if (v === opt.id) return; v = opt.id; paint(); if (o.onChange) o.onChange(v); });
    btns.set(opt.id, b);
  }
  const paint = () => { for (const [id, b] of btns) b.classList.toggle('on', id === v); };
  paint();
  return { root, get: () => v, set(x) { v = x; paint(); }, button: (id) => btns.get(id) };
}

/** trig({ label, onFire, glyph, cls }) — a momentary event */
export function trig(o) {
  const b = el('button', 'trig' + (o.cls ? ' ' + o.cls : ''));
  b.type = 'button';
  if (o.glyph) el('span', 'trig-g', b, o.glyph);
  el('span', 'trig-l', b, o.label);
  if (o.title) b.title = o.title;
  b.addEventListener('click', (e) => { if (o.onFire) o.onFire(e); });
  return { root: b, setLabel(t) { b.querySelector('.trig-l').textContent = t; }, setGlyph(g) { const s = b.querySelector('.trig-g'); if (s) s.textContent = g; }, set on(v) { b.classList.toggle('on', !!v); } };
}

/** fader({ label, min, max, value, fmt, onInput, onChange, showValue }) — a horizontal scalar */
export function fader(o) {
  const root = el('div', 'fd' + (o.cls ? ' ' + o.cls : ''));
  const fill = el('div', 'fd-fill', root);
  const edge = el('div', 'fd-edge', root);
  const lbl = el('div', 'fd-lbl', root, o.label || '');
  const val = el('div', 'fd-val', root);
  let v = o.value, def = o.value, dragging = false, lastX = 0;
  const lo = o.min, hi = o.max;
  const fmt = o.fmt || ((x) => x.toFixed(3));
  const paint = () => { const p = clamp01((v - lo) / (hi - lo)); root.style.setProperty('--fill', p); val.textContent = fmt(v); };
  const fromEvent = (e) => { const r = root.getBoundingClientRect(); return lo + clamp01((e.clientX - r.left) / Math.max(1, r.width)) * (hi - lo); };
  root.addEventListener('pointerdown', (e) => { e.preventDefault(); try { root.setPointerCapture(e.pointerId); } catch (_) {} dragging = true; root.classList.add('drag'); tap(); lastX = e.clientX; if (!e.shiftKey) v = fromEvent(e); paint(); if (o.onInput) o.onInput(v); });
  root.addEventListener('pointermove', (e) => { if (!dragging) return; if (e.shiftKey) { const r = root.getBoundingClientRect(); v = lo + clamp01((v - lo) / (hi - lo) + (e.clientX - lastX) / Math.max(1, r.width) * 0.2) * (hi - lo); } else v = fromEvent(e); lastX = e.clientX; paint(); if (o.onInput) o.onInput(v); });   // shift = fine: a fifth of the travel
  const end = () => { if (!dragging) return; dragging = false; root.classList.remove('drag'); if (o.onChange) o.onChange(v); };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
  const reset = () => { v = def; paint(); if (o.onInput) o.onInput(v); if (o.onChange) o.onChange(v); };
  const tap = tapWatcher(reset);
  root.addEventListener('dblclick', (e) => { e.preventDefault(); reset(); });
  root.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  paint();
  return { root, get: () => v, set(x) { v = x; paint(); }, setLabel(t) { lbl.textContent = t; }, dragging: () => dragging };
}

/** readout({ label, value, cls }) — a labelled number */
export function readout(o) {
  const root = el('div', 'ro' + (o.cls ? ' ' + o.cls : ''));
  el('div', 'ro-lbl', root, o.label);
  const val = el('div', 'ro-val', root, o.value === undefined ? '—' : String(o.value));
  if (o.sub) el('div', 'ro-sub', root, o.sub);
  return { root, set(t, cls) { if (val.textContent !== t) val.textContent = t; if (cls !== undefined) val.className = 'ro-val ' + cls; }, setSub(t) { let s = root.querySelector('.ro-sub'); if (!s) s = el('div', 'ro-sub', root); if (s.textContent !== t) s.textContent = t; } };
}

/** device({ id, eyebrow, title, status }) — a rack window: identity | live status | utilities */
export function device(o) {
  const root = el('section', 'dev'); root.dataset.id = o.id;
  const head = el('header', 'dev-head', root);   // the long title is a hover hint; the eyebrow is the name
  /* THE STATUS IS NOT ALWAYS VISIBLE (wave 44).  The header is one grid row — eyebrow, status, buttons — and on a
     274 px card a long eyebrow beside six utility buttons leaves the status NO width at all: ELECTROSTATICS'
     'hydrogen only: no closed-form field for the scaled radials' measured 0 px wide, so the reason the overlay had
     stood down was on the card and unreadable.  The header's hover hint carries it now, whatever the width. */
  const headHint = (st) => { head.title = st ? (o.title || '') + '  ·  ' + st : (o.title || ''); };
  headHint(o.status || '');
  const idz = el('div', 'dev-id', head);
  el('div', 'dev-eyebrow', idz, o.eyebrow || '');
  el('h2', 'dev-title', idz, o.title);
  const stat = el('div', 'dev-stat', head, o.status || '');
  const util = el('div', 'dev-util', head);
  const power = el('button', 'dev-power', util, ''); power.type = 'button'; power.title = 'switch this device off — its reader stops computing (saves CPU); on again restores it'; power.setAttribute('aria-pressed', 'true');
  const fold = el('button', 'dev-fold', util, '▾'); fold.type = 'button'; fold.title = 'fold / unfold (layout only — never touches the state)';
  const close = el('button', 'dev-close', util, '×'); close.type = 'button'; close.title = 'close this window — reopen it from the + at the top of a rack, or the WINDOW menu';
  let off = false;
  const setOff = (v) => { off = !!v; root.classList.toggle('off', off); power.setAttribute('aria-pressed', String(!off)); if (o.onPower) o.onPower(!off); };
  power.addEventListener('click', (e) => { e.stopPropagation(); setOff(!off); });
  close.addEventListener('click', (e) => { e.stopPropagation(); root.classList.add('closed'); root.dispatchEvent(new CustomEvent('devclose', { bubbles: true })); });
  const body = el('div', 'dev-body', root);
  let folded = false;
  const setFold = (on) => { folded = on; root.classList.toggle('folded', on); fold.textContent = on ? '▸' : '▾'; };
  fold.addEventListener('click', () => setFold(!folded));
  head.addEventListener('dblclick', (e) => { if (e.target === fold) return; setFold(!folded); });
  return { root, body, setOff, get off() { return off; }, setStatus(t, cls) { if (stat.textContent !== t) { stat.textContent = t; headHint(t); } if (cls !== undefined) stat.className = 'dev-stat ' + cls; }, fold: setFold, row(cls) { return el('div', 'row' + (cls ? ' ' + cls : ''), body); } };
}

/** a labelled group inside a device body */
export function group(parent, label) {
  const g = el('div', 'grp', parent);
  if (label) el('div', 'grp-lbl', g, label);
  return g;
}
export const N_COLOR = ['', 'var(--n1)', 'var(--n2)', 'var(--n3)', 'var(--n4)', 'var(--n5)', 'var(--n6)'];
export const N_RGB = ['', [255, 226, 170], [120, 225, 240], [230, 160, 240], [255, 150, 90], [140, 220, 140], [180, 160, 255]];

/* ═══ wave 46 — THE MINIMALIST GRAPH: one tip, vivid ink, clamped glyphs ════════════════════════
 * Josh: "all of the random floating colored texts in the graphs … what if it's a minimalist graph
 * with no text and subtle information, and hovering over the corresponding object like a line/curve/dot
 * will reveal that specific object's information."  So every canvas view registers, at the END of each
 * redraw, the objects it just drew — each with the EXACT text its floating label used to carry — and one
 * shared tip (#graphTip) shows the nearest object within 8 px of the pointer.  The tip is glass and ink:
 * no colour overlay, because the highlight drawn on the object itself is what carries the colour.
 */

/* ── the light-theme shell ink ──────────────────────────────────────────────────────────────────
 * --n1…--n6 (lab.css:29) were chosen on the dark ground.  Measured against the light card they run
 * 1.25 : 1 … 2.19 : 1 — far under the 3 : 1 a 2 px line needs.  The light set keeps every hue, pushes the
 * chroma up (+12 saturation) and walks the lightness DOWN until the WCAG contrast ratio is ≥ 3 against
 * BOTH grounds the app actually renders — the light card, MEASURED in the page at (236,239,243), and the well
 * every plot sits in, (220,225,232), which is the binding one.  Computed, not eyeballed; the six ratios are in
 * skin.css beside the tokens and in REPORT.md wave 46.  The dark set is untouched.
 */
export const N_RGB_LIGHT = ['', [173, 116, 0], [7, 139, 159], [223, 22, 223], [217, 87, 0], [29, 147, 29], [142, 98, 247]];
export const lightTheme = () => document.body.dataset.theme === 'light';
/** the shell colour of level n as it must be drawn on THIS theme's ground */
export const nRGB = (n) => ((lightTheme() ? N_RGB_LIGHT : N_RGB)[n] || [255, 255, 255]);

const LIN = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const LUM = (c) => 0.2126 * LIN(c[0]) + 0.7152 * LIN(c[1]) + 0.0722 * LIN(c[2]);
const RATIO = (a, b) => { const x = LUM(a), y = LUM(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const CARD_LIGHT = [236, 239, 243], WELL_LIGHT = [220, 225, 232];   // measured in the page, not derived from the tokens
function hsl2rgb(h, s, l) { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]; }
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l]; }
const inkCache = new Map();
/** vividInk(rgb) — the same walk for any other graph colour: identity on the dark theme, and on the
 *  light one the same hue at higher chroma and lower lightness until it clears 3 : 1 on the well. */
export function vividInk(rgb) {
  if (!lightTheme() || !rgb) return rgb;
  const key = rgb[0] + ',' + rgb[1] + ',' + rgb[2];
  const got = inkCache.get(key); if (got) return got;
  const [h, s0, l0] = rgb2hsl(rgb[0], rgb[1], rgb[2]);
  const s = Math.min(1, s0 + 0.12);
  let out = rgb;
  for (let l = l0; l >= 0.06; l -= 0.005) { const c = hsl2rgb(h, s, l);
    if (RATIO(c, CARD_LIGHT) >= 3 && RATIO(c, WELL_LIGHT) >= 3) { out = c; break; } }
  inkCache.set(key, out); return out;
}
/** the contrast ratio of a drawn colour against this theme's card — the proof B61 recomputes */
export const inkRatio = (rgb, ground) => RATIO(rgb, ground || (lightTheme() ? CARD_LIGHT : [56, 60, 65]));

/* ── the theme flip ─────────────────────────────────────────────────────────────────────────────
 * A CARD CANVAS IS PAINTED WHEN ITS DATA MOVES, NOT EVERY FRAME (wave 46).  MOLECULE, H₂, QCD and the
 * SPECTRUM eigen ladder are painted once at boot and then only when R, the potential or the register
 * changes — so a theme flip left every one of them holding the OTHER theme's ink until something else
 * happened to move.  One observer on the body's data-theme, and every registered view repaints. */
const themeFns = new Set();
let themeObs = null;
export function onThemeChange(fn) {
  themeFns.add(fn);
  if (!themeObs) {
    let last = document.body.dataset.theme || '';
    themeObs = new MutationObserver(() => {
      const now = document.body.dataset.theme || '';
      if (now === last) return;
      last = now; inkCache.clear();
      for (const f of themeFns) { try { f(); } catch (e) { /* one view must never stop the rest */ } }
    });
    themeObs.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  }
  return () => themeFns.delete(fn);
}

/* ── the one tip ────────────────────────────────────────────────────────────────────────────── */
let tipEl = null, tipOwner = null;
function tipNode() {
  if (!tipEl || !tipEl.isConnected) { tipEl = el('div', '', document.body); tipEl.id = 'graphTip'; tipEl.hidden = true; }
  return tipEl;
}
/** the tip has ONE owner at a time, so a view that never sees a pointerleave cannot hide another view's tip.
 *  KEPLER's overlay canvas is pointer-events: none — the rack already routes the field's pointer through
 *  kepler.hit()/setHover(), so that view drives the same tip by hand through these two. */
export function showGraphTip(owner, txt, cx, cy) { tipOwner = owner; placeTip(txt, cx, cy); }
export function hideGraphTip(owner) {
  if (owner !== undefined && tipOwner !== null && tipOwner !== owner) return;
  tipOwner = null;
  if (!tipEl || tipEl.hidden) return;              // a live canvas calls this every frame: never write the DOM twice
  tipEl.hidden = true; tipEl.textContent = '';
}
/** the tip never leaves the viewport: it is fixed on the body, so no card can clip it */
function placeTip(txt, cx, cy) {
  const t = tipNode();
  if (t.textContent !== txt) t.textContent = txt;
  t.hidden = false;
  const r = t.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
  let x = cx + 13, y = cy + 15;
  if (x + r.width > W - 6) x = cx - 13 - r.width;
  if (x < 6) x = 6;
  if (y + r.height > H - 6) y = cy - 15 - r.height;
  if (y < 6) y = 6;
  t.style.left = x.toFixed(1) + 'px'; t.style.top = y.toFixed(1) + 'px';
}

/* ── geometry: the nearest object within 8 px ───────────────────────────────────────────────── */
const HIT_PX = 8;
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  let t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
/** points may be [[x, y], …] or a flat [x, y, x, y, …] */
function polyDist(pts, px, py) {
  if (!pts || pts.length === 0) return Infinity;
  const flat = typeof pts[0] === 'number';
  const n = flat ? pts.length >> 1 : pts.length;
  if (n === 1) return flat ? Math.hypot(px - pts[0], py - pts[1]) : Math.hypot(px - pts[0][0], py - pts[0][1]);
  let best = Infinity;
  for (let i = 1; i < n; i++) {
    const ax = flat ? pts[2 * i - 2] : pts[i - 1][0], ay = flat ? pts[2 * i - 1] : pts[i - 1][1];
    const bx = flat ? pts[2 * i] : pts[i][0], by = flat ? pts[2 * i + 1] : pts[i][1];
    const d = segDist(px, py, ax, ay, bx, by); if (d < best) best = d;
  }
  return best;
}
function objDist(o, px, py) {   /* an object marked `quiet` answers but is never outlined (a raster) */
  if (o.kind === 'line' || o.kind === 'curve') return polyDist(o.points, px, py);
  if (o.kind === 'bar' && o.w !== undefined && o.h !== undefined) {
    const x0 = Math.min(o.x, o.x + o.w), x1 = Math.max(o.x, o.x + o.w);
    const y0 = Math.min(o.y, o.y + o.h), y1 = Math.max(o.y, o.y + o.h);
    return Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(y0 - py, 0, py - y1));
  }
  return Math.max(0, Math.hypot(px - o.x, py - o.y) - (o.r || 0));   // to the centre, discounted by the drawn radius
}
/** the default highlight: the object again, 2 px brighter, with a soft halo of its own colour */
function defaultDraw(g, o) {
  const col = o.colour || 'rgba(255,255,255,1)';
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([]);
  if (o.kind === 'line' || o.kind === 'curve') {
    const pts = o.points, flat = typeof pts[0] === 'number', n = flat ? pts.length >> 1 : pts.length;
    const path = () => { g.beginPath();
      for (let i = 0; i < n; i++) { const x = flat ? pts[2 * i] : pts[i][0], y = flat ? pts[2 * i + 1] : pts[i][1]; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      if (n === 1) { const x = flat ? pts[0] : pts[0][0], y = flat ? pts[1] : pts[0][1]; g.arc(x, y, 3, 0, 6.2832); } };
    g.globalAlpha = 0.22; g.strokeStyle = col; g.lineWidth = (o.lw || 2) + 6; path(); g.stroke();
    g.globalAlpha = 1; g.lineWidth = (o.lw || 2) + 2; path(); g.stroke();
  } else if (o.kind === 'bar' && o.w !== undefined) {
    g.globalAlpha = 0.22; g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(o.x, o.y, o.w, o.h);
    g.globalAlpha = 1; g.lineWidth = 2; g.strokeRect(o.x, o.y, o.w, o.h);
  } else {
    const r = (o.r || 3) + 3;
    g.globalAlpha = 0.22; g.strokeStyle = col; g.lineWidth = 6; g.beginPath(); g.arc(o.x, o.y, r, 0, 6.2832); g.stroke();
    g.globalAlpha = 1; g.lineWidth = 2; g.beginPath(); g.arc(o.x, o.y, r, 0, 6.2832); g.stroke();
  }
  g.restore();
}

/**
 * graphHover(canvas, { objects, plot, repaint, draw, dpr })
 *   objects : () => [{ kind: 'line'|'curve'|'dot'|'bar', points | x, y, r, w, h, colour, lw, info }]
 *   plot    : the plot rectangle {x0, y0, x1, y1} in CSS px (or a function returning it) — parked on
 *             canvas.__lwPlot so the proof can ask where the plot is
 *   repaint : () => void — the view's own draw; the hover calls it when the hit changes
 *   draw    : (ctx, hit) => void — an optional highlight of the view's own (else the default one)
 * Returns { set(objects, plot), hit(), clear() }.  A view calls set() at the end of every redraw,
 * with the canvas transform still the plot's, and the highlight lands on top of what it just drew.
 */
export function graphHover(canvas, o = {}) {
  let objs = [], rect = null, hit = null, px = -1e9, py = -1e9, inside = false, pinned = false, painting = false;
  if (o.repaint) {
    onThemeChange(() => { try { o.repaint(); } catch (e) {} });            // the flip repaints the view in the new ink …
    /* … and a view that had NO SIZE when the flip happened could not repaint at all: a folded or stood-down card
       measures 0 and every paint() here returns early, so MOLECULE kept the dark theme's cyan on the light card
       until its R moved.  The canvas says when it is laid out again, and that is when the ink is put right. */
    if (typeof ResizeObserver === 'function') {
      let lw = -1, lh = -1;
      try { new ResizeObserver(() => { const w = canvas.clientWidth, h = canvas.clientHeight;
        if (w === lw && h === lh) return; lw = w; lh = h;
        if (w > 8 && h > 8) { try { o.repaint(); } catch (e) {} } }).observe(canvas); } catch (e) {}
    }
  }
  const ctx = () => canvas.getContext('2d');
  const pull = () => (typeof o.objects === 'function' ? (o.objects() || []) : objs);
  const pullPlot = () => (typeof o.plot === 'function' ? o.plot() : (o.plot || rect));
  const idOf = (h) => (h ? (h.key !== undefined ? String(h.key) : String(h.info)) : '');   // identity, so a hover that does not change does not repaint
  function find() {
    if (!inside && !pinned) return null;
    let best = null, bd = HIT_PX;
    for (const ob of objs) { if (!ob || ob.info === undefined) continue; const d = objDist(ob, px, py); if (d <= bd) { bd = d; best = ob; } }
    return best;
  }
  function show() {
    if (!hit) { if (tipOwner === canvas || tipOwner === null) hideGraphTip(canvas); return; }
    const r = canvas.getBoundingClientRect();
    /* info may be a FUNCTION of the pointer: a raster (WIGNER, the SLICE) answers with the value under it */
    const txt = typeof hit.info === 'function' ? hit.info(px, py) : String(hit.info);
    if (!txt) { hideGraphTip(canvas); return; }
    showGraphTip(canvas, txt, r.left + px, r.top + py);
  }
  function repaint() { if (painting) return; if (o.repaint) o.repaint(); }
  function set(objects, plot) {
    objs = objects || pull() || [];
    rect = plot || pullPlot() || rect;
    if (rect) canvas.__lwPlot = rect;
    canvas.__lwObjects = objs;
    const was = idOf(hit);
    hit = find();
    if (hit && !hit.quiet) { painting = true; try { (o.draw || defaultDraw)(ctx(), hit); } finally { painting = false; } }
    void was; show();
  }
  function move(e) {
    const r = canvas.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top; inside = true;
    const was = idOf(hit), now = idOf(find());
    if (now === was) { if (hit) show(); return; }   // the same object: only the tip moves (and a live one re-reads)
    if (o.repaint) { repaint(); return; }
    hit = find();                                      // no repaint hook: the highlight lands on what is already there
    if (hit && !hit.quiet) { painting = true; try { (o.draw || defaultDraw)(ctx(), hit); } finally { painting = false; } }
    show();
  }
  function leave() { inside = false; pinned = false; if (hit) { hit = null; hideGraphTip(canvas); repaint(); } else hideGraphTip(canvas); }
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; move(e); });
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointercancel', leave);
  canvas.addEventListener('pointerdown', (e) => {                      // touch (the iPad): a tap toggles the tip
    if (e.pointerType !== 'touch') return;
    const r = canvas.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
    const was = idOf(hit); pinned = true; inside = true;
    const now = idOf(find());
    if (now && now === was) { pinned = false; inside = false; hit = null; hideGraphTip(canvas); repaint(); }
    else repaint();
  });
  canvas.__lwHover = { get hit() { return hit; }, move, leave };      // the proof drives it without a real pointer
  return { set, hit: () => hit, clear: leave, get plot() { return rect; } };
}

/** fitText(g, txt, x, y, rect, align, clip) — every glyph left in a canvas is MEASURED before it is drawn.
 *  One that fits is nudged until it is wholly inside rect; one that cannot fit is dropped — unless `clip`,
 *  when it is cut to the width there is with an ellipsis (a caption is better short than gone).
 *  Returns the x actually used, or null if it was dropped. */
export function fitText(g, txt, x, y, rect, align = 'left', clip = false) {
  if (!rect) { g.textAlign = align; g.fillText(txt, x, y); return x; }
  const room = rect.x1 - rect.x0;
  let w = g.measureText(txt).width;
  if (y < rect.y0 - 1 || y > rect.y1 + 1) return null;
  if (w > room) {
    if (!clip || room < 12) return null;
    let s = txt;
    while (s.length > 1 && g.measureText(s + '…').width > room) s = s.slice(0, -1);
    txt = s + '…'; w = g.measureText(txt).width;
  }
  let L = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  if (L < rect.x0) L = rect.x0;
  if (L + w > rect.x1) L = rect.x1 - w;
  g.textAlign = 'left'; g.fillText(txt, L, y);
  return L;
}

/* ── the theme's own ink on a canvas ────────────────────────────────────────────────────────────
 * A CANVAS HAS NO THEME.  Rules written rgba(255,255,255,…) are right on the dark ground and white
 * on white on the light one.  Let the context itself parse the token (it is a CSS colour parser),
 * exactly as spectrum.js has done since wave 44 — --dim is rated ≥ 4.5 : 1 on the card in both themes. */
export function cssRGB(g, name, fallback) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  const keep = g.fillStyle;
  g.fillStyle = fallback; if (v) { try { g.fillStyle = v; } catch (e) { /* unparseable: the fallback stands */ } }
  const t = String(g.fillStyle); g.fillStyle = keep;
  let m = /^#([0-9a-f]{6})$/i.exec(t);
  if (m) { const k = parseInt(m[1], 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; }
  m = /^#([0-9a-f]{3})$/i.exec(t);
  if (m) return [0, 1, 2].map((i) => parseInt(m[1][i] + m[1][i], 16));
  m = /rgba?\(([^)]+)\)/i.exec(t);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0] | 0, p[1] | 0, p[2] | 0]; }
  return [255, 255, 255];
}
/** themeInk(g) → { ink(a), fg(a), INK, FG } — the muted ink and the foreground of THIS theme */
export function themeInk(g) {
  const I = cssRGB(g, '--dim', '#b8b8b8'), F = cssRGB(g, '--fg', '#ffffff');
  return { INK: I, FG: F,
    ink: (a = 1) => `rgba(${I[0]},${I[1]},${I[2]},${a})`,
    fg: (a = 1) => `rgba(${F[0]},${F[1]},${F[2]},${a})` };
}
