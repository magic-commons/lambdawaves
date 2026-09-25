#!/usr/bin/env python3
"""Build probes/D/lab-i/: a symlinked copy of lab/ whose rack.js and index.html carry performance marks
and counters.  lab/ itself is never touched.  Every insertion is a STATEMENT (a performance.mark or a counter)
placed before an anchor substring; a missing anchor aborts the build.
   python3 research/optimization-2026-09-24/probes/D/instrument.py [--nogpu-guard]
--nogpu-guard additionally applies the proposed L6 fix (guarded field.setDprCap) so a no-WebGPU boot can be timed."""
import os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
LAB = os.path.join(ROOT, 'lab')
GUARD = '--nogpu-guard' in sys.argv
PRESTART = '--prestart' in sys.argv     # the proposed F-D1 change: the adapter + device are requested from <head>
PRELOAD = '--preload' in sys.argv       # the proposed modulepreload block for the whole static graph
NOKATEX = '--nokatex' in sys.argv       # marked + KaTeX (+ its sheet) removed from <head>: what the notebook's parsers cost every boot
LADDERFIX = '--ladderfix' in sys.argv   # the proposed F-D2 change: ladder.set() solves only when the card can present
OUT = os.path.join(HERE, 'lab-g' if GUARD else 'lab-l' if LADDERFIX else 'lab-k' if NOKATEX else ('lab-' + ('p' if PRESTART else '') + ('m' if PRELOAD else '')) if (PRESTART or PRELOAD) else 'lab-i')
if os.path.exists(OUT): shutil.rmtree(OUT)
subprocess.run(['cp', '-rs', LAB, OUT], check=True)
for f in ('rack.js', 'index.html'):
    os.remove(os.path.join(OUT, f))
src = open(os.path.join(LAB, 'rack.js'), encoding='utf8').read()

def before(anchor, stmt, after=False):
    global src
    idx = src.find(anchor)
    if idx < 0: sys.exit('anchor not found: ' + anchor[:70])
    pos = idx + len(anchor) if after else idx
    src = src[:pos] + stmt + src[pos:]

def sub(a, b):
    global src
    if a not in src: sys.exit('replace anchor not found: ' + a[:70])
    src = src.replace(a, b, 1)

M = lambda n: "performance.mark(%r);" % n
sub("import { el, knob, sw, seg, trig, fader, readout, device,", "import { el, knob, sw, seg, trig, fader, readout, device as __device,")
before("\n/* THE BUILD STAMP", "\nconst __P = (globalThis.__P = globalThis.__P || { cnt: {}, t: {}, log: [] });\n"
       "const __c = (k, dt) => { __P.cnt[k] = (__P.cnt[k] || 0) + 1; if (dt !== undefined) __P.t[k] = (__P.t[k] || 0) + dt; };\n"
       "const device = (o) => { performance.mark('dev:' + o.id); return __device(o); };\n")
before("export async function boot(dom) {", M('boot-start'), after=True)
before("  const field = await createField(", M('field-start'))
before("  if (!field.ok) showBanner('WebGPU unavailable'", M('field-end'))
sub("function readSettings() { try {", "function readSettings() { __c('readSettings'); try {")
sub("  function saveSettings() {\n    if (!settingsLoaded) return;",
    "  function saveSettings() { const __t0 = performance.now(); if (!settingsLoaded) { __c('saveSettings.early'); return; } __saveSettings(); const __dt = performance.now() - __t0; __c('saveSettings', __dt); if (__P.trace) __P.log.push(['save', +__dt.toFixed(3), (new Error().stack.split('\\n')[1] || '').replace(/@.*rack\\.js/, '@rack.js')]); }\n  function __saveSettings() {")
sub("  function schedule(tier) {\n", "  function schedule(tier) {\n    __c('schedule' + tier);\n")
before("  const ui = {};\n  const rack = dom.rack;", M('windows-start'))
before("  /* ── WAVE 52 · W-MODWINDOW: THE MODULATION RACK", M('sec:modwin'))
before("    modView = createModulation(", M('sec:modView'))
before("  // ATOMS — the periodic table", M('sec:atoms'))
before("  /* ── transport strip (§25)", M('sec:transport-strip'))
before("  /* ── badges (§41)", M('sec:badges'))
before("  /* ── WAVE 56 · THE INSTALL LAYER'S INTERFACE HALF", M('sec:install'))
before("  /* ── THE BOW: ctrl+drag", M('sec:bow'))
before("  const gas = createGas(", M('sec:gas'))
before("  /* ── THE FLOATING RACK:", M('sec:floating'))
before("  const layout = {", M('sec:layout'))
before("  bindStageGestures(dom.canvas, {", M('sec:gestures'))
before("  /* ── KEYS: a rebindable action table", M('sec:keys'))
before("  /* ── THE TAB ORDER, STATED", M('sec:taborder'))
before("  /* ── persistence (§46)", M('sec:persistence'))
before("  history = createHistory(", M('sec:history'))
before("  renderHistory();\n", M('sec:renderHistory'))
before("  const LW = {\n", M('sec:LW'))
before("  LW.bootView = VIEW_NAMES[mat.view];", M('go:start'))
before("  mat.view = VIEW.phase; if (ui.viewSeg) ui.viewSeg.set('phase'); schedule(TIER.PRESENT);", M('go:preset-done'))
before("  layout.moveToRack('spectrum', 'L'); spectrum.openPicker(true);", M('go:digests-done'))
before("  if(useCompactDefaults) {\n    const left=", M('go:compact'))
before("  applySettings();\n  syncPhone();", M('go:applySettings'))
before("  syncPhone();                        // wave 51", M('go:syncPhone'))
before("  const linkAtBoot = openLink();", M('go:openLink'))
before("  addEventListener('hashchange', () => { openLink(); });", M('go:openLink-done'))
before("  ui.saveNative = saveSettings;", M('go:warning-built'))
before("  reworkNative({ ui, mat,", M('go:reworkNative'))
before("  __LW_hooks.warning = warning;", M('go:reworkNative-done'))
before("  history.clear();                    // the shipped boot", M('go:history-clear'))
before("  markTurn();\n  busyHost();", M('go:markTurn'))
before("  if (layout.projects) layout.projects.markClean();\n  LW.ready = true;", M('go:markClean'))
before("  LW.ready = true;\n  return LW;", M('lw-ready'))
R = [
 ("      const ex = obj ? obj.experiment : JSON.parse(localStorage.getItem(LS_EXP)", 'r:start'),
 ("      if (pr) { camLevel.from = null; Object.assign(obs, pr.obs || {});", 'r:ex-done'),
 ("      /* A restored number and the control that owns it are one state.", 'r:obsmat-done'),
 ("        modSyncBases(true);\n        if (sturm.P) { sturm.on = false;", 'r:controls-done'),
 ("        if (pr.hamiltonian) { const h = pr.hamiltonian;", 'r:modsync-done'),
 ("        if (pr.wigner) { const G = pr.wigner;", 'r:ham-done'),
 ("        if (pr.instruments) {\n          const I = pr.instruments;", 'r:mo-done'),
 ("          if (I.qcd) qcd.load(I.qcd);", 'ri:qcd'),
 ("          if (I.molecule) molecule.load({ ...I.molecule, on: false });", 'ri:molecule'),
 ("          if (I.pulse && pulsePanel) pulsePanel.api.load(I.pulse);", 'ri:pulse'),
 ("          if (I.helium) helium.load({ ...I.helium, on: false });", 'ri:helium'),
 ("          if (I.h2) h2.load({ ...I.h2, on: false });", 'ri:h2'),
 ("          if (I.chem) chem.load({ ...I.chem, on: false });", 'ri:chem'),
 ("          if (I.orbitals) orbitals.load({ ...I.orbitals, on: false });", 'ri:orbitals'),
 ("          if (I.states) states.load({ ...I.states, on: false });", 'ri:states'),
 ("          if (I.register) register.setMode(I.register.mode);", 'ri:register'),
 ("          if (fieldOwner === 'molecule') molecule.setOn(true);", 'ri:owner'),
 ("          if (I.ladder) ladder.set(I.ladder);", 'ri:ladder'),
 ("          if (I.particles) {\n            if (Number.isFinite(I.particles.count))", 'ri:particles'),
 ("        if (pr.field) { const F = pr.field;", 'r:instruments-done'),
 ("        if (Array.isArray(pr.rates) && pr.rates.length === 91) { rates.set(pr.rates);", 'r:fieldlines-done'),
 ("        if (pr.ui) { const U = pr.ui;", 'r:rates-done'),
 ("          if (U.card) setCardStyle(U.card);", 'ru:theme-done'),
 ("          if (U.frost !== undefined) setFrost(U.frost, { quiet: true });", 'ru:card-done'),
 ("          if (U.accent) { Object.assign(accent, U.accent);", 'ru:frostdisc-done'),
 ("          if (U.stage) {\n            if (Number.isFinite(U.stage.mix))", 'ru:accent-done'),
 ("        if (pr.camera) { const C = pr.camera;", 'r:ui-done'),
 ("        if (pr.overlays) { const O = pr.overlays;", 'r:camera-done'),
 ("        if (pr.readers) {\n          if (pr.readers.spectrum)", 'r:overlays-done'),
 ("        if (pr.ab && ui.ab) ui.ab.set(pr.ab);", 'r:readers-done'),
 ("        if (pr.notebook && layout.notebookResize", 'r:ab-done'),
 ("        if (pr.layout && layout.applyLayout) layout.applyLayout(pr.layout);", 'r:notebook-done'),
 ("        // A legacy H₂⁺ file can carry a closed old layout", 'r:layout-done'),
 ("        applySturmian(true);                                          // the file's anchor", 'r:sturm'),
 ("        // Restore operator rates AFTER the destination scale is installed.", 'r:sturm-done'),
 ("        if (pr.space && pr.space !== space && !getHamiltonian().noMomentum", 'r:rotrates-done'),
 ("        if (pr.palette && palette) {\n          if (pr.paletteId", 'r:palette'),
 ("        /* Restore modulation last.", 'r:palette-done'),
 ("        if (pr.modwin && modView) modView.restore(pr.modwin);", 'r:modulation-done'),
 ("      if (opt && opt.project && history) history.clear();", 'r:modwin-done'),
 ("      schedule(TIER.REBUILD); wState.setStatus('restored', 'live');", 'r:history-done'),
 ("      return true;\n    } catch (e) { console.warn('restore failed', e);", 'r:end'),
]
for a, n in R: before(a, M(n))
before("          busy.n++; busySync(); try { restore(it.data, { project: true }); }", M('p:read-done'))
before("          ta.value = it.notebook.text || ''; titleIn.value = it.notebook.title || it.name;", M('p:restore-done'))
sub("          projectClean(); show('notes'); nb.dataset.mode = 'view'; render();",
    "          " + M('p:store-done') + " projectClean(); " + M('p:clean-done') + " show('notes'); " + M('p:show-done') + " nb.dataset.mode = 'view'; render(); " + M('p:render-done'))
sub("      function projectKey() {\n        const data = projectSnapshot(), pr = data.presentation;",
    "      function projectKey() { const __t0 = performance.now(); try { return __projectKey(); } finally { __c('projectKey', performance.now() - __t0); } }\n      function __projectKey() {\n        const data = projectSnapshot(), pr = data.presentation;")
sub("  function hLiveKey() {\n", "  function hLiveKey() { const __t0 = performance.now(); try { return __hLiveKey(); } finally { __c('hLiveKey', performance.now() - __t0); } }\n  function __hLiveKey() {\n")
sub("  function hRead() {\n", "  function hRead() { const __t0 = performance.now(); try { return __hRead(); } finally { __c('hRead', performance.now() - __t0); } }\n  function __hRead() {\n")
sub("  function renderHistory() {\n", "  function renderHistory() { const __t0 = performance.now(); try { return __renderHistory(); } finally { __c('renderHistory', performance.now() - __t0); } }\n  function __renderHistory() {\n")
sub("  function serialize() {\n", "  function serialize() { const __t0 = performance.now(); try { return __serialize(); } finally { __c('serialize', performance.now() - __t0); } }\n  function __serialize() {\n")
sub("  function applyAccent() {\n", "  function applyAccent() { const __t0 = performance.now(); try { return __applyAccent(); } finally { __c('applyAccent', performance.now() - __t0); } }\n  function __applyAccent() {\n")
sub("  function paintMarks() {\n", "  function paintMarks() { const __t0 = performance.now(); try { return __paintMarks(); } finally { __c('paintMarks', performance.now() - __t0); } }\n  function __paintMarks() {\n")
# every `= createXxx(` constructor call in rack.js, timed (synchronous part) under ctor:<name>
import re as _re
src = src.replace("const device = (o) => {", "const __T = (n, f) => (...a) => { const t0 = performance.now(); try { return f(...a); } finally { __c('ctor:' + n, performance.now() - t0); } };\nconst device = (o) => {", 1)
src, nctor = _re.subn(r"= (create[A-Z]\w*)\(", lambda m: "= __T(%r, %s)(" % (m.group(1), m.group(1)), src)
src = src.replace("= __T('createField', createField)(", "= createField(")   # the await keeps its own marks
print('timed', nctor, 'constructor calls')
if GUARD:
    # THE PROPOSED L6 FIX, applied only in lab-g: every field.setDprCap call is guarded on the method existing
    n = src.count('field.setDprCap(')
    src = src.replace('field.setDprCap(', 'field.setDprCap && field.setDprCap(')
    print('guarded', n, 'setDprCap calls')
open(os.path.join(OUT, 'rack.js'), 'w', encoding='utf8').write(src)

# field.js: the phases of createField (adapter, device, shader modules, compile info, pipelines, buffers)
fsrc = open(os.path.join(LAB, 'field.js'), encoding='utf8').read()
def fbefore(anchor, stmt):
    global fsrc
    i = fsrc.find(anchor)
    if i < 0: sys.exit('field anchor not found: ' + anchor[:70])
    fsrc = fsrc[:i] + stmt + fsrc[i:]
fbefore("    adapter = await navigator.gpu.requestAdapter(", M('f:adapter'))
fbefore("    if (!adapter) { out.error = 'no WebGPU adapter'; return out; }", M('f:adapter-done'))
fbefore("    try { device = await adapter.requestDevice({ requiredLimits: want });", M('f:device'))
fbefore("  try { const info = adapter.info || (adapter.requestAdapterInfo", M('f:device-done'))
fbefore("  const format = navigator.gpu.getPreferredCanvasFormat();", M('f:info-done'))
fbefore("  const computeModule = device.createShaderModule({ code: COMPUTE_WGSL });", M('f:modules'))
fbefore("  out.shaderMessages = [];", M('f:modules-created'))
fbefore("  if (out.shaderMessages.some((m) => m.type === 'error')) { out.error = 'WGSL compile error: '", M('f:compileinfo-done'))
fbefore("  const molPipelines = molModules.map((m) => device.createComputePipeline(", M('f:compute-pipeline-done'))
fbefore("  const renderBGL = device.createBindGroupLayout({ entries: [", M('f:mol-pipelines-done'))
fbefore("  const paramsBuf = [0, 1].map(() => device.createBuffer({ size: 32,", M('f:render-pipelines-done'))
fbefore("  const LATTICE_SEGS = new Int8Array(13872 * 6);", M('f:buffers-done'))
i = fsrc.rfind("  return out;\n}")
fsrc = fsrc[:i] + "  " + M('f:return') + "\n" + fsrc[i:]
# per-module compile-info timing: mark each await
fsrc = fsrc.replace("    try { const info = await m.getCompilationInfo();", "    performance.mark('f:ci:' + name); try { const info = await m.getCompilationInfo();", 1)
if PRESTART:
    a = "    adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });"
    if a not in fsrc: sys.exit('prestart anchor 1')
    fsrc = fsrc.replace(a, "    adapter = await (globalThis.__lwAdapter || navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }));", 1)
    b = "    try { device = await adapter.requestDevice({ requiredLimits: want }); out.limitsRequested = want; }"
    if b not in fsrc: sys.exit('prestart anchor 2')
    fsrc = fsrc.replace(b, "    try { device = await ((globalThis.__lwDevice && (await globalThis.__lwAdapter) === adapter) ? globalThis.__lwDevice : adapter.requestDevice({ requiredLimits: want })); out.limitsRequested = want; }", 1)
os.remove(os.path.join(OUT, 'field.js'))
open(os.path.join(OUT, 'field.js'), 'w', encoding='utf8').write(fsrc)

if LADDERFIX:
    lsrc = open(os.path.join(LAB, 'ladder.js'), encoding='utf8').read()
    a = "ui[k].set(p[k]); clockFx(); compute(); } };"
    if a not in lsrc: sys.exit('ladderfix anchor')
    lsrc = lsrc.replace(a, "ui[k].set(p[k]); clockFx(); if (active) compute(); else schedule(); } };", 1)
    os.remove(os.path.join(OUT, 'ladder.js'))
    open(os.path.join(OUT, 'ladder.js'), 'w', encoding='utf8').write(lsrc)

html = open(os.path.join(LAB, 'index.html'), encoding='utf8').read()
PRE = open(os.path.join(HERE, 'pre.js'), encoding='utf8').read()
html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script>' + PRE + '</script>', 1)
if PRESTART:
    EARLY = ("if (navigator.gpu) { performance.mark('early:adapter'); window.__lwAdapter = navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });"
             " window.__lwDevice = window.__lwAdapter.then((a) => { performance.mark('early:adapter-done'); if (!a) return null; const want = {};"
             " for (const k of ['maxTextureDimension2D', 'maxTextureDimension1D']) if (a.limits && a.limits[k]) want[k] = a.limits[k];"
             " return a.requestDevice({ requiredLimits: want }).then((d) => { performance.mark('early:device-done'); return d; }); }); window.__lwDevice.catch(() => {}); }")
    html = html.replace('</script>', '</script>\n<script>' + EARLY + '</script>', 1)
if NOKATEX:
    for tag in ['    <link rel="stylesheet" href="./vendor/katex/katex.min.css">\n', '    <script defer src="./vendor/marked.min.js"></script>\n', '    <script defer src="./vendor/katex/katex.min.js"></script>\n']:
        if tag not in html: sys.exit('nokatex anchor: ' + tag)
        html = html.replace(tag, '', 1)
if PRELOAD:
    block = subprocess.run(['node', os.path.join(HERE, 'graph.mjs'), '--preload-html'], cwd=ROOT, check=True, capture_output=True, text=True).stdout
    html = html.replace('<link rel="manifest"', block + '<link rel="manifest"', 1)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(html)
print('built', OUT)
