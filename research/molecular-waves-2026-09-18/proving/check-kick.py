# check-kick.py — TASK A(4): Proposition 2 of JUDGMENT.md, on H2O/STO-3G, against the FULL determinant space.
#
# The kick operator is the exact one-body e^{-i kappa Rhat_q}, Rhat_q = sum_pq r_pq E_pq, built as a 441x441 matrix
# on the determinant basis with PySCF's own fci.direct_spin1.contract_1e (r is symmetric, so contract_1e's
# pack_tril is exact here) and exponentiated with scipy.linalg.expm.  Nothing about the CIS space is assumed.
#
# Measured here:
#   (a) leakage: 1 - |P_reg chi|^2 with P_reg the projector on span{Phi0, Psi_K}   -- must be O(kappa^2)
#   (b) b_K + i kappa mu_Kq, mu_Kq = sqrt2 sum_ia X^K_ia r_ia                      -- must be O(kappa^2)
#   (c) the register density D(t) from the closed-form gamma blocks against the 1-RDM of the SAME superposition
#       evaluated in the determinant space (complex amplitudes)                     -- must be round-off
#   (d) the linear replay  rho_0 - 2 kappa sum_K mu_Kq sin(omega_K t) rho^tr_K      -- must match D(t) to O(kappa^2)
#
# Run: ~/miniforge3/envs/sci/bin/python check-kick.py [id]
import json, os, sys
import numpy as np
from scipy.linalg import expm
from pyscf import fci
from pyscf.fci import cistring

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gamma_closed import gamma_00, gamma_0K, gamma_KL

def hf_vector(norb, nocc):
    na = cistring.num_strings(norb, nocc)
    ci = np.zeros((na, na))
    addr = cistring.str2addr(norb, nocc, (1 << nocc) - 1)
    ci[addr, addr] = 1.0
    return ci

def E_ai(ci, norb, nelec, a, i):
    na, nb = nelec
    return (fci.addons.cre_a(fci.addons.des_a(ci, norb, (na, nb), i), norb, (na - 1, nb), a)
            + fci.addons.cre_b(fci.addons.des_b(ci, norb, (na, nb), i), norb, (na, nb - 1), a))

def run(mid='H2O', q='z', kappas=(1e-3, 5e-4), times=(0.0, 3.0, 11.0)):
    d = json.load(open(os.path.join(HERE, 'data', '%s.json' % mid)))
    norb, nocc, nvir, m = d['n'], d['nocc'], d['nvir'], d['pairSpace']
    nelec = (nocc, nocc)
    r = np.array(d['moDipole'][q]).reshape(norb, norb)
    ci0 = hf_vector(norb, nocc)
    ndet = ci0.size
    Xs = [np.array(x).reshape(nocc, nvir) for x in d['XTDA']]
    w = np.array(d['omegaTDA'])
    psis = []
    for X in Xs:
        v = np.zeros_like(ci0)
        for i in range(nocc):
            for a in range(nvir):
                if X[i, a] != 0.0:
                    v += (X[i, a] / np.sqrt(2.0)) * E_ai(ci0, norb, nelec, nocc + a, i)
        psis.append(v)
    basis = [ci0] + psis                                   # the register basis, M+1 vectors, real, orthonormal
    B = np.array([b.ravel() for b in basis])
    rep = {'id': mid, 'axis': q, 'determinants': int(ndet), 'register_states': int(len(basis)),
           'register_gram_error': float(np.abs(B @ B.T - np.eye(len(basis))).max())}

    # the full one-body operator Rhat_q on the determinant space
    Rfull = np.zeros((ndet, ndet))
    for k in range(ndet):
        e = np.zeros(ndet); e[k] = 1.0
        Rfull[:, k] = fci.direct_spin1.contract_1e(r, e.reshape(ci0.shape), norb, nelec).ravel()
    rep['Rfull_symmetry_error'] = float(np.abs(Rfull - Rfull.T).max())
    Rreg = B @ Rfull @ B.T                                 # the register drive matrix, from the FCI operator
    mu = np.array([np.sqrt(2.0) * float(np.sum(X * r[:nocc, nocc:])) for X in Xs])
    rep['d_R0K_vs_sqrt2_mu'] = float(np.abs(Rreg[0, 1:] - mu).max())

    # gamma tables from the CLAIMED closed forms, for the register density
    G = np.zeros((len(basis), len(basis), norb, norb))
    G[0, 0] = gamma_00(norb, nocc)
    for k in range(len(Xs)):
        G[0, k + 1] = gamma_0K(Xs[k], norb, nocc)
        G[k + 1, 0] = G[0, k + 1].T
        for l in range(len(Xs)):
            G[k + 1, l + 1] = gamma_KL(Xs[k], Xs[l], norb, nocc)
    E = np.concatenate(([0.0], w))

    def D_register(b, t):
        c = b * np.exp(-1j * E * t)
        return np.einsum('a,b,abpq->pq', c.conj(), c, G)

    def D_determinant(cvec):
        """the spin-summed 1-RDM of a COMPLEX determinant-space vector, from PySCF's trans_rdm1"""
        u, v = cvec.real.reshape(ci0.shape).copy(), cvec.imag.reshape(ci0.shape).copy()
        g = lambda a, b: np.asarray(fci.direct_spin1.trans_rdm1(a, b, norb, nelec)).T
        return (g(u, u) + g(v, v)) + 1j * (g(u, v) - g(v, u))

    out = []
    rho_tr = [np.sqrt(2.0) * (np.pad(X, ((0, nvir), (nocc, 0)))) for X in Xs]   # gamma^{0K} + gamma^{K0}, symmetric part
    for kappa in kappas:
        chi = expm(-1j * kappa * Rfull) @ np.eye(ndet)[:, int(np.argmax(np.abs(ci0.ravel())))]
        b = B.conj() @ chi
        leak = float(1.0 - np.vdot(b, b).real)
        rec = {'kappa': kappa, 'leakage_out_of_register': leak,
               'b0_minus_1': float(abs(b[0] - 1.0)),
               'max_bK_minus_first_order': float(np.abs(b[1:] - (-1j * kappa * mu)).max())}
        bn = b / np.linalg.norm(b)
        dens, lin = [], []
        for t in times:
            Dreg = D_register(bn, t)
            # the same superposition, evolved in the register, evaluated in the determinant space
            cvec = (B.T @ (bn * np.exp(-1j * E * t)))
            Ddet = D_determinant(cvec)
            dens.append(float(np.abs(Dreg - Ddet).max()))
            Dlin = gamma_00(norb, nocc) - 2 * kappa * sum(mu[k] * np.sin(w[k] * t) * (rho_tr[k] + rho_tr[k].T) / 2.0
                                                          for k in range(len(Xs)))
            lin.append(float(np.abs(Dreg.real - Dlin).max()))
        rec['d_register_vs_determinant_rdm'] = max(dens)
        rec['d_linear_replay_vs_register'] = max(lin)
        # origin shift r -> r - c: on the N-electron space Rhat -> Rhat - cN, a multiple of the identity.  With the
        # origin at the ground-state electronic centroid (c = R00/N) the kick leaves b0 = 1 + O(kappa^2).
        N = 2 * nocc
        Rshift = Rfull - (Rreg[0, 0] / N) * N * np.eye(ndet)      # r -> r - R00/N, i.e. Rhat -> Rhat - (R00/N)*Nhat
        chi2 = expm(-1j * kappa * Rshift) @ np.eye(ndet)[:, int(np.argmax(np.abs(ci0.ravel())))]
        b2 = B.conj() @ chi2
        rec['R00'] = float(Rreg[0, 0])
        rec['b0_minus_1_centroid_origin'] = float(abs(b2[0] - 1.0))
        rec['d_bK_between_origins'] = float(np.abs(np.abs(b2[1:]) - np.abs(b[1:])).max())
        out.append(rec)
    rep['kicks'] = out
    if len(out) == 2:
        s = out[0]['kappa'] / out[1]['kappa']
        rep['scaling'] = {'kappa_ratio': s,
                          'leakage_ratio': out[0]['leakage_out_of_register'] / out[1]['leakage_out_of_register'],
                          'bK_error_ratio': out[0]['max_bK_minus_first_order'] / out[1]['max_bK_minus_first_order'],
                          'linear_replay_error_ratio': out[0]['d_linear_replay_vs_register'] / out[1]['d_linear_replay_vs_register'],
                          'expected_if_second_order': s ** 2}
    return rep

if __name__ == '__main__':
    mid = sys.argv[1] if len(sys.argv) > 1 else 'H2O'
    rep = run(mid)
    print(json.dumps(rep, indent=2))
    json.dump(rep, open(os.path.join(HERE, 'out-kick.json'), 'w'), indent=2)
