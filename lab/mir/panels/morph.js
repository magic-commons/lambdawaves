/* panels/morph.js — SNAPSHOTS and the MORPH, harvested from AUTOMATA (lab/morph.js, P1, 105 lines) as it was: the kit's XY panel
 * (panels/xy.js, MORPH) stands on it, and AUTOMATA can import it from here and delete its own copy.
 *
 * A bank of up to eight named snapshots of a window's visible dials (their BASES, and the regime they were taken under), and the bilinear
 * morph between four of them on an XY pad, each dial in its own map: a log dial geometrically (the blend of the logs), a linear one
 * arithmetically, a stepped one (step 1, a mask, a count) the value of the corner with the largest weight. Pure: no DOM, no GPU, nothing
 * allocated on a tick; the caller puts it on its tick (or its frame) and writes what it returns through the dials' own door.
 *
 * What changed in the move (and nothing else): this header, and `dialsOf` takes a parameter list as well as a law ({ params }), and a
 * record's own `name` when it has one (the kit's dials come from many windows, so the panel names them by their whole id).
 * The corners: A bottom-left (0, 0) · B bottom-right (1, 0) · C top-left (0, 1) · D top-right (1, 1). */
export const BANK_MAX = 8, NAME_MAX = 16;
export const LINEAR = 0, LOG = 1, STEP = 2;
export const CORNERS = Object.freeze(['A', 'B', 'C', 'D']);   // A bottom-left (0, 0) · B bottom-right (1, 0) · C top-left (0, 1) · D top-right (1, 1)

export const kindOf = (p) => (p.step === 1 || p.fmt === 'mask' || p.map === 'integer' ? STEP : p.map === 'log' ? LOG : LINEAR);
/** the dials a snapshot holds: the law's parameters (or a list of parameter records) that are not hidden */
export const dialsOf = (law) => (Array.isArray(law) ? law : law.params).filter((p) => !p.hidden).map((p) => ({ id: p.id, name: p.name || p.id.split('.').pop(), kind: kindOf(p), min: p.min, max: p.max }));
const clampTo = (d, v) => (v < d.min ? d.min : v > d.max ? d.max : v);

// a missing corner takes the nearest assigned one: an adjacent corner first (a tie toward A, then B, then C), else the opposite one
const ADJ = [[1, 2], [0, 3], [0, 3], [1, 2]], OPP = [3, 2, 1, 0];
export function fillCorners(has) {
  const src = [-1, -1, -1, -1]; if (!(has[0] || has[1] || has[2] || has[3])) return src;
  for (let c = 0; c < 4; c++) src[c] = has[c] ? c : has[ADJ[c][0]] ? ADJ[c][0] : has[ADJ[c][1]] ? ADJ[c][1] : OPP[c];
  return src;
}

/** a to b at t: exactly a at t ≤ 0 and where they agree, exactly b at t ≥ 1, clamped between them (so monotone in t); geometric for a log dial */
function mix(a, b, t, geo) {
  if (t <= 0 || a === b) return a;
  if (t >= 1) return b;
  const v = geo ? a * Math.exp(t * Math.log(b / a)) : a + t * (b - a);
  return a < b ? (v < a ? a : v > b ? b : v) : (v < b ? b : v > a ? a : v);
}
/** one dial at (x, y) from its corners a, b, c, d: the bilinear blend in the dial's own map; a stepped dial takes the corner of largest weight */
export function blend(kind, a, b, c, d, x, y) {
  if (kind === STEP) return x > 0.5 ? (y > 0.5 ? d : b) : (y > 0.5 ? c : a);   // a tie (x or y exactly ½) goes to A, then B, then C
  const geo = kind === LOG && a > 0 && b > 0 && c > 0 && d > 0;
  return mix(mix(a, b, x, geo), mix(c, d, x, geo), y, geo);
}

/** the morph over a law's dials. setCorners(four snapshots or nulls) once per change; step(xy) once per tick, reading the pad's live position
 *  from xy[2], xy[3]: true when the position or the corners moved since the last step, `out` then holding every dial `mask` marks (a dial
 *  no assigned corner holds is left alone). A still pad costs a comparison. */
export function createMorph(dials) {
  const n = dials.length, kind = new Uint8Array(n), cv = new Float64Array(4 * n), out = new Float64Array(n), mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) kind[i] = dials[i].kind;
  let lx = NaN, ly = NaN, dirty = false;
  function setCorners(snaps) {
    for (let i = 0; i < n; i++) {
      const d = dials[i], src = fillCorners(snaps.map((s) => !!s && !!s.values && Number.isFinite(s.values[d.name])));
      mask[i] = src[0] >= 0 ? 1 : 0;
      for (let c = 0; c < 4; c++) cv[4 * i + c] = src[c] >= 0 ? clampTo(d, snaps[src[c]].values[d.name]) : NaN;
    }
    dirty = true;
  }
  function step(xy) {
    const x = xy[2], y = xy[3];
    if (!dirty && x === lx && y === ly) return false;
    lx = x; ly = y; dirty = false;
    for (let i = 0; i < n; i++) if (mask[i]) out[i] = blend(kind[i], cv[4 * i], cv[4 * i + 1], cv[4 * i + 2], cv[4 * i + 3], x, y);
    return true;
  }
  return { dials, out, mask, setCorners, step,
    sync(xy) { lx = xy[2]; ly = xy[3]; dirty = false; },              // the position as it stands is no move (a boot, a law's first frame)
    touch() { dirty = true; },                                         // ENGAGE: the next step writes, wherever the pad is
    at: (i, x, y) => (mask[i] ? blend(kind[i], cv[4 * i], cv[4 * i + 1], cv[4 * i + 2], cv[4 * i + 3], x, y) : NaN) };
}

/* ── the bank: eight slots, four corners naming slots, the pad's hand position and ENGAGE — per law, in prefs ── */
/** the dials as they stand: their bases, and the regime they were taken under (an id, or null) */
export function snapshot(dials, base, name, regime) {
  const values = {}; for (const d of dials) if (Number.isFinite(base[d.name])) values[d.name] = base[d.name];
  return { name: String(name).slice(0, NAME_MAX), regime: regime || null, values };
}
/** what a recall writes: each dial the snapshot holds that the law still has, inside its range; an older snapshot recalls what it has */
export function recallValues(dials, snap) {
  const out = []; if (!snap || !snap.values) return out;
  for (const d of dials) { const v = snap.values[d.name]; if (Number.isFinite(v)) out.push([d.name, clampTo(d, v)]); }
  return out;
}
/** prefs' record, sanitised: a slot is a snapshot or null, a corner names a filled slot or is null, the pad sits in [0, 1]² */
export function loadBank(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}, slots = [];
  for (let i = 0; i < BANK_MAX; i++) {
    const s = Array.isArray(r.slots) ? r.slots[i] : null;
    slots.push(s && typeof s === 'object' && s.values && typeof s.values === 'object'
      ? { name: String(s.name || 'SNAP ' + (i + 1)).slice(0, NAME_MAX), regime: typeof s.regime === 'string' ? s.regime : null, values: Object.fromEntries(Object.entries(s.values).filter(([, v]) => Number.isFinite(v))) }
      : null);
  }
  const corners = [0, 1, 2, 3].map((c) => { const k = Array.isArray(r.corners) ? r.corners[c] : null; return Number.isInteger(k) && k >= 0 && k < BANK_MAX && slots[k] ? k : null; });
  const unit = (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5);
  return { slots, corners, engaged: r.engaged === true, x: unit(r.x), y: unit(r.y) };
}
export const saveBank = (b) => ({ slots: b.slots.map((s) => (s ? { name: s.name, regime: s.regime, values: { ...s.values } } : null)), corners: b.corners.slice(), engaged: !!b.engaged, x: b.x, y: b.y });

export const FADE0 = 2;                                                     // PF1's FADE at rest, in beats
/** RW·B · the project's part (lab/project.js): the bank, its corners, ENGAGE, the pad's hand position, and the scenes' FADE — none while all are
 *  at rest. doors: { bank (written in place: it is shared), xy (the pad's [hand x, hand y, live x, live y]), fade: { get, set }, after() } */
export function morphPart({ bank, xy, fade, after }) {
  return {
    capture() {
      const b = saveBank({ ...bank, x: xy[0], y: xy[1] }), f = fade.get();
      return b.slots.every((s) => !s) && !b.engaged && b.x === 0.5 && b.y === 0.5 && f === FADE0 ? null : { ...b, fade: f };
    },
    restore(r) {
      const b = loadBank(r); Object.assign(bank, b); xy[0] = xy[2] = b.x; xy[1] = xy[3] = b.y;
      fade.set(r && Number.isFinite(r.fade) ? r.fade : FADE0); if (after) after();
    },
  };
}
