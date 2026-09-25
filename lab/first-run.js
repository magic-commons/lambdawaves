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
