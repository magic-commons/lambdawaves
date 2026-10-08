# A9–A11 HANDOFF (0.5.0 stage A) — second usage pause, 2026-10-08

**All three seams are built and committed.** What remains is paperwork: REPORT.md waves (from 193) and
`research/release-0.5.0/A9-A11-BUILD.md`, then deleting the throwaway. Nothing merged, pushed, tagged or deployed.

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a951ee2405b1383e6`
- **Branch:** `worktree-agent-a951ee2405b1383e6`, from `12451d2`
- **Commits:** `308695f` A9 · THE ACTIONS TABLE · `949c4a6` WIP A10 (three hooks) · `b6dfda6` first hand-off ·
  `405ec17` A10 · TESTS FIND THINGS BY HOOK, the four gate rewrites, the driver-port settle · `dc5792a` A9 · the kit's
  windows as rows with no chord · `241b3d3` A11 · THE KIT PRECACHE POLICY (the SKIP list) · and this file.
- **`cat lab/*.js | wc -l`:** 36,280 → 36,244 now (−36).
- **Gate server** (8767) killed by pid; nothing of this builder runs.

## A9 (done)
Id map old → new: `play → transport.play`, `hideUI → hide`, `keysheet → help`, `modWin → modulation`; already the kit's:
`fullscreen, notebook, rack, dock, save, undo, redo`; new rows `folders` (O), `history` and `keyboard` (no chord, ADOPTING
§11). **FOLDERS = O** (free in both tables; "Open"; right hand, off WASD/QE; not Ctrl+O). R-K1: S stays `pitchDn`; MOD arm
Ctrl+Space. `ctrl: 'Ctrl'` (Control alone) on dollyZoomIn/Out and modArm, `ctrl: true` = the kit's Mod. `was` lifts old saved
ids. `group`/`short`/`inFields` on the rows (keymap.js' KNOWN_SHORTS and id lists deleted). MENUS (A4's block) untouched:
`ACTIONS.find` falls back to `was` — delete that line when A4 renames keyFor/runAction('play'|'hideUI'|'modWin'|'keysheet').
data-key-action on #rackToggle, the notebook's projects/close buttons, RESET VIEW, OBSERVABLE, STYLE, PALETTE, HISTORY
UNDO/REDO, the keyboard ×. **For A5+A6 to tag:** play, MOD, home, step back/forward (transport block). **For A4:** dock-btn,
mod-exp. **Untagged:** native-ui.js windowInfoSw (notes). CLAUDE.md NOT edited (drafted paragraph in the first hand-off).

## A10 (done)
Hooks: data-menu (menubar.js), data-mir-window keyboard/notebook/modulation, data-mir-rail="modulation" (modwindow.js),
data-rack-list add/fav (index.html). 11 browser suites find by hook. Kept: #menubar (kit's id), #offer (C9),
history's 'ADD LFO' label (inside the kit), menu rows by label (no kit row hook). The four gate rewrites:
- `mir.test`: namespace imports + USES list; §16 = the imported modules are the manifest's files, every used name is exported
  (labPresetFolders = NOTE, ADOPTING §10), MOD_STATE_READS ∋ 104 and MOD_STATE_V, PRESET_LS under lambdawaves.q0.
- `mir-manifest`: pre-release + "line" accepted; the ACCEPTED sha-256 pin untouched.
- `slider-keys`: Shift step measured; follows the law → .01·keyFine (1.5 ran: 0.00125); else 1.4's .001 (this tree ran that).
- `access` A8: a real kit knob in `tests/helpers/dom-shim.mjs` (new), its rendered announcement judged.
Also `new-project.test` reads `M.BPM_DEFAULT` instead of a pinned 60. `tools/gate/drv.mjs`: the port waits up to 4 s.

## A11 (done) — design: THE SKIP LIST
`sw.js` §1b `const SKIP = ['mir/locales/*.json', 'mir/tokens.json'];` (+ NEVER_PRECACHE row); `pwa.test` reads it like DATA,
fixture of 10 paths, states headroom; `build-deploy` NOT_PRECACHED reads it. "Precache what a root reaches" NOT built.
R5-W1 for Josh (no code): adopted kit files that nothing reaches are reported and not precached, but do not fail the gate.

## The throwaway alpha.24 canary — copy KEPT at `.tmp/canary-after/` (tests restored to this tree's; dist/ built there)
Recipe: cp -r of the tree (no .git) → `node ~/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs .tmp/canary-after
--line 1.5` (196 added, 23 updated, 43 unchanged, 1b7ae99b9905) → `node tests/pwa.test.mjs --write` → per-suite node run.
- **Precache:** before (no rule) 382 entries, 9,924,481 B (9.46 MiB) → with the SKIP 369 entries, 7,690,553 B (7.33 MiB),
  0.67 MiB headroom; 13 skipped files 2,237,604 B (12 packs 1,568,985 + tokens.json 668,619). Untouched tree 188 / 4,864,170.
- **Node BEFORE the seams (12451d2): 78/85**, 7 red: access A8, mir-manifest (regex), mir (labPresetFolders import),
  new-project (--check, bpm 60→30), slider-keys (.709), wiring (unreached kit modules), pwa (9.46 MiB).
- **Node AFTER (this tree): 81/85**, 4 red, each a kit delta, none a regex of these seams:
  `mir-manifest` — "MIR 1.5.0-alpha.24 … not an accepted adoption" (the forgery pin; with C0's row
  `'1.5.0-alpha.24': '3f969725fe44715bb96a42fc56d668defc9b9cfceeb4219d146ecd24cad35351'` it passes 262 files);
  `new-project` — --check OUT OF STEP (C0's documented `node tools/new-project.mjs`; after it, green);
  `wiring` — unreached kit modules (R5-W1); `pwa` — ceiling PASSES, then three kit deltas the ceiling had hidden (probed in the
  throwaway only, never committed): D2 `lab/mir/shell/gui.js: https://www.fabiandesmet.com/` (the kit ABOUT's type credit);
  D3 `lab/mir/app.js → ../LICENSE` dangling; uncached loads — 1.5 modules (app.js, info/layer.js, notes/face.js, shell/gui.js,
  shell/transport.js, window/workspaces.js) import the five STAGED shell modules (about, accent, menubar, notebook, wordmark)
  that M10's rule keeps out of the precache; and the font gate counts fonts/info/'s 14 new faces as "ours" (expects 3). With
  all four set aside pwa is GREEN. build-deploy on the copy: V1 PASS, the 13 skipped files shipped by rule, uncached.

## Tests
node 85/85 on the tree after each seam. Browser, each ALONE on 8767/5237: keyboard-window GREEN, menubar 8 GREEN,
frame-occlusion 7/7, history 39 (no pause hack; reopened sessions), offer 16, current 15, input 13, latex-copy 10,
export3d 10, molecular-names 6, molecule-demos 3, new-project 8, mir-controls 2. One red seen, mine and fixed (A9's `CAM`
shadowing → boot TDZ). No timing red.

## Exact next step
Write REPORT.md waves 193–198 under `## 2026-10-08 · 0.5.0 A — THE SEAMS` (append at the END; heading if absent) and
`research/release-0.5.0/A9-A11-BUILD.md` from this file (include R5-W1 and the drafted CLAUDE.md paragraph), commit;
then `rm -rf .tmp/canary-after` (or leave it for A0 and say so).
