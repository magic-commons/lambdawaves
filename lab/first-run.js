/* first-run.js — THE FIRST-RUN MATERIAL, a pure function of one fact: is this a phone or a tablet?
 *
 * W125 (Josh, 2026-09-25).  A new desktop gets the clear glass: REFRACTIVE cards and FROST ALWAYS.  A new phone or tablet
 * gets FROST OFF and TINTED cards — a touch device paints the field on a low-power GPU, and a backdrop filter over it is
 * the one thing it pays most for.  rack.js asks the question with its OWN crossings (isPhone(): skin.css's `--phone`
 * sentinel; isTablet(): the iPad UA or a coarse, hover-less pointer on a screen ≥ 600 px) — no second detection here.
 *
 * 0.5.0 C2 · the card and frost here are the look store's DEFAULTS (lab/look.js, `mir.gui`): a stored choice wins there, and an
 * older settings blob's is lifted into it by the laws rack.js always read it by (look.js liftLook).  The phone crossing's FROST OFF
 * override (enterPhone) is a separate, later law and is not decided here.
 * W129 (Josh, 2026-09-25) · `folded`: the first-visit furniture's folded windows — SETTINGS and STATE everywhere, and SHADOW
 * too on a phone or tablet, whose rack is the screen's scarcest room.  A fold is not a stored choice (the settings key keeps
 * none); a project's or a ☆ layout's folds win when it loads.
 * 2026-10 (Josh) · MOLECULES and MO-REGISTRY join the first-visit LEFT rack under SPECTRUM (rack.js); on a phone or tablet
 * they arrive FOLDED, because enterPhone() puts the left rack's cards at the TOP of the one rack, above SETTINGS and STATE.
 * 0.4.0 S0 · `more`: MOLECULES' MORE fold (KICK / RUN / TDA / the spectra, chemview.js) is OPEN on a desktop and folded on a
 * phone or tablet; a project's or a ☆ layout's card record (`more`) wins when it loads.
 * 2026-10-16 (Josh, iteration 001) · EVERY first-visit window arrives FOLDED (minimized) on every device, and MOLECULES' MORE fold too;
 * INFORMATIONAL takes SHADOW's seat on the left rack (rack.js).
 * 2026-10-19 (Josh, iteration 011 Q2: "By default make most of the hidable texts and expandable windows minimized for default users") · `inner`:
 * EVERY fold INSIDE a window (lab/fold.js' presses, `data-fold`: INFORMATIONAL's ANNOUNCE · CURSOR · MARKS — open on a desktop until now — the
 * register's PRESET · A ↔ B · FLOW folds, FIELD's impulse knobs, SHADOW's details, CAMERA's pan and hand) arrives CLOSED on every device; a
 * project's, a ☆ layout's or the resumed session's card record (`folds`, rack-wiring.js) wins when it loads.  SPECTRUM's shells keep their own law
 * (n ≤ 6 open, n = 7 folded: they are what the window is for).
 * Node-testable: tests/first-run.test.mjs. */
const FOLD_ALL = Object.freeze(['informational', 'spectrum', 'chem', 'settings', 'state', 'palette', 'observer', 'camera', 'clip']);
/* iteration 016 W3 (Josh, call 6: "H on touch: Yan's choice (give it the kit's edge handle)") · `handle`: the kit rack's edge handle — the on-screen way
   back to a hidden rack — on a phone or tablet only (rack-wiring.js hands it createRack); a desktop keeps none, its keys and the edge peek */
export const FIRST_RUN_MATERIAL = Object.freeze({
  desktop: Object.freeze({ card: 'refractive', frost: 'always', folded: FOLD_ALL, more: false, inner: false, handle: 'never' }),
  mobile: Object.freeze({ card: 'tinted', frost: 'off', folded: FOLD_ALL, more: false, inner: false, handle: 'always' }),
});
/** the material a browser that has never said anything gets on this device */
export function firstRunMaterial(mobile) { return mobile ? FIRST_RUN_MATERIAL.mobile : FIRST_RUN_MATERIAL.desktop; }

/* ── THE QUALITY (PACE P2, 2026-09-25 — the commissioner: "don't drop below 50") ─────────────────────────────────────────
 * The GRID segment's pairing (rack.js ui.gridSeg): each grid marches its own steps at its own render scale.  A TABLET's first
 * run is the pairing's 64³ (110 steps × 0.75 — 11 ms a frame on the M5 iPad against 28 ms at the desktop's 160 × 1, the
 * device report of 2026-09-25); a desktop's is 64³ × 160 × 1 exactly as before (AUDIT-A FA6 is the desktop's call); a phone
 * keeps its own crossing (rack.js enterPhone: 64³ × 110 × 0.75, remembered and given back), so its seed is the desktop's.
 * A saved quality (a project, a link, the quick save) is applied WITHIN the device's ceiling — a tablet marches at most 96³,
 * a phone 64³, and a grid brought down takes that grid's pairing — and never carries AUTO SCALE: that switch is the
 * device's (the settings key), so a file written on a desktop cannot turn it off on an iPad. */
export const GRID_PAIRING = Object.freeze({ 64: Object.freeze({ steps: 110, scale: 0.75 }), 96: Object.freeze({ steps: 160, scale: 1 }), 128: Object.freeze({ steps: 240, scale: 1 }) });
export const FIRST_RUN_QUALITY = Object.freeze({
  desktop: Object.freeze({ res: 64, steps: 160, scale: 1 }),
  tablet: Object.freeze({ res: 64, steps: 110, scale: 0.75 }),
});
export const QUALITY_CEILING = Object.freeze({ phone: 64, tablet: 96 });
/** the grid, steps and scale a browser starts with on this device ('desktop' | 'tablet' | 'phone') */
export function firstRunQuality(device) { return { ...(device === 'tablet' ? FIRST_RUN_QUALITY.tablet : FIRST_RUN_QUALITY.desktop) }; }
/** a saved quality as this device applies it: every key but `auto`, the grid held to the device's ceiling (with that grid's
 *  pairing when it had to come down); a desktop takes the grid as saved */
export function deviceQuality(saved, device) {
  const q = { ...(saved && typeof saved === 'object' ? saved : {}) };
  delete q.auto;
  const cap = QUALITY_CEILING[device];
  if (cap && Number.isFinite(q.res) && q.res > cap) Object.assign(q, { res: cap }, GRID_PAIRING[cap]);
  return q;
}
