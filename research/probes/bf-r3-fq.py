# bf-r3-fq.py — Q17: the hydrogen shell over F_q.  Kernel of the fibre derivation Λ = u2∂3 − u3∂2 − u1∂4 + u4∂1 on degree-N forms
#   in F_q[u1..u4], N = 2n − 2.  Over Q the kernel has dimension n² (the KS count).  Over F_q a derivation also kills every q-th power,
#   so extra invariants appear once N ≥ q.  Prediction (Fable): dim = n² for q > N = 2n − 2, and dim > n² as soon as q ≤ N.
import itertools, math
import numpy as np

def monomials(N):
    return [e for e in itertools.product(range(N + 1), repeat=4) if sum(e) == N]
def lam_matrix(N):
    mons = monomials(N); idx = {m: i for i, m in enumerate(mons)}
    M = np.zeros((len(mons), len(mons)), dtype=np.int64)
    # Λ = u2 ∂3 − u3 ∂2 − u1 ∂4 + u4 ∂1 : term (coef, multiply var a, differentiate var b)
    terms = [(1, 1, 2), (-1, 2, 1), (-1, 0, 3), (1, 3, 0)]
    for m in mons:
        for coef, a, b in terms:
            if m[b] == 0: continue
            e = list(m); e[b] -= 1; e[a] += 1
            M[idx[tuple(e)], idx[m]] += coef * m[b]
    return M
def rank_mod(M, q):
    A = (M % q).astype(np.int64); rows, cols = A.shape; r = 0
    for c in range(cols):
        piv = None
        for i in range(r, rows):
            if A[i, c] % q: piv = i; break
        if piv is None: continue
        A[[r, piv]] = A[[piv, r]]
        inv = pow(int(A[r, c]), q - 2, q)
        A[r] = (A[r] * inv) % q
        for i in range(rows):
            if i != r and A[i, c] % q: A[i] = (A[i] - A[i, c] * A[r]) % q
        r += 1
    return r
print(' n   N   dim   kernel over Q   ' + '   '.join(f'F_{q}' for q in [3, 5, 7, 11, 13, 37]))
for n in range(1, 7):
    N = 2 * n - 2; M = lam_matrix(N); dim = M.shape[0]
    rQ = np.linalg.matrix_rank(M.astype(float))
    row = []
    for q in [3, 5, 7, 11, 13, 37]:
        row.append(dim - rank_mod(M, q))
    print(f' {n}  {N:2d}  {dim:4d}   {dim - rQ:4d} (=n²={n * n})   ' + '   '.join(f'{k:3d}' for k in row))
print('reading: a column entry above n² is the failure; predicted at q ≤ N (q-th powers are Λ-constants).')
