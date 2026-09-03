#!/usr/bin/env python
"""bf-r6-airy-ref.py — mpmath truth for lab/frontier.js airyAi at and around the |x| = 6 switch."""
from mpmath import mp, airyai, mpf
mp.dps = 40

NODE = [[-8,-0.05270505035638667],[-7,0.18428083525060956],[-6.5,-0.23802030199177354],
[-6.0001,-0.32917975732795496],[-6,-0.3291451736297594],[-5.9999,-0.3291105702071536],
[-5.5,0.017781541276584212],[-5,0.35076100902412544],[-3,-0.37881429367765806],
[-1,0.5355608832923522],[0,0.3550280538878172],[1,0.13529241631288147],[3,0.00659113935746003],
[4,0.0009515638511992108],[5,0.00010834442807095002],[5.5,0.0000336853116778002],
[5.9,0.00001274709416065889],[5.99,0.000010198353493251489],[5.999,0.000009972489351639524],
[5.9999,0.000009950170124284341],[6,0.000009947693797585089],[6.0001,0.00000994521813999805],
[6.001,0.000009922958981212248],[6.01,0.00000970300368665199],[6.1,0.000007747731031789345],
[6.5,0.000002795882343174508],[7,7.492128863991535e-07],[8,4.692207616099215e-08],
[10,1.1047532552898698e-10],[12,1.393184688875362e-13]]

print(f"{'x':>9} {'node airyAi':>24} {'mpmath Ai':>24} {'rel err':>12}  branch")
worst_series = (0.0, None); worst_asym = (0.0, None)
for x, v in NODE:
    t = airyai(mpf(repr(x)))
    rel = abs(mpf(repr(v)) - t) / abs(t)
    br = 'series' if -6 <= x <= 6 else ('asym+' if x > 6 else 'asym-')
    print(f"{x:9} {v:24.17e} {float(t):24.17e} {float(rel):12.3e}  {br}")
    if br == 'series' and float(rel) > worst_series[0]: worst_series = (float(rel), x)
    if br.startswith('asym') and float(rel) > worst_asym[0]: worst_asym = (float(rel), x)
print()
print("worst relative error, SERIES branch  :", f"{worst_series[0]:.3e}", "at x =", worst_series[1])
print("worst relative error, ASYMPTOTIC     :", f"{worst_asym[0]:.3e}", "at x =", worst_asym[1])
print()
print("Ai(6) exact  =", airyai(6))
print("Ai(-6) exact =", airyai(-6))
# the cancellation ratio of the ascending series at x = 6 (why the series branch loses digits)
from mpmath import gamma, power, nsum, factorial, inf
AI0 = mpf('0.3550280538878172392600631860041831763980'); AIP0 = mpf('-0.2588194037928067984051835601892039634793')
def fg(x):
    x = mpf(x); f = mpf(1); g = x; tf = mpf(1); tg = x
    for k in range(1, 200):
        tf *= x**3 / ((3*k-1)*(3*k)); tg *= x**3 / ((3*k)*(3*k+1)); f += tf; g += tg
    return f, g
for x in (5, 5.5, 6, -6):
    f, g = fg(x)
    big = max(abs(AI0*f), abs(AIP0*g))
    print(f"  x={x:5}: |AI0*f|={float(AI0*f):+.6e} |AIP0*g|={float(AIP0*g):+.6e}  sum={float(AI0*f+AIP0*g):.6e}"
          f"  cancellation={float(big/abs(airyai(mpf(repr(x))))):.3e}  eps*canc={float(big/abs(airyai(mpf(repr(x))))*mpf('2.22e-16')):.3e}")
