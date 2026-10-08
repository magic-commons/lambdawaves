# CANARY-A0 — PLAN-DRAFT-1 row A0 (Sonnet 5.5 measurer, 2026-10-08)

**A0: COMPLETE** (2026-10-08, the spike's five rules: pass 1 below by Sonnet, the rest in **PASS 2** at the end of this file, by
Opus). The verdicts, by rule: (1) cost **NOT MET** — +115 % at 8 bare labels with the field present, so **D1 is 0.5.1**; (2) legibility,
provisional until Josh looks — bare reads in 12 of 12, **no ink brief**; (3) under a rack — 2 labels at shift +1 and 2 at −1, **the
18th brief is confirmed** (and a block crosses the rack too); (4) D4 — a data-URL `<img>` loses its `src`, an inline `<svg>` is
removed: **text only**; (5) the M5 commands, run here first (PASS 2 §5). Not part of the five and still open: the browser suites on
an ADOPTED copy (PLAN §B's second canary, at the first re-adopt).

*Pass 1's own status line, kept:* PARTIAL. Stopped at a usage pause (agent-control, context 80 %). Measured: the baseline (§1), the adopted-copy canary on
alpha.24 with the full red list (§2; the A9–A11 builder runs the same half as its own test, in `A9-A11-BUILD.md`, so this one is the
independent check), the stylehash with the modulation window and the notebook OPEN (§3), and spike (a) COST, one pass (§4).
**NOT measured:** spike (a) second pass; (b) legibility (24 screenshots + 6 pane); (c) labels under a rack column; (d) the
sanitiser verdict; the 27 browser suites on the copy; the M5/WebKit commands are written but UNVERIFIED (§7). Raw logs:
`research/release-0.5.0/canary-a0/` (`.txt`/`.json`, not `.log`: `.gitignore` has `*.log`). Nothing under `lab/` changed; the
throwaway (`.tmp/canary/`) is deleted; the gate server on 8771 is stopped by pid.

## 1 · The baseline on the untouched tree (tip `7d10a63`, manifest MIR `1.4.3` `2e6b85a88fce`)

| what | value | log |
|---|---|---|
| node suites (`tests/*.test.mjs`, `test.sh node`'s loop, `pwa` last, per suite) | **85 / 85 pass, 0 red** (the canary's 82 is stale) | `00-baseline-node.txt` |
| precache (`node tests/pwa.test.mjs`) | **188 files, 4.64 MiB** (PLAN §0 says 4.53 MiB; use the test's number) | `00-precache-before.txt` |
| stylehash `before`, `before2` (`--gpu 1`, ready on `#controlHelp`, 8 states, plain http) | **790 elements per state**, empty console (the canary's 595 predates 0.4.0's windows) | `.tmp` only; compare in §3 |

## 2 · The adopted copy (throwaway, never committed): MIR `1.5.0-alpha.24`

- **How the kit was picked.** `adopt.mjs` takes the kit it LIVES in (`KIT = new URL('..', import.meta.url)`); `node ~/Documents/MIR/tools/adopt.mjs … --line 1.5`
  would copy 1.4.3 and refuse `--line 1.5`. The call that works, no flag needed:
  `node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs <copy> --line 1.5`.
- **adopt:** `adopted MIR 1.5.0-alpha.24 (1b7ae99b9905): 196 added, 23 updated, 0 removed, 43 unchanged` (identical counts to the alpha.23 canary).
  Manifest `MIR` `1.5.0-alpha.24`, commit `1b7ae99b9905`, `"line": "1.5"`, 262 files. (`01a-adopt-stdout.txt`)
- **precache:** before `--write` it fails first on "194 file(s) in lab/ are NOT precached"; after `node tests/pwa.test.mjs --write`:
  **382 entries (194 added, 0 dropped, 16 re-hashed), 9.46 MiB** against the 8 MiB ceiling. 188 → 382 entries, 4.64 → 9.46 MiB (+104 %). (`01b`, `01c`)
- **node: 85 suites, 78 pass, 7 red** — the same seven as the alpha.23 canary, same messages (`02-node.txt`). First assertion of each, and
  what `mir.test` / `mir-manifest` / `slider-keys` / `pwa` HIDE behind it (I patched the THROWAWAY's tests minimally and re-ran, to read on):

| suite | first assertion | tag | what it hides (read on in the throwaway) |
|---|---|---|---|
| `mir-manifest` | version `'1.5.0-alpha.24'` fails `/^\d+\.\d+\.\d+$/` (`:18`) | regex/inventory (A10) | with the regex and `ACCEPTED` extended: **green** ("all 262 adopted files match the committed manifest") — the inventory itself holds (`02d`) |
| `mir` | `SyntaxError`: `host.js` has no export `labPresetFolders` (removed in alpha.18, ADOPTING §10) | regex/inventory (A10) | (i) §16 "vendored files are still the vendored files": `Final II provenance patch no longer matches` (`:753`) — runs only where `…/MANDELBROT APP/project/app` is readable; the kit's `mod.js` is no longer λWAVES' vendored copy (R12); (ii) §22a TypeError at `:1332` (the removed `labPresetFolders` call). With those neutralised: **101 / 101 green** (`02e`–`02g`) |
| `new-project` | `--check`: `new-project.lambdawaves.json is OUT OF STEP` | bpm regeneration (A11) | regenerating changes ONE line: `"bpm": 60` → `30` (`02c-new-project-delta.txt`) |
| `slider-keys` | `masterDepth` ≠ .709 after Shift-ArrowDown from .71 (`:28`) | kit behaviour change — a NOTE for the guide (`keyFine`, Shift is the kit's eighth gear; test reads `setKnobLaw().keyFine` = A10) | nothing else: green with `:28` removed (`02h`) |
| `access` | A8 `baseSaid:false` (`{"baseWire":true,"baseSaid":false,"rackWire":true}`), 1 of 11 failing | regex/inventory (A10): a source-text regex on `' · base · modulated'`; the kit builds it with `tx()` | — |
| `wiring` | 109 modules under `lab/` no root reaches | precache/wiring (A11) | — |
| `pwa` | precache 9.46 MiB over the 8 MiB ceiling | precache/wiring (A11) | with the ceiling at 16 MiB, three NEW reds in a row (`02i`, `02j`), none seen by the alpha.23 canary: **(1)** an absolute URL in `lab/mir/shell/gui.js`: `https://www.fabiandesmet.com/` (the MIR logo credit, `gui.js:550`) — A11/allowlist, and a NOTE for the guide; **(2)** a dangling reference `lab/mir/app.js → ../LICENSE` (`new URL('../LICENSE', import.meta.url)` resolves to `lab/LICENSE`) — A11; **(3)** "lab/ loads a file the precache does not hold": `mir/app.js → ./shell/{wordmark,menubar,accent,notebook,about}.js`, `mir/info/layer.js → ../shell/notebook.js`, `mir/notes/face.js → ../shell/notebook.js`, `mir/shell/gui.js → ./accent.js` … — because the λWAVES `pwa` rule SKIPS those five kit shell files (it ships its own), **and the INFORMATIONAL layer imports `shell/notebook.js`**: adopting `createInfoLayer` moves the kit's notebook module (and what it imports) into the load set, so A11's "precache what a root reaches" must cover it. Further `pwa` checks after (3) were not reached. |

No red is "unknown". None is a behaviour change of λWAVES; two are kit behaviour (`keyFine`, the `tx()` strings) and one is a kit default (bpm 30). The `:753`
red depends on a path outside the repo (`MANDELBROT APP`), so it is machine-dependent: on a machine without it `mir` goes green once the import is fixed.

## 3 · Stylehash, 8 states: closed, MODULATION window open, NOTEBOOK open (`04*.txt`)

Recipe: the pin README's λWAVES line (`--gpu 1`, ready `__LW.ready && #controlHelp`, `__LW.setTheme/setCardStyle/setFrost`), served over plain
http (the kit's `cdp.mjs` cannot accept the gate's self-signed certificate), two before-captures as the noise. The tool's only state hook is
`--setup` (once, after ready), so the two new states are two more triples with `--setup` opening the window:
`__LW.layout.modulation.expand()` and `__LW.layout.notebook.open('notes')`, each then waiting 1.5 s. (Element keys are structural paths; compare open-with-open.)
The app is under its PHOTOSENSITIVITY pane in all captures (the matrix never dismisses it): computed styles are unaffected, the pixel
compare sees the page blurred under it.

| state set | elements/state | changed per state (8 states) | element-state diffs | gone / new | pixels beyond noise |
|---|---|---|---|---|---|
| closed rack | 790 | 211, 197, 197, 197, 183, 197, 197, 197 | **1 576** (25 %) | 0 / 0 | 196 (`dark-refractive-on`), 969 (`light-tinted-on`) — **the same two numbers as the alpha.23 canary**; plus **139 652 px (10.8 %) in the FIRST state `dark-tinted-off`** (two grey boxes in the left rack and one in the right in the after-capture; a transient of the first capture, not seen in the canary; image `04-pair-closed-dark-tinted-off.png`) — re-run alone before it is believed |
| **modulation window open** | 1 169 | 220, 238, 234, 235, 220, 238, 234, 235 | **1 854** | **34 / 34 per state** | 300–9 026 px in the window's region; 410 163 px in `dark-refractive-on` (31.6 %, the same first-capture kind of transient) |
| **notebook open** | 805 | 183, 197, 197, 197, 183, 197, 197, 197 | 1 548 | 0 / 0 | 196 and 969 (identical to closed) |

**The seven classes (closed rack, element-states summed over 8 states; the canary's counts in brackets):** press-scale `transition` **816** (552) ·
`box-shadow` **613** (448) · focus `outline` on `.k-val` **224** element-states (3 × 184) · `.dev-head` `background-color` **224** (165) ·
ON `text-shadow` **132** (132) · `backdrop-filter` none on `.dev-head` **80** (64) · `border` 1px → 0 on `.dev-power` **80** (64) (+1: `.warn-btn`'s white → black).
The counts rose with 0.4.0's windows (790 vs 595 elements); every class is the canary's. 16 tokens' text differs (`--gl-*`, `--glass-*`, `--m2-mat-shadow`, `--neu-*`, …).
Smaller siblings in the same pass: `filter` drop-shadow glow on `.dev-power` **80**; its `::before` 6 → 8 px **80**; `.dev-head` `background-image` gradient + size/position/clip **62**;
disabled `opacity` .3 → .38 **16**; the transport's dock glyph `12 → 13 px` (`#box`) **16**; `.reg-morph` `justify-content` **8**.

**What the two new states add.**
- **Notebook: nothing.** 0 property diffs inside `#notebook`, 0 gone, 0 new (it is λWAVES' own DOM; the kit's notebook is not loaded by λWAVES). Counts equal the closed rack's.
- **Modulation window: R13 is real and larger than the seven.** Beyond the seven classes' extra hits (transition +16, box-shadow +27, outline +16, background +22, border +48, filter +16):
  **34 elements gone and 34 new in every state** — the kit's alpha.24 modwindow swaps hand-drawn SVG for the glyph set: `.m2grip` → `svg.gly.gly-move`,
  `.m2rowgrip` → `svg.mir-grip-dots-svg` (9 circles), `.m2pow` → `svg.mir-power-icon`, `.m2presave` glyph, `#modxport` → `.mir-mod-power` with `svg.gly-play`, and **a new
  `button#m2-dead-send-warning.m2predead`**; and **`#modwin` itself** gains `background rgba(0,0,0,0) → rgba(255,255,255,.1)` and `backdrop-filter none → blur(22px)`;
  `.m2presave` `border-radius 50% → 8px` and its glyph `11.3 → 16.3 px`; `#modtempo` `display grid → flex`, width 132 → 124 px; the work bar `left 484 → 491`, `width 481 → 473.5`;
  `.m2vname` colour alpha .94 → 1; `.m2rate` `tabular-nums`. So `lab.css :405–419, :813–841` (the badge ladders) and every test that finds `.m2grip`/`.m2pow` by
  shape (`mir-controls`, `history`, `frame-occlusion`) meet a changed DOM on the first adopt, not only a changed look.

## 4 · The INFORMATIONAL spike — (a) COST, pass 1 of 2 (`05-cost-pass1.json`)

Scene: H₂O in MOLECULES, ORBITAL view (the HOMO), AUTO-ROTATE on, 1400 × 900, headless Chromium 1243 on Vulkan (S4c's flags) over the adopted
copy (HTTPS gate server, port 8771), the lab's own loop untouched. The kit's `createInfoLayer({ stage: #field, host: #stage })` with its two sheets
linked, 1 block (maths) + N labels (each with maths), anchored to H₂O's atoms and, past three, to points round them through the app's own
`toScreen(obs, domain.half, W, H)` (cached per `cameraKey`). The page calls `viewChanged()` ONLY when `cameraKey` changes (one rAF key check).
Each cell is 30 s after 3 s of settle; ms/s = CDP `Performance.getMetrics` `TaskDuration` delta ÷ 30. Load average at the start (1-min): 2.4–3.8
(four other agents share the GPU); fps is the app's `presents / s`, GPU-bound here at ≈ 20–23.

| config | main thread ms/s | vs N = 0 | recalc-style ms/s | layer's frame work ms/s (kit `frame.read+write+coalesce`) | `viewChanged()` call ms/s | fps | held frames |
|---|---|---|---|---|---|---|---|
| no layer | 43.2 | — | 1.5 | 0 | 0 | 19.9 | 0 |
| bare, N = 0 (1 block) | 45.1 | — | 1.8 | 3.5 | 0.26 | 22.7 | 0 |
| bare, N = 2 | 66.3 | +47 % | 7.4 | 11.0 | 0.08 | 22.6 | 0 |
| **bare, N = 8** | **85.9** | **+90 %** | 14.8 | 18.1 | 0.09 | 23.4 | **0** |
| bare, N = 16 | 110.5 | +145 % | 24.3 | 27.0 | 0.09 | 23.4 | 0 |
| pane, N = 0 | 49.0 | — | 1.7 | 3.3 | 0.23 | 22.7 | 0 |
| pane, N = 2 | 62.6 | +28 % | 7.1 | 10.1 | 0.06 | 22.6 | 0 |
| pane, N = 8 | 83.9 | +71 % | 14.8 | 17.1 | 0.07 | 21.4 | 0 |
| pane, N = 16 | 103.7 | +112 % | 22.3 | 24.9 | 0.08 | 22.0 | 0 |

**RULE (N = 8 bare ≤ +10 % ms/s over N = 0 and 0 held frames → D1 ships in 0.5.0; else D1 waits for brief 7's coalesced `viewChanged`, 0.5.1): NOT MET on pass 1.**
+90 % (≈ +41 ms/s, about 4 % of one main thread; ≈ 5 ms/s per label bare, 4 ms/s per label at 16), held frames 0, no fps loss, pane no worse than bare.
The margin is nine times the threshold and the no-layer control sits within 2 ms/s of N = 0, so the second pass is unlikely to flip it, but it was not run. **Where the cost is:**
not the call — `viewChanged()` is already coalesced by the layer (a flag and one `frame.read`): 0.09 ms/s — but the frame work behind it (the spring/rest solver and seat chooser,
`coalesce` 11 ms/s at N = 8) and the **style recalc of the moving labels (1.8 → 14.8 → 24.3 ms/s)**; it scales with labels, not with the block. A cheaper layer would
cut recalc (fewer `data-*` writes, `contain: strict` per label) rather than call `viewChanged` less often; that is a kit brief, not an app seam.

## 5 · Findings that change the plan's wording

1. A0's adopt command: the 1.5 tool, not `~/Documents/MIR/tools`; no flag or env exists or is needed.
2. The `pwa` red hides three more behind its ceiling (§2); one of them (`shell/notebook.js` reached by `info/layer.js`) is the INFORMATIONAL's own cost in precache and is A11's.
3. R13 is a DOM change (34 elements per state), not only a style drift (§3).
4. D1's 0.5.0 gate, by the coordinator's rule, fails on cost (§4) pending pass 2; D1 would wait for a cheaper layer (brief 7's "coalesced `viewChanged`" is already how `viewChanged` is built — the cost is the frame work and the recalc).
5. **Screenshots of the WebGPU canvas:** headless Chromium's `Page.captureScreenshot` shows the page with a BLANK picture (verified, `06-chromium-headless-webgpu-canvas-blank.png`: the DOM and the layer's labels render, the orbital does not; `field.readPixels` says the field is lit); legibility over the picture must use the gate's Firefox `g.snap()` (`tools/gate/gatekit.mjs`, `LW_PORT=8771 GD_PORT=5241`) as S4c did — the reason (b) was not finished.

## 6 · The exact next step for whoever resumes (all scripts are in `.tmp/`, untracked; recreate the copy first)

1. `cp -r lab tests tools docs research MIR-MANIFEST.json package.json test.sh CLAUDE.md LICENSE NOTICE README.md REPORT.md CHANGELOG.md CITATION.cff AI_POLICY.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md DEPLOY.md RELEASING.md wrangler.jsonc package-lock.json .tmp/canary/` (from the worktree root, after `mkdir .tmp/canary`), then `node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs .tmp/canary --line 1.5` and in the copy `node tests/pwa.test.mjs --write`.
2. `python3 tools/gate/server.py <worktree>/.tmp/canary 8771` (background; stop by pid). `.tmp/spike-lib.mjs` (Chromium driver, `ORIGIN=https://127.0.0.1:8771`), `.tmp/spike-page.js` (the page-side layer kit: `__spike.make({n, pane})`, `.start()`, `.snapshot()`, `.keepClear()`), `.tmp/spike-cost.mjs <pass> <secs>` exist.
3. Pass 2: `node .tmp/spike-cost.mjs 2 30` (≈ 6 min; one browser at a time, 4 s between sessions).
4. (b): drive the gate Firefox (`import { open } from '../tools/gate/gatekit.mjs'`, `open('https://127.0.0.1:8771/lab/?sw=0&preset=1s%2B2pz')`; inject `.tmp/spike-page.js` with `g.ev`, call `window.__spikeInit()`), for 1s+2p (`?preset=1s%2B2pz`), benzene (`await __LW.chem.solve('C6H6'); chem.setOn(true); chem.setView('orbital'); chem.orbital(chem.state().nocc)`), C₆₀ (`await chem.install('C60'); await chem.solve('C60')` then the same), × `__LW.setTheme('light'|'dark')` × `__LW.setFrost('always'|'off')`; each bare AND with `__spike.layer.root.style.mixBlendMode='difference'` plus `--info-ink:#fff`; `g.snap()` → PNG → JPEG (PIL is installed) under `canary-a0/`; judge by the ≥ 10 of 12 rule.
5. (c): `__LW.camera.setShift(±1, 0)` with `__spike.make({ n: 8, avoid: () => __spike.keepClear() })` — count `.mir-info-label` rects meeting `__spike.keepClear()` (`#rack`, `#rackL`, `#transport`, `#floats` children; λWAVES has no `rack.keepClear()`); blocks use `avoid`, labels do not (INFORMATIONAL.md "What I would tune next" #3). (d): `addBlock({ md: '![x](data:image/svg+xml;utf8,<svg…>)\n\n<img src="data:image/png;base64,…">\n\n<svg…>' })`, wait for KaTeX/marked (`loadRenderer`), count `img, svg` in `block.el` and any `on*`/`<script>`.

## 7 · The M5 / WebKit half (for Josh) — UNVERIFIED commands

Not run here, and the kit's `docs/PROBE.md`, `tools/check-app.mjs --help` and the repo's `measure/MEASURE.md §4` were NOT read in this run: confirm each flag before pasting.

```
KIT=/home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5
# 1. serve the app to the M5/iPad over TLS and let the page report back (the kit's remote probe; README names tools/probe.mjs and docs/PROBE.md)
node $KIT/tools/probe.mjs serve <port> <path to the app folder>
# 2. WebKit pass over the app (ADOPTING §7 names check-app.mjs --webkit)
node $KIT/tools/check-app.mjs --webkit <url of the served app>
# 3. the app's own device report, posted back
https://<served host>/lab/?report=1&post=1
# 4. the GPU limits page
https://<served host>/tools/perf/limits.html
# 5. the persist probe: measure/MEASURE.md §4 (not read)
```

---

## PASS 2 (Opus, 2026-10-08)

The spike's second half, by the five rules of PLAN §B, on tree `1e1a4f8` (`sos-s0`, PLAN approved). **The throwaway:** the A9–A11
builder's adopted copy (`agent-a951ee2405b1383e6/.tmp/canary-after/`, MIR `1.5.0-alpha.24` `1b7ae99b9905`, 262 files), copied to
`.tmp/canary/`, served by `tools/gate/server.py` on 8771 (Firefox through the gate driver on `GD_PORT=5241`), deleted after its numbers
were written. **Host:** RTX 3070 (Vulkan), Ryzen 5 5600G, Linux 7.0.0-34, node v22; headless Chromium 153 (playwright `chromium-1243`,
S4c's flags); Firefox through `tools/gate/gatekit.mjs`. One browser at a time on my side, 4 s between sessions; the load average is beside
every timing (all below 4). Pass 1's scripts were copied from `agent-a476e9d83319e9efd/.tmp/` and never run in place; pass 2's are in
this worktree's `.tmp/` (`p2-lib.mjs`, `p2-cost.mjs`, `p2-profile.mjs`, `p2-rack-d4.mjs`, `p2-legible.mjs`, `p2-contrast.py`), untracked.
Nothing under `lab/` changed. Raw: `canary-a0/07*`–`10*`, `canary-a0/legibility/`, `canary-a0/m5-info.probe.js`.

### 1 · COST, pass 2 — **NOT MET: +115 % at 8 bare labels, field present, 0 held frames → D1 is 0.5.1** [MEASURED]

**Method.** A-M's method (`tools/perf/main-thread.mjs`), re-implemented in `.tmp/p2-cost.mjs` because the tool itself cannot mount
the layer: per cell a FRESH browser; the lab opened twice (`/lab/?sw=0&warn=0`, the first navigation is the warm-up); the cell REFUSES
without `__LW.field.ok` on the measured page, and `field.ok` is read again at the end; H₂O in MOLECULES, ORBITAL view, the HOMO; the
kit's `createInfoLayer` over `#stage` with 1 block + N labels (pass 1's page kit, `spike-page.js`); AUTO-ROTATE on; `viewChanged()` only
when `cameraKey` changes (the page's one rAF check); A-M's start (`__LW.pause()`, `settle()`, 400 ms, `__LW.play()`), 3 s settle, then
CDP `Performance.getMetrics` at 0 and 30 s: **ms/s = ΔTaskDuration × 1000 / 30**. 1400 × 900, as pass 1. Twelve cells: the nine of
pass 1, then bare 8, bare 0 and off again in reverse order.

**The warm-up fact, reproduced:** the first navigation had no field in **15 of 15** recorded boots (`no WebGPU adapter`, or `device lost:
A valid external Instance reference no longer exists.`); the measured page had `field.ok` (RTX 3070) in all of them, before and after
its window. **Did pass 1's cells have a field? Yes [DERIVED]:** its JSON has presents = frames in all nine cells (598–703 per 30 s,
≈ 20–23 / s; with no field presents stay 0, MEASURE §1), and its `spike-lib.mjs` opened `tools/perf/limits.html` before the lab —
a second navigation in the same browser, the warm-up by another name. `field.ok` itself was not recorded by pass 1.
**Side finding [MEASURED]:** under a CDP-launched headless Chromium `navigator.webdriver` is false, so the photosensitivity notice
is OPEN at boot (12 of 12 cells); pass 1 and pass 2 dismiss it, `main-thread.mjs` does not — A-M's floor is taken under the notice's
pane (its effect on the floor is UNVERIFIED).

**Pass 1 and pass 2 side by side** (ms/s; % over the same pass's N = 0 — pass 2's bare N = 0 is the median of its two runs, 37.50;
pass 2's attribution columns are its first run of the cell; "rest" = Task − Script − RecalcStyle − Layout, i.e. paint, pre-paint,
layerize, commit, GC):

| cell | pass 1 ms/s | pass 2 ms/s (each run) | pass 2 script · recalc · layout · rest | layer's frame JS ms/s (read / write / coalesce) | kit DOM writes / s | presents / s | held | `field.ok` | load 1-min start → end |
|---|---|---|---|---|---|---|---|---|---|
| no layer | 43.2 | 32.51 · 32.74 | 9.48 · 0.58 · 0.71 · 21.74 | 0 | 4.7 | 22.6 · 21.3 | 0 | ✓ ✓ | 0.92→1.64 · 3.06→3.09 |
| bare, N = 0 (1 block) | 45.1 | 36.80 · 38.20 | 14.35 · 0.57 · 0.74 · 21.15 | 2.04 / 0.43 / 0.42 | 4.8 | 21.2 · 21.7 | 0 | ✓ ✓ | 2.06→2.08 · 3.11→3.00 |
| bare, N = 2 | 66.3 (+47 %) | 60.55 (+61 %) | 20.86 · 6.51 · 1.81 · 31.37 | 3.79 / 0.35 / 5.35 | 224 | 21.0 | 0 | ✓ | 1.99→2.12 |
| **bare, N = 8** | **85.9 (+90 %)** | **79.12 · 81.84 (median 80.48, +115 %)** | 28.16 · 13.99 · 2.40 · 34.57 | 5.19 / 1.18 / 10.38 | 1 291 | 20.8 · 19.8 | **0** | ✓ ✓ | 2.17→2.86 · 3.18→3.61 |
| bare, N = 16 | 110.5 (+145 %) | 91.48 (+144 %) | 33.33 · 19.90 · 2.79 · 35.47 | 6.69 / 1.85 / 14.25 | 2 632 | 20.8 | 0 | ✓ | 2.27→1.97 |
| pane, N = 0 | 49.0 | 34.02 | 13.42 · 0.51 · 0.70 · 19.38 | 1.93 / 0.48 / 0.45 | 4.6 | 19.3 | 0 | ✓ | 1.98→1.71 |
| pane, N = 2 | 62.6 (+28 %) | 53.32 (+57 %) | 18.79 · 6.00 · 1.62 · 26.91 | 3.39 / 0.33 / 4.97 | 205 | 18.1 | 0 | ✓ | 2.15→2.19 |
| pane, N = 8 | 83.9 (+71 %) | 76.76 (+126 %) | 27.21 · 13.50 · 2.47 · 33.58 | 5.10 / 1.09 / 10.29 | 1 162 | 17.4 | 0 | ✓ | 3.11→3.98 |
| pane, N = 16 | 103.7 (+112 %) | 87.38 (+157 %) | 31.71 · 19.48 · 2.86 · 33.33 | 6.63 / 1.71 / 13.63 | 2 417 | 18.6 | 0 | ✓ | 3.89→3.05 |

Pass 1's absolute figures sit 7–19 ms/s above pass 2's (one browser for all nine cells in a row, each cell inheriting the destroyed
layers of the ones before; load 2.4–3.8); both passes agree on the shape and on the verdict. **A control for the harness [MEASURED]:**
pass 1's projection read `canvas.clientWidth/clientHeight` on every call, forcing a style recalc and layout after the layer's writes;
with the size cached (read once and on resize, as an app would; `CACHED=1`, `07b-cost-pass2-cached-size.json`) bare N = 0 is 37.32 and
N = 8 is 79.77 ms/s — **+114 %**, the same; the forced recalc merely moves into the kit's own `readStage()` (its read phase 5.19 → 14.31
ms/s). Presents 21.0 / 19.5 per s, held 0, `field.ok` ✓, load 2.06→2.08 and 2.21→3.45.

**THE RULE (N = 8 bare ≤ +10 % over N = 0 and 0 held frames → D1 in 0.5.0; else D1 waits for brief 7's coalesced layer, 0.5.1):
NOT MET — +115 % (+43.0 ms/s, eleven times the threshold), 0 held frames, presents ≈ 20 / s against 21–23 with no layer.** Pane is
no cheaper.
**D1 is 0.5.1.**

**Where the +43.0 ms/s goes at N = 8 bare [MEASURED: CDP metrics, the layer's frame callbacks timed, a 6 s devtools trace after the
window, a 10 s V8 profile — `07-*`, `07c-profile-bare8.json`]: not the seat chooser — the layer's read phase (stage read, anchors, the
seat chooser, leaders, rests) is only +3.2 ms/s — but the per-frame DOM writes and what they cause: +9.9 ms/s for the spring runner's
step + paint and +0.7 for `viewChanged`'s paint (the layer's JS, +13.8 in all), then +13.4 ms/s of style recalc (≈ 1 400–1 600 elements
restyled per second, from ≈ 1 275 kit writes per second, ≈ 63 per frame), +1.7 ms/s of layout and +14.1 ms/s of paint / pre-paint /
layerize / commit — about two thirds of the cost is restyle and repaint downstream of the writes.** Details: the trace at N = 8 vs N = 0
reads 50 vs 9 style recalcs per second (880 of the 1 619 elements/s inside script, i.e. forced, the rest in the frame's lifecycle) and
paint-family events 32.1 vs 16.2 ms/s; in the profile the kit's largest function is `layer.js paint` (1.28 ms/s self), then
`perf.js setAttr`/`setVar` and the DOM natives they call — `getPropertyValue` (1.68) and `getAttribute` (1.17) are `perf.js`'s
skip-identical reads, which cost as much as the writes they skip (3 452 skipped vs 1 291 made per second); `seats.js` 0.54 and
`leader.js` 0.82. `viewChanged()` itself is 0.12 ms/s: it is already coalesced. [DERIVED from `layer.js`, `bodies.js`, `core/frame.js`] every
frame of a turning camera paints twice in the one batch — the runner's tick (a coalesced job) paints, then `viewChanged`'s
`frame.write(paint)` paints again, mostly re-writing what the tick just wrote (where the skip-identical reads go) — and the `kick()` in
`viewChanged` resets the runner's frame cap (`PHYS.cap`, 300), so a rotating camera keeps the springs and their writes running for as
long as it turns.
**So brief 7 as worded ("a coalesced `viewChanged`") would not move this number; the brief has to remove the per-frame writes**
(one compositor-only transform per moving body, no attribute churn per frame, one paint per frame, no skip-check reads on the hot path).

### 2 · LEGIBILITY — bare reads in 12 of 12 → **no ink brief** (PROVISIONAL until Josh looks) [MEASURED pictures; the reading is mine]

**The 24 PNGs:** `research/release-0.5.0/canary-a0/legibility/<picture>-<theme>-<frost>-<bare|difference>.png`, picture ∈ {hydrogen
(the boot preset `1s+2pz`), benzene (HOMO, `chem.orbital(nocc)`), c60 (HOMO, opened from its record after `__LW.chem.install('C60')`:
145 328 bytes from the network, 300 AOs, nocc 180)} × theme {light, dark} × frost {on = ALWAYS, off}. **Taken with the gate Firefox
`g.snap()`** (the driver composites the real page; the WebGPU picture is there, `field.ok` true in all three sessions on the first
navigation), viewport 1400 × 814 at dpr 1, the clock paused and AUTO-ROTATE off so the three shots of a view are the same pixels. Each
picture: the kit's layer with **two bare labels** (on a nucleus and a lobe or a second atom, title + maths) and **one block** (a `#`
heading, a sentence, display maths); `bare` = as the kit draws it; `difference` = `mix-blend-mode: difference` and `--info-ink: #fff`
on the layer ROOT (`getComputedStyle(root).mixBlendMode` read back `difference`). The page kit was injected as a `<script type=module>`
so it shares the app's module graph. The layer's ink follows λWAVES' theme: `body[data-theme="light"]` matches the kit's
`[data-theme="light"] .mir-info` — computed ink `hsl(232 22% 10%)` light, `hsl(40 33% 96%)` dark.

**A derived aid to the eye [DERIVED, `p2-contrast.py`, `08b-legibility-contrast.json`]:** a third shot of each view with the layer at
`display: none` (kept in `.tmp`, not committed) gives the ground under the words; in 24 px tiles the glyph pixels (most changed) are
compared with the ground (least changed, the layer's own shade included); a box "passes" when ≥ 90 % of its tiles reach 3 : 1. Below:
each box's median ratio · its share of tiles at ≥ 3 : 1 (label 1 / label 2 / block).

| picture | my reading, bare | my reading, difference | aid, bare | aid, difference |
|---|---|---|---|---|
| hydrogen · light · on / off | **reads** | reads, but the light shade turns to grey smudges and the words take the picture's complement (red over cyan) — worse | 7.2·83 % / 6.1·83 % / 8.2·89 % | 1.6·44 % / 4.4·57 % / 1.2·40 % |
| hydrogen · dark · on / off | **reads** | reads, no better | 9.4·100 % / 7.0·94 % / 9.9·96 % | 8.2·93 % / 6.0·89 % / 9.6·91 % |
| benzene · light · on / off | **reads**; the app's own atom letters (STAGE TEXT, difference-blended) fall inside the block's words | worse: the heading half blue over orange, grey smudges | 6.1·86 % / 6.9·100 % / 4.9·59 % | 1.8·20 % / 3.9·67 % / 1.1·18 % |
| benzene · dark · on / off | **reads — the weakest of the twelve:** the block's body over the orange lobe (white on orange ≈ 2 : 1) | worse there (dark blue over orange) | 5.1·71 % / 9.6·100 % / 3.6·61 % | 2.5·38 % / 9.6·100 % / 3.9·55 % |
| c60 · light · on / off | **reads** (checked at 2×); 60 atom letters interleave with the block's words | worse | 6.3·86 % / 6.4·100 % / 2.9·49 % | 3.2–3.4·53 % / 4.6·71 % / 1.1·9 % |
| c60 · dark · on / off | **reads** | worse (orange-brown over blue) | 6.5·86 % / 8.8·100 % / 3.3·56 % | 4.6·79 % / 7.5·90 % / 1.9·37 % |

**Verdict line, provisional:** by my reading bare reads in **12 of 12** (≥ 10) → **no ink brief**; `difference` reads in the 6 dark
pictures and is worse than bare in the 6 light ones (the shade is differenced too), never better. The aid agrees on the labels (median
5.1–9.4 : 1 in every picture) and points Josh at the one weak element: **the block's body over a saturated lobe** (benzene and C₆₀, median
2.9–4.9 : 1, ≥ 3 : 1 in only 49–61 % of its tiles; by its strict bar only hydrogen-dark passes, 2 of 12). **Frost changes nothing under the
words** (frost on vs off differs in ≤ 2 030 px of the stage, at the windows' edges). Found on the way, for D1: the app's ATOM LABELS and
the frame's axis lines cross the layer's words (benzene, C₆₀) — when D1 moves the stage text onto the layer, the atom letters must become
layer labels or keep out of the words; and an INVERT mode, if ever built, must drop the shade under `difference`.

### 3 · UNDER A RACK — 2 labels at shift +1, 2 at −1 → **the 18th brief is confirmed** [MEASURED, `09-rack-d4.json`]

H₂O (ORBITAL, HOMO), AUTO-ROTATE off, the layer with **3 labels on water's three nuclei** and 1 block whose `avoid` is the kit's own
rects; `__LW.camera.setShift(±1, 0)`, then 3 s for the springs to land. **The rects:** the kit's `uiSpace()`
(`lab/mir/shell/scene-guard.js`, the rects `createApp` hands the layer and the scene guard) fed λWAVES' columns as
`{ rack: { el: { racks: { left: #rackL, right: #rack }, floats: #floats } } }` → `[0, 300] × [0, 900]` and `[1100, 1400] × [0, 900]`
(λWAVES has no `rack.keepClear()`); the plain `getBoundingClientRect` of `#rackL` / `#rack` gives the same rects and the same counts.
A label counts when its `.mir-info-label` rect meets one.

| shift | labels meeting a rack (of 3) | the third | the block (it HAS `avoid`) |
|---|---|---|---|
| **+1, 0** | **2** — O at x 1064–1364, H at 1000–1299, under the right rack (x ≥ 1100) | its nucleus is off the stage: hidden (`data-gone`) | **meets the right rack** (x 911–1292) |
| **−1, 0** | **2** — O at 36–336, H at 105–405, under the left rack (x ≤ 300) | hidden (off the stage) | **meets the left rack** (x 112–494) |
| 0, 0 (control) | 2 — by 30–35 px (H 270–569, H 835–1135) | clear | clear |

Any count > 0 confirms the 18th brief (label avoidance of windows). **A second line for it [DERIVED from `info/layer.js`
`placeBlock`]:** the "beside the subject" branch sets `rx = S.left − gap − w` (or `S.right + gap`) with no clamp to the free stage, so
when the subject itself sits under a rack the block follows it under, `avoid` notwithstanding. The Chromium shots
(`09-rack-shift±1-chromium.png`; the WebGPU canvas is blank there, the DOM is not) show the words running across the MOLECULES and
PALETTE windows' controls.

### 4 · D4 — the sanitiser: **an image by data URL does not survive; an inline `<svg>` does not survive → text only in 0.5.0** [MEASURED]

`addBlock({ md })` on the adopted layer (its `render` is `shell/notebook-render.js` `renderNotebook`: marked → an inert `<template>` →
a tag/attribute allowlist), each case alone, read 1.5 s later in `block.el`:

| input | element in the DOM after? | what is left |
|---|---|---|
| `![a dot](data:image/png;base64,…)` | `<img>` **yes, without its `src`** | `<img alt="a dot">` — shows nothing |
| `<img src="data:image/png;base64,…">` | `<img>` **yes, without its `src`** | the same |
| `<img src="data:image/svg+xml;utf8,…">` | `<img>` **yes, without its `src`** | the same |
| inline `<svg …><circle …/></svg>` | **no** | an empty `<p></p>` |
| control: `<img src="/lab/img/icon-192.png">` (same origin) | **yes, with `src`; it loads** | the picture |
| control: the same with `onerror="…"` | yes; `onerror` stripped, never ran | the picture |

**Yes/no, as the rule asks:** data-URL `<img>` survives the sanitiser — **no** (the element stays, its `src` is removed:
`nbSafeURL` refuses `data:`); inline `<svg>` — **no** (`SVG` is not in the tag allowlist). So D4 is text only in 0.5.0, the 19th brief
stands; note for that brief: a same-origin image URL already survives, so pictures-as-files is a route the sanitiser allows today.

### 5 · THE M5 / WEBKIT COMMANDS — run here first [MEASURED here; on the iPad UNVERIFIED until Josh runs it]

Written from the kit's `docs/PROBE.md`, `tools/check-app.mjs`'s header and 0.4.0 MEASURE §4, and run here against a headless
stand-in before they reach Josh (`10-m5-probe-verify.txt`).

What running them here found: **`check-app.mjs` cannot judge λWAVES yet** — it waits for `window.__MIR.describe`, which λWAVES does not
create before the adoption wires `createDescribe`/`createApp` ("FAIL window.__MIR.describe never appeared"); **its `--webkit` cannot start
on this machine** (with `PW_CORE` pointed at a cached `playwright-core` 1.63: "webkit would not start …: this machine lacks 12 shared
libraries it needs (libWPEBackend-fdo-1.0.so.1, libWPEWebKit-2.0.so.1, libicudata.so.74, …)"; without it: "--webkit needs a Playwright
that is already on this machine"). **The probe works** (`serve`, `sessions`, `report`, `log --errors` — which even caught the warm-up's
"A valid external Instance reference no longer exists" — `run` of a file and of `-e`). **Port 8931 is taken** by BASINS' running probe
(`node tools/probe.mjs serve 8931 …/mir-1.5-adopt/app`), so the block uses 8932. Without `--data` the probe writes its records into the
kit's `tools/.probe/`, inside `~/Documents/MIR`, so the block passes `--data`. The page needs an ADOPTED copy (`lab/mir/info/`).

The block for Josh (from the root of a λWAVES checkout of `sos-s0` that holds this file; the adopt line is pass 1's, §6 step 1):

```sh
mkdir -p .tmp/m5
cp -r lab tests tools docs research MIR-MANIFEST.json package.json test.sh CLAUDE.md LICENSE NOTICE README.md REPORT.md CHANGELOG.md CITATION.cff AI_POLICY.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md DEPLOY.md RELEASING.md wrangler.jsonc package-lock.json .tmp/m5/
node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs .tmp/m5 --line 1.5
node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/probe.mjs serve 8932 .tmp/m5 --data .tmp/m5-probe
#   on the M5, in Safari:  https://10.0.0.18:8932/lab/?sw=0   — accept the certificate once; the dot top-right turns green
#   then, in a second terminal at the same root:
node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/probe.mjs sessions --port 8932
node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/probe.mjs report latest --port 8932
node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/probe.mjs run latest research/release-0.5.0/canary-a0/m5-info.probe.js --timeout 120000 --port 8932
#   (20 s: water turning 10 s with no words, then 10 s with 8 bare labels + 1 block — touch and drag the picture in the second 10 s)
node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/probe.mjs log latest --errors --port 8932
node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5/tools/probe.mjs run latest -e "const S=navigator.storage,b=await S.persisted(),g=await S.persist(),e=await S.estimate();return {ua:navigator.userAgent,standalone:!!navigator.standalone||matchMedia('(display-mode: standalone)').matches,persistedBefore:b,persistGranted:g,persistedAfter:await S.persisted(),usageMB:+(e.usage/1048576).toFixed(1),quotaMB:Math.round(e.quota/1048576)}" --port 8932
#   Ctrl-C the server, then:  rm -r .tmp/m5 .tmp/m5-probe
```

`m5-info.probe.js` returns the device (UA, touch points, dpr, viewport), `field.ok` and its adapter, and for each 10 s window the
display's frames (`probe.frames`: count, mean, p95, max, over 33 / 50 ms), the app's presents per second and, with words, the layer's
frame-callback ms/s. The persist line answers MEASURE §4's question for a **Safari tab**; the **Home-Screen** half stays MEASURE §4's
Web-Inspector paste on the installed app (an installed app is bound to its own origin, which the probe's 8932 is not).

### 6 · What pass 2 changes in the plan's wording

1. **D1 is 0.5.1 by the rule** (+115 %, confirmed with the field present and against a harness control). Brief 7 must be re-worded from
   "coalesced `viewChanged`" (already true) to **no per-frame DOM writes while the camera turns** (one paint per frame, a compositor-only
   transform per body, no per-frame attribute or path churn, no skip-identical reads on the hot path) — the fix the number needs.
2. **No ink brief** (provisional, Josh judges the 24 PNGs). If INVERT is ever built, the shade must go under `difference`.
3. **Brief 18 confirmed** (labels meet the racks at shift ±1, and by 30–35 px even centred), and it should carry the block's missing
   clamp to the free stage.
4. **D4: text only in 0.5.0**; the 19th brief can lean on same-origin image files, which already pass.
5. **The WebKit road for 0.5.0 is the probe**, not `check-app.mjs` (it needs `createDescribe`; WebKit lacks 12 system libraries here).
6. For the integrator: `main-thread.mjs` measures with the photosensitivity notice open (CDP's `navigator.webdriver` is false); whether
   that moves the floor is UNVERIFIED.
