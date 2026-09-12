# n2basin.py — ROUND 4 OPUS: the N2 core guess half-occupies a DEGENERATE pair (eps_7 = eps_8 = -7.836432).
# Which of the two RHF solutions you land in is decided by the arbitrary rotation inside that 2-D space.
import json, numpy as np
e = json.load(open('n2-engine.json')); n = e['n']
S = np.array(e['S']).reshape(n,n); h = np.array(e['T']).reshape(n,n)+np.array(e['V']).reshape(n,n)
G = np.array(e['eri']).reshape(n,n,n,n); Enuc = e['Enuc']; nocc = 7
w,U = np.linalg.eigh(S); X = U@np.diag(w**-0.5)@U.T
ev0, C2 = np.linalg.eigh(X.T@h@X); C0 = X@C2
def converge(Cocc):
    D = 2*Cocc@Cocc.T
    for it in range(600):
        F = h + np.einsum('kl,ijkl->ij',D,G) - 0.5*np.einsum('kl,ilkj->ij',D,G)
        ev,C2 = np.linalg.eigh(X.T@F@X); C = X@C2
        Dn = 2*C[:,:nocc]@C[:,:nocc].T
        if np.abs(Dn-D).max() < 1e-14: D = Dn; break
        D = Dn
    F = h + np.einsum('kl,ijkl->ij',D,G) - 0.5*np.einsum('kl,ilkj->ij',D,G)
    return 0.5*np.einsum('ij,ij->',D,h+F) + Enuc, ev, it
seen = {}
for deg in range(0, 91, 5):
    th = np.deg2rad(deg)
    Cocc = C0[:, :nocc].copy()
    Cocc[:, 6] = np.cos(th)*C0[:, 6] + np.sin(th)*C0[:, 7]
    E, ev, it = converge(Cocc)
    key = round(E, 9); seen.setdefault(key, []).append(deg)
    print(f'theta={deg:3d} deg  E={E:.12f}  it={it:3d}  eps4..8={" ".join("%.6f"%x for x in ev[3:8])}')
print('\ndistinct converged RHF solutions from a rotated half-occupied degenerate pair:')
for k,v in sorted(seen.items()): print(f'  E={k:.9f}  from theta = {v}')
