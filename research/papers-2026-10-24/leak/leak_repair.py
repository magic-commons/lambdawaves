"""leak_repair.py — THE LEAK AND THE REPAIR, pilot on the exported water solution (Paper 2, Equation 7).

Post-processing only: the exported H2O/STO-3G record is read, PySCF evaluates the AOs with second derivatives (eval_gto) and the
one-electron Coulomb integrals on grid points (int1e_grids). No SCF, no two-electron integral, no propagation, no solver.

For the packet psi = (e^{-i eps_H t} phi_H + e^{-i eps_L t} phi_L)/sqrt2, every time-dependent quantity is sin(dEps t) times a field:
    d rho/dt = -dEps phi_H phi_L                      j = (phi_L grad phi_H - phi_H grad phi_L)/2
    s = d rho/dt + div j = -dEps phi_H phi_L + (phi_L lap phi_H - phi_H lap phi_L)/2            (THE LEAK, from the Laplacians alone)
    e = phi_H (K phi_L) - phi_L (K phi_H)              (the frozen-exchange part, K the HF exchange operator over the five occupied orbitals)
    b = phi_H r_L - phi_L r_H,  r_a = F phi_a - eps_a phi_a   (the finite-basis part: the pointwise Fock residual, orthogonal to the basis)
and s = e + b identically.  Integrals:  int s = 0,  int r s = -dEps x_HL + g_HL = (1 - q) d<r>/dt  with q = g_HL/(dEps x_HL).

THE REPAIR: c = grad phi with -lap phi = s.  Pointwise continuity is restored for ANY boundary condition; the NET FLOW is not:
    int_Omega c = int_Omega r s - oint r (c.n) dA.
    Neumann (c.n = 0, no probability leaves the box): int c = int r s, so the repaired current carries the whole dipole rate, q' = 1.
    Dirichlet (phi = 0 on the walls): int c = oint phi n dA = 0, the missing dipole rate is wall flux, q' = q.
    Free space: the dipole tail gives one third on a ball or a cube, q' = (2q + 1)/3.
Run:  OMP_NUM_THREADS=2 nice -n 19 /home/joshua-hosain/miniforge3/envs/sci/bin/python -I leak_repair.py [N]
"""
import os, sys, json, math, time
import numpy as np
from pyscf import gto
from scipy.fft import dctn, idctn, dstn, idstn

HERE = os.path.dirname(os.path.abspath(__file__))
REC = ('/home/joshua-hosain/Documents/DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING/DRAFTS/'
       'CLAUDE COLLECTION REVIEW — 2026-10-12/figures/source-captures/H2O_STO-3G_solution.json')
N = int(sys.argv[1]) if len(sys.argv) > 1 else 96
t0 = time.time()
rec = json.load(open(REC)); S = rec['solution']; n = S['nAO']; nocc = 5
C = np.array(S['C']).reshape(n, n); eps = np.array(S['eps']); H, L = 4, 5; dE = eps[L] - eps[H]; half = S['half']
atoms = [(a['Z'], (a['x'], a['y'], a['z'])) for a in rec['atomsBohr']]
mol = gto.M(atom=[[{8: 'O', 1: 'H'}[z], xyz] for z, xyz in atoms], unit='Bohr', basis='sto-3g', cart=True, verbose=0)
Sao = mol.intor('int1e_ovlp'); R = mol.intor('int1e_r'); G = -mol.intor('int1e_ipovlp')
xHL = float(C[:, H] @ R[0] @ C[:, L]); gHL = float(C[:, H] @ G[0] @ C[:, L]); q = gHL / (dE * xHL)
out = dict(N=N, half=half, h=2 * half / N, dEps=float(dE), x_HL=xHL, g_HL=gHL, q=q,
           orthonormality_max_abs=float(np.abs(C.T @ Sao @ C - np.eye(n)).max()),
           first_moment_analytic=float(-dE * xHL + gHL))     # int x s, exact: (1 - q) d<x>/dt per unit sin

h = 2 * half / N; x = -half + (np.arange(N) + 0.5) * h; X, Y = np.meshgrid(x, x, indexing='ij')
cHL = C[:, [H, L]]; cocc = C[:, :nocc]; Z = np.array([z for z, _ in atoms], float); Rn = np.array([xyz for _, xyz in atoms])
s = np.zeros((N, N, N)); e = np.zeros_like(s); b = np.zeros_like(s); j = np.zeros((3, N, N, N)); Kgrid = np.zeros((2, 2)); Jgrid = np.zeros((2, 2)); vfar = []
for k in range(N):                                                   # one z-slab at a time
    coords = np.stack([X.ravel(), Y.ravel(), np.full(N * N, x[k])], 1)
    ao = mol.eval_gto('GTOval_cart_deriv2', coords)                  # (10, N^2, n): v, x, y, z, xx, xy, xz, yy, yz, zz
    val = ao[0] @ cHL; grad = np.einsum('qgm,ma->qga', ao[1:4], cHL); lap = (ao[4] + ao[7] + ao[9]) @ cHL
    pH, pL = val[:, 0], val[:, 1]
    sk = -dE * pH * pL + 0.5 * (pL * lap[:, 0] - pH * lap[:, 1])
    jk = 0.5 * (pL[None] * grad[:, :, 0] - pH[None] * grad[:, :, 1])
    V = mol.intor('int1e_grids', grids=coords)                       # (N^2, n, n) = <mu| 1/|r - r_g| |nu>
    Via = np.einsum('gmn,mi,na->gia', V, cocc, cHL)                  # (N^2, nocc, 2)
    Vii = np.einsum('gmn,mi,ni->gi', V, cocc, cocc)                  # (N^2, nocc)
    pocc = ao[0] @ cocc                                              # (N^2, nocc)
    Kp = np.einsum('gi,gia->ga', pocc, Via)                          # (K phi_a)(r)
    vH = 2.0 * Vii.sum(1)                                            # Hartree potential
    vne = -sum(Z[A] / np.linalg.norm(coords - Rn[A], axis=1) for A in range(len(Z)))
    ra = -0.5 * lap + (vne + vH)[:, None] * val - Kp - eps[[H, L]][None, :] * val     # Fock residual, pointwise
    ek = pH * Kp[:, 1] - pL * Kp[:, 0]; bk = pH * ra[:, 1] - pL * ra[:, 0]
    s[:, :, k] = sk.reshape(N, N); e[:, :, k] = ek.reshape(N, N); b[:, :, k] = bk.reshape(N, N); j[:, :, :, k] = jk.reshape(3, N, N)
    Kgrid += (val.T @ Kp) * h ** 3; Jgrid += (val.T @ (vH[:, None] * val)) * h ** 3   # <phi_a|K|phi_b>, <phi_a|v_H|phi_b> by quadrature
    if k == 0: vfar.append((float(np.linalg.norm(coords[0])), float(Via[0, H, 0]), float(1 / np.linalg.norm(coords[0]))))  # V_HH(far) ~ 1/r
dv = h ** 3
out['time_grid_s'] = time.time() - t0
out['check_s_equals_e_plus_b_max_abs_over_max_s'] = float(np.abs(s - e - b).max() / np.abs(s).max())
eri = mol.intor('int2e'); Cm = np.concatenate([cocc, cHL], 1); mo = np.einsum('pqrs,pi,qj,rk,sl->ijkl', eri, Cm, Cm, Cm, Cm)
Kan = np.array([[sum(mo[nocc + a, i, i, nocc + c] for i in range(nocc)) for c in range(2)] for a in range(2)])     # sum_i (a i|i c)
Jan = np.array([[2 * sum(mo[nocc + a, nocc + c, i, i] for i in range(nocc)) for c in range(2)] for a in range(2)]) # 2 sum_i (a c|i i)
out['check_exchange_matrix_grid_vs_int2e'] = dict(grid=Kgrid.tolist(), analytic=Kan.tolist(), max_abs_diff=float(np.abs(Kgrid - Kan).max()))
out['check_hartree_matrix_grid_vs_int2e'] = dict(grid=Jgrid.tolist(), analytic=Jan.tolist(), max_abs_diff=float(np.abs(Jgrid - Jan).max()))
out['check_V_HH_far_corner'] = dict(r=vfar[0][0], V_HH=vfar[0][1], one_over_r=vfar[0][2])
out['check_int_jx_quadrature_vs_minus_gHL'] = dict(quadrature=float(j[0].sum() * dv), analytic=-gHL)
XX, YY, ZZ = np.meshgrid(x, x, x, indexing='ij')
def moments(f): return dict(integral=float(f.sum() * dv), x=float((XX * f).sum() * dv), y=float((YY * f).sum() * dv), z=float((ZZ * f).sum() * dv), L1=float(np.abs(f).sum() * dv), max=float(np.abs(f).max()))
out['leak_s'] = moments(s); out['exchange_e'] = moments(e); out['basis_b'] = moments(b)
out['first_moment_share'] = dict(exchange=out['exchange_e']['x'] / out['leak_s']['x'], basis=out['basis_b']['x'] / out['leak_s']['x'])
dn = np.min([np.sqrt((XX - Rn[A, 0]) ** 2 + (YY - Rn[A, 1]) ** 2 + (ZZ - Rn[A, 2]) ** 2) for A in range(len(Z))], axis=0)
near = dn < 0.3
out['L1_share_within_0.3_bohr_of_a_nucleus'] = dict(s=float(np.abs(s[near]).sum() / np.abs(s).sum()), e=float(np.abs(e[near]).sum() / np.abs(e).sum()), b=float(np.abs(b[near]).sum() / np.abs(b).sum()))

def poisson(src, bc):
    """-lap phi = src on the cell-centred cube, 7-point stencil.  'neumann': zero flux (DCT-II); 'dirichlet': phi = 0 on the walls (DST-II)."""
    kk = np.arange(N)
    if bc == 'neumann':
        src = src - src.mean(); lam = (2 - 2 * np.cos(np.pi * kk / N)) / h ** 2; f = dctn(src, type=2, norm='ortho')
    else:
        lam = (2 - 2 * np.cos(np.pi * (kk + 1) / N)) / h ** 2; f = dstn(src, type=2, norm='ortho')
    den = lam[:, None, None] + lam[None, :, None] + lam[None, None, :]
    if bc == 'neumann': den[0, 0, 0] = 1.0
    f = f / den
    if bc == 'neumann': f[0, 0, 0] = 0.0
    return idctn(f, type=2, norm='ortho') if bc == 'neumann' else idstn(f, type=2, norm='ortho')

def face_gradient(phi, bc):
    """c on the x-, y-, z-faces (N+1 faces per axis); a wall face carries 0 (Neumann) or the ghost-cell value (Dirichlet, ghost = -phi)."""
    out_ = []
    for ax in range(3):
        p = np.moveaxis(phi, ax, 0); g = np.zeros((N + 1,) + p.shape[1:])
        g[1:N] = (p[1:] - p[:-1]) / h
        if bc == 'dirichlet': g[0] = 2 * p[0] / h; g[N] = -2 * p[-1] / h
        out_.append(np.moveaxis(g, 0, ax))
    return out_

def cell_divergence(c):
    return sum(np.diff(c[ax], axis=ax) / h for ax in range(3))

rep = {}
for bc in ('neumann', 'dirichlet'):
    phi = poisson(s, bc); c = face_gradient(phi, bc); div = cell_divergence(c)
    target = s - s.mean() if bc == 'neumann' else s
    interior = [float(np.moveaxis(c[ax], ax, 0)[1:N].sum() * dv) for ax in range(3)]          # net flow through the interior faces
    wall = float(x[-1] * c[0][N].sum() * h ** 2 - x[0] * c[0][0].sum() * h ** 2)   # oint x (c.n) dA, the x-walls (cell-centre x: the discrete identity's)
    for ax in (1, 2):                                                                                      # the y- and z-walls, weighted by x
        f = np.moveaxis(c[ax], ax, 0); xw = np.moveaxis(XX, ax, 0)[0]
        wall += float((xw * (f[N] - f[0])).sum() * h ** 2)
    # cell-centred |c| for comparison with |j|
    cc = np.stack([0.5 * (np.moveaxis(c[ax], ax, 0)[:-1] + np.moveaxis(c[ax], ax, 0)[1:]) for ax in range(3)])
    cc = np.stack([np.moveaxis(cc[ax], 0, ax) for ax in range(3)])
    rep[bc] = dict(continuity_residual_max_abs=float(np.abs(div + target).max()), s_max=float(np.abs(s).max()),
                   net_flow_interior=interior, x_wall_flux_moment=wall,
                   identity_int_xs_plus_wall_minus_int_cx=float(out['leak_s']['x'] + wall - interior[0]),
                   repaired_total_x=float(-gHL + interior[0]), q_repaired=float((-gHL + interior[0]) / (-dE * xHL)),
                   norm_c_over_norm_j=float(np.sqrt((cc ** 2).sum()) / np.sqrt((j ** 2).sum())),
                   max_c_over_max_j=float(np.sqrt((cc ** 2).sum(0)).max() / np.sqrt((j ** 2).sum(0)).max()))
    if bc == 'neumann': np.savez_compressed(os.path.join(HERE, f'fields_N{N}.npz'), x=x, s=s, e=e, b=b, j=j, c=cc, phi=phi, atoms=Rn, Z=Z)
out['repair'] = rep
out['q_free_space_prediction_(2q+1)/3'] = (2 * q + 1) / 3
out['time_total_s'] = time.time() - t0
print(json.dumps(out, indent=1)); json.dump(out, open(os.path.join(HERE, f'leak_repair_N{N}.json'), 'w'), indent=1)
