#!/usr/bin/env python3
"""mk-pre.py — lane M · M6: two symlinked copies whose index.html loads probes/D/pre.js FIRST (the slow-layout-read
logger: every getBoundingClientRect / clientWidth / offsetWidth / getPropertyValue over 1 ms, with its stack).
   probes/M/lab-base-pre <- probes/M/lab-base      probes/M/lab-pre <- lab/
   python3 research/optimization-2026-09-24/probes/M/mk-pre.py"""
import os, shutil, subprocess
M = 'research/optimization-2026-09-24/probes/M'
PRE = open('research/optimization-2026-09-24/probes/D/pre.js', encoding='utf-8').read()


def build(src_dir, out):
    if os.path.exists(out): shutil.rmtree(out)
    subprocess.run(['cp', '-rs', os.path.abspath(src_dir), out], check=True)
    os.remove(os.path.join(out, 'index.html'))
    s = open(os.path.join(src_dir, 'index.html'), encoding='utf-8').read()
    a = '<meta charset="utf-8">\n'
    assert s.count(a) == 1
    s = s.replace(a, a + '<script src="./pre.js"></script>\n')
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(s)
    open(os.path.join(out, 'pre.js'), 'w', encoding='utf-8').write(PRE)
    os.remove(os.path.join(out, 'rack.js'))                  # + one mark at LW.ready, so a probe can split the log at it
    r = open(os.path.join(src_dir, 'rack.js'), encoding='utf-8').read()
    a2 = '  LW.ready = true;\n  return LW;'
    assert r.count(a2) == 1
    open(os.path.join(out, 'rack.js'), 'w', encoding='utf-8').write(r.replace(a2, "  performance.mark('lw-ready');\n" + a2))


import sys
if len(sys.argv) > 1:
    for i in range(1, len(sys.argv), 2): build(sys.argv[i], sys.argv[i + 1]); print('built', sys.argv[i + 1])
else:
    build(M + '/lab-base', M + '/lab-base-pre')
    build('lab', M + '/lab-pre')
    print('built lab-base-pre and lab-pre')
