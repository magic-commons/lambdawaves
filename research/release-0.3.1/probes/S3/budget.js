/* S3 · THE COST BUDGET (BRIEF-S3 §4), measured in the real page.  Run through the probe runner:
 *   LW_PORT=8737 GD_PORT=5237 node research/release-0.3.1/probes/S3/ev.mjs research/release-0.3.1/probes/S3/budget.js
 * Three scenes — the default boot, WAVE DANCER (routes playing), MOLECULES on — each: bytes per row, the edit-scope read,
 * a flush after an edit, canUndo with an edit pending, one undo (median of 5), modulation-window rebuilds per undo, and
 * 5 s of play (rows added, edit-scope reads counted through chem.save, which every serialize() calls). */
const w = (n) => new Promise((r) => setTimeout(r, n));
const L = __LW, H = L.history, med = (a) => +a.slice().sort((x, y) => x - y)[a.length >> 1].toFixed(3);
const ser = () => JSON.stringify(L.serialize({ scope: 'edit' }));
const time = (f, n) => { f(); const a = []; for (let i = 0; i < n; i++) { const t0 = performance.now(); f(); a.push(performance.now() - t0); } return med(a); };
const rebuildsOf = async (fn) => {
  const run = document.querySelector('#modwin .m2run'), n = run.querySelectorAll('.m2dev').length; let removed = 0;
  const mo = new MutationObserver((rs) => { for (const r of rs) for (const x of r.removedNodes) if (x.classList && x.classList.contains('m2dev')) removed++; });
  mo.observe(run, { childList: true, subtree: true }); const t0 = performance.now(); fn(); const ms = performance.now() - t0; await w(0); mo.disconnect();
  return { ms: +ms.toFixed(2), rebuilds: removed / Math.max(1, n) };
};
async function measure(label, edit) {
  const out = { label };
  H.flush(); await w(450); H.flush();
  out.bytes = ser().length;
  out.serEditMs = time(() => L.serialize({ scope: 'edit' }), 40);
  out.serFullMs = time(() => L.serialize(), 10);
  out.liveKeyMs = time(() => { const j = JSON.stringify(L.serialize({ scope: 'edit' })); let h = 0x811c9dc5; for (let i = 0; i < j.length; i++) h = Math.imul(h ^ j.charCodeAt(i), 0x01000193); return h; }, 40);
  const flush = [], undo = [], redo = [];
  for (let i = 0; i < 9; i++) { edit(i); const t0 = performance.now(); H.flush(); flush.push(performance.now() - t0); }
  for (let i = 0; i < 5; i++) { const t0 = performance.now(); H.undo(); undo.push(performance.now() - t0); await w(60); }
  for (let i = 0; i < 5; i++) { const t0 = performance.now(); H.redo(); redo.push(performance.now() - t0); await w(60); }
  out.flushMs = med(flush); out.undoMs = med(undo); out.redoMs = med(redo);
  edit(99); out.canUndoPendingMs = +(() => { const t0 = performance.now(); void H.canUndo; return performance.now() - t0; })().toFixed(3); H.flush();
  L.layout.modulation.expand(); await w(300);
  edit(98); H.flush(); out.undoNonModulation = await rebuildsOf(() => H.undo()); H.redo(); await w(100);
  L.mod.addMacro(); H.flush();
  out.undoModulation = await rebuildsOf(() => H.undo()); H.redo(); await w(100);
  L.layout.modulation.collapse(); await w(200);
  H.flush(); await w(450); const n0 = H.entries().length;
  let reads = 0; const s0 = L.chem.save; L.chem.save = function () { reads++; return s0.apply(this, arguments); };
  L.play(); await w(5000); L.pause(); L.chem.save = s0; await w(600);
  out.play5s = { rows: H.entries().length - n0, editScopeReads: reads };
  out.errs = __e.slice();
  return out;
}
const R = { at: new Date().toISOString(), ua: navigator.userAgent, scenes: [] };
R.scenes.push(await measure('default boot', (i) => L.setStage(0.1 + (i % 50) / 100)));
const P = L.layout.projects, c0 = window.confirm; window.confirm = () => true;
const txt = await (await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' })).text(); P.open(P.importText(txt)); window.confirm = c0; await w(1500);
R.scenes.push(await measure('WAVE DANCER (LFO routes on exposure, softness, iso, fov, stage)', (i) => { L.setStyle(i % 2 ? 'solid' : 'glass'); H.note(); }));
L.chem.setOn(true); await w(2500); H.flush();
R.scenes.push(await measure('MOLECULES on (the demo, chem the field owner)', (i) => { L.setStyle(i % 2 ? 'solid' : 'glass'); H.note(); }));
/* the ring's worst case: sixty rows of the heaviest state here (A/B stores full, chem on, the demo's modulation) */
L.loadPreset('1s'); L.ab.storeA(); L.loadPreset('2p+'); L.ab.storeB(); await w(500); H.flush();
R.worst = { bytesPerRow: ser().length, rows: H.limit + 1 }; R.worst.ringBytes = R.worst.bytesPerRow * R.worst.rows;
R.errs = __e.slice();
return R;
