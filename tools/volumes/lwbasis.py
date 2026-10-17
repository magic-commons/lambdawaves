"""tools/volumes/lwbasis.py — the vendored basis records as PySCF reads them, and PySCF's AO order turned into the app's
(iteration 004 V1, the volume engine).  Shared by tools/volumes/solve.py and tools/volumes/oracle-ladder.py.

  BASIS_FILES        lab/rhf-molecule.js's own map (read from that file, so the two cannot drift), in ladder order
  record(name)       the vendored BSE JSON (lab/vendor/bse/<file>), its bytes' sha256
  coverage(rec, zs)  None when every element is in the record and every shell is l <= 2 (lab/md.js is l <= 2), else the reason
  pyscf_basis(rec, zs)  the PySCF basis dict from the record's own decimal strings — exactly tools/library/frontier.py basis():
                     an sp shell is split into its s and its p, each angular momentum takes its own coefficient row
  conversion(mol)    tools/library/frontier.py conversion(), verbatim: within each atom the shells stably sorted by l (lab/md.js
                     shellSpecs' order), components s; x,y,z; xx,xy,xz,yy,yz,zz; C_app[i] = R[i] * C_pyscf[ix[i]] with R = 1 on
                     s and p, sqrt(4 pi/5) on an axial d and sqrt(4 pi/15) on a mixed one (lab/md.js rdOf)
"""
import hashlib, json, math, re
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
_src = (ROOT / 'lab/rhf-molecule.js').read_text()
_m = re.search(r'export const BASIS_FILES = \{(.*?)\};', _src, re.S)
BASIS_FILES = dict(re.findall(r"'([^']+)':\s*'([^']+)'", _m.group(1)))
LADDER = list(BASIS_FILES)            # sto-3g, sto-6g, 3-21g, 6-31g, 6-31g-star, 6-31+g-star
SYMBOL = ['X', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
          'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr']
ANGSTROM = 1 / 0.52917721092          # bohr per angstrom: lab/md.js ANGSTROM, PySCF's CODATA
_cache = {}

def record(name):
    if name not in _cache:
        raw = (ROOT / 'lab/vendor/bse' / BASIS_FILES[name]).read_bytes()
        _cache[name] = (json.loads(raw), hashlib.sha256(raw).hexdigest(), 'lab/vendor/bse/' + BASIS_FILES[name])
    return _cache[name]

def coverage(rec, zs):
    for z in sorted(set(zs)):
        e = rec['elements'].get(str(z))
        if e is None:
            return f'{rec["name"]} defines no {SYMBOL[z]} (the record covers {",".join(SYMBOL[int(k)] for k in sorted(rec["elements"], key=int))})'
        if any(l > 2 for sh in e['electron_shells'] for l in sh['angular_momentum']):
            return f'{rec["name"]} gives {SYMBOL[z]} an f shell; the app (lab/md.js) is l <= 2'
    return None

def pyscf_basis(rec, zs):
    return {SYMBOL[z]: [[l] + [[float(e), float(sh['coefficients'][col][k])] for k, e in enumerate(sh['exponents'])]
                        for sh in rec['elements'][str(z)]['electron_shells'] for col, l in enumerate(sh['angular_momentum'])]
            for z in set(zs)}

def nao_cart(rec, zs):
    width = [1, 3, 6, 10]
    return sum(width[l] for z in zs for sh in rec['elements'][str(z)]['electron_shells'] for l in sh['angular_momentum'])

def conversion(mol):
    # Stable l sorting within each atom, then xx,xy,xz,yy,yz,zz.  (tools/library/frontier.py, verbatim.)
    loc = mol.ao_loc_nr(); ix = []; factors = []; descriptors = []
    labels = mol.ao_labels()
    for ia in range(mol.natm):
        shells = sorted([k for k in range(mol.nbas) if mol.bas_atom(k) == ia], key=mol.bas_angular)
        for k in shells:
            l = mol.bas_angular(k)
            if l > 2: raise ValueError('conversion: l > 2 has no app order')
            for j in range(loc[k], loc[k + 1]):
                ix.append(j); lab = labels[j].split()[-1]
                factors.append(1. if l < 2 else math.sqrt(4 * math.pi / (5 if lab.endswith(('xx', 'yy', 'zz')) else 15)))
                descriptors.append(labels[j])
    return np.array(ix), np.array(factors), descriptors
