# bf-r5-lie2.py — Round 5 (Fable), Q29 (lighter variant of bf-r5-lie.py): Lie closure of ⟨so(4), L²⟩ on the shell V_j ⊗ V_j,
#   one n per run (argv), unbuffered; the closure keeps an orthonormal basis of traceless anti-Hermitian matrices and stops
#   when a full pass of commutators adds nothing or the dimension reaches n⁴ − 1.
import sys
import numpy as np
n = int(sys.argv[1]); j = (n - 1) / 2
d = n; ms = np.array([j - k for k in range(d)])
Jz = np.diag(ms).astype(complex); Jp = np.zeros((d, d), dtype=complex)
for k in range(1, d):
    m = ms[k]; Jp[k - 1, k] = np.sqrt(j * (j + 1) - m * (m + 1))
Jm = Jp.conj().T; Jx = (Jp + Jm) / 2; Jy = (Jp - Jm) / (2j); I = np.eye(d)
A = [np.kron(M, I) for M in (Jx, Jy, Jz)]; B = [np.kron(I, M) for M in (Jx, Jy, Jz)]
L2 = sum((a + b) @ (a + b) for a, b in zip(A, B))
D = n * n; Id = np.eye(D)
def vec(M): return np.concatenate([M.real.ravel(), M.imag.ravel()])
def closure(gens, target):
    basis = np.zeros((0, 2 * D * D)); mats = []
    def add(M):
        nonlocal basis
        M = (M - M.conj().T) / 2; M = M - np.trace(M) / D * Id
        v = vec(M)
        if basis.shape[0]: v = v - basis.T @ (basis @ v)
        nrm = np.linalg.norm(v)
        if nrm > 1e-9:
            v = v / nrm; basis = np.vstack([basis, v]); mats.append(v[:D * D].reshape(D, D) + 1j * v[D * D:].reshape(D, D)); return True
        return False
    for g in gens: add(g)
    changed = True
    while changed and len(mats) < target:
        changed = False
        cur = list(mats)
        for a in range(len(cur)):
            for b in range(a + 1, len(cur)):
                if add(cur[a] @ cur[b] - cur[b] @ cur[a]): changed = True
                if len(mats) >= target: return len(mats)
        print(f'   pass: dim {len(mats)}', flush=True)
    return len(mats)
target = n ** 4 - 1
d1 = closure([1j * M for M in A + B], target)
print(f'n = {n}: so(4) alone → {d1}', flush=True)
d2 = closure([1j * M for M in A + B] + [1j * L2], target)
print(f'n = {n}: ⟨so(4), L²⟩ → {d2} vs su(n²) = {target}: {"UNIVERSAL" if d2 == target else "NOT universal"}', flush=True)
