#!/usr/bin/env python3
"""mk-marks.py — lane M: two symlinked copies of the lab whose rack.js / field.js (/ gpu-boot.js) carry ONLY
performance.mark statements, for the M1/K10 A/B timing.  The source trees are never touched.
   probes/M/lab-base-mk  <- probes/M/lab-base (91c90bc)
   probes/M/lab-mk       <- lab/ (the built tree, whatever it is when this runs)
   python3 research/optimization-2026-09-24/probes/M/mk-marks.py
Marks: boot-start, field-start, field-end, lw-ready (rack.js); sm-start, ci-start, ci-end, pl-end (field.js createField:
shader modules, the compile-info awaits, the pipelines); first-present (field.js frame); gb-start, gb-adapter,
gb-device (gpu-boot.js, built only)."""
import os, shutil, subprocess, sys
M = 'research/optimization-2026-09-24/probes/M'


def build(src_dir, out, built):
    if os.path.exists(out): shutil.rmtree(out)
    subprocess.run(['cp', '-rs', os.path.abspath(src_dir), out], check=True)
    files = ['rack.js', 'field.js'] + (['gpu-boot.js'] if built else [])
    txt = {}
    for f in files:
        os.remove(os.path.join(out, f))
        txt[f] = open(os.path.join(src_dir, f), encoding='utf-8').read()

    def ins(f, anchor, stmt, after=False):
        s = txt[f]
        assert s.count(anchor) == 1, (f, anchor[:60], s.count(anchor))
        i = s.index(anchor) + (len(anchor) if after else 0)
        txt[f] = s[:i] + stmt + s[i:]
    mk = lambda n: "performance.mark(%r);" % n
    ins('rack.js', 'export async function boot(dom) {', mk('boot-start'), after=True)
    ins('rack.js', '  const field = await createField(', mk('field-start'))
    ins('rack.js', '  if (field.ok) gamutCss = ', mk('field-end'))
    ins('rack.js', '  LW.ready = true;\n  return LW;', mk('lw-ready'))
    ins('field.js', '  const computeModule = device.createShaderModule(', mk('sm-start'))
    ins('field.js', '  out.shaderMessages = [];\n', mk('ci-start'), after=True)
    ins('field.js', "  if (out.shaderMessages.some((m) => m.type === 'error'))", mk('ci-end'))
    ins('field.js', '  /* EXPLICIT layouts: an \'auto\' layout belongs to one pipeline', mk('pl-end'))
    ins('field.js', 'stats.presents++; }', "if (stats.presents === 0) performance.mark('first-present'); ", after=False)
    if built:
        ins('gpu-boot.js', "    const gpu = globalThis.navigator && globalThis.navigator.gpu;\n", mk('gb-start'), after=True)
        ins('gpu-boot.js', "    if (!adapter) return { adapter: null };\n", mk('gb-adapter'), after=True)
        ins('gpu-boot.js', "    const r = { adapter, device, limitsRequested, lost: false };\n", mk('gb-device'), after=True)
    for f, s in txt.items(): open(os.path.join(out, f), 'w', encoding='utf-8').write(s)


build(M + '/lab-base', M + '/lab-base-mk', False)
build('lab', M + '/lab-mk', True)
print('built lab-base-mk and lab-mk')
