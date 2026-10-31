#!/usr/bin/env python
"""tools/perf/c60-voxels.py - 0.4.0 S4c: PySCF's own C60 frontier orbitals at the CENTRES of 256 voxels of the lab's 96^3 grid.

The browser half (tools/perf/s4c-kernel.mjs, section c60) draws the library record's HOMO and LUMO sets through the field's
orbital-only kernel and reads the same voxels back, so the GPU texel is compared with an orbital the app never evaluated:
libcint's GTOval_cart on the dump's coefficients mapped back into PySCF's AO order (tools/library/field-check.py's mapping).
The grid is the worker's: half = max |coordinate| (bohr) + 6, voxel centre = (i + 0.5) / N * 2 half - half.
Run: ~/bin/scipython -I tools/perf/c60-voxels.py   (writes research/release-0.4.0/measure/c60-voxels-pyscf.json)
"""
import json
from pathlib import Path
import numpy as np
from pyscf import gto, lib

ROOT = Path(__file__).resolve().parents[2]
lib.num_threads(2)
front = json.loads((ROOT / 'tools/library/census/c60-frontier.json').read_text())
rec = json.loads((ROOT / 'lab/vendor/bse/sto-3g-v1.json').read_text())
basis = [[l] + [[float(e), float(sh['coefficients'][col][k])] for k, e in enumerate(sh['exponents'])]
         for sh in rec['elements']['6']['electron_shells'] for col, l in enumerate(sh['angular_momentum'])]
mol = gto.M(atom=[('C', tuple(a[1:])) for a in front['geometry']['atomsAngstrom']], basis={'C': basis}, unit='Angstrom', cart=True, verbose=0)
perm = np.array(front['aoConversion']['permutationAppToPySCF'])
scale = np.array(front['aoConversion']['rowScalePySCFToApp'])
C = np.array(front['frontier']['HOMO']['coefficientColumns'] + front['frontier']['LUMO']['coefficientColumns']).T
CP = np.zeros_like(C)
CP[perm] = C / scale[:, None]
N = 96
xyz = mol.atom_coords()                                          # bohr, PySCF's own conversion (0.52917721092, the app's ANGSTROM)
half = float(np.max(np.abs(xyz))) + 6.0
rng = np.random.default_rng(4096)
vox = []
for k in range(256):
    if k % 2 == 0:                                               # near a nucleus, where the orbital is large
        a = xyz[rng.integers(len(xyz))]
        vox.append([int(min(N - 1, max(0, round((q + half) / (2 * half) * N - 0.5 + rng.uniform(-2, 2))))) for q in a])
    else:
        vox.append([int(v) for v in rng.integers(0, N, 3)])
pts = (np.array(vox, dtype=float) + 0.5) / N * 2 * half - half
values = mol.eval_gto('GTOval_cart', pts) @ CP
out = {'status': 'MEASURED', 'meaning': 'PySCF (libcint GTOval_cart) signed frontier orbitals at the centres of 256 voxels of the 96^3 grid; voxels and the grid DERIVED, values MEASURED',
       'N': N, 'half': half, 'voxels': vox, 'orbitalIndices': front['frontier']['HOMO']['indices'] + front['frontier']['LUMO']['indices'],
       'values': values.tolist(), 'source': 'tools/library/census/c60-frontier.json coefficients mapped back into PySCF order; no fresh SCF'}
(ROOT / 'research/release-0.4.0/measure/c60-voxels-pyscf.json').write_text(json.dumps(out, indent=1, allow_nan=False) + '\n')
print(json.dumps({'half': half, 'voxels': len(vox), 'maxAbs': float(np.max(np.abs(values)))}))
