#!/usr/bin/env python
"""tools/library/rks-oracle.py — THE RKS LDA ORACLE (0.7.3 K1).

PySCF RKS xc='lda,vwn' (Slater + VWN5: libxc id 7, LDA_C_VWN — not VWN_RPA, id 8, which PySCF's own alias 'VWN3' names) on the app's own
atoms (bohr, read from lab/molecules.js through node — never retyped), the vendored STO-3G decimals (never PySCF's internal table),
cart=True, on the grid lab/dft-grid.js builds: 75 Treutler-Ahlrichs M4 radial points (the per-element xi of JCP 102, 346 — PySCF's
default) x 302 Lebedev points per atom, unpruned, Becke 1988 partition with no atomic-size adjustment.  E, E_xc, the grid's integral of
rho; PySCF's point count printed beside ours.  It decides nothing: tests/rks.test.mjs holds the app against this file.

    ~/bin/scipython -I tools/library/rks-oracle.py            (writes tests/fixtures/oracles/rks-v1.json)
"""
import hashlib
import json
import os
import subprocess

import numpy as np
import pyscf
from pyscf import gto, dft
from pyscf.dft import libxc, gen_grid, radi

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
BASIS_FILE = os.path.join(ROOT, "lab", "vendor", "bse", "sto-3g-v1.json")
OUT = os.path.join(ROOT, "tests", "fixtures", "oracles", "rks-v1.json")
REC = json.load(open(BASIS_FILE))
ELEMENT = ["X", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar"]
IDS = ["H2O", "C6H6", "N2", "CH4", "NH3", "HF", "CO2", "C2H4"]
assert libxc.parse_xc("lda,vwn")[1] == ((1, 1), (7, 1)), libxc.parse_xc("lda,vwn")   # Slater (1) + LDA_C_VWN (7) = VWN5


def pinned(zs):
    out = {}
    for z in zs:
        shells = []
        for sh in REC["elements"][str(z)]["electron_shells"]:
            e = [float(x) for x in sh["exponents"]]
            for col, l in enumerate(sh["angular_momentum"]):
                shells.append([l] + [[e[i], float(sh["coefficients"][col][i])] for i in range(len(e))])
        out[ELEMENT[z]] = shells
    return out


JS = """
const M = await import(process.argv[1] + '/lab/molecules.js'), G = await import(process.argv[1] + '/lab/dft-grid.js');
const ids = JSON.parse(process.argv[2]);
console.log(JSON.stringify(ids.map((id) => { const atoms = M.moleculeAtoms(id), t = performance.now(), g = G.molecularGrid(atoms);
  return { id, atoms, ours: g.w.length, ms: performance.now() - t }; })));
"""
app = json.loads(subprocess.run(["node", "--input-type=module", "-e", JS, ROOT, json.dumps(IDS)], capture_output=True, text=True, check=True).stdout)

rows = {}
for r in app:
    atoms = r["atoms"]
    mol = gto.M(atom=[(ELEMENT[a["Z"]], (a["x"], a["y"], a["z"])) for a in atoms], unit="Bohr", basis=pinned(sorted({a["Z"] for a in atoms})),
                cart=True, symmetry=False, verbose=0)
    mf = dft.RKS(mol)
    mf.xc = "lda,vwn"
    mf.grids.atom_grid = (75, 302)
    mf.grids.radi_method = radi.treutler
    mf.grids.becke_scheme = gen_grid.original_becke
    mf.grids.radii_adjust = None
    mf.grids.prune = None
    mf.conv_tol, mf.conv_tol_grad, mf.max_cycle = 1e-13, 1e-8, 300
    mf.kernel()
    w = mf.grids.weights
    rho = dft.numint.NumInt().get_rho(mol, mf.make_rdm1(), mf.grids)
    row = {"atoms": atoms, "energy": float(mf.e_tot), "exc": float(mf.scf_summary["exc"]), "intRho": float(np.dot(w, rho)),
           "nElectrons": int(mol.nelectron), "nao": int(mol.nao), "converged": bool(mf.converged),
           "pyscfPoints": int(w.size), "pyscfNonzero": int(np.count_nonzero(w)), "ourPoints": r["ours"], "ourGridMs": round(r["ms"], 2)}
    rows[r["id"]] = row
    print(f"{r['id']:5s} E {row['energy']:.12f}  Exc {row['exc']:.10f}  int rho {row['intRho']:.8f} / {row['nElectrons']}  "
          f"grid PySCF {row['pyscfPoints']} ({row['pyscfNonzero']} nonzero) ours {r['ours']} ({r['ms']:.1f} ms)  conv {mf.converged}")

out = {"provenance": {"written_by": "tools/library/rks-oracle.py", "pyscf": pyscf.__version__, "numpy": np.__version__, "method": "RKS",
                      "xc": "lda,vwn (Slater + VWN5: libxc LDA_X + LDA_C_VWN)", "cart": True, "unit": "bohr",
                      "grid": "atom_grid (75, 302), radi.treutler (ATOM_SPECIFIC_TREUTLER_GRIDS = %s), original_becke, radii_adjust None, prune None"
                              % radi.ATOM_SPECIFIC_TREUTLER_GRIDS,
                      "basis": "lab/vendor/bse/sto-3g-v1.json", "bse_sha256": hashlib.sha256(open(BASIS_FILE, "rb").read()).hexdigest(),
                      "conv_tol": 1e-13, "conv_tol_grad": 1e-8, "guess": "minao (PySCF's default)"},
       "molecules": rows}
json.dump(out, open(OUT, "w"), indent=1)
open(OUT, "a").write("\n")
print("wrote", os.path.relpath(OUT, ROOT))
