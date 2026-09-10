"""Small algebra probes for the Beta plan; not app or chemistry certification.
Run with Python + NumPy. Writes nothing unless stdout is redirected.
"""
import itertools
import json
import math
import platform
import numpy as np


def ring(hoppings):
    h = np.zeros((6, 6))
    for i, t in enumerate(hoppings):
        h[i, (i + 1) % 6] = h[(i + 1) % 6, i] = t
    e, c = np.linalg.eigh(h)
    assert e[3] - e[2] > 1e-8
    return e, 2 * c[:, :3] @ c[:, :3].T


e, d = ring([-1.0] * 6)
exact = np.sort([-2 * math.cos(2 * math.pi * k / 6) for k in range(6)])
spectrum_error = float(np.max(np.abs(e - exact)))
assert spectrum_error < 1e-12
assert abs(2 * sum(e[:3]) + 8) < 1e-12
ed, dd = ring([-1.35, -0.75, -1.10, -0.90, -1.25, -0.65])
site_error = float(np.max(np.abs(np.diag(dd) - 1)))
bond_change = float(np.max(np.abs(dd - d)))
assert site_error < 1e-12 and bond_change > 0.01

# Independent numerical quadrature of a fixed-H rectangular shutter.
energies = np.array([0., 0., 1.3])
a = np.array([1., 1.j, .7])
a /= np.linalg.norm(a)
d0 = np.outer(a, a.conj())
t, width = .4, 3.7
delta = energies[:, None] - energies[None, :]
center = d0 * np.exp(-1.j * delta * t)
expected = center * np.sinc(delta * width / (2 * np.pi))
# Composite midpoint rule; block evaluation avoids unnecessary large buffers.
times = t + width * ((np.arange(20000) + .5) / 20000 - .5)
observed = sum(d0 * np.exp(-1.j * delta * x) for x in times) / len(times)
shutter_error = float(np.max(np.abs(observed - expected)))
assert shutter_error < 1e-8
assert abs(expected[0, 1] - center[0, 1]) < 1e-14

# Generalized stationary eigenvalue derivative, with a genuinely changing metric.
def matrices(x):
    h = np.array([[-1 + .2*x, -.3 + .1*x], [-.3 + .1*x, .4 - .15*x]])
    s = np.array([[1., .2 + .05*x], [.2 + .05*x, 1. + .03*x]])
    return h, s


def solve(x):
    h, s = matrices(x)
    l = np.linalg.cholesky(s)
    li = np.linalg.inv(l)
    es, ys = np.linalg.eigh(li @ h @ li.T)
    c = np.linalg.solve(l.T, ys[:, 0])
    return es[0], c


x = .3
e0, c = solve(x)
dh = np.array([[.2, .1], [.1, -.15]])
ds = np.array([[0., .05], [.05, .03]])
derivative = float(c @ (dh - e0 * ds) @ c)
hstep = 1e-4
fd = (solve(x+hstep)[0] - solve(x-hstep)[0]) / (2*hstep)
force_error = float(abs(fd - derivative))
omitted_overlap_error = float(abs(fd - c @ dh @ c))
assert force_error < 1e-8 and omitted_overlap_error > 1e-4

# Enumerate instead of merely restating binomial coefficients.
fixed_n = sum(1 for _ in itertools.combinations(range(12), 6))
fixed_ms = sum(1 for occupied in itertools.combinations(range(12), 6)
               if sum(i < 6 for i in occupied) == 3)
assert (fixed_n, fixed_ms) == (924, 400)
mode_multiplicities = [(2,1),(1,1),(2,1),(1,2),(4,2),(1,1),(2,1),(2,1),(3,2),(2,2)]
assert sum(n*dim for n, dim in mode_multiplicities) == 30
assert sum(n for n, dim in mode_multiplicities) == 20

print(json.dumps({
    "scope": "Algebra checks only; no new molecular reference or app tests",
    "python": platform.python_version(), "numpy": np.__version__,
    "huckel_spectrum_max_error": spectrum_error,
    "distorted_ring_site_charge_max_error": site_error,
    "distorted_ring_density_matrix_max_change": bond_change,
    "shutter_quadrature_max_error": shutter_error,
    "generalized_eigenvalue_derivative_error": force_error,
    "error_if_overlap_derivative_omitted": omitted_overlap_error,
    "fixed_N_dimension": fixed_n, "Ms_zero_dimension": fixed_ms,
    "vibrational_coordinates": 30, "symmetry_distinct_mode_count": 20,
    "status": "passed"
}, indent=2))
