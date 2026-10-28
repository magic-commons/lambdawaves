# 021 Reviewer A: records, modulation, timeline, the molecule switch, NODES, MIR unified (Opus, read-only, yan-c @ aaf54b6; saved verbatim by Claude Sos). Paths under lab/ unless shown.

## 1. THE RECORDS
| key / part | writer · when | scope (doc vs code) | version |
|---|---|---|---|
| `q0.settings` | `saveSettings` settings.js:33 (sync, ~39 call sites) plus 5 read-merge writers: main.js:22 `warned`, shell/keys.js:183 `tlwin`, rack-wiring.js:40 `layouts`, modulation.js:284 `audioDevice`, notebook.js:340/343 `abW/nbW` | PREF + the WORKSPACE subset | `gen:16` (an iteration number, not a schema version) |
| `mir.gui`, `q0.info` | kit `createPrefs` | PREF ✓ | kit |
| `q0.modulation` | controller.js:195 kit `localStore` | PREF ✓ | none |
| `q0.curves` | nodes.js:87, 250 ms debounce | PREF ✓ (FAMILIES names the owner as "rack.js") | model's |
| `q0.nodes` | nodes.js `put` (immediate) + `saveList` (250 ms) | PREF, no STATE-SCOPES row | v:1 |
| `q0.presets/palettes/curvePresets/nodePresets` | user-presets.js, on change | PREF, no rows | v:1 |
| `q0.csb` | csb-favs.js:81 | PREF, no row | v:1 |
| `q0.picker` | picker.js:73, raw localStorage | PREF, no row | none |
| `q0.keys` | key-table.js:17, its own `local` store | PREF ✓ | none |
| `q0.modpresets` | kit mod.js, plus a project SAVE upsert (notebook.js:262) | doc says "no project writes it": false | modV |
| `q0.session` | kit session, 300 ms + pagehide | PROJECT ✓ | v:1 |
| `q0.notebook(.title/.subtitle)` | notebook.js:146 (300 ms) + part.restore | PROJECT, no row; duplicates the session part | none |
| `q0.experiment/presentation` (quick SAVE) | persist.js:136 | PROJECT, no row | none |
| `q0.projects(.window/.seeded)`, `mir.transport(.free)`, `mir.tier/pointer` | kit | no rows | kit |
| project file | projects.js:47, one part `{data, notebook}` | — | envelope `version:1`; the contents migrate by key sniffing |

Findings:
1. BUG · A failed RESUME arms autosave over the saved work. mir/core/session.js:124 sets `armed = true` even when the restore failed. projects.js:291 reports the failure but neither rolls back nor disarms, so the next 300 ms flush overwrites the user's last session with a half-restored state. Fix: on `!ok || failed.length`, copy the record to `q0.session.failed` and leave autosave unarmed (KIT).
2. BUG · Three restore roads have no rollback: `openLink` (links.js:73), quick LOAD (notebook.js:87 → `restore()`) and resume. Only FOLDERS opens snapshot and roll back (projects.js:89). Fix: route all of them through `openPayload(…, rollback=true)`.
3. DRIFT · `saveSettings` rebuilds the blob from an allowlist of carried keys. The comments record this hole being found four times (waves 54, 59, 105, M4), and five other modules write the same blob. Fix: write `{...S0, ...owned}` minus a declared RETIRED list; better, split WORKSPACE out of the blob into its own record.
4. DRIFT · STATE-SCOPES lacks rows for 13 families (nodes, nodePresets, curvePresets, palettes, presets, csb, picker, notebook×3, experiment/presentation, projects.window/seeded, mir.transport). FAMILIES owner strings are stale: settings-store.js:15-20 still say "rack.js NB_KEY / LS_EXP / modStore / curvesStore". Fix: generate the doc table from FAMILIES.
5. DRIFT · FORGET (mir-gui.js:34) wipes settings, look, mod, curves and info, but keeps nodes, keys, csb, picker and presets. It also doesn't cancel nodes.js:87's pending 250 ms curves write, which then puts the record back: a surviving CURVES node over a forgotten grade. Fix: a `forget` flag per FAMILIES row, and FORGET flushes or cancels the stores.
6. DEBT · Records that duplicate the kit: key-table.js:17 `local` and picker.js:73 re-implement `jsonStore`. Both are unversioned. Fix: `jsonStore` plus `{v}`.
7. DEBT · The notebook is stored twice (q0.notebook* and session.parts.notebook). Fix: keep the session copy only.

## 2. MODULATION + MACROS + ROUTING
Two registration roads: the static `defs` table, shell/modulation.js:30-165, through `mod.install` (mod-port.js:118), flash-guarded and stamped; the runtime door `LW.mod.register` (facade.js:139), used by nodes.js:99 and by `chem.orbital` re-installs (modulation.js:172). Routes ride in `presentation.modulation`, stamped with `v` (persist.js:97). Bases ride in `modulationBases` (notebook.js:203-218) and the edit-scope `modSeats` (persist.js:25). Macros reach targets through the kit model, then `registry.applyModulated`, then the def's `set`. A route on a missing target goes dormant (mod.js:2469) and wakes on any later target with the same id.

Findings:
1. BUG · NODES ids are reused and renumbered. `add`/`duplicate` take the lowest free `n<k>` (nodes.js:126,136), and `applyGraph` renumbers to n1…nk (nodes.js:148). A route or TIMELINE lane on `nodes.n2.amount` therefore wakes on a different node (GRAIN → VIGNETTE) after a preset or after a delete-then-add. Fix: monotonic ids (`seq` in the record, never reused), and `unenroll` drops or dormant-marks the routes explicitly.
2. BUG (safety) · Runtime targets skip the FLASH GUARD. `guardRoutes` wraps only the install defs (mod-port.js:119), so `nodes.*` (levels, contrast, luma, vignette) can strobe unguarded. Fix: move the guard into the registry write path, or let `register(spec.flash)` wrap it.
3. BUG (known, PLAN #21) · Old files' `nodes.*` bases are applied on open. persist.js:133 `setBase` on `savedBases` is unfiltered. Fix: one-line filter `!id.startsWith('nodes.')` in `restoreModulation`.
4. DRIFT · Range and map are declared twice: the def (modulation.js:49-73) and the knob (material.js:34-58, settings-card.js:77-88). NODES derives the def from the knob spec, so the two families already work differently. Fix: `knob({ target: 'material.gamma' })` self-registers from its own spec (KIT).
5. DRIFT · Base seating differs by family: `observer.*`/`material.*`: `modSeats` plus `modulationBases`, gated by tools/camera-routes.mjs; `reg.amp/ph` lanes: edit scope only; `chem.orbital`: seated only when finite; `nodes.*`: none. Camera routes are history rows, the pose is not. Fix: one `seat` field on the def; `modSeats` generated from it.
6. DEBT · `register`/`unregister` each call `modView.rebuild()` (facade.js:141-142): a 5-node graph costs ≈ 25 rebuilds. Fix: `batch()`.
7. KIT · Josh's 10-18 ruling ("route OR lane, never both") is still unbuilt (FOR-MIR.md:136).

## 3. TIMELINE
1. BUG · PLAYBACK LOCK steps only physics. Under LOCK, `clock.advance` steps `rate/hz` (rack.js:403-415), but the modulation clock still `advanceTo(now)` on the wall and `rotStep(modDt)` integrates wall time (rack.js:388-394): a missed frame slows ψ while the LFOs, TIMELINE clips and ROTATE z run on, and the two desync. The film drives both at 1/fps (render-exact.js:19-30). Fix: under lock, `host.clock.step(1/hz)` and `rotStep(1/hz)` on the same tick.
2. DRIFT · Two positions and two rewinds. THE ONE PLAY (clock.js:56) unifies play/pause only: the main bar's ⏮ resets physics t (transport.js:39) and leaves the modulation beat; TIMELINE's ⏮ seeks the modulation beat (mir/timeline/controller.js:75) and leaves t; the TIMELINE bar shows physics `t` in a.u. (keys.js:173) over a ruler in beats. Fix: one transport position, with `seek` moving both clocks (t = beat → a.u. through RATE/BPM), or label the two clearly.
3. DRIFT · t is written from ≈ 12 sites with different side effects: `home` (keys.js:48), `clearRegister` (transition.js:16) and barClock.seek each reset the scrub and trail; `appPlay.seek` (clock.js:59) and facade `scrub` do neither, and `seek` schedules nothing. Fix: one `transport.seek(t)` in clock.js that owns the scrub, trail and schedule.
4. DEBT · The timeline restore passes no `remap` (persist.js:322), though the kit offers one (mir/timeline/project.js:7).

## 4. MOLECULES / HYDROGEN SWITCHING
The switch runs: chemview.js:1315 `setOn` sets `on` and drops the volume when OFF → `api.setOn` → `moleculeMode` (molecules.js:31) hides a hard-coded list of 10 windows, shows MOLECULES, sets modeSeg, forces x-space, calls `styleSync`, and (when OFF) `switchHamiltonian(same id)` and REBUILD → stage text, then status → then `S().claim('ground', on)` → the solve, async (≈ 150 ms).
The mode is tested seven ways: `chem.on` (31 sites); the session's selected model (rack.js:540); field `molOn` (field.js:1989); chemview `fieldHash !== null`; modeSeg `aria-pressed`; persist's composite `fieldOwner` (persist.js:234); the Picker's PREFERENCE `atomic: 'atoms'` (picker.js:54).

Findings:
1. DRIFT · `chem.on` is used to mean "the field holds a molecule". rack.js:308 skips `packModes` and rack.js:323 takes `chem.half`, both before the solve has landed: ≈ 150 ms of stale or blank field under the atom's domain. Fix: read `molSession.selected` for field decisions, `chem.on` for UI only.
2. DRIFT · Mode membership is a hand list (molecules.js:32): LATTICE, BLOCH, CENTRAL, SEPARABLE, ATOMS, WIGNER and RADIATION unlisted. Fix: `device({ mode: 'atoms'|'molecules'|'both' })`, and `moleculeMode` iterates it (the KIND table at settings.js:139).
3. DRIFT · One mode change uses three UI treatments: hide windows (moleculeMode); grey buttons (017 W2, material.js:134); hide rows (018 B1). SPACE `p` has three owners (modeSync, applySturmian, `noMomentum` systems spectrum.js:252). Fix: one `availability(control) → {on, why}` law per mode or system.
4. DRIFT · `'atoms'` means HYDROGEN in modeSeg and the ATOMS deck in the Picker, and `'atom'` is a Hamiltonian id. Fix: rename modeSeg's id to `hydrogen`, accepting `atoms` on read.
5. DOC DRIFT · The CLAUDE.md MOLECULES/MO-REGISTRY paragraphs describe pre-002/008 behaviour.
6. DEBT · OFF repaints twice (`styleSync` in moleculeMode and again in `molFieldView(null)`). Fix: claim first, then moleculeMode.

## 5. NODES (records and modulation)
1. BUG · Id reuse and renumbering (§2.1). 2. BUG (known) · Old-file bases applied on open (§2.3).
3. DRIFT · The graph is PREFERENCE, but project routes, TIMELINE lanes and history rows can address `nodes.*`: a PROJECT references a PREFERENCE entity that differs per device. Fix: refuse `nodes.*` as a route/lane target in project serialization, or move the graph to PROJECT (`presentation.nodes`) with a PREFERENCE default-graph seed.
4. DRIFT · The NODES window `win` sits in a PREFERENCE record; `modwin` is WORKSPACE and travels; `tlwin` is WORKSPACE that does not travel. Fix: one kit window-placement record in WORKSPACE (§6).
5. DEBT · NODES has its own undo (nodes-undo.js) beside the kit stack (a third undo after edit and timeline).

## 6. MIR UNIFIED: FOR-MIR candidates for kit 1.5.5
1. KIT · `createRecord(key, { version, schema, migrate, scope, forget })` — `createPrefs` generalised to non-look data. Adopt it for the settings blob, keys, picker, csb, user presets and nodes; retire `gen:16`, the carry list and the hand-made `local` stores. FAMILIES becomes the registry; STATE-SCOPES generated from it.
2. KIT · one window-placement store (today five shapes: `layouts`, `tlwin`, `modwin`, nodes `win`, `projects.window`, `mir.transport.free`, `lw.keyboard.position.v1`). Fix: `createWindow({ id, persist: workspace })`, so every kit window joins `captureLayout`.
3. KIT · `createPresetStore(key, { kind, validate })` with folders and a modV-style stamp, shared by mod presets and user-presets; remove the app default `PRESET_LS` from mir/modulation/mod.js:2587.
4. KIT · session: don't arm on a failed resume; keep the failed record (§1.1).
5. KIT · registry: bake the flash guard into the registry write; add `register()` batching; a tombstone on unregister so a dormant route never wakes on a reused id.
6. KIT · transport position: one `seek` spanning the play clock and the modulation beat; a LOCK option on the modulation clock (`stepMode: 'locked', hz`) as the film's record clock has.
7. KIT · route-XOR-lane (Josh 10-18).
8. KIT · `knob({ target })` self-registration (§2.4).
9. ADOPT (app side) · the kit's `rackPart`/`timelinePart` (mir/modulation/project.js, mir/timeline/project.js) as separate project parts instead of hand-embedding; keep the reader for old files.

## DREAM ARCHITECTURE
Records. `records.js` is the one registry: `{ key, scope, version, schema, migrate, forget, owner }`. Every store is `createRecord(row)`, STATE-SCOPES is generated from it, and no module touches localStorage. Three store objects: `prefs` (one record per family); `workspace` (the cards, every kit window placement and the folds — one record, also a project part); `project` (kit parts `physics`, `presentation`, `modulation` (rackPart), `timeline` (timelinePart + remap), `nodes` (PROJECT, seeded from a PREF default), `notebook`). Each part has `capture/restore/signature/editScope`. History, session, FOLDERS and links all use one transactional `openProject(parts, {rollback})`.
Targets. `targets.js` declares every routable control once (`id, spec, seat, flash, mode`); knobs are built from it. Ids are permanent; NODES ids monotonic. The guard sits in the registry.
Time. `time.js` keeps one position: `t` in a.u. plus a beat derived through RATE/BPM. One `seek`, one `step`, a mode WALL | LOCKED | RECORD that drives physics, modulation and rotation together; the only writer of `t`.
Modes. `modes.js` holds the mode as a value `hydrogen|molecules` plus `availability(control)`. Windows declare their mode; field decisions read `molSession.selected` and never the UI switch.
