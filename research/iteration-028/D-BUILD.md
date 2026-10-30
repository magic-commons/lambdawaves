# ITERATION 028 · CHAIN D — THE FIELD AND THE FILM · BUILD

Builder: Opus 5.5 (Claude Yan's fleet), 2026-10-30, on its own branch fast-forwarded to `yan-c` @ f8cf192e. One commit per row, each
with the test of its failure; the integrator merges. No label moved: no stored key, window id, target id, CSS hook or format. No app-literal
change, no module import added or moved (rack-deps HOLDS, persist 24 of 25; the cycle count was not re-run since no import edge changed).

## ROWS CLOSED

| row | commit | what changed | its failure's test |
|---|---|---|---|
| R-01 HIGH | c1711245 | `lab/field.js` grows `reconfigure()`: it configures the context with the gamut in force and COPY_SRC while a tap reads. `tap()` and `setGamut()` now go through it (setGamut's two inline configure literals are gone). `lab/capture.js` `configureCopy(f, canvas, false)` hands the context back through `f.reconfigure()` and no longer sets a plain RENDER_ATTACHMENT under a live SHADER tap. That covers both roads: the film's `after()` (render-exact.js, unchanged) and the PICTURE's `finally`. | `tests/film-handover.browser-test.mjs` scene 5: a FEEDBACK node live through a 1-s clip and then a picture. It asserts the context's own `getConfiguration().usage` carries COPY_SRC before, after the clip and after the picture, that there are 0 uncapturederror, and that the stage presents after each. **Old tree: RED, copySrc `[true, false, false]`**. New tree: GREEN. |
| R-23 LOW | 52022818 | `lab/node-shader.js` `bake()`: each film record holds its target, a STRAIGHT copy, one MAP_READ buffer and one byte array, sized once per w·h (no allocation per frame). A STRAIGHT pass reads the target's written bytes and divides each premultiplied byte by the alpha byte, rounded half to even in integers: the JS loop's own arithmetic, now on the GPU. `lab/film-bake.js` keeps one tmp canvas per film, and the JS un-premultiply loop is gone. | `tools/perf/film-bake.mjs shaders` (FEEDBACK + REFRACT + FLOW, 6 frames, 4 runs): **digests identical before and after**, `000023b2b39cf650 e0897d78928e9a9a 1d52d5abd1ff0b8d 2bb7f13c2b01d4b3 a719b10ae018ebe0 6fea2fda37bbc745`. The buffer reuse alone was also run against the old JS loop and gave the same digests. |
| R-32 | 65272aef | `tools/build-deploy.mjs` §V2 (no lab/ edit; see below). `shell/facade.js → ../../tools/conduct-score.js` is now named in DEV_ONLY beside THE DEVICE REPORT, the table DEPLOY.md's V2 row names for this case. A new EMPTY_BASE table names the one base `volumes.js → ./volumes/`. Any other empty base or upward escape still fails. | `node tools/build-deploy.mjs`: RED with 2 V2 problems on yan-c, now **"dist/ is complete and verified — 1740 files, 29.54 MiB"**, exit 0. |
| R-33 | fab14a4e | `research/release-0.5.2/lw-facade.json` re-captured with `--write` as the last row. | lw-facade RED on yan-c, now GREEN 1 of 1. |

## R-23: WHY NOT IN THE TONE WRITE ITSELF

The review's fix put the division in the TONE pass's own write. I built that first (an `fts` entry point: `round(c·255)`, then the same
integer division). It moved the film: 36 of 575 partial-alpha pixels in a FLOW frame came out one premultiplied byte off (`255,200,204,70`
became `255,204,204,70`). The cause is that the hardware's float→unorm8 rounding of the TONE write is not WGSL's `round()`. Reading the
written bytes back in a second pass keeps the hardware's rounding exactly. The cost is one extra full-screen pass and one texture per film
record, and no JS pixel loop.

## R-32: WHY THE FIX IS IN THE BUILD'S LAW, NOT IN lab/

- **The conductor.** Moving `conduct-score.js` inside lab/ would mean a new DATA root or NEVER_PRECACHE rule in `lab/sw.js`, which is
  edited only through `pwa --write`. It would also mean churn in tools/conduct.mjs, tests/conduct.test.mjs, the skill and docs/laws/film.md,
  all for a module that only `tools/conduct.mjs` calls against a local server. DEV_ONLY is the existing law for exactly this case: a
  normal boot never fetches it, and on the deployed origin `__LW.conduct.apply` 404s, like `?report=1`.
- **The volumes base.** `volumes/` is sw.js §1b's DATA root. Only `--shelf` fills it, and `lab/volumes` is the git-ignored dev link,
  so no file can live there in lab/. I refused the other road: shipping an empty `volumes.json` would make `shelf()` take a schema-1
  shelf with no volumes as the answer and stop falling back to the device's installed volumes, which is a behaviour change. Without a
  shelf the 404 is already `shelf()`'s "no volumes published" by design. With `--shelf` the base resolves as before.
- **For chain F.** DEPLOY.md's V2 table could gain one line for `[base] ships empty BY DESIGN` (the EMPTY_BASE table). I left it out
  because DEPLOY.md is F's file.

The deploy build's §V output:

    V1 PASS  419 precache entries: every one present in dist/ and every content hash re-verified against the shipped bytes (7.98 MiB).
    V2 PASS  1419 relative src / href / import / url() / manifest references walked; every one resolves to a file that is in dist/.
             3 reference(s) by design: dev-only above the deployment root, or a DATA root's empty base (see NOTES).
    V2 PASS  manifest scope / start_url / id all resolve to https://host.invalid/
    V3 PASS  manifest link · register('./sw.js') · icon · apple-touch-icon · theme-color · og:image is this build's address · relative register
    V4 PASS  no SharedArrayBuffer, no Atomics, no crossOriginIsolated in the 1740 shipped files
    V5 PASS  the manifest, the icons, the precache and the update policy are proved against lab/.
    V6 PASS  workers_dev: false · wrangler.jsonc assets.directory "./dist" = this build
    NOTE dist/rack.js → ../tools/perf/device-report.js  climbs above the deployment root BY DESIGN — THE DEVICE REPORT
    NOTE dist/shell/facade.js → ../../tools/conduct-score.js  climbs above the deployment root BY DESIGN — THE CONDUCTOR (026 A2)
    NOTE dist/volumes.js → ./volumes/  [base]  ships empty BY DESIGN — THE SHELF (iteration 005 S)
    dist/ is complete and verified — 1740 files, 29.54 MiB.

## THE FACADE DIFF (R-33)

    + ["conduct","value"]        after ["render","get"]      (026 A2 THE CONDUCTOR)
    + ["skeletonArgs","method"]  after ["nodes","value"]     (025 B2)
    gone: none · turned: none · 185 members (61 value · 49 get · 75 method)

## GATES

- `node tests/pwa.test.mjs --write && ./test.sh node`: EXIT 0 after R-01 and after R-23 (render-exact's node rows inside). `wiring` and
  `pwa` GREEN after R-32.
- **THE LOCK** on this worktree's own server (9817 / GD 5817): `--query gastab=0` **843 · 0** (GREEN, 0 readback, 0 record-byte
  differences). With the s4a fixture plus `--query gastab=0`: **987 · 0** (GREEN). One s4a run without `--query gastab=0` read 12
  gas-leaf differences. That run left out the query CLAUDE.md asks for and is not a moved pixel; the run with the query is the gate.
- Browser, one at a time: `film-handover` GREEN (scenes 0–5) · `timeline` GREEN 0 failing of 14 · `curves` GREEN · `node tools/x-probe.mjs x4`
  `identical: true` · `tools/perf/film-probe.mjs` picture · loop · video · frames · verify all ok, 0 errors after · `lw-facade` GREEN after `--write`.
- `node tools/rack-deps.mjs --classes --no-write`: HOLDS (bare writes 0; persist 24 of 25).

## LEFT, AND WHY

- R-01 on Chromium: the 58 uncapturederror the review measured is a Chromium validation. This machine's headless Chromium reaches only
  SwiftShader and loses the device, and Firefox does not validate a surface copy's usage. So the row's red-to-green proof is the
  context's own usage read in Firefox. It reproduces the exact condition (COPY_SRC dropped under a live tap). A headed-Chromium run on
  the RTX would confirm the 0 errors directly.
- R-23's frame-time line (the review's 12.0 s for a 60-frame 3-node 1080p clip) was not re-measured. What it costs is gone (per-frame
  allocations, the JS pixel loop); for reference, the film-probe RECORD of 180 frames (no SHADER node) ran 37.2 s here.
