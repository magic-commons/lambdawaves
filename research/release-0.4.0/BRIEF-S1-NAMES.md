# λWAVES 0.4.0 · S1 THE NAMES — BRIEF for the names builder (waves 140–143)

**Written by Fable, 2026-10-07.** The contract is `PLAN.md` §4 **F1** (read it first) with §3 B3's budget line (names in
the worker inside `ensureSolve`, ≤ 10 ms for benzene; nothing on the frame path). The method is the names plan,
`research/molecular-orbitals-2026-10-01/NAMES-AND-CACHE-PLAN.md` **§5** ("Declare and verify, not detect") and its
rulings §8 (all first options). The reference implementation is the probe,
`research/molecular-orbitals-2026-10-01/names-probe.mjs` + `PROBE.md` + `names-probe.json`: ten molecules named from the
live solver, every textbook configuration matched — port it into the app; do not re-derive it. Josh's loudest ask: "the
proper molecular orbital names and all the different names for it."

You start from the S0 tree (release-0.4.0 after the take-in: Cloud's work merged, 0.3.3's exports and copy, the three
demos). `cameraEye` (`BRIEF-S1-CAMERAEYE.md`) is built beside you on disjoint files (field.js, the 2-D overlays,
rack.js's projection sites); you do not touch those.

## 0 · Laws

Never edit `lab/mir/**` or `lab/fonts/**`. `node tests/pwa.test.mjs --write` after any `lab/` edit, then the suites.
Subtract, don't add (the four label formatters become ONE service; count `lab/*.js` lines before and after and report
both). Diagnostics in `tools/`. The glass is Josh's. Three scopes: a names record is derived from the solve and lives in
no scope (it is recomputed; it is never stored in a project, a link or history). Never `pkill -f`. Git only in your
worktree; never push. Ports `LW_PORT=8741 GD_PORT=5209`. One light check per commit; the whole gate is the verifier's.
REPORT.md waves from 140 under `## 2026-10-… · 0.4.0 S1 — THE NAMES`.

## 1 · The commits, in order

### N1 · `lab/names.js` — the one service (node-testable, no DOM)

- **Groups as data.** The character tables the probe has (C₂v, C₃v, T_d, D₂h, D₆h) plus the five the library needs
  (D₃h, D₃d, C₂h, C₂, C_s) and the four showpieces (**O_h, D₅d, D₅h, I_h** — so cubane, ferrocene, C₆₀ are never "the one
  molecule without names"); each table self-tested (row and column orthogonality, Σ dim² = h). Linear molecules (D∞h,
  C∞v) by the probe's road: |m| from χ(C_φ) at two generic angles, ± from one σ_v, g/u from inversion.
- **The AO representation** `D(R)`: atoms permute, s 1:1, p by R, **Cartesian d by the 6×6 `N⁻¹ Sym²(R) N`** (PROBE.md's
  last section; `md.js` `rdOf`/`RD2` give the normalisation diagonal) — needed for GeH₄, AsH₃, H₂Se, HBr, Br₂ and every
  6-31+G* set. Acceptance per operation: `DᵀSD = S` to 1e-12.
- **The labelling** as the probe: clusters by energy at **2e-10 Eh** (PROBE: safer than the app's 1e-8; Br₂'s narrowest
  gap is 1.6e-7), `χ(R) = Σ_k C_kᵀ S D(R) C_k`, `n_Γ = (1/h) Σ_R χ(R) χ_Γ(R)`; a cluster must be exactly one irrep of its own
  dimension (residual < 1e-6) or it gets NO name and a reason; **all or nothing** — one refused level and the record
  shows indices throughout, never a mix; `converged` required.
- **The record** per MO: `{ irrep, count, dim, member ('a'|'b'|…), frontier, residual }`, plus `config` (the counted
  configuration string), `group`, `frame` (the convention sentence + the axes), `tolerance` (energy and geometric), the
  aliases under the other axis convention (C₂v x↔y, D₂h, D₆h C₂'↔C₂''), `reliable`. The frontier is **by level**: every
  member of a degenerate HOMO is HOMO (today CH₄, HF, CO₂, C₆H₆ read HOMO−2/−1/HOMO by index — PROBE finding 3).
- **The forms** — one function for every surface: `forms(label) → { plain, typeset, latex, ascii, speech }`:
  plain `3σg`, `1e1g (a)`, `1b1` (a dial's text node takes no markup; Unicode has no subscript g); typeset `3σ_g`,
  `1e₁g`, `1b₁` for DOM; latex `$3\sigma_{g}$`, `$1e_{1g}^{(a)}$`; ascii `3sg`; speech "three sigma g". **Atoms join the
  same service**: the hydrogenic `n l m` labels SPECTRUM and the register print today (find every formatter: `label(k)`
  in `orbitalsview.js:126`, `orbFmt` in `chemview.js:70`, the `sp-name` rows, `statesview.js`, SPECTRUM's state names) read
  `names.js` — four formatters become one.
- **"True human information"** (F1): per orbital the textbook LCAO name and character (core / σ / π / lone pair) — derived
  for diatomics from the irrep and the dominant AO composition, tagged `derived`; for the ten probed molecules the
  vertical ionisation energy beside Koopmans' −ε, tagged `curated`, each citing its primary measurement (NIST CCCBDB =
  SRD 101; note in REPORT that the legal reading against `research/…/LEGAL-PROVENANCE` precedes any store build). Never
  passed off as computed.
- **The CORE fold's count** per element, in the service: He for Li–Ne, Ne for Na–Ar, Ar for K–Ca, **Ar for Sc–Zn (3d is
  valence)**, Ar + 3d¹⁰ for Ga–Kr → `coreCount(atoms)`.
- `tests/names.test.mjs` (node): the ten anchors reproduce `names-probe.json`'s configurations and frontier names exactly;
  the controls (water with one H moved 0.02 Å refused; tolerance set wide → "mixed", not a label; a random rotation inside
  every degenerate cluster changes no label; N₂'s symmetry-broken solution refused); the tables' self-tests; d-block
  `DᵀSD = S` on GeH₄; `forms()` on `3σg`, `1e1g (a)`, `1b1`, `1t2`.

### N2 · Declared groups in the library + the check tool

- Each record in `lab/molecules.js` gains `symmetry: { group, frame, geomTol }` for all 54 (the names plan §5 lists the
  thirteen groups and their members; C₁ for C₃H₆, urea, glycine unless the tool proves otherwise; furan and pyridine
  state `geomTol: 1e-2` bohr or get rebuilt symmetric — your call, said in REPORT).
- `tools/orbital-names.mjs --check`: applies every operation to every framework (fails outside `geomTol`), solves the
  ten anchors and compares with the probe's JSON, prints every enabled molecule's configuration or its refusal reason.
  **One PySCF cross-check** if PySCF imports in the `sci` env (`~/bin/scipython -c "import pyscf"`): water's irreps from
  `pyscf.symm.label_orb_symm` against ours (record MATCH or the difference); if PySCF is absent, say so — UNVERIFIED.

### N3 · The worker and the views

- `lab/mathworker.js` `ensureSolve` (~l.212): attach `ground.names` computed from the solve's own S, C, ε and the record's
  `symmetry` (the solve keeps S and the atom indices; the reply carries ε, C, D — the names ride with it). Time it: ≤
  10 ms benzene; log the ms in the reply's `timings`.
- MO-REGISTRY (`orbitalsview.js`): the ORBITAL ladder's rungs and the register lanes read `1b₁ · HOMO`; the knob's text
  the plain form; hovering a rung: the name, its frame, its `computed / derived / curated` tag, and for `(a) / (b)` the
  sentence "the two real combinations of the degenerate pair". A degenerate HOMO is one HOMO. **The CORE fold**: the
  frozen-core levels fold into one `core ×n` row opened by a click (state in the window's WORKSPACE record).
- MOLECULES (`chemview.js`): the ORBITAL knob reads the plain form; the `ε_HOMO · ε_LUMO` readout gains the names.
- The copy: `moleculeLatex` (S0, `lab/latex-state.js`) gains the names column (`$1b_{1}$ (HOMO)`), and `stateLatex`'s
  atomic names come from the same service. The exports: the GLB's extras, the cube's comment line and the NPZ's metadata
  carry the plain and the LaTeX name (`lab/export3d.js` metadata only — do not touch its camera line, that is
  `cameraEye`'s).
- Where there is no name (refused, C₁, unconverged): the index, and the hover says why.
- Tests: `tests/molecular-names.browser-test.mjs` extended (water's knob reads `1b₁ · HOMO`; CH₄'s three HOMO members all
  read HOMO; the CORE fold opens; benzene named within 10 ms per the reply's timing); `tests/latex-copy` (the names in
  the copy); `tests/export3d.test.mjs` (the name in the metadata).

### N4 · The demos learn their names; the N₂ teaching moment

The three S0 demos' notebooks name the HOMO (`1b₁` water, `1e₁g` benzene, `3σg` N₂). The N₂ demo becomes **the teaching
moment**: its notebook says that N₂'s HOMO is `3σg` in STO-3G and `1πu` in 6-31+G* (the probe measured it), and invites
the reader to switch BASIS and watch the name move — "a name never asserts an ordering". `node tests/pwa.test.mjs
--write`.

## 2 · Acceptance (PLAN §6 row S1)

Every enabled molecule is named or says why (print the list from `--check` into REPORT); the knob reads `1b₁ · HOMO`;
the CORE fold; the plain and typeset forms; the copy renders in the notebook (paste and look once); the N₂ demo. `lab/*.js`
total lines reported before and after. Gates: `bash test.sh node`; browser one at a time on 8741/5209:
`molecular-names`, `chem`, `register`, `latex-copy`, `export3d`, `current`, `new-project`. No digest lock (no frame path).

## 3 · Hand-off

`research/release-0.4.0/S1-NAMES-BUILD.md`: commits, gates with counts, the `--check` list, the timings, the line counts,
open items. Kill your gate server by pid. Final message: ten lines + worktree path + branch.

## 4 · Harness

Compound shell with variables, loops, heredocs or backticks is refused: plain commands, scripts as files. Commit often.
