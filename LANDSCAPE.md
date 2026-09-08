# λWAVES — LANDSCAPE

**What the code is, and where.** Written 2026-09-07 for an LLM taking over cold.
Companion to `HANDOFF.md` (what is left to do). Neither replaces `REPORT.md`, which is
the lab notebook: every law, constant and named proof, and the place to look when you
need to know *why* a number is what it is.

---

## THE SHAPE OF IT

λWAVES is a **static tree of ES modules**. No build step for development — what you
edit is what the browser runs. `./serve.sh` and open it. There is no framework, no
bundler, no npm dependency at runtime. The only vendored code is KaTeX and `marked`.

Three layers, and the boundary between them is the thing to respect:

```
   THE PHYSICS          exact, closed-form, testable in node with no browser
      hydrogen.js, atoms.js, mo.js, h2ci.js, wigner.js, radiation.js, kepler.js,
      dynamics.js, electrostatics.js, sturmian.js, frontier.js, twocentre.js, …
         ↓ a register of 91 complex coefficients, evolved by e^{-iE_n t}
   THE FIELD            WebGPU: reconstruct ψ on an N³ grid, raymarch it
      field.js (916 lines) + the WGSL inside it, render-exact.js, particles.js
         ↓ a texture, and readPixels() for the gate
   THE INSTRUMENT       the rack, the windows, the transport, the modulation plug-in
      rack.js (5603), kit.js (922), modwindow.js (2969), + ~40 *view.js modules
```

**The physics never imports the UI.** That is why the node gate can prove the maths
with no browser at all, and it is worth preserving.

## THE FILES THAT MATTER MOST

| file | lines | what it is |
|---|---:|---|
| `lab/rack.js` | 5603 | **The hot file.** Every window, the transport, the menus, the camera, the keyboard table, projects, settings, history. If you are changing behaviour, it is probably here. |
| `lab/modwindow.js` | 2969 | The HOST half of the modulation plug-in — all wiring for the frozen artifact under `lab/mir/`. |
| `lab/modhost.css` | 2426 | The SKIN half. 644 `:root:root:root` prefixes, which are DESCENDANT selectors (`html #modwin …`) because the artifact's own sheet loads last. |
| `lab/kit.js` | 922 | The control vocabulary: knob, switch, segmented select, trigger, fader, readout, device chassis. Every control in the lab is one of these. |
| `lab/field.js` | 916 | WebGPU. Reconstructs ψ from the closed-form mode tables — no basis textures — and raymarches density / phase / Re / Im / diff. |
| `lab/lab.css` | 1378 | The house sheet: token ladder, rack grammar, and (at the foot) the keyboard manual. |
| `lab/skin.css` | 822 | The material: glass, neumorphic ink, the theme token sets. |
| `lab/state.js` | 702 | The 31 presets. |
| `lab/statelink.js` | 592 | The URL codec — the whole state as a fragment. Bit-packed; see §AXIS_INK for how a new field is added without breaking old links. |
| `lab/keymap.js` | 1009 | The drawn keyboard + rebinding editor. **Never yet opened in a browser.** |
| `lab/history.js` | 182 | The undo ring: `ring[] + cursor`, labels, `entries()`, `goto()`. |
| `lab/sw.js` | 307 | The service worker. Its cache name is derived from its own precache hashes — hence the re-stamp law. |

## THE GATE

`tests/` is **18,482 lines** against 26,824 lines of app. That ratio is deliberate.

- `tests/boot.browser-test.mjs` — **8433 lines, 165 blocks.** A real headless Firefox
  driving the real UI. Each block is a **law written in prose** followed by a probe
  that measures it, so a failure reads as a sentence. This is the file you will spend
  most of your gate time in.
- `tests/mir.test.mjs` (1645) — proves `lab/mir/` is byte-identical to the artifact.
- `tests/pwa.test.mjs` (859) — the precache digest. **`--write` re-stamps it.**
- `tests/wiring.test.mjs` (531) — resolves the real import graph and fails on any
  `lab/**/*.js` no root reaches.
- `tests/access.test.mjs` (187) — the screen-reader laws: tab order (A1), the slider
  ARIA contract in both of kit.js's writers (A2), the chatter guard (A3), a driven
  control announcing its base (A8), the knob's one quantiser (A9), and a radiogroup
  that can never ship with zero reachable seats (A10). It also holds a **ceiling of
  four live regions in the whole tree** (A4) — a fifth fails, because 107 readouts
  rewrite on a 10 Hz guard and one polite region on any of them queues an utterance
  per change. Announce with ordinary text nodes. **The 44 px hit law is NOT here** —
  it is in the browser gate's own sweep.
- The rest are physics suites: hydrogen, frontier, dynamics, atoms, mo, wigner,
  radiation, electrostatics, sturmian, twocentre, pulse, kick, palette, ink, history,
  capture, statelink, render-exact, audio.

`tools/gate/` holds the vendored harness — `server.py` (HTTPS, makes its own cert into
a gitignored `.certs/`), `gatekit.mjs` (`open`, `ev`, `judge`, `done`), `drv.js`
(WebDriver). Wave 106 vendored these; before that they lived in a different repo and a
clone could not run one browser block.

## THE DOCUMENTS

| file | what it is |
|---|---|
| `REPORT.md` (403 KB) | **The lab notebook.** Laws, constants, measured numbers, named proofs, and one section per wave in the words the wave gave itself. Read the wave section before changing that wave's work. |
| `DEPLOY.md` | Shipping, and the traps. Why its own hostname, why `html_handling: "none"`, why `workers_dev: false` from the first deploy. |
| `docs/ui/STYLE-LOCK.md` | What the interface may and may not look like. Includes the PORTED-WINDOW EXCEPTION that lets `lab/mir/` be what it is. |
| `docs/ui/ANTI-PATTERNS.md` | The numbered list the gate and the comments refer to. **AP6** = never type a number twice. **AP14** = the stale precache. **AP17** = a finished module nothing calls. |
| `docs/ui/MOTION-LAW.md` | What may move, how fast, and what `prefers-reduced-motion` turns off. |
| `CHANGELOG.md` | Generated by `node tools/changelog.mjs` from git tags + `REPORT.md` headings. Do not hand-edit. |
| `research/` | The two-lab adversarial maths ledgers behind the physics. Small, tracked, and the reason several windows are exact rather than approximate. |

## THINGS THAT WILL SURPRISE YOU

- **The camera boots FREE.** The pose is a unit quaternion; `obs.yaw`/`obs.pitch` are a
  READOUT re-derived from it. Turntable arithmetic is not valid there. This is the
  single most common cause of a confusing test failure in this repo.
- **`__LW` is the read-back surface**, `__LW_hooks` is the write surface. The gate
  reads the app through `__LW` and never through a copy of the app's own tables.
- **The modulation window is not a rack window.** It is a plug-in window in the float
  layer with its own chrome, its own size law and its own nine-dot grip. The playhead
  pill is its minimised mode. Josh: *"Modulation related stuff stays with modulation.
  It must be treated like the outlier and it's okay."*
- **The playhead's round button is the house mark** — a live clone of `#title .mark`,
  repainted by `paintMarks()` so it turns with the palette wheel. It opens the
  modulation window. The ↗ it used to wear is now the dock button.
- **The accent is a palette angle, not a hex.** `--acc` and `--acc2` are two angles on
  the current palette wheel, so turning the wheel recolours the entire interface —
  and the logo is that same wheel verbatim (λ at 0°, nine squares at 0°, 40°, … 320°).
- **`?play=1` and `?warn=0`** exist for automation. `navigator.webdriver` also bypasses
  the photosensitivity modal, or it would stand in front of every screenshot.

## HOW TO WORK ON IT

```bash
./serve.sh                        # https://127.0.0.1:8700/lab/
./serve-lan.sh                    # same, reachable from a phone or iPad (8710)
./test.sh node                    # the maths and the file laws — fast
./test.sh browser                 # the real UI in a real browser — ~20 min
node tests/pwa.test.mjs --write   # AFTER ANY lab/ EDIT. Not optional.
node tools/build-deploy.mjs       # assemble and prove dist/
```

A wave is: read the relevant `REPORT.md` section → change the source → re-stamp the SW
→ run the node gate → run the browser gate → write the wave's own section into
`REPORT.md` → commit. The prose is not decoration; it is how the next person (or the
next model) knows which of two plausible readings of a control was the decision.
