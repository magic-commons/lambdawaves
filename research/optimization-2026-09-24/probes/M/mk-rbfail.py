#!/usr/bin/env python3
"""mk-rbfail.py — lane M · M5b: a symlinked copy of lab/ whose rack.js takes a BROKEN roll-back snapshot (its palette
stops = [5], the same poison as the failing file), so the fallback road — the roll-back restore fails too — can be driven.
   python3 research/optimization-2026-09-24/probes/M/mk-rbfail.py"""
import os, shutil, subprocess
M = 'research/optimization-2026-09-24/probes/M'
out = M + '/lab-rbfail'
if os.path.exists(out): shutil.rmtree(out)
subprocess.run(['cp', '-rs', os.path.abspath('lab'), out], check=True)
os.remove(os.path.join(out, 'rack.js'))
s = open('lab/rack.js', encoding='utf-8').read()
a = "const before = JSON.parse(JSON.stringify(serialize())), baseline"
assert s.count(a) == 1
s = s.replace(a, "const before = (() => { const o = JSON.parse(JSON.stringify(serialize())); o.presentation.palette.stops = [5]; return o; })(), baseline")
open(os.path.join(out, 'rack.js'), 'w', encoding='utf-8').write(s)
print('built', out)
