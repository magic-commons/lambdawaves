"""structure_tags.py — WHAT A MOLECULE IS: the catalogue's tags (iteration 006 C5).

Josh, 2026-10-18: "it might be too many tags. I just wanted tags related to the molecules structure or class."  So a row's tags no
longer say what a molecule is FOR (medicine, food, fuel, pesticide …) but what it IS, from two sources only:

  1. ITS OWN STRUCTURE — RDKit (the row's SMILES as PubChem gives it; for a row with no SMILES RDKit reads — four app rows have
     none, and RDKit refuses KrF₂'s — the bonds RDKit's DetermineConnectivity reads off the row's own atoms): ring analysis and the
     SMARTS patterns of PATTERNS below, every one written down here and in research/iteration-006/C5-BUILD.md.
  2. ITS ChEBI STRUCTURAL CLASS — chebi.py's STRUCT_CLASSES, reached through CHECKED is_a relations only
     (cache/chebi/structure-classes.json), for the 3-star ChEBI entity of the row's InChIKey (or, when ChEBI has no entity of that
     key, every entity of its first block: the same skeleton in another stereo, isotope or protonation form).

THE VOCABULARY is VOCAB, in RANK order: when a molecule earns more than four words, the most distinctive survive — a class of
molecules first (peptide … fat), then what the molecule is made of in kind (metal, ion, cage, inorganic), then its functional groups
(rarest first), then the elements (halogen, phosphorus, sulfur), then its carbon–carbon bonds, then its shape (heterocycle, aromatic,
ring, chain).  Two rules shape the four:
  · A CLASS WORD SPEAKS FOR WHAT IT IMPLIES (SUBSUMES): an amino acid is not also tagged `acid` and `amine`, a sugar not `alcohol`,
    a steroid not `ring`, an alkaloid not `amine` — so steroid beats alcohol, alkaloid beats amine, sugar beats alcohol, and amino
    acid beats acid + amine by construction, not only by rank.
  · ONE SHAPE WORD ALWAYS STAYS: when the four highest-ranked words hold no shape word (cage, heterocycle, aromatic, ring, chain) and
    the molecule has one, the best of them takes the fourth place — so atenolol reads `amide · amine · alcohol · aromatic`, not
    `… · ether`.
Every molecule earns at least one word (an organic molecule a shape word, an inorganic one `inorganic`).
"""
from rdkit import Chem
from rdkit.Chem import rdMolDescriptors as RD
from rdkit.Chem import rdDetermineBonds

VOCAB = ['peptide', 'nucleotide', 'nucleoside', 'nucleobase', 'steroid', 'amino acid', 'sugar', 'alkaloid', 'terpene', 'fat',
         'metal', 'ion', 'cage', 'inorganic',
         'nitro', 'nitrile', 'alkyne', 'aldehyde', 'phenol', 'ester', 'amide', 'ketone', 'acid', 'amine', 'alcohol', 'ether',
         'halogen', 'phosphorus', 'sulfur', 'alkene', 'alkane',
         'heterocycle', 'aromatic', 'ring', 'chain']
RANK = {t: i for i, t in enumerate(VOCAB)}
SHAPE = ['cage', 'heterocycle', 'aromatic', 'ring', 'chain']        # in the order the reserved place takes them
CHEBI_WORDS = {'peptide', 'nucleotide', 'nucleoside', 'nucleobase', 'steroid', 'amino acid', 'sugar', 'alkaloid', 'terpene', 'fat'}
SUBSUMES = {
    'peptide':    {'amide', 'amine', 'acid', 'amino acid'},
    'nucleotide': {'nucleoside', 'nucleobase', 'sugar', 'phosphorus', 'acid', 'alcohol', 'ether', 'amine', 'amide'},
    'nucleoside': {'nucleobase', 'sugar', 'alcohol', 'ether', 'amine', 'amide'},
    'nucleobase': {'amine', 'amide'},
    'amino acid': {'acid', 'amine'},
    'sugar':      {'alcohol', 'ether', 'aldehyde', 'ketone'},
    'steroid':    {'ring'},
    'fat':        {'acid', 'ester', 'chain', 'alkane'},
    'alkaloid':   {'amine'},
    'cage':       {'ring'},
}
METALS = {3, 4, 11, 12, 13, 19, 20, *range(21, 32)}                   # geom.METALS / check.py: Li Be Na Mg Al K Ca Sc–Ga
HALOGENS = {9, 17, 35, 53}

# THE PATTERNS — RDKit SMARTS on the row's own structure (implicit hydrogens counted by H; aromaticity RDKit's default model).
# AMINE_N: a nitrogen of an amine — not aromatic, bonded to a carbon, bonded to no other heteroatom, and not the nitrogen of an
# amide, sulfonamide, phosphoramide, amidine, guanidine, imine or cyanamide (no C, S or P double-bonded to N, O or S beside it).
AMINE_N = '[NX3;!$(N~[!#6;!#1]);!$(N[#6,#16,#15]=[#7,#8,#16]);!$(N[#6]#[#7]);$(N[#6])]'
AMINE_N_H = '[NX3;H1,H2;!$(N~[!#6;!#1]);!$(N[#6,#16,#15]=[#7,#8,#16]);!$(N[#6]#[#7])]'   # … carrying a hydrogen (an amino acid's)
COOH = '[CX3](=O)[OX2H1,OX1-]'
PATTERNS = [
    # (tag, SMARTS, what it is)
    ('nitro',    '[#6,#7,$([#8X2][#6])][$([NX3](=O)=O),$([NX3+](=O)[O-])]', 'a nitro group on carbon or nitrogen, or a nitrate ester'),
    ('nitrile',  '[#6][CX2]#[NX1]', 'a nitrile: C≡N on carbon'),
    ('alkyne',   'C#C', 'a carbon–carbon triple bond'),
    ('aldehyde', '[CX3H1](=O)[#6]', 'an aldehyde: CHO on carbon'),
    ('aldehyde', '[CX3H2]=O', 'formaldehyde'),
    ('phenol',   '[c][OX2H1]', 'an OH on an aromatic ring'),
    ('ester',    '[#6X3](=[OX1])[#8X2H0][#6]', 'an ester (a lactone, a carbonate or a carbamate too): C(=O)–O–C'),
    ('amide',    '[#7X3][#6X3]=[OX1]', 'an amide (a lactam, an imide, a urea, a carbamate too): N–C(=O)'),
    ('amide',    '[#7X3][#16X4](=[OX1])=[OX1]', 'a sulfonamide: N–S(=O)₂'),
    ('ketone',   '[#6][#6X3](=[OX1])[#6]', 'a ketone: C=O between two carbons (a quinone too)'),
    ('acid',     COOH, 'a carboxylic acid'),
    ('acid',     '[#16,#15,#7,#17,#35,#5,#33,#34](=O)[OX2H1]', 'an oxoacid group: sulfonic, sulfuric, phosphoric, phosphonic, nitric, nitrous, chloric …'),
    ('acid',     '[OX2H1][#16,#15,#5,#33,#34,#14,#17,#35]', 'an OH on S, P, B, As, Se, Si, Cl or Br (sulfurous, boric, silicic, hypochlorous acid …)'),
    ('acid',     '[F,Cl,Br;H1]', 'a hydrogen halide'),
    ('amine',    AMINE_N, 'an amine nitrogen (primary, secondary or tertiary; an aniline too)'),
    ('amine',    '[NX4+;!$(N~[!#6;!#1]);$(N[#6])]', 'a quaternary ammonium on carbon'),
    ('alcohol',  '[CX4][OX2H1]', 'an OH on an sp³ carbon'),
    ('ether',    '[OX2;!$(O[#6]=[#7,#8,#16])]([#6])[#6]', 'an ether: C–O–C, neither carbon a carbonyl (an epoxide, an acetal too)'),
    ('alkene',   'C=C', 'a carbon–carbon double bond outside an aromatic ring'),
    # two structural classes the structure itself also shows, beside ChEBI's (ChEBI does not class every row; a union)
    ('amino acid', AMINE_N_H + '[CX4]' + COOH, 'an α-amino acid: a free amine (with H) on the carbon next to a carboxylic acid'),
    ('amino acid', AMINE_N_H + '[CX4][C]' + COOH, 'a β-amino acid'),
    ('amino acid', AMINE_N_H + '[CX4][C][C]' + COOH, 'a γ-amino acid (GABA, gabapentin, baclofen)'),
    ('amino acid', AMINE_N_H + '[CX4][C][C][C]' + COOH, 'a δ-amino acid (5-aminolevulinic acid)'),
    ('amino acid', AMINE_N_H + '[CX4][C][C][C][C]' + COOH, 'an ε-amino acid (aminocaproic acid, tranexamic acid)'),
]
# THE STEROID NUCLEUS: the cyclopenta[a]phenanthrene skeleton (ChEBI's own definition of a steroid; rings A, B, C six-membered, D
# five), any bonds, rings C and D not aromatic (a polycyclic aromatic hydrocarbon holds the same 6-6-6-5 shape) — and no FIFTH
# all-carbon ring of five or more atoms fused onto the four (sharing two of their atoms): a pentacyclic triterpenoid (lupeol, betulin,
# hopane) holds the four rings inside its own five.  A heterocycle fused onto ring A or D (stanozolol's pyrazole, danazol's
# isoxazole, an acetonide's dioxolane) and a cyclopropane (drospirenone) leave a steroid a steroid.
STEROID = ('[#6]1~[#6]~[#6]~[#6]2~[#6](~[#6]~1)~[#6]~[#6]~[#6;!a]1~[#6;!a]~2~[#6;!a]~[#6;!a]~[#6;!a]2~[#6;!a]~[#6;!a]~[#6;!a]~[#6;!a]~1~2',
           'the cyclopenta[a]phenanthrene nucleus, rings C and D not aromatic, no fifth all-carbon ring of ≥ 5 atoms fused onto it')
PATTERNS.append(('steroid',) + STEROID)
_COMPILED = [(t, Chem.MolFromSmarts(s), s) for t, s, _ in PATTERNS]
for _t, _p, _s in _COMPILED:
    if _p is None: raise SystemExit(f'structure_tags.py: the {_t} pattern does not parse: {_s}')
_STEROID = Chem.MolFromSmarts(STEROID[0])
PT = Chem.GetPeriodicTable()


def steroid_nucleus(mol):
    """the steroid nucleus (STEROID) with no fifth all-carbon ring of ≥ 5 atoms fused onto it"""
    rings = mol.GetRingInfo().AtomRings()
    zs = [a.GetAtomicNum() for a in mol.GetAtoms()]
    for match in mol.GetSubstructMatches(_STEROID, maxMatches=64):
        core = set(match)
        if not any(len(r) >= 5 and not set(r) <= core and len(set(r) & core) >= 2 and all(zs[i] == 6 for i in r) for r in rings):
            return True
    return False


def mol_from_atoms(atoms, charge=0):
    """the row's own atoms (Å, [[Z, x, y, z] …]) → an RDKit molecule whose bonds DetermineConnectivity reads off the distances (covalent
    radii × 1.3): for an app row PubChem has no structure for (MgH₂, the ice hexamer, the Li₄F₄ cube, closo-dodecaborate) or whose
    SMILES RDKit refuses (KrF₂)"""
    xyz = f'{len(atoms)}\n\n' + '\n'.join(f'{PT.GetElementSymbol(int(a[0]))} {a[1]} {a[2]} {a[3]}' for a in atoms) + '\n'
    m = Chem.MolFromXYZBlock(xyz)
    if m is None: return None
    rdDetermineBonds.DetermineConnectivity(m, charge=charge)
    m.UpdatePropertyCache(strict=False)
    Chem.GetSymmSSSR(m)
    return m


def inorganic(mol):
    """no carbon at all, or carbon only as the classic inorganic carbon compounds have it: a carbon with no hydrogen whose neighbours
    are all O, S, B, Si or a metal (CO, CO₂, CS₂, COS, carbonic acid, a metal carbonyl, a carbide), or the C of a terminal C≡N whose
    other neighbours are O, S or a metal (cyanide, cyanate, thiocyanate).  Urea, CCl₄ and every C–H or C–C compound are organic."""
    for a in mol.GetAtoms():
        if a.GetAtomicNum() != 6: continue
        if a.GetTotalNumHs(includeNeighbors=True): return False
        nb = [n.GetAtomicNum() for n in a.GetNeighbors() if n.GetAtomicNum() != 1]
        if all(z in (8, 16, 5, 14) or z in METALS for z in nb): continue
        cn = any(b.GetBondType() == Chem.BondType.TRIPLE and b.GetOtherAtom(a).GetAtomicNum() == 7 and b.GetOtherAtom(a).GetDegree() == 1
                 for b in a.GetBonds())
        if cn and all(z in (7, 8, 16) or z in METALS for z in nb): continue
        return False
    return True


def cage(mol):
    """a cage: at least three rings, and every ring atom in at least two of them (a closed polyhedron — adamantane, cubane, the
    fullerenes, the boranes; a fused or bridged ring system with an open edge, a steroid or morphine, is not one)"""
    ri = mol.GetRingInfo()
    if ri.NumRings() < 3: return False
    ring_atoms = {i for r in ri.AtomRings() for i in r}
    return all(ri.NumAtomRings(i) >= 2 for i in ring_atoms)


def raw_tags(mol, charge, chebi=()):
    """every word the molecule earns, before SUBSUMES and the cap"""
    t = set(w for w in chebi if w in CHEBI_WORDS)
    zs = [a.GetAtomicNum() for a in mol.GetAtoms()]
    heavy = [z for z in zs if z > 1]
    inorg = inorganic(mol)
    if charge: t.add('ion')
    if inorg: t.add('inorganic')
    if any(z in METALS for z in zs): t.add('metal')
    if any(z in HALOGENS for z in zs): t.add('halogen')
    if 15 in zs: t.add('phosphorus')
    if 16 in zs: t.add('sulfur')
    for tag, pat, _ in _COMPILED:
        if tag in t: continue
        if tag == 'steroid':
            if steroid_nucleus(mol): t.add(tag)
        elif mol.HasSubstructMatch(pat): t.add(tag)
    if (heavy and all(z == 6 for z in heavy) and not any(a.GetIsAromatic() for a in mol.GetAtoms())
            and all(b.GetBondType() == Chem.BondType.SINGLE for b in mol.GetBonds() if b.GetBeginAtom().GetAtomicNum() > 1 and b.GetEndAtom().GetAtomicNum() > 1)):
        t.add('alkane')
    ri = mol.GetRingInfo()
    if ri.NumRings():
        if cage(mol): t.add('cage')
        if not inorg and RD.CalcNumAromaticRings(mol): t.add('aromatic')
        if not inorg and any(any(zs[i] == 6 for i in r) and any(zs[i] not in (1, 6) for i in r) for r in ri.AtomRings()): t.add('heterocycle')
        if not t & {'aromatic', 'heterocycle'}: t.add('ring')
    elif not inorg and (heavy.count(6) >= 2 or not t): t.add('chain')     # an open chain of two carbons or more (one carbon: only when nothing else is said)
    if inorg: t -= {'alkane', 'heterocycle'}
    return t


def cap(t, n=4):
    """SUBSUMES, then the n most distinctive by RANK, one shape word kept (see the module's head)"""
    t = set(t)
    for w in list(t):
        if w in SUBSUMES: t -= SUBSUMES[w]
    order = sorted(t, key=lambda x: RANK[x])
    keep = order[:n]
    shape = next((s for s in SHAPE if s in t), None)
    if shape and len(order) > n and not any(s in keep for s in SHAPE): keep = keep[:n - 1] + [shape]
    return sorted(keep, key=lambda x: RANK[x])


def tags(mol, charge=0, chebi=(), n=4):
    """a molecule's tags (≤ n, ranked) — and every word it earned before the cap, for the build's numbers"""
    t = raw_tags(mol, charge, chebi)
    return cap(t, n), t


# ── THE SHAPE WORDS (iteration 014 C3) ──────────────────────────────────────────────────────────────────────────────────────────────
# A cheap model (Haiku, research/iteration-014/c-data/tags.proposed.json) PROPOSED geometry and class words over a sample of the catalogue;
# a word is ADOPTED only when RDKit can decide it from the row's own structure — its SMILES (rings, charges, marked stereocentres) and its
# own atoms (linear, planar, metal–carbon bonds) — and the test below then decides it for EVERY row, never the model.  They live in their
# own field, row['geo'] (not `tags`: the four-word cap and the shelf's themes read `tags` and must not move); the Picker shows both.
GEO = ['linear', 'planar', 'strained', 'macrocycle', 'spiro', 'bridged', 'fused', 'polycyclic', 'organometallic', 'zwitterion', 'chiral']
GEO_RULES = {
    'linear':         'every atom within 0.05 Å RMS of one line through the row\'s own atoms (≥ 2 atoms)',
    'planar':         'not linear, ≥ 3 atoms, every atom (H too) within 0.10 Å RMS of one plane through the row\'s own atoms',
    'strained':       'a ring of 3 or 4 atoms (RDKit SSSR)',
    'macrocycle':     'a ring of 12 atoms or more (RDKit SSSR)',
    'spiro':          'a spiro atom (rdMolDescriptors.CalcNumSpiroAtoms > 0)',
    'bridged':        'a bridgehead atom (rdMolDescriptors.CalcNumBridgeheadAtoms > 0)',
    'fused':          'two SSSR rings that share exactly one bond (two atoms)',
    'polycyclic':     'three rings or more (RDKit SSSR)',
    'organometallic': 'a metal (METALS) bonded to carbon in the row\'s own atoms (DetermineConnectivity)',
    'zwitterion':     'net charge 0 with a formal + and a formal − on its atoms, a nitro group\'s N⁺/O⁻ not counted',
    'chiral':         'a stereocentre the SMILES marks (@ / @@), FindMolChiralCenters without the unassigned',
}
_NITRO = Chem.MolFromSmarts('[N+](=O)[O-]')


def _spread(atoms):
    import numpy as np
    P = np.array([[float(a[1]), float(a[2]), float(a[3])] for a in atoms]); P -= P.mean(axis=0)
    s = np.linalg.svd(P, compute_uv=False) / np.sqrt(len(P))      # RMS distances along the principal axes
    return list(s) + [0.0] * (3 - len(s))


def _xyz(atoms, charge=0):
    """mol_from_atoms, the coordinates written fixed-point: RDKit's XYZ reader refuses a bare integer 0 (an app row's) and an exponent
    (1.7e-16, 3e-05 — 60-odd catalogue rows), and mol_from_atoms writes Python's repr"""
    xyz = f'{len(atoms)}\n\n' + '\n'.join(f'{PT.GetElementSymbol(int(a[0]))} {float(a[1]):.8f} {float(a[2]):.8f} {float(a[3]):.8f}' for a in atoms) + '\n'
    m = Chem.MolFromXYZBlock(xyz)
    if m is None: return None
    try: rdDetermineBonds.DetermineConnectivity(m, charge=int(charge))
    except Exception: return None
    m.UpdatePropertyCache(strict=False); Chem.GetSymmSSSR(m)
    return m


def geo_tags(smiles, atoms=None, charge=0):
    """the shape words RDKit decides for one row (GEO's order); smiles may be None (the ring words then come from the atoms' connectivity)"""
    out = set(); mol = Chem.MolFromSmiles(smiles) if smiles else None
    xyz = _xyz(atoms, charge) if atoms else None
    ring = mol if mol is not None else xyz
    if atoms and len(atoms) >= 2:
        s = _spread(atoms)
        if s[1] < 0.05: out.add('linear')
        elif len(atoms) >= 3 and s[2] < 0.10: out.add('planar')
    if ring is not None:
        rings = [set(r) for r in ring.GetRingInfo().AtomRings()]
        if any(len(r) in (3, 4) for r in rings): out.add('strained')
        if any(len(r) >= 12 for r in rings): out.add('macrocycle')
        if len(rings) >= 3: out.add('polycyclic')
        if any(len(a & b) == 2 for i, a in enumerate(rings) for b in rings[i + 1:]): out.add('fused')
        try:
            if RD.CalcNumSpiroAtoms(ring): out.add('spiro')
            if RD.CalcNumBridgeheadAtoms(ring): out.add('bridged')
        except Exception: pass
    if xyz is not None and any((b.GetBeginAtom().GetAtomicNum() in METALS and b.GetEndAtom().GetAtomicNum() == 6)
                               or (b.GetEndAtom().GetAtomicNum() in METALS and b.GetBeginAtom().GetAtomicNum() == 6) for b in xyz.GetBonds()):
        out.add('organometallic')
    if mol is not None:
        nitro = {i for m in mol.GetSubstructMatches(_NITRO) for i in m}
        q = [a.GetFormalCharge() for a in mol.GetAtoms() if a.GetIdx() not in nitro]
        if not int(charge) and any(c > 0 for c in q) and any(c < 0 for c in q): out.add('zwitterion')
        if Chem.FindMolChiralCenters(mol, includeUnassigned=False, useLegacyImplementation=False): out.add('chiral')
    return [w for w in GEO if w in out]


def annotate_geo(molecules):
    """row['geo'] for every row (dropped when empty); the counts per word"""
    import collections
    n = collections.Counter()
    for m in molecules:
        m.pop('geo', None)
        try: g = geo_tags(m.get('smiles'), m.get('atomsAng'), m.get('charge') or 0)
        except Exception: g = []
        if g: m['geo'] = g; n.update(g)
    return dict(n)


if __name__ == '__main__':
    # python -I structure_tags.py --adopt PROPOSED.json --candidates IN.json [--out OUT.json] [--report REPORT.json]
    import json, os, sys
    from rdkit import RDLogger; RDLogger.DisableLog('rdApp.*')
    arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
    prop, src = json.load(open(arg('--adopt'))), arg('--candidates'); dst, rep = arg('--out', src), arg('--report')
    doc = json.load(open(src)); rows = doc['molecules']
    asked = [w for w in prop.get('vocabulary', []) if w in GEO]                # ADOPTED: proposed by the model AND decidable here
    counts = annotate_geo(rows); by = {m['id']: m for m in rows}
    for m in rows:
        g = [w for w in m.pop('geo', []) if w in asked]
        if g: m['geo'] = g
    agree = {}
    for w in asked:
        tp = fp = fn = 0
        for i, ws in prop['rows'].items():
            if i not in by: continue
            p, r = w in ws, w in by[i].get('geo', [])
            tp += p and r; fp += p and not r; fn += r and not p
        agree[w] = {'both': tp, 'modelOnly': fp, 'rdkitOnly': fn}
    waiting = {i: [w for w in ws if w not in by.get(i, {}).get('geo', [])] for i, ws in prop['rows'].items()}
    waiting = {i: ws for i, ws in waiting.items() if ws}
    tmp = dst + '.tmp'
    with open(tmp, 'w') as f: json.dump(doc, f, ensure_ascii=False)
    os.replace(tmp, dst)
    out = {'adopted': asked, 'rules': {w: GEO_RULES[w] for w in asked}, 'notAdopted': [w for w in prop.get('vocabulary', []) if w not in GEO],
           'extraWords (wait for Josh)': prop.get('extraWords', {}), 'rows': len(rows), 'perWord': {w: counts.get(w, 0) for w in asked},
           'agreementOnTheSample': agree, 'waiting (the model said it, RDKit did not)': waiting}
    if rep:
        with open(rep, 'w') as f: json.dump(out, f, ensure_ascii=False, indent=1)
    print(json.dumps({k: out[k] for k in ('adopted', 'notAdopted', 'perWord', 'agreementOnTheSample')}, ensure_ascii=False))
