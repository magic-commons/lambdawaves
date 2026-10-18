# THE 3-CODON NUCLEIC ACID — FACTS (fact-check of JOSH-PROMPT.md "THE AMBITION PAST THE BUCKYBALL")

2026-10-18 · Claude Sos (Opus 5.5), read-only on the repo except this folder · **no SCF was run** (Josh paused heavy compute).
The only maths run was the overlap matrices' eigenvalues and some counting.

**Verdict on the first take:** the atom and AO estimates hold to within about 5 %. Two claims are wrong:
1. **6-31+G\* is not refused.** None of the 13 built geometries has λmin(S) below 1e-9 on any rung. The duplexes come
   closest, at 5.3e-9 to 1.2e-8 across seven duplex models, which is a grey zone.
2. **"About 1,000 occupied orbitals" is the wrong number.** A single strand has 712–740 occupied orbitals and a duplex
   1,410–1,458.

Every number below is reproducible from this folder in a few minutes, with no SCF:
`build.py` (the geometries), `fd_helix.c` (AmberTools' fibre models), `basis.py` (the pipeline's rungs and λmin(S)) and
`contacts.py` (a geometry sanity check). Their outputs are `build.log`, `basis.json` and `contacts.log`.

The venv is `/home/joshua-hosain/.config/claude-backup/jobs/8497d75b/tmp/codon-venv`. It was made with `uv venv --python 3.12`,
because the system Python 3.14 has no ensurepip. It holds PySCF 2.14.0, numpy 2.5.4 and pymol-open-source 3.2.0a0.

---

## 1 · Atom counts, charge, electrons

### 1a · One residue inside a chain

A residue here is P, OP1, OP2, O5′, the sugar, the base and its own O3′, with the phosphodiester ionised (−1). These
formulas are the nucleoside-monophosphate formulas minus H₂O and minus H⁺. The builder reproduces them exactly
(`build.log`, and the per-atom H census in §2).

| residue | in-chain formula (anion) | heavy | H | atoms |
|---|---|---|---|---|
| dA | C₁₀H₁₁N₅O₅P⁻ | 21 | 11 | 32 |
| dC | C₉H₁₁N₃O₆P⁻ | 19 | 11 | 30 |
| dG | C₁₀H₁₁N₅O₆P⁻ | 22 | 11 | 33 |
| dT | C₁₀H₁₂N₂O₇P⁻ | 20 | 12 | 32 |
| rA | C₁₀H₁₁N₅O₆P⁻ | 22 | 11 | 33 |
| rC | C₉H₁₁N₃O₇P⁻ | 20 | 11 | 31 |
| rG | C₁₀H₁₁N₅O₇P⁻ | 23 | 11 | 34 |
| rU | C₉H₁₀N₂O₈P⁻ | 20 | 10 | 30 |

The mean is about 21 heavy atoms and 11 H, so about 32 atoms per nucleotide. The prompt's "≈ 20 heavy + ≈ 12 H" is
close. A neutral (protonated) residue has one more H.

**Strand bookkeeping.** With a 5′-OH end, drop the first residue's P, OP1 and OP2 (−3 heavy atoms) and add HO5′
(+1 H). The 3′-OH end adds HO3′ (+1 H). That leaves n − 1 phosphodiesters, so the charge is −(n − 1).

### 1b · The built molecules

The sequences are DNA 5′-ATG·CGA·TAA-3′ and its complement 5′-TTA·TCG·CAT-3′, and RNA 5′-AUG·CGA·UAA-3′ with
5′-UUA·UCG·CAU-3′. That is start codon, Arg, stop.

| model | heavy | H | atoms | charge | electrons | even? | n_occ |
|---|---|---|---|---|---|---|---|
| ssDNA 9-nt (`bdna-ss9`) | 184 | 103 | 287 | −8 | 1,424 | yes | 712 |
| ssRNA 9-nt, the "mRNA triplet" (`arna-ss9`) | 191 | 99 | 290 | −8 | 1,480 | yes | 740 |
| B-DNA 9-bp duplex (`bdna-9bp`, also `amber-lbdna/abdna-9bp`) | 363 | 208 | 571 | −16 | 2,820 | yes | 1,410 |
| A-DNA 9-bp (`adna-9bp`) | 363 | 208 | 571 | −16 | 2,820 | yes | 1,410 |
| A-RNA 9-bp duplex (`amber-arna-9bp`, `arna-9bp`) | 375 | 196 | 571 | −16 | 2,916 | yes | 1,458 |
| DNA·RNA hybrid 9-bp (`hybrid-9bp`, RNA = the ATG strand) | 370 | 204 | 574 | −16 | 2,876 | yes | 1,438 |
| ssRNA, phosphates protonated (`arna-ss9-neutral`) | 191 | 107 | 298 | 0 | 1,480 | yes | 740 |
| ssRNA + 8 Na⁺ (`arna-ss9-na`) | 199 | 99 | 298 | 0 | 1,560 | yes | 780 |
| B-DNA 9-bp, phosphates protonated (`bdna-9bp-neutral`) | 363 | 224 | 587 | 0 | 2,820 | yes | 1,410 |
| B-DNA 9-bp + 16 Na⁺ (`bdna-9bp-na`) | 379 | 208 | 587 | 0 | 2,980 | yes | 1,490 |

Here is how the prompt's figures compare.

| quantity | prompt | built |
|---|---|---|
| single strand, heavy atoms | ≈ 185 | 184 (DNA) / 191 (RNA) |
| single strand, all atoms | ≈ 300 | 287 / 290 |
| duplex, heavy atoms | ≈ 370 | 363 (DNA) / 375 (RNA) |
| duplex, all atoms | ≈ 600 | 571 for both |
| charge | −8 / −16 | correct |

**Parity.** Every case is even, and this is not luck. A closed-shell neutral molecule with normal valences has an even
electron count. Removing H⁺ (deprotonating a phosphate) removes no electrons. Na⁺ and Mg²⁺ each bring 10 electrons. So
the −8 strand, the −16 duplex, the protonated forms and the salt forms are all closed shells.

You only get an odd count through a bookkeeping error. These are the ones to watch for:
- a hydrogen atom dropped or added as a radical;
- a charge that does not match the phosphate count;
- keeping a builder's **5′-phosphate**. fnab keeps one, and then the charge is −10 for the dianion, or −9 with one OH.

Odd counts are refused by `solve.py`'s queue ("an open shell: RHF holds closed shells only"). If one appears, recount the
H atoms and set charge = −(number of P–O⁻ oxygens) + (number of cations' charge). Never switch to ROHF/UHF to
"fix" it.

---

## 2 · A real geometry: which builders work

All builders were tried in the requested order.

| builder | result | time |
|---|---|---|
| **pip `pymol-open-source` 3.2.0a0 → `cmd.fnab`** (3DNA fibre fragments, Lu & Olson 2004) | **WORKS.** It builds DNA in B or A form, single strand or duplex, and **single-stranded RNA (A form)**. It has **no RNA duplex** ("Double helix RNA building is not currently supported") and **no Z form** ("unable to load fragment 'atp_ttpZ'"). Its output is heavy atoms only, with a 5′-phosphate. | `pip install` about 10 s; each build 0.1–0.5 s; all 10 models plus H take 1.5–2.6 s |
| **AmberTools 26** (conda-forge, through a scratch micromamba env, 2.3 GB) → `fd_helix` | **WORKS, with a C driver.** conda-forge's AmberTools 26 ships `libnabc.a` and `include/nabc.h` but **no `nab` compiler**. `fd_helix.c` (10 lines, gcc) calls it. It prints the fibre model as ATOM lines and then exits 1 in its prmtop step; the ATOM lines are the model. The helix types are `arna aprna lbdna abdna sbdna adna` (Arnott/Langridge fibres; sbdna is left-handed **B**, not Z). It gives a **real A-RNA duplex** with 5′-OH ends, heavy atoms only. | env 52 s; each helix < 1 s |
| 3DNA v2.4 `fiber` | Not tried. It has 55 fibre models including Z-DNA, and is free for academics after registering on the x3dna.org forum. x3dna.org says 3DNA 2.4 is maintained but superseded by DSSR. | — |
| x3dna-DSSR | **DSSR Basic is now free for academics** (NIH R24GM153869, "Express Licensing" via Columbia Technology Ventures). DSSR-Pro academic costs $1,020 a seat. | — |
| Biopython / RDKit / OpenMM / pdbfixer | No helix builders. pdbfixer would add H to a PDB, but PyMOL `h_add` already does that correctly (below). | — |

**Hydrogens.** PyMOL `h_add` uses PyMOL's bond orders, which come from fnab's fragments; it puts one H on each
phosphodiester's single-bonded oxygen. `build.py` does the rest:
1. It strips the 5′-terminal phosphate, so both ends are OH.
2. It runs `h_add`.
3. It removes the phosphate H for the anion, keeps it for the `-neutral` form, or adds a Na⁺ for the `-na` form. The Na⁺
   goes on the O–P–O bisector, 2.77 Å from P (Na–O 2.35 Å).
4. It re-places every hydroxyl H (HO5′, HO3′, HO2′, P–OH) by a 15° dihedral scan, because h_add left some 1.5 Å from a
   neighbouring H.

On the AmberTools models the bond orders are copied from fnab's residues. PyMOL lost one adenine ring's orders on load
(B17: C2 had 2 H and N3 had 1 H); this is fixed and logged in `build.log`.

**Check.** Every model's H count equals the formula count in §1. The closest non-bonded contacts beyond 1–4 are in
`contacts.log`:
- H···H ≥ 1.87 Å on the fnab models;
- the X···H pairs at 1.82–1.84 Å are the Watson–Crick H-bonds;
- Arnott A-RNA has one H···H contact at 1.56 Å.

The ribose C2′ chirality on the converted RNA strands matches fnab's real RNA fragments (same sign of the C2′ volume;
O3′–C3′–C2′–O2′ is 40° against fnab's 43–45°).

**What was built** (PDB and XYZ in Å; the xyz comment line carries the charge):

| file | what | source |
|---|---|---|
| `bdna-9bp` | B-DNA 9-bp, the canonical test piece | fnab |
| `bdna-ss9` | ssDNA 9-nt | fnab |
| `arna-ss9` | ssRNA 9-nt, the "mRNA triplet" | fnab |
| `adna-9bp` | A-DNA 9-bp | fnab |
| `amber-arna-9bp` | **A-RNA duplex, the one to use** (Arnott fibre) | fd_helix `arna` |
| `amber-lbdna-9bp`, `amber-abdna-9bp` | B-DNA, Langridge and Arnott fibres (a cross-check of `bdna-9bp`) | fd_helix |
| `arna-9bp` | A-RNA approximation | fnab A-DNA with O2′ added, T→U |
| `hybrid-9bp` | DNA·RNA hybrid (A-like); no free builder makes one | same conversion on one strand |
| `*-neutral`, `*-na` | the remedies of §4 | as above |

The raw fd_helix output is in `fd_helix-raw/`.

**Not built: Z-DNA.** Z-DNA needs alternating purine–pyrimidine, for example (CG)ₙ. The ATG·CGA·TAA sequence is not a
Z-former, so a Z "3-codon" model is not physical. For a Z demonstration, use 3DNA `fiber` (Z-DNA model, after forum
registration), web 3DNA 2.0, or a crystal Z-DNA d(CGCGCG)₂ from the PDB.

**Fibre models are not optimised.** Before a production solve, a quick relaxation in solvent would remove the 1.5–1.9 Å
H contacts and give realistic H-bonds; GFN2-xTB with ALPB(water), or AMBER OL15/OL3, takes minutes. Re-run `basis.py` on
the relaxed geometry, because λmin(S) moves with geometry.

---

## 3 · Basis sizes and the refusal rule

`basis.py` uses the pipeline's own rungs: the vendored BSE decimals through `tools/volumes/lwbasis.py`, with `cart=True`
and every AO kept. For each rung it builds `gto.M(..., cart=True, charge=q)` and takes λmin(S) =
`eigvalsh(mol.intor('int1e_ovlp'))[0]`. Each eigensolve took 0.1–74 s on 4 threads at nice 19.

Memory columns: 8·n² is the f64 size (S, F, D or C on the card); 4·n² is the f32 C blob the app stores.

**ssDNA 9-nt (−8)**

| rung | nAO | n_occ | λmin(S) | refused? | 8·n² | 4·n² |
|---|---|---|---|---|---|---|
| STO-3G / STO-6G | 1,055 | 712 | 1.77e-1 / 1.81e-1 | no | 8.9 MB | 4.5 MB |
| 3-21G | 1,894 | 712 | 2.96e-3 | no | 28.7 MB | 14.3 MB |
| 6-31G | 1,894 | 712 | 9.46e-4 | no | 28.7 MB | 14.3 MB |
| **6-31G\*** | **2,998** | 712 | 6.15e-4 | no | 71.9 MB | 36.0 MB |
| 6-31+G\* | 3,734 | 712 | **8.60e-8** | no | 111.5 MB | 55.8 MB |

**ssRNA 9-nt, the mRNA triplet (−8)**

| rung | nAO | n_occ | λmin(S) | refused? | 8·n² | 4·n² |
|---|---|---|---|---|---|---|
| STO-3G / STO-6G | 1,086 | 740 | 1.77e-1 / 1.81e-1 | no | 9.4 MB | 4.7 MB |
| 3-21G | 1,949 | 740 | 3.00e-3 | no | 30.4 MB | 15.2 MB |
| 6-31G | 1,949 | 740 | 9.76e-4 | no | 30.4 MB | 15.2 MB |
| **6-31G\*** | **3,095** | 740 | 6.43e-4 | no | 76.6 MB | 38.3 MB |
| 6-31+G\* | 3,859 | 740 | **1.52e-7** | no | 119.1 MB | 59.6 MB |

**B-DNA 9-bp duplex (−16)**

| rung | nAO | n_occ | λmin(S) | refused? | 8·n² | 4·n² |
|---|---|---|---|---|---|---|
| STO-3G / STO-6G | 2,087 | 1,410 | 1.77e-1 / 1.81e-1 | no | 34.8 MB | 17.4 MB |
| 3-21G | 3,747 | 1,410 | 2.94e-3 | no | 112.3 MB | 56.2 MB |
| 6-31G | 3,747 | 1,410 | 8.86e-4 | no | 112.3 MB | 56.2 MB |
| **6-31G\*** | **5,925** | 1,410 | 5.71e-4 | no | 280.8 MB | 140.4 MB |
| 6-31+G\* | 7,377 | 1,410 | **7.61e-9** | **no (7.6× above)** | 435.4 MB | 217.7 MB |

**A-RNA 9-bp duplex (−16), `arna-9bp`**

| rung | nAO | n_occ | λmin(S) | refused? | 8·n² | 4·n² |
|---|---|---|---|---|---|---|
| STO-3G / STO-6G | 2,135 | 1,458 | 1.77e-1 / 1.81e-1 | no | 36.5 MB | 18.2 MB |
| 3-21G | 3,831 | 1,458 | 2.96e-3 | no | 117.4 MB | 58.7 MB |
| 6-31G | 3,831 | 1,458 | 8.91e-4 | no | 117.4 MB | 58.7 MB |
| **6-31G\*** | **6,081** | 1,458 | 5.87e-4 | no | 295.8 MB | 147.9 MB |
| 6-31+G\* | 7,581 | 1,458 | **5.79e-9** | **no (5.8× above)** | 459.8 MB | 229.9 MB |

(MB here means 10⁶ bytes.)

**The other geometries at 6-31+G\***, all with every lower rung at least 5.7e-4:

| geometry | λmin(S) at 6-31+G\* |
|---|---|
| hybrid | 5.52e-9 |
| A-DNA | 5.32e-9 |
| B-DNA protonated | 7.49e-9 |
| B-DNA + Na⁺ | 7.32e-9 |
| ssRNA protonated | 1.50e-7 |
| ssRNA + Na⁺ | 1.46e-7 |
| Arnott A-RNA (`amber-arna-9bp`; 6-31G\* 5.82e-4) | 6.35e-9 |
| Langridge B-DNA (`amber-lbdna-9bp`; 6-31G\* 5.19e-4) | 1.15e-8 |
| Arnott B-DNA (`amber-abdna-9bp`; 6-31G\* 5.65e-4) | 8.50e-9 |

AO counts for the variants are in `basis.json`: protonated +2 AO per H at the split-valence rungs; Na⁺ adds 9 AO
(STO-3G) and 19 (6-31G\*) per ion.

**Reading the refusal rule (SMIN_REFUSE = 1e-9).**
- **No rung of any 3-codon geometry is refused.** The prompt's "6-31+G\* will almost surely be refused, as C₆₀'s was"
  is wrong. C₆₀ is a closed cage, and its 6-31+G\* gave 2.2e-10. The fibre is long and open, so its diffuse
  functions overlap less per AO.
- **The single strands at 6-31+G\* (0.9–1.5e-7)** are in β-carotene's territory (4.2e-8, which converged).
- **The duplexes at 6-31+G\* (5.3e-9 to 1.15e-8 over seven models; the fnab B-DNA is 7.6e-9)** are in the **grey zone**: within one decade of the rule, with cond(S) at 3–5 × 10⁹. They also have 61–65 eigenvalues of S
  below 1e-6, which is what gpu4pyscf's default `remove_overlap_zero_eigenvalue` would drop; the pipeline keeps them.
  The single strands at 6-31+G\* have cond(S) 1.6–2.7 × 10⁸ and 15–23 eigenvalues below 1e-6. The duplexes sit
  between β-carotene (converged) and C₆₀ (4 h on the card without converging). A relaxed geometry with shorter H-bonds,
  or added water or ions, can push them under 1e-9.

Recommendation: stop the nucleic-acid ladder at 6-31G\*. Treat 6-31+G\* on a duplex as an experiment, not a promise,
and re-check λmin(S) on the relaxed geometry.

**App-side caps.** These are the app's limits in `lab/field.js` (`MOL_LIMITS`, `MAX_MOL_AO`) and `lab/library.js`
`DENSITY_AO`. Counts are the vendored records, with sp shells split and no primitive sharing.

| cap | limit | ssRNA STO-3G | ssRNA 6-31G\* | B-DNA duplex 6-31G\* |
|---|---|---|---|---|
| DENSITY (χ tile), D | ≤ 128 AO | 1,086 (8.5×) | 3,095 (24×) | 5,925 (46×) |
| ORBITAL | ≤ 768 AO | 1,086 | 3,095 | 5,925 |
| shells | ≤ 256 | 688 | 1,360 | 2,626 |
| primitives | ≤ 2,048 | 2,064 | 3,357 | 6,469 |
| weights | ≤ 8,192 | 3,258 | 5,936 | 11,380 |

**The smallest 3-codon rung is past every cap except weights**, so this is a new tier, not a bigger rung (§5).

---

## 4 · The physics of the polyanion

**What a gas-phase RHF of a −8 or −16 nucleic acid gives.** The phosphodiester anion binds its extra electron well on
its own. The model is H₂PO₄⁻, whose adiabatic detachment energy is 4.57 eV (X.-B. Wang, E. R. Vorpagel, X. Yang,
L.-S. Wang, *J. Phys. Chem. A* 105, 10468 (2001), "Experimental and theoretical investigations of the stability,
energetics, and structures of H₂PO₄⁻, H₂P₂O₇²⁻ and H₃P₃O₉²⁻ in the gas phase",
https://www.pnnl.gov/publications/experimental-and-theoretical-investigations-stability-energetics-and-structures-h2po4).

In the chain, every other unscreened phosphate charge raises each phosphate's levels. This is measured on our geometries
(point charges at P, 14.40 eV·Å / r, run in this session):

| model | Coulomb up-shift at a phosphate |
|---|---|
| ssDNA | 6.4–8.8 eV |
| ssRNA | 7.6–10.7 eV |
| B-DNA duplex | 12.5–16.3 eV |
| A-RNA duplex | 13.1–17.5 eV |

So the Koopmans **HOMO is positive**: about +2 to +6 eV for the strand and about +8 to +13 eV for the duplex. The top
of the occupied manifold is phosphate O lone pairs that are **unbound in vacuum**. The RHF solution only exists because
a finite basis confines those electrons.

Three consequences follow:
- In 6-31+G\* the diffuse functions let these electrons "leak" outwards, which is a basis artefact and a convergence
  hazard.
- The frontier orbitals a human would see are phosphate lone pairs, not the bases' π, which are the biology.
- In the real gas phase such multiply charged anions survive only behind a repulsive Coulomb barrier, if at all.
  - Review: A. Dreuw & L. S. Cederbaum, "Multiply charged anions in the gas phase", *Chem. Rev.* 102, 181 (2002).
  - Isolated SO₄²⁻ is electronically unstable and needs about 3 waters: X.-B. Wang, J. B. Nicholas, L.-S. Wang,
    *J. Chem. Phys.* 113, 10837 (2000), https://www.pnnl.gov/publications/electronic-instability-isolated-so42-and-its-solvation-stabilization.

**The three remedies:**

1. **Protonate the phosphates** (P–OH: charge 0, `*-neutral` files).
   - Cost: +1 H per linkage, +2 AO per H at the split-valence rungs (ssRNA 6-31G\* 3,095 → 3,111).
   - Electron count unchanged.
   - The frontier becomes the bases' π (the HOMO on guanine; a neutral phosphate's IP is much higher than G's ≈ 8 eV).
   - This is a gas-phase molecule like every other in the library: `solve.py` needs no change.
   - Caveat: it is the free acid (phosphodiester pKa ≈ 1), not the physiological species. Say so in the label.
2. **Add Na⁺, or Mg²⁺ for RNA, at the phosphates** (`*-na`: charge 0).
   - Cost: +19 AO per Na at 6-31G\*.
   - In vacuum the cations' empty 3s/3p states fall **into the gap**.
   - F. L. Gervasio, P. Carloni, M. Parrinello, "Electronic structure of wet DNA", *Phys. Rev. Lett.* 89, 108102 (2002),
     https://link.aps.org/doi/10.1103/PhysRevLett.89.108102: the lowest empty states are on Na⁺/PO₄⁻/water.
   - Y. Wang, H. Mohammad, M. P. Anantram, "Effect of counterions on DNA charge transport: a theoretical study", TANN'20,
     DOI 10.11159/tann20.140, https://avestia.com/TANN2020_Proceedings/files/paper/TANN_140.pdf: a **9-bp duplex**
     with Na⁺ in vacuum has its gap fall from 2.57 to 0.77 eV, because Na⁺ "adds unoccupied energy levels in the
     bandgap". In water the gap stays at about 4 eV.
   - The point charges here also over-correct, from +6–17 eV to −4 to −5 eV at each phosphate.
   - So the LUMO a viewer sees would be a sodium orbital. Mg²⁺ is worse: a bare dication is not the hexahydrate that
     binds RNA.
3. **Implicit solvent.**
   - PySCF (CPU) has ddCOSMO, ddPCM, C-PCM/IEF-PCM/SS(V)PE and SMD (`pyscf/solvent/`).
   - **gpu4pyscf 1.8.1** is installed in `lw-volumes/venv`, and it is the current PyPI release (released 2026-08-09).
     It **has PCM**: `solvent/pcm.py` offers C-PCM (default), COSMO, IEF-PCM and SS(V)PE, plus `smd.py`, with
     gradients and Hessians.
     - Source: X. Wu et al., "Enhancing GPU-acceleration in the Python-based Simulations of Chemistry Framework",
       arXiv:2404.09452.
     - Changelog: "PCM low memory mode that avoids storing ngrids² intermediates" (v1.5.2), "Reduce memory footprint …
       for C-PCM on large molecule" (v1.8.0), https://github.com/pyscf/gpu4pyscf/blob/master/CHANGELOG.
   - It has **no ddCOSMO on the GPU**.
   - Measured surface (PySCF `gen_surface`, Lebedev 302, SWIG, 1.2 × Bondi):

     | molecule | surface points | one dense ngrids² f64 matrix |
     |---|---|---|
     | ssRNA | 29,069 | 6.3 GiB |
     | B-DNA duplex | 57,591 | 24.7 GiB |

     So **`lowmem_intermediate_storage = True` is mandatory** on the 3070 and on a 40 GB A100, or use a coarser
     `lebedev_order`.
   - In water the phosphate levels sink below the bases' π: the right physics, at the cost of new solver code.
   - `solve.py`'s `on_cpu()` energy re-evaluation is h1e + veff only, so it would drop the solvation energy and needs a
     PCM term.

**Recommendation for a library that shows orbitals to a human: protonated phosphates (remedy 1) as the edition's
species**, labelled "neutral (acid) form".
- It is a closed-shell neutral gas-phase molecule.
- Its HOMO and LUMO are the bases' π/π\*, which is the chemistry a viewer is looking for.
- It adds no fake states: no unbound HOMO, no sodium LUMO.
- It costs < 1 % more AO.
- It runs through `solve.py` and the SMIN rule unchanged.

PCM(water) on the true anion is the physically best model. Keep it as the later "solvated" edition, once the pipeline
grows a solvent field and the Rent-A-GPU day comes. Avoid bare Na⁺/Mg²⁺ for display.

---

## 5 · Cost

**Data.**

gpu4pyscf on an **A100-40GB**: R. Li, Q. Sun, X. Zhang, G. K.-L. Chan, "Introducing GPU-acceleration into the
Python-based Simulations of Chemistry Framework", arXiv:2407.09700, Table 1. It is RHF, direct SCF, wall time for 10
SCF iterations, on the RNA_n series (spherical 6-31G(d)):

| system | AO | time for 10 iterations |
|---|---|---|
| RNA2 | 2,602 | 120 s |
| RNA3 | 3,894 | 318 s |
| RNA4 | 5,186 | 585 s |
| RNA5 | 6,478 | 932 s |

The fitted scaling is O(N^2.12).

The **RTX 3070**, measured in this repo:

| molecule | AO | time | cycles | per cycle |
|---|---|---|---|---|
| cholesterol 6-31G\* | 512 | 90 s | 12 | 7.5 s |
| β-carotene 6-31+G\* | 872 | 250 s | 12 | 21 s |
| C₆₀ 6-31G\* | 900 | 360 s | — | — |

Sources: `research/iteration-005/G-BUILD.md` for the first two, `research/iteration-006/C2-BUILD.md` for C₆₀. The 3070's
FP64 is 1/64 of FP32, about 0.3 TFLOP/s, against the A100's 9.7. Extrapolated to 872 AO, the A100 does a cycle in
about 1.2 s, so the **3070 is about 15–25× slower**.

**Estimates.** A 6-31G\* rung, direct SCF, projected guess. Assume 15–30 cycles; this is a guess, and a polyanion may need
more or fail.

| system (6-31G\*) | AO | A100 per cycle | A100 rung | 3070 per cycle | 3070 rung |
|---|---|---|---|---|---|
| ss 9-nt | 2,998–3,095 | ≈ 16–17 s | **≈ 4–9 min** | ≈ 4–7 min | **≈ 1–3.5 h** |
| 9-bp duplex | 5,925–6,081 | ≈ 78–82 s | **≈ 20–40 min** | ≈ 20–35 min | **≈ 5–18 h** |

The lower rungs (STO-3G at 1,055 / 2,087 AO, 3-21G and 6-31G at 1,894 / 3,747 AO) cost roughly 0.1× and 0.3–0.4× of
6-31G\* per cycle. STO-3G can take many cycles, though: C₆₀'s STO-6G took 115 cycles and 43 min. On a 3070 a whole
single-strand ladder is roughly an overnight job, and a duplex ladder roughly 1–2 days. PCM adds a per-cycle solve on
29k / 58k surface points.

**The prompt's take, checked:**
- "STO-3G/3-21G of a single strand is a 3070 job (hours)": true, and even ss 6-31G\* is a 3070 overnight job.
- "6-31G\* is a Rent-A-GPU job (A100: minutes to a few hours)": true. About 10 min for the strand and under 1 h for the
  duplex per rung on an A100. An A100-80 changes memory, not speed.

**Density fitting is not the road here; direct SCF is required.**
- The DF tensor estimated in this session:
  - naux(def2-universal-jkfit) = 6.4 × nAO: 19,891 for the ssRNA, 38,203 for the duplex;
  - unscreened size 0.7 TB for the strand and 5.0 TB for the duplex;
  - about 85–120 GB (strand) and 340–530 GB (duplex) after an overlap-based pair screen (7–17 % of pairs).
- That is beyond an 80 GB card, and beyond this machine's host RAM.
- gpu4pyscf's authors place DF's sweet spot under about 200 atoms, with larger systems on direct SCF, bounded by host
  memory (arXiv:2404.09452; https://pyscf.org/user/gpu.html).
- DF would also leave the pipeline's exact-RHF reference.

Direct-SCF memory is O(n²) and fits even the 8 GB card. gpu4pyscf's CDIIS moves its 8-vector space to host memory by
itself when it would not fit (`gpu4pyscf/scf/diis.py`, which logs "are saved in the host memory"). The duplex at 6-31G\*
(281 MB per matrix) will do that.

**The app side: the "giant" tier.**
- The prompt's 6,000 AO → 144 MB of f32 C per rung is right (B-DNA 6-31G\*: 140 MB).
- A whole duplex ladder of f32 C is about 505 MB; the single strand about 129 MB.
- The app's decode paths stop at **D ≤ 128 AO** (DENSITY's χ tile) and **768 AO** (ORBITAL), with 256 shells and 2,048
  primitives (§3).
- The density over 740 / 1,410 occupied orbitals per voxel cannot go through D: n² per voxel is 9.6 M / 35 M terms.

What the tier needs:
1. **A frontier window of C columns.** Ship HOMO−K … LUMO+K in f32: K = 32 gives 64 columns × 6,081 × 4 B ≈ 1.6 MB for
   the duplex, instead of 140 MB. Keep the full C (f64 npz) only in the raw catalogue.
2. **DENSITY baked offline** in the pipeline (PySCF `numint.eval_rho` on a 128³ grid, f16 ≈ 4 MB, or f32 8 MB) and
   shipped as a volume, instead of a GPU density over 1,000+ orbitals.
   - The alternative "GPU density road" is ρ = Σᵢ|Σ_μ C_μi χ_μ|² as a tiled, shell-screened GEMM, χ(grid × nAO) ·
     C_occ.
   - That is about 1e13 FLOP (ssRNA: 2.1 M points × 3,095 × 740 multiply-adds) to 4e13 FLOP (duplex) dense on a
     128³ grid. It is feasible as a one-off on a
     desktop GPU, but it is not a per-frame WebGPU kernel.
3. **An ORBITAL kernel with spatial shell screening** (cell lists), so a voxel only visits the 30–60 nearby atoms'
   shells; plus storage buffers sized past 256 shells, 2,048 primitives and 8,192 weights.
4. **f16 C is a weaker option than frontier columns.** It halves to 2·n² (72 MB at 6,000 AO), but the diffuse rungs'
   large, cancelling coefficients (β-carotene's D reached 93) lose too much at f16's 11-bit mantissa.

---

## Files (this folder)

| file | role |
|---|---|
| `build.py` | builds all models (PyMOL fnab; with `FDH_DIR=…` also the AmberTools ones) |
| `fd_helix.c` | the libnabc driver; build and run lines are in its header |
| `fd_helix-raw/` | fd_helix's heavy-atom output |
| `basis.py` | nAO, n_occ and λmin(S) on the pipeline's rungs → `basis.json`; `basis.log` holds the 78 eigensolve lines |
| `contacts.py` | the sanity check → `contacts.log` |
| `*.pdb`, `*.xyz` | 13 models; the xyz comment line carries charge and multiplicity |

The scratch envs are not part of the repo: the codon venv, the AmberTools env (2.3 GB) and micromamba, all in
`/home/joshua-hosain/.config/claude-backup/jobs/8497d75b/tmp/`.
