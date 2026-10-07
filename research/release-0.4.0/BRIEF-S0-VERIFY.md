# λWAVES 0.4.0 · S0 VERIFY — BRIEF for the release verifier (fresh eyes)

**Written by Fable, 2026-10-07.** S0 ends in a release: v0.3.3-alpha is cut from this tree and goes live. PLAN.md §6 says
"a verifier: release". You are a FRESH Opus with no memory of the build; the builder's own report
(`research/release-0.4.0/S0-BUILD.md`) is a claim list to test, not evidence. The contract you verify against is
`research/release-0.4.0/BRIEF-S0.md` (C1–C6) and `PLAN.md` §3 B0. You fix nothing; you report, with the reproducing
command for every finding, ranked BLOCKER (must be fixed before the cut) / SHOULD (fix in S0 if cheap, else a REPORT
line) / NOTE.

## 0 · Laws

Never edit `lab/`. Never `pkill -f`; kill by pid. Git only inside your worktree; never push. Your ports: `LW_PORT=8745`,
`GD_PORT=5213` (`python3 tools/gate/server.py <your-root> 8745 &`; ready when it prints `λWAVES gate server on …`). The
GPU is shared: one browser suite at a time; a timing flake (`current`, `wigner`, `electrostatics`) is re-run alone before
it is believed. Your worktree starts at the merged S0 tree (Fable names the commit in your prompt); confirm with
`git log --oneline -1`.

## 1 · The whole gate, once

`bash test.sh node` (expect all green; name every red with its first message). Then EVERY `tests/*.browser-test.mjs`,
one at a time, on your ports — this is the one stage where the full browser gate runs before a cut. Record suite, count,
verdict. `node tools/new-project.mjs --check`. `node tests/mir-manifest.test.mjs`. `node ~/Documents/MIR/tools/adopt.mjs
<your-root> --check` (DRIFT on `lab/mir/modulation/host.js` + `mod.js` is Josh's uncommitted upstream work and is NOT a
finding; anything else under `lab/mir` or `lab/fonts` is a BLOCKER).

## 2 · The laws of the subtraction (C3) — each a scene, each with its command

- **The manifest is true and pinned.** `MIR-MANIFEST.json` says 1.4.3; `tests/mir-manifest.test.mjs` passes; then prove
  the pin bites: copy `git show 28fe445:MIR-MANIFEST.json` over the file in a scratch copy of the test's input (or run the
  test with a temporary file via its own loader) and show it FAILS with the message that names the two-file edit. Restore.
- **Jet Black is selectable and `flat`.** In the browser: LOOK's palette picker lists "Jet Black"; choosing it draws a solid
  black body (a pixel probe on the stage canvas: the cloud's pixels are black, not a phase map); `tests/palette.test.mjs`
  gates the row (grep that the test imports the app module). `lab/mir/palette.js` is byte-identical to 1.4.3
  (`git diff 7a8fd89 -- lab/mir/palette.js` empty). A link or project naming `jetblack` opens it.
- **EDIT › COPY under a molecule copies the molecule's page.** MOLECULES on (water), EDIT › COPY the state as LaTeX is
  ENABLED (not greyed), the clipboard text (`tests/latex-copy` shows the road) carries the formula and `\varepsilon` and
  marks HOMO; with MOLECULES off it still copies the atomic register. SPECTRUM is folded, not hidden, under the molecule.
- **`.mol-more` is a fold.** Desktop first run: MOLECULES shows KICK / RUN / TDA / the spectra WITHOUT any click (the fold
  is open); on a phone viewport (`isPhone()`: narrow the window or the suite's phone scene) it is folded with a visible
  MORE control that opens it; the `Aa` button is visible with HELP off; `tests/chem` and `tests/routed-knob` no longer set
  `.mol-more.hidden = false` (grep).
- **SPECTRUM's operators.** ATOM is offered and pressing it OPENS the ATOMS window (visible, on the rack or floating);
  QUARKONIUM's button is absent; a project whose hamiltonian is `cornell` still restores (open `git show
  7a8fd89:lab/new-project.lambdawaves.json` edited to `cornell` through the import road, or set it via the API and
  serialize/restore).
- **CLAUDE.md** has no "MIR 1.4.4" line, states the first-run rack law once, carries the Cloud process line.

## 3 · The cheap bugs (C4)

- CALCULUS's ⧉ (its header copy button) puts more than a header line on the clipboard (at least one law row).
- With METERS CLOSED and STATUS TAGS ON, switching a Stark/Zeeman or masked state updates the ψ-badges within 300 ms;
  with STATUS TAGS off the badge tick does no DOM writes (a MutationObserver count over 2 s = 0 on `#badges`).
- MOLECULES on → WIGNER's and RADIATION's status say the hydrogenic register only (no hydrogenic physics drawn).
- The LINKED test exists and runs green; read REPORT's verdict (reproduced + fixed, or not reproduced + guarded) and
  check it against the test's assertions.

## 4 · Wire, don't re-date (C5)

`lab/vendor/katex`, `lab/vendor/marked.min.js`, `lab/vendor/marked-LICENSE.md`, `lab/vendor/package.json` are gone;
`lab/vendor/bse/` is intact; `lab/index.html` loads KaTeX and marked from `./mir/shell/vendor/`; the ABOUT face's licence
links resolve (click them on your server: 200). The NOTEBOOK renders `$x^2$` (KaTeX runs). `tests/wiring.test.mjs`
ALLOWLIST has no vendor rows and five shell rows with a new date and a reason naming the 0.5.0 adoption. The precache
delta the builder reports is reproduced by your own sum over `lab/sw.js`'s list at `7a8fd89` and at HEAD.

## 5 · The demos (C6)

Each of WATER, BENZENE, N₂ opens from PROJECTS › DEMOS: MOLECULES is the field owner with the right molecule, the notebook
text is present, and `lambdawaves.q0.settings` is byte-identical outside the WORKSPACE keys after the open (W129 / the
STATE-SCOPES law — compare before/after with the WORKSPACE keys removed). Benzene solves (seconds) and lands. WAVE DANCER
still opens.

## 6 · The merge itself (C1/C2)

`git log --oneline --merges -3` shows the two merges of `2a03c06` and `28fe445`; `git diff 28fe445 HEAD --stat -- lab/` is
explicable by C3–C6 alone (list anything else). `lab/sw.js` is regenerated (`node tests/pwa.test.mjs` passes without
`--write`). `frame-occlusion` ran green (Cloud's first run moved four windows onto the left rack).

## 7 · Report

`research/release-0.4.0/S0-VERIFY.md`: the gate table (suite · count · verdict), then findings ranked BLOCKER / SHOULD /
NOTE, each with its reproducing command and the law it breaks; then "fit to cut: YES / NO (because)". Commit it on your
worktree's branch. Kill your gate server by pid. Final message: the verdict line, the BLOCKER count, the SHOULD count, the
file path, your worktree path and branch.

## 8 · Harness

Compound shell with variables, loops, heredocs or backticks is refused: plain commands, scripts as files (your job tmp
dir or `.tmp/`). If a command is refused, reshape it; never retry verbatim.
