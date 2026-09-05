"""SOL Q2 — spherical exchange-only X-alpha (alpha=2/3) atom.

Independent finite-difference radial solver for the same central-field contract
that lab/qcd.js and lab/cornell.js can serve with Numerov/tabulated radials.
Run with: ~/bin/scipython research/probes-fields/sol-hfs.py
"""
from __future__ import annotations

import numpy as np
from scipy.linalg import eigh_tridiagonal
from scipy.integrate import cumulative_trapezoid

ALPHA = 2.0 / 3.0
RMAX = 40.0
MIX = 0.25

# (angular l, radial level within l starting at 1, occupation)
CONFIG = {
    "Ne": (10, [(0, 1, 2), (0, 2, 2), (1, 1, 6)]),
    "Ar": (18, [(0, 1, 2), (0, 2, 2), (1, 1, 6), (0, 3, 2), (1, 2, 6)]),
    "K":  (19, [(0, 1, 2), (0, 2, 2), (1, 1, 6), (0, 3, 2), (1, 2, 6), (0, 4, 1)]),
    "Sc": (21, [(0, 1, 2), (0, 2, 2), (1, 1, 6), (0, 3, 2), (1, 2, 6), (0, 4, 2), (2, 1, 1)]),
}
HF_TOTAL = {"Ne": -128.547, "Ar": -526.82}


def hartree_potential(q: np.ndarray, r: np.ndarray, h: float) -> np.ndarray:
    """V_H(r)=Q(<r)/r+int_r^infinity q(s)/s ds; int q dr=N_e."""
    n = len(r)
    rf = h * np.arange(n + 2)
    qf = np.zeros(n + 2)
    qf[1:-1] = q
    inner = cumulative_trapezoid(qf, rf, initial=0.0)
    q_over_r = np.zeros_like(qf)
    q_over_r[1:] = qf[1:] / rf[1:]
    outer = -cumulative_trapezoid(q_over_r[::-1], rf[::-1], initial=0.0)[::-1]
    return inner[1:-1] / r + outer[1:-1]


def solve_atom(name: str, ngrid: int) -> dict:
    z, config = CONFIG[name]
    h = RMAX / (ngrid + 1)
    r = h * np.arange(1, ngrid + 1)
    vh = np.zeros(ngrid)
    vx = np.zeros(ngrid)
    previous_energy = None
    levels = {l: max(n for ll, n, _ in config if ll == l) for l in {x[0] for x in config}}
    # Spectator levels needed for the K/Sc 4s-versus-3d ordering gate.
    levels[0] = max(levels.get(0, 0), 4)
    levels[2] = max(levels.get(2, 0), 1)
    offdiag = np.full(ngrid - 1, -0.5 / h**2)

    for iteration in range(240):
        potential = -z / r + vh + vx
        eigenvalues, orbitals = {}, {}
        for l, count in levels.items():
            diagonal = 1.0 / h**2 + potential + l * (l + 1) / (2 * r**2)
            eig, vec = eigh_tridiagonal(
                diagonal, offdiag, select="i", select_range=(0, count - 1),
                check_finite=False, lapack_driver="stebz"
            )
            eigenvalues[l] = eig
            orbitals[l] = vec / np.sqrt(h)  # h sum_i u_i^2=1

        q = np.zeros(ngrid)
        orbital_sum = 0.0
        for l, radial_level, occupation in config:
            u = orbitals[l][:, radial_level - 1]
            q += occupation * u**2
            orbital_sum += occupation * eigenvalues[l][radial_level - 1]

        vh_new = hartree_potential(q, r, h)
        rho = q / (4 * np.pi * r**2)
        # V_x=-(3 rho/pi)^(1/3): X-alpha with alpha=2/3, i.e. Dirac/KS exchange.
        vx_new = -(3 * rho / np.pi) ** (1.0 / 3.0)
        e_hartree = 0.5 * h * np.sum(q * vh_new)
        e_exchange = -0.75 * (3 / np.pi) ** (1.0 / 3.0) * h * np.sum(4 * np.pi * r**2 * rho ** (4.0 / 3.0))
        total = orbital_sum - e_hartree - e_exchange / 3.0
        delta_v = max(np.max(np.abs(vh_new - vh)), np.max(np.abs(vx_new - vx)))
        delta_e = np.inf if previous_energy is None else abs(total - previous_energy)
        if delta_e < 1e-9 and delta_v < 1e-7:
            break
        vh = (1 - MIX) * vh + MIX * vh_new
        vx = (1 - MIX) * vx + MIX * vx_new
        previous_energy = total

    # Frozen-density Latter diagnostic.  The variational total above is for
    # raw X-alpha; the ad-hoc -1/r tail is used only to test orbital ordering.
    raw_potential = -z / r + vh_new + vx_new
    latter_potential = np.minimum(raw_potential, -1 / r)
    corrected = np.flatnonzero(raw_potential > -1 / r)
    latter_radius = r[corrected[0]] if len(corrected) else np.nan
    latter_eigenvalues = {}
    for l, count in levels.items():
        latter_eigenvalues[l] = eigh_tridiagonal(
            1.0 / h**2 + latter_potential + l * (l + 1) / (2 * r**2), offdiag,
            select="i", select_range=(0, count - 1), eigvals_only=True,
            check_finite=False, lapack_driver="stebz"
        )

    return {
        "name": name, "N": ngrid, "h": h, "iterations": iteration + 1,
        "energy": total, "eps": eigenvalues, "charge": h * np.sum(q),
        "dE": delta_e, "dV": delta_v, "latter_eps": latter_eigenvalues,
        "latter_radius": latter_radius,
    }


print(f"Q2 X-alpha alpha={ALPHA:.12f}; r in (0,{RMAX:g}); linear Dirichlet grid; potential mixing={MIX:g}")
closed_shell_runs = {}
for atom in ("Ne", "Ar"):
    closed_shell_runs[atom] = []
    for ngrid in (6000, 12000, 24000):
        result = solve_atom(atom, ngrid)
        closed_shell_runs[atom].append(result)
        hf = HF_TOTAL[atom]
        rel = abs(result["energy"] - hf) / abs(hf)
        valence_p = result["eps"][1][-1]
        print(
            f"{atom} N={ngrid:5d} h={result['h']:.9f} iter={result['iterations']:3d} "
            f"E={result['energy']:.9f} Eh  vsHF={result['energy']-hf:+.9f} ({100*rel:.6f}%) "
            f"eps(np)={valence_p:.9f}  charge={result['charge']:.12f} "
            f"dE={result['dE']:.2e} dV={result['dV']:.2e}"
        )
    # Remove the leading second-order finite-difference error using N=12000,24000.
    a, b = closed_shell_runs[atom][-2:]
    extrapolated = (a["energy"] * b["h"]**2 - b["energy"] * a["h"]**2) / (b["h"]**2 - a["h"]**2)
    print(f"{atom} h^2 extrapolated E={extrapolated:.9f} Eh")
    if atom == "Ne":
        print(f"Ne frozen Latter-tail diagnostic: r_L={b['latter_radius']:.6f}, eps(2p)={b['latter_eps'][1][0]:.9f}")

for atom in ("K", "Sc"):
    result = solve_atom(atom, 12000)
    eps4s = result["eps"][0][3]
    eps3d = result["eps"][2][0]
    ordering = "4s<3d" if eps4s < eps3d else "3d<4s"
    latter4s = result["latter_eps"][0][3]
    latter3d = result["latter_eps"][2][0]
    latter_ordering = "4s<3d" if latter4s < latter3d else "3d<4s"
    print(
        f"{atom} N=12000 iter={result['iterations']:3d} E={result['energy']:.9f} "
        f"eps(4s)={eps4s:.9f} eps(3d)={eps3d:.9f} ordering={ordering}; "
        f"frozen-Latter rL={result['latter_radius']:.6f} eps(4s)={latter4s:.9f} "
        f"eps(3d)={latter3d:.9f} ordering={latter_ordering}"
    )
