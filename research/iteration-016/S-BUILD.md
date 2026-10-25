# S · V · W8 · P1 P4 P6: built (iteration 016, the material.js / field.js group, 2026-10-25)

Pictures are in `s-shots/`. Each was taken in headless Firefox on the RTX through the gate kit (the `tools/clip-probe.mjs` road; the script stays in
`.tmp/s016/shots.mjs`). Benzene, MOLECULES on, ESP on its ISO surface.

## S1 ESP SOFT (`lab/field.js`, ESP branch only)
- **What it does.** Under ESP's ISO surface, WAVE's SOFT now reads.
  - `espSoft()` marches the ray as SOLID's one-sided band, not as a single hit.
  - The opacity per bohr (14 − 8e) ramps in over ln ρ ∈ [ln ISO − 2e, ln ISO + e] (a smoothstep) and stays full inside.
  - A grazing ray (the silhouette) gathers only part of the band, so the edge fades. The interior still hides the far side.
  - Each sample that adds colour paints φ at its own point, lit by the density gradient as the hard surface is.
  - The march stops at the sticks.
  - EXPOSURE's translucency (0.8·EXPOSURE) is applied as before.
- **SOFT = 0 is the hard surface.**
  - e = `espSoftOf(SOFT)` = (2.2 − γ)/1.9, clamped to 0 … 1. It is written into the new uniform `p11.x`.
  - The knob is `reverse`, so right is softer. Its LEFT END (γ 2.2) gives e = 0. At e = 0 the soft march is never entered, and the old hard path
    runs with its text unchanged.
- **Decision: the default IS soft.** The default γ 0.7 reads e ≈ 0.79. Josh's words were "the ESP surface is very hard".
  - So the shipped ESP picture changes at the default.
  - The hard picture is SOFT turned fully left.
  - THE LOCK never runs ESP (see below).
  - To keep the old default instead: make `espSoftOf` return 0 at γ ≥ 0.7.
- **Deviation from PLAN.md.** PLAN asked for SHELL's Gaussian shell. A hollow shell would show φ on the back face through the front, mixing two
  maps. I took SOLID's band instead, which follows Josh's ruling ("the softness of SIGNED and SOLID").
- **STYLE_READS.** SOFT gains ESP. It is greyed under SAS | SES, the same way ISO is.
- **Shots.**
  - `S1-esp-hard.jpg`: SOFT at its left end.
  - `S1-esp-soft-default.jpg`: γ 0.7.
  - `S1-esp-soft-max.jpg`: γ 0.3.

## S2 MAP ONLY (`material.js`, `field.js`, `native-ui.js` row 7)
- **The switch.** `ui.espBareSw` sits beside RADIUS: SIZE · RADIUS · MAP ONLY, then PROBE · RANGE wrap onto a second line.
- **The key.** `mat.espBare` is written only by a hand.
  - An absent key means off, so an older file and the edit bytes are unchanged.
  - The project carries it inside `presentation.mat`.
  - A restore of a file without the key deletes it (`ui.styleSync` list).
  - An older build ignores it.
- **The shader.** With `p11.y` set, `espPixel` skips `ballsOrSticks`, so the surface mixes over the stage background alone. EXPOSURE 0.6 fades
  the map into the stage with nothing under it.
- **Shots.** `S2-esp-sticks-exp06.jpg` (switch off) and `S2-esp-map-only-exp06.jpg` (switch on).
- **What it does not hide.** The stage words' atom letters (INFORMATIONAL › ATOM LABELS) and the frame lines are separate layers. MAP ONLY leaves
  them alone.

## V1 WAVE GREYS, NOT HIDES (`material.js` styleSync)
- **The rule.** `STYLE_READS` still decides which controls a style reads. `mute()` applies the kit's own muted look and never sets `hidden`:
  - a knob gets its `setDisabled`;
  - a switch or seg gets `.disabled` plus `disabled` on its buttons (skin.css `.k.disabled`, `.sw:disabled`, `.seg-b:disabled`, `--state-disabled`).
- **The rows stay.** The THREE VIEWS rows no longer hide, so no seat moves (measured: every control's offset in the card is identical under CLOUD,
  ESP and STICKS). The restore road (`ui.styleSync(pm)`) is the same function.
- **Shots.** `V1-wave-cloud.jpg` (ISO, GRAIN and the ESP rows greyed) and `V1-wave-esp.jpg`.

## W8 THE ACCENT B DOT (`lab/mod-port.js` `routeDots`, one lab.css block)
- **What marks a window.** A rack window holding a `[data-param]` control that some route targets wears `.lw-routed`. The test is a route in the
  model (paused or playing, MOD power on or off), not a modulated value.
- **When it is checked.**
  - Routes reach the model from many roads: the drop, the window, a restore, an undo, `LW.mod`.
  - So the check is a key, read every 400 ms while the page shows: route adds · removes · count, and the stamped controls' count.
  - The DOM is touched only when that key moves.
- **The dot.** A 6 px `--acc2` dot sits at the title bar's height, `calc(100% + 2px)` past the card's inner edge.
  - That is where the scroll pill's tail starts (PILL.gap 8, the tail's tip 4 px out).
  - It lies inside the rack's 10 px padding, so the rack's clip keeps it.
- **rack-scrollbar.js.** The file is a kit file (`lab/mir/shell/`). It was read for the geometry and **not edited**.
- **Shot.** `W8-dot.jpg`: a route on ISO under CLOUD, with ISO greyed and the dot on WAVE.

## P1 · P4 · P6 (`material.js`)
- **P1.** PALETTE's bottom row is now ADD · ROTATE · the stop's swatch and × · INVERT, through `addEl.after(…)`. The ids are unchanged. Shot:
  `P1-palette-rotate-invert.jpg`.
- **P4.** ESP RANGE runs 0.002 … 5 a.u. It is still log, with the default ±0.1. The bar's numbers come from R, so they follow.
- **P6.** A HAND's palette pick turns PALETTE ON through the switch's own road. That road also sets VIEW to arg ψ, as the PALETTE switch always has.
  - "A hand's pick" is a press, or an Arrow / Enter / Space / Home / End key, on the preset stepper or its open list. A capture listener flags the
    event, and the flag clears a task later.
  - A restore, a link, LW, the history's own ramp restore and a chord (Ctrl+Z) never turn it on.
- **A restore bug P6 exposed, fixed.**
  - `persist.js` restored `palette.on = true` through `setOn`. `setOn` forced VIEW to PHASE, so an undo across the P key with the palette on and
    VIEW Re came back as PHASE. This was latent: the palette had simply never been on in that history scene before.
  - Now `setOn(v, keepView)` takes a second argument. The restore passes `true` and re-sets the VIEW seg in both cases.
  - The demo (view arg ψ, palette on) opens as before.

## Gates
| gate | result |
|---|---|
| `bash test.sh node` | every suite green except two that are not this row's: `mir-manifest` (another builder's kit edit to `lab/mir/modulation/window.js`) and `pwa` (the precache hash, churned by the other builders' live edits; `pwa.test.mjs --write` then the pwa suite alone: green) |
| `node tools/rack-deps.mjs --classes` | G-G HOLDS (spectrum 25/25, unchanged) |
| THE LOCK `tools/perf/digest-lock.mjs --check --query gastab=0` | **843 compared · 0 · 0** (62 s) |
| … `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` | **987 compared · 0 · 0** (66 s) |
| `tests/official-defaults-palette.browser-test.mjs` | 3/3 PASS |
| `tests/routed-knob.browser-test.mjs` (extended: K4 V1 · K5 S2 · K6 W8) | 7/7 GREEN |
| `tests/history.browser-test.mjs` | 45 PASS (it was red on the P key until the restore fix above) |
| `tools/camera-routes.mjs`, `tools/flash-calibrate.mjs` | not run: no route, map or flash-guarded control changed (RANGE has no route; KNEE / EXPOSURE untouched) |

## The ESP probe (`tools/perf/esp-probe.mjs`: headed Chromium, Vulkan, RTX; `s-shots/S-esp-probe.json`)
ESP was read at the default SOFT, so this is the **soft** path. Each cell is fps · presents/s · worst frame in ms · φ solves.

| molecule | style | rest | drag (presents/s) | play | run (KICK + RUN) |
|---|---|---|---|---|---|
| benzene | STICKS | 120 · 120 · 8.5 | 39.9 | 113 · 114 · 142 | — |
| benzene | ESP | 120 · 120 · 8.5 · φ 0 | 40.0 | 120 · 120 · 8.5 · φ 0 | 117 · 117 · 75 · gen 30 · **φ 0** |
| palmitic acid | STICKS | 119 · 119 · 16.7 | 40.3 | 115 · 115 · 133 | — |
| palmitic acid | ESP | 120 · 120 · 8.5 · φ 0 | 40.0 | 117 · 118 · 8.5 · φ 0 | — |

- **Against 015 W0.** W0 read ESP at benzene rest 94, palmitic acid rest 117, drag 40, run with φ 0. Every ESP reading here is at the display's
  120 Hz ceiling.
- **Verdict.** No slower than W0. The probe cannot see below vsync on this machine.

## Not done, and why
- **The catalogue's ESP look pictures** (`img/menu/*.esp.webp`, and the volume's) were rendered on the hard surface. A re-render takes the soft
  default. That job belongs to the pictures (`menu-thumbs.mjs`, not this row's file).
- **SOFT under SAS | SES:** not read, and greyed there. The plan names only the ISO surface.
- **CLAUDE.md:** not edited (the integrator's). Suggested sentence:
  > "ESP SOFT AND BARE (iteration 016 S): under ESP's ISO surface SOFT is the edge — field.js `espSoft`, SOLID's one-sided band in ln ρ about ISO,
  > e = `espSoftOf(SOFT)` = (2.2 − γ)/1.9 (the knob's left end is the old hard surface, text unchanged; the default γ 0.7 is soft); MAP ONLY
  > (`mat.espBare`, a hand's key) draws no sticks, the stage alone beneath the map. WAVE GREYS, NOT HIDES (016 V1): `STYLE_READS` decides,
  > `styleSync` disables in the kit's muted look and no seat moves. THE ACCENT B DOT (016 W8): mod-port.js `routeDots` marks a rack window whose
  > `[data-param]` control a route targets (`.lw-routed`, lab.css), a 6 px `--acc2` dot past the card's inner edge where the scroll pill's tail
  > starts. PALETTE: ADD · ROTATE · swatch × · INVERT (P1); ESP RANGE 0.002 … 5 (P4); a hand's preset pick turns PALETTE ON (P6), and a restore
  > keeps its VIEW under PALETTE ON (`setOn(v, keepView)`)."
- **Kit files:** none changed.
