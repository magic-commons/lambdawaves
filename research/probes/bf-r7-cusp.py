# bf-r7-cusp.py — Round 7 (Fable): the caustic ladder of the Rydberg revival, and where the Airy law stops.
#
# The level expansion  E_{n̄+k} = E(n̄) + k/n̄³ − (3/2)k²/n̄⁴ + 2k³/n̄⁵ − (5/2)k⁴/n̄⁶ + …  gives four clocks
#   T_cl = 2πn̄³,  T_rev = 4πn̄⁴/3,  T_sr = πn̄⁵,  T_4 = 4πn̄⁶/5,
# and  A(t) = e^{iφ} Σ_k p_k exp(−2πi[ k t/T_cl − k² t/T_rev + k³ t/T_sr − k⁴ t/T_4 ]).
# With p_k ∝ e^{−k²/2σ²} and k = σu the continuum envelope is
#   I_4(α, δ, β, γ) = (1/√2π)∫ exp(−u²/2 + iαu + iδu² + iβu³ + iγu⁴) du.
#
# CLAIM 1 (the saddle ladder).  The exponentially small correction to the envelope with leading phase γ_p u^p is
# e^{−ΔS_p} with ΔS_p the action difference between the Gaussian saddle u = 0 and the nearest other saddle:
#     ΔS_p = (1/2 − 1/p)·u₂²,   u₂^{p−2} = 1/(i p γ_p)      ⇒   |ΔS_p| = ((p−2)/(2p))·(p γ_p)^{−2/(p−2)}.
# p = 3 gives ΔS = 1/(54β²) — THE PRINT'S 54, derived in one line rather than fitted — and p = 4 gives i/(16γ).
# CLAIM 2 (the cusp).  At t = T_sr the cubic phase is an exact multiple of 2π for every integer k, and the
# quadratic one is too iff 4 | n̄.  What survives is the QUARTIC: the superrevival envelope is a Pearcey
# function (cusp caustic) at imaginary cusp parameter, where the revival envelope is an Airy function (fold).
# CLAIM 3 (the arithmetic of the superrevival).  n̄ mod 4 decides it: 0 → full, 2 → full but shifted half a
# classical period, odd → a fractional revival (the quadratic phase survives as a quarter-integer).
import math
import mpmath as mp
mp.mp.dps = 40

print('=== CLAIM 1: the singulant is the action difference of two saddles ===')
print('  p   direct ΔS(γ_p = 1)          formula ((p−2)/2p)(p)^{−2/(p−2)}      moment-series ratio c_{m+1}/c_m ~ ?')
for p in [3, 4, 5, 6]:
    g = mp.mpf(1)
    # saddles of S(u) = −u²/2 + i γ u^p:  −u + i p γ u^{p−1} = 0  ⇒  u^{p−2} = 1/(i p γ)
    u2 = mp.power(1 / (1j * p * g), mp.mpf(1) / (p - 2))
    S = -u2 ** 2 / 2 + 1j * g * u2 ** p
    form = (mp.mpf(p - 2) / (2 * p)) * mp.power(p * g, -mp.mpf(2) / (p - 2))
    print(f'  {p}   {mp.nstr(S, 12):28s}  |ΔS| = {mp.nstr(abs(S), 12):18s} formula {mp.nstr(form, 12)}')
# the moment series of the envelope itself: I = Σ_m (iγ)^m ⟨u^{pm}⟩ / m!,  ⟨u^{2q}⟩ = (2q−1)!!
def dfact(n):
    r = mp.mpf(1)
    while n > 1: r *= n; n -= 2
    return r
for p in [3, 4]:
    print(f'  p = {p}: moment ratio c_(m+1)/c_m divided by m (large m):')
    row = []
    for m in [20, 40, 80, 160]:
        if p % 2:                       # odd p: only even m survive; the series runs in γ²
            c1 = dfact(p * m - 1) / mp.factorial(m); c2 = dfact(p * (m + 2) - 1) / mp.factorial(m + 2)
            row.append(mp.nstr(c2 / c1 / m, 8))
        else:
            c1 = dfact(p * m - 1) / mp.factorial(m); c2 = dfact(p * (m + 1) - 1) / mp.factorial(m + 1)
            row.append(mp.nstr(c2 / c1 / m, 8))
    print(f'     m = 20, 40, 80, 160 → {row}   (expect {54 if p == 3 else 16} for p = {p})')

print()
print('=== CLAIM 2 + 3: the exact ladder sum at the superrevival, and n̄ mod 4 ===')
def clocks(nbar):
    return dict(Tcl=2 * mp.pi * nbar ** 3, Trev=4 * mp.pi * nbar ** 4 / 3, Tsr=mp.pi * mp.mpf(nbar) ** 5, T4=4 * mp.pi * mp.mpf(nbar) ** 6 / 5)
def exact_A(nbar, sigma, t, K=8):
    num = mp.mpf(0); den = mp.mpf(0); acc = mp.mpc(0)
    for k in range(-int(math.ceil(K * sigma)), int(math.ceil(K * sigma)) + 1):
        n = nbar + k
        if n < 1: continue
        w = mp.e ** (-mp.mpf(k) ** 2 / (2 * mp.mpf(sigma) ** 2))
        acc += w * mp.e ** (-1j * (-mp.mpf(1) / (2 * mp.mpf(n) ** 2)) * t)
        den += w
    return abs(acc / den)
def env4(alpha, delta, beta, gamma, R=9):
    f = lambda u: mp.e ** (-u * u / 2 + 1j * (alpha * u + delta * u * u + beta * u ** 3 + gamma * u ** 4))
    return abs(mp.quad(f, [-R, 0, R]) / mp.sqrt(2 * mp.pi))
sigma = 2
print('  n̄  mod4   |A(T_sr)| exact   quartic envelope |I₄(0,0,0,γ_sr)|   γ_sr = 5πσ⁴/2n̄   |A(T_rev)| exact')
for nbar in [36, 38, 39, 40, 44]:
    C = clocks(nbar)
    g_sr = 5 * mp.pi * mp.mpf(sigma) ** 4 / (2 * nbar)
    # the surviving linear phase at T_sr: 2π k t/T_cl = π k n̄²  →  α_eff = 0 (n̄ even) or π (n̄ odd, a half shift)
    a_exact = exact_A(nbar, sigma, C['Tsr'])
    pred = env4(0, 0, 0, g_sr)
    a_rev = exact_A(nbar, sigma, C['Trev'])
    print(f'  {nbar:3d}   {nbar % 4}     {mp.nstr(a_exact, 8):16s} {mp.nstr(pred, 8):26s} {mp.nstr(g_sr, 6):18s} {mp.nstr(a_rev, 8)}')
print('  (the quartic envelope is the prediction only when 4 | n̄; otherwise the quadratic phase survives at T_sr)')
print()
print('  the surviving phases at t = T_sr, per k (mod 2π), for each n̄ class:')
for nbar in [40, 38, 39]:
    C = clocks(nbar)
    ph = []
    for k in [1, 2, 3]:
        q = 2 * mp.pi * k ** 2 * C['Tsr'] / C['Trev']; c = 2 * mp.pi * k ** 3 * C['Tsr'] / C['Tsr']; l = 2 * mp.pi * k * C['Tsr'] / C['Tcl']
        ph.append((k, mp.nstr(mp.fmod(q, 2 * mp.pi), 6), mp.nstr(mp.fmod(c, 2 * mp.pi), 6), mp.nstr(mp.fmod(l, 2 * mp.pi), 6)))
    print(f'    n̄ = {nbar} (mod 4 = {nbar % 4}): (k, quadratic, cubic, linear) = {ph}')

print()
print('=== the régime boundary: where the Airy (fold) law stops and the cusp is needed, at T_rev ===')
print('  n̄    σ     β₃       β₄      |A| exact   Airy I(α*,β₃)   4-term I₄   Airy error   4-term error')
for (nbar, sigma) in [(600, 2), (300, 2), (150, 2), (80, 2), (40, 2), (150, 4), (80, 4), (40, 4), (40, 6)]:
    C = clocks(nbar)
    b3 = 8 * mp.pi * mp.mpf(sigma) ** 3 / (3 * nbar); b4 = 10 * mp.pi * mp.mpf(sigma) ** 4 / (3 * mp.mpf(nbar) ** 2)
    t = C['Trev']
    a_ex = exact_A(nbar, sigma, t)
    # the phases at T_rev: quadratic ≡ 0 (2π), linear L = −(4πn̄/3) mod 2π folded into α
    L = mp.fmod(-(4 * mp.pi * mp.mpf(nbar) / 3), 2 * mp.pi)
    if L > mp.pi: L -= 2 * mp.pi
    if L < -mp.pi: L += 2 * mp.pi
    alpha = -L * sigma
    # the Poisson aliases (j = ±1, ±2 …) matter at large σ; include them in both predictions
    def sum_alias(fn):
        s = mp.mpf(0); nrm = mp.mpf(0)
        for j in range(-6, 7):
            s += fn(alpha - 2 * mp.pi * sigma * j)
            nrm += mp.e ** (-2 * mp.pi ** 2 * mp.mpf(sigma) ** 2 * j * j)
        return s / nrm
    airy = sum_alias(lambda a: env4(a, 0, b3, 0))
    four = sum_alias(lambda a: env4(a, 0, b3, b4))
    print(f'  {nbar:4d} {sigma:3d}  {mp.nstr(b3, 5):8s} {mp.nstr(b4, 5):8s} {mp.nstr(a_ex, 7):11s} {mp.nstr(airy, 7):15s} {mp.nstr(four, 7):11s} {mp.nstr(abs(airy - a_ex), 3):11s} {mp.nstr(abs(four - a_ex), 3)}')
