# BRIEF B-STAGE · M4 THE LIVE STAGE (0.5.3 "Rack Tune"; Opus builder; W1, beside B-MOL — file-disjoint)

**Read first, whole:** `research/release-0.5.3/PLAN.md` (§0 fact 5, the M4 row, §2 gates, §3, §11 Josh's answers), `AUDIT-OPUS-1.md` Part B §8 risk 3,
`localise/CAMERA-STAGE.md` §1 (the five causes A–E with file:line), `lab/stage-gestures.js` whole, `lab/shell/rack-wiring.js:280-320`, `lab/mir/shell/scene-guard.js`
(READ ONLY — never edit `lab/mir/**`), `lab/occlusion.js` (the shader mask — your filter never goes there), `tests/stage-gestures.test.mjs`, `tools/hit-probe-set.mjs`
(the one gap-press gate; your probe is its sibling), `CLAUDE.md` (the laws), `docs/NOTES-FOR-AGENTS.md` (the rig law: `node research/release-0.5.2/r2b-measure/rigfree.mjs`
before any browser suite; one browser suite at a time on the shared GPU, 4 s apart; never `pkill -f`).

## Josh's facts (§11, verbatim): "linux and just clicking around, but MIR racks are fine."
So: a Linux desktop, a mouse, no chord; the rack still answers → the STAGE alone is dead. Live candidates: **A** (the scene guard's rects: `rectOf` ignores opacity /
visibility / `pointer-events`; the union of the modulation window with its bars — kit-side) and **B** (a held `special`/`points` after a lost pointerup: `:67`'s
`special ||` refuses EVERY later press). **D** (unpainted) is ruled out by his words; **C** is rare; **E** is constant.

## What you build (the M4 row, as audited)
(a) **`tools/stage-dead-probe.mjs`** (diagnostics live in `tools/`): a grid over `#stage` in 10 scenes (first run; SETTINGS open; the modulation window open with
its bars; MOLECULES on; the keyboard editor open; a dialog; `ui-hidden`; after a drag; the transport docked; the rack folded); at every point where
`guard.hit` is true, assert the point lies on a VISIBLE interactive element (`elementFromPoint` is interactive and has opacity > 0, visibility visible,
pointer-events not none); print the dead points per scene. Its reading BEFORE any fix is §1 of your BUILD.
(b) **The stuck-pointer heal, on a NEW `pointerdown` only** (never on a move): a held `special`/`points` of the SAME id is finished first; a held one whose capture is
gone (`!canvas.hasPointerCapture(id)`) is finished as CANCELLED whatever its id (a new touch has a new id); `pointerMove` finishes a mouse drag whose
`buttons === 0`. Guard (the audit's risk 3): `hasPointerCapture` is briefly false after a synthetic pointer and on some WebKit touches — heal only on a new press;
the existing interruptions `tests/stage-gestures.test.mjs:47-55` stay green.
(c) **The app-side rect filter** in the `extra` callback at `rack-wiring.js:304`: skip opacity 0 / `visibility:hidden` / `pointer-events:none` elements. NEVER in
`occlusion.js` `paintedRect`. The bar union is inside the kit (`scene-guard.js:153-154`) → write a MIR brief `research/release-0.5.3/MIR-BRIEF-scene-guard.md`
(what `rectOf` should test; the union per bar), do not build it.
(d) The two fixed dead boxes (the 88 px `.corner-axis-hit`, the `#rackPeek*` strips) measured by the probe; if the corner-axis hit is dead under `ui-hidden`, hide
it with `ui-hidden` (CSS). Say what you found.

## Laws
Never edit `lab/mir/**` or `lab/fonts/**`. Subtract, don't add. After ANY `lab/` edit: `node tests/pwa.test.mjs --write`. Your JS delta budget: **+10** (`tools/`
uncounted); stop and report at +15. No field code → no lock run. Servers: `python3 tools/gate/server.py <your worktree> 8943` and `LW_PORT=8943 GD_PORT=5413`
for the browser suites; `rigfree.mjs` first; stop your server by pid when done. No compound shell chains for agents: put sequences in a script under `.tmp/`.
`node tools/rack-deps.mjs` only with `--classes --no-write`. One commit per fix, messages in plain words; NO push.

## Closers (all green before you hand back)
`node tests/stage-gestures.test.mjs` (+ a lost-pointerup case; + a lost touch then a NEW id; `:47-55` kept); the probe 10/10 scenes with the dead points listed
before/after; `tests/hit-probe-set` if the MIR 1.5 tools are present (say so if not); `node tests/frame-occlusion.browser-test.mjs` 7/7; `tests/opener.browser-test.mjs`
alone on a quiet GPU; `bash test.sh node`.

## Deliverables
`research/release-0.5.3/STAGE-BUILD.md`: §1 the probe's reading before; §2 each fix with file:line and the case that pins it; §3 the probe after; §4 what Josh will
see (a before/after PNG pair under `research/release-0.5.3/eye/stage-*.png`); §5 the MIR brief filed; §6 lines (before/after counts of `cat lab/*.js lab/shell/*.js
lab/windows/*.js | wc -l`); §7 what you could not measure. Commit it. Hand back ≤ 300 words: worktree path, branch, tip sha, commits, suites run with results,
blockers, the exact next step. Write the same to `~/.claude/handoffs/agents/<your id>.md` if your sandbox allows; else say so.
