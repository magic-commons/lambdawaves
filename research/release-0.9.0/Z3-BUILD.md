# Z3 BUILD: the field law on a device, the gated certificates, R_m (0.9.0 "Certification")

Branch `z3-field-law` from base `3434be1`. The tip is given in the commit that adds this note; its parent is `53fd511`.

## (a) The FIELD LAW line

`tests/field-law.browser-test.mjs` (0.5.4 P7c) now prints one line at its end. It prints on green and on red. If the gate throws, the error is judged RED (`F! the gate threw`), so the line still prints.

- **adapter**: `__LW.field.adapterInfo` (from `lab/field.js`, the same object the device report and the notebook read). The line takes `description`, else `vendor architecture device`. If every member is the empty string it prints `adapter info blank`; if the object is absent, `no adapter info`.
- **browser**: the page's `navigator.userAgent`, reduced to its last `Firefox|Edg|Chrome|Version/x` token. `Version/` is printed as `Safari/`.
- **commit**: `git rev-parse --short HEAD`, run in node.
- **readings**: the `h.rms`, `h.p998`, `h.worst`, `w.rms` and `w.relToRhoMax` the test already computes. Nothing is measured a second time.

The asserts (F0–F5, V1–V2) and the constants in `tests/helpers/field-law.mjs` are unchanged.

The line as printed on this run (served tree on port 9561, headless Firefox, this machine: the RTX 3070 rig named in the helper's comments):

```
FIELD LAW · adapter info blank · Firefox/157.0 · 53fd511 · hydrogen RMS 2.34e-6 · 99.8 % 1.88e-5 · worst 1.68e-4 · water RMS 8.31e-4 · worst/ρmax 2.86e-4 · GREEN
```

`GREEN field-law — 0 failing of 9`. The readings are the same as the helper's recorded figures (2.34e-6 · 1.88e-5 · 1.68e-4; 8.31e-4 · 2.86e-4).

**About the adapter field.** Firefox 157 returns `''` for every `GPUAdapterInfo` member: vendor, architecture, device and description are all blank, and `driver` is null. This was read in the page with a separate small probe. The tree has no other adapter string, so the line says `blank` and does not guess. Older Firefox builds gave `nvidia · ampere` (`research/release-0.4.0/measure/device-report-*.json`). For the acceptance matrix, the hardware has to be added by hand or come from a browser that exposes it.

**Two runs, not one.** The first run printed `no adapter info · … · 2f5b689 · …` with the same readings. The wording was wrong, because the info object exists but is blank. Commit `53fd511` fixed the wording, and the line above is from the second run. The integrator re-runs the test on 9241 at the cut and pastes that line into `docs/PROVENANCE.md`'s head. Z3 never edits that file.

## (b) The certificates

| seat | sentence added | solve field it reads | bound's source |
|---|---|---|---|
| `lab/chemview.js` **l.728** (LDA's `roXc` SCF sub-line; the only SCF line on the MOLECULES card) | `SCF converged in <n> iterations to \|ΔE\| < 1e-10` when the solve converged, else `SCF not converged after <n> iterations` | `sol.converged`, `sol.iterations` (the worker's LDA ground, `mathworker.js` `ensureSolve`) | `scf.js` `rks(…, { tol = 1e-10 })`. `moleculeRHF` passes rks no `tol`. Both of rks' converged exits (the residual test and the round-off floor) hold \|ΔE\| < tol, so the stated bound is on \|ΔE\|. It is **not** a bound on the commutator residual: on the floor exit the residual is only below 1e-6. |
| VALENCE (`chemview.js` l.212 switch, `summed()` l.658) | **no computed share: nothing added** | none | The tree never computes the share of ρ (or of Tr DS) that the valence orbitals carry. `summed()` counts orbitals (`N valence orbitals summed · K core frozen`). Computing a share would be a new computation, which this cut does not allow. |
| RHF's SCF | nothing | none | The RHF ground on the wire carries `converged` but no iteration count and no residual (`ensureSolve` sends `iterations` for LDA only). Moving them onto the wire would change the worker's reply, which goes past the row's string budget. |

Z1 owns `chemview.js:222`. Z3 changed `chemview.js` at **l.728 only**.

## (c) The R_m caption on ATOMS

`lab/atomsview.js` **l.71–72**. The Model note was shortened so the model is not named twice:

- **old**: `Model. Uses one self-consistent Xα central field per element with α = 2/3 and a Latter tail. Δ-SCF estimates ionisation energy; −ε is shown separately. A ° marks a virtual shell with an energy but no drawable radial. Position space only.`
- **new note**: `Model. One self-consistent central field per element. Δ-SCF estimates ionisation energy; −ε is shown separately. A ° shell has an energy but no drawable radial. Position space only.`
- **new caption** (one line, the strings joined at render):

  `Xα(2/3) + Latter tail · SCF to ‖ΔV·r‖ < 1e-8 · virtual shells (°) in the frozen field`

  The parts are `${EXCHANGE_MODEL}` from `atoms.js` l.73; `solveAtom`'s default `tol: 1e-8` on max|ΔV·r| (`atoms.js` l.365, the same quantity the card's SCF readout prints as `‖ΔV·r‖`); and the frozen-field wording from `atoms.js` l.405–432.

The plan's draft figure "Xα tail +6…16 % vs HF" (PLAN-DRAFT-0 l.164) is not computed anywhere in the tree, so it was not added. No test pinned the old Model note: `grep` of `tests/` and `tools/` found nothing.

## Test rows added

`tests/status.test.mjs` §5 THE CERTIFICATES:

- An LDA water ground (`W.chemGround`, `model: 'lda'`) carries `converged === true` and an integer `iterations` (7 on this machine).
- The chemview SCF sentence's template matches the source, and its typed bound equals `rks`' default `tol`, parsed from `scf.js`.
- `moleculeRHF` passes rks no `tol`, so rks' default is the bound.
- The R_m caption's template matches the source, and its typed tolerance equals `solveAtom`'s default `tol`, parsed from `atoms.js`.
- The GREEN line now ends `certificates: LDA water SCF converged in 7 iterations to |ΔE| < 1e-10 (rks' tol), the R_m caption's ‖ΔV·r‖ < 1e-8 (solveAtom's tol), VALENCE: no computed share, nothing added`.

`tests/field-law.browser-test.mjs`: the line, plus the catch that turns a throw into a RED judge.

## Gates

| gate | result |
|---|---|
| `node tests/pwa.test.mjs --write` | PASS (sw.js rehashed) |
| `./test.sh node` | exit 0, no RED/FAIL |
| `node tests/status.test.mjs` | GREEN, 491 strings, plus the certificates |
| `node tools/new-project.mjs --check` | in step (16117 B) |
| `node tools/rack-deps.mjs --classes` | exit 0 |
| `tools/status-probe.mjs` (a browser tool, run on 9561) | GREEN, 0 failing. It rewrites `research/release-0.5.4/eye/*.png`; those were restored and not committed. |
| `tools/serialize-bytes.mjs` (a browser tool, run on 9561) | DONE, 11 readings (`.tmp/serialize-bytes-z3.json`). Not compared byte-for-byte against the base, which would need a second tree. The diff touches no serialized key, only two readout strings and one note. |
| `tests/field-law.browser-test.mjs` on 9561 | GREEN, 0 of 9 failing (run twice, see (a)) |

## Δ

`lab/` 30,027 → **30,028 (+1)**, strings only: the caption line in `atomsview.js`. `chemview.js` and the Model note are changed in place. No shader, grid, evaluator or constant changed, so THE LOCK is untouched.

## Corrections to the brief

1. The plan pictures "valence holds 0.9xx of ρ". The tree computes no such share, so nothing was added.
2. "The SCF line": the only SCF line on MOLECULES is LDA's `roXc` sub. The RHF ground carries no iteration count or residual on the wire, so RHF gets no sentence.
3. The bound is on |ΔE|, not on the residual. On the floor exit rks stops with the residual below 1e-6, not below 1e-10. The sentence says `|ΔE| < 1e-10`.
4. The new sentences live in `chemview.js` and `atomsview.js`, not in `statusOf`. Putting the SCF sentence in `statusOf` would push the 110-character line over budget. So the "row in tests/status.test.mjs" holds each typed bound to its source tolerance and checks the fields on a live LDA ground, instead of adding a `statusOf` table row.
5. `status-probe` and `serialize-bytes` are browser tools, not node gates. They ran on the same served tree, so the row used five browser sessions, not one: field-law twice, the two gates, and a small probe that read the blank `GPUAdapterInfo`.
6. On Firefox 157 the adapter string is blank, so the line says `adapter info blank`. Hardware for the matrix has to be added by hand.
