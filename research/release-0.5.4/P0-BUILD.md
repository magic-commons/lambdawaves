# P0-BUILD — TRUTH + THE CLAIMS INVENTORY (0.5.4 "Contract Layer")

Builder: P0 (Haiku 5.5). Branch `worktree-agent-a86ea3da103422d21`, reset to `03f9802` (the `sos-s0` integration tip). One commit, "P0: …". No push. No browser, no GPU, no lock run (no code moved, no key, no field code).

Every seat below was found by its words with grep; the line numbers are as of the P0 tip. Where a seat the brief or the plan names is not where it was said to be, §4 says so.

## 1 · Sentences changed (old → new, file:line, and the grep that proves it)

Each old sentence is replaced in place, not joined to the new one. Items 9 and 10 are declared producer headers the brief asks for: they add lines, and they are counted in §3.

| # | file:line (tip) | old → new | proof (new present · old gone) |
|---|---|---|---|
| 1 | `lab/molecular-session.js:15-18` | the RULES list named three ranks (tdhf 0, orbital-packet 1, ground 2) → four ranks, matching `MODEL_RANK` (line 43: tdhf 0, states 1, orbital-packet 2, ground 3); a `states` line added (+1) | `grep -n "ground         rank 3"` → 18; `grep -c "ground         rank 2"` → 0; `grep -c "orbital-packet rank 1"` → 0 |
| 2 | `lab/molecular-session.js:26` (THE STAMP) | "carries the molecule's basis+geometry hash and the producer's solve sequence." → "carries the molecule's basis hash and the producer's solve sequence; geometry rides the sequence." The session compares `p.hash` against `mol.hash` only (line 138) and `p.solution` against the solve sequence. | `grep -n "basis hash and the producer"` → 26; `grep -c "basis+geometry"` → 0 |
| 3 | `README.md:82` | "a transport with four clocks" → "a transport with one clock" (one clock since 0.5.0 C4: `lab/shell/controller.js:149`, "ONE clock — every play edge") | `grep -n "transport with one clock"` → 82; `grep -c "four clocks"` → 0 |
| 4 | `README.md:150` | "54 library entries with 52 enabled" → "54 catalogue entries with 52 enabled (38 library records, each with a PySCF oracle)". Proof of the counts: `MOLECULES.length` 54, `SOLVABLE.length` 52 (node import of `lab/molecules.js`); `lab/library.json` rows 38; `lab/library/*.json` files carrying `"oracle"` 38 of 38 | `grep -n "54 catalogue entries with 52 enabled"` → 150; `grep -c "54 library entries"` → 0 |
| 5 | `docs/NOTES-FOR-AGENTS.md:98` (the lock bullet; the command on :99–100 is unchanged) | "The digest lock proves a change leaves the field's pixels identical across states × grids × styles × lines:" → the same claim, scoped: SAME-MACHINE; 860 values with `--query gastab=0`, 1004 with the s4a fixture; ≤ 64 AO tile states; "no time-dependent molecular packet, STATES run, FLOW or `record()` is in it" | `grep -n "SAME-MACHINE"` → 98; `grep -c "across states × grids × styles × lines:$"` → 0 |
| 6 | `CLAUDE.md:320-322` (the THE CONTEXT paragraph, where the lock is described; there is no paragraph headed THE LOCK) | "THE LOCK's 1004-value fixture (…)" → "THE LOCK is SAME-MACHINE (860 + 1004 values, ≤ 64 AO tile states; no time-dependent molecular packet, STATES run, FLOW or `record()` is in it). Its 1004-value fixture (…)". `grep -n same-machine CLAUDE.md` found nothing before this edit. | `grep -n "THE LOCK is SAME-MACHINE"` → 320; `grep -c "THE LOCK's 1004-value"` → 0 |
| 7 | `lab/windows/readouts.js:87` (the FLOW caption; the brief said `lab/readouts.js`, which does not exist) | "· sense exact, magnitude qualitative in STO-3G`" → "· sense exact, magnitude qualitative in STO-3G and 6-31+G\*`" | `grep -n "STO-3G and 6-31+G"` → 87; `grep -c "qualitative in STO-3G\` })"` → 0 |
| 8 | `lab/molecular-flow.js:16-17` (header) | kept "within one frame they ride a frozen field (D(t) is rebuilt once a frame)."; added "THE FROZEN-FRAME STEP ERROR and THE SPEED CAP (`step`'s `cap`) are covered by NO oracle." Proof: `tests/molecular-flow.test.mjs` calls only the TDHF engine's `eng.step()` (:117–118); no test reaches the tracer `step` or its `cap`. | `grep -n "covered by NO oracle"` → 16 |
| 9 | `lab/molecules.js:9-10` (header; ADDED, +2) | energy reference and kernel: PySCF's energy (STO-3G `oracle.delta`, `tests/fixtures/oracles/sto-3g-v1.json`; 6-31+G\* against `6-31+g-star-v1.json`); kernel S (shells + a coefficient buffer); the four roads M · S · W · RU cited to `research/release-0.6.0/PLAN.md` §B | `grep -n "ENERGY REFERENCE AND KERNEL" lab/molecules.js` → 9 |
| 10 | `lab/field.js:13` (the hydrogen kernel's header; ADDED, +1) | energy reference: the closed form, `hydrogen.js` `energy` = −1/(2n²) Eh (`lab/hydrogen.js:29`); kernel M (Mode records, closed forms in-kernel) | `grep -n "ENERGY REFERENCE AND KERNEL" lab/field.js` → 13 |
| 11 | `lab/molecular-flow.js:17` (header; ADDED, +1) | energy reference and kernel for FLOW: none of its own; the TD-CIS pair density it reads is cited to PySCF's transition RDMs in `proving/LEDGER.md` (not in this tree) and no test here checks it; kernel W (tracers are lines from f64) | `grep -n "ENERGY REFERENCE AND KERNEL" lab/molecular-flow.js` → 17 |

Items 1, 2, 8 and 11 sit in one file or in consecutive lines of it; each has its own line in the table so the grep for it is unambiguous.

## 2 · CLAIMS.md

`research/release-0.5.4/CLAIMS.md`: **11 rows**, changed by **nobody** on every row (R11 for the five RECONNECTION strings; the rest listed until Josh's word). The grep that finds each row's seat, run at the P0 tip:

| row | sentence | grep (line) |
|---|---|---|
| 1 | RECONNECTION CENSUS | `grep -n "RECONNECTION CENSUS" lab/vortex.js` → 27 |
| 2 | JUMP TO EVENT title | `grep -n "Jump to the next reconnection time" lab/vortex.js` → 29 |
| 3 | "A double root marks a reconnection." | `grep -n "A double root marks a reconnection" lab/vortex.js` → 30 |
| 4 | preset label "(reconnection)" | `grep -n "(reconnection)" lab/state.js` → 458 |
| 5 | preset note "vortex lines reconnect at ten points" | `grep -n "vortex lines reconnect at ten points" lab/state.js` → 458 |
| 6 | FLOW caption | `grep -n "magnitude qualitative in STO-3G and 6-31+G" lab/windows/readouts.js` → 87 |
| 7 | FLOW switch title "a minimal basis" | `grep -n "magnitude is qualitative in a minimal basis" lab/statesview.js` → 113 |
| 8 | MODEL sheet STATE line | `grep -n "register contains the 91 hydrogen basis states" lab/index.html` → 129 |
| 9 | EXACT badge over a molecule (b1) | `grep -n "mk('exact', 'STATE · EVOLUTION · SHADOW')" lab/badges.js` → 19 |
| 10 | geometry count (fixed experimental geometry) | `grep -n "at a fixed experimental geometry" lab/chemview.js` → 222; the count: `grep -l UNVERIFIED lab/library/*.json \| wc -l` → 36 of `ls lab/library/*.json \| wc -l` → 38 |
| 11 | stageCaption silent when STAGE FORMULA is off | `grep -n "It follows the STAGE FORMULA switch" lab/shell/stage-words.js` → 24; `grep -n "return '';" lab/shell/stage-words.js` → 26 |

## 3 · Lines

`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: **before 28,018; after 28,023; +5** (the budget; the stop line is +8, not reached).

By file: `molecular-session.js` +1 (the `states` rank line), `molecular-flow.js` +1, `molecules.js` +2, `field.js` +1; every other edit replaces a sentence in place (0). `lab/sw.js` was re-stamped by `node tests/pwa.test.mjs --write` after the last `lab/` edit: 10 lines changed, 0 net. The pwa suite passed (`.tmp/pwa.log`).

## 4 · Seats not found, or found elsewhere

1. **`lab/windows/state.js` header sentence on the stored state: NOT FOUND.** That file has no such sentence. The nearest is `lab/state.js:5-6` ("The register stores the anchor c(0) and evaluates c(t) in closed form; … with no accumulated rounding and an exact scrub"), which is true of the f64 register. Not changed.
2. **The plan's `state.js:58`** (PLAN §E, DRAFT-2 P0): `lab/state.js:58` is `export const N = BASIS.length; // 91` at this tip and at `v0.5.2-alpha`. No contradicted sentence there. Not changed.
3. **README "the precision claim" and "the lock's scope": NOT FOUND.** PLAN-DRAFT-2 §1 names no README sentence. The plan's P0 row names README:82 and :150, both changed (§1 items 3–4). `grep -n -i lock README.md` finds only "style lock" (line 191); no README sentence states the lock's scope.
4. **The five RECONNECTION strings are not in `lab/windows/state.js`.** The preset label and note are `lab/state.js:458`. The three `vortex.js` strings are as named. Changed by nobody (R11).
5. **FLOW caption** is `lab/windows/readouts.js:87`; `lab/readouts.js` does not exist.
6. **MODEL sheet** is `lab/index.html:128-133`; `lab/badges.js:15` only opens it (`sheetToggle`).
7. **Producer headers not done:** `lab/state.js`, `lab/molecular-register.js`, `lab/orbitalsview.js`, `lab/density.js` (PLAN-DRAFT-2 P0's list). The brief names three producers; the budget was spent on those. The next row or the integrator should add them.
8. **Same contradiction, not in my six groups:** `lab/rack.js:4` and `:11` ("Four clocks (§12)", "the four clocks"), against one clock since 0.5.0 C4 (`lab/shell/controller.js:149`). Not changed (budget; outside the groups). For the integrator.
9. **`lab/statesview.js:113`** ("its magnitude is qualitative in a minimal basis"): listed as CLAIMS row 7, not changed; it now disagrees with the FLOW caption.
10. **The brief's "no packet" is false as written.** The digest lock's states include hydrogen's BOX packet and lysine's HOMO by ORBITAL (`tools/perf/digest-lock.mjs` header). The sentences say "no time-dependent molecular packet, STATES run, FLOW or `record()`" for that reason.
11. **TD-CIS density's PySCF check:** `lab/molecular-register.js:14` cites `proving/LEDGER.md` (certified against PySCF's transition RDMs). `proving/` is not in this tree, and no `tests/` file names a transition RDM. The FLOW energy line says so; it does not claim "no oracle" for the density.
12. **The NOTES command** still names `research/optimization-2026-09-24/digest-lock-base-w125.json`, which is neither the 860 nor the 1004 fixture. The command is unchanged; the scope sentence above it gives the two counts.

## 5 · Gate

`bash test.sh node`: **exit 0** (run at the P0 tip after the last `lab/` edit and the pwa re-stamp; no FAIL line in the log).
