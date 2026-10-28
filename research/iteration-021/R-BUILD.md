# 021 chain R — RECORDS AND TIME (Opus builder, branch `it021-R`, BASE `ec63b9b`; one kit door, the clone road)

## Rows
- **R1 `294b87b` THE RESUME** — kit door **MIR 1.5.6-alpha.1** (`mir/core/session.js`): a resume whose saved parts threw or came back `failed`
  copies the record to `<key>.failed` and leaves autosave unarmed (a later resume that takes, `discard()` or `arm()` arms it); the return
  shape is unchanged; a seed-only or empty record still arms. Kit test `tests/session.node.mjs` gained the case (8/8). λWAVES: `projects.js`
  `openPayload(value, meta, { rollback, take })` — `take()` is the restore, `meta.land === false` keeps the snapshot and roll-back but leaves the
  landing to the caller, `meta.clean === false` lands unmarked. RESUME, a link (`links.js openLink` → `projects.openWith`) and quick LOAD
  (FILE menu → `openWith`) all take it; a failed RESUME says "kept as lambdawaves.q0.session.failed; autosave is off until a project opens" and
  rolls back to the boot scene; the next project that takes arms the session. Probe (`.tmp/r/resume-probe.mjs`): armed false, `.failed` = the record.
- **R2 `c09fca2` THE IDS** — `nodes.js`: `seq` in `lambdawaves.q0.nodes`; add / duplicate / applyGraph take `'n' + (++seq)` (older records: the
  highest n); nothing renumbers (probe: add n1, n2, remove n1, add → n3, seq 3). `unenroll` → `LW.mod.unregister` → the target host's dormancy
  sync (an id is never reused, so a dormant route wakes only on its own node, e.g. NODES' undo). THE FLASH GUARD: `mod-port.js routeGuard` is
  one limiter for the install defs' four luminance routes AND any runtime target with a `flash` step (`P.guard`, called by the facade's
  `register`); NODES passes a tenth of each knob's span (ln span for a log knob). `LW.mod.batch(fn)`: one modulation-window rebuild per graph
  change (add, remove, duplicate, a graph, rename, undo, boot). `persist.js restoreModulation` ignores a file's `nodes.*` bases;
  `serialize()` (non-edit: file, session, FOLDERS) refuses `nodes.*` routes and TIMELINE curves (+ their clips) with one console line when
  the count changes; the edit scope keeps them (an undo row is this tab's). THE LOCK untouched (NODES never touches the field).
- **R3 `34a60be` ONE TIME** — rack.js' loop: the PLAYBACK LOCK block moved above the modulation clock; while `fieldRate.lock` and ψ plays,
  each lock tick runs `modSyncBases`, `feedAudio(hz)`, `host.clock.step(1/hz)` (the kit's deterministic door, the film's) and `rotStep(1/hz)`;
  a waiting tick steps none of them; on release the modulation's stamp is re-anchored (`suspendRealtime(now)(now)`, no play edge). WALL runs
  the old block in an `else`, byte for byte. THE ONE SEEK: `Clock.seek(t, { trail, schedule })` + `onSeek` (wired by `onePlay`, whose
  `seek`/`bind` are the same door): it scrubs, paints the playhead (never under a hand), clears the shadow trail and asks the frame. Callers:
  HOME, CLEAR (`clearRegister`), the bar's ⏮ (barClock), the SCRUB, ⟳, the vortex LOCATE, a preset (`loadPreset`), a restore (persist),
  `LW.scrub` / new `LW.seek`, and the film (`render-exact.js seekTo`, `trail: false, schedule: false`, its exact schedule unchanged).
  Hints: the bar's ⏮ "t → 0 (home) · ψ's time back to 0 a.u.; the modulation beat and the TIMELINE playhead stay"; TIMELINE's ⏮ "beat →
  bar 1 · … ψ's t stays". `tools/perf/play-lock-probe.mjs` routes an LFO to HUE and logs the modulation clock's seconds beside t.
- **R4 `301d338` ONE STORE** — `settings-store.js` RECORDS: 31 rows `{ key, scope, version, forget, owner }` (a `prefix` row for RENDER; the
  kit's rows `kit · …`), FAMILIES by key, RETIRED (29 blob keys), `onForget`, `forgetRecords`, NOTEBOOK_KEYS. `docs/STATE-SCOPES.md` "The
  records (generated)" — 43 lines between markers, written by `node tools/state-scopes.mjs`; `--check` runs in `./test.sh node`.
  `key-table.js` → `jsonStore` `{ v: 1, keys }`, `picker.js` → `jsonStore` `{ v: 1, …prefs }`; an unversioned record is read once and written
  back upgraded. FORGET (mir-gui.js): the look, INFORMATIONAL, the power/cadence, then `forgetRecords()` (NODES' two 250 ms timers cancelled
  first) — the blob, the grade, the graph + nodePresets, palettes, curvePresets, presets, csb, picker, keys, RENDER's `*`, LEAN. STAY: the
  session, `.failed`, the quick save, projects (+ .seeded, .window) — the work; modpresets — a project SAVE writes its rack there; the LIBRARY
  — device content; the kit's seats and calibration — the kit's. `saveSettings` writes `{ ...S0, ...owned }` minus RETIRED (no carry list;
  `askOk/askUrl`, `modwin`, `phoneRack` written only when this build owns a value). THE NOTEBOOK is stored once: the 0.4 keys are read at boot,
  removed, and the session's next save keeps the text (`projects.changed()`); every notebook input tells the session. `tools/settings-probe.mjs`
  reads the new row shape. The empty project's bytes did not move (16098 B, `--check` in step).
- **R5 `a4fad59` ONE MODE** — `modesAt` and `applyRebuild`'s `domain.half` read `molSession.selected`; `chem.on` stays for UI. The seat is a
  table, `export const MODE` in `shell/settings.js` beside KIND (the `app` literal can't take `app.sh.MODE`: rack-deps G-A); `moleculeMode`
  hides every `.dev` whose MODE is `hydrogen`; the FINDER's grey word reads it. The seven: CENTRAL, SEPARABLE, ATOMS = hydrogen (operators that
  replace the hydrogenic Hamiltonian); WIGNER, RADIATION = hydrogen (they read the hydrogenic register); LATTICE, BLOCH = both (own registers,
  touch neither field nor register; LATTICE's benzene Hückel preset is a molecule's picture). `#lwMode`'s HYDROGEN button id is `hydrogen`
  (`set('atoms')` still reads as HYDROGEN; csb.css / skin.css / tools/csb-probe.mjs re-aimed). chemview `setOn`: the claim first, then
  `api.setOn` → moleculeMode. `availability(control) → { on, why }` NOT built (022's UI law). Probe: CENTRAL/WIGNER/RADIATION/SPECTRUM hide
  under MOLECULES and return, LATTICE/BLOCH stay; the molecule chooser hides under HYDROGEN, the atomic icon still draws.

## R3 numbers (headless Firefox, 64³, 1600 px, 8 s each, preset 1s+2pz, LFO → HUE)
| mode | presents/s | Δt median · CV · distinct | modulation step median · CV · distinct |
|---|---|---|---|
| WALL | 34.0 | 0.13256 · 0.616 · 93 | 0.0332 s · 0.584 · 44 |
| LOCKED 60 | 23.1 | 0.0666667 (= 4/60) · **0** · 1 | 0.0166667 s (= 1/60) · **0** · 1 |
| LOCKED DISPLAY | 25.1 | 0.06464 · **0** · 1 | 0.01616 s · **0** · 1 |
Under LOCKED both clocks step by one constant on the same present. THE LOCK after R3 and R5: `--check --query gastab=0` **843 · 0 · 0**; plus `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` **987 · 0 · 0**. Leaves moved: none.

## The kit door
MIR **1.5.6-alpha.1** = kit commit `7f052d5` on the clone of `kit-1.5.5.bundle` (package.json, mir/version.js, tokens.json `kit`; CHANGELOG
"1.5.6 (unreleased)"); adopted by `.tmp/kit/tools/adopt.mjs` (3 files + MIR-MANIFEST.json), pinned `'1.5.6-alpha.1': '753de766…'` in
tests/mir-manifest.test.mjs (1.5.5 kept); `adopt.mjs --check` "in step with MIR 1.5.6-alpha.1". Bundle (branch `kit-1.5.5` now at 7f052d5,
tag `v1.5.5`): **`<worktree>/.tmp/kit-1.5.6-alpha.1.bundle`**. ~/Documents/MIR untouched.

## Tests (LW 9683 / GD 5683, one browser at a time)
`./test.sh node` green after every row (+ `tools/state-scopes.mjs --check`); `pwa.test.mjs --write` after every lab edit; `rack-deps --classes`
HOLDS (persist 24/25 throughout — R3's restore seek goes through `clock.seek`, not a new app member). Browser: history, new-project, lw-links,
project-formats, menubar (R1); curves, routed-knob, history (R2); timeline, current, film-handover, field-law, register (R3); new-project,
history, keyboard-window, picker-looks, curves, project-formats, menubar, current + tools/settings-probe (R4); molecule-demos, field-molecule,
chem, window-switching, picker-looks, molecular-names (R5) — all GREEN. Re-aimed: keyboard-window (`.keys`), new-project (the retired key reads null).

## CLAUDE.md sentences to add
- ONE STORE: every stored key is a row of `lab/settings-store.js` RECORDS `{ key, scope, version, forget, owner }`; STATE-SCOPES' records
  table is generated (`node tools/state-scopes.mjs`, `--check` in the node gate); FORGET wipes the `forget` rows after `onForget` cancels;
  `saveSettings` writes `{ ...S0, ...owned }` minus RETIRED — never a carry list; the notebook lives only in the project part.
- ONE TIME: `clock.seek(t)` (= `appPlay.seek`) is the only writer of t outside `advance`; under PLAYBACK LOCK the modulation clock
  (`host.clock.step`) and `rotStep` step 1/hz on ψ's tick; the two ⏮ say what they move; one position is a 1.5.6 door.
- ONE MODE: a window's mode is `MODE` in `shell/settings.js` (hydrogen | molecules | both); `moleculeMode` iterates it; field decisions read
  `molSession.selected`; the HYDROGEN button is `#lwMode [data-id="hydrogen"]`. (Correct the MOLECULES paragraph: ATOMS | MOLECULES → HYDROGEN.)
- THE IDS: a NODES id is `'n' + (++seq)` and never reused; `nodes.*` is refused as a project route or lane target; runtime targets join
  the flash limiter with `flash`; `LW.mod.batch` rebuilds once; a resume that fails never arms (kit 1.5.6-alpha.1).

**FOR 1.5.6** (docs/FOR-MIR.md): BUILT alpha.1 (the failed resume). Open: ONE POSITION (`seek` over the play clock and the beat), a modulation-clock LOCK option (`stepMode: 'locked', hz`) and a `clock.reanchor(at)` door (today `suspendRealtime(now)(now)`).

## Open questions for Josh
1. Call 3 as built: `nodes.*` routes and lanes leave the session too (the session IS the project), so a NODES route does not survive a reload.
   Keep, or move the graph to PROJECT?
2. FORGET now wipes the reader's own presets (palettes, curves, graphs, PRESETs) with the preferences — or should user-made presets stay?
3. NODES' flash step (a tenth of each knob's span) is uncalibrated; calibrate the luminance nodes with tools/flash-calibrate.mjs?
4. `molSession.selected` is set at the claim, before the solve lands, so the ≈ 150 ms ON gap is unchanged; read "selected and a volume
   adopted" instead?
5. A SCRUB drag now clears the shadow trail on every move (the one seek), where it kept it before.
