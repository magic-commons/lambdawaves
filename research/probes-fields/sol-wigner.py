"""SOL Q6 — exact-integral numerical minimum of the hydrogen 1s Wigner function.

Convention (Praxmeyer-Mostowski-Wodkiewicz Eq. 1):
  W(r,p)=int d^3q/(2pi)^3 psi*(r+q/2) exp(i q.p) psi(r-q/2).
For psi_1s=exp(-r)/sqrt(pi), differentiating the one-dimensional
Feynman-parameter integral of Praxmeyer et al. gives a stable finite integral.
Run with: ~/bin/scipython research/probes-fields/sol-wigner.py
"""
from __future__ import annotations

import numpy as np
from scipy.optimize import differential_evolution, minimize
from scipy.special import roots_legendre


class Wigner1s:
    def __init__(self, order: int):
        x, w = roots_legendre(order)
        self.u, self.w = (x + 1) / 2, w / 2

    def __call__(self, point):
        r, p, mu = point                 # mu=cos(angle(r,p))
        u = self.u
        C = np.sqrt(1 + 4 * u * (1 - u) * p**2)
        radial = np.exp(-2 * r * C) * (4 * r**2 / C**3 + 6 * r / C**4 + 3 / C**5)
        phase = np.cos(2 * r * p * mu * (2 * u - 1))
        return 2 / np.pi**3 * np.sum(self.w * u * (1 - u) * radial * phase)


search_integral = Wigner1s(96)
search = differential_evolution(
    search_integral, [(0.0, 8.0), (0.0, 30.0), (0.0, 1.0)],
    seed=1982, popsize=18, tol=1e-10, polish=True, workers=1
)
print("Q6 1s Wigner minimum search on 0<=r<=8, 0<=p<=30, 0<=cos(theta)<=1")
print(f"search: W={search.fun:.15e} r={search.x[0]:.12f} p={search.x[1]:.12f} cos(theta)={search.x[2]:.12f}")

print("quadrature convergence after re-optimizing the parallel (cos(theta)=1) section")
last = search.x[:2]
for order in (32, 48, 64, 96, 128, 160):
    integral = Wigner1s(order)
    optimum = minimize(
        lambda rp: integral((rp[0], rp[1], 1.0)), last,
        method="Nelder-Mead", options={"xatol": 1e-11, "fatol": 1e-16, "maxiter": 1000}
    )
    last = optimum.x
    print(f"order={order:3d}: W={optimum.fun:.15e} pi^3*W={np.pi**3*optimum.fun:.15e} r={last[0]:.12f} p={last[1]:.12f}")

integral = Wigner1s(160)
print("angle check at the converged r,p")
for mu in (0.0, 0.25, 0.5, 0.75, 1.0):
    print(f"cos(theta)={mu:.2f} W={integral((last[0], last[1], mu)):.15e}")
print(f"anchor W(0,0)=1/pi^3={1/np.pi**3:.15e}")
