// ATTACK: `driven: rotDriving` (kept by the brief) is "any rotation rate ≠ 0", playing or not.  While it holds, does ANY edit make a row?
import { lab } from './kit.mjs';
const g = await lab();
try {
  const r = await g.run(`const H = __LW.history; await __settle(); H.clear('probe');
    __LW.setRotRate('z', 0.3); H.note('ROTATE z (api)'); await __w(600); H.flush();
    const a = { rate: __LW.rotRate.z, rows: __rows(), canUndo: H.canUndo, driving: __LW.rotDriving };
    __LW.setStage(0.37); H.note(); await __w(600); H.flush();
    const s = __show(document.querySelector('select[aria-label="palette"]')); s.value = [...s.options].map((o) => o.value).find((v) => v !== s.value); s.dispatchEvent(new Event('change', { bubbles: true })); await __w(600); H.flush();
    __LW.mod.addSource('lfo'); await __w(600); H.flush();
    const b = { rows: __rows(), canUndo: H.canUndo, undo: H.undo(), stageAfterUndo: __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix };
    __LW.setRotRate('z', 0); H.note(); await __w(600); H.flush();
    const c = { rows: __rows(), canUndo: H.canUndo };
    const undo1 = H.undo(); const d = { undo1, rate: __LW.rotRate.z, stage: __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix, sources: __LW.mod.model.sourceList().length, rows: __rows() };
    return { whileRateSet: a, editsWhileSet: b, afterRateZero: c, oneUndo: d, errs: __e.slice() };`);
  console.log(JSON.stringify(r, null, 1));
} finally { await g.close(); }
