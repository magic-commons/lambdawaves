import json, numpy as np
from pyscf import scf, gto
from pinned import mol_from
ANG = 1/0.52917721092
R = 1.09768*ANG
mol = mol_from([{'Z':7,'c':[0,0,0]},{'Z':7,'c':[0,0,R]}])
e = json.load(open('n2-engine.json')); n = e['n']
print('pyscf ao labels', mol.ao_labels())
ref = {'S': mol.intor('int1e_ovlp'), 'T': mol.intor('int1e_kin'), 'V': mol.intor('int1e_nuc')}
for k,v in ref.items():
    a = np.array(e[k]).reshape(n,n)
    print(f'{k}: max|Δ| = {np.abs(a-v).max():.3e}   scale {np.abs(v).max():.4f}')
g = mol.intor('int2e'); a = np.array(e['eri']).reshape(n,n,n,n)
print(f'eri: max|Δ| = {np.abs(a-g).max():.3e}   scale {np.abs(g).max():.4f}')
print('Enuc Δ', e['Enuc'] - mol.energy_nuc())
mf = scf.RHF(mol).run(conv_tol=1e-13)
print('pyscf E', mf.e_tot, 'engine E', e['E'])
print('pyscf eps', ' '.join('%.6f'%x for x in mf.mo_energy))
print('engine eps', ' '.join('%.6f'%x for x in e['eps']))
# feed the ENGINE integrals to a numpy RHF with explicit aufbau, to separate integrals from the SCF
S = np.array(e['S']).reshape(n,n); h = np.array(e['T']).reshape(n,n)+np.array(e['V']).reshape(n,n)
G = np.array(e['eri']).reshape(n,n,n,n)
w,U = np.linalg.eigh(S); X = U@np.diag(w**-0.5)@U.T
D = np.zeros((n,n)); nocc = 7
for it in range(300):
    F = h + np.einsum('kl,ijkl->ij',D,G) - 0.5*np.einsum('kl,ilkj->ij',D,G)
    Ft = X.T@F@X; ev,C2 = np.linalg.eigh(Ft); C = X@C2
    Dn = 2*C[:,:nocc]@C[:,:nocc].T
    if np.abs(Dn-D).max() < 1e-13: D = Dn; break
    D = 0.5*Dn + 0.5*D if it < 40 else Dn
F = h + np.einsum('kl,ijkl->ij',D,G) - 0.5*np.einsum('kl,ilkj->ij',D,G)
E = 0.5*np.einsum('ij,ij->',D,h+F) + e['Enuc']
print('numpy RHF on ENGINE integrals: E =', '%.12f'%E)
print('  eps', ' '.join('%.6f'%x for x in ev))
