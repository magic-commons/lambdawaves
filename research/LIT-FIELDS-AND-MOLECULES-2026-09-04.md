# LIT — Fields of a quantum charge, molecular orbitals, and orbital dynamics (2026-09-04)

Literature digest for the λWAVES round. Stage assumed: 30 Bohr, hydrogenic n ≤ 6. Atomic units unless stated. Each entry: authors (year), title, venue — what it gives the round; one number/formula where the source supplies one.

## 1. The classical field of a quantum charge and current density

- Feynman (1939), *Forces in Molecules*, Phys. Rev. 56, 340 — https://doi.org/10.1103/PhysRev.56.340 — the electrostatic theorem: the force on nucleus A is the classical Coulomb force of the electron density plus the other nuclei, **F_A = Z_A ∫ρ(r)(r−R_A)/|r−R_A|³ d³r − Z_A Σ_B Z_B (R_B−R_A)/|R_B−R_A|³**. (Hellmann 1937, *Einführung in die Quantenchemie*, Deuticke, gives the derivative form dE/dλ = ⟨∂H/∂λ⟩.)
- Berlin (1951), *Binding regions in diatomic molecules*, J. Chem. Phys. 19, 208 — https://doi.org/10.1063/1.1748161 — partitions space into binding/antibinding regions by the sign of the Hellmann–Feynman force density; a direct colour-map for the stage.
- Politzer & Murray (2022), *The conceptual power of the Hellmann–Feynman theorem*, Struct. Chem. — https://doi.org/10.1007/s11224-022-01961-9 (companion perspective: J. Mol. Model. 24, 266, 2018, https://pubmed.ncbi.nlm.nih.gov/30171447/) — forces are purely Coulombic; total energies are expressible via electrostatic potentials at the nuclei alone. **Flag:** the theorem is exact only for exact/fully variational ψ; a finite LCAO basis adds Pulay forces.
- Nazarov (2026), *In defence of the Ehrenfest mean-field molecular dynamics*, arXiv:2609.03419 — https://arxiv.org/abs/2609.03419 — claims Ehrenfest is *exact*, not approximate, in the classical-nuclei limit (equivalence to exact factorization). Vaníček (2026), *Thawed Gaussian Ehrenfest dynamics*, arXiv:2607.10847, adds nuclear quantum spread. **Flag:** Ehrenfest still cannot branch a nuclear packet on two surfaces.
- Berman, Kuzmich & Milonni (2025), *Field energy and angular momentum in spontaneous emission: a Schrödinger-picture approach*, arXiv:2504.20831 / J. Mod. Opt. — https://arxiv.org/abs/2504.20831 — the emitted field's spin and orbital angular momenta are equal, and a consistent Weisskopf–Wigner treatment gives finite energy density and Poynting vector down to the origin (no near-zone divergence).
- Crisp & Jaynes (1969), *Radiative effects in semiclassical theory*, Phys. Rev. 179, 1253; Milonni (1976), Phys. Rep. 25, 1 — https://web.physics.ucsb.edu/~phys250/fall2009/Ref3_Milonni.pdf — the "charge density radiates classically" picture. **Flag:** it radiates **P = |c₁|²|c₂|² ħωA**, which vanishes for a pure 2p state, versus QED's |c₂|² ħωA; on the stage, show the classical field only of coherent superpositions.
- Horbatsch & Horbatsch (2021), *Classical calculation of radiative decay rates of hydrogenic Stark states*, J. Phys. B (arXiv:2011.02645) — https://arxiv.org/abs/2011.02645 — Larmor radiation from WKB-quantised Kepler/Stark orbits reproduces quantum rates for m > 0 across many Δn, but only Δn ≈ 1 for m = 0.

**Near zone on a 30-Bohr stage.** Lyman-α: λ = 2297 a₀, so k r ≤ 0.082 at the stage edge; the wave zone (r ≈ λ/2π = 366 a₀) never enters. Retardation across the stage is 5.3 as against a 405 as beat. The E-field is quasi-static to ~1 part in 150 (static : induction : radiation ≈ (kr)⁻³ : (kr)⁻² : (kr)⁻¹). The one non-electrostatic thing worth drawing is the **Biot–Savart field of the current density**: a 2p₊₁ Bohr magneton gives 6.3 T at 1 a₀ (= α²/2 a.u.), 0.23 mT at 30 a₀. For n=5→6 (0.166 eV, λ = 1.4×10⁵ a₀) kr = 1.3×10⁻³. So: always quasi-static for E; B is real but O(α²).

## 2. A general molecular-orbital model on hydrogenic/STO bases

- Hartree (1928), Proc. Camb. Phil. Soc. 24, 89; Slater (1951), *A simplification of the Hartree–Fock method*, Phys. Rev. 81, 385 — https://doi.org/10.1103/PhysRev.81.385 — the local exchange **V_x = −3(3ρ/8π)^{1/3}** (= 3/2 × the Kohn–Sham value) that makes a central-field atom a one-radial-ODE problem.
- Herman & Skillman (1963), *Atomic Structure Calculations*, Prentice-Hall — https://archive.org/details/atomicstructurec0000herm — HFS orbitals and potentials for 2 ≤ Z ≤ 103 by Numerov integration with the Latter tail (V → −1/r); the canonical reference table.
- Čertík, Pask & Vackář (2013), *dftatom*, Comput. Phys. Commun. 184, 1777 (arXiv:1209.1752) — https://arxiv.org/abs/1209.1752 — open-source Fortran radial Schrödinger/Dirac/Kohn–Sham solver, absolute accuracy 10⁻⁸ Ha for uranium; the modern Herman–Skillman.
- Slater (1930), *Atomic shielding constants*, Phys. Rev. 36, 57; Clementi & Raimondi (1963), J. Chem. Phys. 38, 2686; and *Shielding through Time*, J. Chem. Educ. 103, 1943 (2026) — https://pubs.acs.org/jceda8/article/103/4/1943/5149962 — screening rules and their SCF-fitted replacement. Number: carbon 2p Z_eff = 3.25 (Slater) vs 3.136 (Clementi–Raimondi, ζ = 1.5679).
- Rico, López, Ema & Ramírez, *Molecular integrals over Slater-type orbitals: from pioneers to recent progress* — https://www.researchgate.net/publication/200710102 ; Bağcı & Hoggan (2014), Phys. Rev. E 89, 053307 (arXiv:1405.5436) — https://arxiv.org/abs/1405.5436 — two-centre STO integrals in prolate-spheroidal coordinates; s-type two-centre integrals are closed-form (S₁ₛ₁ₛ = e^{−R}(1+R+R²/3)); higher l needs the auxiliary-function machinery.
- Ruedenberg & Schmidt (2007), *Why does electron sharing lead to covalent bonding?*, J. Comput. Chem. 28, 391 — https://doi.org/10.1002/jcc.20553 — H₂⁺ beyond bare 1s: Finkelstein–Horowitz scaled exponent ζ = 1.239 gives D_e = 2.35 eV; Dickinson (1933) 1s+2p gives 2.73 eV; exact 2.79 eV at R = 2.00 a₀ (bare 1s LCAO: 1.76 eV at 2.49 a₀). Heitler–London H₂: 3.14 eV at 0.87 Å vs 4.75 eV at 0.741 Å. Hylleraas (1929) He: −2.90324 Ha vs exact −2.903724.

## 3. Visualising orbitals and their dynamics

- Itatani et al. (2004), *Tomographic imaging of molecular orbitals*, Nature 432, 867 — https://www.nature.com/articles/nature03183 — N₂ HOMO (3σ_g) amplitude *and phase* reconstructed from harmonics 17–51 of an 800 nm pulse on aligned molecules.
- Puschnig et al. (2009), *Reconstruction of molecular orbital densities from photoemission data*, Science 326, 702 — https://www.science.org/doi/10.1126/science.1176105 — plane-wave final state: **I(k_∥) ∝ |A·k|² |ψ̃(k)|²**, so ARPES maps are |FT ψ|². Bennecke et al. (2026), *Table-top three-dimensional photoemission orbital tomography*, Nat. Commun. (arXiv:2502.18269) — https://arxiv.org/abs/2502.18269 — full 3-D PTCDA/Ag(110) orbitals with 1 Å slices from a femtosecond HHG source. **Flag** (Scerri 2000, J. Chem. Educ. 77, 1492): what is imaged is a Dyson orbital under a plane-wave approximation.
- Borrego-Varillas, Lucchini & Nisoli (2022), *Attosecond spectroscopy…*, Rep. Prog. Phys. 85, 066401 — https://iopscience.iop.org/article/10.1088/1361-6633/ac5e7f — the attosecond toolkit (streaking, RABBITT, transient absorption); Li, Govind, Isborn, DePrince & Lopata (2020), *Real-time time-dependent electronic structure theory*, Chem. Rev. 120, 9951 — https://pubmed.ncbi.nlm.nih.gov/32813506/ — RT-TDDFT propagation numerics (Magnus steps, Gaussian bases) the lab's exact propagator can be checked against.
- Dahl & Springborg (1982), *Wigner's phase space function and atomic structure I: the hydrogen ground state*, Mol. Phys. 47, 1001 — https://www.tandfonline.com/doi/abs/10.1080/00268978200100752 ; Praxmeyer, Mostowski & Wódkiewicz (2006), J. Phys. A 39, 14143 — https://iopscience.iop.org/article/10.1088/0305-4470/39/45/022 — closed integral for the Wigner function of *every* bound state via the momentum-space (Fock) form. **Flag:** the 1s Wigner function is negative in parts of phase space; Husimi is positive but smeared.
- Colijn & Vrscay (2002), *Spin-dependent Bohm trajectories for hydrogen eigenstates*, Phys. Lett. A 300, 334; Takemoto & Becker (2011), Phys. Rev. A 84, 023401 (arXiv:1012.1967) — https://arxiv.org/abs/1012.1967 — Bohmian flow for H₂⁺ in a laser. **Flag:** for real eigenstates the Bohm velocity is zero (the 1s electron does not orbit); m ≠ 0 states circulate with v_φ = m/(r sin θ).
- Alber & Zoller (1991), *Laser excitation of electronic wave packets in Rydberg atoms*, Phys. Rep. 199, 231; Maeda, Norum & Gallagher (2005), Science 307, 1757 — https://pubmed.ncbi.nlm.nih.gov/15705805/ — a 13–19 GHz microwave phase-locks a Li Rydberg electron (n ≈ 72) on a classical orbit; Larimian et al. (2017), Phys. Rev. A 96, 021403 — https://arxiv.org/abs/1612.02039 — two-colour fields localise Rydberg packets in one hemisphere (2π-periodic in relative phase). Stage numbers: T_cl = 2πn³ (n=6: 32.8 fs), T_rev = 4πn⁴/3 (n=6: 131 fs).

## 4. SO(4)/Runge–Lenz control; Stark/Zeeman steering

- Pauli (1926), Z. Phys. 36, 336; Fock (1935), Z. Phys. 98, 145; Bander & Itzykson (1966), *Group theory and the hydrogen atom*, Rev. Mod. Phys. 38, 330 — https://doi.org/10.1103/RevModPhys.38.330 — **J₁,₂ = (L ± A)/2**, two commuting spins j = (n−1)/2; the register's rotors.
- Gay, Delande & Bommier (1989), *Atomic quantum states with maximum localization on classical elliptical orbits*, Phys. Rev. A 39, 6587 — https://pubmed.ncbi.nlm.nih.gov/9901262/ — SO(4) coherent states = Kepler ellipses; produced by laser excitation in crossed E and B.
- Berglund & Uzer (2001), *The averaged dynamics of the hydrogen atom in crossed fields as a perturbed Kepler problem*, Found. Phys. 31, 283 (arXiv:nlin/0007018) — https://arxiv.org/abs/nlin/0007018 — first-order averaging: J₁,₂ precess about ω_L ẑ_B ± (3n/2)F ẑ_E with ω_L = B/2; linear Stark ΔE = (3/2)n(n₁−n₂)F. Kocbach & Waheed (2012), arXiv:1203.4768, give the drawing rules for Stark and elliptic states.
- Kruckenhauser, van Bijnen, Zache, Di Liberto & Zoller (2023), *High-dimensional SO(4)-symmetric Rydberg manifolds for quantum simulation*, Quantum Sci. Technol. 8, 015020 (arXiv:2206.01108) — https://arxiv.org/abs/2206.01108 — static E/B plus microwave/optical fields as SO(4) generators on an n-manifold; state prep, readout, gates near circular states.
- Hölzl et al. (2024), *Long-lived circular Rydberg qubits of alkaline-earth atoms in optical tweezers*, Phys. Rev. X 14, 021024 — https://link.aps.org/doi/10.1103/PhysRevX.14.021024 ; *Microscopic Rydberg electron orbit manipulation with optical tweezers*, Phys. Rev. Lett. (2025) — https://journals.aps.org/prl/abstract/10.1103/3tq7-ywf6 — circular states (m = n−1) steered and trapped; ms lifetimes reported (2.55 ms, arXiv:2510.27471). Stage: circular n=6 has ⟨r⟩ = n(n+½) = 39 a₀; the classical field-ionisation saddle is F_c = 1/(16n⁴) = 248 kV/cm.

## 5. Interactive / GPU visualisation (2024–2026)

- Ito (2026), *MOrbVis: browser-based molecular orbital visualization with WebGPU-accelerated on-the-fly evaluation*, ACS Omega 11, 36291 — https://github.com/Yasuaki-Ito/morbvis — Gaussian s–g shells evaluated in WGSL compute; >10⁶ grid points per orbital in <100 ms; a 260 KB Molden file replaces 1.2 GB of cubes (benzene 6-31G*, 96 orbitals, 100³). Needs Chrome/Edge 113+, Firefox 141+, Safari 18+.
- Hanson (2024), *Visualizing the hydrogen atomic orbitals*, J. Chem. Educ. 101, 3539 — https://pubs.acs.org/doi/10.1021/acs.jchemed.4c00547 — Python/Jupyter volumetric density GUI.
- *Virtual Hydrogen* (KES 2024, Procedia Comput. Sci. 2025) — https://www.sciencedirect.com/science/article/pii/S1877050925032491 — VR viewer from atomic to molecular orbitals.
- Evanescence (al2me6) — https://al2me6.github.io/evanescence/ — point-cloud real/complex/hybrid hydrogenic orbitals; Falstad, *Hydrogen Atom Orbital Viewer* — https://www.falstad.com/qmatom/ — phase-coloured time-dependent superpositions, the standard to beat.
- Rose et al. (2026), *Mol\* web molecular graphics engine*, Protein Sci. 35(4) — https://pmc.ncbi.nlm.nih.gov/articles/PMC13032908/ — WebGL direct-volume and marching-cubes; WebGPU only planned. Canonical: Stone et al. (2009), GPU MO evaluation in VMD — https://dl.acm.org/doi/10.1145/1513895.1513897.

## What the round should take from this

1. On a 30-Bohr stage the electric field of any n ≤ 6 hydrogenic state is quasi-static to ~1 part in 150 (kr ≤ 0.08 for Lyman-α); the wave zone starts at ~366 a₀ and is off-stage — draw E from Coulomb's law of ρ(r,t), never a wave.
2. The current density earns a separate picture: its Biot–Savart field is 6.3 T at 1 a₀ for one Bohr magneton (α²/2 a.u.), 0.23 mT at the stage edge.
3. The classical field of the Schrödinger charge density radiates |c₁|²|c₂|² ħωA — zero for a pure excited state — so label it "field of a coherent superposition", not spontaneous emission (QED: |c₂|² ħωA; A(2p→1s) = 6.27×10⁸ s⁻¹, 3.9×10⁶ beats per lifetime).
4. Hellmann–Feynman forces are exact only for exact or fully variational ψ; with LCAO/STO bases, add Pulay terms or report the discrepancy.
5. Ehrenfest is exact in the classical-nuclei limit (Nazarov 2026) and is the right H₂⁺/H₂ nuclear engine, but it cannot branch a packet across surfaces.
6. A central-field HFS atom needs only Slater exchange V_x = −3(3ρ/8π)^{1/3}, Numerov, and the Latter tail; validate against Herman–Skillman/dftatom, and prefer Clementi–Raimondi ζ over Slater's rules (C 2p: 3.136 vs 3.25).
7. LCAO beyond 1s is a solved ladder for H₂⁺: 1.76 → 2.35 (ζ = 1.239) → 2.73 eV (add 2p) → 2.79 eV exact, at R = 2.00 a₀; two-centre s-integrals are closed-form, higher l needs prolate-spheroidal auxiliaries.
8. "Orbital tomography" images |FT ψ|² of a Dyson orbital under a plane-wave final state (I ∝ |A·k|²|ψ̃(k)|²); a momentum-space view in the lab is the honest analogue.
9. Phase-space pictures: the hydrogen Wigner function is signed (negative lobes even for 1s) and Praxmeyer 2006 gives it for every bound state; Bohm velocity is zero for real eigenstates and v_φ = m/(r sin θ) for m ≠ 0.
10. Control lives in SO(4): J₁,₂ = (L ± A)/2 precess at ω_L ± (3n/2)F in crossed fields; elliptic (coherent) states are Kepler ellipses; the n = 6 register overflows the stage (⟨r⟩₆ₛ = 54 a₀, circular 39 a₀) and revives at 131 fs.

## Numbers to check

| Quantity | Value | Source |
|---|---|---|
| ⟨1s\|z\|2p₀⟩ | 2⁷√2/3⁵ = 0.7449 a₀ | standard; reproduces A below |
| A(2p→1s), τ | 6.27×10⁸ s⁻¹, 1.60 ns | Einstein A = (4/3)α³ω³\|d\|² (a.u.) |
| Lyman-α λ, period | 2297 a₀, 405 as (16.76 a.u.) | 10.2 eV |
| kr at 30 a₀ (Ly-α; n5→6) | 0.082; 1.3×10⁻³ | this digest |
| Light crossing 30 a₀ | 5.3 as (30α a.u.) | this digest |
| Wave-zone onset λ/2π | 366 a₀ (Ly-α) | this digest |
| Radiated power, equal 1s+2p superposition | \|d\|²ω⁴/3c³ = 1.42×10⁻⁹ a.u. = ħωA/4 | Crisp–Jaynes / Milonni |
| B of one μ_B at 1 a₀ (2p₊₁) | 6.26 T = α²/2 a.u.; 0.23 mT at 30 a₀ | Biot–Savart |
| Slater exchange | V_x = −3(3ρ/8π)^{1/3} | Slater 1951 |
| C 2p effective charge | 3.25 (Slater) vs 3.136 (CR, ζ=1.5679) | Slater 1930; Clementi–Raimondi 1963 |
| H₂⁺ D_e: 1s / ζ=1.239 / +2p / exact | 1.76 / 2.35 / 2.73 / 2.79 eV | Ruedenberg–Schmidt 2007; Dickinson 1933 |
| H₂ Heitler–London D_e, R_e | 3.14 eV, 0.87 Å (exp 4.75 eV, 0.741 Å) | Heitler–London 1927 |
| He Hylleraas 6-term | −2.90324 Ha (exact −2.903724) | Hylleraas 1929 |
| dftatom accuracy | 10⁻⁸ Ha (U) | Čertík et al. 2013 |
| Itatani harmonics | orders 17–51, 800 nm, N₂ 3σ_g | Itatani 2004 |
| POT rule | I(k) ∝ \|A·k\|²\|ψ̃(k)\|² | Puschnig 2009 |
| 3-D POT resolution | 1 Å slices, PTCDA/Ag(110) | Bennecke 2026 |
| Kepler period, revival (n=6) | 2πn³ = 32.8 fs; 4πn⁴/3 = 131 fs | Alber–Zoller 1991 |
| ⟨r⟩ 6s, circular 6h | 54 a₀; 39 a₀ | (3n²−l(l+1))/2 |
| Field-ionisation saddle n=6 | F_c = 1/(16n⁴) = 248 kV/cm | classical |
| Linear Stark, Larmor | ΔE = (3/2)n(n₁−n₂)F; ω_L = B/2 | Berglund–Uzer 2001 |
| Maeda microwave lock | 13–19 GHz ↔ n ≈ 72 (f = 1/2πn³) | Maeda 2005 |
| Circular-state lifetime | ~ms (2.55 ms reported) | Hölzl 2024; arXiv:2510.27471 |
| MOrbVis throughput | >10⁶ points/orbital in <100 ms; 260 KB vs 1.2 GB | Ito 2026 |
| WebGPU browser floor | Chrome/Edge 113+, Firefox 141+, Safari 18+ | Ito 2026 |
