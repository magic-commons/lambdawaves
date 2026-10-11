# TR-BUILD · M13a THE 3×3 SWITCH + M13b THE DOCKED BAR, RESTYLED (0.5.3 "Rack Tune")

Worktree `~/Documents/LAMBDAWAVES/.claude/worktrees/agent-a0cfebb512d358557`, branch `worktree-agent-a0cfebb512d358557`, from 3d41ac0.
Commits: `5081aa1` M13a · `015264c` M13b · (this file's commit on top). No push.

**STATE: M13a DONE and checked. M13b DONE (CSS) and mostly checked; four closers and one re-measure NOT run (usage pause) — see §6 and the next step.**

## §1 The switch (M13a, +2 JS lines: 27,951 → 27,953)
- `lab/mod-port.js:141` the destructure now takes `switchWorkspace` and the returned port carries it (it was dropped there).
- `lab/shell/modulation.js` (the port's last line, was :210): `switchWorkspace: () => { app.state.modView.close(); app.state.tl.open(); }` — `tl` is `app.state.tl` (made later, in `shell/keys.js:155`), read at press time. The kit's `window.js:722-724` then mounts `workspaceSwitch` after the picker arrows. The button alone: no `createWorkspaces` (R11).
- Measured (`.tmp/m13a.mjs`, headless Chromium, no WebGPU): the 44×34 `.m2-workspace-switch` is on the window's foot; one click → modulation window closed, `__LW.timeline.isOpen()` true; the pill moves to the top (dodge). PNGs `eye/tr-switch-before.png`, `eye/tr-switch-after.png`.

## §2 The restyle (M13b, CSS only, `lab/skin.css`)
Idiom read from `lab/mir/shell/transport.css` (seats, IN A WORK BAR, DOCKED), not imported.
Changed (docked bar only, `#transport.docked …`):
- seats `.tbtn` (not home, not the BPM pill): `border:0; background:transparent; box-shadow:none; color:var(--ink-key)`, radius 8, hover wash — flat until hovered.
- play: ink `--fg-soft`, glyph 22 px, lights `--acc` (was the filled accent button with glow). MOD `.on`: ink `--acc2`, no face.
- `.transport-home, .dock-btn, .mod-exp`: hairline + radius 8 + `hsl(var(--glass-tint)/1)` face + `var(--relief-raise, var(--neu-raise))` (were round/transparent or well).
- BPM pill `.tempo-expand`: raised (was `--neu-inset` well); number 16 px, unit/Hz 8 px.
- scrub: the mini bar's six `.fd` rules now answer `#transport:is(.mini, .docked)` (widened selectors, nothing added) = the thin line; docked-only `.fd::before` line colour `color-mix(--fg 16%)` (the bar's white .14 is invisible on light); `.fd` keeps `height:44px`.
- readouts `.ro`: `background:transparent; box-shadow:none` (were wells).
- Held: every grid cell, every height, `gap:5px` (a 6 px gap moved the card +3 px and the whole rack below it; reverted) — the docked rect is unchanged.
Subtracted, each with its proof:
1. `.tempo-empty` first rule (`skin.css:363`): every declaration repeated by the next rule (same selector, later, adds `grid-column`). Class itself is live (`native-ui.js:132`), so one rule stays.
2. `#transport.docked .native-play-row > .dock-btn { order:-1 }` (:561): every docked part has an explicit `grid-area` (rules :474-481); `order` moves only auto-placed items. stylehash shows `order: -1 → 0` and no box change.
3. `.fd {grid-column:1/5}`, `.ro {span 2}`, `.ro.period {span 3}`, `.tempo-expand {grid-column:span 2}` and the second `grid-template-columns:repeat(5…)` rule: duplicated by the `grid-area` rules / merged. stylehash: no `#box` change on any of those elements.
4. `#transport .native-tempo .trig { min-height:44px }` (the first `.trig` rule already says it).
Not dead (kept, proved live by `.tmp/deadrules.mjs`: selector match counts over pill, pill+tempo, docked, docked+tempo; and grep): all of `:333-367` else — `tempo-pane/rail/tile/grid/info/expand/number` are built in `native-ui.js:89-176`; `m2*` classes come from the kit's `buildMacroSlot`; `.m2reorder`/`.m2zero`/`.drag` are gesture-state classes (no match at rest, live in use). Honest count: 1 dead rule in `:333-367`.
Outside my scope, noted: `skin.css:445 .camera-motion` matches nothing and no `lab/*.js` sets it (camera's, B-CAM / integrator).
stylehash (MIR `tools/stylehash.mjs`, via a `CHROMIUM` wrapper adding `--no-sandbox --ignore-certificate-errors`; states dark-tinted-off, light-refractive-off; noise = a second before-capture): **pill (floating bar) neutral — 0 element, 0 pixel**; docked and docked+tempo: 17 changed elements per state, all inside `#transport.docked` (+ 1 `.fd-lbl` no longer shown), no `#box` change outside the scrub's fill/edge, 0 pixels beyond noise outside the banner. That capture preceded the final `.fd::before` line (one property, docked only); not re-captured.

## §3 FIT fact for 0.5.5 (by reading `lab/mir/shell/transport.js`, not building)
`LAMBDAWAVES_LAYOUT` (:540) = group `native-play-row` [play, power, rewind, `app:back`, `app:forward`, `app:scrub`, `app:jump`, `app:time`, `app:period`, `app:rate`, tempo] then panel, openers, seat, dock, door. `placementOf({docked, host})` (:69) = rack if docked, else work lane if a `host` is mounted, else stage.
- FITS: play; power (a ring glyph replaces λWAVES' MOD word — a look change); home (`rewind`); ‹ › scrub jump `t` REPEATS RATE (as `nodes` the app passes: `back forward scrub jump time period rate`); BPM chip + tempo drawer (kit pill with typing field, macro rail, TAP/WALL/cadence/÷2 ×2 ×4/HOLD ¼, HOLD 1 — cadence only if `mod.cadence/setCadence`, which λWAVES has); dock chip (`data-key-action='dock'`, matches the app's `dock` row on T, `shell/keys.js:89`); mod-logo (`door:'mark'`, and `onSwitch` in a work bar).
- DOES NOT FIT as the constant stands: (a) the REPEATS **formula** `.fx` (`shell/transport.js:43`, the two derivation lines) has no `app:` name in `LAMBDAWAVES_LAYOUT`; an app-made unnamed layout is drawn as BASINS', not λWAVES' — so it needs a one-line kit change (MIR brief: add `'app:formula'`) or the formula moves elsewhere; (b) the repeat-mathematics info button (`native-ui.js` `infoPanel`) and `.tempo-info` corner seat; (c) SPACE: the kit's `transportActions` registers `transport.play` on Space — λWAVES' own row has the same id (`shell/keys.js:42`), so install one, not both; (d) the timeline is installed with `transport:false` (R9, `shell/keys.js:155`) — the dock-into-timeline cycle needs that flipped and `tests/menubar.browser-test.mjs:179` re-read.
- Verdict: ~90 % fits; the formula (a) is the one blocker; do (a) first.

## §4 What Josh sees (PNG pairs, `research/release-0.5.3/eye/`)
Docked at the top of the rack: `tr-before-top[-light].png` / `tr-after-top[-light].png`. At the foot: `tr-before-foot[-light].png` / `tr-after-foot[-light].png`. Tempo drawer open: `…-open…`. Floating pill (unchanged by design): `…-pill…`. The switch: `tr-switch-before.png` / `tr-switch-after.png`. (`tr-after-*` dark and `-after-*-light` taken before the last `.fd::before` tweak for dark; light was retaken after it.)

## §5 Lines
JS +2 (`cat` of non-kit `lab/**/*.js` = 27,953; budget +3). CSS not counted: skin.css 43 changed lines in the docked block. sw.js regenerated with each commit.

## §6 Suites and what I could not measure
RUN, green (server 8973, `LW_PORT=8973 GD_PORT=5443`, rigfree before each): `tools/stage-dead-probe.mjs` **10/10 OK**; `tests/timeline.browser-test.mjs` **0 failing of 14** (T1–T5 included); `tests/menubar.browser-test.mjs` **GREEN**; `node tests/keyboard-shortcuts.test.mjs` PASS; `node tests/pwa.test.mjs --write` each commit.
NOT RUN (usage pause): `tests/history.browser-test.mjs` (killed mid-run, no verdict), `node tests/frame-occlusion.browser-test.mjs` (7/7 wanted), `tests/film-handover.browser-test.mjs`, `tests/stage-text.browser-test.mjs`, `tests/current.browser-test.mjs`, `bash test.sh node`, a stylehash re-capture after the last `.fd::before` line.
Could not measure: pixels (headless, no WebGPU here: the UI paints late; screenshots retried until non-black; stylehash pixel compare is therefore weak); the phone breakpoint (`@media (hover:none)…` block untouched, sizes only); the real GPU look.

## NEXT STEP (a fresh builder, from this tip)
1. `git log -1` shows the commit of this file on top of 015264c. Start `python3 tools/gate/server.py <worktree> 8973 &` (note its pid).
2. For each of history, frame-occlusion, film-handover, stage-text, current: `node research/release-0.5.2/r2b-measure/rigfree.mjs` then `LW_PORT=8973 GD_PORT=5443 node tests/<name>.browser-test.mjs` (frame-occlusion wants 7/7), 4 s apart; `tools/stage-dead-probe.mjs` again; `bash test.sh node`.
3. Re-run stylehash (script chain in `.tmp/sh.sh`, if `.tmp` survived: `.tmp/sh.sh after` then `stylehash compare … before after --noise before2`; needs `CHROMIUM=<wrapper adding --no-sandbox --ignore-certificate-errors>`).
4. If all green: the integrator merges M13a/M13b AFTER B-CAM (rebase on B-CAM's merge; `shell/modulation.js` hunks are disjoint). Fix any red with a plain-words follow-up commit.
