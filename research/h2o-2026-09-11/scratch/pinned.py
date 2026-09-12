# pinned.py — the BSE STO-3G decimals as a PySCF basis dict, so PySCF and md.mjs share the primitives exactly.
import json, os
from pyscf import gto
SYM = {1:'H',3:'Li',4:'Be',5:'B',6:'C',7:'N',8:'O',9:'F'}
_bse = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'sto-3g.bse.json')))
def pinned_basis(zs):
    out = {}
    for z in zs:
        rec, shells = _bse['elements'][str(z)], []
        for sh in rec['electron_shells']:
            e = [float(x) for x in sh['exponents']]
            for col, l in enumerate(sh['angular_momentum']):
                c = [float(x) for x in sh['coefficients'][col]]
                shells.append([l] + [[e[i], c[i]] for i in range(len(e))])
        out[SYM[z]] = shells
    return out
def mol_from(atoms, **kw):
    """atoms = [{'Z':int,'c':[x,y,z] in bohr}] -> Mole with the pinned basis and the identical coordinates."""
    spec = [[SYM[a['Z']], tuple(a['c'])] for a in atoms]
    return gto.M(atom=spec, unit='Bohr', basis=pinned_basis(sorted({a['Z'] for a in atoms})), verbose=0, **kw)
