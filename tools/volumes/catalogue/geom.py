"""geom.py — the catalogue's geometries (iteration 004, row CAT), in ångström, as [[Z, x, y, z], …].

THE ORDER OF PREFERENCE (build.py applies it; every candidate's geometrySource says which one it got):
  1. the app's own PINNED geometry (lab/molecules.js / lab/library.json) — never touched;
  2. PubChem's default 3-D conformer (OpenEye OMEGA, MMFF94s-optimised) — for an organic molecule, as is;
  3. RDKit ETKDGv3 + MMFF94, a fixed seed, the lowest-energy of ten embeddings — an organic molecule PubChem has no 3-D for;
  4. GFN2-xTB (tblite) relaxation — ONLY where 2 or 3 are known to fail: a molecule with no carbon, a metal, a noble gas, or a
     main-group centre with lone pairs beyond its normal valence (SF4, ClF3, BrF5 …).  MMFF94(s) has no honest parameters there: it
     makes SF4 a tetrahedron and SO3 a pyramid (both checked 2026-10-17).  The start is PubChem's conformer when it has one, else
     a VSEPR star (AXnEm: lone pairs equatorial in a trigonal bipyramid, trans in an octahedron) at covalent-radius bond lengths,
     else an ETKDG embedding of a covalent SMILES, else a hand-built sandwich.  When PubChem had a conformer and the relaxed one
     agrees with it (aligned RMSD ≤ 0.10 Å) PubChem's is kept, so the xTB step only replaces a conformer that was wrong.
"""
import math, os
import numpy as np
from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem
RDLogger.DisableLog('rdApp.*')
os.environ.setdefault('OMP_NUM_THREADS', '2')

SEED = 20261017
PT = Chem.GetPeriodicTable()
METALS = {3, 4, 11, 12, 13, 19, 20, *range(21, 32)}
NOBLE = {2, 10, 18, 36}

def atoms_from_mol(mol, conf_id=-1):
    c = mol.GetConformer(conf_id)
    return [[a.GetAtomicNum(), *(round(float(v), 5) for v in c.GetAtomPosition(a.GetIdx()))] for a in mol.GetAtoms()]

def from_sdf(sdf):
    m = Chem.MolFromMolBlock(sdf, removeHs=False, sanitize=False)
    if m is None: return None, None
    try: Chem.SanitizeMol(m)
    except Exception: pass
    return atoms_from_mol(m), m

def etkdg_mmff(smiles, n=10):
    """ETKDGv3 + MMFF94, lowest of n; None when it will not embed or MMFF94 has no parameters"""
    m = Chem.MolFromSmiles(smiles)
    if m is None: return None
    m = Chem.AddHs(m)
    p = AllChem.ETKDGv3(); p.randomSeed = SEED; p.numThreads = 1
    cids = list(AllChem.EmbedMultipleConfs(m, n, p))
    if not cids:
        p.useRandomCoords = True
        cids = list(AllChem.EmbedMultipleConfs(m, n, p))
    if not cids: return None
    if AllChem.MMFFGetMoleculeProperties(m) is None: return None
    res = AllChem.MMFFOptimizeMoleculeConfs(m, maxIters=5000, numThreads=1)
    best = min(range(len(cids)), key=lambda i: res[i][1])
    return atoms_from_mol(m, cids[best]), m

def embed_any(smiles):
    """an ETKDG embedding with no force field (the start of an xTB relaxation); sanitisation relaxed for hypervalent atoms"""
    m = Chem.MolFromSmiles(smiles)
    if m is None:
        m = Chem.MolFromSmiles(smiles, sanitize=False)
        if m is None: return None
        m.UpdatePropertyCache(strict=False)
        Chem.SanitizeMol(m, Chem.SanitizeFlags.SANITIZE_ALL ^ Chem.SanitizeFlags.SANITIZE_PROPERTIES, catchErrors=True)
    m = Chem.AddHs(m)
    p = AllChem.ETKDGv3(); p.randomSeed = SEED; p.useRandomCoords = True
    if AllChem.EmbedMolecule(m, p) != 0: return None
    return atoms_from_mol(m)

# ── VSEPR star: one central atom, every other atom bonded to it ────────────────────────────────────────────────────
def _valence_electrons(Z):
    if Z <= 2: return Z
    for start, n in ((3, 8), (11, 8)):
        if start <= Z < start + n: return Z - start + 1
    if 19 <= Z <= 20: return Z - 18
    if 31 <= Z <= 36: return Z - 28
    return None

def _directions(sn, nlp):
    """unit vectors for sn electron domains, the first nlp of them lone pairs (VSEPR placement)"""
    s3, r = math.sqrt(3) / 2, []
    if sn == 1: r = [(0, 0, 1)]
    elif sn == 2: r = [(0, 0, 1), (0, 0, -1)]
    elif sn == 3: r = [(1, 0, 0), (-0.5, s3, 0), (-0.5, -s3, 0)]
    elif sn == 4:
        d = 1 / math.sqrt(3); r = [(d, d, d), (d, -d, -d), (-d, d, -d), (-d, -d, d)]
    elif sn == 5:  # equatorial first (lone pairs go there), then the two axial
        r = [(1, 0, 0), (-0.5, s3, 0), (-0.5, -s3, 0), (0, 0, 1), (0, 0, -1)]
    elif sn == 6:  # trans pairs first so two lone pairs sit trans
        r = [(0, 0, 1), (0, 0, -1), (1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0)]
    elif sn == 7:  # pentagonal bipyramid, axial first
        r = [(0, 0, 1), (0, 0, -1)] + [(math.cos(2 * math.pi * k / 5), math.sin(2 * math.pi * k / 5), 0) for k in range(5)]
    else: return None
    return r[nlp:]

def vsepr_star(mol):
    """[[Z,x,y,z]] for a molecule whose atoms all bond to one centre (AXn with lone pairs), else None"""
    n = mol.GetNumAtoms()
    if n < 2: return None
    centre = max(mol.GetAtoms(), key=lambda a: a.GetDegree())
    if centre.GetDegree() != n - 1: return None
    Zc = centre.GetAtomicNum(); v = _valence_electrons(Zc)
    if v is None: return None
    bo = sum(b.GetBondTypeAsDouble() for b in centre.GetBonds())
    lp = (v - centre.GetFormalCharge() - bo) / 2
    lp = max(0, int(round(lp)))
    sn = (n - 1) + lp
    dirs = _directions(sn, lp)
    if dirs is None: return None
    out = [[Zc, 0.0, 0.0, 0.0]]
    for d, nb in zip(dirs, centre.GetNeighbors()):
        b = mol.GetBondBetweenAtoms(centre.GetIdx(), nb.GetIdx())
        r = PT.GetRcovalent(Zc) + PT.GetRcovalent(nb.GetAtomicNum()) - (0.1 if b.GetBondTypeAsDouble() >= 2 else 0)
        out.append([nb.GetAtomicNum(), round(r * d[0], 5), round(r * d[1], 5), round(r * d[2], 5)])
    return out

def needs_xtb(mol):
    """True when MMFF94(s) cannot be trusted: no carbon, a metal or noble gas, or a hypervalent lone-pair centre"""
    Zs = [a.GetAtomicNum() for a in mol.GetAtoms()]
    if 6 not in Zs: return True
    if any(z in METALS or z in NOBLE for z in Zs): return True
    for a in mol.GetAtoms():
        z, deg, nb = a.GetAtomicNum(), a.GetDegree(), [n.GetAtomicNum() for n in a.GetNeighbors()]
        if z in (17, 35) and deg > 1: return True                       # ClF3, BrF5 …
        if z in (15, 33) and deg == 5: return True                      # PF5, AsF5
        if z in (16, 34) and deg == 6: return True                      # SF6, SeF6, an SF5 group
        if z in (16, 34) and deg in (3, 4) and all(n in (8, 9, 17, 35) for n in nb):
            bo = sum(b.GetBondTypeAsDouble() for b in a.GetBonds())
            if 6 - a.GetFormalCharge() - bo >= 2: return True           # a lone pair on a hypervalent S/Se: SF4, SOF2
    return False

# ── GFN2-xTB relaxation ───────────────────────────────────────────────────────────────────────────────────────────
def xtb_relax(atoms, charge=0, fmax=0.02, steps=600):
    """(atoms, energy_eV, converged) — GFN2-xTB through tblite's ASE calculator, BFGS; closed shell (uhf 0)"""
    from ase import Atoms
    from ase.optimize import BFGS
    from tblite.ase import TBLite
    A = Atoms(numbers=[a[0] for a in atoms], positions=[a[1:] for a in atoms])
    A.calc = TBLite(method='GFN2-xTB', charge=charge, multiplicity=1, verbosity=0, max_iterations=500)
    try:
        opt = BFGS(A, logfile=None, maxstep=0.15)
        ok = opt.run(fmax=fmax, steps=steps)
        e = float(A.get_potential_energy())
    except Exception as ex:
        return None, None, f'xTB failed: {type(ex).__name__}'
    pos = A.get_positions()
    return [[int(z), *(round(float(v), 5) for v in p)] for z, p in zip(A.numbers, pos)], e, bool(ok)

def kabsch_rmsd(a, b):
    """aligned RMSD (Å) of two equal-order atom lists; inf when the element orders differ"""
    if len(a) != len(b) or any(x[0] != y[0] for x, y in zip(a, b)): return float('inf')
    P = np.array([x[1:] for x in a]); Q = np.array([x[1:] for x in b])
    P -= P.mean(0); Q -= Q.mean(0)
    U, S, Vt = np.linalg.svd(P.T @ Q)
    d = np.sign(np.linalg.det(U @ Vt))
    D = np.diag([1, 1, d]); R = U @ D @ Vt
    return float(np.sqrt(((P @ R - Q) ** 2).sum(1).mean()))

# ── hand-built starts for what no SMILES can carry (sandwiches, the B–H–B bridge) ───────────────────────────────────
def _ring(Z, n, radius, z, H=None, rH=None, phase=0.0):
    out = []
    for k in range(n):
        t = 2 * math.pi * k / n + phase
        out.append([Z, radius * math.cos(t), radius * math.sin(t), z])
        if H: out.append([1, (radius + rH) * math.cos(t), (radius + rH) * math.sin(t), z])
    return out

def sandwich(metal_Z, ring_n, ring_r, half_gap):
    """an eclipsed MCp2 / M(C6H6)2 sandwich: the metal at the origin, the rings in z = ±half_gap"""
    return [[metal_Z, 0.0, 0.0, 0.0]] + _ring(6, ring_n, ring_r, half_gap, True, 1.08) + _ring(6, ring_n, ring_r, -half_gap, True, 1.08)

HAND = {
    # ferrocene: Fe–C 2.064 Å, C–C 1.440 Å (gas-phase electron diffraction, Haaland & Nilsson 1968) → ring radius 1.225, ring height 1.66
    'ferrocene': lambda: sandwich(26, 5, 1.440 / (2 * math.sin(math.pi / 5)), 1.66),
    # bis(benzene)chromium: Cr–C 2.15 Å, C–C 1.42 Å (gas-phase ED, Haaland 1965) → ring radius 1.42, height 1.61
    'bis(benzene)chromium': lambda: sandwich(24, 6, 1.42, 1.61),
    # diborane: B–B 1.763, B–H(terminal) 1.192, B–H(bridge) 1.314 Å, H–B–H(terminal) 121.0° (CCCBDB experimental)
    'diborane': lambda: [[5, 0, 0, 0.8815], [5, 0, 0, -0.8815], [1, 0.9686, 0, 0], [1, -0.9686, 0, 0],
                         [1, 0, 1.0396, 1.4970], [1, 0, -1.0396, 1.4970], [1, 0, 1.0396, -1.4970], [1, 0, -1.0396, -1.4970]],
}
