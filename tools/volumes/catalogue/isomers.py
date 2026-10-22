"""isomers.py — A ROW'S ISOMERS AND ITS BONDS (iteration 014 C2), from the catalogue alone (no network).

  ISOMERS: rows of the same formula and charge whose InChIKey FIRST block (the connectivity) differs — structural isomers.  Rows that
    share a first block differ only in stereo, isotopes or protonation and are not isomers here (enantiomers are not catalogued; the
    stage's FLIP mirrors a view).  row['isomers'] = the other rows' ids in the catalogue's priority order, written only when there is one.
  BONDS: row['bonds'] = [[i, j, order], …] over the row's OWN atom order (atomsAng — the order the solver solves and the .lwm carries),
    i < j, order 1 · 2 · 3, or 1.5 for an aromatic bond (RDKit's model).  The connectivity is RDKit's DetermineConnectivity on the row's
    atoms; the orders come from its SMILES as a template (AllChem.AssignBondOrdersFromTemplate, hydrogens included — the template must
    match the connectivity atom for atom, H for H, so a geometry that disagrees with its SMILES gets no bonds rather than wrong ones), else from
    the geometry alone (rdDetermineBonds.DetermineBondOrders, xyz2mol); a bond to hydrogen is 1.  A row neither reads (no atoms, one
    atom, a charge RDKit cannot place) has no `bonds`, and the app falls back to its distance rule.

  python -I tools/volumes/catalogue/isomers.py IN.json [--out OUT.json]     annotate a candidates file (default: in place)
build.py calls annotate() on its rows before it writes them.
"""
import collections, json, os, sys
from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem, rdDetermineBonds
RDLogger.DisableLog('rdApp.*')
PT = Chem.GetPeriodicTable()


def isomer_lists(molecules):
    """{ id: [ids] } — same formula and charge, another InChIKey first block; in the rows' order (the catalogue's priority)"""
    groups = collections.defaultdict(list)
    for m in molecules:
        k = m.get('inchikey') or ''
        if m.get('formula') and len(k) >= 14: groups[(m['formula'], int(m.get('charge') or 0))].append((k[:14], m['id']))
    out = {}
    for rows in groups.values():
        if len({b for b, _ in rows}) < 2: continue
        for b, i in rows: out[i] = [j for c, j in rows if c != b]
    return out


def _order(b):
    if b.GetIsAromatic(): return 1.5
    return {Chem.BondType.SINGLE: 1, Chem.BondType.DOUBLE: 2, Chem.BondType.TRIPLE: 3}.get(b.GetBondType(), 1)


def bonds_of(atoms, smiles=None, charge=0):
    """[[i, j, order]] over the atoms' own order, or None"""
    if not atoms or len(atoms) < 2: return None
    xyz = f'{len(atoms)}\n\n' + '\n'.join(f'{PT.GetElementSymbol(int(a[0]))} {float(a[1]):.8f} {float(a[2]):.8f} {float(a[3]):.8f}' for a in atoms) + '\n'   # floats always: RDKit's XYZ reader refuses a bare integer coordinate (an app row's 0)
    m = Chem.MolFromXYZBlock(xyz)
    if m is None: return None
    try: rdDetermineBonds.DetermineConnectivity(m, charge=int(charge))
    except Exception: return None
    order = {}
    if smiles:
        try:   # the template WITH its hydrogens, so an OH's oxygen is never handed the S=O of its neighbour (sulfuric acid)
            tpl = Chem.MolFromSmiles(smiles)
            if tpl is not None:
                tpl = Chem.AddHs(tpl)
                if tpl.GetNumAtoms() == m.GetNumAtoms() and tpl.GetNumBonds() == m.GetNumBonds():
                    got = AllChem.AssignBondOrdersFromTemplate(tpl, Chem.Mol(m))
                    for b in got.GetBonds(): order[(b.GetBeginAtomIdx(), b.GetEndAtomIdx())] = _order(b)
        except Exception: order = {}
    if not order and m.GetNumBonds():
        try:
            g = Chem.Mol(m); rdDetermineBonds.DetermineBondOrders(g, charge=int(charge))
            Chem.SanitizeMol(g)
            for b in g.GetBonds(): order[(b.GetBeginAtomIdx(), b.GetEndAtomIdx())] = _order(b)
        except Exception: order = {}
    if not order and not any(a.GetAtomicNum() == 1 for a in m.GetAtoms()) and m.GetNumAtoms() > 2: return None
    out = []
    for b in m.GetBonds():
        i, j = sorted((b.GetBeginAtomIdx(), b.GetEndAtomIdx()))
        z = (m.GetAtomWithIdx(i).GetAtomicNum(), m.GetAtomWithIdx(j).GetAtomicNum())
        o = 1 if 1 in z else order.get((i, j), order.get((j, i)))
        if o is None: return None                                  # a heavy bond the orders did not reach: none rather than a guess
        out.append([i, j, o])
    return sorted(out) or None


def annotate(molecules):
    """sets row['isomers'] and row['bonds'] in place (dropping stale ones); returns the counts"""
    iso = isomer_lists(molecules); n = collections.Counter()
    for m in molecules:
        m.pop('isomers', None); m.pop('bonds', None)
        if m['id'] in iso: m['isomers'] = iso[m['id']]; n['withIsomers'] += 1
        b = bonds_of(m.get('atomsAng'), m.get('smiles'), m.get('charge') or 0)
        if b: m['bonds'] = b; n['withBonds'] += 1; n['aromatic'] += any(x[2] == 1.5 for x in b)
        elif m.get('atomsAng'): n['noBonds'] += 1
    n['groups'] = len({(m['formula'], int(m.get('charge') or 0)) for m in molecules if m['id'] in iso})
    return dict(n)


if __name__ == '__main__':
    src = sys.argv[1]; dst = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else src
    doc = json.load(open(src)); counts = annotate(doc['molecules'])
    tmp = dst + '.tmp'
    with open(tmp, 'w') as f: json.dump(doc, f, ensure_ascii=False)     # common.write_json's form, without importing common (its cache dir)
    os.replace(tmp, dst)
    print(json.dumps({'rows': len(doc['molecules']), **counts}))
