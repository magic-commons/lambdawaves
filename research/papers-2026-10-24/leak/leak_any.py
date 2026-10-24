"""leak_any.py — THE LEAK AND THE REPAIR for any catalogue molecule and basis: the generalisation of leak_repair.py (water, STO-3G, the exported record).

    python -I leak_any.py --mol water|benzene --basis sto-3g|6-31g|6-31g* --N 160 [--pair H L] [--tag name]

The molecule is solved in RHF by PySCF 2.14 with Cartesian Gaussians (cart=True), the volumes' solver's own program and convention; for water the geometry
is the exported record's (so --mol water --basis sto-3g must reproduce the pilot: E = -74.9630231628625, q = -1.3245), for benzene the catalogue's
(lab/molecules.js BENZENE: carbons at 1.39 Å on k·60°, hydrogens at 2.48 Å, the ring in the xy plane). The box is the app's DOMAIN AUTO rule,
half = max|coordinate| + 6 bohr. The packet is (phi_H + i phi_L)/sqrt2 for the chosen pair (default: the HOMO and the LUMO; with degenerate frontier
pairs, --pair picks, and every frontier pair's x_HL, g_HL and q is reported). Everything else is leak_repair.py's: the leak s from the Laplacians, the
split s = e + b through int1e_grids, the moments, the Neumann and Dirichlet repairs, the checks. Output: leak_<tag>_N<N>.json and fields_<tag>_N<N>.npz.
Run politely: OMP_NUM_THREADS=2 nice -n 19 /home/joshua-hosain/miniforge3/envs/sci/bin/python -I leak_any.py ...
"""
import os, sys, json, math, time, argparse
import numpy as np
from pyscf import gto, scf
from scipy.fft import dctn, idctn, dstn, idstn

HERE = os.path.dirname(os.path.abspath(__file__))
REC = ('/home/joshua-hosain/Documents/DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING/DRAFTS/'
       'CLAUDE COLLECTION REVIEW — 2026-10-12/figures/source-captures/H2O_STO-3G_solution.json')
ap = argparse.ArgumentParser(); ap.add_argument('--mol', default='water'); ap.add_argument('--basis', default='sto-3g'); ap.add_argument('--N', type=int, default=96)
ap.add_argument('--pair', type=int, nargs=2, default=None); ap.add_argument('--tag', default=None); args = ap.parse_args()
t0 = time.time()
if args.mol == 'water':
    rec = json.load(open(REC)); atoms = [(a['Z'], (a['x'], a['y'], a['z'])) for a in rec['atomsBohr']]; unit = 'Bohr'; ref_E = rec['solution']['energy']
elif args.mol == 'benzene':
    atoms = []
    for k in range(6):
        t = k * math.pi / 3; atoms.append((6, (1.39 * math.cos(t), 1.39 * math.sin(t), 0.0))); atoms.append((1, (2.48 * math.cos(t), 2.48 * math.sin(t), 0.0)))
    unit = 'Angstrom'; ref_E = None
else: raise SystemExit('unknown molecule')
SYM = {1: 'H', 6: 'C', 8: 'O'}
mol = gto.M(atom=[[SYM[z], xyz] for z, xyz in atoms], unit=unit, basis=args.basis, cart=True, verbose=0)
mf = scf.RHF(mol); mf.conv_tol = 1e-12; E = mf.kernel(); assert mf.converged
C = mf.mo_coeff; eps = mf.mo_energy; n = mol.nao; nocc = mol.nelectron // 2; Rn = mol.atom_coords(); Z = mol.atom_charges().astype(float)
half = float(np.abs(Rn).max() + 6.0); N = args.N; h = 2 * half / N; tag = args.tag or f"{args.mol}_{args.basis.replace('*', 'd')}"
Sao = mol.intor('int1e_ovlp'); R = mol.intor('int1e_r'); G = -mol.intor('int1e_ipovlp')
# the frontier pairs: every (occupied within 1e-6 of the HOMO) x (virtual within 1e-6 of the LUMO)
Hs = [i for i in range(nocc) if abs(eps[i] - eps[nocc - 1]) < 1e-6]; Ls = [a for a in range(nocc, n) if abs(eps[a] - eps[nocc]) < 1e-6]
pairs = {}
for i in Hs:
    for a in Ls:
        dE = float(eps[a] - eps[i]); xv = [float(C[:, i] @ R[q] @ C[:, a]) for q in range(3)]; gv = [float(C[:, i] @ G[q] @ C[:, a]) for q in range(3)]
        comp = int(np.argmax(np.abs(xv))); pairs[f'{i},{a}'] = dict(dEps=dE, x_HL=xv, g_HL=gv, component=comp, q=(gv[comp] / (dE * xv[comp]) if abs(xv[comp]) > 1e-9 else None))
if args.pair: H, L = args.pair
else:
    best = max(pairs, key=lambda k: max(abs(v) for v in pairs[k]['x_HL'])); H, L = map(int, best.split(','))
P = pairs[f'{H},{L}']; dE = P['dEps']; comp = P['component']; xHL = P['x_HL'][comp]; gHL = P['g_HL'][comp]; q = gHL / (dE * xHL)
out = dict(molecule=args.mol, basis=args.basis, nAO=int(n), nocc=int(nocc), E_RHF=float(E), E_reference=ref_E, N=N, half=half, h=h, pair=[H, L], component=comp,
           eps_H=float(eps[H]), eps_L=float(eps[L]), dEps=dE, x_HL=xHL, g_HL=gHL, q=q, frontier_pairs=pairs, first_moment_analytic=float(-dE * xHL + gHL))
x = -half + (np.arange(N) + 0.5) * h; X, Y = np.meshgrid(x, x, indexing='ij')
cHL = C[:, [H, L]]; cocc = C[:, :nocc]
s = np.zeros((N, N, N)); e = np.zeros_like(s); b = np.zeros_like(s); j = np.zeros((3, N, N, N)); Kgrid = np.zeros((2, 2)); Jgrid = np.zeros((2, 2))
for k in range(N):
    coords = np.stack([X.ravel(), Y.ravel(), np.full(N * N, x[k])], 1)
    ao = mol.eval_gto('GTOval_cart_deriv2', coords)
    val = ao[0] @ cHL; grad = np.einsum('qgm,ma->qga', ao[1:4], cHL); lap = (ao[4] + ao[7] + ao[9]) @ cHL
    pH, pL = val[:, 0], val[:, 1]
    sk = -dE * pH * pL + 0.5 * (pL * lap[:, 0] - pH * lap[:, 1]); jk = 0.5 * (pL[None] * grad[:, :, 0] - pH[None] * grad[:, :, 1])
    V = mol.intor('int1e_grids', grids=coords)
    Via = np.einsum('gmn,mi,na->gia', V, cocc, cHL); Vii = np.einsum('gmn,mi,ni->gi', V, cocc, cocc); pocc = ao[0] @ cocc
    Kp = np.einsum('gi,gia->ga', pocc, Via); vH = 2.0 * Vii.sum(1)
    vne = -sum(Z[A] / np.linalg.norm(coords - Rn[A], axis=1) for A in range(len(Z)))
    ra = -0.5 * lap + (vne + vH)[:, None] * val - Kp - eps[[H, L]][None, :] * val
    ek = pH * Kp[:, 1] - pL * Kp[:, 0]; bk = pH * ra[:, 1] - pL * ra[:, 0]
    s[:, :, k] = sk.reshape(N, N); e[:, :, k] = ek.reshape(N, N); b[:, :, k] = bk.reshape(N, N); j[:, :, :, k] = jk.reshape(3, N, N)
    Kgrid += (val.T @ Kp) * h ** 3; Jgrid += (val.T @ (vH[:, None] * val)) * h ** 3
dv = h ** 3; out['time_grid_s'] = time.time() - t0
# analytic exchange and Hartree matrix elements over the pair, from the two-electron integrals (via the J/K builders, no full transformation)
dmH = np.outer(C[:, H], C[:, H]); dmL = np.outer(C[:, L], C[:, L]); dmHL = np.outer(C[:, H], C[:, L])
Kan = np.zeros((2, 2)); Jan = np.zeros((2, 2)); Docc = 2 * cocc @ cocc.T
Jm, Km = mf.get_jk(mol, Docc)          # Hartree of the ground state (J) and exchange K[Docc] = 2 sum_i (.i|i.)
for a, ca in enumerate((C[:, H], C[:, L])):
    for c, cc in enumerate((C[:, H], C[:, L])):
        Kan[a, c] = 0.5 * ca @ Km @ cc; Jan[a, c] = ca @ Jm @ cc
out['check_exchange_matrix_grid_vs_int2e'] = dict(grid=Kgrid.tolist(), analytic=Kan.tolist(), max_abs_diff=float(np.abs(Kgrid - Kan).max()))
out['check_hartree_matrix_grid_vs_int2e'] = dict(grid=Jgrid.tolist(), analytic=Jan.tolist(), max_abs_diff=float(np.abs(Jgrid - Jan).max()))
out['check_s_equals_e_plus_b_max_abs_over_max_s'] = float(np.abs(s - e - b).max() / np.abs(s).max())
out['check_int_j_quadrature_vs_minus_gHL'] = dict(quadrature=[float(j[q].sum() * dv) for q in range(3)], analytic=[-v for v in P['g_HL']])
XX, YY, ZZ = np.meshgrid(x, x, x, indexing='ij'); XYZ = (XX, YY, ZZ)
def moments(f): return dict(integral=float(f.sum() * dv), r=[float((XYZ[q] * f).sum() * dv) for q in range(3)], L1=float(np.abs(f).sum() * dv), max=float(np.abs(f).max()))
out['leak_s'] = moments(s); out['exchange_e'] = moments(e); out['basis_b'] = moments(b)
out['first_moment_share'] = dict(exchange=out['exchange_e']['r'][comp] / out['leak_s']['r'][comp], basis=out['basis_b']['r'][comp] / out['leak_s']['r'][comp])
dn = np.min([np.sqrt((XX - Rn[A, 0]) ** 2 + (YY - Rn[A, 1]) ** 2 + (ZZ - Rn[A, 2]) ** 2) for A in range(len(Z))], axis=0); near = dn < 0.3
out['L1_share_within_0.3_bohr_of_a_nucleus'] = dict(s=float(np.abs(s[near]).sum() / np.abs(s).sum()), e=float(np.abs(e[near]).sum() / np.abs(e).sum()), b=float(np.abs(b[near]).sum() / np.abs(b).sum()))
del XX, YY, ZZ, dn, near
def poisson(src, bc):
    kk = np.arange(N)
    if bc == 'neumann': src = src - src.mean(); lam = (2 - 2 * np.cos(np.pi * kk / N)) / h ** 2; f = dctn(src, type=2, norm='ortho')
    else: lam = (2 - 2 * np.cos(np.pi * (kk + 1) / N)) / h ** 2; f = dstn(src, type=2, norm='ortho')
    den = lam[:, None, None] + lam[None, :, None] + lam[None, None, :]
    if bc == 'neumann': den[0, 0, 0] = 1.0
    f = f / den
    if bc == 'neumann': f[0, 0, 0] = 0.0
    return idctn(f, type=2, norm='ortho') if bc == 'neumann' else idstn(f, type=2, norm='ortho')
def face_gradient(phi, bc):
    out_ = []
    for ax in range(3):
        p = np.moveaxis(phi, ax, 0); g = np.zeros((N + 1,) + p.shape[1:]); g[1:N] = (p[1:] - p[:-1]) / h
        if bc == 'dirichlet': g[0] = 2 * p[0] / h; g[N] = -2 * p[-1] / h
        out_.append(np.moveaxis(g, 0, ax))
    return out_
rep = {}
for bc in ('neumann', 'dirichlet'):
    phi = poisson(s, bc); c = face_gradient(phi, bc); div = sum(np.diff(c[ax], axis=ax) / h for ax in range(3)); target = s - s.mean() if bc == 'neumann' else s
    interior = [float(np.moveaxis(c[ax], ax, 0)[1:N].sum() * dv) for ax in range(3)]
    cc = np.stack([np.moveaxis(0.5 * (np.moveaxis(c[ax], ax, 0)[:-1] + np.moveaxis(c[ax], ax, 0)[1:]), 0, ax) for ax in range(3)])
    rep[bc] = dict(continuity_residual_max_abs=float(np.abs(div + target).max()), net_flow_interior=interior,
                   repaired_total=float(-gHL + interior[comp]), q_repaired=float((-gHL + interior[comp]) / (-dE * xHL)),
                   norm_c_over_norm_j=float(np.sqrt((cc ** 2).sum()) / np.sqrt((j ** 2).sum())))
    if bc == 'neumann': np.savez_compressed(os.path.join(HERE, f'fields_{tag}_N{N}.npz'), x=x, s=s, e=e, b=b, j=j, c=cc, phi=phi, atoms=Rn, Z=Z, pair=np.array([H, L]), comp=comp)
    del phi, c, div, cc
out['repair'] = rep; out['q_free_space_prediction_(2q+1)/3'] = (2 * q + 1) / 3; out['time_total_s'] = time.time() - t0
print(json.dumps({k: v for k, v in out.items() if k != 'frontier_pairs'}, indent=1)); json.dump(out, open(os.path.join(HERE, f'leak_{tag}_N{N}.json'), 'w'), indent=1)
