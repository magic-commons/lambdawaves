"""research/iteration-007/codon/build.py — the 3-codon fibre models (PyMOL open-source fnab = 3DNA fibre fragments), with hydrogens.

  python -I build.py OUTDIR      (any venv with `pip install pymol-open-source`; ~2 s)

Each model: fnab → the 5'-terminal phosphate (P, O1P/OP1, O2P/OP2) removed so both ends are -OH → h_add (PyMOL protonates the
phosphodiester's single-bonded oxygen) → the anionic model drops that one H per phosphate (charge = -nP).  The neutral
('protonated phosphate', -neutral) variant keeps it; the -na variant puts one Na+ on each phosphate's O-P-O bisector (charge 0).  RNA duplexes are made from fnab's A-DNA duplex (fnab cannot build an RNA double helix):
O2' is placed 1.43 Å along the C2'-H bond cis to O3', T's methyl is deleted (T -> U); an approximation at the fibre-model level.
"""
import sys, time, math
from collections import Counter
from pymol import cmd

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
COMP = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G', 'U': 'A'}

def strip_5p_phosphate(obj):
    """delete P/OP1/OP2 of each chain's 5'-terminal residue (the P not bonded to any O3')."""
    for ch in cmd.get_chains(obj):
        for at in cmd.get_model(f'{obj} and chain {ch} and name P').atom:
            if cmd.count_atoms(f"({obj} and name O3') and neighbor ({obj} and chain {ch} and resi \\{at.resi} and name P)") == 0:
                cmd.remove(f'{obj} and chain {ch} and resi \\{at.resi} and name P+O1P+O2P+OP1+OP2')

def phosphate_h(obj):
    return f'{obj} and hydro and neighbor ({obj} and (name O1P+O2P+OP1+OP2))'

def to_rna(obj, chains):
    """A-DNA strand(s) -> RNA: O2' on the C2'-H cis to O3'; T -> U (methyl removed); residue names DA -> A etc."""
    cmd.alter(obj, 'ID = index')
    for ch in chains:
        for at in cmd.get_model(f"{obj} and chain {ch} and name C2'").atom:
            r = f'{obj} and chain {ch} and resi \\{at.resi}'
            hs = cmd.get_model(f"{r} and hydro and neighbor ({r} and name C2')").atom
            def dih(h): return abs(cmd.get_dihedral(f"{r} and name O3'", f"{r} and name C3'", f"{r} and name C2'", f"{obj} and id {h.id}"))
            h = min(hs, key=dih)
            c = at.coord; v = [h.coord[i] - c[i] for i in range(3)]; n = math.sqrt(sum(x * x for x in v))
            pos = [c[i] + 1.43 * v[i] / n for i in range(3)]
            cmd.remove(f'{obj} and id {h.id}')
            cmd.pseudoatom('tmpO', pos=pos, name="O2'", elem='O')
            cmd.alter('tmpO', f"chain='{ch}'; segi='{at.segi}'; resi='{at.resi}'; resn='{at.resn}'; type='ATOM'; q=1.0; b=0.0; vdw=1.52")
            cmd.create(obj, f'{obj} or tmpO'); cmd.delete('tmpO'); cmd.alter(obj, 'ID = index')
            cmd.bond(f"{r} and name O2'", f"{r} and name C2'")
        cmd.remove(f'{obj} and chain {ch} and resn DT and ((name C5M+C7) or (hydro and neighbor (name C5M+C7)))')
        cmd.alter(f'{obj} and chain {ch}', "resn = {'DA':'A','DC':'C','DG':'G','DT':'U'}.get(resn, resn)")
    cmd.h_add(f"{obj} and resn U and name C5")
    cmd.remove(f"{obj} and hydro and neighbor ({obj} and name O2')")      # h_add is unreliable on the placed O2'; HO2' is placed below
    import numpy as np
    allxyz = cmd.get_coords(obj)
    for at in cmd.get_model(f"{obj} and name O2'").atom:
        r = f'{obj} and chain {at.chain} and resi \\{at.resi}'
        O, C2, C3 = (np.array(cmd.get_coords(f"{r} and name {n}")[0]) for n in ("O2'", "C2'", "C3'"))
        best = None
        for phi in range(0, 360, 15):                    # H-O2'-C2'-C3' dihedral scan: the HO2' farthest from every other atom
            b = (C2 - O) / np.linalg.norm(C2 - O); n = np.cross(C3 - C2, b); n /= np.linalg.norm(n); m = np.cross(n, b)
            ph = math.radians(phi)
            H = O + 0.96 * (b * math.cos(math.radians(108.5)) + math.sin(math.radians(108.5)) * (math.cos(ph) * m + math.sin(ph) * n))
            d = np.linalg.norm(allxyz - H, axis=1); d = d[d > 1.2].min()   # skip O2' itself
            if best is None or d > best[0]: best = (d, H)
        cmd.pseudoatom('tmpH', pos=list(map(float, best[1])), name="HO2'", elem='H')
        cmd.alter('tmpH', f"chain='{at.chain}'; segi='{at.segi}'; resi='{at.resi}'; resn='{at.resn}'; type='ATOM'; q=1.0; b=0.0")
        cmd.create(obj, f'{obj} or tmpH'); cmd.delete('tmpH'); cmd.alter(obj, 'ID = index'); cmd.bond(f"{r} and name HO2'", f"{r} and name O2'")

def add_na(obj):
    """one Na+ per phosphodiester, bidentate on OP1/OP2: on the O-P-O bisector, 2.77 Å from P (Na-O ~ 2.4 Å)"""
    import numpy as np
    for k, at in enumerate(cmd.get_model(f'{obj} and elem P').atom):
        r = f'{obj} and chain {at.chain} and resi \\{at.resi}'
        P = np.array(at.coord); O = cmd.get_coords(f'{r} and name O1P+O2P+OP1+OP2')
        u = O.mean(0) - P; u /= np.linalg.norm(u); X = P + 2.77 * u
        cmd.pseudoatom('tmpNa', pos=list(map(float, X)), name='NA', elem='Na')
        cmd.alter('tmpNa', f"chain='S'; segi='S'; resi='{k + 1}'; resn='NA'; type='HETATM'; q=1.0; b=0.0")
        cmd.create(obj, f'{obj} or tmpNa'); cmd.delete('tmpNa'); cmd.alter(obj, 'ID = index')

def place_hydroxyl_h(obj):
    """every H on an O (HO5', HO3', HO2', a protonated phosphate's OH) re-placed by a 15-degree scan of its dihedral about the O-X
    bond, keeping the position farthest from every other atom (h_add leaves some at 1.5 Å from a neighbour H)"""
    import numpy as np
    cmd.alter(obj, 'ID = index')                     # pseudoatom merges can repeat IDs; the selections below need them unique
    for h in cmd.get_model(f'{obj} and hydro and neighbor ({obj} and elem O)').atom:
        o = cmd.get_model(f'{obj} and elem O and neighbor ({obj} and id {h.id})').atom[0]
        xs = [a for a in cmd.get_model(f'{obj} and not hydro and neighbor ({obj} and id {o.id})').atom]
        x = xs[0]; ref = cmd.get_model(f'{obj} and not hydro and not id {o.id} and neighbor ({obj} and id {x.id})').atom[0]
        O, X, Rf = np.array(o.coord), np.array(x.coord), np.array(ref.coord)
        b = (X - O) / np.linalg.norm(X - O); n = np.cross(Rf - X, b); n /= np.linalg.norm(n); m = np.cross(n, b)
        others = cmd.get_coords(f'{obj} and not id {h.id}+{o.id}')
        best = None
        for phi in range(0, 360, 15):
            ph = math.radians(phi); a = math.radians(108.5)
            H = O + 0.96 * (b * math.cos(a) + math.sin(a) * (math.cos(ph) * m + math.sin(ph) * n))
            d = np.linalg.norm(others - H, axis=1).min()
            if best is None or d > best[0]: best = (d, H)
        cmd.alter_state(1, f'{obj} and id {h.id}', '(x, y, z) = newxyz', space={'newxyz': tuple(map(float, best[1]))})

def finish(obj, fname, charged=True, na=False):
    if charged: cmd.remove(phosphate_h(obj))
    place_hydroxyl_h(obj)
    nP = cmd.count_atoms(f'{obj} and elem P'); q = -nP if charged else 0
    if na: add_na(obj); q = 0
    cmd.sort(obj)
    cmd.save(f'{OUT}/{fname}.pdb', obj)
    m = cmd.get_model(obj)
    with open(f'{OUT}/{fname}.xyz', 'w') as f:
        f.write(f'{len(m.atom)}\ncharge={q} multiplicity=1 source=PyMOL {cmd.get_version()[0]} fnab (3DNA fibre fragments) + h_add; build.py\n')
        for a in m.atom: f.write(f'{a.symbol:2s} {a.coord[0]:12.6f} {a.coord[1]:12.6f} {a.coord[2]:12.6f}\n')
    c = Counter(a.symbol for a in m.atom)
    print(f'{fname:24s} atoms {len(m.atom):4d}  heavy {len(m.atom) - c["H"]:4d}  H {c["H"]:4d}  {dict(sorted(c.items()))}  charge {q}')

def build(seq, mode, form, dbl, rna_chains=()):
    cmd.delete('all'); cmd.fnab(seq, name='na', mode=mode, form=form, dbl_helix=dbl)
    strip_5p_phosphate('na'); cmd.h_add('na')
    if rna_chains: to_rna('na', rna_chains)

t0 = time.perf_counter()
DNA, RNA = 'ATGCGATAA', 'AUGCGAUAA'
jobs = [('bdna-9bp',        lambda: build(DNA, 'DNA', 'B', 1)),
        ('bdna-ss9',        lambda: build(DNA, 'DNA', 'B', 0)),
        ('arna-ss9',        lambda: build(RNA, 'RNA', 'A', 0)),
        ('adna-9bp',        lambda: build(DNA, 'DNA', 'A', 1)),
        ('arna-9bp',        lambda: build(DNA, 'DNA', 'A', 1, rna_chains=('A', 'B'))),
        ('hybrid-9bp',      lambda: build(DNA, 'DNA', 'A', 1, rna_chains=('A',)))]
for name, f in jobs:
    t = time.perf_counter(); f(); finish('na', name)
    if name in ('bdna-9bp', 'arna-ss9'):
        f(); finish('na', name + '-neutral', charged=False)
        f(); finish('na', name + '-na', na=True)
    print(f'   {time.perf_counter() - t:.2f} s')
print(f'total {time.perf_counter() - t0:.2f} s')

# ── AmberTools fd_helix fibre models (optional: FDH_DIR holds <type>.raw.pdb from fd_helix.c's stdout) ─────────────────────
import os, glob
FDH = os.environ.get('FDH_DIR')
if FDH:
    for raw in sorted(glob.glob(f'{FDH}/*.raw.pdb')):
        typ = os.path.basename(raw).split('.')[0]
        # fd_helix writes some residues' atoms out of order (adenine B17's C2 last), and PyMOL's bond-order template then misses
        # that ring (C2 gets 2 H, N3 1 H): every residue is rewritten in one canonical atom order before the load
        ORDER = ['P', 'OP1', 'OP2', "O5'", "C5'", "C4'", "O4'", "C3'", "O3'", "C2'", "O2'", "C1'",
                 'N9', 'C8', 'N7', 'C5', 'C6', 'O6', 'N6', 'N1', 'C2', 'N2', 'O2', 'N3', 'C4', 'O4', 'N4', 'C7']
        rows = [l for l in open(raw) if l.startswith('ATOM')]
        keyed = sorted(rows, key=lambda l: (l[21], int(l[22:26]), ORDER.index(l[12:16].strip()) if l[12:16].strip() in ORDER else 99))
        tmp = f'{OUT}/.{typ}.sorted.pdb'; open(tmp, 'w').write(''.join(keyed) + 'END\n')
        cmd.delete('all'); cmd.load(tmp, 'na'); os.remove(tmp)
        # and the bond orders are copied from fnab's own residues (PyMOL still loses one adenine ring's orders on load)
        tmpl = {}
        for seq, mode, form in (('ACGU', 'RNA', 'A'), ('ACGT', 'DNA', 'B')):
            cmd.fnab(seq, name='tmpl', mode=mode, form=form, dbl_helix=0); mt = cmd.get_model('tmpl')
            for b in mt.bond:
                a1, a2 = mt.atom[b.index[0]], mt.atom[b.index[1]]
                if a1.resi == a2.resi: tmpl[(a1.resn.strip(), frozenset((a1.name, a2.name)))] = b.order
            cmd.delete('tmpl')
        m = cmd.get_model('na')
        for b in m.bond:
            a1, a2 = m.atom[b.index[0]], m.atom[b.index[1]]
            o = tmpl.get((a1.resn.strip(), frozenset((a1.name, a2.name))))
            if a1.resi == a2.resi and a1.chain == a2.chain and o and o != b.order:
                s1, s2 = f'na and chain {a1.chain} and resi \\{a1.resi} and name {a1.name}', f'na and chain {a2.chain} and resi \\{a2.resi} and name {a2.name}'
                cmd.unbond(s1, s2); cmd.bond(s1, s2, o); print(f'   bond order fixed: {a1.chain}{a1.resi} {a1.resn} {a1.name}-{a2.name} -> {o}')
        cmd.h_add('na')
        if typ in ('arna', 'aprna'):
            cmd.alter('na', "resn = resn.strip()")
        finish('na', f'amber-{typ}-9bp')
