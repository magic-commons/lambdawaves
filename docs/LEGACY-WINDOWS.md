# LEGACY WINDOWS

**All five were removed in 0.5.0:** QCD, H₂⁺ and HELIUM first, then H₂ and ELECTROSTATICS (2026-10-09). **ATOMS left this
list in 0.4.0:** it is back as the
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

## The three windows that became rooms (041 H4)

CENTRAL, SEPARABLE and LATTICE are no longer rack windows. Each editor is a ROOM inside SPECTRUM's HAMILTONIAN group, shown by ‹ SYSTEM ›
(`lab/windows/spectrum.js` `.sp-room[data-room]`, built by `lab/windows/readouts.js`). Nothing a file stores was renamed.

| id | title | where it is now | what still reads the old id |
|---|---|---|---|
| `central` | CENTRAL | SPECTRUM › HAMILTONIAN › ‹ SYSTEM › CENTRAL (and CENTRAL › QUARKONIUM) | `RETIRED_WINDOWS.central → spectrum`; the operator ids `central` / `cornell`; `instruments.central` { preset, params }; the worker op `central.solve` |
| `separable` | SEPARABLE | SPECTRUM › HAMILTONIAN › ‹ SYSTEM › SEPARABLE | `RETIRED_WINDOWS.separable → spectrum`; the operator id `separable`; `instruments.separable` { form, wx, wy, wz, L } |
| `lattice` | LATTICE | SPECTRUM › HAMILTONIAN › ‹ SYSTEM › LATTICE (its own register still; the operator in force is left alone) | `RETIRED_WINDOWS.lattice → spectrum`; `instruments.lattice`; the verb `lattice`; the LATTICE widget; the worker op `lattice.solve` |

How an old file or layout opens:

- **A layout seat** naming one of the three stands for SPECTRUM (`shell/settings.js` `RETIRED_WINDOWS`, the kit's `retired`): where the
  layout names SPECTRUM itself the old seat is dropped, where it does not SPECTRUM takes that seat. Nothing throws.
- **An operator in force** (`hamiltonian.id` `central`, `cornell` or `separable`) brings SPECTRUM back, powered, with ‹ SYSTEM › on it and
  its room shown (`shell/persist.js`, AN EFFECT SHOWS ITS WINDOW).
- **A LATTICE window that was open** in the layout opens SPECTRUM with its HAMILTONIAN unfolded and ‹ SYSTEM › on LATTICE, the room shown
  (`shell/rack-wiring.js` `applyLayout`); under MOLECULES, where SPECTRUM is hidden, it is left as it is.
- None of the three ever had a modulation target; no route, lane or macro names them.
- ‹ SYSTEM › on LATTICE is not stored (LATTICE is no operator): a reload shows the operator in force; under MOLECULES the LATTICE room
  cannot be reached (SPECTRUM is hidden) and the LATTICE widget still draws it (041 H's open lines).
