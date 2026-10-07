#!/usr/bin/env python
"""tools/symmetry/pyscf-symm-oracle.py — the INDEPENDENT oracle for unique-quartets.mjs.

PySCF's own symmetry machinery on the library's geometries (lab/molecules.js, ångström, copied here by value): the
point group it detects (topgroup), the Abelian subgroup it actually computes in (groupname — D2h for benzene, the
largest REAL Abelian subgroup), the symmetry-adapted block sizes (mol.symm_orb), the RHF/STO-3G energy and the
occupied orbitals per irrep.  Nothing here reads or edits lab/.

    ~/bin/scipython -I tools/symmetry/pyscf-symm-oracle.py > research/release-0.4.0/measure/pyscf-symm-oracle.json
"""
import json
import math
import os
import sys

import pyscf
from pyscf import gto, scf, symm

# THE BASIS IS THE VENDORED RECORD'S DECIMALS, never PySCF's internal STO-3G table (research/h2o-2026-09-11/scratch/
# fix-molecules.py's pinned_basis, copied): on these geometries PySCF's own table lands 2e-8 Eh away from the engine,
# the record's decimals within 1e-11.  Read-only on lab/.
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
REC = json.load(open(os.path.join(ROOT, "lab", "vendor", "bse", "sto-3g-v1.json")))
SYM = {1: "H", 6: "C", 8: "O"}


def pinned_basis(zs):
    out = {}
    for z in zs:
        shells = []
        for sh in REC["elements"][str(z)]["electron_shells"]:
            e = [float(x) for x in sh["exponents"]]
            for col, l in enumerate(sh["angular_momentum"]):
                c = [float(x) for x in sh["coefficients"][col]]
                shells.append([l] + [[e[i], c[i]] for i in range(len(e))])
        out[SYM[z]] = shells
    return out

# lab/molecules.js: BENZENE = carbons at k·60° on radius 1.39 Å, hydrogens at 2.48 Å (CCCBDB r(C–C) = 1.39, r(C–H) = 1.09)
BENZENE = []
for k in range(6):
    t = k * math.pi / 3
    BENZENE.append((6, 1.39 * math.cos(t), 1.39 * math.sin(t), 0.0))
    BENZENE.append((1, 2.48 * math.cos(t), 2.48 * math.sin(t), 0.0))
# lab/molecules.js: H2O — CCCBDB r(O–H) = 0.9578 Å, ∠HOH = 104.5° (the window's original preset)
WATER = [(8, 0.0, 0.0, 0.1173), (1, 0.0, 0.7572, -0.4692), (1, 0.0, -0.7572, -0.4692)]


def run(atoms):
    zs = sorted({Z for Z, *_ in atoms})
    mol = gto.M(atom=[(SYM[Z], (x, y, z)) for Z, x, y, z in atoms], basis=pinned_basis(zs), cart=True, symmetry=True,
                unit="Angstrom", verbose=0)
    mf = scf.RHF(mol).run(conv_tol=1e-13, conv_tol_grad=1e-10)
    orbsym = list(symm.label_orb_symm(mol, mol.irrep_name, mol.symm_orb, mf.mo_coeff))
    nocc = mol.nelectron // 2
    occ = {}
    for s in orbsym[:nocc]:
        occ[s] = occ.get(s, 0) + 1
    return {
        "pyscf": pyscf.__version__,
        "basis": "the vendored lab/vendor/bse/sto-3g-v1.json decimals (pinned_basis), cart=True",
        "topgroup": mol.topgroup,
        "groupname": mol.groupname,
        "nao": int(mol.nao),
        "nocc": nocc,
        "irreps": list(mol.irrep_name),
        "blockSizes": {name: int(o.shape[1]) for name, o in zip(mol.irrep_name, mol.symm_orb)},
        "energy": float(mf.e_tot),
        "converged": bool(mf.converged),
        "occupiedPerIrrep": occ,
        "orbsym": orbsym,
        "mo_energy": [float(e) for e in mf.mo_energy],
    }


out = {"C6H6": run(BENZENE), "H2O": run(WATER)}
json.dump(out, sys.stdout, indent=1)
sys.stdout.write("\n")
