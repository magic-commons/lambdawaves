#!/usr/bin/env python3
"""mk-lost.py — lane M: plant ONE `device.destroy()` in three copies of the lab (run after copying them).
   lab-lostearly     built lab/, the device destroyed inside gpu-boot.js right after requestDevice (lost while the
                     module graph loads — the window FD1 widens)
   lab-lostcompile   built lab/, destroyed inside createField after the early `b.lost` check (lost during compile)
   lab-base-lostearly  the base (91c90bc) copy, destroyed right after requestDevice in field.js (REFUTE-F's copy)"""
M = 'research/optimization-2026-09-24/probes/M'


def sub(p, a, b):
    s = open(p, encoding='utf-8').read()
    assert s.count(a) == 1, (p, a)
    open(p, 'w', encoding='utf-8').write(s.replace(a, b))


sub(M + '/lab-lostearly/gpu-boot.js', "    const r = { adapter, device, limitsRequested, lost: false };",
    "    device.destroy(); /* PROBE: lost while the module graph loads */\n    const r = { adapter, device, limitsRequested, lost: false };")
sub(M + '/lab-lostcompile/field.js', "  if (b.lost) return out;\n\n  const format",
    "  if (b.lost) return out;\n  device.destroy(); /* PROBE: lost during the compile stretch */\n\n  const format")
sub(M + '/lab-base-lostearly/field.js', "    catch (_) { device = await adapter.requestDevice(); out.limitsRequested = null; }\n",
    "    catch (_) { device = await adapter.requestDevice(); out.limitsRequested = null; }\n    device.destroy(); /* PROBE (as REFUTE-F's lab-lostearly) */\n")
print('planted')
