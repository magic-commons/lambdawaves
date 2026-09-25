#!/usr/bin/env python3
"""mk-h2g.py — lane M · M6(e) follow-up EXPERIMENT (never shipped): lab-h2g = a copy of lab/ whose h2view.js refresh()
skips its construction paint while the card is hidden or closed — the next link of the "move the flush" chain — plus
lab-h2g-all (the all-reads logger) so bootreaders.mjs can list what is left.  Run after `cp -r lab …/lab-h2g`.
   python3 research/optimization-2026-09-24/probes/M/mk-h2g.py"""
import os, shutil, subprocess
M = 'research/optimization-2026-09-24/probes/M'
p = M + '/lab-h2g/h2view.js'
s = open(p, encoding='utf-8').read()
a = "      roW.setSub(`Slater orbitals · ζ free · ionic mix ${wb.lambda.toFixed(4)} · D_e ${((-1 - wb.fci) * EV).toFixed(3)} eV`); }\n    paint();\n"
assert s.count(a) == 1
s = s.replace(a, a.replace("    paint();\n", "    if (cv.isConnected && !cv.closest('[hidden], .closed')) paint();   /* PROBE ONLY */\n"))
open(p, 'w', encoding='utf-8').write(s)
out = M + '/lab-h2g-all'
if os.path.exists(out): shutil.rmtree(out)
subprocess.run(['cp', '-rs', os.path.abspath(M + '/lab-h2g'), out], check=True)
for f in ('index.html', 'rack.js'):
    os.remove(os.path.join(out, f))
idx = open(M + '/lab-h2g/index.html', encoding='utf-8').read().replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n<script src="./pre.js"></script>\n', 1)
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(idx)
r = open(M + '/lab-h2g/rack.js', encoding='utf-8').read().replace('  LW.ready = true;\n  return LW;', "  performance.mark('lw-ready');\n  LW.ready = true;\n  return LW;", 1)
open(os.path.join(out, 'rack.js'), 'w', encoding='utf-8').write(r)
shutil.copy(M + '/lab-pre-all/pre.js', os.path.join(out, 'pre.js'))
print('built lab-h2g, lab-h2g-all')
