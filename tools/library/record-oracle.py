#!/usr/bin/env python
"""tools/library/record-oracle.py — THE INDEPENDENT ORACLE OF A LIBRARY RECORD (0.4.0 S4b · PLAN F5, ledger C5).

PySCF on the record's own atoms (bohr, exactly the generator's), the vendored STO-3G decimals (never PySCF's internal table),
cart=True, RHF.  It answers three things and decides nothing:
  · the energy the generator holds the app's solve against (|ΔE| ≤ 1e-8 Eh or no record);
  · PySCF's own point-group detection (topgroup, and the Abelian groupname it would compute in) — RECORDED in the record,
    never used as a name (the names are the projection's: lab/names.js at generation, ledger SYNTHESIS §4 C5);
  · with --dump, PySCF's orbitals in the app's AO order and normalisation (md.js: per atom, l sorted, every Cartesian
    component at unit self-overlap) — tools/orbital-names.mjs --pyscf labels THEM by the same projection and holds the labels
    against the record's.

    node tools/orbital-library.mjs --inputs .tmp/lib-inputs.json            (the atoms, written by the generator)
    ~/bin/scipython -I tools/library/record-oracle.py .tmp/lib-inputs.json --fixture tests/fixtures/oracles/library-v1.json
    ~/bin/scipython -I tools/library/record-oracle.py .tmp/lib-inputs.json --dump .tmp/lib-pyscf.json [--only a,b]

A --fixture write MERGES: rows already there for other ids are kept, rows for these ids are replaced.  Nothing in lab/ is
read except the vendored basis record.
"""
import argparse
import hashlib
import json
import os
import sys
import time

import numpy as np
import pyscf
from pyscf import gto, scf, lib, symm

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
BASIS_FILE = os.path.join(ROOT, "lab", "vendor", "bse", "sto-3g-v1.json")
REC = json.load(open(BASIS_FILE))
ELEMENT = ["X", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
           "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr"]

ap = argparse.ArgumentParser()
ap.add_argument("inputs")
ap.add_argument("--fixture", default=None)
ap.add_argument("--dump", default=None)
ap.add_argument("--only", default=None)
ap.add_argument("--threads", type=int, default=4)
args = ap.parse_args()
lib.num_threads(args.threads)


def pinned(zs):
    out = {}
    for z in zs:
        if str(z) not in REC["elements"]:
            raise SystemExit(f"record-oracle: the vendored STO-3G has no Z={z} (it stops at Kr)")
        shells = []
        for sh in REC["elements"][str(z)]["electron_shells"]:
            e = [float(x) for x in sh["exponents"]]
            for col, l in enumerate(sh["angular_momentum"]):
                c = [float(x) for x in sh["coefficients"][col]]
                shells.append([l] + [[e[i], c[i]] for i in range(len(e))])
        out[ELEMENT[z]] = shells
    return out


def mole(atoms, charge, symmetry=False):
    zs = sorted({a[0] for a in atoms})
    return gto.M(atom=[(ELEMENT[a[0]], (a[1], a[2], a[3])) for a in atoms], unit="Bohr", basis=pinned(zs), cart=True,
                 charge=charge, spin=0, symmetry=symmetry, verbose=0, max_memory=6000)


def app_order(mol):
    """PySCF's AO index for each app AO (md.js shellSpecs: per atom, shells stably sorted by l; p x,y,z; d xx xy xz yy yz zz)"""
    loc = mol.ao_loc_nr()
    perm = []
    for ia in range(mol.natm):
        shells = [ib for ib in range(mol.nbas) if mol.bas_atom(ib) == ia]
        shells.sort(key=lambda ib: mol.bas_angular(ib))          # Python's sort is stable, as is md.js's
        for ib in shells:
            perm.extend(range(loc[ib], loc[ib + 1]))
    return np.array(perm)


rows = json.load(open(args.inputs))["rows"]
only = set(args.only.split(",")) if args.only else None
fixture = {"molecules": {}}
if args.fixture and os.path.exists(args.fixture):
    fixture = json.load(open(args.fixture))
dump = {}
for row in rows:
    if only and row["id"] not in only:
        continue
    t0 = time.perf_counter()
    mol = mole(row["atoms"], row["charge"])
    mf = scf.RHF(mol)
    mf.conv_tol, mf.conv_tol_grad, mf.max_cycle = 1e-13, 1e-10, 200
    e = mf.kernel()
    route = "DIIS"
    if not mf.converged:                                         # the second-order road, from where DIIS stopped
        mf = mf.newton()
        e = mf.kernel(mf.mo_coeff, mf.mo_occ)
        route = "DIIS then Newton"
    wall = time.perf_counter() - t0
    occ_irrep, top, grp = None, None, None
    try:
        msym = mole(row["atoms"], row["charge"], symmetry=True)
        top, grp = msym.topgroup, msym.groupname
        # PySCF's orbsym: its own symmetry-adapted SCF in the Abelian groupname (it may re-orient the molecule) — the occupied
        # count per irrep is RECORDED beside the projection's names and is never one of them (ledger C5)
        mfs = scf.RHF(msym)
        mfs.conv_tol, mfs.max_cycle = 1e-11, 200
        es = mfs.kernel()
        orbsym = symm.label_orb_symm(msym, msym.irrep_name, msym.symm_orb, mfs.mo_coeff)
        occ_irrep = {}
        for s in list(orbsym)[: msym.nelectron // 2]:
            occ_irrep[str(s)] = occ_irrep.get(str(s), 0) + 1
        occ_irrep = {"groupname": grp, "occupied": dict(sorted(occ_irrep.items())), "energy": float(es), "converged": bool(mfs.converged)}
    except Exception as exc:                                     # noqa: BLE001 — recorded, never a name
        occ_irrep = {"failed": str(exc).split("\n")[0]}
    nocc = mol.nelectron // 2
    out = {"energy": float(e), "converged": bool(mf.converged), "route": route, "cycles": int(getattr(mf, "cycles", -1)),
           "wallSeconds": round(wall, 3), "nao": int(mol.nao_nr()), "nocc": nocc, "key": row["key"],
           "topgroup": top, "groupname": grp, "orbsym": occ_irrep,
           "homoLumoGapEh": float(np.sort(mf.mo_energy)[nocc] - np.sort(mf.mo_energy)[nocc - 1])}
    fixture["molecules"][row["id"]] = out
    print(f"{row['id']:<16} {out['nao']:>3} AO  E {out['energy']:.12f}  {'converged' if out['converged'] else 'NOT CONVERGED'} ({route})"
          f"  {top}/{grp}  {wall:.1f} s", flush=True)
    if args.dump:
        S = mol.intor("int1e_ovlp")
        perm = app_order(mol)
        scale = np.sqrt(np.diag(S))[perm]                        # md.js: every component at unit self-overlap
        order = np.argsort(mf.mo_energy, kind="stable")
        C = (np.array(mf.mo_coeff)[perm][:, order]) * scale[:, None]
        Sa = S[np.ix_(perm, perm)] / np.outer(scale, scale)
        dump[row["id"]] = {"eps": [float(x) for x in np.array(mf.mo_energy)[order]], "C": C.ravel().tolist(), "S": Sa.ravel().tolist(),
                           "nocc": nocc, "converged": bool(mf.converged), "energy": float(e)}
if args.fixture:
    fixture["provenance"] = {"tool": "tools/library/record-oracle.py", "pyscf": pyscf.__version__, "numpy": np.__version__,
                             "basis": "lab/vendor/bse/sto-3g-v1.json", "basisSha256": hashlib.sha256(open(BASIS_FILE, "rb").read()).hexdigest(),
                             "cart": True, "unit": "Bohr (the record's own atoms)", "method": "RHF, conv_tol 1e-13, conv_tol_grad 1e-10, DIIS (Newton if DIIS stops short)",
                             "symmetry": "topgroup/groupname are PySCF's detection on the same atoms — recorded, never used as a name (ledger C5)",
                             "status": "MEASURED on this machine; wallSeconds is a clock and is not part of any record"}
    fixture["molecules"] = dict(sorted(fixture["molecules"].items()))
    with open(args.fixture, "w") as f:
        json.dump(fixture, f, indent=1)
        f.write("\n")
if args.dump:
    with open(args.dump, "w") as f:
        json.dump(dump, f)
