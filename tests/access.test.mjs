/* tests/access.test.mjs — the three keyboard laws that can be read off the SOURCE, in two milliseconds.
 *   node tests/access.test.mjs
 *
 * Weak as tests, and that is the point: they need no browser, no GPU and no server, so they fail in the
 * fast half of test.sh on the three regressions that would otherwise cost a seven-minute run to find, and
 * they fail on a CODE READING rather than on a rendered page.  Wave 62's real proof is B121–B127 in
 * tests/boot.browser-test.mjs, which press real driver keys at real controls; this file is the guard rail
 * that stops the laws being edited out between those runs.
 *
 * (1) NO POSITIVE TABINDEX, ANYWHERE.  In a 461-control application a positive tabindex is permanent
 *     maintenance debt and a guaranteed regression: it does not reorder one control, it reorders the whole
 *     document around it.  Every tabbable thing in this lab is 0 or −1.
 *
 * (2) A `role="slider"` IS NEVER WRITTEN WITHOUT ITS FOUR NUMBERS.  A slider with no valuenow is not a
 *     slider to an assistive technology, it is a widget that refuses to say what it holds — and the
 *     valuetext is the half that carries the UNIT and the domain word, which in this codebase is a
 *     correctness matter and not a nicety: DRAG γ formats 0 as 'off', FRICTION formats 0 as '∞ · forever',
 *     ELEMENT Z formats 10 as 'Z = 10  Ne'.  A bare number would lie about all three.
 *
 * (3) THE CEILING ON SPEECH: at most FOUR live regions in the whole of lab/ (three until wave 105).  The 107 readouts rewrite on
 *     a 10 Hz change-guard, and `aria-live="polite"` on any one of them queues one utterance per change on
 *     a queue that does not drop — the application would speak continuously and nothing else could be
 *     read.  Silence plus an on-demand read is the correct treatment for a fast number.  This is the clause
 *     that stops a later wave gold-plating live regions into existence, and it is deliberately asserted
 *     twice: here on the text, and in B127 on the built page.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const LAB = path.join(ROOT, 'lab');
let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 700)));
}
const T0 = Date.now();

/** every .js / .html / .css directly under lab/ and one level down (mir/), by exact path — never a recursive walk */
function files() {
  const out = [];
  for (const d of [LAB, path.join(LAB, 'mir')]) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (/\.(js|html|css)$/.test(f)) out.push(path.join(d, f));
    }
  }
  return out;
}
const FILES = files();
const TEXT = new Map(FILES.map((f) => [path.relative(ROOT, f), fs.readFileSync(f, 'utf8')]));
const LINES = (s) => s.split('\n');

/* ── 1 · no positive tabindex ────────────────────────────────────────────────────────────────── */
const positives = [];
for (const [name, src] of TEXT) {
  LINES(src).forEach((l, i) => {
    if (/tabindex\s*=\s*["'][1-9]/i.test(l)) positives.push(name + ':' + (i + 1) + '  ' + l.trim().slice(0, 90));
    if (/tabIndex\s*=\s*[1-9]/.test(l) && !/tabIndex\s*=\s*[1-9]\d*\s*\?/.test(l)) positives.push(name + ':' + (i + 1) + '  ' + l.trim().slice(0, 90));
  });
}
judge('A1 no positive tabindex in lab/ — every tabbable seat is 0 or −1, so the tab order is the DOM\'s and stays the DOM\'s', positives.length === 0, positives.slice(0, 6));

/* ── 2 · a slider carries its four numbers ───────────────────────────────────────────────────── */
const kit = TEXT.get('lab/mir/kit.js') || '';
const roleWrites = (kit.match(/setAttribute\('role',\s*'slider'\)/g) || []).length;
const wants = ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext'];
const missing = wants.filter((w) => kit.indexOf(w) < 0);
/* both writers — knob() and fader() — must announce, so each of the four appears at least twice */
const thin = wants.filter((w) => (kit.split(w).length - 1) < 2);
judge('A2 every role="slider" in kit.js is written with aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext, in BOTH writers (knob and fader) — a slider that does not say what it holds is a widget that refuses to answer',
  roleWrites >= 2 && missing.length === 0 && thin.length === 0, { roleWrites, missing, thin });

/* the chatter guard is a boolean, and it must still be there: paint() runs from the frame loop */
const guardN = (kit.match(/!fromUser\s*&&\s*(?:focused|root\s*===\s*document\.activeElement)/g) || []).length;
const guarded = guardN >= 2;
judge('A3 the chatter guard survives in both writers: the value is announced when the USER moved it or when nobody is sitting on the control, and never in the one case that would speak — paint() runs from the frame loop for the scrub, for [data-live] dials and for every modulated target, so an unguarded write is a screen-reader live region built by accident at 60 Hz',
  guarded, { guarded, guardN });

/* WAVE 68 · AND WHAT THE GUARD LEAVES IN THE TREE MUST BE TRUE.  Silence is only half the promise: a
   screen reader reads aria-valuetext ON DEMAND, and for four waves what it read on a modulated dial was
   the string from the moment focus arrived — measured 9.3x off the instrument.  A driven dial now
   announces its BASE and says the word, which cannot go stale because the base moves only when the user
   moves it.  Read off the source here; B140 measures the ear, the eye and the model together. */
const baseWire = /function setBase\(fn\)/.test(kit) && /setBase,\s*paint\s*\}/.test(kit);
const baseSaid = /' \u00b7 base \u00b7 modulated'/.test(kit) || /' . base . modulated'/.test(kit);
const rackWire = /k\.setBase\(\(\) =>/.test(TEXT.get('lab/rack.js') || '');
judge('A8 a control the app is DRIVING under a focused user announces the base and says so: knob() takes setBase(fn), the announcement carries the word, and rack.js hands every modulation target its registry base — so what is spoken is either the current value or is explicitly framed as the base, never a stale number presented as the value',
  baseWire && baseSaid && rackWire, { baseWire, baseSaid, rackWire });

/* WAVE 68 · ONE FOLD, NOT TWO.  The wrap fold lived in the keydown handler alone, so one mouse drag on
   ACCENT A left aria-valuenow at 654.5 against a declared aria-valuemax of 360. */
const settleDef = /const settle = \(nv\) =>/.test(kit);
const settleN = (kit.match(/settle\(/g) || []).length;
const dead = /root\.setAttribute\('aria-disabled', String\(!!on\)\)/.test(kit);
judge('A9 the knob has ONE quantiser, ONE fold and ONE clamp and both roads take it (settle(), called by the pointer and by the key), and a disabled knob writes aria-disabled — a control that will not act must not look operable and must not swallow the keys',
  settleDef && settleN >= 3 && dead, { settleDef, settleN, dead });

/* WAVE 68 · THE SEAT AND THE KEYS AGREE.  seg().paint() seated the roving stop on `on` alone while
   onKey filtered on `disabled`; IN P3 shipped on Firefox with zero reachable options. */
const seat = /const live = on && !b\.disabled/.test(kit) && /b\.tabIndex = live \? 0 : -1/.test(kit);
const reseat = /new MutationObserver\(paint\)\.observe\(row/.test(kit);
judge('A10 a radiogroup can never ship with zero reachable seats: paint() seats the roving tab stop on the SAME predicate onKey moves it by (checked AND not disabled), the fallback seats the first LIVE option, and a MutationObserver on `disabled` re-seats the group whenever a caller disables one — which is the half that matters, since all three call sites disable AFTER seg() has painted',
  seat && reseat, { seat, reseat });

/* ── 3 · the ceiling on speech ───────────────────────────────────────────────────────────────── */
/* WAVE 105 · THREE BECAME FOUR, AND THE REASON IS THE ONE THIS CLAUSE ALREADY STATES.
   The modulation window computes 29 `status()` sentences and 25 `say()` sentences — a refused
   microphone, an empty preset name, an exhausted macro bank, a route that already exists — and
   until this wave EVERY ONE of them was written into a node reach-list 22 sets `display: none`
   and the modulation root inherited `visibility: hidden`.  Nothing was spoken and nothing was shown: the
   refusals were computed into nothing.  The seat is visible-while-it-speaks now and it is a
   `role="status"`, which makes it the FOURTH region.
     IT IS THE ADMITTED KIND, NOT THE FORBIDDEN ONE.  The clause bans a region on a READOUT —
   a number on a 10 Hz change-guard, which would queue an utterance per change on a queue that
   does not drop.  Every one of this seat's writers is a USER ACT (arm, tap-tempo, save, load,
   delete, route, refuse); not one is reachable from `sync()`, `paint()` or `apply()`, and the
   sentence self-expires after 4.2 s.  That is the same shape as .pj-status and .keys-say.
     A5 BELOW IS UNTOUCHED, and it is the clause that actually carries the safety: no live
   region may be a readout.  Raising a budget by one and naming the fourth is maintenance of the
   law; weakening A5 would have been an evasion of it. */
const CEILING = 4;
const speakers = [];
for (const [name, src] of TEXT) {
  if (/\.css$/.test(name)) continue;                       // a stylesheet cannot make a live region
  LINES(src).forEach((l, i) => {
    const t = l.trim();
    if (t.startsWith('*') || t.startsWith('/*') || t.startsWith('//')) return;   // a COMMENT naming a live region is not one
    const code = l.replace(/\/\*[\s\S]*?\*\//g, '');
    if (/aria-live/.test(code) || /role\s*=\s*["']status["']/.test(code) || /'role',\s*'status'/.test(code)
      || /role\s*=\s*["']alert["']/.test(code) || /'role',\s*'alert'/.test(code)) {
      speakers.push(name + ':' + (i + 1) + '  ' + l.trim().slice(0, 90));
    }
  });
}
judge('A4 at most ' + CEILING + ' live regions in the whole of lab/ — and the four that exist are the four that change once per user act: #banner (role="alert", the one thing a visitor without WebGPU ever sees), .pj-status (role="status", a save or an open), wave 68\'s .keys-say (role="status", the one binding the KEYS panel refuses) and wave 105\'s .m2hint (role="status", the modulation window\'s one message seat — 54 sentences that were being written into a display:none node). The 107 readouts are NOT among them and must never be',
  speakers.length <= CEILING, speakers);
const inReadout = speakers.filter((s) => /ro-val|ro-lbl|dev-stat/.test(s));
judge('A5 no live region is a readout or a .dev-stat — those rewrite on a 10 Hz change-guard, and a polite region on one of them queues an utterance per change on a queue that does not drop',
  inReadout.length === 0, inReadout);

/* ── 4 · the two names that would otherwise be a dingbat or nothing at all ───────────────────── */
const html = TEXT.get('lab/index.html') || '';
const skipCount = (html.match(/class="skip"/g) || []).length;
const racksNeg = /<aside id="rackL" tabindex="-1"/.test(html) && /<aside id="rack" tabindex="-1"/.test(html);
const fieldImg = /<canvas id="field" role="img"/.test(html);
const importVh = /class="vh"/.test(html) && !/accept="application\/json,\.json" hidden/.test(html);
judge('A6 index.html carries the two skip links, both racks as tabindex="-1" fragment targets (a target, never a stop), the canvas as role="img", and IMPORT\'s file input visually hidden rather than `hidden` — which resolved to display:none !important and took it out of the tab order AND out of the accessibility tree',
  skipCount === 2 && racksNeg && fieldImg && importVh, { skipCount, racksNeg, fieldImg, importVh });

/* ── 5 · the single-key law is still key-and-role shaped ─────────────────────────────────────── */
const rack = TEXT.get('lab/keys.js') || '';   // wave 130 seam 10: the dispatcher and its key-and-role law live in lab/keys.js
const owned = /const OWNED = \{/.test(rack);
const sliderOwnsNoSpace = /slider:\s*new Set\(\[\.\.\.ARROWS[^\]]*\]\)/.test(rack) && !/slider:\s*new Set\(\[[^\]]*'Space'/.test(rack);
/* WAVE 88 · THE LAW THIS LINE GUARDS HAS CHANGED, SO THE LINE CHANGES WITH IT — it is not deleted
   and it is not loosened.  Josh ruled Space to the transport alone ("the space bar will act as a
   'click' or an activate … make it so that the space bar ONLY affects the playhead AND the modulation
   play"), because after any click something is focused and Space therefore meant whatever you last
   touched.  ENTER is the activator now, for both roles, so a keyboard user loses nothing.
   THREE THINGS ARE ASSERTED, because taking Space out of OWNED is only a third of the fix:
     · no role owns Space any more (the guard cannot hand it over),
     · the dispatcher CANCELS it (or the browser fires a focused button's click by itself),
     · a <select> no longer returns early on it (a focused menu was swallowing it too). */
const buttonOwnsEnterOnly = /button:\s*new Set\(\['Enter'\]\)/.test(rack);
const noRoleOwnsSpace = !/(?:button|radio):\s*new Set\(\[[^\]]*'Space'/.test(rack);
const spaceCancelled = /if \(e\.code === 'Space'\) e\.preventDefault\(\);/.test(rack);
const selectYieldsSpace = /tag === 'SELECT' && e\.code !== 'Space'/.test(rack);
const buttonOwnsSpace = buttonOwnsEnterOnly && noRoleOwnsSpace && spaceCancelled && selectYieldsSpace;
const stageContinue = /if \(a\.stage && !stageHasFocus\(\)\) continue;/.test(rack);
/* WAVE 68: the guard reads ROLES (the logo is the lab's one <div role="button">, and Space on it opened
   the menu AND started the clock), refuses a control that will not act, and the loop honours a handled
   event.  The TAB RULE moved OFF the two stage actions and onto THE KEY, where no rebinding can get
   underneath it — two clicks in the shipped KEYS panel put wave 57's trap back, persisted to storage. */
const roleAware = /\[role="button"\]/.test(rack) && /const seatOf = \(el\) =>/.test(rack);
const notDead = /w\.disabled === true \|\| w\.getAttribute\('aria-disabled'\) === 'true'/.test(rack);
const handled = /if \(e\.defaultPrevented\) return;/.test(rack);
const tabLaw = /if \(e\.code === 'Tab' && !stageHasFocus\(\)\) return;/.test(rack);
/* optimization N4: the refusal lived in the SETTINGS KEYS capture branch, dead since 5f6421e deleted its panel; the law is
   lab/shortcuts.js bindingError now — the one road of the keyboard editor, the saved overrides and keys.bind. */
const tabRefused = /if \(binding\.key === 'Tab' && !action\.stage\) return 'Tab is reserved for focus navigation\.';/.test(TEXT.get('lab/shortcuts.js') || '');
judge('A7 the single-key law is a property of THE KEY AND THE ROLE — a slider owns the arrows, a button owns ENTER, and the arrows still step time from a focused switch — with ONE key carved out of it entirely: SPACE IS THE TRANSPORT\'S (wave 88, Josh). No role owns it, the dispatcher cancels its native activation, and a focused <select> yields it too; Enter is the activator everywhere. And the dispatcher\'s stage guard is a `continue`, not a `return` — a `return` abandoned the whole ACTIONS loop rather than skipping one action',
  owned && sliderOwnsNoSpace && buttonOwnsEnterOnly && noRoleOwnsSpace && spaceCancelled && selectYieldsSpace && stageContinue,
  { owned, sliderOwnsNoSpace, buttonOwnsEnterOnly, noRoleOwnsSpace, spaceCancelled, selectYieldsSpace, stageContinue });
judge('A11 the guard knows ROLES and not tags, refuses to swallow for a control that will not act, the ACTIONS loop honours e.defaultPrevented, and TAB off the stage is the browser\'s whatever the binding table says — enforced on THE KEY in the dispatcher and refused by the binding law (lab/shortcuts.js), so the trap wave 57 removed cannot be rebuilt by rebinding',
  roleAware && notDead && handled && tabLaw && tabRefused, { roleAware, notDead, handled, tabLaw, tabRefused });

console.log('\n      ' + TEXT.size + ' files read (no recursion, no browser) · wall time ' + ((Date.now() - T0) / 1000).toFixed(2) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'access.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
