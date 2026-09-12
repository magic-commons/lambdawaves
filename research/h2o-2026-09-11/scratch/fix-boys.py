# fix-boys.py — B-H2O-1 gate (a): F_0..F_8 at 70 mpmath digits on the switch grid → tests/fixtures/boys-ref.json.
# Same referee as boys-ref.py: gammainc, cross-checked against hyp1f1 to 1e-60.
import json, os, mpmath as mp
mp.mp.dps = 70
MM = 8
def Fref(m, t):
    t = mp.mpf(float(t))                                    # the exact double, so JS reads the identical argument
    if t == 0: return mp.mpf(1)/(2*m+1)
    return mp.gammainc(mp.mpf(2*m+1)/2, 0, t) / (2*t**(mp.mpf(2*m+1)/2))
for m in (0, 4, 8):
    for t in ('0.3', '13.0', '300.0'):
        a = Fref(m, t); b = mp.hyp1f1(mp.mpf(2*m+1)/2, mp.mpf(2*m+3)/2, -mp.mpf(float(t)))/(2*m+1)
        assert abs(a-b) < mp.mpf(10)**-60 * max(abs(a), mp.mpf(1)), (m, t)
GRID = ['0', '1e-12', '1e-8', '0.05', '0.1', '0.25', '0.3', '0.49999999', '0.5', '0.50000001',
        '1', '2.5', '5', '7.7', '10', '13', '15', '20', '25', '30', '35', '40',
        '43.99999999', '44', '44.00000001', '46', '50', '52.55', '60', '70', '100', '200', '300',
        '1000', '3000', '10000']
rows = [{'t': repr(float(g)), 'F': [mp.nstr(Fref(m, g), 25, strip_zeros=False) for m in range(MM+1)]} for g in GRID]
out = {'provenance': {'written_by': 'research/h2o-2026-09-11/scratch/fix-boys.py',
                      'referee': 'mpmath %s at 70 decimal digits, gammainc, cross-checked against hyp1f1 to 1e-60' % mp.__version__,
                      'definition': 'F_m(t) = int_0^1 x^{2m} exp(-t x^2) dx', 'mmax': MM,
                      'note': 'grid pins the two regime switches 0.5 and 44 and their +-1e-8 neighbours; t is the exact double, referee evaluated at that double'},
       'rows': rows}
p = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'tests', 'fixtures', 'boys-ref.json')
json.dump(out, open(p, 'w'), indent=1)
print('wrote', os.path.normpath(p), len(rows), 'grid points x', MM+1, 'orders')
print('  F_8 at t=1e4 =', rows[-1]['F'][8], ' F_0 at t=0 =', rows[0]['F'][0])
