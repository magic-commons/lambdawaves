// ATTACK: the quick SAVE / LOAD road (restore() with no option — neither a project nor an undo): rows made by a LOAD press, and whether
// its undo / redo is byte-identical.
import { lab } from './kit.mjs';
const g = await lab();
try {
  const r = await g.run(`const H = __LW.history;
    __LW.setStage(0.2); __LW.setStyle('solid'); __LW.mod.addSource('lfo'); await __settle();
    const saveB = __trig('SAVE') || [...document.querySelectorAll('.trig')].find((e) => e.textContent.trim() === 'SAVE'); __show(saveB); await __spress(saveB); await __settle();
    const saved = __ser();
    __LW.setStage(0.6); __LW.setStyle('cloud'); await __settle(); H.clear('probe');
    const pre = __ser(), n0 = H.entries().length;
    const loadB = __trig('LOAD'); __show(loadB); await __spress(loadB); await __w(1500); const rowsNoFlush = __rows(); H.flush();
    const post = __ser(), rows = __rows();
    H.undo(); await __w(400); const u = __ser(); H.redo(); await __w(400); const rr = __ser();
    return { loadedEqualsSaved: post === saved, loadedDiff: post === saved ? [] : __diff(JSON.parse(saved), JSON.parse(post)).slice(0, 4), rowsNoFlush, rows, undoSame: u === pre, undoDiff: u === pre ? [] : __diff(JSON.parse(pre), JSON.parse(u)).slice(0, 4), redoSame: rr === post, errs: __e.slice() };`);
  console.log(JSON.stringify(r, null, 1));
} finally { await g.close(); }
