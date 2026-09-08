# WAVE 107 — the closing Astra did not get to write

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
