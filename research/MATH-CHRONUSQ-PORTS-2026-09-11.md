# The ChronusQ ports — the mathematics, with proofs and gates

Commissioned by Josh (2026-09-11: "I do want to synthesize mathematics out of it and not let anything they have go to waste, incorporate anything you see makes our vision possible"). Written by Claude Fable 5.1. Atomic units throughout. Evidence: `research/chronusq-2026-09-11/A-CHRONUSQ-MAP.md` (ChronusQ at HEAD 52ddf3c1, package paper WIREs 10, e1436), the modules `lab/gaussian.js`, `lab/scf.js`, `lab/density.js`, `lab/absorb.js`, their proofs `tests/scf.test.mjs`, `tests/density.test.mjs`, `tests/absorb.test.mjs`, and the independent oracle `research/chronusq-2026-09-11/oracle-pyscf.py` (PySCF 2.x, same primitives, imports no app code). Status tags: KNOWN (cited), DERIVED-HERE (proved below and gated), MEASURED (a number the gate reproduces), UNVERIFIED.

## 1. The objects

**Definition 1 (basis and metric).** Real basis functions $\chi_\mu$, overlap $S_{\mu\nu} = \langle \chi_\mu \vert \chi_\nu \rangle$, core Hamiltonian $h_{\mu\nu}$, dipole $Z_{\mu\nu} = \langle \chi_\mu \vert z \vert \chi_\nu \rangle$, two-electron integrals in chemist's notation $(\mu\nu \vert \lambda\sigma) = \iint \chi_\mu(1)\chi_\nu(1)\, r_{12}^{-1}\, \chi_\lambda(2)\chi_\sigma(2)$. Löwdin roots $X = S^{-1/2}$, $W = S^{1/2}$.

**Definition 2 (density).** For occupied orbital columns $c_a$ with occupation $f$ (2 for a closed shell, 1 for one electron), $D = f\sum_a c_a c_a^\dagger$, spin-summed, Hermitian, $N_e = \operatorname{Tr}(DS)$. In the Löwdin frame $P = WDW$, $\tilde F = XFX$, $D = XPX$.

**Definition 3 (the closed-shell Fock matrix).** KNOWN, Szabo–Ostlund eq. 3.154:
$$ F_{\mu\nu}[D] = h_{\mu\nu} + E(t)\,Z_{\mu\nu} + \sum_{\lambda\sigma} D_{\lambda\sigma}\Big[(\mu\nu\vert\sigma\lambda) - \tfrac12(\mu\lambda\vert\sigma\nu)\Big], $$
with the length-gauge coupling $+E(t)\,\hat z$ per electron (the convention of `modrive.js` and of the ChronusQ papers; the ChronusQ code carries the opposite sign with the opposite energy bookkeeping, A §1.6).

## 2. Propagation

**Proposition 1 (equation of motion).** DERIVED-HERE. If $i\,\dot{\tilde c}_a = \tilde F \tilde c_a$ for every occupied orbital and $P = f\sum_a \tilde c_a \tilde c_a^\dagger$, then $i\,\dot P = [\tilde F, P]$.
**Proof.** $\dot P = f\sum_a (\dot{\tilde c}_a \tilde c_a^\dagger + \tilde c_a \dot{\tilde c}_a^\dagger) = f\sum_a(-i\tilde F \tilde c_a \tilde c_a^\dagger + i\,\tilde c_a \tilde c_a^\dagger \tilde F) = -i(\tilde F P - P\tilde F)$, using $\tilde F^\dagger = \tilde F$. $\square$

**Proposition 2 (the unitary step and its invariants).** DERIVED-HERE. For $\tilde F$ frozen on $[t, t+\Delta t]$ the exact solution is $P(t+\Delta t) = U P(t) U^\dagger$ with $U = e^{-i\Delta t \tilde F} = V e^{-i\Delta t w} V^\dagger$, $\tilde F = V w V^\dagger$. For any Hermitian $\tilde F$ and any $\Delta t$: (i) $\operatorname{Tr}P$ is preserved exactly; (ii) $(P/f)^2 = P/f$ is preserved exactly; (iii) $U$ is unitary, so the step has no stability limit.
**Proof.** (i), (ii): $P \mapsto UPU^\dagger$ is a similarity, so the spectrum of $P$ is invariant; the trace is the spectral sum and idempotency is the statement that the spectrum of $P/f$ lies in $\{0,1\}$. (iii): $U^\dagger U = V e^{+i\Delta t w} V^\dagger V e^{-i\Delta t w} V^\dagger = I$. $\square$
**Corollary 2.1 (the diagnostic law).** A drift of $\operatorname{Tr}(DS)$ under any unitary integrator is a defect of $S^{\pm 1/2}$, never of the integrator. MEASURED: $\operatorname{Tr}(DS) = 2 + 3.6\times10^{-13}$ after 1600 Magnus-2 steps through a pulse; idempotency defect $9\times10^{-14}$.
**Corollary 2.2 (the silent failure).** By (iii) a too-large $\Delta t$ produces a perfectly normalised, idempotent, wrong density. The only honest convergence statement is the halving law of Proposition 4.

**Definition 4 (Magnus-2 predictor–corrector).** KNOWN, ChronusQ paper Eqs. 10–15. $F_0 = \tilde F[P(t), t]$; $P^* = e^{-i\Delta t F_0} P(t) e^{+i\Delta t F_0}$; $F_1 = \tilde F[P^*, t+\Delta t]$; $\bar F = \tfrac12(F_0 + F_1)$; $P(t+\Delta t) = e^{-i\Delta t \bar F} P(t) e^{+i\Delta t\bar F}$ from the saved $P(t)$. **MMUT:** $P(t+\Delta t) = e^{-2i\Delta t \tilde F(t)} P(t-\Delta t) e^{+2i\Delta t\tilde F(t)}$, restarted by a Magnus-2 step every 50 steps.

**Proposition 3 (one electron).** DERIVED-HERE. For $N_e = 1$ and a prescribed field, $\tilde F$ does not depend on $P$, $F_0 = \tilde F(t)$, $F_1 = \tilde F(t+\Delta t)$, and the Magnus-2 step is the exponential of the endpoint average; for a constant field it is exact and coincides with `modrive.js`'s exponential midpoint. For a smooth field, $\tfrac12(\tilde F(t)+\tilde F(t+\Delta t)) = \tilde F(t+\tfrac{\Delta t}{2}) + O(\Delta t^2)$, so the two schemes differ by $O(\Delta t^2)$ globally.
**Proof.** Substitution into Definition 4; the Taylor expansion of the field about the midpoint. $\square$ MEASURED: constant field, $\langle z\rangle$ agrees with `modrive.js` to $10^{-11}$ over 40 steps of $\Delta t = 0.5$; the sin² pulse of `reference-drive.json` gives $\max\lvert\Delta\langle z\rangle\rvert = 1.17\times10^{-4},\ 2.93\times10^{-5},\ 7.33\times10^{-6}$ at $\Delta t = 0.1, 0.05, 0.025$, ratios 4.00 and 4.00.

**Proposition 4 (the halving law).** KNOWN (Magnus expansion, local error $O(\Delta t^3 \lVert[\tilde F(t), \tilde F(t')]\rVert)$). Over a fixed window, halving $\Delta t$ divides the global error by 4. MEASURED for two electrons through a near-resonant pulse (H₂ STO-3G, $A = 0.02$, $\omega = 1.0$, 40 a.u.): the field-free energy drift over the following 10 a.u. falls $2.2\times10^{-6} \to 2.8\times10^{-7}$ (ratio 8.00) and the forward-then-backward residue $5.9\times10^{-5} \to 7.4\times10^{-6}$ (ratio 7.99): third order over a fixed window, better than the bound, and recorded as measured rather than claimed.

## 3. Linear response

**Theorem 1 (two-level kick response).** DERIVED-HERE. Let $\lvert 0\rangle, \lvert 1\rangle$ be the field-free eigenstates with gap $\omega_{01}$ and dipole element $z_{01}$. After the impulse $e^{-i\kappa \hat z}$ on $\lvert 0 \rangle$, the electron dipole $\mu(t) = -\langle z\rangle(t)$ obeys
$$ \delta\mu(t) = 2\kappa z_{01}^2 \sin\omega_{01} t + O(\kappa^2), \qquad \int_0^\infty S_{zz}(\omega)\,d\omega = 2\omega_{01} z_{01}^2, $$
with $\operatorname{Im}\alpha_{zz}(\omega) = \kappa^{-1}\int_0^\infty \delta\mu(t)\sin\omega t\,dt$ and $S = \tfrac{2\omega}{\pi}\operatorname{Im}\alpha_{zz}$.
**Proof.** To first order $e^{-i\kappa \hat z}\lvert 0\rangle = \lvert 0\rangle - i\kappa z_{01}\lvert 1\rangle + O(\kappa^2)$ up to the phase of $z_{00}$. Under $e^{-iHt}$ the cross term of $\langle z \rangle$ is $2\operatorname{Re}\big[(-i\kappa z_{01})\, e^{-i\omega_{01}t}\big] z_{01} = -2\kappa z_{01}^2\sin\omega_{01}t$; hence $\delta\mu = +2\kappa z_{01}^2\sin\omega_{01}t$. The sine transform of $\sin\omega_{01}t$ is $\tfrac{\pi}{2}\delta(\omega-\omega_{01})$, so $\operatorname{Im}\alpha = \pi z_{01}^2\,\delta(\omega - \omega_{01})$ and $\int S\,d\omega = 2\omega_{01} z_{01}^2$. $\square$
MEASURED (H₂⁺, 1s LCAO Slater basis, $R = 2$, $\kappa = 10^{-3}$, $\Delta t = 0.05$, $T = 2000$, $\tau = 500$): peak 0.3929196 against the gap 0.3929175; amplitude $3.048438\times10^{-3}$ against $2\kappa z_{01}^2 = 3.048441\times10^{-3}$; strength 1.19503 against 1.19779 (the deficit is the finite window). In the 12-function Sturmian basis every peak lies within $3\times10^{-4}$ of an eigenvalue gap and the three lines above 0.5 % carry $2\omega z^2$ to 6 %. The ChronusQ-basis run (STO-3G, $R = 2$) reproduced the report's numbers exactly in a lead re-run: peak 0.477753059 against 0.477747587.

**Observation 1 (finite-window bias).** MEASURED. A pure sinusoid damped to $e^{-T/\tau} = e^{-4}$ returns its frequency to $2.7\times10^{-6}$ when the position is read from $\operatorname{Im}\alpha$ and $3.2\times10^{-6}$ the other way when read from $S$; at $e^{-T/\tau} = e^{-5}$ the window's sinc ripple (spacing $2\pi/T$) produced a forest of false peaks at the 1 % level. Rule adopted in `absorb.js`: positions from $\operatorname{Im}\alpha$, heights from $S$, and $T/\tau \ge 12$ before trusting a weak line.

**Theorem 2 (the RT-RHF kick spectrum is the RPA spectrum).** KNOWN in general (the linear response of time-dependent Hartree–Fock is the random-phase approximation); DERIVED-HERE for the minimal basis. For one occupied orbital $g$ and one virtual $u$ with $\Delta\varepsilon = \varepsilon_u - \varepsilon_g$, $K = (gu\vert gu)$, $J = (gg\vert uu)$, linearising $i\dot P = [F[P], P]$ about $P_0 = 2\lvert g\rangle\langle g\rvert$ with $\delta P_{ug} = 2x$ gives
$$ i\dot x = (\Delta\varepsilon + 2K - J)\,x + K\,x^*, \qquad \omega^2 = (\Delta\varepsilon + 2K - J)^2 - K^2, $$
the singlet RPA with $A = \Delta\varepsilon + 2K - J$, $B = K$.
**Proof.** $\delta F_{ug} = \sum_{kl}\delta P_{kl}(ug\vert lk) - \tfrac12\sum_{kl}\delta P_{lk}(ul\vert kg)$ by Definition 3. The Coulomb sum gives $2xK + 2x^*K$; the exchange sum, with $\delta P_{lk}$ against $(ul\vert kg)$, gives $-\tfrac12(2x^*K + 2xJ)$. Hence $\delta F_{ug} = x(2K - J) + x^*K$. The $(u,g)$ element of $[F_0, \delta P] + [\delta F, P_0]$ is $2\Delta\varepsilon\,x + 2\delta F_{ug}$, and Proposition 1 gives the stated equation. Substituting $x = X e^{-i\omega t} + Y^* e^{i\omega t}$ yields $\omega X = AX + BY$, $-\omega Y = BX + AY$, so $\omega^2 = A^2 - B^2$. $\square$
MEASURED (H₂ STO-3G, $R = 1.4$): $\varepsilon = (-0.578203, 0.670268)$, $K = 0.181258$, $J = 0.663564$, $\omega_{\text{RPA}} = 0.929922$, agreeing with PySCF's TDHF to $10^{-8}$; TDA $= A = 0.947423$ (PySCF, $10^{-8}$); the exact ${}^1\Sigma_u^+$ gap 0.967984 (PySCF FCI, $10^{-9}$). The propagated kick spectrum peaks at 0.930087, on the RPA value to $1.7\times10^{-4}$ and away from TDA and FCI by more than $10^{-2}$.

**Observation 2 (the exchange index order, a caught bug).** DERIVED-HERE and MEASURED. Pairing $D_{kl}$ instead of $D_{lk}$ with $(\mu l\vert k\nu)$ conjugates the exchange for a complex density while leaving every real self-consistent field untouched. The linearisation then reads $i\dot x = (\Delta\varepsilon + K)x + (2K - J)x^*$, $\omega^2 = (\Delta\varepsilon+K)^2 - (2K-J)^2 = 1.3977^2$, and the propagated spectrum peaked at 1.3975 before the fix. Every SCF anchor passed with the wrong order; only the RPA oracle exposed it. The gate now holds the closed form, PySCF, and the propagation to each other.

## 4. The self-consistent field

**Definition 5 (CDIIS).** KNOWN, Pulay 1980, 1982. Error vector $e = FDS - SDF$ carried to the orthonormal frame $\tilde e = X^\top e X$; extrapolated Fock $F = \sum_i c_i F_i$ with $\sum_i c_i = 1$ minimising $\lVert\sum_i c_i \tilde e_i\rVert$, the Lagrangian system $\begin{pmatrix} B & -\mathbf 1 \\ -\mathbf 1^\top & 0\end{pmatrix}\begin{pmatrix} c \\ \lambda\end{pmatrix} = \begin{pmatrix} 0 \\ -1\end{pmatrix}$, $B_{ij} = \langle \tilde e_i, \tilde e_j\rangle$.

**Proposition 5 (rank of the error space).** DERIVED-HERE. In an $n$-function basis $\tilde e$ is antisymmetric, so at most $n(n-1)/2$ error vectors are linearly independent; for $n = 2$ exactly one. With more stored vectors $B$ is singular and the system must drop its oldest members until it is not.
**Proof.** $(FDS - SDF)^\top = SDF - FDS$ for real symmetric $F, D, S$; the transform by $X$ preserves antisymmetry; an antisymmetric $n\times n$ matrix has $n(n-1)/2$ free entries. $\square$ MEASURED: HeH⁺ converged in 6 DIIS cycles against 10 plain and 15 damped ($d = 0.3$) cycles, energy $-2.8606585$ against PySCF $-2.8606584853$ ($10^{-9}$) and Szabo–Ostlund's $-2.8606$; H₂ $-1.116714325$ against Szabo–Ostlund $-1.116714$ and h2ci's closed loop ($10^{-10}$).

## 5. Open problems

1. **Conjecture.** The measured third-order energy drift of Magnus-2 over a fixed window (ratio 8) is generic for a Hermitian predictor–corrector with a time-symmetric corrector, not particular to this fixture. Open: a proof or a counter-fixture.
2. **Open.** A window-corrected estimator that removes the $O(\gamma^2/\omega)$ and $e^{-T/\tau}$ biases of Observation 1 in closed form, so a peak can be trusted below $10^{-6}$ with $T/\tau = 4$.
3. **Open.** The MMUT sublattice divergence rate in terms of $\lVert[\tilde F(t), \tilde F(t')]\rVert$; the restart interval 50 is empirical.
4. **Open.** Whether the exchange-order error of Observation 2 exists in any published real-time code: it is invisible to every ground-state test and shifts every spectrum. UNVERIFIED for ChronusQ, whose exchange build was not read at the element level.

## 6. References

Szabo and Ostlund, Modern Quantum Chemistry (Dover 1996) §3.4–3.5, eq. 3.154, Table 3.4; Pulay, Chem. Phys. Lett. 73, 393 (1980) and J. Comput. Chem. 3, 556 (1982); Williams-Young et al., WIREs Comput. Mol. Sci. 10, e1436 (2020); Goings, Lestrange, Li, WIREs 8, e1341 (2018); Yabana and Bertsch, Phys. Rev. B 54, 4484 (1996); Casida, in Recent Advances in Density Functional Methods (1995); Sun et al., PySCF, J. Chem. Phys. 153, 024109 (2020); Hehre, Stewart, Pople, J. Chem. Phys. 51, 2657 (1969).
