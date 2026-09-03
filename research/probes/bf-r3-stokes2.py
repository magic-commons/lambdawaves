# bf-r3-stokes2.py — Q19: the exact asymptotic series of the revival maximiser α*(β), 24+ terms, in exact rationals (Fractions).
#   Same derivation as bf-r3-stokes.py, but power series are truncated Fraction lists instead of sympy expressions.
#   u_k/u_{k-1} = (6k-1)(6k-3)(6k-5)/(216 k (2k-1)),  v_k = -(6k+1)/(6k-1) u_k  (Abramowitz–Stegun 10.4.59–60).
import sys
from fractions import Fraction as F
N = int(sys.argv[1]) if len(sys.argv) > 1 else 30            # order in w = λ^{-3} = 72 β²
def mul(a, b):
    c = [F(0)] * (N + 1)
    for i, x in enumerate(a):
        if x == 0: continue
        for j, y in enumerate(b):
            if i + j > N: break
            c[i + j] += x * y
    return c
def inv(a):                       # 1/a, a[0] != 0
    b = [F(0)] * (N + 1); b[0] = 1 / a[0]
    for n in range(1, N + 1):
        b[n] = -sum(a[k] * b[n - k] for k in range(1, n + 1)) / a[0]
    return b
def compose(g, z):                # g(z(w)), z[0] == 0
    out = [F(0)] * (N + 1); p = [F(0)] * (N + 1); p[0] = F(1)
    for k in range(N + 1):
        if k: p = mul(p, z)
        if all(x == 0 for x in p): break
        for i in range(N + 1): out[i] += g[k] * p[i]
    return out
# Airy coefficients
u = [F(1)]
for k in range(1, N + 1):
    u.append(u[-1] * F((6 * k - 1) * (6 * k - 3) * (6 * k - 5), 216 * k * (2 * k - 1)))
v = [F(1)] + [-F(6 * k + 1, 6 * k - 1) * u[k] for k in range(1, N + 1)]
U = [(-1) ** k * u[k] for k in range(N + 1)]
V = [(-1) ** k * v[k] for k in range(N + 1)]
ratio = mul(V, inv(U))                                    # V/U in x = ζ^{-1}
G = [ratio[k] * F(3, 2) ** k for k in range(N + 1)]       # x = (3/2) y, y = s^{-3}
# solve h = 1/G(w h^{-3}) order by order: h_new = 1/G(w · h^{-3})
h = [F(0)] * (N + 1); h[0] = F(1)
for it in range(N + 2):
    h3 = inv(mul(mul(h, h), h))
    z = [F(0)] + h3[:N]                                    # w · h^{-3}
    h = inv(compose(G, z))
h2 = mul(h, h)
C = [h2[k] * F(72) ** k / 12 for k in range(1, N + 1)]    # α*(β) = Σ_k C_k β^{2k-1}
print('α*(β) = Σ_{k≥1} C_k β^{2k-1}, exact:')
for k, c in enumerate(C, 1):
    print(f'  C_{k:2d} = {c}')
import mpmath as mp
mp.mp.dps = 40
print('large-order fit: C_k ≈ S (-54)^k Γ(k + a).  From consecutive ratios r_k = C_{k+1}/C_k = -54 (k + a) (1 + O(1/k)):')
print('   k     r_k/(-54) - k      (Richardson on the drift → a)')
seq = []
for k in range(1, len(C)):
    r = mp.mpf(C[k].numerator) / mp.mpf(C[k].denominator) / (mp.mpf(C[k - 1].numerator) / mp.mpf(C[k - 1].denominator))
    seq.append(r / (-54) - k)
for k, a in enumerate(seq, 1):
    print(f'  {k:2d}   {mp.nstr(a, 12)}')
# Richardson: a_k = a + c/k + d/k² ...; R1_k = (k+1) a_{k+1} - k a_k; R2 = ((k+2)² R1_{k+1} - k² R1_k)/... use simple repeated extrapolation
def rich(s, p):
    return [((k + 1 + 1) ** p * s[k + 1] - (k + 1) ** p * s[k]) / ((k + 2) ** p - (k + 1) ** p) for k in range(len(s) - 1)]
R1 = rich(seq, 1); R2 = rich(R1, 2); R3 = rich(R2, 3)
print('  Richardson-1 tail:', [mp.nstr(x, 10) for x in R1[-4:]])
print('  Richardson-2 tail:', [mp.nstr(x, 10) for x in R2[-4:]])
print('  Richardson-3 tail:', [mp.nstr(x, 10) for x in R3[-4:]])
a_est = R3[-1]
print(f'  ⇒ Stokes exponent a ≈ {mp.nstr(a_est, 10)}  (candidates: 0, 1/6 = 0.1667, 1/3, 1/2, 2/3)')
for a_try in [mp.mpf(0), mp.mpf(1) / 6, mp.mpf(1) / 3, mp.mpf(1) / 2, mp.mpf(2) / 3, mp.mpf(1)]:
    Ss = []
    for k in range(len(C) - 6, len(C)):
        c = mp.mpf(C[k].numerator) / mp.mpf(C[k].denominator)
        Ss.append(c / ((-54) ** (k + 1) * mp.gamma(k + 1 + a_try)))
    print(f'  a = {mp.nstr(a_try, 5)}: S_k = C_k/((-54)^k Γ(k+a)) for the last six k: {[mp.nstr(x, 8) for x in Ss]}')
