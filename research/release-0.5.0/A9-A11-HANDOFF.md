# A9–A11 HANDOFF (0.5.0 stage A) — paused on a usage alarm, 2026-10-08

The builder for seams **A9 · THE ACTIONS TABLE**, **A10 · TESTS FIND THINGS BY HOOK** (and the canary's four gate rewrites)
and **A11 · THE KIT PRECACHE POLICY** of `PLAN-DRAFT-0.md` stopped at a safe boundary. A9 is done and committed; A10 is
half-built (a WIP commit); A11 is not started. Nothing merged, pushed, tagged or deployed.

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a951ee2405b1383e6`
- **Branch:** `worktree-agent-a951ee2405b1383e6`, from `12451d2` (`sos-s0`, 0.4.0 complete)
- **Commits:** `308695f` 0.5.0 A9 · THE ACTIONS TABLE: the kit's ids, the kit's chord spelling, data-key-action, R-K1 ·
  `949c4a6` WIP A10: three of the five window/menu hooks in lab/, no test rewritten yet (paused on usage) · and this file.
- **`cat lab/*.js | wc -l`:** 36,280 before → 36,233 now (−47: keymap.js' 51-row KNOWN_SHORTS and its five id lists moved
  onto the rows as `short`/`group`).

## A9 — done (`308695f`)

**The id map, old → new:** `play → transport.play` · `hideUI → hide` · `keysheet → help` · `modWin → modulation`. Already the
kit's: `fullscreen`, `notebook`, `rack`, `dock`, `save`, `undo`, `redo`. **New row `folders`** (the notebook's PROJECTS face,
open/close) on **O**. Not renamed (no kit twin): `settings` (the kit's `gui` is MIR OPTIONS, not λWAVES' SETTINGS card), `redoY`
(λWAVES' binding shape holds one chord per row; the kit's `redo` holds two), `notes`, `saveAs` and every camera/state row.

**R-K1 (the default):** S stays `pitchDn` (WASD); **FOLDERS takes O** — free in λWAVES' table and in the kit's `KIT_KEYS`
(S M J B T H F ? and I, the kit's held hold-still, which stays free); O is "Open", what FOLDERS does here (FILE › OPEN a
project…); a bare letter like every other window key (M J B T); on the right hand, away from the left hand's WASD/QE/R/C/V
cluster, so a slip while orbiting never opens a window; and not Ctrl+O, the browser's open-file. **MOD arm = Ctrl+Space.**

**The kit's spelling where it costs nothing:** chords were already `event.code`. `ctrl: true` is now documented as the kit's
`Mod` (Ctrl, or ⌘ on a Mac — λWAVES' long-standing fold) and **`ctrl: 'Ctrl'` is the kit's `Ctrl`, the Control key alone**:
the coupled dolly Ctrl+Shift+Q/E and the MOD arm are spelled so, so neither lands on ⌘⇧Q (a Mac's log-out) or ⌘Space
(Spotlight). `lab/keys.js` matches it (`ctrlHeld`) and names it `⌃+` on a Mac; `lab/keymap.js` draws it as the Control cap
(`ctrlCap`) and its recorder writes `'Ctrl'` for a Mac's Control pressed alone; `lab/shortcuts.js` keeps the spelling
(`ctrlOf`). **The laws are unchanged:** overlap is still refused (Ctrl and Mod on one key are ONE chord — off a Mac they are the
same keys), reserved keys still refused, steal only on explicit.

**The lift:** a renamed row carries `was: '<old id>'`; `installKeys` loads a binding saved under the old id onto the new row,
and the next save writes it under the new id (proved through the real dispatcher in node).

**The rows the kit's `createKeys` reads:** `group` and `short` on the rows (the keyboard window's categories and key-cap
names, unchanged on screen); `inFields` on save/saveAs/settings replaces the dispatcher's hard KeyS/Comma allowlist, so a
rebound save takes its passage out of a text field with it.

**`data-key-action`** (the kit's `keys.hints()` target) on: `#rackToggle` (rack), the notebook's projects button (folders)
and close button (notebook) in `index.html`; RESET VIEW (camReset), the OBSERVABLE seg (view), the STYLE seg (style),
HISTORY's UNDO/REDO in `rack.js`; the PALETTE switch (palette) in `paletteview.js`; the keyboard window's × (help).
**Left for A5+A6 to tag** (their transport/clock block :2882–3103): the transport's play (`transport.play`), MOD (`modArm`),
⟲ home (`home`), ‹ (`stepBack`), › (`stepFwd`). **Left for A4** (floating-rack block): the transport's dock button (`dock`) and
the modulation door `mod-exp` (`modulation`). **Not tagged** (native-ui.js, A1+A2's): `ui.windowInfoSw` (`notes`).

**Seams met:** the `modArm` row carries the one-line A5+A6 seam comment (its run() follows the one clock's POWER; the row,
id and Ctrl+Space are A9's). **A9 → A4:** the MENUS table (:3514–4500) was NOT edited — it still calls
`keyFor/runAction('play' | 'hideUI' | 'modWin' | 'keysheet')`; one line after the table makes `ACTIONS.find` fall back to a
row's `was`, so those calls keep working; **delete that line when A4 renames the four calls.**

**Found and fixed before the commit:** a group constant named `CAM` shadowed camera-law's `CAM` inside `boot()` (a TDZ: the lab
never reached ready, `BOOT boot@rack.js:1540:50`); node stayed 85/85 through it — only the browser saw it. Now `const KG`.

**CLAUDE.md** — not edited (an agent's message cannot authorise it). The keyboard paragraph, drafted for Josh: after "…only
unbind another action after an explicit steal." add: *"The ACTIONS rows in `lab/rack.js` are the rows MIR's `createKeys` will
read: an id is the kit's where the kit has a twin (`transport.play`, `save`, `folders`, `modulation`, `notebook`, `rack`,
`dock`, `hide`, `fullscreen`, `help`, `undo`, `redo`) and `was` keeps a binding saved under the old id loading; `group`/`short`
feed the keyboard window; `inFields` lets a row run from a text field; a control a row drives carries `data-key-action`.
`ctrl: true` is the kit's `Mod` (Ctrl or ⌘); `ctrl: 'Ctrl'` is the Control key alone — Ctrl+Shift+Q/E and the MOD arm
(Ctrl+Space) are spelled so, never `Mod` (⌘⇧Q logs a Mac out). S stays WASD's pitch-down; FOLDERS is O (R-K1)."*

## A10 — half-built (`949c4a6`)

**Done:** three of the five lab hooks — `lab/menubar.js` each menu chip `data-menu="<GROUP>"` (the kit's hook); `lab/keymap.js`
the keyboard window's host `data-mir-window="keyboard"` (the kit's id for that window); `lab/index.html` `#notebook`
`data-mir-window="notebook"`. Checked: no 1.5 kit stylesheet selects `[data-mir-window]` (only `modwindow.css`/`modhost.css`
select `[data-mir-rail="modulation"]`, the kit's own rail), so the hooks restyle nothing on an adoption.

**Remains:**
1. `lab/modwindow.js`, after `const rail = buildChipRail(root, {});`: `root.dataset.mirWindow = 'modulation';
   rail.dataset.mirRail = 'modulation';` (1.5's `buildChipRail` sets the rail's itself; chips already carry `data-rail`).
2. Selectors → hooks: `frame-occlusion` (`#modwin` → `[data-mir-window="modulation"]`; `.kwin-chiprail .crail-chip` →
   `[data-mir-rail="modulation"] .crail-chip`; the grip → `[data-rail="drag"]`); `keyboard-window` (`#keymap`); `menubar`,
   `latex-copy`, `export3d`, `molecular-names` (`.mb-btn` by `textContent` → by `dataset.menu`; menubar's `getElementById('keymap')`);
   `history` (`#modwin …`, `#notebook .nb-grip`); `current` (`.kwin-chiprail button` with aria-label `COMPACT` →
   `[data-mir-rail="modulation"] [data-rail="compact"]`; `#notebook`); `input`, `molecule-demos`, `new-project` (`#notebook`).
   Keep and say why: `#menubar` (the kit owns that id), `#offer` (brief 9′'s `[data-mir-offer]` is C9's), history's
   `'ADD LFO'` label (inside the kit's modwindow; no hook exists and `lab/mir` is not ours), menu ROWS by label (the kit's
   menubar has no row hook either; `keys.menuItem(id)` arrives with C3).
3. **The canary's four gate rewrites — none done yet:**
   - `tests/mir.test.mjs`: namespace imports (`import * as H …`) and an import-list judge — every name the suite uses is
     exported by the adopted kit, and a name the kit removed by a guide entry (`labPresetFolders`, ADOPTING-1.5 §10,
     1.5.0-alpha.18) is a NOTE with §22a's folder clause guarded; §16 rewritten: each kit file the suite imports is in
     `MIR-MANIFEST.json`'s inventory with its hash, `MOD_STATE_READS` holds 104 and `MOD_STATE_V`, `PRESET_LS` is under
     `lambdawaves.q0.` — dropping the MANDELBROT byte-identity and the header-count judge.
   - `tests/mir-manifest.test.mjs`: version `^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$`; an optional `"line"` must equal the version's
     major.minor; the ACCEPTED sha pin, the inventory and the hashes stay exact.
   - `tests/slider-keys.test.mjs`: **the brief's premise does not hold on 1.4.3** — 1.4.3's `lab/mir/slider-keys.js` steps a flat
     `.001` on Shift and never reads `setKnobLaw()` (whose `keyFine` is 0.25 there), so "read keyFine" alone is red today.
     Plan: measure the Shift step; assert 0 < step < .01 and constant; turn `setKnobLaw({ keyFine })` and, when the step follows
     the law (1.5), assert step = .01·keyFine exactly; restore the law.
   - `tests/access.test.mjs` A8: assert the rendered announcement (a knob built under a minimal DOM shim, which tests/ does not
     have yet, or the check moved into a browser suite). A2, A3, A9 and A10 are still kit-source regexes (green on 1.5) — open.

## A11 — not started

Rule to add: `lab/sw.js` §1b `const SKIP = ['mir/locales/', 'mir/tokens.json'];` beside `DATA`, with a NEVER_PRECACHE prose
row; `tests/pwa.test.mjs` reads it with the same regex shape as DATA, adds it to its walk's skip predicate, asserts the list,
and proves the rule on a fixture (the paths do not exist on 1.4.3); `tools/build-deploy.mjs`' `NOT_PRECACHED` reads it so
`dist/` carries those files uncached (it already copies every lab/ file). **Measured, not guessed:** `lab/vendor` holds only
`bse/` (three basis-set JSONs); KaTeX and marked live once, in `lab/mir/shell/vendor/` (602,845 B) — not duplicates, so
`mir/shell/vendor/` is NOT on the skip list.

## The canary on alpha.24, BEFORE my seams (the copy is deleted)

`cp -r` of the untouched tree (no `.git`) into `.tmp/canary-before/`, then
`node ~/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs .tmp/canary-before --line 1.5` → *adopted MIR 1.5.0-alpha.24
(1b7ae99b9905): 196 added, 23 updated, 0 removed, 43 unchanged.* (Use the PIN's adopt.mjs: `~/Documents/MIR/tools/adopt.mjs`
is the 1.4.3 kit and refuses `--line 1.5`.)

- **Precache** after `node tests/pwa.test.mjs --write`: **382 entries, 9,924,481 B (9.46 MiB)** — over the 8 MiB ceiling.
  **With the skip list** (14 locale files + tokens.json = 2,244,616 B): **367 entries, 7,679,865 B (7.32 MiB)** — under.
  (Untouched tree: 188 entries, 4,864,170 B.)
- **Node on the adopted copy: 78/85, 7 red** — the same seven as alpha.23: `access` (A8 `baseSaid`), `mir-manifest` (the version
  regex), `mir` (`host.js` does not export `labPresetFolders`), `new-project` (`--check` OUT OF STEP, bpm 60 → 30), `slider-keys`
  (.709), `wiring` (kit modules no root reaches), `pwa` (9.46 MiB). Per the coordinator, `new-project` and `wiring` are the
  kit's deltas (the regeneration step and the allowlist policy are stage C's), not reds of these seams. The AFTER run has not
  been made.

## Tests run

- `bash test.sh node` on the untouched tree: **85/85** (baseline). After A9 (per suite, `.tmp/run-node-suites.mjs`): **85/85**.
  After the WIP hooks: `pwa` green (the rest not re-run; the hooks are attributes only).
- Browser, on 8767/5237, each ALONE: `keyboard-window` **GREEN**; `menubar` **GREEN** (8 PASS, incl. the 33 row groups — the
  MENUS table's old ids through the `was` fallback). A first `keyboard-window` run was red (`__LW.ready` never true) — the
  `CAM` shadowing above, a bug of mine, fixed, then green. No timing red was seen.
- Not yet run: `frame-occlusion` 7/7, `history` 39, `offer` 16, `new-project`, `input`, `mir-controls`, and the other
  suites whose selectors A10 will rewrite.

## Blockers

None open. The one red seen was mine (above).

## Process state

Gate server (`python3 tools/gate/server.py … 8767`, pid 2616719) killed by pid; nothing of this builder runs. Helpers left in
`.tmp/` (gitignored): `run-node-suites.mjs <root> [out]`, `measure-precache.mjs <lab>`, `probe-boot.mjs` (prints ready and
`__e`), `a9/apply_actions.py`. `.certs/` was created by the gate server (ignored).

## Open items

- A4: rename the four MENUS calls to the new ids and delete the `ACTIONS.find` fallback line; tag `dock-btn` and `mod-exp`.
- A5+A6: tag the transport's play, MOD, home, step back/forward; retarget `modArm`'s run().
- At C3 the kit splits λWAVES' `?` into the help view (`help`) and the KEYBOARD window (`keyboard`, no key): a ruling.
- REPORT.md waves (from 193, under `## 2026-10-08 · 0.5.0 A — THE SEAMS`) and `A9-A11-BUILD.md` are not written yet.

## The exact next step

In the worktree: add the two `lab/modwindow.js` hooks, run `node tests/pwa.test.mjs --write`, rewrite the selectors listed
under A10 → Remains 2, run `bash test.sh node`, then the browser suites one at a time on 8767/5237 with 4 s between (keyboard-window,
menubar, frame-occlusion, history, current, input, latex-copy, export3d, molecular-names, molecule-demos, new-project, offer,
mir-controls) and commit A10's hooks; then the four gate rewrites (commit); then A11 (commit); then the canary AFTER run
(`cp -r` to `.tmp/canary-after/`, adopt alpha.24 from the pin, `--write`, `node .tmp/run-node-suites.mjs .tmp/canary-after`,
`node .tmp/measure-precache.mjs .tmp/canary-after/lab`), delete the copy; REPORT.md waves; `A9-A11-BUILD.md`.
