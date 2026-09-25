#!/usr/bin/env python3
"""mk-pm.py — lane M · M7: two symlinked copies whose rack.js counts every REAL paintMarks body run (globalThis.__pm)
and its wall time (globalThis.__pmMs).  base: counted at the top of paintMarks; built: counted after the batch's
early return, so a deferred call is not a paint.
   python3 research/optimization-2026-09-24/probes/M/mk-pm.py"""
import os, shutil, subprocess
M = 'research/optimization-2026-09-24/probes/M'
CNT = "globalThis.__pm = (globalThis.__pm || 0) + 1; const __pm0 = performance.now(); try { "
END = " } finally { globalThis.__pmMs = (globalThis.__pmMs || 0) + performance.now() - __pm0; }"


def build(src_dir, out, built):
    if os.path.exists(out): shutil.rmtree(out)
    subprocess.run(['cp', '-rs', os.path.abspath(src_dir), out], check=True)
    os.remove(os.path.join(out, 'rack.js'))
    s = open(os.path.join(src_dir, 'rack.js'), encoding='utf-8').read()
    head = "  function paintMarks() {\n    if (markBatch) { marksDirty = true; turnDirty = true; return; }\n" if built else "  function paintMarks() {\n"
    tail = "    turnDirty = true;                       // the wheel moved under the mark: the turn's keyframes are stale\n  }\n"
    assert s.count(head) == 1 and s.count(tail) == 1, (out, s.count(head), s.count(tail))
    s = s.replace(head, head + "    " + CNT + "\n")
    s = s.replace(tail, tail[:-4] + END + "\n  }\n")
    open(os.path.join(out, 'rack.js'), 'w', encoding='utf-8').write(s)


build(M + '/lab-base', M + '/lab-base-pm', False)
build('lab', M + '/lab-pm', True)
print('built lab-base-pm and lab-pm')
