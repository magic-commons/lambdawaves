# BRIEF B-TR · M13a THE 3×3 SWITCH + M13b THE DOCKED BAR, RESTYLED (0.5.3 "Rack Tune"; Sonnet @ high builder; W2, beside B-CAM — `shell/modulation.js` hunk-disjoint: yours :162-215, B-CAM's :45,47; you merge SECOND, rebase on B-CAM's merge first)

**Read first, whole:** `research/release-0.5.3/PLAN.md` (§0 fact 12, rows M13a M13b, §2 gates, §7 R5 R11, §11: "4: restyle now"), `AUDIT-OPUS-1.md` Part A rows
M13a/M13b and Part B §8 risk 1, `localise/PALETTE-AB-TRANSPORT.md` §3, `lab/mod-port.js:130-150` (:141 the destructure that DROPS `switchWorkspace`),
`lab/shell/modulation.js:160-220` (:210 the port's supply), `lab/mir/window/workspaces.js:82-89` and `lab/mir/modulation/window.js:722-724` (READ ONLY: how the kit
mounts the 3×3 switch when the port has `switchWorkspace`), `lab/mir/timeline/window.js:50-52,84-87` (READ ONLY), `lab/shell/transport.js`, `lab/native-ui.js:80-188`
(the docked transport's DOM), `lab/skin.css:333-367` (legacy transport rules) and `:417-481` (the docked grid), the kit's own bar CSS for the idiom (`lab/mir/css/*.css`,
READ ONLY; `lab/mir/shell/transport.js:540` `LAMBDAWAVES_LAYOUT` and `placementOf` :69 — read for 0.5.5's FIT fact, do NOT adopt), `tests/timeline.browser-test.mjs`
T1–T5, `tests/menubar.browser-test.mjs:179`, `tests/history.browser-test.mjs:386`, `tools/stylehash.mjs`, `CLAUDE.md` (MIR owns generic instrument behaviour),
`docs/NOTES-FOR-AGENTS.md` (the rig law).

## The rows, as audited and as Josh answered
**M13a (+3).** `mod-port.js:141` passes `switchWorkspace` through; `shell/modulation.js:210` supplies `() => { modView.close(); tl.open(); }` — the kit's `show('lower')`
WITHOUT the lego stack (`createWorkspaces` is struck, R11: it re-seats both windows and moves `modDodge` and T1–T5 ground). Wiring only, no brief. Josh sees: BASINS'
3×3 MIR logo on the modulation window; pressing it opens the TIMELINE (PNG pair).
**M13b (0 JS).** Josh: "restyle now". λWAVES' docked grid (`skin.css:417-481`) is restyled IN CSS ONLY to the kit's work-bar idiom — the kit's raised/inset skin, its
spacing, type and button heights (read the kit's bar CSS and match it, do not import it); the legacy rules `:333-367` SUBTRACTED where dead (prove each dead by grep of
its selectors in `lab/*.js`, `lab/shell/*.js`, `lab/windows/*.js`, `lab/index.html`). No JS. The kit's `createTransport` adoption AND the dock-into-timeline cycle go to
0.5.5 together (R5); write the half-hour FIT fact into your BUILD §3 as 0.5.5's first fact (does `LAMBDAWAVES_LAYOUT` seat play, power, home, ‹ ›, scrub, jump, t,
REPEATS + formula, RATE, the BPM chip and tempo drawer, dock, mod-logo, T and Space? — by READING, not by building). Never a λWAVES shim. Josh sees: the docked
transport in the kit's idiom (PNG pair, docked at the foot and at the top).

## Laws
Never edit `lab/mir/**`. Subtract, don't add. `node tests/pwa.test.mjs --write` after ANY `lab/` edit (CSS included: sw.js hashes it). JS budget **+3**; stop at +6.
No field code → no lock. Serialize-bytes untouched (no key). Servers: `python3 tools/gate/server.py <your worktree> 8973`, `LW_PORT=8973 GD_PORT=5443`;
`node research/release-0.5.2/r2b-measure/rigfree.mjs` before each browser suite; one suite at a time, 4 s apart (B-CAM shares the GPU); stop your server by pid.
Scripts under `.tmp/`; `rack-deps.mjs` only `--classes --no-write`. One commit per row; NO push.

## Closers
`tests/timeline.browser-test.mjs` T1–T5; `tests/menubar.browser-test.mjs` (:179 the cycle still skips a closed timeline — unchanged this release); `tests/history.browser-test.mjs:386`;
`node tests/frame-occlusion.browser-test.mjs` 7/7; `tests/film-handover.browser-test.mjs`; `tests/stage-text.browser-test.mjs` (the formula still avoids the docked bar);
`tests/current.browser-test.mjs`; `node tools/stylehash.mjs` before/after (the docked bar's computed styles are the ONLY change); `tests/keyboard-shortcuts.test.mjs`; `bash test.sh node`.

## Deliverables
`research/release-0.5.3/TR-BUILD.md`: §1 the switch (file:line, the case); §2 the restyle (each rule changed, each legacy rule subtracted with its grep proof, the
stylehash diff); §3 the FIT fact for 0.5.5; §4 what Josh sees (PNG pairs `eye/tr-*.png`); §5 lines; §6 what you could not measure. Commit it. Hand back ≤ 300
words (worktree, branch, tip, commits, suites + results, blockers, next step); the same to `~/.claude/handoffs/agents/<your id>.md` if allowed.
