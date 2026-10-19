# G · GRAIN AND DUST (iteration 008, branch `it008-grain`, gate server 9641 / GD 5641; from W's merge)

Josh (JOSH-PROMPT.md): "'Grain' (Dust and Grain sucks and needs to be reworked heavily so that knee and grain does a better job.)"

Read first: `lab/windows/material.js` (DRAW: the styles — GRAIN "Render a sparse particle field", DUST "World-locked fine particles; GRAIN
controls their count", BANDS "amplitude level bands; GRAIN sets their count"; the knobs ISO · GRAIN · KNEE under EXPOSURE · SOFT · HUE,
:40–:63; the note "KNEE limits opacity growth. ISO sets the solid or shell threshold; GRAIN controls particle density or band count"),
`lab/field.js` (the volume shader: the tone formulas exposure · gamma · stage · knee, the draw styles, the ray-march jitter seed and the
DITHER amplitude — p0.w / v[27]), `tools/flash-calibrate.mjs` and `tests/flash-routes.test.mjs` (FLASH_STEP is derived from the tone
formulas and held to them — if KNEE's formula changes, rerun the calibration and say the new steps), `tests/helpers/field-law.mjs` and
`tests/official-defaults-palette.browser-test.mjs`, CLAUDE.md's THE LOCK paragraph, `W-BUILD.md`.

## Build
1. **First the measure, in the build note:** what GRAIN, DUST and BANDS draw today, one screenshot each at the shipped defaults on
   hydrogen 2p and on benzene's HOMO, and what is wrong (Josh: "sucks" — name it: aliasing, the pattern locked to the screen, the count
   knob doing two jobs, KNEE's effect invisible at the default …).
2. **Then one honest particle style.** GRAIN and DUST become ONE style (the name DUST, world-locked) sampled by a blue-noise or Halton
   set weighted by ρ (or |ψ| under the signed views), the point size from the voxel's screen size so it never aliases, the pattern stable
   under a camera move and animated only by the clock; the GRAIN knob is the DENSITY of the sampling and nothing else; BANDS stays if it
   earns its place (say why) or goes; a saved `grain` style opens as DUST.
3. **KNEE does what it claims.** The opacity knee is a visible shoulder on the accumulated opacity (the compositing along the ray), its
   range placed so the default sits where the eye sees a difference; measured: the picture at knee 0.1 · 0.6 · 4 on the two subjects.
   If the formula moves, `tools/flash-calibrate.mjs` reruns and `tests/flash-routes.test.mjs` holds to the new steps; the four guarded
   routes stay four.
4. **THE LOCK ×2** on your gate server (`--query gastab=0` for the 1004 fixture): the ISO and CLOUD styles' digests must not move by one bit;
   a particle-style row in the fixture moves by design — re-capture with `--write` and say which rows.

## Light check
Before / after screenshots at the defaults and at the knee extremes; a camera turn with DUST on (no swimming); the film's `frame(i, ctx)`
seeded reproducibly (seed 13). `./test.sh node`, THE LOCK ×2, `field-law`, `official-defaults-palette`, `render-regressions`, flash-routes.
Report: worktree · branch · commits · tests · blockers · next.
