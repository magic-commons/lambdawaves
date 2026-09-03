#!/usr/bin/env python
"""bf-r6-f2gates.py — Q33 (the F_2 Jordan structure of Lambda, in closed form) and
Q35 (the n = 3 gate count for <SU(2)xSU(2), e^{i alpha L^2}>)."""
import numpy as np, itertools
from math import comb, sqrt

# ─────────────────────────── Q33 ───────────────────────────
print("=== Q33 · Lambda over F_2 on degree-N forms in u1..u4: exact Jordan structure ===")
print("  Lambda = u2 d3 + u3 d2 + u1 d4 + u4 d1 ;  Lambda^2 = E ;  D := Lambda - E = a dx + b dy")
print("  ker D on degree N = F2[a,b,x^2,y^2] + (bx+ay) F2[a,b,x^2,y^2]  (Fable, Theorem F2)")
print("  Q(N) := #{ a^i b^j x^{2k} y^{2l} of degree N } = sum_{m<=N/2} (N-2m+1)(m+1)")
def Q(N):
    return 0 if N < 0 else sum((N - 2*m + 1) * (m + 1) for m in range(0, N // 2 + 1))
def kerD(N): return Q(N) + Q(N - 2)

# brute force over F_2 to certify
def basis(N):
    return [(i, j, k, l) for i in range(N+1) for j in range(N+1-i) for k in range(N+1-i-j)
            for l in [N-i-j-k] if l >= 0]
def lam_matrix(N):
    B = basis(N); idx = {m: t for t, m in enumerate(B)}; A = np.zeros((len(B), len(B)), dtype=np.int8)
    # Lambda(u1^i u2^j u3^k u4^l) = i u4 u1^{i-1}... : d1 -> multiply by u4, d2 -> u3, d3 -> u2, d4 -> u1
    for m in B:
        i, j, k, l = m
        for (var, dec, inc) in ((0, i, 3), (1, j, 2), (2, k, 1), (3, l, 0)):
            if dec % 2 == 0: continue                       # coefficient = exponent mod 2
            t = list(m); t[var] -= 1; t[inc] += 1
            A[idx[tuple(t)], idx[m]] ^= 1
    return A, B
def rank2(A):
    M = A.copy() % 2; r = 0; rows, cols = M.shape
    for c in range(cols):
        p = None
        for rr in range(r, rows):
            if M[rr, c]: p = rr; break
        if p is None: continue
        M[[r, p]] = M[[p, r]]
        for rr in range(rows):
            if rr != r and M[rr, c]: M[rr] ^= M[r]
        r += 1
        if r == rows: break
    return r
print(f"\n{'N':>4}{'dim':>7}{'ker Lambda':>12}{'pred':>9}{'ker(L+1)':>11}{'pred':>9}{'#J1':>6}{'pred':>6}{'#J2':>7}{'pred':>7}")
for N in range(0, 13):
    A, B = lam_matrix(N); d = len(B)
    kL = d - rank2(A)
    kL1 = d - rank2((A + np.eye(d, dtype=np.int8)) % 2)
    if N % 2 == 0:
        n = N // 2 + 1
        predK = n * (2*n*n + 1) // 3; predK1 = 0
        j1 = 2*kL - d; j2 = d - kL
        pj1, pj2 = n, 2*n*(n*n - 1)//3
        print(f"{N:4}{d:7}{kL:12}{predK:9}{kL1:11}{'0':>9}{j1:6}{pj1:6}{j2:7}{pj2:7}")
    else:
        predK1 = (N+1)*(N+2)*(N+3)//12
        j1 = 2*kL1 - d; j2 = d - kL1
        print(f"{N:4}{d:7}{kL:12}{'0':>9}{kL1:11}{predK1:9}{j1:6}{'0':>6}{j2:7}{predK1:7}")
print("""
  CLOSED FORM (Q33 part 1):
    even degree N = 2n-2 :  ker Lambda = n(2n^2+1)/3 (octahedral) ; Jordan = n blocks J_1 + 2n(n^2-1)/3 blocks J_2
    odd  degree N        :  ker Lambda = 0 ; ker(Lambda+1) = (N+1)(N+2)(N+3)/12 = (1/2) C(N+3,3)
                            => Lambda is a FREE involution: every block is J_2, C(N+3,3)/2 of them.
  (Fable's clause (4) "2n(2n^2+1)/3 - C(N+3,3) of size 1" simplifies to exactly n.)""")
print("  Q33 part 2: O_n = n(2n^2+1)/3 is the Hilbert function of the WEIGHTED projective space")
print("    P(1,1,2,2) in degrees 2n-2 and 2n-4 summed: ker Lambda = H^0(O) + H^0(O(-3)) there.")
print("    Coincidences worth naming: O_2 = 6 = |GQ(1,2)|, O_5 = 85 = |GQ(4,4)| = (s+1)(st+1) with s=4,t=4;")
print("    in general O_n = (s+1)(st+1) with s = n-1, t = 2(n+1)/3 -- integral iff n = 2 (mod 3).")
for n in range(2, 12):
    if (n + 1) % 3 == 0:
        s, t = n - 1, 2*(n+1)//3
        print(f"      n={n:2}  O_n={n*(2*n*n+1)//3:5}  = (s+1)(st+1) with (s,t)=({s},{t})  "
              f"[GQ exists? s<=t^2 and t<=s^2: {s <= t*t and t <= s*s}]")

# ─────────────────────────── Q35 ───────────────────────────
print("\n=== Q35 · the n = 3 gate count for <SU(2)xSU(2), e^{i alpha L^2}> from |3s> ===")
n = 3; jspin = 1.0
def spin_ops(j):
    d = int(round(2*j+1)); ms = [j - p for p in range(d)]
    jp = np.zeros((d, d), complex)
    for p in range(1, d):
        m = ms[p]; jp[p-1, p] = sqrt(j*(j+1) - m*(m+1))
    jz = np.diag(ms).astype(complex)
    jx = (jp + jp.conj().T)/2
    jy = (jp - jp.conj().T)/(2*1j)
    return jx, jy, jz
jx, jy, jz = spin_ops(jspin); d = 3
Id = np.eye(d)
Jp = [np.kron(A, Id) for A in (jx, jy, jz)]
Jm = [np.kron(Id, A) for A in (jx, jy, jz)]
L = [Jp[k] + Jm[k] for k in range(3)]
L2 = sum(Lk @ Lk for Lk in L)
# |3s> = the singlet in V_1 x V_1 (the l = 0 state)
w, V = np.linalg.eigh(L2)
sing = V[:, np.argmin(w)]
print(f"  L^2 eigenvalues on the n=3 shell: {sorted(np.round(w.real,9))}  (0, 2, 2, 2, 6x5) -> l = 0,1,2")
print(f"  |3s> is the L^2 = 0 eigenvector; e^{{i a L^2}}|3s> = |3s>, so a WAIT cannot start the sequence.")

def expm_h(H, t):
    w, V = np.linalg.eigh(H); return (V * np.exp(-1j*t*w)) @ V.conj().T
def state(params, K):
    """K layers: R_K W_{K-1} ... W_1 R_1 |3s>, R = exp(-i sum th_a Jp_a) exp(-i sum ph_a Jm_a)."""
    v = sing.astype(complex); p = 0
    for k in range(K):
        th = params[p:p+3]; ph = params[p+3:p+6]; p += 6
        Hp = sum(th[a]*Jp[a] for a in range(3)); Hm = sum(ph[a]*Jm[a] for a in range(3))
        v = expm_h(Hp, 1.0) @ (expm_h(Hm, 1.0) @ v)
        if k < K - 1:
            al = params[p]; p += 1
            v = (np.exp(1j*al*np.diag(np.diag(np.zeros((9,9))))) if False else expm_h(-L2, al)) @ v
    return v
def npar(K): return 6*K + (K - 1)
rng = np.random.default_rng(20260903)
print(f"\n{'layers K':>9}{'#params':>9}{'param count 7K-5':>18}{'Jacobian rank (real)':>22}{'dim CP^8 = 16':>16}")
for K in (1, 2, 3, 4):
    P = npar(K); x0 = rng.normal(size=P) * 0.9
    v0 = state(x0, K)
    Jm_ = np.zeros((18, P))
    h = 1e-6
    for a in range(P):
        xp = x0.copy(); xp[a] += h; xm = x0.copy(); xm[a] -= h
        dv = (state(xp, K) - state(xm, K)) / (2*h)
        Jm_[:9, a] = dv.real; Jm_[9:, a] = dv.imag
    # project out the global phase direction i*v0 and the norm direction v0
    G = np.zeros((18, 2)); G[:9, 0] = v0.real; G[9:, 0] = v0.imag
    G[:9, 1] = (1j*v0).real; G[9:, 1] = (1j*v0).imag
    Qg, _ = np.linalg.qr(G)
    Jproj = Jm_ - Qg @ (Qg.T @ Jm_)
    r = np.linalg.matrix_rank(Jproj, tol=1e-7)
    print(f"{K:9}{P:9}{7*K-5:18}{r:22}{16:16}")
print("""
  => 7K - 5 >= 16 gives K >= 3, and at K = 3 the count is EXACTLY tight (21 params, 16 after phase+norm).
     The Jacobian rank decides whether tightness is achieved.""")

print("\n=== Q35 continued: does the rank saturate?  (measured pattern 4K-1) ===")
for K in (5, 6, 7):
    P = npar(K)
    best = 0
    for trial in range(3):
        x0 = rng.normal(size=P) * 1.1
        v0 = state(x0, K)
        Jm_ = np.zeros((18, P)); h = 1e-6
        for a in range(P):
            xp = x0.copy(); xp[a] += h; xm = x0.copy(); xm[a] -= h
            dv = (state(xp, K) - state(xm, K)) / (2*h)
            Jm_[:9, a] = dv.real; Jm_[9:, a] = dv.imag
        G = np.zeros((18, 2)); G[:9,0]=v0.real; G[9:,0]=v0.imag; G[:9,1]=(1j*v0).real; G[9:,1]=(1j*v0).imag
        Qg,_ = np.linalg.qr(G)
        best = max(best, np.linalg.matrix_rank(Jm_ - Qg @ (Qg.T @ Jm_), tol=1e-7))
    print(f"  K = {K}: params {P}, naive 7K-5 = {7*K-5}, measured rank = {best}, 4K-1 = {4*K-1}, target 16")
print("""
  REASON the naive count fails: e^{i alpha L^2} commutes with the DIAGONAL SU(2) (L^2 is a diagonal
  Casimir), so in R_K W_{K-1} ... W_1 R_1 every intermediate rotation may be written S_k D_k with
  D_k diagonal, and D_k slides right through all the waits to be absorbed by the previous rotation.
  Only the coset (SU(2)xSU(2))/SU(2)_diag -- 3 parameters -- is new per layer, not 6.
  Effective count: 6 + 4(K-1) params, minus 3 (stabiliser of |3s>) and 1 (phase) => rank <= 4K - 1.""")
