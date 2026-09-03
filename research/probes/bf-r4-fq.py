# bf-r4-fq.py — Round 4 (Opus).  Q18 ANSWERED IN CLOSED FORM.
#
# Λ = u2∂3 − u3∂2 − u1∂4 + u4∂1 on F_q[u1..u4].  Over the quadratic extension F_q(i) put
#   a1 = u1 − i u4,  a2 = u2 + i u3   (Λ-eigenvalue +i)
#   b1 = u1 + i u4,  b2 = u2 − i u3   (Λ-eigenvalue −i)
# Λ is DIAGONAL on the monomials a1^p a2^s b1^r b2^t with eigenvalue i(p+s−r−t).
# Hence, for odd q, on degree-N forms
#     dim ker Λ = Σ_{m ≡ N·2^{-1} (mod q), 0≤m≤N}  (m+1)(N−m+1),
# and for N = 2n−2 (the KS/shell degree), writing m = (n−1) + jq,
#     dim ker Λ = Σ_{|j| ≤ J} (n² − j²q²) = (2J+1)n² − q² J(J+1)(2J+1)/3,   J = floor((n−1)/q).
# In particular dim = n² iff J = 0 iff q > n−1  — Fable's empirical law, PROVED, with the first failure at n = q+1.
import itertools, sys
import numpy as np

def monomials(N):
    return [e for e in itertools.product(range(N + 1), repeat=4) if sum(e) == N]
def lam_matrix(N):
    mons = monomials(N); idx = {m: i for i, m in enumerate(mons)}
    M = np.zeros((len(mons), len(mons)), dtype=np.int64)
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

def predict(N, q):
    """dim ker Λ on degree-N forms over F_q, q odd prime."""
    m0 = (N * pow(2, q - 2, q)) % q
    return sum((m + 1) * (N - m + 1) for m in range(N + 1) if m % q == m0)
def predict_shell(n, q):
    J = (n - 1) // q
    return (2 * J + 1) * n * n - q * q * J * (J + 1) * (2 * J + 1) // 3

primes = [3, 5, 7, 11, 13, 37]
print('=== A. even degrees N = 2n−2 (the shell): measured rank-deficit vs the closed form ===')
print('  n   N   dim   Q     ' + '  '.join(f'F_{q}(meas/pred/shell)' for q in primes))
for n in range(1, 10):
    N = 2 * n - 2; M = lam_matrix(N); dim = M.shape[0]
    rQ = int(np.linalg.matrix_rank(M.astype(float)))
    row = []
    for q in primes:
        meas = dim - rank_mod(M, q)
        row.append(f'{meas:4d}/{predict(N,q):4d}/{predict_shell(n,q):4d}')
    print(f' {n:2d}  {N:2d}  {dim:4d}  {dim-rQ:4d}   ' + '  '.join(row))
print('\n=== B. ALL degrees N (odd included): measured vs closed form ===')
bad = 0
for N in range(0, 15):
    M = lam_matrix(N); dim = M.shape[0]
    line = []
    for q in primes:
        meas = dim - rank_mod(M, q); pred = predict(N, q)
        line.append(f'{meas:4d}' + ('' if meas == pred else f'!={pred}'))
        if meas != pred: bad += 1
    print(f'  N={N:2d}  dim={dim:4d}   ' + '  '.join(line))
print(f'  mismatches over all (N<=14, q in {primes}): {bad}')
print('\n=== C. q = 2 (the even prime; the two eigenvalues ±i collide, Λ is NOT semisimple) ===')
for N in range(0, 13):
    M = lam_matrix(N); dim = M.shape[0]
    print(f'  N={N:2d}  dim={dim:4d}  ker over F_2 = {dim - rank_mod(M, 2):4d}   (C(N+3,3) = {dim})')
print('\n=== D. the law: dim = n² iff q > n−1; first failure at n = q+1 ===')
for q in primes:
    ns = [n for n in range(1, 12) if predict_shell(n, q) != n * n]
    print(f'  q={q:2d}: first n with dim != n² is {min(ns) if ns else None} (= q+1 = {q+1}); '
          f'values at n=q+1..q+3: {[predict_shell(n,q) for n in range(q+1, q+4)]} vs n² = {[n*n for n in range(q+1,q+4)]}')
