// VERIFY item 7: the cost budget, measured independently (medians of N, µs timers): flush after an edit, canUndo with an edit pending,
// one undo per family (look, preset, element, palette, modulation, demo), bytes per row (default / WAVE DANCER / MOLECULES), the depth
// (61 distinct edits → 60 undos, the oldest fell off) and historyUndo after a goto.
import { lab } from './kit.mjs';
const g = await lab();
const out = {};
try {
  await g.run(`window.__med = (a) => { const b = a.slice().sort((x, y) => x - y); return +b[b.length >> 1].toFixed(3); }; window.__max = (a) => +Math.max(...a).toFixed(3); return 1;`);
  out.flush = await g.run(`const H = __LW.history, f = [], c = [], k = [];
    await __settle();
    for (let i = 0; i < 25; i++) { __LW.setStage(0.2 + i / 100); const t0 = performance.now(); H.flush(); f.push(performance.now() - t0); }
    for (let i = 0; i < 25; i++) { __LW.setStage(0.6 + i / 100); const t0 = performance.now(); void H.canUndo; c.push(performance.now() - t0); H.flush(); }
    for (let i = 0; i < 25; i++) { const t0 = performance.now(); JSON.stringify(__LW.serialize({ scope: 'edit' })); k.push(performance.now() - t0); }
    const full = []; for (let i = 0; i < 10; i++) { const t0 = performance.now(); __LW.serialize(); full.push(performance.now() - t0); }
    return { flushMed: __med(f), flushMax: __max(f), canUndoPendingMed: __med(c), canUndoMax: __max(c), editSerializeMed: __med(k), fullSerializeMed: __med(full), bytesDefault: __ser().length };`);
  console.log('flush', JSON.stringify(out.flush));
  /* one undo per family, 7 repetitions each (edit → flush → time the undo → redo to keep the ring moving) */
  const fam = (name, body) => g.run(`const H = __LW.history, ms = []; await __settle();
    for (let i = 0; i < 7; i++) { await (async () => { ${body} })(); await __w(20); H.flush(); const t0 = performance.now(); H.undo(); ms.push(performance.now() - t0); await __w(120); }
    return { family: ${JSON.stringify(name)}, med: __med(ms), max: __max(ms), all: ms.map((x) => +x.toFixed(1)) };`);
  out.undo = {};
  out.undo.look = await fg('look (STYLE)', `__LW.setStyle(i % 2 ? 'cloud' : 'solid'); __LW.history.note();`);
  out.undo.preset = await fg('preset', `const s = document.querySelector('select[aria-label="preset superposition"]'); s.value = i % 2 ? '1s+2pz' : '2p+'; s.dispatchEvent(new Event('change', { bubbles: true }));`);
  out.undo.element = await fg('element', `__LW.setIonZ ? null : null; const z = (i % 3) + 2; __LW.setElement ? __LW.setElement(z) : (__LW.hamiltonian && null); if (!__LW.setElement) { const k = __knob('ELEMENT Z'); __show(k); await __sdrag(k.querySelector('.k-dial'), 0, -12 - 3 * i, 4, 10); }`);
  out.undo.palette = await fg('palette', `const s = document.querySelector('select[aria-label="palette"]'); const vs = [...s.options].map((o) => o.value); s.value = vs[(vs.indexOf(s.value) + 1) % vs.length]; s.dispatchEvent(new Event('change', { bubbles: true }));`);
  await g.run(`__LW.layout.modulation.expand(); await __w(400); return 1;`);
  out.undo.modulation = await fg('modulation (addSource lfo, window open)', `__LW.mod.addSource('lfo');`);
  await g.run(`__LW.layout.modulation.collapse(); await __w(300); return 1;`);
  out.undo.modulationClosed = await fg('modulation (addSource lfo, window closed)', `__LW.mod.addSource('lfo');`);
  /* the demo */
  out.dancer = await g.run(`const P = __LW.layout.projects, c0 = window.confirm; window.confirm = () => true; const f = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' });
    const path = P.importText(await f.text()); P.open(path); window.confirm = c0; await __w(1500); return { bytes: __ser().length, rows: __rows() };`);
  out.undo.demo = await fg('demo (STYLE under WAVE DANCER)', `__LW.setStyle(i % 2 ? 'cloud' : 'solid'); __LW.history.note();`);
  out.undo.demoPlaying = await g.run(`__LW.play(); await __w(800); return 1;`).then(() => fg('demo playing (STYLE)', `__LW.setStyle(i % 2 ? 'cloud' : 'solid'); __LW.history.note();`));
  await g.run(`__LW.pause(); await __w(300); return 1;`);
  out.undo.demoModulation = await fg('demo modulation (addSource)', `__LW.mod.addSource('lfo');`);
  /* MOLECULES */
  out.chem = await g.run(`const c0 = window.confirm; window.confirm = () => true; await __LW.layout.projects.fresh(); window.confirm = c0; await __w(600);
    __LW.chem.setOn(true); for (let i = 0; i < 100 && !(__LW.orbitals.ladder && __LW.orbitals.ladder()); i++) await __w(100); await __w(600); return { bytes: __ser().length, on: __LW.chem.on };`);
  out.undo.chem = await fg('MOLECULES scene (STYLE)', `__LW.setStyle(i % 2 ? 'cloud' : 'solid'); __LW.history.note();`);
  /* the depth */
  out.depth = await g.run(`const H = __LW.history; H.clear('probe'); const first = __ser();
    for (let i = 1; i <= 61; i++) { __LW.setStage(i / 100); H.flush(); }
    const top = { depth: H.depth, rows: H.entries().length, bottom: H.entries()[0].label, limit: H.limit };
    const t0 = performance.now(); let undos = 0; while (H.undo()) undos++; const allUndoMs = performance.now() - t0;
    const bottomMix = __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix, startFellOff = __ser() !== first;
    while (H.redo()); const head = __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix;
    const jumped = H.goto(20), at20 = __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix;
    __LW.setStage(0.97); H.flush(); const truncated = H.entries().length;
    const back = H.historyUndo(), mixBack = __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix, rowsBack = H.entries().length, again = H.historyUndo();
    let bytes = 0; /* the ring's size, estimated from one row */ bytes = __ser().length * H.entries().length;
    return { top, undos, allUndoMs: +allUndoMs.toFixed(1), bottomMix, startFellOff, head, jumped, at20, truncated, back, mixBack, rowsBack, secondHistoryUndo: again, ringBytesApprox: bytes, errs: __e.slice() };`);
  console.log('depth', JSON.stringify(out.depth));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
async function fg(name, body) { const r = await g.run(`const H = __LW.history, ms = []; await __settle();
    for (let i = 0; i < 7; i++) { await (async () => { ${body} })(); await __w(20); H.flush(); const t0 = performance.now(); H.undo(); ms.push(performance.now() - t0); await __w(150); }
    return { family: ${JSON.stringify(name)}, med: __med(ms), max: __max(ms), all: ms.map((x) => +x.toFixed(1)) };`); console.log('undo', JSON.stringify(r)); return r; }
console.log(JSON.stringify({ flush: out.flush, bytes: { default: out.flush && out.flush.bytesDefault, dancer: out.dancer && out.dancer.bytes, chem: out.chem && out.chem.bytes }, undoMed: Object.fromEntries(Object.entries(out.undo || {}).map(([k, v]) => [k, v && v.med])), depth: out.depth, errs: out.errs, error: out.error }, null, 1));
