"""bf-r10-su3.py — Round 10 (Fable), Q52: the Borel constant A_N of the single-plaquette weak-coupling series for SU(N).

Object.  Z_N(x) = ∫_{SU(N)} dU exp(x Re tr U),  x = β/N  (Wilson S = (β/N) Σ Re tr U_p),
         u_N(β) = ⟨(1/N) Re tr U⟩ = Z'/(N Z),  σ_0^{(N)}(β) = −log u_N(β) = Σ_k s_k β^{−k}  (the corpus's SU(2) case is −log(I_2/I_1)).
Method.  Weyl integration over the torus, Laplace expansion around U = 1 to order ε^M in ε = 1/x, the ε-coefficients evaluated
         pointwise as scalar power series at Gauss–Hermite nodes (exact for the polynomial integrands), mp.dps high enough
         to survive the alternating cancellation.  N = 2 validates against the exact s_k = 3/2, 3/4, 3/16, −9/16, −2331/1280, …
         Then the Borel constant by the Domb–Sykes/Richardson ratio test, in the β variable (Opus: 4/3 involution vs 3/2 centre).
Cross-check.  u_3(β) exactly from Z_SU(3) = Σ_q det[I_{q+i−j}(x)] (Bars), remainder of the optimally truncated series ~ e^{−A x·...}.
Run: ~/miniforge3/envs/sci/bin/python bf-r10-su3.py  [N M nodes]
"""
import sys, time
from mpmath import mp, mpf, matrix, besseli, log, exp, sqrt, pi, factorial, eigsy, hermite, quad, mpmathify
from fractions import Fraction

N = int(sys.argv[1]) if len(sys.argv) > 1 else 3
M = int(sys.argv[2]) if len(sys.argv) > 2 else 36
NODES = int(sys.argv[3]) if len(sys.argv) > 3 else 84
mp.dps = 70

# ── probabilists' Gauss–Hermite nodes/weights for ∫ f(s) e^{-s²/2} ds ──────────
def gauss_hermite_prob(n):
    # nodes: roots of He_n (He_{k+1} = s He_k − k He_{k−1}); Newton from asymptotic guesses; weights n!√(2π)/(n² He_{n−1}(s)²)
    import numpy as np
    from numpy.polynomial.hermite_e import hermegauss
    x0, _ = hermegauss(n)
    nodes, weights = [], []
    for xv in x0:
        s = mpf(xv)
        for _ in range(60):
            h0, h1 = mpf(1), s
            for k in range(1, n): h0, h1 = h1, s * h1 - k * h0
            # h1 = He_n(s), h0 = He_{n-1}(s);  He_n' = n He_{n-1}
            d = n * h0
            ds = h1 / d
            s -= ds
            if abs(ds) < mpf(10) ** (-(mp.dps - 5)): break
        h0, h1 = mpf(1), s
        for k in range(1, n): h0, h1 = h1, s * h1 - k * h0
        w = factorial(n) * sqrt(2 * pi) / (n * n * h0 * h0)
        nodes.append(s); weights.append(w)
    return nodes, weights

nodes, weights = gauss_hermite_prob(NODES)
chk0 = sum(weights); chk2 = sum(w * s * s for s, w in zip(nodes, weights))
print(f"GH check: sum w = {chk0}  (sqrt(2pi) = {sqrt(2*pi)});  sum w s^2 / sqrt(2pi) = {chk2/sqrt(2*pi)}")

# ── the quadratic form: t_1..t_{N-1}, t_N = −Σ t_i;  ½ tᵀQt = ½ Σ_i t_i²  ⇒ Q = I + J ─────────
n = N - 1
Q = matrix(n, n)
for i in range(n):
    for j in range(n): Q[i, j] = (1 if i == j else 0) + 1
E, V = eigsy(Q)             # Q = V diag(E) Vᵀ
L = matrix(n, n)            # t = L s, LᵀQL = I  ⇒ L = V diag(E^{-1/2})
for i in range(n):
    for j in range(n): L[i, j] = V[i, j] / sqrt(E[j])

# ── the ε-series at a point t: [ε^m] of exp(Σ_{k≥2} ε^{k−1} A_k(t)) · Π_{i<j} S(ε u_ij²/4),  S(z) = Σ (−1)^k 2^{2k+1} z^k/(2k+2)! ─
Scoef = [mpf((-1) ** k) * mpf(2) ** (2 * k + 1) / factorial(2 * k + 2) for k in range(M + 1)]
inv_fact = [1 / factorial(2 * m + 2) for m in range(M + 2)]
def series_at(t):
    # G_m = (−1)^{m+1} Σ_i t_i^{2m+2}/(2m+2)!,  m = 1..M
    G = [mpf(0)] * (M + 1)
    pw = [ti * ti for ti in t]           # t_i^2
    cur = [p for p in pw]                # t_i^{2m}
    for m in range(1, M + 1):
        cur = [c * p for c, p in zip(cur, pw)]   # t_i^{2m+2}
        G[m] = (-1) ** (m + 1) * sum(cur) * inv_fact[m]
    F = [mpf(0)] * (M + 1); F[0] = mpf(1)
    for m in range(1, M + 1):
        acc = mpf(0)
        for j in range(1, m + 1): acc += j * G[j] * F[m - j]
        F[m] = acc / m
    # pair factors
    for i in range(N):
        for j in range(i + 1, N):
            z = (t[i] - t[j]) ** 2 / 4
            zp = [mpf(1)]
            for k in range(1, M + 1): zp.append(zp[-1] * z)
            Sser = [Scoef[k] * zp[k] for k in range(M + 1)]
            F = [sum(F[a] * Sser[m - a] for a in range(m + 1)) for m in range(M + 1)]
    return F

t0 = time.time()
z = [mpf(0)] * (M + 1)
import itertools
for idx in itertools.product(range(NODES), repeat=n):
    s = [nodes[i] for i in idx]; w = mpf(1)
    for i in idx: w *= weights[i]
    t = [sum(L[i, j] * s[j] for j in range(n)) for i in range(n)]
    t.append(-sum(t))
    vdm = mpf(1)
    for i in range(N):
        for j in range(i + 1, N): vdm *= (t[i] - t[j]) ** 2
    F = series_at(t)
    wv = w * vdm
    for m in range(M + 1): z[m] += wv * F[m]
print(f"Laplace coefficients done in {time.time()-t0:.1f}s; z_0 = {z[0]}")
zn = [zi / z[0] for zi in z]                     # W(ε) = Σ zn_m ε^m, zn_0 = 1
print("W(eps) coefficients (first 8):", [mp.nstr(v, 15) for v in zn[:8]])

# ── u_N = 1 − (N²−1)ε/(2N) − ε² W'(ε)/(N W(ε)) as a series in ε; then σ_0 = −log u_N; then β = N x ⇒ s_k = [ε^k] N^k ─
def ser_mul(a, b):
    return [sum(a[i] * b[m - i] for i in range(m + 1)) for m in range(M + 1)]
def ser_inv(a):
    b = [mpf(0)] * (M + 1); b[0] = 1 / a[0]
    for m in range(1, M + 1): b[m] = -sum(a[i] * b[m - i] for i in range(1, m + 1)) / a[0]
    return b
def ser_log(a):          # log of a series with a_0 = 1:  (log a)' = a'/a
    ap = [(m + 1) * a[m + 1] for m in range(M)] + [mpf(0)]
    q = ser_mul(ap, ser_inv(a))
    return [mpf(0)] + [q[m - 1] / m for m in range(1, M + 1)]
Wp = [(m + 1) * zn[m + 1] for m in range(M)] + [mpf(0)]
corr = ser_mul(Wp, ser_inv(zn))                  # W'/W
u = [mpf(0)] * (M + 1); u[0] = mpf(1); u[1] = -mpf(N * N - 1) / (2 * N)
for m in range(2, M + 1): u[m] += -corr[m - 2] / N
sig = [-c for c in ser_log(u)]                   # σ_0 as a series in ε = 1/x
s_beta = [sig[k] * mpf(N) ** k for k in range(M + 1)]   # in 1/β
print(f"\nσ_0^{{({N})}}(β) = Σ s_k β^{{-k}}:")
for k in range(1, min(M, 12) + 1):
    fr = Fraction(str(mp.nstr(s_beta[k], 30))).limit_denominator(10 ** 9)
    print(f"  s_{k} = {mp.nstr(s_beta[k], 20)}   ≈ {fr}")
print("  ... higher:")
for k in range(13, M + 1): print(f"  s_{k} = {mp.nstr(s_beta[k], 20)}")

# ── Borel constant: s_k ~ S Γ(k+b)/A^k ⇒ ρ_k = s_{k+1}/(k s_k) → 1/A;  Richardson (k+1)ρ_{k+1} − kρ_k → 1/A ─
print("\nratio test in the β variable (A = the Borel singularity of σ_0 in the 1/β Borel plane):")
rho = {}
for k in range(2, M): rho[k] = s_beta[k + 1] / (k * s_beta[k])
for k in range(4, M - 2):
    r1 = (k + 1) * rho[k + 1] - k * rho[k]
    r2 = ((k + 2) ** 2 * rho[k + 2] - 2 * (k + 1) ** 2 * rho[k + 1] + k ** 2 * rho[k]) / 2   # second-order Richardson
    print(f"  k={k:2d}: ρ_k = {mp.nstr(rho[k], 10)}  1/A(R1) = {mp.nstr(r1, 10)}  A(R1) = {mp.nstr(1/r1, 10)}   A(R2) = {mp.nstr(1/r2, 10)}   sign s_k {'+' if s_beta[k] > 0 else '-'}")
print(f"  candidates: 4/3 = {mp.nstr(mpf(4)/3, 10)}, 3/2 = 1.5, 2 (SU(2) centre)")

# ── cross-check: exact u_N(β) from the Bessel determinant sum vs the optimally truncated series ───────────────
if N in (2, 3):
    print("\nexact u_N(β) from Z = Σ_q det[I_{q+i−j}(x)] and the remainder of the truncated series:")
    def Z_and_dZ(x):
        Qmax = int(x) + 80
        cache = {}
        def I(nu):
            nu = abs(nu)
            if nu not in cache: cache[nu] = besseli(nu, x)
            return cache[nu]
        def dI(nu):   # I_nu' = (I_{nu-1} + I_{nu+1})/2
            return (I(nu - 1) + I(nu + 1)) / 2
        Z = mpf(0); dZ = mpf(0)
        for q in range(-Qmax, Qmax + 1):
            A = matrix(N, N); dA = matrix(N, N)
            for i in range(N):
                for j in range(N): A[i, j] = I(q + i - j); dA[i, j] = dI(q + i - j)
            from mpmath import det
            Z += det(A)
            for c in range(N):        # derivative of a determinant: sum over columns
                Ac = A.copy()
                for i in range(N): Ac[i, c] = dA[i, c]
                dZ += det(Ac)
        return Z, dZ
    for x in [mpf(6), mpf(9), mpf(12), mpf(15), mpf(18)]:
        Z, dZ = Z_and_dZ(x)
        uex = dZ / (N * Z)
        beta = N * x
        # optimal truncation: stop before the smallest term
        terms = [s_beta[k] / beta ** k for k in range(1, M + 1)]
        kopt = 1 + min(range(len(terms)), key=lambda i: abs(terms[i]))
        part = sum(terms[:kopt])
        R = -log(uex) - part
        print(f"  β = {mp.nstr(beta,4)} (x={mp.nstr(x,4)}): σ_0 exact = {mp.nstr(-log(uex), 25)};  k_opt = {kopt};  remainder = {mp.nstr(R, 6)};  −log|R|/x = {mp.nstr(-log(abs(R))/x, 8)}   [candidates 4 (involution, 4β/3) / 4.5 (centre, 3β/2) for SU(3); 4 (=2β) for SU(2)]")
    if N == 2:
        print("  SU(2) sanity: u_2 = I_2(β)/I_1(β):", mp.nstr(besseli(2, 12) / besseli(1, 12), 20), " vs Bessel-det sum at β=12:", mp.nstr(Z_and_dZ(mpf(6))[1] / (2 * Z_and_dZ(mpf(6))[0]), 20))
