# G1 THE CENTRAL HAMILTONIAN + FIVE — build note (Opus builder ab60dc61db2e32919; written by the integrator from the builder's hand-back, 2026-10-16)

Branch `g1-central` from `a2072ff`, tip `6b2c6ad` (one commit). `lab/` lines 29,525 → **29,610 (+85 of +90)**; `lab/central.js` 75 lines. The builder was
paused by the usage alarm after its gates and before this note; its hand-back is `.claude/handoffs/agents/ab60dc61db2e32919.md` and this note is that text in
the house shape. `lab/kick.js` (G2's), `lab/state.js`, `lab/windows/state.js` and `lab/stark.js` (G3's) untouched.

## Seats
- `lab/central.js` (new): `POTENTIALS` l.8 (CONFINED · YUKAWA · FINITE WELL · SOFT-CORE, each `{ label, V(p), knobs }`; QUARKONIUM is the existing `cornell`
  Hamiltonian, reached through the card), `DEFAULTS` l.15 (CONFINED R_c 25 · YUKAWA λ 25 · FINITE WELL V₀ 5, a 4 · SOFT-CORE a 0.5), `solveCentral(preset, p)`
  l.28 (the 21 (n_r, l) rows the n ≤ 6 labels name — not 36 — through `cornell.js`' `tabRow`; a row is bound only if E < 0; an unbound label gets energy NaN, a
  zero table row and zero range, so it draws nothing; returns `{ E, rTab, r99, table, rows, bound, oracle, ms }` with the 1s against its oracle as a printed
  line), `configure` l.40 · `install` l.42 · `save` l.43 (nothing at the defaults), the Hamiltonian `CENTRAL` l.46 (label "CENTRAL  <preset>", `radialTable`,
  the MODEL footer "EIGENVALUE · <preset> · Numerov · n bound of 91 · a level at E ≥ 0 is no state here (no continuum)"), the card `createCentral(host, api)` l.56:
  POTENTIAL stepper, the preset's knobs, CHARM | BOTTOM under QUARKONIUM, the readout "n bound of 91 · <oracle line> · k populated unbound here", a units note;
  `pick` l.65 (QUARKONIUM configures cornell.js and switches to `cornell`; a generic preset re-solves in the worker, the latest ask wins, then switches);
  `prepare` l.73 re-reads the record when the card opens.
- `lab/cornell.js`: the per-row table code extracted into the exported `tabRow(V, mu, l, nr, opt, table, row)` l.101; `radialAt`, `cornellTable`,
  `cornellFromTable`, `cornellPsiAt` take an optional solved state `S` and table fn `tf`; `L_RGB` exported l.82; a zero-range row reads 0, not 1/0. QUARKONIUM
  byte-identical: the cc̄ / bb̄ masses and the kernel table hash `ff9e1d16…` equal on the base and on G1.
- `lab/hamiltonian.js:21` imports `CENTRAL`; l.177 `HAMILTONIANS.central = CENTRAL` (`cornell` untouched). `lab/mathworker.js:43` imports `solveCentral`; l.139 the
  op `central.solve { preset, params }`.
- `lab/windows/readouts.js:9` imports `createCentral, solveCentral`; l.134–135 the card `central` after LATTICE, eyebrow CENTRAL, ships closed, `wCen`; its
  `solve` goes through `solveCard` to the worker op (the frame thread if the worker never answered — a first pick before the worker answers solves on the frame
  thread, as ATOM does), its `apply` is `switchHamiltonian` + `ui.hamSeg.set` (crossings stay 7). `lab/rack.js:63` `energyOf` turns NaN → 0 (an unbound amplitude
  holds still); l.740 `central: wCen` in READERS (the window the READER LAW may park).
- `lab/windows/spectrum.js:35–37` the picker lists CENTRAL and an enabled "CENTRAL › QUARKONIUM", both switching the operator and opening the card through
  `app.sh.layout.reopen('central')`; l.95 `api.energyOf` returns NaN for an unbound label. `lab/spectrum.js:162` `energyText` prints "unbound here" for NaN
  (exported; the lanes use it; SPECTRUM stays at its 25 crossings).
- `lab/shell/persist.js:9` imports `save`/`configure`; l.59 `instruments.central: centralSave()` (absent at the defaults); l.203 `centralConfigure` before the
  Hamiltonian switches on restore. `instruments.qcd` unchanged. `docs/STATE-SCOPES.md:67` the one new PROJECT row.
- `tools/catalogue-table.mjs:36–37`: the cornell row renamed "CENTRAL › QUARKONIUM", a `central` row (NUMERICAL; the confined 1s against M(1 − 1/κ, 2, 2κR_c) = 0,
  the well's l = 0 law, Numerov at 2N); `lab/catalogue.js` regenerated. `tests/central.test.mjs` (38 lines, 8 checks).

## The oracles (the 1s of each preset against a closed form or a second grid)
| preset | law | shipped grid | fine grid |
|---|---|---|---|
| CONFINED R_c 2 | the zero of M(1 − 1/κ, 2, 2κR_c) | 3.5e-11 | 5.8e-10 (Numerov, 48 000 points) |
| CONFINED R_c 4 | " | 1.1e-10 | 9.6e-13 |
| CONFINED R_c 8 | " | 7.9e-10 | 1.8e-11 |
| CONFINED critical radius | j²₁,₁/8 = 1.835246330265 | Numerov 1.8352463302566 | — |
| YUKAWA λ 2 · 5 · 20 | N vs 2N | 7.7e-6 · 9.8e-6 · 1.0e-5 | λ = 1e6 → −0.4999872; bound at λ 0.86, unbound at 0.82 |
| FINITE WELL V₀ 5, a 4 | k cos ka + κ sin ka = 0 (the s levels) | ≤ 2.3e-5 | the well's grid places a mid-cell at r = a, O(h²); the plain grid read 9e-3 |
| SOFT-CORE a 0.5 | N vs 2N | 5.2e-9 | E₁ₛ + ½ = 2.6e-2 · 7.1e-4 · 1.2e-5 at a = 0.1 · 0.01 · 0.001 |

The ≤ 1e-10 fine-grid gate the brief asked for sits on the solver's rounding floor; the test gates 1e-9.

## At the defaults — bound rows / bound labels of 91 / solve
| CONFINED | 11 / 39 / 90–126 ms |
|---|---|
| YUKAWA | 12 / 34 / ≈ 250 ms (with the 2N oracle) |
| FINITE WELL | 17 / 81 / ≈ 110 ms |
| SOFT-CORE | 21 / 91 / ≈ 160 ms |

## Gates (all green on the branch)
central 8/8 · `./test.sh node` rc 0 after `pwa --write` · rack-deps holds (SPECTRUM 25, readouts 7, persist 24, `app` no new key) · new-project in step ·
catalogue-table --check + catalogue test · hydrogen 37/37 · cornell 10/10 · serialize-bytes: 11 edit hashes identical, full hashes each +81 B (the card's
WORKSPACE layout row) · keyboard-window GREEN on the served G1 tree · screenshot `.tmp/g1-confined-rc3.png` (CONFINED R_c = 3 with 1s + 2s: the 1s lane
−0.4240 Eh, the 2s lane "unbound here", no console errors; `.tmp/shot.mjs` sets R_c through `__LW.serialize`/`restore`, since an injected module gets its own
copy of `central.js`).

## Corrections to the brief
1. λ_c(1s) = 0.839908 a₀ (δ_c = 1.190612 a₀⁻¹); the plan's "λ_c = 1/0.839908" was inverted. 2. The fine-grid gate 1e-9, not 1e-10 (above). 3. The finite well's
mid-cell grid. 4. 21 rows, not 36; the bound count is over the 91 labels. 5. The cornell.js refactor (`tabRow`, `S`) exceeds "≤ 4 lines in numerov", but `numerov`
is untouched and cornell's output byte-identical. 6. QUARKONIUM still solves on the frame thread through cornell.js; only the generic presets use the worker.
7. The catalogue generator needed a `central` row.

## Dropped
The 15 rows outside n ≤ 6; `system`/`configure` on the CENTRAL entry (the card and persist carry the record); a live readout tick — the CENTRAL readout's
"populated unbound" count updates per solve and on open, not per state edit. `statelink.js` encodes `central` by name — works.

## Found, not fixed (a standing bug, recorded for a later row)
`kick.js`' radial cache is keyed by the Hamiltonian's id: after CENTRAL re-solves with new knobs a slap uses the old radials (ATOM's element change has the same
problem). `kick.js` was G2's file this cut.

## At the merge (the integrator)
Only `lab/sw.js` conflicted (ours, then `pwa --write`); `mathworker.js` (G3's `hydrogenZ` re-export at l.464), `docs/STATE-SCOPES.md` and `lab/spectrum.js`
auto-merged; `lab/catalogue.js` regenerated by `node tools/catalogue-table.mjs`. G3's one line went into `rack.js` `statusLine()` after the STURMIAN line.
