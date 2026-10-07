# VAULT digest for λWAVES 0.4.0 planning

Read-only survey, 2026-10-07 (Sonnet 5.5). Source tree: `~/Documents/OBSIDIAN` plus the two λWAVES research folders named in the brief. Nothing outside this file was written. Tags used below: **[READ]** stated in a note I read; **[CHECKED]** I grepped or counted it in the tree or with a read-only node one-liner (not run in a browser); **[PROPOSAL]** mine, in no vault note; **[SPECULATIVE]** a reading of Josh's words I cannot confirm.

## Summary (10 lines)

1. **ZOETROPE** = a deep place is addressed by its renormalization ladder (levels, letters, branch bits: "the DNA of a save"), and nearby pixels come from a cheap exact-plus-first-order chart with a provable horizon and an honesty readout, switching to the exact solve outside it. §1 proposes the same for presolved orbitals: an index keyed by (species, method, (irrep, count) names), a warm-start / first-order "ghost" per record, an a-posteriori honesty number, a horizon set by the nearest same-irrep level crossing, and live SCF as "TRUE".
2. **"Taylor 3D shells / higher-level QHO / true electrostatics"** has three possible readings (§1.3). The best supported: interior regular solid-harmonic shells (r^L Y_LM) of the molecular Coulomb potential, feeding a QHO shell basis. `qho.js`, `electrostatics.js` and the MO-basis dipole matrices already exist. Earlier research warns that a global Taylor orbital creates no motion and that an anharmonic Taylor series diverges, so diagonalise in the shell basis instead.
3. **DESIGN BOOSTER** is a 7-step loop (inspect, find, read code, adapt to our language, compare and measure, keep the finding) over four named libraries plus shadcn MCP, Context7 and native CSS. It says to preserve Magic Commons' grain and shine. The skill exists at `~/.codex/skills/design-booster/`.
4. **MIR 1.5 rulings** that bear on adopting: ON = a frost face with a lit accent light (λWAVES draws ON as an accent fill today); light from above; the FROST recipe; SOLID/MORPH; modulation gets POWER, never play, and the timeline owns the one play; transport layout stays per app; pages-in-notebook INFORMATIONAL; the hand law (positions never move); the control language; Josh's 23 answers of 10-07. §3.
5. **BASINS gave the kit 23 things** plus a control language and six rack windows. λWAVES has app-local equivalents for about half (history, scopes, keyboard design, "+" menu, modulation window, mic audio, recorder, camera law, device tier, banner/GPU-lost) and lacks timeline, PATTERN, wake lock, project ZIP, opener, languages, skins, INFORMATIONAL. §4.
6. **Older λWAVES asks**: most are built (Impulse rename, FRAME/AXIS modes, CMY axes, ☆ layouts, ordered dither, 33 palettes, phone rack, warning cutout, backgrounding). Open: the newest NEXT UPDATE pair (Space with LINKED clocks; About/Notebook buttons shifting), the parked Serum matrix and macro-side drag, shader plugins, knob quick-settings, timeline, ijk minimap, the molecular RI-J / Sturmian / vibration rungs. §5.
7. **Cache plan**: Sol: booster for the 52 STO-3G presets, then Drive/R2 packs, then a grid provider for C60/DMT. Fable: names first (N1), then the benzene booster proof (N2), then the starter (N3); LIBRARY as a fourth storage class; own `lw-data-` cache; the app is the generator with `--check`. The probe named 10 molecules and every textbook configuration matched. §6.
8. **The video** (HZAmbbTcQ3M) is "Your Operating System | Eukaryotic Transcription" by Clockwork (2025-02-13, about 45 min). Its description names no molecules; its chapters end on splicing and the spliceosome. §7.1.
9. **Biology / crystal / heavy-atom candidates** with STO-3G AO counts (§7.2 to 7.4): all 20 amino acids are 30 to 87 AO (16 are at most 64; Phe 71, Arg 74, Tyr 76, Trp 87); Gly-Gly 57; nucleobases 44 to 60; base pairs 99 to 106; heavy atoms stop at Kr (19 AO each); crystals are finite clusters only.
10. **Conflicts a plan must settle**: FROST recipe (11 px, dark, white text) vs λWAVES first-run (22 px, 50 % VIVID, light/refractive); INFORMATIONAL "a project carries its pages" vs the repo CLAUDE.md notebook law; kit key table vs `shortcuts.js` law; Butler/paid builds; the dated test in `tests/wiring.test.mjs` that fails from 2026-11-20.

---

## 1. FABLE'S ZOETROPE, and how it could mirror in λWAVES

### 1.1 What the note says (9 lines)

Note: `TITAN CRAFT/MANDELBROT/FABLE 5.1 ZOETROPE 2026-09-02.md` (title "FABLE'S ZOETROPE", Fable 5.1 + Opus 5, 53 KB). Josh's own words on the product are in `zoetrope-interview.md` and `JOSH_&_SOL_ZOETROPE.md`. **[READ]**

1. Near a deep parameter c0 the picture is generated from c0's *own orbit* by a few exact identities; no fresh deep computation is needed per zoom.
2. Every iteration index n gets a multiplier Λ_n, the partial sum u_n of Tan Lei's series and the **renormalized parameter C_n = Λ_n Z_n**: the distance to the nearest period-n minibrot *in its own natural size*. Near the critical point the n-th return map is ζ → ζ² + C_n, so every level is a rescaled copy of the quadratic family.
3. The **levels** of c0 (indices where the chart is univalent) form a ladder; a zoom is a **word over earlier levels (letters)**, with an exact fold identity Z_{n+m} = Z_m + Z_n² Λ_m Π and compounding law C_{n+m} = 2 Π' b C_n C_m.
4. |C| > 1: periods add (decoration). |C| < 1: periods multiply (tuning, the self-letter). The boundary |C| = 1 is the dichotomy.
5. **Chart horizon**: the chart is univalent to at least 0.912 R, with R set by the nearest half-size critical point (the "pole lattice"). A provable validity radius from the ladder alone.
6. **Ghost**: D(c) ≈ P + E_c0(√(z_P(c)² + ũ(w)(c − c0))), exact to about 1e-13 of the window at the deepest test, honesty readout 1/(2|C_P|); the instrument must **switch to TRUE** near an embedded minibrot (the ghost's advantage collapses within about 1e-4 r_P of a nucleus).
7. **The DNA of a save** = the level ladder with, per level, the letter, a branch bit and the visit offset b_k. Josh's three ELEKTRA saves share an identical ladder prefix through level 9202; the PIEZO pair through 273863. Indexing is by ladder prefix.
8. Josh's product (the "ZOETROPE" mode): cycle many locations of the same tier/ring (a period-64 ring of embedded Julias, 1 s at 60 FPS), hard cuts, FPS marks 10/15/24/30/40/60 rather than BPM, "quick real time exports". Follow-on rounds (09-06, 09-08) prove uniform inverse-chart and **Taylor-error bounds at every depth** (degree 21 is enough for normalized error below 1e-6).
9. So "renormalization indexing" is: (a) address by a short word or ladder, (b) a cheap local chart around each reference, (c) a provable radius plus an honesty number, (d) a switch to the exact method outside the radius.

### 1.2 PROPOSAL: "wave indexing the presolved orbitals" [PROPOSAL]

Josh's words (`LAMBDAWAVES CACHING + INFORMATIONAL.md`): *"Wave indexing the presolved orbitals (similar to renormalization in the mandelbrot set) so that we could do some future ideas like attempts of dynamic waves with true electrostatics like a higher level QHO but based on taylor 3D shells."* None of the following exists in any note; it maps the four-part pattern of §1.1(9) onto Fable's names plan.

**The index (the "word").** Three tiers, outermost first. These are the same keys as `NAMES-AND-CACHE-PLAN.md` §6, used as an index instead of a lookup.
- *Species*: composition, declared point group and frame, geometry id (a library entry). This is the "nucleus".
- *Method*: basis, solver, gauge and name-schema versions (the record key in the names plan).
- *Letters*: per-orbital `(group, irrep, count)`. The names plan already argues this is the one identity that survives a change of basis or dataset (measured: N2's HOMO is `3σ_g` in STO-3G and `1π_u` in 6-31+G*). Two levels of one irrep do not cross (non-crossing rule), so the name is the right *continuation label* along any path through a family of geometries that keeps the group.
- *Prefix reuse*: homologous families share a prefix the way the ELEKTRA saves do (diatomics, alkanes, an amino-acid backbone plus a side-chain letter). This is the analogue of "decoration" (fragments joined); "tuning" has no clean orbital analogue, so I do not claim one.

**Matching a live state to the nearest record.** The live state is (species, geometry q, basis, register amplitudes and phases). Match order: exact species and method, then nearest geometry in Hessian-scaled distance, else fall back to the live solve. The register coefficients refer to *names*, so they survive a swap of the underlying dataset (the names plan's "portable reference").

**Three tiers of answer, labelled on screen like GHOST / TRUE.**
1. *Cached* (distance 0): read the record, no SCF. This is Sol's booster and N2.
2. *Warm start* (small distance): the record's C as the SCF guess after Löwdin re-orthonormalisation in the new overlap S(q). It ends on the true solution in a few iterations; cost is a few Fock builds instead of SAD + stability Hessian. This is exact, not an approximation.
3. *Ghost* (display only): keep C, re-orthonormalise in S(q), render. **Honesty number**: the occupied-virtual Fock block norm ‖F_ov‖ (the SCF gradient; zero exactly at the true solution), giving a second-order energy-error estimate ‖F_ov‖² / gap. This is standard SCF theory, not new; it plays the role of 1/(2|C_P|). One Fock build per check, no new solver.
- *Switch to TRUE*: when the number passes a tolerance, or the stability probe the solver already runs flips, or two levels of the same irrep approach each other. Same law as "you are on a minibrot, render TRUE".

**The horizon.** The honest analogue of the chart horizon is the distance to the nearest same-irrep avoided crossing in the family parameter. (Known: the radius of convergence of Rayleigh-Schrödinger perturbation theory is the distance to the nearest exceptional point in complex coupling (Kato).) The ZOETROPE result is a theorem about the Mandelbrot family; here I only borrow the *shape* of the argument and would measure the horizon per family, not assume it.

**Where it earns its keep in the app (small, concrete) [PROPOSAL].**
- A geometry station ring for diatomics (H2, N2, CO, HF; bond-length stations R_1..R_k): orbital morph and ε(R) by Hermite interpolation per *named* orbital with Procrustes alignment in the S-metric and `canon-gauge.js` for degenerate sets. A zoetrope of correlation diagrams, at Josh's FPS marks, exportable with the existing capture/render-exact road.
- An **ORBITAL CAROUSEL** mode in MO-REGISTRY: step the named ladder (`1a1, 2a1, 1b2, 3a1, 1b1, 4a1...`) at 10/15/24/30/60 FPS with hard cuts, each frame a cached record. Sol's plan already lists a "selected-orbital tour"; this gives it the Zoetrope clock. A *ring* is a degenerate set or a Hueckel ring: for an N-site ring ψ_k = e^{2πi k j/N}, E = α + 2β cos(2πk/N), index (N, k); benzene's `1e1g`, `1e2u` are k = ±1, ±2 members. Hydrogenic scaling (E = −Z²/2n², size ∝ n²/Z, `electrostatics.js` already uses the Z-dilation) is the exact self-similarity already in the tree.
- What I would *not* claim: that molecular orbitals have a Mandelbrot-style self-similar tower. Transferability of fragment orbitals is real but approximate and unmeasured here.

### 1.3 PROPOSAL / SPECULATIVE: what "dynamic waves with true electrostatics, a higher-level QHO, taylor 3D shells" could mean

Facts already in the tree or the notes [CHECKED / READ]:
- `lab/qho.js`: the exact isotropic 3-D QHO in the same (n_r, l, m) records the GPU kernel uses, E = N + 3/2 with N = 2n_r + l; a slap on the ground state is exactly a coherent state.
- `lab/electrostatics.js`: the Coulomb potential of |ψ|² in closed form by a Y_LM expansion (L ≤ 10) with incomplete-gamma radial integrals, field lines of E and of j, Biot-Savart, Hellmann-Feynman with Pulay for H2+. Hydrogenic only.
- `chem.states` already carries position matrices in the MO basis (`rMO`); `rpa-inspector.js`, `molecular-register.js` (TD-CIS), `molecular-flow.js`, `radiation.js` exist.
- Earlier verdicts (`MOLECULAR-WAVES-PLAN.md` §4, `research/MATH-H2O-2026-09-11.md` Observation 2, Fable's judgment 09-18): STO-3G is a Gaussian fit of Slater orbitals, not a Taylor series; a global spatial Taylor polynomial of an orbital "would not create motion"; motion comes from superposed states. The places a Taylor model *does* belong are **local geometry-response surrogates, interpolation of smooth tables, and vibrations about equilibrium**; a finite Taylor propagator is not automatically unitary.

Three readings, strongest first:

**A. Interior solid-harmonic shells of the electrostatic potential [PROPOSAL].** Taylor-expand the molecular Coulomb potential about a chosen centre inside the ball that reaches the nearest charge. In a charge-free region Φ is harmonic, so each Taylor degree L collapses to a *shell* of 2L+1 regular solid harmonics r^L Y_LM instead of (L+1)(L+2)/2 monomials: (K+1)² numbers for order K. Poisson fixes the physics of the low shells: the trace of the quadratic term is the local charge density, and the traceless L = 2 shell is the field-gradient tensor. So "Taylor 3D shells" would be exact, small and analytic, and its radius of validity is set by the nearest nucleus (another honest horizon). A QHO (with its own N-shells) is the L ≤ 2 truncation about a point *inside* charge density; **Earnshaw** forbids a pure vacuum minimum, so the isotropic stiffness needs a uniform background or the electron cloud itself (Thomson's plum pudding, jellium; an interstitial site of an ionic crystal). Cubic site symmetry makes L = 2 isotropic and the first anisotropy L = 4, so shell N = 2, 3, ... split by the group (eg/t2g, ...): the **crystal-lattice section** and Fable's irrep naming meet here.
- *Dynamic and "true"*: store for each record the transition multipole matrices Q_LM(k,l) = ⟨φ_k| r^L Y_LM |φ_l⟩ (the dipole matrix `rMO` is the L = 1 case). A register packet ψ = Σ c_k φ_k then has multipole moments Q_LM(t) = Σ c_k* c_l e^{i(ε_k − ε_l)t} Q_LM(k,l) by a finite matrix contraction, with no grid, and the exterior potential Σ (4π/(2L+1)) Q_LM(t) Y_LM / r^{L+1} follows instantly. This is exactly the beat-frequency structure `radiation.js` already displays. Cost to cache, Float64, benzene, L ≤ 4: 36² × 25 × 8 B = 259 kB (64 AO: 819 kB) per dataset; belongs in the LIBRARY record, not the build.
- *Honest limits*: a frozen-orbital packet's electrostatics does not feed back on the orbitals (that is TDHF, which MOLECULES already has); exact for the packet, not self-consistent.

**B. Vibronic anharmonic QHO [SPECULATIVE; MOLECULAR-WAVES-PLAN §4 already defers this to "vibrations later"].** Taylor-expand the potential energy surface about equilibrium: quadratic terms are normal modes (3N−6 one-dimensional oscillators), cubic and quartic terms couple shells. "Higher-level" = include them. Warning from the literature: the Rayleigh-Schrödinger series in the quartic coupling of an oscillator is **divergent (asymptotic)** (Bender and Wu, 1969), so a higher Taylor order is not better; the variationally sound route is to diagonalise in a truncated QHO shell basis (VSCF/VCI practice). Electrons would breathe with the nuclear motion through the orbital derivatives ∂C/∂Q (coupled-perturbed HF).

**C. Atom-centred multipole shells (the standard way to a molecular Hartree potential) [PROPOSAL].** Partition the density to atoms (Becke or Hirshfeld weights), expand each atomic part on Y_LM shells over a radial grid, solve the radial Poisson problem per shell. This generalises `electrostatics.js`'s single-centre exactness to molecules, but only numerically (radial quadrature), so it is the heaviest reading.

**The ZOETROPE tie [PROPOSAL, analogy only].** The mathematical resemblance is real in form: "Taylor to second order at a distinguished point, rescale, get a universal normal form with corrections suppressed by the zoom" is both ζ → ζ² + C_n (miss |C|) and the QHO in its own length scale (anharmonicity suppressed by ħ/mω powers). The ZOETROPE Taylor-degree-independent-of-depth theorem has no counterpart claimed here.

Recommended minimum if any of this is planned: A with L ≤ 2 first (field, gradient, trace = charge), stored per record; B and C only as named research items.

---

## 2. DESIGN BOOSTER (`DESIGN BOOSTER.md` + `DESIGN BOOSTER — Research and Workflow.md`, researched 2026-10-06) [READ]

**Josh's brief (549 B):** treat each of four sites as a library whenever a similar element comes up in our UI: UI/GUI controls `smoothui.dev`; web animation `animmasterlib.dev`; site assets `componentry.dev/docs`; motion `motion.dev/ui`. Also: research "the crazy advancements of libraries, web code and skills/MCPs/context boosters", and mention of Higgsfield and Manus.

**The method (research companion), 7 steps:**
1. Identify the interaction and who owns state, layout, colour and rendering.
2. Research only the matching element; record official URL, checked date, stack, licence and access limits.
3. Compare existing implementation, native browser capability and an external component; choose the smallest maintainable.
4. Preserve site/content accent separation and capability-aware input (touch affordances, keyboard, reduced motion).
5. Apply state immediately; animations may retarget while running; no delayed clicks or stacked transitions.
6. Preview rapid interaction, theme switching, resize, scrolling and media handoffs; measure before/after on the same workload before claiming higher FPS.
7. Keep only concise reusable findings; refresh API/licence/browser facts when needed.

**Sources it names:** SmoothUI (animated React components, shadcn integration, agent REST docs, MIT per its repo); Animmaster (PRO catalogue, source quality and rights unverified); Componentry (grain gradients, dithering, cursor ripples, magnetic docks; closest aesthetic fit to our noise and reactive effects, benchmark GPU cost first); Motion UI (token-based motion presets, AI Kit, check catalogue entitlement); shadcn MCP; Context7 (version-specific docs, optional); Chrome scroll-driven animations and view transitions; Motion's performance guide (layout vs paint vs composite; transform/opacity cheap, glow/noise/filters/blend must be measured). Higgsfield and Manus: evaluate for a specific production need only.

**Judgement to carry into a plan:** "A catalog expands our options; it doesn't choose our taste." Preserve Magic Commons' experimental grain, strong hues, holographic shine, cursor effects and typography; better engineering should make them smoother, not replace them with generic defaults. First applications it suggests: one shared effect-input/scheduling layer with bounded work; semantic motion tokens (reduced-motion aware); explicit theme/palette ownership; interruptible docking and pane movement; static or bounded grain composited with profiled accents.

**The skill:** `~/.codex/skills/design-booster/SKILL.md` (+ `references/sources.md`, `agents/`), a Codex skill, invoked as `$design-booster`; it does not retrain or auto-update. It adds: never install MCPs, buy libraries or upload assets merely to study; Josh prefers Gemini for new SVG/icon art (give literal dimensions, strokes, states).

**Where the NACRE file uses it:** `NACRE.md` says the optional second planning pass researches the frontier internet "look up DESIGN BOOSTER.md". Standing law to pair with it: **subtract, don't add** (`feedback-simplify-dont-add`), and MIR already owns motion/pointer/proximity (`core/motion.js`, `pointer.js`, `proximity.js`), so most "boost" ideas land in the kit, not in λWAVES.

---

## 3. MIR 1.5 rulings and defaults that bear on λWAVES adopting 1.5

Sources: `MIR CLAUDE 1.5 PLAN 2026-10-01` (PLAN), `MIR CLAUDE 1.5.X INFORMATIONAL + LLM PLAN 2026-10-01` (INFO), `MIR CLAUDE 1.5 CONSOLIDATION FOR-JOSH 2026-10-06` (CONSOL; its foot holds Josh's 23 answers, dated 2026-10-07), `MIR CLAUDE 1.5 THE HAND FOR-JOSH 2026-10-06` (HAND), `MIR CLAUDE 1.5 FOR-JOSH 2026-10-07` (FJ; the file is named a day ahead; it is the BASINS-adoption note), `BASINS CLAUDE MIR 1.5 HARVEST PLAN 2026-10-02` (HARV), plus Josh's rulings as stored in auto-memory (MEM, with the vault session date). **[READ]**

State as of 10-07: kit `1.5.0-alpha.22/23`, branch `worktree-mir-1.5` (never `main`); λWAVES **frozen on 1.4.3 by Josh's word** (the adopt tool refuses 1.4→1.5 without `--line 1.5`). Josh 10-06: *"Let me know when MIR 1.5 as a whole is done so that we can begin adoption of 1.5 for lambdawaves and nebula"* (MEM big-four-universal). FJ lists "which app adopts next" as an open decision of his.

### 3.1 Standing law

| Ruling / default | Source | One line for λWAVES |
|---|---|---|
| Big four (AUTOMATA, NEBULA, BASINS, λWAVES): any non-engine change made in one goes into the kit for all four unless he says app-specific | MEM big-four-universal, 10-06 | A λWAVES UI need in 0.4.0 is kit work first, then adopt, then adapt `lab/` (repo CLAUDE.md says the same for modulation) |
| Only the engine (and its own content/colour system) is the app's: λWAVES' palette, field, register, solvers | MEM mir-scope-only-engine-is-app, 10-02; HARV | Everything else, bugs included, is MIR work |
| "Prefer BASINS", and if λWAVES already has a feature use its design; a default taken where the source app decides is a defect | MEM mir-transport-per-app, 10-01 | Where λWAVES has history, the "+" menu, keyboard window, modulation window, notebook, those designs are the kit's |
| Harvest, do not restyle; simplify, do not add; every step states what it deletes | PLAN §2 | A λWAVES adoption is judged by lines deleted from `rack.js`, `modwindow.js`, `skin.css` |
| Glass is Josh's: a step that changes what he sees is a ruling first | PLAN §2 law 9 | 0.4.0 look changes go to him as rulings |
| Port verb: "port the design system: reuse the tokens, the DOM structure, the nodes, the gestures and the CSS verbatim" (not "copy") | `λWAVES OFFICIAL YO` | Wording for any builder brief |
| MIR Focus (phones, iOS and Android): a later project, **λWAVES is the test app**, not started | MEM mir-focus, 10-06 | Note phone needs; do not build unasked |
| Which λWAVES is "main": 0.3.2 as on GitHub | PLAN ruling 9 | The base for a kit adoption diff |
| iPad laws proven on his device: touch-scroll fails inside a `pointer-events:none` scroller; Safari reloads on return from background; bottom 60 px is Safari's gesture band (use `100dvh`); trackpad reports `hover:hover` false (kit KBM layer fixes) | MEM webkit-ipad-laws; CONSOL/HAND | λWAVES' rack gutter and `#lab` sizing need the same audit |
| Butler may not ship as a live font in paid builds; use an open-licence face for live titles, Butler only as outlined logos | PLAN ruling 14, §11 | Matters to the stores programme; λWAVES uses Spinwerad (SIL OFL) and Roboto, check `LWTitle` |
| A λWAVES test fails from **2026-11-20**: `tests/wiring.test.mjs` dated allowlist of seven kit shell files never wired | PLAN §11 | Must be resolved or re-dated before then |

### 3.2 Look and material

| Ruling / default | Source | One line for λWAVES |
|---|---|---|
| **FROST** = Josh's recipe: ABOUT GLASS preset fired first; shadow 200 %; veil 0; bright 0; dark theme; white text; glass control faces; blur 11 px; saturation 130 %; tint 0; connected; corners 24 px; refractive; frost always. **30 BPM default**; "always basic transport bar as the main opener" (my reading, unconfirmed) | MEM mir-frost-defaults, 10-01 | **Conflict**: λWAVES first-run is light/refractive/ALWAYS, 22 px blur, 50 % VIVID (repo CLAUDE.md). Needs a ruling; stored choices win either way |
| Touch devices start at 20 px blur (BASINS) | HARV | λWAVES phone/tablet first run is frost OFF + tinted; reconcile |
| **Vanilla vs 'name'-spec**: a vanilla theme is a named set of built-in setting values (FROST glassmorphism, MORPH neumorphism); anything needing rules or art outside the settings is a 'name'-spec; the SKIN stepper lists vanilla themes and shows CUSTOM once a setting moves | MEM mir-vanilla-vs-spec, 10-01 | λWAVES gets themes by setting, no per-theme stylesheet |
| **SOLID** is a third card style (opacity 100 %, colour from HUE/TINT/BRIGHT); a window edge is a floating object: drop shadow bottom-right plus an additive SHINE upper-left; one LIGHT ANGLE parameter; all adjustable in settings | MEM mir-solid-card-and-light, 10-01 | Also answers INTENT O2 (relief follows the light angle). MORPH is a preset on SOLID |
| **TINTED can blur** (reverses INTENT rule 4): under FROST a tinted pane thins to .58 and blurs; BLUR 0 is "no blur" | MEM mir-rulings-2026-10-02 | λWAVES' phone first run (frost OFF, tinted) is the no-blur case of this setting |
| Rack keeps BASINS' animated drag and drop (card height animates, neighbours travel); the dragged **title bar** decides above or below | same | λWAVES rack motion changes to the kit's |
| **ON = a frost face with a lit accent light**, never an accent fill; **light from above** (pane shadows fall down); arc when cyclic or in its own colour (glass HUE becomes an arc), dial for a plain amount | PLAN rulings 1-3 ("all defaults", 10-01) | λWAVES draws ON as an accent fill and M/S as accent fills (census): both change |
| Look options live in the GUI window (MIR OPTIONS); the app's Settings keeps engine options only; QUALITY FULL/BALANCED/LIGHT/AUTO | PLAN ruling 7, §8.1 | λWAVES SETTINGS rows for look, glass, hints, blur, frame/axis chrome move; keep AUTO SCALE / governor as engine |
| One blur per window (chips and devices flat inside): **measure first, then show both looks** | PLAN ruling 15 | Frame-rate lever: BASINS pan runs about 30 fps with the rack shown, 60 hidden (CONSOL) |
| FROST says white text in both themes (BASINS fills the screen with colour) | CONSOL Q1 = Y | **Needs a λWAVES ruling**: its background is black or white, so ink polarity follows the theme today. Text polarity is its own setting (TEXT AUTO / LIGHT / DARK) |
| New users start on TEXT AUTO; windows animate open, close, minimise; GLASS row OFF/LITE/FULL retired; H keeps the picture at 0.75 resolution while modulation plays; WORK BARS cycle top, bottom, hidden | PLAN smaller rulings | Per-app check |

### 3.3 Control language (Josh 10-02; MEM mir-control-language; HARV; `docs/CONTROLS.md` in the kit)

- ARC = a colour quantity; KNOB = any ordinary parameter; SLIDER (lane slider) = a thing's one principal parameter; TOGGLE with a lamp; BUTTON for a one-off action, no lamp; control whose face shows state (play/pause, chosen segment) no lamp; SEGMENT for 2 to 4 visible choices; PAGE TURNER `‹ MODE ›` for an ordered list; HUE SWATCH (tap chooser, drag hue); CHIPS for a window's verbs; XY pad; CURVES; 3-D CAMERA; master GRADE; one icon library (75 glyphs); PLAY is the icon everywhere.
- λWAVES census hits (`CONTROLS CENSUS ACROSS THE SEVEN APPS`, 1.2): LOOK HUE and ACCENT A/B are solid dials (become arcs); FRAME/AXIS are a cycling `sw` (become `seg`); transport PLAY is a text glyph with accent fill (becomes the icon); M/S lane buttons use accent fills and S is accent B (become lamp switches); palette select with `‹ ›` (becomes the stepper); stop colour is a native colour input (hue swatch); spectrum |c|² fader (lane slider); rotors and ROTATE jog wheels stay (kit `onDelta`); the sphere/plane model stays (kit `planeModel`, "used by λWAVES"); LOOK's 6 knobs are one of the seven "master grade" copies, SOFT/GAMMA are curves candidates (each as an option, not forced); CAMERA TURNTABLE/FREE, FRICTION, DRAG GAIN, FLING, FOV is one of the seven camera copies.

### 3.4 Hand law (Josh 10-06; MEM mir-hand-law; HAND)

Positions never move (a control's place never depends on state); keybinds satisfying, shown beside the action, rebindable through the one key table, **every window has a key**; pages are tabs under a fixed head (at most 4 as a SEGMENT, more as a chip row); **ABOUT is a circled (i)**, never a page in a cycle; tool bars never word-wrap (a ⋯ button holds the rest); small windows (ABOUT, GUI) close with a plain × and the whole title bar drags; a resize corner's glyph points where it resizes; **a power control is only its ⏻ icon** (10-07: "anything but a button"). Directly answers the `NEXT UPDATE` request that the About and Notebook buttons not shift under the cursor.
Still open in HAND (10 calls): modulation window sizing to its devices vs fixed width; timeline bar beside the transport; keys for TIMELINE/PATTERN/HISTORY/RENDER/OPTIONS/KEYBOARD; arrows on a handle; iPad chords for Numpad × ÷ and Insert; Space on a focused ÷2/×2/×4; Escape closing MODULATION/TIMELINE; Mod+Y; FOLDERS floating wells; the old hidden BASINS stack. Also open: whether "no outlines" covers the card `.sw` switches.

### 3.5 One clock / transport / defaults

- **One clock: modulation gets a POWER button, never a play button; the timeline owns the one true play.** Josh 10-01 night: *"Lambdawave's two clock problem will be solved that way in a 1.5 upgrade."* Where there is no timeline yet, the app's main clock is the one play. (MEM mir-one-clock-mod-power.) λWAVES today has four clocks, LINKED/SEPARATE, and a MOD ▶ arm on its transport (REPORT.md ~2254, 1923) and no timeline; the plan must say what the one play is in 0.4.0.
- **Transports stay per app**; the kit supplies parts (play, MOD lamp, BPM pill, TAP, opener latches, dodge), the layout is each app's. *"Lambdawaves should have its same Transport layout but upgraded to be customizable by 1.5's crazy CSS settings."* (MEM mir-transport-per-app.)
- BPM default 30; the kit transport and the modulation window are λWAVES' own controller "taken whole" (EARTH runway note).

### 3.6 INFORMATIONAL, pages, notebook (INFO; PLAN §7 and §8.5; MEM mir-informational-mentality)

- "Yes to all with defaults" (10-01): all eight INFO rulings stand.
- **Pages are plain `.md`; a tutorial is whatever the user writes. MIR ships no tutorial system.** Plan it iteratively; more ideas to come.
- **Each project carries its own pages** (notebook tabs); the **greeting** is the first page and replaces the separate title card; the user's personal pages sit on his own **shelf** (λWAVES' mini file system becomes the notebook's own list: folders as path prefixes, recent five, SAVE / SAVE AS, export/import, with rename and delete-confirm added). FOLDERS (projects) and the notes list never read each other. A saved project's old notebook title/subtitle/text becomes its greeting. Josh on the title card design: *"Im gonna need to work on title cards a bit more"*, so the §8.5 sketch is not final. **Conflict**: repo CLAUDE.md says "An open never closes the notebook; it opens it only for non-blank text"; INFO changes this to "opening a project changes the notebook's tabs; the shelf never changes."
- Labels are Obsidian callouts `> [!mir|anchor] Title`; anchors: a feature the app names, a place in app coordinates, a control. Line grammar only flat, 45°, vertical; **diagonal-first names a feature, flat-first is a note** (both, each for its job). Text keeps away from the cursor but "reaching is not fleeing"; hold-still; hold Space or long-press freezes. Look: no tight shadow or outline, "a soft darkness underneath"; floaty springs; target feel *"a lovely animated, interactive encyclopedia"*. Type: TITLE Butler Bold (Playfair Display in paid builds), `#` Playfair, body Spectral, links Alegreya SC (the Typomagical theme), KaTeX for maths; Josh released the three Google Fonts downloads only. Ink: AUTO first, INVERT and THRESHOLD later (unproven over WebGPU).
- For λWAVES, INFO §2.1: "λWAVES names the orbital on screen ($5f$, $1b_1$)"; its 0.3.3 copy-as-LaTeX is "the first" window-to-markdown copy; INFO §2.11 says INFORMATIONAL replaces the title card, ⓘ panels, EARTH legends and SOLEIL coach line.
- LLM side (INFO §3, not λWAVES-critical): `mir-builder` skill, starter, `LLM.md`, one envelope format (settings/skin/project/page/**spec**), PNGs that carry a project, QR for small things, `describe()` / `dump()`; publishing the kit "not yet" (GPL-3.0 binds distributors; MPL-2.0 alternative).

### 3.7 Keys, GUI, languages, skins

- Undo/redo are rows of the key table (rebindable, a text field keeps its own); every window is a bindable row; no key text typed by hand (so ⌘ reads right). Kit keyboard window "follows λWAVES' design exactly" (PLAN §8.4); **λWAVES' `shortcuts.js` law** (reject overlapping chords and reserved keys, unbind another action only after an explicit steal) must survive the move to the kit's table.
- GUI menu entry: MIR OPTIONS (three fixed tabs LOOK · LIGHT · WINDOWS) and MIR ABOUT (circled ⓘ), both closing with ×. LANGUAGE menu: ten packs (zh-Hans, hi, es, ar, fr, bn, pt-BR, id, ru, plus ja), first scope chrome/labels/hints; packs marked unreviewed. Pointer glow and parallax: on for desktop at FULL, off on touch.
- Rack: "+" with SHIFT-queue and ☆ layouts is **λWAVES' design** (the kit's rack copies it "byte for byte"); lazy windows (a window registered by name, built on first open) come from EARTH.

### 3.8 Josh's answers to the 23 calls (foot of CONSOL, 2026-10-07)

1 Y (FROST white text also in the light theme) · 2 Y (tinted panes without the 160° highlight) · 3 Y (notebook without BASINS' white veil in light) · 4 keep current (RENDER / CAPTURE IMAGE raised face) · 5 Y (accent dials 3.8 px ring) · 6 **the door's diamond becomes MIR's official logo, colour changing smoothly when the palette cycles** · 7 Y (+ ADD keeps raised relief) · 8 Y? (outlined tool icons) · 9 "your call": WALL / 60 Hz stay tiles · 10 **N: OPEN ZIP asks "save this first?"** · 11 Y (COPY DUMP toasts COPIED / FAILED) · 12 **the photosensitivity notice returns to BASINS' original design** (font, text, spacing, button dimensions) · 13 "starter app?" (the kit's own sample app, kept) · 14 Y (FILES) · 15 Y? (HISTORY in the kit's look) · 16 **N: hue swatch loses the "Shift: finer" hint and accent focus ring** · 17 Y (a cancelled colour drag reverts) · 18 Y (drawn glyphs for ‹ ›, pager, ★) · 19 Y (the kit's own select and number controls) · 20 **one double-tap law: 300 ms** · 21 Y (transport reorder on the shared engine) · 22 Y (undo/redo rebindable) · 23 **Y: the rack's layout and the tempo become project parts**. Plus same morning: coloured glow off on the colour swatches; power control only its icon; an iPad trackpad behaves as the desktop.
For λWAVES: #6 is the diamond it invented (loading wheel) becoming the official logo; #12 matches the λWAVES warning-orbital notice; #20/#22 touch `stage-gestures.js` and `keymap.js`; #23 is already λWAVES' WORKSPACE scope (the arrangement travels with a project and the device remembers it), so adoption should be a no-op there, but *tempo as a project part* is new, check `bpm` against `docs/STATE-SCOPES.md`.

### 3.9 Not rulings yet (do not plan as decided)

TEXT polarity default for λWAVES; which play is "the one" without a timeline; whether `LW Title`/Spinwerad stays as the live display face; the three small questions in HARV (thin RANGE bar on routed knobs, LIGHT/DARK name swap, touch guard on colours); the kit's DOWNLOAD SETTINGS gap (it writes the look, the app's engine preferences share no key; the kit must let an app add keys).

---

## 4. What BASINS gave the kit, against λWAVES' app-local code

Sources: `BASINS CLAUDE MIR 1.5 HARVEST PLAN 2026-10-02` (the 23-row table, read in full), `BASINS MIR 1.5 INVENTORY 2026-10-02/` (three notes: FEATURES AGAINST THE KIT (235 rows; I read the first 34 rows and every λWAVES mention), INTERFACE ASKS (133 rows; λWAVES mentions read), CONTROLS CENSUS (λWAVES section and the cross-app tables read)). λWAVES file names are **[CHECKED]** against `lab/` in this tree; "check" means I could not confirm from the notes or a grep.

| # | BASINS gave the kit | λWAVES app-local equivalent today | Verdict |
|---|---|---|---|
| 1 | Timeline window, view, editor (the kit's 2nd plugin) | none (a timeline is on Josh's "OFFICIAL YO" future list) | kit gift |
| 2 | Live project session: autosave, RESUME, prefs vs project, accents carried | `project-storage.js`, `project-import.js`, `new-project.lambdawaves.json`, `history.js`, `docs/STATE-SCOPES.md` (three scopes). BASINS cites λWAVES' scope law as the model (ask #120). No autosave/RESUME found | partly ours; check RESUME |
| 3 | Scene input guard (a window's rect is UI space; gap wheel to the UI scroller; tap in a gap starts nothing) | `stage-gestures.js` (pointer ownership), `rack.js` (`refreshOcclusion`, hit-test gates) | check the gap-wheel / gap-tap part |
| 4 | PATTERN window / sequencer | none | kit gift |
| 5 | Microphone capture for AUDIO | `audio.js` (BASINS captured λWAVES' `audio.js`, ask #19) | origin is λWAVES |
| 6 | Audio assets, beat-locked playback, SAVE AS ZIP / OPEN ZIP | none for audio assets or a project ZIP; `render-exact.js` has `zipStored` (used by EXPORT FRAMES and the NPZ) | kit gift (project ZIP) |
| 7 | Recorder: deterministic frames, MP4 or PNG, preflight, recovery | `capture.js` (1,097 lines), `render-exact.js` (1,233) | own; 1.5 would replace |
| 8 | Transport leftovers: tempo-panel macro rail, inline BPM field, TRANSPORT BAR on/off, door's palette cycle | transport in `rack.js`, `native-ui.js` (HOLD/stutter), `modwindow.js` tempo bar; the diamond cycles the palette (busy mark, `busy-mark.js`) | own layout stays (ruling) |
| 9 | Colour controls: arc knob, hue swatch, stepper, lane ink, any-modifier fine gear | `accent-wheel.js`, `paletteview.js` (156 lines, native colour input), `spectrum.js` lanes; hue knobs are solid dials | adopt kit's |
| 10 | Workspace stack and switch | none (no timeline) | n/a |
| 11 | Adaptive ink (TEXT AUTO sampler) | none found; ink is theme-based (`tests/ink.test.mjs` tests a colour reader) | kit gift, but see TEXT polarity ruling |
| 12 | HISTORY window and gesture naming | `history.js` + the 0.3.1 HISTORY card: **the kit's ring is λWAVES' lifted as it stands** (PLAN §7 1.5.2) | origin is λWAVES |
| 13 | Title screen / opener; photosensitivity warning before it | warning notice (`main.js`, `index.html`, `rack.js`, Gemini-made orbital with cutout "!"); no opener | partly |
| 14 | Error banner; loading veil to first frame; reload offer on GPU lost | `main.js` banner, `gpu-boot.js` (wave 120: a lost device says so), `rack.js` | own; check the reload offer |
| 15 | Device tier (QUALITY AUTO), touch-tablet class, per-device blur | `first-run.js`, `frame-budget.js`, `frame-coalescer.js`, `frame-settle.js`, AUTO SCALE + governor in `rack.js` (waves 125-128) | own, mature |
| 16 | Rack leftovers: seated scrollbar, tablet clamp, retired ids, RESET LAYOUT, copy a window's readouts | `rack.js` (`isTablet`, ⧉ copy in window head), `rack-menus.js` (+ and ☆) | mostly ours; check RESET LAYOUT |
| 17 | STATUS TAGS, FORGET, accent BRIGHTNESS rows | `badges.js` (STATUS TAGS), `accent-wheel.js` (VIVID); FORGET check | partly |
| 18 | Wake lock while playing or recording | **none** (grep for `wakeLock` empty) | kit gift λWAVES lacks |
| 19 | Modulation leftovers: RANGE door, readout on device curves, docked wheel, factory presets as option, project save becomes a CAPS preset, automation grid | `modwindow.js` (3,110 lines) is the controller **the kit took whole**; `mod.js` carries λWAVES' factory folder | origin is λWAVES |
| 20 | Small shell verbs: recent projects in FILE, Purge, "coming" rows, COPY DUMP, full screen, PWA template | `menubar.js`, `rack-menus.js`, `project-storage.js` (recent), full screen and clipboard in `rack.js`, copy dump (ABOUT menu), `manifest.webmanifest`, `sw.js`, `sw-client.js` | mostly ours |
| 21 | CAMERA and CONTROLS as generic windows | CAMERA in `rack.js` with `camera-law.js` (TURNTABLE/FREE, FRICTION, DRAG GAIN, FLING; one quaternion, `rotor4.js`) | ours; the kit window is the cross-app one |
| 22 | In-canvas WebGPU glass | held (needs iPad measurement) | n/a |
| 23 | Developer seams: WebKit check, hit-probe, HTTPS dev server | `tools/perf/device-report.js`, `serve-lan.py`, WebDriver Firefox gate in `tests/` | ours; the kit adds `tools/probe.mjs` |

**Kit pieces that originated in λWAVES** (so adoption deletes our copies, it does not add): the history ring and three-scope law; the "+" menu with SHIFT-queue, ☆ layouts, edge peek and transport dodge; the keyboard window design (`keymap.js`, 933 lines); the notebook (the kit's copy is a 09-16 snapshot of an older λWAVES that lacks W129's "save the size you were given" and the 32 ms drag-timer fallback, `NOTES FROM BASINS 09-26` §5); the modulation window (`modwindow.js`); the nine-square diamond as loading mark; reduced motion as a policy; the sphere/plane model; the palette editor (`paletteview.js`) which the census lists as the ramp editor with seam warning.

**Kit things λWAVES would gain outright**: timeline, PATTERN, wake lock, project ZIP and audio assets, the opener, ten-language LANGUAGE menu, MIR OPTIONS (GUI), vanilla themes FROST/MORPH and SOLID, pointer glow and parallax, the KBM layer (iPad trackpad), INFORMATIONAL, the envelope / QR / LLM spec, and the cross-app windows LANES, XY (the "dot matrix" lattice Josh wants for the camera), CURVES, GRADE, RAMP.

**Measured costs to remember** (CONSOL, BASINS on a real GPU): adoption cut main-thread work at rest from 3.62 to 0.05 ms/s and elements/CSS rules by 17 % / 43 %, but JS downloaded grew by 784 KB (+67 requests; lazy window loading deferred) and "frames over 33 ms while playing" stayed above the pre-adoption count (82 vs 65). The pan frame rate halves (about 30 vs 60) with the rack shown. These are alpha.17/18 numbers on one machine, not λWAVES numbers.

---

## 5. Older λWAVES notes: asks not yet built

Notes: `⟡ λWAVES NEXT UPDATE ⟡` (newest, 359 B), `λWAVES FINAL STRETCH`, `λWAVES FINAL EDITS` (including "FINAL CONT." and "FINAL III"), `λWAVES OFFICIAL YO`, `MOLECULAR-WAVES-PLAN` (Astra), `FOR-JOSH-MOLECULAR-WAVES-JUDGMENT-2026-09-18` (Fable). Judged against `README.md` (0.3.2 alpha), `CHANGELOG.md` (ends at v0.3.2-alpha), `REPORT.md` (3,357 lines, waves up to 135) and `lab/`. CHANGELOG is tag-based, so 0.3.3 (exports) is not in it; REPORT/MEMORY say 0.3.3 is built on `release-0.3.3`, not live. My checks are by grep and reading code, not by running the app; "built" means present in code and cited in REPORT, not re-tested by me. **[CHECKED]**

### 5.1 Open or unbuilt

| Ask (source) | Status |
|---|---|
| NEXT UPDATE bug: at project start or open, **Space does not play both clocks in LINKED mode**; "check linked is working during saves and new defaults" | Likely open. REPORT ~3013 says linked time "needed nothing" at NEW, but this note is newer (after 0.3.1). Needs a repro: open a project, press Space |
| NEXT UPDATE request: **About and Notebook window buttons fixed at the top-right corner** so they do not shift under the cursor | Likely open (no trace in REPORT). Equivalent to the MIR hand law and solved by the kit's ABOUT/OPTIONS windows |
| FINAL CONT.: **Serum/Massive "Matrix"** fills the screen from the macro section; study routing so VST users adapt | Parked by Josh 2026-09-08 (`docs/ui/ARCHIVED-MACRO-TOOLS.md`): the matrix launcher and macro **side-drag to far left/right** are hidden and disabled, code kept (`sideGrip`, `setMacroSide`, `matrixButton`, `renderMatrix`); "do not re-enable without a new user request". Research exists (`research/SERUM-MASSIVE-MATRIX-2026-09-08.md`). The kit's alpha.18 deleted its own hidden matrix dialog as unused |
| FINAL CONT.: **more shader options in DRAW**: truly particle-dust, advanced blend modes, caustics, "shader plugins? Houdini?" ("implement what's possible, not dreams") | Partly: styles `cloud, solid, grain, signed, bands, dust, glass, additive` exist. No shader-plugin mechanism |
| OFFICIAL YO: **knobs open quick settings** (hue knob opens exposure and one more mini knob where clear) | Not built (the modwindow's popover is unrelated) |
| OFFICIAL YO / FINAL STRETCH: **official timeline** for anything that animates | Not built; the kit's TIMELINE plugin would provide it on adoption |
| OFFICIAL YO: **3-D rotation mini-maps with ijk / ±1 axes; Shift/Ctrl drag does an alternate quaternion multiplication** | Not built. (CMY axes are built.) |
| OFFICIAL YO: MIR logo = a CSM prime-field square rotated 45°, loading = palette 2-wave frame lock with an increasing prime per frame | Future; call 6 (10-07) says the door's diamond becomes MIR's official logo cycling the palette |
| FINAL EDITS vs FINAL CONT.: logo **must not spin and should enlarge slightly on hover** vs **spin one cycle on mouse-over, reverse on mouse-away, indent on click** | Contradictory asks; the later is FINAL CONT. REPORT 1512 records the wheel and busy mark; check which shipped. Superseded in practice by call 6 |
| FINAL EDITS: a **"2x6" layout is the best place to use the math layout** | Ambiguous; I could not tie it to a window. Ask Josh |
| FINAL STRETCH: math fonts/LaTeX symbols across math-related UI; "delightful" subtle animations; "even the bow and arrow gets a proper serif font" | Partly: the STIX Two Math face sets mathematics ("mathematics only, never chrome", REPORT 2023). Wholesale math-UI revision and the arrow glyph: check |
| LAMBDAWAVES CACHING (0.4.0): ladder names (`1a1`, `1b2`) on the Molecule knob; STO-3G vs 6-31+G*; metadata | Not built; this is plan N1 (§6) |
| 0.4.0 asks (cache note): merge Cloud's atom-and-formula bottom text from the live GitHub version; camera pan for off-centre large zoom; XY dot-matrix camera control; audit and upgrade CALCULUS, DYNAMICS, METERS, WIGNER, RADIATION, SHADOW; rename SLICE to PLANE; copy any window as LaTeX markdown | Open: the 0.4.0 plan's content (`NACRE.md`) |
| MOLECULAR-WAVES (Astra, Fable): the "compiler for hard molecular requests": RI-J density fitting; Sturmian/NAO "bulb" rung; research questions Q24-Q26 | Not built |
| MOLECULAR-WAVES: vibrations (the Taylor model that does belong); open shells; character matching of TDA and RPA roots (benzene roots 2 to 4 cross); iPad frame measurement deciding any molecular renderer work; long-trace (t ≥ 200 a.u.) replay check | Open items in the judgment note §8; the molecular stages 0 to 6 (funnel, fast prep, register, TD-CIS drive, FLOW) appear built (I only confirmed that the files and tests exist; REPORT line 2539 once listed stages 5 and 6 as "not built", later lines show FLOW): `molecular-register.js`, `molecular-flow.js`, `tests/molecular-drive.test.mjs`, `molecular-flow.test.mjs` exist |
| FINAL STRETCH ABOUT edits: licence choice (he defaulted to Apache 2.0) | Decided otherwise: **GPL-3.0-only** (README, `LICENSE`) |

### 5.2 Built (spot-checked), so a plan need not re-ask

Rename SLAP/BOW to IMPULSE / IMPULSE VECTOR (REPORT 1614, 19 strings; the internal group id `BOW` remains); AXIS cycles box, corner, off with a corner mini-axis that swaps sides on double-tap (`rack.js` 746-769, `field.js` pipelines); FRAME cycles box, lattice, dots, off; axis ink CMY (dark) / RGB (light); light-mode frame near black (`FRAME_INK.light`); favourite layouts ☆ (four slots, wave 54); ordered Bayer dither after gamma (wave 54); 33 palette presets grouped by stop count (`mir/palette.js`); backgrounding optimisation (wave 84/B84); hidden UI is the fastest state (LA3); the busy mark at the pointer, nine squares touching, palette-cycled (wave 48); FREE camera (one quaternion) beside TURNTABLE with FRICTION; double-click resets camera; the "!" warning cutout (REPORT 1618); notebook/about grip for touch resizing (REPORT 1515); one rack, left, on phones; STAGE and GAMMA are modulation targets (`rack.js` 2408-2409); macro minimise to the narrow rail; native playhead's rate knob in the plugin; HOLD stutter buttons (`modwindow.js` 494); phone first run frost OFF tinted; three-scope law, the empty project, the true history (0.3.1); the offer (0.3.2); exports GLB/OBJ/STL/NPZ/cube and copy-as-LaTeX (0.3.3, `release-0.3.3`).

---

## 6. The molecular-orbital cache plan: Sol's, Fable's, and the probe

Sol (root checkout `research/molecular-orbitals-2026-09-29/`: PLAN 18.8 KB, CACHE-BUDGET 9.5 KB, DISTRIBUTION 7.6 KB, written against `91c90bc`) and Fable (`research/molecular-orbitals-2026-10-01/NAMES-AND-CACHE-PLAN.md`, PROBE.md, names-probe.mjs/.json). **[READ]**

1. **Sol, shape**: one collection shared by MOLECULES and MO-REGISTRY; a dataset adapter with three providers (live AO, precomputed native AO, precomputed grid); capabilities per dataset (never inherit "Koopmans" or RHF text onto a DFT set; keep `def2-SV(P)`'s parentheses); dataset version and hash saved in registers, projects and links.
2. **Sol, delivery**: a bundled booster for the 52 enabled STO-3G presets first (provisional 5-20 MB; coefficients alone are 0.126 MB, full CIS eigenvectors 3.208 MB); optional collections; a roughly 20 GB full library via Google Drive manual import, Cloudflare R2 (about $0.15/month storage) later behind one pack contract; separate namespace from the `lw-lab-` precache; hash-verified, atomic, resumable.
3. **Sol, grids**: signed Float32 grids; capacity 476 / 141 / 59 datasets in 4.5 GB at 64³ / 96³ / 128³ with 8 orbitals + density; the only road past `MAX_MOL_AO = 64` for C60 (300 AO; a dense ERI tensor would be 60.35 GiB) and DMT (86 AO); PySCF as exporter; do not claim a match to the Reddit videos.
4. **Sol, order**: (1) native benzene booster proof (no SCF on open), (2) the 52-preset starter, (3) pack import, (4) grid proof then C60/DMT, (5) library and symmetry labels, (6) discovery (borazine, 2C-B, carborane).
5. **Fable, judgement**: Sol's delivery stands but moved under it: 0.3.1 made a dataset choice a PROJECT key and a history row; 0.3.2 refetches the whole 203-file, 5.6 MB build on every deploy, so a 5-20 MB starter inside `lab/` would be re-downloaded each time; 0.3.3 already writes the cube and NPZ the grid proof needs (`export3d.js`). It also has **no names**.
6. **The thesis: the name is the key.** The counted symmetry label `(group, irrep, count)` is the one orbital identity that survives a change of basis, method or dataset; store the exact reference `{dataset hash, index}` and the portable one. So the order inverts: **N1 names, N2 booster proof (benzene record opens with no SCF, names inside), N3 the 52-record starter**, then Sol's 3 to 6.
7. **Names as a service**: `lab/names.js` for atoms and molecules in four forms (Unicode, ASCII, LaTeX, speech), replacing four formatters; computed in the worker inside `ensureSolve` (≤ 10 ms for benzene; the reply lacks S and atom indices today); declare-and-verify point groups (13 groups cover the library), no detector; a name shows only when its residual is below tolerance, never asserts an ordering, is all-or-nothing per record, and carries its frame (C2v/D2h Mulliken 1955 with the alias stored).
8. **The cache, further**: a fourth storage class **LIBRARY** (device content, content-addressed, never in a project, link or history row; a project holds a reference); the starter in its own `lw-data-` cache, fetched per molecule and kept across builds; the generator is the app (`tools/orbital-library.mjs --check`, the `new-project.mjs` pattern); names in GLB names, cube comment, NPZ `meta.json`, copy-as-LaTeX.
9. **Probe** (`names-probe.mjs`, live RHF/STO-3G in node, 10 molecules, 8 s): every level exactly one irrep (worst residual 9.8e-15) and **every textbook configuration matched** (H2O `(1a1)²(2a1)²(1b2)²(3a1)²(1b1)²`, NH3, CH4, N2 `...(1πu)⁴(3σg)²`, CO HOMO `5σ`, HF `1π`, CO2 `1πg`, C2H4 `1b3u` (π), H2CO `2b2`, C6H6 HOMO `1e1g`, LUMO `1e2u`); labelling 0.4 to 10 ms; a names record is 155 to 618 bytes minimal (up to 12.7 kB with diagnostics).
10. **Probe controls**: a water with one H moved 0.02 Å is refused; a symmetry-broken second N2 solution is refused (residual 0.5); a too-wide tolerance reports `σg + πu`, not a label; random rotations inside degenerate clusters change no label; the axis-convention aliases equalled a real recomputation in 5 of 5.
11. **Probe findings**: (a) a defect in the app today: a degenerate HOMO reads `HOMO−2, HOMO−1, HOMO` (CH4, HF, CO2, C6H6) because frontier names go by index (`orbitalsview.js` `label(k)`, `chemview.js` `orbFmt`); (b) N2's HOMO is `3σg` in STO-3G and `1πu` in 6-31+G* (3σg −0.6349 below 1πu −0.6169): the thesis measured; (c) tolerance window: widest intra-level spread 3.3e-13 Eh (GeH4), narrowest gap between levels 1.6e-7 (Br2), so the app's 1e-8 is only 16× above the narrow end; 2e-10 is safer; (d) furan and pyridine are C2v only to about 1e-3 bohr (built by walking a polygon): the record states a tolerance (1e-2 bohr) or the geometries are rebuilt; (e) **benzene solved in 1.0 s in node against the library's predicted 9.6 s**: the cost model and therefore the live CAP rule are stale; measure on the iPad before sizing the starter.
12. **Not established**: no independent program (PySCF, Psi4) produced the labels; Cartesian d shells (GeH4, AsH3, H2Se, HBr, Br2 and every 6-31+G* set) and the D3h, D3d, C2h, C2, Cs tables are unbuilt; 42 library molecules unrun; nothing ran in a browser or the worker. Rulings R1 to R8 (primary name order, Mulliken frame, all-electron counting, component tags, names-before-cache, own data cache, textbook names scope, complex `2p₋₁` default) await Josh; he has not said "build N1".

**Note for sizing (my arithmetic [PROPOSAL]):** dense ERI is nAO⁴ × 8 B: 64 AO = 134 MB, 87 AO = 458 MB, 100 AO = 800 MB. A naive scale of the measured 1.0 s at 36 AO by nAO⁴ gives about 10 s at 64 AO and 34 s at 87 AO. That is an extrapolation, not a measurement, but it says the amino acids above about 40 AO are a precomputed-record job, not a live solve, and that the live CAP must be re-derived from fresh timings.

---

## 7. The video, and candidate library sections

### 7.1 What was retrievable about `https://www.youtube.com/watch?v=HZAmbbTcQ3M` [CHECKED]

- **oEmbed** (`youtube.com/oembed`): title **"Your Operating System | Eukaryotic Transcription"**; author **Clockwork** (`youtube.com/@Clockworkbio`).
- **Page text (fetched with curl)**: published 2025-02-13; length 2699 s (about 45 min). The description (verbatim in substance) says: free 30-day Brilliant trial sponsor note; *"How does your DNA actually become who you are? Let's go on the incredible journey it takes to transcribe your DNA into mRNA"*; Patreon and newsletter links; *"Rendered using @BradyJohnston's open-source Molecular Nodes Add-on for Blender"*; a recommendation of lectures by theCrux on transcription; an empty "Primary Sources Cited" heading.
- **Chapter titles** (page metadata): Introduction to DNA and RNA · The central dogma process · Mechanism of transcription · Transcription initiation and pause · Elongation phase · Transcription termination · Introduction to splicing · Mechanism of the spliceosome · The importance of complexity. (Josh asked for "anything small ... especially towards the end": by title the last chapters are splicing and the spliceosome.)
- **Molecules named in the description: none** beyond DNA and mRNA as words. The page's embedded question list also names RNA polymerase II, transcription factors, the pre-initiation complex, a C-terminal-domain segment and a kinase, but those are headings, not a molecule list.
- **Not retrievable and not claimed**: anything about what the video shows or says. I did not obtain a transcript. The macromolecules by title (RNA Pol II, spliceosome, DNA) are far beyond any AO budget; only their building blocks are in reach (below).

### 7.2 Biology section within a 64-AO STO-3G budget (renderer ceiling `MAX_MOL_AO = 64`) and a roughly 100-AO showcase budget (Sol's DMT = 86)

Counts follow the app's convention (H 1; C, N, O 5; S 9). The library already has urea (24), glycine (30), furan (29), pyridine (35), HCOOH (17), CH3OH (14), benzene (36). Gas-phase neutral canonical forms (a zwitterion is not a stable gas-phase RHF solution); one pinned conformer each ("do not go for too many variations").

| Amino acid | Formula | STO-3G AO | | Amino acid | Formula | STO-3G AO |
|---|---|---:|---|---|---|---:|
| Glycine | C2H5NO2 | 30 | | Asparagine | C4H8N2O3 | 53 |
| Alanine | C3H7NO2 | 37 | | Leucine | C6H13NO2 | 58 |
| Serine | C3H7NO3 | 42 | | Isoleucine | C6H13NO2 | 58 |
| Cysteine | C3H7NO2S | 46 | | Glutamic acid | C5H9NO4 | 59 |
| Proline | C5H9NO2 | 49 | | Glutamine | C5H10N2O3 | 60 |
| Threonine | C4H9NO3 | 49 | | Methionine | C5H11NO2S | 60 |
| Valine | C5H11NO2 | 51 | | Lysine | C6H14N2O2 | 64 |
| Aspartic acid | C4H7NO4 | 52 | | Histidine | C6H9N3O2 | 64 |
| Phenylalanine | C9H11NO2 | **71** | | Tyrosine | C9H11NO3 | **76** |
| Arginine | C6H14N4O2 | **74** | | Tryptophan | C11H12N2O2 | **87** |

Sixteen are at most 64 (Lys and His exactly 64); four exceed the renderer and need Sol's grid provider; all twenty are under 100. All are far past the live-solve cost cap (benzene, 36 AO), so they are LIBRARY records.

Small biology molecules and chains: **glycine dipeptide (Gly-Gly) C4H7N3O3 = 57**; urea 24 (in library); formamide CH3NO 18; acetic acid C2H4O2 24; ethanol C2H6O 21; acetamide 25; N-methylacetamide (the peptide-bond model) 32; lactic acid 36; glycerol 38; imidazole 29; pyrrole 30; indole 52; phosphoric acid H3PO4 32 (P = 9); 2-deoxyribose C5H10O4 55; ribose C5H10O5 60; glucose 72; dopamine 66; serotonin 77; caffeine 80; DMT 86.

**Nucleobases, for the record** (the video is about DNA and RNA): adenine C5H5N5 **55**; guanine C5H5N5O **60**; cytosine C4H5N3O **45**; thymine C5H6N2O2 **51**; uracil C4H4N2O2 **44** (all five fit the 64-AO renderer). Watson-Crick pairs: A·T 106, G·C 105 (just over about 100), A·U 99. Nucleosides and nucleotides (adenosine 108, AMP and up) are over budget.

### 7.3 Crystal-lattice section: finite clusters only (the molecular RHF solver has no Bloch / k-point path) [PROPOSAL]

STO-3G counts; closed-shell neutral unless noted.

| Cluster | AO | | Cluster | AO |
|---|---:|---|---|---:|
| LiH cube Li4H4 | 24 | | Cubane C8H8 | 48 |
| LiF Li2F2 / Li4F4 (cube) / (LiF)6 | 20 / 40 / 60 | | Neopentane C(CH3)4 | 37 |
| MgO Mg2O2 / Mg4O4 (cube) | 28 / 56 | | Adamantane C10H16 (diamond cage) | 66 |
| NaCl Na2Cl2 / Na4Cl4 (cube) | 36 / 72 | | Diamantane C14H20 | 90 |
| KBr, K4Br4 (K = 13, Br = 19) | 32 / 128 | | Naphthalene / pyrene (graphene fragments) | 58 / 90 |
| Ice Ih hexamer (H2O)6 / (H2O)8 cube / (H2O)12 | 42 / 56 / 84 | | Coronene C24H12 (over budget) | 132 |
| Si5H12 (silicon cage) / Si10H16 | 57 / 106 | | B12H12²⁻ icosahedron (charge −2) | 72 |
| Li4, Na4, Al4 metal clusters (RHF is doubtful for metals) | 20 / 36 / 36 | | C20H20 dodecahedrane / **C60** (the milestone) | 120 / 300 |

Under 64 AO: LiH, LiF, MgO, Na2Cl2, ice (H2O)6/8, cubane, neopentane, Si5H12, naphthalene (58). C60 requires the grid provider and a precomputed record (300 AO).

### 7.4 Heavy-atom section [PROPOSAL]

Function counts per atom in the app's convention (Cartesian d, six functions): H, He 1 · Li-Ne 5 · Na-Ar 9 · K-Ca 13 · Sc-Kr **19** (1s 2sp 3sp 4sp 3d). Verified from the library's own counts: Br2 = 38, HBr = 20, H2Se = 21, AsH3 = 22, GeH4 = 23, NaCl = 18, Cl2 = 18, CuH = 20 and ZnH2 = 21 (both **disabled** by the scientific checks). The vendored record stops at **Kr (`MAX_Z = 36`)**: iodine, xenon, gold and heavier need new basis data (and an ECP or relativistic treatment), which is a research item, not a library entry.

Candidates (closed shell, STO-3G AO): Kr atom 19 · KrF2 29 · SeO2 29 · KBr 32 · BrF3 34 · ZnCl2 37 (d10) · TiF4 39 · MnO4⁻ 39 (d0, charge −1) · AsCl3 46 · GaCl3 46 · ScCl3 46 · SeF6 49 · GeCl4 55 · TiCl4 55 (d0) · Ni(CO)4 59 (d10) · Fe(CO)5 69 · ferrocene 79 · Cr(CO)6 79. Treat every d-block entry as "try it and let the stability probe decide": CuH and ZnH2 already failed. Existing library entries to keep: Br2, GeH4, AsH3, H2Se, HBr.

---

## Appendix: what I read, and what I did not

Read in full: FABLE'S ZOETROPE (first 300 of its lines, which include the abstract, theorems A to L, the pole lattice, open problems and "what this says to the instrument", and the start of "DNA of the SAVES"); `zoetrope-interview.md`; the opening of `JOSH_&_SOL_ZOETROPE.md`; both ZOETROPE synthesis READMEs; `DESIGN BOOSTER` (both) and the booster SKILL.md; `MIR CLAUDE 1.5 PLAN`; `MIR CLAUDE 1.5.X INFORMATIONAL + LLM PLAN`; `MIR CLAUDE 1.5 CONSOLIDATION`; `MIR CLAUDE 1.5 THE HAND`; `MIR CLAUDE 1.5 FOR-JOSH 2026-10-07`; `MORE MIR 1.5.X+ BRAINSTORM`; `BASINS CLAUDE MIR 1.5 HARVEST PLAN`; the four Josh λWAVES notes; `LAMBDAWAVES CACHING + INFORMATIONAL`; `LAMBDAWAVES CLAUDE ORBITAL NAMES + CACHE PLAN`; `FOR-JOSH-MOLECULAR-WAVES-JUDGMENT-2026-09-18`; Sol's PLAN, CACHE-BUDGET, DISTRIBUTION; Fable's NAMES-AND-CACHE-PLAN and PROBE; `NACRE.md`; the memory files named in §3. Read in part: `MOLECULAR-WAVES-PLAN` (the Taylor and bulb sections plus its header), the three BASINS inventory notes (headings, the first 34 feature rows, every λWAVES mention), `MIR CLAUDE 1.5.0 NOTES FROM BASINS 2026-09-26` (first 140 lines), `EARTH ... RUNWAY` and the other MIR notes (λWAVES mentions only). Not read: `JOSH_&_SOL_ZOETROPE.md` beyond its first 6 KB, `ZOETROPE_CRAFTER_PROTOTYPE_LAB_SPEC`, the ZOETROPE synthesis bodies, `LAMBDAWAVES RELEASES — INDEX`, `LW VIDEO SCRIPT`, `OFFICIAL PRESETS`, the `MIR 1.5 SURVEY 2026-10-01` folder (another agent's `survey/MIR-1.5.md` covers the kit).

Not verified: the claims in §5.2 are from code and REPORT text, not from running the app; the AO counts in §7 are arithmetic from composition (the library counts quoted were read from `lab/molecules.js` with a read-only node one-liner); the Bender-Wu and Kato statements are standard theorems quoted from memory, not re-derived or re-fetched; no transcript of the video was obtained.
