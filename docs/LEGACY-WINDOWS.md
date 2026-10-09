# LEGACY WINDOWS

**All five are gone (0.5.0, R5-L1).** QCD, H₂⁺ and HELIUM were deleted in D9; H₂ and ELECTROSTATICS in D9b, on Josh's
ruling of 2026-10-09 ("H2 and Electrostatics should go"). **ATOMS left this list in 0.4.0 S3 (R-A2):** it is back as the
periodic-table window — H–Kr cells in SPECTRUM's own picker, opened by SPECTRUM's ATOM, with its own row in + and WINDOW.

Every older project still opens. A file that used a retired window opens on that window's **restore shim** (`rack.js`
`restore`) and says so in ONE line — `retired in 0.5.0: …` — in the PROJECTS status and in STATE's status. An old layout
seat naming a retired id is skipped by `applyLayout` (no such card), and nothing throws.

| id | title | what it was | files |
|---|---|---|---|
| `molecule` | H₂⁺ · **DELETED 0.5.0 D9** | H₂⁺ in the 1s LCAO basis (hidden since 0.2.0), with W-MO and W-PULSE | deleted: `moleculeview.js`, `moview.js`, `pulseview.js`, `pulse.js`; moved to `tests/lib/`: `mo.js`, `twocentre.js` (the node proofs' physical system); `molecule.js` stays (`h2ci.js` imports it) |
| `h2` | H₂ · **DELETED 0.5.0 D9b** | two atoms, the Heitler–London curves and the collision; the STO-3G RHF/FCI and Weinbaum curves | deleted: `h2.js`, `h2view.js` (+ mathworker's `h2curve` op, `tests/h2.test.mjs`, render-exact's H7 pin, the digest-lock scene `h2`); J′, K′ and E₁ moved into `h2ci.js`, which stays (its `eigSym` is the engines' and `h2CurveTable` is D6's MAPS road) |
| `helium` | HELIUM · **DELETED 0.5.0 D9** | two electrons, Hylleraas; the conditional cloud of electron 2 | deleted: `helium.js`, `heliumview.js` (+ mathworker's `helium` op, `tests/helium.test.mjs`); the field kernel's space-4 branch is left for C7's digest lock |
| `qcd` | QCD · **DELETED 0.5.0 D9** | quarkonium under a chosen potential; the CORNELL parameters | was `qcd.js`, `qcdview.js` (deleted); `cornell.js` (QUARKONIUM) stays and took the Numerov solver |
| `field` | ELECTROSTATICS · **DELETED 0.5.0 D9b** | Φ, E, B and the current of the register's own charge; the stage overlay `#fieldlines` | deleted: `electrostatics.js`, `fieldview.js`, the `#fieldlines` canvas, `tests/electrostatics.test.mjs`; H₂⁺'s Hellmann–Feynman force (`hellmannFeynman`, `xiIntegral`, `inverseSquareIntegral`) moved verbatim to `tests/lib/hellmann-feynman.js` as `mo.test`'s oracle |

## How an old file opens

- **H₂⁺** (`instruments.molecule.on`) — as MOLECULES · H₂ (STO-3G) on σg or σu (its `kind`; ON A opens σg). In a minimal basis
  of two 1s functions both are fixed by symmetry, the combinations the card drew; its R, the tunnelling start, W-MO and
  W-PULSE have no twin. RHF refuses H₂⁺'s one electron. Notice: `H₂⁺ (opened as MOLECULES · H₂ σu)`.
- **HELIUM** (`instruments.helium.on`) — as SPECTRUM's ATOM at Z = 2 with the 1s filled (`setElement(2)`, `fillValence`; ATOMS
  opens with it): the central-field He; Hylleraas's correlation, its basis and electron 1 have no twin. Notice:
  `HELIUM (opened as ATOM · He 1s)`.
- **QCD** (its layout seat open) — without the window. Its Hamiltonian (`cornell`) still restores and a file's `instruments.qcd`
  (written on, as QUARKONIUM's parameters) still applies; nothing edits it (SPECTRUM's QUARKONIUM button stays hidden). Notice:
  `QCD (QUARKONIUM keeps its parameters)`.
- **H₂** (`instruments.h2.on`) — as MOLECULES · H₂ (STO-3G) on VIEW DENSITY: the card drew the Heitler–London one-electron
  density, and this is the same molecule's (the `H₂ σu` demo's molecule and basis). Its R scan, the CI curves and the collision
  have no twin. Notice: `H₂ (opened as MOLECULES · H₂)`.
- **ELECTROSTATICS** (`field.overlay` not `off`) — on its own state, with nothing drawn: the overlay layer left with the
  window. Notice: `ELECTROSTATICS`.

The old records (`mo`, `pulse`, `instruments.molecule`, `instruments.helium`, `instruments.h2`, `field`) are read only to choose
the shim; nothing writes them again. The fixtures `tests/fixtures/legacy-{h2plus,helium,qcd,h2,electrostatics}.lambdawaves.json`
are REAL files written by the builds before D9 and D9b, and `tests/history.browser-test.mjs` opens each through the PROJECTS road.
