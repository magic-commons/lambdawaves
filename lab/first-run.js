/* first-run.js — THE FIRST-RUN MATERIAL, a pure function of one fact: is this a phone or a tablet?
 *
 * W125 (Josh, 2026-09-25).  A new desktop gets the clear glass: REFRACTIVE cards and FROST ALWAYS.  A new phone or tablet
 * gets FROST OFF and TINTED cards — a touch device paints the field on a low-power GPU, and a backdrop filter over it is
 * the one thing it pays most for.  rack.js asks the question with its OWN crossings (isPhone(): skin.css's `--phone`
 * sentinel; isTablet(): the iPad UA or a coarse, hover-less pointer on a screen ≥ 600 px) — no second detection here.
 *
 * STORED CHOICES WIN, read by the laws rack.js has always used (so a returning browser keeps exactly what it had):
 *   card   a surface this browser SAID (cardSet === true) and that names one of the two; anything else is not a choice,
 *          and the device's default applies (wave 51: said, not merely saved);
 *   frost  a stored policy; a legacy boolean `true` means ALWAYS (wave 67); anything unreadable falls to the default.
 * The phone crossing's FROST OFF override (enterPhone) is a separate, later law and is not decided here.
 * Node-testable: tests/first-run.test.mjs. */
export const FIRST_RUN_MATERIAL = Object.freeze({
  desktop: Object.freeze({ card: 'refractive', frost: 'always' }),
  mobile: Object.freeze({ card: 'tinted', frost: 'off' }),
});
/** the material a browser that has never said anything gets on this device */
export function firstRunMaterial(mobile) { return mobile ? FIRST_RUN_MATERIAL.mobile : FIRST_RUN_MATERIAL.desktop; }
/** the card a stored settings object SAID, else `fallback` */
export function storedCard(s, fallback) {
  return s && s.cardSet === true && (s.card === 'tinted' || s.card === 'refractive') ? s.card : fallback;
}
/** the frost policy a stored settings object holds (legacy `true` = ALWAYS), else `fallback`; always one of the three seats */
export function storedFrost(s, fallback) {
  const v = s && s.frost === true ? 'always' : ((s && s.frost) || fallback);
  return v === 'still' || v === 'always' ? v : 'off';
}
/** what a boot applies: the stored choice where there is one, the device's first-run material where there is not */
export function bootMaterial(s, mobile) {
  const d = firstRunMaterial(mobile);
  return { card: storedCard(s, d.card), frost: storedFrost(s, d.frost) };
}

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
