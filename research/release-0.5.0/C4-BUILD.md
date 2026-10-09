# C4 · THE MODULATION WINDOW AND THE ONE CLOCK — build hand-off (2026-10-08, two Opus 5.5 builders in relay)

**In ten lines.** The modulation window is the kit's: `createModulation(floats, mod.port(…))` from MIR 1.5's
`lab/mir/modulation/window.js`, built over A5's port. λWAVES' own copy, `lab/modwindow.js` (3,110 lines), is deleted. So is
`lab/audio.js` (438): the kit's `audio-capture.js` is the same capture. There is ONE clock (R-B1): THE play's edge plays or pauses
the modulation on every edge. The MOD button, Ctrl+Space and the window's power seat are a route bypass
(`setModulationEnabled`): time runs on, power never plays and play never powers. LINKED/SEPARATE and `clockLink` are retired,
and the tempo grid has 8 tiles in two rows of four. `modArm` and `modCadence` left the settings blob for the kit's record
`lambdawaves.q0.modulation`. `lab/*.js` **36,288 → 32,921 (−3,367)**. Node 85 = 82 green + the three known kit reds. Every
browser closer is green, and so is settings-probe **6/6**. No blockers. Nothing is pushed or merged.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a96a66756bee373da` (the continuation; the first builder's `agent-ac5f1a2ff05f502de` is history) |
| branch | `worktree-agent-a96a66756bee373da`, reset to the first builder's tip `aa9cd40` (whose base is `7044f37`, the `sos-s0` tip) |
| `b7ad98b` | the bare adopt of MIR 1.5 alpha.24 (`adopt.mjs --line 1.5`; identical to C0's) |
| `14f0fac` | the kit's window, `createModulation` over A5's port (`lab/modwindow.js` unimported) |
| `be03a83` | the one clock: LINKED/SEPARATE retired (titled WIP at the usage pause; `1584bd6` ran its closers, all green) |
| `033867b` | `modArm` + `modCadence` leave the settings blob for the kit's record |
| `2806bcc` | R-B1 complete: `lab/modwindow.js`, `lab/audio.js` and the lab.css badge ladder leave |
| `61fa38d` | `s3`: the settings probe compares `modwin.modes` only for the sources live after a reload |
| `65a4d1e` | the tempo grid is two rows of four |
| hand-offs | `7514000`, `de11b12`, `aa9cd40` (the first builder); `02643cf`, `d121bd6`, `0f02f6c` and the docs commit (this file + REPORT.md wave 201) |
| gate server | 8833 + geckodriver 5303, started by the continuation and stopped by pid at the end |

## What left

- `lab/modwindow.js`: 3,110 lines. It was λWAVES' copy of the window controller, and MIR 1.5 took it in as `modulation/window.js`.
- `lab/audio.js`: 438 lines. `lab/mod-port.js` now imports `./mir/modulation/audio-capture.js`. This was **verified** first, not
  assumed. The kit's file has the same exports (`createAudioCapture`, `AUDIO_STATE`, `BANDS`, `audioSupport`, default) and the same logic line
  for line: it is BASINS' harvest of this file, condensed, with its sentences routed through `t()`. So no shim was needed.
  `tests/audio.test.mjs` now targets the kit's file and is green.
- **The lab.css badge ladder.** The `:root:root:root:root` block and `.k-route-x` (15 lines) are gone. `modhost.css` 2359–2373 carries
  the same rules, faders included. `routed-knob` 4/4 holds without them.
- **LINKED / SEPARATE.** The `clockLink` variable, its settings read and write, `ui.clockLink`/`ui.setClockLink`, `LW.mod.clockLink`,
  and the tempo grid's LINKED and MOD ▶ tiles.
- **`modArm` and `modCadence` in the settings blob.** `saveSettings()` writes neither of them now.

## What stays (and where)

- **The port** (`lab/mod-port.js`, A5) is the object the kit window takes. It carries no `targets` (the kit reads that key as the routable-control
  selector), sets `dock: false`, and its `closed` reports nothing. `follow(on)` is THE play's edge: the demand comes first, then the play, then the
  pause, then the release.
- **rack.js.** `appPlay.onChange((on) => mod.follow(on))` runs on every edge. `setModArm` calls `modHost.clock.setModulationEnabled`.
  `LW.mod.play()/stop()` are THE play and THE pause. `modDodge` takes null and ignores a closed window. The occlusion listens to the
  window's `hidden` flips and its `onGeometry`.
- **The record.** `modStore = localStore('lambdawaves.q0.modulation')` (MIR `bind.js`) holds `{ modArm, modCadence }`. This is the record and
  the key names that `installModulation` reads. `saveMod()` writes it, and it is called from `setModArm`, the port's `setCadence`, `LW.mod.setCadence` and the tempo tile.
  `applySettings()` reads the record. An older blob's pair is read **once** into the record, and the blob drops it on its next save. FORGET
  clears the pair with the settings. The scope is still PREFERENCE (`docs/STATE-SCOPES.md`; `settings-store.js` FAMILIES).
- **`modwin`** stays a WORKSPACE key in the settings blob and in a project, as before.

## The decisions

1. **The window comes in through `createModulation(floats, port)`, not `installModulation`.** That is the λWAVES row of the kit's port notes. The first builder
   rejected `installModulation` for three reasons. It builds a second host and its own `core/frame.js` tick, which would advance a second clock beside
   `rack.js` `loop()`. It keeps a device copy of the rack (`modulationState`). And it adds a second visibility listener. R5-A3
   (`project: false`) therefore holds by construction: nothing calls `registerModulationParts`.
2. **The one clock is `installModulation().play`'s law**, applied through A6's facade: every edge, with no armed or LINKED gate. The power
   follows bind.js `setArm`: a route bypass that leaves time alone.
3. **The record is the kit's shape** (`modArm`, `modCadence`), so a later `installModulation({ storageKey: 'lambdawaves.q0.modulation' })`
   reads what λWAVES writes today.
4. **`s3` is the probe's law, not a defect.** See below.
5. **Step 4 (`tests/mir-controls`) was SKIPPED by the integrator's order.** The re-aim belongs to C0's continuation, which owns the
   canary's reds. The kit's ONE KNOB LAW is a vertical drag with a ⅛ fine gear (`setKnobLaw()`); the test still drags sideways
   at 1.4's numbers. That file is untouched here.

## `s3`: the finding

`.tmp/probe-s3.mjs` ran in one fresh profile:
- The boot rack is **s1 LFO + s2 ENV**. Note that NEW's file is LFO + AUDIO, and the boot is not NEW.
- WAVE DANCER opens **s1 LFO + s3 AUDIO** with `modes {s1: F, s3: F}`.
- A reload boots the **shipped** rack again, because there is no reopen-last-project at boot. The window keeps `modes` rows only for sources that exist, so the result is `{s1: F}`.
- Reopening WAVE DANCER brings `{s1: F, s3: F}` back from its file's `modwin`.

Nothing the hand set is lost. The red was already present on `1e1a4f8` with the **old** `modwindow.js` (A1-A8-BUILD.md, open item 1, handed
to C4; `tools/perf/device-report.js:679` names the same prune). So it is neither the kit's change nor ours to fix in `lab/`.
`tools/settings-probe.mjs` (+6) now compares B1 and B3 without the `modwin.modes` rows of sources that are absent after the reload, and it names those rows:
"byte-identical but modwin.modes s3". settings-probe is **6/6**. It was 5/6 on A1's base, on A1, and on be03a83.

## Gates (8833/5303, one browser suite at a time, 4 s apart)

| when | suite | count |
|---|---|---|
| `14f0fac` (first builder) | routed-knob · take-in-bugs · lfo-tension · history · new-project · frame-occlusion | 4/4 · 4/4 · 3/3 · 39/39 · 8/8 · 7/7 |
| `be03a83` (step 1) | take-in-bugs (§1 now five boots, 0 refusals) · new-project · history · routed-knob | 4/4 · 8/8 · 39/39 · 4/4 |
| step 2 | node 85 (82 + 3 known) · first-run (node) · new-project browser · settings-probe · `.tmp/probe-modstore.mjs` | 82 · 11/11 · 8/8 · 5/6 (s3) · correct |
| step 3 | node 85 (82 + 3 known; `audio.test` green on the kit's file) · routed-knob · take-in-bugs · new-project · history | 82 · 4/4 · 4/4 · 8/8 · 39/39 |
| step 5 | settings-probe | **6/6** |
| final | lfo-tension · `.tmp/probe-tempo.mjs` (8 tiles, 2 rows, no errors) | 3/3 · correct |

The node reds are the three known kit reds, which resolve at merge: `mir-manifest` (alpha.24 not ACCEPTED), `wiring` (the allowlisted
`lab/mir/shell/wordmark.js` is reached through `window/workspaces.js`; R5-W1) and `pwa` (an absolute URL in `lab/mir/shell/gui.js`).
`new-project --check` is **green**. The regenerate wrote bpm 30, and it is byte-identical to C0's and D9's (sha-256 `5b8a90de…6db`).
No timing red appeared, so nothing was re-run alone. The replay judges are in the node gate and are green.

## Lines

`cat lab/*.js | wc -l`: 36,288 (base) → 36,469 (the adopt) → 36,478 (`14f0fac`) → 36,464 (`be03a83`) → 36,472 (the record)
→ **32,921** (the deletions). C4's own edits are 57 lines in and 69 out across rack.js, mod-port.js, native-ui.js, settings-store.js,
lab.css and skin.css. The two deleted files account for the rest.

## Blockers

None.

## Open items

- **lab.css duplicates modhost.css.** The arming, pop-over and `.mod-mchip` rules (~lab.css 656–711 now) repeat what modhost.css has, and `.mod-pop` carries
  `backdrop-filter`. These are glass classes, so they wait for C0's G3 rulings and are left for C0.
- **The kit window does not dock.** It is not in `registerWindow`'s stack and does not dock (`dock: false`) until C3's rack span exists.
- **`tests/legacy/`** reads `__LW.mod.clockLink`. That suite is outside the gate and its laws are superseded.
- **Boot cost.** The kit's `place()` measures layout while the window is closed. This is C-V's ms/s question.
- **The boot rack differs from NEW.** The boot is LFO + ENV and NEW is LFO + AUDIO. new-project's §1 excludes the modulation on purpose; recorded here as a fact.
- **The tempo grid.** The one-line `skin.css` change (`repeat(4)`) can be re-applied on top of C0's side if that file conflicts.

## Brief candidates (MIR; no kit file was edited)

1. **`port.targets` is two things.** `window.js` reads it as the routable-control selector, but a host naturally has a `targets` object (A5's did), and
   then every `closest()` throws. Either type-check it or rename the key (`routable`).
2. **A closed window still reports.** It reports a box (`place()` measures and reports while closed), and the close reports `moved(null)`.
   Hosts have to filter both. A closed window should report nothing and skip the layout, which would also save boot cost.
3. **`bind.js` `localStore` has no `remove()`.** `jsonStore` has one. λWAVES' FORGET has to write `undefined` keys instead.
4. **`installModulation`'s record needs a persist list.** The record also persists `modulationState` and `modwin`. In λWAVES those are PROJECT and WORKSPACE, so an app that keeps the power
   and the cadence in that record but owns the rack elsewhere needs a `persist` list (or `{ rack: false, presentation: false }`).
   Without it, λWAVES cannot adopt `installModulation` as it stands (R5-A3).

## Exact next step

The integrator merges `worktree-agent-a96a66756bee373da` into `yan-c`. The expected conflicts are `rack.js` against D9's restore shim
(the C4 hunks are the import, applySettings' three lines, `modStore`/`saveMod`, FORGET, `setModArm`, `LW.mod`, `reworkNative`, the four
comment lines and be03a83's clock lines), `lab.css` against C0's `#keymap` rules (C4 only deletes lines 432–446), `lab/sw.js` (take
either side, then `node tests/pwa.test.mjs --write`) and `lab/new-project.lambdawaves.json` (byte-identical to C0's). After the merge, run
`node tools/new-project.mjs --check`, the node gate, and `take-in-bugs`, `history`, `routed-knob` and `settings-probe`.
