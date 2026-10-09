# C0 · THE BARE ADOPTION — build hand-off (2026-10-08, the C0 builder and its continuation, Opus 5.5)

**In ten lines.** λWAVES now runs on MIR **1.5.0-alpha.24** (`1b7ae99b9905`), adopted by the 1.5 worktree's own `adopt.mjs` and pinned
(its manifest sha-256 in `ACCEPTED`). The cascade is `@layer app, mir;` + `mir/mir.css`, with λWAVES' two sheets unlayered after it;
five twin `:not(:where())` rules keep the 1.4.3 winner where the layers would have made a losing app rule live. The seven stylehash
classes carry PLAN §9's default (five take the kit's, two keep λWAVES' disconnected head), each written up for Josh in
`C0-GLASS-RULINGS.md` with its screenshots. `new-project` is regenerated (bpm 60 → 30). R5-W1: 114 kit modules no root reaches are reported,
not precached and not failed. The keyboard editor's stacking (two rules 1.5 dropped from `base.css`) is λWAVES' own in `lab.css`;
`mir-controls` is re-aimed to 1.5's ONE KNOB LAW. Node **85/85**, browser **27/27** (25 in the canary + the two fixed, re-run).
`lab/*.js` **36,288 → 36,361 (+73, all generated `sw.js`)**; no app JS changed and no `__LW` member is touched. The ms/s pair: see §ms/s.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ae28efe993cf25783` (the continuation; the first builder's was `agent-a34f1eb47fe65acfb`) |
| branch | `worktree-agent-ae28efe993cf25783`, reset to the first builder's tip `07b03d7`; that branch began at `7044f37` (the `sos-s0` pre-C tree) |
| `42b7631` | THE BARE ADOPT: `adopted MIR 1.5.0-alpha.24 (1b7ae99b9905): 196 added, 23 updated, 0 removed, 43 unchanged` |
| `49cf802` | THE CASCADE: `@layer app, mir;` then `mir/mir.css`; five twins; the 37 `!important` kept unlayered |
| `ce5b2e1` | hand-off |
| `7c049ed` | THE PIN, NEW-PROJECT at bpm 30, R5-W1 |
| `858515e` | THE GLASS DEFAULTS (classes 4 and 6 keep λWAVES' look; the `--glass-shadow-flat` bug) |
| `a46260f` | `C0-GLASS-RULINGS.md` + 16 PNGs in `c0-glass/` |
| `07b03d7` | hand-off at the manual pause |
| `e99375b` | THE KEYMAP RULES (`lab.css`), `keyboard-window` green; `c0-glass/keyboard-{before,after}.png` |
| `ad0b4dc` | `mir-controls` re-aimed to the ONE KNOB LAW (the test alone) |
| `88fedce`, `1dc3a08` | hand-offs after steps 2 and 3 |
| the docs commit | this file + REPORT.md wave 196 |

## The cascade, the pin, R5-W1

- **`lab/index.html`.** The kit's four 1.4.3 `<link>`s, which sat around ours, become `<style>@layer app, mir;</style>` + `<link mir/mir.css>`
  (every kit sheet in its tested order), then `lab.css` and `skin.css` unlayered, then KaTeX. Wave 64's "modwindow.css last" is retired, by rank.
  `@layer app` is declared and holds nothing: a normal declaration in `app.*` ranks BELOW the kit, so a layer cannot keep a look the kit paints.
  The stylehash of the link change alone is **0** element-properties (closed and with the modulation window open).
- **The five twins** (dead-now-live, found by mapping, through CDP, every property both sides declare on every visible element in 4 states with the window open,
  plus the notebook): the frost `.dev/.glass` veil (not in the dark theme, not on `#modwin`); `#modwin .m2workbar button` against the tempo
  pill's grid; `.dock-btn > svg` 13 px; `.reg-bar .sel` flex; `.reg-morph` justify. A re-map shows 0 dead-now-live and 0 live-now-dead.
- **The pin (R5-G1).** `tests/mir-manifest.test.mjs` `ACCEPTED` gains `'1.5.0-alpha.24': '3f969725…5351'`; the 1.4.3 row stays. adopt
  `--check` (`node ~/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs <tree> --check`) prints "in step with MIR 1.5.0-alpha.24" (exit 0).
- **new-project.** One line: `"bpm": 60 → 30`. The kit's `BPM_DEFAULT` and the plan agree. `--check` is in step (16,889 B).
- **R5-W1.** `wiring.test.mjs` §6b reports an unreached kit `.js` (it is not failed) and asserts it is absent from the precache. λWAVES' own modules keep the hard
  gate. The five dated ALLOWLIST rows retire. `--unreached-kit` prints the set, which is **114** modules, the consumers C1–C9 will wire. `pwa.test.mjs` and
  `tools/build-deploy.mjs` read that set, and the CSS walk follows the `<link>`s and their `@import`s.

## The seven classes (PLAN §9's default; Josh rules each one from `C0-GLASS-RULINGS.md` and its pictures)

| # | class | closed rack, element-states over 8 states (elements) | originator | default applied |
|---|---|---|---|---|
| 1 | press-scale transition | 816 (102) | BASINS: INTENT S1, from the modulation window's `.m2macadd` | **the kit's** |
| 2 | box-shadow | 456 (57) | BASINS: INTENT "one light, from above"; the value tip at menu height (O4) | **the kit's**, plus a bug fixed: `--glass-shadow-flat` → `--glass-shadow` (the docked cards had lost their shadow) |
| 3 | focus outline (`.k-val`) | 224 (28) | λWAVES' 1 px seat ring, which the kit kept and re-seated as an outline (O10) | **the kit's** (it looks the same on screen) |
| 4 | `.dev-head` background | 80 (10) on the bare adopt, **0 after** | λWAVES: the disconnected head's lighter fill | **λWAVES'**: lab.css §G, three 1.4.3 rules verbatim, unlayered, first |
| 5 | ON text-shadow | 132 (21) | BASINS: the ON law (O5); no emboss under glass (O3) | **the kit's** |
| 6 | backdrop-filter | 80 (10) on the bare adopt, **0 after** | λWAVES: the same head's brightness/saturate lift | **λWAVES'**: the same §G rules |
| 7 | border (`.dev-power`) | 80 (10) | Josh, 2026-10-07, for the kit, after BASINS' `.m2pow` | **the kit's** |

"Take the kit's" for 4 or 6 means deleting that class's lines in lab.css §G; nothing else depends on them. The riders and the modulation window's own drift
(R13, which C4 owns) are in the rulings file.

## The twelve `!important` drop candidates — NOT dropped

There are 37 `!important` on this tree (lab.css 13, skin.css 24). None meets a kit `!important` with a different value. Twelve exist only because they had to beat
1.4.3's unlayered kit on specificity:
- `lab.css:185` `.picker, .pk-n { background: transparent !important; box-shadow: none !important; }` (2);
- skin.css's info popover, 10 flags: `:299` `display: none`, `:303–306` border / background / box-shadow / two backdrop-filters, `:310–312`
  the light theme's border-color / background / box-shadow, and `:396` `position: fixed`.

**Why they stay.** Under `@layer app, mir;` an unlayered normal declaration already beats every layered kit declaration, so these twelve flags now do nothing
against the kit. Dropping them is a subtraction for later, not part of the bare adoption, for three reasons:
- **The flag still ranks them against our own rules.** Unflagged, each one could lose to a more specific or later app rule, or to an inline style, that the flag beats today.
- **Nothing measured covers them.** No captured state shows them: stylehash does not open popovers, and neither the `.picker` nor the info popover is open in the closed, modulation or notebook states. A zero-change drop needs a probe with the popover open and a picker shown.
- **Keeping them changes nothing visible.**

None goes into an `app.*` layer either, because a layered `!important` would outrank the 36 unlayered ones. The other 25 are app against app, against an inline style
(`#notebook` phone geometry) or reduced motion, so they stay.

## The keyboard editor (`.km-*`) — two rules moved, nothing twinned

- **The break.** MIR 1.4.3's `base.css:381–382` stacked λWAVES' own `#keymap`, and 1.5 has no such rule. The pane fell under `#rackL` (z 30), and
  `keyboard-window`'s drag point hit `canvas.shadow-c`.
- **The fix.** The two rules now live in `lab.css` beside the pane's own `pointer-events: none`, as λWAVES' own:
  `#keymap { position: fixed; inset: 0; z-index: var(--z-veil); display: flex; flex-direction: column; pointer-events: none; }` and
  `#keymap[hidden] { display: none; }`. `--z-veil` is still the kit's token on 1.5 (`mir/css/base.css:65`, 40). 1.4.3's `@keyframes km-pulse` had no
  consumer and was not carried.
- **The kit's `keyboard/keyboard.css`** (all `mir.kit.house`) still styles our pane through its bare `.km-*` classes. It was measured three ways:
  - `kmdiff` in the gate Firefox, over all 788 pane elements;
  - a pane shot with a clip test and a real-pointer hover;
  - a stylehash pair with the keymap open: 8 states, 1,521 elements each.
- **Nothing breaks the editor.**
  - The 315 key children with `pointer-events: none` hand the pointer to their `.km-key` button, which owns every handler (`keymap.js:402–408`) and the `title`.
  - `user-select: text` on the search box is an input's default anyway.
  - `touch-action: pan-y` on the list keeps the vertical scroll.
  - `overflow: hidden` on 114 labels and chip rows clips nothing (scroll = client).
- **What it changes visibly** (`c0-glass/keyboard-{before,after}.png`):
  - an accent LED dot (`.km-key-bound::after`) on each of the 42 bound keys;
  - the list's scrollbar, from Firefox's white track to the kit's groove;
  - a hairline on the unbound legend dot;
  - classes 1, 2 and 5, reaching the pane as they reach the rack.

  These are **C3's input**: under R5-S3 the KEYBOARD skin stays λWAVES', and C3 rewrites the editor onto the kit's window.

## The canary

- **Node:** `bash test.sh node` exits 0, **85/85** suites. A0's bare adopt had 7 red; the C0 canary and this final tree are both 85.
- **Browser:** **27/27**.
  - The second canary (`a46260f`, 8783/5253, one at a time, 4 s apart) gave 25 green and 2 red. The 25: `camera-shift`, `chem` 55,
    `current`, `export3d`, `field-molecule`, `frame-occlusion`, `gpu-recovery`, `history`, `input`, `latex-copy`, `lfo-tension`, `library`, `menubar`,
    `molecular-diff` 15, `molecular-names`, `molecule-demos`, `new-project`, `offer` 16/16, `official-defaults-palette`, `orbitals` 24,
    `register` 17, `render-regressions`, `routed-knob` 4, `stage-text`, `take-in-bugs`.
  - The two reds were fixed, and on the final tree `keyboard-window` 1/1, `mir-controls` 2/2, `frame-occlusion` 7/7 and `menubar` pass.
  - The continuation's edits are a `#keymap`-only CSS rule and one test, so the other 23 were not re-run.
- **`mir-controls`:** the old test is green on the base copy; the re-aimed test is green here and red on the base copy at its sideways line
  (`0.5 != 0.25`), so it pins the 1.5 law:
  - vertical drag: 220 px of rise is a full scale, 320 px under a finger, and sideways motion is ignored;
  - the ⅛ gear on a knob drag, a fader drag (a fifth on 1.4.3) and a Shift arrow (a quarter on 1.4.3).
  - The app passes no `dragAxis`, so every λWAVES knob now drags vertically.

## Precache

| | entries | bytes |
|---|---|---|
| base `7044f37` | 191 | 4,874,333 (4.65 MiB) |
| C0 | **263** | **5,900,325 (5.63 MiB)** |

- The 8 MiB ceiling leaves 2.37 MiB of headroom.
- The bare adopt alone would have precached 372 entries (7.34 MiB). R5-W1's 114 unreached kit modules are deployed but not precached.

## ms/s

THE PAIR: pending, step 5 (filled in below when it is run).

## Lines and the `__LW` law

- `cat lab/*.js | wc -l`: **36,288 → 36,361 (+73)**. All of it is `sw.js`: the generated table grew from 191 to 263 entries, plus the one R5-W1 row.
- Since `7044f37` the only app files changed are `index.html`, `lab.css`, `skin.css`, `new-project.lambdawaves.json` and the generated `sw.js`. No app `.js`
  changed, so no `__LW` member is renamed or removed.

## Brief candidates for MIR (nothing edited under `lab/mir/`)

1. **Scope `keyboard/keyboard.css`** to the kit's own window (`.km-win`, `.km`, `.km-help`), as its values block already is. Today its bare
   `.km-*` classes land on any app DOM that shares the names: the LED dot, the scrollbar and the legend hairline land on λWAVES' pane.
2. **ADOPTING-1.5 should list the app rules `base.css` dropped.** `#keymap` and `#keymap[hidden]` stacked an app's own pane. Without a line saying
   "these are the app's now", C0 broke `keyboard-window`.
3. **`--glass-shadow-flat`** was removed as "read by nothing", but λWAVES read it, so every docked card lost its shadow. Removals of tokens should be
   checked against the adopters, or kept one line as an alias for a release.
4. **stylehash's token scan** does not descend into `@import` (`CSSImportRule.styleSheet`). Behind `mir/mir.css`, the token TEXT reads "undefined",
   though no element is affected.

## Blockers

None.

## Open items

- Josh's seven rulings, the keyboard pair among the pictures. The integrator relays them.
- The twelve `!important` drops wait for a probe with the popover open (above).
- C3 makes the KEYBOARD skin λWAVES' under R5-S3. Its inputs are the LED dot, the scrollbar and the legend hairline.
- Every knob now drags vertically (the ONE KNOB LAW). Josh will feel this the first time he turns a dial sideways.

## Exact next step

The integrator, Claude Yan, merges `worktree-agent-ae28efe993cf25783` onto `yan-c`. Then `node tests/pwa.test.mjs --write`, `bash test.sh node`,
`keyboard-window`, `mir-controls` and `frame-occlusion`.
