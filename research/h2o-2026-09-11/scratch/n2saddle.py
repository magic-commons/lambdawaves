# n2saddle.py — ROUND 4 OPUS: the plain Roothaan path from the core guess for N2/STO-3G visits a SECOND RHF
# stationary point 0.7298 Eh above the ground state, drives the Pulay error to 1e-13 there, then leaves it.
import json, numpy as np
e = json.load(open('n2-engine.json')); n = e['n']
S = np.array(e['S']).reshape(n,n); h = np.array(e['T']).reshape(n,n)+np.array(e['V']).reshape(n,n)
G = np.array(e['eri']).reshape(n,n,n,n); Enuc = e['Enuc']; nocc = 7
w,U = np.linalg.eigh(S); X = U@np.diag(w**-0.5)@U.T
D = np.zeros((n,n)); rows=[]
for it in range(160):
    F = h + np.einsum('kl,ijkl->ij',D,G) - 0.5*np.einsum('kl,ilkj->ij',D,G)
    E = 0.5*np.einsum('ij,ij->',D,h+F)+Enuc
    err = np.abs(X.T@(F@D@S - S@D@F)@X).max()
    rows.append((it,E,err))
    ev,C2 = np.linalg.eigh(X.T@F@X); C = X@C2
    D = 2*C[:,:nocc]@C[:,:nocc].T
for it,E,err in rows:
    if it<14 or it%10==0 or (30<=it<=100 and it%5==0): print(f'  it {it:3d} E={E:.12f} ‖e‖inf={err:.3e}')
print('min error along the path:', min(r[2] for r in rows[1:]), 'at it', min(rows[1:],key=lambda r:r[2])[0])
# is the higher point a stationary point?  start ON it (engine D) and measure the error
Dh = np.array(e['D']).reshape(n,n)
F = h + np.einsum('kl,ijkl->ij',Dh,G) - 0.5*np.einsum('kl,ilkj->ij',Dh,G)
print('engine solution: E=%.12f  ‖[F,DS]‖inf(orthog)=%.3e  Tr(DS)=%.12f' % (
    0.5*np.einsum('ij,ij->',Dh,h+F)+Enuc, np.abs(X.T@(F@Dh@S-S@Dh@F)@X).max(), np.trace(Dh@S)))
ev,_ = np.linalg.eigh(X.T@F@X); print('  its own eps:', ' '.join('%.6f'%x for x in ev), ' aufbau?', np.all(np.diff(ev)>=0))
# Roothaan iterated FROM that point
D = Dh.copy()
for it in range(200):
    F = h + np.einsum('kl,ijkl->ij',D,G) - 0.5*np.einsum('kl,ilkj->ij',D,G)
    ev,C2 = np.linalg.eigh(X.T@F@X); C = X@C2
    D = 2*C[:,:nocc]@C[:,:nocc].T
F = h + np.einsum('kl,ijkl->ij',D,G) - 0.5*np.einsum('kl,ilkj->ij',D,G)
print('200 more Roothaan steps from it: E=%.12f' % (0.5*np.einsum('ij,ij->',D,h+F)+Enuc))
from pyscf import scf
from pinned import mol_from
ANG=1/0.52917721092
mol = mol_from([{'Z':7,'c':[0,0,0]},{'Z':7,'c':[0,0,1.09768*ANG]}])
for g in ('hcore','minao','atom','1e'):
    try:
        mf = scf.RHF(mol); mf.init_guess=g; mf.conv_tol=1e-13; mf.run()
        print(f'  PySCF init_guess={g:6s} E={mf.e_tot:.12f} conv={mf.converged}')
    except Exception as ex: print('  ',g,'failed',ex)
