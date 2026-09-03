# bf-r3-vortex3.py — three-mode superposition: how many vortex lines cross a sphere, and when that count changes.
#   ψ = (2p₊ + 3p₀ + 3d₋)/√3.  On the sphere r = R the zeros of ψ are isolated points (the vortex lines' crossings);
#   each carries winding ±1.  N(t) = #zeros on the sphere; a change of N is a line entering/leaving through the sphere
#   or a creation/annihilation/reconnection event ON the sphere.  Also: the total winding (sum of signs) is 0 on a closed surface.
import math, sys
import numpy as np
from scipy import special

def R_nl(n, l, r):
    rho = 2.0 * r / n
    norm = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return norm * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)

E = {2: -0.125, 3: -1 / 18}
modes = [(2, 1, 1), (3, 1, 0), (3, 2, -1)]
amps = [1 / math.sqrt(3)] * 3
R = float(sys.argv[1]) if len(sys.argv) > 1 else 6.0
NT = 400
nth, nph = 600, 1200
th = (np.arange(nth) + 0.5) / nth * math.pi
ph = (np.arange(nph) + 0.5) / nph * 2 * math.pi
TH, PH = np.meshgrid(th, ph, indexing='ij')
parts = []
for (n, l, m), a in zip(modes, amps):
    Y = special.sph_harm_y(l, m, TH, PH)
    parts.append(a * R_nl(n, l, R) * Y)
# the slowest beat: the 2/3 Bohr period
T23 = 2 * math.pi / (E[3] - E[2])
def psi_at(t):
    return sum(p * np.exp(-1j * E[n] * t) for p, (n, l, m) in zip(parts, modes))
def zeros_on_sphere(psi):
    # a cell (i,j)-(i+1,j+1) contains a zero if the phase winds by ±2π around it
    ang = np.angle(psi)
    def d(a, b): return (b - a + math.pi) % (2 * math.pi) - math.pi
    w = d(ang[:-1, :-1], ang[:-1, 1:]) + d(ang[:-1, 1:], ang[1:, 1:]) + d(ang[1:, 1:], ang[1:, :-1]) + d(ang[1:, :-1], ang[:-1, :-1])
    # wrap in φ
    wcol = d(ang[:-1, -1], ang[:-1, 0]) + d(ang[:-1, 0], ang[1:, 0]) + d(ang[1:, 0], ang[1:, -1]) + d(ang[1:, -1], ang[:-1, -1])
    wind = np.rint(np.concatenate([w, wcol[:, None]], axis=1) / (2 * math.pi)).astype(int)
    idx = np.argwhere(wind != 0)
    return [(int(i), int(j), int(wind[i, j])) for i, j in idx]
print(f'ψ = (2p₊ + 3p₀ + 3d₋)/√3 on the sphere R = {R}; T(2↔3) = {T23:.3f} a.u.; grid {nth}×{nph}')
prev = None; events = []
counts = []
for k in range(NT + 1):
    t = T23 * k / NT
    zs = zeros_on_sphere(psi_at(t))
    N = len(zs); S = sum(z[2] for z in zs)
    counts.append((t, N, S))
    if prev is not None and N != prev:
        events.append((t, prev, N))
    prev = N
Ns = [c[1] for c in counts]
print(f'  N(t) takes the values {sorted(set(Ns))};  total winding Σ sign = {sorted(set(c[2] for c in counts))} (must be 0)')
print(f'  {len(events)} changes of N over one 2↔3 beat:')
for t, a, b in events[:40]:
    print(f'    t = {t:9.3f} a.u. ({t / T23:.4f} T): {a} → {b}')
# where the zeros are at t = 0
zs0 = zeros_on_sphere(psi_at(0.0))
print('  zeros at t = 0 (θ°, φ°, sign):', [(round(math.degrees(th[i]), 1), round(math.degrees(ph[j]), 1), s) for i, j, s in zs0])
