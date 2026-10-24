# W0 THE ESP STALL — measured, then fixed (chain W, 2026-10-23)

## The probe
`tools/perf/esp-probe.mjs` (NEW): a HEADED Chromium on the RTX (`--enable-features=Vulkan --use-angle=vulkan`; without them the headed
window fell to SwiftShader). It opens the lab, turns MOLECULES on, and reads benzene (catalogue) and palmitic acid (VOL. I, through the dev
link `lab/volumes`, read only). Each is read under STICKS and then ESP in the same minute, three readings of 3 s each:
- **rest**: paused, with a PRESENT every rAF.
- **drag**: a scripted left-drag of CDP mouse events over the canvas, then five wheel notches. It records the yaw turned and the zoom ratio.
- **play**: the clock playing with LIVE off.

Benzene under ESP has a fourth reading, **run**: KICK, then RUN, with the clock playing. This is a density that moves.
The JSON is in `w-shots/W0-before.json` and `W0-after.json`.

**The GPU was LOADED** for every reading: the three PySCF solvers held it at 100 % (P2). The fps figures swing ±30 % from run to run, so a
timing here is a reading, not a gate.

## Before (base 422f658; fps · presents/s · worst frame ms · density generations · φ solves)
| molecule | style | rest | drag (presents/s · yaw turned) | play | run (KICK + RUN) |
|---|---|---|---|---|---|
| benzene (36 AO, φ M = 80) | STICKS | 78 · 78 · 266 | 38.5 · −0.80 | 81 · 78 · gen 0 | — |
| benzene | ESP | 94 · 93 · 67 | 40 · −0.66 | 93 · 93 · gen 0 · φ 0 | 98 · 98 · gen 17 · **φ 3 runs / 3 s** |
| palmitic acid (122 AO, φ M = 128) | STICKS | 79 · 78 · 208 | 39 · −0.52 | 109 · 109 · gen 0 | — |
| palmitic acid | ESP | 117 · 117 · 17 | 40 · −0.65 | 100 · 98 · gen 0 · φ 0 | — |

Each φ solve took 50–120 ms of GPU on benzene (M = 80) and 320–370 ms on palmitic acid (M = 128). The drag turned the camera and the wheel
zoomed under ESP as under STICKS (palmitic acid's zoom of 1.0 is the DIST clamp, reached by the STICKS reading before it).

## What the numbers say
- **The surface is not the stall.** Under a drag ESP presents as fast as STICKS (37–40/s both ways, bounded by the pointer events). So
  `espPixel` stays at full resolution; the plan's "governor's resolution during a drag" row is not needed.
- **A still ground state does not move.** The playing clock leaves the density's `generation` at 0, so no φ re-solve fires.
- **A density that moves re-solves φ once a second with LIVE off.** The cases are RUN, a beating register (MIX) and a kick. The 1 Hz law
  (`now − phi.at < 1000`) fired 3 times in 3 s, and each solve is a 50–370 ms GPU hitch. A drag or a click that lands in one of those hitches
  is the "unclickable / hard to rotate" Josh felt.

## The fix (`lab/field.js`)
- φ's key no longer carries the density's `generation`. It is `espLand : atomsV : half : res`.
- `espLand` counts LANDINGS:
  - `setMolecule` (a molecule or a basis) arms `molFresh`, and the next matrix bumps the count.
  - `setMoleculeMatrix` with another kind bumps it (the VIEW: density · orbital · factor · signed).
  - `setCard` bumps it when a card arrives.
- LIVE off: φ is solved once per landing and never while the clock plays.
- LIVE on: a new generation re-solves at most once a second, which is the old 1 Hz law. It used to re-solve on every frame.
- Its hint now says so (material.js, `LIVE · SLOW`).
- No extra frame is requested. φ is encoded before the present in the same submit, so the landing frame already draws with φ ready.

## After (same probe)
benzene ESP run: gen 12, **φ 0 runs**. Landings still solve (benzene M = 80 in 120 ms, palmitic acid M = 128 in 322 ms, one solve each).
rest / drag / play are as before (within the GPU's swing).

## Tests
Run at the end of the chain (see W-report): `./test.sh node`, render-regressions, THE LOCK ×2.

## CLAUDE.md sentence
"THE ESP STALL (iteration 015 W0): φ's Poisson pass runs once per LANDING (`field.js` `espLand`: a molecule or basis, a VIEW, a card, the atoms, the
box, the grid) — never on the density's generation unless LIVE · SLOW is on, which re-solves at most once a second; `tools/perf/esp-probe.mjs`
measures it (headed Chromium, Vulkan)."

## For Josh
- If the stall is felt on a still molecule (no RUN, no register beat), the probe did not reproduce it on this rig. Name the molecule and the
  window size and the probe will take it.
