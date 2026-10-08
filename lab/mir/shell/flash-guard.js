/* MIR · shell/flash-guard.js — THE FLASH GUARD and THE PHOTOSENSITIVITY NOTICE.
 *
 * WCAG 2.2 success criterion 2.3.1, "Three Flashes or Below Threshold": nothing may flash more than three times in
 * any one second.  A FLASH is a pair of opposing changes in relative luminance of 10 % or more of the maximum, where
 * the darker state is below 0.80, over an area larger than about a quarter of the central field of view.
 * The numbers are the ones POLAR DYNAMICS and EARTH ship (POLAR lab/engine/flash.js, EARTH law 110), which are that
 * criterion's: DELTA 0.1 · DARK 0.8 · AREA 0.25 · LIMIT 3 a second · a 1.25 s judging window · let go after 1 s quiet.
 *
 * Two halves, both pure (node runs them):
 *   1. THE LIMITER — createFlashGuard().  A PARAMETER that drives the picture (an LFO on a brightness, a strobe rate) is
 *      passed through guard(value, route) on its way to the renderer.  Each ROUTE (a name the app chooses, e.g.
 *      'LFO SQUARE → exposure') keeps its own count of opposing swings of `delta` (as a fraction of the route's range).
 *      A swing that would make that route's OUTPUT change direction more than 2 × maxHz times inside any one second is
 *      REFUSED: the value is HELD where it was, and the trip is reported with the route that did it and the rate it
 *      tried (POLAR's LAST TRIP: "LFO SQUARE 10.0 Hz → exposure").  A slow change is never touched, and a route that
 *      flashes is held to the safe rate (≤ 3 flashes a second), not frozen: its swings still pass, three a second.
 *   2. THE FIELD JUDGE — areaEvent / flashRate / createFlashModel, POLAR's and EARTH's own (lifted as they are), for
 *      an app that MEASURES the presented picture (a 64² luminance readback): samples in frame order → 'trip' |
 *      'release'.  The measurement (a GPU readback) stays the app's; the arithmetic is here.
 *
 * And the page half: the PHOTOSENSITIVITY NOTICE (λWAVES' `warning`, copied into AUTOMATA as lab/notice.js), shown
 * ONCE per browser before the first use of a route that can flash.  The trap is λWAVES': no Escape and no outside
 * press — the way past is to read it and press CONTINUE.  It is a floating pane with no scrim (INTENT rule 7), where
 * λWAVES drew a black full-screen page.  Under a test driver (navigator.webdriver) it is not shown unless forced.
 * `every: true` is BASINS' EVERY COLD START (its startup.js shows it on each load, `?warn=0` skips it): the stored
 * record is neither read nor written, so the notice comes back with every page load.  The default stays once per
 * browser.  `art` (an image URL) puts the app's own picture above the words, BASINS' caution triangle.
 *
 * createFlashGuard({ maxHz = 3, delta = 0.1, window = 1, release = 1, ranges, now, onTrip, onRelease })
 *   → guard(value, route, t?) → the value to use        guard.state(route) → { hz, held, trips, lastTrip }
 *     guard.lastTrip → { route, hz, at } | null           guard.reset(route?)    guard.enabled (get/set)
 * photosensitivityNotice({ key, title, body, accept, driver, force, every, art, alt, storage }) → Promise<true> once read
 * flashNoticeSeen({ key, storage }) → boolean · forgetFlashNotice({ key, storage }) */

export const WCAG = Object.freeze({ maxHz: 3, delta: 0.1, dark: 0.8, area: 0.25, windowS: 1.25, releaseS: 1 });
const nowS = () => (globalThis.performance ? performance.now() : Date.now()) / 1000;

/* ── 1. the limiter ───────────────────────────────────────────────────────────────────────────────────────── */
export function createFlashGuard({ maxHz = WCAG.maxHz, delta = WCAG.delta, window: win = 1, release = WCAG.releaseS, ranges = {}, now = nowS, onTrip = null, onRelease = null } = {}) {
  const routes = new Map();
  const maxChanges = Math.floor(2 * maxHz);              // three flashes = six changes of direction in one second
  let enabled = true, lastTrip = null;
  const span = (route) => { const r = ranges[route]; return r ? Math.abs(r[1] - r[0]) || 1 : 1; };
  const rec = (route) => {
    let r = routes.get(route);
    if (!r) routes.set(route, r = { out: null, anchor: null, dir: 0, changes: [], inAnchor: null, inDir: 0, inChanges: [], held: false, trips: 0, lastHeld: -1e9, lastTrip: null });
    return r;
  };
  const trim = (list, t) => { while (list.length && t - list[0] >= win) list.shift(); };
  /* the rate the input is trying: n changes of direction span n − 1 half periods */
  const rateOf = (c) => (c.length < 2 ? 0 : Math.round(((c.length - 1) / 2 / Math.max(1 / 240, c[c.length - 1] - c[0])) * 10) / 10);
  /* the INPUT's own rate, for the report: every swing it makes, accepted or not */
  function watchInput(r, v, t, d) {
    if (r.inAnchor === null) { r.inAnchor = v; return; }
    const step = v - r.inAnchor, dir = Math.sign(step);
    if (Math.abs(step) >= d && dir !== r.inDir) { r.inChanges.push(t); r.inDir = dir; r.inAnchor = v; }
    else if (dir !== 0 && dir === r.inDir) r.inAnchor = v;
    trim(r.inChanges, t);
  }
  function guard(value, route = 'route', t = now()) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return value;
    const r = rec(route), d = delta * span(route);
    watchInput(r, value, t, d);
    if (!enabled) { r.out = value; r.anchor = value; return value; }
    if (r.out === null) { r.out = r.anchor = value; return value; }
    trim(r.changes, t);
    const step = value - r.anchor, dir = Math.sign(step);
    if (Math.abs(step) >= d && dir !== r.dir) {                       // a change of direction big enough to count
      if (r.changes.length >= maxChanges) {                           // it would be one too many this second: hold
        r.lastHeld = t;
        if (!r.held) {
          r.held = true; r.trips++;
          lastTrip = r.lastTrip = { route, hz: rateOf(r.inChanges), at: t };
          if (onTrip) { try { onTrip(lastTrip); } catch (_) {} }
        }
        return r.out;
      }
      r.changes.push(t); r.dir = dir; r.anchor = value; r.out = value;
    } else {
      if (dir !== 0 && dir === r.dir) r.anchor = value;              // carry on the same way: the turning point moves with it
      r.out = value;                                                  // under the threshold, or onward: it passes untouched
    }
    if (r.held && t - r.lastHeld >= release) { r.held = false; if (onRelease) { try { onRelease({ route, at: t }); } catch (_) {} } }
    return r.out;
  }
  guard.state = (route) => { const r = routes.get(route); if (!r) return null; return { hz: rateOf(r.inChanges), held: r.held, trips: r.trips, lastTrip: r.lastTrip, out: r.out }; };
  guard.reset = (route) => { if (route === undefined) { routes.clear(); lastTrip = null; } else routes.delete(route); };
  guard.routes = () => [...routes.keys()];
  Object.defineProperty(guard, 'lastTrip', { get: () => lastTrip });
  Object.defineProperty(guard, 'enabled', { get: () => enabled, set: (on) => { enabled = !!on; } });
  /** the trip as a sentence, POLAR's LAST TRIP: "LFO SQUARE → exposure · 10 Hz" */
  guard.describe = (trip = lastTrip) => (trip ? trip.route + (trip.hz ? ' · ' + trip.hz.toFixed(1) + ' Hz' : '') : '');
  return guard;
}

/* ── 2. the field judge (POLAR lab/engine/flash.js, EARTH's law 110, as they are) ─────────────────────────── */
/** one sample's event from two luminance fields (bytes 0–255 = linear 0–1): ±1 one direction over AREA, 2 mixed, 0 none */
export function areaEvent(prev, cur, { delta = WCAG.delta, dark = WCAG.dark, area = WCAG.area } = {}) {
  let up = 0, down = 0; const n = cur.length, d = delta * 255, dk = dark * 255;
  for (let i = 0; i < n; i++) { const a = prev[i], b = cur[i]; if (Math.min(a, b) >= dk) continue; if (b - a >= d) up++; else if (a - b >= d) down++; }
  return up / n >= area ? 1 : down / n >= area ? -1 : (up + down) / n >= area ? 2 : 0;
}
/** flashes a second over the samples' own span (never less than half a second) */
export function flashRate(samples) {
  let changes = 0, dir = 0;
  for (const s of samples) { if (!s.ev) continue; if (s.ev === 2) { changes++; continue; } if (dir && s.ev !== dir) changes++; dir = s.ev; }
  const span = samples.length > 1 ? Math.max(0.5, samples[samples.length - 1].t - samples[0].t) : 1;
  return changes / 2 / span;
}
/** the decision: take(t, lum) in frame order → 'trip' | 'release' | '' */
export function createFlashModel({ limit = WCAG.maxHz, windowS = WCAG.windowS, releaseS = WCAG.releaseS } = {}) {
  const S = { samples: [], guarding: false, perSecond: 0, lastEvent: -1e9, trips: 0, releases: 0, reads: 0, prev: null };
  return {
    state: S,
    take(t, lum) {
      const ev = S.prev ? areaEvent(S.prev, lum) : 0; if (ev) S.lastEvent = t;
      if (!S.prev || S.prev.length !== lum.length) S.prev = new Uint8Array(lum.length); S.prev.set(lum); S.reads++;
      S.samples.push({ t, ev }); while (S.samples.length && t - S.samples[0].t > windowS) S.samples.shift();
      S.perSecond = flashRate(S.samples);
      if (!S.guarding && S.perSecond > limit) { S.guarding = true; S.trips++; return 'trip'; }
      if (S.guarding && t - S.lastEvent >= releaseS) { S.guarding = false; S.releases++; return 'release'; }
      return '';
    },
    reset() { S.prev = null; S.samples.length = 0; S.perSecond = 0; }
  };
}

/* ── the photosensitivity notice ─────────────────────────────────────────────────────────────────────────── */
const KEY = 'mir.flashNotice';
const store = (s) => { try { return s || globalThis.localStorage || null; } catch (_) { return null; } };
export function flashNoticeSeen({ key = KEY, storage } = {}) { try { return store(storage)?.getItem(key) === '1'; } catch (_) { return false; } }
export function forgetFlashNotice({ key = KEY, storage } = {}) { try { store(storage)?.removeItem(key); } catch (_) {} }

let showing = null;
/** photosensitivityNotice(opts) → Promise<true>, resolved once the notice has been read (at once if it was before).
 *  Call it before the first use of a route that can flash; a second call while it shows joins the first. */
/* THE WORDS AND THE LOOK ARE BASINS' (Josh, 2026-10-07: "return the design of the warning to the original design (font,
   text, spacing, button dimensions …)"): basins-ui-fixes app/startup.js `warning()` and startup.css .mandel-warn-*, on
   the kit's pane, tokens and trigger (parts.css: the notice) — the picture first, then the title, the words, CONTINUE */
export function photosensitivityNotice({ key = KEY, storage, title = 'PHOTOSENSITIVITY WARNING',
  body = 'This app displays rapid strobing effects and changing colors. If you have a history of photosensitive epilepsy or seizures, do not continue.',
  accept = 'CONTINUE', driver, force = false, every = false, art, alt = '' } = {}) {
  if (!every && flashNoticeSeen({ key, storage }) && !force) return Promise.resolve(true);
  const webdriver = driver !== undefined ? driver : !!(globalThis.navigator && navigator.webdriver === true);
  if (webdriver && !force) return Promise.resolve(true);             // λWAVES wave 59: a test driver is never trapped by it
  if (showing) return showing;
  showing = import('./dialog.js').then(({ openDialog }) => {
    let mark = 'caution';                                               // the app's picture, else the kit's sign, above the title
    if (art) { mark = document.createElement('img'); mark.className = 'mir-notice-art'; mark.src = art; mark.alt = alt; mark.draggable = false; }
    const d = openDialog({ title, body, kind: 'notice', dismiss: false, mark, actions: [{ label: accept, kind: 'primary', run: () => true }] });
    return d.result;
  }).then(() => { if (!every) { try { store(storage)?.setItem(key, '1'); } catch (_) {} } showing = null; return true; });
  return showing;
}
