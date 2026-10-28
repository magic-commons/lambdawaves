# 021 chain G — THE GRAPH (Opus builder, branch `it021-G`, BASE `7471173`; no kit edit, lab/mir and lab/fonts untouched)

## Rows
- **G1 `0657274` TIER** — `lab/tier.js` (4 lines: `TIER`, `TIER_NAME`); rack.js imports both and re-exports `TIER` (the facade keeps its shape); the 16
  importers read `../tier.js`. `mir-gui.js` also imported `BUILD_LINE` from rack.js (a third cycle the review did not list): its seat now hands it in,
  `createMirGui(app, BUILD_LINE)`. `facade.js` and `notebook.js` keep `import { BUILD_LINE } from '../rack.js'` (the cut script reads rack.js).
  Cycles, the same command before and after (dependency-cruiser 18.7, cached; the counter is `.tmp/g/cycles.cjs`, 9 lines, counts `circular` edges
  whose source is not under lab/mir):
  `npx --no-install dependency-cruiser --no-config --include-only '^lab' --output-type json lab | node cycles.cjs`
  **before 83 circular edges, 46 app-side → after 41, 4 app-side** = 2 cycles, both `BUILD_LINE` (rack ↔ facade, rack ↔ notebook). The kit's own 37 are kit-internal.
- **G2 `b3b552e` THE HINGE** — `lab/windows/gas.js` (37 lines, `createGas(app)`): the BOX rows (WELL a · GAS σ · |k| · BASIS · LAUNCH · BOUNCE · the GAS
  readout and its two notes) moved verbatim, built into SPECTRUM's own `.sp-ham-b` row and the notes placed after `.sp-ham-n` (a fragment), so the DOM is
  where it was. switchHamiltonian's gas-off line became an `onHamiltonian` listener in gas.js (every `setHamiltonian` in the app is paired with
  `switchHamiltonian`, so the moment is the same). `lab/windows/equalizer.js` (69 lines, `createEqualizerCard(app)`, returns `syncEq`): the EQUALIZER
  device, grid, faders, AUDIO IN, CHORD and `eqNoNodes`; `keepT` exported from spectrum.js for it. Both seated right after SPECTRUM (`// GAS —`,
  `// EQUALIZER —`); `tools/rack-deps.mjs` PLANNED + PLANNED_CUT gain the two rows; `tests/rack-deps.test.mjs`' row count re-aimed 24 → 26.
  **`rack-deps --classes`: spectrum 25 → 17** (gas 7, equalizer 3; the largest is now persist at 24). Spectrum keeps `w.enterBox` (the SYSTEM
  stepper's verb on a press, which no listener can tell from a restore). DOM probe (every window's markup, ids stripped, and the rack order): identical.
- **G3 `8ad05fa` OUT OF BOOT** — `lab/windows/folders.js` (14 lines, `createFolders(app)`, seat `// FOLDERS —` before `go`; row count → 27). The DIGESTS
  literal is gone: spectrum.js returns `spectrumDigest`, readouts' three seats return `vortex/shadow`, `meters/calculus`, `atoms/wigner/radiation`
  Digest, and rack.js collects them in the table's old key order. `mathworker.js`: the 28 branches are the `OPS` table (`run(m) → { out, transfer }`)
  with `chem` / `basis` / `speculative` flags; the CHEM, CHEM_BASIS and SPECULATIVE sets are gone; `Object.hasOwn` lookup; an unknown op still answers
  `unknown op …` (worker-refusal green).
- **G4 `b930ecc` THE DOUBLES** — skeleton.js' fallback loop = `elements.bondsOf(atoms)` mapped to `{ i, j, order: 1, arom: false, ionic: false }` (the same
  `Math.hypot < 1.3·(rᵢ+rⱼ)` test, bit for bit); field.js:1605's comment now names elements.js' rule (field.js:1624 untouched). `capture.uniqueName` →
  `uniqueFileName` (capture, export3d, render-exact, two tests); `volumes.statusOf` → `installStatus` (volumes, chemview, picker). Left as they are:
  `cholesky` — linalg.js is column-oriented (Crout) with `** 2`, sturmian.js row-oriented with products: different rounding, and sturmian feeds THE LOCK;
  `tableFor` — three different tables behind one operator seam (Cornell, separable Hermite/Laguerre, hydrogen radial), not one function twice.
- **G5 `a68af9d` AUDIO** — the review's "held is dead" is not so: filmHold calls `chord.suspend()/resume()`. CHORD now keeps a set of holds:
  rack.js' ONE AUTHORITY calls `suspend('page')` / `resume('page')` beside the capture's `setHidden`, filmHold says `'film'`; its own
  `visibilitychange` listener and `!document.hidden` are gone. statesview.js' SONG decode closes its context in `finally` (a realtime context is kept:
  an OfflineAudioContext decodes at its own rate and would change the song's samples and hash). Mono stays (call 4). MIC refresh: kit code (below).
- **G6 `2e6588f` CSS OWNER SHEETS** — `lab/csb.css` (167 lines: lab.css' CONTROL SURFACE block 318–455 + the skin rules below) and `lab/keymap.css`
  (114 lines: 827–937, the KEYBOARD window) loaded right after lab.css, unlayered (lab.css 1195 → 948). Not moved, on purpose: lab.css 456–484 (the
  generic `.dock-btn, .mod-exp`, `.tbtn` chips and `.dev-stat`) — after lab.css they would beat its later `.mod-exp` rules (782–787) on hover/live;
  938–1000 (MOLECULES' pickers, the pager, A ↔ B: not the keyboard). An order check over every moved rule against every later rule (equal specificity,
  shared property) found no pair that can meet on one element.
  skin.css 333–363 + 425–507 (97 transport rules): each was lifted out of the live sheet in turn and the bar diffed on six states at 1600 and 840 px
  (`.tmp/g/xport-scan.mjs`). **80 deleted** (no box or paint moved: the tile copies equal the kit's, the dead `.native-play-row`/docked grid, the
  overridden widths, the media rules but one); **1 token**: `#transport { --xport-micro: 7px }`, `#transport.docked { --xport-micro: 8px }` (was the
  `.tempo-unit`/`.tempo-hz` font rules); **17 kept verbatim in csb.css**, listed: `#transport .native-tempo` (MACROS | CLOCK grid), `.tempo-grid`
  (4 columns; the kit's 5), `#transport.mini.tempo-open`, `#transport .tempo-expand` + its `:hover` (the pill re-asserted over lab.css' `.tbtn`),
  the second `#transport .native-tempo` (top edge + bottom corners over the kit's bottom-seat flip), `#transport.mini .tbtn.modb.on`, the docked
  `.tbtn:not(…)` + `:hover`, `.tbtn.play` + `:is(.on,:hover)`, `.tbtn.modb.on`, `.tempo-expand`, `#transport .native-tempo .trig`,
  `#transport .k-val` + its hover, and `@media (max-width:860px) #transport.mini` (the narrow seat). skin.css 1025 → 914.
  **Proof** (`.tmp/g/bar-proof.mjs`, Firefox headless 1600×1000, G5 tree vs G6 tree): STAGE, STAGE+EXPANDED, FREE, FREE+EXPANDED, RACK, RACK+EXPANDED
  and the KEYBOARD window — **2 486 boxes, 0 differing; bar pixels 0 differing in all six crops** (963 820 px), the keyboard frame identical.
  87 computed longhands differ, all inert: grid placement on flex items (docked), a `min-width`/`padding` under a fixed width, `position: relative`
  on a panel with no positioned child, `flex-shrink` on a full-width item. Pictures: `research/iteration-021/G-shots/{before,after}-*.jpg`.

## Tests (ports LW 9677 / GD 5677, one browser at a time)
`./test.sh node` EXIT 0 after every row; `node tests/pwa.test.mjs --write` after every lab edit; `node tools/rack-deps.mjs --classes --no-write` HOLDS
at every row; `node tests/mir-manifest.test.mjs` PASS (1.5.5, 264 files); THE LOCK `--check --query gastab=0` **843 · 0 · 0** and the s4a fixture
**987 · 0 · 0** after G1, G2, G3, G4 and G6. Browser: keyboard-window, molecule-demos, window-switching, hide-reveal, history, latex-copy (G2);
latex-copy, new-project, take-in-bugs, worker-refusal, chem (G3); picker-looks, field-molecule, molecular-names (G4); current, timeline,
keyboard-window, molecule-demos (G5); keyboard-window, hide-reveal, window-switching, routed-knob, frame-occlusion (G6) — all GREEN.
LOCK leaves moved: none.

## CLAUDE.md sentences to add
- NO MODULE IMPORTS FROM rack.js: `TIER` is `lab/tier.js`; `BUILD_LINE` stays in rack.js and only `shell/facade.js` and `shell/notebook.js` import it
  (`mir-gui.js` is handed it); dependency-cruiser's app cycle count is 4 edges (those two) and is the number to keep.
- THE WINDOWS gain `lab/windows/gas.js` `createGas(app)` (the BOX rows, seated after SPECTRUM), `lab/windows/equalizer.js` `createEqualizerCard(app)`
  (EQUALIZER · AUDIO IN · CHORD, returns `syncEq`) and `lab/windows/folders.js` `createFolders(app)`; a window's ⧉ digest is returned by its install
  and collected by rack.js (no DIGESTS literal); the maths worker's ops are the `OPS` table in `lab/mathworker.js` with `chem`/`basis`/`speculative`.
- THE OWNER SHEETS: `lab/csb.css` (THE CONTROL SURFACE) and `lab/keymap.css` (THE KEYBOARD WINDOW) load right after lab.css, unlayered; λWAVES' values
  over the kit's transport are `--xport-*` tokens on `#transport` there, and skin.css holds no copy of a kit transport rule. (Replaces "The keyboard
  editor is app-owned (`lab/keymap.js`, `lab/lab.css`)" → `lab/keymap.css`.)
- THE CHORD answers the ONE AUTHORITY (`suspend('page')`/`resume('page')`; filmHold `'film'`); it owns no visibility listener.

## FOR 1.5.6 (kit doors, not built here)
- MIC chooser: `modulation/window.js:2068` fills the AUDIO sheet's input list once, inside `if (!sh.wired)`; a door `port.audio.devices()` re-asked on
  every open (or a `devicechange` listener in `audio-capture.js`) — the lab cannot reach it without a kit edit.
- The timeline's KEEP audio context (`timeline/audio-playback.js:24`) is created at the first sounding clip, outside a gesture: create it on the drop or
  the first play press (Safari may leave it suspended). Unchanged here.
- Tokens the kit lacks for λWAVES' remaining 17 rules: the panel's columns (`--xport-panel-cols`), the clock grid's count (`--xport-clock-cols`), the
  open panel's edge on a bottom seat, the MOD power's lit ink, the docked seats' flat face — each would let a kept rule become a token.

## Open questions for Josh
1. `BUILD_LINE` in rack.js keeps two cycles; a `lab/build-line.js` (and `tools/perf/main-thread.mjs`' regex pointed at it) would make it 0. Move it?
2. The `w.enterBox` crossing stays in spectrum.js (the stepper's BOX press launches; a restore must not) — fine at 17/25?
