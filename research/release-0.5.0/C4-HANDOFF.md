# C4 HANDOFF — the modulation window and the one clock (live state; superseded by C4-BUILD.md at the end)

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ac5f1a2ff05f502de`, branch
`worktree-agent-ac5f1a2ff05f502de`, reset to `7044f37` (sos-s0 tip). Never pushed, merged or tagged.
Gate server: `python3 tools/gate/server.py <worktree> 8833` (pid 3640553 at the time of writing; stop it by pid). GD_PORT 5303.

## Commits
- `b7ad98b` the bare adopt of MIR 1.5 alpha.24 (identical to C0's).
- `7514000` hand-off (design).
- `14f0fac` wave 201: the kit's window, `createModulation` (lab/mir/modulation/window.js) over A5's port. `lab/modwindow.js`
  is no longer imported but still on disk. Port fixes: no `targets` (the kit reads it as the routable SELECTOR), `dock: false`,
  `closed` reports nothing (the kit's close reports `moved(null)`). `modDodge` takes null and ignores a closed window.
  Occlusion hears the window's `hidden` flips and `onGeometry`. `tests/lfo-tension` waits for the window's animations.
  Gates: routed-knob 4/4, take-in-bugs 4/4, lfo-tension 3/3, history 39/39, new-project 8/8, frame-occlusion 7/7; node: C0's 4.
- `lab/*.js`: 36,288 (base) → 36,469 (adopt, sw.js +181) → 36,478 (this commit).

## Design (decided) — see the first version of this file in `7514000`
- the window: kit `createModulation(floats, mod.port(...))`; not `installModulation` (second host + own tick + device copy of the
  rack); `project: false` holds by construction.
- the one clock: `mod.follow` on EVERY play edge; power = `setModulationEnabled` (bypass).
- LINKED/SEPARATE retired; tempo tiles 10 → 8; `clockLink` gone; `modArm` + `modCadence` → the kit's record
  `lambdawaves.q0.modulation` (bind.js `localStore`), read once from an old blob.
- `lab/audio.js` → the kit's `audio-capture.js`; lab.css badge ladder (432–446 on 7044f37) leaves.
- `s3`: a reload boots the shipped rack, so WAVE DANCER's `s3` is gone and its mode is pruned (the window's law). Verify.
- `mir-controls`: MIR 1.5's ONE KNOB LAW (vertical, ⅛). Re-aim.

## Exact next step
The one clock + LINKED retired (rack.js setModArm/appPlay/clockLink/ui.setClockLink/LW.mod.clockLink, native-ui tiles), with
take-in-bugs, new-project.browser-test and history's SEPARATE scene edited in the same commit (the `__LW` law).
