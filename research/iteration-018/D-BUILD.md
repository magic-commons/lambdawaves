# CHAIN D — PROJECTS · CURVES PRESETS · NODES · BUILD (Opus builder, 2026-10-27; branch `it018-D`, base 701640b)

## D1 PROJECTS — verified in Firefox (gate 8797 / gd 5797), no code change needed
- Setup on a boot rack (LFO + ENV, no bindings): a route MACRO 1 → `material.stage`, a timeline clip (HUE), RATE 2.5.
- Then each pick, read from the model after it landed. Every pick kept the route, the clip and the macros (`m1>material.stage`, 1 clip):
  Picker MOLECULAR tile (Water, MOLECULES on): RATE 2.5. A volume row (`chem.openVolume('vol-1','LiH')`): RATE 2.5. A HISTORY row
  (`history.goto(cursor-1)`, the edit before the volume): RATE 2.5. A 140-table tile (Picker ATOMIC › HYDROGEN, 1s₀): RATE **4**, which is call 3
  (the state's own clock). So the law "a pick is not a project" already holds, before and after this chain.
- NEW, on all three roads (keyboard/verb `requestFresh`; FOLDERS `folders.fresh`; the opener's NEW, which is the Picker's FOLDERS page toolbar NEW
  → SAVE & NEW). Each landed the same model: sources `s1:lfo`, `s2:audio`; macros `m1 LFO ← s1`, `m2 AUDIO ← s2:level`; 0 routes; 0 clips; RATE 4.
  `lambdawaves.q0.info` (INFORMATIONAL) was byte-identical before and after.
- In MIR's model, "LFO routed to macro 1" is the macro's `sourceId` (a route is macro → target). On screen it is the LFO device's OUT chip **1**
  and the macro row "LFO · LFO s1". The AUDIO device shows LEVEL **2**. Picture: `D-shots/d1-new-modulation.jpg`.
- So `tools/new-project.mjs` already writes that binding through the model API (`setMacro(m1, { sourceId: lfo })`), and `--check` is in step
  (16098 B). `node tests/new-project.test.mjs` is GREEN.
