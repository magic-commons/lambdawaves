/* motion-pref.js — THE MOTION PREFERENCE, as this page resolves it (a seam out of rack.js boot(), optimization 2026-09-24 · N7
 * seam 1, AUDIT-E §6: zero closure edges).  createMotionPref() is called once, where the block stood, and hands back
 * the same two things boot() always had: MOTION (the live state object LW.motion reads) and paceRate. */
/* ── WAVE 57 · WHAT "REDUCED MOTION" MEANS FOR A STROBING VOLUMETRIC RENDER ─────────────────────────
 * `prefers-reduced-motion: reduce` is the strongest thing a user can say about movement, and until this
 * wave the app's ENTIRE answer to it was to switch off a 120 ms scale on the logo.  The thing the
 * photosensitivity notice exists to warn about — the field, evolving — never heard it.
 *
 * IT DOES NOT MEAN FROZEN, and that is a decision, not a shortcut.  This is a time-evolution instrument:
 * a frozen field is not a reduced λWAVES, it is a broken one, and the preference asks for less motion,
 * not for the physics to stop.  What makes a strobe dangerous is the RATE at which the luminance
 * changes, and the rate is exactly the quantity the clock already owns (a.u. per wall second).  So:
 *   1. NOTHING MOVES UNASKED.  `?play=1` — the one thing that starts the transport without a press, and
 *      the thing a shared link can carry — is refused.  The PLAY button is untouched and always works.
 *   2. WHEN IT IS ASKED TO MOVE IT MOVES AT A QUARTER SPEED, and only where nobody chose the number: a
 *      rate a PRESET, a project or a link asks for is divided by 4; a rate the RATE knob was dragged to
 *      is not touched, because a default is for a first visit and the hand always wins (STYLE-LOCK).
 * `?motion=reduce` / `?motion=full` name the input the way `?warn=` does, so a gate can ask the question
 * without a browser profile; otherwise it is the media query, live.
 * WAVE 59 · AND BOTH OF THEM ARE BEHIND `navigator.webdriver` NOW.  `?motion=full` in a shared link
 * overrode the visitor's OPERATING-SYSTEM `prefers-reduced-motion: reduce` — the strongest thing a person
 * can say about movement, and the one this app's photosensitivity notice exists beside.  A link is somebody
 * else's picture (wave 56's own law about the fragment); it does not get to answer that question for the
 * reader.  `?motion=reduce` is gated with it for the same reason `?warn=1` is: a gate with one arm
 * reachable from a public URL is not one rule. */
export function createMotionPref() {
  const MOTION = (() => {
    const q0 = navigator.webdriver === true ? new URLSearchParams(location.search).get('motion') : null;
    const mq = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)')) || null;
    const forced = q0 === 'reduce' ? true : q0 === 'full' ? false : null;
    const st = { divisor: 4, source: forced === null ? 'media' : 'query', reduced: forced === null ? !!(mq && mq.matches) : forced, autoplay: 'not asked' };
    if (forced === null && mq && mq.addEventListener) mq.addEventListener('change', (e) => { st.reduced = e.matches; });
    return st;
  })();
  /** the rate NOBODY CHOSE — a preset's, a project's, a link's — paced for this browser's motion preference */
  const paceRate = (r) => (MOTION.reduced ? r / MOTION.divisor : r);
  return { MOTION, paceRate };
}
