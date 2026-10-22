# D2 THE HUE FLICKER (iteration 014, chain D)

**What.** Josh: "When the hue cycle passes through 359 to 360 or 1 to 0, it flickers a flash of different colors." The Picker's
`setHue` wrapped the number it wrote into `--mol-hue` (359 → 0), and the pictures' `filter: hue-rotate(var(--mol-hue))` glides
(`transition: filter 360ms`) — so a one-degree turn across the wrap glided 359° back round the wheel through every colour.

**Fix.** The saved hue stays 0…359 (`prefs.hue`, `lambdawaves.q0.picker`, unchanged); the CSS now sees an UNWRAPPED turn,
`hueShown`, moved each time to the nearest twin of the new hue (`hueShown += ((hue − hueShown) mod 360 + 540) mod 360 − 180`),
so 350 → 0 → 10 writes −10 → 0 → 10 or 350 → 360 → 370 — the glide is always the short way and keeps its ease. The ring's
`rotate`, MOLECULES' `.mol-thumb`, the Picker's `.mm-pic` and the CSB's suggestions all read the same variable, so all four turn
the short way. No CSS changed.

**Files.** `lab/picker.js` (`setHue`, 3 lines), `lab/sw.js` (pwa --write), `tools/hue-wrap-probe.mjs` (the probe).

**Proof** (`LW_PORT=9571 GD_PORT=5271 node tools/hue-wrap-probe.mjs`: hue 350, then +10 twice, the computed filter sampled
each frame of the glide):
- before (base 4e4686e): `[350, 350, 101.2, 36.2, 15.3, 10.1, 10 …]` — 101° from the wrap: FAIL (the flash).
- after: `[-10, -10, -6.9, -3.9, 5.8, 8.5, 9.7, 10 …]` — never more than 10° from the wrap: PASS.

**Tests.** `node tests/pwa.test.mjs --write`; the probe above.

**CLAUDE.md sentence.** THE HUE ring's saved hue is 0…359, but `--mol-hue` is an unwrapped turn (picker.js `hueShown`, the nearest
twin of the new hue to the last one shown), so the pictures' hue glide crosses 359 → 0 the short way (iteration 014 D2,
`tools/hue-wrap-probe.mjs`).

**Calls for Josh.** None.
