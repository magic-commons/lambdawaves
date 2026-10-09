# C2 HANDOFF — THE LOOK IS THE KIT'S (PAUSED for the usage alarm; resume from the tip)

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a828649825812de0a`, branch
`worktree-agent-a828649825812de0a`, from `f0fcbc4`. Never pushed, merged or tagged. All servers stopped by pid (gate 8873 https,
http 8873 and 8877 for stylehash); no geckodriver or browser of mine left running.

## Commits
- `177be6b` 0.5.0 C2 · the design hand-off (`research/release-0.5.0/C2-DESIGN.md`: road (a); createGui NOT built — it would install
  kbm and body.touch-tablet; eleven LOOK_SCHEMA rows in `mir.gui`; the key map; the lift; the theme's `run` spec; the `__LW` law)
- `b817b27` handoff after step 1
- `2e22fdc` WIP 0.5.0 C2 · step 2: `lab/accent-wheel.js` → `lab/look.js` (`git mv`): `createLook` = `createPrefs({ key: 'mir.gui' })`
  over the kit's `lookSchema()` rows theme/accentA/accentB/vivid/card/frost/blur/disconnected (λWAVES' `LOOK_DEFAULTS` over the row
  defaults; blur max 30; a `run` appended to the theme row → `__LW_hooks.theme`), `createAccent` (palette model, stage ground =
  mat.bg, gamut hole, onAccent → modView.setAccent), the lift (`liftLook`, blob keys theme/card+cardSet/frost/disc/blur/accent →
  mir.gui, then deleted from the blob), the stage-text ink + M7 batch kept. rack.js: setTheme body → `__LW_hooks.theme`;
  setCardStyle/setFrost/setDisconnected → `look.set`; `lookSync` subscribe repaints the 8 controls; applySettings → `look.rerun()`;
  saveSettings no longer writes the look; frostSync → `look.moving(clock.playing)`; phone wasCard (dead) removed; FORGET also
  `look.prefs.forget()`; `__LW` members kept as wrappers (+ `__LW.look`). busy-mark.js takes `markBusy: accent.busy`. Tests:
  first-run wiring judge rewritten; official-defaults saved case reads `14px` (the kit's map) and proves the lift (`left: []`,
  `gui: {...}`); pwa allows gui.js's MIR ABOUT credit URL (gui.js is now reached); sw.js regenerated.

## Tests (at 2e22fdc)
- node: `node .tmp/suites.mjs` (all suites, pwa last) — **82 of 82 green**.
- browser (LW_PORT=8873 GD_PORT=5343): official-defaults-palette **3/3 PASS**; menubar **GREEN** (THEME rows via WINDOW menu);
  keyboard-window **PASS**.
- NOT yet run: frame-occlusion, new-project browser, settings-probe, history, current.
- stylehash: captured `.tmp/sh/base`, `.tmp/sh/base2` (base copy of f0fcbc4 served from `.tmp/base`) and `.tmp/sh/s2` (this tree at
  2e22fdc-content), closed set, 8 states, 899/903 elements each — **NOT compared yet**.

## Lines
`cat lab/*.js | wc -l`: 30,553 (f0fcbc4) → 30,439 (2e22fdc), −114 so far (estimate for C2 done: ≈ −160).

## Blockers
None. Note for the integrator: createGui is deliberately not constructed (C2-DESIGN §1) — overrule there if wanted.

## Exact next step (a fresh agent, from 2e22fdc)
1. `node .tmp/classes.mjs base s2 base2` (C0's classifier copied, paths point at this tree's `.tmp/sh`) — expect 0 element-states in
   the seven classes; explain or fix any. (If `.tmp/` is gone: `git archive f0fcbc4 lab tools tests | tar -x -C .tmp/base`, serve
   `.tmp/base` and the tree with `python3 -m http.server <port> --bind 127.0.0.1 --directory <dir>` on 8877 / 8873, and re-capture
   with C0's `cap.mjs` from `~/Documents/LAMBDAWAVES/.claude/worktrees/agent-a34f1eb47fe65acfb/.tmp/` with OUT re-pointed.)
2. Step 3: `lab/settings-store.js` FAMILIES gains `'mir.gui': ['look.js createLook (mir/core/prefs.js, LOOK_SCHEMA rows)',
   'PREFERENCE']`; `tools/settings-probe.mjs` also fails a scene whose B3 still holds a look key (theme, card, cardSet, frost, disc,
   blur, accent); rewrite `docs/STATE-SCOPES.md`'s look rows to `mir.gui` (+ `nativeLayout` PREFERENCE, `modpresets` named); run
   the probe (gate server `python3 tools/gate/server.py <tree> 8873`, `LW_PORT=8873 GD_PORT=5343 node tools/settings-probe.mjs`):
   six scenes, zero RED, B1 = B3. Commit + handoff.
3. Step 4 (C2-DESIGN §3): add rows `hints`, `help`, `badges` to `LOOK_ROWS` and the lift (blob `badges`, `controlHints`/legacy
   `hint`; HELP's own key `lw-window-info`, removed after the lift); STATUS TAGS / CONTROL HINTS (rack.js INTERFACE) and HELP
   (native-ui.js `windowInfoSw`, `ui.setWindowInfo` keeps its name for the `notes` action) call `look.set`; the subscribe dispatches
   `controlhintschange` on a hints change and closes open info popovers on help off; saveSettings drops badges/controlHints;
   first-run.js loses storedCard/storedFrost/bootMaterial and first-run.test's reading-law judges move to `liftLook`; FAMILIES drops
   `lw-window-info`. `node tools/new-project.mjs --check`; tests new-project (8), menubar, keyboard-window, frame-occlusion, offer.
4. Step 5: stylehash closed + mod + nb sets on base and tree (cap.mjs `closed|mod|nb`), `--acc`/`--acc2` identical on the 8 states.
5. Step 6: lines, `bash test.sh node`, REPORT.md `### wave 204: C2 THE LOOK IS THE KIT'S — …` after wave 201 under
   `## 2026-10-08 · 0.5.0 C — THE ADOPTION` (before `## … 0.5.0 D`), `C2-BUILD.md` (A7-BUILD.md's shape; brief candidates: the kit's
   VIVID 0.1 prose is stale (λWAVES ships 0.5), BLUR max 24 vs λWAVES' 30, Jet Black NOT in the kit's palette.js so
   `lab/palette-app.js` stays (brief J not consumed), createGui hidden would need an option to skip kbm/touch-tablet), the draft
   CLAUDE.md paragraph (≤ 8 lines). Final handoff.
