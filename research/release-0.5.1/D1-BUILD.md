# D1-BUILD · THE STAGE TEXT becomes the kit's block (0.5.1 "Informational Update"; Opus builder, worktree agent-aeba657c669ee3661)

Base: `27eb96a` (yan-c, the 0.5.0-alpha "GUI Adoption" cut). Ports: tip 8973, base 8977 (`git archive 27eb96a` → `.tmp/base`).
Brief: `research/release-0.5.1/BRIEF-D1.md`.

## §measure

### Step 1 · the instrument (U1)

`tools/perf/main-thread.mjs` gained three things, nothing else changed in its method:

- `--setup '<js>'` — an expression `await`-evaluated on the MEASURED page after `__LW.ready` and the notice dismissal, BEFORE the
  pause / settle / 400 ms / play; its answer is recorded per run (`setup`) and the expression in the JSON (`setup`).
- `--sweep S` — CDP `Input.dispatchMouseEvent` moves over the stage for the first S s of the 30 s window, 40 a second (a slow
  figure across the picture: x 30–70 %, y 50–80 % of the 1600 × 1000 page; recorded as `sweep`).
- `served` — what the PORT serves, fetched once from `https://127.0.0.1:PORT/lab/rack.js`: its `BUILD_LINE` and the sha-256 of
  rack.js (C-V N8: the `sha` printed was always the CWD's; base and tip share one version line, so the hash is the identity).

THE D1 SCENE (the `--setup`, `.tmp/scene.mjs on|off`, the A0 spike's `p2-lib.mjs water()` verbs):

```js
(async () => { const c = __LW.chem; await c.solve('H2O'); c.setOn(true); c.setView('orbital'); c.orbital(c.state().nocc);
  __LW.camera.setAutoRotate(true); await __LW.settle(); await __LW.settle();
  if (__LW.stageText.on !== true) [...document.querySelectorAll('.sw')].find((e) => (e.querySelector('.sw-lbl') || {}).textContent === 'STAGE TEXT').click();
  await new Promise((r) => setTimeout(r, 900));
  return { mol: c.state().on, view: c.state().view, homo: c.orbital(), auto: __LW.camera.autoRotate, stage: __LW.stageText.on, md: __LW.stageText.md }; })()
```

Every run answered `{"mol":true,"view":"orbital","homo":5,"auto":true,"stage":<arm>,"md":"$\\mathrm{H_{2}O}$"}`; field ok (RTX 3070),
notice dismissed, `--runs 1` each, interleaved off/on 5 + 5, `--sweep 10`, the rig quiet before each run (`.tmp/rig.sh`: load < 4,
no geckodriver / chrome / marionette; then `wait-gpu.mjs`). Served rack.js sha-256 `1f688467216239e1` on every base run.

### The base arms (2026-10-09 ≈ 18:40–18:55 CDT; `d1-measure/m1-base-arms.json`)

| arm (base `27eb96a`, D1 scene + 10 s sweep) | median ms/s | spread | runs | script · layout · recalc | presents/s (median; runs) |
|---|---|---|---|---|---|
| STAGE TEXT **off** | **94.171** | 15.347 | 96.87 94.755 81.523 94.171 82.465 | 26.17 · 6.12 · 14.17 | **26.7** (27.3 26.7 26.2 27.8 25.9) |
| STAGE TEXT **on** (today) | **68.190** | 6.812 | 68.19 71.934 65.311 65.122 69.904 | 20.12 · 4.19 · 9.22 | **18.1** (18.2 17.1 18.6 18.1 17.4) |

**Today's stage-text cost, as it falls out:** the main-thread figure goes DOWN by 26 ms/s with the stage text on — because the
frame rate goes down by a third (26.7 → 18.1 presents/s). Per present the main thread pays 3.53 ms off and 3.77 ms on (+0.24 ms a
frame: the letters' transform writes under AUTO-ROTATE). The rest is NOT main-thread work: something the stage text puts on the
page costs the compositor / GPU a third of the frames in this scene (the prime suspect is `#atomLabels`' `mix-blend-mode:
difference` over the WebGPU canvas; not isolated here — a diagnostic arm, not a gate). **Read every ms/s pair of this row with its
presents/s beside it**: a tip that changed the frame rate would move ms/s for a reason the pair cannot see. The letters stay in
0.5.1 (R6-L), so base-on and the tip both carry them.

**The noise:** the off arm's spread is 15.3 ms/s and the on arm's 6.8 in this scene (the boot scene's were 3.0 / 2.2 in C-V) — the
3.536 gate is a NOISE gate (E12) set from the boot scene; in the D1 scene a single interleaved 5 + 5 is close to its floor.

### U2 · the idle witness (tip `0f7915a`, 2026-10-09 16:38; `.tmp/p-u2.mjs` → `d1-measure/u2-witness.json`)

The D1 scene on the tip (H₂O · ORBITAL · HOMO · AUTO-ROTATE · STAGE TEXT on, playing), the entrance landed (3 s), then a
`MutationObserver({ subtree, attributes, childList, characterData })` on `layer.root`:

| window (10 s each) | records | `layer.debug().running` | letters' writes (the camera turns) | KaTeX renders · re-placements |
|---|---|---|---|---|
| **A** AUTO-ROTATE, no pointer | **0** | **false** | 40 | 0 · 0 |
| **B** + 40 moves/s over the picture (the pair's own sweep: x 30–70 %, y 50–80 %) | **0** | **false** | 103 | 0 · 0 |
| C + 40 moves/s back and forth THROUGH the block's rect (a reader reaching across the words) | 749 | true (1.5 s after) | 107 | 0 · 0 |

**The witness holds (A and B: 0 records, the runner idle).** C is not the witness's case, but a record appeared there, so its
writer was found: every record is the block's own `style` (`translate: …`), written by the kit's body runner `paint()`
(`layer.js:377`), kicked by `onMove` whenever the pointer is within `PHYS.reach` = 260 px of a body (`layer.js:649`, the second
disjunct — independent of `parallax`), and moved by the pointer force "the pointer parts them like water" (`bodies.js` `sub()`,
`P.pointer` × heat). A pointer passing near the words nudges them up to ≈ 60 px aside, and they spring back within the runner's cap
once it stops. `parallax: false, follow: false` cannot turn it off, and no layer option does; HOLD (I) does (`freeze` → no pointer
in `env()`, no kick). **This is a little "fleeing" against R6-F's "still"** — Josh's to see; a brief candidate (below: a still
block, no pointer force).

## §the drafted CLAUDE.md paragraph (for the integrator / D-V; NOT applied here)

It replaces the paragraph that begins "THE STAGE TEXT (Settings › Display, ONE row: …" up to "(KIT BRIEF 6 replaces it at 0.5.0)."
(the MOLECULES-mode sentence that follows it, "While a molecule owns the field SPECTRUM is FOLDED …", stays as it is):

> THE STAGE TEXT (Settings › Display, ONE row: the switch and its SIZE; PREFERENCE `molFormula` / `molFormulaSize`, on by default,
> 50–300 %) writes what is playing on the stage as ONE block of the kit's INFORMATIONAL layer (`createInfoLayer` in `rack.js`
> `initStageText`, 0.5.1 D1; `lab/stage-text.js` is gone): the MOLECULES formula ($\mathrm{H_{2}O}$) while MOLECULES is on,
> otherwise SPECTRUM's populated states in `stateLatex`'s prose ("$2s_{0}$ and $2p_{-1}$"; A ↔ B under a TRANSITION) — never a
> live coefficient. The layer has no subject, no features and no labels, parallax, drift and following off, and is NEVER told of a
> camera move (`viewChanged()` only when the racks hide or slide, the transport docks or moves, or the TIMELINE opens or docks; the
> kit's ResizeObserver covers a size): idle it writes nothing (D1-BUILD U2: 0 records over AUTO-ROTATE and a pointer sweep).
> Its key is the string it would render: a changed string is `remove()` + `addBlock({ md })` (the kit's exit and entrance), KaTeX
> runs at most four times a second, and nothing is added while the switch is off (the root `hidden`). It wears the kit's look —
> ink, the feathered shade, the serif face — at the kit's seat: the free stage's top + 12 %, between the racks, clear of the
> undocked transport and an open TIMELINE (`avoid`); under every window (`.mir-info.lw-stage` z 20 < the racks' 30, `lab.css`),
> never a pointer target, never in the occlusion mask. THE FADE: a HAND's preset (STATE's PRESET and RELOAD, MO-REGISTRY's WINDING
> / HOMO + LUMO and STATES presets) is announced as the block (`data-fade`, the heading size) for 2.4 s — the formula leaves and
> returns, and the kit's exit is the fade — `WINDING · $1e_{1g}$ (a) + (b)`, the names from `lab/names.js`; the press threads
> `{ hand: true }`, so a restore, an undo, a project or link open never announces (`tests/stage-text.browser-test.mjs`). HOLD (I,
> the kit's `infoActions` row; `lab/key-table.js` carries a row's `up`) holds the words still while the key is down. The same
> switch and SIZE govern the ATOM LABELS, λWAVES' own letters (R6-L; kit labels are D1b, Group II): each MOLECULES nucleus marked
> with its element symbol at its projected position (`toScreen`, written only when the camera, molecule, size or canvas changed),
> white under `mix-blend-mode: difference` so they invert whatever is beneath them. The older `atomLabels` / `atomLabelsSize` keys
> are read once (only where `molFormula` was never written) and dropped. The type scale is the notebook's three sizes: the formula
> its title (34 px), an announcement its heading (22 px) — the kit's `--info-size-body` overridden in `lab.css`, each held to 8 vw
> and at least 16 px — an atom label its body (14 px), each × SIZE. It never reaches an export: a picture, a loop and a video carry
> instead its one plain-Unicode CAPTION (`H₂O · 1b1 HOMO · STO-3G`, or the states), drawn by `lab/capture.js` `drawCaption` and
> following the same switch (D5, Group II, replaces it).

### THE PAIR (G-M), both scenes, base `27eb96a` (8977) vs tip `0f7915a` (8973), 2026-10-09 ≈ 16:40–17:05 (`d1-measure/m2-pairs.json`)

Interleaved per round boot-base · boot-tip · d1-base · d1-tip, 5 rounds, `--runs 1` each, notice dismissed, `field.ok` on every
run, the rig quiet before each (load 2.2–3.6 from the other builders' idle processes; no other browser). Served rack.js sha-256:
base `1f688467216239e1`, tip `510760d06e7df69d` on every run of each.

| scene | base median (spread) | tip median (spread) | **Δ median** | gate | presents/s base · tip |
|---|---|---|---|---|---|
| **BOOT** (the tool as it is: `?sw=0&warn=0&starter=home`, 1s + 2p_z, STAGE TEXT on → the states' prose block) | 42.609 (0.989) | 42.500 (1.066) | **−0.109 ms/s** | ≤ 3.536 · **PASS** | 24.7 · 24.8 |
| **D1** (H₂O · ORBITAL · HOMO · AUTO-ROTATE · STAGE TEXT on · 10 s sweep over the picture) | 64.895 (1.993) | 64.527 (5.317) | **−0.368 ms/s** | ≤ 3.536 · **PASS** | 18.7 · 18.6 |

Runs — boot base 43.049 42.06 43.035 42.609 42.323 · boot tip 42.149 42.721 42.5 41.83 42.896 · D1 base 65.665 64.914 64.895
63.672 64.7 · D1 tip 69.31 64.527 66.848 63.999 63.993 (the tip's one high run, round 1, came at load 3.27 → its presents 17.7).
Attribution medians (script · layout · recalcStyle ms/s): boot 16.57 · 0.69 · 0.32 vs 16.50 · 0.68 · 0.31; D1 19.38 · 3.98 · 8.99
vs 19.35 · 3.90 · 8.81. The frame rate did not move (the reading the pair cannot make on its own, §step 1).

**THE THREE ARMS (U1), read together:** D1 scene · base STAGE TEXT off 94.171 ms/s at 26.7 presents/s · base on (today) 68.190 at
18.1 (step 1's run) / 64.895 at 18.7 (this pair's run) · **tip 64.527 at 18.6**. The kit's block costs what `#molFormula` cost — nothing
the instrument can see — and today's third of the frames is still paid by what both trees share with STAGE TEXT on (the
letters, which stay by R6-L, are the suspect; see §the frame cost below if measured).
