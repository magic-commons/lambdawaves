# λWAVES 0.4.0 · S4b THE SECTIONS — HAND-OFF (usage pause, 2026-10-08)

Written by the S4b builder (Opus 5.5) at the agent-control usage pause (five-hour window at 98 %). Nothing was pushed, tagged or
deployed. The work is committed; what remains is listed under "the exact next step".

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aee5748ddb578d188`
- **Branch:** `worktree-agent-aee5748ddb578d188` (reset to `cfdd674`, then Sos's `b5eed68` merged in as the coordinator asked)
- **Tip:** `d2574a3` (WIP B6). S4c's `a927fc3` is **NOT merged** yet (the coordinator's resume message asks for it — see below).

## The commits

| sha | title |
|---|---|
| `64b1a5a` | B1 · the three sizing entries end to end (alanine, Li₄F₄, TiCl₄), the census geometries consumed, the record oracle, PubChem ids |
| `1a85ee2` | B2–B5 (code) · the gate, the STEM fields and C5, the candidates, the page turner and the header |
| `083b36e` | merge `b5eed68` (Sos: the S4a verifier's BLOCKER B1 fix) |
| `2770699` | B4 · the sections generated: 37 records, 11.4 MB, labelled by projection and held against PySCF |
| `d2574a3` | WIP B6 · the library suite's step 3 turns to BIO before it picks lysine; the gates green |

## Where B6 stands

Done: every gate below is GREEN on `d2574a3`. Not done: REPORT.md waves (168–173, or 168–177 as the resume message asks) and
`research/release-0.4.0/S4b-BUILD.md`; the merge of S4c's `a927fc3` and its conflict resolution; the browser gates after that
merge (plus `orbitals` and `field-molecule`). The REPORT text is drafted as a script: `python3 .tmp/report_s4b.py REPORT.md
.tmp/report-values.json` after `python3 .tmp/values.py && python3 .tmp/values2.py` (the `.tmp/` scratch is untracked in this
worktree; re-derive from this file if it is gone). The build doc likewise: `.tmp/build_s4b.py`.

## The three timed (BRIEF §S4b)

| entry | AO | RPA roots | generator (node) | record | census estimate | chem.open (node) | Firefox: worker open / whole solve() | oracle ΔE |
|---|---|---|---|---|---|---|---|---|
| alanine (BIO, C₁) | 37 | 312 | 2.03–2.28 s | 128 830 B | 13 544 B (×9.5) | 2.2–2.9 ms | 4 ms / 17 ms | −6.8e-13 Eh |
| Li₄F₄ (LATTICE, T_d) | 40 | 384 | 2.52–3.10 s | 156 882 B | 15 440 B (×10.2) | 1.0–1.9 ms | 2 ms / 17 ms | −2.0e-11 Eh |
| TiCl₄ (HEAVY, T_d) | 55 | 450 | 11.4–13.6 s | 211 382 B | 27 080 B (×7.8) | 1.2–3.1 ms | 2 ms / 14 ms | +4.5e-12 Eh |

The census's byte formula (ε, C, occupations) is 8–10× short: the RPA sticks dominate a real record.

## The sections (per-section rows, records, bytes; the gate)

| section | rows (live + record-only) | records | bytes | records > 64 AO (draw after S4c) | under the live cap |
|---|---|---|---|---|---|
| DIATOMICS | 13 (13 + 0) | 0 | 0 | — | — |
| HYDRIDES | 20 (20 + 0) | 0 | 0 | — | — |
| ORGANIC | 12 (12 + 0) | 1 | 1,259,886 | — | — |
| BIO | 27 (2 + 25) | 25 | 7,162,807 | phenylalanine 71, arginine 74, tyrosine 76, tryptophan 87 | N-methylacetamide |
| LATTICE | 5 (0 + 5) | 5 | 1,411,074 | adamantane 66, B12H12-- 72 | — |
| HEAVY | 13 (7 + 6) | 6 | 1,553,365 | FeCO5 69, CrCO6 79 | KrF2, KBr |
| **total** | **90** | **37** | **11,387,132** | | |

The gate (`node tools/orbital-library.mjs --gate`): **37 pass · 20 refused · 5 blocked by the basis · 1 refused by the stability
probe.** Refused: Gly-Gly (asparagine's formula), imidazole, indole, phosphoric acid, ribose, caffeine, DMT, A–T, G–C, Li₄H₄,
Mg₄O₄, Na₂Cl₂, Na₄Cl₄, the ice cube, C₂₀H₂₀, neopentane, naphthalene, Si₅H₁₂, SeO₂, GeCl₄. Blocked (R-L6, the vendored STO-3G
stops at Kr; nothing vendored): HI, CH₃I, XeF₂, XeF₄, I₂. Probe: ferrocene (RHF/STO-3G not a minimum: A+B −0.0307, A−B −0.0586 Eh;
PySCF's `rhf_stability` agrees, −0.1229 = 4(A+B); the census's "internalStable: true" is wrong). Declared order choice: Li₄F₄ (past
the cap) before Li₄H₄. Total library **11 387 132 B** in 37 records, deployed, never precached.

## C5 — labels by projection, against PySCF (`node tools/orbital-names.mjs --check --pyscf`: OK, 37/37 MATCH)

| molecule | group | name ms | configuration (STO-3G) or why not |
|---|---|---|---|
| H2 | Dinfh | 1.9 | (1σg)² · HOMO 1σg · LUMO 1σu |
| LiH | Cinfv | 0.8 | (1σ)²(2σ)² · HOMO 2σ · LUMO 3σ |
| HF | Cinfv | 0.5 | (1σ)²(2σ)²(3σ)²(1π)⁴ · HOMO 1π · LUMO 4σ |
| N2 | Dinfh | 0.6 | (1σg)²(1σu)²(2σg)²(2σu)²(1πu)⁴(3σg)² · HOMO 3σg · LUMO 1πg |
| CO | Cinfv | 0.6 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)² · HOMO 5σ · LUMO 2π |
| F2 | Dinfh | 0.7 | (1σu)²(1σg)²(2σg)²(2σu)²(1πu)⁴(3σg)²(1πg)⁴ · HOMO 1πg · LUMO 3σu |
| LiF | Cinfv | 0.5 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴ · HOMO 1π · LUMO 5σ |
| NaH | Cinfv | 0.3 | (1σ)²(2σ)²(1π)⁴(3σ)²(4σ)² · HOMO 4σ · LUMO 5σ |
| HCl | Cinfv | 0.3 | (1σ)²(2σ)²(3σ)²(1π)⁴(4σ)²(5σ)²(2π)⁴ · HOMO 2π · LUMO 6σ |
| Cl2 | Dinfh | 0.7 | (1σu)²(1σg)²(2σu)²(2σg)²(3σu)²(3σg)²(1πg)⁴(1πu)⁴(4σg)²(4σu)²(5σg)²(2πu)⁴(2πg)⁴ · HOMO 2πg · LUMO 5σu |
| NaCl | Cinfv | 0.5 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)²(2π)⁴(6σ)²(7σ)²(8σ)²(3π)⁴ · HOMO 3π · LUMO 9σ |
| BeH2 | Dinfh | 0.3 | (1σg)²(2σg)²(1σu)² · HOMO 1σu · LUMO 1πu |
| BH3 | D3h | 0.8 | (1a1′)²(2a1′)²(1e′)⁴ · HOMO 1e′ · LUMO 1a2″ |
| CH4 | Td | 0.6 | (1a1)²(2a1)²(1t2)⁶ · HOMO 1t2 · LUMO 2t2 |
| NH3 | C3v | 0.5 | (1a1)²(2a1)²(1e)⁴(3a1)² · HOMO 3a1 · LUMO 4a1 |
| H2O | C2v | 0.4 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)² · HOMO 1b1 · LUMO 4a1 |
| MgH2 | Dinfh | 0.4 | (1σg)²(2σg)²(1πu)⁴(1σu)²(3σg)²(2σu)² · HOMO 2σu · LUMO 4σg |
| AlH3 | D3h | 0.4 | (1a1′)²(2a1′)²(1a2″)²(1e′)⁴(3a1′)²(2e′)⁴ · HOMO 2e′ · LUMO 2a2″ |
| SiH4 | Td | 0.9 | (1a1)²(2a1)²(1t2)⁶(3a1)²(2t2)⁶ · HOMO 2t2 · LUMO 4a1 |
| PH3 | C3v | 0.7 | (1a1)²(2a1)²(1e)⁴(3a1)²(4a1)²(2e)⁴(5a1)² · HOMO 5a1 · LUMO 3e |
| H2S | C2v | 0.3 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)²(4a1)²(2b2)²(5a1)²(2b1)² · HOMO 2b1 · LUMO 3b2 |
| CO2 | Dinfh | 0.5 | (1σu)²(1σg)²(2σg)²(3σg)²(2σu)²(4σg)²(1πu)⁴(3σu)²(1πg)⁴ · HOMO 1πg · LUMO 2πu |
| HCN | Cinfv | 0.3 | (1σ)²(2σ)²(3σ)²(4σ)²(5σ)²(1π)⁴ · HOMO 1π · LUMO 2π |
| N2O | Cinfv | 0.3 | (1σ)²(2σ)²(3σ)²(4σ)²(5σ)²(6σ)²(1π)⁴(7σ)²(2π)⁴ · HOMO 2π · LUMO 3π |
| O3 | C2v | 0.4 | (1a1)²(1b2)²(2a1)²(3a1)²(2b2)²(4a1)²(5a1)²(1b1)²(3b2)²(4b2)²(6a1)²(1a2)² · HOMO 1a2 · LUMO 2b1 |
| SO2 | C2v | 0.4 | (1a1)²(2a1)²(1b2)²(3a1)²(2b2)²(1b1)²(4a1)²(5a1)²(3b2)²(6a1)²(7a1)²(2b1)²(4b2)²(5b2)²(8a1)²(1a2)² · HOMO 1a2 · LUMO 3b1 |
| BF3 | D3h | 1.8 | (1a1′)²(1e′)⁴(2a1′)²(3a1′)²(2e′)⁴(4a1′)²(3e′)⁴(1a2″)²(1a2′)²(4e′)⁴(1e″)⁴ · HOMO 1e″ · LUMO 2a2″ |
| CF4 | Td | 1.7 | (1a1)²(1t2)⁶(2a1)²(3a1)²(2t2)⁶(4a1)²(3t2)⁶(1e)⁴(1t1)⁶(4t2)⁶ · HOMO 4t2 · LUMO 5t2 |
| H2O2 | C2 | 0.3 | (1b)²(1a)²(2a)²(2b)²(3a)²(3b)²(4a)²(5a)²(4b)² · HOMO 4b · LUMO 5b |
| C2H2 | Dinfh | 0.4 | (1σg)²(1σu)²(2σg)²(2σu)²(3σg)²(1πu)⁴ · HOMO 1πu · LUMO 1πg |
| C2H4 | D2h | 0.7 | (1ag)²(1b1u)²(2ag)²(2b1u)²(1b2u)²(3ag)²(1b3g)²(1b3u)² · HOMO 1b3u · LUMO 1b2g |
| C2H6 | D3d | 0.8 | (1a2u)²(1a1g)²(2a1g)²(2a2u)²(1eu)⁴(3a1g)²(1eg)⁴ · HOMO 1eg · LUMO 2eu |
| H2CO | C2v | 0.3 | (1a1)²(2a1)²(3a1)²(4a1)²(1b2)²(5a1)²(1b1)²(2b2)² · HOMO 2b2 · LUMO 2b1 |
| CH3OH | Cs | 0.3 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(1a″)²(6a′)²(7a′)²(2a″)² · HOMO 2a″ · LUMO 8a′ |
| HCOOH | Cs | 0.3 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(6a′)²(7a′)²(8a′)²(1a″)²(9a′)²(2a″)²(10a′)² · HOMO 10a′ · LUMO 3a″ |
| CH3CN | C3v | 2.0 | (1a1)²(2a1)²(3a1)²(4a1)²(5a1)²(1e)⁴(6a1)²(7a1)²(2e)⁴ · HOMO 2e · LUMO 3e |
| C3H6 | D3h | 1.4 | (1e′)⁴(1a1′)²(2a1′)²(2e′)⁴(1a2″)²(3a1′)²(1e″)⁴(3e′)⁴ · HOMO 3e′ · LUMO 1a2′ |
| C4H6 | C2v | 1.0 | (1b2)²(1a1)²(2b2)²(2a1)²(3a1)²(3b2)²(4a1)²(4b2)²(5a1)²(6a1)²(5b2)²(6b2)²(7a1)²(1b1)²(1a2)² · HOMO 1a2 · LUMO 2b1 |
| C4H4O | C2v | 2.2 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(6a′)²(7a′)²(8a′)²(9a′)²(10a′)²(11a′)²(1a″)²(12a′)²(13a′)²(14a′)²(15a′)²(2a″)²(3a″)² · HOMO 3a″ · LUMO 4a″ · Cs (downgraded from C2v → Cs) |
| C5H5N | C2v | 1.9 | (1a1)²(1b2)²(2a1)²(3a1)²(2b2)²(4a1)²(5a1)²(6a1)²(3b2)²(7a1)²(4b2)²(8a1)²(9a1)²(5b2)²(6b2)²(10a1)²(1b1)²(7b2)²(11a1)²(2b1)²(1a2)² · HOMO 1a2 · LUMO 3b1 · approximate (framework 8.1e-4 bohr, residual 3.5e-3) |
| urea | C2v | 0.8 | (1a1)²(2a1)²(1b2)²(3a1)²(4a1)²(5a1)²(2b2)²(6a1)²(3b2)²(7a1)²(4b2)²(1b1)²(8a1)²(1a2)²(5b2)²(2b1)² · HOMO 2b1 · LUMO 3b1 |
| glycine | Cs | 1.4 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(6a′)²(7a′)²(8a′)²(9a′)²(10a′)²(1a″)²(11a′)²(12a′)²(2a″)²(13a′)²(3a″)²(14a′)²(15a′)²(4a″)²(16a′)² · HOMO 16a′ · LUMO 5a″ |
| C6H6 | D6h | 4.4 | (1e1u)⁴(1a1g)²(1e2g)⁴(1b1u)²(2a1g)²(2e1u)⁴(2e2g)⁴(3a1g)²(2b1u)²(1b2u)²(3e1u)⁴(1a2u)²(3e2g)⁴(1e1g)⁴ · HOMO 1e1g · LUMO 1e2u |
| NH4+ | Td | 0.5 | (1a1)²(2a1)²(1t2)⁶ · HOMO 1t2 · LUMO 3a1 |
| H3O+ | C3v | 0.2 | (1a1)²(2a1)²(1e)⁴(3a1)² · HOMO 3a1 · LUMO 4a1 |
| OH- | Cinfv | 0.1 | (1σ)²(2σ)²(3σ)²(1π)⁴ · HOMO 1π · LUMO 4σ |
| CN- | Cinfv | 0.2 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)² · HOMO 5σ · LUMO 2π |
| CuH | Cinfv | — | disabled: not a minimum |
| ZnH2 | Dinfh | — | disabled: not a minimum |
| GeH4 | Td | 1.2 | (1a1)²(2a1)²(1t2)⁶(3a1)²(2t2)⁶(4a1)²(3t2)⁶(1e)⁴(4t2)⁶ · HOMO 4t2 · LUMO 5t2 |
| AsH3 | C3v | 0.5 | (1a1)²(2a1)²(1e)⁴(3a1)²(4a1)²(2e)⁴(5a1)²(3e)⁴(4e)⁴(6a1)²(7a1)²(5e)⁴(8a1)² · HOMO 8a1 · LUMO 6e |
| H2Se | C2v | 0.6 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)²(4a1)²(2b2)²(5a1)²(2b1)²(3b2)²(6a1)²(1a2)²(3b1)²(7a1)²(8a1)²(4b2)²(9a1)²(4b1)² · HOMO 4b1 · LUMO 5b2 |
| HBr | Cinfv | 0.8 | (1σ)²(2σ)²(3σ)²(1π)⁴(4σ)²(5σ)²(2π)⁴(6σ)²(3π)⁴(1δ)⁴(7σ)²(8σ)²(4π)⁴ · HOMO 4π · LUMO 9σ |
| Br2 | Dinfh | 2.2 | (1σg)²(1σu)²(2σu)²(2σg)²(3σu)²(3σg)²(1πg)⁴(1πu)⁴(4σu)²(4σg)²(5σu)²(5σg)²(2πg)⁴(2πu)⁴(6σu)²(6σg)²(3πu)⁴(3πg)⁴(1δu)⁴(1δg)⁴(7σg)²(7σu)²(8σg)²(4πu)⁴(4πg)⁴ · HOMO 4πg · LUMO 8σu |
| record | labelled in | PySCF topgroup (recorded) | PySCF orbitals, same projection | HOMO / LUMO | ΔE PySCF − oracle |
|---|---|---|---|---|---|
| C6H6 | D6h | D6h | MATCH | 1e1g / 1e2u | -2.8e-14 |
| alanine | C1 | C1 | MATCH | index only (C₁) | 5.7e-13 |
| serine | C1 | C1 | MATCH | index only (C₁) | 0.0e+0 |
| cysteine | C1 | C1 | MATCH | index only (C₁) | 2.3e-13 |
| proline | C1 | C1 | MATCH | index only (C₁) | -3.6e-12 |
| threonine | C1 | C1 | MATCH | index only (C₁) | 3.4e-13 |
| valine | C1 | C1 | MATCH | index only (C₁) | -2.4e-12 |
| aspartic-acid | C1 | C1 | MATCH | index only (C₁) | 1.6e-12 |
| asparagine | C1 | C1 | MATCH | index only (C₁) | -1.3e-12 |
| isoleucine | C1 | C1 | MATCH | index only (C₁) | 1.0e-12 |
| leucine | C1 | C1 | MATCH | index only (C₁) | 1.0e-12 |
| glutamic-acid | C1 | C1 | MATCH | index only (C₁) | 1.4e-12 |
| glutamine | C1 | C1 | MATCH | index only (C₁) | -1.1e-12 |
| methionine | C1 | C1 | MATCH | index only (C₁) | 9.1e-13 |
| histidine | C1 | C1 | MATCH | index only (C₁) | -1.1e-12 |
| lysine | C1 | C1 | MATCH | index only (C₁) | -4.5e-13 |
| phenylalanine | C1 | C1 | MATCH | index only (C₁) | 5.0e-12 |
| arginine | C1 | C1 | MATCH | index only (C₁) | -2.7e-12 |
| tyrosine | C1 | C1 | MATCH | index only (C₁) | 2.0e-12 |
| tryptophan | C1 | C1 | MATCH | index only (C₁) | -6.8e-12 |
| uracil | Cs | Cs | MATCH | 5a″ / 6a″ | -2.3e-13 |
| cytosine | C1 | C1 | MATCH | index only (C₁) | -4.5e-13 |
| thymine | C1 | C1 | MATCH | index only (C₁) | 1.5e-12 |
| adenine | C1 | C1 | MATCH | index only (C₁) | -4.3e-12 |
| guanine | C1 | C1 | MATCH | index only (C₁) | -2.7e-12 |
| N-methylacetamide | C1 | C1 | MATCH | index only (C₁) | -5.7e-13 |
| Li4F4 | Td | Td | MATCH | 5t2 / 5a1 | -1.1e-12 |
| ice-hexamer | C2h (of C6h) | C6h | MATCH | index only (the record says why) | -3.4e-13 |
| adamantane | Td | Td | MATCH | 7t2 / 8t2 | 0.0e+0 |
| cubane | Oh | Oh | MATCH | 3t2g / 4t1u | 2.8e-12 |
| B12H12-- | Ih | Ih | MATCH | 1gu / 1gg | -9.1e-13 |
| KrF2 | Dinfh | Dooh | MATCH | 8σg / 6σu | 9.1e-13 |
| KBr | Cinfv | Coov | MATCH | 6π / 14σ | -9.1e-13 |
| TiCl4 | Td | Td | MATCH | 2t1 / 3e | -9.1e-13 |
| NiCO4 | Td | Td | MATCH | 9t2 / 3e | 4.5e-13 |
| FeCO5 | D3h | D3h | MATCH | 10e′ / 4e″ | 1.4e-12 |
| CrCO6 | Oh | Oh | MATCH | 2t2g / 9t1u | -8.6e-12 |

## Findings

- **9 of the census's 14 self-built amino acids were the D-enantiomer** (the generator's CORN check against the wwPDB L-alanine):
  serine, cysteine, proline, valine, glutamic acid, glutamine, **lysine**, arginine, tyrosine — mirrored (x → −x) to L, energies
  unchanged, said in each source. **Lysine is S4a's lock fixture: the digest lock's two lysine values must be re-recorded.**
- Identifiers (PubChem PUG REST, 2026-10-08): 35 VERIFIED (lysine's S4a key KDXKERNSBIXSRK-YFKPBYRVSA-N / CID 5962 among them),
  Li₄F₄ and the water hexamer have no PubChem compound (said), **B₁₂H₁₂²⁻ UNVERIFIED** (no hit; no CID guessed).
- The water hexamer (C₆h) carries indices only: names.js has no C₆h table and no Abelian subgroup can name a degenerate level (said).
- `validateRecord` now refuses a moved atom (`input.atomsSha256`) or a non-finite ε/C/D; records say the RPA μ/dominant pairs are
  not in a canonical gauge inside a degenerate root (`spectrum.gauge`).

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

## Tests (all on `d2574a3` or the tree just before it)

- `node tools/orbital-library.mjs --check`: **in step — 37 records, 11 387 132 B, lab/library.json 81 803 B, nothing else in lab/library/; the gate passes every entry.**
- `bash test.sh node`: exit 0, 85 suites. `node tools/new-project.mjs --check`: in step (16 866 B). `orbital-names --check --pyscf`: 37/37 MATCH.
- Browser on 8757/5225, one at a time: `chem` 55/55 · `molecular-names` 6 PASS · `library` 7 PASS (new §6 the sections + the
  three sizing entries in Firefox, §7 the two-press race — GREEN on Sos's B1 fix) · `menubar` 8 PASS · `new-project` 8 PASS.
- Re-run alone: `library` once — its first run went red at step 3 on a TEST bug (the pick of lysine needs its page turned first;
  the KICK that followed ran on benzene and returned typed arrays the driver could not clone); fixed (`d2574a3`), GREEN alone.

## Blockers (resolved)

- `node tools/orbital-library.mjs` → `Error: orbital-library: ice-hexamer: the projection named nothing in C2h — DᵀSD ≠ S by 3.80e-10`:
  fixed by averaging the hexamer, Ni(CO)₄ and ferrocene onto their groups. Ferrocene then refused by the stability probe (above).

## `lab/*.js` lines

36 131 → 36 191 (+60): +6 Sos's B1 fix, **+54 S4b** (`lab/chemview.js` +42, `lab/molecules.js` +5, `lab/library.js` +7).
"Subtract, don't add" is NOT met.

## Open items

- Re-record the digest lock's lysine values (mirrored); the lock's chrome readbacks also see the new MOLECULES header row.
- Rulings for Josh: C₆₀ and C₂₀H₂₀ fail the gate's novelty once B₁₂H₁₂²⁻ and adamantane bring I_h and the cage (S4c merged a C₆₀
  row on sos-s0 — the merge must decide how the gate treats it: a declared showpiece/frontier allowance, said in the source, is
  the honest road); one rock-salt cube only (Li₄F₄).
- CrCO₆'s oracle distance 6.9e-9 Eh (inside 1e-8, the largest). The ten curated IEs remain UNCHECKED value by value.
- `CLAUDE.md`'s "MOLECULES shows ON, MOLECULE, BASIS, VIEW + ORBITAL" — the section header now sits above them (integrator's line).

## KIT BRIEF notes for brief 4 (as built — fold into KIT-BRIEFS.md; not edited here)

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

## The exact next step (the coordinator's resume message, not yet started)

1. Start a gate server on 8757 (`python3 tools/gate/server.py <worktree> 8757`, record its pid). 2. `git merge a927fc3` inside the
worktree (S4c: VALENCE's switch and the C₆₀ frontier row in `lab/chemview.js`, `lab/library.js`, a C₆₀ row in `lab/library.json` set
to LATTICE, `lab/mathworker.js` chemGround/chemSpectrum/chemOpen, `tools/orbital-library.mjs` `buildFrontier()`, the three tests,
`lab/sw.js`): keep both intents — the picker, header, gate and 37 records AND VALENCE, the frontier record, the C₆₀ row, the 128-AO
tier; give C₆₀ a section and its identifiers (PubChem CID 123591, entered from memory and UNVERIFIED until checked by `tools/library/pubchem-ids.mjs`)
and a gate verdict that says why it ships. 3. `node tests/pwa.test.mjs --write`; `node tools/orbital-library.mjs --check`;
`node tools/new-project.mjs --check`; `bash test.sh node`; browser one at a time with 4 s pauses: chem, molecular-names, library,
menubar, new-project, orbitals, field-molecule. 4. REPORT.md waves under `## 2026-10-08 · 0.4.0 S4b — THE SECTIONS` and
`research/release-0.4.0/S4b-BUILD.md` (with the merge and each conflict's resolution). 5. Commit; kill the server by pid.
