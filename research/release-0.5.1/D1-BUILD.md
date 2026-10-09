# D1-BUILD · THE STAGE TEXT becomes the kit's block (0.5.1 "Informational Update"; Opus builder, worktree agent-aeba657c669ee3661)

Base: `27eb96a` (yan-c, the 0.5.0-alpha "GUI Adoption" cut). Ports: tip 8973, base 8977 (`git archive 27eb96a` → `.tmp/base`).
Brief: `research/release-0.5.1/BRIEF-D1.md`.

**THE VERDICT — every closer met; the row is offered for merge.** THE PAIR: boot **−0.109 ms/s**, D1 scene **−0.368 ms/s** (gate
3.536; presents/s unchanged). THE WITNESS: **0 records** on `layer.root` over 10 s of AUTO-ROTATE and over 10 s of a 40 moves/s sweep
over the picture, `debug().running` false (a sweep THROUGH the block moves it — the kit's pointer push, writer found, U2 C). U3
**18/18** clear (after a settle fix); U4 **4 renders / 4 entrances** in a stroke's second; U5 **one fade, 2.4 s**, 0 on undo / link /
project / a handless preset. Suites green (legacy boot = its 4 known law reds). Ledger **−56** (27,594 → 27,538). Found on the way:
the letters' `difference` blend costs ≈ 30 % of the frames in the D1 scene (§the frame cost; unchanged here, R6-L).
Sections below, in the order they were taken: §measure (step 1, U2, the pair) · the CLAUDE.md draft · U4 · U5 · §the build (what
changed, the ledger, THE LOCK) · brief candidates · merge notes · U3 · §suites · what Josh will see · the frame cost.

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
difference` over the WebGPU canvas — isolated later: §the frame cost). **Read every ms/s pair of this row with its
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
letters' `difference` blend, which stays by R6-L: §the frame cost).

### U4 · the churn (tip, 2026-10-09 16:53 / 17:02; `.tmp/p-u4b.mjs` → `d1-measure/u4-churn.json`, `.tmp/p-u4.mjs` → `u4-churn-vertical.json`)

SPECTRUM's state grid opened (+ MODE), CLEAR (the stage string empty), then ONE left paint stroke through CDP, the KaTeX runs
(`stats.renders`) and the block entrances (a `MutationObserver` on the root counting added `.mir-info-block`s) timed from the press:

| stroke | items it took | stroke | renders = entrances | at (ms from the press) | in the stroke's first second |
|---|---|---|---|---|---|
| **across row n4's first line** (4s₀ 4p₋₁ 4p₀ 4p₁ 4d₋₂ — the line holds 5) | 5 | 1003 ms | 5 | 46 · 295 · 545 · 801 · 1054 | **4 · 4** |
| down the first chips of n1…n6 (1s … 6s; the wrapped lines between add 3d₋₁ 4d₋₁ 4f₋₂ 4f₃ 5d₋₁ 5f₋₂ 5f₃ 5g₀) | 14 | 1697 ms | 8 | 51 · 300 · 554 · 808 · 1062 · 1316 · 1568 · 1823 | **4 · 4** |

**The gate holds: KaTeX at most four times a second, one entrance per render, and the last string always lands** (the trailing
render is the gate's own: a change inside the quarter second waits, then renders what is wanted then). The ladder's paint stroke is
one undo row as before. **What a stroke looks like:** the block leaves and re-enters every 250 ms while the hand paints — the kit's
exit (120 ms) overlapping the next entrance (340 ms spring, the old block still fading as the new one rises), re-centred each time
on the new width. In a headless capture that cannot be judged; by its timing it will read as a 4 Hz pulse at the seat for the
length of the stroke. Josh's to see; `handle.update(md)` (a brief candidate already listed) would let the string change in place.

### U5 · the fade (tip, 2026-10-09 16:53; `.tmp/p-u5.mjs` → `d1-measure/u5-fade.json`)

A HAND's preset through STATE's own select (1s + 2s, the press's road), the root sampled from the press:

| t (ms) | 101 | 1200 | 2301 | 2501 | 2700 | 3200 |
|---|---|---|---|---|---|---|
| fade blocks (`data-fade`) · of them `in` | 1 · 1 | 1 · 1 | 1 · 1 | 1 · 1 (leaving) | **0** | 0 |
| blocks in the root | 2 (the formula leaving) | 1 | 1 | 2 (the formula back) | 1 | 1 |
| `banner` | `1s \+ 2s  beat` | = | = | null | null | null |

**One fade block for 2.4 s, then its exit (gone by 2.7 s), and the formula back in its seat** (`1s₀ and 2s₀`, 34 px). The heading
size on the fade block is 22 px (the suite and the PNG probe). `stats.announced`: the hand press **1**; `__LW.loadPreset('3dz2')`
(no hand) **0**; an undo **0**; a link open **0**; a project open (DEMOS/WAVE DANCER) **0**.

**HOLD (I)**, same session, through the ONE KEY TABLE (CDP key events, the stage focused): key down → the root carries `data-hold`
(the kit's hold-still); key up → it is gone. The row lists as `info-hold` · `KeyI` · WINDOWS & DISPLAY · "hold the stage text still
(while I is held)".

## §the build

**What changed** (commit `0f7915a` + the settle fix `aaeb88e`):
- `lab/rack.js` `initStageText()` — ONE `createInfoLayer({ stage: dom.stage, parallax: false, drift: false, follow: false, avoid })`,
  no `subject`, no `features`, no labels; `avoid()` = the two racks' columns that hold an open card, the transport while it is NOT
  docked (docked, it sits inside the right rack and the kit's `free()` would read it as a bar), an open TIMELINE's root. `show()` is
  stage-text.js' own (the KEY is the string, the 250 ms KaTeX gate) with `innerHTML` replaced by `block.remove()` + `addBlock({ md })`.
  THE FADE: **the formula leaves and returns** (chosen over "the formula stays": two blocks at one seat stack into a column and the
  formula would slide down and back up under every announcement; one block in the seat reads as today's fade did) — the announcement
  is the block (`data-fade`) for 2.4 s, then `banner = null` → its exit (the kit's) and the formula's entrance. The switch:
  `layer.root.hidden` + `show()` adds nothing while off. SIZE: `--lw-stage-size` on the root + `layer.setPane(false)`, whose side
  effect is to re-measure every bare block (`layer.js:739–742`; nothing else re-measures without a new KaTeX run — brief candidate).
  Re-placements (`viewChanged()`, counted in `stats.places`): the racks' body classes (as before), the transport's class, the
  TIMELINE root's `hidden` / `style` — each once at once and once 400 ms on (the pill's dodge sets its class before it arrives:
  U3's one red before this). **Never on a camera move.**
- THE ATOM LETTERS moved whole from `stage-text.js:88–112` into `initStageText` (TYPE.body → 14); unchanged in look and law.
- HOLD (I): the ACTIONS row from the kit's `infoActions` (`id: 'info-hold'`, `KeyI`, `shift: false` so it does not also claim
  Shift+I, which the TIMELINE's INVERT SELECTION holds while it has the focus). `lab/key-table.js` hands the kit's `createKeys` a
  row's `up` (ONE line): the kit already runs `up` on the key's release and on blur (`keys.js:337–347`) and latches a held row in a
  menu; λWAVES' table was dropping it. **This is the brief's "plain toggle" fallback not taken**: a toggle under the table's
  `repeat: true` would flip on every auto-repeat of a held I; the `up` line is smaller and is the kit's own contract. No kit brief.
- `lab/look.js` `paintInk()` left (it wrote only `#molFormula`'s colour and halo); `lab/lab.css` `#molFormula*` rules → three
  `.mir-info.lw-stage` rules (z 20; `--info-size-body` = `clamp(16px, 8vw, 34px) × SIZE`; `[data-fade]` the same at 22 px; KaTeX at
  `.nb-view`'s 1.08 em — the old cap `max(16, min(base, 8 % of the width)) × SIZE` in CSS); `#atomLabels` kept.
- `lab/stage-text.js` DELETED. `lab/sw.js` by `pwa --write` (stage-text.js out; mir/info/{layer,bodies,leader,seats}.js and
  mir/shell/notebook.js in — layer.js imports `loadRenderer` from it).
- `tests/stage-text.browser-test.mjs` re-aimed in the same commit (the G-W law): the node is the newest `.mir-info-block` in
  `__LW.stageText.layer.root`; sizes read computed; + one block, `.lw-stage`, z 20, `pointer-events: none`, 34 px; + one fade block
  that leaves. **Every `__LW` stage-text witness is kept**: `stats.renders` (KaTeX runs = blocks added), `stats.announced`,
  `stats.labelWrites`, `stats.places` (now: the re-placements asked of the layer — 0 under play, as before), and `md` / `formula` /
  `banner` / `on`, `setFormula`, `announce`, `atomLabels`, `setOn`, `setScale`; new: `layer`. Gone: `place` (internal, no reader).

**The ledger** (`cat lab/*.js | wc -l`): **27,594 → 27,538 = −56** (rack.js 4,780 → 4,858 +78 · stage-text.js −132 · look.js 95 → 89
−6 · key-table.js ±0 · sw.js 566 → 570 +4); `lab.css` 808 → 801 −7. The brief's estimate was ≈ −70: the block is ≈ 35 lines as
planned, the letters 28, and the re-place observers (≈ 8) and the API object (≈ 14) came over from stage-text.js rather than
vanishing. Bar 30,000: 2,462 under.

**THE LOCK is not needed** (no frame-path change: `field.js`, the shaders, the readback, ψ(t) untouched; the caption `drawCaption`
untouched; the film path untouched).

## §brief candidates (for `BRIEFS-0.5.1.md`; none blocks D1)

1. **A block SEAT option** (top / foot) — already listed. Today's foot seat (transport docked or at the top, or narrow:
   `stage-text.js:51`) is not reproduced; the block now sits below a top pill (U3: 217 px) instead of moving to the foot.
2. **`handle.update(md)`** — already listed. U4: a paint stroke re-enters the block every 250 ms.
3. **NEW · a re-measure**: `layer.measure()` (or measuring on `resize`). λWAVES' SIZE re-measures through `setPane(false)`'s side
   effect; nothing re-measures a block whose `cqi` / `vw` size changed on a resize (its `w`/`h` stay stale until the next add).
4. **NEW · a STILL block** — `addBlock({ still: true })` or `createInfoLayer({ push: false })`: with `parallax`, `drift` and `follow`
   off, a pointer within `PHYS.reach` (260 px) still kicks the runner and parts the block (U2 C: 749 style writes in 10 s, ≈ 60 px).
   R6-F asked for "still: no fleeing the cursor".
5. **NEW · ink by the ground, not the theme**: the kit chooses ink from `[data-theme]`; λWAVES' STAGE can be a custom colour away from
   the theme (FOLLOW THEME off, the STAGE knob, the `material.stage` route), where dark ink lands on a dark stage. λWAVES' old
   `paintInk` chose by the live STAGE's luminance. A `ground: () => rgb` option, or `setInk('light' | 'dark')`.
6. **NEW · `avoid()` rects with a side**: `free()` reads any rect within 24 px of a window edge as a rack and every other as a top or
   bottom bar. A docked transport (inside the right rack) would be read as a bar (λWAVES leaves it out while docked); a TIMELINE
   docked full-width would be read as a left rack. `{ left, top, right, bottom, edge: 'left' | 'right' | 'top' | 'bottom' }`.
(The `up` row is NOT a candidate: the kit has it; λWAVES' key-table now passes it.)

## §merge notes (rack.js regions, for two builders at once)

- `lab/rack.js`: the import block (`field.js` line + `cameraKey`; the `molecules.js` line + `moleculeAtoms`; `md.js` `ELEMENT`;
  `mir/info/layer.js` replaces the `stage-text.js` import) · `:160` a comment · `:851` a comment in the tick · the STAGE TEXT header
  comment (`≈ :2001`) and `initStageText()` (`:2038–2119`, its comment + body replaced whole) · ACTIONS: one row before `notes` (`:3826`).
  D2 + D8 edit the notebook block (`:3311–3510` at the base; `:3389` on, at this tip) and the MOLECULES pick site — no
  overlap; D2's head rides `stageText.layer` (`showPage(stageText.layer, …)`), D8's announce `stageText.announce`.
- `lab/key-table.js:41` (one line) · `lab/look.js` (paintInk out) · `lab/lab.css` §STAGE TEXT (D10-F edits `lab.css` elsewhere:
  the transport's buttons) · `lab/sw.js`: take ours, then `node tests/pwa.test.mjs --write`.
- `tools/perf/main-thread.mjs` (`--setup`, `--sweep`, `served`) — D-V's cumulative pair uses it as is.

### U3 · placement (tip + the settle fix, 2026-10-09 17:05; `.tmp/p-u3.mjs` → `d1-measure/u3-placement.json`, shots `.tmp/shots/u3-*.png`)

H₂O's formula block (70 × 49 px at 34 px), 1600 × 1000, the first-run racks. Each cell: set the transport, `__LW.camera.setShift(sx, 0)`,
1.6 s for the re-place and the spring, then the block's rect against EVERY rect of the kit's `uiSpace()` built as rack.js builds the
stage guard's (the rack's columns, the float layer — the TIMELINE window among them — and the app's panes: transport, notebook,
sheet, offer, the + and ☆ lists):

| TIMELINE | transport | block top–bottom (px), at shift +1 · −1 · 0 | meets a UI rect |
|---|---|---|---|
| closed | floating at the foot (`mini`) | 118–167 · 118–167 · 118–167 | **0** |
| closed | docked in the rack | 131–180 (no foot bar: the free stage is taller) | **0** |
| closed | at the top (`mini at-top`, pill 52–98) | 217–266 | **0** |
| docked at the foot (364–1300 × 552–992) | floating → the pill dodges to the top by itself | 163–212 | **0** |
| docked at the foot | docked | 77–126 (the timeline takes the foot off) | **0** |
| docked at the foot | at the top | 163–212 | **0** |

**18 / 18 clear** (always horizontally centred between the racks, 765–835). The shift does not move it (a block with no subject has
no picture to follow). The FIRST run of this probe (on `0f7915a`) had 3 reds, all one cell: TIMELINE docked + the pill dodging to the
top — the pill's class lands BEFORE its 160 ms arrival animation, the one re-place read the pill mid-flight, and the block sat at
79–128 under the arrived pill (52–98). Fixed in commit 3 by re-placing once more 400 ms after any re-place (the racks already had
that second look in stage-text.js); then 18 / 18. The seat is never the foot (R6-F; brief candidate 1).

## §suites (tip, after the settle fix; one browser at a time on 8973 / GD 5443)

| suite | result |
|---|---|
| `tests/stage-text.browser-test.mjs` (re-aimed) | **GREEN** 4/4 (the key law; KaTeX 3 renders for 10 strings in 304 ms; 0 renders / 0 re-places over 12 ticks; the fade once at 22 px, back at 34 px; HOMO + LUMO / WINDING names; letters 0 writes still, 1 after a turn; the caption `1s₀, 2p₀` / `H₂O · 1b1 HOMO · STO-3G`, clean with the switch off; ONE DISPLAY row) |
| `tests/frame-occlusion.browser-test.mjs` | **7/7** on a re-run alone; the first run (inside the sequence) was red at "detached rack drag refreshes frame ink while paused" (the head's mask read 150 ms after a paused drag) — the layer never enters the mask and was 500 px away from the drag; re-run alone green, as the rig law says |
| `tools/hit-probe-set.mjs` | **49 presses through a kit window's gap, 0 reached the stage — OK** |
| `tests/keyboard-window.browser-test.mjs` | **GREEN** (8 PASS) — the I row listed in WINDOWS & DISPLAY |
| `tests/keyboard-shortcuts.test.mjs` (node) | **GREEN** (in `test.sh node`) |
| `tests/menubar.browser-test.mjs` (the key table changed) | **GREEN** (8 PASS) |
| `tests/offer.browser-test.mjs` | **GREEN** 16 of 16 scenes |
| `tests/history.browser-test.mjs` | **GREEN** 44 PASS |
| `tests/legacy/boot.browser-test.mjs` (the whole suite) | **4 failing of 152 = the known law reds only** (B70, B71, B78-BOW — D10-F's — and B149); **B6 ×2, B22, B23 GREEN** |
| `node tests/pwa.test.mjs --write` | written (345 files) |
| `bash test.sh node` | **exit 0, 940 PASS, 0 red** |
| G-U `grep -rn "\[!mir\|ui:" lab/` (outside lab/mir) | empty |

## §what Josh will see

- **The formula's new look** (R6-I): the kit's — the serif face (Spectral; Playfair for a `#`), dark ink on the light theme
  (`rgb(20, 21, 31)`) and light ink on the dark (`rgb(248, 246, 241)`), over the kit's feathered shade, instead of today's
  transparent STIX/KaTeX ink chosen by the stage's colour. KaTeX is the notebook's (renderNotebook through the layer), at the
  notebook's 1.08 em. PNGs (headless: the WebGPU canvas captures blank, so the words show over white): `.tmp/shots/d1-boot-states.png`,
  `d1-h2o-formula.png`, `d1-h2o-announce.png`, `d1-h2o-dark.png`, `u3-*.png` (not committed; the spike's 24 legibility PNGs are the
  look over a real orbital: `research/release-0.5.0/canary-a0/legibility/`).
- **Its seat** (R6-F): centred between the racks, at the top of the free stage + 12 % (118 px down on a 1600 × 1000 window with the
  pill at the foot), and still — no parallax, no drift. It no longer goes to the FOOT when the transport is docked or at the top: it
  moves down below a top pill (217 px) or a docked TIMELINE's dodged pill (163 px) instead. A pointer that passes within ≈ 260 px of
  it nudges it aside and it springs back (the kit's "parts like water", U2 C); holding **I** freezes it.
- **A change of string** is the kit's exit + entrance (a quick rise from 10 px below, ≈ 0.34 s); a paint stroke on the ladder re-enters
  it four times a second while the hand moves (U4).
- **THE FADE**: a hand's preset replaces the formula in the same seat at the heading size for 2.4 s, then leaves and the formula
  returns (U5). Restore / undo / link / project open: nothing, as before.
- **The atom letters: unchanged** — on each nucleus, every atom, inverted (`difference`), following the turn.
- **SIZE** scales the formula, the announcement and the letters as before; **STAGE TEXT off** hides all of it and adds nothing.

## §the frame cost (a diagnostic, not a gate; tip `aaeb88e`, served `9ba25f860f158216`, 2026-10-09 17:20; `d1-measure/m3-frame-cost-diagnostic.json`)

Step 1 found that STAGE TEXT on costs a third of the frames in the D1 scene. Three arms on the tip, interleaved 3 + 3 + 3, the D1
scene + sweep, the setup's last line changing only the letters' container (`#atomLabels`):

| arm | presents/s (median; runs) | ms/s median |
|---|---|---|
| STAGE TEXT on, as shipped (`mix-blend-mode: difference`) | **17.4** (17.4 17.4 18.2) | 67.222 |
| on, the letters `visibility: hidden` (the blend still declared) | 20.8 (20.5 21.2 20.8) | 74.063 |
| on, the letters `mix-blend-mode: normal` | **25.0** (24.3 25.6 25.0) | 84.932 |
| (step 1) STAGE TEXT off, base | 26.7 | 94.171 |

**The letters' `difference` blend over the WebGPU canvas is most of it**: it costs ≈ 30 % of the presents in this scene (17.4 vs 25.0);
the kit's block and everything else the switch turns on cost ≈ 1.7 presents/s at most (25.0 vs 26.7, two trees, inside the
noise). Headless Chromium on the RTX 3070 only — the M5 iPad is unmeasured. Nothing changed for it here: R6-L keeps the letters
"unchanged in look and law" in 0.5.1. It is a λWAVES item for Josh (D1b's kit labels, or an inversion that does not blend the
canvas), not a kit brief.
