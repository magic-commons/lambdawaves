# 0.7.3 K2 THE METHOD: build note (Opus builder, 2026-10-15)

Branch `k2-method`, cut from `9a0988f` (`yan-c` with K1 merged). Not pushed and not merged. The code commit is `d12e09d`, the demo commit is `edaff75`, and the tip is the commit that carries this note (`git log -1 k2-method`).

**Δ `lab/` = +44** (29,435 → 29,479 by the plan's count; budget +55; cap 29,617).
By file: chemview +38, status +3, sw +2 (`pwa --write`), verbs +1, and statesview, molecules, main and project-store +0 each.
`lab/demos/lda.lambdawaves.json` and its cover are data.

## What it does (water, measured in the gate's headless Firefox on this machine)
- **METHOD RHF → LDA** solves live in 215 ms of wall. The parts: ground 199 ms, grid and AO table 66 ms (67,950 points), SCF 128 ms over 7 iterations. Reopening the demo gave grid 59 ms, SCF 133 ms and ground 203 ms.
- **The energies:** E = −74.732041018 Eh, E_xc = −8.875980 and ∫ρ = 10.000001. PySCF RKS lda,vwn agrees to **3e-14 Eh**.
- **The head** reads "RKS LDA/STO-3G · E = −74.732041 E_h". Its STATUS line is "NUMERICAL · energy agrees with PySCF to 3e-14 Eh · ∫ρ = 10.000001".
- **The STATUS row** on DENSITY reads "RKS LDA · NUMERICAL · energy agrees with PySCF to 3e-14 Eh · ∫ρ = 10.000001 · picture good to 0.2 % of ρmax". On the Δ view it reads "RKS LDA · Δ LDA−RHF · NUMERICAL · where LDA puts more density, D_LDA − D_RHF in double precision".
- **The caption** piece is "Δ LDA−RHF · where LDA puts more density · RKS LDA · PySCF 3e-14". The STATE word follows it.
- **Switching back to RHF is free.** The kept RHF solve lands again (same object, same E −74.963023163, no worker call).
- **The stand-downs answer with sentences and throw nothing.** Under LDA, `chem.kick()` returns null and says "RT stands down under RKS LDA: its operators (the TDHF Fock build) are RHF's". `chem.vibrate({ on: true })` returns null and says the VIBRATE sentence.
- **The Δ LDA−RHF picture's range for water** is **−0.00659 to +0.00996 a.u.**: ρ_LDA − ρ_RHF from the CPU evaluator (`molecular-field.js`) at 48³ cell centres over the box (half 7.43 bohr). Both extremes sit within 0.5 bohr of the oxygen, at (−0.15, 0.15, 0.46) and (−0.15, 0.46, 0.15).
- **Screenshot:** `.tmp/k2-water-dlda.png` (not committed). It is DEMOS/LDA opened by its start with the notebook closed, the dark theme, METHOD LDA lit and VIEW Δ LDA−RHF.

## Seats
- **`lab/chemview.js`**
  - `:58–60`: `LDA_E`, PySCF's RKS energies for K1's eight (copied from `tests/fixtures/oracles/rks-v1.json`, which is not served), and the worker's three stand-down sentences.
  - `:64`: `method` and `kept`. `kept` holds this molecule's solves by key, so RHF, UHF and LDA each land once.
  - `:167–180`: **METHOD** beside BASIS.
    - The seg is RHF · UHF · LDA. A press is a hand pick, so the head shows once the solve lands.
    - `ldaWhy` holds the cap: closed shell, STO-3G, not record-only, nAO ≤ 36.
    - `methods(P)` sets the seg for the molecule. UHF shows only on H₂ STO-3G, and RHF reads UHF on an open shell. A disabled LDA carries its reason as its tooltip. A method that cannot be offered falls back to RHF, and the status line says why.
  - `:187`: VIEW **Δ LDA−RHF** (`dlda`).
  - `:248`: the fold's readout **E_xc · ∫ρ**. Its sub line is "∫ρ on the grid, N electrons · points in ms · SCF it, ms", where SCF ms = ground − integrals − grid. It is written at `:710`.
  - `:273`: the key's METHOD suffix (`|uhf`, `|lda`), next to H₂'s stretch.
  - `:323–337` (`solve`): `methods()` runs first. A kept solve lands with no worker call (`:327`). The message carries `model: method` (`:334`). Under UHF or LDA the record road is never taken (`:335`), and the LDA status says how big the grid is.
  - `:398–417`:
    - `stem`;
    - `land(r)`, the old `fill` body plus `kept`;
    - `pair()`, which returns [LDA, RHF] of this molecule;
    - `partner()`. When VIEW is Δ LDA−RHF and one half is missing (a project or demo opened on it), it solves the other half quietly with one `chem.ground` and redraws.
  - `:423–432`:
    - `views()` lights Δ LDA−RHF only on a kept pair, and calls `partner()` otherwise.
    - `uhf()`, `lda()`, and `nel()` (which keys on UHF now, not on `sol.model`).
    - `standDown()` speaks for UHF (OPEN) and for LDA. Under LDA, KICK, RUN, FLOW and PULSE take the RT sentence, TDA takes the TDA sentence and VIBRATE takes the VIBRATE sentence. The note says all of it.
  - Further seats:
    - `:445`: `kick()` under LDA.
    - `:585`: `pushMatrix` for `dlda`, kind 'signed', M = D_LDA − D_RHF from the two f64 Ds, built once per pair.
    - `:723`: `tell()`, which under LDA reads no record and uses PySCF's RKS energy.
    - `:887`: VIBRATE refuses under UHF or LDA.
    - `:932`: `presentation()`.
    - `:979`: `load()`.
    - `:1018`: `query()`, which carries `model: 'lda'`.
    - `:1029`: the caption.
    - `:1072`: `setMethod`.
    - `:1073`: `setView('dlda')`.
- **`lab/status.js:11, 20–31`**:
  - VIEW gains `dlda`;
  - under LDA the line leads with "RKS LDA", and the energy carries `∫ρ = x.xxxxxx` in the line and the head;
  - `out.lda` = "RKS LDA · PySCF 3e-14" is the caption's words.
- **`lab/verbs.js:19–25, 30, 34, 106–107`**:
  - `molecule` gains `method: '?enum rhf|uhf|lda'` (refused with a sentence where the seg does not offer it) and `view … |dlda`;
  - `view` gains `dlda`;
  - the inventory accepts an `|lda` key and prints `model: 'RKS LDA'`, `exc` and `intRho` (the method word).
- **`lab/statesview.js:184`**: the ladder request carries `model: q.model`, so under LDA the worker refuses it with its TDA sentence. MO-REGISTRY's switch then reads NO CIS STATES with that sentence.
- **`lab/windows/molecules.js:78`**: THE HEAD accepts an `|lda` key, so a METHOD press shows "RKS LDA/STO-3G".
- **`lab/project-store.js:157–159`**: STARTERS gains `['lda', 'LDA']`. The demo counts in `lab/main.js:7,43`, and `tests/opener.browser-test.mjs`, now say eleven.
- **`lab/demos/lda.lambdawaves.json`** (18,925 B) and **`lab/demos/covers/lda.jpg`** (12,627 B).
  - The demo was made by the app's own road, as BREAK was, with a throwaway in `.tmp/` (`?starter=water`, `chem.setMethod('lda')`, `chem.setView('dlda')`, the notebook's title and text, `projects.save('DEMOS/LDA')`, `exportText`). `quality` and `camera` were dropped.
  - Its chem block is BASE + `"view": "dlda"` + `"method": "lda"`.
  - The cover came from `make-covers lda`. That run also proves the open road: the cover shows the Δ, so `partner()` solved RHF on open.
- **`docs/STATE-SCOPES.md:71`**: one row, `instruments.chem.method`.

## Corrections to the brief / plan
1. **"PySCF 4e-7".** The plan's number was a guess. K1's grid is PySCF's grid point for point, so the line and caption print the measured agreement, 3e-14 for water. For a molecule outside K1's eight there is no PySCF number in `lab/`, so the word is UNCHECKED and the line has no agreement. ∫ρ is printed either way.
2. **The record road.** It is now RHF-only: UHF and LDA always solve live. Before, a UHF H₂ could in principle have been answered from an RHF record.
3. **VIBRATE.** It now also stands down under UHF. The worker already refused it there, and the card offered it anyway.
4. **`presentation()`.** It writes `method` only for LDA. H₂'s UHF stays `h2.method`, so BREAK and every 0.7.1 file keep their bytes.
5. **The STATES/drive stand-down.** MO-REGISTRY asks the worker with the LDA model and shows the worker's refusal sentence. The drive needs that ladder, so it never starts. The card does not refuse it twice.

## Dropped, and why
- **A session change.** `molecular-session.js` is untouched. A kept solve re-lands with a fresh `solveSeq`, so the session's adopt and publish laws hold as they are.
- **A per-molecule LDA prediction.** The LDA status gives the grid's point count instead. `predictedMs` is RHF's cost model, and a new model for LDA would be lines.
- **A Δ LDA−RHF button that the hand can light before both solves exist.** The button stays disabled until both are kept, as the plan says. Only a file, a link or the verb asks for it early, and `partner()` answers them.

## Merge notes
- A molecule switch while VIEW is Δ LDA−RHF keeps the view wherever LDA is offered. It solves the other half quietly, which takes 4.8 s in the worker for benzene. Where LDA is not offered, the view falls back to DENSITY.
- `tests/opener.browser-test.mjs` now expects 11 covers. I did not run it, because the brief allows one browser check. The integrator's opener run is the check.
- THE LOCK: METHOD RHF reaches the field by the same calls in the same order. `fill` became `land`, and the only addition is the `kept` map. serialize-bytes is byte-identical to the base on all 11 readings. The integrator still runs THE LOCK ×2 with `--query gastab=0`.

## Gates run (at `edaff75`, the demo commit)
- `node tests/pwa.test.mjs --write` then `./test.sh node`: **rc 0** (1061 PASS/GREEN).
- `node tools/rack-deps.mjs --classes`: rc 0.
- `node tools/new-project.mjs --check`: in step.
- `node tests/project-formats.test.mjs`: GREEN (8 judged lines; it seeds every STARTER, LDA among them).
- `node tests/molecule-head.test.mjs`: rc 0.
- `node tests/status.test.mjs`: GREEN (491 strings ≤ 110 characters).
- `node tests/uhf.test.mjs`: PASS.
- `node tools/serialize-bytes.mjs`: the K2 tree on 9391/5491 and `git archive 9a0988f` on 9392/5492, both servers stopped by pid. **11 readings byte-identical** (only the `lab` URL field differs).
- `tests/chem.browser-test.mjs` on 9391/5491, once: **GREEN, 0 failing of 56**.
- `tools/status-probe.mjs` on 9391/5491: **rc 0, 18 PASS**.
- The screenshot throwaway, `.tmp/k2-shot.mjs` (17 lines, not committed), wrote `.tmp/k2-water-dlda.png`.
