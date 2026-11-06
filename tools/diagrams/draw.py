#!/usr/bin/env python3
"""tools/diagrams/draw.py — THE DIAGRAMS (037 D1 · D4): a chemist's perspective diagram of every molecule, drawn by RDKit from the
molecule's own coordinates (tools/diagrams/dump.mjs writes them; README.md has the commands).

  draw.py tools/diagrams/catalogue.json     → lab/img/menu/<id>.diagram.svg (one file per catalogue molecule; DATA, never precached)
  draw.py tools/diagrams/vol-3.json         → <shelf>/dist/vol-3/t/diagrams-<page>.json  { id: "<the SVG's inner markup>" } per page
                                              and <shelf>/dist/vol-3/t/pages.json's `diagrams` (the pages written; tools/volume-thumbs.mjs
                                              writes `sheets` in the same file)

THE DRAWING (IUPAC Recommendations 2006, Brecher, "Graphical representation of stereochemical configuration"):
  · a molecule of one or two heavy atoms (H₂, H₂O, NH₃, CH₄, C₂H₆, CH₃OH …) is drawn IN PERSPECTIVE, every atom shown: the view is the one
    that spreads its atoms most (no two atoms fall together), and a bond leaving the paper by more than 20° is a wedge — solid toward
    the reader, hashed away — its narrow end at the central atom;
  · a larger one is the SKELETAL formula: carbons implicit, hydrogens only on heteroatoms (OH, NH₂), RDKit's 2-D layout, and a wedge at
    every stereocentre (its configuration from the 3-D coordinates, or from the volume's PubChem SMILES).
  The bonds come from the volume's SMILES or its bond table when the record carries them, else rdDetermineBonds from the coordinates and
  the molecule's charge (bond orders and formal charges by the xyz2mol rules; connectivity alone when no Lewis structure fits).
THE ACCEPTANCE RULE (038 D1): a drawing is kept at ≤ 2 crossings and no clash (quality()); what no layout draws cleanly — a cage no
  plane holds (C₆₀, dodecahedrane), a lettered cluster (B₁₂H₁₂²⁻, Li₄F₄), a neutral cluster (the ice hexamer) — is THE INK STICKS (038 D2,
  sticks()): its 3-D skeleton, no letters, depth-cued. Each run prints the count by road and names the molecules that took the sticks.
THE INK: every colour is `currentColor` and the letters are drawn as outlines in the app's UI face (lab/fonts/Roboto-ui.woff2 at
  weight 500), so one file serves both themes: the app draws it as a mask in the tile's own ink (lab/picker-fx.js setPic). 160 × 160
  viewBox, no background, no size. """
import hashlib, json, math, os, re, sys, tempfile
import numpy as np
from rdkit import Chem, RDLogger
from rdkit.Chem import rdDepictor, rdDetermineBonds
from rdkit.Chem.Draw import rdMolDraw2D
from rdkit.Geometry import Point3D

RDLogger.DisableLog('rdApp.*')
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
MENU = os.path.join(ROOT, 'lab', 'img', 'menu')
SHELF = os.path.join(os.environ.get('LW_VOLUMES', os.path.expanduser('~/Documents/LAMBDAWAVES-VOLUMES')), 'dist')
SIZE = 160

def ui_face():
    """the UI face as a static TTF RDKit's FreeType can read (the woff2 instanced at weight 500), cached beside the venv"""
    out = os.path.join(HERE, '.venv', 'roboto-500.ttf')
    if not os.path.exists(out):
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        f = TTFont(os.path.join(ROOT, 'lab', 'fonts', 'Roboto-ui.woff2'))
        f = instantiateVariableFont(f, {'wght': 500}) if 'fvar' in f else f
        f.flavor = None; f.save(out)
    return out

def xyz_mol(rec):
    rw = Chem.RWMol()
    for Z, *_ in rec['ang']:
        a = Chem.Atom(int(Z)); a.SetNoImplicit(True); rw.AddAtom(a)
    conf = Chem.Conformer(len(rec['ang']))
    for i, (_, x, y, z) in enumerate(rec['ang']): conf.SetAtomPosition(i, Point3D(x, y, z))
    m = rw.GetMol(); m.AddConformer(conf, assignId=True)
    return m

# the metals: a bond between two of them is not drawn (Li₄F₄ is a cube of Li–F edges), and a complex's ligands get their bond orders alone
METALS = set(range(3, 5)) | set(range(11, 14)) | set(range(19, 32)) | set(range(37, 51)) | set(range(55, 85)) | set(range(87, 119))
ORDER = {1: Chem.BondType.SINGLE, 1.5: Chem.BondType.AROMATIC, 2: Chem.BondType.DOUBLE, 3: Chem.BondType.TRIPLE}

def bonded(rec):
    """(the molecule with its bonds and all its hydrogens on its 3-D conformer, whether a Lewis structure was found).  The coordinates and
    the charge first (orders and formal charges by the xyz2mol rules); else the volume's bond table; else the connectivity, with the
    ligands' orders found with the metals set aside (Cr–C≡O) and the charges left off"""
    m, charge = xyz_mol(rec), int(rec.get('charge') or 0)
    try:
        rdDetermineBonds.DetermineBonds(m, charge=charge); Chem.SanitizeMol(m); return m, True
    except Exception:
        pass
    if (sum(int(a[0]) for a in rec['ang']) - charge) % 2:   # a radical (NO, NO₂, OH, CH₃): its anion's bonds (N=O, O=N–O), the charges left off
        m = xyz_mol(rec)
        try:
            rdDetermineBonds.DetermineBonds(m, charge=charge - 1)
            for a in m.GetAtoms(): a.SetFormalCharge(0)
            m.UpdatePropertyCache(strict=False); Chem.SanitizeMol(m, Chem.SanitizeFlags.SANITIZE_ALL ^ Chem.SanitizeFlags.SANITIZE_PROPERTIES, catchErrors=True)
            return m, True
        except Exception:
            pass
    m = xyz_mol(rec)
    rw = Chem.RWMol(m)
    if rec.get('bonds'):
        for i, j, o in rec['bonds']: rw.AddBond(int(i), int(j), ORDER.get(o, Chem.BondType.SINGLE))
        lewis = True
    else:
        rdDetermineBonds.DetermineConnectivity(rw); lewis = False
        metal = lambda a: a.GetAtomicNum() in METALS
        for b in list(rw.GetBonds()):
            if metal(b.GetBeginAtom()) and metal(b.GetEndAtom()): rw.RemoveBond(b.GetBeginAtomIdx(), b.GetEndAtomIdx())
        keep = [a.GetIdx() for a in rw.GetAtoms() if not metal(a)]
        if 0 < len(keep) < rw.GetNumAtoms():
            frag = Chem.RWMol(rw)
            for k in sorted(set(range(rw.GetNumAtoms())) - set(keep), reverse=True): frag.RemoveAtom(k)
            try:
                rdDetermineBonds.DetermineBondOrders(frag, charge=charge, allowChargedFragments=True)
                for bf in frag.GetBonds(): rw.GetBondBetweenAtoms(keep[bf.GetBeginAtomIdx()], keep[bf.GetEndAtomIdx()]).SetBondType(bf.GetBondType())
            except Exception:
                pass
    m = rw.GetMol()
    m.UpdatePropertyCache(strict=False)
    Chem.SanitizeMol(m, Chem.SanitizeFlags.SANITIZE_ALL ^ Chem.SanitizeFlags.SANITIZE_PROPERTIES ^ Chem.SanitizeFlags.SANITIZE_KEKULIZE, catchErrors=True)
    return m, lewis

def fib(n):
    """n view directions spread over the half sphere (a view and its opposite draw mirror images)"""
    k = np.arange(n) + 0.5; z = k / n; r = np.sqrt(1 - z * z); t = math.pi * (1 + 5 ** 0.5) * k
    return np.stack([r * np.cos(t), r * np.sin(t), z], 1)

def perspective(m):
    """2-D coordinates for every atom from the view that spreads them most (two heavy atoms: their bond stays in the paper's plane), and
    the wedges by depth"""
    X = np.array(m.GetConformer().GetPositions()); n = len(X)
    H = [a.GetIdx() for a in m.GetAtoms() if a.GetAtomicNum() > 1]
    if len(H) == 2 and np.linalg.norm(X[H[1]] - X[H[0]]) > 0:   # the views square to the backbone
        b = (X[H[1]] - X[H[0]]) / np.linalg.norm(X[H[1]] - X[H[0]]); e1 = np.cross(b, [0.0, 0.0, 1.0] if abs(b[2]) < 0.9 else [1.0, 0.0, 0.0]); e1 /= np.linalg.norm(e1); e2 = np.cross(b, e1)
        views = [math.cos(t) * e1 + math.sin(t) * e2 for t in np.linspace(0, math.pi, 360, endpoint=False)]
    else: views = fib(600)
    best, bn = -1, None
    for v in views:
        u = np.cross(v, [0.0, 0.0, 1.0] if abs(v[2]) < 0.9 else [1.0, 0.0, 0.0]); u /= np.linalg.norm(u); w = np.cross(v, u)
        P = X @ np.stack([u, w], 1)
        d = min((np.linalg.norm(P[i] - P[j]) for i in range(n) for j in range(i + 1, n)), default=1.0)
        if d > best + 1e-6: best, bn = d, (v, u, w)
    v, u, w = bn
    P = X @ np.stack([u, w], 1); P -= P.mean(0)
    if n > 1:   # the long axis across the page
        e, V = np.linalg.eigh(np.cov(P.T)); P = P @ V[:, ::-1]
    depth = X @ v
    if len(H) <= 2:   # the textbook's licence: each hydrogen at its full length, its direction the projection's, splayed ≥ 40° from its neighbours
        for c in H:
            nb = [x.GetIdx() for x in m.GetAtomWithIdx(c).GetNeighbors()]
            ang = {k: math.atan2(P[k][1] - P[c][1], P[k][0] - P[c][0]) for k in nb}
            free = [k for k in nb if m.GetAtomWithIdx(k).GetAtomicNum() == 1 and m.GetAtomWithIdx(k).GetDegree() == 1]
            for _ in range(60):
                order = sorted(nb, key=lambda k: ang[k])
                for a, b in zip(order, order[1:] + order[:1]):
                    gap = (ang[b] - ang[a]) % (2 * math.pi) if len(nb) > 1 else 7
                    if gap < math.radians(40):
                        push = (math.radians(40) - gap) / (2 if a in free and b in free else 1)
                        if a in free: ang[a] -= push
                        if b in free: ang[b] += push
            for k in free:
                L = np.linalg.norm(X[k] - X[c]); P[k] = P[c] + L * np.array([math.cos(ang[k]), math.sin(ang[k])])
    rw = Chem.RWMol(m)
    for b in list(m.GetBonds()):
        i, j = b.GetBeginAtomIdx(), b.GetEndAtomIdx(); L = np.linalg.norm(X[j] - X[i])
        if L == 0 or abs(depth[j] - depth[i]) / L < math.sin(math.radians(20)): continue
        heavy = lambda k: (m.GetAtomWithIdx(k).GetAtomicNum() > 1, m.GetAtomWithIdx(k).GetDegree())
        a, z = (i, j) if heavy(i) >= heavy(j) else (j, i)   # the narrow end at the central atom
        t = b.GetBondType(); rw.RemoveBond(i, j); rw.AddBond(a, z, t)
        rw.GetBondBetweenAtoms(a, z).SetBondDir(Chem.BondDir.BEGINWEDGE if depth[z] > depth[a] else Chem.BondDir.BEGINDASH)
    m2 = rw.GetMol()
    for at in m2.GetAtoms():   # in perspective every atom is named, the carbon too
        if at.GetAtomicNum() == 6: at.SetProp('atomLabel', 'C')
    c = Chem.Conformer(n)
    for k in range(n): c.SetAtomPosition(k, Point3D(float(P[k][0]), float(P[k][1]), 0.0))
    m2.RemoveAllConformers(); m2.AddConformer(c, assignId=True)
    return m2

def quality(m, every=False):
    """038 D1 · THE ACCEPTANCE RULE: (crossings, clashes) of a 2-D drawing, in units of its median bond L. A crossing is two bonds that share
    no atom and whose segments cross. A clash is two atoms nearer than 0.4 L, an atom on a bond not its own (within 0.2 L), two letters
    nearer than half a bond, or a crossing at a lettered atom's bond (a line through a letter). Lettered: every atom in perspective
    (`every`), every atom but carbon in the skeletal formula"""
    P = np.array(m.GetConformer().GetPositions())[:, :2]; n = len(P)
    B = np.array([(b.GetBeginAtomIdx(), b.GetEndAtomIdx()) for b in m.GetBonds()], dtype=int).reshape(-1, 2)
    if not len(B): return 0, 0
    lab = np.array([every or a.GetAtomicNum() != 6 for a in m.GetAtoms()])
    A, Z = P[B[:, 0]], P[B[:, 1]]; d = Z - A
    L = float(np.median(np.linalg.norm(d, axis=1))) or 1.0
    side = lambda p, q, r: np.sign(np.round(((q[..., 0] - p[..., 0]) * (r[..., 1] - p[..., 1]) - (q[..., 1] - p[..., 1]) * (r[..., 0] - p[..., 0])) / (L * L), 6))
    a1, z1, a2, z2 = A[:, None], Z[:, None], A[None], Z[None]
    i1, j1, i2, j2 = B[:, 0][:, None], B[:, 1][:, None], B[:, 0][None], B[:, 1][None]
    X = np.triu((side(a1, z1, a2) * side(a1, z1, z2) < 0) & (side(a2, z2, a1) * side(a2, z2, z1) < 0) & (i1 != i2) & (i1 != j2) & (j1 != i2) & (j1 != j2), 1)
    bl = lab[B[:, 0]] | lab[B[:, 1]]
    D = np.linalg.norm(P[:, None] - P[None], axis=2) + np.eye(n) * 1e9
    t = ((P[:, None] - A[None]) * d[None]).sum(2) / ((d * d).sum(1)[None] + 1e-12)   # each atom's foot on each bond
    off = np.linalg.norm(P[:, None] - (A[None] + t[..., None] * d[None]), axis=2); k = np.arange(n)[:, None]
    clashes = (np.triu(D < 0.4 * L, 1).sum() + ((t > 0.05) & (t < 0.95) & (off < 0.2 * L) & (k != B[:, 0][None]) & (k != B[:, 1][None])).sum()
               + np.triu((D < 0.5 * L) & lab[:, None] & lab[None], 1).sum() + (X & (bl[:, None] | bl[None])).sum())
    for a in ([] if every else m.GetAtoms()):   # a CH₂ laid straight through (two like single bonds at > 162°): the drawer letters it 'C'
        bs = a.GetBonds()
        if a.GetAtomicNum() == 6 and len(bs) == 2 and bs[0].GetBondType() == bs[1].GetBondType() != Chem.BondType.DOUBLE:
            u, w = (P[b.GetOtherAtomIdx(a.GetIdx())] - P[a.GetIdx()] for b in bs)
            clashes += np.dot(u, w) < -0.95 * np.linalg.norm(u) * np.linalg.norm(w)
    return int(X.sum()), int(clashes)

def accepted(m, every=False):
    """a drawing is ACCEPTED at ≤ 2 crossings and no clash (the textbook cube and adamantane draw their one or two), and in one piece —
    or every piece an ion (a salt); a neutral cluster (the ice hexamer) is the ink sticks' with its hydrogen bonds"""
    fs = Chem.GetMolFrags(m, sanitizeFrags=False)
    if len(fs) > 1 and not all(any(m.GetAtomWithIdx(i).GetFormalCharge() for i in f) for f in fs): return False
    c, x = quality(m, every)
    return c <= 2 and x == 0

def skeletal(m):
    """the skeletal formula: hydrogens folded into their heavy atoms, the true stereocentres kept, CoordGen's layout (its templates are
    built in) — else RDKit's own with its ring templates (the tropanes' bridge, triethanolamine borate's cage), turned the least way that
    lays most bonds at 0°, 30°, 60° or 90°; None when neither is accepted"""
    if m.GetNumConformers() and m.GetConformer().Is3D():
        try: Chem.AssignStereochemistryFrom3D(m)
        except Exception: pass
        m = Chem.RemoveHs(m, sanitize=False)
        try: Chem.AssignStereochemistry(m, cleanIt=True, force=True)   # a bridgehead of adamantane or cubane is no stereocentre
        except Exception: pass
    rdDepictor.SetPreferCoordGen(True)
    rdDepictor.Compute2DCoords(m)
    if not accepted(m):
        rdDepictor.Compute2DCoords(m, forceRDKit=True, useRingTemplates=True)
        if not accepted(m): return None
        rdDepictor.StraightenDepiction(m, minimizeRotation=True)   # CoordGen's own layouts are straight already
    return m

def sticks(rec):
    """038 D2 · THE INK STICKS (Josh 11-06: "If something is really hard then just use no chemicals and just show the stick diagrams"): the
    molecule's 3-D skeleton, no letters — its heavy atoms (a cluster keeps its hydrogens, whose hydrogen bonds H···N/O/F under 2.2 Å are
    dashed) seen from the view whose nearest pair — two atoms, or an atom and a bond not its own — lies farthest apart (C₆₀ on a pentagon,
    B₁₂ down a triangle's axis), the long axis across, depth-cued in six bands (the nearest bonds full and 2.6 px, the farthest 28 % and
    1.2 px, thinner where the bonds are short), far first; each band one path at a tenth of a pixel"""
    m, _ = bonded(rec)
    X = np.array(m.GetConformer().GetPositions()); Zs = [a.GetAtomicNum() for a in m.GetAtoms()]
    cluster = len(Chem.GetMolFrags(m, sanitizeFrags=False)) > 1
    bonds = [(b.GetBeginAtomIdx(), b.GetEndAtomIdx()) for b in m.GetBonds()]
    keep = [i for i, z in enumerate(Zs) if z > 1]
    if cluster or not any(Zs[i] > 1 and Zs[j] > 1 for i, j in bonds): keep = list(range(len(Zs)))   # a cluster, or one heavy atom: the hydrogens too
    at = {a: k for k, a in enumerate(keep)}
    B = [(at[i], at[j], 0) for i, j in bonds if i in at and j in at]
    X, Zs = X[keep], [Zs[i] for i in keep]; n = len(keep)
    if cluster: B += [(i, j, 1) for i in range(n) if Zs[i] == 1 for j in range(n) if Zs[j] in (7, 8, 9) and not m.GetBondBetweenAtoms(keep[i], keep[j]) and np.linalg.norm(X[i] - X[j]) < 2.2]
    if not B: return None
    E = np.array([b[:2] for b in B]); k = np.arange(n)[:, None]; other = (k != E[:, 0][None]) & (k != E[:, 1][None]); iu = np.triu_indices(n, 1)
    best, bv = -1.0, None
    for v in fib(600):
        u = np.cross(v, [0.0, 0.0, 1.0] if abs(v[2]) < 0.9 else [1.0, 0.0, 0.0]); u /= np.linalg.norm(u); w = np.cross(v, u)
        P = X @ np.stack([u, w], 1); A, d = P[E[:, 0]], P[E[:, 1]] - P[E[:, 0]]
        t = np.clip(((P[:, None] - A[None]) * d[None]).sum(2) / ((d * d).sum(1)[None] + 1e-12), 0, 1)
        off = np.linalg.norm(P[:, None] - (A[None] + t[..., None] * d[None]), axis=2)
        gap = min(np.linalg.norm(P[:, None] - P[None], axis=2)[iu].min(initial=9.0), off[other].min(initial=9.0))
        if gap > best + 1e-6: best, bv = gap, (v, u, w)
    v, u, w = bv
    P = X @ np.stack([u, w], 1); depth = X @ v
    e, V = np.linalg.eigh(np.cov(P.T))
    if e[1] > 1.3 * e[0]: P = P @ V[:, ::-1]   # an elongated skeleton lies across; a round one keeps its view
    lo, hi = P.min(0), P.max(0); s = (SIZE - 28) / max(float((hi - lo).max()), 1e-6); c = (lo + hi) / 2
    xy = lambda k: (SIZE / 2 + (P[k][0] - c[0]) * s, SIZE / 2 - (P[k][1] - c[1]) * s)
    d0, d1 = depth.min(), depth.max(); near = lambda k: (depth[k] - d0) / ((d1 - d0) or 1)   # 0 far … 1 near
    Lpx = float(np.median([np.linalg.norm(X[i] - X[j]) for i, j, _ in B])) * s; f = min(1.0, max(0.5, Lpx / 24))
    bands = {}
    for i, j, hb in B:
        band = min(5, int((near(i) + near(j)) / 2 * 6)); (x1, y1), (x2, y2) = xy(i), xy(j)
        bands.setdefault((band, hb), []).append(path_d('M%.2f %.2fL%.2f %.2f' % (x1, y1, x2, y2)))
    out = []
    for (band, hb) in sorted(bands):
        q = (band + 0.5) / 6; op = ('%.2f' % (0.28 + 0.72 * q)).rstrip('0').lstrip('0'); sw = num((1.2 + 1.4 * q) * f)
        out.append("<path d='%s' stroke-opacity='%s' stroke-width='%s'%s/>" % (''.join(bands[(band, hb)]), op, sw, " stroke-dasharray='2 3'" if hb else ''))
    return "<g fill='none' stroke='currentColor' stroke-linecap='round'>" + ''.join(out) + '</g>'

def depict(rec):
    """(the inner markup, its road: 'perspective' · 'skeletal' · 'sticks'), or (None, None) for a row without coordinates"""
    if not rec.get('ang'): return None, None
    heavy = sum(1 for a in rec['ang'] if a[0] > 1)
    # the volume's PubChem SMILES (bonds, charges, stereo) — save a transition metal's complex, which PubChem writes disconnected ([Ni].[C-]#[O+]…)
    tm = '.' in (rec.get('smiles') or '') and any(21 <= a[0] <= 30 or 39 <= a[0] <= 48 or 57 <= a[0] <= 80 or 89 <= a[0] <= 112 for a in rec['ang'])
    try:
        m = Chem.MolFromSmiles(rec['smiles']) if heavy > 2 and rec.get('smiles') and not tm else None
        if m is not None: m, wedge = skeletal(m), True
        else:
            b, lewis = bonded(rec)
            if heavy <= 2 or not lewis:   # a small molecule, or one no Lewis structure fits (a complex, a cluster): every atom lettered
                m, wedge = perspective(b), False
                if not accepted(m, every=True): m = None
            else: m, wedge = skeletal(b), True
        if m is not None: return drawn(m, wedge), ('skeletal' if wedge else 'perspective')
    except Exception as e:   # a layout or drawing RDKit refuses: the sticks too, named apart in the count
        return sticks(rec), 'sticks (%s)' % type(e).__name__
    return sticks(rec), 'sticks'

def drawn(m, wedge):
    d = rdMolDraw2D.MolDraw2DSVG(SIZE, SIZE)
    o = d.drawOptions()
    o.clearBackground = False; o.useBWAtomPalette(); o.bondLineWidth = 2; o.padding = 0.07; o.fixedBondLength = 34
    o.fontFile = ui_face(); o.minFontSize = 9; o.maxFontSize = 17; o.multipleBondOffset = 0.18
    o.includeRadicals = False; o.prepareMolsBeforeDrawing = False   # prepared here, once: the drawer would add a hydrogen at every tagged centre
    try: m = rdMolDraw2D.PrepareMolForDrawing(m, kekulize=True, addChiralHs=False, wedgeBonds=wedge)
    except Exception: m = rdMolDraw2D.PrepareMolForDrawing(m, kekulize=False, addChiralHs=False, wedgeBonds=wedge)
    d.DrawMolecule(m); d.FinishDrawing()
    return inner(d.GetDrawingText())

def num(t):
    v = ('%.1f' % float(t)).rstrip('0').rstrip('.')
    return '0' if v == '-0' else v

def tenth(v):
    """a count of tenths as the shortest number: 39 → 3.9, 5 → .5, −5 → −.5, 120 → 12"""
    a = abs(v); s = str(a // 10) + ('.%d' % (a % 10) if a % 10 else '')
    if s.startswith('0.'): s = s[1:]
    return '-' + s if v < 0 else s

ARGS = {'M': 2, 'L': 2, 'Q': 4, 'C': 6}
def path_d(d):
    """a path's data at a tenth of a pixel: its first point absolute, every later one RELATIVE (the rounded absolutes differenced, so
    nothing drifts) — M77.5 82.5l-.6-.6 — so merged paths each still start where they say"""
    toks, out, k, cmd, cur, start = re.findall(r'[A-Za-z]|-?\d*\.?\d+', d), [], 0, None, None, None
    def seq(letter, vals):
        if letter == 'l' and 0 in vals: letter, vals = ('v', vals[1:]) if vals[0] == 0 else ('h', vals[:1])   # a level or a plumb line
        prev = out[-1] if out else ''
        last = next((c for c in reversed(prev) if c.isalpha()), '')
        s = prev if letter == last and letter != 'm' else letter   # a repeated command is implicit
        if s is prev: out.pop()
        for v in vals:
            t = tenth(v)
            if (s[-1].isdigit() or s[-1] == '.') and t[0] != '-': s += ' '
            s += t
        out.append(s)
    while k < len(toks):
        if toks[k].isalpha(): cmd = toks[k].upper(); k += 1
        elif cmd == 'M': cmd = 'L'   # a moveto's further pairs are linetos
        if cmd == 'Z': out.append('z'); cur = start; continue
        a = [int(round(float(t) * 10)) for t in toks[k:k + ARGS[cmd]]]; k += ARGS[cmd]
        if cur is None: seq('M', a); cur = start = (a[-2], a[-1]); continue
        seq(cmd.lower(), [v - cur[j % 2] for j, v in enumerate(a)])
        cur = (a[-2], a[-1])
        if cmd == 'M': start = cur
    return ''.join(out)

def inner(svg):
    """RDKit's SVG → the compact inner markup: colours → currentColor, the bonds' paint on one group, every path of one paint merged
    into one path, numbers to a tenth"""
    body = svg.split('<!-- END OF HEADER -->', 1)[1].rsplit('</svg>', 1)[0]
    paths, other = {}, []
    for tag, attrs in re.findall(r"<(path|ellipse|circle|rect|polygon)\b([^>]*?)/?>", body, re.S):
        a = dict(re.findall(r"([\w:-]+)='([^']*)'", attrs))
        st = dict(kv.split(':', 1) for kv in a.get('style', '').split(';') if ':' in kv)
        fill = a.get('fill') or st.get('fill', 'none')
        paint = []
        if fill != 'none': paint.append("fill='currentColor'")
        if 'fill' in a or st.get('stroke', '#000') == 'none': paint.append("stroke='none'")   # a letter's outline: filled, never stroked
        else:
            sw = num(st.get('stroke-width', '2px').rstrip('px') or 2)
            if sw != '2': paint.append("stroke-width='%s'" % sw)
        if tag == 'path': paths.setdefault(' '.join(paint), []).append(path_d(a.get('d', '')))
        else: other.append('<%s %s/>' % (tag, ' '.join(["%s='%s'" % (k, num(a[k])) for k in ('cx', 'cy', 'rx', 'ry', 'r', 'x', 'y', 'width', 'height') if k in a] + paint)))
    out = ["<path d='%s'%s/>" % (''.join(ds), (' ' + p) if p else '') for p, ds in paths.items()]
    return "<g fill='none' stroke='currentColor' stroke-width='2'>" + ''.join(out + other) + '</g>'

def svg_file(markup):
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %d %d'>%s</svg>\n" % (SIZE, SIZE, markup)

def write_atomic(path, text):
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), prefix='.tmp-'); os.write(fd, text.encode('utf-8')); os.close(fd); os.chmod(tmp, 0o644); os.replace(tmp, path)

def sheet(prefix):
    """the contact sheet of the catalogue's pictured molecules (an <id>.webp exists): the shipped files in each theme's ink on its ground"""
    import cairosvg, io
    from PIL import Image, ImageDraw
    ids = sorted(f[:-12] for f in os.listdir(MENU) if f.endswith('.diagram.svg') and os.path.exists(os.path.join(MENU, f[:-12] + '.webp')))
    cols, cap = 12, 16; rows = math.ceil(len(ids) / cols)
    for theme, ink, ground, dim in (('dark', '#f2f5f7', '#16191d', '#8a9099'), ('light', '#121a24', '#e9edf2', '#5d6670')):
        im = Image.new('RGB', (cols * SIZE, rows * (SIZE + cap)), ground); dr = ImageDraw.Draw(im)
        for k, i in enumerate(ids):
            svg = open(os.path.join(MENU, i + '.diagram.svg')).read().replace('currentColor', ink)
            t = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(), output_width=SIZE, output_height=SIZE))).convert('RGBA')
            x, y = (k % cols) * SIZE, (k // cols) * (SIZE + cap); im.paste(t, (x, y), t); dr.text((x + 6, y + SIZE), i, fill=dim)
        im.save('%s-%s.jpg' % (prefix, theme), quality=82)
    print('%d molecules → %s-dark.jpg, %s-light.jpg' % (len(ids), prefix, prefix))

def main():
    if sys.argv[1] == '--sheet': return sheet(sys.argv[2])
    src = json.load(open(sys.argv[1]))
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    roads = {}   # THE ACCEPTANCE COUNT: the molecules by road — the accepted drawings counted, every other road's molecules named
    tell = lambda: print('  ' + ' · '.join('%d %s%s' % (len(v), k, '' if k in ('perspective', 'skeletal') else ': ' + ' '.join(v)) for k, v in sorted(roads.items())))
    if isinstance(src, list):   # THE CATALOGUE
        n, total, worst = 0, 0, (0, '')
        for rec in src:
            if only and rec['id'] not in only: continue
            try: mk, road = depict(rec)
            except Exception as e: print('  ✗', rec['id'], e); continue
            if road: roads.setdefault(road, []).append(rec['id'])
            if not mk: continue
            text = svg_file(mk); write_atomic(os.path.join(MENU, rec['id'] + '.diagram.svg'), text)
            n += 1; total += len(text); worst = max(worst, (len(text), rec['id']))
        print('%d diagrams → lab/img/menu/<id>.diagram.svg, %.1f kB, the largest %s at %d B' % (n, total / 1024, worst[1], worst[0]))
        return tell()
    vol, size, mols = src['volume'], src['size'], src['molecules']   # A VOLUME: one JSON per page
    T = os.path.join(SHELF, vol, 't'); os.makedirs(T, exist_ok=True)
    pages = range(math.ceil(len(mols) / size))
    if '--page' in sys.argv: pages = [int(sys.argv[sys.argv.index('--page') + 1])]
    done, total, fails = {}, 0, []
    for p in pages:
        page = {}
        for rec in mols[p * size:(p + 1) * size]:
            try: mk, road = depict(rec)
            except Exception: mk, road = None, 'failed'
            if rec.get('ang'): roads.setdefault(road, []).append(rec['id'])
            if mk: page[rec['id']] = mk
            elif rec.get('ang'): fails.append(rec['id'])
        text = json.dumps(page, separators=(',', ':'), ensure_ascii=False)
        write_atomic(os.path.join(T, 'diagrams-%d.json' % p), text); total += len(text.encode('utf-8'))
        done[str(p)] = hashlib.sha256(text.encode('utf-8')).hexdigest()[:8]
        print('  page %d: %d diagrams, %.1f kB' % (p, len(page), len(text) / 1024), flush=True)
    """THE PAGES' MANIFEST (t/pages.json, read by lab/volumes.js): the catalogue it was made from (`index`, the shelf's indexSha256 — another
    pack's manifest is ignored), each page's ids in the index's order (named, never inferred: the page filters its rows), the diagram pages
    and the sheets (tools/volume-thumbs.mjs), each with a version `v` the page asks for (?v=), so a kept copy is never another pack's"""
    man_path = os.path.join(T, 'pages.json')
    man = json.load(open(man_path)) if os.path.exists(man_path) else {}
    if man.get('index') != src['indexSha256']: man = {}   # a new pack: every page is new
    man.update({'schema': 1, 'index': src['indexSha256'], 'tile': SIZE, 'cols': 10,
                'pages': [[r['id'] for r in mols[p * size:(p + 1) * size]] for p in range(math.ceil(len(mols) / size))]})
    man['diagrams'] = {**man.get('diagrams', {}), **done}
    man.setdefault('sheets', {})
    write_atomic(man_path, json.dumps(man, separators=(',', ':')) + '\n')
    print('%s: %d pages, %.1f kB, %d without a diagram%s' % (vol, len(done), total / 1024, len(fails), (' (' + ', '.join(fails[:8]) + ('…' if len(fails) > 8 else '') + ')') if fails else ''))
    tell()

if __name__ == '__main__':
    main()
