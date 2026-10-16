#!/usr/bin/env python
"""tools/library/lebedev-302.py — writes lab/lebedev-302.json: the 302-point Lebedev–Laikov set (order 29; V. I. Lebedev and D. N. Laikov,
Doklady Mathematics 59, 477 (1999)), x y z w per point with the weights summing to 1, read from PySCF's own table (pyscf.dft.LebedevGrid,
the transcription of Laikov's C code PySCF's grids use) — so the app's angular grid is the oracle's to the last digit.

    ~/bin/scipython -I tools/library/lebedev-302.py
"""
import json
import os

import numpy as np
import pyscf
from pyscf.dft.LebedevGrid import MakeAngularGrid

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
g = MakeAngularGrid(302)
assert g.shape == (302, 4) and abs(g[:, 3].sum() - 1) < 1e-14 and np.abs((g[:, :3] ** 2).sum(1) - 1).max() < 1e-15
out = {"source": "Lebedev & Laikov 1999, the 302-point set (order 29), from pyscf.dft.LebedevGrid (PySCF %s) by tools/library/lebedev-302.py" % pyscf.__version__,
       "xyzw": [float(v) for v in g.ravel()]}
with open(os.path.join(ROOT, "lab", "lebedev-302.json"), "w") as f:
    json.dump(out, f, separators=(",", ":"))
    f.write("\n")
print("wrote lab/lebedev-302.json")
