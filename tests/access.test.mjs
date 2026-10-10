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
import { appSource } from './helpers/app-source.mjs';   // 0.5.2: the app's source — rack.js and the modules it dissolves into

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
   moves it.  B140 measures the ear, the eye and the model together.
   0.5.0 A10 · READ OFF THE RENDERED CONTROL, NOT THE KIT'S SOURCE (the canary's red 7: MIR 1.5 builds the words through tx(),
   so a regex on the kit's ' · base · modulated' went red with the behaviour unchanged).  A real kit knob is built in the smallest
   DOM (tests/helpers/dom-shim.mjs), handed a base, driven, focused and driven again, and what it SAYS is judged — in any language:
   the base's own text, then words, and never the driven number. */
const { install } = await import('./helpers/dom-shim.mjs'); install();
const { knob } = await import('../lab/mir/kit.js');
const gfmt = (v) => 'γ ' + v.toFixed(2), dial = knob({ label: 'GAMMA', min: 0.1, max: 4, value: 1, fmt: gfmt });
const said = () => [dial.root.getAttribute('aria-valuenow'), dial.root.getAttribute('aria-valuetext') || ''];
const plain = said(); dial.setBase(() => 1.71); dial.show(2.5); const driven = said(); dial.root.focus(); dial.show(3.1); const focusedDriven = said();
const baseSaid = plain[1] === gfmt(1) && driven[0] === '1.71' && driven[1].startsWith(gfmt(1.71)) && driven[1].length > gfmt(1.71).length
  && !driven[1].includes(gfmt(2.5)) && focusedDriven[0] === '1.71' && focusedDriven[1] === driven[1];
const rackWire = /k\.setBase\(\(\) =>/.test((TEXT.get('lab/mod-port.js') || '') + appSource());   // 0.5.0 A5 moved the wire into the port
judge('A8 a control the app is DRIVING under a focused user announces the base and says so: a kit knob given setBase(fn) and driven to another number speaks the base (valuenow, and the base\'s own text followed by the word) and keeps speaking it while focused and driven again, and rack.js hands every modulation target its registry base — so what is spoken is either the current value or is explicitly framed as the base, never a stale number presented as the value',
  baseSaid && rackWire, { plain, driven, focusedDriven, rackWire });

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
judge('A4 at most ' + CEILING + ' live regions in the whole of lab/ — and the four that exist are the four that change once per user act: the banner (role="alert", the one thing a visitor without WebGPU ever sees; 0.5.0 C6b: the kit\'s #mir-banner, mir/shell/banner.js), FOLDERS\' kit toast (role="status", a save or an open; 0.5.0 C6: .pj-status left with the PROJECTS face, and the toast lives in mir/shell/notice.js), wave 68\'s .keys-say (role="status", the one binding the KEYS panel refuses) and wave 105\'s .m2hint (role="status", the modulation window\'s one message seat — 54 sentences that were being written into a display:none node). The 107 readouts are NOT among them and must never be',
  speakers.length <= CEILING, speakers);
const inReadout = speakers.filter((s) => /ro-val|ro-lbl|dev-stat/.test(s));
judge('A5 no live region is a readout or a .dev-stat — those rewrite on a 10 Hz change-guard, and a polite region on one of them queues an utterance per change on a queue that does not drop',
  inReadout.length === 0, inReadout);

/* ── 4 · the two names that would otherwise be a dingbat or nothing at all ───────────────────── */
const html = TEXT.get('lab/index.html') || '';
const skipCount = (html.match(/class="skip"/g) || []).length;
const racksNeg = /<aside id="rackL" tabindex="-1"/.test(html) && /<aside id="rack" tabindex="-1"/.test(html);
const fieldImg = /<canvas id="field" role="img"/.test(html);
/* 0.5.0 C6: IMPORT's input left index.html with the PROJECTS face — FILE › IMPORT and FOLDERS' OPEN FILE make it at the press
   (lab/projects.js pick()), so no file input in the markup may be `hidden`, and the press road must exist */
const importVh = !/<input[^>]*type="file"[^>]*\shidden/.test(html) && /pick\(\) \{ const input = document\.createElement\('input'\); input\.type = 'file'/.test(TEXT.get('lab/projects.js') || '');
judge('A6 index.html carries the two skip links, both racks as tabindex="-1" fragment targets (a target, never a stop), the canvas as role="img", and IMPORT\'s file input never `hidden` in the markup (0.5.0 C6: it is made at the press) — which resolved to display:none !important and took it out of the tab order AND out of the accessibility tree',
  skipCount === 2 && racksNeg && fieldImg && importVh, { skipCount, racksNeg, fieldImg, importVh });

/* ── 5 · the single-key law is still key-and-role shaped — 0.5.0 C3: lab/keys.js and lab/shortcuts.js LEFT for MIR's ONE KEY TABLE
   (lab/mir/shell/keys.js: ownsKey, pickAction, the one listener, bindError, read by its exact path) through λWAVES' rows (lab/key-table.js).
   The laws are the same; where each one lives now:
     · ROLES, not tags: the kit's ownsKey reads `role` (a slider its arrows, a radio its arrows, a button / link its Space and Enter);
     · A HANDLED EVENT IS HANDLED and A CONTROL THAT WILL NOT ACT DOES NOT OWN THE KEYS (wave 68): every λWAVES row is `overControls`, so a
       control keeps a key only by acting on it — the kit's knob, seg and fader prevent the default on what they turn — and the one listener
       returns on e.defaultPrevented; a disabled one acts on nothing and the app has the key;
     · SPACE IS THE TRANSPORT'S (wave 88, Josh): over any control (overControls), its release taken so a button never clicks (the kit's
       `taken`), and over a focused <select> too (key-table's own listener: the kit counts a select a field);
     · THE TAB RULE: the stage rows run only while the stage has the focus (`when`, which the kit's pickAction skips past — a `continue`), and
       the binding law refuses Tab on any chord to every other row (key-table's check over the kit's bindError). */
const kitKeys = (() => { try { return fs.readFileSync(path.join(LAB, 'mir/shell/keys.js'), 'utf8'); } catch (_) { return ''; } })();
const kt = TEXT.get('lab/key-table.js') || '';
const owned = /export function ownsKey\(n, chord\)/.test(kitKeys) && /n\.getAttribute && n\.getAttribute\('role'\)/.test(kitKeys);
const sliderOwnsNoSpace = /role === 'slider'[^\n]*return ARROWS\.has\(chord\) \|\| chord === 'PageUp' \|\| chord === 'PageDown';/.test(kitKeys);
const buttonOwnsEnterOnly = /overControls: true,/.test(kt);                 // a button's Space is the transport's; Enter stays the activator (no row holds it)
const noRoleOwnsSpace = buttonOwnsEnterOnly && /if \(owned && !a\.overControls\) continue;/.test(kitKeys);
const spaceCancelled = /if \(owned\) taken\.add\(e\.code\);/.test(kitKeys) && /if \(taken\.delete\(e\.code\)\) e\.preventDefault\(\);/.test(kitKeys);
const selectYieldsSpace = /e\.code !== 'Space' \|\| e\.defaultPrevented \|\| !t \|\| t\.tagName !== 'SELECT'/.test(kt);
const stageContinue = /when: a\.stage \? stageHasFocus : undefined/.test(kt) && /if \(ok\) return a;/.test(kitKeys);
const roleAware = owned && /\^\(radio\|tab\|option\|menuitem/.test(kitKeys);
const notDead = buttonOwnsEnterOnly && /if \(rec \|\| e\.defaultPrevented/.test(kitKeys);
const handled = /if \(rec \|\| e\.defaultPrevented \|\| e\.isComposing/.test(kitKeys);
const tabLaw = /when: a\.stage \? stageHasFocus : undefined/.test(kt) && /p\.code === 'Tab' && \(p\.mods\.length === 0/.test(kitKeys);
const tabRefused = /\/\(\^\|\\\+\)Tab\$\/\.test\(c \|\| ''\) \? 'Tab is reserved for focus navigation\.'/.test(kt);
judge('A7 the single-key law is a property of THE KEY AND THE ROLE — a slider owns the arrows, a button owns ENTER, and the arrows still step time from a focused switch — with ONE key carved out of it entirely: SPACE IS THE TRANSPORT\'S (wave 88, Josh). No role keeps it from the transport, its native activation is cancelled, and a focused <select> yields it too; Enter is the activator everywhere. And the stage guard skips one action (a `continue`), never the table (0.5.0 C3: MIR\'s ONE KEY TABLE through lab/key-table.js)',
  owned && sliderOwnsNoSpace && buttonOwnsEnterOnly && noRoleOwnsSpace && spaceCancelled && selectYieldsSpace && stageContinue,
  { owned, sliderOwnsNoSpace, buttonOwnsEnterOnly, noRoleOwnsSpace, spaceCancelled, selectYieldsSpace, stageContinue });
judge('A11 the guard knows ROLES and not tags, refuses to swallow for a control that will not act, the one listener honours e.defaultPrevented, and TAB off the stage is the browser\'s whatever the binding table says — the stage rows run on the stage alone and the binding law (lab/key-table.js over the kit\'s bindError) refuses Tab to every other row, so the trap wave 57 removed cannot be rebuilt by rebinding',
  roleAware && notDead && handled && tabLaw && tabRefused, { roleAware, notDead, handled, tabLaw, tabRefused });

console.log('\n      ' + TEXT.size + ' files read (no recursion, no browser) · wall time ' + ((Date.now() - T0) / 1000).toFixed(2) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'access.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
