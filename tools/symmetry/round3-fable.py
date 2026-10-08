#!/usr/bin/env python
"""tools/symmetry/round3-fable.py — ROUND 3 (Fable, lead) PySCF side of the SOL THREAD audit.  lab/ is read-only.

    ~/bin/scipython -I tools/symmetry/round3-fable.py --part quick --out research/release-0.4.0/measure/round3-fable-pyscf.json
    ~/bin/scipython -I tools/symmetry/round3-fable.py --part c60   --out research/release-0.4.0/measure/round3-fable-c60.json [--threads 6]
    ~/bin/scipython -I tools/symmetry/round3-fable.py --part c60df --out research/release-0.4.0/measure/round3-fable-c60-df.json [--threads 4]

quick : (a) the installed PySCF's symm.geom.get_subgroup for every group the library and the plan name (Sol's Ih→Ci
        claim, MEASURED from the function itself); (b) Q9 on the molecules that exist: in-core RHF, forced-direct
        RHF, DF-J with exact (direct) K and DF-JK on benzene (36 AO) and TiCl4 (55 AO, Td, r = 2.170 Å), with the
        auxiliary basis, κ = naux/nao, the energy error and the wall time of each.
c60   : the 300-AO direct RHF on Sol's own ideal truncated icosahedron (coordinates read from round2-sol-exact.json),
        symmetry OFF so the frame is Sol's, then the I_h analysis Sol did not do: the 120 operations generated from
        the icosahedron, the AO representation's characters, the I_h block sizes n_Γ of the 300 Cartesian AOs, the
        irrep of every converged MO cluster (the STO-3G configuration of C60 in I_h), HOMO/LUMO irreps, the occupied
        character and the pair-space (RPA) blocks by irrep.
c60df : the same SCF with density fitting (DF-JK) — Q9's 300-AO number: time and energy error against the direct run.
"""
import argparse
import json
import math
import os
import sys
import time

import numpy as np
import pyscf
from pyscf import gto, scf, lib
from pyscf.symm import geom

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
REC = json.load(open(os.path.join(ROOT, "lab", "vendor", "bse", "sto-3g-v1.json")))
SYM = {1: "H", 6: "C", 17: "Cl", 22: "Ti"}
PHI = (1 + math.sqrt(5)) / 2

ap = argparse.ArgumentParser()
ap.add_argument("--part", required=True, choices=["quick", "group", "c60", "c60df", "c60incore", "analyze"])
ap.add_argument("--out", required=True)
ap.add_argument("--threads", type=int, default=2)
ap.add_argument("--npz", default=None, help="analyze: the .npz a c60/c60df run saved beside its JSON")
args = ap.parse_args()
lib.num_threads(args.threads)
dest = os.path.join(ROOT, args.out)
assert os.path.abspath(dest).startswith(os.path.abspath(os.path.join(ROOT, "research", "release-0.4.0", "measure")))


def pinned_basis(zs):
    """the vendored record's decimals, as pyscf-symm-oracle.py does (never PySCF's internal STO-3G table)"""
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


def mole(atoms, symmetry=False, max_memory=4000):
    zs = sorted({Z for Z, *_ in atoms})
    return gto.M(atom=[(SYM[Z], (x, y, z)) for Z, x, y, z in atoms], basis=pinned_basis(zs), cart=True,
                 symmetry=symmetry, unit="Angstrom", verbose=0, max_memory=max_memory)


def timed_rhf(mol, mode, conv_tol=1e-10, conv_tol_grad=1e-7, max_cycle=60):
    mf = scf.RHF(mol)
    if mode == "direct":
        mf.max_memory = 1                         # the in-core predicate fails: PySCF takes the direct J/K route
        mf.direct_scf_tol = 1e-13
    elif mode == "dfj":
        mf = mf.density_fit(only_dfj=True)        # J fitted, K exact through the direct route
    elif mode == "dfjk":
        mf = mf.density_fit()
    mf.conv_tol = conv_tol
    mf.conv_tol_grad = conv_tol_grad
    mf.max_cycle = max_cycle
    t = time.perf_counter()
    e = mf.kernel()
    wall = time.perf_counter() - t
    rec = {"mode": mode, "energy": float(e), "converged": bool(mf.converged), "cycles": int(mf.cycles), "wallSeconds": wall,
           "eriInCore": getattr(mf, "_eri", None) is not None}
    if mode in ("dfj", "dfjk"):
        rec["auxbasis"] = str(mf.with_df.auxbasis)
        rec["naux"] = int(mf.with_df.auxmol.nao_nr())
        rec["kappa"] = rec["naux"] / mol.nao_nr()
    return rec, mf


# ── the icosahedral group from the icosahedron itself ─────────────────────────────────────────────────────────
def icosahedron():
    v = []
    for a in (-1, 1):
        for b in (-PHI, PHI):
            v += [(0, a, b), (b, 0, a), (a, b, 0)]
    return np.array(v, dtype=float)


def ih_operations():
    """I acts simply transitively on the 60 directed edges of the icosahedron: R maps a fixed directed edge to each"""
    V = icosahedron()
    edges = [(i, j) for i in range(12) for j in range(12) if i != j and abs(np.linalg.norm(V[i] - V[j]) - 2) < 1e-9]
    assert len(edges) == 60
    u0, v0 = V[edges[0][0]], V[edges[0][1]]
    B0 = np.column_stack([u0, v0, np.cross(u0, v0)])
    rots = []
    for (i, j) in edges:
        u, v = V[i], V[j]
        R = np.column_stack([u, v, np.cross(u, v)]) @ np.linalg.inv(B0)
        assert np.allclose(R @ R.T, np.eye(3), atol=1e-9) and abs(np.linalg.det(R) - 1) < 1e-9
        img = (R @ V.T).T
        for p in img:
            assert np.min(np.linalg.norm(V - p, axis=1)) < 1e-8
        rots.append(R)
    ops = rots + [-R for R in rots]
    for a in range(len(ops)):
        for b in range(a + 1, len(ops)):
            assert not np.allclose(ops[a], ops[b], atol=1e-9)
    return ops


IH_CLASSES = ["E", "12C5", "12C5^2", "20C3", "15C2", "i", "12S10", "12S10^3", "20S6", "15sigma"]
# I = A5: characters on (E, C5, C5^2, C3, C2); g/u by the inversion sign
I_TABLE = {
    "A": [1, 1, 1, 1, 1],
    "T1": [3, PHI, 1 - PHI, 0, -1],
    "T2": [3, 1 - PHI, PHI, 0, -1],
    "G": [4, -1, -1, 1, 0],
    "H": [5, 0, 0, -1, 1],
}
IRREPS = [n + s for s in ("g", "u") for n in I_TABLE]          # Ag T1g T2g Gg Hg Au T1u T2u Gu Hu


def ih_character(irrep, cls):
    base, par = irrep[:-1], irrep[-1]
    row = I_TABLE[base]
    if cls < 5:
        return row[cls]
    return row[cls - 5] * (1 if par == "g" else -1)


def class_of(R):
    d, t = np.linalg.det(R), np.trace(R)
    if d > 0:
        if abs(t - 3) < 1e-6: return 0
        if abs(t - PHI) < 1e-6: return 1
        if abs(t - (1 - PHI)) < 1e-6: return 2
        if abs(t) < 1e-6: return 3
        if abs(t + 1) < 1e-6: return 4
    else:
        if abs(t + 3) < 1e-6: return 5
        if abs(t + PHI) < 1e-6: return 6                    # S10 = i·C5: trace −(1 + 2cos72°)
        if abs(t - (PHI - 1)) < 1e-6: return 7              # S10^3 = i·C5^2: trace −(1 + 2cos144°) = φ − 1
        if abs(t) < 1e-6: return 8
        if abs(t - 1) < 1e-6: return 9
    raise ValueError(f"unclassified operation det {d} trace {t}")


def table_self_test(ops):
    classes = [class_of(R) for R in ops]
    sizes = [classes.count(c) for c in range(10)]
    assert sizes == [1, 12, 12, 20, 15, 1, 12, 12, 20, 15], sizes
    worst = 0
    for a in IRREPS:
        for b in IRREPS:
            s = sum(sizes[c] * ih_character(a, c) * ih_character(b, c) for c in range(10))
            worst = max(worst, abs(s - (120 if a == b else 0)))
    assert worst < 1e-9, worst
    return classes, sizes, worst


def decompose(chi_by_op, classes):
    """multiplicities m_Γ = (1/120) Σ_R χ(R) χ_Γ(R) for a real character given per operation"""
    out, resid = {}, 0.0
    for irr in IRREPS:
        s = sum(chi_by_op[k] * ih_character(irr, classes[k]) for k in range(len(classes))) / 120
        m = int(round(s)); resid = max(resid, abs(s - m))
        if m: out[irr] = m
    return out, resid


def c60_coordinates():
    j = json.load(open(os.path.join(ROOT, "research", "release-0.4.0", "measure", "round2-sol-exact.json")))
    return np.array(j["directC60"]["coordinatesAngstrom"], dtype=float), j["directC60"]


def atom_permutations(coords, ops, tol=1e-6):
    perms = []
    for R in ops:
        img = (R @ coords.T).T
        perm = []
        for p in img:
            d = np.linalg.norm(coords - p, axis=1)
            k = int(np.argmin(d)); assert d[k] < tol, d[k]
            perm.append(k)
        assert len(set(perm)) == len(perm)
        perms.append(perm)
    return perms


def ao_rep(R, perm, nat, per_atom=5):
    """cart=True STO-3G carbon: [1s, 2s, px, py, pz] per atom; s ↦ 1, p ↦ R (image component j from source i: R[j][i])"""
    n = nat * per_atom
    M = np.zeros((n, n))
    for a in range(nat):
        b = perm[a]
        M[b * per_atom + 0, a * per_atom + 0] = 1
        M[b * per_atom + 1, a * per_atom + 1] = 1
        M[b * per_atom + 2: b * per_atom + 5, a * per_atom + 2: a * per_atom + 5] = R
    return M


def ih_analysis(coords, S, C, eps, nocc, cluster_tol=1e-6):
    ops = ih_operations()
    classes, sizes, worst = table_self_test(ops)
    perms = atom_permutations(coords, ops)
    nat = len(coords); n = nat * 5
    # AO characters and the block sizes of the 300 AOs under I_h
    chi_ao = []
    for R, perm in zip(ops, perms):
        fixed = sum(1 for a in range(nat) if perm[a] == a)
        chi_ao.append(fixed * (2 + np.trace(R)))
    n_blocks, resid_ao = decompose(chi_ao, classes)
    dims = {irr: (1 if irr[0] == "A" else 3 if irr[0] == "T" else 4 if irr[0] == "G" else 5) for irr in IRREPS}
    assert sum(dims[k] * v for k, v in n_blocks.items()) == n
    # the operator check on the converged frame: Mᵀ S M = S for every operation
    Ms = [ao_rep(R, perm, nat) for R, perm in zip(ops, perms)]
    dS = max(float(np.max(np.abs(M.T @ S @ M - S))) for M in Ms)
    SC = S @ C
    # clusters of the MO spectrum
    order = np.argsort(eps); eps = eps[order]; C = C[:, order]; SC = SC[:, order]
    clusters, start = [], 0
    for k in range(1, n + 1):
        if k == n or eps[k] - eps[k - 1] > cluster_tol:
            clusters.append((start, k)); start = k
    rows, worst_spread, narrowest_gap, counts = [], 0.0, float("inf"), {}
    occ_chi = np.zeros(len(ops))
    for ci, (a, b) in enumerate(clusters):
        worst_spread = max(worst_spread, float(eps[b - 1] - eps[a]))
        if b < n: narrowest_gap = min(narrowest_gap, float(eps[b] - eps[b - 1]))
        chi = np.array([float(np.sum(C[:, a:b] * (M @ SC[:, a:b]))) for M in Ms])  # Σ_k c_kᵀ M S c_k ... see note below
        # note: χ(R) = Σ_k c_kᵀ S M c_k = Σ_k (S c_k)ᵀ M c_k; S symmetric, so Σ_k c_kᵀ Mᵀ S c_k is χ(R⁻¹) = χ(R) (real)
        if a < nocc: occ_chi += chi
        mult, resid = decompose(chi, classes)
        label = "+".join(f"{v}{k}" if v > 1 else k for k, v in mult.items())
        irr = next(iter(mult)) if len(mult) == 1 and mult[next(iter(mult))] == 1 else None
        if irr:
            counts[irr] = counts.get(irr, 0) + 1
            name = f"{counts[irr]}{irr.lower()}"
        else:
            name = "MIXED:" + label
        rows.append({"cluster": ci, "mo": [int(a) + 1, int(b)], "dimension": int(b - a), "epsEh": float(eps[a]), "irrep": label,
                     "name": name, "occupation": 2 * (b - a) if a < nocc else 0, "residual": float(resid)})
    homo = next(r for r in rows if r["mo"][0] <= nocc <= r["mo"][1])
    lumo = next(r for r in rows if r["mo"][0] == nocc + 1)
    vir_chi = np.array(chi_ao) - occ_chi
    occ_blocks, resid_occ = decompose(occ_chi, classes)
    pair_blocks, resid_pair = decompose(occ_chi * vir_chi, classes)
    pair_total = sum(dims[k] * v for k, v in pair_blocks.items())
    pair_check = pair_total == nocc * (n - nocc)
    config = "".join(f"({r['name']})^{r['occupation']}" for r in rows if r["occupation"])
    return {
        "operations": 120, "classSizes": sizes, "characterTableOrthogonalityDefect": worst,
        "atomMatchTolAngstrom": 1e-6, "overlapInvarianceDefect": dS,
        "aoCharacterByClass": {IH_CLASSES[c]: float(next(chi_ao[k] for k in range(120) if classes[k] == c)) for c in range(10)},
        "aoBlocks": n_blocks, "aoBlockResidual": resid_ao,
        "fockEntriesInBlocks": int(sum(dims[k] * v * v for k, v in n_blocks.items())),
        "fockEntriesDense": n * n,
        "eigensolveWorkInBlocks": int(sum(dims[k] * v ** 3 for k, v in n_blocks.items())),
        "eigensolveWorkDense": n ** 3,
        "largestBlock": max(n_blocks.values()),
        "clusterTolEh": cluster_tol, "worstInClusterSpreadEh": worst_spread, "narrowestInterClusterGapEh": narrowest_gap,
        "clusters": rows, "configuration": config, "homo": homo, "lumo": lumo,
        "occupiedPerIrrep": occ_blocks, "occupiedResidual": resid_occ,
        "pairSpaceBlocks": pair_blocks, "pairSpaceResidual": resid_pair, "pairSpace": pair_total, "pairSpaceEqualsOccTimesVir": pair_check,
        "pairDistinctRoots": int(sum(pair_blocks.values())),
        "pairSumM2overM2": float(sum(dims[k] * v * v for k, v in pair_blocks.items()) / pair_total ** 2),
    }


out = {"pyscf": pyscf.__version__, "numpy": np.__version__, "threads": lib.num_threads(), "part": args.part, "date": "2026-10-07"}

if args.part == "quick":
    out["getSubgroup"] = {g: geom.get_subgroup(g, np.eye(3))[0] for g in
                          ["Ih", "I", "Oh", "O", "Td", "T", "Th", "D6h", "D4h", "D3h", "D3d", "D2d", "D5h", "D5d", "C6h", "C3v", "C4v", "S6", "S4", "Dooh", "Coov", "D2h", "C2v", "C2h", "Cs", "Ci", "C1"]}
    BENZENE = []
    for k in range(6):
        t = k * math.pi / 3
        BENZENE.append((6, 1.39 * math.cos(t), 1.39 * math.sin(t), 0.0))
        BENZENE.append((1, 2.48 * math.cos(t), 2.48 * math.sin(t), 0.0))
    d = 2.170 / math.sqrt(3)                                   # lab/molecules.js td(): ligands on the cube diagonals
    TICL4 = [(22, 0.0, 0.0, 0.0), (17, d, d, d), (17, d, -d, -d), (17, -d, d, -d), (17, -d, -d, d)]
    out["q9"] = {}
    for name, atoms in (("C6H6", BENZENE), ("TiCl4", TICL4)):
        rows = []
        for mode in ("incore", "direct", "dfj", "dfjk"):
            mol = mole(atoms)
            rec, mf = timed_rhf(mol, mode)
            rec["nao"] = int(mol.nao_nr()); rec["nocc"] = mol.nelectron // 2
            rows.append(rec)
        ref = rows[0]["energy"]
        for r in rows: r["errorVsIncoreEh"] = r["energy"] - ref
        msym = mole(atoms, symmetry=True)
        out["q9"][name] = {"topgroup": msym.topgroup, "groupname": msym.groupname, "runs": rows}
    json.dump(out, open(dest, "w"), indent=1); print(json.dumps(out, indent=1))
    sys.exit(0)

coords, solrec = c60_coordinates()
atoms = [(6, *xyz) for xyz in coords]

if args.part == "group":
    # the I_h machinery alone, no SCF: the operations, the table, the atom permutations and the 300-AO block sizes
    ops = ih_operations()
    classes, sizes, worst = table_self_test(ops)
    perms = atom_permutations(coords, ops)
    chi_ao = [sum(1 for a in range(60) if perm[a] == a) * (2 + np.trace(R)) for R, perm in zip(ops, perms)]
    blocks, resid = decompose(chi_ao, classes)
    fixed_by_class = {IH_CLASSES[c]: int(sum(1 for a in range(60) if perms[k][a] == a)) for c in range(10) for k in range(120) if classes[k] == c}
    out["group"] = {"operations": len(ops), "classSizes": sizes, "tableDefect": worst, "fixedAtomsByClass": fixed_by_class,
                    "aoCharacterByClass": {IH_CLASSES[c]: float(chi_ao[next(k for k in range(120) if classes[k] == c)]) for c in range(10)},
                    "aoBlocks": blocks, "residual": resid}
    json.dump(out, open(dest, "w"), indent=1); print(json.dumps(out, indent=1)); sys.exit(0)

if args.part == "analyze":
    z = np.load(args.npz)
    out["ih"] = ih_analysis(z["coords"], z["S"], z["C"], z["eps"], int(z["nocc"]))
    json.dump(out, open(dest, "w"), indent=1); print(json.dumps(out, indent=1, default=str)[:6000]); sys.exit(0)

msym = mole(atoms, symmetry=True, max_memory=128)
out["symmetryDetected"] = {"topgroup": msym.topgroup, "groupname": msym.groupname, "nao": int(msym.nao_nr())}
out["solReference"] = {k: solrec[k] for k in ("energyEh", "cycles", "solveSeconds", "threads", "homoLumoGapEh") if k in solrec}
MEM = {"c60": 128, "c60df": 8000, "c60incore": 20000}[args.part]     # c60incore: the 8-fold packed 300-AO tensor is 8.15 GB
mol = mole(atoms, symmetry=False, max_memory=MEM)
mf = scf.RHF(mol)
mf.max_memory = MEM
if args.part == "c60":
    mf.direct_scf_tol = 1e-13
elif args.part == "c60df":
    mf = mf.density_fit()
mf.conv_tol = 1e-10; mf.conv_tol_grad = 1e-7; mf.max_cycle = 60
t = time.perf_counter()
e = mf.kernel()
wall = time.perf_counter() - t
import resource
out["scf"] = {"mode": {"c60": "direct", "c60df": "dfjk", "c60incore": "incore"}[args.part], "nao": int(mol.nao_nr()), "nocc": mol.nelectron // 2, "energyEh": float(e),
              "converged": bool(mf.converged), "cycles": int(mf.cycles), "wallSeconds": wall, "eriIsNone": getattr(mf, "_eri", None) is None,
              "eriBytesInCore": int(mf._eri.nbytes) if getattr(mf, "_eri", None) is not None else 0,
              "processPeakRssKiB": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
              "homoLumoGapEh": float(mf.mo_energy[180] - mf.mo_energy[179]),
              "energyMinusSolEh": float(e) - solrec["energyEh"]}
if args.part == "c60df":
    out["scf"]["auxbasis"] = str(mf.with_df.auxbasis); out["scf"]["naux"] = int(mf.with_df.auxmol.nao_nr()); out["scf"]["kappa"] = out["scf"]["naux"] / mol.nao_nr()
S = mol.intor("int1e_ovlp")
out["moEnergies"] = [float(x) for x in np.sort(mf.mo_energy)]
np.savez(dest + ".npz", coords=coords, S=S, C=np.array(mf.mo_coeff), eps=np.array(mf.mo_energy), nocc=mol.nelectron // 2)
json.dump(out, open(dest, "w"), indent=1)                       # the SCF is banked before the analysis can fail
try:
    t = time.perf_counter()
    out["ih"] = ih_analysis(coords, S, np.array(mf.mo_coeff), np.array(mf.mo_energy), mol.nelectron // 2)
    out["ih"]["analysisSeconds"] = time.perf_counter() - t
except Exception as exc:                                        # noqa: BLE001 — recorded, re-runnable with --part analyze
    import traceback
    out["ihError"] = traceback.format_exc()
json.dump(out, open(dest, "w"), indent=1)
print(json.dumps({k: v for k, v in out.items() if k not in ("moEnergies",)}, indent=1, default=str)[:6000])
