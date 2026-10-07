# MIR 1.5 CANARY

**What this is.** `PLAN.md` §3 B0.5. A throwaway worktree takes a REAL MIR 1.5 adoption from the kit pin
(`node tools/adopt.mjs <app> --line 1.5`, not a dry run), boots, runs the gates, and logs ONE row of what went red.
Nothing from the adoption is ever committed: the adopted tree is reverted (`git checkout -- .`, `git clean -fd lab`)
before this file is written, so λWAVES stays on MIR 1.4.3. The row decides which seams enter 0.4.0 and turns 0.5.0's
adoption into a diff of known deltas. A red is a row, not a task; nothing here was fixed.

**When it runs.** Now (alpha.23) and once more at the `1.5.0` cut. Never per alpha: the target moves (R15) and a
per-alpha canary would be a per-alpha chore.

**What it is not.** A bare adopt changes the kit's files only; no λWAVES code calls a new kit entry point. So it measures
what the KIT'S BYTES do to an app that has not migrated (styles, strings, defaults, the manifest, the cache), and it
cannot confirm or refute a risk that lives in the migration itself (R1, R3, R6, R8, R10, R14 ride on rack.js being cut over).

## The table

| date | pin | files added / removed / changed | boots? | node reds (suite: first message) | browser reds | stylehash Δ | precache bytes before → after | risks confirmed | risks refuted |
|---|---|---|---|---|---|---|---|---|---|
| 2026-10-07 | MIR `1.5.0-alpha.23` (`0f5c7f9`); manifest `1.4.3` (`2e6b85a`) → `1.5.0-alpha.23`, `"line": "1.5"` | **+196 / −0 / ~23** (+ `MIR-MANIFEST.json`); 43 unchanged. `lab/mir` 56 → 234 files, 1.54 → 6.34 MB; `lab/fonts` 10 → 28 files (`fonts/info/` Spectral, Playfair Display, Alegreya SC), 0.13 → 0.45 MB | **YES.** Stylehash `--gpu 1` reached `__LW.ready && #controlHelp` in 8 of 8 states with 595 elements each (same as before) and an empty console log; all three Firefox suites reached `ready` | **82 → 75 pass, 7 red** (baseline 82/82). `mir-manifest`: version `'1.5.0-alpha.23'` fails `/^\d+\.\d+\.\d+$/` · `mir`: `host.js` does not export `labPresetFolders` · `new-project`: `--check` OUT OF STEP (one line: bpm 60 → 30) · `slider-keys`: Shift-ArrowDown left `masterDepth` ≠ .709 · `access`: A8 `baseSaid:false` · `wiring`: 109 modules no root reaches · `pwa`: precache 9.46 MiB over the 8 MiB ceiling | **none: 3 / 3 green** (`frame-occlusion` 7 blocks, `history` 39, `new-project` 8; ports 8737 / 5207) | **1 172 element-state diffs** over 8 states (136–150 of 595 elements per state, 23–25 %; 0 gone, 0 new), 235 token-text diffs (16 tokens), **1 165 pixels** beyond noise, all in 2 of 8 states (196 `dark-refractive-on`, 969 `light-tinted-on`) | **205 → 399 entries; 4 858 652 → 9 917 132 B** (4.63 → 9.46 MiB, +104 %); `mir/` 1.11 → 5.85 MB | R4, R5, R11, R12, R13 (file drift only), R15 | R1, R3, R9 (for a bare adopt only; they stay open for the migration); ADOPTING §1 and §2 not hit |

Raw logs: `research/release-0.4.0/canary/` (`00-baseline`, `01-adopt` + `01a`–`01e`, `02-node` + `02b`/`02c`, `03-browser`,
`04-stylehash-*`). The adopted tree was served from this worktree,
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a6bf03e4f65099a58` (branch
`worktree-agent-a6bf03e4f65099a58`, started at `61f7c2c`).

## What the reds mean

Each node red is the FIRST assertion of its suite; a suite that dies at an import or its first assert hides the rest
(`mir` and `mir-manifest` especially).

1. **`pwa`: precache 9.46 MiB, over the 8 MiB ceiling.** R4 confirmed exactly as the survey said. The kit has no service
   worker and no precache; `node tests/pwa.test.mjs --write` listed 194 new files (399 entries) and re-hashed 16. Without
   `--write` the suite fails first on "194 file(s) in lab/ are NOT precached". `locales/*.json` (14 files, about 1.57 MB)
   and `tokens.json` (0.67 MB) are the survey's "lazy / dev data" files: leaving both out gives about 7.68 MB, **7.3 MiB,
   under the ceiling**. So 0.4.0's cut is a precache policy (skip list or fetch on demand, in the spirit of wave M10's
   "derived from the allowlist"), not a bigger ceiling.
2. **`wiring`: 109 modules under `lab/` no root reaches.** R4 again, and ANTI-PATTERN 17. Of the 132 new `.js` files, 23
   are reached through the 23 updated kit files' own imports (152 files reached, was 129); the other 109 are new kit
   modules (`timeline` 27, `shell` 23, `core` 11, `panels` 10, `render` 9, `folders` 7, `modulation` 6, ...), all of them
   precached "for nothing" once `--write` ran. None of the 56 pre-adopt kit files became unreachable. The 7 existing
   allowlist rows (staged 2026-09-21) print `OVERDUE` on the untouched tree too; that is not an adoption delta.
   Either the adoption ships only what a migrated rack.js imports, or the allowlist grows by a named caller per module.
3. **`mir-manifest`: the version regex `^\d+\.\d+\.\d+$`.** R12, expected: it rejects any pre-release. It goes green at
   the `1.5.0` cut; its inventory and hash asserts (below the first line) were not reached. The manifest also gains
   `"line": "1.5"` (docs/LINES.md).
4. **`mir`: `host.js` does not export `labPresetFolders`.** ADOPTING-1.5.md §10 ("Names removed in 1.5.0-alpha.18"),
   also R12. The whole suite dies at the import, so §16 (vendored `mod.js` / `curve.js` byte-identity) was NOT run.
   What is known from the file list: `mod.js`, `host.js`, `registry.js` changed; `curve.js` and `curve-gesture.js` did
   not. The gate must be rewritten against the kit's inventory, as R12 says, not bypassed.
5. **`new-project`: `--check` OUT OF STEP.** R11 confirmed and the delta is one line: the empty project's
   `modulation ... "bpm": 60` becomes `30` (the kit's new tempo default; the guide's §13 makes rack and tempo project
   parts but never states the 60 → 30 move). `node tools/new-project.mjs` rewrote it that way and was reverted.
   `tests/new-project.browser-test.mjs` stays green on the adopted tree because its file comparison covers the 20
   non-modulation keys.
6. **`slider-keys`: Shift-ArrowDown from .71 leaves `masterDepth` ≠ .709.** NOT in ADOPTING-1.5.md and not in R1–R15:
   the kit's `slider-keys.js` is now `step = .01 * setKnobLaw().keyFine` (Shift is the kit's one fine gear, an eighth,
   alpha.13; it was a flat .001) and gained a `reset` option (Delete / Backspace). New finding for the guide; the test
   pins a number the kit no longer promises.
7. **`access` A8: `baseSaid:false`.** NOT in the guide or R1–R15 either (the nearest is §6 "English keys changed").
   `kit.js` now builds the announcement as `tx('{value} · base · modulated', { value })`, so a source-text regex on
   `' · base · modulated'` no longer matches; the behaviour is unchanged. 1 of 11 failing; the other ten are green. This is
   the class of test (a regex over kit source) that the survey's seam 10 ("tests that find things by hook") should retire.
8. **Browser 3 / 3 green.** Not a pass on the migration. `frame-occlusion` finds `#modwin .m2rail/.m2dev/.m2workbar` and
   `.kwin-chiprail .crail-chip` still in place and masks them (R1 and R9 untouched by a bare adopt; ADOPTING §1 and §2
   are not hit: no `lab/*.js|css` selects on "window controls" or sets `dataset.ink`; `rack.js:3346` keys on the
   unchanged classes). `history` drives real LFO curve edits, ADD LFO and a route drag through the updated kit
   modwindow and passes (R3's ring is the app's own, not the kit's yet). `new-project` passes the settings-byte-identity
   and rollback blocks (R2's invariant holds while no kit store is written).
9. **Stylehash: about a quarter of the visible elements change with no code of ours.** R5 and R13. The recipe is the pin
   README's λWAVES line (`--gpu 1`, ready on `#controlHelp`, 8 states, two before-captures as the noise, served over
   plain http because `cdp.mjs` does not ignore a self-signed cert). Beyond noise: `transition` gaining `scale 0.12s` on
   segment buttons (552, the kit's press scale), `box-shadow` (448), a focus-style `outline` on `.k-val` (3 x 184,
   candidate for ADOPTING §3), `background-color` on `.dev-head` (165: `rgba(255,255,255,.043)` → `rgba(28,32,38,.84)`),
   ON-state `text-shadow` glow (132), `backdrop-filter` none on `.dev-head` and `border` 1px → 0 on `.dev-power` (64
   each); in `#rack` 728, `#rackL` 296, `#stage` 148. BASINS' first look was 192 elements; 136–150 per state is the same
   order, and the same remedy (INTENT rulings, `app.*` layers, twin `:not(:where())` rules) applies. Gap in the recipe: the
   matrix never opens the modulation window or the notebook, so `modhost.css` / `modwindow.css` (R13's drift) are
   unmeasured by it.
10. **R15 confirmed on the day.** The survey was written on alpha.22 (`32d7b88`; `lab/mir` 56 → 233 files); the pin the
    canary adopted is alpha.23 (`0f5c7f9`; `lab/mir` 56 → 234, so one file more). The pin moved between the survey and
    the first canary, as the survey warned; the size of that move was small this time, and nothing says it stays small.

## Seams this row puts into 0.4.0

- A **precache policy** for kit files (skip `locales/` and `tokens.json`, or fetch on demand) before any adoption lands.
- The **gates that pin kit bytes or kit source text** (`mir.test` import list and §16, `mir-manifest`, `access` A8,
  `slider-keys`) rewritten against behaviour or the manifest, so 0.5.0's adoption is not a red-by-regex list.
- `tools/new-project.mjs` re-run as a step of the adoption (bpm 60 → 30), not a surprise.
- To the MIR session, for `ADOPTING-1.5.md`: the default BPM 30, the `keyFine` gear and the `reset` key on
  `bindSliderKeys`, and `tx()`-built strings are behaviour changes with no entry.
- A stylehash recipe that opens the modulation window and notebook (the λWAVES line of the pin README stops at the
  closed rack).

## Method notes

- Baseline on the untouched tree: node 82 / 82 green; precache 205 entries, 4 858 652 B; stylehash `before` and
  `before2` on `http://127.0.0.1:8737`. The node loop is `test.sh node`'s own (all `tests/*.test.mjs`, `pwa` last), run
  per suite so each red keeps its first message; the 30-line cap per red is why `02-node.log` ends with the full first
  assertions.
- The adopt accepted `--line 1.5`. Its whole stdout: `adopted MIR 1.5.0-alpha.23 (0f5c7f9a7350): 196 added, 23 updated,
  0 removed, 43 unchanged`.
- Browser suites ran one at a time on `LW_PORT=8737`, `GD_PORT=5207`; the stylehash server and the gate server were
  killed by pid. Only the three suites the brief names were run; the other browser suites (`current`, `input`,
  `keyboard-window`, `mir-controls`, `official-defaults-palette`, `lfo-tension`, ...) are not in this row.
