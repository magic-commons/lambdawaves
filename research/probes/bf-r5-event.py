# bf-r5-event.py — Round 5 (Fable): certify Opus's first generic cubic reconnection on the FULL ψ = (3d₊₂+4p₊₁+5s+6p₋₁)/2
#   by 4-D Newton in (r, θ, t, φ) on (Re P, Im P, Re P', Im P') at w = e^{iφ}, starting from his six-digit point; then the
#   beat phases, the PT mirror, and the discriminant's zero count per period at the event's (r, θ) (Pólya/L-0250 count).
import math, cmath
import numpy as np
from scipy import special
E = {3: -1 / 18, 4: -1 / 32, 5: -0.02, 6: -1 / 72}
modes = [(3, 2, 2), (4, 1, 1), (5, 0, 0), (6, 1, -1)]
def R(n, l, r):
    rho = 2.0 * r / n
    Nn = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return Nn * math.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
def prof(l, m, th): return float(special.sph_harm_y(l, m, th, 0.0).real)
def A(r, th, t):
    return {m: 0.5 * R(n, l, r) * prof(l, m, th) * cmath.exp(-1j * E[n] * t) for (n, l, m) in modes}
def F(v):
    r, th, t, ph = v; a = A(r, th, t); w = cmath.exp(1j * ph)
    P = sum(a[m] * w ** (m + 1) for m in a); dP = sum((m + 1) * a[m] * w ** m for m in a if m + 1 != 0)
    return np.array([P.real, P.imag, dP.real, dP.imag])
def newton(v, it=40):
    v = np.array(v, dtype=float)
    for k in range(it):
        f = F(v); J = np.zeros((4, 4)); hs = [1e-7, 1e-7, 1e-6, 1e-7]
        for j in range(4):
            e = np.zeros(4); e[j] = hs[j]; J[:, j] = (F(v + e) - F(v - e)) / (2 * hs[j])
        dv = np.linalg.solve(J, -f); v = v + dv
        if np.linalg.norm(dv) < 1e-15: break
    return v, np.linalg.norm(F(v))
rho, z, t, phi = 0.925147, -14.159404, 113.526579, 2.515863
v0 = [math.hypot(rho, z), math.atan2(rho, z), t, phi]
scale = sum(abs(x) for x in A(*v0[:3]).values())
v, res = newton(v0)
print(f'start (r,θ,t,φ) = {[round(x, 6) for x in v0]}, |F| = {np.linalg.norm(F(np.array(v0))):.2e}')
print(f'refined: r = {v[0]:.10f}, θ = {v[1]:.10f}, t = {v[2]:.10f}, φ = {v[3]:.10f};  |F|/scale = {res / scale:.2e}')
print(f'   (ρ,z) = ({v[0] * math.sin(v[1]):.8f}, {v[0] * math.cos(v[1]):.8f});  shift from Opus: Δr = {v[0] - v0[0]:.2e}, Δθ = {v[1] - v0[1]:.2e}, Δt = {v[2] - v0[2]:.2e}, Δφ = {v[3] - v0[3]:.2e}')
a = A(*v[:3]); w = np.roots([a[2], a[1], a[0], a[-1]])
print('   roots |w| =', [round(abs(x), 9) for x in w], ' args =', [round(cmath.phase(x), 7) for x in w])
T = 2 * math.pi * 7200
beats = {'3-4': E[3] - E[4], '3-5': E[3] - E[5], '3-6': E[3] - E[6], '4-5': E[4] - E[5], '4-6': E[4] - E[6], '5-6': E[5] - E[6], 'disc 3+5-2·4': E[3] + E[5] - 2 * E[4]}
print('   beat phases t/T_beat mod 1:', {k: round((v[2] * abs(om) / (2 * math.pi)) % 1, 5) for k, om in beats.items()})
# PT mirror: (r, θ, 2π−φ, T−t)
vm, resm = newton([v[0], v[1], T - v[2], 2 * math.pi - v[3]])
print(f'   PT mirror at t = {vm[2]:.6f} = T − {T - vm[2]:.6f}, φ = {vm[3]:.6f}: |F|/scale = {resm / scale:.2e}')
# z-mirror: (r, π−θ, t, φ)
vz, resz = newton([v[0], math.pi - v[1], v[2], v[3]])
print(f'   z-mirror at θ = {vz[1]:.6f}: |F|/scale = {resz / scale:.2e}')
# the discriminant of the cubic as an exponential sum in t at the event's (r, θ): frequencies and the Pólya count
r0, th0 = v[0], v[1]
g = {m: 0.5 * R(n, l, r0) * prof(l, m, th0) for (n, l, m) in modes}    # real amplitudes
En = {m: E[n] for (n, l, m) in modes}
# disc = 18 a3 a2 a1 a0 − 4 a2³ a0 + a2² a1² − 4 a3 a1³ − 27 a3² a0²  with a3 = g2 e^{-iE3 t}, a2 = g1 e^{-iE4 t}, a1 = g0 e^{-iE5 t}, a0 = g-1 e^{-iE6 t}
terms = [(18 * g[2] * g[1] * g[0] * g[-1], En[2] + En[1] + En[0] + En[-1]), (-4 * g[1] ** 3 * g[-1], 3 * En[1] + En[-1]),
         (g[1] ** 2 * g[0] ** 2, 2 * En[1] + 2 * En[0]), (-4 * g[2] * g[0] ** 3, En[2] + 3 * En[0]), (-27 * g[2] ** 2 * g[-1] ** 2, 2 * En[2] + 2 * En[-1])]
freqs = sorted((round(-om * 7200), c) for c, om in terms)
print('   discriminant terms (frequency in units 1/7200, coefficient):', [(f, f'{c:.3e}') for f, c in freqs])
print(f'   Pólya count of zeros of disc(t) per period at this (r,θ): ω_max − ω_min = {freqs[-1][0] - freqs[0][0]};  adjacent gaps = {[freqs[i + 1][0] - freqs[i][0] for i in range(4)]}')
