#!/usr/bin/env python3
"""Wave 127: build probes/P127/lab-i/ — a symlinked copy of lab/ whose rack.js and modwindow.js carry LAP statements
inside projects.open(), restore(), restoreModulation() and the modulation window's restore/open/rebuild.  lab/ itself is
never touched.  A lap is `__L('name')`: when the page has set globalThis.__LAP = [], it pushes [name, performance.now()];
otherwise it does nothing.  A missing anchor aborts the build.
   python3 research/optimization-2026-09-24/probes/P127/instrument.py [src-lab-dir] [out-dir-name]"""
import os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
LAB = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, 'lab')
OUT = os.path.join(HERE, sys.argv[2] if len(sys.argv) > 2 else 'lab-i')
if os.path.exists(OUT): shutil.rmtree(OUT)
subprocess.run(['cp', '-rs', LAB, OUT], check=True)
LAP = "const __L = (n) => { (globalThis.__LAPS ||= []).push([n, performance.now()]); };\n"

def build(name, edits):
    src = open(os.path.join(LAB, name), encoding='utf8').read()
    for (scope, anchor, lap, where) in edits:
        base = src.find(scope) if scope else 0
        if base < 0: sys.exit(name + ': scope not found: ' + scope[:60])
        i = src.find(anchor, base)
        if i < 0: sys.exit(name + ': anchor not found: ' + anchor[:70])
        pos = i + len(anchor) if where == 'after' else i
        src = src[:pos] + "__L(%r); " % lap + src[pos:]
    # the lap function goes after the import block (the first blank line after the last import)
    k = src.rfind('\nimport ')
    k = src.find('\n', src.find(" from '", k)) + 1
    src = src[:k] + LAP + src[k:]
    os.remove(os.path.join(OUT, name))
    open(os.path.join(OUT, name), 'w', encoding='utf8').write(src)

R = 'function restore(obj, opt) {'
M = 'function restoreModulation(o, savedBases'
O = '        open(path) {\n          const P = pjRead()'
N = "__L('open:pjWrite');"
build('rack.js', [
    (O, 'const before = JSON.parse(JSON.stringify(serialize()))', 'open:start', 'before'),
    (O, 'busy.n++; busySync(); try { restored = restore(it.data', 'open:snapshot', 'before'),
    (O, '          if (!restored) {\n            if (back)', 'open:restore', 'before'),
    (O, "          it.opened = new Date().toISOString();", 'open:nbKeys', 'before'),
    (O, "          projectClean(); show('notes');", 'open:pjWrite', 'before'),
    (N, "projectClean();", 'open:projectClean', 'after'),
    (N, "show('notes');", 'open:show', 'after'),
    (N, "nb.dataset.mode = 'view'; render();", 'open:render', 'after'),
    (R, 'markBatchBegin();', 'r:start', 'after'),
    (R, "      if (pr) { camLevel.from = null;", 'r:ex', 'before'),
    (R, "      /* A restored number and the control that owns it are one state.", 'r:obs+mat', 'before'),
    (R, "      if (pr) {\n        /* WAVE 63 · A LINK'S MATERIAL", 'r:knobs+accent', 'before'),
    (R, "        if (sturm.P) { sturm.on = false;", 'r:modSyncBases', 'before'),
    (R, "        if (pr.wigner) {", 'r:hamiltonian', 'before'),
    (R, "        if (pr.instruments) {", 'r:wigner+mo', 'before'),
    (R, "        if (pr.field) { const F = pr.field;", 'r:instruments', 'before'),
    (R, "        if (Array.isArray(pr.rates) && pr.rates.length === 91)", 'r:field', 'before'),
    (R, "        if (pr.ui) { const U = pr.ui;", 'r:rates', 'before'),
    (R, "          if (U.card) setCardStyle(U.card);", 'ui:theme', 'before'),
    (R, "          if (U.frost !== undefined) setFrost(", 'ui:card', 'before'),
    (R, "          if (U.disc !== undefined) setDisconnected(", 'ui:frost', 'before'),
    (R, "          if (U.accent) { Object.assign(accent, U.accent);", 'ui:disc', 'before'),
    (R, "          if (U.stage) {\n            if (Number.isFinite(U.stage.mix))", 'ui:accent', 'before'),
    (R, "        if (pr.camera) { const C = pr.camera;", 'ui:stage', 'before'),
    (R, "        if (pr.overlays) { const O = pr.overlays;", 'r:camera', 'before'),
    (R, "        if (pr.readers) {\n          if (pr.readers.spectrum)", 'r:overlays', 'before'),
    (R, "        if (pr.ab && ui.ab) ui.ab.set(pr.ab);", 'r:readers', 'before'),
    (R, "        if (pr.notebook && layout.notebookResize", 'r:ab', 'before'),
    (R, "        if (pr.layout && layout.applyLayout) layout.applyLayout(pr.layout);", 'r:notebook', 'before'),
    (R, "        if (molecule.on) { wMol.root.hidden = false;", 'r:applyLayout', 'before'),
    (R, "        if (!(opt && opt.keepTime)) {\n          const rr = pr.rotationRates;", 'r:sturmian', 'before'),
    (R, "        if (pr.space && pr.space !== space", 'r:rotationRates', 'before'),
    (R, "        if (pr.palette && palette) {", 'r:space', 'before'),
    (R, "          if (Array.isArray(pr.palette.stops)) palette.load(", 'pal:select', 'before'),
    (R, "          palette.setOn(!!pr.palette.on);", 'pal:load', 'before'),
    (R, "        /* Restore modulation last.", 'pal:setOn', 'before'),
    (R, "        if (pr.modwin && modView) modView.restore(pr.modwin);", 'r:restoreModulation', 'before'),
    (R, "      if (opt && opt.project && history) history.clear();", 'r:modwin', 'before'),
    (R, "      schedule(TIER.REBUILD); wState.setStatus('restored', 'live');", 'r:history', 'before'),
    (R, "      return true;\n    } catch (e) { console.warn('restore failed'", 'r:status', 'before'),
    (R, "markBatchEnd(); }", 'r:markBatchEnd', 'after'),
    (M, "    const incoming = Object.fromEntries(", 'm:clockPause', 'before'),
    (M, "    modHost.registry.restoreAll();", 'm:incoming', 'before'),
    (M, "    const ok = modHost.model.deserialize(o || null);", 'm:restoreAll', 'before'),
    (M, "    modHost.targets.sync();", 'm:deserialize', 'before'),
    (M, "    for (const id of modHost.registry.list()) {\n      const v = savedBases", 'm:targetsSync', 'before'),
    (M, "    modHost.clock.applyAll(true);\n    if (modView", 'm:setBase', 'before'),
    (M, "    if (modView", 'm:applyAll', 'before'),
    (M, "    schedule(TIER.PRESENT);\n    return ok;", 'm:rebuild', 'before'),
])
W = '  function restore(o) {\n    if (!o) return;'
P = '  function open() {\n    P.open = true;'
B = '  function rebuild() {\n    rebuildCatalogue();'
build('modwindow.js', [
    (W, "    if (o.open) open();", 'mw:restoreBody', 'before'),
    (P, "    rebuild(); place(); paint(true);", 'mw:open.opened', 'before'),
    (P, "rebuild();", 'mw:open.rebuild', 'after'),
    (P, "place();", 'mw:open.place', 'after'),
    (P, "paint(true);", 'mw:open.paint', 'after'),
    (P, "persist();", 'mw:open.persist', 'after'),
    (B, "    rebuildMacros();", 'rb:catalogue', 'before'),
    (B, "    rebuildDevices();", 'rb:macros', 'before'),
    (B, "    dressGlass();", 'rb:devices', 'before'),
    (B, "    M.syncDormant(", 'rb:glass+seats', 'before'),
    (B, "    place(); sync(); syncRings();\n  }", 'rb:dormant+chips+audio', 'before'),
    (B, "place();", 'rb:place', 'after'),
    (B, " sync();", 'rb:sync', 'after'),
    (B, "syncRings();", 'rb:rings', 'after'),
])
print('built', OUT)
