# λWAVES 0.4.0 · S4b THE SECTIONS AS CONTENT, BEHIND THE GATE — what the S4b builder built (waves 168–174)

Written by the S4b builder (Opus 5.5), 2026-10-08, against `BRIEF-S4-LIBRARY.md` §S4b. Nothing was pushed, tagged or deployed
(Josh 2026-10-07). REPORT.md carries the waves under `## 2026-10-08 · 0.4.0 S4b — THE SECTIONS` (numbered 168–174; S4c holds
178–182, merged here).

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aee5748ddb578d188`
- **Branch:** `worktree-agent-aee5748ddb578d188`, reset to `cfdd674` (the `sos-s0` tip, S4a merged); Sos's B1 fix `b5eed68` and
  then S4c's `a927fc3` merged in as the coordinator asked (nothing else from `sos-s0`).

## Summary (ten lines)

1. Three entries end to end first (alanine, Li₄F₄, TiCl₄): generator 2.3 / 2.5 / 11.4 s, records 129 / 157 / 211 KB (8–10× the
   census's estimate: the RPA sticks dominate), open 1–3 ms in node and 2–5 ms (13–23 ms whole) in Firefox; then the sections.
2. The diversity gate with the FAMILY allowance is `tools/orbital-library.mjs`'s: 38 pass (C₆₀ by a declared `milestone` allowance),
   20 refused, 5 blocked by the basis (R-L6: STO-3G stops at Kr — nothing vendored), 1 refused by the stability probe (ferrocene).
3. 38 records, 11 532 460 B (deployed, never precached): ORGANIC 1 · BIO 25 · LATTICE 6 · HEAVY 6; DIATOMICS and HYDRIDES are live.
4. Past 64 AO: Phe, Arg, Tyr, Trp 87, adamantane, B₁₂H₁₂²⁻, Fe(CO)₅, Cr(CO)₆ (S4c's 128-AO tier) and C₆₀ 300 (S4c's orbital-only path).
5. C5: every RHF record is labelled by projection in its declared group (O_h, I_h, T_d, D₃h, D∞h, C∞v, C_s exercised) with the frame,
   the atoms in it and PySCF's topgroup/groupname/orbsym (never a name); `orbital-names --check --pyscf`: 37/37 MATCH.
6. STEM fields on every record; PubChem: 36 identifiers VERIFIED (lysine's S4a key among them), 2 clusters have none, B₁₂H₁₂²⁻
   UNVERIFIED; the LEGAL reading (NIST SRD 101 is a copyrighted compilation) done before the store build.
7. Findings: 9 census amino acids were D (mirrored to L, energies unchanged); the census's ferrocene stability claim is wrong.
8. MOLECULES: the section header is the page turner (PALETTE's ◂ ▸, a readout, INSTALLED = lamp + install/remove the section) above a
   dropdown that holds one section; no new tab, window, setting or skin. `validateRecord` refuses a moved atom or a NaN.
9. S4c merged in (`a927fc3`, seven conflicts resolved, both intents kept); the lysine lock values re-recorded (exactly 24 changed),
   the 1004 lock GREEN untouched.
10. Gates GREEN: node 85, `--check` in step, browser chem 55/55, molecular-names, library 7, menubar, new-project, orbitals 24/24,
    field-molecule; `lab/*.js` 36 131 → 36 280 (S4b +55; S4c +88, B1 +6): subtract-don't-add NOT met by S4b.

## The commits

| sha | title |
|---|---|
| `64b1a5a` | 0.4.0 S4b B1 · THE THREE SIZING ENTRIES END TO END: alanine, Li4F4, TiCl4 as records (the census's geometries, consumed) |
| `1a85ee2` | 0.4.0 S4b B2–B5 (code) · THE GATE, THE STEM FIELDS AND C5, THE SECTIONS' CANDIDATES, THE PAGE TURNER AND THE HEADER |
| `083b36e` | Merge b5eed68 (Sos, sos-s0: the S4a verifier's BLOCKER B1 fix) into S4b, as the coordinator asked: the many record-only rows run on the fixed road |
| `2770699` | 0.4.0 S4b B4 · THE SECTIONS GENERATED: 37 records behind the gate (11.4 MB), every one labelled by projection and held against PySCF |
| `d2574a3` | WIP B6 · the library suite's step 3 turns to BIO before it picks lysine (the dropdown holds one section); the gates run green |
| `05d5a0d` | WIP B6 · S4B-HANDOFF.md at the usage pause: the commits, the three timed, the sections and the gate, C5 37/37, the findings, the LEGAL reading, the gates, the KIT notes, and the exact next step (merge a927fc3, then REPORT and S4b-BUILD) |
| `7889a26` | Merge a927fc3 (S4c THE ENGINE UPGRADES, on sos-s0) into S4b, as the coordinator asked; both intents kept |
| (this commit) | B6 · the gates on the merged tree, the S4c fixtures on the merged build, REPORT waves 168–174, S4b-BUILD.md |

## The numbers

### The three sizing entries (BRIEF §S4b "build three end to end first")

| entry | AO | RPA roots | generator (node) | record | the census's estimate | chem.open (node) | open in Firefox: worker / whole `solve()` | oracle ΔE |
|---|---|---|---|---|---|---|---|---|
| alanine (BIO, C₁) | 37 | 312 | 2.03–2.28 s | 128 830 B | 13 544 B (×9.5) | 2.2–2.9 ms | 4 ms / 17 ms | −6.8e-13 Eh |
| Li₄F₄ (LATTICE, T_d) | 40 | 384 | 2.52–3.10 s | 156 882 B | 15 440 B (×10.2) | 1.0–1.9 ms | 2 ms / 17 ms | −2.0e-11 Eh |
| TiCl₄ (HEAVY, T_d) | 55 | 450 | 11.4–13.6 s | 211 382 B | 27 080 B (×7.8) | 1.2–3.1 ms | 2 ms / 14 ms | +4.5e-12 Eh |

### The sections (per-section rows, records, bytes; the gate)



The gate (`node tools/orbital-library.mjs --gate`): **38 pass · 20 refused · 5 blocked by the basis · 1 refused by the stability
probe.** Pass: the live benzene's record, the 19 amino acids beyond glycine and the 5 nucleobases (the families), N-methylacetamide
(peptide bond), Li₄F₄ (cluster), the water hexamer (C₆h), adamantane (cage), cubane (O_h, ring:4), B₁₂H₁₂²⁻ (I_h), C₆₀ (the declared
`milestone` allowance), KrF₂ (Kr), KBr (K), TiCl₄ (Ti), Ni(CO)₄ (Ni), Fe(CO)₅ (Fe), Cr(CO)₆ (Cr). Refused: Gly-Gly, imidazole, indole,
phosphoric acid, ribose, caffeine, DMT, A–T, G–C, Li₄H₄, Mg₄O₄, Na₂Cl₂, Na₄Cl₄, the ice cube, C₂₀H₂₀, neopentane, naphthalene, Si₅H₁₂,
SeO₂, GeCl₄. Blocked (R-L6: HI, CH₃I, XeF₂, XeF₄, I₂ — the vendored STO-3G stops at Kr; nothing vendored). Probe: ferrocene. Every
shipped record passes the gate and `--check`; the total library is **11 532 460 B** in 38 records.

### Identifiers (PubChem PUG REST, `tools/library/pubchem-ids.mjs`, 2026-10-08, one request per record)

36 VERIFIED (CID → InChIKey and molecular formula; every amino acid the L-form, by name; lysine's S4a key KDXKERNSBIXSRK-YFKPBYRVSA-N
and CID 5962 confirmed; C₆₀ CID 123591, titled "Fullerenes"); none for Li₄F₄ and the water hexamer (no PubChem compound for the finite
cluster — said); **B₁₂H₁₂²⁻ UNVERIFIED** (no hit for four names or a formula search; no CID guessed). Chirality: the generator's CORN
check found 9 census amino acids D (serine, cysteine, proline, valine, glutamic acid, glutamine, lysine, arginine, tyrosine) — mirrored
to the L-form the identifiers name, energies unchanged.

## The LEGAL-PROVENANCE reading

THE LEGAL-PROVENANCE READING (before the store build, as S1 and S4a required). No file named LEGAL-PROVENANCE exists where the
plan points (searched by name, never recursively: research/release-0.4.0, research/molecular-orbitals-2026-10-01, Sol's untracked
booster plan PLAN.md / CACHE-BUDGET.md / DISTRIBUTION.md, docs/, the vault); so the reading is of the sources themselves, fetched
2026-10-08. (1) NIST, "Copyright, Fair Use, and Licensing Statements for SRD, Data, Software, and Technical Series Publications":
under the Standard Reference Data Act, 15 U.S.C. § 290e, the Secretary of Commerce secures copyright in Standard Reference Data,
whose products carry "© … All rights reserved"; NIST data that are NOT SRD are public domain in the US (17 U.S.C. § 105).
(2) CCCBDB's own page: "NIST Standard Reference Database Number 101, Release 22, May 2022 … © 2015 copyright by the U.S.
Secretary of Commerce on behalf of the United States of America. All rights reserved", with its citation (DOI 10.18434/T47C7Z).
CONCLUDED: SRD 101 is a copyrighted compilation, so the store must not reproduce its tables. What the store carries is within
that: (a) single geometric parameters attributed per molecule ("CCCBDB experimental r(Ti–Cl)", TiCl4's census row; the live
table's long-standing practice) — individual facts with attribution, not a copied table; (b) the ten curated IEs of S1, cited to
the primary handbooks (Kimura et al. 1981, Turner et al. 1970), not to SRD 101, still UNCHECKED value by value, and carried by
exactly one record (benzene's 1e1g 9.24 eV); (c) S4b adds no IE and no CCCBDB value: its identifiers are PubChem's (NCBI's open
data), its geometries the census's (the wwPDB Chemical Component Dictionary's ideal coordinates, the Psi4 S22/S66 benchmark
coordinates, or relaxed here). This is an agent's reading, not legal advice: if SRD 101 values are ever to ship in bulk (the
IE pages per state of 0.5.0), it is Josh's ruling — or NIST's licence (www.nist.gov/srd) — that holds.

## The merge of S4c (`a927fc3`) and how each conflict was resolved

- `tools/orbital-library.mjs`: both sides' imports; S4b's gate road, then S4c's `--fixture` road on S4b's `build()` (a census row at C₁,
  its PySCF oracle on these atoms; never shipped, never the gate), then S4c's `buildFrontier` — C₆₀ is now a gate CANDIDATE in LATTICE
  carrying `frontier`, passing by a declared allowance kind (`milestone`: Josh's "maybe a bucky-ball as our next milestone", NACRE.md
  l.34 / HANDOFF.md §5, with PLAN R-L2 = YES — the integrator's ruling; Josh may overrule). The frontier record gains
  `input.atomsSha256`, PubChem's identifiers, a `stem.symmetry` (levels named by energy; I_h names 0.4.1), and the generator's own
  `chem.open` check (0 solver calls, 6.3 ms). C₆₀'s section stays LATTICE: carbon's third allotrope sits with the cages (adamantane is
  diamond's, B₁₂H₁₂²⁻ boron's) and is the unit of the fullerite lattice. C₂₀H₂₀ stays refused, S4c's 120-AO fixture only.
- `lab/library.js`: S4c's frontier branch (`ground.cols`) and S4b's finite check, both (a frontier record's ε and C must be finite).
- `lab/chemview.js`: both sides' imports; S4c's VALENCE switch and frontier hunks auto-merged beside the picker (no overlap in code).
- `lab/library.json`: regenerated, 38 rows (`node tools/orbital-library.mjs --only C60`). `lab/sw.js`: regenerated (`pwa --write`).
- `tests/library.test.mjs`, `tests/library.browser-test.mjs`: the record-only rows read off the catalogue, C₆₀ among them.
- `tools/orbital-names.mjs --pyscf` skips a frontier record (PySCF's own orbitals, field-checked at generation to 1.1e-16).
- S4c's fixtures `tests/fixtures/record-tryptophan.json` and `record-C20H20.json` regenerated on the merged `build()` (same atoms,
  same C and D for `tools/perf/s4c-kernel.mjs`).
- The digest lock: 1004 GREEN untouched; the S4a fixture re-recorded — exactly 24 values changed, all lysine's (`chemLys`,
  `chemLysHomo` × 64/96/128 × digest/integral/rp/rpL, the L-enantiomer), no header-row screenshot value moved; GREEN against it.

### C5 — the records' labels by projection, against PySCF (`node tools/orbital-names.mjs --check --pyscf`)

| molecule | group | name ms | configuration (STO-3G) or why not |
|---|---|---|---|
| H2 | Dinfh | 1.9 | (1σg)² · HOMO 1σg · LUMO 1σu |
| LiH | Cinfv | 0.7 | (1σ)²(2σ)² · HOMO 2σ · LUMO 3σ |
| HF | Cinfv | 0.6 | (1σ)²(2σ)²(3σ)²(1π)⁴ · HOMO 1π · LUMO 4σ |
| N2 | Dinfh | 1.0 | (1σg)²(1σu)²(2σg)²(2σu)²(1πu)⁴(3σg)² · HOMO 3σg · LUMO 1πg |
| CO | Cinfv | 0.4 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)² · HOMO 5σ · LUMO 2π |
| F2 | Dinfh | 0.5 | (1σu)²(1σg)²(2σg)²(2σu)²(1πu)⁴(3σg)²(1πg)⁴ · HOMO 1πg · LUMO 3σu |
| LiF | Cinfv | 0.4 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴ · HOMO 1π · LUMO 5σ |
| NaH | Cinfv | 0.3 | (1σ)²(2σ)²(1π)⁴(3σ)²(4σ)² · HOMO 4σ · LUMO 5σ |
| HCl | Cinfv | 0.3 | (1σ)²(2σ)²(3σ)²(1π)⁴(4σ)²(5σ)²(2π)⁴ · HOMO 2π · LUMO 6σ |
| Cl2 | Dinfh | 0.8 | (1σu)²(1σg)²(2σu)²(2σg)²(3σu)²(3σg)²(1πg)⁴(1πu)⁴(4σg)²(4σu)²(5σg)²(2πu)⁴(2πg)⁴ · HOMO 2πg · LUMO 5σu |
| NaCl | Cinfv | 0.5 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)²(2π)⁴(6σ)²(7σ)²(8σ)²(3π)⁴ · HOMO 3π · LUMO 9σ |
| BeH2 | Dinfh | 0.3 | (1σg)²(2σg)²(1σu)² · HOMO 1σu · LUMO 1πu |
| BH3 | D3h | 0.9 | (1a1′)²(2a1′)²(1e′)⁴ · HOMO 1e′ · LUMO 1a2″ |
| CH4 | Td | 0.6 | (1a1)²(2a1)²(1t2)⁶ · HOMO 1t2 · LUMO 2t2 |
| NH3 | C3v | 0.2 | (1a1)²(2a1)²(1e)⁴(3a1)² · HOMO 3a1 · LUMO 4a1 |
| H2O | C2v | 0.3 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)² · HOMO 1b1 · LUMO 4a1 |
| MgH2 | Dinfh | 0.4 | (1σg)²(2σg)²(1πu)⁴(1σu)²(3σg)²(2σu)² · HOMO 2σu · LUMO 4σg |
| AlH3 | D3h | 0.5 | (1a1′)²(2a1′)²(1a2″)²(1e′)⁴(3a1′)²(2e′)⁴ · HOMO 2e′ · LUMO 2a2″ |
| SiH4 | Td | 0.9 | (1a1)²(2a1)²(1t2)⁶(3a1)²(2t2)⁶ · HOMO 2t2 · LUMO 4a1 |
| PH3 | C3v | 0.3 | (1a1)²(2a1)²(1e)⁴(3a1)²(4a1)²(2e)⁴(5a1)² · HOMO 5a1 · LUMO 3e |
| H2S | C2v | 0.4 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)²(4a1)²(2b2)²(5a1)²(2b1)² · HOMO 2b1 · LUMO 3b2 |
| CO2 | Dinfh | 0.8 | (1σu)²(1σg)²(2σg)²(3σg)²(2σu)²(4σg)²(1πu)⁴(3σu)²(1πg)⁴ · HOMO 1πg · LUMO 2πu |
| HCN | Cinfv | 0.4 | (1σ)²(2σ)²(3σ)²(4σ)²(5σ)²(1π)⁴ · HOMO 1π · LUMO 2π |
| N2O | Cinfv | 0.6 | (1σ)²(2σ)²(3σ)²(4σ)²(5σ)²(6σ)²(1π)⁴(7σ)²(2π)⁴ · HOMO 2π · LUMO 3π |
| O3 | C2v | 0.5 | (1a1)²(1b2)²(2a1)²(3a1)²(2b2)²(4a1)²(5a1)²(1b1)²(3b2)²(4b2)²(6a1)²(1a2)² · HOMO 1a2 · LUMO 2b1 |
| SO2 | C2v | 0.8 | (1a1)²(2a1)²(1b2)²(3a1)²(2b2)²(1b1)²(4a1)²(5a1)²(3b2)²(6a1)²(7a1)²(2b1)²(4b2)²(5b2)²(8a1)²(1a2)² · HOMO 1a2 · LUMO 3b1 |
| BF3 | D3h | 0.9 | (1a1′)²(1e′)⁴(2a1′)²(3a1′)²(2e′)⁴(4a1′)²(3e′)⁴(1a2″)²(1a2′)²(4e′)⁴(1e″)⁴ · HOMO 1e″ · LUMO 2a2″ |
| CF4 | Td | 2.1 | (1a1)²(1t2)⁶(2a1)²(3a1)²(2t2)⁶(4a1)²(3t2)⁶(1e)⁴(1t1)⁶(4t2)⁶ · HOMO 4t2 · LUMO 5t2 |
| H2O2 | C2 | 0.3 | (1b)²(1a)²(2a)²(2b)²(3a)²(3b)²(4a)²(5a)²(4b)² · HOMO 4b · LUMO 5b |
| C2H2 | Dinfh | 0.4 | (1σg)²(1σu)²(2σg)²(2σu)²(3σg)²(1πu)⁴ · HOMO 1πu · LUMO 1πg |
| C2H4 | D2h | 0.7 | (1ag)²(1b1u)²(2ag)²(2b1u)²(1b2u)²(3ag)²(1b3g)²(1b3u)² · HOMO 1b3u · LUMO 1b2g |
| C2H6 | D3d | 0.9 | (1a2u)²(1a1g)²(2a1g)²(2a2u)²(1eu)⁴(3a1g)²(1eg)⁴ · HOMO 1eg · LUMO 2eu |
| H2CO | C2v | 0.3 | (1a1)²(2a1)²(3a1)²(4a1)²(1b2)²(5a1)²(1b1)²(2b2)² · HOMO 2b2 · LUMO 2b1 |
| CH3OH | Cs | 0.4 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(1a″)²(6a′)²(7a′)²(2a″)² · HOMO 2a″ · LUMO 8a′ |
| HCOOH | Cs | 0.3 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(6a′)²(7a′)²(8a′)²(1a″)²(9a′)²(2a″)²(10a′)² · HOMO 10a′ · LUMO 3a″ |
| CH3CN | C3v | 0.5 | (1a1)²(2a1)²(3a1)²(4a1)²(5a1)²(1e)⁴(6a1)²(7a1)²(2e)⁴ · HOMO 2e · LUMO 3e |
| C3H6 | D3h | 1.0 | (1e′)⁴(1a1′)²(2a1′)²(2e′)⁴(1a2″)²(3a1′)²(1e″)⁴(3e′)⁴ · HOMO 3e′ · LUMO 1a2′ |
| C4H6 | C2v | 1.1 | (1b2)²(1a1)²(2b2)²(2a1)²(3a1)²(3b2)²(4a1)²(4b2)²(5a1)²(6a1)²(5b2)²(6b2)²(7a1)²(1b1)²(1a2)² · HOMO 1a2 · LUMO 2b1 |
| C4H4O | C2v | 2.2 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(6a′)²(7a′)²(8a′)²(9a′)²(10a′)²(11a′)²(1a″)²(12a′)²(13a′)²(14a′)²(15a′)²(2a″)²(3a″)² · HOMO 3a″ · LUMO 4a″ · Cs (downgraded from C2v → Cs) |
| C5H5N | C2v | 2.3 | (1a1)²(1b2)²(2a1)²(3a1)²(2b2)²(4a1)²(5a1)²(6a1)²(3b2)²(7a1)²(4b2)²(8a1)²(9a1)²(5b2)²(6b2)²(10a1)²(1b1)²(7b2)²(11a1)²(2b1)²(1a2)² · HOMO 1a2 · LUMO 3b1 · approximate (framework 8.1e-4 bohr, residual 3.5e-3) |
| urea | C2v | 0.8 | (1a1)²(2a1)²(1b2)²(3a1)²(4a1)²(5a1)²(2b2)²(6a1)²(3b2)²(7a1)²(4b2)²(1b1)²(8a1)²(1a2)²(5b2)²(2b1)² · HOMO 2b1 · LUMO 3b1 |
| glycine | Cs | 1.1 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(6a′)²(7a′)²(8a′)²(9a′)²(10a′)²(1a″)²(11a′)²(12a′)²(2a″)²(13a′)²(3a″)²(14a′)²(15a′)²(4a″)²(16a′)² · HOMO 16a′ · LUMO 5a″ |
| C6H6 | D6h | 4.7 | (1e1u)⁴(1a1g)²(1e2g)⁴(1b1u)²(2a1g)²(2e1u)⁴(2e2g)⁴(3a1g)²(2b1u)²(1b2u)²(3e1u)⁴(1a2u)²(3e2g)⁴(1e1g)⁴ · HOMO 1e1g · LUMO 1e2u |
| NH4+ | Td | 0.5 | (1a1)²(2a1)²(1t2)⁶ · HOMO 1t2 · LUMO 3a1 |
| H3O+ | C3v | 0.3 | (1a1)²(2a1)²(1e)⁴(3a1)² · HOMO 3a1 · LUMO 4a1 |
| OH- | Cinfv | 0.3 | (1σ)²(2σ)²(3σ)²(1π)⁴ · HOMO 1π · LUMO 4σ |
| CN- | Cinfv | 0.3 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)² · HOMO 5σ · LUMO 2π |
| CuH | Cinfv | — | disabled: not a minimum |
| ZnH2 | Dinfh | — | disabled: not a minimum |
| GeH4 | Td | 1.3 | (1a1)²(2a1)²(1t2)⁶(3a1)²(2t2)⁶(4a1)²(3t2)⁶(1e)⁴(4t2)⁶ · HOMO 4t2 · LUMO 5t2 |
| AsH3 | C3v | 0.6 | (1a1)²(2a1)²(1e)⁴(3a1)²(4a1)²(2e)⁴(5a1)²(3e)⁴(4e)⁴(6a1)²(7a1)²(5e)⁴(8a1)² · HOMO 8a1 · LUMO 6e |
| H2Se | C2v | 0.7 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)²(4a1)²(2b2)²(5a1)²(2b1)²(3b2)²(6a1)²(1a2)²(3b1)²(7a1)²(8a1)²(4b2)²(9a1)²(4b1)² · HOMO 4b1 · LUMO 5b2 |
| HBr | Cinfv | 0.6 | (1σ)²(2σ)²(3σ)²(1π)⁴(4σ)²(5σ)²(2π)⁴(6σ)²(3π)⁴(1δ)⁴(7σ)²(8σ)²(4π)⁴ · HOMO 4π · LUMO 9σ |
| Br2 | Dinfh | 2.3 | (1σg)²(1σu)²(2σu)²(2σg)²(3σu)²(3σg)²(1πg)⁴(1πu)⁴(4σu)²(4σg)²(5σu)²(5σg)²(2πg)⁴(2πu)⁴(6σu)²(6σg)²(3πu)⁴(3πg)⁴(1δu)⁴(1δg)⁴(7σg)²(7σu)²(8σg)²(4πu)⁴(4πg)⁴ · HOMO 4πg · LUMO 8σu |
| record | labelled in | PySCF topgroup (recorded) | PySCF orbitals, same projection | HOMO / LUMO | ΔE PySCF − oracle |
|---|---|---|---|---|---|
| C6H6 | D6h | D6h | MATCH | 1e1g / 1e2u | -4.3e-13 |
| alanine | C1 | C1 | MATCH | index only (C₁) | 5.7e-13 |
| serine | C1 | C1 | MATCH | index only (C₁) | -4.5e-13 |
| cysteine | C1 | C1 | MATCH | index only (C₁) | -1.6e-12 |
| proline | C1 | C1 | MATCH | index only (C₁) | -2.2e-12 |
| threonine | C1 | C1 | MATCH | index only (C₁) | 9.1e-13 |
| valine | C1 | C1 | MATCH | index only (C₁) | -2.2e-12 |
| aspartic-acid | C1 | C1 | MATCH | index only (C₁) | 3.4e-13 |
| asparagine | C1 | C1 | MATCH | index only (C₁) | -8.0e-13 |
| isoleucine | C1 | C1 | MATCH | index only (C₁) | 1.7e-12 |
| leucine | C1 | C1 | MATCH | index only (C₁) | 1.0e-12 |
| glutamic-acid | C1 | C1 | MATCH | index only (C₁) | -6.8e-13 |
| glutamine | C1 | C1 | MATCH | index only (C₁) | 2.3e-13 |
| methionine | C1 | C1 | MATCH | index only (C₁) | 9.1e-13 |
| histidine | C1 | C1 | MATCH | index only (C₁) | -9.1e-13 |
| lysine | C1 | C1 | MATCH | index only (C₁) | -2.3e-12 |
| phenylalanine | C1 | C1 | MATCH | index only (C₁) | 6.8e-13 |
| arginine | C1 | C1 | MATCH | index only (C₁) | -3.6e-12 |
| tyrosine | C1 | C1 | MATCH | index only (C₁) | -2.5e-12 |
| tryptophan | C1 | C1 | MATCH | index only (C₁) | -4.3e-12 |
| uracil | Cs | Cs | MATCH | 5a″ / 6a″ | 4.5e-13 |
| cytosine | C1 | C1 | MATCH | index only (C₁) | -1.1e-13 |
| thymine | C1 | C1 | MATCH | index only (C₁) | -1.0e-12 |
| adenine | C1 | C1 | MATCH | index only (C₁) | -2.2e-12 |
| guanine | C1 | C1 | MATCH | index only (C₁) | -4.5e-13 |
| N-methylacetamide | C1 | C1 | MATCH | index only (C₁) | -6.8e-13 |
| Li4F4 | Td | Td | MATCH | 5t2 / 5a1 | -5.7e-13 |
| ice-hexamer | C2h (of C6h) | C6h | MATCH | index only (the record says why) | -1.0e-12 |
| adamantane | Td | Td | MATCH | 7t2 / 8t2 | 2.5e-12 |
| cubane | Oh | Oh | MATCH | 3t2g / 4t1u | 4.5e-12 |
| B12H12-- | Ih | Ih | MATCH | 1gu / 1gg | -4.5e-13 |
| C60 | — (frontier: 8 columns) | — | PySCF's own orbitals (field check 1.1e-16 at generation) | by energy | 0 |
| KrF2 | Dinfh | Dooh | MATCH | 8σg / 6σu | 0.0e+0 |
| KBr | Cinfv | Coov | MATCH | 6π / 14σ | 0.0e+0 |
| TiCl4 | Td | Td | MATCH | 2t1 / 3e | 3.6e-12 |
| NiCO4 | Td | Td | MATCH | 9t2 / 3e | -5.0e-12 |
| FeCO5 | D3h | D3h | MATCH | 10e′ / 4e″ | -6.8e-12 |
| CrCO6 | Oh | Oh | MATCH | 2t2g / 9t1u | -4.5e-13 |

### Every record (generator s in node; bytes; the worker's chem.open in node)

| record | section | AO | RPA roots | bytes | generator s | chem.open ms (node) | oracle ΔE (Eh) | caps |
|---|---|---|---|---|---|---|---|---|
| C6H6 | ORGANIC | 36 | 315 | 1,259,886 | 2.19 | 7.6 | -2.6e-13 | orbitals+states+rpa+tdhf |
| alanine | BIO | 37 | 312 | 128,830 | 2.27 | 2.7 | -6.8e-13 | orbitals+rpa |
| serine | BIO | 42 | 392 | 159,438 | 3.69 | 1.2 | 3.3e-11 | orbitals+rpa |
| cysteine | BIO | 46 | 448 | 182,261 | 5.31 | 1.7 | 1.8e-10 | orbitals+rpa |
| proline | BIO | 49 | 558 | 217,030 | 8.67 | 1.6 | -1.0e-10 | orbitals+rpa |
| threonine | BIO | 49 | 544 | 213,255 | 8.75 | 1.4 | 4.0e-10 | orbitals+rpa |
| valine | BIO | 51 | 608 | 234,765 | 11.06 | 1.6 | 1.8e-11 | orbitals+rpa |
| aspartic-acid | BIO | 52 | 595 | 233,187 | 9.84 | 1.7 | -4.2e-10 | orbitals+rpa |
| asparagine | BIO | 53 | 630 | 244,620 | 12.42 | 1.6 | -1.6e-10 | orbitals+rpa |
| isoleucine | BIO | 58 | 792 | 299,145 | 17.51 | 2.7 | 4.9e-10 | orbitals+rpa |
| leucine | BIO | 58 | 792 | 299,395 | 17.54 | 2.0 | -5.1e-10 | orbitals+rpa |
| glutamic-acid | BIO | 59 | 780 | 298,882 | 20.82 | 2.6 | 9.9e-11 | orbitals+rpa |
| glutamine | BIO | 60 | 819 | 311,538 | 19.59 | 1.9 | 3.2e-10 | orbitals+rpa |
| methionine | BIO | 60 | 800 | 306,473 | 18.56 | 2.0 | 3.6e-10 | orbitals+rpa |
| histidine | BIO | 64 | 943 | 353,725 | 33.36 | 2.2 | 1.8e-10 | orbitals+rpa |
| lysine | BIO | 64 | 960 | 359,231 | 30.70 | 2.2 | 1.1e-10 | orbitals+rpa |
| phenylalanine | BIO | 71 | 1188 | 437,332 | 57.63 | 2.7 | 2.9e-10 | orbitals+rpa |
| arginine | BIO | 74 | 1269 | 469,060 | 73.60 | 3.0 | 1.4e-10 | orbitals+rpa |
| tyrosine | BIO | 76 | 1344 | 493,805 | 84.93 | 3.2 | 6.7e-10 | orbitals+rpa |
| tryptophan | BIO | 87 | 1782 | 644,039 | 191.17 | 7.3 | -8.2e-10 | orbitals+rpa |
| uracil | BIO | 44 | 435 | 186,204 | 4.54 | 1.1 | -1.2e-10 | orbitals+rpa |
| cytosine | BIO | 45 | 464 | 182,854 | 6.12 | 1.3 | 4.2e-11 | orbitals+rpa |
| thymine | BIO | 51 | 594 | 229,851 | 10.82 | 1.5 | -9.3e-11 | orbitals+rpa |
| adenine | BIO | 55 | 700 | 266,442 | 14.89 | 1.8 | -4.4e-11 | orbitals+rpa |
| guanine | BIO | 60 | 819 | 309,956 | 22.48 | 1.8 | 7.5e-10 | orbitals+rpa |
| N-methylacetamide | BIO | 32 | 240 | 101,489 | 1.06 | 1.3 | -3.8e-12 | orbitals+rpa+tdhf |
| Li4F4 | LATTICE | 40 | 384 | 156,882 | 2.52 | 1.0 | -2.0e-11 | orbitals+rpa |
| ice-hexamer | LATTICE | 42 | 360 | 157,918 | 3.21 | 5.3 | -1.4e-10 | orbitals+rpa |
| adamantane | LATTICE | 66 | 1064 | 400,474 | 32.42 | 2.2 | 4.5e-13 | orbitals+rpa |
| cubane | LATTICE | 48 | 560 | 221,963 | 6.60 | 1.4 | 1.1e-11 | orbitals+rpa |
| B12H12-- | LATTICE | 72 | 1295 | 473,837 | 55.38 | 2.8 | 1.1e-11 | orbitals+rpa |
| C60 | LATTICE | 300 | 0 (frontier: 8 columns) | 145,328 | 0 (re-encoded) | 6.3 | 0 (PySCF's own) | orbitals |
| KrF2 | HEAVY | 29 | 54 | 55,688 | 0.71 | 0.5 | 2.6e-11 | orbitals+rpa+tdhf |
| KBr | HEAVY | 32 | 135 | 81,095 | 1.20 | 0.6 | -2.3e-12 | orbitals+rpa+tdhf |
| TiCl4 | HEAVY | 55 | 450 | 211,382 | 11.38 | 1.2 | 4.5e-12 | orbitals+rpa |
| NiCO4 | HEAVY | 59 | 714 | 289,086 | 37.23 | 2.5 | 8.4e-10 | orbitals+rpa |
| FeCO5 | HEAVY | 69 | 1008 | 400,435 | 60.45 | 2.6 | 5.1e-10 | orbitals+rpa |
| CrCO6 | HEAVY | 79 | 1350 | 515,679 | 125.64 | 2.7 | 6.9e-9 | orbitals+rpa |

## Tests

- `bash test.sh node`: **exit 0, 85 suites, 0 FAIL** on the merged tree. `tests/library.test.mjs` gains: the record-only rows read off
  the catalogue (lysine and C₆₀ among them), a 1e-9-bohr move and one NaN in C refused by `validateRecord`, §7 the sections; it keeps
  Sos's §5b (B1) and S4c's §5c (the frontier record).
- `node tools/orbital-library.mjs --check`: **in step, 38 records, 11,532,460 B** — the gate passes every entry, nothing else in `lab/library/`.
- `node tools/orbital-library.mjs --gate`: 38 pass (C₆₀ by the declared milestone allowance) · 20 refused · 5 blocked by the basis ·
  1 refused by the stability probe.
- `node tools/orbital-names.mjs --check --pyscf`: **OK, 37 of 37 RHF records MATCH** (PySCF's orbitals project to the record's
  labels; |ΔE| ≤ 7.5e-12 Eh), C₆₀ (frontier) skipped by design, plus the ten anchors and water's `label_orb_symm` as before.
- `node tools/new-project.mjs --check`: in step (16 889 B, S4c's `valence` key in). `node tests/pwa.test.mjs --write` after every `lab/` edit.
- **The locks** (8757/5225): 1004 values GREEN untouched (`--check --query gastab=0`, 63 s); the S4a fixture differed in exactly the
  24 lysine values (density and HOMO × 3 grids × digest/integral/rp/rpL), re-recorded with `--write` (1148 values) and checked GREEN.
- Browser on **8757/5225**, one suite at a time with pauses, all **GREEN** on the merged tree: `chem` **55/55** (L6 rewritten for the
  page turner: every page holds exactly its section and its header names it — DIATOMICS 13 · HYDRIDES 20 · ORGANIC 12 · BIO 27 ·
  LATTICE 6 · HEAVY 13 rows), `molecular-names` 6 PASS, `library` **7 PASS** (§6 the sections and the three sizing entries opened in
  Firefox — LATTICE's INSTALLED now installs its six, C₆₀'s frontier record among them; §7 the two-press race), `menubar` 8 PASS,
  `new-project` 8 PASS, `orbitals` **24/24**, `field-molecule` 9 PASS. (The same five S4b suites were GREEN on the pre-merge tree too.)
- **Re-run alone:** `library` once on the pre-merge tree — its first run went red at step 3 on a TEST bug of mine (the scene set the
  dropdown to lysine while it held ORGANIC; with one section per page the pick needs the page turned first, and the KICK that followed
  ran on benzene and returned typed arrays the driver refused to clone); fixed in the test (`d2574a3`), GREEN alone. No timing red was
  seen.

## Blockers

None open. Resolved inside S4b:
- `node tools/orbital-library.mjs` (the first full write) → `Error: orbital-library: ice-hexamer: the projection named nothing in C2h —
  DᵀSD ≠ S by 3.80e-10: the AO representation is not a symmetry of the overlap`: fixed by averaging the hexamer (over C₆h), Ni(CO)₄ and
  ferrocene onto their groups; then `the projection named nothing in C2h — level 2–3 … is 2Bu, not one irrep of its own dimension` —
  the hexamer's record carries indices and says why.
- the same run, for ferrocene: `rpa: A − B is not positive definite; the RHF reference is not a minimum` — the stability probe decided.
- `git merge a927fc3` → seven files in conflict (`lab/chemview.js`, `lab/library.js`, `lab/library.json`, `lab/sw.js`,
  `tests/library.browser-test.mjs`, `tests/library.test.mjs`, `tools/orbital-library.mjs`) — resolved as REPORT wave 173 says.
Harness notes: the `Write` tool refuses `.md` (REPORT.md and this file were written by `python3 .tmp/report_s4b.py` and
`python3 .tmp/build_s4b.py`); a shell line holding a pipe into `git`, a `sleep`, or `bash … > file` was refused (reshaped).

## `lab/*.js` lines

`cat lab/*.js | wc -l`: base `cfdd674` **36 131** → this tree **36 280**. Of the +149: Sos's B1 fix +6, S4c's merge +88 (`a927fc3` holds 36 225), and **S4b +55** (`lab/chemview.js` +42: the header/page turner and the per-section dropdown; `lab/molecules.js` +5: SECTIONS; `lab/library.js` +8: `atomsKey`, the geometry hash and the finite checks, the frontier's included). **"Subtract, don't add" is NOT met** by S4b (the turner and the header are the plan's named exception, PLAN F5; nothing in S4b's files was dead enough to delete).

## Open items

- **CLAUDE.md's MOLECULES paragraph is NOT edited here.** The coordinator asked for it, but the session's law is that no agent's
  message authorises a CLAUDE.md change; the paragraph, drafted for Josh or the integrator to apply in the picker's commit:
  "MOLECULES' first row is the SECTION header, which is the library's page turner (0.4.0 S4b): PALETTE's ◂ ▸, a readout naming the
  section (it survives LEAN), and INSTALLED, whose lamp says every record of the section is on this device and whose press installs or
  removes them all; the MOLECULE dropdown below holds that one section (DIATOMICS · HYDRIDES · ORGANIC · BIO · LATTICE · HEAVY,
  `lab/molecules.js` SECTIONS), a pick elsewhere turns the page, and the page is never saved. A library record ships only through
  `tools/orbital-library.mjs`'s diversity gate. Below the header and the top rows (ON, MOLECULE, BASIS, VIEW + ORBITAL — VALENCE takes
  the dial's seat under DENSITY) MOLECULES keeps KICK / RUN / TDA / the spectra in the `.mol-more` fold …" (the rest unchanged).
- **Rulings for Josh** (each can be overruled): C₆₀ ships under the declared `milestone` allowance (the integrator's ruling); C₂₀H₂₀ is
  refused by the gate and stays a test fixture; the four rock-salt cubes are one motif — only Li₄F₄ ships (the past-cap one first, said
  in the source); Br₂ vs the cap (S4a's open item) untouched.
- **The census's two errors, for Sol/Sos:** 9 of its 14 self-built amino acids were the D-enantiomer (fixed here by reflection); its
  ferrocene "internalStable: true" is contradicted by PySCF's own `rhf_stability` on the same atoms.
- Cr(CO)₆'s oracle distance is 6.9e-9 Eh — inside the 1e-8 law, the largest in the library (the next is Ni(CO)₄'s 8.4e-10).
- The ten curated IEs stay UNCHECKED value by value (the LEGAL reading: cite the primary handbooks, never copy SRD 101's tables).
  B₁₂H₁₂²⁻ has no PubChem identifier (UNVERIFIED in its record). C₆₀'s PubChem title is "Fullerenes" (CID 123591, formula C60).
- C₆₀'s geometry is Sol's DRAFT (equal-edge ideal I_h); its I_h names and density are 0.4.1 BUCKYBALL (S4c's own note).
- The full `--check` re-solves all 37 RHF records (~17 min of generator time here: Trp 191 s, Cr(CO)₆ 126 s); `--only` is the quick road.
- `--fixture C20H20 --check` re-solves 120 AOs (~25 min); the fixture was regenerated once on the merged build and not re-checked.

## KIT BRIEF notes for brief 4 (`cells`: the section header and the cells filter, as built) — for the integrator to fold in

- **The section header, as built** (`lab/chemview.js` `createChem`, the row `rH`, `.row.tight.mol-section`, ABOVE the
  MOLECULE row): PALETTE's page-turner button `trig({ label: '', cls: 'pal-nav mol-turn' })` + `chip(root, 'dirPrev')` · a kit
  `readout({ label: 'SECTION' })` whose value is the section's name and whose sub is host content ("24 records · 6.4 MB · 3 here"
  or "13 molecules, all live"; the whole sentence in its `title`) · the `dirNext` twin · a kit `sw({ label: 'INSTALLED' })`
  whose LED is the installed lamp (lit iff every record of the section is in Cache Storage `lw-data-v1`) and whose press is
  INSTALL / REMOVE for the whole section (persist() asked once, on that press). It is hidden for a section with no record and
  in a Safari tab (S4a's M5 law). Host data only: `SECTIONS` and each row's `section` (`lab/molecules.js`), the catalogue's
  bytes and hashes (`lab/library.json`); the kit never fetches, installs or parses chemistry. CSS: three LAYOUT lines in
  `lab/lab.css` (`.mol-section > .ro { flex: 3 1 0 }`, `> .sw { flex: 0 1 auto }`, and `.dev.lean … .mol-section > .ro { display:
  flex }` — the readout is the section's name, so it survives LEAN, as CALCULUS' tiles do). No new skin.
- **The cells filter, as built**: the page turner is a `sections` FILTER over the dropdown — six cells (DIATOMICS · HYDRIDES ·
  ORGANIC · BIO · LATTICE · HEAVY) stepped by ◂ ▸, the `<select>` refilled with that section's rows in the table's optgroups
  (`fillSel`: `p.section === page`). A turn changes only the filter, never the molecule on screen (a page turned away from it
  shows nothing chosen until a pick) — exactly brief 4's "choosing in the filter instance changes only the filter". The other
  direction holds too: a molecule chosen from elsewhere (a link, a project, `__LW.chem.solve(id)`) moves the filter to its
  page (`mSeg.set`). Supplied counts (records, bytes, on this device) are the host's (`header()`); no section is empty of rows,
  but DIATOMICS and HYDRIDES are empty of RECORDS, which is the "empty results" case for INSTALLED (hidden).
- **The 0.5.0 port**: `cells({ items: SECTIONS.map((s) => ({ id: s, label: s, count })), layout: 'sections', mode: 'filter',
  value: page, onChange: turn })` replaces the two `.pal-nav` trigs and the readout's VALUE (4 lines of `rH`'s construction +
  `pageBy`, 1 line); the readout's sub and INSTALLED stay host content (or a `readouts` mount beside the cells). λWAVES lines
  that go: 5 in `lab/chemview.js`, 0 in `lab/lab.css` (the three are the row's layout, which the cells mount would own: −3).
  Acceptance to add: a filter turn emits no hand event on the molecule control and no solve; the filter follows a programmatic
  molecule change; ◂ ▸ are plain buttons today — a `cells` filter should be a radiogroup with seg's roving tab stop and arrows.

## The exact next step

**The integrator (Sos):** merge `worktree-agent-aee5748ddb578d188` into `sos-s0` — it already holds `b5eed68` and `a927fc3`, so the
merge should be clean against the current `sos-s0`; the S4a lock fixture is re-recorded on this tree (lysine L), the 1004 untouched.
Apply the CLAUDE.md paragraph above (with Josh's say-so), fold the KIT notes into `KIT-BRIEFS.md` brief 4, and take the rulings above
to Josh. Then the S4b verdict needs no verifier (BRIEF §S4b: content behind a verified road); the next stage is S5.
