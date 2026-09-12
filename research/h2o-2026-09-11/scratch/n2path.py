import json, numpy as np
e = json.load(open('n2-engine.json')); n = e['n']
S = np.array(e['S']).reshape(n,n); h = np.array(e['T']).reshape(n,n)+np.array(e['V']).reshape(n,n)
G = np.array(e['eri']).reshape(n,n,n,n); Enuc = e['Enuc']; nocc = 7
w,U = np.linalg.eigh(S); X = U@np.diag(w**-0.5)@U.T
def run(damp, nit=400, label=''):
    D = np.zeros((n,n))
    for it in range(nit):
        F = h + np.einsum('kl,ijkl->ij',D,G) - 0.5*np.einsum('kl,ilkj->ij',D,G)
        ev,C2 = np.linalg.eigh(X.T@F@X); C = X@C2
        Dn = 2*C[:,:nocc]@C[:,:nocc].T
        if np.abs(Dn-D).max() < 1e-14: D = Dn; break
        D = damp*D + (1-damp)*Dn
    F = h + np.einsum('kl,ijkl->ij',D,G) - 0.5*np.einsum('kl,ilkj->ij',D,G)
    E = 0.5*np.einsum('ij,ij->',D,h+F) + Enuc
    print(f'{label:28s} damp={damp:.2f} it={it:3d} E={E:.12f}  eps={" ".join("%.6f"%x for x in ev[:8])}')
    return E, ev
for d in (0.0, 0.3, 0.5, 0.7):
    run(d, label='numpy eigh, core guess')
# now the same loop but with Jacobi ordering perturbed: mimic a solver that splits the degenerate pi pair
ev0, C0 = np.linalg.eigh(X.T@h@X)
print('core-guess eps (h):', ' '.join('%.6f'%x for x in ev0))
