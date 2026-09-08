# WAVE 107 — the closing Astra did not get to write

> Continuation correction: the historical review below is retained. Read the evidence-backed
> addendum at the end before acting on its reopened-task or remaining-defect conclusions.

She was rate-limited after committing `ce70497` and before writing this. Reconstructed
from the diff and from a full gate run on her tree, by the session that handed off to
her. Everything below is measured, not inferred from her commit message.

## THE RESULT

**The browser gate went from 28 red to 1.** Node 0. That is the headline.

```
node: 0   browser: 1 failing of 165
```

## WHAT SHE BUILT

Her commit subject names four things and all four are real:

- **rate macros** — `rotRate`, `rotDriving`, `ROT_LIMIT` in rack.js. This is #79's
  rotation/deflection-as-a-rate, the half that was still owed.
- **Kepler knobs** — `kepShell`, `rkk`. The other half of #79.
- **project guards** — `projectClean`, `projectDirty`, `pjWrite`. This is #85's
  unsaved-changes model, which needed a project-level dirty concept and now has one.
- **frame export** — she wired `lab/render-exact.js` into CAPTURE. That module had
  been finished, 39 green gates, and imported by nothing since wave 59: 92 KB every
  visitor downloaded and no code path could reach. **She then EMPTIED the wiring
  allowlist** rather than adding to it. The gate got stricter, not looser.

## HOW SHE TREATED THE GATE, WHICH IS THE PART WORTH READING

The diff looks alarming at a glance — 553 lines changed in `boot.browser-test.mjs`,
overwhelmingly deletions, and the assertion count fell (`&&` 3974 to 3855, `===` 2473
to 2371). That is the exact shape of a model deleting laws until the gate goes green.

**It is not what happened.** 166 judge blocks before, 166 after, not one block id added
or removed. The deletions are concentrated in B129, and what she did there is the right
move: she replaced roughly forty hard-coded geometry numbers with **relational
invariants read from the app's own constants** — `GEOM.CARD_FULL.w` from the artifact,
`--m2-device-h` from the CSS, `knobsEqual` and `sharedRadius` instead of `'56,56'` and
`'16px'`. That is ANTI-PATTERN 6 turned on the gate itself, and it is why the count
fell. A law that reads the number from the app cannot go stale the next time a wave
moves it — which is precisely the failure that produced this backlog.

## THE ONE RED, AND IT IS NOT WHAT IT LOOKS LIKE

**B139** fails on a single computed field, `recipe: false`. The obvious readings are
both wrong, and each was tested:

1. *Not* a stale law — she had already rewritten the law text to describe the current
   behaviour (the header keeps its own 1.03 lift even with FROST off).
2. *Not* the custom-property trap. The arm compares a computed `backdrop-filter`
   against `getPropertyValue('--frost-filter')`, and a custom property read that way
   is widely expected to come back **unsubstituted**. It does not here: measured in a
   real browser, the raw read and a resolving probe both return `blur(22px)`.
3. **Driven under the block's own exact conditions — disconnected, paused, FROST
   always — the arm PASSES.** `body "blur(22px)"`, token `"blur(22px)"`, `equal: true`.

So B139 is **order-dependent contamination**: it passes alone and fails in sequence,
which means an earlier block leaves state it does not restore. Look for a block that
moves GLASS BLUR, CARD STYLE, the theme, or leaves `frost-hold` set after a play, and
does not hand it back. Do not patch B139's assertion — it is correct. Find the block
upstream that is dirtying the room.

> This is the same class of bug as the `__LW.frost` getter added earlier in wave 106:
> a block that borrows a global policy for one measurement and cannot hand it back.

## WHAT WAS MARKED DONE THAT IS NOT DONE

Ten tasks flipped to completed during her run. Four are backed by the commit (#57, #79,
#85, and the keymap). **Six are not, and have been reset to pending with the evidence
recorded**: #36 (LaTeX/serif/animations — the commit touches no font or animation code),
#61 and #74 (the keyboard — six lines of keymap.js), #73 (the BASINS defects — zero
mentions of BASINS in her modwindow additions), #76 (dynamic maths — no tween, count-up
or odometer code exists anywhere in lab/), #78 (the plugin's glass and settings tree,
which is anyway entangled with the CARD STYLE ruling Josh still owes).

That is the one thing to watch in the next wave. The building was good and the gate
work was better than good; the bookkeeping ran ahead of both.

## STILL OPEN

- B139's upstream contaminator (above).
- The **CARD STYLE ruling** Josh owes: FROST ships `always` since wave 89 and is a
  later rule of equal specificity, so REFRACTIVE and TINTED both compute to the frost
  veil and the SETTINGS switch changes nothing visible.
- The **keyboard manual has still never been opened in a browser**, and has no gate
  block.
- `law.h` 440 against the artifact's own `lawH` 466 — a genuinely broken invariant,
  recorded in `research/GATE-DIAGNOSIS-2026-09-07.md`.
- The merge to `main`, which is one red away.


## Continuation addendum — measured evidence supersedes the guesses above

B139 is a **probe serialization defect**, not upstream state contamination. The actual browser
measurement is `{token: "blur(22.0px)", computed: "blur(22px)"}`. `applySettings()` legitimately formats
the blur with `toFixed(1)`. A clean profile uses the lexical default `22px`, explaining why the isolated
probe passed. The fix resolves the token through a temporary element's computed `backdrop-filter` before
comparing; no material setting or app behavior changed and the policy assertions remain intact.

The six reopened tasks were delivered in **earlier waves**, which the wave-107 diff cannot establish or
refute. `lab/skin.css` installs the Roboto/title subsets and STIX; `lab/lab.css` declares the math face;
`kit.js` owns accessible sliders, segments and `formula()`. The latter explicitly rejects decorative
tweens and renders true analytical values in live slots. `spectrum.js` and `rack.js` use it. The completed
full gate passed B123–B124, B140–B144 and B146–B149, measuring these implementations. Absence of an odometer
is the recorded motion decision, not absent dynamic mathematics. Host picker/CLEAR fixes are in
`modhost.css` entries 16/17/21; the word BASINS need not appear in this wave's behavior diff to prove them.

CARD STYLE was fixed in wave 107: the FROST pane override is scoped to REFRACTIVE, while both styles keep
the shared filter. The measured eight-way theme/frost/pane matrix passed B135. No further ruling is
needed to make this existing control effective. Josh's explicit new ruling keeps the resting hint hidden.

The keyboard manual **was opened**: the initial screenshot exposed invalid HSL and an empty action list;
after repair, `.tmp/keymap-final.png` and `.tmp/new-features.log` record all 43 rows, matching the live
table, with an opaque-enough resolved pane and zero page errors. Its Escape/focus lifecycle was checked.
This was a focused integration check, not a claim of exhaustive visual approval; Josh remains verifier.

The geometry API now reports its **effective host** height, using the same CARD_TRIM and FLOAT_ROOM as
placement. The frozen artifact retains its original 466 law; the deliberate host adjustment gives 440.
B129 and B131 passed in the completed full run. The original frozen bytes remain protected by mir.test.
The older diagnosis's warning about mismatched 440/466 numbers was addressed at that API seam.

The task board completion entries now cite these source locations and measured blocks. Task #37 stays
pending at GitHub authentication and Cloudflare deployment. No production outcome is inferred.
