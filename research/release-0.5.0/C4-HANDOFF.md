# C4 HANDOFF — the modulation window and the one clock (live state; superseded by C4-BUILD.md at the end)

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a96a66756bee373da`, branch
`worktree-agent-a96a66756bee373da` (the continuation; reset to the predecessor's tip `aa9cd40`). Never pushed, merged or tagged.
The predecessor's worktree `agent-ac5f1a2ff05f502de` is read-only history. Gate server 8833 (started in the background by this
builder), geckodriver 5303; suites one at a time, 4 s apart.

## Commits
- `b7ad98b` the bare adopt of MIR 1.5 alpha.24 (identical to C0's).
- `7514000`, `de11b12`, `aa9cd40` hand-offs (the predecessor's).
- `14f0fac` wave 201: the kit's window, `createModulation` (lab/mir/modulation/window.js) over A5's port. `lab/modwindow.js`
  no longer imported (still on disk). Port: no `targets` (the kit reads it as the routable SELECTOR — A5's `host.targets` object
  made every `closest()` throw), `dock: false`, `closed` reports nothing (the kit's close reports `moved(null)`). `modDodge` takes
  null and ignores a closed window (the kit's `place()` reports a real box while closed). Occlusion hears the window's `hidden`
  flips and `onGeometry`. `tests/lfo-tension` waits for the window's animations (`__still`: the kit's entrance + device glide).
  GREEN on 14f0fac: routed-knob 4/4, take-in-bugs 4/4, lfo-tension 3/3, history 39/39, new-project 8/8, frame-occlusion 7/7.
- `be03a83` (titled WIP; its browser closers are now run, see step 1): the one clock, LINKED/SEPARATE retired.
  `appPlay.onChange((on) => mod.follow(on))`; power = `setModulationEnabled`; `clockLink` gone everywhere in lab/; `LW.mod.play/stop`
  = THE play/pause; tempo tiles 10 → 8. Tests edited in the same commit: take-in-bugs (5th scene "MOD power off"), new-project §4,
  history's ONE CLOCK scene.
- **Step 1 DONE** (this hand-off's commit, no code change): on be03a83, take-in-bugs **4/4** (its §1 now five scenes, all
  0 refusals), new-project **8/8**, history **39/39**, routed-knob **4/4**. Nothing red; nothing to fix.
- `lab/*.js`: 36,288 (base) → 36,469 (adopt) → 36,478 (14f0fac) → 36,464 (be03a83).

## Node reds (C0's, not fixed): mir-manifest (alpha.24 not ACCEPTED); new-project --check OUT OF STEP (bpm 60 → 30); wiring
(allowlist `lab/mir/shell/wordmark.js` is reached via `window/workspaces.js`; R5-W1); pwa (absolute URL in lab/mir/shell/gui.js).

## Remaining steps (in order)
2. Scopes: `modArm` + `modCadence` leave the settings blob for the kit's record `lambdawaves.q0.modulation` (bind.js `localStore`;
   read once from an old blob; saveSettings stops writing them); STATE-SCOPES rewritten (row :40, a record row, `clockLink`
   retired); settings-store FAMILIES row; new-project.test.mjs PREF set comment; `node tools/new-project.mjs` regenerate +
   `--check`; first-run, new-project 8, settings-probe.
3. Deletions: `lab/modwindow.js` (3,110); `lab/audio.js` (438) → mod-port imports `./mir/modulation/audio-capture.js` (VERIFY the
   exports first), `tests/audio.test.mjs` re-aimed; lab.css badge ladder (`:root:root:root:root` block and `.k-route-x`);
   rack.js comment at "THERE IS NO MODULATION CARD". `pwa --write`; node gate; step 1's suites again; line count.
4. SKIPPED by the integrator's order: `tests/mir-controls` belongs to C0's continuation (one line in C4-BUILD.md).
5. `s3`: settings-probe — a reload boots the shipped rack (no reopen-last-project at boot), so WAVE DANCER's `s3` is pruned.
6. C4-BUILD.md (A7-BUILD shape) + REPORT.md `### wave 201` under `## 2026-10-08 · 0.5.0 C — THE ADOPTION` (create at END).

## Open items found so far
- skin.css:349 `.tempo-grid` is 5 columns; 8 tiles want `repeat(4, …)` (C0's file).
- lab.css arming/pop-over/`.mod-mchip` rules (~671–726) duplicate modhost.css; `.mod-pop` carries backdrop-filter (C0's class).
- The kit window is not in `registerWindow`'s stack and does not dock (`dock: false`) until C3's rack span exists.
- `tests/legacy/` reads `__LW.mod.clockLink` (outside the gate; superseded laws).
- The kit's place() measures layout while closed (boot cost; C-V's ms/s).
- take-in-bugs' WAVE DANCER scene reads t 0.00 → 64.18 (the project's own clock after open; green, noted only).

## Exact next step
Step 2 (scopes).
