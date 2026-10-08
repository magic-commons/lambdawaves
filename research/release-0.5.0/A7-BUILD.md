# A7 · THE OCCLUSION PROVIDERS — build hand-off (2026-10-08, the A7 builder, Opus 5.5)

**In ten lines.** `lab/occlusion.js` is built to the paused builder's design (`89452ae:research/release-0.5.0/A7-HANDOFF.md`).
`refreshOcclusion` now collects from providers, converts, clears and presents. The species and their 32-cap policy moved into a
registry with one producer, `dirty()`. The probe's rect lists are **byte-identical** on 16 scenes, base against this tree.
`frame-occlusion` passes **7/7** and node passes **85/85**. `menubar` 8, `keyboard-window` 1, `history` 39, `render-regressions` 2 and `offer` 16 are green.
The device report pair is equal within noise. The ms/s A/B gives |Δ median| **1.191 ≤ 2 ms/s**, with every run `field ok` and the
load < 4. `lab/*.js` **36,198 → 36,226 (+28)**. No blockers. No `__LW` member is touched. Nothing is pushed or merged.
The next step is the integrator's merge.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a7738e3b2c5cfd0f9` |
| branch | `worktree-agent-a7738e3b2c5cfd0f9`, reset to `1e1a4f8` (the `sos-s0` tip) |
| `3d2f662` | 0.5.0 A7: the occlusion providers: `lab/occlusion.js`, the `rack.js` host and registrations, `lab/sw.js` (`pwa --write`) |
| `e07b0e2` | 0.5.0 A7: `tools/a7-occlusion-probe.mjs` |
| the docs commit | this file + REPORT.md wave 192 (appended at the end, after wave 195) |
| gate servers | 8773 (pid 2799902) and 8777 (pid 2799936) were both started by me and killed by pid. Ports 8773/8777/5243/5247 are free, and no browser is left open |

## The registry (`lab/occlusion.js`, 40 lines)

- `paintedRect(el, clip)` returns `null` when the element is missing, `hidden`, `visibility: hidden`, or under 2 px unclipped.
  Otherwise it returns the element's DOMRect, or `{left, top, right, bottom}` clipped by `clip`'s rect. The clip is taken in
  viewport pixels BEFORE the host subtracts the canvas origin. Because `fl(x − c)` is monotonic, `max`/`min` commute with it,
  so every number is bitwise the old enumerator's.
- `createOcclusion(dirty)` returns:
  - `register(name, rects, { standIn })`: `rects()` answers DOMRect-likes or nulls. Re-registering a name keeps its place.
    Registering calls no `dirty`, so the boot timing is unchanged.
  - `unregister(name)`: no caller today. It is kept for C8's swap (one line).
  - `rects(map)`: `map` is the host's `toCanvas` (viewport → canvas `[x0,y0,x1,y1]`, or null to drop). The conversion
    happens BEFORE counting. Every provider without a stand-in comes first, in registration order. Then each provider with a
    stand-in: when its own converted rects would carry the block past **32**, its stand-in's rects replace them.
  - `dirty`: the one producer. In rack.js it is `occludeDirty = true; schedule(TIER.PRESENT)`, which is the paused-PRESENT law.
  - `watch(el, opts)`: null-safe. One shared MutationObserver over `dirty`.

## The providers (registered at the old block, `rack.js` grep `occlusion.register`) and their brief-8 twins

| name | what it answers | brief 8 |
|---|---|---|
| `modwin` | if the root is shown: `.m2rail, .m2dev, .m2workbar`, each `.m2dev` clipped by its `.m2run` | `layer` |
| `chiprail` | if the rail is shown: `.crail-chip` | `layer` (`data-mir-rail`, `data-mir-chip`) |
| `floats` | `#floats > .dev` shown: one pane, or `.dev-head` + `.dev-body` when DISCONNECTED (never on a phone) | `layer` |
| `extra` | `#transport #notebook #sheet #offer #rackAddList #rackFavList`, looked up per burst | `extra()` |
| `keymap` | `#keymap .km-panel` (the same query as before) | `extra()` |
| `rack` | the open cards of `#rack` and `#rackL` while the rack shows (or peeks), as panes. **standIn**: the two columns | `rack` (the host's overflow policy, which the brief asks for) |
| watchers | the old observers, installed at the same point: `watch(#floats, #rack, #rackL, childList)`, `watch(six ids, style/hidden/class)`, the body-class observer, the floats capture scroll, the racks' scroll, the window resize | `subscribe(fn)` |

`modwin`/`chiprail` capture `modView.root`/`modView.rail` at the registration point, which runs synchronously after
`createModulation`. They replace the old `d.id === 'modwin'` / `.kwin-chiprail` test over `#floats`' children, whose DOM order
is always [modwin, rail, ...floated cards]. The rail is appended right after the root, and cards arrive only through `popOut`.
The producers `placeFloat`, `modDodge`, and the keyboard window's `onMove`/`onClose` (the `keymapMoved` const is gone) are one
`occlusion.dirty()` each. `occludeDirty`/`occludeAt` and the loop line (grep `refreshOcclusion(nowMs)`) are unchanged.

## The probe (`tools/a7-occlusion-probe.mjs`)

`LW_PORT=… GD_PORT=… node tools/a7-occlusion-probe.mjs <out.json>` wraps `setOcclusion` and pauses. After each scene it
settles, flickers a body class (which goes through the body observer to `dirty`), and writes the list that this refresh hands over. It runs 16 scenes:
frame-occlusion's 7 (with box and dots split), a float moved by `moveFloat`, the racks scrolled (1258 / 1850 px), two cards
folded, the keyboard window open, the interface hidden and back, DISCONNECTED with all 19 rack cards open, and every card
folded under the expanded modulation window. Scene 15 goes **past 32**, and the columns stand in. Counts:
20·20·20·20·23·11·11·7·7·6·6·7·0·7·12·16, with every scene's `errors` empty.
**Result:** the base copy (`git archive 1e1a4f8 lab tools` → `.tmp/a7-base`, 8777/5247) and this tree (8773/5243) each give
14,807 B, sha-256 `ceb3502491d81d4aa463415d04521845de418334aaf8578b6aae97683190b229`, and `cmp` finds them identical.

## Timing (the S2 pattern; the digest lock is not run)

- **Device report pair** (`tools/perf/device-report-run.mjs`, back to back, base first). The first pair was re-taken because the base began at a
  load of 4.23 (it read 18.2 fps / 548 presents against 18.1 / 544).
  - **Base:** 17.4 fps, 523 presents, 0 held, loop median 1 ms (load 2.77 → 2.41).
  - **A7:** 18.2 fps, 548 presents, 0 held, loop median 1 ms (2.21 → 2.27).
  - The two are equal within the noise.
- **ms/s** (`tools/perf/main-thread.mjs --runs 1` × 6, interleaved base, A7, base, A7, base, A7). Every row reads `field ok · NVIDIA GeForce RTX 3070`
  with 0 held:
  - **Base:** 19.653 (load 1.92→2.07), 20.788 (3.14→3.46), 20.392 (3.42→2.98). Median **20.392**, spread 1.135.
  - **A7:** 21.583 (2.58→3.38), 21.941 (3.32→3.57), 20.350 (3.29→3.31). Median **21.583**, spread 1.591.
  - **|Δ median| = 1.191 ms/s ≤ 2 ms/s: PASS** (MEASURE §1's footing: floor 19.729, spread 0.980).
  - The two higher A7 runs came at the higher loads. The equal-load third pair reads 20.392 against 20.350.
  - The raw JSON is in `.tmp/mt-{base,new}-{1,2,3}.json` (not committed). The tool's `sha` field reads `e07b0e2` for both trees because it is the cwd's HEAD; the base was served from `.tmp/a7-base`.
- **Digest lock: not run.** `tools/perf/digest-lock.mjs:34` sets the occlusion block itself before every capture, so it
  cannot see this change.

## Tests

- `node tests/pwa.test.mjs --write` (190 precached files).
- `bash test.sh node`: exit 0, **85/85** suites, 0 RED lines.
- Browser on 8773/5243, one at a time, 4 s apart: `frame-occlusion` **7/7** (before and after the probe commit), `menubar`
  **8**, `keyboard-window` **1**, `history` **39**, `render-regressions` **2**, `offer` **16**.
- No timing red, so **nothing was re-run alone**.

## Lines

`cat lab/*.js | wc -l`: **36,198 → 36,226 (+28)**: `occlusion.js` +40, `rack.js` −13, `sw.js` +1. The design estimated +25.

## Blockers

None.

## Open items

- The ms/s Δ is positive (+1.19) but inside the gate. The pre-C baseline (MEASURE §2, 5 runs after stage A closes) is the
  natural place to see whether it persists.
- **A fold has no watcher**, as before A7. Brief 8 lists fold among the invalidations. Today a fold is picked up by the next
  frame that is more than 300 ms after the last refresh. A7 changes no behaviour, so this is left for C8.
- `unregister` has no caller.
- `keymap` keeps its query, not the keymap block's `man.root`, so the registry is installed in one place, conflict-free with the keymap block.
- No `__LW.occlusion` was added: no test needs one. If C8 wants it, it goes at the END of the literal.
- Merge note: the floating-rack block is touched only at `placeFloat`'s two lines. The other A7 sites are `rack.js:26`
  (the import, after `createWindowActivity`), `:512` (`createOcclusion`), `modDodge`'s first line, the old occlusion block,
  and the keymap block's `onMove`/`onClose`. With A1+A8, `lab/sw.js` is the standing conflict: take either side, then run `pwa --write`.

## Exact next step

Claude Sos merges `worktree-agent-a7738e3b2c5cfd0f9` (3 commits on `1e1a4f8`) into `sos-s0`, then runs
`node tests/pwa.test.mjs --write`, `bash test.sh node` and `frame-occlusion`. If A1+A8 landed first, the probe runs again:
`.tmp` base = the pre-merge `sos-s0` tip, against the merged tree, and the two must `cmp` equal.
