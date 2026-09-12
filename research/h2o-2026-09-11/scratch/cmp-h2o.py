# cmp-h2o.py — every H2O STO-3G integral class from md.mjs against PySCF on the pinned BSE primitives.
import json, numpy as np
from pinned import mol_from
d = json.load(open('md-h2o.json')); n = d['n']
mol = mol_from(d['atoms'])
assert mol.nao_nr() == n
print('PySCF AO order:', ' | '.join(l.strip() for l in mol.ao_labels()))
def mx(a, b): return float(np.max(np.abs(np.asarray(a).reshape(b.shape) - b)))
res = {}
res['S'] = mx(d['S'], mol.intor('int1e_ovlp')); res['T'] = mx(d['T'], mol.intor('int1e_kin'))
res['V'] = mx(d['V'], mol.intor('int1e_nuc'))
r = mol.intor('int1e_r').reshape(3, n, n)
for q, k in enumerate('xyz'): res['M'+k] = mx(d['M'+k], r[q])
res['eri'] = mx(d['eri'], mol.intor('int2e')); res['Enuc'] = abs(d['Enuc'] - mol.energy_nuc())
for k, v in res.items(): print(f'  max|Δ| {k:5s} = {v:.3e}')
print('  worst overall = %.3e' % max(res.values()))
print('  scale: |S|max %.4f |T|max %.4f |V|max %.4f |M|max %.4f |eri|max %.4f' % (
  float(np.max(np.abs(mol.intor('int1e_ovlp')))), float(np.max(np.abs(mol.intor('int1e_kin')))),
  float(np.max(np.abs(mol.intor('int1e_nuc')))), float(np.max(np.abs(r))), float(np.max(np.abs(mol.intor('int2e'))))))
g = np.asarray(d['eri']).reshape(n,n,n,n); worst, which = 0.0, None
for pm in [(1,0,2,3),(0,1,3,2),(1,0,3,2),(2,3,0,1),(3,2,0,1),(2,3,1,0),(3,2,1,0)]:
    e = float(np.max(np.abs(g - g.transpose(pm))))
    if e > worst: worst, which = e, pm
print('  ERI 8-fold symmetry worst |Δ| = %.3e (perm %s), all 7 perms checked' % (worst, which))
# what the ledger's rounded ANG costs
from pyscf.data import nist
print('  ANG exact = %.16f ; ledger 1.8897261246 relative offset %.2e' % (1/nist.BOHR, (1.8897261246*nist.BOHR-1)))
json.dump(res, open('cmp-h2o.json','w'), indent=1)
