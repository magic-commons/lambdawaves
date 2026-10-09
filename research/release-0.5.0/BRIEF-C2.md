# BRIEF · C2 — THE LOOK IS THE KIT'S: `createPrefs` + `createAccent` (+ `createGui`, hidden) and the look lift

Written 2026-10-08 by Claude Yan (the integrator, branch `yan-c`) from PLAN §2 row C2, §9's rulings and the kit's docs. One Opus builder,
own worktree, from the `yan-c` tip AFTER C0 is merged (the integrator names the sha at launch). Size M. Wave 204. Ports 8873/5343 (yours),
8877/5347 (a base copy, `git archive <start sha> lab tools`). You never merge, push, tag or deploy.

## 1 · The contract (PLAN §2 row C2, verbatim)

> `createGui` + `createPrefs` + `createAccent` (`projectAccent:false`; `defaults` = light, refractive + ALWAYS frost, 22 px, 50 % VIVID, normal
> ink; the phone law stays the app's) + **the look lift**: `theme, card, frost, disc, blur, accent` from the blob → the kit's `mir.gui` keys,
> once, forward only. **What leaves:** INTERFACE + THEME·SURFACE ~155, `accent-wheel.js` 152, `native-ui`/`first-run` partly. **What stays / is
> new:** the invariant widened to a whole-`localStorage` snapshot minus WORKSPACE (the probe, from A1's); STATE-SCOPES rewritten; R5-S1; brief J
> consumed. **Closers:** `first-run`, `official-defaults-palette`, `new-project`, the snapshot diff, stylehash per class.

## 2 · The rulings that bind (PLAN §9)

- **R5-S1: MIR OPTIONS is HIDDEN — SETTINGS stays the surface.** The kit's GUI window is never offered in the menubar and never opens on its
  own. The look's STORE and its APPLICATION become the kit's (`core/prefs.js`, one key `mir.gui`, the LOOK_SCHEMA hooks); the look's CONTROLS
  stay reachable from λWAVES' SETTINGS card. Decide in your design hand-off (step 1) which of the two roads deletes more while keeping the hand
  law (positions never move): (a) SETTINGS keeps thin kit controls (THEME seg, CARD seg, FROST seg, DISCONNECTED sw, BLUR knob, ACCENT A/B, VIVID)
  that call `prefs.set(key, v)` and are repainted from `prefs.subscribe`; or (b) the kit's own LOOK tab body is mounted into SETTINGS. Prefer (a)
  unless (b) is clearly less code; state the count for both. The WINDOW menu's THEME · LIGHT/DARK/SYSTEM rows (rack.js, grep `THEME · LIGHT`) keep
  working through the same road.
- **The first-run look is the app's `defaults`:** light, refractive + ALWAYS frost, 22 px blur, 50 % VIVID, normal ink (`createGui({ defaults })`
  / `createPrefs` defaults). **The phone law stays the app's:** `lab/first-run.js` (frost OFF, tinted on a phone or tablet; rack.js' own
  `isPhone()`/`isTablet()`) decides before the kit's defaults apply; the phone crossing's FROST OFF override is a later, separate law — keep both.
- **`projectAccent: false`:** ACCENT A/B/VIVID/BRIGHTNESS are PREFERENCE in λWAVES (never in a project, a link or a history row); the kit's default
  (the accents ride the project) is refused here.
- **Brief J consumed:** if the kit's `lab/mir/palette.js` now carries the Jet Black row, `lab/palette-app.js` leaves (the boot's append with it); if
  it does not, it stays and you write one line saying so.
- Josh's seven glass rulings were applied at C0 as defaults (`C0-GLASS-RULINGS.md`): the look you reach through the kit must paint the SAME eight
  states. Measure, do not believe (step 5).

## 3 · Read first

`research/release-0.5.0/PLAN.md` §2 row C2 + §9 · `CLAUDE.md` (the first-run paragraph, the scopes paragraph, the A1/A8 and C0 paragraphs) ·
`docs/STATE-SCOPES.md` · `lab/settings-store.js` (A1's adapter: WORKSPACE + FAMILIES) · `tools/settings-probe.mjs` (A1's probe; you widen its
classification) · `lab/first-run.js`, `lab/native-ui.js`, `lab/accent-wheel.js` (what leaves or shrinks) · rack.js from `group(ui.set.body,
'INTERFACE')` through the end of `'THEME  ·  SURFACE'` (the ~155 lines), `setTheme` (the engine-side effects: `mat.bg`, `mat.lightUI`, the
`#themeColor` meta, `__LW_hooks.restage/themeChanged`, `applyAccent`) · the kit: `lab/mir/core/prefs.js` (header; `createPrefs`, `jsonStore`, the
versioned `migrate`), `lab/mir/shell/gui.js` (header; LOOK_SCHEMA; `createGui`'s options `defaults`, `accent`, `prefs`, `projectAccent`, `forget`,
`rack`), `lab/mir/shell/accent.js` (header; `createAccent` options — λWAVES ships A = 30°, B = 300°, VIVID 0.1 in the kit's words, 50 % VIVID in the
plan's: reconcile against what λWAVES' blob holds today and say which), and the MIR docs at
`~/Documents/MIR/.claude/worktrees/mir-1.5/docs/GUI.md` (§ How an app adds it · The API · The options and the hooks they drive · An app's own panes ·
The accents ride the project) and `ADOPTING-1.5.md` §§ 4, 7, 8 (layers, what BASINS deleted, your own panes and ink). `lab/mir/**` is read-only.

## 4 · Commits, in order (each with `C2-HANDOFF.md` committed after it)

1. **The design hand-off (no lab/ code).** The road for R5-S1 (a or b, with both counts), the key map blob → `mir.gui` (every λWAVES key: `theme`,
   `themeChoice`?, `card`/`cardSet`, `frost` (legacy `true` = ALWAYS), `disc`, `blur`, `accA`, `accB`, `vivid`, and whatever else INTERFACE
   holds — list them from `saveSettings`), the engine-side effects of a theme change and where they hook (`prefs.subscribe` or the schema's `run`
   spec), what the `__LW` members the tests use (`__LW.setTheme / setCardStyle / setFrost`, `__LW_hooks.setTheme`, the stylehash recipe's 8 states)
   become (thin wrappers — the `__LW` law: no member a test uses is renamed or removed), and the line estimate.
2. **The kit's store and engine in:** `createPrefs` (key `mir.gui`, LOOK_SCHEMA, the app's `defaults`) + `createAccent` (λWAVES' angles, `model:
   'palette'`, the stage ground, `onAccent` → the modulation window's `setAccent`) + `createGui({ … projectAccent: false, defaults, accent, prefs,
   forget: [] })` with its window never offered (R5-S1). `accent-wheel.js` leaves when the kit's engine paints the same `--acc/--acc2` and the mark
   (compare computed `--acc`/`--acc2` on the 8 states before and after). Tests green: `official-defaults-palette`, `first-run`.
3. **The look lift, once, forward only:** on boot, if the blob holds look keys, write them into `mir.gui` through `prefs.set` (or the kit's versioned
   `migrate`), then stop writing them (`saveSettings` drops them; a later boot finds none). A fresh profile never runs it. Prove with
   `tools/settings-probe.mjs`: the blob's round trip B1 = B3 still byte-identical; `mir.gui` classified PREFERENCE in `FAMILIES`; zero RED over the six
   scenes. `docs/STATE-SCOPES.md` rewritten (the look rows point at `mir.gui`; `nativeLayout` confirmed PREFERENCE; `modpresets` named — C4 may have
   moved `modArm`/`modCadence` to `lambdawaves.q0.modulation`: read the tree you start from).
4. **The SETTINGS surface** (the road chosen in 1): INTERFACE + THEME·SURFACE's own code leaves; the rows that remain are kit controls bound to
   `prefs`; `native-ui.js`'s appearance rows (`row('appearance', …)`) and `first-run.js` shrink to what the app still decides (the phone law).
   `node tools/new-project.mjs` + `--check` if any default moved. Tests: `new-project` 8, `menubar`, `keyboard-window` (THEME via the WINDOW menu),
   `frame-occlusion`.
5. **The eight states, measured.** The 1.5 worktree's `tools/stylehash.mjs` with the README's λWAVES recipe (`--gpu 1`, ready on `__LW.ready &&
   #controlHelp`, the 8 states by `__LW.setTheme / setCardStyle / setFrost`) on a base copy of your start sha and on your tree: the seven classes
   must show 0 element-states of change (the C0 agent's scripts are readable at
   `~/Documents/LAMBDAWAVES/.claude/worktrees/agent-a34f1eb47fe65acfb/.tmp/` — `cap.mjs`, `classes.mjs`; copy, never write there). Any change is
   explained or fixed. Also one capture with the modulation window open and one with the notebook open.
6. **Lines, wave, BUILD.** `cat lab/*.js | wc -l` before/after (expect roughly −250 to −350); `bash test.sh node` (only reds the integrator names at
   launch); REPORT.md `### wave 204: C2 THE LOOK IS THE KIT'S — …` under `## 2026-10-08 · 0.5.0 C — THE ADOPTION`; `C2-BUILD.md` (A7-BUILD.md's
   shape: what left, what stays, the key map, the gates with counts, brief candidates, the draft CLAUDE.md paragraph in ≤ 8 lines replacing the
   first-run and look sentences). Final `C2-HANDOFF.md`.

## 5 · Acceptance

`first-run` green on desktop AND the phone/tablet crossing (first-run material: desktop refractive + ALWAYS; mobile tinted + frost OFF) ·
`official-defaults-palette` green · `new-project` 8 + `--check` in step · `tools/settings-probe.mjs` six scenes, zero RED, B1 = B3 · the eight
stylehash states unchanged in the seven classes · `--acc`/`--acc2` identical on the 8 states · the WINDOW menu's THEME rows work · `menubar`,
`keyboard-window`, `frame-occlusion` green · node gate as at launch · the `__LW` law kept · `lab/*.js` down by the amount you measured · no edit
under `lab/mir/**` · nothing pushed.

## 6 · Hand-off and harness

Commit `research/release-0.5.0/C2-HANDOFF.md` after EVERY commit (worktree · branch · commits · tests with counts · blockers · exact next step).
Commit messages start with `0.5.0 C2 · `. Never edit `lab/mir/**` or `lab/fonts/**`; after any `lab/` edit `node tests/pwa.test.mjs --write`,
then the suites; subtract, don't add; diagnostics in `tools/`, never `lab/`; the glass is Josh's (the look's VALUES do not change — only who stores
and applies them); one light check per step; a timing red is re-run alone (the RTX 3070's P5 one-ulp fault); the GPU is shared — one browser suite
at a time, 4 s apart; never `pkill -f` — gate server `python3 tools/gate/server.py <your worktree> 8873` in the background, `LW_PORT=8873
GD_PORT=5343 node tests/<suite>.browser-test.mjs`, stop by pid; the guard refuses compound shell with variables/loops/heredocs/backticks and git
outside your worktree — plain commands, scripts under `.tmp/`. FINAL report: worktree · branch · tip · commits · tests with counts · lines
before/after · blockers · brief candidates · what Josh will see or feel · the draft CLAUDE.md paragraph.
