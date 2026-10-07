# λWAVES 0.4.0 · S1′ `cameraEye` — BUILD (wave 144)

Built by Opus 5.5 on branch `worktree-agent-ad4bb36f5df8a7072`, from `58852c7` (fast-forwarded). Nothing pushed, tagged or deployed.

## The commits

| sha | what |
|---|---|
| `a6f764b` | 1/4 `cameraEye` + `toScreen` beside `cameraBasis`; `writeView` asks it; `cameraKey` carries the shift |
| `f0e0af6` | 2/4 FIELDVIEW, KEPLER, PARTICLES, VORTEX project through `toScreen` |
| `f0efa03` | 3/4 `pointerRay`, `unproject` and the GLB camera ask `cameraEye` |
| `09a9e1d` | 4/4 the atom labels project through `toScreen` and write only on change; the stage text keys on its string |
| (this file + REPORT wave 144) | hand-off |

## The helper (`lab/field.js`)

```
cameraEye(obs, half) → { eye, target: [0,0,0], basis: cameraBasis(obs), shift: obs.shift || [0,0], D: obs.dist·half, tanH }
toScreen(obs, half, W, H) → cameraEye(…) + at(x, y, z, out?) → [px, py, depth] | null   (stage CSS px)
cameraKey(obs) → the orientation + '|sx,sy' (4 decimals; '|0.0000,0.0000' with no shift)
```

The arithmetic of every site is kept operand for operand (`depth * tanH * aspect`, `(u + 1) / 2 * W`), so at shift 0 nothing moved: the lock proves the ray pass and the lines; the overlays use the same expressions.

**For S2 — the shift lands in three seats, nowhere else:** `writeView` (the forward lane `v[12..14]` and `M_PERSP` `o[8]`, `o[9]`), `toScreen`'s `at` (add `shift·(W/2, −H/2)` to `out[0]`, `out[1]`), and `pointerRay` (`u − px`, `v − py`). The shift is NOT applied anywhere yet (deliberately: applying it in the overlays before the ray pass would split the picture). The GLB camera cannot express a lens shift (glTF perspective has no principal point); S2 decides whether to say so in the export's extras.

## The nine sites and their deleted lines

| site | before | after |
|---|---|---|
| `field.js` `writeView` | own `B`, `D = obs.dist * half`, `cam`, `tanH` (4 lines) + `lookAt(cam, ORIGIN, …)` | one line from `cameraEye`; `lookAt(cam, E.target, …)` |
| `fieldview.js` `draw` | eye + 6-line `proj` | `toScreen` + 1-line `proj` (−7) |
| `keplerview.js` `draw` | eye + 6-line `proj` | 1 line (−7) |
| `particles.js` | eye + the 9-line `project()` helper | 1 line; `project` is a closure on `S.at` (−10) |
| `vortex.js` `drawOverlay` | eye + inline dot projection + an inline one-line axis projection | `S.at` for both (−4); key gains `obs.fov` |
| `vortex.js` cache key | already `cameraKey` | unchanged apart from the FOV |
| `export3d.js` l.305 | `position: c.dir.map((d) => d * c.dist * half)` | `position: c.eye.map((e) => e * half)`; `rack.js` sends `cameraEye(obs, 1).eye`, the same `(dir·dist)·half` product byte for byte. `tests/export3d.test.mjs`' base camera now carries `eye: [3.3, 0, 0]` for `dist: 3.3`; its `[3.3·HALF, 0, 0]` assertion is unchanged and green |
| `rack.js` `pointerRay` | own `B`, `D`, `cam`, `tanH` | from `cameraEye`; returns `target` too |
| `rack.js` `unproject` | plane through the origin, `-(cam·fwd)` | plane through `target`: `((T − cam)·fwd)` — identical IEEE arithmetic at T = 0 |
| `rack.js` `placeAtomLabels` | the fourth PARTICLES copy, rewriting every span each CPU tick | `toScreen`; returns at once unless the key `(preset, size, cameraKey, dist, fov, half, W, H)` changed |

No tenth copy: `orbit.js` (the orthographic Bloch spheres) and `bowMove` / `fieldview`'s plane use `cameraBasis` for orientation only, not an eye. Grep: no site in `lab/*.js` computes `dist * half` or `lookAt(…, ORIGIN)` outside `cameraEye`.

## The two laws that rode along

- **The stage text** (`stageTextTick`): keyed on the string it would render (`stageText()`, now shared with `placeMolFormula`), not on `reg.version`; the DOM is touched only on change. No new event, no per-tick layout read.
- **The atom labels** write only on change (PLAN B3).

## Line counts

`lab/*.js` (`cat lab/*.js | wc -l`): **35,135 → 35,128** (−7). `git diff --stat 58852c7 -- lab`: 81 insertions, 88 deletions including `sw.js`' regenerated stamps. The helper and its comment cost 22 lines in `field.js`; the sites gave back 29.

## The lock

The tool's default is all three grids; the per-commit run is 96³ on the base fixture, which predates the W125 gas table, so it is checked with `--query gastab=0` (without it the gas state differs on the untouched tree, as the header says):

`LW_PORT=8743 GD_PORT=5211 node tools/perf/digest-lock.mjs --check --grids 96 --query gastab=0`

It compares **588 values** at 96³ today (the "208" of earlier waves is the fixture's older size). GREEN on the untouched `58852c7` and after each of the four commits: 0 readback differences, 0 record-byte differences, nothing unrepeatable, 0 page errors, 35 s each. No red result, so no P5 re-run was needed. The 1004-value lock (all grids) is not run here; it is S2's end gate.

## The gates

- `bash test.sh node`: green, 61 suites, none red.
- `node tools/new-project.mjs --check`: in step (16,829 B).
- `node tests/keyboard-shortcuts.test.mjs`: PASS.
- `node tests/export3d.test.mjs`, `node tests/kepler.test.mjs` (9/9): green.
- Browser on 8743/5211, one at a time: `export3d.browser-test` GREEN; `render-regressions.browser-test` exit 0; `current.browser-test` 15 PASS, exit 0; `frame-occlusion.browser-test` 7/7. Its first two runs went red at "scrolled-away modulation cards" (`updated` false: the mask had not refreshed 250 ms after a scroll) under a load average of 17–18 from the sibling's runs; the untouched base passed at that load, and this tree then passed 7/7. It is a timing flake under load, not the change, but S2 should watch it.
- There is no particles or vortex browser suite (`ls tests | grep -i 'kepler\|vortex\|particles'` finds `kepler.test.mjs` only).
- Light check (`.tmp/labels-check.mjs`, not committed): MOLECULES H₂O. The stage text reads `1s₀, 2p₀` before and `H₂O` after; the three labels move on `orbitBy(0.4, 0.2)` and are byte-identical 400 ms later.
- The before/after screenshot pair was not taken: the lock already covers the ray pass, and the overlays keep operand-for-operand arithmetic.
