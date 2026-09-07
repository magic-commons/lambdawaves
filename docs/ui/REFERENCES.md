# REFERENCES — annotated by MECHANISM
*The discipline (from Meng To's method): a reference is mined for how it WORKS, never for how it LOOKS. Every
entry names what to steal and what not to. A reference to Ableton must never produce "Ableton with a wavefunction
in the background."*

**Referenced ≠ vendored.** Three MANDELBROT files are literally in this tree, under `lab/mir/`: `mod.js`,
`curve.js` and `glyph.js`. They are taken by sha256, carry a provenance header, and are **maintained by diff
against their source, never rewritten** — read `lab/mir/PORT-NOTES.md` before touching one. (`registry.js` and
`host.js` beside them are **ours**; do not route around a defect in one of those because it "looks vendored" —
ANTI-PATTERNS 13.) Everything else below is a reference: mined, then built here.

**THE VENDORED LAW IS NOT "NEVER EDIT" — IT IS "MARKED, LISTED, AND REVERSIBLE BY A TEST", and wave 61 is the
worked example.** CENTRE (*"clicking can choose 'center of dial' or 'highest dial'"*) was a mode the model could
not express — `influence = lerped − r.min` makes the offset always zero when the macro reads zero, and all three
workarounds fail honestly, the last of them by destroying the user's base. So `mod.js` was edited, and this is
the whole pattern:
- **Four touches, in marked hunks, each one line of behaviour** — a `bi` field on the route record, a midpoint
  anchor in `routeInfluence`, `setRouteRange`, and **both ends of the serializer**. That last pair is the one
  people forget: *a flag that does not survive a preset does not change a control, it changes the sound of every
  patch ever saved with it* — silently, and only on the second open.
- **Every hunk carries `λWAVES: forced edit n/N` on the line above it** and a row in PORT-NOTES' table with its
  reason. Those four touches are five of `mod.js`'s six marked hunks; the sixth is older (`PRESET_LS`, the
  storage namespace, which is an exported `const` and the one thing in the file the host cannot inject). The
  count is in the file, in the table, and in the `diff -u` line the notes tell you to run: two hunks became
  **seven** (the provenance header plus six), *measured*, and an upstream fix is still a patch.
- **The gate is what makes it a law.** `mir.test.mjs §16` undoes all six by their **exact text** and re-proves
  byte-identity to the source — a far stronger claim than counting lines or hunks, and it is why the next
  upstream merge will not be archaeology.
- **What was refused, and why that matters as much:** per-route BYPASS would have been a fifth touch bought for
  a convenience, where `bi` bought a mode Josh named. Spend a forced edit on a capability, never on a nicety.

## BASINS' modulation window (MANDELBROT, `app/anim.js` + `app/mod.js`)
STEAL: the four-edge architecture (registry, target host, clock, presentation callback) proved by MIR; the chip
vocabulary; routes as patching; the transport arithmetic; deterministic stepping.
DO NOT STEAL: their macro surface (Josh: buggy), their window kit, their palette, their bottom-left button, the
compact rail's mini curve (no window here publishes a one-line summary of itself, and inventing one per window is
a design decision, not a port).
TAKEN AS FILES: `mod.js` (the model) and `curve.js` (its breakpoint mathematics). **NOT taken:** `anim.js` (their
modulation window), `window.js` (their WindowKit) and `audio.js` — our rack is our window kit, and wave 52 wrote
our own face against the model.
WHAT REPLACED THE MACRO SURFACE (wave 52, so a later wave does not re-import the bug): the structural fault is
that a macro is two things at once, a hand knob and a socket for a source. So DRIVE is **one** control whose
choice decides what the value row *is* — a fader or a meter with nothing to grab; DEPTH is on its own line, never
a second knob beside the value; a re-bind unbinds first, because `setMacro` refuses a source change on a live
binding and a face that just calls it reads as a dead menu; and nothing is behind a modal.
WHAT WAS LEFT IN THE MODEL ON PURPOSE (waves 60–61, so a later wave does not "finish" the port): **AUDIO** — the
model half is complete and free, the capture half is `getUserMedia`, a device picker and a **second consent
story** in an app that already has a photosensitivity gate; **trigger macros and the pad rail** — a second macro
kind and a second meaning for every row, for a gesture nobody performs here, and ENV's FIRE is the same chain
without it; **TAP TEMPO** — the engine is lovely (nine 500-ms taps → exactly 120.000 BPM) and it is the one
musical control the loop-clock reframe cannot save; **their QUARTER chip** — a paint-cadence divisor, which we
already have as CADENCE 60/120 Hz; and **`ext` sync / `materialize` / `legacyOf`** — no external clock, no v2.
ALSO NOT SHIPPABLE AS FOUND: all three `FACTORY_PRESETS` route exclusively to `freq`, `phase`, `bright` and two
palette phases — **measured, every one loads 100 % dormant here**. The fix is host-side (filter `presetList()`
on `factory: 1` and write our own three against `observer.*` / `material.*`), never an edit to `mod.js`.

## The four routing surfaces (Serum · Massive · Bitwig · Logic for iPad) — mined for wave 61's macro router
STEAL, each for the one thing it does best: **Serum's drag** — a grip on the macro row, dropped onto the target,
on our own pointer pattern. **Massive's clipping** — the model clamps, the arc stops at the end, and a *"small
break at the limit of the modulation range"* says so; ours is that break inverted, a radial SPUR running outward
at the overflowing end. **Bitwig's routing mode** — a tap ARMS the grip, then a tap on the target lands it; this
is the only road that works when the macro and the knob are **never on screen together**, which on a phone is
always. **Logic for iPad's honesty** — the only touch-native reference of the four, and it dropped dragging
entirely. So both roads ship, at **every size**, separated by 4 px of slop: a gesture that exists on one
breakpoint is one nobody learns.
DO NOT STEAL: **Serum's drop depth** — it infers polarity from wherever the control happens to be standing and
then assigns a **full-scale** depth, which is why its own author tells people on his forum to park base controls
at 0 or 50 % first; we know `baseNorm` at the instant of the drop, so a drop fills exactly the room the knob has
left and nothing clips on the first frame. **Massive's permanent slots** — empty sockets on every knob for ever
would be a disaster on our glass; no route, no ring. **Serum's missing half** — it never tells you *on the
control* which route the outer arc is editing; our press-and-hold popover does, which is the point of having one.
And **nothing red**: `--bad` is spoken for and ACCENT B is a colour the user can move, so the geometry carries
the warning and only the clipped number takes `--warn`.

## Josh's glyph library (MANDELBROT, `app/glyph.js` → `lab/mir/glyph.js`)
STEAL: nothing — it is vendored whole, 453 lines, not one path, viewBox, stroke weight or name touched.
DO NOT STEAL: its 20-px default sizing. Sizing is the caller's by the module's own design, so `lab.css §55b`
owns it and no call site passes a pixel count. `north` is the one solid mark among hairline outlines and its box
is two pixels smaller *at source* so its optical mass matches — redrawing it is not ours to do.

## NEBULA's motion (MANDELBROT, `app/nebula2/`)
STEAL: the behaviours its own gates name — a clutch that clears the fling history, one coalesced strongest
request when ambient and user motion coexist, every wheel modifier zooming and adding no rotation, camera
ownership that survives device on/off and reset; and the FREE camera's mechanism — one unit quaternion with the
drag rotor multiplied on the RIGHT, so the axes are the screen's at every pose and there is no clamp to hit.
DO NOT STEAL: the four-boolean state machine (replaced by our friction law, wave 50), the point-bank seed, and
**any quaternion formula copied verbatim**. Theirs assume a Y-up world whose home camera is the identity; ours is
z-up, so at yaw = pitch = 0 our basis is the cyclic permutation x → y → z → x and the conversion carries an extra
q₀ = ½(1 + i + j + k) and a sign a transplanted formula has no reason to have. It was derived and judged against
`cameraBasis` over 400 poses (wave 54). Copying would have looked almost right.

## The MANDELBROT photosensitivity pane
STEAL: the structure — full-glass pane over the running app, image-filled caution triangle with the mark cut out,
a title, a short body, an outlined CONTINUE, remembered once accepted, reachable again from SETTINGS.
DO NOT STEAL: its black page and its type. Ours is theme-aware and wears our tokens. (Shipped, wave 48; the mark
became a real SVG luminance cutout in wave 53, so nothing in the sign reads the pane's background or the theme.)
ALSO STOLEN, AND NOW THE HOUSE SHAPE: its **three-input bypass** — `navigator.webdriver` refuses, a query
forces, a query declines. Anything a gate must be able to force *or* refuse wears it: `?sw=0/1` for the service
worker (wave 56), `?warn=0/1` (wave 48) and `?motion=reduce/full` (wave 57). A behaviour reachable only through
a browser profile is a behaviour no block can prove.
**BUT WAVE 59 SPLIT THE SHAPE, AND THE SPLIT IS THE RULE NOW: how loud the thing is decides whether its query
is public.** `?warn=0` was a **third door in the URL** — `needed()` answered false before `seen()` was ever
consulted, so `…/?play=1&warn=0#s=…` ran the field at full rate for a first-time visitor with the notice never
shown — and `?motion=full` overrode the visitor's **operating-system** `prefers-reduced-motion`, the strongest
thing a person can say about movement. Wave 56 made links the way this lab travels, which made both likelier
rather than rarer. So **both `?warn` arms and both `?motion` arms now require `navigator.webdriver`** (the force
arms too: *a rule with one arm reachable from a public URL is not one rule*), and the proofs drive them through
an explicit override that `location.search` cannot reach. `?sw=0/1` stays public, because a service worker is
not a photosensitivity notice. Before you wear this shape, ask what the query can do to a stranger.

## Brian Johnson's Electron Orbitals (Josh's usability reference for phones)
STEAL: what a one-hand, low-PPI orbital viewer makes reachable and what it refuses to show at that size.
DO NOT STEAL: its visual identity — we are an instrument, not an app-store viewer.

## DAWs / VSTs / colour-grading consoles (the ambient reference for the whole lab)
STEAL: stable module topology, recognisable device widths, direct manipulation, spatial memory, deliberate
density, signal motion kept distinct from chrome; and the plug-in window's own behaviour — a window comes off the
rack, drags by its header, and collapsing it does not put it back (wave 55).
DO NOT STEAL: skeuomorphic knob skins, brand palettes, or the assumption that everything must be a rack.

## How to add an entry
When Josh sends a screenshot or a video: write the entry FIRST (steal / do not steal / why), then build. The
screenshot itself belongs in `docs/ui/refs/` if it is worth keeping; the entry is what agents read. If a file is
taken rather than mined, it goes in `lab/mir/` with its sha256 and a line in PORT-NOTES.md — not into `lab/`.

## REFERENCE vs ARTIFACT — the distinction this file previously blurred (2026-09-06)
Everything above is about REFERENCES: things we looked at, mined for mechanism, and did not copy. "A reference to
Ableton must never result in Ableton with a fractal background" is right, and it stays.
**It does not apply to an ARTIFACT — a window we are MOVING between Josh's own apps.** The modulation window is
his, built over weeks in BASINS, and it is meant to travel to every app in the library unchanged: same layout,
same material, same dimensions, same chips. For an artifact the rule inverts — copy verbatim, namespace it, and
parameterise only the accents. See STYLE-LOCK's "THE PORTED-WINDOW EXCEPTION" for the acceptance test, which is
geometric rather than aesthetic precisely because prose could not hold this line through three attempts.
