# D9b · H₂ AND ELECTROSTATICS GO — HANDOFF (live state; updated after every commit)

- worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aba28140791c56025`
- branch: `worktree-agent-aba28140791c56025`, reset to `c83b7ee` (the `sos-s0` tip: stage C merged + D9, PLAN §9 with the 10-09
  rulings); never pushed, never merged
- base `lab/*.js` = **29,863**; `bash test.sh node` GREEN on the base (exit 0, **82** suites)
- ports: gate server `LW_PORT=8903` (pid 4129161, started by me, stopped by pid at the end), geckodriver `GD_PORT=5373`

## State

1. DONE — two REAL old files written by the pre-D9b build (`0.4.0-alpha · the library · 2026-10-08` at `c83b7ee`) through
   `.tmp/make-legacy-fixtures-d9b.mjs` (not committed: it drives `__LW.h2` and `__LW.fieldlines`, which D9b deletes; it is D9's
   `.tmp/make-legacy-fixtures.mjs` road — NEW, the body, the notebook, SAVE, EXPORT):
   - `tests/fixtures/legacy-h2.lambdawaves.json` — H₂ owns the field: `instruments.h2 = { on: true, R: 1.4, which: 'singlet',
     showCI: true, ke: 0.02, kappa: 300 }`, its layout seat `h2` open (folded), `field.overlay` off.
   - `tests/fixtures/legacy-electrostatics.lambdawaves.json` — (1s + 2p_z)/√2 with the ELECTROSTATICS overlay on: `field =
     { overlay: 'phi', lines: 12, source: 'total' }` (13 equipotentials drawn when written), its layout seat `field` open, H₂ off.
2. NEXT — H₂ goes (commit 2); ELECTROSTATICS goes (commit 3); the lock + ledger + hand-off (commit 4).

## Decisions so far

- An old H₂ file opens as MOLECULES · H₂ (STO-3G) on VIEW DENSITY with the notice "retired in 0.5.0: H₂ (opened as MOLECULES ·
  H₂)": the H₂ card's field was the Heitler–London one-electron DENSITY, and MOLECULES' twin of a density is its density view of
  the same molecule (the `H₂ σu` demo's molecule and basis; the demo shows the σu orbital, which an H₂ file never drew).
- An old ELECTROSTATICS file opens with the notice "retired in 0.5.0: ELECTROSTATICS" and nothing drawn (the `#fieldlines`
  canvas leaves with the window).
