# check-gamma-bitstring.py — INDEPENDENT route B for TASK A.  No PySCF.  An explicit occupation-number
# (bitstring) second-quantisation evaluator over the full determinant space of the same MO set.
#
# Spin-orbital ordering: bit s = p for (p, alpha), bit s = norb + p for (p, beta).  A determinant is the ordered
# product of creation operators in INCREASING bit index acting on the vacuum, so
#     a^+_s |occ>  = 0 if bit s set, else (-1)^{popcount(occ & ((1<<s)-1))} |occ + 2^s>
#     a_s   |occ>  = 0 if bit s clear, else (-1)^{popcount(occ & ((1<<s)-1))} |occ - 2^s>
# and E_pq = sum_sigma a^+_{p sigma} a_{q sigma}.  Every sign below comes from that rule alone.
#
# Run: ~/miniforge3/envs/sci/bin/python check-gamma-bitstring.py [id ...]
import json, os, sys
from itertools import combinations
import numpy as np
from scipy.sparse import coo_matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gamma_closed import gamma_00, gamma_0K, gamma_KL

def popcount(x):
    return bin(x).count('1')

def build_basis(norb, nocc):
    strs = [sum(1 << p for p in c) for c in combinations(range(norb), nocc)]
    dets = []
    for sa in strs:
        for sb in strs:
            dets.append(sa | (sb << norb))
    return dets, {d: k for k, d in enumerate(dets)}

def apply_E(p, q, norb, dets, index):
    """Sparse matrix of E_pq in the determinant basis: M[k', k] = <k'| E_pq |k>."""
    rows, cols, vals = [], [], []
    for k, occ in enumerate(dets):
        for sigma in (0, 1):
            sp, sq = p + sigma * norb, q + sigma * norb
            if not (occ >> sq) & 1:
                continue
            sgn = -1 if popcount(occ & ((1 << sq) - 1)) & 1 else 1
            o1 = occ & ~(1 << sq)
            if (o1 >> sp) & 1:
                continue
            sgn *= -1 if popcount(o1 & ((1 << sp) - 1)) & 1 else 1
            o2 = o1 | (1 << sp)
            rows.append(index[o2]); cols.append(k); vals.append(float(sgn))
    n = len(dets)
    return coo_matrix((vals, (rows, cols)), shape=(n, n)).tocsr()

def run(mid, nstates=5, tol=1e-10):
    d = json.load(open(os.path.join(HERE, 'data', '%s.json' % mid)))
    norb, nocc, nvir = d['n'], d['nocc'], d['nvir']
    dets, index = build_basis(norb, nocc)
    ndet = len(dets)
    E = {(p, q): apply_E(p, q, norb, dets, index) for p in range(norb) for q in range(norb)}
    hf = index[((1 << nocc) - 1) | (((1 << nocc) - 1) << norb)]
    ci0 = np.zeros(ndet); ci0[hf] = 1.0
    ks = list(range(min(nstates, len(d['omegaTDA']))))
    psis = []
    for k in ks:
        X = np.array(d['XTDA'][k]).reshape(nocc, nvir)
        v = np.zeros(ndet)
        for i in range(nocc):
            for a in range(nvir):
                if X[i, a] != 0.0:
                    v += (X[i, a] / np.sqrt(2.0)) * (E[(nocc + a, i)] @ ci0)
        psis.append(v)
    gram = np.array([[float(u @ v) for v in psis] for u in psis])
    g = lambda A, B: np.array([[float(A @ (E[(p, q)] @ B)) for q in range(norb)] for p in range(norb)])
    errs = {'00': float(np.abs(g(ci0, ci0) - gamma_00(norb, nocc)).max()), '0K': 0.0, 'K0': 0.0,
            'KL_oo': 0.0, 'KL_vv': 0.0, 'KL_ov': 0.0, 'KL_vo': 0.0}
    for kk, k in enumerate(ks):
        Xk = np.array(d['XTDA'][k]).reshape(nocc, nvir)
        cl = gamma_0K(Xk, norb, nocc)
        errs['0K'] = max(errs['0K'], float(np.abs(g(ci0, psis[kk]) - cl).max()))
        errs['K0'] = max(errs['K0'], float(np.abs(g(psis[kk], ci0) - cl.T).max()))
        for ll, l in enumerate(ks):
            Xl = np.array(d['XTDA'][l]).reshape(nocc, nvir)
            gn = g(psis[kk], psis[ll]); gc = gamma_KL(Xk, Xl, norb, nocc)
            errs['KL_oo'] = max(errs['KL_oo'], float(np.abs(gn[:nocc, :nocc] - gc[:nocc, :nocc]).max()))
            errs['KL_vv'] = max(errs['KL_vv'], float(np.abs(gn[nocc:, nocc:] - gc[nocc:, nocc:]).max()))
            errs['KL_ov'] = max(errs['KL_ov'], float(np.abs(gn[:nocc, nocc:]).max()))
            errs['KL_vo'] = max(errs['KL_vo'], float(np.abs(gn[nocc:, :nocc]).max()))
    rep = {'id': mid, 'determinants': ndet, 'states': ks,
           'embedding_gram_error': float(np.abs(gram - np.eye(len(ks))).max()),
           'gamma_max_abs_error': errs, 'gamma_pass': bool(max(errs.values()) < tol)}
    # the pure-pair dipole formulas, same evaluator
    pair = {}
    for q in 'xyz':
        r = np.array(d['moDipole'][q]).reshape(norb, norb)
        singles, idx = [], []
        for i in range(nocc):
            for a in range(nvir):
                singles.append((E[(nocc + a, i)] @ ci0) / np.sqrt(2.0)); idx.append((i, a))
        e0 = float(np.sum(g(ci0, ci0) * r))
        emax = 0.0
        for u, (i, a) in enumerate(idx):
            emax = max(emax, abs(float(np.sum(g(ci0, singles[u]) * r)) - np.sqrt(2.0) * r[i, nocc + a]))
            for v, (j, b) in enumerate(idx):
                num = float(np.sum(g(singles[u], singles[v]) * r))
                cl = ((r[nocc + a, nocc + b] if i == j else 0.0) - (r[j, i] if a == b else 0.0)
                      + (e0 if (i == j and a == b) else 0.0))
                emax = max(emax, abs(num - cl))
        pair[q] = emax
    rep['pair_dipole_max_abs_error'] = pair
    return rep

if __name__ == '__main__':
    ids = sys.argv[1:] or ['H2O', 'NH3']
    out = [run(m) for m in ids]
    for r in out:
        print(json.dumps(r))
    json.dump(out, open(os.path.join(HERE, 'out-gamma-bitstring.json'), 'w'), indent=2)
