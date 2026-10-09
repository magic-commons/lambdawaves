# D9 · THE LEGACY FIVE — HANDOFF (final; D9 is BUILT, the integrator merges)

- worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a22de79aa0ec72dc9` (the continuation;
  the first builder's was `agent-a9d0b021fc0378e70`, paused at `79d10c4`, never written into since)
- branch: `worktree-agent-a22de79aa0ec72dc9`, reset to `79d10c4` (from `7044f37` = `sos-s0`, stage A closed); never pushed
- `lab/*.js` **36,288 → 34,248 (−2,040; 814 of them MOVED to `tests/lib/`, so −1,226 truly gone)**
- ports: gate server 8843 (stopped by pid), geckodriver 5313

## State: DONE

1. `719aca3` — the three REAL pre-D9 fixtures (`tests/fixtures/legacy-{h2plus,helium,qcd}.lambdawaves.json`).
2. `59bb55f` — QCD deleted (−154). cornell.js keeps QUARKONIUM's solver; `restoreNotice` names a retired window.
3. `57dca21` — H₂⁺ deleted (−1,654; mo.js + twocentre.js MOVED to `tests/lib/`). Shim → MOLECULES · H₂ σg/σu.
4. `b12e920` — 57dca21's browser suites verified: molecular-names 6/6, render-regressions 2/2, current 15/15 (one timing red,
   green alone), probe h2plus + qcd clean.
5. `5baa301` — HELIUM deleted (−234). Shim → `setElement(2); fillValence();` = SPECTRUM's ATOM · He 1s.
6. `e9cb3d9` — history section 10: the three fixtures through `P.importText` + `P.open` (history 42/42).
7. `e1d3cb8` — the two shim demos made by the app (`lab/demos/h2-sigma-u`, `lab/demos/helium`) + their `.pj-demo` buttons
   (molecule-demos 5/5).
8. the docs commit — `research/release-0.5.0/D9-BUILD.md` (the H₂/ELECTROSTATICS measure, the ledger, merge notes), REPORT.md
   wave 202 under `## 2026-10-08 · 0.5.0 D — THE INFORMATIONAL'S LEDGER` at the end, CLAUDE.md's eight-line LEGACY paragraph,
   this file.

## Tests (last runs)

`bash test.sh node` exit 0, **82** suites · `node tools/new-project.mjs --check` in step (16,329 B) · `pwa --write` 183 files ·
browser on 8843/5313, alone, 4 s apart: molecular-names 6/6, current 15/15, render-regressions 2/2, history 42/42,
molecule-demos 5/5. legacy/boot was run once: 55 GREEN / 57 RED, then a crash at the B96 headless reload. Its six D9 cases are
GREEN, and it is stale elsewhere.

## Blockers

None.

## Open items (D9-BUILD.md § Open items)

H₂ and ELECTROSTATICS wait on Josh's "by use" ruling (measured: 268 and 673 own lines; reached only by opening an older file
that turned them on). Left for C7: the WGSL space-4 branch and the guarded `LW.helium` lines in capture.js / render-exact.js.
The four older demos keep closed legacy seats and a dead `mo` key. They are harmless.

## The exact next step

Claude Yan (`yan-c`) merges this branch, then runs `node tools/new-project.mjs`, `node tests/pwa.test.mjs --write`,
`bash test.sh node`, `history`, `molecule-demos` and `molecular-names`, and asks Josh the H₂ / ELECTROSTATICS question with
D9-BUILD.md's table.

## Decisions

- `cornell.js` (the QUARKONIUM Hamiltonian) STAYS: it is the render road (`digest-lock` scene `quarkonium`, link codec `T_HAM`).
- H₂⁺ cannot be a MOLECULES row: `rhf-molecule.js` refuses an odd electron count. Its shim target is MOLECULES · H₂ (STO-3G) on
  σg / σu. In a two-function minimal basis both orbitals are fixed by symmetry.
- He is covered by the RHF road (E = −2.8077839566 E_h, STO-3G), but a MOLECULES row needs a PySCF oracle row (none here), so
  HELIUM's shim target is SPECTRUM's ATOM at Z = 2 with the 1s filled.
- The WGSL space-4 branch stays until a digest-lock run can retire it (bit-identity is C7's law).
