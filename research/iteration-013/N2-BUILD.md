# N2 THE STILL WORDS — build (iteration 013, picker chain)

Josh: "The Name/Stage Formula still seems to interact with mouse positioning even when the settings are off in informational. When 'cursor' settings are off, the text should stay fixed and not sway."

## Who moved them
Not the app's CSS and not `follow`: the kit's layer (`lab/mir/info/layer.js` `env()`) hands the pointer to the bodies' physics unless the
layer is frozen, and `mir/info/bodies.js` "parts them like water" — a push up to 5200 px/s² within 260 px of a body — whatever `follow`
and `parallax` say. Measured (probe below, H₂O, PARALLAX and DRIFT off): a pointer sweeping 60 px under the formula moved it 14 px left and
24 px up, springing back after.

## What changed
- `lab/shell/stage-words.js`: with PARALLAX and DRIFT off, the layer is held by its own `freeze()` while the pointer is within 280 px of the
  block (the kit's reach + 20), and let go as the pointer leaves (or leaves the window / the window blurs); a rest that moved meanwhile
  (a rack sliding, the seat) is reached on the let-go. Either switch on → never held (PARALLAX and DRIFT behave as before). A changed
  formula is a new block, which the kit places at rest even while frozen.
- `docs/FOR-MIR.md` — new "## From iteration 013": the kit should drop the pointer push when asked (`push: false` / `setPush`), so the
  app's hold can go.
- `lab/sw.js` by `pwa --write`.

## Proof — `research/iteration-013/n2-still-probe.mjs` (a real WebDriver pointer, the block's translate before · mid-sweep · after)
- before the fix: 764.61,107.6 → 750.68,83.92 → 764.19,107.45 — moved.
- after, switches off: 764.61,107.6 three times — `still: true`.
- after, PARALLAX on (`--on`, the control): 764.61,107.6 → 747.23,94.05 → 753.4,121.57 — still sways.

## Tests
`./test.sh node` green · `tests/stage-text.browser-test.mjs` GREEN · `tests/molecule-head.browser-test.mjs` GREEN.

## CLAUDE.md sentence for Sos
Since iteration 013 N2, with CURSOR's PARALLAX and DRIFT off the stage words are held still (the kit layer's `freeze` while the pointer is within 280 px of the block — the kit pushes bodies from the pointer regardless of `follow`; FOR-MIR asks for the switch).

## Open questions for Josh
- While held, the kit's "dim the words while the pointer is over the molecule" rule is suspended near the formula (the hold shows the
  block at full opacity); the kit-side switch would remove that.
