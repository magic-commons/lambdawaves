# THE LAST SEVEN GATE BLOCKS — diagnosis, 2026-09-07

Produced by an Opus 5 investigator that re-ran the whole gate from a copy outside the
repo **with `judge`'s 300-character dump truncation removed**, plus four targeted
driver probes. Every verdict below was measured, not reasoned.

**B131 was applied in this session. The other six are specified here and NOT applied.**

> ⚠ **The tree moves under a diagnosis.** `lab.css` went from 638 to 726 CSS rules
> between the run that produced the red list and the run that produced this file (the
> keyboard manual's stylesheet). **Re-confirm every numeric baseline against a fresh
> full run before trusting a count.**

| Block | Verdict |
|---|---|
| B129 | STALE LAW — comprehensive re-baseline (waves 70/71/73/75/78/97/100 re-proportioned the ported window) |
| B131 | STALE LAW — **one selector**. ✅ APPLIED |
| B132 | STALE LAW — waves 93/97 resized and recoloured the pill seat; wave 105 removed the resting hint; **wave 106 made M the window and Ctrl+Space the arm** |
| B134 | STALE FIXTURE — the mechanism is intact; the rig presses the *shipped* card's chip, not its own |
| B135 | STALE LAW — comprehensive; waves 70/71/73 deleted the pane, the five shades and the eight `--gl-*` lights this block gates |
| B139 | STALE LAW — wave 98 removed the vividness; wave 103 gave the bar-chip a permanent lift |
| B141 | STALE LAW — superseded by wave 88 (Space belongs to the transport). **Not** the `.mod-exp` aria-label; nothing in the assertion counts roles |

---

## B131 — STALE LAW ✅ APPLIED

The probe threw at body line 32 col 15: `getComputedStyle(...)` with a **null**
argument. Wave 106 moved FRAME + AXIS out of the WAVE (`observer`) window into SETTINGS
and INVERT into PALETTE, so the OBSERVER window now contains **no `.sw` at all**. The
law text ("every other control receded to .45") is unchanged and still true — only the
witness moved.

With the selector repaired the investigator drove the block: `rulesPresent 9, ghost
30px/fixed/none/MACRO 1, stamped 12, lit 12, recede "0.45", over 1, after.lit 0,
cell[0] 62, dial[0] 34, ringBox 26,26, ringPastCell 14, ringBandPastCell 23, clrBg
rgba(0,0,0,0.28), rings/clears/spans 0, ours 1, centre/spur/wrap all true, errs 0` —
**every remaining arm passes.**

```
- recede: getComputedStyle(document.querySelector('.dev[data-id="observer"] .sw')).opacity,
+ recede: getComputedStyle(document.querySelector('.dev[data-id="settings"] .sw')).opacity,
```

---

## B134 — STALE FIXTURE (mechanism intact, no app defect)

`chipClick` searches the **whole window** for the first `.m2chk` reading 'ANCHOR'.
Wave 75 (`lab/modwindow.js:2940`, Josh: "have it by default have LFO and an ENV") seeds
an empty rack with two devices, so after the reload the cards are `s1, s2` and the rig's
own card is `s3`. Measured: the click lands on **s1** — the chip goes `on:true /
pressed:"true"` while `sourceOf(s3).anchor` stays `false` and `law` stays `'BPM'`.
Driven both ways: clicking the chip **on the rig's own card** gives `rigAnchor: true,
law: 'ANCH'` immediately. An LFO card carries TRIG · OFF · INVERT · BPM · ANCHOR ·
TRIPLET · DOTTED, so all three names the block presses exist on the rig's card.

ANCHOR:
```
  const chipClick = (name) => g.ev(`const b = [...document.querySelectorAll('#modwin .m2chk, #modwin .m2swb')]
      .find((e) => e.textContent.trim() === ${JSON.stringify(name)});
```
REPLACEMENT:
```
  const chipClick = (name) => g.ev(`const card = document.querySelector('#modwin .m2dev[data-id="' + window.__w65.s + '"]');
    const b = [...card.querySelectorAll('.m2chk, .m2swb')]
      .find((e) => e.textContent.trim() === ${JSON.stringify(name)});
```

Law text — ANCHOR:
```
so this block CLICKS those three buttons, in the ported window, by their own labels, and then drives the transport with the real key.
```
REPLACEMENT (note the escaped apostrophe — this sits inside a single-quoted JS string):
```
so this block CLICKS those three buttons, ON THE RIG\'S OWN CARD, by their own labels, and then drives the transport with the real key. The card is named and not merely found: wave 75 ships the rack with an LFO and an ENV (Josh, "have it by default have LFO and an ENV for testing"), so the FIRST chip in the window reading ANCHOR belongs to the shipped device and a press on it moves a source this block is not measuring — a fixture that reads green on a rack of one and silently measures nothing on a rack of three.
```

---

## B141 — STALE LAW (superseded by wave 88)

Measured `space {barHidden: true, playing: true, t: 1.7588}` — the menu does **not**
open and the transport **does** move. That is wave 88's deliberate ruling, filed by Josh
as an emergency: *"currently if a 'last controlled' knob, dropdown or something … the
space bar will act as a 'click' … make it so that the space bar ONLY affects the
playhead AND the modulation play."* `rack.js:4774` now reads
`button: new Set(['Enter'])`, `rack.js:4869` cancels Space's native activation, and
`rack.js:3769` gates the logo's own handler on `e.code !== 'Enter' && e.code !==
'NumpadEnter'`. The same ruling is already gated statically by `access.test.mjs` A7.

Failing arms: `logo1T.barHidden === false` (is `true`), `logo1T.playing === false` (is
`true`), `logo1T.t === logo0T.t0` (0 → 1.7588), `logo2T.playing === false` (is `true`),
`logo3T.swAfter !== logo2T.swBefore` (both `"false"` — a real `<button>` no longer takes
Space either).

> Aside worth acting on: the law text's claim that `#title` is *the one*
> `<div role="button">` is now false — `lab/modwindow.js:1510` gives the macro-rail head
> `role="button"` too.

ANCHOR:
```
      && logo1T.barHidden === false && logo1T.playing === false && logo1T.t === logo0T.t0
      && logo2T.barHidden === true && logo2T.backOnLogo && logo2T.playing === false && logo2T.swFocused
      && logo3T.swAfter !== logo2T.swBefore && logo3T.swRestored && logo3T.playing === false
```
REPLACEMENT:
```
      && logo1T.barHidden === true && logo1T.playing === true && logo1T.t > logo0T.t0
      && logo2T.barHidden === true && logo2T.backOnLogo && logo2T.playing === true && logo2T.swFocused
      && logo3T.swAfter === logo2T.swBefore && logo3T.swRestored && logo3T.playing === false
```

Law heading — ANCHOR:
```
  judge('B141 ONE PRESS DOES ONE THING, AND THE GUARD KNOWS ROLES (wave 68). #title is the one <div role="button"> in the lab
```
REPLACEMENT:
```
  judge('B141 SPACE IS THE TRANSPORT\'S AND NOBODY ELSE\'S, AND THE GUARD STILL KNOWS ROLES (wave 68, re-based on wave 88). #title is a <div role="button"> wave 62 created deliberately
```

Law body — ANCHOR:
```
B126 could not see it because Enter is bound to no action. Pressed here with a real driver Space: the menu opens and the transport does NOT move. Two more halves of the same law in the same run — a real <button> still keeps Space (the switch flips, the transport does not), which is what wave 62 promised and what always worked;
```
REPLACEMENT:
```
WAVE 88 SETTLED IT THE OTHER WAY, and Josh filed it as an emergency: "if a last-controlled knob, dropdown or something in the native UI and plugin is used, the space bar will act as a click or an activate. Can you make it so that the space bar ONLY affects the playhead AND the modulation play." So Space is carved out of the OWNED sets entirely, ENTER is the activator for both roles, and the dispatcher cancels the native activation before the ACTIONS loop so the cancellation does not depend on Space still being bound. Pressed here with a real driver Space: the menu STAYS SHUT and the transport MOVES (measured: playing false to true, t 0 to 1.76 s), and the second half is the one that used to be a defect and is now the promise — a real <button> does not take Space either (the switch does not flip and the transport does);
```

**OPTIONAL, UNVERIFIED (the investigator did not drive it).** The ROLE half of the law
is now untested. To restore it, press Enter before the Escape — ANCHOR:
```
  await press(KEY.ESC);
  const logo2T = await g.ev(`try { await new Promise((r) => setTimeout(r, 200));
```
REPLACEMENT:
```
  await press(KEY.ENTER);
  const logoEnterT = await g.ev(`try { await new Promise((r) => setTimeout(r, 400));
    return { barHidden: document.getElementById('menubar').hidden, playing: __LW.clock.playing };
  } catch (e) { return { error: String(e && e.stack || e) }; }`) || { error: 'no result' };
  await press(KEY.ESC);
  const logo2T = await g.ev(`try { await new Promise((r) => setTimeout(r, 200));
```
…and add `&& logoEnterT.barHidden === false` to the expression.

---

## B139 — STALE LAW

Three failing arms, both from named Josh rulings. `fpT.off.head === 'none'` measures
`"brightness(1.03) saturate(1.03)"` — wave 103 (`skin.css:577`, Josh: *"let it be 103%
brightness and 103% saturation for the disconnected bar to distinguish the bar from the
contents"*) gives `.dev-head` a permanent backdrop lift. `fpT.recipe` is false because
wave 98 (`skin.css:49`, Josh asked twice: *"no saturation, no brightening"*) reduced
`--frost-filter` to `blur(var(--glass-blur))`. Measured `always.body "blur(22px)"`,
`always.head "blur(22px) brightness(1.03) saturate(1.03)"`. Everything else passes.

ANCHOR 1 (inside a template literal — keep the doubled backslashes):
```
    out.recipe = /^blur\\([0-9.]+px\\) saturate\\(1\\.88\\) brightness\\(1\\.08\\)$/.test(out.always.head);
```
REPLACEMENT:
```
    out.recipe = /^blur\\([0-9.]+px\\)$/.test(out.always.body)
      && out.always.head === out.always.body + ' brightness(1.03) saturate(1.03)';
```

ANCHOR 2:
```
    !fpT.error && fpT.off.cls === false && fpT.off.head === 'none' && fpT.off.api === 'off' && fpT.off.live === false
      && fpT.recipe && fpT.always.body === fpT.always.head && fpT.always.root === 'none' && fpT.always.live === true
```
REPLACEMENT:
```
    !fpT.error && fpT.off.cls === false && fpT.off.head === 'brightness(1.03) saturate(1.03)' && fpT.off.api === 'off' && fpT.off.live === false
      && fpT.recipe && fpT.always.body !== fpT.always.head && fpT.always.root === 'none' && fpT.always.live === true
```

ANCHOR 3:
```
      && fpT.back.cls === false && fpT.back.head === 'none' && fpT.saved === 'off' && fpT.errs === 0, fpT);
```
REPLACEMENT:
```
      && fpT.back.cls === false && fpT.back.head === fpT.off.head && fpT.saved === 'off' && fpT.errs === 0, fpT);
```

Law text — ANCHOR:
```
The vividness is BASINS\' recipe verbatim — saturate(188%) brightness(108%) against our old 115% — over the GLASS BLUR knob\'s own radius,
```
REPLACEMENT:
```
WAVE 98 TOOK THE VIVIDNESS BACK OUT, and it is Josh asked twice ("no saturation, no brightening"): wave 97 had proved the plugin and the ABOUT card were computing BASINS\' saturate(188%) brightness(108%) identically, so it was the RECIPE he was ruling on and not a mismatch, and --frost-filter is a plain blur of the GLASS BLUR knob\'s own radius now — one token, so every frosted surface loses the two terms together. WHAT SURVIVES IS SMALLER AND IS THE OTHER HALF OF HIS SENTENCE (wave 103): the DISCONNECTED bar-chip alone carries brightness(1.03) saturate(1.03), a BACKDROP filter and not a fill, so the bar is told apart from the card under it by what the light does passing through it — composed with FROST rather than replacing it, which is why the head reads blur then the lift and the body reads the blur alone. The measurement below is the original one and stands,
```

---

## B132 — STALE LAW

Four failing arms.
1. `w65seatT.pill.join() === '26,24'` measures `[45,34]` — `skin.css:332` gives
   `#transport.mini .tbtn.modb` `width:auto; min-width:44px; height:34px; padding:0 10px`.
2. `w65seatT.onC === w65seatT.acc2` — measured `onC rgb(152,87,255)` = `--acc`,
   `acc2 rgb(212,255,123)`. Wave 97 (Josh: *"have the mod button on the native playhead
   be accent color when on and a deactivated grey when it's off"*) moved it to **Accent
   A** with `--ink-faint` off, and the block never resolves `--acc`.
3. `w65armT.hint === 'MOD IS OFF'` — wave 105 made `.m2hint` a transient say-seat, so
   **`restingHint()` at `lab/modwindow.js:200` is dead code with zero callers.**
4. The whole key arm: wave 106 made `modArm` `{key:'Space', ctrl:true}` and gave `KeyM`
   to `modWin`, so `press('m')` opens the window and the arm never moves.

```
ANCHOR   const probe = document.createElement('span'); probe.style.color = 'var(--acc2)';
         document.body.appendChild(probe); const acc2 = getComputedStyle(probe).color; probe.remove();
REPLACE  const probe = document.createElement('span'); probe.style.color = 'var(--acc2)';
         document.body.appendChild(probe); const acc2 = getComputedStyle(probe).color;
         probe.style.color = 'var(--acc)'; const acc = getComputedStyle(probe).color; probe.remove();

ANCHOR              sameNode: same, wasDocked: inDocked, isPill: inPill, onC: onC, offC: offC, acc2: acc2,
REPLACE             sameNode: same, wasDocked: inDocked, isPill: inPill, onC: onC, offC: offC, acc2: acc2, acc: acc,

ANCHOR        && w65seatT.pill.join() === '26,24' && w65seatT.docked.join() === '44,44'
REPLACE       && w65seatT.pill[0] >= 44 && w65seatT.pill[1] === 34 && w65seatT.docked.join() === '44,44'

ANCHOR        && w65seatT.onC === w65seatT.acc2 && w65seatT.onC !== w65seatT.offC
REPLACE       && w65seatT.onC === w65seatT.acc && w65seatT.onC !== w65seatT.acc2 && w65seatT.onC !== w65seatT.offC

ANCHOR        && w65armT.keptPlaying === false && w65armT.hint === 'MOD IS OFF'
REPLACE       && w65armT.keptPlaying === false

ANCHOR   (first press)   await press('m');
REPLACE                  await press(KEY.SPACE, [KEY.CTRL]);

ANCHOR   (second press)  await press('m');
                         const w65keyD = await g.ev(
REPLACE                  await press(KEY.SPACE, [KEY.CTRL]);
                         const w65keyD = await g.ev(
```

Law text — ANCHOR:
```
The glow is ACCENT B resolved live from the page — the colour modulation wears everywhere in this instrument — and not a hex.
```
REPLACEMENT:
```
The glow is ACCENT A resolved live from the page and not a hex — wave 97 moved it off Accent B and took the fill and the rim with it (Josh: "have the mod button on the native playhead be accent color when on and a deactivated grey when it is off"), so the two states are carried by the INK alone, --acc live against --ink-faint stood down, which is one rung below the --ink-key its neighbours wear. THE PILL SEAT IS A WORD AND NOT A DINGBAT NOW: width auto over a 44-px floor at the row own 34-px height, so the button holds MOD at the density every other seat on that bar sits at, while the DOCKED face is still the whole 44 x 44.
```

Law text — ANCHOR:
```
MOD OFF hands back BOTH, with Object.is and not a tolerance, and the window says so on its own hint line; re-arming picks both up again, and the modulation transport kept its position through the disarm rather than being quietly stopped. The m key is the same act, it is rebindable, and it SURVIVES A RELOAD in this browser\'s settings.
```
REPLACEMENT:
```
MOD OFF hands back BOTH, with Object.is and not a tolerance; re-arming picks both up again, and the modulation transport kept its position through the disarm rather than being quietly stopped. The window no longer SAYS so on a resting hint line and that is wave 105 (Josh removed the permanent prose from the foot of the instrument): the hint seat carries a transient message and nothing at rest, so what says MOD IS OFF is the seat itself — aria-pressed false and the ink stood down — which this block reads. CTRL+SPACE is the same act, it is rebindable, and it SURVIVES A RELOAD in this browser settings — wave 106 gave the bare m key to the MODULATION WINDOW instead, because a door is what a bare letter is for and an arm is a modifier away from the transport it arms.
```

---

## B135 — STALE LAW (comprehensive)

This block gates a design three later waves deleted.
- **Wave 70** (`modhost.css:607`, Josh on the light theme: *"Remove the background and
  make it just scrolling windows for the ENV/LFO/AUDIO to sit in"*) moved the plate one
  level in — the pane is gone and `.m2dev` is the card.
- **Wave 71** set `--m2-mat-chassis/control/status: transparent` (Josh: *"remove any
  shading or tinting off everything"*) and turned all seven `--gl-*` lights back to
  `transparent`.
- **Wave 73** made `#modwin` itself a `visibility:hidden`, `background:transparent`,
  `border-radius:0`, `box-shadow:none` layout box.

Measured against the demands: `dark.pane` is `rgba(0,0,0,0)` not `rgba(28,32,38,0.84)`;
`shades` 3 not 6; `field {edge 100, device 16, control 16}` not `{16, 14.4, 13.5}`;
`plates.length` 11 not 1; `bevel.stillInert` 7 not 0; `invert.ctlDark/ctlLight` both 0;
`type.holdH` 34 not 44. **`cssChars 129441 / jsChars 63798 / literalsLeft 75` all still
pass — the artifact IS byte-identical to the staged copy** (diffed `lab/mir/modwindow/*`
against staging: identical).

The full patch is six anchors plus a long law-text replacement; see the investigator's
transcript. The two probe repairs it needs:
```
ANCHOR     out.A1t = { pane: getComputedStyle(win).backgroundColor, house: houseCard() };
REPLACE    out.A1t = { pane: getComputedStyle(win).backgroundColor, house: houseCard(),
                       chassis: cs('.m2dev', 'backgroundColor') };

ANCHOR     const paneRGB = getComputedStyle(win).backgroundColor;
REPLACE    const paneRGB = cs('.m2dev', 'backgroundColor');   /* wave 70: the plate moved one level in */

ANCHOR       a11yArms: (host.match(/prefers-reduced-transparency|prefers-contrast/g) || []).length };
REPLACE      a11yArms: (host.match(/@media \(prefers-reduced-transparency|@media \(prefers-contrast/g) || []).length };
```

---

## B129 — STALE LAW (comprehensive re-baseline)

The geometry table is a wave-64 baseline that waves 70–100 deliberately moved, and its
§6 fixture drives a fold cycle that no longer exists.

- **Wave 73** made `#modwin` a layout box → `frame.radius` `0px`, not `12px`.
- **Wave 97** (`modhost.css:2148`, Josh: *"make them much flatter so that there is a
  margin around the glass underlayer"*) brought every work-bar seat's PAINT down to
  34 px with the 44-px target restored by a `::before` band — hence `lane.precore/
  prename` 34, `xport/tap` `44,34`, `bank` `46,34`, `grab` `16,34`, and
  `Math.min(short44)` 34. The bar is 46 not 52; the card 360×336 at radius 12 with a
  40-px head; the rail 200×336; the knobs all 48.
- **Wave 75** retired the in-run ADD button to `display:none` → `card.add [0,0]`.
- **Wave 78** retired the reorder arrows → `D3_move` is `none`, not `flex`.
- **Waves 100/101** made COMPACT a rack-level chip and `.m2fold` a **two-state toggle**.
  Five clicks were driven and measured `full, minimized, full, minimized, full` — there
  is **no COMPACT control in the window at all**, and the probe's three-click assumption
  leaves the card MINIMIZED, which is why `short44` came back with six zeros and `min`
  came back all-null. **That is one cascade, not six failures.**
- **Wave 97** also replaced `.m2meter` and `.m2lfominshape` with one `.m2mintrace` (30×106).

Two divergences are **by design** and the patch should say so: the picker sheet sits at
.97 (the house menu opacity), so `D1_pick === D1_want` is false deliberately; and reach
31 sets `.crail-chip::before { background-color: transparent }`, so
`string.chipBefore !== transparent` is false deliberately (measure `boxShadow` and
`borderTopColor` instead).

> ⚠ **`law.h` 440 vs `law.lawH` 466 is a REAL broken invariant and deserves your eye.**
> The artifact's own arithmetic size law no longer predicts the window the host builds,
> because the density overrides are host CSS that the artifact's `geometry()` cannot
> see. Not user-visible — but §7's promise ("THE SIZE LAWS ARE ARITHMETIC and the built
> window equals them") is now false. Record the delta rather than hiding it.

> **§10's break-it demonstration is now vacuous.** The host's rules moved to
> `[aria-label$="window controls"]` — a **suffix** match — so sentence-casing the label
> to "Modulation window controls" still matches. Driven: nothing changed, on `::before`
> background, shadow, rim or font-family. That is strictly better behaviour (the label
> is no longer a single point of failure), but the proof-by-breaking is dead.
> `occurrences === 27` still counts the artifact's own 27 exact-match rules and passes.
> **Say so in the law text rather than leaving a passing arm that proves nothing.**
