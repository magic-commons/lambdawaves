# check-current.py — the SIGN of the current map Im D -> j, on real space.
#
# JUDGMENT.md section 2 (Observation 1) writes
#     j = 1/2 sum_{mu nu} Im D_{mu nu} ( chi_nu grad chi_mu - chi_mu grad chi_nu ) ,
# while its section 3 defines D from gamma_pq = <A| E_pq |B>.  Expanding the current-density operator in that same
# convention gives the OPPOSITE sign.  Here the two candidates are evaluated against the elementary one-electron
# current j = Im(conj(psi) grad psi) for psi = (phi_1 + i phi_2)/sqrt2 on a degenerate MO pair of benzene, with
# PySCF's eval_gto(deriv=1) supplying the AO values and gradients.  A one-body operator's matrix element is linear
# in D, so the verdict carries to the many-electron case unchanged.
#
# Run: ~/miniforge3/envs/sci/bin/python check-current.py [id]
import json, os, sys
import numpy as np
from pyscf import gto

HERE = os.path.dirname(os.path.abspath(__file__))
SYM = {1: 'H', 6: 'C', 7: 'N', 8: 'O'}
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

def run(mid='C6H6'):
    d = json.load(open(os.path.join(HERE, 'data', '%s.json' % mid)))
    n, nocc = d['n'], d['nocc']
    mol = gto.M(atom=[[SYM[a['Z']], tuple(a['c'])] for a in d['atoms']], unit='Bohr',
                basis=pinned_basis(sorted({a['Z'] for a in d['atoms']})), charge=d['charge'], verbose=0)
    C = np.array(d['C']).reshape(n, n)
    eps = np.array(d['eps'])
    # the highest degenerate occupied pair
    pair = None
    for k in range(nocc - 1, 0, -1):
        if abs(eps[k] - eps[k - 1]) < 1e-8:
            pair = (k - 1, k); break
    assert pair is not None, 'no degenerate occupied pair'
    c1, c2 = C[:, pair[0]], C[:, pair[1]]
    cvec = (c1 + 1j * c2) / np.sqrt(2.0)
    D = np.outer(cvec.conj(), cvec)                     # D_pq = <a^+_p a_q> for the one-electron state
    # a ring of points in the molecular plane (benzene lies in z = 0 here), 0.5 bohr above it
    R = 2.6
    th = np.linspace(0, 2 * np.pi, 24, endpoint=False)
    pts = np.stack([R * np.cos(th), R * np.sin(th), 0.5 * np.ones_like(th)], axis=1)
    ao = mol.eval_gto('GTOval_sph_deriv1', pts)         # (4, npts, nao): value, d/dx, d/dy, d/dz
    chi, grad = ao[0], ao[1:]
    psi = chi @ cvec
    gpsi = np.einsum('xpm,m->xp', grad, cvec)           # (3, npts)
    j_direct = np.imag(np.conj(psi)[None, :] * gpsi)    # Im(conj(psi) grad psi)
    ImD = np.imag(D)
    # candidate A (this ledger):  j = 1/2 sum_pq Im D_pq ( phi_p grad phi_q - phi_q grad phi_p )
    A = 0.5 * (np.einsum('pq,ip,xiq->xi', ImD, chi, grad) - np.einsum('pq,iq,xip->xi', ImD, chi, grad))
    rep = {'id': mid, 'pair': [int(pair[0]), int(pair[1])], 'eps': float(eps[pair[0]]),
           'max_abs_j': float(np.abs(j_direct).max()),
           'd_candidate_this_ledger': float(np.abs(A - j_direct).max()),
           'd_candidate_JUDGMENT_Observation_1': float(np.abs(-A - j_direct).max())}
    # circulation of the direct current around the ring, as a sense check
    tangent = np.stack([-np.sin(th), np.cos(th), np.zeros_like(th)], axis=1)
    rep['circulation_direct'] = float(np.sum(np.einsum('xi,ix->i', j_direct, tangent)) * (2 * np.pi * R / len(th)))
    return rep

if __name__ == '__main__':
    r = run(sys.argv[1] if len(sys.argv) > 1 else 'C6H6')
    print(json.dumps(r, indent=2))
    json.dump(r, open(os.path.join(HERE, 'out-current.json'), 'w'), indent=2)
