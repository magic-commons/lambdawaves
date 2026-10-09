# D9b · H₂ AND ELECTROSTATICS GO — HANDOFF (live state; updated after every commit)

- worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aba28140791c56025`
- branch: `worktree-agent-aba28140791c56025`, reset to `c83b7ee` (the `sos-s0` tip: stage C merged + D9, PLAN §9 with the 10-09
  rulings); never pushed, never merged
- base `lab/*.js` = **29,863**; `bash test.sh node` GREEN on the base (exit 0, **82** suites)
- ports: gate server `LW_PORT=8903` (pid 4129161, started by me, stopped by pid at the end), geckodriver `GD_PORT=5373`

## State

1. DONE `822acff` — two REAL old files written by the pre-D9b build (`0.4.0-alpha · the library · 2026-10-08` at `c83b7ee`)
   through `.tmp/make-legacy-fixtures-d9b.mjs` (not committed: it drives `__LW.h2` and `__LW.fieldlines`, which D9b deletes; D9's
   road — NEW, the body, the notebook, SAVE, EXPORT):
   - `tests/fixtures/legacy-h2.lambdawaves.json` — H₂ owns the field: `instruments.h2 = { on: true, R: 1.4, which: 'singlet',
     showCI: true, ke: 0.02, kappa: 300 }`, its layout seat `h2` open (folded), `field.overlay` off.
   - `tests/fixtures/legacy-electrostatics.lambdawaves.json` — (1s + 2p_z)/√2 with the ELECTROSTATICS overlay on: `field =
     { overlay: 'phi', lines: 12, source: 'total' }` (13 equipotentials drawn when written), its layout seat `field` open, H₂ off.
2. DONE `9ebf35c` — H₂ deleted. `lab/*.js` 29,863 → **29,589 (−274)**: h2view −186, h2.js −82, h2ci +19 (J′, K′, E₁ moved in),
   rack −16, render-exact −4, mathworker −3, sw −2. Node: exit 0, **81** suites (h2.test left; h2ci 8 → 13 judges with its
   five anchors on kept code; render-exact 37 → 36, H7 gone). Browser on this tree: `history` **43/43** (42 + the legacy-h2 case).
   new-project 16,329 → 16,198 B, `--check` in step.
3. NEXT — ELECTROSTATICS goes (commit 3, the script is `.tmp/d9b_field.py`); then the lock ALONE + the browser gates + ledger +
   hand-off + docs (commit 4: CLAUDE.md's paragraph, `docs/LEGACY-WINDOWS.md`, `docs/STATE-SCOPES.md` are edited in the tree).

## Decisions so far

- An old H₂ file opens as MOLECULES · H₂ (STO-3G) on VIEW DENSITY with the notice "retired in 0.5.0: H₂ (opened as MOLECULES ·
  H₂)": the H₂ card's field was the Heitler–London one-electron DENSITY, and MOLECULES' twin of a density is its density view of
  the same molecule (the `H₂ σu` demo's molecule and basis; the demo shows the σu orbital, which an H₂ file never drew).
  Proved by `history` (43/43).
- An old ELECTROSTATICS file opens with the notice "retired in 0.5.0: ELECTROSTATICS" and nothing drawn (the `#fieldlines`
  canvas leaves with the window).
- `h2ci.js` takes EV from `molecule.js` (27.211386, the same constant h2.js exported); `h2CurveTable` stays (card-solvers'
  suite, D6's MAPS).
- legacy/boot: only the D9b cases are edited (B35, B106 retired in the B29 form; six `if (__LW.h2.on) …` guards removed).
