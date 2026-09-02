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
    e.preventDefault(); dial.setPointerCapture(e.pointerId);
    dragging = true; root.classList.add('drag'); p0 = norm(v); x0 = e.clientX; y0 = e.clientY; acc = 0;
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
  const end = () => { if (!dragging) return; dragging = false; root.classList.remove('drag'); if (o.onChange && !o.onDelta) o.onChange(v); };
  dial.addEventListener('pointerup', end); dial.addEventListener('pointercancel', end);
  const tap = tapWatcher(() => { if (o.onDelta) { if (o.onReset) o.onReset(); return; } v = def; paint(); if (o.onInput) o.onInput(v); if (o.onChange) o.onChange(v); });
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
  let v = o.value, def = o.value, dragging = false;
  const lo = o.min, hi = o.max;
  const fmt = o.fmt || ((x) => x.toFixed(3));
  const paint = () => { const p = clamp01((v - lo) / (hi - lo)); root.style.setProperty('--fill', p); val.textContent = fmt(v); };
  const fromEvent = (e) => { const r = root.getBoundingClientRect(); return lo + clamp01((e.clientX - r.left) / Math.max(1, r.width)) * (hi - lo); };
  root.addEventListener('pointerdown', (e) => { e.preventDefault(); root.setPointerCapture(e.pointerId); dragging = true; root.classList.add('drag'); tap(); v = fromEvent(e); paint(); if (o.onInput) o.onInput(v); });
  root.addEventListener('pointermove', (e) => { if (!dragging) return; v = fromEvent(e); paint(); if (o.onInput) o.onInput(v); });
  const end = () => { if (!dragging) return; dragging = false; root.classList.remove('drag'); if (o.onChange) o.onChange(v); };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
  const tap = tapWatcher(() => { v = def; paint(); if (o.onInput) o.onInput(v); if (o.onChange) o.onChange(v); });
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
  const head = el('header', 'dev-head', root);
  const idz = el('div', 'dev-id', head);
  el('div', 'dev-eyebrow', idz, o.eyebrow || '');
  el('h2', 'dev-title', idz, o.title);
  const stat = el('div', 'dev-stat', head, o.status || '');
  const util = el('div', 'dev-util', head);
  const fold = el('button', 'dev-fold', util, '▾'); fold.type = 'button'; fold.title = 'fold / unfold (layout only — never touches the state)';
  const body = el('div', 'dev-body', root);
  let folded = false;
  const setFold = (on) => { folded = on; root.classList.toggle('folded', on); fold.textContent = on ? '▸' : '▾'; };
  fold.addEventListener('click', () => setFold(!folded));
  head.addEventListener('dblclick', (e) => { if (e.target === fold) return; setFold(!folded); });
  return { root, body, setStatus(t, cls) { if (stat.textContent !== t) stat.textContent = t; if (cls !== undefined) stat.className = 'dev-stat ' + cls; }, fold: setFold, row(cls) { return el('div', 'row' + (cls ? ' ' + cls : ''), body); } };
}

/** a labelled group inside a device body */
export function group(parent, label) {
  const g = el('div', 'grp', parent);
  if (label) el('div', 'grp-lbl', g, label);
  return g;
}
export const N_COLOR = ['', 'var(--n1)', 'var(--n2)', 'var(--n3)', 'var(--n4)', 'var(--n5)', 'var(--n6)'];
export const N_RGB = ['', [255, 226, 170], [120, 225, 240], [230, 160, 240], [255, 150, 90], [140, 220, 140], [180, 160, 255]];
