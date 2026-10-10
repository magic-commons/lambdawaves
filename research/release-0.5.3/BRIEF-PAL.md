# BRIEF B-PAL · M12 PALETTE, SHORTER (0.5.3 "Rack Tune"; Sonnet @ high builder; W3, beside B-DISP — `skin.css` hunk-disjoint: yours :20/:325/:380, B-DISP's :443)

**Read first, whole:** `research/release-0.5.3/PLAN.md` (§0 fact 10, row M12, §2 gates, §7 R6 R12, §11 answer 5), `AUDIT-OPUS-1.md` Part A row M12 and Part B §2
(the dead-CSS correction: `lab.css:478` `.pal-color` is LIVE), `localise/PALETTE-AB-TRANSPORT.md` §1, `lab/windows/material.js:85-115` (the PALETTE rows: the tick text
:99, INVERT :108-110, the ARG ψ field's label), `lab/mir/panels/ramp.js:100-160` (READ ONLY: `verbs`, the stepper :122, `set` callback, `.mir-ramp-ticks`, `.mir-ramp-at`),
`lab/mir/glyph.js:318` (`invertColors`, READ ONLY), `lab/skin.css:20,325,380-381`, `lab/lab.css:470-480`, `tests/menubar.browser-test.mjs:166`,
`tests/history.browser-test.mjs:169-170`, `tests/legacy/boot.browser-test.mjs:2738,4162-4165`, `tests/official-defaults-palette.browser-test.mjs`, `tools/settings-probe.mjs`,
`CLAUDE.md` (Palettes are MIR's), `docs/NOTES-FOR-AGENTS.md` (the rig law).

## Josh's words (`ASK.md`, verbatim)
> Palette  Window: Invert button should be an icon like a half colored circle and can fit to the right of rotate. Delete the 'arg psi' view thing and just let it be a
> reader under rotate to replace the 'turn' text. move reset to be in the same row as palette on. Remove the −π…π labels and let the angle be a floating text …
> (the rest in `ASK.md`)

## The row (+15), λWAVES-side only
INVERT → `glyph: 'invertColors'`, re-seated into the ramp's verbs row RIGHT OF ROTATE (the `rInv` row goes); RESET re-seated into the PALETTE-ON row; `ticks: []` + CSS
collapsing `.mir-ramp-ticks:empty`; **the selected stop's arg shown TWICE from ONE function** — a `readout` seated under ROTATE (one CSS rule hides the knob's own
"turn" text) and a small floating text over the selected stop, driven by the `ramp.set` callback (R6: radians, degrees on hover); the ARG ψ number field hidden by CSS
(`.mir-ramp-at`); **the preset stepper is NOT restyled** — Josh made it the reference look (answer 5; B-DISP copies it); the FIVE dead selectors out (`skin.css:325`,
`:380-381`, `.pal-ring` in `skin.css:20`'s list, `lab.css:475-477` `.pal-wrap` `.pal-strip` `.pal-ring`) — `lab.css:478` `.pal-color` STAYS (SETTINGS' colour well). MIR
briefs FILED, not built, in `research/release-0.5.3/MIR-BRIEF-palette.md`: a `verbs` extras slot, a reset seat option, `labels.rotate(rad)` for the knob's "turn",
`labels.float`, `stepper({ pager: true })` via `ramp.js:122`. Josh sees: PALETTE two rows shorter, the half-disk INVERT, the reader under ROTATE, the floating angle (PNG pair).

## Laws
Never edit `lab/mir/**`. Subtract, don't add. `node tests/pwa.test.mjs --write` after ANY `lab/` edit (CSS included). JS budget **+15**; stop at +23. No field code,
no key → no lock, serialize-bytes untouched. Servers: `python3 tools/gate/server.py <your worktree> 8993`, `LW_PORT=8993 GD_PORT=5463`; `rigfree.mjs` before each
browser suite; one suite at a time, 4 s apart (B-DISP shares the GPU); stop your server by pid. Scripts under `.tmp/`; `rack-deps.mjs` only `--classes --no-write`.
One commit; NO push.

## Closers
`tests/menubar.browser-test.mjs` (:166); `tests/history.browser-test.mjs` (:169-170 — its selectors kept); `tests/legacy/boot.browser-test.mjs` rows :2738 and :4162-4165
re-aimed (run those rows alone via the suite's `@spec` if it has one, else the suite once); `tests/official-defaults-palette.browser-test.mjs`; `node tools/settings-probe.mjs
--out` 0/6; `node tools/stylehash.mjs` before/after; `bash test.sh node`.

## Deliverables
`research/release-0.5.3/PAL-BUILD.md`: §1 each re-seat with file:line; §2 the one-function/two-seats reader; §3 the dead rules with grep proof; §4 the MIR briefs filed;
§5 PNG pair `eye/pal-*.png`; §6 lines; §7 what you could not measure. Commit it. Hand back ≤ 250 words (worktree, branch, tip, commits, suites + results, blockers,
next step); the same to `~/.claude/handoffs/agents/<your id>.md` if allowed.
