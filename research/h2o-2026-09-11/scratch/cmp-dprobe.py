# cmp-dprobe.py — md.mjs (every Cartesian component unit-normalised) vs PySCF cart=True (shell-wide factor).
import json, numpy as np
from pyscf import gto
c = json.load(open('dprobe.json')); n = c['n']
labels = [f'H{i+1}' for i in range(3)]
atom = [[labels[i], tuple(c['atoms'][i]['c'])] for i in range(3)]
basis = {labels[i]: [[c['specs'][i]['l']] + [[c['specs'][i]['exps'][k], c['specs'][i]['coefs'][k]]
         for k in range(len(c['specs'][i]['exps']))]] for i in range(3)}
mol = gto.M(atom=atom, unit='Bohr', basis=basis, cart=True, spin=1, verbose=0)
print('  PySCF cart AO order:', ' | '.join(l.strip() for l in mol.ao_labels()))
Sp = mol.intor('int1e_ovlp'); Sm = np.asarray(c['S']).reshape(n, n)
print('  PySCF cart S diag :', ' '.join(f'{Sp[i,i]:.9f}' for i in range(n)))
print('  md.mjs      S diag:', ' '.join(f'{Sm[i,i]:.9f}' for i in range(n)))
f = np.sqrt(np.diag(Sp))                                                 # per-component rescale md -> PySCF cart
print('  ratio md/PySCF per component sqrt:', ' '.join(f'{1/x:.9f}' for x in f), '  (1/sqrt3 = %.9f)' % (1/np.sqrt(3)))
Dm = np.outer(f, f)
res = {}
res['S'] = float(np.max(np.abs(Sm*Dm - Sp))); res['T'] = float(np.max(np.abs(np.asarray(c['T']).reshape(n,n)*Dm - mol.intor('int1e_kin'))))
res['V'] = float(np.max(np.abs(np.asarray(c['V']).reshape(n,n)*Dm - mol.intor('int1e_nuc'))))
r = mol.intor('int1e_r').reshape(3,n,n)
for q,k in enumerate('xyz'): res['M'+k] = float(np.max(np.abs(np.asarray(c['M'+k]).reshape(n,n)*Dm - r[q])))
g = np.asarray(c['eri']).reshape(n,n,n,n)*np.einsum('i,j,k,l->ijkl', f,f,f,f)
res['eri'] = float(np.max(np.abs(g - mol.intor('int2e'))))
for k,v in res.items(): print(f'  after per-component rescale, max|Δ| {k:4s} = {v:.3e}')
print('  worst = %.3e' % max(res.values()))
