/* controls/factory.js — control(descriptor): describe a parameter once, get the right control and a modulation target.
 *
 * THE LAW IT KEEPS: THE KIND OF VALUE CHOOSES THE CONTROL, never the app's taste (docs/CONTROLS.md is the table; this is the table as
 * code).  NEBULA wrote this rule for itself (`lab/main.js:128`, census finding 10: > 3 options or long labels → a select, a finite range
 * → a knob, else a number field); it is the kit's now, with the rest of Josh's table in it.  The first row that fits wins:
 *
 *   boolean (type 'boolean', or a boolean value) ................................ switch    (a lamp; `lamp: false` for the listed cases)
 *   a colour the user picks (colour: true) ....................................... swatch
 *   a coupled pair (pair: [axisX, axisY]) ...................................... XY pad + its two knobs
 *   a lo/hi range (type 'range', or a value [lo, hi]) ........................... range slider
 *   options, 1–4 and every label short (< 26 characters) ........................ segment
 *   options, 5 or more, in order ............................................... stepper   (the page turner's form)
 *   options, a long list of data (list: true, ordered: false, or over 16) ....... select
 *   a finite range, cyclic (wrap, cyclic, hue or angle) ......................... arc knob  (a hue or an angle: INTENT rule 2)
 *   a finite range, the thing's one principal amount (principal: true) .......... lane slider
 *   a finite range ............................................................ knob
 *   otherwise ................................................................. number field
 *
 * descriptor: { id, label, hint, value, get?, set?, type?, options?: [{ id, label, coming?/disabled? }], min, max, step, log, wrap, hue, angle,
 *   cyclic, principal, list, ordered, colour, pair, ink, unit, digits, fmt, orient, lamp, onInput?, onChange? }.  `get` and `set` are the app's
 *   own road to the value (the registry's adapters): the control reads its first value from `get()`, and every hand writes `set(v)`.
 *   → { kind, root, widget, targets, get(), set(v), desc, params() }
 *     kind     one of KINDS
 *     widget   the control the builder made (a knob, a seg …)
 *     targets  the widgets a macro may route onto: [knob] · [arc] · [lane] · [x knob, y knob] · [lo thumb, hi thumb]; none for the rest
 *     params() the parameter records installModulation({ params }) takes — { id, label, min, max, step, map, unit, hint, get, set, widget } —
 *              one per target (the pad's and the range's axes carry their own ids: pair: [{ id, … }, { id, … }], ids: [loId, hiId])
 * The pure part, for tests: controlKind(descriptor). */
import { sw, seg, knob } from '../kit.js';
import { stepper } from './stepper.js';
import { select } from './select.js';
import { number } from './number.js';
import { rangeSlider } from './range.js';
import { xyPad } from './xy.js';
import { arcKnob } from './arc.js';
import { laneSlider } from './lane.js';
import { hueSwatch } from './swatch.js';

export const KINDS = Object.freeze(['switch', 'swatch', 'xy', 'range', 'segment', 'stepper', 'select', 'arc', 'lane', 'knob', 'number']);
const SHORT = 26, LONG_LIST = 16;
const finiteRange = (d) => Number.isFinite(d.min) && Number.isFinite(d.max) && d.max > d.min;

/** controlKind(descriptor) → one of KINDS (pure) */
export function controlKind(d) {
  if (d.type === 'boolean' || typeof d.value === 'boolean') return 'switch';
  if (d.colour || d.type === 'colour') return 'swatch';
  if (Array.isArray(d.pair) && d.pair.length === 2) return 'xy';
  if (d.type === 'range' || (Array.isArray(d.value) && d.value.length === 2)) return 'range';
  if (Array.isArray(d.options)) {
    const n = d.options.length;
    if (n <= 4 && d.options.every((o) => String(o.label).length < SHORT)) return 'segment';
    if (d.list || d.ordered === false || n > LONG_LIST || d.options.some((o) => String(o.label).length >= SHORT && n <= 4)) return 'select';
    return 'stepper';
  }
  if (finiteRange(d)) {
    if (d.wrap || d.cyclic || d.hue || d.angle) return 'arc';
    if (d.principal) return 'lane';
    return 'knob';
  }
  return 'number';
}

const mapOf = (d) => (d.wrap || d.cyclic || d.hue || d.angle ? 'wrap' : d.log ? 'log' : d.step === 1 && Number.isInteger(d.min) && Number.isInteger(d.max) ? 'integer' : 'linear');
const itemsOf = (d) => d.options.map((o) => ({ id: o.id, label: o.label, vars: o.vars, coming: !!(o.coming || o.disabled) }));

/** control(descriptor) — see the header */
export function control(d, hooks = {}) {
  const kind = controlKind(d);
  const read = () => (typeof d.get === 'function' ? d.get() : d.value);
  const write = (v) => { if (typeof d.set === 'function') d.set(v); };
  const input = (v) => { write(v); if (d.onInput) d.onInput(v); if (hooks.onInput) hooks.onInput(v); };
  const change = (v) => { write(v); if (d.onChange) d.onChange(v); if (hooks.onChange) hooks.onChange(v); };
  const common = { label: d.label, title: d.hint, aria: d.aria };
  const knobOpts = () => ({ ...common, min: d.min, max: d.max, value: read(), step: d.step, log: d.log, wrap: !!(d.wrap || d.cyclic || d.hue || d.angle), unit: d.unit, fmt: d.fmt, size: d.size,
    onInput: input, onChange: change });
  let widget, targets = [], getter, setter, recs = null;
  switch (kind) {
    case 'switch': widget = sw({ ...common, value: !!read(), lamp: d.lamp, onChange: change }); getter = () => widget.get(); setter = (v) => widget.set(v); break;
    case 'swatch': widget = hueSwatch({ ...common, rgb: read(), onInput: (c) => input(c), onChange: () => change(widget.get ? widget.get() : read()) }); getter = () => widget.get(); setter = (v) => widget.set(v); break;
    case 'segment': widget = seg({ ...common, options: d.options.map((o) => ({ id: o.id, label: o.label, title: o.hint })), value: String(read()), onChange: change }); getter = () => widget.get(); setter = (v) => widget.set(v); break;
    case 'stepper': widget = stepper({ ...common, items: itemsOf(d), value: read(), onChange: change }); getter = () => widget.get(); setter = (v) => widget.set(v); break;
    case 'select': widget = select({ ...common, items: itemsOf(d), value: read(), onChange: change }); getter = () => widget.get(); setter = (v) => widget.set(v); break;
    case 'arc': widget = arcKnob({ ...knobOpts(), ink: d.ink, home: d.home }); targets = [widget]; getter = () => widget.get(); setter = (v) => widget.set(v); break;
    case 'lane': widget = laneSlider({ ...common, min: d.min, max: d.max, value: read(), log: d.log, fmt: d.fmt, ink: d.ink, orient: d.orient, home: d.home, onInput: input, onChange: change }); targets = [widget]; getter = () => widget.get(); setter = (v) => widget.set(v); break;
    case 'knob': widget = knob(knobOpts()); if (Number.isFinite(d.home)) widget.setDefault(d.home); targets = [widget]; getter = () => widget.get(); setter = (v) => widget.set(v); break;   // a double-tap goes HOME
    case 'xy': {
      const [ax, ay] = d.pair;
      const axis = (a, f) => ({ label: a.label, min: a.min, max: a.max, value: typeof a.get === 'function' ? a.get() : a.value, step: a.step, log: a.log, unit: a.unit, fmt: a.fmt, title: a.hint });
      widget = xyPad({ label: d.label, aria: d.aria, x: axis(ax), y: axis(ay), home: d.home, tags: d.tags,
        onInput: (x, y) => { if (typeof ax.set === 'function') ax.set(x); if (typeof ay.set === 'function') ay.set(y); if (d.onInput) d.onInput([x, y]); if (hooks.onInput) hooks.onInput([x, y]); },
        onChange: (x, y) => { if (typeof ax.set === 'function') ax.set(x); if (typeof ay.set === 'function') ay.set(y); if (d.onChange) d.onChange([x, y]); if (hooks.onChange) hooks.onChange([x, y]); } });
      targets = [widget.x, widget.y]; getter = () => widget.get(); setter = (v) => widget.set(v[0], v[1]);
      recs = [ax, ay]; break;
    }
    case 'range': {
      const v0 = Array.isArray(d.value) ? d.value : (typeof d.get === 'function' ? d.get() : [d.min, d.max]);
      const both = (lo, hi) => { if (typeof d.set === 'function') d.set([lo, hi]); };
      widget = rangeSlider({ label: d.label, aria: d.aria, title: d.hint, min: d.min, max: d.max, lo: v0[0], hi: v0[1], step: d.step, log: d.log, fmt: d.fmt, minGap: d.minGap,
        onInput: (lo, hi) => { both(lo, hi); if (d.onInput) d.onInput([lo, hi]); if (hooks.onInput) hooks.onInput([lo, hi]); },
        onChange: (lo, hi) => { both(lo, hi); if (d.onChange) d.onChange([lo, hi]); if (hooks.onChange) hooks.onChange([lo, hi]); } });
      if (Array.isArray(d.home)) { widget.lo.setDefault(d.home[0]); widget.hi.setDefault(d.home[1]); }
      targets = [widget.lo, widget.hi]; getter = () => widget.get(); setter = (v) => widget.set(v[0], v[1]); break;
    }
    default: widget = number({ ...common, min: d.min, max: d.max, value: read(), step: d.step, digits: d.digits, fmt: d.fmt, unit: d.unit, onInput: input, onChange: change }); getter = () => widget.get(); setter = (v) => widget.set(v);
  }
  const root = widget.root;
  root.dataset.control = kind;
  /** the parameter records installModulation({ params }) takes, one per target */
  function params() {
    const one = (a, w, id) => ({ id: id || a.id, label: a.label, min: a.min, max: a.max, step: Number.isFinite(a.step) ? a.step : 0, map: mapOf(a), unit: a.unit, hint: a.hint, def: a.def ?? a.home,
      get: () => (typeof a.get === 'function' ? a.get() : w.get()), set: (v) => { if (typeof a.set === 'function') a.set(v); }, widget: w });   // the registry writes the app's number; the widget paints from the host's show / set
    if (kind === 'xy') return [one(recs[0], widget.x), one(recs[1], widget.y)];
    if (kind === 'range') {
      const ids = d.ids || [d.id + '.lo', d.id + '.hi'];
      return [one({ ...d, get: () => widget.get()[0], set: (v) => both2(v, 0) }, widget.lo, ids[0]), one({ ...d, get: () => widget.get()[1], set: (v) => both2(v, 1) }, widget.hi, ids[1])];
    }
    return targets.length ? [one(d, widget, d.id)] : [];
  }
  function both2(v, i) { const [lo, hi] = widget.get(); if (typeof d.set === 'function') d.set(i ? [lo, v] : [v, hi]); }
  return { kind, root, widget, targets, get: getter, set: setter, desc: d, params };
}
