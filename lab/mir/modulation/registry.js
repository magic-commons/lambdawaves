/* registry.js — THE PARAMETER REGISTRY.  MIR edge 1 of 4.
 *
 * A pure module: no DOM, no globals, no lab identity, no imports.  It answers one
 * question — "what can this instrument modulate, and where is that parameter right
 * now?" — and it answers it in two currencies at once: the VALUE the physics and the
 * knob speak (radians, a.u./s, 96³, ±π/2) and the NORMALISED 0…1 the modulation model
 * speaks.  Everything else about modulation lives elsewhere; this file only has to be
 * exactly right about the correspondence between those two, and about whose number is
 * showing.
 *
 * ── THE FIVE MAPS ─────────────────────────────────────────────────────────────────
 * `map` is one of linear · log · wrap · integer · bipolar.  These are not five new
 * capabilities: they are the five things a kit.js control ALREADY is, finally named.
 *
 *     linear    knob({ min, max })                       — the plain knob
 *     log       knob({ min, max, log: true })            — DIST, EXPOSURE, RATE
 *     wrap      knob({ min, max, wrap: true })           — YAW, HUE SHIFT, a phase
 *     integer   knob({ min, max, step: 1 })              — RESOLUTION, STEPS
 *     bipolar   knob() over a signed range               — PITCH, a detented offset
 *
 * kit.js has carried this information since the day it was written (`log`, `wrap`,
 * `step`, and a signed range are four literal option flags) and has never had a name
 * for it.  This is the naming.  The law every one of them obeys:
 *
 *     fromNorm(id, toNorm(id, v)) === snap(id, v)   to 1e-12, for every map,
 *
 * including the log map with min > 0, the wrap map ACROSS THE SEAM (max ≡ min), the
 * integer map's snapping, and the bipolar map, whose 0.5 is EXACTLY zero even when
 * the range is not symmetric.  tests/mir.test.mjs is the gate.
 *
 * ── BASE vs MODULATED — the reason this file exists at all ────────────────────────
 * A modulated parameter has TWO values: the BASE the user set with their hand, and
 * the CURRENT one a modulator computed from it.  If the registry does not own that
 * distinction, then the first LFO to run overwrites the user's setting, and there is
 * no number left anywhere in the program to put back — HOLD, BASE-on-pause, bypass,
 * "stop the LFO", and undo all become impossible at once, silently, on the first
 * frame.  So: setBase / applyModulated / restoreBase / state, and the base is stored
 * in VALUE space and never round-tripped through the normalised form, so restoreBase
 * hands back the user's number bit for bit.
 *
 * The corollary, and it is the one a reader has to carry into every function below:
 * WHILE A PARAMETER IS MODULATED, ITS CARD IS NOT A SOURCE OF ITS BASE.  The Card is
 * showing the modulator's output — this registry put it there — so any code that reads
 * a Card back into a base has to ask `modulated` first or it is quietly recording the
 * LFO's number as the user's.  register() (which reads get() only on FIRST registration,
 * never on a hot re-registration) and resync() (see its own note) are the only two
 * places that read a Card at all, and both obey it.
 */

/* ── the id grammar ───────────────────────────────────────────────────────────────
 * Ids are stable dotted strings and they are VALIDATED, because a control registered
 * under a typo is a ghost: it takes routes, it saves into presets, and it never moves
 * anything.  A refusal is a throw, not a null — this is a programming error at boot,
 * and the loudest possible moment is the cheapest one.
 *
 * The shipped shapes (board #33): observer.* · material.* · state.mode.h:n:l:m.* ·
 * transport.* · field.resolution.  A leaf segment is lowercase alphanumeric; a MODE
 * KEY segment is the register's own stable id "h:n:l:m" (lab/hydrogen.js), which is
 * why the grammar has to know about colons at all. */
const ROOTS = Object.freeze(['observer', 'material', 'state', 'transport', 'field']);
const SEG = /^[a-z][a-z0-9]*$/;
const MODE_SEG = /^[a-z]:\d+:\d+:-?\d+$/;
const ID_MAX = 96;

/** The reason an id is not one, or NULL if it is. */
export function idFault(id, roots) {
  if (typeof id !== 'string') return 'an id must be a string, not ' + typeof id;
  if (!id) return 'an id must not be empty';
  if (id.length > ID_MAX) return 'an id must be at most ' + ID_MAX + ' characters';
  if (id !== id.trim()) return 'an id must not have leading or trailing space';
  const parts = id.split('.');
  if (parts.length < 2) return 'an id must be dotted: "<group>.<name>", not "' + id + '"';
  if (parts.length > 5) return 'an id must be at most 5 segments deep';
  const allowed = roots || ROOTS;
  if (allowed.indexOf(parts[0]) < 0) {
    return 'the root "' + parts[0] + '" is not one of ' + allowed.join(' · ');
  }
  for (const p of parts) {
    if (!p) return 'an id must not have an empty segment: "' + id + '"';
    if (!SEG.test(p) && !MODE_SEG.test(p)) {
      return 'the segment "' + p + '" is neither lowercase alphanumeric nor a mode key h:n:l:m';
    }
  }
  /* state.mode.* is the register's own address space: the third segment must really
     be a mode key, or a route saved against it can never find its amplitude again. */
  if (parts[0] === 'state' && parts[1] === 'mode') {
    if (parts.length < 4) return 'state.mode.<h:n:l:m>.<name> needs the mode key and a name';
    if (!MODE_SEG.test(parts[2])) return 'state.mode expects a mode key h:n:l:m, not "' + parts[2] + '"';
  }
  return null;
}

/* ── the five maps ────────────────────────────────────────────────────────────────
 * Each map is { fault, snap, toNorm, fromNorm }.  toNorm SNAPS FIRST and fromNorm
 * SNAPS LAST, so the round trip is exact wherever the map is discrete (integer, and
 * any map given a `step`) and correct to a couple of ulps wherever it is continuous.
 * Every endpoint is special-cased to be bit-exact: a knob at its minimum must read
 * its minimum back, not its minimum plus 2e-16.  */
export const MAP_KINDS = Object.freeze(['linear', 'log', 'wrap', 'integer', 'bipolar']);

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
const frac = (v) => v - Math.floor(v);
const finite = (v) => typeof v === 'number' && Number.isFinite(v);

/** grid snapping shared by every map that was given a `step` */
function onGrid(v, min, max, step) {
  if (!(step > 0)) return clamp(v, min, max);
  const n = Math.round((clamp(v, min, max) - min) / step);
  return clamp(min + n * step, min, max);
}

const MAPS = {
  linear: {
    fault: (s) => (!finite(s.min) || !finite(s.max) ? 'linear needs finite min and max'
      : !(s.min < s.max) ? 'linear needs min < max' : null),
    snap: (v, s) => onGrid(v, s.min, s.max, s.step),
    toNorm: (v, s) => (v <= s.min ? 0 : v >= s.max ? 1 : (v - s.min) / (s.max - s.min)),
    fromNorm: (u, s) => (u <= 0 ? s.min : u >= 1 ? s.max : s.min + u * (s.max - s.min))
  },

  /* The log map is the `log: true` knob.  min > 0 is not a nicety: log(0) is -inf and
     every position on the dial would collapse to the same place. */
  log: {
    fault: (s) => (!finite(s.min) || !finite(s.max) ? 'log needs finite min and max'
      : !(s.min > 0) ? 'log needs min > 0 (log of zero has no dial position)'
      : !(s.min < s.max) ? 'log needs min < max' : null),
    snap: (v, s) => clamp(v, s.min, s.max),
    toNorm: (v, s) => (v <= s.min ? 0 : v >= s.max ? 1
      : Math.log(v / s.min) / Math.log(s.max / s.min)),
    fromNorm: (u, s) => (u <= 0 ? s.min : u >= 1 ? s.max
      : s.min * Math.pow(s.max / s.min, u))
  },

  /* The wrap map is the free-spinning knob: YAW, HUE, any phase.  max IS min — the
     seam is the whole point — so `snap` returns the canonical representative inside
     [min, max) and the round trip is judged on the circle, not on the line. */
  wrap: {
    fault: (s) => (!finite(s.min) || !finite(s.max) ? 'wrap needs finite min and max'
      : !(s.min < s.max) ? 'wrap needs min < max (the span is the circumference)' : null),
    snap: (v, s) => {
      const span = s.max - s.min;
      const w = s.min + frac((v - s.min) / span) * span;
      return s.step > 0 ? frac((onGrid(w, s.min, s.max, s.step) - s.min) / span) * span + s.min : w;
    },
    toNorm: (v, s) => frac((v - s.min) / (s.max - s.min)),
    fromNorm: (u, s) => s.min + frac(u) * (s.max - s.min)
  },

  /* The integer map is the `step: 1` knob.  Everything it stores is on the grid, so
     its round trip is not "to 1e-12" but exact. */
  integer: {
    fault: (s) => (!Number.isInteger(s.min) || !Number.isInteger(s.max)
        ? 'integer needs integer min and max'
      : !(s.min < s.max) ? 'integer needs min < max'
      : !Number.isInteger(s.step) || s.step < 1 ? 'integer needs an integer step >= 1' : null),
    snap: (v, s) => onGrid(Math.round(v), s.min, s.max, s.step),
    toNorm: (v, s) => (v <= s.min ? 0 : v >= s.max ? 1 : (v - s.min) / (s.max - s.min)),
    fromNorm: (u, s) => (u <= 0 ? s.min : u >= 1 ? s.max : s.min + u * (s.max - s.min))
  },

  /* The bipolar map is a signed range with a detent.  It is NOT "linear over a range
     that happens to contain zero": the two halves are scaled independently so that
     0.5 is EXACTLY zero even when the range is lopsided (-1 … +3).  A centre detent
     that is only nearly centred is a bug you find six months later in a screenshot. */
  bipolar: {
    fault: (s) => (!finite(s.min) || !finite(s.max) ? 'bipolar needs finite min and max'
      : !(s.min < 0) ? 'bipolar needs min < 0' : !(s.max > 0) ? 'bipolar needs max > 0' : null),
    snap: (v, s) => onGrid(v, s.min, s.max, s.step),
    toNorm: (v, s) => (v <= s.min ? 0 : v >= s.max ? 1 : v === 0 ? 0.5
      : v > 0 ? 0.5 + 0.5 * (v / s.max) : 0.5 - 0.5 * (v / s.min)),
    fromNorm: (u, s) => (u <= 0 ? s.min : u >= 1 ? s.max : u === 0.5 ? 0
      : u > 0.5 ? (u - 0.5) * 2 * s.max : (0.5 - u) * 2 * s.min)
  }
};

/* ── the registry ─────────────────────────────────────────────────────────────── */

/**
 * createRegistry({ roots, onError })
 *   roots    the id roots this instance accepts (default: the shipped five).
 *   onError  called with (err, id, phase) when a SUBSCRIBER throws.  Optional.
 *
 * One instance per Card/Lab.  The registry never knows whose parameters these are.
 */
export function createRegistry(opts) {
  const options = opts || {};
  const roots = Array.isArray(options.roots) && options.roots.length
    ? options.roots.slice() : ROOTS.slice();
  const onError = typeof options.onError === 'function' ? options.onError : null;

  const order = [];                       // registration order — the target list's order
  const byId = new Map();                 // id -> record
  const subs = new Map();                 // id (or '*') -> Set<fn>
  const stats = { registers: 0, rewrites: 0, writes: 0, modulated: 0, restores: 0,
                  suppressed: 0, callbackErrors: 0 };

  const rec = (id) => {
    const r = byId.get(id);
    if (!r) throw new Error('mir/registry: no parameter "' + id + '" — register it first');
    return r;
  };

  /* A subscriber is a SPECTATOR: if it throws, the write it was watching has already
     happened and must stand, so the throw is caught, counted and reported, never
     re-raised into the writer.  (A `set` that throws is a different animal — that is
     the Card's own setter failing, the write did NOT happen, and swallowing it would
     leave the registry lying about where the parameter is.  Those are not caught.) */
  function notify(r, reason) {
    if (!subs.size) return;
    const ev = Object.freeze({ id: r.id, reason, value: r.current, norm: normOf(r, r.current),
                               base: r.base, modulated: r.modulated });
    for (const key of [r.id, '*']) {
      const set = subs.get(key);
      if (!set) continue;
      for (const fn of Array.from(set)) {
        try { fn(ev); } catch (err) {
          stats.callbackErrors++;
          if (onError) { try { onError(err, r.id, reason); } catch (_) { /* the reporter too */ } }
        }
      }
    }
  }

  const snapOf = (r, v) => MAPS[r.map].snap(Number(v), r);
  const normOf = (r, v) => clamp01(MAPS[r.map].toNorm(snapOf(r, v), r));
  const valueOf = (r, u) => snapOf(r, MAPS[r.map].fromNorm(Number(u), r));

  /** Push `r.current` at the Card and tell whoever is listening. */
  function publish(r, reason) {
    r.set(r.current);
    r.writes++;
    notify(r, reason);
    return r.current;
  }

  /**
   * register(id, spec) — spec:
   *   { label, unit, min, max, step, map, get, set, group, def, hint }
   * `map` defaults to 'linear'.  `get` and `set` are the Card's adapters: `get` is
   * read ONCE at first registration to seed the base (this is the fix for the other
   * project's "get is required, stored, and never called"), and `set` is the only way
   * a value ever reaches the instrument.
   *
   * HOT RE-REGISTRATION is a first-class behaviour, not an accident: registering an
   * id that already exists REPLACES the descriptor and the adapters, KEEPS THE BASE,
   * and keeps the parameter's place in the order and its subscribers.  A window that
   * rebuilds its controls must not lose the user's settings or their routes.
   */
  function register(id, spec) {
    const fault = idFault(id, roots);
    if (fault) throw new TypeError('mir/registry: bad id "' + String(id) + '" — ' + fault);
    const s = spec || {};
    const map = s.map === undefined || s.map === null ? 'linear' : String(s.map);
    if (!MAPS[map]) {
      throw new TypeError('mir/registry: "' + id + '" has map "' + map +
        '" — it must be one of ' + MAP_KINDS.join(' · '));
    }
    if (typeof s.get !== 'function' || typeof s.set !== 'function') {
      throw new TypeError('mir/registry: "' + id + '" needs both get() and set() adapters');
    }
    const step = finite(s.step) && s.step > 0 ? s.step : (map === 'integer' ? 1 : 0);
    const shape = { min: Number(s.min), max: Number(s.max), step };
    const mf = MAPS[map].fault(shape);
    if (mf) throw new TypeError('mir/registry: "' + id + '" — ' + mf);

    const old = byId.get(id);
    const r = old || { id, writes: 0, current: 0, base: 0, modulated: false };
    r.label = s.label === undefined ? id.split('.').pop().toUpperCase() : String(s.label);
    r.unit = s.unit === undefined || s.unit === null ? '' : String(s.unit);
    r.group = s.group === undefined || s.group === null ? id.split('.')[0] : String(s.group);
    r.hint = s.hint === undefined || s.hint === null ? '' : String(s.hint);
    r.map = map;
    r.min = shape.min; r.max = shape.max; r.step = shape.step;
    r.wrap = map === 'wrap';
    r.get = s.get; r.set = s.set;
    r.def = finite(s.def) ? snapOf(r, s.def) : null;

    if (old) {
      /* Keep the base.  Re-snap it, because the replacement descriptor may have moved
         the range under it — a base outside the new range would be un-restorable. */
      stats.rewrites++;
      r.base = snapOf(r, r.base);
      r.current = r.modulated ? snapOf(r, r.current) : r.base;
      notify(r, 'register');
      return describeOne(r);
    }
    /* First registration: the Card's own current value is the user's base. */
    const seed = Number(r.get());
    r.base = snapOf(r, finite(seed) ? seed : (r.def === null ? r.min : r.def));
    r.current = r.base;
    r.modulated = false;
    order.push(r);
    byId.set(id, r);
    stats.registers++;
    notify(r, 'register');
    return describeOne(r);
  }

  function unregister(id) {
    const r = byId.get(String(id));
    if (!r) return false;
    byId.delete(r.id);
    const i = order.indexOf(r);
    if (i >= 0) order.splice(i, 1);
    notify(r, 'unregister');
    subs.delete(r.id);
    return true;
  }

  function describeOne(r) {
    return { id: r.id, label: r.label, unit: r.unit, group: r.group, map: r.map,
             min: r.min, max: r.max, step: r.step, def: r.def, wrap: r.wrap };
  }

  /* ── base vs modulated ─────────────────────────────────────────────────────────
   * setBase is the user's hand on the control, and `write` is the same act under the
   * name a registry read as a control surface wants to call it.  One function, two
   * names, because the modulation window and the knob both have to be able to say it.
   *
   * While a modulator is running, moving the base does NOT move the current value:
   * the modulator's next output rides on the new base and the picture catches up on
   * the next frame.  That is the synth law, and it is why turning a knob under a
   * running LFO feels like turning a knob and not like fighting one. */
  function setBase(id, v) {
    const r = rec(String(id));
    const p = snapOf(r, v);
    const moved = !Object.is(r.base, p);
    r.base = p;
    stats.writes++;
    if (r.modulated) { if (moved) notify(r, 'base'); return r.base; }
    if (Object.is(r.current, p)) { stats.suppressed++; if (moved) notify(r, 'base'); return r.base; }
    r.current = p;
    publish(r, 'write');
    return r.base;
  }

  /**
   * applyModulated(id, v) — a modulator's output, in VALUE space.  Stores it as the
   * CURRENT value, leaves the base untouched, and marks the parameter modulated so
   * that restoreBase has something to restore to.  An unchanged value writes nothing
   * (the other project's unchanged-value suppression, kept): a per-frame setter that
   * rebuilds a field is not free.  `force` writes anyway.
   */
  function applyModulated(id, v, force) {
    const r = rec(String(id));
    const p = snapOf(r, v);
    const was = r.modulated;
    r.modulated = true;
    if (!force && Object.is(r.current, p) && was) { stats.suppressed++; return r.current; }
    r.current = p;
    stats.modulated++;
    return publish(r, 'modulated');
  }

  /** The same, in the normalised currency the modulation model speaks.
   *
   *  WAVE 63 · ZERO INFLUENCE IS THE BASE, BIT FOR BIT, ON EVERY MAP.  This file's own
   *  correspondence law is stated to 1e-12 (`fromNorm(toNorm(v)) === snap(v)`) and it cannot be
   *  stated stronger: a `log` map's round trip through log and exp is not exact, and it is not
   *  meant to be.  But a modulator whose summed influence is EXACTLY zero has not asked for a
   *  round trip at all — it has asked for the base — and the review measured what the round trip
   *  cost instead: five of the eleven shipped targets came back off by up to 2.2e-16 at zero
   *  depth (`material.exposure` 1 -> 1.0000000000000002), which is a "current IS base" claim that
   *  is true only on the linear maps.  So the one case the arithmetic CAN be exact in is taken
   *  exactly: when the normalised position is `Object.is`-equal to the base's own normalised
   *  form, the value written is `r.base` itself, never a number derived from it.  Everything else
   *  goes through `valueOf` as before, so no modulated output moves by this. */
  function applyModulatedNorm(id, u, force) {
    const r = rec(String(id));
    const atBase = Object.is(u, normOf(r, r.base));
    return applyModulated(r.id, atBase ? r.base : valueOf(r, u), force);
  }

  /**
   * restoreBase(id) — the modulator has let go.  The current value becomes the base
   * again and the parameter stops being modulated.  It returns the user's number
   * EXACTLY: the base was stored in value space and has never been through the
   * normalised form, so there is no round trip to lose it in.
   */
  function restoreBase(id, force) {
    const r = rec(String(id));
    const wasModulated = r.modulated;
    r.modulated = false;
    if (!force && Object.is(r.current, r.base) && !wasModulated) { stats.suppressed++; return r.base; }
    r.current = r.base;
    stats.restores++;
    publish(r, 'restore');
    return r.base;
  }

  function state(id) {
    const r = rec(String(id));
    return { id: r.id, base: r.base, current: r.current, modulated: r.modulated,
             baseNorm: normOf(r, r.base), currentNorm: normOf(r, r.current),
             wrap: r.wrap, writes: r.writes };
  }

  return Object.freeze({
    /* the catalogue */
    register, unregister,
    has: (id) => byId.has(String(id)),
    list: () => order.map((r) => r.id),
    describe: () => order.map(describeOne),
    describeOne: (id) => describeOne(rec(String(id))),
    count: () => order.length,
    roots: () => roots.slice(),

    /* the two currencies */
    toNorm: (id, v) => normOf(rec(String(id)), v),
    fromNorm: (id, u) => valueOf(rec(String(id)), u),
    snap: (id, v) => snapOf(rec(String(id)), v),
    isWrap: (id) => rec(String(id)).wrap,

    /* reading and writing */
    read: (id) => rec(String(id)).current,
    readNorm: (id) => { const r = rec(String(id)); return normOf(r, r.current); },
    write: setBase,                     /* the user's hand — setBase by its other name */
    writeNorm: (id, u) => { const r = rec(String(id)); return setBase(r.id, valueOf(r, u)); },

    /* base vs modulated */
    setBase, applyModulated, applyModulatedNorm, restoreBase, state,
    baseOf: (id) => rec(String(id)).base,
    baseNorm: (id) => { const r = rec(String(id)); return normOf(r, r.base); },
    isModulated: (id) => rec(String(id)).modulated,
    /** Everything the modulator let go of at once — a bypass, a stop, a rack clear. */
    restoreAll: () => { let n = 0; for (const r of order.slice()) if (r.modulated) { restoreBase(r.id); n++; } return n; },

    /** Re-read every parameter from its Card adapter — after a preset load or an undo,
        when the instrument moved without going through the registry.

        WHAT resync MAY AND MAY NOT LEARN FROM A CARD.  Its premise is "the instrument is
        right and the registry is stale".  For an UNMODULATED parameter that is the whole
        story: the value in the Card IS the user's value, so it becomes the base and the
        current one together, and a subscriber hears 'resync'.

        Under a RUNNING MODULATOR the premise is only half true, and the half that is false
        is the one that costs the user their number.  The Card is showing the MODULATOR'S
        OUTPUT — the registry pushed it there itself, one frame ago, through publish() — so
        reading that back into r.base does not re-read the user's setting, it OVERWRITES it
        with the LFO's, and because the base is the only copy in the program the user's
        number is then gone: HOLD, bypass, restoreBase and undo all hand back the modulator's
        value.  That is precisely the failure §BASE vs MODULATED exists to prevent, arriving
        through this module's own API.  So the law:

            THE BASE OF A MODULATED PARAMETER IS NEVER READ OUT OF ITS CARD.

        It is not visible there.  A caller that genuinely knows a new base for a modulated
        parameter — a preset loader, an undo step, a route's own base edit — already has the
        right function for it: setBase(), which under modulation moves the base and leaves
        the current value to the modulator (the synth law above).  resync's job is the OTHER
        half, and it still does it for a modulated parameter: notice that the Card no longer
        holds what the registry last pushed into it, record the CURRENT value it does hold,
        and say so.  A well-behaved Card under a modulator reads back exactly r.current, so
        that branch is one comparison and a `continue` in the ordinary case.

        Every change resync makes now emits an event.  It used to move the base of a
        modulated parameter with no notify() at all, which is how the loss stayed invisible
        to every subscriber, meter and undo ring in the program. */
    resync: () => {
      let n = 0;
      for (const r of order) {
        const seed = Number(r.get());
        if (!finite(seed)) continue;
        const p = snapOf(r, seed);
        if (r.modulated) {
          /* the base is the user's and stays the user's; only a genuine outside move of
             the current value is recorded, and it is NOT pushed back at the Card */
          if (Object.is(p, r.current)) continue;
          r.current = p;
          notify(r, 'resync');
          n++;
          continue;
        }
        if (Object.is(p, r.base) && Object.is(p, r.current)) continue;
        r.base = p;
        r.current = p;
        notify(r, 'resync');
        n++;
      }
      return n;
    },

    /* events */
    subscribe: (id, fn) => {
      if (typeof fn !== 'function') throw new TypeError('mir/registry: subscribe needs a function');
      const key = id === '*' ? '*' : String(id);
      if (key !== '*' && !byId.has(key)) rec(key);
      let set = subs.get(key);
      if (!set) { set = new Set(); subs.set(key, set); }
      set.add(fn);
      return () => { const s = subs.get(key); if (s) { s.delete(fn); if (!s.size) subs.delete(key); } };
    },
    subscriberCount: (id) => { const s = subs.get(id === '*' ? '*' : String(id)); return s ? s.size : 0; },

    stats: () => ({ ...stats })
  });
}
