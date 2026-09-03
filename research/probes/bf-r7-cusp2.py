# bf-r7-cusp2.py — Round 7 (Fable): the cusp, tested in the régime where it is valid.
#
# bf-r7-cusp.py showed the superrevival arithmetic exactly (n̄ mod 4) but tested the cusp at n̄ ≈ 40, σ = 2, where
# the QUINTIC strength γ₅ = 3πσ⁵/n̄² = 0.19 is not small: the k-expansion is not converged there.  The cusp régime
# needs γ_sr = 5πσ⁴/2n̄ = O(1) AND γ₅ ≪ 1, i.e. σ ≈ (0.127 n̄)^{1/4} at large n̄.  Test there.
#   A(T_sr) = Σ p_k e^{2πi(5/4n̄)k⁴}   (exactly, when 4 | n̄: every lower phase is a multiple of 2π)
#   continuum: (1/√2π)∫e^{−u²/2 + iγu⁴}du  ·  with the Poisson aliases, spacing 2π in the conjugate variable.
import math
import mpmath as mp
mp.mp.dps = 50

def exact_A(nbar, sigma, t, K=9):
    acc = mp.mpc(0); den = mp.mpf(0)
    M = int(math.ceil(K * sigma))
    for k in range(-M, M + 1):
        n = nbar + k
        if n < 1: continue
        w = mp.e ** (-mp.mpf(k) ** 2 / (2 * mp.mpf(sigma) ** 2))
        acc += w * mp.e ** (1j * t / (2 * mp.mpf(n) ** 2))
        den += w
    return abs(acc / den)
def quartic_env(gamma, sigma, J=6, R=11):
    """|Σ_j I₄(α = −2πσ j, 0, 0, γ)| / Σ_j e^{−2π²σ²j²} — the Poisson sum of quartic envelopes"""
    s = mp.mpc(0); nrm = mp.mpf(0)
    for j in range(-J, J + 1):
        a = -2 * mp.pi * mp.mpf(sigma) * j
        f = lambda u: mp.e ** (-u * u / 2 + 1j * (a * u + gamma * u ** 4))
        s += mp.quad(f, [-R, 0, R]) / mp.sqrt(2 * mp.pi)
        nrm += mp.e ** (-2 * mp.pi ** 2 * mp.mpf(sigma) ** 2 * j * j)
    return abs(s) / nrm
print('THE CUSP AT THE SUPERREVIVAL  (4 | n̄: quadratic, cubic and linear phases all ≡ 0 mod 2π)')
print('   n̄     σ    γ_sr = 5πσ⁴/2n̄   γ₅ = 3πσ⁵/n̄²   |A(T_sr)| exact   quartic envelope   error')
for (nbar, sigma) in [(2000, 4), (2000, 3), (4000, 4), (4000, 5), (8000, 5), (8000, 6), (20000, 7), (400, 2.5), (400, 2)]:
    nbar = int(nbar); nbar -= nbar % 4                      # force 4 | n̄
    g = 5 * mp.pi * mp.mpf(sigma) ** 4 / (2 * nbar)
    g5 = 3 * mp.pi * mp.mpf(sigma) ** 5 / mp.mpf(nbar) ** 2
    T = mp.pi * mp.mpf(nbar) ** 5
    a = exact_A(nbar, sigma, T)
    p = quartic_env(g, sigma)
    print(f'  {nbar:6d}  {sigma:4}   {mp.nstr(g, 6):14s}  {mp.nstr(g5, 4):12s}  {mp.nstr(a, 8):16s} {mp.nstr(p, 8):16s}  {mp.nstr(abs(a - p), 3)}')
print()
print('THE HALF-SHIFT (n̄ ≡ 2 mod 4): the quadratic phase collapses to (−1)^k = a shift of the linear phase by π')
print('   n̄     σ    |A(T_sr)| exact   quartic envelope with α = π σ   plain quartic envelope')
for (nbar, sigma) in [(2002, 4), (4002, 4), (8002, 5)]:
    g = 5 * mp.pi * mp.mpf(sigma) ** 4 / (2 * nbar)
    T = mp.pi * mp.mpf(nbar) ** 5
    a = exact_A(nbar, sigma, T)
    # α = πσ: the (−1)^k = e^{iπk} phase, k = σu
    f = lambda u: mp.e ** (-u * u / 2 + 1j * (mp.pi * sigma * u + g * u ** 4))
    shifted = abs(mp.quad(f, [-11, 0, 11]) / mp.sqrt(2 * mp.pi))
    # the Poisson alias at j = ±... : with α = πσ the nearest alias sits at πσ − 2πσ = −πσ, equal modulus; sum them
    f2 = lambda u: mp.e ** (-u * u / 2 + 1j * (-mp.pi * sigma * u + g * u ** 4))
    both = abs((mp.quad(f, [-11, 0, 11]) + mp.quad(f2, [-11, 0, 11])) / mp.sqrt(2 * mp.pi)) / (1 + mp.e ** (-2 * mp.pi ** 2 * mp.mpf(sigma) ** 2))
    print(f'  {nbar:6d}  {sigma:4}   {mp.nstr(a, 8):16s} {mp.nstr(both, 8):20s} {mp.nstr(quartic_env(g, sigma), 8)}')
print()
print('THE FRACTIONAL CASE (n̄ odd): the quadratic phase is a QUARTER integer, 2πk²(3n̄/4) ≡ (π/2)k² · (3n̄ mod 4)')
print('   n̄     σ    |A(T_sr)| exact   |A| at T_sr ± T_cl/2   the four-term sum over k mod 4')
for (nbar, sigma) in [(2001, 4), (2003, 4)]:
    g = 5 * mp.pi * mp.mpf(sigma) ** 4 / (2 * nbar)
    T = mp.pi * mp.mpf(nbar) ** 5
    Tcl = 2 * mp.pi * mp.mpf(nbar) ** 3
    a = exact_A(nbar, sigma, T); b = exact_A(nbar, sigma, T + Tcl / 2)
    print(f'  {nbar:6d}  {sigma:4}   {mp.nstr(a, 8):16s} {mp.nstr(b, 8):20s}  3n̄ mod 4 = {(3 * nbar) % 4}')
print()
print('THE SATURATION: |A(T_sr)| as γ_sr → 0 must return to 1 (no phase at all left)')
for (nbar, sigma) in [(20000, 3), (80000, 3), (200000, 3)]:
    nbar -= nbar % 4
    g = 5 * mp.pi * mp.mpf(sigma) ** 4 / (2 * nbar)
    T = mp.pi * mp.mpf(nbar) ** 5
    print(f'  n̄ = {nbar:7d}, σ = {sigma}: γ_sr = {mp.nstr(g, 5):10s} |A(T_sr)| = {mp.nstr(exact_A(nbar, sigma, T), 10)}   envelope {mp.nstr(quartic_env(g, sigma), 10)}')
