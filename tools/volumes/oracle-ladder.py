#!/usr/bin/env python
"""tools/volumes/oracle-ladder.py — THE BASIS LADDER'S ORACLE (iteration 004 V1): PySCF RHF on the vendored decimals, cart=True,
at the app's own atoms (tools/volumes/app-atoms.mjs), for the rows tests/basis-ladder.test.mjs checks the app's RHF against.
  ~/.local/share/lw-volumes/venv/bin/python tools/volumes/oracle-ladder.py     → tests/fixtures/oracles/basis-ladder-v1.json
"""
import json, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pyscf, numpy
from pyscf import gto, scf, lib
from lwbasis import ROOT, record, coverage, pyscf_basis, SYMBOL
# THE WHOLE AO SPACE, as lab/md.js keeps it: PySCF 2.14 drops overlap eigenvectors below 1e-6 by default (canonical orthogonalisation),
# and STO-6G's spd shell on Ga–Kr (the Cartesian d's r² component nearly duplicates the 3s: S's smallest eigenvalue 8.5e-7 in HBr)
# then solves a SMALLER space — 17–57 mEh above the app's.  With every AO kept the two agree to 1e-11.
scf.hf.remove_overlap_zero_eigenvalue = False

# (molecule, bases): every element kind the five new records bring — H, N, O; Cl (3rd row, now in 6-31+G*); Br (STO-6G's spd
# shell, 6-31G*'s d on a 4th-row atom); Zn (the 3d block's d shell in 3-21G and 6-31G).  Kept to what the app solves in ~8 s.
ROWS = [('H2O', ['sto-6g', '3-21g', '6-31g', '6-31g-star']), ('NH3', ['sto-6g', '3-21g', '6-31g', '6-31g-star']),
        ('HCl', ['sto-6g', '3-21g', '6-31g', '6-31g-star', '6-31+g-star']), ('HBr', ['sto-6g', '6-31g-star']),
        ('ZnH2', ['3-21g', '6-31g'])]
lib.num_threads(4)
apps = {m['id']: m for m in json.loads(subprocess.run(['node', str(ROOT / 'tools/volumes/app-atoms.mjs'), *[r[0] for r in ROWS]],
                                                     check=True, capture_output=True, text=True).stdout)['molecules']}
out = {'provenance': {'written_by': 'tools/volumes/oracle-ladder.py', 'pyscf': pyscf.__version__, 'numpy': numpy.__version__, 'cart': True,
                      'unit': 'bohr', 'method': 'RHF, conv_tol 1e-12, conv_tol_grad 1e-9, minao guess, no symmetry, every AO kept (scf.hf.remove_overlap_zero_eigenvalue = False)',
                      'geometry': 'tools/volumes/app-atoms.mjs: lab/molecules.js moleculeAtoms, the app\'s pinned atoms',
                      'bases': {}}, 'molecules': []}
for mid, bases in ROWS:
    m = apps[mid]; zs = [a[0] for a in m['atomsBohr']]
    for b in bases:
        rec, sha, file = record(b)
        assert coverage(rec, zs) is None, (mid, b, coverage(rec, zs))
        out['provenance']['bases'][b] = {'file': file, 'sha256': sha}
        mol = gto.M(atom=[(SYMBOL[z], (x, y, w)) for z, x, y, w in m['atomsBohr']], unit='Bohr', basis=pyscf_basis(rec, zs), cart=True,
                    charge=m['charge'], spin=0, verbose=0, max_memory=2000)
        mf = scf.RHF(mol); mf.conv_tol = 1e-12; mf.conv_tol_grad = 1e-9; mf.max_cycle = 300; mf.kernel()
        if not mf.converged:
            mf = scf.RHF(mol).newton(); mf.conv_tol = 1e-12; mf.conv_tol_grad = 1e-9; mf.kernel()
        assert mf.converged, (mid, b)
        out['molecules'].append({'id': mid, 'basis': b, 'nAO': mol.nao_nr(), 'energy': float(mf.e_tot), 'converged': bool(mf.converged),
                                 'atoms': m['atomsBohr']})
        print(f'{mid:6s} {b:12s} {mol.nao_nr():3d} {mf.e_tot:.12f}', flush=True)
(ROOT / 'tests/fixtures/oracles/basis-ladder-v1.json').write_text(json.dumps(out, indent=1) + '\n')
print('wrote tests/fixtures/oracles/basis-ladder-v1.json')
