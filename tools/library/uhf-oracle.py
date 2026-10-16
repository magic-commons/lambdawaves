#!/usr/bin/env python
"""tools/library/uhf-oracle.py — THE UHF ORACLE OF THE OPEN SHELLS (0.7.1 U1).

PySCF UHF on the app's own atoms (bohr, read from lab/molecules.js moleculeAtoms through node — never retyped), the vendored
STO-3G decimals (never PySCF's internal table), cart=True.  For each open shell of the catalogue: E, <S^2>, n_alpha/n_beta,
from four PySCF guesses (minao, atom, 1e, huckel), each followed down by PySCF's own internal stability analysis to a minimum
of the UHF energy (and finished by its second-order solver where DIIS stalls) — the lowest of them.  For H2 at 1.4 / 3.0 / 5.0 bohr and 0.74 / 3.00 angstrom: the singlet from the fully localised seed (alpha on one
atom, beta on the other: sigma_g +/- sigma_u of the core orbitals), so past the Coulson-Fischer point the answer is the
spin-broken minimum and before it the RHF point.  NOT the app's own seed (lab/scf.js uhf's `mix`, tan theta = 0.1): an
independent road to the same unique minimum.  (Found here: from the tan 0.1 seed PySCF's DIIS lands on the RHF SADDLE at
3.0 bohr, and its internal stability check calls that stable — so the seed is not the app's.)  It decides nothing: tests/uhf.test.mjs holds the app against this file.

    ~/bin/scipython -I tools/library/uhf-oracle.py            (writes tests/fixtures/oracles/uhf-v1.json)
"""
import hashlib
import json
import os
import subprocess

import numpy as np
import scipy.linalg
import pyscf
from pyscf import gto, scf

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
BASIS_FILE = os.path.join(ROOT, "lab", "vendor", "bse", "sto-3g-v1.json")
OUT = os.path.join(ROOT, "tests", "fixtures", "oracles", "uhf-v1.json")
REC = json.load(open(BASIS_FILE))
ELEMENT = ["X", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar"]
ANG = 1 / 0.52917721092   # lab/md.js ANGSTROM (PySCF CODATA), checked below against the app's own


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


def mole(atoms, charge, spin):
    return gto.M(atom=[(ELEMENT[a["Z"]], (a["x"], a["y"], a["z"])) for a in atoms], unit="Bohr", basis=pinned(sorted({a["Z"] for a in atoms})),
                 cart=True, charge=charge, spin=spin, symmetry=False, verbose=0)


JS = """
const M = await import(process.argv[1] + '/lab/molecules.js'), md = await import(process.argv[1] + '/lab/md.js');
const ids = M.MOLECULES.filter((m) => m.multiplicity > 1).map((m) => m.id);
console.log(JSON.stringify({ ANGSTROM: md.ANGSTROM, rows: ids.map((id) => { const m = M.MOLECULE_BY_ID.get(id);
  return { id, charge: m.charge, multiplicity: m.multiplicity, term: m.term, atoms: M.moleculeAtoms(id) }; }) }));
"""
app = json.loads(subprocess.run(["node", "--input-type=module", "-e", JS, ROOT], capture_output=True, text=True, check=True).stdout)
assert abs(app["ANGSTROM"] - ANG) < 1e-12, app["ANGSTROM"]


def solve(mol, dm0=None, guess="minao"):
    mf = scf.UHF(mol)
    mf.conv_tol, mf.conv_tol_grad, mf.max_cycle, mf.init_guess = 1e-13, 1e-7, 500, guess   # grad 1e-9 is out of reach on NO₂ (a flat mode: all four roads agree on E to 5e-13 and stop there)
    mf.kernel(dm0)
    stable = False
    for _ in range(8):                                   # converge (the second-order solver where DIIS stalls), then follow the instability down
        if not mf.converged:
            nf = mf.newton()
            nf.conv_tol, nf.conv_tol_grad = 1e-13, 1e-7
            nf.kernel(mf.mo_coeff, mf.mo_occ)
            mf = nf
        mo, _, stable, _ = mf.stability(internal=True, external=False, return_status=True)
        if stable:
            break
        dm = mf.make_rdm1(mo, mf.mo_occ)
        mf = scf.UHF(mol)
        mf.conv_tol, mf.conv_tol_grad, mf.max_cycle = 1e-13, 1e-7, 500
        mf.kernel(dm)
    return mf, stable


def lowest(mol):
    """THE ROAD IS NOT UNIQUE: one PySCF run once landed NO 6 mEh up (stable by its own test).  Four guesses, each followed
    down; the lowest converged stable minimum is the oracle."""
    found = [solve(mol, None, g) for g in ("minao", "atom", "1e", "huckel")]
    return min((f for f in found if f[0].converged and f[1]), key=lambda f: f[0].e_tot)


def row_of(mf, mol, stable, extra):
    na, nb = mol.nelec
    return {**extra, "energy": float(mf.e_tot), "s2": float(mf.spin_square()[0]), "nAlpha": int(na), "nBeta": int(nb),
            "nao": int(mol.nao), "converged": bool(mf.converged), "stable": bool(stable)}


rows = {}
for r in app["rows"]:
    mol = mole(r["atoms"], r["charge"], r["multiplicity"] - 1)
    mf, stable = lowest(mol)
    rows[r["id"]] = row_of(mf, mol, stable, {"term": r["term"], "multiplicity": r["multiplicity"], "charge": r["charge"], "atoms": r["atoms"]})
    print(f"{r['id']:4s} {r['term']:5s} E {mf.e_tot:.12f}  <S2> {rows[r['id']]['s2']:.8f}  stable {stable}")

h2 = {}
for label, R in [("1.4", 1.4), ("3.0", 3.0), ("5.0", 5.0), ("0.74A", 0.74 * ANG), ("3.00A", 3.00 * ANG)]:
    atoms = [{"Z": 1, "x": 0.0, "y": 0.0, "z": -R / 2}, {"Z": 1, "x": 0.0, "y": 0.0, "z": R / 2}]
    mol = mole(atoms, 0, 0)
    e, c = scipy.linalg.eigh(mol.intor("int1e_kin") + mol.intor("int1e_nuc"), mol.intor("int1e_ovlp"))
    ca, cb = (c[:, 0] + c[:, 1]) / np.sqrt(2), (c[:, 0] - c[:, 1]) / np.sqrt(2)      # alpha on one atom, beta on the other
    dm0 = np.array([np.outer(ca, ca), np.outer(cb, cb)])
    mf, stable = solve(mol, dm0)
    h2[label] = row_of(mf, mol, stable, {"R": R, "atoms": atoms})
    print(f"H2 {label:6s} R {R:.6f} E {mf.e_tot:.12f}  <S2> {h2[label]['s2']:.8f}  stable {stable}")

out = {"provenance": {"written_by": "tools/library/uhf-oracle.py", "pyscf": pyscf.__version__, "method": "UHF", "cart": True, "unit": "bohr",
                      "basis": "lab/vendor/bse/sto-3g-v1.json", "bse_sha256": hashlib.sha256(open(BASIS_FILE, "rb").read()).hexdigest(),
                      "conv_tol": 1e-13, "conv_tol_grad": 1e-7, "guess": "the lowest of minao, atom, 1e and huckel, each followed by the internal stability analysis to a minimum; H2 from the core "
                      "orbitals, alpha on one atom and beta on the other"},
       "molecules": rows, "h2": h2}
json.dump(out, open(OUT, "w"), indent=1)
open(OUT, "a").write("\n")
print("wrote", os.path.relpath(OUT, ROOT))
