# D9 · THE LEGACY FIVE — build hand-off (2026-10-08, two Opus 5.5 builders in relay)

**In ten lines.** Under R5-L1, three of the five hidden LEGACY windows are deleted, and each has a restore shim. QCD is gone,
and QUARKONIUM keeps its solver and parameters. H₂⁺ is gone: its files open as MOLECULES · H₂ on σg or σu. HELIUM is gone:
its files open as SPECTRUM's ATOM · He 1s. A file that used one says so in one line, in the PROJECTS status and in STATE's
status. Two DEMOS, `H₂ σu` and `HELIUM`, open the same two targets from the PROJECTS face. Both were made by the app.
H₂ and ELECTROSTATICS are **not** deleted. They are measured below for Josh's "by use" ruling.
`lab/*.js` went **36,288 → 34,248 (−2,040)**. 814 of those lines are BOOKED AS MOVED (`mo.js` and `twocentre.js` → `tests/lib/`).
The net deletion is **−1,226**. Node suites went 85 → 82 and stay GREEN.
In the browser: `history` 42/42 (+3 old-file cases), `molecule-demos` 5/5 (+2), `molecular-names` 6/6, `current` 15/15,
`render-regressions` 2/2. There are no blockers. Nothing is pushed or merged.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a22de79aa0ec72dc9` (the continuation; the first builder's `agent-a9d0b021fc0378e70` stopped at `79d10c4`) |
| branch | `worktree-agent-a22de79aa0ec72dc9`, reset to `79d10c4`. It descends from `7044f37`, the `sos-s0` tip at the close of stage A, and is built on the MIR 1.4.3 tree with no adopt |
| `719aca3` | fixtures: three REAL pre-D9 project files (H₂⁺, HELIUM, QCD) for the restore shim |
| `59bb55f` | QCD deleted: qcd.js + qcdview.js + tests/qcd.test.mjs; QUARKONIUM keeps its solver and parameters (−154) |
| `57dca21` | H₂⁺ deleted: the `molecule` card with W-MO and W-PULSE; its files open as MOLECULES · H₂ σg/σu (−1,654) |
| `5baa301` | HELIUM deleted: its files open as SPECTRUM's ATOM · He 1s (−234) |
| `e9cb3d9` | history: three old files open through the PROJECTS road (39 → 42) |
| `e1d3cb8` | the two shim demos, H₂ σu and HELIUM, made by the app (+2: sw.js) |
| hand-offs | `08c32af`, `79d10c4` (the first builder) · `b12e920`, `ce511e5`, `b9aa688`, `3dba52e` and the docs commit (the continuation) |
| gate server | 8843 (started and stopped by pid), geckodriver 5313; no browser left open |

## What Josh will see

- **An old file that used a retired window opens.** It never errors. One line names what went:
  - "opened LEGACY/QCD · retired in 0.5.0: QCD (QUARKONIUM keeps its parameters)". The field stays QUARKONIUM on the file's
    bb̄ / LOG / α_s .51 σ .23 C .81, and the window is not there.
  - "… retired in 0.5.0: H₂⁺ (opened as MOLECULES · H₂ σu)". MOLECULES owns the field on H₂ (STO-3G), VIEW ORBITAL on
    1σu, or on 1σg for a σg or ON-A file.
  - "… retired in 0.5.0: HELIUM (opened as ATOM · He 1s)". SPECTRUM's ATOM is at Z = 2 with the 1s filled, and ATOMS opens
    beside it.
  - The same line is STATE's status.
- **The PROJECTS face has two more DEMOS** after N₂: `H₂ σu` (hydrogen's antibonding orbital) and `HELIUM` (the 1s of a
  central field). Each notebook says where the retired window went.
- **Nothing else moves.** H₂ and ELECTROSTATICS stay hidden and come back exactly as before. The + menu, WINDOW and TAB
  have no new rows.

## The shims (`lab/rack.js` `restore`, one block)

| file field owner | opens as | why that target |
|---|---|---|
| `instruments.molecule.on` (H₂⁺) | MOLECULES · H₂, STO-3G, VIEW ORBITAL 2 (σu) or 1 (σg; ON A too) | RHF refuses one electron (measured: "RHF needs an even electron count ≥ 2, got 1"). In a minimal basis of two 1s functions σg/σu are fixed by symmetry: the same combinations the card drew. Its R, the tunnelling start, W-MO and W-PULSE have no twin. |
| `instruments.helium.on` (HELIUM) | `setElement(2); fillValence();` → ATOM at Z = 2, the 1s, ATOMS raised by the existing ATOM law | A MOLECULES He row would need a PySCF oracle row, and none exists on this machine (RHF/STO-3G He measures −2.8077839566 E_h). The central field has no correlation and no conditional cloud. |
| a layout seat `qcd` open | the file without the window. `instruments.qcd` still applies to QUARKONIUM (`cornell.configure`) | `cornell.js` is the render road (digest-lock `quarkonium`, link `T_HAM`). It took the Numerov solver from `qcd.js`. |

The old `mo`, `pulse`, `molecule` and `helium` records are read only to choose the shim, and nothing writes them again.
`restoreNotice` holds the one line, and `gone` collects it.

## The demos (`lab/demos/`, made by the app: `.tmp/make-demos.mjs`, not committed)

Both demos took wave 139's road. A headless session builds the scene, saves it as `DEMOS/<NAME>`, exports it with
`projects.exportText`, and strips the export of `quality` and `camera` (W129). Nothing else is touched.

- `h2-sigma-u.lambdawaves.json`, `DEMOS/H₂ σu`. The session ran NEW, then MOLECULES solve H₂, then ON, then VIEW ORBITAL 2,
  then N₂'s pose (yaw 0.65, pitch 0.20). A screenshot shows two lobes of opposite phase with the nodal plane between the
  protons. Measured: R = 1.400 a₀ (E_nuc 0.71414), E = −1.116706 E_h, ε(1σg) = −0.5781, ε(1σu) = +0.6701. These are
  Szabo–Ostlund's numbers. The knob reads "1σu · LUMO".
- `helium.lambdawaves.json`, `DEMOS/HELIUM`. The session ran NEW, then SPECTRUM's ATOM, then He picked in ATOMS' table, then
  FILL THE VALENCE. ε(1s) = −0.7426 E_h (−20.2 eV). The ATOMS footer says "ε is not an IP", and the notebook quotes the real
  IP, 0.904 E_h.
- `lab/index.html`: two `.pj-demo` buttons after N₂. That is the only edit to the file (C0 owns its cascade).

## H₂ and ELECTROSTATICS, measured for the "by use" ruling (nothing deleted)

| | H₂ · LEGACY (`h2`) | ELECTROSTATICS · LEGACY (`field`) |
|---|---|---|
| what it is | two atoms: Heitler–London, Weinbaum and FCI curves, the collision on the triplet curve (classical nuclei), the one-electron density as a field owner (kernel space 5) | Φ, E, B and the current of the register's own charge in closed form, with Q/Φ/E/B readouts and the stage overlay `#fieldlines` |
| its own files | `h2view.js` **186** (the window) · `h2.js` **82** (the HL model) = 268 | `electrostatics.js` **437** · `fieldview.js` **236** (the overlay; the PLAN did not count it) = 673 |
| what must stay if it goes | `h2ci.js` 330 (six engine importers use `eigSym`; `sto3gH2` is in scf/density/card-solvers' suites). `h2ci.js` imports `coulombJ2`, `exchangeK2` and `EV` from `h2.js`, and `tests/lib/mo.js` imports `MU_H2`, so ≈ 20 lines move before `h2.js` can go. `molecule.js` 83 keeps one lab importer (`h2ci`'s `overlapS`) | `hydrogen.js`, `field.js` (shared). `hellmannFeynman` / `xiIntegral` / `inverseSquareIntegral` (≈ 45 lines, H₂⁺'s force) have served only `electrostatics.test` and `mo.test` since H₂⁺ left, so they would move to `tests/lib/`. `molecule.js` loses an importer |
| rack.js | 31 lines: the card (6) and field-owner branches in modesAt, the domain, kernel space 5, the overlay domain, calculus, the canvas sentence, copyLatex, the stage text ×3, fieldOn, hydroReader, chem setOn, the tick, serialize, restore | ≈ 51-line card block (2583–2633: the overlay seg, LINES, SOURCE, the readouts, `paintField`, `fieldOn`) + ≈ 10 sites (the frame loop ×3, serialize `field`, restore ×2, the COPY digest `field`, the Sturmian status line) + `#fieldlines` in index.html and lab.css |
| other lab | mathworker's `h2curve` op; render-exact.js's H7 pin (C7's) | capture.js draws `fieldlines` among the export overlays (C7's) |
| how a user reaches it | **only by opening an older project whose `instruments.h2.on` is true** (restore un-hides it as field owner). There is no row in + / WINDOW / TAB, and a first visit never sees it. `layout.reopen('h2')` (tests) | **only by opening an older project whose `field.overlay` is not `off`** (restore raises it). There is no row in + / WINDOW / TAB, and the overlay draws only while the card can present. `layout.raise('field')` (tests) |
| what a project file carries | `presentation.instruments.h2 = { on, R, which, showCI, ke, kappa }` and a layout seat `h2` | `presentation.field = { overlay, lines, source }` and a layout seat `field` |
| bundled files that turn it on | none of the 6 demos and not the empty project (all `h2.on: false`; seats closed) | none (all `overlay: 'off'`; seats closed) |
| suites | `tests/h2.test.mjs` 47 (whole). `h2ci.test.mjs` 134 stays (its library). Browser: legacy/boot B35, `current`'s lazy-card case (h2 + ladder), digest-lock scene `h2` | `tests/electrostatics.test.mjs` 245 (whole; part of it moves to `tests/lib`). Browser: legacy/boot (23 references) |
| twin today | MOLECULES · H₂ (RHF/STO-3G at the fixed experimental R: no R scan, no CI curves, no collision) | none |

## The ledger (`cat lab/*.js | wc -l`)

| step | lab/*.js | Δ | what left lab/ |
|---|---|---|---|
| base `7044f37` | 36,288 | | |
| QCD `59bb55f` | 36,134 | −154 | qcd.js 116 + qcdview.js 103 = 219 deleted; cornell.js +63 (took the solver); rack +4; sw −2 |
| H₂⁺ `57dca21` | 34,480 | −1,654 | moleculeview 124 + moview 395 + pulseview 202 + pulse 81 = 802 deleted; **mo.js 598 + twocentre.js 216 = 814 MOVED to `tests/lib/`**; rack −32; sw −6 |
| HELIUM `5baa301` | 34,246 | −234 | helium.js 140 + heliumview.js 75 = 215 deleted; rack −14; mathworker −3; sw −2 |
| demos `e1d3cb8` | 34,248 | +2 | sw.js precaches the two demo files |
| **D9** | **34,248** | **−2,040** | **1,236 deleted + 814 moved, +10 elsewhere** (cornell +63, rack −42, mathworker −3, sw −8) |

- **Ceiling.** The PLAN's ceiling was 1,139 (qcd 219 · h2 268 · helium 215 · electrostatics 437) plus H₂⁺'s files, which D9
  measured at 802 deletable + 814 movable. That makes **2,755**, or 1,941 with the moved lines left out. Under the ruling
  taken so far, the three decided windows' share is 219 + 802 + 215 = **1,236 deleted, all of it achieved**, plus the 814
  moved. The held pair's 705 (268 + 437) is the remaining ceiling. Measured, it is 941 with `fieldview.js` counted, less
  ≈ 65 lines that would move rather than go, plus ≈ 60 rack.js lines in the two card blocks: about 935.
- **Deleted node suites:** `tests/qcd.test.mjs` 60, `tests/pulse.test.mjs` 153, `tests/helium.test.mjs` 54 (85 → 82). Their
  anchors that guard kept code moved: the Airy anchors went to `tests/cornell.test.mjs`.
- **D's ledger.** D is to be net ≤ 0. D9 gives a credit of **−1,226** on lines that truly leave the product, or −2,040
  counting the moved lines.

## Tests

- `bash test.sh node`: exit 0, **82** suites (after HELIUM and again after the demos). `node tools/new-project.mjs --check`
  is in step at 16,329 B. `node tests/pwa.test.mjs --write` was run after each `lab/` edit, ending at 183 precached files.
- Browser, on 8843/5313, one at a time and 4 s apart:
  - after H₂⁺ (the suites 57dca21 edited): `molecular-names` **6/6**, `render-regressions` **2/2**, `current` **15/15**. The
    first `current` run had one red, `audioFace.ott.followsPalette` (the modulation audio face's palette transition read at
    250 ms, a file D9 does not touch). It was green when re-run alone: a timing red.
  - after HELIUM: `molecular-names` 6/6, `current` 15/15, `render-regressions` 2/2.
  - after the history cases: `history` **42/42**. After the demos: `molecule-demos` **5/5**.
- `.tmp/probe-legacy.mjs` (the PROJECTS road on each fixture): h2plus, qcd and helium are clean, with no page error.
- `legacy/boot` (test.sh's `legacy` mode) was run once, because two builders edited it blind. It gave **55 GREEN / 57 RED**,
  then a crash at the B96 reload ("Render did not settle: animation frames stopped", the headless reload).
  - **All six D9 cases are GREEN**: B22 (QCD gone), B29, B33, B37, B58 (retired, the B29 form), and B55 (ELECTROSTATICS ships
    closed).
  - The reds are in cases D9 does not touch: B3 METERS, B43 THE SHIPPED DEFAULTS, B28 KEYS, B38–B46 …. The suite is stale.
  - B35 (H₂) is red only on its status-text check ("CLASSICAL NUCLEI" is not in the body text). Its physics numbers pass:
    ∫ρ = 1.998 at R = 6 and at R = 1.4, and the turning point is 3.44.
  - Not compared against the base: that would be another ~25 min on the shared GPU.

## Lines

`cat lab/*.js | wc -l`: **36,288 → 34,248 (−2,040; −1,226 without the 814 moved)**. The ledger above gives the breakdown.

## Blockers

None.

## Brief candidates for MIR

None. D9 needs no brief, as PLAN §2 says.

## Open items

- **H₂ and ELECTROSTATICS wait on Josh's "by use" ruling.** The table above is the measure. If both go, D gains about 935 more
  lines.
- **Left for C7 (its files):**
  - `capture.js` (2 sites) and `render-exact.js` (1 site) keep their guarded `LW.helium` lines. They are dead and harmless.
  - The field kernel's **space-4 WGSL branch** (HELIUM's pair amplitude, 6 lines in `field.js`) stays. The digest lock is
    the bit-identical law, so its removal belongs with a lock run.
  - `tools/perf/device-report.js` still lists the `LW.molecule`, `LW.helium` and `LW.qcd` seams. Its `safe()` wrapper
    tolerates them.
- **The four older demos** (water, benzene, N₂, WAVE DANCER) still carry closed layout seats for `qcd`, `molecule` and
  `helium`, and a `mo` key. These are harmless: a closed seat is skipped, QCD counts only when open, and nothing reads `mo`.
  Regenerate them only if a later stage re-makes the demos.
- `legacy/boot` is stale beyond D9 (55/112 green before its B96 reload crash). Its reds are in cases D9 never touched. It
  needs its own pass, which is not D9's.

## Merge notes

- `lab/rack.js`: the edits are tight: two imports, KIND, the field-owner one-liners, the HELIUM card block (6 → 1 line),
  windowActivity's list, the shift-click block, serialize, the restore block and `__LW`. C4's continuation edits rack.js
  heavily. Take both sides, then grep `helium` and `wHe`: only the shim and its comments should remain.
- `lab/new-project.lambdawaves.json`: C0 regenerates it too. Take either side and run `node tools/new-project.mjs` then `--check`.
- `CLAUDE.md`: the LEGACY sentences are replaced by the eight-line D9 paragraph; the ATOMS sentences that follow are untouched.
- `lab/index.html`: only the two `.pj-demo` buttons (one line). `lab/sw.js`: take either side, then `node tests/pwa.test.mjs --write`.

## Exact next step

The integrator (Claude Yan, `yan-c`) merges `worktree-agent-a22de79aa0ec72dc9`. Then run `node tools/new-project.mjs`,
`node tests/pwa.test.mjs --write`, `bash test.sh node`, `history`, `molecule-demos` and `molecular-names`. Ask Josh the "by
use" question for H₂ and ELECTROSTATICS with the table above.
