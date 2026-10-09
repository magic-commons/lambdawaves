/* panels/ramp.js — THE RAMP EDITOR: a colour ramp as stops on a strip (docs/PANEL-RAMP.md).
 *
 * λWAVES' palette editor (lab/paletteview.js) made generic, on the kit's palette.js (PRESETS, OKLab, toLUT, cyclic).  The strip IS the ramp: its left
 * edge is 0 and its right edge 1, and when the ramp is CYCLIC it wraps there, so a seam is read and a ring beside it shows the same ramp round.  Stops are handles:
 * drag one to move it, tap one to select it (its colour is the swatch below: tap = the platform's chooser, drag = its hue), drag it off the strip, or tap its
 * armed × twice, to remove it; click the strip to add a stop (it takes the ramp's colour there, so the picture does not move); the stepper walks the
 * presets; blending is OKLab (a straight RGB blend between two saturated hues passes through a muddy grey, and on a cyclic ramp that reads as a false
 * dark band).  What the ends MEAN is the app's: λWAVES' −π … +π and "SEAM at ±π", EARTH's colormap units, BASINS' escape count come in as `labels`;
 * the defaults are the plain 0 … 1.
 *
 *   createRampPanel({ rack, ramp: port, cyclic, labels, … }) → api     a rack card (or `parent: node`)
 *   createRampView(parent, options) → api                              the rows, built now
 *
 * THE PORT (the app's)
 *   get()                  → { stops: [{ at, rgb }], preset?: id }   at 0..1, rgb 0..1
 *   set(stops, { preset?, live })                                       every change; `live` is true while a handle is under the hand
 *   lut?(Float32Array, n)  the ramp as a lookup table (RGBA floats), on every change and at build: λWAVES' api.setLUT
 *   subscribe?(fn) → off   the app changed the ramp itself (a preset it loaded, a project)
 * options: cyclic (true: a seam, a ring, wrapping handles; false: a linear ramp that holds its end colours), labels, n (the table's size, 256), cap (the most
 *   stops, 16), min (the fewest, 2), presets (default palette.js PRESETS: { id, label, stops }), ring (false: no ring), seamTol (0.06), project (false: none),
 *   history, id, title, side, open, glyph, action (the key table's id for the card), hint, eager, parent.
 * labels: { ticks: [[at, text], …], seam, seamOk, seamWarn, at (the field's name), note, fmt(at) → text, ring }.
 *
 * THE KIT'S LAWS HERE.  A handle's drag is core/pointer.js drag (the pointer that began it owns it; Escape, a cancel and a hidden page put the stop back); writes
 * ride the frame; no poller; the controls are the kit's (stepper, number, hueSwatch, chipStrip's armed ×, trig, knob); the strip is a gradient and the handles
 * are buttons, so every press is hit-testable and every handle has keys (← → one hundredth, Shift an eighth of that, Page ten, Home and End, Delete twice).
 * The project part and the history domain are `ramp` (named for the card's `id`; a gesture is one row, named for the handle it began on).  Pure parts, for tests: rampLUT, rampGradient,
 * normalizeStops, addStop, removeStop, rotateStops, reverseStops, seamOf. */
import { el, label, ariaLabel, hint, trig, knob, readout, stepper, number, hueSwatch, rgbCss, chipStrip, setKnobLaw } from '../kit.js';
import { drag } from '../core/pointer.js';
import { frame } from '../core/frame.js';
import { setVar, setAttr, rect } from '../core/perf.js';
import { registerProjectPart } from '../core/project.js';
import { PRESETS, PRESET_BY_ID, rgbToOklab, oklabToRgb, cyclic as paletteSeam } from '../palette.js';
import { ARM_MS } from '../controls/list.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const TOP = 0.9999;                                  // a cyclic stop never sits on the wrap itself (λWAVES paletteview.js pos())
export const OFF_STRIP = 28;                         // px beyond the strip's edge where a dragged handle is "off the strip" (it is removed on release)
let uid = 0;

/* ── the pure part ───────────────────────────────────────────────────────────────────────────────────────── */
/** normalizeStops(stops, cyclic) → sorted copies, `at` wrapped (cyclic) or clamped (linear), rgb clamped; never empty */
export function normalizeStops(stops, cyclic = true) {
  const s = (stops || []).map((x) => ({ at: cyclic ? ((x.at % 1) + 1) % 1 : clamp01(x.at), rgb: x.rgb.slice(0, 3).map(clamp01) })).sort((a, b) => a.at - b.at);
  return s.length ? s : [{ at: 0, rgb: [1, 1, 1] }];
}
/** rampLUT(stops, n = 256, cyclic = true, out) → Float32Array(n * 4), OKLab between neighbours.  Cyclic: entry i is at i / n and the last stop blends round to the first
 *  (at n = 256 this is palette.js toLUT, bit for bit).  Linear: entry i is at i / (n − 1) and the ends hold their colours. */
export function rampLUT(stops, n = 256, cyclic = true, out) {
  const s = normalizeStops(stops, cyclic), lut = out && out.length >= n * 4 ? out : new Float32Array(n * 4), labs = s.map((x) => rgbToOklab(x.rgb));
  for (let i = 0; i < n; i++) {
    const c = blendAt(s, labs, cyclic ? i / n : (n > 1 ? i / (n - 1) : 0), cyclic);
    lut[i * 4] = c[0]; lut[i * 4 + 1] = c[1]; lut[i * 4 + 2] = c[2]; lut[i * 4 + 3] = 1;
  }
  return lut;
}
/** the ramp's colour at u (stops sorted and normalized, labs their OKLab): the one blend rampLUT and a new stop share */
function blendAt(s, labs, u, cyclic) {
  let a, b, f, k = -1;
  for (let j = 0; j < s.length; j++) if (s[j].at <= u) k = j;
  if (cyclic) {
    a = k < 0 ? s.length - 1 : k; b = (a + 1) % s.length;
    let span = s[b].at - s[a].at; if (span <= 0) span += 1;
    let d = u - s[a].at; if (d < 0) d += 1;
    f = span > 0 ? d / span : 0;
  } else if (k < 0) { a = b = 0; f = 0; } else if (k >= s.length - 1) { a = b = s.length - 1; f = 0; } else { a = k; b = k + 1; const span = s[b].at - s[a].at; f = span > 0 ? (u - s[a].at) / span : 0; }
  return oklabToRgb([labs[a][0] + (labs[b][0] - labs[a][0]) * f, labs[a][1] + (labs[b][1] - labs[a][1]) * f, labs[a][2] + (labs[b][2] - labs[a][2]) * f]);
}
const to255 = (c) => Math.round(clamp01(c) * 255);
/** rampGradient(lut, n = 33, dir = '90deg') → a CSS linear-gradient of the table, n samples (the strip) */
export function rampGradient(lut, n = 33, dir = '90deg') {
  const total = lut.length / 4, parts = [];
  for (let k = 0; k < n; k++) { const i = Math.min(total - 1, Math.round(k * (total - 1) / (n - 1))) * 4; parts.push('rgb(' + to255(lut[i]) + ',' + to255(lut[i + 1]) + ',' + to255(lut[i + 2]) + ') ' + +(k * 100 / (n - 1)).toFixed(2) + '%'); }
  return 'linear-gradient(' + dir + ',' + parts.join(',') + ')';
}
/** rampConic(lut, n = 49) → the same table round a circle, starting at nine o'clock and going clockwise (λWAVES' ring: arg −π at the left) */
export function rampConic(lut, n = 49) {
  const total = lut.length / 4, parts = [];
  for (let k = 0; k < n; k++) { const i = Math.min(total - 1, Math.round(k * (total - 1) / (n - 1))) * 4; parts.push('rgb(' + to255(lut[i]) + ',' + to255(lut[i + 1]) + ',' + to255(lut[i + 2]) + ') ' + +(k * 360 / (n - 1)).toFixed(2) + 'deg'); }
  return 'conic-gradient(from 270deg,' + parts.join(',') + ')';
}
/** seamOf(stops) → how far the ramp is from closing on itself (OKLab distance, 0 = closed): palette.js cyclic() */
export const seamOf = (stops) => paletteSeam(normalizeStops(stops, true));
/** the ramp's colour at `at` (a table lookup) */
const colourAt = (stops, at, cyc) => { const s = normalizeStops(stops, cyc); return blendAt(s, s.map((x) => rgbToOklab(x.rgb)), cyc ? clamp01(at) % 1 : clamp01(at), cyc); };
/** addStop(stops, at, rgb) → a new list with the stop (the colour of the ramp there when none is given) */
export function addStop(stops, at, rgb, cyc = true) { const u = cyc ? clamp01(at) % 1 : clamp01(at); return stops.concat([{ at: u, rgb: (rgb || colourAt(stops, u, cyc)).slice(0, 3) }]); }
/** removeStop(stops, index, min = 2) → a new list, or the same one when it is already at the fewest */
export const removeStop = (stops, i, min = 2) => (stops.length <= min || i < 0 || i >= stops.length ? stops : stops.filter((_, k) => k !== i));
/** rotateStops(stops, f) → every stop carried round by a fraction f of the ramp */
export const rotateStops = (stops, f) => stops.map((s) => ({ at: (((s.at + f) % 1) + 1) % 1, rgb: s.rgb.slice() }));
/** reverseStops(stops, cyc) → the ramp run backwards (λWAVES: at ← (1 − at) mod 1; a linear ramp: 1 − at) */
export const reverseStops = (stops, cyc = true) => stops.map((s) => ({ at: cyc ? (1 - s.at) % 1 : 1 - s.at, rgb: s.rgb.slice() }));
const cloneStops = (stops) => (stops || []).map((s) => ({ at: s.at, rgb: s.rgb.slice() }));
const sameStops = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── the view ────────────────────────────────────────────────────────────────────────────────────────────── */
const DEFAULT_TICKS = [[0, '0'], [0.25, '0.25'], [0.5, '0.5'], [0.75, '0.75'], [1, '1']];

export function createRampView(parent, o = {}) {
  const port = o.ramp;
  if (!port || typeof port.get !== 'function' || typeof port.set !== 'function') throw new TypeError('panels/ramp: the port needs get() and set()');
  const cyc = o.cyclic !== false, N = o.n || 256, cap = o.cap || 16, minStops = o.min || 2, tol = Number.isFinite(o.seamTol) ? o.seamTol : 0.06;
  const L = { ticks: cyc ? DEFAULT_TICKS : DEFAULT_TICKS, seam: 'SEAM', seamOk: 'closes cleanly', seamWarn: 'a visible seam where the ramp wraps', at: 'AT', fmt: (u) => u.toFixed(3), ...(o.labels || {}) };
  const presets = (o.presets || PRESETS).map((p) => ({ id: p.id, label: p.label, stops: p.stops }));
  const byId = new Map(presets.map((p) => [p.id, p]));
  const life = new AbortController(), key = 'ramp:' + (++uid);
  const root = el('div', 'mir-ramp', parent);
  root.dataset.cyclic = String(cyc);

  /* the state: stops with identity (a handle keeps its stop while it is dragged past another) */
  let n = 0, S = [], sel = null, preset = null, armedTimer = 0;
  const mk = (s) => ({ id: ++n, at: s.at, rgb: s.rgb.slice() });
  const out = () => normalizeStops(S.map((s) => ({ at: s.at, rgb: s.rgb })), cyc);
  const posOf = (u) => (cyc ? Math.min(TOP, clamp01(u)) : clamp01(u));
  const stopById = (id) => S.find((s) => s.id === id) || null;
  const handles = new Map();                                                  // stop id → button

  /* ── the preset row ── */
  const top = el('div', 'mir-ramp-presets', root);
  const stp = stepper({ aria: 'Ramp preset', items: presets.map((p) => ({ id: p.id, label: p.label })), value: null, cls: 'mir-ramp-step', onChange: (id) => loadPreset(id) });
  top.appendChild(stp.root);
  const reset = trig({ label: 'RESET', cls: 'mir-ramp-reset', title: 'Reload the chosen preset', onFire: () => { if (preset) loadPreset(preset); } });
  top.appendChild(reset.root);
  const seam = cyc ? readout({ label: L.seam, value: '—', sub: '' }) : null;
  if (seam) { seam.root.classList.add('mir-ramp-seam'); root.appendChild(seam.root); }

  /* ── the strip, its ticks and the ring ── */
  const wrap = el('div', 'mir-ramp-wrap', root);
  const stage = el('div', 'mir-ramp-stage', wrap);
  const strip = el('div', 'mir-ramp-strip', stage); strip.setAttribute('role', 'group');
  ariaLabel(strip, 'Ramp strip — click to add a stop'); hint(strip, 'Click the strip to add a stop; drag a stop to move it, off the strip to remove it');
  const ticks = el('div', 'mir-ramp-ticks', stage);
  for (const [u, text] of L.ticks) { const t = el('span', 'mir-ramp-tick', ticks, text); t.style.setProperty('--at', String(u)); }
  const ring = cyc && o.ring !== false ? el('div', 'mir-ramp-ring', wrap) : null;
  if (ring) { ring.setAttribute('aria-hidden', 'true'); }

  /* ── the selected stop: its colour, its place, its armed × ── */
  const selRow = el('div', 'mir-ramp-sel', root);
  const swatch = hueSwatch({ rgb: [0.5, 0.5, 0.5], label: 'Stop colour — tap for the chooser, drag up or down to turn its hue',
    onInput: (rgb) => { const s = stopById(sel); if (s) { s.rgb = rgb.slice(); push(true); } }, onChange: () => push(false) });
  swatch.root.classList.add('mir-ramp-swatch'); selRow.appendChild(swatch.root);
  const atField = number({ label: L.at, aria: 'Stop place', min: 0, max: 1, step: 0.001, digits: 3, fmt: L.fmt, value: 0,
    onInput: (v) => { const s = stopById(sel); if (s) { s.at = posOf(v); push(true); } }, onChange: () => push(false) });
  atField.root.classList.add('mir-ramp-at'); selRow.appendChild(atField.root);
  const rm = chipStrip({ id: 'ramp', title: 'ramp', flow: 'row', chips: [{ name: 'remove', kind: 'close', glyph: 'close', label: 'Remove this stop', hint: 'Remove the selected stop (tap twice)',
    confirm: { text: 'sure?', ms: ARM_MS, label: 'Remove this stop — tap again to confirm' } }], onChip: () => removeSel() });
  rm.el.classList.add('mir-ramp-remove'); selRow.appendChild(rm.el);

  /* ── the verbs ── */
  const verbs = el('div', 'mir-ramp-verbs', root);
  verbs.appendChild(trig({ label: 'ADD', title: 'Add a stop opposite the selected one', onFire: () => { const s = stopById(sel); addAt(s ? (s.at + 0.5) % 1 : 0.5, true); } }).root);
  verbs.appendChild(trig({ label: 'REVERSE', title: 'Run the ramp backwards', onFire: () => { S = S.map((s, i) => ({ ...s, at: reverseStops([s], cyc)[0].at })); push(false); } }).root);
  if (cyc) {
    const rot = knob({ label: 'ROTATE', min: 0, max: 2 * Math.PI, value: 0, wrap: true, fmt: () => 'turn', title: 'Carry every stop round the ramp (a jog wheel: it holds no value)',
      onDelta: (d) => { const f = d / (2 * Math.PI); S = S.map((s) => ({ ...s, at: posOf((((s.at + f) % 1) + 1) % 1) })); push(true); } });
    verbs.appendChild(rot.root);
  }
  if (L.note) el('div', 'mir-ramp-note', root, L.note);

  /* ── the stops as handles ── */
  function handle(s) {
    const b = el('button', 'mir-ramp-stop', strip); b.type = 'button'; b.dataset.stop = String(s.id);
    b.setAttribute('role', 'slider'); b.setAttribute('aria-valuemin', '0'); b.setAttribute('aria-valuemax', '1');
    const pin = el('i', 'mir-ramp-pin', b); pin.setAttribute('aria-hidden', 'true');
    let was = null;
    b.addEventListener('pointerdown', (e) => { if (e.button === 0) select(s.id); }, { signal: life.signal });
    b.addEventListener('focus', () => select(s.id), { signal: life.signal });
    drag(b, { slop: 3,
      onStart() { was = s.at; b.classList.add('drag'); },
      onMove(p) {
        const r = rect(strip), u = (p.x - r.left) / Math.max(1, r.width);
        s.at = posOf(u);
        const off = p.y < r.top - OFF_STRIP || p.y > r.bottom + OFF_STRIP;
        b.toggleAttribute('data-removing', off && S.length > minStops);
        push(true);
      },
      onEnd() { b.classList.remove('drag'); const gone = b.hasAttribute('data-removing'); b.removeAttribute('data-removing'); if (gone) removeStopId(s.id); else push(false); },
      onCancel() { b.classList.remove('drag'); b.removeAttribute('data-removing'); s.at = was; push(false); } });
    b.addEventListener('keydown', (e) => {
      const fine = e.shiftKey ? setKnobLaw().keyFine : 1, step = 0.01 * fine * (e.code === 'PageUp' || e.code === 'PageDown' ? 10 : 1);
      const dir = e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'PageUp' ? 1 : e.code === 'ArrowLeft' || e.code === 'ArrowDown' || e.code === 'PageDown' ? -1 : 0;
      if (dir) { e.preventDefault(); s.at = posOf(s.at + dir * step); push(false); return; }
      if (e.code === 'Home') { e.preventDefault(); s.at = 0; push(false); } else if (e.code === 'End') { e.preventDefault(); s.at = cyc ? TOP : 1; push(false); }
      else if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); const c = rm.chip('remove'); select(s.id); if (c) c.click(); }
    }, { signal: life.signal });
    handles.set(s.id, b);
    return b;
  }
  strip.addEventListener('click', (e) => {
    if (e.target !== strip || S.length >= cap) return;
    const r = rect(strip); addAt((e.clientX - r.left) / Math.max(1, r.width), false);
  }, { signal: life.signal });

  function select(id) { if (sel === id) return; sel = id; paintSel(); for (const [k, b] of handles) b.classList.toggle('sel', k === id); }
  function addAt(u, keepSel) {
    if (S.length >= cap) return;
    const s = mk({ at: posOf(u), rgb: colourAt(out(), u, cyc) });
    S.push(s); sel = s.id; build(); push(false);
  }
  function removeStopId(id) { if (S.length <= minStops) return; S = S.filter((s) => s.id !== id); if (sel === id) sel = S[0] ? S[0].id : null; build(); push(false); }
  function removeSel() { if (sel !== null) removeStopId(sel); }
  /** one handle per stop, rebuilt when the set of stops changes (never while one is dragged: a drag moves `at`, not the set) */
  function build() {
    for (const b of handles.values()) b.remove();
    handles.clear();
    S.forEach((s, i) => { const b = handle(s); b.classList.toggle('sel', s.id === sel); });
    paintSel();
  }
  function paintSel() {
    const s = stopById(sel);
    selRow.dataset.empty = s ? 'false' : 'true';
    if (!s) return;
    if (!swatch.dragging()) swatch.set(s.rgb);
    atField.set(s.at);
    rm.setDisabled('remove', S.length <= minStops);
    root.dataset.count = String(S.length);
  }

  /* ── painting and telling the app ── */
  const lutCache = new Float32Array(N * 4);
  function paintNow(live) {
    const o_ = out(), lut = rampLUT(o_, N, cyc, lutCache);
    setVar(strip, '--ramp-gradient', rampGradient(lut, 33));
    if (ring) setVar(ring, '--ramp-conic', rampConic(lut, 49));
    const sorted = [...S].sort((a, b) => a.at - b.at);
    sorted.forEach((s, i) => {
      const b = handles.get(s.id); if (!b) return;
      setVar(b, '--at', +s.at.toFixed(5)); setVar(b, '--stop', rgbCss(s.rgb));
      setAttr(b, 'aria-valuenow', String(+s.at.toFixed(4))); setAttr(b, 'aria-valuetext', L.fmt(s.at));
      ariaLabel(b, 'Stop {n} of {total}', { n: i + 1, total: S.length });
    });
    if (seam) { const d = seamOf(o_), ok = d < tol; seam.set(d.toFixed(4), ok ? 'ok' : 'warn'); seam.setSub(ok ? L.seamOk : L.seamWarn); }
    const sel_ = stopById(sel); if (sel_) { if (!swatch.dragging()) swatch.set(sel_.rgb); atField.set(sel_.at); }
    return { stops: o_, lut };
  }
  function push(live) {
    const { stops, lut } = paintNow(live);
    port.set(stops, { preset, live: !!live });
    if (typeof port.lut === 'function') port.lut(lut, N);
    notifyPart();
  }
  const partWatchers = new Set(), notifyPart = () => { for (const f of partWatchers) { try { f(); } catch (_) { /* a watcher */ } } };
  function loadStops(stops, id) {
    S = cloneStops(normalizeStops(stops, cyc)).map(mk); sel = S[0] ? S[0].id : null; preset = id || null;
    if (id && byId.has(id)) stp.set(id);
    build(); paintNow(false);
  }
  function loadPreset(id) { const p = byId.get(id); if (!p) return false; loadStops(p.stops, id); preset = id; const { stops, lut } = paintNow(false); port.set(stops, { preset: id, live: false }); if (typeof port.lut === 'function') port.lut(lut, N); notifyPart(); return true; }
  /** the app changed the ramp itself */
  function pull() { const g = port.get() || {}; if (g.stops && !sameStops(normalizeStops(g.stops, cyc), out())) { loadStops(g.stops, g.preset); } else if (g.preset && g.preset !== preset && byId.has(g.preset)) { preset = g.preset; stp.set(g.preset); } }
  const request = () => { if (!life.signal.aborted) frame.coalesce(key, pull); };
  const offSub = typeof port.subscribe === 'function' ? port.subscribe(request) : null;
  { const g = port.get() || {}; loadStops(g.stops && g.stops.length ? g.stops : (presets[0] ? presets[0].stops : []), g.preset); if (typeof port.lut === 'function') port.lut(rampLUT(out(), N, cyc), N); }

  return {
    root, strip, layout: 'ramp',
    stops: () => out(), selected: () => { const i = [...S].sort((a, b) => a.at - b.at).findIndex((s) => s.id === sel); return i; },
    toLUT: (size = N) => rampLUT(out(), size, cyc),
    load: (stops, id) => { loadStops(stops, id); push(false); }, preset: (id) => loadPreset(id), presetId: () => preset,
    refresh: pull, seam: () => seamOf(out()), handle: (i) => { const s = [...S].sort((a, b) => a.at - b.at)[i]; return s ? handles.get(s.id) : null; },
    part: () => ({ capture: () => ({ stops: out().map((s) => ({ at: +s.at.toFixed(6), rgb: s.rgb.map((c) => +c.toFixed(6)) })), preset }),
      restore: (saved) => { if (saved && saved.stops) { loadStops(saved.stops, saved.preset); push(false); } },
      signature: () => JSON.stringify({ s: out(), p: preset }), subscribe: (fn) => { partWatchers.add(fn); return () => partWatchers.delete(fn); } }),
    destroy() { life.abort(); frame.cancel(key); if (offSub) { try { offSub(); } catch (_) { /* the port's */ } } clearTimeout(armedTimer); rm.destroy(); swatch.destroy && swatch.destroy(); root.remove(); },
  };
}

/* ── the card ────────────────────────────────────────────────────────────────────────────────────────────── */
/** createRampPanel(options) → api — the ramp editor as a rack card (`rack`) or in `parent`.  The project part and the history domain are named for the card (`id`, default `ramp`) and are made here. */
export function createRampPanel(o = {}) {
  const port = o.ramp;
  if (!port) throw new TypeError('panels/ramp: createRampPanel needs a port (`ramp`)');
  const id = o.id || 'ramp', cyc = o.cyclic !== false;
  let view = null;
  const snap = () => { if (view) return view.part().capture(); const g = port.get() || {}; return { stops: normalizeStops(g.stops || [], cyc).map((s) => ({ at: s.at, rgb: s.rgb })), preset: g.preset || null }; };
  const apply = (s) => { if (view) view.part().restore(s); else port.set(normalizeStops(s.stops, cyc), { preset: s.preset || null, live: false }); };
  const api = {
    id, get view() { return view; }, get root() { return view ? view.root : null; },
    stops: () => (view ? view.stops() : normalizeStops((port.get() || {}).stops || [], cyc)), toLUT: (n = o.n || 256) => (view ? view.toLUT(n) : rampLUT((port.get() || {}).stops || [], n, cyc)),
    snapshot: snap, restore: apply, part: () => ({ capture: snap, restore: (saved) => { if (saved) apply(saved); }, signature: () => JSON.stringify(snap()), subscribe: (fn) => (typeof port.subscribe === 'function' ? port.subscribe(fn) : () => {}) }),
    destroy() { if (offPart) offPart(); if (offHist) offHist(); if (view) view.destroy(); view = null; },
  };
  let offPart = null, offHist = null;
  if (o.project !== false) { const reg = o.project && typeof o.project.register === 'function' ? o.project.register : registerProjectPart; offPart = reg(o.projectName || id, api.part()); }
  if (o.history) offHist = o.history.register(o.historyName || id, { read: snap, write: apply });
  const build = (body) => { view = createRampView(body, o); };
  if (o.rack) o.rack.register({ id, title: o.title || 'RAMP', side: o.side || 'right', open: o.open, glyph: o.glyph || 'grade', hint: o.hint || 'the colour ramp: stops on a strip', action: o.action, eager: o.eager, build });
  else if (o.parent) build(o.parent);
  return api;
}
