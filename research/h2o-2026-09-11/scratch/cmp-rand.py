# cmp-rand.py — the ten random s/p systems of rand-quartets.mjs against PySCF, per-atom custom shells.
import json, numpy as np
from pyscf import gto
cases = json.load(open('rand-quartets.json'))
worst = {k: 0.0 for k in ['S','T','V','Mx','My','Mz','eri','Enuc']}
for ci, c in enumerate(cases):
    labels = [f'H{i+1}' for i in range(4)]
    atom = [[labels[i], tuple(c['atoms'][i]['c'])] for i in range(4)]
    basis = {labels[i]: [[c['specs'][i]['l']] + [[c['specs'][i]['exps'][k], c['specs'][i]['coefs'][k]]
             for k in range(len(c['specs'][i]['exps']))]] for i in range(4)}
    mol = gto.M(atom=atom, unit='Bohr', basis=basis, spin=None, verbose=0)
    n = c['n']; assert mol.nao_nr() == n, (mol.nao_nr(), n)
    r = mol.intor('int1e_r').reshape(3, n, n)
    d = {'S': mol.intor('int1e_ovlp'), 'T': mol.intor('int1e_kin'), 'V': mol.intor('int1e_nuc'),
         'Mx': r[0], 'My': r[1], 'Mz': r[2], 'eri': mol.intor('int2e')}
    row = []
    for k, ref in d.items():
        e = float(np.max(np.abs(np.asarray(c[k]).reshape(ref.shape) - ref))); worst[k] = max(worst[k], e); row.append(f'{k}{e:.1e}')
    e = abs(c['Enuc'] - mol.energy_nuc()); worst['Enuc'] = max(worst['Enuc'], e)
    print(f'  case {ci}: n={n} ' + ' '.join(row) + f' sym={c["sym"]:.1e}')
print('  WORST over 10 cases: ' + ' '.join(f'{k}={v:.3e}' for k, v in worst.items()))
json.dump(worst, open('cmp-rand.json','w'), indent=1)
