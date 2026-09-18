# check-gamma-fci.py — INDEPENDENT route A for TASK A.  The singlet-CIS states are embedded in the FULL determinant
# space of the same MO set and their spin-summed transition 1-RDMs are taken from PySCF's fci.direct_spin1.trans_rdm1.
# Nothing in this file uses the closed-form gamma blocks except at the comparison step (imported from gamma_closed.py).
#
# Psi_K = sum_ia X^K_ia * (1/sqrt2) E_ai Phi0,  E_ai = a^+_{a alpha} a_{i alpha} + a^+_{a beta} a_{i beta}
# built with PySCF's own creation/annihilation operators (fci.addons.cre_a/des_a), so every fermionic sign and the
# determinant ordering are PySCF's, not ours.
#
# PySCF convention (docstring of trans_rdm1): dm[p,q] = <bra| q^+ p |ket>, i.e. the TRANSPOSE of
# gamma_pq = <A| E_pq |B>.  That is asserted here from the block structure of gamma^{0K}, not assumed.
#
# Run: ~/miniforge3/envs/sci/bin/python check-gamma-fci.py [id ...]
import json, os, sys
import numpy as np
from pyscf import fci

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gamma_closed import gamma_00, gamma_0K, gamma_KL, dipole_matrix_closed

def load(mid):
    return json.load(open(os.path.join(HERE, 'data', '%s.json' % mid)))

def hf_vector(norb, nocc):
    """The RHF determinant as an FCI vector (orbitals 0..nocc-1 occupied in both spins)."""
    from pyscf.fci import cistring
    na = cistring.num_strings(norb, nocc)
    ci = np.zeros((na, na))
    addr = cistring.str2addr(norb, nocc, (1 << nocc) - 1)
    ci[addr, addr] = 1.0
    return ci

def E_ai(ci, norb, nelec, a, i):
    """(a^+_{a alpha} a_{i alpha} + a^+_{a beta} a_{i beta}) applied to ci, via PySCF's own operators."""
    na, nb = nelec
    out = fci.addons.cre_a(fci.addons.des_a(ci, norb, (na, nb), i), norb, (na - 1, nb), a)
    out = out + fci.addons.cre_b(fci.addons.des_b(ci, norb, (na, nb), i), norb, (na, nb - 1), a)
    return out

def cis_vectors(d, ks):
    """Embed the TDA eigenvectors listed in ks into the full determinant space."""
    norb, nocc, nvir = d['n'], d['nocc'], d['nvir']
    nelec = (nocc, nocc)
    ci0 = hf_vector(norb, nocc)
    # E_ai Phi0 for every pair, once
    base = {}
    for i in range(nocc):
        for a in range(nvir):
            base[(i, a)] = E_ai(ci0, norb, nelec, nocc + a, i)
    out = []
    for k in ks:
        X = np.array(d['XTDA'][k]).reshape(nocc, nvir)
        v = np.zeros_like(ci0)
        for i in range(nocc):
            for a in range(nvir):
                if X[i, a] != 0.0:
                    v += (X[i, a] / np.sqrt(2.0)) * base[(i, a)]
        out.append(v)
    return ci0, out

def run(mid, nstates=8, tol=1e-10):
    d = load(mid)
    norb, nocc, nvir = d['n'], d['nocc'], d['nvir']
    nelec = (nocc, nocc)
    ks = list(range(min(nstates, len(d['omegaTDA']))))
    ci0, psis = cis_vectors(d, ks)
    report = {'id': mid, 'norb': norb, 'nocc': nocc, 'states': ks,
              'determinants': int(ci0.size)}
    # normalisation and orthogonality of the embedded states (a check on the embedding itself)
    G = np.array([[float(np.dot(u.ravel(), v.ravel())) for v in psis] for u in psis])
    report['embedding_gram_error'] = float(np.abs(G - np.eye(len(ks))).max())
    report['embedding_overlap_with_ref'] = float(max(abs(np.dot(ci0.ravel(), v.ravel())) for v in psis))

    def trans(bra, ket):
        # PySCF: dm[p,q] = <bra| q^+ p |ket>  ->  gamma_pq = <bra| E_pq |ket> = dm[q,p]
        return np.asarray(fci.direct_spin1.trans_rdm1(bra, ket, norb, nelec)).T

    # --- convention calibration: gamma^{0K} must live in the occ-virt block, not the virt-occ block
    g0K_num = trans(ci0, psis[0])
    ov = np.abs(g0K_num[:nocc, nocc:]).max()
    vo = np.abs(g0K_num[nocc:, :nocc]).max()
    report['convention_check'] = {'occ_virt_norm': float(ov), 'virt_occ_norm': float(vo),
                                  'pyscf_dm_is_transpose_of_E_pq': bool(ov > vo)}

    errs = {'00': 0.0, '0K': 0.0, 'K0': 0.0, 'KL_oo': 0.0, 'KL_vv': 0.0, 'KL_ov': 0.0, 'KL_vo': 0.0,
            '0K_other': 0.0}
    g00 = trans(ci0, ci0)
    errs['00'] = float(np.abs(g00 - gamma_00(norb, nocc)).max())
    for kk, k in enumerate(ks):
        Xk = np.array(d['XTDA'][k]).reshape(nocc, nvir)
        gk = trans(ci0, psis[kk])
        cl = gamma_0K(Xk, norb, nocc)
        errs['0K'] = max(errs['0K'], float(np.abs(gk - cl).max()))
        errs['K0'] = max(errs['K0'], float(np.abs(trans(psis[kk], ci0) - cl.T).max()))
        for ll, l in enumerate(ks):
            Xl = np.array(d['XTDA'][l]).reshape(nocc, nvir)
            gnum = trans(psis[kk], psis[ll])
            gcl = gamma_KL(Xk, Xl, norb, nocc)
            errs['KL_oo'] = max(errs['KL_oo'], float(np.abs(gnum[:nocc, :nocc] - gcl[:nocc, :nocc]).max()))
            errs['KL_vv'] = max(errs['KL_vv'], float(np.abs(gnum[nocc:, nocc:] - gcl[nocc:, nocc:]).max()))
            errs['KL_ov'] = max(errs['KL_ov'], float(np.abs(gnum[:nocc, nocc:]).max()))
            errs['KL_vo'] = max(errs['KL_vo'], float(np.abs(gnum[nocc:, :nocc]).max()))
    report['gamma_max_abs_error'] = errs
    report['gamma_pass'] = bool(max(errs.values()) < tol)

    # --- the drive matrix R_q in the pair basis, against the same independent route
    rmo = {q: np.array(d['moDipole'][q]).reshape(norb, norb) for q in 'xyz'}
    dip_err = {}
    for q in 'xyz':
        r = rmo[q]
        nst = len(ks)
        Rnum = np.zeros((nst + 1, nst + 1))
        vecs = [ci0] + psis
        for u in range(nst + 1):
            for v in range(nst + 1):
                Rnum[u, v] = float(np.sum(trans(vecs[u], vecs[v]) * r))
        Xs = [np.array(d['XTDA'][k]).reshape(nocc, nvir) for k in ks]
        Rcl = dipole_matrix_closed(Xs, r, nocc, nvir)
        dip_err[q] = float(np.abs(Rnum - Rcl).max())
    report['drive_matrix_max_abs_error'] = dip_err

    # --- the pure-pair dipole formulas <0|R|ia> = sqrt2 r_ia and <ia|R|jb>, on the determinant basis of singles
    pair_err = {}
    for q in 'xyz':
        r = rmo[q]
        singles = []
        idx = []
        for i in range(nocc):
            for a in range(nvir):
                X = np.zeros((nocc, nvir)); X[i, a] = 1.0
                v = np.zeros_like(ci0)
                v += (1.0 / np.sqrt(2.0)) * E_ai(ci0, norb, (nocc, nocc), nocc + a, i)
                singles.append(v); idx.append((i, a))
        e0 = float(np.sum(trans(ci0, ci0) * r))
        emax = 0.0
        for u, (i, a) in enumerate(idx):
            num = float(np.sum(trans(ci0, singles[u]) * r))
            emax = max(emax, abs(num - np.sqrt(2.0) * r[i, nocc + a]))
            for v, (j, b) in enumerate(idx):
                num = float(np.sum(trans(singles[u], singles[v]) * r))
                cl = ((r[nocc + a, nocc + b] if i == j else 0.0)
                      - (r[j, i] if a == b else 0.0)
                      + (e0 if (i == j and a == b) else 0.0))
                emax = max(emax, abs(num - cl))
        pair_err[q] = emax
    report['pair_dipole_max_abs_error'] = pair_err

    # --- the index order, decided by a NON-SYMMETRIC one-electron operator.  For a symmetric r the two readings
    # -delta_ab r_ij and -delta_ab r_ji are indistinguishable; a random non-symmetric M separates them.
    rs = np.random.RandomState(20260918)
    M = rs.standard_normal((norb, norb))
    singles, idx = [], []
    for i in range(nocc):
        for a in range(nvir):
            singles.append(E_ai(ci0, norb, (nocc, nocc), nocc + a, i) / np.sqrt(2.0)); idx.append((i, a))
    e0 = float(np.sum(trans(ci0, ci0) * M))
    e_ij, e_ji, e_0K = 0.0, 0.0, 0.0
    for u, (i, a) in enumerate(idx):
        e_0K = max(e_0K, abs(float(np.sum(trans(ci0, singles[u]) * M)) - np.sqrt(2.0) * M[i, nocc + a]))
        for v, (j, b) in enumerate(idx):
            num = float(np.sum(trans(singles[u], singles[v]) * M))
            base = (M[nocc + a, nocc + b] if i == j else 0.0) + (e0 if (i == j and a == b) else 0.0)
            e_ij = max(e_ij, abs(num - (base - (M[i, j] if a == b else 0.0))))
            e_ji = max(e_ji, abs(num - (base - (M[j, i] if a == b else 0.0))))
    report['nonsymmetric_operator'] = {'0K_sqrt2_M_ia': e_0K, 'with_minus_delta_ab_M_ij': e_ij,
                                       'with_minus_delta_ab_M_ji': e_ji}

    # --- COMPLEX amplitudes.  Inside a degenerate cluster (X^1 +- i X^2)/sqrt2 is a legitimate CIS eigenvector with
    # complex X.  The claim under test is that the closed forms hold with every BRA factor conjugated:
    #   gamma^{0K}_ia = sqrt2 X^K_ia,  gamma^{K0} = (gamma^{0K})^dagger,
    #   gamma^{KL}_ij = 2 delta_ij <X^K,X^L> - sum_a conj(X^K_ja) X^L_ia,  gamma^{KL}_ab = sum_i conj(X^K_ia) X^L_ib.
    deg = [(a, b) for a in ks for b in ks if a < b and abs(d['omegaTDA'][a] - d['omegaTDA'][b]) < 1e-8]
    if deg:
        a, b = deg[0]
        Xa = np.array(d['XTDA'][a]).reshape(nocc, nvir)
        Xb = np.array(d['XTDA'][b]).reshape(nocc, nvir)
        Zs = [(Xa + 1j * Xb) / np.sqrt(2.0), (Xa - 1j * Xb) / np.sqrt(2.0)]
        cs = [(psis[ks.index(a)] + 1j * psis[ks.index(b)]) / np.sqrt(2.0),
              (psis[ks.index(a)] - 1j * psis[ks.index(b)]) / np.sqrt(2.0)]

        def ctrans(bra, ket):
            u1, v1 = bra.real, bra.imag
            u2, v2 = ket.real, ket.imag
            t = lambda p, q: np.asarray(fci.direct_spin1.trans_rdm1(p, q, norb, nelec)).T
            return (t(u1, u2) + t(v1, v2)) + 1j * (t(u1, v2) - t(v1, u2))

        def closed_c(ZK, ZL):
            g = np.zeros((norb, norb), dtype=complex)
            g[:nocc, :nocc] = 2.0 * np.vdot(ZK, ZL) * np.eye(nocc) - ZL @ ZK.conj().T
            g[nocc:, nocc:] = ZK.conj().T @ ZL
            return g
        ce = 0.0
        for u in range(2):
            ce = max(ce, float(np.abs(ctrans(ci0, cs[u])[:nocc, nocc:] - np.sqrt(2.0) * Zs[u]).max()))
            ce = max(ce, float(np.abs(ctrans(cs[u], ci0) - ctrans(ci0, cs[u]).conj().T).max()))
            for v in range(2):
                ce = max(ce, float(np.abs(ctrans(cs[u], cs[v]) - closed_c(Zs[u], Zs[v])).max()))
        report['complex_amplitude_max_abs_error'] = ce
        report['complex_pair'] = [a, b]
    return report

if __name__ == '__main__':
    ids = sys.argv[1:] or ['H2O', 'NH3', 'CH4']
    out = []
    for mid in ids:
        r = run(mid)
        out.append(r)
        print(json.dumps(r, indent=2))
    json.dump(out, open(os.path.join(HERE, 'out-gamma-fci.json'), 'w'), indent=2)
