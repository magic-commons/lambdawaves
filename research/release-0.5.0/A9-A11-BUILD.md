# A9–A11 BUILD — the actions table, tests by hook and the kit precache policy (0.5.0 stage A)

Written from `A9-A11-HANDOFF.md` (`15b4d5e`); its first hand-off (`b6dfda6`) supplies the drafted
keyboard paragraph and carried open items. Builder worktree
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a951ee2405b1383e6`, branch
`worktree-agent-a951ee2405b1383e6`, base `12451d2`. The builder merged, pushed, tagged and deployed
nothing. The integrator has since merged A5+A6 and A9–A11 (PLAN). This write-up changes documentation only.

## Ten lines
1. A9: `lab/rack.js` ACTIONS uses the kit's ids where twins exist; `was` lifts old saved bindings.
2. FOLDERS is O; S stays WASD's `pitchDn`; MOD arm is Ctrl+Space. `history` and `keyboard` have no chord.
3. `ctrl: 'Ctrl'` is Control alone; `ctrl: true` is Mod. `group`/`short`/`inFields` are row data.
4. Ten controls carry `data-key-action`; the four old MENUS calls survive through the `ACTIONS.find` fallback.
5. A10: eleven browser suites find windows, menus, rails and rack lists by hook.
6. Four node gates read kit inventory, exports, knob law and rendered announcements; the driver port waits up to 4 s.
7. A11: SKIP is `mir/locales/*.json` and `mir/tokens.json`, read by `pwa.test` and `build-deploy`.
8. Alpha.24 precache: 382 / 9.46 MiB → 369 / 7.33 MiB; 13 files, 2,237,604 B, ship uncached. V1 PASS.
9. Builder tree node 85/85; adopted copy 78/85 → 81/85. Four kit deltas remain; wiring is not cleared by A11.
10. Builder `lab/*.js` 36,280 → 36,244 (−36); integrator A5+A6 and A9–A11 together 36,198 (−82).

## Commits

Messages and stats from the four named `git show --stat` reads; WIP and hand-offs are listed separately.

| commit | message | files | insertions / deletions |
|---|---|---:|---:|
| `308695f` | 0.5.0 A9 · THE ACTIONS TABLE: the kit's ids, the kit's chord spelling, data-key-action, R-K1 | 10 | +179 / −168 |
| `405ec17` | 0.5.0 A10 · TESTS FIND THINGS BY HOOK, the canary's four gate rewrites, the driver-port settle | 20 | +188 / −203 |
| `dc5792a` | 0.5.0 A9 · the kit's windows λWAVES has are rows with no chord (PLAN-DRAFT-1 A9, ADOPTING-1.5 §11) | 3 | +6 / −3 |
| `241b3d3` | 0.5.0 A11 · THE KIT PRECACHE POLICY: the SKIP list beside DATA; two more kit-number pins read from the kit | 5 | +33 / −6 |

`949c4a6` is WIP A10 (three hooks); `b6dfda6` the first hand-off; `15b4d5e` the completed hand-off.
Their stats are not recorded in the hand-off. Commit stats count all changed files, not the `lab/*.js` ledger.

## A9 · THE ACTIONS TABLE

| old id | kit id |
|---|---|
| `play` | `transport.play` |
| `hideUI` | `hide` |
| `keysheet` | `help` |
| `modWin` | `modulation` |

Already the kit's: `fullscreen`, `notebook`, `rack`, `dock`, `save`, `undo`, `redo`.
No twin, no rename: `settings` (MIR OPTIONS is not λWAVES SETTINGS), `redoY` (one chord per λWAVES row),
`notes`, `saveAs`, camera/state rows. `folders` opens/closes the notebook's PROJECTS face. FOLDERS is
**O**: free in both tables, “Open”, a bare window letter, on the right hand away from WASD/QE;
Ctrl+O is the browser's open-file. R-K1 keeps S as `pitchDn` and MOD arm as Ctrl+Space.
`history` and `keyboard` have no chord (ADOPTING §11); either can be bound in the keyboard window.

`lab/keys.js` `installKeys` loads an old saved id through the row's `was`; the next save writes the
new id. `group`/`short` replace `lab/keymap.js`'s KNOWN_SHORTS and id lists; `inFields` on
save/saveAs/settings replaces the dispatcher's KeyS/Comma allowlist. A rebound save carries its
field passage. MENUS is untouched: `keyFor/runAction('play'|'hideUI'|'modWin'|'keysheet')` still works
through the one-line `ACTIONS.find` fallback to `was`; delete it when those four calls are renamed.

`ctrl: 'Ctrl'` is Control alone on `dollyZoomIn`/`dollyZoomOut` and `modArm`; `ctrl: true` is the kit's
Mod (Ctrl or ⌘). `lab/keys.js` `ctrlHeld`, `lab/keymap.js` `ctrlCap` and the recorder,
`lab/shortcuts.js` `ctrlOf` preserve that spelling. Ctrl+Shift+Q/E and Ctrl+Space do not become
⌘⇧Q or ⌘Space. Overlap, reserved keys and explicit-steal laws stay unchanged.

| `data-key-action` control | file | action |
|---|---|---|
| `#rackToggle` | `lab/index.html` | `rack` |
| notebook projects | `lab/index.html` | `folders` |
| notebook close | `lab/index.html` | `notebook` |
| RESET VIEW | `lab/rack.js` | `camReset` |
| OBSERVABLE | `lab/rack.js` | `view` |
| STYLE | `lab/rack.js` | `style` |
| HISTORY UNDO | `lab/rack.js` | `undo` |
| HISTORY REDO | `lab/rack.js` | `redo` |
| PALETTE | `lab/paletteview.js` | `palette` |
| keyboard × | `lab/keymap.js` | `help` |

Ten tagged controls. Left for A5+A6: play (`transport.play`), MOD (`modArm`), home (`home`),
step back (`stepBack`), step forward (`stepFwd`). Left for A4/C3: dock-btn (`dock`), mod-exp
(`modulation`). `native-ui.js` windowInfoSw (`notes`) is untagged.
The browser found A9's `CAM` shadowing boot TDZ; the first hand-off records its fix as `const KG`.
Node stayed green through that bug; the browser caught it.

## A10 · TESTS FIND THINGS BY HOOK

| surface | hook | file |
|---|---|---|
| menu chips | `data-menu` | `lab/menubar.js` |
| keyboard window | `data-mir-window="keyboard"` | `lab/keymap.js` |
| notebook | `data-mir-window="notebook"` | `lab/index.html` |
| modulation window / rail | `data-mir-window="modulation"` / `data-mir-rail="modulation"` | `lab/modwindow.js` |
| add / favourites lists | `data-rack-list="add"` / `"fav"` | `lab/index.html` |

Eleven rewritten browser suites: `frame-occlusion`, `history`, `keyboard-window`, `menubar`,
`latex-copy`, `export3d`, `molecular-names`, `current`, `input`, `molecule-demos`, `new-project`.
Kept on purpose: `#menubar` (the kit owns the id), `#offer` (C9's hook), history's 'ADD LFO'
(inside the kit; no hook), menu rows by label (no kit row hook; `keys.menuItem(id)` comes at C3).

| gate rewrite | measured law |
|---|---|
| `tests/mir.test.mjs` | Namespace imports + USES; §16 checks imported files against `MIR-MANIFEST.json` inventory/hashes and every used name against exports. `labPresetFolders` is a NOTE (ADOPTING §10); the folder clause is guarded. `MOD_STATE_READS` contains 104 and `MOD_STATE_V`; `PRESET_LS` is under `lambdawaves.q0.`. MANDELBROT byte-identity and header-count judges go. |
| `tests/mir-manifest.test.mjs` | Accepts pre-release versions and optional `"line"` equal to major.minor. ACCEPTED sha-256 pin, inventory and hashes stay exact; alpha.24's pin row belongs to C0. |
| `tests/slider-keys.test.mjs` | Measures a constant finer Shift step. Where the law is followed, asserts `.01·keyFine` (1.5 ran 0.00125); otherwise asserts 1.4.3's flat .001 (this tree ran that branch). |
| `tests/access.test.mjs` A8 | Builds a real kit knob through new `tests/helpers/dom-shim.mjs`, gives it a base, drives it, focuses and drives it again; judges the rendered announcement. |

`tests/new-project.test.mjs` now reads `M.BPM_DEFAULT` instead of 60; the documented C0 regeneration
still has to run for 1.5's 30. `tools/gate/drv.mjs` waits up to **4 s** for the driver port to settle.

## A11 · THE KIT PRECACHE POLICY

`lab/sw.js` §1b: `const SKIP = ['mir/locales/*.json', 'mir/tokens.json'];`, plus NEVER_PRECACHE.
`tests/pwa.test.mjs` reads SKIP like DATA, proves it on a **10-path fixture** and states headroom.
`tools/build-deploy.mjs` `NOT_PRECACHED` reads it so skipped files ship in `dist/` uncached.
The design is THE SKIP LIST; “precache what a root reaches” is not built and A11 does not clear wiring.

| alpha.24 copy | entries | bytes | MiB |
|---|---:|---:|---:|
| before SKIP | 382 | 9,924,481 | 9.46 |
| after SKIP | 369 | 7,690,553 | 7.33 |
| skipped, shipped uncached | 13 | 2,237,604 | not recorded in the hand-off |
| untouched tree | 188 | 4,864,170 | not recorded in the hand-off |

Headroom under 8 MiB: **0.67 MiB**. Skipped payload: **12 packs / 1,568,985 B** and
**tokens.json / 668,619 B**. `build-deploy` on the copy: **V1 PASS**, all 13 files shipped by rule,
uncached. The builder kept `.tmp/canary-after/` with this tree's tests restored and `dist/` built there;
this documentation work leaves that copy for A0.

## The alpha.24 canary · seven reds before, four after

The builder copied the tree without `.git`, adopted alpha.24 with the pinned 1.5 worktree's
`adopt.mjs --line 1.5` (196 added, 23 updated, 43 unchanged, `1b7ae99b9905`), regenerated precache and
ran node per suite. **78/85 before on `12451d2` → 81/85 after** on the adopted builder copy.

| gate | before | after | tag / remaining reason |
|---|---|---|---|
| `access` A8 | RED, `baseSaid` | GREEN | A10 · rendered announcement through DOM shim |
| `mir-manifest` | RED, version regex | RED, not an accepted adoption | C0 · preserved forgery pin; alpha.24 ACCEPTED row passes 262 files |
| `mir` | RED, `labPresetFolders` import | GREEN | A10 · exports/inventory judge and documented removal NOTE |
| `new-project` | RED, --check; bpm 60→30 | RED, --check OUT OF STEP | C0 · `node tools/new-project.mjs` makes it green |
| `slider-keys` | RED, .709 | GREEN | A10/A11 · measured kit law or 1.4.3's .001 |
| `wiring` | RED, unreached kit modules | RED, unreached kit modules | R5-W1 · separate policy implementation |
| `pwa` | RED, 9.46 MiB | RED, ceiling passes; kit deltas exposed | D2 / D3 / M10 / font gate · details below |

C0's alpha.24 ACCEPTED row is
`'1.5.0-alpha.24': '3f969725fe44715bb96a42fc56d668defc9b9cfceeb4219d146ecd24cad35351'`.
It was probed in the throwaway, not committed by these seams.

The hand-off calls the residual PWA findings “three kit deltas” but enumerates four:

- D2: `lab/mir/shell/gui.js` contains `https://www.fabiandesmet.com/`, the kit ABOUT's type credit.
- D3: `lab/mir/app.js → ../LICENSE` is dangling.
- M10 / uncached loads: `app.js`, `info/layer.js`, `notes/face.js`, `shell/gui.js`, `shell/transport.js`,
  `window/workspaces.js` import five STAGED shell modules (about, accent, menubar, notebook, wordmark)
  excluded from precache by M10's rule.
- Font gate: fonts/info's **14** new faces are counted as “ours”; the gate expects **3**.

With all four set aside, PWA is GREEN. Those probes were throwaway-only and never committed.
The remaining four node reds are kit deltas, not regex failures of these seams.

## Tests (8767/5237, each browser suite ALONE)

| gate / suite | builder's recorded result |
|---|---|
| node, after each seam | **85/85** |
| `keyboard-window` | GREEN; count **not recorded in the hand-off** |
| `menubar` | **8 GREEN** |
| `frame-occlusion` | **7/7** |
| `history` | **39**, no pause hack; reopened sessions |
| `offer` | **16** |
| `current` | **15** |
| `input` | **13** |
| `latex-copy` | **10** |
| `export3d` | **10** |
| `molecular-names` | **6** |
| `molecule-demos` | **3** |
| `new-project` | **8** |
| `mir-controls` | **2** |

Thirteen browser suites, GREEN. The only red seen was A9's boot TDZ, fixed; no timing red.
These are the builder's results, not fresh test runs by the documentation writer.

## Lines

| tree | `cat lab/*.js \| wc -l` | net from 36,280 |
|---|---:|---:|
| builder base `12451d2` | 36,280 | 0 |
| builder after A9–A11 | 36,244 | −36 |
| integrator after A5+A6 and A9–A11 together (PLAN) | 36,198 | −82 |

Per-seam final line deltas are **not recorded in the hand-off**. The merged total is not the
builder branch total; A5+A6's subtraction is in the integrator's tree too.

## Blockers

None recorded for the completed seams. The four adopted-copy reds above remain work for C0 and the
kit/policy deltas. The builder's gate server on 8767 was killed by pid; nothing of that builder runs.

## Open items

- A4/C3: rename the four MENUS `keyFor/runAction` calls (`play`, `hideUI`, `modWin`, `keysheet`),
  delete the `ACTIONS.find` fallback, tag dock-btn and modulation door mod-exp.
- A5+A6: tag the five transport controls: play, MOD, home, step back/forward.
- C3: the kit splits `?` into `help` and `keyboard` (no key); this needs a ruling.
- `access` A2/A3/A9/A10 still use kit-source regexes.
- `docs/mir-matrix-patch.json` is no longer read by any test (carried in this documentation task;
  the hand-off does not state this fact).
- `native-ui.js` windowInfoSw (notes) remains untagged.

## R5-W1 proposal · taken as the default in PLAN §9

Adopted kit files that nothing reaches are reported and not precached, but do not fail the gate.
This is the builder's R5-W1 proposal, **taken as the default in PLAN §9** after Josh's “defaults,
let's continue”. A11 implements the SKIP list, not that wiring law. The wiring policy remains a
flagged separate commit; the canary's wiring red stays visible until it is implemented.

## CLAUDE.md keyboard paragraph · for the integrator to apply

Quoted from the first hand-off (`b6dfda6`), as directed by the completed hand-off. Insert after
“…only unbind another action after an explicit steal.” CLAUDE.md is not edited here.

> The ACTIONS rows in `lab/rack.js` are the rows MIR's `createKeys` will read: an id is the kit's where the kit has a twin (`transport.play`, `save`, `folders`, `modulation`, `notebook`, `rack`, `dock`, `hide`, `fullscreen`, `help`, `undo`, `redo`) and `was` keeps a binding saved under the old id loading; `group`/`short` feed the keyboard window; `inFields` lets a row run from a text field; a control a row drives carries `data-key-action`. `ctrl: true` is the kit's `Mod` (Ctrl or ⌘); `ctrl: 'Ctrl'` is the Control key alone — Ctrl+Shift+Q/E and the MOD arm (Ctrl+Space) are spelled so, never `Mod` (⌘⇧Q logs a Mac out). S stays WASD's pitch-down; FOLDERS is O (R-K1).

## Exact next step

Claude Sos (integrator, `sos-s0`) merges `sol-a9a11-docs`, then applies the quoted CLAUDE.md keyboard
paragraph. The builder's `.tmp/canary-after/` is left for A0; no throwaway is deleted by this
documentation commit. No merge, push, tag or deploy is performed here.
