# The state-register ledger — certification of the $\gamma^{AB}$ blocks, the drive, and the canonical gauge

Opus · 18 September 2026 · commissioned by Josh · proving lab for `JUDGMENT.md` §3 and `REGISTER-WINDOW-SPEC.md` §7, §10
Snapshot under test: `proving/snapshot/lab/`, taken from `git show HEAD:lab/…` at commit `8fcdcf8`. Nothing under `lab/` or `tests/` was read live or written.
Reproduce every number: `bash proving/run-all.sh` (log in `proving/run-all.log`).

## 0 · Verdict

| Claim | Verdict | Evidence |
|---|---|---|
| $\gamma^{00}_{ij}=2\delta_{ij}$, other blocks zero | CERTIFIED | Proposition 3(i); max error $0$ |
| $\gamma^{0K}_{ia}=\sqrt2\,X^K_{ia}$, $\gamma^{0K}_{ai}=0$, other blocks zero | CERTIFIED | Proposition 3(ii); max error $2.2\times10^{-16}$ |
| $\gamma^{K0}=(\gamma^{0K})^{T}$ | CERTIFIED for real $X$; for complex $X$ it is $(\gamma^{0K})^{\dagger}$ | Proposition 3(v); max error $2.2\times10^{-16}$ real, $4.4\times10^{-16}$ complex |
| $\gamma^{KL}_{ij}=2\delta_{ij}\langle X^K,X^L\rangle-\sum_a X^K_{ja}X^L_{ia}$ | CERTIFIED | Proposition 3(iii); max error $8.9\times10^{-16}$ |
| $\gamma^{KL}_{ab}=\sum_i X^K_{ia}X^L_{ib}$ | CERTIFIED | Proposition 3(iii); max error $3.3\times10^{-16}$ |
| $\gamma^{KL}$ occ–virt and virt–occ blocks zero | CERTIFIED | Proposition 3(iv); max error exactly $0$ |
| $\langle 0\rvert R\lvert ia\rangle=\sqrt2\,r_{ia}$ | CERTIFIED, and it holds for an arbitrary one-electron operator | Proposition 5(i); max error $4.4\times10^{-16}$ |
| $\langle ia\rvert R\lvert jb\rangle=\delta_{ij}r_{ab}-\delta_{ab}r_{ij}+\delta_{ij}\delta_{ab}\langle 0\rvert R\lvert 0\rangle$ | CERTIFIED as written for the position operator; CORRECTED in general to $-\delta_{ab}r_{ji}$ | Proposition 5(ii); the symmetric case $2.2\times10^{-16}$, the non-symmetric discriminator $1.8\times10^{-15}$ against $2.8$ |
| $D_{ov}=\sqrt2\,\overline{c_0}Z$, $D_{vv}=Z^{\dagger}Z$, $D_{oo}=2\cdot\mathbb 1-ZZ^{\dagger}$ | CERTIFIED | Corollary 6; max error $4.1\times10^{-14}$ over benzene |
| Proposition 2: $b_K=-i\kappa\mu_{Kq}+O(\kappa^2)$ | CERTIFIED | §5; error ratio $4.0000015$ at $\kappa\to\kappa/2$ |
| Proposition 2: $b_0=1+O(\kappa^2)$ | CORRECTED: $b_0=e^{-i\kappa\langle 0\rvert R\lvert 0\rangle}+O(\kappa^2)$, equal to $1+O(\kappa^2)$ only with the origin at the ground-state electronic centroid | §5; $\lvert b_0-1\rvert=6.788\times10^{-4}$ at $\kappa=10^{-3}$, first order, and $6.5\times10^{-7}$ after the shift |
| Proposition 2: the linear replay is the register's first order | CERTIFIED | §5; error ratio $4.000088$ |
| `JUDGMENT.md` §2 Observation 1, $\mathbf j=\tfrac12\sum\operatorname{Im}D_{\mu\nu}(\chi_\nu\nabla\chi_\mu-\chi_\mu\nabla\chi_\nu)$ | REFUTED as a pair with the $\gamma_{pq}=\langle A\rvert E_{pq}\lvert B\rangle$ convention: the two differ by $-1$ | Proposition 7; $2.2\times10^{-18}$ for the corrected sign against $2\lVert\mathbf j\rVert_\infty$ for the published one |
| `REGISTER-WINDOW-SPEC.md` §7 rule 2, "rotate the cluster so the dipoles are mutually orthogonal" | REFUTED as an identity rule: for an E or T cluster the dipoles are mutually orthogonal and equal in length in every gauge, so the clause constrains nothing | Proposition 10, measured on 45 clusters |
| The canonical gauge, restated and implemented | CERTIFIED invariant | Definition 8, Proposition 9; max $\lvert\mathrm{canon}(VQ)-\mathrm{canon}(V)\rvert=7.7\times10^{-15}$ |

Two abstentions are recorded in §9.

## 1 · Conventions, fixed once

Atomic units. $1\ \text{Å}=1/0.52917721092$ bohr, the project's constant. Real MO basis $\{\phi_p\}$, $i,j$ occupied, $a,b$ virtual, $p,q$ unrestricted, $n_o$ occupied orbitals, $n_v$ virtual, $N=2n_o$ electrons. The spin-summed excitation operator is $E_{pq}=\sum_{\sigma}a^{\dagger}_{p\sigma}a_{q\sigma}$.

**Definition 1 (the register).** $\Phi_0$ is a converged RHF determinant; $\Psi_K=\sum_{ia}X^K_{ia}\tfrac{1}{\sqrt2}E_{ai}\Phi_0$ with $\sum_{ia}\lvert X^K_{ia}\rvert^2=1$; $\gamma^{AB}_{pq}=\langle A\rvert E_{pq}\lvert B\rangle$ with $A,B\in\{0,K\}$ and $\lvert 0\rangle=\Phi_0$.

**Lemma 2 (the density and current in this convention).** With $\hat\psi_{\sigma}(\mathbf r)=\sum_p\phi_p(\mathbf r)a_{p\sigma}$,

$$
\hat\rho(\mathbf r)=\sum_{\sigma}\hat\psi^{\dagger}_{\sigma}\hat\psi_{\sigma}=\sum_{pq}\phi_p(\mathbf r)\phi_q(\mathbf r)E_{pq},
\qquad
\hat{\mathbf j}(\mathbf r)=\frac{1}{2i}\sum_{pq}\bigl[\phi_p\nabla\phi_q-\phi_q\nabla\phi_p\bigr]E_{pq},
$$

hence $\rho^{AB}(\mathbf r)=\sum_{pq}\gamma^{AB}_{pq}\phi_p\phi_q$ with no transposition, and for a Hermitian $D_{pq}=\langle E_{pq}\rangle$ in a real basis

$$
\mathbf j(\mathbf r)=\tfrac12\sum_{pq}\operatorname{Im}D_{pq}\bigl[\phi_p\nabla\phi_q-\phi_q\nabla\phi_p\bigr].
$$

**Proof.** The first is the definition of the density operator with the field expansion substituted. The second is $\hat{\mathbf j}=\tfrac{1}{2i}\sum_\sigma[\hat\psi^{\dagger}_\sigma\nabla\hat\psi_\sigma-(\nabla\hat\psi^{\dagger}_\sigma)\hat\psi_\sigma]$ with the same substitution. In the last step the bracket is antisymmetric under $p\leftrightarrow q$, so only the antisymmetric part of $D$ survives; for Hermitian $D$ and real orbitals that part is $i\operatorname{Im}D$, and $\tfrac{1}{2i}\cdot i=\tfrac12$. $\blacksquare$

Two consequences the build needs. The density sees only the symmetric part of $\gamma^{AB}$, so no CHANGE or DENSITY view can detect a transposition error; the current sees only the antisymmetric part, so the FLOW view of stage 6 detects nothing else. Getting the transposition right is exactly a stage-6 question.

**Charge and gauge (KNOWN, with a check).** The electron carries charge $-1$, so the electronic dipole is $\boldsymbol\mu_{\text{el}}=-\sum_{pq}\gamma_{pq}\mathbf r_{pq}$ and the total is $\sum_A Z_A\mathbf R_A-\sum_{pq}\gamma_{pq}\mathbf r_{pq}$. The project's length-gauge interaction is $H_{\text{int}}=+\boldsymbol{\mathcal E}(t)\cdot\sum_k\mathbf r_k$, which is $-\boldsymbol{\mathcal E}\cdot\hat{\boldsymbol\mu}_{\text{el}}$; the drive matrix $\mathbf R_q$ is therefore built from the POSITION matrix $r_{pq}$, not from the dipole. MEASURED against `mf.dip_moment` on the same primitives: max discrepancy $6.5\times10^{-11}$ (H₂O), $1.9\times10^{-10}$ (NH₃), $3.6\times10^{-15}$ (CH₄), $1.2\times10^{-13}$ (C₆H₆); script `check-tda-pyscf.py`, field `d_ground_dipole_nuc_minus_r`. PySCF's `tdscf` `transition_dipole` also returns $\sqrt2\sum_{ia}X_{ia}r_{ia}$ with no charge factor — read from its source, `_contract_multipole`, and confirmed by a ratio of exactly $\pm1$ against the project's $\mu_{Kq}$ on every non-degenerate state.

## 2 · The algebra

**Lemma 3 (KNOWN; Helgaker, Jørgensen and Olsen, §1.4).** $[E_{pq},E_{rs}]=\delta_{qr}E_{ps}-\delta_{ps}E_{rq}$, and on a closed-shell determinant

$$
E_{ij}\Phi_0=2\delta_{ij}\Phi_0,\qquad E_{ia}\Phi_0=0,\qquad E_{ab}\Phi_0=0,\qquad
\langle\Phi_0\rvert E_{ia}E_{bj}\lvert\Phi_0\rangle=2\delta_{ij}\delta_{ab}.
$$

**Proof.** The commutator is the standard one-index contraction of $[a^{\dagger}_{p\sigma}a_{q\sigma},a^{\dagger}_{r\tau}a_{s\tau}]$ using $\{a_p,a^{\dagger}_r\}=\delta_{pr}\delta_{\sigma\tau}$. For the actions: $a_{a\sigma}\Phi_0=0$ because a virtual spin orbital is empty, which kills $E_{ia}$ and $E_{ab}$; $a^{\dagger}_{i\sigma}a_{j\sigma}\Phi_0=0$ for $i\ne j$ because $i$ is already occupied in both spins, and equals $\hat n_i\Phi_0=2\Phi_0$ for $i=j$. For the last: $E_{bj}E_{ia}\Phi_0=0$, so $\langle\Phi_0\rvert E_{ia}E_{bj}\lvert\Phi_0\rangle=\langle\Phi_0\rvert[E_{ia},E_{bj}]\lvert\Phi_0\rangle=\delta_{ab}\langle E_{ij}\rangle_0-\delta_{ij}\langle E_{ba}\rangle_0=2\delta_{ab}\delta_{ij}$. $\blacksquare$

Lemma 3 also proves the normalisation asserted in Definition 1: $\langle\Psi_K\lvert\Psi_L\rangle=\tfrac12\sum X^K_{ia}X^L_{jb}\cdot2\delta_{ij}\delta_{ab}=\langle X^K,X^L\rangle$, so $\lVert X^K\rVert=1$ is exactly $\lVert\Psi_K\rVert=1$.

## 3 · The $\gamma$ blocks

**Proposition 3 (the state-to-state density matrices).** With Definition 1 and real $X$,

$$
\gamma^{00}_{ij}=2\delta_{ij},\qquad
\gamma^{0K}_{ia}=\sqrt2\,X^K_{ia},\qquad
\gamma^{KL}_{ij}=2\delta_{ij}\langle X^K,X^L\rangle-\sum_a X^K_{ja}X^L_{ia},\qquad
\gamma^{KL}_{ab}=\sum_i X^K_{ia}X^L_{ib},
$$

with $\gamma^{K0}=(\gamma^{0K})^{T}$ and every block not listed equal to zero.

**Proof.** (i) $\gamma^{00}_{pq}=\langle\Phi_0\rvert E_{pq}\lvert\Phi_0\rangle$. By Lemma 3 the only non-vanishing action of $E_{pq}$ on $\Phi_0$ that returns a component along $\Phi_0$ is $E_{ij}\Phi_0=2\delta_{ij}\Phi_0$; $E_{ai}\Phi_0$ is orthogonal to $\Phi_0$ and $E_{ia}\Phi_0=E_{ab}\Phi_0=0$. Hence $\gamma^{00}_{ij}=2\delta_{ij}$ and all else vanishes.

(ii) $\gamma^{0K}_{pq}=\tfrac{1}{\sqrt2}\sum_{jb}X^K_{jb}\langle\Phi_0\rvert E_{pq}E_{bj}\lvert\Phi_0\rangle$. Taking $p=i$, $q=a$ and using the last identity of Lemma 3, $\gamma^{0K}_{ia}=\tfrac{1}{\sqrt2}\sum_{jb}X^K_{jb}\,2\delta_{ij}\delta_{ab}=\sqrt2X^K_{ia}$. For the other blocks use $\langle\Phi_0\rvert E_{pq}=\bigl(E_{qp}\Phi_0\bigr)^{\dagger}$: $E_{ia}\Phi_0=0$ gives $\gamma^{0K}_{ai}=0$; $E_{ba}\Phi_0=0$ gives $\gamma^{0K}_{ab}=0$; $E_{ji}\Phi_0=2\delta_{ij}\Phi_0$ gives $\gamma^{0K}_{ij}=2\delta_{ij}\langle\Phi_0\lvert\Psi_K\rangle=0$ by construction.

(iii) $\gamma^{KL}_{pq}=\tfrac12\sum_{ia,jb}X^K_{ia}X^L_{jb}\langle\Phi_0\rvert E_{ia}E_{pq}E_{bj}\lvert\Phi_0\rangle$. For $p=k$, $q=l$ both occupied, Lemma 3 gives

$$
E_{kl}E_{bj}\Phi_0=\bigl([E_{kl},E_{bj}]+E_{bj}E_{kl}\bigr)\Phi_0
=\bigl(\delta_{lb}E_{kj}-\delta_{kj}E_{bl}\bigr)\Phi_0+2\delta_{kl}E_{bj}\Phi_0
=-\delta_{kj}E_{bl}\Phi_0+2\delta_{kl}E_{bj}\Phi_0,
$$

since $\delta_{lb}=0$ ($l$ occupied, $b$ virtual). Contracting with $\langle\Phi_0\rvert E_{ia}$ and using $\langle\Phi_0\rvert E_{ia}E_{bl}\lvert\Phi_0\rangle=2\delta_{il}\delta_{ab}$,

$$
\gamma^{KL}_{kl}=\tfrac12\sum_{ia,jb}X^K_{ia}X^L_{jb}\bigl[-2\delta_{kj}\delta_{il}\delta_{ab}+4\delta_{kl}\delta_{ij}\delta_{ab}\bigr]
=2\delta_{kl}\langle X^K,X^L\rangle-\sum_a X^K_{la}X^L_{ka},
$$

which is the stated formula after renaming $(k,l)\to(i,j)$. For $p=c$, $q=d$ both virtual, $E_{cd}\Phi_0=0$ and $[E_{cd},E_{bj}]=\delta_{db}E_{cj}-\delta_{cj}E_{bd}$ with $\delta_{cj}=0$, so $E_{cd}E_{bj}\Phi_0=\delta_{db}E_{cj}\Phi_0$ and $\gamma^{KL}_{cd}=\tfrac12\sum X^K_{ia}X^L_{jb}\delta_{db}\,2\delta_{ij}\delta_{ac}=\sum_i X^K_{ic}X^L_{id}$.

(iv) For $p=k$ occupied and $q=c$ virtual, $E_{kc}\Phi_0=0$ and $[E_{kc},E_{bj}]=\delta_{cb}E_{kj}-\delta_{kj}E_{bc}$, so $E_{kc}E_{bj}\Phi_0=2\delta_{cb}\delta_{kj}\Phi_0$; contracting with $\langle\Phi_0\rvert E_{ia}$ gives $2\delta_{cb}\delta_{kj}\langle\Phi_0\rvert E_{ia}\lvert\Phi_0\rangle=0$ by (i). The virt–occ block is the transpose of this one by (v).

(v) $\overline{\gamma^{AB}_{pq}}=\langle B\rvert E^{\dagger}_{pq}\lvert A\rangle=\langle B\rvert E_{qp}\lvert A\rangle=\gamma^{BA}_{qp}$, because $E^{\dagger}_{pq}=E_{qp}$. For real states this is $\gamma^{AB}=(\gamma^{BA})^{T}$, in particular $\gamma^{K0}=(\gamma^{0K})^{T}$. $\blacksquare$

**Corollary 4 (complex amplitudes).** If the $X^K$ are complex (a legitimate choice inside a degenerate cluster, where $(X^1\pm iX^2)/\sqrt2$ are eigenvectors of the same TDA matrix), every bra factor carries a conjugate:

$$
\gamma^{0K}_{ia}=\sqrt2\,X^K_{ia},\quad \gamma^{K0}=(\gamma^{0K})^{\dagger},\quad
\gamma^{KL}_{ij}=2\delta_{ij}\langle X^K,X^L\rangle-\sum_a\overline{X^K_{ja}}X^L_{ia},\quad
\gamma^{KL}_{ab}=\sum_i\overline{X^K_{ia}}X^L_{ib},
$$

with $\langle X^K,X^L\rangle=\sum_{ia}\overline{X^K_{ia}}X^L_{ia}$.

**Proof.** The proof of Proposition 3 never used reality; it used only Lemma 3 and the expansion $\langle\Psi_K\rvert=\sum\overline{X^K_{ia}}\tfrac{1}{\sqrt2}\langle\Phi_0\rvert E_{ia}$. Carrying the conjugates through gives the four lines. Statement (v) is unchanged and now reads $\gamma^{K0}=(\gamma^{0K})^{\dagger}$. $\blacksquare$

MEASURED, on the NH₃ and CH₄ E and T clusters with $X=(X^1\pm iX^2)/\sqrt2$, against a full-determinant-space evaluation: max error $4.4\times10^{-16}$ (NH₃), $1.6\times10^{-16}$ (CH₄). Script `check-gamma-fci.py`, field `complex_amplitude_max_abs_error`.

## 4 · The drive

**Proposition 5 (the one-electron matrix in the pair basis).** Let $M$ be any one-electron operator with MO matrix $M_{pq}=\langle p\rvert M\lvert q\rangle$ and $R_{AB}=\sum_{pq}\gamma^{AB}_{pq}M_{pq}$. Write $\lvert ia\rangle$ for the singlet single $\tfrac{1}{\sqrt2}E_{ai}\Phi_0$. Then

$$
\langle 0\rvert R\lvert 0\rangle=2\sum_k M_{kk},\qquad
\langle 0\rvert R\lvert ia\rangle=\sqrt2\,M_{ia},\qquad
\langle ia\rvert R\lvert jb\rangle=\delta_{ij}M_{ab}-\delta_{ab}M_{ji}+\delta_{ij}\delta_{ab}\langle 0\rvert R\lvert 0\rangle .
$$

For a symmetric $M$ — in particular the position operator in a real orbital basis — $M_{ji}=M_{ij}$ and the third line is the published one.

**Proof.** Substitute Proposition 3 with $X^K=e_{ia}$, $X^L=e_{jb}$. The first two lines are immediate from $\gamma^{00}$ and $\gamma^{0K}$. For the third, the occupied block contributes $\sum_{kl}M_{kl}\bigl[2\delta_{kl}\delta_{ij}\delta_{ab}-\delta_{li}\delta_{kj}\delta_{ab}\bigr]=2\delta_{ij}\delta_{ab}\sum_kM_{kk}-\delta_{ab}M_{ji}$ and the virtual block contributes $\sum_{cd}M_{cd}\delta_{ij}\delta_{ca}\delta_{db}=\delta_{ij}M_{ab}$; the mixed blocks vanish by Proposition 3(iv). $\blacksquare$

The index order of the second term is not a matter of taste. MEASURED with a pseudo-random non-symmetric $M$ (seed 20260918) on the full determinant space: the reading $-\delta_{ab}M_{ji}$ is right to $1.8\times10^{-15}$, the reading $-\delta_{ab}M_{ij}$ is wrong by $1.9$ (H₂O), $2.8$ (NH₃), $2.8$ (CH₄). Script `check-gamma-fci.py`, field `nonsymmetric_operator`.

**Corollary 6 (the pair-basis assembly, `REGISTER-WINDOW-SPEC.md` §10).** With $c_0=b_0$, $c_K=b_Ke^{-i\omega_Kt}$, $Z=\sum_Kc_KX^K$ and $\lvert c_0\rvert^2+\sum_K\lvert c_K\rvert^2=1$,

$$
D_{ov}=\sqrt2\,\overline{c_0}\,Z,\qquad D_{vo}=D_{ov}^{\dagger},\qquad D_{vv}=Z^{\dagger}Z,\qquad D_{oo}=2\cdot\mathbb 1-ZZ^{\dagger}.
$$

**Proof.** $D=\sum_{AB}\overline{c_A}c_B\gamma^{AB}$. The occ–virt block gives $\overline{c_0}\sqrt2\sum_Kc_KX^K=\sqrt2\overline{c_0}Z$. The virtual block gives $\sum_{KL}\overline{c_K}c_L\sum_i\overline{X^K_{ia}}X^L_{ib}=\sum_i\overline{Z_{ia}}Z_{ib}=(Z^{\dagger}Z)_{ab}$. The occupied block gives $2\lvert c_0\rvert^2\delta_{ij}+2\delta_{ij}\sum_{KL}\overline{c_K}c_L\langle X^K,X^L\rangle-\sum_{KL}\overline{c_K}c_L\overline{X^K_{ja}}X^L_{ia}=2\delta_{ij}(\lvert c_0\rvert^2+\lVert Z\rVert_F^2)-(ZZ^{\dagger})_{ij}$, and $\lVert Z\rVert^2_F=\sum_K\lvert c_K\rvert^2$ by orthonormality of the $X^K$, so the prefactor is $2$. $\blacksquare$

MEASURED against the full $\gamma$ assembly, 30 random normalised complex registers over the ground state and six excited states at arbitrary times: max $4.1\times10^{-14}$ (benzene), $\le6.4\times10^{-15}$ elsewhere; hermiticity $\le1.4\times10^{-16}$, trace error $\le8.3\times10^{-13}$, occupations inside $[0,2]$ throughout. Script `check-pair-basis.mjs`.

**Proposition 7 (the current sign; a correction to `JUDGMENT.md` §2).** With $D_{pq}=\langle E_{pq}\rangle$ as in Definition 1, the published line

> $\mathbf j(\mathbf r,t)=\tfrac12\sum_{\mu\nu}\operatorname{Im}D_{\mu\nu}(t)\bigl(\chi_\nu\nabla\chi_\mu-\chi_\mu\nabla\chi_\nu\bigr)$

carries the wrong sign; the correct pairing is $\mathbf j=\tfrac12\sum_{pq}\operatorname{Im}D_{pq}(\phi_p\nabla\phi_q-\phi_q\nabla\phi_p)$, i.e. the published expression with $\mu$ and $\nu$ exchanged. It is consistent only with the opposite index convention $D_{pq}=\langle a^{\dagger}_qa_p\rangle$.

**Proof.** Lemma 2. $\blacksquare$

MEASURED independently of that derivation, with the elementary one-electron current $\mathbf j=\operatorname{Im}(\overline\psi\nabla\psi)$ for $\psi=(\phi_1+i\phi_2)/\sqrt2$ on benzene's degenerate HOMO pair, sampled on a ring of 24 points at radius $2.6$ bohr and height $0.5$ bohr, AO values and gradients from PySCF's `eval_gto('GTOval_sph_deriv1')`: the corrected form agrees to $2.2\times10^{-18}$, the published form is off by $6.5\times10^{-3}$, which is exactly twice the peak current $3.3\times10^{-3}$. Script `check-current.py`. A one-body operator's expectation is linear in $D$, so the verdict carries to the many-electron case unchanged. The visible consequence is the sense of the ring current in the FLOW view of stage 6.

## 5 · Proposition 2, the $\delta$-kick

**Proposition 2$'$ (restated).** Let $\hat R_q=\sum_{pq}r^q_{pq}E_{pq}$ and $\chi=e^{-i\kappa\hat R_q}\Phi_0$. Then, with $\mu_{Kq}=\sqrt2\sum_{ia}X^K_{ia}r^q_{ia}$,

$$
\langle\Psi_K\lvert\chi\rangle=-i\kappa\,\mu_{Kq}+O(\kappa^2),\qquad
\langle\Phi_0\lvert\chi\rangle=e^{-i\kappa\langle 0\rvert R_q\lvert 0\rangle}+O(\kappa^2),\qquad
1-\lVert P_{\text{reg}}\chi\rVert^2=O(\kappa^4),
$$

and the density of the register built from those amplitudes reproduces the published linear replay $\delta\rho=-2\kappa\sum_K\mu_{Kq}\sin(\omega_Kt)\rho^{\text{tr}}_K$ to $O(\kappa^2)$.

**Proof.** $e^{-i\kappa\hat R}=1-i\kappa\hat R+O(\kappa^2)$; project on $\Psi_K$ and use $\langle\Psi_K\rvert\hat R\lvert\Phi_0\rangle=\sqrt2\sum X^K_{ia}r_{ia}$ from Proposition 5(ii); project on $\Phi_0$ and use $\langle 0\rvert R\lvert 0\rangle=2\sum_kr_{kk}$, which is not zero in general. The published $b_0=1+O(\kappa^2)$ holds after the origin shift $\mathbf r\to\mathbf r-\langle 0\rvert\mathbf R\lvert 0\rangle/N$, which sends $\hat R\to\hat R-\langle 0\rvert R\lvert 0\rangle\mathbb 1$ on the $N$-electron space and is therefore a global phase, changing no observable. The density depends on $\overline{b_0}b_K$, in which that phase cancels at leading order, so the replay formula is unaffected. $\blacksquare$

MEASURED on H₂O/STO-3G, $q=z$, against the exact $441\times441$ matrix exponential of the full one-body $\hat R_z$ on the determinant space (script `check-kick.py`):

| quantity | $\kappa=10^{-3}$ | $\kappa=5\times10^{-4}$ | ratio | expected |
|---|---|---|---|---|
| $\max_K\lvert b_K+i\kappa\mu_{Kq}\rvert$ | $5.000\times10^{-7}$ | $1.250\times10^{-7}$ | $4.0000015$ | $4$ |
| $\lvert b_0-1\rvert$, origin as shipped | $6.788\times10^{-4}$ | $3.394\times10^{-4}$ | $2.000$ | $2$, i.e. first order |
| $\lvert b_0-1\rvert$, centroid origin | $6.514\times10^{-7}$ | $1.629\times10^{-7}$ | $3.999$ | $4$ |
| leakage $1-\lVert P_{\text{reg}}\chi\rVert^2$ | $6.23\times10^{-13}$ | $3.89\times10^{-14}$ | $16.02$ | $16$ |
| $\lVert D_{\text{register}}-D_{\text{linear replay}}\rVert_\infty$ | $9.230\times10^{-7}$ | $2.307\times10^{-7}$ | $4.00009$ | $4$ |
| $\lVert D_{\text{register}}-D_{\text{determinant space}}\rVert_\infty$ | $6.7\times10^{-16}$ | $8.9\times10^{-16}$ | — | round-off |

The last row is the complex-amplitude gate on the whole $\gamma$ assembly: the register's closed-form $D(t)$ against the 1-RDM of the same superposition evaluated in the 441-dimensional determinant space, at three times.

## 6 · Independent verification of §3 and §4

Two routes were used, neither of which shares a line with the closed forms.

Route A, `check-gamma-fci.py`. The TDA vectors are embedded in the full determinant space of the same MO set by applying PySCF's own creation and annihilation operators (`fci.addons.cre_a`/`des_a`/`cre_b`/`des_b`) to the RHF determinant; every fermionic sign and the determinant ordering are PySCF's. Transition 1-RDMs come from `fci.direct_spin1.trans_rdm1`. PySCF's convention is $\text{dm}[p,q]=\langle\text{bra}\rvert q^{\dagger}p\lvert\text{ket}\rangle$, the transpose of $\gamma_{pq}$; the script does not assume this but derives it from the block structure of $\gamma^{0K}$ (occ–virt norm $1.414$ against virt–occ norm exactly $0$). PySCF's `direct_spin1.contract_1e` packs only the lower triangle of its argument and must not be used with a non-symmetric one-electron matrix; that is why the operators route was taken.

Route B, `check-gamma-bitstring.py`. No PySCF. An explicit occupation-number evaluator: spin orbital $s=p$ for $(p,\alpha)$ and $s=n+p$ for $(p,\beta)$, a determinant is the ordered product of creation operators in increasing bit index, and $a^{\dagger}_s$ carries $(-1)^{\text{popcount}(\text{occ}\wedge(2^s-1))}$. $E_{pq}$ is assembled as a sparse matrix from that rule alone.

| Molecule | determinants | states compared | $\gamma^{00}$ | $\gamma^{0K}$ | $\gamma^{K0}$ | $\gamma^{KL}_{oo}$ | $\gamma^{KL}_{vv}$ | $\gamma^{KL}_{ov}$, $\gamma^{KL}_{vo}$ | drive $R_q$ | pair formulas |
|---|---|---|---|---|---|---|---|---|---|---|
| H₂O, route A | 441 | 0–7, all $K,L$ | $0$ | $2.2\times10^{-16}$ | $2.2\times10^{-16}$ | $6.7\times10^{-16}$ | $2.2\times10^{-16}$ | $0$ | $6.7\times10^{-16}$ | $2.2\times10^{-16}$ |
| NH₃, route A | 3136 | 0–7, all $K,L$ | $0$ | $2.2\times10^{-16}$ | $2.2\times10^{-16}$ | $6.7\times10^{-16}$ | $2.2\times10^{-16}$ | $0$ | $8.9\times10^{-16}$ | $4.4\times10^{-16}$ |
| CH₄, route A | 15876 | 0–7, all $K,L$ | $0$ | $1.1\times10^{-16}$ | $1.1\times10^{-16}$ | $8.9\times10^{-16}$ | $1.7\times10^{-16}$ | $0$ | $4.4\times10^{-16}$ | $4.4\times10^{-16}$ |
| H₂O, route B | 441 | 0–4, all $K,L$ | $0$ | $2.2\times10^{-16}$ | $2.2\times10^{-16}$ | $6.7\times10^{-16}$ | $2.2\times10^{-16}$ | $0$ | — | $2.2\times10^{-16}$ |
| NH₃, route B | 3136 | 0–4, all $K,L$ | $0$ | $2.2\times10^{-16}$ | $2.2\times10^{-16}$ | $8.9\times10^{-16}$ | $3.3\times10^{-16}$ | $0$ | — | $4.4\times10^{-16}$ |

The "pair formulas" column is Proposition 5 evaluated on every single excitation: $n_on_v$ elements for $\langle 0\rvert R\lvert ia\rangle$ and $(n_on_v)^2$ for $\langle ia\rvert R\lvert jb\rangle$, for all three axes. NH₃ (E pairs) and CH₄ (a T₂ bright triple) supply the degenerate cases; H₂O has none among the compared states, which is why NH₃ and CH₄ carry the complex-amplitude gate.

The physics gate, `check-tda-pyscf.py`, loads the project's own vendored BSE STO-3G decimals into PySCF so no basis difference remains, and compares the whole singlet TDA matrix (PySCF's `tdscf.rhf.get_ab`, mapped into the project's pair basis through $U=C^{T}_{\text{proj}}SC_{\text{PySCF}}$, which is exactly block-orthogonal here: max off-block element $7.2\times10^{-10}$).

| Molecule | $\Delta E_{\text{RHF}}$ | $\Delta\varepsilon$ | whole $A$ matrix | all TDA roots | oscillator strengths | $\lvert\mu\rvert$ | cluster dipole tensor |
|---|---|---|---|---|---|---|---|
| H₂O | $3.7\times10^{-13}$ | $1.2\times10^{-10}$ | $1.1\times10^{-10}$ | 10 roots, $1.1\times10^{-10}$ | $5.4\times10^{-11}$ | $1.6\times10^{-10}$ | $1.1\times10^{-10}$ |
| NH₃ | $1.7\times10^{-13}$ | $7.2\times10^{-10}$ | $7.2\times10^{-10}$ | 15 roots, $7.2\times10^{-10}$ | $5.4\times10^{-10}$ | $1.0\times10^{-9}$ | $9.7\times10^{-10}$ |
| CH₄ | $1.2\times10^{-13}$ | $1.4\times10^{-12}$ | $1.3\times10^{-12}$ | 20 roots, $1.2\times10^{-12}$ | $6.7\times10^{-13}$ | $6.7\times10^{-12}$ | $1.1\times10^{-12}$ |
| C₆H₆ | $1.8\times10^{-12}$ | $1.9\times10^{-12}$ | $2.7\times10^{-12}$ | 315 roots, $2.1\times10^{-12}$ | $3.9\times10^{-13}$ | $5.0\times10^{-12}$ | $2.2\times10^{-12}$ |

NH₃'s floor of $7\times10^{-10}$ is the project's SCF convergence inside its degenerate MO block, not a basis or formula difference: the same floor appears in $\Delta\varepsilon$, in $A$ and in the roots. The individual $\boldsymbol\mu_K$ of a state inside a degenerate cluster is gauge-dependent and was not compared; the cluster tensor $T=\sum_{K\in\text{cluster}}\boldsymbol\mu_K\boldsymbol\mu_K^{T}$ was, and it is invariant (it depends only on the cluster projector; see the proof of Proposition 10). PySCF's Davidson TDA stalls on CH₄'s and benzene's degenerate manifolds, so `td.xy` was filled from an exact diagonalisation of PySCF's own $A$ in PySCF's own amplitude normalisation ($\sum x^2=1/2$, measured); `td.transition_dipole` and `td.oscillator_strength` are then PySCF's code unchanged.

## 7 · The canonical gauge

Write $V\in\mathbb R^{g\times d}$ for a cluster: $g$ vectors with orthonormal rows in the $d$-dimensional coordinate space ($d=n_on_v$ for states, $d=n$ for orbitals). An eigensolver returns $QV$ for an arbitrary $Q\in O(g)$, and only the row space is physics.

**Definition 8 (the rule).** Fix, independently of the cluster, an ordered list of linear functionals $f_0,f_1,\dots$ on $\mathbb R^d$, grouped into families, each family with a threshold. Scan them in order; maintain the orthonormal set $u_0,\dots,u_{j-1}$ already accepted; for each $f_q$ form the residual $\Pi_jPf_q$, where $P$ projects on the row space of $V$ and $\Pi_j=1-\sum_{l<j}u_lu_l^{T}$; accept $u_j=\Pi_jPf_q/\lVert\Pi_jPf_q\rVert$ when $\lVert\Pi_jPf_q\rVert$ exceeds the family's threshold, and skip it otherwise; stop at $g$ vectors. For a state cluster the families are (1) the three lab transition-dipole functionals $f_q(X)=\sqrt2\sum_{ia}X_{ia}r^q_{ia}$ in the order $x,y,z$ with threshold $10^{-3}$ a.u., then (2) the $d$ amplitude coordinates in the project's pair order. For an orbital cluster the single family is the Löwdin-AO coordinates in AO order, applied to $\tilde C=S^{1/2}C$.

**Proposition 9 (invariance and uniqueness).** For every $Q\in O(g)$, $\mathrm{canon}(QV)=\mathrm{canon}(V)$; and $\mathrm{canon}(V)$ is the unique orthonormal basis $u_0,\dots,u_{g-1}$ of the row space with $\langle f_{q_j},u_l\rangle=0$ for $l>j$ and $\langle f_{q_j},u_j\rangle>0$, where $q_0,q_1,\dots$ are the accepted functionals.

**Proof.** $P$, and hence every residual and every acceptance decision, is a function of the row space alone, which $Q$ does not change; the $f_q$ are fixed. So the entire output is a function of (row space, fixed functionals). Concretely, in the implementation all arithmetic happens in $\mathbb R^g$ through $c_k=\langle V_k,f_q\rangle$: under $V\mapsto QV$ one has $c\mapsto Qc$, Gram–Schmidt commutes with the orthogonal $Q$ (it uses only inner products), so the coefficient matrix becomes $WQ^{T}$ and the output $WQ^{T}QV=WV$ is unchanged. For uniqueness: the stated conditions say the $g\times g$ matrix $\langle f_{q_j},u_l\rangle$ is lower triangular with positive diagonal, and a decomposition of a fixed full-rank matrix into (orthonormal) $\times$ (lower triangular with positive diagonal) is unique — the uniqueness of QR, equivalently of Cholesky. $\blacksquare$

**Proposition 10 (what the draft rule does not do).** Let a cluster span a single $g$-dimensional irreducible representation $\Gamma$ of the molecular point group, with $g\in\{2,3\}$, and let $M\in\mathbb R^{3\times g}$ be its transition-dipole matrix. Then $T=MM^{T}$ is $\mu^2$ times an orthogonal projector, and consequently in EVERY orthonormal gauge of the cluster the $g$ dipoles are mutually orthogonal and all of length $\mu$. The instruction "rotate the cluster so the dipoles are mutually orthogonal" therefore constrains nothing for an E or T cluster; the identity comes entirely from the ordered functionals and the sign.

**Proof.** $T_{qq'}=\langle 0\rvert r_q\,\Pi\,r_{q'}\lvert 0\rangle$ with $\Pi$ the projector on the cluster, which is invariant under the point group; so $T$ is an invariant symmetric tensor, $\mathcal R T\mathcal R^{T}=T$ for every group element in its $3$-dimensional vector representation. The range of $T$ is the set of lab directions coupling to $\Gamma$; the group acts on it irreducibly (it is the copy of $\Gamma$ inside the vector representation), so by Schur's lemma $T$ restricted to its range is a multiple of the identity, $T=\mu^2P_{\text{range}}$. Now take any $M$ with $MM^{T}=\mu^2P$, $P$ of rank $g$, and let $M=U\Sigma W^{T}$ be a singular value decomposition; then $U\Sigma^2U^{T}=\mu^2P$ forces $\Sigma=\mu\mathbb 1_g$, hence $M^{T}M=W\Sigma^2W^{T}=\mu^2\mathbb 1_g$: the columns of $M$ are orthogonal and of length $\mu$, for this and therefore for every gauge $MQ$. $\blacksquare$

MEASURED on 45 degenerate bright clusters (NH₃ 5, CH₄ 4, C₆H₆ 36): the lengths inside a cluster agree to $\le10^{-8}$ and the largest $\boldsymbol\mu_j\cdot\boldsymbol\mu_l$ over all of them is $3.0\times10^{-13}$. After canonicalisation the dipoles sit exactly on the lab axes: E pairs give $(\mu,0,0)$ and $(0,\mu,0)$, CH₄'s T₂ triple gives $(\mu,0,0)$, $(0,\mu,0)$, $(0,0,\mu)$ with $\mu=1.66218936$. Script `canon-gauge.test.mjs`, test 8.

**Corollary 11 (the RING preset is gauge-independent; the gauge only names it).** For a degenerate pair satisfying Proposition 10, the register $b=(b_0,c,ic)$ with real $b_0$ gives an electronic dipole

$$
\boldsymbol\mu(t)=\boldsymbol\mu_{\text{stat}}-2b_0\lvert c\rvert\bigl[\cos(\omega t+\varphi)\,\boldsymbol\mu^{(1)}+\sin(\omega t+\varphi)\,\boldsymbol\mu^{(2)}\bigr],
$$

a circle of radius $2b_0\lvert c\rvert\mu$ traversed uniformly at $\omega$, whose centre, componentwise in the axis $q$, is $(\boldsymbol\mu_{\text{stat}})_q=-\bigl[\lvert b_0\rvert^2R^q_{00}+\lvert c\rvert^2(R^q_{11}+R^q_{22})\bigr]$, and whose centre, radius, plane and sense are the same in every orthonormal gauge of the pair. Only the starting phase $\varphi$ depends on the gauge.

**Proof.** The cluster–cluster part of $\langle R\rangle$ is $\sum_{K,L}\overline{c_K}c_LR_{KL}$ with $R$ real symmetric and $\overline{c_1}c_2=i\lvert c\rvert^2$ purely imaginary, so it equals $\lvert c\rvert^2\operatorname{tr}R_{\text{cluster}}$, which is a trace and hence gauge-invariant and time-independent; the $R_{00}$ term likewise. The cross term is $2\operatorname{Re}[\overline{b_0}(c_1\boldsymbol\mu^{(1)}+c_2\boldsymbol\mu^{(2)})]$ with $c_1=ce^{-i\omega t}$ and $c_2=ice^{-i\omega t}$, giving the displayed combination; by Proposition 10 $\boldsymbol\mu^{(1)}\perp\boldsymbol\mu^{(2)}$ with equal lengths, so the locus is a circle of the stated radius, and its plane is the range of $T$, which is invariant. $\blacksquare$

MEASURED: for NH₃'s $\omega=0.598946$ pair and benzene's $\omega=0.390327$ bright pair, five random orthogonal scrambles move the circle's centre by $\le6.7\times10^{-16}$ and its radius by $\le6.7\times10^{-16}$, while the starting phase moves by up to $5.65$ rad; after canonicalisation the starting phase is reproduced to $3.6\times10^{-15}$ rad. The out-of-circle spread is $2.4\times10^{-14}$ over 64 samples of a period. This upgrades the benzene ring-current measurement of `probe-fable.mjs` from a measurement at one gauge to a theorem, and it says the RING preset cannot be broken by an eigensolver change; only its lane labels can.

**Lemma 12 (conditioning).** If every accepted residual norm is at least $\delta$, then a perturbation of the row space of size $\varepsilon$ moves the canonical basis by at most $O(\varepsilon/\delta)$.

**Proof.** Each accepted vector is $u_j=\Pi_jPf_{q_j}/\lVert\Pi_jPf_{q_j}\rVert$. The numerator is a smooth function of $P$ and of the earlier $u_l$, so perturbing $P$ by $\varepsilon$ perturbs it by $O(\varepsilon)$; dividing by a norm at least $\delta$ amplifies by at most $1/\delta$, and the errors accumulate through the $g\le3$ steps with bounded coefficients. $\blacksquare$

MEASURED on benzene's bright pair: $\delta=2.2186$, a perturbation $\varepsilon=10^{-9}$ moves the output by $7.1\times10^{-10}$, against the bound $\varepsilon/\delta=4.5\times10^{-10}$.

**Lemma 13 (why the coordinate family gets an adaptive threshold).** With $j$ directions already accepted, $\sum_{q=0}^{d-1}\lVert\Pi_je_q\rVert^2=\operatorname{tr}\Pi_j=g-j$, so some coordinate has residual at least $\sqrt{(g-j)/d}$. Setting the coordinate family's threshold to $\theta\sqrt{(g-j)/d}$ with $\theta<1$ therefore never exhausts the family, and it forces $\delta\ge\theta\sqrt{(g-j)/d}$, bounding the constant of Lemma 12 by $\sqrt{d/(g-j)}/\theta$ a priori.

**Proof.** $\Pi_j$ is an orthogonal projector of rank $g-j$, so $\sum_q e_q^{T}\Pi_j^2e_q=\operatorname{tr}\Pi_j=g-j$; a maximum is at least the mean, giving $\max_q\lVert\Pi_je_q\rVert\ge\sqrt{(g-j)/d}$, strictly above $\theta\sqrt{(g-j)/d}$ for $\theta<1$. Lemma 12 then applies with that $\delta$. $\blacksquare$

The default is $\theta=1/2$. This matters: with a flat $10^{-8}$ threshold, benzene's worst accepted pivot norm was $5.6\times10^{-8}$, a Lipschitz constant of $1.8\times10^{7}$ — an identity that a change of eigensolver would not reproduce. With Lemma 13's threshold and the dipole family's threshold raised from $10^{-6}$ to $10^{-3}$ a.u., benzene's worst pivot over all 210 clusters is $9.0\times10^{-3}$ and NH₃'s is $2.5\times10^{-3}$, bounding the constant by about $10^{2}$. Raising the dipole threshold is a deliberate trade: a cluster whose brightest lab component is below $10^{-3}$ a.u. ($f\lesssim10^{-6}$) loses its $x$/$y$/$z$ lane names and is identified by amplitudes instead. Such a lane had no stable name to lose.

**The sign rule for a non-degenerate state (Task B(3)).** It is the $g=1$ case of Definition 8, with no special code: the sign of $X^K$ is fixed so that the first functional value above its threshold is positive — the first lab dipole component exceeding $10^{-3}$ a.u. for a bright state, the first amplitude coordinate exceeding $\theta/\sqrt d$ for a dark one. Unlike the $g\ge2$ case this output is locally constant in the span, so Lemma 12 does not apply to it; the sign is stable as long as that functional value stays away from zero, and $\delta$ is the distance to a flip. MEASURED: 120 non-degenerate states of H₂O, NH₃ and benzene, $\mathrm{canon}(-X)=\mathrm{canon}(X)$ to exactly $0$.

**Orbitals (Task B(2), the "what plays the role of the dipole" question).** Nothing does, and the reason is structural: Definition 8 needs LINEAR functionals, and an orbital's dipole $\langle\phi\rvert\mathbf r\lvert\phi\rangle$ is quadratic in $\phi$. A transition dipole to a fixed anchor orbital would be linear but vanishes for the cases that matter (benzene's $\pi$ HOMO pair has no dipole coupling to any non-degenerate occupied orbital). The coordinate family is therefore the rule for orbitals, applied in the Löwdin basis $\tilde C=S^{1/2}C$: those coordinates are Euclidean-orthonormal, so Proposition 9 applies verbatim, and $S^{1/2}$ depends only on the geometry and basis, so the functionals stay fixed under any change of eigensolver. The transform commutes with the scramble, $S^{1/2}(CQ)=(S^{1/2}C)Q$, so invariance carries. The physical showpiece does not suffer, by the orbital analogue of Corollary 11:

**Observation 14 (winding needs no gauge).** On a two-dimensional degenerate orbital cluster, $L_z$ restricted to the cluster is purely imaginary and antisymmetric in any real orthonormal basis, hence equals $i\lambda\epsilon$ with $\epsilon=\bigl(\begin{smallmatrix}0&1\\-1&0\end{smallmatrix}\bigr)$; its eigenvectors are $(\phi_1\mp i\phi_2)/\sqrt2$ with eigenvalues $\pm\lambda$, in every real orthonormal gauge. The winding density $\tfrac12(\phi_1^2+\phi_2^2)$ is the diagonal of the cluster projector and is likewise gauge-invariant. The gauge fixes which sense the WINDING preset calls positive, and nothing else.

**Proof.** Matrix elements of $L_z=-i(x\partial_y-y\partial_x)$ between real functions are purely imaginary, and $L_z$ is Hermitian, so its $2\times2$ block is $i\lambda\epsilon$ for real $\lambda$; every real antisymmetric $2\times2$ matrix is a multiple of $\epsilon$, and $\epsilon$ is invariant under $SO(2)$ and changes sign under a reflection. The eigenvectors of $\epsilon$ are $(1,\mp i)/\sqrt2$. Invariance of $\sum_k\phi_k(\mathbf r)^2$ under $O(2)$ is immediate. $\blacksquare$

### The rule in five lines

1. Cluster by consecutive gaps: $\lvert\omega_{k}-\omega_{k-1}\rvert<10^{-8}$ joins, maximal runs only.
2. Scan fixed linear functionals in a fixed order — lab dipole $x$, $y$, $z$ (threshold $10^{-3}$ a.u.), then the amplitude coordinates (threshold $\tfrac12\sqrt{(g-j)/d}$) — and Gram–Schmidt their projections onto the cluster span, skipping any residual below its threshold.
3. Normalise each accepted residual with a positive pivot; that fixes both the rotation and every sign, singletons included.
4. Orbitals use the same rule with one family, the Löwdin coordinates of $S^{1/2}C$ in AO order.
5. Publish the accepted pivot list and the smallest pivot norm $\delta$ with the state; an identity with small $\delta$ is a warning, not a name.

Assumptions: the cluster rows are orthonormal to $10^{-9}$; the clustering is taken as given (the rule is invariant for a FIXED cluster membership, and membership itself is not continuous in the Hamiltonian); no accepted residual sits within solver noise of its threshold, which $\delta$ reports; Proposition 10 assumes a cluster spanning one irreducible representation, and an accidental degeneracy of two different irreps falls to the rank-deficient path, which is tested.

### What the tests measured

`node --test canon-gauge.test.mjs`, 11 tests, all passing.

| Test | Result |
|---|---|
| NH₃ states, 10 clusters (5 degenerate), 5 scrambles each | $\max\lvert\mathrm{canon}(VQ)-\mathrm{canon}(V)\rvert=4.4\times10^{-16}$, $\delta_{\min}=2.5\times10^{-3}$ |
| CH₄ states, 9 clusters (6 degenerate, one of them $g=3$) | $3.4\times10^{-15}$, $\delta_{\min}=1.1\times10^{-2}$ |
| C₆H₆ states, 210 clusters (105 degenerate), $d=315$ | $7.7\times10^{-15}$, $\delta_{\min}=9.0\times10^{-3}$ |
| Degenerate MO clusters in Löwdin coordinates (NH₃ 2, CH₄ 2, C₆H₆ 12) | $\le4.9\times10^{-15}$ |
| Sign rule, 120 non-degenerate states | exactly $0$ |
| Bright-cluster dipole placement, 45 clusters | lower triangular, positive diagonal, $\max\boldsymbol\mu_j\cdot\boldsymbol\mu_l=3.0\times10^{-13}$ |
| Rank-deficient: 69 benzene clusters needing the amplitude family | $3.2\times10^{-14}$ |
| Rank-deficient: synthetic bright + dark accidental degeneracy | pivots `dipole:0`, `amplitude:285`; $4.7\times10^{-16}$ |
| Conditioning, $\varepsilon=10^{-9}$ | output moves $7.1\times10^{-10}$, bound $4.5\times10^{-10}$ |
| Ring current, NH₃ and C₆H₆, 5 scrambles | centre and radius invariant to $6.7\times10^{-16}$; canonical starting phase to $3.6\times10^{-15}$ rad |

## 8 · What the build should change

1. `JUDGMENT.md` §2 Observation 1: exchange $\mu$ and $\nu$ in the current formula, or state that its $D$ is $\langle a^{\dagger}_qa_p\rangle$; as the document stands, §2 and §3 use opposite conventions and stage 6 would render the ring current backwards.
2. `JUDGMENT.md` §3 Proposition 2: $b_0=1+O(\kappa^2)$ becomes $b_0=e^{-i\kappa\langle 0\rvert R_q\lvert 0\rangle}+O(\kappa^2)$, or the sentence acquires "with the origin at the ground-state electronic centroid". The replay formula and the physics are unaffected.
3. `REGISTER-WINDOW-SPEC.md` §7 rule 2: replace "rotate the cluster so the dipoles are mutually orthogonal and the first has the largest possible component along the first lab axis" with Definition 8. The orthogonality clause is automatic (Proposition 10) and "largest possible component" is not a rule, since for an E pair every rotation gives the same set of lengths.
4. `REGISTER-WINDOW-SPEC.md` §7 rule 3: the pivoted amplitude rule needs Lemma 13's adaptive threshold, not a flat one, or benzene acquires state identities with a Lipschitz constant of $10^7$.
5. The drive's diagonal $\langle ia\rvert R\lvert jb\rangle$ carries $-\delta_{ab}r_{ji}$; it is safe to write $r_{ij}$ only because the position matrix is symmetric. If the same table is ever reused for a non-symmetric one-electron operator — a velocity-gauge or magnetic term — the transpose must be restored.

## 9 · Abstentions

1. The continuity defect $\partial_t\rho+\nabla\cdot\mathbf j$ in STO-3G (open problem 2 of `JUDGMENT.md`) was not measured. It needs a real-space divergence and a time derivative of the density on the same grid, and a defensible grid; nothing here bounds it. UNVERIFIED.
2. No claim is made about how the canonical gauge behaves across a geometry change, which is what a saved register would meet if the molecule were re-solved at a different geometry. Definition 8 is invariant at fixed geometry; its continuity in the geometry is untested, and the pivot set can change discontinuously when a dipole component passes through its threshold. UNVERIFIED.

## 10 · Open problems

1. Cluster membership is not invariant: a pair split by $1.1\times10^{-8}$ is two clusters and a pair split by $0.9\times10^{-8}$ is one, and the two give different gauges. Is there a rule whose output is continuous across the threshold — for instance, canonicalising the whole near-degenerate block and reporting the split as a diagnostic?
2. The clustering by consecutive gaps is not transitive: a chain of states each within $10^{-8}$ of the next can join a cluster spanning far more than $10^{-8}$. MEASURED, the widest cluster actually produced is $1.6\times10^{-13}$ wide (benzene) against a threshold of $10^{-8}$, and the largest cluster is CH₄'s $g=3$, so no chaining occurred in the four molecules tested; whether any of the other 50 chains is untested.
3. Lemma 12 is a local bound. A global statement — the canonical basis as a function on the Grassmannian, with its discontinuity set characterised — would let the window decide when to refuse a saved identity rather than warn.
4. Proposition 10 assumed a single irreducible representation. For an accidental degeneracy of two different representations $T$ is not isotropic, the rank-deficient path takes over, and the resulting lane names are not symmetry labels. Whether any of the 54 molecules has such a degeneracy at $10^{-8}$ is untested.
5. Whether the canonical gauge for TDA states and the canonical gauge for RPA states agree on a cluster's identity, so that the character-matching of open problem 3 in `JUDGMENT.md` can be done in the canonical basis, is open. The $X+Y$ vector is not normalised the way $X^{\text{TDA}}$ is, so Definition 8 needs its normalisation restated before the question is even well posed.
6. The register's validity at full amplitude (Proposition 1(iii) of `JUDGMENT.md`) is re-measured here as a by-product — occupations stayed in $[0,2]$ over 120 random complex registers — but the sharp statement, that the minimum occupation is bounded below by a function of the amplitude on the excited states, is not proved.

## 11 · References

- T. Helgaker, P. Jørgensen, J. Olsen, Molecular Electronic-Structure Theory, Wiley 2000, §1.4 (the $E_{pq}$ commutator algebra and its action on a closed-shell determinant) — the source of Lemma 3. Cited from knowledge, not re-fetched.
- P. Krause, T. Klamroth, P. Saalfrank, J. Chem. Phys. 123, 074105 (2005) — TD-CIS for laser-driven dynamics. The register of `JUDGMENT.md` §3 is this method; nothing in §3–§5 of this ledger is new physics. Attribution as recorded in `JUDGMENT.md` §9, verified there by search on 2026-09-18; not re-verified here.
- I. Barth, J. Manz, Y. Shigeta, K. Yagi, J. Am. Chem. Soc. 128, 7043 (2006) — electronic ring currents from circularly polarised pulses; the physics Corollary 11 makes gauge-independent. As cited in `JUDGMENT.md`; not re-fetched.
- PySCF 2.14.0: `fci.direct_spin1.trans_rdm1`, `fci.addons.cre_a`/`des_a`, `tdscf.rhf.get_ab`, `tdscf.rhf.TDA`, `scf.hf.dip_moment`, `gto.Mole.eval_gto`. Conventions read from the installed source, quoted in the script headers.
- Schur's lemma, used in Proposition 10 in its standard form for real irreducible representations of a finite group.
- Internal: `research/molecular-waves-2026-09-18/JUDGMENT.md` (Fable, 18 September 2026), `REGISTER-WINDOW-SPEC.md` (Fable, same date), `probe-fable.mjs` and `measurements-fable.json` (evidence, re-derived here where quoted), `research/h2o-2026-09-11/scratch/pinned.py` (the basis-pinning recipe this folder's PySCF scripts reuse).

## 12 · Files

All paths relative to `research/molecular-waves-2026-09-18/proving/`.

| File | What it is |
|---|---|
| `run-all.sh`, `run-all.log` | every number in this ledger, in order |
| `snapshot/lab/`, `snapshot/HEAD.txt` | the frozen copy of the eleven `lab/` modules and the vendored BSE STO-3G record, from commit `8fcdcf8` |
| `prep.mjs` → `data/<id>.json` | RHF, TDA and RPA data for H₂O, NH₃, CH₄, C₆H₆ from the snapshot |
| `gamma_closed.py` | the claimed closed forms, transcribed once; the statement under test |
| `check-gamma-fci.py` → `out-gamma-fci.json` | route A: embedding in the determinant space, PySCF `trans_rdm1`; the non-symmetric-operator discriminator; the complex-amplitude gate |
| `check-gamma-bitstring.py` → `out-gamma-bitstring.json` | route B: an explicit bitstring second-quantisation evaluator, no PySCF |
| `check-pair-basis.mjs` → `out-pair-basis.json` | Corollary 6, hermiticity, trace, occupations |
| `check-kick.py` → `out-kick.json` | Proposition 2$'$, the exact kicked state and the $\kappa$-scaling |
| `check-current.py` → `out-current.json` | Proposition 7, the current sign, on real space |
| `check-tda-pyscf.py` → `out-tda-pyscf.json` | the physics gate on the vendored primitives |
| `canon-gauge.mjs` | the canonical gauge, dependency-free ES module |
| `canon-gauge.test.mjs` | 11 tests; the gauge gate |
