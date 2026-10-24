# S2 THE FILL ICONS (iteration 015, chain S)

Josh: "Needs a better icon (also for molecules registry) for fill all orbitals because user's can't tell which clears all and fills all. And the
control mouseover hint should reflect that clearly."

## What changed
- `lab/paint-stroke.js` `fillButton` — the one two-state button of the three ladders (SPECTRUM, the register's ORBITAL, STATES) — draws two new
  20 px glyphs in the kit's hand (stroke 1.9, round caps, currentColor):
  - **FILL ALL**: the register's frame with three solid rungs and a filled disc at its foot;
  - **EMPTY**: the same frame with no rungs and a ∅ (a circle and its slash) in it.
  The old pair (solid vs dashed rungs) is gone.
- The hint leads with the word: `FILL ALL · <tail>` / `EMPTY · <tail>`; the aria label is the word. Each ladder hands its own tail:
  - SPECTRUM: "every label on, equal and in phase" / "every label off";
  - ORBITAL: "every orbital on, equal and in phase" / "every orbital off";
  - STATES: "S₀ and every state the ladder shows (up to 8 lanes) on, equal and in phase" / "every state off but S₀".
  The control hint (`#controlHelp`) reads the title, so the hover says the same words.

## Files
`lab/paint-stroke.js`, `lab/spectrum.js`, `lab/orbitalsview.js`, `lab/statesview.js` (the tails), `lab/sw.js` (pwa --write),
`tools/s-shots.mjs` (chain S's picture tool, scene `fill`).

## Tests
`./test.sh node` green (the one red was sw.js' hashes before `pwa --write`). `tests/register.browser-test.mjs` reads the aria word `FILL ALL`,
unchanged.

## Shot
`s-shots/S2-fill-icons.jpg` — SPECTRUM with 1s + 2p (EMPTY: the ∅), the same after the press (FILL ALL: rungs and the disc), the register's
ORBITAL pane on water (EMPTY).

## CLAUDE.md sentence (THE PAINT GESTURE paragraph, after "EMPTY ↔ FILL ALL (`fillButton`, one glyph, SPECTRUM's head too)")
Since iteration 015 S2 the two glyphs are a frame with three solid rungs and a filled disc (FILL ALL) and the empty frame with a ∅ (EMPTY), the
hint leading with the word (`FILL ALL · every label on, equal and in phase` / `EMPTY · every label off`, each ladder its own tail).

## Calls for Josh
None.
