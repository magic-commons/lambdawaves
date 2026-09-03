# bf-r3-recon6.py — Theorem C5 census: reconnection points of ψ = (3d₊₂ + 4p₊₁ + 5s)/√3 are the intersections of
#   {|g0| = 2|g+|} ∩ {|g-| = |g+|} in the meridian half-plane (g+ = 3d₊₂, g0 = 4p₊₁, g- = 5s profiles);
#   each fires at t ≡ 0 (g+g- > 0) or T_d/2 (g+g- < 0) mod T_d = 2π/|E3 + E5 − 2E4|, at azimuth φ_d = arg(−g0/(2g+)) − (E4 − E3) t.
import math, cmath, sys
import numpy as np
from scipy import special, optimize
def R(n, l, r):
    rho = 2.0 * r / n
    N = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return N * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
def prof(l, m, th): return special.sph_harm_y(l, m, th, 0.0).real
E3, E4, E5 = -1 / 18, -1 / 32, -0.02; om = E3 + E5 - 2 * E4; T = 2 * math.pi / abs(om)
gp = lambda r, th: R(3, 2, r) * prof(2, 2, th)
g0 = lambda r, th: R(4, 1, r) * prof(1, 1, th)
gm = lambda r, th: R(5, 0, r) * prof(0, 0, th)
F1 = lambda r, th: abs(g0(r, th)) - 2 * abs(gp(r, th))
F2 = lambda r, th: abs(gm(r, th)) - abs(gp(r, th))
# trace the curve F2 = 0 as (θ → r-roots), then sign changes of F1 along each branch
ths = np.linspace(0.01, math.pi - 0.01, 1200); rs = np.linspace(0.05, 60, 2400)
branch_pts = []
for th in ths:
    v = np.array([F2(r, th) for r in rs]); idx = np.where(v[:-1] * v[1:] < 0)[0]
    for i in idx:
        r0 = optimize.brentq(lambda r: F2(r, th), rs[i], rs[i + 1], xtol=1e-12)
        branch_pts.append((th, r0, F1(r0, th)))
events = []
by_th = {}
for th, r0, f1 in branch_pts: by_th.setdefault(th, []).append((r0, f1))
th_list = sorted(by_th)
for a, b in zip(th_list[:-1], th_list[1:]):
    for (ra, fa) in by_th[a]:
        cand = min(by_th[b], key=lambda p: abs(p[0] - ra), default=None)
        if cand is None or abs(cand[0] - ra) > 0.5: continue
        rb, fb = cand
        if fa * fb < 0:
            sol, info, ier, msg = optimize.fsolve(lambda v: [F1(v[0], v[1]), F2(v[0], v[1])], [(ra + rb) / 2, (a + b) / 2], full_output=True, xtol=1e-13)
            r0, th0 = sol
            if ier == 1 and 0.02 < th0 < math.pi - 0.02 and 0.05 < r0 < 60 and abs(F1(r0, th0)) < 1e-9 and abs(F2(r0, th0)) < 1e-9:
                if not any(abs(r0 - e[0]) < 1e-4 and abs(th0 - e[1]) < 1e-4 for e in events):
                    sgn = gp(r0, th0) * gm(r0, th0)
                    t0 = (0.0 if sgn > 0 else math.pi / abs(om)) % T
                    wd = -g0(r0, th0) * cmath.exp(-1j * E4 * t0) / (2 * gp(r0, th0) * cmath.exp(-1j * E3 * t0))
                    w = np.roots([gp(r0, th0) * cmath.exp(-1j * E3 * t0), g0(r0, th0) * cmath.exp(-1j * E4 * t0), gm(r0, th0) * cmath.exp(-1j * E5 * t0)])
                    events.append((r0, th0, t0, cmath.phase(wd), abs(wd), abs(w[0] - w[1]), sgn))
events.sort()
print(f'ψ = (3d₊₂ + 4p₊₁ + 5s)/√3: T_d = 2π/|E3+E5−2E4| = {T:.4f} a.u.; reconnection points (r, θ) = {{|g0|=2|g+|}} ∩ {{|g-|=|g+|}}: {len(events)} found')
print('     r         θ        ρ        z      t0 (mod T_d)   φ_d        |w_d|      |w1-w2|   sign(g+g-)')
for r0, th0, t0, ph, aw, dw, sgn in events:
    print(f'  {r0:8.5f}  {th0:8.5f}  {r0*math.sin(th0):7.4f}  {r0*math.cos(th0):+8.4f}   {t0:9.4f}      {ph:+8.5f}   {aw:.8f}  {dw:.1e}   {"+" if sgn > 0 else "−"}')
print('all events fire at t ≡ T_d/2 if every sign is −, at t ≡ 0 if +; the azimuth advances by −(E4−E3)·T_d =', f'{(-(E4 - E3) * T) % (2*math.pi):+.5f} rad per period')
