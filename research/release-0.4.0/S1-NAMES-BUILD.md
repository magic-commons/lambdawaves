# λWAVES 0.4.0 · S1 THE NAMES — what the names builder built (waves 140–143)

Written by Claude Sos from the builder's own hand-off (`S1-NAMES-HANDOFF.md`, kept beside this file) after the builder
hit the account's session limit, plus a fresh run of the check tool on the merged tree (`sos-s0`, NAMES merged beside
S1′ cameraEye). Nothing was pushed, tagged or deployed (Josh 2026-10-07: nothing goes to GitHub or Cloudflare until the
whole plan is done).

## Summary

1. Four commits on `s1-names` from `58852c7` (N1–N4), merged into `sos-s0` after cameraEye; the only conflict was the
   generated `lab/sw.js`, regenerated.
2. `lab/names.js` (497 lines): fifteen finite character tables plus D∞h / C∞v, Cartesian d, clusters at 2e-10 Eh, all or
   nothing, the frontier by level, one `forms()` for plain / typeset / LaTeX / ASCII / speech; the atomic labels read
   the same service.
3. `tools/orbital-names.mjs --check --pyscf`: exit 0; 52 enabled molecules named, CuH and ZnH₂ disabled; the ten anchors
   MATCH the probe; PySCF agrees on water in the same frame.
4. The worker names the solve inside `ensureSolve`: benzene 4 ms in the browser worker, ≤ 10 ms cold in node.
5. MO-REGISTRY reads `1b₁ · HOMO`; a degenerate HOMO is one HOMO; the CORE fold; MOLECULES' knob and ε readout named.
6. The copy, the GLB, the cube and the NPZ carry the names.
7. The demos name their HOMO; N₂ carries the teaching moment (`3σg` in STO-3G, `1πu` in 6-31+G*).
8. Gates green at the builder's tip (below); the merged tree re-checked by Claude Sos (below).
9. `lab/*.js` 35,135 → 35,745 (+610): four formatters became one, but the total grew.
10. Open: the curated ionisation energies are unchecked; no O_h or I_h molecule exists yet to exercise those tables.

## The commits

| # | sha | title |
|---|---|---|
| N1 | `777a4dc` | 0.4.0 S1 N1 · THE NAMES: lab/names.js, the one service |
| N2 | `7b49926` | 0.4.0 S1 N2 · tools/orbital-names.mjs --check: every framework, the anchors, every molecule |
| N3 | `ea125ec` | 0.4.0 S1 N3 · the worker's names in the views, the copy and the exports |
| N4 | `04e86f4` | 0.4.0 S1 N4 · the demos learn their names; the N2 teaching moment |
| — | `cea608c` | 0.4.0 S1 · hand-off on usage pause |

## Gates

**At the builder's tip** (its hand-off): `bash test.sh node` 83 suites, exit 0; `tests/names.test.mjs` 5/5 blocks;
browser on 8741/5209, one at a time — `molecular-names` (benzene named in 4 ms), `chem` 0 failing of 54, `register` 0 of
17, `latex-copy` (0 `.katex-error` on a pasted named page), `export3d`, `new-project`, `current`, `molecule-demos`: all
green.

**On the merged tree** (NAMES + cameraEye, Claude Sos): see REPORT and the merge commit for the node gate, the precache
and the browser light check.

## Findings

- **Butadiene** is built s-cis (C1 and C4 on the same side), not the trans its name says; declared C2v as built, not
  rebuilt (its geometry is oracle-pinned). A geometry fix is a separate decision.
- **Furan**: approximate C2v at geomTol 1e-2 is refused (core residual 5.6e-2); falls back to exact Cs, and says so.
- **Pyridine**: named in approximate C2v (residual 3.5e-3, framework 8.1e-4 bohr).
- **Worst exact-group residual**: 5.8e-10 (SO₂).
- **The blocked-projector road** (Sol thread, Prop. 7, leakage 3.9e-15) would not have been simpler: an SCF eigensolve
  change plus full-group partner matching, against a road that needed no solver change.
- **`CURATED_IE` is UNCHECKED**: HeI band maxima entered from memory; verify against NIST SRD 101 and the
  LEGAL-PROVENANCE reading before any store build.

## Open items

- Verify the ten curated ionisation energies (above).
- The O_h, D₅d, D₅h and I_h tables self-test but no library molecule exercises them until S4b/S4c (cubane, ferrocene,
  C₆₀).
- The furan geometry (approximate symmetry), and butadiene's s-cis build.

## The `--check` output (fresh run on the merged tree, `node tools/orbital-names.mjs --check --pyscf`, exit 0)

tables: C1(1) Cs(2) C2(2) C2h(4) C2v(4) C3v(6) D2h(8) D3h(12) D3d(12) Td(24) D5h(20) D5d(20) D6h(24) Oh(48) Ih(120) — every one self-tests (orthogonality, Σdim² = h, the vector rep whole)
frameworks: H2 Dinfh · LiH Cinfv · HF Cinfv · N2 Dinfh · CO Cinfv · F2 Dinfh · LiF Cinfv · NaH Cinfv · HCl Cinfv · Cl2 Dinfh · NaCl Cinfv · BeH2 Dinfh · BH3 D3h · CH4 Td · NH3 C3v · H2O C2v · MgH2 Dinfh · AlH3 D3h · SiH4 Td · PH3 C3v · H2S C2v · CO2 Dinfh · HCN Cinfv · N2O Cinfv · O3 C2v · SO2 C2v · BF3 D3h · CF4 Td · H2O2 C2 · C2H2 Dinfh · C2H4 D2h · C2H6 D3d · H2CO C2v · CH3OH Cs · HCOOH Cs · CH3CN C3v · C3H6 D3h · C4H6 C2v · C4H4O C2v 9.6e-4 · C5H5N C2v 8.1e-4 · urea C2v · glycine Cs · C6H6 D6h · NH4+ Td · H3O+ C3v · OH- Cinfv · CN- Cinfv · CuH Cinfv · ZnH2 Dinfh · GeH4 Td · AsH3 C3v · H2Se C2v · HBr Cinfv · Br2 Dinfh
MATCH HF    (1σ)²(2σ)²(3σ)²(1π)⁴  HOMO 1π LUMO 4σ  0.5 ms (solve 9 ms)
MATCH N2    (1σg)²(1σu)²(2σg)²(2σu)²(1πu)⁴(3σg)²  HOMO 3σg LUMO 1πg  0.8 ms (solve 85 ms)
MATCH CO    (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)²  HOMO 5σ LUMO 2π  0.3 ms (solve 27 ms)
MATCH CH4   (1a1)²(2a1)²(1t2)⁶  HOMO 1t2 LUMO 2t2  1.0 ms (solve 13 ms)
MATCH NH3   (1a1)²(2a1)²(1e)⁴(3a1)²  HOMO 3a1 LUMO 4a1  0.2 ms (solve 11 ms)
MATCH H2O   (1a1)²(2a1)²(1b2)²(3a1)²(1b1)²  HOMO 1b1 LUMO 4a1  0.4 ms (solve 8 ms)
MATCH CO2   (1σu)²(1σg)²(2σg)²(3σg)²(2σu)²(4σg)²(1πu)⁴(3σu)²(1πg)⁴  HOMO 1πg LUMO 2πu  0.6 ms (solve 56 ms)
MATCH C2H4  (1ag)²(1b1u)²(2ag)²(2b1u)²(1b2u)²(3ag)²(1b3g)²(1b3u)²  HOMO 1b3u LUMO 1b2g  1.1 ms (solve 38 ms)
MATCH H2CO  (1a1)²(2a1)²(3a1)²(4a1)²(1b2)²(5a1)²(1b1)²(2b2)²  HOMO 2b2 LUMO 2b1  0.3 ms (solve 25 ms)
MATCH C6H6  (1e1u)⁴(1a1g)²(1e2g)⁴(1b1u)²(2a1g)²(2e1u)⁴(2e2g)⁴(3a1g)²(2b1u)²(1b2u)²(3e1u)⁴(1a2u)²(3e2g)⁴(1e1g)⁴  HOMO 1e1g LUMO 1e2u  4.4 ms (solve 1064 ms)

| molecule | group | name ms | configuration (STO-3G) or why not |
|---|---|---|---|
| H2 | Dinfh | 2.0 | (1σg)² · HOMO 1σg · LUMO 1σu |
| LiH | Cinfv | 0.8 | (1σ)²(2σ)² · HOMO 2σ · LUMO 3σ |
| HF | Cinfv | 0.5 | (1σ)²(2σ)²(3σ)²(1π)⁴ · HOMO 1π · LUMO 4σ |
| N2 | Dinfh | 0.8 | (1σg)²(1σu)²(2σg)²(2σu)²(1πu)⁴(3σg)² · HOMO 3σg · LUMO 1πg |
| CO | Cinfv | 0.3 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)² · HOMO 5σ · LUMO 2π |
| F2 | Dinfh | 0.9 | (1σu)²(1σg)²(2σg)²(2σu)²(1πu)⁴(3σg)²(1πg)⁴ · HOMO 1πg · LUMO 3σu |
| LiF | Cinfv | 0.7 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴ · HOMO 1π · LUMO 5σ |
| NaH | Cinfv | 0.3 | (1σ)²(2σ)²(1π)⁴(3σ)²(4σ)² · HOMO 4σ · LUMO 5σ |
| HCl | Cinfv | 0.2 | (1σ)²(2σ)²(3σ)²(1π)⁴(4σ)²(5σ)²(2π)⁴ · HOMO 2π · LUMO 6σ |
| Cl2 | Dinfh | 0.8 | (1σu)²(1σg)²(2σu)²(2σg)²(3σu)²(3σg)²(1πg)⁴(1πu)⁴(4σg)²(4σu)²(5σg)²(2πu)⁴(2πg)⁴ · HOMO 2πg · LUMO 5σu |
| NaCl | Cinfv | 0.5 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)²(2π)⁴(6σ)²(7σ)²(8σ)²(3π)⁴ · HOMO 3π · LUMO 9σ |
| BeH2 | Dinfh | 0.3 | (1σg)²(2σg)²(1σu)² · HOMO 1σu · LUMO 1πu |
| BH3 | D3h | 0.8 | (1a1′)²(2a1′)²(1e′)⁴ · HOMO 1e′ · LUMO 1a2″ |
| CH4 | Td | 1.0 | (1a1)²(2a1)²(1t2)⁶ · HOMO 1t2 · LUMO 2t2 |
| NH3 | C3v | 0.2 | (1a1)²(2a1)²(1e)⁴(3a1)² · HOMO 3a1 · LUMO 4a1 |
| H2O | C2v | 0.4 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)² · HOMO 1b1 · LUMO 4a1 |
| MgH2 | Dinfh | 0.6 | (1σg)²(2σg)²(1πu)⁴(1σu)²(3σg)²(2σu)² · HOMO 2σu · LUMO 4σg |
| AlH3 | D3h | 0.5 | (1a1′)²(2a1′)²(1a2″)²(1e′)⁴(3a1′)²(2e′)⁴ · HOMO 2e′ · LUMO 2a2″ |
| SiH4 | Td | 0.7 | (1a1)²(2a1)²(1t2)⁶(3a1)²(2t2)⁶ · HOMO 2t2 · LUMO 4a1 |
| PH3 | C3v | 0.6 | (1a1)²(2a1)²(1e)⁴(3a1)²(4a1)²(2e)⁴(5a1)² · HOMO 5a1 · LUMO 3e |
| H2S | C2v | 0.3 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)²(4a1)²(2b2)²(5a1)²(2b1)² · HOMO 2b1 · LUMO 3b2 |
| CO2 | Dinfh | 0.6 | (1σu)²(1σg)²(2σg)²(3σg)²(2σu)²(4σg)²(1πu)⁴(3σu)²(1πg)⁴ · HOMO 1πg · LUMO 2πu |
| HCN | Cinfv | 0.3 | (1σ)²(2σ)²(3σ)²(4σ)²(5σ)²(1π)⁴ · HOMO 1π · LUMO 2π |
| N2O | Cinfv | 0.3 | (1σ)²(2σ)²(3σ)²(4σ)²(5σ)²(6σ)²(1π)⁴(7σ)²(2π)⁴ · HOMO 2π · LUMO 3π |
| O3 | C2v | 0.4 | (1a1)²(1b2)²(2a1)²(3a1)²(2b2)²(4a1)²(5a1)²(1b1)²(3b2)²(4b2)²(6a1)²(1a2)² · HOMO 1a2 · LUMO 2b1 |
| SO2 | C2v | 0.5 | (1a1)²(2a1)²(1b2)²(3a1)²(2b2)²(1b1)²(4a1)²(5a1)²(3b2)²(6a1)²(7a1)²(2b1)²(4b2)²(5b2)²(8a1)²(1a2)² · HOMO 1a2 · LUMO 3b1 |
| BF3 | D3h | 1.1 | (1a1′)²(1e′)⁴(2a1′)²(3a1′)²(2e′)⁴(4a1′)²(3e′)⁴(1a2″)²(1a2′)²(4e′)⁴(1e″)⁴ · HOMO 1e″ · LUMO 2a2″ |
| CF4 | Td | 1.9 | (1a1)²(1t2)⁶(2a1)²(3a1)²(2t2)⁶(4a1)²(3t2)⁶(1e)⁴(1t1)⁶(4t2)⁶ · HOMO 4t2 · LUMO 5t2 |
| H2O2 | C2 | 0.3 | (1b)²(1a)²(2a)²(2b)²(3a)²(3b)²(4a)²(5a)²(4b)² · HOMO 4b · LUMO 5b |
| C2H2 | Dinfh | 0.4 | (1σg)²(1σu)²(2σg)²(2σu)²(3σg)²(1πu)⁴ · HOMO 1πu · LUMO 1πg |
| C2H4 | D2h | 1.1 | (1ag)²(1b1u)²(2ag)²(2b1u)²(1b2u)²(3ag)²(1b3g)²(1b3u)² · HOMO 1b3u · LUMO 1b2g |
| C2H6 | D3d | 0.8 | (1a2u)²(1a1g)²(2a1g)²(2a2u)²(1eu)⁴(3a1g)²(1eg)⁴ · HOMO 1eg · LUMO 2eu |
| H2CO | C2v | 0.3 | (1a1)²(2a1)²(3a1)²(4a1)²(1b2)²(5a1)²(1b1)²(2b2)² · HOMO 2b2 · LUMO 2b1 |
| CH3OH | Cs | 0.3 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(1a″)²(6a′)²(7a′)²(2a″)² · HOMO 2a″ · LUMO 8a′ |
| HCOOH | Cs | 0.3 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(6a′)²(7a′)²(8a′)²(1a″)²(9a′)²(2a″)²(10a′)² · HOMO 10a′ · LUMO 3a″ |
| CH3CN | C3v | 0.5 | (1a1)²(2a1)²(3a1)²(4a1)²(5a1)²(1e)⁴(6a1)²(7a1)²(2e)⁴ · HOMO 2e · LUMO 3e |
| C3H6 | D3h | 1.5 | (1e′)⁴(1a1′)²(2a1′)²(2e′)⁴(1a2″)²(3a1′)²(1e″)⁴(3e′)⁴ · HOMO 3e′ · LUMO 1a2′ |
| C4H6 | C2v | 1.1 | (1b2)²(1a1)²(2b2)²(2a1)²(3a1)²(3b2)²(4a1)²(4b2)²(5a1)²(6a1)²(5b2)²(6b2)²(7a1)²(1b1)²(1a2)² · HOMO 1a2 · LUMO 2b1 |
| C4H4O | C2v | 2.4 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(6a′)²(7a′)²(8a′)²(9a′)²(10a′)²(11a′)²(1a″)²(12a′)²(13a′)²(14a′)²(15a′)²(2a″)²(3a″)² · HOMO 3a″ · LUMO 4a″ · Cs (downgraded from C2v → Cs) |
| C5H5N | C2v | 2.2 | (1a1)²(1b2)²(2a1)²(3a1)²(2b2)²(4a1)²(5a1)²(6a1)²(3b2)²(7a1)²(4b2)²(8a1)²(9a1)²(5b2)²(6b2)²(10a1)²(1b1)²(7b2)²(11a1)²(2b1)²(1a2)² · HOMO 1a2 · LUMO 3b1 · approximate (framework 8.1e-4 bohr, residual 3.5e-3) |
| urea | C2v | 1.4 | (1a1)²(2a1)²(1b2)²(3a1)²(4a1)²(5a1)²(2b2)²(6a1)²(3b2)²(7a1)²(4b2)²(1b1)²(8a1)²(1a2)²(5b2)²(2b1)² · HOMO 2b1 · LUMO 3b1 |
| glycine | Cs | 1.0 | (1a′)²(2a′)²(3a′)²(4a′)²(5a′)²(6a′)²(7a′)²(8a′)²(9a′)²(10a′)²(1a″)²(11a′)²(12a′)²(2a″)²(13a′)²(3a″)²(14a′)²(15a′)²(4a″)²(16a′)² · HOMO 16a′ · LUMO 5a″ |
| C6H6 | D6h | 4.4 | (1e1u)⁴(1a1g)²(1e2g)⁴(1b1u)²(2a1g)²(2e1u)⁴(2e2g)⁴(3a1g)²(2b1u)²(1b2u)²(3e1u)⁴(1a2u)²(3e2g)⁴(1e1g)⁴ · HOMO 1e1g · LUMO 1e2u |
| NH4+ | Td | 0.5 | (1a1)²(2a1)²(1t2)⁶ · HOMO 1t2 · LUMO 3a1 |
| H3O+ | C3v | 0.2 | (1a1)²(2a1)²(1e)⁴(3a1)² · HOMO 3a1 · LUMO 4a1 |
| OH- | Cinfv | 0.2 | (1σ)²(2σ)²(3σ)²(1π)⁴ · HOMO 1π · LUMO 4σ |
| CN- | Cinfv | 0.2 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)² · HOMO 5σ · LUMO 2π |
| CuH | Cinfv | — | disabled: not a minimum |
| ZnH2 | Dinfh | — | disabled: not a minimum |
| GeH4 | Td | 2.0 | (1a1)²(2a1)²(1t2)⁶(3a1)²(2t2)⁶(4a1)²(3t2)⁶(1e)⁴(4t2)⁶ · HOMO 4t2 · LUMO 5t2 |
| AsH3 | C3v | 0.9 | (1a1)²(2a1)²(1e)⁴(3a1)²(4a1)²(2e)⁴(5a1)²(3e)⁴(4e)⁴(6a1)²(7a1)²(5e)⁴(8a1)² · HOMO 8a1 · LUMO 6e |
| H2Se | C2v | 0.5 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)²(4a1)²(2b2)²(5a1)²(2b1)²(3b2)²(6a1)²(1a2)²(3b1)²(7a1)²(8a1)²(4b2)²(9a1)²(4b1)² · HOMO 4b1 · LUMO 5b2 |
| HBr | Cinfv | 0.6 | (1σ)²(2σ)²(3σ)²(1π)⁴(4σ)²(5σ)²(2π)⁴(6σ)²(3π)⁴(1δ)⁴(7σ)²(8σ)²(4π)⁴ · HOMO 4π · LUMO 9σ |
| Br2 | Dinfh | 2.6 | (1σg)²(1σu)²(2σu)²(2σg)²(3σu)²(3σg)²(1πg)⁴(1πu)⁴(4σu)²(4σg)²(5σu)²(5σg)²(2πg)⁴(2πu)⁴(6σu)²(6σg)²(3πu)⁴(3πg)⁴(1δu)⁴(1δg)⁴(7σg)²(7σu)²(8σg)²(4πu)⁴(4πg)⁴ · HOMO 4πg · LUMO 8σu |

PySCF C2v label_orb_symm (water): A1 A1 B2 A1 B1 A1 B2
lab/names.js:                     A1 A1 B2 A1 B1 A1 B2
MATCH (same frame)

OK — every anchor matches the probe; every enabled molecule is named or says why
