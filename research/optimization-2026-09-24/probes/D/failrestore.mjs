/* failrestore.mjs — F16: a project whose restore() throws half-way, opened through the real PROJECTS road.
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/failrestore.mjs
 * 1. find a malformed-but-importable payload (the import validator checks the envelope only) that makes restore() fail;
 * 2. import it, open it, and read: open()'s return, the status line, projects.current, projects.dirty, whether a
 *    rebuild ran, and what a plain SAVE (Ctrl+S = projects.save() onto `current`) then writes over the file. */
import { open } from '../../../../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || '8721'}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900 });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  console.log(JSON.stringify(await g.ev(`
    await __LW.settle();
    const good = JSON.parse(JSON.stringify(__LW.serialize()));
    const bad = {
      'readers.slice=5': (s) => { s.presentation.readers.slice = 5; },
      'instruments.qcd=5': (s) => { s.presentation.instruments.qcd = 5; },
      'layout=5': (s) => { s.presentation.layout = 5; },
      'palette.stops=[5]': (s) => { s.presentation.palette.stops = [5]; },
      'ab={a:{re:5}}': (s) => { s.presentation.ab = { a: { re: 5 } }; },
      'modulation={sources:5}': (s) => { s.presentation.modulation = { sources: 5 }; },
    };
    const results = {}; let pick = null;
    for (const [name, f] of Object.entries(bad)) {
      const s = JSON.parse(JSON.stringify(good)); f(s);
      const ok = __LW.restore(s); results[name] = ok;
      __LW.restore(JSON.parse(JSON.stringify(good)));
      if (ok === false && !pick) pick = name;
    }
    if (!pick) return { results, note: 'no candidate made restore() fail' };
    /* the real road: import → open, starting from a CLEAN, DIFFERENT state (preset 2pz) */
    __LW.loadPreset('2pz'); await __LW.settle(); __LW.layout.projects.markClean();
    const s = JSON.parse(JSON.stringify(good)); s.presentation.instruments.ladder = { nbar: 30, sigma: 2, d: 0, teeth: 8 }; bad[pick](s);
    const path = __LW.layout.projects.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/broken', data: s, notebook: { title: 'broken', text: 'the notes' } }));
    const stored0 = localStorage.getItem('lambdawaves.q0.projects').length;
    const r0 = __LW.stats.rebuilds;
    const opened = __LW.layout.projects.open(path);
    await __LW.settle(); await __LW.settle();
    const after = { opened, status: (document.querySelector('.pj-status') || {}).textContent, stateStatus: (document.querySelector('.dev[data-id="state"] .dev-stat') || {}).textContent,
      current: __LW.layout.projects.current, dirty: __LW.layout.projects.dirty, rebuildsAfterOpen: __LW.stats.rebuilds - r0,
      preset: __LW.reg.preset, populated: __LW.reg.populated().length };
    /* Ctrl+S: saves the half-applied state over the file */
    const before = JSON.stringify(JSON.parse(localStorage.getItem('lambdawaves.q0.projects')).items[path].data);
    const saved = __LW.layout.projects.save();
    const afterSave = JSON.stringify(JSON.parse(localStorage.getItem('lambdawaves.q0.projects')).items[path].data);
    return { results, pick, after, saveOverwrote: saved && before !== afterSave, errs: window.__e };`)));
} finally { await g.close(); }
