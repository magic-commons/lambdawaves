"""bf-r10-cornell.py — Round 10 (Fable), Q53: the Cornell 2S–2P splitting for charmonium and the Runge–Lenz violation
on the n = 2 Coulomb manifold.  V = −κ/r + σ r, κ = 4α_s/3, α_s = 0.39, σ = 0.18 GeV², μ = 0.75 GeV (Opus §1.3).
Radial: −u''/(2μ) + [V + l(l+1)/(2μ r²)] u = E u, finite differences + Richardson on two grids.
Run: ~/miniforge3/envs/sci/bin/python bf-r10-cornell.py
"""
import numpy as np
from scipy.linalg import eigh_tridiagonal
from math import sqrt, pi
import sympy as sp

alpha_s, sigma, mu = 0.39, 0.18, 0.75
kappa = 4 * alpha_s / 3

def levels(l, Npts, rmax=30.0):
    r = np.linspace(0, rmax, Npts + 2)[1:-1]; h = r[1] - r[0]
    diag = 1 / (mu * h * h) + (-kappa / r + sigma * r + l * (l + 1) / (2 * mu * r * r))
    off = -np.ones(Npts - 1) / (2 * mu * h * h)
    w = eigh_tridiagonal(diag, off, select='i', select_range=(0, 3))[0]
    return w

print("== Cornell charmonium levels (GeV, relative to 2 m_c), Richardson from N = 40000 and 80000 points ==")
out = {}
for l in (0, 1, 2):
    e1, e2 = levels(l, 40000), levels(l, 80000)
    E = (4 * e2 - e1) / 3
    out[l] = E
    print(f"  l={l}: " + "  ".join(f"{v:+.6f}" for v in E) + f"   (grid diff {np.max(np.abs(e2-e1)):.1e})")
E1S, E2S, E3S = out[0][:3]; E1P, E2P = out[1][:2]; E1D = out[2][0]
print(f"\n  E(1S) = {E1S:+.6f}  E(2S) = {E2S:+.6f}  (Opus: +0.326744, +0.930388)")
print(f"  E(1P) [spectroscopic 2P, the lowest l=1] = {E1P:+.6f};   E(2P) [3P] = {E2P:+.6f};   E(1D) [3D] = {E1D:+.6f}")
print(f"  2S − 1P = {E2S - E1P:+.6f} GeV   (Coulomb: 0;  measured ψ(2S) − χ_c centroid(1P) ≈ 3.686 − 3.525 = 0.161)")
print(f"  (2S − 1P)/(2S − 1S) = {(E2S - E1P)/(E2S - E1S):.5f}   — the dimensionless SO(4)→SO(3) breaking of the n=2 shell as a level ratio")
print(f"  1P − 1S = {E1P - E1S:+.6f},   1D − 1P = {E1D - E1P:+.6f}")

# ── Runge–Lenz violation on the n = 2 Coulomb manifold ──────────────────────────────────────────────────────────
# H = p²/2μ − κ/r + σ r;  A = (p×L − L×p)/(2μ) − κ r̂  (commutes with the Coulomb part).
# [H, A_z] = σ [r, A_z] = (iσ/2μ) ({x̂, L_y} − {ŷ, L_x})   (using [r, p_i] = i x_i/r, [r, L] = 0, [r, r̂] = 0).
# Represent on {R_20, R_21} ⊗ {Y_lm, l ≤ 2}; radial Gram G = [[1, ρ],[ρ, 1]], ρ = ⟨R_20|R_21⟩ (scale-free).
from sympy.physics.wigner import gaunt
lm = [(l, m) for l in range(3) for m in range(-l, l + 1)]
idx = {v: i for i, v in enumerate(lm)}
nA = len(lm)
def Lpm(sign):
    M = sp.zeros(nA, nA)
    for (l, m) in lm:
        m2 = m + sign
        if abs(m2) <= l: M[idx[(l, m2)], idx[(l, m)]] = sp.sqrt(l * (l + 1) - m * (m + sign))
    return M
Lp, Lm = Lpm(1), Lpm(-1)
Lx = (Lp + Lm) / 2; Ly = (Lp - Lm) / (2 * sp.I)
# x̂ ± i ŷ = sinθ e^{±iφ} = ∓ sqrt(8π/3) Y_{1,±1};  ẑ = sqrt(4π/3) Y_10.  Matrix of Y_{1q}: ⟨l'm'|Y_1q|lm⟩ = gaunt(l',1,l,−m',q,m)(−1)^{m'}
def Ymat(q):
    M = sp.zeros(nA, nA)
    for (l, m) in lm:
        for (l2, m2) in lm:
            if m2 != m + q: continue
            M[idx[(l2, m2)], idx[(l, m)]] = (-1) ** m2 * gaunt(l2, 1, l, -m2, q, m)
    return M
Y1p, Y1m, Y10 = Ymat(1), Ymat(-1), Ymat(0)
xhat = (-sp.sqrt(8 * sp.pi / 3) * Y1p + sp.sqrt(8 * sp.pi / 3) * Y1m) / 2
yhat = (-sp.sqrt(8 * sp.pi / 3) * Y1p - sp.sqrt(8 * sp.pi / 3) * Y1m) / (2 * sp.I)
Oang = (xhat * Ly + Ly * xhat) - (yhat * Lx + Lx * yhat)          # angular part of {x̂,L_y} − {ŷ,L_x}
Oang = sp.simplify(Oang)
# sanity: ẑ-check that x̂ is Hermitian and unit-ish: ⟨00|x̂ x̂ + ŷŷ + ẑẑ|00⟩ = 1 (within l ≤ 2 truncation, exact for l=0 source)
zhat = sp.sqrt(4 * sp.pi / 3) * Y10
print("\n  check x̂²+ŷ²+ẑ² on |00⟩:", sp.simplify((xhat * xhat + yhat * yhat + zhat * zhat)[idx[(0, 0)], idx[(0, 0)]]))

# radial overlap ρ = ∫ R_20 R_21 r² dr with the lab's R_nl (a_B = 1)
r = sp.symbols('r', positive=True)
R20 = sp.sqrt(sp.Rational(1, 8)) * (2 - r) * sp.exp(-r / 2) / sp.sqrt(2) * sp.sqrt(2) / 1   # placeholder, recomputed below
def Rnl(n, l):
    rho = 2 * r / n
    norm = sp.sqrt((sp.Rational(2, n)) ** 3 * sp.factorial(n - l - 1) / (2 * n * sp.factorial(n + l)))
    return norm * sp.exp(-rho / 2) * rho ** l * sp.assoc_laguerre(n - l - 1, 2 * l + 1, rho)
R20, R21 = Rnl(2, 0), Rnl(2, 1)
rho_ov = sp.integrate(R20 * R21 * r ** 2, (r, 0, sp.oo))
print("  ⟨R_20|R_21⟩ =", rho_ov, "=", float(rho_ov), ";  norms:", sp.integrate(R20 ** 2 * r ** 2, (r, 0, sp.oo)), sp.integrate(R21 ** 2 * r ** 2, (r, 0, sp.oo)))
G = sp.Matrix([[1, rho_ov], [rho_ov, 1]])
# the four manifold states: (radial index, angular index)
states = [(0, idx[(0, 0)]), (1, idx[(1, -1)]), (1, idx[(1, 0)]), (1, idx[(1, 1)])]
# [H, A_z] ψ = (iσ/2μ) O ψ, O acts on the angular factor only, radial factor unchanged.
# Full norm² of O ψ_s: Σ_ang |O_{ang, s_ang}|² · G[s_r, s_r]  (single radial function ⇒ G = 1)
full2 = 0
proj = sp.zeros(4, 4)
for si, (rs, as_) in enumerate(states):
    col = Oang[:, as_]
    full2 += sum(sp.Abs(c) ** 2 for c in col)
    for sj, (rt, at) in enumerate(states):
        proj[sj, si] = col[at] * G[rt, rs]              # ⟨ψ_t | O ψ_s⟩ = angular element × radial overlap
full2 = sp.nsimplify(sp.simplify(full2))
projF2 = sp.nsimplify(sp.simplify(sum(sp.Abs(v) ** 2 for v in proj)))
pref = sigma / (2 * mu)
print(f"  ‖O‖ on the manifold: Σ_s ‖O ψ_s‖² = {full2} = {float(full2):.6f};  projected Frobenius² = {projF2} = {float(projF2):.6f}")
aB = 1 / (mu * kappa); E2 = -mu * kappa ** 2 / 8
print(f"  a_B = 1/(μκ) = {aB:.5f} GeV⁻¹ = {aB*0.19733:.4f} fm;  E_2(Coulomb) = {E2:+.6f} GeV;  σ a_B = {sigma*aB:.5f} GeV")
# ‖H ψ_s‖² = E2² + 2 E2 σ⟨r⟩ + σ²⟨r²⟩ ;  ⟨r⟩_2s = 6a, ⟨r²⟩_2s = 42a², ⟨r⟩_2p = 5a, ⟨r²⟩_2p = 30a²
H2 = (E2 ** 2 + 2 * E2 * sigma * 6 * aB + sigma ** 2 * 42 * aB ** 2) + 3 * (E2 ** 2 + 2 * E2 * sigma * 5 * aB + sigma ** 2 * 30 * aB ** 2)
PHP2 = (E2 + 6 * sigma * aB) ** 2 + 3 * (E2 + 5 * sigma * aB) ** 2
comm_full = pref * sqrt(float(full2)); comm_proj = pref * sqrt(float(projF2))
print(f"\n  ‖[H,A_z]‖ (full, Σ_s‖[H,A_z]ψ_s‖²)^½ = {comm_full:.6f} GeV;   ‖P[H,A_z]P‖_F = {comm_proj:.6f} GeV")
print(f"  ‖H‖ on the manifold (Σ_s‖Hψ_s‖²)^½ = {sqrt(H2):.6f} GeV;   ‖PHP‖_F = {sqrt(PHP2):.6f} GeV")
print(f"  RATIO (full)      ‖[H,A_z]‖/‖H‖ = {comm_full/sqrt(H2):.6f}")
print(f"  RATIO (projected) ‖P[H,A_z]P‖/‖PHP‖ = {comm_proj/sqrt(PHP2):.6f}")
print(f"  with Pauli's K = A·sqrt(μ/(−2E_2)) = (2/κ) A: multiply both by 2/κ = {2/kappa:.4f} → {comm_full/sqrt(H2)*2/kappa:.6f} (full), {comm_proj/sqrt(PHP2)*2/kappa:.6f} (projected)")
print(f"  scale: ‖[H,A_z]‖ ∝ σ/μ = {sigma/mu:.4f} GeV; the pure number ‖O‖ = {sqrt(float(full2)):.6f} (full), {sqrt(float(projF2)):.6f} (projected)")
