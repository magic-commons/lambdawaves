# D9 · THE LEGACY FIVE — HANDOFF (live state; updated after every commit)

- worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a22de79aa0ec72dc9` (the continuation;
  the first builder's was `agent-a9d0b021fc0378e70`, paused at `79d10c4`, never written into since)
- branch: `worktree-agent-a22de79aa0ec72dc9`, reset to `79d10c4` (the first builder's tip, from `7044f37` = `sos-s0`, stage A
  closed); never pushed
- base `lab/*.js` = **36,288**; `bash test.sh node` GREEN on the base (85 suites)
- ports: gate server `LW_PORT=8843`, geckodriver `GD_PORT=5313` (stop the server by its pid)

## State

1. DONE `719aca3` — three REAL old files written by the pre-D9 build (`0.4.0-alpha · the library · 2026-10-08` at `7044f37`)
   through `.tmp/make-legacy-fixtures.mjs` (not committed; it drives `__LW.molecule`, `__LW.helium`, `__LW.qcd`):
   `tests/fixtures/legacy-h2plus.lambdawaves.json` (H₂⁺ owns the field, σu, R = 2), `legacy-helium` (HELIUM owns the field,
   3 Hylleraas terms), `legacy-qcd` (QUARKONIUM in force, QCD open on bb̄ under LOG, α_s .51 σ .23 C .81).
2. DONE `59bb55f` — QCD deleted: `lab/*.js` 36,288 → **36,134 (−154)**; `tests/qcd.test.mjs` deleted (node 85 → 84, GREEN);
   cornell.js took numerov/POTENTIALS/DEFAULTS/MEASURED/spectrum/fitOffset (+60); `instruments.qcd` stays as QUARKONIUM's
   parameters; `restoreNotice` (one line, PROJECTS status + STATE status) names a retired window a file used.
3. DONE `57dca21` — H₂⁺ deleted: **36,134 → 34,480 (−1,654)**: deleted moleculeview 124, moview 395, pulseview 202, pulse 81
   (+ `tests/pulse.test.mjs`); MOVED to `tests/lib/` mo.js 598 + twocentre.js 216 (test-only physics; wiring forbids lab
   orphans); shim → MOLECULES · H₂ STO-3G VIEW ORBITAL 1 (σg) / 2 (σu); new-project REGENERATED (molecule, pulse, mo left);
   digest-lock's `h2plus` scene gone + retired fixture states skipped; node GREEN at **83 suites**.
4. DONE (no fix needed; verified by the continuation on 8843/5313, alone, 4 s apart) — the browser suites 57dca21 edited:
   `molecular-names` **6/6** (its last case, the H₂⁺ shim, green); `render-regressions` **2/2**; `current` **15/15** on a
   re-run (the first run's one red was `audioFace.ott.followsPalette` — the modulation audio face's palette transition read at
   250 ms, a file D9 does not touch; green alone on the re-run: a timing red). `.tmp/probe-legacy.mjs h2plus qcd`:
   h2plus → "opened LEGACY/H2PLUS · retired in 0.5.0: H₂⁺ (opened as MOLECULES · H₂ σu)", chem on, preset H2, VIEW orbital 2,
   owner, no page error; qcd → "opened LEGACY/QCD · retired in 0.5.0: QCD (QUARKONIUM keeps its parameters)", ham cornell,
   qcd bottom/log .51/.23/.81, no page error.
5. NEXT — HELIUM (commit 3), the history cases, the demos, the H₂/ELECTROSTATICS measure, the ledger + REPORT + D9-BUILD.

## The exact next step

HELIUM: `lab/heliumview.js` (75) + `lab/helium.js` (140) leave; mathworker's `helium` op and rack's HELIUM_BASES import go;
`tests/helium.test.mjs` goes; shim in restore: `I.helium.on` (no chem/h2 owner) → `setElement(2); fillValence();` +
`gone.push('HELIUM (opened as ATOM · He 1s)')`; drop `helium` from new-project (`node tools/new-project.mjs` + `--check`),
digest-lock's `helium` scene, `current`, `legacy/boot` guards. LEAVE `lab/capture.js` / `lab/render-exact.js`'s guarded
`LW.helium` lines (C7's files). `node tests/pwa.test.mjs --write`; node gate; `molecular-names`, `current`,
`render-regressions`, `.tmp/probe-legacy.mjs helium`.

## Decisions so far

- `cornell.js` (the QUARKONIUM Hamiltonian) STAYS: it is the render road (`digest-lock` scene `quarkonium`, link codec `T_HAM`);
  the five Numerov/potential exports it took from `qcd.js` move into it, and `qcd.js` + `qcdview.js` go.
- H₂⁺ cannot be a MOLECULES row: `rhf-molecule.js` refuses an odd electron count (measured: "RHF needs an even electron count ≥ 2,
  got 1"). Its shim target is MOLECULES · H₂ (STO-3G) on σg / σu — in a two-function minimal basis those two orbitals are fixed by
  symmetry, the same combinations the H₂⁺ card drew.
- He IS covered by the RHF road (measured here: E = −2.8077839566 Eh on a lone He atom, STO-3G), but a MOLECULES row needs a PySCF
  oracle row (none on this machine), so HELIUM's shim target is the existing ATOM preset: SPECTRUM's ATOM at Z = 2, the 1s filled.
