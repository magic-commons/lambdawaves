# REFUTE E · the other five audits, read against history and readers · 2026-09-24 · Opus 5.5

For each proposed change: which wave wrote the code and why, and which reader would notice (a shipped or legacy-only test,
a saved-project field, the link format, the settings key, `__LW`). Evidence: git `log -S/-G`/`show`, REPORT and ledger
text, greps of `tests/` and `lab/`, AUDIT-E's probes (GD_PORT 5235). Nothing under `lab/` or `tests/` was touched.

## Lane A

- **FA2 (bit-identical kernel trims) · RISK.** No existing gate would catch a non-neutral kernel change. No shipped test pins
  an absolute `fieldDigest`/`readPixels` hash. They all compare relatively or within tolerance:
  `official-defaults-palette.browser-test.mjs:34–35` compares two `readPixels().hash` values at the same ray positions;
  `field-molecule` reads `digest.integral`; `gpu-recovery` checks NaN / resolution / integral; chem, orbitals and
  molecular-diff read `sampleVoxel` values within tolerances. The legacy gate reads `fieldDigest`/`readPixels` 60 times but
  is not the gate. So A's DIGEST LOCK does not exist yet; it has to be built and committed on the base before FA2 lands.
  Put `probes/A/kernel-variants.js` into `tests/` as a browser suite covering {1s+2pz, rydberg, 91 labels, box packet,
  gas, helium, H₂, one molecule} × {64, 96, 128}. Without it, "bit-identical" rests on a probe nobody re-runs.
- **FA1 (gas radial table) · CONFIRMED, not now.** Josh has to decide the law-1 question (texels move by ≤ 1 fp16 ulp,
  ≤ 0.02 % of pixels by 1 level). History: `sphj` and the axial gas came in wave 34 ("a Bessel bug older than the box");
  the gas records went through `packModes` with no caching. Readers: `gas.test.mjs` THE RECORDS asserts the record shape.
  FA1 adds `lag[3]`, so that test changes in the same commit. No saved byte, link field or settings key carries the gas
  kernel. MERGE: FA1's lazy table + FD6's lazy `createGas` + FB6/F14's persistent records are one gas.js change. Lane A
  owns it; F14/FB6 own the CPU half.
- **FA3 (specialised present pipelines) · RISK — the export path.** `render-exact.js` and `capture.js` drive `field.frame`
  (render-exact.js:115; capture.js:8), so they inherit the specialisation. FA3 compiles the specialised pipeline async and
  draws the generic one until it resolves. So an EXPORT started at the wrong moment renders some frames on the generic
  pipeline and later frames on the specialised one. For lit/additive styles, where A measured 1–2 bytes of difference, two
  exports of the same state could then differ. That breaks the Final II determinism claim ("two exports produce identical
  digests", FINAL-II-HANDOFF; render-exact.test 40/40). Fix: add a `pipeline` pin next to render-exact's `fieldclock` /
  `modealias` hazards (render-exact.js:679–683). An export awaits the specialised compile, or forces the generic pipeline,
  for its whole run. For the cloud default, which A found bit-exact, the risk is nil.
- **FA4(a) (reset autoScale on pause) · NARROWED to a bug fix.** AUTO SCALE is from wave 24 (the iPad round). The upward
  probe was fixed by the Astra note of 2026-09-08 in FINAL-II-HANDOFF ("AUTO SCALE probes upward when delivery meets the
  target"). An idle lab presents nothing, so that probe can never run after a pause, and the 0.35 scale sticks. That
  defeats Astra's own recovery intent. Saved bytes are unaffected: `projectSnapshot` already writes `autoScale = 1`
  (rack.js:4406, "runtime, not part of the composition"). The only readers are `ui.scaleRo`, `LW.autoQ` and the bench.
- **FA6 (first visit marches 64³ at 160 steps × 1.0) · CONFIRMED as a wave-101 leftover, still for Josh.** Evidence is the
  wave-106 comment at rack.js:4818–4830: "Wave 101 made 64³ the default (the `quality` seed above)" while "the pairing: 64
  → 110 steps, 0.75 scale" lives in the GRID segment. Wave 106 fixed exactly this bundling bug on the phone path and left
  the desktop seed alone. Reader: `serialize().presentation.quality` = {res, steps, scale}. A project saved from a fresh
  session changes bytes if the seed moves; old files are unaffected. The dirty baseline follows automatically.

## Lane B

- **FB3 (link retry repaints the closed window) · CONFIRMED + MERGE with FE2 / FD5(a).** History: REPORT 2026-09-10 "The law
  of the two clocks": "A refused play … is retried once a second, so a source routed later joins within a second." FB3
  keeps that retry and drops only the repaint. A refused play changes neither `playing` nor the model, so `sync()` → the
  `transport.xport` face is identical. The root problem is broader than this one call site: a closed window's
  `sync()`/`paint(true)`/`place()` do DOM work that nobody can see. One change owns all three: when `!P.open`,
  `sync()` skips its device loop, `paint()` keeps only `paintRings()`, and `place()` returns. The house-knob rings must
  keep painting while closed — REPORT wave 61/68: "keeps wearing it with this window closed". routed-knob reads
  `mod.view.rings()`. With that, FB3's call-site edit is harmless but unnecessary. My A/B (AUDIT-E FE2): boot() −19.7 ms,
  first rAF unchanged. So this is a boot and per-second DOM win, not a frame-rate win.
- **FB5 (occlusion burst while hidden) · NARROWED (a factual correction).** B says every measured element is `display:none`
  under `body.ui-hidden` "except `#keysheet`". There is no `#keysheet`: the 2026-09-10 senior review deleted the wave-53
  sheet from the DOM, and `getElementById('keysheet')` → null (rack.js:3656 is a dead id, AUDIT-E FE5). `#keymap` is
  hidden too (lab.css:962). So the full burst under ui-hidden returns `[]`, and the change is `if (uiHidden) out = []`
  with no DOM reads. That is exact against the "ink stays under glass" law (REPORT 2026-09-11) and wave 109 ("the frame
  follows painted windows"): nothing is painted, so nothing masks. The body-class observer at rack.js:3670 re-dirties on
  the way back.
- **FB1 = F11 (gas.stats factorised) · CONFIRMED; MERGE, lane B owns.** History: wave 34. Readers: `ui.gasRo` text
  (toFixed(2)) and gas.test tolerances. B's `-0.00` vs `0.00` note is a real, visible one-character difference at exactly
  symmetric instants. Accept it as noise with the argument written down, or keep the old loop.
- **FB2 = F5 (perf.median ring) · CONFIRMED; MERGE.** Wave 48 (REPORT:1514). `LW.perf.median` is asserted by no shipped test
  (legacy prints it; tools/perf reads it). Nil risk; land it first so every later number is real.
- **FB4 = F10 (re-probe back-off) · NOT NOW (policy).** Wave 50 wrote the re-probe on purpose ("a parked reader never runs,
  so … stays parked for the whole session"). Back-off slows a visible readout's refresh, which is Josh's call. F10(a),
  WIGNER in the cards worker, is the neutral road.
- **FB6 = F14 = FA1's records · MERGE.** **FB9 = F15 · MERGE, F15's form:** re-arming from `switchHamiltonian`/`setZ`/
  `setElement` beats stopping forever, since an ATOM or Z change invalidates `kickReady()`'s tables (warm chain: 2026-09-09).
- **FB7 · CONFIRMED** (no reader depends on a dead loop). **FB8, FB11 = F12 · NOT NOW.** **FB10 · RISK:** `themeInk` is
  in `lab/mir/kit.js` (read-only), so the cache must live in the lab views (shadowview/orbit), or go upstream.

## Lane C

- **FC3 (the disconnected head's `brightness(1.03) saturate(1.03)` under FROST OFF) · RISK — it reverses a named Josh ruling.**
  History: wave 103, Josh: *"let it be 103% brightness and 103% saturation for the disconnected bar to distinguish the bar
  from the contents"*. f11898d (2026-09-07) rewrote legacy B139 on purpose to assert `fpT.off.head === 'brightness(1.03)
  saturate(1.03)'` — the lift under OFF is a stated law, not an accident. The frost-hold state that drops it (STILL while
  playing, mir/css/skin.css:264–265) is wave 67's "motion" policy, not proof that OFF should drop it. The rule is in the
  KIT (`lab/mir/css/skin.css:251–253`); an app-side override in `lab/skin.css` overrides a kit look, which the MIR law says
  goes upstream. Keep it in C's Josh menu with his quote attached. It is the largest Gecko saving under OFF (5.1 ms), but
  only he can undo his own 103 %.
- **"Nothing animates while idle" · CONFIRMED, one detail corrected.** `@keyframes km-pulse` is defined in the kit
  (`lab/mir/css/base.css:383`) and referenced by NO rule in `lab/` or the kit. The keymap's `.km-*-recording` rules
  (lab.css:906–949) set shadows and colours and no animation. So km-pulse is a dead kit keyframe (upstream), not an idle
  animation. The only infinite animations, `#busyMark` and `.dev-loading .mark` (`lw-busy-breathe`), sit on elements that
  are `hidden` / display:none unless busy. The boot's one-shot `lw-turn` ends.
- **FC5 · CONFIRMED; MERGE** with the closed-window change (open half) and B's Q6. **FC6 · NOT NOW** (the 2026-09-09 iPad
  pass wrote it on purpose; device-only evidence). **FC7 · NOT NOW** (rack slide, waves 22/23). **FC1 · CONFIRMED.**

## Lane D

- **FD1 (gpu-boot.js in <head>) · CONFIRMED; the plumbing checks out.** Every gate discovers the file by itself.
  `tests/wiring.test.mjs` reads its roots from the `<script>` tags of `lab/index.html` (§4, `scriptsIn`) and dedups
  `note()`, so gpu-boot.js is both a root and an import of field.js with no list to edit. sw.js's PRECACHE is re-derived
  from the lab tree by `node tests/pwa.test.mjs --write` (the SKIP rule excludes only sw.js, smoke.html and non-licence
  md/txt). `tools/build-deploy.mjs:661` takes every `<script src>` as an eager entry. pwa.test:313/325 forbids only
  cross-origin and rooted srcs, and `./gpu-boot.js` is neither. build-deploy has no CSP. History to keep: wave 58's
  `requiredLimits` block (field.js:683–692, capture's 32767 ceiling; `limitsRequested` read by capture.limits) and wave
  59's `onLost`/`uncapturederror` must survive the move byte for byte — D's snippet keeps the first, and createField keeps
  attaching the second. `tests/capture.test.mjs:234`'s prose ("field.js calls requestDevice() with no requiredLimits") has
  been stale since wave 58; it tests `maxPictureSize(null)` only and is unaffected.
- **FD2 = F1 (ladder solve on restore) · MERGE; take F1's form.** History: the 2026-09-09 "demand-loaded card work" pass moved
  the INITIAL solve behind `prepare()` and missed `set()`, the restore road. FD2 changes the public `set()`. F1 adds a
  `load()` and leaves `set()` byte-identical for every `__LW.ladder.set` caller (current.browser-test:173, the legacy
  gate). Readers: `ladder.computed` (current.browser-test:10/25 — boot and after prepare, unaffected) and `ladder.last`
  (legacy:250/270 — the getter computes on demand when dirty). **NARROWED:** F1 says "every project open / LINK open"; links
  carry no `instruments` (no reference in statelink.js), so opening a link never reaches `ladder.set`. Affected: project
  open, import → open, demo open (projects with `instruments`), and the quick LOAD (LS_PRES carries `instruments`).
- **FD3 = F6 (L6 no-GPU crash) · MERGE; take F6's form.** FD3's `if (field.ok)` guard skips `setDprCap` after a lost device,
  since `field.ok` goes false on loss (field.js device.lost). F6 tests the method, so a lost device behaves exactly as it
  does today. Same bug fix; F6 is the neutral spelling.
- **FD4 (abW/abH erased) · CONFIRMED (+).** It is the fourth instance of one hole: waves 54 (nbW/nbH/layouts), 59 (warned) and
  105 (audioDevice) each patched it by adding a carried key to a writer that rebuilds the settings object from scratch
  (rack.js:280). The class-ending change is `{ ...S0, …owned keys }`: unknown keys survive, owned keys overwrite. The only
  cost is that retired keys (e.g. the pre-CONTROL-HINTS `hint`, still read as a fallback at rack.js:352) persist forever.
  The settings key is not a project or link format.
- **FD5(a) · MERGE with FE2/FB3** (above). **FD5(b) (append SLICE after its view) · CONFIRMED, order-neutral.** `LW.bootOrder`
  (rack.js:5955, `layout.orderAll()`) is read by the legacy gate only (4 reads). Moving `rack.appendChild(wSlice.root)` from
  2431 to after `createSliceView` (2435) still appends SLICE before QCD (2439), so the rack order and `bootOrder` are
  identical. First-visit furniture then closes it as before. **NARROWED (the gain):** FD5 claims 40–60 ms. My FE2 A/B
  measured the closed-modulation part alone at −19.7 ms of boot() but 0 ms on the first rAF, because the layout moves into
  frame 1. Judge FD5 on first presented frame, not on LW.ready.
- **FD5(d) (theme resolved at the top of boot) · RISK.** rack.js:262's early `data-card` exists for first paint (waves 47/51).
  But several views read `document.body.dataset.theme` at CONSTRUCTION: `legible()`, MARK_GROUND, flowTracers' `ink`,
  moleculeview's `readRGB`, kit `themeInk`. They currently build under `''`, then repaint on the kit's `onThemeChange` when
  applySettings sets 'light'. Resolving early changes both what they compute and whether that observer fires. Check with
  the MIR stylehash plus a digest of every 2D canvas at first visit, both themes, before/after.
- **FD8(a) (move lab/oracles/) · CONFIRMED — answers D's Q4.** Placed by the H₂O program's contract **B-H2O-2**
  (research/MATH-H2O-2026-09-11.md:462, 722: "Module paths: `lab/rhf-molecule.js` and `lab/oracles/sto-3g-v1.json`"),
  landed in `f3f1638` (2026-09-12); the 6-31+G* file followed in `d8e6ac8` (2026-09-18). The ledger put the fixture beside
  its module. No runtime code reads it: only sw.js precaches it. Readers, all `fs` (none over HTTP): rhf-molecules,
  molecules, chem-sweep, basis-631 and chem.browser-test (`path.join(ROOT,'lab','oracles',…)`), plus comment references in
  mo.test and molecules.js:100/455. Move them and update those paths. The contract text in the ledger names the old path;
  add a one-line note there rather than rewriting a research record.
- **FD8(b) (NOT_PRECACHED rule for mir/shell) · RISK — ANTI-PATTERN 14 in the other direction.** A hand-kept exclusion list
  drifts exactly as a hand-kept cache list does. The shell files are on wiring's ALLOWLIST (dated 2026-09-21, hard failure
  on 2026-11-20); the day the migration lands, a stale NOT_PRECACHED rule silently makes the notebook offline-broken. If
  done, derive the exclusion from wiring's own "unreached + allowlisted" set, so rule and allowlist expire together by
  construction and pwa.test checks the equality. The migration itself is a feature wave, not this run.
- **FD6 · MERGE** into FA1 (gas, lane A). **FD7 · CONFIRMED** (paintMarks is a pure function of LUT/hue/theme/stage). **FD9 ·
  CONFIRMED:** wiring counts dynamic edges, so moving the `import()` into `prepare()` keeps reachability (the allowlist
  comment: the H₂O modules are "reached by mathworker.js + chemview.js on 2026-09-12"). **FD10 · NOT NOW** (needs a real-RTT
  number; wiring does not read `<link rel=modulepreload>`, so a generated list needs its own `--write` check).

## Lane F

- **F7 (LAUNCH / OPERATOR→BOX through the worker) and F13 (K key through the worker) · RISK — they reverse an explicit wave-45
  exemption.** rack.js:773–776 (wave 45): "The SLAP trigger, the K key, LAUNCH and every forced period reader stay
  synchronous"; again at 3373–3374. Wave 45 moved only the BOW. F must say why the exemption is spent: a discrete press
  whose result should exist on the same frame, with the kick readout written synchronously. Readers of the sync roads:
  `LW.enterBox` / `LW.launchPacket` / `LW.kick` (legacy 3/1/3; tools/perf/bench-firefox uses `__LW.enterBox()` then
  `settle()`). Both proposals keep those three synchronous, which is right; only the UI presses move. Take it to the lead
  as a policy reversal, not a free win.
- **F2 (CAPTURE hover plan async) · NARROWED.** Wave 58 wrote the hover plan on purpose: "THE PLAN IS NEVER COMPUTED ON A
  FRAME … computed on a press, on a control change and on the pointer entering this group" (rack.js:1808–1811). Going
  async keeps "never on a frame" and changes only when the plan appears, so it fits wave 58's intent. ⟳ and G belong to the
  wave-44/45 law "no proof and no button ever sees a stale answer" (rack.js:3061–3064). An act-on-landing ⟳ is not stale,
  but a second ⟳ press before landing must not jump twice; coalesce as F3 does. Readers: `LW.capturePlan` / `captureUI`
  (legacy 6) stay forced. capture.test is node and tests `planLoop` itself.
- **F1 · MERGE with FD2** (F1's form; link claim narrowed, above). **F3 (one scan in flight) · CONFIRMED;** stale answers are
  already dropped (`periodPending !== key`, rack.js:3021), so coalescing cannot change a settled answer. **F8 (REBUILD
  dropped during export) · CONFIRMED bug;** `exportLocked` came from Final II (2026-09-08); render-exact's H1 "interloper"
  pin is untouched by F's reorder. **F9 · CONFIRMED;** `get sol()` stays the synchronous proof road. **F16 (failed restore
  marked clean) · CONFIRMED (+):** the quick LOAD road (`restore()` from LS_EXP/LS_PRES, the STATE window's LOAD and FILE ›
  LOAD) also ignores the `false`. No test reads the "restore failed" / "opened" status strings (grep), so the fix is free.
  **F4 · CONFIRMED** (chem worker FIFO; `tests/response-fit` pins the fit numbers). **F12 = FB11 · NOT NOW.**

## Ranking — top 10 across all six (measured gain ÷ risk)

1. **FD1** gpu-boot prestart — cold ready −363 ms headed (−31 %), warm −71 ms; digest/limits identical; plumbing auto-discovered. S.
2. **F1 (= FD2)** `ladder.load()` on restore — −415 ms (FF) / −650 ms (Cr) per project open; `set()` untouched. S.
3. **FA2** kernel trims — gas 2.5×, box 2.2×, hydrogen −24 %, bit-identical — after the digest lock is committed. S.
4. **FE1** menubar defects — RESEED resets the camera, RESET KEYS is dead, CLEAR hits the undo ring; correctness. S.
5. **F6 (= FD3/L6)** no-GPU boot crash — the designed banner instead of "boot failed". S.
6. **FB1 (= F11)** gas.stats factorised — 9 → 0.35 ms per call, removes the periodic > 5 ms Box frame. S.
7. **FB2 (= F5)** perf.median ring — makes every later number real; nil risk. S.
8. **FA3** present specialisation for cloud/grain/dust/bands — present −50 % on the default, with the export `pipeline` pin. M.
9. **FE3** single rebuild on modulation open — −15–28 ms of a 49–80 ms open. S.
10. **F2 + F3** async capture plan + one scan in flight — −0.46–1.0 s per hover on the BOX, no scan-queue jam. S–M.

## Missing (nobody else found)

- The menubar reaches controls by label/key: EDIT › RESEED runs `camReset`, RESET KEYS clicks a trigger deleted in `5f6421e`,
  CLEAR clicks one of 5 CLEARs by DOM order (rack.js:4078–4099; AUDIT-E FE1).
- `BUILD_LINE` (rack.js:78) reads 0.2.3-alpha.1 on the alpha.3 release; ABOUT and the copy dump show the wrong build (AP6).
- FA3 × render-exact: a pipeline switch mid-export breaks export determinism for lit styles (render-exact.js:679–683 needs
  a `pipeline` pin).
- saveSettings' rebuild-from-scratch is the root of FD4 and three earlier fixes; `{...S0, …owned}` ends the class (rack.js:280).
- 124 orphan CSS selectors (12.7 KB), 98 of them the wave-52 modulation card whose JS wave 64 deleted (AUDIT-E FE4).
- Dead SETTINGS-KEYS remnants (the capture branch, `layout.keysheet`, `#keysheet` in the occlusion list) and access.test
  A11 regex-reading them (AUDIT-E FE5).

## Not now

FA1 (the law-1 ruling on the gas table) · FA3's lit/additive variants · FA4(b/c) governor policy · FA6/FA8 (look) ·
FC3 and J1–J8 (Josh's glass; FC3 reverses his wave-103 words) · FC6/FC7 · FB4/F10 back-off · FB8 stagger ·
FB11/F12 busy-mark semantics · F7/F13 (the wave-45 exemption, needs the lead) · FD8(b) and the MIR shell migration
(allowlist expires 2026-11-20) · FD10 modulepreload · lazy window construction (L12) · the rack.js split past seams 1–9
(AUDIT-E §6).
