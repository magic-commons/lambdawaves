# BRIEF · C3 — THE RACK, THE TRANSPORT, THE MENUBAR, THE KEYS AND THE KEYBOARD ARE THE KIT'S

Written 2026-10-08 by Claude Yan (the integrator, branch `yan-c`) from PLAN §2 row C3, §9's rulings, A4's parked hand-off and the kit's docs.
One Opus builder, own worktree, from the `yan-c` tip AFTER C0 and C4 are merged (the integrator names the sha at launch; C6 may run beside you —
two builders on `rack.js` at a time, in different regions). Size L. Wave 205. Ports 8883/5353 (yours), 8887/5357 (a base copy, `git archive
<start sha> lab tools`). You never merge, push, tag or deploy.

## 1 · The contract (PLAN §2 row C3, verbatim)

> **consumer:** rack + transport + menubar + keys + keyboard. **What leaves:** the floating rack (`const layout` block + helpers), transport +
> menus, `menubar.js` + `rack-menus.js` 198, `keymap.js` 934 + `shortcuts.js` + `keys.js`. **What stays / is new:** `keyboard-window.browser-test`
> rewritten wholesale (the largest test rewrite); `__LW.layout`'s 137 uses keep their verbs (A4's branch shows the seams); the KEYBOARD skin
> λWAVES' (R5-S3); NEW `Ctrl`-vs-`Mod` case; brief P consumed. **Closers:** `menubar`, `keyboard-window`, `keyboard-shortcuts`, `frame-occlusion`
> over `[data-mir-window]`.

On today's tree the files are: `lab/menubar.js` 88 · `lab/rack-menus.js` 110 · `lab/keymap.js` 878 · `lab/shortcuts.js` 43 · `lab/keys.js` 130 ·
`lab/window-chrome.js` 33 (read it; it may belong here) · the `const layout = {` block in `lab/rack.js` (~line 3360 on `yan-c` 4824a62; A4 measured
the floating rack proper at ~520 lines in five pieces).

## 2 · The rulings that bind (PLAN §9, CLAUDE.md)

- **The hand law (Josh 10-06):** positions never move; tabs not pages; the rack's chrome stays where it is. **The glass is Josh's.**
- **R5-S2:** the kit's LANGUAGE menu is HIDDEN. **R5-S3:** the KEYBOARD window keeps λWAVES' charcoal-blue skin as an `app.*` layer over the
  kit's `keyboard/keyboard.js` (the kit's pane, λWAVES' paint; CLAUDE.md's keyboard paragraph names what the pane must keep: five key rows in
  416 px on desktop, the legend + icon platform switch on one row, centred subtitle-free Record/Reset above search, status only when needed, the
  phone's taller action-only editor). **No chord is invented for a kit window.** **R-K1:** S stays WASD; Ctrl+Space is MOD arm.
- **The camera bindings are A8's data table** (`STAGE_BINDINGS` in `lab/stage-gestures.js`): untouched here.
- **The transport is per app** (Josh 10-01: "keep the Transports as they are per each app"): the kit's `shell/transport.js` carries
  `LAMBDAWAVES_LAYOUT` — `createTransport({ layout: LAMBDAWAVES_LAYOUT })` must reproduce today's bar part for part; the pill's dock button keeps
  its DOM seat in `#transport` before `mod-exp` (A4's note). The one clock is C4's (`appPlay`, `mod.follow`): the transport's play is THE play.
- **The WORKSPACE record is data the kit reads as it is:** `createRack({ store })` takes the arrangement from `lambdawaves.q0.settings`'
  WORKSPACE keys (`lab/settings-store.js`: `closed, layouts, nbW, nbH, abW, abH, modwin, phoneTr, phoneRack`); the kit's `readLayout()` reads
  λWAVES' saved layouts (side 'L'/'R', `closed`) and the ☆ layouts (`LAYOUT_SLOTS = 4`) as they are; `RETIRED_WINDOWS` → `createRack({ retired:
  { old: heir } })`. A saved layout from 0.4.0 must restore identically (step 2's probe).
- **The `__LW` law:** no member a test or tool uses is renamed or removed. A4 counted the five 0.4.0 verb names called by 13 files (`raise` 42,
  `reopen` 31, `floating` 22, `popOut` 21, `moveToRack` 19, `toggleRack` 16, `dockTransport` 16, `docked` 15, `dockAll` 15, …): they stay as
  aliases of the kit's verbs in ONE `Object.assign` line.
- **Saved key bindings survive:** `lambdawaves.q0.keys` (PREFERENCE) is read through A9's alias map (old ids → the kit's) into the kit's ONE KEY
  TABLE; a chord a user set is never lost.

## 3 · Read first

A4's hand-off: `git show worktree-agent-a42dc49a851951ba4:research/release-0.5.0/A4-HANDOFF.md` — the floor plan (the map of the block, the verb →
kit-twin table, the WORKSPACE record `{v:3, …}`, the 13 caller files) and its branch's `lab/windows.js` (`git show 9fa9d97:lab/windows.js`) and
`tools/a4-window-probe.mjs` (the 16-step parity probe whose two JSON files were byte-identical base vs tip: REUSE IT as your parity closer; copy
it from the branch into `tools/`). A4 was parked because every other seam edited inside this block; now that C0, C1, C4, C5, C9 are in, the block
is yours. · `research/release-0.5.0/A9-A11-BUILD.md` and `A1-A8-BUILD.md` (the ACTIONS table with the kit's ids, the alias map, `STAGE_BINDINGS`)
· `research/release-0.5.0/PLAN.md` §2 rows C3 and C8, §9 · `CLAUDE.md` (the keyboard paragraphs, the occlusion paragraph, the scopes) ·
`docs/STATE-SCOPES.md` · `research/release-0.4.0/KIT-BRIEFS.md` (find brief P and say how C3 consumes it) · the kit: `lab/mir/shell/rack.js`
(header + laws), `shell/transport.js` (`LAMBDAWAVES_LAYOUT`), `shell/menubar.js`, `shell/keys.js` (THE ONE KEY TABLE; the chord spelling
`Mod+Ctrl+Alt+Shift+Meta+<code>`), `keyboard/keyboard.js`, `window/window.js`, `window/dock.js`, `window/workspaces.js`; the MIR docs at
`~/Documents/MIR/.claude/worktrees/mir-1.5/docs/`: `RACK.md` (§ What an adopting app deletes · § Adopting into an app that has a rack),
`TRANSPORT.md`, `KEYS.md` (§ 5 Moving an app onto it · § 6 What differs from λWAVES' window, and why), `WINDOWS.md`, `ADOPTING-1.5.md` §§ 5, 9, 11.
`lab/mir/**` is read-only.

## 4 · Commits, in order (each with `C3-HANDOFF.md` committed after it)

1. **The design hand-off (no lab/ code).** A4's map re-measured on your start sha (line numbers moved); the verb → kit-twin table confirmed against
   the kit as adopted (alpha.24, not the alpha A4 read); the WORKSPACE record mapping and what `readLayout` repairs; the transport's part list vs
   `LAMBDAWAVES_LAYOUT` (any part missing from the kit is a brief candidate and stays app-built as a `createTransport` node); the menus (FILE · EDIT ·
   VIEW · WINDOW · ABOUT rows today → the kit's menubar with λWAVES' rows; LANGUAGE hidden); the keys plan (the ACTIONS table → the ONE KEY TABLE,
   the alias map for saved bindings, the `Ctrl`-vs-`Mod` case: Ctrl+Shift+Q/E is explicit Ctrl, everything else `Mod`); the `keyboard-window` test
   plan (what the kit's window lets you assert: the five rows, a drag, a recording, a steal, Escape's three steps, the platform switch); the line
   estimate. Then code, one region at a time:
2. **The rack:** `createRack` adopts `#rack #rackL #floats` by id; the `layout` block and its helpers leave; the five alias names stay; the phone
   crossing's float memory → `createRack({ phone })`; A7's `lab/occlusion.js` providers keep producing (the kit's windows report through
   `onMoved`/`onGeometry`; C8 makes them one subscription later — not here). Gates: the parity probe byte-identical base vs tip (differences only
   where a verb legitimately changed, each explained), `frame-occlusion` 7, `menubar` 8, `history` 39, `new-project` 8, `offer` 16, `input` 13,
   `hit-probe-set` 0 reached (C9's guard reads the kit's windows), `tools/settings-probe.mjs` zero RED (the WORKSPACE keys still land where they did).
3. **The transport and the menus:** `createTransport({ layout: LAMBDAWAVES_LAYOUT })`, `createMenubar` with λWAVES' rows (LANGUAGE hidden); `menubar.js`
   + `rack-menus.js` leave. Gates: `menubar` 8, `take-in-bugs` (the play is the one play), `offer` 16, `frame-occlusion` 7.
4. **The keys and the keyboard:** the ONE KEY TABLE from A9's ACTIONS; saved bindings lifted through the alias map; `keyboard/keyboard.js` as the window
   with λWAVES' skin in an `app.*` layer (R5-S3) and its occlusion following its drag (CLAUDE.md); `keymap.js`, `shortcuts.js`, `keys.js` leave;
   `tests/keyboard-window.browser-test.mjs` rewritten wholesale; `tests/keyboard-shortcuts.test.mjs` re-aimed; the NEW `Ctrl`-vs-`Mod` case in it.
   Gates: `keyboard-window`, `keyboard-shortcuts`, `menubar`, `input` 13.
5. **Lines, wave, BUILD.** `cat lab/*.js | wc -l` before/after (the block ~520 + 198 + ~1,050 leave; adapters come back — say the net);
   `node tests/pwa.test.mjs --write`; `bash test.sh node` (only the reds the integrator names at launch); one stylehash capture of the 8 states against
   the base copy (the rack chrome's classes: 0 element-states of change in the seven classes, or each explained — the hand law); REPORT.md
   `### wave 205: C3 THE RACK, THE TRANSPORT, THE MENUBAR, THE KEYS — …` under `## 2026-10-08 · 0.5.0 C — THE ADOPTION`; `C3-BUILD.md` (A7-BUILD.md's
   shape; the draft CLAUDE.md paragraphs replacing the keyboard-editor and floating-rack sentences, ≤ 10 lines). Final `C3-HANDOFF.md`.

## 5 · Acceptance

The parity probe byte-identical (or every difference named) · a 0.4.0 saved layout and its ☆ slots restore identically · `keyboard-window`
(rewritten) and `keyboard-shortcuts` green with the `Ctrl`-vs-`Mod` case · `menubar` 8 · `frame-occlusion` 7 over `[data-mir-window]` · `history`
39 · `new-project` 8 + `--check` · `offer` 16 · `input` 13 · `hit-probe-set` 0 reached · `settings-probe` zero RED · the `__LW` law kept (the 137
`__LW.layout` uses alive) · the eight states' rack chrome unchanged · node gate as at launch · `lab/*.js` down by the amount you measured · no edit
under `lab/mir/**` · nothing pushed.

## 6 · Hand-off and harness

Commit `research/release-0.5.0/C3-HANDOFF.md` after EVERY commit (worktree · branch · commits · tests with counts · blockers · exact next step).
Commit messages start with `0.5.0 C3 · `. Never edit `lab/mir/**` or `lab/fonts/**`; after any `lab/` edit `node tests/pwa.test.mjs --write`, then
the suites; subtract, don't add; diagnostics in `tools/`, never `lab/`; the glass is Josh's; one light check per step; a timing red is re-run alone
(the RTX 3070's P5 one-ulp fault); the GPU is shared — one browser suite at a time, 4 s apart; never `pkill -f` — gate server `python3
tools/gate/server.py <your worktree> 8883` in the background, `LW_PORT=8883 GD_PORT=5353 node tests/<suite>.browser-test.mjs`, stop by pid; the
guard refuses compound shell with variables/loops/heredocs/backticks and git outside your worktree — plain commands, scripts under `.tmp/`. FINAL
report: worktree · branch · tip · commits · tests with counts · lines before/after · blockers · brief candidates · what Josh will see or feel · the
draft CLAUDE.md paragraphs.
