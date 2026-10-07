# λWAVES 0.4.0-alpha · THE FLAGSHIP — PLAN DRAFT 3 (Fable, 2026-10-07)

The third layer of the nacre: Fable's pre-draft → Sonnet's review → draft 1 → Opus's audit and edit → draft 2 → Sonnet's
junior pass → this. The record is beside it: `NACRE.md` (Josh's ask verbatim, the laws), `survey/*` (the ground truth),
`REVIEW-SONNET-0.md`, `AUDIT-OPUS-1.md`, `REVIEW-SONNET-2.md`. Numbers are the surveys' or the audits', each checked in
code; `[mine]` marks Fable's own. Nothing is built.

## 1 · THE GOAL

**Josh's words.** A pre-refactor for MIR 1.5 that makes λWAVES the flagship; the cache treated as expansions with
metadata, STEM information and LaTeX copy into the journal; true ladder names (`1a1, 1b2`) where the knob reads HOMO−1
today; wave-indexed presolved orbitals toward dynamic waves with true electrostatics; diverse library sections (a
vertical periodic table, heavy atoms, crystal lattices, biology, a bucky-ball milestone); engine upgrades for larger
counts and heavier atoms, with a cyclotomic-scaling thread with Sol; the INFORMATIONAL as a live, cursor-aware markdown
overlay with proper maths that announces changes and fades; GPU-recording optimisation; camera pan and the dot-matrix
XY; the legacy windows audited and consolidated with power buttons and DISPLAY doing the resource work; CALCULUS as an
overlay with a prose figure copied into a built-in journal; STATE audited; the dot matrix on every inlay.

**Ours [mine].** 0.4.0 is **the engine-and-library release on today's MIR**: every orbital gets its textbook name,
dozens of new molecules from the amino acids to ferrocene arrive as records, the periodic table returns as a window, the
camera can sit off-centre, and the stage text is real maths. It also subtracts what the adoption should not have to
carry, and it writes the briefs that MIR `1.5.0` must carry for λWAVES. **0.5.0 is the adoption and the full
INFORMATIONAL** (springs, leader lines, pages, the pad, the film overlay): they need the kit's new shell and would be
built twice on 1.4.3. **0.4.1 BUCKYBALL** finishes C₆₀. The ENGINE stays λWAVES'; every window and behaviour is the
kit's; what λWAVES needs and the kit lacks becomes a brief; pages and records are content.

**Flagship, operationally (R-F1).** BASINS has already adopted 1.5. "First" can only mean first of the three still on
1.4.3, and Josh named λWAVES and NEBULA as next. So in 0.4.0 flagship means: λWAVES writes the briefs `1.5.0` must carry
and runs the canary at the cut; in 0.5.0 its gates join the kit's release checklist beside BASINS'. "Prefer BASINS"
stays the rule for what BASINS designed; λWAVES' design wins for what it originated (the modulation controller, the 3-D
camera, the notebook, the history ring, the three scopes, the keyboard window) and for everything new in the briefs.

## 2 · THE SHAPE: engine / kit / content

| | λWAVES keeps (ENGINE) | The kit's, or λWAVES' brief to the kit | CONTENT |
|---|---|---|---|
| now | `field.js` with the cap-128 tier, the orbital-only path and the lens-shift ray; the register and the solvers; `electrostatics.js`, `period.js`; the palette's meaning; `badges.js`; `statelink.js` v1 (extended at its tails); `export3d.js`; `latex-state.js`; `names.js` (new); the digest lock; `sw.js` and the build offer (the kit has no offline layer; λWAVES keeps its own for good); the camera law | the adoption glue (modulation port, project parts, occlusion feed, one-clock facade, camera port; about 1–1.5k lines) is written at 0.5.0 | `.md` pages; the LIBRARY records with names, STEM fields, sources and a page inside; sections; demos (water, benzene, N₂); covers |
| briefs, 0.4.0 → kit | — | **8** painted-surfaces provider (the adoption blocker) · **2** lens shift in the CAMERA panel · **3** `md()` window copy + TO NOTEBOOK + PIN FROM WINDOW · **4** the `cells` grid control · **5** `createLattice` exported · **6** overlay in the film · **7** `addLabel({ttl})`, `setCheap`, `html[data-take]` · **9′** STATUS TAGS never hides `[data-mir-offer]` · **13** the INFORMATIONAL window · live-bound math labels · **P** the paint gesture · **J** `jetblack` + `flat` for the big four · **1** the 3-D camera law as a gift | — |

## 3 · THE BASELINE (0.4.0, in order)

**B0 · TAKE-IN, then subtract, then cut 0.3.3.** The live site serves Cloud's main: the version line still reads
0.3.2-alpha and the served rack carries the stage formula, so unreviewed work, the forged MIR manifest included, is what
users run, and 0.3.3's exports are not live.
- Merge PR #1, then PR #2 (one textual conflict, the generated `sw.js`; regenerate).
- One subtraction commit:
  - **Jet Black stays live and the manifest becomes true.** Cloud's direct `lab/mir` edit and the forged
    `MIR-MANIFEST.json` go; the preset returns by R-A3's route — a real MIR 1.4.4 on the `mir-1.4.x` branch (the MIR
    session's work) or, because the palette's meaning is the engine's, one app-side catalogue row appended at runtime
    from `lab/` until 1.5 carries it. S0 does not wait on the MIR session.
  - **Under a molecular owner, EDIT › COPY copies the molecule's page** instead of greying out — the journal copy Josh
    asked for, on an existing road. The page is a pure function of `{library row, ground, names}` in `names.js`, built
    at copy time for every molecule, old and new; the generator only snapshots it into records.
  - **`.mol-more` opens by default on desktop**, folded on phone and tablet, and the card's `Aa` stays visible even with
    HELP off (today LEAN hides the controls and HELP hides the button that reveals them, so KICK / RUN / TDA / the RPA
    spectra, which the README sells, are unreachable on a first run).
  - SPECTRUM's orphaned buttons: ATOM opens ATOMS again (F3); QUARKONIUM is hidden while QCD stays hidden.
  - CLAUDE.md: the false MIR line and the stray sentence go; the first-run law is stated once (Cloud's left rack
    supersedes "MOLECULES start off the rack").
  - A REPORT wave for what was kept: the paint gesture's behaviour, MO-REGISTRY "standing by", the first-run left rack,
    `docs/LEGACY-WINDOWS.md`, the wrangler bump.
- The audit's cheap bugs, one commit, each with a test: CALCULUS's ⧉ (`DIGESTS.calculus` reads `calculus.last`, the
  field the view returns); the badges and the canvas sentence on their own ≤ 10 Hz tick (today they tick only while
  METERS is presentable); `hydroReader` learns `chem` (WIGNER and RADIATION compute hydrogenic physics under a molecule).
- **Wire, don't re-date.** `index.html` loads KaTeX and marked from `lab/mir/shell/vendor/`; the byte-identical
  `lab/vendor/katex` and `marked*` are deleted — about 650 KB less on every deploy. Two expiring allowlist entries close
  by wiring; the other five are renewed once with REPORT saying who consumes them (the 0.5.0 adoption). The two node
  tests that `createRequire` the vendor KaTeX (`tests/latex-state.test.mjs`, `tests/notebook-math.test.mjs`) get a
  small `vm` loader, because the kit's copy has no CommonJS `package.json` and may not get one.
- The reported "Space does not play both clocks in LINKED mode at project open": reproduced and fixed in place; the
  clocks become one at 0.5.0.
- **Close the process hole.** One CLAUDE.md line: "Cloud: PRs only, never `lab/mir`; a kit need is a MIR issue or a line
  in the PR." `tests/mir-manifest.test.mjs` pins the sha-256 of `MIR-MANIFEST.json` per accepted MIR version (1.4.3
  today), so a forged version fails everywhere, the cloud included, and a real adoption is a visible two-file edit.
- **Three one-line measurements**, here because they size later stages: the adapter's `maxComputeWorkgroupStorageSize`
  on the 3070 (Firefox, Chromium) and the M5; a like-for-like re-time of the benzene worker path, ground + spectrum, in
  node and in the browser (the 1.0 s probe timed the ground solve only; the cost model also covers the response, so
  "stale" is unmeasured); **one 300-AO orbital-only dispatch** with synthetic coefficients (F5's road to C₆₀).
- **Three demos as content** (`lab/demos/`): water, benzene, N₂ — so a new visitor meets the names in the first minute.
- Then **cut 0.3.3** from this tree (R-A1): the exports plus Cloud's kept work, the live site made honest. The release
  road is the verifier case; `frame-occlusion` runs (Cloud's first run moved four windows onto the left rack).

**B0.5 · THE CANARY.** A throwaway worktree, `canary-1.5`, never merged, takes a REAL `tools/adopt.mjs <canary> --line
1.5` from the pin (a dry run writes nothing), boots, and logs one row in `docs/MIR-1.5-CANARY.md`: red suites
(`bash test.sh node`, then `frame-occlusion`, `history`, `new-project`), the stylehash delta (README recipe, `--gpu 1`),
the precache bytes after `pwa.test.mjs --write`. It runs twice — now, on alpha.23, and at the `1.5.0` cut — not on every
alpha (the pin moved under the survey; BASINS' eleven re-adopts are the churn to avoid). Its red rows decide which
seams enter 0.4.0 and turn 0.5.0's adoption into a diff of known deltas.

**B1 · THE SEAMS, cut to one.** `cameraEye(obs, half) → {eye, target, basis, shift}`: one projection helper for the nine
copies (`field.js` `writeView`, `fieldview`, `keplerview`, `particles`, `vortex` and its cache key, `export3d`,
`pointerRay`, `unproject`, Cloud's atom labels). It is a deletion and the precondition for the shift and the labels;
`cameraKey` gains the shift so cached 2-D overlays redraw. The stage text keys on the string it would render — one
compare per tick, no new register event. The other seams (settings adapter, project parts, modulation port, one-clock
facade, occlusion providers, camera port, tests by hook) enter 0.4.0 only where a canary row names their block as a
blocker; otherwise the adoption writes them as glue. Measure `lab/*.js` total lines (34,721 today), not `rack.js` alone.
The 208-value lock runs on frame-path commits, the 1004-value lock once at the end, and a red result is re-run alone
before it is believed (the RTX 3070 one-ulp fault).

**B2 · LIBRARY, the fourth storage class, and the data cache.**
- **The scope.** Installed records are device content, content-addressed, never in a project, link or history row. A
  project holds `{id, hash, nameKey}`: PROJECT, with one history row per change of molecule.
- **Where records live.** `lab/library/<sha>.json` plus the section manifests: deployed, NOT precached. `sw.js` routes
  `library/` cache-first into `lw-data-v1`; the names are content hashes, so a new build never clears it.
  `tests/pwa.test.mjs` exempts exactly `library/**` and asserts every manifest row's file exists with its hash.
- **The record path.** A worker op `chem.open(record)` fills the solve cache from the record and replies with
  `ensureSolve`'s own `ground` shape, so no window downstream changes. Each record states `caps {orbitals, states, rpa,
  tdhf}`: ORBITAL needs ε and C; STATES needs the stored CIS states; RPA sticks are stored; TDHF needs the live ERI and
  past the cap is refused with a sentence. A project or link that names an uninstalled record fetches it on open, with
  progress and failure said in the row; offline, the open restores the rest and names the part that refused.
- **The iPad law.** `navigator.storage.persist()` is asked on the user's first INSTALL press, never at boot (Firefox
  prompts); the quota and the persisted answer are shown; an evicted record degrades to "not installed", never a broken
  preset. In a Safari tab (seven-day cap on script-writable storage) KEEP ON THIS DEVICE is offered only if the M5
  measurement shows persist is granted there; a Home-Screen install is the honest advice for a prepared class.
- **The benzene-cap law** (`molecules.js:25–27`). A record past the live cap opens only from its record; absent, its row
  says DOWNLOAD, not DISABLED; a basis or charge change on it is refused with a sentence, not a solve. **Gate on the
  re-time:** if B0's number puts ground solves up to 64 AO under a few seconds on the M5, records accelerate rather than
  gate, and sixteen amino acids need no download.
- **The schema** is versioned (`schema: 1`) and readers ignore unknown members, so the wave index's `Q_LM` and a grid
  handle can arrive later without a bump.
- **The generator is the app.** `tools/orbital-library.mjs --check` is byte-exact (the `new-project.mjs` pattern) and
  enforces a mechanical **diversity gate with a FAMILY allowance**: an entry passes if its formula is unique AND it adds
  a new element, a new point group, or a tag from a fixed motif list (ring size, peptide bond, d-block, cluster, cage,
  nucleobase) — OR it belongs to a declared family (the amino acids, the nucleobases) whose completeness Josh asked for.
  Leu and Ile share a formula; the family keeps both and the record says so.
- **The expansion seat** is each section's header row in MOLECULES: name, record count, bytes, an installed lamp,
  INSTALL / REMOVE. No new tab.
- `docs/STATE-SCOPES.md` gains the row.

**B3 · The frame-path budget, with numbers as acceptance.** Nothing new on the frame path. Names in the worker inside
`ensureSolve` (≤ 10 ms, benzene); the library fetch in idle; the stage text re-renders only when its string changes,
never carries a live coefficient, runs KaTeX at most four times a second, and announces only on hand presses (never on
restore, undo, project open or a modulated preset, or Ctrl+Z replays banners); the atom labels write only when
`cameraKey`, the shift, the preset or the size changes; a lens shift is TIER.PRESENT only; every reader stays
`may()`-gated and idle when its window is off, folded, closed, hidden or offscreen. **Big records:** the density
contraction grows as nAO² — about 16 ms at 87 AO and 31 ms at 120 AO at 96³ on the 3070, scaled from benzene's measured
2.80 ms; a static record costs one dispatch per change; a playing STATES register rides the existing governor's GRID
step and the tablet ceiling, no new mechanism. **The frame-time protocol** is the existing device report
(`tools/perf/device-report.js`, its 30 s scene) before and after, on the 3070 here; the M5 half is one command for Josh,
recorded as "M5 pending" until he runs it — no stage hangs on it.

## 4 · THE FEATURES (0.4.0)

Each: what the reader does, where · kit or app · cost · what it must not do.

**F1 · THE NAMES** (the probe named ten molecules from the live solver; every textbook configuration matched).
- The ORBITAL knob and ladder in MO-REGISTRY read `1b₁ · HOMO`, `3a₁`, `1e₁g (a)`, `2σu`. Hovering a rung shows the
  name, its frame, its `computed / derived / curated` tag, and for `(a) / (b)` the sentence "the two real combinations of
  the degenerate pair". A degenerate HOMO is one HOMO (today its members read HOMO−2, HOMO−1, HOMO in CH₄, HF, CO₂,
  C₆H₆). ⧉ copies `$1b_{1}$`; the GLB, the cube and the NPZ carry the names.
- **Two forms of every name:** the plain form for dials and canvases (`3σg`, `1e1g`; a dial's text node takes no
  markup and Unicode has no subscript g) and the typeset form for DOM and KaTeX (`3σ_g`, `$3\sigma_{g}$`).
- The machinery: one service `lab/names.js` for atoms and molecules (the four formatters become one); declared groups
  and frames in the library; d shells and the tables the library needs — the five remaining finite groups plus **O_h,
  D₅d, D₅h and I_h** for the showpieces (cubane, Cr(CO)₆, ferrocene, B₁₂H₁₂²⁻, C₂₀H₂₀, C₆₀), so a showpiece is not the
  one molecule without names; cluster tolerance 2e-10 Eh; the geometric tolerance stated; a names record all or nothing
  (below tolerance a record shows indices throughout, never a mix); one PySCF cross-check in `tools/`.
- **"True human information."** Per orbital the textbook LCAO name (derived for diatomics) and the character (core / σ /
  π / lone pair); for the ten probed molecules the vertical ionisation energy beside Koopmans' −ε, tagged `curated`
  with the honest gap, each value citing its primary measurement (CCCBDB is NIST SRD 101; the legal reading is checked
  against `LEGAL-PROVENANCE` before a store build).
- **The CORE fold.** The ladder folds the frozen-core levels into one `core ×n` row opened by a click; the count is per
  element in the generator — He for Li–Ne, Ne for Na–Ar, Ar for K–Ca, **Ar for Sc–Zn (3d is valence)**, Ar + 3d¹⁰ for
  Ga–Kr. Without it an 87-AO ladder is fifteen core lines and a heap.
- **The teaching moment** becomes a demo and a page: N₂'s HOMO is `3σg` in STO-3G and `1πu` in 6-31+G*.
· MO-REGISTRY, SPECTRUM, exports · engine/app · M · never asserts an ordering.

**F2 · THE STAGE TEXT AND ITS FADE — the first taste of the INFORMATIONAL.**
- Cloud's plain-text formula becomes markdown + KaTeX through the notebook's own renderer (marked and KaTeX are already
  loaded), from `stateLatex` and a one-function TeX of the library formula, re-rendered only when the string changes.
  The atom labels go through `cameraEye` and write only on change.
- **The fade.** `announce(md, ttl)` writes into the same node and fades after its ttl; the formula returns after it. It is
  called by the controls Josh named — MO-REGISTRY's WINDING and HOMO + LUMO presets, whose text the names make
  meaningful (`WINDING · 1e1g (a) + (b)`), and SPECTRUM's presets — on hand presses only. The palette and camera HUD
  ("other elements could do that too") is R-I2 and lands with the kit's `addLabel({ttl})` at 0.5.0.
- **The type scale** is the notebook's three sizes now (formula = title, announcement = heading, atom label = body); the
  kit's "typomagical" faces (Spectral, Playfair Display, Alegreya SC under `fonts/info/`) and its per-element sizes come
  with the layer at 0.5.0.
- **One DISPLAY row.** STAGE FORMULA + ATOM LABELS and their two SIZE knobs become ONE row, STAGE TEXT (switch + SIZE);
  PREFERENCE keeps `molFormula` / `molFormulaSize`, `atomLabels` / `atomLabelsSize` are read once and dropped,
  STATE-SCOPES and the PREF set in `tests/new-project.test.mjs` change with it.
- **A caption in capture.** One plain-Unicode line (`H₂O · 1b₁ HOMO · STO-3G`) drawn into the capture overlay canvas so
  PNG, loop and video carry the name (the DOM formula never reaches an export; a teacher's slide needs the name). Brief 6
  replaces it at 0.5.0.
- At 0.5.0 `announce` becomes `layer.addLabel({ttl})` and the formula `layer.addBlock({md})`; this interim renderer is
  named here so 0.5.0 deletes it.
· the stage, SETTINGS › DISPLAY, capture · app now, kit at 0.5.0 · S · no per-tick layout reads; no live coefficient.

**F3 · THE WINDOWS** (the audit's 27-card table; Josh: audit, consolidate, leverage power and DISPLAY).
- **Retire DYNAMICS** (R-W1): L/T/V/S and its plot → SHADOW's footer; the moments and the virial → CALCULUS tiles; the
  dipole lines → RADIATION; ACTION–ANGLE → gone (SPECTRUM is it); **PARTICLES → a switch in VORTEX** (same j/ρ; VORTEX
  becomes "the flow"). `RETIRED_WINDOWS` maps `dynamics → shadow` for saved layouts. One card and up to ~470 lines go.
- **CALCULUS like RADIATION** (Josh's words; RADIATION's skin goes to CALCULUS alone — METERS and WIGNER were not asked
  for, and a look change is Josh's ruling). The laws become tiles in a grid (two columns on the card, three floating),
  opted out of LEAN; every row gains `tex`; ⧉ copies **the prose figure** — a heading, then "Figure. ⟨ψ|ψ⟩ = 1.000 (d/dt
  = 0 to 1e-9); …", related rows combined into sentences (the Ehrenfest pair as one), inline `$…$`, display `$$…$$` for
  the laws — which pastes into the notebook and renders. TO NOTEBOOK and the other readers' markdown copy are brief 3
  (on 1.4.3 there is no menu behind ⧉, and paste already reaches the journal). The CALCULUS **overlay** (its residuals
  typeset on the stage) is a 0.5.0 layer (§8).
- **METERS.** The badges leave its tick (B0); the PERFORMANCE seg moves beside GOVERNOR in SETTINGS › QUALITY; the
  GOVERNOR readout and FRAME PROFILE stay — FRAME PROFILE already prints each reader's ms, so there is no new cost line.
- **Names:** SLICE → **PLANE** and SLICE / CLIP → **CLIP**, ids stable (R-W3; ψ-PLANE if "plane wave" clashes for Josh).
- **ATOMS returns as the periodic-table window.** Its Z stepper becomes a grid of H–Kr cells grouped by period (periods
  as columns on the card and on a phone, rows when floating), built with SPECTRUM's own button builder; choosing ATOM in
  SPECTRUM opens it, **and it gets its own row in the "+" and WINDOW menus** (two hops through a folded SPECTRUM is not a
  seat). Its readouts (Δ-SCF beside −ε, the quantum defect, the α-dependent order) are physics no other window has. At
  0.5.0 the grid becomes the kit's `cells` (brief 4) and, mounted a second time in MOLECULES, the **library's map**: a
  lit cell counts the molecules holding that element, a tap filters, a dark cell is what the diversity gate wants next.
- **The legacy rest** (R-A2): H₂⁺, HELIUM, H₂, ELECTROSTATICS and QCD stay hidden in 0.4.0 and are decided at 0.5.0; H₂'s
  FCI curve becomes a MAP there.
- **STATE audited** (R-W5): the window holds preparation controls, has no reader, hides under a molecular owner, and no
  other window duplicates it — it keeps its controls (SCENES is 0.5.0); the app's state — the three scopes plus LIBRARY —
  is re-proven after every stage by the existing suites, and B2's open path is the new case.
- **"Somewhat realtime"** (R-W6): power stays binary; the cadence is the existing reader law (every 4th frame at
  PERFORMANCE 120, every frame at FULL, parked above 6/16 ms); its meter is FRAME PROFILE.
- **Which windows are popular** is a ruling, not a guess (R-W7): there are no analytics.
- The window cost law restated: off, folded, closed, hidden or offscreen costs zero; the stage text joins it.
· app (the CALCULUS grid and the ATOMS cells become kit by briefs 3–4) · M · nothing that reads layout per tick.

**F4 · THE CAMERA.**
- **A lens shift.** The picture slides and the molecule stays the pivot — "a planet photo at max FOV", and the kit pad's
  unit. `obs.shift = [sx, sy]` is defined **in the ray's uv units** (uv spans −1…1): `writeView` writes the shifted
  principal ray `fwd + 2·sx·tanH·aspect·right + 2·sy·tanH·up` into the forward lane, the ray pass normalises it and the
  headlight follows; the line chrome's perspective matrix gains the same principal-point offset in two entries; the
  pivot appears at minus the shift; `cameraEye` hands the shift to the 2-D overlays. Clamp ±0.5 uv, so the pivot reaches
  the frame's edge and never leaves it. At shift 0 both passes are byte-identical, so the lock holds by construction.
- **Zoom to the cursor, through the shift.** On wheel and on pinch, `shift' = c − (c − shift)·dist/dist'` (c = the cursor
  or the finger centroid, uv) keeps the world point under the hand still — one line, the maps behaviour people expect,
  and the cure for pinch drift on the iPad.
- **Hands.** Alt-drag pans on a trackpad and a mouse (Alt is free on the stage: the specials use Ctrl and Shift; verify
  `preventDefault` holds in Firefox and that the desktop's window manager does not take Alt-drag); a two-finger drag pans
  on touch beside pinch; wheel stays dolly; an Alt+Arrow pair in `lab/shortcuts.js`, with `tests/keyboard-shortcuts.test.mjs`
  extended. CAMERA gains PAN X / PAN Y (two knobs now; the pad with the lattice at 0.5.0 — the knobs are its targets)
  and PAN HOME; RESET VIEW clears the shift; targets `observer.panx/pany`; STATE-SCOPES' pose row gains `shift`
  (PROJECT, not history); the empty project is regenerated (`tools/new-project.mjs --check`).
- **The link carries the shot.** `statelink.js`'s own policy lets fields be appended at a section's end under v1: the
  shift rides the CAM section's tail, and one new tag carries `{library id, basis, view, orbital as {group, irrep,
  count}}` — a few dozen bytes under the ceiling. Today a link made under MOLECULES silently drops the molecule; after
  this a teacher posts one link: "1b₁ of water, framed in the gap".
- The target pivot (orbit about what you inspect) is built only if Josh, having tried the shift zoomed in, asks for it
  (R-C1).
· CAMERA, the stage · engine (ray-gen) + kit (panel, brief 2) · M · PRESENT tier only; a verifier (the camera uniform is
the frame path); `render-regressions` and `keyboard-shortcuts` in the gate (the shift changes `pointerRay`/`unproject`).

**F5 · THE LIBRARY as expansions.**
- **S4a · the proof and the store.** Benzene's record (Sol's native booster + names + STEM fields + its page) opens with
  no SCF through `chem.open`; `lw-data-v1` serves from `lab/library/`; the scope row lands; persistence, eviction and
  quota are measured on the M5. **The 52-record starter** for the existing molecules ships only if B0's re-time shows a
  saving worth its bytes; the new sections' records ship regardless (they are past the cap). A verifier (worker +
  storage). **Before S4c touches the kernel**, benzene and a 64-AO fixture join the digest lock on the base tree — its
  only molecular fixture today is water, tier 0, so "the ≤ 64 tiers are untouched" is provable only after that.
- **S4b · the sections as content, behind the gate.** The picker: a page turner `‹ SECTION ›` above the existing
  `<select>`, which then holds one section (about 25 rows); search is 0.5.0's FLY-TO. The sections, diverse rather than
  variants (R-L1): DIATOMICS · HYDRIDES · ORGANIC · **BIO** (the twenty amino acids as a family — sixteen ≤ 64 AO now,
  Phe, Arg, Tyr, Trp after S4c; the five nucleobases 44–60; Gly-Gly 57; N-methylacetamide, imidazole, indole, phosphoric
  acid, ribose) · **LATTICE** (finite clusters only, the solver has no k-points: LiH/LiF/MgO cubes, Na₂Cl₂, the ice
  hexamer and cube, cubane, neopentane, naphthalene, Si₅H₁₂; Na₄Cl₄ after S4c) · **HEAVY** (the Kr row: KrF₂, SeO₂, KBr,
  GeCl₄, TiCl₄; the d-block "try it and let the stability probe decide"; **and, if the BSE record carries STO-3G to
  Z = 54, the vendored basis widens to iodine and xenon** — HI, CH₃I, XeF₂, XeF₄, I₂ — labelled MODEL, all-electron
  minimal basis, no relativity; an ECP belongs to def2-type bases, not here). Bases: STO-3G + 6-31+G* for anchors only;
  the name is the join key, so an A/B MORPH between bases means the same orbitals. STEM fields per record (R-L4):
  formula, point group and frame, mass, charge and multiplicity, dipole, HOMO–LUMO gap, geometry source, InChIKey and
  PubChem CID (open; not CAS), a two-line blurb, the curated IEs, and the sources. **Sizing:** every entry needs a stated
  geometry source and a PySCF oracle energy; build three end to end first (alanine, Li₄F₄, TiCl₄), time them, then size.
- **S4c · the engine upgrades.** (i) **The density wall** is the χ tile in workgroup memory, cap × 64 × 4 B = 16 KiB at
  cap 64, WebGPU's default `maxComputeWorkgroupStorageSize`; one more tier in `MOL_CAPS`, cap 128, by B0's numbers —
  request the adapter's limit where every target grants ≥ 32 KiB, else a workgroup of 32 for that tier only. Records
  then reconstruct Phe–Trp (71–87), adamantane, Na₄Cl₄, B₁₂H₁₂²⁻, caffeine, DMT, the base pairs (99–106), C₂₀H₂₀ (120),
  the carbonyls and ferrocene. The dense ERI (458 MB at 87 AO, 1.66 GB at 120) is the generator's, never a live solve's.
  (ii) **The orbital-only path, no tile:** an orbital is Σ c_μ χ_μ, O(nAO), accumulated shell by shell with a small
  reduction — the ORBITAL kind at any AO count, so **C₆₀'s HOMO and LUMO draw in 0.4.0 from a PySCF coefficient record**
  if B0's 300-AO dispatch measures under the tier's budget (R-L2); density, the I_h names and the grid-record road stay
  0.4.1. (iii) **VALENCE** = `D − 2 Σ_core C_c C_cᵀ`, formed in f64 and drawn by the existing density kind, as a switch on
  DENSITY (not a fourth segment: the VIEW row is at the hand law's width), so the heavy-atom core no longer drowns the
  valence. The live cap moves only after B0's re-time and a refit of `COST`. A verifier and the frame-time protocol.
· MOLECULES (sections, headers, CORE, VALENCE — the fourth named exception to "nothing new in the interface", because
Josh asked for expansions and layouts by name), FOLDERS at 0.5.0 · engine/content · L · never a second solve road; never a
record that fails validation; never a disabled row where a download would do.

**Cut from 0.4.0** (each with its reason and its home): FIGURE (needs the kit's envelope and intake; 0.5.0); honesty chips
and a CITE face (HELP is off at first run, they would ship invisible; the sources ride the record now; 0.5.0); TAKE MODE
(optimises a layer λWAVES does not have yet; brief 7, 0.5.0); the warm cover (trades ~2 s of Safari boot stalls for one
hitch WebKit has fixed upstream; measured on the M5 before it is planned again); the OVERLAYS row with new stage
overlays for SHADOW, ORBIT, PLANE and CALCULUS (Josh placed them "on the informational"; 0.5.0 layers); the EXPANSIONS
tab (the section header is the seat); the target pivot (R-C1).

## 5 · THE KIT BRIEFS (0.4.0's deliverable to the MIR session)

One brief per row, each with acceptance and the λWAVES port that consumes it, written during S1–S4 and delivered as one
file, `research/release-0.4.0/KIT-BRIEFS.md`, mirrored to the vault as `LAMBDAWAVES CLAUDE KIT BRIEFS FOR MIR <date>.md`.
λWAVES never touches MIR.
- **8** `paintedSpace({rack, layer, extra})` + `subscribe(fn)` fired on window move, scroll, open and close, even while
  paused — first, because it is the adoption blocker: the frame/axis mask needs painted surfaces, not whole rects.
- **2** Lens shift in the CAMERA panel and the CSS port; the 3-D HOME resets the shift.
- **3** `rack.register({ md })` + TO NOTEBOOK + PIN FROM WINDOW — the journal "throughout the app".
- **4** The `cells` grid control: periodic, (l, n), sections; vertical on phones; a second mount as a filter.
- **5** `createLattice` exported from the XY pad for inlays, with the eight tokens. The inlay list: STATE's IMPULSE
  VECTOR, KEPLER tilt/turn, PLANE's mini, ORBIT's rotor spheres, WIGNER's (z, p_z) map, RADIATION's polar, the A/B morph,
  STATIC FIELD's direction. "A little less intense, smaller circles" is eight tokens in λWAVES' sheet, no kit code.
- **6** `recorder.overlay(i, ctx)` — the overlay in the film.
- **7** `addLabel({ttl})`, `layer.setCheap(on)`, `html[data-take]`, with the TAKE MODE switch delegated to the app's
  DISPLAY — the GPU-recording optimisation.
- **9′** STATUS TAGS never hides `[data-mir-offer]`.
- **13** The INFORMATIONAL rack window, with its switch delegated to the app's own settings; movable labels (`setEdit`).
- **Live-bound math labels** (`{{state}}`, `{{E}}`, `{{T}}` from `params.get()`): "it will dynamically change as things
  and settings in the rack windows are changed".
- **P** The paint gesture as a kit gesture (Cloud's `paint-stroke.js` is generic); the app copy is then deleted.
- **J** `jetblack` + `flat` and the gate exemption in the 1.5 catalogue, for the big four.
- **1** The 3-D camera law and stage gestures (`mir/camera/law.js`, pure, with λWAVES' numbers and tests, zoom-to-cursor
  included) — a gift for NEBULA, POLAR and EARTH, not a 0.5.0 dependency.

## 6 · THE STAGES

| # | Stage | What | Done when |
|---|---|---|---|
| S0 | TAKE-IN + CANARY | B0, B0.5, the bug fixes, the vendor wiring, the process hole, the three measurements, the three demos, 0.3.3 cut | every gate green on the merged tree (incl. `frame-occlusion`); no forged manifest and the pinned test fails on one; Jet Black live by R-A3's route; precache down ~650 KB; the canary's first row; the AO-limit, benzene re-time and 300-AO numbers in REPORT; the live site = the cut (a verifier: release) |
| S1 ∥ S1′ ∥ S1″ | NAMES ∥ `cameraEye` ∥ THE SOL THREAD | F1 ∥ B1 ∥ a mathcollab ledger on "cyclotomic scaling" in Josh's sense, off the Opus path | every enabled molecule named or says why; the knob reads `1b₁ · HOMO`; the CORE fold; the plain and typeset forms; the copy renders; the N₂ demo ∥ `cameraEye` the only projection; `lab/*.js` down; 208-lock green ∥ the ledger plus one number: benzene's unique-quartet fraction under D₂h, measured on `md.js`'s own loop by a `tools/` script |
| S2 | CAMERA | F4 | shift tests (shift then RESET = identity; the cursor-anchored point invariant across zoom and FOV; a FRAME corner on the same pixel through the line pass, the ray pass and `pointerRay`/`unproject` at a non-zero shift); Alt-drag, two-finger, Alt+Arrow; zoom-to-cursor; the link tail round-trips; 1004-lock byte-identical at shift 0; `new-project --check`; `render-regressions`; the device report equal before and after on the 3070 (M5 pending) — a verifier |
| S3 | STAGE TEXT + WINDOWS | F2, F3 | no per-tick layout reads; KaTeX only on a changed string; WINDING and HOMO + LUMO fade with their names, hand presses only; one STAGE TEXT row; the caption in capture; DYNAMICS retired (PARTICLES in VORTEX); CALCULUS tiles + the prose figure; PERFORMANCE in QUALITY; PLANE/CLIP; ATOMS back with its table and its "+" row |
| S4 | LIBRARY a / b / c | B2 + F5 | a: cached = fresh on energies, occupations, signed fields, subspaces, names; zero solver calls; `library/**` the one precache exemption; benzene and a 64-AO fixture in the lock; persistence on the M5 measured (a verifier) · b: three entries built end to end and timed, then the sections pass the gate with the family allowance; the page turner + headers · c: an 87-AO and a 120-AO record reconstruct; VALENCE; C₆₀'s HOMO/LUMO if the dispatch measured; 1004-lock green; the device report within the governor's tier (a verifier) |
| S5 | KIT BRIEFS | §5 | each brief has acceptance and a consuming port; brief 8 first; the MIR session has them before the `1.5.0` cut |
| — | **cut 0.4.0-alpha** | | |
| 0.4.1 | BUCKYBALL | C₆₀'s density from a PySCF record with precomputed grids uploaded into the molecular volume (one `field` upload road); the I_h names; the stepping stones' timings | C₆₀ draws whole on the 3070 and the M5, labelled GRID RECORD |
| 0.5.0 | THE ADOPTION, then THE INFORMATIONAL | MIR `1.5.0` in BASINS' order with the canary's deltas and the glue seams; the 15 risks closed; then pages per orbital/state/molecule/window, feature labels, the window, the overlays as movable layers (SHADOW, ORBIT, PLANE, CALCULUS), the film overlay, TAKE MODE, FIGURE, chips, FLY-TO + search, SCENES, MAPS, the pad with the lattice, the periodic table as the library's map | stylehash neutral; ~9–10.5k lines out; every law re-proven; the device report on the 3070 and the M5 |
| 0.5.x | the wave index (station ring, carousel, `Q_LM`) · symmetry-adapted SCF if the thread's number earns it | | |

**Why this order [mine].** S0 first: the live main is unreviewed, and the canary and the three measurements are the
cheapest information in the plan. S1 beside `cameraEye` and the Sol thread: disjoint files, no Opus cost for the thread,
and the names are Josh's loudest ask. S2 right after `cameraEye`: small, visible, one verifier. S3 after the names,
because the fade speaks them. S4 last and split, so the iPad measurement and the three-entry build precede the sizing.
The briefs throughout. **Verification:** one light check per stage; a verifier for S0 (release), S2 (the camera
uniform), S4a (worker + storage) and S4c (the kernel); at 0.5.0, the adoption. The 208-lock runs only on frame-path
commits.

## 7 · RULINGS FOR JOSH (each flips one line)

**For 0.4.0:**
- **R-A1** Cut 0.3.3 from the merged-and-subtracted tree (the exports + Cloud's kept work); 0.4.0 starts from it.
- **R-A2** ATOMS returns as the periodic-table window and SPECTRUM's ATOM opens it; QUARKONIUM hidden while QCD is;
  H₂⁺, HELIUM, H₂ and ELECTROSTATICS stay hidden until 0.5.0 — or name the ones you want back now.
- **R-A3** Jet Black: a real MIR 1.4.4 on `mir-1.4.x`, or one app-side catalogue row until 1.5 carries it.
- **R-F1** Flagship, operationally, as §1 — or your own definition.
- **R-G2** The INFORMATIONAL proper (springs, lines, pages, the pad, the film overlay) needs MIR 1.5 in the app: 0.4.0
  ships its first taste and 0.5.0 the layer — or 0.4.0 waits for the `1.5.0` cut and carries it.
- **R-L2 (the one that decides the most work)** C₆₀: its HOMO and LUMO in 0.4.0 through the orbital-only path if the
  300-AO dispatch measures, the rest in 0.4.1 — or all of it in 0.4.1.
- **R-W1** Retire DYNAMICS as mapped. · **R-W2** The copy is the prose figure — or add a table. · **R-W3** PLANE (or
  ψ-PLANE), with CLIP. · **R-W5** "State audited" meant the window, the saved state, or both (both are done). ·
  **R-W6** "Somewhat realtime": the reader law as is, or a per-window LIVE cadence. · **R-W7** Which windows you and a
  visitor actually open.
- **R-C1** Lens shift only; the target pivot if, after trying it, you want to orbit a lobe. · **R-C3** The pan chord is
  Alt-drag — or another free one.
- **R-L1** The sections under the gate with the family allowance. · **R-L4** Which STEM fields you want to see. ·
  **R-L5** Stores builds: expansions bundled or downloaded. · **R-L6** Widen STO-3G to iodine and xenon if the BSE
  record has it.
- **R-N1..8** The names plan's rulings stand (its R6 is R-L3 here: records live in `lw-data-`, not the build).
- **R-S1** "Cyclotomic scaling": the default reading is your corpus's — the character-basis principle (MASTER GOAL SPEC
  §39, L-0408), concrete as symmetry adaptation (Fock blocks, unique ERI quartets, asymmetric-unit reconstruction) — or
  the ring-character reading alone, or something else you mean. The Sol thread starts from your answer.
- **R-U1** Who 0.4.0 is for (you, a class, Reddit on an iPad): it decides what leads 0.5.0.

**For 0.5.0 (ask now, needed later):** **R-B1** one clock (the transport's play is THE play; modulation gets POWER;
LINKED/SEPARATE retired) · **R-K1** the S key (WASD keeps S; FOLDERS takes another chord) and the MOD arm on Ctrl+Space ·
**R-D1** the first-run look under the kit: λWAVES' light theme, 22 px, 50 % VIVID, normal ink · **R-I1** the INFORMATIONAL
switch in SETTINGS › DISPLAY · **R-I2** `lw:` action links in pages, and the non-educational HUD through the same engine ·
**R-I3** pages travel with the project vs "an open never closes the notebook" · **R-G1** 0.5.0 waits for a `1.5.0` cut
and the canary runs again then.

## 8 · DISPOSITIONS AND WHAT IS NOT CLAIMED

**Josh's sentences with a later home:** the dot matrix on every inlay (brief 5, 0.5.0 tokens); GPU-recording
optimisation (brief 7, 0.5.0); the overlays of SHADOW, ORBIT, PLANE and CALCULUS as movable layers (0.5.0); "other
elements" announcing (the HUD, R-I2, 0.5.0); the journal "throughout the app" (brief 3, 0.5.0 — paste reaches it now);
the other readers' markdown copy (brief 3); "typomagical" faces (0.5.0); heavier atoms beyond xenon (basis data and
relativity: a Sol thread, not 0.4.x); wave indexing, electrostatics and Taylor shells (0.5.x; VAULT §1.2–1.3 holds the
three readings); the bucky-ball whole (0.4.1).

**SIBLINGS rows:** 0.4.0 — CITE as record content; the caption in capture. 0.5.0 — 1 SCENES (in STATE, replacing A/B as
two of eight), 2 FIGURE, 4 chips, 6 named orbitals + FLY-TO + search, 7 pages, 8 the library gallery, 9 MAPS (H₂'s FCI
curve first), 19 flash guard, 20 title card, 21 ink law, 24 CURVES, 27 kit project parts, 33 kit panels and the lattice,
TAKE MODE. 0.5.x — 5 period-exact export, 10 TIMELINE, 11 the atom as metronome, 12 LAYERS, 13 ATLAS, 14 RULER, 15 LENS,
16 CHORD and the ladder keyboard, 17 kymograph, 18 scale bar, 22 LIC/bloom, 25 TAKE, 26 LIGHT, 29 DEROTATE, 31 TUNER,
32 PATTERN, 34 GPU anchor, hover-to-peek, the character-table page, the vs-EXPERIMENT lamp beyond the ten, SHARE LOOP.
Declined — 23 params registry (check `app.param()` / `describe.js` at adoption), 28 MIDI, 30 OUTPUT, 35, the known-answer
lamp in the shipped build (diagnostics live in `tools/`), the anti-harvest as written. Measured before planned again —
the warm cover.

**One in, one out:**

| In | Out |
|---|---|
| ATOMS back, with a "+" row | an orphaned button and a stepper |
| PARTICLES into VORTEX | DYNAMICS (~470 lines) |
| one STAGE TEXT row | STAGE FORMULA + ATOM LABELS + two SIZEs |
| the caption in capture (now) | brief 6's film overlay at 0.5.0 |
| — | the duplicate vendor tree (~650 KB a deploy) |
| one projection helper | nine projection copies |
| — | Cloud's polling and per-tick label writes |
| the section header as the expansion seat | no new tab |
| the interim stage-text renderer (now) | deleted at 0.5.0 |
| the ATOMS cells and the library chrome (now) | the kit's `cells` at 0.5.0 |

**Not claimed.** No line of 0.4.0 is built. The INFORMATIONAL has run in no real app; its touch, WebKit and
over-WebGPU looks are unproven. The AO tier's route waits on the adapter numbers; the orbital-only path on one measured
dispatch; the cost model's staleness on B0's re-time; the BSE's STO-3G range to Z = 54 is unverified. The names probe
covered ten molecules in STO-3G with s and p only; the showpiece groups' tables are unbuilt. Later or not re-planned:
the wave index, the Sol thread's engine consequences, the parked asks (the Serum matrix, shader plugins, knob
quick-settings, ijk mini-maps, "2×6 layout"), the About/Notebook buttons at the top right (the kit's at 0.5.0), Sol's
pack delivery (Drive, R2). A symmetry saving on a Cartesian grid is bounded by its signed-permutation operations (at
most 48, usually 8). The legal reading of CAS and NIST SRD is unverified. The YouTube video's content beyond its title
and description is unknown.
