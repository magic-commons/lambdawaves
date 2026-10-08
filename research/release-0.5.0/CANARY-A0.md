# CANARY-A0 — PLAN-DRAFT-1 row A0 (Sonnet 5.5 measurer, 2026-10-08)

**A0: PARTIAL.** Stopped at a usage pause (agent-control, five-hour window 98 %) after the baseline and the reading. Only the
baseline on the untouched tree is measured. NOT MEASURED: the adoption into a throwaway, the per-suite red list on 85 suites, the
precache after, the stylehash recipe with the modulation window and the notebook open, the INFORMATIONAL spike (cost, legibility,
labels under a rack column), and the M5/WebKit commands block (written below from the sources read, not run). Nothing from a
throwaway exists: `.tmp/canary/` was never created, no gate server was started, nothing under `lab/` changed.

## 1 · Measured: the baseline on the untouched tree (branch tip `7d10a63`, manifest MIR `1.4.3`, `2e6b85a88fce`)

| what | value | log |
|---|---|---|
| node suites (`tests/*.test.mjs`, `test.sh node`'s own loop, `pwa` last, per suite) | **85 / 85 pass**, 0 red (the canary's "82" is stale) | `canary-a0/00-baseline-node.log` |
| precache (`node tests/pwa.test.mjs`) | **188 files, 4.64 MiB** ("precache list == lab/ on disk"); rc 0 | `canary-a0/00-precache-before.log` |
| load average at the node run | 2.2–3.6 (nothing timed; the node suites are not timings) | — |

PLAN-DRAFT-1 §0 says 4.53 MiB for the same 188 files; the test itself prints 4.64 MiB. Use the test's number.

## 2 · Read, and what the reading settles (so the resumer does not redo it)

- **How `adopt.mjs` picks its kit.** `KIT = fileURLToPath(new URL('..', import.meta.url))`: the kit is the checkout the TOOL lives in.
  So `node ~/Documents/MIR/tools/adopt.mjs <copy> --line 1.5` would copy 1.4.3 (main) and `--line 1.5` would be REFUSED
  ("--line 1.5 is not this kit's line"). The correct call is the 1.5 line's own tool:
  `node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs <copy> --line 1.5`
  (kit `package.json` version `1.5.0-alpha.24`). No flag or env is needed. It also takes `--dry-run` and `--check`.
- **The stylehash tool's state hooks** (`tools/stylehash.mjs` in the same kit worktree): the matrix is theme × card × frost
  (`--states dark-refractive-on,…`); the only hook that can open a window is `--setup <js>`, which runs ONCE after ready, before
  the first state. So the two new states are two extra captures with a different `--setup`:
  `--setup "__LW.layout.open('mod')"` (the modulation window) and a setup that opens the notebook (verb to be read from `lab/rack.js`'s
  `LW.notebook`, `__LW.notebook`, 8 test sites), each with `--states` of one or more of the 8 and its own `before`/`before2`/`after`
  triple on the SAME state list. `compare` keys elements by structural path, so an element that exists only with the window open
  appears as `gone`/`new` against a capture without it; compare like with like (open vs open).
- **Stylehash must be served over plain http**: `tools/cdp.mjs` of the kit does not ignore a self-signed certificate and
  `tools/gate/server.py` is HTTPS only. The recipe line for λWAVES (kit README):
  `--gpu 1 --ready "__LW.ready && !!document.getElementById('controlHelp')" --theme "__LW.setTheme(%s)" --card "__LW.setCardStyle(%s)" --frost "__LW.setFrost(%s ? 'always' : 'off')"`.
  A plain no-store `http.server` on `LW_PORT` (script under `.tmp/`) does it.
- **`createInfoLayer`** (`mir/info/layer.js:98`, alpha.24, exists): `createInfoLayer({ stage, host, subject, features, style, follow,
  lines, parallax, drift, pane, controls, keys, avoid })` → `{ addLabel, addBlock, setPane, setStyle, setFollow, setLines, setEdit,
  freeze, hold, setParallax, setDrift, viewChanged, replay, clear, debug, destroy, root, stage }`. Sheets: `mir/mir.css` (or
  `info/faces.css` then `info/info.css`). Anchors are `{x,y,r}` in the STAGE's CSS pixels (`() => ({x,y,r}) | null` is allowed, so a
  label can follow `toScreen` of an atom each call); `stage` must be a positioned parent. `viewChanged()` on every camera move.
  `addLabel({ anchor, title, md, line })`, `addBlock({ md, pane })`. Maths through the notebook's marked + KaTeX (lazy,
  `loadRenderer`). **`avoid` is blocks only; "a label can sit under a window" is listed under 'What I would tune next' #3**, so
  spike (c) should find labels do NOT avoid windows; the layer reads `avoid: () => viewport rects` only for blocks. At rest the layer
  does zero work (no rAF); while a camera orbits, `viewChanged()` runs `frame.read` + `computeRests` + `bodies.js` (12 passes) + the seat
  chooser, then one `frame.write` per frame (`layer.js:373`). "Not proven by the kit: how it looks over a WebGPU canvas".
- **Known from the canary** (`docs/MIR-1.5-CANARY.md`, alpha.23): 7 node reds then (`mir-manifest` version regex, `mir` import
  `labPresetFolders`, `new-project` bpm 60 → 30, `slider-keys` keyFine, `access` A8 `baseSaid`, `wiring` 109 unreached modules,
  `pwa` 9.46 MiB over 8). Expect the same seven on alpha.24 at least; the full list needs the loop below because `mir` and
  `mir-manifest` die at their first import and hide the rest.

## 3 · Not measured: the exact next step for whoever resumes

Everything below needs the 4 s GPU courtesy and one browser at a time. Ports: `LW_PORT=8769 GD_PORT=5239` for this worktree,
`LW_PORT=8771 GD_PORT=5241` for the copy. The loop script is `.tmp/node-loop.sh` (untracked, gitignored; recreate it if missing:
for each `tests/*.test.mjs`, `pwa` last, `node suite > out/<name>.out`, print `PASS name` or `FAIL name rc=N`).

1. Throwaway: `cp -r <this worktree> .tmp/canary` (not `cp` of `.tmp` itself into `.tmp`: copy to a sibling first, then move),
   then `node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs .tmp/canary --line 1.5`, then in the copy
   `node tests/pwa.test.mjs --write`, then the loop on the copy; keep the first assertion of each red from `<out>/<name>.out`.
   If a suite dies at an import, record the import, and (as the canary did) iterate only by reading, never by fixing.
2. Tag each red: regex/inventory (A10) · precache/wiring (A11) · bpm regeneration (`new-project`) · kit behaviour change (NOTE for the
   guide) · unknown.
3. Stylehash: plain-http servers on 8769 (this tree) and 8771 (copy); `before`, `before2` on 8769, `after` on 8771, 8 states; then the
   two open-window triples (§2 above); summarise by property class (the canary's seven: press-scale transition, box-shadow, focus
   outline, `.dev-head` background, ON text-shadow, backdrop-filter, border) and report any new class (R13: `modhost.css` /
   `modwindow.css`).
4. Spike (in the copy, `.tmp/` page script, never committed): mount `createInfoLayer` over `#stage`, two labels anchored to water's
   atoms (`__LW.chem`, `toScreen` / `cameraEye` of `lab/field.js`), one block with maths; AUTO-ROTATE 10 s with 0 / 2 / 10 / 30 labels:
   `performance.now()` around `viewChanged()` and around the frame, plus fps, load average beside each; screenshots (hydrogen 1s+2p,
   benzene HOMO, C₆₀ HOMO; light and dark; bare vs pane) under `canary-a0/`; `__LW.camera.setShift(0.8, 0)` with an anchor under the
   rack column. Caveat from the kit: headless screenshots of a WebGPU canvas can be black; the vendored `tools/perf/cdp.mjs` with
   `gpu: true` and `--use-angle=vulkan` (as `tools/perf/benzene-browser.mjs:61`) is the route to try first.
5. Delete `.tmp/canary/`; stop both servers by pid; commit this file and the logs.

## 4 · The M5 / WebKit half (for Josh; not run here, written from the sources read)

The kit's own commands (kit checkout `/home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5`; exact flags are in `docs/PROBE.md`
and `tools/check-app.mjs --help`, which were NOT read in this run, so confirm them before pasting):

```
# 1. serve the app to the iPad/M5 over TLS and let the page report back (the kit's remote probe)
node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/probe.mjs serve <port> /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a476e9d83319e9efd
# 2. WebKit check of the app
node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/check-app.mjs --webkit <url>
# 3. the app's device report, posted back
<served-url>/lab/?report=1&post=1
# 4. the GPU limits page
<served-url>/tools/perf/limits.html
# 5. the persist probe: measure/MEASURE.md §4 (file not read in this run)
```

The first two lines are the kit's documented tools (README: "`node tools/serve.mjs 8800 --https` serves an iPad, and
`tools/probe.mjs` (the remote probe, `docs/PROBE.md`) lets a page on the iPad report to this machine"; ADOPTING §7: "`check-app.mjs --webkit`").
Lines 3–5 name the plan's own items; their exact URLs and the persist probe's text are UNVERIFIED here.

## 5 · Blockers

None technical. One environment note: this agent's guard refuses `$PWD` substitutions and `git -C <other repo>` (use absolute
paths and plain commands). Stopped by the usage pause, not by a failure.
