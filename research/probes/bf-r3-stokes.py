# bf-r3-stokes.py — Q12: the full asymptotic series of the revival maximiser α*(β) from the Airy asymptotics, and its large-order growth.
#   Ai(z) ~ e^{-ζ}/(2√π z^{1/4}) Σ (-1)^k u_k ζ^{-k},  Ai'(z) ~ -z^{1/4} e^{-ζ}/(2√π) Σ (-1)^k v_k ζ^{-k},  ζ = (2/3) z^{3/2},
#   u_k = Γ(3k+½)/(54^k k! Γ(k+½)),  v_k = -(6k+1)/(6k-1) u_k   (Abramowitz–Stegun 10.4.59–60).
#   The peak law Ai'(z*)/Ai(z*) = -λ, λ = 3^{1/3}/(6β^{2/3}), gives with s = √z*:  λ = s · V(ζ)/U(ζ);  invert for s(λ);
#   α* = (3β)^{1/3} s² - 1/(12β), and (3β)^{1/3} λ² = 1/(12β) exactly, so α* = (1/(12β)) Σ_{k≥1} c_k λ^{-3k} with λ^{-3} = 72 β².
import sympy as sp
K = 46
x = sp.symbols('x')          # x = ζ^{-1}
u = [sp.Integer(1)]
for k in range(1, K + 1):
    u.append(sp.gamma(3 * k + sp.Rational(1, 2)) / (54 ** k * sp.factorial(k) * sp.gamma(k + sp.Rational(1, 2))))
u = [sp.nsimplify(sp.simplify(t)) for t in u]
v = [sp.Integer(1)] + [-(sp.Integer(6 * k + 1) / (6 * k - 1)) * u[k] for k in range(1, K + 1)]
U = sum((-1) ** k * u[k] * x ** k for k in range(K + 1))
V = sum((-1) ** k * v[k] * x ** k for k in range(K + 1))
ratio = sp.series(V / U, x, 0, K + 1).removeO()            # V/U = 1 + a1 x + a2 x² + ...
# λ = s · (V/U)(ζ^{-1}),  ζ^{-1} = (3/2) s^{-3}.  Write y = s^{-3}:  λ/s = 1 + Σ a_k (3/2)^k y^k =: G(y).
y = sp.symbols('y')
G = sp.expand(ratio.subs(x, sp.Rational(3, 2) * y))
# invert: s = λ · H(λ^{-3}) with H(0) = 1.  From λ = s G(s^{-3}): put s = λ h, then 1 = h G(λ^{-3} h^{-3}).  Solve order by order in w = λ^{-3}.
w = sp.symbols('w')
h = sp.Integer(1)
NORD = 24
for it in range(NORD + 2):
    expr = sp.expand(sp.series(h * G.subs(y, w * h ** (-3)), w, 0, NORD + 1).removeO()) - 1
    # Newton-like fixed point: h <- h - expr (contraction in powers of w)
    h = sp.expand(sp.series(h - expr, w, 0, NORD + 1).removeO())
# s² = λ² h², α* = (1/(12β)) (h² - 1) with w = 72 β²
h2 = sp.expand(sp.series(h ** 2, w, 0, NORD + 1).removeO())
coeffs = [sp.nsimplify(h2.coeff(w, k)) for k in range(0, NORD + 1)]
beta = sp.symbols('beta')
alpha_series = sum(coeffs[k] * (72 * beta ** 2) ** k for k in range(1, NORD + 1)) / (12 * beta)
alpha_series = sp.expand(alpha_series)
C = [alpha_series.coeff(beta, 2 * k - 1) for k in range(1, NORD + 1)]
print('α*(β) = Σ C_k β^{2k-1}:')
for k, c in enumerate(C, 1):
    print(f'  C_{k} = {c}  ≈ {sp.N(c, 15)}')
print('large-order test: C_k / (54^k Γ(k + a)) for a in {0, 1/2, 1, 3/2, 2}  (a constant column reveals the Stokes exponent)')
import mpmath as mp
mp.mp.dps = 30
for a in [0, 0.5, 1, 1.5, 2]:
    row = []
    for k, c in enumerate(C, 1):
        val = mp.mpf(sp.N(c, 30)) / (mp.mpf(54) ** k * mp.gamma(k + a))
        row.append(mp.nstr(val, 8))
    print(f'  a={a}: ' + ', '.join(row[3:]))
print('ratio C_{k+1}/C_k vs -54 (k + a) for a = 1:')
for k in range(1, len(C) - 1):
    r = sp.N(C[k] / C[k - 1], 15)
    print(f'  k={k}: ratio {r}  /(-54 k) = {sp.N(r / (-54 * k), 10)}   /(-54(k+1)) = {sp.N(r / (-54 * (k + 1)), 10)}')
