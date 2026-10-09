# D9 · THE LEGACY FIVE — HANDOFF (live state; updated after every commit)

- worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a9d0b021fc0378e70`
- branch: `worktree-agent-a9d0b021fc0378e70`, from `7044f37` (the `sos-s0` tip, stage A closed); never pushed
- base `lab/*.js` = **36,288**; `bash test.sh node` GREEN on the base (85 suites)
- ports: gate server `LW_PORT=8843`, geckodriver `GD_PORT=5313` (stop the server by its pid)

## State

1. DONE `719aca3` — three REAL old files written by the pre-D9 build (`0.4.0-alpha · the library · 2026-10-08` at `7044f37`)
   through `.tmp/make-legacy-fixtures.mjs` (not committed; it drives `__LW.molecule`, `__LW.helium`, `__LW.qcd`):
   `tests/fixtures/legacy-h2plus.lambdawaves.json` (H₂⁺ owns the field, σu, R = 2), `legacy-helium` (HELIUM owns the field,
   3 Hylleraas terms), `legacy-qcd` (QUARKONIUM in force, QCD open on bb̄ under LOG, α_s .51 σ .23 C .81).
2. DONE `59bb55f` — QCD deleted: `lab/*.js` 36,288 → **36,134 (−154)**; `tests/qcd.test.mjs` deleted (node 85 → 84, GREEN);
   cornell.js took numerov/POTENTIALS/DEFAULTS/MEASURED/spectrum/fitOffset (+60); `instruments.qcd` stays as QUARKONIUM's
   parameters; `restoreNotice` (one line, PROJECTS status + STATE status) names a retired window a file used. Probed in the page
   on the legacy-qcd fixture: "opened LEGACY/QCD · retired in 0.5.0: QCD (QUARKONIUM keeps its parameters)", cornell in force
   with bb̄/LOG/.51/.23/.81, no page error.
3. NEXT — H₂⁺ (commit 2), HELIUM (commit 3), the history cases (commit 4), the ledger + REPORT + D9-BUILD (commit 5).

## Decisions so far

- `cornell.js` (the QUARKONIUM Hamiltonian) STAYS: it is the render road (`digest-lock` scene `quarkonium`, link codec `T_HAM`);
  the five Numerov/potential exports it took from `qcd.js` move into it, and `qcd.js` + `qcdview.js` go.
- H₂⁺ cannot be a MOLECULES row: `rhf-molecule.js` refuses an odd electron count (measured: "RHF needs an even electron count ≥ 2,
  got 1"). Its shim target is MOLECULES · H₂ (STO-3G) on σg / σu — in a two-function minimal basis those two orbitals are fixed by
  symmetry, the same combinations the H₂⁺ card drew.
- He IS covered by the RHF road (measured here: E = −2.8077839566 Eh on a lone He atom, STO-3G), but a MOLECULES row needs a PySCF
  oracle row (none on this machine), so HELIUM's shim target is the existing ATOM preset: SPECTRUM's ATOM at Z = 2, the 1s filled.
