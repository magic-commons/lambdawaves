# CANARY-A0 — PLAN-DRAFT-1 row A0 (Sonnet 5.5 measurer, 2026-10-08)

**A0: PARTIAL.** Stopped at a usage pause (agent-control, context 80 %). Measured: the baseline (§1), the adopted-copy canary on
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
