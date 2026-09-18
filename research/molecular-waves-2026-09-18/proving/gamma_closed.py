# gamma_closed.py — the CLAIMED closed forms of JUDGMENT.md section 3, transcribed once, in the convention
# gamma_pq = <A| E_pq |B>, E_pq = sum_sigma a^+_{p sigma} a_{q sigma}; i,j occupied, a,b virtual; X real, <X^K,X^K> = 1.
# Nothing here is derived; it is the statement under test.
import numpy as np

def gamma_00(norb, nocc):
    g = np.zeros((norb, norb))
    g[:nocc, :nocc] = 2.0 * np.eye(nocc)
    return g

def gamma_0K(XK, norb, nocc):
    """gamma^{0K}_ia = sqrt2 X^K_ia, gamma^{0K}_ai = 0, all other blocks zero."""
    g = np.zeros((norb, norb))
    g[:nocc, nocc:] = np.sqrt(2.0) * XK
    return g

def gamma_KL(XK, XL, norb, nocc):
    """gamma^{KL}_ij = 2 delta_ij <X^K,X^L> - sum_a X^K_ja X^L_ia ;  gamma^{KL}_ab = sum_i X^K_ia X^L_ib."""
    nocc_, nvir = XK.shape
    g = np.zeros((norb, norb))
    ov = float(np.sum(XK * XL))
    g[:nocc, :nocc] = 2.0 * ov * np.eye(nocc) - XL @ XK.T          # (XL XK^T)_ij = sum_a X^L_ia X^K_ja
    g[nocc:, nocc:] = XK.T @ XL                                    # (XK^T XL)_ab = sum_i X^K_ia X^L_ib
    return g

def dipole_matrix_closed(Xs, r, nocc, nvir):
    """(R_q)_AB = sum_pq gamma^{AB}_pq r_pq over the basis [Phi0, Psi_1 ... Psi_n]."""
    norb = nocc + nvir
    n = len(Xs)
    R = np.zeros((n + 1, n + 1))
    R[0, 0] = float(np.sum(gamma_00(norb, nocc) * r))
    for k in range(n):
        v = float(np.sum(gamma_0K(Xs[k], norb, nocc) * r))
        R[0, k + 1] = v
        R[k + 1, 0] = v
        for l in range(n):
            R[k + 1, l + 1] = float(np.sum(gamma_KL(Xs[k], Xs[l], norb, nocc) * r))
    return R
