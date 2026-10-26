# ITERATION 017 — THE BUG HUNT (Claude Sos, 2026-10-26, from Josh's note of 01:10)

BASE: `yan-c` @ the commit that carries this file (see `git log -1 -- research/iteration-017/PLAN.md`). Builders: Opus, one worktree each,
`git reset --hard <BASE>`, branch `it017-<chain>`. Common laws: `BRIEF-COMMON.md` beside this file. THE MACHINE: the night run c8 is on the
CPU (the pack at 4.4 GB, two esp shards at 8 threads) until `LAMBDAWAVES-VOLUMES/babysit/DONE-c8` lands — until then ONE builder, ONE browser at
a time, every suite under `nice -n 10`, focused tests only; after DONE-c8, full operations (Josh: "When the CPU gets quiet, then full operations ahead").

## JOSH'S PROMPT, VERBATIM (2026-10-26 ≈ 01:10)
> Hey Claude... I need to do some major bug fixing. I want to look for other bugs but mostly the Hydrogen and Hamimltonian modes. And see if they
> actually work. When clicking on the 140 orbital table in spectrum and playing with 'WAVE' it doesn't seem to work like it used to. And it's so much
> different to explain what it's doing before these recent iterations with Yan. A major rule to take into account is if the special windows aren't
> active like Lattice, Seperable, Emission, and other special kinds of windows other than the main few, then make sure that they become dissabled and
> effect don't persist even when gone from the rack as an effect. Grey out anything from 'Wave' that shouldn't work when switching between molecules or
> atoms/hydrogen. Amongst other things, there should be more deeper ones with unintended consequences. Find ways to speed up the app and have it perform
> the best it can be. Compare it to a last stable version if need be. There seems to be strange diamonds under the pills in accent color B when scrolling
> on the rack; it should only be a pill. Do anything you can to polish the layout so that nothing seems out of place like the screenshots, empty space,
> and space saving techniques like pages, expandables, overovers, readability in cramped spaces, adopting other parts of the app with already fleshed
> out peices of the codebase to make it much more consitent while not having anything look out of place. Speed-runner friendly and fluid UI use without
> the lag, jitter, and whatnot. Whenever I open project wavedancer, it seems to work fine, which means there must be some sticky setting that's
> persisting and I can't find it. Make sure settings, preferences, project saved info works. Make sure metadata is consitent and all the thumnails are
> available and such, Make sure the pickers/folders all work, avoid scrolling in rack windows (only main scroll should work, individual windows should
> not be able to scroll. Defer to your judgement, whatever gets rid of the general lag and stutters. ULTRATHINK
> — then: "The CPU might also be in use?" · "Shoot, well. Let's do what we can. When the CPU gets quiet, then full operations ahead."

## THE ONE NEW LAW — AN EFFECT SHOWS ITS WINDOW
A special window's effect lives exactly as long as the window is OPEN on a rack (or floating). Close (×), POWER OFF or a mode that hides it ends the
effect at once; a restore (project, link, RESUME, undo) that brings an effect back brings its window back with it. The main few — SPECTRUM, WAVE, STATE,
CLIP, PALETTE, CAMERA, SETTINGS, INFORMATIONAL, MOLECULES, the CONTROL SURFACE, FOLDERS, HISTORY, RENDER, CURVES, the readouts (SHADOW · ORBIT · VORTEX ·
PLANE · CALCULUS · METERS · LADDER · WIGNER · RADIATION) — carry no effect of their own and are outside the law. The special windows and their effects:

| window (id) | the effect | where it is switched today | gone today? |
|---|---|---|---|
| LATTICE (`lattice`) | its own register and solve; ‹ SYSTEM › reads LATTICE | `windows/spectrum.js:60` stepper `reopen('lattice')`; `readouts.js:153` `active: () => canPresent(wLat)` | the solve sleeps, but the stepper still says LATTICE |
| SEPARABLE (`separable`) | the operator `separable` in force | `separable.js` `apply(id) → switchHamiltonian(id)` (`readouts.js:161`) | NO — the operator stays after × (013 H2: "a window opens and leaves the Hamiltonian alone") |
| CENTRAL (`central`) | the operator `central` / `cornell` in force | `central.js` apply (`readouts.js:158`) | NO |
| EMISSION SPECTRA (`emission`) | the A ↔ B TRANSITION it started (`app.hooks.ab.set(true)`), the clock it started | `readouts.js:199-205` `load(p)` with `decay` | NO — the Rabi transition runs on with the window closed |
| FIELD (`staticfield`) | Fz · Bz · INTER-SHELL (`reg.setField`, `state.js:95-99`) | `windows/static-field.js` | NO — a Stark field survives the window's × |
| EQUALIZER (`equalizer`) | `field.setEqualizer(t)` (`windows/spectrum.js:170`, `field.js:2397`) | its knobs | NO |
| BLOCH (`bloch`) | its own register | `readouts.js:156` | self-contained; the stepper is not involved |
| ATOMS (`atoms`) | the operator `atom` (SPECTRUM's ATOM, Z) | the stepper's `atom` case; the Picker's `goAtom` | NO (call 1 below) |

The kit's rack already announces every close: `lab/mir/shell/rack.js:553` dispatches `devclose` (bubbling) on the card and calls `onClose` / `onSleep`;
POWER OFF toggles `.off` and calls `onPower(false)` (`:468`); `devopen` is the twin the app already listens to (`readouts.js:151-162`). No app window
listens to `devclose` today (grep: none). One seat for the law: a small `lab/shell/stand-down.js` (or the rows inside each window's own file — the
builder's call; NO new key in `lab/rack.js`'s `app` literal, `rack-deps` HINGE ≤ 25) that, on `devclose` / `onPower(false)` of a card in the table above,
ends the effect and lets ‹ SYSTEM › read back the operator in force.

## THE FINDINGS (read at BASE, 01:20–02:00; the builder verifies each in the browser before fixing)
F1 **The 140 table → WAVE.** The Picker's HYDROGEN deck (015 M3, "THE 140 on one page") picks through `picker.js:663-669` `goHydrogen`: since 015 M2 the
pick writes WAVE's OBSERVABLE from the Picker's LOOK (`visual.view: phase | imag | density`, applied at `shell/controller.js:280`) and, under the
default atomic look Im ψ (016 ruling 3), loads every m = 0 state at phase π/2 ("held imaginary for Im ψ, as its picture"). So a press changes the
OBSERVABLE under the reader's hand and the state's phase — "different to explain", and not how it worked before 015. A project (wavedancer) restores its
own view and phases, so it "works fine". The Picker's `look` is a PREFERENCE (`lambdawaves.q0.picker`), sticky across projects — the sticky setting.
F2 **WAVE under a molecule / an atom.** `windows/material.js` has no mode logic: `moleculeMode` HIDES SPACE (`windows/molecules.js:36`, 012 R3) instead
of greying it (016 V1's law: greyed, never hidden, the seats stay); BALLS · STICKS · ESP (`field.js:39` ATOM_STYLES 9–11) stay live under hydrogen and
an atom, where the shader draws them as CLOUD; nothing in WAVE says which observable a molecule can show.
F3 **The pictures are complete** — `lab/img/menu`: 118 `el-*`, 140 `orb-*` (+ 140 `.density`, 140 `.phase`; the base IS Im ψ, `tools/menu-thumbs.mjs:243`
`atoms: { view: 'imag' }`, so `picOf`'s fallback for `im` is right), 96 molecules × base · phase · im · balls · sticks · esp · labels. No render needed.
F4 **The diamonds.** Two candidates at the pill's seat: the pill's own tail — `lab/mir/shell/rack.css:117` `.rack-pill::before`, an 8-px square rotated
45° (`background: inherit`; under `body[data-rack-pill="b"]` the pill and the tail are ACCENT B) — and 016 W8's ACCENT B DOT, `lab/lab.css:1123`
`.dev.lw-routed > .dev-head::after`, 6 px, placed "where the scroll pill's tail starts", always on for a window with a route. Josh: "it should only be a
pill" — reproduce with the pill on B and a routed window, in Firefox (his browser) and Chromium, then: the tail stays inside the pill's mask (no diamond
before the reveal and none after the linger), and the routed dot leaves the pill's seat (inside the title bar, at the eyebrow's end) or goes if Josh says.
F5 **Inner scrollers in rack windows.** `lab/lab.css:570` `.mol-shelf-vol { max-height: 340px; overflow-y: auto }` (MOLECULES' volume shelf);
`lab/mir/history/history.css:18` `.hist-list { overflow: auto }` (HISTORY is a rack window, `shell/history.js:118`); FOLDERS registered on the left rack
(`rack.js:862`) with its own scrolling panes. The notebook, the sheet, the kit menus and the floating keyboard editor are not rack windows.
F6 **Steady timers.** `mod-port.js:133` `setInterval(routeDots, 400)`: every 400 ms `querySelectorAll('[data-param]')` over the whole document and
`routeList()`; `material.js:104` the ESP bar's 500 ms seat (ESP only). The rack's layout observer (`mir/shell/rack.js:244`) stamps every card on every
mutation. None is measured yet — P measures before it fixes.
F7 **Where Josh's storage is.** Firefox (`snap`, profile `wrhhbdag.default`) holds `https+++127.0.0.1+9261` with only `info · library · notebook` in
localStorage (no `settings`, no `session`), the Chromium snap's storage is from Oct 5. Either Josh pressed FORGET, or he reads the app from another
browser or origin — call 7. The sticky behaviour is explained by F1 without the blob.

## THE CHAINS
**X — THE STAND-DOWN (first; may run beside the night run: one browser, niced).**
- X1 the law's seat: `devclose` / `onPower(false)` on `separable` · `central` → `switchHamiltonian('hydrogen')` + `ui.hamSeg.set`; on `lattice` · `bloch` →
  the stepper reads back the operator in force (`opened = null`); on `emission` → `app.hooks.ab.set(false)` if EMISSION set it (keep the prepared pair,
  stop the transition); on `staticfield` → `reg.setField({ Fz: 0, Bz: 0, inter: false })` and the knobs read 0; on `equalizer` → `field.setEqualizer(null)`
  (reopen re-arms from the knobs); on `atoms` → `switchHamiltonian('hydrogen')` (call 1). `hidden` by moleculeMode is not a close (MOLECULES already owns the field).
- X2 the restore side: `shell/persist.js restore()` — a record whose operator is `separable` / `central` / `cornell` / `atom`, whose field is on, whose
  equalizer is set, or whose transition is on, REOPENS that window (`app.sh.layout.reopen(id)`) so the effect shows its window; THE NEW PROJECT
  (`tools/new-project.mjs --check`) stays byte-exact.
- X3 the walk of the nine systems (Josh: "see if they actually work"): HYDROGEN · OSCILLATOR · BOX · ATOM · CENTRAL · QUARKONIUM · SEPARABLE · MOLECULES ·
  LATTICE through ‹ SYSTEM ›, then each window's × — a table in `X-BUILD.md`: the field changes · STATUS says the operator · the stepper reads back · the
  windows that open and close · what WAVE greys (after W2) · what failed and the fix. `tests/window-switching.browser-test.mjs`, `tests/card-solvers.test.mjs`,
  `tests/hydrogen.test.mjs` green; THE LOCK by name only if a leaf moved.
**W — WAVE AND THE PICK (after DONE-c8, or when X is merged if the machine allows).**
- W1 the pick leaves WAVE alone: `goHydrogen` loads the state at phase 0 and does not pass `visual.view` (SPACE · OBSERVABLE · DRAW are the reader's; the
  LOOK is the thumbnails' style only); rate and window as before 015 (call 2). `goAtom` likewise. The same for the Picker's element tiles.
- W2 the greys: under a molecule SPACE's MOMENTUM greyed (not hidden; the seat stays), and whichever OBSERVABLE the molecular volume cannot show (the
  builder reads `field.js` VIEW under `mol`); under hydrogen / an atom BALLS · STICKS · ESP greyed with a hint ("a molecule's view"); `styleSync` is the
  one seat (016 V1 `mute`), moleculeMode calls it. `tests/official-defaults-palette.browser-test.mjs` and `tests/take-in-bugs` green.
- W3 SPECTRUM's own 140 grid (the register picker) under each system: a press populates, a right-press removes, the paint gesture holds; the HAMILTONIAN
  rows (016 W7 `hamShow`) match the system; what fails is fixed.
**R — THE RACK (after DONE-c8).**
- R1 the diamonds (F4): reproduce (pictures in `R-shots/`, Firefox and Chromium, pill A and B, with and without a route), fix, the kit version bumps if
  `lab/mir` moved (trickle-down rule, `docs/FOR-MIR.md` line).
- R2 no inner scroll in a rack window (F5): the volume shelf in PAGES of tiles that fit (the Picker's ‹ › and page dots, `picker.js`' own parts), HISTORY as
  the last N rows + ‹ › pages (N by the card's width; the kit's `history-list.js` gains `pageSize` under the trickle-down rule), FOLDERS docked without
  its inner scroll (the builder's call: pages, or FOLDERS floats/STAGE only like the CONTROL SURFACE's FREE). Only the rack scrolls.
- R3 `routeDots` event-driven (the mod host's route add / remove) or at 2 s under `requestIdleCallback`; measured before and after in P0's unit.
- R4 the layout polish: a pass over every rack window at 1600 × 1000 and on the phone — empty rows, cramped readouts, words that wrap badly, a fold or
  pages where a window runs long; the same parts as the rest of the app (the kit's seg · stepper · fold · `.sp-vseg`, the Picker's pages). Before/after
  pictures per change; Josh's screenshots go to `research/iteration-017/refs/` when he sends them (call 6).
**P — PERFORMANCE (after DONE-c8, ALONE on the machine).**
- P0 the baseline: `tools/perf/main-thread.mjs` 5 runs on BASE and 5 on `v0.9.4-alpha` (served on its own port from a second worktree, read-only)
  — the "last stable" Josh named; `tools/perf/compare-benches.mjs`; the numbers in `P-BUILD.md`.
- P1 the speed-run trace: headed Chromium with the Vulkan flags (memory `lambdawaves-paper-capture-2026-10-12`), a 20 s scene of window switching, rack
  scrolling, the Picker opening, knob drags; the top costs by self-time (script · style · layout · paint · GPU).
- P2 fix the top three, each measured: candidates F6, the backdrop blur on every surface (GLASS BLUR 22 px, 012 B1 — measure 0 vs 22; if it is the cost,
  the first-run default drops, the knob stays), the rack layout stamps, the stage words' tick, `occlusion` refreshes on scroll. THE LOCK never re-baked.
**S — SAVES AND METADATA (after DONE-c8; may run beside R).**
- S1 the round trip: `tests/project-formats.browser-test.mjs`, `new-project`, `history`, `start`, `first-run` green; then by hand through the suites' CDP
  helper: change a PREFERENCE, a WORKSPACE and a PROJECT key → reload → RESUME; NEW; a project save → open; FORGET. What drifts is fixed (`docs/STATE-SCOPES.md`'s law).
- S2 `tools/menu-check.mjs`: every id the Picker can show (elements, the 140, the 96 catalogue molecules) × every look → the file exists; VOL. I's `index.json`
  vs `t/` (read-only under LAMBDAWAVES-VOLUMES); a one-screen report. F3 says it passes today; the tool keeps it so.
- S3 the pickers and folders: `tests/library.browser-test.mjs`, `picker-looks`, `molecule-head`, `offer`, `new-project`; FOLDERS' open · save · rename · delete
  by hand; what fails is fixed.

## CALLS FOR JOSH (the defaults stand meanwhile)
1. ATOMS' × → back to HYDROGEN (the uniform law) — or does the ATOM operator stay, the periodic table being only its picker? Default: uniform.
2. The pick from the 140 table: WAVE's OBSERVABLE untouched and phase 0 (default) — or keep 015 M2's "the field opens in the look the tile showed"?
3. FIELD's × zeroes Fz · Bz (default) — or should the window's × be refused while a field is on?
4. HISTORY: how many rows a page? Default 12.
5. FOLDERS docked in the rack: pages (default) or STAGE / FREE only?
6. The screenshots the prompt mentions did not arrive — drop them in `research/iteration-017/refs/` (or paste their paths) and R4 reads them.
7. Which browser reads 9261? Firefox's storage for 127.0.0.1:9261 holds only info · library · notebook (no settings, no session) — did you press FORGET?

8. (from X's walk) MOLECULES is a main window: should its own × mean MOLECULES OFF (the molecule lets the field go), or does the molecule keep the field with the card closed? Default: unchanged (keeps it).
9. (from X) FIELD's DRIVES (the spin rates) and DRAG γ survive the window's × — only Fz · Bz · INTER-SHELL end. Should the drives end too? Default: unchanged.
10. (from X) Under LATTICE the HAMILTONIAN group shows empty rows — a note row, or the fold closes itself there? W takes it if one line; else your word.

11. (from W) The kit's disabled seg buttons take no pointer events, so a greyed button's reason cannot be read on hover. Let a disabled seg keep its hint (a kit change under the trickle-down rule)? Default: yes, in R.
12. (from W) CLAUDE.md says SPECTRUM is FOLDED under MOLECULES; the code HIDES it. Which? Default: the code stands, CLAUDE.md is corrected.

## JOSH'S ANSWERS (2026-10-26 ≈ 04:00)
7: the cache was cleared during a cleanup (no FORGET mystery). 1 ATOMS' × returns to HYDROGEN (built, X1). 2 default (W1). 3 default (X1). 4 yes, 12 rows. 5 FOLDERS docked resizes with its content up to a max rack-window height, then pages; the detached FREE window keeps its scroll. 6 one screenshot: `refs/hamiltonian-misaligned.png` (the HAMILTONIAN group's knob / vertical-seg rows out of rhythm) — the others were lost from his clipboard; R4 reads it. 8 "whatever you feel is best" → Sos: MOLECULES' × = MOLECULES OFF (the law applies: the molecule lets the field go; + brings the card back). 9 "Sure?" → FIELD's × ends the DRIVES and DRAG too. 10 "what do you think should go there?" → Sos: W3's note row naming the operator's window, plus one OPEN <WINDOW> button that raises it (nothing else). 11 default (kit hint). 12 SPECTRUM belongs to hydrogen / atoms, MO-REGISTRY to molecules → the code stands (hidden under MOLECULES); the worktree's CLAUDE.md already says "each mode HIDES the other's" (line 40) — W read the main checkout's older copy; nothing to correct. Josh: "continue to be token light and not send too many subagents" → S is done by the integrator in-line; P is ONE builder, alone, after DONE-c8.

13. (from R) Now the pill's tail is gone, do you want any pointer from the pill to its window at all? Default: none — a pill beside the window reads on its own.
14. (from R) Two scrollers remain inside rack windows: the two-line wide readouts (`.ro.wide .ro-val`) and RENDER's log (`.sr-lines`). Default: the readouts stay clamped (live text would jitter the rack), RENDER's log becomes a fold that grows to its last 6 lines.

## MERGE ORDER
X → W → R → S → P (P last, alone). Each: `git merge --no-ff --no-commit it017-<chain>` → `git checkout --ours lab/sw.js` → `node tests/pwa.test.mjs --write`
→ `./test.sh node` (after DONE-c8; before it, the chain's own suites) → `node tools/rack-deps.mjs --classes --no-write` → `node tools/new-project.mjs --check`
→ THE LOCK ×2 on 9241 if `lab/field.js`, `render-exact.js` or a shader moved → commit → the Closed table below → the handoff's STATE NOW line.

## CLOSED
| Chain | Branch | Merge | Rows | Notes |
|---|---|---|---|---|
| X | it017-x | `` | X1 the law's seat · X2 the restore side · X3 the walk (`X-BUILD.md`, `X-shots/`) | rows inside readouts.js · static-field.js · spectrum.js · persist.js; no new app key; take-in-bugs §3 red at BASE too (STATUS TAGS moved to TEXT › SHOW — re-aim in S); open: MOLECULES' own ×, FIELD's DRIVES/DRAG, LATTICE's empty HAMILTONIAN rows |
| W | it017-w | `` | W1 the pick leaves WAVE alone · W2 the greys (`modeSync`) · W3 the 140 grid (BOX press fixed, the operator-window note row) | `W-BUILD.md`, `W-shots/`; no kit change; open: a disabled seg button keeps no hint (kit `.seg-b:disabled { pointer-events: none }`), SPECTRUM hidden vs folded under MOLECULES |
| R | it017-r | `` | R1 the diamonds (tail gone, mask from the window's side, routed dot in the title bar) · R2 no inner scroll (`lab/pager.js`; shelf · HISTORY 12 · docked FOLDERS 8 tiles) · R3 routeDots on events · call 11 kit hint | kit 1.5.0-alpha.28; R4 waits for DONE-c8; left: `.ro.wide .ro-val` and RENDER's `.sr-lines` scroll (call 14) |
| S (Sos, in-line) | yan-c | `6d7b8a9`, `712f8df` | S1 saves: node project-formats · first-run · history green; browser take-in-bugs (§3 re-aimed) · project-formats · new-project · start green · S2 `tools/menu-check.mjs` (menu whole; CuH · ZnH2 unpictured) · S3 library · molecule-head green; calls 8–10 built | the by-hand round trips are the suites' scenes (start = RESUME, new-project = NEW and rollback, project-formats = save/open) |
