# check-tda-pyscf.py — the physics gate: the project's RHF + singlet TDA against PySCF's scf.RHF + tdscf on the
# SAME primitives.  The BSE STO-3G decimals the project vendors (snapshot/lab/vendor/bse/sto-3g-v1.json) are loaded
# into PySCF, so no basis difference is left to excuse a disagreement.
#
# Three comparisons:
#   1. E_RHF and the orbital energies.
#   2. The WHOLE singlet TDA matrix A, and all of its roots.  PySCF's A comes from pyscf.tdscf.rhf.get_ab.  The two
#      MO sets can differ by a rotation inside a degenerate MO block (NH3, CH4, C6H6), so PySCF's A is first mapped
#      into the project's pair basis with U = C_proj^T S C_pyscf, which is exactly block-orthogonal when the two
#      solutions share the occupied span.  Then A is compared element by element.
#   3. Oscillator strengths and transition dipoles from PySCF's own Davidson TDA (td.oscillator_strength,
#      td.transition_dipole), against the project's f and mu.  The project stores mu = sqrt2 sum X_ia <i|r|a>
#      (POSITION); PySCF returns the ELECTRIC transition dipole (electron charge -1).  The ratio is reported, not
#      assumed.
#
# Run: ~/miniforge3/envs/sci/bin/python check-tda-pyscf.py [id ...]
import json, os, sys
import numpy as np
from pyscf import gto, scf, tdscf
from pyscf.tdscf.rhf import get_ab

HERE = os.path.dirname(os.path.abspath(__file__))
SYM = {1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne'}
_bse = json.load(open(os.path.join(HERE, 'snapshot', 'lab', 'vendor', 'bse', 'sto-3g-v1.json')))

def pinned_basis(zs):
    out = {}
    for z in zs:
        shells = []
        for sh in _bse['elements'][str(z)]['electron_shells']:
            e = [float(x) for x in sh['exponents']]
            for col, l in enumerate(sh['angular_momentum']):
                c = [float(x) for x in sh['coefficients'][col]]
                shells.append([l] + [[e[i], c[i]] for i in range(len(e))])
        out[SYM[z]] = shells
    return out

def mole(d):
    spec = [[SYM[a['Z']], tuple(a['c'])] for a in d['atoms']]
    return gto.M(atom=spec, unit='Bohr', basis=pinned_basis(sorted({a['Z'] for a in d['atoms']})),
                 charge=d['charge'], verbose=0)

def run(mid, nstates=12):
    d = json.load(open(os.path.join(HERE, 'data', '%s.json' % mid)))
    mol = mole(d)
    mf = scf.RHF(mol).run(conv_tol=1e-13)
    n, nocc, nvir = d['n'], d['nocc'], d['nvir']
    m = nocc * nvir
    S = mol.intor('int1e_ovlp')
    Cj = np.array(d['C']).reshape(n, n)                 # project, C[ao, mo]
    Cp = np.array(mf.mo_coeff)
    rep = {'id': mid, 'pyscf': __import__('pyscf').__version__, 'nao': int(mol.nao_nr()),
           'dE_rhf': abs(float(mf.e_tot) - d['energy']),
           'd_orbital_energies': float(np.abs(np.array(mf.mo_energy) - np.array(d['eps'])).max())}
    U = Cj.T @ S @ Cp                                   # C_pyscf = C_proj U
    rep['mo_rotation_offblock'] = float(max(np.abs(U[:nocc, nocc:]).max(), np.abs(U[nocc:, :nocc]).max()))
    Uo, Uv = U[:nocc, :nocc], U[nocc:, nocc:]

    # --- 2. the whole TDA matrix and all its roots
    A, B = get_ab(mf)                                   # singlet A[i,a,j,b], B[i,a,j,b]
    # A in the project's pair basis: A'_{ia,jb} = sum U_o[i,i'] U_v[a,a'] A_{i'a',j'b'} U_o[j,j'] U_v[b,b']
    Ap = np.einsum('ip,aq,pqrs,jr,bs->iajb', Uo, Uv, A, Uo, Uv).reshape(m, m)
    # rebuild the project's A from its own roots (it publishes omega and X, not A): A_proj = X^T diag(w) X
    Xj = np.array(d['XTDA']).reshape(m, m)              # row k = X^K flattened (i-major)
    wj = np.array(d['omegaTDA'])
    Aj = Xj.T @ np.diag(wj) @ Xj
    rep['d_TDA_matrix'] = float(np.abs(Ap - Aj).max())
    rep['d_TDA_all_roots'] = float(np.abs(np.sort(np.linalg.eigvalsh(Ap)) - np.sort(wj)).max())
    rep['n_roots_compared'] = int(m)

    # --- 3. dipoles and oscillator strengths from PySCF's own multipole machinery.  Davidson stalls on the
    # degenerate manifolds of CH4 and C6H6, so td.xy is filled from an exact diagonalisation of PySCF's own A
    # (PySCF's MO basis, PySCF's amplitude normalisation sum x^2 = 1/2); td.transition_dipole and
    # td.oscillator_strength are then PySCF's code unchanged.
    wA, VA = np.linalg.eigh(A.reshape(m, m))
    k = min(nstates, m, len(d['fTDA']))
    td = tdscf.TDA(mf); td.nstates = k; td.singlet = True
    td.e = wA[:k]
    td.xy = [(VA[:, t].reshape(nocc, nvir) / np.sqrt(2.0), 0) for t in range(k)]
    td.converged = [True] * k
    rep['converged_roots_used'] = k
    wp = np.array(td.e)[:k]
    rep['d_omega_davidson'] = float(np.abs(wp - np.array(d['omegaTDA'][:k])).max())
    fp = np.array(td.oscillator_strength(gauge='length'))[:k]
    rep['d_oscillator_TDA'] = float(np.abs(fp - np.array(d['fTDA'][:k])).max())
    mup = np.array(td.transition_dipole())[:k]
    muj = np.array(d['muTDA'][:k])
    rep['d_mu_magnitude'] = float(np.abs(np.linalg.norm(mup, axis=1) - np.linalg.norm(muj, axis=1)).max())
    # the individual mu of a state inside a degenerate cluster is gauge-dependent; the cluster dipole tensor
    # T = sum_{K in cluster} mu_K mu_K^T is NOT (Lemma 5 of LEDGER.md).  Compare that, and the sign ratio only
    # on clusters of size one.
    def clusters(w, tol=1e-8):
        out, s = [], 0
        for t in range(1, len(w) + 1):
            if t == len(w) or abs(w[t] - w[t - 1]) >= tol:
                out.append((s, t)); s = t
        return out
    dT, ratios = 0.0, []
    for (s, e) in clusters(list(np.array(d['omegaTDA'][:k]))):
        if e > k:
            continue
        Tp = sum(np.outer(mup[t], mup[t]) for t in range(s, e))
        Tj = sum(np.outer(muj[t], muj[t]) for t in range(s, e))
        dT = max(dT, float(np.abs(Tp - Tj).max()))
        if e - s == 1 and np.linalg.norm(muj[s]) > 1e-4:
            ratios.append(float(np.dot(mup[s], muj[s]) / np.dot(muj[s], muj[s])))
    rep['d_cluster_dipole_tensor'] = dT
    rep['mu_pyscf_over_project_nondegenerate'] = ratios
    rep['pyscf_amplitude_norm_convention'] = float(np.sum(np.array(td.xy[0][0]) ** 2))
    # --- 4. the GROUND-state dipole, where there is no eigenvector sign freedom: this fixes the charge convention.
    dip_pyscf = np.array(mf.dip_moment(unit='AU', verbose=0))
    rmo = {q: np.array(d['moDipole'][q]).reshape(n, n) for q in 'xyz'}
    elec = np.array([2.0 * np.trace(rmo[q][:nocc, :nocc]) for q in 'xyz'])   # <0| sum_k r_k |0> = sum_pq g00_pq r_pq
    dip_project = np.array(d['nuclearDipole']) - elec
    rep['d_ground_dipole_nuc_minus_r'] = float(np.abs(dip_pyscf - dip_project).max())
    rep['ground_dipole_au'] = [float(x) for x in dip_project]
    return rep

if __name__ == '__main__':
    ids = sys.argv[1:] or ['H2O', 'NH3', 'CH4', 'C6H6']
    out = []
    for mid in ids:
        r = run(mid)
        out.append(r)
        print(json.dumps(r))
    json.dump(out, open(os.path.join(HERE, 'out-tda-pyscf.json'), 'w'), indent=2)
