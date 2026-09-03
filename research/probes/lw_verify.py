# lw_verify.py — numbers for the λWAVES synthesis (Fable, 2026-09-02).
# (a) momentum-space hydrogen closed form vs a direct Hankel transform
# (b) Rydberg revival clocks for a Gaussian packet about n̄
# (c) the exact probability current of 2p+ vs finite differences
# (d) Wigner d^l against sympy
# (e) KS: the 4D oscillator frequency and quantum number for E_n
import math, cmath
import numpy as np
from scipy import special, integrate

def R_nl(n, l, r):
    rho = 2.0 * r / n
    norm = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return norm * math.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)

def F_closed(n, l, p):
    # Podolsky–Pauling / Bethe–Salpeter: F_nl(p) = sqrt(2 (n-l-1)! / (pi (n+l)!)) n^2 2^(2l+2) l! (n p)^l / (n^2 p^2 + 1)^(l+2) C^{l+1}_{n-l-1}((n^2 p^2 - 1)/(n^2 p^2 + 1))
    x = (n * n * p * p - 1) / (n * n * p * p + 1)
    pref = math.sqrt(2 * math.factorial(n - l - 1) / (math.pi * math.factorial(n + l)))
    return pref * n * n * 2 ** (2 * l + 2) * math.factorial(l) * (n * p) ** l / (n * n * p * p + 1) ** (l + 2) * special.eval_gegenbauer(n - l - 1, l + 1, x)

def F_hankel(n, l, p):
    f = lambda r: R_nl(n, l, r) * special.spherical_jn(l, p * r) * r * r
    v, _ = integrate.quad(f, 0, 60 * n, limit=400)
    return math.sqrt(2 / math.pi) * v    # times (-i)^l, a phase

import sys
if len(sys.argv) > 1: pass
print('(a) momentum space: closed form vs Hankel transform, and ∫F² p² dp')
for (n, l) in [(1, 0), (2, 1), (3, 0), (3, 2), (4, 1), (6, 3), (6, 5)]:
    worst = 0
    for p in [0.05, 0.2, 0.5 / n, 1.0 / n, 2.0 / n, 0.9, 1.7]:
        a, b = F_closed(n, l, p), F_hankel(n, l, p)
        worst = max(worst, abs(abs(a) - abs(b)) / (abs(a) + 1e-12))
    normI, _ = integrate.quad(lambda q: F_closed(n, l, q) ** 2 * q * q, 0, 200, limit=400)
    print(f'  n={n} l={l}: worst rel |closed - hankel| = {worst:.2e}, ∫F²p²dp = {normI:.10f}')
# Fock: <p^2> = 1/n^2 (virial) as a second check
for n in [1, 3, 6]:
    l = n - 1
    p2, _ = integrate.quad(lambda q: F_closed(n, l, q) ** 2 * q ** 4, 0, 200, limit=400)
    print(f'  n={n} l={l}: <p²> = {p2:.8f}  (virial says 1/n² = {1 / n / n:.8f})')

print('(b) Rydberg packet clocks (a.u.): c_n ∝ exp(-(n-n̄)²/(4σ²)), circular ladder')
for nbar, sig in [(5, 1.0), (15, 1.5), (30, 2.0)]:
    ns = np.arange(max(1, nbar - 6 * int(math.ceil(sig))), nbar + 6 * int(math.ceil(sig)) + 1)
    w = np.exp(-((ns - nbar) ** 2) / (4 * sig * sig)); pop = w * w / np.sum(w * w)
    E = -0.5 / ns.astype(float) ** 2
    A = lambda t: abs(np.sum(pop * np.exp(-1j * E * t)))
    Tcl = 2 * math.pi * nbar ** 3; Trev = 4 * math.pi / 3 * nbar ** 4
    ts = np.linspace(0.97 * Trev, 1.03 * Trev, 4001); k = int(np.argmax([A(t) for t in ts]))
    th = np.linspace(0.47 * Trev, 0.53 * Trev, 4001); kh = int(np.argmax([A(t) for t in th]))
    print(f'  n̄={nbar} σ={sig}: modes {ns[0]}..{ns[-1]}  T_cl={Tcl:.1f}  T_rev={Trev:.1f} = {Trev / Tcl:.2f} T_cl')
    print(f'     |A(T_cl)|={A(Tcl):.4f}  |A(T_rev/2)|={A(Trev / 2):.4f}  max|A| near T_rev/2 = {A(th[kh]):.4f} at {th[kh] / Trev:.4f} T_rev  |A(T_rev)|={A(Trev):.4f}  max near T_rev = {A(ts[k]):.4f} at {ts[k] / Trev:.5f} T_rev')

print('(c) probability current of 2p+ (n=2,l=1,m=1): j = Im(ψ*∇ψ) vs the closed form m|ψ|²/(r sinθ) φ̂')
def psi(n, l, m, x, y, z):
    r = math.hypot(x, y, z); th = math.acos(z / r); ph = math.atan2(y, x)
    return R_nl(n, l, r) * special.sph_harm_y(l, m, th, ph)
def current(n, l, m, x, y, z, h=1e-5):
    p0 = psi(n, l, m, x, y, z)
    g = [(psi(n, l, m, x + h, y, z) - psi(n, l, m, x - h, y, z)) / (2 * h),
         (psi(n, l, m, x, y + h, z) - psi(n, l, m, x, y - h, z)) / (2 * h),
         (psi(n, l, m, x, y, z + h) - psi(n, l, m, x, y, z - h)) / (2 * h)]
    return [(p0.conjugate() * gi).imag for gi in g], abs(p0) ** 2
for (x, y, z) in [(1.3, 0.4, 0.7), (-2.0, 1.1, -0.3), (0.2, 3.0, 2.5)]:
    j, rho = current(2, 1, 1, x, y, z)
    r = math.hypot(x, y, z); s = math.hypot(x, y)            # r sinθ
    phihat = (-y / s, x / s, 0.0)
    jphi = rho / s                                           # m = 1
    jpred = [jphi * c for c in phihat]
    err = max(abs(j[i] - jpred[i]) for i in range(3)) / (abs(jphi) + 1e-30)
    print(f'  at ({x},{y},{z}): |j|={math.hypot(*j):.3e}  closed {jphi:.3e}  rel err {err:.1e}  radial part {abs(j[0]*x + j[1]*y + j[2]*z)/r/(abs(jphi)+1e-30):.1e}')
# continuity for a beating superposition: ∇·j = -∂ρ/∂t at t = T/4 for 1s + 2p_z
def psi_sup(t, x, y, z):
    E1, E2 = -0.5, -0.125
    return (psi(1, 0, 0, x, y, z) * cmath.exp(-1j * E1 * t) + psi(2, 1, 0, x, y, z) * cmath.exp(-1j * E2 * t)) / math.sqrt(2)
def j_sup(t, x, y, z, h=1e-4):
    p0 = psi_sup(t, x, y, z)
    return [((p0.conjugate() * (psi_sup(t, *q1) - psi_sup(t, *q0)) / (2 * h)).imag) for q1, q0 in [((x + h, y, z), (x - h, y, z)), ((x, y + h, z), (x, y - h, z)), ((x, y, z + h), (x, y, z - h))]]
T = 2 * math.pi / 0.375; t0 = T / 4; H = 2e-3; X = (0.9, -0.5, 1.4)
div = sum((j_sup(t0, *[X[k] + (H if k == i else 0) for k in range(3)])[i] - j_sup(t0, *[X[k] - (H if k == i else 0) for k in range(3)])[i]) / (2 * H) for i in range(3))
drho = (abs(psi_sup(t0 + 1e-4, *X)) ** 2 - abs(psi_sup(t0 - 1e-4, *X)) ** 2) / 2e-4
print(f'  continuity 1s+2p_z at T/4: ∇·j = {div:.6e}, -∂ρ/∂t = {-drho:.6e}, rel {abs(div + drho) / (abs(drho) + 1e-30):.1e}')

print('(d) Wigner d^l_{m\'m}(β) — explicit sum vs sympy Rotation.d, and the p_z → p_x check')
from sympy.physics.quantum.spin import Rotation
from sympy import N as sN, pi as spi, Rational
def wigner_d(l, mp, m, beta):
    s = 0.0
    for k in range(0, 2 * l + 1):
        a, b, c, d = l + m - k, k, mp - m + k, l - mp - k
        if min(a, b, c, d) < 0: continue
        s += (-1) ** (mp - m + k) * math.sqrt(math.factorial(l + m) * math.factorial(l - m) * math.factorial(l + mp) * math.factorial(l - mp)) \
             / (math.factorial(a) * math.factorial(b) * math.factorial(c) * math.factorial(d)) \
             * math.cos(beta / 2) ** (2 * l + m - mp - 2 * k) * math.sin(beta / 2) ** (mp - m + 2 * k)
    return s
worst = 0
for l in range(1, 6):
    for beta in [0.3, 1.1, 2.7]:
        for mp in range(-l, l + 1):
            for m in range(-l, l + 1):
                ref = float(sN(Rotation.d(l, mp, m, beta).doit()))
                worst = max(worst, abs(wigner_d(l, mp, m, beta) - ref))
print(f'  l = 1..5, three angles, all (m\',m): worst |d_here - d_sympy| = {worst:.2e}')
# p_z = Y_1^0 rotated by R_y(π/2): c'_{m'} = Σ_m d^1_{m'm}(π/2) c_m  → expect Y_1^{-1} coefficient +1/√2, Y_1^{1} −1/√2 (p_x = (Y_1^{-1} − Y_1^1)/√2)
cp = [wigner_d(1, mp, 0, math.pi / 2) for mp in (-1, 0, 1)]
print(f'  R_y(π/2) p_z → (c_-1, c_0, c_1) = ({cp[0]:+.6f}, {cp[1]:+.6f}, {cp[2]:+.6f});  p_x is (+{1 / math.sqrt(2):.6f}, 0, -{1 / math.sqrt(2):.6f})')

print('(e) KS: H_u = -(1/8)∇_u² + (-E)|u|²  ⇒ M = 4, ½Mω² = -E ⇒ ω = sqrt(-E/2); (N+2)ω = 1 ⇒ N = 2n - 2')
for n in [1, 2, 6, 15]:
    E = -0.5 / n / n; om = math.sqrt(-E / 2)
    print(f'  n={n}: ω = {om:.6f} = 1/(2n) = {1 / (2 * n):.6f};  N = 1/ω - 2 = {1 / om - 2:.6f}')
