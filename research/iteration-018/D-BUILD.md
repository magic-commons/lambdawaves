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

## D2 CURVES USER PRESETS (kit 1.5.0-alpha.30)
- Files: kit `lab/mir/panels/curves.js` (trickle-down: `version.js`, `docs/FOR-MIR.md` top line, `MIR-MANIFEST.json`, the pin in
  `tests/mir-manifest.test.mjs`), `lab/settings-store.js` (FAMILIES `lambdawaves.q0.curvePresets` PREFERENCE), `lab/lab.css` (`.curves-foot` joins
  the `.sp-presave` / `.sp-prename` rules; the foot grid gets a 26 px column). The app wiring went into rack.js and moved with the panel to `lab/nodes.js` in D3.
- The kit's PRESET stepper could not take rows without an edit. Now `createCurvesPanel/View({ presets: () => rows })` puts the app's rows
  (`{ id, label, points }`, headings `{ coming: true }`) ahead of the six. A row's curve lands on the channel shown, and the stepper names a curve
  that matches one. `setPresets()` re-reads the rows (SPECTRUM's `setItems` way).
- App: the bare save glyph right of PRESET asks a name in the stepper's seat (Enter keeps it, Escape cancels; default "My curve") and stores the
  channel's points. While one exists the list reads USER · theirs · PRESETS, and each USER row has a ×. Never in a project, a link or the ring.
- Probe (Firefox): saved "Warm lift" → stepper names it; LINEAR, then the USER row → its 3 points back; × → the list is the six again and the record
  is removed. Picture `D-shots/d2-curves-user.jpg`.

## D3 NODES (call 1 default: id `nodes`, the `curves` window retired behind an alias)
- New `lab/nodes.js` + `lab/nodes.css` (184 lines together). `createNodes({ device, rk, raise, host, canvas, curvesStore, occlusion, after })`
  is seated in rack.js where the CURVES card was (after RENDER, closed). It is a plain call that is handed no `app`: `rack-deps` HINGE HOLDS
  (spectrum 25). It also uses `lab/index.html` (stylesheet link), `lab/shell/settings.js`, `lab/shell/keys.js` and `tests/curves.browser-test.mjs`.
- The graph flows top → bottom, as a Houdini network does: STAGE IN → CURVES → STAGE OUT. Each node card has a title bar (drag to move) and in/out
  ports; the wires are one SVG layer. Drag the ground to pan. + lists the one type (CURVES, greyed while it is in the graph); × on CURVES' bar takes
  it out, and the screen is bypassed with the points kept. The node places, each view's pan, the window shape and in/out are kept in PREFERENCE
  `lambdawaves.q0.nodes`, which has a FAMILIES row (`lab/settings-store.js`).
- Two live views of one graph (the FOLDERS precedent): the MIR window `createWindow({ id: 'nodes', title: 'NODES', chrome: 'close' })` on
  `#floats` and the rack card `nodes` (`rk.register`, glyph curves). Each has a door in the ground's corner: DOCK IN THE RACK ↔ OPEN AS A WINDOW.
  CURVES in each view is `createCurvesView` over the one model that `createCurvesPanel` made (`project: false`, store `lambdawaves.q0.curves` as
  before). The A7 CHANNEL/PRESET heading removal and the D2 save glyph are applied per view. The faint grid follows `.mir-curves` (A8).
- Occlusion: `occlusion.register('nodes', …)` plus a watch on the window's hidden/style/class, as `mir-gui.js` does. Probe: the open window's centre
  is in the frame mask.
- Alias: ONE line, `lab/shell/settings.js` `RETIRED_WINDOWS` gains `curves: 'nodes'`. It is read by `layout.applyLayout` and the kit's `readLayout`
  (`retired`). WINDOW/finder rows say NODES. Key action id `curves` stays (a saved key), now labelled NODES and raising `nodes`.
- Pictures: `D-shots/d3-nodes-floating.jpg`, `D-shots/d3-nodes-docked.jpg`.

## Tests (gate 8797 / gd 5797, one browser at a time)
- GREEN node: new-project.test, history.test (18), first-run (13), mir-manifest (alpha.30, 264 files), rack-deps.test, keyboard-shortcuts, pwa (after
  `--write`). `node tools/new-project.mjs --check` is in step (16098 B). `node tools/rack-deps.mjs --classes --no-write`: HINGE HOLDS.
- GREEN browser: new-project (8/8), history (0 red), timeline (14/14), curves (re-aimed to NODES; it adds one line: a layout naming `curves` opens
  `nodes`), frame-occlusion.
- LOCK: none moved (the stage paint is untouched: the grade is a CSS filter on the screen, as before).

## CLAUDE.md sentences (the integrator edits)
- ADD: "CURVES lives in NODES (018 D3, `lab/nodes.js`). The window `nodes` (kit createWindow, chrome 'close') and the rack card `nodes` are two live
  views of one graph, STAGE IN → CURVES → STAGE OUT. The grade stays PREFERENCE `lambdawaves.q0.curves`; the graph is PREFERENCE
  `lambdawaves.q0.nodes`; the reader's curves are `lambdawaves.q0.curvePresets` (the save glyph right of PRESET, USER rows with ×, kit
  `presets` rows). The window `curves` is retired: a saved layout's `curves` seat opens `nodes` (settings.js RETIRED_WINDOWS). Run
  `tests/curves.browser-test.mjs`."
- New-project paragraph, after "…byte-exact": "NEW's modulation is one LFO bound to MACRO 1 (`m1.sourceId = s1`, the LFO's OUT chip 1) and one AUDIO
  device (MACRO 2 on its LEVEL), with no routes, no clips and RATE 4. A pick (Picker, library, volume, a HISTORY row, the 140 table) never touches
  the modulation, the timeline or the macros (checked in Firefox, 018 D1)."

## Open questions for Josh
1. NEW binds MACRO 2 (named AUDIO) to the AUDIO device's LEVEL (0.3.1's choice). You asked for "an audio device". Keep the binding, or leave MACRO 2 free?
2. A hand-drawn curve that matches no preset reads LINEAR in the stepper (the kit's way). Should it read "—" or CUSTOM?
3. NODES v0 has one stage filter, so CURVES is a singleton: + only puts it back. What are the next node types (GRADE, LEVELS, a second CURVES in series)?
4. FORGET (MIR OPTIONS) clears the grade but not the graph record or your saved curves (PALETTE's are kept too). OK?
