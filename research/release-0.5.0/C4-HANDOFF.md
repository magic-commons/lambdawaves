# C4 HANDOFF — the modulation window and the one clock (live state; superseded by C4-BUILD.md at the end)

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ac5f1a2ff05f502de`, branch
`worktree-agent-ac5f1a2ff05f502de`, reset to `7044f37` (sos-s0 tip). Never pushed, merged or tagged.
PAUSED by Agent Control (usage) after `be03a83`. No server running (8833 stopped by pid 3640553); no browser open.
Start again with `python3 tools/gate/server.py <worktree> 8833` (background) and `LW_PORT=8833 GD_PORT=5303` per suite, 4 s apart.

## Commits
- `b7ad98b` the bare adopt of MIR 1.5 alpha.24 (identical to C0's).
- `7514000`, `de11b12` hand-offs.
- `14f0fac` wave 201: the kit's window, `createModulation` (lab/mir/modulation/window.js) over A5's port. `lab/modwindow.js`
  no longer imported (still on disk). Port: no `targets` (the kit reads it as the routable SELECTOR — A5's `host.targets` object
  made every `closest()` throw), `dock: false`, `closed` reports nothing (the kit's close reports `moved(null)`). `modDodge` takes
  null and ignores a closed window (the kit's `place()` reports a real box while closed). Occlusion hears the window's `hidden`
  flips and `onGeometry`. `tests/lfo-tension` waits for the window's animations (`__still`: the kit's entrance + device glide).
  GREEN on 14f0fac: routed-knob 4/4, take-in-bugs 4/4, lfo-tension 3/3, history 39/39, new-project 8/8, frame-occlusion 7/7.
- `be03a83` **WIP**: the one clock, LINKED/SEPARATE retired. `appPlay.onChange((on) => mod.follow(on))`; power =
  `setModulationEnabled`; `clockLink` gone everywhere in lab/ (rack.js, native-ui.js); `LW.mod.play/stop` = THE play/pause;
  tempo tiles 10 → 8. Tests edited in the same commit: take-in-bugs (no `link`; 5th scene "MOD power off"), new-project.browser
  §4, history's SEPARATE scene → THE ONE CLOCK scene. Node 85: C0's 4 reds only. **Browser closers NOT yet run on be03a83.**
- `lab/*.js`: 36,288 (base) → 36,469 (adopt) → 36,478 (14f0fac) → 36,464 (be03a83).

## Node reds (C0's, not fixed): mir-manifest (alpha.24 not ACCEPTED); new-project --check OUT OF STEP (bpm 60 → 30); wiring
(first line now: allowlist `lab/mir/shell/wordmark.js` is reached via `window/workspaces.js` — the kit window reaches more kit
files; R5-W1); pwa (absolute URL in lab/mir/shell/gui.js).

## Remaining steps (in order)
1. Run on be03a83: take-in-bugs, new-project 8, history 39, routed-knob 4. Fix, then commit (drop the WIP word in the next msg).
2. Scopes: `modArm` + `modCadence` leave the settings blob for the kit's record `lambdawaves.q0.modulation` (bind.js `localStore`;
   read once from an old blob; saveSettings stops writing them); STATE-SCOPES rewritten (row :40, a record row, `clockLink`
   retired); settings-store FAMILIES row; new-project.test.mjs PREF set comment; `node tools/new-project.mjs` regenerate +
   `--check` (bpm 30, same bytes as C0's); first-run, new-project 8, settings-probe.
3. Deletions: `lab/modwindow.js` (3,110); `lab/audio.js` (438) → mod-port imports `./mir/modulation/audio-capture.js` (same
   exports), `tests/audio.test.mjs` import re-aimed; lab.css badge ladder (lines 432–446 on 7044f37: the `:root:root:root:root`
   block and `.k-route-x`; modhost.css 2362–2371 carries it); rack.js comment at "THERE IS NO MODULATION CARD" names modwindow.js.
4. `tests/mir-controls`: re-aim to MIR 1.5's ONE KNOB LAW (vertical drag, ⅛ fine; read `setKnobLaw()`); its own commit.
5. `s3`: verify with `tools/settings-probe.mjs` that a reload boots the shipped rack (s1 LFO, s2 AUDIO; no reopen-last-project,
   rack.js comment near "there is no reopen-last-project at boot"), so WAVE DANCER's `s3` mode is pruned by the window's law.
6. C4-BUILD.md (A7-BUILD shape) + REPORT.md `### wave 201` under `## 2026-10-08 · 0.5.0 C — THE ADOPTION` (create at END).

## Open items found so far
- skin.css:349 `.tempo-grid` is 5 columns; 8 tiles want `repeat(4, …)` (C0's file).
- lab.css arming/pop-over/`.mod-mchip` rules (~671–726) duplicate modhost.css; `.mod-pop` carries backdrop-filter (C0's class).
- The kit window is not in `registerWindow`'s stack and does not dock (`dock: false`) until C3's rack span exists.
- `tests/legacy/` reads `__LW.mod.clockLink` (outside the gate; superseded laws).
- The kit's place() measures layout while closed (boot cost; C-V's ms/s).
