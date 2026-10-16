#!/usr/bin/env python
"""tools/library/vibrate-oracle.py — THE NORMAL MODES' ORACLE (0.7.0 V1 THE MODES).

PySCF on the app's own atoms (bohr, lab/molecules.js moleculeAtoms, written by the generator), the vendored STO-3G decimals,
cart=True, RHF → the analytic Hessian (mf.Hessian().kernel()) → pyscf.hessian.thermo.harmonic_analysis with translations and
rotations projected out.  NO geometry is optimised: the Hessian is taken at the record's own geometry, which is what "as
computed" means; the gradient's norm there is recorded so the note can say how far from a stationary point it is.
It writes per molecule: the energy, the isotope-averaged masses (amu) it used, ν̃ₖ (cm⁻¹, a negative number is an imaginary
mode), and the Cartesian mode vectors norm_mode (PySCF's M^-1/2 e, N × 3 each) — the generator normalises them to |L| = 1 bohr.

    node tools/vibrate-library.mjs --inputs .tmp/vib-inputs.json
    ~/bin/scipython -I tools/library/vibrate-oracle.py .tmp/vib-inputs.json --fixture tests/fixtures/oracles/vibrate-v1.json [--only a,b]

A --fixture write MERGES by id (record-oracle.py's shape).  Nothing in lab/ is read except the vendored basis record.
"""
import argparse
import hashlib
import json
import os
import time

import numpy as np
import pyscf
from pyscf import gto, scf, lib
from pyscf.data import nist
from pyscf.hessian import thermo

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
BASIS_FILE = os.path.join(ROOT, "lab", "vendor", "bse", "sto-3g-v1.json")
REC = json.load(open(BASIS_FILE))
ELEMENT = ["X", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
           "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr"]

ap = argparse.ArgumentParser()
ap.add_argument("inputs")
ap.add_argument("--fixture", required=True)
ap.add_argument("--only", default=None)
ap.add_argument("--threads", type=int, default=4)
args = ap.parse_args()
lib.num_threads(args.threads)


def pinned(zs):
    out = {}
    for z in zs:
        shells = []
        for sh in REC["elements"][str(z)]["electron_shells"]:
            e = [float(x) for x in sh["exponents"]]
            for col, l in enumerate(sh["angular_momentum"]):
                c = [float(x) for x in sh["coefficients"][col]]
                shells.append([l] + [[e[i], c[i]] for i in range(len(e))])
        out[ELEMENT[z]] = shells
    return out


rows = json.load(open(args.inputs))["rows"]
only = set(args.only.split(",")) if args.only else None
fixture = json.load(open(args.fixture)) if os.path.exists(args.fixture) else {"molecules": {}}
for row in rows:
    if only and row["id"] not in only:
        continue
    t0 = time.perf_counter()
    atoms = row["atoms"]
    mol = gto.M(atom=[(ELEMENT[a[0]], (a[1], a[2], a[3])) for a in atoms], unit="Bohr", basis=pinned(sorted({a[0] for a in atoms})),
                cart=True, charge=row["charge"], spin=0, symmetry=False, verbose=0, max_memory=6000)
    mf = scf.RHF(mol)
    mf.conv_tol, mf.conv_tol_grad, mf.max_cycle = 1e-13, 1e-10, 200
    e = mf.kernel()
    grad = mf.nuc_grad_method().kernel()
    hess = mf.Hessian().kernel()
    mass = mol.atom_mass_list(isotope_avg=True)
    ha = thermo.harmonic_analysis(mol, hess, exclude_trans=True, exclude_rot=True, imaginary_freq=False)
    wall = time.perf_counter() - t0
    out = {"energy": float(e), "converged": bool(mf.converged), "nao": int(mol.nao_nr()), "key": row["key"],
           "gradientMax": float(np.abs(grad).max()), "mass": [float(m) for m in mass],
           "omega": [float(w) for w in ha["freq_wavenumber"]],
           "modes": [np.asarray(v).ravel().tolist() for v in ha["norm_mode"]],
           "wallSeconds": round(wall, 3)}
    fixture["molecules"][row["id"]] = out
    print(f"{row['id']:<8} {out['nao']:>3} AO  E {e:.12f}  |g|max {out['gradientMax']:.2e}  ν̃ " +
          " ".join(f"{w:.1f}" for w in out["omega"]) + f"  {wall:.1f} s", flush=True)
fixture["provenance"] = {"tool": "tools/library/vibrate-oracle.py", "pyscf": pyscf.__version__, "numpy": np.__version__,
                         "basis": "lab/vendor/bse/sto-3g-v1.json", "basisSha256": hashlib.sha256(open(BASIS_FILE, "rb").read()).hexdigest(),
                         "cart": True, "unit": "Bohr (the app's own atoms, unoptimised)",
                         "method": "RHF conv_tol 1e-13; analytic Hessian; thermo.harmonic_analysis(exclude_trans, exclude_rot); masses atom_mass_list(isotope_avg=True) in amu",
                         "constants": {"hartree2wavenumber": nist.HARTREE2WAVENUMBER, "amu2au": nist.ATOMIC_MASS / nist.E_MASS},
                         "status": "MEASURED on this machine; wallSeconds is a clock"}
fixture["molecules"] = dict(sorted(fixture["molecules"].items()))
with open(args.fixture, "w") as f:
    json.dump(fixture, f, indent=1)
    f.write("\n")
