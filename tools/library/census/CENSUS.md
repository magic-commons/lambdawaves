# S4 molecular LIBRARY census — DRAFT

All numeric cells carry **M = MEASURED**, **D = DERIVED**, or **U = UNVERIFIED**, followed by the reason where needed. JSON uses per-field `numericStatus` or a containing `status` block. M means observed on this machine or copied from a cited reference; it does not mean measured experimentally here. Geometry provenance and its experimental status are separate. Null is unavailable, never zero. Dates, atomic numbers, MO indices, formula subscripts and version strings identify inputs or conventions.

## Claude Sos's spot-check (2026-10-08, before S4 reads a number)

Sol (gpt-6.1-sol) wrote this census; Josh's calibration says to re-run its headline numbers before banking them. Checked on the
merged `sos-s0` tree, reading the rows and the app-solver probes as written (no re-solve):

| entry | this census (PySCF, STO-3G) | the second lab | Δ | verdict |
|---|---|---|---|---|
| H₂O | −74.96302316286219 Eh, converged, 11 cycles | `tests/fixtures/oracles/sto-3g-v1.json` molecules/H2O −74.96302316286219 | 0 | MATCH |
| C₆H₆ (refined row) | −227.89100646417987 Eh, converged, 25 cycles | oracle molecules_extended/C6H6 −227.89100646418058 | 7e-13 | MATCH |
| C₆H₆ (unrefined row) | −227.89100646512108 Eh, **not converged at 200 cycles** | the refined row | 9.4e-10 | the energy is right; the flag is the census's own SCF criterion, not a chemistry fact |
| alanine | −317.67874534511 Eh, converged | the app's node solver (`app-alanine.json`) −317.67874534511134 | 1e-12 | MATCH (two independent solvers) |
| Li₄F₄ | −422.17107769585317 Eh | app solver −422.17107769587346 | 2e-11 | MATCH |
| TiCl₄ | −2658.646680474214 Eh | app solver −2658.646680474205 | 9e-12 | MATCH |

Verdict: the energies this census rests on reproduce in a second lab; the counts, bytes and gate verdicts are DERIVED from them and
are taken as Sol tagged them. Not re-checked here: the geometries' experimental provenance (U where Sol says U), the 6-31+G* AO
counts, the C₆₀ frontier beyond Sol's own water proof (1.03e-12), and the wall times (the machine was loaded).

## One-page summary

D: **117 named rows**, including M: **54 present entries**, D: **20 amino acids** and D: **5 nucleobases**. Glycine is counted once. Carbonyl representatives are Ni(CO)4, Fe(CO)5 and Cr(CO)6. Conditional iodine/xenon candidates remain in the census.

| Section | Rows D | STO-3G record bytes D | 6-31+G* bytes where defined D | Gate pass/fail D | Need 128-AO tier D | Over 128 D | Basis blocked D | Over live COST budget D |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| DIATOMICS | 13 | 39,696 | 144,712 | 7/6 | 0 | 0 | 0 | 0 |
| HYDRIDES | 20 | 71,768 | 373,848 | 11/9 | 0 | 0 | 0 | 0 |
| ORGANIC | 16 | 1,004,672 | 13,367,136 | 8/8 | 3 | 1 | 0 | 4 |
| BIO | 36 | 1,147,664 | 13,126,720 | 26/10 | 8 | 0 | 0 | 31 |
| LATTICE | 11 | 246,240 | 2,110,112 | 3/8 | 1 | 0 | 0 | 9 |
| HEAVY | 21 | 311,368 | 0 | 15/6 | 3 | 0 | 5 | 6 |

D: STO-3G payload **2,821,408 B**; gate-passing available subset **1,191,160 B**. D: count-only 6-31+G* payload **29,122,528 B**, where defined. Formula: `8*(nAO²+2*nAO)+2000`: decimal D: **2 KB** metadata. The JSON also gives D: **2 KiB** alternatives, adding D: **48 B/record**. U: transport/installed JSON size and response/grid payloads are excluded.

D: STO-3G records requiring S4c's density tier **15**: arginine, phenylalanine, tryptophan, tyrosine, adamantane, caffeine, DMT, Na4Cl4, FeCO5, CrCO6, ferrocene, B12H12--, C20H20, A-T, G-C. D: over the density tier **1**: C60; C60 uses S4c's orbital-only path. U: iPad/device capacity and GPU field timing are not measured here.

D: **50** rows exceed the current benzene live COST budget (listed below); cap D: **9592 ms**, with the app's D: **2% margin**. U: S4a refit/device eligibility remains unmeasured.

D: diversity gate **70 pass / 47 fail**. D: **111 RHF solves converged**, **1 did not**; D: **5 basis-blocked rows** have no solve. D: **0 geometry optimisations failed their criterion**. Convergence flags are M; the counts are D. Sources, constraints and failures are explicit below.

M: `basis_set_exchange` is unavailable in `~/bin/scipython`, with and without `-I`; vendored STO-3G ends at Z=36. M: iodine Z=53 and xenon Z=54 are absent. U: package coverage remains unknown. Nothing was vendored. Missing heavy-element 6-31+G* counts remain U.

M: all water coefficient columns pass the sign-adjusted AO proof: maximum error **1.029e-12**, D: tolerance **1e-08**. The C60 draft stores D: **5 h_u HOMOs + 3 t1u LUMOs**, with M: Ih characters checked over **60 rotations** and inversion. Geometry experiment, GPU rendering and C60 stability remain U.

## The three sizing entries

App times use `moleculeRHF` at its defaults, including SAD/core solution detection, the density stability probe and singlet electronic Hessians, with read-only imports exactly as the symmetry tools do. These are electronic stability tests, not vibrational/geometry Hessians. PySCF times are final RHF kernel calls only; its geometry relaxation and stability probes are outside that timing. They therefore measure different work, stated explicitly. Runs can overlap other CPU work; the observations are not isolated throughput claims. U: record-open time is not measured because the production record schema/store lands in S4a and browsers/servers were forbidden.

Record-byte estimates in the authoritative census and these tables use decimal metadata units. Early raw row/app timing checkpoints used the binary allowance; their byte fields are D: **48 B larger** per defined record. No energy, time or geometry measurement was changed by this bookkeeping normalisation.

| Entry | STO-3G AO D | PySCF RHF seconds M | App defaults seconds M | App converged M | Absolute energy difference Eh D | Predicted record bytes D | App Hessian minimum M |
|---|---:|---:|---:|---|---:|---:|---|
| alanine | 37 | 0.256557 | 2.135271 | yes | 1.364e-12 | 13,544 | True |
| Li4F4 | 40 | 0.231938 | 1.756959 | yes | 2.029e-11 | 15,440 | True |
| TiCl4 | 55 | 0.404963 | 8.993780 | yes | 9.095e-12 | 27,080 | True |

## Additional basis sizing

D: for the 6-31+G* count-only inventory, **16** entries require the 128-AO tier: BF3, CF4, C3H6, C4H6, C4H4O, C5H5N, urea, glycine, C6H6, alanine, N-methylacetamide, imidazole, phosphoric-acid, neopentane, Li4H4, Na2Cl2. D: **42** exceed that density tier: arginine, asparagine, aspartic-acid, cysteine, glutamine, glutamic-acid, histidine, isoleucine, leucine, lysine, methionine, phenylalanine, proline, serine, threonine, tryptophan, tyrosine, valine, adenine, guanine, cytosine, thymine, uracil, Gly-Gly, indole, ribose, cubane, naphthalene, Si5H12, adamantane, caffeine, DMT, Li4F4, Mg4O4, Na4Cl4, ice-hexamer, ice-cube, B12H12--, C20H20, C60, A-T, G-C. These are basis-size findings, not extra solves or a commitment to ship every anchor.

## Census and mechanical diversity gate

One row per named molecule, without duplicating glycine. Formula is canonical Hill composition; charge is separate and included in the gate key. `Dooh`/`Coov` are PySCF topgroup names for the linear groups. With Cartesian functions, these solves compute in the supported finite Abelian subgroup, D2h/C2v; the second name is the actual computed subgroup for every solved row. Conditional models have no measured point group or computed subgroup, and no pinned-basis optimisation. Motifs are declared from connectivity, not inferred from rounded energies. An optimisation can lower a built cage/cluster symmetry; the measured group wins.

Section assignments are a proposed disjoint picker mapping, UNVERIFIED as production manifests. The legacy small-triatomic/ion bucket is included under HYDRIDES, including its oxides and halides; that label is an editorial bucket, not a claim that every member is chemically a hydride. Original `appGroup` is preserved for taxonomy review. Ring tags denote declared covalent cycle sizes; cluster tags denote the finite repeat-unit aggregates in the LATTICE roster.

| Name (id) | Formula D; charge D | Section | Family | Geometry source | PySCF top/computed M | AO STO-3G / 6-31+G* D | nocc D | RHF E Eh M | Wall s M | Converged M | Gap Eh D | Record bytes STO-3G / 6-31+G* D | Live-cost ms D | Gate D: result and reason |
|---|---|---|---|---|---|---:|---:|---:|---:|---|---:|---:|---:|---|
| dihydrogen (H2) | H2; 0 | DIATOMICS | — | reference copied, U experiment [G1](#geometry-g1) | Dooh/D2h | D: 2 / D: 4 | 1 | M: -1.116706137 | M: 0.012314 | yes | D: 1.2482512 | D: 2064 / D: 2192 | D: 11 | PASS: new elements H; new measured point group Dooh |
| lithium hydride (LiH) | HLi; 0 | DIATOMICS | — | reference copied, U experiment [G2](#geometry-g2) | Coov/C2v | D: 6 / D: 21 | 2 | M: -7.862023874 | M: 0.053699 | yes | D: 0.3639572 | D: 2384 / D: 5864 | D: 14 | PASS: new elements Li; new measured point group Coov |
| hydrogen fluoride (HF) | FH; 0 | DIATOMICS | — | reference copied, U experiment [G3](#geometry-g3) | Coov/C2v | D: 6 / D: 21 | 5 | M: -98.570757663 | M: 0.029449 | yes | D: 1.0934083 | D: 2384 / D: 5864 | D: 14 | PASS: new elements F |
| dinitrogen (N2) | N2; 0 | DIATOMICS | — | reference copied, U experiment [G4](#geometry-g4) | Dooh/D2h | D: 10 / D: 38 | 7 | M: -107.495887883 | M: 0.022183 | yes | D: 0.8206861 | D: 2960 / D: 14160 | D: 33 | PASS: new elements N |
| carbon monoxide (CO) | CO; 0 | DIATOMICS | — | reference copied, U experiment [G5](#geometry-g5) | Coov/C2v | D: 10 / D: 38 | 7 | M: -111.224589557 | M: 0.073108 | yes | D: 0.7598180 | D: 2960 / D: 14160 | D: 33 | PASS: new elements C,O |
| difluorine (F2) | F2; 0 | DIATOMICS | — | reference copied, U experiment [G6](#geometry-g6) | Dooh/D2h | D: 10 / D: 38 | 9 | M: -195.967460837 | M: 0.049693 | yes | D: 0.8166546 | D: 2960 / D: 14160 | D: 31 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| lithium fluoride (LiF) | FLi; 0 | DIATOMICS | — | reference copied, U experiment [G7](#geometry-g7) | Coov/C2v | D: 10 / D: 38 | 6 | M: -105.362471441 | M: 0.084073 | yes | D: 0.4189864 | D: 2960 / D: 14160 | D: 34 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| sodium hydride (NaH) | HNa; 0 | DIATOMICS | — | reference copied, U experiment [G8](#geometry-g8) | Coov/C2v | D: 10 / D: 25 | 6 | M: -160.302186544 | M: 0.055493 | yes | D: 0.5287364 | D: 2960 / D: 7400 | D: 34 | PASS: new elements Na |
| hydrogen chloride (HCl) | ClH; 0 | DIATOMICS | — | reference copied, U experiment [G9](#geometry-g9) | Coov/C2v | D: 10 / D: 25 | 9 | M: -455.134809703 | M: 0.049529 | yes | D: 0.8274369 | D: 2960 / D: 7400 | D: 31 | PASS: new elements Cl |
| dichlorine (Cl2) | Cl2; 0 | DIATOMICS | — | reference copied, U experiment [G10](#geometry-g10) | Dooh/D2h | D: 18 / D: 46 | 17 | M: -909.111606308 | M: 0.101184 | yes | D: 0.5403950 | D: 4880 / D: 19664 | D: 184 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| sodium chloride (NaCl) | ClNa; 0 | DIATOMICS | — | reference copied, U experiment [G11](#geometry-g11) | Coov/C2v | D: 18 / D: 46 | 14 | M: -614.524175556 | M: 0.225175 | yes | D: 0.5842678 | D: 4880 / D: 19664 | D: 237 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| beryllium dihydride (BeH2) | BeH2; 0 | HYDRIDES | — | reference copied, U experiment [G12](#geometry-g12) | Dooh/D2h | D: 7 / D: 23 | 3 | M: -15.560312317 | M: 0.044523 | yes | D: 0.6340942 | D: 2504 / D: 6600 | D: 16 | PASS: new elements Be |
| borane (BH3) | BH3; 0 | HYDRIDES | — | reference copied, U experiment [G13](#geometry-g13) | D3h/C2v | D: 8 / D: 25 | 4 | M: -26.068995739 | M: 0.050824 | yes | D: 0.7020186 | D: 2640 / D: 7400 | D: 20 | PASS: new elements B; new measured point group D3h |
| methane (CH4) | CH4; 0 | HYDRIDES | — | reference copied, U experiment [G14](#geometry-g14) | Td/D2 | D: 9 / D: 27 | 5 | M: -39.726810112 | M: 0.034924 | yes | D: 1.2345931 | D: 2792 / D: 8264 | D: 25 | PASS: new measured point group Td |
| ammonia (NH3) | H3N; 0 | HYDRIDES | — | reference copied, U experiment [G15](#geometry-g15) | C3v/Cs | D: 8 / D: 25 | 5 | M: -55.454038544 | M: 0.050672 | yes | D: 0.9929594 | D: 2640 / D: 7400 | D: 20 | PASS: new measured point group C3v |
| water (H2O) | H2O; 0 | HYDRIDES | — | reference copied, U experiment [G16](#geometry-g16) | C2v/C2v | D: 7 / D: 23 | 5 | M: -74.963023163 | M: 0.041752 | yes | D: 0.9964087 | D: 2504 / D: 6600 | D: 16 | PASS: new measured point group C2v |
| magnesium dihydride (MgH2) | H2Mg; 0 | HYDRIDES | — | reference copied, U experiment [G17](#geometry-g17) | Dooh/D2h | D: 11 / D: 27 | 7 | M: -198.200772688 | M: 0.091416 | yes | D: 0.6735723 | D: 3144 / D: 8264 | D: 43 | PASS: new elements Mg |
| alane (AlH3) | AlH3; 0 | HYDRIDES | — | reference copied, U experiment [G18](#geometry-g18) | D3h/C2v | D: 12 / D: 29 | 8 | M: -240.728422174 | M: 0.098360 | yes | D: 0.6817122 | D: 3344 / D: 9192 | D: 55 | PASS: new elements Al |
| silane (SiH4) | H4Si; 0 | HYDRIDES | — | reference copied, U experiment [G19](#geometry-g19) | Td/D2 | D: 13 / D: 31 | 9 | M: -287.910228208 | M: 0.172407 | yes | D: 0.9424487 | D: 3560 / D: 10184 | D: 71 | PASS: new elements Si |
| phosphine (PH3) | H3P; 0 | HYDRIDES | — | reference copied, U experiment [G20](#geometry-g20) | C3v/Cs | D: 12 / D: 29 | 9 | M: -338.633616319 | M: 0.058483 | yes | D: 0.7707727 | D: 3344 / D: 9192 | D: 53 | PASS: new elements P |
| hydrogen sulfide (H2S) | H2S; 0 | HYDRIDES | — | reference copied, U experiment [G21](#geometry-g21) | C2v/C2v | D: 11 / D: 27 | 9 | M: -394.311556110 | M: 0.072256 | yes | D: 0.7458445 | D: 3144 / D: 8264 | D: 40 | PASS: new elements S |
| carbon dioxide (CO2) | CO2; 0 | HYDRIDES | — | reference copied, U experiment [G22](#geometry-g22) | Dooh/D2h | D: 15 / D: 57 | 11 | M: -185.064695727 | M: 0.145018 | yes | D: 0.7237567 | D: 4040 / D: 28904 | D: 120 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| hydrogen cyanide (HCN) | CHN; 0 | HYDRIDES | — | reference copied, U experiment [G23](#geometry-g23) | Coov/C2v | D: 11 / D: 40 | 7 | M: -91.675190787 | M: 0.103940 | yes | D: 0.7911093 | D: 3144 / D: 15440 | D: 43 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| nitrous oxide (N2O) | N2O; 0 | HYDRIDES | — | reference copied, U experiment [G24](#geometry-g24) | Coov/C2v | D: 15 / D: 57 | 11 | M: -181.191855826 | M: 0.233728 | yes | D: 0.6205090 | D: 4040 / D: 28904 | D: 120 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| ozone (O3) | O3; 0 | HYDRIDES | — | reference copied, U experiment [G25](#geometry-g25) | C2v/C2v | D: 15 / D: 57 | 12 | M: -221.289064358 | M: 0.333888 | yes | D: 0.4292563 | D: 4040 / D: 28904 | D: 112 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| sulfur dioxide (SO2) | O2S; 0 | HYDRIDES | — | reference copied, U experiment [G26](#geometry-g26) | C2v/C2v | D: 19 / D: 61 | 16 | M: -540.601879776 | M: 0.567006 | yes | D: 0.4546127 | D: 5192 / D: 32744 | D: 262 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| boron trifluoride (BF3) | BF3; 0 | HYDRIDES | — | reference copied, U experiment [G27](#geometry-g27) | D3h/C2v | D: 20 / D: 76 | 16 | M: -318.661925697 | M: 0.564855 | yes | D: 0.8230817 | D: 5520 / D: 49424 | D: 349 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| carbon tetrafluoride (CF4) | CF4; 0 | HYDRIDES | — | reference copied, U experiment [G28](#geometry-g28) | Td/D2 | D: 25 / D: 95 | 21 | M: -429.567473664 | M: 0.791936 | yes | D: 1.1094560 | D: 7400 / D: 75720 | D: 833 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| hydrogen peroxide (H2O2) | H2O2; 0 | HYDRIDES | — | reference copied, U experiment [G29](#geometry-g29) | C2/C2 | D: 12 / D: 42 | 9 | M: -148.757369155 | M: 0.129317 | yes | D: 0.8210820 | D: 3344 / D: 16784 | D: 53 | PASS: new measured point group C2 |
| acetylene (C2H2) | C2H2; 0 | ORGANIC | — | reference copied, U experiment [G30](#geometry-g30) | Dooh/D2h | D: 12 / D: 42 | 7 | M: -75.852805971 | M: 0.086982 | yes | D: 0.7438515 | D: 3344 / D: 16784 | D: 57 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| ethene (C2H4) | C2H4; 0 | ORGANIC | — | reference copied, U experiment [G31](#geometry-g31) | D2h/D2h | D: 14 / D: 46 | 8 | M: -77.072090207 | M: 0.291148 | yes | D: 0.6405398 | D: 3792 / D: 19664 | D: 99 | PASS: new measured point group D2h |
| ethane (C2H6) | C2H6; 0 | ORGANIC | — | reference copied, U experiment [G32](#geometry-g32) | D3d/C2h | D: 16 / D: 50 | 9 | M: -78.305808411 | M: 0.082625 | yes | D: 1.1019157 | D: 4304 / D: 22800 | D: 169 | PASS: new measured point group D3d |
| formaldehyde (H2CO) | CH2O; 0 | ORGANIC | — | reference copied, U experiment [G33](#geometry-g33) | C2v/C2v | D: 12 / D: 42 | 8 | M: -112.353733118 | M: 0.153005 | yes | D: 0.6384454 | D: 3344 / D: 16784 | D: 55 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| methanol (CH3OH) | CH4O; 0 | ORGANIC | — | reference copied, U experiment [G34](#geometry-g34) | Cs/Cs | D: 14 / D: 46 | 9 | M: -113.544578079 | M: 0.296804 | yes | D: 0.9348503 | D: 3792 / D: 19664 | D: 95 | PASS: new measured point group Cs |
| formic acid (HCOOH) | CH2O2; 0 | ORGANIC | — | reference copied, U experiment [G35](#geometry-g35) | Cs/Cs | D: 17 / D: 61 | 12 | M: -186.206937269 | M: 0.468363 | yes | D: 0.6606376 | D: 4584 / D: 32744 | D: 201 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| acetonitrile (CH3CN) | C2H3N; 0 | ORGANIC | — | reference copied, U experiment [G36](#geometry-g36) | C3v/Cs | D: 18 / D: 63 | 11 | M: -130.028620973 | M: 0.548660 | yes | D: 0.7633753 | D: 4880 / D: 34760 | D: 281 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| cyclopropane (C3H6) | C3H6; 0 | ORGANIC | — | reference copied, U experiment [G37](#geometry-g37) | D3h/C2v | D: 21 / D: 69 | 12 | M: -115.665959330 | M: 0.866583 | yes | D: 0.8787984 | D: 5864 / D: 41192 | D: 587 | PASS: new motifs ring:3 |
| 1,3-butadiene (C4H6) | C4H6; 0 | ORGANIC | — | reference copied, U experiment [G38](#geometry-g38) | C2v/C2v | D: 26 / D: 88 | 15 | M: -153.011879135 | M: 1.282607 | yes | D: 0.5046570 | D: 7824 / D: 65360 | D: 1703 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| furan (C4H4O) | C4H4O; 0 | ORGANIC | — | reference copied, U experiment [G39](#geometry-g39) | Cs/Cs | D: 29 / D: 103 | 18 | M: -225.744565981 | M: 2.484997 | yes | D: 0.5499693 | D: 9192 / D: 88520 | D: 2876 | PASS: new motifs ring:5 |
| pyridine (C5H5N) | C5H5N; 0 | ORGANIC | — | reference copied, U experiment [G40](#geometry-g40) | Cs/Cs | D: 35 / D: 124 | 21 | M: -243.637481819 | M: 4.419753 | yes | D: 0.5420102 | D: 12360 / D: 126992 | D: 8071 | PASS: new motifs ring:6 |
| urea (urea) | CH4N2O; 0 | BIO | — | reference copied, U experiment [G41](#geometry-g41) | C2v/C2v | D: 24 / D: 84 | 16 | M: -221.013180472 | M: 1.302639 | yes | D: 0.6586359 | D: 6992 / D: 59792 | D: 1027 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| glycine (glycine) | C2H5NO2; 0 | BIO | amino-acids | reference copied, U experiment [G42](#geometry-g42) | Cs/Cs | D: 30 / D: 105 | 20 | M: -279.088562183 | M: 2.519311 | yes | D: 0.6009432 | D: 9680 / D: 91880 | D: 3184 | PASS: declared amino-acids family; formula/novelty exception |
| benzene (C6H6) | C6H6; 0 | ORGANIC | — | reference copied, U experiment [G43](#geometry-g43) | D6h/D2h | D: 36 / D: 126 | 21 | M: -227.891006464 | M: 0.164197 | yes | D: 0.5515653 | D: 12944 / D: 131024 | D: 9592 | PASS: new measured point group D6h |
| ammonium (NH4+) | H4N; 1 | HYDRIDES | — | reference copied, U experiment [G44](#geometry-g44) | Td/D2 | D: 9 / D: 27 | 5 | M: -55.866800273 | M: 0.043624 | yes | D: 1.2463354 | D: 2792 / D: 8264 | D: 25 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| hydronium (H3O+) | H3O; 1 | HYDRIDES | — | reference copied, U experiment [G45](#geometry-g45) | C3v/Cs | D: 8 / D: 25 | 5 | M: -75.329047008 | M: 0.032933 | yes | D: 1.0235789 | D: 2640 / D: 7400 | D: 20 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| hydroxide (OH-) | HO; -1 | DIATOMICS | — | reference copied, U experiment [G46](#geometry-g46) | Coov/C2v | D: 6 / D: 21 | 5 | M: -74.056328189 | M: 0.028514 | yes | D: 0.9984896 | D: 2384 / D: 5864 | D: 14 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| cyanide (CN-) | CN; -1 | DIATOMICS | — | reference copied, U experiment [G47](#geometry-g47) | Coov/C2v | D: 10 / D: 38 | 7 | M: -90.937064898 | M: 0.071314 | yes | D: 0.7642413 | D: 2960 / D: 14160 | D: 33 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| copper hydride (CuH) | CuH; 0 | HEAVY | — | reference copied, U experiment [G48](#geometry-g48) | Coov/C2v | D: 20 / U: unavailable | 15 | M: -1620.945705377 | M: 0.329966 | no | D: 0.3204672 | D: 5520 / U: unavailable | D: 420 | PASS: new elements Cu; new motifs d-block |
| zinc dihydride (ZnH2) | H2Zn; 0 | HEAVY | — | reference copied, U experiment [G49](#geometry-g49) | Dooh/D2h | D: 21 / U: unavailable | 16 | M: -1758.305613634 | M: 0.599349 | yes | D: 0.2832386 | D: 5864 / U: unavailable | D: 503 | PASS: new elements Zn |
| germane (GeH4) | GeH4; 0 | HEAVY | — | reference copied, U experiment [G50](#geometry-g50) | Td/D2 | D: 23 / U: unavailable | 18 | M: -2054.609803498 | M: 0.495089 | yes | D: 0.9344147 | D: 6600 / U: unavailable | D: 708 | PASS: new elements Ge |
| arsine (AsH3) | AsH3; 0 | HEAVY | — | reference copied, U experiment [G51](#geometry-g51) | C3v/Cs | D: 22 / U: unavailable | 18 | M: -2211.650316900 | M: 0.411572 | yes | D: 0.7028489 | D: 6224 / U: unavailable | D: 543 | PASS: new elements As |
| hydrogen selenide (H2Se) | H2Se; 0 | HEAVY | — | reference copied, U experiment [G52](#geometry-g52) | C2v/C2v | D: 21 / U: unavailable | 18 | M: -2375.434704067 | M: 0.323839 | yes | D: 0.6518103 | D: 5864 / U: unavailable | D: 416 | PASS: new elements Se |
| hydrogen bromide (HBr) | BrH; 0 | HEAVY | — | reference copied, U experiment [G53](#geometry-g53) | Coov/C2v | D: 20 / U: unavailable | 18 | M: -2546.097097090 | M: 0.208031 | yes | D: 0.7309011 | D: 5520 / U: unavailable | D: 322 | PASS: new elements Br |
| dibromine (Br2) | Br2; 0 | HEAVY | — | reference copied, U experiment [G54](#geometry-g54) | Dooh/D2h | D: 38 / U: unavailable | 35 | M: -5091.063777548 | M: 0.947687 | yes | D: 0.4753548 | D: 14160 / U: unavailable | D: 4000 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| alanine (alanine) | C3H7NO2; 0 | BIO | amino-acids | reference copied, U experiment [G55](#geometry-g55) | C1/C1 | D: 37 / D: 128 | 24 | M: -317.678745345 | M: 0.256557 | yes | D: 0.6411726 | D: 13544 / D: 135120 | D: 10110 | PASS: declared amino-acids family; formula/novelty exception |
| arginine (arginine) | C6H14N4O2; 0 | BIO | amino-acids | optimised here, U experiment [G56](#geometry-g56) | C1/C1 | D: 74 / D: 256 | 47 | M: -595.201285656 | M: 2.827848 | yes | D: 0.5471538 | D: 46992 / D: 530384 | D: 538232 | PASS: declared amino-acids family; formula/novelty exception |
| asparagine (asparagine) | C4H8N2O3; 0 | BIO | amino-acids | reference copied, U experiment [G57](#geometry-g57) | C1/C1 | D: 53 / D: 187 | 35 | M: -483.217909656 | M: 0.999557 | yes | D: 0.6036277 | D: 25320 / D: 284744 | D: 73575 | PASS: declared amino-acids family; formula/novelty exception |
| aspartic acid (aspartic-acid) | C4H7NO4; 0 | BIO | amino-acids | optimised here, U experiment [G58](#geometry-g58) | C1/C1 | D: 52 / D: 185 | 35 | M: -502.786082016 | M: 0.930188 | yes | D: 0.6082029 | D: 24464 / D: 278760 | D: 63904 | PASS: declared amino-acids family; formula/novelty exception |
| cysteine (cysteine) | C3H7NO2S; 0 | BIO | amino-acids | optimised here, U experiment [G59](#geometry-g59) | C1/C1 | D: 46 / D: 151 | 32 | M: -710.869545191 | M: 0.441910 | yes | D: 0.5665702 | D: 19664 / D: 186824 | D: 30050 | PASS: declared amino-acids family; formula/novelty exception |
| glutamine (glutamine) | C5H10N2O3; 0 | BIO | amino-acids | optimised here, U experiment [G60](#geometry-g60) | C1/C1 | D: 60 / D: 210 | 39 | M: -521.834853501 | M: 1.180176 | yes | D: 0.6100285 | D: 31760 / D: 358160 | D: 153734 | PASS: declared amino-acids family; formula/novelty exception |
| glutamic acid (glutamic-acid) | C5H9NO4; 0 | BIO | amino-acids | optimised here, U experiment [G61](#geometry-g61) | C1/C1 | D: 59 / D: 208 | 39 | M: -541.361116241 | M: 2.493862 | yes | D: 0.6089282 | D: 30792 / D: 351440 | D: 135841 | PASS: declared amino-acids family; formula/novelty exception |
| histidine (histidine) | C6H9N3O2; 0 | BIO | amino-acids | optimised here, U experiment [G62](#geometry-g62) | C1/C1 | D: 64 / D: 227 | 41 | M: -538.553484527 | M: 5.491978 | yes | D: 0.5087542 | D: 35792 / D: 417864 | D: 228197 | PASS: declared amino-acids family; formula/novelty exception |
| isoleucine (isoleucine) | C6H13NO2; 0 | BIO | amino-acids | reference copied, U experiment [G63](#geometry-g63) | C1/C1 | D: 58 / D: 197 | 36 | M: -433.405379942 | M: 1.264154 | yes | D: 0.6346393 | D: 29840 / D: 315624 | D: 134329 | PASS: declared amino-acids family; formula/novelty exception |
| leucine (leucine) | C6H13NO2; 0 | BIO | amino-acids | optimised here, U experiment [G64](#geometry-g64) | C1/C1 | D: 58 / D: 197 | 36 | M: -433.439894722 | M: 1.204981 | yes | D: 0.6058659 | D: 29840 / D: 315624 | D: 134329 | PASS: declared amino-acids family; formula/novelty exception |
| lysine (lysine) | C6H14N2O2; 0 | BIO | amino-acids | optimised here, U experiment [G65](#geometry-g65) | C1/C1 | D: 64 / D: 218 | 40 | M: -487.744281060 | M: 1.771815 | yes | D: 0.6039550 | D: 35792 / D: 385680 | D: 235639 | PASS: declared amino-acids family; formula/novelty exception |
| methionine (methionine) | C5H11NO2S; 0 | BIO | amino-acids | optimised here, U experiment [G66](#geometry-g66) | C1/C1 | D: 60 / D: 197 | 40 | M: -788.034426569 | M: 1.255317 | yes | D: 0.5484396 | D: 31760 / D: 315624 | D: 147460 | PASS: declared amino-acids family; formula/novelty exception |
| phenylalanine (phenylalanine) | C9H11NO2; 0 | BIO | amino-acids | reference copied, U experiment [G67](#geometry-g67) | C1/C1 | D: 71 / D: 250 | 44 | M: -544.424047979 | M: 3.499572 | yes | D: 0.5402308 | D: 43464 / D: 506000 | D: 435927 | PASS: declared amino-acids family; formula/novelty exception |
| proline (proline) | C5H9NO2; 0 | BIO | amino-acids | optimised here, U experiment [G68](#geometry-g68) | C1/C1 | D: 49 / D: 170 | 31 | M: -393.710655173 | M: 0.752689 | yes | D: 0.6107915 | D: 21992 / D: 235920 | D: 50000 | PASS: declared amino-acids family; formula/novelty exception |
| serine (serine) | C3H7NO3; 0 | BIO | amino-acids | optimised here, U experiment [G69](#geometry-g69) | C1/C1 | D: 42 / D: 147 | 28 | M: -391.528977531 | M: 0.743920 | yes | D: 0.6192675 | D: 16784 / D: 177224 | D: 19551 | PASS: declared amino-acids family; formula/novelty exception |
| threonine (threonine) | C4H9NO3; 0 | BIO | amino-acids | reference copied, U experiment [G70](#geometry-g70) | C1/C1 | D: 49 / D: 170 | 32 | M: -430.075719123 | M: 1.124247 | yes | D: 0.6384284 | D: 21992 / D: 235920 | D: 47901 | PASS: declared amino-acids family; formula/novelty exception |
| tryptophan (tryptophan) | C11H12N2O2; 0 | BIO | amino-acids | optimised here, U experiment [G71](#geometry-g71) | C1/C1 | D: 87 / D: 309 | 54 | M: -673.589979097 | M: 4.376795 | yes | D: 0.4729589 | D: 63944 / D: 770792 | D: 1435057 | PASS: declared amino-acids family; formula/novelty exception |
| tyrosine (tyrosine) | C9H11NO3; 0 | BIO | amino-acids | optimised here, U experiment [G72](#geometry-g72) | C1/C1 | D: 76 / D: 269 | 48 | M: -618.288308810 | M: 6.924906 | yes | D: 0.5127225 | D: 49424 / D: 585192 | D: 634082 | PASS: declared amino-acids family; formula/novelty exception |
| valine (valine) | C5H11NO2; 0 | BIO | amino-acids | optimised here, U experiment [G73](#geometry-g73) | C1/C1 | D: 51 / D: 174 | 32 | M: -394.858534026 | M: 1.070822 | yes | D: 0.6067722 | D: 23624 / D: 246992 | D: 63400 | PASS: declared amino-acids family; formula/novelty exception |
| adenine (adenine) | C5H5N5; 0 | BIO | nucleobases | reference copied, U experiment [G74](#geometry-g74) | C1/C1 | D: 55 / D: 200 | 35 | M: -458.612789948 | M: 0.990702 | yes | D: 0.4622670 | D: 27080 / D: 325200 | D: 96047 | PASS: declared nucleobases family; formula/novelty exception |
| guanine (guanine) | C5H5N5O; 0 | BIO | nucleobases | optimised here, U experiment [G75](#geometry-g75) | C1/C1 | D: 60 / D: 219 | 39 | M: -532.466688667 | M: 2.385181 | yes | D: 0.4655336 | D: 31760 / D: 389192 | D: 153792 | PASS: declared nucleobases family; formula/novelty exception |
| cytosine (cytosine) | C4H5N3O; 0 | BIO | nucleobases | optimised here, U experiment [G76](#geometry-g76) | C1/C1 | D: 45 / D: 162 | 29 | M: -387.549253585 | M: 3.165351 | yes | D: 0.4685445 | D: 18920 / D: 214544 | D: 30204 | PASS: declared nucleobases family; formula/novelty exception |
| thymine (thymine) | C5H6N2O2; 0 | BIO | nucleobases | reference copied, U experiment [G77](#geometry-g77) | C1/C1 | D: 51 / D: 183 | 33 | M: -445.659504822 | M: 0.837633 | yes | D: 0.4875981 | D: 23624 / D: 272840 | D: 60963 | PASS: declared nucleobases family; formula/novelty exception |
| uracil (uracil) | C4H4N2O2; 0 | BIO | nucleobases | reference copied, U experiment [G78](#geometry-g78) | Cs/Cs | D: 44 / D: 160 | 29 | M: -407.074860235 | M: 0.497278 | yes | D: 0.4944700 | D: 18192 / D: 209360 | D: 25803 | PASS: declared nucleobases family; formula/novelty exception |
| glycylglycine (Gly-Gly) | C4H8N2O3; 0 | BIO | — | optimised here, U experiment [G79](#geometry-g79) | C1/C1 | D: 53 / D: 187 | 35 | M: -483.252592461 | M: 0.923871 | yes | D: 0.5954689 | D: 25320 / D: 284744 | D: 73575 | FAIL: duplicate formula with charge C4H8N2O3 |
| N-methylacetamide (N-methylacetamide) | C3H7NO; 0 | BIO | — | reference copied, U experiment [G80](#geometry-g80) | C1/C1 | D: 32 / D: 109 | 20 | M: -243.852738749 | M: 0.260276 | yes | D: 0.6191267 | D: 10704 / D: 98792 | D: 4801 | PASS: new motifs peptide bond |
| imidazole (imidazole) | C3H4N2; 0 | BIO | — | optimised here, U experiment [G81](#geometry-g81) | C1/C1 | D: 29 / D: 103 | 18 | M: -221.987994939 | M: 1.241086 | yes | D: 0.5772233 | D: 9192 / D: 88520 | D: 2876 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| indole (indole) | C8H7N; 0 | BIO | — | reference copied, U experiment [G82](#geometry-g82) | Cs/Cs | D: 52 / D: 185 | 31 | M: -357.028444784 | M: 0.783091 | yes | D: 0.4611480 | D: 24464 / D: 278760 | D: 74594 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| phosphoric acid (phosphoric-acid) | H3O4P; 0 | BIO | — | optimised here, U experiment [G83](#geometry-g83) | C1/C1 | D: 32 / D: 105 | 25 | M: -633.913901134 | M: 0.187557 | yes | D: 0.6700291 | D: 10704 / D: 91880 | D: 3254 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| ribose (ribofuranose conformer) (ribose) | C5H10O5; 0 | BIO | — | optimised here, U experiment [G84](#geometry-g84) | C1/C1 | D: 60 / D: 210 | 40 | M: -562.074022608 | M: 1.214216 | yes | D: 0.8007969 | D: 31760 / D: 358160 | D: 147460 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| cubane (cubane) | C8H8; 0 | LATTICE | — | optimised here, U experiment [G85](#geometry-g85) | D4h/D2h | D: 48 / D: 168 | 28 | M: -303.781399980 | M: 0.517199 | yes | D: 0.8180484 | D: 21200 / D: 230480 | D: 47995 | PASS: new measured point group D4h; new motifs cage,ring:4 |
| neopentane (neopentane) | C5H12; 0 | LATTICE | — | reference copied, U experiment [G86](#geometry-g86) | C1/C1 | D: 37 / D: 119 | 21 | M: -194.044845210 | M: 0.361612 | yes | D: 1.0140299 | D: 13544 / D: 117192 | D: 11293 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| naphthalene (naphthalene) | C10H8; 0 | LATTICE | — | optimised here, U experiment [G87](#geometry-g87) | C1/C1 | D: 58 / D: 206 | 34 | M: -378.686849501 | M: 0.939424 | yes | D: 0.4505247 | D: 29840 / D: 344784 | D: 141739 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| neopentasilane (Si5H12) | H12Si5; 0 | LATTICE | — | optimised here, U experiment [G88](#geometry-g88) | C1/C1 | D: 57 / D: 139 | 41 | M: -1435.085620950 | M: 0.671829 | yes | D: 0.7076895 | D: 28904 / D: 158792 | D: 93076 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| adamantane (adamantane) | C10H16; 0 | ORGANIC | — | optimised here, U experiment [G89](#geometry-g89) | Td/D2 | D: 66 / D: 222 | 38 | M: -383.515360714 | M: 2.255331 | yes | D: 0.9232869 | D: 37904 / D: 399824 | D: 303948 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| caffeine (caffeine) | C8H10N4O2; 0 | BIO | — | optimised here, U experiment [G90](#geometry-g90) | C1/C1 | D: 80 / D: 286 | 51 | M: -667.736056048 | M: 3.591420 | yes | D: 0.4586373 | D: 54480 / D: 660944 | D: 845804 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| N,N-dimethyltryptamine (DMT) | C12H16N2; 0 | BIO | — | optimised here, U experiment [G91](#geometry-g91) | C1/C1 | D: 86 / D: 298 | 51 | M: -565.660364801 | M: 4.631044 | yes | D: 0.4725098 | D: 62544 / D: 717200 | D: 1405049 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| Li4H4 finite alternating cube (Li4H4) | H4Li4; 0 | LATTICE | — | optimised here, U experiment [G92](#geometry-g92) | Td/D2 | D: 24 / D: 84 | 8 | M: -31.656054664 | M: 0.190052 | yes | D: 0.4363706 | D: 6992 / D: 59792 | D: 1027 | PASS: new motifs cluster |
| Li4F4 finite alternating cube (Li4F4) | F4Li4; 0 | LATTICE | — | optimised here, U experiment [G93](#geometry-g93) | Td/D2 | D: 40 / D: 152 | 24 | M: -422.171077696 | M: 0.231938 | yes | D: 0.5578494 | D: 15440 / D: 189264 | D: 16872 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| Mg4O4 finite alternating cube (Mg4O4) | Mg4O4; 0 | LATTICE | — | optimised here, U experiment [G94](#geometry-g94) | Td/D2 | D: 56 / D: 168 | 40 | M: -1084.139416543 | M: 0.815896 | yes | D: 0.4439725 | D: 27984 / D: 230480 | D: 85819 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| Na4Cl4 finite alternating cube (Na4Cl4) | Cl4Na4; 0 | LATTICE | — | optimised here, U experiment [G95](#geometry-g95) | Td/D2 | D: 72 / D: 184 | 56 | M: -2458.476288658 | M: 1.807891 | yes | D: 0.7699771 | D: 44624 / D: 275792 | D: 270804 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| disodium dichloride finite square (Na2Cl2) | Cl2Na2; 0 | LATTICE | — | optimised here, U experiment [G96](#geometry-g96) | D2h/D2h | D: 36 / D: 92 | 28 | M: -1229.174573934 | M: 0.259005 | yes | D: 0.7056733 | D: 12944 / D: 71184 | D: 6036 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| water hexamer ring (ice-hexamer) | H12O6; 0 | LATTICE | — | optimised here, U experiment [G97](#geometry-g97) | C6h/C2h | D: 42 / D: 138 | 30 | M: -449.887563495 | M: 0.297055 | yes | D: 0.8589799 | D: 16784 / D: 156560 | D: 17116 | PASS: new measured point group C6h |
| water octamer cube (ice-cube) | H16O8; 0 | LATTICE | — | optimised here, U experiment [G98](#geometry-g98) | C1/C1 | D: 56 / D: 184 | 40 | M: -599.837528887 | M: 0.467937 | yes | D: 0.8125647 | D: 27984 / D: 275792 | D: 85615 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| titanium tetrachloride (TiCl4) | Cl4Ti; 0 | HEAVY | — | reference copied, U experiment [G99](#geometry-g99) | Td/D2 | D: 55 / U: unavailable | 45 | M: -2658.646680474 | M: 0.404963 | yes | D: 0.5849920 | D: 27080 / U: unavailable | D: 47076 | PASS: new elements Ti |
| germanium tetrachloride (GeCl4) | Cl4Ge; 0 | HEAVY | — | optimised here, U experiment [G100](#geometry-g100) | Td/D2 | D: 55 / U: unavailable | 50 | M: -3870.833832410 | M: 0.690036 | yes | D: 0.5968629 | D: 27080 / U: unavailable | D: 23081 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| krypton difluoride (KrF2) | F2Kr; 0 | HEAVY | — | optimised here, U experiment [G101](#geometry-g101) | Dooh/D2h | D: 29 / U: unavailable | 27 | M: -2919.354524969 | M: 0.155531 | yes | D: 0.3551324 | D: 9192 / U: unavailable | D: 1228 | PASS: new elements Kr |
| selenium dioxide (SeO2) | O2Se; 0 | HEAVY | — | optimised here, U experiment [G102](#geometry-g102) | C2v/C2v | D: 29 / U: unavailable | 25 | M: -2521.739283287 | M: 0.739015 | yes | D: 0.3501099 | D: 9192 / U: unavailable | D: 1565 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| potassium bromide (KBr) | BrK; 0 | HEAVY | — | optimised here, U experiment [G103](#geometry-g103) | Coov/C2v | D: 32 / U: unavailable | 27 | M: -3138.681094748 | M: 0.282360 | yes | D: 0.3343318 | D: 10704 / U: unavailable | D: 2631 | PASS: new elements K |
| NiCO4 carbonyl representative (NiCO4) | C4NiO4; 0 | HEAVY | — | optimised here, U experiment [G104](#geometry-g104) | Td/D2 | D: 59 / U: unavailable | 42 | M: -1935.068619329 | M: 2.066118 | yes | D: 0.4791004 | D: 30792 / U: unavailable | D: 116738 | PASS: new elements Ni |
| FeCO5 carbonyl representative (FeCO5) | C5FeO5; 0 | HEAVY | — | optimised here, U experiment [G105](#geometry-g105) | Cs/Cs | D: 69 / U: unavailable | 48 | M: -1805.005447808 | M: 3.239188 | yes | D: 0.3946220 | D: 41192 / U: unavailable | D: 303904 | PASS: new elements Fe |
| CrCO6 carbonyl representative (CrCO6) | C6CrO6; 0 | HEAVY | — | optimised here, U experiment [G106](#geometry-g106) | Oh/D2h | D: 79 / U: unavailable | 54 | M: -1699.721928902 | M: 4.586534 | yes | D: 0.3739855 | D: 53192 / U: unavailable | D: 695121 | PASS: new elements Cr; new measured point group Oh |
| ferrocene (eclipsed) (ferrocene) | C10H10Fe; 0 | HEAVY | — | optimised here, U experiment [G107](#geometry-g107) | D5h/C2v | D: 79 / U: unavailable | 48 | M: -1628.570501841 | M: 6.224549 | yes | D: 0.4905752 | D: 53192 / U: unavailable | D: 833409 | PASS: new measured point group D5h |
| closo-dodecaborate dianion (B12H12--) | B12H12; -2 | ORGANIC | — | optimised here, U experiment [G108](#geometry-g108) | Ih/Ci | D: 72 / D: 252 | 37 | M: -299.506013435 | M: 4.703959 | yes | D: 0.6826978 | D: 44624 / D: 514064 | D: 527244 | PASS: new measured point group Ih |
| dodecahedrane (C20H20) | C20H20; 0 | ORGANIC | — | optimised here, U experiment [G109](#geometry-g109) | Ih/Ci | D: 120 / D: 420 | 70 | M: -760.137971891 | M: 34.178950 | yes | D: 0.7978671 | D: 119120 / D: 1419920 | D: 10256026 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| buckminsterfullerene (equal-edge reference fixture) (C60) | C60; 0 | ORGANIC | — | D: Round 2 ideal fixture, U experiment [G110](#geometry-g110) | Ih/Ci | D: 300 / D: 1140 | 180 | M: -2244.018782477 | M: 804.868427 | yes | D: 0.2797763 | D: 726800 / D: 10417040 | D: 2389140354 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| HI conditional MODEL (HI) | HI; 0 | HEAVY | — | U: basis-blocked seed, not optimised [G111](#geometry-g111) | U: pinned basis absent | U: unavailable / U: unavailable | 27 | U: unavailable | U: unavailable | U: not attempted | U: unavailable | U: unavailable / U: unavailable | U: unavailable | PASS: new elements I |
| CH3I conditional MODEL (CH3I) | CH3I; 0 | HEAVY | — | U: basis-blocked seed, not optimised [G112](#geometry-g112) | U: pinned basis absent | U: unavailable / U: unavailable | 31 | U: unavailable | U: unavailable | U: not attempted | U: unavailable | U: unavailable / U: unavailable | U: unavailable | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| XeF2 conditional MODEL (XeF2) | F2Xe; 0 | HEAVY | — | U: basis-blocked seed, not optimised [G113](#geometry-g113) | U: pinned basis absent | U: unavailable / U: unavailable | 36 | U: unavailable | U: unavailable | U: not attempted | U: unavailable | U: unavailable / U: unavailable | U: unavailable | PASS: new elements Xe |
| XeF4 conditional MODEL (XeF4) | F4Xe; 0 | HEAVY | — | U: basis-blocked seed, not optimised [G114](#geometry-g114) | U: pinned basis absent | U: unavailable / U: unavailable | 45 | U: unavailable | U: unavailable | U: not attempted | U: unavailable | U: unavailable / U: unavailable | U: unavailable | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| I2 conditional MODEL (I2) | I2; 0 | HEAVY | — | U: basis-blocked seed, not optimised [G115](#geometry-g115) | U: pinned basis absent | U: unavailable / U: unavailable | 53 | U: unavailable | U: unavailable | U: not attempted | U: unavailable | U: unavailable / U: unavailable | U: unavailable | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| adenine-thymine base pair (A-T) | C10H11N7O2; 0 | BIO | — | reference copied, U experiment [G116](#geometry-g116) | C1/C1 | D: 106 / D: 383 | 68 | M: -904.297304619 | M: 20.868307 | yes | D: 0.4612682 | D: 93584 / D: 1181640 | D: 4410849 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |
| guanine-cytosine base pair (G-C) | C9H10N8O2; 0 | BIO | — | optimised here, U experiment [G117](#geometry-g117) | C1/C1 | D: 105 / D: 381 | 68 | M: -920.037697121 | M: 14.120672 | yes | D: 0.4205506 | D: 91880 / D: 1169384 | D: 4108525 | FAIL: unique formula, but no new element, measured point group or fixed-list motif |

M: the additional C60 CPU signed-field check compares D: **736 values** across D: **92 Bohr-space points** and D: **8 frontier orbitals**, using md.js contraction coefficients against PySCF GTOval_cart. M: maximum error **1.11e-16**; D: tolerance **1e-10**. See `c60-field-check.json` and `c60-pyscf-samples.json`. This is a CPU convention check; no GPU rendering was run.

D: the brief's Gly-Gly sizing is corrected here to **53 STO-3G AOs**, from C4H8N2O3: D: 9 heavy atoms times D: 5 AOs, plus D: 8 hydrogen AOs. Its same-formula collision with asparagine is explicit in the gate; a peptide-bond motif cannot override duplicate formula outside the declared family allowance.

## Independent checks

M: the independent native-module audit passed all arithmetic, original-input preservation, AO-count, family-cardinality and literal gate replay checks. D: **117 rows** and D: **112 available pinned-basis counts** were checked. The broad expected-bond distance screen covers D: **26 built connectivity rows**; D: **0 rows** were flagged. Its thresholds are U: heuristics, and a pass does not certify chemical identity, stereochemistry or an experimental geometry.

The G-C model remains U: Watson-Crick geometry and unconstrained minimum. The third donor-H-acceptor angle is D: **121.829 degrees**, calculated from its saved coordinates; the rigid-pair fit therefore does not establish a validated three-hydrogen-bond structure. Contact distances and angles are preserved in `geometry-audit.json`.

## Gate decisions and budget distinctions

**D: over live COST budget (50):** alanine, arginine, asparagine, aspartic-acid, cysteine, glutamine, glutamic-acid, histidine, isoleucine, leucine, lysine, methionine, phenylalanine, proline, serine, threonine, tryptophan, tyrosine, valine, adenine, guanine, cytosine, thymine, uracil, Gly-Gly, indole, ribose, cubane, neopentane, naphthalene, Si5H12, adamantane, caffeine, DMT, Li4F4, Mg4O4, Na4Cl4, ice-hexamer, ice-cube, TiCl4, GeCl4, NiCO4, FeCO5, CrCO6, ferrocene, B12H12--, C20H20, C60, A-T, G-C. This prediction includes response work, unlike the final RHF wall times. The old model is preserved; no lab files were edited.

The gate is intentionally applied literally and globally. A unique formula by itself is insufficient. A repeated occurrence of a motif already admitted is insufficient. Leucine and isoleucine are retained by the declared family exception; asparagine and Gly-Gly share composition, so the latter fails the literal uniqueness test unless a later plan explicitly expands the family allowance. Li4F4 can be scientifically sound and useful while failing novelty after Li4H4 introduces the cluster motif. The same applies to familiar ring extensions. These are dry-run findings, not deletions or recommendations to silently widen the gate.

**D: pass:** H2, LiH, HF, N2, CO, NaH, HCl, BeH2, BH3, CH4, NH3, H2O, MgH2, AlH3, SiH4, PH3, H2S, H2O2, C2H4, C2H6, CH3OH, C3H6, C4H4O, C5H5N, glycine, C6H6, CuH, ZnH2, GeH4, AsH3, H2Se, HBr, alanine, arginine, asparagine, aspartic-acid, cysteine, glutamine, glutamic-acid, histidine, isoleucine, leucine, lysine, methionine, phenylalanine, proline, serine, threonine, tryptophan, tyrosine, valine, adenine, guanine, cytosine, thymine, uracil, N-methylacetamide, cubane, Li4H4, ice-hexamer, TiCl4, KrF2, KBr, NiCO4, FeCO5, CrCO6, ferrocene, B12H12--, HI, XeF2.

**D: fail:** F2, LiF, Cl2, NaCl, CO2, HCN, N2O, O3, SO2, BF3, CF4, C2H2, H2CO, HCOOH, CH3CN, C4H6, urea, NH4+, H3O+, OH-, CN-, Br2, Gly-Gly, imidazole, indole, phosphoric-acid, ribose, neopentane, naphthalene, Si5H12, adamantane, caffeine, DMT, Li4F4, Mg4O4, Na4Cl4, Na2Cl2, ice-cube, GeCl4, SeO2, C20H20, C60, CH3I, XeF4, I2, A-T, G-C.

Budget categories are separate: the COST live cap requires records, the density AO cap determines renderer support, and byte counts size offline storage. No library-wide byte ceiling was specified by F5. A nominal fit in a density tier does not authorise a live solve; a gate pass does not override missing basis, nonconvergence, instability or unverified topology. `libraryReady` in the JSON is only a preliminary census screening flag; production scientific/schema/record validation is still pending S4a/S4b.

## Geometry provenance and qualifications

Present coordinates and their complete source strings are retained from `lab/molecules.js`, including its stated idealisations and the repository-optimised alane. The original sources are citations, not an assertion that their uncertainties or atom frames were experimentally reverified here. wwPDB ideal free-component coordinates include hydrogens and leaving atoms; these are computed references, not experimental gas-phase structures. Missing external coordinates were built from explicit connectivity and relaxed by PySCF RHF on the vendored decimals. Such rows retain the exact required label **optimised here, UNVERIFIED against experiment**; constrained relaxations state their symmetry restriction. No geometry is silently snapped to a higher point group.

Additional computed reference coordinates come from the official [Psi4 S22 geometry database](https://raw.githubusercontent.com/psi4/psi4/master/psi4/share/psi4/databases/S22.py) (uracil, adenine, thymine, their reference hydrogen-bonded pair, and indole) and [Psi4 S66 geometry database](https://raw.githubusercontent.com/psi4/psi4/master/psi4/share/psi4/databases/S66.py) (N-methylacetamide and neopentane). Their copied coordinates are preserved in `tools/library/benchmark-reference-geometries.json` and `tools/library/s66-reference-geometries.json`; `census.py` applies the explicit fragment overrides before solving. They are benchmark references, UNVERIFIED against experiment. Rounded/distorted reference coordinates can produce a lower detected point group than an idealised structure.

[NIST CCCBDB experimental geometry index](https://cccbdb.nist.gov/expgeom1x.asp) documents its experimental geometry service. [TiCl4's NIST entry](https://cccbdb.nist.gov/exp2x.asp?casno=7550450) supplies the bond length used here. [wwPDB alanine reference](https://files.rcsb.org/ligands/view/ALA.cif) supplies ideal free-component coordinates. The raw fetched reference CIF text is preserved in `tools/library/reference-geometries.json`; failed fetches do not become sources. PubChem coordinate endpoints and several wwPDB/CCCBDB detail pages were inaccessible through the available read routes; shell networking also lacked DNS.

### Geometry G1

**H2** — M: provenance copied; experimental attribution U: CCCBDB experimental r(H–H) = 0.741 Å; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/H2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G2

**LiH** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Li–H) = 1.595 Å (the window's original preset, frozen); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/LiH.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G3

**HF** — M: provenance copied; experimental attribution U: CCCBDB experimental r(H–F) = 0.9168 Å (the window's original preset, frozen); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/HF.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G4

**N2** — M: provenance copied; experimental attribution U: CCCBDB experimental r(N≡N) = 1.09768 Å (the window's original preset, frozen); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/N2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G5

**CO** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C≡O) = 1.1283 Å; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CO.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G6

**F2** — M: provenance copied; experimental attribution U: CCCBDB experimental r(F–F) = 1.4119 Å; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/F2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G7

**LiF** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Li–F) = 1.5639 Å; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/LiF.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G8

**NaH** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Na–H) = 1.8873 Å; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/NaH.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G9

**HCl** — M: provenance copied; experimental attribution U: CCCBDB experimental r(H–Cl) = 1.2746 Å; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/HCl.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G10

**Cl2** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Cl–Cl) = 1.9878 Å; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/Cl2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G11

**NaCl** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Na–Cl) = 2.3609 Å; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/NaCl.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G12

**BeH2** — M: provenance copied; experimental attribution U: linear D∞h; r₀(Be–H) = 1.3264 Å from the gas-phase IR emission spectrum (Bernath, Shayesteh et al., 2002) — BeH₂ is a solid at room temperature and this is the free molecule; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/BeH2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G13

**BH3** — M: provenance copied; experimental attribution U: planar D₃ₕ; r₀(B–H) = 1.190 Å from the ν₃ band of free BH₃ (Kawaguchi, 1992); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/BH3.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G14

**CH4** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C–H) = 1.087 Å, T_d, d = r/√3 (the window's original preset, frozen); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CH4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G15

**NH3** — M: provenance copied; experimental attribution U: CCCBDB experimental r(N–H) = 1.0124 Å, ∠HNH = 106.67°, C₃ᵥ (the window's original preset, frozen); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/NH3.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G16

**H2O** — M: provenance copied; experimental attribution U: CCCBDB experimental r(O–H) = 0.9578 Å, ∠HOH = 104.5° (the window's original preset, frozen); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/H2O.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G17

**MgH2** — M: provenance copied; experimental attribution U: linear D∞h; r₀(Mg–H) = 1.7031 Å from the gas-phase IR emission spectrum (Shayesteh, Appadoo, Gordon & Bernath, 2003); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/MgH2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G18

**AlH3** — M: provenance copied; experimental attribution U: NOT A MEASUREMENT: monomeric AlH₃ has no determined gas-phase structure (Al₂H₆ is what has been observed). Planar D₃ₕ at r = 1.4769 Å, this repository's own RHF/STO-3G minimum on the vendored decimals (scanned by research/h2o-2026-09-11/scratch/fix-molecules.py). STO-3G shortens Al–H by ≈0.1 Å against correlated estimates; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/AlH3.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G19

**SiH4** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Si–H) = 1.4798 Å, T_d; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/SiH4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G20

**PH3** — M: provenance copied; experimental attribution U: CCCBDB experimental r(P–H) = 1.420 Å, ∠HPH = 93.345°, C₃ᵥ; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/PH3.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G21

**H2S** — M: provenance copied; experimental attribution U: CCCBDB experimental r(S–H) = 1.3356 Å, ∠HSH = 92.12°; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/H2S.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G22

**CO2** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C=O) = 1.160 Å, linear D∞h; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CO2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G23

**HCN** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C–H) = 1.0655 Å, r(C≡N) = 1.1532 Å, linear; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/HCN.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G24

**N2O** — M: provenance copied; experimental attribution U: CCCBDB experimental r(N–N) = 1.1282 Å, r(N–O) = 1.1842 Å, linear N–N–O; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/N2O.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G25

**O3** — M: provenance copied; experimental attribution U: CCCBDB experimental r(O–O) = 1.2717 Å, ∠OOO = 116.78°; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/O3.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G26

**SO2** — M: provenance copied; experimental attribution U: CCCBDB experimental r(S=O) = 1.4308 Å, ∠OSO = 119.33°; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/SO2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G27

**BF3** — M: provenance copied; experimental attribution U: CCCBDB experimental r(B–F) = 1.307 Å, planar D₃ₕ; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/BF3.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G28

**CF4** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C–F) = 1.315 Å, T_d; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CF4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G29

**H2O2** — M: provenance copied; experimental attribution U: CCCBDB experimental r(O–O) = 1.4556 Å, r(O–H) = 0.967 Å, ∠OOH = 102.32°, HOOH dihedral 113.70°, C₂; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/H2O2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G30

**C2H2** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C≡C) = 1.2033 Å, r(C–H) = 1.0605 Å, linear D∞h; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C2H2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G31

**C2H4** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C=C) = 1.339 Å, r(C–H) = 1.087 Å, ∠HCH = 117.4°, D₂ₕ (the window's original preset, frozen); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C2H4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G32

**C2H6** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C–C) = 1.5351 Å, r(C–H) = 1.094 Å, ∠CCH = 111.17°, D₃d staggered; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C2H6.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G33

**H2CO** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C=O) = 1.2078 Å, r(C–H) = 1.1161 Å, ∠HCH = 116.13°, C₂ᵥ; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/H2CO.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G34

**CH3OH** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C–O) = 1.4246 Å, r(O–H) = 0.9451 Å, r(C–H) = 1.0936 Å, ∠COH = 108.53°; the methyl group is placed IDEALLY TETRAHEDRAL about the C–O axis (∠OCH = 109.471°, staggered to O–H) rather than with the measured 106.7°/112.0° splitting — the idealisation is stated, not hidden; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CH3OH.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G35

**HCOOH** — M: provenance copied; experimental attribution U: CCCBDB experimental (Z conformer) r(C=O) = 1.202 Å, r(C–O) = 1.343 Å, r(O–H) = 0.972 Å, r(C–H) = 1.097 Å, ∠OCO = 124.9°, ∠COH = 106.3°, ∠HC=O = 124.1°, planar Cs; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/HCOOH.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G36

**CH3CN** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C≡N) = 1.158 Å, r(C–C) = 1.458 Å, r(C–H) = 1.087 Å, ∠HCC = 109.5°, C₃ᵥ; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CH3CN.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G37

**C3H6** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C–C) = 1.503 Å, r(C–H) = 1.083 Å, ∠HCH = 115.1°, D₃ₕ; each CH₂ bisector is radial in the ring plane, which is exact by symmetry rather than an idealisation; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C3H6.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G38

**C4H6** — M: provenance copied; experimental attribution U: gas electron diffraction (Kveseth, Seip & Stølevik, 1980) r(C1=C2) = 1.3410 Å, r(C2–C3) = 1.4632 Å, ∠CCC = 123.62°, trans C₂ₕ planar; every C–H is placed at the measured mean 1.090 Å with ∠CCH = 120.0° in the plane — the ED analysis's own ∠CCH lie within 1.5° of 120°, and the idealisation is stated; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C4H6.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G39

**C4H4O** — M: provenance copied; experimental attribution U: microwave r_s structure (Mata, Martin & Sørensen, 1977) r(O–C₂) = 1.362 Å, r(C₂=C₃) = 1.361 Å, r(C₃–C₄) = 1.431 Å, ∠C₂OC₅ = 106.55°, ∠OC₂C₃ = 110.68°, ∠C₂C₃C₄ = 106.05°; hydrogens at the measured 1.075/1.077 Å along the external ring bisector — stated as an idealisation of the measured ∠C–C–H; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C4H4O.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G40

**C5H5N** — M: provenance copied; experimental attribution U: microwave structure r(N–C₂) = 1.3402 Å, r(C₂–C₃) = 1.3945 Å, r(C₃–C₄) = 1.3944 Å, ∠C₂NC₆ = 116.94°, ∠NC₂C₃ = 123.80°, ∠C₂C₃C₄ = 118.53°, ∠C₃C₄C₅ = 118.40° (the six interior angles sum to 720.00°, so the ring closes); hydrogens at 1.0865/1.0826/1.0818 Å along the external ring bisector — stated as an idealisation; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C5H5N.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G41

**urea** — M: provenance copied; experimental attribution U: microwave heavy-atom values (Godfrey, Brown & Hunter, 1997) r(C=O) = 1.221 Å, r(C–N) = 1.378 Å, ∠NCN = 114.7°; the free molecule is slightly pyramidal at N and this entry is the PLANAR C₂ᵥ idealisation with r(N–H) = 1.005 Å at ∠CNH = 120° — the idealisation is stated; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/urea.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G42

**glycine** — M: provenance copied; experimental attribution U: gas electron diffraction of conformer I (Iijima, Tanaka & Onuma, 1991) r(C–C) = 1.526 Å, r(C–N) = 1.467 Å, r(C=O) = 1.205 Å, r(C–O) = 1.355 Å, ∠CCN = 112.1°, ∠CCO(=) = 125.1°, ∠CCO(–) = 111.6°, ∠COH = 112.3°; the CH₂ and NH₂ hydrogens are placed IDEALLY (∠HCH = 109.471°, ∠HNH = 107.0°, symmetric about the heavy-atom plane) at r(C–H) = 1.081 Å and r(N–H) = 1.001 Å — the idealisation is stated; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/glycine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G43

**C6H6** — M: provenance copied; experimental attribution U: CCCBDB experimental r(C–C) = 1.39 Å, r(C–H) = 1.09 Å, D₆ₕ, hydrogens at radius 2.48 Å (the window's original preset, frozen) — THE CAP; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C6H6.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G44

**NH4+** — M: provenance copied; experimental attribution U: r₀(N–H) = 1.021 Å, T_d, from the ν₃ infrared band of NH₄⁺ (Crofton & Oka, 1987); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/NH4+.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G45

**H3O+** — M: provenance copied; experimental attribution U: r₀(O–H) = 0.9758 Å, ∠HOH = 111.3°, C₃ᵥ, from the infrared spectrum of H₃O⁺ (Sears, Bunker, Davies et al., 1985); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/H3O+.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G46

**OH-** — M: provenance copied; experimental attribution U: r₀(O–H) = 0.964 Å from the rotational/vibrational spectrum of OH⁻; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/OH-.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G47

**CN-** — M: provenance copied; experimental attribution U: r₀(C–N) = 1.177 Å from the rotational spectrum of CN⁻ (Amano, 2005); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CN-.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G48

**CuH** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Cu–H) = 1.4626 Å (X¹Σ⁺, a closed-shell singlet; the Cu ATOM is ²S and cannot be done here); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CuH.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks Cu; no other basis was substituted.

### Geometry G49

**ZnH2** — M: provenance copied; experimental attribution U: linear D∞h; r₀(Zn–H) = 1.5241 Å from the gas-phase IR emission spectrum (Shayesteh, Tereszchuk, Bernath & Colin, 2003); immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/ZnH2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks Zn; no other basis was substituted.

Stability: {"status": "MEASURED", "internalStable": true, "externalStable": false, "meaning": "PySCF internal RHF orbital rotation and external RHF->UHF/complex probes; convergence alone does not certify stability"}

### Geometry G50

**GeH4** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Ge–H) = 1.5251 Å, T_d; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/GeH4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks Ge; no other basis was substituted.

### Geometry G51

**AsH3** — M: provenance copied; experimental attribution U: CCCBDB experimental r(As–H) = 1.511 Å, ∠HAsH = 92.1°, C₃ᵥ; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/AsH3.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks As; no other basis was substituted.

### Geometry G52

**H2Se** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Se–H) = 1.460 Å, ∠HSeH = 90.6°; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/H2Se.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks Se; no other basis was substituted.

### Geometry G53

**HBr** — M: provenance copied; experimental attribution U: CCCBDB experimental r(H–Br) = 1.4145 Å; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/HBr.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks Br; no other basis was substituted.

### Geometry G54

**Br2** — M: provenance copied; experimental attribution U: CCCBDB experimental r(Br–Br) = 2.2811 Å — 38 Cartesian AOs, the widest entry, and still cheaper than benzene because Br has only 8 shells; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/Br2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks Br; no other basis was substituted.

### Geometry G55

**alanine** — M: provenance copied; experimental attribution U: wwPDB Chemical Component Dictionary ALA ideal reference coordinates, free neutral component including leaving atoms; https://files.rcsb.org/ligands/view/ALA.cif; computed reference, UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/alanine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G56

**arginine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](CCCNC(=N)N)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; downloaded wwPDB reference had cationic protonation; neutral census connectivity built here instead; optimisation convergence UNVERIFIED (see optimisation diagnostics); current refinement supersedes the preceding incomplete optimisation attempt

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/arginine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 550.554158; M: objective evaluations = 37; M: maximum reported gradient = 7.734012017523995e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G57

**asparagine** — M: provenance copied; experimental attribution U: wwPDB Chemical Component Dictionary ASN ideal reference coordinates, free neutral component including leaving atoms; https://files.rcsb.org/ligands/view/ASN.cif; computed reference, UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/asparagine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G58

**aspartic-acid** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](CC(=O)O)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/aspartic-acid.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 810.602840; M: objective evaluations = 181; M: maximum reported gradient = 8.365611134664164e-05. CONVERGENCE: NORM OF PROJECTED GRADIENT <= PGTOL; one conformer, no vibrational Hessian or experimental comparison

### Geometry G59

**cysteine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](CS)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/cysteine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 302.180984; M: objective evaluations = 106; M: maximum reported gradient = 7.186445381890394e-05. CONVERGENCE: NORM OF PROJECTED GRADIENT <= PGTOL; one conformer, no vibrational Hessian or experimental comparison

### Geometry G60

**glutamine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](CCC(=O)N)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/glutamine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 1368.836090; M: objective evaluations = 157; M: maximum reported gradient = 9.744371410536079e-05. CONVERGENCE: NORM OF PROJECTED GRADIENT <= PGTOL; one conformer, no vibrational Hessian or experimental comparison

### Geometry G61

**glutamic-acid** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](CCC(=O)O)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/glutamic-acid.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 3112.348198; M: objective evaluations = 225; M: maximum reported gradient = 8.825370563148027e-05. CONVERGENCE: NORM OF PROJECTED GRADIENT <= PGTOL; one conformer, no vibrational Hessian or experimental comparison

### Geometry G62

**histidine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](Cc1cnc[nH]1)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/histidine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 2264.177702; M: objective evaluations = 167; M: maximum reported gradient = 9.042111996571123e-05. CONVERGENCE: NORM OF PROJECTED GRADIENT <= PGTOL; one conformer, no vibrational Hessian or experimental comparison

### Geometry G63

**isoleucine** — M: provenance copied; experimental attribution U: wwPDB Chemical Component Dictionary ILE ideal reference coordinates, free neutral component including leaving atoms; https://files.rcsb.org/ligands/view/ILE.cif; computed reference, UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/isoleucine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G64

**leucine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity CC(C)C[C@H](N)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible; optimisation FAILED, best visited geometry only, UNVERIFIED; current refinement supersedes the preceding incomplete optimisation attempt

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/leucine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 502.354581; M: objective evaluations = 42; M: maximum reported gradient = 9.304601013687686e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G65

**lysine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](CCCCN)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; downloaded wwPDB reference had cationic protonation; neutral census connectivity built here instead

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/lysine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 2607.182510; M: objective evaluations = 126; M: maximum reported gradient = 5.9035301118282035e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G66

**methionine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](CCSC)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/methionine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 3379.869660; M: objective evaluations = 223; M: maximum reported gradient = 7.597538759673839e-05. CONVERGENCE: NORM OF PROJECTED GRADIENT <= PGTOL; one conformer, no vibrational Hessian or experimental comparison

### Geometry G67

**phenylalanine** — M: provenance copied; experimental attribution U: wwPDB Chemical Component Dictionary PHE ideal reference coordinates, free neutral component including leaving atoms; https://files.rcsb.org/ligands/view/PHE.cif; computed reference, UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/phenylalanine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G68

**proline** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity O=C(O)[C@@H]1CCCN1; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/proline.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 253.115923; M: objective evaluations = 48; M: maximum reported gradient = 6.759136652823017e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G69

**serine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](CO)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/serine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 162.277442; M: objective evaluations = 39; M: maximum reported gradient = 7.531018373363452e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G70

**threonine** — M: provenance copied; experimental attribution U: wwPDB Chemical Component Dictionary THR ideal reference coordinates, free neutral component including leaving atoms; https://files.rcsb.org/ligands/view/THR.cif; computed reference, UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/threonine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G71

**tryptophan** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](Cc1c[nH]c2ccccc12)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/tryptophan.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 3586.167809; M: objective evaluations = 137; M: maximum reported gradient = 9.732007965013167e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G72

**tyrosine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity N[C@@H](Cc1ccc(O)cc1)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/tyrosine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 2053.950988; M: objective evaluations = 92; M: maximum reported gradient = 8.765479239158935e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G73

**valine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built from checked neutral connectivity CC(C)[C@H](N)C(=O)O; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/valine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 1088.073098; M: objective evaluations = 170; M: maximum reported gradient = 3.941539170904118e-05. Optimization terminated successfully.; one conformer, no vibrational Hessian or experimental comparison

### Geometry G74

**adenine** — M: provenance copied; experimental attribution U: https://raw.githubusercontent.com/psi4/psi4/master/psi4/share/psi4/databases/S22.py; adenine-thymine; published computed benchmark reference; fragment(s) [0]; UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/adenine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G75

**guanine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; neutral canonical tautomer connectivity Nc1nc2[nH]cnc2c(=O)[nH]1; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/guanine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 585.381582; M: objective evaluations = 38; M: maximum reported gradient = 4.663658475356769e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G76

**cytosine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; neutral canonical tautomer connectivity Nc1cc[nH]c(=O)n1; coordinate downloads inaccessible

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/cytosine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 168.019394; M: objective evaluations = 24; M: maximum reported gradient = 6.022970326036159e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G77

**thymine** — M: provenance copied; experimental attribution U: https://raw.githubusercontent.com/psi4/psi4/master/psi4/share/psi4/databases/S22.py; adenine-thymine; published computed benchmark reference; fragment(s) [1]; UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/thymine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G78

**uracil** — M: provenance copied; experimental attribution U: https://raw.githubusercontent.com/psi4/psi4/master/psi4/share/psi4/databases/S22.py; uracil; published computed benchmark reference; fragment(s) [0]; UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/uracil.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G79

**Gly-Gly** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity NCC(=O)NCC(=O)O; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/Gly-Gly.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 653.755021; M: objective evaluations = 112; M: maximum reported gradient = 8.067438273684502e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G80

**N-methylacetamide** — M: provenance copied; experimental attribution U: https://raw.githubusercontent.com/psi4/psi4/master/psi4/share/psi4/databases/S66.py; N-methylacetamide monomer from S66 dimer; published computed benchmark reference; fragment(s) [0]; UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/N-methylacetamide.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G81

**imidazole** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity c1ncc[nH]1; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/imidazole.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 15.114400; M: objective evaluations = 15; M: maximum reported gradient = 6.018991834721987e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G82

**indole** — M: provenance copied; experimental attribution U: https://raw.githubusercontent.com/psi4/psi4/master/psi4/share/psi4/databases/S22.py; indole-benzene; published computed benchmark reference; fragment(s) [1]; UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/indole.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G83

**phosphoric-acid** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity OP(=O)(O)O; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/phosphoric-acid.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 6.757695; M: objective evaluations = 7; M: maximum reported gradient = 5.20083321555731e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G84

**ribose** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity OCC1OC(O)C(O)C1O; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified; optimisation FAILED, best visited geometry only, UNVERIFIED; current refinement supersedes the preceding incomplete optimisation attempt

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/ribose.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 742.243554; M: objective evaluations = 76; M: maximum reported gradient = 7.65246750633608e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G85

**cubane** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity C12C3C4C1C5C2C3C45; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/cubane.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 29.685069; M: objective evaluations = 5; M: maximum reported gradient = 9.514062403681578e-06. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G86

**neopentane** — M: provenance copied; experimental attribution U: https://raw.githubusercontent.com/psi4/psi4/master/psi4/share/psi4/databases/S66.py; neopentane monomer from S66 dimer; published computed benchmark reference; fragment(s) [0]; UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/neopentane.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G87

**naphthalene** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity c1ccc2ccccc2c1; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/naphthalene.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 163.772351; M: objective evaluations = 21; M: maximum reported gradient = 6.782853679898615e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G88

**Si5H12** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity Si[Si](Si)(Si)Si; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/Si5H12.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 103.690455; M: objective evaluations = 17; M: maximum reported gradient = 9.680897269959132e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G89

**adamantane** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity C1C2CC3CC1CC(C2)C3; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/adamantane.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 103.722278; M: objective evaluations = 5; M: maximum reported gradient = 2.832915807715608e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G90

**caffeine** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity Cn1c(=O)c2c(ncn2C)n(C)c1=O; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/caffeine.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 2438.783945; M: objective evaluations = 97; M: maximum reported gradient = 8.328301192239707e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G91

**DMT** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built connectivity CN(C)CCc1c[nH]c2ccccc12; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/DMT.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 3494.385562; M: objective evaluations = 120; M: maximum reported gradient = 8.38644043694714e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G92

**Li4H4** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; finite alternating cube; scalar edge-length RHF optimisation under Td symmetry

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/Li4H4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 0.582196; M: objective evaluations = 10; M: maximum reported gradient = None. constrained common-distance optimisation preserving initial point symmetry; not an unconstrained minimum proof

### Geometry G93

**Li4F4** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; finite alternating cube; scalar edge-length RHF optimisation under Td symmetry

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/Li4F4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 1.171423; M: objective evaluations = 10; M: maximum reported gradient = None. constrained common-distance optimisation preserving initial point symmetry; not an unconstrained minimum proof

### Geometry G94

**Mg4O4** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; finite alternating cube; scalar edge-length RHF optimisation under Td symmetry

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/Mg4O4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 5.921490; M: objective evaluations = 10; M: maximum reported gradient = None. constrained common-distance optimisation preserving initial point symmetry; not an unconstrained minimum proof

### Geometry G95

**Na4Cl4** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; finite alternating cube; scalar edge-length RHF optimisation under Td symmetry

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/Na4Cl4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 10.944078; M: objective evaluations = 10; M: maximum reported gradient = None. constrained common-distance optimisation preserving initial point symmetry; not an unconstrained minimum proof

### Geometry G96

**Na2Cl2** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; alternating square, RHF edge-length optimisation under D2h symmetry

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/Na2Cl2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 1.478692; M: objective evaluations = 11; M: maximum reported gradient = None. constrained common-distance optimisation preserving initial point symmetry; not an unconstrained minimum proof

### Geometry G97

**ice-hexamer** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built finite hydrogen-bonded hexamer ring; unconstrained RHF relaxation, topology must be reviewed

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/ice-hexamer.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 22.829579; M: objective evaluations = 11; M: maximum reported gradient = 2.3881520210267126e-06. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G98

**ice-cube** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; built finite hydrogen-bonded octamer cube; unconstrained RHF relaxation, topology must be reviewed; optimisation convergence UNVERIFIED (see optimisation diagnostics); current refinement supersedes the preceding incomplete optimisation attempt

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/ice-cube.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 458.967084; M: objective evaluations = 115; M: maximum reported gradient = 9.182664925821982e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

### Geometry G99

**TiCl4** — M: provenance copied; experimental attribution U: NIST CCCBDB experimental Ti-Cl bond length, Td reconstruction; https://cccbdb.nist.gov/exp2x.asp?casno=7550450; DOI https://doi.org/10.1063/1.1727535

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/TiCl4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks Ti; no other basis was substituted.

Stability: {"status": "MEASURED", "internalStable": true, "externalStable": true, "meaning": "PySCF internal RHF orbital rotation and external RHF->UHF/complex probes; convergence alone does not certify stability"}

### Geometry G100

**GeCl4** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; experimental coordinate fetch inaccessible; tetrahedral RHF bond-length optimisation

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/GeCl4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 3.929519; M: objective evaluations = 10; M: maximum reported gradient = None. constrained common-distance optimisation preserving initial point symmetry; not an unconstrained minimum proof

U: 6-31+G* count unavailable because the installed requested table lacks Ge; no other basis was substituted.

### Geometry G101

**KrF2** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; experimental coordinate fetch inaccessible; linear RHF bond-length optimisation

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/KrF2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 0.605091; M: objective evaluations = 11; M: maximum reported gradient = None. constrained common-distance optimisation preserving initial point symmetry; not an unconstrained minimum proof

U: 6-31+G* count unavailable because the installed requested table lacks Kr; no other basis was substituted.

### Geometry G102

**SeO2** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; experimental coordinate fetch inaccessible; bent RHF optimisation

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/SeO2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 5.539387; M: objective evaluations = 5; M: maximum reported gradient = 3.1029468186005715e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

U: 6-31+G* count unavailable because the installed requested table lacks Se; no other basis was substituted.

### Geometry G103

**KBr** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; experimental coordinate fetch inaccessible; diatomic RHF optimisation

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/KBr.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 0.881565; M: objective evaluations = 10; M: maximum reported gradient = None. constrained common-distance optimisation preserving initial point symmetry; not an unconstrained minimum proof

U: 6-31+G* count unavailable because the installed requested table lacks Br; no other basis was substituted.

### Geometry G104

**NiCO4** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; class representative built here; unconstrained Cartesian RHF optimisation from the initial ideal symmetry; final detected group reported

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/NiCO4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 93.802777; M: objective evaluations = 8; M: maximum reported gradient = 1.0185102079063313e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

U: 6-31+G* count unavailable because the installed requested table lacks Ni; no other basis was substituted.

Stability: {"status": "MEASURED", "internalStable": true, "externalStable": false, "meaning": "PySCF internal RHF orbital rotation and external RHF->UHF/complex probes; convergence alone does not certify stability"}

### Geometry G105

**FeCO5** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; class representative built here; unconstrained Cartesian RHF optimisation from the initial ideal symmetry; final detected group reported

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/FeCO5.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 182.905807; M: objective evaluations = 11; M: maximum reported gradient = 6.594446179519764e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

U: 6-31+G* count unavailable because the installed requested table lacks Fe; no other basis was substituted.

Stability: {"status": "MEASURED", "internalStable": true, "externalStable": true, "meaning": "PySCF internal RHF orbital rotation and external RHF->UHF/complex probes; convergence alone does not certify stability"}

### Geometry G106

**CrCO6** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; class representative built here; unconstrained Cartesian RHF optimisation from the initial ideal symmetry; final detected group reported

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CrCO6.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 127.318060; M: objective evaluations = 6; M: maximum reported gradient = 2.3536729607087636e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

U: 6-31+G* count unavailable because the installed requested table lacks Cr; no other basis was substituted.

Stability: {"status": "MEASURED", "internalStable": true, "externalStable": false, "meaning": "PySCF internal RHF orbital rotation and external RHF->UHF/complex probes; convergence alone does not certify stability"}

### Geometry G107

**ferrocene** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; eclipsed D5h built sandwich, RHF optimisation

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/ferrocene.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 225.388971; M: objective evaluations = 8; M: maximum reported gradient = 1.8006927081870572e-05. Optimization terminated successfully.; bond-angle preconditioned Cartesian BFGS; one conformer, no vibrational Hessian or experimental comparison

U: 6-31+G* count unavailable because the installed requested table lacks Fe; no other basis was substituted.

Stability: {"status": "MEASURED", "internalStable": true, "externalStable": true, "meaning": "PySCF internal RHF orbital rotation and external RHF->UHF/complex probes; convergence alone does not certify stability"}

### Geometry G108

**B12H12--** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; ideal icosahedral borane cage built here; RHF relaxation

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/B12H12--.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 198.032894; M: objective evaluations = 8; M: maximum reported gradient = None. Ih-constrained cage radius and radial X-H distance optimisation; experimental geometry and unconstrained minimum UNVERIFIED

### Geometry G109

**C20H20** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; ideal dodecahedral carbon cage built here; RHF relaxation

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C20H20.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 1317.826752; M: objective evaluations = 8; M: maximum reported gradient = None. Ih-constrained cage radius and radial X-H distance optimisation; experimental geometry and unconstrained minimum UNVERIFIED

### Geometry G110

**C60** — M: provenance copied; experimental attribution U: Round 2 reference geometry: tools/symmetry/round2-sol-exact.py and research/release-0.4.0/measure/round2-sol-exact.json; ideal truncated icosahedron, equal C-C edges; DERIVED, UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/C60.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G111

**HI** — M: provenance copied; experimental attribution U: UNVERIFIED initial model coordinates only; cannot optimise on the required vendored STO-3G because iodine/xenon are absent; not a usable geometry record

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/HI.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks I; no other basis was substituted.

### Geometry G112

**CH3I** — M: provenance copied; experimental attribution U: UNVERIFIED initial model coordinates only; cannot optimise on the required vendored STO-3G because iodine/xenon are absent; not a usable geometry record

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/CH3I.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks I; no other basis was substituted.

### Geometry G113

**XeF2** — M: provenance copied; experimental attribution U: UNVERIFIED initial model coordinates only; cannot optimise on the required vendored STO-3G because iodine/xenon are absent; not a usable geometry record

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/XeF2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks Xe; no other basis was substituted.

### Geometry G114

**XeF4** — M: provenance copied; experimental attribution U: UNVERIFIED initial model coordinates only; cannot optimise on the required vendored STO-3G because iodine/xenon are absent; not a usable geometry record

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/XeF4.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks Xe; no other basis was substituted.

### Geometry G115

**I2** — M: provenance copied; experimental attribution U: UNVERIFIED initial model coordinates only; cannot optimise on the required vendored STO-3G because iodine/xenon are absent; not a usable geometry record

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/I2.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

U: 6-31+G* count unavailable because the installed requested table lacks I; no other basis was substituted.

### Geometry G116

**A-T** — M: provenance copied; experimental attribution U: https://raw.githubusercontent.com/psi4/psi4/master/psi4/share/psi4/databases/S22.py; adenine-thymine; published computed benchmark reference; fragment(s) [0, 1]; UNVERIFIED against experiment

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/A-T.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

### Geometry G117

**G-C** — M: provenance copied; experimental attribution U: optimised here, UNVERIFIED against experiment; assembled neutral monomers, intermolecular RHF relaxation; Watson-Crick hydrogen-bond topology UNVERIFIED; Watson-Crick donor/acceptor triple aligned, rigid-monomer constrained separation optimisation, fixed orientation; Watson-Crick donor/acceptor triple aligned, rigid-monomer constrained separation optimisation, fixed orientation; orientation refined from ring-plane frames

Authoritative final coordinates and charge are in `census.json`. Raw attempts are checkpointed in `rows/G-C.json`; explicit `-refined`/`-geometry-refined` files preserve subsequent attempts without erasing earlier observations.

M: optimiser converged = True; M: wall seconds = 119.904233; M: objective evaluations = 17; M: maximum reported gradient = None. rigid separately relaxed G/C monomers; donor/acceptor triple G(O6,N1,N2)-C(N4,N3,O2) Kabsch aligned, fixed orientation, constrained contact-separation optimisation; hydrogen-bond angles, Watson-Crick topology and unconstrained minimum UNVERIFIED; refined orientation from complete heavy-atom ring planes, outward base edges facing each other

## Reproduction and limits

In a fresh checkout/destination, run the following tools in order: `node tools/library/app-probe.mjs --inventory`; `~/bin/scipython -I tools/library/prepare.py`; `~/bin/scipython tools/library/bse-coverage.py`; `~/bin/scipython -I tools/library/bse-coverage.py`; `~/bin/scipython -I tools/library/frontier.py`; `~/bin/scipython -I tools/library/census.py --precondition`; `node tools/library/app-probe.mjs --rows`; `~/bin/scipython -I tools/library/field-check.py`; `node tools/library/validate.mjs`; `node tools/library/audit.mjs`; `~/bin/scipython -I tools/library/geometry-audit.py`; `~/bin/scipython -I tools/library/report.py`. Census rows are restartable checkpoints; outputs refuse overwriting. This census used Cartesian L-BFGS-B, BFGS and bond-angle-preconditioned BFGS; the saved geometry diagnostics identify the method where recorded. Scalar/cage/pair constraints are explicit. Final coordinates in `census.json` are the exact energy inputs; a fresh relaxation may find a different conformer, and wall times are not reproducible byte-for-byte. For reconstruction, `C_app = R * P * C_pyscf`, where P permutes AO rows into atom/stable-l/component order and R is md.js Cartesian normalisation. The C60 record stores explicit permutation and scale arrays and the full water proof. No alternate app solver, basis vendoring, installed record, browser, server, commit, push or tag is part of this census.

U: these data do not certify C60 experimental geometry, an unconstrained RHF minimum for constrained clusters/cages, absolute stereochemistry of handmade amino-acid conformers, canonical gauges within C60's degenerate sets, Watson-Crick geometry of the assembled G-C model, response/spectrum payloads, record-open latency or GPU/iPad reconstruction. A-T uses the cited published reference pair. The generated tables report the actual final geometry's detected group and the optimiser's status. File status is DRAFT until the later production schema and validation land.
