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
5. DONE `5baa301` — HELIUM deleted: **34,480 → 34,246 (−234)**: helium.js 140 + heliumview.js 75 + tests/helium.test.mjs;
   mathworker's `helium` op; rack.js −14 (card, imports, every field-owner branch, shift-click, __LW.helium/placeElectron,
   `instruments.helium`); THE SHIM: `I.helium.on` (no chem/h2 owner) → `setElement(2); fillValence();` + notice "retired in 0.5.0:
   HELIUM (opened as ATOM · He 1s)"; new-project regenerated (16,329 B, --check in step); digest-lock's `helium` scene gone;
   current / molecular-names / legacy-boot (B33, B37 retired) follow. capture.js / render-exact.js guarded lines and the WGSL
   space-4 branch LEFT for C7. Node GREEN **82 suites**; browser: molecular-names 6/6, current 15/15, render-regressions 2/2;
   probe helium → ham atom, atomZ 2, 1 populated, ATOMS open, no page error.
6. DONE `e9cb3d9` — history's section 10: the three REAL fixtures through `P.importText` + `P.open` on a fresh page — each the
   origin row [open · NAME] at depth 0, the PROJECTS status naming the retired window, no retired card/record back, no page
   error, and its shim target (H₂⁺ → chem H2 orbital 2 owner; HELIUM → atom Z 2, 1 label, ATOMS open; QCD → cornell bb̄/LOG/
   .51/.23/.81). `history` **42/42** (39 + 3).
7. DONE `e1d3cb8` — the two shim demos, MADE BY THE APP (`.tmp/make-demos.mjs`, the wave-139 road: build → save DEMOS/<NAME> →
   `projects.exportText` → strip `quality`/`camera`): `lab/demos/h2-sigma-u` (MOLECULES · H₂ STO-3G, VIEW ORBITAL 2 = 1σu,
   N₂'s pose, screenshot-checked) and `lab/demos/helium` (ATOM · He picked in ATOMS · FILL THE VALENCE); two `.pj-demo` buttons
   in lab/index.html (`<m>H₂</m> σu`, HELIUM); molecule-demos **5/5**; node GREEN (first-run's demo law reads them).
8. NEXT — the H₂/ELECTROSTATICS measure (a table in D9-BUILD.md, nothing deleted), the ledger, REPORT wave 202, D9-BUILD.md.

## The exact next step

Measure H₂ and ELECTROSTATICS for Josh's "by use" ruling — files and lines, importers, the control a user reaches each by, what
a project file carries — into a short table in `research/release-0.5.0/D9-BUILD.md`. Then the ledger (lab/*.js per window:
36,288 → 36,134 → 34,480 → 34,246 → 34,248 after the demos' sw.js), REPORT.md's `## 2026-10-08 · 0.5.0 D — THE INFORMATIONAL'S
LEDGER` + `### wave 202: D9 THE LEGACY FIVE — …` at the END, D9-BUILD.md, the final hand-off.

## Decisions so far

- `cornell.js` (the QUARKONIUM Hamiltonian) STAYS: it is the render road (`digest-lock` scene `quarkonium`, link codec `T_HAM`);
  the five Numerov/potential exports it took from `qcd.js` move into it, and `qcd.js` + `qcdview.js` go.
- H₂⁺ cannot be a MOLECULES row: `rhf-molecule.js` refuses an odd electron count (measured: "RHF needs an even electron count ≥ 2,
  got 1"). Its shim target is MOLECULES · H₂ (STO-3G) on σg / σu — in a two-function minimal basis those two orbitals are fixed by
  symmetry, the same combinations the H₂⁺ card drew.
- He IS covered by the RHF road (measured here: E = −2.8077839566 Eh on a lone He atom, STO-3G), but a MOLECULES row needs a PySCF
  oracle row (none on this machine), so HELIUM's shim target is the existing ATOM preset: SPECTRUM's ATOM at Z = 2, the 1s filled.
