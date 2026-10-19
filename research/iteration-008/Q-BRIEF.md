# Q · THE SMALL CUTS OF 10-19 (iteration 008, branch `it008-cuts`, gate server 9691 / GD 5691; from F's merge)

Josh's answers of 2026-10-19 to the FOR-JOSH note's calls. Three small rows in one branch; one commit each.

Read first: CLAUDE.md (THE PICKER paragraph; THE STAGE FORMULA paragraph's "closed on a first run and for a profile older than it"; THE
LOCK paragraph; the scopes paragraph), `A-BUILD.md`, `S-BUILD.md` (FOR JOSH: FIELD opens for an older profile), `G-BUILD.md` (KNEE's
measure), `lab/windows/spectrum.js` `fillValence` (:312), `lab/picker.js` :346, `lab/atoms.js` `groundConfig` and the records' `core`,
`lab/informational.js` (HOW it stays closed for an older profile — the same road for FIELD), `lab/windows/static-field.js`,
`lab/field.js` (`kneeQ`, `kneeT`, v[31]), `lab/windows/material.js` (the KNEE knob), `lab/shell/modulation.js` (`material.knee`'s def),
`lab/new-project.lambdawaves.json` (`"knee": 0.6`) and `tools/new-project.mjs`, `tools/flash-calibrate.mjs`, `tools/perf/digest-lock.mjs`.

## Build
1. **LOAD VALENCE loads every valence subshell.** Josh: "Load all the subshells, the thumbnail only shows the highest orbital." `fillValence`
   (its name kept; the Picker's press and the ATOMS button are the same road) loads EVERY subshell outside the noble-gas core (`groundConfig`
   minus the core's — Fe: 4s AND 3d; Au: 4f, 5d AND 6s), every m of each, each shell's electrons' weight in phase as today's one-shell fill
   does for its m's; the status line names them ("Fe · 4s² 3d⁶ loaded"); the Picker's tile picture stays the HIGHEST orbital alone
   (`valence.js` untouched). An element whose valence names a shell past the basis (n = 7 before A7 lands) loads what the basis holds and
   says so.
2. **FIELD stays closed for an older profile.** Josh: yes. Use INFORMATIONAL's own road (read how `informational.js` tells "a profile older
   than me" from "has me open" — a key in its own record or the WORKSPACE row's absence) for `staticfield`; a profile that has saved a
   layout with FIELD open keeps it open; a first run closed as now. No new preference family if the existing mechanism serves.
3. **KNEE's default: somewhat opaque, slightly see-through.** Josh's words. Choose the default ABOVE 0.6 (G's soft shoulder) by measure on
   hydrogen 2pz and benzene's HOMO at the shipped EXPOSURE: the core's transmission at the default lands around 10–20 % (the eye reads
   "slightly see-through"), the lobes behind a dense core just visible; record the candidates you tried with a screenshot each. Then move
   the default everywhere it lives — `field.js` (the shader's fallback and `kneeQ`'s pivot stays 0.6: q = ln(KNEE/0.6) is the formula, not
   the default), the KNEE knob's def in `material.js`, `material.knee`'s def in `modulation.js`, `lab/new-project.lambdawaves.json` through
   `tools/new-project.mjs` (and `--check`), `tests/new-project.test.mjs` if it names the number. Rerun `tools/flash-calibrate.mjs` and say
   whether the knee step moved (the formula did not, the operating point did); the four guarded routes stay four. THE LOCK ×2
   (`--query gastab=0`): the CLOUD rows move by design — re-capture them BY NAME with the tool's own JSON writer (W's and G's road, never
   `--write`), say exactly which rows, and prove every iso-style, flag, line and state row held to the bit; the counts stay 843 + 987.

## Light check
Screenshots: Fe loaded (the state grid), FIELD closed on a scratch older profile and open on a saved layout, KNEE at the new default on both
subjects beside 0.6. `./test.sh node`, THE LOCK ×2, flash-routes, `field-law`, `new-project` (node and browser), `history`, `atoms` node
suite, `start`. Report: worktree · branch · commits · tests · blockers · next.
