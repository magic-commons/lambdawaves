# PAIR C · BUILD (0.5.4 "Contract Layer" · P10 THE ORACLES, DESCRIBED + NODE SUITES → P11 THE LOCK'S SCOPE + THE FINGERPRINT)

Builder: Sonnet 5.5 @ high. Worktree `worktree-agent-a6cb7f03929e17b01` (reset to `fd1c10d`). Commits: P10 `7fae3dd`, P11 (see `git log`), this note. **No push, no deploy.**
`lab/**` untouched: **28,055 → 28,055** (`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`, the PAIR B method).

## 1 · The README's sources (`tests/fixtures/oracles/README.md`)

Every figure in it is read from a fixture's `provenance`, from the header of the script that wrote it, or from the test that holds the app to it — none from memory.
What it says, and where each thing came from:

| README item | source read |
|---|---|
| PySCF 2.14.0 / numpy 2.4.6, `cart=True`, bohr, `ang_to_bohr = 1.8897261245650618`, `conv_tol` 1e-13 | the `provenance` of each JSON (`library-v1`, `sto-3g-v1` incl. its `library` block, `6-31+g-star-v1`, `h2o-*.json`); `conv_tol_grad` 1e-10 / 1e-9 from `record-oracle.py`'s body and `oracle-631.py` |
| the R_d transform | `lab/md.js:3-5` (header), `:505` (`RD2`), `:508` (`rdOf`); `h2o-631pgs-cart.json`'s `self_overlap_diag`, `four_pi_over_5/15`; `tests/md.test.mjs` §5 applies it |
| library-v1 = 39 molecules, 29–120 AO, 39/39 converged by DIIS | counted from the file (`.tmp/facts.mjs`) |
| sto-3g-v1 = 6 + 2 + 54 (+ `library_d_probe` 2, `library_alh3_scan`); `C5H5N`, `CuH` `converged: false` | counted from the file; CuH's story from `tests/molecules.test.mjs:143-150` |
| 6-31+g-star-v1 = 19 molecules, 4–50 AO, "3e-12" | counted from the file; the 3e-12 is `tests/basis-631.test.mjs` line 4 and was **recomputed**: `research/molecular-waves-2026-09-18/basis/engine-631.json` vs the fixture, worst \|ΔE\| **2.96e-12 (H₂O₂)** over 19 |
| the generating script of each file, and what it reads | `tools/library/record-oracle.py` (header + body; READ ONLY, never run); `research/h2o-2026-09-11/scratch/fix-mol6.py`, `fix-mol8.py`, `fix-molecules.py`, `fix-h2o.py`, `fixgen-field.py`, `fixgen-response.py`, `fix-boys.py`, `pinned.py`; `research/molecular-waves-2026-09-18/basis/oracle-631.py` (headers, READ ONLY) |
| tolerances per file | the consuming tests: `rhf-molecules` 1e-9 / 1e-11 / 1e-7; `molecules` + `chem-sweep` max(1e-9, 3e-12·\|E\|); `md.test` 1e-12 per class, 1e-14 Boys; `molecular-field.test` 1e-12 / 1e-9 / 1e-6 / 1e-4; `rpa-inspector.test` 1e-9 / 1e-8; `tools/orbital-library.mjs:336-338` 1e-8 Eh |
| the superseded basis hashes | `sto-3g-v1.json` `bse_widened`; `lab/vendor/bse/index.json` `sha256_superseded` via `md.test` §0 |

Two things the README says that a reader might not expect: **`h2o-631pgs-cart.json` names `fee4f992…` (the superseded H, O record)**, not today's `ddcbd84d…` — the H and O decimals are
byte-identical and `md.test` §5 holds it at 1e-12 against today's record; and **`fix-mol6.py`/`fix-mol8.py` still assert the OLD basis hash and refuse to re-run** (their own provenance says so, and so does the README).
`boys-ref.json` is listed because it sits beside them, flagged as mpmath, not PySCF.

## 2 · The three suites (`bash test.sh node` picks them up by its glob: `for suite in tests/*.test.mjs`, pwa last — no list to edit)

**(a) `tests/clock-phase.test.mjs` — the phase at t ≫ 1, two ways.** Way 1 is `clockAutocorr` (exact BigInt fraction). Way 2 is written in the test and shares none of its arithmetic:
π from Machin's formula in 120-digit BigInt fixed point, the phase π·A·n̄^M/(2B n²) formed and reduced mod 2π *in that fixed point*, then a double cos/sin. Seven UNSTRUCTURED (A, B, M, n̄)
(none a ladder clock), n̄ 50 … 123 456 789, **t up to 2.72e48 rad**. **Reading: worst |Δ(re + i·im)| 1.86e-16** (n̄ = 1 000 003, A/B = 2718281/3141593, M = 8), worst arg·|A| 1.60e-16.
**Tolerance pinned: 1e-13** (≈ 500× the double rounding of the final angle, which is all that is left once the reduction is exact). The naive double road (`ladderAutocorr` at t as a double) is
printed, never gated: **worst |Δ| 0.841** — i.e. nothing. Plus the identity only exact arithmetic satisfies, **held at 0**: t a whole number of periods of every mode (lcm of n², hundreds of digits) returns
exactly re = 1, im = 0, and a further shift by 1 000 003 periods leaves re, im bit-for-bit.

**(b) `tests/qband.test.mjs` — the angular q-band, an ANCHOR.** *Our* count is computed from `coaxialPolynomial` itself: per shell, the polynomial of a generic non-nodal ring gives the labels (n, m);
the cross term Σ g_{n,m}·conj(g_{n′,m′}) (a convolution of two such polynomials) gives the occupied (ω, q) bins, ω as the integer 7200·E_n from `hydrogen.js`'s `energy`. *Sol's* count is the ledger line
(`survey/CODEX-ROUNDS.md` round 2: "351 joint density channels for n≤6 hydrogen, an exact count") with its derivation in `for CODEX/…/Angular–Bohr support and rank.md` (read-only, read once; nothing run).
**Reading — OURS 351, SOL 351, AGREE**; and every sub-count agrees on two rings (r = 10, θ = 1.0719 and r = 20, θ = 0.6): 36 labels (Sol 36), 21 at ω = 0 (21), 165 at ω > 0 (165), 15 distinct positive
gaps (15) equal to Sol's list `44 81 125 175 256 300 500 675 756 800 2700 3200 3375 3456 3500`/7200, |q| ≤ 5 at the largest gap 35/72 (5), |q| ≤ 10 at ω = 0 (10). A disagreement would fail with
"OUR COUNT DISAGREES WITH SOL'S … REPORT TO THE PILOT" and the table of both sides — and nothing is fixed on either side. **An instrument correction to report honestly:** my first draft read **349** (and 19 at ω = 0)
because I had set the "bin occupied" threshold at 1e-12 *absolute* and the genuinely tiny q = ±10 cross term g₆,₅·conj(g₆,₋₅) is ≈ 1e-12 at r = 3.1; that was my threshold, not a disagreement, and both thresholds are now
RELATIVE (1e-9; stated in the file's header). The suite checks our code against Sol's count, not Sol's proof.

**(c) `tests/flow-numbers.test.mjs` — FLOW's two numbers, tracked.** The same measurements as `molecular-flow.test.mjs` §3–§5 (its own states and its own 400 seeded points, the first 120 draws burned so the point set is
identical), on the two molecules of `sto-3g-v1.json` FLOW is driven on (benzene's RING; water's TDHF y kick; both also checked against the fixture's AO count / energy). **Readings pinned as a ±1 % band around today's, a
TRACKING pin, not a target:** benzene continuity residual ‖∂ρ/∂t + ∇·j‖/‖∂ρ/∂t‖ = **1.19379** (the current does not satisfy continuity in STO-3G on these points — the defect is the size of the signal); benzene |∫j dV|/|d(δμ)/dt| =
**0.14863** (cos 0.99996931, > 0.999 asserted); water −∫j_y dV / d(dipole_y)/dt = **0.80663** (off-axis current 1.6e-4). Honest caveat in the file: the residual is a statistic of its 400 points — another seeded 400 gave 1.2251 (+2.6 %) —
so the band is around THIS sample. The floor taper is not here; it waits for the pilot's margin.

Node gate: `bash test.sh node` → **exit 0** (run on the P10 tree and again on the final tree; 87 `tests/*.test.mjs` suites incl. the three new ones).

## 3 · The FINGERPRINT row (`tools/perf/device-report.js`) and the rig's reading

Fields of `R.fingerprint` (present in **every** report): `adapter` {vendor, architecture, device, description, subgroupMin/Max, fallback}, `driver` (+ `driverFrom`: `adapterInfo.driver`, else `.description`),
`browser` {ua, brands, vendor, platform}, `features` (adapter, sorted) and `featuresGranted` (device), `shaderF16` {offered, requested: false, granted, note — `lab/gpu-boot.js` requests limits only},
`limits` (the adapter's, all numeric ones) and `limitsGranted` (the device's) and `limitsRequested`, `format`/`preferredFormat`, and `digests`: `fieldDigest` of **two states at 64³** (`1s+2pz` and MOLECULES · H₂O density,
both at t = 3.7, entered as `digest-lock.mjs` enters them, each digested twice with a reconstruct between). The digests REPLACE the register and the molecule, so they run only on `&only=fingerprint` /
`__LW.report({ only: 'fingerprint' })` (or `{ fingerprint: true }`), LAST; the default report says `digests: { skipped: … }`. They skip over a current project / unsaved changes unless `force`, put the state back with
`__LW.restore(snapshot)`, clear the undo ring to one row (it cannot be written back; `restored.history` says so when it held more), and put the autosave key `lambdawaves.q0.session` back byte-for-byte (or remove it).
Nothing in the row is a lock: the header says machines are compared, the lock stays same-machine.

**The rig's reading** (this rig: Firefox 157, Linux, the RTX 3070 box; headless gate driver): `adapter` vendor/architecture/device/description are **empty strings** (Firefox does not expose them; subgroup 4–128, not a
fallback), so `driver` is **null** and `driverFrom` null — the row says the browser gives neither; `browser.ua` = `Mozilla/5.0 (X11; Linux x86_64; rv:157.0) Gecko/20100101 Firefox/157.0` (no `userAgentData`);
`features` = bgra8unorm-storage, core-features-and-limits, depth-clip-control, depth32float-stencil8, dual-source-blending, float32-filterable, indirect-first-instance, rg11b10ufloat-renderable, **shader-f16**,
texture-compression-bc, texture-compression-bc-sliced-3d, timestamp-query; **`shader-f16` offered: true · requested: false · granted: false**; `featuresGranted` = [core-features-and-limits]; 35 adapter limits
(maxTextureDimension3D 16384, maxStorageBufferBindingSize 2147483644, maxComputeWorkgroupStorageSize 49152 offered / 32768 requested …), `format` bgra8unorm.
**`fieldDigest` at 64³, t = 3.7: `1s+2pz` = `4d36a9a5` (integral 0.99806, maxRho 0.068398) · MOLECULES · H₂O density = `386430a4` (integral 9.5957, maxRho 15.061)**; both `repeat: true`, `nan 0`.
The row was run three times on the rig, not once (the first exposed that its state change left `lambdawaves.q0.session` written and the undo ring at 4 rows; the second that the autosave is booked after the put-back, so it is now put back last, in `measure`'s `finally`; the third is the final row), plus one
short default-road run (`scenes: false, gpu: false`: facts present, digests `skipped`, `restored` all identical); **the two hashes were identical on all three runs**, and the final run's `restored` block reads `serialize`, `settingsKey`, `localStorage`, `history`, `project` all "identical", `errors: []`.

## 4 · THE LOCK ×2 (on the P11 tip, my gate server on 9053 by pid, `LW_PORT=9053 GD_PORT=5523`, `rigfree.mjs` free before each; the fixtures never touched)

- `node tools/perf/digest-lock.mjs --check --query gastab=0` → **DIGEST LOCK GREEN: 860 values compared · 0 readback differences · 0 record-byte differences** · unrepeatable none · page errors 0 · 59 s.
- `… --check --fixture research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` → **DIGEST LOCK GREEN: 1004 values compared · 0 readback differences · 0 record-byte differences** · unrepeatable none · page errors 0 · 60 s.
- A cross-check the lock gave for free: its `chem` state at 64³ reads `386430a4`, the same hash the FINGERPRINT row reads for MOLECULES · H₂O (the row enters the state the way the lock does).
- Node gate on the final tree: `bash test.sh node` → **exit 0**.

## 5 · Lines, and what could not be measured

- `lab/` **28,055 → 28,055 (+0)**, by construction: the commits touch `tests/` (4 files), `tools/perf/digest-lock.mjs` (a header sentence), `tools/perf/device-report.js` (+ the row) and this note.
- The lock's scope sentence was NOT already in `digest-lock.mjs`'s header (it had the counts and "machine-specific", not R7 as a ruling): added, one sentence, naming 860 + 1004, same-machine, never re-baked by a maths row.
- Could not measure: the FINGERPRINT on any other machine (one rig only; Safari/Chrome return `description`/`driver` where Firefox returns nothing, so `driverFrom` is for them to fill); whether `hash` equality across GPUs is
  expected (it is not claimed); the q-band suite does not touch Sol's proof, only the count; the continuity residual's sample dependence is a fact of the statistic, not repaired here.
- `research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md` was grepped for the q-band number as the brief said and **does not contain one** (it is the symmetry/ERI ledger); Sol's q-band count lives in the CODEX round-2 files, cited above.
