"""guards.py — THE TWO GUARDS of the catalogue (iteration 006, row C2 THE FULL CATALOGUE), used by build.py and check.py.

The solver (tools/volumes/solve.py) names a molecule's raw directory by the candidate's id and starts a molecule over whenever its
atoms move (meta.json's atomsBohr ≠ the candidate's).  A rebuilt catalogue must therefore never move a solved molecule by accident
and never re-point an id at another molecule:

(a) A SOLVED MOLECULE KEEPS ITS GEOMETRY.  A row whose id has a converged rung under raw/<id>/ keeps the exact atoms it was solved
    at — raw/<id>/meta.json's candidate.atomsAng, accepted only when it reproduces the solver's own atomsBohr bit for bit (the
    solver's test: float(Å) × ANGSTROM == atomsBohr) and only for the same InChIKey — even when PubChem's conformer has since
    arrived.  build.py --refresh-geometry (iteration 006 C3, Josh's yes to the upgrade) lifts it for exactly one kind of row — a
    solved row on a local geometry (never an app row) whose PubChem conformer exists and gives atoms that differ — and lists them in
    its stats (guards.solvedRowsMoved); verify() and pin() take that list, so nothing else may move and those rows stay moved.
(b) IDS ARE STABLE.  A row keeps the id the previous candidates file gave its InChIKey (the app's own: its app id); a new row whose
    InChIKey was solved under some id in raw/ takes that id; every other new row takes its slug, suffixed (-2, -3 …) past every id
    already taken — the previous file's, raw/'s and this run's — so an old id never moves and never names another molecule.

  python -I tools/volumes/catalogue/guards.py --pin FILE [--raw DIR]
      re-apply (a) to a built file against raw/ as it is NOW (run it with the solvers stopped, just before the swap: a molecule
      that got its first rung between the build and the stop is then pinned too); it rewrites FILE (tmp, then rename) only if a row moved
"""
import json, os, sys

ANGSTROM = 1 / 0.52917721092          # bohr per ångström — tools/volumes/lwbasis.py's ANGSTROM, the very float the solver multiplies by
ID_OK = lambda s: isinstance(s, str) and 0 < len(s) <= 80 and all(c.isalnum() or c in '._+-' for c in s) and not s.startswith('.')  # solve.py's


def raw_dir(catalogue_dir):
    """the solver's raw directory: $LW_VOLUMES/raw, else the catalogue's sibling raw/ (~/Documents/LAMBDAWAVES-VOLUMES/raw)"""
    vol = os.environ.get('LW_VOLUMES') or os.path.dirname(os.path.abspath(catalogue_dir))
    return os.path.join(vol, 'raw')


def bohr(atoms_ang):
    """exactly what solve.py's queue() computes from a candidate's atomsAng"""
    return [[int(a[0]), float(a[1]) * ANGSTROM, float(a[2]) * ANGSTROM, float(a[3]) * ANGSTROM] for a in atoms_ang]


def solved(raw):
    """{id: {...}} for every raw/<id>/ whose meta.json records at least one converged rung.  `exact` says whether the candidate's
    own atomsAng reproduces the solved atomsBohr bit for bit (only then can a candidate file hand the solver those atoms again)."""
    out = {}
    if not os.path.isdir(raw): return out
    for d in sorted(os.listdir(raw)):
        mp = os.path.join(raw, d, 'meta.json')
        if not os.path.isfile(mp): continue
        try:
            with open(mp) as f: meta = json.load(f)                   # the solver writes tmp-then-rename: a read is never torn
        except (OSError, ValueError): continue
        conv = [b for b, r in (meta.get('rungs') or {}).items() if r.get('status') == 'converged']
        if not conv: continue
        cand = meta.get('candidate') or {}
        ang = cand.get('atomsAng')
        exact = bool(ang) and bohr(ang) == meta.get('atomsBohr')
        out[d] = {'inchikey': cand.get('inchikey'), 'app': cand.get('app'), 'atomsAng': ang if exact else None,
                  'atomsBohr': meta.get('atomsBohr'), 'geometrySource': cand.get('geometrySource'), 'rungs': conv, 'exact': exact}
    return out


def previous(path):
    """the previous candidates file: (rows by id, {InChIKey: id}, {app id: id}); empty when there is none"""
    if not path or not os.path.isfile(path): return {}, {}, {}
    with open(path) as f: rows = json.load(f)['molecules']
    by_id = {m['id']: m for m in rows}
    return by_id, {m['inchikey']: m['id'] for m in rows if m.get('inchikey')}, {m['app']: m['id'] for m in rows if m.get('app')}


def raw_ids_by_key(S, prev_by_id):
    """{InChIKey: id} — the id a solved InChIKey lives under in raw/, never one the previous file gave another molecule;
    when one InChIKey was solved under several ids (the pilot's 'adrenaline', the catalogue's 'epinephrine') the previous
    file's id wins, then the first in sorted order"""
    out = {}
    for i, s in sorted(S.items()):
        k = s['inchikey']
        if not k: continue
        p = prev_by_id.get(i)
        if p is not None and p.get('inchikey') != k: continue
        if k not in out or (p is not None and prev_by_id.get(out[k]) is None): out[k] = i
    return out


def pin(doc, S, chosen=()):
    """apply (a) to a built candidates doc in place; returns the ids whose atoms were put back.  `chosen`: the rows a
    --refresh-geometry build moved on purpose (its stats' guards.solvedRowsMoved) — they are left where the build put them"""
    moved, chosen = [], set(chosen or ())
    for m in doc['molecules']:
        s = S.get(m['id'])
        if not s or not s['exact'] or s['inchikey'] != m.get('inchikey') or m['id'] in chosen: continue
        if bohr(m['atomsAng']) == s['atomsBohr']: continue
        m['atomsAng'] = s['atomsAng']
        if s['geometrySource']: m['geometrySource'] = s['geometrySource']
        m['nAtoms'], m['heavy'] = len(s['atomsAng']), sum(1 for a in s['atomsAng'] if a[0] > 1)
        moved.append(m['id'])
    return moved


def pubchem_based(src):
    """a geometry source that is PubChem's 3-D conformer, or a GFN2-xTB relaxation started from it (build.py's own words)"""
    return bool(src) and (src.startswith('PubChem') or "from PubChem's 3-D conformer" in src)


def verify(doc, prev_by_id, S, excluded=None, allow_moved=()):
    """the proof of both guards: ([(kind, complaint)], [note]).  `excluded`: the new build's exclusion rows, so a previous row that
    a SAFETY SCREEN now refuses is named as such (the screen wins over the id guard) instead of passing unremarked.
    `allow_moved`: the ids a --refresh-geometry build chose to move (its stats' guards.solvedRowsMoved) — each must have moved, onto
    a PubChem-based geometry, and must not be an app row; a solved row that moved and is NOT listed is still a complaint"""
    allow_moved = set(allow_moved or ())
    bad, notes = [], []
    rows = {m['id']: m for m in doc['molecules']}
    screened = {}
    for e in (excluded or []):
        if e.get('screen') and e.get('key'): screened.setdefault(e['key'], e)
    missing = [i for i in prev_by_id if i not in rows]
    for i in missing:
        p = prev_by_id[i]
        hit = screened.get(p.get('inchikey'))
        if hit: notes.append(f'previous row {i} ({p.get("name")}) is now REFUSED by the {hit["screen"]} screen: {hit["why"][:120]}')
        else: bad.append(('guard (b): a previous id is missing', f'{i} ({p.get("name")}, {p.get("inchikey")})'))
    same = 0
    for i, p in prev_by_id.items():
        m = rows.get(i)
        if m is None: continue
        if m.get('inchikey') == p.get('inchikey'): same += 1
        else: bad.append(('guard (b): a previous id now names another molecule', f'{i}: {p.get("inchikey")} → {m.get("inchikey")}'))
    kept = moved = 0
    for i, m in rows.items():
        if not ID_OK(i): bad.append(('an id the solver will not take as a file name', repr(i)))
        s = S.get(i)
        if not s: continue
        if s['inchikey'] != m.get('inchikey'):
            bad.append(("guard (b): an id points at another molecule's solve in raw/", f'{i} names {m.get("inchikey")}, raw/{i}/ holds {s["inchikey"]}')); continue
        if bohr(m['atomsAng']) == s['atomsBohr']:
            kept += 1
            if i in allow_moved: bad.append(('--refresh-geometry: a listed row did not move', i))
        elif i in allow_moved:
            moved += 1
            if m.get('app'): bad.append(('--refresh-geometry: an app-pinned row moved', i))
            if not pubchem_based(m.get('geometrySource')): bad.append(('--refresh-geometry: a moved row is not on PubChem\'s conformer', f'{i}: {str(m.get("geometrySource"))[:80]}'))
        elif s['exact']: bad.append(('guard (a): a solved row moved (the solver would start it over)', f'{i} ({",".join(s["rungs"])})'))
        else: notes.append(f'{i}: solved, but its solved atoms are not reproducible from any Å list on record, so it will be solved again')
    for i in sorted(allow_moved - set(rows)): bad.append(('--refresh-geometry: a listed row is not in the file', i))
    for i in sorted(allow_moved & set(rows) - set(S)): bad.append(('--refresh-geometry: a listed row has no solve in raw/', i))
    seen = {}
    for m in doc['molecules']:
        k = m.get('inchikey')
        if k and k in seen: bad.append(('an InChIKey under two ids', f'{k}: {seen[k]} and {m["id"]}'))
        if k: seen[k] = m['id']
    orphans = sorted(set(S) - set(rows))
    notes.insert(0, f'{same}/{len(prev_by_id)} previous ids present with the same InChIKey · {kept}/{sum(1 for i in rows if i in S)} rows '
                    f'solved in raw/ at exactly their solved atoms' + (f' · {moved}/{len(allow_moved)} listed solved rows MOVED onto PubChem\'s conformer (--refresh-geometry)' if allow_moved else '')
                    + (f' · {len(orphans)} solved ids in raw/ the file does not carry: ' + ', '.join(orphans[:20]) if orphans else ''))
    return bad, notes


if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(__file__))
    import collections
    from common import DATA, write_json, sibling
    path = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == '--pin' and i + 1 < len(sys.argv)), None)
    if not path: raise SystemExit(__doc__)
    raw = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == '--raw' and i + 1 < len(sys.argv)), None) or raw_dir(DATA)
    with open(path) as f: doc = json.load(f)
    S = solved(raw)
    sp0 = sibling(path, 'stats')                                     # a --refresh-geometry build's chosen rows stay moved
    chosen = (json.load(open(sp0)).get('guards') or {}).get('solvedRowsMoved', []) if os.path.exists(sp0) else []
    moved = pin(doc, S, chosen)
    if moved:
        write_json(path, doc)
        sp = sibling(path, 'stats')                                  # keep the report's geometry counts true to the pinned file
        if os.path.exists(sp):
            with open(sp) as f: st = json.load(f)
            kind = lambda g: ('app pinned' if g.startswith("the app's own") else 'PubChem 3-D conformer' if g.startswith('PubChem')
                              else 'GFN2-xTB' if 'GFN2-xTB' in g else 'RDKit ETKDGv3 + MMFF94')
            st['byGeometry'] = dict(collections.Counter(kind(m['geometrySource']) for m in doc['molecules']).most_common())
            st.setdefault('guards', {})['pinnedAtSwap'] = sorted(set(st.get('guards', {}).get('pinnedAtSwap', [])) | set(moved))
            write_json(sp, st, indent=1)
    print(f'pin: {len(S)} molecules with a solved rung in {raw} · {len(moved)} rows put back to their solved atoms' + (': ' + ', '.join(moved) if moved else '')
          + (f' · {len(chosen)} rows --refresh-geometry moved on purpose left as built' if chosen else ''))
