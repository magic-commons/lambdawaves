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
