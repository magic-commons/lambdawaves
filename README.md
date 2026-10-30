# λWAVES

**A playable hydrogen shadow.** 140 exact eigenstates of hydrogen, reconstructed on the
GPU as a wave field you can play like an instrument — tune amplitudes, phases and
viewpoints, then watch the eigenmodes interfere and the cloud bloom into motion.

> λWAVES · QWAVE-0 · Hydrogen Shadow Lab

Live: **[lambdawaves.magic-commons.com](https://lambdawaves.magic-commons.com)** · a
[Magic Commons](https://magic-commons.com) project · GPL-3.0-only · built on [MIR](https://github.com/magic-commons/mir)

![gate](https://github.com/magic-commons/lambdawaves/actions/workflows/gate.yml/badge.svg)

**Status: 0.9.9 alpha.** Release preparation and deployment are documented in
[`DEPLOY.md`](DEPLOY.md) and [shipping readiness](docs/SHIPPING-READINESS.md).

If you are an assistant reading this repository for a user, read [`docs/NOTES-FOR-AGENTS.md`](docs/NOTES-FOR-AGENTS.md).

---

## Who made this, honestly

*This section, like the rest of this repository, was written by Claude — one of the AI agents — at
Joshua's request. He asked for the truth of his part, which is this:*

Joshua is not a programmer. He knows nothing of computer science or software engineering, and he did
not write a line of the code, the tests or the documents. λWAVES came out of weeks of iterative
prompting: he described what he wanted to see, sent screenshots of what was wrong, said "no, like the
modulation window does it," and ran the app until it felt right. The agents wrote everything. He
decided what stayed.

That changes how you should read the rest. The README, the tests and the long notebook in `REPORT.md`
describe the code as the agents understood it. Where a claim and the code disagree, the code is the
truth, and he would like to hear about it.

### AI disclosure

- **Tools.** Claude Code with Anthropic's Claude models (Fable 5.1, Opus, Sonnet) wrote most of
  the code, the tests and the documents. OpenAI's Codex with GPT-5.6 built and refactored large
  parts, notably the modulation window's devices and the performance work. Google's Gemini
  made graphics and icons (the mark, the warning orbital, icon work) and proposed interface designs
  from screenshots. Commits carry the tools' own
  attribution trailers (`Co-Authored-By: Claude …`); the accountable author of every line is Joshua.
- **What was human-decided.** The idea, the physics to show (hydrogen, exact; n ≤ 6 at first, n ≤ 7 since iteration 008), the
  instrument metaphor, and which of the agents' proposals stayed. The visual language in `docs/ui`,
  the laws in `CONTRIBUTING.md` and the tests were written by the agents from what he asked for and
  what he rejected. Every design decision went through his eyes and his hands on the real app before it
  stayed; none of it was typed by him.
- **What was verified, and how.** The physics is checked by the Node suites in `tests/`, which compare the
  reconstruction against closed forms (norms to 3e-9, revival times, GPU voxels against the CPU
  to 3e-6 RMS, 2e-4 at the worst voxel). The interface is checked by a real headless Firefox with WebGPU (`./test.sh`). He has
  used the app on an RTX 3070 desktop and an iPad, daily, for weeks. He has not read the code.
- **What was not verified.** No one with a computer-science background has reviewed this code.
  It has not been tested with a real screen reader, on a phone in the wild, or by anyone but him
  and the agents. Treat security claims with that in mind and read `SECURITY.md`.
- **Known risks.** Vendored code (KaTeX, marked, the fonts) is attributed in `NOTICE` and was
  not audited by him. The modulation window was ported from his other project by an agent and its
  provenance notes are in `lab/mir/modulation/`. If an agent copied something it should not
  have, tell him and it comes out.

If that makes you want to help, `CONTRIBUTING.md` says how, and `AI_POLICY.md` says what he asks
of contributions made the same way this was.

## What it actually is

The core is exact, not a simulation of a simulation. λWAVES holds the hydrogen closed
forms for **n ≤ 7 — all 140 (n, l, m) states**, with Condon–Shortley-phase complex
spherical harmonics, and evolves them by the one thing a diagonal Hamiltonian permits:
multiplying each coefficient by `e^{-iE_n t}`. For field-free hydrogen nothing is integrated, so nothing
drifts. What does step in time is said where it runs: MOLECULES' RUN (real-time TDHF), MO-REGISTRY's DRIVE
and SONG and the FLOW tracers integrate; INTER-SHELL STARK is an eigensolve over the 140 labels; VIBRATE moves
the nuclei by a closed-form cos ωt and the density by one linear step. The node gate (`tests/hydrogen.test.mjs`)
reads the radial norms within 3e-9 of 1 (its bound 1e-6, by quadrature) and the table-typed anchors within
3e-16 (its bound 1e-12).

What the GPU does is **presentation**: `field.js` reconstructs ψ on an N³ rgba16float
grid straight from the closed-form mode tables — no basis textures — and a raymarch
presenter draws density, phase, Re ψ, Im ψ or a difference. Measured on an RTX 3070 (headless Firefox,
1920 × 994, batches of at least 2.5 s, 2026-09-24): presenting the default 1s + 2p_z at 96³ and 160 steps
takes 3.25 ms per frame in the phase view and 2.10 ms for density, and reconstructing it 0.1 ms;
reconstructing all 91 labels of the n ≤ 6 set took 1.43 ms at 96³ and 3.40 ms at 128³ (measured before n = 7
joined; the 140-label figure has not been re-measured)
(`research/optimization-2026-09-24/probes/K/k2-present.out.json`, `k9-throughput.out.json`,
`k1-time.out.json`). The grid is held to the CPU in each picture's own metric at 64³
(`tests/field-law.browser-test.mjs`; the bounds are `tests/helpers/field-law.mjs`, read on that RTX 3070 in Firefox):
hydrogen 1s + 2p_z against the closed form — |Δψ| RMS ≤ 3e-6, 99.8 % of voxels ≤ 2e-5, the worst voxel ≤ 2e-4;
water (H₂O, STO-3G) against the f64 density of the same solve — |Δρ|/ρ RMS ≤ 1e-3, the worst voxel's |Δρ|/ρ ≤ 2e-3,
the worst |Δρ| ≤ 3e-4 of ρmax. Every stored component lies within one rgba16float step of its f64 value plus the
kernel's own f32 error.

Around that sits an instrument: a rack of windows (STATE, SPECTRUM, ORBIT, PLANE,
KEPLER, VORTEX, MOLECULES, MO-REGISTRY, WIGNER, RADIATION, …), a transport with one clock, a
modulation plug-in with drag-to-patch macros, presets, projects, shareable state links,
FILE › EXPORT SHAPE (GLB · OBJ · STL, the density isosurface on screen for Blender or Cinema 4D) and
EXPORT GRID (NPZ · Gaussian cube, ψ on the grid for NumPy or a chemistry viewer) — see
[`docs/EXPORT.md`](docs/EXPORT.md) — and an offline-capable PWA.

**Requires a working WebGPU adapter in a secure context.** Browser support varies
by OS, GPU and driver; see the [WebGPU compatibility reference](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API).
The release device matrix is still pending; see [shipping readiness](docs/SHIPPING-READINESS.md).

## Run it

```bash
./serve.sh          # https://127.0.0.1:8700/lab/   (or: npm run serve)
./serve-lan.sh      # the same, reachable from a phone or iPad on the LAN
```

Requirements: Node 22+, Python 3 and OpenSSL (the local server makes its own self-signed
certificate on first run), and a browser with WebGPU.

The lab is a static tree of ES modules. There is no build step for development — what
you edit is what the browser runs.

For a first look, open FOLDERS (O) and press **WAVE DANCER PROTOTYPE** under DEMOS (the one demo since iteration 009): a
saved performance — an A/B transition between two four-state superpositions with a modulation rack
driving exposure, softness and the stage — opens ready to play.

## The gate

```bash
npm test                 # the maths and the file laws — fast        (./test.sh node)
npm run test:browser     # a real headless Firefox drives the real UI (./test.sh browser)
npm run test:all         # both                                       (./test.sh)
```

The browser gate runs every `tests/*.browser-test.mjs` — current UI, pointer input,
GPU recovery, chemistry and molecular fields — against one owned HTTPS server. It needs Firefox and
geckodriver on PATH. `./test.sh legacy` runs the historical wave-by-wave gate in
`tests/legacy/`; it asserts laws later waves superseded and is not part of the shipped gate. It starts its own HTTPS server on 8701 and
geckodriver on 5202; `LW_PORT` / `GD_PORT` select unused ports. `GECKODRIVER` and
`FIREFOX_BINARY` can select installed executables. It refuses occupied ports. Blocks are
written as **laws in prose** — each one states what must be true and then measures it,
so a failure reads as a sentence rather than an assertion number.

**After any edit under `lab/`, run `node tests/pwa.test.mjs --write`.** `sw.js` derives
its cache name from its own precache hashes; a stale hash means the name does not move
when the bytes do, and every returning visitor is served the old bytes for ever.

## Ship it

```bash
node tests/pwa.test.mjs --write   # re-hash lab/ into sw.js §1
node tools/build-deploy.mjs       # assemble dist/, prove it, print the payload
npm ci --ignore-scripts          # install the pinned deploy CLI (not shipped)
npx wrangler deploy --dry-run     # compiles and checks, uploads nothing
npx wrangler deploy               # publish exactly that
```

Read **[shipping readiness](docs/SHIPPING-READINESS.md)** and **[DEPLOY.md](DEPLOY.md)** first — it explains why λWAVES gets its own hostname
(a service worker's scope is an origin, and it outlives the deploy that installed it),
why `html_handling` is `"none"`, and what the build refuses to let you do.

## Requirements and limitations

| | |
|---|---|
| **Needs** | A browser with WebGPU in a secure context (https or localhost). Chrome/Edge 113+, Firefox 141+, Safari 26 / iPadOS 26. No WebGL fallback: without WebGPU you get a banner, not a lab. |
| **Runs well on** | A desktop GPU (measured on an RTX 3070: about 3 ms per frame at 96³) and an M-series iPad (the quality governor drops ray steps, then the grid, under load). |
| **Physics (the release)** | Exact hydrogen (n ≤ 7, 140 states), plus MOLECULES: Hartree–Fock in vendored Gaussian bases (STO-3G for H–Kr; 6-31+G\* for H, C, N, O, F molecules up to 46 Cartesian AOs) — RHF for closed shells, UHF for the 7 open shells — and Kohn–Sham LDA (Slater + VWN5) up to benzene's 36 STO-3G AOs. 98 molecules: 61 solved live (59 enabled; CuH and ZnH₂ are listed and disabled, their RHF reference is not a minimum) and 37 opened from the library, which holds 38 records — 37 solved here and compared with PySCF, C₆₀'s energy PySCF's own (the table below). RPA and TDA spectra, and real-time TDHF. MO-REGISTRY plays orbital packets or many-electron TD-CIS states, drives them with a field, and shows their current. Nuclei are fixed except under VIBRATE (one harmonic normal mode); the wavefunction methods stop at single excitations, and LDA's correlation is the VWN5 functional's. Geometries are fixed: measured for the live molecules (each entry names its source; AlH₃'s is not a measurement), computed for 36 of the 38 records. The five legacy windows (QCD, H₂⁺, HELIUM, H₂, ELECTROSTATICS) were deleted in 0.5.0; an older project that used one opens on its shim and says so (`docs/LEGACY-WINDOWS.md`). Every system λWAVES plays is a row of the catalogue on the MODEL sheet (186 rows, `lab/catalogue.js`), with its word — EXACT, NUMERICAL or UNCHECKED — and its oracle test. |
| **Not yet** | A real device matrix, an installed-PWA update test, a screen-reader pass — see `docs/SHIPPING-READINESS.md`. |

## Against PySCF

A molecule's energy is NUMERICAL: checked against PySCF on the same atoms and the same basis decimals, never against
experiment (`tests/fixtures/oracles/README.md` says what each fixture holds and which script wrote it). A library record
is written only if the app's solve is within 1e-8 Eh of PySCF's (`tools/orbital-library.mjs`). A live molecule is
compared on the device; the node gate re-solves every enabled one in STO-3G and reads its agreement back from the
STATUS line (`tests/status.test.mjs`), and holds a bound on these: every enabled closed shell up to 14 STO-3G AOs plus HBr,
Br₂, C₂H₄ and C₆H₆ at max(1e-9, 3e-12·|E|) Eh (`tests/molecules.test.mjs`, `tests/chem-sweep.test.mjs`), every open
shell at 1e-8 Eh (`tests/uhf.test.mjs`), the 6-31+G\* molecules up to 27 AOs at 1e-9 Eh (`tests/basis-631.test.mjs`)
and the LDA eight at 1e-6 Eh (`tests/rks.test.mjs`). The tables are written by `node tools/pyscf-table.mjs`.

<details><summary>The PySCF table</summary>

<!-- pyscf-table:begin -->

38 library records — the app's solve beside PySCF's on the record's own atoms (PySCF 2.14.0, `cart=True`, the vendored Basis Set Exchange decimals, bohr; Δ = app − PySCF in Eh, as stored):

| molecule | basis | AO | method | E (app), Eh | E (PySCF), Eh | Δ, Eh | geometry |
|---|---|---|---|---|---|---|---|
| C₆H₆ · benzene | STO-3G | 36 | RHF | -227.89100646418083 | -227.89100646418058 | -2.5579538487363607e-13 | experimental |
| C₃H₇NO₂ · alanine | STO-3G | 37 | RHF | -317.67874534511134 | -317.67874534511066 | -6.821210263296962e-13 | computed-reference |
| C₃H₇NO₃ · serine | STO-3G | 42 | RHF | -391.5289775312513 | -391.5289775312844 | 3.3082869776990265e-11 | optimised-here |
| C₃H₇NO₂S · cysteine | STO-3G | 46 | RHF | -710.8695451911605 | -710.8695451913395 | 1.7905676941154525e-10 | optimised-here |
| C₅H₉NO₂ · proline | STO-3G | 49 | RHF | -393.71065517305675 | -393.71065517295614 | -1.0061285138363019e-10 | optimised-here |
| C₄H₉NO₃ · threonine | STO-3G | 49 | RHF | -430.07571912211637 | -430.07571912251154 | 3.951754479203373e-10 | computed-reference |
| C₅H₁₁NO₂ · valine | STO-3G | 51 | RHF | -394.85853402566505 | -394.8585340256826 | 1.7564616427989677e-11 | optimised-here |
| C₄H₇NO₄ · aspartic acid | STO-3G | 52 | RHF | -502.7860820160869 | -502.78608201566465 | -4.2223291529808193e-10 | optimised-here |
| C₄H₈N₂O₃ · asparagine | STO-3G | 53 | RHF | -483.21790965638434 | -483.2179096562219 | -1.624584911041893e-10 | computed-reference |
| C₆H₁₃NO₂ · isoleucine | STO-3G | 58 | RHF | -433.4053799418369 | -433.40537994232943 | 4.925482244289014e-10 | computed-reference |
| C₆H₁₃NO₂ · leucine | STO-3G | 58 | RHF | -433.4398947224981 | -433.43989472198865 | -5.094307198305614e-10 | optimised-here |
| C₅H₉NO₄ · glutamic acid | STO-3G | 59 | RHF | -541.3611162408499 | -541.3611162409488 | 9.890754881780595e-11 | optimised-here |
| C₅H₁₀N₂O₃ · glutamine | STO-3G | 60 | RHF | -521.8348535001883 | -521.8348535005102 | 3.219611244276166e-10 | optimised-here |
| C₅H₁₁NO₂S · methionine | STO-3G | 60 | RHF | -788.0344265688332 | -788.0344265691895 | 3.5629454941954464e-10 | optimised-here |
| C₆H₉N₃O₂ · histidine | STO-3G | 64 | RHF | -538.5534845268323 | -538.5534845270143 | 1.8201262719230726e-10 | optimised-here |
| C₆H₁₄N₂O₂ · lysine | STO-3G | 64 | RHF | -487.74428105980405 | -487.74428105991876 | 1.1471001926111057e-10 | optimised-here |
| C₉H₁₁NO₂ · phenylalanine | STO-3G | 71 | RHF | -544.4240479791133 | -544.4240479794066 | 2.9331204132176936e-10 | computed-reference |
| C₆H₁₄N₄O₂ · arginine | STO-3G | 74 | RHF | -595.201285656054 | -595.2012856561895 | 1.355147105641663e-10 | optimised-here |
| C₉H₁₁NO₃ · tyrosine | STO-3G | 76 | RHF | -618.2883088089637 | -618.288308809632 | 6.68251232127659e-10 | optimised-here |
| C₁₁H₁₂N₂O₂ · tryptophan | STO-3G | 87 | RHF | -673.5899790979712 | -673.5899790971555 | -8.15703060652595e-10 | optimised-here |
| C₄H₄N₂O₂ · uracil | STO-3G | 44 | RHF | -407.074860235166 | -407.0748602350504 | -1.156195139628835e-10 | computed-reference |
| C₄H₅N₃O · cytosine | STO-3G | 45 | RHF | -387.549253584765 | -387.54925358480745 | 4.246203388902359e-11 | optimised-here |
| C₅H₆N₂O₂ · thymine | STO-3G | 51 | RHF | -445.6595048225462 | -445.6595048224535 | -9.265477274311706e-11 | computed-reference |
| C₅H₅N₅ · adenine | STO-3G | 55 | RHF | -458.6127899481451 | -458.6127899481014 | -4.3712589103961363e-11 | computed-reference |
| C₅H₅N₅O · guanine | STO-3G | 60 | RHF | -532.4666886657988 | -532.466688666553 | 7.541984814452007e-10 | optimised-here |
| CH₃CONHCH₃ · N-methylacetamide | STO-3G | 32 | RHF | -243.8527387492643 | -243.8527387492605 | -3.780087354243733e-12 | computed-reference |
| Li₄F₄ · lithium fluoride cube | STO-3G | 40 | RHF | -422.17107769587346 | -422.17107769585385 | -1.9610979506978765e-11 | optimised-here |
| (H₂O)₆ · water hexamer ring | STO-3G | 42 | RHF | -449.8875634946747 | -449.88756349453166 | -1.4301804185379297e-10 | optimised-here |
| C₁₀H₁₆ · adamantane | STO-3G | 66 | RHF | -383.51536071415467 | -383.5153607141551 | 4.547473508864641e-13 | optimised-here |
| C₈H₈ · cubane | STO-3G | 48 | RHF | -303.78139997973426 | -303.78139997974483 | 1.057287590811029e-11 | optimised-here |
| B₁₂H₁₂²⁻ · closo-dodecaborate | STO-3G | 72 | RHF | -299.506013434715 | -299.50601343472624 | 1.1254996934439987e-11 | optimised-here |
| C₆₀ · buckminsterfullerene | STO-3G | 300 | RHF | -2244.018782476829 | -2244.018782476829 | 0 — the record's energy is PySCF's own | draft |
| KrF₂ · krypton difluoride | STO-3G | 29 | RHF | -2919.3545249690033 | -2919.3545249690296 | 2.637534635141492e-11 | optimised-here |
| KBr · potassium bromide | STO-3G | 32 | RHF | -3138.681094747676 | -3138.681094747674 | -2.2737367544323206e-12 | optimised-here |
| TiCl₄ · titanium tetrachloride | STO-3G | 55 | RHF | -2658.646680474205 | -2658.6466804742095 | 4.547473508864641e-12 | experimental |
| Ni(CO)₄ · nickel tetracarbonyl | STO-3G | 59 | RHF | -1935.0686193279048 | -1935.068619328748 | 8.431015885435045e-10 | optimised-here |
| Fe(CO)₅ · iron pentacarbonyl | STO-3G | 69 | RHF | -1805.0054478070576 | -1805.005447807563 | 5.054516805103049e-10 | optimised-here |
| Cr(CO)₆ · chromium hexacarbonyl | STO-3G | 79 | RHF | -1699.7219288947751 | -1699.7219289017053 | 6.93012225383427e-9 | optimised-here |

61 molecules solved live — the app's energy is computed on your device and compared there (the STATUS line prints the agreement), so the table holds PySCF's (PySCF 2.14.0 RHF and PySCF 2.14.0 UHF in STO-3G, PySCF 2.14.0 in 6-31+G\*, PySCF 2.14.0 RKS `lda,vwn` on the app's grid; "no oracle": the card offers it and no PySCF number is on file; "—": not offered):

| molecule | AO (STO-3G) | method | STO-3G, Eh | 6-31+G\*, Eh | RKS LDA (STO-3G), Eh |
|---|---|---|---|---|---|
| H₂ · dihydrogen | 2 | RHF | -1.1167061373496687 | -1.126740337407633 | no oracle |
| LiH · lithium hydride | 6 | RHF | -7.862023874015301 | — | no oracle |
| HF · hydrogen fluoride | 6 | RHF | -98.5707576634785 | -100.01485739573144 | -98.24584098961836 |
| N₂ · dinitrogen | 10 | RHF | -107.49588788341214 | -108.94572499706774 | -107.14784546338231 |
| CO · carbon monoxide | 10 | RHF | -111.22458955706387 | -112.7415387235556 | no oracle |
| F₂ · difluorine | 10 | RHF | -195.96746083720126 | -198.68096270349432 | no oracle |
| LiF · lithium fluoride | 10 | RHF | -105.36247144106767 | — | no oracle |
| NaH · sodium hydride | 10 | RHF | -160.30218654395708 | — | no oracle |
| HCl · hydrogen chloride | 10 | RHF | -455.1348097026879 | — | no oracle |
| Cl₂ · dichlorine | 18 | RHF | -909.1116063077275 | — | no oracle |
| NaCl · sodium chloride | 18 | RHF | -614.5241755564492 | — | no oracle |
| O₂ · dioxygen | 10 | UHF | -147.6352300151407 | no oracle | — |
| NO · nitric oxide | 10 | UHF | -127.53039956873471 | no oracle | — |
| OH · hydroxyl radical | 6 | UHF | -74.3626375456123 | no oracle | — |
| B₂ · diboron | 10 | UHF | -48.42116526893494 | — | — |
| BeH₂ · beryllium dihydride | 7 | RHF | -15.560312316766892 | — | no oracle |
| BH₃ · borane | 8 | RHF | -26.068995738523487 | — | no oracle |
| CH₄ · methane | 9 | RHF | -39.72681011229935 | -40.19564278010024 | -39.61684762933404 |
| NH₃ · ammonia | 8 | RHF | -55.45403854435139 | -56.18917398191083 | -55.29017963855679 |
| H₂O · water | 7 | RHF | -74.96302316286221 | -76.01744137674835 | -74.73204101826778 |
| MgH₂ · magnesium dihydride | 11 | RHF | -198.20077268831582 | — | no oracle |
| AlH₃ · alane | 12 | RHF | -240.7284221741122 | — | no oracle |
| SiH₄ · silane | 13 | RHF | -287.9102282076221 | — | no oracle |
| PH₃ · phosphine | 12 | RHF | -338.63361631946407 | — | no oracle |
| H₂S · hydrogen sulfide | 11 | RHF | -394.311556109671 | — | no oracle |
| NH₂ · amino radical | 7 | UHF | -54.83692442156896 | no oracle | — |
| CH₃ · methyl radical | 8 | UHF | -39.07670885029181 | no oracle | — |
| CO₂ · carbon dioxide | 15 | RHF | -185.06469572695954 | — | -184.5641630932059 |
| HCN · hydrogen cyanide | 11 | RHF | -91.67519078743688 | -92.87752312893467 | no oracle |
| N₂O · nitrous oxide | 15 | RHF | -181.19185582614418 | — | no oracle |
| O₃ · ozone | 15 | RHF | -221.28906435848083 | — | no oracle |
| SO₂ · sulfur dioxide | 19 | RHF | -540.6018797759014 | — | no oracle |
| NO₂ · nitrogen dioxide | 15 | UHF | -201.28618369480836 | — | — |
| BF₃ · boron trifluoride | 20 | RHF | -318.66192569719396 | — | no oracle |
| CF₄ · carbon tetrafluoride | 25 | RHF | -429.56747366431136 | — | no oracle |
| H₂O₂ · hydrogen peroxide | 12 | RHF | -148.75736915510566 | -150.76792166479075 | no oracle |
| C₂H₂ · acetylene | 12 | RHF | -75.85280597081353 | -76.82254036751593 | no oracle |
| C₂H₄ · ethene | 14 | RHF | -77.07209020662677 | -78.0350326506241 | -76.85777172746918 |
| C₂H₆ · ethane | 16 | RHF | -78.30580841075891 | — | no oracle |
| H₂CO · formaldehyde | 12 | RHF | -112.3537331183951 | -113.86931463530775 | no oracle |
| CH₃OH · methanol | 14 | RHF | -113.54457807851969 | -115.03983111934497 | no oracle |
| HCOOH · formic acid | 17 | RHF | -186.20693726943273 | — | no oracle |
| CH₃CN · acetonitrile | 18 | RHF | -130.02862097332786 | — | no oracle |
| C₃H₆ · cyclopropane | 21 | RHF | -115.66595933028114 | — | no oracle |
| C₄H₆ · 1,3-butadiene | 26 | RHF | -153.01187913500087 | — | no oracle |
| C₄H₄O · furan | 29 | RHF | -225.74456598087633 | — | no oracle |
| C₅H₅N · pyridine | 35 | RHF | -243.63748181925146 (PySCF: not converged) | — | no oracle |
| CO(NH₂)₂ · urea | 24 | RHF | -221.01318047198532 | — | no oracle |
| NH₂CH₂COOH · glycine | 30 | RHF | -279.08856218342737 | — | no oracle |
| C₆H₆ · benzene | 36 | RHF | -227.89100646418044 | — | -227.26271535054755 |
| NH₄⁺ · ammonium | 9 | RHF | -55.866800273151156 | -56.53107631673711 | no oracle |
| H₃O⁺ · hydronium | 8 | RHF | -75.32904700782314 | -76.29037269849235 | no oracle |
| OH⁻ · hydroxide | 6 | RHF | -74.05632818927478 | -75.37629337598196 | no oracle |
| CN⁻ · cyanide | 10 | RHF | -90.93706489769323 | -92.31432403709228 | no oracle |
| CuH · copper hydride | 20 | RHF (disabled: not a minimum) | -1620.945705377368 (PySCF: not converged) | — | — |
| ZnH₂ · zinc dihydride | 21 | RHF (disabled: not a minimum) | -1758.3056136339196 | — | — |
| GeH₄ · germane | 23 | RHF | -2054.6098034983597 | — | no oracle |
| AsH₃ · arsine | 22 | RHF | -2211.6503169002226 | — | no oracle |
| H₂Se · hydrogen selenide | 21 | RHF | -2375.4347040673106 | — | no oracle |
| HBr · hydrogen bromide | 20 | RHF | -2546.0970970902868 | — | no oracle |
| Br₂ · dibromine | 38 | RHF | -5091.063777547901 | — | — |

<!-- pyscf-table:end -->

</details>

## Accessibility

The instrument was built to be reachable by keyboard: every control is a real button or slider
with a name, a value and arrow-key steps; windows are landmarks; the canvas is described in one
sentence that changes only when the instrument's state changes. That was checked by a headless
browser, not by a person using a screen reader. Motion: a photosensitivity notice stands before the
first frame. A flash guard then holds the four routes that set the picture's brightness — EXPOSURE, GAMMA,
STAGE and KNEE — to three flashes a second whenever a modulator drives them, and says so in METERS; it has
no off switch. It is partial: HUE, a molecule's KICK, the register's morph and the camera are not held, so a
patch on those can still flash. If something is unreachable or
unreadable for you, please open an issue; that is the kind of bug he most wants to hear about.

## Privacy

λWAVES is a static site with no accounts and no analytics. Nothing you make is sent anywhere: projects, notes and settings
live in your browser's localStorage, audio you drop on the TIMELINE in IndexedDB (`mir-assets`), and anything else in files
you export yourself. After the page loads it asks its own origin for a new build at most every 30 minutes, and fetches the
records, volumes, pictures, demos and measured lines you open, keeping them in Cache Storage for offline use. An image in an
imported notebook is fetched from wherever the note points (`SECURITY.md` says what that host learns). The microphone is
opened only when you add an AUDIO device to the modulation rack, its signal never leaves the page, and it is released when
the last AUDIO device is removed; Web MIDI reconnects at launch only where you saved a mapping and the browser already grants
it. Cloudflare serves the files and keeps its own ordinary server logs. `SECURITY.md` lists every request.

## Citing

If λWAVES helps a talk, a lesson or a paper, `CITATION.cff` has the reference (GitHub shows it as
"Cite this repository").

## MIR

The interface — tokens, materials, widgets, gestures, window chrome and the modulation window — is
**MIR**, Magic Commons' kit, adopted into `lab/mir/` and `lab/fonts/` from its own repository
(`../MIR`). λWAVES keeps only its own selectors in `lab.css` and `skin.css`. See `CONTRIBUTING.md`
for the one rule, and `MIR-MANIFEST.json` for which bytes are the kit's.

## The documents

| File | What it is |
|---|---|
| [`REPORT.md`](REPORT.md) | The lab notebook — every law, constant, measured number and named proof, for whoever builds next. Not release notes. |
| [`CHANGELOG.md`](CHANGELOG.md) | What changed between releases, newest first. Generated by `node tools/changelog.mjs`. |
| [`DEPLOY.md`](DEPLOY.md) | Shipping: three commands and a login, and the traps around them. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | The house rules, the gate, and where things live. Read before a pull request. |
| [`docs/SHIPPING-READINESS.md`](docs/SHIPPING-READINESS.md) | What still stands between this tree and a public release. |
| [`docs/ui/`](docs/ui) | The style lock, the motion law, the anti-patterns and the references every UI wave reads. |
| [`docs/history/`](docs/history) | Past handoffs and task boards, kept for provenance. Nothing there is current instruction. |
| [`research/`](research) | The maths rounds behind the physics — adversarial two-lab ledgers and their prints. |

## Branches

- **`main`** — the working integration branch. Release readiness requires current gate and device acceptance.
- **`dev`** — iterative work. Waves land here first.

## Licence

GNU General Public License v3.0 only — Copyright 2026 Joshua Hosain. See [`LICENSE`](LICENSE).

Third-party notices in [`NOTICE`](NOTICE): Spinwerad 0.3, Roboto 3.015, STIX Two Math 2.0.2, KaTeX 0.16.11 and its
fonts, marked 12.0.2, the notebook's Spectral, Playfair Display and Alegreya SC; the Basis Set Exchange records and NIST's
measured lines are credited there as data.

A reference, not a dependency: [ChronusQ](https://github.com/xsligroup/chronusq_public) (Williams-Young et al.,
*WIREs Comput. Mol. Sci.* 10, e1436 (2020)) is the real-time electronic-structure package λWAVES' molecular
propagation studied and cites (`research/chronusq-2026-09-11/`). ChronusQ is released under GPL v2 and λWAVES under
GPL-3.0-only, so it is read and cited, never merged: no ChronusQ code is in this tree (`NOTICE`).
