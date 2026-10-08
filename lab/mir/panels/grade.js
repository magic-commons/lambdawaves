/* panels/grade.js — THE GRADE PANEL: the master picture controls, one window over the whole picture in every app (docs/PANEL-GRADE.md).
 *
 * Josh, 2026-10-02: "Alpha blending (Like a master Hue, Brightness, and whatever)".  Every app hand-builds this row (the census, §3 "Master
 * grade": NEBULA's GRADE from descriptors, 17 parameters, N/panels.js:13–17; SOLEIL's MASTER, S/main.js:1025–1040: EXPOSURE, GAMMA,
 * SATURATION, HUE, CONTRAST, TONEMAP, INVERT; BASINS' BRIGHTNESS and GLOBAL HUE, BS/colour-window.js:56–68, with INVERT as a glyph;
 * λWAVES' LOOK; AUTOMATA's DISPLAY; POLAR's EXPOSURE).  Built once here, only from the control language (docs/CONTROLS.md):
 *
 *   EXPOSURE · CONTRAST · GAMMA · SATURATION   solid knobs (Josh: grade amounts are "the ol' regular knobs")
 *   BLACK · WHITE                              one range slider (the input levels: two thumbs that never cross)
 *   OPACITY                                    the window's lane slider: the picture's one principal amount
 *   HUE · INVERT                               an arc in its own colour · a switch whose glyph is the state (BASINS' icon, no lamp)
 *   BLEND                                      a stepper ‹ NAME › over the CSS blend modes (a tap on the name opens the list)
 *   the app's own rows                         by descriptor (NEBULA's VIBRANCE, TEMPERATURE, TINT, SHADE, DITHER …), grouped
 *
 *   createGradePanel({ rack, port | canvas, mod, history, project, rows, hide, ranges, … }) → { id, model, view(), params(), values(), sync(), destroy() }
 *   createGradeView(parent, options) → { root, model, filter, values(), get(id), set(id, v), home(), params(), controls, sync(), destroy() }
 *   createGradeModel(options) → the values and where they go, with no DOM (the panel makes it at once, so a closed card still grades)
 *
 * THE TWO ROADS
 *   canvas   no engine: picture-filter.js puts one SVG filter on the canvas (shared with CURVES on the same canvas), plus CSS opacity and
 *            mix-blend-mode.  Nothing else is needed.
 *   port     the app takes the values into its own shader: { set(id, v), get?(id), subscribe?(fn) → off, ranges?, rows?, hide?, modIds? }.
 *            The panel calls set(id, v) on every change (ids: exposure contrast gamma saturation hue black white opacity blend invert, and
 *            the rows' own); with get() the app's number is the truth and subscribe() says when it moved.  No filter is installed.
 * MODULATION  every continuous control is a target `grade.<id>` (`modPrefix` for two on a page; the install's `roots` must name it).  `mod` is
 *   installModulation()'s result: the targets are added when the card is built, and a hand on a routed control writes its base (mod.hand).
 * PROJECT AND HISTORY  the values ride in the project as a part named `part` (default 'grade'; a routed one as its base) unless
 *   `project: false`; with `history` they are one snapshot domain, so a gesture is one row, CONTROL · WINDOW.
 * IDLE  nothing is polled: a change the app makes is a notice (subscribe), and one coalesced frame repaints the controls after it. */
import { el, label, sw } from '../kit.js';
import { control } from '../controls/factory.js';
import { frame } from '../core/frame.js';
import { registerProjectPart } from '../core/project.js';
import { handWrite } from '../modulation/registry.js';
import { pictureFilter, GRADE_HOME, BLEND_MODES } from './picture-filter.js';

let uid = 0;
const deg = (v) => Math.round((((v % 360) + 360) % 360)) + '°';
const pct = (v) => Math.round(v * 100) + ' %';
const f2 = (v) => (+v).toFixed(2);

/** the master rows: each id's words, range and format (an app's `ranges` override any of them, in its own units); home is GRADE_HOME's */
export const GRADE_VOCAB = Object.freeze({
  exposure: { label: 'EXPOSURE', min: 0.25, max: 4, log: true, fmt: (v) => f2(v) + '×', hint: 'EXPOSURE — the picture multiplied, before the levels; double-tap for 1×' },
  contrast: { label: 'CONTRAST', min: 0.5, max: 2, log: true, fmt: f2, hint: 'CONTRAST — about mid-grey; double-tap for 1' },
  gamma: { label: 'GAMMA', min: 0.5, max: 2.2, log: true, fmt: f2, hint: 'GAMMA — above 1 lifts the middle tones, below 1 sinks them; double-tap for 1' },
  saturation: { label: 'SATURATION', min: 0, max: 2, fmt: f2, hint: 'SATURATION — 0 is grey, 1 the picture as it is' },
  hue: { label: 'HUE', min: 0, max: 360, wrap: true, fmt: deg, hint: 'HUE — every colour turned together, all the way round' },
  black: { label: 'BLACK', min: 0, max: 1, fmt: f2, hint: 'BLACK — what is this dark or darker becomes black' },
  white: { label: 'WHITE', min: 0, max: 1, fmt: f2, hint: 'WHITE — what is this bright or brighter becomes white' },
  opacity: { label: 'OPACITY', min: 0, max: 1, fmt: pct, hint: 'OPACITY — how much of the picture is laid over what is under it' },
  blend: { label: 'BLEND', hint: 'BLEND — how the picture is laid over what is under it' },
  invert: { label: 'INVERT', hint: 'INVERT — the negative of the picture' },
});
export const GRADE_IDS = Object.freeze(Object.keys(GRADE_VOCAB));
export const CONTINUOUS = Object.freeze(['exposure', 'contrast', 'gamma', 'saturation', 'hue', 'black', 'white', 'opacity']);
/** blendItems(modes) → the stepper's items: [{ id: 'color-dodge', label: 'COLOR DODGE' }, …] */
export const blendItems = (modes = BLEND_MODES) => modes.map((m) => (typeof m === 'string' ? { id: m, label: m.toUpperCase().replace(/-/g, ' ') } : m));
/** gradeTargetId(prefix, id) → 'grade.exposure' — a registry segment is lowercase alphanumeric */
export const gradeTargetId = (prefix, id) => prefix + '.' + String(id).toLowerCase().replace(/[^a-z0-9]/g, '');
/** describeGrade(id, ranges) → the id's record: the kit's words and range with the app's laid over, home included */
export function describeGrade(id, ranges = {}) {
  return { id, home: GRADE_HOME[id], ...(GRADE_VOCAB[id] || {}), ...((ranges && ranges[id]) || {}) };
}

/* ═══ THE MODEL: the values, where they go, the project and the history ═══════════════════════════════════════════════════════════════ */
export function createGradeModel(o = {}) {
  const port = o.port || null;
  if (!port && !o.canvas) throw new TypeError('grade panel: needs a port { set(id, v) }, or a canvas for the zero-engine filter');
  const filter = port ? null : pictureFilter(o.canvas);
  const mod = o.mod || null;
  const prefix = o.modPrefix || o.part || o.id || 'grade';
  const ranges = { ...((port && port.ranges) || {}), ...(o.ranges || {}) };
  const hide = new Set([...((port && port.hide) || []), ...(o.hide || [])]);
  const extra = [...((port && port.rows) || []), ...(o.rows || [])];
  const xd = new Map(extra.map((d) => [d.id, d]));
  const D = (id) => (xd.has(id) ? xd.get(id) : describeGrade(id, ranges));
  const own = {};
  for (const id of GRADE_IDS) own[id] = describeGrade(id, ranges).home;
  for (const d of extra) own[d.id] = d.value ?? d.home ?? d.min;
  const fromPort = (id) => { if (!port || typeof port.get !== 'function') return undefined; const v = port.get(id); return v === undefined || v === null ? undefined : v; };
  /** the value now: the row's own getter, else the app's (port.get), else the panel's */
  const read = (id) => { const x = xd.get(id); if (x && typeof x.get === 'function') return x.get(); const v = fromPort(id); return v === undefined ? own[id] : v; };
  for (const id of Object.keys(own)) { const v = read(id); if (v !== undefined) own[id] = v; }
  const listeners = new Set();
  const emit = (id) => { for (const f of [...listeners]) f(id); };
  /** put a value where it goes: the row's own setter, or the app's port, or the picture filter */
  function put(id, v) {
    own[id] = v;
    const x = xd.get(id);
    if (x && typeof x.set === 'function') x.set(v);
    else if (port) { if (typeof port.set === 'function') port.set(id, v); }
    else if (id in GRADE_HOME) filter.setGrade({ [id]: v });
    emit(id);
  }
  const modId = (id) => (o.modIds && o.modIds[id]) || (port && port.modIds && port.modIds[id]) || gradeTargetId(prefix, id);
  const targetable = (id) => CONTINUOUS.includes(id) || xd.has(id);
  const routed = (id) => { if (!mod || !targetable(id)) return false; try { return !!mod.isModulated(modId(id)); } catch (_) { return false; } };   // the registry throws for an id it was not given yet
  const base = (id) => (routed(id) ? mod.baseOf(modId(id)) : read(id));
  /** the hand: a routed control's base through the registry (the law), else the value itself */
  const write = (id, v) => { if (routed(id) && handWrite(mod, modId(id), v)) { emit(id); return; } put(id, v); };
  if (filter) filter.setGrade(Object.fromEntries(Object.entries(own).filter(([k]) => k in GRADE_HOME)));
  /** the app changed a value itself (its notice): take it */
  const offPort = port && typeof port.subscribe === 'function' ? port.subscribe(() => { for (const id of Object.keys(own)) { const v = fromPort(id); if (v !== undefined) own[id] = v; } emit(null); }) : null;
  /** the values as data (the project part and the history row): a routed control is saved as its base */
  const values = () => { const out = {}; for (const id of Object.keys(own)) { const v = base(id); if (v !== undefined) out[id] = v; } return out; };
  const restore = (saved) => {
    for (const [id, v] of Object.entries(saved || {})) {
      if (!(id in own) || v === undefined) continue;
      if (!(routed(id) && handWrite(mod, modId(id), v))) put(id, v);
    }
    emit(null);
  };
  const homeOf = (id) => { const d = D(id); return d.home ?? own[id]; };
  const offs = [];
  const part = o.part || o.id || 'grade';
  if (o.project !== false) {
    const reg = o.project && typeof o.project.register === 'function' ? o.project.register : registerProjectPart;
    offs.push(reg(part, { capture: () => ({ v: 1, values: values() }), restore: (s) => { if (s && s.values) restore(s.values); },
      subscribe: (fn) => { const f = () => fn(); listeners.add(f); return () => listeners.delete(f); } }));
  }
  if (o.history && typeof o.history.register === 'function') offs.push(o.history.register(part, { read: values, write: restore }));
  return {
    port, filter, mod, prefix, ranges, hide, extra, part, D, read, put, write, base, routed, modId, values, restore,
    home() { restore(Object.fromEntries(Object.keys(own).map((id) => [id, homeOf(id)]))); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    destroy() { if (offPort) offPort(); for (const f of offs) { try { f(); } catch (_) { /* gone */ } } listeners.clear(); if (filter) filter.release(); },
  };
}

/* ═══ THE VIEW: the rows ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
export function createGradeView(parent, o = {}) {
  const ownModel = !o.model;
  const M = o.model || createGradeModel(o);
  const { mod, read, write, base, modId, D } = M;
  const key = 'mir.grade.sync.' + (++uid);
  const shown = (id) => !M.hide.has(id);
  const tgt = new Set();
  const routed = (id) => tgt.has(id) && M.routed(id);

  const root = el('div', 'mir-grade' + (o.cls ? ' ' + o.cls : ''), parent);
  const row = (cls, p = root) => el('div', 'grade-row ' + cls, p);
  const entries = [], targets = [];
  function add(parentEl, ids, c, readFn) {
    parentEl.appendChild(c.root);
    entries.push({ ids, c, read: readFn });
    if (c.targets && c.targets.length) {
      c.params().forEach((rec, i) => {
        const id = ids[i]; tgt.add(id);
        targets.push({ ...rec, id: modId(id), label: D(id).label || rec.label, get: () => read(id), set: (v) => M.put(id, v) });   // the registry writes the value; the hand writes through `write`
      });
    }
    return c;
  }
  /** a descriptor for control(): the id is the modulation id; every hand writes through `write` */
  const desc = (id, d, more) => ({ id: modId(id), label: d.label, hint: d.hint, min: d.min, max: d.max, home: d.home, log: !!d.log, step: d.step, fmt: d.fmt, unit: d.unit,
    value: read(id), get: () => read(id), set: (v) => write(id, v), ...more });
  const single = (id, parentEl, d, more) => {
    const c = control(desc(id, d, more));
    return add(parentEl, [id], c, () => read(id));
  };

  /* ── the tone: four solid knobs ── */
  const knobs = row('grade-knobs');
  for (const id of ['exposure', 'contrast', 'gamma', 'saturation']) if (shown(id)) single(id, knobs, D(id));
  if (!knobs.children.length) knobs.remove();

  /* ── the levels: BLACK · WHITE on one range slider ── */
  if (shown('black') && shown('white')) {
    const db = D('black'), dw = D('white');
    const c = control({ id: modId('levels'), ids: [modId('black'), modId('white')], type: 'range', label: 'BLACK · WHITE',
      hint: 'BLACK · WHITE — the input levels: below BLACK is black, above WHITE is white; double-tap a thumb to send it home',
      min: Math.min(db.min, dw.min), max: Math.max(db.max, dw.max), value: [read('black'), read('white')], home: [db.home, dw.home], minGap: o.levelsGap ?? 0.02, fmt: db.fmt,
      set: ([lo, hi]) => { if (lo !== base('black')) write('black', lo); if (hi !== base('white')) write('white', hi); } });
    add(row('grade-levels'), ['black', 'white'], c, () => [read('black'), read('white')]);
  }

  /* ── the amount: OPACITY, the window's lane slider ── */
  if (shown('opacity')) {
    const r = row('grade-amount');
    label(el('div', 'k-lbl grade-amount-lbl', r), D('opacity').label);         // the lane slider carries no word of its own (it is named where it sits)
    single('opacity', r, D('opacity'), { principal: true });
  }

  /* ── the turns: HUE (an arc in its own colour) and INVERT (the glyph is the state) ── */
  const turns = row('grade-turns');
  if (shown('hue')) single('hue', turns, D('hue'), { hue: true, wrap: true, ink: (v) => 'hsl(' + (((v % 360) + 360) % 360).toFixed(1) + ' 85% 62%)' });
  let inv = null;
  if (shown('invert')) {
    const d = D('invert');
    inv = sw({ label: d.label, title: d.hint, glyph: 'invertColors', value: !!read('invert'), cls: 'grade-invert', onChange: (v) => write('invert', v) });   // BASINS: the half-filled disk, turned over when ON
    inv.root.dataset.control = 'switch';
    add(turns, ['invert'], { kind: 'switch', root: inv.root, widget: inv, get: () => inv.get(), set: (v) => inv.set(!!v) }, () => !!read('invert'));
  }
  if (!turns.children.length) turns.remove();

  /* ── the blend: a stepper over the CSS modes ── */
  if (shown('blend')) {
    const d = D('blend');
    const c = control({ id: modId('blend'), label: d.label, hint: d.hint, options: blendItems(d.modes || BLEND_MODES), value: String(read('blend')),
      get: () => String(read('blend')), set: (v) => write('blend', v) });
    add(row('grade-blend'), ['blend'], c, () => String(read('blend')));
  }

  /* ── the app's own rows, by descriptor, grouped ── */
  const groups = new Map();
  for (const d of M.extra) {
    if (M.hide.has(d.id)) continue;
    const g = d.group || '';
    if (!groups.has(g)) {
      const sec = el('section', 'grade-group', root);
      if (g) label(el('div', 'grade-title', sec), g);
      groups.set(g, row('grade-extra', sec));
    }
    single(d.id, groups.get(g), d, { wrap: d.wrap, hue: d.hue, angle: d.angle, cyclic: d.cyclic, options: d.options, type: d.type, ink: d.ink, principal: d.principal });
  }

  /* ── painting: a notice, and the one frame that follows it ── */
  const busy = (e) => { const w = e.c.widget; if (!w) return false; if (w.lo && w.hi) return !!(w.lo.dragging && w.lo.dragging()) || !!(w.hi.dragging && w.hi.dragging()); return typeof w.dragging === 'function' && w.dragging(); };
  function sync() {
    if (!root.isConnected) return;
    for (const e of entries) {
      if (e.ids.some(routed) || busy(e)) continue;
      const v = e.read(); if (v === undefined) continue;
      const cur = e.c.get ? e.c.get() : undefined;
      if (Array.isArray(v) ? !(Array.isArray(cur) && cur[0] === v[0] && cur[1] === v[1]) : cur !== v) e.c.set(v);
    }
  }
  const schedule = () => frame.coalesce(key, sync);
  const offModel = M.onChange(schedule);

  /* ── modulation: the targets, added now (a route saved against one wakes up) ── */
  const offMod = [];
  if (mod && typeof mod.add === 'function' && targets.length) offMod.push(mod.add(targets));   // one rebuild of the modulation window (mod.add takes a list)

  sync();
  return {
    root, model: M, filter: M.filter, port: M.port, controls: entries, invert: inv,
    values: M.values, get: read, set(id, v) { M.put(id, v); }, home: () => M.home(),
    params: () => targets.slice(), sync, schedule, onChange: M.onChange,
    destroy() {
      frame.cancel(key); offModel();
      for (const f of offMod) { try { if (typeof f === 'function') f(); else if (f && typeof f.remove === 'function') f.remove(); } catch (_) { /* gone */ } }
      for (const e of entries) if (e.c.widget && e.c.widget.destroy) e.c.widget.destroy();
      if (ownModel) M.destroy();
      root.remove();
    },
  };
}

/* ═══ THE RACK CARD ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
export function createGradePanel(o = {}) {
  const id = o.id || 'grade';
  const model = createGradeModel({ ...o, id });                 // at once: a closed card still grades the picture and restores from a project
  let view = null;
  const handle = {
    id, model, view: () => view, params: () => (view ? view.params() : []), values: model.values, sync: () => view && view.sync(),
    destroy() { if (view) view.destroy(); view = null; model.destroy(); },
  };
  const spec = {
    id, title: o.title || 'GRADE', side: o.side || 'right', open: o.open, glyph: o.glyph || 'grade', action: o.action, eager: o.eager,
    hint: o.hint || 'the master picture: exposure, contrast, gamma, saturation, levels, opacity, hue, invert, blend',
    build(body) { view = createGradeView(body, { ...o, id, model }); handle.root = view.root; },
    onWake() { if (view) view.sync(); }, onOpen() { if (view) view.sync(); },
    ...(o.spec || {}),
  };
  if (o.parent) spec.build(o.parent);
  else if (o.rack) o.rack.register(spec);
  handle.spec = spec;
  return handle;
}
