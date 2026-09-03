# bf-r3-morse2.py — the nodal curve of a two-term beat as a level set of arg f on S = {|φ1| = |φ2|}:
#   count its connected components as the relative phase c turns through 2π, and compare the values of c where the count
#   changes with the critical values of arg f on S found by bf-r3-morse.py.  Same example: φ1 = 2p₊, φ2 = (3p₀ + 3d₋)/√2.
import math
import numpy as np
from scipy import special, optimize, ndimage

def R_nl(n, l, r):
    rho = 2.0 * r / n
    norm = math.sqrt((2.0 / n) ** 3 * math.factorial(n - l - 1) / (2 * n * math.factorial(n + l)))
    return norm * np.exp(-rho / 2) * rho ** l * special.eval_genlaguerre(n - l - 1, 2 * l + 1, rho)
def phi1(r, th, ph): return R_nl(2, 1, r) * special.sph_harm_y(1, 1, th, ph)
def phi2(r, th, ph): return (R_nl(3, 1, r) * special.sph_harm_y(1, 0, th, ph) + R_nl(3, 2, r) * special.sph_harm_y(2, -1, th, ph)) / math.sqrt(2)
def f(r, th, ph): return phi1(r, th, ph) / phi2(r, th, ph)

nth, nph = 361, 720
ths = np.linspace(0.01, math.pi - 0.01, nth); phs = np.linspace(0, 2 * math.pi, nph, endpoint=False)
rs = np.linspace(0.05, 40, 1600)
C = np.full((nth, nph), np.nan)          # arg f on the innermost sheet
for i, th in enumerate(ths):
    for j, ph in enumerate(phs):
        vals = np.log(np.abs(f(rs, th, ph)) + 1e-300)
        for k in range(len(rs) - 1):
            if np.isfinite(vals[k]) and np.isfinite(vals[k + 1]) and vals[k] * vals[k + 1] < 0 and abs(vals[k] - vals[k + 1]) < 5:
                try:
                    r0 = optimize.brentq(lambda r: math.log(abs(f(r, th, ph))), rs[k], rs[k + 1])
                    C[i, j] = np.angle(f(r0, th, ph)); break
                except Exception: pass
have = ~np.isnan(C)
print(f'innermost sheet covers {int(have.sum())} of {nth * nph} directions')
def components(c):
    # the level set {arg f = c}: mark grid edges where the (wrapped) difference to c changes sign; label the marked cells
    d = (C - c + math.pi) % (2 * math.pi) - math.pi
    mask = np.zeros((nth, nph), dtype=bool)
    a = d[:-1, :] * d[1:, :] < 0; a &= have[:-1, :] & have[1:, :]; a &= np.abs(d[:-1, :] - d[1:, :]) < math.pi
    mask[:-1, :] |= a; mask[1:, :] |= a
    b = d[:, :-1] * d[:, 1:] < 0; b &= have[:, :-1] & have[:, 1:]; b &= np.abs(d[:, :-1] - d[:, 1:]) < math.pi
    mask[:, :-1] |= b; mask[:, 1:] |= b
    bw = d[:, -1] * d[:, 0] < 0; bw &= have[:, -1] & have[:, 0]; bw &= np.abs(d[:, -1] - d[:, 0]) < math.pi
    mask[:, -1] |= bw; mask[:, 0] |= bw
    # label with periodic wrap in φ by tiling twice and merging
    lab, n = ndimage.label(np.concatenate([mask, mask], axis=1), structure=np.ones((3, 3)))
    # components that appear in both copies are one; count unique labels touching the first copy
    first = set(np.unique(lab[:, :nph])) - {0}
    second = set(np.unique(lab[:, nph:])) - {0}
    return len(first), int(mask.sum())
cs = np.linspace(-math.pi, math.pi, 721)
counts = [components(c)[0] for c in cs]
changes = [(round(cs[i], 3), counts[i - 1], counts[i]) for i in range(1, len(cs)) if counts[i] != counts[i - 1]]
print('component count of the nodal curve on the sheet as c sweeps -π..π: values', sorted(set(counts)))
print(f'{len(changes)} changes:')
for ch in changes: print('   c = %+.3f : %d -> %d' % ch)
print('critical values from bf-r3-morse (sheet 0): ±0.571, ±1.344, ±1.410, ±1.425, ±1.717, ±1.731, ±1.797, ±2.571')
