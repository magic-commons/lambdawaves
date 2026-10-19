# W · THE WAVE AND CLIP CARDS — build note (iteration 008, branch `it008-wave` from `24648c7`, gate server 9621 / GD 5621)

Josh: "delta p AND Re+Im in 'wave' window (Where is this different from the other viewpoints other than color?) … Remove dithering
row from wave and move it to quality in settings. Rename 'Volume' in the clip window to 'Full' or 'OFF/ON' with a light indicator."

## What was built

### 1 · WAVE's OBSERVABLE is DENSITY · PHASE · RE · IM
- `lab/field.js`: `VIEW = { density 0, phase 1, real 2, imag 3, diff 4 }`, `VIEW_NAMES` five long, new `WAVE_VIEWS` (the four) and
  `waveView(v)` — the ONE mapping every road in uses: an index or a name → the WAVE observable it opens as (`reim` / 5 → `phase`,
  `diff` / 4 → `density`). Re+Im's `mode == 5u` branch is **deleted** from `RENDER_WGSL` (two pictures in one volume; Josh's own
  question answered it). Index 5 stays retired, never reused; `specKey` now specialises views 0…4. **Δρ (mode 4) stays in the shader**
  as the brief says (the reference volume; MOLECULES' kick is row U's Δ switch — `lab/chemview.js` untouched).
- WAVE's seg has four buttons on one line (`skin.css` `.wave-row-1` four columns). The V key cycles the four (`keys.js`, `WAVE_VIEWS`).
- Saved views: `persist.js restore` maps `pm.view` through `waveView`; a non-history open that mapped says it once in STATE's status and
  the PROJECTS line (`app.state.restoreNotice`): `Re+Im left WAVE: opened as PHASE` / `Δρ left WAVE: opened as DENSITY` (joined with the
  0.5.0 retirements when both apply). A link (`statelink` decodes the u8 view, then restore) takes the same road. `LW.setView`, the `view`
  verb (`lw:view=reim|diff`), `?view=` and `loadPreset` all map through `waveView`; `LW.setView` now returns the view it set.
- The three shipped presets that opened on Δρ (`sim-churn`, `debug-clock`, `debug-bisect`) now say `view: 'density'` (state.js).
- Gone with the two views: the notebook menu's VIEW rows `Δρ difference` and `Re + Im superposed`, `badges.js`' Re+Im sentence,
  `capture.js` `PHASE_VIEWS`/`VIEW_NAMES` (Re+Im out), and CAMERA's **SET Δρ REF** trigger (it existed only to switch WAVE to Δρ; its
  fold now says "pan and hand"; LOCK sits in the camera verbs as before). `setReference()` itself stays (restore and SPECTRUM call it).
- `lab/status.js` / `tools/status-probe.mjs`: nothing to change — their per-VIEW lines are MOLECULES' views (density · orbital · diff …,
  row U's), and the probe drives hydrogen with phase / density only.

### 2 · DITHER → SETTINGS › QUALITY, and its scope
- It WAS a PROJECT key (`mat.dither`, in every project, link and undo row). It is now **PREFERENCE**: `'dither'` joined `FIELD_CHROME`
  (rack.js), so `serialize()` strips it and `restore()` ignores an older file's, exactly as frame / axis / invert. `saveSettings` always
  writes `dither` (the LSB amplitude, 0 = OFF) and `applySettings` reads a non-zero one. **Read once:** a profile whose blob has no
  `dither` key yet (older than this row) takes an older file's non-zero DITHER the first time one opens, then saves — after that no file
  moves it. `docs/STATE-SCOPES.md`: the row moved from `mat` LOOK to the field chrome, with that sentence.
- The seg and STRENGTH knob are built in `settings-card.js` `createFieldQuality()` on their own row (`.lw-dither`) under AUTO SCALE ·
  GOVERNOR · PERFORMANCE; `ui.showDither(k)` repaints them (settings, the lift). `native-ui.js` drops WAVE's row 6; skin's `wave-row-6`
  rules became `.lw-dither` rules. `tools/new-project.mjs` lost `dither: 0` and the empty project was rewritten (one line);
  `tests/new-project.test.mjs` adds `dither` to the keys `mat` must not carry.
- `serialize-bytes` on the base tree vs this one: all 22 readings (11 full, 11 edit) are **byte-identical to the base with
  `,"dither":0` removed** — the only move is the key leaving the project, by design.

### 3 · CLIP: an ON switch with its lamp, and the kind CLIP | SLAB
- `material.js`: VOLUME | CLIP | SLAB → `sw` **ON** (the kit's lamp; off = the full volume) + seg **CLIP | SLAB** beside it on the same
  line, shown while on; off it keeps its seat (`visibility: hidden`, `inert`) so the row never moves (Josh's hand law). The kind is
  remembered across an off. `mat.slice.mode` keeps 0 · 1 · 2, `material.slice.*` targets and the `slice` / `clip` ids are unchanged, and
  `ui.sliceModeSeg` keeps its `get()` / `set('off'|'clip'|'slab')` so restore and undo did not change.

## Decisions / where the brief was not followed to the letter
- **The switch says ON, not CLIP.** The card's eyebrow is already CLIP, and "CLIP [lamp] · CLIP | SLAB" read the word three times; Josh's
  own words were "'OFF/ON' with a light indicator", and MOLECULES ON / REGISTRY ON are the app's precedent. One-word change if Yan wants CLIP.
- **THE LOCK re-capture was a by-name removal, not a whole `--write`.** `--write` rewrites the whole fixture from this tree (it would drop the
  retired h2 / h2plus / helium states and re-stamp meta), which is more than "only the rows that vanish". So: the check showed exactly 17
  differences per fixture, all `reim` rows reading `now undefined`; those 17 keys were deleted from each fixture with the tool's own writer
  (`JSON.stringify(…, null, 1)`, which round-trips the old bytes exactly), and the tool's flag pair `[5, 6]` (reim/glass) left its `FV`
  list. Nothing else was re-baked.
- **DITHER's "read once"** needs a way to tell a pre-008 profile from one with DITHER off, so the blob always carries `dither` (11 B more
  than before). Strict reading of "a project open leaves settings byte-identical outside WORKSPACE" holds for every profile that has
  saved once since this row — the settings-probe shows no PREFERENCE key moved by any open.
- `tests/official-defaults-palette.browser-test.mjs` is **red on the base tree too** (its first check reads a VIVID control that left
  SETTINGS for MIR OPTIONS at iteration 003: `vivid is undefined`), so its palette assertions never run. The palette law itself is held by
  THE LOCK: `palette-on` / `palette-off` × density/phase/real/diff rows and every view × style row of the four kept views matched to the bit.

## THE LOCK ×2 (on 9621, `--query gastab=0`, RTX 3070, Firefox 158)
| run | 860 fixture | 1004 fixture (`digest-lock-s4a.json`) |
|---|---|---|
| base tree `24648c7` (served from `git archive` on 9622) | GREEN 860 / 0 | GREEN 1004 / 0 |
| this tree, shader change only | RED: 17 differences, all `reim/*` "now undefined" | — |
| this tree, final, before the trim | RED: 17, all `reim/*` "now undefined", 0 others | RED: 17, all `reim/*`, 0 others |
| this tree, final, after the trim | **GREEN 843 / 0** | **GREEN 987 / 0** |

The dropped rows (both fixtures): `reim/{cloud,solid,grain,signed,bands,dust,glass,additive}` and `{palette-on,palette-off,invert,
finish-glass,finish-matte,dither,bow,slice-clip,slice-slab}:reim/glass`. The hydrogen state digests and every density / phase / real /
imag / diff row are unchanged to the bit (no unrepeatable states, 0 page errors). The counts in CLAUDE.md and the tool's header now
read 843 + 987.

## Light check (screenshots in `w-shots/`)
- `wave.png` — WAVE: ρ=|ψ|² · arg ψ · Re ψ · Im ψ on one line, no DITHER row.
- `settings-quality.png` — SETTINGS › QUALITY with DITHER (ORDERED 8×8 on) and STRENGTH under AUTO SCALE · GOVERNOR · PERFORMANCE.
- `clip-on.png` / `clip-off.png` — CLIP: ON lit with CLIP | SLAB beside it; off, the lamp dark and the kind hidden in its seat.
- Probe (scratch, not committed): V from Re ψ → Im ψ → ρ → arg ψ → Re ψ (`mat.view` 2 3 0 1 2, the seg following); a project with
  `mat.view = 5` opened on PHASE with STATE reading `Re+Im left WAVE: opened as PHASE`, one with 4 on DENSITY with `Δρ left WAVE: opened
  as DENSITY`; `LW.setView('reim'|'diff')` → phase | density; DITHER pressed under QUALITY changed the picture (readPixels hash moved,
  bright 76463 → 76467), wrote `dither: 1` to the blob, was absent from `serialize()`, and survived opening WATER (which carries
  `dither: 0`); CLIP ON → mode 1 with the lamp, SLAB → 2, off → 0 with the kind hidden, on again → 2 (remembered), a project saved on
  CLIP opened with ON lit and CLIP chosen. Page errors 0.

## Tests
- `./test.sh node`: every suite GREEN after two test edits (capture.test's view table is five long, Re+Im no longer a phase view);
  `pwa.test` green after `node tests/pwa.test.mjs --write`.
- `node tools/rack-deps.mjs --classes --no-write`: HINGE holds (spectrum 25/25 as at base); persist 24 as at base (saveSettings
  destructured once, never read through `app.sh` at use), material 2, settings-card 2.
- Browser on 9621: field-law GREEN 9/9 (hydrogen RMS 2.34e-6, worst 1.68e-4), camera-shift GREEN (its LOCK check no longer looks for SET
  Δρ REF), history GREEN, new-project GREEN, lw-links GREEN, keyboard-window GREEN, menubar GREEN (its VIEW rows list the four), frame-
  occlusion GREEN; official-defaults-palette RED as on the base (above).
- `tools/settings-probe.mjs`: 4 of 6 scenes red **exactly as on the base tree** (reload WORKSPACE diffs of `closed` / `modwin` after a demo,
  pre-existing), no key outside WORKSPACE / PROJECT moved by any open; blobs 11 B longer (`"dither":0`). One run's N₂ open threw "Render
  did not settle" under the shared GPU; re-run alone it matched the base.
- `tools/serialize-bytes.mjs` base vs this: 22/22 equal modulo `,"dither":0`.
- `node tools/new-project.mjs --check` in step; `docs/PROVENANCE.md` regenerated (`node tools/provenance.mjs`: its LOCK row quotes the tool's header, now 843 + 987).

## For the integrator
- G (GRAIN AND DUST) branches from this merge: THE LOCK fixtures are now 843 / 987 values.
- U wires Δρ as MOLECULES' Δ switch; WAVE no longer offers it, and the shader's mode 4 is still there for it.
- `tests/legacy/boot.browser-test.mjs` still asserts SET Δρ REF and `setView('reim')` lighting pixels; it is the historical gate, not run.
