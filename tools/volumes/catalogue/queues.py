"""queues.py — the catalogue's unfinished molecules split into two solver queues (iteration 006 C3; Josh, 2026-10-18: "finish the ones
we have left and then save up the rest for Rent-A-GPU day").  The catalogue itself stays whole (the packer reads it); these are queues.

  python -I tools/volumes/catalogue/queues.py [--max-heavy=20] [--raw=DIR]
      → <catalogue>/vol-1.finish.json   every NOT-finished molecule with heavy ≤ --max-heavy, plus every not-finished molecule that
                                        already has a converged rung at its current atoms (a ladder half climbed is finished first)
      → <catalogue>/vol-1.gpu-day.json  every other not-finished molecule (heavy 21–50 …), for Rent-A-GPU day

Rows are the catalogue's own, byte for byte (ids unchanged); the files have the catalogue's shape ({ …, count, molecules }).
FINISHED is the solver's own test (tools/volumes/solve.py main): raw/<id>/meta.json at exactly the row's atoms (float(Å) × ANGSTROM)
with every rung its basis covers converged or refused, or failed (the solver does not retry a failed rung unless asked).  It prints
both counts and (a)'s estimated time for ONE solver: Σ over its molecules of the solver's cost (Σ over the rungs of (nAO/100)⁴) ×
raw/STATUS.json's measured secondsPerCostUnit — the same rough clock as STATUS's own ETA.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from common import DATA, read_json, write_json
import guards as GU
from lwbasis import LADDER, record, coverage, nao_cart

MAX_HEAVY = int(next((a.split('=')[1] for a in sys.argv if a.startswith('--max-heavy=')), 20))
RAW = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--raw=')), GU.raw_dir(DATA))
CAT = os.path.join(DATA, 'vol-1.candidates.json')
doc = read_json(CAT)

def state(m):
    """('finished' | 'partial' | 'untouched', the solver's cost of the whole molecule)"""
    zs = [int(a[0]) for a in m['atomsAng']]
    need = [b for b in LADDER if not coverage(record(b)[0], zs)]
    cost = sum(nao_cart(record(b)[0], zs) ** 4 for b in need) / 1e8
    mp = os.path.join(RAW, m['id'], 'meta.json')
    if not os.path.isfile(mp): return 'untouched', cost
    meta = read_json(mp)
    if meta.get('atomsBohr') != GU.bohr(m['atomsAng']): return 'untouched', cost       # the solver would start it over
    rs = meta.get('rungs') or {}
    if all((rs.get(b) or {}).get('status') in ('converged', 'refused', 'failed') for b in need): return 'finished', cost
    return ('partial' if any((rs.get(b) or {}).get('status') == 'converged' for b in need) else 'untouched'), cost

finish, gpu, n_done, partial, cost_a, cost_b = [], [], 0, [], 0.0, 0.0
for m in doc['molecules']:
    st, cost = state(m)
    if st == 'finished': n_done += 1; continue
    if st == 'partial': partial.append(m['id'])
    if m['heavy'] <= MAX_HEAVY or st == 'partial': finish.append(m); cost_a += cost
    else: gpu.append(m); cost_b += cost
keep = {k: v for k, v in doc.items() if k not in ('molecules', 'count')}
for name, rows, what in (('finish', finish, f'every not-finished molecule with heavy ≤ {MAX_HEAVY}, plus every half-climbed ladder'),
                         ('gpu-day', gpu, 'every other not-finished molecule: for Rent-A-GPU day')):
    write_json(os.path.join(DATA, f'vol-1.{name}.json'),
               {**keep, 'queue': name, 'queueOf': 'vol-1.candidates.json', 'queueWhat': what + ' (tools/volumes/catalogue/queues.py)',
                'count': len(rows), 'molecules': rows})
st = read_json(os.path.join(RAW, 'STATUS.json')) if os.path.exists(os.path.join(RAW, 'STATUS.json')) else {}
rate = ((st.get('rate') or {}).get('secondsPerCostUnit'))
print(f'catalogue {len(doc["molecules"])} · finished {n_done} · not finished {len(finish) + len(gpu)} '
      f'(half-climbed: {len(partial)}: {", ".join(partial)})')
print(f'(a) vol-1.finish.json  {len(finish)} molecules · cost {cost_a:.1f} units' +
      (f' · ≈ {cost_a * rate / 3600:.1f} h = {cost_a * rate / 86400:.2f} days for ONE solver at STATUS\'s {rate:.3f} s/unit' if rate else ''))
print(f'(b) vol-1.gpu-day.json {len(gpu)} molecules · cost {cost_b:.1f} units' +
      (f' · ≈ {cost_b * rate / 86400:.1f} days for one solver at that rate' if rate else ''))
