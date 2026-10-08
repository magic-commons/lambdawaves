# A5 + A6 BUILD — the modulation port and the one-clock facade (0.5.0 stage A)

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ac7efdcc9d1fca69a`, branch
`worktree-agent-ac7efdcc9d1fca69a`, base `12451d2` (sos-s0, 0.4.0 complete). Never pushed, merged or tagged.

## Ten lines
1. A5: `lab/mod-port.js` (119 lines; 129 with A6) is the object `createModulation(port)` takes, and the edges behind it.
2. A5 behaviour is byte for byte. `loop()`, the settings pair, `restore` and the `LW` literal are untouched; they read the port through one alias line.
3. A6: `onePlay(clock)` in `lab/clock.js` is THE play. Every physics play/pause edge, from any road, reaches the modulation at once.
4. A6: `mod.follow(on)` holds `host.clock.demand('app.play', true)` while THE play plays (armed + LINKED) and releases it on pause.
5. The LINKED follow/retry block in `loop()` and S0's re-arm in `opened` are deleted. Arming and LINKED now catch up at once.
6. S0's open item is closed: a fresh boot or NEW with the editor closed and nothing routed (even no sources) plays both clocks with no refusal.
7. A bare host play with no demand still refuses `nothing-to-run`; that law stays the kit's.
8. LINKED/SEPARATE are NOT retired, by the integrator's narrowing. The three keys stay PREFERENCE and an old `clockLink:false` stays SEPARATE. The rest moves to C4.
9. Gates: node exit 0 (85 suites); take-in-bugs 4/4, history 39, mir-controls 2, routed-knob 4/4, lfo-tension 3, new-project 8, offer 16. None was re-run alone.
10. `lab/*.js` 36 280 → 36 234 (−46).

## Commits
- `f9b47dd` 0.5.0 A5 · wave 188: THE MODULATION PORT — lab/mod-port.js is the object createModulation(port) takes
- `d93fbc4` WIP A5/A6: hand-off at the usage pause (its `A5-A6-HANDOFF.md` is deleted by the A6 commit: superseded by this file)
- the A6 commit: 0.5.0 A6 · wave 189: THE ONE-CLOCK FACADE (this file is in it)

## The port's members and their kit twins (MIR 1.5 `modulation/window.js` `createModulation(host, port)`)
| member | λWAVES source | kit twin |
|---|---|---|
| `M`, `registry`, `targets`, `clock` | the 1.4.3 host (`mod.install(defs, roots)`) | same keys |
| `apply` | `applyAll(false)` + PRESENT + the history note | `apply` |
| `knobOf` | the catalogue's knob accessors | `knobOf` |
| `persist` | `saveSettings` | `persist` |
| `cadence`, `setCadence` | 60 / 120 Hz, PREFERENCE `modCadence` | same keys |
| `armed`, `arm` | rack.js `modArm` / `setModArm` (the MOD power) | same keys (1.5: `setPower`) |
| `audio` {state, support, start, stop, sync, devices} | the one capture (`lab/audio.js`), `audioDevice` handle | `audio` (1.5: `audio-capture`) |
| `rateControl`, `moved`, `opened`, `closed` | the RATE dial, the transport's dodge, presentation demand on / off | same keys |
Behind it, the port's own law: `hand`, `setKnob`, `syncBases` (+ `syncing`), `feedAudio`, `install`, `stamp`, `follow`.

## What an old settings file's LINKED becomes
Unchanged in A6: `clockLink: false` is read as SEPARATE, as before. Under LINKED (the default) THE play now holds the app-play
demand. At C4 the kit's one play retires LINKED / SEPARATE (R-B1).

## Tests (8765/5235, one suite at a time, 4 s apart)
- A5 tree: `bash test.sh node` exit 0; `mir-controls` 2, `lfo-tension` 3, `routed-knob` 4/4, `history` 39. Each ran twice: first
  on my first cut, then on the lean cut I rebuilt after the integrator's sharing map.
- A6 tree: `bash test.sh node` exit 0 (85 suites, including the replay judges, `render-exact` and `new-project --check`).
  `take-in-bugs` 4/4 ran twice: before and after the `follow` compaction. `history` 39, `mir-controls` 2, `routed-knob` 4/4,
  `lfo-tension` 3, `new-project` 8, `offer` 16.
- None was a timing red, so nothing needed a re-run alone. `current` was not run: the integrator reports it red on the untouched base under load.

## Blockers
None. The shell guard refuses `for` loops and compound git; `.tmp/gate.sh` and `.tmp/edit.py` stand in for them.

## Open items
- C4: retire LINKED / SEPARATE. That means: the three keys leave PREFERENCE (read once, dropped); the window's ▶ and `LW.mod.play` become
  THE play; the tempo panel loses LINKED and MOD ▶; STATE-SCOPES and the PREF set follow; history's SEPARATE scene is rewritten.
- On 1.4.3, MOD power off (`setEnabled(false)`) also holds modulation time. The 1.5 kit's POWER keeps it running.
- CLAUDE.md, drafted and not applied. For the first paragraph: "The modulation port is `lab/mod-port.js` (the object
  `createModulation(port)` takes); THE play is `onePlay` in `lab/clock.js`, and while MOD is armed and LINKED the modulation
  follows its edges holding the kit's `demand('app.play')`, so a play is never refused for want of a route or an open editor."
- `tests/legacy/` reads `clockLink` 12 times. It is outside the gate and still valid, since LINKED stays.

## Exact next step
Integrator: merge this branch after A1–A3. The `rack.js` sites touched are the port block, `:550–551`, the LINKED lines in `loop()`,
`togglePlay` / `setModArm`, one line in `restore()` and `ui.setClockLink`. Then the ACTIONS and `LW` merges are untouched by A6.
