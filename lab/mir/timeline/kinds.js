/* timeline/kinds.js — THE CLIP-KIND REGISTRY (harvested whole from BASINS app/timeline-kinds.js, 2026-10-02).
 * The clip kinds: 'curve' is the kit's points; a lane registers audio, pattern and whatever comes next. The model asks
 * a kind to validate and to value, the view asks it to paint, the editor asks it to slice. One registry, no second model.
 * An app adds its own kind with registerClipKind(name, impl); registering a name again replaces it (an app can extend
 * the kit's 'audio' kind with its menu: registerClipKind('audio', { ...clipKind({ kind: 'audio' }), menu })).
 * THE HOST'S FIELD WINS (BASINS, 2026-10-01): a kind never overrides the model's own fields — the model merges the
 * kind's source first and writes `length` after it. */
const kinds = new Map();
/* impl: { validate(curve) → bool, value(curve, clip, sourceBeat) → 0..1 | null, paint?(svg, curve, clip, ctx),
          slice?(curve, sourceBeat) → { before, after } | null, duration?(curve, bpm) → beats,
          drives?: false (it fires, it never drives: never dormant for want of a target, no OUTPUT RANGE),
          menu?(curve, clip, { model, editor }) → [[label, fn]] (its rows in the clip menu; labels are English, translated
          where they are shown) } */
export function registerClipKind(kind, impl) { kinds.set(String(kind), Object.freeze({ ...impl })); return kinds.get(String(kind)); }
export const clipKind = (curve) => (curve && curve.kind && curve.kind !== 'curve') ? kinds.get(curve.kind) || null : null;
export const clipKinds = () => [...kinds.keys()];
export const isKindCurve = (curve) => !!(curve && curve.kind && curve.kind !== 'curve');
