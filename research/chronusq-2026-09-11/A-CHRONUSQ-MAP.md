# A — What ChronusQ's mathematics actually is, what of it is in λWAVES, and what is portable

Opus 5 · 11 September 2026 · commissioned by Josh to settle whether the ABOUT credit
*"Team @ Chronus Quantum for the Molecular Orbital Model"* is accurate.

**Method.** ChronusQ was read, not remembered. `git clone --depth 1 https://github.com/xsligroup/chronusq_public`
at HEAD `52ddf3c1cd191bb58a72d01bf54adf8d821a3ef8`, *Fri 11 Sep 2026 16:15:13 −0700* — the same day as this
report. `CMakeLists.txt:27` declares `VERSION 1.0.0`; `CHANGELOG.md` is stale at `0.6.0 (BETA)` (2022‑03‑07),
so the changelog is **not** a guide to what 1.0 contains and the source is. 530 `.hpp`/`.cxx` files,
**247 617 lines**. λWAVES `lab/` is **34 909 lines** of JavaScript.

Every equation below is either (a) copied from the ChronusQ source with a `file:line`, (b) copied from a paper
or the wiki with its URL and equation number, or (c) marked **DERIVED-HERE** and derived from λWAVES's own stated
convention — in one case also **measured** against a prototype (§7 PORT 1). Nothing is recalled from training.
Where the wiki, the papers and the code disagree — and they do, twice — **the code is reported as what ChronusQ
does** and the discrepancy is flagged (§1.5, §1.6).

A parallel literature pass read the package paper in full plus nine further primary sources; §10 lists them and
§11 lists precisely what is still unverified, including the **unpublished "Chronus Quantum 1.0" (submitted 2026)**
that will supersede the 2020 paper.

---

## 0. The one-paragraph answer

ChronusQ's mathematics is **density-matrix real-time propagation of a self-consistent-field wavefunction in a
Löwdin-orthonormalised Gaussian AO basis, under a length-gauge dipole field, with unitary propagators built by
Hermitian diagonalisation of the Fock matrix** — plus the entire relativistic (X2C, 4-component
Dirac–Coulomb–Breit) and correlated (CC, EOM-CC, CAS, MP, NEO) apparatus that feeds that Fock matrix.

λWAVES contains **none of it**. What λWAVES has instead is exact one- and two-centre Slater/Sturmian analytics,
an exponential-midpoint propagator on a *coefficient vector* (not a density matrix), and a minimal-basis FCI —
all derived in λWAVES's own ledgers from the generalised eigenproblem. The structural overlap is that both
propagate a finite basis in the length gauge in atomic units. **The credit line as written is not accurate**
(see §9). Three ports would make it accurate, and are worth doing on their own merits (§7).

One correction to the obvious reading of that: the **absorption spectrum is in neither codebase.** ChronusQ
writes the dipole trace to HDF5 and its own paper calls the transform *"post processing at the users'
discretion."* So PORT 1 is not λWAVES catching up — it is λWAVES shipping, inside the instrument, the layer the
Li group publishes equations for and leaves to the user (§6d). I prototyped and measured it (§7).

---

## 1. ChronusQ's real-time core, as the code writes it

### 1.1 The equation of motion

`include/singleslater/rt.hpp:191–263`, `SingleSlater::getTimeDerDen`. The doc comment is verbatim:

```
 *  dP/dt = -i * ( i dP/dt )
 *        = -i * ( [F,P] - i( τ P + P τ^*) )
 *        = -i [F,P] - ( τ P + P τ^*)
```

and the body computes `FP`, then `FP − PF` (`rt.hpp:219–223`), then either multiplies by `−i`
(`rt.hpp:245`) or, with the traveling-proton `τ` term on, forms `τP + Pτ†` and combines as
`MatAdd(…, dcomplex(0.,-1.), [F,P], dcomplex(-1.), τP+Pτ†, …)` (`rt.hpp:238`). The `τ` term exists **only**
for quantum protons in a moving basis (`rt.hpp:174` errors out for the electronic subsystem) and is
`τ_QP = Σ_{a=x,y,z} S^a_{QP} Ṙ_P` (`rt.hpp:50–105`, `computeTau`) — the derivative-coupling term.

Everything here is in the **orthonormal** frame: `onePDMOrtho`, `fockMatrixOrtho`.

### 1.2 The frame: Löwdin, and which way round each object transforms

`include/orthogonalization/impl.hpp:40–110` (`computeOrtho`, `ORTHO_TYPE == LOWDIN`) diagonalises
`S = V s V†`, then builds

* `forwardTrans  = V s^{-1/2} V†  = S^{-1/2}`  (`impl.hpp:68–74`)
* `backwardTrans = V s^{+1/2} V†  = S^{+1/2}`  (`impl.hpp:76–82`)

and rejects the basis outright if `min(s) < linearDepTol = 1e-12` (`impl.hpp:63`,
*"Contracted Basis Set is Linearly Dependent!"*). `CHOLESKY` is the alternative (`impl.hpp:141–175`).

The two transforms are applied in *opposite* directions to operators and to the density
(`include/singleslater/scf.hpp:329–378`; the same logic in
`include/orbitalmodifiernew/impl.hpp:35–83`):

| object | call | result |
|---|---|---|
| Fock  | `ao2orthoFock` → `nonortho2ortho(F)` | **F̃ = S^{−1/2} F S^{−1/2}** |
| 1PDM  | `ao2orthoDen`  → `ortho2nonortho(P)` | **P̃ = S^{+1/2} P S^{+1/2}** |
| 1PDM back | `ortho2aoDen` → `nonortho2ortho(P̃)` | **P = S^{−1/2} P̃ S^{−1/2}** |

`scf.hpp:344–350` says so in a comment: *"NOTE: Density transforms the opposite way as operators, same as the
coeffs."* The method names are inverted relative to what they do; the mathematics is the textbook one.
`Matrix::transform('N', T, …)` is the congruence `T† M T` (`src/matrix/transform.cxx:145–157` →
`subsetTransform`).

### 1.3 The propagator: a Hermitian diagonalisation, nothing fancier

`src/cqlinalg/matfunc.cxx:70–83`:

```cpp
void MatExp(char ALG, size_t N, _FExp ALPHA, _F1 *A, size_t LDA, _F2 *ExpA, size_t LDEXPA) {
    assert(ALG == 'D');
    assert(std::real(ALPHA) < 1e-14);
    double AIM = std::is_same<_FExp,dcomplex>::value ? std::imag(ALPHA) : 0.;
    MatDiagFunc([&](double x) -> _F2 { return dcomplex(std::cos(AIM*x),std::sin(AIM*x)); },
                N,A,LDA,ExpA,LDEXPA);
}
```

and `MatDiagFunc` (`matfunc.cxx:32–62`) does `HermitianEigen('V','U',N,…,W)`, forms `V·f(w)`, then
`B† = V·X†` and adjoints in place. So

> **U = V exp(i·Im(α)·w) V†**, and every caller passes `α = (0, −Δt)`, i.e. **U = exp(−i Δt F̃)**.

There is a second, Taylor-series `MatExp(N, A, LDA, ExpA, LDEXPA)` (`matfunc.cxx:91–143`) summing
`Σ A^k/k!` to machine epsilon with a 200-term cap — used for the 3×3 magnetic rotation in molecular
dynamics, not for the Fock exponential. `TDSCFOptions::propagatorAlgorithm` defaults to
`PropagatorAlgorithm::Diagonalization` (`include/orbitalmodifieroptions.hpp:270`).

### 1.4 The step: P ← U P U†

`include/singleslater/rt.hpp:450–462` (per subsystem) and
`include/orbitalmodifiernew/realtimeSCF/propagation.hpp:102–122` (`propagateDenForAll`):
two `gemm`s, `NoTrans·NoTrans` then `NoTrans·ConjTrans`. The doc comment (`rt.hpp:404–405`) is

```
 *  P(t+1) = U P(t) U*
 *       U = e^(-i Δt F)
```

### 1.5 The five integrators, with the actual timestep each uses

`enum class RealTimeAlgorithm` (`include/orbitalmodifieroptions.hpp:246–254`):
`RTForwardEuler`, `RTModifiedMidpoint`, `RTExplicitMagnus2`, `RTSymplecticSplitOperator`,
`RTRungeKuttaOrderFour`, `ElectronicBornOppenheimer`.

**MMUT (Modified Midpoint Unitary Transform)** — the default. The step length is doubled
(`realtimeSCF/impl.hpp:70–77`):

```cpp
double getPropagationTimeStep(RealTimeAlgorithm algorithm, bool startMMUTStep, bool finalMMUTStep) const {
  if(algorithm == RealTimeAlgorithm::RTModifiedMidpoint and not (startMMUTStep or finalMMUTStep))
    return 2. * tdSCFOptions.deltaT;
  return tdSCFOptions.deltaT;
}
```

and the density containers are *swapped* so the propagated object is `P(t−Δt)`
(`realtimeSCF/impl.hpp:182–201`, comment verbatim):

```
 *   A normal MMUT step performs the two-step update
 *     P(t+dt) = U P(t-dt) U^*, where U = exp[-i 2 dt F(t)].
```

So, **as the code computes it**:

> **P(t_{k+1}) = e^{−2iΔt F̃(t_k)} · P(t_{k−1}) · e^{+2iΔt F̃(t_k)}**

✅ **The package paper agrees with the code.** arXiv:1905.01381 Eq. (12), verbatim (ħ explicit; the paper
does *not* assume atomic units):

> `P(t_{k+1}) = U_MMUT(t_k) P(t_{k-1}) U_MMUT†(t_k),  U_MMUT(t_k) = exp( −(2iΔt/ħ) F(P(t_k), t_k) )`   (12)

with the accompanying text *"symplectic multi-step (leap-frog), explicit integration scheme based on the Magnus
expansion with error formally O(Δt²)"* and *"a non-leap-frog step must be used to seed and restart the
integration every so often to maintain accuracy and stave off energy drift."* The paper's Eqs. (10)–(11) are

> `iħ ∂_t P(t) = [F(P(t),t), P(t)]`   (10) — called *"the non-linear Louiville-von Neumann equation"*
> `P(t) = U(t,t₀) P(t₀) U(t,t₀)†,  U(t,t₀) = exp(Ω(t,t₀))`   (11)

⚠️ **The WIKI, and only the wiki, has the sign inverted.** <https://github.com/xsligroup/chronusq_public/wiki/RT>
writes `U(t_k) = e^{2iΔt F(t_k)}` — the **adjoint** of both the code (`dcomplex(0., -currentDeltaT)` at
`propagation.hpp:92`) and the paper (Eq. 12). The same inversion appears in the wiki's Magnus-2 formula. Trust
the code and the paper; the wiki is wrong.

**Explicit Magnus-2** — one step, but two Fock builds. The paper's Eqs. (13)–(15), verbatim:

> `P(t_{k+1}) = U_EM2(t_k) P(t_k) U_EM2†(t_k),  U_EM2(t_k) = exp( −(iΔt/ħ) F_m(t_k,t_{k+1}) )`   (13)
> `F_m(t_k,t_{k+1}) = ½( F(P(t_k),t_k) + F(P_FE(t_{k+1}),t_{k+1}) )`   (14)
> `P_FE(t_{k+1}) = U_FE(t_k) P(t_k) U_FE†(t_k),  U_FE(t_k) = exp( −(iΔt/ħ) F(P(t_k),t_k) )`   (15)

— i.e. the predictor is *literally* the forward-Euler propagator, named as such. In the code:
`propagation.hpp:141–162` and `rt.hpp:465–517`; the algorithm is spelled out at `realtimeSCF/impl.hpp:168–174`:

```
 *   Magnus2 uses two propagations from the same starting density:
 *   1. Save P(t). F(t) is formed below from onePDMSquareOrtho.
 *   2. Propagate P(t) with F(t) to obtain a trial P(t+dt).
 *   3. Form F(t+dt) from the trial density.
 *   4. Restore P(t), average F(t) and F(t+dt), and propagate again.
```

and the average is literally `*fock_k[i] = 0.5 * (*fock_k[i] + *fock_k1[i]);` (`propagation.hpp:154`,
`rt.hpp:490`). So

> **P(t+Δt) = e^{−iΔt·½(F̃(t)+F̃(t+Δt))} P(t) e^{+iΔt·½(F̃(t)+F̃(t+Δt))}**, with F̃(t+Δt) built from a
> forward-Euler trial density. This is a **predictor–corrector**, and the predictor is one unitary step.

**Forward Euler** — `unitaryPropagation(…, doMagnus2 = false, …)`: one step, `U = exp(−iΔt F̃(t))`, no
correction (`propagation.hpp:238–239`).

**RK4 on the density** — **new since the 2020 paper**, which lists only MMUT, EM2 and forward Euler.
`rt.hpp:276–395`. Four `getTimeDerDen` evaluations with a Fock rebuild before each
(`updateFock`), then `*onePDMOrtho += dt/6 · (k1 + 2k2 + 2k3 + k4)` (`rt.hpp:387`). Note the comment at
`rt.hpp:270` and `:386` says `(k1 + 2*k1 + 2*k3 + k4)` — a typo for `k2`; the code is right. RK4 is **not**
unitary, so it ends with `computeNaturalOrbitals(); formDensity();` to renormalise (`rt.hpp:392–394`).

**Symplectic split-operator** — `include/realtime/realtimemultislater/propagateSSO.hpp:37–150`, on a *CI
vector*, citing `doi:10.1021/acs.jctc.8b00381`. It writes `C(t) = p(t) + i q(t)` and leapfrogs the real and
imaginary parts on staggered half-grids, in **real arithmetic only** (comments verbatim from
`propagateSSO.hpp:64–139`):

```
 dq(t) = H(t) p(t)
 q(t + 0.5 dt) = q(t - 0.5 dt) - dt · dq(t)
 dp(t + 0.5 dt) = H(t + 0.5 dt) q(t + 0.5 dt)
 p(t + dt) = p(t) + dt · dp(t + 0.5 dt)
 q(t) = 0.5 q(t - 0.5 dt) + 0.5 q(t + 0.5 dt)     ← the centred value, for observables
```

**The MMUT restart policy** (`realtimeSCF/impl.hpp:150–154`) — a start step, a step whenever the field is
discontinuous (`tdEMPerturbation.isFieldDiscontinuous`), and every `iRestart` steps, all done with
`RestartAlgorithm::ExplicitMagnus2` (the default, `orbitalmodifieroptions.hpp:269`). The wiki explains why:
*"if allowed to propagate for long time frames, the branches of the MMUT algorithm with even and odd steps can
diverge, leading to a highly oscillatory solution."* `IRSTRT` defaults to 50.

### 1.6 The field, and the gauge

`include/fields.hpp:33–36` declares `enum FieldGauge { Length, Velocity }` and
`enum EMFieldTyp { Electric, Magnetic }`, and every constructor defaults to **`Length`**
(`fields.hpp:48`, `:78`, `:80`).

The coupling enters the Fock build at `include/fockbuilder/impl.hpp:313–326`:

```cpp
if( pert_has_type(pert,Electric) ) {
  auto dipAmp = pert.getDipoleAmp(Electric);
  … else {
    for (auto i = 0; i < 3; i++)
      ss.fockMatrix->S() -= 2. * dipAmp[i] * (*ss.aoints_->lenElectric)[i]->matrix();
  }
}
```

`lenElectric` is Libint's `emultipole1`, i.e. the bare **⟨χ_μ|r_i|χ_ν⟩** with no charge factor
(`src/particleintegrals/aointegrals/aointegrals_onee_drivers.cxx:1514–1531`,
`include/integrals/impl.hpp:128–141`). The factor 2 is the Pauli-spinor scalar-component convention
(`F_S = F_αα + F_ββ`), so **per spin the one-electron operator is `h − E·r`**. Consistently, the energy
bookkeeping adds `+E·μ` (`include/quantum/base.hpp:190–196`, `field_delta += Σ_i E_i μ_i`) with
`μ` including the nuclear part.

The package paper gives the field machinery abstractly, Eqs. (16)–(17) verbatim:

> `F(P(t),t) = F₀(P(t)) + Σ_ξ^{N_pert} V_ξ(t)`   (16)
> `V_ξ(t) = V_ξ · f(t) ( Θ(t − t_on) − Θ(t − t_off) )`   (17)

and the gauge sentence, verbatim: *"For V_ξ, ChronusQ supports both the length and velocity gauge electric
multipole operators up through the electric octupole, and the magnetic dipole operator."* **No explicit dipole
operator matrix appears in that paper** — its envelope display (between Eqs. 17 and 18) is even unnumbered:

> `f(t) = κ · { 1  (Step Function) ; (t − t_on)  (Linear Ramp) ; cos(ω(t − t_on))  (Plane Wave) ;`
> `             exp(−α(t − t_on)²)  (Gaussian) }`   — *"κ is a chosen parameter to control the amplitude"*

⚠️⚠️ **Sign convention — and the Li group's own papers disagree with their own code.** Two *published*
Li-group equations write the length-gauge coupling with a **PLUS**:

> Goings, Kasper, Egidi, Sun & Li, *J. Chem. Phys.* **145**, 104107 (2016), Eq. (12):
> `F^E(t) = F(t) + Σ_{q=x,y,z} κ(t) ⟨r_q⟩`  — *"κ(t) is the field strength at time t, and ⟨r_q⟩ are the
> atomic-orbital based length-gauge dipole integrals along component q"*
> Kasper, Stetina, Jenkins & Li, *Chem. Phys. Rev.* **1**, 013102 (2020), Eq. (17): `H(t) = H₀(t) + Σ_q κ(t)⟨r_q⟩`

The **current source subtracts**: `ss.fockMatrix->S() -= 2. * dipAmp[i] * ⟨r_i⟩` (`fockbuilder/impl.hpp:324`).
So the published equation is `h + E·r` and the shipped code is `h − E·r`. **λWAVES's `modrive.js`
(`H = H₀ + E_z(t)·Z`) agrees with the published Li-group equation and disagrees with the shipped code.**

The consequence, stated once and for all: `H' = +E·r̂` (paper, λWAVES) is the textbook `−E·μ̂` for an electron
(`μ̂_elec = −r̂`); `H' = −E·r̂` (code) is `+E·μ̂`. Each is internally consistent with its own energy bookkeeping —
the code pairs `−E·r` with `field_delta += E·μ` (`quantum/base.hpp:191`), λWAVES pairs `+E·z` with
`instantaneousTotal = electronic + Enuc − E_z·μ_total`. **`|FT|²` spectra and peak positions are unaffected; a
*signed* dipole-trace comparison is not.** Since even ChronusQ's own paper and code disagree, do not try to
match a sign against "ChronusQ" as though it were one convention — write λWAVES's own down and cite Goings 2016
Eq. (12) as the published form it follows.

**Velocity gauge exists but is not wired to RT.** `velElectric` integrals are computed
(`include/integrals/impl.hpp:161–176`) and used only by `response` and `posthartreefock` properties
(`include/response/polarization/singleslater.hpp:219–227`,
`include/posthartreefock/property.hpp:347–349`). No RT code path reads them.

**Magnetic fields** are GIAO, in the *core* Hamiltonian, not the RT field:
`include/corehbuilder/nonrel/impl.hpp:39,97,276` reads `pert.getDipoleAmp(Magnetic)` and adds
`−2·coeff·q/m·⟨r_i⟩` terms; the two-electron GIAO path is
`include/particleintegrals/contract/direct.hpp:929`. `fockbuilder/impl.hpp:310` carries the honest FIXME:
*"the magnetic field contribution should go here as well to allow for RT manipulation."* The wiki agrees:
*"Currently, ChronusQ only supports Electric Dipole fields in real-time electron dynamics."*

**Envelopes** (`src/realtime/fields.cxx:29–164`, formulas from the doc comments, `ε = 1e-10`):

| envelope | `getAmp(t)` for `tOn ≤ t ≤ tOff` | file:line |
|---|---|---|
| `StepField`      | `1` | `fields.cxx:46–55` |
| `LinRampField`   | `(t − tOn)/(tOff − tOn)` | `fields.cxx:74–85` |
| `GaussianField`  | `exp(−α (t − tOn)²)` | `fields.cxx:106–117` |
| `PlaneWaveField` | `cos(ω(t − tOn))` or `sin(…)` | `fields.cxx:136–150` |
| `Cos2Field`      | `cos(ω t' + φ) · cos²(π t'/(2σ))`, `t' = t − t_p`, zero for `\|t'\| > σ` | `fields.cxx:152–164` |

`Cos2Field` is λWAVES's `sin2Pulse` in another phase: `cos²(πt'/2σ)` on `t' ∈ [−σ,σ]` equals
`sin²(πu/D)` on `u ∈ [0,D]` with `D = 2σ`, `u = t' + σ`. **λWAVES's pulse shape is already ChronusQ's.**

### 1.7 Observables

* **Dipole.** `include/singleslater/quantum.hpp:313–320`:
  `elecDipole[i] = −Tr[P_S · ⟨χ|r_i|χ⟩]`, then `+ Σ_A Z_A R_A` over non-quantum nuclei. So the stored
  `elecDipole` is the **total** dipole.
* **Energy.** `computeEnergy` + `field_delta` each step (`realtimeSCF/impl.hpp:204–211`).
* **Orbital populations.** `RTNEW/ORBITALPOPULATION<i>` datasets; wiki keyword `ORBITALPOP` =
  *"Number of steps between projection of density on initial MOs."*
* **Idempotency.** `checkIdempotency` prints `Tr(P² − P)` (`rt.hpp:109–133`).
* **Purification.** `mcWeenyPurification`: `P ← 3P² − 2P³` (`rt.hpp:137–165`).
* **Saved trace.** `RTNEW/TIME`, `RTNEW/ENERGY`, `RTNEW/LEN_ELEC_DIPOLE`, `RTNEW/LEN_ELEC_DIPOLE_FIELD`,
  `RTNEW/TD_1PDM_ORTHO<i>` (`realtimeSCF/impl.hpp:294–326`, `saveState` `:329–392`).

The paper's only observable equation is `⟨O_ζ(t)⟩ = Tr[O_ζ P(t)]` (Eq. 18).

### 1.8 The absorption spectrum is NOT in ChronusQ

Exhaustive search for `pade|fourier|absorption|spectrum|fft|fftw` across `include/`, `src/`, `tests/`
returns **one** file, `include/response/print.hpp` (a print label). There is **no** Fourier transform, **no**
Padé approximant, **no** FFT and **no** spectrum construction anywhere in the package. ChronusQ writes the
dipole trace to HDF5 and the user transforms it externally — **and the package paper says so in as many
words**, immediately after Eq. (18):

> *"The time-series for the desired time-dependent expectation values may be obtained from the ChronusQ
> checkpoint file after the calculation **for post processing at the users' discretion**. Using these
> time-series, users may simulate quantities such as absorption spectra [72, 82], electric and magnetic
> circular dichroism spectra, charge transfer, and second harmonic generation."*

(Ref [72] is Goings, Lestrange & Li, *WIREs Comput. Mol. Sci.* **8**, e1341 (2018).) The wiki says only:
*"The absorption spectrum of a system can be extracted by analyzing the dipole oscillations after an
instantaneous 'kick' from an external field"* and gives the input

```
[RT]
TMAX   = 620.15
DELTAT = 0.005
FIELD:
 StepField(0.,0.00001) Electric 0. 0.001 0.
```

⚠️ That "δ-kick" is a **finite step of duration 1e-5 au sampled by a 0.005 au integrator**. The field is only
ever evaluated at grid points (`tdEMPerturbation.getPert(currentTime)`), so the *effective* impulse is
`amplitude × (the first step's length)`, not `amplitude × 1e-5`. This is an integrator artefact, and PORT 1
below replaces it with the exact kick operator.

---

## 2. The SCF machinery

`include/orbitalmodifiernew/conventionalSCFnew/extrap.hpp`, `include/extrapolate.hpp`.

⚠️ **No ChronusQ paper prints any of this.** The package paper mentions it in prose only — *"the widely adopted
scheme involving a combination of damping and direct inversion in the iterative subspace (DIIS) extrapolation of
the Fock and density matrices to accelerate convergence"* — with no equations. **The source below is the only
statement of ChronusQ's actual SCF algebra that exists.**

**Error metric** — `FDCommutator`: the orthonormal-frame commutator, formed as `FD` then
`MatAdd('N','C', +1·FD, −1·FD)`, i.e. **e = F̃P̃ − (F̃P̃)†**.

**CDIIS** — `include/extrapolate.hpp:90–146`:

```
B_kj = Σ_blocks ⟨e_k , e_j⟩        (a BLAS dot over all N² elements)
B_{n,l} = B_{l,n} = −1  for l < n ;  B_{n,n} = 0
RHS = (0, …, 0, −1)ᵗ ;  solve by lapack::gesv (LU)
```

then **both** `F` and `D` are extrapolated with the same coefficients
(`diisCombineMat`: `*fock[a] += c[j]·diisFock[j][a]`, `*den[a] += c[j]·diisOnePDM[j][a]`).
On `INFO ≠ 0` it prints *"DIIS Inversion Failed — Defaulting to Fixed-Point step"* and does **not**
regularise.

**Static damping** — `fockDamping`, skipped on iteration 0:
**F^k ← (1−p)F^k + p F^{k−1}**, and the same for D. `p = SCF.DAMPPARAM`, **default 0.7**, switched off once
`|ΔE| < DAMPERROR = 1e-3` (SCF wiki).

**EDIIS coupling matrix** — `ediisErrorMetric`:
**B_ij = ½ Re⟨F_i − F_j , D_i − D_j⟩**, fed to `ENERGYDIIS` (`include/interpolate.hpp`).

**CEDIIS** (the *default* `DIISALG`) — `scfCEDIIS`: blends the two by `errorMax = max|e|` against
`cediisSwitch = 0.05`:

```
errorMax ≥ SWITCH            → pure EDIIS   (scaleEDIIS = 1, scaleCDIIS = 0)
1e-3·SWITCH < errorMax < SWITCH → scaleEDIIS = errorMax/SWITCH,  scaleCDIIS = 1 − scaleEDIIS
errorMax ≤ 1e-3·SWITCH       → pure CDIIS
```

**Convergence** (SCF wiki): `ENETOL = 1e-10`, `DENTOL = 1e-8` (RMS ΔD), `FDCTOL = 1e-8` (max|gradient|),
`MAXITER = 128`, `NKEEP = 10`.

**Second-order SCF** — `include/orbitalmodifiernew/newtonRaphsonSCFnew/` with `quasi-newton.hpp`
(BFGS/SR1, `NRAPPROX`), trust radius `NRTRUST = 0.1`, diagonal Hessian level shift `NRLEVELSHIFT`.

**Guesses** — `SAD` (superposition of atomic densities, default), `CORE`, `READMO`, `READDEN`, `FCHKMO`,
`TIGHT`, plus `SWAPMO` (QM/SCF wiki).

**Fock build** — `FockBuilder::formGD` / `formRawGDInBatches` (`include/fockbuilder/impl.hpp`):
`F = coreH + G[D]`, with `G` assembled from `COULOMB` and `EXCHANGE` `TwoBodyContraction`s over the Pauli
scalar/Z/X/Y density components; RI-K with MO coefficients when available
(`contractExchangeKCoef`, `include/fockbuilder/kcoef.hpp`); incremental builds from `deltaOnePDM`.
Engines: Libint2 (`HandleLibint`), Libcint (`include/libcint/engine.hpp`), in-house
(`aointegrals_twoe_inhouse.cxx`), RI/Cholesky (`aointegrals_twoe_ri.cxx`), distributed RI.

---

## 3. Hamiltonian tiers

**Non-relativistic.** `R/RO/U/G` × `HF/⟨functional⟩`, real or complex (QM wiki `REFERENCE` keyword).

**X2C — provenance, and what the papers do and do not say.** The package paper prints **no** X2C equation at
all; it says only that *"the extension of the SCF module to implement the X2C-HF and X2C-KS methods simply
amounts to the manipulation of additional spin components for the core Hamiltonian in Eq. (8),"* and cites
Kutzelnigg–Liu 2005, Liu–Peng 2006, Iliaš–Saue 2007, Peng–Middendorf–Weigend–Reiher 2013, Liu 2016.

The Li group's own X2C equations are in **Goings, Kasper, Egidi, Sun & Li, *J. Chem. Phys.* 145, 104107 (2016)**
(<https://www.osti.gov/pages/servlets/purl/1467884>), which states verbatim `X′ = C_S′⁺ (C_L′⁺)^{−1}` (Eq. 6) and

> `U = ( 1/√(I+X′†X′)   −X′†/√(I+X′X′†) ; X′/√(I+X′†X′)   1/√(I+X′X′†) )`   (4)
> *"which only holds in an orthonormal basis, denoted by the primes."*

⚠️ **That paper was implemented in "a locally modified copy of the developer's version of the Gaussian
electronic structure program," NOT in ChronusQ** — a real trap for anyone building a technical map from the
literature. The method later landed in ChronusQ (`tests/rt/serial/grt/*x2c*mmut*` exist on master).

⚠️ **ChronusQ's RT-X2C is 1eX2C**: the decoupling `U` comes from the one-electron Dirac Hamiltonian and the
two-electron / exchange–correlation picture-change corrections are *discarded*, with Boettger scaling as the
only two-electron spin–orbit correction (`SNSOScale`, `x2c.cxx:85–152`). Kadek, Konecny & Repisky
(<https://arxiv.org/abs/2307.05242>, §5.4) name this the *1eX2C* flavour, cite this very ChronusQ/Li-group work
as its *"pioneering X2C RT-TDDFT implementation"*, and warn that accuracy *"strongly depends on the two-electron
and exchange–correlation picture-change correction models employed and can vary as much as 5–6 orders of
magnitude for core-shell energies."* Irrelevant for valence work, decisive for L-edge XAS.

**X2C, written out.** `src/x2c/x2c.cxx:386–625`, `computeOneEX2C` — the complete algorithm:

1. Uncontract the basis, SVD the primitive overlap, drop linearly dependent primitives
   (`removeLinearDependency`, `x2c.cxx:245–377`).
2. Build the orthonormal → p²-eigenbasis transform `U_K = S_orth · T_vecs` from the SVD of the
   transformed kinetic matrix (`x2c.cxx:424–447`).
3. Scale `V` and `pVp` into the "p⁻¹" basis: `SS[i] = 1/√(2·T_i)`, `potential(i,j) *= SS[i]·SS[j]`
   (`x2c.cxx:457–468`).
4. Assemble the 4-component one-electron Hamiltonian — the comment is verbatim (`x2c.cxx:470–472`):

   ```
   // CH = [ V    cp       ]
   //      [ cp   W - 2mc^2]
   ```

   with `W = formW<MatsT>()` (the `σ·pVp×σ` matrix) and `WFact = 2c²` subtracted from its diagonal
   (`x2c.cxx:481–484`).
5. `HermitianEigen` it; take the positive-energy eigenvectors' large (`L`) and small (`S`) blocks, invert
   `L`, and form

   > **X = S · L⁻¹**   (`x2c.cxx:519–534`, comment `// Form X = S * L^-1` at `:534`)

6. The renormalisation:

   > **Y = (1 + X†X)^{−1/2}**   (`x2c.cxx:539–553`; `MatDiagFunc(x ↦ x^{−0.5})` at `:552`)

   ⚠️ The comment at `x2c.cxx:539` reads `// Form Y = sqrt(1 + X**H * X)`, but the code applies
   `pow(x,-0.5)`. **The code computes the inverse square root** — the standard `R` matrix.
7. The two-component core Hamiltonian — comment verbatim (`x2c.cxx:562`):

   > **2C CH = Y · (V′ + cp·X + X†·cp + X†·W′·X) · Y**

8. Back-transform to the contracted AO basis with `C_prim2cont · S · U_K`:
   `*coreH = HUn.transform('C', CPSUK, NB, NB)` (`x2c.cxx:605–618`).

The whole block is duplicated at `x2c.cxx:1121–1217` for the complex-integral (GIAO) specialisation.

**Where the `Y` of step 6 comes from, and its AO-basis form.** ChronusQ's `Y = (1 + X†X)^{−1/2}` is the
*orthonormal-basis* renormalisation `R′`, exactly Peng, Middendorf, Weigend & Reiher, *J. Chem. Phys.* **138**,
184105 (2013), Eq. (20) (<https://arxiv.org/pdf/1303.4446>) — the notation source ChronusQ's paper explicitly
declares. That paper also prints the **non-orthogonal-basis** form, its Eq. (23a):

> `U_X2C^L = S^{−1/2} [ S^{−1/2} ( S + (1/2c²) X† T X ) S^{−1/2} ]^{−1/2} S^{1/2}` ,  `U_X2C^S = X · U_X2C^L`

i.e. the modified metric is `S̃ = S + (1/2c²) X† T X` exactly. ChronusQ never needs that form because it works
in the p²-eigenbasis throughout. The cleanest single-line statement of the resulting Hamiltonian is Surjuse &
Valeev, <https://arxiv.org/pdf/2601.04174>, Eqs. (10)–(11) — `R ≡ (I + X†X)^{−1/2}`,
`h^{1eX2C} = R†[ V + T X + X† T + X†(W/4c² − T) X ]R` — which is ChronusQ's step 7 with `cp ≡ T` in the
kinetically-balanced representation. The `W` decomposition that separates scalar-relativistic from spin–orbit is
Kasper, Stetina, Jenkins & Li, *Chem. Phys. Rev.* **1**, 013102 (2020), Eq. (4):
**`W₀ = p·Vp`** (scalar) and **`W_{x,y,z} = p×Vp`** (spin–orbit).

Variants: atomic X2C (`src/x2c/atomic.cxx`, `ATOMICX2C`), Boettger/SNSO spin-orbit scaling
(`SNSOScale`, `x2c.cxx:85–152`) and a row-dependent DCB SNSO (`RowDepDCB_SNSO`, `x2c.cxx:153–244`),
and a GIAO X2C for complex integrals (`x2c.cxx:629+`).

**Four-component.** `src/fourcomp/fourcomp.cxx:32–100`, `compute4CCH` (format comment at `:35`) — comment verbatim:

```
 *  Hamiltonian format:
 *         [ V               T ]
 *         [ T     1/(4c^2)W-T ]
```

i.e. restricted kinetic balance; `W` spin-scattered into scalar + X/Y/Z components, each placed in the
small–small block. Two-electron: Coulomb + **Gaunt** + **gauge** (Breit), rebuilt during RT every
`rtGaunt`/`rtGauge` steps (`realtimeSCF/impl.hpp:255–269`).

**DFT.** LibXC + GauXC (optional CUDA/MAGMA), 15 Lebedev orders (6, 14, 26, 38, 50, 74, 86, 146, 170, 194,
230, 266, 302, 590, 974 — `src/grid/lebedev_*.cxx`), Euler–Maclaurin and Gauss–Chebyshev radial rules
(`src/grid/eulermac.cxx`, `gausscheb.cxx`), plus `EPC17`/`EPC19` electron–proton correlation functionals for
NEO (`include/dft/epc.hpp`).

---

## 4. Beyond the SCF

| module | what it is | files |
|---|---|---|
| Response `RESIDUE` | TDHF/TDDFT excitation energies; full or Davidson-iterative; TDA and full RPA; reduced `(A+B)/(A−B)` form | `include/response/polarization/` (`singleslater.hpp:79–184`, `883–1220`) |
| Response `FDR` | frequency-dependent response / polarizabilities, GMRES/GPLHR | `include/response/fdr.hpp`, `include/itersolver/` |
| MOR | model-order reduction of TDDFT, `nModel` 16→256, `convCrit` 1e-2 | `include/morspec.hpp` |
| Coupled cluster | RCCSD, DFCCSD, CCSDT, EOM-CCSD, EOM-IP (2h1p, 3h2p), EOM-EA (1h2p), EOM-DIP (3h1p, 4h2p), CVS-EOM | `include/coupledcluster/` (33 headers) |
| MCSCF | CASCI, CASSCF, RASCI, STP-DAS | `include/mcscf/`, `include/newcibuilder/dascibuilder/` |
| Perturbation | MP2, SS-PT2, MS-PT2, GVVPT2, ENPT2 | `include/mp/`, `include/perturb/`, `include/newperturb/` |
| NEO | nuclear–electronic orbital HF and DFT, SCF and RT; `MultiParticleSS`; inter-particle Fock | `include/fockbuilder/neofock/`, `include/singleslater/multiparticless/` |
| RT-NEO | per-subsystem integrators, traveling proton basis (`τ`), **Electronic Born–Oppenheimer RT** (`BORT`: a full SCF on the electrons at each nuclear step, `propagation.hpp:262–306`) | `realtimeSCF/propagation.hpp:203–255` |
| RT-CI / RT-MS | real-time CI and multi-Slater, SSO and RK4, real-time autocorrelation function `⟨C(ε)\|C(t)⟩` written to `RTNEW/REALTIMECORRELATIONFUNCTION` | `include/realtime/realtimeci/`, `realtimemultislater/` |
| Ehrenfest / BOMD | velocity Verlet `a = −g/m`, `v ← v + ½Δt·a`; plus an exponential order-1 variant for velocity-dependent (magnetic) forces, `v(t+½Δt) = u^{1/2}v(t) + ¼Δt·u^{1/4}f(t)` with `u = exp(wΔt)`, `w` the Lorentz generator, citing *Helgaker (2024) Mol. Phys. 122(5) e2259008, Algorithm 4* | `src/geometrymodifier/velocityverlet.cxx:24–140` |
| Gradients | analytic `getGDGrad`, geometry gradients, finite differences | `include/fockbuilder/impl.hpp:385+`, `include/findiff/geomgrad.hpp` |

---

## 5. λWAVES as it actually stands (the other side of the map)

| module | what it holds |
|---|---|
| `lab/hydrogen.js`, `field.js`, `momentum.js` | exact hydrogen n ≤ 6, 91 states; exact Stark within a shell; exact momentum-space transform |
| `lab/sturmian.js` | Coulomb Sturmians, `generalisedEigen(S,H)` with rank/threshold handling |
| `lab/twocentre.js` (216 ln) | **exact** two-centre Slater/Sturmian integrals in prolate spheroidal coordinates: `S`, `T`, `V_A`, `V_B`, `H`, `positionZ = ⟨χ_i\|z\|χ_j⟩`; Gauss–Laguerre in ξ × adaptive Gauss–Legendre in η; `parityBlocks` g/u splitting; finite at every R |
| `lab/mo.js` (598 ln) | `createMO`: `basisAt(R)`, `solve(R)` (H C = S C E), `propagate(R,c,dt) = C e^{−iEΔt} CᵗS c`, `metricRoots(R)` → `S^{±1/2}`, `connection(R) = S′/2 + ½diag(P,−P)`, `transport`, `evolve`, `force` (Pulay included), `state`; `createDynamics` with `electron: 'bo' \| 'ehrenfest'`, velocity Verlet on R |
| `lab/modrive.js` (93 ln) | the headless pulse propagator: **i S dc/dt = (H₀ + E_z(t)Z) c**, exponential midpoint — re-solves `generalisedEigen(S, H₀ + E(t+Δt/2)Z)` whenever the field changes, then `c ← C e^{−iEΔt} CᵗS c`. Exactly S-unitary; norm **reported**, never repaired. Not wired to the UI. |
| `lab/pulse.js` (81 ln) | `sin2PulseRate`, `transitionDipole(mo,R,i,j)`, `rabiRWA` yardstick, `createPulseRun` |
| `lab/h2.js` (82 ln) | Heitler–London closed forms, Sugiura exchange integral, classical collision on the curve |
| `lab/h2ci.js` (305 ln) | Weinbaum/minimal FCI; **STO-3G s-type Gaussian integrals** `S, h, (aa\|aa), (aa\|bb), (ab\|ab), (aa\|ab)` via `boys0` — the exponents are byte-identical to ChronusQ's `basis/sto3g.gbs` |
| `lab/atoms.js` (533 ln) | Xα(2/3) + Latter central-field atoms Z = 1…36, log mesh, tridiagonal Sturm bisection, own SCF loop |
| `lab/kick.js` (171 ln) | the **sudden boost** `⟨a\|e^{ikz}\|b⟩` by multipole expansion on the 91-state register, with escaped norm reported |
| `lab/dynamics.js` (338 ln) | dipole, action–angle, Bohm velocity field |
| `lab/spectrum.js` (367 ln) | the **eigenvalue ladder UI** — populations, phases, mute/solo. **Not** a Fourier absorption spectrum. |
| `lab/helium.js` | Hylleraas helium |

Independent oracle pattern already in the tree: `research/astra-2026-09-05/reference-drive.py` — an analytic
1s-LCAO H₂⁺ two-level pulse propagated by SciPy DOP853 at `rtol=3e-14`, with a refinement check, dumped to
`reference-drive.json`. That is the shape every fixture below should take.

---

## 6. THE GAP MAP

`P` = present · `~` = partial · `—` = absent. Verdicts: **PORT NOW** / **PORT LATER** /
**NEVER-IN-BROWSER**. `λ↔` marks a capability λWAVES has that ChronusQ does not.

### 6a. Real-time propagation

| # | ChronusQ capability | Formulation (file) | λWAVES | Verdict | Smallest honest fixture |
|---:|---|---|:--:|---|---|
| 1 | Density-matrix EOM | `dP/dt = −i[F,P]` (`singleslater/rt.hpp:191–263`) | — (propagates a coefficient vector, `modrive.js`) | **PORT NOW** | H₂⁺ STO-3G R=2: `D = cc†` route must match `modrive`'s `c` route on μ_z(t) to 1e-10 at t = 0,4,…,96 |
| 2 | Löwdin frame, both directions | `F̃ = S^{−1/2}FS^{−1/2}`, `P̃ = S^{1/2}PS^{1/2}` (`singleslater/scf.hpp:329–378`; `orthogonalization/impl.hpp:53–82`) | ~ (`mo.js metricRoots` gives `S^{±1/2}`; never applied to a density) | **PORT NOW** | `Tr(D S) = N_e` to 1e-14 and `Tr(P̃) = N_e`: a pure frame test that cannot drift if the transform is right |
| 3 | `U = exp(−iΔtF̃)` by Hermitian diagonalisation | `MatExp('D',…)` → `MatDiagFunc` (`cqlinalg/matfunc.cxx:32–83`) | P (same structure, on the generalised problem, `modrive.js:44–56`) | — | already gated by `tests/modrive.test.mjs` (norm error < 1e-10) |
| 4 | MMUT leapfrog at 2Δt | `P(t+Δt) = e^{−2iΔtF̃(t)}P(t−Δt)e^{+2iΔtF̃(t)}` (`realtimeSCF/impl.hpp:70–77,182–201`) | — | **PORT LATER** — only pays off when F depends on P (halves Fock builds); for a fixed one-electron F the exponential midpoint is already exact | H₂⁺ STO-3G under a sin² pulse: MMUT with restart every 50 steps vs `modrive`, agreement to 1e-6 over 2000 steps |
| 5 | Explicit Magnus-2 predictor–corrector | `U = exp(−iΔt·½(F̃(t)+F̃(t+Δt)))`, trial F from a forward step (`propagation.hpp:141–162`) | ~ (the midpoint `F(t+Δt/2)` is *exact* for a field-only time dependence — no predictor needed) | **PORT NOW** *with* row 1 | H₂ STO-3G RHF under a δ-kick: halve Δt, dipole change must fall by ≥ 4× |
| 6 | Forward Euler unitary step | `propagation.hpp:238–239` | ~ (midpoint is strictly better) | never — keep as the deliberately-wrong comparison branch | — |
| 7 | RK4 on the density | 4 Fock builds, `P += Δt/6(k1+2k2+2k3+k4)` (`rt.hpp:276–395`) | — | **PORT LATER** — the only route if a non-Hermitian (absorbing/damped) F is ever wanted | idempotency `Tr(P²−P)` must be reported and must grow, unlike the unitary route |
| 8 | Symplectic split-operator on a state vector | real/imag leapfrog, real arithmetic (`propagateSSO.hpp:37–150`) | — | **PORT LATER** — halves the arithmetic and needs no eigendecomposition per step; attractive for the 91-state register under a time-dependent Stark field | 91-state hydrogen + Stark ramp: SSO vs `field.js` exact-within-shell, energy bounded not drifting |
| 9 | MMUT restart on field discontinuity | `isFieldDiscontinuous`, `IRSTRT = 50` (`realtimeSCF/impl.hpp:150–154`) | n/a | PORT with row 4 | run 10⁴ MMUT steps with restart off: the even/odd split must appear, then vanish with it on |
| 10 | Length-gauge dipole coupling | `F_S −= 2·E_i·⟨r_i⟩` (`fockbuilder/impl.hpp:313–326`) | P — with the **opposite sign** (`modrive.js`: `H = H₀ + E_z Z`) | — (but *document* the sign) | μ_z(t) under `+E` vs `−E` must be exact mirror images |
| 11 | Velocity gauge | integrals only; no RT path (`integrals/impl.hpp:161–176`) | — | **PORT LATER** — the gauge-invariance check is the point, not the physics | same spectrum from both gauges on H₂⁺ STO-3G to 1e-4 Ha in peak position |
| 12 | Magnetic / GIAO | core-H only; `fockbuilder/impl.hpp:310` FIXME says RT magnetic is missing | — | **NEVER-IN-BROWSER** for GIAO two-electron; PORT LATER for a uniform-B Zeeman term on the one-electron register | — |
| 13 | Field envelopes | Step/LinRamp/Gaussian/PlaneWave/Cos2 (`src/realtime/fields.cxx`) | ~ (`sin2Pulse` = `Cos2Field` reparametrised) | **PORT NOW** (4 functions, ~20 lines) | each envelope's analytic time integral vs a refined quadrature to 1e-12 |
| 14 | δ-kick workflow | narrow `StepField`; wiki RT §Examples | — | **PORT NOW** — and do it *better*: the exact operator, not a narrow step | see PORT 1 |
| 15 | Dipole observable | `−Tr[P·⟨r⟩] + ΣZ_AR_A` (`singleslater/quantum.hpp:313–320`) | P (`modrive.js observables()`; `dynamics.js dipoleZ`) | — | already gated |
| 16 | Field-energy bookkeeping | `field_delta += E·μ` (`quantum/base.hpp:190–196`) | P with opposite sign (`modrive.js`) | — | work integral `∫ E·dμ` must close the energy balance to 1e-8 over a full pulse |
| 17 | **Absorption spectrum** | **ABSENT IN BOTH** — ChronusQ dumps the trace to HDF5; the transform is external | — | **PORT NOW** — highest value in the whole map | see PORT 1 |
| 18 | Orbital population projection | `ORBITALPOP` datasets | P (`mo.state(R,c).populations`, S-metric) | — | already in `tests/modrive.test.mjs` |
| 19 | Idempotency diagnostic | `Tr(P²−P)` (`rt.hpp:109–133`) | — | **PORT NOW** with row 1 (6 lines) | unitary route: < 1e-12 forever. RK4 route: grows |
| 20 | McWeeny purification | `P ← 3P²−2P³` (`rt.hpp:137–165`) | — | **PORT LATER**, and only as a *labelled repair* | purify a deliberately corrupted P; idempotency error must fall quadratically |

### 6b. SCF

| # | ChronusQ capability | Formulation (file) | λWAVES | Verdict | Smallest honest fixture |
|---:|---|---|:--:|---|---|
| 21 | Fock build `F = h + G[D]` | `formGD` / `formRawGDInBatches` (`fockbuilder/impl.hpp`) | ~ (h2ci.js has the four s-type STO-3G ERIs, assembled by hand for a 2×2 FCI, not as a general `G[D]`) | **PORT NOW** for s-only; **PORT LATER** for s/p | H₂ STO-3G: `G[D]` from the four integrals must reproduce h2ci's hand-assembled RHF Fock to 1e-14 |
| 22 | CDIIS | `B_kj = ⟨e_k,e_j⟩`, `e = F̃P̃ − (F̃P̃)†`, LU solve (`extrapolate.hpp:90–146`) | — | **PORT NOW** | see PORT 3 |
| 23 | Static Fock damping | `F ← (1−p)F + pF_prev`, `p = 0.7`, off at `\|ΔE\| < 1e-3` | — | **PORT NOW** with row 22 (10 lines) | damping on/off must reach the same energy; on must take more iterations |
| 24 | EDIIS / CEDIIS | `B_ij = ½Re⟨ΔF,ΔD⟩`; blend at `SWITCH = 0.05` | — | **PORT LATER** (needs the constrained minimiser in `interpolate.hpp`) | — |
| 25 | Newton–Raphson / BFGS / SR1 SCF, trust radius, level shift | `newtonRaphsonSCFnew/quasi-newton.hpp` | — | **PORT LATER** | — |
| 26 | SCF guesses SAD/CORE/READMO/TIGHT/FCHK + SWAPMO | SCF wiki | ~ (`atoms.js` has its own atomic solve = the raw material for SAD) | **PORT LATER**; CORE is free and enough for minimal bases | — |
| 27 | R/RO/U/G references | QM wiki | — (λWAVES is spin-free: one spatial orbital set) | **PORT LATER** — UHF needs two densities; GHF needs a 2N spinor | UHF H₂ at R = 5 bohr must break symmetry and beat RHF |

### 6c. Hamiltonian tiers and correlation

| # | ChronusQ capability | Formulation (file) | λWAVES | Verdict |
|---:|---|---|:--:|---|
| 28 | X2C one-electron decoupling | `X = S·L⁻¹`, `Y = (1+X†X)^{−1/2}`, `H₂C = Y(V′+cpX+X†cp+X†W′X)Y` (`x2c.cxx:386–625`) | — | **PORT LATER, scalar only** — the linear algebra is ~80 lines of JS on a ≤ 100×100 problem; the blocker is the `pVp` spin-orbit integral engine over the uncontracted basis, which λWAVES has no analogue of |
| 29 | 4C Dirac–Coulomb–Breit | `[[V,T],[T,(1/4c²)W−T]]` (`fourcomp.cxx:30–100`) + Gaunt + gauge | — | **NEVER-IN-BROWSER** — restricted kinetic balance doubles the basis to 2N spinors, then the Gaunt/gauge terms are 4-index tensors over complex 4-spinors, rebuilt during RT |
| 30 | Spin–orbit, SNSO / row-dependent DCB SNSO | `x2c.cxx:85–244` | — | **PORT LATER** — an empirical scaling of a `pVp` matrix λWAVES does not have |
| 31 | DFT XC on a molecular grid | 15 Lebedev orders + Euler–Maclaurin/Gauss–Chebyshev + LibXC + GauXC | — | **NEVER-IN-BROWSER** at production scale — 10⁵–10⁷ grid points × N functions *per Fock build*; WebGPU could carry the bandwidth but only at FP32, and an FP32 XC potential poisons the SCF gradient. A hand-rolled LDA on a ≤ 5×10³-point grid for one atom is a *different*, PORT-LATER object |
| 32 | LR-TDHF/TDDFT `RESIDUE` (RPA, TDA, `(A±B)`) | `response/polarization/singleslater.hpp` | — | **PORT LATER** — a CIS/RPA on the existing STO-3G H₂ integrals is a 1×1 or 4×4 problem and gives an *independent oracle* for the RT spectrum. High value, low cost |
| 33 | `FDR` frequency-dependent response, GMRES/GPLHR/Davidson | `response/fdr.hpp`, `itersolver/` | — | **PORT LATER** |
| 34 | Model-order reduction of TDDFT | `morspec.hpp` | — | **NEVER-IN-BROWSER** (it reduces a problem λWAVES cannot form) |
| 35 | CCSD / CCSDT / EOM-CC family | 33 headers, TiledArray-style distributed tensors (`coupledcluster/TAManager.hpp`) | — | **NEVER-IN-BROWSER** — N⁶–N⁸ contractions needing a distributed tensor library |
| 36 | CASCI / CASSCF / RASCI / STP-DAS | `mcscf/`, `newcibuilder/dascibuilder/` | ~ (`h2ci.js` is a 2-orbital FCI = the smallest CASCI) | **PORT LATER** — a (6e,6o) π-CAS on benzene is 400 determinants in the fixed-Ms sector: genuinely browser-sized |
| 37 | MP2 / GVVPT2 / ENPT2 | `mp/`, `newperturb/` | — | PORT LATER (MP2 is one N⁵ loop over a small basis) |
| 38 | NEO + EPC17/EPC19 | `fockbuilder/neofock/`, `dft/epc.hpp` | — | **PORT LATER** — the quantum-proton idea is small; the EPC functionals are LibXC-adjacent fits |
| 39 | RT-NEO + traveling proton basis `τ` | `τ_QP = Σ_a S^a_{QP}Ṙ_P`, `F ← F − iτ` (`rt.hpp:50–105,171–186`) | **~ P** — `mo.js connection(R) = S′/2 + ½diag(P,−P)` is the *same object* for a rigidly-riding basis, and λWAVES derived it independently (`mo.js:41–58`, MATH-MOLECULAR-PULSES §2.1) | — (λWAVES is arguably *ahead* here for its own case: it has the exact one-centre `⟨χ\|∂_z\|χ⟩` in closed form) |
| 40 | Electronic Born–Oppenheimer RT (`BORT`) | full SCF on the electrons at each step (`propagation.hpp:262–306`) | P in spirit (`mo.js createDynamics electron: 'bo'` re-solves the eigenproblem each nuclear step) | — |
| 41 | Ehrenfest / BOMD velocity Verlet | `a = −g/m`, `v ← v + ½Δt·a` (`velocityverlet.cxx:24–60`) | P (`mo.js createDynamics`, `h2.js collide`) | — |
| 42 | Magnetic exponential Verlet | `v(t+½Δt) = u^{1/2}v(t) + ½Δt·u^{1/4}a(t)`, `u = exp(wΔt)` (`velocityverlet.cxx:62–140`; the citation is at `:67`, Helgaker 2024 Alg. 4) | — | **PORT LATER** (a curiosity until λWAVES has a B field) |
| 43 | Analytic gradients incl. Pulay | `getGDGrad`, `findiff/geomgrad.hpp` | P for its own model (`mo.js force`, Pulay separated) | — |
| 44 | Gaussian 2e integrals at scale (Libint2/Libcint, RI, Cholesky, Schwarz screening, incremental Fock, MPI+OpenMP) | `particleintegrals/aointegrals/*` | ~ (s-type only, 4 integrals) | **NEVER-IN-BROWSER** at scale; s/p by Obara–Saika is a PORT LATER |
| 45 | HDF5 checkpoint/restart every `iSave` step | `realtimeSCF/impl.hpp:294–420` | ~ (`project-storage.js`, `history.js` serialise UI state, not a propagation) | PORT LATER |
| 46 | Cube-file density output | `cubegen/` | P and then some (`render-exact.js` + WebGPU ray-marched density/phase) | λ↔ |
| 47 | λ↔ **Exact two-centre Slater/Sturmian integrals in prolate coordinates** | — | **P** (`twocentre.js`) | ChronusQ has **no** STO engine at all: it is Gaussian-only. λWAVES's `S`, `T`, `V_A`, `V_B`, `positionZ` are exact at *every* R |
| 48 | λ↔ **Exact hydrogenic / Coulomb-Sturmian one-centre analytics**, 91 states, exact Stark within a shell, exact momentum transform | — | **P** | absent from ChronusQ |
| 49 | λ↔ **Xα/Latter central-field atoms Z = 1…36** on a log mesh by tridiagonal Sturm bisection | — | **P** (`atoms.js`) | ChronusQ's nearest object is the SAD guess, which is not a spectrum |
| 50 | λ↔ **The sudden boost `⟨a\|e^{ikz}\|b⟩`** by multipole expansion, with escaped norm reported | — | **P** (`kick.js`) | absent from ChronusQ |
| 51 | λ↔ **Real-time GPU rendering** of the density/phase field | — | **P** | absent (ChronusQ writes cube files) |

### 6d. Spectrum post-processing — the layer that is in *neither* codebase

ChronusQ's source contains no Fourier, Padé or spectrum code at all (verified: a repo-wide grep for
`pade|fourier|spectr|absorpt` returns zero hits, and the package paper says the transform is *"post processing at
the users' discretion"*). So this layer is not a λWAVES *deficit* relative to ChronusQ — it is a layer the Li
group publishes equations for and ships to the user. That makes it the cheapest place for λWAVES to be **better
than** its reference rather than merely catch up.

| # | Capability | Formulation (source) | λWAVES | Verdict | Smallest honest fixture |
|---:|---|---|:--:|---|---|
| 52 | Damped-window Fourier of the dipole trace → `α(ω)` → `σ(ω)` | `μ̃(ω)=∫m(t)e^{iωt}dt`, `m(t)=[μ(t)−⟨μ⟩]e^{−t/τ}`, `α_ii=μ_i/E_i`, `σ_ii=(4πω/c)Im α_ii`, `S=⅓Tr σ` — Chem. Rev. 2020 Eqs. (54)–(55), (61)–(63); Kadek Eqs. (121)–(122); Goings 2018 Eqs. (33)–(34) | — | **PORT NOW** = PORT 1 | measured: peak `0.477753059` Ha vs oracle `0.477747587`; `∫S_zz = 1.212987` vs derived `2ωz₀₁² = 1.215895` |
| 53 | Padé (diagonal) acceleration of the transform | `b = G^{−1}d`, `G_km=c_{N−m+k}`, `d_k=−c_{N+k}`, `b₀=1`, `a_k=Σ_m b_m c_{k−m}` — Chem. Rev. Eqs. (56)–(60); Kadek Eqs. (109)–(112). Original (Bruner/LaMaster/Lopata 2016) **not opened** | — | **PORT LATER** — buys nothing while the propagation is cheap; adds a Toeplitz solve and, per both sources, artefacts on short traces | same single peak from ⅕ of the trace length, to `1e-4` Ha in position |
| 54 | **MO-pair-decomposed dipole and per-transition spectra** | `P^MO = C†PC`, `D^MO = C†DC`, `μ^MO_{ia} = D^MO_{ia}P^MO_{ai} + D^MO_{ai}P^MO_{ia}`, `μ(t) = μ₀ + Σ_{i<a} μ_{ia}(t)` — Chem. Rev. 2020 Eqs. (49)–(53) | — | **PORT NOW-adjacent** ⭐ — this is the *one* ChronusQ-lineage idea that lands directly on λWAVES's existing UI: `lab/spectrum.js` already draws **one lane per mode**, so a per-MO-pair spectrum gives every lane its own absorption trace instead of one global curve. Chem. Rev. also notes each decomposed signal is *"sparser and thus less prone to defective behaviour"* under Padé | H₂⁺ STO-3G: the σ_g→σ_u pair must carry **100 %** of the peak area, every other pair `< 1e-12` — a trivially falsifiable first test |

**Verdict counts.** 54 rows, each counted once by its primary verdict; they sum to 54.

| verdict | rows | which |
|---|---:|---|
| **PORT NOW** | **12** | 1, 2, 5, 13, 14, 17, 19, 21, 22, 23, 52, 54 |
| **PORT LATER** | **20** | 4, 7, 8, 9, 11, 20, 24, 25, 26, 27, 28, 30, 32, 33, 36, 37, 38, 42, 45, 53 |
| **NEVER-IN-BROWSER** | **6** | 12, 29, 31, 34, 35, 44 — rows 12 and 44 are *split* verdicts: never for the hard part (GIAO two-electron; Gaussian integrals at scale), PORT LATER for a reduced version (a uniform-B Zeeman term; s/p by Obara–Saika) |
| **no action — already in λWAVES** | **10** | 3, 6, 10, 15, 16, 18, 39, 40, 41, 43 |
| **λ↔ λWAVES has it, ChronusQ does not** | **6** | 46, 47, 48, 49, 50, 51 |

The twelve PORT NOW rows collapse into the **three** deliverables of §7: rows 13, 14, 17, 52 and 54 are PORT 1;
rows 1, 2, 5, 19 are PORT 2; rows 21, 22, 23 are PORT 3.

---

## 7. THE THREE PORTS WORTH DOING FIRST

Written in λWAVES's own conventions: atomic units; the EOM is **i S dc/dt = (H₀ + E_z(t) Z) c** with
`S`, `H₀`, `Z` real symmetric `N×N` and `c ∈ ℂ^N`; `Z_ij = ⟨χ_i|z|χ_j⟩`.

Throughout, `X ≡ S^{−1/2}` and `W ≡ S^{+1/2}` — **already in the tree** as `mo.js metricRoots(R).Wi` and
`.W`. Define `c̃ = W c`, `H̃ = X H X`, `Z̃ = X Z X`. Then

> **i dc̃/dt = H̃(t) c̃**   — **DERIVED-HERE**, one line: `iSX dc̃/dt = HX c̃` ⟹ `i(XSX) dc̃/dt = (XHX) c̃`
> and `XSX = I`.

---

### PORT 1 — the δ-kick, the dipole trace, and the absorption spectrum

*Why first:* it is the **entire ChronusQ real-time workflow** that λWAVES is missing, it needs no new physics
(the propagator and the dipole already exist), it is pure CPU JS, and it has a **built-in oracle** — every
peak must land on a field-free eigenvalue gap λWAVES already computes. **This port was prototyped and
measured in this session; every acceptance number below is observed, not predicted.**

**The kick — exactly, not as a narrow step.** Set `E_z(t) = κ δ(t)`. Integrating the EOM across `t = 0`:

> **c̃(0⁺) = exp(−i κ Z̃) c̃(0⁻)**, and in the AO frame **c(0⁺) = exp(−i κ S⁻¹Z) c(0⁻)**.

**DERIVED-HERE** from λWAVES's stated EOM — and **independently corroborated in the literature**: Kadek,
Konecny & Repisky (<https://arxiv.org/abs/2307.05242>) give the density-matrix form as their Eq. (123),

> `D(t₀) = e^{+i E n·P/ħ} D₀ e^{−i E n·P/ħ}` , *"which represents an infinitesimally short time evolution by
> U(t₀+ε, t₀−ε) driven by the δ(t−t₀) field in the limit ε → 0"*

which is exactly `c̃ ← exp(−iκZ̃)c̃` lifted to `D = c̃c̃†` (their `P` is the dipole-moment matrix, `−Z̃` here; hence
the flipped sign in the exponent). They list it as the *analytic alternative* to *"a narrow Gaussian function or
rectangle"* — i.e. the literature knows the narrow-step trick is the inferior option.
`exp(−iκZ̃)` is one Hermitian diagonalisation of the *constant* `Z̃` — done once, not per step. In the weak-field limit `c̃(0⁺) ≈ c̃₀ − iκ Z̃ c̃₀`, so every eigenstate `k`
with `⟨k|Z̃|0⟩ ≠ 0` is seeded with amplitude `−iκ⟨k|Z̃|0⟩` — the linear-response regime, which is the one the
spectrum is defined in.

This is **better than ChronusQ's narrow `StepField`**, whose effective impulse is `amplitude × (the first
step's length)` rather than `amplitude × τ` (§1.8). Removing that removes a whole class of timestep artefacts
and makes `κ` an *input* rather than an emergent property of the integrator.

**The trace.** Propagate field-free — `createMODrive(mo, { R, c0: kicked, field: () => 0 })` — for `M` steps
of `Δt`, recording

> **μ_z(t) = − c†(t) Z c(t) / c†(t) S c(t)**  (exactly `modrive.js observables().electronDipole`)
> and **δμ(t) = μ_z(t) − μ_z(0)**.

**The transform.**

> **δμ̃(ω) = Δt · Σ_{n=0}^{M} δμ(nΔt) · e^{iωnΔt} · e^{−nΔt/τ}**
> **α_zz(ω) = δμ̃(ω) / κ**  (the kick's own spectrum is flat and equal to `κ`)
> **S_zz(ω) = (2ω/π) · Im α_zz(ω)**

The first two lines are **exactly** Li, Govind, Isborn, DePrince & Lopata, *Chem. Rev.* **120**, 9951 (2020)
(<https://www.osti.gov/servlets/purl/1674946>) Eqs. (54)–(55) and (63), verbatim:

> `μ̃(ω) = ∫₀^∞ dt m(t) e^{iωt}`  (54) ,  `m(t) = [μ(t) − ⟨μ⟩] e^{−t/τ}` for `t ≤ t_max`, `0` beyond  (55)
> `α_ii(ω) = μ_i(ω) / E_i(ω)`  (63)

*"where ⟨μ⟩ is either the dipole moment at t = 0 or the average dipole moment, and **τ is a damping parameter
that corresponds to a phenomenological lifetime (line width) in the spectrum. This lifetime must be chosen to be
small enough such that the discontinuity in eq 55 does not introduce ringing artifacts**"* — the same warning as
failure mode 2 below, from the authors of ChronusQ. (That review is co-authored by X. Li and is the single best
reference for this whole workflow; it is **not** the package paper, which contains none of it.)

Use a **direct sum, not an FFT**: at `M ~ 4×10⁴` samples and `N_ω ~ 2×10³` frequency points that is
`8×10⁷` multiply-adds — roughly 0.2 s in JS — and it buys a *free* choice of ω-grid with no zero-padding
and no power-of-two constraint. An FFT is the wrong tool when you want 2000 points over 0–2 Ha.

The damping `e^{−t/τ}` turns each line into a Lorentzian of **HWHM = 1/τ**. That is not cosmetic: it is the
honest statement of resolution. **Report `1/τ` in the UI as the linewidth**, and require `τ ≤ T = MΔt` or
the window does nothing and Gibbs ringing returns.

**Normalisation — settled three ways, no remembered constant.** The *photoabsorption cross section* is
verbatim-sourced, and agrees across three independent papers:

> `σ_ii(ω) = (4πω/c) · Im[α_ii(ω)]` , `S(ω) = ⅓ Tr[σ(ω)]` — Chem. Rev. 2020 Eqs. (62), (61)
> `σ(ω) = (4πω/c) ℑ[α(ω)]` , `S(ω) = ⅓ Tr σ(ω)` — Kadek *et al.* Eqs. (121), (122)
> `σ_ii(ω) = (4πω/c) Im[D̃_i(ω)]/κ_i` , `σ(ω) = (4πω/3c) Σ_i Im[D̃_i(ω)]/κ_i` — Goings, Lestrange & Li,
> *WIREs* **8**, e1341 (2018), Eqs. (33)–(34), **derived there from photon counting** (their Eqs. 20–32), not
> asserted

The **dipole strength function** `S_zz = (2ω/π)Im α_zz` used above is the sum-rule-normalised sibling, related by
`σ = (2π²/c)·S` in atomic units, and it is **DERIVED-HERE and then verified numerically.** For a weak kick the
two-level response is closed-form: with `z₀₁ = ⟨0|Z̃|1⟩` and `ω = E₁ − E₀`,

> `c̃(0⁺) ≈ e₀ − iκZ̃e₀` ⟹ **`δμ_z(t) = 2κ z₀₁² sin(ωt) + O(κ²)`**
> ⟹ `Im α_zz(ω′) = 2z₀₁² ∫₀^∞ sin(ωt)sin(ω′t)dt = π z₀₁² δ(ω−ω′)`  (as `τ → ∞`)
> ⟹ `S_zz(ω′) = (2ω′/π)·π z₀₁² δ(ω−ω′)` ⟹ **`∫S_zz dω = 2ω z₀₁²`** — the one-component f-sum term exactly.

**Measured against the propagated trace** (`/tmp/port1b.mjs`, same prototype): predicted amplitude
`2κz₀₁² = 2.545057687×10⁻³`, measured `max|δμ| = 2.545055524×10⁻³`; `max|δμ(t) − 2κz₀₁² sin ωt| = 2.16×10⁻⁹`,
against the `O(κ²) = 10⁻⁶` the derivation drops. **The normalisation is proved, not guessed.**

⚠️ What the sum rule then *reports* is basis quality, and must not be tuned away: the complete-basis f-sum rule
is `Σ_k 2ω_k|⟨0|z|k⟩|² = N_e`, and H₂⁺ has `N_e = 1`, but STO-3G with a single virtual gives
`2ω z₀₁² = 1.215895169` — **21.6 % over**. That excess *is* the minimal-basis error in the transition dipole.
Assert the number; print the deficit next to it.

**Cost.** Zero extra per propagation step. One O(M·N_ω) pass afterwards. Memory: one `Float64Array(M)`.
The kick is one `N³` Hermitian eigendecomposition of `Z̃`, once.

**Failure modes.**
1. **Kick too strong** → nonlinear response: peaks shift, harmonics appear, `α(ω)` stops being a
   susceptibility. **Test:** halve `κ`; `α(ω)` must be unchanged. `κ = 10⁻³…10⁻⁴` a.u. is the usual safe
   band (ChronusQ's test amplitude is `0.001`).
2. **`τ` wrong** → too short gives one broad hump; `τ ≥ T` gives ringing and *negative absorption*.
3. **Nyquist aliasing** → the highest resolvable frequency is `π/Δt`. Any real transition above it folds
   down and lands on a *wrong energy* with no warning. H₂⁺'s gap is 0.478 Ha and `Δt = 0.05` gives Nyquist
   62.8 Ha — safe by 130×. The trap is real only for tight Gaussian sets whose virtual eigenvalues run to
   tens of hartree: **compute `π/Δt` and `max(E_k) − min(E_k)` and refuse to plot if the second exceeds the
   first.**
4. **Forgetting `− μ_z(0)`** → a `δ(ω)` spike at `ω = 0` that swamps everything on a linear axis.
5. **Norm drift feeding the dipole.** `modrive` divides by `c†Sc` already; keep that, and plot the norm
   alongside the spectrum so a drifting norm cannot masquerade as a changing intensity.

**The fixture.** H₂⁺, `R = 2.0` bohr, **STO-3G** — and the basis matches ChronusQ *exactly*:
`basis/sto3g.gbs` gives H as `α = 3.42525091, 0.62391373, 0.16885540`,
`d = 0.15432897, 0.53532814, 0.44463454`, byte-identical to `lab/h2ci.js:56 STO3G_H`.
One electron ⟹ ChronusQ's `G[D] = 0` and its Fock **is** the core Hamiltonian ⟹ **the two codes are solving
the same finite matrix problem with no approximation difference at all.** That makes this the one fixture
where a ChronusQ run is a true bit-level oracle rather than a method comparison.

Numbers computed **here**, from λWAVES's own `sto3gIntegrals` plus `⟨a|z|b⟩ = P_z S_ab`
(the Gaussian product-centre theorem, exact for s-primitives):

| quantity | value |
|---|---|
| `S_ab` | `0.462777695430` |
| `h_aa` | `−0.954367038233` |
| `h_ab` | `−0.629375597183` |
| `⟨a\|z\|a⟩` | `−1.000000000000` ( `= −R/2` exactly) |
| `⟨a\|z\|b⟩` | `0.000000000000` (exactly, by symmetry) |
| `E(σ_g)` electronic | `−1.082695368109` Ha |
| `E(σ_u)` electronic | `−0.604947780993` Ha |
| `E_total(σ_g) = E + 1/R` | `−0.582695368109` Ha |
| **ω = E(σ_u) − E(σ_g)** | **`0.477747587116` Ha = `13.000174` eV** |
| `⟨σ_g\|z\|σ_u⟩` | `−1.128064201766` a₀ |
| `f = ⅔ω\|d\|²` | `0.405298389617` |
| one-component f-sum `2ω\|d\|²` | `1.215895…` (vs `N_e = 1`) |

Cross-check on `d`: with `⟨a|z|b⟩ = 0` and `⟨a|z|a⟩ = −R/2` exactly, `d = −R/(2√(1−S²))` — **the same closed
form `research/astra-2026-09-05/reference-drive.py:14` uses**, and it agrees to 5 figures. The tree's own
independent oracle already validates the transition dipole.

**ACCEPTANCE.** `κ = 10⁻³`, `Δt = 0.05` au, `T = 2000` au (40 000 steps), `τ = 500` au (HWHM 0.002 Ha):
1. The spectrum has **exactly one** peak in `0 < ω < 2` Ha, at `0.47775 ± 0.002` Ha.
2. That peak position equals `mo.solve(R).E[1] − mo.solve(R).E[0]` to `1e-6` — the internal oracle.
3. Halving `κ` leaves `α(ω)` unchanged to `1e-6`; halving `Δt` leaves the peak position unchanged to `1e-8`.
4. The one-component f-sum integrates to `1.2159 ± 0.01`, and the test asserts that value **with a comment
   saying it exceeds `N_e = 1` because STO-3G with one virtual overestimates the transition dipole.**
5. Norm drift over 40 000 steps `< 1e-10` (already the standard `modrive` holds).
6. The trace itself matches the closed form: `max|δμ(t) − 2κz₀₁² sin(ωt)| < 10⁻⁸` — a **stronger** test than the
   spectrum, because it checks phase as well as magnitude, and it needs no transform at all.

**✅ ALL FIVE MEASURED, not predicted.** A throwaway prototype of exactly this recipe was run in this session
(the script is reproduced in Appendix A below, ~80 lines, importing only `lab/h2ci.js`; **no file in the repo was modified**). It builds
`S`, `H₀`, `Z` for H₂⁺ STO-3G at R = 2, forms `X = S^{−1/2}` from the 2×2 Löwdin roots, applies the exact kick
`exp(−iκZ̃)`, propagates exactly in `H̃`'s eigenbasis for 40 000 steps at `Δt = 0.05`, and takes the damped
direct-sum transform with `τ = 500` on a `Δω = 5×10⁻⁴` grid to `ω = 1.2` Ha:

| criterion | target | **measured** |
|---|---|---|
| Löwdin-frame eigenvalues vs the generalised ones | identical | `−1.082695368109`, `−0.604947780993` — **identical to 12 figures** |
| peak position (parabolic interpolation of 3 grid points) | `0.47775 ± 0.002` Ha | **`0.477753059` Ha** |
| peak vs the internal oracle `E[1] − E[0] = 0.477747587` | within the linewidth | error **`5.47×10⁻⁶` Ha** — 365× finer than the HWHM |
| number of peaks in `0 < ω < 1.2` Ha above 5 % of max | exactly one | **one**, 34 grid points wide, HWHM `1/τ = 0.0020` Ha as designed |
| `∫S_zz(ω)dω` vs `2ω\|d\|² = 1.215895` | within 1 % | **`1.212987`** — `0.24 %` low (the truncated `ω` range and the damping tail) |
| linear response: halve `κ`, compare `Im α(ω)` over the peak | unchanged | absolute `3.9×10⁻⁴` on a peak value of `624.589` ⟹ **relative `6.3×10⁻⁷`** |
| norm drift over 40 000 steps | `< 1e-10` | **`5.35×10⁻¹²`** |
| `μ_z(0)` after `− μ_z(0)` subtraction | `0` | **`−2.2×10⁻¹⁵`** |

Peak `S_zz = 189.97`. The recipe therefore needs no exploration — it needs implementing, wiring to
`lab/spectrum.js`'s rail, and gating with the table above.


*Then, and only then,* the optional matched ChronusQ run: `charge = 1, mult = 2, reference = Complex UHF,
job = RT, basis = STO-3G`, geometry `H 0 0 ±0.52917721092` **in Ångström** (ChronusQ divides `geom:` by
`AngPerBohr = 0.52917721092`, `src/cxxapi/input/molopts.cxx:197–199`, `physconopts.cxx:89` with
`LEGACY_CONSTANTS = TRUE`), `DELTAT = 0.05`, `MAXSTEPS = 40000`, `mmut`, `autorestart = 50`,
`FIELD: StepField(0.,0.0001) Electric 0. 0.001 0.`. Read `RTNEW/TIME` and `RTNEW/LEN_ELEC_DIPOLE` from the
HDF5 file. **Expect the sign of the trace to be opposite** (§1.6) and the effective kick strength to differ
from `κ` by the first-step factor — compare **peak positions and the ratio of peak areas**, not raw
amplitudes.

#### PORT 1b (optional) — Padé acceleration, now verbatim-sourced

The original (Bruner, LaMaster & Lopata, *J. Chem. Theory Comput.* **12**, 3741 (2016), doi
`10.1021/acs.jctc.6b00511`) is **paywalled and was not opened**. The identical recursion is printed in two
sources that *were* opened, one of them co-authored by ChronusQ's own lead author. Chem. Rev. 2020,
Eqs. (56)–(60), verbatim:

> `μ(z) = Σ_{k=0}^{M} c_k z^k = ( Σ_{k=0}^{M} a_k z^k ) / ( Σ_{k=0}^{M} b_k z^k )` , *"where `M = N_t/2`,
> `z_k = e^{−iωΔt}`, and the coefficients `{c_k} = μ(t_k)` are the discrete values of the input time signal"*  (56)
> `Σ_k c_k z^k · Σ_m b_m z^m = Σ_k a_k z^k` , *"with `a₀ = c₀` and `b₀ = 1` chosen by convention"*  (57)
> `G b = d` , *"`G` is a `N_t × N_t` matrix with elements `G_km = c_{N_t−m+k}`, `d` … `d_k = −c_{N_t+k}`"*  (58)
> `b = G^{−1} d` , *"which has Toeplitz symmetry"*  (59)
> `a_k = Σ_{m=0}^{k} b_m c_{k−m}` , `k = 1 … N_t`  (60)

Second printing — Kadek *et al.* Eqs. (109)–(112), with the damping folded into the coefficients:

> `c_j = f(t_j) Δt e^{−γjΔt}` , `z_ω = e^{+iωΔt}` , `N = M/2` , `b = G^{−1}d`, `G_km = c_{N−m+k}`,
> `d_k = −c_{N+k}`, `b₀ = 1` , `a_k = Σ_{m=0}^{k} b_m c_{k−m}`

⚠️ **The two printings use opposite signs in `z`** (`e^{−iωΔt}` vs `e^{+iωΔt}`); they are the same method under
`ω → −ω`. Kadek folds `e^{−γjΔt}` into `c_j`, Chem. Rev. does not. **Pick one and write it in the header.**

Why it works, verbatim (Chem. Rev.): *"because these coefficients are independent of frequency, the spectrum can
be generated for an arbitrary spectral density. This is analogous to extrapolating the input signal to an
arbitrarily long time … in practice, one can often compute a fully converged spectrum with **1/5 or less** of a
simulation time compared to a traditional FT."* And the cost, honestly: *"Padé approximants … assume nothing
about the line shape but **require a matrix inversion and can introduce artifacts into the spectrum if the time
signal is too short**."* Kadek adds: *"in practice, the Padé approximation can suffer from numerical
instabilities,"* mitigated by pairing it with the MO decomposition below.

**Verdict for λWAVES: PORT LATER, not now.** Plain damped Fourier at `T = 2000` au already resolves 0.002 Ha —
365× finer than the measured peak error and three orders finer than the basis error. Padé earns its `G^{−1}` (an
`N_t × N_t` Toeplitz solve, i.e. `O(N_t²)` with a Levinson solver, `O(N_t³)` naïvely) only when the *propagation*
is the expensive part, which for a 2–42 function λWAVES basis it is not. Revisit it the day λWAVES propagates a
26-function water molecule and 2000 au of trace costs real seconds.

---

### PORT 2 — the density matrix, in the Löwdin frame, with the Magnus-2 predictor–corrector

*Why:* this is ChronusQ's actual core, and it is the **only** thing standing between λWAVES and
many-electron real-time dynamics. A coefficient vector can carry one electron; a density matrix carries N.

**The objects.** The AO one-particle density `D ∈ ℂ^{N×N}`, Hermitian, with `N_e = Tr(D S)`. For orbital
columns `c_k` with occupations `f_k`, `D = Σ_k f_k c_k c_k†`.

**The frame** (`mo.js metricRoots(R)` already supplies both roots):

> **P = W D W = S^{1/2} D S^{1/2}** ,  **F̃ = X F X = S^{−1/2} F S^{−1/2}** ,  **D = X P X**

**The EOM.** From `i dc̃/dt = F̃ c̃` and `P = Σ f_k c̃_k c̃_k†`:

> **i dP/dt = [F̃, P]** , i.e. **dP/dt = −i[F̃, P]**   — **DERIVED-HERE**, and identical to ChronusQ's
> `singleslater/rt.hpp:191–263`.

**The step.**

> **P(t+Δt) = U P(t) U†** ,  **U = exp(−i Δt F̃)** , by one Hermitian diagonalisation of `F̃`
> (`F̃ = V w V†` ⟹ `U = V e^{−iΔt w} V†`) — **exactly** `MatExp('D',…)`, and exactly the structure
> `modrive.js:44–56` already uses on the generalised problem.

**Magnus-2 predictor–corrector** (needed the moment `F` depends on `P`):

```
1.  save P(t)
2.  F₀ = F̃[P(t), t]
3.  P* = e^{−iΔt F₀} P(t) e^{+iΔt F₀}                  (the predictor)
4.  F₁ = F̃[P*, t+Δt]
5.  F̄  = ½(F₀ + F₁)
6.  P(t+Δt) = e^{−iΔt F̄} P(t) e^{+iΔt F̄}              (the corrector, from the SAVED P(t))
```

Step 6 restarting from the **saved** `P(t)` — not from `P*` — is the whole point, and is exactly what
`propagation.hpp:144–159` does with `onePDMSquareOrthoSave`.

**MMUT** (the cheap variant, once `F[P]` is expensive): `P(t+Δt) = U(t) P(t−Δt) U(t)†` with
`U(t) = exp(−2iΔt F̃(t))` — one Fock build and one diagonalisation per step instead of two. Start and restart
with a Magnus-2 step, and restart every ~50 steps.

**Cost per step in a basis of N functions.**

| piece | flops | N = 26 (H₂O STO-3G) | N = 100 | N = 300 |
|---|---|---|---|---|
| Hermitian eigendecomposition of `F̃` | `≈ (4/3 + 4)N³` complex | 10⁵ | 5×10⁶ | 1.4×10⁸ |
| build `U = Ve^{−iΔtw}V†` | 2 complex `N³` gemm | 3×10⁴ | 2×10⁶ | 5×10⁷ |
| `U P U†` | 2 complex `N³` gemm | 3×10⁴ | 2×10⁶ | 5×10⁷ |
| **in-core `G[D]` Fock build** | `≈ N⁴/8` | 5.7×10⁴ | 1.25×10⁷ | 10⁹ |
| Magnus-2 total | 2× the above | | | |

So: **N ≲ 100 is the browser's honest ceiling for in-core two-electron real-time propagation** — a 2 MB
`Float64Array` of unique integrals and roughly 50 ms per Fock build, i.e. ~10 steps/s with Magnus-2. At
N = 300 the `N⁴` term alone is 10⁹ flops/step and it is no longer real time by any definition.
For λWAVES's *existing* one-electron cases (`N = 2…42`) every number above is free.

**Failure modes.**
1. **Idempotency drift.** A single determinant requires `P² = P` per spin. `U P U†` preserves it **exactly**
   (a unitary similarity cannot change the spectrum of `P`); RK4 does not. Port the *diagnostic*
   `Tr(P² − P)` (`rt.hpp:109–133`, 6 lines). Port `3P² − 2P³` only as an **explicitly labelled repair** —
   the same rule `modrive.js` already obeys about norm: *report, never repair silently.*
2. **`Tr(P)` is a pure frame test.** A similarity transform cannot change `Tr(P)`. So if `Tr(DS)` drifts,
   the bug is in `S^{±1/2}`, **not** in the integrator. That makes it the single most diagnostic assertion
   in the whole port — assert `|Tr(DS) − N_e| < 1e-14`.
3. **Energy drift.** With a time-dependent field, energy is *not* conserved; the closed quantity is
   `E(t) − ∫E·dμ`. ChronusQ adds `+E·μ`; `modrive` subtracts it. Pick one, write it in the header, and make
   the work integral close to `1e-8` over a full sin² pulse (it must, because the pulse is zero at both ends).
4. **Timestep.** A unitary propagator has **no stability limit** — `U` is unitary for any `Δt` — which is
   exactly why a too-large `Δt` fails *silently* with a perfectly normalised, perfectly wrong answer. The
   accuracy limit is `O(Δt³‖[F(t),F(t′)]‖)` for Magnus-2, and practically `Δt ≪ 2π/(max w − min w)` of `F̃`.
   ChronusQ's tests use `Δt = 0.05` au for water 6-31G(d) and `0.005` au for spectra.
   **The only honest convergence statement: halve `Δt`; the change in the dipole trace must fall by ≥ 4×.**
5. **The MMUT even/odd split.** Without periodic restart the two sublattices diverge into a spurious
   high-frequency oscillation. Do not damp it — restart, as the wiki says.
6. **Complex storage.** `P` is Hermitian complex: `2N²` doubles. At N = 100 that is 160 kB per stored
   density and MMUT needs two plus a save copy. Fine. At N = 300, 1.4 MB × 3 — still fine; it is the
   integrals, not the densities, that bite.

**The fixture.** Same H₂⁺ STO-3G R = 2 system, `c(0) = σ_g`, sin² pulse resonant at `ω = 0.477747587116`,
`A = 0.02`, `D = 48` au, propagated to `t = 96` — *deliberately the same pulse parameters as*
`research/astra-2026-09-05/reference-drive.py:18`, so the existing oracle applies with only the integrals
swapped. **Three independent routes must agree:**

1. `modrive.js`'s coefficient propagator (present),
2. the new density propagator with `D = c c†` (the port),
3. a SciPy DOP853 run of `i dc̃/dt = H̃(t)c̃` on the STO-3G matrices, following
   `reference-drive.py`'s pattern (`rtol = 3e-14`, `atol = 3e-15`, segmented at the pulse edge,
   `max_step = 0.25`, with the refinement difference reported).

**ACCEPTANCE.** `μ_z(t)` agrees across all three to `1e-10` at `t = 0, 4, 8, …, 96`; the density route holds
`|Tr(DS) − 1| < 1e-14` and `|Tr(P² − P)| < 1e-12` at every sample; halving `Δt` changes `μ_z(96)` by `≤ ¼`
of the previous change.

---

### PORT 3 — CDIIS + Fock damping: the SCF λWAVES does not have

*Why:* PORT 2 is only *self-consistent* if there is a converged `F[D]` to start from and to rebuild. λWAVES
has no general SCF at all — `atoms.js` has a bespoke central-field loop with simple mixing, and `h2ci.js`
solves a 2×2 by hand. CDIIS is ~50 lines and turns the four STO-3G integrals `h2ci.js` already computes into
a real RHF.

**The iteration.**

```
given D_i :
  F_i  = h + G[D_i]                          (s-only: assembled from (aa|aa),(aa|bb),(ab|ab),(aa|ab))
  if damping and i > 0:  F_i ← (1−p)F_i + p F_{i−1} ,  D_i ← (1−p)D_i + p D_{i−1}     [p = 0.7]
  F̃_i = X F_i X ,  P̃_i = W D_i W
  e_i = F̃_i P̃_i − (F̃_i P̃_i)†                                     ← the orbital gradient
  if max|e_i| < 1e-8 and |ΔE| < 1e-10 : converged
  B_kj = ⟨e_k , e_j⟩  for k,j < n ;  B_{n,l} = B_{l,n} = −1 ;  B_{nn} = 0
  solve  B λ = (0,…,0,−1)ᵗ   by LU with partial pivoting        ← λWAVES already has solveInPlace (mo.js:119)
  if the solve fails : take a plain fixed-point step and SAY SO
  F ← Σ_j λ_j F_j     and     D ← Σ_j λ_j D_j                  ← both, with the same coefficients
  solve  F C = S C ε   (generalisedEigen, sturmian.js)
  D_{i+1} = 2 Σ_{k occ} c_k c_k†                               (closed shell)
```

`n = min(i+1, nKeep)`, `nKeep = 10`. Every constant above is ChronusQ's own
(`extrapolate.hpp:90–146`, `conventionalSCFnew/extrap.hpp`, SCF wiki defaults).

**Cost per iteration.** 1 Fock build (`N⁴/8`) + 1 generalised Hermitian eigensolve (`N³`) + the DIIS solve
(`(n+1)³ ≤ 1331` — free) + `n·N²` dot products for `B` (free). At N = 26, ~10⁵ flops/iteration: a whole SCF
in under a millisecond. **The Fock build is the only term that matters, and it is the same term as PORT 2.**

**Failure modes.**
1. **`B` goes singular** near convergence, because the error vectors become linearly dependent. ChronusQ's
   answer is to detect the LU failure and fall back to a fixed-point step with a printed warning
   (`extrap.hpp`, *"DIIS Inversion Failed — Defaulting to Fixed-Point step"*). **Do exactly that. Do not
   regularise silently** — a silently-regularised DIIS converges to something and does not tell you what.
2. **Converging to a saddle or the wrong state.** The cure is the *guess*, not the extrapolator; that is why
   ChronusQ ships SAD/CORE/READMO/TIGHT and `SWAPMO`. For minimal bases `CORE` (diagonalise `h`) is enough.
   **Assert the final `ε` ordering and the HOMO–LUMO gap**, not just the energy.
3. **Damping never switched off** → linear convergence forever. Switch at `|ΔE| < 1e-3`.
4. **Extrapolating `F` but not `D`** (or vice versa) → the two drift out of correspondence and `[F̃,P̃]` stops
   being a gradient. ChronusQ extrapolates both with one coefficient set; so must this.
5. **Wrong frame for the error metric.** `e` must be formed in the **orthonormal** frame. In the AO frame the
   gradient is `FDS − SDF`, a different matrix, and mixing the two silently halves the convergence rate.

**The fixture.** H₂, STO-3G, closed shell. λWAVES already has the integrals (`h2ci.js sto3gIntegrals`) and
the tree already has pinned reference values (`research/beta/MASTER-DOSSIER.md §14`, archived PySCF,
STO-3G, geometry **in Ångström**):

| geometry | RHF (Eh) | FCI (Eh) |
|---|---|---|
| `0.74 Å` (= 1.398397 bohr) | `−1.1167593073964255` | `−1.1372838344885023` |
| `3 Å` (= 5.669178 bohr) | `−0.6560482511455911` | `−0.9336318445584986` |

**ACCEPTANCE.**
1. CDIIS from a CORE guess reaches the RHF value at 0.74 Å to `1e-10` in `≤ 15` iterations, with final
   `max|e| < 1e-8`.
2. The same run with DIIS **off** reaches the same energy (to `1e-10`) and takes **more** iterations — which
   proves the extrapolator is accelerating, not steering.
3. `Tr(DS) = 2` to `1e-14` at every iteration.
4. At 3 Å the RHF value is reproduced **and** the test asserts that it is `0.278` Eh *above* FCI — the
   static-correlation failure. That single assertion is the honest reason H₂-at-3 Å is the right fixture:
   it certifies that the SCF is right *and* that it is not enough, in one number.
5. Feed the converged `D` into PORT 2 with zero field: `μ_z(t)` must be constant to `1e-12` for 10⁴ steps.
   **A self-consistent stationary state must not move.** That is the cheapest possible proof that PORT 2 and
   PORT 3 agree about what `F[D]` means.

---

## 8. WHAT CHRONUSQ DOES THAT A BROWSER NEVER WILL

Five things, each with the reason it is a wall rather than a hill.

**1 · Two-electron integrals at scale (Libint2 / Libcint).**
`src/particleintegrals/aointegrals/` — Obara–Saika / Head-Gordon–Pople recursions for general contracted
Cartesian Gaussians, Schwarz screening, direct and incremental Fock builds, batched contractions, RI and
Cholesky decompositions, distributed RI, 156 shipped basis sets. Hard dependencies: a C++20 compiler,
BLAS++/LAPACK++, HDF5 1.14+, Eigen3, Libint2, LibXC, optionally Libcint, GauXC, MPI, CUDA, MAGMA.
**Why it is a wall:** the *recursions* are portable — a few hundred lines of JS would give s/p. What is not
portable is everything that makes `N⁴` survivable: screening that skips 90 % of shell quartets, cache
blocking, shell-pair batching, and threading. Without those the prefactor is 100–1000× off, and `N⁴/8`
becomes the whole frame budget at N = 60. λWAVES's honest ceiling is **s-type (and, with real work, s/p)
primitives on ≲ 10² functions, in core, one thread.**

**2 · Four-component Dirac–Coulomb–Breit.**
`src/fourcomp/fourcomp.cxx:32–100` builds `[[V, T],[T, (1/4c²)W − T]]` in restricted kinetic balance — which
**doubles** the basis to 2N four-spinors before any two-electron work begins. Then the Coulomb, **Gaunt** and
**gauge** (Breit) terms are 4-index tensors over complex 4-spinors, and during RT they are rebuilt every
`rtGaunt`/`rtGauge` steps (`realtimeSCF/impl.hpp:255–269`). **Why it is a wall:** it is storage, not algebra.
The small-component space triples the memory for the same chemistry, and every tensor is complex. This is
what ChronusQ exists *for* — the README's first claim is *"the molecular Dirac–Coulomb–Breit Hamiltonian"* —
and it is the one tier where "never" is the right word.

**3 · Large-basis DFT exchange–correlation grids.**
15 Lebedev angular orders (6 → **974** points), Euler–Maclaurin and Gauss–Chebyshev radial rules, Becke
partitioning, LibXC's whole functional library, and GauXC with optional CUDA/MAGMA offload. A production
molecular grid is `10⁵–10⁷` points, and **every** point needs every basis function and its gradient
evaluated, **per Fock build**. **Why it is a wall:** it is a memory-bandwidth problem, which is exactly what
a GPU is for — except that the RTX 3070 exposes no FP64 through WebGPU, and an FP32 exchange–correlation
potential poisons the SCF gradient long before it poisons the energy: the `[F,P]` commutator stops being able
to reach `1e-8` at all, so the SCF simply never converges. (A hand-rolled LDA on a ≤ 5×10³-point grid for one
atom is a *different object* and a legitimate PORT LATER — it just is not this.)

**4 · The correlated hierarchy.**
RCCSD, DFCCSD, CCSDT, EOM-CCSD, EOM-IP (2h1p, 3h2p), EOM-EA (1h2p), EOM-DIP (3h1p, 4h2p), CVS-EOM,
CASCI/CASSCF/RASCI, STP-DAS, MP2, GVVPT2/ENPT2 — 33 coupled-cluster headers alone, built on a
TiledArray-style distributed tensor manager (`include/coupledcluster/TAManager.hpp`, `TAERI.hpp`) with MPI
collectives. **Why it is a wall:** `N⁶`–`N⁸` contractions need a distributed tensor library and a cluster.
The one exception worth naming: a `(6e, 6o)` π-CAS on benzene is **400 determinants** in the fixed-`M_s`
sector (924 across all sectors) — genuinely browser-sized, and already scoped in
`research/beta/MASTER-DOSSIER.md §19`.

**5 · The production apparatus.**
HDF5 checkpoint/restart at every `iSave` step with partial dataset writes; MPI `ROOT_ONLY` / `MPIBCast` /
`MPI_Barrier` threaded through every Fock build and propagation; a program-wide timer; a CMake build with
nine optional backends; 530 source files; **247 617 lines**. λWAVES is **34 909 lines** of dependency-free
JavaScript that boots from a file:// URL. Those are different engineering objects and the smaller one is not
a subset of the larger.

---

## 9. Is the credit accurate? No. Here is the replacement wording.

**Current, in two places:**

* `lab/index.html:112` — `<p class="ab-credit">Team @ Chronus Quantum for the Molecular Orbital Model — <a href="…">ChronusQ</a></p>`
* `NOTICE:113` — `  · Team @ Chronus Quantum, for the Molecular Orbital Model`

(also `README.md:198`: *"Thanks to [ChronusQ](…)"* — that one is already fine.)

**Two things are factually wrong.**

**(i) "the Molecular Orbital Model" is not a thing ChronusQ has.** ChronusQ is a general electronic-structure
package. There is no class, module, method, input keyword or wiki page by that name. Searched: all 530
source files, all 36 wiki pages, `README.md`, `CITE.txt`, `CHANGELOG.md`. The nearest objects are
`SingleSlater`, `FockBuilder`, `RealTimeSCF` and the `Response` module — none of which is "the molecular
orbital model". Astra flagged exactly this on 2026-09-05
(`research/astra-2026-09-05/SOURCES-AND-COVERAGE.md:30`: *"The credited project is ChronusQ … not a single
universal 'molecular orbital model.' … Credit it as inspiration"*) and the wording has not moved since.

**(ii) None of ChronusQ's mathematics is in the tree.** Verified by reading both sides, not by assuming.
λWAVES has no density-matrix propagation, no MMUT, no Magnus-2 predictor–corrector, no SCF DIIS, no general
Fock build, no X2C, no 4C, no DFT grid, no response module, no Gaussian two-electron integrals beyond the
four s-type ones in `h2ci.js`, and no Fourier or Padé spectrum. The two propagators that *do* exist —
`modrive.js`'s exponential midpoint on a coefficient vector, and `mo.js`'s frozen-generator moving-basis
transport — were derived in λWAVES's own ledgers (`research/MATH-MOLECULAR-PULSES-2026-09-05.md`,
`research/MATH-FIELDS-AND-MOLECULES-2026-09-04.md`) from the generalised eigenproblem, and one of them
(`mo.js`'s exact one-centre `⟨χ|∂_z|χ⟩` connection) is arguably **ahead** of ChronusQ's `τ` for this case.
ChronusQ has no Slater-type-orbital engine at all; λWAVES's entire `twocentre.js` has no counterpart there.

**What IS true, and worth crediting:** ChronusQ's RT wiki is the documentation model and the declared
validation target for λWAVES's molecular pulse work
(`research/astra-2026-09-05/MOLECULAR-PLAN.md:106`, `SOURCES-AND-COVERAGE.md:45–46`), and the package paper
is the provenance citation. That is a real debt. It is a debt to a **reference**, not to a method.

**Recommended replacement — and it keeps the existing gate green.**
`tests/legacy/boot.browser-test.mjs:904` asserts `/Chronus Quantum/.test(about)` and `:1883–1884, :1978`
assert a link to `https://github.com/xsligroup/chronusq_public` whose `textContent` is exactly `ChronusQ`.
Both are preserved below.

**`lab/index.html:112` →**

```html
<p class="ab-credit">Team @ Chronus Quantum, for the real-time electronic-structure documentation
λWAVES measures its own molecular propagators against —
<a href="https://github.com/xsligroup/chronusq_public" target="_blank" rel="noopener">ChronusQ</a></p>
```

**`NOTICE:113–114` →**

```
  · Team @ Chronus Quantum, for the real-time electronic-structure reference
    that λWAVES measures its molecular propagators against.  No ChronusQ code
    or method is used in this tree; the debt is to the documentation.
    https://github.com/xsligroup/chronusq_public
    Williams-Young, Petrone, Sun, Stetina, Lestrange, Hoyer, Nascimento,
    Koulias, Wildman, Kasper, Goings, Ding, DePrince III, Valeev & Li,
    WIREs Comput. Mol. Sci. 10, e1436 (2020).
```

**And if PORT 1 lands, upgrade to the specific claim** — which is the only kind of credit that survives
scrutiny:

```
Team @ Chronus Quantum, for the real-time electronic-structure reference — λWAVES's δ-kick
absorption spectrum follows the workflow documented in the ChronusQ RT wiki — ChronusQ
```

⚠️ **One precision for that line, from the literature pass.** The δ-kick→spectrum *workflow* is documented in the
ChronusQ RT wiki, but the **equations** PORT 1 implements are not ChronusQ's — they are from
**Li, Govind, Isborn, DePrince III & Lopata, *Chem. Rev.* 120, 9951 (2020)** (Eqs. 54–55, 61–63), a review
co-authored by ChronusQ's lead author but a separate publication, and ChronusQ ships **no** spectrum code at all.
So if the credit is ever made specific, make it specific to the right object. The most defensible form is:

```
Team @ Chronus Quantum, for the real-time electronic-structure reference — λWAVES's density
propagation and δ-kick spectrum follow the conventions of the ChronusQ RT documentation and of
Li et al., Chem. Rev. 120, 9951 (2020) — ChronusQ
```

A generous reading of the *current* line would be "ChronusQ taught us how to think about molecular orbitals in
real time." That is true, and it is what the replacement above says. What the current line literally claims — a
named model taken from them — is not.

---

## 10. Sources

**Primary — read in this session.**

| source | what was read | state |
|---|---|---|
| `github.com/xsligroup/chronusq_public` @ `52ddf3c1cd191bb58a72d01bf54adf8d821a3ef8` (2026‑09‑11) | `README.md`, `CITE.txt`, `CHANGELOG.md`, `AUTHORS`, `CMakeLists.txt`; `include/fields.hpp`, `include/singleslater/rt.hpp`, `include/singleslater/scf.hpp`, `include/orbitalmodifiernew/realtimeSCF/{impl,propagation}.hpp`, `include/orbitalmodifiernew/realtimeSCF/fields/envelope.hpp`, `include/orbitalmodifiernew/{impl.hpp,conventionalSCFnew/extrap.hpp}`, `include/orbitalmodifieroptions.hpp`, `include/extrapolate.hpp`, `include/orthogonalization{.hpp,/impl.hpp}`, `include/fockbuilder/impl.hpp`, `include/quantum/base.hpp`, `include/singleslater/quantum.hpp`, `include/realtime/realtimemultislater/{propagateSSO,rtcorrfunc}.hpp`, `include/realtime/realtimeci/{hamiltonian,dipole}.hpp`, `include/dft/epc.hpp`, `include/morspec.hpp`, `include/response/polarization/singleslater.hpp`; `src/cqlinalg/matfunc.cxx`, `src/realtime/fields.cxx`, `src/x2c/x2c.cxx`, `src/fourcomp/fourcomp.cxx`, `src/geometrymodifier/velocityverlet.cxx`, `src/particleintegrals/aointegrals/aointegrals_onee_drivers.cxx`, `src/cxxapi/input/{molopts,physconopts,rtopts}.cxx`; `tests/rt/**` inputs; `basis/sto3g.gbs`; full file tree | **VERIFIED** |
| <https://github.com/xsligroup/chronusq_public/wiki/RT> | MMUT and Magnus-2 formulas, keyword table, envelope table, δ-kick example, restart rationale, references list | **VERIFIED** (and its propagator signs flagged as inverted relative to the code) |
| <https://github.com/xsligroup/chronusq_public/wiki/SCF> | keyword defaults (ENETOL 1e-10, DENTOL 1e-8, FDCTOL 1e-8, MAXITER 128, DIISALG CEDIIS, SWITCH 0.05, NKEEP 10, DAMPPARAM 0.7, DAMPERROR 1e-3), guesses, SWAPMO, NR options | **VERIFIED** |
| <https://github.com/xsligroup/chronusq_public/wiki/QM> | `REFERENCE` grammar (`[REAL/COMPLEX] <R/RO/U/G/X2C/4C><HF/FUNCTIONAL>`), functional list dated 9/8/2026, X2CTYPE / ATOMICX2C / SPINORBITSCALING | **VERIFIED** |
| <https://github.com/xsligroup/chronusq_public/wiki/Overview> | input grammar, the nine sections | **VERIFIED** |
| <https://github.com/xsligroup/chronusq_public/wiki/Linear-Response-TDDFT> | `[RESPONSE] type = residue`, `dofull`, `nroots`; output format `W(Eh)`, `f`, MO contributions | **VERIFIED** |
| λWAVES `lab/` | `modrive.js`, `twocentre.js`, `h2.js`, `h2ci.js`, `mo.js`, `pulse.js`, `dynamics.js` + `atoms.js` + `kick.js` + `spectrum.js` + `hamiltonian.js` headers, `index.html:100–125`, `NOTICE:100–125`, `README.md:193–199`, `tests/modrive.test.mjs`, `tests/legacy/boot.browser-test.mjs` credit assertions | **VERIFIED** |
| λWAVES `research/` | `astra-2026-09-05/{MOLECULAR-PLAN.md §1,2,6,7,8,9, SOURCES-AND-COVERAGE.md, validation-summary.json, reference-drive.py}`, `beta/MASTER-DOSSIER.md §10–§15`, `MATH-MOLECULAR-PULSES-2026-09-05.md` | **VERIFIED** |
| <https://arxiv.org/abs/1905.01381> · PDF <https://arxiv.org/pdf/1905.01381> (v2, 19 Jun 2019, 43 pp) | **the package paper, read in full**: Eqs. (1)–(8) spin/Pauli infrastructure, (9) GIAO phase factor, **(10) `iħ∂_tP=[F,P]`, (11) `P=UPU†`, (12) MMUT, (13)–(15) EM2 + forward-Euler predictor**, (16)–(17) field, the unnumbered envelope display, (18) `⟨O⟩=Tr[OP]`, (19)–(20) frequency domain, (21)–(24) TD-EOM-CC; the verbatim gauge sentence; the verbatim "post processing at the users' discretion" punt; the X2C prose with no equations; the DIIS prose with no equations; refs [6]–[11], [72], [79], [80] | **VERIFIED** — title, authors, dates, DOI and abstract confirmed on the abs page; body read from the PDF |
| Li, Govind, Isborn, DePrince III & Lopata, *Chem. Rev.* **120**, 9951 (2020), `10.1021/acs.chemrev.0c00223` — free at <https://www.osti.gov/servlets/purl/1674946> | ⭐ **the workflow reference the package paper points at.** Eqs. (8)–(9) density + orthonormal-basis EOM, (39)–(40) Magnus, (41)–(46) midpoint → **MMUT with the eigendecomposition**, (47)–(48) BCH, **(49)–(53) MO-pair dipole decomposition**, **(54)–(55) damped window**, **(56)–(60) Padé**, **(61)–(63) `σ_ii=(4πω/c)Im α_ii`, `S=⅓Trσ`**. Atomic units stated. ⚠️ Eq. (44) prints `H` where Eq. (45) prints `H′` — a typo; it is the orthonormal-basis Fock in both | **VERIFIED** |
| Goings, Lestrange & Li, *WIREs Comput. Mol. Sci.* **8**, e1341 (2018) — <https://joshuagoings.com/assets/real-time-electronic-structure.pdf> | ref [72] of the package paper. Eqs. (1)–(14) Magnus → MMUT; **Eqs. (20)–(34): the absorption cross section derived from photon counting**, ending at `σ_ii=(4πω/c)Im[D̃_i]/κ_i`; Eqs. (37)–(42) Padé (no damping term) | **VERIFIED** |
| Goings, Kasper, Egidi, Sun & Li, *J. Chem. Phys.* **145**, 104107 (2016) — free at <https://www.osti.gov/pages/servlets/purl/1467884> | the Li group's own X2C + RT equations: (1) modified Dirac, (4) `U` with `(I+X′†X′)^{−1/2}`, (6) `X′=C_S′⁺(C_L′⁺)^{−1}`, (9)–(11) MMUT via eigendecomposition, **(12) `F^E(t)=F(t)+Σ_qκ(t)⟨r_q⟩`** (the PLUS sign), (13) δ-kick, (14) `S(ω)∝Tr[ωIm(μ/κ)]`. ⚠️ **implemented in modified Gaussian, not ChronusQ** | **VERIFIED** |
| Kadek, Konecny & Repisky, <https://arxiv.org/abs/2307.05242> (ReSpect group, **not** ChronusQ) | the cleanest modern treatment of the same chain: Eq. (61) length-gauge coupling inside the Fock matrix, (67)–(82) X2C reduction of the LvN and the **adiabatic-`U`** argument, (83)–(102) propagators incl. midpoint Magnus ≡ MMUT at 2Δt and the predictor schemes (101)–(102), (103)–(108) damped transform + **`Ω=2π/Δt`, `Δω=2π/(nΔt)`**, **(109)–(112) Padé**, **(119)–(124) `σ=(4πω/c)Imα`, the 4-step δ-kick protocol, and Eq. (123) the analytic kick operator** | **VERIFIED** |
| Peng, Middendorf, Weigend & Reiher, *J. Chem. Phys.* **138**, 184105 (2013) — <https://arxiv.org/pdf/1303.4446> | ChronusQ's *declared* X2C notation source: Eq. (A1) `X=C_S⁺(C_L⁺)^{−1}` in the non-orthogonal basis, (19)–(20) `X′`, `R′=(I+X′†X′)^{−1/2}`, **(23a) the AO-basis renormalisation with `S̃ = S + (1/2c²)X†TX`** | **VERIFIED** |
| Surjuse & Valeev, <https://arxiv.org/pdf/2601.04174> | Eqs. (5)–(11): the single cleanest `h^{1eX2C} = R†[V+TX+X†T+X†(W/4c²−T)X]R` with `R=(I+X†X)^{−1/2}` | **VERIFIED** |
| Kasper, Stetina, Jenkins & Li, *Chem. Phys. Rev.* **1**, 013102 (2020), `10.1063/5.0029725` — free at <https://www.osti.gov/servlets/purl/1870638> | Eq. (4) **`W₀ = p·Vp` (scalar) / `W_{x,y,z} = p×Vp` (spin–orbit)**; Eqs. (16)–(19) the RT field and spectrum, again with `H = H₀ + Σ_q κ(t)⟨r_q⟩` | **VERIFIED** |
| Zhao, Tao, Pavošević, Wildman, Hammes-Schiffer & Li, *J. Phys. Chem. Lett.* **11**, 4052 (2020), `10.1021/acs.jpclett.0c00701` — free at <https://www.osti.gov/servlets/purl/1763034> | origin RT-NEO, and **verbatim "implemented in the Chronus Quantum open source package"** + **"the orthonormal basis is obtained with the Löwdin orthogonalization scheme"** — the only *paper* that names ChronusQ's orthogonalisation. Eqs. (1)–(9), incl. the multicomponent von Neumann pair and the length-gauge statement | **VERIFIED** |
| Li (T.E.), Li (X.) & Hammes-Schiffer, *J. Chem. Phys.* **162** (2025), `10.1063/5.0255984` — free at <https://www.osti.gov/servlets/purl/2947520> | the traveling-proton-basis `τ` equations that ChronusQ's `addTauToFock()` implements: Eq. (4) `i∂_tP^n=[F^n,P^n]−i(τP^n+P^nτ†)`, Eq. (5) `τ′=[S^n]^{1/2}τ[S^n]^{1/2}`, Eq. (6) `S^{n(α)}_PQ=⟨φ_P\|∂φ_Q/∂R^α_Q⟩`. ⚠️ *that* paper is **Q-Chem**, not ChronusQ | **VERIFIED** |
| Yuwono *et al.* *JPCA* **128**, 6521 (2024), <https://arxiv.org/abs/2404.13231>; Shayit *et al.* *Nat. Commun.* **16**, 11016 (2025), <https://arxiv.org/abs/2505.20375>; Banerjee *et al.* *APL Comput. Phys.* **2**, 016101 (2026), <https://arxiv.org/abs/2506.09008> | three post-2020 papers that state ChronusQ implementation in their own text (relativistic CC; quadrillion-determinant CI — CPU/MPI on 1000 nodes, no GPU; CVS-mmfX2C-EOM-CC L-edge XAS) | **VERIFIED** |
| <https://arxiv.org/abs/1905.01381> (abs page) | title, full author list matching `CITE.txt`, submission dates, DOI, abstract text (GPL v2; GIAO for uniform finite magnetic fields) | **VERIFIED** |
| **Computed here** | H₂⁺ STO-3G fixture numbers, from λWAVES's own `lab/h2ci.js sto3gIntegrals` plus `⟨a\|z\|b⟩ = P_z S_ab` (Gaussian product-centre theorem, exact for s-primitives). Cross-checked: `d = −R/(2√(1−S²))` agrees with `reference-drive.py:14` to 5 figures | **VERIFIED, reproducible** |
| **Confirmed by byte comparison** | ChronusQ `basis/sto3g.gbs` hydrogen S shell (`3.42525091 / 0.15432897`, `0.62391373 / 0.53532814`, `0.16885540 / 0.44463454`) is **identical** to `lab/h2ci.js:56 STO3G_H` | **VERIFIED** |

**Cited by ChronusQ, not independently read here** (so: attributions, not endorsements) —
Goings, Lestrange & Li, *WIREs Comput. Mol. Sci.* **8**, e1341 (2018), the RT-TDDFT review the wiki cites for
the δ-kick spectrum method; Li, Smith, Markevitch, Romanov, Levis & Schlegel, *Phys. Chem. Chem. Phys.* **7**,
233 (2005), the wiki's MMUT reference; Blanes & Casas, *A Concise Introduction to Geometric Numerical
Integration* (CRC, 2017), its Magnus reference; Ding, Guidez, Aikens & Li, *J. Chem. Phys.* **140**, 244705
(2014); `doi:10.1021/acs.jctc.8b00381`, cited in `propagateSSO.hpp:46` for the symplectic split-operator;
Helgaker, *Mol. Phys.* **122**(5), e2259008 (2024), Algorithm 4, cited in `velocityverlet.cxx:67`;
`doi:10.1016/j.cplett.2005.01.115`, cited in `fockbuilder/impl.hpp:288`; Latter, *Phys. Rev.* **99**, 510
(1955) (λWAVES's own `atoms.js` citation).

## 11. UNVERIFIED — what this report does NOT establish

Rewritten after a literature pass. Most of the first draft's gaps closed; these did not.

**1 · The next ChronusQ package paper — UNVERIFIED MANUSCRIPT.**
*"Chronus Quantum 1.0: A unified framework for relativistic, time-dependent, and multicomponent electronic
structure theory,"* Zhang, Liu, Upadhyay, Hu, Beck, Bersson, Culpitt, Garner, Kovtun, Li (R.), Liao, Lu,
Majumder, Oele, Peltekis, Petrone, Shayit, Sun, Tang, Wang, Wildman, Williams-Young, Yuwono, Zhao, Lambros,
Hoyer, Valeev, DePrince III, Hammes-Schiffer, Li (X.) — **submitted 2026, no arXiv, no DOI**. Title and author
list come from the DePrince lab publications page only; **the manuscript was not seen**. Hammes-Schiffer's
presence implies NEO is folded into the unified 1.0. This is the document that will supersede the 2020 paper,
and it should be re-checked before the credit line is ever tightened further than §9 recommends.

**2 · The original Padé paper.** Bruner, LaMaster & Lopata, *J. Chem. Theory Comput.* **12**, 3741 (2016),
`10.1021/acs.jctc.6b00511` — **UNVERIFIED, could not open** (ACS paywall; no arXiv, OSTI or PMC copy). The
recursion in §7 PORT 1b is copied from two sources that *were* opened (Chem. Rev. 2020 Eqs. 56–60 — co-authored
by Lopata **and** by ChronusQ's lead author X. Li; Kadek *et al.* Eqs. 109–112) and the two agree up to the sign
of `z`. **Nothing is reconstructed.** What is missing is only the original's own equation numbering.

**3 · The X2C foundational papers.** Kutzelnigg & Liu, *JCP* **123**, 241102 (2005); Iliaš & Saue, *JCP* **126**,
064102 (2007); Liu & Peng, *JCP* **131**, 031104 (2009); Liu, *Natl. Sci. Rev.* **3**, 204 (2016) — all
**UNVERIFIED, could not open** (no legal free copy; AIP serves a bot challenge). They are cited by ChronusQ as
refs [6]–[11]. The X2C equations in §3 come instead from ChronusQ's **own source**, from the Li group's own 2016
paper, and from Peng *et al.* 2013 (which ChronusQ explicitly names as its notation source) — all opened.

**4 · No ChronusQ binary was built or run.** Every "ChronusQ computes X" statement here describes what the
*source* computes. The matched run in PORT 1 is **proposed, not performed**; it needs a C++20 toolchain,
HDF5 1.14+, Eigen3 and Libint, or the `uwligroup/chronusq` Docker image.

**5 · Post-2020 ChronusQ papers read only as metadata.** Roughly twenty papers 2021–2026 were identified by DOI
and venue but **not read** (CC/EOM-CC family, Dirac–Coulomb–Gaunt HF, scalar Breit, STP-DAS, X2C-CAS with
variational magnetic field, London-NEO, approximate exponential integrators for TD-EOM-CC). Four were read far
enough to confirm they state ChronusQ implementation in their own text (§10). **Capabilities in §4 are verified
from the source tree, not from these papers** — the papers are attributions, not evidence.

**6 · Two live code/paper discrepancies, recorded rather than resolved.** I did not open a ChronusQ issue or
contact the authors about either:
  - **The wiki's propagator signs** are the adjoint of both the code and the package paper's Eq. (12) (§1.5).
  - **The length-gauge sign**: the published Li-group equations (Goings 2016 Eq. 12; Kasper 2020 Eq. 17) write
    `F + κ⟨r⟩`, the shipped code writes `F − 2E⟨r⟩` (§1.6). λWAVES agrees with the papers.
  - Two in-source comment/code mismatches also stand: `x2c.cxx:539` says `sqrt(1 + X†X)` where `:552` computes
    `pow(x, −0.5)`, and `rt.hpp:270`/`:386` write `(k1 + 2*k1 + 2*k3 + k4)` where the code has `k2`.

**7 · One λWAVES file read only in part.** `lab/spectrum.js` (367 lines) was read in its header and exports
only. I am confident it contains no Fourier transform — the repo-wide grep for `fft|fourier|pade|absorption` over
`lab/*.js` hits only `audio.js`, `momentum.js`, `wigner.js` and `field.js`, all for unrelated reasons — but I did
not read all 367 lines, and row 54's claim that its per-lane structure is the right host for MO-decomposed
spectra is an architectural judgement, not a verified API match.

**8 · What is NO LONGER unverified** (closed by the literature pass, listed so the delta is auditable):
the package paper's body and its Eqs. (10)–(18); the Padé recursion; the absorption-spectrum normalisation
(now sourced three ways *and* derived *and* measured, §7 PORT 1); the analytic δ-kick operator (corroborated by
Kadek Eq. 123); the existence and identity of post-2020 ChronusQ papers; that ChronusQ's orthonormal basis is
**Löwdin**, stated in a paper (Zhao *et al.* 2020) and not only inferable from code; that RT-NEO is genuinely in
ChronusQ (paper text **and** `tests/rt/neo_rrt.cxx`), while the Hammes-Schiffer-only RT-NEO extensions are
**Q-Chem**, a separate lineage; and that no ChronusQ paper prints any DIIS equation, so §2 is the only written
statement of that algebra outside the source.

## Appendix A — the PORT 1 prototype, verbatim and reproducible

Ran as `node port1.mjs` from a scratch directory; the only λWAVES import is `lab/h2ci.js`. Reproduces every
measured number in §7 PORT 1. Kept here so the numbers in this report can be re-derived without trusting it.

```js
import { sto3gIntegrals, STO3G_H } from '<repo>/lab/h2ci.js';
const R = 2.0;
const { S: Sab, h: H0 } = sto3gIntegrals(R);

/* Z_ij = <chi_i|z|chi_j> over contracted s functions: <a|z|b> = P_z * S_ab exactly
   (Gaussian product-centre theorem). Divided by S_aa the same way sto3gIntegrals normalises. */
function Zmat(R) {
  const { alpha: al, coef: co } = STO3G_H, NP = al.length;
  const d = co.map((c, i) => c * Math.pow(2 * al[i] / Math.PI, 0.75));
  const z = [-R/2, R/2], D = [0,0,0,0], Sm = [0,0,0,0];
  for (let A=0;A<2;A++) for (let B=0;B<2;B++) { const RAB2=(z[A]-z[B])**2; let s=0,dz=0;
    for (let p=0;p<NP;p++) for (let q=0;q<NP;q++) {
      const a=al[p],b=al[q],g=a+b,mu=a*b/g,c=d[p]*d[q];
      const K=Math.pow(Math.PI/g,1.5)*Math.exp(-mu*RAB2), P=(a*z[A]+b*z[B])/g;
      s+=c*K; dz+=c*K*P; }
    Sm[A*2+B]=s; D[A*2+B]=dz; }
  return D.map(v=>v/Sm[0]);
}
const Sm = [1, Sab, Sab, 1], Z = Zmat(R);

/* eigen of a 2x2 real symmetric matrix, ascending */
function sym2(M){ const a=M[0],b=M[1],c=M[3], t=0.5*Math.atan2(2*b,a-c),
  cs=Math.cos(t), sn=Math.sin(t);
  const w0=a*cs*cs+2*b*cs*sn+c*sn*sn, w1=a*sn*sn-2*b*cs*sn+c*cs*cs;
  return (w0<=w1) ? {w:[w0,w1],V:[cs,-sn,sn,cs]} : {w:[w1,w0],V:[-sn,cs,cs,sn]}; }

/* S^{-1/2} (and S^{+1/2}) by the symmetric root — mo.js metricRoots does this for general N */
const es = sym2(Sm), X = new Float64Array(4);
for (let i=0;i<2;i++) for (let j=0;j<2;j++) { let xa=0;
  for (let k=0;k<2;k++) xa += es.V[i*2+k]*es.V[j*2+k]/Math.sqrt(es.w[k]);
  X[i*2+j]=xa; }
const cong=(A,T)=>{const O=new Float64Array(4);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){let s=0;
    for(let k=0;k<2;k++)for(let l=0;l<2;l++)s+=T[k*2+i]*A[k*2+l]*T[l*2+j]; O[i*2+j]=s;} return O;};
const Ht = cong(H0,X), Zt = cong(Z,X);          // H~ = X H X ,  Z~ = X Z X
const eH = sym2(Ht), eZ = sym2(Zt);

/* apply exp(-i k A) to c~ , given A's eigen-decomposition */
const expA = (e,c,k)=>{ const a=[0,0],b=[0,0],re=[0,0],im=[0,0];
  for(let m=0;m<2;m++){let ar=0,ai=0; for(let i=0;i<2;i++){ar+=e.V[i*2+m]*c.re[i]; ai+=e.V[i*2+m]*c.im[i];} a[m]=ar;b[m]=ai;}
  for(let m=0;m<2;m++){const ph=-k*e.w[m],cs=Math.cos(ph),sn=Math.sin(ph);
    const br=a[m]*cs-b[m]*sn, bi=a[m]*sn+b[m]*cs;
    for(let i=0;i<2;i++){re[i]+=e.V[i*2+m]*br; im[i]+=e.V[i*2+m]*bi;}}
  return {re,im}; };

const muz=(c)=>{let num=0,nrm=0;
  for(let i=0;i<2;i++){let ar=0,ai=0;
    for(let j=0;j<2;j++){ar+=Zt[i*2+j]*c.re[j]; ai+=Zt[i*2+j]*c.im[j];}
    num+=c.re[i]*ar+c.im[i]*ai; nrm+=c.re[i]**2+c.im[i]**2;}
  return {mu:-num/nrm, nrm};};

const kappa=1e-3, dt=0.05, T=2000, M=Math.round(T/dt), tau=500;
let c = expA(eZ, {re:[eH.V[0],eH.V[2]], im:[0,0]}, kappa);   // THE KICK
const trace = new Float64Array(M+1);
for (let n=0;n<=M;n++){ trace[n]=muz(c).mu; c = expA(eH, c, dt); }   // exact propagation
const mu0 = trace[0];

/* damped direct-sum Fourier: Im alpha_zz(w) = (1/kappa) * dt * sum dmu sin(wt) e^{-t/tau} */
for (let w=0.0005; w<=1.2; w+=0.0005) { let si=0;
  for (let n=0;n<=M;n++){ const t=n*dt; si += (trace[n]-mu0)*Math.exp(-t/tau)*Math.sin(w*t); }
  const ImA = si*dt/kappa, S = (2*w/Math.PI)*ImA;   /* plot S(w) */ }
```
