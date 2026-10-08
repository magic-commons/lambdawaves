# A5-A6 HANDOFF (0.5.0 stage A, seams A5 + A6) — paused at a safe boundary (usage alarm, 2026-10-08)

Worktree: /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ac7efdcc9d1fca69a
Branch: worktree-agent-ac7efdcc9d1fca69a (base 12451d2, the sos-s0 tip). Never pushed, merged or tagged.
Tree: clean at f9b47dd. Gate server was on 8765 (pid 2594559, stopped by pid at pause); GD_PORT 5235.

## The facts (for whoever resumes)
- Commits: `f9b47dd` 0.5.0 A5 · wave 188: THE MODULATION PORT — lab/mod-port.js is the object createModulation(port) takes
  (on base `12451d2`); this hand-off is the second commit. Seam in progress: A6, not started in code.
- The clock facade does NOTHING yet: no `onePlay`, the `app.play` demand is NOT held, LINKED / SEPARATE are NOT retired
  (`clockLink`, `modArm`, `modCadence` are still PREFERENCE; the S0 follow/retry block in loop() is still there).
- Tests run (all on the A5 tree, 8765/5235, one at a time, none needed a re-run alone): `bash test.sh node` exit 0 (85 suites);
  `mir-controls` 2 PASS, `lfo-tension` 3 PASS, `routed-knob` 4/4, `history` 39 PASS — twice (the first A5 cut, then the lean one
  that left loop(), the settings pair, restore and the LW literal untouched after the integrator's sharing map).
- Blockers: none. (The shell guard refuses `for` loops; `.tmp/gate.sh` runs suites in sequence instead.)
- `cat lab/*.js | wc -l`: 36 280 before → 36 237 now.
- Open items: A6 entirely; REPORT wave 189 and `research/release-0.5.0/A5-A6-BUILD.md` come with A6. `tests/legacy/` (not in the
  gate) reads `clockLink` 12 times and is left alone.

## Done — A5 (commit f9b47dd, wave 188 in REPORT.md under the new "## 2026-10-08 · 0.5.0 A — THE SEAMS" heading)
- lab/mod-port.js (119 lines): createModPort({ available, present, view, onCapture, save }) → setKnob, hand, syncBases (+ `syncing`),
  feedAudio, cadence {hz, step} + setCadence, knobs/gets/held maps, install(defs, roots) (createModHost + stamps + setBase +
  .mod-held), stamp, port({ moved, rateControl, persist, note, device, armed, arm, opened }) → the createModulation port
  (M, registry, targets, clock, apply, knobOf, persist, cadence, setCadence, armed, arm, audio{state,support,start,stop,sync,devices},
  rateControl, moved, opened, closed — the kit 1.5 window.js port, key for key).
- lab/rack.js: one alias line after `const mod = createModPort(...)` (setKnob, modHand, modSyncBases, feedAudio, MOD, modKnobs,
  modGets, modHeld); `audioCap` handed back by onCapture; schedule() reads mod.syncing; loop(), settings pair, restore, LW literal
  untouched (integrator's sharing map). audioDevice settings write kept in its form inside the port call.
- tests/access.test.mjs A8 reads the setBase wire in lab/mod-port.js.
- lab/*.js 36 280 → 36 237. Gates: bash test.sh node exit 0 (85 suites); browser 8765/5235: mir-controls 2, lfo-tension 3,
  routed-knob 4/4, history 39 PASS.

## Not done — A6 (the one-clock facade), the plan as designed (respect the integrator's site map)
1. lab/clock.js: Clock gains `onEdge` (null) called on a real play edge (play when !playing) and pause edge (pause when playing);
   export `onePlay(clock)` → { play, pause, toggle, isPlaying, seek (scrub), onChange(f) → unsubscribe } setting clock.onEdge.
   Every road (button, Space, LW.play, A/B, bow, slap, restore, capture.js/render-exact LW.clock.pause) then becomes an edge.
2. lab/mod-port.js: add `follow(on)`: on → host.clock.demand('app.play', true) then play(w); off → pause(w) then demand(false);
   view().sync(). (MIR 1.4.3 host.js:474 has demand.) Port: clock = { ...host.clock, toggle: THE play's toggle returning
   { ok: true, playing } } so the window's ▶ is THE play; opened → setPresentationActive(true) + present() (no link reset);
   drop `save` from setCadence (cadence leaves PREFERENCE).
3. lab/rack.js (sites: :550–551, :912–921 delete the LINKED follow/retry block only, :2759 opened, :3064–3103 playMod/
   togglePlay/setModArm, :4736 A9's row — change only the handler it points to + a one-line seam comment, keep the id and
   ideally keep `setModArm(!modArm)` by keeping setModArm as POWER = setEnabled + lamp, no save, no clock play;
   :5413–5414 remove LW.mod clockLink; :5697 remove ui.clockLink/setClockLink; saveSettings :199 drop modCadence/modArm/clockLink;
   applySettings :296–298 → read once when !settingsLoaded (modCadence 120, modArm false) and drop; clockLink ignored).
   `const appPlay = onePlay(clock)` after `new Clock()`; `appPlay.onChange((on) => mod.follow(on))`; togglePlay = appPlay.toggle()
   + schedule(EVOLVE); after install `if (clock.playing) mod.follow(true)`. restore() :5079–5082: replace modWas/linkFollowed lines
   with one `if (hist && pr.modulation !== undefined && clock.playing) mod.follow(true)`. LW.mod.play/stop → THE play/pause (edit
   bodies in place, add nothing mid-literal). capExportFrames `driven = modArm` stays valid if modArm stays the power flag.
4. lab/native-ui.js: delete the LINKED trig and the SEPARATE-only MOD ▶ trig (tempo panel clock grid, 10 → 8 tiles; there is no
   LINKED row in SETTINGS itself), their syncNow/sig bits, and the `arm` param; reworkNative call drops `arm:setModArm`.
5. Tests: take-in-bugs §1 rewritten to four scenes (integrator): app play from fresh boot and after NEW, editor closed, no sources,
   no routes SUCCEEDS, no nothing-to-run, app time advances; pause releases the demand; a routed source (WAVE DANCER) follows the
   one clock; a bare host play with no demand still refuses with its own reason (__LW.mod.clock.play() with editor closed, paused).
   history: SEPARATE scene (:309–328) → one-clock scene via LW.mod.play (keep 39 PASS); drop __LW.mod.clockLink uses.
   new-project.browser-test scene 4: drop `link`. new-project.test.mjs PREF set: drop modCadence, modArm, clockLink.
6. docs/STATE-SCOPES.md row: the three keys leave PREFERENCE (session state; old values read once, dropped; old clockLink:false =
   SEPARATE becomes the one clock). CLAUDE.md: no LINKED law found in it; add one sentence only if a law changes.
7. Gates: pwa --write; bash test.sh node; browser one at a time (bash .tmp/gate.sh TAG suite...): history, take-in-bugs,
   mir-controls, routed-knob, lfo-tension, new-project, first-run, offer; render-exact is in node. `current` is NOT a closer
   (red on the untouched base under load, valuesReveal). Then REPORT wave 189, research/release-0.5.0/A5-A6-BUILD.md.

## Exact next step
Implement A6 step 1 (lab/clock.js onEdge + onePlay), then steps 2–4, then node gates; tools: .tmp/edit.py (exact-text steps),
.tmp/gate.sh (browser runner). Start the server: python3 tools/gate/server.py <worktree> 8765 (background), kill it by pid.
