# research only: PySCF RHF/6-31+G* (cart=True) on the VENDORED BSE decimals and the library's own bohr geometries
import json, hashlib, numpy as np, pyscf
from pyscf import gto, scf
raw = open('6-31+gs-h-c-n-o-f.bse.json','rb').read(); rec = json.loads(raw)
SYM = {1:'H',6:'C',7:'N',8:'O',9:'F'}
def basis_of(z):
    out = []
    for sh in rec['elements'][str(z)]['electron_shells']:
        ex = [float(x) for x in sh['exponents']]
        for k, l in enumerate(sh['angular_momentum']):
            co = [float(c) for c in sh['coefficients'][k if len(sh['angular_momentum']) > 1 else 0]]
            out.append([l] + [[e, c] for e, c in zip(ex, co)])
    return out
res = []
for g in json.load(open('geoms-631.json')):
    mol = gto.M(atom=[[SYM[a[0]], a[1:]] for a in g['atoms']], unit='Bohr', charge=g['charge'], cart=True,
                basis={SYM[z]: basis_of(z) for z in {a[0] for a in g['atoms']}}, verbose=0)
    mf = scf.RHF(mol); mf.conv_tol = 1e-13; mf.conv_tol_grad = 1e-9; e = mf.kernel()
    res.append({'id': g['id'], 'nAO': int(mol.nao), 'energy': float(e), 'converged': bool(mf.converged), 'homo': float(mf.mo_energy[mol.nelectron//2-1]), 'lumo': float(mf.mo_energy[mol.nelectron//2])})
    print(g['id'], mol.nao, '%.12f' % e, mf.converged, flush=True)
json.dump({'provenance': {'pyscf': pyscf.__version__, 'numpy': np.__version__, 'bse_sha256': hashlib.sha256(raw).hexdigest(), 'cart': True, 'unit': 'bohr', 'written_by': 'research/molecular-waves-2026-09-18/basis/oracle-631.py'}, 'molecules': res}, open('oracle-631.json','w'), indent=1)
