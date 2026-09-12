# boys-ref.py — mpmath at 70 digits referees every candidate Boys plan of boys-sweep.mjs.
import mpmath as mp
mp.mp.dps = 70
MM = 8
def Fref(m, t):
    t = mp.mpf(t)
    if t == 0: return mp.mpf(1)/(2*m+1)
    return mp.gammainc(mp.mpf(2*m+1)/2, 0, t) / (2*t**(mp.mpf(2*m+1)/2))
# cross-check the referee against an independent representation
for m in (0, 4, 8):
    for t in ('0.3', '13.0', '300.0'):
        a, b = Fref(m, t), mp.hyp1f1(mp.mpf(2*m+1)/2, mp.mpf(2*m+3)/2, -mp.mpf(t))/(2*m+1)
        assert abs(a-b) < mp.mpf(10)**-60 * max(abs(a), mp.mpf(1)), (m, t, a, b)
print('  referee cross-check gammainc vs hyp1f1 agrees to 1e-60')
lines = open('boys-sweep.txt').read().strip().split('\n')
names = lines[0].split()[2:-1] if False else lines[0].replace('# t ','').split('  ')[0].split()
rows = [l.split() for l in lines[1:]]
def regime(t):
    if t < 0.5: return 'a t<0.5'
    if t < 44: return 'b 0.5<=t<44'
    return 'c t>=44'
import collections
worst = collections.defaultdict(lambda: [0.0, 0.0, None, None])   # (variant, regime, m) -> [abs, rel, t_abs, t_rel]
ref_cache = {}
for r in rows:
    t = float(r[0]); reg = regime(t)
    ref = [Fref(m, r[0]) for m in range(MM+1)]
    for vi, name in enumerate(names):
        vals = r[1+vi].split(',')
        for m in range(MM+1):
            v = mp.mpf(vals[m]); e = abs(v - ref[m]); rel = e/abs(ref[m]) if ref[m] != 0 else mp.mpf(0)
            w = worst[(name, reg, m)]
            if e > w[0]: w[0], w[2] = float(e), t
            if rel > w[1]: w[1], w[3] = float(rel), t
print('  variant   regime         m  max|Δ|      (at t)      max rel     (at t)')
for (name, reg, m), w in sorted(worst.items()):
    if m > 4 and m != 8: continue
    print(f'  {name:9s} {reg:14s} {m}  {w[0]:.3e}  {w[2]:<11.4g} {w[1]:.3e}  {w[3]:<11.4g}')
print()
print('  worst RELATIVE over m=0..4 per variant/regime:')
for name in names:
    for reg in ['a t<0.5','b 0.5<=t<44','c t>=44']:
        v = [worst[(name, reg, m)] for m in range(5)]
        va = [worst[(name, reg, m)] for m in range(MM+1)]
        print(f'   {name:9s} {reg:14s} m<=4: abs {max(x[0] for x in v):.3e} rel {max(x[1] for x in v):.3e}'
              f'   |  m<=8: abs {max(x[0] for x in va):.3e} rel {max(x[1] for x in va):.3e}')
