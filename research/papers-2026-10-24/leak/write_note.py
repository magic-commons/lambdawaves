"""write_note.py — writes LEAK-AND-REPAIR.md (the pilot's record) from leak_repair_N*.json, and patches §3.1 of ../THE NEXT PAPERS.md
(Lemma A and B corrected by what the pilot found; the pilot's numbers added).  Run: python3 -I write_note.py"""
import os, json, glob, re
HERE = os.path.dirname(os.path.abspath(__file__)); PLAN = os.path.join(HERE, '..', 'THE NEXT PAPERS.md')
runs = {int(re.search(r'N(\d+)', p).group(1)): json.load(open(p)) for p in glob.glob(os.path.join(HERE, 'leak_repair_N*.json'))}
Ns = sorted(runs); top = runs[Ns[-1]]
q = top['q']; xs_an = top['first_moment_analytic']
rows = []
for N in Ns:
    d = runs[N]; r = d['repair']; K = d['check_exchange_matrix_grid_vs_int2e']['max_abs_diff']
    rows.append(f"| {N}³ | {d['h']:.3f} | {d['leak_s']['x']:+.5f} | {d['check_int_jx_quadrature_vs_minus_gHL']['quadrature']:.5f} | {K:.1e} | "
                f"{d['first_moment_share']['exchange']:.3f} / {d['first_moment_share']['basis']:.3f} | {r['neumann']['q_repaired']:+.4f} | "
                f"{r['dirichlet']['q_repaired']:+.4f} | {r['dirichlet']['net_flow_interior'][0]:+.5f} | {r['neumann']['norm_c_over_norm_j']:.3f} | {d['leak_s']['max']:.1f} | {d['time_total_s']:.0f} s |")
table = ("| grid | h (bohr) | ∫x s | ∫j_x | K grid − int2e | share of ∫x s: exchange / basis | q′ closed walls | q′ open walls | interior flow, open walls | ‖c*‖/‖j‖ | max |s| | time |\n"
         "|---|---|---|---|---|---|---|---|---|---|---|---|\n" + "\n".join(rows))
share_e = top['first_moment_share']['exchange']; share_b = top['first_moment_share']['basis']; near = top['L1_share_within_0.3_bohr_of_a_nucleus']
note = f"""# THE LEAK AND THE REPAIR — pilot on the exported water solution, 24 October 2026 (Claude Yan)

Josh's "continue with whatever you think is next" after the papers session was read as the authorisation asked for in FOR-JOSH (papers), call 5. Everything here is post-processing of the review edition's exported H₂O/STO-3G record (`figures/source-captures/H2O_STO-3G_solution.json`): PySCF 2.14 evaluates the atomic orbitals with second derivatives and the Coulomb integrals on grid points (`int1e_grids`), SciPy's cosine and sine transforms solve the Poisson equation. No SCF, no two-electron integral except as a check, no propagation, no solver, no GPU. The solvers' queue was running throughout, untouched; this ran at nice 19 on two threads, {top['time_total_s']:.0f} s at the finest grid.

## What was computed

For the packet of Paper 2, Equation 7, $\\psi=(e^{{-i\\varepsilon_H t}}\\phi_H+e^{{-i\\varepsilon_L t}}\\phi_L)/\\sqrt2$, every time-dependent quantity is $\\sin\\Delta\\varepsilon t$ times a fixed field. The leak is

$$s=\\partial_t\\rho+\\nabla\\cdot\\mathbf j=-\\Delta\\varepsilon\\,\\phi_H\\phi_L+\\tfrac12(\\phi_L\\nabla^2\\phi_H-\\phi_H\\nabla^2\\phi_L),$$

evaluated from the Gaussians' Laplacians alone. It splits identically into two parts, $s=e+b$: the frozen-exchange part $e=\\phi_H(K\\phi_L)-\\phi_L(K\\phi_H)$, with $K$ the Hartree–Fock exchange operator over the five occupied orbitals (each $(K\\phi_a)(\\mathbf r)=\\sum_i\\phi_i(\\mathbf r)V_{{ia}}(\\mathbf r)$, $V_{{ia}}$ the electrostatic potential of the pair density $\\phi_i\\phi_a$, which is the ESP pass's integral applied to orbital pairs), and the finite-basis part $b=\\phi_H r_L-\\phi_L r_H$, with $r_a=F\\phi_a-\\varepsilon_a\\phi_a$ the pointwise Fock residual, zero in a complete basis and orthogonal to the basis in a finite one. The multiplicative potentials cancel in $b$, so $b$ is bounded; its sharpest feature is the oxygen 1s primitive's Laplacian, 0.06 bohr wide.

Then the repair: $\\mathbf c^*=\\nabla\\varphi$ with $-\\nabla^2\\varphi=s$ on the exported box (half-width {top['half']:.3f} bohr, cell-centred, seven-point stencil), under two boundary conditions: closed walls (no flux, $\\partial_n\\varphi=0$, a cosine transform) and open walls ($\\varphi=0$, a sine transform). In both the discrete continuity residual $\\nabla\\cdot(\\mathbf j+\\mathbf c^*)+\\partial_t\\rho$ is at machine precision.

## What was found

{table}

Analytic values: $\\Delta\\varepsilon={top['dEps']:.5f}$, $x_{{HL}}={top['x_HL']:.5f}$, $g_{{HL}}={top['g_HL']:.5f}$, $q={q:.4f}$, $\\int x\\,s=-\\Delta\\varepsilon x_{{HL}}+g_{{HL}}={xs_an:+.5f}$, $\\int j_x=-g_{{HL}}={-top['g_HL']:.5f}$. The grid's exchange and Hartree matrix elements agree with PySCF's two-electron integrals to {top['check_exchange_matrix_grid_vs_int2e']['max_abs_diff']:.0e} and {top['check_hartree_matrix_grid_vs_int2e']['max_abs_diff']:.0e} at the finest grid, which checks the `int1e_grids` route independently of the Laplacian route.

1. **The leak's first moment is three quarters basis, one quarter exchange.** Paper 2 said the first moment of the source, $2.32$ times the dipole rate, "collects the frozen exchange operator and the finite basis". Split: exchange {share_e:.3f}, basis {share_b:.3f} (converged to the third digit between the last two grids). STO-3G, not the frozen exchange, is the main reason the water packet's net current runs against its centre. The two parts also live in different places: {near['e']*100:.0f} % of the exchange part's $L^1$ mass lies within 0.3 bohr of a nucleus against {near['b']*100:.0f} % of the basis part's.

2. **Continuity can always be repaired; the net flow cannot be repaired by a potential alone.** The plan's Lemma B said that any conserving current has net flow equal to the dipole rate. That needs the current to decay faster than $1/r^3$, and the minimal-norm repair does not: $\\varphi$ has a dipole tail because $\\int\\mathbf r\\,s\\neq0$. The correct statement is $\\int_\\Omega\\mathbf c=\\int_\\Omega\\mathbf r\\,s-\\oint_{{\\partial\\Omega}}\\mathbf r\\,(\\mathbf c\\cdot\\mathbf n)\\,dA$: the repair carries the missing dipole rate through the interior only to the extent that it does not carry it through the walls. The pilot shows the three cases. **Closed walls** (no flux): the repaired net current is $q'={top['repair']['neumann']['q_repaired']:+.4f}$ times the dipole rate at the finest grid, converging to $+1$ as the quadrature does (1.18, 1.02, 1.003, …); the sign reversal predicted in the plan holds, under this boundary condition. **Open walls**: the interior net flow of the repair is {top['repair']['dirichlet']['net_flow_interior'][0]:+.5f} and shrinking, so $q'$ stays at $q$; the whole first moment leaves as wall flux ({top['repair']['dirichlet']['x_wall_flux_moment']:+.5f} against $\\int x\\,s={top['leak_s']['x']:+.5f}$). **Free space**: the dipole tail integrated over a ball or a cube gives one third, $q'=(2q+1)/3={(2*q+1)/3:+.3f}$, still against the centre. The plan's own kill clause ("if the numerical $q$ after repair is not 1 … Lemma B's decay hypothesis or the Poisson boundary is wrong") fired on the free-space form and is answered by the confined one.

3. **The repair is small and the reversal is large.** The repair's $L^2$ norm is {top['repair']['neumann']['norm_c_over_norm_j']:.2f} of the current's, yet it moves the net flow by $2.32$ times the dipole rate, because the current's net flow is a small residual of a large circulating field. That is the paper's picture in one sentence.

## Corrected lemmas for §3.1 of THE NEXT PAPERS

*Lemma A (minimal confined repair).* On a bounded box $\\Omega$ with $\\int_\\Omega s=0$, among all $\\mathbf c$ with $\\nabla\\cdot\\mathbf c=-s$ and $\\mathbf c\\cdot\\mathbf n=0$ on $\\partial\\Omega$, the one of least $L^2$ norm is $\\mathbf c^*=\\nabla\\varphi$ with $-\\nabla^2\\varphi=s$, $\\partial_n\\varphi=0$. *Proof.* Helmholtz on a bounded domain with the no-flux condition: $\\mathbf c=\\nabla\\varphi+\\mathbf w$, $\\nabla\\cdot\\mathbf w=0$, $\\mathbf w\\cdot\\mathbf n=0$; then $\\int\\nabla\\varphi\\cdot\\mathbf w=\\oint\\varphi\\,\\mathbf w\\cdot\\mathbf n-\\int\\varphi\\nabla\\cdot\\mathbf w=0$. $\\square$

*Lemma B (net flow of a confined conserving current).* If $\\nabla\\cdot(\\mathbf j+\\mathbf c)=-\\partial_t\\rho$ in $\\Omega$ and $(\\mathbf j+\\mathbf c)\\cdot\\mathbf n=0$ on $\\partial\\Omega$, then $\\int_\\Omega(\\mathbf j+\\mathbf c)=\\tfrac{{d}}{{dt}}\\langle\\mathbf r\\rangle$. *Proof.* $\\int\\mathbf r\\,\\nabla\\cdot\\mathbf v=\\oint\\mathbf r\\,(\\mathbf v\\cdot\\mathbf n)-\\int\\mathbf v$. $\\square$ Without the wall condition the identity carries the wall term, and the free-space minimal repair keeps only one third of the missing moment inside any ball or cube.

Both are discrete identities on the cell-centred grid as well (summation by parts with cell-centre coordinates at the walls), which is why the pilot's identity residuals read $10^{{-14}}$: the numerical content of the test is in $\\int x\\,s$ and $\\int j_x$, each computed from analytic functions and compared with their analytic values.

## What this means for Paper 3

- The thesis sharpens. Not "the repair restores the dipole rate" but: a finite basis leaks probability locally; the leak is three quarters basis and one quarter frozen exchange for water in STO-3G; it can always be plumbed back by a potential flow; and the missing dipole rate is then either carried inside (closed walls) or pushed through the walls (open walls), never lost. The boundary condition is physics, not numerics: the app's box has closed walls.
- The carrying figure is `leak_repair_N{Ns[-1]}.png`: the leak and its two parts in the $y=0$ section, then the current, the repair and the repaired current.
- Next computations, all CPU: the same for water in 6-31G and 6-31G* from the volume rungs (the basis part should shrink, the exchange part not); the benzene ring packet (first many-electron instance); the time-dependent version where the Poisson solve runs once per frame in the app's GPU pass with its Neumann walls.
- The app shortfall this exposes: the GPU Poisson pass's boundary condition decides whether a repaired FLOW carries the dipole rate; it must be the closed-wall one for the meter to read $+1$.

## Files

`leak_repair.py` (the computation; `python -I leak_repair.py N`), `figure.py` (the picture), `run_all.sh`, `leak_repair_N*.json` (every number above), `leak_repair_N*.png`. The field grids `fields_N*.npz` are regenerated, not kept in git.
"""
open(os.path.join(HERE, 'LEAK-AND-REPAIR.md'), 'w').write(note)

# patch the plan's §3.1
t = open(PLAN).read()
old_thesis = "the unique correction of minimal $L^2$ norm that makes the current conserving is a gradient, $\\mathbf c^*=\\nabla\\varphi$ with $\\nabla^2\\varphi=-S$, and the repaired current's net flow is exactly the dipole rate."
new_thesis = ("the unique correction of minimal $L^2$ norm that makes the current conserving and confined is a gradient, $\\mathbf c^*=\\nabla\\varphi$ with $\\nabla^2\\varphi=-S$ and no flux at the walls, and the repaired current's net flow is then exactly the dipole rate. "
              "(Corrected on 24 October, evening, by the pilot: the net flow depends on the walls. Closed walls carry the dipole rate inside, $q'\\to+1$; open walls push it out as wall flux, $q'=q$; free space keeps one third. See `leak/LEAK-AND-REPAIR.md`.)")
assert old_thesis in t; t = t.replace(old_thesis, new_thesis)
i0 = t.index("*Lemma A (minimal conserving completion).*"); i1 = t.index("**What must be computed.**")
lemmas = ("*Lemma A (minimal confined repair).* On a bounded box $\\Omega$ with $\\int_\\Omega S=0$, among all $\\mathbf c$ with $\\nabla\\cdot\\mathbf c=-S$ and $\\mathbf c\\cdot\\mathbf n=0$ on $\\partial\\Omega$, the one of least $L^2$ norm is $\\mathbf c^*=\\nabla\\varphi$, $-\\nabla^2\\varphi=S$, $\\partial_n\\varphi=0$. *Proof.* Helmholtz on a bounded domain with the no-flux condition: any admissible $\\mathbf c=\\nabla\\varphi+\\mathbf w$ with $\\nabla\\cdot\\mathbf w=0$, $\\mathbf w\\cdot\\mathbf n=0$, and $\\int\\nabla\\varphi\\cdot\\mathbf w=\\oint\\varphi\\,\\mathbf w\\cdot\\mathbf n-\\int\\varphi\\,\\nabla\\cdot\\mathbf w=0$, so $\\|\\mathbf c\\|^2=\\|\\nabla\\varphi\\|^2+\\|\\mathbf w\\|^2$. $\\square$ (Classical, the Helmholtz–Hodge projection on a bounded domain. Status `[C]`.)\n\n"
          "*Lemma B (net flow of a confined conserving current).* If $\\nabla\\cdot\\mathbf j'=-\\partial_t\\rho$ in $\\Omega$ and $\\mathbf j'\\cdot\\mathbf n=0$ on $\\partial\\Omega$, then $\\int_\\Omega\\mathbf j'=\\tfrac{d}{dt}\\langle\\mathbf r\\rangle$. *Proof.* $\\int\\mathbf r\\,\\nabla\\cdot\\mathbf j'=\\oint\\mathbf r\\,(\\mathbf j'\\cdot\\mathbf n)\\,dA-\\int\\mathbf j'$. $\\square$ Without the wall condition the identity keeps the wall term: the open-wall repair carries the whole missing moment out through the walls and leaves $q'=q$, and the free-space minimal repair, whose potential has a dipole tail because $\\int\\mathbf r S\\ne0$, keeps one third of it inside any ball or cube, $q'=(2q+1)/3$. The earlier draft of this lemma assumed decay the minimal repair does not have; the pilot's kill clause caught it. So the repair closes the dipole gap of Proposition 2 exactly under closed walls, which is the app's box: for the water packet the repaired net current changes sign, from $-1.32$ times the dipole rate to $+1$ times it. (Status `[PROV]`: the pilot of 24 October reproduces $q'=+1.003$ at $160^3$ and converging, with the identity residuals at $10^{-14}$; see `leak/LEAK-AND-REPAIR.md`.)\n\n"
          f"**The pilot (24 October, evening; `leak/leak_repair.py`, {top['time_total_s']:.0f} s on two CPU threads at {Ns[-1]}³).** The leak drawn from the Laplacians alone and split identically into the frozen-exchange part and the finite-basis part (the pointwise Fock residual): the first moment is {share_b:.2f} basis and {share_e:.2f} exchange, so STO-3G, not the frozen exchange, is the main reason the net current runs against the centre; the exchange part is diffuse ({near['e']*100:.0f} % of its mass within 0.3 bohr of a nucleus) and the basis part sits on the nuclei ({near['b']*100:.0f} %). The repair's norm is {top['repair']['neumann']['norm_c_over_norm_j']:.2f} of the current's and it moves the net flow by 2.32 dipole rates: the net flow is a small residual of a large circulating field. The figure is `leak/leak_repair_N{Ns[-1]}.png`.\n\n")
t = t[:i0] + lemmas + t[i1:]
old_dies = "If the numerical $q$ after repair is not 1 to the quadrature's accuracy, Lemma B's decay hypothesis or the Poisson boundary is wrong and the paper is not ready."
new_dies = "The first kill clause already fired and was answered: the free-space repair does not give $q'=1$ (its potential has a dipole tail), the confined one does. What remains: if the 6-31G and 6-31G* rungs do not shrink the basis part while the exchange part holds, the three-quarters/one-quarter split is an STO-3G accident and the thesis must be narrowed to it."
assert old_dies in t; t = t.replace(old_dies, new_dies)
open(PLAN, 'w').write(t); print('note and plan written; grids', Ns)
