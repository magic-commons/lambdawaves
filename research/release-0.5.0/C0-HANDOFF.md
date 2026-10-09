# C0 · THE BARE ADOPTION — HAND-OFF (in progress)

Written 2026-10-08 by the C0 builder (Opus), at a safe boundary between the cascade and the pin. The brief is the
spawn prompt; PLAN §2 C row C0 is the spec.

## Where
- Worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a34f1eb47fe65acfb`
- Branch: `worktree-agent-a34f1eb47fe65acfb`, from `7044f37` (the `sos-s0` pre-C baseline).
- **Recreated once.** After the first usage pause, both the worktree and the branch were gone; they had most likely
  been auto-cleaned because they were unchanged. The session's cwd was left in the integrator's `sos-s0`, which was
  never touched and never reset. I recreated the worktree with
  `git -C ~/Documents/LAMBDAWAVES worktree add -b worktree-agent-a34f1eb47fe65acfb <path> 7044f37`.
- Nothing is pushed, merged, tagged or deployed. No server is running (8783 and 8787 were stopped by pid).

## Commits
| commit | what |
|---|---|
| `42b7631` | THE BARE ADOPT, by the 1.5 worktree's tool. `adopted MIR 1.5.0-alpha.24 (1b7ae99b9905): 196 added, 23 updated, 0 removed, 43 unchanged`. `lab/mir` + `lab/fonts` went 66 → 262 files; `lab/mir` 1,544,306 → 6,341,901 B; `lab/fonts` 131,211 → 454,120 B. The manifest's sha-256 is `3f969725fe44715bb96a42fc56d668defc9b9cfceeb4219d146ecd24cad35351`. `pwa --write` gave 372 entries, 7.34 MiB. |
| `49cf802` | THE CASCADE: `<style>@layer app, mir;</style>` + `mir/mir.css`, then `lab.css` and `skin.css` unlayered, then KaTeX. Five twin `:not(:where())` rules (see the commit message). All 37 `!important`s are kept unlayered (see below). |

## Measured so far
- **stylehash** (kit 1.5 tool, http via the kit's `tools/serve.mjs`, the README's λWAVES recipe, `--gpu 1`):
  - The base copy (`git archive 7044f37 lab tools` → `.tmp/base`) has 790 elements per state with the rack closed, 1,169 with the modulation window open and 805 with the notebook open. These equal A0's.
  - The bare adopt (old links) gives, closed, in element-states over the 8 states:

    | class | element-states |
    |---|---|
    | press-scale transition | 816 |
    | box-shadow | 536–613 |
    | focus outline (`.k-val`) | 224 |
    | ON text-shadow | 132 |
    | `.dev-head` background | 80 |
    | backdrop-filter | 80 |
    | border (`.dev-power`) | 80 |

    Nothing is gone or new.
  - With the modulation window open, 34 elements are gone and 34 new in each state: the kit's own modwindow glyph swap, R13 (C4).
  - The `mir.css` switch alone changes **0** elements, closed and with the window open. One capture had a first-state transient; it was re-taken.
- **Dead-now-live**, mapped by CDP across 4 states (window open) plus the notebook: 5 app rules out-rank kit rules they lost to on 1.4.3. All 5 now have twins; a re-map shows 0. Live-now-dead: 0.
- **`!important`**: 37 on this tree. None meets a kit `!important` with a different value. The kit has 22, and where both sides declare the same property the values are identical.
  - 12 of ours existed only to beat the kit's 1.4.3 specificity: `.picker` / `.pk-n` ×2 (lab.css:166) and the `.native-info-content` popover ×10 (skin.css:291–300).
  - These 12 are candidates to drop the flag. That is NOT done yet, because it needs a probe with the popover open.
  - The other 25 are app-vs-app, inline (`#notebook` phone geometry) or reduced-motion; they stay.
- `lab/*.js` = 36,288, unchanged by both commits.

## The tools (untracked, in `.tmp/`; `.gitignore` has `.tmp/`)
| tool | what it does |
|---|---|
| `cap.mjs <name> <port> <closed\|mod\|nb>` | one stylehash capture into `.tmp/sh` |
| `classes.mjs <before> <after> <noise\|-> [--gone N]` | sorts the changes into the seven classes, counted in element-states |
| `inwin.mjs` | changes on elements matching a key substring |
| `who.mjs <port> <set> <state> <spec.json>` | the winning rules for some selectors |
| `flips.mjs` + `flipdiff.mjs` | contested properties across the whole page; dead-now-live |

Captures are in `.tmp/sh/`: before, before2, mod-before(2), nb-before(2), bare, mod-bare, links, links2, mod-links.

## Not done (in the brief's order)
1. **The pin:** add `'1.5.0-alpha.24': '3f969725…5351'` to `ACCEPTED` in `tests/mir-manifest.test.mjs`, keeping the 1.4.3 row. Then `node tools/new-project.mjs` and `--check`. bpm becomes 30: the kit's `BPM_DEFAULT` = 30 equals the plan's.
2. **R5-W1** in `tests/wiring.test.mjs`, `tests/pwa.test.mjs` and `tools/build-deploy.mjs`:
   - A `lab/mir/**` file in the manifest that no root reaches is reported, not precached, and not failed. App files keep the hard gate. The five dated ALLOWLIST rows retire.
   - pwa's `STAGED` must come from that set, not from the ALLOWLIST regex. One idea: `wiring.test.mjs --unreached-kit` prints JSON, and pwa and build-deploy spawn it.
   - Then `pwa --write`.
   - pwa's remaining reds after the write: D2 (`mir/shell/gui.js` fabiandesmet URL), D3 (`mir/app.js → ../LICENSE`), the uncached loads, and the font gate counting `fonts/info` as "ours" (expects 3).
   - pwa.test:445 reads the CSS loads from a fixed list; with `mir.css` linked it should follow the `<link>`s and `@import`s.
3. **The seven classes:** the defaults per §9, `C0-GLASS-RULINGS.md`, and the PNG pairs with the gate Firefox `g.snap()` (`tools/gate/gatekit.mjs`) into `research/release-0.5.0/c0-glass/`.
4. `adopt.mjs --check`.
5. The second canary: node 85 and all 27 browser suites, one at a time.
6. The ms/s pair: `tools/perf/main-thread.mjs --runs 3`, interleaved base / mine, gate 3.536.
7. REPORT.md wave 196; `C0-BUILD.md`.

## Exact next step
Edit `ACCEPTED` in `tests/mir-manifest.test.mjs`, then run `node tests/mir-manifest.test.mjs`, then `node tools/new-project.mjs && node tools/new-project.mjs --check`.
