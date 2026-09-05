"""SOL Q3 — two-centre hydrogenic STO integrals in prolate coordinates.

The foci are at z=+/-R/2.  Gauss-Laguerre integrates xi in [1,infinity)
after analytically extracting its exponential; Gauss-Legendre integrates
eta in [-1,1].  Run with:
  ~/bin/scipython research/probes-fields/sol-h2plus.py
"""
from __future__ import annotations

from dataclasses import dataclass
import numpy as np
from scipy.linalg import eigh
from scipy.optimize import minimize_scalar
from scipy.special import roots_laguerre, roots_legendre


@dataclass(frozen=True)
class AO:
    label: str
    center: int       # +1: A at -R/2, -1: B at +R/2; r_C=a(xi+center*eta)
    l: int            # z-oriented 1s, 2p_z, or 3d_z2

    @property
    def n(self): return self.l + 1
    @property
    def zeta(self): return 1.0 / self.n
    @property
    def atomic_energy(self): return -0.5 / self.n**2
    @property
    def norm(self):
        return [1 / np.sqrt(np.pi), 1 / (4 * np.sqrt(2 * np.pi)), 1 / (81 * np.sqrt(6 * np.pi))][self.l]


def ao_polynomial(ao: AO, z: np.ndarray, r_center: np.ndarray, a: float) -> np.ndarray:
    z_center = z + a * ao.center
    if ao.l == 0:
        return np.ones_like(z)
    if ao.l == 1:
        return z_center
    return 3 * z_center**2 - r_center**2


def matrices(R: float, order: int, max_l: int = 1):
    """Return S,H for [1s,2pz,(3dz2)] on A followed by the same on B."""
    a = R / 2
    basis = [AO(f"{l+1}{'spd'[l]}A", +1, l) for l in range(max_l + 1)]
    basis += [AO(f"{l+1}{'spd'[l]}B", -1, l) for l in range(max_l + 1)]
    x, wx = roots_laguerre(order)
    eta, weta = roots_legendre(order)
    X, ETA = x[:, None], eta[None, :]
    weights = wx[:, None] * weta[None, :]
    count = len(basis)
    S = np.zeros((count, count))
    VA = np.zeros_like(S)
    VB = np.zeros_like(S)

    for i, bi in enumerate(basis):
        for j, bj in enumerate(basis[:i + 1]):
            lam = a * (bi.zeta + bj.zeta)
            mu = a * (bi.zeta * bi.center + bj.zeta * bj.center)
            xi = 1 + X / lam
            z = a * xi * ETA
            rA = a * (xi + ETA)
            rB = a * (xi - ETA)
            ri = rA if bi.center == +1 else rB
            rj = rA if bj.center == +1 else rB
            pi = ao_polynomial(bi, z, ri, a)
            pj = ao_polynomial(bj, z, rj, a)
            # exp[-lam*xi-mu*eta] dxi = exp[-lam-mu*eta] exp[-x] dx/lam;
            # exp[-x] is already the Laguerre weight and phi integrates to 2pi.
            common = 2 * np.pi * np.exp(-lam - mu * ETA) * bi.norm * bj.norm * pi * pj / lam
            volume = a**3 * (xi**2 - ETA**2)
            values = (
                np.sum(weights * common * volume),
                np.sum(weights * common * volume / rA),
                np.sum(weights * common * volume / rB),
            )
            for matrix, value in zip((S, VA, VB), values):
                matrix[i, j] = matrix[j, i] = value

    # H chi_j = E_atomic,j chi_j - chi_j/r_other(j).  Average the bra and
    # ket forms to suppress roundoff while preserving exact Hermiticity.
    H = np.zeros_like(S)
    for i, bi in enumerate(basis):
        for j, bj in enumerate(basis):
            vi = VB[i, j] if bi.center == +1 else VA[i, j]
            vj = VB[i, j] if bj.center == +1 else VA[i, j]
            H[i, j] = 0.5 * (bi.atomic_energy + bj.atomic_energy) * S[i, j] - 0.5 * (vi + vj)
    return S, H, basis


def total_energy(R: float, order: int = 16, max_l: int = 1):
    S, H, _ = matrices(R, order, max_l)
    electronic = eigh(H, S, eigvals_only=True)[0]
    return electronic + 1 / R


print("Q3 quadrature convergence: max matrix error in S or H for {1s,2pz,3dz2}/centre, R=1,2,3,4")
references = {R: matrices(R, 64, max_l=2)[:2] for R in (1.0, 2.0, 3.0, 4.0)}
for order in (6, 7, 8, 9, 10, 12):
    worst = 0.0
    for R, reference in references.items():
        trial = matrices(R, order, max_l=2)[:2]
        worst = max(worst, np.max(np.abs(trial[0] - reference[0])), np.max(np.abs(trial[1] - reference[1])))
    print(f"order={order:2d}x{order:2d}  max|matrix error|={worst:.3e}")

print("\nQ3 H2+ 1s/centre at R=2")
S1, H1, _ = matrices(2.0, 16, max_l=0)
e1 = eigh(H1, S1, eigvals_only=True)
print(f"S_AB={S1[0,1]:.12f} H_AA={H1[0,0]:.12f} H_AB={H1[0,1]:.12f}")
print(f"Eg(2)={e1[0] + 0.5:.12f} Eh  Eu(2)={e1[1] + 0.5:.12f} Eh")
minimum_1s = minimize_scalar(lambda R: total_energy(R, 16, max_l=0), bounds=(1, 4), method="bounded", options={"xatol": 1e-12})
print(f"1s-only Re={minimum_1s.x:.9f} E={minimum_1s.fun:.12f} Eh")

print("\nQ3 H2+ fixed register {1s,2pz}/centre")
for order in (6, 8, 10, 12, 16):
    print(f"order={order:2d}  E(R=2)={total_energy(2.0, order, max_l=1):.12f} Eh")
minimum_sp = minimize_scalar(lambda R: total_energy(R, 16, max_l=1), bounds=(1, 4), method="bounded", options={"xatol": 1e-12})
print(f"fixed-{{1s,2pz}} Re={minimum_sp.x:.9f} E={minimum_sp.fun:.12f} Eh De={(-0.5-minimum_sp.fun)*27.211386:.9f} eV")
print(f"delta versus 1s-only: dRe={minimum_sp.x-minimum_1s.x:+.9f} dE={minimum_sp.fun-minimum_1s.fun:+.12f} Eh")
