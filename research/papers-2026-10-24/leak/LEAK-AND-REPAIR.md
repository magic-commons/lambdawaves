# THE LEAK AND THE REPAIR — pilot on the exported water solution, 24 October 2026 (Claude Yan)

Josh's "continue with whatever you think is next" after the papers session was read as the authorisation asked for in FOR-JOSH (papers), call 5. Everything here is post-processing of the review edition's exported H₂O/STO-3G record (`figures/source-captures/H2O_STO-3G_solution.json`): PySCF 2.14 evaluates the atomic orbitals with second derivatives and the Coulomb integrals on grid points (`int1e_grids`), SciPy's cosine and sine transforms solve the Poisson equation. No SCF, no two-electron integral except as a check, no propagation, no solver, no GPU. The solvers' queue was running throughout, untouched; this ran at nice 19 on two threads, 177 s at the finest grid.

## What was computed

For the packet of Paper 2, Equation 7, $\psi=(e^{-i\varepsilon_H t}\phi_H+e^{-i\varepsilon_L t}\phi_L)/\sqrt2$, every time-dependent quantity is $\sin\Delta\varepsilon t$ times a fixed field. The leak is

$$s=\partial_t\rho+\nabla\cdot\mathbf j=-\Delta\varepsilon\,\phi_H\phi_L+\tfrac12(\phi_L\nabla^2\phi_H-\phi_H\nabla^2\phi_L),$$

evaluated from the Gaussians' Laplacians alone. It splits identically into two parts, $s=e+b$: the frozen-exchange part $e=\phi_H(K\phi_L)-\phi_L(K\phi_H)$, with $K$ the Hartree–Fock exchange operator over the five occupied orbitals (each $(K\phi_a)(\mathbf r)=\sum_i\phi_i(\mathbf r)V_{ia}(\mathbf r)$, $V_{ia}$ the electrostatic potential of the pair density $\phi_i\phi_a$, which is the ESP pass's integral applied to orbital pairs), and the finite-basis part $b=\phi_H r_L-\phi_L r_H$, with $r_a=F\phi_a-\varepsilon_a\phi_a$ the pointwise Fock residual, zero in a complete basis and orthogonal to the basis in a finite one. The multiplicative potentials cancel in $b$, so $b$ is bounded; its sharpest feature is the oxygen 1s primitive's Laplacian, 0.06 bohr wide.

Then the repair: $\mathbf c^*=\nabla\varphi$ with $-\nabla^2\varphi=s$ on the exported box (half-width 7.431 bohr, cell-centred, seven-point stencil), under two boundary conditions: closed walls (no flux, $\partial_n\varphi=0$, a cosine transform) and open walls ($\varphi=0$, a sine transform). In both the discrete continuity residual $\nabla\cdot(\mathbf j+\mathbf c^*)+\partial_t\rho$ is at machine precision.

## What was found

| grid | h (bohr) | ∫x s | ∫j_x | K grid − int2e | share of ∫x s: exchange / basis | q′ closed walls | q′ open walls | interior flow, open walls | ‖c*‖/‖j‖ | max |s| | time |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 48³ | 0.310 | -0.18489 | 0.09950 | 2.4e-02 | 0.225 / 0.775 | +1.1816 | -1.2867 | -0.00279 | 0.141 | 0.9 | 1 s |
| 96³ | 0.155 | -0.17319 | 0.09677 | 2.8e-03 | 0.239 / 0.761 | +1.0230 | -1.3068 | -0.00131 | 0.126 | 3.6 | 8 s |
| 160³ | 0.093 | -0.17171 | 0.09770 | 1.2e-04 | 0.241 / 0.759 | +1.0030 | -1.3140 | -0.00078 | 0.129 | 13.1 | 73 s |
| 224³ | 0.066 | -0.17149 | 0.09772 | 3.5e-06 | 0.242 / 0.758 | +1.0000 | -1.3170 | -0.00056 | 0.127 | 14.7 | 177 s |

Analytic values: $\Delta\varepsilon=0.99641$, $x_{HL}=0.07404$, $g_{HL}=-0.09772$, $q=-1.3245$, $\int x\,s=-\Delta\varepsilon x_{HL}+g_{HL}=-0.17149$, $\int j_x=-g_{HL}=0.09772$. The grid's exchange and Hartree matrix elements agree with PySCF's two-electron integrals to 4e-06 and 1e-05 at the finest grid, which checks the `int1e_grids` route independently of the Laplacian route.

1. **The leak's first moment is three quarters basis, one quarter exchange.** Paper 2 said the first moment of the source, $2.32$ times the dipole rate, "collects the frozen exchange operator and the finite basis". Split: exchange 0.242, basis 0.758 (converged to the third digit between the last two grids). STO-3G, not the frozen exchange, is the main reason the water packet's net current runs against its centre. The two parts also live in different places: 2 % of the exchange part's $L^1$ mass lies within 0.3 bohr of a nucleus against 21 % of the basis part's.

2. **Continuity can always be repaired; the net flow cannot be repaired by a potential alone.** The plan's Lemma B said that any conserving current has net flow equal to the dipole rate. That needs the current to decay faster than $1/r^3$, and the minimal-norm repair does not: $\varphi$ has a dipole tail because $\int\mathbf r\,s\neq0$. The correct statement is $\int_\Omega\mathbf c=\int_\Omega\mathbf r\,s-\oint_{\partial\Omega}\mathbf r\,(\mathbf c\cdot\mathbf n)\,dA$: the repair carries the missing dipole rate through the interior only to the extent that it does not carry it through the walls. The pilot shows the three cases. **Closed walls** (no flux): the repaired net current is $q'=+1.0000$ times the dipole rate at the finest grid, converging to $+1$ as the quadrature does (1.18, 1.02, 1.003, …); the sign reversal predicted in the plan holds, under this boundary condition. **Open walls**: the interior net flow of the repair is -0.00056 and shrinking, so $q'$ stays at $q$; the whole first moment leaves as wall flux (+0.17094 against $\int x\,s=-0.17149$). **Free space**: the dipole tail integrated over a ball or a cube gives one third, $q'=(2q+1)/3=-0.550$, still against the centre. The plan's own kill clause ("if the numerical $q$ after repair is not 1 … Lemma B's decay hypothesis or the Poisson boundary is wrong") fired on the free-space form and is answered by the confined one.

3. **The repair is small and the reversal is large.** The repair's $L^2$ norm is 0.13 of the current's, yet it moves the net flow by $2.32$ times the dipole rate, because the current's net flow is a small residual of a large circulating field. That is the paper's picture in one sentence.

## Corrected lemmas for §3.1 of THE NEXT PAPERS

*Lemma A (minimal confined repair).* On a bounded box $\Omega$ with $\int_\Omega s=0$, among all $\mathbf c$ with $\nabla\cdot\mathbf c=-s$ and $\mathbf c\cdot\mathbf n=0$ on $\partial\Omega$, the one of least $L^2$ norm is $\mathbf c^*=\nabla\varphi$ with $-\nabla^2\varphi=s$, $\partial_n\varphi=0$. *Proof.* Helmholtz on a bounded domain with the no-flux condition: $\mathbf c=\nabla\varphi+\mathbf w$, $\nabla\cdot\mathbf w=0$, $\mathbf w\cdot\mathbf n=0$; then $\int\nabla\varphi\cdot\mathbf w=\oint\varphi\,\mathbf w\cdot\mathbf n-\int\varphi\nabla\cdot\mathbf w=0$. $\square$

*Lemma B (net flow of a confined conserving current).* If $\nabla\cdot(\mathbf j+\mathbf c)=-\partial_t\rho$ in $\Omega$ and $(\mathbf j+\mathbf c)\cdot\mathbf n=0$ on $\partial\Omega$, then $\int_\Omega(\mathbf j+\mathbf c)=\tfrac{d}{dt}\langle\mathbf r\rangle$. *Proof.* $\int\mathbf r\,\nabla\cdot\mathbf v=\oint\mathbf r\,(\mathbf v\cdot\mathbf n)-\int\mathbf v$. $\square$ Without the wall condition the identity carries the wall term, and the free-space minimal repair keeps only one third of the missing moment inside any ball or cube.

Both are discrete identities on the cell-centred grid as well (summation by parts with cell-centre coordinates at the walls), which is why the pilot's identity residuals read $10^{-14}$: the numerical content of the test is in $\int x\,s$ and $\int j_x$, each computed from analytic functions and compared with their analytic values.

## What this means for Paper 3

- The thesis sharpens. Not "the repair restores the dipole rate" but: a finite basis leaks probability locally; the leak is three quarters basis and one quarter frozen exchange for water in STO-3G; it can always be plumbed back by a potential flow; and the missing dipole rate is then either carried inside (closed walls) or pushed through the walls (open walls), never lost. The boundary condition is physics, not numerics: the app's box has closed walls.
- The carrying figure is `leak_repair_N224.png`: the leak and its two parts in the $y=0$ section, then the current, the repair and the repaired current.
- Next computations, all CPU: the same for water in 6-31G and 6-31G* from the volume rungs (the basis part should shrink, the exchange part not); the benzene ring packet (first many-electron instance); the time-dependent version where the Poisson solve runs once per frame in the app's GPU pass with its Neumann walls.
- The app shortfall this exposes: the GPU Poisson pass's boundary condition decides whether a repaired FLOW carries the dipole rate; it must be the closed-wall one for the meter to read $+1$.

## Later the same evening: up the ladder, and a ring (`leak_any.py`)

Josh: "Let's do those next papers!" The same computation for any catalogue molecule and basis (PySCF RHF, Cartesian, the app's DOMAIN AUTO box; `--mol water --basis sto-3g` reproduces the pilot to $5\times10^{-8}$ in $q$). Results at $224^3$ (water) and $128^3$ / $160^3$ (benzene, which agree in every digit shown), in units of the dipole rate:

| packet | $n_{\rm AO}$ | $q$ | $1-q$ | exchange part | basis part | $q'$ closed | $q'$ open | $\|c^*\|/\|j\|$ | time |
|---|---|---|---|---|---|---|---|---|---|
| water STO-3G | 7 | −1.3245 | 2.3245 | 0.562 | 1.763 | +1.000004 | −1.317 | 0.127 | 177 s |
| water 6-31G | 13 | +0.7228 | 0.2772 | 0.464 | −0.187 | +0.99995 | +0.724 | 0.077 | 300 s |
| water 6-31G* | 19 | +0.9200 | 0.0800 | 0.483 | −0.403 | +0.99994 | +0.920 | 0.084 | 376 s |
| benzene STO-3G | 36 | +0.2841 | 0.7159 | 0.520 | 0.196 | +1 (13 digits) | +0.287 | 1.014 | 882 s |

The plan's second kill clause ("if the 6-31G and 6-31G* rungs do not shrink the basis part while the exchange part holds, the split is an STO-3G accident") did not fire: the basis part collapses ($1.76\to-0.19\to-0.40$) and the exchange part holds ($0.56$, $0.46$, $0.48$). Benzene's π packet is the reverse case (73 % exchange; the orbitals vanish at the nuclei, 0.2 % of the leak's mass within 0.3 bohr of one; the leak smooth, so the midpoint rule is spectrally accurate and $q'=1$ to thirteen digits); its SCF's choice within each degenerate frontier pair differs between the grids, and $q$, the shares and $q'$ do not. These are Paper 3's Table 3 and Figures 2 and 3 (`figure_ladder.py`, `figure_any.py`).

## Files

`leak_repair.py` (the computation; `python -I leak_repair.py N`), `figure.py` (the picture), `run_all.sh`, `leak_repair_N*.json` (every number above), `leak_repair_N*.png`. The field grids `fields_N*.npz` are regenerated, not kept in git.
