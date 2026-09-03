# bf-r3-poisson.py — the ladder as a sum of shifted Airy envelopes (Poisson summation), and what the exact E adds.
#   A_ladder(t) = Σ_k p_k e^{-i E_k t},  p_k = e^{-k²/2σ²}/Z.  With the cubic phase model θ_k = α k/σ + β (k/σ)³ (+ small γ k²),
#   Poisson:  Σ_k p_k e^{iθ_k} = (1/Z) Σ_j ∫ dk e^{-k²/2σ²} e^{iθ(k)} e^{2πijk}  =  (σ√(2π)/Z) Σ_j I(α - 2πσ j, β)
#   where I(α,β) = (1/√2π)∫ e^{-u²/2} e^{i(αu+βu³)} du is the Airy closed form.  Z = Σ_k e^{-k²/2σ²} ≈ σ√(2π) for σ ≳ 1.
import math
import numpy as np
import mpmath as mp
mp.mp.dps = 40

def I_airy(alpha, beta):
    b = mp.mpf(beta); a = mp.mpf(alpha); c = (3 * b) ** (mp.mpf(1) / 3)
    return mp.sqrt(2 * mp.pi) / c * mp.exp(1 / (108 * b * b) + a / (6 * b)) * mp.airyai((a + 1 / (12 * b)) / c)

def ladder(nbar, sig):
    ks = np.arange(-int(6 * sig + 2), int(6 * sig + 3)); ns = nbar + ks; ns = ns[ns >= 1]; ks = ns - nbar
    w = np.exp(-ks ** 2 / (2 * sig * sig)); Z = w.sum(); p = w / Z
    return ks, p, Z, ns.astype(float)

print(' n̄   σ     β      x*    |A| exact-E ladder   |A| cubic ladder   |A| Poisson-Airy (j=-6..6)   |I| j=0 only')
for (nbar, sig) in [(30, 2.0), (27, 2.0), (24, 2.0), (36, 2.0), (45, 2.0), (48, 2.0), (60, 2.0), (90, 2.0), (30, 1.2), (60, 1.5), (150, 2.0)]:
    ks, p, Z, ns = ladder(nbar, sig)
    Tcl = 2 * math.pi * nbar ** 3; Trev = 4 * math.pi / 3 * nbar ** 4
    beta = 8 * math.pi * sig ** 3 / (3 * nbar)
    E = -0.5 / ns ** 2
    xs = np.linspace(-0.5, 0.5, 4001)
    exactA = np.array([abs(np.sum(p * np.exp(-1j * E * (Trev + x * Tcl)))) for x in xs])
    k = int(np.argmax(exactA)); xstar = xs[k]
    # cubic-truncated ladder at the same x*: θ_k = 2πx k + (3πx/n̄) k² + (8π/(3n̄)) k³  (mod the vanishing 2πk² at T_rev)
    def cubicA(x):
        th = 2 * math.pi * x * ks + 3 * math.pi * x / nbar * ks ** 2 + 8 * math.pi / (3 * nbar) * ks ** 3
        return abs(np.sum(p * np.exp(1j * th)))
    cubA = max(cubicA(x) for x in xs)
    alpha = 2 * math.pi * xstar * sig
    S = sum(I_airy(alpha - 2 * math.pi * sig * j, beta) for j in range(-6, 7)) * sig * math.sqrt(2 * math.pi) / Z
    # maximize the Poisson-Airy sum over x too
    def PA(x):
        a = 2 * math.pi * x * sig
        return abs(sum(I_airy(a - 2 * math.pi * sig * j, beta) for j in range(-6, 7))) * sig * math.sqrt(2 * math.pi) / Z
    paMax = max(float(PA(x)) for x in np.linspace(-0.5, 0.5, 801))
    I0 = max(float(abs(I_airy(2 * math.pi * x * sig, beta))) for x in np.linspace(-0.5, 0.5, 801))
    print(f' {nbar:3d}  {sig:3.1f}  {beta:6.3f}  {xstar:+.3f}      {exactA[k]:.4f}             {cubA:.4f}             {paMax:.4f} (at x*: {float(abs(S)):.4f})            {I0:.4f}')
