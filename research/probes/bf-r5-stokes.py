# bf-r5-stokes.py — Round 5 (Fable).  (a) the exact C_k to N terms in rational arithmetic and Richardson-5 on the subleading
#   constant (Opus's c = 7/9 was measured on mpmath coefficients; here the coefficients are exact);  (b) Q25: the asymptotic
#   series of the revival peak HEIGHT |I|_max(β) to N exact terms and its Stokes data (Ω₄'s first test).
#   Closed form used for (b):  with w = 72β², h(w) = s/λ the inversion series (h² = 1 − w/2 + …), η = h − 1,
#     |I|_max = h^{-1/2} · U(x) · exp(−(3η² + 2η³)/(3w)),   x = (3/2) w h^{-3},   U(x) = Σ (−1)^k u_k x^k  (the Airy series),
#   which follows from |I| = √(2π)(3β)^{-1/3} e^{α/6β+1/108β²} Ai(z), z* = λ²h², ζ* = h³/(108β²), α* = (h²−1)/(72β²):
#   the prefactors cancel exactly to 1 and the exponent collapses to (3h² − 2h³ − 1)/(216β²) = −(3η² + 2η³)/(3w).
import sys
from fractions import Fraction as F
import mpmath as mp
N = int(sys.argv[1]) if len(sys.argv) > 1 else 40
def mul(a, b):
    c = [F(0)] * (N + 1)
    for i, x in enumerate(a):
        if x == 0: continue
        for j, y in enumerate(b):
            if i + j > N: break
            c[i + j] += x * y
    return c
def inv(a):
    b = [F(0)] * (N + 1); b[0] = 1 / a[0]
    for n in range(1, N + 1):
        b[n] = -sum(a[k] * b[n - k] for k in range(1, n + 1)) / a[0]
    return b
def compose(g, z):                 # g(z(w)), z[0] == 0
    out = [F(0)] * (N + 1); p = [F(0)] * (N + 1); p[0] = F(1)
    for k in range(N + 1):
        if k: p = mul(p, z)
        if all(x == 0 for x in p): break
        for i in range(N + 1): out[i] += g[k] * p[i]
    return out
def expser(f):                     # exp(f), f[0] == 0
    e = [F(0)] * (N + 1); e[0] = F(1)
    for n in range(1, N + 1):
        e[n] = sum(k * f[k] * e[n - k] for k in range(1, n + 1)) / n
    return e
def logser(h):                     # log(h), h[0] == 1
    L = [F(0)] * (N + 1)
    for n in range(1, N + 1):
        L[n] = h[n] - sum((k * L[k] * h[n - k] for k in range(1, n)), F(0)) / n
    return L
u = [F(1)]
for k in range(1, N + 1):
    u.append(u[-1] * F((6 * k - 1) * (6 * k - 3) * (6 * k - 5), 216 * k * (2 * k - 1)))
v = [F(1)] + [-F(6 * k + 1, 6 * k - 1) * u[k] for k in range(1, N + 1)]
U = [(-1) ** k * u[k] for k in range(N + 1)]
V = [(-1) ** k * v[k] for k in range(N + 1)]
ratio = mul(V, inv(U))
G = [ratio[k] * F(3, 2) ** k for k in range(N + 1)]
h = [F(0)] * (N + 1); h[0] = F(1)
for it in range(N + 2):
    h3 = inv(mul(mul(h, h), h))
    z = [F(0)] + h3[:N]
    h = inv(compose(G, z))
h2 = mul(h, h)
C = [h2[k] * F(72) ** k / 12 for k in range(1, N + 1)]
print(f'(a) exact C_k, k ≤ {N}: C_1..C_6 =', [str(c) for c in C[:6]])
mp.mp.dps = 60
S0 = 1 / (6 * mp.pi * mp.e)
def rich(s, p=1):
    return [((k + 2) ** p * s[k + 1] - (k + 1) ** p * s[k]) / ((k + 2) ** p - (k + 1) ** p) for k in range(len(s) - 1)]
seq = []
for k in range(2, N + 1):
    c = mp.mpf(C[k - 1].numerator) / mp.mpf(C[k - 1].denominator)
    Sk = c / ((-54) ** k * mp.gamma(k))
    seq.append((Sk / S0 - 1) * (k - 1))          # → b_1 = -7/9 if Opus's dictionary is right (his convention (k-1))
R = seq
for lev in range(1, 6):
    R = rich(R, lev)
    print(f'    Richardson-{lev} on (S_k/S − 1)(k−1): tail {mp.nstr(R[-1], 12)}   (target −7/9 = {mp.nstr(-mp.mpf(7)/9, 12)})')
# (b) |I|_max series
eta = h[:]; eta[0] = F(0)
eta2 = mul(eta, eta); eta3 = mul(eta2, eta)
num = [3 * a + 2 * b for a, b in zip(eta2, eta3)]          # 3η² + 2η³, starts at w²
expo = [F(0)] * (N + 1)
for k in range(1, N + 1): expo[k] = -num[k + 1] / 3 if k + 1 <= N else F(0)    # divide by 3w → shift down one power
# careful: expo[k] = -(num[k+1])/3 needs num to N+1; recompute num one order higher by rerunning at N+1 is costly; accept the last term lost.
E = expser(expo)
h3 = inv(mul(mul(h, h), h))
x = [F(0)] + [F(3, 2) * h3[k] for k in range(N)]           # (3/2) w h^{-3}
Ux = compose(U, x)
hm12 = expser([-t / 2 for t in logser(h)])                # h^{-1/2}
Imax = mul(mul(hm12, Ux), E)
D = [Imax[k] * F(72) ** k for k in range(N + 1)]         # |I|_max = Σ D_k β^{2k}
print(f'(b) |I|_max(β) = Σ D_k β^(2k):  exact D_0..D_12 =', [str(d) for d in D[:13]])
S1 = 1 / (2 * mp.pi * mp.e)
seqD = []
for k in range(4, N):
    d = mp.mpf(D[k].numerator) / mp.mpf(D[k].denominator)
    seqD.append((d / ((-54) ** k * mp.gamma(k)) / S1 - 1) * (k - 1))
R = seqD
for lev in range(1, 6):
    R = rich(R, lev)
    print(f'    b_1 for |I|_max with S = 1/(2πe): Richardson-{lev} on (S_k/S − 1)(k−1): tail {mp.nstr(R[-1], 12)}')
print('    (the last coefficient D_%d is missing one contribution of the exponent and is not trusted)' % N)
Dk = [mp.mpf(d.numerator) / mp.mpf(d.denominator) for d in D]
print('    ratio test D_{k+1}/D_k /(-54) − k  (→ a, the Γ-shift):')
drift = [Dk[k + 1] / Dk[k] / (-54) - k for k in range(3, N - 1)]
R = drift
for lev in range(1, 5):
    R = rich(R, lev)
    print(f'      Richardson-{lev}: tail {mp.nstr(R[-1], 10)}')
# leading constant with a = 0 (Ω₄ predicts constant in (1/(π e)) Q) and with a = 1 (Γ(k+1) growth) for comparison
for a in [0, 1, -1]:
    Sk = [Dk[k] / ((-54) ** k * mp.gamma(k + a)) for k in range(4, N)]
    R = Sk
    for lev in range(1, 5): R = rich(R, lev)
    val = R[-1]
    print(f'    a = {a:+d}: S = lim D_k/((−54)^k Γ(k+a)) ≈ {mp.nstr(val, 12)};  S·π e = {mp.nstr(val * mp.pi * mp.e, 12)};  S·6πe = {mp.nstr(val * 6 * mp.pi * mp.e, 12)}')
